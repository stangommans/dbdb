import React from 'react';

interface VesselIconProps {
  vessel: string | null | undefined;
  className?: string;
}

export default function VesselIcon({ vessel, className = "w-3.5 h-3.5" }: VesselIconProps) {
  const v = vessel?.toLowerCase() || 'other';

  if (v === 'glass' || v === 'pint') {
    // Elegant outlines of a beer pint glass with foam detail
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        {/* Handle for pint mug */}
        <path d="M17 11h1a3 3 0 0 1 0 6h-1" />
        {/* Mug body */}
        <path d="M5 8v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V8" />
        {/* Foam detail at the top */}
        <path d="M14 7.5c-1 0-1.44.5-3 .5s-2-.5-3-.5-1.72.5-2.5.5a2.5 2.5 0 0 1 0-5c.78 0 1.57.5 2.5.5S9.44 3 11 3s2 .5 3 .5 1.72-.5 2.5-.5a2.5 2.5 0 0 1 2.5 2.5c0 1.5-1 2.5-2.5 2.5Z" />
      </svg>
    );
  }

  if (v === 'can') {
    // Beautiful, clean aluminum beverage can outline
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        {/* Can main body */}
        <rect x="6" y="5" width="12" height="15" rx="1.5" />
        {/* Can top tab/rim detail */}
        <path d="M9 3h6M12 3v2" />
        {/* Upper and lower rim highlights */}
        <path d="M6 7h12M6 18h12" />
        {/* Can design sweep accents */}
        <path d="M9 11c1.5 1 3.5 1 5 0M8 14c2.5 1.5 5.5 0 5.5 0" />
      </svg>
    );
  }

  if (v === 'bottle') {
    // Professional beer/soda bottle outline
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        {/* Bottle neck tapering down into standard bottle base */}
        <path d="M10 2h4v5l2.5 3.5v10.5a1 1 0 0 1-1 1H8.5a1 1 0 0 1-1-1V10.5L10 7V2Z" />
        {/* Bottle cap detail */}
        <path d="M10 4.5h4" />
        {/* Label area markings */}
        <path d="M7.5 12h9M7.5 16h9" />
      </svg>
    );
  }

  // Fallback for 'other' / general drinks - Martini/Cocktail glass
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M22 3H2l10 10V21M7 21h10M3 5h18" />
    </svg>
  );
}
