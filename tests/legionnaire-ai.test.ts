import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { CONFIG } from '../src/config';
import { stepLegionnaire } from '../src/sim/legionnaire';
import { legionnaireAt } from '../src/sim/scenarios';
import type { EntityState } from '../src/sim/types';
import { World } from '../src/sim/world';

const AI = CONFIG.enemy.legionnaire;

function kratos(x: number): EntityState {
  const world = new World();
  world.loadScenario('legionnaire');
  const base = world.snapshot().entities.find((e) => e.kind === 'player');
  assert.ok(base);
  return { ...base, x, hp: 100_000, maxHp: 100_000, hurtInvulTicks: 0 };
}

function foe(id: string, x: number): EntityState {
  return { ...legionnaireAt(id, x, kratos(0).y, -1), grounded: true };
}

function stepAll(foes: EntityState[], player: EntityState): void {
  for (const f of foes) stepLegionnaire(f, player, [], 1 / 60, foes);
  for (const f of foes) f.x += f.vx / 60;
}

describe('legionnaire pacing: it does not charge in without a pause', () => {
  it('walks while far, then holds in guard at the stand-off distance', () => {
    const player = kratos(100);
    const f = foe('l1', 100 + AI.aggroRange - 10);
    const states = new Set<string>();
    for (let i = 0; i < 400; i += 1) {
      stepAll([f], player);
      states.add(f.aiState);
      if (f.aiState === 'guard') break;
    }
    assert.equal(f.aiState, 'guard');
    assert.ok(states.has('approach'));
    assert.ok(Math.abs(f.x - player.x) <= AI.standoffRange + 1);
    assert.ok(Math.abs(f.x - player.x) > AI.attackRange);
  });

  it('stays put for at least the minimum hold and never swings before it', () => {
    const player = kratos(100);
    const f = foe('l1', 100 + AI.standoffRange + 2);
    let heldTicks = 0;
    for (let i = 0; i < 400; i += 1) {
      stepAll([f], player);
      if (f.aiState === 'guard' && f.vx === 0) heldTicks += 1;
      assert.ok(f.aiState !== 'windup' || heldTicks >= AI.holdTicksMin, 'swung before holding');
      if (f.aiState === 'windup') break;
    }
    assert.equal(f.aiState, 'windup');
    assert.ok(heldTicks >= AI.holdTicksMin);
  });

  it('goes back to chasing when Kratos walks away', () => {
    const player = kratos(100);
    const f = foe('l1', 100 + AI.standoffRange);
    for (let i = 0; i < 5; i += 1) stepAll([f], player);
    assert.equal(f.aiState, 'guard');
    player.x -= AI.standoffRange + AI.standoffSlack + 20;
    stepAll([f], player);
    assert.equal(f.aiState, 'approach');
  });

  it('different legionnaires hold for different times, the same one always the same', () => {
    const holdOf = (id: string): number => {
      const player = kratos(100);
      const f = foe(id, 100 + AI.standoffRange);
      let ticks = 0;
      for (let i = 0; i < 400 && f.aiState !== 'windup'; i += 1) {
        stepAll([f], player);
        if (f.aiState === 'guard' && f.vx === 0) ticks += 1;
      }
      return ticks;
    };
    assert.equal(holdOf('a'), holdOf('a'));
    const spread = new Set(['a', 'b', 'c', 'd', 'e', 'f'].map(holdOf));
    assert.ok(spread.size > 1);
  });
});

describe('legionnaire pacing: a crowd takes turns', () => {
  it('never has more than the allowed number swinging at once', () => {
    const player = kratos(240);
    // Same id, so the same hold: all four want to swing on the same tick.
    const foes = [foe('same', 300), foe('same', 305), foe('same', 180), foe('same', 175)];
    let busiest = 0;
    let swings = 0;
    for (let i = 0; i < 1200; i += 1) {
      stepAll(foes, player);
      const busy = foes.filter((f) => f.aiState === 'windup' || f.aiState === 'slash').length;
      busiest = Math.max(busiest, busy);
      swings += foes.filter((f) => f.aiState === 'slash' && f.aiTicks === 1).length;
    }
    assert.ok(busiest <= AI.maxAttackers, `${busiest} swinging at once`);
    assert.equal(busiest, AI.maxAttackers, 'the turns are used, not exceeded');
    assert.ok(swings >= 3, 'the crowd still attacks');
  });
});
