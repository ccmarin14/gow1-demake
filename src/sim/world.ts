import { CONFIG, ROLL_ATTACK_BUFFER_TICKS } from '../config';
import { checksumOf } from './checksum';
import { stepHorizontal } from './movement';
import type { Platform } from './scenarios';
import { cloneCheckpoints, cloneChests, cloneEntities, DEFAULT_SCENARIO, getScenario, archerAt, legionnaireAt } from './scenarios';
import type { CheckpointState, ChestState, CombatStats, EntityState, GameAction, GroundFireState, GameFlowState, OrbState, ArrowState, SavedPlayerData, WaveState, ArenaState, SimulationSnapshot } from './types';
import { PLAYER_ID, sortActions } from './types';
import { stepVertical, type VerticalParams } from './vertical';
import { spawnOrbsFromDeath, stepOrbs } from './orbs';
import { stepArcher, stepArrows } from './archer';
import { stepChests, collectGorgonEye, collectPhoenixFeather } from './chests';
import { capturePlayerData, respawnAtCheckpoint, stepCheckpoints } from './checkpoint';
import { WaveManager } from './waves';
import { ArenaManager } from './arena';
import { isRolling, startRoll, stepRoll } from './roll';
import { isGuarding, startGuard, stepGuard } from './guard';
import { stepLegionnaire } from './legionnaire';
import { stepHydra } from './hydra';
import { isCastingMagic, stepMagic } from './magic';
import { isGrabbing, startGrab, stepGrab } from './grab';
import { damageEnemy } from './damage';
import { STRIKES, branchStrike, chainStrike, stepGroundFires, strikeChainTicks, strikeGravityAt, queueChain, startStrike, stepStrike, strikeCancellable, strikeLength, strikePhaseAt, type HeldDirection, type StrikeImpactNotice, type StrikeState } from './strike';
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
  groundY: CONFIG.map.level1.groundY,
  topY: CONFIG.player.vertical.topY,
};

export class World {
  private tick = 0;
  private entities: EntityState[] = [];
  private targets: EntityState[] = [];
  private platforms: readonly Platform[] = [];
  private input: GameAction[] = [];
  private jumpHeld = false;
  private dodgeHeld = false;
  private magicHeld = false;
  private grabHeld = false;
  private lightAttackHeld = false;
  /**
   * Triangle: held on the previous tick, and for how many ticks in a row.
   * The tap fires on the press for now; Ascension (hold triangle) will fire
   * once `heavyHeldTicks` passes a threshold and the tap will move to the
   * release.
   */
  private heavyAttackHeld = false;
  private heavyHeldTicks = 0;
  /** A ground attack pressed during a roll waits until the roll releases control. */
  private rollAttackBuffer: { button: 'light' | 'heavy'; ticks: number } | null = null;
  private landingAttackBuffer: { button: 'light' | 'heavy'; ticks: number } | null = null;
  /** Kratos' strike in progress (`null` when not striking). */
  private strike: StrikeState | null = null;
  /** Left/right held on this tick and for how many ticks in a row (a combo turns only on a steady hold). */
  private direction: HeldDirection = 0;
  private directionTicks = 0;
  /** Ticks the whole world stays frozen after a strike connects. */
  private hitstopTicks = 0;
  private strikeHitNotice: { x: number; y: number; power: number; kind: 'light' | 'heavy' | 'air' } | null = null;
  /** A jump pressed during a ground strike, remembered for a few ticks (it fires once the strike ends). */
  private jumpQueuedTicks = 0;
  /** A ground grab pressed during a strike's slash/hold/recall, fired once its chain window opens. */
  private grabQueuedTicks = 0;
  /** The strike that just ended, for a few ticks: a press then still carries the combo on. */
  private comboGrace: { state: StrikeState; ticks: number } | null = null;
  /** A strike's ground impact on the last tick (the view adds flash, dust and a shake). */
  private strikeImpactNotice: StrikeImpactNotice | null = null;
  /** Fire left burning on the ground by strikes (Plume), outliving them. */
  private groundFires: GroundFireState[] = [];
  private activeScenario: string = DEFAULT_SCENARIO;
  private targetPhysics = false;
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
  private resetNotice = false;
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
    let rank = 'GUERRERO ESPARTANO';
    if (kills >= 10 || redOrbs >= 100) rank = 'HÉROE DEL OLIMPO';
    if (kills >= 15) rank = 'DIOS DE LA GUERRA';
    return {
      totalKills: kills,
      redOrbs,
      chestsOpened,
      totalChests: this.chests.length,
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

  spawnEnemy(kind: 'legionnaire' | 'archer', x: number, facing: -1 | 1 = -1, immediate = true): EntityState {
    const enemy = this.spawnWaveEnemy(kind, x, facing);
    if (immediate) {
      enemy.aiState = kind === 'archer' ? 'idle' : 'approach';
      enemy.vy = 0;
      enemy.grounded = true;
    }
    return enemy;
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

  /** Fire burning on the ground, read by the view. */
  peekGroundFires(): readonly GroundFireState[] {
    return this.groundFires;
  }

  /** Kratos' strike in progress, read by the view (`null` when not striking). */
  peekStrike(): Readonly<StrikeState> | null {
    return this.strike;
  }

  /** Where the blade last connected, once (for the hit sound and sparks). */
  /** The last strike ground impact, once (for the view's flash, dust and shake). */
  consumeStrikeImpactNotice(): StrikeImpactNotice | null {
    const notice = this.strikeImpactNotice;
    this.strikeImpactNotice = null;
    return notice;
  }

  consumeStrikeHitNotice(): { x: number; y: number; power: number; kind: 'light' | 'heavy' | 'air' } | null {
    const notice = this.strikeHitNotice;
    this.strikeHitNotice = null;
    return notice;
  }

  consumeHydraDefeatNotice(): boolean {
    const val = this.hydraDefeatedNotice;
    this.hydraDefeatedNotice = false;
    return val;
  }

  consumeResetNotice(): boolean {
    const val = this.resetNotice;
    this.resetNotice = false;
    return val;
  }

  get cameraScrollX(): number {
    return this.cameraX;
  }

  get currentMap(): LevelMapData | null {
    return this.mapData;
  }

  private altitudeAboveGround(player: EntityState): number {
    let groundY = Infinity;
    for (const p of this.platforms) {
      if (player.dropThroughTicks > 0 && p.yTop < VERTICAL_PARAMS.groundY) {
        continue;
      }
      if (player.x >= p.x1 && player.x <= p.x2 && p.yTop >= player.y) {
        if (p.yTop < groundY) groundY = p.yTop;
      }
    }
    return groundY === Infinity ? Infinity : groundY - player.y;
  }

  private spawnWaveEnemy(kind: 'legionnaire' | 'archer', x: number, facing: -1 | 1): EntityState {
    const id = `wave-enemy-${this.waveEnemyIdCounter++}`;
    const groundY = this.platforms[0]?.yTop ?? 236;
    let spawnX = x;
    if (this.arenaManager && this.arenaManager.isActive()) {
      const minX = this.arenaManager.getMinX() + CONFIG.combat.target.halfWidth;
      const maxX = this.arenaManager.getMaxX() - CONFIG.combat.target.halfWidth;
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
    this.dodgeHeld = false;
    this.magicHeld = false;
    this.grabHeld = false;
    this.lightAttackHeld = false;
    this.heavyAttackHeld = false;
    this.heavyHeldTicks = 0;
    this.strikeImpactNotice = null;
    this.groundFires = [];
    this.strike = null;
    this.rollAttackBuffer = null;
    this.landingAttackBuffer = null;
    this.direction = 0;
    this.directionTicks = 0;
    this.hitstopTicks = 0;
    this.strikeHitNotice = null;
    this.jumpQueuedTicks = 0;
    this.grabQueuedTicks = 0;
    this.comboGrace = null;
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
      // No waves or arena in the level for now (D-33); the `waves` and `arena`
      // scenarios keep both systems.
      this.waveManager = null;
      this.arenaManager = null;
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

  reset(): void {
    this.loadScenario(this.activeScenario);
    this.resetNotice = true;
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
      const startActions: GameAction[] = ['jump', 'context-action', 'restart'];
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

    const wantsDodge = this.input.includes('dodge');
    const dodgeEdge = wantsDodge && !this.dodgeHeld;
    this.dodgeHeld = wantsDodge;

    const wantsGuard = this.input.includes('guard');
    const wantsGrab = this.input.includes('grab');
    const grabEdge = wantsGrab && !this.grabHeld;
    this.grabHeld = wantsGrab;

    const wantsMagic = this.input.includes('magic');
    const magicEdge = wantsMagic && !this.magicHeld;
    this.magicHeld = wantsMagic;

    const wantsLightAttack = this.input.includes('light-attack');
    const lightAttackEdge = wantsLightAttack && !this.lightAttackHeld;
    this.lightAttackHeld = wantsLightAttack;

    const wantsHeavyAttack = this.input.includes('heavy-attack');
    const heavyAttackPress = wantsHeavyAttack && !this.heavyAttackHeld;
    this.heavyAttackHeld = wantsHeavyAttack;
    this.heavyHeldTicks = wantsHeavyAttack ? this.heavyHeldTicks + 1 : 0;

    // A combo turns around only on a direction held for a few ticks, so a
    // touch stick grazed sideways does not flip it.
    const direction = heldDirection(this.input);
    this.directionTicks = direction !== 0 && direction === this.direction ? this.directionTicks + 1 : 1;
    this.direction = direction;
    const steadyDirection: HeldDirection =
      direction !== 0 && this.directionTicks >= CONFIG.combat.feel.comboTurnMinTicks ? direction : 0;

    // A strike that connects freezes the whole world for a few ticks; a press
    // made meanwhile still queues the next strike of the combo.
    if (this.hitstopTicks > 0) {
      if (this.strike && lightAttackEdge) {
        queueChain(this.strike, steadyDirection);
      }
      if (this.strike && heavyAttackPress) {
        queueChain(this.strike, steadyDirection, 'heavy');
      }
      if (this.strike && grabEdge) {
        const playerNow = this.entities.find((entity) => entity.id === PLAYER_ID);
        const juggledNow = Boolean(
          playerNow &&
            this.targets.some(
              (t) =>
                t.id !== playerNow.id &&
                !t.isDead &&
                (t.aiState === 'juggle' || !t.grounded) &&
                (t.x - playerNow.x) * playerNow.facing >= -12 &&
                (t.x - playerNow.x) * playerNow.facing <= 110,
            ),
        );
        if (juggledNow || this.strike.id === 'launcher' || this.strike.id === 'ascension') {
          queueChain(this.strike, steadyDirection, 'grab');
        } else if (!STRIKES[this.strike.id].air) {
          this.grabQueuedTicks = 16;
        }
      }
      if (this.strike && jumpEdge) {
        this.jumpQueuedTicks = CONFIG.combat.feel.jumpQueueTicks;
      }
      this.hitstopTicks -= 1;
      this.tick += 1;
      return;
    }

    const newFires: GroundFireState[] = [];
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
        player.guardPhase = 'none';
        player.guardTicks = 0;
        player.parryActive = false;
        player.rollPhase = 'none';
        player.rollTicks = 0;
        player.invulTicks = 0;
        player.magicPhase = 'none';
        player.magicTicks = 0;
        player.grabPhase = 'none';
        player.grabTicks = 0;
        player.grabTargetId = null;
        this.strike = null;

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

        // Taking a hit or leaving the ground cuts the strike short; so do
        // guarding or jumping in its cancel window (the guard or jump then
        // starts below as usual). Phases with leapVy or waiting to land are allowed airborne.
        if (this.strike) {
          const def = STRIKES[this.strike.id];
          const phase = strikePhaseAt(def, this.strike.tick).phase;
          const airborneOk = def.air || phase.airborne || phase.leapVy !== undefined || phase.until?.event === 'grounded';
          if (inHitstun || (!player.grounded && !airborneOk)) {
            this.strike = null;
          }
        }
        // Landing from an air strike: if Kratos is on the ground, pressing an attack or having a buffered landing attack cuts recovery to start a ground attack.
        if (this.strike && STRIKES[this.strike.id].air && player.grounded && (lightAttackEdge || heavyAttackPress || this.landingAttackBuffer)) {
          this.strike = null;
        }
        if (this.strike && strikeCancellable(STRIKES[this.strike.id], this.strike.tick) && (wantsGuard || jumpEdge)) {
          this.strike = null;
        }
        // A jump pressed during a ground strike waits for it to end instead of being lost.
        if (this.strike && jumpEdge) {
          this.jumpQueuedTicks = CONFIG.combat.feel.jumpQueueTicks;
        }
        const jumpNow = jumpEdge || (this.jumpQueuedTicks > 0 && this.strike === null);
        if (this.strike === null) {
          this.jumpQueuedTicks = jumpNow ? 0 : Math.max(0, this.jumpQueuedTicks - 1);
        }
        let striking = this.strike !== null;

        // Invocación y ejecución de magia 'Ira de Poseidón'
        if (magicEdge && player.grounded && !inHitstun && !isOpeningChest && !striking) {
          stepMagic(player, true, this.targets);
        } else if (player.magicPhase !== 'none') {
          stepMagic(player, false, this.targets);
        }
        const nowCastingMagic = isCastingMagic(player);
        const rolling = isRolling(player);
        const guarding = isGuarding(player);

        // Invocación y ejecución de agarre (○ / tecla K o L, BL-06, D-42)
        if (inHitstun && player.grabPhase !== 'none') {
          player.grabPhase = 'none';
          player.grabTicks = 0;
          player.grabTargetId = null;
        }
        const hasJuggledAhead = this.targets.some(
          (t) =>
            t.id !== player.id &&
            !t.isDead &&
            (t.aiState === 'juggle' || !t.grounded) &&
            (t.x - player.x) * player.facing >= -12 &&
            (t.x - player.x) * player.facing <= 110,
        );
        // Pulsar ○ desde el tajo de un golpe terrestre (tick >= 5) recuerda el agarre para encadenarlo al abrir la ventana
        if (grabEdge && this.strike && !STRIKES[this.strike.id].air && this.strike.id !== 'launcher' && this.strike.tick >= 5 && !hasJuggledAhead) {
          this.grabQueuedTicks = 16;
        }
        const strikeChainWindow = this.strike ? strikeChainTicks(STRIKES[this.strike.id]) : null;
        const canCancelStrikeToGrab = Boolean(
          this.strike &&
            !STRIKES[this.strike.id].air &&
            this.strike.id !== 'launcher' &&
            ((strikeChainWindow && this.strike.tick >= strikeChainWindow.opens) ||
              strikeCancellable(STRIKES[this.strike.id], this.strike.tick)),
        );
        const wantsGroundGrabNow =
          (grabEdge && (!striking || canCancelStrikeToGrab)) ||
          (this.grabQueuedTicks > 0 && (!striking || canCancelStrikeToGrab));
        if (!striking || canCancelStrikeToGrab) {
          this.grabQueuedTicks = wantsGroundGrabNow ? 0 : Math.max(0, this.grabQueuedTicks - 1);
        }
        let grabStartedNow = false;
        if (
          wantsGroundGrabNow &&
          player.grounded &&
          !inHitstun &&
          !isOpeningChest &&
          (!striking || canCancelStrikeToGrab) &&
          !nowCastingMagic &&
          !rolling &&
          !guarding &&
          player.grabPhase === 'none' &&
          !hasJuggledAhead
        ) {
          this.strike = null;
          striking = false;
          this.comboGrace = null;
          grabStartedNow = startGrab(player, this.targets);
        }
        if (player.grabPhase !== 'none') {
          const followUpEdges: GameAction[] = [];
          if (!grabStartedNow) {
            if (lightAttackEdge) followUpEdges.push('light-attack');
            if (heavyAttackPress) followUpEdges.push('heavy-attack');
            if (grabEdge) followUpEdges.push('grab');
            if (jumpEdge) followUpEdges.push('jump');
            if (dodgeEdge) followUpEdges.push('dodge');
          }
          stepGrab(player, this.targets, followUpEdges);
          if (player.grabPhase === 'pummel' && player.grabTicks === 4) {
            this.strikeHitNotice = {
              x: player.x + player.facing * 16,
              y: player.y - 18,
              power: CONFIG.player.grab.chain.punchDamage,
              kind: 'light',
            };
          } else if (player.grabPhase === 'stab' && player.grabTicks === 4) {
            this.strikeHitNotice = {
              x: player.x + player.facing * 20,
              y: player.y - 6,
              power: CONFIG.player.grab.chain.stabDamage,
              kind: 'light',
            };
          } else if (player.grabPhase === 'throw' && player.grabTicks === 6) {
            this.strikeHitNotice = {
              x: player.x + player.facing * 20,
              y: player.y - 24,
              power: CONFIG.player.grab.throwDamage,
              kind: 'heavy',
            };
          } else if (player.grabPhase === 'break' && player.grabTicks === 11) {
            this.strikeImpactNotice = {
              x: player.x + player.facing * 18,
              y: player.y,
              dust: [player.x + player.facing * 8, player.x + player.facing * 28],
              shake: { px: 5, ticks: 8 },
            };
            this.strikeHitNotice = {
              x: player.x + player.facing * 18,
              y: player.y - 12,
              power: CONFIG.player.grab.breakDamage,
              kind: 'heavy',
            };
          } else if ((player.grabPhase === 'slam' || player.grabPhase === 'finisher_slam') && player.grabTicks === 10) {
            this.strikeImpactNotice = {
              x: player.x + player.facing * 18,
              y: player.y,
              dust: [player.x + player.facing * 10, player.x + player.facing * 26],
              shake: { px: 4, ticks: 7 },
            };
            this.strikeHitNotice = {
              x: player.x + player.facing * 18,
              y: player.y - 8,
              power: CONFIG.player.grab.damage,
              kind: 'heavy',
            };
          }
        }
        const nowGrabbing = isGrabbing(player);
        const grabBreakFreeRelease = player.grabPhase === 'recovery' && player.grabTicks === 0;

        if (rolling && (lightAttackEdge || heavyAttackPress)) {
          this.rollAttackBuffer = {
            button: heavyAttackPress ? 'heavy' : 'light',
            ticks: ROLL_ATTACK_BUFFER_TICKS,
          };
        }

        // Square 1: on the J edge, on the ground and free. Mid-strike, J
        // queues the next strike of the combo, which starts once the chain
        // window opens (from the strike's pose, not from the guard).
        let startedNow = false;
        let bufferedNow = false;
        const free = player.grounded && !rolling && !guarding && !nowCastingMagic && !nowGrabbing && !inHitstun && !isOpeningChest;
        // In the air, square starts the air square and triangle the air triangle.
        const airFree = !player.grounded && !rolling && !guarding && !nowCastingMagic && !nowGrabbing && !inHitstun && !isOpeningChest;
        // A press just after a strike ended still carries the combo on, from
        // that strike's last pose: the chain does not close the instant the
        // animation does (a finger on a phone is not frame-exact).
        let graceChained = false;
        const grace = this.comboGrace;
        const grabAllowedForHarpoon =
          grabEdge && (hasJuggledAhead || this.strike?.id === 'launcher' || this.strike?.id === 'ascension');
        if (grace && !striking && (lightAttackEdge || heavyAttackPress || grabAllowedForHarpoon)) {
          const usable = STRIKES[grace.state.id].air ? airFree : free;
          if (usable) {
            const state: StrikeState = { ...grace.state, tick: strikeLength(STRIKES[grace.state.id]) - 1, queued: false };
            delete state.queuedHeavy;
            delete state.queuedGrab;
            delete state.queuedDirection;
            queueChain(state, steadyDirection, grabAllowedForHarpoon ? 'grab' : heavyAttackPress ? 'heavy' : 'light');
            const next = chainStrike(state, player, steadyDirection);
            if (next) {
              this.strike = next;
              startedNow = true;
              graceChained = true;
            }
          }
        }
        if (graceChained) {
          this.comboGrace = null;
        } else if (!striking && grabAllowedForHarpoon && free) {
          // Orion's Harpoon from the ground ONLY when an enemy is airborne in front of Kratos.
          this.strike = startStrike(player, 'harpoon');
          startedNow = true;
        } else if (!striking && heavyAttackPress && free) {
          // Triangle from the ground, on the press (see `heavyHeldTicks`); a
          // direction held as it starts turns Kratos that way first. It does
          // not chain (triangle triangle is a level-3 combo).
          if (direction !== 0) player.facing = direction;
          this.strike = startStrike(player, 'triangle');
          startedNow = true;
        } else if (!striking && lightAttackEdge && free) {
          this.strike = startStrike(player, 'square1');
          startedNow = true;
        } else if (!striking && this.landingAttackBuffer && free) {
          const buffered = this.landingAttackBuffer;
          this.landingAttackBuffer = null;
          if (direction !== 0) player.facing = direction;
          this.strike = startStrike(player, buffered.button === 'heavy' ? 'triangle' : 'square1');
          startedNow = true;
        } else if (!striking && airFree && (lightAttackEdge || heavyAttackPress || grabAllowedForHarpoon)) {
          if (grabAllowedForHarpoon) {
            this.strike = startStrike(player, 'harpoon');
            startedNow = true;
          } else if (heavyAttackPress && player.vy >= 0 && this.altitudeAboveGround(player) < CONFIG.combat.feel.minAirHeavyAltitudePx) {
            this.landingAttackBuffer = {
              button: 'heavy',
              ticks: CONFIG.combat.feel.landingAttackBufferTicks,
            };
            bufferedNow = true;
          } else {
            this.strike = startStrike(player, heavyAttackPress ? 'airTriangle' : 'air1');
            startedNow = true;
          }
        } else if (this.strike) {
          if (this.strike.id === 'ascension' && grabEdge && hasJuggledAhead && !player.grounded) {
            this.strike = startStrike(player, 'harpoon');
            startedNow = true;
          } else {
            // Triangle held through its windup branches (Ascension), unless Circle was already queued for Harpoon.
            const branched = this.strike.queuedGrab ? null : branchStrike(this.strike, player, this.heavyHeldTicks);
            if (branched) {
              this.strike = branched;
              startedNow = true;
            }
            if (lightAttackEdge) {
              queueChain(this.strike, steadyDirection);
            }
            // Triangle in a square's chain window starts the plain triangle.
            if (heavyAttackPress) {
              queueChain(this.strike, steadyDirection, 'heavy');
            }
            // Circle in launcher or air combo chain window starts Orion's Harpoon.
            if (grabAllowedForHarpoon) {
              queueChain(this.strike, steadyDirection, 'grab');
            }
            const next = chainStrike(this.strike, player, steadyDirection);
            if (next) {
              if (next.id === 'airTriangle' && player.vy >= 0 && this.altitudeAboveGround(player) < CONFIG.combat.feel.minAirHeavyAltitudePx) {
                this.landingAttackBuffer = {
                  button: 'heavy',
                  ticks: CONFIG.combat.feel.landingAttackBufferTicks,
                };
                bufferedNow = true;
              } else {
                this.strike = next;
                startedNow = true;
              }
            }
          }
        }
        // Attacking in the air spends the double jump: no more jumps until he lands.
        if (this.strike && startedNow && STRIKES[this.strike.id].air && !player.grounded) {
          player.jumpsUsed = VERTICAL_PARAMS.maxJumps;
        }
        // The air lashes and the air triangle's loop hang Kratos: a fall already
        // under way is cut to a crawl as the strike starts (GoW 1 keeps him
        // floating through the whole air combo).
        if (
          this.strike &&
          startedNow &&
          (this.strike.id === 'harpoon' ||
            CONFIG.combat.feel.hoverStrikes.includes(this.strike.id as typeof CONFIG.combat.feel.hoverStrikes[number]))
        ) {
          player.vy =
            this.strike.id === 'harpoon'
              ? Math.max(-40, Math.min(20, player.vy))
              : Math.max(CONFIG.combat.feel.hoverVyMin, Math.min(CONFIG.combat.feel.hoverVyMax, player.vy));
        }
        let nowStriking = this.strike !== null;
        if (this.comboGrace) {
          this.comboGrace.ticks -= 1;
          if (nowStriking || this.comboGrace.ticks <= 0) this.comboGrace = null;
        }
        if (this.landingAttackBuffer && !bufferedNow) {
          this.landingAttackBuffer.ticks -= 1;
          if (this.landingAttackBuffer.ticks <= 0) this.landingAttackBuffer = null;
        }

        // Dodge cancels guard immediately
        if (guarding && dodgeEdge && player.grounded && !inHitstun && !nowStriking) {
          player.guardPhase = 'none';
          player.guardTicks = 0;
          player.parryActive = false;
        }

        // Dodge: only on ground, consume action on new flank (edge), uninterruptible while active
        if (!rolling && !nowCastingMagic && !nowGrabbing && !isOpeningChest && !nowStriking && dodgeEdge && player.grounded && !inHitstun) {
          const wantsLeft = this.input.includes('move-left');
          const wantsRight = this.input.includes('move-right');
          startRoll(player, wantsLeft === wantsRight ? 0 : wantsRight ? 1 : -1);
        }
        stepRoll(player);
        const nowRolling = isRolling(player);
        if (!nowRolling && this.strike === null && this.rollAttackBuffer) {
          const buffered = this.rollAttackBuffer;
          this.rollAttackBuffer = null;
          if (player.grounded && !guarding && !nowCastingMagic && !nowGrabbing && !inHitstun && !isOpeningChest) {
            if (direction !== 0) player.facing = direction;
            this.strike = startStrike(player, buffered.button === 'heavy' ? 'triangle' : 'square1');
            startedNow = true;
          }
        } else if (!nowRolling && this.rollAttackBuffer) {
          this.rollAttackBuffer.ticks -= 1;
          if (this.rollAttackBuffer.ticks <= 0) this.rollAttackBuffer = null;
        }
        nowStriking = this.strike !== null;

        // Jump cancels guard (jump out of guard)
        if (isGuarding(player) && jumpEdge && !inHitstun) {
          player.guardPhase = 'none';
          player.guardTicks = 0;
          player.parryActive = false;
        }

        // Guard: only on ground, not rolling, not casting, not in hitstun, not opening chest
        if (!nowRolling && !nowCastingMagic && !nowGrabbing && !isOpeningChest && !nowStriking && wantsGuard && player.grounded && player.guardPhase === 'none' && !inHitstun) {
          startGuard(player);
        }
        stepGuard(player, wantsGuard && !nowRolling && !nowCastingMagic && !nowGrabbing && !inHitstun && !isOpeningChest && !nowStriking);
        const nowGuarding = isGuarding(player);

        // Decelerate knockback during hitstun
        if (inHitstun && player.grounded) {
          const brakeAmount = CONFIG.player.brake * TICK_DT;
          if (player.vx > 0) {
            player.vx = Math.max(0, player.vx - brakeAmount);
          } else if (player.vx < 0) {
            player.vx = Math.min(0, player.vx + brakeAmount);
          }
        }

        // Lock horizontal control/facing during rolls, guard, magic, hitstun, and chest opening
        if (
          nowGuarding ||
          nowCastingMagic ||
          (nowGrabbing && player.grabPhase !== 'whiff' && !grabBreakFreeRelease) ||
          isOpeningChest ||
          nowStriking
        ) {
          player.vx = 0;
        }
        if (this.mapData && this.arenaManager && !this.arenaTriggered && !this.arenaManager.isActive()) {
          const arena = CONFIG.map.level1.segments.centralArena;
          if (player.x >= arena.barrierLeftX && player.x <= arena.barrierRightX) {
            this.arenaTriggered = true;
            this.arenaManager.activate();
          }
        }
        const horizontalLocked =
          nowRolling ||
          nowGuarding ||
          inHitstun ||
          nowCastingMagic ||
          (nowGrabbing && !grabBreakFreeRelease) ||
          isOpeningChest ||
          nowStriking;
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
        const canJumpEdge = jumpNow && !nowRolling && !nowGuarding && !inHitstun && !nowCastingMagic && !nowGrabbing && !isOpeningChest && !nowStriking;
        const wantsDown = this.input.includes('move-down');
        // An air strike sets how fast Kratos falls for its next tick (hang time, a drop).
        // Between air lashes (the combo grace window) he keeps floating too.
        const graceGravity = !this.strike && this.comboGrace
          && CONFIG.combat.feel.hoverStrikes.includes(this.comboGrace.state.id as typeof CONFIG.combat.feel.hoverStrikes[number])
          ? CONFIG.combat.feel.graceAirGravity
          : 1;
        const strikeGravity = this.strike && !startedNow ? strikeGravityAt(STRIKES[this.strike.id], this.strike.tick + 1) : graceGravity;
        stepVertical(
          player,
          VERTICAL_PARAMS,
          TICK_DT,
          canJumpEdge,
          this.platforms,
          nowRolling,
          strikeGravity,
          wantsDown,
        );
        // The strike started this tick stays on tick 0; later ticks step it.
        if (this.strike && !startedNow) {
          const result = stepStrike(this.strike, player, this.targets, playerMinX, playerMaxX);
          if (result.impact) {
            this.strikeImpactNotice = result.impact;
          }
          if (result.fires) {
            // Added after this tick's burn: a fire hits from the tick after it appears.
            newFires.push(...result.fires);
          }
          if (result.done) {
            this.comboGrace = STRIKES[this.strike.id].chain ? { state: { ...this.strike }, ticks: CONFIG.combat.feel.comboGraceTicks } : null;
            this.strike = null;
          } else if (result.hits.length > 0) {
            const def = STRIKES[this.strike.id];
            // A heavy blow holds the world a little longer and throws the target back.
            const isHeavy = Boolean(def.heavy || def.damage >= CONFIG.combat.feel.heavyDamage);
            this.hitstopTicks = def.hitstopTicks + (isHeavy ? CONFIG.combat.feel.heavyExtraHitstop : 0);
            const last = result.hits[result.hits.length - 1];
            const kind = def.air
              ? 'air'
              : isHeavy
                ? 'heavy'
                : 'light';
            this.strikeHitNotice = { x: last.x, y: last.y, power: def.damage, kind };
            if (this.targetPhysics && !def.launch) {
              const knock = isHeavy
                ? CONFIG.combat.feel.knockbackHeavy
                : CONFIG.combat.feel.knockbackLight;
              for (const hit of result.hits) {
                if (hit.target.kind !== 'hydra' && !hit.target.isDead && hit.target.grounded && hit.target.aiState !== 'juggle') {
                  hit.target.vx = this.strike.facing * knock;
                }
              }
            }
          }
        }
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

    // Fire left on the ground keeps burning, even after the strike.
    if (this.groundFires.length > 0) {
      this.groundFires = stepGroundFires(this.groundFires, this.targets, this.targetPhysics).fires;
    }
    this.groundFires.push(...newFires);

    if (this.waveManager) {
      this.waveManager.step(this.targets, this.spawnWaveEnemy.bind(this));
    }

    if (this.targetPhysics) {
      const gravity = CONFIG.player.vertical.gravity;
      const maxFallSpeed = CONFIG.player.vertical.maxFallSpeed;
      const friction = CONFIG.combat.target.groundFriction;
      const targetMargin = this.mapData ? 16 : CONFIG.combat.target.halfWidth;
      const minX = (this.arenaManager && this.arenaManager.isActive())
        ? this.arenaManager.getMinX() + targetMargin
        : (this.mapData ? 16 : CONFIG.combat.target.minX);
      const maxX = (this.arenaManager && this.arenaManager.isActive())
        ? this.arenaManager.getMaxX() - targetMargin
        : (this.mapData ? this.mapData.width - 16 : CONFIG.combat.target.maxX);

      for (let i = 0; i < this.targets.length; i += 1) {
        const target = this.targets[i];
        if (target.kind === 'legionnaire') {
          stepLegionnaire(target, player, this.platforms, TICK_DT, this.targets);
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
          // Si el enemigo fue arponeado hacia Kratos (Orion's Harpoon), frena su tracción frente a Kratos para estrellarse a sus pies
          if (
            player &&
            target.aiState === 'juggle' &&
            target.vy > 100 &&
            target.vx * player.facing < 0 &&
            (target.x - player.x) * player.facing <= 18
          ) {
            target.x = player.x + player.facing * 18;
            target.vx = 0;
          }
          // Si el enemigo fue lanzado como proyectil humano (□ en agarre), derriba a otros enemigos en su trayectoria
          if (target.aiState === 'juggle' && Math.abs(target.vx) >= 180) {
            for (let j = 0; j < this.targets.length; j += 1) {
              const other = this.targets[j];
              if (
                other.id === target.id ||
                other.id === PLAYER_ID ||
                other.isDead ||
                other.aiState === 'death' ||
                other.kind === 'hydra' ||
                target.attackHits.includes(other.id)
              ) {
                continue;
              }
              if (Math.abs(other.x - target.x) <= 24 && Math.abs(other.y - target.y) <= 28) {
                target.attackHits.push(other.id);
                const killed = damageEnemy(
                  other,
                  CONFIG.player.grab.collateralDamage,
                  CONFIG.enemy.legionnaire.knockdownTicks,
                );
                this.strikeHitNotice = { x: other.x, y: other.y - 14, power: 20, kind: 'heavy' };
                this.strikeImpactNotice = {
                  x: other.x,
                  y: other.y,
                  dust: [other.x - 8, other.x + 8],
                  shake: { px: 4, ticks: 6 },
                };
                if (killed) {
                  other.aiState = 'death';
                  other.aiTicks = 0;
                  other.isDead = true;
                } else {
                  other.aiState = 'knockdown';
                  other.aiTicks = 0;
                  other.grounded = true;
                  other.vx = Math.sign(target.vx) * 60;
                  other.vy = 0;
                }
              }
            }
          }
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
                  const wasHarpoonSlam =
                    target.aiState === 'juggle' &&
                    target.vy >= 280 &&
                    player !== undefined &&
                    (target.vx * player.facing < 0 || Math.abs((target.x - player.x) * player.facing - 18) < 1);
                  target.y = platform.yTop;
                  target.vy = 0;
                  target.grounded = true;
                  if (target.aiState === 'spawning') {
                    target.aiState = target.kind === 'archer' ? 'reposition' : 'approach';
                    target.aiTicks = 0;
                  } else if (target.kind === 'legionnaire' && target.aiState === 'juggle') {
                    const wasThrownFlight = Math.abs(target.vx) >= 120;
                    target.aiState = 'knockdown';
                    target.aiTicks = 0;
                    target.vx = 0;
                    if (wasHarpoonSlam && !target.isDead) {
                      const killedBySlam = damageEnemy(target, 15, CONFIG.enemy.legionnaire.knockdownTicks);
                      if (killedBySlam) {
                        target.aiState = 'death';
                        target.aiTicks = 0;
                        target.isDead = true;
                      }
                      this.strikeImpactNotice = {
                        x: target.x,
                        y: target.y,
                        dust: [target.x - 10, target.x + 10],
                        shake: { px: 4, ticks: 7 },
                      };
                      this.strikeHitNotice = { x: target.x, y: target.y - 10, power: 25, kind: 'heavy' };
                    } else if (wasThrownFlight) {
                      this.strikeImpactNotice = {
                        x: target.x,
                        y: target.y,
                        dust: [target.x - 12, target.x + 12],
                        shake: { px: 3, ticks: 5 },
                      };
                    }
                  } else if (target.kind === 'archer' && target.aiState === 'juggle') {
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
    const player = this.peekEntity(PLAYER_ID);
    const qtePrompt =
      player && player.grabPhase === 'finisher_qte' && player.grabTargetId && player.qteAction
        ? {
            targetId: player.grabTargetId,
            action: player.qteAction,
            ticksRemaining: player.qteTicksLeft,
            maxTicks: player.qteMaxTicks,
          }
        : null;
    const currentSegment = this.mapData
      ? getSegmentAtX(this.mapData, player?.x ?? 0)
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
      ...(this.strike ? { strike: { ...this.strike, hits: [...this.strike.hits] } } : {}),
      ...(this.groundFires.length > 0 ? { groundFires: this.groundFires.map((f) => ({ ...f, hits: [...f.hits] })) } : {}),
      hitstopTicks: this.hitstopTicks,
      ...(qtePrompt ? { qtePrompt } : {}),
      input: [...this.input],
    };
    return {
      ...payload,
      checksum: checksumOf(payload),
    };
  }
}

/** Ticks a direction must be held before a combo link turns toward it. */
/** Left or right held (-1 / 1), or neither or both (0). */
function heldDirection(input: readonly GameAction[]): HeldDirection {
  const left = input.includes('move-left');
  const right = input.includes('move-right');
  return left === right ? 0 : right ? 1 : -1;
}
