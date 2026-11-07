import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

import {
  STRIKES,
  bladeAt,
  farBladeAt,
  nearBladeAt,
  startStrike,
  stepStrike,
  strikeActiveTicks,
  strikeAdvanceAt,
  strikeChainTicks,
  strikeHitSegment,
  strikeLength,
  strikePoseAt,
  strikeTrailAt,
  thrownBladeAt,
  type Hand,
  type StrikeEntry,
  type Vec2,
} from '../src/sim/strike';
import type { EntityState, GameAction, SimulationSnapshot } from '../src/sim/types';
import { World } from '../src/sim/world';
import { ANCHORS, feet, poseAnchors, dist, pathLength } from './helpers/anchors';

const SQUARE4 = STRIKES.square4;
const SQUARE5 = STRIKES.square5;

const close = (a: readonly number[], b: readonly number[]): boolean => dist(a as Vec2, b as Vec2) < 1e-3;

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

/** Runs the combo up to square 5 (each link chained when its window opens). */
function square5World(): { world: World; x0: number } {
  const world = playingWorld();
  const x0 = player(world.snapshot()).x;
  world.step(['light-attack']);
  hold(world, 20, []);
  world.step(['light-attack']);
  hold(world, 14, []);
  world.step(['light-attack']);
  assert.equal(world.snapshot().strike?.id, 'square3');
  hold(world, 21, []);
  world.step(['light-attack']);
  assert.equal(world.snapshot().strike?.id, 'square4');
  hold(world, 15, []);
  assert.equal(world.snapshot().strike?.tick, 15);
  world.step(['light-attack']);
  return { world, x0 };
}

describe('square-5 strike data', () => {
  it('runs load 3, orbit 5 + 5, rise 8, hold 5 and recall 8 ticks (34), throwing both blades', () => {
    assert.deepEqual(
      SQUARE5.phases.map((p) => [p.id, p.ticks]),
      [['load', 3], ['orbit', 5], ['orbit2', 5], ['rise', 8], ['hold', 5], ['recall', 8]],
    );
    assert.equal(strikeLength(SQUARE5), 34);
    for (const hand of ['near', 'far'] as const) {
      for (const phase of SQUARE5.phases) assert.ok(SQUARE5.blades[hand]?.motion[phase.id], `${hand} ${phase.id}`);
    }
  });

  it('turns one way only (profile, back, inverted profile, front), never flipping the sprite', () => {
    assert.deepEqual(SQUARE5.phases.map((p) => p.pose), ['sq4-a', 'sq4-b', 'sq4-b2', 'sq4-c', 'sq4-d', 'sq4-e']);
    const yaw = (pose: string): number => {
      const file = JSON.parse(readFileSync(new URL(`../scripts/pose_render/poses/${pose}.json`, import.meta.url), 'utf-8'));
      return file.camera_yaw_deg ?? 20;
    };
    const turn = ['sq4-a', 'sq4-b', 'sq4-b2', 'sq4-c'].map(yaw);
    const steps = turn.slice(1).map((y, i) => y - turn[i]);
    assert.ok(steps.every((d) => d < 0), `camera yaw steps ${steps.join(', ')} keep one direction`);
    assert.ok(steps.every((d) => Math.abs(d) <= 120), 'no step turns more than 120 degrees');
  });

  it('anchors each track on its shoulder in the front pose', () => {
    assert.ok(dist(feet(ANCHORS['kratos-sq4-c'].shoulder), SQUARE5.blades.near!.shoulder) < 0.2);
    assert.ok(dist(feet(ANCHORS['kratos-sq4-c'].farShoulder), SQUARE5.blades.far!.shoulder) < 0.2);
  });

  it('crosses the blades at waist height, then raises one vertical crescent on each side, 70-90 px out', () => {
    // Orbit: the near blade goes from the front to the back in front of the body, the far one the other way behind it.
    const nearStart = thrownBladeAt(SQUARE5, 3, poseAnchors, 'near');
    const nearCross = thrownBladeAt(SQUARE5, 13, poseAnchors, 'near');
    const farStart = thrownBladeAt(SQUARE5, 3, poseAnchors, 'far');
    const farCross = thrownBladeAt(SQUARE5, 13, poseAnchors, 'far');
    assert.ok(nearStart.pos[0] > 20 && nearCross.pos[0] < -20, 'near blade front -> back');
    assert.ok(farStart.pos[0] < -20 && farCross.pos[0] > 20, 'far blade back -> front');
    for (const b of [nearStart, nearCross, farStart, farCross]) assert.ok(b.pos[1] > -32, 'at waist height');
    // An ellipse, not one flat line: the front pass is lower than the back pass.
    const nearMid = thrownBladeAt(SQUARE5, 8, poseAnchors, 'near');
    const farMid = thrownBladeAt(SQUARE5, 8, poseAnchors, 'far');
    assert.ok(farMid.pos[1] - nearMid.pos[1] <= -6, `front pass ${(-nearMid.pos[1]).toFixed(1)} px up, back pass ${(-farMid.pos[1]).toFixed(1)} px up`);
    assert.equal(nearMid.behindBody, false, 'near blade crosses in front of the body');
    assert.equal(farMid.behindBody, true, 'far blade crosses behind it');
    // Rise: each side goes up and out, then over toward the head.
    const extent = (hand: Hand): { minX: number; maxX: number; top: number } => {
      let minX = 0;
      let maxX = 0;
      let top = 0;
      for (let t = 13; t <= 26; t += 0.25) {
        const p = thrownBladeAt(SQUARE5, t, poseAnchors, hand).pos;
        minX = Math.min(minX, p[0]);
        maxX = Math.max(maxX, p[0]);
        top = Math.min(top, p[1]);
      }
      return { minX, maxX, top };
    };
    const near = extent('near');
    const far = extent('far');
    assert.ok(-near.minX >= 70 && -near.minX <= 90, `back crescent ${(-near.minX).toFixed(1)} px out`);
    assert.ok(far.maxX >= 70 && far.maxX <= 90, `front crescent ${far.maxX.toFixed(1)} px out`);
    assert.ok(near.top < -65, `near loop tops ${(-near.top).toFixed(1)} px up`);
    assert.ok(far.top < -50 && far.top > near.top + 5, `far loop is lower (${(-far.top).toFixed(1)} px up)`);
  });

  it('loops out of phase and ends asymmetric: near overhead first, far out in front later', () => {
    const nearDone = thrownBladeAt(SQUARE5, 21, poseAnchors, 'near');
    const farThen = thrownBladeAt(SQUARE5, 21, poseAnchors, 'far');
    assert.equal(nearDone.s, 1, 'the near loop is over when the hold starts');
    assert.ok(farThen.s < 0.9, `the far loop is still going (s ${farThen.s.toFixed(2)})`);
    const nearEnd = thrownBladeAt(SQUARE5, 25, poseAnchors, 'near').pos;
    const farEnd = thrownBladeAt(SQUARE5, 25, poseAnchors, 'far').pos;
    assert.ok(nearEnd[0] < 0 && nearEnd[1] < -65, `near ends overhead (${nearEnd.map((v) => v.toFixed(0))})`);
    assert.ok(farEnd[0] > 25 && farEnd[1] > -60, `far ends out in front, lower (${farEnd.map((v) => v.toFixed(0))})`);
  });

  it('never lets a trail float away: its head is within 2 px of its blade on every tick', () => {
    for (const hand of ['near', 'far'] as const) {
      for (let tick = 0; tick < strikeLength(SQUARE5); tick += 1) {
        const points = strikeTrailAt(SQUARE5, tick, poseAnchors, hand).points;
        if (points.length === 0) continue;
        const head = points[points.length - 1];
        const blade = bladeAt(SQUARE5, hand, tick, poseAnchors).pos;
        assert.ok(dist(head, blade) <= 2, `${hand} trail head ${dist(head, blade).toFixed(1)} px from its blade on tick ${tick}`);
      }
    }
  });

  it('moves both blades continuously: no jump over 30 px per tick, none at phase changes', () => {
    for (const hand of ['near', 'far'] as const) {
      let prev = bladeAt(SQUARE5, hand, 0, poseAnchors).pos;
      for (let t = 1; t < strikeLength(SQUARE5); t += 1) {
        const pos = bladeAt(SQUARE5, hand, t, poseAnchors).pos;
        assert.ok(dist(prev, pos) <= 30, `${hand}: jump of ${dist(prev, pos).toFixed(1)} px on tick ${t}`);
        prev = pos;
      }
      let at = 0;
      for (const phase of SQUARE5.phases.slice(0, -1)) {
        at += phase.ticks;
        const before = bladeAt(SQUARE5, hand, at - 1e-6, poseAnchors).pos;
        const after = bladeAt(SQUARE5, hand, at, poseAnchors).pos;
        assert.ok(dist(before, after) < 1, `${hand}: jump of ${dist(before, after).toFixed(2)} px entering tick ${at}`);
      }
    }
  });

  it('carries each blade from where square 4 left it', () => {
    const entry: StrikeEntry = { id: 'square4', tick: 12, offsetPx: strikeAdvanceAt(SQUARE4, 11), turned: false };
    for (const hand of ['near', 'far'] as const) {
      const left = bladeAt(SQUARE4, hand, 12, poseAnchors).pos;
      const start = bladeAt(SQUARE5, hand, 0, poseAnchors, entry).pos;
      assert.ok(dist(start, [left[0] - entry.offsetPx, left[1]]) < 1e-6, `${hand} blade`);
    }
  });

  it('points each arm at its blade from the rise to the end of the hold (within 40 degrees)', () => {
    // From the second rise tick (on the first one the near blade is still at the back waist) to the end of the hold.
    for (let t = 14; t < 26; t += 1) {
      const pose = strikePoseAt(SQUARE5, t);
      const a = ANCHORS[`kratos-${pose}`];
      const adv = strikeAdvanceAt(SQUARE5, t);
      for (const [hand, shoulderKey, handKey] of [['near', 'shoulder', 'hand'], ['far', 'farShoulder', 'farHand']] as const) {
        const shoulder = feet(a[shoulderKey]);
        const grip = feet(a[handKey]);
        const blade = thrownBladeAt(SQUARE5, t, poseAnchors, hand).pos;
        const arm = Math.atan2(grip[1] - shoulder[1], grip[0] - shoulder[0]);
        const toBlade = Math.atan2(blade[1] - shoulder[1], blade[0] - adv - shoulder[0]);
        const off = Math.abs(((arm - toBlade + 3 * Math.PI) % (2 * Math.PI)) - Math.PI);
        assert.ok(off <= (40 * Math.PI) / 180, `tick ${t} (${pose}) ${hand}: arm ${((off * 180) / Math.PI).toFixed(0)} degrees off`);
      }
    }
  });

  it('keeps each trail at most 55 px long', () => {
    for (const hand of ['near', 'far'] as const) {
      for (let tick = 0; tick < strikeLength(SQUARE5); tick += 1) {
        const length = pathLength(strikeTrailAt(SQUARE5, tick, poseAnchors, hand).points);
        assert.ok(length <= 55, `${hand} trail ${length.toFixed(1)} px on tick ${tick}`);
      }
    }
  });

  it('hits with both blades from the orbit to the end of the hold; chains from square 4', () => {
    assert.deepEqual(strikeActiveTicks(SQUARE5), { first: 4, last: 25 });
    assert.ok(strikeHitSegment(SQUARE5, 6, 'near') && strikeHitSegment(SQUARE5, 6, 'far'));
    const chain = strikeChainTicks(SQUARE4)!;
    assert.equal(chain.opens, 15);
    assert.ok(chain.buffersFrom <= chain.opens);
    assert.equal(SQUARE4.chain?.into, 'square5');
  });
});

describe('square 5 hits', () => {
  it('hits an enemy in front and one behind, each once', () => {
    const world = playingWorld();
    const snap = world.snapshot();
    const kratos: EntityState = { ...player(snap) };
    const template = new World();
    template.loadScenario('legionnaire');
    const foe = template.snapshot().entities.find((e) => e.kind === 'legionnaire')!;
    const front: EntityState = { ...foe, id: 'front', x: kratos.x + 30, y: kratos.y, hp: 100, isDead: false, aiState: 'approach' };
    const behind: EntityState = { ...foe, id: 'behind', x: kratos.x - 30, y: kratos.y, hp: 100, isDead: false, aiState: 'approach' };
    const state = startStrike(kratos, 'square5');
    const hitsBy: string[] = [];
    for (let i = 0; i < strikeLength(SQUARE5); i += 1) {
      const result = stepStrike(state, kratos, [front, behind], -1e6, 1e6);
      hitsBy.push(...result.hits.map((h) => h.target.id));
      if (result.done) break;
    }
    assert.deepEqual([...hitsBy].sort(), ['behind', 'front']);
    assert.equal(front.hp, 100 - SQUARE5.damage);
    assert.equal(behind.hp, 100 - SQUARE5.damage);
  });
});

describe('square 4 -> square 5 in the world', () => {
  it('chains on J during the square-3 hold and runs 34 ticks, stepping 2 px', () => {
    const { world, x0 } = square5World();
    const strike = world.snapshot().strike;
    assert.ok(strike);
    assert.equal(strike.id, 'square5');
    assert.equal(strike.tick, 0);
    assert.equal(strike.entry?.id, 'square4');
    hold(world, 33, []);
    assert.equal(world.snapshot().strike?.tick, 33);
    world.step([]);
    assert.equal(world.snapshot().strike, undefined);
    assert.ok(Math.abs(player(world.snapshot()).x - x0 - 19) < 1e-6, 'squares 1 to 5 step 7, 5, 2, 3 and 2 px');
  });

  it('ignores J pressed in square 5 before its hit window: the combo ends after square 5', () => {
    const { world } = square5World();
    world.step(['light-attack']);
    assert.equal(world.snapshot().strike?.queued, false);
    hold(world, 32, []);
    assert.equal(world.snapshot().strike?.id, 'square5');
    world.step([]);
    assert.equal(world.snapshot().strike, undefined);
  });

  it('can turn around at the square 4 -> square 5 link', () => {
    const world = playingWorld();
    world.step(['light-attack']);
    hold(world, 20, []);
    world.step(['light-attack']);
    hold(world, 14, []);
    world.step(['light-attack']);
    hold(world, 21, []);
    world.step(['light-attack']);
    hold(world, 11, []);
    hold(world, 4, ['move-left']);
    world.step(['light-attack', 'move-left']);
    assert.equal(world.snapshot().strike?.id, 'square5');
    assert.equal(world.snapshot().strike?.facing, -1);
    assert.equal(world.snapshot().strike?.entry?.turned, true);
  });
});
