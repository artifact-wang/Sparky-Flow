export function normalizeWord(word) {
  return String(word || "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");
}

export function countLetters(source) {
  const counts = {};
  const text = Array.isArray(source)
    ? source
        .join("")
        .toLowerCase()
        .replace(/[^a-z]/g, "")
    : normalizeWord(source);
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    counts[ch] = (counts[ch] || 0) + 1;
  }
  return counts;
}

export function expandCounts(counts) {
  const letters = [];
  Object.keys(counts).forEach((ch) => {
    for (let i = 0; i < counts[ch]; i += 1) {
      letters.push(ch);
    }
  });
  return letters;
}

export function canBuildWord(word, sourceCounts) {
  const cleaned = normalizeWord(word);
  if (!cleaned.length) {
    return false;
  }
  const local = { ...sourceCounts };
  for (let i = 0; i < cleaned.length; i += 1) {
    const ch = cleaned[i];
    if (!local[ch]) {
      return false;
    }
    local[ch] -= 1;
  }
  return true;
}

export function overlapCount(wordA, wordB) {
  const countsA = countLetters(wordA);
  const countsB = countLetters(wordB);
  let overlap = 0;
  Object.keys(countsA).forEach((ch) => {
    overlap += Math.min(countsA[ch], countsB[ch] || 0);
  });
  return overlap;
}
