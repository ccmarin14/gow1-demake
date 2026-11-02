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

describe('square-3 strike data', () => {
  it('throws the near blade over load 3, rise 4, sweep 5, throw 4, hold 6, recall 7 (29 ticks)', () => {
    assert.equal(SQUARE3.hand, 'near');
    assert.deepEqual(
      SQUARE3.phases.map((p) => [p.id, p.ticks]),
      [['load', 3], ['rise', 4], ['sweep', 5], ['throw', 4], ['hold', 6], ['recall', 7]],
    );
    assert.equal(strikeLength(SQUARE3), 29);
  });

  it('anchors the blade track on the near shoulder of the throw pose', () => {
    const shoulder = feet(ANCHORS['kratos-sq3-d'].shoulder);
    assert.ok(dist(shoulder, SQUARE3.blades.near!.shoulder) < 0.2, `shoulder ${SQUARE3.blades.near!.shoulder} vs anchors ${shoulder}`);
  });

  it('rises behind to overhead, then reaches 70 to 90 px ahead, level at chest height', () => {
    const tip = thrownBladeAt(SQUARE3, 16, poseAnchors).pos;
    assert.ok(tip[0] >= 70 && tip[0] <= 90, `reach ${tip[0].toFixed(1)} px`);
    assert.ok(tip[1] <= -22 && tip[1] >= -36, `tip at ${(-tip[1]).toFixed(1)} px up (chest)`);
    let peak: Vec2 = [0, 0];
    for (let t = 3; t <= 16; t += 0.25) {
      const pos = thrownBladeAt(SQUARE3, t, poseAnchors).pos;
      if (pos[1] < peak[1]) peak = pos;
    }
    assert.ok(peak[1] < -60, `the arc tops at ${(-peak[1]).toFixed(1)} px up`);
    assert.ok(Math.abs(peak[0]) < 25, `the top is ${peak[0].toFixed(1)} px from the feet (over the head)`);
    assert.equal(thrownBladeAt(SQUARE3, 4, poseAnchors).behindBody, true, 'behind the body on the rise');
    assert.equal(thrownBladeAt(SQUARE3, 14, poseAnchors).behindBody, false, 'in front on the way down');
  });

  it('keeps the trail at most 55 px long (the restrained default); square 1 and 2 keep their approved length', () => {
    const length = (points: readonly Vec2[]): number =>
      points.slice(1).reduce((sum, p, i) => sum + dist(p, points[i]), 0);
    for (let tick = 0; tick < strikeLength(SQUARE3); tick += 1) {
      const trail = strikeTrailAt(SQUARE3, tick, poseAnchors);
      assert.ok(length(trail.points) <= 55 + 12, `trail ${length(trail.points).toFixed(1)} px on tick ${tick}`);
    }
    assert.equal(SQUARE3.blades.near?.trail?.maxLengthPx, undefined, 'square 3 uses the default cap');
  });

  it('opens the arms in the hold: the far blade goes out behind on a 20-25 px chain at chest height, with no trail', () => {
    const holdEnd = 21;
    const far = farBladeAt(SQUARE3, holdEnd, poseAnchors);
    const hand = feet(ANCHORS['kratos-sq3-e'].farHand);
    const adv = strikeAdvanceAt(SQUARE3, holdEnd);
    const reach = dist(far.pos, [hand[0] + adv, hand[1]]);
    assert.ok(reach >= 20 && reach <= 25, `far chain ${reach.toFixed(1)} px`);
    assert.ok(far.pos[0] < hand[0] + adv, 'behind the far hand');
    assert.ok(far.pos[1] <= -22 && far.pos[1] >= -36, `far blade ${(-far.pos[1]).toFixed(1)} px up`);
    assert.equal(far.chainOut, true);
    assert.equal(far.behindBody, true);
    assert.equal(strikeTrailAt(SQUARE3, holdEnd, poseAnchors, 'far').points.length, 0);
    assert.equal(strikeHitSegment(SQUARE3, holdEnd, 'far'), null, 'the far blade does not hit');
    // Held in the far hand until the arms open.
    assert.equal(bladeMotionAt(SQUARE3, 'far', 15).motion, undefined);
  });

  it('moves the near blade continuously from the near hand: no jump over 30 px per tick, none at phase changes', () => {
    const start = nearBladeAt(SQUARE3, 0, poseAnchors).pos;
    const hand = feet(ANCHORS['kratos-sq3-a'].hand);
    assert.ok(dist(start, [hand[0], hand[1] + 5]) < 1e-6, 'starts hanging under the near hand');
    let prev = start;
    for (let t = 1; t < strikeLength(SQUARE3); t += 1) {
      const pos = nearBladeAt(SQUARE3, t, poseAnchors).pos;
      assert.ok(dist(prev, pos) <= 30, `jump of ${dist(prev, pos).toFixed(1)} px on tick ${t}`);
      prev = pos;
    }
    let at = 0;
    for (const phase of SQUARE3.phases.slice(0, -1)) {
      at += phase.ticks;
      const before = nearBladeAt(SQUARE3, at - 1e-6, poseAnchors).pos;
      const after = nearBladeAt(SQUARE3, at, poseAnchors).pos;
      assert.ok(dist(before, after) < 1, `jump of ${dist(before, after).toFixed(2)} px entering tick ${at}`);
    }
  });

  it('yanks the far blade back from square 2\'s throw into the far hand', () => {
    const { opens } = strikeChainTicks(SQUARE2)!;
    for (let k = opens; k < strikeLength(SQUARE2); k += 1) {
      const entry = entryFrom(SQUARE2, k);
      const left = farBladeAt(SQUARE2, entry.tick, poseAnchors).pos;
      const start = farBladeAt(SQUARE3, 0, poseAnchors, entry).pos;
      assert.ok(dist(start, [left[0] - entry.offsetPx, left[1]]) < 1e-6, `starts where square 2 left it (tick ${k})`);
      let prev = start;
      for (let t = 1; t < strikeLength(SQUARE3); t += 1) {
        const pos = farBladeAt(SQUARE3, t, poseAnchors, entry).pos;
        assert.ok(dist(prev, pos) <= 22, `far blade jumps ${dist(prev, pos).toFixed(1)} px on tick ${t} (entry ${k})`);
        prev = pos;
      }
    }
  });

  it('points the near arm at its blade while it is thrown (within 40 degrees from the shoulder)', () => {
    // From the second rise tick (the first one starts the swing low behind) to the end of the hold.
    for (let t = 4; t < 22; t += 1) {
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

  it('hits from the way down in front to the end of the hold; chains from square 2', () => {
    const { first, last } = strikeActiveTicks(SQUARE3);
    assert.ok(first >= 12 && first <= 14, `first hit tick ${first} (early in the throw)`);
    assert.equal(last, 21);
    assert.deepEqual(strikeChainTicks(SQUARE2), { opens: 14, buffersFrom: 7 });
    assert.equal(SQUARE2.chain?.into, 'square3');
  });
});

describe('square 2 -> square 3 in the world', () => {
  it('chains on J during the square-2 hold and runs 29 ticks, stepping 5 px', () => {
    const { world, x0 } = square3World();
    const strike = world.snapshot().strike;
    assert.ok(strike);
    assert.equal(strike.id, 'square3');
    assert.equal(strike.tick, 0);
    assert.equal(strike.entry?.id, 'square2');
    assert.equal(strike.entry?.entry?.id, 'square1');
    hold(world, 28, []);
    assert.equal(world.snapshot().strike?.tick, 28);
    world.step([]);
    assert.equal(world.snapshot().strike, undefined);
    assert.ok(Math.abs(player(world.snapshot()).x - x0 - 17) < 1e-6, 'squares 1, 2 and 3 step 7, 5 and 5 px');
  });

  it('ignores J pressed in square 3 before its hit window: the combo ends after square 3', () => {
    const { world } = square3World();
    world.step([]);
    world.step(['light-attack']);
    assert.equal(world.snapshot().strike?.queued, false);
    hold(world, 26, []);
    assert.equal(world.snapshot().strike?.id, 'square3');
    world.step([]);
    assert.equal(world.snapshot().strike, undefined);
  });

  it('hits the legionnaire with all three strikes; square 3 connects on the way down in front and freezes there', () => {
    const world = new World();
    world.loadScenario('legionnaire');
    const hp0 = enemy(world.snapshot()).hp;
    world.step(['light-attack']);
    let hit3: { tick: number; hitstop: number; originX: number; ex: number } | null = null;
    let started3 = false;
    for (let i = 0; i < 140; i += 1) {
      const before = world.snapshot().strike;
      started3 ||= before?.id === 'square3';
      world.step(i % 5 === 0 && !started3 ? ['light-attack'] : []);
      const snap = world.snapshot();
      if (!hit3 && snap.strike?.id === 'square3' && snap.strike.hits.length > 0) {
        hit3 = { tick: snap.strike.tick, hitstop: snap.hitstopTicks, originX: snap.strike.originX, ex: enemy(snap).x };
      }
    }
    assert.ok(hit3, 'square 3 hits');
    assert.equal(hit3.hitstop, SQUARE3.hitstopTicks);
    const [a, b] = strikeHitSegment(SQUARE3, hit3.tick)!;
    assert.ok(b[1] > a[1], 'the blade is going down on the first contact');
    assert.ok(b[0] > a[0], 'and forward');
    // First touching point of the swept segment: chest or shoulder height.
    const r = SQUARE3.hitRadiusPx;
    let contact = Infinity;
    for (let f = 0; f <= 1; f += 0.01) {
      const x = hit3.originX + a[0] + (b[0] - a[0]) * f;
      const y = a[1] + (b[1] - a[1]) * f;
      if (x >= hit3.ex - 14 - r && x <= hit3.ex + 14 + r && y >= -48 - r) {
        contact = y;
        break;
      }
    }
    assert.ok(contact >= -50 && contact <= -30, `contact at y ${contact.toFixed(1)}`);
    assert.equal(enemy(world.snapshot()).hp, hp0 - SQUARE1.damage - SQUARE2.damage - SQUARE3.damage);
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
