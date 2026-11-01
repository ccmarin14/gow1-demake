import { CONFIG } from '../config';
import type { Platform } from './scenarios';
import type { ArrowState, EntityState } from './types';

/**
 * Simulación determinista de la IA del Arquero No-Muerto (Undead Archer).
 *
 * Estados de la máquina determinista:
 * - `idle`: reposo si Kratos está más allá de `aggroRange` (260 px).
 * - `reposition`: gestión activa de distancia (kiteo):
 *   - Si dist < 110 px: retrocede a 50 px/s alejándose de Kratos.
 *   - Si dist > 180 px: avanza a 40 px/s acercándose a Kratos.
 *   - Si dist en [110..180] px y `attackCooldownTicks === 0`: transiciona a `aim`.
 * - `aim`: tensado y anticipación (telegraph visual) durante 24 ticks (400 ms)
 *   con velocidad 0 y ojo amatista resplandeciente. Si Kratos lo golpea aquí,
 *   se cancela el tiro inmediatamente a `hitstun`.
 * - `shoot`: suelta explosiva de la cuerda (8 ticks). Dispara una flecha en el tick 0.
 * - `recover`: reposo post-disparo (24 ticks) antes de volver a reposicionarse.
 * - `hitstun`: aturdimiento por Cuchillas del Caos (16 ticks).
 * - `juggle`: suspensión aérea inducida por Ascensión (transiciona a hitstun al aterrizar).
 * - `death`: desmoronamiento cadavérico sobre la cubierta y eclosión de orbes.
 */
export function stepArcher(
  enemy: EntityState,
  player: EntityState | undefined,
  _platforms: readonly Platform[],
  _dt: number,
  spawnArrow: (x: number, y: number, vx: number) => void,
): void {
  if (enemy.kind !== 'archer') {
    return;
  }

  // Descuento de enfriamiento de ataque
  if (enemy.attackCooldownTicks > 0) {
    enemy.attackCooldownTicks -= 1;
  }

  // Estado de muerte: permanece inerte en la cubierta
  if (enemy.aiState === 'death') {
    enemy.vx = 0;
    return;
  }

  // Estado de suspensión aérea (juggle): Kratos lo elevó con Ascensión o golpe aéreo
  if (enemy.aiState === 'juggle') {
    enemy.aiTicks += 1;
    if (enemy.grounded && enemy.vy >= 0) {
      enemy.aiState = 'hitstun';
      enemy.aiTicks = 0;
      enemy.hitstunTicks = 12;
      enemy.vx = 0;
    }
    return;
  }

  // Estado de impacto terrestre (hitstun)
  if (enemy.aiState === 'hitstun') {
    enemy.aiTicks += 1;
    if (enemy.hitstunTicks <= 0) {
      enemy.aiState = 'reposition';
      enemy.aiTicks = 0;
      enemy.vx = 0;
    }
    return;
  }

  // Si no hay jugador o el jugador está inhabilitado
  if (!player || player.isDead) {
    enemy.vx = 0;
    enemy.aiState = 'idle';
    return;
  }

  const dx = player.x - enemy.x;
  const dist = Math.abs(dx);
  const dirToPlayer: -1 | 1 = dx >= 0 ? 1 : -1;

  // Estado de tensado y anticipación (aim / telegraph de 24 ticks)
  if (enemy.aiState === 'aim') {
    enemy.vx = 0;
    enemy.facing = dirToPlayer;
    enemy.aiTicks += 1;

    if (enemy.aiTicks >= CONFIG.enemy.archer.aimTicks) {
      enemy.aiState = 'shoot';
      enemy.aiTicks = 0;
      const arrowX = enemy.x + enemy.facing * 16;
      const arrowY = enemy.y - 24;
      const arrowVx = enemy.facing * CONFIG.enemy.archer.arrowSpeed;
      spawnArrow(arrowX, arrowY, arrowVx);
    }
    return;
  }

  // Estado de suelta explosiva (shoot de 8 ticks)
  if (enemy.aiState === 'shoot') {
    enemy.vx = 0;
    enemy.aiTicks += 1;
    if (enemy.aiTicks >= CONFIG.enemy.archer.shootTicks) {
      enemy.aiState = 'recover';
      enemy.aiTicks = 0;
      enemy.attackCooldownTicks = CONFIG.enemy.archer.cooldownTicks;
    }
    return;
  }

  // Estado de recuperación post-disparo (recover de 24 ticks)
  if (enemy.aiState === 'recover') {
    enemy.vx = 0;
    enemy.facing = dirToPlayer;
    enemy.aiTicks += 1;
    if (enemy.aiTicks >= CONFIG.enemy.archer.recoveryTicks) {
      enemy.aiState = 'reposition';
      enemy.aiTicks = 0;
    }
    return;
  }

  // Estado de reposo (idle)
  if (enemy.aiState === 'idle') {
    if (dist <= CONFIG.enemy.archer.aggroRange) {
      enemy.aiState = 'reposition';
      enemy.aiTicks = 0;
      enemy.facing = dirToPlayer;
    } else {
      enemy.vx = 0;
    }
    return;
  }

  // Estado de reposicionamiento y distanciamiento (reposition / kite)
  if (enemy.aiState === 'reposition') {
    enemy.facing = dirToPlayer;
    enemy.aiTicks += 1;

    if (dist > CONFIG.enemy.archer.aggroRange) {
      enemy.aiState = 'idle';
      enemy.aiTicks = 0;
      enemy.vx = 0;
      return;
    }

    const canShoot = enemy.attackCooldownTicks <= 0;
    const inPreferredRange =
      dist >= CONFIG.enemy.archer.preferredDistanceMin &&
      dist <= CONFIG.enemy.archer.preferredDistanceMax;

    // Si está acorralado contra los extremos del escenario mientras intenta retroceder
    const isCornered =
      (enemy.facing === 1 && enemy.x <= CONFIG.combat.target.minX + 10) ||
      (enemy.facing === -1 && enemy.x >= CONFIG.combat.target.maxX - 10);

    if (canShoot && (inPreferredRange || (isCornered && dist < CONFIG.enemy.archer.preferredDistanceMin))) {
      enemy.aiState = 'aim';
      enemy.aiTicks = 0;
      enemy.vx = 0;
      return;
    }

    if (dist < CONFIG.enemy.archer.preferredDistanceMin) {
      // Demasiado cerca -> retroceder
      enemy.vx = -dirToPlayer * CONFIG.enemy.archer.retreatSpeed;
    } else if (dist > CONFIG.enemy.archer.preferredDistanceMax) {
      // Demasiado lejos -> avanzar
      enemy.vx = dirToPlayer * CONFIG.enemy.archer.advanceSpeed;
    } else {
      // En rango preferido pero esperando cooldown
      enemy.vx = 0;
      if (canShoot) {
        enemy.aiState = 'aim';
        enemy.aiTicks = 0;
      }
    }
    return;
  }
}

/**
 * Simulación y resolución física y de combate de las flechas activas:
 * - Movimiento balístico horizontal a 280 px/s.
 * - Evasión por rodada o invulnerabilidad post-daño (flecha atraviesa / se desactiva sin daño).
 * - Reflejo por Parry: invierte velocidad (x1.5), se vuelve proyectil aliado.
 * - Guardia activa: absorbe el impacto con 85% de mitigación (1-2 HP residual).
 * - Impacto directo a Kratos: 10 de daño, knockback y aturdimiento.
 * - Impacto de flecha reflejada contra agresor: 20 de daño y 36 ticks de aturdimiento.
 */
export function stepArrows(
  arrows: ArrowState[],
  player: EntityState | undefined,
  targets: readonly EntityState[],
  dt: number,
): void {
  for (let i = 0; i < arrows.length; i += 1) {
    const arrow = arrows[i];
    if (!arrow.active) continue;

    arrow.x += arrow.vx * dt;
    arrow.y += arrow.vy * dt;
    arrow.ageTicks += 1;

    // Límite de vida útil
    if (arrow.ageTicks >= CONFIG.enemy.archer.arrowLifetimeTicks) {
      arrow.active = false;
      continue;
    }

    // Límites de pantalla
    if (arrow.x < -20 || arrow.x > 500) {
      arrow.active = false;
      continue;
    }

    // 1. Flecha enemiga contra Kratos (no reflejada)
    if (!arrow.reflected && player && !player.isDead) {
      const hitX = Math.abs(arrow.x - player.x) <= 14;
      const hitY = Math.abs(arrow.y - (player.y - 26)) <= 24;

      if (hitX && hitY) {
        // Evasión por rodada (i-frames) o invulnerabilidad post-daño
        if (player.invulTicks > 0 || player.hurtInvulTicks > 0) {
          arrow.active = false;
          continue;
        }

        // Desvío perfecto (Parry)
        if (player.guardPhase === 'active' && player.parryActive) {
          arrow.reflected = true;
          arrow.vx = -arrow.vx * CONFIG.enemy.archer.parryReflectSpeedMult;
          arrow.x += arrow.vx * dt; // Paso inmediato en la nueva dirección
          continue;
        }

        // Guardia activa estándar (mitigación del 85%)
        if (player.guardPhase === 'active') {
          const mitigation = CONFIG.player.damage.guardMitigationRatio;
          const residualDamage = Math.max(1, Math.round(CONFIG.enemy.archer.arrowDamage * (1 - mitigation)));
          player.hp = Math.max(0, player.hp - residualDamage);
          player.vx = player.facing * -20;
          arrow.active = false;

          if (player.hp === 0) {
            player.isDead = true;
            player.vx = 0;
            player.guardPhase = 'none';
            player.guardTicks = 0;
            player.parryActive = false;
          }
          continue;
        }

        // Impacto directo a Kratos desprotegido
        const damageDealt = CONFIG.enemy.archer.arrowDamage;
        player.hp = Math.max(0, player.hp - damageDealt);

        player.hitstunTicks = CONFIG.player.damage.hurtHitstunTicks;
        player.hurtInvulTicks = CONFIG.player.damage.hurtInvulTicks;
        player.vx = (arrow.vx > 0 ? 1 : -1) * CONFIG.player.damage.knockbackVx;
        arrow.active = false;

        if (player.hp === 0) {
          player.isDead = true;
          player.vx = 0;
        }
        continue;
      }
    }

    // 2. Flecha reflejada por Parry contra los enemigos
    if (arrow.reflected) {
      for (let j = 0; j < targets.length; j += 1) {
        const target = targets[j];
        if (target.aiState === 'death') continue;

        const hitX = Math.abs(arrow.x - target.x) <= 16;
        const hitY = Math.abs(arrow.y - (target.y - 18)) <= 24;

        if (hitX && hitY) {
          const reflectedDamage = 20;
          target.hp = Math.max(0, target.hp - reflectedDamage);
          target.vx = Math.sign(arrow.vx) * 80;
          target.hitstunTicks = CONFIG.enemy.archer.parryStunTicks;

          if (target.hp <= 0) {
            target.aiState = 'death';
            target.aiTicks = 0;
            target.vx = Math.sign(arrow.vx) * 35;
          } else {
            target.aiState = 'hitstun';
            target.aiTicks = 0;
          }

          arrow.active = false;
          break;
        }
      }
    }
  }
}
