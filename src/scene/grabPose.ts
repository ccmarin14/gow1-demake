// Where Kratos and the grabbed soldier are drawn during a grab (BL-45).
// Pure functions (no Phaser) so `tests/grab-pose.test.ts` can check the contact between the two bodies
// tick by tick: the hand of Kratos must touch the soldier's neck, the soldier must hang off the floor, and
// the blade must land on the lying body. The simulation only says WHERE the two entities are; this module
// says how the two sprites sit against each other.
import KRATOS_ANCHORS from '../assets/kratos-anchors.json' with { type: 'json' };
import LEGIONNAIRE_ANCHORS from '../assets/legionnaire-anchors.json' with { type: 'json' };
import { CONFIG } from '../config';
import type { EntityState } from '../sim/types';

const CANVAS_W = 64;
const CANVAS_H = 56;

type Point = readonly [number, number];
type AnchorTable = Record<string, Record<string, readonly number[]>>;
const KRATOS = KRATOS_ANCHORS as unknown as AnchorTable;
const LEGIONNAIRE = LEGIONNAIRE_ANCHORS as unknown as AnchorTable;

export interface VictimPose {
  /** Sprite origin (bottom center), world px. */
  x: number;
  y: number;
  textureKey: string;
  flipX: boolean;
  /** Draw order against Kratos (depth 0): in front while held, behind once he lies under Kratos' knee. */
  depth: number;
}

const DEPTH_FRONT = 1;
/** Held by the throat: just behind Kratos (depth 0), so his hand and his punching arm are drawn over the soldier. */
const DEPTH_BEHIND_HAND = -0.01;
const DEPTH_LYING = -0.02;

/** Column (of the 64-wide canvas) at the middle of the lying soldier (`legionnaire-death-02`, body from column 0 to 44). */
const LYING_CENTER_COL = 22;

/** Frames the soldier may use while Kratos holds or hits him: always off his feet (check C3). */
export const HELD_FRAMES = ['legionnaire-held-00', 'legionnaire-held-01'] as const;
/** The hand grips the near side of the throat, so his neck anchor sits this far beyond Kratos' hand (px). */
const GRIP_PX = 4;
/** Pixels the soldier is pushed back by each punch (ticks `punchHitFrom..punchHitTo` of the pummel). */
const PUNCH_RECOIL_PX = 3;
const PUNCH_HIT_FROM = 4;
const PUNCH_HIT_TO = 8;

/** Texture key of Kratos' frame for a grab phase, or null when Kratos is not in a grab. */
export function kratosGrabFrameKey(player: Readonly<EntityState>): string | null {
  const t = player.grabTicks;
  const grab = CONFIG.player.grab;
  switch (player.grabPhase) {
    case 'whiff':
      // Ticks 0..12: lunge at full reach; 13..20: brakes and pulls the arm back; then a neutral guard
      if (t <= (grab.whiffLungeTicks ?? 12)) return 'kratos-grab-lunge';
      return t <= 20 ? 'kratos-grab-whiff-recover' : 'kratos-idle-00';
    case 'hold':
    case 'finisher_qte':
      return t < (grab.lungeTicks ?? 2) ? 'kratos-grab-lunge' : 'kratos-grab-hold';
    case 'pummel':
      // Ticks 0..3: fist back; 4..8: fist forward; 9..13: back to the hold
      if (t < 4) return 'kratos-grab-punch-a';
      return t <= 8 ? 'kratos-grab-punch-b' : 'kratos-grab-hold';
    case 'floorhold':
      return 'kratos-grab-stab-a';
    case 'stab':
      // Ticks 0..3: raises the blade; 4..8: blade in; 9..13: pulls it out, back to the ready pose
      if (t < 4) return 'kratos-grab-stab-up';
      return t <= 8 ? 'kratos-grab-stab-b' : 'kratos-grab-stab-a';
    case 'throw':
      if (t < 3) return 'kratos-grab-hold';
      if (t < grab.toss.stabTick + 4) return 'kratos-grab-toss-stab';
      return t < grab.toss.releaseTick ? 'kratos-grab-throw-a' : 'kratos-grab-throw-b';
    case 'break':
      return t < 11 ? 'kratos-grab-break-a' : 'kratos-grab-break-b';
    case 'slam':
    case 'finisher_slam':
      return t < 10 ? 'kratos-grab-slam-a' : 'kratos-grab-slam-b';
    case 'recovery':
      return t < 4 ? 'kratos-sq1-e' : null;
    default:
      return null;
  }
}

/** World position of a Kratos anchor (`hand`, `farHand`...) for his current frame, or null if the frame has none. */
export function kratosAnchorWorld(player: Readonly<EntityState>, frameKey: string, anchor: string): Point | null {
  const a = KRATOS[frameKey]?.[anchor];
  if (!a) return null;
  const f = player.facing === -1 ? -1 : 1;
  return [player.x + f * (a[0] - CANVAS_W / 2), player.y + (a[1] - CANVAS_H)];
}

/** World position of an anchor of the soldier's frame when his sprite origin sits at `pose`. */
export function victimAnchorWorld(pose: VictimPose, anchor: string): Point | null {
  const a = LEGIONNAIRE[pose.textureKey]?.[anchor];
  if (!a) return null;
  const f = pose.flipX ? -1 : 1;
  return [pose.x + f * (a[0] - CANVAS_W / 2), pose.y + (a[1] - CANVAS_H)];
}

/**
 * Point of the blade Kratos holds in the stabs (inverted grip), world px: `along` = 1 is the tip, 0.5 the middle.
 * `deg` is the angle of the blade (90 = straight down, facing right).
 */
export function grabBladePoint(player: Readonly<EntityState>, frameKey: string, deg = 90, along = 1): Point {
  const a = KRATOS[frameKey]?.hand;
  const f = player.facing === -1 ? -1 : 1;
  const hand: Point = a ? [a[0] - CANVAS_W / 2, a[1] - CANVAS_H] : [8, -18];
  const rad = (deg * Math.PI) / 180;
  const length = CONFIG.presentation.strikeArt.bladeSize.w * along;
  return [player.x + f * (hand[0] + Math.cos(rad) * length), player.y + hand[1] + Math.sin(rad) * length];
}

/**
 * Pose of the grabbed soldier, or null when `enemy` is not the victim of `player`'s grab.
 * Held, punched and tossed: his neck sits in Kratos' far hand. In the floor phases he lies under Kratos.
 */
export function victimPose(player: Readonly<EntityState>, enemy: Readonly<EntityState>): VictimPose | null {
  if (player.grabTargetId !== enemy.id || player.grabPhase === 'none') return null;
  const t = player.grabTicks;
  const f = player.facing === -1 ? -1 : 1;
  // The soldier always faces Kratos while he is held
  const flipX = f === 1;
  const grab = CONFIG.player.grab;

  switch (player.grabPhase) {
    case 'hold':
    case 'finisher_qte':
    case 'pummel': {
      const punched = player.grabPhase === 'pummel' && t >= PUNCH_HIT_FROM && t <= PUNCH_HIT_TO;
      const textureKey = punched ? HELD_FRAMES[1] : HELD_FRAMES[0];
      return attachedToHand(player, enemy, textureKey, flipX, punched ? [GRIP_PX + PUNCH_RECOIL_PX, t % 2 === 0 ? 1 : -1] : [GRIP_PX, 0]);
    }
    case 'throw': {
      // Toss: held at the side while the blade goes in, then folded; once released he flies on his own
      if (t >= grab.toss.releaseTick) return { x: enemy.x, y: enemy.y, textureKey: 'legionnaire-juggle-01', flipX: enemy.facing === -1, depth: DEPTH_FRONT };
      return {
        x: player.x + f * 12,
        y: player.y - 12,
        textureKey: t < grab.toss.stabTick ? HELD_FRAMES[0] : HELD_FRAMES[1],
        flipX,
        depth: DEPTH_FRONT,
      };
    }
    case 'break':
      // Rip: raised over Kratos' head (ticks 0..10), then broken against the floor
      if (t < 11) return { x: player.x + f * 6, y: player.y - 22, textureKey: 'legionnaire-juggle-01', flipX: enemy.facing === -1, depth: DEPTH_FRONT };
      return {
        x: player.x + f * 18,
        y: player.y,
        textureKey: t < 18 ? 'legionnaire-death-01' : 'legionnaire-death-02',
        flipX: enemy.facing === -1,
        depth: DEPTH_LYING,
      };
    case 'floorhold':
    case 'stab': {
      // Lying under Kratos; he jolts (2 px up, a small shake) when the blade goes in (ticks 4..8 of the stab)
      const jolt = player.grabPhase === 'stab' && t >= 4 && t <= 8;
      return {
        x: lyingX(player, enemy.facing === -1 ? -1 : 1) + (jolt ? (t % 2 === 0 ? 1 : -1) : 0),
        y: player.y - (jolt ? 2 : 0),
        textureKey: 'legionnaire-death-02',
        flipX: enemy.facing === -1,
        depth: DEPTH_LYING,
      };
    }
    case 'slam':
    case 'finisher_slam':
      // Deck slam: raised at the shoulder (ticks 0..9), then smashed against the boards
      if (t < 10) return { x: player.x + f * 14, y: player.y - 16, textureKey: 'legionnaire-juggle-00', flipX: enemy.facing === -1, depth: DEPTH_FRONT };
      return {
        x: lyingX(player, enemy.facing === -1 ? -1 : 1),
        y: player.y,
        textureKey: t < 18 ? 'legionnaire-death-01' : 'legionnaire-death-02',
        flipX: enemy.facing === -1,
        depth: DEPTH_LYING,
      };
    default:
      return null;
  }
}

/**
 * Where the blow of a grab lands on the soldier's body, world px, for the blood and the dust: the chest on a
 * punch, the belly when the Toss blade goes in, the blade tip on a floor stab. Null if the pose has no anchors.
 */
export function grabImpactPoint(
  player: Readonly<EntityState>,
  victim: Readonly<EntityState>,
  kind: 'punch' | 'toss-stab' | 'floor-stab',
): Point | null {
  if (kind === 'floor-stab') {
    const frameKey = kratosGrabFrameKey(player);
    return frameKey ? grabBladePoint(player, frameKey, 90, 1) : null;
  }
  const pose = victimPose(player, victim);
  if (!pose) return null;
  const neck = victimAnchorWorld(pose, 'neck');
  const pelvis = victimAnchorWorld(pose, 'pelvis');
  if (!neck || !pelvis) return null;
  const at = kind === 'punch' ? 0.4 : 0.9;
  return [neck[0] + (pelvis[0] - neck[0]) * at, neck[1] + (pelvis[1] - neck[1]) * at];
}

/** X of the lying soldier's sprite so that his body is centered under the blade of the plunge (`grab-stab-b`). */
function lyingX(player: Readonly<EntityState>, vf: number): number {
  const tip = grabBladePoint(player, 'kratos-grab-stab-b', 90, 1);
  return tip[0] - vf * (LYING_CENTER_COL - CANVAS_W / 2);
}

/** Hangs the soldier by the neck from Kratos' far hand. */
function attachedToHand(
  player: Readonly<EntityState>,
  enemy: Readonly<EntityState>,
  textureKey: string,
  flipX: boolean,
  offset: Point,
): VictimPose {
  const pose: VictimPose = { x: enemy.x, y: enemy.y, textureKey, flipX, depth: DEPTH_BEHIND_HAND };
  const frameKey = kratosGrabFrameKey(player);
  // While Kratos lunges for the neck (the first ticks of the hold) the soldier is not lifted yet: he stays where the simulation has him
  if (frameKey === 'kratos-grab-lunge') return pose;
  const hand = frameKey ? kratosAnchorWorld(player, frameKey, 'farHand') : null;
  const neck = LEGIONNAIRE[textureKey]?.neck;
  if (!hand || !neck) return pose;
  const f = player.facing === -1 ? -1 : 1;
  const vf = flipX ? -1 : 1;
  const x = hand[0] + f * offset[0] - vf * (neck[0] - CANVAS_W / 2);
  const y = hand[1] + offset[1] - (neck[1] - CANVAS_H);
  return { x, y, textureKey, flipX, depth: DEPTH_BEHIND_HAND };
}
