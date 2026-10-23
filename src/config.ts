import { deriveScaleReference } from './scale';

export const TICK_RATE = 60;
export const TICK_MICROS = Math.floor(1_000_000 / TICK_RATE);

const INTERNAL_WIDTH = 480;
const INTERNAL_HEIGHT = 270;
const PLAYER_SPRITE_WIDTH = 97;
const PLAYER_SPRITE_HEIGHT = 59;

/**
 * Level-1 move table (God of War 1, PS2 -> 2D). Timings are TICKS at 60 Hz.
 * Arc angles are degrees, `0` = horizontal forward, POSITIVE = UP (sim
 * convention). The plan table lists them in screen convention (positive =
 * down), so every angle here is the plan value negated. `heavy_slam` and
 * `plume_of_prometheus` end lower than the plan values (-60 / -65 instead of
 * -20 / -22 up-convention) because the grip is 30 px above the feet: a blade
 * of radius 50-56 only reaches `yTop` below roughly -34 deg.
 *
 * Per move: `hitstop` (ticks both sides freeze on impact), `knockbackVx`
 * (multiplied by the attacker `facing`), `launchVy` (target vy, 0 = leave),
 * `selfVy` (attacker vy applied at active start; ascension only when K is
 * held), `lungeVx` (attacker vx at active start), `airBrake` (air light:
 * `vy = max(vy, -60) * 0.35` on start), `groundImpact` (emits the yTop
 * impact event), `poseFrame` (frame of kratos-attack.png in the active
 * phase) and `chain` (index reported in `attackChain`).
 */
const MOVES = {
  light_1: {
    chain: 0, startup: 4, active: 7, recovery: 7, poseFrame: 1,
    arc: { startDeg: -30, endDeg: 35, radius: 76, width: 18, thickness: 16 },
    hitstop: 2, knockbackVx: 85, launchVy: 0, lungeVx: 45,
  },
  light_2: {
    chain: 1, startup: 3, active: 7, recovery: 7, poseFrame: 6,
    arc: { startDeg: 40, endDeg: -28, radius: 82, width: 18, thickness: 16 },
    hitstop: 2, knockbackVx: 95, launchVy: 0, lungeVx: 55,
  },
  light_3: {
    chain: 2, startup: 4, active: 8, recovery: 10, poseFrame: 2,
    arc: { startDeg: 55, endDeg: -35, radius: 96, width: 22, thickness: 18 },
    hitstop: 3, knockbackVx: 180, launchVy: 0, lungeVx: 90,
  },
  light_4: {
    chain: 3, startup: 4, active: 8, recovery: 10, poseFrame: 6,
    arc: { startDeg: -40, endDeg: 45, radius: 98, width: 22, thickness: 18 },
    hitstop: 3, knockbackVx: 160, launchVy: 0, lungeVx: 60,
  },
  spirit_of_hercules: {
    chain: 3, startup: 6, active: 9, recovery: 14, poseFrame: 2,
    arc: { startDeg: 30, endDeg: -45, radius: 105, width: 26, thickness: 22 },
    hitstop: 4, knockbackVx: 220, launchVy: -120, lungeVx: 75, groundImpact: true,
  },
  plume_of_prometheus: {
    chain: 2, startup: 5, active: 9, recovery: 12, poseFrame: 3,
    arc: { startDeg: 85, endDeg: -65, radius: 110, width: 24, thickness: 20 },
    hitstop: 4, knockbackVx: 140, launchVy: -240, lungeVx: 70, groundImpact: true,
  },
  heavy_slam: {
    chain: 0, startup: 7, active: 8, recovery: 11, poseFrame: 3,
    arc: { startDeg: 75, endDeg: -60, radius: 95, width: 22, thickness: 18 },
    hitstop: 3, knockbackVx: 130, launchVy: 0, lungeVx: 60, groundImpact: true,
  },
  ascension: {
    chain: 0, startup: 6, active: 8, recovery: 10, poseFrame: 4,
    arc: { startDeg: -35, endDeg: 80, radius: 88, width: 20, thickness: 18 },
    hitstop: 3, knockbackVx: 40, launchVy: -350, selfVy: -340,
  },
  air_light_1: {
    chain: 0, startup: 3, active: 7, recovery: 6, poseFrame: 1,
    arc: { startDeg: 30, endDeg: -30, radius: 75, width: 18, thickness: 16 },
    hitstop: 2, knockbackVx: 45, launchVy: -190, airBrake: true,
  },
  air_light_2: {
    chain: 1, startup: 3, active: 7, recovery: 6, poseFrame: 6,
    arc: { startDeg: -30, endDeg: 30, radius: 75, width: 18, thickness: 16 },
    hitstop: 2, knockbackVx: 45, launchVy: -190, airBrake: true,
  },
  air_heavy_slam: {
    chain: 0, startup: 5, active: 8, recovery: 10, poseFrame: 3,
    arc: { startDeg: 20, endDeg: -65, radius: 95, width: 22, thickness: 18 },
    hitstop: 3, knockbackVx: 120, launchVy: 280, selfVy: 420, groundImpact: true,
  },
  chain_grab: {
    chain: 0, startup: 4, active: 9, recovery: 9, poseFrame: 5,
    // Straight horizontal throw; the radius goes `reach.from -> reach.to`
    // (peak at 60% of the active window) and back.
    arc: { startDeg: 0, endDeg: 0, radius: 135, width: 16, thickness: 14 },
    reach: { from: 20, to: 135 },
    hitstop: 4, knockbackVx: -150, launchVy: -140,
  },
  air_grab: {
    chain: 0, startup: 3, active: 8, recovery: 8, poseFrame: 5,
    arc: { startDeg: -10, endDeg: -55, radius: 120, width: 24, thickness: 20 },
    hitstop: 4, knockbackVx: 50, launchVy: 480, groundImpact: true,
  },
  dash_attack: {
    chain: 0, startup: 3, active: 8, recovery: 8, poseFrame: 1,
    arc: { startDeg: -20, endDeg: 40, radius: 88, width: 22, thickness: 18 },
    hitstop: 3, knockbackVx: 120, launchVy: 0, lungeVx: 110,
  },
} as const;

// Kept as a named constant so CONFIG.player and CONFIG.scale read the same
// source: the reference scale is derived, never hand-copied.
const PLAYER = {
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
  /**
   * Input buffering: actions buffered within this many ticks during startup,
   * hitstop, or early recovery are consumed when chain/attack window opens.
   */
  inputBufferTicks: 4,
  /**
   * K held this many ticks while `heavy_slam` is in startup converts it into
   * `ascension` (Launcher). A second K press also converts it (`K, K`).
   */
  heavyHoldTicks: 6,
  moves: MOVES,
  /** Hit response of scenario targets (`combat`). */
  target: {
    hitstunTicks: 14,
    groundFriction: 600,
    minX: 14,
    maxX: INTERNAL_WIDTH - 14,
  },
  /** yTop impact event and its (deterministic, age-driven) presentation. */
  groundImpact: {
    durationTicks: 10,
    shakeTicks: 3,
    shakePx: 2,
    shockRadius: 28,
    sparkCount: 12,
    sparkGravity: 420,
  },
  /**
   * Hand (chain origin) offset from the feet anchor, per frame of
   * kratos-attack.png, facing right: dx forward, dy up-negative.
   */
  hands: {
    1: { dx: 13, dy: -33 },
    2: { dx: 26, dy: -31 },
    3: { dx: 14, dy: -33 },
    4: { dx: 7, dy: -33 },
    5: { dx: 13, dy: -33 },
    6: { dx: 13, dy: -33 },
  },
  combo: [MOVES.light_1, MOVES.light_2, MOVES.light_3],
},
dodge: {
  // Roll impulse speed. The roll *duration* is not declared here: it lives in
  // `ROLL_TICKS` / `ROLL_INVUL_TICKS` below, which are the single source of
  // truth consumed by `src/sim/roll.ts` and `src/main.ts`.
  //
  // Tuned against a 20-tick roll: 260 px/s * (19/60) s ~= 82 px travelled,
  // which reads as a full body-length dive at the 480 px internal width
  // instead of a short hop. Raising this without raising `ROLL_TICKS` makes
  // the roll feel like a teleport; raising both makes it a free escape.
  rollSpeed: 260,
},
guard: {
  startupTicks: 2,
  parryWindowTicks: 6,
  recoveryTicks: 4,
},
damage: {
  maxHp: 100,
  hurtHitstunTicks: 14,
  hurtInvulTicks: 45,
  knockbackVx: 140,
  guardMitigationRatio: 0.85,
},
} as const;

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
  player: PLAYER,
  enemy: {
    legionnaire: {
      maxHp: 60,
      speed: 65,
      aggroRange: 160,
      attackRange: 28,
      windupTicks: 24,
      activeSlashTicks: 8,
      recoveryTicks: 16,
      cooldownTicks: 40,
      slashDamage: 12,
      slashReach: 32,
      parryStunTicks: 32,
    },
  },
  economy: {
    orbs: {
      greenOrbHeal: 15,
      redOrbValue: 5,
      dropPerLegionnaire: { red: 4, green: 1 },
      magnetRadius: 180,
      magnetSpeed: 320,
      burstImpulseVy: -110,
    },
  },
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
    platformHighlightColor: 0x8c673a,
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
    /**
     * Blades of Chaos render layer. The weapon is drawn as a pixel-aligned
     * chain (integer rectangles) from grip to blade plus a blade rectangle at
     * the blade center.
     *
     * Colors are UNIQUE across `CONFIG.presentation` on purpose: criterion 1 of
     * the CHAOS-01 plan enumerates unique colors in the arc band to prove the
     * weapon is rendered, so no weapon color may collide with any existing
     * one. Checked against `platformColor 0x6b4f2a`, `platformEdgeColor
     * 0x3f2e18`, `targetColor 0x8a9bb0`, `targetHitColor 0xff5533`,
     * `hitboxColor 0xff0000`, `hitboxColorChain1 0xff8800`, `hitboxColorChain2
     * 0xffee00`, `scaleFeetColor 0x22d3ee`, `scaleSilhouetteColor 0xfacc15`,
     * `scaleJumpColor 0x4ade80`, `scaleAttackColor 0xf472b6` and background
     * `#111827`:
     *   - `weaponChainColor 0x9e9e9e` — neutral cool grey; every existing grey
     *     (`targetColor`, `platformEdgeColor`) is tinted, none is neutral.
     *   - `weaponBladeColor 0xfff1c9` — warm near-white; no existing color is
     *     this light (`scaleSilhouetteColor` is a saturated yellow).
     */
    weaponChainColor: 0x9e9e9e,
    weaponBladeColor: 0xfff1c9,
    weaponChainSegmentPx: 2,
    weaponChainSegments: 18,
    weaponBladeWidth: 12,
    weaponBladeHeight: 6,
    weaponDepth: 3,
    hud: {
      x: 16,
      y: 14,
      barWidth: 110,
      barHeight: 8,
      ghostDrainSpeed: 45,
      ghostPauseMs: 200,
      criticalHpThreshold: 25,
      depth: 100,
    },
  },
} as const;

/**
 * Roll timing, declared in ticks, and the SINGLE source of truth for the roll
 * duration and its i-frame window. Consumed by `src/sim/roll.ts` (duration +
 * i-frames) and `src/main.ts` (animation frameRate).
 *
 * The tick that closes the roll is not observable: `stepRoll` increments the
 * counter and checks the threshold in the same tick, so a roll declared as
 * `ROLL_TICKS = N` reports `rollTicks` 1..N-1 (N-1 active ticks) before closing.
 *
 * `ROLL_TICKS` and `ROLL_INVUL_TICKS` are deliberately DIFFERENT concepts and
 * must not be kept in lockstep:
 *   - `ROLL_TICKS` is how long the roll animation and the committed movement
 *     last. It is a feel/presentation knob.
 *   - `ROLL_INVUL_TICKS` is how long the roll protects the player. It is a
 *     balance/justice knob.
 * Setting them equal makes the roll a full-length i-frame escape: every danger
 * has the same optimal answer (roll) and the mechanic stops asking for timing.
 * Here the i-frame window covers the first 15 of 20 ticks (250 ms), leaving a
 * 5-tick vulnerable recovery tail so the player must commit to WHEN to roll.
 */
export const ROLL_TICKS = 20;
export const ROLL_INVUL_TICKS = 15;
export const METRICS_WINDOW_FRAMES = CONFIG.presentation.metricsWindowFrames;

export type GameConfig = typeof CONFIG;
