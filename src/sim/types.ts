import type { StrikeEntry, StrikeId } from './strike';

export type GameAction =
  | 'move-left'
  | 'move-right'
  | 'move-down'
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
  'move-down',
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

export const PLAYER_ID = 'player';

/**
 * Fire burning on the ground from world x `x0` to `x1` at ground `y`,
 * `heightPx` tall, for `ticks` (it has burned `age`). Enemies standing in it
 * are hit once each (and lifted when targets have physics); `hits` are the
 * ids already hit.
 */
export interface GroundFireState {
  x0: number;
  x1: number;
  y: number;
  heightPx: number;
  ticks: number;
  age: number;
  damage: number;
  hitstunTicks: number;
  liftVy: number;
  hits: string[];
}

/** Kratos' strike in progress (`src/sim/strike.ts`), as the view reads it. */
export interface StrikeSnapshot {
  id: StrikeId;
  /** Ticks since the strike started (0 on its first tick). */
  tick: number;
  /** World x of the feet at the strike's start, kept in step with the body. */
  originX: number;
  facing: -1 | 1;
  /** Ids already hit by this strike. */
  hits: string[];
  /** The attack was pressed again early: the chained strike starts when its window opens. */
  queued: boolean;
  /** Direction held with the queued press: the next strike turns that way. */
  queuedDirection?: -1 | 1;
  /** The queued press was triangle: the chain's `heavy` strike starts. */
  queuedHeavy?: boolean;
  /** The queued press was circle (grab): the chain's `grab` strike starts (Orion's Harpoon). */
  queuedGrab?: boolean;
  /** The strike this one chained from (absent when it started on its own). */
  entry?: StrikeEntry;
}

export interface EntityState {
  id: string;
  kind: 'player' | 'legionnaire' | 'dummy' | 'archer' | 'hydra';
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
  /** Enemy-only: ids already hit by the current legionnaire slash. */
  attackHits: string[];
  /** Enemy-only: hydra attack cycle (`0` = slam, `1` = sweep). */
  attackChain: number;
  /** Enemy-only: hydra HP at its last stagger. */
  heavyHoldTicks: number;
  /** Ticks left of the entity's hit reaction. */
  hitstunTicks: number;
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
  /** Ticks left of elastic landing impact absorption; 0 = normal presentation. */
  landingTicks: number;
  aiState:
    | 'idle'
    | 'patrol'
    | 'approach'
    | 'guard'
    | 'windup'
    | 'slash'
    | 'heavy_windup'
    | 'heavy_slash'
    | 'recover'
    | 'hitstun'
    | 'juggle'
    | 'knockdown'
    | 'get_up'
    | 'grabbed'
    | 'weakened'
    | 'death'
    | 'reposition'
    | 'aim'
    | 'shoot'
    | 'spawning'
    | 'hydra_idle'
    | 'hydra_roar'
    | 'hydra_slam'
    | 'hydra_stuck'
    | 'hydra_sweep'
    | 'hydra_hurt'
    | 'hydra_stagger'
    | 'hydra_defeat';
  aiTicks: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  magicPhase: 'none' | 'startup' | 'active' | 'recovery';
  magicTicks: number;
  /** Enemy IDs already reached by the expanding ground wave of the current cast. */
  magicHitIds?: string[];
  /** Active tick at which each enemy can be shocked again by the current cast. */
  magicNextHitTick?: Record<string, number>;
  grabPhase: 'none' | 'whiff' | 'hold' | 'pummel' | 'floorhold' | 'stab' | 'slam' | 'throw' | 'break' | 'recovery' | 'finisher_qte' | 'finisher_slam';
  grabTicks: number;
  grabTargetId: string | null;
  /** Taps of the Circle chain so far: 1..3 punches, 4 the throw to the floor, 5..8 the stabs. */
  grabPummelCount?: number;
  grabAdvancePx?: number;
  /** A follow-up pressed while a punch was landing (or frozen by its hitstop): it is used as soon as he holds the victim again. */
  grabBuffer?: GameAction | null;
  grabBufferTicks?: number;
  /** Ticks since Kratos arrived at the victim in the lunge (the soldier is lifted over the next few ticks). */
  grabLiftTicks?: number;
  /** Remaining ticks of the enemy's break-free push after a grab expires. */
  grabBreakFreeTicks?: number;
  /** The victim of a Circle grab lies on the floor under Kratos (after the throw to the floor). */
  heldLying?: boolean;
  /** Torn in two by the Rip (○ then △): the presentation draws the two halves instead of the body. */
  ripped?: boolean;
  qteAction: GameAction | null;
  qteTicksLeft: number;
  qteMaxTicks: number;
  dropThroughTicks: number;
  attackCooldownTicks: number;
  hurtInvulTicks: number;
  isDead: boolean;
  redOrbs: number;
  gorgonEyes: number;
  gorgonUpgrades: number;
  phoenixFeathers: number;
  phoenixUpgrades: number;
}

export interface ArrowState {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  reflected: boolean;
  ageTicks: number;
  active: boolean;
}

export interface OrbState {
  id: string;
  type: 'red' | 'green' | 'blue';
  x: number;
  y: number;
  vx: number;
  vy: number;
  value: number;
  ageTicks: number;
  absorbed: boolean;
}

export interface WaveState {
  waveIndex: number;
  totalWaves: number;
  phase: 'spawning' | 'combat' | 'cleared' | 'complete';
  phaseTicks: number;
  enemiesRemaining: number;
  totalKills: number;
}

export interface ArenaState {
  active: boolean;
  minX: number;
  maxX: number;
  dissipateTicks: number;
  alpha: number;
}

export interface ChestState {
  id: string;
  type: 'gorgon_eye' | 'phoenix_feather' | 'red_orbs' | 'green_health';
  x: number;
  y: number;
  state: 'closed' | 'opening' | 'open';
  openProgressTicks: number;
  itemAbsorbed: boolean;
}

export interface CheckpointState {
  id: string;
  x: number;
  y: number;
  name: string;
  active: boolean;
}

export interface SavedPlayerData {
  maxHp: number;
  hp: number;
  maxMp: number;
  mp: number;
  redOrbs: number;
  gorgonEyes: number;
  gorgonUpgrades: number;
  phoenixFeathers: number;
  phoenixUpgrades: number;
}

export type GameFlowState = 'title' | 'playing' | 'paused' | 'victory' | 'gameover';

export interface CombatStats {
  totalKills: number;
  redOrbs: number;
  points: number;
  chestsOpened: number;
  totalChests: number;
  rank: string;
  impactCount: number;
  orbMultiplier: number;
}

export interface QtePromptState {
  targetId: string;
  action: GameAction;
  ticksRemaining: number;
  maxTicks: number;
}

export interface SimulationSnapshot {
  frame: number;
  timeMs: number;
  flowState: GameFlowState;
  entities: EntityState[];
  orbs: OrbState[];
  arrows: ArrowState[];
  chests: ChestState[];
  checkpoints?: CheckpointState[];
  activeCheckpointId?: string | null;
  wave?: WaveState;
  arena?: ArenaState;
  cameraX?: number;
  segmentId?: number;
  segmentName?: string;
  bossHp?: number;
  bossMaxHp?: number;
  bossState?: string;
  bossName?: string;
  stats?: CombatStats;
  /** Kratos' strike in progress, absent when he is not striking. */
  strike?: StrikeSnapshot;
  /** Fire left burning on the ground by strikes (Plume), outliving them. */
  groundFires?: GroundFireState[];
  /** Ticks the world stays frozen after a strike connects (0 = running). */
  hitstopTicks: number;
  /** Active QTE prompt during contextual finisher, absent when not in QTE. */
  qtePrompt?: QtePromptState | null;
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
