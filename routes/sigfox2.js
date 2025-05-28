const express = require('express');
const router = express.Router();
const db = require('../db');

// POST: Receive data from Sigfox backend callback
router.post('/api/data/sigfox2', (req, res) => {
  const { device, time, data } = req.body;

  if (!device || !time || !data || data.length !== 4) {
    return res.status(400).json({ error: 'Invalid Sigfox payload' });
  }

  // Decode payload: 2 bytes = 1 byte temp (x2) + 1 byte humidity
  const tempHex = data.substring(0, 2);
  const humHex = data.substring(2, 4);

  const temperature = parseInt(tempHex, 16) / 2;
  const humidity = parseInt(humHex, 16);
  const timestamp = new Date(time * 1000);

  // Insert into sigfox1_data
  const insertDataSql = `
    INSERT INTO sigfox2_data (device_id, temperature, humidity, timestamp)
    VALUES (?, ?, ?, ?)
  `;
  db.query(insertDataSql, [device, temperature, humidity, timestamp], (err) => {
    if (err) {
      console.error('Error inserting into sigfox2_data:', err);
      return res.status(500).json({ error: 'Insert failed' });
    }

    // Check for SLA breach
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
        INSERT INTO sla_breaches_sigfox1 (device_id, timestamp, temperature, humidity, status)
        VALUES (?, ?, ?, ?, ?)
      `;
      db.query(insertBreachSql, [device, timestamp, temperature, humidity, statusText.join(', ')], (err) => {
        if (err) console.error('Error inserting breach for sigfox1:', err);
      });
    }

    console.log(`✅ Logged Sigfox2 data for ${device}`);
    res.json({ message: 'Sigfox2 data received and processed.' });
  });
});

// GET: Breaches for dashboard
router.get('/api/breaches/sigfox2', (req, res) => {
  const sql = 'SELECT * FROM sla_breaches_sigfox1 ORDER BY timestamp DESC';
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error.' });
    res.json(results);
  });
});

module.exports = router;
// 