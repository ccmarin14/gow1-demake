import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { CONFIG } from '../src/config';
import { PLAYER_ID } from '../src/sim/types';
import type { EntityState, GameAction } from '../src/sim/types';
import { World } from '../src/sim/world';
import { victimPose, victimTorn } from '../src/scene/grabPose';

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

/** Each time the clock reaches `phase:impactTick`, the steps it stays there (the grab clock does not move while frozen), minus the first. */
function frozenRunsAt(phase: string, impactTick: number, plan: (tick: number, p: EntityState) => GameAction[]): number[] {
  const { world, p } = setup();
  const target = `${phase}:${impactTick}`;
  let previous = '';
  const runs: number[] = [];
  for (let i = 0; i < 400; i += 1) {
    world.step(plan(i, p));
    const key = `${p.grabPhase}:${p.grabTicks}`;
    if (key === target) {
      if (key === previous) runs[runs.length - 1] += 1;
      else runs.push(0);
    }
    previous = key;
  }
  return runs;
}

/** The longest freeze on the clock `phase:impactTick`. */
function frozenTicksAt(phase: string, impactTick: number, plan: (tick: number, p: EntityState) => GameAction[]): number {
  return Math.max(-1, ...frozenRunsAt(phase, impactTick, plan));
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

  it('a floor stab freezes the world, and the killing (fourth) stab longer', () => {
    const runs = frozenRunsAt('stab', CONFIG.player.grab.chain.stabImpactTick, chain(5));
    assert.deepEqual(runs, [hitstop.stab, hitstop.stab, hitstop.stab, hitstop.lastStab]);
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

describe('circle grab: the floor stabs are a furious burst (user: "chan, chan, chan", game feel)', () => {
  const { hitstop } = CONFIG.player.grab;
  const { stabDelayTicks, stabTicks, lastStabHoldTicks } = CONFIG.player.grab.chain;
  /** World steps (hitstop included) between the four stab impacts, with no input after the slam. */
  function impactGaps(): number[] {
    const { world, victim } = setup();
    victim.hp = 1000;
    const plan = chain(5);
    const p = world.peekEntity(PLAYER_ID) as EntityState;
    const at: number[] = [];
    let hp = victim.hp;
    for (let i = 0; i < 600 && !victim.isDead; i += 1) {
      world.step(plan(i, p));
      if (p.grabPhase === 'stab' && victim.hp < hp) at.push(i);
      hp = victim.hp;
    }
    return at.slice(1).map((t, i) => t - at[i]);
  }

  it('the stabs land 10 to 13 ticks apart (they were 21), the burst speeds up and the killing one comes a beat later', () => {
    const gaps = impactGaps();
    assert.deepEqual(gaps, [
      stabDelayTicks[1] + stabTicks + hitstop.stab,
      stabDelayTicks[2] + stabTicks + hitstop.stab,
      stabDelayTicks[3] + stabTicks + hitstop.lastStab,
    ]);
    for (const gap of gaps.slice(0, 2)) assert.ok(gap >= 10 && gap <= 13, `${gap} ticks between two stabs`);
    assert.ok(gaps[1] <= gaps[0], 'the second gap is not slower than the first');
    assert.ok(gaps[2] > gaps[1], 'the killing stab is the accent');
    assert.ok(stabDelayTicks[0] > stabDelayTicks[1], 'the first stab after the slam is a bit slower');
  });

  it('the killing stab keeps the blade in longer before Kratos gets up', () => {
    assert.ok(lastStabHoldTicks >= 4);
    assert.ok(hitstop.lastStab > hitstop.stab);
  });
});

describe('circle grab: one impact grammar for every blow (game feel)', () => {
  const { hitstop, shake } = CONFIG.player.grab;

  it('freeze and shake grow on the same scale: punch < stab < Toss < Rip < slam, the killing stab between the stab and the Rip', () => {
    const order = ['punch', 'stab', 'toss', 'rip', 'slam'] as const;
    for (let i = 1; i < order.length; i += 1) {
      assert.ok(hitstop[order[i]] > hitstop[order[i - 1]], `hitstop ${order[i - 1]} ${hitstop[order[i - 1]]} < ${order[i]} ${hitstop[order[i]]}`);
      assert.ok(shake[order[i]].px > shake[order[i - 1]].px, `shake ${order[i - 1]} < ${order[i]}`);
      assert.ok(shake[order[i]].ms > shake[order[i - 1]].ms, `shake time ${order[i - 1]} < ${order[i]}`);
    }
    assert.ok(hitstop.lastStab > hitstop.stab && hitstop.lastStab < hitstop.rip);
    assert.ok(shake.lastStab.px > shake.stab.px && shake.lastStab.px < shake.rip.px);
    assert.ok(shake.latch.px < shake.punch.px);
  });

  it('while the tear is frozen the torn body is already hidden (it used to be drawn standing over Kratos for 6 frames)', () => {
    const { world, p, victim } = setup();
    let frozenSeen = 0;
    for (let i = 0; i < 120; i += 1) {
      world.step(i === 0 ? ['grab'] : i === 3 ? ['heavy-attack'] : []);
      if (p.grabPhase === 'break' && p.grabTicks === CONFIG.player.grab.ripTick) {
        frozenSeen += 1;
        assert.equal(victimTorn(p, victim), true, `frozen step ${frozenSeen}`);
        assert.equal(victimPose(p, victim), null);
      }
      if (p.grabPhase === 'break' && p.grabTicks < CONFIG.player.grab.ripTick) assert.equal(victimTorn(p, victim), false);
    }
    assert.ok(frozenSeen > hitstop.rip, 'the tear tick is held by the hitstop');
    assert.equal(victim.ripped, true);
  });
});
