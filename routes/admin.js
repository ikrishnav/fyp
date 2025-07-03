
const express = require('express');
const router = express.Router();
const db = require('../mqtt/db');

router.get('/dashboard/admin', (req, res) => {
  const query = `
    SELECT s.*, d.device_id, d.name AS device_name, t.type_name
    FROM sensor_data s
    JOIN devices d ON s.device_id = d.id
    JOIN device_types t ON d.device_type_id = t.id
    ORDER BY s.timestamp DESC
    LIMIT 500
  `;
  db.query(query, (err, results) => {
    if (err) {
      console.error('Admin dashboard error:', err);
      return res.status(500).send('Database error');
    }
    res.render('dashboard-admin.ejs', { data: results });
  });
});

module.exports = router;
