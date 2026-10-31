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
 * impact event), `hand` (chain origin offset from the feet anchor, facing
 * right: dx forward, dy up-negative; tune against the drawn art) and `chain`
 * (index reported in `attackChain`).
 */
const MOVES = {
  light_1: {
    chain: 0, startup: 4, active: 7, recovery: 7, hand: { dx: 13, dy: -33 },
    arc: { startDeg: -30, endDeg: 35, radius: 76, width: 18, thickness: 16 },
    hitstop: 2, knockbackVx: 85, launchVy: 0, lungeVx: 45,
  },
  light_2: {
    chain: 1, startup: 3, active: 7, recovery: 7, hand: { dx: 13, dy: -33 },
    arc: { startDeg: 40, endDeg: -28, radius: 82, width: 18, thickness: 16 },
    hitstop: 2, knockbackVx: 95, launchVy: 0, lungeVx: 55,
  },
  light_3: {
    chain: 2, startup: 4, active: 8, recovery: 10, hand: { dx: 26, dy: -31 },
    arc: { startDeg: 55, endDeg: -35, radius: 96, width: 22, thickness: 18 },
    hitstop: 3, knockbackVx: 180, launchVy: 0, lungeVx: 90,
  },
  light_4: {
    chain: 3, startup: 4, active: 8, recovery: 10, hand: { dx: 13, dy: -33 },
    arc: { startDeg: -40, endDeg: 45, radius: 98, width: 22, thickness: 18 },
    hitstop: 3, knockbackVx: 160, launchVy: 0, lungeVx: 60,
  },
  spirit_of_hercules: {
    chain: 3, startup: 6, active: 9, recovery: 14, hand: { dx: 26, dy: -31 },
    arc: { startDeg: 30, endDeg: -45, radius: 105, width: 26, thickness: 22 },
    hitstop: 4, knockbackVx: 220, launchVy: -120, lungeVx: 75, groundImpact: true,
  },
  plume_of_prometheus: {
    chain: 2, startup: 5, active: 9, recovery: 12, hand: { dx: 14, dy: -33 },
    arc: { startDeg: 85, endDeg: -65, radius: 110, width: 24, thickness: 20 },
    hitstop: 4, knockbackVx: 140, launchVy: -240, lungeVx: 70, groundImpact: true,
  },
  heavy_slam: {
    chain: 0, startup: 7, active: 8, recovery: 11, hand: { dx: 14, dy: -33 },
    arc: { startDeg: 75, endDeg: -60, radius: 95, width: 22, thickness: 18 },
    hitstop: 3, knockbackVx: 130, launchVy: 0, lungeVx: 60, groundImpact: true,
  },
  ascension: {
    chain: 0, startup: 6, active: 8, recovery: 10, hand: { dx: 7, dy: -33 },
    arc: { startDeg: -35, endDeg: 80, radius: 88, width: 20, thickness: 18 },
    hitstop: 3, knockbackVx: 40, launchVy: -350, selfVy: -340,
  },
  air_light_1: {
    chain: 0, startup: 3, active: 7, recovery: 6, hand: { dx: 13, dy: -33 },
    arc: { startDeg: 30, endDeg: -30, radius: 75, width: 18, thickness: 16 },
    hitstop: 2, knockbackVx: 45, launchVy: -190, airBrake: true,
  },
  air_light_2: {
    chain: 1, startup: 3, active: 7, recovery: 6, hand: { dx: 13, dy: -33 },
    arc: { startDeg: -30, endDeg: 30, radius: 75, width: 18, thickness: 16 },
    hitstop: 2, knockbackVx: 45, launchVy: -190, airBrake: true,
  },
  air_heavy_slam: {
    chain: 0, startup: 5, active: 8, recovery: 10, hand: { dx: 14, dy: -33 },
    arc: { startDeg: 20, endDeg: -65, radius: 95, width: 22, thickness: 18 },
    hitstop: 3, knockbackVx: 120, launchVy: 280, selfVy: 420, groundImpact: true,
  },
  chain_grab: {
    chain: 0, startup: 4, active: 9, recovery: 9, hand: { dx: 13, dy: -33 },
    // Straight horizontal throw; the radius goes `reach.from -> reach.to`
    // (peak at 60% of the active window) and back.
    arc: { startDeg: 0, endDeg: 0, radius: 135, width: 16, thickness: 14 },
    reach: { from: 20, to: 135 },
    hitstop: 4, knockbackVx: -150, launchVy: -140,
  },
  air_grab: {
    chain: 0, startup: 3, active: 8, recovery: 8, hand: { dx: 13, dy: -33 },
    arc: { startDeg: -10, endDeg: -55, radius: 120, width: 24, thickness: 20 },
    hitstop: 4, knockbackVx: 50, launchVy: 480, groundImpact: true,
  },
  dash_attack: {
    chain: 0, startup: 3, active: 8, recovery: 8, hand: { dx: 13, dy: -33 },
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
  // Four frames sampled every 15 of the 30 fps `Idle_Loop` clip.
  frameRate: 2,
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
  upgrades: {
    level2Cost: 100,
    level2DamageMultiplier: 1.3,
    level2Name: 'Cuchillas del Caos Nv. 2',
  },
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
      recoveryTicks: 16,
      cooldownTicks: 40,
      slashDamage: 12,
      slashReach: 32,
      parryStunTicks: 32,
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
      spawnTelegraphTicks: 24,
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
      eyeRiseSpeed: -80,
      eyeMagnetSpeed: 260,
      phoenixFeathersPerUpgrade: 6,
      manaUpgradeBonus: 20,
      featherRiseSpeed: -80,
      featherMagnetSpeed: 260,
      redOrbsChestValue: 50,
    },
  },
  checkpoints: {
    activationRadius: 32,
    respawnDelayTicks: 45,
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
    attack: {
      maxChain: PLAYER.attack.maxChain,
      gripOffsetY: PLAYER.weapon.gripOffsetY,
      combo: PLAYER.attack.combo,
    },
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
     * Rest pose of the Blades of Chaos drawn by `WeaponLayer` when idle
     * (offsets from the feet anchor, facing right, measured on `idle-00`).
     * Off until the user decides on it.
     */
    restPose: { enabled: false, handDx: 18, handDy: -20, bladeDx: 28, bladeDy: -6 },
    /**
     * Inherited visuals switched off until the user decides on each one:
     * `weaponArt` is the procedural chains, blades and trails of `WeaponLayer`
     * (while off, an attack shows its hitbox as a neutral box), and
     * `landingSquash` stretches the sprite for a few ticks after landing.
     */
    weaponArt: false,
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
      sapphireShadowColor: 0x1e40af,
      redOrbsColor: 0xef4444,
      redOrbsGlowColor: 0xf87171,
      redOrbsShadowColor: 0x991b1b,
      depth: 2,
    },
    weaponChainLevel2Color: 0xf59e0b,
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
    stats: {
      totalEnemiesLabel: 'ENEMIGOS ABATIDOS',
      chestsFoundLabel: 'COFRES DESCUBIERTOS',
      redOrbsLabel: 'ORBES ROJOS',
      weaponLevelLabel: 'NIVEL DE ARMA',
    },
    depth: 150,
  },
  vfx: {
    rain: {
      dropCount: 60,
      angleDeg: 15,
      fallSpeed: 320,
      driftSpeed: 70,
      dropLength: 6,
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
      flashDurationTicks: 3,
      flashAlpha: 0.30,
      color: 0xe0f2fe,
      depth: -2,
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
    musicVolume: 0.50,
    enabled: true,
    profiles: {
      slash: { startFreq: 440, endFreq: 110, durationMs: 120 },
      heavySlam: { startFreq: 120, endFreq: 35, durationMs: 250 },
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
export const METRICS_WINDOW_FRAMES = CONFIG.presentation.metricsWindowFrames;

export type GameConfig = typeof CONFIG;
