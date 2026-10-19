import type { EntityState } from './types';

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
  startupTicks: number;
  activeTicks: number;
  recoveryTicks: number;
  /** Height above the feet line where the chains leave the hands. */
  gripOffsetY: number;
  arc: AttackArc;
  targetHalfWidth: number;
  targetHalfHeight: number;
}

export interface AttackCombo {
  maxChain: number;
  hits: readonly AttackParams[];
}

export interface AttackHitbox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export function attackParamsForChain(
  combo: AttackCombo,
  chain: number,
): AttackParams {
  const index = Math.min(Math.max(chain, 0), combo.hits.length - 1);
  return combo.hits[index];
}

/**
 * Blade box position for the active tick in progress. The sweep progress is
 * the midpoint of the current tick (`(tick - 0.5) / activeTicks`), so the arc
 * is sampled deterministically from the integer tick counter and never jumps
 * to the endpoints within a single active window.
 */
export function computeAttackHitbox(
  player: EntityState,
  params: AttackParams,
): AttackHitbox | null {
  if (player.attackPhase !== 'active' || params.activeTicks <= 0) {
    return null;
  }
  const progress = Math.min(
    Math.max((player.attackTicks - 0.5) / params.activeTicks, 0),
    1,
  );
  const angle =
    params.arc.startRad + (params.arc.endRad - params.arc.startRad) * progress;
  const centerX =
    player.x + player.facing * Math.cos(angle) * params.arc.radius;
  const centerY =
    player.y - params.gripOffsetY - Math.sin(angle) * params.arc.radius;
  const halfW = params.arc.width / 2;
  const halfH = params.arc.thickness / 2;
  return {
    x1: centerX - halfW,
    y1: centerY - halfH,
    x2: centerX + halfW,
    y2: centerY + halfH,
  };
}

function overlaps(player: EntityState, params: AttackParams, target: EntityState): boolean {
  const hitbox = computeAttackHitbox(player, params);
  if (!hitbox) {
    return false;
  }
  const tX1 = target.x - params.targetHalfWidth;
  const tY1 = target.y - params.targetHalfHeight * 2;
  const tX2 = target.x + params.targetHalfWidth;
  const tY2 = target.y;
  return hitbox.x1 < tX2 && hitbox.x2 > tX1 && hitbox.y1 < tY2 && hitbox.y2 > tY1;
}

export function stepAttack(
  player: EntityState,
  lightAttackEdge: boolean,
  combo: AttackCombo,
  targets: readonly EntityState[],
): void {
  if (player.attackPhase === 'none') {
    if (lightAttackEdge && player.grounded) {
      player.attackPhase = 'startup';
      player.attackTicks = 0;
      player.attackHits = [];
      player.attackChain = 0;
    }
    return;
  }

  const params = attackParamsForChain(combo, player.attackChain);

  const canChain =
    lightAttackEdge &&
    player.grounded &&
    player.attackChain < combo.maxChain - 1 &&
    (player.attackPhase === 'active' || player.attackPhase === 'recovery');

  if (canChain) {
    player.attackChain += 1;
    player.attackPhase = 'startup';
    player.attackTicks = 0;
    player.attackHits = [];
    return;
  }

  if (player.attackPhase === 'startup') {
    player.attackTicks += 1;
    if (player.attackTicks >= params.startupTicks) {
      player.attackPhase = 'active';
      player.attackTicks = 0;
    }
    return;
  }

  if (player.attackPhase === 'active') {
    player.attackTicks += 1;
    for (const target of targets) {
      if (player.attackHits.includes(target.id)) {
        continue;
      }
      if (overlaps(player, params, target)) {
        player.attackHits.push(target.id);
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
  }
}

export function isEntityAttacking(entity: EntityState): boolean {
  return entity.attackPhase !== 'none';
}

export function isEntityInvulnerable(entity: EntityState): boolean {
  return entity.invulTicks > 0;
}
