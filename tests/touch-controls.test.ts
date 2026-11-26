import assert from 'node:assert/strict';
import { it } from 'node:test';
import { installTouchControls, touchActions, consumeTouchTaps } from '../src/input/touchControls';

it('provides magic alongside existing touch actions and releases them', () => {
  class Element {
    type = '';
    className = '';
    textContent: string | null = null;
    children: Element[] = [];
    attributes: Record<string, string> = {};
    listeners: Record<string, (event: any) => void> = {};
    classList = { add() {}, remove() {} };
    appendChild(child: Element) { this.children.push(child); }
    setAttribute(name: string, value: string) { this.attributes[name] = value; }
    addEventListener(name: string, listener: (event: any) => void) { this.listeners[name] = listener; }
    setPointerCapture() {}
    querySelectorAll() { return []; }
  }
  const body = new Element();
  const oldWindow = globalThis.window;
  const oldDocument = globalThis.document;
  Object.assign(globalThis, {
    window: { matchMedia: () => ({ matches: true }), addEventListener() {} },
    document: { body, createElement: () => new Element() },
  });
  try {
    installTouchControls();
    const buttons = body.children[0].children.flatMap(group => group.children);
    const actions = buttons.map(button => button.attributes['aria-label']);
    assert.deepEqual(actions, ['move-left', 'move-down', 'move-right', 'dodge', 'guard', 'light-attack', 'heavy-attack', 'grab', 'jump', 'magic']);
    const magic = buttons.find(button => button.attributes['aria-label'] === 'magic')!;
    magic.listeners.pointerdown({ preventDefault() {}, pointerId: 1 });
    assert.ok(touchActions().has('magic'));
    magic.listeners.pointerup({});
    assert.ok(!touchActions().has('magic'));
    assert.ok(consumeTouchTaps().has('magic'));
  } finally {
    Object.assign(globalThis, { window: oldWindow, document: oldDocument });
  }
});
