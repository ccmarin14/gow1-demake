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

const BRAKE_SKID = 2200;
const SKID_TICKS = 6;

export function stepHorizontal(
  entity: EntityState,
  wantsLeft: boolean,
  wantsRight: boolean,
  dtSeconds: number,
  params: MovementParams,
  locked: boolean = false,
): void {
  const { maxSpeed, accel, brake, minX, maxX } = params;
  let vx = entity.vx;

  if (locked || !entity.grounded) {
    entity.skidTicks = 0;
    if (locked) {
      vx = entity.vx;
    } else {
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
    }
  } else {
    const hasDirectionInput = wantsLeft !== wantsRight;
    const inputDir: -1 | 1 = wantsRight ? 1 : -1;

    // Detect high-speed turnaround on ground
    if (entity.skidTicks <= 0) {
      if (
        hasDirectionInput &&
        vx * inputDir < 0 &&
        Math.abs(vx) >= maxSpeed * 0.6
      ) {
        entity.skidTicks = SKID_TICKS;
      }
    }

    if (entity.skidTicks > 0) {
      entity.skidTicks -= 1;
      vx = brakeTowardZero(vx, BRAKE_SKID * dtSeconds);

      // If direction reversed back to facing, cancel skid early
      if (hasDirectionInput && inputDir === entity.facing) {
        entity.skidTicks = 0;
        vx = clampSpeed(vx + inputDir * accel * dtSeconds, maxSpeed);
      } else if (entity.skidTicks === 0 || vx === 0) {
        entity.skidTicks = 0;
        if (hasDirectionInput) {
          entity.facing = inputDir;
          vx = clampSpeed(vx + inputDir * accel * dtSeconds, maxSpeed);
        }
      }
    } else {
      if (!hasDirectionInput) {
        vx = brakeTowardZero(vx, brake * dtSeconds);
      } else {
        if (vx * inputDir < 0) {
          vx = brakeTowardZero(vx, brake * dtSeconds);
        } else {
          vx = clampSpeed(vx + inputDir * accel * dtSeconds, maxSpeed);
        }
        entity.facing = inputDir;
      }
    }
  }

  entity.vx = vx;

  let x = entity.x + vx * dtSeconds;
  if (x < minX) {
    x = minX;
    entity.vx = 0;
    entity.skidTicks = 0;
  } else if (x > maxX) {
    x = maxX;
    entity.vx = 0;
    entity.skidTicks = 0;
  }
  entity.x = x;
}
