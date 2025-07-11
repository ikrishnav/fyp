import time
import urequests
import ujson
from bluetooth import scan_ble
from wifi import connect_wifi

SSID = 'Krish'
PASSWORD = '12345678'
DEVICE_ID = 'fipy-bluetooth-unit-01'
BACKEND_URL = 'http://10.127.246.73:3000/api/data/bluetooth'

connect_wifi(SSID, PASSWORD)

try:
    device = scan_ble()
    if device:
        print("ð¡ BLE Device Found:", device)

        payload = {
            "device_id": DEVICE_ID,
            "timestamp": int(time.time()),
            "temperature": device["temperature"],
            "humidity": device["humidity"]
        }

        try:
            res = urequests.post(BACKEND_URL, data=ujson.dumps(payload), headers={'Content-Type': 'application/json'})
            print("✅ Data sent:", res.status_code)
            try:
                res.close()
            except:
                pass
        except Exception as e:
            print("❌ Send error:", e)
    else:
        print("⚠️ No matching BLE advertisement found")

except Exception as e:
    print("❌ BLE scan failed:", e)
