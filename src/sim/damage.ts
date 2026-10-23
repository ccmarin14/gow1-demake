import { CONFIG } from '../config';
import type { EntityState } from './types';

export interface PlayerDamageResult {
  hit: boolean;
  parried: boolean;
  blocked: boolean;
  damageDealt: number;
}

/**
 * Resuelve el impacto de un ataque enemigo sobre Kratos:
 * - Rodada (invulTicks > 0) o post-daño (hurtInvulTicks > 0): evasión total (0 daño).
 * - Desvío Parry (parryActive === true): 0 daño, 0 retroceso, y el enemigo sufre aturdimiento largo.
 * - Guardia activa (guardPhase === 'active'): mitigación del 85% (daño residual menor), guardia intacta.
 * - Desprotegido: 100% daño, interrupción de ataque, retroceso horizontal y 45 ticks de invulnerabilidad.
 * - Vida 0: transición a `isDead = true` y detención total.
 */
export function applyDamageToPlayer(
  player: EntityState,
  attacker: EntityState,
  baseDamage: number,
): PlayerDamageResult {
  if (player.isDead) {
    return { hit: false, parried: false, blocked: false, damageDealt: 0 };
  }

  // 1. Evasión por rodada (i-frames) o invulnerabilidad post-daño
  if (player.invulTicks > 0 || player.hurtInvulTicks > 0) {
    return { hit: false, parried: false, blocked: false, damageDealt: 0 };
  }

  // 2. Desvío perfecto (Parry)
  if (player.guardPhase === 'active' && player.parryActive) {
    attacker.aiState = 'hitstun';
    attacker.aiTicks = 0;
    attacker.hitstunTicks = CONFIG.enemy.legionnaire.parryStunTicks;
    attacker.vx = -attacker.facing * 120;
    attacker.attackCooldownTicks = CONFIG.enemy.legionnaire.cooldownTicks;
    player.attackHits.push(attacker.id);

    return { hit: false, parried: true, blocked: false, damageDealt: 0 };
  }

  // 3. Guardia estándar sostenida (mitigación del 85%)
  if (player.guardPhase === 'active') {
    const mitigation = CONFIG.player.damage.guardMitigationRatio;
    const residualDamage = Math.max(1, Math.round(baseDamage * (1 - mitigation)));
    player.hp = Math.max(0, player.hp - residualDamage);

    // Amortiguación de retroceso en guardia sin romper postura
    player.vx = player.facing * -30;
    attacker.vx = -attacker.facing * 40;
    attacker.attackCooldownTicks = CONFIG.enemy.legionnaire.cooldownTicks;

    if (player.hp === 0) {
      player.isDead = true;
      player.vx = 0;
      player.guardPhase = 'none';
      player.guardTicks = 0;
      player.parryActive = false;
    }

    return { hit: true, parried: false, blocked: true, damageDealt: residualDamage };
  }

  // 4. Impacto directo a Kratos desprotegido
  const damageDealt = baseDamage;
  player.hp = Math.max(0, player.hp - damageDealt);

  // Interrupción de ataques y acciones
  player.attackPhase = 'none';
  player.attackMove = 'none';
  player.attackTicks = 0;
  player.attackHits = [];
  player.attackBufferAction = null;
  player.attackBufferTicks = 0;

  // Tiempos de hitstun e invulnerabilidad post-daño
  player.hitstunTicks = CONFIG.player.damage.hurtHitstunTicks;
  player.hurtInvulTicks = CONFIG.player.damage.hurtInvulTicks;

  // Retroceso horizontal opuesto al atacante
  const knockbackDir = attacker.x < player.x ? 1 : -1;
  player.vx = knockbackDir * CONFIG.player.damage.knockbackVx;

  if (player.hp === 0) {
    player.isDead = true;
    player.vx = 0;
  }

  return { hit: true, parried: false, blocked: false, damageDealt };
}
