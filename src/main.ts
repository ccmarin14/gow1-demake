import Phaser from 'phaser';
import './styles.css';
import {
  ASSET_DOMAINS,
  ASSETS,
  BACKGROUND_KEY,
  PLAYER_KEY,
  PROVISIONAL_ART,
  RUN_KEY,
} from './assets/manifest';
import { CONFIG } from './config';
import { installHarness } from './dev/harness';
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

    this.add.image(0, 0, BACKGROUND_KEY).setOrigin(0, 0);

    this.add
      .text(
        CONFIG.internal.width / 2,
        20,
        PROVISIONAL_ART ? 'Carrera · placeholder provisional' : 'Movimiento horizontal',
        {
          color: CONFIG.presentation.debugText,
          fontFamily: 'monospace',
          fontSize: '10px',
        },
      )
      .setOrigin(0.5);

    if (!this.anims.exists(RUN_KEY)) {
      this.anims.create({
        key: RUN_KEY,
        frames: this.anims.generateFrameNumbers(RUN_KEY, {
          start: 0,
          end: CONFIG.player.run.frames - 1,
        }),
        frameRate: CONFIG.player.run.frameRate,
        repeat: -1,
      });
    }

    const spawn = simulation.world.getEntity(PLAYER_ID);
    const { anchorX, anchorY } = CONFIG.player.sprite;
    this.player = this.add
      .sprite(
        spawn ? spawn.x : CONFIG.internal.width / 2,
        spawn ? spawn.y : CONFIG.internal.height,
        PLAYER_KEY,
      )
      .setOrigin(anchorX, anchorY);

    if (import.meta.env.DEV) {
      this.debugText = this.add.text(6, 6, 'tick 0', {
        color: CONFIG.presentation.debugText,
        fontFamily: 'monospace',
        fontSize: '8px',
      });
    }
  }

  update(_time: number, delta: number): void {
    metrics.record(delta);
    const actions = this.inputManager.poll();
    simulation.advance(delta, actions);
    const player = simulation.world.getEntity(PLAYER_ID);
    if (player && this.player) {
      this.player.setPosition(player.x, player.y);
      this.player.setFlipX(player.facing === -1);
      this.updateRunAnimation(Math.abs(player.vx));
    }
    this.debugText?.setText(
      `tick ${simulation.world.frame} x=${player ? player.x.toFixed(1) : '-'}`,
    );
  }

  private updateRunAnimation(speed: number): void {
    if (!this.player) {
      return;
    }
    const { frameRate, maxFrameRate, idleSpeedThreshold } = CONFIG.player.run;
    if (speed > idleSpeedThreshold) {
      if (
        this.player.anims.currentAnim?.key !== RUN_KEY ||
        !this.player.anims.isPlaying
      ) {
        this.player.play(RUN_KEY);
      }
      const ratio = Phaser.Math.Clamp(speed / CONFIG.player.maxSpeed, 0, 1);
      const rate = frameRate + (maxFrameRate - frameRate) * ratio;
      this.player.anims.timeScale = rate / frameRate;
    } else {
      if (this.player.anims.isPlaying) {
        this.player.anims.stop();
      }
      if (this.player.texture.key !== PLAYER_KEY) {
        this.player.setTexture(PLAYER_KEY);
      }
      this.player.anims.timeScale = 1;
    }
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
});
