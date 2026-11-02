import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

import {
  STRIKES,
  chainSagAt,
  farBladeAt,
  nearBladeAt,
  strikeAdvanceAt,
  strikeChainTicks,
  strikeActiveTicks,
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

const ANCHORS: Record<string, { back: number[]; hand: number[]; farHand: number[]; farShoulder: number[] }> = JSON.parse(
  readFileSync(new URL('../src/assets/kratos-anchors.json', import.meta.url), 'utf-8'),
);
const feet = (p: number[]): Vec2 => [p[0] - 32, p[1] - 56];
const poseAnchors: StrikePoseAnchors = (pose) => {
  const a = ANCHORS[`kratos-${pose}`];
  assert.ok(a, `anchors for ${pose}`);
  return { back: feet(a.back), hand: feet(a.hand), farHand: feet(a.farHand) };
};
const dist = (a: Vec2, b: Vec2): number => Math.hypot(a[0] - b[0], a[1] - b[1]);
const close = (a: readonly number[], b: readonly number[]): boolean => dist(a as Vec2, b as Vec2) < 1e-3;

/** Square-1 values recorded from the approved implementation (commit 8c6af9c). */
const SQ1_FIXTURE: {
  samples: { t: number; near: number[]; chainOut: boolean; far: number[]; farDeg: number; sag: number; adv: number }[];
  ticks: { tick: number; pose: string; trailWidth: number; trail: number[][]; hit: number[][] | null }[];
} = JSON.parse(readFileSync(new URL('./fixtures/square1-track.json', import.meta.url), 'utf-8'));

/** Entry of a square 2 chained when square 1 was on tick `tick`. */
const entryAt = (tick: number): StrikeEntry => ({
  id: 'square1',
  tick: Math.min(tick + 1, strikeLength(SQUARE1) - 1),
  offsetPx: strikeAdvanceAt(SQUARE1, tick),
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

/** Runs square 1 until it shows tick `tick` (no hitstop: nothing to hit). */
function square1At(world: World, tick: number): void {
  world.step(['light-attack']);
  hold(world, tick, []);
  assert.equal(world.snapshot().strike?.tick, tick);
}

describe('square-1 is unchanged by the combo model', () => {
  it('keeps every blade position, chain sag, pose, trail and hit segment of the approved version', () => {
    for (const s of SQ1_FIXTURE.samples) {
      const near = nearBladeAt(SQUARE1, s.t, poseAnchors);
      const far = farBladeAt(SQUARE1, s.t, poseAnchors);
      assert.ok(close(near.pos, s.near), `near blade at ${s.t}: ${near.pos} vs ${s.near}`);
      assert.equal(near.chainOut, s.chainOut, `near chain at ${s.t}`);
      assert.ok(close(far.pos, s.far), `far blade at ${s.t}: ${far.pos} vs ${s.far}`);
      assert.equal(far.deg, s.farDeg);
      assert.ok(Math.abs(chainSagAt(SQUARE1, s.t) - s.sag) < 1e-3);
      assert.ok(Math.abs(near.sagPx - s.sag) < 1e-3, `near sag at ${s.t}`);
      assert.ok(Math.abs(strikeAdvanceAt(SQUARE1, s.t) - s.adv) < 1e-3);
    }
    for (const k of SQ1_FIXTURE.ticks) {
      assert.equal(strikePoseAt(SQUARE1, k.tick), k.pose);
      const trail = strikeTrailAt(SQUARE1, k.tick, poseAnchors);
      assert.equal(trail.widthPx, k.trailWidth);
      assert.equal(trail.points.length, k.trail.length, `trail length on tick ${k.tick}`);
      trail.points.forEach((p, i) => assert.ok(close(p, k.trail[i]), `trail point ${i} on tick ${k.tick}`));
      const hit = strikeHitSegment(SQUARE1, k.tick);
      assert.equal(hit === null, k.hit === null);
      if (hit && k.hit) {
        assert.ok(close(hit[0], k.hit[0]) && close(hit[1], k.hit[1]), `hit segment on tick ${k.tick}`);
      }
    }
  });

  it('throws the near blade and holds the far one', () => {
    assert.equal(SQUARE1.hand, 'near');
    assert.equal(SQUARE2.hand, 'far');
  });
});

describe('square-2 strike data', () => {
  it('runs load 3, sweep 3, throw 4, hold 7 and recall 6 ticks (23 in total)', () => {
    assert.deepEqual(
      SQUARE2.phases.map((p) => [p.id, p.ticks]),
      [['load', 3], ['sweep', 3], ['throw', 4], ['hold', 7], ['recall', 6]],
    );
    assert.equal(strikeLength(SQUARE2), 23);
  });

  it('anchors the blade track on the far shoulder of the throw pose', () => {
    const shoulder = feet(ANCHORS['kratos-sq2-c'].farShoulder);
    assert.ok(dist(shoulder, SQUARE2.shoulder) < 0.2, `shoulder ${SQUARE2.shoulder} vs anchors ${shoulder}`);
  });

  it('peaks in front of and above the head, then reaches 70 to 90 px ahead, low', () => {
    const tip = thrownBladeAt(SQUARE2, 10, poseAnchors).pos;
    assert.ok(tip[0] >= 70 && tip[0] <= 90, `reach ${tip[0].toFixed(1)} px`);
    assert.ok(tip[1] > -20 && tip[1] < 0, `tip height ${tip[1].toFixed(1)} px`);
    let peak: Vec2 = [0, 0];
    for (let t = 3; t <= 10; t += 0.25) {
      const pos = thrownBladeAt(SQUARE2, t, poseAnchors).pos;
      if (pos[1] < peak[1]) peak = pos;
    }
    assert.ok(peak[1] < -50, `the arc tops at ${peak[1].toFixed(1)} px`);
    assert.ok(peak[0] > 12, `the peak is ${peak[0].toFixed(1)} px ahead of the feet (in front of the head)`);
  });

  it('draws the rising part behind the body and the descent in front', () => {
    assert.equal(thrownBladeAt(SQUARE2, 3.5, poseAnchors).behindBody, true);
    assert.equal(thrownBladeAt(SQUARE2, 8, poseAnchors).behindBody, false);
    assert.equal(thrownBladeAt(SQUARE2, 12, poseAnchors).behindBody, false);
  });

  it('points the far arm at its blade while it is thrown (within 40 degrees from the shoulder)', () => {
    // From the second sweep tick (the first one starts the swing behind) to the end of the hold.
    for (let t = 4; t < 17; t += 1) {
      const pose = strikePoseAt(SQUARE2, t);
      const a = ANCHORS[`kratos-${pose}`];
      const shoulder = feet(a.farShoulder);
      const hand = feet(a.farHand);
      const blade = thrownBladeAt(SQUARE2, t, poseAnchors).pos;
      const adv = strikeAdvanceAt(SQUARE2, t);
      const arm = Math.atan2(hand[1] - shoulder[1], hand[0] - shoulder[0]);
      const toBlade = Math.atan2(blade[1] - shoulder[1], blade[0] - adv - shoulder[0]);
      const off = Math.abs(((arm - toBlade + 3 * Math.PI) % (2 * Math.PI)) - Math.PI);
      assert.ok(off <= (40 * Math.PI) / 180, `tick ${t} (${pose}): arm ${((off * 180) / Math.PI).toFixed(0)} degrees off the blade`);
    }
  });

  // Square 2 is faster than square 1 (0.38 s, as measured on the reference),
  // so one tick of its descent covers up to 30 px; the trail is sampled six
  // times per tick, so the fire has no gap.
  it('moves the thrown far blade continuously from the far hand: no jump over 30 px per tick, none at phase changes', () => {
    const total = strikeLength(SQUARE2);
    const start = farBladeAt(SQUARE2, 0, poseAnchors).pos;
    const hand = feet(ANCHORS['kratos-sq2-a'].farHand);
    assert.ok(dist(start, [hand[0], hand[1] + 5]) < 1e-6, 'starts hanging under the far hand');
    let prev = start;
    let worst = 0;
    for (let t = 1; t < total; t += 1) {
      const pos = farBladeAt(SQUARE2, t, poseAnchors).pos;
      worst = Math.max(worst, dist(prev, pos));
      prev = pos;
    }
    assert.ok(worst <= 30, `largest per-tick jump ${worst.toFixed(1)} px`);
    let at = 0;
    for (const phase of SQUARE2.phases.slice(0, -1)) {
      at += phase.ticks;
      const before = farBladeAt(SQUARE2, at - 1e-6, poseAnchors).pos;
      const after = farBladeAt(SQUARE2, at, poseAnchors).pos;
      assert.ok(dist(before, after) < 1, `jump of ${dist(before, after).toFixed(2)} px entering tick ${at}`);
    }
  });

  it('returns the near blade from where square 1 left it into the near hand', () => {
    const { opens } = strikeChainTicks(SQUARE1)!;
    for (let k = opens; k < strikeLength(SQUARE1); k += 1) {
      const entry = entryAt(k);
      const left = nearBladeAt(SQUARE1, entry.tick, poseAnchors).pos;
      const start = nearBladeAt(SQUARE2, 0, poseAnchors, entry).pos;
      assert.ok(dist(start, [left[0] - entry.offsetPx, left[1]]) < 1e-6, `starts where square 1 left it (tick ${k})`);
      let prev = start;
      for (let t = 1; t < strikeLength(SQUARE2); t += 1) {
        const pos = nearBladeAt(SQUARE2, t, poseAnchors, entry).pos;
        assert.ok(dist(prev, pos) <= 22, `near blade jumps ${dist(prev, pos).toFixed(1)} px on tick ${t} (entry ${k})`);
        prev = pos;
      }
      const hand = feet(ANCHORS[`kratos-${strikePoseAt(SQUARE2, 9)}`].hand);
      assert.ok(dist(nearBladeAt(SQUARE2, 9, poseAnchors, entry).pos, [hand[0] + strikeAdvanceAt(SQUARE2, 9), hand[1] + 5]) < 1e-6, 'hangs from the near hand');
    }
    // Thrown far out on the hold, it comes back on its chain.
    assert.equal(nearBladeAt(SQUARE2, 1, poseAnchors, entryAt(opens)).chainOut, true);
  });

  it('has a hit segment from the second throw tick (the descent) to the last hold tick', () => {
    const active: number[] = [];
    for (let t = 0; t < strikeLength(SQUARE2); t += 1) {
      if (strikeHitSegment(SQUARE2, t)) active.push(t);
    }
    assert.deepEqual(active, Array.from({ length: 10 }, (_, i) => 7 + i));
    assert.deepEqual(strikeActiveTicks(SQUARE2), { first: 7, last: 16 });
  });

  it('keeps square 1\'s hit window on the same ticks when defined on the curve', () => {
    assert.deepEqual(strikeActiveTicks(SQUARE1), { first: 8, last: 25 });
  });

  it('opens the chain on hold tick 4 of square 1, buffering from its hit window; square 2 does not chain yet', () => {
    assert.deepEqual(strikeChainTicks(SQUARE1), { opens: 18, buffersFrom: 8 });
    assert.equal(SQUARE1.chain?.into, 'square2');
    assert.equal(strikeChainTicks(SQUARE2), null);
  });
});

describe('strike poses', () => {
  it('never shows two near-identical poses in a row (at least 60 cells differ)', () => {
    const grid = (pose: string): string[] =>
      readFileSync(new URL(`../grids/kratos/${pose}.txt`, import.meta.url), 'utf-8').split('\n');
    for (const def of Object.values(STRIKES)) {
      for (let i = 1; i < def.phases.length; i += 1) {
        const a = grid(def.phases[i - 1].pose);
        const b = grid(def.phases[i].pose);
        let diff = 0;
        for (let y = 0; y < a.length; y += 1) {
          for (let x = 0; x < a[y].length; x += 1) if (a[y][x] !== b[y]?.[x]) diff += 1;
        }
        assert.ok(diff >= 60, `${def.phases[i - 1].pose} -> ${def.phases[i].pose}: only ${diff} cells differ`);
      }
    }
  });
});

describe('square 1 -> square 2 in the world', () => {
  it('chains on J during the hold, from where square 1 left the body', () => {
    const world = playingWorld();
    const x0 = player(world.snapshot()).x;
    square1At(world, 20);
    world.step(['light-attack']);
    const strike = world.snapshot().strike;
    assert.ok(strike);
    assert.equal(strike.id, 'square2');
    assert.equal(strike.tick, 0);
    assert.deepEqual(strike.entry, { id: 'square1', tick: 21, offsetPx: 7 });
    assert.ok(Math.abs(strike.originX - x0 - 7) < 1e-6);
    hold(world, 22, []);
    assert.equal(world.snapshot().strike?.tick, 22);
    world.step([]);
    assert.equal(world.snapshot().strike, undefined);
    assert.ok(Math.abs(player(world.snapshot()).x - x0 - 12) < 1e-6, 'square 1 steps 7 px, square 2 5 px');
  });

  it('chains on J during the recall', () => {
    const world = playingWorld();
    square1At(world, 30);
    world.step(['light-attack']);
    assert.equal(world.snapshot().strike?.id, 'square2');
    assert.equal(world.snapshot().strike?.entry?.tick, 31);
  });

  it('buffers a J pressed in the hit window until the chain opens', () => {
    const world = playingWorld();
    square1At(world, 9);
    world.step(['light-attack']);
    assert.equal(world.snapshot().strike?.id, 'square1');
    assert.equal(world.snapshot().strike?.queued, true);
    hold(world, 8, []);
    assert.equal(world.snapshot().strike?.tick, 18);
    assert.equal(world.snapshot().strike?.id, 'square1');
    world.step([]);
    assert.equal(world.snapshot().strike?.id, 'square2');
    assert.equal(world.snapshot().strike?.tick, 0);
  });

  it('chains facing left toward the facing', () => {
    const world = playingWorld();
    hold(world, 1, ['move-left']);
    hold(world, 30, []);
    const x0 = player(world.snapshot()).x;
    square1At(world, 25);
    world.step(['light-attack']);
    hold(world, 22, []);
    assert.equal(world.snapshot().strike?.facing, -1);
    assert.ok(Math.abs(player(world.snapshot()).x - x0 + 12) < 1e-6);
  });

  it('does nothing on J during the square-2 hold or recall (no square 3 yet)', () => {
    const world = playingWorld();
    square1At(world, 20);
    world.step(['light-attack']);
    hold(world, 12, []);
    world.step(['light-attack']);
    hold(world, 5, []);
    world.step(['light-attack']);
    assert.equal(world.snapshot().strike?.id, 'square2');
    assert.equal(world.snapshot().strike?.tick, 19);
    hold(world, 3, []);
    world.step([]);
    assert.equal(world.snapshot().strike, undefined);
    world.step(['light-attack']);
    assert.equal(world.snapshot().strike?.id, 'square1');
  });

  it('hits the legionnaire once with each strike of the combo, with hitstop on the square-2 hold', () => {
    const world = new World();
    world.loadScenario('legionnaire');
    const hp0 = enemy(world.snapshot()).hp;
    world.step(['light-attack']);
    // Mash J through the combo: the presses queue square 2, then do nothing.
    let square2HitTick = -1;
    let hitstopSeen = false;
    let originX = 0;
    let enemyX = 0;
    let comboOver = false;
    for (let i = 0; i < 90; i += 1) {
      const before = world.snapshot().strike;
      comboOver ||= before?.id === 'square2' && before.tick >= strikeLength(SQUARE2) - 1;
      world.step(i % 6 === 0 && !comboOver ? ['light-attack'] : []);
      const snap = world.snapshot();
      if (snap.strike?.id === 'square2' && snap.strike.hits.length > 0 && square2HitTick < 0) {
        square2HitTick = snap.strike.tick;
        hitstopSeen = snap.hitstopTicks === SQUARE2.hitstopTicks;
        originX = snap.strike.originX;
        enemyX = enemy(snap).x;
      }
    }
    assert.ok(square2HitTick >= 7 && square2HitTick <= 16, `square 2 hit on its tick ${square2HitTick}`);
    assert.ok(hitstopSeen, 'square 2 freezes the world on contact');
    // The close legionnaire is hit on the start of the descent, 30 to 45 px
    // up: the first point of the swept segment that touches its hurt box.
    const [a, b] = strikeHitSegment(SQUARE2, square2HitTick)!;
    assert.ok(b[1] > a[1], 'the blade is going down on the first contact');
    const r = SQUARE2.hitRadiusPx;
    let contact = Infinity;
    for (let f = 0; f <= 1; f += 0.01) {
      const x = originX + a[0] + (b[0] - a[0]) * f;
      const y = a[1] + (b[1] - a[1]) * f;
      if (x >= enemyX - 14 - r && x <= enemyX + 14 + r && y >= -48 - r) {
        contact = -y;
        break;
      }
    }
    assert.ok(contact >= 30 && contact <= 45, `contact at ${contact.toFixed(1)} px up`);
    assert.equal(enemy(world.snapshot()).hp, hp0 - SQUARE1.damage - SQUARE2.damage);
  });

  it('queues the chain when J is pressed during the hitstop', () => {
    const world = new World();
    world.loadScenario('legionnaire');
    world.step(['light-attack']);
    for (let i = 0; i < 40 && world.snapshot().hitstopTicks === 0; i += 1) world.step([]);
    assert.ok(world.snapshot().hitstopTicks > 0);
    world.step(['light-attack']);
    assert.equal(world.snapshot().strike?.queued, true);
    hold(world, 40, []);
    assert.ok(world.snapshot().strike === undefined || world.snapshot().strike?.id === 'square2');
  });
});
