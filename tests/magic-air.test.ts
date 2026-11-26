import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { CONFIG } from '../src/config';
import type { EntityState } from '../src/sim/types';
import { World } from '../src/sim/world';

function setup(): { world: World; player: EntityState } {
  const world = new World();
  world.loadScenario('movement');
  const player = world.peekEntity('player') as EntityState | undefined;
  assert.ok(player);
  return { world, player };
}

describe('airborne Poseidon’s Rage', () => {
  it('holds the player at the casting height until the spell ends, then falls', () => {
    const { world, player } = setup();
    world.step(['jump']);
    world.step([]);
    world.step(['magic']);
    assert.equal(player.magicPhase, 'startup');
    const height = player.y;
    const phases = new Set<string>();
    for (let i = 0; i < 100 && player.magicPhase !== 'none'; i += 1) {
      phases.add(player.magicPhase);
      assert.equal(player.y, height, 'height must remain fixed throughout the cast');
      assert.equal(player.vy, 0);
      assert.equal(player.grounded, false);
      world.step([]);
    }
    assert.deepEqual([...phases], ['startup', 'active', 'recovery']);
    assert.equal(player.magicPhase, 'none');
    assert.ok(player.y > height, 'gravity resumes when the cast finishes');
    assert.equal(player.jumpsUsed, CONFIG.player.vertical.maxJumps);
  });

  it('allows another airborne cast while falling if mana remains', () => {
    const { world, player } = setup();
    const cost = CONFIG.player.magic.poseidonsRage.cost;
    const initialMp = player.mp;
    world.step(['jump']);
    world.step([]);
    world.step(['magic']);
    for (let i = 0; i < 100 && player.magicPhase !== 'none'; i += 1) world.step([]);
    assert.equal(player.magicPhase, 'none');
    assert.equal(player.grounded, false);
    world.step([]);
    assert.ok(player.vy > 0, 'the player is falling between casts');
    world.step(['magic']);
    assert.equal(player.magicPhase, 'startup');
    assert.equal(player.mp, initialMp - 2 * cost);
    assert.equal(player.jumpsUsed, CONFIG.player.vertical.maxJumps);
    const secondHeight = player.y;
    for (let i = 0; i < 10; i += 1) {
      world.step([]);
      assert.equal(player.y, secondHeight, 'the second cast suspends at its own height');
      assert.equal(player.grounded, false);
    }
  });

  it('casts in the air and prevents another jump until landing', () => {
    const { world, player } = setup();
    world.step(['jump']);
    world.step([]);
    assert.equal(player.grounded, false);
    assert.equal(player.jumpsUsed, 1);
    player.coyoteTicks = 4;
    const mp = player.mp;
    world.step(['magic']);
    assert.equal(player.magicPhase, 'startup');
    assert.equal(player.mp, mp - CONFIG.player.magic.poseidonsRage.cost);
    assert.equal(player.jumpsUsed, CONFIG.player.vertical.maxJumps);
    assert.equal(player.coyoteTicks, 0);

    // Keep the character airborne until the cast completes to exercise the
    // post-cast window independently of the normal height of this scenario.
    for (let i = 0; i < 90 && player.magicPhase !== 'none'; i += 1) {
      player.y = 100;
      player.vy = 0;
      player.grounded = false;
      world.step([]);
    }
    assert.equal(player.magicPhase, 'none');
    assert.equal(player.grounded, false);
    const y = player.y;
    world.step(['jump']);
    assert.ok(player.y >= y, 'a jump after casting must not lift the airborne player');
    assert.equal(player.jumpsUsed, CONFIG.player.vertical.maxJumps);

    for (let i = 0; i < 120 && !player.grounded; i += 1) world.step([]);
    assert.equal(player.grounded, true);
    assert.equal(player.jumpsUsed, 0);
    world.step(['jump']);
    assert.equal(player.grounded, false, 'jumping is restored after landing');
    assert.ok(player.vy < 0);
  });

  it('preserves the normal double jump when an airborne cast is rejected for lack of mana', () => {
    const { world, player } = setup();
    player.mp = 0;
    world.step(['jump']);
    world.step([]);
    world.step(['magic']);
    assert.equal(player.magicPhase, 'none');
    assert.equal(player.mp, 0);
    assert.equal(player.jumpsUsed, 1);
    world.step(['jump']);
    assert.equal(player.jumpsUsed, 2);
    assert.ok(player.vy < 0);
  });

  it('keeps casting from the ground and paying its original cost', () => {
    const { world, player } = setup();
    const mp = player.mp;
    world.step(['magic']);
    assert.equal(player.magicPhase, 'startup');
    assert.equal(player.mp, mp - CONFIG.player.magic.poseidonsRage.cost);
    assert.equal(player.grounded, true);
  });
});
