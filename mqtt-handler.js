const mqtt = require('mqtt');
const db = require('./mqtt/db');

const client = mqtt.connect('mqtt://localhost:1883');

client.on('connect', () => {
  console.log('✅ MQTT connected');
  client.subscribe('iot/wifi');
  client.subscribe('iot/sigfox1');
});

client.on('message', (topic, message) => {
  const payload = JSON.parse(message.toString());
  const { device_id, timestamp, temperature, humidity } = payload;

  if (topic === 'iot/wifi') {
    // Insert into wifi_data
    db.query(`INSERT INTO wifi_data (device_id, temperature, humidity, timestamp) VALUES (?, ?, ?, FROM_UNIXTIME(?))`,
      [device_id, temperature, humidity, timestamp]);
  }

  if (topic === 'iot/sigfox1') {
    // Insert into sigfox1_data
    db.query(`INSERT INTO sigfox1_data (device_id, temperature, humidity, timestamp) VALUES (?, ?, ?, FROM_UNIXTIME(?))`,
      [device_id, temperature, humidity, timestamp]);
  }

  // Add SLA breach logic if needed
});
