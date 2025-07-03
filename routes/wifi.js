
const express = require('express');
const router = express.Router();
const path = require('path');
const db = require('../mqtt/db');

router.get('/dashboard/wifi', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/dashboard-wifi.html'));
});

router.get('/api/data/wifi', (req, res) => {
  const query = `
    SELECT s.*, d.device_id
    FROM sensor_data s
    JOIN devices d ON s.device_id = d.id
    JOIN device_types t ON d.device_type_id = t.id
    WHERE t.type_name = 'wifi'
    ORDER BY s.timestamp DESC
    LIMIT 100
  `;
  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching wifi sensor data:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results);
  });
});

router.get('/api/breaches/wifi', (req, res) => {
  const query = `
    SELECT b.*, d.device_id
    FROM sla_breaches b
    JOIN devices d ON b.device_id = d.id
    JOIN device_types t ON d.device_type_id = t.id
    WHERE t.type_name = 'wifi'
    ORDER BY b.timestamp DESC
    LIMIT 100
  `;
  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching wifi SLA breaches:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results);
  });
});

module.exports = router;
