import Phaser from 'phaser';
import './styles.css';
import { CONFIG } from './config';
import { installHarness } from './dev/harness';
import {
  isScaleReferenceVisible,
  toggleScaleReference,
} from './dev/scaleOverlay';
import { FrameMetrics } from './metrics';
import { ShellScene } from './scene/ShellScene';
import { Simulation } from './sim/engine';
import type { PresentationMetrics } from './sim/types';

const simulation = new Simulation();
const metrics = new FrameMetrics();

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
  scene: [new ShellScene(simulation, metrics)],
});

/**
 * Pixel art must scale by whole numbers: a fractional factor makes source
 * pixels uneven. Size the parent to the largest integer multiple of the
 * logical canvas that fits the window (minimum x1); Phaser FIT fills it.
 */
function fitIntegerScale(): void {
  const root = document.getElementById('game-root');
  if (!root) return;
  const availableWidth = window.innerWidth - 32;
  const availableHeight = window.innerHeight - 96;
  const factor = Math.max(
    1,
    Math.floor(
      Math.min(
        availableWidth / CONFIG.internal.width,
        availableHeight / CONFIG.internal.height,
      ),
    ),
  );
  const width = CONFIG.internal.width * factor;
  const height = CONFIG.internal.height * factor;
  root.style.width = `${width}px`;
  root.style.height = `${height}px`;
  game.scale.setParentSize(width, height);
}

fitIntegerScale();
window.addEventListener('resize', fitIntegerScale);

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
