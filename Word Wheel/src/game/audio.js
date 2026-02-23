export class AudioSystem {
  constructor({ muted = false } = {}) {
    this.muted = muted;
    this.ctx = null;
    this.master = null;
    this.musicGain = null;
    this.fxGain = null;
    this.started = false;
    this.musicTimer = null;
    this.musicIntensity = 0;
    this.musicStep = 0;
  }

  ensureContext() {
    if (this.ctx) {
      return;
    }

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) {
      return;
    }

    this.ctx = new AudioContext();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.24;
    this.master.connect(this.ctx.destination);

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.14;
    this.musicGain.connect(this.master);

    this.fxGain = this.ctx.createGain();
    this.fxGain.gain.value = 1;
    this.fxGain.connect(this.master);
  }

  async resume() {
    this.ensureContext();
    if (!this.ctx) {
      return;
    }

    if (this.ctx.state === "suspended") {
      await this.ctx.resume();
    }

    if (!this.started) {
      this.started = true;
      this.startMusicLoop();
    }
  }

  setMuted(value) {
    this.muted = value;
    if (this.master) {
      this.master.gain.setTargetAtTime(this.muted ? 0 : 0.24, this.ctx.currentTime, 0.03);
    }
  }

  toggleMuted() {
    this.setMuted(!this.muted);
    return this.muted;
  }

  playTone({
    freq = 440,
    type = "sine",
    duration = 0.12,
    volume = 0.2,
    target = "fx",
    detune = 0,
    when = null
  }) {
    if (!this.ctx || this.muted) {
      return;
    }

    const now = when ?? this.ctx.currentTime;
    const gain = this.ctx.createGain();
    const osc = this.ctx.createOscillator();
    const targetNode = target === "music" ? this.musicGain : this.fxGain;

    osc.type = type;
    osc.frequency.value = freq;
    osc.detune.value = detune;

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(targetNode);
    osc.start(now);
    osc.stop(now + duration + 0.03);
  }

  playTraceStart() {
    this.playTone({ freq: 560, type: "triangle", duration: 0.055, volume: 0.075 });
  }

  playTraceAppend() {
    this.playTone({ freq: 640, type: "triangle", duration: 0.045, volume: 0.06 });
  }

  playShuffle() {
    this.playTone({ freq: 520, type: "square", duration: 0.05, volume: 0.05, detune: -10 });
    this.playTone({ freq: 720, type: "triangle", duration: 0.07, volume: 0.05, detune: 6 });
  }

  playWordSolve(combo = 0) {
    this.playTone({ freq: 500 + combo * 9, type: "triangle", duration: 0.11, volume: 0.12 });
    this.playTone({ freq: 760 + combo * 12, type: "sine", duration: 0.09, volume: 0.09 });
  }

  playInvalidWord() {
    this.playTone({ freq: 210, type: "sawtooth", duration: 0.13, volume: 0.085, detune: -28 });
  }

  playComboBonus(combo) {
    this.playTone({ freq: 860 + combo * 10, type: "square", duration: 0.08, volume: 0.07 });
    this.playTone({ freq: 1120 + combo * 12, type: "triangle", duration: 0.11, volume: 0.05 });
  }

  playHintUse() {
    this.playTone({ freq: 460, type: "sine", duration: 0.1, volume: 0.08 });
    this.playTone({ freq: 620, type: "triangle", duration: 0.12, volume: 0.07 });
  }

  playPerfectRound() {
    this.playTone({ freq: 640, type: "triangle", duration: 0.08, volume: 0.09 });
    this.playTone({ freq: 880, type: "triangle", duration: 0.12, volume: 0.08 });
    this.playTone({ freq: 1240, type: "sine", duration: 0.16, volume: 0.07 });
  }

  playRoundClear() {
    this.playTone({ freq: 680, type: "triangle", duration: 0.11, volume: 0.12 });
    this.playTone({ freq: 920, type: "triangle", duration: 0.13, volume: 0.11 });
    this.playTone({ freq: 1180, type: "triangle", duration: 0.17, volume: 0.1 });
  }

  playTimeout() {
    this.playTone({ freq: 280, type: "sawtooth", duration: 0.2, volume: 0.095 });
    this.playTone({ freq: 238, type: "sawtooth", duration: 0.24, volume: 0.08 });
  }

  // Backward-compatible aliases.
  playTap() {
    this.playTraceAppend();
  }

  playCorrect(combo = 0) {
    this.playWordSolve(combo);
  }

  playWrong() {
    this.playInvalidWord();
  }

  playCombo(combo = 0) {
    this.playComboBonus(combo);
  }

  setMusicIntensity(value) {
    this.musicIntensity = Math.max(0, Math.min(1, value));
  }

  startMusicLoop() {
    if (this.musicTimer || !this.ctx) {
      return;
    }

    const progression = [
      [262, 330, 392],
      [294, 370, 440],
      [247, 311, 370],
      [330, 415, 494]
    ];

    const tick = () => {
      if (!this.ctx || this.muted) {
        return;
      }

      const now = this.ctx.currentTime + 0.02;
      const intensity = this.musicIntensity;
      const barIndex = Math.floor(this.musicStep / 8) % progression.length;
      const stepInBar = this.musicStep % 8;
      const chord = progression[barIndex];

      const root = chord[stepInBar % 3];
      const lead = root + (stepInBar % 2 === 0 ? 12 : 0);

      this.playTone({
        freq: lead,
        type: "triangle",
        duration: 0.14,
        volume: 0.016 + intensity * 0.028,
        target: "music",
        when: now
      });

      if (stepInBar % 2 === 0) {
        this.playTone({
          freq: chord[1] / 2,
          type: "sine",
          duration: 0.18,
          volume: 0.012 + intensity * 0.018,
          target: "music",
          when: now + 0.03
        });
      }

      if (intensity > 0.42 && stepInBar % 4 === 1) {
        this.playTone({
          freq: chord[2] + 12,
          type: "square",
          duration: 0.07,
          volume: 0.01 + intensity * 0.013,
          target: "music",
          when: now + 0.05
        });
      }

      if (stepInBar % 2 === 0) {
        this.playTone({
          freq: 120,
          type: "sine",
          duration: 0.06,
          volume: 0.006 + intensity * 0.012,
          target: "music",
          when: now
        });
      }

      this.musicStep = (this.musicStep + 1) % 32;
    };

    tick();
    this.musicTimer = window.setInterval(tick, 180);
  }

  destroy() {
    if (this.musicTimer) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }
}
