import { CONFIG } from '../config';
import type { ArenaState, WaveState } from './types';

/**
 * Gestor determinista de la delimitación de arenas de combate (Arena Manager).
 *
 * Confinamiento físico mediante barreras mágicas de Ares:
 * - Durante el combate (`wave.phase !== 'complete'`), las barreras están activas (`active = true`, `alpha = 0.8`).
 * - Delimitan el espacio horizontal en `[minX .. maxX]`.
 * - Al superarse el encuentro (`wave.phase === 'complete'`), se inicia la disipación:
 *   un desvanecimiento gradual de 30 ticks donde `alpha` decae linealmente a 0.
 * - Una vez disipada (`dissipateTicks === 0`), `active = false` y los límites se abren al mapa completo.
 */
export class ArenaManager {
  private active = true;
  private dissipating = false;
  private dissipateTicks = 0;
  private alpha: number = CONFIG.combat.arena.barrierAlpha;
  private readonly minX: number = CONFIG.combat.arena.minX;
  private readonly maxX: number = CONFIG.combat.arena.maxX;

  constructor() {
    this.reset();
  }

  reset(): void {
    this.active = true;
    this.dissipating = false;
    this.dissipateTicks = 0;
    this.alpha = CONFIG.combat.arena.barrierAlpha;
  }

  step(waveState?: WaveState | null): void {
    if (!this.active && !this.dissipating) {
      return;
    }

    if (waveState && waveState.phase === 'complete') {
      if (!this.dissipating) {
        this.dissipating = true;
        this.dissipateTicks = CONFIG.combat.arena.dissipateDurationTicks;
        return;
      }

      if (this.dissipateTicks > 0) {
        this.dissipateTicks -= 1;
        this.alpha =
          (this.dissipateTicks / CONFIG.combat.arena.dissipateDurationTicks) *
          CONFIG.combat.arena.barrierAlpha;

        if (this.dissipateTicks === 0) {
          this.active = false;
          this.dissipating = false;
          this.alpha = 0;
        }
      }
    }
  }

  getState(): ArenaState {
    return {
      active: this.active,
      minX: this.minX,
      maxX: this.maxX,
      dissipateTicks: this.dissipateTicks,
      alpha: this.alpha,
    };
  }

  isActive(): boolean {
    return this.active;
  }

  getMinX(): number {
    return this.minX;
  }

  getMaxX(): number {
    return this.maxX;
  }
}
