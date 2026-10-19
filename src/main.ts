import Phaser from 'phaser';
import './styles.css';
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
} from './assets/manifest';
import { CONFIG, ROLL_TICKS } from './config';
import { installHarness } from './dev/harness';
import {
  attachScaleReferenceOverlay,
  isScaleReferenceVisible,
  toggleScaleReference,
  updateScaleReference,
} from './dev/scaleOverlay';
import { InputManager } from './input/InputManager';
import { FrameMetrics } from './metrics';
import { Simulation } from './sim/engine';
import type { PresentationMetrics } from './sim/types';
import { PLAYER_ID } from './sim/types';

const simulation = new Simulation();
const metrics = new FrameMetrics();

class ShellScene extends Phaser.Scene {
  private inputManager!: InputManager;
  private debugText: Phaser.GameObjects.Text | null = null;
  private player: Phaser.GameObjects.Sprite | null = null;
  private platformRects: Phaser.GameObjects.Rectangle[] = [];
  private renderedScenario = '';
  private attackHitboxRect: Phaser.GameObjects.Rectangle | null = null;
  private targetRects = new Map<string, Phaser.GameObjects.Rectangle>();

  constructor() {
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

    const spawn = simulation.world.getEntity(PLAYER_ID);
    const { anchorX, anchorY } = CONFIG.player.sprite;
    this.player = this.add
      .sprite(
        spawn ? spawn.x : CONFIG.internal.width / 2,
        spawn ? spawn.y : CONFIG.internal.height,
        IDLE_KEY,
      )
      .setOrigin(anchorX, anchorY);

    if (import.meta.env.DEV) {
      this.debugText = this.add.text(6, 6, 'tick 0', {
        color: CONFIG.presentation.debugText,
        fontFamily: 'monospace',
        fontSize: '8px',
      });
      this.debugText.setDepth(10);
      attachScaleReferenceOverlay(this);
    }
  }

  update(_time: number, delta: number): void {
    metrics.record(delta);
    if (simulation.world.scenarioName !== this.renderedScenario) {
      this.redrawPlatforms();
    }
    const actions = this.inputManager.poll();
    simulation.advance(delta, actions);
    const player = simulation.world.getEntity(PLAYER_ID);
    if (player && this.player) {
      this.player.setPosition(player.x, player.y);
      this.player.setFlipX(player.facing === -1);
      this.applyAnimation(player.attackPhase, player.grounded, Math.abs(player.vx));
    }
    const hitbox = simulation.world.playerAttackHitbox();
    const chain = player ? player.attackChain : 0;
    const hitboxColor = this.hitboxColorForChain(chain);
    if (hitbox) {
      if (!this.attackHitboxRect) {
        this.attackHitboxRect = this.add
          .rectangle(hitbox.x1, hitbox.y1, hitbox.x2 - hitbox.x1, hitbox.y2 - hitbox.y1, hitboxColor, CONFIG.presentation.hitboxAlpha)
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
    this.updateTargets();
    // `import.meta.env.DEV` is statically false in a production build, so the
    // overlay module is dropped from the shipped bundle.
    if (import.meta.env.DEV && player) {
      updateScaleReference(player.x, player.y, player.facing);
    }
    const phase = player ? player.attackPhase : '-';
    this.debugText?.setText(
      `tick ${simulation.world.frame} x=${player ? player.x.toFixed(1) : '-'} atk=${phase} chain=${chain}`,
    );
  }

  private hitboxColorForChain(chain: number): number {
    const { hitboxColor, hitboxColorChain1, hitboxColorChain2 } = CONFIG.presentation;
    if (chain <= 0) {
      return hitboxColor;
    }
    return chain === 1 ? hitboxColorChain1 : hitboxColorChain2;
  }

  private updateTargets(): void {
    const player = simulation.world.getEntity(PLAYER_ID);
    const hits = player ? player.attackHits : [];
    const targets = simulation.world.targetEntities();
    const halfW = CONFIG.player.attack.targetHalfWidth;
    const halfH = CONFIG.player.attack.targetHalfHeight;
    for (const target of targets) {
      let rect = this.targetRects.get(target.id);
      if (!rect) {
        rect = this.add.rectangle(0, 0, halfW * 2, halfH * 2, CONFIG.presentation.targetColor);
        rect.setOrigin(0.5, 0.5).setDepth(1);
        this.targetRects.set(target.id, rect);
      }
      rect.setPosition(target.x, target.y - halfH);
      rect.setFillStyle(hits.includes(target.id) ? CONFIG.presentation.targetHitColor : CONFIG.presentation.targetColor);
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
    const { platformColor, platformEdgeColor, platformThickness } = CONFIG.presentation;
    for (const platform of simulation.world.surfacePlatforms) {
      this.platformRects.push(
        this.add
          .rectangle(
            platform.x1,
            platform.yTop,
            platform.x2 - platform.x1,
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
            platform.x2 - platform.x1,
            1,
            platformEdgeColor,
          )
          .setOrigin(0, 0)
          .setDepth(-2),
      );
    }
    this.renderedScenario = simulation.world.scenarioName;
  }

  private createLoopAnimation(key: string, frames: number, frameRate: number): void {
    if (this.anims.exists(key)) {
      return;
    }
    this.anims.create({
      key,
      frames: this.anims.generateFrameNumbers(key, { start: 0, end: frames - 1 }),
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


  private applyAnimation(
    attackPhase: 'none' | 'startup' | 'active' | 'recovery',
    grounded: boolean,
    speed: number,
  ): void {
    const player = this.player;
    if (!player) {
      return;
    }
    const simPlayer = simulation.world.getEntity(PLAYER_ID);
    const rolling = simPlayer ? simPlayer.rollPhase !== 'none' : false;
    const facing = simPlayer ? simPlayer.facing : 1;
    if (attackPhase !== 'none' && !rolling) {
      this.stopLoop();
      const frame = attackPhase === 'startup' ? 0 : attackPhase === 'active' ? 1 : 2;
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
    if (rolling && this.anims.exists(ROLL_KEY)) {
      this.stopLoop();
      if (player.texture.key !== ROLL_KEY || !player.anims.isPlaying) {
        player.play(ROLL_KEY);
      }
      player.setFlipX(facing === -1);
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

const game = new Phaser.Game({
  type: Phaser.CANVAS,
  parent: 'game-root',
  width: CONFIG.internal.width,
  height: CONFIG.internal.height,
  backgroundColor: CONFIG.presentation.background,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  render: {
    antialias: false,
    pixelArt: true,
    roundPixels: true,
  },
  scene: [ShellScene],
});

installHarness({
  simulation,
  getPresentationMetrics: (): PresentationMetrics => {
    const scene = game.scene.getScene('shell');
    const displayObjects = scene ? scene.children.length : 0;
    return {
      fps: metrics.fps,
      frameDeltaMs: metrics.frameTimeMs,
      displayObjects,
    };
  },
  getScaleReference: () => CONFIG.scale,
  toggleScaleReference,
  isScaleReferenceVisible,
});
