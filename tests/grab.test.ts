import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { withoutGrabHitstop } from './helpers/grab-hitstop';
import { CONFIG } from '../src/config';
import { PLAYER_ID } from '../src/sim/types';
import type { EntityState, GameAction } from '../src/sim/types';
import { World } from '../src/sim/world';

// Each test file runs in its own process: the ticks of the chain are counted without the hitstop freezes
withoutGrabHitstop();

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
    assert.equal(CONFIG.player.grab.whiffTicks, 32, 'canonical whiff lasts ~0.53s (32 ticks)');
    assert.equal(CONFIG.player.grab.whiffLungeTicks, 12, 'lunge step covers first 12 ticks');

    const world = createWorld();
    const p = getPlayer(world);
    const startX = p.x;
    assert.equal(p.grabPhase, 'none');

    // Pulsa grab ('L')
    world.step(['grab']);
    assert.equal(p.grabPhase, 'whiff');
    assert.equal(p.grabTargetId, null);
    assert.equal(p.vx, CONFIG.player.grab.lungeSpeedPx, 'Kratos steps forward on whiff lunge');

    // Avanza durante la embestida inicial de whiff (ticks 0..whiffLungeTicks-1)
    stepTicks(world, [], CONFIG.player.grab.whiffLungeTicks - 1);
    assert.ok(p.x - startX >= 10, 'Kratos physically stepped forward at least 10 px during whiff lunge');

    // Al llegar al final de la embestida frena en seco para la recuperación vulnerable
    world.step([]);
    assert.equal(p.vx, 0, 'brakes to stop for recovery');

    // Completa el resto de whiffTicks en recuperación vulnerable
    stepTicks(world, [], CONFIG.player.grab.whiffTicks - CONFIG.player.grab.whiffLungeTicks - 1);
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

    // Kratos closes the gap at `lungeStepPx` per tick (it was all in one tick: a 26 px teleport), the victim stays put
    world.step(['grab']);
    assert.equal(p.grabPhase, 'hold');
    const victimStart = e.x;
    let previousX = p.x;
    for (let i = 0; i < 12; i += 1) {
      world.step([]);
      assert.ok(p.x - previousX <= 6, `tick ${i}: Kratos moves at most 6 px`);
      previousX = p.x;
    }
    assert.ok(p.x > 300, 'Kratos lunged forward to close the gap');
    assert.equal(e.x, p.x + CONFIG.player.grab.holdDistancePx, 'victim pinned at hold distance');
    assert.equal(e.x, victimStart, 'the victim did not move: Kratos came to him');
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
    stepTicks(world, ['grab'], 3); // the lunge closes the last px, the button still held

    assert.equal(p.grabPhase, 'hold');
    assert.equal(p.grabTargetId, e.id);
    assert.equal(e.aiState, 'grabbed');
    assert.equal(e.facing, -1, 'victim faces Kratos');
    assert.equal(e.x, p.x + CONFIG.player.grab.holdDistancePx, 'victim pinned at hold distance');
    assert.equal(e.vx, 0);
    assert.equal(e.vy, 0);
    assert.ok(p.invulTicks >= CONFIG.player.grab.invulTicks - 4, 'Kratos gets grab i-frames');

    // Durante la sujeción (hold), se mantienen anclados incluso si el dedo mantiene presionado 'grab' 15 ticks (250 ms)
    stepTicks(world, ['grab'], 15);
    assert.equal(p.grabPhase, 'hold', 'holding down Circle button from initial press does NOT auto-slam');
    assert.equal(e.hp, 60, 'no slam damage while holding');

    stepTicks(world, ['move-right', 'jump'], 5);
    assert.equal(p.grabPhase, 'hold');
    assert.equal(p.vx, 0, 'Kratos locked during hold');
    assert.equal(e.x, p.x + CONFIG.player.grab.holdDistancePx);
  });

  it('releases victim to guard if holdTicks (120 ticks = 2s) expires without player pressing □, △, or ○', () => {
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
    stepTicks(world, [], 4); // the lunge closes the gap
    const playerXBeforeBreakFree = p.x;
    const enemyXBeforeBreakFree = e.x;

    // Esperar toda la fase hold (holdTicks = 120, 4 ya pasaron) sin pulsar □, △ ni ○
    stepTicks(world, [], CONFIG.player.grab.holdTicks - 4);

    assert.equal(p.grabPhase, 'recovery', 'transitions to recovery when hold expires without choice');
    assert.equal(e.hp, 60, 'no slam damage dealt when hold expires');
    assert.equal(e.aiState, 'guard', 'victim breaks free and raises guard at close range');
    assert.ok(p.x < playerXBeforeBreakFree, 'victim pushes Kratos backward when breaking free');
    assert.ok(e.x > enemyXBeforeBreakFree, 'victim separates from Kratos during break free');
    assert.ok(e.attackCooldownTicks > 0, 'victim gets a guard recovery beat');

    // Esperar recovery (recoveryTicks = 8)
    stepTicks(world, [], CONFIG.player.grab.recoveryTicks);
    assert.equal(p.grabPhase, 'none', 'returns to neutral');
    assert.equal(p.grabTargetId, null);
  });

  it('grabs low-HP legionnaire into normal hold (not QTE) and a Circle punch can kill it', () => {
    const world = createWorld();
    const p = getPlayer(world);
    const e = getEnemy(world);

    p.x = 300;
    p.facing = 1;
    e.x = 330;
    e.y = p.y;
    e.hp = CONFIG.player.grab.chain.punchDamage; // one punch from death

    const initialKills = world.snapshot().stats?.totalKills ?? 0;

    world.step(['grab']);
    assert.equal(p.grabPhase, 'hold', 'low-HP basic legionnaire enters hold so player can choose □, △, or ○');
    world.step([]);
    world.step(['grab']);
    assert.equal(p.grabPhase, 'pummel');
    assert.equal(e.hp, CONFIG.player.grab.chain.punchDamage, 'no damage before the punch lands');

    stepTicks(world, [], 4);
    assert.equal(e.hp, 0, 'victim killed by the first punch');
    assert.equal(e.isDead, true);
    assert.equal(e.aiState, 'death');
    stepTicks(world, [], CONFIG.player.grab.chain.punchTicks);
    assert.equal(p.grabPhase === 'recovery' || p.grabPhase === 'none', true, 'the chain ends on the kill');

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
    assert.equal(victim.hp, 60, 'no damage before the sword goes in');
    assert.equal(victim.y, p.y - 12, 'victim held at his side, off the floor, while he is run through');

    // 3. Avanzar hasta el tick 6 (grab-throw-b): Kratos lo suelta e impulsa al frente
    stepTicks(world, [], CONFIG.player.grab.toss.releaseTick);
    assert.equal(
      victim.hp,
      60 - CONFIG.player.grab.toss.stabDamage - CONFIG.player.grab.throwDamage,
      'the sword goes in first, then the throw damage lands on release',
    );
    assert.equal(victim.aiState, 'juggle');
    assert.equal(victim.vx, CONFIG.player.grab.throwVx, 'the throw goes straight to the side Kratos faces');

    // 4. Avanzar ticks mientras el cuerpo lanzado impacta al segundo enemigo
    stepTicks(world, [], 18);
    assert.equal(bystander.hp, 40 - CONFIG.player.grab.collateralDamage, 'bystander takes collateral damage');
    assert.equal(bystander.aiState, 'knockdown', 'bystander is knocked down by thrown victim');
  });

  it('ground grab option △ (heavy-attack): tears the victim in two for a lethal execution at the Rip tick', () => {
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

    // Avanzar hasta el tick del desgarro (grab-break-b): Kratos lo parte en dos (ejecución letal de GoW 1)
    stepTicks(world, [], CONFIG.player.grab.ripTick);
    assert.equal(victim.hp, 0, 'victim instantly killed when torn in two');
    assert.equal(victim.isDead, true);
    assert.equal(victim.ripped, true, 'the presentation draws two halves instead of the body');
    assert.equal(victim.aiState, 'death');
    assert.equal(victim.y, p.y, 'victim corpse rests on deck floor altitude, not floating in air');

    // Tras completar la presa y volver a neutro, el cadáver permanece en el suelo
    stepTicks(world, [], CONFIG.player.grab.breakTicks - CONFIG.player.grab.ripTick + 5);
    assert.equal(victim.y, p.y, 'victim corpse stays firmly on deck floor after grab finishes');
  });

  it('ground grab option ○ (grab): Grab 1 is 3 punches held aloft, a throw to the floor, then 4 stabs (user, GoW 1)', () => {
    const world = createWorld();
    const p = getPlayer(world);
    const victim = getEnemy(world);
    const chain = CONFIG.player.grab.chain;

    p.x = 300;
    p.facing = 1;
    victim.x = 328;
    victim.y = p.y;
    victim.hp = 60;

    world.step(['grab']);
    assert.equal(p.grabPhase, 'hold');
    world.step([]);

    // 1. Three punches, one per tap, with the victim held up by one hand.
    let expectedHp = 60;
    for (let i = 0; i < chain.punches; i += 1) {
      world.step(['grab']);
      assert.equal(p.grabPhase, 'pummel', `tap ${i + 1} is a punch`);
      assert.equal(victim.hp, expectedHp, 'no damage before the punch lands');
      stepTicks(world, [], 4);
      expectedHp -= chain.punchDamage;
      assert.equal(victim.hp, expectedHp, `punch ${i + 1} lands at tick 4`);
      stepTicks(world, [], chain.punchTicks - 4);
      assert.equal(p.grabPhase, 'hold', 'back to holding him up so the next tap can follow');
    }

    // 2. The next tap throws him to the floor (the deck slam).
    world.step(['grab']);
    assert.equal(p.grabPhase, 'slam');
    stepTicks(world, [], CONFIG.player.grab.slamImpactTick);
    expectedHp -= CONFIG.player.grab.damage;
    assert.equal(victim.hp, expectedHp, 'the throw to the floor deals its damage at the impact tick');
    assert.equal(victim.isDead, false);
    stepTicks(world, [], CONFIG.player.grab.slamTicks - CONFIG.player.grab.slamImpactTick);
    assert.equal(p.grabPhase, 'floorhold', 'he lies on the floor and Kratos raises the blade');
    assert.equal(victim.heldLying, true);
    assert.equal(victim.y, p.y, 'victim on the floor, not floating');

    // 3. Four stabs with the blade, ON HIS OWN (no taps: the user does not want to press ○ again and again); the last one always kills.
    for (let i = 0; i < chain.stabs; i += 1) {
      for (let wait = 0; wait < 40 && p.grabPhase === 'floorhold'; wait += 1) world.step([]);
      assert.equal(p.grabPhase, 'stab', `stab ${i + 1} starts by itself after the blade is raised`);
      const before = victim.hp;
      stepTicks(world, [], 4);
      if (i < chain.stabs - 1) {
        assert.equal(victim.hp, before - chain.stabDamage, `stab ${i + 1} deals its damage`);
        assert.equal(victim.isDead, false);
        stepTicks(world, [], chain.stabTicks - 4);
        assert.equal(p.grabPhase, 'floorhold');
      } else {
        assert.equal(victim.hp, 0, 'the fourth stab kills');
        assert.equal(victim.isDead, true);
        assert.equal(victim.aiState, 'death');
      }
    }
  });

  it('after the throw to the floor Kratos stabs on his own, four times, without a single tap, and the last stab kills', () => {
    const world = createWorld();
    const p = getPlayer(world);
    const victim = getEnemy(world);
    p.x = 300;
    p.facing = 1;
    victim.x = 328;
    victim.y = p.y;
    victim.hp = 100;
    world.step(['grab']);
    world.step([]);
    for (let i = 0; i < CONFIG.player.grab.chain.punches; i += 1) {
      world.step(['grab']);
      stepTicks(world, [], CONFIG.player.grab.chain.punchTicks);
    }
    world.step(['grab']); // the last tap of the whole chain: the throw to the floor
    stepTicks(world, [], CONFIG.player.grab.slamTicks);
    assert.equal(p.grabPhase, 'floorhold');
    const hitsAt: number[] = [];
    let hp = victim.hp;
    for (let i = 0; i < 400 && !victim.isDead; i += 1) {
      world.step([]);
      if (victim.hp < hp) hitsAt.push(i);
      hp = victim.hp;
    }
    assert.equal(hitsAt.length, CONFIG.player.grab.chain.stabs, 'four stabs landed with no input at all');
    assert.equal(victim.isDead, true, 'the last one kills a victim with 100 HP');
    const { stabDelayTicks, stabTicks } = CONFIG.player.grab.chain;
    assert.equal(hitsAt[1] - hitsAt[0], stabDelayTicks[1] + stabTicks, 'one stab after the other, no long pauses');
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

    // Avanzar hasta que el arpón conecte: el azote lo hace rebotar (Death Bounce) y, sin otro ○, cae y queda derribado
    let bounced = false;
    for (let i = 0; i < 90 && victim.aiState !== 'knockdown'; i += 1) {
      world.step([]);
      if (victim.aiState === 'juggle' && victim.vy < 0 && !victim.grounded && victim.hp < 60 - 10) bounced = true;
    }
    assert.ok(bounced, 'the slam bounces the enemy back up (Death Bounce)');
    assert.equal(victim.aiState, 'knockdown', 'left alone, the bounced enemy falls and ends in knockdown');
    assert.equal(victim.grounded, true, 'harpooned enemy ends on the deck');
  });

  it('Death Bounce: pressing Circle again on the bounce slams him a second time', () => {
    const world = createWorld();
    const p = getPlayer(world);
    const victim = getEnemy(world);
    p.x = 300;
    p.facing = 1;
    victim.x = 338;
    victim.y = p.y;
    victim.hp = 300;
    victim.maxHp = 300;
    victim.aiState = 'idle';

    stepTicks(world, ['heavy-attack'], 28);
    world.step([]);
    world.step(['grab']);
    let slams = 0;
    let wasBouncing = false;
    for (let i = 0; i < 200 && slams < 2 && victim.aiState !== 'knockdown'; i += 1) {
      const bouncing = victim.aiState === 'juggle' && victim.vy < 0 && !victim.grounded && victim.hp < 290;
      // Press Circle once the first slam has bounced him and a harpoon is not already flying
      const press = bouncing && !world.snapshot().strike && !wasBouncing;
      if (bouncing) wasBouncing = true;
      world.step(press ? ['grab'] : []);
      if (world.snapshot().strike?.id === 'harpoon' && wasBouncing) slams = 2;
    }
    assert.equal(slams, 2, 'a second harpoon starts from the bounce');
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
    stepTicks(world, [], 12);
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

/**
 * Orbs from the three Circle grab endings (GoW 1 PS2): the guide ranks them
 * Pummel (most) > Rip (medium) > Toss (least), and each Pummel punch pays orbs
 * ("each punch gives Red Orbs"). The exact amounts are the team's choice
 * (`CONFIG.player.grab.orbs`, docs/direccion.md section 6.1).
 */
describe('grab orb tiers (Pummel > Rip > Toss)', () => {
  const orbs = CONFIG.player.grab.orbs;

  function setUp(hp = 60): { world: World; p: EntityState; victim: EntityState } {
    const world = createWorld();
    const p = getPlayer(world);
    const victim = getEnemy(world);
    p.x = 300;
    p.facing = 1;
    victim.x = 328;
    victim.y = p.y;
    victim.hp = hp;
    world.step(['grab']);
    assert.equal(p.grabPhase, 'hold');
    return { world, p, victim };
  }

  it('the amounts keep the guide order: a full Circle chain > Rip > Toss', () => {
    const c = CONFIG.player.grab.chain;
    const chainHits = c.punches + 1 + c.stabs;
    assert.ok(orbs.pummelPerHit * chainHits > orbs.rip, 'mashing Circle all the way pays more than a Rip');
    assert.ok(orbs.rip > orbs.toss, 'a Rip pays more than a Toss');
    assert.ok(orbs.toss > 0, 'a Toss still pays something');
  });

  it('Rip (○ then △) pays the Rip amount on the kill', () => {
    const { world, p } = setUp();
    const before = p.redOrbs;
    world.step(['heavy-attack']);
    stepTicks(world, [], CONFIG.player.grab.ripTick);
    assert.equal(p.redOrbs - before, orbs.rip);
  });

  it('Toss (○ then □) pays the Toss amount when the victim survives the throw', () => {
    const { world, p, victim } = setUp();
    const before = p.redOrbs;
    world.step(['light-attack']);
    stepTicks(world, [], CONFIG.player.grab.toss.releaseTick);
    assert.equal(victim.isDead, false, 'the throw alone does not kill a full-health legionnaire');
    assert.equal(p.redOrbs - before, orbs.toss);
  });

  it('every Circle chain hit pays, even when it does not kill: punches, the throw to the floor and the stabs', () => {
    const { world, p, victim } = setUp(100);
    const c = CONFIG.player.grab.chain;
    const before = p.redOrbs;
    world.step([]);
    let hits = 0;
    for (let i = 0; i < c.punches; i += 1) {
      world.step(['grab']);
      stepTicks(world, [], c.punchTicks);
      hits += 1;
      assert.equal(p.redOrbs - before, orbs.pummelPerHit * hits, `punch ${i + 1} pays`);
    }
    world.step(['grab']);
    stepTicks(world, [], CONFIG.player.grab.slamTicks);
    hits += 1;
    assert.equal(p.redOrbs - before, orbs.pummelPerHit * hits, 'the throw to the floor pays too');
    assert.equal(victim.isDead, false);
    // he raises the blade (or a tap brings the stab forward) and goes in
    stepTicks(world, [], c.stabDelayTicks[0] + c.stabTicks);
    hits += 1;
    assert.equal(p.redOrbs - before, orbs.pummelPerHit * hits, 'a stab pays');
  });

  it('a punch that kills pays once and the chain ends', () => {
    const { world, p, victim } = setUp(CONFIG.player.grab.chain.punchDamage);
    const before = p.redOrbs;
    world.step([]);
    world.step(['grab']);
    stepTicks(world, [], 4);
    assert.equal(victim.isDead, true);
    assert.equal(p.redOrbs - before, orbs.pummelPerHit);
    stepTicks(world, [], 2);
    assert.equal(p.redOrbs - before, orbs.pummelPerHit, 'no second payment');
  });
});

/** Details of Grab 1 the review found unpinned (see docs/direccion.md 6.1). */
describe('grab chain details', () => {
  function chainToFloor(hp: number): { world: World; p: EntityState; victim: EntityState } {
    const world = createWorld();
    const p = getPlayer(world);
    const victim = getEnemy(world);
    p.x = 300;
    p.facing = 1;
    victim.x = 328;
    victim.y = p.y;
    victim.hp = hp;
    victim.maxHp = Math.max(victim.maxHp, hp);
    world.step(['grab']);
    world.step([]);
    for (let i = 0; i < CONFIG.player.grab.chain.punches; i += 1) {
      world.step(['grab']);
      stepTicks(world, [], CONFIG.player.grab.chain.punchTicks);
    }
    world.step(['grab']);
    stepTicks(world, [], CONFIG.player.grab.slamTicks);
    assert.equal(p.grabPhase, 'floorhold');
    return { world, p, victim };
  }

  it('a ○ tap while he raises the blade only brings the stab forward', () => {
    const { world, p } = chainToFloor(1000);
    world.step([]);
    world.step([]);
    world.step(['grab']);
    assert.equal(p.grabPhase, 'stab', 'the tap made him go in sooner than the automatic delay');
  });

  it('the last stab kills whatever the victim HP, and the kill is counted', () => {
    const { world, p, victim } = chainToFloor(1000);
    const kills = world.snapshot().stats?.totalKills ?? 0;
    for (let i = 0; i < 400 && !victim.isDead; i += 1) world.step([]);
    assert.equal(victim.isDead, true, 'the fourth stab ends even a very healthy victim');
    assert.equal(victim.heldLying, false, 'a dead victim is no longer held');
    assert.ok((world.snapshot().stats?.totalKills ?? 0) > kills, 'the kill counts');
    const { stabTicks, lastStabHoldTicks } = CONFIG.player.grab.chain;
    stepTicks(world, [], stabTicks + lastStabHoldTicks); // the killing stab finishes its animation
    assert.notEqual(p.grabPhase, 'stab');
  });

  it('a victim lying on the floor stays under Kratos\' knee (lyingOffsetPx) while he stabs', () => {
    const { world, p, victim } = chainToFloor(1000);
    world.step(['grab']);
    stepTicks(world, [], 5);
    assert.equal(victim.x, p.x + p.facing * CONFIG.player.grab.lyingOffsetPx);
    assert.equal(victim.y, p.y);
    assert.equal(victim.heldLying, true);
  });

  it('team choice: after a punch Kratos is back holding the victim up, so □ still throws and △ still breaks', () => {
    for (const [action, phase] of [['light-attack', 'throw'], ['heavy-attack', 'break']] as const) {
      const world = createWorld();
      const p = getPlayer(world);
      const victim = getEnemy(world);
      p.x = 300;
      p.facing = 1;
      victim.x = 328;
      victim.y = p.y;
      victim.hp = 60;
      world.step(['grab']);
      world.step([]);
      world.step(['grab']);
      stepTicks(world, [], CONFIG.player.grab.chain.punchTicks);
      assert.equal(p.grabPhase, 'hold');
      world.step([action]);
      assert.equal(p.grabPhase, phase, `${action} after a punch starts the ${phase}`);
    }
  });
});

describe('Toss (□): the sword goes in, then he is thrown aside (GoW 1 video and guide)', () => {
  function held(hp = 60): { world: World; p: EntityState; victim: EntityState } {
    const world = createWorld();
    const p = getPlayer(world);
    const victim = getEnemy(world);
    p.x = 300;
    p.facing = 1;
    victim.x = 328;
    victim.y = p.y;
    victim.hp = hp;
    world.step(['grab']);
    world.step(['light-attack']);
    assert.equal(p.grabPhase, 'throw');
    return { world, p, victim };
  }

  it('the stab lands on its own tick, before the release', () => {
    const { world, victim } = held();
    const t = CONFIG.player.grab.toss;
    assert.ok(t.stabTick < t.releaseTick);
    stepTicks(world, [], t.stabTick - 1);
    assert.equal(victim.hp, 60, 'nothing yet');
    stepTicks(world, [], 1);
    assert.equal(victim.hp, 60 - t.stabDamage, 'the stab lands');
    assert.equal(victim.aiState, 'grabbed', 'still held after the stab');
  });

  it('a victim the stab kills is not thrown: it just dies', () => {
    const { world, victim } = held(CONFIG.player.grab.toss.stabDamage);
    stepTicks(world, [], CONFIG.player.grab.toss.stabTick);
    assert.equal(victim.isDead, true);
    stepTicks(world, [], CONFIG.player.grab.toss.releaseTick);
    assert.equal(victim.aiState, 'death', 'no flight after dying on the blade');
  });
});

describe('Turning to either side before the throw (user: the throw only goes left or right)', () => {
  function setup(): { world: World; p: EntityState; victim: EntityState } {
    const world = new World();
    world.loadScenario('magic');
    const p = getPlayer(world);
    const victim = getEnemy(world, 'legionnaire-1');
    p.x = 100;
    p.facing = 1;
    victim.x = 128;
    victim.y = p.y;
    victim.hp = 60;
    world.step(['grab']);
    assert.equal(p.grabPhase, 'hold');
    return { world, p, victim };
  }

  function toss(world: World): void {
    world.step(['light-attack']);
    stepTicks(world, [], CONFIG.player.grab.toss.releaseTick);
  }

  it('Toss without turning goes to the side he faces, whoever is near', () => {
    const { world, p, victim } = setup();
    toss(world);
    assert.equal(p.facing, 1);
    assert.equal(victim.vx, CONFIG.player.grab.throwVx);
  });
});

describe('Toss (□): the whip throws him a fixed distance and he hits the undead in the way (user, step 144)', () => {
  function toss(bystanderAt: number | null): { x0: number; landed: number; bystanderHit: boolean } {
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
    bystander.x = bystanderAt ?? 900;
    bystander.y = p.y;
    bystander.hp = 40;
    bystander.aiState = 'idle';
    world.step(['grab']);
    world.step(['light-attack']);
    let x0 = -1;
    let landed = -1;
    let hit = false;
    for (let i = 0; i < 160; i += 1) {
      world.step([]);
      if (x0 < 0 && victim.aiState === 'juggle') x0 = victim.x;
      // where he stops flying (afterwards he gets up and walks back)
      if (x0 >= 0 && landed < 0 && victim.aiState !== 'juggle') landed = victim.x;
      if (bystander.hp < 40) hit = true;
    }
    return { x0, landed, bystanderHit: hit };
  }

  it('he is shot ahead about 150 px (from where Kratos lets go) and stops there', () => {
    const { x0, landed } = toss(null);
    const distance = landed - x0;
    assert.ok(distance >= 130 && distance <= 175, `he flew ${distance.toFixed(0)} px`);
  });

  it('an undead standing in that range is bowled over, one standing far beyond it is not', () => {
    assert.equal(toss(330).bystanderHit, true, 'in the way');
    assert.equal(toss(520).bystanderHit, false, 'out of reach');
  });
});
