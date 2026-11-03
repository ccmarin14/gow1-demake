import Phaser from 'phaser';
import { PixelBuffer, type PixelSink } from './pixelBuffer';

/**
 * A Phaser image fed by a {@link PixelBuffer}: draw into it with `fillStyle` /
 * `fillRect` (like a Graphics object), then `flush()` once per frame. Only the
 * changed area is copied to the canvas and only that area is drawn, so a
 * slow phone does not pay for the whole window every frame.
 */
export class PixelLayer implements PixelSink {
  private readonly buffer: PixelBuffer;
  private readonly texture: Phaser.Textures.CanvasTexture;
  private readonly image: Phaser.GameObjects.Image;
  private readonly imageData: ImageData;

  constructor(scene: Phaser.Scene, key: string, depth: number, width: number, height: number) {
    this.buffer = new PixelBuffer(width, height);
    if (scene.textures.exists(key)) scene.textures.remove(key);
    this.texture = scene.textures.createCanvas(key, width, height)!;
    this.imageData = new ImageData(this.buffer.bytes, width, height);
    this.image = scene.add.image(0, 0, key).setOrigin(0, 0).setDepth(depth).setVisible(false);
  }

  /** Window of `width` x `height` world pixels whose top-left is `(x, y)`; call before drawing a frame. */
  setWindow(x: number, y: number): this {
    this.buffer.setOrigin(x, y);
    return this;
  }

  setDepth(depth: number): this {
    this.image.setDepth(depth);
    return this;
  }

  fillStyle(color: number): this {
    this.buffer.fillStyle(color);
    return this;
  }

  fillRect(x: number, y: number, w: number, h: number): this {
    this.buffer.fillRect(x, y, w, h);
    return this;
  }

  clear(): this {
    this.buffer.clear();
    return this;
  }

  /** Copies what changed to the canvas and shows only the drawn area. */
  flush(): void {
    const pending = this.buffer.takePending();
    if (pending) {
      this.texture.context.putImageData(this.imageData, 0, 0, pending.x, pending.y, pending.w, pending.h);
      this.texture.refresh();
    }
    const drawn = this.buffer.drawnBounds();
    if (!drawn) {
      this.image.setVisible(false);
      return;
    }
    this.image
      .setCrop(drawn.x, drawn.y, drawn.w, drawn.h)
      .setPosition(this.buffer.originX, this.buffer.originY)
      .setVisible(true);
  }

  destroy(): void {
    this.image.destroy();
    this.texture.destroy();
  }
}
