import Phaser from 'phaser';
import './styles.css';
import { CONFIG } from './config';
import { installHarness } from './dev/harness';
import { InputManager } from './input/InputManager';
import { FrameMetrics } from './metrics';
import { Simulation } from './sim/engine';
import type { PresentationMetrics } from './sim/types';

const simulation = new Simulation();
const metrics = new FrameMetrics();

class ShellScene extends Phaser.Scene {
  private inputManager!: InputManager;
  private debugText: Phaser.GameObjects.Text | null = null;

  constructor() {
    super('shell');
  }

  create(): void {
    this.cameras.main.setBackgroundColor(CONFIG.presentation.background);
    this.inputManager = new InputManager(this);

    this.add
      .text(160, 90, 'Entorno listo', {
        color: CONFIG.presentation.debugText,
        fontFamily: 'monospace',
        fontSize: '10px',
      })
      .setOrigin(0.5);

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
    this.debugText?.setText(`tick ${simulation.world.frame}`);
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
