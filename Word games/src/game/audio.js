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

  playTone({ freq = 440, type = "sine", duration = 0.12, volume = 0.2, target = "fx", detune = 0 }) {
    if (!this.ctx || this.muted) {
      return;
    }

    const now = this.ctx.currentTime;
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

  playTap() {
    this.playTone({ freq: 620, type: "triangle", duration: 0.05, volume: 0.08 });
  }

  playCorrect(combo = 0) {
    this.playTone({ freq: 520 + combo * 12, type: "triangle", duration: 0.11, volume: 0.13 });
    this.playTone({ freq: 780 + combo * 15, type: "sine", duration: 0.09, volume: 0.08 });
  }

  playWrong() {
    this.playTone({ freq: 210, type: "sawtooth", duration: 0.12, volume: 0.09, detune: -30 });
  }

  playCombo(combo) {
    this.playTone({ freq: 880 + combo * 10, type: "square", duration: 0.08, volume: 0.07 });
    this.playTone({ freq: 1110 + combo * 11, type: "triangle", duration: 0.11, volume: 0.05 });
  }

  playRoundClear() {
    this.playTone({ freq: 660, type: "triangle", duration: 0.1, volume: 0.12 });
    this.playTone({ freq: 880, type: "triangle", duration: 0.12, volume: 0.11 });
    this.playTone({ freq: 1170, type: "triangle", duration: 0.16, volume: 0.09 });
  }

  playTimeout() {
    this.playTone({ freq: 280, type: "sawtooth", duration: 0.22, volume: 0.1 });
    this.playTone({ freq: 240, type: "sawtooth", duration: 0.25, volume: 0.08 });
  }

  setMusicIntensity(value) {
    this.musicIntensity = Math.max(0, Math.min(1, value));
  }

  startMusicLoop() {
    if (this.musicTimer || !this.ctx) {
      return;
    }

    const bar = () => {
      if (!this.ctx || this.muted) {
        return;
      }

      const notes = [262, 330, 392, 330, 349, 440, 523, 440];
      const offset = this.musicIntensity > 0.45 ? 12 : 0;
      const extraLayer = this.musicIntensity > 0.72;

      notes.forEach((note, index) => {
        const at = this.ctx.currentTime + index * 0.14;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = note + offset;

        gain.gain.setValueAtTime(0.0001, at);
        gain.gain.exponentialRampToValueAtTime(0.018 + this.musicIntensity * 0.04, at + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.13);

        osc.connect(gain);
        gain.connect(this.musicGain);
        osc.start(at);
        osc.stop(at + 0.18);

        if (extraLayer && index % 2 === 0) {
          const bass = this.ctx.createOscillator();
          const bassGain = this.ctx.createGain();
          bass.type = "triangle";
          bass.frequency.value = (note + offset) / 2;
          bassGain.gain.setValueAtTime(0.0001, at);
          bassGain.gain.exponentialRampToValueAtTime(0.015, at + 0.03);
          bassGain.gain.exponentialRampToValueAtTime(0.0001, at + 0.13);
          bass.connect(bassGain);
          bassGain.connect(this.musicGain);
          bass.start(at);
          bass.stop(at + 0.18);
        }
      });
    };

    bar();
    this.musicTimer = window.setInterval(bar, 1120);
  }

  destroy() {
    if (this.musicTimer) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }
}
