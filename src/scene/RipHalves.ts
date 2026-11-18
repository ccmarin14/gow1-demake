// The two halves of a soldier torn in two (the circle grab's Rip, BL-45). Pure presentation: the simulation only
// says the victim is dead (`ripped`); this draws the pieces flying apart, falling to the deck and fading.
import Phaser from 'phaser';
import type { VictimPose } from './grabPose';

const SOURCE_KEY = 'legionnaire-flip-00';
const SIZE_W = 64;
const SIZE_H = 56;
/** Column of the horizontal body (head side on the left, unmirrored) where it is torn: at the waist. */
const SPLIT_COL = 37;
const GRAVITY = 900;
const FADE_AFTER_S = 1.4;
const FADE_FOR_S = 0.5;

interface Piece {
  sprite: Phaser.GameObjects.Image;
  vx: number;
  vy: number;
  age: number;
  landed: boolean;
  floor: number;
}

/** Bakes one half of the horizontal soldier into its own texture (mirrored if needed); pixel-exact, no crop quirks. */
function halfTexture(scene: Phaser.Scene, upper: boolean, mirrored: boolean): string | null {
  const name = `rip-half-${upper ? 'head' : 'legs'}-${mirrored ? 'm' : 'n'}`;
  if (scene.textures.exists(name)) return name;
  if (!scene.textures.exists(SOURCE_KEY)) return null;
  const source = scene.textures.get(SOURCE_KEY).getSourceImage() as CanvasImageSource;
  const canvas = scene.textures.createCanvas(name, SIZE_W, SIZE_H);
  if (!canvas) return null;
  const ctx = canvas.getContext();
  ctx.save();
  if (mirrored) {
    ctx.translate(SIZE_W, 0);
    ctx.scale(-1, 1);
  }
  ctx.beginPath();
  ctx.rect(upper ? 0 : SPLIT_COL, 0, upper ? SPLIT_COL : SIZE_W - SPLIT_COL, SIZE_H);
  ctx.clip();
  ctx.drawImage(source, 0, 0);
  ctx.restore();
  // The torn edge: a jagged red band along the cut (raw flesh), so each half reads as a half and not as a grey cut-out
  const image = ctx.getImageData(0, 0, SIZE_W, SIZE_H);
  for (let y = 0; y < SIZE_H; y += 1) {
    const jag = (y * 7) % 3;
    for (let depth = 0; depth <= jag + 1; depth += 1) {
      const col = upper ? SPLIT_COL - 1 - depth : SPLIT_COL + depth;
      const x = mirrored ? SIZE_W - 1 - col : col;
      const at = (y * SIZE_W + x) * 4;
      if (image.data[at + 3] === 0) continue;
      const bright = (y + depth) % 2 === 0;
      image.data[at] = bright ? 220 : 153;
      image.data[at + 1] = bright ? 38 : 27;
      image.data[at + 2] = bright ? 38 : 27;
    }
  }
  ctx.putImageData(image, 0, 0);
  canvas.refresh();
  return name;
}

export class RipHalves {
  private readonly pieces: Piece[] = [];

  constructor(
    private readonly scene: Phaser.Scene,
    /** Called with the place where each half hits the deck (the blood splash). */
    private readonly onLand: (x: number, y: number) => void = () => {},
  ) {}

  /**
   * Tears the soldier lying across Kratos' hands: `origin` is where his sprite was drawn, `facing` the way Kratos
   * looks. The head half is thrown ahead and up, the legs half behind.
   */
  spawn(origin: VictimPose, facing: -1 | 1, floorY: number): void {
    const parts: Array<{ upper: boolean; vx: number; vy: number }> = [
      { upper: true, vx: facing * 95, vy: -120 },
      { upper: false, vx: -facing * 70, vy: -90 },
    ];
    for (const part of parts) {
      const key = halfTexture(this.scene, part.upper, origin.flipX);
      if (!key) continue;
      // The sprites are drawn mirrored where the soldier faced Kratos: the head half keeps the side it was on
      const sprite = this.scene.add.image(origin.x, Math.min(origin.y, floorY), key).setOrigin(0.5, 1).setDepth(1.05);
      this.pieces.push({ sprite, vx: part.vx, vy: part.vy, age: 0, landed: false, floor: floorY });
    }
  }

  update(dtSeconds: number): void {
    for (let i = this.pieces.length - 1; i >= 0; i -= 1) {
      const piece = this.pieces[i];
      piece.age += dtSeconds;
      if (!piece.landed) {
        piece.vy += GRAVITY * dtSeconds;
        piece.sprite.x += piece.vx * dtSeconds;
        piece.sprite.y += piece.vy * dtSeconds;
        if (piece.sprite.y >= piece.floor && piece.vy > 0) {
          piece.sprite.y = piece.floor;
          piece.landed = true;
          this.onLand(piece.sprite.x, piece.sprite.y);
        }
      }
      if (piece.age > FADE_AFTER_S) piece.sprite.setAlpha(Math.max(0, 1 - (piece.age - FADE_AFTER_S) / FADE_FOR_S));
      if (piece.age > FADE_AFTER_S + FADE_FOR_S) {
        piece.sprite.destroy();
        this.pieces.splice(i, 1);
      }
    }
  }

  isActive(): boolean {
    return this.pieces.length > 0;
  }

  destroy(): void {
    for (const piece of this.pieces) piece.sprite.destroy();
    this.pieces.length = 0;
  }
}
