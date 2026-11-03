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
  type Vec2,
} from '../src/sim/strike';
import type { EntityState, GameAction, SimulationSnapshot } from '../src/sim/types';
import { World } from '../src/sim/world';
import { ANCHORS, feet, poseAnchors, dist, pathLength } from './helpers/anchors';

const SQUARE6 = STRIKES.square6;
const TRIANGLE = STRIKES.triangle;

const close = (a: readonly number[], b: readonly number[]): boolean => dist(a as Vec2, b as Vec2) < 1e-3;

/** Square-6 (formerly square-5) values recorded from the approved implementation (commit 8ebd323). */
const SQ6_FIXTURE: {
  entry: StrikeEntry;
  samples: {
    t: number; near: number[]; nearChain: boolean; nearSag: number; nearDeg: number; nearBehind: boolean; nearS: number;
    far: number[]; farChain: boolean; farSag: number; farDeg: number; farBehind: boolean; farS: number; adv: number;
  }[];
  ticks: {
    tick: number; pose: string; nearTrail: number[][]; nearWidth: number;
    farTrail: number[][]; farWidth: number; nearHit: number[][] | null; farHit: number[][] | null;
  }[];
} = JSON.parse(readFileSync(new URL('./fixtures/square6-track.json', import.meta.url), 'utf-8'));

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

describe('square-6 (the finisher, formerly square 5) is unchanged as approved', () => {
  it('keeps both blades, both trails and both hit segments of commit 8ebd323', () => {
    const entry = SQ6_FIXTURE.entry;
    for (const q of SQ6_FIXTURE.samples) {
      const near = nearBladeAt(SQUARE6, q.t, poseAnchors, entry);
      const far = farBladeAt(SQUARE6, q.t, poseAnchors, entry);
      assert.ok(close(near.pos, q.near), `near blade at ${q.t}`);
      assert.equal(near.chainOut, q.nearChain);
      assert.ok(Math.abs(near.sagPx - q.nearSag) < 1e-3);
      assert.equal(near.deg, q.nearDeg);
      assert.equal(near.behindBody, q.nearBehind);
      assert.ok(close(far.pos, q.far), `far blade at ${q.t}`);
      assert.equal(far.chainOut, q.farChain);
      assert.equal(far.behindBody, q.farBehind);
      assert.ok(Math.abs(strikeAdvanceAt(SQUARE6, q.t) - q.adv) < 1e-3);
    }
    for (const k of SQ6_FIXTURE.ticks) {
      assert.equal(strikePoseAt(SQUARE6, k.tick), k.pose);
      for (const [hand, points, widthPx, hit] of [
        ['near', k.nearTrail, k.nearWidth, k.nearHit],
        ['far', k.farTrail, k.farWidth, k.farHit],
      ] as const) {
        const trail = strikeTrailAt(SQUARE6, k.tick, poseAnchors, hand);
        assert.equal(trail.widthPx, widthPx);
        assert.equal(trail.points.length, points.length, `${hand} trail length on tick ${k.tick}`);
        trail.points.forEach((p, i) => assert.ok(close(p, points[i]), `${hand} trail point ${i} on tick ${k.tick}`));
        const segment = strikeHitSegment(SQUARE6, k.tick, hand);
        assert.equal(segment === null, hit === null);
        if (segment && hit) assert.ok(close(segment[0], hit[0]) && close(segment[1], hit[1]));
      }
    }
  });
});

describe('square 6 closes its forward lash (user feedback)', () => {
  it('ends the throw and holds with both blades within 14 px of each other, crossing in an X', () => {
    // The throw runs from tick 18 to 23 and the hold to 27 (load 4, back 5, sweepA 4, sweepB 5).
    for (let t = 23; t <= 27; t += 0.5) {
      const near = nearBladeAt(SQUARE6, t, poseAnchors, SQ6_FIXTURE.entry).pos;
      const far = farBladeAt(SQUARE6, t, poseAnchors, SQ6_FIXTURE.entry).pos;
      assert.ok(dist(near, far) <= 14, `blades ${dist(near, far).toFixed(1)} px apart at ${t}`);
    }
  });
});

describe('triangle strike data', () => {
  it('runs draw 5, pull 7, charge 12, rise 4, over 4, down 4, slam 10 and recall 12 ticks (58): a 0.4 s windup, all of it behind the body', () => {
    assert.deepEqual(
      TRIANGLE.phases.map((p) => [p.id, p.ticks]),
      [['draw', 5], ['pull', 7], ['charge', 12], ['rise', 4], ['over', 4], ['down', 4], ['slam', 10], ['recall', 12]],
    );
    assert.equal(strikeLength(TRIANGLE), 58);
    assert.equal(SLAM, 36);
    assert.deepEqual(TRIANGLE.branch, { atEndOf: 'charge', ifHeld: 'heavy-attack', into: 'launcher' }, 'the hold threshold is the end of the charge (tick 23)');
  });

  it('reads in the draw, the charge and the slam: shoulders at least 28, 22 and 24 px above the ground', () => {
    assert.ok(-feet(ANCHORS['kratos-tri-a'].shoulder)[1] >= 28, 'the draw stands, legs apart');
    assert.ok(-feet(ANCHORS['kratos-tri-pc'].shoulder)[1] >= 22, 'the charge behind keeps the head up');
    assert.ok(-feet(ANCHORS['kratos-tri-f'].shoulder)[1] >= 24, 'slam crouch keeps the head up');
  });

  it('draws the blades and pulls both arms and blades straight back and low behind the hip (no gather in front of the belly), then charges there', () => {
    assert.equal(TRIANGLE.phases.some((p) => p.id.startsWith('gather')), false);
    const behind = (hand: 'near' | 'far', t: number): number => bladeAt(TRIANGLE, hand, t, poseAnchors).pos[0];
    for (const hand of ['near', 'far'] as const) {
      // The behind points sit 8 px further back than before (user feedback): the pull starts from -11 instead of -3.
      assert.ok(behind(hand, 5) > -12, `${hand} blade still at the hip when the pull starts (${behind(hand, 5).toFixed(1)})`);
      assert.ok(behind(hand, 11.9) < -8, `${hand} blade behind the hip by the end of the pull (${behind(hand, 11.9).toFixed(1)})`);
      for (let t = 12; t < 24; t += 1) assert.ok(behind(hand, t) < -8, `${hand} blade charges behind the hip on tick ${t}`);
    }
    assert.ok(bladeAt(TRIANGLE, 'near', 20, poseAnchors).pos[1] > -26, 'low, below the shoulder');
    const hand = strikeHandAt(TRIANGLE, 20, poseAnchors, 'near');
    assert.ok(hand[0] <= -10, `the near hand is back (${hand[0].toFixed(1)})`);
    assert.equal(strikePoseAt(TRIANGLE, 8), 'tri-pb');
    assert.equal(strikePoseAt(TRIANGLE, 15), 'tri-pc', 'a deeper, more twisted crouch for the charge');
    // The fire starts as soon as the blades are thrown back: none while drawn, a trail from the pull on, through the charge.
    for (let t = 0; t < 5; t += 1) assert.equal(strikeTrailAt(TRIANGLE, t, poseAnchors, 'near').points.length, 0, `no trail while drawn on tick ${t}`);
    for (let t = 6; t < 24; t += 1) assert.ok(strikeTrailAt(TRIANGLE, t, poseAnchors, 'near').points.length > 0, `trail while thrown back on tick ${t}`);
    // No energy ball: the blades themselves are lit.
    for (let t = 0; t < 24; t += 1) assert.equal(strikeEffectsAt(TRIANGLE, t).some((e) => e.kind === 'fireball'), false, `no energy ball on tick ${t}`);
  });

  it('swings two crescents of over 200 degrees from behind the hip, pausing on top, into the ground ahead', () => {
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
    assert.ok(Math.abs((swept * 180) / Math.PI) >= 200, `arc of ${Math.abs((swept * 180) / Math.PI).toFixed(0)} degrees`);
    assert.ok(top < -65, `the arc tops ${(-top).toFixed(1)} px up`);
    // Pause on top (ease out), then accelerate down (ease in).
    const speed = (t: number): number => dist(thrownBladeAt(TRIANGLE, t, poseAnchors).pos, thrownBladeAt(TRIANGLE, t + 0.5, poseAnchors).pos);
    assert.ok(speed(31.4) < speed(29) / 2, 'slows down over the top');
    assert.ok(speed(34.9) > speed(32.1) * 2, 'accelerates into the ground');
    const near = thrownBladeAt(TRIANGLE, SLAM, poseAnchors, 'near').pos;
    const far = thrownBladeAt(TRIANGLE, SLAM, poseAnchors, 'far').pos;
    // Landed 20 px further than before (81 px): user feedback, the blades reach further forward.
    assert.ok(near[0] >= 95 && near[0] <= 106, `near lands ${near[0].toFixed(1)} px ahead`);
    assert.ok(near[0] - far[0] >= 12, 'two crescents: the far one lands behind the near one');
    for (const end of [near, far]) assert.ok(end[1] >= -4, 'on the ground');
  });

  it('moves both blades continuously (up to 40 px a tick as it accelerates into the ground), with no jump at phase changes', () => {
    for (const hand of ['near', 'far'] as const) {
      let prev = bladeAt(TRIANGLE, hand, 0, poseAnchors).pos;
      for (let t = 1; t < strikeLength(TRIANGLE); t += 1) {
        const pos = bladeAt(TRIANGLE, hand, t, poseAnchors).pos;
        const limit = t >= 28 && t <= SLAM ? 40 : 30;
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
      // The first ticks of the pull and of each arc pose: the blade is still catching up with the arm.
      if (t === 5 || t === 6 || t === 12 || t === 24 || t === 28 || t === 32) continue;
      // From the top of the arc to the slam the blades reach 20 px further forward (user feedback): up to 42 degrees off the arm there.
      const limitDeg = t >= 31 && t <= 45 ? 42 : 40;
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
        assert.ok(off <= (limitDeg * Math.PI) / 180, `tick ${t} (${pose}) ${hand}: arm ${((off * 180) / Math.PI).toFixed(0)} degrees off`);
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
    assert.deepEqual([impact.from, impact.to], [40, 108]);
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
    assert.ok(Math.abs(flash.x - 101) <= 1, 'the flash sits at the landing, 101 px ahead');
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
    const landing: EntityState = { ...foe, id: 'landing', x: kratos.x + 101, y: kratos.y, hp: 100, isDead: false, aiState: 'approach' };
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
    assert.ok(Math.abs(impact.x - (state.originX + 101)) < 1e-6 && impact.y === kratos.y);
    assert.deepEqual(impact.dust, [state.originX + 40, state.originX + 108]);
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
        assert.equal(snap.hitstopTicks, TRIANGLE.hitstopTicks + 3, 'a heavy blow holds the world 3 ticks longer');
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

  it('fires once per press and turns toward a direction held as it starts', () => {
    const world = playingWorld();
    world.step(['heavy-attack']);
    hold(world, 57, []);
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

  it('starts the air triangle (not the ground one) in the air, and I no longer casts the magic (U does)', () => {
    const air = playingWorld();
    air.step(['jump']);
    air.step([]);
    air.step(['heavy-attack']);
    assert.equal(air.snapshot().strike?.id, 'airTriangle');
    const world = playingWorld();
    world.step(['heavy-attack']);
    assert.equal(player(world.snapshot()).magicPhase, 'none');
  });
});

describe('triangle hold levels (launcher, then Ascension)', () => {
  it('a tap keeps the slam: released before the end of the charge the arc goes on (level 1)', () => {
    const released = playingWorld();
    released.step(['heavy-attack']);
    hold(released, 10, ['heavy-attack']);
    hold(released, 14, []);
    assert.equal(released.snapshot().strike?.id, 'triangle', 'released early: the arc goes on');
    assert.equal(released.snapshot().strike?.tick, 24);
  });

  it('held through the charge it becomes the launcher: Kratos stays on the ground (level 2)', () => {
    const held = playingWorld();
    hold(held, 25, ['heavy-attack']);
    assert.equal(held.snapshot().strike?.id, 'launcher');
    assert.equal(held.snapshot().strike?.entry?.id, 'triangle', 'carried from the triangle\'s blades');
    assert.equal(player(held.snapshot()).grounded, true);
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
      assert.equal(state.tick, 5, 'grounded after the minimum: the next phase starts');
    } finally {
      delete phase.until;
    }
  });
});

describe('launcher: the blades retract on top', () => {
  it('pulls both blades back toward Kratos during the top hold and recalls them from there without a jump', () => {
    const LAUNCHER = STRIKES.launcher;
    const top = LAUNCHER.phases.findIndex((p) => p.id === 'top');
    const start = LAUNCHER.phases.slice(0, top).reduce((n, p) => n + p.ticks, 0);
    const end = start + LAUNCHER.phases[top].ticks;
    for (const hand of ['near', 'far'] as const) {
      const first = bladeAt(LAUNCHER, hand, start, poseAnchors).pos;
      const last = bladeAt(LAUNCHER, hand, end - 1, poseAnchors).pos;
      const recall = bladeAt(LAUNCHER, hand, end, poseAnchors).pos;
      assert.ok(Math.hypot(first[0] - last[0], first[1] - last[1]) >= 15, `${hand} blade comes back on top`);
      assert.ok(Math.hypot(last[0] - recall[0], last[1] - recall[1]) <= 8, `${hand} recall starts where the retract ended`);
    }
  });
});
