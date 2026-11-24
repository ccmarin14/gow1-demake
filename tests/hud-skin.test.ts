import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { existsSync } from 'node:fs';
import { CONFIG } from '../src/config';
import { resolveHudSkin } from '../src/ui/hudSkin/hudSkin';
import { HUD_GREEN_TROUGH, HUD_MANA_TROUGH } from '../src/ui/hudSkin/hudWells';

describe('resolveHudSkin', () => {
  it('uses the default variant without a query string', () => {
    assert.equal(resolveHudSkin(''), 'pixel');
    assert.equal(resolveHudSkin(undefined), 'pixel');
    assert.equal(resolveHudSkin(null), 'pixel');
  });

  it('falls back to the default for unknown values', () => {
    assert.equal(resolveHudSkin('?hud=bogus'), 'pixel');
    assert.equal(resolveHudSkin('?hud=pixel2'), 'pixel');
  });

  it('reads the requested variant from the hud parameter', () => {
    assert.equal(resolveHudSkin('?hud=pixel'), 'pixel');
    assert.equal(resolveHudSkin('?hud=faithful'), 'faithful');
    assert.equal(resolveHudSkin('?hud=render3d'), 'pixel');
  });
});

describe('sword art', () => {
  it('has the troughs exactly where the life and mana bars are drawn', () => {
    const { x, y, barWidth, barHeight, manaBarWidth, manaBarHeight, manaBarYOffset } =
      CONFIG.presentation.hud;
    assert.deepEqual(HUD_GREEN_TROUGH, { x: x + 32, y, w: barWidth, h: barHeight });
    assert.deepEqual(HUD_MANA_TROUGH, { x: x + 32, y: y + manaBarYOffset, w: manaBarWidth, h: manaBarHeight });
  });

  it('ships both sword images', () => {
    assert.ok(existsSync('public/assets/ui/hud-sword-pixel.png'));
    assert.ok(existsSync('public/assets/ui/hud-sword-faithful.png'));
  });
});
