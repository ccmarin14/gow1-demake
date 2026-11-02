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
  strikeAdvanceAt,
  fireballRadius,
  strikeChainTicks,
  strikeEffectsAt,
  strikeHandAt,
  strikeHitSegment,
  strikeHitWindowAt,
  strikeImpactTick,
  strikeLength,
  strikePoseAt,
  strikeTrailAt,
  thrownBladeAt,
  type ActiveEffect,
  type StrikeEntry,
  type StrikeImpactNotice,
  type StrikePoseAnchors,
  type Vec2,
} from '../src/sim/strike';
import type { EntityState, GameAction, SimulationSnapshot } from '../src/sim/types';
import { World } from '../src/sim/world';

const SQUARE5 = STRIKES.square5;
const TRIANGLE = STRIKES.triangle;

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

/** Square-5 values recorded from the approved implementation (commit 8ebd323). */
const SQ5_FIXTURE: {
  entry: StrikeEntry;
  samples: {
    t: number; near: number[]; nearChain: boolean; nearSag: number; nearDeg: number; nearBehind: boolean; nearS: number;
    far: number[]; farChain: boolean; farSag: number; farDeg: number; farBehind: boolean; farS: number; adv: number;
  }[];
  ticks: {
    tick: number; pose: string; nearTrail: number[][]; nearWidth: number;
    farTrail: number[][]; farWidth: number; nearHit: number[][] | null; farHit: number[][] | null;
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

const SLAM = strikeImpactTick(TRIANGLE);

describe('square-5 is unchanged as approved', () => {
  it('keeps both blades, both trails and both hit segments of commit 8ebd323', () => {
    const entry = SQ5_FIXTURE.entry;
    for (const q of SQ5_FIXTURE.samples) {
      const near = nearBladeAt(SQUARE5, q.t, poseAnchors, entry);
      const far = farBladeAt(SQUARE5, q.t, poseAnchors, entry);
      assert.ok(close(near.pos, q.near), `near blade at ${q.t}`);
      assert.equal(near.chainOut, q.nearChain);
      assert.ok(Math.abs(near.sagPx - q.nearSag) < 1e-3);
      assert.equal(near.deg, q.nearDeg);
      assert.equal(near.behindBody, q.nearBehind);
      assert.ok(close(far.pos, q.far), `far blade at ${q.t}`);
      assert.equal(far.chainOut, q.farChain);
      assert.equal(far.behindBody, q.farBehind);
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

describe('triangle strike data', () => {
  it('runs draw 6, gather 8 + 10, rise 4, over 4, down 4, slam 10 and recall 12 ticks (58): a 0.4 s windup', () => {
    assert.deepEqual(
      TRIANGLE.phases.map((p) => [p.id, p.ticks]),
      [['draw', 6], ['gather1', 8], ['gather2', 10], ['rise', 4], ['over', 4], ['down', 4], ['slam', 10], ['recall', 12]],
    );
    assert.equal(strikeLength(TRIANGLE), 58);
    assert.equal(SLAM, 36);
  });

  it('reads in the windup and the slam: shoulders at least 28 and 24 px above the ground', () => {
    assert.ok(-feet(ANCHORS['kratos-tri-b'].shoulder)[1] >= 28, 'windup stands, legs apart');
    assert.ok(-feet(ANCHORS['kratos-tri-f'].shoulder)[1] >= 24, 'slam crouch keeps the head up');
  });

  it('holds both blades together at the hands, at the hip, as two pulsing fireballs, with no trail', () => {
    for (let t = 6; t < 24; t += 1) {
      const near = bladeAt(TRIANGLE, 'near', t, poseAnchors).pos;
      const far = bladeAt(TRIANGLE, 'far', t, poseAnchors).pos;
      assert.ok(dist(near, far) <= 6, `blades ${dist(near, far).toFixed(1)} px apart on tick ${t}`);
      assert.ok(near[1] >= -22 && near[1] <= -12, `at hip height (${(-near[1]).toFixed(1)} px up)`);
      const hand = strikeHandAt(TRIANGLE, t, poseAnchors, 'near');
      assert.ok(dist(near, hand) <= 8, `near blade ${dist(near, hand).toFixed(1)} px from the hand`);
      for (const hand2 of ['near', 'far'] as const) {
        assert.equal(strikeTrailAt(TRIANGLE, t, poseAnchors, hand2).points.length, 0, 'no trail in the windup');
      }
      const fireballs = strikeEffectsAt(TRIANGLE, t).filter((e) => e.kind === 'fireball');
      assert.equal(fireballs.length, 1, `fireballs on tick ${t}`);
    }
    const radii = [6, 7, 8, 9, 10, 11].map((t) => {
      const effect = strikeEffectsAt(TRIANGLE, t).find((e) => e.kind === 'fireball')!;
      return fireballRadius(effect as Extract<typeof effect, { kind: 'fireball' }>, effect.age);
    });
    assert.deepEqual(radii, [5, 5, 5, 6, 6, 6], 'pulses 5 <-> 6 px every 3 ticks');
    assert.equal(strikeEffectsAt(TRIANGLE, 24).some((e) => e.kind === 'fireball'), false, 'gone once the arc starts');
  });

  it('swings two crescents of about 270 degrees, pausing on top, into the ground ahead', () => {
    const shoulder = TRIANGLE.blades.near!.shoulder;
    let swept = 0;
    let prev: number | null = null;
    let top = 0;
    for (let t = 24; t <= SLAM; t += 0.25) {
      const p = thrownBladeAt(TRIANGLE, t, poseAnchors, 'near').pos;
      top = Math.min(top, p[1]);
      const angle = Math.atan2(p[1] - shoulder[1], p[0] - strikeAdvanceAt(TRIANGLE, t) - shoulder[0]);
      if (prev !== null) {
        let d = angle - prev;
        while (d > Math.PI) d -= 2 * Math.PI;
        while (d < -Math.PI) d += 2 * Math.PI;
        swept += d;
      }
      prev = angle;
    }
    assert.ok(Math.abs((swept * 180) / Math.PI) >= 240, `arc of ${Math.abs((swept * 180) / Math.PI).toFixed(0)} degrees`);
    assert.ok(top < -65, `the arc tops ${(-top).toFixed(1)} px up`);
    // Pause on top (ease out), then accelerate down (ease in).
    const speed = (t: number): number => dist(thrownBladeAt(TRIANGLE, t, poseAnchors).pos, thrownBladeAt(TRIANGLE, t + 0.5, poseAnchors).pos);
    assert.ok(speed(31.4) < speed(29) / 2, 'slows down over the top');
    assert.ok(speed(34.9) > speed(32.1) * 2, 'accelerates into the ground');
    const near = thrownBladeAt(TRIANGLE, SLAM, poseAnchors, 'near').pos;
    const far = thrownBladeAt(TRIANGLE, SLAM, poseAnchors, 'far').pos;
    assert.ok(near[0] >= 75 && near[0] <= 90, `near lands ${near[0].toFixed(1)} px ahead`);
    assert.ok(near[0] - far[0] >= 12, 'two crescents: the far one lands behind the near one');
    for (const end of [near, far]) assert.ok(end[1] >= -4, 'on the ground');
  });

  it('moves both blades continuously (up to 40 px a tick as it accelerates into the ground), with no jump at phase changes', () => {
    for (const hand of ['near', 'far'] as const) {
      let prev = bladeAt(TRIANGLE, hand, 0, poseAnchors).pos;
      for (let t = 1; t < strikeLength(TRIANGLE); t += 1) {
        const pos = bladeAt(TRIANGLE, hand, t, poseAnchors).pos;
        const limit = t >= 32 && t <= SLAM ? 40 : 30;
        assert.ok(dist(prev, pos) <= limit, `${hand}: jump of ${dist(prev, pos).toFixed(1)} px on tick ${t}`);
        prev = pos;
      }
      let at = 0;
      for (const phase of TRIANGLE.phases.slice(0, -1)) {
        at += phase.ticks;
        const before = bladeAt(TRIANGLE, hand, at - 1e-6, poseAnchors).pos;
        const after = bladeAt(TRIANGLE, hand, at, poseAnchors).pos;
        assert.ok(dist(before, after) < 1, `${hand}: jump of ${dist(before, after).toFixed(2)} px entering tick ${at}`);
      }
    }
  });

  it('points each arm at its blade from the windup through the slam (within 40 degrees)', () => {
    // Skipping the first tick of each arc pose (the blade is still where the last pose left it).
    for (let t = 7; t <= SLAM + 1; t += 1) {
      if (t === 24 || t === 28 || t === 32) continue;
      const pose = strikePoseAt(TRIANGLE, t);
      const a = ANCHORS[`kratos-${pose}`];
      const adv = strikeAdvanceAt(TRIANGLE, t);
      for (const [hand, shoulderKey, handKey] of [['near', 'shoulder', 'hand'], ['far', 'farShoulder', 'farHand']] as const) {
        const shoulder = feet(a[shoulderKey]);
        const grip = feet(a[handKey]);
        const blade = thrownBladeAt(TRIANGLE, t, poseAnchors, hand).pos;
        const arm = Math.atan2(grip[1] - shoulder[1], grip[0] - shoulder[0]);
        const toBlade = Math.atan2(blade[1] - shoulder[1], blade[0] - adv - shoulder[0]);
        const off = Math.abs(((arm - toBlade + 3 * Math.PI) % (2 * Math.PI)) - Math.PI);
        assert.ok(off <= (40 * Math.PI) / 180, `tick ${t} (${pose}) ${hand}: arm ${((off * 180) / Math.PI).toFixed(0)} degrees off`);
      }
    }
  });

  it('keeps each trail like the square strikes: 6 px wide, at most 55 px long, its head on its blade', () => {
    assert.equal(Math.max(...TRIANGLE.blades.near!.trail!.kind === 'profile' ? (TRIANGLE.blades.near!.trail as { widths: readonly (readonly [number, number])[] }).widths.map((w) => w[1]) : [0]), 6);
    for (const hand of ['near', 'far'] as const) {
      for (let tick = 0; tick < strikeLength(TRIANGLE); tick += 1) {
        const points = strikeTrailAt(TRIANGLE, tick, poseAnchors, hand).points;
        assert.ok(pathLength(points) <= 55, `${hand} trail ${pathLength(points).toFixed(1)} px on tick ${tick}`);
        if (points.length === 0) continue;
        const blade = bladeAt(TRIANGLE, hand, tick, poseAnchors).pos;
        assert.ok(dist(points[points.length - 1], blade) <= 2, `${hand} trail head off its blade on tick ${tick}`);
      }
    }
  });

  it('slams with a fire line over the whole hit box, dust at both ends, a flash where the near blade lands and a short shake', () => {
    const impact = TRIANGLE.impact!;
    assert.deepEqual([impact.from, impact.to], [20, 88]);
    const effects = strikeEffectsAt(TRIANGLE, SLAM);
    const fire = effects.find((e) => e.kind === 'groundFire') as Extract<ActiveEffect, { kind: 'groundFire' }>;
    const flash = effects.find((e) => e.kind === 'flash') as Extract<ActiveEffect, { kind: 'flash' }>;
    const dust = effects.find((e) => e.kind === 'dust') as Extract<ActiveEffect, { kind: 'dust' }>;
    const shake = effects.find((e) => e.kind === 'shake') as Extract<ActiveEffect, { kind: 'shake' }>;
    assert.ok(Math.abs(fire.from - impact.from) <= 2 && Math.abs(fire.to - impact.to) <= 2, 'the fire line covers the hit box');
    const landing = thrownBladeAt(TRIANGLE, SLAM, poseAnchors, 'near').pos[0];
    assert.ok(Math.abs(flash.x - landing) <= 2, `flash at ${flash.x}, the near blade lands at ${landing.toFixed(1)}`);
    assert.ok(flash.x >= impact.from && flash.x <= impact.to);
    assert.deepEqual(dust.at, [impact.from, impact.to]);
    assert.deepEqual([shake.px, shake.ticks], [2, 4]);
    assert.equal(fire.ticks, 8);
    assert.equal(strikeEffectsAt(TRIANGLE, SLAM + 7).some((e) => e.kind === 'groundFire'), true, 'flickers 8 ticks');
    assert.equal(strikeEffectsAt(TRIANGLE, SLAM + 8).some((e) => e.kind === 'groundFire'), false);
    assert.equal(strikeEffectsAt(TRIANGLE, SLAM + 2).some((e) => e.kind === 'flash'), false, 'the flash lasts 2 ticks');
    assert.equal(TRIANGLE.hitstopTicks, 6);
  });

  it('hits with the arc on its way down and with the ground impact; does not chain', () => {
    assert.equal(strikeHitWindowAt(TRIANGLE, 29, 'near'), -1, 'not on the way up');
    assert.equal(strikeHitWindowAt(TRIANGLE, 34, 'near'), 0, 'on the way down');
    assert.equal(strikeChainTicks(TRIANGLE), null);
  });
});

describe('triangle hits', () => {
  it('hits an enemy where the blades land twice (arc, then impact); reports dust, flash and shake on the slam tick', () => {
    const world = playingWorld();
    const kratos: EntityState = { ...player(world.snapshot()) };
    const template = new World();
    template.loadScenario('legionnaire');
    const foe = template.snapshot().entities.find((e) => e.kind === 'legionnaire')!;
    const landing: EntityState = { ...foe, id: 'landing', x: kratos.x + 82, y: kratos.y, hp: 100, isDead: false, aiState: 'approach' };
    const state = startStrike(kratos, 'triangle');
    const hitsOn: number[] = [];
    let impact: StrikeImpactNotice | undefined;
    let impactTick = -1;
    for (let i = 0; i < strikeLength(TRIANGLE); i += 1) {
      const result = stepStrike(state, kratos, [landing], -1e6, 1e6);
      hitsOn.push(...result.hits.map(() => state.tick));
      if (result.impact) {
        impact = result.impact;
        impactTick = state.tick;
      }
      if (result.done) break;
    }
    assert.equal(impactTick, SLAM);
    assert.ok(impact);
    assert.ok(Math.abs(impact.x - (state.originX + 81)) < 1e-6 && impact.y === kratos.y);
    assert.deepEqual(impact.dust, [state.originX + 20, state.originX + 88]);
    assert.deepEqual(impact.shake, { px: 2, ticks: 4 });
    assert.equal(hitsOn.length, 2, `hit on ${hitsOn}`);
    assert.ok(hitsOn[0] >= 33 && hitsOn[0] <= SLAM, 'first by the arc');
    assert.equal(hitsOn[1], SLAM, 'then by the impact');
    assert.equal(landing.hp, 100 - 2 * TRIANGLE.damage);
  });
});

describe('triangle against a close enemy', () => {
  it('hits a legionnaire at Kratos\' feet with the slam (once) and freezes the world there', () => {
    const world = new World();
    world.loadScenario('legionnaire');
    const foe = world.snapshot().entities.find((e) => e.kind === 'legionnaire')!;
    const hp0 = foe.hp;
    world.step(['heavy-attack']);
    let hitTick = -1;
    for (let i = 0; i < 60 && hitTick < 0; i += 1) {
      world.step([]);
      const snap = world.snapshot();
      if (snap.strike?.id === 'triangle' && snap.strike.hits.length > 0) {
        hitTick = snap.strike.tick;
        assert.equal(snap.hitstopTicks, TRIANGLE.hitstopTicks);
      }
    }
    assert.ok(hitTick >= 33 && hitTick <= SLAM, `hit on tick ${hitTick}`);
    const after = world.snapshot().entities.find((e) => e.kind === 'legionnaire')!;
    assert.ok(after.hp < hp0);
  });
});

describe('triangle in the world', () => {
  it('starts on the I press from idle on the ground, lasts 58 ticks; I and J during it do nothing', () => {
    const world = playingWorld();
    world.step(['heavy-attack']);
    const strike = world.snapshot().strike;
    assert.equal(strike?.id, 'triangle');
    assert.equal(strike?.tick, 0);
    for (let i = 0; i < 57; i += 1) {
      world.step(i % 4 === 0 ? ['heavy-attack'] : i % 4 === 2 ? ['light-attack'] : []);
      assert.equal(world.snapshot().strike?.id, 'triangle');
    }
    assert.equal(world.snapshot().strike?.tick, 57);
    world.step([]);
    assert.equal(world.snapshot().strike, undefined);
  });

  it('fires once per press (held I does not repeat) and turns toward a direction held as it starts', () => {
    const world = playingWorld();
    hold(world, 59, ['heavy-attack']);
    world.step([]);
    assert.equal(world.snapshot().strike, undefined, 'one triangle per press');
    assert.equal(player(world.snapshot()).facing, 1);
    world.step(['heavy-attack', 'move-left']);
    assert.equal(world.snapshot().strike?.facing, -1);
  });

  it('reports the ground impact once', () => {
    const world = playingWorld();
    world.step(['heavy-attack']);
    hold(world, SLAM - 1, []);
    assert.equal(world.consumeStrikeImpactNotice(), null);
    world.step([]);
    assert.ok(world.consumeStrikeImpactNotice());
    assert.equal(world.consumeStrikeImpactNotice(), null);
  });

  it('can be cut short by guarding or jumping from recall tick 6, not before', () => {
    const recall = SLAM + 10;
    const early = playingWorld();
    early.step(['heavy-attack']);
    hold(early, recall + 5, []);
    early.step(['guard']);
    assert.equal(early.snapshot().strike?.id, 'triangle', 'guard before recall tick 6 does nothing');

    const guard = playingWorld();
    guard.step(['heavy-attack']);
    hold(guard, recall + 6, []);
    guard.step(['guard']);
    assert.equal(guard.snapshot().strike, undefined);
    assert.notEqual(player(guard.snapshot()).guardPhase, 'none', 'guarding');

    const jump = playingWorld();
    jump.step(['heavy-attack']);
    hold(jump, recall + 6, []);
    jump.step(['jump']);
    assert.equal(jump.snapshot().strike, undefined);
    assert.equal(player(jump.snapshot()).grounded, false, 'jumping');
  });

  it('does not start in the air, and I no longer casts the magic (U does)', () => {
    const air = playingWorld();
    air.step(['jump']);
    air.step([]);
    air.step(['heavy-attack']);
    assert.equal(air.snapshot().strike, undefined);
    const world = playingWorld();
    world.step(['heavy-attack']);
    assert.equal(player(world.snapshot()).magicPhase, 'none');
  });
});

describe('triangle hold branch (for Ascension)', () => {
  it('branches into its target when I is held from the press through the windup; a tap keeps the arc', () => {
    const def = TRIANGLE as { branch?: { atEndOf: string; ifHeld: 'heavy-attack'; into?: string } };
    assert.equal(def.branch?.atEndOf, 'gather2');
    assert.equal(def.branch?.into, undefined, 'no target until Ascension exists');
    def.branch!.into = 'square1';
    try {
      const held = playingWorld();
      hold(held, 25, ['heavy-attack']);
      assert.equal(held.snapshot().strike?.id, 'square1', 'held through the windup: branched');

      const released = playingWorld();
      released.step(['heavy-attack']);
      hold(released, 10, ['heavy-attack']);
      hold(released, 14, []);
      assert.equal(released.snapshot().strike?.id, 'triangle', 'released early: the arc goes on');
      assert.equal(released.snapshot().strike?.tick, 24);
    } finally {
      delete def.branch!.into;
    }
  });
});

describe('phases that end on landing', () => {
  it('skip their remaining ticks once Kratos is grounded, after their minimum', () => {
    const phase = TRIANGLE.phases.find((p) => p.id === 'draw') as { until?: { event: 'grounded'; minTicks: number } };
    phase.until = { event: 'grounded', minTicks: 2 };
    try {
      const world = playingWorld();
      const kratos: EntityState = { ...player(world.snapshot()) };
      const state = startStrike(kratos, 'triangle');
      stepStrike(state, kratos, [], -1e6, 1e6);
      assert.equal(state.tick, 1, 'before the minimum it runs on');
      stepStrike(state, kratos, [], -1e6, 1e6);
      assert.equal(state.tick, 6, 'grounded after the minimum: the next phase starts');
    } finally {
      delete phase.until;
    }
  });
});
