'use client';

import React, { useState, useEffect } from 'react';
import { BookOpen, Layers, Check, ChevronDown, Filter, Info } from 'lucide-react';
import { ALL_CURRICULUM_UES, SemesterId, getUeByCode, getUeTypeLabel, getUeSelectOptions } from '@/lib/constants/curriculum';

interface MatiereEcuSelectorProps {
  selectedUeCode: string;
  selectedEcuNom: string;
  onUeChange: (ueCode: string, ueNom: string) => void;
  onEcuChange: (ecuNom: string) => void;
  error?: string;
}

export function MatiereEcuSelector({
  selectedUeCode,
  selectedEcuNom,
  onUeChange,
  onEcuChange,
  error,
}: MatiereEcuSelectorProps) {
  // Détecter automatiquement le semestre depuis le code sélectionné
  const [semesterFilter, setSemesterFilter] = useState<'all' | SemesterId>('all');

  useEffect(() => {
    if (selectedUeCode) {
      if (selectedUeCode.toUpperCase().startsWith('MBH11')) {
        setSemesterFilter('1');
      } else if (selectedUeCode.toUpperCase().startsWith('MBH12')) {
        setSemesterFilter('2');
      } else if (selectedUeCode.toUpperCase().startsWith('MBH13')) {
        setSemesterFilter('3');
      }
    }
  }, [selectedUeCode]);

  // Options strictes alimentées uniquement par le référentiel (jamais de saisie libre)
  const options = getUeSelectOptions(semesterFilter === 'all' ? null : semesterFilter);

  const currentUe = selectedUeCode ? getUeByCode(selectedUeCode) : undefined;
  // Liste exacte des ECUs de cette UE — ue.ecu.length, jamais credits
  const ecus = currentUe ? currentUe.ecu : [];

  const handleUeSelect = (code: string) => {
    const ue = getUeByCode(code);
    if (ue) {
      onUeChange(ue.code, ue.nom);
      onEcuChange(''); // Réinitialiser l'ECU ciblé lors du changement d'UE
    } else {
      onUeChange('', '');
      onEcuChange('');
    }
  };

  const semesterLabel =
    semesterFilter === '1'
      ? 'S1 MBH1 (MBH1101 → MBH1108) — 8 matières'
      : semesterFilter === '2'
      ? 'S2 MBH1 (MBH1209 → MBH1216) — 8 matières'
      : semesterFilter === '3'
      ? 'S3 MBH2 (MBH1317 → MBH1324) — 8 matières'
      : `Toutes les filières (${ALL_CURRICULUM_UES.length} matières)`;

  return (
    <div className="space-y-4">
      {/* ── 1. Filtre rapide par Semestre (MBH11xx / MBH12xx) ── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-brand-700 dark:text-brand-400" />
            <span>Filtrer par Semestre</span>
          </label>
          <span className="text-[11px] text-ink-muted">{semesterLabel}</span>
        </div>

        <div className="inline-flex p-1 bg-surface-2 rounded-xl border border-surface-border w-full sm:w-auto gap-1">
          <button
            type="button"
            onClick={() => setSemesterFilter('all')}
            className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              semesterFilter === 'all'
                ? 'bg-brand-700 text-white shadow-xs'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            Tous
          </button>
          <button
            type="button"
            onClick={() => setSemesterFilter('1')}
            className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              semesterFilter === '1'
                ? 'bg-brand-700 text-white shadow-xs'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            S1 MBH1
          </button>
          <button
            type="button"
            onClick={() => setSemesterFilter('2')}
            className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              semesterFilter === '2'
                ? 'bg-brand-700 text-white shadow-xs'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            S2 MBH1
          </button>
          <button
            type="button"
            onClick={() => setSemesterFilter('3')}
            className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              semesterFilter === '3'
                ? 'bg-brand-700 text-white shadow-xs'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            S3 MBH2
          </button>
        </div>
      </div>

      {/* ── 2. Sélecteur strict de Matière (UE) — Pas de saisie libre ── */}
      <div>
        <label
          htmlFor="matiere-ue-select"
          className="block text-xs font-bold text-ink uppercase tracking-wider mb-2"
        >
          Matière / Unité d&apos;Enseignement (UE) <span className="text-danger">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-ink-muted">
            <BookOpen className="w-4 h-4 text-brand-700 dark:text-brand-400" />
          </div>

          <select
            id="matiere-ue-select"
            value={selectedUeCode}
            onChange={(e) => handleUeSelect(e.target.value)}
            className={`w-full pl-10 pr-10 py-3 bg-surface border rounded-xl text-sm font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-brand-700 transition-all appearance-none cursor-pointer ${
              error
                ? 'border-danger focus:ring-danger/30'
                : 'border-surface-border'
            }`}
          >
            <option value="">-- Choisissez une matière dans le référentiel officiel MBH --</option>
            {options.map((opt) => (
              <option key={opt.code} value={opt.code}>
                {opt.label} — {opt.credits} crédits ({getUeTypeLabel(opt.type as any)})
              </option>
            ))}
          </select>

          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-ink-muted">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>

        {error && <p className="mt-1 text-xs text-danger font-semibold">{error}</p>}
      </div>

      {/* ── 3. Second niveau optionnel : Sélection de l'ECU ciblé ── */}
      {/* Alimenté par currentUe.ecu (ue.ecu.length ECUs exactement) */}
      {currentUe && (
        <div className="p-4 bg-brand-50/60 dark:bg-brand-700/10 rounded-2xl border border-brand-200/80 dark:border-brand-700/30 space-y-2.5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <label
              htmlFor="ecu-subselect"
              className="text-xs font-bold text-brand-900 dark:text-brand-300 uppercase tracking-wider flex items-center gap-1.5"
            >
              <Layers className="w-3.5 h-3.5 text-brand-700 dark:text-brand-400" />
              <span>ECU ciblé par l&apos;épreuve (Optionnel)</span>
            </label>
            <span className="text-[11px] font-medium text-brand-800 dark:text-brand-400">
              {ecus.length} ECU{ecus.length > 1 ? 's' : ''} dans cette UE
            </span>
          </div>

          <p className="text-xs text-brand-900/80 dark:text-ink-muted leading-relaxed">
            Si cette épreuve porte sur un ECU précis (ex :{' '}
            <em>{ecus[0] || 'un cours spécifique'}</em>
            ), sélectionnez-le ci-dessous. L&apos;épreuve restera rattachée à{' '}
            <strong>
              {currentUe.code} — {currentUe.nom}
            </strong>
            .
          </p>

          <div className="relative">
            <select
              id="ecu-subselect"
              value={selectedEcuNom}
              onChange={(e) => onEcuChange(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-surface border border-brand-300/80 dark:border-brand-700/50 rounded-xl text-xs sm:text-sm font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-brand-700 appearance-none cursor-pointer"
            >
              <option value="">
                Épreuve globale de l&apos;UE (couvre les {ecus.length} ECU{ecus.length > 1 ? 's' : ''} de {currentUe.code})
              </option>
              {/* Itère EXCLUSIVEMENT sur currentUe.ecu — jamais sur credits */}
              {ecus.map((ecuName) => (
                <option key={ecuName} value={ecuName}>
                  Épreuve spécifique : {ecuName}
                </option>
              ))}
            </select>

            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-ink-muted">
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>

          {selectedEcuNom ? (
            <div className="flex items-center gap-2 text-xs font-semibold text-brand-900 dark:text-brand-300 bg-surface px-3 py-2 rounded-xl border border-brand-200 dark:border-brand-700/40">
              <Check className="w-4 h-4 text-brand-700 dark:text-brand-400 shrink-0" />
              <span>
                Rattachement :{' '}
                <strong>{currentUe.code} — {currentUe.nom}</strong> &gt; ECU :{' '}
                <strong className="underline">{selectedEcuNom}</strong>
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-[11px] text-ink-muted">
              <Info className="w-3.5 h-3.5 text-ink-muted shrink-0" />
              <span>Épreuve rattachée globalement à l&apos;Unité d&apos;Enseignement {currentUe.code}.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
