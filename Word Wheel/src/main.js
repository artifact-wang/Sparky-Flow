import { AudioSystem } from "./game/audio.js";
import {
  pushTrailPoint,
  shakeWheel,
  spawnSuccessBanner,
  spawnGrandCelebration,
  spawnParticleBurst,
  spawnRipple,
  spawnWordFlyup,
  triggerAccelerationLane,
  updateEffects
} from "./game/effects.js";
import { createInputController } from "./game/input.js";
import { createGameLoop } from "./game/loop.js";
import { createRenderer } from "./game/renderer.js";
import { applyRoundResults, createRuntimeState, loadSaveState, persistSaveState } from "./game/state.js";
import { createUIOverlay } from "./game/uiOverlay.js";
import { renderGameToText } from "./debug/renderToText.js";
import { generateRound } from "./generation/boardGenerator.js";
import { getGradeConfig } from "./generation/gradeConfig.js";
import { shuffleInPlace } from "./generation/seededRng.js";
import { loadGradePool } from "./generation/wordPools.js";

const canvas = document.getElementById("game-canvas");
const ui = createUIOverlay(document);
const saveState = loadSaveState();
const state = createRuntimeState(saveState);
const audio = new AudioSystem({ muted: saveState.audioMuted });
const poolCache = new Map();
const gradeWordMemory = new Map();
const sessionRng = () => Math.random();
const urlParams = new URLSearchParams(window.location.search);
const parsedSeed = urlParams.get("seed");
let seedOverride =
  parsedSeed !== null && parsedSeed.trim() !== "" && Number.isFinite(Number(parsedSeed))
    ? Number(parsedSeed)
    : null;

const RECENT_WINDOW_BY_GRADE = {
  1: 28,
  2: 30,
  3: 34,
  4: 38,
  5: 42
};

function getGradeWordMemory(grade) {
  if (!gradeWordMemory.has(grade)) {
    gradeWordMemory.set(grade, {
      seenWords: new Set(),
      recentWords: [],
      wordUseCounts: new Map()
    });
  }
  return gradeWordMemory.get(grade);
}

function resetGradeWordMemory(grade) {
  if (!grade) {
    return;
  }

  gradeWordMemory.set(grade, {
    seenWords: new Set(),
    recentWords: [],
    wordUseCounts: new Map()
  });
}

function rememberRoundWords(grade, words) {
  if (!grade || !Array.isArray(words) || !words.length) {
    return;
  }
  const memory = getGradeWordMemory(grade);
  const windowSize = RECENT_WINDOW_BY_GRADE[grade] || 32;

  words.forEach((rawWord) => {
    const word = String(rawWord || "").toLowerCase();
    if (!word) {
      return;
    }

    memory.seenWords.add(word);
    memory.recentWords = memory.recentWords.filter((entry) => entry !== word);
    memory.recentWords.push(word);
    const nextCount = (memory.wordUseCounts.get(word) || 0) + 1;
    memory.wordUseCounts.set(word, nextCount);
  });

  if (memory.recentWords.length > windowSize) {
    memory.recentWords.splice(0, memory.recentWords.length - windowSize);
  }
}

function getRecentThemesForGrade(grade) {
  if (!grade) {
    return [];
  }
  if (!state.recentThemesByGrade[grade]) {
    state.recentThemesByGrade[grade] = [];
  }
  return state.recentThemesByGrade[grade];
}

function rememberRoundTheme(grade, themeId) {
  if (!grade || !themeId) {
    return;
  }
  const recent = getRecentThemesForGrade(grade).filter((entry) => entry !== themeId);
  recent.push(themeId);
  state.recentThemesByGrade[grade] = recent.slice(-2);
}

function randomSalt() {
  if (window.crypto && typeof window.crypto.getRandomValues === "function") {
    const bytes = new Uint32Array(1);
    window.crypto.getRandomValues(bytes);
    return bytes[0];
  }
  return Math.floor(Math.random() * 1_000_000_000);
}

let theme = {
  palette: {
    bgTop: "#fff4d8",
    bgBottom: "#dff4ff",
    panel: "#fffaf1",
    panelAlt: "#fffdf7",
    ink: "#1f2b38",
    inkSoft: "#4e6073",
    primary: "#27b8ff",
    primaryDark: "#1288e0",
    accent: "#ff5a8e",
    accentSoft: "#ffd6e5",
    warning: "#ff8d57",
    success: "#52d58a",
    tile: "#ffffff",
    tileBorder: "#253245",
    shadow: "rgba(18,29,43,0.3)"
  }
};

try {
  const themeResponse = await fetch("/src/data/uiTheme.json", { cache: "force-cache" });
  if (themeResponse.ok) {
    theme = await themeResponse.json();
  }
} catch (error) {
  console.warn("Theme load fallback used:", error);
}

const renderer = createRenderer(canvas, theme);
renderer.resize();

function getGradeFromURL() {
  const url = new URL(window.location.href);
  const value = Number(url.searchParams.get("grade"));
  return Number.isInteger(value) && value >= 1 && value <= 5 ? value : null;
}

function updateURLGrade(grade) {
  const url = new URL(window.location.href);
  if (grade) {
    url.searchParams.set("grade", String(grade));
  } else {
    url.searchParams.delete("grade");
  }
  // `seed` is a debug/testing override and should not persist for regular gameplay.
  url.searchParams.delete("seed");
  window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
}

async function getPoolForGrade(grade) {
  if (poolCache.has(grade)) {
    return poolCache.get(grade);
  }
  const pool = await loadGradePool(grade);
  poolCache.set(grade, pool);
  return pool;
}

function resetTrace() {
  state.trace.active = false;
  state.trace.indices = [];
  state.trace.points = [];
  state.trace.touchPoint = null;
  state.trace.candidateWord = "";
}

function candidateWordFromIndices(indices) {
  return indices.map((index) => state.wheel.letters[index]).join("").toLowerCase();
}

function setMode(mode) {
  state.mode = mode;
}

function syncAudioState() {
  state.saveState.audioMuted = audio.muted;
  persistSaveState(state.saveState);
  ui.setMuteButton(audio.muted);
}

function syncHud() {
  ui.updateHud(state);
  ui.updateGradeCards(state.saveState);
}

function awardStarsForRound() {
  if (state.misses === 0 && state.hintsUsedThisRound === 0) {
    return 3;
  }
  if (state.misses <= 2) {
    return 2;
  }
  return 1;
}

function buildRoundConfig(baseConfig, roundSerial) {
  const tier = Math.min(9, Math.floor(roundSerial / 3));
  const boardBoost = Math.floor(tier / 5);

  return {
    ...baseConfig,
    difficultyTier: tier,
    targetWords: Math.min(baseConfig.targetWords + boardBoost, baseConfig.targetWords + 2),
    minBoardWords: Math.min(baseConfig.minBoardWords + boardBoost, baseConfig.minBoardWords + 2),
    hintBudget: Math.max(1, baseConfig.hintBudget - Math.floor(tier / 4))
  };
}

function buildWordSequence(board) {
  if (!board || !Array.isArray(board.words)) {
    return [];
  }

  return board.words
    .slice()
    .sort((a, b) => {
      const aMidY = a.y + (a.dir === "v" ? (a.text.length - 1) * 0.5 : 0);
      const bMidY = b.y + (b.dir === "v" ? (b.text.length - 1) * 0.5 : 0);
      if (aMidY !== bMidY) {
        return aMidY - bMidY;
      }

      const aMidX = a.x + (a.dir === "h" ? (a.text.length - 1) * 0.5 : 0);
      const bMidX = b.x + (b.dir === "h" ? (b.text.length - 1) * 0.5 : 0);
      if (aMidX !== bMidX) {
        return aMidX - bMidX;
      }

      if (a.dir !== b.dir) {
        return a.dir === "h" ? -1 : 1;
      }

      return a.text.localeCompare(b.text);
    })
    .map((word) => word.text);
}

function pickHintTargetWord() {
  if (!state.board || !Array.isArray(state.board.words)) {
    return null;
  }

  const unsolved = state.board.words.filter((word) => !word.solved);
  if (!unsolved.length) {
    return null;
  }

  const randomIndex = Math.floor(sessionRng() * unsolved.length);
  return unsolved[randomIndex] || unsolved[0];
}

function useHintWord() {
  if (state.mode !== "playing" || !state.grade || !state.board) {
    return false;
  }

  if (state.hint.remaining <= 0 || state.hint.cooldownMs > 0) {
    return false;
  }

  const target = pickHintTargetWord();
  if (!target) {
    return false;
  }

  state.hint.remaining -= 1;
  state.hint.cooldownMs = Math.max(2400, 7600 - state.roundDifficultyTier * 320);
  state.hint.activeClue = target.clue || "A common everyday word.";
  state.hint.targetWordId = target.id;
  state.hintsUsedThisRound += 1;
  state.hint.revealCellKey = null;
  state.hint.revealMs = 0;
  spawnWordFlyup(
    state,
    "Clue shown!",
    renderer.getLayout().wheelCenter.x,
    renderer.getLayout().wheelCenter.y - renderer.getLayout().wheelRadius - 24,
    "#56c6ff"
  );
  audio.playHintUse();
  return true;
}

function showRoundClearModal(starGain, rewardItems = []) {
  const hintRewardTotal = rewardItems.reduce((total, reward) => total + (Number(reward?.hints) || 0), 0);
  state.modal = {
    type: "round-clear",
    title: "Round Cleared",
    body: hintRewardTotal ? `+${starGain} stars, +${hintRewardTotal} hints` : `+${starGain} stars`,
    rewards: rewardItems
  };
  ui.showModal({
    title: "Round Cleared!",
    body: hintRewardTotal
      ? `You earned ${starGain} star${starGain > 1 ? "s" : ""} and ${hintRewardTotal} extra hint${hintRewardTotal === 1 ? "" : "s"}.`
      : `You earned ${starGain} star${starGain > 1 ? "s" : ""}.`,
    primaryLabel: "Next Round",
    secondaryLabel: "Grade Menu",
    rewards: rewardItems
  });
}

function buildHintRewardSummary(rewardItems) {
  if (!Array.isArray(rewardItems) || !rewardItems.length) {
    return "No bonus hints this time.";
  }
  const labels = rewardItems.map((reward) => `${reward.title}: +${reward.hints} hint${reward.hints === 1 ? "" : "s"}`);
  return labels.join(" • ");
}

function showRoundPreview({ type, title, body, payload = {} }) {
  state.pendingRoundPanel = {
    type,
    ...payload
  };
  ui.showRoundPreview({
    title,
    body,
    nextLabel: "Next"
  });
}

function saveProgress() {
  persistSaveState(state.saveState);
  syncHud();
}

function openPendingRoundPanel() {
  if (!state.pendingRoundPanel) {
    return;
  }

  const pending = state.pendingRoundPanel;
  state.pendingRoundPanel = null;
  ui.hideRoundPreview();

  if (pending.type === "round-clear") {
    showRoundClearModal(pending.starGain, pending.rewardItems || []);
  }
}

function animateSolvedWordCells(word, revealKind = "solve") {
  if (!state.board || !word) {
    return;
  }

  for (let i = 0; i < word.text.length; i += 1) {
    const cx = word.x + (word.dir === "h" ? i : 0);
    const cy = word.y + (word.dir === "v" ? i : 0);
    const cell = state.board.cells.find((entry) => entry.x === cx && entry.y === cy);
    if (!cell) {
      continue;
    }
    cell.revealDelayMs = i * 70;
    cell.revealMs = 340;
    cell.revealMaxMs = 340;
    cell.revealKind = revealKind;
  }
}

function solveWord(wordId, options = {}) {
  const { fromHint = false } = options;
  const boardWord = state.board.words[wordId];
  if (!boardWord || boardWord.solved) {
    return;
  }

  const config = state.roundConfig || getGradeConfig(state.grade);
  boardWord.solved = true;
  state.board.solvedCount += 1;
  state.wordSequenceIndex = state.board.solvedCount;
  state.currentGoalWord = null;
  animateSolvedWordCells(boardWord, fromHint ? "hint" : "solve");
  if (state.hint.targetWordId === boardWord.id) {
    state.hint.targetWordId = null;
    state.hint.activeClue = "";
  }

  const basePoints = config.scoreBase + boardWord.text.length * config.wordLengthBonus + state.combo * 2;
  const points = fromHint ? Math.max(3, Math.floor(basePoints * 0.4)) : basePoints;
  state.score += points;
  if (fromHint) {
    state.combo = 0;
    state.streak = 0;
  } else {
    state.combo += 1;
    state.streak += 1;
  }

  const center = renderer.getWordCenter(wordId, state) || renderer.getLayout().wheelCenter;
  const layout = renderer.getLayout();
  if (fromHint) {
    spawnParticleBurst(state, center.x, center.y, "rgba(110, 192, 255, 0.88)", 24);
    spawnGrandCelebration(state, center, layout.boardPanel, 0.9);
    spawnRipple(state, {
      x: center.x,
      y: center.y,
      color: "rgba(103, 179, 255, 0.72)",
      startRadius: 10,
      endRadius: 140,
      width: 5
    });
    spawnSuccessBanner(state, {
      text: "Smart Hint!",
      color: "#56c6ff",
      accent: "#d9f5ff",
      life: 900,
      scale: 0.95
    });
    shakeWheel(state, 0.55);
    audio.playHintUse();
  } else {
    const celebrationWords = ["Nice!", "Great!", "Awesome!", "Brilliant!", "Super Star!"];
    const celebrationText =
      celebrationWords[Math.min(celebrationWords.length - 1, Math.max(0, state.combo - 1))];

    spawnParticleBurst(state, center.x, center.y, "#ff8ec7", 40);
    spawnGrandCelebration(state, center, layout.boardPanel, Math.min(3.5, 1.35 + state.combo * 0.35));
    spawnRipple(state, {
      x: center.x,
      y: center.y,
      color: "rgba(255, 120, 180, 0.72)",
      startRadius: 10,
      endRadius: 150,
      width: 6
    });
    spawnRipple(state, {
      x: center.x,
      y: center.y,
      color: "rgba(255, 255, 255, 0.62)",
      startRadius: 12,
      endRadius: 95,
      width: 3,
      life: 460
    });
    spawnSuccessBanner(state, {
      text: celebrationText,
      color: "#ff4fa3",
      accent: "#ffd85e",
      life: 980,
      scale: Math.min(1.2, 0.95 + state.combo * 0.06)
    });
    spawnWordFlyup(state, `+${points}`, center.x, center.y - 10, "#ff4fa3");
    triggerAccelerationLane(state, 1 + state.combo * 0.08);
    shakeWheel(state, 1 + state.combo * 0.12);
    audio.playWordSolve(state.combo);
  }

  if (!fromHint && state.combo >= 3) {
    spawnWordFlyup(state, "Combo!", center.x, center.y - 48, "#35aef0");
    spawnRipple(state, {
      x: renderer.getLayout().wheelCenter.x,
      y: renderer.getLayout().wheelCenter.y,
      color: "rgba(87, 215, 255, 0.5)",
      startRadius: 18,
      endRadius: renderer.getLayout().wheelRadius + 56,
      width: 5
    });
    audio.playComboBonus(state.combo);
  }

  if (state.board.solvedCount >= state.board.words.length) {
    rememberRoundWords(
      state.grade,
      state.board.words.map((word) => word.text)
    );

    const rewardItems = [];
    const hiddenSpeedHintReward = state.roundElapsedMs <= 30000 ? 3 : state.roundElapsedMs <= 60000 ? 1 : 0;
    if (hiddenSpeedHintReward > 0) {
      rewardItems.push({
        title: state.roundElapsedMs <= 30000 ? "Lightning Finish" : "Fast Finish",
        hints: hiddenSpeedHintReward,
        tone: "speed"
      });
      spawnSuccessBanner(state, {
        text: `Speed +${hiddenSpeedHintReward} Hints`,
        color: "#4fbfff",
        accent: "#e1f6ff",
        life: 1280,
        scale: 1.02
      });
    }

    const flawlessRound = state.misses === 0;
    if (flawlessRound) {
      rewardItems.push({
        title: "Flawless Round",
        hints: 2,
        tone: "flawless"
      });
      spawnSuccessBanner(state, {
        text: "Flawless +2 Hints!",
        color: "#ff74b8",
        accent: "#fff0a8",
        life: 1440,
        scale: 1.12
      });
      audio.playPerfectRound();
    }

    const hintReward = rewardItems.reduce((total, reward) => total + (Number(reward.hints) || 0), 0);
    if (hintReward > 0) {
      state.hint.remaining += hintReward;
      spawnParticleBurst(state, layout.wheelCenter.x, layout.wheelCenter.y, "rgba(255, 245, 188, 0.86)", 26);
      spawnRipple(state, {
        x: layout.wheelCenter.x,
        y: layout.wheelCenter.y,
        color: "rgba(255, 229, 130, 0.68)",
        startRadius: 18,
        endRadius: layout.wheelRadius + 120,
        width: 6,
        life: 760
      });
    }

    state.roundClearRewards = rewardItems;
    const starGain = awardStarsForRound();
    spawnSuccessBanner(state, {
      text: "Round Cleared!",
      color: "#ff4fa3",
      accent: "#ffe07b",
      life: 1500,
      scale: 1.35
    });
    spawnGrandCelebration(
      state,
      { x: layout.width * 0.5, y: layout.boardPanel.y + 52 },
      { x: 0, y: layout.boardPanel.y, width: layout.width, height: layout.height - layout.boardPanel.y },
      4.4
    );
    applyRoundResults({ state, starGain });
    saveProgress();
    state.wheel.roundClearSpin = true;
    state.wheel.spinVelocity = 11.2;
    state.wheel.glow = Math.max(1.2, state.wheel.glow);
    setMode("round-clear");
    audio.playRoundClear();
    showRoundPreview({
      type: "round-clear",
      title: "Round Cleared!",
      body: buildHintRewardSummary(rewardItems),
      payload: {
        starGain,
        rewardItems
      }
    });
  }
}

function rejectWord(message = "Try again") {
  state.combo = 0;
  state.streak = 0;
  state.misses += 1;
  audio.playInvalidWord();
  const center = renderer.getLayout().wheelCenter;
  spawnRipple(state, { x: center.x, y: center.y, color: "rgba(255, 117, 117, 0.55)", startRadius: 8, endRadius: 80, width: 4, life: 380 });
  spawnWordFlyup(
    state,
    message,
    center.x,
    center.y - renderer.getLayout().wheelRadius - 28,
    theme.palette.warning
  );
}

function submitTraceWord() {
  const word = state.trace.candidateWord;
  if (!word || state.mode !== "playing" || !state.round) {
    return;
  }

  const activeConfig = state.roundConfig || getGradeConfig(state.grade);
  if (word.length < activeConfig.minWordLength) {
    rejectWord();
    return;
  }

  const wordId = state.round.wordLookup[word];
  if (wordId === undefined) {
    rejectWord();
    return;
  }

  if (state.board.words[wordId].solved) {
    rejectWord();
    return;
  }

  solveWord(wordId);
}

function shuffleWheel() {
  if (state.mode !== "playing") {
    return;
  }
  shuffleInPlace(state.wheel.letters, sessionRng);
  shakeWheel(state, 0.45);
  audio.playShuffle();
}

function emitRoundClearWheelSparkles() {
  if (!state.wheel.roundClearSpin) {
    return;
  }

  const layout = renderer.getLayout();
  const burstCount = 3 + (sessionRng() > 0.58 ? 1 : 0);

  for (let i = 0; i < burstCount; i += 1) {
    const orbit = state.wheel.angleOffset * 2.8 + i * 1.15 + sessionRng() * 0.9;
    const radius = layout.wheelRadius + 18 + sessionRng() * 46;
    const x = layout.wheelCenter.x + Math.cos(orbit) * radius;
    const y = layout.wheelCenter.y + Math.sin(orbit) * radius;
    pushTrailPoint(state, x, y, {
      burstMin: 3,
      burstMax: 5,
      speedMin: 24,
      speedMax: 108,
      sizeMin: 5.8,
      sizeMax: 11.2,
      lifeMin: 2400,
      lifeMax: 3600,
      maxLife: 3800,
      lift: -10,
      spinRange: 12,
      trailCap: 420
    });

    if (sessionRng() > 0.38) {
      const hue = Math.floor(sessionRng() * 360);
      spawnParticleBurst(state, x, y, `hsla(${hue}, 94%, 68%, 0.92)`, 2 + Math.floor(sessionRng() * 2));
    }
  }

  const centerBursts = 1 + (sessionRng() > 0.42 ? 1 : 0);
  const centerSpreadScale = 4;
  for (let i = 0; i < centerBursts; i += 1) {
    const jitterX = (sessionRng() - 0.5) * 14 * centerSpreadScale;
    const jitterY = (sessionRng() - 0.5) * 14 * centerSpreadScale;
    const cx = layout.wheelCenter.x + jitterX;
    const cy = layout.wheelCenter.y + jitterY;
    pushTrailPoint(state, cx, cy, {
      burstMin: 5,
      burstMax: 9,
      speedMin: 86 * centerSpreadScale,
      speedMax: 240 * centerSpreadScale,
      sizeMin: 8.2,
      sizeMax: 14.8,
      lifeMin: 1800,
      lifeMax: 3000,
      maxLife: 3200,
      lift: -5,
      spinRange: 18,
      trailCap: 420,
      hueMin: 0,
      hueMax: 359,
      saturation: 98,
      lightness: 84,
      alphaBoost: 1.45
    });

    if (sessionRng() > 0.12) {
      const brightTone = sessionRng() > 0.5 ? "rgba(255, 255, 240, 0.96)" : "rgba(255, 246, 179, 0.96)";
      spawnParticleBurst(state, cx, cy, brightTone, 4 + Math.floor(sessionRng() * 3));
    }
  }
}

function beginTrace(nodeIndex, point) {
  if (state.mode !== "playing") {
    return;
  }
  if (nodeIndex < 0 || nodeIndex >= state.wheel.letters.length) {
    return;
  }

  state.trace.active = true;
  state.trace.indices = [nodeIndex];
  state.trace.points = [point];
  state.trace.touchPoint = point;
  state.trace.candidateWord = candidateWordFromIndices(state.trace.indices);
  pushTrailPoint(state, point.x, point.y);
  audio.playTraceStart();
}

function appendTrace(nodeIndex, point) {
  if (!state.trace.active || state.mode !== "playing") {
    return;
  }

  const last = state.trace.indices[state.trace.indices.length - 1];
  if (nodeIndex === last) {
    state.trace.points.push(point);
    state.trace.touchPoint = point;
    pushTrailPoint(state, point.x, point.y);
    return;
  }

  if (state.trace.indices.includes(nodeIndex)) {
    return;
  }

  state.trace.indices.push(nodeIndex);
  state.trace.points.push(point);
  state.trace.touchPoint = point;
  state.trace.candidateWord = candidateWordFromIndices(state.trace.indices);
  pushTrailPoint(state, point.x, point.y);
  audio.playTraceAppend();
}

function traceMove(point) {
  if (!state.trace.active) {
    return;
  }
  state.trace.points.push(point);
  state.trace.touchPoint = point;
  if (state.trace.points.length > 80) {
    state.trace.points.shift();
  }
  pushTrailPoint(state, point.x, point.y);
}

function endTrace() {
  if (!state.trace.active) {
    return;
  }
  submitTraceWord();
  resetTrace();
}

function appendKeyboardLetter(letter) {
  if (state.mode !== "playing") {
    return;
  }

  const upper = String(letter || "").toUpperCase();
  const index = state.wheel.letters.findIndex(
    (current, idx) => current === upper && !state.trace.indices.includes(idx)
  );

  if (index < 0) {
    return;
  }

  if (!state.trace.active) {
    state.trace.active = true;
    state.trace.indices = [];
    state.trace.points = [];
    state.trace.candidateWord = "";
  }

  state.trace.indices.push(index);
  state.trace.candidateWord = candidateWordFromIndices(state.trace.indices);
  const node = renderer.getLayout().wheelNodes[index];
  if (node) {
    state.trace.points.push({ x: node.x, y: node.y });
    state.trace.touchPoint = { x: node.x, y: node.y };
    pushTrailPoint(state, node.x, node.y);
  }
  audio.playTraceAppend();
}

function removeLastTraceLetter() {
  if (!state.trace.active || !state.trace.indices.length) {
    return;
  }
  state.trace.indices.pop();
  state.trace.points.pop();
  state.trace.candidateWord = candidateWordFromIndices(state.trace.indices);
  if (!state.trace.indices.length) {
    resetTrace();
  }
}

function listEligibleThemes(pool, config, grade) {
  if (!pool || !Array.isArray(pool.themes) || !(pool.themeIndex instanceof Map)) {
    return [];
  }

  const minThemeWords = Math.max(18, config.targetWords * 4);
  const recentThemes = new Set(getRecentThemesForGrade(grade));
  const eligibleRaw = pool.themes.filter((themeEntry) => {
    const entries = pool.themeIndex.get(themeEntry.id) || [];
    return entries.length >= minThemeWords;
  });
  const preferred = eligibleRaw.filter((themeEntry) => themeEntry.id !== "everyday-life");
  const eligible = preferred.length ? preferred : eligibleRaw;

  eligible.sort((a, b) => {
    const aRecent = recentThemes.has(a.id) ? 1 : 0;
    const bRecent = recentThemes.has(b.id) ? 1 : 0;
    if (aRecent !== bRecent) {
      return aRecent - bRecent;
    }
    return a.title.localeCompare(b.title);
  });

  return eligible;
}

async function startRound() {
  if (!state.grade) {
    return;
  }

  const baseConfig = getGradeConfig(state.grade);
  const config = buildRoundConfig(baseConfig, state.roundSerial);
  const pool = await getPoolForGrade(state.grade);
  const gradeMemory = getGradeWordMemory(state.grade);
  const roundIndex = state.roundSerial;
  state.roundSerial += 1;

  const themeCandidates = listEligibleThemes(pool, config, state.grade);
  let round = null;
  let selectedTheme = null;
  let selectedThemeEntries = null;

  for (let i = 0; i < themeCandidates.length; i += 1) {
    const candidateTheme = themeCandidates[i];
    const candidateEntries = pool.themeIndex.get(candidateTheme.id) || [];
    try {
      round = generateRound({
        grade: state.grade,
        roundIndex,
        sessionSalt: state.sessionSalt,
        pool,
        activeThemeId: candidateTheme.id,
        activeTheme: candidateTheme,
        themeEntries: candidateEntries,
        config,
        seenWords: Array.from(gradeMemory.seenWords),
        recentWords: gradeMemory.recentWords,
        wordUsage: Object.fromEntries(gradeMemory.wordUseCounts)
      });
      selectedTheme = candidateTheme;
      selectedThemeEntries = candidateEntries;
      break;
    } catch (error) {
      // Try the next candidate theme before falling back to the full pool.
    }
  }

  if (!round) {
    const fallbackTheme =
      pool.themes.find((themeEntry) => themeEntry.id === "everyday-life") || pool.themes[0] || null;
    const fallbackEntries =
      (fallbackTheme && (pool.themeIndex.get(fallbackTheme.id) || []).length
        ? pool.themeIndex.get(fallbackTheme.id)
        : pool.entries) || [];
    round = generateRound({
      grade: state.grade,
      roundIndex,
      sessionSalt: state.sessionSalt,
      pool,
      activeThemeId: fallbackTheme?.id || null,
      activeTheme: fallbackTheme,
      themeEntries: fallbackEntries,
      config,
      seenWords: Array.from(gradeMemory.seenWords),
      recentWords: gradeMemory.recentWords,
      wordUsage: Object.fromEntries(gradeMemory.wordUseCounts)
    });
    selectedTheme = fallbackTheme;
    selectedThemeEntries = fallbackEntries;
  }

  state.roundIndex = round.roundIndex;
  state.round = round;
  state.roundConfig = config;
  state.roundDifficultyTier = config.difficultyTier || 0;
  state.activeTheme = round.theme || selectedTheme;
  if (state.activeTheme?.id) {
    rememberRoundTheme(state.grade, state.activeTheme.id);
  }
  state.board = round.board;
  state.board.revealAllAnswers = false;
  state.roundWordPoolMeta = {
    gradePoolSize: pool.entries.length,
    recentWordReuseBlocked: false,
    freshCrosswordAvailable: false,
    freshnessFallbackUsed: false,
    freshWordsUsed: 0,
    reusedWordsUsed: 0,
    recentWordsUsed: 0,
    maxWordUsageInBoard: 0,
    seenWordsCount: gradeMemory.seenWords.size,
    recentWordsCount: gradeMemory.recentWords.length,
    usedRecentWords: 0,
    selectedThemeId: state.activeTheme?.id || null,
    selectedThemeWordCount: Array.isArray(selectedThemeEntries) ? selectedThemeEntries.length : 0,
    ...round.wordPoolMeta
  };
  state.wordSequence = buildWordSequence(state.board);
  state.wordSequenceIndex = 0;
  state.currentGoalWord = null;
  state.roundElapsedMs = 0;
  state.hintsUsedThisRound = 0;
  state.wheel.letters = round.wheelLetters.slice();
  state.wheel.roundClearSpin = false;
  state.wheel.spinVelocity = 0;
  state.wheel.glow = 0;
  state.wheel.centerPulse = 0;
  if (roundIndex === 0) {
    state.hint.remaining = config.hintBudget;
  } else {
    state.hint.remaining = Math.max(0, state.hint.remaining);
  }
  state.hint.cooldownMs = 0;
  state.hint.revealCellKey = null;
  state.hint.revealMs = 0;
  state.hint.activeClue = "";
  state.hint.targetWordId = null;
  state.roundClearRewards = [];
  state.pendingRoundPanel = null;
  state.misses = 0;
  state.combo = 0;
  if (state.board) {
    state.board.revealAllAnswers = false;
  }
  resetTrace();

  ui.hideRoundPreview();
  ui.hideModal();
  state.modal = null;
  setMode("playing");
  syncHud();
}

async function startGrade(grade) {
  if (!Number.isInteger(grade) || grade < 1 || grade > 5) {
    return;
  }

  resetGradeWordMemory(grade);
  state.grade = grade;
  state.score = 0;
  state.streak = 0;
  state.combo = 0;
  state.roundConfig = null;
  state.roundDifficultyTier = 0;
  state.activeTheme = null;
  state.wordSequence = [];
  state.wordSequenceIndex = 0;
  state.currentGoalWord = null;
  state.roundElapsedMs = 0;
  state.hintsUsedThisRound = 0;
  state.roundWordPoolMeta = {
    gradePoolSize: 0,
    recentWordReuseBlocked: false,
    freshCrosswordAvailable: false,
    freshnessFallbackUsed: false,
    freshWordsUsed: 0,
    reusedWordsUsed: 0,
    recentWordsUsed: 0,
    maxWordUsageInBoard: 0,
    seenWordsCount: 0,
    recentWordsCount: 0,
    usedRecentWords: 0
  };
  state.wheel.roundClearSpin = false;
  state.pendingRoundPanel = null;
  state.recentThemesByGrade[grade] = [];
  const oneTimeSeed = seedOverride;
  seedOverride = null;
  state.sessionSalt = Number.isFinite(oneTimeSeed) ? oneTimeSeed : randomSalt();
  state.roundSerial = 0;
  state.saveState.lastGrade = grade;

  ui.hideMenu();
  ui.setHudVisible(true);
  updateURLGrade(grade);
  saveProgress();

  await startRound();
}

async function restartRound() {
  if (!state.grade) {
    return;
  }
  setMode("loading");
  await startRound();
}

async function restartGrade() {
  if (!state.grade) {
    return;
  }
  setMode("loading");
  await startGrade(state.grade);
}

function goHome() {
  setMode("menu");
  state.grade = null;
  state.round = null;
  state.board = null;
  state.activeTheme = null;
  state.wordSequence = [];
  state.wordSequenceIndex = 0;
  state.currentGoalWord = null;
  state.roundElapsedMs = 0;
  state.hintsUsedThisRound = 0;
  state.wheel.roundClearSpin = false;
  state.wheel.spinVelocity = 0;
  state.pendingRoundPanel = null;
  state.hint.activeClue = "";
  state.hint.targetWordId = null;
  resetTrace();
  ui.showMenu();
  ui.hideRoundPreview();
  ui.hideModal();
  ui.setHudVisible(false);
  updateURLGrade(null);
  syncHud();
}

ui.bind({
  onPickGrade: (grade) => startGrade(grade),
  onRestart: () => restartGrade(),
  onHome: () => goHome(),
  onUseHint: async () => {
    await audio.resume();
    useHintWord();
  },
  onToggleMute: async () => {
    await audio.resume();
    const muted = audio.toggleMuted();
    state.saveState.audioMuted = muted;
    syncAudioState();
  },
  onRoundPreviewNext: () => {
    openPendingRoundPanel();
  },
  onModalPrimary: async () => {
    if (!state.modal) {
      return;
    }
    if (state.modal.type === "round-clear") {
      await startRound();
    }
  },
  onModalSecondary: () => {
    goHome();
  }
});

const input = createInputController({
  canvas,
  getLayout: () => renderer.getLayout(),
  onInteraction: () => {
    audio.resume();
  },
  onTraceStart: beginTrace,
  onTraceAppend: appendTrace,
  onTraceMove: traceMove,
  onTraceEnd: endTrace,
  onShuffle: shuffleWheel
});

const loop = createGameLoop((dtMs) => {
  if (state.mode === "playing") {
    state.roundElapsedMs += dtMs;
    audio.setMusicIntensity(Math.min(1, state.combo / 7));
  } else {
    audio.setMusicIntensity(0.1);
  }

  if (sessionRng() > 0.9) {
    const layout = renderer.getLayout();
    const area = sessionRng() > 0.5 ? layout.boardPanel : layout.wheelPanel;
    spawnParticleBurst(
      state,
      area.x + sessionRng() * area.width,
      area.y + sessionRng() * area.height,
      sessionRng() > 0.5 ? "rgba(255,255,255,0.85)" : "rgba(147,230,255,0.78)",
      1
    );
  }

  if (state.mode === "round-clear") {
    emitRoundClearWheelSparkles();
  }

  updateEffects(state, dtMs);
  syncHud();
}, () => {
  renderer.render(state);
});

window.addEventListener("resize", () => {
  renderer.resize();
});

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();

  if (key === "f") {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
    return;
  }

  if (state.mode !== "playing") {
    return;
  }

  if (/^[a-z]$/.test(key)) {
    appendKeyboardLetter(key);
    event.preventDefault();
    return;
  }

  if (event.key === "Backspace") {
    removeLastTraceLetter();
    event.preventDefault();
    return;
  }

  if (event.key === "Enter") {
    if (state.trace.indices.length) {
      submitTraceWord();
      resetTrace();
    }
    event.preventDefault();
    return;
  }

  if (event.key === " ") {
    shuffleWheel();
    event.preventDefault();
  }
});

window.addEventListener("beforeunload", () => {
  input.destroy();
  audio.destroy();
});

window.render_game_to_text = () => renderGameToText(state);
window.__sparky = {
  startGrade,
  restartRound,
  restartGrade,
  toggleMute: async () => {
    await audio.resume();
    const muted = audio.toggleMuted();
    state.saveState.audioMuted = muted;
    syncAudioState();
    return muted;
  }
};

window.advanceTime = (ms) => {
  loop.advanceBy(ms);
};

ui.setMuteButton(saveState.audioMuted);
ui.updateGradeCards(saveState);

const initialGrade = getGradeFromURL();
if (initialGrade) {
  ui.setHudVisible(true);
  startGrade(initialGrade);
} else {
  ui.setHudVisible(false);
  ui.showMenu();
}

loop.start();
