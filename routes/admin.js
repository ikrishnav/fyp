const express = require('express');
const router = express.Router();
const db = require('../mqtt/db');
const path = require('path');

// Admin Control Panel
router.get('/dashboard/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/dashboard-admin-panel.html'));
});

// Sensor Readings Dashboard (HTML)
router.get('/dashboard/admin/readings', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/dashboard-admin.html'));
});

// User Management Dashboard (HTML)
router.get('/dashboard/admin/users', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/dashboard-admin-users.html'));
});

// ---- APIs ---- //

// /api/data/admin (for readings)
router.get('/api/data/admin', (req, res) => {
  const query = `
    SELECT 
      s.id, d.device_id, s.timestamp, s.temperature, s.humidity, s.place_name,
      t.type_name AS source
    FROM sensor_data s
    JOIN devices d ON s.device_id = d.id
    JOIN device_types t ON d.device_type_id = t.id
    ORDER BY s.timestamp DESC
    LIMIT 500
  `;
  db.query(query, (err, results) => {
    if (err) return res.status(500).send([]);
    res.json(results);
  });
});

// /api/breaches/admin (for breaches)
router.get('/api/breaches/admin', (req, res) => {
  const query = `
    SELECT 
      s.id, d.device_id, s.timestamp, s.temperature, s.humidity, s.place_name,
      t.type_name AS source,
      sb.status
    FROM sla_breaches sb
    JOIN sensor_data s ON sb.device_id = s.device_id AND sb.timestamp = s.timestamp
    JOIN devices d ON s.device_id = d.id
    JOIN device_types t ON d.device_type_id = t.id
    ORDER BY s.timestamp DESC
    LIMIT 500
  `;
  db.query(query, (err, results) => {
    if (err) return res.status(500).send([]);
    res.json(results);
  });
});

// API for user management table
router.get('/api/users/admin', (req, res) => {
  db.query(`SELECT id, email, role, is_active FROM users WHERE role != 'admin'`, (err, users) => {
    if (err) return res.status(500).json([]);
    res.json(users);
  });
});

// Add user (AJAX)
router.post('/dashboard/admin/users/add', (req, res) => {
  const { email, password, role } = req.body;
  if (!email || !password || !role) return res.status(400).json({ error: 'Missing fields' });
  db.query(
    'INSERT INTO users (email, password, role) VALUES (?, ?, ?)',
    [email, password, role],
    (err, result) => {
      if (err) return res.status(500).json({ error: 'Could not add user. Email might already exist.' });
      res.json({ success: true, id: result.insertId });
    }
  );
});

// Delete user
router.post('/dashboard/admin/users/:id/delete', (req, res) => {
  db.query('DELETE FROM users WHERE id = ?', [req.params.id], err => {
    if (err) return res.status(500).json({ error: 'Could not delete user.' });
    res.json({ success: true });
  });
});

// Toggle active/inactive
router.post('/dashboard/admin/users/:id/toggle', (req, res) => {
  db.query('UPDATE users SET is_active = NOT is_active WHERE id = ?', [req.params.id], err => {
    if (err) return res.status(500).json({ error: 'Could not toggle user.' });
    res.json({ success: true });
  });
});

// Remove a reading by ID
router.post('/dashboard/admin/readings/:id/delete', (req, res) => {
  const id = req.params.id;
  db.query('DELETE FROM sensor_data WHERE id = ?', [id], err => {
    if (err) return res.status(500).send('DB Error');
    res.json({ success: true });
  });
});

// Edit/update a reading by ID (AJAX PATCH)
router.patch('/dashboard/admin/readings/:id', (req, res) => {
  const id = req.params.id;
  const { temperature, humidity, place_name } = req.body;
  db.query(
    'UPDATE sensor_data SET temperature=?, humidity=?, place_name=? WHERE id=?',
    [temperature, humidity, place_name, id],
    err => {
      if (err) return res.status(500).send('DB Error');
      res.json({ success: true });
    }
  );
});

module.exports = router;
