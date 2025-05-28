import time
from pycoproc_2 import Pycoproc
from SI7006A20 import SI7006A20
from sigfox import send_via_sigfox

py = Pycoproc()
si = SI7006A20(py)

while True:
    temp = round(si.temperature(), 1)
    hum = round(si.humidity(), 1)

    print("Temp:", temp, "Humidity:", hum)

    # Convert to 1 byte each after scaling
    temp_int = int(temp * 2)  # e.g., 25.5°C → 51
    hum_int = int(hum)        # e.g., 60.2% → 60

    payload = '{:02X}{:02X}'.format(temp_int, hum_int)  # e.g., '331E'
    send_via_sigfox(payload)

    time.sleep(300)  # every 5 min
