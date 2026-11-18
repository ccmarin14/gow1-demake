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
/** Seconds between two drops of blood a flying half leaves behind. */
const TRAIL_EVERY_S = 0.05;
/**
 * Launch speeds (px/s) of the halves. Game feel: the original throws them off screen; at 95/-120 they dropped
 * at Kratos' feet. The head half goes ahead and up, the legs half behind.
 */
export const RIP_HALF_LAUNCH = {
  head: { vx: 150, vy: -175 },
  legs: { vx: -110, vy: -135 },
} as const;

interface Piece {
  sprite: Phaser.GameObjects.Image;
  vx: number;
  vy: number;
  age: number;
  landed: boolean;
  floor: number;
  /** Seconds the half stays where he was torn (the hitstop of the tear), drawn white: the impact frame. */
  hold: number;
  trail: number;
  /** Texture in colour, shown when the white impact frame ends. */
  colourKey: string;
}

/**
 * Bakes one half of the horizontal soldier into its own texture (mirrored if needed); pixel-exact, no crop quirks.
 * `white` bakes its silhouette in white: the impact frame of the tear (the game draws with the Canvas renderer,
 * where `setTint` does nothing).
 */
function halfTexture(scene: Phaser.Scene, upper: boolean, mirrored: boolean, white = false): string | null {
  const name = `rip-half-${upper ? 'head' : 'legs'}-${mirrored ? 'm' : 'n'}${white ? '-w' : ''}`;
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
  if (white) {
    for (let at = 0; at < image.data.length; at += 4) {
      if (image.data[at + 3] === 0) continue;
      image.data[at] = 255;
      image.data[at + 1] = 255;
      image.data[at + 2] = 255;
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
    /** Called while a half flies, every `TRAIL_EVERY_S`, with the torn edge (a trail of blood). */
    private readonly onTrail: (x: number, y: number) => void = () => {},
  ) {}

  /**
   * Tears the soldier lying across Kratos' hands: `origin` is where his sprite was drawn, `facing` the way Kratos
   * looks. The head half is thrown ahead and up, the legs half behind.
   */
  spawn(origin: VictimPose, facing: -1 | 1, floorY: number, holdSeconds = 0): void {
    const parts: Array<{ upper: boolean; vx: number; vy: number }> = [
      { upper: true, vx: facing * RIP_HALF_LAUNCH.head.vx, vy: RIP_HALF_LAUNCH.head.vy },
      { upper: false, vx: facing * RIP_HALF_LAUNCH.legs.vx, vy: RIP_HALF_LAUNCH.legs.vy },
    ];
    for (const part of parts) {
      const key = halfTexture(this.scene, part.upper, origin.flipX);
      if (!key) continue;
      // The sprites are drawn mirrored where the soldier faced Kratos: the head half keeps the side it was on
      const whiteKey = holdSeconds > 0 ? halfTexture(this.scene, part.upper, origin.flipX, true) : null;
      const sprite = this.scene.add.image(origin.x, Math.min(origin.y, floorY), whiteKey ?? key).setOrigin(0.5, 1).setDepth(1.05);
      this.pieces.push({ sprite, vx: part.vx, vy: part.vy, age: 0, landed: false, floor: floorY, hold: holdSeconds, trail: 0, colourKey: key });
    }
  }

  update(dtSeconds: number): void {
    for (let i = this.pieces.length - 1; i >= 0; i -= 1) {
      const piece = this.pieces[i];
      if (piece.hold > 0) {
        // frozen with the world on the tear (white until its last frames, then in colour), then launched
        piece.hold -= dtSeconds;
        if (piece.hold < 0.05 && piece.sprite.texture.key !== piece.colourKey) piece.sprite.setTexture(piece.colourKey);
        continue;
      }
      piece.age += dtSeconds;
      if (!piece.landed) {
        piece.trail += dtSeconds;
        if (piece.trail >= TRAIL_EVERY_S) {
          piece.trail = 0;
          this.onTrail(piece.sprite.x, piece.sprite.y - 10);
        }
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
