const express = require('express');
const router = express.Router();
const mysql = require('mysql2');
const path = require('path');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');

const db = mysql.createConnection({
  host: 'mysql', // 🚨 This must match the service name in docker-compose.yml
  user: 'root',
  password: '', // Ensure this matches MYSQL_ROOT_PASSWORD
  database: 'iot_dashboard'
});


// Serve login page
router.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/login.html'));
});

// Login API
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'All fields are required.' });
  }

  const sql = 'SELECT * FROM users WHERE email = ?';
  db.query(sql, [email], async (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Database error.' });
    if (results.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid username or password.' });
    }

    const user = results[0];

    // ✅ If passwords are hashed in DB, use this:
    // const match = await bcrypt.compare(password, user.password);
    // if (!match) return res.status(401).json({ success: false, message: 'Invalid username or password.' });

    // ❗ If passwords are plaintext (for dev only), use this:
    if (password !== user.password) {
      return res.status(401).json({ success: false, message: 'Invalid username or password.' });
    }

    // Save user session
    req.session.user = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    res.json({ success: true, role: user.role });
  });
});

// Forgot password page
router.get('/forgot', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/forgot.html'));
});

// Send OTP email
router.post('/send-otp', (req, res) => {
  const { email } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000);

  db.query('UPDATE users SET otp = ? WHERE email = ?', [otp, email], (err) => {
    if (err) return res.status(500).send('Database error');

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'krishnavijayan189@gmail.com',
        pass: 'ujds fdjb exnt ojjy'
      }
    });

    const mailOptions = {
      from: 'krishnavijayan189@gmail.com',
      to: email,
      subject: 'Password Reset OTP',
      text: `Your OTP for password reset is: ${otp}`
    };

    transporter.sendMail(mailOptions, (error) => {
      if (error) return res.status(500).send('Email error');
      res.redirect(`/views/reset.html?email=${email}`);
    });
  });
});

// Reset password
router.post('/reset-password', (req, res) => {
  const { email, otp, new_password } = req.body;

  db.query('SELECT otp FROM users WHERE email = ?', [email], (err, results) => {
    if (err) return res.status(500).send('Database error');
    if (results.length === 0 || results[0].otp != otp) {
      return res.status(400).send('Invalid OTP');
    }

    db.query('UPDATE users SET password = ?, otp = NULL WHERE email = ?', [new_password, email], (err) => {
      if (err) return res.status(500).send('Failed to reset password');
      res.send('success');
    });
  });
});

module.exports = router;
