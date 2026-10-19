import { CONFIG } from '../config';
import { checksumOf } from './checksum';
import { stepHorizontal } from './movement';
import type { Platform } from './scenarios';
import { cloneEntities, DEFAULT_SCENARIO, getScenario } from './scenarios';
import type { EntityState, GameAction, SimulationSnapshot } from './types';
import { PLAYER_ID, sortActions } from './types';
import { stepVertical, type VerticalParams } from './vertical';
import {
  attackParamsForChain,
  computeAttackHitbox,
  stepAttack,
  isEntityAttacking,
  type AttackCombo,
  type AttackParams,
} from './attack';
import { isRolling, startRoll, stepRoll } from './roll';

const TICK_DT = 1 / CONFIG.sim.tickRate;

function msToTicks(ms: number): number {
  return Math.round((ms * CONFIG.sim.tickRate) / 1000);
}

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
const ATTACK_COMBO: AttackCombo = {
  maxChain: CONFIG.player.attack.maxChain,
  hits: CONFIG.player.attack.combo.map((hit: any): AttackParams => ({
    startupTicks: msToTicks(hit.startupMs),
    activeTicks: msToTicks(hit.activeMs),
    recoveryTicks: msToTicks(hit.recoveryMs),
    gripOffsetY: CONFIG.player.weapon.gripOffsetY,
    arc: {
      startRad: (hit.arc.startDeg * Math.PI) / 180,
      endRad: (hit.arc.endDeg * Math.PI) / 180,
      radius: hit.arc.radius,
      width: hit.arc.width,
      thickness: hit.arc.thickness,
    },
    targetHalfWidth: CONFIG.player.attack.targetHalfWidth,
    targetHalfHeight: CONFIG.player.attack.targetHalfHeight,
  })),
};

export class World {
  private tick = 0;
  private entities: EntityState[] = [];
  private platforms: readonly Platform[] = [];
  private input: GameAction[] = [];
  private jumpHeld = false;
  private lightAttackHeld = false;
  private dodgeHeld = false;
  private activeScenario: string = DEFAULT_SCENARIO;

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

  getEntity(id: string): EntityState | undefined {
    const entity = this.entities.find((candidate) => candidate.id === id);
    return entity ? { ...entity } : undefined;
  }

  loadScenario(name: string): void {
    const scenario = getScenario(name);
    this.activeScenario = name;
    this.tick = 0;
    this.input = [];
    this.jumpHeld = false;
    this.lightAttackHeld = false;
    this.dodgeHeld = false;
    this.platforms = scenario.platforms;
    this.entities = cloneEntities(scenario.entities);
  }

  targetEntities(): EntityState[] {
    return this.entities
      .filter((entity) => entity.id !== PLAYER_ID)
      .map((entity) => ({ ...entity }));
  }

  playerAttackHitbox(): { x1: number; y1: number; x2: number; y2: number } | null {
    const player = this.entities.find((entity) => entity.id === PLAYER_ID);
    if (!player) {
      return null;
    }
    return computeAttackHitbox(
      player,
      attackParamsForChain(ATTACK_COMBO, player.attackChain),
    );
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

    const wantsDodge = this.input.includes('dodge');
    const dodgeEdge = wantsDodge && !this.dodgeHeld;
    this.dodgeHeld = wantsDodge;

    const player = this.entities.find((entity) => entity.id === PLAYER_ID);
    if (player) {
      const targets = this.entities.filter((e) => e.id !== PLAYER_ID);
      const rolling = isRolling(player);
      const attacking = isEntityAttacking(player);
      // Dodge: only on ground, consume action on new flank (edge), ininterruptible while active
      if (!rolling && dodgeEdge) {
        // Don't start if attacking? Requirement says "bloquea ataque durante la rodada (o acorde a diseño)" - better block starting attack during roll? but roll is the action
        // Also start only grounded
        startRoll(player);
      }
      stepRoll(player);
      const nowRolling = isRolling(player);
      // Attack blocked during roll
      if (!nowRolling) {
        stepAttack(
          player,
          lightAttackEdge,
          ATTACK_COMBO,
          targets,
        );
      }
      stepHorizontal(
        player,
        this.input.includes('move-left'),
        this.input.includes('move-right'),
        TICK_DT,
        CONFIG.player,
        nowRolling,
      );
      const canJumpEdge = jumpEdge && !nowRolling && !attacking;
      stepVertical(player, VERTICAL_PARAMS, TICK_DT, canJumpEdge, this.platforms, nowRolling);
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
