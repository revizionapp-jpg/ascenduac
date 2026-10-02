/**
 * seed-curriculum.js — Synchronisation stricte du référentiel MBH1 sur la base Neon
 *
 * Utilisation : node scripts/seed-curriculum.js
 * npm run seed:curriculum
 *
 * ════════════════════════════════════════════════════════════════════════════
 * RÈGLE ABSOLUE — CONTRAINTE STRICTE :
 *   - Le nombre d'ECUs insérés par UE est EXCLUSIVEMENT égal à ecu.length
 *   - NE JAMAIS utiliser `credits`, `cect`, `id` ou tout autre champ numérique
 *     comme base d'une boucle ou d'un compteur pour générer des ECUs.
 *   - Ces champs sont des métadonnées académiques (pondération ECTS), pas des quantités.
 *   - Itère UNIQUEMENT sur le tableau ecu fourni dans le référentiel.
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Résultat attendu :
 *   Semestre 1 : 8 UEs, 12 ECUs
 *   Semestre 2 : 8 UEs, 12 ECUs
 *   Total      : 16 UEs, 24 ECUs
 */

const fs = require('fs');
const path = require('path');

// ─── Chargement .env.local ─────────────────────────────────────────────────
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim().replace(/^["'](.*)['"']$/, '$1').trim();
    if (val && !process.env[key]) process.env[key] = val;
  }
}

const rawConn = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;
const connectionString = rawConn ? rawConn.replace(/^["'](.*)['"']$/, '$1').trim() : '';

if (!connectionString) {
  console.error('\x1b[31m%s\x1b[0m', '❌ DATABASE_URL ou NEON_DATABASE_URL manquante dans .env.local.');
  process.exit(1);
}

// ─── Référentiel Officiel MBH1 & MBH2 — Source Unique de Vérité ───────────
// ATTENTION : le champ `credits` est une métadonnée ECTS (pondération de la moyenne),
// il N'EST PAS et NE DOIT PAS être utilisé pour générer les ECUs.
// Le nombre d'ECUs à créer est EXCLUSIVEMENT la longueur du tableau `ecu`.
const MBH1_CURRICULUM = {
  filiere: 'MBH1',
  etablissement: 'EPAC/UAC',
  annee_academique: '2025-2026',
  semestres: [
    {
      numero: 1,
      unites: [
        { code: 'MBH1101', nom: 'Éléments de Mathématique',         type: 'fondamentale',    credits: 5, ecu: ['Algèbre et Analyse', 'Initiation à l\'Informatique'] },
        { code: 'MBH1102', nom: 'Mécanique des Solides',             type: 'fondamentale',    credits: 6, ecu: ['Mécanique des solides', 'Mécanique des fluides'] },
        { code: 'MBH1103', nom: 'Thermodynamique',                   type: 'fondamentale',    credits: 4, ecu: ['Thermodynamique'] },
        { code: 'MBH1104', nom: 'Électronique générale',             type: 'decouverte',      credits: 4, ecu: ['Électronique générale'] },
        { code: 'MBH1105', nom: 'Électricité générale',              type: 'decouverte',      credits: 4, ecu: ['Électricité générale'] },
        { code: 'MBH1106', nom: 'Biologie chimie',                   type: 'decouverte',      credits: 4, ecu: ['Biologie', 'Chimie'] },
        { code: 'MBH1107', nom: 'Éducation linguistique',            type: 'methodologie',    credits: 2, ecu: ['TEMC initiale', 'Anglais général'] },
        { code: 'MBH1108', nom: 'EPS',                               type: 'culture_generale',credits: 1, ecu: ['EPS'] },
      ],
    },
    {
      numero: 2,
      unites: [
        { code: 'MBH1209', nom: 'Langage et programmation',          type: 'fondamentale',    credits: 4, ecu: ['Langage et programmation'] },
        { code: 'MBH1210', nom: 'Éléments d\'Analyse numérique',     type: 'fondamentale',    credits: 6, ecu: ['Probabilité et statistiques', 'Analyse numérique'] },
        { code: 'MBH1211', nom: 'Physique',                          type: 'decouverte',      credits: 4, ecu: ['Physique des matériaux', 'Physique appliquée en technologie médicale'] },
        { code: 'MBH1212', nom: 'Électronique',                      type: 'decouverte',      credits: 6, ecu: ['Électronique Analogique', 'Électronique Digitale'] },
        { code: 'MBH1213', nom: 'Mesure et standardisation',         type: 'decouverte',      credits: 5, ecu: ['Standardisation', 'Mesure et Instrumentation'] },
        { code: 'MBH1214', nom: 'Stage d\'immersion',                type: 'decouverte',      credits: 2, ecu: ['Stage d\'immersion'] },
        { code: 'MBH1215', nom: 'Éducation linguistique appliquée',  type: 'methodologie',    credits: 2, ecu: ['Anglais technique du métier MBH'] },
        { code: 'MBH1216', nom: 'EPS',                               type: 'culture_generale',credits: 1, ecu: ['EPS'] },
      ],
    },
  ],
};

const MBH2_CURRICULUM = {
  filiere: 'MBH2',
  etablissement: 'EPAC/UAC',
  annee_academique: '2025-2026',
  semestres: [
    {
      numero: 3,
      unites: [
        { code: 'MBH1317', nom: 'Anatomie-Physiologie et Biorhéologie',                                 type: 'fondamentale', credits: 5, ecu: ['Anatomie et physiologie des organes', 'Biorhéologie'] },
        { code: 'MBH1318', nom: 'Électronique médicale et nucléaire',                                   type: 'fondamentale', credits: 3, ecu: ['Électronique médicale et nucléaire'] },
        { code: 'MBH1319', nom: 'Schémas et Automatisme',                                               type: 'fondamentale', credits: 4, ecu: ['Schémas électriques et électroniques', 'Automatisme'] },
        { code: 'MBH1320', nom: 'Équipements de suppléance et d\'exploration fonctionnelle',            type: 'fondamentale', credits: 5, ecu: ['Organes artificiels et équipements de suppléance', 'Équipements d\'exploration fonctionnelle'] },
        { code: 'MBH1321', nom: 'Architecture des ordinateurs et Information des dispositifs médicaux', type: 'fondamentale', credits: 5, ecu: ['Architecture des ordinateurs', 'Système d\'information des dispositifs médicaux'] },
        { code: 'MBH1322', nom: 'Électrotechnique',                                                     type: 'fondamentale', credits: 3, ecu: ['Électrotechnique'] },
        { code: 'MBH1323', nom: 'Séminaire en Génie Biomédical',                                         type: 'methodologie', credits: 3, ecu: ['Séminaire en Génie Biomédical'] },
        { code: 'MBH1324', nom: 'Gestion des Stocks et Approvisionnement',                              type: 'methodologie', credits: 2, ecu: ['Gestion des Stocks et Approvisionnement'] },
      ],
    },
  ],
};

const ALL_CURRICULA = [MBH1_CURRICULUM, MBH2_CURRICULUM];
const ALL_UES = ALL_CURRICULA.flatMap(c => c.semestres.flatMap(s => s.unites));

// ─── Vérification d'intégrité préalable ────────────────────────────────────
function assertIntegrity() {
  const totalEcus = ALL_UES.reduce((n, u) => n + u.ecu.length, 0);
  const totalUes = ALL_UES.length;

  console.log('\n══════════════════════════════════════════════════════════════');
  console.log('  Vérification d\'intégrité du référentiel MBH (MBH1 + MBH2)');
  console.log('══════════════════════════════════════════════════════════════');

  let ok = true;
  for (const ue of ALL_UES) {
    const ecuCount = ue.ecu.length;
    const sem = ue.code.startsWith('MBH13') ? 3 : ue.code.startsWith('MBH12') ? 2 : 1;
    console.log(`  S${sem} | ${ue.code} | credits=${ue.credits} | ECUs: ${ecuCount} → [${ue.ecu.join(', ')}]`);
    if (ecuCount === 0) {
      console.error(`  ❌ UE ${ue.code} n'a aucun ECU défini !`);
      ok = false;
    }
  }

  console.log(`\n  Total : ${totalUes} UEs | ${totalEcus} ECUs`);
  if (totalUes !== 24 || totalEcus !== 36) {
    console.error(`\n  ❌ ERREUR D'INTÉGRITÉ : attendu 24 UEs et 36 ECUs, obtenu ${totalUes} UEs et ${totalEcus} ECUs`);
    process.exit(1);
  }
  if (!ok) process.exit(1);

  console.log('  ✅ Référentiel conforme : 24 UEs, 36 ECUs (ecu.length vérifié pour chaque UE)');
  console.log('══════════════════════════════════════════════════════════════\n');
}

// ─── Seed principal ────────────────────────────────────────────────────────
async function seedCurriculum() {
  assertIntegrity();

  let sql;
  try {
    const postgres = require('postgres');
    sql = postgres(connectionString);
  } catch (err) {
    console.error('❌ Le package `postgres` n\'est pas disponible. Lancez : npm install postgres');
    process.exit(1);
  }

  console.log('🔌 Connexion à Neon PostgreSQL...');

  try {
    // ── Garantir la table ues avec le support de semester 1, 2 et 3 ────────
    await sql`
      CREATE TABLE IF NOT EXISTS ues (
        code     VARCHAR(10) PRIMARY KEY,
        name     TEXT NOT NULL,
        credits  INTEGER NOT NULL DEFAULT 3,
        semester TEXT NOT NULL CHECK (semester IN ('1','2','3')),
        type     TEXT DEFAULT 'fondamentale'
      );
    `;

    // Migration contrainte CHECK si la table existait déjà avec seulement ('1', '2')
    await sql`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conrelid = 'ues'::regclass
            AND contype = 'c'
            AND pg_get_constraintdef(oid) LIKE '%semester%1%2%'
            AND pg_get_constraintdef(oid) NOT LIKE '%3%'
        ) THEN
          EXECUTE (
            SELECT 'ALTER TABLE ues DROP CONSTRAINT ' || quote_ident(conname)
            FROM pg_constraint
            WHERE conrelid = 'ues'::regclass
              AND contype = 'c'
              AND pg_get_constraintdef(oid) LIKE '%semester%'
            LIMIT 1
          );
          ALTER TABLE ues ADD CONSTRAINT ues_semester_check CHECK (semester IN ('1', '2', '3'));
        END IF;
      END$$;
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS ecus (
        id      SERIAL PRIMARY KEY,
        name    TEXT NOT NULL,
        ue_code VARCHAR(10) NOT NULL REFERENCES ues(code) ON DELETE CASCADE
      );
    `;

    // Nettoyage préalable des doublons éventuels dans ecus :
    // 1. Réassigner les évaluations pointant vers les doublons vers l'ID canonique (le plus petit)
    await sql`
      WITH duplicates AS (
        SELECT id, ue_code, name,
               MIN(id) OVER (PARTITION BY ue_code, name) as canonical_id
        FROM ecus
      )
      UPDATE evaluations
      SET ecu_id = duplicates.canonical_id
      FROM duplicates
      WHERE evaluations.ecu_id = duplicates.id
        AND duplicates.id <> duplicates.canonical_id;
    `;

    // 2. Supprimer les doublons dans ecus en conservant le plus petit ID
    await sql`
      DELETE FROM ecus
      WHERE id NOT IN (
        SELECT MIN(id)
        FROM ecus
        GROUP BY ue_code, name
      );
    `;

    // 3. Nettoyage des UEs et ECUs obsolètes non conformes au référentiel officiel MBH1 (2025-2026)
    const validUeCodes = ALL_UES.map((u) => u.code);

    // Re-mapper l'ancien ECU MBH1211 "Physique appliquée technologie médicale" si besoin
    const [canonicalPhysique] = await sql`
      SELECT id FROM ecus WHERE ue_code = 'MBH1211' AND name = 'Physique appliquée en technologie médicale';
    `;
    const [oldPhysique] = await sql`
      SELECT id FROM ecus WHERE ue_code = 'MBH1211' AND name = 'Physique appliquée technologie médicale';
    `;
    if (canonicalPhysique && oldPhysique) {
      await sql`
        UPDATE evaluations SET ecu_id = ${canonicalPhysique.id} WHERE ecu_id = ${oldPhysique.id};
      `;
    }

    // 3a. Supprimer les évaluations rattachées aux UEs ou ECUs hors référentiel
    await sql`
      DELETE FROM evaluations
      WHERE ue_code NOT IN ${sql(validUeCodes)}
         OR ecu_id IN (SELECT id FROM ecus WHERE ue_code NOT IN ${sql(validUeCodes)});
    `;

    // 3b. Supprimer les ECUs rattachés aux UEs hors référentiel
    await sql`
      DELETE FROM ecus WHERE ue_code NOT IN ${sql(validUeCodes)};
    `;

    // 3c. Supprimer les liaisons matières <-> UEs hors référentiel
    await sql`
      DELETE FROM matiere_ue_map WHERE ue_code NOT IN ${sql(validUeCodes)};
    `;

    // 3d. Supprimer les UEs hors référentiel officiel
    await sql`
      DELETE FROM ues WHERE code NOT IN ${sql(validUeCodes)};
    `;

    // 3e. Supprimer les ECUs non officiels pour les UEs officielles
    for (const ue of ALL_UES) {
      // Retirer les évaluations liées à des ECUs non officiels de cette UE
      await sql`
        DELETE FROM evaluations
        WHERE ecu_id IN (
          SELECT id FROM ecus
          WHERE ue_code = ${ue.code}
            AND name NOT IN ${sql(ue.ecu)}
        );
      `;
      // Supprimer les ECUs non officiels
      await sql`
        DELETE FROM ecus
        WHERE ue_code = ${ue.code}
          AND name NOT IN ${sql(ue.ecu)};
      `;
    }

    // Migration: ajouter la contrainte unique si absente
    await sql`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_ecus_ue_name') THEN
          ALTER TABLE ecus ADD CONSTRAINT uq_ecus_ue_name UNIQUE (ue_code, name);
        END IF;
      END$$;
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_ecus_ue_code ON ecus(ue_code);`;

    let insertedUes = 0;
    let insertedEcus = 0;
    let skippedEcus = 0;

    // ══════════════════════════════════════════════════════════════════════════
    // BOUCLE PRINCIPALE : ITÈRE SUR ALL_UES, PUIS SUR ue.ecu[]
    //
    // ⚠️  NE PAS remplacer `for (const ecuName of ue.ecu)` par :
    //      - for (let i = 0; i < ue.credits; i++)   ← INTERDIT
    //      - [...Array(ue.credits)].map(...)          ← INTERDIT
    //      - for (let i = 0; i < ue.id; i++)         ← INTERDIT
    // La source de vérité est UNIQUEMENT le tableau ecu[].
    // ══════════════════════════════════════════════════════════════════════════
    for (const ue of ALL_UES) {
      const semester = ue.code.startsWith('MBH13') ? '3' : ue.code.startsWith('MBH12') ? '2' : '1';

      // Upsert UE
      const result = await sql`
        INSERT INTO ues (code, name, credits, semester, type)
        VALUES (${ue.code}, ${ue.nom}, ${ue.credits}, ${semester}, ${ue.type})
        ON CONFLICT (code) DO UPDATE
        SET name = EXCLUDED.name, credits = EXCLUDED.credits, semester = EXCLUDED.semester, type = EXCLUDED.type
        RETURNING code;
      `;
      insertedUes += result.length;

      // ECUs : itère EXCLUSIVEMENT sur ue.ecu (ecu.length = nombre exact d'ECUs)
      // Credits = métadonnée ECTS, PAS un compteur d'ECUs
      process.stdout.write(`  [${ue.code}] ${ue.ecu.length} ECU(s) : `);
      for (const ecuName of ue.ecu) {
        const ecuResult = await sql`
          INSERT INTO ecus (name, ue_code)
          VALUES (${ecuName.trim()}, ${ue.code})
          ON CONFLICT ON CONSTRAINT uq_ecus_ue_name DO NOTHING
          RETURNING id;
        `;
        if (ecuResult.length > 0) {
          insertedEcus++;
          process.stdout.write(`✓ `);
        } else {
          skippedEcus++;
          process.stdout.write(`→ `);
        }
      }
      console.log(`| ${ue.ecu.join(', ')}`);
    }

    // ── Vérification finale en base ────────────────────────────────────────
    const [ueCount] = await sql`SELECT COUNT(*) AS n FROM ues;`;
    const [ecuCount] = await sql`SELECT COUNT(*) AS n FROM ecus;`;
    const ecuByUe = await sql`
      SELECT ue_code, COUNT(*) AS n
      FROM ecus
      GROUP BY ue_code
      ORDER BY ue_code;
    `;

    console.log('\n══════════════════════════════════════════════════════════════');
    console.log('  Résultats en base après synchronisation :');
    console.log(`  UEs    : ${ueCount.n} (attendu: 24)`);
    console.log(`  ECUs   : ${ecuCount.n} (attendu: 36)`);
    console.log('\n  Détail ECUs par UE :');
    for (const row of ecuByUe) {
      const ref = ALL_UES.find(u => u.code === row.ue_code);
      const expected = ref ? ref.ecu.length : '?';
      const ok = String(row.n) === String(expected) ? '✅' : '❌';
      console.log(`  ${ok} ${row.ue_code} : ${row.n} ECU(s) (attendu: ${expected})`);
    }

    const valid = parseInt(ueCount.n) === 24 && parseInt(ecuCount.n) === 36;
    if (valid) {
      console.log('\n  ✅ Référentiel MBH (MBH1 + MBH2) synchronisé avec succès !');
    } else {
      console.error('\n  ❌ Incohérence détectée — vérifiez les logs ci-dessus.');
    }
    console.log('══════════════════════════════════════════════════════════════\n');

    await sql.end();
  } catch (err) {
    console.error('❌ Erreur lors du seed :', err.message);
    if (sql) await sql.end().catch(() => {});
    process.exit(1);
  }
}

seedCurriculum();
