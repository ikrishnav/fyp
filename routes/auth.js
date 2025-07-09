const express = require('express');
const router = express.Router();
const mysql = require('mysql2');
const path = require('path');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');

const db = mysql.createConnection({
  host: 'mysql', 
  user: 'root',
  password: '', 
  database: 'iot_dashboard'
});

// --- Guest login route ---
const axios = require('axios');

router.post('/guest-login', async (req, res) => {
    const recaptchaToken = req.body['g-recaptcha-response'];
    if (!recaptchaToken) {
        return res.redirect('/auth/login?error=captcha');
    }
    try {
        const secret = '6Le_LH0rAAAAAL2LMkNVzOHsZLTFCLY1LGFjGZ3l';
        const verifyRes = await axios.post(
            'https://www.google.com/recaptcha/api/siteverify',
            null,
            {
                params: {
                    secret: secret,
                    response: recaptchaToken
                }
            }
        );
        if (!verifyRes.data.success) {
            return res.redirect('/auth/login?error=captcha');
        }
        req.session.user = { type: 'guest' };
        res.redirect('/dashboard-selector');
    } catch (err) {
        console.error('reCAPTCHA error:', err.message);
        return res.redirect('/auth/login?error=captcha');
    }
});


// --- Serve login page, with error if needed ---
router.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/login.html'));
});

// --- For frontend JS: session user info ---
router.get('/userinfo', (req, res) => {
  const user = req.session.user || { type: 'guest' };
  // If not present, default isAdmin to false
  user.isAdmin = user.isAdmin || false;
  res.json(user);
});

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
    if (password !== user.password) {
      return res.status(401).json({ success: false, message: 'Invalid username or password.' });
    }

    // --- ADDED: Check for admin ---
    const isAdmin = user.email === 'krishnavijayan189@gmail.com';
    req.session.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      isAdmin: isAdmin   // Add isAdmin flag to session
    };

    // --- ADDED: Return isAdmin in JSON
    res.json({ success: true, role: user.role, isAdmin });
  });
});


router.get('/forgot', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/forgot.html'));
});

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
