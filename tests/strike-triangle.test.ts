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
  strikePhaseAt,
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
  it('runs draw 4, load 4, rise 3, slash1 4, step 2, slash2 4, hold 3 and recall 4 ticks (28 in total): snappy GoW1 dual diagonal cleave', () => {
    assert.deepEqual(
      TRIANGLE.phases.map((p) => [p.id, p.ticks]),
      [['draw', 4], ['load', 4], ['rise', 3], ['slash1', 4], ['step', 2], ['slash2', 4], ['hold', 3], ['recall', 4]],
    );
    assert.equal(strikeLength(TRIANGLE), 28);
    assert.equal(strikeAdvanceAt(TRIANGLE, 28), 8, 'advances 8 px forward total');
    assert.deepEqual(TRIANGLE.branch, { atEndOf: 'load', ifHeld: 'heavy-attack', into: 'launcher' }, 'the hold threshold is the end of load (tick 7)');
    assert.deepEqual(TRIANGLE.cancel, { from: 'recall', fromTick: 2 }, 'cancelable from recall tick 2');
  });

  it('reads in the draw, load, slash and recall: upright aggressive stance', () => {
    assert.ok(-feet(ANCHORS['kratos-tri-a'].shoulder)[1] >= 28, 'the draw stands upright');
    assert.ok(-feet(ANCHORS['kratos-tri-pb'].shoulder)[1] >= 24, 'the load crouch keeps the torso angled');
    assert.ok(-feet(ANCHORS['kratos-tri-e'].shoulder)[1] >= 24, 'the slash drives downward');
    assert.ok(-feet(ANCHORS['kratos-tri-g'].shoulder)[1] >= 26, 'the recall recovers');
  });

  it('moves both blades continuously with no jumps over 40 px, and zero jump at phase changes', () => {
    for (const hand of ['near', 'far'] as const) {
      let prev = bladeAt(TRIANGLE, hand, 0, poseAnchors).pos;
      for (let t = 1; t < strikeLength(TRIANGLE); t += 1) {
        const pos = bladeAt(TRIANGLE, hand, t, poseAnchors).pos;
        assert.ok(dist(prev, pos) <= 40, `${hand}: jump of ${dist(prev, pos).toFixed(1)} px on tick ${t}`);
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

  it('points each arm toward its blade within 45 degrees during its slash', () => {
    // slash1 runs from tick 11 to 14 (near arm cuts down-forward)
    for (let t = 11; t <= 14; t += 1) {
      const pose = strikePoseAt(TRIANGLE, t);
      const a = ANCHORS[`kratos-${pose}`];
      const adv = strikeAdvanceAt(TRIANGLE, t);
      const shoulder = feet(a.shoulder);
      const grip = feet(a.hand);
      const blade = thrownBladeAt(TRIANGLE, t, poseAnchors, 'near').pos;
      const arm = Math.atan2(grip[1] - shoulder[1], grip[0] - shoulder[0]);
      const toBlade = Math.atan2(blade[1] - shoulder[1], blade[0] - adv - shoulder[0]);
      const off = Math.abs(((arm - toBlade + 3 * Math.PI) % (2 * Math.PI)) - Math.PI);
      assert.ok(off <= (45 * Math.PI) / 180, `tick ${t} (${pose}) near: arm ${((off * 180) / Math.PI).toFixed(0)} degrees off`);
    }
    // slash2 runs from tick 17 to 20 (far arm cuts across)
    for (let t = 17; t <= 20; t += 1) {
      const pose = strikePoseAt(TRIANGLE, t);
      const a = ANCHORS[`kratos-${pose}`];
      const adv = strikeAdvanceAt(TRIANGLE, t);
      const shoulder = feet(a.farShoulder);
      const grip = feet(a.farHand);
      const blade = thrownBladeAt(TRIANGLE, t, poseAnchors, 'far').pos;
      const arm = Math.atan2(grip[1] - shoulder[1], grip[0] - shoulder[0]);
      const toBlade = Math.atan2(blade[1] - shoulder[1], blade[0] - adv - shoulder[0]);
      const off = Math.abs(((arm - toBlade + 3 * Math.PI) % (2 * Math.PI)) - Math.PI);
      assert.ok(off <= (45 * Math.PI) / 180, `tick ${t} (${pose}) far: arm ${((off * 180) / Math.PI).toFixed(0)} degrees off`);
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

  it('hits with both blades across two slashes; does not chain', () => {
    assert.equal(strikeHitWindowAt(TRIANGLE, 4, 'near'), -1, 'not while loading');
    assert.equal(strikeHitWindowAt(TRIANGLE, 12, 'near'), 0, 'during slash1');
    assert.equal(strikeHitWindowAt(TRIANGLE, 18, 'far'), 1, 'during slash2');
    assert.equal(strikeChainTicks(TRIANGLE), null);
  });
});

describe('triangle hits', () => {
  it('hits an enemy in front during the slash, dealing heavy damage and knockback', () => {
    const world = playingWorld();
    const kratos: EntityState = { ...player(world.snapshot()) };
    const template = new World();
    template.loadScenario('legionnaire');
    const foe = template.snapshot().entities.find((e) => e.kind === 'legionnaire')!;
    const enemy: EntityState = { ...foe, id: 'enemy', x: kratos.x + 55, y: kratos.y, hp: 100, isDead: false, aiState: 'approach' };
    const state = startStrike(kratos, 'triangle');
    const hitsOn: number[] = [];
    for (let i = 0; i < strikeLength(TRIANGLE); i += 1) {
      const result = stepStrike(state, kratos, [enemy], -1e6, 1e6);
      hitsOn.push(...result.hits.map(() => state.tick));
      if (result.done) break;
    }
    assert.ok(hitsOn.length >= 1, `should hit at least once, hits: ${hitsOn}`);
    assert.ok(hitsOn[0] >= 11 && hitsOn[0] <= 15, `hits during slash1 (tick 11-15), was ${hitsOn[0]}`);
    assert.equal(enemy.hp, 100 - (TRIANGLE.damage * 2), 'deals 20 damage across 2 slashes');
  });
});

describe('triangle against a close enemy', () => {
  it('hits a legionnaire at Kratos\' feet with the slash and freezes the world there', () => {
    const world = new World();
    world.loadScenario('legionnaire');
    const foe = world.snapshot().entities.find((e) => e.kind === 'legionnaire')!;
    const hp0 = foe.hp;
    world.step(['heavy-attack']);
    let hitTick = -1;
    for (let i = 0; i < 30 && hitTick < 0; i += 1) {
      world.step([]);
      const snap = world.snapshot();
      if (snap.strike?.id === 'triangle' && snap.strike.hits.length > 0) {
        hitTick = snap.strike.tick;
        assert.equal(snap.hitstopTicks, TRIANGLE.hitstopTicks + 3, 'a heavy blow holds the world 3 ticks longer');
      }
    }
    assert.ok(hitTick >= 11 && hitTick <= 20, `hit during slash on tick ${hitTick}`);
    const after = world.snapshot().entities.find((e) => e.kind === 'legionnaire')!;
    assert.ok(after.hp < hp0);
  });
});

describe('triangle in the world', () => {
  it('starts on the I press from idle on the ground, lasts 28 ticks; I and J during it do nothing', () => {
    const world = playingWorld();
    world.step(['heavy-attack']);
    const strike = world.snapshot().strike;
    assert.equal(strike?.id, 'triangle');
    assert.equal(strike?.tick, 0);
    for (let i = 0; i < 27; i += 1) {
      world.step(i % 4 === 0 ? ['heavy-attack'] : i % 4 === 2 ? ['light-attack'] : []);
      assert.equal(world.snapshot().strike?.id, 'triangle');
    }
    assert.equal(world.snapshot().strike?.tick, 27);
    world.step([]);
    assert.equal(world.snapshot().strike, undefined);
  });

  it('fires once per press and turns toward a direction held as it starts', () => {
    const world = playingWorld();
    world.step(['heavy-attack']);
    hold(world, 27, []);
    world.step([]);
    assert.equal(world.snapshot().strike, undefined, 'one triangle per press');
    assert.equal(player(world.snapshot()).facing, 1);
    world.step(['heavy-attack', 'move-left']);
    assert.equal(world.snapshot().strike?.facing, -1);
  });

  it('can be cut short by guarding or jumping from recall tick 2, not before', () => {
    // recall starts at tick 24 (4 + 4 + 3 + 4 + 2 + 4 + 3 = 24). Recall tick 2 is tick 26.
    const cancelTick = 26;
    const early = playingWorld();
    early.step(['heavy-attack']);
    hold(early, cancelTick - 1, []);
    early.step(['guard']);
    assert.equal(early.snapshot().strike?.id, 'triangle', 'guard before recall tick 2 does nothing');

    const guard = playingWorld();
    guard.step(['heavy-attack']);
    hold(guard, cancelTick, []);
    guard.step(['guard']);
    assert.equal(guard.snapshot().strike, undefined);
    assert.notEqual(player(guard.snapshot()).guardPhase, 'none', 'guarding');

    const jump = playingWorld();
    jump.step(['heavy-attack']);
    hold(jump, cancelTick, []);
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
  it('a tap executes the diagonal slash: released before the end of load the slash goes on (level 1)', () => {
    const released = playingWorld();
    released.step(['heavy-attack']);
    hold(released, 5, ['heavy-attack']);
    hold(released, 6, []);
    assert.equal(released.snapshot().strike?.id, 'triangle', 'released early: the slash goes on');
    assert.equal(released.snapshot().strike?.tick, 11);
  });

  it('held through load it becomes the launcher: Kratos stays on the ground (level 2)', () => {
    const held = playingWorld();
    hold(held, 11, ['heavy-attack']);
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
      assert.equal(state.tick, 4, 'grounded after the minimum: the next phase starts');
    } finally {
      delete phase.until;
    }
  });
});

describe('launcher: seamless recall from lift', () => {
  it('recalls the blades directly from their apex without position jumps', () => {
    const LAUNCHER = STRIKES.launcher;
    const lift = LAUNCHER.phases.findIndex((p) => p.id === 'lift');
    const start = LAUNCHER.phases.slice(0, lift).reduce((n, p) => n + p.ticks, 0);
    const end = start + LAUNCHER.phases[lift].ticks;
    for (const hand of ['near', 'far'] as const) {
      const last = bladeAt(LAUNCHER, hand, end - 1, poseAnchors).pos;
      const recall = bladeAt(LAUNCHER, hand, end, poseAnchors).pos;
      assert.ok(Math.hypot(last[0] - recall[0], last[1] - recall[1]) <= 3, `${hand} recall starts seamlessly at apex`);
    }
  });

  it('medium-duration triangle finishes swiftly and starts recall immediately when released', () => {
    const world = playingWorld();
    world.step(['heavy-attack']);
    // Hold 10 ticks through draw and load so triangle branches into launcher
    hold(world, 10, ['heavy-attack']);
    assert.equal(world.snapshot().strike?.id, 'launcher');

    // Release triangle right after launcher starts (medium-duration)
    let ticksInStrike = 0;
    while (world.snapshot().strike?.id === 'launcher') {
      world.step([]);
      ticksInStrike += 1;
    }
    // carry 2 + sweep 12 + lift 8 + recall 10 = 32 ticks
    assert.ok(ticksInStrike <= 33, `launcher should finish swiftly without freeze, took ${ticksInStrike} ticks`);
    assert.equal(player(world.snapshot()).grounded, true, 'Kratos remained grounded');
  });

  it('long-duration triangle branches immediately into Ascension at the end of lift without pausing in the air', () => {
    const world = playingWorld();
    world.step(['heavy-attack']);
    // Hold 10 ticks for draw/load + 23 ticks for carry, sweep, lift
    hold(world, 10 + 23, ['heavy-attack']);
    assert.equal(world.snapshot().strike?.id, 'ascension', 'branches into Ascension immediately after lift');
  });
});
