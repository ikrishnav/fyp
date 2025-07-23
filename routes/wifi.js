
const express = require('express');
const router = express.Router();
const db = require('../mqtt/db'); // Assuming this connects to your database


// Constants for better maintainability and readability
const WIFI_DEVICE_TYPE_NAME = 'wifi';
const TEMP_BREACH_THRESHOLD = 50;
const HUMIDITY_HIGH_BREACH_THRESHOLD = 90;
const HUMIDITY_LOW_BREACH_THRESHOLD = 10;
const DEFAULT_DATA_FETCH_LIMIT = 100; // Default limit for fetching sensor data and breaches

/**
 * Helper function for consistent error responses.
 * @param {object} res - Express response object.
 * @param {Error} err - The error object.
 * @param {string} message - A descriptive message for the error.
 */
const sendDbError = (res, err, message) => {
    console.error(message || 'Database error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
};

// ✅ Fetch WiFi sensor data with place name and optional filters
// Retrieves sensor data entries for 'wifi' type devices.
// Supports filtering by startDate, endDate, and place_name via query parameters.
// If no filters are provided, it defaults to fetching the latest 100 entries
// ✅ Fetch WiFi sensor data with place name

router.get('/api/data/wifi', (req, res) => {
    const { startDate, endDate, place_name } = req.query; // Get query parameters

    let query = `
        SELECT s.id, d.device_id, s.timestamp, s.temperature, s.humidity, s.place_name
        FROM sensor_data s
        JOIN devices d ON s.device_id = d.id
        JOIN device_types t ON d.device_type_id = t.id
        WHERE t.type_name = ?
    `;
    const queryParams = [WIFI_DEVICE_TYPE_NAME];

    // Add date range filter if provided
    if (startDate) {
        // Ensure start date is at the beginning of the day
        query += ` AND s.timestamp >= ?`;
        queryParams.push(startDate + ' 00:00:00');
    }
    if (endDate) {
        // Ensure end date is at the end of the day
        query += ` AND s.timestamp <= ?`;
        queryParams.push(endDate + ' 23:59:59');
    }

    // Add place name filter if provided
    if (place_name) {
        // Use LIKE for partial, case-insensitive matching
        query += ` AND s.place_name LIKE ?`;
        queryParams.push(`%${place_name}%`);
    }

    query += ` ORDER BY s.timestamp DESC`;

    // Apply default limit only if no specific date/place filters are applied.
    // This allows fetching all data within a filtered range without a hard limit.
    if (!startDate && !endDate && !place_name) {
        query += ` LIMIT ?`;
        queryParams.push(DEFAULT_DATA_FETCH_LIMIT);
    }

    db.query(query, queryParams, (err, results) => {
        if (err) {
            return sendDbError(res, err, 'Error fetching WiFi data with filters');
        }
        res.json(results);
    });
});

// ✅ Get SLA Breaches for Wi-Fi
// Retrieves the latest 100 SLA breaches for 'wifi' type devices.
// Defines breach status based on temperature and humidity thresholds.
router.get('/api/breaches/wifi', (req, res) => {

    const query = `
        SELECT d.device_id, s.timestamp, s.temperature, s.humidity,
               CASE
                 WHEN s.temperature > ? THEN 'High Temperature'
                 WHEN s.humidity > ? THEN 'High Humidity'
                 WHEN s.humidity < ? THEN 'Low Humidity'
                 ELSE 'Unknown'
               END AS status
        FROM sensor_data s
        JOIN devices d ON s.device_id = d.id
        JOIN device_types t ON d.device_type_id = t.id
        WHERE t.type_name = ? AND (
          s.temperature > ? OR s.humidity > ? OR s.humidity < ?
        )
        ORDER BY s.timestamp DESC
        LIMIT ?
    `;
    const params = [
        TEMP_BREACH_THRESHOLD, HUMIDITY_HIGH_BREACH_THRESHOLD, HUMIDITY_LOW_BREACH_THRESHOLD,
        WIFI_DEVICE_TYPE_NAME,
        TEMP_BREACH_THRESHOLD, HUMIDITY_HIGH_BREACH_THRESHOLD, HUMIDITY_LOW_BREACH_THRESHOLD,
        DEFAULT_DATA_FETCH_LIMIT
    ];
db.query(query, params, (err, results) => {
    if (err) {
        return sendDbError(res, err, 'Error fetching WiFi SLA breaches');
    }
    res.json(results);
});
});

// ✅ Get Quick Analytics for Wi-Fi Sensor Data
// Calculates total readings, average temperature, average humidity, and a basic uptime.
// Uptime is calculated as the percentage of unique 'wifi' devices that have reported data
// compared to the total unique 'wifi' devices ever registered.
router.get('/api/data/wifi/analytics', (req, res) => {
    const query = `
        SELECT
            COUNT(s.id) AS total_readings,
            AVG(s.temperature) AS avg_temperature,
            AVG(s.humidity) AS avg_humidity,
            (SELECT COUNT(DISTINCT d.device_id) FROM devices d JOIN device_types dt ON d.device_type_id = dt.id WHERE dt.type_name = ?) AS total_wifi_devices,
            COUNT(DISTINCT s.device_id) AS active_wifi_devices_in_last_100_readings
        FROM sensor_data s
        JOIN devices d ON s.device_id = d.id
        JOIN device_types t ON d.device_type_id = t.id
        WHERE t.type_name = ?
        ORDER BY s.timestamp DESC
        LIMIT ?;
    `;
    const queryParams = [WIFI_DEVICE_TYPE_NAME, WIFI_DEVICE_TYPE_NAME, DEFAULT_DATA_FETCH_LIMIT];

    db.query(query, queryParams, (err, results) => {
        if (err) {
            return sendDbError(res, err, 'Error fetching WiFi analytics data');
        }

        const analytics = results[0];
        let uptimePercentage = 0;

        // Calculate uptime as percentage of active devices among all registered WiFi devices
        if (analytics.total_wifi_devices > 0) {
            uptimePercentage = ((analytics.active_wifi_devices_in_last_100_readings / analytics.total_wifi_devices) * 100).toFixed(1);
        } else {
            // If no WiFi devices registered, uptime is 0
            uptimePercentage = 0;
        }


        res.json({
            totalReadings: analytics.total_readings || 0,
            avgTemperature: analytics.avg_temperature ? parseFloat(analytics.avg_temperature).toFixed(1) : 'N/A',
            avgHumidity: analytics.avg_humidity ? parseFloat(analytics.avg_humidity).toFixed(1) : 'N/A',
            uptime: uptimePercentage + '%' // Append '%' for display
        });
    });
});


// ✅ Get all location entries
// Retrieves all entries from the 'locations' table, ordered by name.
router.get('/api/locations', (req, res) => {
    db.query('SELECT * FROM locations ORDER BY name', (err, results) => {
        if (err) {
            return sendDbError(res, err, 'Error fetching locations');
        }
        res.json(results);
    });
});

// ✅ Add a new location entry manually
// Adds a new location to the 'locations' table. Requires 'name' in the request body.
router.post('/api/locations', (req, res) => {
    const { name, description } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'Name required' });
    }
    db.query(
        'INSERT INTO locations (name, description) VALUES (?, ?)',
        [name, description || null],
        (err, result) => {
            if (err) {
                return sendDbError(res, err, 'Error adding location');
            }
            res.status(201).json({ id: result.insertId, message: 'Location added successfully' });
        }
    );
});

// ✅ Receive WiFi sensor data (supports SLA and place_name)
// Handles incoming sensor data. It checks if the device exists; if not, it registers it.
// Then, it inserts the sensor data and checks for SLA breaches, recording them if found.
router.post('/api/data/wifi', (req, res) => {
    const { device_id, timestamp, temperature, humidity, place_name } = req.body;

    // Validate required fields
    if (!device_id || !timestamp || temperature === undefined || humidity === undefined) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    // First, check if the device already exists
    const getDeviceQuery = `SELECT id FROM devices WHERE device_id = ?`;
    db.query(getDeviceQuery, [device_id], (err, deviceResult) => {
        if (err) {
            return sendDbError(res, err, "Error fetching device ID");
        }

        let deviceDbId;

        if (deviceResult.length > 0) {
            // Device exists, get its ID
            deviceDbId = deviceResult[0].id;
            insertSensorData(deviceDbId);
        } else {
            // Device does not exist, insert a new device entry
            const insertDevice = `
                INSERT INTO devices (device_id, device_type_id)
                VALUES (?, (SELECT id FROM device_types WHERE type_name = ?))
            `;
            db.query(insertDevice, [device_id, WIFI_DEVICE_TYPE_NAME], (err, insertResult) => {
                if (err) {
                    return sendDbError(res, err, "Error inserting device");
                }
                deviceDbId = insertResult.insertId; // Get the ID of the newly inserted device
                insertSensorData(deviceDbId);
            });
        }

        /**
         * Inserts sensor data and checks for SLA breaches.
         * @param {number} deviceDbId - The internal database ID of the device.
         */
        function insertSensorData(deviceDbId) {
            const insertSensorQuery = `
                INSERT INTO sensor_data (device_id, timestamp, temperature, humidity, place_name)
                VALUES (?, FROM_UNIXTIME(?), ?, ?, ?)
            `;
            db.query(insertSensorQuery, [deviceDbId, timestamp, temperature, humidity, place_name || null], (err) => {
                if (err) {
                    return sendDbError(res, err, "Error inserting sensor data");
                }
        let breachStatus = [];
        if (temperature > 28) breachStatus.push("High Temperature");
        if (temperature < 22) breachStatus.push("Low Temperature");
        if (humidity > 50) breachStatus.push("High Humidity");
        if (humidity < 25) breachStatus.push("Low Humidity");

        if (breachStatus.length) {
          const statusText = breachStatus.join(' & ');
          const insertBreach = `
            INSERT INTO sla_breaches (device_id, timestamp, temperature, humidity, status)
            VALUES (?, FROM_UNIXTIME(?), ?, ?, ?)
          `;
          db.query(insertBreach, [deviceDbId, timestamp, temperature, humidity, statusText], (err) => {
            if (err) {
              console.error("Error inserting SLA breach:", err);
            }
          });
        }

                let status = null;
                let breach_type = null;

                // Check for SLA breaches based on defined thresholds
                if (temperature > TEMP_BREACH_THRESHOLD) {
                    status = "High Temp";
                    breach_type = "Temperature";
                } else if (humidity > HUMIDITY_HIGH_BREACH_THRESHOLD) {
                    status = "High Humidity";
                    breach_type = "Humidity";
                } else if (humidity < HUMIDITY_LOW_BREACH_THRESHOLD) {
                    status = "Low Humidity";
                    breach_type = "Humidity";
                }

                // If a breach is detected, record it in the sla_breaches table
                if (status) {
                    const insertBreach = `
                        INSERT INTO sla_breaches (device_id, timestamp, temperature, humidity, status, breach_type)
                        VALUES (?, FROM_UNIXTIME(?), ?, ?, ?, ?)
                    `;
                    db.query(insertBreach, [deviceDbId, timestamp, temperature, humidity, status, breach_type], (err) => {
                        if (err) {
                            // Log the breach insertion error but don't stop the main sensor data insertion flow
                            console.error("Error inserting SLA breach:", err);
                        }
                    });
                }

                return res.status(201).json({ success: true, message: 'Sensor data processed successfully' });
            });
        }
    });
});

// ✅ PATCH route to update place name for a reading
// Updates the 'place_name' for a specific sensor data entry identified by its ID.
router.patch('/api/data/wifi/:id/place', (req, res) => {
    const { id } = req.params; // Get the sensor data ID from URL parameters
    const { place_name } = req.body; // Get the new place name from the request body

    if (!place_name) {
        return res.status(400).json({ error: "Missing place_name" });
    }

    db.query(
        `UPDATE sensor_data SET place_name = ? WHERE id = ?`,
        [place_name, id],
        (err, result) => {
            if (err) {
                return sendDbError(res, err, "Error updating place name");
            }
            // Check if any row was affected to determine if the ID existed
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: "Sensor data ID not found." });
            }
            res.json({ success: true, message: 'Place name updated successfully' });
        }
    );
});

module.exports = router;