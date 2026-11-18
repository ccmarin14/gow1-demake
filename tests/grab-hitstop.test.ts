import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { CONFIG } from '../src/config';
import { PLAYER_ID } from '../src/sim/types';
import type { EntityState, GameAction } from '../src/sim/types';
import { World } from '../src/sim/world';

// The blows of the circle grab freeze the world a few ticks, like the squares and triangles do (audit: they had none).

function setup(): { world: World; p: EntityState; victim: EntityState } {
  const world = new World();
  world.loadScenario('level1');
  const p = world.peekEntity(PLAYER_ID) as EntityState;
  const victim = world.peekEntity('legionnaire-deck-1') as EntityState;
  p.x = 300;
  p.facing = 1;
  victim.x = 328;
  victim.y = p.y;
  victim.hp = 60;
  return { world, p, victim };
}

/** Steps the world stays on the clock `phase:impactTick` (the grab clock does not move while it is frozen), minus the first. */
function frozenTicksAt(phase: string, impactTick: number, plan: (tick: number, p: EntityState) => GameAction[]): number {
  const { world, p } = setup();
  const target = `${phase}:${impactTick}`;
  let previous = '';
  let run = 0;
  let best = 0;
  for (let i = 0; i < 400; i += 1) {
    world.step(plan(i, p));
    const key = `${p.grabPhase}:${p.grabTicks}`;
    run = key === target ? (key === previous ? run + 1 : 1) : 0;
    best = Math.max(best, run);
    previous = key;
  }
  return best - 1;
}

const chain = (taps: number, extra?: (tick: number, p: EntityState) => GameAction[]) => {
  let used = 0;
  return (tick: number, p: EntityState): GameAction[] => {
    const ready = tick === 0 || ((p.grabPhase === 'hold' || p.grabPhase === 'floorhold') && p.grabTicks >= 2);
    if (ready && used < taps) {
      used += 1;
      return ['grab'];
    }
    return extra ? extra(tick, p) : [];
  };
};

describe('circle grab: hitstop on every blow (audit)', () => {
  const hitstop = CONFIG.player.grab.hitstop;

  it('a punch freezes the world', () => {
    assert.equal(frozenTicksAt('pummel', 4, chain(2)), hitstop.punch);
    assert.ok(hitstop.punch >= 2);
  });

  it('a floor stab freezes the world', () => {
    assert.equal(frozenTicksAt('stab', CONFIG.player.grab.chain.stabImpactTick, chain(5)), hitstop.stab);
  });

  it('the slam freezes it longer than a punch', () => {
    assert.equal(frozenTicksAt('slam', CONFIG.player.grab.slamImpactTick, chain(5)), hitstop.slam);
    assert.ok(hitstop.slam > hitstop.punch);
  });

  it('the Rip and both moments of the Toss freeze it', () => {
    const afterGrab = (action: GameAction) => (tick: number): GameAction[] => (tick === 3 ? [action] : []);
    assert.equal(frozenTicksAt('break', CONFIG.player.grab.ripTick, (t, p) => (t === 0 ? ['grab'] : afterGrab('heavy-attack')(t))), hitstop.rip);
    assert.equal(frozenTicksAt('throw', CONFIG.player.grab.toss.stabTick, (t) => (t === 0 ? ['grab'] : afterGrab('light-attack')(t))), hitstop.toss);
    assert.equal(frozenTicksAt('throw', CONFIG.player.grab.toss.releaseTick, (t) => (t === 0 ? ['grab'] : afterGrab('light-attack')(t))), hitstop.toss);
  });
});

describe('circle grab: a follow-up pressed while a punch lands is not lost (audit N2)', () => {
  function afterPunch(action: GameAction, pressAtPummelTick: number): { world: World; p: EntityState } {
    const { world, p } = setup();
    world.step(['grab']); // the grab connects
    for (let i = 0; i < 12; i += 1) world.step([]);
    world.step(['grab']); // first punch
    let pressed = false;
    for (let i = 0; i < 60 && p.grabPhase !== 'throw' && p.grabPhase !== 'break'; i += 1) {
      const press = !pressed && p.grabPhase === 'pummel' && p.grabTicks >= pressAtPummelTick;
      if (press) pressed = true;
      world.step(press ? [action] : []);
    }
    return { world, p };
  }

  it('a □ pressed while the punch is frozen by its hitstop starts the Toss as soon as he holds him again', () => {
    const { p } = afterPunch('light-attack', 5);
    assert.equal(p.grabPhase, 'throw');
  });

  it('a △ pressed in the middle of the punch starts the Rip', () => {
    const { p } = afterPunch('heavy-attack', 8);
    assert.equal(p.grabPhase, 'break');
  });

  it('a ○ pressed in the middle of a punch gives the next blow without a second tap', () => {
    const { world, p } = setup();
    world.step(['grab']);
    for (let i = 0; i < 12; i += 1) world.step([]);
    world.step(['grab']);
    let pressed = false;
    let blows = 0;
    let last = '';
    for (let i = 0; i < 80; i += 1) {
      const press = !pressed && p.grabPhase === 'pummel' && p.grabTicks >= 8;
      if (press) pressed = true;
      world.step(press ? ['grab'] : []);
      if (p.grabPhase === 'pummel' && last !== 'pummel') blows += 1;
      last = p.grabPhase;
    }
    assert.equal(blows, 2, 'the first punch and the one that was buffered');
  });
});
