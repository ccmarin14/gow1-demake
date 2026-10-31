import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { CONFIG } from '../src/config';
import type { EntityState, GameAction } from '../src/sim/types';
import { World } from '../src/sim/world';

/**
 * GoW 1 Blades of Chaos at level 1 (D-35): Square (`J`) and Triangle (`K`)
 * strikes and the combos made of them. Grab (`L`) is not built yet.
 */
const MOVES = CONFIG.player.attack.moves;

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

/** Press once, then wait until the move reaches its active window. */
function pressIntoActive(world: World, action: GameAction, startup: number): void {
  world.step([action]);
  hold(world, startup, []);
}

function airborne(world: World): void {
  world.step(['jump']);
  hold(world, 5, []);
  assert.equal(player(world).grounded, false);
}

describe('Square on the ground', () => {
  it('runs startup, active and recovery once, then returns to neutral', () => {
    const world = playingWorld();
    world.step(['light-attack']);
    assert.equal(player(world).attackMove, 'light_1');
    assert.equal(player(world).attackPhase, 'startup');
    hold(world, MOVES.light_1.startup, []);
    assert.equal(player(world).attackPhase, 'active');
    hold(world, MOVES.light_1.active, []);
    assert.equal(player(world).attackPhase, 'recovery');
    hold(world, MOVES.light_1.recovery, []);
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

  it('chains Square, Square, Square into three hits and stops there', () => {
    const world = playingWorld();
    pressIntoActive(world, 'light-attack', MOVES.light_1.startup);
    world.step(['light-attack']);
    assert.equal(player(world).attackMove, 'light_2');
    hold(world, MOVES.light_2.startup, []);
    world.step(['light-attack']);
    assert.equal(player(world).attackMove, 'light_3');
    hold(world, MOVES.light_3.startup, []);
    world.step(['light-attack']);
    assert.equal(player(world).attackMove, 'light_3', 'no fourth hit');
  });

  it('a press during startup is buffered, not dropped or chained early', () => {
    const world = playingWorld();
    world.step(['light-attack']);
    world.step([]);
    world.step(['light-attack']);
    assert.equal(player(world).attackMove, 'light_1', 'still the first hit');
    hold(world, MOVES.light_1.startup, []);
    assert.equal(player(world).attackMove, 'light_2', 'buffered press chains when the window opens');
  });

  it('damages a target within reach exactly once per hit', () => {
    const world = playingWorld('legionnaire');
    const target = () => world.snapshot().entities.find((e) => e.kind === 'legionnaire');
    const before = target()?.hp ?? 0;
    world.step(['light-attack']);
    hold(world, MOVES.light_1.startup + MOVES.light_1.active + MOVES.light_1.hitstop + 2, []);
    assert.equal(before - (target()?.hp ?? 0), MOVES.light_1.damage);
  });
});

describe('Triangle on the ground', () => {
  it('a tap is the heavy strike, slower than Square', () => {
    const world = playingWorld();
    world.step(['heavy-attack']);
    world.step([]);
    assert.equal(player(world).attackMove, 'heavy');
    assert.ok(MOVES.heavy.startup > MOVES.light_1.startup);
  });

  it('a held Triangle becomes Ascension: Kratos rises with the launch', () => {
    const world = playingWorld();
    hold(world, CONFIG.player.attack.heavyHoldTicks + 1, ['heavy-attack']);
    assert.equal(player(world).attackMove, 'ascension');
    hold(world, MOVES.ascension.startup + 2, ['heavy-attack']);
    assert.equal(player(world).grounded, false, 'Kratos goes up with the enemy');
    assert.ok(player(world).vy < 0);
  });

  it('Ascension launches the target upward', () => {
    const world = playingWorld('legionnaire');
    hold(world, CONFIG.player.attack.heavyHoldTicks + MOVES.ascension.startup + MOVES.ascension.active, ['heavy-attack']);
    const target = world.snapshot().entities.find((e) => e.kind === 'legionnaire');
    assert.ok(target);
    assert.equal(target.grounded, false);
  });

  it('Triangle after Square does not start Spirit or Valor of Hercules (level 3)', () => {
    const world = playingWorld();
    pressIntoActive(world, 'heavy-attack', MOVES.heavy.startup);
    world.step(['heavy-attack']);
    assert.equal(player(world).attackMove, 'heavy', 'no Triangle chain at level 1');
  });
});

describe('Plume of Prometheus (Square, Square, Triangle)', () => {
  it('Triangle as the third input finishes with the Plume', () => {
    const world = playingWorld();
    pressIntoActive(world, 'light-attack', MOVES.light_1.startup);
    world.step(['light-attack']);
    hold(world, MOVES.light_2.startup, []);
    world.step(['heavy-attack']);
    assert.equal(player(world).attackMove, 'plume_of_prometheus');
  });

  it('Triangle after a single Square is not the Plume', () => {
    const world = playingWorld();
    pressIntoActive(world, 'light-attack', MOVES.light_1.startup);
    world.step(['heavy-attack']);
    assert.notEqual(player(world).attackMove, 'plume_of_prometheus');
  });
});

describe('Square and Triangle in the air', () => {
  it('Square in the air chains two hits and Kratos hangs while striking', () => {
    const world = playingWorld();
    airborne(world);
    pressIntoActive(world, 'light-attack', MOVES.air_light_1.startup);
    assert.equal(player(world).attackMove, 'air_light_1');
    const yBefore = player(world).y;
    hold(world, 3, []);
    const sinkWhileStriking = player(world).y - yBefore;
    world.step(['light-attack']);
    assert.equal(player(world).attackMove, 'air_light_2');
    assert.ok(sinkWhileStriking < 6, `sank ${sinkWhileStriking} px in 3 ticks`);
  });

  it('Triangle in the air drives Kratos down to the ground', () => {
    const world = playingWorld();
    airborne(world);
    world.step(['heavy-attack']);
    assert.equal(player(world).attackMove, 'air_heavy');
    hold(world, 60, []);
    assert.equal(player(world).grounded, true);
  });

  it('after Ascension, Square continues the attack in the air', () => {
    const world = playingWorld();
    hold(world, CONFIG.player.attack.heavyHoldTicks + MOVES.ascension.startup + MOVES.ascension.active + 1, ['heavy-attack']);
    assert.equal(player(world).grounded, false);
    world.step(['light-attack']);
    hold(world, 2, []);
    assert.equal(player(world).attackMove, 'air_light_1');
  });
});

describe('not built yet', () => {
  it('the grab button starts no move', () => {
    const world = playingWorld();
    world.step(['grab']);
    assert.equal(player(world).attackPhase, 'none');
  });
});
