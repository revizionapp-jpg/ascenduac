-- ==============================================================
-- Annale229 MBH — Schéma PostgreSQL (Neon)
-- Exécuter dans la console SQL de neon.tech
-- ==============================================================

-- ─── Table : matieres ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS matieres (
  id               TEXT        PRIMARY KEY,
  nom              TEXT        NOT NULL,
  created_by_email TEXT        NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Contrainte d'unicité sur le nom normalisé (insensible à la casse)
CREATE UNIQUE INDEX IF NOT EXISTS idx_matieres_nom_lower
  ON matieres (LOWER(nom));

-- ─── Table : epreuves ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS epreuves (
  id                   TEXT        PRIMARY KEY,
  uploader_email       TEXT        NOT NULL,
  uploader_nom         TEXT        NOT NULL,
  matiere_id           TEXT        NOT NULL REFERENCES matieres(id) ON DELETE RESTRICT,
  matiere_nom          TEXT        NOT NULL,
  niveau               TEXT        NOT NULL,
  annee_academique     TEXT        NOT NULL,
  type                 TEXT        NOT NULL CHECK (type IN ('devoir', 'rattrapage')),
  titre                TEXT,
  cloudinary_public_id TEXT        NOT NULL,
  cloudinary_url       TEXT        NOT NULL,
  taille_octets        INTEGER     NOT NULL DEFAULT 0,
  type_fichier         TEXT        NOT NULL,
  nb_telechargements   INTEGER     NOT NULL DEFAULT 0,
  statut               TEXT        NOT NULL DEFAULT 'approuve' CHECK (statut IN ('en_attente', 'approuve', 'rejete')),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Neon Object Storage (miroir S3)
  s3_key               TEXT,
  s3_url               TEXT,
  -- Corrigé & Barème
  has_corrige          BOOLEAN     NOT NULL DEFAULT FALSE,
  corrige_url          TEXT,
  corrige_cloudinary_public_id TEXT,
  corrige_s3_key       TEXT,
  corrige_type_fichier TEXT,
  corrige_taille_octets INTEGER    NOT NULL DEFAULT 0
);

-- Index de performances pour les filtres courants
CREATE INDEX IF NOT EXISTS idx_epreuves_matiere_id   ON epreuves (matiere_id);
CREATE INDEX IF NOT EXISTS idx_epreuves_niveau        ON epreuves (niveau);
CREATE INDEX IF NOT EXISTS idx_epreuves_annee         ON epreuves (annee_academique);
CREATE INDEX IF NOT EXISTS idx_epreuves_type          ON epreuves (type);
CREATE INDEX IF NOT EXISTS idx_epreuves_uploader      ON epreuves (uploader_email);
CREATE INDEX IF NOT EXISTS idx_epreuves_statut        ON epreuves (statut);
CREATE INDEX IF NOT EXISTS idx_epreuves_created_at    ON epreuves (created_at DESC);

-- Index de recherche textuelle sur matiere_nom et titre
CREATE INDEX IF NOT EXISTS idx_epreuves_matiere_nom_search
  ON epreuves USING gin(to_tsvector('french', matiere_nom));
CREATE INDEX IF NOT EXISTS idx_epreuves_titre_search
  ON epreuves USING gin(to_tsvector('french', COALESCE(titre, '')));

-- ─── Table : profils ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profils (
  email      TEXT        PRIMARY KEY,
  nom        TEXT        NOT NULL,
  niveau     TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Table : utilisateurs ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS utilisateurs (
  email      TEXT        PRIMARY KEY,
  nom        TEXT        NOT NULL,
  image      TEXT,
  role       TEXT        NOT NULL DEFAULT 'etudiant' CHECK (role IN ('admin', 'etudiant')),
  niveau     TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Table : connexions_log ───────────────────────────────────
CREATE TABLE IF NOT EXISTS connexions_log (
  id         TEXT        PRIMARY KEY,
  user_email TEXT        NOT NULL,
  user_nom   TEXT,
  provider   TEXT        NOT NULL DEFAULT 'google',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_connexions_user_email ON connexions_log (user_email);
CREATE INDEX IF NOT EXISTS idx_connexions_created_at ON connexions_log (created_at DESC);

-- ─── Données initiales : Matières MBH1 Référentiel Officiel ───
INSERT INTO matieres (id, nom, created_by_email, created_at) VALUES
  ('m_mbh1101', 'Éléments de Mathématique',              'system@epac-uac.bj', '2025-01-10T08:00:00Z'),
  ('m_mbh1102', 'Mécanique des Solides',                  'system@epac-uac.bj', '2025-01-10T08:05:00Z'),
  ('m_mbh1103', 'Thermodynamique',                        'system@epac-uac.bj', '2025-01-10T08:10:00Z'),
  ('m_mbh1104', 'Électronique générale',                  'system@epac-uac.bj', '2025-01-10T08:15:00Z'),
  ('m_mbh1105', 'Électricité générale',                   'system@epac-uac.bj', '2025-01-10T08:20:00Z'),
  ('m_mbh1106', 'Biologie chimie',                        'system@epac-uac.bj', '2025-01-10T08:25:00Z'),
  ('m_mbh1107', 'Éducation linguistique',                 'system@epac-uac.bj', '2025-01-10T08:30:00Z'),
  ('m_mbh1108', 'EPS',                                    'system@epac-uac.bj', '2025-01-10T08:35:00Z'),
  ('m_mbh1209', 'Langage et programmation',              'system@epac-uac.bj', '2025-01-10T08:40:00Z'),
  ('m_mbh1210', 'Éléments d''Analyse numérique',          'system@epac-uac.bj', '2025-01-10T08:45:00Z'),
  ('m_mbh1211', 'Physique',                               'system@epac-uac.bj', '2025-01-10T08:50:00Z'),
  ('m_mbh1212', 'Électronique',                           'system@epac-uac.bj', '2025-01-10T08:55:00Z'),
  ('m_mbh1213', 'Mesure et standardisation',              'system@epac-uac.bj', '2025-01-10T09:00:00Z'),
  ('m_mbh1214', 'Stage d''immersion',                     'system@epac-uac.bj', '2025-01-10T09:05:00Z'),
  ('m_mbh1215', 'Éducation linguistique appliquée',       'system@epac-uac.bj', '2025-01-10T09:10:00Z'),
  ('m_mbh1216', 'EPS',                                    'system@epac-uac.bj', '2025-01-10T09:15:00Z')
ON CONFLICT (id) DO UPDATE SET nom = EXCLUDED.nom;

-- ==============================================================
-- Suivi Notes MBH1 — Tables intégrées
-- ==============================================================

-- ─── Table : ues (Unités d'Enseignement) ──────────────────────
CREATE TABLE IF NOT EXISTS ues (
  code        VARCHAR(10)  PRIMARY KEY,          -- ex: MBH1101
  name        TEXT         NOT NULL,
  credits     INTEGER      NOT NULL DEFAULT 3,
  semester    TEXT         NOT NULL CHECK (semester IN ('1', '2')),
  type        TEXT         NOT NULL DEFAULT 'fondamentale'
);

-- ─── Table : ecus (Éléments Constitutifs d'UE) ────────────────
-- CONTRAINTE STRICTE : exactement ecu.length lignes par UE, jamais déduites de credits
CREATE TABLE IF NOT EXISTS ecus (
  id          SERIAL       PRIMARY KEY,
  name        TEXT         NOT NULL,
  ue_code     VARCHAR(10)  NOT NULL REFERENCES ues(code) ON DELETE CASCADE,
  CONSTRAINT uq_ecus_ue_name UNIQUE (ue_code, name)
);

-- Index de performance sur ue_code
CREATE INDEX IF NOT EXISTS idx_ecus_ue_code ON ecus (ue_code);

-- ─── Table : evaluations ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS evaluations (
  id              SERIAL       PRIMARY KEY,
  student_email   TEXT         NOT NULL,          -- email du compte Google
  ue_code         VARCHAR(10)  REFERENCES ues(code) ON DELETE CASCADE,
  ecu_id          INTEGER      REFERENCES ecus(id) ON DELETE CASCADE,
  type            TEXT         NOT NULL CHECK (type IN ('CC', 'ET')),
  grade           DOUBLE PRECISION,
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_evaluations_student ON evaluations (student_email);
CREATE INDEX IF NOT EXISTS idx_evaluations_ecu     ON evaluations (ecu_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_ue      ON evaluations (ue_code);

-- ─── Table de liaison : matiere <-> ue ────────────────────────
CREATE TABLE IF NOT EXISTS matiere_ue_map (
  matiere_id  TEXT        NOT NULL REFERENCES matieres(id) ON DELETE CASCADE,
  ue_code     VARCHAR(10) NOT NULL REFERENCES ues(code)    ON DELETE CASCADE,
  PRIMARY KEY (matiere_id, ue_code)
);

-- ─── Seed : UEs MBH1 (Semestre 1 & 2) ─────────────────────────
INSERT INTO ues (code, name, credits, semester, type) VALUES
  ('MBH1101', 'Éléments de Mathématique',            5, '1', 'fondamentale'),
  ('MBH1102', 'Mécanique des Solides',                6, '1', 'fondamentale'),
  ('MBH1103', 'Thermodynamique',                      4, '1', 'fondamentale'),
  ('MBH1104', 'Électronique générale',                4, '1', 'decouverte'),
  ('MBH1105', 'Électricité générale',                 4, '1', 'decouverte'),
  ('MBH1106', 'Biologie chimie',                      4, '1', 'decouverte'),
  ('MBH1107', 'Éducation linguistique',               2, '1', 'methodologie'),
  ('MBH1108', 'EPS',                                  1, '1', 'culture_generale'),
  ('MBH1209', 'Langage et programmation',            4, '2', 'fondamentale'),
  ('MBH1210', 'Éléments d''Analyse numérique',        6, '2', 'fondamentale'),
  ('MBH1211', 'Physique',                             4, '2', 'decouverte'),
  ('MBH1212', 'Électronique',                         6, '2', 'decouverte'),
  ('MBH1213', 'Mesure et standardisation',            5, '2', 'decouverte'),
  ('MBH1214', 'Stage d''immersion',                   2, '2', 'decouverte'),
  ('MBH1215', 'Éducation linguistique appliquée',     2, '2', 'methodologie'),
  ('MBH1216', 'EPS',                                  1, '2', 'culture_generale')
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name, credits = EXCLUDED.credits, semester = EXCLUDED.semester, type = EXCLUDED.type;

-- ─── Seed : ECUs par UE ───────────────────────────────────────
-- RÈGLE ABSOLUE : itère sur ecu.length — jamais sur credits ni sur aucun champ numérique
-- Semestre 1 : 12 ECUs pour 8 UEs
-- Semestre 2 : 12 ECUs pour 8 UEs
-- Total : 24 ECUs pour 16 UEs
INSERT INTO ecus (name, ue_code) VALUES
  -- MBH1101 : 2 ECUs (ecu.length = 2)
  ('Algèbre et Analyse', 'MBH1101'),
  ('Initiation à l''Informatique', 'MBH1101'),
  -- MBH1102 : 2 ECUs (ecu.length = 2)
  ('Mécanique des solides', 'MBH1102'),
  ('Mécanique des fluides', 'MBH1102'),
  -- MBH1103 : 1 ECU (ecu.length = 1)
  ('Thermodynamique', 'MBH1103'),
  -- MBH1104 : 1 ECU (ecu.length = 1)
  ('Électronique générale', 'MBH1104'),
  -- MBH1105 : 1 ECU (ecu.length = 1)
  ('Électricité générale', 'MBH1105'),
  -- MBH1106 : 2 ECUs (ecu.length = 2)
  ('Biologie', 'MBH1106'),
  ('Chimie', 'MBH1106'),
  -- MBH1107 : 2 ECUs (ecu.length = 2)
  ('TEMC initiale', 'MBH1107'),
  ('Anglais général', 'MBH1107'),
  -- MBH1108 : 1 ECU (ecu.length = 1)
  ('EPS', 'MBH1108'),
  -- MBH1209 : 1 ECU (ecu.length = 1)
  ('Langage et programmation', 'MBH1209'),
  -- MBH1210 : 2 ECUs (ecu.length = 2)
  ('Probabilité et statistiques', 'MBH1210'),
  ('Analyse numérique', 'MBH1210'),
  -- MBH1211 : 2 ECUs (ecu.length = 2)
  ('Physique des matériaux', 'MBH1211'),
  ('Physique appliquée en technologie médicale', 'MBH1211'),
  -- MBH1212 : 2 ECUs (ecu.length = 2)
  ('Électronique Analogique', 'MBH1212'),
  ('Électronique Digitale', 'MBH1212'),
  -- MBH1213 : 2 ECUs (ecu.length = 2)
  ('Standardisation', 'MBH1213'),
  ('Mesure et Instrumentation', 'MBH1213'),
  -- MBH1214 : 1 ECU (ecu.length = 1)
  ('Stage d''immersion', 'MBH1214'),
  -- MBH1215 : 1 ECU (ecu.length = 1)
  ('Anglais technique du métier MBH', 'MBH1215'),
  -- MBH1216 : 1 ECU (ecu.length = 1)
  ('EPS', 'MBH1216')
ON CONFLICT ON CONSTRAINT uq_ecus_ue_name DO NOTHING;

-- ─── Seed : Liaison Matières → UEs ───────────────────────────
INSERT INTO matiere_ue_map (matiere_id, ue_code) VALUES
  ('m_mbh1101', 'MBH1101'),
  ('m_mbh1102', 'MBH1102'),
  ('m_mbh1103', 'MBH1103'),
  ('m_mbh1104', 'MBH1104'),
  ('m_mbh1105', 'MBH1105'),
  ('m_mbh1106', 'MBH1106'),
  ('m_mbh1107', 'MBH1107'),
  ('m_mbh1108', 'MBH1108'),
  ('m_mbh1209', 'MBH1209'),
  ('m_mbh1210', 'MBH1210'),
  ('m_mbh1211', 'MBH1211'),
  ('m_mbh1212', 'MBH1212'),
  ('m_mbh1213', 'MBH1213'),
  ('m_mbh1214', 'MBH1214'),
  ('m_mbh1215', 'MBH1215'),
  ('m_mbh1216', 'MBH1216')
ON CONFLICT DO NOTHING;
