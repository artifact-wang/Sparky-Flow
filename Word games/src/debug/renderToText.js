export function renderGameToText(state) {
  const board = state.board;

  const payload = {
    coordinateSystem: "Canvas origin is top-left; x increases right, y increases down.",
    mode: state.mode,
    grade: state.grade,
    roundIndex: state.roundIndex,
    roundDifficultyTier: state.roundDifficultyTier || 0,
    roundConfig: state.roundConfig
      ? {
          minWordLength: state.roundConfig.minWordLength,
          maxWordLength: state.roundConfig.maxWordLength,
          targetWords: state.roundConfig.targetWords,
          minBoardWords: state.roundConfig.minBoardWords,
          timerSeconds: state.roundConfig.timerSeconds
        }
      : null,
    timerMs: Math.max(0, Math.round(state.timerMs)),
    timerMaxMs: Math.round(state.timerMaxMs),
    score: state.score,
    stars: state.stars,
    streak: state.streak,
    combo: state.combo,
    sequenceRule: "strict-order",
    currentGoalWord: state.currentGoalWord,
    wordSequence: {
      index: state.wordSequenceIndex || 0,
      total: Array.isArray(state.wordSequence) ? state.wordSequence.length : 0,
      remaining: Array.isArray(state.wordSequence)
        ? state.wordSequence.slice(state.wordSequenceIndex || 0)
        : [],
      words: state.wordSequence || []
    },
    hintsRemaining: state.hint.remaining,
    hintCell: state.hint.revealCellKey,
    wheel: {
      letters: state.wheel.letters,
      selectedIndices: state.trace.indices,
      candidateWord: state.trace.candidateWord
    },
    board: board
      ? {
          width: board.width,
          height: board.height,
          solvedWords: board.words.filter((word) => word.solved).map((word) => word.text),
          unsolvedWords: board.words.filter((word) => !word.solved).map((word) => word.text),
          cells: board.cells.map((cell) => ({
            x: cell.x,
            y: cell.y,
            visible: cell.owners.some((ownerId) => board.words[ownerId] && board.words[ownerId].solved),
            char: cell.char,
            owners: cell.owners
          }))
        }
      : null,
    modal: state.modal
      ? {
          type: state.modal.type,
          title: state.modal.title
        }
      : null
  };

  return JSON.stringify(payload);
}
