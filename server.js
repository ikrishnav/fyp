const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const session = require('express-session');
const bcrypt = require('bcrypt');

const app = express();

// ✅ Session setup MUST come before routes
app.use(session({
  secret: 'iot_project_secret',
  resave: false,
  saveUninitialized: false
}));

// ✅ Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// ✅ Routes
const authRoutes = require('./routes/auth');
const sigfox1Routes = require('./routes/sigfox1');
const sigfox2Routes = require('./routes/sigfox2');
const bluetoothRoutes = require('./routes/bluetooth');
const adminRoutes = require('./routes/admin');
const wifiRoutes = require('./routes/wifi');

app.use('/auth',authRoutes);
app.use(sigfox1Routes);
app.use(sigfox2Routes);
app.use(bluetoothRoutes);
app.use(adminRoutes);
app.use(wifiRoutes);

// ✅ Static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/views', express.static(path.join(__dirname, 'views')));

// ✅ Default route
app.get('/', (req, res) => {
  res.redirect('/views/login.html');
});

// ✅ Start server
app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
