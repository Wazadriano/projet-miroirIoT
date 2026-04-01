const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

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
    res.json({ token, mirror: result.rows[0] });
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
  const { boutique_id, prenom, nom, email, telephone, age, sexe } = req.body;
  if (!boutique_id || !prenom || !nom) {
    return res.status(422).json({ error: 'boutique_id, prenom, nom required' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO clientes (boutique_id, prenom, nom, email, telephone, age, sexe)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [boutique_id, prenom, nom, email || null, telephone || null, age || null, sexe || null]
    );
    res.status(201).json({ data: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Client with this email already exists in this boutique' });
    }
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
