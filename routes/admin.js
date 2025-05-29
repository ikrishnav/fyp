const express = require('express');
const router = express.Router();
const db = require('../mqtt/db');

// GET: Admin fetch all SLA breaches from all sources
router.get('/api/breaches/admin', (req, res) => {
  const sql = `
    SELECT device_id, timestamp, temperature, humidity, status, 'sigfox1' AS source FROM sla_breaches_sigfox1
    UNION ALL
    SELECT device_id, timestamp, temperature, humidity, status, 'sigfox2' AS source FROM sla_breaches_sigfox2
    UNION ALL
    SELECT device_id, timestamp, temperature, humidity, status, 'wifi' AS source FROM sla_breaches_wifi
    UNION ALL
    SELECT device_id, timestamp, temperature, humidity, status, 'bluetooth' AS source FROM sla_breaches_bluetooth
    ORDER BY timestamp DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching admin breaches:', err);
      return res.status(500).json({ error: 'Database error.' });
    }
    res.json(results);
  });
});

// GET: Admin fetch all normal sensor data from all sources
router.get('/api/data/admin', (req, res) => {
  const sql = `
    SELECT device_id, timestamp, temperature, humidity, 'sigfox1' AS source FROM sigfox1_data
    UNION ALL
    SELECT device_id, timestamp, temperature, humidity, 'sigfox2' AS source FROM sigfox2_data
    UNION ALL
    SELECT device_id, timestamp, temperature, humidity, 'wifi' AS source FROM wifi_data
    UNION ALL
    SELECT device_id, timestamp, temperature, humidity, 'bluetooth' AS source FROM bluetooth_data
    ORDER BY timestamp DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching admin sensor data:', err);
      return res.status(500).json({ error: 'Database error.' });
    }
    res.json(results);
  });
});

module.exports = router;
