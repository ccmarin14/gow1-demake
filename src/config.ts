import { deriveScaleReference } from './scale';

export const TICK_RATE = 60;
export const TICK_MICROS = Math.floor(1_000_000 / TICK_RATE);

const INTERNAL_WIDTH = 480;
const INTERNAL_HEIGHT = 270;
const PLAYER_SPRITE_WIDTH = 97;
const PLAYER_SPRITE_HEIGHT = 59;

// Kept as a named constant so CONFIG.player and CONFIG.scale read the same
// source: the reference scale is derived, never hand-copied.
const PLAYER: any = {
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
    frames: 6,
    frameRate: 10,
    maxFrameRate: 14,
    idleSpeedThreshold: 1,
  },
  idle: {
    frames: 2,
    frameRate: 3,
  },
  air: {
    frames: 2,
    frameRate: 6,
  },
  vertical: {
    gravity: 1000,
    jumpSpeed: 380,
    maxFallSpeed: 560,
    coyoteMs: 80,
    jumpBufferMs: 100,
    // Total upward impulses available before touching ground again. `2` keeps
    // the ground jump and adds one air jump (double jump) on a fresh press.
    maxJumps: 2,
    topY: PLAYER_SPRITE_HEIGHT,
  },
  /**
   * Weapon identity. The Blades of Chaos strike with chained blades: the hit
   * area is an arc swept from the grip (hands), not a box glued to the body.
   * Angles in the combo arcs are degrees, `0` = horizontal forward, positive
   * = upward; converted to radians by the consumers (sim and scale).
   */
  weapon: {
    id: 'blades-of-chaos',
    name: 'Cuchillas del Caos',
    /** Height above the feet line where the chains leave the hands. */
    gripOffsetY: 30,
  },
  attack: {
    targetHalfWidth: 14,
    targetHalfHeight: 24,
    maxChain: 3,
    combo: [
      {
        startupMs: 83,
        activeMs: 67,
        recoveryMs: 117,
        // Horizontal slash rising slightly: the chains extend forward.
        arc: { startDeg: -10, endDeg: 25, radius: 32, width: 16, thickness: 14 },
      },
      {
        startupMs: 50,
        activeMs: 67,
        recoveryMs: 100,
        // Backhand sweep from high to low, a bit farther out.
        arc: { startDeg: 40, endDeg: -15, radius: 36, width: 16, thickness: 14 },
      },
      {
        startupMs: 50,
        activeMs: 67,
        recoveryMs: 117,
        // Overhead slam with the longest chain reach.
        arc: { startDeg: 55, endDeg: -35, radius: 40, width: 18, thickness: 16 },
      },
    ],
  },
  dodge: {
    durationMs: 250,
    invulMs: 250,
    rollSpeed: 280, // ~2.0 * maxSpeed aprox (140)
  },
} as const;

export const CONFIG: any = {
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
  player: PLAYER,
  // Reference scale for map/level stages; every field is computed from the
  // values above (see `src/scale.ts`).
  scale: deriveScaleReference({
    tickRate: TICK_RATE,
    canvas: { width: INTERNAL_WIDTH, height: INTERNAL_HEIGHT },
    sprite: PLAYER.sprite,
    movement: { maxSpeed: PLAYER.maxSpeed },
    jump: PLAYER.vertical,
    attack: {
      maxChain: PLAYER.attack.maxChain,
      gripOffsetY: PLAYER.weapon.gripOffsetY,
      combo: PLAYER.attack.combo,
    },
  }),
  presentation: {
    background: '#111827',
    debugText: '#d1d5db',
    metricsWindowFrames: 60,
    platformColor: 0x6b4f2a,
    platformEdgeColor: 0x3f2e18,
    platformThickness: 4,
    targetColor: 0x8a9bb0,
    targetHitColor: 0xff5533,
    hitboxColor: 0xff0000,
    hitboxColorChain1: 0xff8800,
    hitboxColorChain2: 0xffee00,
    hitboxAlpha: 0.25,
    scaleFeetColor: 0x22d3ee,
    scaleSilhouetteColor: 0xfacc15,
    scaleJumpColor: 0x4ade80,
    scaleAttackColor: 0xf472b6,
    scaleReferenceAlpha: 0.9,
    scaleReferenceFillAlpha: 0.12,
    scaleReferenceThickness: 1,
  },
  rollTicks: 15,
  rollDurationMs: 250,
  rollInvulTicks: 15,
  rollInvulMs: 250,
} as const;

export const ROLL_TICKS = 15;
export const ROLL_DURATION_MS = 250;
export const ROLL_INVUL_TICKS = 15;
export const ROLL_INVUL_MS = 250;
export const METRICS_WINDOW_FRAMES = CONFIG.presentation.metricsWindowFrames;

export type GameConfig = typeof CONFIG;
