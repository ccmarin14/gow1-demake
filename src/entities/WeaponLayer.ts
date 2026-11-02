import Phaser from 'phaser';
import { BLADE_KEY, strikeFrameKey } from '../assets/manifest';
import ANCHORS from '../assets/kratos-anchors.json';
import { CONFIG } from '../config';
import {
  STRIKES,
  bladeAt,
  bladeMotionAt,
  strikeHandAt,
  strikePhaseAt,
  strikeTrailAt,
  trackDepthAt,
  type Hand,
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
  profiledTrailQuads,
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

/**
 * Depths: behind the body (0) for the trail, the blades and the chains while
 * they pass behind it; above the enemies (1) for the trail in front, then
 * the chains and blades in front.
 */
const DEPTH_TRAIL = -0.07;
const DEPTH_TRAIL_FRONT = 1.09;
const DEPTH_FAR_CHAIN = -0.06;
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
 * track and draws the fire crescent, the blade held in one hand, the blade
 * the other hand throws on its chain, and the impact glint. Every display
 * object is created once and repositioned per frame.
 */
export class WeaponLayer {
  private backBlades: Phaser.GameObjects.Image[] = [];
  private nearBlade: Phaser.GameObjects.Image | null = null;
  private farBlade: Phaser.GameObjects.Image | null = null;
  private trail: Phaser.GameObjects.Graphics | null = null;
  private trailFront: Phaser.GameObjects.Graphics | null = null;
  private chain: Phaser.GameObjects.Graphics | null = null;
  private farChain: Phaser.GameObjects.Graphics | null = null;
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
    this.trailFront = scene.add.graphics().setDepth(DEPTH_TRAIL_FRONT);
    this.chain = scene.add.graphics().setDepth(DEPTH_CHAIN);
    this.farChain = scene.add.graphics().setDepth(DEPTH_FAR_CHAIN);
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

    // Fire trail: square 1's crescent behind the body; profiled trails
    // split in front of and behind it along the track.
    const trail = this.trail!;
    const trailFront = this.trailFront!;
    trail.clear();
    trailFront.clear();
    for (const hand of ['far', 'near'] as const) {
      const shape = def.blades[hand]?.trail;
      if (!shape) continue;
      const fire = strikeTrailAt(def, t, strikeAnchors, hand);
      if (shape.kind === 'crescent') {
        for (const band of crescentBands(fire.points, fire.widthPx, art.trail)) {
          fillPixelPolygon(trail, band.points.map(toWorld), band.color);
        }
      } else {
        const growing = def.blades[hand]?.trailGrowth?.[phase.id];
        const fading = growing ? 1 : def.trailFadeWidthPx / Math.max(...shape.widths.map((w) => w[1]));
        const quads = profiledTrailQuads(fire, shape, (s) => trackDepthAt(def, s, hand), art.trail, fading);
        for (const quad of quads) {
          fillPixelPolygon(quad.depth === 'behind' ? trail : trailFront, quad.points.map(toWorld), quad.color);
        }
      }
    }

    // Each hand's blade: in the hand, drawn from the back, or out on its
    // chain (the near hand's chain over the body, the far hand's behind it).
    const chains: Record<Hand, Phaser.GameObjects.Graphics> = { near: this.chain!, far: this.farChain! };
    const images: Record<Hand, Phaser.GameObjects.Image> = { near: this.nearBlade!, far: this.farBlade! };
    let thrownWorld: Vec2 = [0, 0];
    for (const hand of ['far', 'near'] as const) {
      const blade = bladeAt(def, hand, t, strikeAnchors, strike.entry);
      const world = toWorld(blade.pos);
      const chain = chains[hand];
      chain.clear();
      // A chain goes at its blade's depth, whichever hand throws it.
      chain.setDepth(blade.behindBody ? DEPTH_FAR_CHAIN : DEPTH_CHAIN);
      let deg = blade.deg;
      if (blade.chainOut) {
        const handLocal = strikeHandAt(def, t, strikeAnchors, hand);
        drawChain(chain, toWorld(handLocal), world, blade.sagPx, art.chainColors);
        deg = (Math.atan2(blade.pos[1] - handLocal[1], blade.pos[0] - handLocal[0]) * 180) / Math.PI;
      }
      images[hand].setDepth(blade.behindBody ? DEPTH_BEHIND : DEPTH_BLADE);
      this.placeBlade(images[hand], world, deg, facing);
      if (hand === def.hand) thrownWorld = world;
    }

    // Glint at the tip when the throw lands.
    const glint = this.glint!;
    glint.clear();
    if (bladeMotionAt(def, def.hand, t).motion?.kind === 'hold' && u < art.glintFraction) {
      drawGlint(glint, thrownWorld, art.glintColor);
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
    this.trailFront?.clear();
    this.chain?.clear();
    this.farChain?.clear();
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
