'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { Search, X, Sparkles } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchBar({
  value,
  onChange,
  placeholder = 'Rechercher une matière, un titre d\'épreuve...',
}: SearchBarProps) {
  const [localValue, setLocalValue] = useState(value);
  const [, startTransition] = useTransition();

  // Synchronisation avec valeur parent
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Debounce 250ms
  useEffect(() => {
    const handler = setTimeout(() => {
      if (localValue !== value) {
        startTransition(() => {
          onChange(localValue);
        });
      }
    }, 250);

    return () => clearTimeout(handler);
  }, [localValue, onChange, value]);

  const handleClear = () => {
    setLocalValue('');
    onChange('');
  };

  return (
    <div className="relative w-full group">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-ink-muted group-focus-within:text-brand-700 transition-colors">
        <Search className="w-5 h-5" />
      </div>

      <input
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-11 pr-20 py-3.5 bg-surface-card border border-surface-border rounded-2xl text-sm font-medium text-ink placeholder-ink-muted/60 focus:outline-none focus:ring-2 focus:ring-accent-400/40 focus:border-brand-700 shadow-subtle dark:shadow-none hover:border-brand-200 dark:hover:border-brand-700/40 transition-all duration-150"
      />

      <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center gap-1.5">
        {localValue ? (
          <button
            type="button"
            onClick={handleClear}
            className="p-1 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-2 transition-colors"
            aria-label="Effacer la recherche"
          >
            <X className="w-4 h-4" />
          </button>
        ) : (
          <span className="hidden sm:inline-flex items-center px-2 py-0.5 text-[10px] font-bold text-ink-muted bg-surface-2 border border-surface-border rounded-md select-none">
            Ctrl K
          </span>
        )}
      </div>
    </div>
  );
}
