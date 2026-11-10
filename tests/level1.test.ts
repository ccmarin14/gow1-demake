import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { World } from '../src/sim/world';

describe('level1', () => {
  it('starts with Kratos and the legionnaire on the deck: no chests, checkpoints, waves or arena', () => {
    const world = new World();
    world.step(['jump']);
    for (let i = 0; i < 60; i += 1) world.step([]);
    const snapshot = world.snapshot();
    assert.deepEqual(snapshot.entities.map((e) => e.kind), ['player', 'legionnaire']);
    assert.equal(snapshot.chests.length, 0);
    assert.equal(snapshot.checkpoints.length, 0);
    assert.equal(snapshot.wave, undefined);
    assert.equal(snapshot.arena, undefined);
  });

  it('legionnaire moves autonomously towards Kratos on the deck', () => {
    const world = new World();
    world.step(['jump']);
    // Kratos approaches the legionnaire to enter aggro range (160 px)
    for (let i = 0; i < 65; i += 1) world.step(['move-right']);
    const startX = world.snapshot().entities.find((e) => e.kind === 'legionnaire')?.x;
    for (let i = 0; i < 30; i += 1) world.step([]);
    const endX = world.snapshot().entities.find((e) => e.kind === 'legionnaire')?.x;
    assert.ok(startX !== undefined && endX !== undefined);
    assert.ok(endX < startX, `legionnaire moved towards Kratos: start=${startX}, end=${endX}`);
  });
});
