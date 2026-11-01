import Phaser from 'phaser';
import { BLADE_KEY } from '../assets/manifest';
import ANCHORS from '../assets/kratos-anchors.json';
import { CONFIG } from '../config';
import type { EntityState } from '../sim/types';

/** Sprite canvas of Kratos; anchors are in its pixels, origin top-left. */
const CANVAS_W = 64;
const CANVAS_H = 56;

/** Per-frame upper back and spine direction, from the 3D skeleton. */
interface FrameAnchors {
  back: readonly number[];
  spineRad: number;
}
const FRAME_ANCHORS: Readonly<Record<string, FrameAnchors>> = ANCHORS;

/**
 * Blades of Chaos carried crossed on Kratos' back, as in GoW 1 (D-26: weapons
 * are an engine layer, not part of the character grid). The strikes are being
 * redesigned (D-36), so the layer only draws the blades at rest. Every display
 * object is created once and repositioned per frame.
 */
export class WeaponLayer {
  private backBlades: Phaser.GameObjects.Image[] = [];

  create(scene: Phaser.Scene): void {
    // Behind the character sprite (depth 0), above the contact shadow.
    this.backBlades = CONFIG.presentation.backBlades.map(() =>
      scene.add.image(0, 0, BLADE_KEY).setOrigin(0.12, 0.5).setDepth(-0.05).setVisible(false),
    );
  }

  update(player: Readonly<EntityState> | null, frameKey = ''): void {
    const anchors = FRAME_ANCHORS[frameKey];
    const visible = CONFIG.presentation.weaponArt && player !== null && !player.isDead && anchors !== undefined;
    const slots = CONFIG.presentation.backBlades;
    for (let i = 0; i < this.backBlades.length; i += 1) {
      const image = this.backBlades[i];
      if (!visible || !player || !anchors) {
        image.setVisible(false);
        continue;
      }
      const facing = player.facing === -1 ? -1 : 1;
      const slot = slots[i];
      const back = toSprite(anchors.back);
      // Facing right: spine direction turned toward the back. Facing left mirrors it.
      const rad = anchors.spineRad + (slot.deg * Math.PI) / 180;
      const angle = facing === 1 ? rad : Math.PI - rad;
      image
        .setPosition(player.x + facing * (back.dx + slot.dx), player.y + back.dy + slot.dy)
        .setRotation(angle)
        .setFlipY(facing === -1)
        .setVisible(true);
    }
  }
}

/** Anchor on the sprite canvas -> offset from the feet anchor, facing right. */
function toSprite(point: readonly number[]): { dx: number; dy: number } {
  return { dx: point[0] - CANVAS_W / 2, dy: point[1] - CANVAS_H };
}
