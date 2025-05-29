const express = require('express');
const router = express.Router();
const db = require('../mqtt/db');

// ✅ POST: Receive Bluetooth sensor data
router.post('/api/data/bluetooth', (req, res) => {
  const { device_id, timestamp, temperature, humidity } = req.body;

  if (!device_id || !timestamp || temperature == null || humidity == null) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // ✅ Insert into bluetooth_data
  const insertAllSql = `
    INSERT INTO bluetooth_data (device_id, temperature, humidity, timestamp)
    VALUES (?, ?, ?, FROM_UNIXTIME(?))
  `;
  db.query(insertAllSql, [device_id, temperature, humidity, timestamp], (err) => {
    if (err) {
      console.error('Bluetooth insert error:', err);
      return res.status(500).json({ error: 'DB insert failed' });
    }
    console.log(`✅ Inserted into bluetooth_data for ${device_id}`);
  });

  // ✅ Check SLA breach
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
    const insertBreachSql = `
      INSERT INTO sla_breaches_bluetooth (device_id, timestamp, temperature, humidity, status)
      VALUES (?, FROM_UNIXTIME(?), ?, ?, ?)
    `;
    db.query(insertBreachSql, [
      device_id,
      timestamp,
      temperature,
      humidity,
      statusText.join(', ')
    ], (err) => {
      if (err) {
        console.error('SLA insert error:', err);
        return res.status(500).json({ error: 'SLA insert failed' });
      }
      console.log(`🔥 SLA breach logged for ${device_id}`);
    });
  }

  res.json({ message: 'Bluetooth data logged and SLA checked.' });
});

// ✅ GET: Return all SLA breaches
router.get('/api/breaches/bluetooth', (req, res) => {
  const sql = 'SELECT * FROM sla_breaches_bluetooth ORDER BY timestamp DESC';
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error.' });
    res.json(results);
  });
});

// ✅ GET: Return all Bluetooth sensor data for dashboard
router.get('/api/data/bluetooth', (req, res) => {
  const sql = 'SELECT * FROM bluetooth_data ORDER BY timestamp DESC';
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching Bluetooth data:', err);
      return res.status(500).json({ error: 'Failed to fetch data' });
    }
    res.json(results);
  });
});

module.exports = router;
