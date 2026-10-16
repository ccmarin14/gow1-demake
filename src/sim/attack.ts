import type { EntityState } from './types';

export interface AttackParams {
  startupTicks: number;
  activeTicks: number;
  recoveryTicks: number;
  hitboxOffsetX: number;
  hitboxWidth: number;
  hitboxHeight: number;
  targetHalfWidth: number;
  targetHalfHeight: number;
}

export interface AttackHitbox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export function computeAttackHitbox(
  player: EntityState,
  params: AttackParams,
): AttackHitbox | null {
  if (player.attackPhase !== 'active') {
    return null;
  }
  const x = player.x + player.facing * params.hitboxOffsetX;
  const halfW = params.hitboxWidth / 2;
  return {
    x1: x - halfW,
    y1: player.y - params.hitboxHeight,
    x2: x + halfW,
    y2: player.y,
  };
}

export function stepAttack(
  player: EntityState,
  lightAttackEdge: boolean,
  params: AttackParams,
  targets: readonly EntityState[],
): void {
  if (player.attackPhase === 'none') {
    if (lightAttackEdge && player.grounded) {
      player.attackPhase = 'startup';
      player.attackTicks = 0;
      player.attackHits = [];
    }
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
    const hitbox = computeAttackHitbox(player, params);
    if (hitbox) {
      for (const target of targets) {
        if (player.attackHits.includes(target.id)) {
          continue;
        }
        const tX1 = target.x - params.targetHalfWidth;
        const tY1 = target.y - params.targetHalfHeight * 2;
        const tX2 = target.x + params.targetHalfWidth;
        const tY2 = target.y;
        if (
          hitbox.x1 < tX2 &&
          hitbox.x2 > tX1 &&
          hitbox.y1 < tY2 &&
          hitbox.y2 > tY1
        ) {
          player.attackHits.push(target.id);
        }
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
  }
}
