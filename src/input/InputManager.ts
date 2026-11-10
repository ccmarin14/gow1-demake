import Phaser from 'phaser';
import type { GameAction } from '../sim/types';
import { DOMAIN_ACTIONS } from '../sim/types';
import { consumeTouchTaps, touchActions } from './touchControls';

const { KeyCodes } = Phaser.Input.Keyboard;

const KEY_BINDINGS: Record<GameAction, number[]> = {
  'move-left': [KeyCodes.A, KeyCodes.LEFT],
  'move-right': [KeyCodes.D, KeyCodes.RIGHT],
  'move-down': [KeyCodes.S, KeyCodes.DOWN],
  jump: [KeyCodes.SPACE],
  'light-attack': [KeyCodes.J],
  // Triangle (user: "triangulo mapealo con la letra i del teclado").
  'heavy-attack': [KeyCodes.I],
  // Circle (grab, D-42: teclas K y L).
  grab: [KeyCodes.K, KeyCodes.L],
  magic: [KeyCodes.U],
  dodge: [KeyCodes.SHIFT],
  guard: [KeyCodes.Q],
  'context-action': [KeyCodes.E],
  pause: [KeyCodes.ESC],
  restart: [KeyCodes.R],
};

interface ActionBinding {
  action: GameAction;
  keys: Phaser.Input.Keyboard.Key[];
}

export class InputManager {
  private readonly bindings: ActionBinding[] = [];

  constructor(scene: Phaser.Scene) {
    const keyboard = scene.input.keyboard;
    if (!keyboard) {
      return;
    }
    for (const action of DOMAIN_ACTIONS) {
      const keys = KEY_BINDINGS[action].map((code) => keyboard.addKey(code));
      this.bindings.push({ action, keys });
    }
  }

  poll(): GameAction[] {
    const active: GameAction[] = [];
    const taps = consumeTouchTaps();
    for (let i = 0; i < this.bindings.length; i += 1) {
      const { action, keys } = this.bindings[i];
      if (touchActions().has(action) || taps.has(action)) {
        active.push(action);
        continue;
      }
      for (let j = 0; j < keys.length; j += 1) {
        if (keys[j].isDown) {
          active.push(action);
          break;
        }
      }
    }
    return active;
  }
}
