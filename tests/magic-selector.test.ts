import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { advanceMagicSelector, INITIAL_MAGIC_SELECTOR_STATE, selectedMagic } from '../src/ui/magicSelector';

describe('magic selector (BL-29)', () => {
  it('starts on Poseidon\'s Wrath', () => {
    assert.equal(selectedMagic(INITIAL_MAGIC_SELECTOR_STATE), 'poseidons-wrath');
    assert.equal(INITIAL_MAGIC_SELECTOR_STATE.index, 0);
  });

  it('keeps Poseidon\'s Wrath after any number of left or right presses', () => {
    let state = INITIAL_MAGIC_SELECTOR_STATE;
    for (const direction of ['move-left', 'move-right', 'move-right', 'move-left']) {
      state = advanceMagicSelector(state, [direction as 'move-left' | 'move-right']);
      assert.equal(selectedMagic(state), 'poseidons-wrath');
      assert.equal(state.index, 0);
    }
  });

  it('does not rebuild the state when the only spell cannot change', () => {
    const state = advanceMagicSelector(INITIAL_MAGIC_SELECTOR_STATE, ['move-right']);
    assert.equal(state, INITIAL_MAGIC_SELECTOR_STATE);
  });

  it('ignores actions that do not move the selector', () => {
    const state = advanceMagicSelector(INITIAL_MAGIC_SELECTOR_STATE, [
      'jump',
      'magic',
      'pause',
    ]);
    assert.equal(state, INITIAL_MAGIC_SELECTOR_STATE);
    assert.equal(selectedMagic(state), 'poseidons-wrath');
  });
});
