import { CONFIG } from '../config';
import { damageEnemy } from './damage';
import type { EntityState } from './types';

/** Shared wave front: presentation and damage must advance at the same rate. */
export function magicWaveRadiusAtTick(tick: number): number {
  const spell = CONFIG.player.magic.poseidonsRage;
  return ((tick + 1) * spell.radius) / spell.activeTicks;
}

/** Full height passed to Phaser's strokeEllipse, whose width/height are diameters. */
export function magicWaveHeightPx(radius: number): number {
  const cfg = CONFIG.vfx.magicWave;
  return cfg.waveHeightPx + radius * cfg.waveHeightGrowthPerPx;
}

/** Half-height of the damage ellipse, matching the drawn ground wave exactly. */
export function magicWaveHalfHeightPx(radius: number): number {
  return magicWaveHeightPx(radius) / 2;
}

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
  player.magicHitIds = [];
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
 * - Active (40 ticks): onda eléctrica en el suelo que se expande hasta 90 px y
 *   golpea a cada enemigo una vez cuando el frente de onda lo alcanza.
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

  // 3. Fase Activa: el círculo 3D es una onda en el suelo. En 2D su frente
  // avanza desde los pies de Kratos hacia ambos lados y golpea a cada enemigo
  // una sola vez, cuando la onda lo alcanza.
  if (player.magicPhase === 'active') {
    const alreadyHit = player.magicHitIds ?? (player.magicHitIds = []);
    const waveRadius = magicWaveRadiusAtTick(player.magicTicks);
    const waveHalfHeight = magicWaveHalfHeightPx(waveRadius);

    for (let i = 0; i < targets.length; i += 1) {
      const target = targets[i];
      if (target.isDead || target.aiState === 'death' || target.aiState === 'hydra_defeat') {
        continue;
      }
      if (alreadyHit.includes(target.id)) {
        continue;
      }

      const targetEffectiveX = target.kind === 'hydra'
        ? Math.min(target.x, Math.max(target.x - 100, player.x))
        : target.x;
      const dx = targetEffectiveX - player.x;
      // The wave is drawn at the feet (groundY = player.y), so the damage
      // ellipse must be centred there too instead of at the sprite torso.
      const dy = target.y - player.y;
      const inWave =
        (dx / waveRadius) ** 2 + (dy / waveHalfHeight) ** 2 <= 1;

      if (inWave) {
        alreadyHit.push(target.id);
        result.hitTargets.push(target.id);
        result.totalDamage += cfg.damagePerHit;
        if (damageEnemy(target, cfg.damagePerHit, cfg.stunTicksPerHit)) {
          result.kills.push(target.id);
          if (onEnemyKilled) {
            onEnemyKilled(target);
          }
        } else if (
          target.kind !== 'hydra' &&
          target.aiState !== 'knockdown' &&
          target.aiState !== 'get_up' &&
          target.aiState !== 'juggle'
        ) {
          // Like a blade hit, the shock interrupts the AI; hitstunTicks alone
          // is only a countdown and would leave the enemy free to attack.
          target.aiState = 'hitstun';
          target.aiTicks = 0;
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
