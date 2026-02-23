function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function createUIOverlay(root = document) {
  const hud = root.getElementById("top-hud");
  const menu = root.getElementById("grade-menu");
  const modal = root.getElementById("modal");

  const gradeLabel = root.getElementById("grade-label");
  const goalValue = root.getElementById("goal-value");
  const scoreValue = root.getElementById("score-value");
  const streakValue = root.getElementById("streak-value");
  const hintValue = root.getElementById("hint-value");
  const hintChip = root.getElementById("hint-chip");
  const roundValue = root.getElementById("round-value");

  const timerFill = root.getElementById("timer-fill");

  const muteBtn = root.getElementById("btn-mute");
  const restartBtn = root.getElementById("btn-restart");
  const homeBtn = root.getElementById("btn-home");

  const gradeButtons = Array.from(root.querySelectorAll("[data-grade]"));
  const cardStatEls = Array.from(root.querySelectorAll("[data-grade-stats]"));

  const modalTitle = root.getElementById("modal-title");
  const modalBody = root.getElementById("modal-body");
  const modalRewards = root.getElementById("modal-rewards");
  const modalPrimary = root.getElementById("modal-primary");
  const modalSecondary = root.getElementById("modal-secondary");

  const handlers = {
    onPickGrade: () => {},
    onRestart: () => {},
    onHome: () => {},
    onUseHint: () => {},
    onToggleMute: () => {},
    onModalPrimary: () => {},
    onModalSecondary: () => {}
  };

  gradeButtons.forEach((btn) => {
    btn.addEventListener("click", () => handlers.onPickGrade(Number(btn.dataset.grade)));
  });

  restartBtn.addEventListener("click", () => handlers.onRestart());
  homeBtn.addEventListener("click", () => handlers.onHome());
  muteBtn.addEventListener("click", () => handlers.onToggleMute());
  if (hintChip) {
    hintChip.addEventListener("click", () => handlers.onUseHint());
  }

  modalPrimary.addEventListener("click", () => handlers.onModalPrimary());
  modalSecondary.addEventListener("click", () => handlers.onModalSecondary());

  function bind(nextHandlers) {
    Object.assign(handlers, nextHandlers);
  }

  function updateHud(state) {
    const grade = state.grade || "-";
    const totalGoals =
      state.board && Array.isArray(state.board.words)
        ? state.board.words.length
        : Array.isArray(state.wordSequence)
          ? state.wordSequence.length
          : 0;
    const solvedGoals = totalGoals ? Math.min(totalGoals, state.board?.solvedCount || 0) : 0;
    gradeLabel.textContent = `Grade ${grade}`;
    goalValue.textContent = totalGoals ? `${solvedGoals}/${totalGoals}` : "-";
    scoreValue.textContent = `${state.score}`;
    streakValue.textContent = `${state.streak}`;
    hintValue.textContent = `${state.hint.remaining}`;
    roundValue.textContent = `${state.roundIndex + 1}`;
    if (hintChip) {
      hintChip.disabled = state.mode !== "playing" || state.hint.remaining <= 0 || state.hint.cooldownMs > 0;
    }

    const progress = clamp(state.timerMaxMs ? state.timerMs / state.timerMaxMs : 0, 0, 1);
    timerFill.style.transform = `scaleX(${progress})`;
  }

  function setMuteButton(muted) {
    muteBtn.textContent = muted ? "🔇" : "🔊";
    muteBtn.setAttribute("aria-label", muted ? "Unmute" : "Mute");
  }

  function showMenu() {
    menu.classList.remove("hidden");
    modal.classList.add("hidden");
  }

  function hideMenu() {
    menu.classList.add("hidden");
  }

  function setHudVisible(visible) {
    hud.classList.toggle("hidden", !visible);
  }

  function updateGradeCards(saveState) {
    cardStatEls.forEach((el) => {
      const grade = Number(el.dataset.gradeStats);
      const stats = saveState.gradeStats[grade];
      if (!stats) {
        el.textContent = "Max Round 0";
        return;
      }
      const maxRound = Math.max(0, Number(stats.maxRound) || Number(stats.roundsCompleted) || 0);
      el.textContent = `Max Round ${maxRound}`;
    });
  }

  function renderModalRewards(rewards) {
    if (!modalRewards) {
      return;
    }

    modalRewards.innerHTML = "";
    if (!Array.isArray(rewards) || !rewards.length) {
      modalRewards.classList.add("hidden");
      return;
    }

    rewards.forEach((reward, index) => {
      const chip = document.createElement("div");
      chip.className = "reward-pop";
      if (reward && reward.tone) {
        chip.dataset.tone = reward.tone;
      }
      chip.style.animationDelay = `${index * 90}ms`;
      const hints = Math.max(0, Number(reward?.hints) || 0);
      const hintLabel = hints ? `+${hints} Hint${hints === 1 ? "" : "s"}` : "";
      chip.innerHTML = `<span class="reward-pop-label">${reward?.title || "Bonus"}</span><span class="reward-pop-value">${hintLabel}</span>`;
      modalRewards.append(chip);
    });

    modalRewards.classList.remove("hidden");
  }

  function showModal({
    title,
    body,
    primaryLabel = "Continue",
    secondaryLabel = "Home",
    rewards = []
  }) {
    modalTitle.textContent = title;
    modalBody.textContent = body;
    renderModalRewards(rewards);
    modalPrimary.textContent = primaryLabel;
    modalSecondary.textContent = secondaryLabel;
    modal.classList.remove("hidden");
  }

  function hideModal() {
    renderModalRewards([]);
    modal.classList.add("hidden");
  }

  return {
    bind,
    updateHud,
    setMuteButton,
    showMenu,
    hideMenu,
    setHudVisible,
    updateGradeCards,
    showModal,
    hideModal
  };
}
