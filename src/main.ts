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
