import { CONFIG } from '../config';
import { checksumOf } from './checksum';
import { cloneEntities, DEFAULT_SCENARIO, getScenario } from './scenarios';
import type { EntityState, GameAction, SimulationSnapshot } from './types';
import { sortActions } from './types';

export class World {
  private tick = 0;
  private entities: EntityState[] = [];
  private input: GameAction[] = [];
  private scenarioName: string = DEFAULT_SCENARIO;

  constructor() {
    this.loadScenario(DEFAULT_SCENARIO);
  }

  get frame(): number {
    return this.tick;
  }

  get timeMs(): number {
    return (this.tick * 1000) / CONFIG.sim.tickRate;
  }

  get entityCount(): number {
    return this.entities.length;
  }

  loadScenario(name: string): void {
    const scenario = getScenario(name);
    this.scenarioName = name;
    this.tick = 0;
    this.input = [];
    this.entities = cloneEntities(scenario.entities);
  }

  reset(): void {
    this.loadScenario(this.scenarioName);
  }

  step(actions: readonly GameAction[] = []): void {
    this.input = sortActions(actions);
    this.tick += 1;
  }

  snapshot(): SimulationSnapshot {
    const payload = {
      frame: this.tick,
      timeMs: this.timeMs,
      entities: this.entities.map((entity) => ({ ...entity })),
      input: [...this.input],
    };
    return {
      ...payload,
      checksum: checksumOf(payload),
    };
  }
}
