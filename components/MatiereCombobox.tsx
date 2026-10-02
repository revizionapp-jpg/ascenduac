'use client';

import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, Check, Plus, ChevronDown } from 'lucide-react';
import { Matiere } from '@/types';
import { normalizeMatiereNom } from '@/lib/utils/validation';

interface MatiereComboboxProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  matieresList: Matiere[];
}

export function MatiereCombobox({
  value,
  onChange,
  error,
  matieresList = [],
}: MatiereComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Fermeture au clic extérieur
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const normalizedQuery = normalizeMatiereNom(query || '');

  // Filtrage des suggestions existantes
  const filteredMatieres = matieresList.filter((m) =>
    normalizeMatiereNom(m.nom).includes(normalizedQuery)
  );

  // Vérifier s'il y a une correspondance exacte
  const hasExactMatch = matieresList.some(
    (m) => normalizeMatiereNom(m.nom) === normalizedQuery
  );

  const canAddNew = query.trim().length >= 2 && !hasExactMatch;

  const handleSelect = (matiereNom: string) => {
    setQuery(matiereNom);
    onChange(matiereNom);
    setIsOpen(false);
  };

  const handleCreateNew = () => {
    const cleanName = query.trim();
    if (cleanName) {
      handleSelect(cleanName);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-ink-muted">
          <BookOpen className="w-4 h-4" />
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Ex: Électronique Médicale, Imagerie..."
          className={`w-full pl-10 pr-10 py-3 bg-surface border rounded-xl text-sm font-medium text-ink placeholder-ink-muted/60 focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-brand-700 transition-all ${
            error
              ? 'border-danger focus:ring-danger/30 focus:border-danger'
              : 'border-surface-border shadow-subtle dark:shadow-none'
          }`}
        />

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-ink-muted hover:text-ink transition-colors"
          aria-label="Dérouler la liste des matières"
        >
          <ChevronDown className={`w-4 h-4 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Menu déroulant des suggestions */}
      {isOpen && (
        <div className="absolute z-30 mt-1.5 w-full glass-dropdown rounded-2xl p-2 border border-surface-border shadow-lg max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
          {filteredMatieres.length > 0 ? (
            <div className="space-y-0.5">
              <p className="px-3 py-1.5 text-[11px] font-bold text-ink-muted uppercase tracking-wider">
                Matières enregistrées
              </p>
              {filteredMatieres.map((m) => {
                const isSelected = value.toLowerCase() === m.nom.toLowerCase();
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleSelect(m.nom)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm text-left transition-colors ${
                      isSelected
                        ? 'bg-brand-50 dark:bg-brand-700/20 text-brand-700 dark:text-brand-300 font-bold'
                        : 'text-ink hover:bg-surface-2'
                    }`}
                  >
                    <span>{m.nom}</span>
                    {isSelected && <Check className="w-4 h-4 text-brand-700 dark:text-brand-400" />}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="px-3 py-3 text-xs text-ink-muted text-center">
              Aucune matière existante ne correspond.
            </p>
          )}

          {/* Option de création à la volée */}
          {canAddNew && (
            <div className="pt-2 mt-1 border-t border-surface-border">
              <button
                type="button"
                onClick={handleCreateNew}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs sm:text-sm font-semibold text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-700/20 hover:bg-brand-100 dark:hover:bg-brand-700/30 rounded-xl transition-colors text-left"
              >
                <div className="w-5 h-5 rounded-full bg-brand-200 dark:bg-brand-700/50 flex items-center justify-center text-brand-800 dark:text-brand-200">
                  <Plus className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 truncate">
                  <span>Créer la matière : </span>
                  <span className="font-bold underline">{query.trim()}</span>
                </div>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
