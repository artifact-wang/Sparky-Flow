/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { generateLevel } from './logic/levelGenerator';
import { Point, CellType, LevelData, GameState } from './types';
import Grid from './components/Grid';
import GameOver from './components/GameOver';
import FooterLeftContent from './components/FooterLeftContent';
import EntryMenu from './components/EntryMenu';
import InfoDialog from './components/InfoDialog';
import { GAME_CONSTANTS } from './constants';
import { useKeyboardControls } from './hooks/useKeyboardControls';
import useAudio from './services/audioService';
import { getPath } from './utils/path';
import { InfoIcon, TimerIcon } from './components/Icons';
import { SparkliStarsMark, SparkliWordmark } from './components/BrandMarks';

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

const RUN_STATS_STORAGE_KEY = 'sparkli-run-stats-v1';
const DEFAULT_RUN_STATS: RunStats = {
  bestScore: 0,
  highestLevel: 0,
  totalRuns: 0,
  recentRuns: [],
};

const initialGameState: GameState = {
  path: [],
  isWon: false,
  isDragging: false,
  score: 0,
  levelStartScore: 0,
  multiplier: 1,
  treats: 0,
  collectedItems: [],
};

declare global {
  interface Window {
    render_game_to_text?: () => string;
    advanceTime?: (ms: number) => Promise<void>;
  }
}

const App: React.FC = () => {
  const [hasStarted, setHasStarted] = useState(false);
  const [timerStarted, setTimerStarted] = useState(false);
  const [levelIndex, setLevelIndex] = useState(1);
  const [gameResult, setGameResult] = useState<'win' | 'lose' | null>(null);
  const [level, setLevel] = useState<LevelData | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(GAME_CONSTANTS.INITIAL_TIME_SECONDS);
  const [stats, setStats] = useState<RunStats>(DEFAULT_RUN_STATS);
  const [isInfoOpen, setIsInfoOpen] = useState(false);

  const collectedMap = useRef<Set<string>>(new Set());
  const isTransitioningRef = useRef(false);
  const isWinProcessed = useRef(false);
  const runLoggedRef = useRef(false);

  const [gameState, setGameState] = useState<GameState>(initialGameState);

  const [timeBonuses, setTimeBonuses] = useState<{ id: number; x: number; y: number; text: string; color: string }[]>([]);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [pauseStartTime, setPauseStartTime] = useState(0);

  const isPaused = false;

  const { playForeground, preloadCache } = useAudio();
  const audioFiles = [
    getPath('/media/audio/sfx/stretchycat/backspace.mp3'),
    getPath('/media/audio/sfx/stretchycat/stretchspace.mp3'),
    getPath('/media/audio/sfx/stretchycat/YarnReward.mp3'),
    getPath('/media/audio/sfx/stretchycat/FishReward.mp3'),
    getPath('/media/audio/sfx/stretchycat/goal.mp3'),
    getPath('/media/audio/sfx/global/win.mp3'),
  ];

  useEffect(() => {
    const parent = document.getElementById('puzzle-game-container');
    if (parent) {
      parent.style.position = 'relative';
      parent.style.height = '100vh';
      parent.style.width = '100vw';
      parent.style.overflow = 'hidden';
      parent.style.display = 'block';
      parent.style.background = '#f5e9ff';
    }
  }, []);

  useEffect(() => {
    preloadCache(audioFiles);
  }, [preloadCache]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(RUN_STATS_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as RunStats;
      if (!parsed || typeof parsed !== 'object') return;
      setStats({
        bestScore: Number(parsed.bestScore) || 0,
        highestLevel: Number(parsed.highestLevel) || 0,
        totalRuns: Number(parsed.totalRuns) || 0,
        recentRuns: Array.isArray(parsed.recentRuns) ? parsed.recentRuns.slice(0, 8) : [],
      });
    } catch {
      setStats(DEFAULT_RUN_STATS);
    }
  }, []);

  const persistStats = useCallback((updater: (prev: RunStats) => RunStats) => {
    setStats(prev => {
      const next = updater(prev);
      localStorage.setItem(RUN_STATS_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const recordRun = useCallback(
    (result: RunResult, score: number, levelReached: number) => {
      persistStats(prev => {
        const run: RunRecord = {
          id: Date.now(),
          score,
          level: levelReached,
          result,
          playedAt: new Date().toISOString(),
        };

        return {
          bestScore: Math.max(prev.bestScore, score),
          highestLevel: Math.max(prev.highestLevel, levelReached),
          totalRuns: prev.totalRuns + 1,
          recentRuns: [run, ...prev.recentRuns].slice(0, 8),
        };
      });
    },
    [persistStats],
  );

  const clearStats = useCallback(() => {
    localStorage.removeItem(RUN_STATS_STORAGE_KEY);
    setStats(DEFAULT_RUN_STATS);
  }, []);

  const [isTreatActive, setIsTreatActive] = useState(true);
  const [isYarnActive, setIsYarnActive] = useState(true);
  const [levelStartTime, setLevelStartTime] = useState(0);

  useEffect(() => {
    if (isPaused) {
      if (pauseStartTime === 0) setPauseStartTime(Date.now());
    } else if (pauseStartTime > 0) {
      const diff = Date.now() - pauseStartTime;
      setLevelStartTime(prev => (prev > 0 ? prev + diff : 0));
      setPauseStartTime(0);
    }
  }, [isPaused, pauseStartTime]);

  const initLevel = useCallback(
    (index: number) => {
      setIsTransitioning(true);
      isTransitioningRef.current = true;
      isWinProcessed.current = false;
      const newLevel = generateLevel(index);
      setLevelStartTime(0);

      setTimeout(() => {
        collectedMap.current.clear();
        setLevel(newLevel);
        setIsTreatActive(true);
        setIsYarnActive(true);
        setPauseStartTime(0);
        setTimerStarted(false);
        setGameState(prev => ({
          ...prev,
          path: [newLevel.startPoint],
          isWon: false,
          isDragging: false,
          multiplier: 1,
          treats: 0,
          collectedItems: [],
        }));
        setIsTransitioning(false);
        isTransitioningRef.current = false;
      }, GAME_CONSTANTS.LEVEL_TRANSITION_TIME_MS);
    },
    [],
  );

  const startNewRun = useCallback(() => {
    runLoggedRef.current = false;
    setHasStarted(true);
    setIsInfoOpen(false);
    setGameResult(null);
    setLevelIndex(1);
    setTimeLeft(GAME_CONSTANTS.INITIAL_TIME_SECONDS);
    setTimeBonuses([]);
    collectedMap.current.clear();
    isTransitioningRef.current = false;
    isWinProcessed.current = false;
    setIsTransitioning(false);
    setTimerStarted(false);
    setLevelStartTime(0);
    setIsTreatActive(true);
    setIsYarnActive(true);
    setGameState(initialGameState);
  }, []);

  const handleFullReset = useCallback(() => {
    runLoggedRef.current = false;
    setGameResult(null);
    setTimeLeft(GAME_CONSTANTS.INITIAL_TIME_SECONDS);
    setTimeBonuses([]);
    collectedMap.current.clear();
    isWinProcessed.current = false;
    setGameState(prev => ({
      ...prev,
      score: 0,
      levelStartScore: 0,
      path: [],
      isWon: false,
      isDragging: false,
      treats: 0,
      collectedItems: [],
    }));

    if (levelIndex === 1) {
      initLevel(1);
    } else {
      setLevelIndex(1);
    }
  }, [levelIndex, initLevel]);

  const returnToMenu = useCallback(() => {
    if (hasStarted && !gameResult && (gameState.score > 0 || levelIndex > 1)) {
      recordRun('quit', gameState.score, levelIndex);
    }

    runLoggedRef.current = false;
    setHasStarted(false);
    setIsInfoOpen(false);
    setGameResult(null);
    setTimerStarted(false);
    setIsTransitioning(false);
    isTransitioningRef.current = false;
    isWinProcessed.current = false;
  }, [hasStarted, gameResult, gameState.score, levelIndex, recordRun]);

  const restartCurrentLevel = () => {
    if (!level) return;
    setIsTreatActive(true);
    setIsYarnActive(true);
    collectedMap.current.clear();
    isWinProcessed.current = false;
    setLevelStartTime(0);
    setGameState(prev => ({
      ...prev,
      path: [level.startPoint],
      isWon: false,
      isDragging: false,
      score: prev.levelStartScore,
      multiplier: 1,
      treats: 0,
      collectedItems: [],
    }));
  };

  useEffect(() => {
    if (!hasStarted || !gameResult || runLoggedRef.current) return;
    runLoggedRef.current = true;
    recordRun(gameResult, gameState.score, levelIndex);
  }, [hasStarted, gameResult, gameState.score, levelIndex, recordRun]);

  useEffect(() => {
    if (!isTreatActive || isPaused || pauseStartTime > 0 || !hasStarted || isTransitioning || gameState.isWon || !level || levelStartTime === 0) {
      return;
    }

    const totalLifetime = GAME_CONSTANTS.TREAT_MIN_LIFETIME_MS + level.targetCount * GAME_CONSTANTS.TREAT_SCALE_FACTOR_MS;
    const elapsed = Date.now() - levelStartTime;
    const remaining = totalLifetime - elapsed;

    if (remaining <= 0) {
      setIsTreatActive(false);
      return;
    }

    const timer = setTimeout(() => setIsTreatActive(false), remaining);
    return () => clearTimeout(timer);
  }, [isTreatActive, hasStarted, isTransitioning, gameState.isWon, level, levelStartTime, isPaused, pauseStartTime]);

  useEffect(() => {
    if (!isYarnActive || isPaused || pauseStartTime > 0 || !hasStarted || isTransitioning || gameState.isWon || !level || levelStartTime === 0) {
      return;
    }

    const totalLifetime = GAME_CONSTANTS.YARN_MIN_LIFETIME_MS + level.targetCount * GAME_CONSTANTS.YARN_SCALE_FACTOR_MS;
    const elapsed = Date.now() - levelStartTime;
    const remaining = totalLifetime - elapsed;

    if (remaining <= 0) {
      setIsYarnActive(false);
      return;
    }

    const timer = setTimeout(() => setIsYarnActive(false), remaining);
    return () => clearTimeout(timer);
  }, [isYarnActive, hasStarted, isTransitioning, gameState.isWon, level, levelStartTime, isPaused, pauseStartTime]);

  useEffect(() => {
    if (hasStarted && !isTransitioning && !gameState.isWon && !isPaused && !timerStarted) {
      if (gameState.path.length > 1 || (!isTreatActive && !isYarnActive)) setTimerStarted(true);
    }
  }, [isTreatActive, isYarnActive, timerStarted, hasStarted, isTransitioning, gameState.isWon, isPaused, gameState.path.length]);

  useEffect(() => {
    if (!hasStarted || isTransitioning || gameState.isWon || timeLeft === null || !timerStarted || isPaused) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev !== null && prev > 0 ? prev - 1 : prev));
    }, 1000);
    return () => clearInterval(timer);
  }, [hasStarted, isTransitioning, gameState.isWon, timeLeft, timerStarted, isPaused]);

  useEffect(() => {
    if (timeLeft === 0 && !gameState.isWon && hasStarted && !isTransitioning && !gameResult) {
      setGameResult('lose');
    }
  }, [timeLeft, gameState.isWon, hasStarted, isTransitioning, gameResult]);

  useEffect(() => {
    if (hasStarted) initLevel(levelIndex);
  }, [levelIndex, hasStarted, initLevel]);

  const handleCellInteraction = (p: Point) => {
    if (isTransitioningRef.current || isWinProcessed.current || isPaused || gameResult) return;

    if (levelStartTime === 0) {
      const last = gameState.path[gameState.path.length - 1];
      if (last) {
        const isAdjacent = Math.abs(last.x - p.x) + Math.abs(last.y - p.y) === 1;
        if (isAdjacent) setLevelStartTime(Date.now());
      }
    }

    setGameState(prev => {
      if (!level || prev.isWon || prev.path.length === 0) return prev;

      const path = prev.path;
      const last = path[path.length - 1];
      const secondLast = path[path.length - 2];

      const isAdjacent = (a: Point, b: Point) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y) === 1;
      if (!isAdjacent(last, p)) return prev;

      if (secondLast && p.x === secondLast.x && p.y === secondLast.y) {
        playForeground(getPath('/media/audio/sfx/stretchycat/backspace.mp3'));
        return {
          ...prev,
          path: path.slice(0, -1),
          score: Math.max(prev.levelStartScore, prev.score - GAME_CONSTANTS.BASE_MOVE_SCORE),
        };
      }

      const cellType = level.grid[p.y][p.x];
      const cellKey = `${p.x},${p.y}`;
      if (path.some(pt => pt.x === p.x && pt.y === p.y)) return prev;
      if ([CellType.COUCH, CellType.PLANT, CellType.BOX].includes(cellType)) return prev;
      if (cellType === CellType.WATER) {
        setTimeout(restartCurrentLevel, 0);
        return prev;
      }

      const newPath = [...path, p];
      let scoreAdd = GAME_CONSTANTS.BASE_MOVE_SCORE;
      let newTreats = prev.treats;

      if ((cellType === CellType.TREAT && isTreatActive) || (cellType === CellType.YARN && isYarnActive)) {
        if (!collectedMap.current.has(cellKey)) {
          collectedMap.current.add(cellKey);

          if (cellType === CellType.TREAT) {
            playForeground(getPath('/media/audio/sfx/stretchycat/FishReward.mp3'));
            setTimeout(() => setTimeLeft(t => (t !== null ? t + 5 : t)), 0);
            newTreats += 1;
            const bonusId = Date.now();
            setTimeBonuses(b => [...b, { id: bonusId, x: p.x, y: p.y, text: '+5s', color: 'text-white' }]);
            setTimeout(() => setTimeBonuses(b => b.filter(i => i.id !== bonusId)), 2000);
          } else {
            playForeground(getPath('/media/audio/sfx/stretchycat/YarnReward.mp3'));
            scoreAdd += GAME_CONSTANTS.YARN_SCORE_BONUS;
            const bonusId = Date.now();
            setTimeBonuses(b => [...b, { id: bonusId, x: p.x, y: p.y, text: `+${GAME_CONSTANTS.YARN_SCORE_BONUS}`, color: 'text-white' }]);
            setTimeout(() => setTimeBonuses(b => b.filter(i => i.id !== bonusId)), 2000);
          }
        }
      } else {
        playForeground(getPath('/media/audio/sfx/stretchycat/stretchspace.mp3'));
      }

      const won = newPath.length === level.targetCount && cellType === CellType.SAUCER;
      if (won && !isWinProcessed.current) {
        isWinProcessed.current = true;
        isTransitioningRef.current = true;
        setTimeBonuses([]);
        playForeground(getPath('/media/audio/sfx/stretchycat/goal.mp3'));

        setTimeout(() => {
          if (levelIndex >= GAME_CONSTANTS.TOTAL_LEVELS) {
            setGameResult('win');
            playForeground(getPath('/media/audio/sfx/global/win.mp3'));
          } else {
            setLevelIndex(idx => idx + 1);
          }
        }, 300);
      }

      return {
        ...prev,
        path: newPath,
        isWon: won,
        score: prev.score + scoreAdd,
        treats: newTreats,
        collectedItems: [...prev.collectedItems, cellKey],
      };
    });
  };

  useKeyboardControls(direction => {
    if (!hasStarted || gameResult || isTransitioning || !level || gameState.isWon || isPaused) return;
    const currentHead = gameState.path[gameState.path.length - 1];
    if (!currentHead) return;

    const newPos = {
      x: currentHead.x + direction.x,
      y: currentHead.y + direction.y,
    };

    if (newPos.x >= 0 && newPos.x < level.width && newPos.y >= 0 && newPos.y < level.height) {
      handleCellInteraction(newPos);
    }
  });

  const levelProgress = level ? Math.min(100, Math.round((gameState.path.length / level.targetCount) * 100)) : 0;
  const formattedTimer = timeLeft !== null ? `${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')}` : '--:--';

  useEffect(() => {
    window.render_game_to_text = () => {
      if (!hasStarted) {
        return JSON.stringify({
          mode: 'menu',
          records: {
            bestScore: stats.bestScore,
            highestLevel: stats.highestLevel,
            totalRuns: stats.totalRuns,
          },
        });
      }

      if (!level) {
        return JSON.stringify({ mode: 'loading' });
      }

      return JSON.stringify({
        mode: gameResult ?? (isTransitioning ? 'transition' : 'playing'),
        coordinateSystem: 'origin=(0,0) top-left, +x right, +y down',
        level: {
          id: level.id,
          width: level.width,
          height: level.height,
          targetCount: level.targetCount,
        },
        player: {
          pathLength: gameState.path.length,
          head: gameState.path[gameState.path.length - 1] ?? null,
        },
        timers: {
          timeLeft,
          timerStarted,
          treatActive: isTreatActive,
          yarnActive: isYarnActive,
        },
        score: gameState.score,
      });
    };

    window.advanceTime = async (ms: number) => {
      await new Promise(resolve => setTimeout(resolve, ms));
    };

    return () => {
      delete window.render_game_to_text;
      delete window.advanceTime;
    };
  }, [
    hasStarted,
    stats.bestScore,
    stats.highestLevel,
    stats.totalRuns,
    level,
    gameResult,
    isTransitioning,
    gameState.path,
    timeLeft,
    timerStarted,
    isTreatActive,
    isYarnActive,
    gameState.score,
  ]);

  return (
    <div
      className="sparkli-app"
      onMouseUp={() => setGameState(prev => ({ ...prev, isDragging: false }))}
      aria-label="Sparkli trail game"
    >
      <div className="sparkli-backdrop" aria-hidden="true">
        <div className="sparkli-orb sparkli-orb-left" />
        <div className="sparkli-orb sparkli-orb-right" />
        <svg className="sparkli-sparkles" viewBox="0 0 600 320" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M108 50L117 72L139 81L117 90L108 112L99 90L77 81L99 72L108 50Z" fill="#ffffff" fillOpacity="0.8" />
          <path d="M302 18L308 33L323 39L308 45L302 60L296 45L281 39L296 33L302 18Z" fill="#fff1a8" />
          <path d="M488 66L496 85L515 93L496 101L488 120L480 101L461 93L480 85L488 66Z" fill="#ffffff" fillOpacity="0.82" />
          <path d="M548 182L554 196L568 202L554 208L548 222L542 208L528 202L542 196L548 182Z" fill="#ffe4fd" />
        </svg>
      </div>

      {!hasStarted && <EntryMenu stats={stats} onStart={startNewRun} onClearStats={clearStats} />}

      {hasStarted && !level && <div className="sparkli-loading">Preparing Sparkli route...</div>}

      {hasStarted && level && (
        <>
          {gameResult && <GameOver type={gameResult} score={gameState.score} onAction={handleFullReset} />}
          {isInfoOpen && (
            <InfoDialog
              title="How to play"
              goal="Drag or use arrow keys to guide Sparkli through every walkable tile. Collect fish for bonus time and yarn for score boosts before they fade."
              goalNote="Backtrack by moving into your previous tile. Finish only when all required tiles are covered."
              onClose={() => setIsInfoOpen(false)}
            />
          )}

          <header className="sparkli-hud">
            <div className="sparkli-title-card">
              <div className="sparkli-brand-strip" aria-hidden="true">
                <SparkliStarsMark className="sparkli-brand-stars" />
                <SparkliWordmark className="sparkli-wordmark" />
              </div>
              <div className="sparkli-pill">Sparkli Mode</div>
              <h1>Sparkli Trail Quest</h1>
              <p>Fill every tile and land on the finish saucer to clear each level.</p>
            </div>

            <div className="sparkli-level-card">
              <div className="sparkli-level-head">
                <span>Level {level.id}/{GAME_CONSTANTS.TOTAL_LEVELS}</span>
                <span>{gameState.path.length}/{level.targetCount} tiles</span>
              </div>
              <div className="sparkli-progress-track" role="progressbar" aria-valuenow={levelProgress} aria-valuemin={0} aria-valuemax={100}>
                <div className="sparkli-progress-fill" style={{ width: `${levelProgress}%` }} />
              </div>
              <p className="sparkli-level-note">{level.flavor}</p>
            </div>

            <div className="sparkli-side-stack">
              {timeLeft !== null && (
                <div className="sparkli-timer-badge" aria-live="polite">
                  <TimerIcon className="sparkli-timer-icon" />
                  <div>
                    <strong>{formattedTimer}</strong>
                    <span>Time Left</span>
                  </div>
                </div>
              )}
              <button
                type="button"
                onClick={() => setIsInfoOpen(true)}
                className="sparkli-hud-icon-button sparkli-hard-icon-button"
                aria-label="Show how to play"
              >
                <InfoIcon className="sparkli-hud-icon" />
              </button>
            </div>
          </header>

          <main className="sparkli-main" aria-live="polite">
            <div className={`sparkli-grid-shell ${isTransitioning ? 'is-transitioning' : ''}`}>
              <Grid
                level={level}
                path={gameState.path}
                collectedMap={collectedMap.current}
                timeBonuses={timeBonuses}
                isTreatActive={isTreatActive}
                isYarnActive={isYarnActive}
                levelStartTime={levelStartTime}
                onCellMouseDown={p => {
                  if (!isTransitioning && !isWinProcessed.current && !isPaused) {
                    setGameState(prev => ({ ...prev, isDragging: true }));
                    handleCellInteraction(p);
                  }
                }}
                onCellMouseEnter={p => {
                  if (gameState.isDragging && !isTransitioning && !isWinProcessed.current && !isPaused) {
                    handleCellInteraction(p);
                  }
                }}
              />
            </div>
          </main>

          <footer className="sparkli-footer">
            <FooterLeftContent
              levelId={level.id}
              totalLevels={GAME_CONSTANTS.TOTAL_LEVELS}
              score={gameState.score}
              onReset={handleFullReset}
              onMenu={returnToMenu}
            />
          </footer>
        </>
      )}
    </div>
  );
};

export default App;
