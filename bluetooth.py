from network import Bluetooth
import ubinascii
import time

def scan_ble(timeout=5000):
    bt = Bluetooth()
    bt.start_scan(-1)
    print("📡 Scanning for BLE advertisements...")

    start = time.ticks_ms()

    while time.ticks_diff(time.ticks_ms(), start) < timeout:
        adv = bt.get_adv()
        if adv:
            try:
                raw = bt.resolve_adv_data(adv.data, Bluetooth.ADV_MANUFACTURER_DATA)
                if raw and raw.startswith(b'\xff\xff') and len(raw) >= 4:
                    print("ð¶ Received:", ubinascii.hexlify(raw))
                    temperature = raw[2]  # 0x1E -> 30
                    humidity = raw[3]     # 0x2D -> 45

                    return {
                        'mac': ubinascii.hexlify(adv.mac).decode(),
                        'rssi': adv.rssi,
                        'temperature': temperature,
                        'humidity': humidity
                    }

            except Exception as e:
                print("❌ Error parsing adv:", e)

        time.sleep(0.1)

    bt.stop_scan()
    return None  # nothing found
