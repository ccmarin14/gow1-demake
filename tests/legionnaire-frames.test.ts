import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { LEGIONNAIRE_FRAME_KEYS } from '../src/assets/manifest';
import { getLegionnaireFrameKey } from '../src/scene/legionnaireFrames';
import type { EntityState } from '../src/sim/types';

function dummyLegionnaire(overrides: Partial<EntityState> = {}): EntityState {
  return {
    id: 'legionnaire-test',
    kind: 'legionnaire',
    x: 100,
    y: 200,
    vx: 0,
    vy: 0,
    facing: 1,
    grounded: true,
    hp: 60,
    maxHp: 60,
    isDead: false,
    attackHits: [],
    attackCooldownTicks: 0,
    hitstunTicks: 0,
    invulTicks: 0,
    hurtInvulTicks: 0,
    rollPhase: 'none',
    rollTicks: 0,
    guardPhase: 'none',
    guardTicks: 0,
    parryActive: false,
    magicPhase: 'none',
    magicTicks: 0,
    mp: 0,
    maxMp: 0,
    redOrbs: 0,
    aiState: 'idle',
    aiTicks: 0,
    ...overrides,
  };
}

describe('legionnaire animation frame selection by AI state', () => {
  it('idle and guard choose legionnaire-idle-00', () => {
    const idleEnemy = dummyLegionnaire({ aiState: 'idle', aiTicks: 0 });
    const guardEnemy = dummyLegionnaire({ aiState: 'guard', aiTicks: 15 });
    assert.equal(getLegionnaireFrameKey(idleEnemy), 'legionnaire-idle-00');
    assert.equal(getLegionnaireFrameKey(guardEnemy), 'legionnaire-idle-00');
  });

  it('approach and patrol cycle walk-00 through walk-07 in loop', () => {
    const framesApproach = [0, 4, 8, 12, 16, 20, 24, 28].map((ticks) => {
      return getLegionnaireFrameKey(dummyLegionnaire({ aiState: 'approach', aiTicks: ticks }));
    });
    const framesPatrol = [0, 4, 8, 12, 16, 20, 24, 28].map((ticks) => {
      return getLegionnaireFrameKey(dummyLegionnaire({ aiState: 'patrol', aiTicks: ticks }));
    });
    const expected = [
      'legionnaire-walk-00',
      'legionnaire-walk-01',
      'legionnaire-walk-02',
      'legionnaire-walk-03',
      'legionnaire-walk-04',
      'legionnaire-walk-05',
      'legionnaire-walk-06',
      'legionnaire-walk-07',
    ];
    assert.deepEqual(framesApproach, expected);
    assert.deepEqual(framesPatrol, expected);
    // Wraps cleanly around
    const loop = getLegionnaireFrameKey(dummyLegionnaire({ aiState: 'patrol', aiTicks: 32 }));
    assert.equal(loop, 'legionnaire-walk-00');
  });

  it('windup uses windup-00..03 across 24 ticks and holds windup-03 until slash', () => {
    assert.equal(getLegionnaireFrameKey(dummyLegionnaire({ aiState: 'windup', aiTicks: 0 })), 'legionnaire-windup-00');
    assert.equal(getLegionnaireFrameKey(dummyLegionnaire({ aiState: 'windup', aiTicks: 3 })), 'legionnaire-windup-00');
    assert.equal(getLegionnaireFrameKey(dummyLegionnaire({ aiState: 'windup', aiTicks: 4 })), 'legionnaire-windup-01');
    assert.equal(getLegionnaireFrameKey(dummyLegionnaire({ aiState: 'windup', aiTicks: 7 })), 'legionnaire-windup-01');
    assert.equal(getLegionnaireFrameKey(dummyLegionnaire({ aiState: 'windup', aiTicks: 8 })), 'legionnaire-windup-02');
    assert.equal(getLegionnaireFrameKey(dummyLegionnaire({ aiState: 'windup', aiTicks: 11 })), 'legionnaire-windup-02');
    assert.equal(getLegionnaireFrameKey(dummyLegionnaire({ aiState: 'windup', aiTicks: 12 })), 'legionnaire-windup-03');
    assert.equal(getLegionnaireFrameKey(dummyLegionnaire({ aiState: 'windup', aiTicks: 23 })), 'legionnaire-windup-03');
    assert.equal(getLegionnaireFrameKey(dummyLegionnaire({ aiState: 'windup', aiTicks: 30 })), 'legionnaire-windup-03');
  });

  it('slash uses slash-00..03 across 8 ticks (2 ticks per frame)', () => {
    assert.equal(getLegionnaireFrameKey(dummyLegionnaire({ aiState: 'slash', aiTicks: 0 })), 'legionnaire-slash-00');
    assert.equal(getLegionnaireFrameKey(dummyLegionnaire({ aiState: 'slash', aiTicks: 1 })), 'legionnaire-slash-00');
    assert.equal(getLegionnaireFrameKey(dummyLegionnaire({ aiState: 'slash', aiTicks: 2 })), 'legionnaire-slash-01');
    assert.equal(getLegionnaireFrameKey(dummyLegionnaire({ aiState: 'slash', aiTicks: 3 })), 'legionnaire-slash-01');
    assert.equal(getLegionnaireFrameKey(dummyLegionnaire({ aiState: 'slash', aiTicks: 4 })), 'legionnaire-slash-02');
    assert.equal(getLegionnaireFrameKey(dummyLegionnaire({ aiState: 'slash', aiTicks: 5 })), 'legionnaire-slash-02');
    assert.equal(getLegionnaireFrameKey(dummyLegionnaire({ aiState: 'slash', aiTicks: 6 })), 'legionnaire-slash-03');
    assert.equal(getLegionnaireFrameKey(dummyLegionnaire({ aiState: 'slash', aiTicks: 7 })), 'legionnaire-slash-03');
  });

  it('recover uses recover-00..02 across 16 ticks', () => {
    assert.equal(getLegionnaireFrameKey(dummyLegionnaire({ aiState: 'recover', aiTicks: 0 })), 'legionnaire-recover-00');
    assert.equal(getLegionnaireFrameKey(dummyLegionnaire({ aiState: 'recover', aiTicks: 4 })), 'legionnaire-recover-00');
    assert.equal(getLegionnaireFrameKey(dummyLegionnaire({ aiState: 'recover', aiTicks: 5 })), 'legionnaire-recover-01');
    assert.equal(getLegionnaireFrameKey(dummyLegionnaire({ aiState: 'recover', aiTicks: 9 })), 'legionnaire-recover-01');
    assert.equal(getLegionnaireFrameKey(dummyLegionnaire({ aiState: 'recover', aiTicks: 10 })), 'legionnaire-recover-02');
    assert.equal(getLegionnaireFrameKey(dummyLegionnaire({ aiState: 'recover', aiTicks: 15 })), 'legionnaire-recover-02');
  });

  it('hitstun chooses hitstun-00 on impact and hitstun-01 through recovery', () => {
    assert.equal(getLegionnaireFrameKey(dummyLegionnaire({ aiState: 'hitstun', aiTicks: 0 })), 'legionnaire-hitstun-00');
    assert.equal(getLegionnaireFrameKey(dummyLegionnaire({ aiState: 'hitstun', aiTicks: 5 })), 'legionnaire-hitstun-00');
    assert.equal(getLegionnaireFrameKey(dummyLegionnaire({ aiState: 'hitstun', aiTicks: 6 })), 'legionnaire-hitstun-01');
    assert.equal(getLegionnaireFrameKey(dummyLegionnaire({ aiState: 'hitstun', aiTicks: 11 })), 'legionnaire-hitstun-01');
  });

  it('juggle chooses juggle-00 when rising and juggle-01 when falling', () => {
    const rising = dummyLegionnaire({ aiState: 'juggle', vy: -120, grounded: false });
    const falling = dummyLegionnaire({ aiState: 'juggle', vy: 60, grounded: false });
    const apex = dummyLegionnaire({ aiState: 'juggle', vy: 0, grounded: false });
    assert.equal(getLegionnaireFrameKey(rising), 'legionnaire-juggle-00');
    assert.equal(getLegionnaireFrameKey(falling), 'legionnaire-juggle-01');
    assert.equal(getLegionnaireFrameKey(apex), 'legionnaire-juggle-01');
  });

  it('death traverses death-00..02 and holds on death-02', () => {
    assert.equal(getLegionnaireFrameKey(dummyLegionnaire({ aiState: 'death', aiTicks: 0 })), 'legionnaire-death-00');
    assert.equal(getLegionnaireFrameKey(dummyLegionnaire({ aiState: 'death', aiTicks: 7 })), 'legionnaire-death-00');
    assert.equal(getLegionnaireFrameKey(dummyLegionnaire({ aiState: 'death', aiTicks: 8 })), 'legionnaire-death-01');
    assert.equal(getLegionnaireFrameKey(dummyLegionnaire({ aiState: 'death', aiTicks: 15 })), 'legionnaire-death-01');
    assert.equal(getLegionnaireFrameKey(dummyLegionnaire({ aiState: 'death', aiTicks: 16 })), 'legionnaire-death-02');
    assert.equal(getLegionnaireFrameKey(dummyLegionnaire({ aiState: 'death', aiTicks: 40 })), 'legionnaire-death-02');
  });

  it('knockdown chooses death-02 while get_up transitions death-01 to idle-00 (ESE-07)', () => {
    assert.equal(getLegionnaireFrameKey(dummyLegionnaire({ aiState: 'knockdown', aiTicks: 0 })), 'legionnaire-death-02');
    assert.equal(getLegionnaireFrameKey(dummyLegionnaire({ aiState: 'knockdown', aiTicks: 25 })), 'legionnaire-death-02');

    // get_up: torso arriba en death-01 y luego de pie en idle-00
    assert.equal(getLegionnaireFrameKey(dummyLegionnaire({ aiState: 'get_up', aiTicks: 0 })), 'legionnaire-death-01');
    assert.equal(getLegionnaireFrameKey(dummyLegionnaire({ aiState: 'get_up', aiTicks: 7 })), 'legionnaire-death-01');
    assert.equal(getLegionnaireFrameKey(dummyLegionnaire({ aiState: 'get_up', aiTicks: 8 })), 'legionnaire-idle-00');
    assert.equal(getLegionnaireFrameKey(dummyLegionnaire({ aiState: 'get_up', aiTicks: 14 })), 'legionnaire-idle-00');
  });

  it('every selected frame exists in LEGIONNAIRE_FRAME_KEYS manifest', () => {
    const states: EntityState['aiState'][] = [
      'idle',
      'guard',
      'approach',
      'patrol',
      'windup',
      'slash',
      'recover',
      'hitstun',
      'juggle',
      'knockdown',
      'get_up',
      'death',
    ];
    for (const state of states) {
      for (const ticks of [0, 5, 10, 15, 20, 25]) {
        for (const vy of [-100, 100]) {
          const key = getLegionnaireFrameKey(dummyLegionnaire({ aiState: state, aiTicks: ticks, vy }));
          assert.ok(
            LEGIONNAIRE_FRAME_KEYS.includes(key),
            `Key "${key}" produced by state "${state}" at tick ${ticks} is not in manifest`,
          );
        }
      }
    }
  });
});
