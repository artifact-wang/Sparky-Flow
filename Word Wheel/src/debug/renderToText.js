export function renderGameToText(state) {
  const board = state.board;
  const revealAllAnswers = Boolean(board?.revealAllAnswers);
  const totalWords = board && Array.isArray(board.words) ? board.words.length : 0;
  const solvedWords = board ? board.words.filter((word) => word.solved).map((word) => word.text) : [];
  const unsolvedWords = board ? board.words.filter((word) => !word.solved).map((word) => word.text) : [];

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
    rules: {
      letterOrder: "strict",
      wordOrder: "any-order",
      hintPolicy: "manual-only"
    },
    sequenceRule: "any-order-across-words",
    wordCompletionRule: "strict-letter-order-within-word",
    currentGoalWord: state.currentGoalWord,
    wordSequence: {
      index: board ? board.solvedCount : state.wordSequenceIndex || 0,
      total: totalWords || (Array.isArray(state.wordSequence) ? state.wordSequence.length : 0),
      remaining: unsolvedWords,
      words: state.wordSequence || []
    },
    hintsRemaining: state.hint.remaining,
    hintCell: state.hint.revealCellKey,
    roundClearRewards: Array.isArray(state.roundClearRewards)
      ? state.roundClearRewards.map((reward) => ({
          title: reward.title,
          hints: reward.hints,
          tone: reward.tone
        }))
      : [],
    celebration: {
      roundClearSpinActive: Boolean(state.wheel?.roundClearSpin)
    },
    wordPool: {
      gradePoolSize: state.roundWordPoolMeta?.gradePoolSize || 0,
      recentWordReuseBlocked: Boolean(state.roundWordPoolMeta?.recentWordReuseBlocked),
      freshCrosswordAvailable: Boolean(state.roundWordPoolMeta?.freshCrosswordAvailable),
      freshnessFallbackUsed: Boolean(state.roundWordPoolMeta?.freshnessFallbackUsed),
      freshWordsUsed: state.roundWordPoolMeta?.freshWordsUsed || 0,
      reusedWordsUsed: state.roundWordPoolMeta?.reusedWordsUsed || 0,
      recentWordsUsed: state.roundWordPoolMeta?.recentWordsUsed || 0,
      boardWordCount: state.roundWordPoolMeta?.boardWordCount || 0,
      maxWordUsageInBoard: state.roundWordPoolMeta?.maxWordUsageInBoard || 0,
      totalWordUsageInBoard: state.roundWordPoolMeta?.totalWordUsageInBoard || 0,
      recentWordsCount: state.roundWordPoolMeta?.recentWordsCount || 0,
      seenWordsCount: state.roundWordPoolMeta?.seenWordsCount || 0,
      usedRecentWords: state.roundWordPoolMeta?.usedRecentWords || 0
    },
    wheel: {
      letters: state.wheel.letters,
      selectedIndices: state.trace.indices,
      candidateWord: state.trace.candidateWord
    },
    board: board
      ? {
          width: board.width,
          height: board.height,
          solvedWords,
          unsolvedWords,
          revealAllAnswers,
          cells: board.cells.map((cell) => ({
            x: cell.x,
            y: cell.y,
            visible:
              revealAllAnswers ||
              cell.owners.some((ownerId) => board.words[ownerId] && board.words[ownerId].solved),
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
      : null,
    roundPreview: state.pendingRoundPanel
      ? {
          type: state.pendingRoundPanel.type
        }
      : null
  };

  return JSON.stringify(payload);
}
