// Web Audio API Synthesizer for arcade sound effects

class SoundManager {
  private ctx: AudioContext | null = null;
  private musicTimer: number | null = null;
  private musicStep = 0;
  private musicRequested = false;
  private musicPaused = false;
  public muted: boolean = false;

  private getContext(): AudioContext | null {
    if (this.muted) return null;
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.muted = muted;
    if (!muted) this.ctx?.resume().catch(() => {});
    this.syncBackgroundMusic();
  }

  public startBackgroundMusic() {
    this.musicRequested = true;
    this.musicStep = 0;
    this.syncBackgroundMusic();
  }

  public pauseBackgroundMusic(paused: boolean) {
    this.musicPaused = paused;
    this.syncBackgroundMusic();
  }

  public stopBackgroundMusic() {
    this.musicRequested = false;
    this.syncBackgroundMusic();
  }

  private syncBackgroundMusic() {
    const shouldPlay = this.musicRequested && !this.musicPaused && !this.muted;
    if (!shouldPlay) {
      if (this.musicTimer !== null) {
        window.clearInterval(this.musicTimer);
        this.musicTimer = null;
      }
      return;
    }
    if (this.musicTimer !== null || !this.getContext()) return;

    const melody = [523.25, 659.25, 783.99, 659.25, 587.33, 698.46, 880, 698.46,
      523.25, 659.25, 783.99, 1046.5, 880, 783.99, 659.25, 587.33];
    this.musicTimer = window.setInterval(() => {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const note = melody[this.musicStep % melody.length];
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(note, now);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.035, now + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.19);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);

      if (this.musicStep % 4 === 0) {
        const bass = ctx.createOscillator();
        const bassGain = ctx.createGain();
        bass.type = 'triangle';
        bass.frequency.setValueAtTime(note / 2, now);
        bassGain.gain.setValueAtTime(0.0001, now);
        bassGain.gain.linearRampToValueAtTime(0.025, now + 0.02);
        bassGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
        bass.connect(bassGain);
        bassGain.connect(ctx.destination);
        bass.start(now);
        bass.stop(now + 0.29);
      }
      this.musicStep += 1;
    }, 210);
  }

  public playLaneSelect() {
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(760, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.14, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.085);
  }

  public playAdvanceCharge() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    for (let i = 0; i < 3; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(160 + i * 35, now + i * 0.07);
      osc.frequency.exponentialRampToValueAtTime(90, now + i * 0.07 + 0.06);

      gain.gain.setValueAtTime(0.12, now + i * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.07 + 0.06);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.07);
      osc.stop(now + i * 0.07 + 0.065);
    }
  }

  public playCorrectGate() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);

      gain.gain.setValueAtTime(0.16, now + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.008, now + idx * 0.06 + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.24);
    });
  }

  public playWeaponUpgrade() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880, 1108.73];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + idx * 0.055);

      gain.gain.setValueAtTime(0.09, now + idx * 0.055);
      gain.gain.exponentialRampToValueAtTime(0.005, now + idx * 0.055 + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.055);
      osc.stop(now + idx * 0.055 + 0.26);
    });
  }

  public playWrongGate() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.linearRampToValueAtTime(130, now + 0.28);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.008, now + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.31);
  }

  public playShotgunBurst() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(65, now + 0.09);

    gain.gain.setValueAtTime(0.11, now);
    gain.gain.exponentialRampToValueAtTime(0.005, now + 0.09);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.095);
  }

  public playVictoryFanfare() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const melody = [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5];
    const times = [0, 0.1, 0.2, 0.32, 0.46, 0.58];
    melody.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + times[i]);

      gain.gain.setValueAtTime(0.18, now + times[i]);
      gain.gain.exponentialRampToValueAtTime(0.008, now + times[i] + 0.28);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + times[i]);
      osc.stop(now + times[i] + 0.3);
    });
  }
}

export const soundFX = new SoundManager();
