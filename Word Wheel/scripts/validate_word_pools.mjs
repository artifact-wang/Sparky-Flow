import { readFile } from "node:fs/promises";

const GRADE_COUNT = 5;
const MIN_POOL_SIZE = 100;
const TARGET_POOL_SIZE = 120;

const LENGTH_ENVELOPE = {
  1: { min: 3, max: 6 },
  2: { min: 3, max: 7 },
  3: { min: 3, max: 9 },
  4: { min: 3, max: 10 },
  5: { min: 3, max: 12 }
};

const OVERLAP_BOUNDS = {
  "1-2": { min: 25, max: 35 },
  "2-3": { min: 20, max: 30 },
  "3-4": { min: 15, max: 25 },
  "4-5": { min: 10, max: 20 }
};

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function loadGradeWords(grade) {
  const file = new URL(`../src/data/grade${grade}.json`, import.meta.url);
  const raw = await readFile(file, "utf8");
  const words = JSON.parse(raw);

  assert(Array.isArray(words), `grade${grade}.json must contain an array`);

  const cleaned = words.map((word) => String(word).trim().toLowerCase());
  return cleaned;
}

function overlapCount(a, b) {
  const bSet = new Set(b);
  let count = 0;
  for (const word of a) {
    if (bSet.has(word)) count += 1;
  }
  return count;
}

function avgWordLength(words) {
  if (!words.length) return 0;
  const sum = words.reduce((total, word) => total + word.length, 0);
  return sum / words.length;
}

async function main() {
  const gradeWords = {};

  for (let grade = 1; grade <= GRADE_COUNT; grade += 1) {
    const words = await loadGradeWords(grade);
    gradeWords[grade] = words;

    const unique = new Set(words);
    const envelope = LENGTH_ENVELOPE[grade];
    const lengths = words.map((word) => word.length);
    const minLen = Math.min(...lengths);
    const maxLen = Math.max(...lengths);

    assert(words.length >= MIN_POOL_SIZE, `grade${grade} must contain at least ${MIN_POOL_SIZE} words`);
    assert(
      words.length === TARGET_POOL_SIZE,
      `grade${grade} should contain ${TARGET_POOL_SIZE} words (found ${words.length})`
    );
    assert(unique.size === words.length, `grade${grade} contains duplicate words`);

    words.forEach((word) => {
      assert(/^[a-z]+$/.test(word), `grade${grade} has invalid word '${word}' (letters only)`);
    });

    assert(minLen >= envelope.min, `grade${grade} has words shorter than ${envelope.min}`);
    assert(maxLen <= envelope.max, `grade${grade} has words longer than ${envelope.max}`);
  }

  for (let grade = 1; grade < GRADE_COUNT; grade += 1) {
    const pair = `${grade}-${grade + 1}`;
    const bounds = OVERLAP_BOUNDS[pair];
    const overlap = overlapCount(gradeWords[grade], gradeWords[grade + 1]);

    assert(
      overlap >= bounds.min && overlap <= bounds.max,
      `Overlap ${pair} out of range: ${overlap} (expected ${bounds.min}-${bounds.max})`
    );
  }

  const summary = [];
  for (let grade = 1; grade <= GRADE_COUNT; grade += 1) {
    const words = gradeWords[grade];
    const lengths = words.map((word) => word.length);
    summary.push({
      grade,
      words: words.length,
      unique: new Set(words).size,
      minLen: Math.min(...lengths),
      maxLen: Math.max(...lengths),
      avgLen: Number(avgWordLength(words).toFixed(2))
    });
  }

  console.table(summary);
  console.log("Word pool validation passed.");
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
