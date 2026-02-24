import { canBuildWord, countLetters, normalizeWord, overlapCount, expandCounts } from "./letterSet.js";
import { createRng, pickOne, randomInt, shuffleInPlace } from "./seededRng.js";

const DIRECTIONS = ["h", "v"];
const VOWELS = ["a", "e", "i", "o", "u", "y"];
const COMMONS = ["t", "r", "n", "s", "l", "d", "m", "p"];

function keyFromXY(x, y) {
  return `${x},${y}`;
}

function getCellAt(cells, x, y) {
  return cells.get(keyFromXY(x, y));
}

function getBounds(placements) {
  if (!placements.length) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  placements.forEach((placement) => {
    for (let i = 0; i < placement.text.length; i += 1) {
      const x = placement.x + (placement.dir === "h" ? i : 0);
      const y = placement.y + (placement.dir === "v" ? i : 0);
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  });

  return { minX, minY, maxX, maxY };
}

function sideNeighborsOccupied(cells, x, y, dir) {
  if (dir === "h") {
    return Boolean(getCellAt(cells, x, y - 1) || getCellAt(cells, x, y + 1));
  }
  return Boolean(getCellAt(cells, x - 1, y) || getCellAt(cells, x + 1, y));
}

function canPlaceWord(cells, word, x, y, dir) {
  const beforeX = x - (dir === "h" ? 1 : 0);
  const beforeY = y - (dir === "v" ? 1 : 0);
  const afterX = x + (dir === "h" ? word.length : 0);
  const afterY = y + (dir === "v" ? word.length : 0);

  if (getCellAt(cells, beforeX, beforeY) || getCellAt(cells, afterX, afterY)) {
    return { ok: false, crosses: 0 };
  }

  let crosses = 0;

  for (let i = 0; i < word.length; i += 1) {
    const cx = x + (dir === "h" ? i : 0);
    const cy = y + (dir === "v" ? i : 0);
    const char = word[i];
    const existing = getCellAt(cells, cx, cy);

    if (existing) {
      if (existing.char !== char) {
        return { ok: false, crosses: 0 };
      }
      crosses += 1;
      continue;
    }

    if (sideNeighborsOccupied(cells, cx, cy, dir)) {
      return { ok: false, crosses: 0 };
    }
  }

  return { ok: true, crosses };
}

function placeWord(cells, placements, word, x, y, dir) {
  const placement = {
    id: placements.length,
    text: word,
    x,
    y,
    dir,
    solved: false
  };

  placements.push(placement);

  for (let i = 0; i < word.length; i += 1) {
    const cx = x + (dir === "h" ? i : 0);
    const cy = y + (dir === "v" ? i : 0);
    const key = keyFromXY(cx, cy);
    if (!cells.has(key)) {
      cells.set(key, { x: cx, y: cy, char: word[i], owners: [placement.id] });
    } else {
      cells.get(key).owners.push(placement.id);
    }
  }
}

function collectPlacementCandidates(cells, placements, word, rng) {
  const candidates = [];
  const cellList = Array.from(cells.values());

  cellList.forEach((cell) => {
    for (let i = 0; i < word.length; i += 1) {
      if (word[i] !== cell.char) {
        continue;
      }

      DIRECTIONS.forEach((dir) => {
        const x = cell.x - (dir === "h" ? i : 0);
        const y = cell.y - (dir === "v" ? i : 0);
        const check = canPlaceWord(cells, word, x, y, dir);

        if (!check.ok || check.crosses <= 0) {
          return;
        }

        const simulated = placements
          .map((placement) => ({ ...placement }))
          .concat({ id: placements.length, text: word, x, y, dir, solved: false });
        const bounds = getBounds(simulated);
        const area = (bounds.maxX - bounds.minX + 1) * (bounds.maxY - bounds.minY + 1);
        const score = check.crosses * 7 - area * 0.06 + rng();

        candidates.push({ x, y, dir, score });
      });
    }
  });

  candidates.sort((a, b) => b.score - a.score);
  return candidates;
}

function normalizeBoard(cells, placements) {
  const bounds = getBounds(placements);
  const shiftX = -bounds.minX;
  const shiftY = -bounds.minY;

  const words = placements.map((placement, index) => ({
    id: index,
    text: placement.text,
    x: placement.x + shiftX,
    y: placement.y + shiftY,
    dir: placement.dir,
    solved: false
  }));

  const cellEntries = [];
  cells.forEach((cell) => {
    cellEntries.push({
      x: cell.x + shiftX,
      y: cell.y + shiftY,
      char: cell.char,
      owners: cell.owners.slice()
    });
  });

  return {
    width: bounds.maxX - bounds.minX + 1,
    height: bounds.maxY - bounds.minY + 1,
    words,
    cells: cellEntries,
    solvedCount: 0
  };
}

function pickBiasWeightedEntry(entries, rng, usageMap) {
  if (!entries.length) {
    return null;
  }

  const sampleSize = Math.min(10, entries.length);
  let bestEntry = null;
  let bestScore = -Infinity;

  for (let i = 0; i < sampleSize; i += 1) {
    const idx = randomInt(rng, 0, entries.length - 1);
    const entry = entries[idx];
    const usageCount = usageMap.get(entry.word) || 0;
    const score = entry.word.length * 2 - usageCount * 5 + rng() * 1.5;
    if (score > bestScore) {
      bestScore = score;
      bestEntry = entry;
    }
  }

  return bestEntry || pickOne(rng, entries);
}

function pickWheelLetters(pool, config, rng, freshness = {}) {
  const allowedMaxLen = Math.min(config.maxWordLength, config.wheelSize);
  const seenSet = freshness.seenSet || new Set();
  const recentSet = freshness.recentSet || new Set();
  const usageMap = normalizeUsageMap(freshness.usageMap);
  const candidates = pool.filter(
    (entry) => entry.word.length >= config.minWordLength && entry.word.length <= allowedMaxLen
  );
  const unseenCandidates = candidates.filter((entry) => !seenSet.has(entry.word));
  const nonRecentCandidates = candidates.filter((entry) => !recentSet.has(entry.word));
  const requiredBuildable = Math.max(config.minBoardWords, Math.ceil(config.targetWords * 0.75));

  for (let attempt = 0; attempt < 500; attempt += 1) {
    let basePool = candidates;
    if (unseenCandidates.length && attempt < 260) {
      basePool = unseenCandidates;
    } else if (nonRecentCandidates.length && attempt < 380) {
      basePool = nonRecentCandidates;
    }

    const base = pickBiasWeightedEntry(basePool, rng, usageMap);
    if (!base) {
      break;
    }

    const letterCounts = countLetters(base.word);
    const helpers = shuffleInPlace(candidates, rng).filter(
      (entry) => entry.word !== base.word && overlapCount(entry.word, base.word) > 0
    );

    for (let i = 0; i < helpers.length && expandCounts(letterCounts).length < config.wheelSize; i += 1) {
      const helper = helpers[i];
      const helperWord = helper.word;
      if (recentSet.has(helperWord) && rng() < 0.72) {
        continue;
      }
      if (seenSet.has(helperWord) && rng() < 0.3) {
        continue;
      }

      for (let j = 0; j < helperWord.length && expandCounts(letterCounts).length < config.wheelSize; j += 1) {
        const letter = helperWord[j];
        if ((letterCounts[letter] || 0) >= config.maxLetterRepeat) {
          continue;
        }
        if (rng() > 0.72 && !letterCounts[letter]) {
          continue;
        }
        letterCounts[letter] = (letterCounts[letter] || 0) + 1;
      }
    }

    while (expandCounts(letterCounts).length < config.wheelSize) {
      const poolLetters = rng() < 0.56 ? VOWELS : COMMONS;
      const letter = pickOne(rng, poolLetters);
      if (!letter) {
        break;
      }
      if ((letterCounts[letter] || 0) >= config.maxLetterRepeat) {
        continue;
      }
      letterCounts[letter] = (letterCounts[letter] || 0) + 1;
    }

    let letters = expandCounts(letterCounts);
    shuffleInPlace(letters, rng);
    letters = letters.slice(0, config.wheelSize);

    const sourceCounts = countLetters(letters);
    const buildable = pool.filter((entry) => {
      const len = entry.word.length;
      return len >= config.minWordLength && len <= allowedMaxLen && canBuildWord(entry.word, sourceCounts);
    });

    if (buildable.length >= requiredBuildable) {
      return { letters, buildable };
    }
  }

  return null;
}

function normalizeUsageMap(wordUsage = {}) {
  const usageMap = new Map();
  if (wordUsage instanceof Map) {
    wordUsage.forEach((count, rawWord) => {
      const word = normalizeWord(rawWord);
      if (!word) {
        return;
      }
      const safeCount = Number.isFinite(Number(count)) ? Math.max(0, Math.floor(Number(count))) : 0;
      usageMap.set(word, safeCount);
    });
    return usageMap;
  }

  if (!wordUsage || typeof wordUsage !== "object") {
    return usageMap;
  }

  Object.entries(wordUsage).forEach(([rawWord, count]) => {
    const word = normalizeWord(rawWord);
    if (!word) {
      return;
    }
    const safeCount = Number.isFinite(Number(count)) ? Math.max(0, Math.floor(Number(count))) : 0;
    usageMap.set(word, safeCount);
  });

  return usageMap;
}

function getFreshnessTier(word, seenSet, recentSet) {
  if (!seenSet.has(word)) {
    return 0; // unseen
  }
  if (!recentSet.has(word)) {
    return 1; // seen but not recent
  }
  return 2; // recent reuse
}

function scoreTierCandidate(word, selectedWords, source, usageMap, rng) {
  const selectedSet = new Set(selectedWords);
  const overlapsToSelected = selectedWords.reduce((sum, current) => sum + overlapCount(word, current), 0);
  const futureCrosses = source.reduce((sum, entry) => {
    if (entry.word === word || selectedSet.has(entry.word)) {
      return sum;
    }
    return sum + (overlapCount(word, entry.word) > 0 ? 1 : 0);
  }, 0);
  const usageCount = usageMap.get(word) || 0;

  return overlapsToSelected * 9 + futureCrosses * 3 + word.length * 2 - usageCount * 11 + rng();
}

function pickBestTierCandidate(entries, selectedWords, source, usageMap, rng) {
  let bestWord = entries[0].word;
  let bestScore = -Infinity;

  entries.forEach((entry) => {
    const score = scoreTierCandidate(entry.word, selectedWords, source, usageMap, rng);
    if (score > bestScore) {
      bestScore = score;
      bestWord = entry.word;
    }
  });

  return bestWord;
}

function selectBoardWords(buildable, config, rng, freshness = {}) {
  const source = shuffleInPlace(buildable.slice(), rng);
  const selected = [];
  const targetCount = Math.min(config.targetWords, source.length);
  const seenSet = freshness.seenSet || new Set();
  const recentSet = freshness.recentSet || new Set();
  const usageMap = normalizeUsageMap(freshness.usageMap);
  let recentWordReuseBlocked = false;
  let freshnessFallbackUsed = false;
  let freshWordsUsed = 0;
  let reusedWordsUsed = 0;
  let recentWordsUsed = 0;

  while (selected.length < targetCount && source.length) {
    const crossableCandidates =
      selected.length === 0
        ? source
        : source.filter((entry) => selected.some((word) => overlapCount(entry.word, word) > 0));

    if (!crossableCandidates.length) {
      break;
    }

    const tiers = [[], [], []];
    crossableCandidates.forEach((entry) => {
      const tier = getFreshnessTier(entry.word, seenSet, recentSet);
      tiers[tier].push(entry);
    });

    let selectedTier = -1;
    for (let tier = 0; tier < tiers.length; tier += 1) {
      if (tiers[tier].length) {
        selectedTier = tier;
        break;
      }
    }

    if (selectedTier < 0) {
      break;
    }

    if (tiers[2].length > 0 && selectedTier < 2) {
      recentWordReuseBlocked = true;
    }

    if (selectedTier > 0) {
      freshnessFallbackUsed = true;
    }

    const bestWord = pickBestTierCandidate(tiers[selectedTier], selected, source, usageMap, rng);

    selected.push(bestWord);
    if (selectedTier === 0) {
      freshWordsUsed += 1;
    } else {
      reusedWordsUsed += 1;
      if (selectedTier === 2) {
        recentWordsUsed += 1;
      }
    }

    const removeAt = source.findIndex((entry) => entry.word === bestWord);
    if (removeAt >= 0) {
      source.splice(removeAt, 1);
    }
  }

  return {
    selectedWords: selected,
    recentWordReuseBlocked,
    freshnessFallbackUsed,
    freshWordsUsed,
    reusedWordsUsed,
    recentWordsUsed
  };
}

function hasConnectedComponentAtLeast(entries, minSize) {
  if (minSize <= 1) {
    return entries.length > 0;
  }
  if (!entries.length || entries.length < minSize) {
    return false;
  }

  const words = entries.map((entry) => entry.word);
  const adjacency = new Map();
  words.forEach((word) => adjacency.set(word, new Set()));

  for (let i = 0; i < words.length; i += 1) {
    for (let j = i + 1; j < words.length; j += 1) {
      if (overlapCount(words[i], words[j]) <= 0) {
        continue;
      }
      adjacency.get(words[i]).add(words[j]);
      adjacency.get(words[j]).add(words[i]);
    }
  }

  const visited = new Set();
  for (let i = 0; i < words.length; i += 1) {
    const start = words[i];
    if (visited.has(start)) {
      continue;
    }

    let componentSize = 0;
    const stack = [start];
    visited.add(start);

    while (stack.length) {
      const current = stack.pop();
      componentSize += 1;
      if (componentSize >= minSize) {
        return true;
      }
      adjacency.get(current).forEach((next) => {
        if (visited.has(next)) {
          return;
        }
        visited.add(next);
        stack.push(next);
      });
    }
  }

  return false;
}

function summarizeWordFreshness(words, seenSet, recentSet, usageMap) {
  let freshWordsUsed = 0;
  let reusedWordsUsed = 0;
  let recentWordsUsed = 0;
  let totalWordUsageInBoard = 0;
  let maxWordUsageInBoard = 0;

  words.forEach((word) => {
    const usage = usageMap.get(word) || 0;
    totalWordUsageInBoard += usage;
    maxWordUsageInBoard = Math.max(maxWordUsageInBoard, usage);
    if (!seenSet.has(word)) {
      freshWordsUsed += 1;
      return;
    }
    reusedWordsUsed += 1;
    if (recentSet.has(word)) {
      recentWordsUsed += 1;
    }
  });

  return {
    boardWordCount: words.length,
    freshWordsUsed,
    reusedWordsUsed,
    recentWordsUsed,
    usedRecentWords: recentWordsUsed,
    totalWordUsageInBoard,
    maxWordUsageInBoard
  };
}

function isFreshnessBetter(nextSummary, bestSummary) {
  if (!bestSummary) {
    return true;
  }
  if (nextSummary.freshWordsUsed !== bestSummary.freshWordsUsed) {
    return nextSummary.freshWordsUsed > bestSummary.freshWordsUsed;
  }
  if (nextSummary.reusedWordsUsed !== bestSummary.reusedWordsUsed) {
    return nextSummary.reusedWordsUsed < bestSummary.reusedWordsUsed;
  }
  if (nextSummary.recentWordsUsed !== bestSummary.recentWordsUsed) {
    return nextSummary.recentWordsUsed < bestSummary.recentWordsUsed;
  }
  if (nextSummary.maxWordUsageInBoard !== bestSummary.maxWordUsageInBoard) {
    return nextSummary.maxWordUsageInBoard < bestSummary.maxWordUsageInBoard;
  }
  if (nextSummary.totalWordUsageInBoard !== bestSummary.totalWordUsageInBoard) {
    return nextSummary.totalWordUsageInBoard < bestSummary.totalWordUsageInBoard;
  }
  if (nextSummary.boardWordCount !== bestSummary.boardWordCount) {
    return nextSummary.boardWordCount > bestSummary.boardWordCount;
  }
  return false;
}

function buildCrossword(words, minWords, rng) {
  if (!words.length) {
    return null;
  }

  const ordered = words.slice().sort((a, b) => b.length - a.length);
  const cells = new Map();
  const placements = [];

  placeWord(cells, placements, ordered[0], 0, 0, "h");

  for (let i = 1; i < ordered.length; i += 1) {
    const word = ordered[i];
    const candidates = collectPlacementCandidates(cells, placements, word, rng);
    if (!candidates.length) {
      continue;
    }

    const pick = candidates[randomInt(rng, 0, Math.min(2, candidates.length - 1))];
    placeWord(cells, placements, word, pick.x, pick.y, pick.dir);
  }

  if (placements.length < minWords) {
    return null;
  }

  return normalizeBoard(cells, placements);
}

export function generateRound({
  grade,
  roundIndex,
  sessionSalt,
  pool,
  activeThemeId = null,
  activeTheme = null,
  themeEntries = null,
  config,
  seenWords = [],
  recentWords = [],
  wordUsage = {}
}) {
  const sourcePool = Array.isArray(themeEntries)
    ? themeEntries
    : pool && Array.isArray(pool.entries)
      ? pool.entries
      : Array.isArray(pool)
        ? pool
        : [];
  if (!sourcePool.length) {
    throw new Error(`No pool entries available for grade ${grade}`);
  }

  const seedBase = `${grade}-${roundIndex}-${sessionSalt}`;
  const seenSet = new Set(seenWords.map((word) => normalizeWord(word)).filter(Boolean));
  const recentSet = new Set(recentWords.map((word) => normalizeWord(word)).filter(Boolean));
  const usageMap = normalizeUsageMap(wordUsage);
  let bestRound = null;
  let bestFreshnessSummary = null;
  let firstValidAttempt = -1;
  const improvementWindow = 24;

  for (let attempt = 0; attempt < 500; attempt += 1) {
    const seed = `${seedBase}-${attempt}`;
    const rng = createRng(seed);
    const relaxLevel = Math.floor(attempt / 140);
    const runtimeConfig = {
      ...config,
      minWordLength: Math.max(3, config.minWordLength - relaxLevel),
      targetWords: Math.max(3, config.targetWords - relaxLevel),
      minBoardWords: Math.max(3, config.minBoardWords - relaxLevel)
    };

    const wheel = pickWheelLetters(sourcePool, runtimeConfig, rng, {
      seenSet,
      recentSet,
      usageMap
    });
    if (!wheel) {
      continue;
    }

    const freshBuildable = wheel.buildable.filter((entry) => !seenSet.has(entry.word));
    const freshCrosswordAvailable = hasConnectedComponentAtLeast(freshBuildable, runtimeConfig.minBoardWords);
    const selectionSource = freshCrosswordAvailable ? freshBuildable : wheel.buildable;

    const selection = selectBoardWords(selectionSource, runtimeConfig, rng, {
      seenSet,
      recentSet,
      usageMap
    });
    const selectedWords = selection.selectedWords;
    if (selectedWords.length < runtimeConfig.minBoardWords) {
      continue;
    }

    const board = buildCrossword(selectedWords, runtimeConfig.minBoardWords, rng);
    if (!board) {
      continue;
    }

    const entryByWord = new Map();
    sourcePool.forEach((entry) => {
      const key = normalizeWord(entry.word);
      if (!key || entryByWord.has(key)) {
        return;
      }
      entryByWord.set(key, entry);
    });
    board.words = board.words.map((word) => {
      const key = normalizeWord(word.text);
      const meta = key ? entryByWord.get(key) : null;
      return {
        ...word,
        clue: String(meta?.clue || "A common everyday word."),
        labels: Array.isArray(meta?.labels) ? meta.labels.slice() : [],
        themeIds: Array.isArray(meta?.themeIds) ? meta.themeIds.slice() : [],
        primaryThemeId: String(meta?.primaryThemeId || "")
      };
    });

    if (
      activeThemeId &&
      board.words.some((word) => String(word.primaryThemeId || "") !== String(activeThemeId))
    ) {
      continue;
    }

    const boardWords = board.words.map((word) => normalizeWord(word.text));
    const freshnessSummary = summarizeWordFreshness(boardWords, seenSet, recentSet, usageMap);

    const wordLookup = {};
    board.words.forEach((word) => {
      wordLookup[word.text] = word.id;
    });

    const candidateRound = {
      seed,
      grade,
      roundIndex,
      wheelLetters: wheel.letters.map((letter) => letter.toUpperCase()),
      board,
      validWords: board.words.map((word) => word.text).sort((a, b) => a.localeCompare(b)),
      wordLookup,
      theme: activeTheme
        ? {
            id: activeTheme.id,
            title: activeTheme.title,
            description: activeTheme.description
          }
        : activeThemeId
          ? {
              id: activeThemeId,
              title: activeThemeId,
              description: ""
            }
          : null,
      wordPoolMeta: {
        gradePoolSize: Array.isArray(pool?.entries) ? pool.entries.length : Array.isArray(pool) ? pool.length : 0,
        recentWordReuseBlocked: selection.recentWordReuseBlocked,
        freshCrosswordAvailable,
        freshnessFallbackUsed: selection.freshnessFallbackUsed,
        freshWordsUsed: freshnessSummary.freshWordsUsed,
        reusedWordsUsed: freshnessSummary.reusedWordsUsed,
        recentWordsUsed: freshnessSummary.recentWordsUsed,
        usedRecentWords: freshnessSummary.usedRecentWords,
        maxWordUsageInBoard: freshnessSummary.maxWordUsageInBoard,
        totalWordUsageInBoard: freshnessSummary.totalWordUsageInBoard,
        boardWordCount: freshnessSummary.boardWordCount,
        seenWordsCount: seenSet.size,
        recentWordsCount: recentSet.size
      }
    };

    if (isFreshnessBetter(freshnessSummary, bestFreshnessSummary)) {
      bestFreshnessSummary = freshnessSummary;
      bestRound = candidateRound;
    }

    const perfectFreshRound =
      freshnessSummary.reusedWordsUsed === 0 && freshnessSummary.recentWordsUsed === 0;
    if (perfectFreshRound) {
      return candidateRound;
    }

    if (firstValidAttempt < 0) {
      firstValidAttempt = attempt;
      continue;
    }

    if (attempt - firstValidAttempt >= improvementWindow && bestRound) {
      return bestRound;
    }
  }

  if (bestRound) {
    return bestRound;
  }

  throw new Error(`Failed to generate round for grade ${grade}`);
}

export function validateGeneratedRound(round, poolSet) {
  if (!round || !round.board || !round.board.words || !round.board.cells) {
    return false;
  }

  if (!round.board.words.length || !round.board.cells.length) {
    return false;
  }

  const letterCounts = countLetters(round.wheelLetters);
  for (let i = 0; i < round.board.words.length; i += 1) {
    const word = normalizeWord(round.board.words[i].text);
    if (!poolSet.has(word) || !canBuildWord(word, letterCounts)) {
      return false;
    }
  }

  return true;
}
