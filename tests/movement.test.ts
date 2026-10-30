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
  return { x: 500, vx: 0, facing: 1, grounded: true, ...overrides } as EntityState;
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

  it('turns around at once with no skid: faces the new way, brakes, then runs back', () => {
    const kratos = body({ vx: P.maxSpeed });
    stepHorizontal(kratos, true, false, DT, OPEN);
    assert.equal(kratos.facing, -1, 'faces the new direction on the first tick');
    assert.ok(!('skidTicks' in kratos), 'there is no skid state');
    const stop = ticksToReach(kratos, true, false, (e) => e.vx <= 0);
    assert.ok(stop <= Math.ceil(P.maxSpeed / (P.brake * DT)), `stopped after ${stop + 1} ticks`);
    const back = ticksToReach(kratos, true, false, (e) => e.vx === -P.maxSpeed);
    assert.ok(back <= Math.ceil(P.maxSpeed / (P.accel * DT)) + 1, `top speed back after ${back} ticks`);
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

  it('reverses more slowly in the air than on the ground', () => {
    const ground = body({ vx: P.maxSpeed });
    const air = body({ vx: P.maxSpeed, grounded: false });
    const groundTicks = ticksToReach(ground, true, false, (e) => e.vx <= 0);
    const airTicks = ticksToReach(air, true, false, (e) => e.vx <= 0);
    assert.ok(airTicks > groundTicks, `air ${airTicks} vs ground ${groundTicks}`);
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

  it('a full-speed turnaround faces the new way on the first tick (no skid)', () => {
    const world = playingWorld();
    for (let i = 0; i < 30; i += 1) world.step(['move-right']);
    world.step(['move-left']);
    const kratos = player(world);
    assert.equal(kratos.facing, -1);
    assert.ok(!('skidTicks' in kratos), 'there is no skid state');
  });

  it('stops at the left edge of the level, keeping the body on the map', () => {
    const world = playingWorld();
    for (let i = 0; i < 600; i += 1) world.step(['move-left']);
    const kratos = player(world);
    assert.equal(kratos.x, P.bounds.marginX);
    assert.equal(kratos.vx, 0);
  });
});
