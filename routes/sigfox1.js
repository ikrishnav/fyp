const express = require('express');
const router = express.Router();
const db = require('../db');

// POST: Handle Sigfox callback (URL-encoded)
// GET: Return all Sigfox1 sensor data (not just breaches)
router.get('/api/data/sigfox1', (req, res) => {
  const sql = 'SELECT * FROM sigfox1_data ORDER BY timestamp ASC';
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error.' });
    res.json(results);
  });
});

module.exports = router;
// GET: Return SLA breach data
router.get('/api/breaches/sigfox1', (req, res) => {
  const sql = 'SELECT * FROM sla_breaches_sigfox1 ORDER BY timestamp ASC';
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error.' });
    res.json(results);
  });
});


router.post('/api/sigfox1', (req, res) => {
  const { device, data, time } = req.body;

  if (!device || !data || !time) {
    return res.status(400).json({ error: 'Missing fields from Sigfox callback' });
  }

  // Parse temp and humidity from payload (first byte = temp * 2, second byte = humidity)
  const hexTemp = data.substring(0, 2);
  const hexHum = data.substring(2, 4);
  const temp = parseInt(hexTemp, 16) / 2;
  const hum = parseInt(hexHum, 16);

  const timestamp = new Date(parseInt(time) * 1000);

  // Insert into main table
  const insertDataSql = `
    INSERT INTO sigfox1_data (device_id, temperature, humidity, timestamp)
    VALUES (?, ?, ?, ?)
  `;
  db.query(insertDataSql, [device, temp, hum, timestamp], (err) => {
    if (err) {
      console.error('Insert error:', err);
      return res.status(500).json({ error: 'DB error' });
    }
    console.log(`✅ Data logged for ${device}: ${temp}°C / ${hum}%`);
  });

  // Check SLA breach
  let statusText = [];
  if (temp > 40) statusText.push('High Temp');
  if (hum > 90) statusText.push('High Humidity');

  if (statusText.length > 0) {
    const insertBreachSql = `
      INSERT INTO sla_breaches_sigfox1 (device_id, timestamp, temperature, humidity, status)
      VALUES (?, ?, ?, ?, ?)
    `;
    db.query(insertBreachSql, [device, timestamp, temp, hum, statusText.join(', ')], (err) => {
      if (err) console.error('SLA insert error:', err);
    });
  }

  res.status(200).send('Sigfox1 data processed');
});

module.exports = router;
