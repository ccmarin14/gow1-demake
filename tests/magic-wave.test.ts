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

  it('shocks the same enemy every hitIntervalTicks while it stays inside the wave', () => {
    const { world, player } = setup();
    const spell = CONFIG.player.magic.poseidonsRage;
    const centered = world.spawnEnemy('legionnaire', player.x);
    const targets = [centered];
    stepMagic(player, true, targets);
    for (let i = 0; i < 11; i += 1) stepMagic(player, false, targets);

    const hitTicks: number[] = [];
    for (let tick = 0; tick < spell.activeTicks; tick += 1) {
      if (stepMagic(player, false, targets).hitTargets.includes(centered.id)) hitTicks.push(tick);
    }

    const expectedHits = Math.ceil(spell.activeTicks / spell.hitIntervalTicks);
    assert.equal(hitTicks.length, expectedHits, 'a centered enemy takes every shock of the wave');
    for (let i = 1; i < hitTicks.length; i += 1) {
      assert.equal(
        hitTicks[i] - hitTicks[i - 1],
        spell.hitIntervalTicks,
        'the shocks are evenly spaced',
      );
    }
    assert.equal(centered.hp, centered.maxHp - expectedHits * spell.damagePerHit);
    assert.ok(centered.hp > 0, 'a level-1 cast leaves the legionnaire alive, as in the original');
  });

  it('shocks fewer times the farther the enemy stands, because the front arrives later', () => {
    const { player, near, far } = setup();
    const targets = [near, far];
    const counts = new Map<string, number>([[near.id, 0], [far.id, 0]]);
    stepMagic(player, true, targets);
    for (let i = 0; i < 11; i += 1) stepMagic(player, false, targets);
    for (let tick = 0; tick < CONFIG.player.magic.poseidonsRage.activeTicks; tick += 1) {
      for (const id of stepMagic(player, false, targets).hitTargets) {
        counts.set(id, (counts.get(id) ?? 0) + 1);
      }
    }
    // The front reaches 20 px at active tick 12 and 80 px at tick 49, so the
    // 4-tick cadence fits 11 shocks in the first case and 2 in the second.
    assert.equal(counts.get(near.id), 11);
    assert.equal(counts.get(far.id), 2);
  });

  it('stops shocking an enemy as soon as it dies', () => {
    const { world, player } = setup();
    const spell = CONFIG.player.magic.poseidonsRage;
    const soldier = world.spawnEnemy('legionnaire', player.x);
    soldier.hp = 10;
    const targets = [soldier];
    stepMagic(player, true, targets);
    for (let i = 0; i < 11; i += 1) stepMagic(player, false, targets);

    let hits = 0;
    for (let tick = 0; tick < spell.activeTicks; tick += 1) {
      if (stepMagic(player, false, targets).hitTargets.includes(soldier.id)) hits += 1;
    }
    assert.equal(soldier.hp, 0);
    assert.equal(soldier.aiState, 'death');
    assert.equal(hits, Math.ceil(10 / spell.damagePerHit), 'no shock lands after the death');
  });

  it('renews the stun on every shock, so the soldier stays locked for the whole spell', () => {
    const world = new World();
    world.loadScenario('movement');
    const player = world.snapshot().entities.find((e) => e.kind === 'player');
    assert.ok(player);
    const soldier = world.spawnEnemy('legionnaire', player.x + 20);
    const startX = soldier.x;

    world.step(['magic']);
    let struck = false;
    for (let tick = 0; tick < 84; tick += 1) {
      world.step([]);
      const current = world.snapshot().entities.find((e) => e.id === soldier.id);
      assert.ok(current);
      if (current.hp < current.maxHp) struck = true;
      if (!struck) continue;
      assert.equal(current.aiState, 'hitstun', `the soldier must stay stunned (tick ${tick})`);
      assert.equal(current.x, startX, `the soldier must not advance (tick ${tick})`);
    }
    assert.ok(struck, 'the wave must reach the soldier during the spell');
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
