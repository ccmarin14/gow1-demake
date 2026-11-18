import { CONFIG } from '../config';
import { applyDamageToPlayer, damageEnemy } from './damage';
import type { EntityState, GameAction } from './types';

export interface GrabStepResult {
  hit: boolean;
  targetId: string | null;
  damageDealt: number;
  killed: boolean;
}

/** Kratos stands over the fallen victim, who lies on the floor in front of him. */
const FOLLOW_UPS: readonly GameAction[] = ['light-attack', 'heavy-attack', 'grab'];

/**
 * Remembers a follow-up (□ throw, △ rip, ○ next blow) pressed while a punch is landing, so it is not lost: it is used
 * the moment Kratos holds the victim again. Called by the world also while the hitstop freezes the tick.
 */
export function bufferGrabInput(player: EntityState, inputActions: readonly GameAction[]): void {
  if (player.grabPhase !== 'pummel' || player.grabBuffer) return;
  const pressed = FOLLOW_UPS.find((action) => inputActions.includes(action));
  if (pressed) {
    player.grabBuffer = pressed;
    player.grabBufferTicks = 0;
  }
}

/** Kratos closes the gap to the victim at `lungeStepPx` per tick (it used to be all of it in one tick: 26 px in 16 ms). */
function stepLunge(player: EntityState): number {
  const remaining = player.grabAdvancePx ?? 0;
  if (remaining <= 0) {
    player.grabLiftTicks = (player.grabLiftTicks ?? 0) + 1;
    return 0;
  }
  const step = Math.min(remaining, CONFIG.player.grab.lungeStepPx);
  player.x += player.facing * step;
  player.grabAdvancePx = remaining - step;
  return player.grabAdvancePx;
}

function keepLying(player: EntityState, target: EntityState): void {
  target.x = player.x + player.facing * CONFIG.player.grab.lyingOffsetPx;
  target.y = player.y;
  target.vx = 0;
  target.vy = 0;
  target.grounded = true;
  target.aiState = 'grabbed';
  target.heldLying = true;
}

function killVictim(target: EntityState, onKill?: (target: EntityState) => void): void {
  target.aiState = 'death';
  target.aiTicks = 0;
  target.isDead = true;
  target.heldLying = false;
  if (onKill) {
    onKill(target);
  }
}

export function isGrabbing(player: EntityState): boolean {
  return player.grabPhase !== 'none';
}

/**
 * Intenta iniciar el agarre (○ / tecla L, BL-06, D-42) o remate contextual (BL-07, ESE-01).
 *
 * Condiciones de inicio:
 * - Kratos en el suelo, sin rodar, sin guardia, sin conjuro, sin golpe activo y sin hitstun.
 * - Si hay un enemigo vulnerable al alcance frontal (distancia <= reachPx, tolerancia vertical <= verticalReachPx):
 *   - Si su vida es crítica (hp <= weakenedThresholdHp) o está en estado debilitado ('weakened'),
 *     inicia el remate contextual QTE ('finisher_qte').
 *   - Si tiene vida normal, ejecuta el agarre estándar ('hold' -> 'slam').
 * - Si no hay enemigo en rango, ejecuta un intento fallido en el vacío ('whiff') con penalización de recuperación.
 */
export function startGrab(player: EntityState, targets: readonly EntityState[]): boolean {
  if (player.grabPhase !== 'none' || !player.grounded || player.isDead || player.hitstunTicks > 0) {
    return false;
  }

  const cfg = CONFIG.player.grab;
  let closestTarget: EntityState | null = null;
  let minDistance = Infinity;

  for (let i = 0; i < targets.length; i += 1) {
    const target = targets[i];
    if (
      target.id === player.id ||
      target.isDead ||
      target.aiState === 'death' ||
      target.aiState === 'grabbed' ||
      target.kind === 'hydra'
    ) {
      continue;
    }

    const dy = Math.abs(target.y - player.y);
    if (dy > cfg.verticalReachPx) {
      continue;
    }

    const dx = (target.x - player.x) * player.facing;
    if (dx >= 0 && dx <= cfg.reachPx && dx < minDistance) {
      minDistance = dx;
      closestTarget = target;
    }
  }

  if (!closestTarget) {
    // Whiff: falló el agarre, Kratos se abalanza al frente (lunge) pero no atrapa a nadie
    player.grabPhase = 'whiff';
    player.grabTicks = 0;
    player.grabTargetId = null;
    player.vx = player.facing * cfg.lungeSpeedPx;
    return true;
  }

  // Agarre conectado:
  // Kratos da un paso de embestida al frente (grab-lunge) cerrando la brecha física con la víctima
  let advance = 0;
  if (minDistance > cfg.holdDistancePx) {
    advance = Math.min(cfg.lungeMaxAdvancePx, Math.max(0, Math.round(minDistance - cfg.holdDistancePx)));
  }
  player.grabAdvancePx = advance;
  player.grabLiftTicks = 0;
  player.grabPummelCount = 0;
  player.grabBuffer = null;

  // Solo inicia el QTE contextual si el objetivo está explícitamente en estado 'weakened'.
  // Los legionarios básicos se agarran siempre en 'hold' para elegir □ (lanzar), △ (partir) o ○ (azotar).
  const isWeakened = closestTarget.aiState === 'weakened';

  if (isWeakened) {
    player.grabPhase = 'finisher_qte';
    player.grabTicks = 0;
    player.grabTargetId = closestTarget.id;
    player.vx = 0;
    player.qteAction = 'heavy-attack';
    player.qteTicksLeft = CONFIG.enemy.legionnaire.qteWindowTicks;
    player.qteMaxTicks = CONFIG.enemy.legionnaire.qteWindowTicks;
    player.invulTicks = Math.max(player.invulTicks, CONFIG.enemy.legionnaire.qteWindowTicks + 30);

    closestTarget.aiState = 'grabbed';
    closestTarget.aiTicks = 0;
    closestTarget.grabBreakFreeTicks = 0;
    closestTarget.vx = 0;
    closestTarget.vy = 0;
    closestTarget.attackHits = [];
    closestTarget.facing = player.facing === 1 ? -1 : 1;
    closestTarget.x = player.x + player.facing * (cfg.holdDistancePx + (player.grabAdvancePx ?? 0));
    closestTarget.y = player.y;

    return true;
  }

  // Agarre estándar contra enemigo con salud completa: inmoviliza a ambos en 'hold'
  player.grabPhase = 'hold';
  player.grabTicks = 0;
  player.grabTargetId = closestTarget.id;
  player.vx = 0;
  player.invulTicks = Math.max(player.invulTicks, cfg.invulTicks);

  closestTarget.aiState = 'grabbed';
  closestTarget.aiTicks = 0;
  closestTarget.vx = 0;
  closestTarget.vy = 0;
  closestTarget.attackHits = [];
  closestTarget.facing = player.facing === 1 ? -1 : 1;
  closestTarget.x = player.x + player.facing * (cfg.holdDistancePx + (player.grabAdvancePx ?? 0));
  closestTarget.y = player.y;

  return true;
}

/**
 * Avanza la máquina de estados del agarre y remate en cada tick:
 * - 'whiff': recuperación del intento fallido hasta whiffTicks.
 * - 'finisher_qte': espera la pulsación de la tecla asignada (Triángulo / I / heavy-attack)
 *   dentro de qteWindowTicks; si acierta, pasa a 'finisher_slam'; si falla o expira, el enemigo contraataca.
 * - 'finisher_slam': impacto letal que fulmina al enemigo y otorga curación (+25 HP) y orbes rojos extra (+5).
 * - 'hold': sujeción mutua estándar hasta holdTicks.
 * - 'slam': impacto contra la cubierta; inflige daño, pasa a 'death' o 'knockdown'.
 * - 'recovery': retorno al reposo y devolución de control a Kratos.
 */
export function stepGrab(
  player: EntityState,
  targets: readonly EntityState[],
  inputActions: readonly GameAction[] = [],
  onKill?: (target: EntityState) => void,
  heldDirection: -1 | 0 | 1 = 0,
): GrabStepResult {
  const result: GrabStepResult = {
    hit: false,
    targetId: null,
    damageDealt: 0,
    killed: false,
  };

  if (player.grabPhase === 'none') {
    return result;
  }

  const cfg = CONFIG.player.grab;

  // 1. Fase de Whiff (intento en el vacío con embestida hacia adelante y freno)
  if (player.grabPhase === 'whiff') {
    player.grabTicks += 1;
    const lungeTicks = cfg.whiffLungeTicks ?? 12;
    if (player.grabTicks <= lungeTicks) {
      player.vx = player.facing * cfg.lungeSpeedPx;
    } else {
      player.vx = 0;
    }
    if (player.grabTicks >= cfg.whiffTicks) {
      player.grabPhase = 'none';
      player.grabTicks = 0;
      player.vx = 0;
    }
    return result;
  }

  player.vx = 0;

  // 2. Fase de QTE de Remate Contextual (BL-07, ESE-01)
  if (player.grabPhase === 'finisher_qte') {
    if (player.invulTicks < 2) {
      player.invulTicks = 2;
    }

    const target = targets.find((e) => e.id === player.grabTargetId);
    if (!target || target.isDead) {
      player.grabPhase = 'none';
      player.grabTicks = 0;
      player.grabTargetId = null;
      player.qteAction = null;
      player.qteTicksLeft = 0;
      player.qteMaxTicks = 0;
      return result;
    }

    stepLunge(player);

    // Mantener al enemigo inmovilizado frente a Kratos (quieto donde estaba mientras Kratos cierra la distancia)
    target.x = player.x + player.facing * (cfg.holdDistancePx + (player.grabAdvancePx ?? 0));
    target.y = player.y;
    target.vx = 0;
    target.vy = 0;
    target.aiState = 'grabbed';

    const targetAction = player.qteAction ?? 'heavy-attack';
    const successPressed = inputActions.includes(targetAction);
    const wrongActions: readonly GameAction[] = ['light-attack', 'dodge', 'jump'];
    const failPressed = !successPressed && inputActions.some((a) => wrongActions.includes(a));
    const timedOut = player.qteTicksLeft <= 0;

    if (successPressed) {
      // Remate exitoso: ejecución letal inmediata
      player.grabPhase = 'finisher_slam';
      player.grabTicks = 0;
      player.qteAction = null;
      player.qteTicksLeft = 0;

      // Bonificación de salud y orbes rojos al ejecutar remate contextual
      player.hp = Math.min(player.maxHp, player.hp + CONFIG.enemy.legionnaire.finisherHealAmount);
      player.redOrbs = (player.redOrbs ?? 0) + CONFIG.enemy.legionnaire.finisherBonusRedOrbs;

      const overkillDamage = target.hp + 50;
      damageEnemy(target, overkillDamage, 60);
      target.hp = 0;
      target.aiState = 'death';
      target.aiTicks = 0;
      target.isDead = true;

      result.hit = true;
      result.targetId = target.id;
      result.damageDealt = target.maxHp;
      result.killed = true;

      if (onKill) {
        onKill(target);
      }
      return result;
    }

    if (failPressed || timedOut) {
      // Fallo de QTE: el legionario rompe la presa y contraataca
      player.grabPhase = 'none';
      player.grabTicks = 0;
      player.grabTargetId = null;
      player.qteAction = null;
      player.qteTicksLeft = 0;
      player.qteMaxTicks = 0;
      player.invulTicks = 0;
      player.hurtInvulTicks = 0;

      applyDamageToPlayer(player, target, CONFIG.enemy.legionnaire.qteFailDamage);

      target.aiState = 'approach';
      target.aiTicks = 0;
      target.vx = -player.facing * 30;
      return result;
    }

    player.qteTicksLeft -= 1;
    player.grabTicks += 1;
    return result;
  }

  // 3. Fase de Remate Slam (finisher_slam)
  if (player.grabPhase === 'finisher_slam') {
    if (player.invulTicks < 2) {
      player.invulTicks = 2;
    }

    const target = targets.find((e) => e.id === player.grabTargetId);
    if (target) {
      target.x = player.x + player.facing * cfg.holdDistancePx;
      target.y = player.y;
      target.vx = 0;
      target.vy = 0;
      target.aiState = 'death';
      target.isDead = true;
    }

    player.grabTicks += 1;
    if (player.grabTicks >= cfg.slamTicks) {
      player.grabPhase = 'recovery';
      player.grabTicks = 0;
      player.grabTargetId = null;
    }
    return result;
  }

  // 4. Fase de Sujeción Estándar (Hold) — 3 opciones clásicas de GoW 1 (□ Lanzar / △ Partir / ○ Azotar)
  if (player.grabPhase === 'hold') {
    if (player.invulTicks < 2) {
      player.invulTicks = 2;
    }

    const target = targets.find((e) => e.id === player.grabTargetId);
    if (!target || target.isDead) {
      player.grabPhase = 'none';
      player.grabTicks = 0;
      player.grabTargetId = null;
      return result;
    }

    stepLunge(player);

    // Kratos can be turned to either side before choosing (the throw goes left or right): holding the
    // other direction turns him, and the victim with him.
    if (heldDirection !== 0 && heldDirection !== player.facing) {
      player.facing = heldDirection;
    }

    target.x = player.x + player.facing * (cfg.holdDistancePx + (player.grabAdvancePx ?? 0));
    target.y = player.y;
    target.vx = 0;
    target.vy = 0;
    target.aiState = 'grabbed';

    // A partir del primer tick posterior al enganche (grabTicks >= 1), el jugador puede elegir:
    // - □ ('light-attack'): lanzar al enemigo como proyectil humano que derriba a otros en su camino (lanzamiento en tick 6).
    // - △ ('heavy-attack'): partir / quebrar brutalmente al enemigo (ejecución letal instantánea en tick 11).
    // - ○ ('grab'): Grab 1, la cadena de ○ repetido (3 puñetazos, azote al suelo, 4 puñaladas; ver `CONFIG.player.grab.chain`).
    // - fin de holdTicks sin elegir: el enemigo se zafa.
    const canChooseOption = player.grabTicks >= 1;
    // A press made while the last punch was landing counts now (it is dropped if it is too old)
    let choices = inputActions;
    if (player.grabBuffer) {
      if (canChooseOption && (player.grabBufferTicks ?? 0) <= cfg.followUpBufferTicks && !FOLLOW_UPS.some((a) => inputActions.includes(a))) {
        choices = [...inputActions, player.grabBuffer];
      }
      if (canChooseOption) player.grabBuffer = null;
    }
    const chooseThrow = canChooseOption && choices.includes('light-attack');
    const chooseBreak = canChooseOption && !chooseThrow && choices.includes('heavy-attack');
    const chooseCircle = canChooseOption && !chooseThrow && !chooseBreak && choices.includes('grab');

    player.grabTicks += 1;

    if (chooseThrow) {
      player.grabPhase = 'throw';
      player.grabTicks = 0;
      target.attackHits = [];
    } else if (chooseBreak) {
      player.grabPhase = 'break';
      player.grabTicks = 0;
    } else if (chooseCircle) {
      // Grab 1: one tap per blow. Taps 1..3 punch, the next throws him to the floor, then he is stabbed.
      const taps = player.grabPummelCount ?? 0;
      player.grabPummelCount = taps + 1;
      player.grabPhase = taps < cfg.chain.punches ? 'pummel' : 'slam';
      player.grabTicks = 0;
    } else if (player.grabTicks >= cfg.holdTicks) {
      // Si expira el tiempo de sujeción (holdTicks) sin que el jugador elija □, △ o ○,
      // el enemigo se zafa de la presa y vuelve a 'approach' sin recibir azote automático.
      player.grabPhase = 'recovery';
      player.grabTicks = 0;
      // the target stays set through the recovery so the presentation can show him wrenching free (it is cleared at its end)
      player.vx = -player.facing * cfg.breakFreePlayerVx;
      target.aiState = 'guard';
      target.aiTicks = 0;
      target.grabBreakFreeTicks = cfg.breakFreeTicks;
      target.attackCooldownTicks = Math.max(
        target.attackCooldownTicks,
        CONFIG.enemy.legionnaire.holdTicksMin,
      );
      target.vx = player.facing * cfg.breakFreeEnemyVx;
      target.vy = 0;
      return result;
    } else {
      return result;
    }
  }

  // 4.b Puñetazos de Grab 1 (○ repetido): Kratos sujeta en alto con una mano y golpea con la otra.
  if (player.grabPhase === 'pummel') {
    if (player.invulTicks < 2) {
      player.invulTicks = 2;
    }
    // the tap that started this punch is not a follow-up: only presses made while it lands are kept
    if (player.grabTicks >= 1) bufferGrabInput(player, inputActions);
    if (player.grabBuffer) player.grabBufferTicks = (player.grabBufferTicks ?? 0) + 1;

    const target = targets.find((e) => e.id === player.grabTargetId);
    if (!target) {
      player.grabPhase = 'none';
      player.grabTicks = 0;
      player.grabTargetId = null;
      return result;
    }

    // A victim killed by this very punch is left as it fell: Kratos still finishes the blow (it used to cut at once)
    if (!target.isDead) {
      target.x = player.x + player.facing * cfg.holdDistancePx;
      target.y = player.y;
      target.vx = 0;
      target.vy = 0;
      target.aiState = 'grabbed';
    }

    // El puño impacta en el tick 4
    if (player.grabTicks === 4) {
      const killed = damageEnemy(target, cfg.chain.punchDamage, 14);
      result.hit = true;
      result.targetId = target.id;
      result.damageDealt = cfg.chain.punchDamage;
      result.killed = killed;
      player.redOrbs = (player.redOrbs ?? 0) + cfg.orbs.pummelPerHit;
      if (killed) {
        killVictim(target, onKill);
      } else {
        target.aiState = 'grabbed';
      }
    }

    player.grabTicks += 1;
    if (player.grabTicks >= cfg.chain.punchTicks) {
      if (target.isDead) {
        player.grabPhase = 'recovery';
      } else {
        player.grabPhase = 'hold';
      }
      player.grabTicks = target.isDead ? 0 : 1;
    }
    return result;
  }

  // 4.c Víctima en el suelo tras el azote: Kratos levanta la hoja y la apuñala solo (cuatro veces); un toque de ○ solo adelanta la puñalada.
  if (player.grabPhase === 'floorhold') {
    if (player.invulTicks < 2) {
      player.invulTicks = 2;
    }

    const target = targets.find((e) => e.id === player.grabTargetId);
    if (!target || target.isDead) {
      player.grabPhase = 'none';
      player.grabTicks = 0;
      player.grabTargetId = null;
      return result;
    }

    keepLying(player, target);

    // He stabs on his own once the blade is up; a tap (after the first ticks) only makes him go in sooner
    if ((inputActions.includes('grab') && player.grabTicks >= 2) || player.grabTicks >= cfg.chain.autoStabDelayTicks) {
      player.grabPummelCount = (player.grabPummelCount ?? 0) + 1;
      player.grabPhase = 'stab';
      player.grabTicks = 0;
    } else {
      player.grabTicks += 1;
      return result;
    }
  }

  // 4.d Puñaladas con la Espada del Caos sobre la víctima caída; la última siempre mata.
  if (player.grabPhase === 'stab') {
    if (player.invulTicks < 2) {
      player.invulTicks = 2;
    }

    const target = targets.find((e) => e.id === player.grabTargetId);
    if (!target) {
      player.grabPhase = 'none';
      player.grabTicks = 0;
      player.grabTargetId = null;
      return result;
    }

    // The stab that kills does not cut the animation short: the body stays where it lies and Kratos pulls the blade out
    if (!target.isDead) {
      keepLying(player, target);
    }

    if (player.grabTicks === cfg.chain.stabImpactTick) {
      const lastStab = (player.grabPummelCount ?? 0) >= cfg.chain.punches + 1 + cfg.chain.stabs;
      const damage = lastStab ? Math.max(cfg.chain.stabDamage, target.hp) : cfg.chain.stabDamage;
      const killed = damageEnemy(target, damage, 14);
      result.hit = true;
      result.targetId = target.id;
      result.damageDealt = damage;
      result.killed = killed;
      player.redOrbs = (player.redOrbs ?? 0) + cfg.orbs.pummelPerHit;
      if (killed) {
        killVictim(target, onKill);
      } else {
        keepLying(player, target);
      }
    }

    player.grabTicks += 1;
    if (player.grabTicks >= cfg.chain.stabTicks) {
      if (target.isDead) {
        player.grabPhase = 'recovery';
        player.grabTicks = 0;
      } else {
        player.grabPhase = 'floorhold';
        player.grabTicks = 0;
      }
    }
    return result;
  }

  // 5. Fases de Ejecución de Presa (Slam / Throw / Break)
  if (player.grabPhase === 'slam' || player.grabPhase === 'throw' || player.grabPhase === 'break') {
    if (player.invulTicks < 2) {
      player.invulTicks = 2;
    }

    const target = targets.find((e) => e.id === player.grabTargetId);

    // 5.a Lanzamiento (Toss con □), como en el video y la guía de GoW 1:
    // Kratos sujeta al soldado de lado, le hunde una espada (tick `stabTick`) y lo lanza a un costado
    // (tick `releaseTick`: daño, velocidad de vuelo y paso a 'juggle'). Si la puñalada lo mata, no hay lanzamiento.
    if (player.grabPhase === 'throw') {
      const { stabTick, stabDamage, releaseTick } = cfg.toss;
      if (target && !target.isDead) {
        if (player.grabTicks < releaseTick) {
          target.x = player.x + player.facing * 12;
          target.y = player.y - 12;
          target.vx = 0;
          target.vy = 0;
          target.aiState = 'grabbed';
          if (player.grabTicks === stabTick) {
            const stabbed = damageEnemy(target, stabDamage, 14);
            result.hit = true;
            result.targetId = target.id;
            result.damageDealt = stabDamage;
            result.killed = stabbed;
            if (stabbed) {
              killVictim(target, onKill);
              target.grounded = true;
              target.y = player.y;
            } else {
              target.aiState = 'grabbed';
            }
          }
        } else if (player.grabTicks === releaseTick) {
          const knockdownTicks = CONFIG.enemy.legionnaire.knockdownTicks;
          const killed = damageEnemy(target, cfg.throwDamage, knockdownTicks);
          result.hit = true;
          result.targetId = target.id;
          result.damageDealt = cfg.throwDamage;
          result.killed = killed;
          player.redOrbs = (player.redOrbs ?? 0) + cfg.orbs.toss;

          if (killed) {
            target.aiState = 'death';
            target.aiTicks = 0;
            target.isDead = true;
            target.grounded = true;
            target.y = player.y;
            if (onKill) {
              onKill(target);
            }
          } else {
            target.aiState = 'juggle';
            target.aiTicks = 0;
            target.grounded = false;
            target.vx = player.facing * cfg.throwVx;
            target.vy = cfg.throwVy;
            target.attackHits = [];
          }
        }
      }
    }

    // 5.b Quiebre brutal sobre cubierta (Break con △):
    // Ticks 0..10 (grab-break-a): Kratos alza al soldado sobre la cabeza con ambas manos.
    // Tick 11 (grab-break-b): Kratos lo estrella y quiebra contra las tablas; en GoW 1 (PS2) esto es una ejecución letal instantánea.
    if (player.grabPhase === 'break') {
      const snapTick = cfg.ripTick;
      if (target) {
        if (player.grabTicks < snapTick) {
          target.x = player.x + player.facing * 6;
          target.y = player.y - 22;
          target.vx = 0;
          target.vy = 0;
          target.aiState = 'grabbed';
        } else if (player.grabTicks === snapTick) {
          // Ejecución brutal como en GoW 1 PS2: quiebra al soldado y lo asienta en la cubierta
          const overkillDamage = Math.max(target.hp + 20, cfg.breakDamage);
          damageEnemy(target, overkillDamage, 60);
          player.redOrbs = (player.redOrbs ?? 0) + cfg.orbs.rip;
          target.hp = 0;
          target.aiState = 'death';
          target.aiTicks = 0;
          target.isDead = true;
          target.ripped = true;
          target.grounded = true;
          target.x = player.x + player.facing * 18;
          target.y = player.y;
          target.vx = 0;
          target.vy = 0;

          result.hit = true;
          result.targetId = target.id;
          result.damageDealt = overkillDamage;
          result.killed = true;

          if (onKill) {
            onKill(target);
          }
        } else {
          // Mantener al cadáver asentado firmemente en el piso de la cubierta
          target.x = player.x + player.facing * 18;
          target.y = player.y;
          target.grounded = true;
          target.vx = 0;
          target.vy = 0;
        }
      }
    }

    // 5.c Azote contra la cubierta (Slam con ○):
    // Ticks 0..9 (grab-slam-a): Kratos alza al enemigo frente al hombro.
    // Tick 10 (grab-slam-b): impacto violento contra las tablas; aplica daño de 25 y derribo/muerte.
    if (player.grabPhase === 'slam') {
      const slamImpactTick = cfg.slamImpactTick;
      if (target) {
        if (player.grabTicks < slamImpactTick) {
          target.x = player.x + player.facing * 14;
          target.y = player.y - 16;
          target.vx = 0;
          target.vy = 0;
          target.aiState = 'grabbed';
        } else if (player.grabTicks === slamImpactTick) {
          const knockdownTicks = CONFIG.enemy.legionnaire.knockdownTicks;
          const killed = damageEnemy(target, cfg.damage, knockdownTicks);
          result.hit = true;
          result.targetId = target.id;
          result.damageDealt = cfg.damage;
          result.killed = killed;
          player.redOrbs = (player.redOrbs ?? 0) + cfg.orbs.pummelPerHit;

          target.x = player.x + player.facing * cfg.lyingOffsetPx;
          target.y = player.y;

          if (killed) {
            target.aiState = 'death';
            target.aiTicks = 0;
            target.isDead = true;
            target.grounded = true;
            target.vx = 0;
            target.vy = 0;
            if (onKill) {
              onKill(target);
            }
          } else {
            // La víctima queda tendida bajo Kratos (Grab 1): el siguiente toque de ○ la apuñala.
            target.aiState = 'grabbed';
            target.heldLying = true;
            target.grounded = true;
            target.vx = 0;
            target.vy = 0;
          }
        }
      }
    }

    player.grabTicks += 1;
    const executionTicks = player.grabPhase === 'slam' ? cfg.slamTicks : player.grabPhase === 'throw' ? cfg.throwTicks : cfg.breakTicks;
    if (player.grabTicks >= executionTicks) {
      if (player.grabPhase === 'slam' && target && !target.isDead && target.heldLying) {
        player.grabPhase = 'floorhold';
        player.grabTicks = 0;
        return result;
      }
      player.grabPhase = 'recovery';
      player.grabTicks = 0;
      player.grabTargetId = null;
    }
    return result;
  }

  // 6. Fase de Recuperación (Recovery)
  if (player.grabPhase === 'recovery') {
    // The break-free impulse lasts for the release tick only.
    player.vx = 0;
    player.grabTicks += 1;
    // After the floor stabs Kratos has to get up from his knee
    const recoveryTicks = (player.grabPummelCount ?? 0) > cfg.chain.punches ? cfg.chain.getUpTicks : cfg.recoveryTicks;
    if (player.grabTicks >= recoveryTicks) {
      player.grabPhase = 'none';
      player.grabTicks = 0;
      player.grabTargetId = null;
    }
    return result;
  }

  return result;
}
