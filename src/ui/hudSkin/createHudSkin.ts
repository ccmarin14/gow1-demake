import type Phaser from 'phaser';
import type { HudSkinId } from './hudSkin';
import { createFaithfulHudSkin } from './faithfulHudSkin';
import { buildPixelBladeRects } from './pixelBlade';
import { buildPixelBladeRectsV2 } from './pixelBladeV2';
import { createPixelHudSkin } from './pixelHudSkin';

/** Crea el arte del marco de la variante elegida y devuelve sus objetos de Phaser. */
export function createHudSkin(
  scene: Phaser.Scene,
  id: HudSkinId,
  depth: number,
): Phaser.GameObjects.GameObject[] {
  switch (id) {
    case 'pixel':
      return createPixelHudSkin(scene, depth, 'hud-pixel-chaos-blade', buildPixelBladeRects);
    case 'pixel2':
      return createPixelHudSkin(scene, depth, 'hud-pixel2-chaos-blade', buildPixelBladeRectsV2);
    case 'faithful':
      return createFaithfulHudSkin(scene, depth);
  }
}
