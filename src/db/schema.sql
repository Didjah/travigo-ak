-- ============================================================
-- TRAVIGO-AK — Schéma Supabase Phase 4
-- Projet : itvscqtotncabmdjatwx
-- ============================================================

-- Table utilisateurs
CREATE TABLE IF NOT EXISTS utilisateurs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prenom      TEXT NOT NULL,
  telephone   TEXT NOT NULL UNIQUE,
  role        TEXT NOT NULL CHECK (role IN ('passager', 'chauffeur')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table courses
CREATE TABLE IF NOT EXISTS courses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  passager_id   UUID REFERENCES utilisateurs(id),
  chauffeur_id  UUID REFERENCES utilisateurs(id),
  statut        TEXT NOT NULL DEFAULT 'en_attente'
                  CHECK (statut IN ('en_attente', 'acceptee', 'en_cours', 'terminee', 'annulee')),
  depart        TEXT NOT NULL,
  destination   TEXT NOT NULL,
  prix          INTEGER,           -- en FCFA
  chauffeur_lat DOUBLE PRECISION,
  chauffeur_lng DOUBLE PRECISION,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_courses_statut ON courses(statut);
CREATE INDEX IF NOT EXISTS idx_courses_chauffeur ON courses(chauffeur_id);
CREATE INDEX IF NOT EXISTS idx_courses_passager ON courses(passager_id);

-- ============================================================
-- Activer Supabase Realtime sur la table courses
-- (à exécuter dans le dashboard Supabase > Database > Replication
--  OU via supabase CLI)
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE courses;

-- ============================================================
-- Row Level Security (RLS) — optionnel en DEV, recommandé en PROD
-- ============================================================
ALTER TABLE utilisateurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Politique permissive pour le développement
CREATE POLICY "allow_all_dev" ON utilisateurs FOR ALL USING (true);
CREATE POLICY "allow_all_dev" ON courses FOR ALL USING (true);
