import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { CONFIG } from '../src/config';
import { stepLegionnaire } from '../src/sim/legionnaire';
import { stepMagic } from '../src/sim/magic';
import type { EntityState } from '../src/sim/types';
import { World } from '../src/sim/world';

function setup(): { world: World; player: EntityState; near: EntityState; far: EntityState } {
  const world = new World();
  world.loadScenario('movement');
  const found = world.snapshot().entities.find((e) => e.kind === 'player');
  assert.ok(found);
  const player: EntityState = { ...found };
  const near = world.spawnEnemy('legionnaire', player.x + 20);
  const far = world.spawnEnemy('legionnaire', player.x + 80);
  return { world, player, near, far };
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

  it('keeps the damage front inside the drawn ground-wave band', () => {
    const { world, player } = setup();
    const elevated = world.spawnEnemy('legionnaire', player.x + 30);
    elevated.y = player.y - 62;
    const targets = [elevated];
    stepMagic(player, true, targets);
    for (let i = 0; i < 11; i += 1) stepMagic(player, false, targets);
    for (let tick = 0; tick < CONFIG.player.magic.poseidonsRage.activeTicks; tick += 1) {
      assert.ok(
        !stepMagic(player, false, targets).hitTargets.includes(elevated.id),
        `an enemy 62 px above the deck must stay outside the drawn wave (tick ${tick})`,
      );
    }
  });

  it('keeps the horizontal damage reach at 90 px', () => {
    const { world, player } = setup();
    const inside = world.spawnEnemy('legionnaire', player.x + 89);
    const outside = world.spawnEnemy('legionnaire', player.x + 92);
    const targets = [inside, outside];
    stepMagic(player, true, targets);
    for (let i = 0; i < 11; i += 1) stepMagic(player, false, targets);
    const hits = new Set<string>();
    for (let tick = 0; tick < CONFIG.player.magic.poseidonsRage.activeTicks; tick += 1) {
      for (const id of stepMagic(player, false, targets).hitTargets) hits.add(id);
    }
    assert.ok(hits.has(inside.id), 'an enemy at 89 px is reached by the 90 px wave');
    assert.ok(!hits.has(outside.id), 'an enemy at 92 px stays outside the 90 px wave');
  });

  it('immobilizes a hit soldier through the real world tick loop', () => {
    const world = new World();
    world.loadScenario('movement');
    const player = world.snapshot().entities.find((e) => e.kind === 'player');
    assert.ok(player);
    const soldier = world.spawnEnemy('legionnaire', player.x + 20);
    const initialHp = soldier.hp;

    world.step(['magic']);
    let struck: EntityState | undefined;
    for (let i = 0; i < 200 && !struck; i += 1) {
      world.step([]);
      const current = world.snapshot().entities.find((e) => e.id === soldier.id);
      if (current && current.hp < initialHp) struck = current;
    }
    assert.ok(struck, 'the world tick must apply the magic hit');
    assert.equal(struck!.hp, initialHp - CONFIG.player.magic.poseidonsRage.damagePerHit);
    assert.equal(struck!.aiState, 'hitstun');

    for (let i = 0; i < 12; i += 1) world.step([]);
    const after = world.snapshot().entities.find((e) => e.id === soldier.id);
    assert.ok(after);
    assert.equal(after!.x, struck!.x, 'the stunned soldier must not advance');
    assert.equal(after!.aiState, 'hitstun', 'the stun must survive 12 world ticks');
  });

  it('immobilizes a hit soldier for the whole stun window', () => {
    const { world, player } = setup();
    const soldier = world.spawnEnemy('legionnaire', player.x + 20);
    const targets = [soldier];
    stepMagic(player, true, targets);
    for (let i = 0; i < 11; i += 1) stepMagic(player, false, targets);
    let hit = false;
    for (let tick = 0; tick < CONFIG.player.magic.poseidonsRage.activeTicks; tick += 1) {
      if (stepMagic(player, false, targets).hitTargets.includes(soldier.id)) {
        hit = true;
        break;
      }
    }
    assert.ok(hit, 'the wave reaches the soldier');
    assert.equal(soldier.aiState, 'hitstun', 'the hit must interrupt the enemy AI');
    assert.equal(
      soldier.hitstunTicks,
      CONFIG.player.magic.poseidonsRage.stunTicksPerHit,
    );

    const dt = 1 / CONFIG.sim.tickRate;
    const startX = soldier.x;
    for (let i = 0; i < 10; i += 1) {
      stepLegionnaire(soldier, player, [], dt, []);
      if (soldier.hitstunTicks > 0) soldier.hitstunTicks -= 1;
    }
    assert.equal(soldier.x, startX, 'a stunned soldier must not advance');
    assert.equal(soldier.aiState, 'hitstun', 'the stun must last the whole window');
  });
});
