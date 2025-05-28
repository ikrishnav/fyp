# sender.py
import time
import urequests
import ujson
from wifi import connect_wifi
from pycoproc_2 import Pycoproc
from SI7006A20 import SI7006A20

# === Configuration ===
SSID = 'NOKIA-79A1'
PASSWORD = 'UZY4Z3tr4K'
DEVICE_ID = 'fipy-wifi-unit-01'
WIFI_ENDPOINT = 'http://192.168.18.41:3000/api/data/wifi'  # Replace with your server IP

# === Connect to WiFi ===
wlan = connect_wifi(SSID, PASSWORD)

# === Read from SI7006A20 ===
py = Pycoproc()
si = SI7006A20(py)

try:
    temperature = si.temperature()
    humidity = si.humidity()
    timestamp = time.time()

    print("Sensor Readings:")
    print("  Temp:", temperature, "°C")
    print("  Humidity:", humidity, "%")

    wifi_payload = {
        'device_id': DEVICE_ID,
        'timestamp': timestamp,
        'temperature': temperature,
        'humidity': humidity
    }

    res = urequests.post(WIFI_ENDPOINT, data=ujson.dumps(wifi_payload), headers={'Content-Type': 'application/json'})
    print("WiFi sensor data sent:", res.status_code)
    try:
        res.close()
    except Exception:
        pass

except Exception as e:
    print("Sensor or send error:", e)
