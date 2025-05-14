const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve static files (if any CSS/JS in /public)
app.use(express.static(path.join(__dirname, 'public')));

// MySQL Connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '', // Default XAMPP MySQL password
  database: 'sigfox_data'
});

db.connect((err) => {
  if (err) {
    console.error("DB Connection Error:", err);
    return;
  }
  console.log("Connected to MySQL!");
});

// Route to receive Sigfox data (simulate POST)
app.post('/api/sigfox', (req, res) => {
  const { device, data, time } = req.body;

  if (!data || data.length < 8) {
    return res.status(400).send("Invalid data format");
  }

  // Decode hex to decimal
  const tempRaw = parseInt(data.substring(0, 4), 16);
  const humRaw = parseInt(data.substring(4, 8), 16);
  const temperature = tempRaw / 10.0;
  const humidity = humRaw / 10.0;

  const sql = 'INSERT INTO sensor_data (device_id, temperature, humidity) VALUES (?, ?, ?)';
  db.query(sql, [device, temperature, humidity], (err, result) => {
    if (err) {
      console.error("DB Insert Error:", err);
      return res.status(500).send("Database error");
    }
    console.log("Data inserted:", { device, temperature, humidity });
    res.status(200).send("Data stored successfully");
  });
});

// Route to get all data for dashboard
app.get('/api/data', (req, res) => {
  db.query('SELECT * FROM sensor_data ORDER BY timestamp DESC', (err, results) => {
    if (err) {
      console.error("Error fetching data:", err);
      return res.status(500).send("Error");
    }
    res.json(results);
  });
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
