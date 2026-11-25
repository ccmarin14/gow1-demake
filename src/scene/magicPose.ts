import { CONFIG, PLAYER_SPRITE_HEIGHT } from '../config';
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

export type MagicPoseStyle = 'normal' | 'bridge' | 'tension';

/**
 * The same bracing frame bridges into and out of the tense pose, so he does
 * not snap into or out of the cramp. Recovery ends on the ordinary pose.
 */
export function magicPoseStyle(player: Readonly<EntityState>): MagicPoseStyle {
  const cfg = CONFIG.vfx.magicWave;
  const spell = CONFIG.player.magic.poseidonsRage;
  const edge = Math.min(cfg.poseTransitionTicks, Math.floor(spell.activeTicks / 2));

  if (player.magicPhase === 'startup') {
    return player.magicTicks >= spell.startupTicks - edge ? 'bridge' : 'normal';
  }
  if (player.magicPhase === 'active') {
    return player.magicTicks < edge || player.magicTicks >= spell.activeTicks - edge
      ? 'bridge'
      : 'tension';
  }
  if (player.magicPhase === 'recovery') {
    return player.magicTicks < edge ? 'bridge' : 'normal';
  }
  return 'normal';
}

/** Where the descending bolt grips him: half the sprite, following the lift. */
export function magicBoltEndY(player: Readonly<EntityState>): number {
  return (
    player.y -
    magicLiftPx(player) -
    PLAYER_SPRITE_HEIGHT * CONFIG.vfx.magicWave.boltStopAtBodyFraction
  );
}
