const express = require('express');
const router = express.Router();
const path = require('path');
const db = require('../mqtt/db');

router.get('/dashboard/sigfox1', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/dashboard-sigfox1.html'));
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
