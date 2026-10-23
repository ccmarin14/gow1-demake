export type GameAction =
  | 'move-left'
  | 'move-right'
  | 'jump'
  | 'light-attack'
  | 'heavy-attack'
  | 'grab'
  | 'magic'
  | 'dodge'
  | 'guard'
  | 'context-action'
  | 'pause'
  | 'restart';

export const DOMAIN_ACTIONS: readonly GameAction[] = [
  'move-left',
  'move-right',
  'jump',
  'light-attack',
  'heavy-attack',
  'grab',
  'magic',
  'dodge',
  'guard',
  'context-action',
  'pause',
  'restart',
];

const ACTION_ORDER: Record<GameAction, number> = DOMAIN_ACTIONS.reduce(
  (acc, action, index) => {
    acc[action] = index;
    return acc;
  },
  {} as Record<GameAction, number>,
);

export function sortActions(actions: readonly GameAction[]): GameAction[] {
  const len = actions.length;
  if (len === 0) {
    return [];
  }
  if (len === 1) {
    return [actions[0]];
  }
  let strictlyOrdered = true;
  let prevOrder = ACTION_ORDER[actions[0]];
  for (let i = 1; i < len; i += 1) {
    const order = ACTION_ORDER[actions[i]];
    if (order <= prevOrder) {
      strictlyOrdered = false;
      break;
    }
    prevOrder = order;
  }
  if (strictlyOrdered) {
    return [...actions];
  }
  return [...new Set(actions)].sort((a, b) => ACTION_ORDER[a] - ACTION_ORDER[b]);
}

/** Level-1 move ids (see `CONFIG.player.attack.moves`). */
export type AttackMoveId =
  | 'light_1'
  | 'light_2'
  | 'light_3'
  | 'light_4'
  | 'spirit_of_hercules'
  | 'plume_of_prometheus'
  | 'heavy_slam'
  | 'ascension'
  | 'air_light_1'
  | 'air_light_2'
  | 'air_heavy_slam'
  | 'air_grab'
  | 'chain_grab'
  | 'dash_attack';

export const PLAYER_ID = 'player';

export interface EntityState {
  id: string;
  kind: 'player' | 'legionnaire' | 'dummy';
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
  /** Move in progress (`'none'` when idle). */
  attackMove: AttackMoveId | 'none';
  /** Buffered attack action ready to trigger as soon as the attack window opens. */
  attackBufferAction: GameAction | null;
  /** Ticks left before the buffered attack action expires. */
  attackBufferTicks: number;
  /** Ticks the heavy button has been held (K hold -> Ascension). */
  heavyHoldTicks: number;
  /** Ticks the whole simulation freezes after an impact (the world skips the step). */
  hitstopTicks: number;
  /** Ticks left of the target's hit reaction. */
  hitstunTicks: number;
  /** Ticks left of the last blade-vs-`yTop` impact event; `0` = none. */
  groundImpactTicks: number;
  groundImpactX: number;
  groundImpactY: number;
  /**
   * Roll (dodge) state. Active when rollPhase !== 'none'; ticks count from
   * phase start. invulTicks counts down while entity is invulnerable.
   */
  rollPhase: 'none' | 'active' | 'recovery';
  rollTicks: number;
  invulTicks: number;
  guardPhase: 'none' | 'startup' | 'active' | 'recovery';
  guardTicks: number;
  parryActive: boolean;
  /** Ticks left of skid / turnaround braking state; 0 = normal movement. */
  skidTicks: number;
  /** Ticks left of elastic landing impact absorption; 0 = normal presentation. */
  landingTicks: number;
  aiState: 'idle' | 'patrol' | 'approach' | 'windup' | 'slash' | 'recover' | 'hitstun' | 'juggle' | 'death';
  aiTicks: number;
  hp: number;
  maxHp: number;
  attackCooldownTicks: number;
  hurtInvulTicks: number;
  isDead: boolean;
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
