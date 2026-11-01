import Phaser from 'phaser';
import { BLADE_KEY, strikeFrameKey } from '../assets/manifest';
import ANCHORS from '../assets/kratos-anchors.json';
import { CONFIG } from '../config';
import {
  STRIKES,
  chainSagAt,
  farBladeAt,
  nearBladeAt,
  strikeAnchorAt,
  strikePhaseAt,
  strikeTrailAt,
  type StrikePoseAnchors,
  type Vec2,
} from '../sim/strike';
import type { EntityState, StrikeSnapshot } from '../sim/types';
import {
  bladeDirection,
  buildBladeDirections,
  crescentBands,
  drawChain,
  drawGlint,
  fillPixelPolygon,
  type BladeDirections,
} from './strikeArt';

/** Sprite canvas of Kratos; anchors are in its pixels, origin top-left. */
const CANVAS_W = 64;
const CANVAS_H = 56;

/** Per-frame anchors from the 3D skeleton (`build_anchors.py`). */
interface FrameAnchors {
  back: readonly number[];
  spineRad: number;
  hand: readonly number[];
  farHand: readonly number[];
  shoulder: readonly number[];
}
const FRAME_ANCHORS: Readonly<Record<string, FrameAnchors>> = ANCHORS;

/** Depths: behind the body (0) for the trail and far blade, above the enemies (1) for the thrown blade. */
const DEPTH_TRAIL = -0.07;
const DEPTH_BEHIND = -0.05;
const DEPTH_CHAIN = 1.1;
const DEPTH_BLADE = 1.11;
const DEPTH_GLINT = 1.12;

/** Feet-relative anchors of each strike pose, facing right. */
const strikeAnchors: StrikePoseAnchors = (pose) => {
  const anchors = FRAME_ANCHORS[strikeFrameKey(pose)];
  return { back: toFeet(anchors.back), hand: toFeet(anchors.hand), farHand: toFeet(anchors.farHand) };
};

/**
 * Blades of Chaos, as in GoW 1 (D-26: weapons are an engine layer, not part
 * of the character grid). At rest two blades hang crossed on Kratos' back.
 * During a strike (D-37) they leave the back: the layer reads the strike
 * track and draws the far blade in the far hand, the fire crescent, the
 * chain and the thrown near blade, and the impact glint. Every display
 * object is created once and repositioned per frame.
 */
export class WeaponLayer {
  private backBlades: Phaser.GameObjects.Image[] = [];
  private nearBlade: Phaser.GameObjects.Image | null = null;
  private farBlade: Phaser.GameObjects.Image | null = null;
  private trail: Phaser.GameObjects.Graphics | null = null;
  private chain: Phaser.GameObjects.Graphics | null = null;
  private glint: Phaser.GameObjects.Graphics | null = null;
  private directions: BladeDirections = { keys: [], sizes: [] };

  create(scene: Phaser.Scene): void {
    // Behind the character sprite (depth 0), above the contact shadow.
    this.backBlades = CONFIG.presentation.backBlades.map(() =>
      scene.add.image(0, 0, BLADE_KEY).setOrigin(0.12, 0.5).setDepth(-0.05).setVisible(false),
    );
    const { w, h } = CONFIG.presentation.strikeArt.bladeSize;
    this.directions = buildBladeDirections(scene, BLADE_KEY, w, h);
    const firstKey = this.directions.keys[0] ?? BLADE_KEY;
    this.nearBlade = scene.add.image(0, 0, firstKey).setOrigin(0, 0).setVisible(false);
    this.farBlade = scene.add.image(0, 0, firstKey).setOrigin(0, 0).setDepth(DEPTH_BEHIND).setVisible(false);
    this.trail = scene.add.graphics().setDepth(DEPTH_TRAIL);
    this.chain = scene.add.graphics().setDepth(DEPTH_CHAIN);
    this.glint = scene.add.graphics().setDepth(DEPTH_GLINT);
  }

  update(player: Readonly<EntityState> | null, frameKey = '', strike: Readonly<StrikeSnapshot> | null = null): void {
    const alive = CONFIG.presentation.weaponArt && player !== null && !player.isDead;
    const striking = alive && strike !== null && this.directions.keys.length > 0;
    this.updateBackBlades(alive && !striking ? player : null, frameKey);
    if (striking && player && strike) {
      this.drawStrike(player, strike);
    } else {
      this.hideStrike();
    }
  }

  private updateBackBlades(player: Readonly<EntityState> | null, frameKey: string): void {
    const anchors = FRAME_ANCHORS[frameKey];
    const slots = CONFIG.presentation.backBlades;
    for (let i = 0; i < this.backBlades.length; i += 1) {
      const image = this.backBlades[i];
      if (!player || !anchors) {
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

  private drawStrike(player: Readonly<EntityState>, strike: Readonly<StrikeSnapshot>): void {
    const def = STRIKES[strike.id];
    const art = CONFIG.presentation.strikeArt;
    const t = strike.tick;
    const facing = strike.facing;
    const toWorld = (p: Vec2): Vec2 => [strike.originX + facing * p[0], player.y + p[1]];
    const { phase, u } = strikePhaseAt(def, t);

    // Fire crescent, behind the body.
    const trail = this.trail!;
    trail.clear();
    const { points, widthPx } = strikeTrailAt(def, t, strikeAnchors);
    for (const band of crescentBands(points, widthPx, art.trail)) {
      fillPixelPolygon(trail, band.points.map(toWorld), band.color);
    }

    // Far blade: drawn from the back into the far hand, then hanging from it.
    const far = farBladeAt(def, t, strikeAnchors);
    this.placeBlade(this.farBlade!, toWorld(far.pos), far.deg, facing);

    // Near blade: behind the body while drawn, then thrown on its chain.
    const near = nearBladeAt(def, t, strikeAnchors);
    const nearWorld = toWorld(near.pos);
    const chain = this.chain!;
    chain.clear();
    let deg = phase.blade.kind === 'draw' ? 150 : 100;
    if (near.chainOut) {
      const handLocal = strikeAnchorAt(def, t, strikeAnchors, 'hand');
      const handWorld = toWorld(handLocal);
      drawChain(chain, handWorld, nearWorld, chainSagAt(def, t), art.chainColors);
      deg = (Math.atan2(near.pos[1] - handLocal[1], near.pos[0] - handLocal[0]) * 180) / Math.PI;
    }
    this.nearBlade!.setDepth(phase.blade.kind === 'draw' ? DEPTH_BEHIND : DEPTH_BLADE);
    this.placeBlade(this.nearBlade!, nearWorld, deg, facing);

    // Glint at the tip when the throw lands.
    const glint = this.glint!;
    glint.clear();
    if (phase.blade.kind === 'hold' && u < art.glintFraction) {
      drawGlint(glint, nearWorld, art.glintColor);
    }
  }

  /** Puts a blade direction centred on `world`; facing left mirrors it. */
  private placeBlade(image: Phaser.GameObjects.Image, world: Vec2, localDeg: number, facing: -1 | 1): void {
    const k = bladeDirection(localDeg);
    const size = this.directions.sizes[k];
    image
      .setTexture(this.directions.keys[k])
      .setFlipX(facing === -1)
      .setPosition(Math.round(world[0] - size.w / 2), Math.round(world[1] - size.h / 2))
      .setVisible(true);
  }

  private hideStrike(): void {
    this.nearBlade?.setVisible(false);
    this.farBlade?.setVisible(false);
    this.trail?.clear();
    this.chain?.clear();
    this.glint?.clear();
  }
}

/** Anchor on the sprite canvas -> offset from the feet anchor, facing right. */
function toSprite(point: readonly number[]): { dx: number; dy: number } {
  return { dx: point[0] - CANVAS_W / 2, dy: point[1] - CANVAS_H };
}

/** Anchor on the sprite canvas -> feet-relative point, facing right. */
function toFeet(point: readonly number[]): Vec2 {
  return [point[0] - CANVAS_W / 2, point[1] - CANVAS_H];
}
