/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface MarkProps {
  className?: string;
}

export const SparkliWordmark: React.FC<MarkProps> = ({ className }) => (
  <span className={className ?? ''} aria-label="Sparkli">
    Sparkli
  </span>
);

export const SparkliStarsMark: React.FC<MarkProps> = ({ className }) => (
  <svg
    viewBox="0 0 120 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    className={className}
  >
    <path d="M20 14c2 10 6 14 16 16-10 2-14 6-16 16-2-10-6-14-16-16 10-2 14-6 16-16Z" fill="#E35AB0" />
    <path d="M82 18c2 9 6 13 15 15-9 2-13 6-15 15-2-9-6-13-15-15 9-2 13-6 15-15Z" fill="#5637D8" />
    <path d="M60 52c2 12 7 17 19 19-12 2-17 7-19 19-2-12-7-17-19-19 12-2 17-7 19-19Z" fill="#208BFF" />
    <circle cx="38" cy="58" r="8" fill="#25B8D5" />
    <circle cx="73" cy="50" r="6.5" fill="#F5A112" />
    <circle cx="92" cy="63" r="9" fill="#FA5C4D" />
  </svg>
);

