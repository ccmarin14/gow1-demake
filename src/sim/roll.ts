import { CONFIG, ROLL_INVUL_TICKS, ROLL_TICKS } from '../config';
import type { EntityState } from './types';

/**
 * Roll timing comes straight from the tick constants, not from the millisecond
 * values in `CONFIG.player.dodge`. Converting ms to ticks with `Math.round`
 * produces a staircase (round(233 * 60 / 1000) = 14 but round(242 * 60 / 1000)
 * = 15), which makes a supposedly fine-grained knob jump a whole simulation
 * tick. At a fixed `tickRate` the tick is the source of truth; the ms values
 * are the derived, human-readable view of it.
 */
const ROLL_DURATION_TICKS = ROLL_TICKS;

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