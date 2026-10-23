import { CONFIG } from '../config';
import { checksumOf } from './checksum';
import { stepHorizontal } from './movement';
import type { Platform } from './scenarios';
import { cloneEntities, DEFAULT_SCENARIO, getScenario, archerAt, legionnaireAt } from './scenarios';
import type { AttackMoveId, EntityState, GameAction, OrbState, ArrowState, WaveState, ArenaState, SimulationSnapshot } from './types';
import { PLAYER_ID, sortActions } from './types';
import { stepVertical, type VerticalParams } from './vertical';
import { spawnOrbsFromDeath, stepOrbs } from './orbs';
import { stepArcher, stepArrows } from './archer';
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
  private waveManager: WaveManager | null = null;
  private waveEnemyIdCounter = 0;
  private arenaManager: ArenaManager | null = null;
  private mapData: LevelMapData | null = null;
  private cameraX = 0;
  private arenaTriggered = false;

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
      this.waveManager = new WaveManager();
      this.waveEnemyIdCounter = 0;
      this.arenaManager = new ArenaManager(550, 890, false);
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
    if (this.input.includes('restart')) {
      this.reset();
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

    const player = this.entities.find((entity) => entity.id === PLAYER_ID);
    if (player) {
      if (player.hurtInvulTicks > 0) {
        player.hurtInvulTicks -= 1;
      }
      if (player.hitstunTicks > 0) {
        player.hitstunTicks -= 1;
      }

      if (player.isDead) {
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
        const inHitstun = player.hitstunTicks > 0;

        // Buffer attack inputs on new flanks (edges) even during startup, recovery or hitstop (unless in hitstun)
        if (!inHitstun) {
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
        if (magicEdge && player.grounded && !inHitstun) {
          stepMagic(player, true, this.targets);
        } else if (player.magicPhase !== 'none') {
          stepMagic(player, false, this.targets);
        }
        const nowCastingMagic = isCastingMagic(player);

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
        if (!rolling && !attacking && !nowCastingMagic && dodgeEdge && player.grounded && !inHitstun) {
          startRoll(player);
        }
        stepRoll(player);
        let nowRolling = isRolling(player);

        // Roll recovery cancellation into attack (after invulnerability window closes)
        if (nowRolling && player.invulTicks === 0 && (lightAttackEdge || heavyAttackEdge || grabEdge) && !inHitstun) {
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

        // Guard: only on ground, not rolling, not attacking, not attacking on this tick, not in hitstun
        if (!nowRolling && !attacking && !nowCastingMagic && !hasAttackEdge && wantsGuard && player.grounded && player.guardPhase === 'none' && !inHitstun) {
          startGuard(player);
        }
        stepGuard(player, wantsGuard && !hasAttackEdge && !nowRolling && !nowCastingMagic && !inHitstun);
        const nowGuarding = isGuarding(player);

        // Attack blocked during active invulnerable roll, while actively guarding, during magic, or during hitstun
        if (!nowRolling && !nowGuarding && !nowCastingMagic && !inHitstun) {
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

        // Lock horizontal control/facing during rolls, active attack slashes, guard, magic, and hitstun
        if (nowGuarding || nowCastingMagic) {
          player.vx = 0;
        }
        if (this.mapData && this.arenaManager && !this.arenaTriggered && !this.arenaManager.isActive()) {
          if (player.x >= 550 && player.x <= 890) {
            this.arenaTriggered = true;
            this.arenaManager.activate();
          }
        }
        const horizontalLocked = nowRolling || player.attackPhase === 'active' || nowGuarding || inHitstun || nowCastingMagic;
        const marginX = this.mapData ? 16 : (CONFIG.player.sprite.width / 2);
        const playerMinX = (this.arenaManager && this.arenaManager.isActive())
          ? this.arenaManager.getMinX() + marginX
          : (this.mapData ? 16 : CONFIG.player.minX);
        const playerMaxX = (this.arenaManager && this.arenaManager.isActive())
          ? this.arenaManager.getMaxX() - marginX
          : (this.mapData ? this.mapData.width - 16 : CONFIG.player.maxX);
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
        const canJumpEdge = jumpEdge && !nowRolling && !nowAttacking && !nowGuarding && !inHitstun && !nowCastingMagic;
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
        }

        if (target.hitstunTicks > 0) {
          target.hitstunTicks -= 1;
        }

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

    this.tick += 1;
  }

  snapshot(): SimulationSnapshot {
    const waveState = this.waveManager ? this.waveManager.getState(this.targets) : undefined;
    const arenaState = this.arenaManager ? this.arenaManager.getState() : undefined;
    const currentSegment = this.mapData
      ? getSegmentAtX(this.mapData, this.peekEntity(PLAYER_ID)?.x ?? 0)
      : undefined;
    const payload = {
      frame: this.tick,
      timeMs: this.timeMs,
      entities: this.entities.map((entity) => ({ ...entity })),
      orbs: this.orbs.map((orb) => ({ ...orb })),
      arrows: this.arrows.map((arrow) => ({ ...arrow })),
      ...(waveState ? { wave: waveState } : {}),
      ...(arenaState ? { arena: arenaState } : {}),
      ...(this.mapData
        ? {
            cameraX: this.cameraX,
            segmentId: currentSegment?.id,
            segmentName: currentSegment?.name,
          }
        : {}),
      input: [...this.input],
    };
    return {
      ...payload,
      checksum: checksumOf(payload),
    };
  }
}
