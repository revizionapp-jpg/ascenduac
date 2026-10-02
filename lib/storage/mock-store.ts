import { Matiere, Epreuve, Profil } from '@/types';
import { ALL_CURRICULUM_UES } from '@/lib/constants/curriculum';

// Matières officielles MBH (MBH1 & MBH2) comme base
export const INITIAL_MATIERES: Matiere[] = ALL_CURRICULUM_UES.map((ue) => ({
  id: `m_${ue.code.toLowerCase()}`,
  nom: ue.nom,
  created_by_email: 'system@epac-uac.bj',
  created_at: '2025-01-10T08:00:00.000Z',
}));

export const INITIAL_EPREUVES: Epreuve[] = [];

export const INITIAL_PROFILS: Profil[] = [];

// En mémoire globale pour persister entre requêtes en dev
class LocalStore {
  matieres: Matiere[] = [...INITIAL_MATIERES];
  epreuves: Epreuve[] = [];
  profils: Profil[] = [];
}

const globalForMock = globalThis as unknown as { mockStoreInstance?: LocalStore };

export const mockStore = globalForMock.mockStoreInstance || new LocalStore();
if (process.env.NODE_ENV !== 'production') globalForMock.mockStoreInstance = mockStore;
