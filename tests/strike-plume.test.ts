import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

import { CONFIG } from '../src/config';
import { groundFireColumns } from '../src/entities/groundFire';
import {
  STRIKES,
  bladeAt,
  farBladeAt,
  nearBladeAt,
  startStrike,
  stepGroundFires,
  stepStrike,
  strikeAdvanceAt,
  strikeChainTicks,
  strikeEffectsAt,
  strikeHitSegment,
  strikeImpactTick,
  strikeLength,
  strikePoseAt,
  strikeTrailAt,
  thrownBladeAt,
  type StrikeDef,
  type StrikeEntry,
  type Vec2,
} from '../src/sim/strike';
import type { EntityState, GameAction, GroundFireState, SimulationSnapshot } from '../src/sim/types';
import { World } from '../src/sim/world';
import { ANCHORS, feet, poseAnchors, dist, pathLength } from './helpers/anchors';

const PLUME = STRIKES.plume;
const TRIANGLE = STRIKES.triangle;

const close = (a: readonly number[], b: readonly number[]): boolean => dist(a as Vec2, b as Vec2) < 1e-3;
const PALETTE = CONFIG.presentation.strikeArt.trail;

interface Fixture {
  entry?: StrikeEntry;
  samples: { t: number; near: number[]; nearChain: boolean; nearBehind: boolean; far: number[]; farChain: boolean; farBehind: boolean; adv: number }[];
  ticks: { tick: number; pose: string; nearTrail: number[][]; farTrail: number[][]; nearHit: number[][] | null; farHit: number[][] | null }[];
}

/** Every blade position, chain, depth, pose, trail and hit segment of `def` matches its recorded fixture. */
function assertMatchesFixture(def: StrikeDef, file: string): void {
  const fixture: Fixture = JSON.parse(readFileSync(new URL(`./fixtures/${file}`, import.meta.url), 'utf-8'));
  for (const q of fixture.samples) {
    const near = nearBladeAt(def, q.t, poseAnchors, fixture.entry);
    const far = farBladeAt(def, q.t, poseAnchors, fixture.entry);
    assert.ok(close(near.pos, q.near), `${def.id} near blade at ${q.t}`);
    assert.ok(close(far.pos, q.far), `${def.id} far blade at ${q.t}`);
    assert.equal(near.chainOut, q.nearChain);
    assert.equal(far.chainOut, q.farChain);
    assert.equal(near.behindBody, q.nearBehind);
    assert.equal(far.behindBody, q.farBehind);
    assert.ok(Math.abs(strikeAdvanceAt(def, q.t) - q.adv) < 1e-3);
  }
  for (const k of fixture.ticks) {
    assert.equal(strikePoseAt(def, k.tick), k.pose);
    for (const [hand, points, hit] of [['near', k.nearTrail, k.nearHit], ['far', k.farTrail, k.farHit]] as const) {
      const trail = strikeTrailAt(def, k.tick, poseAnchors, hand);
      assert.equal(trail.points.length, points.length, `${def.id} ${hand} trail length on tick ${k.tick}`);
      trail.points.forEach((p, i) => assert.ok(close(p, points[i]), `${def.id} ${hand} trail point ${i} on tick ${k.tick}`));
      const segment = strikeHitSegment(def, k.tick, hand);
      assert.equal(segment === null, hit === null);
      if (segment && hit) assert.ok(close(segment[0], hit[0]) && close(segment[1], hit[1]));
    }
  }
}

function playingWorld(scenario = 'movement'): World {
  const world = new World();
  world.loadScenario(scenario);
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

/** Square 1, square 2 and then triangle in square 2's chain window. */
function plumeWorld(): World {
  const world = playingWorld();
  world.step(['light-attack']);
  hold(world, 20, []);
  world.step(['light-attack']);
  hold(world, 14, []);
  world.step(['heavy-attack']);
  return world;
}

/** A legionnaire on the ground at world x `x` (a copy, not in any world). */
function legionnaireAt(x: number, y: number, id: string): EntityState {
  const template = new World();
  template.loadScenario('legionnaire');
  const foe = template.snapshot().entities.find((e) => e.kind === 'legionnaire')!;
  return { ...foe, id, x, y, hp: 100, isDead: false, aiState: 'approach', grounded: true, vy: 0 };
}

const SLAM = strikeImpactTick(PLUME);

describe('approved strikes stay as recorded', () => {
  it('keeps the triangle as re-recorded after the user feedback (landing 101 px ahead, fire from the pull)', () => assertMatchesFixture(TRIANGLE, 'triangle-track.json'));
  it('keeps Plume of Prometheus as recorded in this draft (chained from square 2)', () => {
    const fixture = JSON.parse(readFileSync(new URL('./fixtures/plume-track.json', import.meta.url), 'utf-8'));
    for (const q of fixture.samples) {
      const near = nearBladeAt(PLUME, q.t, poseAnchors, fixture.entry);
      assert.ok(close(near.pos, q.near), `plume near blade at ${q.t}`);
      assert.ok(close(farBladeAt(PLUME, q.t, poseAnchors, fixture.entry).pos, q.far), `plume far blade at ${q.t}`);
    }
    for (const k of fixture.ticks) {
      assert.equal(strikeTrailAt(PLUME, k.tick, poseAnchors, 'near').points.length, k.nearTrail.length, `plume trail length on tick ${k.tick}`);
    }
  });
  it('keeps the critic-reviewed squares 3 and 4', () => {
    assertMatchesFixture(STRIKES.square3, 'square3-track.json');
    assertMatchesFixture(STRIKES.square4, 'square4-track.json');
  });
  it('starts square 4 compact above the shoulder and keeps its fire trail through throw and hold', () => {
    const entry: StrikeEntry = { id: 'square3', tick: 22, offsetPx: 2, turned: false };
    for (const t of [0, 1, 2]) {
      const near = nearBladeAt(STRIKES.square4, t, poseAnchors, entry);
      assert.ok(near.pos[0] <= 26, `square4 prep at t=${t} stays close to the head (x=${near.pos[0].toFixed(1)})`);
    }
    assert.ok(nearBladeAt(STRIKES.square4, 11, poseAnchors, entry).pos[0] >= 85, 'square4 whips out past 85 px');
    assert.ok(pathLength(strikeTrailAt(STRIKES.square4, 4, poseAnchors, 'near').points) >= 12, 'square4 trail starts on tick 4');
    for (let tick = 5; tick <= 18; tick += 1) {
      const trail = strikeTrailAt(STRIKES.square4, tick, poseAnchors, 'near');
      assert.ok(pathLength(trail.points) >= 24, `square4 trail sustained on tick ${tick}`);
    }
  });
  it('keeps air square 1 exactly as recorded (approved, not to be changed)', () => assertMatchesFixture(STRIKES.air1, 'air1-track.json'));
});

describe('ground fire line', () => {
  const columns = (age: number, seed = 7): ReturnType<typeof groundFireColumns> => groundFireColumns(100, 168, 3, age, 8, seed, PALETTE);

  it('is irregular flame tongues 1 to 3 px tall, not a ruler, the pale colour only at the base', () => {
    const first = columns(0);
    assert.equal(first.length, 69, 'covers the whole line on its first tick');
    const heights = first.map((c) => c.colors.length);
    assert.ok(heights.every((h) => h >= 1 && h <= 3));
    assert.ok(new Set(heights).size === 3, 'all three heights appear');
    const period2 = heights.every((h, i) => i < 2 || h === heights[i - 2]);
    assert.equal(period2, false, 'not a regular pattern');
    for (const c of first) {
      c.colors.slice(1).forEach((color) => assert.notEqual(color, PALETTE.white, 'white only at the base'));
    }
  });

  it('is reproducible and flickers with the tick', () => {
    assert.deepEqual(columns(2), columns(2));
    assert.notDeepEqual(columns(2).map((c) => c.colors.length), columns(3).map((c) => c.colors.length));
  });

  it('burns out from both ends toward the centre over its ticks', () => {
    const widths = [0, 2, 4, 6, 7].map((age) => {
      const c = columns(age);
      return [c[0]?.x ?? NaN, c[c.length - 1]?.x ?? NaN];
    });
    for (let i = 1; i < widths.length; i += 1) {
      assert.ok(widths[i][0] > widths[i - 1][0] && widths[i][1] < widths[i - 1][1], `narrower at step ${i}`);
    }
    assert.ok(columns(8).length <= 1, 'gone at the end');
  });
});

describe('fast blades do not tunnel', () => {
  it('a 10 px wide enemy in the triangle\'s 40 px/tick descent is hit', () => {
    const target = CONFIG.combat.target as { halfWidth: number };
    const halfWidth = target.halfWidth;
    target.halfWidth = 5;
    try {
      // The fastest tick of the descent, and the midpoint of what it sweeps.
      let fastest = 0;
      let best = 0;
      for (let t = 33; t <= strikeImpactTick(TRIANGLE); t += 1) {
        const step = dist(thrownBladeAt(TRIANGLE, t - 1, poseAnchors).pos, thrownBladeAt(TRIANGLE, t, poseAnchors).pos);
        if (step > best) [best, fastest] = [step, t];
      }
      assert.ok(best >= 25, `fastest step ${best.toFixed(1)} px`);
      const a = thrownBladeAt(TRIANGLE, fastest - 1, poseAnchors).pos;
      const b = thrownBladeAt(TRIANGLE, fastest, poseAnchors).pos;
      const mid: Vec2 = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      const world = playingWorld();
      const kratos: EntityState = { ...player(world.snapshot()) };
      // Hurt box from the ground up to 48 px: put its middle row on the swept point.
      const foe = legionnaireAt(kratos.x + mid[0], kratos.y, 'thin');
      const state = startStrike(kratos, 'triangle');
      let hitTick = -1;
      for (let i = 0; i < fastest; i += 1) {
        const result = stepStrike(state, kratos, [foe], -1e6, 1e6);
        if (result.hits.length && hitTick < 0) hitTick = state.tick;
      }
      assert.ok(hitTick > 0 && hitTick <= fastest, `hit on tick ${hitTick}`);
    } finally {
      target.halfWidth = halfWidth;
    }
  });
});

describe('Plume of Prometheus data', () => {
  it('replaces the plain triangle in square 2\'s chain window only', () => {
    assert.equal(STRIKES.square2.chain?.heavy, 'plume');
    for (const id of ['square1', 'square3', 'square4', 'square5'] as const) assert.equal(STRIKES[id].chain?.heavy, 'triangle');
  });

  it('runs carry 7, top 4, over 4, down 4, slam 14 and recall 10 (43): no long windup', () => {
    assert.deepEqual(
      PLUME.phases.map((p) => [p.id, p.ticks]),
      [['carry', 7], ['top', 4], ['over', 4], ['down', 4], ['slam', 14], ['recall', 10]],
    );
    assert.equal(strikeLength(PLUME), 43);
    assert.equal(SLAM, 19);
    assert.ok(SLAM < strikeImpactTick(TRIANGLE) - 10, 'slams much sooner than the plain triangle');
  });

  it('carries both blades from where square 2 left them up behind the head, without stalling at the link', () => {
    const entry: StrikeEntry = { id: 'square2', tick: 15, offsetPx: strikeAdvanceAt(STRIKES.square2, 14), turned: false };
    for (const hand of ['near', 'far'] as const) {
      const left = bladeAt(STRIKES.square2, hand, 15, poseAnchors).pos;
      assert.ok(dist(bladeAt(PLUME, hand, 0, poseAnchors, entry).pos, [left[0] - entry.offsetPx, left[1]]) < 1e-6, `${hand} from square 2`);
      for (let t = 1; t <= 3; t += 1) {
        const step = dist(bladeAt(PLUME, hand, t, poseAnchors, entry).pos, bladeAt(PLUME, hand, t - 1, poseAnchors, entry).pos);
        assert.ok(step >= 1, `${hand} moves at the link (tick ${t}: ${step.toFixed(1)} px)`);
      }
      const top = bladeAt(PLUME, hand, 9, poseAnchors, entry).pos;
      assert.ok(top[0] < 0 && top[1] < -55, `${hand} raised behind the head`);
    }
  });

  it('slams two crescents into the ground in front', () => {
    const near = thrownBladeAt(PLUME, SLAM, poseAnchors, 'near').pos;
    const far = thrownBladeAt(PLUME, SLAM, poseAnchors, 'far').pos;
    assert.ok(near[0] >= 70 && near[0] <= 90, `near lands ${near[0].toFixed(1)} px ahead`);
    assert.ok(near[0] - far[0] >= 8, 'the far one lands behind it');
    for (const p of [near, far]) assert.ok(p[1] >= -4, 'on the ground');
    let top = 0;
    for (let t = 11; t <= SLAM; t += 0.25) top = Math.min(top, thrownBladeAt(PLUME, t, poseAnchors).pos[1]);
    assert.ok(top < -65, `over the head (${(-top).toFixed(1)} px up)`);
  });

  it('moves both blades continuously (up to 40 px a tick into the ground)', () => {
    for (const hand of ['near', 'far'] as const) {
      let prev = bladeAt(PLUME, hand, 0, poseAnchors).pos;
      for (let t = 1; t < strikeLength(PLUME); t += 1) {
        const pos = bladeAt(PLUME, hand, t, poseAnchors).pos;
        const limit = t >= 15 && t <= SLAM ? 40 : 30;
        assert.ok(dist(prev, pos) <= limit, `${hand}: jump of ${dist(prev, pos).toFixed(1)} px on tick ${t}`);
        prev = pos;
      }
      let at = 0;
      for (const phase of PLUME.phases.slice(0, -1)) {
        at += phase.ticks;
        const before = bladeAt(PLUME, hand, at - 1e-6, poseAnchors).pos;
        const after = bladeAt(PLUME, hand, at, poseAnchors).pos;
        assert.ok(dist(before, after) < 1, `${hand}: jump entering tick ${at}`);
      }
    }
  });

  it('points each arm at its blade from the raise through the slam (within 40 degrees)', () => {
    for (let t = 1; t < 33; t += 1) {
      if (t === 11 || t === 15) continue; // first tick of the over and down poses
      const pose = strikePoseAt(PLUME, t);
      const a = ANCHORS[`kratos-${pose}`];
      const adv = strikeAdvanceAt(PLUME, t);
      for (const [hand, shoulderKey, handKey] of [['near', 'shoulder', 'hand'], ['far', 'farShoulder', 'farHand']] as const) {
        const shoulder = feet(a[shoulderKey]);
        const grip = feet(a[handKey]);
        const blade = thrownBladeAt(PLUME, t, poseAnchors, hand).pos;
        const arm = Math.atan2(grip[1] - shoulder[1], grip[0] - shoulder[0]);
        const toBlade = Math.atan2(blade[1] - shoulder[1], blade[0] - adv - shoulder[0]);
        const off = Math.abs(((arm - toBlade + 3 * Math.PI) % (2 * Math.PI)) - Math.PI);
        assert.ok(off <= (40 * Math.PI) / 180, `tick ${t} (${pose}) ${hand}: arm ${((off * 180) / Math.PI).toFixed(0)} degrees off`);
      }
    }
  });

  it('keeps each trail at most 55 px long and on its blade', () => {
    for (const hand of ['near', 'far'] as const) {
      for (let tick = 0; tick < strikeLength(PLUME); tick += 1) {
        const points = strikeTrailAt(PLUME, tick, poseAnchors, hand).points;
        assert.ok(pathLength(points) <= 55, `${hand} trail ${pathLength(points).toFixed(1)} px on tick ${tick}`);
        if (points.length) assert.ok(dist(points[points.length - 1], bladeAt(PLUME, hand, tick, poseAnchors).pos) <= 2);
      }
    }
  });

  it('slams with flash, dust, shake and a hit box over the fire, and leaves the fire burning as its own entity', () => {
    const effects = strikeEffectsAt(PLUME, SLAM);
    const fire = effects.find((e) => e.kind === 'groundFire');
    const flash = effects.find((e) => e.kind === 'flash');
    assert.ok(fire?.kind === 'groundFire' && fire.linger, 'a lingering fire');
    assert.ok(flash?.kind === 'flash');
    assert.deepEqual([PLUME.impact!.from, PLUME.impact!.to], [fire.from, fire.to]);
    const landing = thrownBladeAt(PLUME, SLAM, poseAnchors, 'near').pos[0];
    assert.ok(Math.abs(flash.x - landing) <= 2, `flash at ${flash.x}, blade at ${landing.toFixed(1)}`);
    assert.equal(fire.ticks, 22, 'burns about as long as on the reference (16.53-16.90 s)');
    const world = playingWorld();
    const kratos: EntityState = { ...player(world.snapshot()) };
    const state = startStrike(kratos, 'plume');
    let fires: GroundFireState[] | undefined;
    for (let i = 0; i < SLAM; i += 1) fires = stepStrike(state, kratos, [], -1e6, 1e6).fires ?? fires;
    assert.ok(fires && fires.length === 1, 'spawned on the slam tick');
    assert.deepEqual([fires[0].x0, fires[0].x1], [state.originX + 20, state.originX + 80]);
    assert.equal(fires[0].ticks, 22);
  });

  it('the fire hits each enemy standing in it once, lifts it, then burns out', () => {
    const fire: GroundFireState = {
      x0: 100, x1: 160, y: 262, heightPx: 3, ticks: 22, age: 0, damage: 10, hitstunTicks: 16, liftVy: -220, hits: [],
    };
    const inside = legionnaireAt(130, 262, 'inside');
    const outside = legionnaireAt(200, 262, 'outside');
    let fires = [fire];
    let rounds = 0;
    while (fires.length > 0) {
      fires = stepGroundFires(fires, [inside, outside], true).fires;
      rounds += 1;
    }
    assert.equal(rounds, 22, 'burns 22 ticks');
    assert.equal(inside.hp, 90, 'hit once');
    assert.equal(inside.aiState, 'juggle');
    assert.ok(inside.vy < 0 && !inside.grounded, 'lifted');
    assert.equal(outside.hp, 100, 'not standing in it');
  });
});

describe('Plume of Prometheus in the world', () => {
  it('starts on triangle in square 2\'s chain window and runs 43 ticks; I during it does nothing', () => {
    const world = plumeWorld();
    assert.equal(world.snapshot().strike?.id, 'plume');
    assert.equal(world.snapshot().strike?.entry?.id, 'square2');
    for (let i = 0; i < 42; i += 1) world.step(i % 5 === 0 ? ['heavy-attack'] : []);
    assert.equal(world.snapshot().strike?.id, 'plume');
    assert.equal(world.snapshot().strike?.tick, 42);
    world.step([]);
    assert.equal(world.snapshot().strike, undefined);
    assert.equal(strikeChainTicks(PLUME), null);
  });

  it('turns toward a direction held at the link', () => {
    const world = playingWorld();
    world.step(['light-attack']);
    hold(world, 20, []);
    world.step(['light-attack']);
    hold(world, 10, []);
    hold(world, 4, ['move-left']);
    world.step(['heavy-attack', 'move-left']);
    assert.equal(world.snapshot().strike?.id, 'plume');
    assert.equal(world.snapshot().strike?.facing, -1);
  });

  it('leaves the fire burning on the ground after a guard cuts its recall short', () => {
    const world = plumeWorld();
    hold(world, SLAM + 14 + 6, []);
    assert.ok((world.snapshot().groundFires ?? []).length === 1, 'the fire burns');
    world.step(['guard']);
    assert.equal(world.snapshot().strike, undefined, 'guard cut the recall');
    assert.ok((world.snapshot().groundFires ?? []).length === 1, 'the fire still burns');
    hold(world, 10, ['guard']);
    assert.equal((world.snapshot().groundFires ?? []).length, 0, 'then burns out');
  });

  it('keeps the fire burning while the view reads the impact notice every tick, and clears it on a new scenario', () => {
    const world = plumeWorld();
    for (let i = 0; i < SLAM + 5; i += 1) {
      world.step([]);
      world.consumeStrikeImpactNotice();
    }
    assert.equal((world.snapshot().groundFires ?? []).length, 1, 'still burning');
    world.loadScenario('movement');
    assert.equal((world.snapshot().groundFires ?? []).length, 0, 'gone with the scenario');
  });

  it('can be cut short by jumping from recall tick 6', () => {
    const world = plumeWorld();
    hold(world, SLAM + 14 + 6, []);
    world.step(['jump']);
    assert.equal(world.snapshot().strike, undefined);
    assert.equal(player(world.snapshot()).grounded, false);
  });
});
