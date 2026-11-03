import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

import { PixelBuffer, packOpaque } from '../src/entities/pixelBuffer';
import { drawChain, drawDisc, drawGroundFire, fillPixelPolygon } from '../src/entities/strikeArt';
import { WINDOW_ABOVE, WINDOW_H, WINDOW_LEFT, WINDOW_W } from '../src/entities/strikeWindow';
import {
  STRIKES,
  bladeAt,
  strikeEffectsAt,
  strikeHandAt,
  strikeLength,
  strikeTrailAt,
  type Hand,
  type StrikePoseAnchors,
  type Vec2,
} from '../src/sim/strike';

const ANCHORS: Record<string, { back: number[]; hand: number[]; farHand: number[] }> = JSON.parse(
  readFileSync(new URL('../src/assets/kratos-anchors.json', import.meta.url), 'utf-8'),
);
const feet = (p: number[]): Vec2 => [p[0] - 32, p[1] - 56];
const anchors: StrikePoseAnchors = (pose) => {
  const a = ANCHORS[`kratos-${pose}`];
  return { back: feet(a.back), hand: feet(a.hand), farHand: feet(a.farHand) };
};

/** Records the rects of a drawing and rasterizes them the way a canvas does with whole-pixel rects. */
class Recorder {
  readonly rects: number[][] = [];
  readonly pixels = new Map<string, number>();
  private color = 0;
  fillStyle(color: number): this {
    this.color = color;
    return this;
  }
  fillRect(x: number, y: number, w: number, h: number): this {
    this.rects.push([x, y, w, h]);
    for (let yy = y; yy < y + h; yy += 1) for (let xx = x; xx < x + w; xx += 1) this.pixels.set(`${xx},${yy}`, this.color);
    return this;
  }
  clear(): this {
    return this;
  }
}

describe('PixelBuffer', () => {
  it('fills rects, clips them to the window and tracks what was drawn', () => {
    const buffer = new PixelBuffer(8, 6);
    buffer.setOrigin(100, 50);
    buffer.fillStyle(0xff0000).fillRect(101, 51, 3, 2);
    buffer.fillStyle(0x00ff00).fillRect(98, 48, 4, 4); // partly outside
    assert.ok(buffer.hasPixel(101, 51) && buffer.hasPixel(103, 52));
    assert.ok(!buffer.hasPixel(104, 51));
    assert.deepEqual(buffer.drawnBounds(), { x: 0, y: 0, w: 4, h: 3 });
    assert.equal(buffer.bytes[(0 * 8 + 0) * 4 + 1], 0xff, 'the clipped green rect wrote its inside corner');
    buffer.fillRect(500, 500, 5, 5);
    assert.deepEqual(buffer.drawnBounds(), { x: 0, y: 0, w: 4, h: 3 }, 'a rect outside the window changes nothing');
  });

  it('packs colors opaque in the machine byte order', () => {
    const buffer = new PixelBuffer(1, 1);
    buffer.fillStyle(0x112233).fillRect(0, 0, 1, 1);
    assert.deepEqual([...buffer.bytes], [0x11, 0x22, 0x33, 0xff]);
    assert.equal(packOpaque(0x000000) >>> 24 !== 0 || packOpaque(0x000000) !== 0, true);
  });

  it('clear erases the drawn area and reports it to the next flush', () => {
    const buffer = new PixelBuffer(16, 16);
    buffer.fillStyle(0xffffff).fillRect(2, 3, 4, 2);
    assert.deepEqual(buffer.takePending(), { x: 2, y: 3, w: 4, h: 2 });
    buffer.clear();
    assert.ok(!buffer.hasPixel(2, 3));
    assert.equal(buffer.drawnBounds(), null);
    buffer.fillRect(10, 10, 2, 2);
    // the flush covers the new drawing and the pixels just erased
    assert.deepEqual(buffer.takePending(), { x: 2, y: 3, w: 10, h: 9 });
    assert.equal(buffer.takePending(), buffer.drawnBounds() ? buffer.takePending() : null);
  });

  it('reports nothing pending when nothing changed', () => {
    const buffer = new PixelBuffer(4, 4);
    assert.equal(buffer.takePending(), null);
    buffer.clear();
    assert.equal(buffer.takePending(), null);
  });
});

describe('strike art on a PixelBuffer', () => {
  it('draws the same pixels as whole-pixel rects, with whole-pixel arguments only', () => {
    const recorder = new Recorder();
    const buffer = new PixelBuffer(160, 120);
    buffer.setOrigin(0, 0);
    for (const sink of [recorder, buffer]) {
      fillPixelPolygon(sink, [[10.4, 12.2], [90.6, 20.1], [60.5, 80.7], [20, 70]], 0xb22218);
      drawChain(sink, [5.3, 100.3], [120.7, 60.2], 4.5, [0x969098, 0x403a46]);
      drawDisc(sink, [80.4, 40.6], 5, 0xffe2aa);
      drawGroundFire(sink, 20, 110, 105, 3, 3, 8, 7, { edge: 0x5c0e12, red: 0xb22218, orange: 0xe86c24, white: 0xffe2aa });
    }
    assert.ok(recorder.rects.length > 100);
    for (const rect of recorder.rects) {
      assert.ok(rect.every((v) => Number.isInteger(v)), `whole-pixel rect ${rect}`);
    }
    const colors = new Map<number, number>();
    for (const [key, color] of recorder.pixels) {
      const [x, y] = key.split(',').map(Number);
      assert.ok(buffer.hasPixel(x, y), `pixel ${key} drawn`);
      const at = (y * 160 + x) * 4;
      colors.set(at, color);
      assert.deepEqual([...buffer.bytes.slice(at, at + 4)], [(color >> 16) & 0xff, (color >> 8) & 0xff, color & 0xff, 0xff]);
    }
    let drawn = 0;
    for (let i = 0; i < buffer.bytes.length; i += 4) if (buffer.bytes[i + 3] !== 0) drawn += 1;
    assert.equal(drawn, recorder.pixels.size, 'nothing else was drawn');
  });

  it('keeps every strike inside the window (facing either way)', () => {
    for (const [id, def] of Object.entries(STRIKES)) {
      for (let t = 0; t < strikeLength(def); t += 1) {
        const points: Vec2[] = [];
        for (const hand of ['near', 'far'] as Hand[]) {
          points.push(bladeAt(def, hand, t, anchors).pos, strikeHandAt(def, t, anchors, hand));
          if (def.blades[hand]?.trail) points.push(...strikeTrailAt(def, t, anchors, hand).points);
        }
        for (const effect of strikeEffectsAt(def, t)) {
          if (effect.kind === 'groundFire') points.push([effect.from, 0], [effect.to, 0]);
        }
        for (const [x, y] of points) {
          // Sprite pixels are drawn up to ~12 px past a point (blade size, disc radius).
          assert.ok(Math.abs(x) + 12 < WINDOW_LEFT, `${id} t${t}: x ${x} fits`);
          assert.ok(y - 12 > -WINDOW_ABOVE && y + 12 < WINDOW_H - WINDOW_ABOVE, `${id} t${t}: y ${y} fits`);
        }
      }
    }
    assert.ok(WINDOW_W >= 2 * WINDOW_LEFT);
  });
});
