/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import SparkliCharacter from './SparkliCharacter';
import { SparkliStarsMark, SparkliWordmark } from './BrandMarks';

type RunResult = 'win' | 'lose' | 'quit';

interface RunRecord {
  id: number;
  score: number;
  level: number;
  result: RunResult;
  playedAt: string;
}

interface RunStats {
  bestScore: number;
  highestLevel: number;
  totalRuns: number;
  recentRuns: RunRecord[];
}

interface EntryMenuProps {
  stats: RunStats;
  onStart: () => void;
  onClearStats: () => void;
}

const resultLabel: Record<RunResult, string> = {
  win: 'Victory',
  lose: 'Time Up',
  quit: 'Quit Early',
};

const formatPlayedAt = (iso: string) => {
  try {
    return new Date(iso).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return 'Recent';
  }
};

const EntryMenu: React.FC<EntryMenuProps> = ({ stats, onStart, onClearStats }) => {
  const latestRun = stats.recentRuns[0];
  const latestRunSummary = latestRun
    ? `${resultLabel[latestRun.result]} · Lv ${latestRun.level} · ${latestRun.score.toLocaleString()} pts`
    : 'No run logged yet';

  return (
    <section className="sparkli-menu" aria-label="Main menu">
      <div className="sparkli-menu-panel">
        <div className="sparkli-menu-brand-head" aria-hidden="true">
          <div className="sparkli-menu-rainbow" />
          <div className="sparkli-brand-strip sparkli-brand-strip-menu">
            <SparkliStarsMark className="sparkli-brand-stars" />
            <SparkliWordmark className="sparkli-wordmark" />
          </div>
        </div>

        <div className="sparkli-menu-hero">
          <div className="sparkli-menu-avatar">
            <SparkliCharacter variant="badge" />
          </div>

          <div className="sparkli-menu-copy">
            <span className="sparkli-pill">Sparkli Archive</span>
            <h2>Welcome back, Sparkli Scout</h2>
            <p>
              Plot your path, race the timer, and chase a cleaner run. Your best adventures are tracked here.
            </p>
            <p className="sparkli-menu-latest">{latestRunSummary}</p>
          </div>
        </div>

        <div className="sparkli-menu-stats">
          <article>
            <span>Best Score</span>
            <strong>{stats.bestScore.toLocaleString()}</strong>
          </article>
          <article>
            <span>Highest Level</span>
            <strong>{stats.highestLevel}</strong>
          </article>
          <article>
            <span>Total Runs</span>
            <strong>{stats.totalRuns}</strong>
          </article>
        </div>

        <div className="sparkli-menu-history">
          <div className="sparkli-menu-history-head">
            <h3>Run History</h3>
            <button type="button" className="sparkli-history-clear sparkli-hard-button" onClick={onClearStats}>
              Clear records
            </button>
          </div>

          {stats.recentRuns.length === 0 ? (
            <p className="sparkli-menu-empty">No runs recorded yet. Start your first adventure.</p>
          ) : (
            <ul>
              {stats.recentRuns.map(run => (
                <li key={run.id} className={`sparkli-run-item is-${run.result}`}>
                  <span className="sparkli-run-tag">{resultLabel[run.result]}</span>
                  <span className="sparkli-run-meta">Lv {run.level} · {run.score.toLocaleString()} pts</span>
                  <span className="sparkli-run-time">{formatPlayedAt(run.playedAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="sparkli-menu-actions">
          <button id="menu-start-button" type="button" className="sparkli-menu-start sparkli-hard-button" onClick={onStart}>
            Start New Run
          </button>
        </div>
      </div>
    </section>
  );
};

export default EntryMenu;
