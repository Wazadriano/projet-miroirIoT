-- Smart Mirror - Dev database schema
-- Mirrors the Laravel production schema for local development

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE boutiques (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nom TEXT NOT NULL,
    email_contact TEXT,
    shopify_domain TEXT,
    shopify_access_token TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE clientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    boutique_id UUID NOT NULL REFERENCES boutiques(id),
    prenom TEXT NOT NULL,
    nom TEXT NOT NULL,
    email TEXT,
    telephone TEXT,
    age INTEGER,
    sexe TEXT CHECK (sexe IN ('F', 'M', 'autre')),
    note_praticien TEXT,
    shopify_customer_id TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (email, boutique_id)
);

CREATE TABLE consentements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    boutique_id UUID NOT NULL REFERENCES boutiques(id),
    cliente_id UUID NOT NULL REFERENCES clientes(id),
    texte_consent TEXT NOT NULL,
    date_consentement TIMESTAMP NOT NULL DEFAULT NOW(),
    date_revocation TIMESTAMP
);

CREATE TABLE miroirs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    boutique_id UUID NOT NULL REFERENCES boutiques(id),
    nom TEXT NOT NULL,
    device_token TEXT,
    is_online BOOLEAN DEFAULT FALSE,
    last_seen_at TIMESTAMP,
    firmware_version TEXT,
    ip_address TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE seances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    boutique_id UUID NOT NULL REFERENCES boutiques(id),
    miroir_id UUID NOT NULL REFERENCES miroirs(id),
    cliente_id UUID NOT NULL REFERENCES clientes(id),
    consentement_id UUID NOT NULL REFERENCES consentements(id),
    date_debut TIMESTAMP NOT NULL DEFAULT NOW(),
    date_fin TIMESTAMP,
    note_seance TEXT,
    rapport_pdf_path TEXT,
    rapport_url TEXT,
    qr_scanne_at TIMESTAMP,
    email_envoye BOOLEAN DEFAULT FALSE
);

CREATE TABLE photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seance_id UUID NOT NULL REFERENCES seances(id) ON DELETE CASCADE,
    boutique_id UUID NOT NULL REFERENCES boutiques(id),
    chemin_local TEXT NOT NULL,
    chemin_serveur TEXT,
    phase TEXT NOT NULL CHECK (phase IN ('avant', 'apres')),
    diagnostic_ia JSONB,
    modele_ia TEXT,
    latence_ms INTEGER,
    synced BOOLEAN DEFAULT FALSE,
    supprime_local_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE produits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    boutique_id UUID NOT NULL REFERENCES boutiques(id),
    nom TEXT NOT NULL,
    description TEXT,
    prix NUMERIC(10,2),
    image_url TEXT,
    shopify_product_id TEXT,
    tags TEXT[],
    affiche_miroir BOOLEAN DEFAULT TRUE,
    ordre_affichage INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE medias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    boutique_id UUID NOT NULL REFERENCES boutiques(id),
    type TEXT NOT NULL CHECK (type IN ('video', 'image')),
    nom_fichier TEXT NOT NULL,
    chemin_serveur TEXT NOT NULL,
    taille_octets BIGINT,
    checksum TEXT,
    actif BOOLEAN DEFAULT TRUE,
    ordre_affichage INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE config_miroir (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    miroir_id UUID NOT NULL REFERENCES miroirs(id) UNIQUE,
    couleur_primaire TEXT DEFAULT '#000000',
    couleur_secondaire TEXT DEFAULT '#FFFFFF',
    police TEXT DEFAULT 'Inter',
    logo_url TEXT,
    fond_anime_actif BOOLEAN DEFAULT TRUE,
    fond_anime_theme TEXT DEFAULT 'particles',
    volume INTEGER DEFAULT 70 CHECK (volume >= 0 AND volume <= 100),
    mode_media TEXT DEFAULT 'fullscreen' CHECK (mode_media IN ('fullscreen', 'side_panel', 'hidden')),
    texte_consentement TEXT,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_clientes_boutique ON clientes(boutique_id);
CREATE INDEX idx_clientes_nom ON clientes(boutique_id, nom, prenom);
CREATE INDEX idx_seances_boutique ON seances(boutique_id);
CREATE INDEX idx_seances_cliente ON seances(cliente_id);
CREATE INDEX idx_photos_seance ON photos(seance_id);
CREATE INDEX idx_photos_synced ON photos(synced) WHERE synced = FALSE;
CREATE INDEX idx_medias_boutique ON medias(boutique_id);

-- Seed data: 3 boutiques
INSERT INTO boutiques (id, nom, email_contact) VALUES
    ('a1b2c3d4-0001-4000-8000-000000000001', 'K Beauty Nice', 'nice@kbeauty.fr'),
    ('a1b2c3d4-0002-4000-8000-000000000002', 'K Beauty Lyon', 'lyon@kbeauty.fr'),
    ('a1b2c3d4-0003-4000-8000-000000000003', 'K Beauty Cannes', 'cannes@kbeauty.fr');

-- Seed: 1 miroir par boutique
INSERT INTO miroirs (id, boutique_id, nom) VALUES
    ('b1b2c3d4-0001-4000-8000-000000000001', 'a1b2c3d4-0001-4000-8000-000000000001', 'Miroir Nice 1'),
    ('b1b2c3d4-0002-4000-8000-000000000002', 'a1b2c3d4-0002-4000-8000-000000000002', 'Miroir Lyon 1'),
    ('b1b2c3d4-0003-4000-8000-000000000003', 'a1b2c3d4-0003-4000-8000-000000000003', 'Miroir Cannes 1');

-- Seed: config par defaut pour chaque miroir
INSERT INTO config_miroir (miroir_id) VALUES
    ('b1b2c3d4-0001-4000-8000-000000000001'),
    ('b1b2c3d4-0002-4000-8000-000000000002'),
    ('b1b2c3d4-0003-4000-8000-000000000003');

-- Seed: quelques clientes de test
INSERT INTO clientes (boutique_id, prenom, nom, email, age, sexe) VALUES
    ('a1b2c3d4-0001-4000-8000-000000000001', 'Marie', 'Dupont', 'marie@test.fr', 34, 'F'),
    ('a1b2c3d4-0001-4000-8000-000000000001', 'Sophie', 'Martin', 'sophie@test.fr', 28, 'F'),
    ('a1b2c3d4-0002-4000-8000-000000000002', 'Julie', 'Bernard', 'julie@test.fr', 42, 'F');

-- Seed: produits de test
INSERT INTO produits (boutique_id, nom, description, prix, tags) VALUES
    ('a1b2c3d4-0001-4000-8000-000000000001', 'Shampoing Hydratant K-Beauty', 'Soin hydratant pour cuir chevelu sec', 24.90, ARRAY['hydratation', 'cuir_chevelu_sec']),
    ('a1b2c3d4-0001-4000-8000-000000000001', 'Masque Revitalisant', 'Masque intensif pour cheveux abimes', 32.50, ARRAY['revitalisant', 'cheveux_abimes']),
    ('a1b2c3d4-0001-4000-8000-000000000001', 'Serum Anti-Pelliculaire', 'Traitement anti-pelliculaire doux', 19.90, ARRAY['antipelliculaire', 'cuir_chevelu_gras']);

-- Seed: medias de test (images placeholder pour la playlist)
INSERT INTO medias (boutique_id, type, nom_fichier, chemin_serveur, taille_octets, checksum, actif, ordre_affichage) VALUES
    ('a1b2c3d4-0001-4000-8000-000000000001', 'image', 'promo-soin-hydratant.jpg', 'https://placehold.co/1920x1080/1a1a2e/e0e0e0?text=Soin+Hydratant+K-Beauty', 102400, 'placeholder-1', TRUE, 1),
    ('a1b2c3d4-0001-4000-8000-000000000001', 'image', 'promo-masque.jpg', 'https://placehold.co/1920x1080/2d1b69/e0e0e0?text=Masque+Revitalisant', 102400, 'placeholder-2', TRUE, 2),
    ('a1b2c3d4-0001-4000-8000-000000000001', 'image', 'promo-serum.jpg', 'https://placehold.co/1920x1080/0d2137/e0e0e0?text=Serum+Anti-Pelliculaire', 102400, 'placeholder-3', TRUE, 3),
    ('a1b2c3d4-0002-4000-8000-000000000002', 'image', 'promo-lyon.jpg', 'https://placehold.co/1920x1080/1a1a2e/e0e0e0?text=K+Beauty+Lyon', 102400, 'placeholder-4', TRUE, 1);
