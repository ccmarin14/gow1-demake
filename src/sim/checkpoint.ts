import { CONFIG } from '../config';
import type { CheckpointState, EntityState, SavedPlayerData } from './types';

/**
 * Creates a new checkpoint state object.
 */
export function createCheckpoint(
  id: string,
  x: number,
  y: number,
  name: string,
  active = false,
): CheckpointState {
  return { id, x, y, name, active };
}

/**
 * Checks proximity between player and a checkpoint.
 */
export function isNearCheckpoint(player: EntityState, checkpoint: CheckpointState): boolean {
  const dx = Math.abs(player.x - checkpoint.x);
  const dy = Math.abs(player.y - checkpoint.y);
  return (
    dx <= CONFIG.checkpoints.activationRadius &&
    dy <= 40
  );
}

/**
 * Captures player progression snapshot for checkpoint persistence.
 */
export function capturePlayerData(player: EntityState): SavedPlayerData {
  return {
    maxHp: player.maxHp,
    hp: player.maxHp,
    maxMp: player.maxMp,
    mp: player.maxMp,
    redOrbs: player.redOrbs,
    gorgonEyes: player.gorgonEyes,
    gorgonUpgrades: player.gorgonUpgrades,
    phoenixFeathers: player.phoenixFeathers,
    phoenixUpgrades: player.phoenixUpgrades,
  };
}

/**
 * Deterministic step for checkpoints: detects if player enters activation range of an inactive checkpoint.
 * Returns the newly activated checkpoint, or null if no new activation occurred.
 */
export function stepCheckpoints(
  checkpoints: CheckpointState[],
  player: EntityState | undefined,
  currentActiveId: string | null,
): CheckpointState | null {
  if (!player || player.isDead) {
    return null;
  }

  for (let i = 0; i < checkpoints.length; i += 1) {
    const chk = checkpoints[i];
    if (isNearCheckpoint(player, chk)) {
      if (chk.id !== currentActiveId) {
        chk.active = true;
        return chk;
      }
    }
  }

  return null;
}

/**
 * Respawns player at the given checkpoint, restoring full health & mana while
 * strictly preserving accumulated progression (maxHp, maxMp, redOrbs, etc.).
 */
export function respawnAtCheckpoint(
  player: EntityState,
  checkpoint: CheckpointState,
  savedData?: SavedPlayerData | null,
): void {
  player.x = checkpoint.x;
  player.y = checkpoint.y;
  player.vx = 0;
  player.vy = 0;
  player.facing = 1;
  player.grounded = true;
  player.isDead = false;
  player.hurtInvulTicks = 0;
  player.hitstunTicks = 0;
  player.guardPhase = 'none';
  player.guardTicks = 0;
  player.parryActive = false;
  player.rollTicks = 0;
  player.invulTicks = 0;
  player.magicPhase = 'none';
  player.magicTicks = 0;
  player.grabPhase = 'none';
  player.grabTicks = 0;
  player.grabTargetId = null;
  player.qteAction = null;
  player.qteTicksLeft = 0;
  player.qteMaxTicks = 0;
  player.landingTicks = 0;

  if (savedData) {
    player.maxHp = Math.max(player.maxHp, savedData.maxHp);
    player.maxMp = Math.max(player.maxMp, savedData.maxMp);
    player.redOrbs = Math.max(player.redOrbs, savedData.redOrbs);
    player.gorgonEyes = Math.max(player.gorgonEyes, savedData.gorgonEyes);
    player.gorgonUpgrades = Math.max(player.gorgonUpgrades, savedData.gorgonUpgrades);
    player.phoenixFeathers = Math.max(player.phoenixFeathers, savedData.phoenixFeathers);
    player.phoenixUpgrades = Math.max(player.phoenixUpgrades, savedData.phoenixUpgrades);
  }
  player.hp = player.maxHp;
  player.mp = player.maxMp;
}
