// Tests d integration du verrou RGPD de consentement (bloc BC04 - qualite/tests).
//
// Objectif : prouver, sans PostgreSQL reel, que la route POST /api/seances refuse
// la creation d une seance (donc toute capture/upload de photo rattachee) SANS
// consentement valide, et l autorise AVEC un consentement horodate non revoque.
//
// Infra : runner natif `node:test` + `node:assert` (zero dependance ajoutee). On
// monte l app Express exportee sur un port ephemere et on substitue `pool.query`
// par un faux qui simule l etat de la table consentements.

const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { api, pool } = require('./server.js');

let server;
let baseUrl;

// File d attente de reponses simulees pour pool.query, consommee dans l ordre.
let queryQueue = [];
const queryCalls = [];

before(async () => {
  // Substitue l acces DB : aucune connexion PostgreSQL n est ouverte.
  pool.query = async (sql, params) => {
    queryCalls.push({ sql, params });
    if (queryQueue.length === 0) {
      throw new Error('pool.query appele sans reponse simulee en file');
    }
    const next = queryQueue.shift();
    if (next instanceof Error) throw next;
    return next;
  };

  await new Promise((resolve) => {
    server = api.listen(0, () => resolve());
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

beforeEach(() => {
  queryQueue = [];
  queryCalls.length = 0;
});

function postSeance(body) {
  return fetch(`${baseUrl}/api/seances`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
}

const VALID_BODY = {
  boutique_id: 'b1',
  miroir_id: 'm1',
  cliente_id: 'c1',
  consentement_id: 'cons-1'
};

test('REFUS : aucune seance sans consentement_id (RGPD obligatoire)', async () => {
  const { boutique_id, miroir_id, cliente_id } = VALID_BODY; // pas de consentement_id
  const res = await postSeance({ boutique_id, miroir_id, cliente_id });

  assert.equal(res.status, 422);
  const json = await res.json();
  assert.match(json.error, /consentement_id required/);
  assert.match(json.error, /RGPD consent mandatory/);
  // La DB n a meme pas ete sollicitee : le verrou agit avant toute insertion.
  assert.equal(queryCalls.length, 0);
});

test('REFUS : consentement_id fourni mais introuvable ou revoque', async () => {
  // 1er query (verification du consentement) renvoie 0 ligne => revoque/inexistant.
  queryQueue.push({ rows: [] });

  const res = await postSeance(VALID_BODY);

  assert.equal(res.status, 422);
  const json = await res.json();
  assert.match(json.error, /Invalid or revoked consent/);
  // Une seule query (la verification) : aucune insertion de seance n a eu lieu.
  assert.equal(queryCalls.length, 1);
  assert.match(queryCalls[0].sql, /FROM consentements/);
  assert.match(queryCalls[0].sql, /date_revocation IS NULL/);
});

test('AUTORISE : consentement horodate non revoque => seance creee (201)', async () => {
  const createdSeance = {
    id: 'seance-1',
    boutique_id: 'b1',
    miroir_id: 'm1',
    cliente_id: 'c1',
    consentement_id: 'cons-1',
    date_debut: '2026-06-25T10:00:00.000Z'
  };
  // 1) verification consentement : 1 ligne (valide, non revoque)
  queryQueue.push({ rows: [{ id: 'cons-1' }] });
  // 2) insertion de la seance
  queryQueue.push({ rows: [createdSeance] });

  const res = await postSeance(VALID_BODY);

  assert.equal(res.status, 201);
  const json = await res.json();
  assert.equal(json.data.id, 'seance-1');
  assert.equal(json.data.consentement_id, 'cons-1');

  // Le verrou a bien verifie le consentement AVANT d inserer la seance.
  assert.equal(queryCalls.length, 2);
  assert.match(queryCalls[0].sql, /SELECT id FROM consentements/);
  assert.deepEqual(queryCalls[0].params, ['cons-1']);
  assert.match(queryCalls[1].sql, /INSERT INTO seances/);
});

// Verrou amont : consent-valid renvoie l etat horodate consomme par le device
// avant d autoriser la capture cote miroir.
test('consent-valid : valid=false quand aucun consentement < 30 jours', async () => {
  queryQueue.push({ rows: [] });
  const res = await fetch(`${baseUrl}/api/clientes/c1/consent-valid`);
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.data.valid, false);
  assert.match(queryCalls[0].sql, /INTERVAL '30 days'/);
});

test('consent-valid : valid=true avec consentement horodate recent', async () => {
  queryQueue.push({ rows: [{ id: 'cons-1', date_consentement: '2026-06-20T09:00:00.000Z' }] });
  const res = await fetch(`${baseUrl}/api/clientes/c1/consent-valid`);
  const json = await res.json();
  assert.equal(json.data.valid, true);
  assert.equal(json.data.consent.id, 'cons-1');
});
