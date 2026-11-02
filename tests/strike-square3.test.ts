import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

import {
  STRIKES,
  bladeMotionAt,
  farBladeAt,
  nearBladeAt,
  strikeActiveTicks,
  strikeAdvanceAt,
  strikeChainTicks,
  strikeHandAt,
  strikeHitSegment,
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

const SQUARE1 = STRIKES.square1;
const SQUARE2 = STRIKES.square2;
const SQUARE3 = STRIKES.square3;
const SQUARE4 = STRIKES.square4;

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

/** Square-2 values recorded from the approved implementation (commit 517c25e), chained on square-1 tick 20. */
const SQ2_FIXTURE: {
  entry: { id: 'square1'; tick: number; offsetPx: number };
  samples: {
    t: number; near: number[]; nearChain: boolean; nearSag: number; nearDeg: number; nearBehind: boolean;
    far: number[]; farChain: boolean; farSag: number; farDeg: number; farBehind: boolean; s: number; adv: number;
  }[];
  ticks: { tick: number; pose: string; trailWidth: number; trail: number[][]; trailS: number[]; pivot: number[]; hit: number[][] | null }[];
} = JSON.parse(readFileSync(new URL('./fixtures/square2-track.json', import.meta.url), 'utf-8'));

/** Entry of `next` chained when `def` was on tick `tick`. */
const entryFrom = (def: typeof SQUARE1, tick: number, turned = false): StrikeEntry => ({
  id: def.id,
  tick: Math.min(tick + 1, strikeLength(def) - 1),
  offsetPx: strikeAdvanceAt(def, tick),
  turned,
});

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

function enemy(snapshot: SimulationSnapshot): EntityState {
  const found = snapshot.entities.find((e) => e.kind === 'legionnaire');
  assert.ok(found);
  return found;
}

function hold(world: World, ticks: number, actions: GameAction[]): void {
  for (let i = 0; i < ticks; i += 1) world.step(actions);
}

/** Runs the combo up to square 3 (chained on the holds), with no enemy to freeze it. */
function square3World(): { world: World; x0: number } {
  const world = playingWorld();
  const x0 = player(world.snapshot()).x;
  world.step(['light-attack']);
  hold(world, 20, []);
  world.step(['light-attack']);
  hold(world, 14, []);
  assert.equal(world.snapshot().strike?.id, 'square2');
  assert.equal(world.snapshot().strike?.tick, 14);
  world.step(['light-attack']);
  return { world, x0 };
}

describe('square-2 is unchanged as approved', () => {
  it('keeps every blade position, chain, depth, pose, trail and hit segment of commit 517c25e', () => {
    const entry: StrikeEntry = { ...SQ2_FIXTURE.entry, turned: false };
    for (const q of SQ2_FIXTURE.samples) {
      const near = nearBladeAt(SQUARE2, q.t, poseAnchors, entry);
      const far = farBladeAt(SQUARE2, q.t, poseAnchors, entry);
      assert.ok(close(near.pos, q.near), `near blade at ${q.t}`);
      assert.equal(near.chainOut, q.nearChain);
      assert.ok(Math.abs(near.sagPx - q.nearSag) < 1e-3);
      assert.equal(near.deg, q.nearDeg);
      assert.equal(near.behindBody, q.nearBehind);
      assert.ok(close(far.pos, q.far), `far blade at ${q.t}`);
      assert.equal(far.chainOut, q.farChain);
      assert.ok(Math.abs(far.sagPx - q.farSag) < 1e-3);
      assert.equal(far.deg, q.farDeg);
      assert.equal(far.behindBody, q.farBehind);
      assert.ok(Math.abs(far.s - q.s) < 1e-3);
      assert.ok(Math.abs(strikeAdvanceAt(SQUARE2, q.t) - q.adv) < 1e-3);
    }
    for (const k of SQ2_FIXTURE.ticks) {
      assert.equal(strikePoseAt(SQUARE2, k.tick), k.pose);
      const trail = strikeTrailAt(SQUARE2, k.tick, poseAnchors);
      assert.equal(trail.widthPx, k.trailWidth);
      assert.equal(trail.points.length, k.trail.length, `trail length on tick ${k.tick}`);
      trail.points.forEach((p, i) => assert.ok(close(p, k.trail[i]), `trail point ${i} on tick ${k.tick}`));
      trail.s.forEach((s, i) => assert.ok(Math.abs(s - k.trailS[i]) < 1e-3));
      assert.ok(close(trail.pivot, k.pivot));
      const hit = strikeHitSegment(SQUARE2, k.tick);
      assert.equal(hit === null, k.hit === null);
      if (hit && k.hit) assert.ok(close(hit[0], k.hit[0]) && close(hit[1], k.hit[1]));
    }
  });
});

describe('square-3 strike data (the ascending cut)', () => {
  it('throws the near blade over load 3, cut 5, top 3, hold 7 and recall 8 (26 ticks)', () => {
    assert.equal(SQUARE3.hand, 'near');
    assert.deepEqual(
      SQUARE3.phases.map((p) => [p.id, p.ticks]),
      [['load', 3], ['cut', 5], ['top', 3], ['hold', 7], ['recall', 8]],
    );
    assert.equal(strikeLength(SQUARE3), 26);
  });

  it('anchors the blade track on the near shoulder of the cut, and ends with Kratos upright', () => {
    assert.ok(dist(feet(ANCHORS['kratos-sq3-g'].shoulder), SQUARE3.blades.near!.shoulder) < 0.2);
    assert.ok(-feet(ANCHORS['kratos-sq3-h'].shoulder)[1] >= 32, 'upright at the top');
  });

  it('cuts upward in front of him, from low ahead to over the head in front', () => {
    const start = thrownBladeAt(SQUARE3, 3, poseAnchors).pos;
    assert.ok(start[0] >= 25 && start[1] > -14, `starts low ahead (${start.map((v) => v.toFixed(0))})`);
    let prevY = Infinity;
    for (let t = 3; t <= 11; t += 0.5) {
      const p = thrownBladeAt(SQUARE3, t, poseAnchors).pos;
      assert.ok(p[0] > 10, `in front of the body at ${t}`);
      assert.ok(p[1] < prevY + 0.5, `rising at ${t}`);
      prevY = p[1];
    }
    const top = thrownBladeAt(SQUARE3, 11, poseAnchors).pos;
    assert.ok(top[1] < -60 && top[0] > 5 && top[0] < 35, `stops high in front (${top.map((v) => v.toFixed(0))})`);
  });

  it('points the near arm at its blade from the cut through the hold (within 40 degrees)', () => {
    for (let t = 4; t < 18; t += 1) {
      if (t === 8) continue; // first tick of the top: the blade is still mid-cut
      const pose = strikePoseAt(SQUARE3, t);
      const a = ANCHORS[`kratos-${pose}`];
      const shoulder = feet(a.shoulder);
      const hand = feet(a.hand);
      const blade = thrownBladeAt(SQUARE3, t, poseAnchors).pos;
      const adv = strikeAdvanceAt(SQUARE3, t);
      const arm = Math.atan2(hand[1] - shoulder[1], hand[0] - shoulder[0]);
      const toBlade = Math.atan2(blade[1] - shoulder[1], blade[0] - adv - shoulder[0]);
      const off = Math.abs(((arm - toBlade + 3 * Math.PI) % (2 * Math.PI)) - Math.PI);
      assert.ok(off <= (40 * Math.PI) / 180, `tick ${t} (${pose}): arm ${((off * 180) / Math.PI).toFixed(0)} degrees off the blade`);
    }
  });

  it('keeps the trail at most 55 px long and on its blade', () => {
    for (const def of [SQUARE3, SQUARE4]) {
      for (let tick = 0; tick < strikeLength(def); tick += 1) {
        const points = strikeTrailAt(def, tick, poseAnchors).points;
        const length = points.slice(1).reduce((sum, p, i) => sum + dist(p, points[i]), 0);
        assert.ok(length <= 55, `${def.id} trail ${length.toFixed(1)} px on tick ${tick}`);
        if (points.length) assert.ok(dist(points[points.length - 1], nearBladeAt(def, tick, poseAnchors).pos) <= 2);
      }
    }
  });

  it('hits from the start of the rise through the hold; its chain window to square 4 is at the top', () => {
    const { first, last } = strikeActiveTicks(SQUARE3);
    assert.ok(first >= 3 && first <= 5, `first hit tick ${first}`);
    assert.equal(last, 17);
    assert.deepEqual(strikeChainTicks(SQUARE3), { opens: 14, buffersFrom: first });
    assert.equal(SQUARE3.chain?.into, 'square4');
    assert.deepEqual(strikeChainTicks(SQUARE2), { opens: 14, buffersFrom: 7 });
    assert.equal(SQUARE2.chain?.into, 'square3');
  });

  it('keeps the far blade, yanked back from square 2, in the far hand', () => {
    const entry = entryFrom(SQUARE2, 14);
    const left = farBladeAt(SQUARE2, entry.tick, poseAnchors).pos;
    const start = farBladeAt(SQUARE3, 0, poseAnchors, entry).pos;
    assert.ok(dist(start, [left[0] - entry.offsetPx, left[1]]) < 1e-6, 'starts where square 2 left it');
    const hand = strikeHandAt(SQUARE3, 12, poseAnchors, 'far');
    assert.ok(dist(farBladeAt(SQUARE3, 12, poseAnchors, entry).pos, [hand[0], hand[1] + 5]) < 1e-6, 'hangs from the far hand');
  });
});

describe('square-4 strike data (the descending cut)', () => {
  it('runs carry 2, throw 5, hold 6 and recall 7 (20 ticks)', () => {
    assert.deepEqual(
      SQUARE4.phases.map((p) => [p.id, p.ticks]),
      [['carry', 2], ['throw', 5], ['hold', 6], ['recall', 7]],
    );
    assert.equal(strikeLength(SQUARE4), 20);
  });

  it('starts where square 3 stops at the top', () => {
    const entry = entryFrom(SQUARE3, 14);
    const top = nearBladeAt(SQUARE3, entry.tick, poseAnchors).pos;
    const start = nearBladeAt(SQUARE4, 0, poseAnchors, entry).pos;
    assert.ok(dist(start, [top[0] - entry.offsetPx, top[1]]) < 1e-6, 'carried from the top');
    assert.ok(dist(nearBladeAt(SQUARE4, 2, poseAnchors, entry).pos, start) < 3, 'the track starts there');
  });

  it('cuts a long diagonal down in front to stop level at chest height, 70 to 90 px out', () => {
    let prev: Vec2 = thrownBladeAt(SQUARE4, 2, poseAnchors).pos;
    for (let t = 2.5; t <= 7; t += 0.5) {
      const p = thrownBladeAt(SQUARE4, t, poseAnchors).pos;
      assert.ok(p[0] > prev[0] - 0.01 && p[1] > prev[1] - 0.5, `down and forward at ${t}`);
      prev = p;
    }
    const tip = thrownBladeAt(SQUARE4, 7, poseAnchors).pos;
    assert.ok(tip[0] >= 70 && tip[0] <= 90, `reach ${tip[0].toFixed(1)} px`);
    assert.ok(tip[1] <= -22 && tip[1] >= -36, `at chest height (${(-tip[1]).toFixed(1)} px up)`);
  });

  it('opens the arms in the hold: the far blade goes out behind on a 20-25 px chain at chest height, with no trail', () => {
    const holdEnd = 12;
    const far = farBladeAt(SQUARE4, holdEnd, poseAnchors);
    const hand = feet(ANCHORS['kratos-sq3-e'].farHand);
    const adv = strikeAdvanceAt(SQUARE4, holdEnd);
    const reach = dist(far.pos, [hand[0] + adv, hand[1]]);
    assert.ok(reach >= 20 && reach <= 25, `far chain ${reach.toFixed(1)} px`);
    assert.ok(far.pos[0] < hand[0] + adv, 'behind the far hand');
    assert.equal(far.chainOut, true);
    assert.equal(strikeTrailAt(SQUARE4, holdEnd, poseAnchors, 'far').points.length, 0);
    assert.equal(strikeHitSegment(SQUARE4, holdEnd, 'far'), null);
  });

  it('points the near arm at its blade on the way down and in the hold (within 40 degrees)', () => {
    for (let t = 3; t < 13; t += 1) {
      const pose = strikePoseAt(SQUARE4, t);
      const a = ANCHORS[`kratos-${pose}`];
      const shoulder = feet(a.shoulder);
      const hand = feet(a.hand);
      const blade = thrownBladeAt(SQUARE4, t, poseAnchors).pos;
      const adv = strikeAdvanceAt(SQUARE4, t);
      const arm = Math.atan2(hand[1] - shoulder[1], hand[0] - shoulder[0]);
      const toBlade = Math.atan2(blade[1] - shoulder[1], blade[0] - adv - shoulder[0]);
      const off = Math.abs(((arm - toBlade + 3 * Math.PI) % (2 * Math.PI)) - Math.PI);
      assert.ok(off <= (40 * Math.PI) / 180, `tick ${t} (${pose}): arm ${((off * 180) / Math.PI).toFixed(0)} degrees off the blade`);
    }
  });

  it('chains into square 5 (the spin) from its hold', () => {
    assert.equal(SQUARE4.chain?.into, 'square5');
    assert.equal(strikeChainTicks(SQUARE4)?.opens, 11);
  });
});

describe('squares 2 -> 3 -> 4 in the world', () => {
  it('chains square 3 on the square-2 hold and square 4 on the square-3 top; steps 2 and 3 px', () => {
    const { world, x0 } = square3World();
    assert.equal(world.snapshot().strike?.id, 'square3');
    assert.equal(world.snapshot().strike?.entry?.id, 'square2');
    hold(world, 14, []);
    world.step(['light-attack']);
    assert.equal(world.snapshot().strike?.id, 'square4');
    assert.equal(world.snapshot().strike?.entry?.id, 'square3');
    hold(world, 19, []);
    assert.equal(world.snapshot().strike?.tick, 19);
    world.step([]);
    assert.equal(world.snapshot().strike, undefined);
    assert.ok(Math.abs(player(world.snapshot()).x - x0 - 17) < 1e-6, 'squares 1 to 4 step 7, 5, 2 and 3 px');
  });

  it('ends after square 3 when J is not pressed again', () => {
    const { world } = square3World();
    hold(world, 25, []);
    assert.equal(world.snapshot().strike?.id, 'square3');
    world.step([]);
    assert.equal(world.snapshot().strike, undefined);
  });

  it('hits a close legionnaire with square 3 on the way up, in front', () => {
    const world = new World();
    world.loadScenario('legionnaire');
    world.step(['light-attack']);
    let hit3: { tick: number; hitstop: number } | null = null;
    let started3 = false;
    for (let i = 0; i < 100 && !hit3; i += 1) {
      const before = world.snapshot().strike;
      started3 ||= before?.id === 'square3';
      world.step(i % 5 === 0 && !started3 ? ['light-attack'] : []);
      const snap = world.snapshot();
      if (snap.strike?.id === 'square3' && snap.strike.hits.length > 0) hit3 = { tick: snap.strike.tick, hitstop: snap.hitstopTicks };
    }
    assert.ok(hit3, 'square 3 hits');
    assert.equal(hit3.hitstop, SQUARE3.hitstopTicks);
    const [a, b] = strikeHitSegment(SQUARE3, hit3.tick)!;
    assert.ok(b[1] < a[1], 'going up on the first contact');
    assert.ok(b[0] > 10, 'in front of Kratos');
  });
});

describe('triangle from the square chain', () => {
  const pressAt = (strikes: number): World => {
    const world = playingWorld();
    world.step(['light-attack']);
    const waits = [20, 14, 14, 11];
    for (let i = 0; i < strikes - 1; i += 1) {
      hold(world, waits[i], []);
      world.step(['light-attack']);
    }
    hold(world, waits[strikes - 1], []);
    return world;
  };
  for (const n of [1, 2, 3, 4]) {
    it(`starts the plain triangle when I is pressed in square ${n}'s chain window`, () => {
      const world = pressAt(n);
      assert.equal(world.snapshot().strike?.id, `square${n}`);
      world.step(['heavy-attack']);
      const strike = world.snapshot().strike;
      assert.equal(strike?.id, 'triangle');
      assert.equal(strike?.entry?.id, `square${n}`);
    });
  }

  it('turns toward a direction held at the link, and carries the blades from the square instead of drawing them from the back', () => {
    const world = pressAt(3);
    hold(world, 0, []);
    for (let i = 0; i < 4; i += 1) world.step(['move-left']);
    world.step(['heavy-attack', 'move-left']);
    const strike = world.snapshot().strike!;
    assert.equal(strike.id, 'triangle');
    assert.equal(strike.facing, -1);
    const entry = strike.entry!;
    const left = nearBladeAt(SQUARE3, entry.tick, poseAnchors).pos;
    const start = nearBladeAt(STRIKES.triangle, 0, poseAnchors, entry).pos;
    assert.ok(dist(start, [-(left[0] - entry.offsetPx), left[1]]) < 1e-6, 'from where square 3 left it (mirrored)');
  });
});

describe('turning around mid-combo', () => {
  it('turns at each link when the opposite direction is held as the next strike starts', () => {
    const world = playingWorld();
    world.step(['light-attack']);
    hold(world, 16, []);
    hold(world, 4, ['move-left']);
    assert.equal(world.snapshot().strike?.facing, 1, 'the strike itself does not turn');
    world.step(['light-attack', 'move-left']);
    let strike = world.snapshot().strike;
    assert.equal(strike?.id, 'square2');
    assert.equal(strike?.facing, -1);
    assert.equal(strike?.entry?.turned, true);
    assert.equal(player(world.snapshot()).facing, -1);
    const x2 = player(world.snapshot()).x;
    hold(world, 10, ['move-left']);
    hold(world, 4, ['move-right']);
    world.step(['light-attack', 'move-right']);
    strike = world.snapshot().strike;
    assert.equal(strike?.id, 'square3');
    assert.equal(strike?.facing, 1);
    assert.equal(strike?.entry?.turned, true);
    // Square 2 stepped toward its own facing (left), 5 px; turning back moved
    // the feet so the body's centre stayed put.
    const shift = -1 * (SQUARE2.phases.find((p) => p.id === 'hold')!.centerX + SQUARE3.phases[0].centerX);
    assert.ok(Math.abs(player(world.snapshot()).x - (x2 - 5 + shift)) < 1e-6);
  });

  it('keeps the facing when no direction, or the same one, is held', () => {
    const world = playingWorld();
    world.step(['light-attack']);
    hold(world, 20, []);
    world.step(['light-attack', 'move-right']);
    assert.equal(world.snapshot().strike?.facing, 1);
    assert.equal(world.snapshot().strike?.entry?.turned, false);
    hold(world, 14, []);
    world.step(['light-attack']);
    assert.equal(world.snapshot().strike?.id, 'square3');
    assert.equal(world.snapshot().strike?.facing, 1);
  });

  it('turns with a buffered press even if the direction is released before the window opens', () => {
    const world = playingWorld();
    world.step(['light-attack']);
    hold(world, 5, []);
    hold(world, 4, ['move-left']);
    world.step(['light-attack', 'move-left']);
    assert.equal(world.snapshot().strike?.queuedDirection, -1);
    hold(world, 9, []);
    assert.equal(world.snapshot().strike?.id, 'square2');
    assert.equal(world.snapshot().strike?.facing, -1);
  });

  it('mirrors the track and hit box: turning onto an enemy behind hits it', () => {
    const world = new World();
    world.loadScenario('legionnaire');
    // Face away from the legionnaire: square 1 misses.
    world.step(['move-left']);
    hold(world, 3, []);
    const hp0 = enemy(world.snapshot()).hp;
    world.step(['light-attack']);
    hold(world, 14, []);
    hold(world, 4, ['move-right']);
    assert.equal(enemy(world.snapshot()).hp, hp0);
    world.step(['light-attack', 'move-right']);
    assert.equal(world.snapshot().strike?.facing, 1);
    for (let i = 0; i < 30 && enemy(world.snapshot()).hp === hp0; i += 1) world.step([]);
    assert.equal(enemy(world.snapshot()).hp, hp0 - SQUARE2.damage, 'square 2 turned around and hit');
  });

  it('mirrors the returning blade: it starts where the previous strike left it on screen, behind the body', () => {
    const entry = entryFrom(SQUARE1, 20, true);
    const left = nearBladeAt(SQUARE1, entry.tick, poseAnchors).pos;
    const start = nearBladeAt(SQUARE2, 0, poseAnchors, entry);
    assert.ok(dist(start.pos, [-(left[0] - entry.offsetPx), left[1]]) < 1e-6);
    // Behind Kratos' new front, it is drawn behind his body until it passes x 0.
    assert.equal(start.behindBody, true);
    for (let t = 0; t < 9; t += 1) {
      const blade = nearBladeAt(SQUARE2, t, poseAnchors, entry);
      if (blade.chainOut) assert.equal(blade.behindBody, blade.pos[0] < 0, `tick ${t}`);
    }
  });

  it('ignores a direction grazed for fewer than 4 ticks', () => {
    const world = playingWorld();
    world.step(['light-attack']);
    hold(world, 17, []);
    hold(world, 2, ['move-left']);
    world.step(['light-attack', 'move-left']);
    assert.equal(world.snapshot().strike?.id, 'square2');
    assert.equal(world.snapshot().strike?.facing, 1);
  });

  it('keeps the body in place across a turned link (opaque centre moves at most 3 px)', () => {
    const centre = (pose: string): number => {
      const rows = readFileSync(new URL(`../grids/kratos/${pose}.txt`, import.meta.url), 'utf-8').split('\n');
      const xs = rows.flatMap((row) => [...row].flatMap((c, x) => (c === '.' ? [] : [x])));
      return (Math.min(...xs) + Math.max(...xs) + 1) / 2 - 32;
    };
    const world = playingWorld();
    world.step(['light-attack']);
    hold(world, 16, []);
    hold(world, 4, ['move-left']);
    const before = world.snapshot();
    const b1 = before.strike!;
    const was = player(before).x + b1.facing * centre(strikePoseAt(SQUARE1, b1.tick));
    world.step(['light-attack', 'move-left']);
    const after = world.snapshot();
    const now = player(after).x + after.strike!.facing * centre(strikePoseAt(SQUARE2, 0));
    assert.equal(after.strike?.facing, -1);
    assert.ok(Math.abs(now - was) <= 3, `body centre moved ${Math.abs(now - was).toFixed(1)} px`);
  });
});

describe('strike data hygiene', () => {
  it('keeps each phase centreX equal to its grid\'s opaque centre', () => {
    for (const def of Object.values(STRIKES)) {
      for (const phase of def.phases) {
        const rows = readFileSync(new URL(`../grids/kratos/${phase.pose}.txt`, import.meta.url), 'utf-8').split('\n');
        const xs = rows.flatMap((row) => [...row].flatMap((c, x) => (c === '.' ? [] : [x])));
        assert.equal(phase.centerX, (Math.min(...xs) + Math.max(...xs) + 1) / 2 - 32, `${phase.pose}`);
      }
    }
  });

  it('hits a target once per strike even when two blades touch it on the same tick', () => {
    const def = STRIKES.square1 as { blades: Record<string, unknown> };
    def.blades.far = def.blades.near;
    try {
      const world = new World();
      world.loadScenario('legionnaire');
      const hp0 = enemy(world.snapshot()).hp;
      world.step(['light-attack']);
      hold(world, 50, []);
      assert.equal(enemy(world.snapshot()).hp, hp0 - SQUARE1.damage);
    } finally {
      delete def.blades.far;
    }
  });
});
