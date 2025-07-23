const express = require('express');
const router = express.Router();
const path = require('path');
const db = require('../mqtt/db');

// Serve Sigfox 2 dashboard HTML
router.get('/dashboard/sigfox2', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/dashboard-sigfox2.html'));
});

// --- Sensor data for Sigfox 2 (returns place_name too) ---
router.get('/api/data/sigfox2', (req, res) => {
  const query = `
    SELECT s.id, d.device_id, s.timestamp, s.temperature, s.humidity, s.place_name
    FROM sensor_data s
    JOIN devices d ON s.device_id = d.id
    JOIN device_types t ON d.device_type_id = t.id
    WHERE t.type_name = 'sigfox2'
    ORDER BY s.timestamp DESC
    LIMIT 100
  `;
  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching sigfox2 sensor data:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results);
  });
});

// --- SLA breach table ---
router.get('/api/breaches/sigfox2', (req, res) => {
  const query = `
    SELECT b.*, d.device_id
    FROM sla_breaches b
    JOIN devices d ON b.device_id = d.id
    JOIN device_types t ON d.device_type_id = t.id
    WHERE t.type_name = 'sigfox2'
    ORDER BY b.timestamp DESC
    LIMIT 100
  `;
  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching sigfox2 SLA breaches:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results);
  });
});

// --- POST sensor data for Sigfox 2 with SLA breach logic ---
router.post('/api/sigfox2', (req, res) => {
  let { device_id, data } = req.body; // device_id and data (e.g. "4E35")
  if (!device_id || !data || data.length !== 4) {
    return res.status(400).json({ error: "Missing or invalid fields" });
  }

  // Convert hex to decimal
  const tempHex = data.substring(0, 2);
  const humHex = data.substring(2, 4);
  const temperature = parseInt(tempHex, 16);
  const humidity = parseInt(humHex, 16);

  const timestamp = new Date();
  const created_date = new Date();

  // --- Singapore MRT recommended SLA thresholds ---
  const TEMP_MIN = 23, TEMP_MAX = 27;
  const HUM_MIN = 45, HUM_MAX = 70;

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

        // --- SLA Breach Check and Insert ---
        let breachStatus = [];
        if (temperature > TEMP_MAX) breachStatus.push('High Temperature');
        if (temperature < TEMP_MIN) breachStatus.push('Low Temperature');
        if (humidity > HUM_MAX) breachStatus.push('High Humidity');
        if (humidity < HUM_MIN) breachStatus.push('Low Humidity');

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
              // Don't block success on breach error
            }
          );
        }

        res.json({ success: true, id: result.insertId });
      }
    );
  });
});

// --- PATCH place name for a reading ---
router.patch('/api/data/sigfox2/:id/place', (req, res) => {
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
