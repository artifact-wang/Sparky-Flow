/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { HomeIcon, RestartIcon } from './Icons';

interface FooterLeftContentProps {
  levelId: number;
  score: number;
  onReset: () => void;
  onMenu: () => void;
}

const FooterLeftContent: React.FC<FooterLeftContentProps> = ({
  levelId,
  score,
  onReset,
  onMenu,
}) => {
  return (
    <div className="sparkli-score-panel" role="status" aria-live="polite">
      <div className="sparkli-score-copy">
        <span className="sparkli-score-label">Current Run</span>
        <strong>{score.toLocaleString()} pts</strong>
        <span className="sparkli-score-level">Level {levelId}</span>
      </div>
      <div className="sparkli-action-group">
        <button
          type="button"
          onClick={e => {
            e.stopPropagation();
            onMenu();
          }}
          className="sparkli-menu-button sparkli-hard-button"
        >
          <HomeIcon className="sparkli-action-icon" />
          Main Menu
        </button>
        <button
          type="button"
          onClick={e => {
            e.stopPropagation();
            onReset();
          }}
          className="sparkli-reset-button sparkli-hard-button"
        >
          <RestartIcon className="sparkli-action-icon" />
          Restart Run
        </button>
      </div>
    </div>
  );
};

export default FooterLeftContent;
