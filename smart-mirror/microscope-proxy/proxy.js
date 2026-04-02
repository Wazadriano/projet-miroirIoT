/**
 * Microscope WiFi Stream Proxy (Node.js)
 * Connects to the Ninyoon/DM-WiFi microscope via TCP JHCMD,
 * pipes H.264 through ffmpeg, serves MJPEG on HTTP,
 * and listens for physical button events (UDP port 20001).
 *
 * Usage: node proxy.js [microscope_ip] [listen_port]
 * Default: node proxy.js 192.168.34.1 9100
 */

const net = require('net')
const dgram = require('dgram')
const http = require('http')
const { spawn } = require('child_process')

const MICROSCOPE_IP = process.argv[2] || '192.168.34.1'
const MICROSCOPE_PORT = 8080
const LISTEN_PORT = parseInt(process.argv[3] || '9100')
const BUTTON_PORT = 20001
const RECONNECT_DELAY = 3000
const BUTTON_MAGIC = Buffer.from('FDWN')

let latestFrame = Buffer.alloc(0)
let sock = null
let lastButtonPress = 0
const buttonClients = [] // SSE clients for button events
let ffmpeg = null

function connectMicroscope() {
  if (sock) { try { sock.destroy() } catch {} }
  if (ffmpeg) { try { ffmpeg.kill() } catch {} }
  sock = null
  ffmpeg = null

  const s = net.createConnection({ host: MICROSCOPE_IP, port: MICROSCOPE_PORT, timeout: 5000 })

  s.on('connect', () => {
    console.log(`[proxy] Connected to microscope ${MICROSCOPE_IP}:${MICROSCOPE_PORT}`)
    s.write(Buffer.from([0x4a, 0x48, 0x43, 0x4d, 0x44, 0xd0, 0x01]))
    sock = s

    ffmpeg = spawn('/usr/bin/ffmpeg', [
      '-f', 'h264', '-i', 'pipe:0',
      '-f', 'mjpeg', '-q:v', '5', '-r', '15',
      'pipe:1'
    ], { stdio: ['pipe', 'pipe', 'ignore'] })

    s.on('data', (data) => { if (ffmpeg && ffmpeg.stdin.writable) ffmpeg.stdin.write(data) })

    const SOI = Buffer.from([0xff, 0xd8])
    const EOI = Buffer.from([0xff, 0xd9])
    let buf = Buffer.alloc(0)

    ffmpeg.stdout.on('data', (chunk) => {
      buf = Buffer.concat([buf, chunk])
      while (true) {
        const start = buf.indexOf(SOI)
        if (start < 0) break
        const end = buf.indexOf(EOI, start + 2)
        if (end < 0) break
        latestFrame = buf.subarray(start, end + 2)
        buf = buf.subarray(end + 2)
      }
    })

    ffmpeg.on('exit', () => {
      console.log('[proxy] ffmpeg exited, reconnecting...')
      scheduleReconnect()
    })
  })

  s.on('error', (err) => {
    console.log(`[proxy] Connection error: ${err.message}, retrying in ${RECONNECT_DELAY / 1000}s...`)
    s.destroy()
    scheduleReconnect()
  })

  s.on('close', () => {
    console.log('[proxy] TCP closed, reconnecting...')
    scheduleReconnect()
  })

  s.on('timeout', () => {
    console.log('[proxy] TCP timeout, retrying...')
    s.destroy()
    scheduleReconnect()
  })
}

let reconnectTimer = null
function scheduleReconnect() {
  if (reconnectTimer) return
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null
    connectMicroscope()
  }, RECONNECT_DELAY)
}

// HTTP server for MJPEG stream
const server = http.createServer((req, res) => {
  if (req.url === '/stream.mjpg' || req.url === '/stream') {
    res.writeHead(200, {
      'Content-Type': 'multipart/x-mixed-replace; boundary=--frame',
      'Cache-Control': 'no-cache',
      'Connection': 'close'
    })
    let prev = Buffer.alloc(0)
    const iv = setInterval(() => {
      if (latestFrame.length > 0 && !latestFrame.equals(prev)) {
        res.write('--frame\r\nContent-Type: image/jpeg\r\nContent-Length: ' + latestFrame.length + '\r\n\r\n')
        res.write(latestFrame)
        res.write('\r\n')
        prev = latestFrame
      }
    }, 33)
    req.on('close', () => clearInterval(iv))
    return
  }

  if (req.url === '/snapshot.jpg' || req.url === '/snapshot') {
    if (latestFrame.length > 0) {
      res.writeHead(200, { 'Content-Type': 'image/jpeg', 'Content-Length': String(latestFrame.length) })
      res.end(latestFrame)
    } else {
      res.writeHead(503)
      res.end('No frame')
    }
    return
  }

  // Button-triggered capture: returns snapshot as base64
  if (req.url === '/capture' && req.method === 'POST') {
    if (latestFrame.length > 0) {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ success: true, imageBase64: latestFrame.toString('base64') }))
    } else {
      res.writeHead(503, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ success: false, error: 'No frame available' }))
    }
    return
  }

  // SSE stream for button events
  if (req.url === '/button-events') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    })
    res.write('data: connected\n\n')
    buttonClients.push(res)
    req.on('close', () => {
      const idx = buttonClients.indexOf(res)
      if (idx >= 0) buttonClients.splice(idx, 1)
    })
    return
  }

  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ connected: sock !== null, hasFrame: latestFrame.length > 0 }))
})

// Button listener using raw packet capture via child process
// Proxy must run as sudo for this to work
const { spawn: spawnChild } = require('child_process')

function startButtonListener() {
  const iface = process.env.WIFI_IFACE || 'wlp0s20f3'

  // Use tcpdump -l for line-buffered text output (proven to work)
  const proc = spawnChild('tcpdump', [
    '-i', iface, '-nn', '-l', '--immediate-mode',
    'udp', 'port', '20001'
  ], { stdio: ['ignore', 'pipe', 'pipe'] })

  let pressCount = 0

  proc.stdout.on('data', (chunk) => {
    // Each line from tcpdump = one packet. 3 packets per button press.
    // First packet of a press group arrives, we trigger.
    const lines = chunk.toString().split('\n').filter(l => l.includes('UDP'))
    for (const line of lines) {
      const now = Date.now()
      if (now - lastButtonPress < 1500) continue // debounce 1.5s = 1 press per physical press
      lastButtonPress = now
      pressCount++
      console.log(`[proxy] Button PRESSED #${pressCount}`)
      for (const client of buttonClients) {
        client.write(`data: ${JSON.stringify({ event: 'button-press', timestamp: now })}\n\n`)
      }
    }
  })

  proc.stderr.on('data', (chunk) => {
    const msg = chunk.toString().trim()
    if (msg.includes('listening')) console.log(`[proxy] Button capture on ${iface}`)
    if (msg.includes('permission')) console.error('[proxy] Button needs sudo: run proxy with sudo')
  })

  proc.on('exit', (code) => {
    console.log(`[proxy] Button capture exited (${code}), restarting...`)
    setTimeout(startButtonListener, 3000)
  })
}

startButtonListener()

server.listen(LISTEN_PORT, '0.0.0.0', () => {
  console.log(`[proxy] MJPEG stream: http://0.0.0.0:${LISTEN_PORT}/stream.mjpg`)
  console.log(`[proxy] Snapshot:     http://0.0.0.0:${LISTEN_PORT}/snapshot.jpg`)
  console.log(`[proxy] Button SSE:   http://0.0.0.0:${LISTEN_PORT}/button-events`)
  connectMicroscope()
})
