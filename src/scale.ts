/**
 * Reference scale derived from the tuning constants.
 *
 * Map, camera and platform stages read these metrics instead of hard-coding
 * sizes, so a change in movement or attack tuning propagates to the geometry.
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

export interface ScaleAttackArc {
  startDeg: number;
  endDeg: number;
  radius: number;
  width: number;
  thickness: number;
}

export interface ScaleAttackHit {
  arc: ScaleAttackArc;
}

export interface ScaleAttack {
  maxChain: number;
  /** Height above the feet line where the chains leave the hands. */
  gripOffsetY: number;
  combo: readonly ScaleAttackHit[];
}

export interface ScaleInput {
  tickRate: number;
  canvas: ScaleCanvas;
  sprite: ScaleSprite;
  movement: ScaleMovement;
  jump: ScaleJump;
  attack: ScaleAttack;
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

export interface AttackHitEnvelope {
  chain: number;
  /** Distance in front of the player center where the swept arc starts and ends. */
  nearX: number;
  farX: number;
  /** Top of the swept arc band relative to the feet line (negative = above). */
  topY: number;
  /** Bottom of the swept arc band relative to the feet line (negative = above). */
  bottomY: number;
}

export interface AttackReference {
  chainCount: number;
  hits: readonly AttackHitEnvelope[];
  /** Farthest front edge of the whole combo. */
  maxReach: number;
  /** Closest front edge of the whole combo. */
  minReach: number;
  /** Vertical band above the feet line the combo can cover. */
  bandHeight: number;
}

/** Offsets relative to the player feet position, already mirrored by `facing`. */
export interface AttackBoxOffsets {
  x1: number;
  x2: number;
  y1: number;
  y2: number;
}

export interface MapEnvelopeReference {
  /** Tallest platform step the full jump cycle (`maxJumps`) can clear. */
  maxStepUp: number;
  /** Widest gap crossable while airborne at `maxSpeed` using every impulse. */
  maxGapWidth: number;
  /** Farthest target the combo reaches without moving. */
  maxAttackGap: number;
  /** Height above the feet line a target can be hit on the same level. */
  attackBandHeight: number;
}

export interface ScaleReference {
  feetLine: FeetLineMetrics;
  silhouette: SilhouetteMetrics;
  horizontalTravel: TravelMetrics;
  jump: JumpReference;
  attack: AttackReference;
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

/**
 * Bounding box of the blade box swept along the arc, relative to the feet
 * line and the player center (facing right). Pure trigonometry: the extremes
 * of `cos`/`sin` over the angle interval are its endpoints plus any axis
 * crossing (`0°`, `±90°`, `180°`) contained in the interval.
 */
export function sweptArcEnvelope(
  arc: ScaleAttackArc,
  gripOffsetY: number,
): { nearX: number; farX: number; topY: number; bottomY: number } {
  const toRad = (deg: number): number => (deg * Math.PI) / 180;
  const a = toRad(Math.min(arc.startDeg, arc.endDeg));
  const b = toRad(Math.max(arc.startDeg, arc.endDeg));
  const candidates = [a, b];
  for (const crossing of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
    if (crossing > a && crossing < b) {
      candidates.push(crossing);
    }
  }
  let minCos = Infinity;
  let maxCos = -Infinity;
  let minSin = Infinity;
  let maxSin = -Infinity;
  for (const angle of candidates) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    if (cos < minCos) minCos = cos;
    if (cos > maxCos) maxCos = cos;
    if (sin < minSin) minSin = sin;
    if (sin > maxSin) maxSin = sin;
  }
  const halfW = arc.width / 2;
  const halfH = arc.thickness / 2;
  return {
    nearX: minCos * arc.radius - halfW,
    farX: maxCos * arc.radius + halfW,
    // Feet-relative Y: negative is above the feet line.
    topY: -gripOffsetY - maxSin * arc.radius - halfH,
    bottomY: -gripOffsetY - minSin * arc.radius + halfH,
  };
}

export function deriveScaleReference(input: ScaleInput): ScaleReference {
  const { canvas, sprite, movement, jump, attack, tickRate } = input;

  const halfWidth = sprite.width / 2;

  const idealAirTimeSeconds = (2 * jump.jumpSpeed) / jump.gravity;
  const idealJump: JumpIdealMetrics = {
    apexHeight: (jump.jumpSpeed * jump.jumpSpeed) / (2 * jump.gravity),
    airTimeSeconds: idealAirTimeSeconds,
    horizontalReach: movement.maxSpeed * idealAirTimeSeconds,
  };

  const jumpTicks = simulateJumpTicks(jump, movement.maxSpeed, tickRate);
  const doubleJumpTicks = simulateDoubleJumpTicks(jump, movement.maxSpeed, tickRate);

  const hits: AttackHitEnvelope[] = attack.combo.map((hit, index) => {
    const envelope = sweptArcEnvelope(hit.arc, attack.gripOffsetY);
    return {
      chain: index,
      nearX: envelope.nearX,
      farX: envelope.farX,
      topY: envelope.topY,
      bottomY: envelope.bottomY,
    };
  });

  const attackReference: AttackReference = {
    chainCount: Math.min(attack.maxChain, hits.length),
    hits,
    maxReach: Math.max(...hits.map((hit) => hit.farX)),
    minReach: Math.min(...hits.map((hit) => hit.nearX)),
    bandHeight: Math.max(...hits.map((hit) => hit.bottomY - hit.topY)),
  };

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
    attack: attackReference,
    mapEnvelopes: {
      maxStepUp: doubleJumpTicks.apexHeight,
      maxGapWidth: doubleJumpTicks.horizontalReach,
      maxAttackGap: attackReference.maxReach,
      attackBandHeight: attackReference.bandHeight,
    },
  };
}

export function attackEnvelopeForChain(
  attack: AttackReference,
  chain: number,
  facing: -1 | 1,
): AttackBoxOffsets {
  if (attack.hits.length === 0) {
    return { x1: 0, x2: 0, y1: 0, y2: 0 };
  }
  const index = Math.min(Math.max(Math.floor(chain), 0), attack.hits.length - 1);
  const hit = attack.hits[index];
  return facing >= 0
    ? { x1: hit.nearX, x2: hit.farX, y1: hit.topY, y2: hit.bottomY }
    : { x1: -hit.farX, x2: -hit.nearX, y1: hit.topY, y2: hit.bottomY };
}
