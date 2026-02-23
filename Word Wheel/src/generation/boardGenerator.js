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

function pickWheelLetters(pool, config, rng) {
  const allowedMaxLen = Math.min(config.maxWordLength, config.wheelSize);
  const candidates = pool.filter(
    (entry) => entry.word.length >= config.minWordLength && entry.word.length <= allowedMaxLen
  );
  const requiredBuildable = Math.max(config.minBoardWords, Math.ceil(config.targetWords * 0.75));

  for (let attempt = 0; attempt < 500; attempt += 1) {
    const base = pickOne(rng, candidates);
    if (!base) {
      break;
    }

    const letterCounts = countLetters(base.word);
    const helpers = shuffleInPlace(
      candidates.filter((entry) => entry.word !== base.word && overlapCount(entry.word, base.word) > 0),
      rng
    );

    for (let i = 0; i < helpers.length && expandCounts(letterCounts).length < config.wheelSize; i += 1) {
      const helperWord = helpers[i].word;
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

function scoreWordSelection(word, selected, rng, seenSet, recentSet) {
  if (!selected.length) {
    const firstUnseenBonus = seenSet.has(word) ? 0 : 12;
    const firstRecentPenalty = recentSet.has(word) ? 16 : 0;
    return word.length * 8 + firstUnseenBonus - firstRecentPenalty + rng() * 2;
  }

  const overlaps = selected.reduce((sum, current) => sum + overlapCount(word, current), 0);
  const unseenBonus = seenSet.has(word) ? 0 : 10;
  const recentPenalty = recentSet.has(word) ? 14 : 0;
  return word.length * 5 + overlaps * 4 + unseenBonus - recentPenalty + rng() * 1.5;
}

function selectBoardWords(buildable, config, rng, freshness = {}) {
  const source = shuffleInPlace(buildable.slice(), rng);
  const selected = [];
  const targetCount = Math.min(config.targetWords, source.length);
  const seenSet = freshness.seenSet || new Set();
  const recentSet = freshness.recentSet || new Set();
  let recentWordReuseBlocked = false;

  while (selected.length < targetCount && source.length) {
    const candidates =
      selected.length === 0
        ? source
        : source.filter((entry) => selected.some((word) => overlapCount(entry.word, word) > 0));

    if (!candidates.length) {
      break;
    }

    const nonRecentCandidates = candidates.filter((entry) => !recentSet.has(entry.word));
    const useNonRecentCandidates = recentSet.size > 0 && nonRecentCandidates.length > 0;
    const rankedCandidates = useNonRecentCandidates ? nonRecentCandidates : candidates;
    if (useNonRecentCandidates) {
      recentWordReuseBlocked = true;
    }

    let bestWord = rankedCandidates[0].word;
    let bestScore = -Infinity;
    rankedCandidates.forEach((entry) => {
      const score = scoreWordSelection(entry.word, selected, rng, seenSet, recentSet);
      if (score > bestScore) {
        bestScore = score;
        bestWord = entry.word;
      }
    });

    selected.push(bestWord);
    const removeAt = source.findIndex((entry) => entry.word === bestWord);
    if (removeAt >= 0) {
      source.splice(removeAt, 1);
    }
  }

  return {
    selectedWords: selected,
    recentWordReuseBlocked
  };
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
  config,
  seenWords = [],
  recentWords = []
}) {
  const seedBase = `${grade}-${roundIndex}-${sessionSalt}`;
  const seenSet = new Set(seenWords.map((word) => normalizeWord(word)).filter(Boolean));
  const recentSet = new Set(recentWords.map((word) => normalizeWord(word)).filter(Boolean));

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

    const wheel = pickWheelLetters(pool, runtimeConfig, rng);
    if (!wheel) {
      continue;
    }

    const selection = selectBoardWords(wheel.buildable, runtimeConfig, rng, {
      seenSet,
      recentSet
    });
    const selectedWords = selection.selectedWords;
    if (selectedWords.length < runtimeConfig.minBoardWords) {
      continue;
    }

    const board = buildCrossword(selectedWords, runtimeConfig.minBoardWords, rng);
    if (!board) {
      continue;
    }

    const wordLookup = {};
    board.words.forEach((word) => {
      wordLookup[word.text] = word.id;
    });

    return {
      seed,
      grade,
      roundIndex,
      timerSeconds: config.timerSeconds,
      wheelLetters: wheel.letters.map((letter) => letter.toUpperCase()),
      board,
      validWords: board.words.map((word) => word.text).sort((a, b) => a.localeCompare(b)),
      wordLookup,
      wordPoolMeta: {
        gradePoolSize: pool.length,
        recentWordReuseBlocked: selection.recentWordReuseBlocked,
        usedRecentWords: selectedWords.filter((word) => recentSet.has(word)).length,
        seenWordsCount: seenSet.size,
        recentWordsCount: recentSet.size
      }
    };
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
