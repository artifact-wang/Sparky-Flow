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

  const raw = await response.json();
  const unique = new Set();
  const entries = [];

  if (!raw || typeof raw !== "object" || !Array.isArray(raw.words) || !Array.isArray(raw.themes)) {
    throw new Error(`Invalid grade${grade}.json schema. Expected { grade, themes, words }`);
  }

  const themes = raw.themes
    .map((theme) => ({
      id: String(theme?.id || "").trim(),
      title: String(theme?.title || "").trim(),
      description: String(theme?.description || "").trim()
    }))
    .filter((theme) => theme.id);
  const themeIdSet = new Set(themes.map((theme) => theme.id));
  const fallbackTheme = themes.find((theme) => theme.id === "everyday-life") || themes[0] || null;
  const themeIndex = new Map(themes.map((theme) => [theme.id, []]));

  raw.words.forEach((entry) => {
    const cleaned = normalizeWord(entry?.word);
    if (!cleaned || unique.has(cleaned)) {
      return;
    }

    const rawLabels = Array.isArray(entry?.labels) ? entry.labels : [];
    let labels = rawLabels
      .map((label) => String(label || "").trim())
      .filter((label) => themeIdSet.has(label));
    labels = Array.from(new Set(labels));
    if (!labels.length && fallbackTheme) {
      labels = [fallbackTheme.id];
    }
    const primaryThemeId =
      labels.find((label) => label !== "everyday-life") || labels[0] || fallbackTheme?.id || "everyday-life";

    const clue = String(entry?.clue || "").trim() || "A common everyday word.";
    const normalizedEntry = {
      word: cleaned,
      clue,
      labels,
      themeIds: labels.slice(),
      primaryThemeId,
      grade,
      tags: ["core", `grade-${grade}`].concat(labels),
      frequencyBand: getFrequencyBand(cleaned)
    };

    unique.add(cleaned);
    entries.push(normalizedEntry);

    if (!themeIndex.has(primaryThemeId)) {
      themeIndex.set(primaryThemeId, []);
    }
    themeIndex.get(primaryThemeId).push(normalizedEntry);
  });

  const pool = {
    grade,
    entries,
    themes,
    themeIndex
  };

  gradeCache.set(grade, pool);
  return pool;
}
