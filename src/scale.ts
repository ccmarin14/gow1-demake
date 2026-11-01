/**
 * Reference scale derived from the tuning constants.
 *
 * Map, camera and platform stages read these metrics instead of hard-coding
 * sizes, so a change in movement tuning propagates to the geometry.
 * Everything here is pure arithmetic over the values passed in `ScaleInput`:
 * no engine state, no clock, no randomness.
 */

export interface ScaleCanvas {
  width: number;
  height: number;
}

export interface ScaleSprite {
  width: number;
  height: number;
  anchorX: number;
  anchorY: number;
}

export interface ScaleMovement {
  maxSpeed: number;
}

export interface ScaleJump {
  gravity: number;
  jumpSpeed: number;
  maxFallSpeed: number;
  /** Total upward impulses per airborne period (`1` = single jump). */
  maxJumps: number;
  /** Simulation clamp of the feet line, which also keeps the sprite inside the canvas. */
  topY: number;
}

export interface ScaleInput {
  tickRate: number;
  canvas: ScaleCanvas;
  sprite: ScaleSprite;
  movement: ScaleMovement;
  jump: ScaleJump;
}

export interface FeetLineMetrics {
  /** Origin fraction of the sprite that sits on the entity coordinates (1 = feet). */
  anchorY: number;
  /** Sprite top relative to the feet line: `-height * anchorY`. */
  headOffsetY: number;
  /** Sprite bottom relative to the feet line: `height * (1 - anchorY)`. */
  bottomOffsetY: number;
  /** Lowest and highest feet line the simulation allows. */
  minY: number;
  maxY: number;
  /** Playable vertical span of the feet line. */
  spanY: number;
}

export interface SilhouetteMetrics {
  width: number;
  height: number;
  halfWidth: number;
  /** Fraction of the canvas covered by the sprite. */
  widthRatio: number;
  heightRatio: number;
  /** How many player heights fit in the canvas height. */
  heightsPerCanvas: number;
}

export interface TravelMetrics {
  minX: number;
  maxX: number;
  spanX: number;
}

export interface JumpIdealMetrics {
  /** Continuous kinematics: `jumpSpeed² / (2 * gravity)`. Upper bound of the tuning. */
  apexHeight: number;
  /** Continuous kinematics: `2 * jumpSpeed / gravity`. */
  airTimeSeconds: number;
  /** `maxSpeed * airTimeSeconds`. */
  horizontalReach: number;
}

export interface JumpTickMetrics {
  /** Ticks from the jump impulse to the apex. */
  apexTicks: number;
  /** Feet rise actually produced by the fixed step integration. */
  apexHeight: number;
  /** Ticks from the jump impulse back to the launch feet line. */
  airTimeTicks: number;
  airTimeSeconds: number;
  /** `maxSpeed * airTimeSeconds` with the fixed step air time. */
  horizontalReach: number;
}

export interface DoubleJumpTickMetrics {
  /** Impulses actually simulated: `2` with an air jump, `1` without. */
  jumps: number;
  /** Best feet rise reachable by spending the air impulse at the optimal tick. */
  apexHeight: number;
  /** Airborne tick of the air impulse that produces `apexHeight` (`0` when unused). */
  apexImpulseTick: number;
  /** Longest airborne time reachable; conservative bound for horizontal gaps. */
  maxAirTimeTicks: number;
  airTimeSeconds: number;
  /** `maxSpeed * airTimeSeconds` with the longest double-jump air time. */
  horizontalReach: number;
}

export interface JumpReference {
  gravity: number;
  jumpSpeed: number;
  maxFallSpeed: number;
  maxSpeed: number;
  ideal: JumpIdealMetrics;
  /**
   * Exact result of the simulation recurrence (the same order of operations as
   * `stepVertical`). Slightly below `ideal`, because the fixed step integrates
   * gravity discretely; map envelopes use these conservative values.
   */
  ticks: JumpTickMetrics;
  /**
   * Same simulation, but spending every impulse allowed by `maxJumps` and
   * re-firing the extra impulse at the tick that maximizes the feet rise
   * (apex) and, separately, the airborne time (widest gap).
   */
  doubleTicks: DoubleJumpTickMetrics;
}

export interface MapEnvelopeReference {
  /** Tallest platform step the full jump cycle (`maxJumps`) can clear. */
  maxStepUp: number;
  /** Widest gap crossable while airborne at `maxSpeed` using every impulse. */
  maxGapWidth: number;
}

export interface ScaleReference {
  feetLine: FeetLineMetrics;
  silhouette: SilhouetteMetrics;
  horizontalTravel: TravelMetrics;
  jump: JumpReference;
  mapEnvelopes: MapEnvelopeReference;
}

/**
 * Replays the jump integration tick by tick with no platforms, mirroring the
 * order of operations in `stepVertical`: impulse, gravity step, then move.
 * Returns the feet rise and the air time back to the launch line.
 */
export function simulateJumpTicks(
  jump: ScaleJump,
  maxSpeed: number,
  tickRate: number,
): JumpTickMetrics {
  const dtSeconds = 1 / tickRate;
  // A runaway gravity would never return to the feet line; the cap only exists
  // so the derivation always terminates.
  const maxTicks = tickRate * 10;
  let vy = 0;
  let y = 0;
  let apexHeight = 0;
  let apexTicks = 0;
  let airTimeTicks = maxTicks;
  for (let tick = 1; tick <= maxTicks; tick += 1) {
    if (tick === 1) {
      vy = -jump.jumpSpeed;
    }
    vy = Math.min(vy + jump.gravity * dtSeconds, jump.maxFallSpeed);
    y += vy * dtSeconds;
    if (-y > apexHeight) {
      apexHeight = -y;
      apexTicks = tick;
    }
    if (y >= 0) {
      airTimeTicks = tick;
      break;
    }
  }
  const airTimeSeconds = airTimeTicks / tickRate;
  return {
    apexTicks,
    apexHeight,
    airTimeTicks,
    airTimeSeconds,
    horizontalReach: maxSpeed * airTimeSeconds,
  };
}

interface JumpRunMetrics {
  apexHeight: number;
  airTimeTicks: number;
}

/**
 * Replays the jump recurrence firing an impulse on tick 1 and again on
 * `impulseTick`. Returns `null` when the extra impulse falls outside the
 * airborne window (the run already returned to the launch line), which is how
 * an impossible schedule is discarded.
 */
function simulateJumpWithImpulses(
  jump: ScaleJump,
  tickRate: number,
  impulseTick: number,
): JumpRunMetrics | null {
  const dtSeconds = 1 / tickRate;
  const maxTicks = tickRate * 10;
  let appliedExtra = false;
  let vy = 0;
  let y = 0;
  let apexHeight = 0;
  let airTimeTicks = maxTicks;
  for (let tick = 1; tick <= maxTicks; tick += 1) {
    if (tick === 1 || tick === impulseTick) {
      // The air impulse needs the feet strictly above the launch line.
      if (tick !== 1 && y >= 0) {
        return null;
      }
      vy = -jump.jumpSpeed;
      if (tick === impulseTick) {
        appliedExtra = true;
      }
    }
    vy = Math.min(vy + jump.gravity * dtSeconds, jump.maxFallSpeed);
    y += vy * dtSeconds;
    if (-y > apexHeight) {
      apexHeight = -y;
    }
    if (y >= 0) {
      airTimeTicks = tick;
      break;
    }
  }
  if (!appliedExtra) {
    return null;
  }
  return { apexHeight, airTimeTicks };
}

/**
 * Derives the reach of the whole jump cycle: with `maxJumps > 1` it sweeps the
 * tick of the extra impulse to find the best apex and the longest air time
 * separately (the two extremes need different ticks, so each is reported as
 * the conservative bound it protects). `maxJumps <= 1` reproduces the single
 * jump, so the tuning gracefully degrades.
 */
export function simulateDoubleJumpTicks(
  jump: ScaleJump,
  maxSpeed: number,
  tickRate: number,
): DoubleJumpTickMetrics {
  const single = simulateJumpTicks(jump, maxSpeed, tickRate);
  const jumps = Math.max(1, Math.floor(jump.maxJumps));
  if (jumps < 2) {
    return {
      jumps: 1,
      apexHeight: single.apexHeight,
      apexImpulseTick: 0,
      maxAirTimeTicks: single.airTimeTicks,
      airTimeSeconds: single.airTimeSeconds,
      horizontalReach: single.horizontalReach,
    };
  }

  let apexHeight = single.apexHeight;
  let apexImpulseTick = 0;
  let maxAirTimeTicks = single.airTimeTicks;
  for (let impulseTick = 2; impulseTick <= single.airTimeTicks; impulseTick += 1) {
    const run = simulateJumpWithImpulses(jump, tickRate, impulseTick);
    if (!run) {
      continue;
    }
    if (run.apexHeight > apexHeight) {
      apexHeight = run.apexHeight;
      apexImpulseTick = impulseTick;
    }
    if (run.airTimeTicks > maxAirTimeTicks) {
      maxAirTimeTicks = run.airTimeTicks;
    }
  }

  const airTimeSeconds = maxAirTimeTicks / tickRate;
  return {
    jumps,
    apexHeight,
    apexImpulseTick,
    maxAirTimeTicks,
    airTimeSeconds,
    horizontalReach: maxSpeed * airTimeSeconds,
  };
}

export function deriveScaleReference(input: ScaleInput): ScaleReference {
  const { canvas, sprite, movement, jump, tickRate } = input;

  const halfWidth = sprite.width / 2;

  const idealAirTimeSeconds = (2 * jump.jumpSpeed) / jump.gravity;
  const idealJump: JumpIdealMetrics = {
    apexHeight: (jump.jumpSpeed * jump.jumpSpeed) / (2 * jump.gravity),
    airTimeSeconds: idealAirTimeSeconds,
    horizontalReach: movement.maxSpeed * idealAirTimeSeconds,
  };

  const jumpTicks = simulateJumpTicks(jump, movement.maxSpeed, tickRate);
  const doubleJumpTicks = simulateDoubleJumpTicks(jump, movement.maxSpeed, tickRate);

  return {
    feetLine: {
      anchorY: sprite.anchorY,
      headOffsetY: -sprite.height * sprite.anchorY,
      bottomOffsetY: sprite.height * (1 - sprite.anchorY),
      minY: jump.topY,
      maxY: canvas.height,
      spanY: canvas.height - jump.topY,
    },
    silhouette: {
      width: sprite.width,
      height: sprite.height,
      halfWidth,
      widthRatio: sprite.width / canvas.width,
      heightRatio: sprite.height / canvas.height,
      heightsPerCanvas: canvas.height / sprite.height,
    },
    horizontalTravel: {
      minX: halfWidth,
      maxX: canvas.width - halfWidth,
      spanX: canvas.width - sprite.width,
    },
    jump: {
      gravity: jump.gravity,
      jumpSpeed: jump.jumpSpeed,
      maxFallSpeed: jump.maxFallSpeed,
      maxSpeed: movement.maxSpeed,
      ideal: idealJump,
      ticks: jumpTicks,
      doubleTicks: doubleJumpTicks,
    },
    mapEnvelopes: {
      maxStepUp: doubleJumpTicks.apexHeight,
      maxGapWidth: doubleJumpTicks.horizontalReach,
    },
  };
}
