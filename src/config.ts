export const TICK_RATE = 60;
export const TICK_MICROS = Math.floor(1_000_000 / TICK_RATE);

const INTERNAL_WIDTH = 480;
const INTERNAL_HEIGHT = 270;
const PLAYER_SPRITE_WIDTH = 97;
const PLAYER_SPRITE_HEIGHT = 59;

export const CONFIG = {
  internal: {
    width: INTERNAL_WIDTH,
    height: INTERNAL_HEIGHT,
  },
  sim: {
    tickRate: TICK_RATE,
    tickMicros: TICK_MICROS,
    maxCatchUpTicks: 5,
    maxAccumulatorMicros: 5 * TICK_MICROS,
  },
  player: {
    maxSpeed: 140,
    accel: 1050,
    brake: 1650,
    minX: PLAYER_SPRITE_WIDTH / 2,
    maxX: INTERNAL_WIDTH - PLAYER_SPRITE_WIDTH / 2,
    sprite: {
      width: PLAYER_SPRITE_WIDTH,
      height: PLAYER_SPRITE_HEIGHT,
      anchorX: 0.5,
      anchorY: 1,
    },
    run: {
      frames: 4,
      frameRate: 10,
      maxFrameRate: 14,
      idleSpeedThreshold: 1,
    },
    vertical: {
      gravity: 1000,
      jumpSpeed: 380,
      maxFallSpeed: 560,
      coyoteMs: 80,
      jumpBufferMs: 100,
      topY: PLAYER_SPRITE_HEIGHT,
    },
  },
  presentation: {
    background: '#111827',
    debugText: '#d1d5db',
    metricsWindowFrames: 60,
    platformColor: 0x6b4f2a,
    platformEdgeColor: 0x3f2e18,
    platformThickness: 4,
  },
} as const;

export const METRICS_WINDOW_FRAMES = CONFIG.presentation.metricsWindowFrames;

export type GameConfig = typeof CONFIG;
