import { readFile } from "node:fs/promises";
import { generateRound, validateGeneratedRound } from "../src/generation/boardGenerator.js";
import { getGradeConfig } from "../src/generation/gradeConfig.js";

function normalizeWord(raw) {
  return String(raw || "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");
}

async function loadGradePool(grade) {
  const file = new URL(`../src/data/grade${grade}.json`, import.meta.url);
  const raw = await readFile(file, "utf8");
  const payload = JSON.parse(raw);
  const themes = Array.isArray(payload.themes) ? payload.themes : [];
  const themeIdSet = new Set(themes.map((theme) => String(theme.id || "").trim()).filter(Boolean));
  const entries = Array.isArray(payload.words)
    ? payload.words
        .map((entry) => {
          const word = normalizeWord(entry.word);
          if (!word) {
            return null;
          }
          const labels = Array.isArray(entry.labels)
            ? Array.from(
                new Set(
                  entry.labels.map((label) => String(label || "").trim()).filter((label) => themeIdSet.has(label))
                )
              )
            : [];
          const primaryThemeId =
            labels.find((label) => label !== "everyday-life") || labels[0] || "everyday-life";

          return {
            word,
            clue: String(entry.clue || "").trim() || "A common everyday word.",
            labels,
            themeIds: labels.slice(),
            primaryThemeId,
            grade,
            tags: ["core", `grade-${grade}`].concat(labels),
            frequencyBand: "medium"
          };
        })
        .filter(Boolean)
    : [];

  const themeIndex = new Map(themes.map((theme) => [theme.id, []]));
  entries.forEach((entry) => {
    const themeId = entry.primaryThemeId || "everyday-life";
    if (!themeIndex.has(themeId)) {
      themeIndex.set(themeId, []);
    }
    themeIndex.get(themeId).push(entry);
  });

  return {
    grade,
    entries,
    themes,
    themeIndex
  };
}

async function validateGrade(grade, rounds) {
  const pool = await loadGradePool(grade);
  const poolSet = new Set(pool.entries.map((entry) => entry.word));
  const config = getGradeConfig(grade);
  const eligibleThemes = pool.themes.filter(
    (theme) => (pool.themeIndex.get(theme.id) || []).length >= Math.max(20, config.targetWords * 4)
  );
  if (!eligibleThemes.length) {
    throw new Error(`No eligible themes found for grade ${grade}`);
  }
  console.log(`Validating grade ${grade} with ${rounds} rounds...`);

  for (let i = 0; i < rounds; i += 1) {
    const theme = eligibleThemes[i % eligibleThemes.length];
    const themeEntries = pool.themeIndex.get(theme.id) || [];
    const round = generateRound({
      grade,
      roundIndex: i,
      sessionSalt: 732455,
      pool,
      activeThemeId: theme.id,
      activeTheme: theme,
      themeEntries,
      config
    });

    if (!validateGeneratedRound(round, poolSet)) {
      throw new Error(`Invalid round generated for grade ${grade} at index ${i}`);
    }

    const hasThemeLeak = round.board.words.some((word) => String(word.primaryThemeId || "") !== String(theme.id));
    if (hasThemeLeak) {
      throw new Error(`Theme leakage in grade ${grade}, round ${i}: expected all words in theme '${theme.id}'`);
    }

    if ((i + 1) % 25 === 0 || i + 1 === rounds) {
      console.log(`Grade ${grade}: ${i + 1}/${rounds}`);
    }
  }

  return {
    grade,
    generated: rounds,
    poolSize: pool.entries.length
  };
}

async function main() {
  const rounds = Number(process.env.ROUNDS || 500);
  const results = [];
  for (let grade = 1; grade <= 5; grade += 1) {
    results.push(await validateGrade(grade, rounds));
  }

  console.table(results);
  console.log("All procedural generation checks passed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
