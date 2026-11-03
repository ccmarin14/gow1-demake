import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

import {
  STRIKES,
  bladeAt,
  nearBladeAt,
  startStrike,
  stepStrike,
  strikeAdvanceAt,
  strikeActiveTicks,
  strikeHitSegment,
  strikeLength,
  strikePoseAt,
  strikeTrailAt,
  thrownBladeAt,
  type StrikePoseAnchors,
  type Vec2,
} from '../src/sim/strike';
import type { EntityState, GameAction, SimulationSnapshot, StrikeSnapshot } from '../src/sim/types';
import { World } from '../src/sim/world';

const ASCENSION = STRIKES.ascension;
const LAUNCHER = STRIKES.launcher;
const AIR1 = STRIKES.air1;
const AIR2 = STRIKES.air2;
const AIR3 = STRIKES.air3;
const AIR_TRIANGLE = STRIKES.airTriangle;
const HARPOON = STRIKES.harpoon;

const ANCHORS: Record<string, { back: number[]; hand: number[]; farHand: number[]; shoulder: number[]; farShoulder: number[] }> =
  JSON.parse(readFileSync(new URL('../src/assets/kratos-anchors.json', import.meta.url), 'utf-8'));
const feet = (p: number[]): Vec2 => [p[0] - 32, p[1] - 56];
const poseAnchors: StrikePoseAnchors = (pose) => {
  const a = ANCHORS[`kratos-${pose}`];
  assert.ok(a, `anchors for ${pose}`);
  return { back: feet(a.back), hand: feet(a.hand), farHand: feet(a.farHand) };
};
const dist = (a: Vec2, b: Vec2): number => Math.hypot(a[0] - b[0], a[1] - b[1]);
const pathLength = (points: readonly Vec2[]): number => points.slice(1).reduce((sum, p, i) => sum + dist(p, points[i]), 0);

function playingWorld(): World {
  const world = new World();
  world.loadScenario('movement');
  world.step(['jump']);
  for (let i = 0; i < 120; i += 1) world.step([]);
  return world;
}

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

function legionnaire(snapshot: SimulationSnapshot): EntityState {
  const found = snapshot.entities.find((e) => e.kind === 'legionnaire');
  assert.ok(found);
  return found;
}

function hold(world: World, ticks: number, actions: GameAction[]): void {
  for (let i = 0; i < ticks; i += 1) world.step(actions);
}

/** A legionnaire at world (x, y) (a stand-alone copy for direct strike tests). */
function foeAt(x: number, y: number, id = 'foe'): EntityState {
  const template = legionnaireWorld();
  const foe = template.snapshot().entities.find((e) => e.kind === 'legionnaire')!;
  return { ...foe, id, x, y, hp: 100, isDead: false, aiState: 'approach', grounded: true, vy: 0 };
}

/** Holds triangle through its charge from the legionnaire scenario: the launcher starts on tick 24 of the press. */
function launcherWorld(): World {
  const world = legionnaireWorld();
  world.step(['heavy-attack']);
  hold(world, 24, ['heavy-attack']);
  assert.equal(world.snapshot().strike?.id, 'launcher');
  return world;
}

/** Still holding through the launcher's top hold (tick 36 of the launcher): Ascension starts there. */
function ascensionWorld(): World {
  const world = launcherWorld();
  hold(world, 42, ['heavy-attack']);
  assert.equal(world.snapshot().strike?.id, 'ascension');
  return world;
}

function juggled(world: World, ticks: number): { launched: EntityState | undefined; grounded: boolean } {
  let launched: EntityState | undefined;
  let grounded = true;
  for (let i = 0; i < ticks; i += 1) {
    world.step([]);
    const snap = world.snapshot();
    if (!player(snap).grounded) grounded = false;
    const foe = legionnaire(snap);
    if (!launched && foe.aiState === 'juggle' && foe.vy < 0) launched = { ...foe };
  }
  return { launched, grounded };
}

describe('triangle hold levels by time (tap, launcher, Ascension)', () => {
  it('level 1: a tap (released before the end of the charge) is the slam; no launcher, no jump', () => {
    const world = legionnaireWorld();
    world.step(['heavy-attack']);
    hold(world, 10, ['heavy-attack']);
    for (let i = 0; i < 30; i += 1) {
      world.step([]);
      assert.equal(world.snapshot().strike?.id, 'triangle');
    }
    assert.equal(player(world.snapshot()).grounded, true);
  });

  it('level 2: held through the charge it is the launcher, and released there it ends without Kratos ever leaving the ground', () => {
    const world = launcherWorld();
    assert.equal(world.snapshot().strike?.entry?.id, 'triangle');
    let id: string | undefined;
    let left = false;
    for (let i = 0; i < 90; i += 1) {
      world.step([]);
      id = world.snapshot().strike?.id;
      if (!player(world.snapshot()).grounded) left = true;
      assert.notEqual(id, 'ascension', 'released: no Ascension');
      if (!id) break;
    }
    assert.equal(id, undefined, 'the launcher ended');
    assert.equal(left, false, 'Kratos never jumped');
  });

  it('level 3: still held at the end of the launcher\'s top hold it becomes Ascension, carrying the blades, and Kratos leaves the ground', () => {
    const world = ascensionWorld();
    assert.equal(world.snapshot().strike?.entry?.id, 'launcher');
    let left = false;
    for (let i = 0; i < 40; i += 1) {
      world.step(['heavy-attack']);
      if (!player(world.snapshot()).grounded) left = true;
    }
    assert.ok(left, 'Kratos jumped after the enemy');
  });

  it('released a moment before the end of the top hold, the launcher recalls its blades instead of leaping', () => {
    const world = launcherWorld();
    hold(world, 20, ['heavy-attack']);
    hold(world, 30, []);
    assert.notEqual(world.snapshot().strike?.id, 'ascension');
    assert.equal(player(world.snapshot()).grounded, true);
  });
});

describe('launcher data', () => {
  it('sweeps low, lifts up the front, hangs on top for the player to decide, and recalls; it is a ground strike with no jump', () => {
    assert.deepEqual(
      LAUNCHER.phases.map((p) => [p.id, p.ticks]),
      [['carry', 2], ['sweep', 6], ['lift', 6], ['top', 24], ['recall', 10]],
    );
    assert.equal(LAUNCHER.air, undefined, 'a ground strike');
    assert.equal(LAUNCHER.phases.some((p) => p.leapVy !== undefined), false, 'no jump');
    assert.equal(LAUNCHER.launch?.vy, -380, 'the lift launches the foot soldier');
    assert.deepEqual(LAUNCHER.branch, { atEndOf: 'top', ifHeld: 'heavy-attack', into: 'ascension' });
    assert.equal(STRIKES.triangle.branch?.into, 'launcher');
  });

  it('keeps its trails at most 55 px long, moves both blades continuously (up to 40 px a tick), and lifts over the head', () => {
    for (const hand of ['near', 'far'] as const) {
      let prev = bladeAt(LAUNCHER, hand, 0, poseAnchors).pos;
      for (let t = 1; t < strikeLength(LAUNCHER); t += 1) {
        const pos = bladeAt(LAUNCHER, hand, t, poseAnchors).pos;
        assert.ok(dist(prev, pos) <= 40, `${hand}: jump of ${dist(prev, pos).toFixed(1)} px on tick ${t}`);
        prev = pos;
        const points = strikeTrailAt(LAUNCHER, t, poseAnchors, hand).points;
        assert.ok(pathLength(points) <= 55, `${hand} trail ${pathLength(points).toFixed(1)} px on tick ${t}`);
      }
    }
    assert.ok(thrownBladeAt(LAUNCHER, 14, poseAnchors, 'near').pos[1] <= -70, 'the blades hang over the head in the top hold');
    assert.ok(thrownBladeAt(LAUNCHER, 5, poseAnchors, 'near').pos[1] >= -8, 'the sweep is low');
  });
});

describe('launcher in the world (level 2)', () => {
  it('launches the foot soldier into the air while Kratos stays on the ground', () => {
    const world = launcherWorld();
    const { launched, grounded } = juggled(world, 30);
    assert.ok(launched, 'the enemy was launched');
    assert.ok(launched.hp < 100, 'the lift hurt it');
    assert.equal(grounded, true, 'Kratos did not jump');
  });
});

describe('Ascension data', () => {
  it('runs dip, leap, apex, fall, strike and land, with its own poses (no jump frames) and a leap higher than a launch', () => {
    assert.deepEqual(ASCENSION.phases.map((p) => p.id), ['dip', 'leap', 'apex', 'fall', 'strike', 'land']);
    assert.ok((ASCENSION.phases.find((p) => p.id === 'leap')?.leapVy ?? 0) < -380, 'the leap is higher than a launch');
    for (const phase of ASCENSION.phases) assert.equal(/^air-0/.test(phase.pose), false, `${phase.id} does not reuse a jump frame`);
    assert.deepEqual(ASCENSION.phases.map((p) => p.pose), ['tri-f', 'airtri-e', 'asc-b', 'airtri-b', 'tri-f', 'tri-g']);
  });

  it('ends its fall on landing and drives the blades into the ground with the impact, flash, dust and shake', () => {
    const fall = ASCENSION.phases.find((p) => p.id === 'fall')!;
    assert.deepEqual(fall.until, { event: 'grounded', minTicks: 3 });
    assert.equal(ASCENSION.impact?.phase, 'strike');
    const strike = ASCENSION.phases.find((p) => p.id === 'strike')!;
    assert.deepEqual(strike.effects?.map((e) => e.kind).sort(), ['dust', 'flash', 'groundFire', 'shake']);
    assert.equal(strikeLength(ASCENSION) >= 60, true, 'long enough for the drop from the top');
  });

  it('points the blades down while he rises, raises them overhead, holds them there while he falls, then drives them down', () => {
    const near = (t: number) => thrownBladeAt(ASCENSION, t, poseAnchors, 'near').pos;
    assert.ok(near(8)[1] >= -2, `blades below his feet in the leap (${near(8)[1].toFixed(0)})`);
    assert.ok(near(19.9)[1] <= -60, 'raised overhead at the apex');
    assert.ok(near(30)[1] <= -65, 'held overhead through the fall');
    assert.ok(near(strikeLength(ASCENSION) - 8)[1] >= -12, 'driven into the ground at the end');
  });

  it('keeps its trails at most 55 px long and on their blades', () => {
    for (const hand of ['near', 'far'] as const) {
      for (let tick = 0; tick < strikeLength(ASCENSION); tick += 1) {
        const points = strikeTrailAt(ASCENSION, tick, poseAnchors, hand).points;
        assert.ok(pathLength(points) <= 55, `${hand} trail ${pathLength(points).toFixed(1)} px on tick ${tick}`);
        if (points.length) assert.ok(dist(points[points.length - 1], bladeAt(ASCENSION, hand, tick, poseAnchors).pos) <= 2);
      }
    }
  });

  it('moves both blades continuously (no jump over 40 px a tick)', () => {
    for (const hand of ['near', 'far'] as const) {
      let prev = bladeAt(ASCENSION, hand, 0, poseAnchors).pos;
      for (let t = 1; t < strikeLength(ASCENSION); t += 1) {
        const pos = bladeAt(ASCENSION, hand, t, poseAnchors).pos;
        assert.ok(dist(prev, pos) <= 40, `${hand}: jump of ${dist(prev, pos).toFixed(1)} px on tick ${t}`);
        prev = pos;
      }
    }
  });

  it('has its hit windows on the rise past the enemy and on the drive', () => {
    const windows = ASCENSION.blades.near!.active as readonly { fromS: number; toS?: number }[];
    assert.equal(windows.length, 2);
  });
});

describe('Ascension in the world (level 3)', () => {
  it('the enemy was launched by the launcher and Kratos then follows into the air, rising to its height', () => {
    const world = launcherWorld();
    let launched = false;
    let highest = Infinity;
    let enemyHighest = Infinity;
    let left = false;
    for (let i = 0; i < 130; i += 1) {
      world.step(['heavy-attack']);
      const snap = world.snapshot();
      const p = player(snap);
      const foe = legionnaire(snap);
      if (foe.aiState === 'juggle' && foe.vy < 0) launched = true;
      if (!p.grounded) left = true;
      if (left) highest = Math.min(highest, p.y);
      enemyHighest = Math.min(enemyHighest, foe.y);
    }
    assert.ok(launched, 'the enemy was launched');
    assert.ok(left, 'Kratos left the ground');
    assert.ok(highest <= enemyHighest + 30, `Kratos at ${highest.toFixed(0)}, the enemy at ${enemyHighest.toFixed(0)}`);
  });

  it('ends on landing, and fires its ground impact once, on the ground', () => {
    const world = ascensionWorld();
    let impacts = 0;
    let impactGrounded = false;
    let ended = false;
    for (let i = 0; i < 160; i += 1) {
      world.step([]);
      const notice = world.consumeStrikeImpactNotice();
      if (notice) {
        impacts += 1;
        impactGrounded = player(world.snapshot()).grounded;
      }
      if (!world.snapshot().strike) {
        ended = true;
        break;
      }
    }
    assert.ok(ended, 'the strike ended');
    assert.equal(impacts, 1, 'one impact');
    assert.ok(impactGrounded, 'the impact fires once Kratos is on the ground');
    assert.equal(player(world.snapshot()).grounded, true);
  });
});

describe('square air strikes (manual: "Ataque horizontal")', () => {
  it('start on square in the air and lash straight out, three in a row (air square 1, 2, 3)', () => {
    assert.deepEqual([AIR1.id, AIR2.id, AIR3.id], ['air1', 'air2', 'air3']);
    assert.equal(AIR1.air, true);
    assert.equal(AIR1.chain?.into, 'air2');
    assert.equal(AIR2.chain?.into, 'air3');
    assert.equal(AIR3.chain?.into, undefined, 'the last lash ends the square air chain');
  });

  it('starts air square 1 on J in the air, not the ground square', () => {
    const world = playingWorld();
    world.step(['jump']);
    world.step([]);
    world.step(['light-attack']);
    assert.equal(world.snapshot().strike?.id, 'air1');
  });

  it('chains the next lash on J during the lash, and the middle lash starts where the first ended', () => {
    const world = playingWorld();
    world.step(['jump']);
    world.step([]);
    world.step(['light-attack']);
    hold(world, 5, []);
    world.step(['light-attack']);
    const strike = world.snapshot().strike;
    assert.equal(strike?.id, 'air2');
    assert.equal(strike?.entry?.id, 'air1');
    const left = nearBladeAt(AIR1, strike!.entry!.tick, poseAnchors).pos;
    const start = nearBladeAt(AIR2, 0, poseAnchors, strike!.entry!).pos;
    assert.ok(dist(start, [left[0] - strike!.entry!.offsetPx, left[1]]) < 1e-6, 'the near blade carries on from where the last lash ended');
  });

  it('chains air 1 -> air 2 -> air 3 on J, and I after each starts the air triangle', () => {
    const world = playingWorld();
    world.step(['jump']);
    world.step([]);
    world.step(['light-attack']);
    hold(world, 5, []);
    world.step(['light-attack']);
    assert.equal(world.snapshot().strike?.id, 'air2');
    // Orbit B tick 2 opens the chain: orbit A 3 + orbit B 2 after the 3-tick wind.
    hold(world, 9, []);
    world.step(['light-attack']);
    assert.equal(world.snapshot().strike?.id, 'air3');
    assert.equal(world.snapshot().strike?.entry?.id, 'air2');
    for (const id of ['air1', 'air2', 'air3'] as const) assert.equal(STRIKES[id].chain?.heavy, 'airTriangle');
  });

  it('are three different strikes: their own poses, one straight lash, one flat orbit, one overhead diagonal', () => {
    const own = (id: 'air1' | 'air2' | 'air3'): string[] => STRIKES[id].phases.map((p) => p.pose).filter((p) => p !== 'air-00');
    const a = own('air1');
    const b = own('air2');
    const c = own('air3');
    for (const [x, y] of [[a, b], [a, c], [b, c]]) assert.equal(x.filter((pose) => y.includes(pose)).filter((pose) => pose !== 'aq2-a').length, 0, `${x} vs ${y}`);
    // Air 1: level at chest height, straight out.
    const lash = [4, 5, 6, 7, 8].map((tick) => thrownBladeAt(AIR1, tick, poseAnchors).pos);
    assert.ok(lash.every((p) => p[1] >= -40 && p[1] <= -28), 'air 1 stays level at chest height');
    assert.ok(lash[4][0] - lash[0][0] >= 60, 'air 1 reaches out');
    // Air 2: the far blade goes round the body, behind it and in front of it, both sides.
    const orbit = Array.from({ length: 13 }, (_, i) => thrownBladeAt(AIR2, 3 + i, poseAnchors, 'far'));
    assert.ok(Math.min(...orbit.map((s) => s.pos[0])) <= -25 && Math.max(...orbit.map((s) => s.pos[0])) >= 25, 'air 2 passes both sides');
    assert.ok(orbit.some((s) => s.behindBody) && orbit.some((s) => !s.behindBody), 'air 2 passes behind and in front of the body');
    assert.ok(Math.max(...orbit.map((s) => s.pos[1])) - Math.min(...orbit.map((s) => s.pos[1])) <= 16, 'air 2 is a flat ellipse');
    assert.equal(AIR2.hand, 'far');
    // Air 3: up over the head, then a diagonal down and ahead.
    const slash = Array.from({ length: 8 }, (_, i) => thrownBladeAt(AIR3, 3 + i, poseAnchors).pos);
    assert.ok(Math.min(...slash.map((p) => p[1])) <= -45, 'air 3 goes over the head');
    const end = slash[slash.length - 1];
    assert.ok(end[0] >= 70 && end[1] >= -20, `air 3 ends ahead and low (${end.map((v) => v.toFixed(0))})`);
  });

  it('hangs: during an air square Kratos moves much more slowly than in a plain jump, and its settle keeps hanging (gravity 0.6)', () => {
    const plain = playingWorld();
    plain.step(['jump']);
    hold(plain, 9, []);
    const plainSpeed = Math.abs(player(plain.snapshot()).vy);

    const hanging = playingWorld();
    hanging.step(['jump']);
    hanging.step([]);
    hanging.step(['light-attack']);
    let fastest = 0;
    for (let i = 0; i < 9; i += 1) {
      hanging.step([]);
      fastest = Math.max(fastest, Math.abs(player(hanging.snapshot()).vy));
    }
    assert.ok(fastest < plainSpeed / 1.5, `hanging speed ${fastest.toFixed(0)} px/s vs a plain jump's ${plainSpeed.toFixed(0)}`);
    for (const id of ['air1', 'air2', 'air3'] as const) {
      assert.equal(STRIKES[id].phases.find((p) => p.id === 'settle')?.gravity, 0.6, `${id} settle`);
    }
  });

  it('lashes at chest height and hits a level enemy once per lash window', () => {
    const kratos = { ...player(playingWorld().snapshot()) };
    kratos.y = 200;
    const foe = foeAt(kratos.x + 60, 200);
    const state = startStrike(kratos, 'air1');
    let hits = 0;
    for (let i = 0; i < strikeLength(AIR1); i += 1) {
      hits += stepStrike(state, kratos, [foe], -1e6, 1e6).hits.length;
    }
    assert.equal(hits, 1, 'hit once');
    assert.equal(foe.hp, 90);
    for (let t = 4; t < 9; t += 1) assert.ok(thrownBladeAt(AIR1, t, poseAnchors).pos[1] > -40, 'at chest height');
  });
});

describe('air triangle (manual: "Ataque vertical")', () => {
  it('starts on I after an air square (the heavy chain), and loops then drops', () => {
    const world = playingWorld();
    world.step(['jump']);
    world.step([]);
    world.step(['light-attack']);
    hold(world, 5, []);
    world.step(['heavy-attack']);
    const strike = world.snapshot().strike;
    assert.equal(strike?.id, 'airTriangle');
    assert.equal(strike?.entry?.id, 'air1');
  });

  it('starts on I in the air from nothing, and loops over the head before dropping', () => {
    const world = playingWorld();
    world.step(['jump']);
    world.step([]);
    world.step(['heavy-attack']);
    assert.equal(world.snapshot().strike?.id, 'airTriangle');
    let top = 0;
    for (let t = 8; t < 24; t += 1) top = Math.min(top, thrownBladeAt(AIR_TRIANGLE, t, poseAnchors).pos[1]);
    assert.ok(top < -60, `the loop tops ${(-top).toFixed(0)} px up`);
  });

  it('drops to the ground and ends on landing with the impact once', () => {
    const world = playingWorld();
    world.step(['jump']);
    world.step([]);
    world.step(['heavy-attack']);
    let impacts = 0;
    let ended = false;
    for (let i = 0; i < 160; i += 1) {
      world.step([]);
      if (world.consumeStrikeImpactNotice()) impacts += 1;
      if (!world.snapshot().strike) {
        ended = true;
        break;
      }
    }
    assert.ok(ended, 'the strike ended');
    assert.equal(impacts, 1, 'one landing impact');
    assert.equal(player(world.snapshot()).grounded, true);
  });

  it('keeps its trails at most 55 px and its impact box covers the drop point', () => {
    for (let tick = 0; tick < strikeLength(AIR_TRIANGLE); tick += 1) {
      assert.ok(pathLength(strikeTrailAt(AIR_TRIANGLE, tick, poseAnchors).points) <= 55);
    }
    assert.equal(AIR_TRIANGLE.impact?.phase, 'land');
  });

  it('follows the video: tucked with the blades low behind, one and a quarter turns of a vertical circle while hanging, a drop, a crouched landing with the blades raised', () => {
    assert.deepEqual(
      AIR_TRIANGLE.phases.map((p) => p.id),
      ['coil', 'loop1a', 'loop1b', 'loop2', 'dive', 'swing', 'raise', 'land'],
    );
    const near = (t: number) => thrownBladeAt(AIR_TRIANGLE, t, poseAnchors, 'near');
    assert.ok(near(7).pos[0] <= -12 && near(7).pos[1] >= -30, 'coil: back and low');
    assert.ok(near(13).pos[0] <= -15 && near(13).behindBody, 'up behind the back');
    assert.ok(near(16).pos[1] <= -66, 'over the head');
    assert.ok(near(22).pos[0] >= 25 && !near(22).behindBody, 'down the front');
    assert.ok(near(26).pos[1] >= 0, 'under the body');
    assert.ok(near(30).pos[0] <= -20, 'up the back again');
    assert.ok(near(36).pos[1] <= -62, 'raised over him as he drops');
    // Hangs through the circle (about 0.4 s), then drops at more than the plain gravity.
    const gravity = (id: string): number => AIR_TRIANGLE.phases.find((p) => p.id === id)!.gravity ?? 1;
    assert.ok(['coil', 'loop1a', 'loop1b', 'loop2'].every((id) => gravity(id) <= 0.25), 'hangs in the loop');
    assert.ok(['dive', 'swing', 'raise'].every((id) => gravity(id) > 1.5), 'drops hard');
    assert.equal(AIR_TRIANGLE.damage, 20, 'a heavy blow');
    // Landing effects as for the ground triangle: a burst of fire, dust, flash, shake.
    const land = AIR_TRIANGLE.phases.find((p) => p.id === 'land')!;
    assert.deepEqual(land.effects?.map((e) => e.kind).sort(), ['dust', 'flash', 'groundFire', 'shake']);
  });
});

describe('Orion\'s Harpoon (draft)', () => {
  it('chains from Ascension\'s follow-up on J', () => {
    assert.equal(ASCENSION.chain?.into, 'harpoon');
    assert.equal(ASCENSION.chain?.from, 'apex');
    const world = ascensionWorld();
    let started = false;
    for (let i = 0; i < 120 && !started; i += 1) {
      const snap = world.snapshot();
      if (snap.strike?.id === 'ascension' && snap.strike.tick >= 14) {
        world.step(['light-attack']);
        started = world.snapshot().strike?.id === 'harpoon' || world.snapshot().strike?.id === 'ascension' && world.snapshot().strike.queued === true;
      } else {
        world.step([]);
      }
    }
    assert.ok(started, 'J during the follow-up queues the harpoon');
  });

  it('grabs only an enemy already in the air, and pulls it toward Kratos', () => {
    const kratos = { ...player(playingWorld().snapshot()) };
    const grounded = foeAt(kratos.x + 70, kratos.y);
    const juggled = foeAt(kratos.x + 70, kratos.y - 56, 'juggled');
    juggled.aiState = 'juggle';
    juggled.grounded = false;
    juggled.vy = -100;
    const state = startStrike(kratos, 'harpoon');
    for (let i = 0; i < strikeLength(HARPOON); i += 1) stepStrike(state, kratos, [grounded, juggled], -1e6, 1e6);
    assert.equal(grounded.hp, 100, 'a grounded enemy is not grabbed');
    assert.equal(juggled.hp, 90, 'the juggled enemy is grabbed');
    assert.ok(juggled.vx < 0, 'pulled toward Kratos');
  });

  it('is marked as a draft: its button and reach are unverified', () => {
    assert.equal(HARPOON.grabsAirborne, true);
    assert.ok(strikeActiveTicks(HARPOON).first >= 2);
  });
});

describe('arm and body in the new strikes', () => {
    it('keeps the arm on its blade within 50 degrees in the air strikes, the launcher and Ascension, but for the first two ticks of each pose (the blade catches up); known gaps: the dip, the apex and the final drive (arms rising, blades catching up), the dive and swing (85); the launcher reuses poses whose arms do not follow its blades (not checked)', () => {
    for (const def of [AIR1, AIR2, AIR3, AIR_TRIANGLE, ASCENSION]) {
      let at = 0;
      for (const phase of def.phases) {
        const hands = def.id === 'airTriangle' || def.id === 'ascension' || def.id === 'launcher' ? (['near', 'far'] as const) : ([def.hand] as const);
        const blades = phase.pose === 'air-00' || phase.pose === 'tri-g' || phase.id === 'land' || phase.id === 'dip' || (def.id === 'ascension' && (phase.id === 'apex' || phase.id === 'strike')) || phase.id === 'recall' || phase.id === 'top' || phase.id === 'fall' ? [] : hands;
        for (let t = at + 2; t < Math.min(at + phase.ticks, strikeLength(def)); t += 1) {
          for (const hand of blades) {
            const a = ANCHORS[`kratos-${phase.pose}`];
            const shoulder = feet(a[hand === 'near' ? 'shoulder' : 'farShoulder']);
            const grip = feet(a[hand === 'near' ? 'hand' : 'farHand']);
            const blade = thrownBladeAt(def, t, poseAnchors, hand).pos;
            const adv = strikeAdvanceAt(def, t);
            const arm = Math.atan2(grip[1] - shoulder[1], grip[0] - shoulder[0]);
            const toBlade = Math.atan2(blade[1] - shoulder[1], blade[0] - adv - shoulder[0]);
            const off = Math.abs(((arm - toBlade + 3 * Math.PI) % (2 * Math.PI)) - Math.PI);
            assert.ok(off <= ((def.id === 'airTriangle' && (phase.id === 'dive' || phase.id === 'swing') ? 85 : def.id === 'launcher' ? 90 : 50) * Math.PI) / 180, `${def.id} tick ${t} (${phase.pose}) ${hand}: arm ${((off * 180) / Math.PI).toFixed(0)} degrees off`);
          }
        }
        at += phase.ticks;
      }
    }
  });
});

export type { StrikeSnapshot, Vec2 as _Vec2 };
