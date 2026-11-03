import Phaser from 'phaser';
import { CONFIG } from '../config';

interface RainDrop {
  x: number;
  y: number;
  isFront: boolean;
  splashing: boolean;
  splashTicks: number;
}

interface Splash {
  x: number;
  y: number;
  ticks: number;
  maxTicks: number;
  isFront: boolean;
}

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: number;
  life: number;
  maxLife: number;
}

interface ParryFlash {
  x: number;
  y: number;
  ticks: number;
  maxTicks: number;
  maxRadius: number;
}

// Deterministic pseudo-random number generator for reproducible VFX simulation
function createDeterministicRandom(seed: number = 42) {
  let s = seed;
  return function () {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export class VfxLayer {
  private readonly rnd = createDeterministicRandom(12345);

  // Graphics layers
  private readonly lightningRect: Phaser.GameObjects.Rectangle;
  private readonly rainBackGfx: Phaser.GameObjects.Graphics;
  private readonly rainFrontGfx: Phaser.GameObjects.Graphics;
  private readonly combatSparksGfx: Phaser.GameObjects.Graphics;
  private readonly parryFlashGfx: Phaser.GameObjects.Graphics;

  // Rain state
  private readonly drops: RainDrop[] = [];
  private readonly splashes: Splash[] = [];

  // Lightning state
  private lightningTimer = 0;
  private nextLightningTick: number;
  private flashTicks = 0;
  private maxFlashTicks = 6;

  // Combat VFX state
  private readonly sparks: Spark[] = [];
  private readonly parryFlashes: ParryFlash[] = [];

  constructor(scene: Phaser.Scene) {
    const { width, height } = CONFIG.internal;
    const vfxCfg = CONFIG.vfx;

    // 1. Lightning background flash
    this.lightningRect = scene.add
      .rectangle(0, 0, width, height, vfxCfg.lightning.color, 0)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(vfxCfg.lightning.depth);

    this.nextLightningTick = Math.floor(
      vfxCfg.lightning.intervalTicksMin +
        this.rnd() * (vfxCfg.lightning.intervalTicksMax - vfxCfg.lightning.intervalTicksMin),
    );

    // 2. Rain layers (back and front)
    this.rainBackGfx = scene.add
      .graphics()
      .setScrollFactor(0)
      .setDepth(vfxCfg.rain.backDepth);

    this.rainFrontGfx = scene.add
      .graphics()
      .setScrollFactor(0)
      .setDepth(vfxCfg.rain.frontDepth);

    // 3. Combat sparks layer
    this.combatSparksGfx = scene.add
      .graphics()
      .setScrollFactor(1)
      .setDepth(vfxCfg.combatSparks.depth);

    // 4. Parry flash layer
    this.parryFlashGfx = scene.add
      .graphics()
      .setScrollFactor(1)
      .setDepth(vfxCfg.parryFlash.depth);

    // Initialize 60 rain drops (30 back, 30 front)
    const dropCount = vfxCfg.rain.dropCount;
    for (let i = 0; i < dropCount; i += 1) {
      this.drops.push({
        x: this.rnd() * (width + 60) - 30,
        y: this.rnd() * height,
        isFront: i % 2 === 1,
        splashing: false,
        splashTicks: 0,
      });
    }
  }

  triggerLightning(durationTicks: number = 6): void {
    this.flashTicks = durationTicks;
    this.maxFlashTicks = durationTicks;
  }

  isLightningActive(): boolean {
    return this.flashTicks > 0;
  }

  getLightningAlpha(): number {
    return this.lightningRect.alpha;
  }

  getActiveRainDropsCount(): number {
    return this.drops.filter((d) => !d.splashing).length;
  }

  getActiveSparksCount(): number {
    return this.sparks.length;
  }

  isParryFlashActive(): boolean {
    return this.parryFlashes.length > 0;
  }

  /** `force` shows the sparks even while the inherited effect is off (Kratos' strike hits). */
  emitCombatSparks(worldX: number, worldY: number, count: number = CONFIG.vfx.combatSparks.sparkCount, force = false): void {
    if (!force && !CONFIG.vfx.combatSparks.enabled) {
      return;
    }
    const colors = CONFIG.vfx.combatSparks.colors;
    const maxLife = CONFIG.vfx.combatSparks.lifetimeTicks;
    const speedMin = CONFIG.vfx.combatSparks.speedMin;
    const speedMax = CONFIG.vfx.combatSparks.speedMax;

    for (let i = 0; i < count; i += 1) {
      const angle = this.rnd() * Math.PI * 2;
      const speed = speedMin + this.rnd() * (speedMax - speedMin);
      const color = colors[Math.floor(this.rnd() * colors.length)];
      this.sparks.push({
        x: worldX + (this.rnd() - 0.5) * 6,
        y: worldY + (this.rnd() - 0.5) * 6,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed * 0.8 - 40,
        color,
        life: maxLife,
        maxLife,
      });
    }
  }

  /** Dust thrown low to both sides on the ground (a strike's ground impact). */
  emitDust(worldX: number, worldY: number): void {
    const cfg = CONFIG.vfx.groundImpact;
    for (let i = 0; i < cfg.dustCount; i += 1) {
      const angle = Math.PI + this.rnd() * Math.PI;
      const speed = cfg.dustSpeedMin + this.rnd() * (cfg.dustSpeedMax - cfg.dustSpeedMin);
      this.sparks.push({
        x: worldX + (this.rnd() - 0.5) * 6,
        y: worldY - 1,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed * 0.5,
        color: cfg.dustColors[Math.floor(this.rnd() * cfg.dustColors.length)],
        life: cfg.dustLifeTicks,
        maxLife: cfg.dustLifeTicks,
      });
    }
  }

  emitParryFlash(worldX: number, worldY: number): void {
    this.parryFlashes.push({
      x: worldX,
      y: worldY,
      ticks: CONFIG.vfx.parryFlash.durationTicks,
      maxTicks: CONFIG.vfx.parryFlash.durationTicks,
      maxRadius: CONFIG.vfx.parryFlash.radius,
    });
  }

  update(dt: number, isPaused: boolean = false): void {
    if (isPaused) {
      return;
    }

    const { width, height } = CONFIG.internal;
    const rainCfg = CONFIG.vfx.rain;
    const lightningCfg = CONFIG.vfx.lightning;

    // ========================================================
    // 1. UPDATE LIGHTNING
    // ========================================================
    this.lightningTimer += 1;
    if (this.lightningTimer >= this.nextLightningTick) {
      this.triggerLightning();
      this.lightningTimer = 0;
      this.nextLightningTick = Math.floor(
        lightningCfg.intervalTicksMin +
          this.rnd() * (lightningCfg.intervalTicksMax - lightningCfg.intervalTicksMin),
      );
    }

    if (this.flashTicks > 0) {
      const alphaRatio = this.flashTicks / Math.max(1, this.maxFlashTicks);
      const alpha = lightningCfg.flashAlpha * alphaRatio;
      this.lightningRect.setAlpha(alpha);
      this.flashTicks -= 1;
    } else {
      this.lightningRect.setAlpha(0);
    }

    // ========================================================
    // 2. UPDATE RAIN DROPS AND SPLASHES
    // ========================================================
    const drift = rainCfg.driftSpeed * dt;
    const fall = rainCfg.fallSpeed * dt;
    const groundY = 262;

    this.rainBackGfx.clear();
    this.rainFrontGfx.clear();

    const dx = 1.5; // 6px drop at ~15 deg
    const dy = 5.8;

    for (let i = 0; i < this.drops.length; i += 1) {
      const drop = this.drops[i];

      if (drop.splashing) {
        drop.splashTicks -= 1;
        if (drop.splashTicks <= 0) {
          drop.splashing = false;
          drop.x = this.rnd() * (width + 60) - 30;
          drop.y = -10 - this.rnd() * 20;
        }
      } else {
        drop.x += drift;
        drop.y += fall;

        if (drop.y >= groundY - this.rnd() * 8) {
          drop.splashing = true;
          drop.splashTicks = rainCfg.splashDurationTicks;
          this.splashes.push({
            x: drop.x,
            y: drop.y,
            ticks: rainCfg.splashDurationTicks,
            maxTicks: rainCfg.splashDurationTicks,
            isFront: drop.isFront,
          });
        } else if (drop.x > width + 20 || drop.y > height) {
          drop.x = this.rnd() * (width + 60) - 30;
          drop.y = -10 - this.rnd() * 10;
        }
      }

      if (!drop.splashing && drop.y >= -10 && drop.y <= height) {
        const gfx = drop.isFront ? this.rainFrontGfx : this.rainBackGfx;
        const alpha = drop.isFront ? rainCfg.alphaFront : rainCfg.alphaBack;
        gfx.lineStyle(rainCfg.dropThickness, rainCfg.color, alpha);
        gfx.beginPath();
        gfx.moveTo(drop.x, drop.y);
        gfx.lineTo(drop.x + dx, drop.y + dy);
        gfx.strokePath();
      }
    }

    // Render micro-splashes on the deck
    for (let i = this.splashes.length - 1; i >= 0; i -= 1) {
      const sp = this.splashes[i];
      sp.ticks -= 1;
      if (sp.ticks <= 0) {
        this.splashes.splice(i, 1);
        continue;
      }
      const progress = 1 - sp.ticks / sp.maxTicks;
      const radius = 1 + progress * rainCfg.splashRadius;
      const alpha = (1 - progress) * (sp.isFront ? rainCfg.alphaFront : rainCfg.alphaBack);
      const gfx = sp.isFront ? this.rainFrontGfx : this.rainBackGfx;

      gfx.lineStyle(1, rainCfg.color, alpha);
      gfx.strokeCircle(sp.x, sp.y, radius);
    }

    // ========================================================
    // 3. UPDATE COMBAT SPARKS
    // ========================================================
    this.combatSparksGfx.clear();
    const gravity = 180 * dt;

    for (let i = this.sparks.length - 1; i >= 0; i -= 1) {
      const spk = this.sparks[i];
      spk.life -= 1;
      if (spk.life <= 0) {
        this.sparks.splice(i, 1);
        continue;
      }

      spk.x += spk.vx * dt;
      spk.y += spk.vy * dt;
      spk.vy += gravity;

      const alpha = spk.life / spk.maxLife;
      this.combatSparksGfx.fillStyle(spk.color, alpha);
      this.combatSparksGfx.fillRect(spk.x - 1, spk.y - 1, 2, 2);
    }

    // ========================================================
    // 4. UPDATE PARRY FLASHES
    // ========================================================
    this.parryFlashGfx.clear();
    const parryCfg = CONFIG.vfx.parryFlash;

    for (let i = this.parryFlashes.length - 1; i >= 0; i -= 1) {
      const pf = this.parryFlashes[i];
      pf.ticks -= 1;
      if (pf.ticks <= 0) {
        this.parryFlashes.splice(i, 1);
        continue;
      }

      const progress = 1 - pf.ticks / pf.maxTicks;
      const radius = 2 + progress * (pf.maxRadius - 2);
      const alpha = Math.max(0, 1 - progress);

      // Expanding golden shockwave ring
      this.parryFlashGfx.lineStyle(2, parryCfg.color, alpha);
      this.parryFlashGfx.strokeCircle(pf.x, pf.y, radius);

      // Cross star flare
      const flareLen = (1 - progress) * 8;
      this.parryFlashGfx.lineStyle(1, 0xffffff, alpha);
      this.parryFlashGfx.beginPath();
      this.parryFlashGfx.moveTo(pf.x - flareLen, pf.y);
      this.parryFlashGfx.lineTo(pf.x + flareLen, pf.y);
      this.parryFlashGfx.moveTo(pf.x, pf.y - flareLen);
      this.parryFlashGfx.lineTo(pf.x, pf.y + flareLen);
      this.parryFlashGfx.strokePath();
    }
  }

  destroy(): void {
    this.lightningRect.destroy();
    this.rainBackGfx.destroy();
    this.rainFrontGfx.destroy();
    this.combatSparksGfx.destroy();
    this.parryFlashGfx.destroy();
    this.drops.length = 0;
    this.splashes.length = 0;
    this.sparks.length = 0;
    this.parryFlashes.length = 0;
  }
}
