import { CONFIG } from '../config';
import { applyDamageToPlayer } from './damage';
import type { Platform } from './scenarios';
import type { EntityState } from './types';

/**
 * Simulación de la IA y conducta del Legionario No-Muerto (God of War 1 PS2 lore).
 *
 * Máquina de estados determinista gobernada por ticks fijos:
 * - `idle`: en reposo cuando el jugador está fuera del alcance de detección (`aggroRange`).
 * - `approach`: persecución a pie avanzando hacia Kratos (`speed` = 65 px/s).
 * - `windup`: anticipación / telegraph visual con espada levantada y ojos llameantes (24 ticks = 400 ms).
 *   Si Kratos lo golpea durante el `windup`, se interrumpe inmediatamente a `hitstun`.
 * - `slash`: tajo agresivo hacia adelante (8 ticks). Puede ser esquivado con i-frames,
 *   desviado con *Parry* (generando aturdimiento largo de 32 ticks), o bloqueado con guardia.
 * - `recover`: recuperación post-ataque (16 ticks) antes de reanudar persecución.
 * - `hitstun`: aturdimiento por impacto de las Cuchillas del Caos.
 * - `juggle`: suspensión aérea inducida por Ascensión o remate sísmico.
 * - `death`: desmoronamiento cadavérico sobre la cubierta tras perder toda la vida (`hp <= 0`).
 */
export function stepLegionnaire(
  enemy: EntityState,
  player: EntityState | undefined,
  _platforms: readonly Platform[],
  _dt: number,
): void {
  if (enemy.kind !== 'legionnaire') {
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
    // Si aterriza en el suelo, colisiona y transiciona a hitstun con aturdimiento de caída
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
      enemy.aiState = 'approach';
      enemy.aiTicks = 0;
      enemy.vx = 0;
    }
    return;
  }

  // Si no hay jugador o el jugador está inhabilitado
  if (!player) {
    enemy.vx = 0;
    enemy.aiState = 'idle';
    return;
  }

  const dx = player.x - enemy.x;
  const dist = Math.abs(dx);
  const dirToPlayer: -1 | 1 = dx >= 0 ? 1 : -1;

  // Estado de anticipación (windup / telegraph)
  if (enemy.aiState === 'windup') {
    enemy.vx = 0;
    enemy.facing = dirToPlayer;
    enemy.aiTicks += 1;

    if (enemy.aiTicks >= CONFIG.enemy.legionnaire.windupTicks) {
      enemy.aiState = 'slash';
      enemy.aiTicks = 0;
      enemy.attackHits = [];
    }
    return;
  }

  // Estado de tajo frontal (slash)
  if (enemy.aiState === 'slash') {
    enemy.vx = 0;
    enemy.aiTicks += 1;

    // Ventana activa de impacto (ticks 2 a 5 del tajo)
    if (enemy.aiTicks >= 2 && enemy.aiTicks <= 5 && !enemy.attackHits.includes(player.id)) {
      const slashReach = CONFIG.enemy.legionnaire.slashReach;
      const inReach =
        (enemy.facing === 1 && dx >= 0 && dx <= slashReach) ||
        (enemy.facing === -1 && dx <= 0 && dx >= -slashReach);
      const inVerticalReach = Math.abs(player.y - enemy.y) <= 32;

      if (inReach && inVerticalReach) {
        enemy.attackHits.push(player.id);
        applyDamageToPlayer(player, enemy, CONFIG.enemy.legionnaire.slashDamage);
      }
    }

    if (enemy.aiTicks >= CONFIG.enemy.legionnaire.activeSlashTicks) {
      enemy.aiState = 'recover';
      enemy.aiTicks = 0;
    }
    return;
  }

  // Estado de recuperación tras el tajo (recover)
  if (enemy.aiState === 'recover') {
    enemy.vx = 0;
    enemy.aiTicks += 1;

    if (enemy.aiTicks >= CONFIG.enemy.legionnaire.recoveryTicks) {
      enemy.aiState = 'approach';
      enemy.aiTicks = 0;
      enemy.attackCooldownTicks = CONFIG.enemy.legionnaire.cooldownTicks;
    }
    return;
  }

  // Estado de reposo o patrulla
  if (enemy.aiState === 'idle' || enemy.aiState === 'patrol') {
    if (dist <= CONFIG.enemy.legionnaire.aggroRange) {
      enemy.aiState = 'approach';
      enemy.aiTicks = 0;
      enemy.facing = dirToPlayer;
    } else {
      enemy.vx = 0;
    }
    return;
  }

  // Estado de persecución (approach)
  if (enemy.aiState === 'approach') {
    enemy.facing = dirToPlayer;

    if (dist > CONFIG.enemy.legionnaire.aggroRange) {
      enemy.aiState = 'idle';
      enemy.aiTicks = 0;
      enemy.vx = 0;
    } else if (dist <= CONFIG.enemy.legionnaire.attackRange) {
      // En rango de ataque
      if (enemy.attackCooldownTicks === 0) {
        enemy.aiState = 'windup';
        enemy.aiTicks = 0;
        enemy.vx = 0;
      } else {
        // Enfriamiento activo: espera en guardia
        enemy.vx = 0;
      }
    } else {
      // Desplazamiento activo hacia Kratos
      enemy.vx = enemy.facing * CONFIG.enemy.legionnaire.speed;
      enemy.aiTicks += 1;
    }
  }
}
