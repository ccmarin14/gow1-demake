import type { Platform } from './scenarios';
import type { AttackMoveId, EntityState } from './types';

/**
 * Chained-blade arc geometry. The hit area is a blade box (`width` ×
 * `thickness`) carried by the chain from `startRad` to `endRad` around the
 * grip during the active window. Angles: `0` = horizontal forward,
 * positive = upward. Every value is derived from integer ticks inside the
 * fixed-step simulation: no clock, no randomness.
 */
export interface AttackArc {
  startRad: number;
  endRad: number;
  /** Distance from the grip to the blade box center. */
  radius: number;
  width: number;
  thickness: number;
}

export interface AttackParams {
  moveId: AttackMoveId;
  /** Index reported in `attackChain` (hitbox color, scale envelope). */
  chain: number;
  startupTicks: number;
  activeTicks: number;
  recoveryTicks: number;
  /** Height above the feet line where the chains leave the hands. */
  gripOffsetY: number;
  arc: AttackArc;
  /** When set, the radius is `fromPx -> toPx -> fromPx` (straight chain throw). */
  reach: { fromPx: number; toPx: number } | null;
  targetHalfWidth: number;
  targetHalfHeight: number;
  hitstopTicks: number;
  knockbackVx: number;
  launchVy: number;
  selfVy: number;
  lungeVx: number;
  airBrake: boolean;
  groundImpact: boolean;
  damage: number;
}

export type AttackMoveSet = Readonly<Record<AttackMoveId, AttackParams>>;

/** Per-tick attack input, already reduced to edges/holds by the world. */
export interface AttackInput {
  light: boolean;
}

export interface AttackRules {
  hitstunTicks: number;
  groundImpactTicks: number;
  shockRadius: number;
  /** Targets receive knockback/launch/hitstun (scenario `targetPhysics`). */
  targetPhysics: boolean;
}

/** Marker pushed to `attackHits` once a move already emitted its yTop impact. */
const GROUND_HIT_MARK = '@ground';

export interface AttackHitbox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/**
 * Sweep progress for the active tick in progress: the midpoint of the current
 * tick (`(tick - 0.5) / activeTicks`), so the arc is sampled deterministically
 * from the integer tick counter and never jumps to the endpoints.
 */
function sweepProgress(player: Readonly<EntityState>, params: AttackParams): number {
  if (params.activeTicks <= 0) {
    return 0;
  }
  const u = Math.min(
    Math.max((player.attackTicks - 0.5) / params.activeTicks, 0),
    1,
  );
  // Elastic acceleration with whip snap (easeOutCubic)
  return 1 - Math.pow(1 - u, 3);
}

/**
 * Chain throw reach profile: extends over the first 60% of the active window,
 * retracts over the rest.
 */
function reachFraction(progress: number): number {
  return progress < 0.6 ? progress / 0.6 : (1 - progress) / 0.4;
}

function radiusForProgress(params: AttackParams, progress: number): number {
  if (!params.reach) {
    return params.arc.radius;
  }
  return (
    params.reach.fromPx +
    (params.reach.toPx - params.reach.fromPx) * reachFraction(progress)
  );
}

const NO_PLATFORMS: readonly Platform[] = [];

/**
 * `yTop` of the surface the chain can hit below the grip at column `x`: the
 * highest platform covering `x` whose top is at or below `refY` (the grip), so
 * platforms above the hand never clamp the chain. `Infinity` when none.
 */
export function groundYBelow(
  platforms: readonly Platform[],
  x: number,
  refY: number,
): number {
  let best = Infinity;
  for (let i = 0; i < platforms.length; i += 1) {
    const platform = platforms[i];
    if (
      x >= platform.x1 &&
      x <= platform.x2 &&
      platform.yTop >= refY &&
      platform.yTop < best
    ) {
      best = platform.yTop;
    }
  }
  return best;
}

/** Chain/blade never go below `yTop - GROUND_CLEARANCE`. */
export const GROUND_CLEARANCE = 2;

/**
 * Blade box position for the active tick in progress.
 */
export function computeAttackHitbox(
  player: Readonly<EntityState>,
  params: AttackParams,
  platforms: readonly Platform[] = NO_PLATFORMS,
): AttackHitbox | null {
  const pose = bladePoseForTick(player, params, platforms);
  if (!pose) {
    return null;
  }
  const halfW = params.arc.width / 2;
  const halfH = params.arc.thickness / 2;
  return {
    x1: pose.bladeCenterX - halfW,
    y1: pose.bladeCenterY - halfH,
    x2: pose.bladeCenterX + halfW,
    y2: pose.bladeCenterY + halfH,
  };
}

/**
 * Render pose of the chained blade for the active tick in progress, in world
 * coordinates. Pure: reads only the entity, the params and the platforms, no
 * clock, no randomness.
 *
 * - The grip sits on the body axis (`player.x`), so it does NOT mirror with
 *   `facing`: the chains leave the torso, not a mirrored point.
 * - Only the horizontal reach mirrors with `facing`; `bladeCenterX/Y` is the
 *   CENTER of the blade, not its tip.
 * - The blade center is clamped to `yTop - GROUND_CLEARANCE` (`clamped`,
 *   `groundY`); a clamped pose is a floor contact.
 *
 * Returns `null` outside the active window (the weapon is only out while it
 * sweeps), mirroring `computeAttackHitbox`.
 */
export interface BladePose {
  gripX: number;
  gripY: number;
  bladeCenterX: number;
  bladeCenterY: number;
  angleRad: number;
  /** Chain length (grip to blade center) before the floor clamp. */
  radius: number;
  progress: number;
  /** The blade reached the floor and was clamped to it. */
  clamped: boolean;
  /** `yTop` of the surface under the blade (`Infinity` when none). */
  groundY: number;
}

export function bladePoseForTick(
  player: Readonly<EntityState>,
  params: AttackParams,
  platforms: readonly Platform[] = NO_PLATFORMS,
): BladePose | null {
  if (player.attackPhase !== 'active' || params.activeTicks <= 0) {
    return null;
  }
  const progress = sweepProgress(player, params);
  const angle =
    params.arc.startRad + (params.arc.endRad - params.arc.startRad) * progress;
  const radius = radiusForProgress(params, progress);
  const gripY = player.y - params.gripOffsetY;
  const bladeCenterX = player.x + player.facing * Math.cos(angle) * radius;
  let bladeCenterY = gripY - Math.sin(angle) * radius;
  const groundY = groundYBelow(platforms, bladeCenterX, gripY);
  let clamped = false;
  if (bladeCenterY >= groundY - GROUND_CLEARANCE) {
    bladeCenterY = groundY - GROUND_CLEARANCE;
    clamped = true;
  }
  return {
    gripX: player.x,
    gripY,
    bladeCenterX,
    bladeCenterY,
    angleRad: angle,
    radius,
    progress,
    clamped,
    groundY,
  };
}

function overlaps(
  pose: BladePose,
  params: AttackParams,
  target: Readonly<EntityState>,
): boolean {
  const halfW = params.arc.width / 2;
  const halfH = params.arc.thickness / 2;
  const bX1 = Math.min(pose.gripX, pose.bladeCenterX - halfW);
  const bX2 = Math.max(pose.gripX, pose.bladeCenterX + halfW);
  const bY1 = Math.min(pose.gripY - halfH, pose.bladeCenterY - halfH);
  const bY2 = Math.max(pose.gripY + halfH, pose.bladeCenterY + halfH);

  const tX1 = target.kind === 'hydra' ? target.x - 120 : target.x - params.targetHalfWidth;
  const tY1 = target.kind === 'hydra' ? target.y - 100 : target.y - params.targetHalfHeight * 2;
  const tX2 = target.kind === 'hydra' ? target.x + 20 : target.x + params.targetHalfWidth;
  const tY2 = target.y;
  return bX1 < tX2 && bX2 > tX1 && bY1 < tY2 && bY2 > tY1;
}

function beginMove(player: EntityState, params: AttackParams): void {
  player.attackPhase = 'startup';
  player.attackTicks = 0;
  player.attackHits = [];
  player.attackMove = params.moveId;
  player.attackChain = params.chain;
  if (params.airBrake) {
    player.vy = Math.max(player.vy, -60) * 0.35;
  }
}

function beginFromIdle(
  player: EntityState,
  input: AttackInput,
  moves: AttackMoveSet,
): void {
  // Only the basic Square strike exists so far, and only on the ground.
  if (input.light && player.grounded) {
    beginMove(player, moves.light_1);
  }
}

function applyHit(
  player: Readonly<EntityState>,
  target: EntityState,
  params: AttackParams,
  rules: AttackRules,
): void {
  if (!rules.targetPhysics) {
    return;
  }
  if (target.kind !== 'hydra') {
    target.vx = params.knockbackVx * player.facing;
    if (params.launchVy !== 0) {
      target.vy = params.launchVy;
      if (params.launchVy < 0) {
        target.grounded = false;
      }
    }
    target.hitstunTicks = rules.hitstunTicks;
  } else {
    target.hitstunTicks = 6;
  }

  if (target.kind === 'legionnaire' || target.kind === 'archer' || target.kind === 'hydra') {
    if (target.aiState === 'death' || target.aiState === 'hydra_defeat') {
      return;
    }
    const damage = params.damage;

    target.hp = Math.max(0, target.hp - damage);
    if (target.hp <= 0) {
      target.aiState = target.kind === 'hydra' ? 'hydra_defeat' : 'death';
      target.aiTicks = 0;
      if (target.kind !== 'hydra') {
        target.vx = player.facing * 35;
      } else {
        target.isDead = true;
      }
    } else if (target.kind === 'hydra') {
      if (target.aiState === 'hydra_idle') {
        target.aiState = 'hydra_hurt';
        target.aiTicks = 0;
      }
    } else if (params.launchVy < 0) {
      target.aiState = 'juggle';
      target.aiTicks = 0;
      target.grounded = false;
    } else {
      target.aiState = 'hitstun';
      target.aiTicks = 0;
    }
  }
}

export function stepAttack(
  player: EntityState,
  input: AttackInput,
  moves: AttackMoveSet,
  targets: readonly EntityState[],
  platforms: readonly Platform[],
  rules: AttackRules,
): void {
  if (player.groundImpactTicks > 0) {
    player.groundImpactTicks -= 1;
  }
  // Combine fresh input edges with buffered attack action
  const hasBufferedAction = Boolean(player.attackBufferAction && player.attackBufferTicks > 0);
  const effectiveInput: AttackInput = {
    light: input.light || (hasBufferedAction && player.attackBufferAction === 'light-attack'),
  };

  if (player.attackPhase === 'none') {
    beginFromIdle(player, effectiveInput, moves);
    if (player.attackPhase !== 'none') {
      player.attackBufferAction = null;
      player.attackBufferTicks = 0;
    }
    return;
  }

  // If buffer was not consumed this tick, decrement its lifespan
  if (player.attackBufferTicks > 0) {
    player.attackBufferTicks -= 1;
    if (player.attackBufferTicks <= 0) {
      player.attackBufferAction = null;
    }
  }

  const params = moves[player.attackMove === 'none' ? 'light_1' : player.attackMove];

  if (player.attackPhase === 'startup') {
    player.attackTicks += 1;
    if (player.attackTicks >= params.startupTicks) {
      player.attackPhase = 'active';
      player.attackTicks = 0;
      if (params.lungeVx !== 0) {
        player.vx = params.lungeVx * player.facing;
      }
      if (params.selfVy !== 0) {
        player.vy = params.selfVy;
        player.grounded = false;
      }
    }
    return;
  }

  if (player.attackPhase === 'active') {
    player.attackTicks += 1;
    const pose = bladePoseForTick(player, params, platforms);
    if (pose) {
      const groundImpactActive = params.groundImpact && pose.clamped;

      for (const target of targets) {
        if (player.attackHits.includes(target.id)) {
          continue;
        }
        const hitByBlade = overlaps(pose, params, target);
        const hitByShockwave =
          groundImpactActive &&
          target.grounded &&
          Math.abs(target.x - pose.bladeCenterX) <= rules.shockRadius;
        if (hitByBlade || hitByShockwave) {
          player.attackHits.push(target.id);
          applyHit(player, target, params, rules);
          player.hitstopTicks = Math.max(player.hitstopTicks, params.hitstopTicks);
        }
      }
      if (
        groundImpactActive &&
        !player.attackHits.includes(GROUND_HIT_MARK)
      ) {
        player.attackHits.push(GROUND_HIT_MARK);
        player.groundImpactTicks = rules.groundImpactTicks;
        player.groundImpactX = pose.bladeCenterX;
        player.groundImpactY = pose.clamped ? pose.groundY : player.y;
        player.hitstopTicks = Math.max(player.hitstopTicks, params.hitstopTicks);
      }
    }
    if (player.attackTicks >= params.activeTicks) {
      player.attackPhase = 'recovery';
      player.attackTicks = 0;
    }
    return;
  }

  player.attackTicks += 1;
  if (player.attackTicks >= params.recoveryTicks) {
    player.attackPhase = 'none';
    player.attackTicks = 0;
    player.attackChain = 0;
    player.attackMove = 'none';
  }
}

export function isEntityAttacking(entity: EntityState): boolean {
  return entity.attackPhase !== 'none';
}

export function isEntityInvulnerable(entity: EntityState): boolean {
  return entity.invulTicks > 0;
}
