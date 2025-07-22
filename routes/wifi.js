const express = require('express');
const router = express.Router();
const db = require('../mqtt/db');

// ✅ Fetch WiFi sensor data with place name
router.get('/api/data/wifi', (req, res) => {
  const query = `
    SELECT s.id, d.device_id, s.timestamp, s.temperature, s.humidity, s.place_name
    FROM sensor_data s
    JOIN devices d ON s.device_id = d.id
    JOIN device_types t ON d.device_type_id = t.id
    WHERE t.type_name = 'wifi'
    ORDER BY s.timestamp DESC
    LIMIT 100
  `;
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching WiFi data:', err);
      return res.status(500).send('DB Error');
    }
    res.json(results);
  });
});

// ✅ Get SLA Breaches for Wi-Fi
router.get('/api/breaches/wifi', (req, res) => {
  const query = `
    SELECT d.device_id, s.timestamp, s.temperature, s.humidity,
           CASE
             WHEN s.temperature > 33 THEN 'High Temperature'
             WHEN s.temperature < 22 THEN 'Low Temperature'
             WHEN s.humidity > 70 THEN 'High Humidity'
             WHEN s.humidity < 45 THEN 'Low Humidity'
             ELSE 'Unknown'
           END AS status
    FROM sensor_data s
    JOIN devices d ON s.device_id = d.id
    JOIN device_types t ON d.device_type_id = t.id
    WHERE t.type_name = 'wifi' AND (
      s.temperature > 28 OR s.temperature < 22 OR s.humidity > 70 OR s.humidity < 45
    )
    ORDER BY s.timestamp DESC
    LIMIT 100
  `;
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching WiFi SLA breaches:', err);
      return res.status(500).send('DB Error');
    }
    res.json(results);
  });
});

// ✅ Get all location entries
router.get('/api/locations', (req, res) => {
  db.query('SELECT * FROM locations ORDER BY name', (err, results) => {
    if (err) {
      console.error('Error fetching locations:', err);
      return res.status(500).send('DB Error');
    }
    res.json(results);
  });
});

// ✅ Add a new location entry manually
router.post('/api/locations', (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).send('Name required');
  db.query(
    'INSERT INTO locations (name, description) VALUES (?, ?)',
    [name, description || null],
    (err, result) => {
      if (err) {
        console.error('Error adding location:', err);
        return res.status(500).send('DB Insert Error');
      }
      res.status(201).send({ id: result.insertId });
    }
  );
});

// ✅ Receive WiFi sensor data (supports SLA and place_name)
router.post('/api/data/wifi', (req, res) => {
  const { device_id, timestamp, temperature, humidity, place_name } = req.body;

  if (!device_id || !timestamp || temperature === undefined || humidity === undefined) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const getDeviceQuery = `SELECT id FROM devices WHERE device_id = ?`;
  db.query(getDeviceQuery, [device_id], (err, deviceResult) => {
    if (err) {
      console.error("Error fetching device ID:", err);
      return res.status(500).json({ error: "DB error" });
    }

    let deviceDbId;

    if (deviceResult.length > 0) {
      deviceDbId = deviceResult[0].id;
      insertSensorData(deviceDbId);
    } else {
      const insertDevice = `
        INSERT INTO devices (device_id, device_type_id)
        VALUES (?, (SELECT id FROM device_types WHERE type_name = 'wifi'))
      `;
      db.query(insertDevice, [device_id], (err, insertResult) => {
        if (err) {
          console.error("Error inserting device:", err);
          return res.status(500).json({ error: "Insert device error" });
        }
        deviceDbId = insertResult.insertId;
        insertSensorData(deviceDbId);
      });
    }

    function insertSensorData(deviceDbId) {
      const insertSensorQuery = `
        INSERT INTO sensor_data (device_id, timestamp, temperature, humidity, place_name)
        VALUES (?, FROM_UNIXTIME(?), ?, ?, ?)
      `;
      db.query(insertSensorQuery, [deviceDbId, timestamp, temperature, humidity, place_name || null], (err) => {
        if (err) {
          console.error("Error inserting sensor data:", err);
          return res.status(500).json({ error: "Insert sensor data error" });
        }

        let breachStatus = [];
        if (temperature > 28) breachStatus.push("High Temperature");
        if (temperature < 22) breachStatus.push("Low Temperature");
        if (humidity > 70) breachStatus.push("High Humidity");
        if (humidity < 45) breachStatus.push("Low Humidity");

        if (breachStatus.length) {
          const statusText = breachStatus.join(' & ');
          const insertBreach = `
            INSERT INTO sla_breaches (device_id, timestamp, temperature, humidity, status)
            VALUES (?, FROM_UNIXTIME(?), ?, ?, ?)
          `;
          db.query(insertBreach, [deviceDbId, timestamp, temperature, humidity, statusText], (err) => {
            if (err) {
              console.error("Error inserting SLA breach:", err);
            }
          });
        }

        return res.status(201).json({ success: true });
      });
    }
  });
});

// ✅ PATCH route to update place name for a reading
router.patch('/api/data/wifi/:id/place', (req, res) => {
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
