import { CONFIG } from '../config';
import { damageEnemy } from './damage';
import type { EntityState, StrikeSnapshot } from './types';

/**
 * Kratos' strikes as data (D-37). Each strike is a table of phases (body
 * pose, ticks, forward step) plus a blade track: a Catmull-Rom curve the near
 * blade runs at 60 Hz. The body changes pose in steps; the blade moves
 * continuously. The hit box is the blade's swept segment, so what hits is
 * what is drawn. Adding a strike (square 2..5, triangle) means adding a table.
 *
 * Coordinates are pixels relative to Kratos' feet when the strike started,
 * facing +x, y down. Phase time `u` runs 0 -> 1 inside each phase.
 */
export type Vec2 = readonly [number, number];

export type StrikeId = 'square1';

/** How the near blade moves during a phase. */
export type BladeMotion =
  /** From the upper back to the start of the track (quadratic, ease in). */
  | { kind: 'draw'; behindBody: true }
  /** Along the track from `from` to `to` (0..1 of its length). */
  | { kind: 'track'; from: number; to: number; ease: 'linear' | 'out' }
  /** Held at the end of the track, drifting `driftPx` and back. */
  | { kind: 'hold'; driftPx: number }
  /** Back to the near hand, accelerating, the chain sagging up to `sagPx`. */
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
   * The fire trail grows during this phase: max width, and optionally only
   * its last `tailPx` once the phase passes `tailFromU`.
   */
  trail?: { widthPx: number; tailPx?: number; tailFromU?: number };
}

export interface StrikeDef {
  id: StrikeId;
  phases: readonly StrikePhase[];
  /**
   * Near shoulder (`upperarm_r`) of the throw pose relative to the feet: the
   * origin of the track (anchor `shoulder` of `kratos-sq1-c`).
   */
  shoulder: Vec2;
  /** Catmull-Rom control points relative to `shoulder`; the blade runs points 1..n-2. */
  track: readonly Vec2[];
  /** The chain shows once the blade passes this fraction of the track. */
  chainFrom: number;
  /** Hit window: from tick `fromTick` of phase `from` to the last tick of phase `to`. */
  active: { from: string; fromTick: number; to: string };
  /** Half thickness of the blade's swept segment (px). */
  hitRadiusPx: number;
  damage: number;
  hitstunTicks: number;
  /** Ticks the whole world freezes when the strike connects. */
  hitstopTicks: number;
  /** Trail sub-samples per tick and the width it fades with after the sweep. */
  trailSamplesPerTick: number;
  trailFadeWidthPx: number;
}

/**
 * Square 1 (user-approved preview `docs/tmp/golpes/sq1-v4.gif`): draw the
 * near blade from the back, sweep it low behind the hip, throw it far and
 * down-forward, hold the chain taut, recall it. The far blade stays in the
 * far hand.
 */
const SQUARE1: StrikeDef = {
  id: 'square1',
  phases: [
    { id: 'draw', ticks: 5, advancePx: 0, pose: 'sq1-a', blade: { kind: 'draw', behindBody: true } },
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
  active: { from: 'sweep', fromTick: 3, to: 'hold' },
  hitRadiusPx: 3.5,
  damage: 10,
  hitstunTicks: 14,
  hitstopTicks: 4,
  trailSamplesPerTick: 6,
  trailFadeWidthPx: 4,
};

export const STRIKES: Readonly<Record<StrikeId, StrikeDef>> = { square1: SQUARE1 };

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

function shoulderAt(def: StrikeDef, t: number): Vec2 {
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

/** Anchor of the pose shown at strike time `t`, moved with the body's step. */
export function strikeAnchorAt(def: StrikeDef, t: number, anchors: StrikePoseAnchors, name: 'back' | 'hand' | 'farHand'): Vec2 {
  const point = anchors(strikePoseAt(def, t))[name];
  return [point[0] + strikeAdvanceAt(def, t), point[1]];
}

/** Near blade at strike time `t`, and whether its chain is out of the hand. */
export function nearBladeAt(def: StrikeDef, t: number, anchors: StrikePoseAnchors): { pos: Vec2; chainOut: boolean } {
  const { phase, u } = strikePhaseAt(def, t);
  const blade = phase.blade;
  if (blade.kind === 'draw') {
    const back = strikeAnchorAt(def, t, anchors, 'back');
    const end = onTrack(def, t, 0);
    const e = u * u;
    const mid: Vec2 = [back[0] - 10, back[1] + 2];
    const k0 = (1 - e) * (1 - e);
    const k1 = 2 * (1 - e) * e;
    const k2 = e * e;
    return {
      pos: [k0 * back[0] + k1 * mid[0] + k2 * end[0], k0 * back[1] + k1 * mid[1] + k2 * end[1]],
      chainOut: false,
    };
  }
  if (blade.kind === 'recall') {
    const hand = strikeAnchorAt(def, t, anchors, 'hand');
    const tip = onTrack(def, t, 1);
    const e = u * u;
    return {
      pos: [tip[0] + (hand[0] - tip[0]) * e, tip[1] + (hand[1] - tip[1]) * e + blade.sagPx * Math.sin(Math.PI * u)],
      chainOut: true,
    };
  }
  const onCurve = trackBladeAt(def, t);
  if (!onCurve) {
    throw new Error(`strike ${def.id}: no blade motion at ${t}`);
  }
  return { pos: onCurve.pos, chainOut: onCurve.s > def.chainFrom };
}

/** Far blade: from the back to the far hand while drawing, then hanging from it. */
export function farBladeAt(def: StrikeDef, t: number, anchors: StrikePoseAnchors): { pos: Vec2; deg: number } {
  const { phase, u } = strikePhaseAt(def, t);
  const hand = strikeAnchorAt(def, t, anchors, 'farHand');
  const hanging: Vec2 = [hand[0], hand[1] + 5];
  if (phase.blade.kind === 'draw') {
    const back = strikeAnchorAt(def, t, anchors, 'back');
    const e = u * u;
    return { pos: [back[0] + (hanging[0] - back[0]) * e, back[1] + (hanging[1] - back[1]) * e], deg: 60 };
  }
  return { pos: hanging, deg: 90 };
}

/** Chain sag at strike time `t` (px, at the middle of the chain). */
export function chainSagAt(def: StrikeDef, t: number): number {
  const { phase, u } = strikePhaseAt(def, t);
  return phase.blade.kind === 'recall' ? phase.blade.sagPx * Math.sin(Math.PI * u) : 0;
}

/**
 * Fire trail on whole tick `tick`: the blade's recent sub-sampled positions
 * (oldest first) and the crescent's max width. Replayed from tick 0, so the
 * view keeps no state.
 */
export function strikeTrailAt(def: StrikeDef, tick: number, anchors: StrikePoseAnchors): { points: Vec2[]; widthPx: number } {
  const n = def.trailSamplesPerTick;
  let points: Vec2[] = [];
  for (let t = 0; t <= tick; t += 1) {
    const { phase, u } = strikePhaseAt(def, t);
    if (phase.trail) {
      for (let k = 1; t > 0 && k <= n; k += 1) {
        points.push(nearBladeAt(def, t - 1 + k / n, anchors).pos);
      }
      const { tailPx, tailFromU } = phase.trail;
      if (tailPx !== undefined && u > (tailFromU ?? 0)) {
        const keep: Vec2[] = [];
        let length = 0;
        for (let q = points.length - 1; q > 0; q -= 1) {
          length += Math.hypot(points[q][0] - points[q - 1][0], points[q][1] - points[q - 1][1]);
          keep.push(points[q]);
          if (length > tailPx) break;
        }
        points = keep.reverse();
      }
    } else {
      points = points.slice(n);
    }
  }
  const current = strikePhaseAt(def, tick).phase;
  return { points, widthPx: current.trail?.widthPx ?? def.trailFadeWidthPx };
}

function phaseStart(def: StrikeDef, id: string): { start: number; ticks: number } {
  let start = 0;
  for (const phase of def.phases) {
    if (phase.id === id) return { start, ticks: phase.ticks };
    start += phase.ticks;
  }
  throw new Error(`strike ${def.id}: unknown phase ${id}`);
}

/** Swept segment of the blade on whole tick `tick`, or `null` outside the hit window. */
export function strikeHitSegment(def: StrikeDef, tick: number): readonly [Vec2, Vec2] | null {
  const from = phaseStart(def, def.active.from);
  const to = phaseStart(def, def.active.to);
  if (tick < from.start + def.active.fromTick || tick > to.start + to.ticks - 1) {
    return null;
  }
  const a = trackBladeAt(def, tick - 1);
  const b = trackBladeAt(def, tick);
  if (!a || !b) {
    throw new Error(`strike ${def.id}: hit window outside the track at ${tick}`);
  }
  return [a.pos, b.pos];
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
  return { id, tick: 0, originX: player.x, facing: player.facing, hits: [] };
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
