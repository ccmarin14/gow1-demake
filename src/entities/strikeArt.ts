import Phaser from 'phaser';
import type { Vec2 } from '../sim/strike';

/**
 * Pixel drawing for the strikes (D-37), at the logical resolution and without
 * antialiasing: polygons and lines become 1 px rows of `fillRect`, and the
 * blade is pre-rotated with nearest-neighbour sampling. Mirrors the approved
 * preview generator (`docs/temporal/sq1-preview-reference.py`).
 */

/** Number of pre-rotated blade directions (22.5 degrees apart). */
export const BLADE_DIRECTIONS = 16;

export interface BladeDirections {
  keys: string[];
  sizes: { w: number; h: number }[];
}

/**
 * Builds the shrunk blade in 16 directions as canvas textures, once per
 * scene: nearest-neighbour resize to `w`x`h`, then a nearest-neighbour
 * rotation by k * 22.5 degrees (clockwise on screen) on an expanded canvas.
 */
export function buildBladeDirections(scene: Phaser.Scene, sourceKey: string, w: number, h: number): BladeDirections {
  const result: BladeDirections = { keys: [], sizes: [] };
  const texture = scene.textures.get(sourceKey);
  const image = texture.getSourceImage() as HTMLImageElement | HTMLCanvasElement;
  const read = document.createElement('canvas');
  read.width = image.width;
  read.height = image.height;
  const readCtx = read.getContext('2d');
  if (!readCtx) return result;
  readCtx.drawImage(image, 0, 0);
  const src = readCtx.getImageData(0, 0, image.width, image.height);
  const small = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const sx = Math.min(image.width - 1, Math.floor(((x + 0.5) * image.width) / w));
      const sy = Math.min(image.height - 1, Math.floor(((y + 0.5) * image.height) / h));
      small.set(src.data.subarray((sy * image.width + sx) * 4, (sy * image.width + sx) * 4 + 4), (y * w + x) * 4);
    }
  }
  for (let k = 0; k < BLADE_DIRECTIONS; k += 1) {
    const key = `${sourceKey}-dir-${k}`;
    const rad = (k * 22.5 * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const corners = [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]].map(
      ([x, y]) => [x * cos - y * sin, x * sin + y * cos],
    );
    const xs = corners.map((c) => c[0]);
    const ys = corners.map((c) => c[1]);
    // Round away float noise before ceil/floor (an axis-aligned blade keeps its size).
    const span = (values: number[]): number =>
      Math.ceil(Math.max(...values) - 1e-6) - Math.floor(Math.min(...values) + 1e-6);
    const ow = span(xs);
    const oh = span(ys);
    if (!scene.textures.exists(key)) {
      const canvas = scene.textures.createCanvas(key, ow, oh);
      const ctx = canvas?.getContext();
      if (canvas && ctx) {
        const out = ctx.createImageData(ow, oh);
        for (let y = 0; y < oh; y += 1) {
          for (let x = 0; x < ow; x += 1) {
            // Inverse rotation of the output pixel centre back onto the blade.
            const px = x + 0.5 - ow / 2;
            const py = y + 0.5 - oh / 2;
            const ix = Math.floor(px * cos + py * sin + w / 2);
            const iy = Math.floor(-px * sin + py * cos + h / 2);
            if (ix < 0 || iy < 0 || ix >= w || iy >= h) continue;
            const from = (iy * w + ix) * 4;
            if (small[from + 3] === 0) continue;
            out.data.set(small.subarray(from, from + 4), (y * ow + x) * 4);
          }
        }
        ctx.putImageData(out, 0, 0);
        canvas.refresh();
      }
    }
    result.keys.push(key);
    result.sizes.push({ w: ow, h: oh });
  }
  return result;
}

/** Direction index for an angle in degrees (y down, clockwise positive). */
export function bladeDirection(deg: number): number {
  return ((Math.round(deg / 22.5) % BLADE_DIRECTIONS) + BLADE_DIRECTIONS) % BLADE_DIRECTIONS;
}

export interface TrailBand {
  color: number;
  points: Vec2[];
}

/**
 * Closed, tapered fire crescent along `points` (oldest first): four flat
 * bands, each a polygon from the path to its inner offset. Widths swell to
 * the middle and taper to points at both ends.
 */
export function crescentBands(
  points: readonly Vec2[],
  maxWidth: number,
  colors: { edge: number; red: number; orange: number; white: number },
): TrailBand[] {
  const n = points.length;
  if (n < 3) return [];
  const band = (scale: number, lo: number): Vec2[] => {
    const outer: Vec2[] = [];
    const inner: Vec2[] = [];
    for (let k = 0; k < n; k += 1) {
      const f = k / (n - 1);
      if (f < lo) continue;
      const width = maxWidth * scale * Math.sin(Math.PI * Math.min(1, f * 0.85 + 0.08)) ** 0.8;
      const a = points[Math.max(k - 1, 0)];
      const b = points[Math.min(k + 1, n - 1)];
      const dx = b[0] - a[0];
      const dy = b[1] - a[1];
      const length = Math.hypot(dx, dy) || 1;
      // Normal on the inner side of a clockwise sweep.
      const nx = -dy / length;
      const ny = dx / length;
      outer.push(points[k]);
      inner.push([points[k][0] + nx * width, points[k][1] + ny * width]);
    }
    return [...outer, ...inner.reverse()];
  };
  return [
    { color: colors.edge, points: band(1.25, 0) },
    { color: colors.red, points: band(1, 0) },
    { color: colors.orange, points: band(0.65, 0.25) },
    { color: colors.white, points: band(0.25, 0.65) },
  ];
}

/** 1 px line between whole-pixel points (Bresenham). */
function line(g: Phaser.GameObjects.Graphics, x0: number, y0: number, x1: number, y1: number): void {
  const dx = Math.abs(x1 - x0);
  const dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  for (;;) {
    g.fillRect(x0, y0, 1, 1);
    if (x0 === x1 && y0 === y1) return;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
}

/**
 * Fills a polygon on whole pixels (vertices rounded): even-odd rows sampled
 * at pixel centres, plus its outline, so thin tips are never lost.
 */
export function fillPixelPolygon(g: Phaser.GameObjects.Graphics, polygon: readonly Vec2[], color: number): void {
  if (polygon.length < 3) return;
  const pts = polygon.map((p) => [Math.round(p[0]), Math.round(p[1])] as const);
  g.fillStyle(color, 1);
  let minY = Infinity;
  let maxY = -Infinity;
  for (const p of pts) {
    minY = Math.min(minY, p[1]);
    maxY = Math.max(maxY, p[1]);
  }
  const xs: number[] = [];
  for (let y = minY; y <= maxY; y += 1) {
    xs.length = 0;
    for (let i = 0; i < pts.length; i += 1) {
      const [ax, ay] = pts[i];
      const [bx, by] = pts[(i + 1) % pts.length];
      if ((ay <= y && y < by) || (by <= y && y < ay)) {
        xs.push(ax + ((y - ay) * (bx - ax)) / (by - ay));
      }
    }
    xs.sort((a, b) => a - b);
    for (let i = 0; i + 1 < xs.length; i += 2) {
      const from = Math.ceil(xs[i]);
      const to = Math.floor(xs[i + 1]);
      if (to >= from) g.fillRect(from, y, to - from + 1, 1);
    }
  }
  for (let i = 0; i < pts.length; i += 1) {
    const [ax, ay] = pts[i];
    const [bx, by] = pts[(i + 1) % pts.length];
    line(g, ax, ay, bx, by);
  }
}

/**
 * Chain from `a` to `b` (world px): one pixel per px of length, sagging
 * `sag` px at the middle, in links of 2 px alternating light and dark.
 */
export function drawChain(g: Phaser.GameObjects.Graphics, a: Vec2, b: Vec2, sag: number, colors: readonly number[]): void {
  const length = Math.max(1, Math.floor(Math.hypot(b[0] - a[0], b[1] - a[1])));
  for (let i = 0; i <= length; i += 1) {
    const u = i / length;
    const x = a[0] + (b[0] - a[0]) * u;
    const y = a[1] + (b[1] - a[1]) * u + sag * 4 * u * (1 - u);
    g.fillStyle(colors[Math.floor(i / 2) % 2], 1);
    g.fillRect(Math.round(x), Math.round(y), 1, 1);
  }
}

/** Impact glint: a 5x5 rounded spark centred on `p`. */
export function drawGlint(g: Phaser.GameObjects.Graphics, p: Vec2, color: number): void {
  const x = Math.round(p[0]);
  const y = Math.round(p[1]);
  g.fillStyle(color, 1);
  g.fillRect(x - 1, y - 2, 3, 1);
  g.fillRect(x - 2, y - 1, 5, 3);
  g.fillRect(x - 1, y + 2, 3, 1);
}
