from network import Sigfox
import socket
import binascii

def send_via_sigfox(payload_hex):
    sigfox = Sigfox(mode=Sigfox.SIGFOX, rcz=Sigfox.RCZ4)
    s = socket.socket(socket.AF_SIGFOX, socket.SOCK_RAW)
    s.setblocking(True)
    s.setsockopt(socket.SOL_SIGFOX, socket.SO_RX, False)

    print("Sending via Sigfox:", payload_hex)
    s.send(binascii.unhexlify(payload_hex))
    print("✅ Sigfox payload sent")