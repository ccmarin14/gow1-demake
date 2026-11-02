import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

import {
  STRIKES,
  nearBladeAt,
  strikeHitSegment,
  strikeLength,
  type StrikePoseAnchors,
  type Vec2,
} from '../src/sim/strike';
import type { EntityState, GameAction, SimulationSnapshot } from '../src/sim/types';
import { World } from '../src/sim/world';

const SQUARE1 = STRIKES.square1;

/** Per-frame anchors exported from the 3D skeleton (canvas px, 64x56, feet at 32,56). */
const ANCHORS: Record<string, { back: number[]; hand: number[]; farHand: number[]; shoulder: number[] }> = JSON.parse(
  readFileSync(new URL('../src/assets/kratos-anchors.json', import.meta.url), 'utf-8'),
);
const feet = (p: number[]): Vec2 => [p[0] - 32, p[1] - 56];
const poseAnchors: StrikePoseAnchors = (pose) => {
  const a = ANCHORS[`kratos-${pose}`];
  assert.ok(a, `anchors for ${pose}`);
  return { back: feet(a.back), hand: feet(a.hand), farHand: feet(a.farHand) };
};

function playingWorld(scenario = 'movement'): World {
  const world = new World();
  world.loadScenario(scenario);
  world.step(['jump']);
  for (let i = 0; i < 120; i += 1) world.step([]);
  return world;
}

/** The legionnaire scenario with the enemy still where it spawned, 50 px ahead. */
function legionnaireWorld(): World {
  const world = new World();
  world.loadScenario('legionnaire');
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

const dist = (a: Vec2, b: Vec2): number => Math.hypot(a[0] - b[0], a[1] - b[1]);

describe('square-1 strike data', () => {
  it('runs draw 5, sweep 4, throw 5, hold 12 and recall 8 ticks (34 in total)', () => {
    assert.deepEqual(
      SQUARE1.phases.map((p) => [p.id, p.ticks]),
      [['draw', 5], ['sweep', 4], ['throw', 5], ['hold', 12], ['recall', 8]],
    );
    assert.equal(strikeLength(SQUARE1), 34);
  });

  it('anchors the blade track on the near shoulder of the throw pose', () => {
    const shoulder = feet(ANCHORS['kratos-sq1-c'].shoulder);
    assert.ok(dist(shoulder, SQUARE1.shoulder) < 0.2, `shoulder ${SQUARE1.shoulder} vs anchors ${shoulder}`);
  });

  it('moves the near blade continuously: no jump over 22 px per tick, none at phase changes', () => {
    const total = strikeLength(SQUARE1);
    let prev = nearBladeAt(SQUARE1, 0, poseAnchors).pos;
    let worstTick = 0;
    for (let t = 1; t < total; t += 1) {
      const pos = nearBladeAt(SQUARE1, t, poseAnchors).pos;
      worstTick = Math.max(worstTick, dist(prev, pos));
      prev = pos;
    }
    assert.ok(worstTick <= 22, `largest per-tick jump ${worstTick.toFixed(1)} px`);
    let start = 0;
    for (const phase of SQUARE1.phases.slice(0, -1)) {
      start += phase.ticks;
      const before = nearBladeAt(SQUARE1, start - 1e-6, poseAnchors).pos;
      const after = nearBladeAt(SQUARE1, start, poseAnchors).pos;
      assert.ok(dist(before, after) < 1, `jump of ${dist(before, after).toFixed(2)} px entering tick ${start}`);
    }
  });

  it('has a hit segment only from the last sweep tick to the last hold tick', () => {
    const active: number[] = [];
    for (let t = 0; t < strikeLength(SQUARE1); t += 1) {
      if (strikeHitSegment(SQUARE1, t)) active.push(t);
    }
    assert.deepEqual(active, Array.from({ length: 18 }, (_, i) => 8 + i));
  });
});

describe('square-1 strike in the world', () => {
  it('starts on the J edge on the ground and lasts 34 ticks', () => {
    const world = playingWorld();
    world.step(['light-attack']);
    const strike = world.snapshot().strike;
    assert.ok(strike);
    assert.equal(strike.id, 'square1');
    assert.equal(strike.tick, 0);
    hold(world, 33, ['light-attack']);
    assert.equal(world.snapshot().strike?.tick, 33);
    world.step([]);
    assert.equal(world.snapshot().strike, undefined);
  });

  it('locks movement and steps the body 7 px forward', () => {
    const world = playingWorld();
    const start = player(world.snapshot());
    world.step(['light-attack']);
    // Holding back, jumping and rolling do nothing while the strike runs.
    hold(world, 10, ['move-left']);
    world.step(['move-left', 'jump']);
    world.step(['move-left', 'dodge']);
    hold(world, 21, ['move-left']);
    const end = player(world.snapshot());
    assert.equal(world.snapshot().strike?.tick, 33);
    assert.equal(end.facing, 1);
    assert.equal(end.vx, 0);
    assert.equal(end.rollPhase, 'none');
    assert.ok(end.grounded);
    assert.ok(Math.abs(end.x - start.x - 7) < 1e-6, `advanced ${end.x - start.x} px`);
  });

  it('advances toward the facing when Kratos faces left', () => {
    const world = playingWorld();
    hold(world, 1, ['move-left']);
    hold(world, 30, []);
    const start = player(world.snapshot());
    assert.equal(start.facing, -1);
    world.step(['light-attack']);
    hold(world, 33, []);
    assert.ok(Math.abs(player(world.snapshot()).x - start.x + 7) < 1e-6);
  });

  it('does not start in the air, while rolling or while guarding', () => {
    const air = playingWorld();
    air.step(['jump']);
    air.step([]);
    air.step(['light-attack']);
    assert.equal(air.snapshot().strike, undefined);

    const rolling = playingWorld();
    rolling.step(['dodge']);
    rolling.step(['light-attack']);
    assert.equal(rolling.snapshot().strike, undefined);

    const guarding = playingWorld();
    hold(guarding, 3, ['guard']);
    guarding.step(['guard', 'light-attack']);
    assert.equal(guarding.snapshot().strike, undefined);
  });

  it('ignores J pressed again before the hit window (no buffered square-2)', () => {
    const world = playingWorld();
    world.step(['light-attack']);
    hold(world, 2, []);
    world.step(['light-attack']);
    assert.equal(world.snapshot().strike?.tick, 3);
    hold(world, 30, []);
    assert.equal(world.snapshot().strike?.id, 'square1');
    assert.equal(world.snapshot().strike?.tick, 33);
    world.step([]);
    assert.equal(world.snapshot().strike, undefined);
    world.step(['light-attack']);
    assert.equal(world.snapshot().strike?.tick, 0);
  });

  it('hits the legionnaire once per strike and freezes the world 4 ticks on contact', () => {
    const world = legionnaireWorld();
    const hp0 = enemy(world.snapshot()).hp;
    world.step(['light-attack']);
    let hitTick = -1;
    for (let i = 0; i < 40 && hitTick < 0; i += 1) {
      world.step([]);
      const snap = world.snapshot();
      if (snap.strike && snap.strike.hits.length > 0) hitTick = snap.strike.tick;
    }
    assert.ok(hitTick >= 8 && hitTick <= 25, `hit on strike tick ${hitTick}`);
    const atHit = world.snapshot();
    assert.equal(enemy(atHit).hp, hp0 - SQUARE1.damage);
    assert.equal(enemy(atHit).aiState, 'hitstun');
    assert.equal(atHit.hitstopTicks, SQUARE1.hitstopTicks);

    for (let i = 0; i < SQUARE1.hitstopTicks; i += 1) {
      world.step([]);
      const frozen = world.snapshot();
      assert.equal(frozen.strike?.tick, hitTick, `strike frozen on hitstop tick ${i}`);
      assert.equal(enemy(frozen).x, enemy(atHit).x);
      assert.equal(enemy(frozen).hitstunTicks, enemy(atHit).hitstunTicks);
    }
    world.step([]);
    assert.equal(world.snapshot().strike?.tick, hitTick + 1);

    hold(world, 40, []);
    assert.equal(world.snapshot().strike, undefined);
    assert.equal(enemy(world.snapshot()).hp, hp0 - SQUARE1.damage, 'one hit per strike');
  });

  it('can hit the same target again with a new strike', () => {
    const world = legionnaireWorld();
    const hp0 = enemy(world.snapshot()).hp;
    world.step(['light-attack']);
    hold(world, 50, []);
    world.step(['light-attack']);
    hold(world, 50, []);
    assert.equal(enemy(world.snapshot()).hp, hp0 - 2 * SQUARE1.damage);
  });

  it('misses a target outside the blade reach', () => {
    const world = legionnaireWorld();
    // Face away from the legionnaire: the strike goes the other way.
    world.step(['move-left']);
    hold(world, 20, []);
    const hp0 = enemy(world.snapshot()).hp;
    world.step(['light-attack']);
    hold(world, 33, []);
    assert.equal(world.snapshot().hitstopTicks, 0);
    assert.equal(enemy(world.snapshot()).hp, hp0);
  });
});
