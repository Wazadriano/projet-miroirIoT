// Simulateur de microscope pour la démonstration sans matériel.
// Sert les mêmes routes que proxy.js (flux MJPEG, instantané, capture, événements bouton, état)
// à partir de clichés de synthèse rangés dans simulation/. Aucune personne, aucune donnée réelle.
//
//   node microscope-proxy/simulateur.js          # écoute sur 127.0.0.1:9100 comme le proxy
//   SIMULATION_PHASE=apres node simulateur.js    # sert les clichés « après » (par défaut : alternance)
//
// Dans start.sh, MICROSCOPE_SIMULE=1 lance ce simulateur à la place du proxy.

const http = require('http')
const fs = require('fs')
const path = require('path')

const LISTEN_HOST = process.env.LISTEN_HOST || '127.0.0.1'
const LISTEN_PORT = parseInt(process.env.LISTEN_PORT || '9100', 10)
const DOSSIER = path.join(__dirname, 'simulation')
const IMAGES_PAR_SECONDE = 8
const BASCULE_MS = 12000 // durée pendant laquelle une même série (avant ou après) reste affichée

const phaseFixe = process.env.SIMULATION_PHASE || null
const series = { avant: [], apres: [] }
for (const nom of fs.readdirSync(DOSSIER).sort()) {
  if (!nom.endsWith('.jpg')) continue
  const phase = nom.startsWith('apres') ? 'apres' : 'avant'
  series[phase].push(fs.readFileSync(path.join(DOSSIER, nom)))
}
if (!series.avant.length && !series.apres.length) {
  console.error('[simulateur] aucun cliché dans ' + DOSSIER)
  process.exit(1)
}

let indice = 0
let tic = 0
function phaseCourante() {
  if (phaseFixe && series[phaseFixe] && series[phaseFixe].length) return phaseFixe
  const alternance = Math.floor(Date.now() / BASCULE_MS) % 2 === 0 ? 'avant' : 'apres'
  return series[alternance].length ? alternance : (series.avant.length ? 'avant' : 'apres')
}
function imageCourante() {
  const s = series[phaseCourante()]
  // Une légère alternance entre deux clichés voisins imite le tremblement de la main.
  const i = (indice + (tic % 3 === 0 ? 1 : 0)) % s.length
  return s[i]
}
setInterval(() => { tic += 1; if (tic % (IMAGES_PAR_SECONDE * 3) === 0) indice += 1 }, 1000 / IMAGES_PAR_SECONDE)

const clientsBouton = []
function appuiBouton() {
  for (const res of clientsBouton) res.write('data: button\n\n')
}
process.on('SIGUSR2', appuiBouton) // kill -USR2 <pid> simule l'appui sur le bouton du microscope

const serveur = http.createServer((req, res) => {
  if (req.url === '/stream.mjpg' || req.url === '/stream') {
    res.writeHead(200, {
      'Content-Type': 'multipart/x-mixed-replace; boundary=frame',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Pragma': 'no-cache'
    })
    const envoi = setInterval(() => {
      const img = imageCourante()
      res.write('--frame\r\nContent-Type: image/jpeg\r\nContent-Length: ' + img.length + '\r\n\r\n')
      res.write(img)
      res.write('\r\n')
    }, 1000 / IMAGES_PAR_SECONDE)
    req.on('close', () => clearInterval(envoi))
    return
  }
  if (req.url === '/snapshot.jpg' || req.url === '/snapshot') {
    const img = imageCourante()
    res.writeHead(200, { 'Content-Type': 'image/jpeg', 'Content-Length': String(img.length) })
    res.end(img)
    return
  }
  if (req.url === '/capture' && req.method === 'POST') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ success: true, imageBase64: imageCourante().toString('base64') }))
    return
  }
  if (req.url === '/button-events') {
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' })
    res.write('data: connected\n\n')
    clientsBouton.push(res)
    req.on('close', () => { const i = clientsBouton.indexOf(res); if (i >= 0) clientsBouton.splice(i, 1) })
    return
  }
  if (req.url === '/bouton' && req.method === 'POST') {
    appuiBouton()
    res.writeHead(204)
    res.end()
    return
  }
  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ connected: true, hasFrame: true, simulation: true, phase: phaseCourante() }))
})

serveur.listen(LISTEN_PORT, LISTEN_HOST, () => {
  console.log(`[simulateur] microscope simulé : http://${LISTEN_HOST}:${LISTEN_PORT}/stream.mjpg (${series.avant.length} clichés avant, ${series.apres.length} après)`)
  console.log(`[simulateur] appui bouton simulé : POST /bouton ou kill -USR2 ${process.pid}`)
})
