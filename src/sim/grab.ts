import { CONFIG } from '../config';
import { damageEnemy } from './damage';
import type { EntityState } from './types';

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
 * Intenta iniciar el agarre (○ / tecla L, BL-06, D-42).
 *
 * Condiciones de inicio:
 * - Kratos en el suelo, sin rodar, sin guardia, sin conjuro, sin golpe activo y sin hitstun.
 * - Si hay un enemigo vulnerable al alcance frontal (distancia <= reachPx, tolerancia vertical <= verticalReachPx),
 *   conecta el agarre, inmoviliza a ambos e inicia la fase de sujeción ('hold') con i-frames.
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

  // Agarre conectado: inmoviliza a ambos en 'hold'
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
 * Avanza la máquina de estados del agarre en cada tick:
 * - 'whiff': recuperación del intento fallido hasta whiffTicks.
 * - 'hold': sujeción mutua, ancla al enemigo e invulnerabilidad activa hasta holdTicks.
 * - 'slam': impacto violento contra la cubierta; inflige daño, pasa a 'death' si es letal
 *   o a 'knockdown' (derribo en cubierta, ESE-07) si sobrevive.
 * - 'recovery': retorno al reposo y devolución de control a Kratos.
 */
export function stepGrab(
  player: EntityState,
  targets: readonly EntityState[],
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

  // 2. Fase de Sujeción (Hold)
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

    // Mantener al enemigo aferrado y orientado frente a Kratos
    target.x = player.x + player.facing * cfg.holdDistancePx;
    target.y = player.y;
    target.vx = 0;
    target.vy = 0;
    target.aiState = 'grabbed';

    player.grabTicks += 1;
    if (player.grabTicks >= cfg.holdTicks) {
      // Transición a azotar al enemigo (slam)
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
        // Pasa a estado de derribo en cubierta (knockdown, ESE-07)
        target.aiState = 'knockdown';
        target.aiTicks = 0;
        target.grounded = true;
        target.vx = player.facing * cfg.slamVx;
        target.vy = cfg.slamVy;
      }
    }
    return result;
  }

  // 3. Fase de Azote (Slam)
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

  // 4. Fase de Recuperación (Recovery)
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
