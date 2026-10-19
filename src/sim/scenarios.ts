import type { EntityState } from './types';
import { PLAYER_ID } from './types';

export interface Platform {
  x1: number;
  x2: number;
  yTop: number;
}

export interface Scenario {
  name: string;
  entities: EntityState[];
  platforms: Platform[];
}

const GROUND_Y = 262;

function playerAt(x: number, y: number): EntityState {
  return {
    id: PLAYER_ID,
    x,
    y,
    vx: 0,
    vy: 0,
    facing: 1,
    grounded: true,
    coyoteTicks: 0,
    jumpBufferTicks: 0,
    jumpsUsed: 0,
    attackPhase: 'none',
    attackTicks: 0,
    attackHits: [],
    attackChain: 0,
    rollPhase: 'none',
    rollTicks: 0,
    invulTicks: 0,
  };
}

const scenarios = new Map<string, Scenario>();

function register(scenario: Scenario): void {
  scenarios.set(scenario.name, scenario);
}

register({
  name: 'empty',
  entities: [],
  platforms: [],
});

register({
  name: 'test',
  entities: [
    {
      id: 'dummy-a',
      x: 160,
      y: 90,
      vx: 0,
      vy: 0,
      facing: 1,
      grounded: false,
      coyoteTicks: 0,
      jumpBufferTicks: 0,
      jumpsUsed: 0,
      attackPhase: 'none',
      attackTicks: 0,
      attackHits: [],
      attackChain: 0,
      rollPhase: 'none',
      rollTicks: 0,
      invulTicks: 0,
    },
    {
      id: 'dummy-b',
      x: 192,
      y: 90,
      vx: 0,
      vy: 0,
      facing: 1,
      grounded: false,
      coyoteTicks: 0,
      jumpBufferTicks: 0,
      jumpsUsed: 0,
      attackPhase: 'none',
      attackTicks: 0,
      attackHits: [],
      attackChain: 0,
      rollPhase: 'none',
      rollTicks: 0,
      invulTicks: 0,
    },
  ],
  platforms: [],
});

register({
  name: 'movement',
  entities: [playerAt(240, GROUND_Y)],
  platforms: [{ x1: 0, x2: 480, yTop: GROUND_Y }],
});

register({
  name: 'platforms',
  entities: [playerAt(240, GROUND_Y)],
  platforms: [
    { x1: 0, x2: 480, yTop: GROUND_Y },
    { x1: 280, x2: 370, yTop: 210 },
    { x1: 140, x2: 250, yTop: 158 },
  ],
});

register({
  name: 'combat',
  entities: [
    playerAt(200, GROUND_Y),
    {
      id: 'dummy',
      x: 240,
      y: GROUND_Y,
      vx: 0,
      vy: 0,
      facing: -1,
      grounded: true,
      coyoteTicks: 0,
      jumpBufferTicks: 0,
      jumpsUsed: 0,
      attackPhase: 'none',
      attackTicks: 0,
      attackHits: [],
      attackChain: 0,
      rollPhase: 'none',
      rollTicks: 0,
      invulTicks: 0,
    },
  ],
  platforms: [{ x1: 0, x2: 480, yTop: GROUND_Y }],
});

export const DEFAULT_SCENARIO = 'platforms';

export function getScenario(name: string): Scenario {
  const scenario = scenarios.get(name);
  if (!scenario) {
    throw new Error(`Unknown scenario: ${name}`);
  }
  return scenario;
}

export function scenarioNames(): string[] {
  return [...scenarios.keys()];
}

export function cloneEntities(entities: readonly EntityState[]): EntityState[] {
  return entities.map((entity) => ({ ...entity }));
}
