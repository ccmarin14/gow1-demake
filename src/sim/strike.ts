import { CONFIG } from '../config';
import { damageEnemy } from './damage';
import type { EntityState, GroundFireState, StrikeSnapshot } from './types';

/**
 * Kratos' strikes as data (D-37). Each strike is a table of phases (body
 * pose, ticks, forward step) plus, per hand, a blade track: a Catmull-Rom
 * curve the blade runs at 60 Hz. The body changes pose in steps; the blades
 * move continuously. The hit box is a blade's swept segment, so what hits is
 * what is drawn. A hand without a track on a phase holds its blade (drawn
 * from the back, returning from the previous strike, or hanging from the
 * hand). A strike can chain into the next one (`chain`).
 *
 * Coordinates are pixels relative to Kratos' feet when the strike started,
 * facing +x, y down. Phase time `u` runs 0 -> 1 inside each phase.
 */
export type Vec2 = readonly [number, number];

export type StrikeId =
  | 'square1' | 'square2' | 'square3' | 'square4' | 'square5' | 'square6'
  | 'triangle' | 'launcher' | 'plume' | 'spirit' | 'ascension' | 'air1' | 'air2' | 'air3' | 'airTriangle' | 'harpoon';

/** Kratos' hands as the side view shows them: near the camera or behind the body. */
export type Hand = 'near' | 'far';

/** Whether a blade, its chain or its trail is drawn in front of the body (and enemies) or behind it. */
export type Depth = 'front' | 'behind';

/** Default cap of a fire trail's length (px): the user wants restrained trails. */
export const TRAIL_MAX_LENGTH_PX = 55;

/**
 * How the fire trail is drawn. Either kind keeps only its newest
 * `maxLengthPx` (default `TRAIL_MAX_LENGTH_PX`).
 * - `crescent`: square 1 as approved: each phase's `widthPx`, the whole
 *   crescent behind the body.
 * - `profile`: width along the track (`widths`, pairs of track parameter s
 *   and px, linear between them), both ends tapered (`taperOld` and
 *   `taperHead`, fractions of the trail's length), nothing drawn until it is
 *   `minLengthPx` long, depth per sample from the track.
 */
export type TrailShape =
  | { kind: 'crescent'; maxLengthPx?: number }
  | {
    kind: 'profile';
    widths: readonly (readonly [number, number])[];
    taperOld: number;
    taperHead: number;
    minLengthPx: number;
    maxLengthPx?: number;
    /** The sweep turns counter-clockwise on screen: the crescent's inner side is the other one. */
    flip?: boolean;
    /**
     * Once the trail stops growing it is cut as soon as its head is more
     * than 2 px from the blade, instead of shrinking one tick at a time: a
     * trail never floats away from its blade.
     */
    cutWhenDetached?: boolean;
  };

/** How a blade moves along its track during a phase. */
export type BladeMotion =
  /**
   * To the start of the track (quadratic, ease in), from the upper back (the
   * blade is drawn) or from under the throwing hand (it already holds it).
   */
  | { kind: 'draw'; from: 'back' | 'hand'; behindBody: true; via?: 'ground' }
  /**
   * To the start of the track (ease out), from where the previous strike of
   * the combo left this blade (or from under the hand when there is none):
   * both blades are thrown from the first phase on. Optional `arcPx` creates
   * a curved downward swing arc with dynamic tangent angle.
   */
  | { kind: 'carry'; arcPx?: number }
  /** Along the track from `from` to `to` (0..1 of its length). */
  | { kind: 'track'; from: number; to: number; ease: 'linear' | 'out' | 'in' }
  /**
   * Held at track parameter `at` (default the end), drifting `driftPx` and
   * back: down, and `driftX` of it along x (0.3 forward by default).
   */
  | { kind: 'hold'; driftPx: number; driftX?: number; at?: number }
  /**
   * Back to the throwing hand (or to `to`, a feet-relative point of the
   * pose, e.g. crossed arms), accelerating, the chain sagging up to `sagPx`.
   */
  | { kind: 'recall'; sagPx: number; to?: Vec2; fromS?: number };

/**
 * The fire trail grows during a phase: max width (`crescent` trails), and
 * optionally only its last `tailPx` once the phase passes `tailFromU`.
 */
export interface PhaseTrail {
  widthPx: number;
  tailPx?: number;
  tailFromU?: number;
}

export interface StrikePhase {
  id: string;
  ticks: number;
  /** Forward step of the body over the phase (px, spread evenly over its ticks). */
  advancePx: number;
  /** Body frame of the phase (`grids/kratos/<pose>.txt`). */
  pose: string;
  /**
   * Centre x of the pose's opaque pixels relative to the feet (px, facing
   * +x): when the combo turns around, the body is moved so it stays put.
   */
  centerX: number;
  /** Effects the phase shows (fireballs, ground fire, flash, dust, shake), as data. */
  effects?: readonly PhaseEffect[];
  /**
   * The phase ends early once Kratos is on the ground again, after at least
   * `minTicks` (its `ticks` are the most it lasts): air strikes landing.
   */
  until?: { event: 'grounded'; minTicks: number };
  /** Gravity scale while the phase lasts (1 by default): below 1 hangs in the air, above 1 drops fast. */
  gravity?: number;
  /** On the phase's first tick Kratos leaves the ground with this vertical speed (px/s, negative is up). */
  leapVy?: number;
}

/**
 * An effect declared on a phase; positions are strike-local px (x ahead of
 * the feet, on the ground unless stated).
 * - `fireball`: on each thrown blade while the phase lasts (a disc of
 *   `radiusPx`, growing `pulsePx` every other `pulseTicks`), at the blade's
 *   depth; not a trail.
 * - `groundFire`: a fire line `heightPx` tall from `from` to `to`,
 *   flickering for `ticks` from the phase start.
 * - `flash`: a flash at `x` for `ticks` from the phase start.
 * - `dust`: dust thrown at each of `at` when the phase starts.
 * - `shake`: the screen shakes `px` for `ticks` when the phase starts.
 */
export type PhaseEffect =
  | { kind: 'fireball'; radiusPx: number; pulsePx: number; pulseTicks: number }
  | { kind: 'groundFire'; from: number; to: number; heightPx: number; ticks: number; linger?: GroundFireLinger }
  | { kind: 'flash'; x: number; ticks: number; radiusPx: number }
  | { kind: 'dust'; at: readonly number[] }
  | { kind: 'shake'; px: number; ticks: number };

/**
 * A ground fire that stays as its own entity in the world (Plume's fire
 * burst): it burns for the effect's `ticks` even after the strike ends and
 * hits each enemy standing in it once, from the tick after it appears,
 * lifting it at `liftVy` px/s where targets have physics.
 */
export interface GroundFireLinger {
  damage: number;
  hitstunTicks: number;
  liftVy: number;
}

/** An effect showing on a tick, with how many ticks it has shown (`age`, 0 on its first). */
export type ActiveEffect = PhaseEffect & { age: number };

/** Effects showing on whole tick `tick` (the one-shot ones only on their phase's first tick). */
export function strikeEffectsAt(def: StrikeDef, tick: number): ActiveEffect[] {
  const { phase, start } = strikePhaseAt(def, tick);
  const age = Math.floor(tick) - start;
  const active: ActiveEffect[] = [];
  for (const effect of phase.effects ?? []) {
    const lasts = effect.kind === 'fireball' ? phase.ticks : effect.kind === 'dust' || effect.kind === 'shake' ? 1 : effect.ticks;
    if (age < lasts) active.push({ ...effect, age });
  }
  return active;
}

/** Radius of a fireball effect on its `age`-th tick: it pulses between `radiusPx` and one `pulsePx` more. */
export function fireballRadius(effect: Extract<PhaseEffect, { kind: 'fireball' }>, age: number): number {
  return effect.radiusPx + (Math.floor(age / effect.pulseTicks) % 2) * effect.pulsePx;
}

/** Part of a track where its blade hits (track parameters, `toS` defaults to the end). */
export interface HitWindow {
  fromS: number;
  toS?: number;
}

/** One hand's blade on its track. */
export interface BladeTrack {
  /**
   * Shoulder of that hand in its throw pose, relative to the feet: the
   * origin of the track (anchor `shoulder` or `farShoulder`).
   */
  shoulder: Vec2;
  /** Catmull-Rom control points relative to `shoulder`; the blade runs points 1..n-2. */
  track: readonly Vec2[];
  /**
   * Depth of the blade, its chain and its trail at each control point of
   * `track` (the nearest one counts); all in front when absent.
   */
  trackDepth?: readonly Depth[];
  /** The chain shows once the blade passes this fraction of the track. */
  chainFrom: number;
  /** Motion per phase id; on the phases not listed the blade is held in its hand. */
  motion: Readonly<Record<string, BladeMotion>>;
  /**
   * The blade runs `ticks` behind the strike's clock until phase `until`,
   * catching up evenly over that phase: two blades thrown together read as
   * two lashes instead of one.
   */
  lag?: { ticks: number; until: string };
  /** Phases on which the trail grows; no trail when `trail` is absent. */
  trailGrowth?: Readonly<Record<string, PhaseTrail>>;
  trail?: TrailShape;
  /**
   * Hit windows on the curve, not on ticks: while the blade is on the track
   * (thrown or held) between track parameters `fromS` and `toS` (default the
   * end), so a retimed strike still hits where the blade is drawn. Each
   * window hits a target once; several windows (e.g. a lash and a sweep) can
   * hit it once each. No hits when absent.
   */
  active?: HitWindow | readonly HitWindow[];
  /**
   * Track parameters where the trail breaks: once the blade passes one, the
   * trail behind it is dropped and a fresh one starts (e.g. at the low point
   * of a gather, so the lash reads as a straight line, not a hook).
   */
  trailBreakAt?: readonly number[];
  /** The trail only takes samples from this track parameter on (e.g. not while the blade drags to the start). */
  trailFromS?: number;
}

/**
 * A held blade (a hand off its track): drawn from the back into its hand on
 * the first phase, or carried over from the strike this one chained from
 * (it is yanked back to its hand over `ticks`, on its chain, sagging up to
 * `sagPx`). Either way it then hangs from that hand.
 */
export type HeldBlade = { from: 'back' } | { from: 'previous'; ticks: number; sagPx: number };

/**
 * Pressing the attack again during a strike starts `into` from its current
 * pose once the strike reaches tick `fromTick` of phase `from`, until its last
 * tick. A press made earlier, from the start of the hit window, is buffered
 * until then.
 */
export interface StrikeChain {
  /** What a light press in the window starts; absent when only triangle chains. */
  into?: StrikeId;
  /** What triangle pressed in the same window starts (the plain triangle; Plume after square 2, later). */
  heavy?: StrikeId;
  from: string;
  fromTick: number;
  until?: string;
}

export interface StrikeDef {
  id: StrikeId;
  phases: readonly StrikePhase[];
  /** The hand of the main blade: the one that hits, glints and that the defaults refer to. */
  hand: Hand;
  /** Blade tracks per hand; a hand without one only holds its blade. */
  blades: Readonly<Partial<Record<Hand, BladeTrack>>>;
  heldBlade: HeldBlade;
  /** Half thickness of the blades' swept segments (px). */
  hitRadiusPx: number;
  damage: number;
  heavy?: boolean;
  hitstunTicks: number;
  /** Ticks the whole world freezes when the strike connects. */
  hitstopTicks: number;
  /** Trail sub-samples per tick and the width it fades with after the sweep. */
  trailSamplesPerTick: number;
  trailFadeWidthPx: number;
  /** The next strike of the combo, if any. */
  chain?: StrikeChain;
  /** The strike goes on while Kratos is in the air (air strikes, Ascension's flight). */
  air?: boolean;
  /**
   * A hit launches the target into the air (juggle) with this velocity (px/s,
   * negative is up; `vx` is in the strike's facing). Foot soldiers only.
   */
  launch?: { vy: number; vx?: number };
  /** Only targets already in the air (juggled) can be hit: the chain grab. */
  grabsAirborne?: boolean;
  /**
   * Ground impact on the first tick of phase `phase`: a burst hit box on the
   * ground from `from` to `to` px ahead of the feet, `heightPx` tall. It hits
   * each target once. What it looks like is the phase's `effects`.
   */
  impact?: StrikeImpact;
  /**
   * Holding `ifHeld` from the strike's start through the end of phase
   * `atEndOf` turns it into `into` there (a tap keeps the strike as is):
   * the triangle's windup doubles as Ascension's hold threshold.
   */
  branch?: { atEndOf: string; ifHeld: 'heavy-attack'; into?: StrikeId };
  /** From tick `fromTick` of phase `from` on, guarding or jumping cuts the strike short. */
  cancel?: { from: string; fromTick: number };
}

export interface StrikeImpact {
  phase: string;
  from: number;
  to: number;
  heightPx: number;
}

/**
 * Centre x of each strike pose's opaque pixels relative to the feet (px,
 * facing +x), measured on `grids/kratos/*.txt` (a test keeps them in sync).
 */
const CX: Readonly<Record<string, number>> = {
  'sq1-a': -2.5, 'sq1-b': -1.5, 'sq1-c': -3, 'sq1-d': -3, 'sq1-e': -1.5,
  'sq2-a': -3.5, 'sq2-b': -3, 'sq2-c': -1.5, 'sq2-d': -3, 'sq2-e': -1,
  'sq3-a': -2, 'sq3-c': 0, 'sq3-d': -0.5, 'sq3-e': -2, 'sq3-f': -0.5, 'sq3-g': -0.5, 'sq3-h': 0, 'air-00': -1, 'air-01': -0.5, 'air-02': -4.5,
  'sq4-a': -3, 'sq4-b': 0.5, 'sq4-b2': 1, 'sq4-c': 0.5, 'sq4-d': 4, 'sq4-e': -1.5,
  'sq5-a': -1.5, 'sq5-d': 0, 'sq5-e': 0, 'sq5-f': -1.5, 'sq5-g': 0,
  'tri-pc': -1, 'asc-b': 0.5, 'tri-pb': -1.5, 'tri-a': -1, 'tri-c': -2, 'tri-d': -0.5, 'tri-e': 0, 'tri-f': 0.5, 'tri-g': -1.5,
  'airtri-m1': -5.5, 'airtri-e': 1, 'aq2-c': 0, 'aq3-m': -0.5, 'airtri-a': -5, 'airtri-b': -1.5, 'airtri-c': 5, 'airtri-d': 5.5,
  'aq1-a': -1.5, 'aq1-b': 1, 'aq2-a': -1.5, 'aq2-b': 0.5, 'aq3-a': -4, 'aq3-b': 3.5,
  'plume-a': -2, 'plume-b': -1, 'plume-c': -1, 'plume-d': 0, 'plume-e': 1.5, 'plume-f': -1.5,
};

/**
 * Square 1 (user-approved preview `docs/tmp/golpes/sq1-v4.gif`): draw the
 * near blade from the back, sweep it low behind the hip, throw it far and
 * down-forward, hold the chain taut, recall it. The far blade stays in the
 * far hand.
 */
const SQUARE1: StrikeDef = {
  id: 'square1',
  hand: 'near',
  heldBlade: { from: 'back' },
  phases: [
    { id: 'draw', ticks: 5, advancePx: 0, pose: 'sq1-a', centerX: CX['sq1-a'] },
    { id: 'sweep', ticks: 4, advancePx: 4, pose: 'sq1-b', centerX: CX['sq1-b'] },
    { id: 'throw', ticks: 5, advancePx: 3, pose: 'sq1-c', centerX: CX['sq1-c'] },
    { id: 'hold', ticks: 12, advancePx: 0, pose: 'sq1-d', centerX: CX['sq1-d'] },
    { id: 'recall', ticks: 8, advancePx: 0, pose: 'sq1-e', centerX: CX['sq1-e'] },
  ],
  blades: {
    near: {
      shoulder: [-2.3, -25.6],
      track: [[-24, -4], [-22, 4], [-8, 15], [14, 9], [42, 7], [80, 12], [84, 12]],
      chainFrom: 0.45,
      motion: {
        draw: { kind: 'draw', from: 'back', behindBody: true },
        sweep: { kind: 'track', from: 0, to: 0.5, ease: 'linear' },
        throw: { kind: 'track', from: 0.5, to: 1, ease: 'out' },
        hold: { kind: 'hold', driftPx: 2 },
        recall: { kind: 'recall', sagPx: 5 },
      },
      trailGrowth: { sweep: { widthPx: 6 }, throw: { widthPx: 4, tailPx: 20, tailFromU: 0.3 } },
      // Approved at up to 73 px long.
      trail: { kind: 'crescent', maxLengthPx: 80 },
      // From the last sweep tick (s 0.375) to the end of the hold.
      active: { fromS: 0.3 },
    },
  },
  hitRadiusPx: 3.5,
  damage: 10,
  hitstunTicks: 14,
  hitstopTicks: 4,
  trailSamplesPerTick: 6,
  trailFadeWidthPx: 4,
  chain: { into: 'square2', heavy: 'plume', from: 'hold', fromTick: 4 },
};

/**
 * Square 2 (user-approved, commit 517c25e): chained from square 1's hold or
 * recall. The far arm, cocked low behind, swings its blade up and forward
 * over the head, then cuts a long steep diagonal down through waist height,
 * while he twists into it (showing his back) and drops into a lunge. The
 * near blade is yanked back from square 1's throw into the near hand.
 */
const SQUARE2: StrikeDef = {
  id: 'square2',
  hand: 'far',
  heldBlade: { from: 'previous', ticks: 9, sagPx: 5 },
  phases: [
    { id: 'load', ticks: 3, advancePx: 0, pose: 'sq2-a', centerX: CX['sq2-a'] },
    { id: 'sweep', ticks: 3, advancePx: 2, pose: 'sq2-b', centerX: CX['sq2-b'] },
    { id: 'throw', ticks: 4, advancePx: 3, pose: 'sq2-c', centerX: CX['sq2-c'] },
    { id: 'hold', ticks: 7, advancePx: 0, pose: 'sq2-d', centerX: CX['sq2-d'] },
    { id: 'recall', ticks: 6, advancePx: 0, pose: 'sq2-e', centerX: CX['sq2-e'] },
  ],
  blades: {
    far: {
      shoulder: [1, -22],
      // From low behind, up and forward to a peak above and ahead of the head
      // (x +15..20), then a long steep diagonal down through waist height.
      track: [[-24, 4], [-14, -20], [0, -34], [20, -36], [40, -15], [57, 2], [66, 14], [64, 18]],
      // Behind the body while it rises behind and over the head, then in front.
      trackDepth: ['behind', 'behind', 'behind', 'front', 'front', 'front', 'front', 'front'],
      chainFrom: 0.1,
      motion: {
        load: { kind: 'draw', from: 'hand', behindBody: true },
        sweep: { kind: 'track', from: 0, to: 0.55, ease: 'linear' },
        throw: { kind: 'track', from: 0.55, to: 1, ease: 'out' },
        hold: { kind: 'hold', driftPx: 2 },
        recall: { kind: 'recall', sagPx: 5 },
      },
      trailGrowth: { sweep: { widthPx: 6 }, throw: { widthPx: 4, tailPx: 20, tailFromU: 0.3 } },
      trail: {
        kind: 'profile',
        // As restrained as square 1's crescent (user: the fan read too big).
        widths: [[0, 2], [0.3, 6], [0.55, 6], [0.7, 4], [1, 4]],
        taperOld: 0.25,
        taperHead: 0.1,
        minLengthPx: 12,
        // Approved at up to 100 px long.
        maxLengthPx: 110,
      },
      // From the start of the descent (first throw tick) to the end of the hold.
      active: { fromS: 0.6 },
    },
  },
  hitRadiusPx: 3.5,
  damage: 10,
  hitstunTicks: 14,
  hitstopTicks: 4,
  trailSamplesPerTick: 6,
  trailFadeWidthPx: 4,
  // Triangle after square 2 is Plume of Prometheus.
  chain: { into: 'square3', heavy: 'plume', from: 'hold', fromTick: 4 },
};

/** The square chain's restrained crescent, cut as soon as it leaves its blade (squares 3 and 4). */
const SQUARE_TRAIL = {
  widths: [[0, 2], [0.3, 6], [0.6, 6], [0.8, 4], [1, 4]],
  taperOld: 0.25,
  taperHead: 0.1,
  minLengthPx: 12,
  // One sample may pass the cap: 50 keeps the drawn trail within 55 px.
  maxLengthPx: 50,
  cutWhenDetached: true,
} as const;

/**
 * Square 3 (draft v2, after the critic; pending user approval): the
 * ascending cut, chained from square 2's hold or recall. The near blade
 * drags along the floor ahead, then Kratos rises and cuts upward in front of
 * him, through a near enemy, to over the head in front, upright. It never
 * stops: the chain window to square 4's descending cut opens as the blade
 * eases into the top, and square 4 carries on from there as one arc. The far
 * blade, yanked back from square 2's throw, stays in the far hand.
 */
const SQUARE3: StrikeDef = {
  id: 'square3',
  hand: 'near',
  heldBlade: { from: 'previous', ticks: 9, sagPx: 5 },
  phases: [
    { id: 'load', ticks: 3, advancePx: 0, pose: 'sq3-a', centerX: CX['sq3-a'] },
    {
      id: 'cut', ticks: 10, advancePx: 2, pose: 'sq3-g', centerX: CX['sq3-g'],
      // The blade scrapes the floor ahead as the cut starts: dust where it rises, a flash where it meets the chest.
      effects: [
        { kind: 'dust', at: [34, 52] },
        { kind: 'flash', x: 44, ticks: 3, radiusPx: 6 },
      ],
    },
    // Brief apex at the top of the cut before returning.
    { id: 'hold', ticks: 4, advancePx: 0, pose: 'sq3-h', centerX: CX['sq3-h'] },
    // Blades return to Kratos; square 4 chains once they are back in hand.
    { id: 'recall', ticks: 7, advancePx: 0, pose: 'sq3-a', centerX: CX['sq3-a'] },
  ],
  blades: {
    near: {
      // Near shoulder of the cut (sq3-g).
      shoulder: [-4.5, -29.7],
      // On the floor ahead (41 px out), up in front through chest height (75 px out), to
      // over the head in front (65 px up): where the cut peaks.
      track: [[41.1, 28.7], [53.5, 27.7], [75.2, -0.3], [56.0, -24.3], [19.0, -35.3], [-4.5, -36.3]],
      chainFrom: 0.05,
      motion: {
        // The blade drags along the floor to the start of the cut.
        load: { kind: 'draw', from: 'hand', behindBody: true, via: 'ground' },
        cut: { kind: 'track', from: 0, to: 1, ease: 'linear' },
        hold: { kind: 'hold', driftPx: 2 },
        recall: { kind: 'recall', sagPx: 5 },
      },
      trailGrowth: { cut: { widthPx: 6 }, hold: { widthPx: 6, tailPx: 30, tailFromU: 0.4 } },
      // No trail while the blade drags along the floor.
      trailFromS: 0.005,
      trail: { kind: 'profile', ...SQUARE_TRAIL },
      // Once it rises (not while it drags), through the top.
      active: { fromS: 0.12 },
    },
  },
  hitRadiusPx: 3.5,
  damage: 10,
  hitstunTicks: 14,
  hitstopTicks: 4,
  trailSamplesPerTick: 6,
  trailFadeWidthPx: 4,
  chain: { into: 'square4', heavy: 'plume', from: 'recall', fromTick: 4 },
};

/**
 * Square 4 (per GoW 1 reference 20.90s-21.23s): chained after square 3's
 * blades return to Kratos. From Kratos' hands, both blades lash wide outward
 * across chest height: the near blade whips forward 88 px into a deep lunge
 * and the far blade whips backward 70 px behind him, both leaving fire trails
 * and holding wide before returning or chaining into square 5's spin.
 */
const SQUARE4: StrikeDef = {
  id: 'square4',
  hand: 'near',
  heldBlade: { from: 'previous', ticks: 6, sagPx: 5 },
  phases: [
    { id: 'load', ticks: 3, advancePx: 0, pose: 'sq3-a', centerX: CX['sq3-a'] },
    { id: 'throw', ticks: 8, advancePx: 3, pose: 'sq3-d', centerX: CX['sq3-d'] },
    {
      id: 'hold', ticks: 8, advancePx: 0, pose: 'sq3-e', centerX: CX['sq3-e'],
      effects: [{ kind: 'flash', x: 84, ticks: 3, radiusPx: 6 }],
    },
    { id: 'recall', ticks: 8, advancePx: 0, pose: 'sq3-f', centerX: CX['sq3-f'] },
  ],
  blades: {
    near: {
      // Near shoulder of the lunge (sq3-e).
      shoulder: [-3.7, -31.7],
      // From Kratos' hand, whipped forward across chest height, reaching 89 px ahead.
      track: [[-10.0, -28.0], [-4.0, -28.0], [25.0, -16.0], [60.0, -6.0], [90.0, 2.0], [105.0, 4.0]],
      chainFrom: 0.05,
      motion: {
        load: { kind: 'carry' },
        throw: { kind: 'track', from: 0, to: 1, ease: 'linear' },
        hold: { kind: 'hold', driftPx: 2 },
        recall: { kind: 'recall', sagPx: 5 },
      },
      trailGrowth: { throw: { widthPx: 6 }, hold: { widthPx: 6, tailPx: 35, tailFromU: 0.35 } },
      trail: { kind: 'profile', ...SQUARE_TRAIL },
      active: { fromS: 0.25 },
    },
    far: {
      // Far shoulder of the lunge (sq3-e).
      shoulder: [3.4, -24.2],
      // From Kratos' hand, whipped backward across hip/chest height, reaching 71 px behind.
      track: [[10.0, -22.0], [3.0, -22.0], [-25.0, -14.0], [-50.0, -6.0], [-74.0, 2.0], [-88.0, 4.0]],
      trackDepth: ['behind', 'behind', 'behind', 'behind', 'behind', 'behind'],
      chainFrom: 0.05,
      motion: {
        load: { kind: 'carry' },
        throw: { kind: 'track', from: 0, to: 1, ease: 'linear' },
        hold: { kind: 'hold', driftPx: 2 },
        recall: { kind: 'recall', sagPx: 5 },
      },
      trailGrowth: { throw: { widthPx: 6 }, hold: { widthPx: 6, tailPx: 30, tailFromU: 0.35 } },
      trail: { kind: 'profile', ...SQUARE_TRAIL, flip: true },
      active: { fromS: 0.25 },
    },
  },
  hitRadiusPx: 3.5,
  damage: 10,
  hitstunTicks: 14,
  hitstopTicks: 4,
  trailSamplesPerTick: 6,
  trailFadeWidthPx: 4,
  chain: { into: 'square5', heavy: 'plume', from: 'hold', fromTick: 4 },
};

/** Restrained crescent of square 5's two blades, cut as soon as it leaves its blade. */
const SQUARE5_TRAIL = {
  widths: [[0, 2], [0.3, 5], [0.6, 6], [0.85, 5], [1, 4]],
  taperOld: 0.25,
  taperHead: 0.1,
  minLengthPx: 12,
  // One sample may pass the cap: 50 keeps the drawn trail within 55 px.
  maxLengthPx: 50,
  cutWhenDetached: true,
} as const;

/**
 * Square 5 (draft v2, after the critic; pending user approval): the spin,
 * chained from square 4's open arms. Kratos turns one way only: profile,
 * back, inverted profile, front. In side view (D-04, as Betrayal does it)
 * the orbit is an ellipse at waist height, the near blade passing in front
 * of the body and the far one behind it; then each blade rises into a
 * vertical crescent on its own side, out of phase: the near one loops high
 * over the back and ends overhead, the far one makes a lower, later loop in
 * front and ends out in front. Both blades hit, so an enemy behind him is
 * hit too (once per strike).
 */
const SQUARE5: StrikeDef = {
  id: 'square5',
  hand: 'near',
  // Both blades are thrown from the first phase on; nothing is only held.
  heldBlade: { from: 'previous', ticks: 9, sagPx: 5 },
  phases: [
    { id: 'load', ticks: 3, advancePx: 0, pose: 'sq4-a', centerX: CX['sq4-a'] },
    { id: 'orbit', ticks: 5, advancePx: 1, pose: 'sq4-b', centerX: CX['sq4-b'] },
    { id: 'orbit2', ticks: 5, advancePx: 1, pose: 'sq4-b2', centerX: CX['sq4-b2'] },
    { id: 'rise', ticks: 8, advancePx: 0, pose: 'sq4-c', centerX: CX['sq4-c'] },
    { id: 'hold', ticks: 5, advancePx: 0, pose: 'sq4-d', centerX: CX['sq4-d'] },
    { id: 'recall', ticks: 8, advancePx: 0, pose: 'sq4-e', centerX: CX['sq4-e'] },
  ],
  blades: {
    near: {
      // Near shoulder of the front pose (sq4-c).
      shoulder: [-4.4, -31.7],
      // Front pass of the ellipse (18 px up), across in front of the body to
      // the back, then up the back side and over toward the head.
      track: [[64.4, 10], [44.4, 13], [4.4, 14], [-35.6, 13], [-67.6, 4], [-67.6, -22.3], [-43.6, -38.3], [-15.6, -44.3], [-3.6, -45.3]],
      trackDepth: ['front', 'front', 'front', 'front', 'front', 'front', 'front', 'front', 'front'],
      chainFrom: 0,
      motion: {
        load: { kind: 'carry' },
        orbit: { kind: 'track', from: 0, to: 0.165, ease: 'linear' },
        orbit2: { kind: 'track', from: 0.165, to: 0.33, ease: 'linear' },
        rise: { kind: 'track', from: 0.33, to: 1, ease: 'linear' },
        // Drifts outward (back) and down while it hangs overhead.
        hold: { kind: 'hold', driftPx: 4, driftX: -0.5 },
        recall: { kind: 'recall', sagPx: 5 },
      },
      trailGrowth: { orbit: { widthPx: 5 }, orbit2: { widthPx: 5 }, rise: { widthPx: 6 } },
      trail: { kind: 'profile', ...SQUARE5_TRAIL },
      active: { fromS: 0.02 },
    },
    far: {
      // Far shoulder of the front pose (sq4-c).
      shoulder: [5.1, -31.5],
      // Back pass of the ellipse (26 px up), across behind the body to the
      // front, then a lower loop up the front side, topping 30 px over the
      // shoulder and ending out in front, a little below it (where the far
      // arm of sq4-d points).
      track: [[-61.1, 10], [-41.1, 7], [-5.1, 6], [34.9, 7], [62.9, 4], [62.9, -22.5], [52, -30], [38, -18], [30, -14]],
      // Behind the body while it crosses behind it.
      trackDepth: ['behind', 'behind', 'behind', 'front', 'front', 'front', 'front', 'front', 'front'],
      chainFrom: 0,
      motion: {
        load: { kind: 'carry' },
        orbit: { kind: 'track', from: 0, to: 0.165, ease: 'linear' },
        orbit2: { kind: 'track', from: 0.165, to: 0.33, ease: 'linear' },
        // Out of phase: it is still rising while the near blade hangs overhead.
        rise: { kind: 'track', from: 0.33, to: 0.8, ease: 'linear' },
        hold: { kind: 'track', from: 0.8, to: 1, ease: 'out' },
        recall: { kind: 'recall', sagPx: 5 },
      },
      trailGrowth: { orbit: { widthPx: 5 }, orbit2: { widthPx: 5 }, rise: { widthPx: 6 }, hold: { widthPx: 4 } },
      trail: { kind: 'profile', ...SQUARE5_TRAIL, flip: true },
      active: { fromS: 0.02 },
    },
  },
  hitRadiusPx: 3.5,
  damage: 14,
  hitstunTicks: 14,
  hitstopTicks: 4,
  trailSamplesPerTick: 6,
  trailFadeWidthPx: 4,
  chain: { into: 'square6', heavy: 'spirit', from: 'hold', fromTick: 3 },
};

/** Restrained crescent of square 6's two lashes, cut as soon as it leaves its blade. */
const SQUARE6_TRAIL = {
  widths: [[0, 2], [0.3, 5], [0.6, 5], [0.85, 4], [1, 4]],
  taperOld: 0.25,
  taperHead: 0.1,
  minLengthPx: 12,
  // One sample may pass the cap: 50 keeps the drawn trail within 55 px.
  maxLengthPx: 50,
  cutWhenDetached: true,
} as const;

/**
 * Square 6's track parameters: the blades swing back from overhead to behind
 * Kratos (`back`), sweep round him from behind to the front (`ring`) and end
 * in the double lash forward (`tip`, where they hold).
 */
const SQ6 = { back: 2 / 8, ring: 6 / 8 } as const;

/** Square 6's motion, shared by both blades. */
const SQUARE6_MOTION = {
  load: { kind: 'carry' },
  // Swung back from overhead to behind the hip, torso twisting after them.
  back: { kind: 'track', from: 0, to: SQ6.back, ease: 'out' },
  // The ring at waist height, behind to front: the twisted pose first, then the arms spread.
  sweepA: { kind: 'track', from: SQ6.back, to: (SQ6.back + SQ6.ring) / 2, ease: 'linear' },
  sweepB: { kind: 'track', from: (SQ6.back + SQ6.ring) / 2, to: SQ6.ring, ease: 'linear' },
  // Both lash forward at once.
  throw: { kind: 'track', from: SQ6.ring, to: 1, ease: 'out' },
  hold: { kind: 'hold', driftPx: 2, at: 1 },
} as const;

const SQUARE6_GROWTH = {
  back: { widthPx: 5 },
  sweepA: { widthPx: 5 },
  sweepB: { widthPx: 5 },
  throw: { widthPx: 4, tailPx: 20, tailFromU: 0.3 },
};

/** The ring sweep (once it is round) and the lash forward hit once each. */
const SQUARE6_HITS = [{ fromS: SQ6.back + 0.05, toS: SQ6.ring }, { fromS: SQ6.ring + 0.04 }] as const;

/**
 * Square 6 (user: "el ultimo ataque esta al reves"): the finisher, inverted.
 * Chained from square 5: both blades swing back from overhead to behind
 * Kratos, torso twisting back; the wide ring sweep goes round him from
 * behind to the front at waist height (the near blade passing low in front
 * of the body, the far one behind it, a few ticks later); and it ends in
 * the double lash forward, both blades at once, crossing in an X, 88 px out:
 * the heavy blow. Then a short hold and the blades come back to his arms
 * crossed over the chest. It ends the square chain.
 */
const SQUARE6: StrikeDef = {
  id: 'square6',
  hand: 'near',
  // Both blades are thrown from the first phase on; nothing is only held.
  heldBlade: { from: 'previous', ticks: 9, sagPx: 5 },
  phases: [
    { id: 'load', ticks: 4, advancePx: 0, pose: 'sq5-a', centerX: CX['sq5-a'] },
    { id: 'back', ticks: 5, advancePx: 0, pose: 'tri-pb', centerX: CX['tri-pb'] },
    { id: 'sweepA', ticks: 4, advancePx: 0, pose: 'tri-pc', centerX: CX['tri-pc'] },
    { id: 'sweepB', ticks: 5, advancePx: 1, pose: 'sq5-g', centerX: CX['sq5-g'] },
    { id: 'throw', ticks: 5, advancePx: 5, pose: 'sq5-d', centerX: CX['sq5-d'] },
    { id: 'hold', ticks: 4, advancePx: 0, pose: 'sq5-e', centerX: CX['sq5-e'] },
    { id: 'recall', ticks: 7, advancePx: 0, pose: 'sq5-f', centerX: CX['sq5-f'] },
  ],
  blades: {
    near: {
      // Near shoulder of the lunge (sq5-d).
      shoulder: [-2.5, -27.5],
      // Overhead behind, back and down to behind the hip, round low in front
      // of the body, then lashed forward at chest height (88 px out with the step).
      track: [[-15.5, -26.5], [-15.5, -26.5], [-31.5, -10.5], [-37.5, 5.5], [-25.5, 13.5], [2.5, 15.5], [30.5, 13.5], [44.5, 7.5], [64.5, -0.5], [85.5, -4.5], [85.5, -4.5]],
      trackDepth: ['behind', 'behind', 'behind', 'behind', 'front', 'front', 'front', 'front', 'front', 'front', 'front'],
      chainFrom: 0,
      motion: { ...SQUARE6_MOTION, recall: { kind: 'recall', sagPx: 5, to: [1, -33] } },
      trailGrowth: SQUARE6_GROWTH,
      trail: { kind: 'profile', ...SQUARE6_TRAIL },
      // The ring and the lash are fresh lines.
      trailBreakAt: [SQ6.ring],
      active: SQUARE6_HITS,
    },
    far: {
      // Far shoulder of the lunge (sq5-d).
      shoulder: [3.6, -27.1],
      // Out of phase: round behind the body, higher, then the same lash a
      // little lower and shorter, crossing the near blade.
      track: [[-29.6, -22.9], [-29.6, -22.9], [-43.6, -8.9], [-47.6, 1.1], [-33.6, -0.9], [-3.6, -2.9], [26.4, -0.9], [38.4, 3.1], [52.4, 5.1], [75.4, -0.9], [75.4, -0.9]],
      trackDepth: ['behind', 'behind', 'behind', 'behind', 'behind', 'behind', 'behind', 'front', 'front', 'front', 'front'],
      chainFrom: 0,
      lag: { ticks: 3, until: 'throw' },
      motion: { ...SQUARE6_MOTION, recall: { kind: 'recall', sagPx: 5, to: [9, -34] } },
      trailGrowth: SQUARE6_GROWTH,
      trail: { kind: 'profile', ...SQUARE6_TRAIL },
      trailBreakAt: [SQ6.ring],
      active: SQUARE6_HITS,
    },
  },
  hitRadiusPx: 3.5,
  // The finisher: a heavy blow (longer hit pause, harder knockback, bigger shake).
  damage: 20,
  hitstunTicks: 14,
  hitstopTicks: 4,
  trailSamplesPerTick: 6,
  trailFadeWidthPx: 4,
};

/** Restrained crescent of the triangle's two blades, cut as soon as it leaves its blade. */
const TRIANGLE_TRAIL = {
  widths: [[0, 2], [0.4, 6], [0.8, 6], [1, 4]],
  taperOld: 0.25,
  taperHead: 0.1,
  minLengthPx: 12,
  // One sample may pass the cap: 50 keeps the drawn trail within 55 px.
  maxLengthPx: 50,
  cutWhenDetached: true,
} as const;

/**
 * Ground triangle (deliberate GoW1 heavy dual-blade sequential cleave, opening strike
 * of Spirit and Valor of Hercules). Kratos steps forward and unleashes two successive,
 * powerful diagonal slashes across his front: first the right arm cleaves down-left
 * while the left blade remains held in hand, followed by a forward step and the left
 * arm cleaving down-right across while the right blade rests in hand (two distinct hits
 * of 10 damage each, totaling 20 heavy damage).
 * Holding triangle through draw/load branches into the launcher (then Ascension).
 * It does not chain; guard or jump cut its recall short.
 */
const TRIANGLE: StrikeDef = {
  id: 'triangle',
  hand: 'near',
  heldBlade: { from: 'back' },
  phases: [
    { id: 'draw', ticks: 4, advancePx: 1, pose: 'tri-a', centerX: CX['tri-a'] },
    { id: 'load', ticks: 5, advancePx: 1, pose: 'tri-pb', centerX: CX['tri-pb'] },
    { id: 'rise', ticks: 3, advancePx: 1, pose: 'sq1-b', centerX: CX['sq1-b'] },
    { id: 'slash1', ticks: 6, advancePx: 2, pose: 'sq1-c', centerX: CX['sq1-c'] },
    { id: 'settle1', ticks: 3, advancePx: 1, pose: 'sq1-d', centerX: CX['sq1-d'] },
    { id: 'step', ticks: 5, advancePx: 2, pose: 'sq2-b', centerX: CX['sq2-b'] },
    { id: 'slash2', ticks: 6, advancePx: 0, pose: 'sq2-c', centerX: CX['sq2-c'] },
    { id: 'hold2', ticks: 4, advancePx: 0, pose: 'sq2-d', centerX: CX['sq2-d'] },
    { id: 'recall', ticks: 6, advancePx: 0, pose: 'sq2-e', centerX: CX['sq2-e'] },
  ],
  blades: {
    near: {
      // Near shoulder of the slashing arm (sq1-c).
      shoulder: [-2.3, -25.4],
      // From the hands at the hip/shoulder, across the chest in a diagonal cleave down-forward,
      // then sweeping through the bottom back toward the hip.
      track: [
        [8.3, 11.4], [-12.0, 8.0], [-28.0, 5.0],
        [-6.0, -22.0], [32.0, -18.0], [68.0, -6.0], [80.0, 10.0], [60.0, 22.0],
        [30.0, 20.0], [8.3, 11.4], [0.0, 8.0],
      ],
      chainFrom: 0.1,
      motion: {
        draw: { kind: 'carry' },
        load: { kind: 'track', from: 0, to: 2 / 8, ease: 'linear' },
        rise: { kind: 'track', from: 2 / 8, to: 4 / 8, ease: 'linear' },
        slash1: { kind: 'track', from: 4 / 8, to: 6 / 8, ease: 'linear' },
        settle1: { kind: 'track', from: 6 / 8, to: 1.0, ease: 'out' },
      },
      trailGrowth: { slash1: { widthPx: 6 } },
      trail: { kind: 'profile', ...TRIANGLE_TRAIL },
      trailBreakAt: [0.02],
      active: { fromS: 0.5, toS: 0.74 },
    },
    far: {
      // Far shoulder of the slashing arm (sq2-c).
      shoulder: [1.0, -22.0],
      // Staggered second diagonal cut following after the first: winds up overhead during step (sq2-b),
      // cleaves across chest height in slash2 (sq2-c), holds (sq2-d), and recalls (sq2-e).
      track: [
        [-24.0, 4.0], [-14.0, -20.0], [0.0, -34.0], [20.0, -36.0],
        [40.0, -15.0], [57.0, 2.0], [66.0, 14.0], [64.0, 18.0],
      ],
      trackDepth: ['behind', 'behind', 'behind', 'front', 'front', 'front', 'front', 'front'],
      chainFrom: 0.1,
      motion: {
        step: { kind: 'track', from: 0, to: 0.55, ease: 'linear' },
        slash2: { kind: 'track', from: 0.55, to: 1.0, ease: 'linear' },
        hold2: { kind: 'hold', driftPx: 1, at: 1.0 },
        recall: { kind: 'recall', sagPx: 4, fromS: 1.0 },
      },
      trailGrowth: { slash2: { widthPx: 6 } },
      trail: { kind: 'profile', ...TRIANGLE_TRAIL },
      trailBreakAt: [0.02],
      active: [{ fromS: -1, toS: -0.5 }, { fromS: 0.54, toS: 0.99 }],
    },
  },
  hitRadiusPx: 3.5,
  damage: 10,
  heavy: true,
  hitstunTicks: 18,
  hitstopTicks: 4,
  trailSamplesPerTick: 6,
  trailFadeWidthPx: 4,
  branch: { atEndOf: 'load', ifHeld: 'heavy-attack', into: 'launcher' },
  cancel: { from: 'recall', fromTick: 2 },
};

/** Plume's motion, shared by both blades. */
const PLUME_MOTION = {
  // Both blades sweep from previous strike down and back behind the hips in a wide fiery arc:
  carry: { kind: 'carry', arcPx: 20 },
  // Sweep up behind the back along the spine, reaching the apex overhead as Kratos arches back.
  top: { kind: 'track', from: 0, to: 3 / 7, ease: 'linear' },
  // Over the head driving forward.
  over: { kind: 'track', from: 3 / 7, to: 4 / 7, ease: 'linear' },
  // Accelerates into the ground.
  down: { kind: 'track', from: 4 / 7, to: 1, ease: 'in' },
  slam: { kind: 'hold', driftPx: 0 },
  recall: { kind: 'recall', sagPx: 5 },
} as const;

const PLUME_GROWTH = { carry: { widthPx: 4 }, top: { widthPx: 6 }, over: { widthPx: 6 }, down: { widthPx: 6 } };

/**
 * Plume of Prometheus (square, square, triangle; draft v1, pending critic
 * and user approval): triangle pressed in square 2's chain window. Both
 * blades come from square 2 with a dynamic backswing behind Kratos' hips/waist,
 * sweep up behind his back as he arches in plume-b, swing over his head and slam
 * the ground in front as two crescents, Kratos crouched; the fire they leave burns
 * on the ground for a while as its own entity (the "estallido igneo") and hits and
 * lifts enemies standing in it. He pulls the blades back with his arms open, the hands glowing.
 */
const PLUME: StrikeDef = {
  id: 'plume',
  hand: 'near',
  heldBlade: { from: 'previous', ticks: 9, sagPx: 5 },
  phases: [
    { id: 'carry', ticks: 7, advancePx: 0, pose: 'plume-a', centerX: CX['plume-a'] },
    { id: 'top', ticks: 4, advancePx: 0, pose: 'plume-b', centerX: CX['plume-b'] },
    { id: 'over', ticks: 4, advancePx: 0, pose: 'plume-c', centerX: CX['plume-c'] },
    { id: 'down', ticks: 4, advancePx: 3, pose: 'plume-d', centerX: CX['plume-d'] },
    {
      id: 'slam', ticks: 14, advancePx: 0, pose: 'plume-e', centerX: CX['plume-e'],
      effects: [
        // Measured on the reference: 16.53-16.90 s, about 22 ticks, from Kratos' feet to where the blades lie.
        { kind: 'groundFire', from: 20, to: 80, heightPx: 3, ticks: 22, linger: { damage: 10, hitstunTicks: 16, liftVy: -220 } },
        { kind: 'dust', at: [20, 80] },
        // Where the near blade lands.
        { kind: 'flash', x: 79, ticks: 2, radiusPx: 6 },
        { kind: 'shake', px: 2, ticks: 4 },
      ],
    },
    {
      id: 'recall', ticks: 10, advancePx: 0, pose: 'plume-f', centerX: CX['plume-f'],
    },
  ],
  blades: {
    near: {
      // Near shoulder of the arms coming down (plume-d).
      shoulder: [-2, -25.4],
      // Backswing behind waist, rising up the back, over the head and down into the ground.
      track: [
        [-16.0, -12.0],
        [-30.0, -26.0],
        [-28.0, -36.0],
        [-16.0, -42.0],
        [4.0, -48.6],
        [36.0, -36.6],
        [62.0, -10.6],
        [76.0, 17.4],
        [78.0, 23.4],
        [78.0, 29.4],
      ],
      chainFrom: 0,
      motion: PLUME_MOTION,
      trailGrowth: PLUME_GROWTH,
      trail: { kind: 'profile', ...TRIANGLE_TRAIL },
      trailBreakAt: [0.02],
      active: { fromS: 3 / 7 },
    },
    far: {
      // Far shoulder of the arms coming down (plume-d).
      shoulder: [4.1, -24.9],
      // The same slam, slightly offset behind: two crescents.
      track: [
        [-28.0, -11.0],
        [-42.0, -25.0],
        [-40.0, -35.0],
        [-28.1, -41.0],
        [-8.1, -47.1],
        [17.9, -33.1],
        [43.9, -7.1],
        [57.9, 18.9],
        [59.9, 22.9],
        [59.9, 28.9],
      ],
      trackDepth: ['behind', 'behind', 'behind', 'behind', 'behind', 'front', 'front', 'front', 'front', 'front'],
      chainFrom: 0,
      motion: PLUME_MOTION,
      trailGrowth: PLUME_GROWTH,
      trail: { kind: 'profile', ...TRIANGLE_TRAIL },
      trailBreakAt: [0.02],
      active: { fromS: 3 / 7 },
    },
  },
  hitRadiusPx: 3.5,
  damage: 20,
  hitstunTicks: 20,
  hitstopTicks: 6,
  trailSamplesPerTick: 6,
  trailFadeWidthPx: 4,
  impact: { phase: 'slam', from: 20, to: 80, heightPx: 20 },
  cancel: { from: 'recall', fromTick: 6 },
};

/** Spirit of Hercules' motion, shared by both blades: slightly slower, grander backswing and slam. */
const SPIRIT_MOTION = {
  // Both blades sweep from previous strike down and back behind the hips in a wide fiery arc:
  carry: { kind: 'carry', arcPx: 22 },
  // Sweep up behind the back along the spine, reaching the apex overhead as Kratos arches back.
  top: { kind: 'track', from: 0, to: 3 / 7, ease: 'linear' },
  // Over the head driving forward.
  over: { kind: 'track', from: 3 / 7, to: 4 / 7, ease: 'linear' },
  // Accelerates into the ground with heavy momentum.
  down: { kind: 'track', from: 4 / 7, to: 1, ease: 'in' },
  slam: { kind: 'hold', driftPx: 0 },
  recall: { kind: 'recall', sagPx: 5 },
} as const;

const SPIRIT_GROWTH = { carry: { widthPx: 5 }, top: { widthPx: 7 }, over: { widthPx: 8 }, down: { widthPx: 8 } };

const SPIRIT_TRAIL = {
  widths: [[0, 3], [0.35, 7], [0.75, 8], [1, 5]],
  taperOld: 0.2,
  taperHead: 0.1,
  minLengthPx: 12,
  maxLengthPx: 70,
  cutWhenDetached: true,
} as const;

/**
 * Spirit of Hercules (5 squares + triangle; finisher): triangle pressed in square 5's chain window.
 * The same overhead double slam as Plume of Prometheus, but slightly slower, heavier, with amplified
 * fiery lights, multiple ground detonation flashes, wider ground fires, and greater impact.
 */
const SPIRIT: StrikeDef = {
  id: 'spirit',
  hand: 'near',
  heldBlade: { from: 'previous', ticks: 9, sagPx: 5 },
  heavy: true,
  phases: [
    { id: 'carry', ticks: 8, advancePx: 0, pose: 'plume-a', centerX: CX['plume-a'] },
    { id: 'top', ticks: 6, advancePx: 0, pose: 'plume-b', centerX: CX['plume-b'] },
    { id: 'over', ticks: 5, advancePx: 0, pose: 'plume-c', centerX: CX['plume-c'] },
    { id: 'down', ticks: 5, advancePx: 4, pose: 'plume-d', centerX: CX['plume-d'] },
    {
      id: 'slam', ticks: 18, advancePx: 0, pose: 'plume-e', centerX: CX['plume-e'],
      effects: [
        { kind: 'groundFire', from: 16, to: 92, heightPx: 4, ticks: 26, linger: { damage: 14, hitstunTicks: 20, liftVy: -260 } },
        { kind: 'dust', at: [16, 92] },
        { kind: 'flash', x: 78, ticks: 3, radiusPx: 9 },
        { kind: 'flash', x: 60, ticks: 3, radiusPx: 7 },
        { kind: 'flash', x: 40, ticks: 2, radiusPx: 6 },
        { kind: 'shake', px: 4, ticks: 7 },
      ],
    },
    {
      id: 'recall', ticks: 12, advancePx: 0, pose: 'plume-f', centerX: CX['plume-f'],
    },
  ],
  blades: {
    near: {
      shoulder: [-2, -25.4],
      track: [
        [-16.0, -12.0],
        [-30.0, -26.0],
        [-28.0, -36.0],
        [-16.0, -42.0],
        [4.0, -48.6],
        [36.0, -36.6],
        [62.0, -10.6],
        [76.0, 17.4],
        [78.0, 23.4],
        [78.0, 29.4],
      ],
      chainFrom: 0,
      motion: SPIRIT_MOTION,
      trailGrowth: SPIRIT_GROWTH,
      trail: { kind: 'profile', ...SPIRIT_TRAIL },
      trailBreakAt: [0.02],
      active: { fromS: 3 / 7 },
    },
    far: {
      shoulder: [4.1, -24.9],
      track: [
        [-28.0, -11.0],
        [-42.0, -25.0],
        [-40.0, -35.0],
        [-28.1, -41.0],
        [-8.1, -47.1],
        [17.9, -33.1],
        [43.9, -7.1],
        [57.9, 18.9],
        [59.9, 22.9],
        [59.9, 28.9],
      ],
      trackDepth: ['behind', 'behind', 'behind', 'behind', 'behind', 'front', 'front', 'front', 'front', 'front'],
      chainFrom: 0,
      motion: SPIRIT_MOTION,
      trailGrowth: SPIRIT_GROWTH,
      trail: { kind: 'profile', ...SPIRIT_TRAIL },
      trailBreakAt: [0.02],
      active: { fromS: 3 / 7 },
    },
  },
  hitRadiusPx: 4,
  damage: 28,
  hitstunTicks: 26,
  hitstopTicks: 8,
  trailSamplesPerTick: 6,
  trailFadeWidthPx: 4,
  impact: { phase: 'slam', from: 16, to: 92, heightPx: 25 },
  cancel: { from: 'recall', fromTick: 8 },
};

/** The launcher's motion, shared by both blades: a low sweep along the ground, a lift up the front, a hold on top. */
const LAUNCHER_MOTION = {
  carry: { kind: 'carry' },
  sweep: { kind: 'track', from: 0, to: 3 / 7, ease: 'linear' },
  lift: { kind: 'track', from: 3 / 7, to: 1, ease: 'out' },
  recall: { kind: 'recall', sagPx: 5, fromS: 1 },
} as const;

const LAUNCHER_GROWTH = { sweep: { widthPx: 5 }, lift: { widthPx: 6 } };

/**
 * The launcher (triangle held through the charge; manual "Lanzar al enemigo
 * al aire", video 42.6-43.2 s): Kratos stays on the ground, both blades
 * sweep low along the floor and lift up the front, launching the foot
 * soldier. Still holding triangle at the end of the lift sends Kratos
 * immediately after it into Ascension; releasing it recalls the blades.
 */
const LAUNCHER: StrikeDef = {
  id: 'launcher',
  hand: 'near',
  heldBlade: { from: 'previous', ticks: 9, sagPx: 5 },
  launch: { vy: -380 },
  phases: [
    { id: 'carry', ticks: 2, advancePx: 0, pose: 'tri-pc', centerX: CX['tri-pc'] },
    { id: 'sweep', ticks: 12, advancePx: 4, pose: 'tri-f', centerX: CX['tri-f'] },
    { id: 'lift', ticks: 8, advancePx: 0, pose: 'sq3-h', centerX: CX['sq3-h'] },
    { id: 'recall', ticks: 10, advancePx: 0, pose: 'tri-g', centerX: CX['tri-g'] },
  ],
  blades: {
    near: {
      // Near shoulder of the low sweep (tri-f).
      shoulder: [-1.5, -24.2],
      // From behind the hip, low along the ground ahead, up the front, over the head.
      track: [[-34.5, 6.2], [-34.5, 6.2], [-2.5, 22.2], [43.5, 28.2], [79.5, 20.2], [69.5, 10.2], [53.5, -9.8], [25.5, -31.8], [-2.5, -51.8], [-2.5, -51.8]],
      chainFrom: 0,
      motion: LAUNCHER_MOTION,
      trailGrowth: LAUNCHER_GROWTH,
      trail: { kind: 'profile', ...TRIANGLE_TRAIL },
      trailBreakAt: [3 / 7],
      // The lift up the front hits and launches.
      active: { fromS: 0.45 },
    },
    far: {
      // Far shoulder of the low sweep (tri-f).
      shoulder: [4.6, -23.7],
      // The same sweep a little behind and lower.
      track: [[-48.6, 9.7], [-48.6, 9.7], [-18.6, 23.7], [27.4, 29.7], [61.4, 21.7], [53.4, 11.7], [39.4, -8.3], [11.4, -30.3], [-14.6, -48.3], [-14.6, -48.3]],
      trackDepth: ['behind', 'behind', 'behind', 'front', 'front', 'front', 'front', 'front', 'front', 'front'],
      chainFrom: 0,
      motion: LAUNCHER_MOTION,
      trailGrowth: LAUNCHER_GROWTH,
      trail: { kind: 'profile', ...TRIANGLE_TRAIL },
      trailBreakAt: [3 / 7],
      active: { fromS: 0.45 },
    },
  },
  hitRadiusPx: 3.5,
  damage: 10,
  hitstunTicks: 14,
  hitstopTicks: 4,
  trailSamplesPerTick: 6,
  trailFadeWidthPx: 4,
  // Held through the lift, Kratos leaps after the enemy immediately.
  branch: { atEndOf: 'lift', ifHeld: 'heavy-attack', into: 'ascension' },
  cancel: { from: 'recall', fromTick: 4 },
};

/**
 * Ascension (triangle held through the launcher's top hold; user feedback:
 * not another attack, a leap). Kratos jumps after the launched enemy at full
 * strength, hangs for about 0.5 s with low gravity while the blades stay
 * held in his hands (no track, no trail, no hit), then falls normally and
 * lands. Nothing on the ground: at most a little dust where he lands.
 */
const ASCENSION: StrikeDef = {
  id: 'ascension',
  hand: 'near',
  heldBlade: { from: 'previous', ticks: 9, sagPx: 5 },
  air: true,
  phases: [
    // A short crouch to take off (the leap starts on the phase's first tick, so it cannot be the first phase).
    { id: 'crouch', ticks: 2, advancePx: 0, pose: 'tri-f', centerX: CX['tri-f'] },
    // Leaves the ground at 460 px/s: the apex is reached about 20 ticks later.
    { id: 'leap', ticks: 10, advancePx: 0, pose: 'air-00', centerX: CX['air-00'], gravity: 1.4, leapVy: -460 },
    { id: 'rise', ticks: 10, advancePx: 0, pose: 'air-02', centerX: CX['air-02'], gravity: 1.4 },
    // The suspension: low gravity for 30 ticks, his vertical speed stays under 100 px/s.
    { id: 'hang', ticks: 30, advancePx: 0, pose: 'air-01', centerX: CX['air-01'], gravity: 0.2 },
    { id: 'fall', ticks: 60, advancePx: 0, pose: 'air-02', centerX: CX['air-02'], gravity: 1.2, until: { event: 'grounded', minTicks: 3 } },
    {
      id: 'land', ticks: 8, advancePx: 0, pose: 'tri-f', centerX: CX['tri-f'],
      effects: [{ kind: 'dust', at: [-4, 4] }],
    },
  ],
  // The blades stay in his hands for the whole leap: no track, so no trail and no hit window.
  blades: {},
  hitRadiusPx: 3.5,
  damage: 14,
  hitstunTicks: 14,
  hitstopTicks: 6,
  trailSamplesPerTick: 6,
  trailFadeWidthPx: 4,
  // Square or triangle during the follow-up starts the normal air strikes; closes upon touching the ground (land).
  chain: { into: 'air1', heavy: 'airTriangle', from: 'hang', fromTick: 0, until: 'land' },
};

/** What the three air squares share: a light hit, the near-identical trail of the ground strikes. */
const AIR_SQUARE_BASE = {
  hitRadiusPx: 3.5,
  damage: 10,
  hitstunTicks: 14,
  hitstopTicks: 4,
  trailSamplesPerTick: 6,
  trailFadeWidthPx: 4,
} as const;

/**
 * Air square 1 (manual "Ataque horizontal", GoW1 25.07-25.40 s): the near arm
 * cocks up behind the shoulder, then lashes the blade straight forward at
 * chest height, torso twisting into the throw, legs trailing; Kratos hangs.
 */
const AIR1: StrikeDef = {
  id: 'air1',
  hand: 'near',
  heldBlade: { from: 'previous', ticks: 9, sagPx: 5 },
  air: true,
  phases: [
    { id: 'cock', ticks: 3, advancePx: 0, pose: 'aq1-a', centerX: CX['aq1-a'], gravity: 0.5 },
    { id: 'lash', ticks: 6, advancePx: 3, pose: 'aq1-b', centerX: CX['aq1-b'], gravity: 0.3 },
    { id: 'settle', ticks: 5, advancePx: 0, pose: 'air-00', centerX: CX['air-00'], gravity: 0.6 },
  ],
  blades: {
    near: {
      // Near shoulder of the lash (aq1-b).
      shoulder: [-4.2, -31.2],
      // Up behind the shoulder, then straight out at chest height.
      track: [[-7.8, -8.8], [-7.8, -8.8], [16.2, -4.8], [44.2, -1.8], [74.2, -0.8], [96.2, -0.8], [96.2, -0.8]],
      chainFrom: 0,
      motion: {
        cock: { kind: 'carry' },
        lash: { kind: 'track', from: 0, to: 1, ease: 'out' },
        settle: { kind: 'recall', sagPx: 4 },
      },
      trailGrowth: { lash: { widthPx: 5 } },
      trail: { kind: 'profile', ...TRIANGLE_TRAIL },
      active: { fromS: 0.25 },
    },
  },
  ...AIR_SQUARE_BASE,
  chain: { into: 'air2', heavy: 'airTriangle', from: 'lash', fromTick: 2 },
};

/**
 * Air square 2 (GoW1 25.43-25.77 s): the far arm, with a reverse twist,
 * sends its blade once round the body in a flat ellipse, passing behind the
 * back and in front of the chest, arms spread.
 */
const AIR2: StrikeDef = {
  id: 'air2',
  hand: 'far',
  heldBlade: { from: 'previous', ticks: 9, sagPx: 5 },
  air: true,
  phases: [
    { id: 'wind', ticks: 3, advancePx: 0, pose: 'aq2-a', centerX: CX['aq2-a'], gravity: 0.4 },
    // Arms spread as the blade leaves the front-right and passes over the back...
    { id: 'orbitA', ticks: 3, advancePx: 1, pose: 'aq2-b', centerX: CX['aq2-b'], gravity: 0.25 },
    // ...the far arm swings back with the reverse twist while it crosses the left side...
    { id: 'orbitB', ticks: 8, advancePx: 1, pose: 'aq2-c', centerX: CX['aq2-c'], gravity: 0.25 },
    // ...and the far arm comes forward again as it closes the ellipse in front of the chest.
    { id: 'orbitC', ticks: 5, advancePx: 1, pose: 'aq2-a', centerX: CX['aq2-a'], gravity: 0.25 },
    { id: 'settle', ticks: 5, advancePx: 0, pose: 'air-00', centerX: CX['air-00'], gravity: 0.6 },
  ],
  blades: {
    far: {
      // Far shoulder of the orbit (aq2-b).
      shoulder: [3.4, -30.6],
      // Flat ellipse (32 x 6 px) around the chest from the front-right: back (upper), left, front (lower).
      track: [[79.8, 0.6], [79.8, 0.6], [51.6, -3.6], [-16.2, -5.4], [-84, -3.6], [-112.2, 0.6], [-84, 4.8], [-16.2, 6.6], [51.6, 4.8], [79.8, 0.6], [79.8, 0.6]],
      trackDepth: ['front', 'front', 'behind', 'behind', 'behind', 'behind', 'front', 'front', 'front', 'front', 'front'],
      chainFrom: 0,
      motion: {
        wind: { kind: 'carry' },
        orbitA: { kind: 'track', from: 0, to: 0.2, ease: 'linear' },
        orbitB: { kind: 'track', from: 0.2, to: 0.7, ease: 'linear' },
        orbitC: { kind: 'track', from: 0.7, to: 1, ease: 'linear' },
        settle: { kind: 'recall', sagPx: 4 },
      },
      trailGrowth: { orbitA: { widthPx: 5 }, orbitB: { widthPx: 5 }, orbitC: { widthPx: 5 } },
      trail: { kind: 'profile', ...TRIANGLE_TRAIL },
      active: { fromS: 0.05 },
    },
  },
  ...AIR_SQUARE_BASE,
  chain: { into: 'air3', heavy: 'airTriangle', from: 'orbitB', fromTick: 2 },
};

/**
 * Air square 3 (GoW1 25.80-26.07 s): the near arm winds up high behind the
 * head, then Kratos lunges forward and the blade cuts a diagonal down and
 * ahead, the body starting to fall.
 */
const AIR3: StrikeDef = {
  id: 'air3',
  hand: 'near',
  heldBlade: { from: 'previous', ticks: 9, sagPx: 5 },
  air: true,
  phases: [
    { id: 'wind', ticks: 3, advancePx: 0, pose: 'aq3-a', centerX: CX['aq3-a'], gravity: 0.4 },
    // The blade goes over the head, the arm straight up and forward...
    { id: 'arc', ticks: 3, advancePx: 1, pose: 'aq3-m', centerX: CX['aq3-m'], gravity: 0.3 },
    // ...then Kratos lunges and cuts down and ahead while he starts to fall.
    { id: 'slash', ticks: 4, advancePx: 3, pose: 'aq3-b', centerX: CX['aq3-b'], gravity: 1.1 },
    { id: 'settle', ticks: 5, advancePx: 0, pose: 'air-00', centerX: CX['air-00'], gravity: 0.6 },
  ],
  blades: {
    near: {
      // Near shoulder of the slash (aq3-b).
      shoulder: [-1.9, -30.5],
      // Up behind the head, over it and down ahead in a diagonal.
      track: [[-11.5, -12.5], [-11.5, -12.5], [4.1, -21.5], [26.9, -19.5], [49.8, -7.5], [70.6, 8.5], [89.3, 24.5], [89.3, 24.5]],
      chainFrom: 0,
      motion: {
        wind: { kind: 'carry' },
        arc: { kind: 'track', from: 0, to: 0.45, ease: 'linear' },
        slash: { kind: 'track', from: 0.45, to: 1, ease: 'linear' },
        settle: { kind: 'recall', sagPx: 4 },
      },
      // The arc and the slash are one stroke: the same width, so the third hit reads as a line.
      trailGrowth: { arc: { widthPx: 6 }, slash: { widthPx: 6 } },
      trail: { kind: 'profile', ...TRIANGLE_TRAIL },
      active: { fromS: 0.5 },
    },
  },
  ...AIR_SQUARE_BASE,
  chain: { heavy: 'airTriangle', from: 'slash', fromTick: 1 },
};

/** Air triangle's motion, shared by both blades (GoW1 38.9-40.3 s): one and a quarter turns of a vertical circle. */
const AIR_TRIANGLE_MOTION = {
  coil: { kind: 'carry' },
  // Up behind the back...
  loop1a: { kind: 'track', from: 0, to: 2 / 12, ease: 'linear' },
  // ...up over the head, arms straight up...
  loop1b: { kind: 'track', from: 2 / 12, to: 4 / 12, ease: 'linear' },
  // ...down the front, arms forward...
  loop2: { kind: 'track', from: 4 / 12, to: 6 / 12, ease: 'linear' },
  // ...under the body as he starts to drop...
  dive: { kind: 'track', from: 6 / 12, to: 8 / 12, ease: 'linear' },
  // ...and recalls immediately into hands after the downward slice.
  swing: { kind: 'recall', sagPx: 2, fromS: 8 / 12 },
} as const;

const AIR_TRIANGLE_GROWTH = {
  loop1a: { widthPx: 6 }, loop1b: { widthPx: 6 }, loop2: { widthPx: 6 }, dive: { widthPx: 6 },
};

/**
 * Air triangle (manual "Ataque vertical", video 38.9-40.3 s, studied at 30
 * fps): at the top of the jump Kratos hangs tucked with both blades lit low
 * behind him (about 0.25 s), then the blades go once round a big vertical
 * circle: up behind, over his head, down the front, under his body and
 * recall directly into hands while he drops; he lands crouched with blades in
 * hands and a burst of dust at his feet. Works after any air square.
 */
const AIR_TRIANGLE: StrikeDef = {
  id: 'airTriangle',
  hand: 'near',
  heldBlade: { from: 'previous', ticks: 9, sagPx: 5 },
  air: true,
  phases: [
    { id: 'coil', ticks: 8, advancePx: 0, pose: 'airtri-a', centerX: CX['airtri-a'], gravity: 0.25 },
    { id: 'loop1a', ticks: 4, advancePx: 0, pose: 'airtri-m1', centerX: CX['airtri-m1'], gravity: 0.15 },
    { id: 'loop1b', ticks: 6, advancePx: 0, pose: 'airtri-b', centerX: CX['airtri-b'], gravity: 0.15 },
    { id: 'loop2', ticks: 5, advancePx: 2, pose: 'airtri-c', centerX: CX['airtri-c'], gravity: 0.25 },
    { id: 'dive', ticks: 5, advancePx: 1, pose: 'airtri-d', centerX: CX['airtri-d'], gravity: 1.8 },
    { id: 'swing', ticks: 4, advancePx: 0, pose: 'airtri-m1', centerX: CX['airtri-m1'], gravity: 2.2, until: { event: 'grounded', minTicks: 0 } },
    { id: 'raise', ticks: 6, advancePx: 0, pose: 'air-01', centerX: CX['air-01'], gravity: 2.2, until: { event: 'grounded', minTicks: 0 } },
    {
      id: 'land', ticks: 6, advancePx: 0, pose: 'tri-f', centerX: CX['tri-f'],
      // The strike ends with the landing: no fire, flash or shake (it does not hit the ground).
      effects: [{ kind: 'dust', at: [4, 30] }],
    },
  ],
  blades: {
    near: {
      // Near shoulder of the arms coming forward (airtri-c).
      shoulder: [-2.9, -30.8],
      // Behind and low, up behind, over the head, down the front, under the body, up behind again to overhead.
      track: [[-34.7, 6.8], [-34.7, 6.8], [-54.9, -9.2], [-42.8, -29.2], [1.8, -41.2], [54.4, -31.2], [82.8, -5.2], [66.6, 18.8], [22.0, 34.8], [-30.6, 28.8], [-63.0, 8.8], [-54.9, -15.2], [-18.5, -37.2], [18.0, -41.2], [18.0, -41.2]],
      trackDepth: ['behind', 'behind', 'behind', 'behind', 'front', 'front', 'front', 'front', 'front', 'behind', 'behind', 'behind', 'front', 'front', 'front'],
      chainFrom: 0,
      motion: AIR_TRIANGLE_MOTION,
      trailGrowth: AIR_TRIANGLE_GROWTH,
      trail: { kind: 'profile', ...TRIANGLE_TRAIL },
      trailBreakAt: [6 / 12],
      active: [{ fromS: 0.2, toS: 0.5 }, { fromS: 0.5, toS: 8 / 12 }],
    },
    far: {
      // Far shoulder of the arms coming forward (airtri-c).
      shoulder: [4.5, -30.1],
      // The same circle a little behind and below, two ticks later: two crescents.
      track: [[-61.8, 9.1], [-61.8, 9.1], [-82.1, -6.9], [-69.9, -26.9], [-25.3, -38.9], [27.3, -28.9], [55.7, -2.9], [39.5, 21.1], [-5.1, 37.1], [-57.8, 31.1], [-90.2, 11.1], [-82.1, -12.9], [-45.6, -34.9], [-9.1, -38.9], [-9.1, -38.9]],
      trackDepth: ['behind', 'behind', 'behind', 'behind', 'behind', 'front', 'front', 'front', 'front', 'behind', 'behind', 'behind', 'front', 'front', 'front'],
      chainFrom: 0,
      lag: { ticks: 2, until: 'swing' },
      motion: AIR_TRIANGLE_MOTION,
      trailGrowth: AIR_TRIANGLE_GROWTH,
      trail: { kind: 'profile', ...TRIANGLE_TRAIL },
      trailBreakAt: [6 / 12],
      active: [{ fromS: 0.2, toS: 0.5 }, { fromS: 0.5, toS: 8 / 12 }],
    },
  },
  hitRadiusPx: 3.5,
  // A heavy blow (the world gives it knockback and extra hitstop from 20 damage).
  damage: 20,
  hitstunTicks: 20,
  hitstopTicks: 6,
  trailSamplesPerTick: 6,
  trailFadeWidthPx: 4,
};

/**
 * Orion's Harpoon (fandom, level 1; draft): the far chain thrown up to an
 * airborne (juggled) enemy and pulled toward Kratos. It grabs only enemies
 * already in the air. Chained from Ascension's follow-up.
 */
const HARPOON: StrikeDef = {
  id: 'harpoon',
  hand: 'far',
  heldBlade: { from: 'previous', ticks: 9, sagPx: 5 },
  air: true,
  grabsAirborne: true,
  launch: { vy: -120, vx: -260 },
  phases: [
    { id: 'carry', ticks: 2, advancePx: 0, pose: 'air-00', centerX: CX['air-00'], gravity: 0.6 },
    { id: 'throw', ticks: 5, advancePx: 1, pose: 'air-02', centerX: CX['air-02'], gravity: 0.6 },
    { id: 'hold', ticks: 4, advancePx: 0, pose: 'air-01', centerX: CX['air-01'], gravity: 0.6 },
    { id: 'recall', ticks: 6, advancePx: 0, pose: 'air-00', centerX: CX['air-00'], gravity: 0.8 },
  ],
  blades: {
    far: {
      shoulder: [3.6, -23.6],
      track: [[6.4, -2.4], [6.4, -2.4], [36.4, -20.4], [66.4, -38.4], [82.4, -42.4], [82.4, -42.4]],
      chainFrom: 0,
      motion: {
        carry: { kind: 'carry' },
        throw: { kind: 'track', from: 0, to: 1, ease: 'out' },
        hold: { kind: 'hold', driftPx: 1 },
        recall: { kind: 'recall', sagPx: 4 },
      },
      trailGrowth: { throw: { widthPx: 4, tailPx: 20, tailFromU: 0.5 } },
      trail: { kind: 'profile', ...TRIANGLE_TRAIL },
      active: { fromS: 0.2 },
    },
  },
  hitRadiusPx: 3.5,
  damage: 10,
  hitstunTicks: 16,
  hitstopTicks: 4,
  trailSamplesPerTick: 6,
  trailFadeWidthPx: 4,
};

export const STRIKES: Readonly<Record<StrikeId, StrikeDef>> = {
  square1: SQUARE1,
  square2: SQUARE2,
  square3: SQUARE3,
  square4: SQUARE4,
  square5: SQUARE5,
  square6: SQUARE6,
  triangle: TRIANGLE,
  launcher: LAUNCHER,
  plume: PLUME,
  spirit: SPIRIT,
  ascension: ASCENSION,
  air1: AIR1,
  air2: AIR2,
  air3: AIR3,
  airTriangle: AIR_TRIANGLE,
  harpoon: HARPOON,
};

/**
 * Where a chained strike came from: the previous strike and its tick when
 * this one started, and that strike's own origin (recursively), so a blade it
 * left out can be followed back to the hand.
 */
export interface StrikeEntry {
  id: StrikeId;
  tick: number;
  /** Feet advance of the previous strike at that tick (px): its origin is this far behind. */
  offsetPx: number;
  /** Kratos turned around when this strike started: the previous strike's x is mirrored. */
  turned: boolean;
  entry?: StrikeEntry;
}

/** A strike in progress (also what the snapshot exposes). */
export type StrikeState = StrikeSnapshot;

/** Feet-relative anchors of a body pose (from the 3D skeleton). */
export type StrikePoseAnchors = (pose: string) => { back: Vec2; hand: Vec2; farHand: Vec2 };

export function strikeLength(def: StrikeDef): number {
  return def.phases.reduce((sum, phase) => sum + phase.ticks, 0);
}

export interface PhaseTime {
  index: number;
  phase: StrikePhase;
  start: number;
  u: number;
}

/** Gravity scale of Kratos at whole tick `tick` (1 unless the phase says otherwise). */
export function strikeGravityAt(def: StrikeDef, tick: number): number {
  return strikePhaseAt(def, Math.min(Math.floor(tick), strikeLength(def) - 1)).phase.gravity ?? 1;
}

/** Phase and phase time at strike time `t` (ticks, may be fractional). */
export function strikePhaseAt(def: StrikeDef, t: number): PhaseTime {
  let start = 0;
  for (let index = 0; index < def.phases.length; index += 1) {
    const phase = def.phases[index];
    if (t < start + phase.ticks) {
      return { index, phase, start, u: Math.max(0, (t - start) / phase.ticks) };
    }
    start += phase.ticks;
  }
  const index = def.phases.length - 1;
  const phase = def.phases[index];
  return { index, phase, start: start - phase.ticks, u: 1 };
}

/** Body pose shown on whole tick `tick`. */
export function strikePoseAt(def: StrikeDef, tick: number): string {
  return strikePhaseAt(def, Math.min(Math.floor(tick), strikeLength(def) - 1)).phase.pose;
}

/** Forward step of the body at strike time `t` (px). */
export function strikeAdvanceAt(def: StrikeDef, t: number): number {
  let advance = 0;
  let start = 0;
  for (const phase of def.phases) {
    if (t < start + phase.ticks) {
      return advance + (phase.advancePx * Math.max(0, t - start)) / phase.ticks;
    }
    advance += phase.advancePx;
    start += phase.ticks;
  }
  return advance;
}

function catmull(p0: Vec2, p1: Vec2, p2: Vec2, p3: Vec2, u: number): Vec2 {
  const axis = (i: 0 | 1): number =>
    0.5 * (2 * p1[i] + (-p0[i] + p2[i]) * u + (2 * p0[i] - 5 * p1[i] + 4 * p2[i] - p3[i]) * u * u
      + (-p0[i] + 3 * p1[i] - 3 * p2[i] + p3[i]) * u * u * u);
  return [axis(0), axis(1)];
}

/** The track of `hand`'s blade; throws if the strike has none. */
function bladeTrack(def: StrikeDef, hand: Hand): BladeTrack {
  const blade = def.blades[hand];
  if (!blade) throw new Error(`strike ${def.id}: no ${hand} blade track`);
  return blade;
}

/**
 * The time `hand`'s blade is at when the strike is at `t`: behind by its
 * `lag` until the cut-off phase, catching up during it, on time after it.
 */
export function bladeTime(def: StrikeDef, hand: Hand, t: number): number {
  const lag = def.blades[hand]?.lag;
  if (!lag) return t;
  const until = phaseStart(def, lag.until);
  if (t < until.start) return Math.max(0, t - lag.ticks);
  if (t < until.start + until.ticks) return t - lag.ticks * (1 - (t - until.start) / until.ticks);
  return t;
}

/** Motion of `hand`'s blade at strike time `t`, or `undefined` while it is held in the hand. */
export function bladeMotionAt(def: StrikeDef, hand: Hand, t: number): { motion: BladeMotion | undefined; u: number } {
  const { phase, u } = strikePhaseAt(def, bladeTime(def, hand, t));
  return { motion: def.blades[hand]?.motion[phase.id], u };
}

/** Point at `s` (0..1) of a track, relative to its shoulder. */
function trackPoint(blade: BladeTrack, s: number): Vec2 {
  const segments = blade.track.length - 3;
  const seg = Math.min(Math.floor(s * segments), segments - 1);
  const u = s * segments - seg;
  return catmull(blade.track[seg], blade.track[seg + 1], blade.track[seg + 2], blade.track[seg + 3], u);
}

/** Depth of `hand`'s track at `s` (its nearest control point). */
export function trackDepthAt(def: StrikeDef, s: number, hand: Hand = def.hand): Depth {
  const blade = def.blades[hand];
  if (!blade?.trackDepth) return 'front';
  const segments = blade.track.length - 3;
  return blade.trackDepth[Math.round(Math.max(0, Math.min(1, s)) * segments) + 1] ?? 'front';
}

/** Shoulder of `hand` at strike time `t` (its track's origin), moved with the body's step. */
export function shoulderAt(def: StrikeDef, t: number, hand: Hand = def.hand): Vec2 {
  const shoulder = bladeTrack(def, hand).shoulder;
  return [shoulder[0] + strikeAdvanceAt(def, t), shoulder[1]];
}

function onTrack(def: StrikeDef, hand: Hand, t: number, s: number): Vec2 {
  const sh = shoulderAt(def, t, hand);
  const p = trackPoint(bladeTrack(def, hand), s);
  return [sh[0] + p[0], sh[1] + p[1]];
}

/**
 * `hand`'s blade while it runs its track or holds at its end (no anchors
 * needed), `null` while it is drawn, recalled or held in the hand.
 */
export function trackBladeAt(def: StrikeDef, t: number, hand: Hand = def.hand): { pos: Vec2; s: number } | null {
  const { motion, u } = bladeMotionAt(def, hand, t);
  // A lagging blade moves on its own clock (the strike's for the others).
  const tb = bladeTime(def, hand, t);
  if (motion?.kind === 'track') {
    const eased = motion.ease === 'out' ? 1 - (1 - u) * (1 - u) : motion.ease === 'in' ? u * u : u;
    const s = motion.from + (motion.to - motion.from) * eased;
    return { pos: onTrack(def, hand, tb, s), s };
  }
  if (motion?.kind === 'hold') {
    const drift = motion.driftPx * Math.sin(u * Math.PI);
    const at = motion.at ?? 1;
    const tip = onTrack(def, hand, tb, at);
    return { pos: [tip[0] + drift * (motion.driftX ?? 0.3), tip[1] + drift], s: at };
  }
  return null;
}

/** Anchor name of each hand. */
const HAND_ANCHOR = { near: 'hand', far: 'farHand' } as const;

/** Anchor of the pose shown at strike time `t`, moved with the body's step. */
export function strikeAnchorAt(def: StrikeDef, t: number, anchors: StrikePoseAnchors, name: 'back' | 'hand' | 'farHand'): Vec2 {
  const point = anchors(strikePoseAt(def, t))[name];
  return [point[0] + strikeAdvanceAt(def, t), point[1]];
}

/** Hand anchor of `hand` at strike time `t`. */
export function strikeHandAt(def: StrikeDef, t: number, anchors: StrikePoseAnchors, hand: Hand): Vec2 {
  return strikeAnchorAt(def, t, anchors, HAND_ANCHOR[hand]);
}

/**
 * One blade at a strike time: where it is, whether its chain is out of the
 * hand (and how much it sags), its angle when it is not on its chain
 * (degrees, y down, facing +x) and whether it is drawn behind the body.
 */
export interface BladeState {
  pos: Vec2;
  chainOut: boolean;
  sagPx: number;
  deg: number;
  behindBody: boolean;
  /** Track parameter of a thrown blade (0 while drawn, 1 held or recalled); 0 for a held blade. */
  s: number;
}

/** `hand`'s blade on its track at strike time `t`: drawn, run along the track, held at its end, recalled. */
export function thrownBladeAt(
  def: StrikeDef,
  t: number,
  anchors: StrikePoseAnchors,
  hand: Hand = def.hand,
  entry?: StrikeEntry,
): BladeState {
  const { motion, u } = bladeMotionAt(def, hand, t);
  // A lagging blade moves on its own clock (the strike's for the others).
  const tb = bladeTime(def, hand, t);
  if (!motion) {
    throw new Error(`strike ${def.id}: the ${hand} blade is not thrown at ${t}`);
  }
  const blade = bladeTrack(def, hand);
  if (motion.kind === 'carry') {
    const grip = strikeHandAt(def, tb, anchors, hand);
    const start = entry ? previousBladeAt(entry, hand, anchors) : [grip[0], grip[1] + 5] as Vec2;
    const end = onTrack(def, hand, tb, 0);
    const e = 1 - (1 - u) * (1 - u);
    const arc = motion.arcPx ? motion.arcPx * Math.sin(u * Math.PI) : 0;
    const pos: Vec2 = [start[0] + (end[0] - start[0]) * e, start[1] + (end[1] - start[1]) * e + arc];
    let deg = 100;
    if (motion.arcPx) {
      const dx = (end[0] - start[0]) * 2 * (1 - u);
      const dy = (end[1] - start[1]) * 2 * (1 - u) + motion.arcPx * Math.PI * Math.cos(u * Math.PI);
      deg = (Math.atan2(dy, dx) * 180) / Math.PI;
    }
    return {
      pos,
      chainOut: Math.hypot(pos[0] - grip[0], pos[1] - grip[1]) > 8,
      sagPx: 0,
      deg,
      behindBody: trackDepthAt(def, 0, hand) === 'behind',
      s: 0,
    };
  }
  if (motion.kind === 'draw') {
    const end = onTrack(def, hand, tb, 0);
    const e = u * u;
    let from: Vec2;
    let mid: Vec2;
    if (motion.from === 'back' && entry) {
      // Chained (e.g. triangle from a square): the blades come from where
      // the previous strike left them, not from the back.
      from = previousBladeAt(entry, hand, anchors);
      mid = [(from[0] + end[0]) / 2, (from[1] + end[1]) / 2];
    } else if (motion.from === 'back') {
      from = strikeAnchorAt(def, tb, anchors, 'back');
      mid = [from[0] - 10, from[1] + 2];
    } else {
      const grip = strikeHandAt(def, tb, anchors, hand);
      from = [grip[0], grip[1] + 5];
      // `via: 'ground'`: the blade drags along the floor to the start.
      mid = motion.via === 'ground' ? [(from[0] + end[0]) / 2, -2] : [(from[0] + end[0]) / 2, (from[1] + end[1]) / 2];
    }
    const k0 = (1 - e) * (1 - e);
    const k1 = 2 * (1 - e) * e;
    const k2 = e * e;
    return {
      pos: [k0 * from[0] + k1 * mid[0] + k2 * end[0], k0 * from[1] + k1 * mid[1] + k2 * end[1]],
      chainOut: false,
      sagPx: 0,
      deg: 150,
      behindBody: motion.behindBody,
      s: 0,
    };
  }
  if (motion.kind === 'recall') {
    const grip: Vec2 = motion.to ? [motion.to[0] + strikeAdvanceAt(def, tb), motion.to[1]] : strikeHandAt(def, tb, anchors, hand);
    // The blade comes back from where its track left it (`fromS`, the end by default).
    const fromS = motion.fromS ?? 1;
    const tip = onTrack(def, hand, tb, fromS);
    const e = u * u;
    const sagPx = motion.sagPx * Math.sin(Math.PI * u);
    return {
      pos: [tip[0] + (grip[0] - tip[0]) * e, tip[1] + (grip[1] - tip[1]) * e + sagPx],
      chainOut: true,
      sagPx,
      deg: 100,
      behindBody: trackDepthAt(def, fromS, hand) === 'behind',
      s: fromS,
    };
  }
  const onCurve = trackBladeAt(def, t, hand)!;
  return {
    pos: onCurve.pos,
    chainOut: onCurve.s > blade.chainFrom,
    sagPx: 0,
    deg: 100,
    behindBody: trackDepthAt(def, onCurve.s, hand) === 'behind',
    s: onCurve.s,
  };
}

/**
 * `hand`'s blade while it is off its track: drawn from the back into the hand
 * on the first phase, or returning from where the previous strike (`entry`)
 * left it; then hanging from the hand. Hanging from the far hand it is
 * behind the body; returning after a turn, it is behind the body while it is
 * still behind Kratos' new front.
 */
export function heldBladeAt(def: StrikeDef, hand: Hand, t: number, anchors: StrikePoseAnchors, entry?: StrikeEntry): BladeState {
  const { index, u } = strikePhaseAt(def, t);
  const grip = strikeHandAt(def, t, anchors, hand);
  const hanging: Vec2 = [grip[0], grip[1] + 5];
  const behindBody = hand === 'far';
  const held = def.heldBlade;
  if (held.from === 'back' && index === 0) {
    const back = strikeAnchorAt(def, t, anchors, 'back');
    const e = u * u;
    return {
      pos: [back[0] + (hanging[0] - back[0]) * e, back[1] + (hanging[1] - back[1]) * e],
      chainOut: false, sagPx: 0, deg: 60, behindBody: true, s: 0,
    };
  }
  if (held.from === 'previous' && entry && t < held.ticks) {
    const start = previousBladeAt(entry, hand, anchors);
    // Yanked back at once, settling into the hand (ease out).
    const v = Math.max(0, t) / held.ticks;
    const e = 1 - (1 - v) * (1 - v);
    const sagPx = held.sagPx * Math.sin(Math.PI * v);
    const pos: Vec2 = [start[0] + (hanging[0] - start[0]) * e, start[1] + (hanging[1] - start[1]) * e + sagPx];
    if (Math.hypot(start[0] - grip[0], start[1] - grip[1]) > 8) {
      return { pos, chainOut: true, sagPx, deg: 90, behindBody: entry.turned && pos[0] < 0, s: 0 };
    }
    return { pos, chainOut: false, sagPx: 0, deg: 90, behindBody, s: 0 };
  }
  return { pos: hanging, chainOut: false, sagPx: 0, deg: 90, behindBody, s: 0 };
}

/** The blade of `hand` at strike time `t`: on its track if it has a motion now, else held. */
export function bladeAt(def: StrikeDef, hand: Hand, t: number, anchors: StrikePoseAnchors, entry?: StrikeEntry): BladeState {
  return bladeMotionAt(def, hand, t).motion
    ? thrownBladeAt(def, t, anchors, hand, entry)
    : heldBladeAt(def, hand, t, anchors, entry);
}

/** Where the previous strike of the combo left `hand`'s blade, in this strike's coordinates. */
function previousBladeAt(entry: StrikeEntry, hand: Hand, anchors: StrikePoseAnchors): Vec2 {
  const previous = bladeAt(STRIKES[entry.id], hand, entry.tick, anchors, entry.entry).pos;
  return [(previous[0] - entry.offsetPx) * (entry.turned ? -1 : 1), previous[1]];
}

/** Near blade at strike time `t`. */
export function nearBladeAt(def: StrikeDef, t: number, anchors: StrikePoseAnchors, entry?: StrikeEntry): BladeState {
  return bladeAt(def, 'near', t, anchors, entry);
}

/** Far blade at strike time `t`. */
export function farBladeAt(def: StrikeDef, t: number, anchors: StrikePoseAnchors, entry?: StrikeEntry): BladeState {
  return bladeAt(def, 'far', t, anchors, entry);
}

/** Sag of `hand`'s chain while it is recalled at strike time `t` (px, at its middle). */
export function chainSagAt(def: StrikeDef, t: number, hand: Hand = def.hand): number {
  const { motion, u } = bladeMotionAt(def, hand, t);
  return motion?.kind === 'recall' ? motion.sagPx * Math.sin(Math.PI * u) : 0;
}

/** A fire trail: the blade's recent positions (oldest first) with their track parameter, and its max width. */
export interface StrikeTrail {
  points: Vec2[];
  s: number[];
  /** Shoulder of the hand on this tick. */
  pivot: Vec2;
  widthPx: number;
}

/** Keeps the newest samples whose path is at most `maxPx` long. */
function keepLast(samples: { p: Vec2; s: number }[], maxPx: number): { p: Vec2; s: number }[] {
  const keep: { p: Vec2; s: number }[] = [];
  let length = 0;
  for (let q = samples.length - 1; q > 0; q -= 1) {
    length += Math.hypot(samples[q].p[0] - samples[q - 1].p[0], samples[q].p[1] - samples[q - 1].p[1]);
    keep.push(samples[q]);
    if (length > maxPx) break;
  }
  if (length <= maxPx && samples.length > 0) keep.push(samples[0]);
  return keep.reverse();
}

/**
 * Fire trail of `hand`'s blade on whole tick `tick`: its recent sub-sampled
 * positions (oldest first) and the max width. Replayed from tick 0, so the
 * view keeps no state. Empty for a blade without a trail.
 */
export function strikeTrailAt(def: StrikeDef, tick: number, anchors: StrikePoseAnchors, hand: Hand = def.hand): StrikeTrail {
  const blade = def.blades[hand];
  const n = def.trailSamplesPerTick;
  let samples: { p: Vec2; s: number }[] = [];
  const maxPx = blade?.trail?.maxLengthPx ?? TRAIL_MAX_LENGTH_PX;
  for (let t = 0; blade?.trail && t <= tick; t += 1) {
    // A lagging blade's trail grows on its own clock.
    const { phase, u } = strikePhaseAt(def, bladeTime(def, hand, t));
    const growth = blade.trailGrowth?.[phase.id];
    if (growth) {
      for (let k = 1; t > 0 && k <= n; k += 1) {
        const at = thrownBladeAt(def, t - 1 + k / n, anchors, hand);
        const before = samples[samples.length - 1];
        // Passing a break point starts a fresh trail.
        if (before && blade.trailBreakAt?.some((b) => before.s < b && at.s >= b)) samples = [];
        if (blade.trailFromS === undefined || at.s >= blade.trailFromS) samples.push({ p: at.pos, s: at.s });
      }
      const { tailPx, tailFromU } = growth;
      if (tailPx !== undefined && u > (tailFromU ?? 0)) {
        // Square 1's approved tail keeps one sample past `tailPx`.
        const keep: { p: Vec2; s: number }[] = [];
        let length = 0;
        for (let q = samples.length - 1; q > 0; q -= 1) {
          length += Math.hypot(samples[q].p[0] - samples[q - 1].p[0], samples[q].p[1] - samples[q - 1].p[1]);
          keep.push(samples[q]);
          if (length > tailPx) break;
        }
        samples = keep.reverse();
      }
      samples = keepLast(samples, maxPx);
    } else {
      samples = samples.slice(n);
      const head = samples[samples.length - 1];
      if (head && blade.trail.kind === 'profile' && blade.trail.cutWhenDetached) {
        const at = bladeAt(def, hand, t, anchors).pos;
        if (Math.hypot(at[0] - head.p[0], at[1] - head.p[1]) > 2) samples = [];
      }
    }
  }
  const growth = blade?.trailGrowth?.[strikePhaseAt(def, bladeTime(def, hand, tick)).phase.id];
  return {
    points: samples.map((q) => q.p),
    s: samples.map((q) => q.s),
    pivot: blade ? shoulderAt(def, tick, hand) : [0, 0],
    widthPx: growth?.widthPx ?? def.trailFadeWidthPx,
  };
}

export function phaseStart(def: StrikeDef, id: string): { start: number; ticks: number } {
  let start = 0;
  for (const phase of def.phases) {
    if (phase.id === id) return { start, ticks: phase.ticks };
    start += phase.ticks;
  }
  throw new Error(`strike ${def.id}: unknown phase ${id}`);
}

/** The hit windows of `hand`'s blade (none when it does not hit). */
function hitWindows(def: StrikeDef, hand: Hand): readonly HitWindow[] {
  const active = def.blades[hand]?.active;
  if (!active) return [];
  return 'fromS' in active ? [active as HitWindow] : (active as readonly HitWindow[]);
}

/**
 * Hit window `hand`'s blade is in on whole tick `tick` (its index in the
 * blade's windows), or -1: the blade must be on its track between the
 * window's `fromS` and `toS`.
 */
export function strikeHitWindowAt(def: StrikeDef, tick: number, hand: Hand = def.hand): number {
  const b = trackBladeAt(def, tick, hand);
  if (!b) return -1;
  return hitWindows(def, hand).findIndex((w) => b.s >= w.fromS && b.s <= (w.toS ?? 1));
}

/**
 * Swept segment of `hand`'s blade on whole tick `tick` (from the previous
 * tick's position), or `null` outside its hit windows.
 */
export function strikeHitSegment(def: StrikeDef, tick: number, hand: Hand = def.hand): readonly [Vec2, Vec2] | null {
  if (strikeHitWindowAt(def, tick, hand) < 0) {
    return null;
  }
  const b = trackBladeAt(def, tick, hand)!;
  const a = trackBladeAt(def, tick - 1, hand) ?? b;
  return [a.pos, b.pos];
}

/** Swept segments of every blade that can hit on whole tick `tick`, with their window index. */
export function strikeHitSegments(def: StrikeDef, tick: number): (readonly [Vec2, Vec2])[] {
  return strikeHitSegmentsWithWindow(def, tick).map((h) => h.segment);
}

function strikeHitSegmentsWithWindow(def: StrikeDef, tick: number): { segment: readonly [Vec2, Vec2]; window: number }[] {
  const out: { segment: readonly [Vec2, Vec2]; window: number }[] = [];
  for (const hand of ['near', 'far'] as const) {
    const segment = strikeHitSegment(def, tick, hand);
    if (segment) out.push({ segment, window: strikeHitWindowAt(def, tick, hand) });
  }
  return out;
}

/** First and last whole ticks on which any blade can hit. */
export function strikeActiveTicks(def: StrikeDef): { first: number; last: number } {
  let first = -1;
  let last = -1;
  for (let tick = 0; tick < strikeLength(def); tick += 1) {
    if (strikeHitSegments(def, tick).length > 0) {
      if (first < 0) first = tick;
      last = tick;
    }
  }
  if (first < 0) throw new Error(`strike ${def.id}: empty hit window`);
  return { first, last };
}

/** Squared distance from a point to an axis-aligned box. */
function distSqToBox(x: number, y: number, minX: number, maxX: number, minY: number, maxY: number): number {
  const dx = x < minX ? minX - x : x > maxX ? x - maxX : 0;
  const dy = y < minY ? minY - y : y > maxY ? y - maxY : 0;
  return dx * dx + dy * dy;
}

/** Whether the thick segment `a`-`b` (world px) touches the target's hurt box. */
function segmentTouches(a: Vec2, b: Vec2, radius: number, target: EntityState): boolean {
  const { halfWidth, halfHeight } = CONFIG.combat.target;
  const minX = target.x - halfWidth;
  const maxX = target.x + halfWidth;
  const minY = target.y - halfHeight * 2;
  const maxY = target.y;
  const steps = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1])));
  const radiusSq = radius * radius;
  for (let i = 0; i <= steps; i += 1) {
    const f = i / steps;
    if (distSqToBox(a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, minX, maxX, minY, maxY) <= radiusSq) {
      return true;
    }
  }
  return false;
}

export function startStrike(player: EntityState, id: StrikeId): StrikeState {
  player.vx = 0;
  return { id, tick: 0, originX: player.x, facing: player.facing, hits: [], queued: false };
}

/** Horizontal direction held on the stick or keys: -1 left, 1 right, 0 none or both. */
export type HeldDirection = -1 | 0 | 1;

/** First tick of the chain window and of the press buffer, or `null` when the strike does not chain. */
export function strikeChainTicks(def: StrikeDef): { opens: number; buffersFrom: number; closes?: number } | null {
  if (!def.chain) return null;
  const res: { opens: number; buffersFrom: number; closes?: number } = {
    opens: phaseStart(def, def.chain.from).start + def.chain.fromTick,
    // A press is remembered from the strike's first tick (a phone finger is early or late).
    buffersFrom: 0,
  };
  if (def.chain.until) {
    res.closes = phaseStart(def, def.chain.until).start;
  }
  return res;
}

/**
 * The attack was pressed (edge) during `state`: queues the next strike if
 * the press falls in the buffer or chain window, remembering a direction
 * held with the press (`direction`) so the next strike can turn around even
 * if it is released before the window opens. Returns whether it queued.
 */
export function queueChain(state: StrikeState, direction: HeldDirection = 0, button: 'light' | 'heavy' = 'light'): boolean {
  const def = STRIKES[state.id];
  const ticks = strikeChainTicks(def);
  const accepts = button === 'heavy' ? Boolean(def.chain?.heavy) : Boolean(def.chain?.into);
  if (ticks && state.tick >= ticks.buffersFrom && (ticks.closes === undefined || state.tick < ticks.closes) && accepts) {
    state.queued = true;
    // The last button pressed decides the next strike.
    if (button === 'heavy') state.queuedHeavy = true;
    else delete state.queuedHeavy;
    if (direction !== 0) state.queuedDirection = direction;
  }
  return state.queued;
}

/**
 * Starts the queued next strike if its window is open on the strike's
 * current tick: from the body's current place, remembering where the
 * previous strike left its blades. The combo can turn around at each link:
 * the direction held now (`direction`), else the one held with the press,
 * sets the next strike's facing. Returns `null` otherwise.
 */
export function chainStrike(state: StrikeState, player: EntityState, direction: HeldDirection = 0): StrikeState | null {
  const def = STRIKES[state.id];
  const ticks = strikeChainTicks(def);
  if (!def.chain || !ticks || !state.queued || state.tick < ticks.opens || (ticks.closes !== undefined && state.tick >= ticks.closes)) {
    return null;
  }
  const target = state.queuedHeavy && def.chain.heavy ? def.chain.heavy : def.chain.into;
  if (!target) return null;
  if (STRIKES[target].air && player.grounded) {
    return null;
  }
  if (!STRIKES[target].air && !player.grounded) {
    return null;
  }
  const wanted = direction !== 0 ? direction : state.queuedDirection ?? 0;
  const facing: -1 | 1 = wanted === 0 ? state.facing : wanted;
  player.vx = 0;
  player.facing = facing;
  if (facing !== state.facing) {
    // Mirroring the sprite flips the body around the feet: move the feet so
    // the body's centre stays where it was.
    const before = strikePhaseAt(def, state.tick).phase.centerX;
    const after = STRIKES[def.chain.into ?? def.chain.heavy ?? state.id].phases[0].centerX;
    player.x += state.facing * (before + after);
  }
  const entry: StrikeEntry = {
    id: state.id,
    // The blades keep moving through the tick the next strike starts on.
    tick: Math.min(state.tick + 1, strikeLength(def) - 1),
    offsetPx: strikeAdvanceAt(def, state.tick),
    turned: facing !== state.facing,
    ...(state.entry ? { entry: state.entry } : {}),
  };
  return { ...startStrike(player, target), facing, entry };
}

export interface StrikeStepResult {
  done: boolean;
  /** Targets hit on this tick, with the blade's world position. */
  hits: { target: EntityState; x: number; y: number }[];
  /** The ground impact happened on this tick, at this world point. */
  impact?: StrikeImpactNotice;
  /** Fires the strike left burning on the ground on this tick (the world keeps them). */
  fires?: GroundFireState[];
}

/**
 * Burns the ground fires one tick (the world adds a new fire after this,
 * so it hits from the tick after it appears): each hits the targets
 * standing in it once (lifting them when `lift`), then ages; returns the
 * ones still burning and the targets hit.
 */
export function stepGroundFires(
  fires: readonly GroundFireState[],
  targets: readonly EntityState[],
  lift: boolean,
): { fires: GroundFireState[]; hits: EntityState[] } {
  const { halfWidth, halfHeight } = CONFIG.combat.target;
  const hits: EntityState[] = [];
  const burning: GroundFireState[] = [];
  for (const fire of fires) {
    for (const target of targets) {
      if (target.isDead || target.aiState === 'death' || target.aiState === 'hydra_defeat' || fire.hits.includes(target.id)) {
        continue;
      }
      const standing = target.x + halfWidth >= fire.x0 && target.x - halfWidth <= fire.x1
        && target.y >= fire.y - fire.heightPx - 2 && target.y - halfHeight * 2 <= fire.y;
      if (!standing) continue;
      fire.hits.push(target.id);
      hits.push(target);
      const killed = damageEnemy(target, fire.damage, fire.hitstunTicks);
      if (!killed && lift && (target.kind === 'legionnaire' || target.kind === 'archer')) {
        target.vy = fire.liftVy;
        target.grounded = false;
        target.aiState = 'juggle';
        target.aiTicks = 0;
      }
    }
    fire.age += 1;
    if (fire.age < fire.ticks) burning.push(fire);
  }
  return { fires: burning, hits };
}

/** What the view needs when a phase with one-shot effects starts (world px). */
export interface StrikeImpactNotice {
  x: number;
  y: number;
  /** Dust at these world x on the ground. */
  dust: number[];
  shake?: { px: number; ticks: number };
}

/** Tick of the strike's ground impact, or -1 when it has none. */
export function strikeImpactTick(def: StrikeDef): number {
  return def.impact ? phaseStart(def, def.impact.phase).start : -1;
}

/** Whether the target's hurt box overlaps the ground-impact box (world x range, ground y). */
function impactTouches(minX: number, maxX: number, groundY: number, impact: StrikeImpact, target: EntityState): boolean {
  const { halfWidth, halfHeight } = CONFIG.combat.target;
  return target.x + halfWidth >= minX && target.x - halfWidth <= maxX
    && target.y - halfHeight * 2 <= groundY && target.y >= groundY - impact.heightPx;
}

/** Whether the strike can be cut short by guarding or jumping on its tick `tick`. */
export function strikeCancellable(def: StrikeDef, tick: number): boolean {
  return def.cancel !== undefined && tick >= phaseStart(def, def.cancel.from).start + def.cancel.fromTick;
}

/**
 * Turns the strike into its branch if `ifHeld` has been held since it
 * started (`heldTicks` in a row, counting this tick) when the branch phase
 * ends; from the body's current place and facing, remembering its blades.
 * Returns `null` otherwise (a tap, or no branch target yet).
 */
export function branchStrike(state: StrikeState, player: EntityState, heldTicks: number): StrikeState | null {
  const def = STRIKES[state.id];
  if (!def.branch?.into || state.tick !== strikeBranchTick(def) || heldTicks <= state.tick + 1) {
    return null;
  }
  const entry: StrikeEntry = {
    id: state.id,
    tick: Math.min(state.tick + 1, strikeLength(def) - 1),
    offsetPx: strikeAdvanceAt(def, state.tick),
    turned: false,
    ...(state.entry ? { entry: state.entry } : {}),
  };
  return { ...startStrike(player, def.branch.into), facing: state.facing, entry };
}

/** Last tick of the branch phase, or -1 when the strike does not branch. */
export function strikeBranchTick(def: StrikeDef): number {
  if (!def.branch) return -1;
  const end = phaseStart(def, def.branch.atEndOf);
  return end.start + end.ticks - 1;
}

/**
 * Advances a strike one tick: steps the body forward (clamped to
 * `minX`..`maxX`) and hits every target the blade's swept segment touches,
 * once per strike. Damage goes through `damageEnemy`, like the magic.
 */
export function stepStrike(
  state: StrikeState,
  player: EntityState,
  targets: readonly EntityState[],
  minX: number,
  maxX: number,
): StrikeStepResult {
  const def = STRIKES[state.id];
  const result: StrikeStepResult = { done: false, hits: [] };
  // A phase that ends on landing skips its remaining ticks once Kratos is
  // on the ground (after its minimum).
  const current = strikePhaseAt(def, state.tick);
  if (current.phase.until && player.grounded && state.tick - current.start + 1 >= current.phase.until.minTicks) {
    state.tick = current.start + current.phase.ticks - 1;
  }
  state.tick += 1;
  if (state.tick >= strikeLength(def)) {
    result.done = true;
    return result;
  }
  // A phase that leaps leaves the ground on its first tick.
  const starting = strikePhaseAt(def, state.tick);
  if (starting.start === state.tick && starting.phase.leapVy !== undefined) {
    player.vy = starting.phase.leapVy;
    player.grounded = false;
  }
  player.vx = 0;
  player.facing = state.facing;
  const step = strikeAdvanceAt(def, state.tick) - strikeAdvanceAt(def, state.tick - 1);
  player.x = Math.max(minX, Math.min(maxX, player.x + state.facing * step));
  state.originX = player.x - state.facing * strikeAdvanceAt(def, state.tick);

  const toWorld = (p: Vec2): Vec2 => [state.originX + state.facing * p[0], player.y + p[1]];
  const segments = strikeHitSegmentsWithWindow(def, state.tick).map(({ segment: [a, b], window }) => ({
    a: toWorld(a),
    b: toWorld(b),
    window,
  }));
  for (const target of targets) {
    if (target.isDead || target.aiState === 'death' || target.aiState === 'hydra_defeat') {
      continue;
    }
    if (def.grabsAirborne && target.aiState !== 'juggle') {
      continue;
    }
    // One hit per target per hit window, whichever blade touches it (the
    // first window's key is the bare id).
    const key = (window: number): string => (window === 0 ? target.id : `${target.id}@${window}`);
    const touching = segments.find(({ a, b, window }) => !state.hits.includes(key(window)) && segmentTouches(a, b, def.hitRadiusPx, target));
    if (!touching) {
      continue;
    }
    const b = touching.b;
    state.hits.push(key(touching.window));
    const killed = damageEnemy(target, def.damage, def.hitstunTicks);
    if (!killed && def.launch && (target.kind === 'legionnaire' || target.kind === 'archer')) {
      // A launch lifts the foot soldier into the air (juggle) instead of stunning it.
      target.vy = def.launch.vy;
      target.vx = (def.launch.vx ?? 0) * state.facing;
      target.grounded = false;
      target.aiState = 'juggle';
      target.aiTicks = 0;
    } else if (!killed && (target.kind === 'legionnaire' || target.kind === 'archer')) {
      // A blade hit staggers foot soldiers (the magic only stuns them).
      target.aiState = 'hitstun';
      target.aiTicks = 0;
    }
    result.hits.push({ target, x: b[0], y: b[1] });
  }
  // One-shot effects of a phase starting on this tick (flash, dust, shake).
  const { phase, start } = strikePhaseAt(def, state.tick);
  if (start === state.tick && phase.effects?.some((e) => e.kind !== 'fireball' && e.kind !== 'groundFire')) {
    const toX = (x: number): number => state.originX + state.facing * x;
    const flash = phase.effects.find((e) => e.kind === 'flash');
    const shake = phase.effects.find((e) => e.kind === 'shake');
    result.impact = {
      x: toX(flash?.kind === 'flash' ? flash.x : 0),
      y: player.y,
      dust: phase.effects.flatMap((e) => (e.kind === 'dust' ? e.at.map(toX) : [])),
      ...(shake?.kind === 'shake' ? { shake: { px: shake.px, ticks: shake.ticks } } : {}),
    };
  }
  // Lingering ground fires of a phase starting on this tick become world entities.
  if (start === state.tick) {
    for (const effect of phase.effects ?? []) {
      if (effect.kind !== 'groundFire' || !effect.linger) continue;
      const a = state.originX + state.facing * effect.from;
      const b = state.originX + state.facing * effect.to;
      (result.fires ??= []).push({
        x0: Math.min(a, b),
        x1: Math.max(a, b),
        y: player.y,
        heightPx: effect.heightPx,
        ticks: effect.ticks,
        age: 0,
        damage: effect.linger.damage,
        hitstunTicks: effect.linger.hitstunTicks,
        liftVy: effect.linger.liftVy,
        hits: [],
      });
    }
  }
  // The ground impact fires when its phase starts, which a phase that ends on landing moves.
  const impactNow = strikePhaseAt(def, state.tick);
  if (def.impact && impactNow.phase.id === def.impact.phase && impactNow.start === state.tick) {
    const a = state.originX + state.facing * def.impact.from;
    const b = state.originX + state.facing * def.impact.to;
    for (const target of targets) {
      const key = `${target.id}@impact`;
      if (target.isDead || target.aiState === 'death' || target.aiState === 'hydra_defeat' || state.hits.includes(key)) {
        continue;
      }
      if (!impactTouches(Math.min(a, b), Math.max(a, b), player.y, def.impact, target)) {
        continue;
      }
      state.hits.push(key);
      const killed = damageEnemy(target, def.damage, def.hitstunTicks);
      if (!killed && (target.kind === 'legionnaire' || target.kind === 'archer')) {
        target.aiState = 'hitstun';
        target.aiTicks = 0;
      }
      result.hits.push({ target, x: target.x, y: player.y - 4 });
    }
  }
  return result;
}
