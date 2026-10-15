import type { EntityState } from './types';

export interface MovementParams {
  maxSpeed: number;
  accel: number;
  brake: number;
  minX: number;
  maxX: number;
}

function brakeTowardZero(vx: number, delta: number): number {
  if (vx > 0) {
    return Math.max(0, vx - delta);
  }
  if (vx < 0) {
    return Math.min(0, vx + delta);
  }
  return 0;
}

function clampSpeed(vx: number, maxSpeed: number): number {
  if (vx > maxSpeed) {
    return maxSpeed;
  }
  if (vx < -maxSpeed) {
    return -maxSpeed;
  }
  return vx;
}

export function stepHorizontal(
  entity: EntityState,
  wantsLeft: boolean,
  wantsRight: boolean,
  dtSeconds: number,
  params: MovementParams,
): void {
  const { maxSpeed, accel, brake, minX, maxX } = params;
  let vx = entity.vx;

  if (wantsLeft === wantsRight) {
    vx = brakeTowardZero(vx, brake * dtSeconds);
  } else {
    const dir: -1 | 1 = wantsRight ? 1 : -1;
    if (vx * dir < 0) {
      vx = brakeTowardZero(vx, brake * dtSeconds);
    } else {
      vx = clampSpeed(vx + dir * accel * dtSeconds, maxSpeed);
    }
    entity.facing = dir;
  }

  entity.vx = vx;

  let x = entity.x + vx * dtSeconds;
  if (x < minX) {
    x = minX;
    entity.vx = 0;
  } else if (x > maxX) {
    x = maxX;
    entity.vx = 0;
  }
  entity.x = x;
}
