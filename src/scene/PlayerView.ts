import Phaser from 'phaser';
import {
  AIR_FALL_KEY,
  AIR_RISE_KEY,
  IDLE_KEY,
  IDLE_KEYS,
  PLAYER_KEY,
  ROLL_KEYS,
  RUN_KEY,
  RUN_KEYS,
} from '../assets/manifest';
import { CONFIG, ROLL_TICKS } from '../config';
import { WeaponLayer } from '../entities/WeaponLayer';
import type { Platform } from '../sim/scenarios';
import type { AttackParams } from '../sim/attack';
import type { EntityState } from '../sim/types';

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

  update(player: Readonly<EntityState>, isOpeningChest: boolean): void {
    this.sprite.setPosition(player.x, player.y);
    this.sprite.setFlipX(player.facing === -1);
    this.applyAnimation(player, isOpeningChest);
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

  updateWeapon(
    player: Readonly<EntityState> | null,
    params: AttackParams | null,
    platforms: readonly Platform[],
  ): void {
    this.weaponLayer.update(player, params, platforms);
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

  private applyAnimation(simPlayer: Readonly<EntityState>, isOpeningChest: boolean): void {
    const player = this.sprite;

    if (simPlayer.isDead) {
      this.stopLoop();
      player.setTexture(PLAYER_KEY, 0);
      player.setFlipX(simPlayer.facing === -1);
      player.setRotation(0);
      player.setAlpha(0.65);
      return;
    }

    const { attackPhase, grounded, facing } = simPlayer;
    const speed = Math.abs(simPlayer.vx);
    const rolling = simPlayer.rollPhase !== 'none';

    // Elastic landing compression (squash)
    if (CONFIG.presentation.landingSquash && simPlayer.landingTicks > 0 && grounded && attackPhase === 'none' && !rolling) {
      player.setScale(1.06, 0.92);
    } else {
      player.setScale(1, 1);
    }

    if (attackPhase !== 'none' && !rolling) {
      this.stopLoop();
      player.setTexture(PLAYER_KEY, 0);
      player.anims.timeScale = 1;
      player.setAlpha(1);
      player.setRotation(0);
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
      player.setTexture(simPlayer.vy < 0 ? AIR_RISE_KEY : AIR_FALL_KEY, 0);
      player.anims.timeScale = 1;
      return;
    }
    if (speed > CONFIG.player.run.idleSpeedThreshold) {
      this.playRun(speed);
    } else {
      this.playLoop(IDLE_KEY);
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
