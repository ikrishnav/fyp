const express = require('express');
const router = express.Router();
const path = require('path');
const db = require('../mqtt/db');

router.get('/dashboard/bluetooth', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/dashboard-bluetooth.html'));
});

router.get('/api/data/bluetooth', (req, res) => {
  const query = `
    SELECT s.*, d.device_id
    FROM sensor_data s
    JOIN devices d ON s.device_id = d.id
    JOIN device_types t ON d.device_type_id = t.id
    WHERE t.type_name = 'bluetooth'
    ORDER BY s.timestamp DESC
    LIMIT 100
  `;
  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching Bluetooth sensor data:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results);
  });
});

router.get('/api/breaches/bluetooth', (req, res) => {
  const query = `
    SELECT 
      b.*, 
      d.device_id,
      CASE 
        WHEN b.temperature > 27 THEN 'High Temperature'
        WHEN b.temperature < 22 THEN 'Low Temperature'
        WHEN b.humidity > 65 THEN 'High Humidity'
        WHEN b.humidity < 45 THEN 'Low Humidity'
        ELSE 'OK'
      END AS breach_reason
    FROM sla_breaches b
    JOIN devices d ON b.device_id = d.id
    JOIN device_types t ON d.device_type_id = t.id
    WHERE t.type_name = 'bluetooth'
    ORDER BY b.timestamp DESC
    LIMIT 100
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching Bluetooth SLA breaches:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results);
  });
});


// POST data from BLE device
router.post('/api/data/bluetooth', (req, res) => {
  const { device_id, timestamp, temperature, humidity } = req.body;

  if (!device_id || !timestamp || temperature === undefined || humidity === undefined) {
    return res.status(400).json({ error: "Missing fields" });
  }

  // Find or insert device ID
  const getDeviceQuery = `SELECT id FROM devices WHERE device_id = ?`;
  db.query(getDeviceQuery, [device_id], (err, deviceResult) => {
    if (err) {
      console.error("Error finding device:", err);
      return res.status(500).json({ error: "DB error" });
    }

    let deviceDbId;

    if (deviceResult.length > 0) {
      deviceDbId = deviceResult[0].id;
      insertSensorData(deviceDbId);
    } else {
      const insertDevice = `
        INSERT INTO devices (device_id, device_type_id)
        VALUES (?, (SELECT id FROM device_types WHERE type_name = 'bluetooth'))
      `;
      db.query(insertDevice, [device_id], (err, insertResult) => {
        if (err) {
          console.error("Error inserting new device:", err);
          return res.status(500).json({ error: "Device insert error" });
        }
        deviceDbId = insertResult.insertId;
        insertSensorData(deviceDbId);
      });
    }

    // ✅ Keep this function inside the POST route, not inside the if/else
    function insertSensorData(deviceDbId) {
      const insertQuery = `
        INSERT INTO sensor_data (device_id, timestamp, temperature, humidity)
        VALUES (?, FROM_UNIXTIME(?), ?, ?)
      `;
      db.query(insertQuery, [deviceDbId, timestamp, temperature, humidity], (err) => {
        if (err) {
          console.error("Error inserting sensor data:", err);
          return res.status(500).json({ error: "Sensor insert error" });
        }

        // SLA breach logic
        let status = null;
        let breach_type = null;

        if (temperature > 50) {
          status = "High Temp";
          breach_type = "Temperature";
        } else if (humidity > 90) {
          status = "High Humidity";
          breach_type = "Humidity";
        } else if (humidity < 10) {
          status = "Low Humidity";
          breach_type = "Humidity";
        }

        if (status) {
          const insertBreachQuery = `
            INSERT INTO sla_breaches (device_id, timestamp, temperature, humidity, status, breach_type)
            VALUES (?, FROM_UNIXTIME(?), ?, ?, ?, ?)
          `;
          db.query(insertBreachQuery, [deviceDbId, timestamp, temperature, humidity, status, breach_type], (err) => {
            if (err) {
              console.error("Error inserting SLA breach:", err);
            }
          });
        }

        res.status(201).json({ success: true });
      });
    }
  });// End of getDeviceQuery callback
});
// PATCH: Update place name for a reading
router.patch('/api/data/bluetooth/:id/place', (req, res) => {
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
