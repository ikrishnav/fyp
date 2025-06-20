const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'mysql',  
  user: 'root',          
  password: '', 
  database: 'iot_dashboard'  //dddsdsdsd
});

db.connect((err) => {
  if (err) {
    console.error('❌ Database connection failed:', err.stack);
    return;
  }
  console.log('✅ Connected to MySQL database.');
});

module.exports = db;
