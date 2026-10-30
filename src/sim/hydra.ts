import { CONFIG } from '../config';
import type { EntityState } from './types';

export interface HydraStepResult {
  slamImpact: boolean;
  damageDealt: number;
  sweepImpact: boolean;
  defeated: boolean;
  orbsSpawned: boolean;
}

/**
 * Fábrica de entidad determinista para La Hidra de Lerna.
 */
export function createHydraState(
  id: string = 'hydra-boss',
  x: number = 360,
  y: number = 262,
  facing: -1 | 1 = -1,
): EntityState {
  const maxHp = CONFIG.enemy.hydra.maxHp;
  return {
    id,
    kind: 'hydra',
    x,
    y,
    vx: 0,
    vy: 0,
    facing,
    grounded: true,
    coyoteTicks: 0,
    jumpBufferTicks: 0,
    jumpsUsed: 0,
    attackPhase: 'none',
    attackTicks: 0,
    attackHits: [],
    attackChain: 0, // 0 = ciclo de slam, 1 = ciclo de sweep
    attackMove: 'none',
    attackBufferAction: null,
    attackBufferTicks: 0,
    heavyHoldTicks: maxHp, // Registra la salud en el último stagger (300)
    hitstopTicks: 0,
    hitstunTicks: 0,
    groundImpactTicks: 0,
    groundImpactX: 0,
    groundImpactY: 0,
    rollPhase: 'none',
    rollTicks: 0,
    invulTicks: 0,
    guardPhase: 'none',
    guardTicks: 0,
    parryActive: false,
    landingTicks: 0,
    aiState: 'hydra_idle',
    aiTicks: 0,
    hp: maxHp,
    maxHp,
    mp: 0,
    maxMp: 0,
    magicPhase: 'none',
    magicTicks: 0,
    dropThroughTicks: 0,
    attackCooldownTicks: 0,
    hurtInvulTicks: 0,
    isDead: false,
    redOrbs: 0,
    gorgonEyes: 0,
    gorgonUpgrades: 0,
    phoenixFeathers: 0,
    phoenixUpgrades: 0,
    weaponLevel: 1,
  };
}

/**
 * Simulación y lógica determinista del combate de La Hidra de Lerna a 60 Hz.
 */
export function stepHydra(
  hydra: EntityState,
  player: EntityState | undefined,
  _dt: number,
): HydraStepResult {
  const result: HydraStepResult = {
    slamImpact: false,
    damageDealt: 0,
    sweepImpact: false,
    defeated: false,
    orbsSpawned: false,
  };

  const cfg = CONFIG.enemy.hydra;

  // 1. Comprobar derrota terminal
  if (hydra.hp <= 0 || hydra.aiState === 'hydra_defeat') {
    if (hydra.aiState !== 'hydra_defeat') {
      hydra.aiState = 'hydra_defeat';
      hydra.aiTicks = 0;
      hydra.isDead = true;
    }
    hydra.aiTicks += 1;
    result.defeated = true;
    if (hydra.aiTicks === 1) {
      result.orbsSpawned = true;
    }
    return result;
  }

  // 2. Comprobar umbral de stagger acumulado (cada 100 HP perdidos)
  const hpLostSinceLastStagger = hydra.heavyHoldTicks - hydra.hp;
  if (
    hpLostSinceLastStagger >= cfg.staggerThresholdHp &&
    hydra.aiState !== 'hydra_stagger' &&
    hydra.aiState !== 'hydra_slam' &&
    hydra.aiState !== 'hydra_stuck'
  ) {
    hydra.heavyHoldTicks = hydra.hp;
    hydra.aiState = 'hydra_stagger';
    hydra.aiTicks = 0;
    return result;
  }

  hydra.aiTicks += 1;

  // 3. Máquina de estados
  switch (hydra.aiState) {
    case 'hydra_idle': {
      // 60 ticks de observación en el mar
      if (hydra.aiTicks >= 60) {
        hydra.aiState = 'hydra_roar';
        hydra.aiTicks = 0;
      }
      break;
    }

    case 'hydra_roar': {
      // 30 ticks de telegraph visual con fauces abiertas y garganta incandescente
      if (hydra.aiTicks >= cfg.telegraphTicks) {
        if (hydra.attackChain === 0) {
          hydra.aiState = 'hydra_slam';
          hydra.aiTicks = 0;
        } else {
          hydra.aiState = 'hydra_sweep';
          hydra.aiTicks = 0;
        }
      }
      break;
    }

    case 'hydra_slam': {
      // Impacto en el tick 8
      if (hydra.aiTicks === 8) {
        result.slamImpact = true;
        const slamX = hydra.x - 90; // Zona de impacto de la cabeza sobre la cubierta
        const radius = cfg.slamImpactRadius;

        if (player && !player.isDead) {
          const inSlamZone = Math.abs(player.x - slamX) <= radius;
          if (inSlamZone) {
            // Cascada defensiva: rodada / invulnerabilidad -> 0 daño
            const isInvulnerable =
              player.rollPhase !== 'none' ||
              player.invulTicks > 0 ||
              player.hurtInvulTicks > 0;

            if (isInvulnerable) {
              // Evasión limpia: 0 daño
            } else if (player.guardPhase !== 'none') {
              // Guardia: 85% mitigación
              const damage = Math.round(cfg.slamDamage * 0.15);
              player.hp = Math.max(0, player.hp - damage);
              player.hurtInvulTicks = 30;
              player.hitstunTicks = 12;
              player.vx = -80 * player.facing;
              result.damageDealt = damage;
              if (player.hp === 0) {
                player.isDead = true;
              }
            } else {
              // Desprotegido: 25 de daño masivo
              const damage = cfg.slamDamage;
              player.hp = Math.max(0, player.hp - damage);
              player.hurtInvulTicks = 45;
              player.hitstunTicks = 24;
              player.vx = -140 * player.facing;
              player.vy = -120;
              player.grounded = false;
              result.damageDealt = damage;
              if (player.hp === 0) {
                player.isDead = true;
              }
            }
          }
        }
      }

      // Finaliza el picado a los 12 ticks y clava los colmillos en cubierta
      if (hydra.aiTicks >= 12) {
        hydra.aiState = 'hydra_stuck';
        hydra.aiTicks = 0;
      }
      break;
    }

    case 'hydra_stuck': {
      // 45 ticks con los colmillos atascados en las tablas en y=111, vulnerable a combos
      if (hydra.aiTicks >= cfg.stuckTicks) {
        hydra.attackChain = 1; // Próximo ataque: sweep
        hydra.aiState = 'hydra_idle';
        hydra.aiTicks = 0;
      }
      break;
    }

    case 'hydra_sweep': {
      // Barrido horizontal rasante a ras de suelo en tick 12
      if (hydra.aiTicks === 12) {
        result.sweepImpact = true;
        const sweepMinX = hydra.x - 130;
        const sweepMaxX = hydra.x - 15;

        if (player && !player.isDead) {
          const inSweepX = player.x >= sweepMinX && player.x <= sweepMaxX;
          if (inSweepX) {
            // Si Kratos está en el aire, esquiva limpiamente
            const isAirborne = !player.grounded || player.vy !== 0 || player.y < 235;
            const isInvulnerable =
              player.rollPhase !== 'none' ||
              player.invulTicks > 0 ||
              player.hurtInvulTicks > 0;

            if (isAirborne || isInvulnerable) {
              // Evasión saltando o rodando
            } else if (player.guardPhase !== 'none') {
              const damage = Math.round(cfg.sweepDamage * 0.15);
              player.hp = Math.max(0, player.hp - damage);
              player.hurtInvulTicks = 30;
              player.hitstunTicks = 12;
              player.vx = -80;
              result.damageDealt = damage;
              if (player.hp === 0) {
                player.isDead = true;
              }
            } else {
              const damage = cfg.sweepDamage;
              player.hp = Math.max(0, player.hp - damage);
              player.hurtInvulTicks = 45;
              player.hitstunTicks = 20;
              player.vx = -120;
              result.damageDealt = damage;
              if (player.hp === 0) {
                player.isDead = true;
              }
            }
          }
        }
      }

      if (hydra.aiTicks >= 30) {
        hydra.attackChain = 0; // Próximo ataque: slam
        hydra.aiState = 'hydra_idle';
        hydra.aiTicks = 0;
      }
      break;
    }

    case 'hydra_hurt': {
      if (hydra.aiTicks >= 15) {
        hydra.aiState = 'hydra_idle';
        hydra.aiTicks = 0;
      }
      break;
    }

    case 'hydra_stagger': {
      // 90 ticks (1.5s) de aturdimiento crítico colapsada sobre cubierta
      if (hydra.aiTicks >= cfg.staggerDurationTicks) {
        hydra.aiState = 'hydra_idle';
        hydra.aiTicks = 0;
      }
      break;
    }

    default:
      break;
  }

  return result;
}
