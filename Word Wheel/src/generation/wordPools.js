import { normalizeWord } from "./letterSet.js";

const gradeCache = new Map();

function getFrequencyBand(word) {
  if (word.length <= 4) return "high";
  if (word.length <= 6) return "medium";
  return "low";
}

export async function loadGradePool(grade) {
  if (gradeCache.has(grade)) {
    return gradeCache.get(grade);
  }

  const response = await fetch(`/src/data/grade${grade}.json`, { cache: "force-cache" });
  if (!response.ok) {
    throw new Error(`Failed to load grade ${grade} pool`);
  }

  const words = await response.json();
  const unique = new Set();
  const entries = [];

  words.forEach((word) => {
    const cleaned = normalizeWord(word);
    if (!cleaned || unique.has(cleaned)) {
      return;
    }
    unique.add(cleaned);
    entries.push({
      word: cleaned,
      grade,
      tags: ["core", `grade-${grade}`],
      frequencyBand: getFrequencyBand(cleaned)
    });
  });

  gradeCache.set(grade, entries);
  return entries;
}
