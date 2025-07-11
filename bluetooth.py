from network import Bluetooth
import sys
sys.path.append('/flash/lib')
import ubinascii
import time
import ujson
from wifi import connect_wifi
from umqtt.simple import MQTTClient

SSID = 'NOKIA-79A1'
PASSWORD = 'UZY4Z3tr4K'
DEVICE_ID = 'fipy-bluetooth-unit-01'
MQTT_BROKER = '192.168.18.41'
MQTT_TOPIC = 'iot/bluetooth'

connect_wifi(SSID, PASSWORD)

def scan_ble():
    bt = Bluetooth()
    bt.start_scan(-1)
    print("🔍 Scanning BLE...")

    start = time.ticks_ms()
    while time.ticks_diff(time.ticks_ms(), start) < 5000:
        adv = bt.get_adv()
        if adv:
            try:
                raw = bt.resolve_adv_data(adv.data, Bluetooth.ADV_MANUFACTURER_DATA)
                if raw and raw.startswith(b'\xff\xff') and len(raw) >= 4:
                    temp = raw[2]
                    hum = raw[3]
                    bt.stop_scan()
                    return {
                        "temperature": temp,
                        "humidity": hum
                    }
            except Exception as e:
                print("❌ Parse error:", e)
        time.sleep(0.1)

    bt.stop_scan()
    return None