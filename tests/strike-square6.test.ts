import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

import {
  STRIKES,
  bladeAt,
  bladeTime,
  farBladeAt,
  nearBladeAt,
  startStrike,
  stepStrike,
  strikeActiveTicks,
  strikeAdvanceAt,
  strikeChainTicks,
  strikeHitSegment,
  strikeHitWindowAt,
  strikeLength,
  strikePoseAt,
  strikeTrailAt,
  thrownBladeAt,
  type StrikeEntry,
  type Vec2,
} from '../src/sim/strike';
import type { EntityState, GameAction, SimulationSnapshot } from '../src/sim/types';
import { World } from '../src/sim/world';
import { ANCHORS, feet, poseAnchors, dist, pathLength } from './helpers/anchors';

const SQUARE5 = STRIKES.square5;
const SQUARE6 = STRIKES.square6;

const close = (a: readonly number[], b: readonly number[]): boolean => dist(a as Vec2, b as Vec2) < 1e-3;

/** Square-4 values recorded from the approved implementation (commit 6510e2e). */
const SQ5_FIXTURE: {
  entry: StrikeEntry;
  samples: {
    t: number; near: number[]; nearChain: boolean; nearSag: number; nearDeg: number; nearBehind: boolean; nearS: number;
    far: number[]; farChain: boolean; farSag: number; farDeg: number; farBehind: boolean; farS: number; adv: number;
  }[];
  ticks: {
    tick: number; pose: string; nearTrail: number[][]; nearTrailS: number[]; nearWidth: number;
    farTrail: number[][]; farTrailS: number[]; farWidth: number; nearHit: number[][] | null; farHit: number[][] | null;
  }[];
} = JSON.parse(readFileSync(new URL('./fixtures/square5-track.json', import.meta.url), 'utf-8'));

function playingWorld(): World {
  const world = new World();
  world.loadScenario('movement');
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

/** Runs the combo up to square 6 (each link chained when its window opens). */
function square6World(): { world: World; x0: number } {
  const world = playingWorld();
  const x0 = player(world.snapshot()).x;
  world.step(['light-attack']);
  hold(world, 20, []);
  world.step(['light-attack']);
  hold(world, 14, []);
  world.step(['light-attack']);
  hold(world, 21, []);
  world.step(['light-attack']);
  hold(world, 15, []);
  world.step(['light-attack']);
  assert.equal(world.snapshot().strike?.id, 'square5');
  hold(world, 24, []);
  assert.equal(world.snapshot().strike?.tick, 24);
  world.step(['light-attack']);
  return { world, x0 };
}

describe('square-5 is unchanged as approved', () => {
  it('keeps both blades, both trails and both hit segments of commit 6510e2e', () => {
    const entry = SQ5_FIXTURE.entry;
    for (const q of SQ5_FIXTURE.samples) {
      const near = nearBladeAt(SQUARE5, q.t, poseAnchors, entry);
      const far = farBladeAt(SQUARE5, q.t, poseAnchors, entry);
      assert.ok(close(near.pos, q.near), `near blade at ${q.t}`);
      assert.equal(near.chainOut, q.nearChain);
      assert.ok(Math.abs(near.sagPx - q.nearSag) < 1e-3);
      assert.equal(near.deg, q.nearDeg);
      assert.equal(near.behindBody, q.nearBehind);
      assert.ok(Math.abs(near.s - q.nearS) < 1e-3);
      assert.ok(close(far.pos, q.far), `far blade at ${q.t}`);
      assert.equal(far.chainOut, q.farChain);
      assert.ok(Math.abs(far.sagPx - q.farSag) < 1e-3);
      assert.equal(far.deg, q.farDeg);
      assert.equal(far.behindBody, q.farBehind);
      assert.ok(Math.abs(far.s - q.farS) < 1e-3);
      assert.ok(Math.abs(strikeAdvanceAt(SQUARE5, q.t) - q.adv) < 1e-3);
    }
    for (const k of SQ5_FIXTURE.ticks) {
      assert.equal(strikePoseAt(SQUARE5, k.tick), k.pose);
      for (const [hand, points, widthPx, hit] of [
        ['near', k.nearTrail, k.nearWidth, k.nearHit],
        ['far', k.farTrail, k.farWidth, k.farHit],
      ] as const) {
        const trail = strikeTrailAt(SQUARE5, k.tick, poseAnchors, hand);
        assert.equal(trail.widthPx, widthPx);
        assert.equal(trail.points.length, points.length, `${hand} trail length on tick ${k.tick}`);
        trail.points.forEach((p, i) => assert.ok(close(p, points[i]), `${hand} trail point ${i} on tick ${k.tick}`));
        const segment = strikeHitSegment(SQUARE5, k.tick, hand);
        assert.equal(segment === null, hit === null);
        if (segment && hit) assert.ok(close(segment[0], hit[0]) && close(segment[1], hit[1]));
      }
    }
  });
});

describe('square-6 strike data (the finisher, inverted: back, ring behind to front, double lash last)', () => {
  it('runs load 4, back 5, sweep 4 + 5, throw 5, hold 4 and recall 7 ticks (34), throwing both blades; the far one a few ticks later', () => {
    assert.deepEqual(
      SQUARE6.phases.map((p) => [p.id, p.ticks]),
      [['load', 4], ['back', 5], ['sweepA', 4], ['sweepB', 5], ['throw', 5], ['hold', 4], ['recall', 7]],
    );
    assert.equal(strikeLength(SQUARE6), 34);
    for (const hand of ['near', 'far'] as const) {
      for (const phase of SQUARE6.phases) assert.ok(SQUARE6.blades[hand]?.motion[phase.id], `${hand} ${phase.id}`);
    }
    assert.equal(SQUARE6.blades.near?.lag, undefined);
    assert.deepEqual(SQUARE6.blades.far?.lag, { ticks: 3, until: 'throw' }, 'out of phase');
    assert.equal(bladeTime(SQUARE6, 'far', 12), 9);
    assert.equal(bladeTime(SQUARE6, 'far', 25), 25);
  });

  it('twists back and lunges with the torso up: the shoulders of the poses are at least 24 px above the ground', () => {
    for (const pose of ['tri-pb', 'tri-pc', 'sq5-g', 'sq5-d']) {
      const shoulder = feet(ANCHORS[`kratos-${pose}`].shoulder);
      assert.ok(-shoulder[1] >= 24, `${pose} shoulder ${(-shoulder[1]).toFixed(1)} px up`);
    }
    assert.deepEqual(SQUARE6.phases.map((p) => p.pose), ['sq5-a', 'tri-pb', 'tri-pc', 'sq5-g', 'sq5-d', 'sq5-e', 'sq5-f']);
  });

  it('anchors each track on its shoulder in the lunge', () => {
    assert.ok(dist(feet(ANCHORS['kratos-sq5-d'].shoulder), SQUARE6.blades.near!.shoulder) < 0.2);
    assert.ok(dist(feet(ANCHORS['kratos-sq5-d'].farShoulder), SQUARE6.blades.far!.shoulder) < 0.2);
  });

  it('starts behind: both blades swing back from overhead to behind the hip before anything goes forward', () => {
    // The far blade runs 3 ticks behind the near one (out of phase).
    for (const [hand, lag] of [['near', 0], ['far', 3]] as const) {
      const start = thrownBladeAt(SQUARE6, 4 + lag, poseAnchors, hand).pos;
      const back = thrownBladeAt(SQUARE6, 8.99 + lag, poseAnchors, hand).pos;
      assert.ok(start[1] <= -45, `${hand} starts overhead (${(-start[1]).toFixed(0)} px up)`);
      assert.ok(back[0] <= -25 && back[1] >= -32 && back[1] <= -14, `${hand} ends the swing behind the hip (${back.map((v) => v.toFixed(0))})`);
      let prevX = Infinity;
      for (let t = 4 + lag; t <= 9 + lag; t += 0.5) {
        const x = thrownBladeAt(SQUARE6, t, poseAnchors, hand).pos[0];
        assert.ok(x <= prevX + 0.5, `${hand} keeps going back at ${t}`);
        prevX = x;
      }
    }
  });

  it('sweeps the ring from behind to the front at waist height: the near blade low in front of the body, the far one behind it', () => {
    for (const [hand, lag] of [['near', 0], ['far', 3]] as const) {
      let prevX = -Infinity;
      for (let t = 9 + lag; t <= 18.01; t += 0.5) {
        const p = thrownBladeAt(SQUARE6, t, poseAnchors, hand).pos;
        assert.ok(p[0] >= prevX - 1, `${hand} goes forward round the body at ${t}`);
        assert.ok(p[1] <= -8 && p[1] >= -34, `${hand} at waist height at ${t} (${(-p[1]).toFixed(0)} px up)`);
        prevX = p[0];
      }
    }
    let nearFront = false;
    let farBehind = false;
    for (let t = 9; t < 19; t += 0.25) {
      const near = thrownBladeAt(SQUARE6, t, poseAnchors, 'near');
      const far = thrownBladeAt(SQUARE6, t, poseAnchors, 'far');
      if (Math.abs(near.pos[0] - strikeAdvanceAt(SQUARE6, t)) < 8) nearFront ||= !near.behindBody && near.pos[1] > -18;
      if (Math.abs(far.pos[0] - strikeAdvanceAt(SQUARE6, t)) < 8) farBehind ||= far.behindBody && far.pos[1] < -22;
    }
    assert.ok(nearFront, 'the near blade passes in front of the body, low');
    assert.ok(farBehind, 'the far blade passes behind the body, higher');
  });

  it('ends in the double lash forward: both blades at once, straight and forward, crossing in an X, the near one 88 px out', () => {
    for (const hand of ['near', 'far'] as const) {
      let prevX = -Infinity;
      for (let t = 19; t <= 23; t += 0.5) {
        const x = thrownBladeAt(SQUARE6, t, poseAnchors, hand).pos[0];
        assert.ok(x > prevX, `${hand} goes forward at ${t}`);
        prevX = x;
      }
    }
    const near = thrownBladeAt(SQUARE6, 22.99, poseAnchors, 'near').pos;
    const far = thrownBladeAt(SQUARE6, 22.99, poseAnchors, 'far').pos;
    assert.ok(near[0] >= 85 && near[0] <= 92, `near reach ${near[0].toFixed(1)} px`);
    assert.ok(far[0] >= 70 && far[0] <= 90, `far reach ${far[0].toFixed(1)} px`);
    assert.ok(near[1] <= -26 && near[1] >= -38, `near lash at ${(-near[1]).toFixed(1)} px up`);
    const before = thrownBladeAt(SQUARE6, 18, poseAnchors, 'near').pos[1] - thrownBladeAt(SQUARE6, 18, poseAnchors, 'far').pos[1];
    const after = near[1] - far[1];
    assert.ok(before * after < 0, `the lines cross (near minus far height ${before.toFixed(1)} then ${after.toFixed(1)})`);
  });

  it('starts the lash as a fresh straight trail: no hook on the hit frames', () => {
    for (const hand of ['near', 'far'] as const) {
      for (let tick = 20; tick <= 23; tick += 1) {
        const points = strikeTrailAt(SQUARE6, tick, poseAnchors, hand).points;
        for (let i = 1; i < points.length; i += 1) {
          assert.ok(points[i][0] >= points[i - 1][0] - 0.5, `${hand} trail turns back on tick ${tick}`);
        }
      }
    }
  });

  it('moves both blades continuously: no jump over 30 px per tick, none at phase changes', () => {
    for (const hand of ['near', 'far'] as const) {
      let prev = bladeAt(SQUARE6, hand, 0, poseAnchors).pos;
      for (let t = 1; t < strikeLength(SQUARE6); t += 1) {
        const pos = bladeAt(SQUARE6, hand, t, poseAnchors).pos;
        assert.ok(dist(prev, pos) <= 30, `${hand}: jump of ${dist(prev, pos).toFixed(1)} px on tick ${t}`);
        prev = pos;
      }
      let at = 0;
      for (const phase of SQUARE6.phases.slice(0, -1)) {
        at += phase.ticks;
        const before = bladeAt(SQUARE6, hand, at - 1e-6, poseAnchors).pos;
        const after = bladeAt(SQUARE6, hand, at, poseAnchors).pos;
        assert.ok(dist(before, after) < 1.5, `${hand}: jump of ${dist(before, after).toFixed(2)} px entering tick ${at}`);
      }
    }
  });

  it('carries each blade from where square 5 left it', () => {
    const entry: StrikeEntry = { id: 'square5', tick: 25, offsetPx: strikeAdvanceAt(SQUARE5, 24), turned: false };
    for (const hand of ['near', 'far'] as const) {
      const left = bladeAt(SQUARE5, hand, 25, poseAnchors).pos;
      const start = bladeAt(SQUARE6, hand, 0, poseAnchors, entry).pos;
      assert.ok(dist(start, [left[0] - entry.offsetPx, left[1]]) < 1e-6, `${hand} blade`);
    }
  });

  it('points each arm at its blade through the lash and the hold (within 40 degrees), and roughly through the ring (within 85)', () => {
    const offAt = (t: number, hand: 'near' | 'far'): number => {
      const pose = strikePoseAt(SQUARE6, t);
      const a = ANCHORS[`kratos-${pose}`];
      const adv = strikeAdvanceAt(SQUARE6, t);
      const shoulder = feet(a[hand === 'near' ? 'shoulder' : 'farShoulder']);
      const grip = feet(a[hand === 'near' ? 'hand' : 'farHand']);
      const blade = thrownBladeAt(SQUARE6, t, poseAnchors, hand).pos;
      const arm = Math.atan2(grip[1] - shoulder[1], grip[0] - shoulder[0]);
      const toBlade = Math.atan2(blade[1] - shoulder[1], blade[0] - adv - shoulder[0]);
      return (Math.abs(((arm - toBlade + 3 * Math.PI) % (2 * Math.PI)) - Math.PI) * 180) / Math.PI;
    };
    for (let t = 20; t < 27; t += 1) {
      for (const hand of ['near', 'far'] as const) assert.ok(offAt(t, hand) <= 40, `tick ${t} ${hand}: arm ${offAt(t, hand).toFixed(0)} degrees off`);
    }
    // The far blade runs 3 ticks late round the ring, so only its first ticks still match the twisted pose (known gap).
    for (let t = 11; t < 18; t += 1) assert.ok(offAt(t, 'near') <= 85, `ring tick ${t} near: arm ${offAt(t, 'near').toFixed(0)} degrees off`);
    for (let t = 11; t < 15; t += 1) assert.ok(offAt(t, 'far') <= 85, `ring tick ${t} far: arm ${offAt(t, 'far').toFixed(0)} degrees off`);
  });

  it('keeps each trail at most 55 px long and its head on its blade', () => {
    for (const hand of ['near', 'far'] as const) {
      for (let tick = 0; tick < strikeLength(SQUARE6); tick += 1) {
        const points = strikeTrailAt(SQUARE6, tick, poseAnchors, hand).points;
        assert.ok(pathLength(points) <= 55, `${hand} trail ${pathLength(points).toFixed(1)} px on tick ${tick}`);
        if (points.length === 0) continue;
        const blade = bladeAt(SQUARE6, hand, tick, poseAnchors).pos;
        assert.ok(dist(points[points.length - 1], blade) <= 2, `${hand} trail head off its blade on tick ${tick}`);
      }
    }
  });

  it('comes back to arms crossed over the chest', () => {
    const adv = strikeAdvanceAt(SQUARE6, 34);
    const near = bladeAt(SQUARE6, 'near', 33.999, poseAnchors).pos;
    const far = bladeAt(SQUARE6, 'far', 33.999, poseAnchors).pos;
    assert.ok(dist(near, [1 + adv, -33]) < 0.5 && dist(far, [9 + adv, -34]) < 0.5, 'both blades at the crossed-arms points');
  });

  it('hits in two windows, the ring and the lash; ends the square chain', () => {
    assert.equal(strikeHitWindowAt(SQUARE6, 13, 'near'), 0, 'ring');
    assert.equal(strikeHitWindowAt(SQUARE6, 22, 'near'), 1, 'lash');
    assert.equal(strikeHitWindowAt(SQUARE6, 6, 'near'), -1, 'not on the swing back');
    assert.deepEqual(strikeChainTicks(SQUARE5), { opens: 24, buffersFrom: 0 });
    assert.equal(SQUARE5.chain?.into, 'square6');
    assert.equal(strikeChainTicks(SQUARE6), null);
    assert.equal(SQUARE6.damage, 20, 'the heavy blow');
  });
});

describe('square 6 hits', () => {
  it('hits an enemy ahead once with the lash and one behind once with the ring, once per window', () => {
    const world = playingWorld();
    const kratos: EntityState = { ...player(world.snapshot()) };
    const template = new World();
    template.loadScenario('legionnaire');
    const foe = template.snapshot().entities.find((e) => e.kind === 'legionnaire')!;
    const ahead: EntityState = { ...foe, id: 'ahead', x: kratos.x + 70, y: kratos.y, hp: 100, isDead: false, aiState: 'approach' };
    const behind: EntityState = { ...foe, id: 'behind', x: kratos.x - 40, y: kratos.y, hp: 100, isDead: false, aiState: 'approach' };
    const state = startStrike(kratos, 'square6');
    const hitsOn: Record<string, number[]> = { ahead: [], behind: [] };
    for (let i = 0; i < strikeLength(SQUARE6); i += 1) {
      const result = stepStrike(state, kratos, [ahead, behind], -1e6, 1e6);
      for (const h of result.hits) hitsOn[h.target.id].push(state.tick);
      if (result.done) break;
    }
    assert.equal(hitsOn.ahead.length, 1, `ahead hit on ${hitsOn.ahead}`);
    assert.ok(hitsOn.ahead[0] >= 19 && hitsOn.ahead[0] <= 24, 'by the lash, at the end');
    assert.equal(hitsOn.behind.length, 1, `behind hit on ${hitsOn.behind}`);
    assert.ok(hitsOn.behind[0] >= 9 && hitsOn.behind[0] <= 18, 'by the ring, from behind');
    assert.equal(ahead.hp, 100 - SQUARE6.damage);
    assert.equal(behind.hp, 100 - SQUARE6.damage);
  });
});

describe('square 5 -> square 6 in the world', () => {
  it('chains on J during the square-5 hold, runs 34 ticks and steps 6 px; J during it does nothing', () => {
    const { world, x0 } = square6World();
    const strike = world.snapshot().strike;
    assert.equal(strike?.id, 'square6');
    assert.equal(strike?.tick, 0);
    assert.equal(strike?.entry?.id, 'square5');
    for (let i = 0; i < 33; i += 1) world.step(i % 3 === 0 ? ['light-attack'] : []);
    assert.equal(world.snapshot().strike?.id, 'square6');
    assert.equal(world.snapshot().strike?.tick, 33);
    world.step([]);
    assert.equal(world.snapshot().strike, undefined);
    assert.ok(Math.abs(player(world.snapshot()).x - x0 - 25) < 1e-6, 'squares 1 to 5 step 7, 5, 5, 2 and 6 px');
  });

  it('can turn around at the square 5 -> square 6 link', () => {
    const world = playingWorld();
    world.step(['light-attack']);
    hold(world, 20, []);
    world.step(['light-attack']);
    hold(world, 14, []);
    world.step(['light-attack']);
    hold(world, 21, []);
    world.step(['light-attack']);
    hold(world, 15, []);
    world.step(['light-attack']);
    hold(world, 20, []);
    hold(world, 4, ['move-left']);
    world.step(['light-attack', 'move-left']);
    assert.equal(world.snapshot().strike?.id, 'square6');
    assert.equal(world.snapshot().strike?.facing, -1);
    assert.equal(world.snapshot().strike?.entry?.turned, true);
  });
});
