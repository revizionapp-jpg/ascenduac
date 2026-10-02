'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { BottomNavCTA } from '@/components/BottomNavCTA';
import { Epreuve } from '@/types';
import { formatRelativeDate, formatFileSize } from '@/lib/utils/date';
import {
  Download,
  ExternalLink,
  ArrowLeft,
  FileText,
  Image as ImageIcon,
  Calendar,
  Award,
  User,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Share2,
  Check,
  ShieldCheck,
  BookOpen,
  Upload,
  X,
  LockKeyhole,
} from 'lucide-react';
import { useSession } from 'next-auth/react';

function EpreuveDetailContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const isNewlyCreated = searchParams.get('created') === 'true';
  const { data: session } = useSession();

  const [epreuve, setEpreuve] = useState<Epreuve | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [viewerMode, setViewerMode] = useState<'pdf'>('pdf'); // kept for compatibility but unused

  // Tabs Sujet / Corrigé
  const [activeTab, setActiveTab] = useState<'sujet' | 'corrige'>('sujet');

  // Modal dépôt corrigé
  const [showCorrigeModal, setShowCorrigeModal] = useState(false);
  const [corrigeFile, setCorrigeFile] = useState<File | null>(null);
  const [isUploadingCorrige, setIsUploadingCorrige] = useState(false);
  const [corrigeError, setCorrigeError] = useState<string | null>(null);
  const corrigeInputRef = useRef<HTMLInputElement>(null);

  const fetchEpreuve = () => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/epreuves/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('Épreuve introuvable.');
        return res.json();
      })
      .then((data) => setEpreuve(data.epreuve))
      .catch((err) => setError(err.message || 'Impossible de charger l\'épreuve.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchEpreuve(); }, [id]);

  const handleDownload = () => {
    setIsDownloading(true);
    window.location.href = `/api/epreuves/${id}/telecharger`;
    setTimeout(() => setIsDownloading(false), 2500);
  };

  const handleCopyLink = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const shareData = {
      title: epreuve ? `${epreuve.matiere_nom} — ${epreuve.type} (${epreuve.annee_academique})` : 'AscendUAC',
      text: epreuve ? `📚 Consulte cette épreuve de ${epreuve.matiere_nom} sur AscendUAC !` : '',
      url,
    };

    // Web Share API — ouvre le sélecteur natif du téléphone (WhatsApp, Telegram, SMS, etc.)
    if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData);
        return; // l'utilisateur a partagé (ou annulé) — pas besoin du fallback
      } catch (err) {
        // L'utilisateur a annulé, ou erreur — on tombe sur le fallback clipboard
      }
    }

    // Fallback : copier le lien dans le presse-papier
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(url);
    }
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleCorrigeUpload = async () => {
    if (!corrigeFile) return;
    setIsUploadingCorrige(true);
    setCorrigeError(null);
    try {
      const fd = new FormData();
      fd.append('file', corrigeFile);
      const res = await fetch(`/api/epreuves/${id}/corrige`, { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors du téléversement.');
      setShowCorrigeModal(false);
      setCorrigeFile(null);
      fetchEpreuve(); // Recharge l'épreuve pour afficher le nouveau corrigé
    } catch (err: any) {
      setCorrigeError(err.message);
    } finally {
      setIsUploadingCorrige(false);
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'devoir': return 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/60';
      case 'rattrapage': return 'bg-accent-100 dark:bg-accent-400/15 text-accent-700 dark:text-accent-400 border-accent-400/40 dark:border-accent-400/30';
      default: return 'bg-surface-2 text-ink-muted border-surface-border';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-surface-bg">
        <Navbar />
        <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-16 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-brand-700 dark:text-brand-400">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="text-sm font-bold text-ink">Chargement de l&apos;archive...</span>
          </div>
        </main>
      </div>
    );
  }

  if (error || !epreuve) {
    return (
      <div className="min-h-screen flex flex-col bg-surface-bg">
        <Navbar />
        <main className="flex-1 max-w-lg w-full mx-auto px-4 py-16 text-center">
          <div className="bg-surface-card border border-surface-border rounded-3xl p-8 shadow-subtle dark:shadow-none">
            <div className="w-14 h-14 rounded-2xl bg-danger-50 dark:bg-danger/10 text-danger flex items-center justify-center mx-auto mb-4 border border-danger/20">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-bold text-ink">Épreuve introuvable</h2>
            <p className="mt-1.5 text-xs text-ink-muted leading-relaxed">
              Cette archive a peut-être été déplacée ou supprimée.
            </p>
            <Link
              href="/epreuves"
              className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-brand-700 hover:bg-brand-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Retour au catalogue</span>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const isImage = epreuve.type_fichier !== 'pdf' || epreuve.cloudinary_url.includes('images.unsplash.com') || /\.(jpg|jpeg|png|webp|avif)$/i.test(epreuve.cloudinary_url);
  const sujetViewUrl = `/api/epreuves/${epreuve.id}/fichier`;
  const corrigeViewUrl = `/api/epreuves/${epreuve.id}/corrige/fichier`;

  const currentViewUrl = activeTab === 'corrige' ? corrigeViewUrl : sujetViewUrl;
  const isCorrigeImage = epreuve.corrige_type_fichier && epreuve.corrige_type_fichier !== 'pdf';
  const showCorrigeView = activeTab === 'corrige' && epreuve.has_corrige;

  const downloadLabel = epreuve.has_corrige && epreuve.type_fichier === 'pdf'
    ? `Télécharger Sujet + Corrigé (PDF fusionné)`
    : `Télécharger l'épreuve (${formatFileSize(epreuve.taille_octets)})`;

  return (
    <div className="min-h-screen flex flex-col bg-surface-bg selection:bg-brand-700 selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 pb-28 md:pb-16">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <Link
            href="/epreuves"
            className="inline-flex items-center gap-2 text-xs font-bold text-ink-muted hover:text-ink transition-colors bg-surface px-3.5 py-2 rounded-xl border border-surface-border shadow-subtle dark:shadow-none"
          >
            <ArrowLeft className="w-4 h-4 text-ink-muted" />
            <span>Toutes les épreuves</span>
          </Link>

          <button
            type="button"
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-ink-muted hover:text-ink bg-surface px-3.5 py-2 rounded-xl border border-surface-border shadow-subtle dark:shadow-none transition-colors"
          >
            {isCopied ? (
              <>
                <Check className="w-3.5 h-3.5 text-brand-700 dark:text-brand-400" />
                <span className="text-brand-700 dark:text-brand-300">Lien copié !</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-ink-muted" />
                <span>Partager ce sujet</span>
              </>
            )}
          </button>
        </div>

        {/* Bannière de félicitations post-dépôt */}
        {isNewlyCreated && (
          <div className="mb-6 p-4.5 bg-brand-50 dark:bg-brand-700/12 border border-brand-200/80 dark:border-brand-700/30 rounded-2xl flex items-center gap-3.5 text-sm text-ink font-bold shadow-subtle dark:shadow-none animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="w-8 h-8 rounded-xl bg-brand-700 text-white flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-ink">Épreuve mise en ligne avec succès !</p>
              <p className="text-xs font-medium text-ink-muted mt-0.5">
                Merci pour votre contribution à la réussite collective des étudiants de MBH.
              </p>
            </div>
          </div>
        )}

        {/* Fiche détaillée principale */}
        <div className="bg-surface-card border border-surface-border rounded-3xl p-6 sm:p-8 shadow-subtle dark:shadow-none space-y-6">
          {/* Header : Titre & Badges */}
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border capitalize ${getTypeBadge(epreuve.type)}`}>
                {epreuve.type}
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-ink-muted bg-surface-2 px-3 py-1 rounded-full border border-surface-border">
                <Award className="w-3.5 h-3.5 text-ink-muted" />
                <span>{epreuve.niveau}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-ink-muted bg-surface-2 px-3 py-1 rounded-full border border-surface-border">
                <Calendar className="w-3.5 h-3.5 text-ink-muted" />
                <span>{epreuve.annee_academique}</span>
              </span>
              {/* Badge UE */}
              {epreuve.ue_code && (
                <span className="inline-flex items-center text-xs font-bold text-brand-800 dark:text-brand-200 bg-brand-50 dark:bg-brand-900/40 px-3 py-1 rounded-full border border-brand-200 dark:border-brand-800">
                  {epreuve.ue_code}
                </span>
              )}

              {/* Badge ECU */}
              {epreuve.ecu_nom && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-ink-muted bg-surface-2 px-3 py-1 rounded-full border border-surface-border">
                  <span>ECU :</span>
                  <strong className="text-brand-700 dark:text-brand-300 font-bold">{epreuve.ecu_nom}</strong>
                </span>
              )}

              {epreuve.has_corrige && (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-900/40 px-3 py-1 rounded-full border border-brand-200 dark:border-brand-800">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Corrigé disponible</span>
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-ink tracking-tight">
              {epreuve.matiere_nom}
            </h1>
            {epreuve.titre && (
              <p className="mt-2 text-sm text-ink-muted font-medium">{epreuve.titre}</p>
            )}
          </div>

          {/* Bandeau de métadonnées */}
          <div className="flex flex-wrap items-center justify-between gap-3 py-3.5 border-y border-surface-border text-xs text-ink-muted bg-surface-2/60 px-4 rounded-xl">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-brand-700 dark:text-brand-400" />
              <span>Uploadé par <strong className="text-ink font-bold">{epreuve.uploader_nom}</strong></span>
            </div>
            <div className="flex items-center gap-3">
              <span>{formatRelativeDate(epreuve.created_at)}</span>
              <span>•</span>
              <span className="font-bold text-ink uppercase tracking-wider">
                {epreuve.type_fichier} ({formatFileSize(epreuve.taille_octets)})
              </span>
            </div>
          </div>

          {/* ── ONGLETS SUJET / CORRIGÉ ── */}
          <div className="flex gap-2 bg-surface-2 p-1.5 rounded-2xl border border-surface-border">
            <button
              type="button"
              onClick={() => setActiveTab('sujet')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all duration-200 ${activeTab === 'sujet'
                ? 'bg-surface text-brand-700 dark:text-accent-400 shadow-sm dark:shadow-none'
                : 'text-ink-muted hover:text-ink hover:bg-surface/50'
                }`}
            >
              <FileText className="w-4 h-4" />
              Sujet de l&apos;épreuve
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('corrige')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all duration-200 ${activeTab === 'corrige'
                ? 'bg-surface text-brand-700 dark:text-accent-400 shadow-sm dark:shadow-none'
                : 'text-ink-muted hover:text-ink hover:bg-surface/50'
                }`}
            >
              <BookOpen className="w-4 h-4" />
              Corrigé &amp; Barème
              {epreuve.has_corrige && (
                <span className="w-2 h-2 bg-brand-500 rounded-full" />
              )}
            </button>
          </div>

          {/* ── ZONE VIEWER ── */}
          <div className="rounded-2xl border border-surface-border bg-surface-2 overflow-hidden">

            {/* ── Onglet Sujet ── */}
            {activeTab === 'sujet' && (
              isImage ? (
                <div className="relative flex flex-col items-center justify-center p-4 sm:p-6 bg-surface-2">
                  <img
                    src={sujetViewUrl}
                    alt={epreuve.matiere_nom}
                    className="max-h-[600px] w-auto object-contain rounded-xl shadow-md"
                    loading="lazy"
                  />
                </div>
              ) : (
                <div className="flex flex-col rounded-2xl overflow-hidden">
                  {/* Barre du viewer */}
                  <div className="bg-surface-2 border-b border-surface-border px-4 py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-danger-50 dark:bg-danger/20 text-danger font-bold text-[10px]">PDF</span>
                      <span className="font-semibold text-ink truncate max-w-[180px] sm:max-w-xs">
                        {epreuve.matiere_nom} — {epreuve.type} ({epreuve.annee_academique})
                      </span>
                    </div>
                    <a
                      href={sujetViewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-surface-border hover:bg-surface-2 text-ink text-xs font-semibold transition-colors"
                    >
                      <span>Plein écran</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                  <div className="relative w-full h-[600px] sm:h-[750px] bg-surface-2">
                    <iframe
                      src={`${sujetViewUrl}#toolbar=0&view=FitH`}
                      title={`Aperçu de l'épreuve ${epreuve.matiere_nom}`}
                      className="w-full h-full border-0"
                      loading="lazy"
                    />
                  </div>
                </div>
              )
            )}

            {/* ── Onglet Corrigé : Disponible ── */}
            {activeTab === 'corrige' && epreuve.has_corrige && (
              isCorrigeImage ? (
                <div className="relative flex flex-col items-center justify-center p-4 sm:p-6 bg-surface-2">
                  <img
                    src={corrigeViewUrl}
                    alt={`Corrigé ${epreuve.matiere_nom}`}
                    className="max-h-[600px] w-auto object-contain rounded-xl shadow-md"
                    loading="lazy"
                  />
                </div>
              ) : (
                <div className="flex flex-col rounded-2xl overflow-hidden">
                  <div className="bg-surface-2 border-b border-surface-border px-4 py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-brand-50 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 font-bold text-[10px]">COR</span>
                      <span className="font-semibold text-ink truncate">Corrigé — {epreuve.matiere_nom}</span>
                    </div>
                    <a
                      href={corrigeViewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-surface-border hover:bg-surface-2 text-ink text-xs font-semibold transition-colors"
                    >
                      <span>Plein écran</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                  <div className="relative w-full h-[600px] sm:h-[750px] bg-surface-2">
                    <iframe
                      src={`${corrigeViewUrl}#toolbar=0&view=FitH`}
                      title={`Corrigé ${epreuve.matiere_nom}`}
                      className="w-full h-full border-0"
                      loading="lazy"
                    />
                  </div>
                </div>
              )
            )}

            {/* ── Onglet Corrigé : Pas encore disponible ── */}
            {activeTab === 'corrige' && !epreuve.has_corrige && (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-5">
                <div className="w-16 h-16 rounded-2xl bg-surface-2 border border-surface-border text-ink-muted flex items-center justify-center">
                  <LockKeyhole className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-base font-bold text-ink">Corrigé non encore disponible</p>
                  <p className="mt-1 text-xs text-ink-muted max-w-xs mx-auto">
                    Aidez vos camarades en déposant le corrigé ou barème officiel de cette épreuve.
                  </p>
                </div>
                {session?.user ? (
                  <button
                    type="button"
                    onClick={() => setShowCorrigeModal(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-700 hover:bg-brand-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                  >
                    <Upload className="w-4 h-4" />
                    Ajouter un corrigé
                  </button>
                ) : (
                  <Link href="/connexion" className="inline-flex items-center gap-2 px-5 py-2.5 bg-surface border border-surface-border hover:bg-surface-2 text-ink rounded-xl text-xs font-bold transition-all">
                    Connectez-vous pour contribuer
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* BOUTONS D'ACTION PRINCIPAUX */}
          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={handleDownload}
              disabled={isDownloading}
              className="w-full flex items-center justify-center gap-2.5 px-6 py-4 bg-brand-700 hover:bg-brand-800 text-white font-bold text-sm rounded-2xl transition-all shadow-md shadow-brand/20 disabled:opacity-75 active:scale-99"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Démarrage du téléchargement sécurisé...</span>
                </>
              ) : (
                <>
                  <Download className="w-5 h-5 text-accent-400" />
                  <span>{downloadLabel}</span>
                </>
              )}
            </button>

            {/* Bouton ajout corrigé si connecté et pas de corrigé */}
            {!epreuve.has_corrige && session?.user && (
              <button
                type="button"
                onClick={() => { setActiveTab('corrige'); setShowCorrigeModal(true); }}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 border-2 border-dashed border-brand-300 dark:border-brand-700/60 hover:border-brand-500 text-brand-700 dark:text-brand-300 hover:text-brand-800 dark:hover:text-brand-200 rounded-2xl text-xs font-bold transition-all hover:bg-brand-50 dark:hover:bg-brand-900/20"
              >
                <BookOpen className="w-4 h-4" />
                <span>Ajouter le corrigé de cette épreuve</span>
              </button>
            )}

            <div className="flex items-center justify-center gap-4 text-center pt-1">
              <a href={sujetViewUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-muted hover:text-brand-700 dark:hover:text-accent-400 transition-colors">
                <span>Voir l&apos;épreuve</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <span className="text-surface-border">•</span>
              <div className="inline-flex items-center gap-1 text-xs text-brand-700 dark:text-brand-300 font-medium">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Accès direct &amp; gratuit</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <BottomNavCTA />

      {/* ── MODALE DÉPÔT CORRIGÉ ── */}
      {showCorrigeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-surface-border rounded-3xl shadow-2xl w-full max-w-md p-6 sm:p-8 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-ink">Déposer un corrigé</h2>
                <p className="text-xs text-ink-muted mt-0.5">{epreuve.matiere_nom} — {epreuve.type} {epreuve.annee_academique}</p>
              </div>
              <button type="button" onClick={() => { setShowCorrigeModal(false); setCorrigeFile(null); setCorrigeError(null); }} className="p-2 text-ink-muted hover:text-ink rounded-xl hover:bg-surface-2 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div
              onClick={() => corrigeInputRef.current?.click()}
              className="border-2 border-dashed border-brand-300 dark:border-brand-700/60 hover:border-brand-500 rounded-2xl p-8 text-center cursor-pointer transition-all hover:bg-brand-50 dark:hover:bg-brand-900/20"
            >
              {corrigeFile ? (
                <div className="flex items-center justify-center gap-2 text-brand-700 dark:text-brand-300 font-bold text-sm">
                  <FileText className="w-5 h-5" />
                  <span className="truncate max-w-[200px]">{corrigeFile.name}</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-ink-muted">
                  <Upload className="w-8 h-8 text-brand-600 dark:text-brand-400" />
                  <p className="text-sm font-bold text-ink">Cliquez pour sélectionner</p>
                  <p className="text-xs text-ink-muted">PDF, JPG, PNG — max 15 Mo</p>
                </div>
              )}
              <input
                ref={corrigeInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.heic"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) { setCorrigeFile(f); setCorrigeError(null); }
                }}
              />
            </div>

            {corrigeError && (
              <div className="flex items-center gap-2 p-3 bg-danger-50 dark:bg-danger/10 border border-danger/30 rounded-xl text-xs text-danger font-semibold">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{corrigeError}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleCorrigeUpload}
              disabled={!corrigeFile || isUploadingCorrige}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-brand-700 hover:bg-brand-800 text-white font-bold rounded-2xl transition-all shadow-sm disabled:opacity-50"
            >
              {isUploadingCorrige ? (
                <><Loader2 className="w-5 h-5 animate-spin" /><span>Téléversement en cours...</span></>
              ) : (
                <><Upload className="w-5 h-5" /><span>Publier le corrigé</span></>
              )}
            </button>

            <p className="text-center text-[11px] text-ink-muted">
              En déposant ce corrigé, vous contribuez à la réussite collective des étudiants MBH. Merci ! 🙏
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function EpreuveDetailPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-sm font-semibold text-ink-secondary">Chargement de l&apos;épreuve...</div>}>
      <EpreuveDetailContent />
    </Suspense>
  );
}
