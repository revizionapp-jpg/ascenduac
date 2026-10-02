'use client';

import React, { useState, useRef, useCallback } from 'react';
import { BulkUploadItem, TypeEpreuve } from '@/types';
import { VALID_NIVEAUX_PREDEFINIS, VALID_TYPES, MAX_FILE_SIZE_BYTES } from '@/lib/utils/validation';
import { getAcademicYears, formatFileSize } from '@/lib/utils/date';
import { mergeFilesToPdf } from '@/lib/utils/pdf-merger';
import { ALL_CURRICULUM_UES, getUeByCode } from '@/lib/constants/curriculum';
import {
  UploadCloud,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Play,
  Sparkles,
  RefreshCw,
  Check,
  Layers,
  FileUp,
  X,
  ExternalLink,
  Plus,
  Loader2,
  SlidersHorizontal,
  ChevronDown,
  BookOpen,
  ArrowUp,
  ArrowDown,
  Files,
  Combine,
  CheckSquare,
  Square,
  Clock
} from 'lucide-react';

interface BulkUploadManagerProps {
  matieresList: { id: string; nom: string }[];
  onUploadSuccess?: () => void;
}

// Nettoyage du nom de fichier pour suggérer un titre lisible
function cleanFileNameToTitle(fileName: string): string {
  const withoutExt = fileName.replace(/\.[^/.]+$/, '');
  const cleaned = withoutExt
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) return 'Épreuve MBH';
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

// Détection du code UE à partir du nom de fichier (ex: "MBH1101" ou "math" → MBH1101)
// Retourne le code UE correspondant ou '' si aucune correspondance
function guessUeCode(fileName: string): string {
  const lower = fileName.toLowerCase();
  const upper = fileName.toUpperCase();

  // 1. Recherche directe du code dans le nom (ex: "MBH1101_cours.pdf", "MBH1317_devoir.pdf")
  for (const ue of ALL_CURRICULUM_UES) {
    if (upper.includes(ue.code)) return ue.code;
  }

  // 2. Correspondance par mots-clés du nom de l'UE
  const kwMap: { keywords: string[]; code: string }[] = [
    { keywords: ['math', 'algebre', 'analyse', 'informatique', 'initiation'], code: 'MBH1101' },
    { keywords: ['meca', 'solide', 'fluide', 'mecanique'], code: 'MBH1102' },
    { keywords: ['thermo'], code: 'MBH1103' },
    { keywords: ['electronique gen'], code: 'MBH1104' },
    { keywords: ['electricite gen', 'electricite gen'], code: 'MBH1105' },
    { keywords: ['biologie', 'chimie', 'bio chim'], code: 'MBH1106' },
    { keywords: ['temc', 'anglais gen', 'linguistique s1'], code: 'MBH1107' },
    { keywords: ['eps s1', 'sport s1'], code: 'MBH1108' },
    { keywords: ['programmation', 'langage', 'c++', 'python', 'algo'], code: 'MBH1209' },
    { keywords: ['analyse num', 'probabilite', 'statistique', 'proba'], code: 'MBH1210' },
    { keywords: ['physique mat', 'technologie medicale', 'physique appli'], code: 'MBH1211' },
    { keywords: ['electronique analogique', 'electronique digitale', 'elec s2'], code: 'MBH1212' },
    { keywords: ['standardisation', 'mesure', 'instrumentation'], code: 'MBH1213' },
    { keywords: ['stage', 'immersion'], code: 'MBH1214' },
    { keywords: ['anglais technique', 'metier mbh'], code: 'MBH1215' },
    { keywords: ['eps s2', 'sport s2'], code: 'MBH1216' },
    { keywords: ['anatomie', 'physiologie', 'biorheologie', 'biorhéologie'], code: 'MBH1317' },
    { keywords: ['electronique medicale', 'électronique médicale', 'nucleaire', 'nucléaire'], code: 'MBH1318' },
    { keywords: ['schemas', 'schémas', 'automatisme'], code: 'MBH1319' },
    { keywords: ['suppleance', 'suppléance', 'exploration fonctionnelle', 'organes artificiels'], code: 'MBH1320' },
    { keywords: ['architecture', 'ordinateurs', 'dispositifs medicaux', 'dispositifs médicaux'], code: 'MBH1321' },
    { keywords: ['electrotechnique', 'électrotechnique'], code: 'MBH1322' },
    { keywords: ['seminaire', 'séminaire', 'genie biomedical', 'génie biomédical'], code: 'MBH1323' },
    { keywords: ['stocks', 'approvisionnement'], code: 'MBH1324' },
  ];

  for (const { keywords, code } of kwMap) {
    if (keywords.some((kw) => lower.includes(kw))) return code;
  }

  return '';
}

// Détection intelligente de la matière par mots-clés (Référentiel officiel MBH1)
function guessMatiere(fileName: string, matieres: { id: string; nom: string }[]): string {
  const lower = fileName.toLowerCase();

  // Si un code UE est détecté, utiliser le nom de l'UE comme matière
  const ueCode = guessUeCode(fileName);
  if (ueCode) {
    const ue = getUeByCode(ueCode);
    if (ue) {
      const match = matieres.find((m) => m.nom.toLowerCase() === ue.nom.toLowerCase());
      if (match) return match.nom;
    }
  }

  const rules: { keywords: string[]; target: string }[] = [
    { keywords: ['math', 'algebre', 'analyse', 'informatique', 'initiation'], target: 'Éléments de Mathématique' },
    { keywords: ['meca', 'solide', 'fluide', 'mecanique'], target: 'Mécanique des Solides' },
    { keywords: ['thermo', 'thermodynamique'], target: 'Thermodynamique' },
    { keywords: ['electronique generale', 'elec gen'], target: 'Électronique générale' },
    { keywords: ['electricite generale', 'elec generale', 'electricite'], target: 'Électricité générale' },
    { keywords: ['biologie', 'chimie', 'bio chim'], target: 'Biologie chimie' },
    { keywords: ['temc', 'linguistique', 'anglais general'], target: 'Éducation linguistique' },
    { keywords: ['eps', 'sport'], target: 'EPS' },
    { keywords: ['programmation', 'langage', 'c++', 'python', 'algo'], target: 'Langage et programmation' },
    { keywords: ['analyse num', 'probabilite', 'statistique', 'proba'], target: 'Éléments d\'Analyse numérique' },
    { keywords: ['physique', 'materiau', 'technologie medicale'], target: 'Physique' },
    { keywords: ['electronique analogique', 'electronique digitale', 'electronique'], target: 'Électronique' },
    { keywords: ['standardisation', 'mesure', 'instrumentation'], target: 'Mesure et standardisation' },
    { keywords: ['stage', 'immersion'], target: 'Stage d\'immersion' },
    { keywords: ['anglais technique', 'metier'], target: 'Éducation linguistique appliquée' },
    { keywords: ['anatomie', 'physiologie', 'biorheologie', 'biorhéologie'], target: 'Anatomie-Physiologie et Biorhéologie' },
    { keywords: ['electronique medicale', 'électronique médicale', 'nucleaire', 'nucléaire'], target: 'Électronique médicale et nucléaire' },
    { keywords: ['schemas', 'schémas', 'automatisme'], target: 'Schémas et Automatisme' },
    { keywords: ['suppleance', 'suppléance', 'exploration fonctionnelle', 'organes artificiels'], target: 'Équipements de suppléance et d\'exploration fonctionnelle' },
    { keywords: ['architecture', 'ordinateurs', 'dispositifs medicaux'], target: 'Architecture des ordinateurs et Information des dispositifs médicaux' },
    { keywords: ['electrotechnique', 'électrotechnique'], target: 'Électrotechnique' },
    { keywords: ['seminaire', 'séminaire', 'genie biomedical'], target: 'Séminaire en Génie Biomédical' },
    { keywords: ['stocks', 'approvisionnement'], target: 'Gestion des Stocks et Approvisionnement' },
  ];

  for (const rule of rules) {
    if (rule.keywords.some((kw) => lower.includes(kw))) {
      const match = matieres.find((m) => m.nom.toLowerCase() === rule.target.toLowerCase());
      if (match) return match.nom;
    }
  }

  // Correspondance directe si un nom de matière est dans le fichier
  for (const m of matieres) {
    if (lower.includes(m.nom.toLowerCase())) {
      return m.nom;
    }
  }

  return matieres[0]?.nom || 'Éléments de Mathématique';
}

// Détection du type d'épreuve
function guessType(fileName: string): TypeEpreuve {
  const lower = fileName.toLowerCase();
  if (lower.includes('rat') || lower.includes('rattrapage')) return 'rattrapage';
  return 'devoir';
}

// Détection du niveau
function guessNiveau(fileName: string): string {
  const lower = fileName.toLowerCase();
  if (lower.includes('1ere') || lower.includes('1ère') || lower.includes('l1')) return '1ère année';
  if (lower.includes('2eme') || lower.includes('2ème') || lower.includes('l2')) return '2ème année';
  if (lower.includes('3eme') || lower.includes('3ème') || lower.includes('l3')) return '3ème année';
  if (lower.includes('4eme') || lower.includes('4ème') || lower.includes('m1')) return '4ème année';
  if (lower.includes('5eme') || lower.includes('5ème') || lower.includes('m2')) return '5ème année';
  return '2ème année';
}

export function BulkUploadManager({ matieresList, onUploadSuccess }: BulkUploadManagerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addPageInputRef = useRef<HTMLInputElement>(null);
  const addCorrigeInputRef = useRef<HTMLInputElement>(null);
  const academicYears = getAcademicYears(6);

  // File d'attente d'upload
  const [queue, setQueue] = useState<BulkUploadItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // Sélection multiple pour regroupement en 1 épreuve
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());

  // Gestion des pages d'une épreuve spécifique (modal)
  const [managingPagesItemId, setManagingPagesItemId] = useState<string | null>(null);

  // Cible courante pour l'ajout de page ou de corrigé
  const [activeTargetItemId, setActiveTargetItemId] = useState<string | null>(null);

  // Valeurs globales pour remplissage rapide
  const [defaultAnnee, setDefaultAnnee] = useState(academicYears[0] || '2024-2025');
  const [defaultNiveau, setDefaultNiveau] = useState('2ème année');
  const [defaultType, setDefaultType] = useState<TypeEpreuve>('devoir');
  const [defaultUeCode, setDefaultUeCode] = useState(ALL_CURRICULUM_UES[0]?.code || 'MBH1101');
  const [defaultMatiere, setDefaultMatiere] = useState(ALL_CURRICULUM_UES[0]?.nom || 'Éléments de Mathématique');
  const [defaultEcuNom, setDefaultEcuNom] = useState('');

  // État du processus d'envoi
  const [isUploadingAll, setIsUploadingAll] = useState(false);
  const [uploadStatusMessage, setUploadStatusMessage] = useState<string | null>(null);
  const [uploadStats, setUploadStats] = useState<{ total: number; done: number; success: number; errors: number } | null>(null);

  // Gestion de l'ajout de nouveaux fichiers à la file
  const handleAddFiles = useCallback((files: FileList | File[]) => {
    const newItems: BulkUploadItem[] = [];
    const validExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'heic', 'webp'];

    Array.from(files).forEach((file) => {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      if (!validExtensions.includes(ext)) {
        alert(`Le fichier "${file.name}" a une extension non supportée.`);
        return;
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        alert(`Le fichier "${file.name}" dépasse la limite de 15 Mo.`);
        return;
      }

      const id = 'bulk_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
      const detectedUeCode = guessUeCode(file.name);
      const matchedUe = detectedUeCode ? getUeByCode(detectedUeCode) : undefined;
      const detectedMatiere = matchedUe ? matchedUe.nom : guessMatiere(file.name, matieresList);
      const detectedType = guessType(file.name);
      const detectedNiveau = guessNiveau(file.name);
      const suggestedTitre = cleanFileNameToTitle(file.name);

      // Détection automatique de l'ECU s'il est mentionné dans le nom de fichier
      let detectedEcuNom = '';
      if (matchedUe) {
        const lower = file.name.toLowerCase();
        for (const ecu of matchedUe.ecu) {
          if (lower.includes(ecu.toLowerCase())) {
            detectedEcuNom = ecu;
            break;
          }
        }
      }

      newItems.push({
        id,
        file,
        files: [file], // Liste des pages de l'épreuve (initialisée avec 1 page)
        fileName: file.name,
        fileSize: file.size,
        matiereNom: detectedMatiere,
        ueCode: detectedUeCode,
        ecuNom: detectedEcuNom,
        niveau: detectedNiveau,
        anneeAcademique: defaultAnnee || academicYears[0] || '2024-2025',
        type: detectedType,
        titre: suggestedTitre,
        status: 'idle',
        progress: 0,
        corrigeFile: null,
      });
    });

    if (newItems.length > 0) {
      setQueue((prev) => [...prev, ...newItems]);
    }
  }, [matieresList, defaultAnnee, academicYears]);

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleAddFiles(e.dataTransfer.files);
    }
  };

  // Mise à jour d'un champ d'une ligne
  const updateItem = (id: string, updates: Partial<BulkUploadItem>) => {
    setQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  // Suppression d'un item de la file
  const removeItem = (id: string) => {
    setQueue((prev) => prev.filter((item) => item.id !== id));
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    if (managingPagesItemId === id) setManagingPagesItemId(null);
  };

  // Vider les épreuves terminées avec succès
  const clearCompleted = () => {
    setQueue((prev) => prev.filter((item) => item.status !== 'success'));
  };

  // Tout réinitialiser
  const clearAll = () => {
    if (queue.length === 0) return;
    if (confirm('Voulez-vous retirer tous les fichiers de la liste d\'importation ?')) {
      setQueue([]);
      setSelectedItemIds(new Set());
      setUploadStats(null);
      setManagingPagesItemId(null);
    }
  };

  const applyDefaultsToPending = () => {
    const matchedUe = ALL_CURRICULUM_UES.find(u => u.code === defaultUeCode) || ALL_CURRICULUM_UES.find(u => u.nom === defaultMatiere);
    setQueue((prev) =>
      prev.map((item) => {
        if (item.status === 'success') return item;
        return {
          ...item,
          anneeAcademique: defaultAnnee,
          niveau: defaultNiveau,
          type: defaultType,
          matiereNom: matchedUe ? matchedUe.nom : defaultMatiere,
          ueCode: matchedUe ? matchedUe.code : item.ueCode,
          ecuNom: defaultEcuNom,
        };
      })
    );
  };

  // ============================================================
  // GESTION DES PAGES MULTIPLES PAR ÉPREUVE
  // ============================================================

  // Ajouter des pages à une épreuve existante
  const handleAddPagesToItem = (itemId: string, filesToAdd: FileList | File[]) => {
    const validExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'heic', 'webp'];
    const validFiles: File[] = [];

    Array.from(filesToAdd).forEach((file) => {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      if (!validExtensions.includes(ext)) {
        alert(`Le fichier "${file.name}" a une extension non supportée.`);
        return;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        alert(`Le fichier "${file.name}" dépasse 15 Mo.`);
        return;
      }
      validFiles.push(file);
    });

    if (validFiles.length === 0) return;

    setQueue((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const currentPages = item.files && item.files.length > 0 ? item.files : [item.file];
        const newPages = [...currentPages, ...validFiles];
        const totalSize = newPages.reduce((acc, f) => acc + f.size, 0);

        return {
          ...item,
          files: newPages,
          fileSize: totalSize,
          isMerged: newPages.length > 1,
        };
      })
    );
  };

  // Réordonner les pages
  const movePage = (itemId: string, fromIndex: number, toIndex: number) => {
    setQueue((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const currentPages = [...(item.files && item.files.length > 0 ? item.files : [item.file])];
        if (toIndex < 0 || toIndex >= currentPages.length) return item;

        const [moved] = currentPages.splice(fromIndex, 1);
        currentPages.splice(toIndex, 0, moved);

        return {
          ...item,
          file: currentPages[0],
          files: currentPages,
        };
      })
    );
  };

  // Supprimer une page spécifique d'une épreuve
  const removePageFromItem = (itemId: string, pageIndex: number) => {
    setQueue((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const currentPages = [...(item.files && item.files.length > 0 ? item.files : [item.file])];
        if (currentPages.length <= 1) {
          alert('Une épreuve doit comporter au moins une page. Pour la supprimer totalement, utilisez la corbeille.');
          return item;
        }

        currentPages.splice(pageIndex, 1);
        const totalSize = currentPages.reduce((acc, f) => acc + f.size, 0);

        return {
          ...item,
          file: currentPages[0],
          files: currentPages,
          fileSize: totalSize,
          isMerged: currentPages.length > 1,
        };
      })
    );
  };

  // Action groupée : Fusionner les éléments cochés en une seule épreuve multi-pages
  const mergeSelectedItems = () => {
    if (selectedItemIds.size < 2) {
      alert('Veuillez sélectionner au moins 2 fichiers à regrouper en une seule épreuve.');
      return;
    }

    const selectedList = queue.filter((item) => selectedItemIds.has(item.id));
    const targetItem = selectedList[0];
    const otherItems = selectedList.slice(1);

    // Collecter toutes les pages de tous les éléments sélectionnés
    const combinedPages: File[] = [];
    selectedList.forEach((item) => {
      if (item.files && item.files.length > 0) {
        combinedPages.push(...item.files);
      } else {
        combinedPages.push(item.file);
      }
    });

    const totalSize = combinedPages.reduce((acc, f) => acc + f.size, 0);

    // Mettre à jour l'élément cible et supprimer les autres
    setQueue((prev) =>
      prev
        .filter((item) => !otherItems.some((other) => other.id === item.id))
        .map((item) => {
          if (item.id !== targetItem.id) return item;
          return {
            ...item,
            file: combinedPages[0],
            files: combinedPages,
            fileName: `${targetItem.fileName} (+${combinedPages.length - 1} pages)`,
            fileSize: totalSize,
            isMerged: true,
          };
        })
    );

    setSelectedItemIds(new Set());
    setManagingPagesItemId(targetItem.id);
  };

  const toggleSelectOne = (id: string) => {
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedItemIds.size === queue.length) {
      setSelectedItemIds(new Set());
    } else {
      setSelectedItemIds(new Set(queue.map((i) => i.id)));
    }
  };

  // ============================================================
  // GESTION DU CORRIGÉ / BARÈME
  // ============================================================

  const handleAttachCorrige = (itemId: string, file: File) => {
    const validExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'heic', 'webp'];
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!validExtensions.includes(ext)) {
      alert(`Format non supporté pour le corrigé. Utilisez PDF, JPG ou PNG.`);
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      alert(`Le fichier de corrigé dépasse 15 Mo.`);
      return;
    }

    updateItem(itemId, {
      corrigeFile: file,
      corrigeFiles: [file],
    });
  };

  const handleRemoveCorrige = (itemId: string) => {
    updateItem(itemId, {
      corrigeFile: null,
      corrigeFiles: undefined,
    });
  };

  // ============================================================
  // PROCESSUS D'UPLOAD
  // ============================================================

  // Téléversement d'un seul élément (avec fusion préalable si multi-pages)
  const uploadSingleItem = async (item: BulkUploadItem): Promise<boolean> => {
    const pages = item.files && item.files.length > 0 ? item.files : [item.file];
    const isMultiPage = pages.length > 1;

    updateItem(item.id, {
      status: 'uploading',
      progress: isMultiPage ? 20 : 30,
      errorMsg: undefined,
    });

    try {
      let finalEpreuveFile: File;

      // 1. Fusion des pages si multi-pages
      if (isMultiPage) {
        setUploadStatusMessage(`Fusion de ${pages.length} pages pour "${item.titre || item.fileName}"...`);
        const safeTitle = (item.titre.trim() || item.fileName).replace(/[^a-zA-Z0-9_-]/g, '_');
        finalEpreuveFile = await mergeFilesToPdf(pages, `${safeTitle}_epreuve.pdf`);
      } else {
        finalEpreuveFile = item.file;
      }

      // 2. Fusion éventuelle du corrigé si multi-pages
      let finalCorrigeFile: File | null = item.corrigeFile || null;
      if (item.corrigeFiles && item.corrigeFiles.length > 1) {
        setUploadStatusMessage(`Fusion des pages du corrigé pour "${item.titre || item.fileName}"...`);
        const safeTitle = (item.titre.trim() || item.fileName).replace(/[^a-zA-Z0-9_-]/g, '_');
        finalCorrigeFile = await mergeFilesToPdf(item.corrigeFiles, `corrige_${safeTitle}.pdf`);
      }

      updateItem(item.id, { progress: 60 });
      setUploadStatusMessage(`Téléversement de "${item.titre || item.fileName}"...`);

      // 3. Envoi multipart
      const formData = new FormData();
      formData.append('file', finalEpreuveFile);
      formData.append('matiere_nom', item.matiereNom.trim());
      formData.append('niveau', item.niveau.trim());
      formData.append('annee_academique', item.anneeAcademique.trim());
      formData.append('type', item.type);
      formData.append('titre', item.titre.trim() || item.fileName);

      // Rattachement UE/ECU (référentiel officiel MBH1 — source unique de vérité)
      if (item.ueCode) {
        formData.append('ue_code', item.ueCode.trim());
      }
      if (item.ecuNom) {
        formData.append('ecu_nom', item.ecuNom.trim());
      }

      if (finalCorrigeFile) {
        formData.append('corrige_file', finalCorrigeFile);
      }

      const res = await fetch('/api/epreuves', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Échec du téléversement');
      }

      updateItem(item.id, {
        status: 'success',
        progress: 100,
        uploadedEpreuveId: data.id || data.epreuve?.id,
      });
      return true;
    } catch (err: any) {
      updateItem(item.id, {
        status: 'error',
        progress: 0,
        errorMsg: err.message || 'Erreur lors du téléversement',
      });
      return false;
    }
  };

  // Téléversement de toute la file séquentiellement
  const handleUploadAll = async () => {
    const pendingItems = queue.filter((item) => item.status === 'idle' || item.status === 'error');
    if (pendingItems.length === 0) return;

    setIsUploadingAll(true);
    let successCount = queue.filter((i) => i.status === 'success').length;
    let errorCount = 0;
    const totalItems = pendingItems.length + successCount;

    setUploadStats({
      total: totalItems,
      done: successCount,
      success: successCount,
      errors: 0,
    });

    for (const item of pendingItems) {
      const ok = await uploadSingleItem(item);
      if (ok) {
        successCount++;
      } else {
        errorCount++;
      }
      setUploadStats({
        total: totalItems,
        done: successCount + errorCount,
        success: successCount,
        errors: errorCount,
      });
    }

    setIsUploadingAll(false);
    setUploadStatusMessage(null);
    if (onUploadSuccess) {
      onUploadSuccess();
    }
  };

  const pendingCount = queue.filter((i) => i.status === 'idle').length;
  const successCount = queue.filter((i) => i.status === 'success').length;
  const errorCount = queue.filter((i) => i.status === 'error').length;
  const currentManagingItem = queue.find((i) => i.id === managingPagesItemId);

  return (
    <div className="space-y-6">
      {/* Inputs cachés pour ajouts ciblés */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.jpg,.jpeg,.png,.heic,.webp"
        className="hidden"
        onChange={(e) => {
          if (e.target.files) handleAddFiles(e.target.files);
          e.target.value = '';
        }}
      />

      <input
        ref={addPageInputRef}
        type="file"
        multiple
        accept=".pdf,.jpg,.jpeg,.png,.heic,.webp"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && activeTargetItemId) {
            handleAddPagesToItem(activeTargetItemId, e.target.files);
          }
          e.target.value = '';
        }}
      />

      <input
        ref={addCorrigeInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.heic,.webp"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0] && activeTargetItemId) {
            handleAttachCorrige(activeTargetItemId, e.target.files[0]);
          }
          e.target.value = '';
        }}
      />

      {/* En-tête explicatif */}
      <div className="bg-surface-card rounded-3xl p-6 sm:p-8 border border-surface-border shadow-subtle dark:shadow-none flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-1 rounded-xl bg-brand-50 dark:bg-brand-700/20 text-brand-700 dark:text-brand-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              <span>Importation Multiple</span>
            </span>
            <span className="text-xs font-bold text-ink-muted">| Session Fondateur</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-ink">
            Téléversement en Lot des Épreuves Passées
          </h2>
          <p className="text-xs sm:text-sm text-ink-muted mt-1 max-w-2xl">
            Importez des épreuves complètes ou en plusieurs pages. Les pages photographiées d&apos;une même épreuve sont 
            <strong> automatiquement fusionnées en un seul PDF</strong>, avec possibilité de joindre un corrigé ou barème.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-brand-700 hover:bg-brand-800 text-white text-xs sm:text-sm font-bold rounded-2xl shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Sélectionner des fichiers</span>
        </button>
      </div>

      {/* Zone de glisser-déposer */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all cursor-pointer ${
          isDragging
            ? 'border-brand-700 bg-brand-50/70 dark:bg-brand-700/20 scale-[1.01]'
            : 'border-surface-border hover:border-brand-400 bg-surface-card hover:bg-surface-2/60'
        }`}
      >
        <div className="max-w-md mx-auto flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-brand-50 dark:bg-brand-700/20 text-brand-700 dark:text-brand-300 flex items-center justify-center mb-4 shadow-subtle group-hover:scale-110 transition-transform">
            <UploadCloud className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-ink mb-1">
            Glissez vos épreuves ou pages ici
          </h3>
          <p className="text-xs text-ink-muted mb-3">
            PDF, JPG, PNG acceptés (jusqu&apos;à 15 Mo par fichier). Déposez plusieurs photos pour une épreuve, elles seront fusionnées au final.
          </p>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-surface-2 text-ink-muted text-xs font-bold border border-surface-border">
            <FileUp className="w-3.5 h-3.5 text-ink-muted" />
            <span>Parcourir les dossiers</span>
          </span>
        </div>
      </div>

      {/* Remplissage rapide / Paramètres par défaut pour la file */}
      {queue.length > 0 && (
        <div className="bg-surface-2/70 p-5 rounded-3xl border border-surface-border shadow-subtle dark:shadow-none">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-brand-700 dark:text-brand-400" />
              <h3 className="text-xs sm:text-sm font-bold text-ink">
                Appliquer en masse à toute la file
              </h3>
            </div>
            <button
              type="button"
              onClick={applyDefaultsToPending}
              className="text-xs font-bold text-brand-700 dark:text-brand-400 hover:underline flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Tout réaligner sur ces valeurs</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {/* Matière / UE par défaut */}
            <div>
              <label className="block text-ink-muted font-bold mb-1">Matière / UE par défaut</label>
              <select
                value={defaultUeCode}
                onChange={(e) => {
                  const selCode = e.target.value;
                  setDefaultUeCode(selCode);
                  const matched = ALL_CURRICULUM_UES.find((u) => u.code === selCode);
                  if (matched) {
                    setDefaultMatiere(matched.nom);
                    setDefaultEcuNom('');
                  }
                }}
                className="w-full px-3 py-2 bg-surface border border-surface-border text-ink rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-brand-700 truncate"
              >
                {ALL_CURRICULUM_UES.map((u) => (
                  <option key={u.code} value={u.code}>
                    [{u.code}] {u.nom} (S{u.semester})
                  </option>
                ))}
              </select>
            </div>

            {/* Niveau par défaut */}
            <div>
              <label className="block text-ink-muted font-bold mb-1">Niveau par défaut</label>
              <select
                value={defaultNiveau}
                onChange={(e) => setDefaultNiveau(e.target.value)}
                className="w-full px-3 py-2 bg-surface border border-surface-border text-ink rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-brand-700"
              >
                {VALID_NIVEAUX_PREDEFINIS.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>

            {/* Année par défaut */}
            <div>
              <label className="block text-ink-muted font-bold mb-1">Année académique par défaut</label>
              <select
                value={defaultAnnee}
                onChange={(e) => setDefaultAnnee(e.target.value)}
                className="w-full px-3 py-2 bg-surface border border-surface-border text-ink rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-brand-700"
              >
                {academicYears.map((yr) => (
                  <option key={yr} value={yr}>{yr}</option>
                ))}
              </select>
            </div>

            {/* Type par défaut */}
            <div>
              <label className="block text-ink-muted font-bold mb-1">Type d&apos;épreuve par défaut</label>
              <select
                value={defaultType}
                onChange={(e) => setDefaultType(e.target.value as TypeEpreuve)}
                className="w-full px-3 py-2 bg-surface border border-surface-border text-ink rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-brand-700 capitalize"
              >
                {VALID_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Barre d'actions sur la file */}
      {queue.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-card p-4 rounded-2xl border border-surface-border shadow-subtle dark:shadow-none">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={toggleSelectAll}
              className="text-xs font-bold text-ink hover:text-brand-700 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-surface-border hover:bg-surface-2 transition-colors"
            >
              {selectedItemIds.size === queue.length ? (
                <CheckSquare className="w-3.5 h-3.5 text-brand-700 dark:text-brand-400" />
              ) : (
                <Square className="w-3.5 h-3.5 text-ink-muted" />
              )}
              <span>Sélection ({selectedItemIds.size})</span>
            </button>

            {selectedItemIds.size >= 2 && (
              <button
                type="button"
                onClick={mergeSelectedItems}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-50 dark:bg-brand-700/20 border border-brand-200 dark:border-brand-700/40 text-brand-700 dark:text-brand-300 hover:bg-brand-100 text-xs font-bold transition-all shadow-xs"
                title="Fusionner les éléments sélectionnés en une seule épreuve multi-pages"
              >
                <Combine className="w-3.5 h-3.5 text-brand-700 dark:text-brand-400" />
                <span>Fusionner la sélection en 1 épreuve ({selectedItemIds.size} fichiers)</span>
              </button>
            )}

            <div className="flex items-center gap-2 text-[11px] ml-2">
              {pendingCount > 0 && (
                <span className="px-2 py-0.5 rounded-md bg-surface-2 text-ink font-semibold border border-surface-border">
                  {pendingCount} prêt(s)
                </span>
              )}
              {successCount > 0 && (
                <span className="px-2 py-0.5 rounded-md bg-brand-50 dark:bg-brand-700/20 text-brand-700 dark:text-brand-300 font-bold border border-brand-200 dark:border-brand-700/40 flex items-center gap-1">
                  <Check className="w-3 h-3" /> {successCount} envoyé(s)
                </span>
              )}
              {errorCount > 0 && (
                <span className="px-2 py-0.5 rounded-md bg-danger-50 dark:bg-danger/10 text-danger font-bold border border-danger/30 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errorCount} erreur(s)
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {successCount > 0 && (
              <button
                type="button"
                onClick={clearCompleted}
                className="text-xs text-ink-muted hover:text-ink font-bold px-3 py-1.5 rounded-xl border border-surface-border hover:bg-surface-2 transition-colors"
              >
                Nettoyer réussites
              </button>
            )}
            <button
              type="button"
              onClick={clearAll}
              disabled={isUploadingAll}
              className="text-xs text-danger hover:text-white font-bold px-3 py-1.5 rounded-xl border border-danger hover:bg-danger transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Tout vider
            </button>
            <button
              type="button"
              onClick={handleUploadAll}
              disabled={isUploadingAll || pendingCount === 0}
              className="inline-flex items-center gap-2 px-5 py-2 bg-brand-700 hover:bg-brand-800 disabled:opacity-50 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-all active:scale-[0.98] disabled:cursor-not-allowed"
            >
              {isUploadingAll ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Envoi en cours...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Lancer l&apos;importation ({pendingCount})</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Progression globale */}
      {uploadStats && (
        <div className="bg-brand-50 dark:bg-brand-700/12 border border-brand-200/80 dark:border-brand-700/30 p-4 rounded-2xl shadow-subtle dark:shadow-none animate-in fade-in">
          <div className="flex items-center justify-between text-xs font-bold text-ink mb-2">
            <span>
              Progression du lot : {uploadStats.done} / {uploadStats.total} traitées
              {uploadStatusMessage && <span className="ml-2 font-normal text-ink-muted font-mono text-[11px]">({uploadStatusMessage})</span>}
            </span>
            <span className="font-extrabold text-brand-700 dark:text-brand-400">{Math.round((uploadStats.done / uploadStats.total) * 100)}%</span>
          </div>
          <div className="w-full h-2.5 bg-surface-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-700 transition-all duration-300 rounded-full"
              style={{ width: `${(uploadStats.done / uploadStats.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Liste des cartes d'épreuves prêtes à être éditées */}
      <div className="space-y-4">
        {queue.map((item, index) => {
          const pages = item.files && item.files.length > 0 ? item.files : [item.file];
          const pageCount = pages.length;
          const isPdf = item.file.type === 'application/pdf' || item.fileName.endsWith('.pdf');
          const isSelected = selectedItemIds.has(item.id);

          return (
            <div
              key={item.id}
              className={`bg-surface-card rounded-2xl p-5 border transition-all ${
                isSelected ? 'ring-2 ring-brand-700 border-brand-700' : ''
              } ${
                item.status === 'success'
                  ? 'border-brand-200/80 dark:border-brand-700/40 bg-brand-50/20 dark:bg-brand-700/5'
                  : item.status === 'error'
                  ? 'border-danger/30 bg-danger-50/20 dark:bg-danger/5'
                  : item.status === 'uploading'
                  ? 'border-accent-400/40 bg-accent-100/10'
                  : 'border-surface-border shadow-subtle dark:shadow-none'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-surface-border">
                {/* Métadonnées Fichier & Checkbox */}
                <div className="flex items-center gap-3 min-w-0">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelectOne(item.id)}
                    className="w-4 h-4 rounded text-brand-700 focus:ring-accent-400 accent-brand-700 cursor-pointer"
                  />

                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isPdf ? 'bg-danger-50 dark:bg-danger/10 text-danger border border-danger-50 dark:border-danger/20' : 'bg-brand-50 dark:bg-brand-700/15 text-brand-700 dark:text-brand-400 border border-brand-100 dark:border-brand-700/30'
                  }`}>
                    {isPdf ? <FileText className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-ink-muted">#{index + 1}</span>
                      <h4 className="text-xs sm:text-sm font-bold text-ink truncate max-w-sm">
                        {item.fileName}
                      </h4>

                      {/* Badge du nombre de pages */}
                      <button
                        type="button"
                        onClick={() => setManagingPagesItemId(item.id)}
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition-colors ${
                          pageCount > 1
                            ? 'bg-brand-50 dark:bg-brand-700/20 text-brand-700 dark:text-brand-300 border-brand-200 dark:border-brand-700/40'
                            : 'bg-surface-2 text-ink-muted border-surface-border hover:bg-surface-2/80'
                        }`}
                        title="Gérer les pages de cette épreuve"
                      >
                        <Files className="w-3 h-3" />
                        <span>{pageCount} page{pageCount > 1 ? 's (PDF fusionné)' : ''}</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-3 mt-0.5 text-[11px] text-ink-muted font-medium">
                      <span>{formatFileSize(item.fileSize)}</span>
                      <span>•</span>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTargetItemId(item.id);
                          addPageInputRef.current?.click();
                        }}
                        className="text-brand-700 dark:text-brand-400 font-bold hover:underline inline-flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Ajouter une page</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Statut & Action suppression */}
                <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
                  {item.status === 'idle' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-accent-100 dark:bg-accent-400/15 text-accent-700 dark:text-accent-400 border border-accent-400/30 text-[11px] font-bold">
                      <Clock className="w-3 h-3" />
                      En attente
                    </span>
                  )}
                  {item.status === 'uploading' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-accent-100 dark:bg-accent-400/15 text-accent-700 dark:text-accent-400 border border-accent-400/30 text-[11px] font-bold animate-pulse">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      En cours...
                    </span>
                  )}
                  {item.status === 'success' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-brand-50 dark:bg-brand-700/20 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-700/40 text-[11px] font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-brand-700 dark:text-brand-400" />
                      En ligne ({item.uploadedEpreuveId || 'OK'})
                    </span>
                  )}
                  {item.status === 'error' && (
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-danger-50 dark:bg-danger/10 text-danger border border-danger/30 text-[11px] font-bold">
                        <AlertCircle className="w-3 h-3 text-danger" />
                        Échec : {item.errorMsg || 'Erreur'}
                      </span>
                      <button
                        type="button"
                        onClick={() => uploadSingleItem(item)}
                        className="text-[11px] font-bold text-brand-700 dark:text-brand-400 hover:underline"
                      >
                        Réessayer
                      </button>
                    </div>
                  )}

                  {item.status !== 'uploading' && (
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="p-1.5 text-ink-muted hover:text-danger hover:bg-danger-50 dark:hover:bg-danger/10 rounded-lg transition-colors"
                      title="Retirer ce fichier"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Formulaire spécifique à l'épreuve */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 pt-4 text-xs">
                {/* Titre / Description */}
                <div className="lg:col-span-4">
                  <label className="block font-bold text-ink-muted mb-1">
                    Titre / Précision du sujet
                  </label>
                  <input
                    type="text"
                    value={item.titre}
                    disabled={item.status === 'success' || item.status === 'uploading'}
                    onChange={(e) => updateItem(item.id, { titre: e.target.value })}
                    placeholder="Ex: Examen final Rayonnements X..."
                    className="w-full px-3 py-2 bg-surface border border-surface-border text-ink rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-brand-700 disabled:bg-surface-2 disabled:text-ink-muted"
                  />
                </div>

                {/* Matière / UE */}
                <div className="lg:col-span-3">
                  <label className="block font-bold text-ink-muted mb-1">
                    Matière / UE MBH
                  </label>
                  <select
                    value={item.ueCode || (ALL_CURRICULUM_UES.find((u) => u.nom.toLowerCase() === item.matiereNom.toLowerCase())?.code || '')}
                    disabled={item.status === 'success' || item.status === 'uploading'}
                    onChange={(e) => {
                      const selCode = e.target.value;
                      const matched = ALL_CURRICULUM_UES.find((u) => u.code === selCode);
                      if (matched) {
                        updateItem(item.id, {
                          ueCode: matched.code,
                          matiereNom: matched.nom,
                          ecuNom: '',
                        });
                      }
                    }}
                    className="w-full px-3 py-2 bg-surface border border-surface-border text-ink rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-brand-700 truncate disabled:bg-surface-2 disabled:text-ink-muted"
                  >
                    <option value="">-- Choisir une UE --</option>
                    {ALL_CURRICULUM_UES.map((u) => (
                      <option key={u.code} value={u.code}>
                        [{u.code}] {u.nom} (S{u.semester})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Niveau */}
                <div className="lg:col-span-2">
                  <label className="block font-bold text-ink-muted mb-1">
                    Niveau
                  </label>
                  <select
                    value={item.niveau}
                    disabled={item.status === 'success' || item.status === 'uploading'}
                    onChange={(e) => updateItem(item.id, { niveau: e.target.value })}
                    className="w-full px-3 py-2 bg-surface border border-surface-border text-ink rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-brand-700 disabled:bg-surface-2 disabled:text-ink-muted"
                  >
                    {VALID_NIVEAUX_PREDEFINIS.map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>

                {/* Année Académique */}
                <div className="lg:col-span-2">
                  <label className="block font-bold text-ink-muted mb-1">
                    Année
                  </label>
                  <select
                    value={item.anneeAcademique}
                    disabled={item.status === 'success' || item.status === 'uploading'}
                    onChange={(e) => updateItem(item.id, { anneeAcademique: e.target.value })}
                    className="w-full px-3 py-2 bg-surface border border-surface-border text-ink rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-brand-700 disabled:bg-surface-2 disabled:text-ink-muted"
                  >
                    {academicYears.map((yr) => (
                      <option key={yr} value={yr}>{yr}</option>
                    ))}
                  </select>
                </div>

                {/* Type */}
                <div className="lg:col-span-1">
                  <label className="block font-bold text-ink-muted mb-1">
                    Type
                  </label>
                  <select
                    value={item.type}
                    disabled={item.status === 'success' || item.status === 'uploading'}
                    onChange={(e) => updateItem(item.id, { type: e.target.value as TypeEpreuve })}
                    className="w-full px-2 py-2 bg-surface border border-surface-border text-ink rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-brand-700 capitalize disabled:bg-surface-2 disabled:text-ink-muted"
                  >
                    {VALID_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Ligne Second Niveau ECU (optionnel) */}
              {(() => {
                const currentUe = (item.ueCode ? getUeByCode(item.ueCode) : null) || ALL_CURRICULUM_UES.find((u) => u.nom.toLowerCase() === item.matiereNom.toLowerCase());
                if (!currentUe || currentUe.ecu.length === 0) return null;
                return (
                  <div className="mt-3 pt-3 border-t border-surface-border flex flex-wrap items-center justify-between gap-3 text-xs bg-brand-50/60 dark:bg-brand-700/10 -mx-5 px-5 py-2.5 rounded-xl border border-brand-200/60 dark:border-brand-700/30">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-brand-900 dark:text-brand-300 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-brand-700 dark:text-brand-400" />
                        <span>ECU ciblé ({currentUe.ecu.length}) :</span>
                      </span>
                      <select
                        value={item.ecuNom || ''}
                        disabled={item.status === 'success' || item.status === 'uploading'}
                        onChange={(e) => updateItem(item.id, { ecuNom: e.target.value })}
                        className="px-2.5 py-1 bg-surface border border-brand-300/80 dark:border-brand-700/50 rounded-lg font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-accent-400 text-xs disabled:bg-surface-2 disabled:text-ink-muted"
                      >
                        <option value="">Épreuve globale de l&apos;UE ({currentUe.code})</option>
                        {currentUe.ecu.map((ecuName) => (
                          <option key={ecuName} value={ecuName}>
                            Épreuve spécifique : {ecuName}
                          </option>
                        ))}
                      </select>
                    </div>
                    {item.ecuNom ? (
                      <span className="text-[11px] font-bold text-brand-800 dark:text-brand-300 bg-surface px-2.5 py-0.5 rounded-full border border-brand-200 dark:border-brand-700/40">
                        Rattaché à : {item.ecuNom}
                      </span>
                    ) : (
                      <span className="text-[11px] text-ink-muted">
                        Couvre l&apos;ensemble de l&apos;UE {currentUe.code}
                      </span>
                    )}
                  </div>
                );
              })()}

              {/* Ligne Corrigé / Barème optionnel */}
              <div className="mt-3 pt-3 border-t border-dashed border-surface-border flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-ink-muted flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-brand-700 dark:text-brand-400" />
                    <span>Corrigé / Barème :</span>
                  </span>

                  {item.corrigeFile ? (
                    <div className="inline-flex items-center gap-2 bg-brand-50 dark:bg-brand-700/20 border border-brand-200 dark:border-brand-700/40 text-brand-700 dark:text-brand-300 px-3 py-1 rounded-xl font-bold shadow-2xs">
                      <CheckCircle2 className="w-3.5 h-3.5 text-brand-700 dark:text-brand-400 shrink-0" />
                      <span className="truncate max-w-[200px]">{item.corrigeFile.name}</span>
                      <span className="text-[10px] text-brand-600 dark:text-brand-400">({formatFileSize(item.corrigeFile.size)})</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCorrige(item.id)}
                        disabled={item.status === 'success' || item.status === 'uploading'}
                        className="text-brand-700 dark:text-brand-400 hover:text-danger ml-1"
                        title="Retirer ce corrigé"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTargetItemId(item.id);
                        addCorrigeInputRef.current?.click();
                      }}
                      disabled={item.status === 'success' || item.status === 'uploading'}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-surface-2 hover:bg-surface-border/50 text-ink font-bold rounded-xl border border-surface-border transition-colors disabled:opacity-50"
                    >
                      <Plus className="w-3.5 h-3.5 text-ink-muted" />
                      <span>+ Joindre un corrigé si disponible</span>
                    </button>
                  )}
                </div>

                {/* Raccourci gestion des pages */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setManagingPagesItemId(item.id)}
                    className="text-[11px] font-bold text-brand-700 dark:text-brand-400 hover:underline flex items-center gap-1"
                  >
                    <Files className="w-3 h-3" />
                    <span>Organiser les pages ({pageCount})</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ============================================================ */}
      {/* MODALE DE GESTION DES PAGES D'UNE ÉPREUVE                    */}
      {/* ============================================================ */}
      {currentManagingItem && (
        <div className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-card rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-surface-border max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95">
            {/* Header modal */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-surface-border">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-brand-50 dark:bg-brand-700/20 text-brand-700 dark:text-brand-300 font-black text-xs border border-brand-200 dark:border-brand-700/40">
                    Épreuve Multi-pages
                  </span>
                  <span className="text-xs text-ink-muted font-medium">
                    {formatFileSize(currentManagingItem.fileSize)} total
                  </span>
                </div>
                <h3 className="text-base font-bold text-ink mt-1">
                  Gestion des pages : {currentManagingItem.titre || currentManagingItem.fileName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setManagingPagesItemId(null)}
                className="p-1.5 text-ink-muted hover:text-ink rounded-xl hover:bg-surface-2 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Corps modal : Liste ordonnée des pages */}
            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              <p className="text-xs text-ink-muted">
                L&apos;ordre ci-dessous sera exactement celui des pages du PDF généré. Utilisez les flèches pour réordonner vos photos ou scans.
              </p>

              {(currentManagingItem.files && currentManagingItem.files.length > 0
                ? currentManagingItem.files
                : [currentManagingItem.file]
              ).map((pageFile, pIdx, arr) => {
                const isPdfPage = pageFile.type === 'application/pdf' || pageFile.name.endsWith('.pdf');

                return (
                  <div
                    key={`${pageFile.name}_${pIdx}`}
                    className="flex items-center justify-between gap-3 p-3 rounded-2xl border border-surface-border bg-surface-2/60 hover:bg-surface-2 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-6 h-6 rounded-lg bg-brand-100 dark:bg-brand-700/30 text-brand-900 dark:text-brand-300 font-black text-xs flex items-center justify-center shrink-0">
                        {pIdx + 1}
                      </span>

                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isPdfPage ? 'bg-danger-50 dark:bg-danger/10 text-danger border border-danger-50 dark:border-danger/20' : 'bg-brand-50 dark:bg-brand-700/15 text-brand-700 dark:text-brand-400 border border-brand-100 dark:border-brand-700/30'
                      }`}>
                        {isPdfPage ? <FileText className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs font-bold text-ink truncate max-w-xs sm:max-w-md">
                          {pageFile.name}
                        </p>
                        <p className="text-[11px] text-ink-muted">
                          {formatFileSize(pageFile.size)} • {isPdfPage ? 'Document PDF' : 'Image scan'}
                        </p>
                      </div>
                    </div>

                    {/* Actions sur la page */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        disabled={pIdx === 0}
                        onClick={() => movePage(currentManagingItem.id, pIdx, pIdx - 1)}
                        className="p-1 text-ink-muted hover:text-ink disabled:opacity-30 rounded-lg hover:bg-surface-card transition-colors"
                        title="Monter cette page"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        disabled={pIdx === arr.length - 1}
                        onClick={() => movePage(currentManagingItem.id, pIdx, pIdx + 1)}
                        className="p-1 text-ink-muted hover:text-ink disabled:opacity-30 rounded-lg hover:bg-surface-card transition-colors"
                        title="Descendre cette page"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>

                      {arr.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePageFromItem(currentManagingItem.id, pIdx)}
                          className="p-1 text-ink-muted hover:text-danger rounded-lg hover:bg-surface-card ml-1 transition-colors"
                          title="Supprimer cette page"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Bouton pour ajouter plus de pages à cette épreuve */}
              <button
                type="button"
                onClick={() => {
                  setActiveTargetItemId(currentManagingItem.id);
                  addPageInputRef.current?.click();
                }}
                className="w-full py-3 rounded-2xl border-2 border-dashed border-surface-border hover:border-brand-700/60 text-xs font-bold text-ink-muted hover:text-brand-700 flex items-center justify-center gap-2 transition-colors bg-surface-card"
              >
                <Plus className="w-4 h-4" />
                <span>Ajouter des pages supplémentaires (photos ou PDF)</span>
              </button>
            </div>

            {/* Footer modal */}
            <div className="pt-4 border-t border-surface-border flex items-center justify-between">
              <span className="text-[11px] text-ink-muted font-medium">
                La fusion s&apos;exécutera automatiquement à la validation.
              </span>
              <button
                type="button"
                onClick={() => setManagingPagesItemId(null)}
                className="px-5 py-2 bg-brand-700 hover:bg-brand-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-98"
              >
                Valider l&apos;agencement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
