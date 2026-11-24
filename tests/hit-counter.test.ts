import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { CONFIG } from '../src/config';
import { World, orbMultiplierForImpactCount } from '../src/sim/world';

describe('impact and orb multiplier chain', () => {
  it('uses 1, 2, 3 and 4 at 0, 10, 25 and 50 impacts', () => {
    assert.equal(orbMultiplierForImpactCount(0), 1);
    assert.equal(orbMultiplierForImpactCount(9), 1);
    assert.equal(orbMultiplierForImpactCount(10), 2);
    assert.equal(orbMultiplierForImpactCount(24), 2);
    assert.equal(orbMultiplierForImpactCount(25), 3);
    assert.equal(orbMultiplierForImpactCount(49), 3);
    assert.equal(orbMultiplierForImpactCount(50), 4);
  });

  it('resets the chain after two seconds without another impact', () => {
    const world = new World();
    world.loadScenario('legionnaire');
    world.step(['light-attack']);
    for (let i = 0; i < 30 && world.getCombatStats().impactCount === 0; i += 1) {
      world.step([]);
    }
    assert.ok(world.getCombatStats().impactCount > 0, 'a connected strike starts the chain');

    for (let i = 0; i < CONFIG.combat.impactChain.resetTicks + 1; i += 1) {
      world.step([]);
    }
    assert.equal(world.getCombatStats().impactCount, 0);
  });

  it('resets the chain when the player receives damage', () => {
    const world = new World();
    world.loadScenario('legionnaire');
    world.step(['light-attack']);
    for (let i = 0; i < 30 && world.getCombatStats().impactCount === 0; i += 1) {
      world.step([]);
    }
    assert.ok(world.getCombatStats().impactCount > 0);
    for (let i = 0; i < 80 && world.snapshot().strike; i += 1) {
      world.step([]);
    }
    const hpBefore = world.snapshot().entities.find((entity) => entity.kind === 'player')?.hp;
    assert.notEqual(hpBefore, undefined);
    let tookDamage = false;
    for (let i = 0; i < 300; i += 1) {
      world.step([]);
      const hpNow = world.snapshot().entities.find((entity) => entity.kind === 'player')?.hp;
      if (hpNow !== undefined && hpNow < (hpBefore ?? hpNow)) {
        tookDamage = true;
        break;
      }
    }
    assert.ok(tookDamage, 'the legionnaire reaches Kratos and deals damage');
    assert.equal(world.getCombatStats().impactCount, 0);
  });
});
