'use client';

import React from 'react';
import { AlertTriangle, X, Trash2, Loader2 } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDanger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isProcessing?: boolean;
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = 'Supprimer définitivement',
  cancelLabel = 'Annuler',
  isDanger,
  onConfirm,
  onCancel,
  isProcessing = false,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Fond sombre estompé */}
      <div
        className="fixed inset-0 bg-ink/50 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={!isProcessing ? onCancel : undefined}
      />

      {/* Boîte modale */}
      <div className="relative bg-surface-card rounded-3xl shadow-2xl border border-surface-border max-w-md w-full p-6 sm:p-7 z-10 animate-in fade-in zoom-in-95 duration-150">
        <button
          type="button"
          onClick={onCancel}
          disabled={isProcessing}
          className="absolute top-5 right-5 text-ink-muted hover:text-ink p-1.5 rounded-xl hover:bg-surface-2 transition-colors"
          aria-label="Fermer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-danger-50 dark:bg-danger/10 border border-danger-50 dark:border-danger/20 flex items-center justify-center text-danger flex-shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>

          <div className="flex-1 pr-6">
            <h3 className="text-base sm:text-lg font-bold text-ink">
              {title}
            </h3>
            <p className="mt-1.5 text-xs sm:text-sm text-ink-muted leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        <div className="mt-7 flex items-center justify-end gap-2.5 pt-4 border-t border-surface-border">
          <button
            type="button"
            onClick={onCancel}
            disabled={isProcessing}
            className="px-4 py-2.5 text-xs sm:text-sm font-semibold border border-surface-border text-ink hover:bg-surface-2 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isProcessing}
            className="px-5 py-2.5 text-xs sm:text-sm font-bold text-danger border border-danger hover:bg-danger hover:text-white rounded-xl transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 active:scale-98"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Suppression...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>{confirmLabel}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}