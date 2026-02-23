/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useId } from 'react';

type SparkliVariant = 'head' | 'badge';

interface SparkliCharacterProps {
  variant?: SparkliVariant;
  className?: string;
}

const SparkliCharacter: React.FC<SparkliCharacterProps> = ({ variant = 'head', className }) => {
  const id = useId().replace(/:/g, '');
  const bgId = `sparkli-bg-${id}`;
  const bodyId = `sparkli-body-${id}`;
  const faceId = `sparkli-face-${id}`;
  const eyeId = `sparkli-eye-${id}`;
  const feetId = `sparkli-feet-${id}`;
  const showBadgeExtras = variant === 'badge';

  return (
    <svg
      viewBox="0 0 336 336"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      <defs>
        <radialGradient id={bgId} cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(168 168) rotate(90) scale(160)">
          <stop stopColor="#F8E3F2" />
          <stop offset="1" stopColor="#EED2E5" />
        </radialGradient>
        <linearGradient id={bodyId} x1="108" y1="22" x2="246" y2="286" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FF3A9A" />
          <stop offset="1" stopColor="#8C4EF1" />
        </linearGradient>
        <linearGradient id={faceId} x1="108" y1="112" x2="228" y2="236" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FEAAB8" />
          <stop offset="1" stopColor="#FFD1D8" />
        </linearGradient>
        <linearGradient id={eyeId} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#5E8CFC" />
          <stop offset="1" stopColor="#364DD8" />
        </linearGradient>
        <linearGradient id={feetId} x1="147" y1="252" x2="189" y2="309" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FF93B4" />
          <stop offset="1" stopColor="#FFCD74" />
        </linearGradient>
      </defs>

      <circle cx="168" cy="168" r={showBadgeExtras ? 158 : 149} fill={`url(#${bgId})`} />

      <path
        d="M282 59c25 28 40 66 40 107 0 89-71 161-158 161-29 0-56-8-81-22 25 11 50 16 76 16 78 0 141-63 141-141 0-44-20-82-51-108 13-1 25-4 33-13Z"
        fill="#FF3798"
      />

      <path
        d="M168 8c-3 34 18 47 40 79 20 29 34 61 34 103 0 66-48 120-108 120S26 256 26 190c0-42 14-74 34-103 22-32 43-45 40-79 30 11 55 30 72 58 17-28 42-47 72-58Z"
        fill={`url(#${bodyId})`}
      />

      <path
        d="M84 232c27 3 46 2 84-2 39 4 57 5 84 2-4 19-16 34-32 41-20 9-52 8-52 8s-32 1-52-8c-16-7-28-22-32-41Z"
        fill="#D90386"
      />

      <ellipse cx="168" cy="173" rx="82" ry="70" fill={`url(#${faceId})`} />

      <ellipse cx="132" cy="173" rx="34" ry="40" fill="#FFFFFF" />
      <ellipse cx="204" cy="173" rx="34" ry="40" fill="#FFFFFF" />
      <ellipse cx="132" cy="174" rx="23" ry="28" fill={`url(#${eyeId})`} />
      <ellipse cx="204" cy="174" rx="23" ry="28" fill={`url(#${eyeId})`} />

      <path d="M130 166l3 8 9 .8-7 5.5 2.4 8.4-7.4-4.9-7.4 4.9 2.4-8.4-7-5.5 9-.8 3-8Z" fill="#FFFFFF" />
      <path d="M202 166l3 8 9 .8-7 5.5 2.4 8.4-7.4-4.9-7.4 4.9 2.4-8.4-7-5.5 9-.8 3-8Z" fill="#FFFFFF" />

      <path d="M149 213c3.8 9.8 33.2 9.8 37 0" stroke="#F02A93" strokeWidth="4" strokeLinecap="round" />
      <path d="M165 205c1.8 4.8 4 7.2 7 7.2s5.2-2.4 7-7.2" stroke="#F02A93" strokeWidth="3" strokeLinecap="round" />
      <path d="M118 120c-10 10-14 21-12 33M220 120c10 10 14 21 12 33" stroke="#FF8EC1" strokeWidth="10" strokeLinecap="round" />

      {showBadgeExtras && (
        <>
          <ellipse cx="145" cy="292" rx="24" ry="14" fill="#FFFFFF" fillOpacity="0.9" />
          <ellipse cx="191" cy="292" rx="24" ry="14" fill="#FFFFFF" fillOpacity="0.9" />
          <ellipse cx="168" cy="286" rx="32" ry="28" fill={`url(#${feetId})`} />
        </>
      )}
    </svg>
  );
};

export default SparkliCharacter;
