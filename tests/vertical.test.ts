import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { CONFIG, TICK_RATE } from '../src/config';
import type { Platform } from '../src/sim/scenarios';
import type { EntityState } from '../src/sim/types';
import { stepVertical, type VerticalParams } from '../src/sim/vertical';

const DT = 1 / TICK_RATE;
const V = CONFIG.player.vertical;
const GROUND = CONFIG.map.level1.groundY;
const PARAMS: VerticalParams = {
  gravity: V.gravity,
  jumpSpeed: V.jumpSpeed,
  maxFallSpeed: V.maxFallSpeed,
  coyoteTicks: Math.round((V.coyoteMs * TICK_RATE) / 1000),
  jumpBufferTicks: Math.round((V.jumpBufferMs * TICK_RATE) / 1000),
  maxJumps: V.maxJumps,
  topY: V.topY,
  groundY: GROUND,
};
const FLOOR: Platform = { x1: 0, x2: 1000, yTop: GROUND };
const LEDGE: Platform = { x1: 100, x2: 200, yTop: 200 };

function body(overrides: Partial<EntityState> = {}): EntityState {
  return {
    x: 50,
    y: GROUND,
    vy: 0,
    grounded: true,
    coyoteTicks: 0,
    jumpBufferTicks: 0,
    jumpsUsed: 0,
    landingTicks: 0,
    dropThroughTicks: 0,
    ...overrides,
  } as EntityState;
}

/** Steps with a jump press on the listed ticks (1-based); returns the highest point. */
function run(entity: EntityState, ticks: number, platforms: Platform[], jumpOn: number[] = [], down = false): number {
  let top = entity.y;
  for (let t = 1; t <= ticks; t += 1) {
    stepVertical(entity, PARAMS, DT, jumpOn.includes(t), platforms, false, 1, down);
    top = Math.min(top, entity.y);
  }
  return top;
}

describe('jump', () => {
  it('a ground jump peaks near jumpSpeed^2 / (2 gravity) and lands back on the floor', () => {
    const kratos = body();
    const top = run(kratos, 120, [FLOOR], [1]);
    const expected = (V.jumpSpeed * V.jumpSpeed) / (2 * V.gravity);
    assert.ok(Math.abs(GROUND - top - expected) < 4, `jumped ${GROUND - top} px, expected ~${expected}`);
    assert.equal(kratos.y, GROUND);
    assert.ok(kratos.grounded);
    assert.equal(kratos.jumpsUsed, 0, 'landing restores the jumps');
  });

  it('allows exactly one air jump after a ground jump', () => {
    const kratos = body();
    run(kratos, 20, [FLOOR], [1, 15]);
    assert.equal(kratos.jumpsUsed, 2);
    const vyBefore = kratos.vy;
    run(kratos, 1, [FLOOR], [1]);
    assert.ok(kratos.vy > vyBefore, 'a third press does not jump');
  });

  it('falling off a ledge without jumping leaves one air jump, not two', () => {
    const kratos = body({ y: 200, x: 150 });
    run(kratos, 1, [LEDGE]);
    kratos.x = 250; // walked off the ledge
    run(kratos, PARAMS.coyoteTicks + 2, [LEDGE]);
    assert.equal(kratos.grounded, false);
    run(kratos, 1, [LEDGE], [1]);
    assert.ok(kratos.vy < 0, 'the air jump works');
    const vyAfter = kratos.vy;
    run(kratos, 3, [LEDGE]);
    run(kratos, 1, [LEDGE], [1]);
    assert.ok(kratos.vy > vyAfter, 'no second air jump after falling');
  });

  it('coyote time: jumping just after leaving a ledge is a ground jump', () => {
    const kratos = body({ y: 200, x: 150 });
    run(kratos, 1, [LEDGE]);
    kratos.x = 250;
    run(kratos, PARAMS.coyoteTicks - 1, [LEDGE]);
    run(kratos, 1, [LEDGE], [1]);
    assert.equal(kratos.vy < 0, true);
    assert.equal(kratos.jumpsUsed, 1, 'counted as the ground jump; the air jump is still available');
  });

  it('jump buffer: pressing just before landing jumps on touchdown', () => {
    const kratos = body({ y: GROUND - 2, vy: 300, grounded: false, jumpsUsed: 2 });
    run(kratos, 1, [FLOOR], [1]);
    run(kratos, PARAMS.jumpBufferTicks - 2, [FLOOR]);
    assert.ok(kratos.vy < 0 || kratos.y < GROUND, 'the buffered press fired after landing');
  });

  it('caps the fall speed', () => {
    const kratos = body({ y: 0, grounded: false, jumpsUsed: 2 });
    run(kratos, 120, []);
    assert.equal(kratos.vy, V.maxFallSpeed);
  });
});

describe('platforms', () => {
  it('passes up through a one-way platform and lands on it from above', () => {
    const kratos = body({ x: 150 });
    const top = run(kratos, 200, [FLOOR, { x1: 100, x2: 200, yTop: GROUND - 40 }], [1]);
    assert.ok(top < GROUND - 40, 'jumped through from below');
    assert.equal(kratos.y, GROUND - 40, 'landed on top');
    assert.ok(kratos.grounded);
  });

  it('down + jump drops through a raised platform', () => {
    const kratos = body({ x: 150, y: 200 });
    run(kratos, 1, [FLOOR, LEDGE]);
    run(kratos, 1, [FLOOR, LEDGE], [1], true);
    run(kratos, 120, [FLOOR, LEDGE]);
    assert.equal(kratos.y, GROUND, 'fell to the floor');
  });

  it('down + jump on the floor does not drop through it', () => {
    const kratos = body();
    run(kratos, 1, [FLOOR], [1], true);
    run(kratos, 120, [FLOOR]);
    assert.equal(kratos.y, GROUND);
    assert.ok(kratos.grounded);
  });
});
