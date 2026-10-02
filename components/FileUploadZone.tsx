'use client';

import React, { useRef, useState } from 'react';
import { 
  UploadCloud, 
  FileText, 
  Image as ImageIcon, 
  X, 
  AlertCircle, 
  Loader2,
  Sparkles 
} from 'lucide-react';
import { formatFileSize } from '@/lib/utils/date';
import { MAX_FILE_SIZE_BYTES, getCanonicalFileType } from '@/lib/utils/validation';
import { compressImageClient } from '@/lib/utils/compression-image';

interface FileUploadZoneProps {
  file: File | null;
  onFileSelect: (file: File | null) => void;
  uploadProgress: number | null; // null si pas en upload, 0-100 si en cours
  error?: string;
}

export function FileUploadZone({
  file,
  onFileSelect,
  uploadProgress,
  error,
}: FileUploadZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [wasCompressed, setWasCompressed] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleFiles = async (files: FileList | null) => {
    setLocalError(null);
    setWasCompressed(false);
    if (!files || files.length === 0) return;

    const selected = files[0];

    // Vérification taille max 15 Mo
    if (selected.size > MAX_FILE_SIZE_BYTES) {
      setLocalError('Le fichier dépasse la taille maximale autorisée de 15 Mo.');
      return;
    }

    // Vérification format
    const canonicalType = getCanonicalFileType(selected.name, selected.type);
    if (!canonicalType) {
      setLocalError('Format non pris en charge. Formats acceptés : PDF, JPG, PNG, HEIC.');
      return;
    }

    // Compression d'image automatique côté client
    if (canonicalType !== 'pdf') {
      try {
        setCompressing(true);
        const originalSize = selected.size;
        const compressed = await compressImageClient(selected);
        if (compressed.size < originalSize) {
          setWasCompressed(true);
        }
        onFileSelect(compressed);
      } catch (err) {
        console.error('Erreur compression client:', err);
        onFileSelect(selected);
      } finally {
        setCompressing(false);
      }
    } else {
      onFileSelect(selected);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFileSelect(null);
    setWasCompressed(false);
    setLocalError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const displayError = error || localError;
  const isPdf = file ? getCanonicalFileType(file.name, file.type) === 'pdf' : false;

  return (
    <div className="w-full space-y-2">
      {/* Zone d'upload / Dropzone */}
      {!file ? (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative group cursor-pointer rounded-2xl border-2 border-dashed p-8 sm:p-10 text-center transition-all duration-200 ${
            dragActive
              ? 'border-brand-700 bg-brand-50/70 dark:bg-brand-700/20 scale-[1.01]'
              : 'border-surface-border hover:border-brand-400 bg-surface-2/40 hover:bg-surface-2/70'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.heic"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />

          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-surface border border-surface-border shadow-xs flex items-center justify-center text-ink-muted group-hover:text-brand-700 group-hover:border-brand-200 dark:group-hover:border-brand-700/40 group-hover:scale-110 transition-all duration-200">
              {compressing ? (
                <Loader2 className="w-7 h-7 animate-spin text-brand-700" />
              ) : (
                <UploadCloud className="w-7 h-7" />
              )}
            </div>

            <div>
              <p className="text-sm font-bold text-ink group-hover:text-brand-700 transition-colors">
                {compressing ? 'Optimisation du fichier...' : 'Cliquez pour sélectionner ou glissez votre fichier'}
              </p>
              <p className="mt-1 text-xs text-ink-muted">
                PDF numérisé ou photo de l&apos;épreuve (JPG, PNG, HEIC)
              </p>
            </div>

            {/* Badges des formats autorisés */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
              {['PDF', 'JPG', 'PNG', 'HEIC'].map((format) => (
                <span
                  key={format}
                  className="px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider bg-surface border border-surface-border text-ink-muted"
                >
                  {format}
                </span>
              ))}
              <span className="text-[11px] font-medium text-ink-muted ml-1">
                • Max 15 Mo
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* Fichier sélectionné - Carte de prévisualisation */
        <div className="bg-surface-card border border-surface-border rounded-2xl p-4 sm:p-5 shadow-subtle dark:shadow-none transition-all">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                isPdf 
                  ? 'bg-danger-50 dark:bg-danger/10 text-danger border border-danger-50 dark:border-danger/20' 
                  : 'bg-brand-50 dark:bg-brand-700/15 text-brand-700 dark:text-brand-400 border border-brand-100 dark:border-brand-700/30'
              }`}>
                {isPdf ? <FileText className="w-6 h-6" /> : <ImageIcon className="w-6 h-6" />}
              </div>

              <div className="min-w-0">
                <p className="text-sm font-bold text-ink truncate max-w-xs sm:max-w-md">
                  {file.name}
                </p>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-ink-muted">
                  <span className="font-semibold uppercase text-ink">{isPdf ? 'PDF' : 'Image'}</span>
                  <span>•</span>
                  <span>{formatFileSize(file.size)}</span>
                  {wasCompressed && (
                    <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-700/20 px-2 py-0.5 rounded-full border border-brand-200 dark:border-brand-700/40">
                      <Sparkles className="w-3 h-3" />
                      Optimisé
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Bouton supprimer */}
            {uploadProgress === null && (
              <button
                type="button"
                onClick={handleRemove}
                className="p-2 text-ink-muted hover:text-danger hover:bg-danger-50 dark:hover:bg-danger/10 rounded-xl transition-colors flex-shrink-0"
                aria-label="Supprimer le fichier"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Barre de progression d'upload */}
          {uploadProgress !== null && (
            <div className="mt-4 pt-3 border-t border-surface-border">
              <div className="flex items-center justify-between text-xs font-semibold text-ink mb-1.5">
                <span>Téléversement sécurisé vers le cloud...</span>
                <span className="font-bold text-brand-700 dark:text-brand-400">{uploadProgress}%</span>
              </div>
              <div className="w-full h-2 bg-surface-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-700 rounded-full transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Affichage des erreurs */}
      {displayError && (
        <div className="flex items-center gap-2 text-xs font-semibold text-danger bg-danger-50 dark:bg-danger/10 p-3 rounded-xl border border-danger/30 animate-in fade-in">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{displayError}</span>
        </div>
      )}
    </div>
  );
}
