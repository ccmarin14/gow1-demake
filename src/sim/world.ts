import { CONFIG } from '../config';
import { checksumOf } from './checksum';
import { stepHorizontal } from './movement';
import type { Platform } from './scenarios';
import { cloneCheckpoints, cloneChests, cloneEntities, DEFAULT_SCENARIO, getScenario, archerAt, legionnaireAt } from './scenarios';
import type { AttackMoveId, CheckpointState, ChestState, CombatStats, EntityState, GameAction, GameFlowState, OrbState, ArrowState, SavedPlayerData, WaveState, ArenaState, SimulationSnapshot } from './types';
import { PLAYER_ID, sortActions } from './types';
import { stepVertical, type VerticalParams } from './vertical';
import { spawnOrbsFromDeath, stepOrbs } from './orbs';
import { stepArcher, stepArrows } from './archer';
import { stepChests, collectGorgonEye, collectPhoenixFeather, upgradeWeapon } from './chests';
import { capturePlayerData, respawnAtCheckpoint, stepCheckpoints } from './checkpoint';
import { WaveManager } from './waves';
import { ArenaManager } from './arena';
import {
  computeAttackHitbox,
  isEntityAttacking,
  stepAttack,
  type AttackHitbox,
  type AttackInput,
  type AttackMoveSet,
  type AttackParams,
  type AttackRules,
} from './attack';
import { isRolling, startRoll, stepRoll } from './roll';
import { isGuarding, startGuard, stepGuard } from './guard';
import { stepLegionnaire } from './legionnaire';
import { stepHydra } from './hydra';
import { isCastingMagic, stepMagic } from './magic';
import { buildLevel1Map, computeCameraScrollX, getSegmentAtX, type LevelMapData } from './map';

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
  maxJumps: CONFIG.player.vertical.maxJumps,
  topY: CONFIG.player.vertical.topY,
};

function buildAttackMoveSet(): AttackMoveSet {
  const result: Partial<Record<AttackMoveId, AttackParams>> = {};
  const moveIds = Object.keys(CONFIG.player.attack.moves) as AttackMoveId[];
  for (let i = 0; i < moveIds.length; i += 1) {
    const moveId = moveIds[i];
    const raw = CONFIG.player.attack.moves[moveId];
    result[moveId] = {
      moveId,
      chain: raw.chain,
      startupTicks: raw.startup,
      activeTicks: raw.active,
      recoveryTicks: raw.recovery,
      gripOffsetY: CONFIG.player.weapon.gripOffsetY,
      arc: {
        startRad: (raw.arc.startDeg * Math.PI) / 180,
        endRad: (raw.arc.endDeg * Math.PI) / 180,
        radius: raw.arc.radius,
        width: raw.arc.width,
        thickness: raw.arc.thickness,
      },
      reach: 'reach' in raw && raw.reach ? { fromPx: raw.reach.from, toPx: raw.reach.to } : null,
      targetHalfWidth: CONFIG.player.attack.targetHalfWidth,
      targetHalfHeight: CONFIG.player.attack.targetHalfHeight,
      hitstopTicks: raw.hitstop,
      knockbackVx: raw.knockbackVx,
      launchVy: raw.launchVy,
      selfVy: 'selfVy' in raw && typeof raw.selfVy === 'number' ? raw.selfVy : 0,
      lungeVx: 'lungeVx' in raw && typeof raw.lungeVx === 'number' ? raw.lungeVx : 0,
      airBrake: 'airBrake' in raw && Boolean(raw.airBrake),
      groundImpact: 'groundImpact' in raw && Boolean(raw.groundImpact),
    };
  }
  return result as AttackMoveSet;
}

export class World {
  private tick = 0;
  private entities: EntityState[] = [];
  private targets: EntityState[] = [];
  private platforms: readonly Platform[] = [];
  private input: GameAction[] = [];
  private jumpHeld = false;
  private lightAttackHeld = false;
  private heavyAttackHeld = false;
  private grabHeld = false;
  private dodgeHeld = false;
  private magicHeld = false;
  private activeScenario: string = DEFAULT_SCENARIO;
  private targetPhysics = false;
  private readonly moveSet: AttackMoveSet = buildAttackMoveSet();
  private orbs: OrbState[] = [];
  private orbIdCounter = 0;
  private arrows: ArrowState[] = [];
  private arrowIdCounter = 0;
  private chests: ChestState[] = [];
  private checkpoints: CheckpointState[] = [];
  private activeCheckpointId: string | null = null;
  private savedPlayerData: SavedPlayerData | null = null;
  private savedOpenedChestIds: Set<string> = new Set();
  private checkpointActivatedNotice: string | null = null;
  private waveManager: WaveManager | null = null;
  private waveEnemyIdCounter = 0;
  private arenaManager: ArenaManager | null = null;
  private mapData: LevelMapData | null = null;
  private cameraX = 0;
  private arenaTriggered = false;
  private hydraSlamImpactNotice = false;
  private hydraDefeatedNotice = false;
  private flowState: GameFlowState = 'playing';
  private pauseHeld = false;
  private totalKills = 0;

  constructor() {
    this.loadScenario(DEFAULT_SCENARIO);
    // The game boots on the title screen; scenarios loaded later start playing.
    this.flowState = 'title';
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

  getFlowState(): GameFlowState {
    return this.flowState;
  }

  setFlowState(state: GameFlowState): void {
    this.flowState = state;
  }

  triggerVictory(): void {
    this.flowState = 'victory';
  }

  getCombatStats(): CombatStats {
    const player = this.peekEntity(PLAYER_ID);
    const waveKills = this.waveManager ? this.waveManager.getState(this.targets).totalKills : 0;
    const kills = Math.max(this.totalKills, waveKills);
    const chestsOpened = this.chests.filter((c) => c.state === 'open').length;
    const redOrbs = player?.redOrbs ?? 0;
    const weaponLevel = player?.weaponLevel ?? 1;
    let rank = 'GUERRERO ESPARTANO';
    if (kills >= 10 || redOrbs >= 100) rank = 'HÉROE DEL OLIMPO';
    if (kills >= 15 && weaponLevel >= 2) rank = 'DIOS DE LA GUERRA';
    return {
      totalKills: kills,
      redOrbs,
      chestsOpened,
      totalChests: this.chests.length,
      weaponLevel,
      rank,
    };
  }

  peekEntity(id: string): Readonly<EntityState> | undefined {
    return this.entities.find((candidate) => candidate.id === id);
  }

  peekTargets(): readonly Readonly<EntityState>[] {
    return this.targets;
  }

  peekOrbs(): readonly OrbState[] {
    return this.orbs;
  }

  peekArrows(): readonly ArrowState[] {
    return this.arrows;
  }

  peekChests(): readonly ChestState[] {
    return this.chests;
  }

  collectGorgonEye(target?: EntityState): boolean {
    const p = target ?? this.peekEntity(PLAYER_ID);
    if (!p) return false;
    const ok = collectGorgonEye(p);
    if (this.activeCheckpointId) {
      this.savedPlayerData = capturePlayerData(p);
    }
    return ok;
  }

  collectPhoenixFeather(target?: EntityState): boolean {
    const p = target ?? this.peekEntity(PLAYER_ID);
    if (!p) return false;
    const ok = collectPhoenixFeather(p);
    if (this.activeCheckpointId) {
      this.savedPlayerData = capturePlayerData(p);
    }
    return ok;
  }

  upgradeWeapon(target?: EntityState): boolean {
    const p = target ?? this.peekEntity(PLAYER_ID);
    if (!p) return false;
    const ok = upgradeWeapon(p);
    if (ok && this.activeCheckpointId) {
      this.savedPlayerData = capturePlayerData(p);
    }
    return ok;
  }

  spawnEnemy(kind: 'legionnaire' | 'archer', x: number, facing: -1 | 1 = -1): EntityState {
    return this.spawnWaveEnemy(kind, x, facing);
  }

  peekCheckpoints(): readonly CheckpointState[] {
    return this.checkpoints;
  }

  getActiveCheckpoint(): CheckpointState | undefined {
    return this.checkpoints.find((c) => c.id === this.activeCheckpointId);
  }

  consumeCheckpointNotice(): string | null {
    const notice = this.checkpointActivatedNotice;
    this.checkpointActivatedNotice = null;
    return notice;
  }

  activateCheckpoint(id: string): boolean {
    const chk = this.checkpoints.find((c) => c.id === id);
    if (!chk) return false;
    chk.active = true;
    this.activeCheckpointId = id;
    const player = this.peekEntity(PLAYER_ID);
    if (player) {
      this.savedPlayerData = capturePlayerData(player);
    }
    for (const chest of this.chests) {
      if (chest.state === 'open') {
        this.savedOpenedChestIds.add(chest.id);
      }
    }
    this.checkpointActivatedNotice = chk.name;
    return true;
  }

  respawnAtCheckpoint(): boolean {
    const player = this.entities.find((e) => e.id === PLAYER_ID);
    const checkpoint = this.checkpoints.find((c) => c.id === this.activeCheckpointId);
    if (!player || !checkpoint) {
      return false;
    }

    respawnAtCheckpoint(player, checkpoint, this.savedPlayerData);

    // Restore opened chests state
    for (const chest of this.chests) {
      if (this.savedOpenedChestIds.has(chest.id)) {
        chest.state = 'open';
        chest.itemAbsorbed = true;
        chest.openProgressTicks = CONFIG.economy.chests.openDurationTicks;
      }
    }

    // Refocus camera if in map scenario
    if (this.mapData) {
      this.cameraX = computeCameraScrollX(
        player.x,
        this.cameraX,
        false,
        this.mapData.segments[1]?.arenaScrollX ?? 480,
        this.mapData.camera,
      );
    }

    return true;
  }

  peekWave(): WaveState | null {
    return this.waveManager ? this.waveManager.getState(this.targets) : null;
  }

  peekArena(): ArenaState | null {
    return this.arenaManager ? this.arenaManager.getState() : null;
  }

  completeWaveEncounter(): void {
    if (this.waveManager) {
      this.waveManager.completeEncounter();
    }
  }

  triggerArena(): void {
    if (this.arenaManager && !this.arenaManager.isActive()) {
      this.arenaTriggered = true;
      this.arenaManager.activate();
    }
  }

  getHydra(): EntityState | undefined {
    return this.entities.find((e) => e.kind === 'hydra');
  }

  consumeHydraSlamNotice(): boolean {
    const val = this.hydraSlamImpactNotice;
    this.hydraSlamImpactNotice = false;
    return val;
  }

  consumeHydraDefeatNotice(): boolean {
    const val = this.hydraDefeatedNotice;
    this.hydraDefeatedNotice = false;
    return val;
  }

  get cameraScrollX(): number {
    return this.cameraX;
  }

  get currentMap(): LevelMapData | null {
    return this.mapData;
  }

  private spawnWaveEnemy(kind: 'legionnaire' | 'archer', x: number, facing: -1 | 1): EntityState {
    const id = `wave-enemy-${this.waveEnemyIdCounter++}`;
    const groundY = this.platforms[0]?.yTop ?? 236;
    let spawnX = x;
    if (this.arenaManager && this.arenaManager.isActive()) {
      const minX = this.arenaManager.getMinX() + CONFIG.player.attack.targetHalfWidth;
      const maxX = this.arenaManager.getMaxX() - CONFIG.player.attack.targetHalfWidth;
      spawnX = Math.max(minX, Math.min(maxX, x));
    }
    const enemy = kind === 'archer'
      ? archerAt(id, spawnX, groundY, facing)
      : legionnaireAt(id, spawnX, groundY, facing);
    enemy.aiState = 'spawning';
    enemy.aiTicks = 0;
    enemy.vy = -160;
    enemy.grounded = false;
    this.entities.push(enemy);
    this.targets.push(enemy);
    return enemy;
  }

  spawnArrow(x: number, y: number, vx: number): ArrowState {
    const arrow: ArrowState = {
      id: `arrow-${this.arrowIdCounter++}`,
      x,
      y,
      vx,
      vy: 0,
      reflected: false,
      ageTicks: 0,
      active: true,
    };
    this.arrows.push(arrow);
    return arrow;
  }

  spawnOrbs(x: number, y: number, redCount: number, greenCount: number, blueCount: number = 0): OrbState[] {
    const newOrbs = spawnOrbsFromDeath(x, y, redCount, greenCount, blueCount, this.orbIdCounter);
    this.orbIdCounter += newOrbs.length;
    this.orbs.push(...newOrbs);
    return newOrbs;
  }

  getEntity(id: string): EntityState | undefined {
    const entity = this.peekEntity(id);
    return entity ? { ...entity } : undefined;
  }

  loadScenario(name: string): void {
    const scenario = getScenario(name);
    this.activeScenario = name;
    this.tick = 0;
    this.flowState = 'playing';
    this.pauseHeld = false;
    this.totalKills = 0;
    this.input = [];
    this.jumpHeld = false;
    this.lightAttackHeld = false;
    this.heavyAttackHeld = false;
    this.grabHeld = false;
    this.dodgeHeld = false;
    this.magicHeld = false;
    this.platforms = scenario.platforms;
    this.targetPhysics = Boolean(scenario.targetPhysics);
    this.entities = cloneEntities(scenario.entities);
    this.targets = this.entities.filter((entity) => entity.id !== PLAYER_ID);
    this.orbs = [];
    this.orbIdCounter = 0;
    this.arrows = [];
    this.arrowIdCounter = 0;
    this.chests = cloneChests(scenario.chests ?? []);
    this.checkpoints = cloneCheckpoints(scenario.checkpoints ?? []);
    this.activeCheckpointId = null;
    this.savedPlayerData = null;
    this.savedOpenedChestIds.clear();
    this.checkpointActivatedNotice = null;
    this.hydraSlamImpactNotice = false;
    this.hydraDefeatedNotice = false;
    if (name === 'waves') {
      this.waveManager = new WaveManager();
      this.waveEnemyIdCounter = 0;
      this.arenaManager = null;
      this.mapData = null;
      this.cameraX = 0;
      this.arenaTriggered = false;
    } else if (name === 'arena') {
      this.waveManager = new WaveManager();
      this.waveEnemyIdCounter = 0;
      this.arenaManager = new ArenaManager();
      this.mapData = null;
      this.cameraX = 0;
      this.arenaTriggered = false;
    } else if (name === 'level1') {
      this.mapData = buildLevel1Map();
      this.cameraX = 0;
      this.arenaTriggered = false;
      const { barrierLeftX, barrierRightX } = CONFIG.map.level1.segments.centralArena;
      this.waveManager = new WaveManager(barrierLeftX);
      this.waveEnemyIdCounter = 0;
      this.arenaManager = new ArenaManager(barrierLeftX, barrierRightX, false);
    } else {
      this.waveManager = null;
      this.arenaManager = null;
      this.mapData = null;
      this.cameraX = 0;
      this.arenaTriggered = false;
    }
  }

  targetEntities(): EntityState[] {
    return this.targets.map((entity) => ({ ...entity }));
  }

  playerAttackHitbox(): AttackHitbox | null {
    const player = this.peekEntity(PLAYER_ID);
    if (!player || player.attackPhase === 'none' || player.attackMove === 'none') {
      return null;
    }
    const params = this.moveSet[player.attackMove];
    if (!params) {
      return null;
    }
    return computeAttackHitbox(player, params, this.platforms);
  }

  /**
   * Attack params for the player's current move. Exposed so the render layer
   * can derive the blade pose from the SAME tick arithmetic the hitbox uses
   * (`bladePoseForTick`), instead of re-deriving the arc in the presentation
   * code.
   */
  playerAttackParams(): AttackParams | null {
    const player = this.peekEntity(PLAYER_ID);
    if (!player || player.attackPhase === 'none' || player.attackMove === 'none') {
      return null;
    }
    return this.moveSet[player.attackMove] ?? null;
  }

  reset(): void {
    this.loadScenario(this.activeScenario);
  }

  step(actions: readonly GameAction[] = []): void {
    this.input = sortActions(actions);

    const wantsPause = this.input.includes('pause');
    const pauseEdge = wantsPause && !this.pauseHeld;
    this.pauseHeld = wantsPause;

    if (pauseEdge) {
      if (this.flowState === 'playing') {
        this.flowState = 'paused';
        return;
      } else if (this.flowState === 'paused') {
        this.flowState = 'playing';
        return;
      }
    }

    if (this.flowState === 'paused') {
      if (this.input.includes('restart')) {
        const p = this.entities.find((entity) => entity.id === PLAYER_ID);
        if (p && p.isDead && this.activeCheckpointId) {
          this.respawnAtCheckpoint();
        } else {
          this.reset();
        }
        this.flowState = 'playing';
      }
      return;
    }

    if (this.flowState === 'title') {
      const startActions: GameAction[] = ['jump', 'light-attack', 'heavy-attack', 'context-action', 'restart'];
      if (this.input.some((a) => startActions.includes(a))) {
        this.flowState = 'playing';
      }
      return;
    }

    if (this.flowState === 'victory') {
      if (this.input.includes('restart')) {
        this.reset();
        this.flowState = 'playing';
      } else if (this.input.includes('pause')) {
        this.reset();
        this.flowState = 'title';
      }
      return;
    }

    if (this.input.includes('restart')) {
      const p = this.entities.find((entity) => entity.id === PLAYER_ID);
      if (p && p.isDead && this.activeCheckpointId) {
        this.respawnAtCheckpoint();
        this.flowState = 'playing';
        return;
      }
      this.reset();
      this.flowState = 'playing';
      return;
    }

    this.orbs = this.orbs.filter((orb) => !orb.absorbed);
    this.arrows = this.arrows.filter((arrow) => arrow.active);

    const wantsJump = this.input.includes('jump');
    const jumpEdge = wantsJump && !this.jumpHeld;
    this.jumpHeld = wantsJump;

    const wantsLightAttack = this.input.includes('light-attack');
    const lightAttackEdge = wantsLightAttack && !this.lightAttackHeld;
    this.lightAttackHeld = wantsLightAttack;

    const wantsHeavyAttack = this.input.includes('heavy-attack');
    const heavyAttackEdge = wantsHeavyAttack && !this.heavyAttackHeld;
    this.heavyAttackHeld = wantsHeavyAttack;

    const wantsGrab = this.input.includes('grab');
    const grabEdge = wantsGrab && !this.grabHeld;
    this.grabHeld = wantsGrab;

    const wantsDodge = this.input.includes('dodge');
    const dodgeEdge = wantsDodge && !this.dodgeHeld;
    this.dodgeHeld = wantsDodge;

    const wantsGuard = this.input.includes('guard');
    const wantsMagic = this.input.includes('magic');
    const magicEdge = wantsMagic && !this.magicHeld;
    this.magicHeld = wantsMagic;

    const wantsUpgrade = this.input.includes('upgrade');

    const player = this.entities.find((entity) => entity.id === PLAYER_ID);
    if (player) {
      if (player.hurtInvulTicks > 0) {
        player.hurtInvulTicks -= 1;
      }
      if (player.hitstunTicks > 0) {
        player.hitstunTicks -= 1;
      }

      if (player.isDead) {
        this.flowState = 'gameover';
        player.vx = 0;
        player.attackPhase = 'none';
        player.attackMove = 'none';
        player.attackTicks = 0;
        player.attackHits = [];
        player.attackBufferAction = null;
        player.attackBufferTicks = 0;
        player.guardPhase = 'none';
        player.guardTicks = 0;
        player.parryActive = false;
        player.rollPhase = 'none';
        player.rollTicks = 0;
        player.invulTicks = 0;
        player.magicPhase = 'none';
        player.magicTicks = 0;

        stepVertical(
          player,
          VERTICAL_PARAMS,
          TICK_DT,
          false,
          this.platforms,
          false,
          1.0,
        );
      } else {
        if (this.flowState === 'gameover') {
          this.flowState = 'playing';
        }
        const inHitstun = player.hitstunTicks > 0;
        const isOpeningChest = this.chests.some((c) => c.state === 'opening');

        // Buffer attack inputs on new flanks (edges) even during startup, recovery or hitstop (unless in hitstun or opening chest)
        if (!inHitstun && !isOpeningChest) {
          if (lightAttackEdge) {
            player.attackBufferAction = 'light-attack';
            player.attackBufferTicks = CONFIG.player.attack.inputBufferTicks;
          } else if (heavyAttackEdge) {
            player.attackBufferAction = 'heavy-attack';
            player.attackBufferTicks = CONFIG.player.attack.inputBufferTicks;
          } else if (grabEdge) {
            player.attackBufferAction = 'grab';
            player.attackBufferTicks = CONFIG.player.attack.inputBufferTicks;
          }
        }

        if (player.hitstopTicks > 0) {
          player.hitstopTicks -= 1;
          this.tick += 1;
          return;
        }

        // Invocación y ejecución de magia 'Ira de Poseidón'
        if (magicEdge && player.grounded && !inHitstun && !isOpeningChest) {
          stepMagic(player, true, this.targets);
        } else if (player.magicPhase !== 'none') {
          stepMagic(player, false, this.targets);
        }
        const nowCastingMagic = isCastingMagic(player);

        if (wantsUpgrade && !inHitstun && !isOpeningChest) {
          this.upgradeWeapon(player);
        }

        const rolling = isRolling(player);
        const attacking = isEntityAttacking(player);
        const guarding = isGuarding(player);

        // Dodge cancels guard immediately
        if (guarding && dodgeEdge && player.grounded && !inHitstun) {
          player.guardPhase = 'none';
          player.guardTicks = 0;
          player.parryActive = false;
        }

        // Dodge: only on ground, consume action on new flank (edge), uninterruptible while active
        if (!rolling && !attacking && !nowCastingMagic && !isOpeningChest && dodgeEdge && player.grounded && !inHitstun) {
          startRoll(player);
        }
        stepRoll(player);
        let nowRolling = isRolling(player);

        // Roll recovery cancellation into attack (after invulnerability window closes)
        if (nowRolling && player.invulTicks === 0 && (lightAttackEdge || heavyAttackEdge || grabEdge) && !inHitstun && !isOpeningChest) {
          player.rollPhase = 'none';
          player.rollTicks = 0;
          nowRolling = false;
        }

        const hasAttackEdge = lightAttackEdge || heavyAttackEdge || grabEdge;

        // Attack or jump cancels guard (allowing agile counterattack or jump out of guard)
        if (isGuarding(player) && (hasAttackEdge || jumpEdge) && !inHitstun) {
          player.guardPhase = 'none';
          player.guardTicks = 0;
          player.parryActive = false;
        }

        // Guard: only on ground, not rolling, not attacking, not attacking on this tick, not in hitstun, not opening chest
        if (!nowRolling && !attacking && !nowCastingMagic && !isOpeningChest && !hasAttackEdge && wantsGuard && player.grounded && player.guardPhase === 'none' && !inHitstun) {
          startGuard(player);
        }
        stepGuard(player, wantsGuard && !hasAttackEdge && !nowRolling && !nowCastingMagic && !inHitstun && !isOpeningChest);
        const nowGuarding = isGuarding(player);

        // Attack blocked during active invulnerable roll, while actively guarding, during magic, during hitstun, or while opening chest
        if (!nowRolling && !nowGuarding && !nowCastingMagic && !inHitstun && !isOpeningChest) {
          const attackInput: AttackInput = {
            light: lightAttackEdge,
            heavy: heavyAttackEdge,
            heavyHeld: wantsHeavyAttack,
            grab: grabEdge,
          };
          const attackRules: AttackRules = {
            heavyHoldTicks: CONFIG.player.attack.heavyHoldTicks,
            hitstunTicks: CONFIG.player.attack.target.hitstunTicks,
            groundImpactTicks: CONFIG.player.attack.groundImpact.durationTicks,
            shockRadius: CONFIG.player.attack.groundImpact.shockRadius,
            targetPhysics: this.targetPhysics,
          };
          stepAttack(
            player,
            attackInput,
            this.moveSet,
            this.targets,
            this.platforms,
            attackRules,
          );
        }

        // Decelerate knockback during hitstun
        if (inHitstun && player.grounded) {
          const brakeAmount = CONFIG.player.brake * TICK_DT;
          if (player.vx > 0) {
            player.vx = Math.max(0, player.vx - brakeAmount);
          } else if (player.vx < 0) {
            player.vx = Math.min(0, player.vx + brakeAmount);
          }
        }

        // Lock horizontal control/facing during rolls, active attack slashes, guard, magic, hitstun, and chest opening
        if (nowGuarding || nowCastingMagic || isOpeningChest) {
          player.vx = 0;
        }
        if (this.mapData && this.arenaManager && !this.arenaTriggered && !this.arenaManager.isActive()) {
          const arena = CONFIG.map.level1.segments.centralArena;
          if (player.x >= arena.barrierLeftX && player.x <= arena.barrierRightX) {
            this.arenaTriggered = true;
            this.arenaManager.activate();
          }
        }
        const horizontalLocked = nowRolling || player.attackPhase === 'active' || nowGuarding || inHitstun || nowCastingMagic || isOpeningChest;
        const marginX = CONFIG.player.bounds.marginX;
        const playerMinX = (this.arenaManager && this.arenaManager.isActive())
          ? this.arenaManager.getMinX() + marginX
          : (this.mapData ? marginX : CONFIG.player.minX);
        const playerMaxX = (this.arenaManager && this.arenaManager.isActive())
          ? this.arenaManager.getMaxX() - marginX
          : (this.mapData ? this.mapData.width - marginX : CONFIG.player.maxX);
        const playerMovementParams = {
          ...CONFIG.player,
          minX: playerMinX,
          maxX: playerMaxX,
        };
        stepHorizontal(
          player,
          this.input.includes('move-left'),
          this.input.includes('move-right'),
          TICK_DT,
          playerMovementParams,
          horizontalLocked,
        );
        const nowAttacking = isEntityAttacking(player);
        const canJumpEdge = jumpEdge && !nowRolling && !nowAttacking && !nowGuarding && !inHitstun && !nowCastingMagic && !isOpeningChest;
        // Air attack float: 30% gravity while active slashes slice through the air
        const isAirAttacking = !player.grounded && player.attackPhase === 'active';
        const gravityScale = isAirAttacking ? 0.3 : 1.0;
        const wantsDown = this.input.includes('move-down');
        stepVertical(
          player,
          VERTICAL_PARAMS,
          TICK_DT,
          canJumpEdge,
          this.platforms,
          nowRolling,
          gravityScale,
          wantsDown,
        );
        if (this.arenaManager && this.arenaManager.isActive()) {
          if (player.x < playerMinX) {
            player.x = playerMinX;
            player.vx = 0;
          } else if (player.x > playerMaxX) {
            player.x = playerMaxX;
            player.vx = 0;
          }
        }
      }
    }

    if (this.waveManager) {
      this.waveManager.step(this.targets, this.spawnWaveEnemy.bind(this));
    }

    if (this.targetPhysics) {
      const gravity = CONFIG.player.vertical.gravity;
      const maxFallSpeed = CONFIG.player.vertical.maxFallSpeed;
      const friction = CONFIG.player.attack.target.groundFriction;
      const targetMargin = this.mapData ? 16 : CONFIG.player.attack.targetHalfWidth;
      const minX = (this.arenaManager && this.arenaManager.isActive())
        ? this.arenaManager.getMinX() + targetMargin
        : (this.mapData ? 16 : CONFIG.player.attack.target.minX);
      const maxX = (this.arenaManager && this.arenaManager.isActive())
        ? this.arenaManager.getMaxX() - targetMargin
        : (this.mapData ? this.mapData.width - 16 : CONFIG.player.attack.target.maxX);

      for (let i = 0; i < this.targets.length; i += 1) {
        const target = this.targets[i];
        if (target.kind === 'legionnaire') {
          stepLegionnaire(target, player, this.platforms, TICK_DT);
          if (target.aiState === 'death' && target.aiTicks === 0) {
            this.totalKills += 1;
            this.spawnOrbs(
              target.x,
              target.y - 18,
              CONFIG.economy.orbs.dropPerLegionnaire.red,
              CONFIG.economy.orbs.dropPerLegionnaire.green,
              CONFIG.economy.orbs.dropPerLegionnaire.blue,
            );
            target.aiTicks = 1;
            if (this.waveManager) {
              this.waveManager.recordKill();
            }
          }
        } else if (target.kind === 'archer') {
          stepArcher(target, player, this.platforms, TICK_DT, this.spawnArrow.bind(this));
          if (target.aiState === 'death' && target.aiTicks === 0) {
            this.totalKills += 1;
            this.spawnOrbs(
              target.x,
              target.y - 18,
              CONFIG.economy.orbs.dropPerArcher.red,
              CONFIG.economy.orbs.dropPerArcher.green,
              CONFIG.economy.orbs.dropPerArcher.blue,
            );
            target.aiTicks = 1;
            if (this.waveManager) {
              this.waveManager.recordKill();
            }
          }
        } else if (target.kind === 'hydra') {
          const hydraRes = stepHydra(target, player, TICK_DT);
          if (hydraRes.slamImpact) {
            this.hydraSlamImpactNotice = true;
          }
          if (hydraRes.orbsSpawned) {
            this.totalKills += 1;
            this.spawnOrbs(
              target.x - 70,
              target.y - 30,
              CONFIG.enemy.hydra.dropOrbs.red,
              CONFIG.enemy.hydra.dropOrbs.green,
              CONFIG.enemy.hydra.dropOrbs.blue,
            );
            this.hydraDefeatedNotice = true;
          }
        }

        if (target.hitstunTicks > 0) {
          target.hitstunTicks -= 1;
        }

        if (target.kind !== 'hydra') {
          target.x += target.vx * TICK_DT;
          if (target.grounded) {
            if (target.vx > 0) {
              target.vx = Math.max(0, target.vx - friction * TICK_DT);
            } else if (target.vx < 0) {
              target.vx = Math.min(0, target.vx + friction * TICK_DT);
            }
          }
          if (target.x < minX) {
            target.x = minX;
            target.vx = 0;
          } else if (target.x > maxX) {
            target.x = maxX;
            target.vx = 0;
          }

          if (!target.grounded) {
            target.vy = Math.min(target.vy + gravity * TICK_DT, maxFallSpeed);
            target.y += target.vy * TICK_DT;
            for (let p = 0; p < this.platforms.length; p += 1) {
              const platform = this.platforms[p];
              if (target.x >= platform.x1 && target.x <= platform.x2) {
                if (target.vy >= 0 && target.y >= platform.yTop) {
                  target.y = platform.yTop;
                  target.vy = 0;
                  target.grounded = true;
                  if (target.aiState === 'spawning') {
                    target.aiState = target.kind === 'archer' ? 'reposition' : 'approach';
                    target.aiTicks = 0;
                  } else if ((target.kind === 'legionnaire' || target.kind === 'archer') && target.aiState === 'juggle') {
                    target.aiState = 'hitstun';
                    target.hitstunTicks = 12;
                    target.aiTicks = 0;
                  }
                  break;
                }
              }
            }
          }
        }
      }
    }

    stepArrows(this.arrows, player, this.targets, TICK_DT);
    if (this.arenaManager && this.arenaManager.isActive()) {
      const minX = this.arenaManager.getMinX();
      const maxX = this.arenaManager.getMaxX();
      for (let i = 0; i < this.arrows.length; i += 1) {
        const arrow = this.arrows[i];
        if (arrow.active && (arrow.x <= minX || arrow.x >= maxX)) {
          arrow.active = false;
        }
      }
    }
    stepOrbs(this.orbs, player, TICK_DT);
    stepChests(this.chests, player, this.input);

    const activatedChk = stepCheckpoints(this.checkpoints, player, this.activeCheckpointId);
    if (activatedChk) {
      this.activeCheckpointId = activatedChk.id;
      if (player) {
        this.savedPlayerData = capturePlayerData(player);
      }
      for (const chest of this.chests) {
        if (chest.state === 'open') {
          this.savedOpenedChestIds.add(chest.id);
        }
      }
      this.checkpointActivatedNotice = activatedChk.name;
    }

    if (this.arenaManager) {
      const waveState = this.waveManager ? this.waveManager.getState(this.targets) : null;
      this.arenaManager.step(waveState);
    }

    if (this.mapData && player) {
      const isArenaActive = Boolean(this.arenaManager && this.arenaManager.isActive());
      const arenaScrollX = this.mapData.segments[1]?.arenaScrollX ?? 480;
      this.cameraX = computeCameraScrollX(
        player.x,
        this.cameraX,
        isArenaActive,
        arenaScrollX,
        this.mapData.camera,
      );
    } else {
      this.cameraX = 0;
    }

    if (this.flowState === 'playing') {
      const hydra = this.entities.find((e) => e.kind === 'hydra');
      if (this.mapData && hydra && hydra.isDead && player && (player.x >= 1280 || hydra.aiTicks >= 30)) {
        this.flowState = 'victory';
      }
    }

    this.tick += 1;
  }

  snapshot(): SimulationSnapshot {
    const waveState = this.waveManager ? this.waveManager.getState(this.targets) : undefined;
    const arenaState = this.arenaManager ? this.arenaManager.getState() : undefined;
    const currentSegment = this.mapData
      ? getSegmentAtX(this.mapData, this.peekEntity(PLAYER_ID)?.x ?? 0)
      : undefined;
    const hydra = this.entities.find((e) => e.kind === 'hydra');
    const bossPayload = hydra
      ? {
          bossHp: hydra.hp,
          bossMaxHp: hydra.maxHp,
          bossState: hydra.aiState,
          bossName: CONFIG.presentation.hud.boss?.name ?? 'LA HIDRA DE LERNA',
        }
      : {};
    const payload = {
      frame: this.tick,
      timeMs: this.timeMs,
      flowState: this.flowState,
      entities: this.entities.map((entity) => ({ ...entity })),
      orbs: this.orbs.map((orb) => ({ ...orb })),
      arrows: this.arrows.map((arrow) => ({ ...arrow })),
      chests: this.chests.map((chest) => ({ ...chest })),
      checkpoints: this.checkpoints.map((chk) => ({ ...chk })),
      activeCheckpointId: this.activeCheckpointId,
      ...(waveState ? { wave: waveState } : {}),
      ...(arenaState ? { arena: arenaState } : {}),
      ...(this.mapData
        ? {
            cameraX: this.cameraX,
            segmentId: currentSegment?.id,
            segmentName: currentSegment?.name,
          }
        : {}),
      ...bossPayload,
      stats: this.getCombatStats(),
      input: [...this.input],
    };
    return {
      ...payload,
      checksum: checksumOf(payload),
    };
  }
}
