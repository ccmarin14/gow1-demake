import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { CONFIG } from '../src/config';
import type { EntityState, GameAction, SimulationSnapshot } from '../src/sim/types';
import { World } from '../src/sim/world';

function playingWorld(scenario = 'movement'): World {
  const world = new World();
  world.loadScenario(scenario);
  world.step(['jump']);
  for (let i = 0; i < 120; i += 1) world.step([]);
  return world;
}

function player(snapshot: SimulationSnapshot): EntityState {
  const found = snapshot.entities.find((e) => e.kind === 'player');
  assert.ok(found);
  return found;
}

function hold(world: World, ticks: number, actions: GameAction[]): void {
  for (let i = 0; i < ticks; i += 1) world.step(actions);
}

/** Jumps and waits until Kratos is in the air, rising. */
function inTheAir(world: World): void {
  world.step(['jump']);
  hold(world, 12, []);
  assert.equal(player(world.snapshot()).grounded, false);
}

function foeWorld(): World {
  const world = new World();
  world.loadScenario('legionnaire');
  return world;
}

describe('jumping around strikes', () => {
  it('an attack in the first jump spends the double jump: no jumping again until he lands', () => {
    const world = playingWorld();
    inTheAir(world);
    assert.equal(player(world.snapshot()).jumpsUsed, 1);
    world.step(['light-attack']);
    assert.equal(world.snapshot().strike?.id, 'air1');
    assert.equal(player(world.snapshot()).jumpsUsed, 2, 'the attack used the double jump');
    world.step(['jump']);
    assert.equal(world.snapshot().strike?.id, 'air1', 'a jump does not cancel the air strike');
    for (let i = 0; i < 80 && world.snapshot().strike; i += 1) world.step([]);
    const vy = player(world.snapshot()).vy;
    world.step(['jump']);
    assert.ok(player(world.snapshot()).vy > vy - 100, `no new jump after the strike (vy ${vy.toFixed(0)} -> ${player(world.snapshot()).vy.toFixed(0)})`);
    for (let i = 0; i < 200 && !player(world.snapshot()).grounded; i += 1) world.step([]);
    assert.equal(player(world.snapshot()).grounded, true);
    world.step(['jump']);
    hold(world, 2, []);
    assert.ok(player(world.snapshot()).vy < -100, 'jumps again after landing');
  });

  describe('combat feel constants', () => {
    it('keeps combo buffering and direction timing in one configuration table', () => {
      assert.deepEqual(
        {
          turn: CONFIG.combat.feel.comboTurnMinTicks,
          grace: CONFIG.combat.feel.comboGraceTicks,
          jump: CONFIG.combat.feel.jumpQueueTicks,
        },
        { turn: 4, grace: 16, jump: 10 },
      );
    });

    it('keeps heavy impact and air-hang rules in the same table', () => {
      assert.deepEqual(
        {
          heavyDamage: CONFIG.combat.feel.heavyDamage,
          extraHitstop: CONFIG.combat.feel.heavyExtraHitstop,
          knockback: [CONFIG.combat.feel.knockbackLight, CONFIG.combat.feel.knockbackHeavy],
          gravity: CONFIG.combat.feel.graceAirGravity,
        },
        { heavyDamage: 20, extraHitstop: 3, knockback: [90, 220], gravity: 0.5 },
      );
      assert.deepEqual([...CONFIG.combat.feel.hoverStrikes], ['air1', 'air2', 'air3', 'airTriangle']);
    });
  });

  it('a jump pressed during a ground strike waits for it to end instead of being lost', () => {
    const world = playingWorld();
    world.step(['light-attack']);
    hold(world, 4, []);
    world.step(['jump']);
    assert.equal(player(world.snapshot()).grounded, true, 'not jumping yet');
    let jumped = false;
    for (let i = 0; i < 80 && !jumped; i += 1) {
      world.step([]);
      jumped = !player(world.snapshot()).grounded;
    }
    assert.ok(jumped, 'jumped once the strike ended');
    assert.equal(world.snapshot().strike, undefined);
  });
});

describe('a combo that is easy to carry on', () => {
  it('remembers a triangle pressed during the hit pause', () => {
    const world = foeWorld();
    world.step(['light-attack']);
    let froze = false;
    for (let i = 0; i < 60 && !froze; i += 1) {
      world.step([]);
      froze = world.snapshot().hitstopTicks > 0;
    }
    assert.ok(froze, 'square 1 hit the legionnaire');
    world.step(['heavy-attack']);
    assert.equal(world.snapshot().strike?.queued, true);
    assert.equal(world.snapshot().strike?.queuedHeavy, true);
  });
});

describe('weight of a blow', () => {
  it('a heavy blow holds the world longer and throws the legionnaire back, a light one less', () => {
    const light = foeWorld();
    light.step(['light-attack']);
    let lightStop = 0;
    for (let i = 0; i < 60 && lightStop === 0; i += 1) {
      light.step([]);
      lightStop = light.snapshot().hitstopTicks;
    }
    const heavy = foeWorld();
    heavy.step(['heavy-attack']);
    let heavyStop = 0;
    for (let i = 0; i < 100 && heavyStop === 0; i += 1) {
      heavy.step([]);
      heavyStop = heavy.snapshot().hitstopTicks;
    }
    assert.ok(lightStop > 0 && heavyStop > lightStop, `hit pause: light ${lightStop}, heavy ${heavyStop}`);
    const foeAtHit = heavy.snapshot().entities.find((e) => e.kind === 'legionnaire')!.x;
    hold(heavy, heavyStop + 30, []);
    const foe = heavy.snapshot().entities.find((e) => e.kind === 'legionnaire')!;
    assert.ok(foe.x - foeAtHit > 15, `thrown ${(foe.x - foeAtHit).toFixed(1)} px away from Kratos`);
  });
});

describe('a quick tap is not lost', () => {
  it('actions read in a frame that ran no tick apply on the next tick', async () => {
    const { Simulation } = await import('../src/sim/engine');
    const sim = new Simulation();
    sim.world.loadScenario('movement');
    sim.world.step(['jump']);
    for (let i = 0; i < 60; i += 1) sim.world.step([]);
    assert.equal(sim.advance(10, ['light-attack']), 0, 'a short frame runs no tick');
    assert.equal(sim.world.snapshot().strike, undefined);
    assert.equal(sim.advance(10, []), 1);
    assert.equal(sim.world.snapshot().strike?.id, 'square1', 'the tap made in the short frame started square 1');
  });
});

describe('hanging in the air', () => {
  /** Height lost over `ticks` ticks, starting a fall at the apex with or without an air strike. */
  function dropOver(ticks: number, strikeButton: GameAction | null): number {
    const world = playingWorld();
    world.step(['jump']);
    // Let him fall for a while so he is moving fast downward.
    for (let i = 0; i < 60 && player(world.snapshot()).vy < 220; i += 1) world.step([]);
    assert.ok(!player(world.snapshot()).grounded && player(world.snapshot()).vy >= 220, 'falling fast');
    const y0 = player(world.snapshot()).y;
    if (strikeButton) world.step([strikeButton]);
    else world.step([]);
    for (let i = 1; i < ticks && !player(world.snapshot()).grounded; i += 1) world.step([]);
    return player(world.snapshot()).y - y0;
  }

  it('an air lash cuts a fast fall to a crawl: far less height is lost than falling freely', () => {
    const free = dropOver(10, null);
    const lashing = dropOver(10, 'light-attack');
    assert.ok(free > 25, `free fall lost ${free.toFixed(0)} px`);
    assert.ok(lashing < free / 2, `lashing lost ${lashing.toFixed(0)} px against ${free.toFixed(0)} px`);
  });

  it('keeps floating through the three lashes of the air combo', () => {
    const world = playingWorld();
    inTheAir(world);
    const y0 = player(world.snapshot()).y;
    world.step(['light-attack']);
    let lash = 0;
    for (let i = 0; i < 90; i += 1) {
      world.step(i % 9 === 4 ? ['light-attack'] : []);
      const id = world.snapshot().strike?.id;
      if (id === 'air3') lash = 3;
      if (lash === 3 && !world.snapshot().strike) break;
      if (player(world.snapshot()).grounded) break;
    }
    assert.equal(lash, 3, 'reached the third lash');
    assert.ok(player(world.snapshot()).y - y0 < 45, `lost ${(player(world.snapshot()).y - y0).toFixed(0)} px over the whole air combo`);
  });
});

describe('the three air lashes', () => {
  for (const spacing of [8, 12, 16, 20]) {
    it(`reach the third lash tapping square every ${spacing} ticks`, () => {
      const world = playingWorld();
      inTheAir(world);
      const seen = new Set<string>();
      for (let i = 0; i < 120 && !player(world.snapshot()).grounded; i += 1) {
        world.step(i % spacing === 0 ? ['light-attack'] : []);
        const id = world.snapshot().strike?.id;
        if (id) seen.add(id);
      }
      assert.ok(seen.has('air1') && seen.has('air2') && seen.has('air3'), `lashes seen: ${[...seen].join(', ')}`);
    });
  }
});
