import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { withoutGrabHitstop } from './helpers/grab-hitstop';
import { CONFIG } from '../src/config';
import {
  HELD_FRAMES,
  grabBladeAngle,
  grabBladePoint,
  kratosAnchorWorld,
  kratosGrabFrameKey,
  victimAnchorWorld,
  victimPose,
} from '../src/scene/grabPose';
import type { VictimPose } from '../src/scene/grabPose';
import { getLegionnaireFrameKey } from '../src/scene/legionnaireFrames';
import { PLAYER_ID } from '../src/sim/types';
import type { EntityState, GameAction } from '../src/sim/types';
import { World } from '../src/sim/world';

// Each test file runs in its own process: the ticks of the chain are counted without the hitstop freezes
withoutGrabHitstop();

// Contact between the two bodies of the circle (○) grab, tick by tick (BL-45, D-54). The simulation tests
// say where the entities are; these say that the drawings sit right against each other.

interface Tick {
  phase: string;
  t: number;
  player: EntityState;
  victim: EntityState;
  frameKey: string | null;
  pose: VictimPose | null;
}

function record(actions: (tick: number, player: EntityState) => GameAction[], ticks: number, victimX = 328): Tick[] {
  const world = new World();
  world.loadScenario('level1');
  const p = world.peekEntity(PLAYER_ID) as EntityState;
  const victim = world.peekEntity('legionnaire-deck-1') as EntityState;
  p.x = 300;
  p.facing = 1;
  victim.x = victimX;
  victim.y = p.y;
  victim.hp = 60;
  const out: Tick[] = [];
  for (let i = 0; i < ticks; i += 1) {
    world.step(actions(i, p));
    out.push({
      phase: p.grabPhase,
      t: p.grabTicks,
      player: { ...p },
      victim: { ...victim },
      frameKey: kratosGrabFrameKey(p),
      pose: victimPose(p, victim),
    });
  }
  return out;
}

// ○ (grab), then three punches, the slam and four stabs: one tap each, as soon as the chain accepts it.
function circleChain(totalTaps: number): (tick: number, player: EntityState) => GameAction[] {
  let taps = 0;
  return (tick, p) => {
    const ready = tick === 0 || ((p.grabPhase === 'hold' || p.grabPhase === 'floorhold') && p.grabTicks >= 2);
    if (!ready || taps >= totalTaps) return [];
    taps += 1;
    return ['grab'];
  };
}
// ○ then □ (the Toss).
const TOSS = (tick: number): GameAction[] => (tick === 0 ? ['grab'] : tick === 3 ? ['light-attack'] : []);

function bodyBox(file: string): { x0: number; x1: number; y0: number; y1: number } {
  const rows = readFileSync(new URL(`../grids/legionnaire/${file}`, import.meta.url), 'utf8').split('\n').filter(Boolean);
  let x0 = 99;
  let x1 = -1;
  let y0 = 99;
  let y1 = -1;
  rows.forEach((row, y) => {
    [...row].forEach((c, x) => {
      if (c === '.') return;
      x0 = Math.min(x0, x);
      x1 = Math.max(x1, x);
      y0 = Math.min(y0, y);
      y1 = Math.max(y1, y);
    });
  });
  return { x0, x1, y0, y1 };
}

// The two ticks of the lunge: Kratos is still reaching for the neck, the soldier is not lifted yet.
const LUNGE = 'kratos-grab-lunge';

describe('circle grab: the drawings in contact (BL-45)', () => {
  const chain = record(circleChain(1 + 3 + 1 + 4), 330);
  const held = chain.filter((k) => k.phase === 'hold' || k.phase === 'pummel');

  it('the sequence really goes through hold, pummel, slam, floorhold and stab', () => {
    const phases = new Set(chain.map((k) => k.phase));
    for (const phase of ['hold', 'pummel', 'slam', 'floorhold', 'stab']) assert.ok(phases.has(phase), phase);
  });

  it('every Kratos grab frame has the anchors the presentation needs', () => {
    for (const k of chain) {
      if (!k.frameKey) continue;
      assert.ok(kratosAnchorWorld(k.player, k.frameKey, 'hand'), `${k.frameKey} has a hand anchor`);
      assert.ok(kratosAnchorWorld(k.player, k.frameKey, 'farHand'), `${k.frameKey} has a far hand anchor`);
    }
  });

  it('C1: the soldier hangs by the neck from Kratos\' far hand while held and punched', () => {
    assert.ok(held.length > 40);
    for (const k of held.filter((h) => h.frameKey !== LUNGE)) {
      assert.ok(k.pose && k.frameKey, `${k.phase} ${k.t}: has a pose`);
      const hand = kratosAnchorWorld(k.player, k.frameKey!, 'farHand')!;
      const neck = victimAnchorWorld(k.pose!, 'neck')!;
      assert.ok(neck, 'neck anchor');
      const punched = k.pose!.textureKey === HELD_FRAMES[1];
      const gap = Math.hypot(hand[0] - neck[0], hand[1] - neck[1]);
      assert.ok(Math.abs(gap - 4) <= (punched ? 4 : 0.5), `${k.phase} ${k.t} (${k.frameKey}): neck ${gap.toFixed(1)} px from the hand (grip 4 px)`);
    }
  });

  it('C2: the soldier\'s feet are at least 6 px off the floor while he is held', () => {
    for (const k of held.filter((h) => h.frameKey !== LUNGE)) {
      const feet = k.player.y - k.pose!.y;
      assert.ok(feet >= 6, `${k.phase} ${k.t} (${k.frameKey}): feet ${feet.toFixed(1)} px up`);
    }
  });

  it('C3: held, he only uses frames of a soldier off his feet; on the floor, only the lying one', () => {
    for (const k of chain) {
      if (!k.pose) continue;
      if (k.frameKey === LUNGE) {
        assert.equal(k.pose.textureKey, 'legionnaire-hitstun-00', 'still standing while Kratos lunges for the neck');
      } else if (k.phase === 'hold' || k.phase === 'pummel') {
        assert.ok((HELD_FRAMES as readonly string[]).includes(k.pose.textureKey), `${k.phase} ${k.t}: ${k.pose.textureKey}`);
      }
      if (k.phase === 'floorhold' || k.phase === 'stab') {
        assert.equal(k.pose.textureKey, 'legionnaire-death-02', `${k.phase} ${k.t}`);
      }
    }
  });

  it('C4: the blade lands on the lying body at the tick of every stab', () => {
    const body = bodyBox('death-02.txt');
    const impact = CONFIG.player.grab.chain.stabImpactTick;
    const hits = chain.filter((k) => k.phase === 'stab' && k.t >= impact && k.t <= impact + 3);
    assert.ok(hits.length >= 3 * 4 + 1, 'four stabs, four ticks of blade in each');
    for (const k of hits) {
      const tip = grabBladePoint(k.player, k.frameKey!, grabBladeAngle(k.player), 1);
      const f = k.pose!.flipX ? -1 : 1;
      const [a, b] = [k.pose!.x + f * (body.x0 - 32), k.pose!.x + f * (body.x1 + 1 - 32)];
      const [left, right] = [Math.min(a, b), Math.max(a, b)];
      assert.ok(Math.abs(tip[0] - (left + right) / 2) <= 8, `stab ${k.t}: the blade is ${Math.abs(tip[0] - (left + right) / 2).toFixed(1)} px from the middle of the body`);
      const top = k.pose!.y + body.y0 - 56;
      const bottom = k.pose!.y + body.y1 + 1 - 56;
      assert.ok(tip[0] >= left - 1 && tip[0] <= right + 1, `stab ${k.t}: tip x ${tip[0].toFixed(1)} outside ${left.toFixed(1)}..${right.toFixed(1)}`);
      assert.ok(tip[1] >= top - 1 && tip[1] <= bottom + 1, `stab ${k.t}: tip y ${tip[1].toFixed(1)} outside ${top.toFixed(1)}..${bottom.toFixed(1)}`);
    }
  });

  it('the Toss holds him in the frames of a soldier off his feet until he is let go', () => {
    const toss = record(TOSS, 60).filter((k) => k.phase === 'throw' && k.t < CONFIG.player.grab.toss.releaseTick);
    assert.ok(toss.length >= CONFIG.player.grab.toss.releaseTick - 1);
    for (const k of toss) {
      assert.ok((HELD_FRAMES as readonly string[]).includes(k.pose!.textureKey), `toss ${k.t}: ${k.pose!.textureKey}`);
    }
  });
});

// What the audit of the real game found (docs/tmp/auditoria-circulo): the instant checks above could not see a
// pose that flashes back, a teleport of 26 px or a body that gets up as it dies. These look at consecutive ticks.
describe('circle grab: continuity from one tick to the next (audit)', () => {
  const chain = record(circleChain(1 + 3 + 1 + 4), 330);

  it('Kratos never moves more than 6 px in one tick, even for the longest lunge (it was 26 px at once)', () => {
    const far = record(circleChain(1), 40, 360); // 60 px away: the longest lunge there is
    assert.ok(far[0].victim.x - far[0].player.x >= 40, 'the victim really is far');
    for (const run of [chain, far]) {
      for (let i = 1; i < run.length; i += 1) {
        const step = Math.abs(run[i].player.x - run[i - 1].player.x);
        assert.ok(step <= 6, `tick ${i} (${run[i].phase}): moved ${step} px`);
      }
    }
    const last = far[far.length - 1];
    assert.equal(last.victim.x - last.player.x, CONFIG.player.grab.holdDistancePx, 'and he does arrive');
  });

  it('the lunge pose shows only while Kratos closes the distance of the first grab, never after a punch', () => {
    for (const k of chain) {
      if (k.frameKey === LUNGE) assert.equal(k.player.grabPummelCount ?? 0, 0, `${k.phase} ${k.t}: lunge frame after a tap`);
    }
    const lunges = chain.filter((k) => k.frameKey === LUNGE).length;
    assert.ok(lunges >= 1 && lunges <= 10, `${lunges} ticks of lunge`);
  });

  it('the stab that kills still lasts the whole stab and the body stays lying, never standing up', () => {
    const lastStab = chain.filter((k) => k.phase === 'stab' && k.player.grabPummelCount === 3 + 1 + 4);
    // the tap that starts the stab already runs its first tick, so 13 of the 14 are seen (it was 5 when it killed)
    assert.equal(lastStab.length, CONFIG.player.grab.chain.stabTicks - 1, 'the killing stab runs the whole stab');
    const killedAt = chain.findIndex((k) => k.victim.isDead);
    assert.ok(killedAt >= 0);
    for (const k of chain.slice(killedAt)) {
      if (k.phase === 'stab' || k.phase === 'recovery') {
        assert.equal(k.pose?.textureKey, 'legionnaire-death-02', `${k.phase} ${k.t}: the body is lying`);
      }
    }
    // when Kratos lets go, the soldier's own animation picks up already lying down
    const letGo = chain.findIndex((k, i) => i > killedAt && k.phase === 'none');
    assert.ok(letGo > killedAt);
    assert.equal(getLegionnaireFrameKey(chain[letGo].victim), 'legionnaire-death-02');
  });

  it('after the floor stabs Kratos takes the time to get up from his knee', () => {
    const killedAt = chain.findIndex((k) => k.victim.isDead);
    const recovery = chain.filter((k, i) => i >= killedAt && k.phase === 'recovery');
    assert.equal(recovery.length, CONFIG.player.grab.chain.getUpTicks);
  });
});

describe('circle grab: the deck slam is a movement, not a jump (audit B3)', () => {
  const chain = record(circleChain(1 + 3 + 1), 140);
  const slam = chain.filter((k) => k.phase === 'slam');
  const impact = CONFIG.player.grab.slamImpactTick;

  it('Kratos grips, lifts him overhead, swings and smashes him, in that order', () => {
    const order: string[] = [];
    for (const k of slam) if (k.frameKey && order[order.length - 1] !== k.frameKey) order.push(k.frameKey);
    assert.deepEqual(order, ['kratos-grab-hold', 'kratos-grab-slam-a', 'kratos-grab-slam-c', 'kratos-grab-slam-b']);
    assert.ok(slam.length >= CONFIG.player.grab.slamTicks - 1, 'about 0.7 s, not 0.17 s');
  });

  it('the soldier lies across both hands (pelvis at the middle between them) while he is carried overhead', () => {
    const carried = slam.filter((k) => k.t >= 9 && k.t < impact);
    assert.ok(carried.length >= 10);
    for (const k of carried) {
      const near = kratosAnchorWorld(k.player, k.frameKey!, 'hand')!;
      const far = kratosAnchorWorld(k.player, k.frameKey!, 'farHand')!;
      const pelvis = victimAnchorWorld(k.pose!, 'pelvis')!;
      const gap = Math.hypot(pelvis[0] - (near[0] + far[0]) / 2, pelvis[1] - (near[1] + far[1]) / 2);
      assert.ok(gap <= 3, `slam ${k.t} (${k.frameKey}): pelvis ${gap.toFixed(1)} px from his hands`);
      if (k.t < impact - 5) assert.ok(k.player.y - k.pose!.y >= 10, `slam ${k.t}: he is clearly above the floor`);
    }
  });

  it('the soldier never jumps more than 24 px between two ticks and only uses frames of a body in the air or lying', () => {
    const allowed = ['legionnaire-held-00', 'legionnaire-flip-00', 'legionnaire-flip-01', 'legionnaire-death-01', 'legionnaire-death-02'];
    for (let i = 1; i < slam.length; i += 1) {
      const [a, b] = [slam[i - 1].pose!, slam[i].pose!];
      assert.ok(allowed.includes(b.textureKey), `slam ${slam[i].t}: ${b.textureKey}`);
      const jump = Math.hypot(b.x - a.x, b.y - a.y);
      assert.ok(jump <= 24, `slam ${slam[i].t}: the soldier moved ${jump.toFixed(1)} px in one tick`);
    }
  });
});

describe('circle grab: the Toss takes its time (audit B7)', () => {
  const toss = CONFIG.player.grab.toss;
  const run = record(TOSS, 130);
  const phase = run.filter((k) => k.phase === 'throw');

  it('Kratos holds him, raises the blade, goes in, winds up and lets go, in that order and about 0.7 s', () => {
    const order: string[] = [];
    for (const k of phase) if (k.frameKey && order[order.length - 1] !== k.frameKey) order.push(k.frameKey);
    assert.deepEqual(order, ['kratos-grab-hold', 'kratos-grab-toss-raise', 'kratos-grab-toss-stab', 'kratos-grab-throw-a', 'kratos-grab-throw-b']);
    assert.ok(phase.length >= toss.releaseTick, 'the throw runs at least until the release');
    assert.ok(toss.releaseTick >= 40 && toss.stabTick >= 18, 'it used to be 12 and 5 ticks');
  });

  it('the neck stays in his hand until he is let go and he never jumps more than 24 px between two ticks', () => {
    const held = phase.filter((k) => k.t < toss.releaseTick);
    for (let i = 1; i < held.length; i += 1) {
      const [a, b] = [held[i - 1].pose!, held[i].pose!];
      const jump = Math.hypot(b.x - a.x, b.y - a.y);
      assert.ok(jump <= 24, `toss ${held[i].t}: the soldier moved ${jump.toFixed(1)} px in one tick`);
    }
    for (let i = 4; i < held.length; i += 1) {
      const k = held[i];
      // right after Kratos changes pose the soldier is still catching up with his hand (on purpose, 4 ticks)
      if (held.slice(i - 3, i).some((h) => h.frameKey !== k.frameKey)) continue;
      const hand = kratosAnchorWorld(k.player, k.frameKey!, 'farHand')!;
      const neck = victimAnchorWorld(k.pose!, 'neck')!;
      if (k.pose!.y < k.player.y) assert.ok(Math.hypot(hand[0] - neck[0], hand[1] - neck[1]) <= 12.5, `toss ${k.t}: neck away from the hand`);
    }
  });

  it('once let go he tumbles through four frames instead of sliding as one cut-out', () => {
    const flying = run.filter((k) => k.phase === 'throw' && k.t >= toss.releaseTick + 1);
    const frames = new Set(flying.map((k) => k.pose!.textureKey));
    assert.ok(frames.size >= 3, `${[...frames].join(',')}`);
    for (const f of frames) assert.ok(f.startsWith('legionnaire-tumble-'), f);
  });
});

describe('circle grab: the Rip tears him in two (audit B1)', () => {
  const grab = CONFIG.player.grab;
  const RIP = (tick: number): GameAction[] => (tick === 0 ? ['grab'] : tick === 3 ? ['heavy-attack'] : []);
  const run = record(RIP, 120);
  const rip = run.filter((k) => k.phase === 'break');

  it('Kratos lifts him overhead, pulls him to his chest and stretches him between his hands, then tears him', () => {
    const order: string[] = [];
    for (const k of rip) if (k.frameKey && order[order.length - 1] !== k.frameKey) order.push(k.frameKey);
    assert.deepEqual(order, ['kratos-grab-hold', 'kratos-grab-break-a', 'kratos-grab-slam-c', 'kratos-grab-break-b']);
    assert.ok(rip.length >= grab.breakTicks - 1, 'about a second, it was 0.4 s');
  });

  it('he lies across both hands (pelvis at the middle between them) until the tear, and never jumps more than 24 px', () => {
    const carried = rip.filter((k) => k.t >= 9 && k.t < grab.ripTick);
    assert.ok(carried.length >= 20);
    for (const k of carried) {
      const near = kratosAnchorWorld(k.player, k.frameKey!, 'hand')!;
      const far = kratosAnchorWorld(k.player, k.frameKey!, 'farHand')!;
      const pelvis = victimAnchorWorld(k.pose!, 'pelvis')!;
      const gap = Math.hypot(pelvis[0] - (near[0] + far[0]) / 2, pelvis[1] - (near[1] + far[1]) / 2);
      assert.ok(gap <= 3.5, `rip ${k.t} (${k.frameKey}): pelvis ${gap.toFixed(1)} px from his hands`);
    }
    for (let i = 1; i < carried.length; i += 1) {
      const jump = Math.hypot(carried[i].pose!.x - carried[i - 1].pose!.x, carried[i].pose!.y - carried[i - 1].pose!.y);
      assert.ok(jump <= 24, `rip ${carried[i].t}: moved ${jump.toFixed(1)} px`);
    }
  });

  it('at the tear the body is gone (two halves are drawn instead) and the victim is dead and ripped', () => {
    const torn = rip.find((k) => k.t > grab.ripTick)!;
    assert.equal(torn.victim.ripped, true);
    assert.equal(torn.victim.isDead, true);
    assert.equal(torn.pose, null, 'no body sprite from the tear on');
  });
});

describe('circle grab: the soldier struggles while nobody chooses (audit B6)', () => {
  const grab = CONFIG.player.grab;
  const run = record((tick) => (tick === 0 ? ['grab'] : []), grab.holdTicks + 20);
  const hold = run.filter((k) => k.phase === 'hold');

  it('after a while he alternates between bent and straight instead of hanging still for two seconds', () => {
    const late = hold.filter((k) => k.t >= 30);
    const frames = new Set(late.map((k) => k.pose!.textureKey));
    assert.equal(frames.size, 2, [...frames].join(','));
    let changes = 0;
    for (let i = 1; i < late.length; i += 1) if (late[i].pose!.textureKey !== late[i - 1].pose!.textureKey) changes += 1;
    assert.ok(changes >= 10, `${changes} changes of posture in the last ${late.length} ticks`);
    const early = hold.filter((k) => k.t >= 3 && k.t < 30);
    assert.equal(new Set(early.map((k) => k.pose!.textureKey)).size, 1, 'calm at first');
  });

  it('and his neck stays in the hand the whole time (within the grip and the shake)', () => {
    for (const k of hold.filter((h) => h.frameKey !== LUNGE && h.t >= 3)) {
      const hand = kratosAnchorWorld(k.player, k.frameKey!, 'farHand')!;
      const neck = victimAnchorWorld(k.pose!, 'neck')!;
      const gap = Math.hypot(hand[0] - neck[0], hand[1] - neck[1]);
      assert.ok(Math.abs(gap - 4) <= 1.5, `hold ${k.t}: neck ${gap.toFixed(1)} px from the hand`);
    }
  });
});
