import { CONFIG } from '../config';

export interface SoundStats {
  playCounts: Record<string, number>;
  lastPlayed: string | null;
  totalPlayed: number;
  muted: boolean;
  isReady: boolean;
}

export class SoundManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private muted = false;
  private isReady = false;

  private readonly playCounts: Record<string, number> = {
    strikeHit: 0,
    parry: 0,
    magicThunder: 0,
    hydraRoar: 0,
    hydraSlam: 0,
    orbAbsorb: 0,
    chestOpen: 0,
    victoryFanfare: 0,
  };
  private lastPlayed: string | null = null;
  private totalPlayed = 0;

  constructor() {
    this.initAudioContext();
  }

  private initAudioContext(): void {
    if (typeof window === 'undefined') {
      return;
    }
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextClass) {
      return;
    }

    try {
      this.ctx = new AudioContextClass();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(CONFIG.audio.masterVolume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(CONFIG.audio.sfxVolume, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.isReady = true;

      // Autoplay policy unlock listener
      const unlock = () => {
        if (this.ctx && this.ctx.state === 'suspended') {
          this.ctx.resume().catch(() => {});
        }
      };
      window.addEventListener('keydown', unlock, { once: true, passive: true });
      window.addEventListener('pointerdown', unlock, { once: true, passive: true });
    } catch {
      this.ctx = null;
      this.isReady = false;
    }
  }

  unlock(): void {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  private recordSound(name: string): void {
    this.playCounts[name] = (this.playCounts[name] || 0) + 1;
    this.lastPlayed = name;
    this.totalPlayed += 1;
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    if (this.masterGain && this.ctx) {
      const vol = this.muted ? 0 : CONFIG.audio.masterVolume;
      this.masterGain.gain.setValueAtTime(vol, this.ctx.currentTime);
    }
    return this.muted;
  }

  isMuted(): boolean {
    return this.muted;
  }

  getStats(): SoundStats {
    return {
      playCounts: { ...this.playCounts },
      lastPlayed: this.lastPlayed,
      totalPlayed: this.totalPlayed,
      muted: this.muted,
      isReady: this.isReady && Boolean(this.ctx && this.ctx.state !== 'closed'),
    };
  }

  // ========================================================
  // PROCEDURAL SOUND GENERATORS (Web Audio API)
  // ========================================================

  /** Short low thud when a blade connects. */
  playStrikeHit(): void {
    this.recordSound('strikeHit');
    if (!this.ctx || !this.sfxGain || this.muted) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(170, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.08);

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.09);
    } catch {
      // Audio error safety
    }
  }

  playParry(): void {
    this.recordSound('parry');
    if (!this.ctx || !this.sfxGain || this.muted) return;

    try {
      const now = this.ctx.currentTime;
      const harmonics = [880, 1320, 1760];

      for (let i = 0; i < harmonics.length; i += 1) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(harmonics[i], now);

        const amp = 0.35 / (i + 1);
        gain.gain.setValueAtTime(amp, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.35);
      }
    } catch {}
  }

  playMagicThunder(): void {
    this.recordSound('magicThunder');
    if (!this.ctx || !this.sfxGain || this.muted) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(65, now);
      osc.frequency.linearRampToValueAtTime(140, now + 0.2);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.4);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.42);
    } catch {}
  }

  playHydraRoar(): void {
    this.recordSound('hydraRoar');
    if (!this.ctx || !this.sfxGain || this.muted) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(45, now);
      osc.frequency.linearRampToValueAtTime(75, now + 0.3);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.6);

      gain.gain.setValueAtTime(0.45, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.62);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.62);
    } catch {}
  }

  playHydraSlam(): void {
    this.recordSound('hydraSlam');
    if (!this.ctx || !this.sfxGain || this.muted) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(90, now);
      osc.frequency.exponentialRampToValueAtTime(25, now + 0.35);

      gain.gain.setValueAtTime(0.6, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.38);
    } catch {}
  }

  playOrbAbsorb(type: 'red' | 'green' | 'blue' = 'red'): void {
    this.recordSound('orbAbsorb');
    if (!this.ctx || !this.sfxGain || this.muted) return;

    try {
      const now = this.ctx.currentTime;
      const baseFreq = type === 'green' ? 659.25 : type === 'blue' ? 783.99 : 523.25;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.12);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.14);
    } catch {}
  }

  playChestOpen(): void {
    this.recordSound('chestOpen');
    if (!this.ctx || !this.sfxGain || this.muted) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.linearRampToValueAtTime(320, now + 0.25);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.28);
    } catch {}
  }

  playVictoryFanfare(): void {
    this.recordSound('victoryFanfare');
    if (!this.ctx || !this.sfxGain || this.muted) return;

    try {
      const now = this.ctx.currentTime;
      const chord = [261.63, 329.63, 392.00, 523.25]; // C major chord

      for (let i = 0; i < chord.length; i += 1) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(chord[i], now);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.75);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.75);
      }
    } catch {}
  }

  destroy(): void {
    if (this.ctx && this.ctx.state !== 'closed') {
      this.ctx.close().catch(() => {});
    }
    this.ctx = null;
  }
}
