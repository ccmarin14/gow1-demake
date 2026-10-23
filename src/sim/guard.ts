import { CONFIG } from '../config';
import type { EntityState } from './types';

export function startGuard(entity: EntityState): void {
  if (entity.guardPhase !== 'none' || !entity.grounded) {
    return;
  }
  const startup = CONFIG.player.guard.startupTicks;
  if (startup > 0) {
    entity.guardPhase = 'startup';
    entity.guardTicks = 0;
    entity.parryActive = false;
  } else {
    entity.guardPhase = 'active';
    entity.guardTicks = 0;
    entity.parryActive = CONFIG.player.guard.parryWindowTicks > 0;
  }
  entity.vx = 0;
}

export function stepGuard(entity: EntityState, wantsGuard: boolean): void {
  if (!entity.grounded) {
    entity.guardPhase = 'none';
    entity.guardTicks = 0;
    entity.parryActive = false;
    return;
  }

  if (entity.guardPhase === 'none') {
    entity.guardTicks = 0;
    entity.parryActive = false;
    return;
  }

  if (entity.guardPhase === 'startup') {
    if (!wantsGuard) {
      entity.guardPhase = 'recovery';
      entity.guardTicks = 0;
      entity.parryActive = false;
      return;
    }
    entity.guardTicks += 1;
    if (entity.guardTicks > CONFIG.player.guard.startupTicks) {
      entity.guardPhase = 'active';
      entity.guardTicks = 1;
      entity.parryActive = entity.guardTicks <= CONFIG.player.guard.parryWindowTicks;
    }
    return;
  }

  if (entity.guardPhase === 'active') {
    if (!wantsGuard) {
      entity.guardPhase = 'recovery';
      entity.guardTicks = 0;
      entity.parryActive = false;
      return;
    }
    entity.guardTicks += 1;
    entity.parryActive = entity.guardTicks <= CONFIG.player.guard.parryWindowTicks;
    return;
  }

  if (entity.guardPhase === 'recovery') {
    entity.parryActive = false;
    entity.guardTicks += 1;
    if (entity.guardTicks >= CONFIG.player.guard.recoveryTicks) {
      entity.guardPhase = 'none';
      entity.guardTicks = 0;
    }
    return;
  }
}

export function isGuarding(entity: EntityState): boolean {
  return entity.guardPhase !== 'none';
}

export function isParrying(entity: EntityState): boolean {
  return entity.guardPhase === 'active' && entity.parryActive;
}
