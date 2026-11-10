import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { CONFIG } from '../src/config';
import { PLAYER_ID } from '../src/sim/types';
import type { EntityState, GameAction } from '../src/sim/types';
import { World } from '../src/sim/world';

function stepTicks(world: World, actions: GameAction[], count: number): void {
  for (let i = 0; i < count; i += 1) {
    world.step(actions);
  }
}

function createWorld(): World {
  const world = new World();
  world.loadScenario('level1');
  return world;
}

function getPlayer(world: World): EntityState {
  const p = world.peekEntity(PLAYER_ID) as EntityState | undefined;
  assert.ok(p, 'player entity exists');
  return p;
}

function getEnemy(world: World, id = 'legionnaire-deck-1'): EntityState {
  const e = world.peekEntity(id) as EntityState | undefined;
  assert.ok(e, `enemy entity "${id}" exists`);
  return e;
}

describe('combat grab with Circle / L key (BL-06, D-42)', () => {
  it('whiffs when no enemy is within reach', () => {
    const world = createWorld();
    const p = getPlayer(world);
    // En level1, Kratos arranca en x=100 y el legionario en x=360 (260 px de separación, fuera de reachPx 38)
    assert.equal(p.grabPhase, 'none');

    // Pulsa grab ('L')
    world.step(['grab']);
    assert.equal(p.grabPhase, 'whiff');
    assert.equal(p.grabTargetId, null);
    assert.equal(p.vx, 0);

    // Debe durar exactamente CONFIG.player.grab.whiffTicks (15 ticks)
    stepTicks(world, [], CONFIG.player.grab.whiffTicks - 1);
    assert.equal(p.grabPhase, 'none');
  });

  it('whiffs when enemy is beyond reach or behind Kratos', () => {
    const world = createWorld();
    const p = getPlayer(world);
    const e = getEnemy(world);

    // Posicionar al enemigo detrás de Kratos (Kratos mira a la derecha en x=300; enemigo a x=260)
    p.x = 300;
    p.facing = 1;
    e.x = 260;
    e.y = p.y;

    world.step(['grab']);
    assert.equal(p.grabPhase, 'whiff');
    assert.notEqual(e.aiState, 'grabbed');
  });

  it('connects grab on proximity: holds and pins victim with mutual immobilization and i-frames', () => {
    const world = createWorld();
    const p = getPlayer(world);
    const e = getEnemy(world);

    // Posicionar a distancia de agarre (30 px al frente)
    p.x = 300;
    p.facing = 1;
    e.x = 330;
    e.y = p.y;
    e.aiState = 'approach';

    world.step(['grab']);

    assert.equal(p.grabPhase, 'hold');
    assert.equal(p.grabTargetId, e.id);
    assert.equal(e.aiState, 'grabbed');
    assert.equal(e.facing, -1, 'victim faces Kratos');
    assert.equal(e.x, p.x + CONFIG.player.grab.holdDistancePx, 'victim pinned at hold distance');
    assert.equal(e.vx, 0);
    assert.equal(e.vy, 0);
    assert.ok(p.invulTicks >= CONFIG.player.grab.invulTicks - 1, 'Kratos gets grab i-frames');

    // Durante la sujeción (hold), se mantienen anclados
    stepTicks(world, ['move-right', 'jump'], 5);
    assert.equal(p.grabPhase, 'hold');
    assert.equal(p.vx, 0, 'Kratos locked during hold');
    assert.equal(e.x, p.x + CONFIG.player.grab.holdDistancePx);
  });

  it('resolves grab with ground slam, deals damage, and transitions victim to knockdown (ESE-07)', () => {
    const world = createWorld();
    const p = getPlayer(world);
    const e = getEnemy(world);

    p.x = 300;
    p.facing = 1;
    e.x = 330;
    e.y = p.y;
    e.hp = 60;

    // Conectar agarre en tick 1
    world.step(['grab']);

    // Esperar toda la fase hold (holdTicks = 18)
    stepTicks(world, [], CONFIG.player.grab.holdTicks);

    assert.equal(p.grabPhase, 'slam', 'transitions to slam phase');
    assert.equal(e.hp, 60 - CONFIG.player.grab.damage, 'damage dealt on slam');
    assert.equal(e.aiState, 'knockdown', 'surviving victim transitions to knockdown (ESE-07)');

    // Esperar fase slam (slamTicks = 16) y recovery (recoveryTicks = 8)
    stepTicks(world, [], CONFIG.player.grab.slamTicks + CONFIG.player.grab.recoveryTicks);
    assert.equal(p.grabPhase, 'none', 'returns to neutral');
    assert.equal(p.grabTargetId, null);
  });

  it('kills low-HP victim on slam, triggers death state and orbs', () => {
    const world = createWorld();
    const p = getPlayer(world);
    const e = getEnemy(world);

    p.x = 300;
    p.facing = 1;
    e.x = 330;
    e.y = p.y;
    e.hp = 20; // Menor al daño de agarre (25)

    const initialKills = world.snapshot().stats?.totalKills ?? 0;

    world.step(['grab']);
    stepTicks(world, [], CONFIG.player.grab.holdTicks);

    assert.equal(e.hp, 0);
    assert.equal(e.isDead, true);
    assert.equal(e.aiState, 'death');

    // Avanza para recoger orbes
    stepTicks(world, [], 5);
    const stats = world.snapshot().stats;
    assert.ok(stats && stats.totalKills > initialKills, 'kill recorded');
  });

  it('cannot initiate grab while rolling, guarding, striking, or in hitstun', () => {
    const world = createWorld();
    const p = getPlayer(world);
    const e = getEnemy(world);
    p.x = 300;
    p.facing = 1;
    e.x = 330;

    // 1. Durante guardia
    world.step(['guard']);
    world.step(['guard', 'grab']);
    assert.equal(p.grabPhase, 'none');

    // Liberar guardia
    stepTicks(world, [], 10);

    // 2. Durante rodada
    world.step(['dodge']);
    world.step(['grab']);
    assert.equal(p.grabPhase, 'none');

    // Liberar rodada
    stepTicks(world, [], CONFIG.player.damage.hurtInvulTicks);

    // 3. Durante golpe con espada (strike)
    world.step(['light-attack']);
    world.step(['grab']);
    assert.equal(p.grabPhase, 'none');

    // 4. En hitstun
    stepTicks(world, [], 40);
    p.hitstunTicks = 10;
    world.step(['grab']);
    assert.equal(p.grabPhase, 'none');
  });
});
