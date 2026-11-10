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
    // Whiff: falló el agarre, vulnerable durante whiffTicks
    player.grabPhase = 'whiff';
    player.grabTicks = 0;
    player.grabTargetId = null;
    player.vx = 0;
    return true;
  }

  // Agarre conectado:
  // Si el objetivo está debilitado (hp <= weakenedThresholdHp o aiState === 'weakened'),
  // inicia el remate contextual QTE (BL-07, ESE-01).
  const isWeakened =
    closestTarget.hp <= CONFIG.enemy.legionnaire.weakenedThresholdHp ||
    closestTarget.aiState === 'weakened';

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
    closestTarget.x = player.x + player.facing * cfg.holdDistancePx;
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
  closestTarget.x = player.x + player.facing * cfg.holdDistancePx;
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
  player.vx = 0;

  // 1. Fase de Whiff (intento en el vacío)
  if (player.grabPhase === 'whiff') {
    player.grabTicks += 1;
    if (player.grabTicks >= cfg.whiffTicks) {
      player.grabPhase = 'none';
      player.grabTicks = 0;
    }
    return result;
  }

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

  // 4. Fase de Sujeción Estándar (Hold)
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

    target.x = player.x + player.facing * cfg.holdDistancePx;
    target.y = player.y;
    target.vx = 0;
    target.vy = 0;
    target.aiState = 'grabbed';

    player.grabTicks += 1;
    if (player.grabTicks >= cfg.holdTicks) {
      player.grabPhase = 'slam';
      player.grabTicks = 0;

      const knockdownTicks = CONFIG.enemy.legionnaire.knockdownTicks;
      const killed = damageEnemy(target, cfg.damage, knockdownTicks);
      result.hit = true;
      result.targetId = target.id;
      result.damageDealt = cfg.damage;
      result.killed = killed;

      if (killed) {
        target.aiState = 'death';
        target.aiTicks = 0;
        target.isDead = true;
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
    return result;
  }

  // 5. Fase de Azote Estándar (Slam)
  if (player.grabPhase === 'slam') {
    if (player.invulTicks < 2) {
      player.invulTicks = 2;
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
