'use client';

import React from 'react';
import Link from 'next/link';
import { FileSearch, Upload, RotateCcw, Sparkles } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  onReset?: () => void;
  showDepositCTA?: boolean;
}

export function EmptyState({
  title = 'Aucune épreuve trouvée',
  description = 'Aucune épreuve ne correspond à vos critères de recherche actuels. Essayez d\'élargir vos filtres ou soyez le premier à la partager !',
  onReset,
  showDepositCTA = true,
}: EmptyStateProps) {
  return (
    <div className="relative bg-surface-card border border-surface-border rounded-3xl p-8 sm:p-14 text-center my-6 shadow-subtle dark:shadow-none overflow-hidden">
      {/* Subtle ambient light gradient background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-brand-500/5 blur-3xl rounded-full pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center max-w-md mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-50 to-brand-100 dark:from-brand-700/20 dark:to-brand-700/10 border border-brand-100 dark:border-brand-700/30 flex items-center justify-center text-brand-700 dark:text-brand-400 mb-5 shadow-xs">
          <FileSearch className="w-8 h-8" />
        </div>

        <h3 className="text-lg sm:text-xl font-extrabold text-ink tracking-tight">
          {title}
        </h3>

        <p className="mt-2 text-xs sm:text-sm text-ink-muted leading-relaxed">
          {description}
        </p>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          {onReset && (
            <button
              onClick={onReset}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border border-surface-border text-ink hover:bg-surface-2 rounded-xl transition-all active:scale-98"
            >
              <RotateCcw className="w-4 h-4 text-ink-muted" />
              <span>Réinitialiser les filtres</span>
            </button>
          )}

          {showDepositCTA && (
            <Link
              href="/deposer"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-brand-700 hover:bg-brand-800 rounded-xl shadow-md shadow-brand-700/20 transition-all hover:scale-[1.02] active:scale-98"
            >
              <Upload className="w-4 h-4 text-brand-200" />
              <span>Déposer cette épreuve</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
