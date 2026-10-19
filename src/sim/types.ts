export type GameAction =
  | 'move-left'
  | 'move-right'
  | 'jump'
  | 'light-attack'
  | 'heavy-attack'
  | 'dodge'
  | 'context-action'
  | 'pause';

export const DOMAIN_ACTIONS: readonly GameAction[] = [
  'move-left',
  'move-right',
  'jump',
  'light-attack',
  'heavy-attack',
  'dodge',
  'context-action',
  'pause',
];

const ACTION_ORDER: Record<GameAction, number> = DOMAIN_ACTIONS.reduce(
  (acc, action, index) => {
    acc[action] = index;
    return acc;
  },
  {} as Record<GameAction, number>,
);

export function sortActions(actions: readonly GameAction[]): GameAction[] {
  return [...new Set(actions)].sort((a, b) => ACTION_ORDER[a] - ACTION_ORDER[b]);
}

export const PLAYER_ID = 'player';

export interface EntityState {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: -1 | 1;
  grounded: boolean;
  coyoteTicks: number;
  jumpBufferTicks: number;
  /**
   * Upward impulses applied since the entity last touched a surface. `0` means
   * the ground jump is still available; the air jump needs a fresh `jump`
   * press while airborne.
   */
  jumpsUsed: number;
  attackPhase: 'none' | 'startup' | 'active' | 'recovery';
  attackTicks: number;
  attackHits: string[];
  attackChain: number;
  /**
   * Roll (dodge) state. Active when rollPhase !== 'none'; ticks count from
   * phase start. invulTicks counts down while entity is invulnerable.
   */
  rollPhase: 'none' | 'active' | 'recovery';
  rollTicks: number;
  invulTicks: number;
}

export interface SimulationSnapshot {
  frame: number;
  timeMs: number;
  entities: EntityState[];
  input: GameAction[];
  checksum: string;
}

export interface TraceFrame {
  frame: number;
  actions: GameAction[];
}

export type InputTrace = TraceFrame[];

export interface PresentationMetrics {
  fps: number;
  frameDeltaMs: number;
  displayObjects: number;
}

export interface HarnessMetrics extends PresentationMetrics {
  ticks: number;
  simulationTimeMs: number;
  entities: number;
  activeEffects: number;
}
