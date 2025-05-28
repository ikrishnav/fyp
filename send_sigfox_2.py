import time
from pycoproc_2 import Pycoproc
from SI7006A20 import SI7006A20
from sigfox import send_via_sigfox

DEVICE_ID = 'sigfox-device-02'

py = Pycoproc()
si = SI7006A20(py)

while True:
    temp = round(si.temperature(), 1)
    hum = round(si.humidity(), 1)

    print("Temp:", temp, "Humidity:", hum)

    temp_int = int(temp * 2)
    hum_int = int(hum)

    payload = '{:02X}{:02X}'.format(temp_int, hum_int)
    send_via_sigfox(payload)

    time.sleep(300)