import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { it } from 'node:test';

it('disables the unfinished archer button without disabling the other debug controls', () => {
  const html = readFileSync('index.html', 'utf8');
  const button = (id: string) => html.match(new RegExp(`<button\\b[^>]*id="${id}"[^>]*>`))?.[0] ?? '';
  assert.match(button('btn-spawn-archer'), /\bdisabled\b/);
  assert.ok(button('btn-restart'));
  assert.doesNotMatch(button('btn-restart'), /\bdisabled\b/);
  assert.ok(button('btn-spawn-legionnaire'));
  assert.doesNotMatch(button('btn-spawn-legionnaire'), /\bdisabled\b/);
});
