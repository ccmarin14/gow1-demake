import { CONFIG } from '../config';
import { checksumOf } from './checksum';
import { stepHorizontal } from './movement';
import { cloneEntities, DEFAULT_SCENARIO, getScenario } from './scenarios';
import type { EntityState, GameAction, SimulationSnapshot } from './types';
import { PLAYER_ID, sortActions } from './types';

const TICK_DT = 1 / CONFIG.sim.tickRate;

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

  getEntity(id: string): EntityState | undefined {
    const entity = this.entities.find((candidate) => candidate.id === id);
    return entity ? { ...entity } : undefined;
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
    const player = this.entities.find((entity) => entity.id === PLAYER_ID);
    if (player) {
      stepHorizontal(
        player,
        this.input.includes('move-left'),
        this.input.includes('move-right'),
        TICK_DT,
        CONFIG.player,
      );
    }
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
