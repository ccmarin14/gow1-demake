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

/** Frames the soldier may use while Kratos holds or hits him: always off his feet (check C3). */
export const HELD_FRAMES = ['legionnaire-held-00', 'legionnaire-held-01'] as const;
/** The hand grips the near side of the throat, so his neck anchor sits this far beyond Kratos' hand (px). */
const GRIP_PX = 4;
/** Pixels the soldier is pushed back by each punch (ticks `punchHitFrom..punchHitTo` of the pummel). */
const PUNCH_RECOIL_PX = 3;
const PUNCH_HIT_FROM = 4;
const PUNCH_HIT_TO = 8;
/** Hold with no choice: the soldier starts to struggle after this many ticks, and faster in the last ones. */
const STRUGGLE_FROM = 30;
const STRUGGLE_FAST_LAST = 30;
/** The deck slam: the lift from the hanging place to the overhead one starts here and takes this many ticks. */
const SLAM_LIFT_FROM = 4;
const SLAM_LIFT_TICKS = 5;
/** The Toss: the soldier follows Kratos' hand over this many ticks after Kratos changes pose. */
const TOSS_FOLLOW_TICKS = 4;

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
      // The lunge only shows on the first grab while Kratos closes the distance: coming back to the hold after a
      // punch (the tick counter restarts) used to flash it again
      if ((player.grabPummelCount ?? 0) === 0 && ((player.grabAdvancePx ?? 0) > 0 || t < (grab.lungeTicks ?? 2))) {
        return 'kratos-grab-lunge';
      }
      return 'kratos-grab-hold';
    case 'pummel':
      // Ticks 0..3: fist back; 4..8: fist forward; 9..13: back to the hold
      if (t < 4) return 'kratos-grab-punch-a';
      return t <= 8 ? 'kratos-grab-punch-b' : 'kratos-grab-hold';
    case 'floorhold':
      // Pulled the blade out (stab-a) and raises it again (stab-up), ready for the next tap
      return t < 4 ? 'kratos-grab-stab-a' : 'kratos-grab-stab-up';
    case 'stab':
      // Raised blade, the blade goes in for a few ticks, then he pulls it out
      if (t < grab.chain.stabImpactTick) return 'kratos-grab-stab-up';
      return t <= grab.chain.stabImpactTick + 3 ? 'kratos-grab-stab-b' : 'kratos-grab-stab-a';
    case 'throw':
      // Holds him at his side, raises the blade, goes in, winds up and lets go on the chain
      if (t < grab.toss.raiseFrom) return 'kratos-grab-hold';
      if (t < grab.toss.stabTick) return 'kratos-grab-toss-raise';
      if (t < grab.toss.stabTick + 8) return 'kratos-grab-toss-stab';
      return t < grab.toss.releaseTick - 3 ? 'kratos-grab-throw-a' : 'kratos-grab-throw-b';
    case 'break':
      // Grips him, lifts him overhead (a), pulls him down to his chest (slam-c), stretches him between his hands (b)
      if (t < 4) return 'kratos-grab-hold';
      if (t < 16) return 'kratos-grab-break-a';
      return t < grab.ripTick - 6 ? 'kratos-grab-slam-c' : 'kratos-grab-break-b';
    case 'slam':
    case 'finisher_slam':
      // Grips (hold), lifts him overhead (a), swings (c), smashes him (b)
      if (t < 4) return 'kratos-grab-hold';
      if (t < grab.slamImpactTick - 5) return 'kratos-grab-slam-a';
      return t < grab.slamImpactTick ? 'kratos-grab-slam-c' : 'kratos-grab-slam-b';
    case 'recovery':
      // The chain killed him (the victim is still his target): he gets up from his knee, or lets go of the punched body
      if (player.grabTargetId !== null) {
        if ((player.grabPummelCount ?? 0) > grab.chain.punches) return t < 6 ? 'kratos-grab-stab-a' : null;
        return t < 4 ? 'kratos-grab-hold' : null;
      }
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

const lerp = (a: number, b: number, k: number): number => a + (b - a) * Math.min(1, Math.max(0, k));

/**
 * Angle of the blade in Kratos' hand during the floor stabs (degrees, 90 = pointing down, -70 = raised high ahead):
 * it comes up between stabs, swings and goes in, and is pulled out. The hands only travel ~13 px, so the blade
 * makes the movement readable.
 */
export function grabBladeAngle(player: Readonly<EntityState>): number {
  const t = player.grabTicks;
  const { stabImpactTick, stabTicks } = CONFIG.player.grab.chain;
  const up = -70;
  const down = 90;
  const out = 30;
  if (player.grabPhase === 'throw') {
    // the Toss blade: raised over his head, swung down and in at the stab tick, held there until he is let go
    const { raiseFrom, stabTick } = CONFIG.player.grab.toss;
    return t < stabTick ? lerp(up, 25, (t - raiseFrom) / Math.max(1, stabTick - raiseFrom)) : 25;
  }
  if (player.grabPhase === 'floorhold') return t < 6 ? lerp(out, up, t / 6) : up;
  if (player.grabPhase === 'stab') {
    if (t < stabImpactTick) return lerp(up, 0, t / stabImpactTick);
    if (t <= stabImpactTick + 3) return down;
    return lerp(down, out, (t - stabImpactTick - 3) / Math.max(1, stabTicks - stabImpactTick - 3));
  }
  return down;
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
      // Nobody chose anything for a while: he struggles (bends and straightens, faster as he is about to break free)
      // instead of hanging still for two seconds
      const waiting = player.grabPhase === 'hold' && t >= STRUGGLE_FROM;
      const period = t >= grab.holdTicks - STRUGGLE_FAST_LAST ? 3 : 6;
      const bent = waiting && Math.floor(t / period) % 2 === 1;
      const textureKey = punched || bent ? HELD_FRAMES[1] : HELD_FRAMES[0];
      const shake = waiting ? (t % 2 === 0 ? 1 : -1) : 0;
      return attachedToHand(player, enemy, textureKey, flipX, punched ? [GRIP_PX + PUNCH_RECOIL_PX, t % 2 === 0 ? 1 : -1] : [GRIP_PX + shake, 0]);
    }
    case 'throw': {
      // Toss: his neck stays in Kratos' far hand (he is held at the side, bent over once the blade is raised);
      // once let go he flies on his own, tumbling
      if (t >= grab.toss.releaseTick) {
        return { x: enemy.x, y: enemy.y, textureKey: tumbleFrame(enemy), flipX: enemy.vx < 0, depth: DEPTH_FRONT };
      }
      const textureKey = t < grab.toss.raiseFrom ? HELD_FRAMES[0] : HELD_FRAMES[1];
      // in the wind-up Kratos swings him behind: he is drawn in front of Kratos (behind him he was hidden) and a bit further back
      const windUp = t >= grab.toss.stabTick + 8;
      const offset: Point = [windUp ? GRIP_PX - 8 : GRIP_PX, 0];
      const pose = attachedToHand(player, enemy, textureKey, flipX, offset);
      // When Kratos changes pose his hand jumps; the soldier follows it over the next ticks instead of in one
      const frameAt = (tick: number): string | null => kratosGrabFrameKey({ ...player, grabTicks: tick });
      const frame = frameAt(t);
      let since = 0;
      while (since < TOSS_FOLLOW_TICKS - 1 && t - since - 1 >= 0 && frameAt(t - since - 1) === frame) since += 1;
      let { x, y } = pose;
      if (since < TOSS_FOLLOW_TICKS - 1 && t - since - 1 >= 0) {
        const before = attachedToHand(player, enemy, textureKey, flipX, offset, frameAt(t - since - 1));
        const k = (since + 1) / TOSS_FOLLOW_TICKS;
        x = before.x + (pose.x - before.x) * k;
        y = before.y + (pose.y - before.y) * k;
      }
      // a bent soldier stands at Kratos' side: never below the floor
      return { ...pose, x, y: Math.min(y, player.y), depth: t >= grab.toss.stabTick ? DEPTH_FRONT : pose.depth };
    }
    case 'break': {
      // Rip: lifted overhead, pulled to the chest and stretched across both hands; at `ripTick` he is torn in two
      // (the halves are drawn by RipHalves, the body is hidden by `ripped`)
      if (t >= grab.ripTick) return null;
      const carried = carriedAcrossHands(player, enemy, flipX, 'legionnaire-flip-00');
      // stretched: he trembles between the hands in the last ticks before the tear
      if (t >= grab.ripTick - 6) return { ...carried, x: carried.x + (t % 2 === 0 ? 1 : -1) };
      return carried;
    }
    case 'floorhold':
    case 'stab': {
      // Lying under Kratos; he jolts (2 px up, a small shake) when the blade goes in (ticks 4..8 of the stab)
      const impact = grab.chain.stabImpactTick;
      const jolt = player.grabPhase === 'stab' && t >= impact && t <= impact + 4;
      return {
        x: enemy.x + (jolt ? (t % 2 === 0 ? 1 : -1) : 0),
        y: player.y - (jolt ? 2 : 0),
        textureKey: 'legionnaire-death-02',
        flipX: enemy.facing === -1,
        depth: DEPTH_LYING,
      };
    }
    case 'recovery':
      // The floor stabs killed him: he stays lying while Kratos gets up (the body used to reappear standing)
      if (enemy.isDead && (player.grabPummelCount ?? 0) > grab.chain.punches) {
        return { x: enemy.x, y: player.y, textureKey: 'legionnaire-death-02', flipX: enemy.facing === -1, depth: DEPTH_LYING };
      }
      return null;
    case 'slam':
    case 'finisher_slam': {
      // Deck slam: lifted overhead across both hands (a body lying along the arms), he dives head first, then he
      // lands. Audit: it used to be a 10-tick jump from his side to the floor.
      const impact = grab.slamImpactTick;
      if (t >= impact) {
        return {
          x: enemy.x,
          y: player.y,
          textureKey: t < impact + 8 ? 'legionnaire-death-01' : 'legionnaire-death-02',
          flipX: enemy.facing === -1,
          depth: DEPTH_LYING,
        };
      }
      return carriedAcrossHands(player, enemy, flipX, t < impact - 5 ? 'legionnaire-flip-00' : 'legionnaire-flip-01');
    }
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
  kind: 'punch' | 'toss-stab' | 'floor-stab' | 'slam',
): Point | null {
  if (kind === 'floor-stab') {
    const frameKey = kratosGrabFrameKey(player);
    return frameKey ? grabBladePoint(player, frameKey, 90, 1) : null;
  }
  if (kind === 'slam') {
    // where the body lands: the middle of the lying soldier (his body spans columns 0 to 44 of his frame)
    const f = victim.facing === -1 ? -1 : 1;
    return [victim.x + f * (22 - CANVAS_W / 2), player.y - 4];
  }
  const pose = victimPose(player, victim);
  if (!pose) return null;
  const neck = victimAnchorWorld(pose, 'neck');
  const pelvis = victimAnchorWorld(pose, 'pelvis');
  if (!neck || !pelvis) return null;
  const at = kind === 'punch' ? 0.4 : 0.9;
  return [neck[0] + (pelvis[0] - neck[0]) * at, neck[1] + (pelvis[1] - neck[1]) * at];
}

/** Frame of the thrown soldier tumbling: a quarter turn every 5 ticks. */
export function tumbleFrame(enemy: Readonly<EntityState>): string {
  return `legionnaire-tumble-0${Math.floor(enemy.aiTicks / 5) % 4}`;
}

/**
 * The soldier carried lying across both Kratos' hands (the slam and the Rip): he first goes from where he hangs to
 * the overhead place over a few ticks, then his pelvis stays at the middle between the hands.
 */
function carriedAcrossHands(player: Readonly<EntityState>, enemy: Readonly<EntityState>, flipX: boolean, flipKey: string): VictimPose {
  const t = player.grabTicks;
  const held = attachedToHand(player, enemy, HELD_FRAMES[0], flipX, [GRIP_PX, 0]);
  if (t < SLAM_LIFT_FROM) return held;
  const frameKey = kratosGrabFrameKey(player);
  const over = frameKey ? attachedByPelvis(player, frameKey, flipKey, flipX) : null;
  if (!over) return held;
  const k = Math.min(1, (t - SLAM_LIFT_FROM) / SLAM_LIFT_TICKS);
  return {
    x: held.x + (over.x - held.x) * k,
    y: held.y + (over.y - held.y) * k,
    textureKey: k < 1 ? held.textureKey : over.textureKey,
    flipX,
    depth: DEPTH_BEHIND_HAND,
  };
}

/** Where the soldier is drawn the tick before the Rip tears him: the halves start there. */
export function ripHalvesOrigin(player: Readonly<EntityState>, enemy: Readonly<EntityState>): VictimPose | null {
  return victimPose({ ...player, grabTicks: CONFIG.player.grab.ripTick - 1 }, enemy);
}

/** Lays the soldier across Kratos' two hands: his pelvis sits at the middle between them (the slam carry). */
function attachedByPelvis(player: Readonly<EntityState>, frameKey: string, textureKey: string, flipX: boolean): VictimPose | null {
  const near = kratosAnchorWorld(player, frameKey, 'hand');
  const far = kratosAnchorWorld(player, frameKey, 'farHand');
  const pelvis = LEGIONNAIRE[textureKey]?.pelvis;
  if (!near || !far || !pelvis) return null;
  const vf = flipX ? -1 : 1;
  const middle: Point = [(near[0] + far[0]) / 2, (near[1] + far[1]) / 2];
  return {
    x: middle[0] - vf * (pelvis[0] - CANVAS_W / 2),
    y: middle[1] - (pelvis[1] - CANVAS_H),
    textureKey,
    flipX,
    depth: DEPTH_BEHIND_HAND,
  };
}

/** Hangs the soldier by the neck from Kratos' far hand. */
function attachedToHand(
  player: Readonly<EntityState>,
  enemy: Readonly<EntityState>,
  textureKey: string,
  flipX: boolean,
  offset: Point,
  frameOverride?: string | null,
): VictimPose {
  const pose: VictimPose = { x: enemy.x, y: enemy.y, textureKey, flipX, depth: DEPTH_BEHIND_HAND };
  const frameKey = frameOverride ?? kratosGrabFrameKey(player);
  // While Kratos lunges for the neck the soldier is not lifted yet: he stands where the simulation has him
  if (frameKey === 'kratos-grab-lunge') return { ...pose, textureKey: 'legionnaire-hitstun-00' };
  const hand = frameKey ? kratosAnchorWorld(player, frameKey, 'farHand') : null;
  const neck = LEGIONNAIRE[textureKey]?.neck;
  if (!hand || !neck) return pose;
  const f = player.facing === -1 ? -1 : 1;
  const vf = flipX ? -1 : 1;
  const x = hand[0] + f * offset[0] - vf * (neck[0] - CANVAS_W / 2);
  const y = hand[1] + offset[1] - (neck[1] - CANVAS_H);
  return { x, y, textureKey, flipX, depth: DEPTH_BEHIND_HAND };
}
