import { readFile } from "node:fs/promises";
import { generateRound, validateGeneratedRound } from "../src/generation/boardGenerator.js";
import { getGradeConfig } from "../src/generation/gradeConfig.js";

async function loadGradeWords(grade) {
  const file = new URL(`../src/data/grade${grade}.json`, import.meta.url);
  const raw = await readFile(file, "utf8");
  const words = JSON.parse(raw);
  return words.map((word) => ({
    word: String(word).toLowerCase(),
    grade,
    tags: ["core", `grade-${grade}`],
    frequencyBand: "medium"
  }));
}

async function validateGrade(grade, rounds) {
  const pool = await loadGradeWords(grade);
  const poolSet = new Set(pool.map((entry) => entry.word));
  const config = getGradeConfig(grade);
  console.log(`Validating grade ${grade} with ${rounds} rounds...`);

  for (let i = 0; i < rounds; i += 1) {
    const round = generateRound({
      grade,
      roundIndex: i,
      sessionSalt: 732455,
      pool,
      config
    });

    if (!validateGeneratedRound(round, poolSet)) {
      throw new Error(`Invalid round generated for grade ${grade} at index ${i}`);
    }

    if ((i + 1) % 25 === 0 || i + 1 === rounds) {
      console.log(`Grade ${grade}: ${i + 1}/${rounds}`);
    }
  }

  return {
    grade,
    generated: rounds,
    poolSize: pool.length
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
