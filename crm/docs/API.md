# KBeauty Mirror CRM — API Documentation

Base URL : `https://api-kbeauty.a3n.fr` (production) · `http://localhost:8000` (local)

All endpoints return JSON. Dates are ISO 8601 (`2026-04-03T14:30:00.000000Z`).

---

## Authentication

Three authentication strategies coexist:

| Strategy                   | Header                              | Used by             |
| -------------------------- | ----------------------------------- | ------------------- |
| **User token** (Sanctum)   | `Authorization: Bearer <token>`     | CRM frontend        |
| **Device token** (Sanctum) | `Authorization: Bearer <token>`     | Smart mirror device |
| **Static token**           | `Authorization: Bearer <N8N_TOKEN>` | n8n automation      |

---

## Public endpoints

No authentication required.

### POST `/api/login`

Authenticate a CRM user and retrieve a bearer token.

**Body**

```json
{
  "email": "admin@kbeauty.fr",
  "password": "secret"
}
```

**Response 200**

```json
{
  "token": "1|abcdef...",
  "user": {
    "id": "uuid",
    "name": "Admin Kbeauty",
    "email": "admin@kbeauty.fr",
    "is_admin": true,
    "role": "gerant"
  }
}
```

**Response 422** — invalid credentials

```json
{
  "message": "Identifiants incorrects.",
  "errors": { "email": ["Identifiants incorrects."] }
}
```

---

### POST `/api/forgot-password`

Request a password reset link. Always returns 200 to prevent email enumeration. Throttled to 1 request per 60 s per address.

**Body**

```json
{ "email": "user@example.com" }
```

**Response 200**

```json
{ "message": "Si cette adresse existe, un email a été envoyé." }
```

---

### POST `/api/reset-password`

Set a new password using the token received by email.

**Body**

```json
{
  "email": "user@example.com",
  "token": "64-char-random-token",
  "password": "newpassword",
  "password_confirmation": "newpassword"
}
```

**Response 200**

```json
{ "message": "Mot de passe réinitialisé avec succès." }
```

**Response 422** — invalid or expired token

```json
{ "message": "Token invalide ou expiré." }
```

---

### POST `/api/miroir/auth`

Authenticate a smart mirror device. Returns a Sanctum device token valid for 1 year.

**Body**

```json
{
  "adresse_mac": "AA:BB:CC:DD:EE:FF",
  "token_device": "device-secret-token"
}
```

**Response 200**

```json
{
  "token": "...",
  "miroir": {
    "id": "uuid",
    "nom": "Miroir Paris 1",
    "boutique_id": "uuid"
  }
}
```

**Response 401** — device not recognized

```json
{ "message": "Miroir non reconnu" }
```

---

### GET `/api/rapports/{seance}/scan`

Public QR code endpoint. Records the first scan time on the session, then returns the report URL.

**Response 200**

```json
{
  "seance_id": "uuid",
  "scanne": true,
  "rapport_url": "https://api-kbeauty.a3n.fr/pdf/rapport-uuid.pdf"
}
```

---

## CRM endpoints

Require `Authorization: Bearer <user-token>` from `POST /api/login`.

The optional header `X-Boutique-Id` scopes list responses to a single boutique. Pass `all` (or omit) for all boutiques the user has access to.

---

### GET `/api/me`

Returns the authenticated user.

**Response 200**

```json
{
  "id": "uuid",
  "name": "Sophie Martin",
  "email": "sophie@kbeauty.fr",
  "is_admin": false,
  "role": "gerant"
}
```

---

### POST `/api/logout`

Revoke the current token.

**Response 204** — no content

---

### GET `/api/dashboard/stats`

Global statistics for all boutiques accessible by the user.

**Response 200**

```json
{
  "age_distribution": [{ "tranche": "26-35", "count": 42 }],
  "gender_distribution": [{ "sexe": "F", "count": 118 }],
  "clients_per_boutique": [{ "id": "uuid", "nom": "Paris", "count": 65 }],
  "total_clients": 187,
  "seances_today": 3,
  "seances_month": 47,
  "miroirs_total": 4,
  "miroirs_online": 3,
  "offline_miroirs": [],
  "weekly_seances": { "2026-04-01": 5, "2026-04-02": 8 }
}
```

---

## Clients (`/api/clientes`)

### GET `/api/clientes`

Paginated client list for the user's boutique(s).

**Query params**

| Param    | Type   | Description                                |
| -------- | ------ | ------------------------------------------ |
| `page`   | int    | Page number (default: 1)                   |
| `search` | string | Full-text search across name, email, phone |

**Response 200**

```json
{
  "data": [
    {
      "id": "uuid",
      "boutique_id": "uuid",
      "prenom": "Marie",
      "nom": "Dupont",
      "email": "marie@example.com",
      "telephone": "+33612345678",
      "date_de_naissance": "1990-05-15",
      "sexe": "F",
      "note_praticien": null,
      "shopify_customer_id": null,
      "created_at": "2026-04-01T10:00:00Z",
      "boutique": { "id": "uuid", "nom": "Paris" }
    }
  ],
  "current_page": 1,
  "last_page": 5,
  "total": 120,
  "per_page": 25
}
```

---

### GET `/api/clientes/all`

Cross-boutique paginated list (super-admin sees all boutiques).

**Query params** : `page`, `search`, `sexe` (`F`|`M`), `boutique_id`, `sort_by` (`nom`|`prenom`|`created_at`|`date_de_naissance`), `sort_dir` (`asc`|`desc`)

**Response 200** — same paginated structure as above.

---

### POST `/api/clientes`

Create a new client. Requires `role: gerant`.

**Body**

```json
{
  "prenom": "Marie",
  "nom": "Dupont",
  "email": "marie@example.com",
  "telephone": "+33612345678",
  "date_de_naissance": "1990-05-15",
  "sexe": "F",
  "note_praticien": "Cuir chevelu sensible",
  "boutique_id": "uuid"
}
```

**Response 201** — created client object.

---

### GET `/api/clientes/{id}`

Get a single client by ID.

**Response 200** — client object. **Response 403** if outside user's boutiques.

---

### PUT `/api/clientes/{id}`

Update a client. Requires `role: gerant`. Same body as POST (all fields optional).

**Response 200** — updated client object.

---

### DELETE `/api/clientes/{id}`

Delete a client. Requires `role: gerant`.

**Response 204** — no content.

---

### GET `/api/clientes/{id}/seances`

Paginated sessions for a client.

**Response 200** — paginated sessions with `photos` relationship loaded.

---

### GET `/api/clientes/detail/{id}`

Cross-boutique client detail (super-admin).

### PUT `/api/clientes/detail/{id}`

Cross-boutique client update (super-admin).

### GET `/api/clientes/detail/{id}/seances`

Cross-boutique client sessions (super-admin).

### GET `/api/clientes/detail/{id}/consentements`

List GDPR consents for a client. Requires `role: gerant`.

### GET `/api/clientes/detail/{id}/export-rgpd`

Download a GDPR data export for a client. Requires `role: gerant`.

### POST `/api/clientes/detail/{id}/anonymiser`

Anonymise (GDPR right to erasure) a client. Requires `role: gerant`.

**Response 200**

```json
{ "message": "Client anonymisé avec succès." }
```

### GET `/api/clientes/export/csv`

Download CSV export of all clients (cross-boutique). Same filters as `GET /api/clientes/all`.

**Response 200** — `text/csv` attachment.

---

## Sessions (`/api/seances`)

### GET `/api/seances`

Paginated session list for the user's boutique(s), ordered by descending date.

**Response 200** — paginated sessions with `cliente`, `miroir`, `boutique` loaded.

---

### GET `/api/seances/{id}`

Get a full session with all relationships (`cliente`, `miroir`, `consentement`, `photos`).

**Response 200**

```json
{
  "id": "uuid",
  "boutique_id": "uuid",
  "miroir_id": "uuid",
  "cliente_id": "uuid",
  "date_debut": "2026-04-03T10:00:00Z",
  "date_fin": "2026-04-03T10:30:00Z",
  "note_seance": null,
  "rapport_pdf_path": "pdf/rapport-uuid.pdf",
  "rapport_url": "https://api-kbeauty.a3n.fr/pdf/rapport-uuid.pdf",
  "qr_scanne_at": null,
  "email_envoye": false,
  "bilan_ia": { "categories": [], "score_global": 85, "commentaire": "..." },
  "cliente": { ... },
  "miroir": { ... },
  "photos": [ ... ]
}
```

---

### POST `/api/seances/{id}/trigger-n8n`

Manually trigger the n8n automation webhook for a session. Requires `role: gerant`.

**Response 200**

```json
{ "message": "Webhook N8N déclenché", "status": 200 }
```

---

### PATCH `/api/photos/{id}/diagnostic`

Update the AI diagnostic result for a photo.

**Body**

```json
{
  "diagnostic_ia": {
    "categories": [
      { "id": "cuir_chevelu_sec", "label": "Cuir chevelu déshydraté" }
    ],
    "score_global": 72,
    "commentaire": "Cuir chevelu présentant des signes de déshydratation.",
    "produits_recommandes": ["Sérum hydratant"]
  },
  "confiance": 85,
  "statut": "ok"
}
```

**Response 200** — updated photo object.

---

## Products (`/api/produits`)

### GET `/api/produits`

List products for the user's boutique(s).

### POST `/api/produits`

Create a product. Requires `role: gerant`.

### PUT/PATCH/DELETE `/api/produits/{id}`

Update or delete a product. Requires `role: gerant`.

### POST `/api/produits/sync-shopify`

Synchronize products from Shopify. Requires `role: gerant` and `SHOPIFY_DOMAIN`/`SHOPIFY_ACCESS_TOKEN` configured.

**Response 200**

```json
{ "message": "Synchronisation terminée", "synced": 42, "errors": 0 }
```

---

## Mirrors (`/api/miroirs`)

CRUD resource. Requires `role: gerant`.

`GET /api/miroirs` · `POST /api/miroirs` · `GET /api/miroirs/{id}` · `PUT /api/miroirs/{id}` · `DELETE /api/miroirs/{id}`

Mirror object:

```json
{
  "id": "uuid",
  "boutique_id": "uuid",
  "nom": "Miroir Paris 1",
  "adresse_mac": "AA:BB:CC:DD:EE:FF",
  "token_device": "...",
  "en_ligne": true,
  "derniere_activite": "2026-04-03T14:00:00Z"
}
```

---

## Mirror Config (`/api/config-miroir`)

### GET `/api/config-miroir`

Get global mirror configuration (logo, colors, display settings). Requires `role: gerant`.

### PATCH `/api/config-miroir`

Update mirror configuration. Requires `role: gerant`.

---

## Media Library (`/api/medias`)

CRUD resource. Requires `role: gerant`.

`GET /api/medias` · `POST /api/medias` (multipart) · `GET /api/medias/{id}` · `PUT /api/medias/{id}` · `DELETE /api/medias/{id}`

### PATCH `/api/medias/reorder`

Reorder media items.

**Body**

```json
{ "ids": ["uuid1", "uuid2", "uuid3"] }
```

---

## Boutiques (`/api/boutiques`)

### GET `/api/boutiques/list`

List all boutiques (id + nom). Available to any authenticated user.

**Response 200**

```json
[
  { "id": "uuid", "nom": "Kbeauty Paris" },
  { "id": "uuid", "nom": "Kbeauty Lyon" }
]
```

Full CRUD (`GET`, `POST`, `PUT`, `DELETE`) on `/api/boutiques` requires `role: super-admin`.

---

## Team (`/api/users`)

Requires `role: gerant`.

`GET /api/users` · `PUT /api/users/{id}` · `DELETE /api/users/{id}`

---

## Exports (`/api/export`)

### GET `/api/export/csv`

Download a CSV export for the user's boutique.

**Query params** : `type` = `clientes` (default) or `seances`

**Response 200** — `text/csv` attachment.

### POST `/api/export/shopify`

Export data to Shopify (pending implementation).

**Response 501**

```json
{ "message": "Export Shopify non encore implémenté" }
```

---

## GDPR (`/api/consentements`)

### PATCH `/api/consentements/{id}/revoquer`

Revoke a GDPR consent. Requires `role: gerant`.

---

## Mirror device endpoints (`/api/miroir/*`)

These endpoints use the device token issued by `POST /api/miroir/auth`.

| Method  | Endpoint                           | Description                                |
| ------- | ---------------------------------- | ------------------------------------------ |
| `GET`   | `/api/miroir/clientes`             | Search clients by boutique                 |
| `POST`  | `/api/miroir/clientes`             | Create a client                            |
| `POST`  | `/api/miroir/consentements`        | Record GDPR consent                        |
| `POST`  | `/api/miroir/seances`              | Start a new session                        |
| `PATCH` | `/api/miroir/seances/{id}`         | Update session metadata                    |
| `POST`  | `/api/miroir/seances/{id}/fin`     | Close a session and trigger PDF generation |
| `GET`   | `/api/miroir/seances/{id}`         | Get session details                        |
| `GET`   | `/api/miroir/seances/{id}/rapport` | Get the PDF report for a session           |
| `POST`  | `/api/miroir/photos`               | Upload a photo (multipart, max 200 MB)     |
| `PATCH` | `/api/miroir/photos/{id}`          | Update photo metadata / AI result          |
| `GET`   | `/api/miroir/config`               | Get active mirror configuration            |
| `POST`  | `/api/miroir/heartbeat`            | Signal that the device is online           |
| `POST`  | `/api/miroir/offline`              | Signal that the device is going offline    |
| `GET`   | `/api/miroir/produits`             | List products for the boutique             |

---

## n8n automation endpoints (`/api/n8n/*`)

Require `Authorization: Bearer <N8N_TOKEN>` (static token from `N8N_TOKEN` env variable).

| Method   | Endpoint                             | Description                                      |
| -------- | ------------------------------------ | ------------------------------------------------ |
| `GET`    | `/api/n8n/seances/{id}/bilan`        | Get AI analysis summary for a session            |
| `PATCH`  | `/api/n8n/seances/{id}/rapport`      | Attach a generated PDF report to a session       |
| `GET`    | `/api/n8n/seances/non-scannees`      | List sessions whose QR code has not been scanned |
| `PATCH`  | `/api/n8n/seances/{id}/email-envoye` | Mark a session's report email as sent            |
| `GET`    | `/api/n8n/photos/a-supprimer`        | List photos eligible for server-side deletion    |
| `DELETE` | `/api/n8n/photos/{id}/serveur`       | Delete a photo file from storage                 |

---

## IA Service — standalone microservice

Base URL: `https://ia-kbeauty.a3n.fr` (production) · `http://localhost:3002` (local)

All `/api/*` routes require the header `X-Mirror-Token: <MIRROR_SHARED_SECRET>`.

---

### GET `/health`

Health check (no auth).

**Response 200**

```json
{
  "status": "ok",
  "service": "kbeauty-ia",
  "models": [
    "meta/Llama-3.2-11B-Vision-Instruct",
    "microsoft/Phi-3.5-vision-instruct",
    "openai/gpt-4o-mini"
  ],
  "ts": "2026-04-03T14:00:00.000Z"
}
```

---

### POST `/api/analyze`

Analyze a scalp or hair photo using a multi-model AI pipeline with automatic fallback.

**Headers**

```
X-Mirror-Token: <MIRROR_SHARED_SECRET>
Content-Type: application/json
```

**Body**

```json
{
  "image": "<base64-encoded JPEG>",
  "zone": "cuir_chevelu"
}
```

| Field   | Type   | Required | Values                                |
| ------- | ------ | -------- | ------------------------------------- |
| `image` | string | Yes      | Base64-encoded JPEG, max ~15 MB       |
| `zone`  | string | No       | `cuir_chevelu` (default) or `cheveux` |

**Response 200 — `statut: ok` or `a_confirmer`**

```json
{
  "diagnostic_ia": {
    "categories": [
      { "id": "cuir_chevelu_sec", "label": "Cuir chevelu déshydraté" }
    ],
    "score_global": 72,
    "commentaire": "Cuir chevelu présentant des signes de déshydratation modérée.",
    "produits_recommandes": [
      "Sérum hydratant intensif",
      "Shampoing doux hydratant"
    ]
  },
  "modele_ia": "openai/gpt-4o-mini",
  "confiance": 82,
  "latence_ms": 1240,
  "statut": "ok"
}
```

**Response 200 — `statut: non_concluant`** (confidence < 60)

```json
{
  "diagnostic_ia": null,
  "modele_ia": "openai/gpt-4o-mini",
  "confiance": 45,
  "latence_ms": 980,
  "statut": "non_concluant",
  "raison": "Qualité photo insuffisante pour une analyse fiable."
}
```

**Response 400** — missing or invalid image

```json
{ "error": "image (base64 string) is required" }
```

**Response 401** — missing or invalid token

```json
{ "error": "Unauthorized" }
```

**Response 500** — all AI models failed

```json
{ "error": "IA analysis failed", "detail": "HTTP 503 (retry 2)" }
```

#### AI Categories

| ID                      | Label                            |
| ----------------------- | -------------------------------- |
| `cuir_chevelu_sec`      | Cuir chevelu déshydraté          |
| `cuir_chevelu_gras`     | Excès de sébum                   |
| `pellicules_seches`     | Pellicules sèches                |
| `pellicules_grasses`    | Pellicules grasses               |
| `sensibilite_rougeurs`  | Sensibilité et rougeurs          |
| `densite_faible`        | Densité capillaire faible        |
| `affinement_capillaire` | Affinement capillaire progressif |
| `cuir_chevelu_sain`     | Cuir chevelu équilibré           |

---

## Error format

All errors follow the same envelope:

```json
{
  "message": "Human-readable error message",
  "errors": {
    "field": ["Validation error detail"]
  }
}
```

| HTTP code | Meaning                              |
| --------- | ------------------------------------ |
| `400`     | Bad request / validation error       |
| `401`     | Not authenticated                    |
| `403`     | Authenticated but not authorized     |
| `404`     | Resource not found                   |
| `422`     | Unprocessable entity (business rule) |
| `429`     | Too many requests                    |
| `500`     | Internal server error                |
| `501`     | Not implemented                      |
