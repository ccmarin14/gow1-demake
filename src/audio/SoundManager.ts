import { CONFIG } from '../config';
import { STORM_LEVEL, startStorm } from './ambience';

export interface SoundStats {
  playCounts: Record<string, number>;
  lastPlayed: string | null;
  totalPlayed: number;
  muted: boolean;
  isReady: boolean;
}

export type StrikeSoundProfile = 'light' | 'heavy' | 'air';

export class SoundManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private muted = false;
  private isReady = false;
  private magicHum: { osc: OscillatorNode; gain: GainNode } | null = null;

  private readonly playCounts: Record<string, number> = {
    strikeHit: 0,
    strikeHitLight: 0,
    strikeHitHeavy: 0,
    strikeHitAir: 0,
    strikeWhoosh: 0,
    parry: 0,
    magicThunder: 0,
    magicHum: 0,
    magicCrackle: 0,
    hydraRoar: 0,
    hydraSlam: 0,
    orbAbsorb: 0,
    chestOpen: 0,
    victoryFanfare: 0,
    stab: 0,
    boneBreak: 0,
    throwRelease: 0,
    slamImpact: 0,
    grabWhoosh: 0,
    grabClamp: 0,
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
      // the storm shares the master gain, so the mute key silences it too
      startStorm(this.ctx, this.masterGain, STORM_LEVEL);

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

  playStrikeWhoosh(profile: StrikeSoundProfile): void {
    this.recordSound('strikeWhoosh');
    if (!this.ctx || !this.sfxGain || this.muted) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const start = profile === 'heavy' ? 180 : profile === 'air' ? 520 : 360;
      const end = profile === 'heavy' ? 70 : profile === 'air' ? 180 : 110;
      const length = profile === 'heavy' ? 0.16 : profile === 'air' ? 0.11 : 0.09;
      osc.type = profile === 'air' ? 'sine' : 'sawtooth';
      osc.frequency.setValueAtTime(start, now);
      osc.frequency.exponentialRampToValueAtTime(end, now + length);
      gain.gain.setValueAtTime(profile === 'heavy' ? 0.16 : 0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + length);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + length);
    } catch {}
  }

  /** Blade impact, with a distinct weight for light, heavy and aerial attacks. */
  playStrikeHit(profile: StrikeSoundProfile): void {
    this.recordSound('strikeHit');
    this.recordSound(`strikeHit${profile[0].toUpperCase()}${profile.slice(1)}`);
    if (!this.ctx || !this.sfxGain || this.muted) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const heavy = profile === 'heavy';
      const air = profile === 'air';
      const length = heavy ? 0.18 : air ? 0.12 : 0.09;
      osc.type = air ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(heavy ? 120 : air ? 260 : 170, now);
      osc.frequency.exponentialRampToValueAtTime(heavy ? 32 : air ? 90 : 45, now + length - 0.01);

      gain.gain.setValueAtTime(heavy ? 0.6 : air ? 0.32 : 0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + length);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + length);
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

  /** Blade plunge into victim's torso during Grab 1 (TAP ○ REPEATEDLY). */
  playStab(): void {
    this.recordSound('stab');
    if (!this.ctx || !this.sfxGain || this.muted) return;

    try {
      const now = this.ctx.currentTime;

      // 1. Sharp metallic plunge / scrape
      const metalOsc = this.ctx.createOscillator();
      const metalGain = this.ctx.createGain();
      metalOsc.type = 'sawtooth';
      metalOsc.frequency.setValueAtTime(880, now);
      metalOsc.frequency.exponentialRampToValueAtTime(140, now + 0.08);
      metalGain.gain.setValueAtTime(0.4, now);
      metalGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      metalOsc.connect(metalGain);
      metalGain.connect(this.sfxGain);
      metalOsc.start(now);
      metalOsc.stop(now + 0.08);

      // 2. Visceral meat puncture thud
      const bodyOsc = this.ctx.createOscillator();
      const bodyGain = this.ctx.createGain();
      bodyOsc.type = 'triangle';
      bodyOsc.frequency.setValueAtTime(180, now);
      bodyOsc.frequency.exponentialRampToValueAtTime(38, now + 0.14);
      bodyGain.gain.setValueAtTime(0.65, now);
      bodyGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      bodyOsc.connect(bodyGain);
      bodyGain.connect(this.sfxGain);
      bodyOsc.start(now);
      bodyOsc.stop(now + 0.14);
    } catch {}
  }

  /** Brutal overhead bone crack / spine snap during Grab 2 (△ Break). */
  playBoneBreak(): void {
    this.recordSound('boneBreak');
    if (!this.ctx || !this.sfxGain || this.muted) return;

    try {
      const now = this.ctx.currentTime;

      const snapOsc = this.ctx.createOscillator();
      const snapGain = this.ctx.createGain();
      snapOsc.type = 'sawtooth';
      snapOsc.frequency.setValueAtTime(240, now);
      snapOsc.frequency.exponentialRampToValueAtTime(25, now + 0.22);
      snapGain.gain.setValueAtTime(0.7, now);
      snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      snapOsc.connect(snapGain);
      snapGain.connect(this.sfxGain);
      snapOsc.start(now);
      snapOsc.stop(now + 0.22);
    } catch {}
  }

  /** Heavy projectile whoosh on throwing victim (Grab 3 □ Throw). */
  playThrowRelease(): void {
    this.recordSound('throwRelease');
    if (!this.ctx || !this.sfxGain || this.muted) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(70, now + 0.18);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.18);
    } catch {}
  }

  /** Deck slam impact on ○ final slam or finisher. */
  playSlamImpact(): void {
    this.recordSound('slamImpact');
    if (!this.ctx || !this.sfxGain || this.muted) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(130, now);
      osc.frequency.exponentialRampToValueAtTime(28, now + 0.24);
      gain.gain.setValueAtTime(0.75, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.24);
    } catch {}
  }

  /** Outstretched arm swish during grab lunge in empty air (E1 Whiff). */
  playGrabWhoosh(): void {
    this.recordSound('grabWhoosh');
    if (!this.ctx || !this.sfxGain || this.muted) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.09);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.09);
    } catch {}
  }

  /** Meaty grip sound when Kratos locks hand onto victim's throat (E2 Lunge & Grab). */
  playGrabClamp(): void {
    this.recordSound('grabClamp');
    if (!this.ctx || !this.sfxGain || this.muted) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.08);
      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.08);
    } catch {}
  }

  playMagicThunder(): void {
    this.recordSound('magicThunder');
    if (!this.ctx || !this.sfxGain || this.muted) return;

    try {
      const now = this.ctx.currentTime;

      // Low rumble under the bolt impact.
      const rumble = this.ctx.createOscillator();
      const rumbleGain = this.ctx.createGain();
      rumble.type = 'sine';
      rumble.frequency.setValueAtTime(85, now);
      rumble.frequency.exponentialRampToValueAtTime(32, now + 0.45);
      rumbleGain.gain.setValueAtTime(0.5, now);
      rumbleGain.gain.exponentialRampToValueAtTime(0.001, now + 0.48);
      rumble.connect(rumbleGain);
      rumbleGain.connect(this.sfxGain);
      rumble.start(now);
      rumble.stop(now + 0.48);

      // Filtered noise gives the strike a crack instead of a clean tone.
      this.playMagicNoise(now, 0.3, 1200, 'lowpass', 0.24);
      this.playMagicNoise(now, 0.09, 2600, 'highpass', 0.18);
    } catch {}
  }

  /** Soft electric buzz while the bolt sustains; one voice, not a new node per tick. */
  startMagicHum(): void {
    this.recordSound('magicHum');
    if (!this.ctx || !this.sfxGain || this.muted || this.magicHum) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(58, now);
      osc.frequency.linearRampToValueAtTime(74, now + 0.9);
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(180, now);
      filter.Q.value = 0.7;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.05, now + 0.15);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      this.magicHum = { osc, gain };
    } catch {}
  }

  stopMagicHum(): void {
    if (!this.magicHum || !this.ctx) return;
    const { osc, gain } = this.magicHum;
    this.magicHum = null;
    try {
      const now = this.ctx.currentTime;
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(Math.max(0.0001, gain.gain.value), now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
      osc.stop(now + 0.2);
    } catch {}
  }

  /** Short crackle when the ground wave reaches an enemy. */
  playMagicCrackle(): void {
    this.recordSound('magicCrackle');
    if (!this.ctx || !this.sfxGain || this.muted) return;

    try {
      this.playMagicNoise(this.ctx.currentTime, 0.14, 1800, 'highpass', 0.2);
    } catch {}
  }

  private playMagicNoise(
    start: number,
    duration: number,
    frequency: number,
    filterType: 'lowpass' | 'highpass',
    volume: number,
  ): void {
    const ctx = this.ctx;
    const sfxGain = this.sfxGain;
    if (!ctx || !sfxGain) return;

    const frames = Math.max(1, Math.floor(ctx.sampleRate * duration));
    const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < frames; i += 1) {
      const decay = 1 - i / frames;
      data[i] = (Math.random() * 2 - 1) * decay;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.setValueAtTime(frequency, start);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(sfxGain);
    source.start(start);
    source.stop(start + duration);
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
