/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface GameOverProps {
  type: 'win' | 'lose';
  score: number;
  onAction: () => void;
}

const GameOver: React.FC<GameOverProps> = ({ type, score, onAction }) => {
  const isWin = type === 'win';

  return (
    <div className="sparkli-overlay" role="dialog" aria-modal="true" aria-label={isWin ? 'You won' : 'Time up'}>
      <div className="sparkli-overlay-card">
        <div className="sparkli-overlay-icon" aria-hidden="true">
          <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M32 4 38.8 23.1 59 32l-20.2 8.9L32 60l-6.8-19.1L5 32l20.2-8.9L32 4Z" fill="#fff" />
          </svg>
        </div>

        <h2>{isWin ? 'All levels cleared!' : 'Clock ran out'}</h2>
        <p>{isWin ? 'Your cat mastered every room.' : 'Try a cleaner route to finish faster.'}</p>

        <div className="sparkli-overlay-score">
          <span>Score</span>
          <strong>{score.toLocaleString()}</strong>
        </div>

        <button type="button" onClick={onAction} className="sparkli-overlay-button">
          {isWin ? 'Play Again' : 'Retry'}
        </button>
      </div>
    </div>
  );
};

export default GameOver;
