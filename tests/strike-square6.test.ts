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
  type StrikePoseAnchors,
  type Vec2,
} from '../src/sim/strike';
import type { EntityState, GameAction, SimulationSnapshot } from '../src/sim/types';
import { World } from '../src/sim/world';

const SQUARE5 = STRIKES.square5;
const SQUARE6 = STRIKES.square6;

const ANCHORS: Record<string, { back: number[]; hand: number[]; farHand: number[]; shoulder: number[]; farShoulder: number[] }> =
  JSON.parse(readFileSync(new URL('../src/assets/kratos-anchors.json', import.meta.url), 'utf-8'));
const feet = (p: number[]): Vec2 => [p[0] - 32, p[1] - 56];
const poseAnchors: StrikePoseAnchors = (pose) => {
  const a = ANCHORS[`kratos-${pose}`];
  assert.ok(a, `anchors for ${pose}`);
  return { back: feet(a.back), hand: feet(a.hand), farHand: feet(a.farHand) };
};
const dist = (a: Vec2, b: Vec2): number => Math.hypot(a[0] - b[0], a[1] - b[1]);
const close = (a: readonly number[], b: readonly number[]): boolean => dist(a as Vec2, b as Vec2) < 1e-3;
const pathLength = (points: readonly Vec2[]): number => points.slice(1).reduce((sum, p, i) => sum + dist(p, points[i]), 0);

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
  hold(world, 14, []);
  world.step(['light-attack']);
  hold(world, 11, []);
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

describe('square-6 strike data', () => {
  it('runs load 4, loop 5, gather 4, throw 5, hold 4, sweep 9 and recall 7 ticks (38), throwing both blades', () => {
    assert.deepEqual(
      SQUARE6.phases.map((p) => [p.id, p.ticks]),
      [['load', 4], ['loop', 5], ['gather', 4], ['throw', 5], ['hold', 4], ['sweep', 9], ['recall', 7]],
    );
    assert.equal(strikeLength(SQUARE6), 38);
    for (const hand of ['near', 'far'] as const) {
      for (const phase of SQUARE6.phases) assert.ok(SQUARE6.blades[hand]?.motion[phase.id], `${hand} ${phase.id}`);
      assert.equal(SQUARE6.blades[hand]?.lag, undefined, 'no lag: the height offset separates the lines');
      assert.equal(bladeTime(SQUARE6, hand, 15), 15);
    }
  });

  it('lunges with the torso up: the shoulder of the gather and the throw is at least 26 px above the ground', () => {
    for (const pose of ['sq5-c', 'sq5-d']) {
      const shoulder = feet(ANCHORS[`kratos-${pose}`].shoulder);
      assert.ok(-shoulder[1] >= 26, `${pose} shoulder ${(-shoulder[1]).toFixed(1)} px up`);
    }
  });

  it('anchors each track on its shoulder in the lunge', () => {
    assert.ok(dist(feet(ANCHORS['kratos-sq5-d'].shoulder), SQUARE6.blades.near!.shoulder) < 0.2);
    assert.ok(dist(feet(ANCHORS['kratos-sq5-d'].farShoulder), SQUARE6.blades.far!.shoulder) < 0.2);
  });

  it('loops over the head, then lashes both blades straight forward, level, as two lines; the near one at the top of the reach', () => {
    let top = 0;
    for (let t = 4; t <= 12; t += 0.25) top = Math.min(top, thrownBladeAt(SQUARE6, t, poseAnchors, 'near').pos[1]);
    assert.ok(top < -65, `the loop tops ${(-top).toFixed(1)} px up`);
    for (const hand of ['near', 'far'] as const) {
      // Straight forward through the throw: no hook back at the low point.
      let prevX = -Infinity;
      for (let t = 13; t <= 18; t += 0.5) {
        const x = thrownBladeAt(SQUARE6, t, poseAnchors, hand).pos[0];
        assert.ok(x > prevX, `${hand} goes forward at ${t}`);
        prevX = x;
      }
      const tip = thrownBladeAt(SQUARE6, 18, poseAnchors, hand).pos;
      assert.ok(tip[1] <= -22 && tip[1] >= -38, `${hand} lash at ${(-tip[1]).toFixed(1)} px up`);
    }
    const near = thrownBladeAt(SQUARE6, 18, poseAnchors, 'near').pos;
    const far = thrownBladeAt(SQUARE6, 18, poseAnchors, 'far').pos;
    assert.ok(near[0] >= 85 && near[0] <= 90, `near reach ${near[0].toFixed(1)} px`);
    assert.ok(far[0] >= 70 && far[0] <= 90, `far reach ${far[0].toFixed(1)} px`);
    assert.ok(far[1] - near[1] >= 4, 'two lines, the far one lower');
  });

  it('starts the lash as a fresh straight trail: no hook on the hit frames', () => {
    for (const hand of ['near', 'far'] as const) {
      for (let tick = 14; tick <= 18; tick += 1) {
        const points = strikeTrailAt(SQUARE6, tick, poseAnchors, hand).points;
        for (let i = 1; i < points.length; i += 1) {
          assert.ok(points[i][0] >= points[i - 1][0] - 0.5, `${hand} trail turns back on tick ${tick}`);
        }
      }
    }
  });

  it('sweeps both blades back around him: near low in front of the body, far higher behind it, ending behind', () => {
    let nearFront = false;
    let farBehind = false;
    for (let t = 22; t < 31; t += 0.25) {
      const near = thrownBladeAt(SQUARE6, t, poseAnchors, 'near');
      const far = thrownBladeAt(SQUARE6, t, poseAnchors, 'far');
      if (Math.abs(near.pos[0] - strikeAdvanceAt(SQUARE6, t)) < 8) {
        nearFront ||= !near.behindBody && near.pos[1] > -22;
      }
      if (Math.abs(far.pos[0] - strikeAdvanceAt(SQUARE6, t)) < 8) {
        farBehind ||= far.behindBody && far.pos[1] < -22;
      }
    }
    assert.ok(nearFront, 'the near blade passes in front of the body, low');
    assert.ok(farBehind, 'the far blade passes behind the body, higher');
    for (const hand of ['near', 'far'] as const) {
      assert.ok(thrownBladeAt(SQUARE6, 30.999, poseAnchors, hand).pos[0] < -40, `${hand} ends behind Kratos`);
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
        assert.ok(dist(before, after) < 1, `${hand}: jump of ${dist(before, after).toFixed(2)} px entering tick ${at}`);
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

  it('points each arm at its blade from the loop to the end of the hold (within 40 degrees)', () => {
    // From the second loop tick to the end of the hold, skipping the first
    // tick of the gather (the blade still descends from the loop) and of the
    // throw (it still sits at the low point while the arm already lashes).
    for (let t = 5; t < 22; t += 1) {
      if (t === 9 || t === 13) continue;
      const pose = strikePoseAt(SQUARE6, t);
      const a = ANCHORS[`kratos-${pose}`];
      const adv = strikeAdvanceAt(SQUARE6, t);
      for (const [hand, shoulderKey, handKey] of [['near', 'shoulder', 'hand'], ['far', 'farShoulder', 'farHand']] as const) {
        const shoulder = feet(a[shoulderKey]);
        const grip = feet(a[handKey]);
        const blade = thrownBladeAt(SQUARE6, t, poseAnchors, hand).pos;
        const arm = Math.atan2(grip[1] - shoulder[1], grip[0] - shoulder[0]);
        const toBlade = Math.atan2(blade[1] - shoulder[1], blade[0] - adv - shoulder[0]);
        const off = Math.abs(((arm - toBlade + 3 * Math.PI) % (2 * Math.PI)) - Math.PI);
        assert.ok(off <= (40 * Math.PI) / 180, `tick ${t} (${pose}) ${hand}: arm ${((off * 180) / Math.PI).toFixed(0)} degrees off`);
      }
    }
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
    const adv = strikeAdvanceAt(SQUARE6, 38);
    const near = bladeAt(SQUARE6, 'near', 37.999, poseAnchors).pos;
    const far = bladeAt(SQUARE6, 'far', 37.999, poseAnchors).pos;
    assert.ok(dist(near, [1 + adv, -33]) < 0.5 && dist(far, [9 + adv, -34]) < 0.5, 'both blades at the crossed-arms points');
  });

  it('hits in two windows, the lash and the sweep; ends the square chain', () => {
    assert.equal(strikeHitWindowAt(SQUARE6, 16, 'near'), 0, 'lash');
    assert.equal(strikeHitWindowAt(SQUARE6, 25, 'near'), 1, 'sweep');
    assert.equal(strikeHitWindowAt(SQUARE6, 10, 'near'), -1, 'not on the loop or gather');
    assert.deepEqual(strikeChainTicks(SQUARE5), { opens: 24, buffersFrom: 4 });
    assert.equal(SQUARE5.chain?.into, 'square6');
    assert.equal(strikeChainTicks(SQUARE6), null);
    const { last } = strikeActiveTicks(SQUARE6);
    assert.equal(last, 30);
  });
});

describe('square 6 hits', () => {
  it('hits an enemy ahead with the lash and again with the sweep, and one behind with the sweep, once per window', () => {
    const world = playingWorld();
    const kratos: EntityState = { ...player(world.snapshot()) };
    const template = new World();
    template.loadScenario('legionnaire');
    const foe = template.snapshot().entities.find((e) => e.kind === 'legionnaire')!;
    const ahead: EntityState = { ...foe, id: 'ahead', x: kratos.x + 60, y: kratos.y, hp: 100, isDead: false, aiState: 'approach' };
    const behind: EntityState = { ...foe, id: 'behind', x: kratos.x - 40, y: kratos.y, hp: 100, isDead: false, aiState: 'approach' };
    const state = startStrike(kratos, 'square6');
    const hitsOn: Record<string, number[]> = { ahead: [], behind: [] };
    for (let i = 0; i < strikeLength(SQUARE6); i += 1) {
      const result = stepStrike(state, kratos, [ahead, behind], -1e6, 1e6);
      for (const h of result.hits) hitsOn[h.target.id].push(state.tick);
      if (result.done) break;
    }
    assert.equal(hitsOn.ahead.length, 2, `ahead hit on ${hitsOn.ahead}`);
    assert.ok(hitsOn.ahead[0] >= 13 && hitsOn.ahead[0] <= 21, 'first by the lash');
    assert.ok(hitsOn.ahead[1] >= 22, 'then by the sweep');
    assert.deepEqual(hitsOn.behind.length, 1, `behind hit on ${hitsOn.behind}`);
    assert.ok(hitsOn.behind[0] >= 22, 'by the sweep');
    assert.equal(ahead.hp, 100 - 2 * SQUARE6.damage);
    assert.equal(behind.hp, 100 - SQUARE6.damage);
  });
});

describe('square 5 -> square 6 in the world', () => {
  it('chains on J during the square-5 hold, runs 38 ticks and steps 5 px; J during it does nothing', () => {
    const { world, x0 } = square6World();
    const strike = world.snapshot().strike;
    assert.equal(strike?.id, 'square6');
    assert.equal(strike?.tick, 0);
    assert.equal(strike?.entry?.id, 'square5');
    for (let i = 0; i < 37; i += 1) world.step(i % 3 === 0 ? ['light-attack'] : []);
    assert.equal(world.snapshot().strike?.id, 'square6');
    assert.equal(world.snapshot().strike?.tick, 37);
    world.step([]);
    assert.equal(world.snapshot().strike, undefined);
    assert.ok(Math.abs(player(world.snapshot()).x - x0 - 24) < 1e-6, 'squares 1 to 5 step 7, 5, 5, 2 and 5 px');
  });

  it('can turn around at the square 5 -> square 6 link', () => {
    const world = playingWorld();
    world.step(['light-attack']);
    hold(world, 20, []);
    world.step(['light-attack']);
    hold(world, 14, []);
    world.step(['light-attack']);
    hold(world, 14, []);
    world.step(['light-attack']);
    hold(world, 11, []);
    world.step(['light-attack']);
    hold(world, 20, []);
    hold(world, 4, ['move-left']);
    world.step(['light-attack', 'move-left']);
    assert.equal(world.snapshot().strike?.id, 'square6');
    assert.equal(world.snapshot().strike?.facing, -1);
    assert.equal(world.snapshot().strike?.entry?.turned, true);
  });
});
