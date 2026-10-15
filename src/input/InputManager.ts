import Phaser from 'phaser';
import type { GameAction } from '../sim/types';
import { DOMAIN_ACTIONS } from '../sim/types';

const { KeyCodes } = Phaser.Input.Keyboard;

const KEY_BINDINGS: Record<GameAction, number[]> = {
  'move-left': [KeyCodes.A, KeyCodes.LEFT],
  'move-right': [KeyCodes.D, KeyCodes.RIGHT],
  jump: [KeyCodes.SPACE],
  'light-attack': [KeyCodes.J],
  'heavy-attack': [KeyCodes.K],
  dodge: [KeyCodes.SHIFT],
  'context-action': [KeyCodes.E],
  pause: [KeyCodes.ESC],
};

interface Binding {
  action: GameAction;
  key: Phaser.Input.Keyboard.Key;
}

export class InputManager {
  private readonly bindings: Binding[] = [];

  constructor(scene: Phaser.Scene) {
    const keyboard = scene.input.keyboard;
    if (!keyboard) {
      return;
    }
    for (const action of DOMAIN_ACTIONS) {
      for (const code of KEY_BINDINGS[action]) {
        this.bindings.push({ action, key: keyboard.addKey(code) });
      }
    }
  }

  poll(): GameAction[] {
    const active = new Set<GameAction>();
    for (const { action, key } of this.bindings) {
      if (key.isDown) {
        active.add(action);
      }
    }
    return DOMAIN_ACTIONS.filter((action) => active.has(action));
  }
}
