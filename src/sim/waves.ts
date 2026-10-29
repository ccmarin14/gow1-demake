import { CONFIG } from '../config';
import type { EntityState, WaveState } from './types';

interface QueuedSpawn {
  kind: 'legionnaire' | 'archer';
  x: number;
  delayTicks: number;
  facing: -1 | 1;
  spawned: boolean;
}

/**
 * Gestor determinista del flujo y ritmo de oleadas de combate (Wave Manager).
 *
 * Máquina de estados de encuentro:
 * - `spawning`: activación progresiva y telegrafiada de enemigos según `delayTicks`.
 * - `combat`: batalla activa; supervisa enemigos restantes y bajas.
 * - `cleared`: todos los enemigos de la oleada actual derrotados. Concede un respiro
 *   de ritmo (`transitionDelayTicks` = 60 ticks / 1 s) para recolección de orbes y posicionamiento.
 * - `complete`: todas las oleadas del encuentro superadas (victoria / zona despejada).
 */
export class WaveManager {
  private currentWaveIndex = 0;
  private phase: 'spawning' | 'combat' | 'cleared' | 'complete' = 'spawning';
  private phaseTicks = 0;
  private waveTicks = 0;
  private totalKills = 0;
  private spawnQueue: QueuedSpawn[] = [];
  private readonly waveEnemyIds = new Set<string>();

  /** `originX` is the left edge of the arena; spawn offsets are relative to it. */
  constructor(private readonly originX: number = CONFIG.combat.arena.minX) {
    this.reset();
  }

  reset(): void {
    this.currentWaveIndex = 0;
    this.totalKills = 0;
    this.loadWave(0);
  }

  private loadWave(waveIndex: number): void {
    this.currentWaveIndex = waveIndex;
    this.phase = 'spawning';
    this.phaseTicks = 0;
    this.waveTicks = 0;
    this.waveEnemyIds.clear();

    const encounters = CONFIG.combat.waves.encounters;
    const encounter = encounters[waveIndex];
    if (encounter) {
      this.spawnQueue = encounter.spawns.map((s) => ({
        kind: s.kind,
        x: this.originX + s.offsetX,
        delayTicks: s.delayTicks,
        facing: s.facing,
        spawned: false,
      }));
    } else {
      this.spawnQueue = [];
      this.phase = 'complete';
    }
  }

  recordKill(): void {
    this.totalKills += 1;
  }

  completeEncounter(): void {
    this.phase = 'complete';
    this.phaseTicks = 0;
  }

  step(
    activeTargets: readonly EntityState[],
    spawnEnemy: (kind: 'legionnaire' | 'archer', x: number, facing: -1 | 1) => EntityState,
  ): void {
    // 1. Fase de generación de refuerzos
    if (this.phase === 'spawning') {
      for (let i = 0; i < this.spawnQueue.length; i += 1) {
        const item = this.spawnQueue[i];
        if (!item.spawned && this.waveTicks >= item.delayTicks) {
          const entity = spawnEnemy(item.kind, item.x, item.facing);
          this.waveEnemyIds.add(entity.id);
          item.spawned = true;
        }
      }

      const allSpawned = this.spawnQueue.every((item) => item.spawned);
      if (allSpawned) {
        this.phase = 'combat';
        this.phaseTicks = 0;
      } else {
        this.phaseTicks += 1;
      }
      this.waveTicks += 1;
      return;
    }

    // 2. Fase de combate activo
    if (this.phase === 'combat') {
      this.phaseTicks += 1;
      this.waveTicks += 1;

      const livingCount = activeTargets.filter(
        (target) => this.waveEnemyIds.has(target.id) && target.aiState !== 'death',
      ).length;
      const unspawnedCount = this.spawnQueue.filter((s) => !s.spawned).length;

      if (livingCount === 0 && unspawnedCount === 0) {
        const isLastWave = this.currentWaveIndex + 1 >= CONFIG.combat.waves.encounters.length;
        if (isLastWave) {
          this.phase = 'complete';
          this.phaseTicks = 0;
        } else {
          this.phase = 'cleared';
          this.phaseTicks = 0;
        }
      }
      return;
    }

    // 3. Fase de respiro de ritmo (zona despejada temporal entre oleadas)
    if (this.phase === 'cleared') {
      this.phaseTicks += 1;
      if (this.phaseTicks >= CONFIG.combat.waves.transitionDelayTicks) {
        const totalWaves = CONFIG.combat.waves.encounters.length;
        if (this.currentWaveIndex + 1 < totalWaves) {
          this.loadWave(this.currentWaveIndex + 1);
        } else {
          this.phase = 'complete';
          this.phaseTicks = 0;
        }
      }
      return;
    }

    // 4. Encuentro completado
    if (this.phase === 'complete') {
      this.phaseTicks += 1;
    }
  }

  getState(activeTargets: readonly EntityState[]): WaveState {
    const livingCount = activeTargets.filter(
      (target) => this.waveEnemyIds.has(target.id) && target.aiState !== 'death',
    ).length;
    const unspawnedCount = this.spawnQueue.filter((s) => !s.spawned).length;
    const enemiesRemaining = livingCount + unspawnedCount;

    return {
      waveIndex: this.currentWaveIndex,
      totalWaves: CONFIG.combat.waves.encounters.length,
      phase: this.phase,
      phaseTicks: this.phaseTicks,
      enemiesRemaining,
      totalKills: this.totalKills,
    };
  }
}
