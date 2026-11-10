import { CONFIG } from '../config';
import type { EntityState } from './types';

export interface PlayerDamageResult {
  hit: boolean;
  parried: boolean;
  blocked: boolean;
  guardBroken?: boolean;
  damageDealt: number;
}

export interface PlayerDamageOptions {
  /** If true, standard passive guard is broken while perfect parry still deflects. */
  breaksGuard?: boolean;
}

/**
 * Resuelve el impacto de un ataque enemigo sobre Kratos:
 * - Rodada (invulTicks > 0) o post-daño (hurtInvulTicks > 0): evasión total (0 daño).
 * - Desvío Parry (parryActive === true): 0 daño, 0 retroceso, y el enemigo sufre aturdimiento largo.
 * - Guardia activa (guardPhase === 'active'): si el ataque rompe guardia (`breaksGuard`),
 *   la guardia se quiebra, Kratos entra en desestabilización e inflige daño completo.
 *   Si es golpe normal, mitigación del 85% y guardia intacta.
 * - Desprotegido: 100% daño, interrupción de ataque, retroceso horizontal y 45 ticks de invulnerabilidad.
 * - Vida 0: transición a `isDead = true` y detención total.
 */
export function applyDamageToPlayer(
  player: EntityState,
  attacker: EntityState,
  baseDamage: number,
  options: PlayerDamageOptions = {},
): PlayerDamageResult {
  if (player.isDead) {
    return { hit: false, parried: false, blocked: false, damageDealt: 0 };
  }

  // 1. Evasión por rodada (i-frames) o invulnerabilidad post-daño
  if (player.invulTicks > 0 || player.hurtInvulTicks > 0) {
    return { hit: false, parried: false, blocked: false, damageDealt: 0 };
  }

  // 2. Desvío perfecto (Parry: desvía tanto golpes comunes como ataques pesados)
  if (player.guardPhase === 'active' && player.parryActive) {
    attacker.aiState = 'hitstun';
    attacker.aiTicks = 0;
    attacker.hitstunTicks = CONFIG.enemy.legionnaire.parryStunTicks;
    attacker.vx = -attacker.facing * 120;
    attacker.attackCooldownTicks = CONFIG.enemy.legionnaire.cooldownTicks;

    return { hit: false, parried: true, blocked: false, damageDealt: 0 };
  }

  // 3. Guardia estándar sostenida
  if (player.guardPhase === 'active') {
    if (options.breaksGuard) {
      // Rompe la guardia pasiva: cancela la postura, desestabiliza a Kratos y aplica daño completo
      player.guardPhase = 'none';
      player.guardTicks = 0;
      player.parryActive = false;
      const damageDealt = baseDamage;
      player.hp = Math.max(0, player.hp - damageDealt);
      player.hitstunTicks = CONFIG.player.damage.hurtHitstunTicks;
      player.hurtInvulTicks = CONFIG.player.damage.hurtInvulTicks;
      const knockbackDir = attacker.x < player.x ? 1 : -1;
      player.vx = knockbackDir * CONFIG.player.damage.knockbackVx;

      if (player.hp === 0) {
        player.isDead = true;
        player.vx = 0;
      }
      return { hit: true, parried: false, blocked: false, guardBroken: true, damageDealt };
    }

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

/**
 * Damages an enemy hit by Kratos (magic or blades): subtracts `damage`, keeps
 * the longer hit reaction, stops foot soldiers in place and, at 0 HP, marks
 * the death (`death`, or `hydra_defeat` for the hydra). Returns whether the
 * hit killed it.
 */
export function damageEnemy(target: EntityState, damage: number, stunTicks: number): boolean {
  target.hp = Math.max(0, target.hp - damage);
  target.hitstunTicks = Math.max(target.hitstunTicks, stunTicks);
  if (target.kind !== 'hydra') {
    target.vx = 0;
  }
  if (target.hp !== 0) {
    return false;
  }
  target.aiState = target.kind === 'hydra' ? 'hydra_defeat' : 'death';
  target.aiTicks = 0;
  target.isDead = true;
  return true;
}
