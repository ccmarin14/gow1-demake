import { CONFIG } from '../config';
import type { EntityState, OrbState } from './types';

export interface OrbStepResult {
  healed: number;
  redCollected: number;
}

/**
 * Genera una colección determinista de orbes verdes y rojos que eclosionan de un enemigo derrotado.
 * Los impulsos iniciales dispersan los orbes balísticamente en abanico ascendente.
 */
export function spawnOrbsFromDeath(
  sourceX: number,
  sourceY: number,
  countRed: number,
  countGreen: number,
  startIdIndex: number = 0,
): OrbState[] {
  const orbs: OrbState[] = [];
  const burstVy = CONFIG.economy.orbs.burstImpulseVy;

  let idCounter = startIdIndex;

  // 1. Orbes verdes de curación (lanzamiento central superior)
  const greenSpread = [0, -15, 15];
  for (let i = 0; i < countGreen; i += 1) {
    const vx = greenSpread[i % greenSpread.length];
    const vy = burstVy - 15 - (i % 2) * 10;
    orbs.push({
      id: `orb-green-${idCounter++}`,
      type: 'green',
      x: sourceX,
      y: sourceY,
      vx,
      vy,
      value: CONFIG.economy.orbs.greenOrbHeal,
      ageTicks: 0,
      absorbed: false,
    });
  }

  // 2. Orbes rojos de experiencia / economía (abanico balístico simétrico)
  const redSpread = [-36, 36, -20, 20, -48, 48];
  for (let i = 0; i < countRed; i += 1) {
    const vx = redSpread[i % redSpread.length];
    const vy = burstVy + ((i % 3) * 12 - 12);
    orbs.push({
      id: `orb-red-${idCounter++}`,
      type: 'red',
      x: sourceX,
      y: sourceY,
      vx,
      vy,
      value: CONFIG.economy.orbs.redOrbValue,
      ageTicks: 0,
      absorbed: false,
    });
  }

  return orbs;
}

/**
 * Simulación física determinista de orbes:
 * - Primeros ticks: inercia balística de dispersión hacia arriba con leve gravedad.
 * - Tras la eclosión inicial (ageTicks > 4): atracción magnética continua hacia el pecho de Kratos (x, y - 26).
 * - A distancia <= 12 px: absorción inmediata en el héroe (curación o acumulación de orbes rojos).
 */
export function stepOrbs(
  orbs: OrbState[],
  player: EntityState | undefined,
  dt: number,
): OrbStepResult {
  let healed = 0;
  let redCollected = 0;

  const magnetRadius = CONFIG.economy.orbs.magnetRadius;
  const magnetSpeed = CONFIG.economy.orbs.magnetSpeed;
  const absorbDistSq = 12 * 12; // 144 px²

  for (let i = 0; i < orbs.length; i += 1) {
    const orb = orbs[i];
    if (orb.absorbed) {
      continue;
    }

    orb.ageTicks += 1;

    // Destino: pecho de Kratos
    const targetX = player ? player.x : orb.x;
    const targetY = player ? player.y - 26 : orb.y;
    const dx = targetX - orb.x;
    const dy = targetY - orb.y;
    const distSq = dx * dx + dy * dy;

    const canMagnetize =
      player &&
      !player.isDead &&
      orb.ageTicks > 4 &&
      distSq <= magnetRadius * magnetRadius;

    if (canMagnetize) {
      // Absorción cuando el orbe hace contacto con el cuerpo de Kratos
      if (distSq <= absorbDistSq) {
        orb.absorbed = true;
        if (orb.type === 'green') {
          const oldHp = player.hp;
          player.hp = Math.min(player.maxHp, player.hp + orb.value);
          healed += player.hp - oldHp;
        } else if (orb.type === 'red') {
          player.redOrbs += orb.value;
          redCollected += orb.value;
        }
        continue;
      }

      const dist = Math.sqrt(distSq);
      const dirX = dx / dist;
      const dirY = dy / dist;

      // Velocidad progresiva que acelera fluidamente hacia el héroe
      const ramp = Math.min(1.2, 0.6 + orb.ageTicks * 0.04);
      const targetVx = dirX * magnetSpeed * ramp;
      const targetVy = dirY * magnetSpeed * ramp;

      // Conducción suave de la velocidad (steering)
      orb.vx += (targetVx - orb.vx) * 0.32;
      orb.vy += (targetVy - orb.vy) * 0.32;
    } else {
      // Movimiento balístico: gravedad suave y fricción del aire
      orb.vy += 160 * dt;
      orb.vx *= Math.max(0, 1 - 2.0 * dt);
    }

    orb.x += orb.vx * dt;
    orb.y += orb.vy * dt;
  }

  return { healed, redCollected };
}
