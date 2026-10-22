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
  entity.vx = CONFIG.player.dodge.rollSpeed * dir;
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
    // Hand control back on the closing tick. `stepRoll` runs before
    // `stepHorizontal`, so without this the roll's own impulse (vx = +-280)
    // would survive into an unlocked `stepHorizontal`: the player would keep
    // sliding after the roll, with no i-frames and no roll animation, and
    // holding the direction would even *brake* the leftover 280 down to
    // `maxSpeed` instead of accelerating.
    entity.vx = 0;
  }
}

export function isRolling(entity: EntityState): boolean {
  return entity.rollPhase !== 'none';
}