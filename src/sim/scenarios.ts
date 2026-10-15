import type { EntityState } from './types';
import { PLAYER_ID } from './types';

export interface Scenario {
  name: string;
  entities: EntityState[];
}

const scenarios = new Map<string, Scenario>();

function register(scenario: Scenario): void {
  scenarios.set(scenario.name, scenario);
}

register({
  name: 'empty',
  entities: [],
});

register({
  name: 'test',
  entities: [
    { id: 'dummy-a', x: 160, y: 90, vx: 0, facing: 1 },
    { id: 'dummy-b', x: 192, y: 90, vx: 0, facing: 1 },
  ],
});

register({
  name: 'movement',
  entities: [{ id: PLAYER_ID, x: 240, y: 262, vx: 0, facing: 1 }],
});

export const DEFAULT_SCENARIO = 'movement';

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
