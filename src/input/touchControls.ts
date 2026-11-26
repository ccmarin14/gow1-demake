import type { GameAction } from '../sim/types';

/**
 * On-screen controls for touch screens: the game reads them exactly like the
 * keyboard, as actions held while a finger is on the button. Each button
 * tracks its own pointer, so moving and striking at the same time works with
 * two fingers.
 */
const held = new Set<GameAction>();
/** Buttons pressed since the last read: a tap shorter than a frame is not lost. */
const tapped = new Set<GameAction>();

interface TouchButton {
  label: string;
  action: GameAction;
}

const MOVE_BUTTONS: readonly TouchButton[] = [
  { label: '◀', action: 'move-left' },
  { label: '▼', action: 'move-down' },
  { label: '▶', action: 'move-right' },
];

const ACTION_BUTTONS: readonly TouchButton[] = [
  { label: 'Rodar', action: 'dodge' },
  { label: 'Guardia', action: 'guard' },
  { label: '□', action: 'light-attack' },
  { label: '△', action: 'heavy-attack' },
  { label: '○', action: 'grab' },
  { label: 'Saltar', action: 'jump' },
  { label: 'Magia', action: 'magic' },
];

/** Actions currently held on the touch controls. */
export function touchActions(): ReadonlySet<GameAction> {
  return held;
}

/** Actions pressed since the last call (even if already released), once each. */
export function consumeTouchTaps(): ReadonlySet<GameAction> {
  const taps = new Set(tapped);
  tapped.clear();
  return taps;
}

function isTouchScreen(): boolean {
  return window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
}

function makeButton(button: TouchButton): HTMLButtonElement {
  const element = document.createElement('button');
  element.type = 'button';
  element.className = 'touch-button';
  element.textContent = button.label;
  element.setAttribute('aria-label', button.action);
  const press = (event: PointerEvent): void => {
    event.preventDefault();
    element.setPointerCapture(event.pointerId);
    held.add(button.action);
    tapped.add(button.action);
    element.classList.add('is-held');
  };
  const release = (): void => {
    held.delete(button.action);
    element.classList.remove('is-held');
  };
  element.addEventListener('pointerdown', press);
  element.addEventListener('pointerup', release);
  element.addEventListener('pointercancel', release);
  element.addEventListener('lostpointercapture', release);
  element.addEventListener('contextmenu', (event) => event.preventDefault());
  return element;
}

function makeGroup(className: string, buttons: readonly TouchButton[]): HTMLDivElement {
  const group = document.createElement('div');
  group.className = className;
  for (const button of buttons) group.appendChild(makeButton(button));
  return group;
}

/** Adds the controls to the page on touch screens; does nothing elsewhere. */
export function installTouchControls(): void {
  if (!isTouchScreen()) {
    return;
  }
  document.body.classList.add('has-touch-controls');
  const pad = document.createElement('div');
  pad.className = 'touch-pad';
  pad.appendChild(makeGroup('touch-move', MOVE_BUTTONS));
  pad.appendChild(makeGroup('touch-actions', ACTION_BUTTONS));
  document.body.appendChild(pad);
  // A finger leaving the page (app switch, notification) must not leave keys stuck.
  window.addEventListener('blur', () => {
    held.clear();
    tapped.clear();
    for (const element of pad.querySelectorAll('.is-held')) element.classList.remove('is-held');
  });
}
