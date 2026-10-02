import { sql, isNeonConfigured } from './neon';
import { ALL_CURRICULUM_UES } from '@/lib/constants/curriculum';

let initialized = false;

export async function ensureAdminTablesExist() {
  if (initialized || !isNeonConfigured()) return;

  try {
    // 1. Table des utilisateurs
    await sql`
      CREATE TABLE IF NOT EXISTS utilisateurs (
        email TEXT PRIMARY KEY,
        nom TEXT NOT NULL,
        image TEXT,
        role TEXT NOT NULL DEFAULT 'etudiant',
        niveau TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        last_login TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;

    // 2. Table des historiques de connexions
    await sql`
      CREATE TABLE IF NOT EXISTS connexions_log (
        id TEXT PRIMARY KEY,
        user_email TEXT NOT NULL,
        user_nom TEXT,
        provider TEXT NOT NULL DEFAULT 'google',
        ip_address TEXT,
        user_agent TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;

    await sql`CREATE INDEX IF NOT EXISTS idx_connexions_user_email ON connexions_log(user_email);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_connexions_created_at ON connexions_log(created_at DESC);`;

    // S'assurer que le compte administrateur principal est enregistré comme admin
    const adminEmail = process.env.ADMIN_EMAIL || 'optossou@gmail.com';
    await sql`
      INSERT INTO utilisateurs (email, nom, role, last_login)
      VALUES (${adminEmail.toLowerCase()}, 'Développeur & Admin (optossou@gmail.com)', 'admin', NOW())
      ON CONFLICT (email) DO UPDATE SET role = 'admin';
    `;

    // ── 3. Tables Suivi Notes & Référentiel ──────────────────────

    // 3a. UEs (Unités d'Enseignement)
    await sql`
      CREATE TABLE IF NOT EXISTS ues (
        code     VARCHAR(10) PRIMARY KEY,
        name     TEXT        NOT NULL,
        credits  INTEGER     NOT NULL DEFAULT 3,
        semester TEXT        NOT NULL CHECK (semester IN ('1', '2', '3')),
        type     TEXT        DEFAULT 'fondamentale'
      );
    `;
    await sql`ALTER TABLE ues ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'fondamentale';`;

    // Migration : mettre à jour la contrainte CHECK de semester pour inclure '3' (MBH2)
    await sql`
      DO $$
      BEGIN
        -- Supprimer l'ancienne contrainte CHECK sur semester (nom auto-généré par Postgres)
        PERFORM 1 FROM information_schema.check_constraints
        WHERE constraint_name IN (
          SELECT conname FROM pg_constraint
          WHERE conrelid = 'ues'::regclass
            AND contype = 'c'
            AND pg_get_constraintdef(oid) LIKE '%semester%'
            AND pg_get_constraintdef(oid) NOT LIKE '%3%'
        );
        IF FOUND THEN
          EXECUTE (
            SELECT 'ALTER TABLE ues DROP CONSTRAINT ' || conname
            FROM pg_constraint
            WHERE conrelid = 'ues'::regclass
              AND contype = 'c'
              AND pg_get_constraintdef(oid) LIKE '%semester%'
              AND pg_get_constraintdef(oid) NOT LIKE '%3%'
            LIMIT 1
          );
          ALTER TABLE ues ADD CONSTRAINT ues_semester_check CHECK (semester IN ('1', '2', '3'));
        END IF;
      END$$;
    `;

    // 3b. ECUs (Éléments Constitutifs d'UE)
    // ════════════════════════════════════════════════════════════════════════════
    // CONTRAINTE STRICTE : exactement ue.ecu.length lignes par UE.
    // La contrainte unique (ue_code, name) interdit tout doublon, ce qui garantit
    // que relancer le seed ne crée JAMAIS plus d'ECUs que le tableau ecu.
    // NE JAMAIS utiliser `credits` ou un champ numérique pour compter les ECUs.
    // ════════════════════════════════════════════════════════════════════════════
    await sql`
      CREATE TABLE IF NOT EXISTS ecus (
        id      SERIAL      PRIMARY KEY,
        name    TEXT        NOT NULL,
        ue_code VARCHAR(10) NOT NULL REFERENCES ues(code) ON DELETE CASCADE
      );
    `;

    // Ajouter la contrainte unique (ue_code, name) si elle n'existe pas encore
    // (migration sur base existante)
    await sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'uq_ecus_ue_name'
        ) THEN
          ALTER TABLE ecus ADD CONSTRAINT uq_ecus_ue_name UNIQUE (ue_code, name);
        END IF;
      END$$;
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_ecus_ue_code ON ecus(ue_code);`;

    // 3c. Evaluations (notes des étudiants — support niveau ECU ou UE directe)
    await sql`
      CREATE TABLE IF NOT EXISTS evaluations (
        id            SERIAL           PRIMARY KEY,
        student_email TEXT             NOT NULL,
        ue_code       VARCHAR(10)      REFERENCES ues(code) ON DELETE CASCADE,
        ecu_id        INTEGER          REFERENCES ecus(id) ON DELETE CASCADE,
        type          TEXT             NOT NULL CHECK (type IN ('CC', 'ET')),
        grade         DOUBLE PRECISION,
        updated_at    TIMESTAMPTZ      NOT NULL DEFAULT NOW()
      );
    `;

    // S'assurer que ue_code et ecu_id sont nullable (support double niveau UE/ECU)
    await sql`ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS ue_code VARCHAR(10) REFERENCES ues(code) ON DELETE CASCADE;`;
    try {
      await sql`ALTER TABLE evaluations ALTER COLUMN ecu_id DROP NOT NULL;`;
    } catch {
      // Ignorer si déjà nullable
    }

    await sql`CREATE INDEX IF NOT EXISTS idx_evaluations_student ON evaluations(student_email);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_evaluations_ecu     ON evaluations(ecu_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_evaluations_ue      ON evaluations(ue_code);`;

    // 3d. Colonnes ue_code et ecu_nom sur la table epreuves (si existante)
    try {
      await sql`ALTER TABLE epreuves ADD COLUMN IF NOT EXISTS ue_code VARCHAR(10);`;
      await sql`ALTER TABLE epreuves ADD COLUMN IF NOT EXISTS ecu_nom TEXT;`;
    } catch {
      // Si la table epreuves n'est pas encore créée, ignore
    }

    // 3e. Table de liaison matière <-> UE
    await sql`
      CREATE TABLE IF NOT EXISTS matiere_ue_map (
        matiere_id TEXT        NOT NULL,
        ue_code    VARCHAR(10) NOT NULL REFERENCES ues(code) ON DELETE CASCADE,
        PRIMARY KEY (matiere_id, ue_code)
      );
    `;

    // Nettoyage de sécurité : supprimer les éventuelles UEs ou ECUs hors référentiel
    const validUeCodes = ALL_CURRICULUM_UES.map((u) => u.code);
    await sql`
      DELETE FROM evaluations
      WHERE ue_code NOT IN ${sql(validUeCodes)}
         OR ecu_id IN (SELECT id FROM ecus WHERE ue_code NOT IN ${sql(validUeCodes)});
    `;
    await sql`DELETE FROM ecus WHERE ue_code NOT IN ${sql(validUeCodes)};`;
    await sql`DELETE FROM matiere_ue_map WHERE ue_code NOT IN ${sql(validUeCodes)};`;
    await sql`DELETE FROM ues WHERE code NOT IN ${sql(validUeCodes)};`;

    // ── 4. Peuplement du Référentiel Officiel MBH ────────────────
    //
    // ╔══════════════════════════════════════════════════════════════════════════╗
    // ║ RÈGLE ABSOLUE : itère EXCLUSIVEMENT sur le tableau ue.ecu              ║
    // ║  → ue.ecu.length lignes ECU créées par UE — jamais plus, jamais moins  ║
    // ║  → NE PAS utiliser ue.credits comme compteur ou base d'une boucle      ║
    // ╚══════════════════════════════════════════════════════════════════════════╝
    for (const ue of ALL_CURRICULUM_UES) {
      // Nettoyage des ECUs non officiels pour cette UE
      await sql`
        DELETE FROM evaluations
        WHERE ecu_id IN (
          SELECT id FROM ecus
          WHERE ue_code = ${ue.code}
            AND name NOT IN ${sql(ue.ecu)}
        );
      `;
      await sql`
        DELETE FROM ecus
        WHERE ue_code = ${ue.code}
          AND name NOT IN ${sql(ue.ecu)};
      `;

      // 4a. Insérer / mettre à jour l'UE
      await sql`
        INSERT INTO ues (code, name, credits, semester, type)
        VALUES (${ue.code}, ${ue.nom}, ${ue.credits}, ${ue.semester}, ${ue.type})
        ON CONFLICT (code) DO UPDATE
        SET name = ${ue.nom}, credits = ${ue.credits}, semester = ${ue.semester}, type = ${ue.type};
      `;

      // 4b. Insérer la matière officielle correspondante
      const matiereId = `m_${ue.code.toLowerCase()}`;
      await sql`
        INSERT INTO matieres (id, nom, created_by_email)
        VALUES (${matiereId}, ${ue.nom}, 'system@epac-uac.bj')
        ON CONFLICT (id) DO UPDATE SET nom = ${ue.nom};
      `;

      // 4c. Lier matière <-> UE
      await sql`
        INSERT INTO matiere_ue_map (matiere_id, ue_code)
        VALUES (${matiereId}, ${ue.code})
        ON CONFLICT DO NOTHING;
      `;

      // 4d. ECUs : itère EXCLUSIVEMENT sur ue.ecu[]
      //     → exactement ue.ecu.length insertions tentées (idempotentes grâce à la contrainte unique)
      //     → NE PAS utiliser ue.credits, ue.id ni aucun champ numérique ici
      for (const ecuName of ue.ecu) {
        await sql`
          INSERT INTO ecus (name, ue_code)
          VALUES (${ecuName.trim()}, ${ue.code})
          ON CONFLICT ON CONSTRAINT uq_ecus_ue_name DO NOTHING;
        `;
      }
    }

    initialized = true;
    const totalEcus = ALL_CURRICULUM_UES.reduce((n, u) => n + u.ecu.length, 0);
    console.log('✅ Référentiel officiel MBH (MBH1 + MBH2) vérifié et synchronisé sur Neon.');
    console.log(`   → ${ALL_CURRICULUM_UES.length} UEs | ${totalEcus} ECUs (strictement ecu.length par UE, jamais credits)`);
  } catch (err) {
    console.error('Erreur ensureAdminTablesExist:', err);
  }
}
