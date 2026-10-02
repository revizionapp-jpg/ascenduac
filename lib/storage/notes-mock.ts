import { ALL_CURRICULUM_UES, CurriculumUe } from '@/lib/constants/curriculum';

export interface MockEcu {
  id: number;
  name: string;
}

export interface MockUe {
  code: string;
  name: string;
  credits: number;
  semester: string;
  type?: string;
  ecus: MockEcu[];
}

export interface MockEvaluation {
  id?: number;
  ecu_id?: number | null;
  ue_code: string;
  type: 'CC' | 'ET';
  grade: number | null;
  ecu_name?: string;
  student_email?: string;
}

// Génération déterministe des IDs d'ECUs pour les UEs du référentiel (MBH1 + MBH2)
let ecuCounter = 1;
export const MOCK_UES: MockUe[] = ALL_CURRICULUM_UES.map((ue) => ({
  code: ue.code,
  name: ue.nom,
  credits: ue.credits,
  semester: ue.semester,
  type: ue.type,
  ecus: ue.ecu.map((ecuName) => ({
    id: ecuCounter++,
    name: ecuName,
  })),
}));

// Mémoire locale pour sauvegarder les notes en mode démo (sans Neon)
const globalForMockNotes = globalThis as unknown as {
  _mockEvals?: {
    [key: string]: {
      ecu_id?: number | null;
      ue_code: string;
      type: 'CC' | 'ET';
      grade: number | null;
      student_email: string;
    };
  };
};

if (!globalForMockNotes._mockEvals) {
  globalForMockNotes._mockEvals = {};
}

export function getMockEvaluations(email: string, ueCode?: string | null): MockEvaluation[] {
  const result: MockEvaluation[] = [];
  const store = globalForMockNotes._mockEvals || {};

  for (const item of Object.values(store)) {
    if (item.student_email.toLowerCase() === email.toLowerCase()) {
      if (!ueCode || item.ue_code === ueCode) {
        let ecuName: string | undefined;
        if (item.ecu_id) {
          const ecu = MOCK_UES.flatMap((u) => u.ecus.map((e) => ({ ...e, ue_code: u.code }))).find(
            (e) => e.id === item.ecu_id
          );
          ecuName = ecu?.name;
        }

        result.push({
          ecu_id: item.ecu_id ?? null,
          ue_code: item.ue_code,
          type: item.type,
          grade: item.grade,
          ecu_name: ecuName,
          student_email: item.student_email,
        });
      }
    }
  }

  return result;
}

export function saveMockEvaluation(
  email: string,
  ueCode: string,
  ecuId: number | null | undefined,
  type: 'CC' | 'ET',
  grade: number | null
) {
  const store = globalForMockNotes._mockEvals || {};
  const normalizedEmail = email.toLowerCase();
  const key = ecuId
    ? `${normalizedEmail}_ecu_${ecuId}_${type}`
    : `${normalizedEmail}_ue_${ueCode}_${type}`;

  store[key] = {
    student_email: normalizedEmail,
    ue_code: ueCode,
    ecu_id: ecuId ?? null,
    type,
    grade,
  };
}

export function deleteMockEvaluation(
  email: string,
  ueCode: string,
  ecuId: number | null | undefined,
  type: 'CC' | 'ET'
) {
  const store = globalForMockNotes._mockEvals || {};
  const normalizedEmail = email.toLowerCase();
  const key = ecuId
    ? `${normalizedEmail}_ecu_${ecuId}_${type}`
    : `${normalizedEmail}_ue_${ueCode}_${type}`;

  delete store[key];
}
