import { readFile } from "node:fs/promises";

const TARGET_COUNTS = {
  1: 200,
  2: 300,
  3: 400,
  4: 500,
  5: 600
};

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function loadGradePayload(grade) {
  const file = new URL(`../src/data/grade${grade}.json`, import.meta.url);
  const raw = await readFile(file, "utf8");
  return JSON.parse(raw);
}

async function main() {
  const summary = [];

  for (let grade = 1; grade <= 5; grade += 1) {
    const payload = await loadGradePayload(grade);
    assert(payload && typeof payload === "object", `grade${grade}.json must be an object`);
    assert(payload.grade === grade, `grade${grade}.json must include grade=${grade}`);
    assert(Array.isArray(payload.themes), `grade${grade}.json must include themes[]`);
    assert(Array.isArray(payload.words), `grade${grade}.json must include words[]`);
    assert(
      payload.words.length === TARGET_COUNTS[grade],
      `grade${grade}.json must include exactly ${TARGET_COUNTS[grade]} words (found ${payload.words.length})`
    );

    const themeIds = new Set();
    payload.themes.forEach((theme, idx) => {
      assert(theme && typeof theme === "object", `grade${grade}.themes[${idx}] must be an object`);
      assert(typeof theme.id === "string" && theme.id, `grade${grade}.themes[${idx}] missing id`);
      assert(typeof theme.title === "string" && theme.title, `grade${grade}.themes[${idx}] missing title`);
      assert(
        typeof theme.description === "string" && theme.description,
        `grade${grade}.themes[${idx}] missing description`
      );
      assert(!themeIds.has(theme.id), `grade${grade}.themes has duplicate id '${theme.id}'`);
      themeIds.add(theme.id);
    });

    const seenWords = new Set();
    payload.words.forEach((entry, idx) => {
      assert(entry && typeof entry === "object", `grade${grade}.words[${idx}] must be an object`);
      const word = String(entry.word || "").toLowerCase();
      assert(/^[a-z]+$/.test(word), `grade${grade}.words[${idx}] has invalid word '${entry.word}'`);
      assert(!seenWords.has(word), `grade${grade}.words has duplicate word '${word}'`);
      seenWords.add(word);

      const clue = String(entry.clue || "").trim();
      assert(clue.length > 0, `grade${grade}.words[${idx}] (${word}) is missing clue`);
      const firstLetter = word[0].toUpperCase();
      assert(
        clue.toUpperCase().includes(`STARTS WITH ${firstLetter}`),
        `grade${grade}.words[${idx}] (${word}) clue must include the starting-letter hint`
      );
      assert(
        clue.includes(`${word.length} letters`) || clue.includes(`${word.length} letter`),
        `grade${grade}.words[${idx}] (${word}) clue must include the letter-count hint`
      );

      assert(Array.isArray(entry.labels), `grade${grade}.words[${idx}] (${word}) must include labels[]`);
      assert(entry.labels.length > 0, `grade${grade}.words[${idx}] (${word}) must include at least one label`);

      entry.labels.forEach((label, labelIndex) => {
        assert(
          typeof label === "string" && themeIds.has(label),
          `grade${grade}.words[${idx}] (${word}) has invalid label at index ${labelIndex}: '${label}'`
        );
      });
    });

    const usageByTheme = {};
    payload.words.forEach((entry) => {
      entry.labels.forEach((label) => {
        usageByTheme[label] = (usageByTheme[label] || 0) + 1;
      });
    });

    summary.push({
      grade,
      words: payload.words.length,
      themes: payload.themes.length,
      uniqueWords: seenWords.size,
      labelsUsed: Object.keys(usageByTheme).length
    });
  }

  console.table(summary);
  console.log("Themed pool validation passed.");
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
