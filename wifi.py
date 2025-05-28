# wifi.py
import time
import network

def connect_wifi(ssid, password):
    wlan = network.WLAN(mode=network.WLAN.STA)
    wlan.connect(ssid=ssid, auth=(network.WLAN.WPA2, password))

    print("Connecting to WiFi...", end="")
    while not wlan.isconnected():
        time.sleep(1)
        print(".", end="")

    ip = wlan.ifconfig()[0]
    while ip == '0.0.0.0':
        print("Waiting for valid IP...")
        time.sleep(1)
        ip = wlan.ifconfig()[0]

    print("\\nConnected!")
    print("IP:", wlan.ifconfig())
    return wlan
