import { CONFIG } from '../config';
import type { EntityState } from './types';

const ROLL_DURATION_TICKS = Math.round(
  (CONFIG.player.dodge.durationMs * CONFIG.sim.tickRate) / 1000,
);

const ROLL_INVUL_TICKS = Math.round(
  (CONFIG.player.dodge.invulMs * CONFIG.sim.tickRate) / 1000,
);

export function startRoll(entity: EntityState): boolean {
  if (entity.rollPhase !== 'none') {
    return false;
  }
  // Do not start roll in air
  if (!entity.grounded) {
    return false;
  }
  entity.rollPhase = 'active';
  entity.rollTicks = 0;
  if (entity.invulTicks < ROLL_INVUL_TICKS) {
    entity.invulTicks = ROLL_INVUL_TICKS;
  }
  const dir = entity.facing === -1 ? -1 : 1;
  const dodgeCfg = (CONFIG as any).player?.dodge ?? (CONFIG as any).dodge;
  const base = (dodgeCfg?.rollSpeed ?? ((CONFIG as any).player?.maxSpeed ?? 140) * 2.0);
  const speed = typeof base === 'number' && Number.isFinite(base) ? base : 280;
  entity.vx = speed * dir;
  return true;
}

export function stepRoll(entity: EntityState): void {
  // Count down invulnerability exactly once per tick, in every phase.
  if (entity.invulTicks > 0) {
    entity.invulTicks -= 1;
  }

  if (entity.rollPhase === 'none') {
    return;
  }

  entity.rollTicks += 1;

  if (entity.rollTicks >= ROLL_DURATION_TICKS) {
    entity.rollPhase = 'none';
    entity.rollTicks = 0;
  }
}

export function isRolling(entity: EntityState): boolean {
  return entity.rollPhase !== 'none';
}