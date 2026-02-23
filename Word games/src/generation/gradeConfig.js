const gradeConfigs = {
  1: {
    grade: 1,
    timerSeconds: 118,
    wheelSize: 7,
    minWordLength: 3,
    maxWordLength: 5,
    targetWords: 4,
    minBoardWords: 3,
    hintBudget: 4,
    missesForHint: 2,
    streakBonusMs: 1200,
    scoreBase: 10,
    wordLengthBonus: 2,
    maxLetterRepeat: 2
  },
  2: {
    grade: 2,
    timerSeconds: 110,
    wheelSize: 7,
    minWordLength: 3,
    maxWordLength: 6,
    targetWords: 4,
    minBoardWords: 3,
    hintBudget: 4,
    missesForHint: 2,
    streakBonusMs: 1000,
    scoreBase: 12,
    wordLengthBonus: 2,
    maxLetterRepeat: 2
  },
  3: {
    grade: 3,
    timerSeconds: 102,
    wheelSize: 8,
    minWordLength: 3,
    maxWordLength: 6,
    targetWords: 5,
    minBoardWords: 4,
    hintBudget: 3,
    missesForHint: 2,
    streakBonusMs: 900,
    scoreBase: 14,
    wordLengthBonus: 3,
    maxLetterRepeat: 2
  },
  4: {
    grade: 4,
    timerSeconds: 94,
    wheelSize: 8,
    minWordLength: 3,
    maxWordLength: 7,
    targetWords: 5,
    minBoardWords: 4,
    hintBudget: 3,
    missesForHint: 3,
    streakBonusMs: 800,
    scoreBase: 16,
    wordLengthBonus: 3,
    maxLetterRepeat: 2
  },
  5: {
    grade: 5,
    timerSeconds: 86,
    wheelSize: 9,
    minWordLength: 3,
    maxWordLength: 7,
    targetWords: 6,
    minBoardWords: 5,
    hintBudget: 2,
    missesForHint: 3,
    streakBonusMs: 750,
    scoreBase: 18,
    wordLengthBonus: 4,
    maxLetterRepeat: 2
  }
};

export function getGradeConfig(grade) {
  const config = gradeConfigs[grade];
  if (!config) {
    throw new Error(`Unknown grade config: ${grade}`);
  }
  return config;
}

export function getAllGradeConfigs() {
  return { ...gradeConfigs };
}
