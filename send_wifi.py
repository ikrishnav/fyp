from network import WLAN
from simple import MQTTClient
import time
import ubinascii
import json
from pycoproc_2 import Pycoproc
from SI7006A20 import SI7006A20

SSID = 'Krish'
PASSWORD = '12345678'
DEVICE_ID = 'fipy-wifi-unit-01'
MQTT_BROKER = '10.127.246.73'
MQTT_TOPIC = 'iot/wifi'

def connect_wifi(ssid, password):
    wlan = WLAN(mode=WLAN.STA)
    if not wlan.isconnected():
        wlan.connect(ssid=ssid, auth=(WLAN.WPA2, password))
        timeout = 20
        while not wlan.isconnected() and timeout > 0:
            time.sleep(1)
            timeout -= 1
    return wlan if wlan.isconnected() else None

wlan = connect_wifi(SSID, PASSWORD)
if not wlan:
    raise Exception("Wi-Fi failed.")

client = MQTTClient(client_id=DEVICE_ID, server=MQTT_BROKER, port=1883)
client.connect()

py = Pycoproc()
si = SI7006A20(py)

while True:
    temperature = si.temperature()
    humidity = si.humidity()
    timestamp = time.time()

    payload = {
        "device_id": DEVICE_ID,
        "timestamp": timestamp,
        "temperature": temperature,
        "humidity": humidity
    }

    client.publish(MQTT_TOPIC, json.dumps(payload))
    print("Published:", payload)
    time.sleep(60)  # every 1 minute
