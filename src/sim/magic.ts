import { CONFIG } from '../config';
import type { EntityState } from './types';

export interface MagicHitResult {
  hitTargets: string[];
  totalDamage: number;
  kills: string[];
}

export function isCastingMagic(entity: EntityState): boolean {
  return entity.magicPhase !== 'none';
}

export function startMagic(player: EntityState): boolean {
  const cfg = CONFIG.player.magic.poseidonsRage;
  if (player.isDead || player.hitstunTicks > 0 || player.magicPhase !== 'none') {
    return false;
  }
  if (player.mp < cfg.cost) {
    return false;
  }

  // Deduce maná de inmediato
  player.mp -= cfg.cost;
  player.magicPhase = 'startup';
  player.magicTicks = 0;
  player.vx = 0;
  player.vy = 0;

  // Cancela rodada o guardia
  player.rollPhase = 'none';
  player.rollTicks = 0;
  player.guardPhase = 'none';
  player.guardTicks = 0;
  player.parryActive = false;

  // Super-armadura e invulnerabilidad garantizada durante el conjuro completo
  const totalSpellTicks = cfg.startupTicks + cfg.activeTicks + cfg.recoveryTicks;
  player.invulTicks = Math.max(player.invulTicks, totalSpellTicks);

  return true;
}

/**
 * Simulación y ejecución de la magia 'Ira de Poseidón' (Poseidon's Rage):
 * - Startup (8 ticks): hincado de rodillas y anclaje de espadas.
 * - Active (40 ticks): tormenta eléctrica celestial multi-hit cada 8 ticks en radio de 90 px.
 * - Recovery (12 ticks): retirada de espadas y retorno al control normal.
 */
export function stepMagic(
  player: EntityState,
  wantsMagicEdge: boolean,
  targets: readonly EntityState[],
  onEnemyKilled?: (enemy: EntityState) => void,
): MagicHitResult {
  const result: MagicHitResult = {
    hitTargets: [],
    totalDamage: 0,
    kills: [],
  };

  const cfg = CONFIG.player.magic.poseidonsRage;

  // 1. Intento de invocación
  if (player.magicPhase === 'none') {
    if (wantsMagicEdge) {
      startMagic(player);
    }
    return result;
  }

  // Mantener super-armadura e inmovilidad mientras la magia esté activa
  if (player.invulTicks < 2) {
    player.invulTicks = 2;
  }
  player.vx = 0;

  // 2. Fase de Startup (8 ticks)
  if (player.magicPhase === 'startup') {
    player.magicTicks += 1;
    if (player.magicTicks >= cfg.startupTicks) {
      player.magicPhase = 'active';
      player.magicTicks = 0;
    }
    return result;
  }

  // 3. Fase Activa (40 ticks, multi-hit cada 8 ticks en ticks 0, 8, 16, 24, 32)
  if (player.magicPhase === 'active') {
    const isHitTick = player.magicTicks % cfg.hitIntervalTicks === 0;
    if (isHitTick) {
      const radiusSq = cfg.radius * cfg.radius;
      for (let i = 0; i < targets.length; i += 1) {
        const target = targets[i];
        if (target.isDead || target.aiState === 'death' || target.aiState === 'hydra_defeat') {
          continue;
        }

        const targetEffectiveX = target.kind === 'hydra'
          ? Math.min(target.x, Math.max(target.x - 100, player.x))
          : target.x;
        const dx = targetEffectiveX - player.x;
        const dy = (target.y - 18) - (player.y - 20);
        const distSq = dx * dx + dy * dy;

        if (distSq <= radiusSq) {
          result.hitTargets.push(target.id);
          target.hp = Math.max(0, target.hp - cfg.damagePerHit);
          result.totalDamage += cfg.damagePerHit;
          target.hitstunTicks = Math.max(target.hitstunTicks, cfg.stunTicksPerHit);
          if (target.kind !== 'hydra') {
            target.vx = 0;
          }

          if (target.hp === 0) {
            target.aiState = target.kind === 'hydra' ? 'hydra_defeat' : 'death';
            target.aiTicks = 0;
            target.isDead = true;
            result.kills.push(target.id);
            if (onEnemyKilled) {
              onEnemyKilled(target);
            }
          }
        }
      }
    }

    player.magicTicks += 1;
    if (player.magicTicks >= cfg.activeTicks) {
      player.magicPhase = 'recovery';
      player.magicTicks = 0;
    }
    return result;
  }

  // 4. Fase de Recovery (12 ticks)
  if (player.magicPhase === 'recovery') {
    player.magicTicks += 1;
    if (player.magicTicks >= cfg.recoveryTicks) {
      player.magicPhase = 'none';
      player.magicTicks = 0;
    }
    return result;
  }

  return result;
}
