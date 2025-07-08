const mqtt = require('mqtt');
const db = require('./db');

const client = mqtt.connect('mqtt://192.168.18.41:1883');

client.on('connect', () => {
  console.log('✅ MQTT connected');
  client.subscribe('iot/wifi');
  client.subscribe('iot/sigfox1');
  console.log('📥 Subscribed to topics: iot/wifi, iot/sigfox1');
});

client.on('message', (topic, message) => {
  try {
    const payload = JSON.parse(message.toString());
    const { device_id, timestamp, temperature, humidity } = payload;

    const temp = parseFloat(temperature);
    const hum = parseFloat(humidity);
    const timeInt = parseInt(timestamp);

    // Get device internal ID from devices table
    db.query(
      'SELECT id FROM devices WHERE device_id = ? AND is_active = 1',
      [device_id],
      (err, results) => {
        if (err || results.length === 0) {
          console.error('❌ Device not found or inactive:', device_id);
          return;
        }

        const internalId = results[0].id;

        // Insert into normalized sensor_data table
        db.query(
          `INSERT INTO sensor_data (device_id, temperature, humidity, timestamp)
           VALUES (?, ?, ?, FROM_UNIXTIME(?))`,
          [internalId, temp, hum, timeInt],
          (err, result) => {
            if (err) return console.error('❌ Insert Error [sensor_data]:', err);
            console.log(`✅ Logged: ${device_id} → T: ${temp}°C | H: ${hum}%`);

            // Check SLA breach
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
                `INSERT INTO sla_breaches 
                 (device_id, timestamp, temperature, humidity, status, breach_type, severity)
                 VALUES (?, FROM_UNIXTIME(?), ?, ?, ?, ?, ?)`,
                [
                  internalId,
                  timeInt,
                  temp,
                  hum,
                  statusText.join(', '),
                  statusText.includes('High Temp') ? 'Temperature' : 'Humidity',
                  'High'
                ],
                (err) => {
                  if (err) return console.error('❌ SLA Insert Error:', err);
                  console.log(`🔥 SLA breach logged for ${device_id}`);
                }
              );
            }
          }
        );
      }
    );
  } catch (err) {
    console.error('❌ MQTT Parsing Error:', err);
  }
});
