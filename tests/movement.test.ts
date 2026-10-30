import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { CONFIG, TICK_RATE } from '../src/config';
import { stepHorizontal, type MovementParams } from '../src/sim/movement';
import type { EntityState } from '../src/sim/types';
import { World } from '../src/sim/world';

const DT = 1 / TICK_RATE;
const P = CONFIG.player;
const OPEN: MovementParams = { ...P, minX: 0, maxX: 100_000 };

function body(overrides: Partial<EntityState> = {}): EntityState {
  return { x: 500, vx: 0, facing: 1, grounded: true, skidTicks: 0, ...overrides } as EntityState;
}

function ticksToReach(entity: EntityState, left: boolean, right: boolean, done: (e: EntityState) => boolean): number {
  for (let tick = 1; tick <= 600; tick += 1) {
    stepHorizontal(entity, left, right, DT, OPEN);
    if (done(entity)) return tick;
  }
  return Infinity;
}

describe('ground movement', () => {
  it('reaches top speed from rest in maxSpeed / accel and never exceeds it', () => {
    const kratos = body();
    const expected = Math.ceil(P.maxSpeed / (P.accel * DT));
    const ticks = ticksToReach(kratos, false, true, (e) => e.vx >= P.maxSpeed);
    assert.equal(ticks, expected);
    for (let i = 0; i < 30; i += 1) stepHorizontal(kratos, false, true, DT, OPEN);
    assert.equal(kratos.vx, P.maxSpeed);
    assert.equal(kratos.facing, 1);
  });

  it('stops from top speed in maxSpeed / brake when the input is released', () => {
    const kratos = body({ vx: P.maxSpeed });
    const ticks = ticksToReach(kratos, false, false, (e) => e.vx === 0);
    assert.equal(ticks, Math.ceil(P.maxSpeed / (P.brake * DT)));
    assert.equal(kratos.facing, 1);
  });

  it('skids on a fast turnaround: keeps facing until the slide ends, then runs the other way', () => {
    const kratos = body({ vx: P.maxSpeed });
    stepHorizontal(kratos, true, false, DT, OPEN);
    assert.ok(kratos.skidTicks > 0, 'a fast reversal starts a skid');
    assert.equal(kratos.facing, 1, 'facing holds during the skid');
    const ticks = ticksToReach(kratos, true, false, (e) => e.vx < 0);
    assert.ok(ticks <= P.skid.ticks, `reversed after ${ticks} ticks`);
    assert.equal(kratos.facing, -1);
    assert.equal(kratos.skidTicks, 0);
  });

  it('turns at once without skidding below the skid speed', () => {
    const kratos = body({ vx: P.maxSpeed * P.skid.minSpeedRatio * 0.5 });
    stepHorizontal(kratos, true, false, DT, OPEN);
    assert.equal(kratos.skidTicks, 0);
    assert.equal(kratos.facing, -1);
  });

  it('cancels the skid when the input returns to the facing direction', () => {
    const kratos = body({ vx: P.maxSpeed });
    stepHorizontal(kratos, true, false, DT, OPEN);
    stepHorizontal(kratos, false, true, DT, OPEN);
    assert.equal(kratos.skidTicks, 0);
    assert.equal(kratos.facing, 1);
    assert.ok(kratos.vx > 0);
  });

  it('holding both directions brakes like no input', () => {
    const both = body({ vx: P.maxSpeed });
    const none = body({ vx: P.maxSpeed });
    stepHorizontal(both, true, true, DT, OPEN);
    stepHorizontal(none, false, false, DT, OPEN);
    assert.equal(both.vx, none.vx);
  });
});

describe('air movement', () => {
  it('keeps most of its momentum when the input is released in the air', () => {
    const kratos = body({ vx: P.maxSpeed, grounded: false });
    for (let i = 0; i < 10; i += 1) stepHorizontal(kratos, false, false, DT, OPEN);
    const expected = Math.max(0, P.maxSpeed - P.airControl.brake * DT * 10);
    assert.ok(Math.abs(kratos.vx - expected) < 1e-9, `vx ${kratos.vx}, expected ${expected}`);
    assert.ok(kratos.vx > P.maxSpeed / 2, 'a jump keeps carrying forward');
  });

  it('reverses more slowly in the air than on the ground, and never skids', () => {
    const ground = body({ vx: P.maxSpeed });
    const air = body({ vx: P.maxSpeed, grounded: false });
    const groundTicks = ticksToReach(ground, true, false, (e) => e.vx <= 0);
    const airTicks = ticksToReach(air, true, false, (e) => e.vx <= 0);
    assert.ok(airTicks > groundTicks, `air ${airTicks} vs ground ${groundTicks}`);
    assert.equal(air.skidTicks, 0);
  });

  it('accelerates from rest more slowly in the air than on the ground', () => {
    const ground = body();
    const air = body({ grounded: false });
    const groundTicks = ticksToReach(ground, false, true, (e) => e.vx >= P.maxSpeed);
    const airTicks = ticksToReach(air, false, true, (e) => e.vx >= P.maxSpeed);
    assert.equal(airTicks, Math.ceil(P.maxSpeed / (P.airControl.accel * DT)));
    assert.ok(airTicks > groundTicks);
  });
});

describe('locks and bounds', () => {
  it('a locked body keeps its velocity and facing', () => {
    const kratos = body({ vx: 90 });
    stepHorizontal(kratos, true, false, DT, OPEN, true);
    assert.equal(kratos.vx, 90);
    assert.equal(kratos.facing, 1);
    assert.equal(kratos.x, 500 + 90 * DT);
  });

  it('clamps at the bounds and stops', () => {
    const kratos = body({ x: 99, vx: P.maxSpeed });
    stepHorizontal(kratos, false, true, DT, { ...OPEN, maxX: 100 });
    assert.equal(kratos.x, 100);
    assert.equal(kratos.vx, 0);
    assert.equal(kratos.skidTicks, 0);
  });
});

describe('world', () => {
  function playingWorld(): World {
    const world = new World();
    world.step(['jump']);
    for (let i = 0; i < 120; i += 1) world.step([]);
    return world;
  }

  function player(world: World): EntityState {
    const found = world.snapshot().entities.find((e) => e.kind === 'player');
    assert.ok(found);
    return found;
  }

  it('runs right at top speed on the level floor', () => {
    const world = playingWorld();
    const start = player(world).x;
    for (let i = 0; i < 60; i += 1) world.step(['move-right']);
    const kratos = player(world);
    assert.equal(kratos.vx, P.maxSpeed);
    assert.ok(kratos.grounded);
    const accelTicks = Math.ceil(P.maxSpeed / (P.accel * DT));
    const lower = start + P.maxSpeed * DT * (60 - accelTicks);
    assert.ok(kratos.x > lower && kratos.x <= start + P.maxSpeed, `moved to ${kratos.x}`);
  });

  it('stops at the left edge of the level, keeping the body on the map', () => {
    const world = playingWorld();
    for (let i = 0; i < 600; i += 1) world.step(['move-left']);
    const kratos = player(world);
    assert.equal(kratos.x, P.bounds.marginX);
    assert.equal(kratos.vx, 0);
  });
});
