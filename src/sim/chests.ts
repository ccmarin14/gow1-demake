import { CONFIG } from '../config';
import type { ChestState, EntityState, GameAction } from './types';

/**
 * Proximity check between player and a stone chest.
 * True when player center is within horizontal interactionRadius and vertical verticalTolerance.
 */
export function isNearChest(player: EntityState, chest: ChestState): boolean {
  const dx = Math.abs(player.x - chest.x);
  const dy = Math.abs(player.y - chest.y);
  return (
    dx <= CONFIG.economy.chests.interactionRadius &&
    dy <= CONFIG.economy.chests.verticalTolerance
  );
}

/**
 * Collects a Gorgon Eye into player progression.
 * When reaching 6 eyes:
 * - maxHp expands permanently (+20 HP: 100 -> 120 HP)
 * - hp is fully restored to maxHp
 * - gorgonEyes resets to 0
 * - gorgonUpgrades increments by 1
 * Returns true if an upgrade was triggered.
 */
export function collectGorgonEye(player: EntityState): boolean {
  player.gorgonEyes += 1;
  if (player.gorgonEyes >= CONFIG.economy.chests.gorgonEyesPerUpgrade) {
    player.maxHp += CONFIG.economy.chests.healthUpgradeBonus;
    player.hp = player.maxHp;
    player.gorgonEyes = 0;
    player.gorgonUpgrades += 1;
    return true;
  }
  return false;
}

/**
 * Deterministic simulation step for chests.
 * - If chest is closed: pressing context-action ('E') while in proximity begins opening.
 * - If chest is opening: anchors Kratos (vx = 0) while openProgressTicks advances 1..24.
 * - At tick 25 (after 24 opening ticks completed): chest transitions to 'open', releases item,
 *   and absorbs it into Kratos.
 */
export function stepChests(
  chests: ChestState[],
  player: EntityState | undefined,
  actions: readonly GameAction[],
): void {
  if (!player || player.isDead) {
    return;
  }

  const wantsContextAction = actions.includes('context-action');

  for (let i = 0; i < chests.length; i += 1) {
    const chest = chests[i];

    if (chest.state === 'closed') {
      if (wantsContextAction && isNearChest(player, chest)) {
        chest.state = 'opening';
        chest.openProgressTicks = 1;
        player.vx = 0;
      }
    } else if (chest.state === 'opening') {
      player.vx = 0;
      if (chest.openProgressTicks < CONFIG.economy.chests.openDurationTicks) {
        chest.openProgressTicks += 1;
      } else {
        chest.state = 'open';
        chest.itemAbsorbed = true;
        if (chest.type === 'gorgon_eye') {
          collectGorgonEye(player);
        }
      }
    }
  }
}
