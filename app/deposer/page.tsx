'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { MatiereEcuSelector } from '@/components/MatiereEcuSelector';
import { Matiere, TypeEpreuve } from '@/types';
import { getAcademicYears, formatFileSize } from '@/lib/utils/date';
import { VALID_NIVEAUX_PREDEFINIS, VALID_TYPES, MAX_FILE_SIZE_BYTES, getCanonicalFileType } from '@/lib/utils/validation';
import { mergeFilesToPdf } from '@/lib/utils/pdf-merger';
import {
  ArrowLeft,
  Upload,
  Sparkles,
  AlertCircle,
  Check,
  Loader2,
  GraduationCap,
  Calendar,
  Award,
  FileCheck,
  ShieldCheck,
  BookOpen,
  CheckCircle2,
  FileText,
  Image as ImageIcon,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  X,
  Layers,
  Files
} from 'lucide-react';

export default function DeposerPage() {
  const router = useRouter();
  const { data: session } = useSession();

  // Données de formulaire
  const [ueCode, setUeCode] = useState('');
  const [ecuNom, setEcuNom] = useState('');
  const [matiereNom, setMatiereNom] = useState('');
  const [niveau, setNiveau] = useState('');
  const [customNiveau, setCustomNiveau] = useState('');
  const [anneeAcademique, setAnneeAcademique] = useState('');
  const [customAnnee, setCustomAnnee] = useState('');
  const [type, setType] = useState<TypeEpreuve | ''>('');
  const [titre, setTitre] = useState('');

  // Fichiers de l'épreuve (support multi-pages / photos multiples)
  const [epreuvePages, setEpreuvePages] = useState<File[]>([]);
  const epreuveInputRef = useRef<HTMLInputElement>(null);

  // Corrigé optionnel
  const [hasCorrige, setHasCorrige] = useState<boolean>(false);
  const [corrigePages, setCorrigePages] = useState<File[]>([]);
  const corrigeInputRef = useRef<HTMLInputElement>(null);

  // Données externes
  const [matieresList, setMatieresList] = useState<Matiere[]>([]);
  const academicYears = getAcademicYears(5);

  // États de validation et de soumission
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittingStep, setSubmittingStep] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Charger les matières
  useEffect(() => {
    fetch('/api/matieres')
      .then((res) => res.json())
      .then((data) => {
        if (data.matieres) setMatieresList(data.matieres);
      })
      .catch((err) => console.error('Erreur chargement matières:', err));
  }, []);

  // Pré-remplir le niveau depuis le profil utilisateur
  useEffect(() => {
    if (session?.user?.email) {
      fetch('/api/profil')
        .then((res) => res.json())
        .then((data) => {
          if (data.profil?.niveau) {
            const niv = data.profil.niveau;
            if (VALID_NIVEAUX_PREDEFINIS.includes(niv)) {
              setNiveau(niv);
            } else {
              setNiveau('Autre');
              setCustomNiveau(niv);
            }
          }
        })
        .catch((err) => console.error(err));
    }
  }, [session]);

  const effectiveNiveau = niveau === 'Autre' ? customNiveau.trim() : niveau;
  const effectiveAnnee = anneeAcademique === 'Plus ancien' ? customAnnee.trim() : anneeAcademique;

  const isFormValid = Boolean(
    (ueCode || matiereNom.trim()) &&
    effectiveNiveau &&
    effectiveAnnee &&
    type &&
    epreuvePages.length > 0 &&
    (!hasCorrige || corrigePages.length > 0)
  );

  // ============================================================
  // GESTION DES PAGES DU SUJET
  // ============================================================

  const handleAddEpreuveFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const valid: File[] = [];

    Array.from(files).forEach((f) => {
      if (f.size > MAX_FILE_SIZE_BYTES) {
        alert(`Le fichier "${f.name}" dépasse la taille maximale de 15 Mo.`);
        return;
      }
      const canonical = getCanonicalFileType(f.name, f.type);
      if (!canonical) {
        alert(`Format non supporté pour "${f.name}". Formats acceptés : PDF, JPG, PNG, HEIC.`);
        return;
      }
      valid.push(f);
    });

    if (valid.length > 0) {
      setEpreuvePages((prev) => [...prev, ...valid]);
      if (errors.file) setErrors((prev) => ({ ...prev, file: '' }));
    }
  };

  const removeEpreuvePage = (index: number) => {
    setEpreuvePages((prev) => prev.filter((_, idx) => idx !== index));
  };

  const moveEpreuvePage = (fromIndex: number, toIndex: number) => {
    setEpreuvePages((prev) => {
      const copy = [...prev];
      if (toIndex < 0 || toIndex >= copy.length) return prev;
      const [moved] = copy.splice(fromIndex, 1);
      copy.splice(toIndex, 0, moved);
      return copy;
    });
  };

  // ============================================================
  // GESTION DU CORRIGÉ
  // ============================================================

  const handleAddCorrigeFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const valid: File[] = [];

    Array.from(files).forEach((f) => {
      if (f.size > MAX_FILE_SIZE_BYTES) {
        alert(`Le fichier de corrigé "${f.name}" dépasse 15 Mo.`);
        return;
      }
      const canonical = getCanonicalFileType(f.name, f.type);
      if (!canonical) {
        alert(`Format non supporté pour le corrigé "${f.name}".`);
        return;
      }
      valid.push(f);
    });

    if (valid.length > 0) {
      setCorrigePages((prev) => [...prev, ...valid]);
      if (errors.corrige) setErrors((prev) => ({ ...prev, corrige: '' }));
    }
  };

  const removeCorrigePage = (index: number) => {
    setCorrigePages((prev) => prev.filter((_, idx) => idx !== index));
  };

  // ============================================================
  // SOUMISSION DU FORMULAIRE
  // ============================================================

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError(null);

    const newErrors: { [key: string]: string } = {};
    if (!matiereNom.trim()) {
      newErrors.matiere = 'Veuillez renseigner ou choisir une matière.';
    }
    if (!effectiveNiveau) {
      newErrors.niveau = 'Veuillez sélectionner votre niveau.';
    }
    if (!effectiveAnnee) {
      newErrors.annee = 'L\'année académique est obligatoire.';
    }
    if (!type) {
      newErrors.type = 'Sélectionnez le type d\'épreuve.';
    }
    if (epreuvePages.length === 0) {
      newErrors.file = 'Veuillez sélectionner au moins une page ou un PDF pour l\'épreuve.';
    }
    if (hasCorrige && corrigePages.length === 0) {
      newErrors.corrige = 'Vous avez indiqué avoir le corrigé. Veuillez joindre le fichier ou repasser sur "Épreuve seule".';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setIsSubmitting(true);
      setUploadProgress(15);

      // 1. Fusion des pages du sujet si plusieurs pages
      let finalEpreuveFile: File;
      if (epreuvePages.length > 1) {
        setSubmittingStep(`Fusion de vos ${epreuvePages.length} photos en un document PDF...`);
        const safeTitle = (titre.trim() || matiereNom.trim()).replace(/[^a-zA-Z0-9_-]/g, '_');
        finalEpreuveFile = await mergeFilesToPdf(epreuvePages, `${safeTitle}_epreuve.pdf`);
      } else {
        finalEpreuveFile = epreuvePages[0];
      }

      setUploadProgress(40);

      // 2. Fusion éventuelle des pages du corrigé si plusieurs
      let finalCorrigeFile: File | null = null;
      if (hasCorrige && corrigePages.length > 0) {
        if (corrigePages.length > 1) {
          setSubmittingStep(`Fusion des ${corrigePages.length} pages du corrigé en un document PDF...`);
          const safeTitle = (titre.trim() || matiereNom.trim()).replace(/[^a-zA-Z0-9_-]/g, '_');
          finalCorrigeFile = await mergeFilesToPdf(corrigePages, `corrige_${safeTitle}.pdf`);
        } else {
          finalCorrigeFile = corrigePages[0];
        }
      }

      setUploadProgress(65);
      setSubmittingStep('Téléversement sécurisé vers la plateforme...');

      // 3. Envoi multipart
      const formData = new FormData();
      formData.append('matiere_nom', matiereNom.trim());
      if (ueCode) formData.append('ue_code', ueCode);
      if (ecuNom) formData.append('ecu_nom', ecuNom);
      formData.append('niveau', effectiveNiveau);
      formData.append('annee_academique', effectiveAnnee);
      formData.append('type', type);
      if (titre.trim()) formData.append('titre', titre.trim());
      formData.append('file', finalEpreuveFile);

      if (finalCorrigeFile) {
        formData.append('corrige_file', finalCorrigeFile);
      }

      const res = await fetch('/api/epreuves', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur lors de la publication.');
      }

      setUploadProgress(100);
      setSubmittingStep('Finalisation...');
      const data = await res.json();
      router.push(`/epreuves/${data.id}?created=true`);
    } catch (err: any) {
      setUploadProgress(null);
      setIsSubmitting(false);
      setSubmittingStep(null);
      setGlobalError(
        err.message || 'Échec de l\'envoi réseau. Cliquez sur Réessayer sans perdre vos saisies.'
      );
    }
  };

  const totalEpreuveSize = epreuvePages.reduce((acc, f) => acc + f.size, 0);
  const totalCorrigeSize = corrigePages.reduce((acc, f) => acc + f.size, 0);

  return (
    <div className="min-h-screen flex flex-col bg-surface-bg selection:bg-brand selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Navigation retour */}
        <div className="mb-6">
          <Link
            href="/epreuves"
            className="inline-flex items-center gap-2 text-xs font-bold text-ink-muted hover:text-brand-700 dark:hover:text-accent-400 transition-colors bg-surface px-3.5 py-2 rounded-xl border border-surface-border shadow-xs"
          >
            <ArrowLeft className="w-4 h-4 text-ink-muted" />
            <span>Retour au catalogue</span>
          </Link>
        </div>

        {/* Form Container */}
        <div className="bg-surface-card rounded-3xl p-6 sm:p-10 border border-surface-border shadow-subtle dark:shadow-none relative overflow-hidden">
          {/* Header */}
          <div className="mb-8 border-b border-surface-border pb-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 rounded-xl bg-brand-50 dark:bg-brand-900/30 text-brand-800 dark:text-brand-200 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border border-brand-200 dark:border-brand-800/40">
                <Sparkles className="w-3.5 h-3.5 text-brand-600 dark:text-accent-400" />
                <span>Contribution Solidaire MBH</span>
              </span>
              <span className="text-xs font-bold text-ink-muted">| Promotion de l&apos;Excellence</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-ink tracking-tight font-heading">
              Déposer une épreuve passée
            </h1>
            <p className="text-xs sm:text-sm text-ink-muted mt-1.5 leading-relaxed">
              Partagez une épreuve d&apos;examen ou de devoir avec vos camarades. Si votre sujet est découpé en plusieurs photos,
              <strong> elles seront automatiquement fusionnées en un PDF unique</strong>. Vous pouvez également y joindre le corrigé.
            </p>
          </div>

          {/* Erreur globale si rejet serveur */}
          {globalError && (
            <div className="mb-6 p-4 rounded-2xl bg-danger-50 dark:bg-danger/10 border border-danger/30 text-danger text-xs sm:text-sm font-semibold flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-danger shrink-0" />
              <div className="flex-1">{globalError}</div>
            </div>
          )}

          {/* Progression lors de la soumission */}
          {isSubmitting && (
            <div className="mb-8 p-5 bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800/40 rounded-2xl shadow-xs animate-in fade-in">
              <div className="flex items-center justify-between text-xs font-bold text-brand-900 dark:text-brand-100 mb-2">
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-brand-700 dark:text-accent-400" />
                  <span>{submittingStep || 'Traitement et publication en cours...'}</span>
                </span>
                <span>{uploadProgress || 30}%</span>
              </div>
              <div className="w-full h-2 bg-surface-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-700 transition-all duration-300 rounded-full"
                  style={{ width: `${uploadProgress || 30}%` }}
                />
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* 1. Matière & ECU ciblé — Référentiel Officiel MBH1 */}
            <div>
              <MatiereEcuSelector
                selectedUeCode={ueCode}
                selectedEcuNom={ecuNom}
                onUeChange={(code, nom) => {
                  setUeCode(code);
                  setMatiereNom(nom);
                  if (errors.matiere) setErrors({ ...errors, matiere: '' });
                }}
                onEcuChange={(ecu) => setEcuNom(ecu)}
                error={errors.matiere}
              />
            </div>

            {/* 2. Niveau & Année académique */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Niveau */}
              <div>
                <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-2">
                  Niveau d&apos;études <span className="text-danger">*</span>
                </label>
                <select
                  value={niveau}
                  onChange={(e) => {
                    setNiveau(e.target.value);
                    if (errors.niveau) setErrors({ ...errors, niveau: '' });
                  }}
                  className={`w-full px-4 py-3 bg-surface border rounded-xl text-sm font-medium text-ink focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-brand-700 shadow-xs transition-colors ${errors.niveau ? 'border-danger bg-danger-50/20' : 'border-surface-border'
                    }`}
                >
                  <option value="" className="bg-surface text-ink">Sélectionnez le niveau...</option>
                  {VALID_NIVEAUX_PREDEFINIS.map((niv) => (
                    <option key={niv} value={niv} className="bg-surface text-ink">
                      {niv}
                    </option>
                  ))}
                  <option value="Autre" className="bg-surface text-ink">Autre niveau...</option>
                </select>

                {niveau === 'Autre' && (
                  <input
                    type="text"
                    value={customNiveau}
                    onChange={(e) => setCustomNiveau(e.target.value)}
                    placeholder="Précisez votre niveau (ex: Master Spécialisé...)"
                    className="mt-2 w-full px-3.5 py-2.5 bg-surface border border-surface-border text-ink placeholder-ink-muted rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-accent-400"
                  />
                )}

                {errors.niveau && (
                  <p className="mt-1.5 text-xs text-danger font-semibold">{errors.niveau}</p>
                )}
              </div>

              {/* Année Académique */}
              <div>
                <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-2">
                  Année Académique <span className="text-danger">*</span>
                </label>
                <select
                  value={anneeAcademique}
                  onChange={(e) => {
                    setAnneeAcademique(e.target.value);
                    if (errors.annee) setErrors({ ...errors, annee: '' });
                  }}
                  className={`w-full px-4 py-3 bg-surface border rounded-xl text-sm font-medium text-ink focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-brand-700 shadow-xs transition-colors ${errors.annee ? 'border-danger bg-danger-50/20' : 'border-surface-border'
                    }`}
                >
                  <option value="" className="bg-surface text-ink">Sélectionnez l&apos;année...</option>
                  {academicYears.map((yr) => (
                    <option key={yr} value={yr} className="bg-surface text-ink">
                      {yr}
                    </option>
                  ))}
                  <option value="Plus ancien" className="bg-surface text-ink">Année plus ancienne (saisie libre)</option>
                </select>

                {anneeAcademique === 'Plus ancien' && (
                  <input
                    type="text"
                    value={customAnnee}
                    onChange={(e) => setCustomAnnee(e.target.value)}
                    placeholder="Ex: 2018-2019"
                    className="mt-2 w-full px-3.5 py-2.5 bg-surface border border-surface-border text-ink placeholder-ink-muted rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-accent-400"
                  />
                )}

                {errors.annee && (
                  <p className="mt-1.5 text-xs text-danger font-semibold">{errors.annee}</p>
                )}
              </div>
            </div>

            {/* 3. Type d'épreuve */}
            <div>
              <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-2">
                Type d&apos;épreuve <span className="text-danger">*</span>
              </label>

              <div className="grid grid-cols-2 gap-3">
                {VALID_TYPES.map((t) => {
                  const isSelected = type === t;
                  let selectedTheme = 'bg-brand-700 text-white border-brand-700 shadow-md shadow-brand/20';
                  if (t === 'devoir') selectedTheme = 'bg-examType-devoir text-white border-examType-devoir shadow-md';
                  if ((t as string) === 'examen') selectedTheme = 'bg-examType-examen text-white border-examType-examen shadow-md';
                  if (t === 'rattrapage') selectedTheme = 'bg-examType-rattrapage text-white border-examType-rattrapage shadow-md';

                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        setType(t);
                        if (errors.type) setErrors({ ...errors, type: '' });
                      }}
                      className={`py-3 px-3 rounded-2xl text-xs sm:text-sm font-bold capitalize border transition-all duration-150 flex items-center justify-center gap-2 ${isSelected
                          ? selectedTheme
                          : 'bg-surface text-ink-muted border-surface-border hover:bg-surface-2 hover:text-ink'
                        }`}
                    >
                      {isSelected && <Check className="w-4 h-4" />}
                      <span>{t}</span>
                    </button>
                  );
                })}
              </div>

              {errors.type && (
                <p className="mt-1.5 text-xs text-danger font-semibold">{errors.type}</p>
              )}
            </div>

            {/* 4. Titre ou précision (optionnel) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="depot-titre"
                  className="text-xs font-bold text-ink uppercase tracking-wider"
                >
                  Titre ou précisions <span className="text-ink-muted lowercase font-normal">(optionnel)</span>
                </label>
                <span className="text-[11px] font-medium text-ink-muted">
                  {titre.length}/150
                </span>
              </div>

              <input
                id="depot-titre"
                type="text"
                value={titre}
                onChange={(e) => setTitre(e.target.value)}
                maxLength={150}
                placeholder="Ex : Devoir de synthèse n°1, Session normale..."
                className="w-full px-4 py-3 bg-surface border border-surface-border rounded-xl text-sm font-medium text-ink placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-brand-700 shadow-xs"
              />
            </div>

            {/* 5. Pages du Sujet (Multi-pages avec fusion automatique) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-ink uppercase tracking-wider">
                  Fichier(s) de l&apos;épreuve <span className="text-danger">*</span>
                </label>
                {epreuvePages.length > 1 && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-800 dark:text-brand-200 bg-brand-50 dark:bg-brand-900/40 px-2.5 py-0.5 rounded-full border border-brand-200 dark:border-brand-800/60">
                    <Files className="w-3 h-3" />
                    <span>{epreuvePages.length} pages réunies en 1 PDF</span>
                  </span>
                )}
              </div>

              <input
                ref={epreuveInputRef}
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.heic,.webp"
                className="hidden"
                onChange={(e) => {
                  handleAddEpreuveFiles(e.target.files);
                  e.target.value = '';
                }}
              />

              {/* Zone de drop/sélection */}
              {epreuvePages.length === 0 ? (
                <div
                  onClick={() => epreuveInputRef.current?.click()}
                  className="border-2 border-dashed border-surface-border hover:border-brand-500 rounded-3xl p-8 sm:p-10 text-center transition-all cursor-pointer bg-surface hover:bg-surface-2 group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400 flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition-transform border border-brand-200 dark:border-brand-800/40">
                    <Upload className="w-7 h-7" />
                  </div>
                  <h4 className="text-sm font-bold text-ink mb-1">
                    Sélectionner l&apos;épreuve (document PDF ou photos multi-pages)
                  </h4>
                  <p className="text-xs text-ink-muted mb-3 max-w-md mx-auto">
                    Si votre sujet comporte plusieurs pages ou photos (recto/verso), sélectionnez-les toutes ensemble. Elles seront assemblées proprement.
                  </p>
                  <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-surface-2 group-hover:bg-surface border border-surface-border text-ink text-xs font-bold transition-colors">
                    <Plus className="w-3.5 h-3.5 text-ink-muted" />
                    <span>Choisir les photos / PDF</span>
                  </span>
                </div>
              ) : (
                <div className="space-y-3 bg-surface-2 p-4 rounded-3xl border border-surface-border">
                  <div className="flex items-center justify-between text-xs text-ink-muted font-bold px-1">
                    <span>Pages du sujet ({epreuvePages.length}) • {formatFileSize(totalEpreuveSize)}</span>
                    <button
                      type="button"
                      onClick={() => epreuveInputRef.current?.click()}
                      className="text-brand-700 dark:text-accent-400 hover:underline inline-flex items-center gap-1 font-bold"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Ajouter d&apos;autres pages</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {epreuvePages.map((page, idx) => {
                      const isPdf = page.type === 'application/pdf' || page.name.endsWith('.pdf');
                      return (
                        <div
                          key={`${page.name}_${idx}`}
                          className="flex items-center justify-between gap-3 p-3 bg-surface rounded-2xl border border-surface-border shadow-xs"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="w-6 h-6 rounded-lg bg-brand-50 dark:bg-brand-900/60 text-brand-800 dark:text-brand-200 font-black text-xs flex items-center justify-center shrink-0 border border-brand-200 dark:border-brand-800">
                              {idx + 1}
                            </span>
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isPdf ? 'bg-danger-50 dark:bg-danger/20 text-danger' : 'bg-brand-50 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300'
                              }`}>
                              {isPdf ? <FileText className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-ink truncate max-w-xs sm:max-w-md">
                                {page.name}
                              </p>
                              <span className="text-[11px] text-ink-muted">
                                {formatFileSize(page.size)}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => moveEpreuvePage(idx, idx - 1)}
                              className="p-1 text-ink-muted hover:text-ink disabled:opacity-30 rounded-lg hover:bg-surface-2"
                              title="Monter"
                            >
                              <ArrowUp className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              disabled={idx === epreuvePages.length - 1}
                              onClick={() => moveEpreuvePage(idx, idx + 1)}
                              className="p-1 text-ink-muted hover:text-ink disabled:opacity-30 rounded-lg hover:bg-surface-2"
                              title="Descendre"
                            >
                              <ArrowDown className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeEpreuvePage(idx)}
                              className="p-1 text-ink-muted hover:text-danger rounded-lg hover:bg-danger-50 dark:hover:bg-danger/10 ml-1"
                              title="Supprimer cette page"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {epreuvePages.length > 1 && (
                    <p className="text-[11px] text-ink-muted font-medium px-1 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-brand-600 dark:text-accent-400 shrink-0" />
                      <span>Ces {epreuvePages.length} pages seront assemblées dans cet ordre précis lors de la validation.</span>
                    </p>
                  )}
                </div>
              )}

              {errors.file && (
                <p className="mt-1.5 text-xs text-danger font-semibold">{errors.file}</p>
              )}
            </div>

            {/* 6. Section Corrigé / Barème (« Si oui disponible ») */}
            <div className="bg-surface-2 p-5 rounded-3xl border border-surface-border">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-brand-700 dark:text-accent-400" />
                  <label className="text-xs font-bold text-ink uppercase tracking-wider">
                    Corrigé / Barème de l&apos;épreuve
                  </label>
                </div>
                <span className="text-[10px] font-bold text-brand-800 dark:text-brand-200 bg-brand-50 dark:bg-brand-900/60 px-2 py-0.5 rounded-full border border-brand-200 dark:border-brand-800/40">
                  Recommandé si disponible
                </span>
              </div>

              <p className="text-xs text-ink-muted mb-4">
                Avez-vous le corrigé officiel ou la proposition de solution de cette épreuve ?
              </p>

              {/* Choix binaire stylisé */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <button
                  type="button"
                  onClick={() => {
                    setHasCorrige(false);
                    setCorrigePages([]);
                    if (errors.corrige) setErrors({ ...errors, corrige: '' });
                  }}
                  className={`py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold border transition-all text-left flex items-center justify-between ${!hasCorrige
                      ? 'bg-surface text-ink border-brand-700 ring-2 ring-brand-700/20 shadow-xs'
                      : 'bg-surface-2 text-ink-muted border-surface-border hover:bg-surface'
                    }`}
                >
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-ink-muted" />
                    <span>Non</span>
                  </div>
                  {!hasCorrige && <Check className="w-4 h-4 text-brand-700 dark:text-accent-400" />}
                </button>

                <button
                  type="button"
                  onClick={() => setHasCorrige(true)}
                  className={`py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold border transition-all text-left flex items-center justify-between ${hasCorrige
                      ? 'bg-brand-700 text-white border-brand-700 shadow-md shadow-brand/20'
                      : 'bg-surface-2 text-ink-muted border-surface-border hover:bg-surface'
                    }`}
                >
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className={`w-4 h-4 ${hasCorrige ? 'text-white' : 'text-brand-700 dark:text-brand-400'}`} />
                    <span>Oui, j&apos;ai le corrigé !</span>
                  </div>
                  {hasCorrige && <Check className="w-4 h-4 text-white" />}
                </button>
              </div>

              {/* Zone d'ajout du corrigé si "Oui" */}
              {hasCorrige && (
                <div className="space-y-3 pt-2">
                  <input
                    ref={corrigeInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.heic,.webp"
                    className="hidden"
                    onChange={(e) => {
                      handleAddCorrigeFiles(e.target.files);
                      e.target.value = '';
                    }}
                  />

                  {corrigePages.length === 0 ? (
                    <div
                      onClick={() => corrigeInputRef.current?.click()}
                      className="border-2 border-dashed border-brand-300 dark:border-brand-700/60 hover:border-brand-500 rounded-2xl p-6 text-center transition-all cursor-pointer bg-brand-50/50 dark:bg-brand-900/10 hover:bg-brand-50 dark:hover:bg-brand-900/30"
                    >
                      <BookOpen className="w-8 h-8 text-brand-600 dark:text-brand-400 mx-auto mb-2" />
                      <p className="text-xs font-bold text-ink mb-1">
                        Sélectionner le document ou les photos du corrigé
                      </p>
                      <p className="text-[11px] text-ink-muted">
                        PDF, JPG ou PNG acceptés (jusqu&apos;à 15 Mo).
                      </p>
                    </div>
                  ) : (
                    <div className="bg-surface p-3.5 rounded-2xl border border-surface-border shadow-xs space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-ink">
                        <span>Fichiers du corrigé ({corrigePages.length}) • {formatFileSize(totalCorrigeSize)}</span>
                        <button
                          type="button"
                          onClick={() => corrigeInputRef.current?.click()}
                          className="text-brand-700 dark:text-accent-400 hover:underline flex items-center gap-1 font-bold"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Ajouter des pages</span>
                        </button>
                      </div>

                      {corrigePages.map((cPage, cIdx) => (
                        <div
                          key={`${cPage.name}_${cIdx}`}
                          className="flex items-center justify-between gap-3 p-2 bg-surface-2 rounded-xl border border-surface-border"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-5 h-5 rounded-md bg-brand-100 dark:bg-brand-900 text-brand-800 dark:text-brand-200 font-bold text-[10px] flex items-center justify-center">
                              {cIdx + 1}
                            </span>
                            <span className="text-xs font-medium text-ink truncate max-w-xs">
                              {cPage.name}
                            </span>
                            <span className="text-[10px] text-ink-muted">
                              ({formatFileSize(cPage.size)})
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeCorrigePage(cIdx)}
                            className="p-1 text-ink-muted hover:text-danger rounded-md"
                            title="Retirer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {errors.corrige && (
                    <p className="mt-1.5 text-xs text-danger font-semibold">{errors.corrige}</p>
                  )}
                </div>
              )}
            </div>

            {/* 7. Bouton de soumission */}
            <div className="pt-4 border-t border-surface-border">
              <button
                type="submit"
                disabled={!isFormValid || isSubmitting}
                className="w-full flex items-center justify-center gap-2.5 px-6 py-4 bg-brand-700 hover:bg-brand-800 text-white font-bold text-sm rounded-2xl transition-all shadow-md shadow-brand/20 disabled:opacity-50 disabled:cursor-not-allowed active:scale-99"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>{submittingStep || 'Publication en cours...'}</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5 text-accent-400" />
                    <span>
                      Publier l&apos;épreuve sur AscendUAC {hasCorrige && corrigePages.length > 0 ? '(avec Corrigé)' : ''}
                    </span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
