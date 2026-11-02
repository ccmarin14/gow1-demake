import { CONFIG } from '../config';
import { damageEnemy } from './damage';
import type { EntityState, StrikeSnapshot } from './types';

/**
 * Kratos' strikes as data (D-37). Each strike is a table of phases (body
 * pose, ticks, forward step) plus a blade track: a Catmull-Rom curve the near
 * blade runs at 60 Hz. The body changes pose in steps; the blade moves
 * continuously. The hit box is the blade's swept segment, so what hits is
 * what is drawn. Adding a strike (square 2..5, triangle) means adding a table.
 * A strike throws the blade of one hand (`hand`) and holds the other; a
 * strike can chain into the next one (`chain`).
 *
 * Coordinates are pixels relative to Kratos' feet when the strike started,
 * facing +x, y down. Phase time `u` runs 0 -> 1 inside each phase.
 */
export type Vec2 = readonly [number, number];

export type StrikeId = 'square1' | 'square2';

/** Kratos' hands as the side view shows them: near the camera or behind the body. */
export type Hand = 'near' | 'far';

/** Whether a blade, its chain or its trail is drawn in front of the body (and enemies) or behind it. */
export type Depth = 'front' | 'behind';

/**
 * How the fire trail is drawn.
 * - `crescent`: square 1 as approved: each phase's `trail.widthPx`, the
 *   whole crescent behind the body.
 * - `profile`: width along the track (`widths`, pairs of track parameter s
 *   and px, linear between them), both ends tapered (`taperOld` and
 *   `taperHead`, fractions of the trail's length), nothing drawn until it is
 *   `minLengthPx` long, depth per sample from `trackDepth`. Optionally a
 *   filled fan between `fan.fromS` and `fan.toS`: the band reaches from the
 *   blade toward the shoulder down to `innerRatio` of its distance (the
 *   sector the chain sweeps).
 */
export type TrailShape =
  | { kind: 'crescent' }
  | {
    kind: 'profile';
    widths: readonly (readonly [number, number])[];
    taperOld: number;
    taperHead: number;
    minLengthPx: number;
    fan?: { fromS: number; toS: number; innerRatio: number };
  };

/** How the thrown blade moves during a phase. */
export type BladeMotion =
  /**
   * To the start of the track (quadratic, ease in), from the upper back (the
   * blade is drawn) or from under the throwing hand (it already holds it).
   */
  | { kind: 'draw'; from: 'back' | 'hand'; behindBody: true }
  /** Along the track from `from` to `to` (0..1 of its length). */
  | { kind: 'track'; from: number; to: number; ease: 'linear' | 'out' }
  /** Held at the end of the track, drifting `driftPx` and back. */
  | { kind: 'hold'; driftPx: number }
  /** Back to the throwing hand, accelerating, the chain sagging up to `sagPx`. */
  | { kind: 'recall'; sagPx: number };

export interface StrikePhase {
  id: string;
  ticks: number;
  /** Forward step of the body over the phase (px, spread evenly over its ticks). */
  advancePx: number;
  /** Body frame of the phase (`grids/kratos/<pose>.txt`). */
  pose: string;
  blade: BladeMotion;
  /**
   * The fire trail grows during this phase: max width (`crescent` trails),
   * and optionally only its last `tailPx` once the phase passes `tailFromU`.
   */
  trail?: { widthPx: number; tailPx?: number; tailFromU?: number };
}

/**
 * The blade the strike does not throw: drawn from the back into its hand on
 * the first phase, or carried over from the strike this one chained from
 * (it is yanked back to its hand over `ticks`, on its chain, sagging up to
 * `sagPx`).
 * Either way it then hangs from that hand.
 */
export type HeldBlade = { from: 'back' } | { from: 'previous'; ticks: number; sagPx: number };

/**
 * Pressing the attack again during a strike starts `into` from its current
 * pose once the strike reaches tick `fromTick` of phase `from`, until its last
 * tick. A press made earlier, from the start of the hit window, is buffered
 * until then.
 */
export interface StrikeChain {
  into: StrikeId;
  from: string;
  fromTick: number;
}

export interface StrikeDef {
  id: StrikeId;
  phases: readonly StrikePhase[];
  /** Hand that throws the blade along the track; the other hand holds its blade. */
  hand: Hand;
  heldBlade: HeldBlade;
  /**
   * Shoulder of the throwing hand in the throw pose, relative to the feet:
   * the origin of the track (anchor `shoulder` or `farShoulder`).
   */
  shoulder: Vec2;
  /** Catmull-Rom control points relative to `shoulder`; the blade runs points 1..n-2. */
  track: readonly Vec2[];
  /**
   * Depth of the thrown blade, its chain and its trail at each control point
   * of `track` (the nearest one counts); all in front when absent.
   */
  trackDepth?: readonly Depth[];
  /** The chain shows once the blade passes this fraction of the track. */
  chainFrom: number;
  /**
   * Hit window on the curve, not on ticks: while the blade is on the track
   * (thrown or held at its end) at track parameter `fromS` or further, so a
   * retimed strike still hits where the blade is drawn.
   */
  active: { fromS: number };
  /** Half thickness of the blade's swept segment (px). */
  hitRadiusPx: number;
  damage: number;
  hitstunTicks: number;
  /** Ticks the whole world freezes when the strike connects. */
  hitstopTicks: number;
  trail: TrailShape;
  /** Trail sub-samples per tick and the width it fades with after the sweep. */
  trailSamplesPerTick: number;
  trailFadeWidthPx: number;
  /** The next strike of the combo, if any. */
  chain?: StrikeChain;
}

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
    { id: 'draw', ticks: 5, advancePx: 0, pose: 'sq1-a', blade: { kind: 'draw', from: 'back', behindBody: true } },
    {
      id: 'sweep', ticks: 4, advancePx: 4, pose: 'sq1-b',
      blade: { kind: 'track', from: 0, to: 0.5, ease: 'linear' },
      trail: { widthPx: 6 },
    },
    {
      id: 'throw', ticks: 5, advancePx: 3, pose: 'sq1-c',
      blade: { kind: 'track', from: 0.5, to: 1, ease: 'out' },
      trail: { widthPx: 4, tailPx: 20, tailFromU: 0.3 },
    },
    { id: 'hold', ticks: 12, advancePx: 0, pose: 'sq1-d', blade: { kind: 'hold', driftPx: 2 } },
    { id: 'recall', ticks: 8, advancePx: 0, pose: 'sq1-e', blade: { kind: 'recall', sagPx: 5 } },
  ],
  shoulder: [-2.3, -25.6],
  track: [[-24, -4], [-22, 4], [-8, 15], [14, 9], [42, 7], [80, 12], [84, 12]],
  chainFrom: 0.45,
  // From the last sweep tick (s 0.375) to the end of the hold.
  active: { fromS: 0.3 },
  hitRadiusPx: 3.5,
  damage: 10,
  hitstunTicks: 14,
  hitstopTicks: 4,
  trail: { kind: 'crescent' },
  trailSamplesPerTick: 6,
  trailFadeWidthPx: 4,
  chain: { into: 'square2', from: 'hold', fromTick: 4 },
};

/**
 * Square 2 (draft v2, after the critic; pending user approval): chained from
 * square 1's hold or recall. The far arm, cocked low behind, swings its blade
 * up and forward to a wide fire fan in front of and above Kratos, then cuts a
 * long steep diagonal down through waist height, while he twists into it
 * (showing his back) and drops into a lunge. The near blade is yanked back
 * from square 1's throw into the near hand.
 */
const SQUARE2: StrikeDef = {
  id: 'square2',
  hand: 'far',
  heldBlade: { from: 'previous', ticks: 9, sagPx: 5 },
  phases: [
    { id: 'load', ticks: 3, advancePx: 0, pose: 'sq2-a', blade: { kind: 'draw', from: 'hand', behindBody: true } },
    {
      id: 'sweep', ticks: 3, advancePx: 2, pose: 'sq2-b',
      blade: { kind: 'track', from: 0, to: 0.55, ease: 'linear' },
      trail: { widthPx: 6 },
    },
    {
      id: 'throw', ticks: 4, advancePx: 3, pose: 'sq2-c',
      blade: { kind: 'track', from: 0.55, to: 1, ease: 'out' },
      trail: { widthPx: 4, tailPx: 20, tailFromU: 0.3 },
    },
    { id: 'hold', ticks: 7, advancePx: 0, pose: 'sq2-d', blade: { kind: 'hold', driftPx: 2 } },
    { id: 'recall', ticks: 6, advancePx: 0, pose: 'sq2-e', blade: { kind: 'recall', sagPx: 5 } },
  ],
  shoulder: [1, -22],
  // From low behind, up and forward to a peak above and ahead of the head
  // (x +15..20), then a long steep diagonal down through waist height.
  track: [[-24, 4], [-14, -20], [0, -34], [20, -36], [40, -15], [57, 2], [66, 14], [64, 18]],
  // Behind the body while it rises behind and over the head, then in front.
  trackDepth: ['behind', 'behind', 'behind', 'front', 'front', 'front', 'front', 'front'],
  chainFrom: 0.1,
  // From the start of the descent (first throw tick) to the end of the hold.
  active: { fromS: 0.6 },
  hitRadiusPx: 3.5,
  damage: 10,
  hitstunTicks: 14,
  hitstopTicks: 4,
  trail: {
    kind: 'profile',
    // As restrained as square 1's crescent (user: the fan read too big).
    widths: [[0, 2], [0.3, 6], [0.55, 6], [0.7, 4], [1, 4]],
    taperOld: 0.25,
    taperHead: 0.1,
    minLengthPx: 12,
  },
  trailSamplesPerTick: 6,
  trailFadeWidthPx: 4,
};

export const STRIKES: Readonly<Record<StrikeId, StrikeDef>> = { square1: SQUARE1, square2: SQUARE2 };

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

/** Point at `s` (0..1) of the track, relative to the shoulder. */
function trackPoint(def: StrikeDef, s: number): Vec2 {
  const segments = def.track.length - 3;
  const seg = Math.min(Math.floor(s * segments), segments - 1);
  const u = s * segments - seg;
  return catmull(def.track[seg], def.track[seg + 1], def.track[seg + 2], def.track[seg + 3], u);
}

/** Depth of the track at `s` (its nearest control point). */
export function trackDepthAt(def: StrikeDef, s: number): Depth {
  if (!def.trackDepth) return 'front';
  const segments = def.track.length - 3;
  return def.trackDepth[Math.round(Math.max(0, Math.min(1, s)) * segments) + 1] ?? 'front';
}

/** Shoulder of the throwing hand at strike time `t` (the track's origin), moved with the body's step. */
export function shoulderAt(def: StrikeDef, t: number): Vec2 {
  return [def.shoulder[0] + strikeAdvanceAt(def, t), def.shoulder[1]];
}

function onTrack(def: StrikeDef, t: number, s: number): Vec2 {
  const sh = shoulderAt(def, t);
  const p = trackPoint(def, s);
  return [sh[0] + p[0], sh[1] + p[1]];
}

/**
 * Near blade while it runs the track or holds at its end (no anchors needed),
 * `null` while it is drawn or recalled.
 */
export function trackBladeAt(def: StrikeDef, t: number): { pos: Vec2; s: number } | null {
  const { phase, u } = strikePhaseAt(def, t);
  const blade = phase.blade;
  if (blade.kind === 'track') {
    const eased = blade.ease === 'out' ? 1 - (1 - u) * (1 - u) : u;
    const s = blade.from + (blade.to - blade.from) * eased;
    return { pos: onTrack(def, t, s), s };
  }
  if (blade.kind === 'hold') {
    const drift = blade.driftPx * Math.sin(u * Math.PI);
    const tip = onTrack(def, t, 1);
    return { pos: [tip[0] + drift * 0.3, tip[1] + drift], s: 1 };
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
  /** Track parameter of the thrown blade (0 while drawn, 1 held or recalled); 0 for the held blade. */
  s: number;
}

/** The thrown blade at strike time `t`: drawn, run along the track, held, recalled. */
export function thrownBladeAt(def: StrikeDef, t: number, anchors: StrikePoseAnchors): BladeState {
  const { phase, u } = strikePhaseAt(def, t);
  const blade = phase.blade;
  if (blade.kind === 'draw') {
    const end = onTrack(def, t, 0);
    const e = u * u;
    let from: Vec2;
    let mid: Vec2;
    if (blade.from === 'back') {
      from = strikeAnchorAt(def, t, anchors, 'back');
      mid = [from[0] - 10, from[1] + 2];
    } else {
      const hand = strikeHandAt(def, t, anchors, def.hand);
      from = [hand[0], hand[1] + 5];
      mid = [(from[0] + end[0]) / 2, (from[1] + end[1]) / 2];
    }
    const k0 = (1 - e) * (1 - e);
    const k1 = 2 * (1 - e) * e;
    const k2 = e * e;
    return {
      pos: [k0 * from[0] + k1 * mid[0] + k2 * end[0], k0 * from[1] + k1 * mid[1] + k2 * end[1]],
      chainOut: false,
      sagPx: 0,
      deg: 150,
      behindBody: blade.behindBody,
      s: 0,
    };
  }
  if (blade.kind === 'recall') {
    const hand = strikeHandAt(def, t, anchors, def.hand);
    const tip = onTrack(def, t, 1);
    const e = u * u;
    const sagPx = blade.sagPx * Math.sin(Math.PI * u);
    return {
      pos: [tip[0] + (hand[0] - tip[0]) * e, tip[1] + (hand[1] - tip[1]) * e + sagPx],
      chainOut: true,
      sagPx,
      deg: 100,
      behindBody: false,
      s: 1,
    };
  }
  const onCurve = trackBladeAt(def, t);
  if (!onCurve) {
    throw new Error(`strike ${def.id}: no blade motion at ${t}`);
  }
  return {
    pos: onCurve.pos,
    chainOut: onCurve.s > def.chainFrom,
    sagPx: 0,
    deg: 100,
    behindBody: trackDepthAt(def, onCurve.s) === 'behind',
    s: onCurve.s,
  };
}

/**
 * The blade the strike does not throw: drawn from the back into its hand, or
 * returning from where the previous strike (`entry`) left it; then hanging
 * from its hand. Hanging from the far hand it is behind the body.
 */
export function heldBladeAt(def: StrikeDef, t: number, anchors: StrikePoseAnchors, entry?: StrikeEntry): BladeState {
  const hand: Hand = def.hand === 'near' ? 'far' : 'near';
  const { phase, u } = strikePhaseAt(def, t);
  const grip = strikeHandAt(def, t, anchors, hand);
  const hanging: Vec2 = [grip[0], grip[1] + 5];
  const behindBody = hand === 'far';
  const held = def.heldBlade;
  if (held.from === 'back' && phase.blade.kind === 'draw') {
    const back = strikeAnchorAt(def, t, anchors, 'back');
    const e = u * u;
    return {
      pos: [back[0] + (hanging[0] - back[0]) * e, back[1] + (hanging[1] - back[1]) * e],
      chainOut: false, sagPx: 0, deg: 60, behindBody: true, s: 0,
    };
  }
  if (held.from === 'previous' && entry && t < held.ticks) {
    const previous = bladeAt(STRIKES[entry.id], hand, entry.tick, anchors, entry.entry).pos;
    const start: Vec2 = [previous[0] - entry.offsetPx, previous[1]];
    // Yanked back at once, settling into the hand (ease out).
    const v = Math.max(0, t) / held.ticks;
    const e = 1 - (1 - v) * (1 - v);
    const sagPx = held.sagPx * Math.sin(Math.PI * v);
    const pos: Vec2 = [start[0] + (hanging[0] - start[0]) * e, start[1] + (hanging[1] - start[1]) * e + sagPx];
    if (Math.hypot(start[0] - grip[0], start[1] - grip[1]) > 8) {
      return { pos, chainOut: true, sagPx, deg: 90, behindBody: false, s: 0 };
    }
    return { pos, chainOut: false, sagPx: 0, deg: 90, behindBody, s: 0 };
  }
  return { pos: hanging, chainOut: false, sagPx: 0, deg: 90, behindBody, s: 0 };
}

/** The blade of `hand` at strike time `t` (thrown or held). */
export function bladeAt(def: StrikeDef, hand: Hand, t: number, anchors: StrikePoseAnchors, entry?: StrikeEntry): BladeState {
  return hand === def.hand ? thrownBladeAt(def, t, anchors) : heldBladeAt(def, t, anchors, entry);
}

/** Near blade at strike time `t`. */
export function nearBladeAt(def: StrikeDef, t: number, anchors: StrikePoseAnchors, entry?: StrikeEntry): BladeState {
  return bladeAt(def, 'near', t, anchors, entry);
}

/** Far blade at strike time `t`. */
export function farBladeAt(def: StrikeDef, t: number, anchors: StrikePoseAnchors, entry?: StrikeEntry): BladeState {
  return bladeAt(def, 'far', t, anchors, entry);
}

/** Sag of the thrown blade's chain at strike time `t` (px, at its middle). */
export function chainSagAt(def: StrikeDef, t: number): number {
  const { phase, u } = strikePhaseAt(def, t);
  return phase.blade.kind === 'recall' ? phase.blade.sagPx * Math.sin(Math.PI * u) : 0;
}

/** A fire trail: the blade's recent positions (oldest first) with their track parameter, and its max width. */
export interface StrikeTrail {
  points: Vec2[];
  s: number[];
  /** Shoulder of the throwing hand on this tick (the fan's pivot). */
  pivot: Vec2;
  widthPx: number;
}

/**
 * Fire trail on whole tick `tick`: the blade's recent sub-sampled positions
 * (oldest first) and the crescent's max width. Replayed from tick 0, so the
 * view keeps no state.
 */
export function strikeTrailAt(def: StrikeDef, tick: number, anchors: StrikePoseAnchors): StrikeTrail {
  const n = def.trailSamplesPerTick;
  let samples: { p: Vec2; s: number }[] = [];
  for (let t = 0; t <= tick; t += 1) {
    const { phase, u } = strikePhaseAt(def, t);
    if (phase.trail) {
      for (let k = 1; t > 0 && k <= n; k += 1) {
        const blade = thrownBladeAt(def, t - 1 + k / n, anchors);
        samples.push({ p: blade.pos, s: blade.s });
      }
      const { tailPx, tailFromU } = phase.trail;
      if (tailPx !== undefined && u > (tailFromU ?? 0)) {
        const keep: { p: Vec2; s: number }[] = [];
        let length = 0;
        for (let q = samples.length - 1; q > 0; q -= 1) {
          length += Math.hypot(samples[q].p[0] - samples[q - 1].p[0], samples[q].p[1] - samples[q - 1].p[1]);
          keep.push(samples[q]);
          if (length > tailPx) break;
        }
        samples = keep.reverse();
      }
    } else {
      samples = samples.slice(n);
    }
  }
  const current = strikePhaseAt(def, tick).phase;
  return {
    points: samples.map((q) => q.p),
    s: samples.map((q) => q.s),
    pivot: shoulderAt(def, tick),
    widthPx: current.trail?.widthPx ?? def.trailFadeWidthPx,
  };
}

function phaseStart(def: StrikeDef, id: string): { start: number; ticks: number } {
  let start = 0;
  for (const phase of def.phases) {
    if (phase.id === id) return { start, ticks: phase.ticks };
    start += phase.ticks;
  }
  throw new Error(`strike ${def.id}: unknown phase ${id}`);
}

/**
 * Swept segment of the blade on whole tick `tick` (from the previous tick's
 * position), or `null` outside the hit window: the blade must be on the
 * track at `active.fromS` or further.
 */
export function strikeHitSegment(def: StrikeDef, tick: number): readonly [Vec2, Vec2] | null {
  const b = trackBladeAt(def, tick);
  if (!b || b.s < def.active.fromS) {
    return null;
  }
  const a = trackBladeAt(def, tick - 1) ?? b;
  return [a.pos, b.pos];
}

/** First and last whole ticks of the hit window. */
export function strikeActiveTicks(def: StrikeDef): { first: number; last: number } {
  let first = -1;
  let last = -1;
  for (let tick = 0; tick < strikeLength(def); tick += 1) {
    if (strikeHitSegment(def, tick)) {
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

/** First tick of the chain window and of the press buffer, or `null` when the strike does not chain. */
export function strikeChainTicks(def: StrikeDef): { opens: number; buffersFrom: number } | null {
  if (!def.chain) return null;
  return {
    opens: phaseStart(def, def.chain.from).start + def.chain.fromTick,
    buffersFrom: strikeActiveTicks(def).first,
  };
}

/**
 * The attack was pressed (edge) during `state`: queues the next strike if
 * the press falls in the buffer or chain window. Returns whether it queued.
 */
export function queueChain(state: StrikeState): boolean {
  const ticks = strikeChainTicks(STRIKES[state.id]);
  if (ticks && state.tick >= ticks.buffersFrom) {
    state.queued = true;
  }
  return state.queued;
}

/**
 * Starts the queued next strike if its window is open on the strike's
 * current tick: from the body's current place and facing, remembering where
 * the previous strike left its blades. Returns `null` otherwise.
 */
export function chainStrike(state: StrikeState, player: EntityState): StrikeState | null {
  const def = STRIKES[state.id];
  const ticks = strikeChainTicks(def);
  if (!def.chain || !ticks || !state.queued || state.tick < ticks.opens) {
    return null;
  }
  player.vx = 0;
  player.facing = state.facing;
  const entry: StrikeEntry = {
    id: state.id,
    // The blades keep moving through the tick the next strike starts on.
    tick: Math.min(state.tick + 1, strikeLength(def) - 1),
    offsetPx: strikeAdvanceAt(def, state.tick),
    ...(state.entry ? { entry: state.entry } : {}),
  };
  return { ...startStrike(player, def.chain.into), facing: state.facing, entry };
}

export interface StrikeStepResult {
  done: boolean;
  /** Targets hit on this tick, with the blade's world position. */
  hits: { target: EntityState; x: number; y: number }[];
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
  state.tick += 1;
  if (state.tick >= strikeLength(def)) {
    result.done = true;
    return result;
  }
  player.vx = 0;
  player.facing = state.facing;
  const step = strikeAdvanceAt(def, state.tick) - strikeAdvanceAt(def, state.tick - 1);
  player.x = Math.max(minX, Math.min(maxX, player.x + state.facing * step));
  state.originX = player.x - state.facing * strikeAdvanceAt(def, state.tick);

  const segment = strikeHitSegment(def, state.tick);
  if (!segment) {
    return result;
  }
  const toWorld = (p: Vec2): Vec2 => [state.originX + state.facing * p[0], player.y + p[1]];
  const a = toWorld(segment[0]);
  const b = toWorld(segment[1]);
  for (const target of targets) {
    if (target.isDead || target.aiState === 'death' || target.aiState === 'hydra_defeat' || state.hits.includes(target.id)) {
      continue;
    }
    if (!segmentTouches(a, b, def.hitRadiusPx, target)) {
      continue;
    }
    state.hits.push(target.id);
    const killed = damageEnemy(target, def.damage, def.hitstunTicks);
    // A blade hit staggers foot soldiers (the magic only stuns them).
    if (!killed && (target.kind === 'legionnaire' || target.kind === 'archer')) {
      target.aiState = 'hitstun';
      target.aiTicks = 0;
    }
    result.hits.push({ target, x: b[0], y: b[1] });
  }
  return result;
}
