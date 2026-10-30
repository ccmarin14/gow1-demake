import type { EntityState } from './types';

export interface MovementParams {
  maxSpeed: number;
  accel: number;
  brake: number;
  minX: number;
  maxX: number;
  /** Weaker control while airborne (px/s^2). */
  airControl: { accel: number; brake: number };
  /** Ground turnaround slide (see `CONFIG.player.skid`). */
  skid: { brake: number; ticks: number; minSpeedRatio: number };
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

/**
 * One tick of steering without skid: brake with no input (or both), brake
 * while the input opposes the motion, otherwise accelerate up to `maxSpeed`.
 */
function steer(
  entity: EntityState,
  vx: number,
  inputDir: -1 | 0 | 1,
  accel: number,
  brake: number,
  maxSpeed: number,
  dtSeconds: number,
): number {
  if (inputDir === 0) {
    return brakeTowardZero(vx, brake * dtSeconds);
  }
  entity.facing = inputDir;
  if (vx * inputDir < 0) {
    return brakeTowardZero(vx, brake * dtSeconds);
  }
  return clampSpeed(vx + inputDir * accel * dtSeconds, maxSpeed);
}

export function stepHorizontal(
  entity: EntityState,
  wantsLeft: boolean,
  wantsRight: boolean,
  dtSeconds: number,
  params: MovementParams,
  locked: boolean = false,
): void {
  const { maxSpeed, accel, brake, minX, maxX, airControl, skid } = params;
  const inputDir: -1 | 0 | 1 = wantsLeft === wantsRight ? 0 : wantsRight ? 1 : -1;
  let vx = entity.vx;

  if (locked) {
    entity.skidTicks = 0;
  } else if (!entity.grounded) {
    entity.skidTicks = 0;
    vx = steer(entity, vx, inputDir, airControl.accel, airControl.brake, maxSpeed, dtSeconds);
  } else {
    // A fast ground turnaround starts a skid.
    if (
      entity.skidTicks <= 0 &&
      inputDir !== 0 &&
      vx * inputDir < 0 &&
      Math.abs(vx) >= maxSpeed * skid.minSpeedRatio
    ) {
      entity.skidTicks = skid.ticks;
    }

    if (entity.skidTicks > 0) {
      entity.skidTicks -= 1;
      vx = brakeTowardZero(vx, skid.brake * dtSeconds);

      if (inputDir !== 0 && inputDir === entity.facing) {
        // Input returned to the facing direction: cancel the skid early.
        entity.skidTicks = 0;
        vx = clampSpeed(vx + inputDir * accel * dtSeconds, maxSpeed);
      } else if (entity.skidTicks === 0 || vx === 0) {
        entity.skidTicks = 0;
        if (inputDir !== 0) {
          entity.facing = inputDir;
          vx = clampSpeed(vx + inputDir * accel * dtSeconds, maxSpeed);
        }
      }
    } else {
      vx = steer(entity, vx, inputDir, accel, brake, maxSpeed, dtSeconds);
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
