import { CONFIG } from '../config';
import type { EntityState } from '../sim/types';

/**
 * Pure presentation offset for Poseidon's Rage. Kratos rises while the bolt
 * holds him and returns to the deck during recovery. This never moves the
 * simulated entity: damage, the ground wave and collision stay on player.y.
 */
export function magicLiftPx(player: Readonly<EntityState>): number {
  const cfg = CONFIG.vfx.magicWave;
  const spell = CONFIG.player.magic.poseidonsRage;

  if (player.magicPhase === 'active') {
    return cfg.liftPx * Math.min(1, (player.magicTicks + 1) / cfg.liftInTicks);
  }
  if (player.magicPhase === 'recovery') {
    const outTicks = Math.min(cfg.liftOutTicks, spell.recoveryTicks);
    return cfg.liftPx * Math.max(0, 1 - player.magicTicks / outTicks);
  }
  return 0;
}
