"""
Microscope button listener.
Captures button presses via raw packet socket and serves them on HTTP.
Must run as root.

Usage: sudo python3 button-listener.py [interface] [http_port]
Default: sudo python3 button-listener.py wlp0s20f3 9101
"""

import socket
import struct
import sys
import time
import threading
from http.server import HTTPServer, BaseHTTPRequestHandler

IFACE = sys.argv[1] if len(sys.argv) > 1 else 'wlp0s20f3'
HTTP_PORT = int(sys.argv[2]) if len(sys.argv) > 2 else 9101
DEBOUNCE_MS = 300
FDWN = b'FDWN'

last_press = 0
press_count = 0
sse_clients = []


class ButtonHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/events':
            self.send_response(200)
            self.send_header('Content-Type', 'text/event-stream')
            self.send_header('Cache-Control', 'no-cache')
            self.send_header('Connection', 'keep-alive')
            self.end_headers()
            self.wfile.write(b'data: connected\n\n')
            self.wfile.flush()
            sse_clients.append(self.wfile)
            while True:
                try:
                    time.sleep(1)
                except:
                    break
            return

        if self.path == '/status':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(f'{{"presses":{press_count},"lastPress":{last_press}}}'.encode())
            return

        self.send_response(404)
        self.end_headers()

    def log_message(self, format, *args):
        pass


def notify_clients():
    dead = []
    for client in sse_clients:
        try:
            client.write(f'data: {{"event":"button-press","timestamp":{int(time.time()*1000)}}}\n\n'.encode())
            client.flush()
        except:
            dead.append(client)
    for d in dead:
        sse_clients.remove(d)


def capture_loop():
    global last_press, press_count
    ETH_P_ALL = 0x0003
    s = socket.socket(socket.AF_PACKET, socket.SOCK_RAW, socket.htons(ETH_P_ALL))
    s.bind((IFACE, 0))
    print(f'[button] Capturing on {IFACE}', flush=True)

    while True:
        try:
            raw = s.recv(65535)
            idx = raw.find(FDWN)
            if idx < 0 or idx + 12 > len(raw):
                continue
            if raw[idx + 11] != 0x01:
                continue
            now = time.time() * 1000
            if now - last_press < DEBOUNCE_MS:
                continue
            last_press = now
            press_count += 1
            print(f'[button] PRESS #{press_count}', flush=True)
            notify_clients()
        except Exception as e:
            print(f'[button] Error: {e}', flush=True)
            time.sleep(1)


if __name__ == '__main__':
    t = threading.Thread(target=capture_loop, daemon=True)
    t.start()

    server = HTTPServer(('0.0.0.0', HTTP_PORT), ButtonHandler)
    print(f'[button] HTTP on http://0.0.0.0:{HTTP_PORT}/events (SSE)', flush=True)
    print(f'[button] Status: http://0.0.0.0:{HTTP_PORT}/status', flush=True)
    server.serve_forever()
