
const mqtt = require('mqtt');
const db = require('./db');

const client = mqtt.connect('mqtt://192.168.129.73:1883');

client.on('connect', () => {
  console.log('MQTT connected');
  client.subscribe('iot/wifi');
});

client.on('message', async (topic, message) => {
  try {
    const payload = JSON.parse(message.toString());
    const { device_id, timestamp, temperature, humidity } = payload;

    // Find device numeric ID from database
    db.query(`SELECT id FROM devices WHERE device_id = ?`, [device_id], (err, results) => {
      if (err || results.length === 0) {
        console.error('Device ID not found or DB error:', err || 'No device found');
        return;
      }

      const deviceNumericId = results[0].id;

      // Insert into sensor_data (normalized)
      db.query(`INSERT INTO sensor_data (device_id, temperature, humidity, timestamp)
        VALUES (?, ?, ?, FROM_UNIXTIME(?))`,
        [deviceNumericId, temperature, humidity, timestamp]);

      // Check and insert SLA breaches
      const breaches = [];
      if (temperature > 40) breaches.push('High Temp');
      if (humidity > 90) breaches.push('High Humidity');

      if (breaches.length) {
        db.query(`INSERT INTO sla_breaches (device_id, timestamp, temperature, humidity, status, breach_type)
          VALUES (?, FROM_UNIXTIME(?), ?, ?, ?, ?)`,
          [deviceNumericId, timestamp, temperature, humidity, breaches.join(', '), 'Environment']);
      }
    });

  } catch (err) {
    console.error('Parsing MQTT failed:', err);
  }
});
