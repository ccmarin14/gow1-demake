import type Phaser from 'phaser';
import type { HudSkinId } from './hudSkin';

/** Textura (registrada en assets/manifest.ts) de cada variante del marco. */
const TEXTURE_BY_SKIN: Readonly<Record<HudSkinId, string>> = {
  pixel: 'hud-sword-pixel',
  faithful: 'hud-sword-faithful',
};

/**
 * Muestra la espada de la variante elegida como una imagen fija; barras e iconos van encima.
 * Las imágenes salen de art/hud/chaos-blade.svg con scripts/render_hud_sword.py.
 */
export function createHudSkin(
  scene: Phaser.Scene,
  id: HudSkinId,
  depth: number,
): Phaser.GameObjects.GameObject[] {
  return [scene.add.image(0, 0, TEXTURE_BY_SKIN[id]).setOrigin(0, 0).setScrollFactor(0).setDepth(depth)];
}
