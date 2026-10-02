'use client';

import React from 'react';
import Link from 'next/link';
import { Epreuve } from '@/types';
import { formatRelativeDate, formatFileSize } from '@/lib/utils/date';
import { 
  FileText, 
  Image as ImageIcon, 
  ArrowRight, 
  Calendar, 
  Award, 
  DownloadCloud,
  BookOpen
} from 'lucide-react';

interface EpreuveCardProps {
  epreuve: Epreuve;
}

export function EpreuveCard({ epreuve }: EpreuveCardProps) {
  // Styles du badge de Type (Devoir, Rattrapage) — harmonisés avec la palette UAC
  const getTypeBadge = (type: string) => {
    switch (type.toLowerCase()) {
      case 'devoir':
        return {
          pill: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/60',
          dot: 'bg-blue-500 dark:bg-blue-400',
        };
      case 'rattrapage':
        return {
          pill: 'bg-accent-100 dark:bg-accent-400/15 text-accent-700 dark:text-accent-400 border-accent-400/40 dark:border-accent-400/30',
          dot: 'bg-accent-400 dark:bg-accent-400',
        };
      default:
        return {
          pill: 'bg-surface-2 text-ink-muted border-surface-border',
          dot: 'bg-ink-muted',
        };
    }
  };

  const isPdf = epreuve.type_fichier?.toLowerCase() === 'pdf';
  const badgeStyle = getTypeBadge(epreuve.type);

  return (
    <Link
      href={`/epreuves/${epreuve.id}`}
      className="group relative block bg-surface-card border border-surface-border hover:border-brand-400/40 rounded-2xl p-5 sm:p-6 shadow-subtle dark:shadow-none hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 overflow-hidden"
    >
      {/* Top subtle highlight gradient on hover */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-brand-500/0 to-transparent group-hover:via-brand-500 transition-all duration-300" />

      <div className="flex items-start gap-4">
        {/* Document Icon Avatar with format color */}
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-xs transition-transform duration-200 group-hover:scale-105 ${
          isPdf 
            ? 'bg-danger-50 dark:bg-danger/10 text-danger border border-danger-50 dark:border-danger/20' 
            : 'bg-brand-50 dark:bg-brand-700/15 text-brand-700 dark:text-brand-400 border border-brand-100 dark:border-brand-700/30'
        }`}>
          {isPdf ? (
            <FileText className="w-6 h-6" />
          ) : (
            <ImageIcon className="w-6 h-6" />
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          {/* Metadata Badges Row */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {/* Type badge with colored dot */}
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border capitalize shadow-xs ${badgeStyle.pill}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${badgeStyle.dot}`} />
              <span>{epreuve.type}</span>
            </span>

            {/* Niveau badge */}
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-ink-muted bg-surface-2 px-2.5 py-0.5 rounded-full border border-surface-border">
              <Award className="w-3 h-3 text-ink-muted" />
              <span>{epreuve.niveau}</span>
            </span>

            {/* Année Académique badge */}
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-ink-muted bg-surface-2 px-2.5 py-0.5 rounded-full border border-surface-border">
              <Calendar className="w-3 h-3 text-ink-muted" />
              <span>{epreuve.annee_academique}</span>
            </span>

            {/* Badge Code UE */}
            {epreuve.ue_code && (
              <span className="inline-flex items-center text-[11px] font-bold text-brand-800 dark:text-brand-300 bg-brand-50 dark:bg-brand-700/20 px-2 py-0.5 rounded-full border border-brand-200 dark:border-brand-700/40">
                {epreuve.ue_code}
              </span>
            )}

            {/* Badge ECU ciblé */}
            {epreuve.ecu_nom && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-ink bg-surface-2 px-2 py-0.5 rounded-full border border-surface-border">
                <span>ECU :</span>
                <strong className="text-brand-700 dark:text-brand-400 font-bold">{epreuve.ecu_nom}</strong>
              </span>
            )}

            {/* Badge Corrigé */}
            {epreuve.has_corrige && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-700/15 px-2.5 py-0.5 rounded-full border border-brand-200 dark:border-brand-700/40">
                <BookOpen className="w-3 h-3" />
                <span>Corrigé inclus</span>
              </span>
            )}
          </div>

          {/* Matière Title */}
          <h3 className="text-base sm:text-lg font-bold text-ink group-hover:text-brand-700 dark:group-hover:text-brand-400 transition-colors truncate">
            {epreuve.matiere_nom}
          </h3>

          {/* Optional specific Title if available */}
          {epreuve.titre && (
            <p className="mt-0.5 text-xs text-ink-muted line-clamp-1">
              {epreuve.titre}
            </p>
          )}
        </div>
      </div>

      {/* Footer Info Row */}
      <div className="mt-4 pt-3.5 border-t border-surface-border/60 flex items-center justify-between text-xs text-ink-muted">
        <div className="flex items-center gap-2">
          <span className="font-bold text-ink uppercase tracking-wider text-[11px]">
            {epreuve.type_fichier}
          </span>
          <span className="text-surface-border">•</span>
          <span className="font-medium text-ink-muted">
            {formatFileSize(epreuve.taille_octets)}
          </span>
          {epreuve.telechargements_count !== undefined && epreuve.telechargements_count > 0 && (
            <>
              <span className="text-surface-border">•</span>
              <span className="inline-flex items-center gap-1 text-brand-700 dark:text-brand-400 font-semibold text-[11px]">
                <DownloadCloud className="w-3.5 h-3.5" />
                {epreuve.telechargements_count}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-ink-muted hidden sm:inline-block">
            {formatRelativeDate(epreuve.created_at)}
          </span>

          <div className="w-7 h-7 rounded-full bg-surface-2 group-hover:bg-brand-700 group-hover:text-white flex items-center justify-center text-ink-muted transition-all duration-200 shadow-xs">
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </div>
    </Link>
  );
}
