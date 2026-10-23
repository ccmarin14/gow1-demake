import { CONFIG } from '../config';
import { createHydraState } from './hydra';
import type { CheckpointState, ChestState, EntityState } from './types';
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
  /** Targets integrate knockback/launch (gravity, friction, platforms). */
  targetPhysics?: boolean;
  chests?: ChestState[];
  checkpoints?: CheckpointState[];
}

const GROUND_Y = 262;

function playerAt(x: number, y: number): EntityState {
  return {
    id: PLAYER_ID,
    kind: 'player',
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
    attackMove: 'none',
    attackBufferAction: null,
    attackBufferTicks: 0,
    heavyHoldTicks: 0,
    hitstopTicks: 0,
    hitstunTicks: 0,
    groundImpactTicks: 0,
    groundImpactX: 0,
    groundImpactY: 0,
    rollPhase: 'none',
    rollTicks: 0,
    invulTicks: 0,
    guardPhase: 'none',
    guardTicks: 0,
    parryActive: false,
    skidTicks: 0,
    landingTicks: 0,
    aiState: 'idle',
    aiTicks: 0,
    hp: 100,
    maxHp: 100,
    mp: 100,
    maxMp: 100,
    magicPhase: 'none',
    magicTicks: 0,
    dropThroughTicks: 0,
    attackCooldownTicks: 0,
    hurtInvulTicks: 0,
    isDead: false,
    redOrbs: 0,
    gorgonEyes: 0,
    gorgonUpgrades: 0,
    phoenixFeathers: 0,
    phoenixUpgrades: 0,
    weaponLevel: 1,
  };
}

function dummyAt(id: string, x: number, y: number, facing: -1 | 1 = 1, grounded = false): EntityState {
  return {
    id,
    kind: 'dummy',
    x,
    y,
    vx: 0,
    vy: 0,
    facing,
    grounded,
    coyoteTicks: 0,
    jumpBufferTicks: 0,
    jumpsUsed: 0,
    attackPhase: 'none',
    attackTicks: 0,
    attackHits: [],
    attackChain: 0,
    attackMove: 'none',
    attackBufferAction: null,
    attackBufferTicks: 0,
    heavyHoldTicks: 0,
    hitstopTicks: 0,
    hitstunTicks: 0,
    groundImpactTicks: 0,
    groundImpactX: 0,
    groundImpactY: 0,
    rollPhase: 'none',
    rollTicks: 0,
    invulTicks: 0,
    guardPhase: 'none',
    guardTicks: 0,
    parryActive: false,
    skidTicks: 0,
    landingTicks: 0,
    aiState: 'idle',
    aiTicks: 0,
    hp: 100,
    maxHp: 100,
    mp: 0,
    maxMp: 0,
    magicPhase: 'none',
    magicTicks: 0,
    dropThroughTicks: 0,
    attackCooldownTicks: 0,
    hurtInvulTicks: 0,
    isDead: false,
    redOrbs: 0,
    gorgonEyes: 0,
    gorgonUpgrades: 0,
    phoenixFeathers: 0,
    phoenixUpgrades: 0,
    weaponLevel: 1,
  };
}

export function legionnaireAt(id: string, x: number, y: number, facing: -1 | 1 = -1): EntityState {
  return {
    id,
    kind: 'legionnaire',
    x,
    y,
    vx: 0,
    vy: 0,
    facing,
    grounded: y >= GROUND_Y,
    coyoteTicks: 0,
    jumpBufferTicks: 0,
    jumpsUsed: 0,
    attackPhase: 'none',
    attackTicks: 0,
    attackHits: [],
    attackChain: 0,
    attackMove: 'none',
    attackBufferAction: null,
    attackBufferTicks: 0,
    heavyHoldTicks: 0,
    hitstopTicks: 0,
    hitstunTicks: 0,
    groundImpactTicks: 0,
    groundImpactX: 0,
    groundImpactY: 0,
    rollPhase: 'none',
    rollTicks: 0,
    invulTicks: 0,
    guardPhase: 'none',
    guardTicks: 0,
    parryActive: false,
    skidTicks: 0,
    landingTicks: 0,
    aiState: 'idle',
    aiTicks: 0,
    hp: CONFIG.enemy.legionnaire.maxHp,
    maxHp: CONFIG.enemy.legionnaire.maxHp,
    mp: 0,
    maxMp: 0,
    magicPhase: 'none',
    magicTicks: 0,
    dropThroughTicks: 0,
    attackCooldownTicks: 0,
    hurtInvulTicks: 0,
    isDead: false,
    redOrbs: 0,
    gorgonEyes: 0,
    gorgonUpgrades: 0,
    phoenixFeathers: 0,
    phoenixUpgrades: 0,
    weaponLevel: 1,
  };
}

export function archerAt(id: string, x: number, y: number, facing: -1 | 1 = -1, grounded = true): EntityState {
  return {
    id,
    kind: 'archer',
    x,
    y,
    vx: 0,
    vy: 0,
    facing,
    grounded,
    coyoteTicks: 0,
    jumpBufferTicks: 0,
    jumpsUsed: 0,
    attackPhase: 'none',
    attackTicks: 0,
    attackHits: [],
    attackChain: 0,
    attackMove: 'none',
    attackBufferAction: null,
    attackBufferTicks: 0,
    heavyHoldTicks: 0,
    hitstopTicks: 0,
    hitstunTicks: 0,
    groundImpactTicks: 0,
    groundImpactX: 0,
    groundImpactY: 0,
    rollPhase: 'none',
    rollTicks: 0,
    invulTicks: 0,
    guardPhase: 'none',
    guardTicks: 0,
    parryActive: false,
    skidTicks: 0,
    landingTicks: 0,
    aiState: 'reposition',
    aiTicks: 0,
    hp: CONFIG.enemy.archer.maxHp,
    maxHp: CONFIG.enemy.archer.maxHp,
    mp: 0,
    maxMp: 0,
    magicPhase: 'none',
    magicTicks: 0,
    dropThroughTicks: 0,
    attackCooldownTicks: 0,
    hurtInvulTicks: 0,
    isDead: false,
    redOrbs: 0,
    gorgonEyes: 0,
    gorgonUpgrades: 0,
    phoenixFeathers: 0,
    phoenixUpgrades: 0,
    weaponLevel: 1,
  };
}

export function hydraAt(id: string, x: number, y: number, facing: -1 | 1 = -1): EntityState {
  return createHydraState(id, x, y, facing);
}

export function chestAt(
  id: string,
  type: ChestState['type'],
  x: number,
  y: number,
): ChestState {
  return {
    id,
    type,
    x,
    y,
    state: 'closed',
    openProgressTicks: 0,
    itemAbsorbed: false,
  };
}

export function checkpointAt(
  id: string,
  x: number,
  y: number,
  name: string,
): CheckpointState {
  return {
    id,
    x,
    y,
    name,
    active: false,
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
    dummyAt('dummy-a', 160, 90, 1, false),
    dummyAt('dummy-b', 192, 90, 1, false),
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
    dummyAt('dummy', 240, GROUND_Y, -1, true),
  ],
  platforms: [{ x1: 0, x2: 480, yTop: GROUND_Y }],
  targetPhysics: true,
});

register({
  name: 'legionnaire',
  entities: [
    playerAt(190, GROUND_Y),
    legionnaireAt('legionnaire-1', 240, GROUND_Y, -1),
  ],
  platforms: [{ x1: 0, x2: 480, yTop: GROUND_Y }],
  targetPhysics: true,
});

register({
  name: 'archer',
  entities: [
    playerAt(160, GROUND_Y),
    archerAt('archer-1', 300, GROUND_Y, -1),
  ],
  platforms: [{ x1: 0, x2: 480, yTop: GROUND_Y }],
  targetPhysics: true,
});

register({
  name: 'waves',
  entities: [playerAt(160, GROUND_Y)],
  platforms: [{ x1: 0, x2: 480, yTop: GROUND_Y }],
  targetPhysics: true,
});

register({
  name: 'arena',
  entities: [playerAt(120, GROUND_Y)],
  platforms: [{ x1: 0, x2: 480, yTop: GROUND_Y }],
  targetPhysics: true,
});

register({
  name: 'magic',
  entities: [
    playerAt(200, GROUND_Y),
    legionnaireAt('legionnaire-1', 245, GROUND_Y, -1),
    archerAt('archer-1', 150, GROUND_Y, 1),
  ],
  platforms: [{ x1: 0, x2: 480, yTop: GROUND_Y }],
  targetPhysics: true,
});

register({
  name: 'chest',
  entities: [playerAt(160, GROUND_Y)],
  platforms: [{ x1: 0, x2: 480, yTop: GROUND_Y }],
  chests: [
    chestAt('chest-gorgon-1', 'gorgon_eye', 190, GROUND_Y),
    chestAt('chest-feather-1', 'phoenix_feather', 300, GROUND_Y),
    chestAt('chest-red-1', 'red_orbs', 410, GROUND_Y),
  ],
  targetPhysics: true,
});

register({
  name: 'level1',
  entities: [
    playerAt(100, GROUND_Y),
    archerAt('archer-crow', 1170, 138, -1),
    hydraAt('hydra-proa', 1360, 262, -1),
  ],
  platforms: [
    { x1: 0, x2: 1440, yTop: 262 },
    { x1: 200, x2: 290, yTop: 226 },
    { x1: 1040, x2: 1180, yTop: 200 },
    { x1: 1100, x2: 1240, yTop: 138 },
    { x1: 1310, x2: 1440, yTop: 218 },
  ],
  chests: [
    chestAt('chest-red-popa', 'red_orbs', 70, 262),
    chestAt('chest-popa', 'gorgon_eye', 240, 226),
    chestAt('chest-feather-beam', 'phoenix_feather', 1110, 200),
    chestAt('chest-proa', 'gorgon_eye', 1360, 218),
  ],
  checkpoints: [
    checkpointAt('chk-popa', 140, 262, 'Popa de la Nave'),
    checkpointAt('chk-proa', 980, 262, 'Umbral de Proa'),
  ],
  targetPhysics: true,
});

register({
  name: 'checkpoint',
  entities: [playerAt(100, GROUND_Y)],
  platforms: [{ x1: 0, x2: 480, yTop: GROUND_Y }],
  checkpoints: [
    checkpointAt('chk-test', 180, GROUND_Y, 'Punto de Prueba'),
  ],
  targetPhysics: true,
});

register({
  name: 'hydra',
  entities: [
    playerAt(180, GROUND_Y),
    hydraAt('hydra-boss', 360, GROUND_Y, -1),
  ],
  platforms: [{ x1: 0, x2: 480, yTop: GROUND_Y }],
  targetPhysics: true,
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

export function cloneChests(chests: readonly ChestState[]): ChestState[] {
  return chests.map((chest) => ({ ...chest }));
}

export function cloneCheckpoints(checkpoints: readonly CheckpointState[]): CheckpointState[] {
  return checkpoints.map((chk) => ({ ...chk }));
}
