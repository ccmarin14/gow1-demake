/**
 * Selector de magias del HUD (BL-29).
 *
 * Es presentación pura: recorre los huecos del selector con las flechas, pero no decide
 * qué hechizo ejecuta la simulación. Hoy solo existe *Ira de Poseidón*, así que el
 * recorrido vuelve siempre al mismo hueco. Sin Phaser, para probarlo en node.
 */
import type { GameAction } from '../sim/types';

export type MagicId = 'poseidons-wrath';

export const MAGIC_SLOTS: readonly MagicId[] = ['poseidons-wrath'];

export interface MagicSelectorState {
  readonly index: number;
}

export const INITIAL_MAGIC_SELECTOR_STATE: MagicSelectorState = { index: 0 };

export function selectedMagic(state: MagicSelectorState): MagicId {
  return MAGIC_SLOTS[state.index];
}

/** Intenta pasar al hueco vecino; con una sola magia el índice no se mueve. */
export function cycleMagic(state: MagicSelectorState, direction: -1 | 1): MagicSelectorState {
  const next = (state.index + direction + MAGIC_SLOTS.length) % MAGIC_SLOTS.length;
  return next === state.index ? state : { index: next };
}

/** Las flechas intentan cambiar de magia; las demás acciones no tocan el selector. */
export function advanceMagicSelector(
  state: MagicSelectorState,
  actions: readonly GameAction[],
): MagicSelectorState {
  let next = state;
  for (const action of actions) {
    if (action === 'move-left') {
      next = cycleMagic(next, -1);
    } else if (action === 'move-right') {
      next = cycleMagic(next, 1);
    }
  }
  return next;
}
