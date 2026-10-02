// ============================================================================
// Référentiel Pédagogique Officiel MBH — Source Unique de Vérité
// Filières : MBH1, MBH2 | Établissement : EPAC/UAC | Année : 2025-2026
// ============================================================================

export type UeType = 'fondamentale' | 'decouverte' | 'methodologie' | 'culture_generale';

export interface CurriculumEcu {
  name: string;
}

export type SemesterId = '1' | '2' | '3';

export interface CurriculumUe {
  code: string;
  nom: string;
  type: UeType;
  credits: number;
  semester: SemesterId;
  ecu: string[];
}

export interface CurriculumSemester {
  numero: 1 | 2 | 3;
  total_credits: number;
  unites: CurriculumUe[];
}

export interface CurriculumData {
  filiere: string;
  etablissement: string;
  annee_academique: string;
  semestres: CurriculumSemester[];
}

// ─── Constantes Académiques EPAC ──────────────────────────────────────────────
export const EPAC_PASSING_GRADE = 12; // Moyenne de validation = 12/20
export const DEFAULT_CC_WEIGHT = 0.50; // Contrôle Continu 50%
export const DEFAULT_ET_WEIGHT = 0.50; // Examen Terminal 50%

// ─── Référentiel Pédagogique MBH1 ─────────────────────────────────────────────
export const MBH1_CURRICULUM: CurriculumData = {
  filiere: 'MBH1',
  etablissement: 'EPAC/UAC',
  annee_academique: '2025-2026',
  semestres: [
    {
      numero: 1,
      total_credits: 30,
      unites: [
        {
          code: 'MBH1101',
          nom: 'Éléments de Mathématique',
          type: 'fondamentale',
          credits: 5,
          semester: '1',
          ecu: ['Algèbre et Analyse', 'Initiation à l\'Informatique'],
        },
        {
          code: 'MBH1102',
          nom: 'Mécanique des Solides',
          type: 'fondamentale',
          credits: 6,
          semester: '1',
          ecu: ['Mécanique des solides', 'Mécanique des fluides'],
        },
        {
          code: 'MBH1103',
          nom: 'Thermodynamique',
          type: 'fondamentale',
          credits: 4,
          semester: '1',
          ecu: ['Thermodynamique'],
        },
        {
          code: 'MBH1104',
          nom: 'Électronique générale',
          type: 'decouverte',
          credits: 4,
          semester: '1',
          ecu: ['Électronique générale'],
        },
        {
          code: 'MBH1105',
          nom: 'Électricité générale',
          type: 'decouverte',
          credits: 4,
          semester: '1',
          ecu: ['Électricité générale'],
        },
        {
          code: 'MBH1106',
          nom: 'Biologie chimie',
          type: 'decouverte',
          credits: 4,
          semester: '1',
          ecu: ['Biologie', 'Chimie'],
        },
        {
          code: 'MBH1107',
          nom: 'Éducation linguistique',
          type: 'methodologie',
          credits: 2,
          semester: '1',
          ecu: ['TEMC initiale', 'Anglais général'],
        },
        {
          code: 'MBH1108',
          nom: 'EPS',
          type: 'culture_generale',
          credits: 1,
          semester: '1',
          ecu: ['EPS'],
        },
      ],
    },
    {
      numero: 2,
      total_credits: 30,
      unites: [
        {
          code: 'MBH1209',
          nom: 'Langage et programmation',
          type: 'fondamentale',
          credits: 4,
          semester: '2',
          ecu: ['Langage et programmation'],
        },
        {
          code: 'MBH1210',
          nom: 'Éléments d\'Analyse numérique',
          type: 'fondamentale',
          credits: 6,
          semester: '2',
          ecu: ['Probabilité et statistiques', 'Analyse numérique'],
        },
        {
          code: 'MBH1211',
          nom: 'Physique',
          type: 'decouverte',
          credits: 4,
          semester: '2',
          ecu: ['Physique des matériaux', 'Physique appliquée en technologie médicale'],
        },
        {
          code: 'MBH1212',
          nom: 'Électronique',
          type: 'decouverte',
          credits: 6,
          semester: '2',
          ecu: ['Électronique Analogique', 'Électronique Digitale'],
        },
        {
          code: 'MBH1213',
          nom: 'Mesure et standardisation',
          type: 'decouverte',
          credits: 5,
          semester: '2',
          ecu: ['Standardisation', 'Mesure et Instrumentation'],
        },
        {
          code: 'MBH1214',
          nom: 'Stage d\'immersion',
          type: 'decouverte',
          credits: 2,
          semester: '2',
          ecu: ['Stage d\'immersion'],
        },
        {
          code: 'MBH1215',
          nom: 'Éducation linguistique appliquée',
          type: 'methodologie',
          credits: 2,
          semester: '2',
          ecu: ['Anglais technique du métier MBH'],
        },
        {
          code: 'MBH1216',
          nom: 'EPS',
          type: 'culture_generale',
          credits: 1,
          semester: '2',
          ecu: ['EPS'],
        },
      ],
    },
  ],
};

// ─── Référentiel Pédagogique MBH2 ─────────────────────────────────────────────
export const MBH2_CURRICULUM: CurriculumData = {
  filiere: 'MBH2',
  etablissement: 'EPAC/UAC',
  annee_academique: '2025-2026',
  semestres: [
    {
      numero: 3,
      total_credits: 30,
      unites: [
        {
          code: 'MBH1317',
          nom: 'Anatomie-Physiologie et Biorhéologie',
          type: 'fondamentale',
          credits: 5,
          semester: '3',
          ecu: ['Anatomie et physiologie des organes', 'Biorhéologie'],
        },
        {
          code: 'MBH1318',
          nom: 'Électronique médicale et nucléaire',
          type: 'fondamentale',
          credits: 3,
          semester: '3',
          ecu: ['Électronique médicale et nucléaire'],
        },
        {
          code: 'MBH1319',
          nom: 'Schémas et Automatisme',
          type: 'fondamentale',
          credits: 4,
          semester: '3',
          ecu: ['Schémas électriques et électroniques', 'Automatisme'],
        },
        {
          code: 'MBH1320',
          nom: 'Équipements de suppléance et d\'exploration fonctionnelle',
          type: 'fondamentale',
          credits: 5,
          semester: '3',
          ecu: ['Organes artificiels et équipements de suppléance', 'Équipements d\'exploration fonctionnelle'],
        },
        {
          code: 'MBH1321',
          nom: 'Architecture des ordinateurs et Information des dispositifs médicaux',
          type: 'fondamentale',
          credits: 5,
          semester: '3',
          ecu: ['Architecture des ordinateurs', 'Système d\'information des dispositifs médicaux'],
        },
        {
          code: 'MBH1322',
          nom: 'Électrotechnique',
          type: 'fondamentale',
          credits: 3,
          semester: '3',
          ecu: ['Électrotechnique'],
        },
        {
          code: 'MBH1323',
          nom: 'Séminaire en Génie Biomédical',
          type: 'methodologie',
          credits: 3,
          semester: '3',
          ecu: ['Séminaire en Génie Biomédical'],
        },
        {
          code: 'MBH1324',
          nom: 'Gestion des Stocks et Approvisionnement',
          type: 'methodologie',
          credits: 2,
          semester: '3',
          ecu: ['Gestion des Stocks et Approvisionnement'],
        },
      ],
    },
  ],
};

// ─── Helpers d'accès et de calcul ─────────────────────────────────────────────

export const ALL_MBH1_UES: CurriculumUe[] = MBH1_CURRICULUM.semestres.flatMap((s) => s.unites);
export const ALL_MBH2_UES: CurriculumUe[] = MBH2_CURRICULUM.semestres.flatMap((s) => s.unites);

/** Toutes les UEs de toutes les filières confondues */
export const ALL_CURRICULUM_UES: CurriculumUe[] = [...ALL_MBH1_UES, ...ALL_MBH2_UES];

/** Toutes les filières enregistrées */
export const ALL_CURRICULA: CurriculumData[] = [MBH1_CURRICULUM, MBH2_CURRICULUM];

export function getUesBySemester(semester?: SemesterId | 'all' | null): CurriculumUe[] {
  if (semester === '1') {
    return MBH1_CURRICULUM.semestres[0].unites;
  }
  if (semester === '2') {
    return MBH1_CURRICULUM.semestres[1].unites;
  }
  if (semester === '3') {
    return MBH2_CURRICULUM.semestres[0].unites;
  }
  return ALL_CURRICULUM_UES;
}

export function getUeByCode(code: string): CurriculumUe | undefined {
  const normalized = code.trim().toUpperCase();
  return ALL_CURRICULUM_UES.find((u) => u.code.toUpperCase() === normalized);
}

export function findUeForEcu(ecuName: string): CurriculumUe | undefined {
  const norm = ecuName.trim().toLowerCase();
  return ALL_CURRICULUM_UES.find((u) =>
    u.ecu.some((e) => e.toLowerCase() === norm || norm.includes(e.toLowerCase()))
  );
}

export function getSemesterFromCode(code: string): SemesterId {
  // MBH11xx = semestre 1, MBH12xx = semestre 2, MBH13xx = semestre 3
  const upper = code.toUpperCase();
  if (upper.startsWith('MBH13')) return '3';
  if (upper.startsWith('MBH12')) return '2';
  return '1';
}

export function getFiliereFromSemester(semester: SemesterId): string {
  if (semester === '3') return 'MBH2';
  return 'MBH1';
}

export function getUeTypeLabel(type: UeType): string {
  switch (type) {
    case 'fondamentale': return 'Fondamentale';
    case 'decouverte': return 'Découverte';
    case 'methodologie': return 'Méthodologie';
    case 'culture_generale': return 'Culture Générale';
    default: return type;
  }
}

export function calculateGrade(
  cc: number | null | undefined,
  et: number | null | undefined,
  ccWeight = DEFAULT_CC_WEIGHT,
  etWeight = DEFAULT_ET_WEIGHT
): number | null {
  const hasCC = cc !== null && cc !== undefined && !isNaN(cc);
  const hasET = et !== null && et !== undefined && !isNaN(et);
  if (!hasCC && !hasET) return null;
  const totalW = (hasCC ? ccWeight : 0) + (hasET ? etWeight : 0);
  if (totalW === 0) return null;
  const sum = (hasCC ? cc! * ccWeight : 0) + (hasET ? et! * etWeight : 0);
  return sum / totalW;
}

export interface UeSelectOption {
  code: string;
  nom: string;
  label: string; // "[MBH1101] Éléments de Mathématique"
  semester: SemesterId;
  credits: number;
  type: UeType;
  ecu: string[];
}

export function getUeSelectOptions(semester?: SemesterId | 'all' | null): UeSelectOption[] {
  const list = getUesBySemester(semester);
  return list.map((u) => ({
    code: u.code,
    nom: u.nom,
    label: `[${u.code}] ${u.nom}`,
    semester: u.semester,
    credits: u.credits,
    type: u.type,
    ecu: u.ecu,
  }));
}

/**
 * Validation stricte d'intégrité :
 * Garantit que les ECUs proviennent EXCLUSIVEMENT de ecu.length et jamais des crédits.
 */
export function assertCurriculumIntegrity(): { valid: boolean; totalUes: number; totalEcus: number; details: string[] } {
  let totalEcus = 0;
  const details: string[] = [];

  for (const curriculum of ALL_CURRICULA) {
    for (const s of curriculum.semestres) {
      const semCredits = s.unites.reduce((acc, u) => acc + u.credits, 0);
      details.push(`--- ${curriculum.filiere} Semestre ${s.numero} : ${semCredits}/${s.total_credits} crédits ---`);
      for (const u of s.unites) {
        const ecuCount = u.ecu.length;
        totalEcus += ecuCount;
        details.push(
          `  UE ${u.code} (${u.nom}) : ${u.credits} crédits, exactement ${ecuCount} ECU(s) [${u.ecu.join(', ')}]`
        );
      }
    }
  }

  // MBH1: 16 UEs, 24 ECUs | MBH2: 8 UEs, 12 ECUs | Total: 24 UEs, 36 ECUs
  const valid = ALL_CURRICULUM_UES.length === 24 && totalEcus === 36;
  return { valid, totalUes: ALL_CURRICULUM_UES.length, totalEcus, details };
}

