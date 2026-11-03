/**
 * A small RGBA pixel buffer for the strike effects (trails, chains, fire).
 *
 * Phaser's canvas renderer replays every `fillRect` of a Graphics object each
 * frame; a strike draws thousands of 1 px rects, which makes slow phones drop
 * frames. This buffer takes the same two calls (`fillStyle`, `fillRect`) and
 * writes straight into typed memory, so a layer is uploaded once per frame.
 * It knows nothing about Phaser (tests run it directly).
 */

/** The drawing surface the strike art draws on (a Phaser Graphics also fits it). */
export interface PixelSink {
  fillStyle(color: number, alpha?: number): unknown;
  fillRect(x: number, y: number, width: number, height: number): unknown;
  clear(): unknown;
}

export interface PixelRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

const LITTLE_ENDIAN = new Uint8Array(new Uint32Array([1]).buffer)[0] === 1;

/** Packs 0xRRGGBB as an opaque pixel in the machine's byte order. */
export function packOpaque(color: number): number {
  const r = (color >> 16) & 0xff;
  const g = (color >> 8) & 0xff;
  const b = color & 0xff;
  return LITTLE_ENDIAN
    ? ((0xff << 24) | (b << 16) | (g << 8) | r) >>> 0
    : ((r << 24) | (g << 16) | (b << 8) | 0xff) >>> 0;
}

export class PixelBuffer implements PixelSink {
  readonly width: number;
  readonly height: number;
  /** RGBA bytes, row by row. */
  readonly bytes: Uint8ClampedArray;
  private readonly words: Uint32Array;
  /** World position of the buffer's top-left pixel. */
  originX = 0;
  originY = 0;
  private color = 0;
  /** Bounds of what was drawn since the last `clear`, in buffer pixels; `null` when nothing was. */
  private dirty: PixelRect | null = null;
  /** Bounds that still hold old pixels the canvas has to be told about. */
  private stale: PixelRect | null = null;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    const data = new ArrayBuffer(width * height * 4);
    this.bytes = new Uint8ClampedArray(data);
    this.words = new Uint32Array(data);
  }

  /** Moves the window: the next draws are in world pixels relative to this origin. */
  setOrigin(x: number, y: number): void {
    this.originX = Math.round(x);
    this.originY = Math.round(y);
  }

  fillStyle(color: number): this {
    this.color = packOpaque(color);
    return this;
  }

  fillRect(x: number, y: number, w: number, h: number): this {
    const x0 = Math.max(0, Math.round(x) - this.originX);
    const y0 = Math.max(0, Math.round(y) - this.originY);
    const x1 = Math.min(this.width, Math.round(x) - this.originX + Math.round(w));
    const y1 = Math.min(this.height, Math.round(y) - this.originY + Math.round(h));
    if (x1 <= x0 || y1 <= y0) return this;
    for (let row = y0; row < y1; row += 1) {
      this.words.fill(this.color, row * this.width + x0, row * this.width + x1);
    }
    this.dirty = this.dirty ? union(this.dirty, x0, y0, x1, y1) : { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
    return this;
  }

  /** Erases what was drawn; the erased bounds stay in `pending` until the next flush. */
  clear(): this {
    if (this.dirty) {
      const { x, y, w, h } = this.dirty;
      for (let row = y; row < y + h; row += 1) {
        this.words.fill(0, row * this.width + x, row * this.width + x + w);
      }
      this.stale = this.stale ? union(this.stale, x, y, x + w, y + h) : this.dirty;
      this.dirty = null;
    }
    return this;
  }

  /** What was drawn since the last `clear` (buffer pixels). */
  drawnBounds(): PixelRect | null {
    return this.dirty;
  }

  /**
   * The area the canvas must be updated for: what was drawn plus what was
   * erased since the last flush. `null` when nothing changed.
   */
  takePending(): PixelRect | null {
    const a = this.dirty;
    const b = this.stale;
    this.stale = null;
    if (!a) return b;
    if (!b) return a;
    return union(a, b.x, b.y, b.x + b.w, b.y + b.h);
  }

  /** Whether the pixel at world (x, y) is drawn (tests). */
  hasPixel(x: number, y: number): boolean {
    const bx = Math.round(x) - this.originX;
    const by = Math.round(y) - this.originY;
    if (bx < 0 || by < 0 || bx >= this.width || by >= this.height) return false;
    return (this.words[by * this.width + bx] ?? 0) !== 0;
  }
}

function union(a: PixelRect, x0: number, y0: number, x1: number, y1: number): PixelRect {
  const nx0 = Math.min(a.x, x0);
  const ny0 = Math.min(a.y, y0);
  const nx1 = Math.max(a.x + a.w, x1);
  const ny1 = Math.max(a.y + a.h, y1);
  return { x: nx0, y: ny0, w: nx1 - nx0, h: ny1 - ny0 };
}
