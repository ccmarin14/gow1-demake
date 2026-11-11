import Phaser from 'phaser';
import {
  AIR_DOUBLE_KEY,
  AIR_FALL_KEY,
  AIR_RISE_KEY,
  IDLE_KEY,
  IDLE_KEYS,
  PLAYER_KEY,
  ROLL_KEYS,
  RUN_KEY,
  RUN_KEYS,
  strikeFrameKey,
} from '../assets/manifest';
import { CONFIG, ROLL_TICKS } from '../config';
import { WeaponLayer } from '../entities/WeaponLayer';
import { STRIKES, strikePoseAt } from '../sim/strike';
import type { EntityState, GroundFireState, StrikeSnapshot } from '../sim/types';

/**
 * Presentation of the player: the Kratos sprite and its animation selection,
 * the contact shadow and the weapon layer. It only reads simulation state;
 * all art-specific wiring (frames, anchors, flags) lives here so redrawing the
 * character does not touch `ShellScene`.
 */
export class PlayerView {
  private readonly sprite: Phaser.GameObjects.Sprite;
  private readonly shadow: Phaser.GameObjects.Ellipse;
  private readonly weaponLayer = new WeaponLayer();

  constructor(
    private readonly scene: Phaser.Scene,
    spawn: { x: number; y: number } | undefined,
  ) {
    this.createPlayerAnimations();

    const shadowCfg = CONFIG.presentation.playerShadow;
    this.shadow = scene.add
      .ellipse(0, 0, shadowCfg.width, shadowCfg.height, shadowCfg.color, shadowCfg.alpha)
      .setDepth(-0.1)
      .setVisible(false);

    const { anchorX, anchorY } = CONFIG.player.sprite;
    this.sprite = scene.add
      .sprite(
        spawn ? spawn.x : CONFIG.internal.width / 2,
        spawn ? spawn.y : CONFIG.internal.height,
        PLAYER_KEY,
      )
      .setOrigin(anchorX, anchorY);

    this.weaponLayer.create(scene);
  }

  /** Pauses or resumes the looping animation with the game flow. */
  setPaused(paused: boolean): void {
    const anims = this.sprite.anims;
    if (paused) {
      if (anims.isPlaying) anims.pause();
    } else if (anims.isPaused) {
      anims.resume();
    }
  }

  update(player: Readonly<EntityState>, isOpeningChest: boolean, strike: Readonly<StrikeSnapshot> | null = null): void {
    this.sprite.setPosition(player.x, player.y);
    this.sprite.setFlipX(player.facing === -1);
    this.applyAnimation(player, isOpeningChest, strike);
    this.shadow.setPosition(player.x, player.y - 1);
    this.shadow.setVisible(CONFIG.presentation.playerShadow.enabled && player.grounded && !player.isDead);

    // Damage feedback (tint during hitstun)
    if (player.hitstunTicks > 0) {
      this.sprite.setTint(0xff5555);
    } else {
      this.sprite.clearTint();
    }

    // Blink while invulnerable after a hit
    if (player.hurtInvulTicks > 0 && !player.isDead) {
      this.sprite.setAlpha(Math.floor(player.hurtInvulTicks / 4) % 2 === 0 ? 0.4 : 1.0);
    } else if (!player.isDead) {
      this.sprite.setAlpha(1.0);
    }
  }

  updateWeapon(player: Readonly<EntityState> | null, strike: Readonly<StrikeSnapshot> | null = null): void {
    this.weaponLayer.update(player, this.sprite.texture.key, strike);
  }

  /** Fire left burning on the ground by strikes (Plume). */
  updateGroundFires(fires: readonly GroundFireState[]): void {
    this.weaponLayer.drawGroundFires(fires);
  }

  private createPlayerAnimations(): void {
    const defs: { key: string; frames: readonly string[]; frameRate: number }[] = [
      { key: IDLE_KEY, frames: IDLE_KEYS, frameRate: CONFIG.player.idle.frameRate },
      { key: RUN_KEY, frames: RUN_KEYS, frameRate: CONFIG.player.run.frameRate },
    ];
    for (const def of defs) {
      if (this.scene.anims.exists(def.key)) {
        continue;
      }
      // A single drawn frame is not an animation: render it statically instead.
      if (def.frames.length < 2) {
        continue;
      }
      if (!def.frames.every((frame) => this.scene.textures.exists(frame))) {
        continue;
      }
      this.scene.anims.create({
        key: def.key,
        frames: def.frames.map((frame) => ({ key: frame })),
        frameRate: def.frameRate,
        repeat: -1,
      });
    }
  }

  private applyAnimation(
    simPlayer: Readonly<EntityState>,
    isOpeningChest: boolean,
    strike: Readonly<StrikeSnapshot> | null,
  ): void {
    const player = this.sprite;

    if (simPlayer.isDead) {
      this.stopLoop();
      player.setTexture(PLAYER_KEY, 0);
      player.setFlipX(simPlayer.facing === -1);
      player.setRotation(0);
      player.setAlpha(0.65);
      return;
    }

    const { grounded, facing } = simPlayer;
    const speed = Math.abs(simPlayer.vx);
    const rolling = simPlayer.rollPhase !== 'none';

    // Elastic landing compression (squash)
    if (CONFIG.presentation.landingSquash && simPlayer.landingTicks > 0 && grounded && !rolling) {
      player.setScale(1.06, 0.92);
    } else {
      player.setScale(1, 1);
    }

    if (strike) {
      // Strike body pose by phase (D-37); the weapon layer draws the blades.
      this.stopLoop();
      const poseKey =
        strike.id === 'harpoon' && grounded
          ? strike.tick < 6
            ? 'kratos-grab-lunge'
            : strike.tick < 11
              ? 'kratos-grab-throw-b'
              : 'kratos-grab-slam-b'
          : strikeFrameKey(strikePoseAt(STRIKES[strike.id], strike.tick));
      player.setTexture(poseKey, 0);
      player.setFlipX(strike.facing === -1);
      player.setRotation(0);
      player.setAlpha(1);
      player.anims.timeScale = 1;
      return;
    }
    if (simPlayer.grabPhase !== 'none' && !rolling) {
      this.stopLoop();
      const grabKey = this.selectGrabFrameKey(simPlayer);
      player.setTexture(this.scene.textures.exists(grabKey) ? grabKey : PLAYER_KEY, 0);
      player.setFlipX(facing === -1);
      player.setRotation(0);
      player.setAlpha(1);
      player.anims.timeScale = 1;
      return;
    }
    if (simPlayer.guardPhase !== 'none' && !rolling) {
      this.stopLoop();
      player.setTexture(PLAYER_KEY, 0);
      player.setFlipX(facing === -1);
      player.setRotation(0);
      player.setAlpha(1);
      player.anims.timeScale = 1;
      return;
    }
    if (isOpeningChest && !rolling) {
      this.stopLoop();
      player.setTexture(PLAYER_KEY, 0);
      player.setFlipX(facing === -1);
      player.setRotation(0);
      player.setAlpha(1);
      player.anims.timeScale = 1;
      return;
    }
    if (rolling) {
      this.stopLoop();
      // Spread the roll frames evenly over the roll's ticks.
      const step = Math.min(ROLL_KEYS.length - 1, Math.floor((simPlayer.rollTicks * ROLL_KEYS.length) / ROLL_TICKS));
      player.setTexture(ROLL_KEYS[step], 0);
      player.setFlipX(facing === -1);
      player.setRotation(0);
      player.setAlpha(1);
      player.anims.timeScale = 1;
      return;
    }
    player.setAlpha(1);
    player.setRotation(0);
    if (!grounded) {
      // Stop the run loop first: a playing animation would overwrite the texture.
      this.stopLoop();
      const rising = simPlayer.vy < 0;
      const airKey = !rising ? AIR_FALL_KEY : simPlayer.jumpsUsed >= 2 ? AIR_DOUBLE_KEY : AIR_RISE_KEY;
      player.setTexture(airKey, 0);
      player.anims.timeScale = 1;
      return;
    }
    if (speed > CONFIG.player.run.idleSpeedThreshold) {
      this.playRun(speed);
    } else {
      this.playLoop(IDLE_KEY);
    }
  }

  private selectGrabFrameKey(simPlayer: Readonly<EntityState>): string {
    const t = simPlayer.grabTicks;
    switch (simPlayer.grabPhase) {
      case 'whiff': {
        return t <= (CONFIG.player.grab.whiffLungeTicks ?? 8) ? 'kratos-grab-lunge' : 'kratos-sq1-e';
      }
      case 'hold':
      case 'finisher_qte': {
        return t < (CONFIG.player.grab.lungeTicks ?? 2) ? 'kratos-grab-lunge' : 'kratos-grab-hold';
      }
      case 'pummel': {
        // En Grab 1 (TAP ○ REPEATEDLY):
        // ticks 0..3: recogida hacia atrás con espada armada (grab-hold)
        // ticks 4..8: estocada frontal profunda clavando la Espada del Caos en el torso (grab-lunge)
        // ticks 9..13: recuperación a posición de sujeción (grab-hold)
        return t >= 4 && t <= 8 ? 'kratos-grab-lunge' : 'kratos-grab-hold';
      }
      case 'throw': {
        return t < 6 ? 'kratos-grab-throw-a' : 'kratos-grab-throw-b';
      }
      case 'break': {
        return t < 11 ? 'kratos-grab-break-a' : 'kratos-grab-break-b';
      }
      case 'slam':
      case 'finisher_slam': {
        return t < 10 ? 'kratos-grab-slam-a' : 'kratos-grab-slam-b';
      }
      case 'recovery': {
        return t < 4 ? 'kratos-sq1-e' : PLAYER_KEY;
      }
      default:
        return PLAYER_KEY;
    }
  }

  private stopLoop(): void {
    if (this.sprite.anims.isPlaying) {
      this.sprite.anims.stop();
    }
  }

  private playLoop(key: string): void {
    if (!this.scene.anims.exists(key)) {
      this.sprite.anims.stop();
      this.sprite.setTexture(PLAYER_KEY, 0);
      this.sprite.anims.timeScale = 1;
      return;
    }
    if (this.sprite.anims.currentAnim?.key !== key || !this.sprite.anims.isPlaying) {
      this.sprite.play(key);
    }
    this.sprite.anims.timeScale = 1;
  }

  private playRun(speed: number): void {
    const { frameRate, stridePx, minTimeScale, maxTimeScale } = CONFIG.player.run;
    if (!this.scene.anims.exists(RUN_KEY)) {
      this.sprite.anims.stop();
      this.sprite.setTexture(PLAYER_KEY, 0);
      return;
    }
    if (this.sprite.anims.currentAnim?.key !== RUN_KEY || !this.sprite.anims.isPlaying) {
      this.sprite.play(RUN_KEY);
    }
    // Zero-slide cadence: one loop must cover `stridePx` of ground.
    const cyclesPerSecond = speed / stridePx;
    const target = (cyclesPerSecond * RUN_KEYS.length) / frameRate;
    this.sprite.anims.timeScale = Phaser.Math.Clamp(target, minTimeScale, maxTimeScale);
  }
}
