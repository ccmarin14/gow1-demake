import Phaser from 'phaser';
import { PIXEL_PALETTE, buildPixelBladeRects } from './pixelBlade';
import type { PixelRect } from './pixelBlade';

/** Ancho y alto de la textura: cubre la hoja, la punta y el medallón (x 0..207, y 0..59). */
const ART_WIDTH = 208;
const ART_HEIGHT = 60;

/**
 * Dibuja una variante de pixel art como una imagen fija, igual que el original: la espada no
 * cambia y lo que se mueve (barras, iconos) va encima. Los rectángulos se pintan una vez en un
 * Graphics fuera de escena y se vuelcan a una textura de una sola pieza.
 */
export function createPixelHudSkin(
  scene: Phaser.Scene,
  depth: number,
  textureKey: string,
  build: () => PixelRect[] = buildPixelBladeRects,
): Phaser.GameObjects.Image[] {
  if (!scene.textures.exists(textureKey)) {
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    for (const rect of build()) {
      g.fillStyle(PIXEL_PALETTE[rect.c], 1).fillRect(rect.x, rect.y, rect.w, rect.h);
    }
    g.generateTexture(textureKey, ART_WIDTH, ART_HEIGHT);
    g.destroy();
  }
  return [scene.add.image(0, 0, textureKey).setOrigin(0, 0).setScrollFactor(0).setDepth(depth)];
}
