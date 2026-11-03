import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { CONFIG, ROLL_INVUL_TICKS, ROLL_TICKS, TICK_RATE } from '../src/config';
import type { EntityState, GameAction } from '../src/sim/types';
import { World } from '../src/sim/world';

const DT = 1 / TICK_RATE;

function playingWorld(): World {
  const world = new World();
  world.loadScenario('movement');
  world.step(['jump']);
  for (let i = 0; i < 120; i += 1) world.step([]);
  return world;
}

function player(world: World): EntityState {
  const found = world.snapshot().entities.find((e) => e.kind === 'player');
  assert.ok(found);
  return found;
}

function hold(world: World, ticks: number, actions: GameAction[]): void {
  for (let i = 0; i < ticks; i += 1) world.step(actions);
}

describe('roll', () => {
  it('rolls forward a fixed distance, then hands control back at rest', () => {
    const world = playingWorld();
    const start = player(world).x;
    world.step(['dodge']);
    assert.notEqual(player(world).rollPhase, 'none');
    hold(world, ROLL_TICKS, []);
    const kratos = player(world);
    assert.equal(kratos.rollPhase, 'none');
    assert.equal(kratos.vx, 0);
    const expected = CONFIG.player.dodge.rollSpeed * DT * (ROLL_TICKS - 1);
    assert.ok(Math.abs(kratos.x - start - expected) < 3, `rolled ${kratos.x - start} px, expected ~${expected}`);
  });

  it('rolls toward the held direction, even against the facing', () => {
    const world = playingWorld();
    assert.equal(player(world).facing, 1);
    const start = player(world).x;
    world.step(['move-left', 'dodge']);
    hold(world, ROLL_TICKS, ['move-left']);
    const kratos = player(world);
    assert.ok(kratos.x < start - 40, `rolled to ${kratos.x} from ${start}`);
    assert.equal(kratos.facing, -1);
  });

  it('is invulnerable for ROLL_INVUL_TICKS, not for the whole roll', () => {
    const world = playingWorld();
    world.step(['dodge']);
    assert.ok(player(world).invulTicks > 0);
    hold(world, ROLL_INVUL_TICKS, []);
    const kratos = player(world);
    assert.equal(kratos.invulTicks, 0);
    assert.notEqual(kratos.rollPhase, 'none', 'still rolling after the i-frames');
  });

  it('cannot start in the air', () => {
    const world = playingWorld();
    world.step(['jump']);
    hold(world, 5, []);
    world.step(['dodge']);
    assert.equal(player(world).rollPhase, 'none');
  });

  it('holding the dodge key does not chain rolls', () => {
    const world = playingWorld();
    hold(world, ROLL_TICKS + 10, ['dodge']);
    assert.equal(player(world).rollPhase, 'none');
  });

  it('buffers a light attack during the roll and starts it when the roll ends', () => {
    const world = playingWorld();
    world.step(['dodge']);
    world.step(['light-attack']);
    assert.equal(world.snapshot().strike, undefined);
    hold(world, ROLL_TICKS, []);
    assert.equal(world.snapshot().strike?.id, 'square1');
    assert.equal(player(world).rollPhase, 'none');
  });

  it('buffers a heavy attack during the roll without creating a special chain', () => {
    const world = playingWorld();
    world.step(['dodge']);
    world.step(['heavy-attack']);
    hold(world, ROLL_TICKS, []);
    assert.equal(world.snapshot().strike?.id, 'triangle');
  });
});
