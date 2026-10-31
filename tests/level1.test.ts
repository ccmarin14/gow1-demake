import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { World } from '../src/sim/world';

describe('level1', () => {
  it('starts with only Kratos: no enemies, chests, checkpoints, waves or arena', () => {
    const world = new World();
    world.step(['jump']);
    for (let i = 0; i < 60; i += 1) world.step([]);
    const snapshot = world.snapshot();
    assert.deepEqual(snapshot.entities.map((e) => e.kind), ['player']);
    assert.equal(snapshot.chests.length, 0);
    assert.equal(snapshot.checkpoints.length, 0);
    assert.equal(snapshot.wave, undefined);
    assert.equal(snapshot.arena, undefined);
  });

  it('stays empty after running through the whole level', () => {
    const world = new World();
    world.step(['jump']);
    for (let i = 0; i < 900; i += 1) world.step(['move-right']);
    const snapshot = world.snapshot();
    assert.deepEqual(snapshot.entities.map((e) => e.kind), ['player']);
    assert.equal(snapshot.arena, undefined);
    assert.ok(snapshot.entities[0].x > 1000, 'crossed the old arena');
  });
});
