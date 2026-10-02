'use client';

import React from 'react';

interface LogoProps {
  size?: number | 'sm' | 'md' | 'lg' | 'xl';
  withText?: boolean;
  className?: string;
  showBadge?: boolean;
}

export function Logo({
  size = 'md',
  withText = false,
  className = '',
  showBadge = true,
}: LogoProps) {
  const pixelSize = typeof size === 'number'
    ? size
    : {
        sm: 32,
        md: 40,
        lg: 48,
        xl: 64,
      }[size] || 40;

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <div 
        style={{ width: pixelSize, height: pixelSize }}
        className="relative shrink-0 flex items-center justify-center transition-transform duration-200 group-hover:scale-105"
      >
        {/* New UAC icon: yellow bg, green graduation cap, ascending bars */}
        <svg
          viewBox="0 0 512 512"
          width={pixelSize}
          height={pixelSize}
          className="w-full h-full drop-shadow-sm"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Yellow rounded square background */}
          <rect width="512" height="512" rx="117" fill="#F6D02F"/>
          {/* Graduation cap */}
          <path d="M256 73 L428 139 L256 205 L84 139 Z" fill="#14532D"/>
          <path d="M154 176 V245 Q256 293 358 245 V176 Z" fill="#14532D"/>
          {/* Red tassel */}
          <path d="M428 139 V241" stroke="#E4372A" strokeWidth="15" strokeLinecap="round" fill="none"/>
          {/* Ascending bars: green, green, red */}
          <rect x="139" y="406" width="62" height="51" rx="11" fill="#1F7A3A"/>
          <rect x="223" y="362" width="62" height="95" rx="11" fill="#1F7A3A"/>
          <rect x="307" y="318" width="62" height="139" rx="11" fill="#E4372A"/>
        </svg>
      </div>

      {withText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-xl font-extrabold tracking-tight text-ink group-hover:text-brand-700 transition-colors font-heading">
              Ascend<span className="text-brand-700 dark:text-accent-400">UAC</span>
            </span>
            {showBadge && (
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 text-[10px] font-bold text-brand-900 dark:text-accent-400 bg-accent-100 dark:bg-accent-400/15 border border-accent-400/40 dark:border-accent-400/30 rounded-badge uppercase tracking-wider">
                MBH • EPAC
              </span>
            )}
          </div>
          <span className="text-[10px] font-medium text-ink-muted hidden sm:block">
            Génie Biomédical &amp; Hospitalier
          </span>
        </div>
      )}
    </div>
  );
}
export default Logo;
