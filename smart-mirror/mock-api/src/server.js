const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const RAPPORTS_DIR = '/tmp/rapports';
if (!fs.existsSync(RAPPORTS_DIR)) fs.mkdirSync(RAPPORTS_DIR, { recursive: true });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'smartmirror',
  user: process.env.DB_USER || 'smartmirror',
  password: process.env.DB_PASSWORD || 'smartmirror_dev'
});

// --- Mock Laravel API (port 8000) ---

const api = express();
api.use(cors());
api.use(express.json({ limit: '50mb' }));

// Auth: device registration (provisioning)
// Registers a specific mirror — if device_name is provided, match it.
// Otherwise, pick the first unregistered mirror (no token) for this boutique.
api.post('/api/auth/mirror/register', async (req, res) => {
  const { boutique_id, device_name } = req.body;
  if (!boutique_id) return res.status(422).json({ error: 'boutique_id required' });

  const token = `dev-token-${uuidv4()}`;
  try {
    let result;
    if (device_name) {
      result = await pool.query(
        `UPDATE miroirs SET device_token = $1, is_online = true, last_seen_at = NOW()
         WHERE boutique_id = $2 AND nom = $3 RETURNING id, nom, boutique_id`,
        [token, boutique_id, device_name]
      );
    } else {
      // Pick first mirror without a token (unregistered) or first mirror
      result = await pool.query(
        `UPDATE miroirs SET device_token = $1, is_online = true, last_seen_at = NOW()
         WHERE id = (
           SELECT id FROM miroirs
           WHERE boutique_id = $2 AND (device_token IS NULL OR device_token = '')
           ORDER BY created_at LIMIT 1
         ) RETURNING id, nom, boutique_id`,
        [token, boutique_id]
      );
      // Fallback: if all mirrors already have tokens, update the first one
      if (result.rows.length === 0) {
        result = await pool.query(
          `UPDATE miroirs SET device_token = $1, is_online = true, last_seen_at = NOW()
           WHERE id = (SELECT id FROM miroirs WHERE boutique_id = $2 ORDER BY created_at LIMIT 1)
           RETURNING id, nom, boutique_id`,
          [token, boutique_id]
        );
      }
    }
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No mirror found for this boutique' });
    }
    res.json({ data: { token, mirror: result.rows[0] } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Clients: search
api.get('/api/clientes', async (req, res) => {
  const { boutique_id, q } = req.query;
  if (!boutique_id) return res.status(422).json({ error: 'boutique_id required' });

  try {
    let query = 'SELECT * FROM clientes WHERE boutique_id = $1';
    const params = [boutique_id];
    if (q) {
      query += ` AND (prenom ILIKE $2 OR nom ILIKE $2 OR email ILIKE $2 OR telephone ILIKE $2)`;
      params.push(`%${q}%`);
    }
    query += ' ORDER BY nom, prenom LIMIT 50';
    const result = await pool.query(query, params);
    res.json({ data: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Clients: create
api.post('/api/clientes', async (req, res) => {
  const { id: clientId, boutique_id, prenom, nom, email, telephone, date_de_naissance, sexe } = req.body;
  if (!boutique_id || !prenom || !nom) {
    return res.status(422).json({ error: 'boutique_id, prenom, nom required' });
  }

  try {
    // Allow specifying ID (for CRM client upsert) or auto-generate
    const result = clientId
      ? await pool.query(
          `INSERT INTO clientes (id, boutique_id, prenom, nom, email, telephone, date_de_naissance, sexe)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (email, boutique_id) DO UPDATE SET prenom = EXCLUDED.prenom, nom = EXCLUDED.nom
           RETURNING *`,
          [clientId, boutique_id, prenom, nom, email || null, telephone || null, date_de_naissance || null, sexe || null]
        )
      : await pool.query(
          `INSERT INTO clientes (boutique_id, prenom, nom, email, telephone, date_de_naissance, sexe)
           VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
          [boutique_id, prenom, nom, email || null, telephone || null, date_de_naissance || null, sexe || null]
        );
    res.status(201).json({ data: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Client with this email already exists in this boutique' });
    }
    res.status(500).json({ error: err.message });
  }
});

// Consentements: check valid (within 30 days, not revoked)
api.get('/api/clientes/:id/consent-valid', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM consentements
       WHERE cliente_id = $1 AND date_revocation IS NULL
       AND date_consentement > NOW() - INTERVAL '30 days'
       ORDER BY date_consentement DESC LIMIT 1`,
      [req.params.id]
    );
    if (result.rows.length > 0) {
      res.json({ data: { valid: true, consent: result.rows[0] } });
    } else {
      res.json({ data: { valid: false } });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Consentements: create
api.post('/api/consentements', async (req, res) => {
  const { boutique_id, cliente_id, texte_consent } = req.body;
  if (!boutique_id || !cliente_id || !texte_consent) {
    return res.status(422).json({ error: 'boutique_id, cliente_id, texte_consent required' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO consentements (boutique_id, cliente_id, texte_consent)
       VALUES ($1, $2, $3) RETURNING *`,
      [boutique_id, cliente_id, texte_consent]
    );
    res.json({ data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Seances: create (requires consentement_id)
api.post('/api/seances', async (req, res) => {
  const { boutique_id, miroir_id, cliente_id, consentement_id } = req.body;
  if (!consentement_id) {
    return res.status(422).json({ error: 'consentement_id required - RGPD consent mandatory' });
  }

  try {
    const consent = await pool.query(
      'SELECT id FROM consentements WHERE id = $1 AND date_revocation IS NULL',
      [consentement_id]
    );
    if (consent.rows.length === 0) {
      return res.status(422).json({ error: 'Invalid or revoked consent' });
    }

    const result = await pool.query(
      `INSERT INTO seances (boutique_id, miroir_id, cliente_id, consentement_id)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [boutique_id, miroir_id, cliente_id, consentement_id]
    );
    res.status(201).json({ data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Seances: end
api.post('/api/seances/:id/end', async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE seances SET date_fin = NOW() WHERE id = $1 RETURNING *`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Session not found' });
    // In production, this triggers n8n webhook for PDF generation
    res.json({ data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Photos: upload metadata
api.post('/api/photos', async (req, res) => {
  const { seance_id, boutique_id, chemin_local, phase } = req.body;
  if (!seance_id || !boutique_id || !chemin_local || !phase) {
    return res.status(422).json({ error: 'seance_id, boutique_id, chemin_local, phase required' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO photos (seance_id, boutique_id, chemin_local, phase)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [seance_id, boutique_id, chemin_local, phase]
    );
    res.status(201).json({ data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Photos: update diagnostic
api.patch('/api/photos/:id', async (req, res) => {
  const { diagnostic_ia, modele_ia, latence_ms, synced } = req.body;
  try {
    const sets = [];
    const params = [];
    let i = 1;
    if (diagnostic_ia !== undefined) { sets.push(`diagnostic_ia = $${i++}`); params.push(JSON.stringify(diagnostic_ia)); }
    if (modele_ia !== undefined) { sets.push(`modele_ia = $${i++}`); params.push(modele_ia); }
    if (latence_ms !== undefined) { sets.push(`latence_ms = $${i++}`); params.push(latence_ms); }
    if (synced !== undefined) { sets.push(`synced = $${i++}`); params.push(synced); }
    params.push(req.params.id);

    const result = await pool.query(
      `UPDATE photos SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`,
      params
    );
    res.json({ data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mirror config
api.get('/api/miroirs/:id/config', async (req, res) => {
  try {
    const config = await pool.query(
      `SELECT cm.*, m.nom as miroir_nom, m.boutique_id
       FROM config_miroir cm JOIN miroirs m ON cm.miroir_id = m.id
       WHERE m.id = $1`,
      [req.params.id]
    );
    if (config.rows.length === 0) return res.status(404).json({ error: 'Mirror config not found' });

    const medias = await pool.query(
      `SELECT id, type, nom_fichier, chemin_serveur, checksum, ordre_affichage
       FROM medias WHERE boutique_id = $1 AND actif = true ORDER BY ordre_affichage`,
      [config.rows[0].boutique_id]
    );

    const produits = await pool.query(
      `SELECT id, nom, description, prix, image_url, tags, ordre_affichage
       FROM produits WHERE boutique_id = $1 AND affiche_miroir = true ORDER BY ordre_affichage`,
      [config.rows[0].boutique_id]
    );

    res.json({
      data: {
        config: config.rows[0],
        playlist: medias.rows,
        produits: produits.rows
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Heartbeat
api.post('/api/miroirs/:id/heartbeat', async (req, res) => {
  try {
    await pool.query(
      `UPDATE miroirs SET is_online = true, last_seen_at = NOW(), ip_address = $2 WHERE id = $1`,
      [req.params.id, req.body.ip || null]
    );
    res.json({ status: 'ok' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve PDF reports as static files
api.use('/api/rapports', express.static(RAPPORTS_DIR));

// Report: generate real PDF
api.post('/api/seances/:id/report', async (req, res) => {
  try {
    const seanceResult = await pool.query('SELECT s.*, c.prenom, c.nom, c.email FROM seances s LEFT JOIN clientes c ON s.cliente_id = c.id WHERE s.id = $1', [req.params.id]);
    if (seanceResult.rows.length === 0) return res.status(404).json({ error: 'Seance not found' });
    const seance = seanceResult.rows[0];

    const photosResult = await pool.query('SELECT * FROM photos WHERE seance_id = $1 ORDER BY created_at', [req.params.id]);
    const photos = photosResult.rows;

    const pdfPath = path.join(RAPPORTS_DIR, `${req.params.id}.pdf`);
    const reportUrl = `http://localhost:8100/api/rapports/${req.params.id}.pdf`;

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const stream = fs.createWriteStream(pdfPath);
    doc.pipe(stream);

    // Header
    doc.fontSize(24).font('Helvetica-Bold').text('K Beauty Cosmetics', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(16).font('Helvetica').text('Rapport de seance', { align: 'center' });
    doc.moveDown(1);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#E8C9B5');
    doc.moveDown(1);

    // Client info
    doc.fontSize(12).font('Helvetica-Bold').text('Client');
    doc.fontSize(11).font('Helvetica')
      .text(`Nom : ${seance.prenom || ''} ${seance.nom || ''}`)
      .text(`Date : ${new Date(seance.date_debut).toLocaleDateString('fr-FR')}`)
      .text(`Email : ${seance.email || 'Non renseigne'}`);
    doc.moveDown(1);

    // Diagnostic IA
    const diagPhoto = photos.find(p => p.diagnostic_ia);
    if (diagPhoto && diagPhoto.diagnostic_ia) {
      const diag = typeof diagPhoto.diagnostic_ia === 'string' ? JSON.parse(diagPhoto.diagnostic_ia) : diagPhoto.diagnostic_ia;
      doc.fontSize(12).font('Helvetica-Bold').text('Diagnostic IA');
      doc.moveDown(0.3);
      if (diag.score_global) {
        doc.fontSize(11).font('Helvetica').text(`Score global : ${diag.score_global}/100`);
      }
      if (diag.categories) {
        diag.categories.forEach(cat => {
          doc.text(`  - ${cat.nom} : ${cat.score}% (${cat.niveau})`);
        });
      }
      if (diag.commentaire) {
        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica-Oblique').text(diag.commentaire);
      }
      if (diag.produits_recommandes && diag.produits_recommandes.length > 0) {
        doc.moveDown(0.5);
        doc.fontSize(11).font('Helvetica-Bold').text('Produits recommandes :');
        diag.produits_recommandes.forEach(p => doc.font('Helvetica').text(`  - ${p}`));
      }
      doc.moveDown(1);
    }

    // Photos
    if (photos.length > 0) {
      doc.fontSize(12).font('Helvetica-Bold').text('Photos');
      doc.fontSize(10).font('Helvetica');
      photos.forEach(p => {
        doc.text(`  ${p.phase} - ${new Date(p.created_at).toLocaleString('fr-FR')}${p.diagnostic_ia ? ' (analysee)' : ''}`);
      });
      doc.moveDown(1);
    }

    // Note praticien
    if (seance.note_seance) {
      doc.fontSize(12).font('Helvetica-Bold').text('Note praticien');
      doc.fontSize(11).font('Helvetica').text(seance.note_seance);
      doc.moveDown(1);
    }

    // Footer
    doc.moveDown(2);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#E8C9B5');
    doc.moveDown(0.5);
    doc.fontSize(8).font('Helvetica').fillColor('#888')
      .text('Ce rapport est genere automatiquement par K Beauty Cosmetics. Les resultats sont a titre indicatif et ne constituent pas un avis medical.', { align: 'center' });

    doc.end();

    await new Promise(resolve => stream.on('finish', resolve));

    // Update seance with report URL
    await pool.query('UPDATE seances SET rapport_pdf_path = $1, rapport_url = $2 WHERE id = $3', [pdfPath, reportUrl, req.params.id]);

    res.json({ data: { url: reportUrl, generated: true, path: pdfPath } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// QR Code: generate QR pointing to the PDF report
api.get('/api/seances/:id/qrcode', async (req, res) => {
  try {
    const reportUrl = `http://localhost:8100/api/rapports/${req.params.id}.pdf`;
    const qrDataUrl = await QRCode.toDataURL(reportUrl, { width: 400, margin: 2 });
    res.json({ data: { qrcode: qrDataUrl, reportUrl } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Send report to CRM (mock: updates seance record)
api.post('/api/seances/:id/send-to-crm', async (req, res) => {
  try {
    const reportUrl = `http://localhost:8100/api/rapports/${req.params.id}.pdf`;
    await pool.query('UPDATE seances SET rapport_url = $1 WHERE id = $2', [reportUrl, req.params.id]);
    res.json({ data: { sent: true, reportUrl } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Seances: update (note_seance, bilan_ia)
api.patch('/api/seances/:id', async (req, res) => {
  const { note_seance, bilan_ia } = req.body;
  try {
    const sets = [];
    const params = [];
    let i = 1;
    if (note_seance !== undefined) { sets.push(`note_seance = $${i++}`); params.push(note_seance); }
    if (bilan_ia !== undefined) { sets.push(`note_seance = COALESCE(note_seance, '') || $${i++}`); params.push(JSON.stringify(bilan_ia)); }
    if (sets.length === 0) return res.status(422).json({ error: 'Nothing to update' });
    params.push(req.params.id);
    const result = await pool.query(
      `UPDATE seances SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`,
      params
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Seance not found' });
    res.json({ data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Sync endpoints (for CRM sync service) ---

// Get all unsynced records
api.get('/api/sync/pending', async (_req, res) => {
  try {
    const clientes = await pool.query('SELECT * FROM clientes WHERE synced_to_crm = FALSE ORDER BY created_at');
    const consentements = await pool.query('SELECT * FROM consentements WHERE synced_to_crm = FALSE ORDER BY date_consentement');
    const seances = await pool.query('SELECT * FROM seances WHERE synced_to_crm = FALSE ORDER BY date_debut');
    const photos = await pool.query('SELECT * FROM photos WHERE synced_to_crm = FALSE ORDER BY created_at');
    res.json({
      data: {
        clientes: clientes.rows,
        consentements: consentements.rows,
        seances: seances.rows,
        photos: photos.rows
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark records as synced
api.patch('/api/sync/confirm', async (req, res) => {
  const { table, ids } = req.body;
  const allowed = ['clientes', 'consentements', 'seances', 'photos'];
  if (!allowed.includes(table) || !Array.isArray(ids) || ids.length === 0) {
    return res.status(422).json({ error: 'table (clientes|consentements|seances|photos) and ids[] required' });
  }
  try {
    const result = await pool.query(
      `UPDATE ${table} SET synced_to_crm = TRUE WHERE id = ANY($1::uuid[]) RETURNING id`,
      [ids]
    );
    res.json({ data: { confirmed: result.rowCount } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cleanup synced records older than 30 days
api.delete('/api/sync/cleanup', async (_req, res) => {
  try {
    const tables = [
      { name: 'photos', dateCol: 'created_at' },
      { name: 'seances', dateCol: 'date_debut' },
      { name: 'consentements', dateCol: 'date_consentement' },
      { name: 'clientes', dateCol: 'created_at' }
    ];
    const report = {};
    for (const t of tables) {
      // Skip tables with FK dependencies if child records still exist
      const result = await pool.query(
        `DELETE FROM ${t.name} WHERE synced_to_crm = TRUE AND ${t.dateCol} < NOW() - INTERVAL '30 days' RETURNING id`
      ).catch(() => ({ rowCount: 0 }));
      report[t.name] = result.rowCount || 0;
    }
    res.json({ data: report });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Health check
api.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'mock-laravel-api' }));

const apiPort = parseInt(process.env.MOCK_API_PORT || '8000');
api.listen(apiPort, () => console.log(`Mock Laravel API on :${apiPort}`));


// --- Mock Express IA Proxy (port 3001) ---

const ia = express();
ia.use(cors());
ia.use(express.json({ limit: '50mb' }));

ia.post('/api/analyze', (req, res) => {
  const token = req.headers['x-mirror-token'];
  if (!token) return res.status(401).json({ error: 'X-Mirror-Token header required' });

  // Simulated IA response
  const categories = [
    { nom: 'Hydratation', score: Math.floor(Math.random() * 40) + 60, niveau: 'modere' },
    { nom: 'Sebum', score: Math.floor(Math.random() * 30) + 20, niveau: 'normal' },
    { nom: 'Pellicules', score: Math.floor(Math.random() * 20), niveau: 'faible' },
    { nom: 'Densite', score: Math.floor(Math.random() * 30) + 60, niveau: 'bon' },
    { nom: 'Irritation', score: Math.floor(Math.random() * 15), niveau: 'faible' }
  ];

  const commentaire = 'Le cuir chevelu presente un niveau d\'hydratation correct avec une legere tendance a la secheresse sur les zones temporales. La densite capillaire est dans la norme. Aucun signe notable d\'irritation.';

  const produits_recommandes = ['Shampoing Hydratant K-Beauty', 'Masque Revitalisant'];

  const latence = Math.floor(Math.random() * 800) + 200;

  setTimeout(() => {
    res.json({
      data: {
        categories,
        score_global: Math.floor(categories.reduce((a, c) => a + c.score, 0) / categories.length),
        commentaire,
        produits_recommandes,
        modele: 'google/gemini-flash-1.5',
        confiance: Math.floor(Math.random() * 20) + 75
      }
    });
  }, latence);
});

ia.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'mock-ia-proxy' }));

const iaPort = parseInt(process.env.MOCK_IA_PORT || '3001');
ia.listen(iaPort, () => console.log(`Mock IA Proxy on :${iaPort}`));
