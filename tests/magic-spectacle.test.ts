import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { CONFIG } from '../src/config';
import { magicLiftPx, magicTensionPose } from '../src/scene/magicPose';
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
  it('lasts 40% longer without changing cost, radius or damage', () => {
    const cfg = CONFIG.player.magic.poseidonsRage;
    assert.equal(cfg.startupTicks + cfg.activeTicks + cfg.recoveryTicks, 84);
    assert.equal(cfg.cost, 35);
    assert.equal(cfg.radius, 90);
    assert.equal(cfg.damagePerHit, 8);

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

    assert.equal(magicTensionPose(phase('startup', spell.startupTicks - 1)), false);
    assert.equal(magicTensionPose(phase('active', 0)), true);
    assert.equal(magicTensionPose(phase('active', spell.activeTicks - 1)), true);
    assert.equal(magicTensionPose(phase('recovery', 0)), false);
    assert.equal(magicTensionPose(phase('none', 0)), false);
  });
});
