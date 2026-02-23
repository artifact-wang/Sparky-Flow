/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface IconProps {
  className?: string;
}

export const TimerIcon: React.FC<IconProps> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
    <path
      d="M7.88086 3.50065V1.83398H12.8809V3.50065H7.88086ZM9.54753 12.6673H11.2142V7.66732H9.54753V12.6673ZM7.47461 18.7402C6.56489 18.3444 5.76975 17.8062 5.08919 17.1257C4.40864 16.4451 3.87044 15.65 3.47461 14.7402C3.07878 13.8305 2.88086 12.8618 2.88086 11.834C2.88086 10.8062 3.07878 9.83746 3.47461 8.92773C3.87044 8.01801 4.40864 7.22287 5.08919 6.54232C5.76975 5.86176 6.56489 5.32357 7.47461 4.92773C8.38433 4.5319 9.35308 4.33398 10.3809 4.33398C11.242 4.33398 12.0684 4.47287 12.86 4.75065C13.6517 5.02843 14.3947 5.43121 15.0892 5.95898L16.2559 4.79232L17.4225 5.95898L16.2559 7.12565C16.7836 7.8201 17.1864 8.56315 17.4642 9.35482C17.742 10.1465 17.8809 10.9729 17.8809 11.834C17.8809 12.8618 17.6829 13.8305 17.2871 14.7402C16.8913 15.65 16.3531 16.4451 15.6725 17.1257C14.992 17.8062 14.1968 18.3444 13.2871 18.7402C12.3774 19.1361 11.4086 19.334 10.3809 19.334C9.35308 19.334 8.38433 19.1361 7.47461 18.7402Z"
      fill="currentColor"
    />
  </svg>
);

export const FigmaCloseIcon: React.FC<IconProps> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
    <path d="M7.48 26L6 24.52 14.52 16 6 7.48 7.48 6 16 14.52 24.52 6 26 7.48 17.48 16 26 24.52 24.52 26 16 17.48 7.48 26Z" fill="currentColor" />
  </svg>
);

export const InfoIcon: React.FC<IconProps> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
    <circle cx="16" cy="16" r="14" fill="currentColor" fillOpacity="0.15" />
    <path d="M16 11a2 2 0 1 0 0 0.01V11Zm-2.3 5.5H18.3V24H13.7V16.5Z" fill="currentColor" />
  </svg>
);

export const HomeIcon: React.FC<IconProps> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
    <path d="M3 11.5 12 4l9 7.5v8.5h-6.5v-5h-5v5H3v-8.5Z" fill="currentColor" />
  </svg>
);

export const RestartIcon: React.FC<IconProps> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
    <path d="M12.2 4a8.2 8.2 0 1 0 7.9 6h-2.6a5.8 5.8 0 1 1-1.7-2.8L13 10h7V3l-2.3 2.3A8.1 8.1 0 0 0 12.2 4Z" fill="currentColor" />
  </svg>
);
