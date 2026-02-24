export const SAVE_KEY = "sparky_word_sprint_v1";

const GRADE_KEYS = [1, 2, 3, 4, 5];

function defaultGradeStats() {
  const stats = {};
  GRADE_KEYS.forEach((grade) => {
    stats[grade] = {
      roundsCompleted: 0,
      maxRound: 0,
      stars: 0,
      bestStreak: 0,
      bestScore: 0
    };
  });
  return stats;
}

export function createDefaultSaveState() {
  return {
    gradeStats: defaultGradeStats(),
    stars: 0,
    bestStreak: 0,
    audioMuted: false,
    lastGrade: null
  };
}

function sanitizeSaveState(raw) {
  const fallback = createDefaultSaveState();
  if (!raw || typeof raw !== "object") {
    return fallback;
  }

  const next = {
    ...fallback,
    ...raw,
    gradeStats: defaultGradeStats()
  };

  GRADE_KEYS.forEach((grade) => {
    const source = raw.gradeStats && raw.gradeStats[grade] ? raw.gradeStats[grade] : {};
    next.gradeStats[grade] = {
      roundsCompleted: Number(source.roundsCompleted) || 0,
      maxRound: Math.max(0, Number(source.maxRound) || Number(source.roundsCompleted) || 0),
      stars: Number(source.stars) || 0,
      bestStreak: Number(source.bestStreak) || 0,
      bestScore: Number(source.bestScore) || 0
    };
  });

  next.stars = Number(next.stars) || 0;
  next.bestStreak = Number(next.bestStreak) || 0;
  next.audioMuted = Boolean(next.audioMuted);
  next.lastGrade = GRADE_KEYS.includes(Number(next.lastGrade)) ? Number(next.lastGrade) : null;

  return next;
}

export function loadSaveState() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) {
      return createDefaultSaveState();
    }
    return sanitizeSaveState(JSON.parse(raw));
  } catch (error) {
    console.warn("Failed to load save state:", error);
    return createDefaultSaveState();
  }
}

export function persistSaveState(saveState) {
  localStorage.setItem(SAVE_KEY, JSON.stringify(saveState));
}

export function createRuntimeState(saveState) {
  return {
    mode: "menu",
    modal: null,
    grade: null,
    roundIndex: 0,
    roundSerial: 0,
    sessionSalt: Math.floor(Math.random() * 1_000_000_000),
    round: null,
    roundConfig: null,
    roundDifficultyTier: 0,
    activeTheme: null,
    recentThemesByGrade: {},
    wordSequence: [],
    wordSequenceIndex: 0,
    currentGoalWord: null,
    roundElapsedMs: 0,
    hintsUsedThisRound: 0,
    roundWordPoolMeta: {
      gradePoolSize: 0,
      recentWordReuseBlocked: false,
      seenWordsCount: 0,
      recentWordsCount: 0,
      usedRecentWords: 0
    },
    board: null,
    score: 0,
    stars: saveState.stars,
    streak: 0,
    combo: 0,
    misses: 0,
    wheel: {
      letters: [],
      angleOffset: 0,
      spinVelocity: 0,
      roundClearSpin: false,
      glow: 0,
      centerPulse: 0
    },
    trace: {
      active: false,
      indices: [],
      points: [],
      touchPoint: null,
      candidateWord: ""
    },
    hint: {
      remaining: 0,
      cooldownMs: 0,
      revealCellKey: null,
      revealMs: 0,
      activeClue: "",
      targetWordId: null
    },
    roundClearRewards: [],
    pendingRoundPanel: null,
    effects: {
      particles: [],
      trail: [],
      flyups: [],
      ripples: [],
      celebrations: [],
      laneBoost: 0,
      lanePhase: 0,
      successPulse: 0
    },
    saveState
  };
}

export function ensureGradeStats(saveState, grade) {
  if (!saveState.gradeStats[grade]) {
    saveState.gradeStats[grade] = {
      roundsCompleted: 0,
      maxRound: 0,
      stars: 0,
      bestStreak: 0,
      bestScore: 0
    };
  }
  return saveState.gradeStats[grade];
}

export function applyRoundResults({ state, starGain }) {
  if (!state.grade) {
    return;
  }

  const gradeStats = ensureGradeStats(state.saveState, state.grade);
  gradeStats.roundsCompleted += 1;
  gradeStats.maxRound = Math.max(gradeStats.maxRound || 0, state.roundIndex + 1);
  gradeStats.stars += starGain;
  gradeStats.bestStreak = Math.max(gradeStats.bestStreak, state.streak);
  gradeStats.bestScore = Math.max(gradeStats.bestScore, state.score);

  state.saveState.stars += starGain;
  state.saveState.bestStreak = Math.max(state.saveState.bestStreak, state.streak);
  state.saveState.lastGrade = state.grade;
  state.stars = state.saveState.stars;
}
