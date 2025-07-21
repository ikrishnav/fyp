const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');

// Create a connection pool (better than creating a new connection every time)
const pool = mysql.createPool({
  host: 'localhost',
  user: 'your_mysql_user',
  password: 'your_mysql_password',
  database: 'iot_dashboard',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// GET thresholds for a device type
router.get('/thresholds/:device_type', async (req, res) => {
  const deviceType = req.params.device_type;
  try {
    const [rows] = await pool.query(
      'SELECT temp_min AS TEMP_MIN, temp_max AS TEMP_MAX, hum_min AS HUM_MIN, hum_max AS HUM_MAX FROM sla_thresholds WHERE device_type = ?',
      [deviceType]
    );
    if (rows.length > 0) {
      res.json(rows[0]);
    } else {
      // Return default if not set in DB
      res.json({ TEMP_MIN: 18, TEMP_MAX: 27, HUM_MIN: 45, HUM_MAX: 60 });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// PATCH/POST to update thresholds for a device type
router.patch('/thresholds/:device_type', async (req, res) => {
  const deviceType = req.params.device_type;
  const { TEMP_MIN, TEMP_MAX, HUM_MIN, HUM_MAX } = req.body;
  try {
    // Upsert: if exists, update; else insert
    await pool.query(
      `INSERT INTO sla_thresholds (device_type, temp_min, temp_max, hum_min, hum_max)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE temp_min=VALUES(temp_min), temp_max=VALUES(temp_max),
                               hum_min=VALUES(hum_min), hum_max=VALUES(hum_max)`,
      [deviceType, TEMP_MIN, TEMP_MAX, HUM_MIN, HUM_MAX]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;
