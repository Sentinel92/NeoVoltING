import React from 'react';

interface NeovoltLogoProps {
  customLogoUrl?: string;
  variant?: 'dark' | 'light' | 'compact';
  className?: string;
  showSubtitle?: boolean;
}

export const NeovoltLogo: React.FC<NeovoltLogoProps> = ({
  customLogoUrl,
  variant = 'dark',
  className = '',
  showSubtitle = true,
}) => {
  if (customLogoUrl) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <img
          src={customLogoUrl}
          alt="Company Logo"
          className="h-10 max-w-[200px] object-contain rounded"
        />
      </div>
    );
  }

  const isLight = variant === 'light';
  const textColor = isLight ? 'text-slate-900' : 'text-white';
  const subColor = isLight ? 'text-pink-600 font-semibold' : 'text-fuchsia-400 font-medium';

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* 3D Cyan Wave 'N' Emblem SVG matching the Neovolt brand */}
      <div className="relative shrink-0 w-10 h-10 flex items-center justify-center">
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full drop-shadow-[0_0_12px_rgba(0,229,255,0.4)]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="neovoltGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00E5FF" />
              <stop offset="50%" stopColor="#0099FF" />
              <stop offset="100%" stopColor="#0055FF" />
            </linearGradient>
            <linearGradient id="neovoltGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#02C39A" />
              <stop offset="50%" stopColor="#00E5FF" />
              <stop offset="100%" stopColor="#0072FF" />
            </linearGradient>
            <linearGradient id="neovoltGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00F2FE" />
              <stop offset="100%" stopColor="#4FACFE" />
            </linearGradient>
          </defs>

          {/* Left Vertical Curve of N */}
          <path
            d="M 22,25 C 22,18 30,16 35,22 L 35,78 C 30,84 22,82 22,75 Z"
            fill="url(#neovoltGrad1)"
          />

          {/* Diagonal Ribbon Body of N */}
          <path
            d="M 22,25 C 28,20 40,28 65,68 C 72,78 80,74 80,65 L 80,25 C 75,18 68,20 68,26 L 68,52 C 60,40 40,18 28,15 C 20,13 22,22 22,25 Z"
            fill="url(#neovoltGrad2)"
            opacity="0.9"
          />

          {/* Right Vertical Curve of N */}
          <path
            d="M 66,22 C 66,15 74,13 79,19 L 79,75 C 74,81 66,79 66,72 Z"
            fill="url(#neovoltGlow)"
          />
        </svg>
      </div>

      {/* Brand Text Header */}
      <div className="flex flex-col leading-none">
        <div className="flex items-center gap-1.5">
          <span className={`font-black text-xl italic tracking-tight ${textColor}`}>
            NEOVOLT
          </span>
        </div>
        {showSubtitle && variant !== 'compact' && (
          <span className={`text-[10px] tracking-wide mt-0.5 ${subColor}`}>
            Ingeniería Eléctrica de Precisión
          </span>
        )}
      </div>
    </div>
  );
};
