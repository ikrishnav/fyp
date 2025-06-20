const mqtt = require('mqtt');
const db = require('./db');
const client = mqtt.connect('mqtt://192.168.129.73:1883');

client.on('connect', () => {
  console.log('MQTT connected');
  client.subscribe('iot/wifi');
});

client.on('message', (topic, message) => {
  try {
    const payload = JSON.parse(message.toString());
    const { device_id, timestamp, temperature, humidity } = payload;

    if (topic === 'iot/wifi') {
      db.query(`INSERT INTO wifi_data (device_id, temperature, humidity, timestamp)
        VALUES (?, ?, ?, FROM_UNIXTIME(?))`,
        [device_id, temperature, humidity, timestamp]);

      const breaches = [];
      if (temperature > 40) breaches.push('High Temp');
      if (humidity > 90) breaches.push('High Humidity');

      if (breaches.length) {
        db.query(`INSERT INTO sla_breaches_wifi (device_id, timestamp, temperature, humidity, status)
          VALUES (?, FROM_UNIXTIME(?), ?, ?, ?)`,
          [device_id, timestamp, temperature, humidity, breaches.join(', ')]);
      }
    }
  } catch (err) {
    console.error('Parsing MQTT failed:', err);
  }
});
