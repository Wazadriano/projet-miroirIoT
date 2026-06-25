'use strict';

require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3002;

// GitHub Models free tier — models ordered by preference
// All available at https://models.inference.ai.azure.com (no billing required)
const GITHUB_MODELS_URL = 'https://models.inference.ai.azure.com/chat/completions';
const MODELS = [
  process.env.IA_MODEL || 'meta/Llama-3.2-11B-Vision-Instruct',
  'microsoft/Phi-3.5-vision-instruct',
  'openai/gpt-4o-mini',
];

const TIMEOUT_MS = 30000;  // 30s per spec
const MAX_RETRIES = 2;     // 2 retries per spec

// Cosmetic categories — no medical terminology (CNIL / positionnement cosmétique)
const CATEGORIES = [
  { id: 'cuir_chevelu_sec',       label: 'Cuir chevelu déshydraté' },
  { id: 'cuir_chevelu_gras',      label: 'Excès de sébum' },
  { id: 'pellicules_seches',      label: 'Pellicules sèches' },
  { id: 'pellicules_grasses',     label: 'Pellicules grasses' },
  { id: 'sensibilite_rougeurs',   label: 'Sensibilité et rougeurs' },
  { id: 'densite_faible',         label: 'Densité capillaire faible' },
  { id: 'affinement_capillaire',  label: 'Affinement capillaire progressif' },
  { id: 'cuir_chevelu_sain',      label: 'Cuir chevelu équilibré' },
];
const CATEGORIES_MAP = Object.fromEntries(CATEGORIES.map(c => [c.id, c.label]));

// Words forbidden in any model output (medical → cosmetic requalification risk)
const FORBIDDEN_WORDS = ['diagnostic', 'pathologie', 'maladie', 'traitement',
  'inflammation', 'alopécie', 'alopecie', 'dermatologue', 'médecin', 'medecin'];

app.use(cors());
app.use(express.json({ limit: '20mb' }));

// ------------------------------------------------------------------
// Auth middleware — every /api route requires X-Mirror-Token header
// ------------------------------------------------------------------
function authMiddleware(req, res, next) {
  const token = req.headers['x-mirror-token'];
  if (!token || token !== process.env.MIRROR_SHARED_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// ------------------------------------------------------------------
// GET /health — no auth
// ------------------------------------------------------------------
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'kbeauty-ia', models: MODELS, ts: new Date().toISOString() });
});

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------

function sanitizeOutput(text) {
  if (!text) return '';
  let result = String(text);
  for (const word of FORBIDDEN_WORDS) {
    const re = new RegExp(word, 'gi');
    result = result.replace(re, '[constat cosmétique]');
  }
  return result;
}

async function callModel(model, payload) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(GITHUB_MODELS_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + process.env.GITHUB_TOKEN,
      },
      body: JSON.stringify(Object.assign({}, payload, { model })),
    });
    clearTimeout(timer);
    return response;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

// Try each model in order; for each model attempt up to MAX_RETRIES times
// 5xx / timeout → retry; 4xx → skip to next model
async function analyzeWithFallback(payload) {
  let lastError;
  for (const model of MODELS) {
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await callModel(model, payload);
        if (response.ok) {
          const json = await response.json();
          return { json, model };
        }
        // 4xx: wrong request for this model — skip to next
        if (response.status < 500) {
          const body = await response.text().catch(() => '');
          lastError = new Error('HTTP ' + response.status + ' [' + model + ']: ' + body.slice(0, 100));
          break;
        }
        // 5xx: retry
        lastError = new Error('HTTP ' + response.status + ' (retry ' + attempt + ')');
      } catch (err) {
        lastError = err;
        if (err.name === 'AbortError') {
          console.warn('Model ' + model + ' timed out after ' + TIMEOUT_MS + 'ms');
          break; // try next model
        }
      }
    }
  }
  throw lastError || new Error('All models failed');
}

// ------------------------------------------------------------------
// POST /api/analyze
// Body  : { image: '<base64 jpeg>', zone: 'cuir_chevelu' | 'cheveux' }
// Returns: { diagnostic_ia, modele_ia, confiance, latence_ms, statut, raison? }
//   statut: 'ok' | 'a_confirmer' | 'non_concluant'
// ------------------------------------------------------------------
app.post('/api/analyze', authMiddleware, async (req, res) => {
  const image = req.body.image;
  const zone  = req.body.zone || 'cuir_chevelu';

  if (!image || typeof image !== 'string') {
    return res.status(400).json({ error: 'image (base64 string) is required' });
  }

  const zoneLabel = zone === 'cuir_chevelu' ? 'cuir chevelu' : 'cheveux sur les longueurs';
  const catList   = CATEGORIES.map(c => c.id + ' (' + c.label + ')').join(', ');

  const systemPrompt =
    'Tu es un expert en cosmétologie capillaire. ' +
    'Tu produis uniquement des constats observationnels cosmétiques et de bien-être. ' +
    'Tu ne fournis AUCUN constat médical, aucune référence médicale. ' +
    'Réponds UNIQUEMENT avec un objet JSON valide, sans markdown ni texte autour.';

  const userPrompt =
    'Analyse cette photo de ' + zoneLabel + '.\n\n' +
    'Identifie les catégories cosmétiques observées parmi : ' + catList + '.\n\n' +
    'Retourne exactement ce JSON :\n' +
    '{\n' +
    '  "categories_detectees": ["id1", "id2"],\n' +
    '  "score_global": 0-100,\n' +
    '  "commentaire": "bilan cosmétique observationnel 2-3 phrases",\n' +
    '  "produits_recommandes": ["produit1", "produit2"],\n' +
    '  "raison_non_concluant": null,\n' +
    '  "confiance": 0-100\n' +
    '}\n\n' +
    'Contraintes :\n' +
    '- produits_recommandes : maximum 3 entrées\n' +
    '- si la photo est floue, mal éclairée ou hors-sujet : confiance < 60 et raison_non_concluant renseignée\n' +
    '- registre cosmétique uniquement, aucun terme médical';

  const payload = {
    messages: [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: [
          { type: 'text', text: userPrompt },
          { type: 'image_url', image_url: { url: 'data:image/jpeg;base64,' + image, detail: 'low' } },
        ],
      },
    ],
    max_tokens: 600,
    temperature: 0.2,
  };

  const start = Date.now();

  try {
    const { json, model } = await analyzeWithFallback(payload);
    const latence_ms = Date.now() - start;

    const raw = (json.choices[0].message.content || '').trim();
    const jsonStart = raw.indexOf('{');
    const jsonEnd   = raw.lastIndexOf('}');
    if (jsonStart === -1 || jsonEnd === -1) {
      console.error('No JSON block in model response:', raw.slice(0, 200));
      return res.status(502).json({ error: 'Model returned unparseable response' });
    }

    const parsed = JSON.parse(raw.slice(jsonStart, jsonEnd + 1));
    const confiance = parsed.confiance != null ? Number(parsed.confiance) : 0;

    // Enforce confidence threshold — per spec section 8.5
    if (confiance < 60) {
      return res.json({
        diagnostic_ia: null,
        modele_ia: model,
        confiance,
        latence_ms,
        statut: 'non_concluant',
        raison: sanitizeOutput(parsed.raison_non_concluant) || 'Qualité photo insuffisante pour une analyse fiable.',
      });
    }

    // Map detected category IDs to {id, label} objects; ignore unknown IDs
    const detectedIds = Array.isArray(parsed.categories_detectees) ? parsed.categories_detectees : [];
    const categories  = detectedIds
      .filter(id => CATEGORIES_MAP[id])
      .map(id => ({ id, label: CATEGORIES_MAP[id] }));

    const produits   = (parsed.produits_recommandes || []).slice(0, 3);
    const commentaire = sanitizeOutput(parsed.commentaire || '');
    const statut = confiance >= 80 ? 'ok' : 'a_confirmer';

    return res.json({
      diagnostic_ia: {
        categories,
        score_global: parsed.score_global != null ? Number(parsed.score_global) : 0,
        commentaire,
        produits_recommandes: produits,
      },
      modele_ia: model,
      confiance,
      latence_ms,
      statut,
    });
  } catch (err) {
    const latence_ms = Date.now() - start;
    console.error('IA analyze error (' + latence_ms + 'ms):', err && err.message);
    return res.status(500).json({ error: 'IA analysis failed', detail: err && err.message });
  }
});

// ------------------------------------------------------------------
app.listen(port, () => {
  console.log('KBeauty IA service ready on port ' + port + ' — models: ' + MODELS.join(', '));
});
