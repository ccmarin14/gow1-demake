import { CONFIG } from '../config';
import { checksumOf } from './checksum';
import { stepHorizontal } from './movement';
import type { Platform } from './scenarios';
import { cloneEntities, DEFAULT_SCENARIO, getScenario } from './scenarios';
import type { AttackMoveId, EntityState, GameAction, SimulationSnapshot } from './types';
import { PLAYER_ID, sortActions } from './types';
import { stepVertical, type VerticalParams } from './vertical';
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
  private activeScenario: string = DEFAULT_SCENARIO;
  private targetPhysics = false;
  private readonly moveSet: AttackMoveSet = buildAttackMoveSet();

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
    this.platforms = scenario.platforms;
    this.targetPhysics = Boolean(scenario.targetPhysics);
    this.entities = cloneEntities(scenario.entities);
    this.targets = this.entities.filter((entity) => entity.id !== PLAYER_ID);
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

    const player = this.entities.find((entity) => entity.id === PLAYER_ID);
    if (player) {
      // Buffer attack inputs on new flanks (edges) even during startup, recovery or hitstop
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

      if (player.hitstopTicks > 0) {
        player.hitstopTicks -= 1;
        this.tick += 1;
        return;
      }

      const rolling = isRolling(player);
      const attacking = isEntityAttacking(player);
      const guarding = isGuarding(player);

      // Dodge cancels guard immediately
      if (guarding && dodgeEdge && player.grounded) {
        player.guardPhase = 'none';
        player.guardTicks = 0;
        player.parryActive = false;
      }

      // Dodge: only on ground, consume action on new flank (edge), uninterruptible while active
      if (!rolling && !attacking && dodgeEdge && player.grounded) {
        startRoll(player);
      }
      stepRoll(player);
      let nowRolling = isRolling(player);

      // Roll recovery cancellation into attack (after invulnerability window closes)
      if (nowRolling && player.invulTicks === 0 && (lightAttackEdge || heavyAttackEdge || grabEdge)) {
        player.rollPhase = 'none';
        player.rollTicks = 0;
        nowRolling = false;
      }

      const hasAttackEdge = lightAttackEdge || heavyAttackEdge || grabEdge;

      // Attack or jump cancels guard (allowing agile counterattack or jump out of guard)
      if (isGuarding(player) && (hasAttackEdge || jumpEdge)) {
        player.guardPhase = 'none';
        player.guardTicks = 0;
        player.parryActive = false;
      }

      // Guard: only on ground, not rolling, not attacking, not attacking on this tick
      if (!nowRolling && !attacking && !hasAttackEdge && wantsGuard && player.grounded && player.guardPhase === 'none') {
        startGuard(player);
      }
      stepGuard(player, wantsGuard && !hasAttackEdge && !nowRolling);
      const nowGuarding = isGuarding(player);

      // Attack blocked during active invulnerable roll or while actively guarding (unless cancelled above)
      if (!nowRolling && !nowGuarding) {
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

      // Lock horizontal control/facing during rolls, active attack slashes, and guard
      if (nowGuarding) {
        player.vx = 0;
      }
      const horizontalLocked = nowRolling || player.attackPhase === 'active' || nowGuarding;
      stepHorizontal(
        player,
        this.input.includes('move-left'),
        this.input.includes('move-right'),
        TICK_DT,
        CONFIG.player,
        horizontalLocked,
      );
      const nowAttacking = isEntityAttacking(player);
      const canJumpEdge = jumpEdge && !nowRolling && !nowAttacking && !nowGuarding;
      // Air attack float: 30% gravity while active slashes slice through the air
      const isAirAttacking = !player.grounded && player.attackPhase === 'active';
      const gravityScale = isAirAttacking ? 0.3 : 1.0;
      stepVertical(
        player,
        VERTICAL_PARAMS,
        TICK_DT,
        canJumpEdge,
        this.platforms,
        nowRolling,
        gravityScale,
      );
    }

    if (this.targetPhysics) {
      const gravity = CONFIG.player.vertical.gravity;
      const maxFallSpeed = CONFIG.player.vertical.maxFallSpeed;
      const friction = CONFIG.player.attack.target.groundFriction;
      const minX = CONFIG.player.attack.target.minX;
      const maxX = CONFIG.player.attack.target.maxX;

      for (let i = 0; i < this.targets.length; i += 1) {
        const target = this.targets[i];
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
                break;
              }
            }
          }
        }
      }
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
