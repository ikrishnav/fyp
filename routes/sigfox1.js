const express = require('express');
const router = express.Router();
const path = require('path');
const db = require('../mqtt/db');


router.get('/dashboard/sigfox1', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/dashboard-sigfox1.html'));
});

// === NEW: Serve the filter page ===
router.get('/dashboard/sigfox1/filter', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/dashboard-sigfox1-filter.html'));
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
router.post('/api/sigfox1', (req, res) => {
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

  // SLA thresholds (edit these if needed)
  const TEMP_MAX = 32;
  const HUMIDITY_MAX = 70;

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

        // SLA breach check
        if (temperature > TEMP_MAX || humidity > HUMIDITY_MAX) {
          const breachStatus = [];
          if (temperature > TEMP_MAX) breachStatus.push('High Temp');
          if (humidity > HUMIDITY_MAX) breachStatus.push('High Humidity');
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
