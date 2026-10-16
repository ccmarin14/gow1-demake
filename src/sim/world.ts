import { CONFIG } from '../config';
import { checksumOf } from './checksum';
import { stepHorizontal } from './movement';
import type { Platform } from './scenarios';
import { cloneEntities, DEFAULT_SCENARIO, getScenario } from './scenarios';
import type { EntityState, GameAction, SimulationSnapshot } from './types';
import { PLAYER_ID, sortActions } from './types';
import { stepVertical, type VerticalParams } from './vertical';

const TICK_DT = 1 / CONFIG.sim.tickRate;

const VERTICAL_PARAMS: VerticalParams = {
  gravity: CONFIG.player.vertical.gravity,
  jumpSpeed: CONFIG.player.vertical.jumpSpeed,
  maxFallSpeed: CONFIG.player.vertical.maxFallSpeed,
  coyoteTicks: Math.round(
    (CONFIG.player.vertical.coyoteMs * CONFIG.sim.tickRate) / 1000,
  ),
  jumpBufferTicks: Math.round(
    (CONFIG.player.vertical.jumpBufferMs * CONFIG.sim.tickRate) / 1000,
  ),
  topY: CONFIG.player.vertical.topY,
};

export class World {
  private tick = 0;
  private entities: EntityState[] = [];
  private platforms: readonly Platform[] = [];
  private input: GameAction[] = [];
  private jumpHeld = false;
  private activeScenario: string = DEFAULT_SCENARIO;

  constructor() {
    this.loadScenario(DEFAULT_SCENARIO);
  }

  get frame(): number {
    return this.tick;
  }

  get scenarioName(): string {
    return this.activeScenario;
  }

  get timeMs(): number {
    return (this.tick * 1000) / CONFIG.sim.tickRate;
  }

  get entityCount(): number {
    return this.entities.length;
  }

  get surfacePlatforms(): readonly Platform[] {
    return this.platforms;
  }

  getEntity(id: string): EntityState | undefined {
    const entity = this.entities.find((candidate) => candidate.id === id);
    return entity ? { ...entity } : undefined;
  }

  loadScenario(name: string): void {
    const scenario = getScenario(name);
    this.activeScenario = name;
    this.tick = 0;
    this.input = [];
    this.jumpHeld = false;
    this.platforms = scenario.platforms;
    this.entities = cloneEntities(scenario.entities);
  }

  reset(): void {
    this.loadScenario(this.activeScenario);
  }

  step(actions: readonly GameAction[] = []): void {
    this.input = sortActions(actions);
    const wantsJump = this.input.includes('jump');
    const jumpEdge = wantsJump && !this.jumpHeld;
    this.jumpHeld = wantsJump;

    const player = this.entities.find((entity) => entity.id === PLAYER_ID);
    if (player) {
      stepHorizontal(
        player,
        this.input.includes('move-left'),
        this.input.includes('move-right'),
        TICK_DT,
        CONFIG.player,
      );
      stepVertical(player, VERTICAL_PARAMS, TICK_DT, jumpEdge, this.platforms);
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
