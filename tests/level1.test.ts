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

  it('resets the scene and notifies view without page reload', () => {
    const world = new World();
    world.step(['jump']);
    world.step(['move-right']);
    assert.equal(world.consumeResetNotice(), false);

    world.reset();
    assert.equal(world.consumeResetNotice(), true, 'emits reset notice so scene re-renders fresh platforms and views');
    assert.equal(world.consumeResetNotice(), false, 'notice consumed');
  });

  it('spawns additional enemies dynamically on demand for testing', () => {
    const world = new World();
    world.step(['jump']);
    const initialCount = world.snapshot().entities.length;

    const leg = world.spawnEnemy('legionnaire', 250, -1);
    assert.equal(leg.kind, 'legionnaire');
    assert.equal(leg.grounded, true);
    assert.equal(leg.aiState, 'approach');
    assert.equal(world.snapshot().entities.length, initialCount + 1);

    const archer = world.spawnEnemy('archer', 320, -1);
    assert.equal(archer.kind, 'archer');
    assert.equal(archer.grounded, true);
    assert.equal(archer.aiState, 'idle');
    assert.equal(world.snapshot().entities.length, initialCount + 2);
  });
});
