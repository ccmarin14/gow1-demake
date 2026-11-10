import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { CONFIG } from '../src/config';
import type { EntityState, GameAction } from '../src/sim/types';
import { World } from '../src/sim/world';

function createWorld(): World {
  const world = new World();
  world.loadScenario('level1');
  return world;
}

function getPlayer(world: World): EntityState {
  const player = world.peekEntity('player');
  assert.ok(player, 'player exists');
  return player;
}

function getEnemy(world: World, id = 'legionnaire-deck-1'): EntityState {
  const enemy = world.peekEntity(id);
  assert.ok(enemy, 'legionnaire exists');
  return enemy;
}

function stepTicks(world: World, actions: readonly GameAction[], ticks: number): void {
  for (let i = 0; i < ticks; i += 1) {
    world.step(actions);
  }
}

describe('contextual QTE finisher (BL-07, ESE-01)', () => {
  it('legionnaire enters weakened state when hp falls to or below threshold (<= 20)', () => {
    const world = createWorld();
    const p = getPlayer(world);
    const e = getEnemy(world);

    p.x = 200;
    e.x = 280;
    e.hp = 20;
    e.aiState = 'approach';

    world.step([]);
    assert.equal(e.aiState, 'weakened');
    assert.ok(e.vx !== 0, 'moves slowly in weakened state');
  });

  it('initiates QTE finisher on grab (L) when enemy is weakened', () => {
    const world = createWorld();
    const p = getPlayer(world);
    const e = getEnemy(world);

    p.x = 300;
    p.facing = 1;
    e.x = 330;
    e.y = p.y;
    e.hp = 15;
    e.aiState = 'weakened';

    world.step(['grab']);

    assert.equal(p.grabPhase, 'finisher_qte');
    assert.equal(p.grabTargetId, e.id);
    assert.equal(p.qteAction, 'heavy-attack');
    assert.equal(p.qteTicksLeft, CONFIG.enemy.legionnaire.qteWindowTicks - 1);
    assert.equal(e.aiState, 'grabbed');

    const snap = world.snapshot();
    assert.ok(snap.qtePrompt, 'snapshot exposes qtePrompt');
    assert.equal(snap.qtePrompt.targetId, e.id);
    assert.equal(snap.qtePrompt.action, 'heavy-attack');
  });

  it('successful QTE (pressing heavy-attack) kills enemy, heals Kratos, and awards bonus red orbs', () => {
    const world = createWorld();
    const p = getPlayer(world);
    const e = getEnemy(world);

    p.x = 300;
    p.facing = 1;
    p.hp = 50; // Kratos herido para verificar curación
    p.redOrbs = 10;
    e.x = 330;
    e.y = p.y;
    e.hp = 15;
    e.aiState = 'weakened';

    // Inicia remate QTE
    world.step(['grab']);
    assert.equal(p.grabPhase, 'finisher_qte');

    // Espera unos ticks dentro de la ventana de QTE
    stepTicks(world, [], 5);
    assert.equal(p.grabPhase, 'finisher_qte');

    // Pulsa la acción correcta (heavy-attack / Triángulo / tecla I)
    world.step(['heavy-attack']);

    // Éxito: pasa a finisher_slam, cura 25 HP y otorga 5 orbes rojos extra
    assert.equal(p.grabPhase, 'finisher_slam');
    assert.equal(p.hp, 50 + CONFIG.enemy.legionnaire.finisherHealAmount);
    assert.ok(p.redOrbs >= 10 + CONFIG.enemy.legionnaire.finisherBonusRedOrbs);
    assert.equal(e.hp, 0);
    assert.equal(e.isDead, true);
    assert.equal(e.aiState, 'death');

    // Termina el slam y recovery
    stepTicks(world, [], CONFIG.player.grab.slamTicks + CONFIG.player.grab.recoveryTicks + 2);
    assert.equal(p.grabPhase, 'none');
  });

  it('failing QTE on timeout triggers counter-attack dealing damage and hitstun to Kratos', () => {
    const world = createWorld();
    const p = getPlayer(world);
    const e = getEnemy(world);

    p.x = 300;
    p.facing = 1;
    p.hp = 100;
    e.x = 330;
    e.y = p.y;
    e.hp = 15;
    e.aiState = 'weakened';

    // Inicia remate QTE
    world.step(['grab']);
    assert.equal(p.grabPhase, 'finisher_qte');

    // Deja transcurrir toda la ventana sin pulsar nada
    stepTicks(world, [], CONFIG.enemy.legionnaire.qteWindowTicks + 2);

    // Fallo: Kratos recibe daño de contragolpe y entra en hitstun
    assert.equal(p.grabPhase, 'none');
    assert.equal(p.hp, 100 - CONFIG.enemy.legionnaire.qteFailDamage);
    assert.ok(p.hitstunTicks > 0, 'Kratos enters hitstun');
    assert.equal(e.aiState, 'weakened', 'enemy breaks free and remains weakened');
    assert.equal(e.isDead, false);
  });

  it('failing QTE on wrong button (e.g. light-attack) immediately triggers counter-attack', () => {
    const world = createWorld();
    const p = getPlayer(world);
    const e = getEnemy(world);

    p.x = 300;
    p.facing = 1;
    p.hp = 100;
    e.x = 330;
    e.y = p.y;
    e.hp = 15;
    e.aiState = 'weakened';

    // Inicia remate QTE
    world.step(['grab']);
    assert.equal(p.grabPhase, 'finisher_qte');

    // Pulsa un botón incorrecto (light-attack / Cuadrado / J)
    world.step(['light-attack']);

    // Fallo instantáneo
    assert.equal(p.grabPhase, 'none');
    assert.equal(p.hp, 100 - CONFIG.enemy.legionnaire.qteFailDamage);
    assert.ok(p.hitstunTicks > 0, 'Kratos enters hitstun on fail');
    assert.equal(e.aiState, 'weakened');
    assert.equal(e.isDead, false);
  });
});
