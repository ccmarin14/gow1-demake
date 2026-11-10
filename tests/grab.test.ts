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
  it('whiffs when no enemy is within reach: lunges forward with physical advance and recovery', () => {
    const world = createWorld();
    const p = getPlayer(world);
    const startX = p.x;
    assert.equal(p.grabPhase, 'none');

    // Pulsa grab ('L')
    world.step(['grab']);
    assert.equal(p.grabPhase, 'whiff');
    assert.equal(p.grabTargetId, null);
    assert.equal(p.vx, CONFIG.player.grab.lungeSpeedPx, 'Kratos steps forward on whiff lunge');

    // Avanza durante la embestida inicial de whiff (ticks 0..4)
    stepTicks(world, [], 4);
    assert.ok(p.x > startX, 'Kratos physically moved forward during lunge');
    assert.equal(p.vx, 0, 'brakes to stop for recovery');

    // Completa whiffTicks
    stepTicks(world, [], CONFIG.player.grab.whiffTicks - 5);
    assert.equal(p.grabPhase, 'none');
  });

  it('connects grab from distance with forward lunge step (grab-lunge) closing the gap', () => {
    const world = createWorld();
    const p = getPlayer(world);
    const e = getEnemy(world);

    // Separación de 50 px (cubre la distancia con el paso de lunge)
    p.x = 300;
    p.facing = 1;
    e.x = 350;
    e.y = p.y;
    e.aiState = 'approach';

    world.step(['grab']);
    assert.equal(p.grabPhase, 'hold');
    assert.ok(p.x > 300, 'Kratos lunged forward to close the gap');
    assert.equal(e.x, p.x + CONFIG.player.grab.holdDistancePx, 'victim pinned at hold distance');
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

    // Durante la sujeción (hold), se mantienen anclados incluso si el dedo mantiene presionado 'grab' 15 ticks (250 ms)
    stepTicks(world, ['grab'], 15);
    assert.equal(p.grabPhase, 'hold', 'holding down Circle button from initial press does NOT auto-slam');
    assert.equal(e.hp, 60, 'no slam damage while holding');

    stepTicks(world, ['move-right', 'jump'], 5);
    assert.equal(p.grabPhase, 'hold');
    assert.equal(p.vx, 0, 'Kratos locked during hold');
    assert.equal(e.x, p.x + CONFIG.player.grab.holdDistancePx);
  });

  it('releases victim back to approach if holdTicks (120 ticks = 2s) expires without player pressing □, △, or ○', () => {
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
    assert.equal(p.grabPhase, 'hold');

    // Esperar toda la fase hold (holdTicks = 120) sin pulsar □, △ ni ○
    stepTicks(world, [], CONFIG.player.grab.holdTicks);

    assert.equal(p.grabPhase, 'recovery', 'transitions to recovery when hold expires without choice');
    assert.equal(e.hp, 60, 'no slam damage dealt when hold expires');
    assert.equal(e.aiState, 'guard', 'victim breaks free and raises guard at close range');

    // Esperar recovery (recoveryTicks = 8)
    stepTicks(world, [], CONFIG.player.grab.recoveryTicks);
    assert.equal(p.grabPhase, 'none', 'returns to neutral');
    assert.equal(p.grabTargetId, null);
  });

  it('grabs low-HP legionnaire into normal hold (not QTE) and kills on chosen slam (○)', () => {
    const world = createWorld();
    const p = getPlayer(world);
    const e = getEnemy(world);

    p.x = 300;
    p.facing = 1;
    e.x = 330;
    e.y = p.y;
    e.hp = 15; // Incluso con vida baja (<= 20), el legionario básico entra a hold normal

    const initialKills = world.snapshot().stats?.totalKills ?? 0;

    world.step(['grab']);
    assert.equal(p.grabPhase, 'hold', 'low-HP basic legionnaire enters hold so player can choose □, △, or ○');
    world.step([]);
    world.step(['grab']); // Segunda pulsación de ○ ejecuta el azote (slam)
    assert.equal(p.grabPhase, 'slam');
    assert.equal(e.hp, 15, 'no damage dealt during slam windup (ticks 0..9)');

    // Avanza hasta el impacto en tick 10 (grab-slam-b contra las tablas)
    stepTicks(world, [], 10);
    assert.equal(e.hp, 0, 'victim killed on deck impact at tick 10');
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

  it('ground grab option □ (light-attack): throws victim as projectile and bowls over another enemy in path', () => {
    const world = new World();
    world.loadScenario('magic');
    const p = getPlayer(world);
    const victim = getEnemy(world, 'legionnaire-1');
    const bystander = getEnemy(world, 'archer-1');

    p.x = 200;
    p.facing = 1;
    victim.x = 228;
    victim.y = p.y;
    victim.hp = 60;

    // Colocar al segundo enemigo en la trayectoria del lanzamiento
    bystander.x = 290;
    bystander.y = p.y;
    bystander.hp = 40;
    bystander.aiState = 'idle';

    // 1. Iniciar agarre con ○ ('grab')
    world.step(['grab']);
    assert.equal(p.grabPhase, 'hold');

    // 2. Pulsar □ ('light-attack') durante la sujeción para iniciar el lanzamiento
    world.step(['light-attack']);
    assert.equal(p.grabPhase, 'throw');
    assert.equal(victim.hp, 60, 'victim held during throw windup (ticks 0..5)');
    assert.equal(victim.y, p.y - 12, 'victim held horizontally across chest off floor (ticks 0..5)');

    // 3. Avanzar hasta el tick 6 (grab-throw-b): Kratos lo suelta e impulsa al frente
    stepTicks(world, [], 6);
    assert.equal(victim.hp, 60 - CONFIG.player.grab.throwDamage, 'throw damage dealt on release at tick 6');
    assert.equal(victim.aiState, 'juggle');
    assert.equal(victim.vx, CONFIG.player.grab.throwVx);

    // 4. Avanzar ticks mientras el cuerpo lanzado impacta al segundo enemigo
    stepTicks(world, [], 18);
    assert.equal(bystander.hp, 40 - CONFIG.player.grab.collateralDamage, 'bystander takes collateral damage');
    assert.equal(bystander.aiState, 'knockdown', 'bystander is knocked down by thrown victim');
  });

  it('ground grab option △ (heavy-attack): brutally snaps victim overhead for instant lethal execution at tick 11', () => {
    const world = createWorld();
    const p = getPlayer(world);
    const victim = getEnemy(world);

    p.x = 300;
    p.facing = 1;
    victim.x = 328;
    victim.y = p.y;
    victim.hp = 60;

    world.step(['grab']);
    assert.equal(p.grabPhase, 'hold');

    // Pulsar △ ('heavy-attack') durante hold
    world.step(['heavy-attack']);
    assert.equal(p.grabPhase, 'break');
    assert.equal(victim.hp, 60, 'victim held overhead during break windup (ticks 0..10)');

    // Avanzar hasta el tick 11 (grab-break-b): Kratos lo quiebra sobre su cabeza y lo asienta en cubierta (ejecución letal de GoW 1)
    stepTicks(world, [], 11);
    assert.equal(victim.hp, 0, 'victim instantly killed when snapped overhead at tick 11');
    assert.equal(victim.isDead, true);
    assert.equal(victim.aiState, 'death');
    assert.equal(victim.y, p.y, 'victim corpse rests on deck floor altitude, not floating in air');

    // Tras completar la presa y volver a neutro, el cadáver permanece en el suelo
    stepTicks(world, [], CONFIG.player.grab.slamTicks - 11 + 5);
    assert.equal(victim.y, p.y, 'victim corpse stays firmly on deck floor after grab finishes');
  });

  it('ground grab option ○ (grab): delivers consecutive Blade of Chaos stabs (Grab 1 - TAP ○ REPEATEDLY) and finishes with deck slam', () => {
    const world = createWorld();
    const p = getPlayer(world);
    const victim = getEnemy(world);

    p.x = 300;
    p.facing = 1;
    victim.x = 328;
    victim.y = p.y;
    victim.hp = 60;

    world.step(['grab']);
    assert.equal(p.grabPhase, 'hold');

    // 1. Primer toque de ○ ('grab'): inicia la primera estocada con la Espada del Caos (stab 1)
    world.step([]);
    world.step(['grab']);
    assert.equal(p.grabPhase, 'pummel');
    assert.equal(victim.hp, 60, 'no damage before blade stab impact');

    // Avanzar hasta el impacto de la estocada en tick 4
    stepTicks(world, [], 4);
    assert.equal(victim.hp, 60 - CONFIG.player.grab.pummelDamage, 'stab 1 deals 10 damage when blade plunges into torso');

    // Completar la estocada (pummelTicks = 14) -> vuelve a 'hold'
    stepTicks(world, [], CONFIG.player.grab.pummelTicks - 4);
    assert.equal(p.grabPhase, 'hold', 'returns to hold after stab 1 so player can choose next action');

    // 2. Segundo toque de ○ ('grab'): segunda estocada (stab 2)
    world.step(['grab']);
    assert.equal(p.grabPhase, 'pummel');
    stepTicks(world, [], 4);
    assert.equal(victim.hp, 60 - CONFIG.player.grab.pummelDamage * 2, 'stab 2 deals another 10 damage');
    stepTicks(world, [], CONFIG.player.grab.pummelTicks - 4);
    assert.equal(p.grabPhase, 'hold');

    // 3. Tercer toque de ○ ('grab'): habiendo alcanzado maxPummels (3), Kratos remata con el azote (slam)
    world.step(['grab']);
    assert.equal(p.grabPhase, 'slam', 'third Circle tap transitions into final deck slam');
    stepTicks(world, [], 10);
    assert.equal(victim.hp, 60 - CONFIG.player.grab.pummelDamage * 2 - CONFIG.player.grab.damage, 'final deck slam deals 25 damage');
    assert.equal(victim.aiState, 'knockdown');
    assert.equal(victim.y, p.y, 'victim on floor after slam');
  });

  it('launcher (held △) lifts enemy straight up vertically (vx = 0) and ○ chains Orion\'s Harpoon to slam it down', () => {
    const world = createWorld();
    const p = getPlayer(world);
    const victim = getEnemy(world);

    p.x = 300;
    p.facing = 1;
    victim.x = 338;
    victim.y = p.y;
    victim.hp = 60;
    victim.aiState = 'idle';

    // Mantener △ ('heavy-attack') durante el windup hasta disparar el launcher (tick 9+)
    stepTicks(world, ['heavy-attack'], 28);
    assert.equal(victim.aiState, 'juggle', 'victim is launched into juggle');
    assert.equal(victim.vx, 0, 'victim rises straight up vertically with zero horizontal drift');
    assert.ok(victim.y < p.y, 'victim is airborne above the deck');

    // Soltar △ y pulsar ○ ('grab') para encadenar Orion's Harpoon y estrellar al enemigo contra la cubierta
    world.step([]);
    world.step(['grab']);
    stepTicks(world, [], 4);
    assert.equal(world.snapshot().strike?.id, 'harpoon', 'Circle chains into Orion\'s Harpoon');

    // Avanzar hasta que el arpón conecte y el enemigo caiga derribado a la cubierta
    stepTicks(world, [], 25);
    assert.equal(victim.grounded, true, 'harpooned enemy slammed back onto deck');
    assert.equal(victim.aiState, 'knockdown', 'harpooned enemy ends in knockdown');
  });

  it('does NOT trigger Orion\'s Harpoon in the air when no enemy is airborne', () => {
    const world = createWorld();
    const p = getPlayer(world);
    const victim = getEnemy(world);

    // Enemigo en tierra (grounded = true, aiState = 'idle')
    p.x = 300;
    p.facing = 1;
    victim.x = 345;
    victim.y = p.y;
    victim.grounded = true;
    victim.aiState = 'idle';

    // Kratos salta y pulsa ○ ('grab') en el aire sin enemigos en el aire
    world.step(['jump']);
    stepTicks(world, [], 6);
    assert.equal(p.grounded, false);

    world.step(['grab']);
    assert.equal(world.snapshot().strike, undefined, 'harpoon does not fire when no enemy is airborne');
  });

  it('chains a ground combo (□ -> ○) directly into grab hold by cancelling recovery and lunging across knockback', () => {
    const world = createWorld();
    const p = getPlayer(world);
    const victim = getEnemy(world);

    p.x = 300;
    p.facing = 1;
    victim.x = 334;
    victim.y = p.y;
    victim.hp = 60;
    victim.aiState = 'idle';

    // 1. Iniciar golpe □1 ('light-attack') y avanzar hasta el impacto (tick ~11)
    world.step(['light-attack']);
    stepTicks(world, [], 13);
    assert.equal(victim.hp, 50, 'square1 hit the legionnaire');

    // 2. Pulsar ○ ('grab') durante el tajo / hitstop para encadenar hacia el agarre
    world.step(['grab']);
    stepTicks(world, [], 15);

    assert.equal(p.grabPhase, 'hold', 'Kratos chains from square1 into grab hold');
    assert.equal(p.grabTargetId, victim.id);
    assert.equal(victim.aiState, 'grabbed');
    assert.equal(victim.x, p.x + CONFIG.player.grab.holdDistancePx);
  });

  it('chains Orion\'s Harpoon reliably from Ascension in mid-air and slams the enemy onto the deck with impact', () => {
    const world = createWorld();
    const p = getPlayer(world);
    const victim = getEnemy(world);

    p.x = 300;
    p.facing = 1;
    victim.x = 338;
    victim.y = p.y;
    victim.hp = 60;
    victim.aiState = 'idle';

    // Mantener △ durante 42 ticks para lanzar al enemigo y saltar con él en Ascension
    stepTicks(world, ['heavy-attack'], 42);
    assert.equal(p.grounded, false, 'Kratos is airborne in Ascension');
    assert.equal(victim.aiState, 'juggle', 'victim is airborne in front of Kratos');

    // Pulsar ○ ('grab') en pleno vuelo de Ascension
    world.step(['grab']);
    assert.equal(world.snapshot().strike?.id, 'harpoon', 'Ascension immediately transitions to Orion\'s Harpoon on Circle');

    let sawDeckImpact = false;
    for (let i = 0; i < 40; i += 1) {
      world.step([]);
      if (world.consumeStrikeImpactNotice()) {
        sawDeckImpact = true;
      }
    }
    assert.equal(victim.grounded, true, 'harpooned enemy slammed onto deck from mid-air');
    assert.equal(victim.aiState, 'knockdown', 'enemy in knockdown after mid-air harpoon slam');
    assert.ok(sawDeckImpact, 'deck slam emits dust and camera shake impact notice');
    assert.equal(victim.hp, 60 - 10 - 10 - 15, 'deals launcher (10) + harpoon (10) + deck slam (15) damage');
  });
});
