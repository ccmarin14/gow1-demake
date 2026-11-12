import { CONFIG } from '../config';
import { applyDamageToPlayer, damageEnemy } from './damage';
import type { EntityState, GameAction } from './types';

export interface GrabStepResult {
  hit: boolean;
  targetId: string | null;
  damageDealt: number;
  killed: boolean;
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
  const step0 = Math.floor(advance / 2);
  player.x += player.facing * step0;
  player.grabAdvancePx = advance - step0;
  player.grabPummelCount = 0;

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

    if (player.grabAdvancePx && player.grabAdvancePx > 0) {
      player.x += player.facing * player.grabAdvancePx;
      player.grabAdvancePx = 0;
    }

    // Mantener al enemigo inmovilizado frente a Kratos
    target.x = player.x + player.facing * cfg.holdDistancePx;
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

    if (player.grabAdvancePx && player.grabAdvancePx > 0) {
      player.x += player.facing * player.grabAdvancePx;
      player.grabAdvancePx = 0;
    }

    target.x = player.x + player.facing * cfg.holdDistancePx;
    target.y = player.y;
    target.vx = 0;
    target.vy = 0;
    target.aiState = 'grabbed';

    // A partir del primer tick posterior al enganche (grabTicks >= 1), el jugador puede elegir:
    // - □ ('light-attack'): lanzar al enemigo como proyectil humano que derriba a otros en su camino (lanzamiento en tick 6).
    // - △ ('heavy-attack'): partir / quebrar brutalmente al enemigo (ejecución letal instantánea en tick 11).
    // - ○ ('grab') o fin de holdTicks: Grab 1 (golpiza a mano limpia 'pummel' con ○ repetido, o azote final 'slam').
    const canChooseOption = player.grabTicks >= 1;
    const chooseThrow = canChooseOption && inputActions.includes('light-attack');
    const chooseBreak = canChooseOption && !chooseThrow && inputActions.includes('heavy-attack');
    const chooseCircle = canChooseOption && !chooseThrow && !chooseBreak && inputActions.includes('grab');

    player.grabTicks += 1;

    if (chooseThrow) {
      player.grabPhase = 'throw';
      player.grabTicks = 0;
      target.attackHits = [];
    } else if (chooseBreak) {
      player.grabPhase = 'break';
      player.grabTicks = 0;
    } else if (chooseCircle) {
      const pummelsSoFar = (player.grabPummelCount ?? 0) + 1;
      player.grabPummelCount = pummelsSoFar;
      if (pummelsSoFar >= cfg.maxPummels || target.hp <= cfg.damage) {
        // En el 3er toque de ○ o si la vida del enemigo ya es crítica (<= 25), ejecuta el azote final contra cubierta
        player.grabPhase = 'slam';
        player.grabTicks = 0;
      } else {
        // Grab 1: golpe/rodillazo a mano limpia que daña y suma impactos
        player.grabPhase = 'pummel';
        player.grabTicks = 0;
      }
    } else if (player.grabTicks >= cfg.holdTicks) {
      // Si expira el tiempo de sujeción (holdTicks) sin que el jugador elija □, △ o ○,
      // el enemigo se zafa de la presa y vuelve a 'approach' sin recibir azote automático.
      player.grabPhase = 'recovery';
      player.grabTicks = 0;
      player.grabTargetId = null;
      target.aiState = 'approach';
      target.aiTicks = 0;
      target.vx = player.facing * 35;
      target.vy = 0;
      return result;
    } else {
      return result;
    }
  }

  // 4.b Fase de Apuñalamiento con la Espada del Caos (Grab 1 - TAP ○ REPEATEDLY)
  if (player.grabPhase === 'pummel') {
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

    target.x = player.x + player.facing * cfg.holdDistancePx;
    target.y = player.y;
    target.vx = 0;
    target.vy = 0;
    target.aiState = 'grabbed';

    // Penetración de la Espada del Caos en el torso en tick 4
    if (player.grabTicks === 4) {
      const killed = damageEnemy(target, cfg.pummelDamage, 14);
      result.hit = true;
      result.targetId = target.id;
      result.damageDealt = cfg.pummelDamage;
      result.killed = killed;

      if (killed) {
        player.redOrbs = (player.redOrbs ?? 0) + CONFIG.enemy.legionnaire.finisherBonusRedOrbs;
        target.aiState = 'death';
        target.aiTicks = 0;
        target.isDead = true;
        if (onKill) {
          onKill(target);
        }
      }
    }

    player.grabTicks += 1;
    if (player.grabTicks >= cfg.pummelTicks) {
      if (target.isDead) {
        player.grabPhase = 'slam';
        player.grabTicks = 10;
      } else {
        player.grabPhase = 'hold';
        player.grabTicks = 1;
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

    // 5.a Lanzamiento como proyectil (Throw con □):
    // Ticks 0..5 (grab-throw-a): Kratos carga al enemigo horizontalmente a dos manos cruzando el pecho.
    // Tick 6 (grab-throw-b): Kratos lo impulsa al frente; se aplica el daño, la velocidad de vuelo y pasa a 'juggle'.
    if (player.grabPhase === 'throw') {
      const releaseTick = 6;
      if (target) {
        if (player.grabTicks < releaseTick) {
          target.x = player.x + player.facing * 12;
          target.y = player.y - 12;
          target.vx = 0;
          target.vy = 0;
          target.aiState = 'grabbed';
        } else if (player.grabTicks === releaseTick) {
          const knockdownTicks = CONFIG.enemy.legionnaire.knockdownTicks;
          const killed = damageEnemy(target, cfg.throwDamage, knockdownTicks);
          result.hit = true;
          result.targetId = target.id;
          result.damageDealt = cfg.throwDamage;
          result.killed = killed;

          if (killed) {
            player.redOrbs = (player.redOrbs ?? 0) + CONFIG.enemy.legionnaire.finisherBonusRedOrbs;
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
      const snapTick = 11;
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
          player.redOrbs = (player.redOrbs ?? 0) + CONFIG.enemy.legionnaire.finisherBonusRedOrbs;
          target.hp = 0;
          target.aiState = 'death';
          target.aiTicks = 0;
          target.isDead = true;
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
      const slamImpactTick = 10;
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

          target.x = player.x + player.facing * 18;
          target.y = player.y;

          if (killed) {
            player.redOrbs = (player.redOrbs ?? 0) + CONFIG.enemy.legionnaire.finisherBonusRedOrbs;
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
            target.aiState = 'knockdown';
            target.aiTicks = 0;
            target.grounded = true;
            target.vx = player.facing * cfg.slamVx;
            target.vy = cfg.slamVy;
          }
        }
      }
    }

    player.grabTicks += 1;
    if (player.grabTicks >= cfg.slamTicks) {
      player.grabPhase = 'recovery';
      player.grabTicks = 0;
      player.grabTargetId = null;
    }
    return result;
  }

  // 6. Fase de Recuperación (Recovery)
  if (player.grabPhase === 'recovery') {
    player.grabTicks += 1;
    if (player.grabTicks >= cfg.recoveryTicks) {
      player.grabPhase = 'none';
      player.grabTicks = 0;
      player.grabTargetId = null;
    }
    return result;
  }

  return result;
}
