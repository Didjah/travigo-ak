-- ============================================================
-- TRAVIGO-AK — Schéma Supabase
-- Transport digitalisé — Gagnoa, Côte d'Ivoire
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLE : utilisateurs
-- ============================================================
CREATE TABLE IF NOT EXISTS utilisateurs (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  telephone     TEXT UNIQUE NOT NULL,
  nom           TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('client', 'chauffeur')),
  avatar_url    TEXT,
  statut        TEXT NOT NULL DEFAULT 'actif' CHECK (statut IN ('actif', 'suspendu', 'exclu')),
  abonnement    TEXT NOT NULL DEFAULT 'standard' CHECK (abonnement IN ('standard', 'premium')),
  note_moyenne  NUMERIC NOT NULL DEFAULT 0,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE utilisateurs DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- TABLE : trajets
-- ============================================================
CREATE TABLE IF NOT EXISTS trajets (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id      UUID NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
  chauffeur_id   UUID REFERENCES utilisateurs(id) ON DELETE SET NULL,
  depart_lat     NUMERIC NOT NULL,
  depart_lng     NUMERIC NOT NULL,
  arrivee_lat    NUMERIC NOT NULL,
  arrivee_lng    NUMERIC NOT NULL,
  statut         TEXT NOT NULL DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'accepte', 'en_cours', 'termine', 'annule')),
  montant        NUMERIC NOT NULL DEFAULT 0,
  mode           TEXT NOT NULL DEFAULT 'standard' CHECK (mode IN ('standard', 'negociation', 'urgence')),
  type_vehicule  TEXT NOT NULL CHECK (type_vehicule IN ('taxi', 'tricycle')),
  created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE trajets DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- TABLE : notations
-- ============================================================
CREATE TABLE IF NOT EXISTS notations (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trajet_id   UUID NOT NULL REFERENCES trajets(id) ON DELETE CASCADE,
  noteur_id   UUID NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
  note_id     UUID NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
  note        NUMERIC NOT NULL CHECK (note >= 1 AND note <= 5),
  commentaire TEXT,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE notations DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- TABLE : abonnements
-- ============================================================
CREATE TABLE IF NOT EXISTS abonnements (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chauffeur_id UUID NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
  type         TEXT NOT NULL CHECK (type IN ('standard', 'premium')),
  date_debut   TIMESTAMP WITH TIME ZONE NOT NULL,
  date_fin     TIMESTAMP WITH TIME ZONE NOT NULL,
  statut       TEXT NOT NULL DEFAULT 'actif' CHECK (statut IN ('actif', 'expire')),
  montant      NUMERIC NOT NULL DEFAULT 0,
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE abonnements DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- INDEX
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_trajets_client_id      ON trajets(client_id);
CREATE INDEX IF NOT EXISTS idx_trajets_chauffeur_id   ON trajets(chauffeur_id);
CREATE INDEX IF NOT EXISTS idx_trajets_statut         ON trajets(statut);
CREATE INDEX IF NOT EXISTS idx_notations_trajet_id    ON notations(trajet_id);
CREATE INDEX IF NOT EXISTS idx_notations_note_id      ON notations(note_id);
CREATE INDEX IF NOT EXISTS idx_abonnements_chauffeur  ON abonnements(chauffeur_id);
CREATE INDEX IF NOT EXISTS idx_abonnements_statut     ON abonnements(statut);
