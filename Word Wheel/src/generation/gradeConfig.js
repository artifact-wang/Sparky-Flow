const gradeConfigs = {
  1: {
    grade: 1,
    wheelSize: 7,
    minWordLength: 3,
    maxWordLength: 5,
    targetWords: 4,
    minBoardWords: 3,
    hintBudget: 4,
    missesForHint: 2,
    scoreBase: 10,
    wordLengthBonus: 2,
    maxLetterRepeat: 2
  },
  2: {
    grade: 2,
    wheelSize: 7,
    minWordLength: 3,
    maxWordLength: 6,
    targetWords: 4,
    minBoardWords: 3,
    hintBudget: 4,
    missesForHint: 2,
    scoreBase: 12,
    wordLengthBonus: 2,
    maxLetterRepeat: 2
  },
  3: {
    grade: 3,
    wheelSize: 8,
    minWordLength: 3,
    maxWordLength: 6,
    targetWords: 5,
    minBoardWords: 4,
    hintBudget: 3,
    missesForHint: 2,
    scoreBase: 14,
    wordLengthBonus: 3,
    maxLetterRepeat: 2
  },
  4: {
    grade: 4,
    wheelSize: 8,
    minWordLength: 3,
    maxWordLength: 7,
    targetWords: 5,
    minBoardWords: 4,
    hintBudget: 3,
    missesForHint: 3,
    scoreBase: 16,
    wordLengthBonus: 3,
    maxLetterRepeat: 2
  },
  5: {
    grade: 5,
    wheelSize: 9,
    minWordLength: 3,
    maxWordLength: 7,
    targetWords: 6,
    minBoardWords: 5,
    hintBudget: 2,
    missesForHint: 3,
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
