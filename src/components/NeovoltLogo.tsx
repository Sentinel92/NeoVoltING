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
  // Authentic Neovolt Magenta (#E83D84) for subtitle
  const subColor = isLight ? 'text-[#d81b60] font-semibold' : 'text-[#e83d84] font-medium';

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* 3D Cyan Wave 'N' Emblem SVG matching the Neovolt brand */}
      <div className="relative shrink-0 w-10 h-10 flex items-center justify-center">
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full drop-shadow-[0_0_14px_rgba(0,229,255,0.45)]"
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
              <stop offset="0%" stopColor="#00F2FE" />
              <stop offset="50%" stopColor="#00C8D6" />
              <stop offset="100%" stopColor="#0072FF" />
            </linearGradient>
            <linearGradient id="neovoltGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00F2FE" />
              <stop offset="100%" stopColor="#0284C7" />
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
            opacity="0.95"
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

/**
 * Returns an SVG string representation of the official NEOVOLT logo
 */
export function getNeovoltLogoSvgString(options?: { width?: number; height?: number; isLight?: boolean }): string {
  const textColor = options?.isLight ? '#0f172a' : '#ffffff';
  const subColor = '#e83d84'; // Official Magenta (#E83D84)
  const width = options?.width || 380;
  const height = options?.height || 90;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 380 90" width="${width}" height="${height}">
    <defs>
      <linearGradient id="nvSvgGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#00E5FF" />
        <stop offset="50%" stop-color="#0099FF" />
        <stop offset="100%" stop-color="#0055FF" />
      </linearGradient>
      <linearGradient id="nvSvgGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#00F2FE" />
        <stop offset="50%" stop-color="#00C8D6" />
        <stop offset="100%" stop-color="#0072FF" />
      </linearGradient>
      <linearGradient id="nvSvgGlow" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#00F2FE" />
        <stop offset="100%" stop-color="#0284C7" />
      </linearGradient>
    </defs>
    <g transform="translate(6, 6) scale(0.8)">
      <path d="M 22,25 C 22,18 30,16 35,22 L 35,78 C 30,84 22,82 22,75 Z" fill="url(#nvSvgGrad1)"/>
      <path d="M 22,25 C 28,20 40,28 65,68 C 72,78 80,74 80,65 L 80,25 C 75,18 68,20 68,26 L 68,52 C 60,40 40,18 28,15 C 20,13 22,22 22,25 Z" fill="url(#nvSvgGrad2)" opacity="0.95"/>
      <path d="M 66,22 C 66,15 74,13 79,19 L 79,75 C 74,81 66,79 66,72 Z" fill="url(#nvSvgGlow)"/>
    </g>
    <text x="96" y="46" fill="${textColor}" font-family="Helvetica, Arial, sans-serif" font-weight="900" font-style="italic" font-size="34" letter-spacing="1">NEOVOLT</text>
    <text x="98" y="72" fill="${subColor}" font-family="Helvetica, Arial, sans-serif" font-weight="bold" font-size="14" letter-spacing="0.5">Ingeniería Eléctrica de Precisión</text>
  </svg>`;
}

/**
 * Pre-renders the official NEOVOLT logo into a high-resolution PNG Data URL for jsPDF embedding
 */
export async function getNeovoltLogoDataUrl(isLight: boolean = false): Promise<string> {
  if (typeof window === 'undefined') return '';
  return new Promise((resolve) => {
    try {
      const svgStr = getNeovoltLogoSvgString({ width: 760, height: 180, isLight });
      const img = new Image();
      const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 760;
        canvas.height = 180;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const pngData = canvas.toDataURL('image/png');
          URL.revokeObjectURL(url);
          resolve(pngData);
        } else {
          URL.revokeObjectURL(url);
          resolve('');
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve('');
      };
      img.src = url;
    } catch {
      resolve('');
    }
  });
}

