const express = require('express');
const router = express.Router();
const path = require('path');
const db = require('../mqtt/db');

// --- MySQL-based Threshold Helpers ---

// Get thresholds for a device type
function getThresholdsFromDB(deviceType) {
  return new Promise((resolve, reject) => {
    db.query(
      'SELECT temp_min, temp_max, hum_min, hum_max FROM sla_thresholds WHERE device_type = ? LIMIT 1',
      [deviceType],
      (err, rows) => {
        if (err || rows.length === 0) return resolve({ TEMP_MIN: 18, TEMP_MAX: 27, HUM_MIN: 45, HUM_MAX: 60 });
        const t = rows[0];
        resolve({ TEMP_MIN: t.temp_min, TEMP_MAX: t.temp_max, HUM_MIN: t.hum_min, HUM_MAX: t.hum_max });
      }
    );
  });
}

// Set thresholds for a device type
function setThresholdsToDB(deviceType, TEMP_MIN, TEMP_MAX, HUM_MIN, HUM_MAX) {
  return new Promise((resolve, reject) => {
    db.query(
      `INSERT INTO sla_thresholds (device_type, temp_min, temp_max, hum_min, hum_max)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE temp_min=?, temp_max=?, hum_min=?, hum_max=?`,
      [deviceType, TEMP_MIN, TEMP_MAX, HUM_MIN, HUM_MAX, TEMP_MIN, TEMP_MAX, HUM_MIN, HUM_MAX],
      (err, result) => {
        if (err) return reject(err);
        resolve(true);
      }
    );
  });
}

// ------------------ ROUTES ----------------------

router.get('/dashboard/sigfox1', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/dashboard-sigfox1.html'));
});
router.get('/dashboard/sigfox1/filter', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/dashboard-sigfox1-filter.html'));
});
router.get('/dashboard/sla-threshold.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/sla-threshold.html'));
});

// --- Sensor data for Sigfox 1 (now also returns place_name) ---
router.get('/api/data/sigfox1', (req, res) => {
  const query = `
    SELECT s.id, d.device_id, s.timestamp, s.temperature, s.humidity, s.place_name
    FROM sensor_data s
    JOIN devices d ON s.device_id = d.id
    JOIN device_types t ON d.device_type_id = t.id
    WHERE t.type_name = 'sigfox1'
    ORDER BY s.timestamp DESC
    LIMIT 100
  `;
  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching sigfox1 sensor data:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results);
  });
});

// --- SLA breach table (no changes) ---
router.get('/api/breaches/sigfox1', (req, res) => {
  const query = `
    SELECT b.*, d.device_id
    FROM sla_breaches b
    JOIN devices d ON b.device_id = d.id
    JOIN device_types t ON d.device_type_id = t.id
    WHERE t.type_name = 'sigfox1'
    ORDER BY b.timestamp DESC
    LIMIT 100
  `;
  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching sigfox1 SLA breaches:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results);
  });
});

// --- Get current thresholds for frontend (MYSQL version) ---
router.get('/api/sla/thresholds/:deviceType', async (req, res) => {
  const deviceType = req.params.deviceType;
  const thresholds = await getThresholdsFromDB(deviceType);
  res.json(thresholds);
});

// --- PATCH thresholds (MYSQL version) and re-sync breaches ---
router.patch('/api/sla/thresholds/:deviceType', async (req, res) => {
  const deviceType = req.params.deviceType;
  const { TEMP_MIN, TEMP_MAX, HUM_MIN, HUM_MAX } = req.body;
  if (
    TEMP_MIN == null ||
    TEMP_MAX == null ||
    HUM_MIN == null ||
    HUM_MAX == null
  ) {
    return res.status(400).json({ error: "Missing fields" });
  }
  try {
    await setThresholdsToDB(deviceType, TEMP_MIN, TEMP_MAX, HUM_MIN, HUM_MAX);

    // Delete old breaches for this device type
    db.query(
      `DELETE b FROM sla_breaches b
       JOIN devices d ON b.device_id = d.id
       JOIN device_types t ON d.device_type_id = t.id
       WHERE t.type_name = ?`, [deviceType], (err) => {
        if (err) {
          console.error("Error deleting old breaches:", err);
          return res.status(500).json({ error: "Failed to delete old breaches" });
        }

        // Get recent readings and insert new breaches if needed
        db.query(
          `SELECT s.*, d.id as device_dbid FROM sensor_data s
           JOIN devices d ON s.device_id = d.id
           JOIN device_types t ON d.device_type_id = t.id
           WHERE t.type_name = ?
           ORDER BY s.timestamp DESC LIMIT 100`, [deviceType], async (err2, rows) => {
            if (err2) {
              console.error("Error fetching sensor data:", err2);
              return res.status(500).json({ error: "Failed to recalculate breaches" });
            }

            // Filter for breaches and insert
            let breaches = [];
            rows.forEach(r => {
              const t = Number(r.temperature), h = Number(r.humidity);
              let status = [];
              if (t > TEMP_MAX) status.push('High Temp');
              if (t < TEMP_MIN) status.push('Low Temp');
              if (h > HUM_MAX) status.push('High Humidity');
              if (h < HUM_MIN) status.push('Low Humidity');
              if (status.length) {
                breaches.push([
                  r.device_dbid,
                  r.timestamp,
                  t,
                  h,
                  status.join(' & ')
                ]);
              }
            });
            if (!breaches.length) return res.json({ success: true, recalculated: 0 });

            // Bulk insert new breaches
            const vals = breaches.map(b => `(${db.escape(b[0])},${db.escape(b[1])},${db.escape(b[2])},${db.escape(b[3])},${db.escape(b[4])})`).join(",");
            db.query(
              `INSERT INTO sla_breaches (device_id, timestamp, temperature, humidity, status) VALUES ${vals}`,
              (err3) => {
                if (err3) {
                  console.error("Bulk insert breaches failed:", err3);
                  return res.status(500).json({ error: "Bulk insert failed" });
                }
                res.json({ success: true, recalculated: breaches.length });
              }
            );
          }
        );
      }
    );
  } catch (e) {
    console.error("Error saving thresholds to DB:", e);
    return res.status(500).json({ error: "Failed to save thresholds" });
  }
});

// --- POST: Insert Sigfox 1 data (uses dynamic thresholds!) ---
router.post('/api/sigfox1', async (req, res) => {
  let { device_id, data } = req.body;  // device_id and data (e.g. "4E35")
  if (!device_id || !data || data.length !== 4) {
    return res.status(400).json({ error: "Missing or invalid fields" });
  }

  // Convert hex to decimal
  const tempHex = data.substring(0, 2);
  const humHex = data.substring(2, 4);
  const temperature = parseInt(tempHex, 16); // e.g. "4E" => 78
  const humidity = parseInt(humHex, 16);     // e.g. "35" => 53

  const timestamp = new Date();
  const created_date = new Date();

  // Get dynamic thresholds from DB
  const thresholds = await getThresholdsFromDB('sigfox1');

  // Find device numeric id
  db.query('SELECT id FROM devices WHERE device_id = ?', [device_id], (err, rows) => {
    if (err || rows.length === 0) {
      return res.status(404).json({ error: "Device not found" });
    }
    const devId = rows[0].id;

    // Insert into sensor_data table
    db.query(
      `INSERT INTO sensor_data 
        (device_id, temperature, humidity, timestamp, created_date) 
       VALUES (?, ?, ?, ?, ?)`,
      [devId, temperature, humidity, timestamp, created_date],
      (err, result) => {
        if (err) {
          console.error("Insert error:", err);
          return res.status(500).json({ error: "Insert failed" });
        }

        // SLA breach check (dynamic, using MySQL thresholds)
        let breachStatus = [];
        if (temperature > thresholds.TEMP_MAX) breachStatus.push('High Temp');
        if (temperature < thresholds.TEMP_MIN) breachStatus.push('Low Temp');
        if (humidity > thresholds.HUM_MAX) breachStatus.push('High Humidity');
        if (humidity < thresholds.HUM_MIN) breachStatus.push('Low Humidity');
        if (breachStatus.length) {
          const statusText = breachStatus.join(' & ');
          db.query(
            `INSERT INTO sla_breaches (device_id, timestamp, temperature, humidity, status)
             VALUES (?, ?, ?, ?, ?)`,
            [devId, timestamp, temperature, humidity, statusText],
            (err2) => {
              if (err2) {
                console.error("Insert SLA breach error:", err2);
              }
              // Continue as normal regardless of SLA breach insert error
            }
          );
        }

        res.json({ success: true, id: result.insertId });
      }
    );
  });
});

// --- PATCH place name for a reading ---
router.patch('/api/data/sigfox1/:id/place', (req, res) => {
  const { id } = req.params;
  const { place_name } = req.body;
  if (!place_name) {
    return res.status(400).json({ error: "Missing place_name" });
  }
  db.query(
    `UPDATE sensor_data SET place_name = ? WHERE id = ?`,
    [place_name, id],
    (err) => {
      if (err) {
        console.error("Error updating place name:", err);
        return res.status(500).json({ error: "DB update error" });
      }
      res.json({ success: true });
    }
  );
});

module.exports = router;
