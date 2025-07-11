from network import WLAN
import time

def connect_wifi(ssid, password):
    wlan = WLAN(mode=WLAN.STA)
    if not wlan.isconnected():
        print("📶 Connecting to Wi-Fi...")
        wlan.connect(ssid=ssid, auth=(WLAN.WPA2, password))
        timeout = 20
        while not wlan.isconnected() and timeout > 0:
            time.sleep(1)
            timeout -= 1
            print(".", end='')

    if wlan.isconnected():
        print("\n✅ Connected:", wlan.ifconfig())
        return wlan
    else:
        print("\n❌ Failed to connect to Wi-Fi.")
        return None
