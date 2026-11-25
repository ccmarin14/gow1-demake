import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { CONFIG } from '../src/config';
import { stepMagic } from '../src/sim/magic';
import type { EntityState } from '../src/sim/types';
import { World } from '../src/sim/world';

function setup(): { player: EntityState; near: EntityState; far: EntityState } {
  const world = new World();
  world.loadScenario('movement');
  const found = world.snapshot().entities.find((e) => e.kind === 'player');
  assert.ok(found);
  const player: EntityState = { ...found };
  const near = world.spawnEnemy('legionnaire', player.x + 20);
  const far = world.spawnEnemy('legionnaire', player.x + 80);
  return { player, near, far };
}

describe('Poseidon\'s Rage ground wave', () => {
  it('hits a close enemy before a distant one because the wave travels along the ground', () => {
    const { player, near, far } = setup();
    const targets = [near, far];
    stepMagic(player, true, targets);
    for (let i = 0; i < 7; i += 1) stepMagic(player, false, targets);

    let nearTick = -1;
    let farTick = -1;
    for (let tick = 0; tick < CONFIG.player.magic.poseidonsRage.activeTicks; tick += 1) {
      const result = stepMagic(player, false, targets);
      if (nearTick < 0 && result.hitTargets.includes(near.id)) nearTick = tick;
      if (farTick < 0 && result.hitTargets.includes(far.id)) farTick = tick;
    }

    assert.ok(nearTick >= 0, 'the close enemy is reached by the wave');
    assert.ok(farTick >= 0, 'the distant enemy is reached by the wave');
    assert.ok(nearTick < farTick, `wave must reach near (${nearTick}) before far (${farTick})`);
  });

  it('hits each enemy once as the wave passes, not on every fixed cadence', () => {
    const { player, near, far } = setup();
    const targets = [near, far];
    const counts = new Map<string, number>([[near.id, 0], [far.id, 0]]);
    stepMagic(player, true, targets);
    for (let i = 0; i < 7; i += 1) stepMagic(player, false, targets);
    for (let tick = 0; tick < CONFIG.player.magic.poseidonsRage.activeTicks; tick += 1) {
      for (const id of stepMagic(player, false, targets).hitTargets) {
        counts.set(id, (counts.get(id) ?? 0) + 1);
      }
    }
    assert.equal(counts.get(near.id), 1);
    assert.equal(counts.get(far.id), 1);
  });
});
