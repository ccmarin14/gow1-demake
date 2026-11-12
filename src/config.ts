import { deriveScaleReference } from './scale';

export const TICK_RATE = 60;
export const TICK_MICROS = Math.floor(1_000_000 / TICK_RATE);

const INTERNAL_WIDTH = 480;
const INTERNAL_HEIGHT = 270;
/** Character canvas (px). Single source: the manifest and the scale reference read it. */
export const PLAYER_SPRITE_WIDTH = 64;
export const PLAYER_SPRITE_HEIGHT = 56;
/**
 * Physical bounds of the player, deliberately independent of the sprite canvas:
 * redrawing the art with a different canvas must not move walls or the jump
 * ceiling. `marginX` covers the half width of Kratos' body (the idle stance
 * spans 16 px each side of the anchor), so the body stops before the edge.
 */
const PLAYER_BOUNDS = {
  /** Distance kept from the screen edge, the level edges and arena barriers. */
  marginX: 20,
  /** Highest `y` the feet may reach (jump ceiling). */
  ceilingY: 59,
} as const;

// Kept as a named constant so CONFIG.player and CONFIG.scale read the same
// source: the reference scale is derived, never hand-copied.
const PLAYER = {
maxSpeed: 140,
accel: 1050,
brake: 1650,
minX: PLAYER_BOUNDS.marginX,
maxX: INTERNAL_WIDTH - PLAYER_BOUNDS.marginX,
bounds: PLAYER_BOUNDS,
/**
 * Air control (px/s^2): weaker than on the ground so a jump keeps its
 * momentum. Releasing the input drifts to a stop instead of halting in place.
 */
airControl: {
  accel: 700,
  brake: 350,
},
sprite: {
  width: PLAYER_SPRITE_WIDTH,
  height: PLAYER_SPRITE_HEIGHT,
  anchorX: 0.5,
  anchorY: 1,
},
run: {
  // The frame count comes from `RUN_KEYS` (src/assets/manifest.ts); it is not
  // repeated here so cadence cannot drift from the clip.
  // Cadence is derived from stride, never hand-tuned. `frameRate` is the
  // cadence the clip was drawn for, `stridePx` is how far the body travels
  // in one full cycle. Playing at `speed / stridePx` cycles per second is the
  // no-slide rule: one loop must cover one stride of ground.
  // The 8 frames sample every other frame of the 16-frame sprint clip.
  frameRate: 15,
  // Foot excursion on the run frames is x 14..48 (34 px peak to peak), x 2.
  stridePx: 68,
  minTimeScale: 0.35,
  maxTimeScale: 2,
  idleSpeedThreshold: 1,
},
idle: {
  // Tired panting: one breath (exhale, mid, inhale, mid) per second.
  frameRate: 4,
},
air: {
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
  topY: PLAYER_BOUNDS.ceilingY,
},
/** Weapon identity. */
weapon: {
  id: 'blades-of-chaos',
  name: 'Cuchillas del Caos',
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
grab: {
  /** Maximum forward reach to latch onto an enemy (px). */
  reachPx: 64,
  /** Forward lunge velocity when initiating grab or on whiff (px/s). */
  lungeSpeedPx: 95,
  /** Maximum forward advance during grab-lunge step (px). */
  lungeMaxAdvancePx: 26,
  /** Number of ticks spent physically lunging forward during grab start (~33 ms). */
  lungeTicks: 2,
  /** Maximum vertical alignment offset to allow grab (px). */
  verticalReachPx: 20,
  /** Fixed horizontal separation between Kratos and the victim during hold (px). */
  holdDistancePx: 22,
  /** Total recovery ticks when grab whiffs with no target in reach (~530 ms at 60 Hz). */
  whiffTicks: 32,
  /** Ticks spent physically stepping forward during whiff before braking (~200 ms). */
  whiffLungeTicks: 12,
  /** Ticks spent holding the victim while waiting for player decision □ / △ / ○ (~2.0 s at 60 Hz). */
  holdTicks: 120,
  /** Ticks the victim spends forcing Kratos away before resuming guard. */
  breakFreeTicks: 4,
  /** Backward impulse applied to Kratos when the victim breaks free (px/s). */
  breakFreePlayerVx: 150,
  /** Forward impulse applied to the victim while breaking free (px/s). */
  breakFreeEnemyVx: 90,
  /** Direct damage dealt per strike in Grab 1 (Pummel). Target design: 3 punches held aloft, then thrown down and 4 blade stabs (user, 2026-11-12); not implemented yet. */
  pummelDamage: 10,
  /** Duration in ticks of each pummel strike (~230 ms at 60 Hz). */
  pummelTicks: 14,
  /** Maximum number of pummel strikes before transitioning to ground slam. */
  maxPummels: 3,
  /** Ticks spent executing a grab follow-up (throw / break / slam, ~430 ms at 60 Hz). */
  slamTicks: 26,
  /** Ticks recovering from the slam animation (~130 ms). */
  recoveryTicks: 8,
  /** Direct damage dealt to the victim on ground slam (○ / K / L). */
  damage: 25,
  /** Direct damage dealt to the victim when thrown as a projectile (□ / J). */
  throwDamage: 15,
  /** Collateral damage dealt to other enemies hit by a thrown victim. */
  collateralDamage: 20,
  /** Horizontal projectile speed of a thrown victim (px/s). */
  throwVx: 280,
  /** Slight upward arc impulse of a thrown victim (px/s). */
  throwVy: -160,
  /** Direct damage dealt to the victim on brutal snap/break (△ / I). */
  breakDamage: 35,
  /** Horizontal knockback impulse on victim on slam (px/s). */
  slamVx: 40,
  /** Slight rebound bounce on victim on slam (px/s). */
  slamVy: -60,
  /** Total invulnerability window granted to Kratos during grab hold & execution. */
  invulTicks: 125,
},
damage: {
  maxHp: 100,
  hurtHitstunTicks: 14,
  hurtInvulTicks: 45,
  knockbackVx: 140,
  guardMitigationRatio: 0.85,
},
magic: {
  maxMp: 100,
  poseidonsRage: {
    cost: 35,
    startupTicks: 8,
    activeTicks: 40,
    recoveryTicks: 12,
    radius: 90,
    hitIntervalTicks: 8,
    damagePerHit: 8,
    stunTicksPerHit: 24,
  },
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
      /** Forward lunge speed during the active slash swing (px/s). */
      slashLungeSpeed: 80,
      recoveryTicks: 16,
      cooldownTicks: 40,
      slashDamage: 12,
      slashReach: 32,
      /** Heavy break-guard attack telegraph ticks (36 ticks = 600 ms, ESE-04). */
      heavyWindupTicks: 36,
      /** Active ticks for heavy break-guard slash (ESE-04). */
      heavyActiveTicks: 10,
      /** Forward lunge speed during heavy slash (px/s). */
      heavySlashLungeSpeed: 95,
      /** Heavy break-guard attack damage (ESE-04). */
      heavyDamage: 18,
      /** Reach of heavy attack (px). */
      heavyReach: 36,
      parryStunTicks: 32,
      /** Ticks spent lying knocked down on the floor (~500 ms at 60 Hz, ESE-07). */
      knockdownTicks: 30,
      /** Ticks spent getting up from the ground (~250 ms at 60 Hz, ESE-07). */
      getUpTicks: 15,
      /** Autonomous patrol pace when outside player aggro range (px/s). */
      patrolSpeed: 30,
      /** Duration of patrol walk in one direction before pausing (~1.16 s). */
      patrolWalkTicks: 70,
      /** Duration of idle observation before turning and pacing (~0.83 s). */
      patrolIdleTicks: 50,
      /** Distance at which it stops chasing and holds in guard before committing. */
      standoffRange: 72,
      /** Extra distance Kratos must open before a guarding legionnaire chases again. */
      standoffSlack: 16,
      /** Guard hold before committing: `holdTicksMin` plus a per-enemy share of `holdTicksSpan`. */
      holdTicksMin: 30,
      holdTicksSpan: 45,
      /** Legionnaires in `windup` or `slash` at once; the rest wait their turn in guard. */
      maxAttackers: 2,
      /** HP threshold at or below which the legionnaire is weakened and vulnerable to finisher (BL-07, ESE-01). */
      weakenedThresholdHp: 20,
      /** Stagger pace when groggy in weakened state (px/s). */
      weakenedSpeed: 25,
      /** Duration of QTE input window in ticks (45 ticks = 750 ms at 60 Hz, BL-07). */
      qteWindowTicks: 45,
      /** Counterattack damage dealt to Kratos if finisher QTE fails or expires (ESE-01). */
      qteFailDamage: 16,
      /** Health restored to Kratos upon successful brutal finisher (GoW 1 green orbs recovery). */
      finisherHealAmount: 25,
      /** Bonus red orbs granted on brutal finisher execution. */
      finisherBonusRedOrbs: 5,
    },
    archer: {
      maxHp: 40,
      preferredDistanceMin: 110,
      preferredDistanceMax: 180,
      retreatSpeed: 50,
      advanceSpeed: 40,
      aggroRange: 260,
      aimTicks: 24,
      shootTicks: 8,
      recoveryTicks: 24,
      cooldownTicks: 70,
      arrowSpeed: 280,
      arrowDamage: 10,
      arrowLifetimeTicks: 65,
      parryReflectSpeedMult: 1.5,
      parryStunTicks: 36,
    },
    hydra: {
      maxHp: 300,
      slamDamage: 25,
      sweepDamage: 20,
      telegraphTicks: 30,
      stuckTicks: 45,
      staggerThresholdHp: 100,
      staggerDurationTicks: 90,
      slamImpactRadius: 40,
      dropOrbs: { red: 15, green: 2, blue: 2 },
    },
  },
  combat: {
    feel: {
      comboTurnMinTicks: 4,
      comboGraceTicks: 16,
      jumpQueueTicks: 10,
      hoverStrikes: ['air1', 'air2', 'air3', 'airTriangle'] as const,
      hoverVyMin: -140,
      hoverVyMax: 40,
      graceAirGravity: 0.5,
      minAirHeavyAltitudePx: 32,
      landingAttackBufferTicks: 8,
      heavyDamage: 20,
      heavyExtraHitstop: 3,
      knockbackLight: 90,
      knockbackHeavy: 220,
    },
    /**
     * Body of scenario targets and enemies: half extents of their hurt box,
     * ground friction when knocked back, and the X clamp of scenarios without
     * a level map.
     */
    target: {
      halfWidth: 14,
      halfHeight: 24,
      groundFriction: 600,
      minX: 14,
      maxX: INTERNAL_WIDTH - 14,
    },
    arena: {
      minX: 70,
      maxX: 410,
      barrierWidth: 8,
      barrierColor: 0xff2020,
      barrierGlowColor: 0xff6644,
      barrierAlpha: 0.8,
      dissipateDurationTicks: 30,
    },
    waves: {
      /**
       * Spawn `offsetX` is measured from the left edge of the arena that hosts
       * the encounter (`WaveManager` origin), so the same encounters work in
       * the `waves`/`arena` scenarios (barrier at `arena.minX`) and in level 1
       * (barrier at `map.level1.segments.centralArena.barrierLeftX`).
       */
      transitionDelayTicks: 60,
      encounters: [
        {
          name: 'Vanguardia',
          spawns: [
            { kind: 'legionnaire' as const, offsetX: 250, delayTicks: 0, facing: -1 as const },
            { kind: 'legionnaire' as const, offsetX: 310, delayTicks: 15, facing: -1 as const },
          ],
        },
        {
          name: 'Fuerza Mixta',
          spawns: [
            { kind: 'legionnaire' as const, offsetX: 50, delayTicks: 5, facing: 1 as const },
            { kind: 'legionnaire' as const, offsetX: 270, delayTicks: 15, facing: -1 as const },
            { kind: 'archer' as const, offsetX: 360, delayTicks: 25, facing: -1 as const },
          ],
        },
      ],
    },
  },
  economy: {
    orbs: {
      greenOrbHeal: 15,
      redOrbValue: 5,
      blueOrbMana: 20,
      dropPerLegionnaire: { red: 4, green: 1, blue: 1 },
      dropPerArcher: { red: 3, green: 1, blue: 1 },
      magnetRadius: 180,
      magnetSpeed: 320,
      burstImpulseVy: -110,
    },
    chests: {
      interactionRadius: 28,
      verticalTolerance: 16,
      openDurationTicks: 24,
      gorgonEyesPerUpgrade: 6,
      healthUpgradeBonus: 20,
      eyeMagnetSpeed: 260,
      phoenixFeathersPerUpgrade: 6,
      manaUpgradeBonus: 20,
      featherMagnetSpeed: 260,
      redOrbsChestValue: 50,
    },
  },
  checkpoints: {
    activationRadius: 32,
    lightPillarWidth: 28,
    lightPillarHeight: 270,
    level1: [
      { id: 'chk-popa', x: 140, y: 262, name: 'Popa de la Nave' },
      { id: 'chk-proa', x: 980, y: 262, name: 'Umbral de Proa' },
    ],
  },
  // Reference scale for map/level stages; every field is computed from the
  // values above (see `src/scale.ts`).
  scale: deriveScaleReference({
    tickRate: TICK_RATE,
    canvas: { width: INTERNAL_WIDTH, height: INTERNAL_HEIGHT },
    sprite: PLAYER.sprite,
    movement: { maxSpeed: PLAYER.maxSpeed },
    jump: PLAYER.vertical,
  }),
  map: {
    level1: {
      width: 1440,
      height: 270,
      groundY: 262,
      segments: {
        poopDeck: {
          id: 1,
          name: 'Popa',
          xStart: 0,
          xEnd: 480,
        },
        centralArena: {
          id: 2,
          name: 'Arena Central',
          xStart: 480,
          xEnd: 960,
          barrierLeftX: 550,
          barrierRightX: 890,
          arenaScrollX: 480,
        },
        bowDeck: {
          id: 3,
          name: 'Proa',
          xStart: 960,
          xEnd: 1440,
        },
      },
      camera: {
        deadzoneX: 32,
        scrollMinX: 0,
        scrollMaxX: 960,
        parallaxFactor: 0.25,
      },
      platforms: [
        { x1: 0, x2: 1440, yTop: 262 },
        { x1: 200, x2: 290, yTop: 226 },
        { x1: 1040, x2: 1180, yTop: 200 },
        { x1: 1100, x2: 1240, yTop: 138 },
        { x1: 1310, x2: 1440, yTop: 218 },
      ],
    },
  },
  presentation: {
    /**
     * Contact shadow drawn by the scene under the player (D-26/D-29). Keep it
     * off while the character grid still has a baked shadow, and switch it on
     * together with the first grid drawn without one.
     */
    /**
     * Blades of Chaos carried on the back, as in GoW 1.
     * Each blade hangs from the upper back of the frame being shown
     * (`src/assets/kratos-anchors.json`, exported from the 3D skeleton) and
     * follows its spine: `dx`/`dy` shift it from that point (sprite pixels,
     * facing right) and `deg` turns it from the spine direction toward the
     * back, so the two blades cross.
     */
    backBlades: [
      { dx: -2, dy: 0, deg: 24 },
      { dx: 0, dy: -1, deg: 6 },
    ],
    /**
     * Strike art drawn by `WeaponLayer` from the strike track (D-37): the
     * blade shrunk to `bladeSize` in 16 pre-rotated directions, the chain's
     * alternating 2 px links, the fire crescent's four flat bands (edge, red,
     * orange from 25 % of its length, white from 65 %) and the impact glint.
     */
    strikeArt: {
      bladeSize: { w: 12, h: 5 },
      chainColors: [0x969098, 0x403a46],
      trail: { edge: 0x5c0e12, red: 0xb22218, orange: 0xe86c24, white: 0xffe2aa },
      glintColor: 0xffe2aa,
      /** The glint shows during the first `glintFraction` of the hold phase. */
      glintFraction: 0.15,
    },
    /**
     * `weaponArt` draws the Blades of Chaos on Kratos' back (`WeaponLayer`).
     * `landingSquash`
     * (inherited, undecided) stretches the sprite for a few ticks after landing.
     */
    weaponArt: true,
    landingSquash: false,
    /** Placeholder box for the hydra until its art is drawn (px). */
    hydraPlaceholder: { width: 56, height: 72 },
    /**
     * Enemies are neutral boxes the size of their hit area until their art is
     * drawn. A box turns `telegraphColor` while it winds up or aims, so the
     * attack stays readable.
     */
    enemyPlaceholder: {
      legionnaireColor: 0x8a9bb0,
      archerColor: 0x7c8f6a,
      telegraphColor: 0xfacc15,
      deadAlpha: 0.35,
      arrow: { width: 10, height: 2, color: 0xd6d3d1 },
    },
    playerShadow: { enabled: true, width: 36, height: 6, color: 0x000000, alpha: 0.35 },
    background: '#111827',
    debugText: '#d1d5db',
    metricsWindowFrames: 60,
    platformColor: 0x6b4f2a,
    platformHighlightColor: 0x8c673a,
    platformEdgeColor: 0x3f2e18,
    platformThickness: 4,
    targetColor: 0x8a9bb0,
    targetHitColor: 0xff5533,
    scaleFeetColor: 0x22d3ee,
    scaleSilhouetteColor: 0xfacc15,
    scaleJumpColor: 0x4ade80,
    scaleReferenceAlpha: 0.9,
    scaleReferenceThickness: 1,
    hud: {
      x: 16,
      y: 14,
      barWidth: 110,
      upgradedBarWidth: 132,
      barHeight: 8,
      manaBarWidth: 80,
      upgradedManaBarWidth: 96,
      manaBarHeight: 5,
      manaBarYOffset: 12,
      ghostDrainSpeed: 45,
      ghostPauseMs: 200,
      criticalHpThreshold: 25,
      depth: 100,
      boss: {
        x: 140,
        y: 252,
        barWidth: 200,
        barHeight: 7,
        name: 'LA HIDRA DE LERNA',
      },
    },
    chest: {
      width: 24,
      height: 18,
      stoneColor: 0x57534e,
      stoneHighlightColor: 0x78716c,
      stoneShadowColor: 0x292524,
      bronzeColor: 0x92662c,
      bronzeHighlightColor: 0xc49a45,
      emeraldColor: 0x22c55e,
      emeraldGlowColor: 0x4ade80,
      sapphireColor: 0x38bdf8,
      sapphireGlowColor: 0x60a5fa,
      redOrbsColor: 0xef4444,
      redOrbsGlowColor: 0xf87171,
      depth: 2,
    },
    checkpoint: {
      pillarColor: 0xfde047,
      glowColor: 0xfacc15,
      coreColor: 0xffffff,
      baseRuneColor: 0xca8a04,
      baseRuneGlow: 0x78350f,
      depth: 1,
    },
  },
  ui: {
    title: 'GOD OF WAR',
    subtitle: 'MAR EGEO - PROCESO 8-BIT',
    fontFamily: 'monospace',
    colors: {
      gold: '#facc15',
      goldBright: '#fde047',
      crimson: '#ef4444',
      crimsonDark: '#7f1d1d',
      bronze: '#92662c',
      stone: '#1f140e',
      panelBg: 0x18100c,
      panelBevel: 0xc49a45,
      panelShadow: 0x0c0705,
      overlayBg: 0x000000,
    },
    depth: 150,
  },
  vfx: {
    rain: {
      dropCount: 60,
      fallSpeed: 320,
      driftSpeed: 70,
      dropThickness: 1,
      color: 0x94a3b8,
      alphaBack: 0.25,
      alphaFront: 0.38,
      splashDurationTicks: 6,
      splashRadius: 3,
      backDepth: -1,
      frontDepth: 40,
    },
    lightning: {
      intervalTicksMin: 360,
      intervalTicksMax: 600,
      flashAlpha: 0.30,
      color: 0xe0f2fe,
      depth: -2,
    },
    /**
     * Dust of a strike's ground impact (D-37; the flash, fire line and shake
     * are declared on the strike's phase).
     */
    groundImpact: {
      dustCount: 6,
      dustSpeedMin: 30,
      dustSpeedMax: 70,
      dustLifeTicks: 16,
      dustColors: [0x8a7a62, 0xb8a888, 0x5c4c3a],
    },
    combatSparks: {
      /** Inherited effect, off until the user decides on it. */
      enabled: false,
      sparkCount: 6,
      lifetimeTicks: 8,
      colors: [0xfde047, 0xf97316, 0xef4444],
      speedMin: 60,
      speedMax: 180,
      depth: 35,
    },
    parryFlash: {
      durationTicks: 8,
      radius: 12,
      color: 0xfef08a,
      depth: 36,
    },
  },
  audio: {
    masterVolume: 0.70,
    sfxVolume: 0.85,
    enabled: true,
    profiles: {
      parry: { harmonics: [880, 1320, 1760], durationMs: 350 },
      magic: { baseFreq: 60, durationMs: 400 },
      roar: { baseFreq: 55, durationMs: 600 },
      orb: { frequencies: [523.25, 659.25, 783.99], durationMs: 150 },
      chest: { startFreq: 150, endFreq: 400, durationMs: 300 },
      victory: { chord: [261.63, 329.63, 392.00, 523.25], durationMs: 800 },
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
/** Attack input buffered during a roll remains valid through its short recovery window. */
export const ROLL_ATTACK_BUFFER_TICKS = 8;
export const METRICS_WINDOW_FRAMES = CONFIG.presentation.metricsWindowFrames;

export type GameConfig = typeof CONFIG;
