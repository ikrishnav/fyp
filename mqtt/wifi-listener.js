const mqtt = require('mqtt');
const db = require('./db');

const client = mqtt.connect('mqtt://192.168.18.41:1883'); // <-- Replace with your host IP if needed

client.on('connect', () => {
  console.log('✅ MQTT connected');
  client.subscribe('iot/wifi');
  client.subscribe('iot/sigfox1');
  console.log('📥 Subscribed to topics: iot/wifi, iot/sigfox1');
});

client.on('message', (topic, message) => {
  try {
    console.log('📨 Raw MQTT message:', message.toString());

    const payload = JSON.parse(message.toString());
    const { device_id, timestamp, temperature, humidity } = payload;

    const temp = parseFloat(temperature);
    const hum = parseFloat(humidity);

    if (topic === 'iot/wifi') {
      // Insert into wifi_data
      db.query(
        `INSERT INTO wifi_data (device_id, temperature, humidity, timestamp)
         VALUES (?, ?, ?, FROM_UNIXTIME(?))`,
        [device_id, temp, hum, timestamp],
        (err) => {
          if (err) return console.error('❌ MySQL Insert Error (Wi-Fi):', err);
          console.log(`📥 Logged Wi-Fi data: ${device_id} | T: ${temp}°C | H: ${hum}%`);

          // Check SLA
          let breached = false;
          const statusText = [];

          if (temp > 40) {
            breached = true;
            statusText.push('High Temp');
          }
          if (hum > 90) {
            breached = true;
            statusText.push('High Humidity');
          }

          if (breached) {
            db.query(
              `INSERT INTO sla_breaches_wifi (device_id, timestamp, temperature, humidity, status)
               VALUES (?, FROM_UNIXTIME(?), ?, ?, ?)`,
              [device_id, timestamp, temp, hum, statusText.join(', ')],
              (err) => {
                if (err) return console.error('❌ SLA Insert Error:', err);
                console.log(`🔥 SLA breach logged for ${device_id}`);
              }
            );
          }
        }
      );
    }

    if (topic === 'iot/sigfox1') {
      db.query(
        `INSERT INTO sigfox1_data (device_id, temperature, humidity, timestamp)
         VALUES (?, ?, ?, FROM_UNIXTIME(?))`,
        [device_id, temp, hum, timestamp],
        (err) => {
          if (err) console.error('❌ MySQL Insert Error (Sigfox1):', err);
          else console.log(`📥 Logged Sigfox1 data: ${device_id} | T: ${temp}°C | H: ${hum}%`);
        }
      );
    }

  } catch (err) {
    console.error('❌ Error parsing MQTT message:', err);
  }
});
