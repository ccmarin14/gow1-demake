import Phaser from 'phaser';
import './styles.css';
import { CONFIG } from './config';
import { installHarness } from './dev/harness';
import {
  isScaleReferenceVisible,
  toggleScaleReference,
} from './dev/scaleOverlay';
import { installTouchControls } from './input/touchControls';
import { FrameMetrics } from './metrics';
import { ShellScene } from './scene/ShellScene';
import { Simulation } from './sim/engine';
import type { PresentationMetrics } from './sim/types';

const simulation = new Simulation();
const metrics = new FrameMetrics();
const shellScene = new ShellScene(simulation, metrics);

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
  scene: [shellScene],
});

// Botonera de prueba rápida para reiniciar o añadir enemigos en caliente
document.getElementById('btn-restart')?.addEventListener('click', () => {
  shellScene.restartScene();
});
document.getElementById('btn-spawn-legionnaire')?.addEventListener('click', () => {
  shellScene.spawnDebugEnemy('legionnaire');
});
document.getElementById('btn-spawn-archer')?.addEventListener('click', () => {
  shellScene.spawnDebugEnemy('archer');
});

/**
 * Pixel art must scale by whole numbers: a fractional factor makes source
 * pixels uneven. Size the parent to the largest integer multiple of the
 * logical canvas that fits the window (minimum x1); Phaser FIT fills it.
 */
function fitIntegerScale(): void {
  const root = document.getElementById('game-root');
  if (!root) return;
  const touch = document.body.classList.contains('has-touch-controls');
  const availableWidth = window.innerWidth - (touch ? 0 : 32);
  // Touch screens keep a strip at the bottom for the controls.
  const availableHeight = window.innerHeight - (touch ? 72 : 96);
  const fit = Math.min(
    availableWidth / CONFIG.internal.width,
    availableHeight / CONFIG.internal.height,
  );
  // On a phone the screen can be narrower than 480 px: fill it rather than
  // overflow, even if the scale is not a whole number.
  const factor = touch ? fit : Math.max(1, Math.floor(fit));
  const width = CONFIG.internal.width * factor;
  const height = CONFIG.internal.height * factor;
  root.style.width = `${width}px`;
  root.style.height = `${height}px`;
  game.scale.setParentSize(width, height);
}

installTouchControls();
fitIntegerScale();
window.addEventListener('resize', fitIntegerScale);
// Phones settle their viewport late (address bar, rotation): refit then too.
window.addEventListener('load', fitIntegerScale);
window.visualViewport?.addEventListener('resize', fitIntegerScale);

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
