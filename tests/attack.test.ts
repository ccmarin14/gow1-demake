import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { CONFIG } from '../src/config';
import type { EntityState, GameAction } from '../src/sim/types';
import { World } from '../src/sim/world';

/** GoW 1 Blades of Chaos, level 1: the basic Square strike (`J`), one hit. */
const LIGHT = CONFIG.player.attack.moves.light_1;

function playingWorld(scenario = 'movement'): World {
  const world = new World();
  world.loadScenario(scenario);
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

describe('light attack (Square)', () => {
  it('runs startup, active and recovery once, then returns to neutral', () => {
    const world = playingWorld();
    world.step(['light-attack']);
    assert.equal(player(world).attackMove, 'light_1');
    assert.equal(player(world).attackPhase, 'startup');
    hold(world, LIGHT.startup, []);
    assert.equal(player(world).attackPhase, 'active');
    hold(world, LIGHT.active, []);
    assert.equal(player(world).attackPhase, 'recovery');
    hold(world, LIGHT.recovery, []);
    assert.equal(player(world).attackPhase, 'none');
    assert.equal(player(world).attackMove, 'none');
  });

  it('is the same strike while running, not a dash attack', () => {
    const world = playingWorld();
    hold(world, 60, ['move-right']);
    assert.ok(Math.abs(player(world).vx) >= 110, 'running at full speed');
    world.step(['move-right', 'light-attack']);
    assert.equal(player(world).attackMove, 'light_1');
  });

  it('does nothing in the air yet', () => {
    const world = playingWorld();
    world.step(['jump']);
    hold(world, 5, []);
    assert.equal(player(world).grounded, false);
    world.step(['light-attack']);
    assert.equal(player(world).attackPhase, 'none');
  });

  it('heavy and grab buttons start no move yet', () => {
    const world = playingWorld();
    world.step(['heavy-attack']);
    world.step(['grab']);
    assert.equal(player(world).attackPhase, 'none');
  });

  it('a second Square press does not chain into another hit yet', () => {
    const world = playingWorld();
    world.step(['light-attack']);
    hold(world, LIGHT.startup + 1, []);
    world.step(['light-attack']);
    assert.equal(player(world).attackMove, 'light_1');
  });

  it('damages a target within reach exactly once', () => {
    const world = playingWorld('legionnaire');
    const target = () => world.snapshot().entities.find((e) => e.kind === 'legionnaire');
    const before = target()?.hp ?? 0;
    world.step(['light-attack']);
    hold(world, LIGHT.startup + LIGHT.active + LIGHT.hitstop + 2, []);
    assert.equal(before - (target()?.hp ?? 0), LIGHT.damage);
  });
});
