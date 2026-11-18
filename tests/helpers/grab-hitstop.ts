import { CONFIG } from '../../src/config';

/**
 * The circle blows freeze the world a few ticks (`CONFIG.player.grab.hitstop`). The tests that count the ticks of
 * the chain run without it (the freezes have their own tests in `tests/grab-hitstop.test.ts`); returns the restore.
 */
export function withoutGrabHitstop(): () => void {
  const hitstop = CONFIG.player.grab.hitstop as Record<string, number>;
  const saved = { ...hitstop };
  for (const key of Object.keys(hitstop)) hitstop[key] = 0;
  return () => {
    Object.assign(hitstop, saved);
  };
}
