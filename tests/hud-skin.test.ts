import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { CONFIG } from '../src/config';
import { resolveHudSkin } from '../src/ui/hudSkin/hudSkin';
import { HUD_GREEN_TROUGH, HUD_MANA_TROUGH } from '../src/ui/hudSkin/hudWells';
import { buildPixelBladeRects } from '../src/ui/hudSkin/pixelBlade';
import type { PixelRect } from '../src/ui/hudSkin/pixelBlade';

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

function contains(outer: Box, inner: Box): boolean {
  return (
    inner.x >= outer.x &&
    inner.y >= outer.y &&
    inner.x + inner.w <= outer.x + outer.w &&
    inner.y + inner.h <= outer.y + outer.h
  );
}

/** Último rectángulo de la lista que cubre un punto; es lo que se ve. */
function topmostAt(rects: readonly PixelRect[], px: number, py: number): PixelRect | undefined {
  let found: PixelRect | undefined;
  for (const rect of rects) {
    if (px >= rect.x && px < rect.x + rect.w && py >= rect.y && py < rect.y + rect.h) {
      found = rect;
    }
  }
  return found;
}

describe('resolveHudSkin', () => {
  it('uses the default variant without a query string', () => {
    assert.equal(resolveHudSkin(''), 'pixel');
    assert.equal(resolveHudSkin(undefined), 'pixel');
    assert.equal(resolveHudSkin(null), 'pixel');
  });

  it('falls back to the default for unknown or missing values', () => {
    assert.equal(resolveHudSkin('?hud=bogus'), 'pixel');
    assert.equal(resolveHudSkin('?other=1'), 'pixel');
  });

  it('reads the requested variant from the hud parameter', () => {
    assert.equal(resolveHudSkin('?hud=pixel'), 'pixel');
    assert.equal(resolveHudSkin('?hud=faithful'), 'faithful');
  });
});

describe('pixel blade art (variant A)', () => {
  const rects = buildPixelBladeRects();

  it('keeps every pixel inside the art area of the skin texture (208×60 from the origin)', () => {
    const box: Box = { x: 0, y: 0, w: 208, h: 60 };
    for (const rect of rects) {
      assert.ok(contains(box, rect), `rect ${JSON.stringify(rect)} leaves the art box`);
    }
  });

  it('paints the life and mana bars on dark troughs so they stay visible', () => {
    const { x, y, barWidth, barHeight, manaBarWidth, manaBarHeight, manaBarYOffset } =
      CONFIG.presentation.hud;
    const barX = x + 32;
    const green: Box = { x: barX, y, w: barWidth, h: barHeight };
    const mana: Box = { x: barX, y: y + manaBarYOffset, w: manaBarWidth, h: manaBarHeight };

    assert.deepEqual(HUD_GREEN_TROUGH, { x: green.x, y: green.y, w: green.w, h: green.h });
    assert.deepEqual(HUD_MANA_TROUGH, { x: mana.x, y: mana.y, w: mana.w, h: mana.h });

    // Each bar pixel must end on the trough color, never on the blade or the bronze bevel.
    for (const bar of [green, mana]) {
      for (let py = bar.y; py < bar.y + bar.h; py += 1) {
        for (let px = bar.x; px < bar.x + bar.w; px += 1) {
          const top = topmostAt(rects, px, py);
          assert.equal(top?.c, 'h', `pixel ${px},${py} under a bar is not the trough`);
        }
      }
    }
  });
});
