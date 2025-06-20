const express = require('express');
const router = express.Router();
const db = require('../mqtt/db');

router.post('/api/data/wifi', (req, res) => {
  const { device_id, timestamp, temperature, humidity } = req.body;

  if (!device_id || !timestamp || temperature == null || humidity == null) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const insertData = `
    INSERT INTO wifi_data (device_id, temperature, humidity, timestamp)
    VALUES (?, ?, ?, FROM_UNIXTIME(?))
  `;
  db.query(insertData, [device_id, temperature, humidity, timestamp], (err) => {
    if (err) {
      console.error('wifi_data insert error:', err);
      return res.status(500).json({ error: 'wifi_data insert failed' });
    }
    console.log(`✅ Inserted into wifi_data for ${device_id}`);
  });

  let breached = false;
  let statusText = [];

  if (temperature > 40) {
    breached = true;
    statusText.push('High Temp');
  }
  if (humidity > 90) {
    breached = true;
    statusText.push('High Humidity');
  }

  if (breached) {
    const insertBreach = `
      INSERT INTO sla_breaches_wifi (device_id, timestamp, temperature, humidity, status)
      VALUES (?, FROM_UNIXTIME(?), ?, ?, ?)
    `;
    db.query(insertBreach, [device_id, timestamp, temperature, humidity, statusText.join(', ')], (err) => {
      if (err) {
        console.error('sla_breaches_wifi insert error:', err);
      } else {
        console.log(`🔥 SLA breach logged for ${device_id}`);
      }
    });
  }

  res.json({ message: 'Wi-Fi data logged and SLA checked.' });
});

router.get('/api/data/wifi', (req, res) => {
  const sql = 'SELECT * FROM wifi_data ORDER BY timestamp ASC';
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error.' });
    res.json(results);
  });
});

router.get('/api/breaches/wifi', (req, res) => {
  const sql = 'SELECT * FROM sla_breaches_wifi ORDER BY timestamp DESC';
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error.' });
    res.json(results);
  });
});

module.exports = router;
//