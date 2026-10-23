import Phaser from 'phaser';
import {
  AIR_KEY,
  ASSET_DOMAINS,
  ASSETS,
  ATTACK_KEY,
  BACKGROUND_KEY,
  IDLE_KEY,
  PROVISIONAL_ART,
  ROLL_KEY,
  RUN_KEY,
} from '../assets/manifest';
import { CONFIG, ROLL_TICKS } from '../config';
import {
  attachScaleReferenceOverlay,
  isScaleReferenceVisible,
  updateScaleReference,
} from '../dev/scaleOverlay';
import { WeaponLayer } from '../entities/WeaponLayer';
import { InputManager } from '../input/InputManager';
import type { FrameMetrics } from '../metrics';
import type { Simulation } from '../sim/engine';
import type { EntityState } from '../sim/types';
import { PLAYER_ID } from '../sim/types';

export class ShellScene extends Phaser.Scene {
  private inputManager!: InputManager;
  private debugText: Phaser.GameObjects.Text | null = null;
  private lastDebugText = '';
  private player: Phaser.GameObjects.Sprite | null = null;
  private platformRects: Phaser.GameObjects.Rectangle[] = [];
  private renderedScenario = '';
  private attackHitboxRect: Phaser.GameObjects.Rectangle | null = null;
  private targetRects = new Map<string, Phaser.GameObjects.Rectangle>();
  private readonly weaponLayer = new WeaponLayer();

  constructor(
    private readonly simulation: Simulation,
    private readonly metrics: FrameMetrics,
  ) {
    super('shell');
  }

  preload(): void {
    for (const domain of ASSET_DOMAINS) {
      for (const asset of ASSETS[domain]) {
        if (asset.type === 'spritesheet') {
          this.load.spritesheet(asset.key, asset.path, {
            frameWidth: asset.frameWidth!,
            frameHeight: asset.frameHeight!,
          });
        } else {
          this.load.image(asset.key, asset.path);
        }
      }
    }
    this.load.spritesheet('legionnaire', 'assets/characters/legionnaire.png', {
      frameWidth: 64,
      frameHeight: 54,
    });
  }

  create(): void {
    this.cameras.main.setBackgroundColor(CONFIG.presentation.background);
    this.inputManager = new InputManager(this);

    this.add.image(0, 0, BACKGROUND_KEY).setOrigin(0, 0).setDepth(-3);

    this.redrawPlatforms();

    this.add
      .text(
        CONFIG.internal.width / 2,
        20,
        PROVISIONAL_ART ? 'Combo ligero · provisional' : 'Combo ligero',
        {
          color: CONFIG.presentation.debugText,
          fontFamily: 'monospace',
          fontSize: '10px',
        },
      )
      .setOrigin(0.5)
      .setDepth(-1);

    this.createLoopAnimation(RUN_KEY, CONFIG.player.run.frames, CONFIG.player.run.frameRate);
    this.createLoopAnimation(IDLE_KEY, CONFIG.player.idle.frames, CONFIG.player.idle.frameRate);
    this.createLoopAnimation(AIR_KEY, CONFIG.player.air.frames, CONFIG.player.air.frameRate);
    this.createRollAnimation();

    const spawn = this.simulation.world.peekEntity(PLAYER_ID);
    const { anchorX, anchorY } = CONFIG.player.sprite;
    this.player = this.add
      .sprite(
        spawn ? spawn.x : CONFIG.internal.width / 2,
        spawn ? spawn.y : CONFIG.internal.height,
        IDLE_KEY,
      )
      .setOrigin(anchorX, anchorY);

    this.weaponLayer.create(this);

    if (import.meta.env.DEV) {
      this.lastDebugText = 'tick 0';
      this.debugText = this.add.text(6, 6, this.lastDebugText, {
        color: CONFIG.presentation.debugText,
        fontFamily: 'monospace',
        fontSize: '8px',
      });
      this.debugText.setDepth(10);
      attachScaleReferenceOverlay(this);
    }
  }

  update(_time: number, delta: number): void {
    this.metrics.record(delta);
    if (this.simulation.world.scenarioName !== this.renderedScenario) {
      this.redrawPlatforms();
    }
    const actions = this.inputManager.poll();
    this.simulation.advance(delta, actions);
    const player = this.simulation.world.peekEntity(PLAYER_ID) ?? null;
    if (player && this.player) {
      this.player.setPosition(player.x, player.y);
      this.player.setFlipX(player.facing === -1);
      this.applyAnimation(player);
    }
    const hitbox = this.simulation.world.playerAttackHitbox();
    const chain = player ? player.attackChain : 0;
    const hitboxColor = this.hitboxColorForChain(chain);
    if (hitbox && import.meta.env.DEV && isScaleReferenceVisible()) {
      if (!this.attackHitboxRect) {
        this.attackHitboxRect = this.add
          .rectangle(
            hitbox.x1,
            hitbox.y1,
            hitbox.x2 - hitbox.x1,
            hitbox.y2 - hitbox.y1,
            hitboxColor,
            CONFIG.presentation.hitboxAlpha,
          )
          .setOrigin(0, 0)
          .setDepth(5);
      } else {
        this.attackHitboxRect.setPosition(hitbox.x1, hitbox.y1);
        this.attackHitboxRect.setSize(hitbox.x2 - hitbox.x1, hitbox.y2 - hitbox.y1);
        this.attackHitboxRect.setFillStyle(hitboxColor, CONFIG.presentation.hitboxAlpha);
        this.attackHitboxRect.setVisible(true);
      }
    } else if (this.attackHitboxRect) {
      this.attackHitboxRect.setVisible(false);
    }
    const attackParams = player ? this.simulation.world.playerAttackParams() : null;
    this.weaponLayer.update(player, attackParams, this.simulation.world.surfacePlatforms);
    this.updateTargets(player);
    if (player && player.groundImpactTicks > 0) {
      const shakePx = CONFIG.player.attack.groundImpact.shakePx;
      const dy = player.groundImpactTicks % 2 === 1 ? shakePx : -shakePx;
      this.cameras.main.setScroll(0, dy);
    } else {
      this.cameras.main.setScroll(0, 0);
    }
    // `import.meta.env.DEV` is statically false in a production build, so the
    // overlay module is dropped from the shipped bundle.
    if (import.meta.env.DEV && player) {
      updateScaleReference(player.x, player.y, player.facing);
    }
    if (this.debugText) {
      const phase = player ? player.attackPhase : '-';
      const grd = player && player.guardPhase !== 'none' ? ` grd=${player.guardPhase}:${player.guardTicks}${player.parryActive ? '(P)' : ''}` : '';
      const nextText = `tick ${this.simulation.world.frame} x=${player ? player.x.toFixed(1) : '-'} atk=${phase} chain=${chain}${grd}`;
      if (nextText !== this.lastDebugText) {
        this.lastDebugText = nextText;
        this.debugText.setText(nextText);
      }
    }
  }

  private hitboxColorForChain(chain: number): number {
    const { hitboxColor, hitboxColorChain1, hitboxColorChain2 } = CONFIG.presentation;
    if (chain <= 0) {
      return hitboxColor;
    }
    return chain === 1 ? hitboxColorChain1 : hitboxColorChain2;
  }

  private updateTargets(player: Readonly<EntityState> | null): void {
    const hits = player ? player.attackHits : [];
    const targets = this.simulation.world.peekTargets();
    const halfW = CONFIG.player.attack.targetHalfWidth;
    const halfH = CONFIG.player.attack.targetHalfHeight;
    for (const target of targets) {
      let rect = this.targetRects.get(target.id);
      if (!rect) {
        rect = this.add.rectangle(0, 0, halfW * 2, halfH * 2, CONFIG.presentation.targetColor);
        rect.setOrigin(0.5, 0.5).setDepth(1);
        this.targetRects.set(target.id, rect);
      }
      const shakeX = target.hitstunTicks > 0 && target.hitstunTicks % 2 === 1 ? 1 : 0;
      rect.setPosition(target.x + shakeX, target.y - halfH);
      rect.setFillStyle(
        hits.includes(target.id)
          ? CONFIG.presentation.targetHitColor
          : CONFIG.presentation.targetColor,
      );
    }
  }

  private redrawPlatforms(): void {
    for (const rect of this.platformRects) {
      rect.destroy();
    }
    this.platformRects = [];
    for (const rect of this.targetRects.values()) {
      rect.destroy();
    }
    this.targetRects.clear();
    const {
      platformColor,
      platformHighlightColor,
      platformEdgeColor,
      platformThickness,
    } = CONFIG.presentation;
    for (const platform of this.simulation.world.surfacePlatforms) {
      const width = platform.x2 - platform.x1;
      this.platformRects.push(
        this.add
          .rectangle(
            platform.x1,
            platform.yTop,
            width,
            platformThickness,
            platformColor,
          )
          .setOrigin(0, 0)
          .setDepth(-2),
      );
      this.platformRects.push(
        this.add
          .rectangle(
            platform.x1,
            platform.yTop,
            width,
            1,
            platformHighlightColor,
          )
          .setOrigin(0, 0)
          .setDepth(-2),
      );
      this.platformRects.push(
        this.add
          .rectangle(
            platform.x1,
            platform.yTop + platformThickness - 1,
            width,
            1,
            platformEdgeColor,
          )
          .setOrigin(0, 0)
          .setDepth(-2),
      );
      for (let seamX = platform.x1 + 32; seamX < platform.x2; seamX += 32) {
        this.platformRects.push(
          this.add
            .rectangle(
              seamX,
              platform.yTop,
              1,
              platformThickness,
              platformEdgeColor,
            )
            .setOrigin(0, 0)
            .setDepth(-2),
        );
      }
    }
    this.renderedScenario = this.simulation.world.scenarioName;
  }

  private createLoopAnimation(key: string, frames: number, frameRate: number): void {
    if (this.anims.exists(key)) {
      return;
    }
    const endFrame = key === RUN_KEY ? 5 : frames - 1;
    this.anims.create({
      key,
      frames: this.anims.generateFrameNumbers(key, { start: 0, end: endFrame }),
      frameRate,
      repeat: -1,
    });
  }

  private createRollAnimation(): void {
    if (this.anims.exists(ROLL_KEY)) {
      return;
    }
    const texture = this.textures.get(ROLL_KEY);
    if (!texture || !this.textures.exists(ROLL_KEY)) {
      return;
    }
    // The spritesheet may not be loaded yet when the texture is missing; the
    // animation would then reference zero frames and Phaser would later fail
    // reading `duration` from an undefined frame.
    //
    // `frameTotal` counts the syntetic `__BASE` frame as well, so the last real
    // frame is `frameTotal - 2`. Using `frameTotal - 1` requests a frame that
    // does not exist and Phaser warns "Frame not found in texture".
    const lastFrame = texture.frameTotal - 2;
    if (lastFrame < 0) {
      return;
    }
    const frameCount = lastFrame + 1;
    const frameRate = Math.max(1, frameCount / (ROLL_TICKS / 60));
    this.anims.create({
      key: ROLL_KEY,
      frames: this.anims.generateFrameNumbers(ROLL_KEY, { start: 0, end: lastFrame }),
      frameRate,
      repeat: 0,
    });
  }

  private applyAnimation(simPlayer: Readonly<EntityState>): void {
    const player = this.player;
    if (!player) {
      return;
    }
    const { attackPhase, grounded, facing } = simPlayer;
    const speed = Math.abs(simPlayer.vx);
    const rolling = simPlayer.rollPhase !== 'none';

    // Elastic landing compression (squash)
    if (simPlayer.landingTicks > 0 && grounded && attackPhase === 'none' && !rolling) {
      player.setScale(1.06, 0.92);
    } else {
      player.setScale(1, 1);
    }

    if (attackPhase !== 'none' && !rolling) {
      this.stopLoop();
      let frame = 0;
      if (attackPhase === 'startup') {
        frame = 0;
      } else if (attackPhase === 'active') {
        const moveId = simPlayer.attackMove !== 'none' ? simPlayer.attackMove : 'light_1';
        const moveDef = CONFIG.player.attack.moves[moveId];
        frame = moveDef ? moveDef.poseFrame : 1;
      } else if (attackPhase === 'recovery') {
        const moveId = simPlayer.attackMove !== 'none' ? simPlayer.attackMove : 'light_1';
        const moveDef = CONFIG.player.attack.moves[moveId];
        frame = simPlayer.attackTicks <= 2 ? (moveDef ? moveDef.poseFrame : 1) : 2;
      }
      if (player.texture.key !== ATTACK_KEY) {
        player.setTexture(ATTACK_KEY, frame);
      } else {
        player.setFrame(frame);
      }
      player.anims.timeScale = 1;
      player.setAlpha(1);
      player.setRotation(0);
      return;
    }
    if (simPlayer.guardPhase !== 'none' && !rolling) {
      this.stopLoop();
      // Defensive stance (compact crouch with blades ready in ATTACK_KEY frame 0)
      const frame = 0;
      if (player.texture.key !== ATTACK_KEY) {
        player.setTexture(ATTACK_KEY, frame);
      } else {
        player.setFrame(frame);
      }
      player.setFlipX(facing === -1);
      player.setRotation(0);
      player.setAlpha(1);
      player.anims.timeScale = 1;
      return;
    }
    if (rolling && this.anims.exists(ROLL_KEY)) {
      if (player.texture.key !== ROLL_KEY || !player.anims.isPlaying) {
        // Only (re)start the clip on entry. Calling `stopLoop()` here would kill
        // the animation on every tick and `play()` would restart it from frame 0,
        // freezing the roll on its first pose (which reads as a plain dash).
        player.play(ROLL_KEY);
      }
      player.setFlipX(facing === -1);
      // Keep rotation at 0 so the feet/ground anchor (0.5, 1.0) never pivots the
      // sprite below the floor; the 4-frame somersault spritesheet (`ROLL_KEY`)
      // depicts the ground roll directly within the frame box.
      player.setRotation(0);
      player.setAlpha(1);
      player.anims.timeScale = 1;
      return;
    }
    player.setAlpha(1);
    player.setRotation(0);
    if (!grounded) {
      this.playLoop(AIR_KEY);
      return;
    }
    // High-speed turnaround skid on ground
    if (simPlayer.skidTicks > 0) {
      this.stopLoop();
      if (player.texture.key !== RUN_KEY) {
        player.setTexture(RUN_KEY, 6);
      } else {
        player.setFrame(6);
      }
      player.setFlipX(facing === -1);
      return;
    }
    if (speed > CONFIG.player.run.idleSpeedThreshold) {
      this.playRun(speed);
    } else {
      this.playLoop(IDLE_KEY);
    }
  }

  private stopLoop(): void {
    if (this.player?.anims.isPlaying) {
      this.player.anims.stop();
    }
  }

  private playLoop(key: string): void {
    if (!this.player) {
      return;
    }
    if (this.player.anims.currentAnim?.key !== key || !this.player.anims.isPlaying) {
      this.player.play(key);
    }
    this.player.anims.timeScale = 1;
  }

  private playRun(speed: number): void {
    if (!this.player) {
      return;
    }
    if (this.player.anims.currentAnim?.key !== RUN_KEY || !this.player.anims.isPlaying) {
      this.player.play(RUN_KEY);
    }
    const { frameRate, maxFrameRate } = CONFIG.player.run;
    const ratio = Phaser.Math.Clamp(speed / CONFIG.player.maxSpeed, 0, 1);
    const rate = frameRate + (maxFrameRate - frameRate) * ratio;
    this.player.anims.timeScale = rate / frameRate;
  }
}
