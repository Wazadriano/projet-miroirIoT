"""
Microscope WiFi Stream Proxy
Connects to the Ninyoon/DM-WiFi microscope via TCP,
receives H.264 stream, and serves it as MJPEG on localhost.

Usage: python3 stream.py [microscope_ip] [listen_port]
  Default: python3 stream.py 192.168.34.1 9000
  Open http://localhost:9000/stream.mjpg in browser
"""

import socket
import subprocess
import sys
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer
from socketserver import ThreadingMixIn

MICROSCOPE_IP = sys.argv[1] if len(sys.argv) > 1 else "192.168.34.1"
MICROSCOPE_PORT = 8080
LISTEN_PORT = int(sys.argv[2]) if len(sys.argv) > 2 else 9000

latest_frame = b""
frame_lock = threading.Lock()


def microscope_reader():
    """Connect to microscope, send JHCMD init, read H.264 stream,
    use ffmpeg to decode to MJPEG frames."""
    global latest_frame

    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(10)
    sock.connect((MICROSCOPE_IP, MICROSCOPE_PORT))
    sock.sendall(b"JHCMD\xd0\x01")
    print(f"[microscope] Connected to {MICROSCOPE_IP}:{MICROSCOPE_PORT}")

    # Pipe H.264 from TCP through ffmpeg to get MJPEG frames
    ffmpeg = subprocess.Popen(
        [
            "ffmpeg",
            "-f", "h264",
            "-i", "pipe:0",
            "-f", "mjpeg",
            "-q:v", "5",
            "-r", "15",
            "pipe:1",
        ],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.DEVNULL,
    )

    def feed_ffmpeg():
        try:
            while True:
                data = sock.recv(65536)
                if not data:
                    break
                # Send heartbeat every ~5 seconds worth of data
                ffmpeg.stdin.write(data)
                ffmpeg.stdin.flush()
        except Exception as e:
            print(f"[microscope] Feed error: {e}")
        finally:
            try:
                ffmpeg.stdin.close()
            except:
                pass

    feeder = threading.Thread(target=feed_ffmpeg, daemon=True)
    feeder.start()

    # Read MJPEG frames from ffmpeg stdout
    buf = b""
    while True:
        chunk = ffmpeg.stdout.read(4096)
        if not chunk:
            break
        buf += chunk
        # Find JPEG boundaries
        while True:
            start = buf.find(b"\xff\xd8")
            end = buf.find(b"\xff\xd9", start + 2) if start >= 0 else -1
            if start >= 0 and end >= 0:
                frame = buf[start:end + 2]
                with frame_lock:
                    latest_frame = frame
                buf = buf[end + 2:]
            else:
                break

    sock.close()
    print("[microscope] Disconnected")


class StreamHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path.endswith(".mjpg") or self.path == "/stream":
            self.send_response(200)
            self.send_header("Content-type", "multipart/x-mixed-replace; boundary=--frame")
            self.end_headers()
            prev = b""
            try:
                while True:
                    with frame_lock:
                        frame = latest_frame
                    if frame and frame != prev:
                        self.wfile.write(b"--frame\r\n")
                        self.wfile.write(b"Content-Type: image/jpeg\r\n")
                        self.wfile.write(f"Content-Length: {len(frame)}\r\n\r\n".encode())
                        self.wfile.write(frame)
                        self.wfile.write(b"\r\n")
                        prev = frame
                    else:
                        import time
                        time.sleep(0.03)
            except (BrokenPipeError, ConnectionResetError):
                pass
            return

        if self.path == "/snapshot" or self.path.endswith(".jpg"):
            with frame_lock:
                frame = latest_frame
            if frame:
                self.send_response(200)
                self.send_header("Content-type", "image/jpeg")
                self.send_header("Content-length", str(len(frame)))
                self.end_headers()
                self.wfile.write(frame)
            else:
                self.send_response(503)
                self.end_headers()
                self.wfile.write(b"No frame available")
            return

        # Default: HTML page with stream
        self.send_response(200)
        self.send_header("Content-type", "text/html")
        self.end_headers()
        self.wfile.write(f"""<html>
<body style="margin:0;background:#000;display:flex;justify-content:center;align-items:center;height:100vh">
<img src="/stream.mjpg" style="max-width:100%;max-height:100vh"/>
</body>
</html>""".encode())

    def log_message(self, format, *args):
        pass


class ThreadedHTTPServer(ThreadingMixIn, HTTPServer):
    daemon_threads = True


if __name__ == "__main__":
    print(f"[proxy] Connecting to microscope at {MICROSCOPE_IP}:{MICROSCOPE_PORT}...")
    reader = threading.Thread(target=microscope_reader, daemon=True)
    reader.start()

    server = ThreadedHTTPServer(("0.0.0.0", LISTEN_PORT), StreamHandler)
    print(f"[proxy] Stream: http://localhost:{LISTEN_PORT}/stream.mjpg")
    print(f"[proxy] Viewer: http://localhost:{LISTEN_PORT}/")
    print(f"[proxy] Snapshot: http://localhost:{LISTEN_PORT}/snapshot.jpg")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n[proxy] Stopped")
