import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { CONFIG } from '../src/config';
import { capturePlayerData } from '../src/sim/checkpoint';
import { DOMAIN_ACTIONS } from '../src/sim/types';
import { World } from '../src/sim/world';

describe('weapon upgrade system removed', () => {
  it('has no upgrade action, level, cost or damage multiplier', () => {
    assert.ok(!(DOMAIN_ACTIONS as readonly string[]).includes('upgrade'));
    assert.ok(!('upgrades' in CONFIG.player.weapon));
    const world = new World();
    const player = world.peekEntity('player');
    assert.ok(player && !('weaponLevel' in player));
    assert.ok(!('weaponLevel' in world.getCombatStats()));
    if (player) assert.ok(!('weaponLevel' in capturePlayerData(player)));
  });

  it('ignores an unknown upgrade input even with enough red orbs', () => {
    const world = new World();
    const player = world.getEntity('player');
    assert.ok(player);
    player.redOrbs = 500;
    world.step(['upgrade' as never]);
    assert.equal(player.redOrbs, 500);
  });
});
