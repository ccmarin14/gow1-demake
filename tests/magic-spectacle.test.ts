import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { ASSETS, MAGIC_TENSION_KEY, PLAYER_FRAME_KEYS } from '../src/assets/manifest';
import { CONFIG, PLAYER_SPRITE_HEIGHT } from '../src/config';
import { magicBoltEndY, magicFrameKey, magicLiftPx, magicPoseStyle } from '../src/scene/magicPose';
import { stepMagic } from '../src/sim/magic';
import type { EntityState } from '../src/sim/types';
import { World } from '../src/sim/world';

function caster(): EntityState {
  const world = new World();
  world.loadScenario('movement');
  const found = world.snapshot().entities.find((e) => e.kind === 'player');
  assert.ok(found);
  return { ...found };
}

function phase(phaseName: EntityState['magicPhase'], ticks: number): EntityState {
  return { magicPhase: phaseName, magicTicks: ticks } as EntityState;
}

describe('Poseidon\'s Rage spectacle (BL-32)', () => {
  it('lasts 40% longer without changing cost or radius', () => {
    const cfg = CONFIG.player.magic.poseidonsRage;
    assert.equal(cfg.startupTicks + cfg.activeTicks + cfg.recoveryTicks, 84);
    assert.equal(cfg.cost, 35);
    assert.equal(cfg.radius, 90);
    // Level-1 translation: 2.5 damage on a ~40 HP soldier is ~6%; 6% of 60 is 4.
    assert.equal(cfg.damagePerHit, 4);
    assert.equal(cfg.hitIntervalTicks, 4);

    const player = caster();
    stepMagic(player, true, []);
    // The edge tick only starts the spell; the 84 ticks are the spell itself.
    let ticks = 0;
    while (player.magicPhase !== 'none' && ticks < 200) {
      stepMagic(player, false, []);
      ticks += 1;
    }
    assert.equal(player.magicPhase, 'none');
    assert.equal(ticks, 84);
  });

  it('lifts Kratos only while the bolt holds him, then sets him back down', () => {
    const cfg = CONFIG.vfx.magicWave;
    assert.equal(magicLiftPx(phase('startup', 10)), 0);
    assert.equal(magicLiftPx(phase('none', 0)), 0);

    const rise = magicLiftPx(phase('active', 0));
    assert.ok(rise > 0, 'the lift begins with the bolt');
    assert.ok(rise < cfg.liftPx, 'the lift ramps up instead of teleporting');
    assert.equal(magicLiftPx(phase('active', cfg.liftInTicks)), cfg.liftPx);
    assert.ok(magicLiftPx(phase('recovery', 0)) > 0, 'he comes down during recovery');
    assert.equal(magicLiftPx(phase('recovery', cfg.liftOutTicks)), 0);
  });

  it('rises and lands quickly, and drops the tense pose with the bolt', () => {
    const cfg = CONFIG.vfx.magicWave;
    const spell = CONFIG.player.magic.poseidonsRage;
    assert.ok(cfg.liftInTicks <= 4, 'the lift starts with the bolt');
    assert.ok(cfg.liftOutTicks <= 4, 'he lands as soon as the bolt ends');
    assert.equal(magicLiftPx(phase('active', cfg.liftInTicks - 1)), cfg.liftPx);
    assert.ok(magicLiftPx(phase('recovery', 1)) < cfg.liftPx);

    assert.equal(magicPoseStyle(phase('startup', spell.startupTicks - 1)), 'bridge');
    assert.equal(magicPoseStyle(phase('active', 0)), 'bridge');
    assert.equal(magicPoseStyle(phase('active', 2)), 'tension');
    assert.equal(magicPoseStyle(phase('active', spell.activeTicks - 3)), 'tension');
    assert.equal(magicPoseStyle(phase('recovery', 0)), 'bridge');
    assert.equal(magicPoseStyle(phase('recovery', 2)), 'normal');
    assert.equal(magicPoseStyle(phase('none', 0)), 'normal');
  });

  it('stops the bolt at mid torso and reuses one bridge pose on both ends', () => {
    const cfg = CONFIG.vfx.magicWave;
    const spell = CONFIG.player.magic.poseidonsRage;
    assert.equal(cfg.boltStopAtBodyFraction, 0.5);
    assert.equal(cfg.poseTransitionTicks, 2);

    assert.equal(magicPoseStyle(phase('startup', spell.startupTicks - 2)), 'bridge');
    assert.equal(magicPoseStyle(phase('active', spell.activeTicks - 2)), 'bridge');
    assert.equal(magicPoseStyle(phase('active', spell.activeTicks - 1)), 'bridge');

    const player = { ...caster(), magicPhase: 'active', magicTicks: 10 } as EntityState;
    assert.equal(
      magicBoltEndY(player),
      player.y - magicLiftPx(player) - PLAYER_SPRITE_HEIGHT * cfg.boltStopAtBodyFraction,
    );
    assert.ok(magicBoltEndY(player) < player.y - 20, 'the bolt stops at the torso');
    assert.ok(magicBoltEndY(player) > player.y - 40, 'the bolt does not run past him');
  });

  it('loads the Ki-arm frame in production and uses it on both sides of the cramp', () => {
    assert.ok(PLAYER_FRAME_KEYS.includes(MAGIC_TENSION_KEY), 'the frame is a player asset');
    assert.ok(
      ASSETS.characters.some((asset) => asset.key === MAGIC_TENSION_KEY),
      'the frame is loaded by the scene, not only by a dev flag',
    );
    assert.equal(magicFrameKey('normal'), null);
    assert.equal(magicFrameKey('bridge'), MAGIC_TENSION_KEY);
    assert.equal(magicFrameKey('tension'), MAGIC_TENSION_KEY);
  });
});
