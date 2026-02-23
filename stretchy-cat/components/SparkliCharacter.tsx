/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import sparkliSvg from '../assets/Sparkli.svg';

type SparkliVariant = 'head' | 'badge';

interface SparkliCharacterProps {
  variant?: SparkliVariant;
  className?: string;
}

const SparkliCharacter: React.FC<SparkliCharacterProps> = ({ variant = 'head', className }) => {
  const variantClass = variant === 'badge' ? 'sparkli-character-badge' : 'sparkli-character-head';
  const classNames = ['sparkli-character', variantClass, className].filter(Boolean).join(' ');

  return (
    <img
      src={sparkliSvg}
      alt=""
      aria-hidden="true"
      className={classNames}
      draggable={false}
      loading="eager"
    />
  );
};

export default SparkliCharacter;
