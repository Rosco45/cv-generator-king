import React, { useState } from 'react';

/**
 * Logo officiel de CV Generator King :
 * Un parchemin avec des membres (bras et jambes) et un pouce en l'air,
 * le tout surmonté d'une couronne royale.
 */
export default function KingLogo({ size = 48, showImage = true, className = '' }) {
  const [imgError, setImgError] = useState(false);

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
      title="CV Generator King — Le Roi du CV"
    >
      {showImage && !imgError ? (
        <img
          src="/logo-mascot.png"
          alt="Logo CV Generator King - Parchemin couronné avec pouce en l'air"
          onError={() => setImgError(true)}
          className="w-full h-full object-contain rounded-xl drop-shadow-[0_2px_10px_rgba(245,158,11,0.45)] border border-amber-400/40 bg-white"
        />
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 120 120"
          fill="none"
          className="w-full h-full drop-shadow-[0_2px_8px_rgba(245,158,11,0.4)]"
        >
          {/* Royal Glow Badge */}
          <circle cx="60" cy="64" r="52" fill="#1E3A8A" stroke="#F59E0B" strokeWidth="3.5" />
          {/* Crown on Top */}
          <path
            d="M35 32L43 15L56 26L60 11L64 26L77 15L85 32H35Z"
            fill="#FBBF24"
            stroke="#78350F"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <rect x="35" y="31" width="50" height="6" rx="2" fill="#F59E0B" stroke="#78350F" strokeWidth="2" />
          <circle cx="60" cy="23" r="3" fill="#2563EB" />
          <circle cx="46" cy="25" r="2.2" fill="#EF4444" />
          <circle cx="74" cy="25" r="2.2" fill="#EF4444" />
          {/* Parchment Top Roll */}
          <rect x="30" y="37" width="60" height="10" rx="5" fill="#FDE68A" stroke="#78350F" strokeWidth="2.5" />
          <circle cx="85" cy="42" r="3" fill="#D97706" />
          {/* Parchment Body */}
          <rect x="35" y="46" width="50" height="42" rx="3" fill="#FEF3C7" stroke="#78350F" strokeWidth="2.5" />
          {/* Friendly Royal Eyes & Smile */}
          <circle cx="51" cy="58" r="3.5" fill="#1E293B" />
          <circle cx="69" cy="58" r="3.5" fill="#1E293B" />
          <circle cx="52" cy="57" r="1.2" fill="#FFFFFF" />
          <circle cx="70" cy="57" r="1.2" fill="#FFFFFF" />
          <path d="M51 67C54 71 66 71 69 67" stroke="#78350F" strokeWidth="2.5" strokeLinecap="round" />
          {/* CV Lines on Parchment */}
          <line x1="43" y1="75" x2="65" y2="75" stroke="#D97706" strokeWidth="2" strokeLinecap="round" />
          <line x1="43" y1="80" x2="75" y2="80" stroke="#D97706" strokeWidth="2" strokeLinecap="round" />
          {/* Parchment Bottom Roll */}
          <rect x="30" y="85" width="60" height="10" rx="5" fill="#FDE68A" stroke="#78350F" strokeWidth="2.5" />
          {/* Left Arm + Thumbs Up */}
          <path d="M35 62C25 62 21 57 20 51" stroke="#FBBF24" strokeWidth="5" strokeLinecap="round" />
          <rect x="13" y="45" width="11" height="11" rx="4" fill="#FFFFFF" stroke="#1E293B" strokeWidth="2" />
          <path d="M19 45V36C19 34 23 34 23 37V45" fill="#FFFFFF" stroke="#1E293B" strokeWidth="2" />
          {/* Right Arm on Hip */}
          <path d="M85 62C95 65 95 75 86 78" stroke="#FBBF24" strokeWidth="5" strokeLinecap="round" />
          <circle cx="86" cy="78" r="4.5" fill="#FFFFFF" stroke="#1E293B" strokeWidth="2" />
          {/* Legs & Boots */}
          <path d="M48 95V108H40" stroke="#FBBF24" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M72 95V108H80" stroke="#FBBF24" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  );
}
