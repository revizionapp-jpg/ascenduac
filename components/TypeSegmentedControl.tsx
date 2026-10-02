'use client';

import React from 'react';

interface TypeSegmentedControlProps {
  selectedType: string; // 'all' | 'devoir' | 'rattrapage'
  onChange: (type: string) => void;
}

export function TypeSegmentedControl({
  selectedType,
  onChange,
}: TypeSegmentedControlProps) {
  const options = [
    { value: 'all', label: 'Tous', countDot: null },
    { value: 'devoir', label: 'Devoirs', countDot: 'bg-blue-500' },
    { value: 'rattrapage', label: 'Rattrapages', countDot: 'bg-accent-400' },
  ];

  return (
    <div className="w-full bg-surface-2/90 p-1.5 rounded-2xl flex items-center border border-surface-border/70 shadow-xs">
      {options.map((option) => {
        const isSelected = selectedType.toLowerCase() === option.value.toLowerCase();
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-200 text-center ${
              isSelected
                ? 'bg-brand-700 text-white shadow-sm font-bold scale-[1.01]'
                : 'text-ink-muted hover:text-ink hover:bg-brand-50 dark:hover:bg-surface-2'
            }`}
          >
            {option.countDot && (
              <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white/60' : option.countDot}`} />
            )}
            <span className="truncate">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
