import Phaser from 'phaser';
import { BLADE_KEY, strikeFrameKey } from '../assets/manifest';
import ANCHORS from '../assets/kratos-anchors.json';
import { grabBladePoint } from '../scene/grabPose';
import { CONFIG } from '../config';
import {
  STRIKES,
  bladeAt,
  bladeMotionAt,
  fireballRadius,
  strikeEffectsAt,
  strikeHandAt,
  strikePhaseAt,
  strikeTrailAt,
  trackDepthAt,
  type Hand,
  type StrikePoseAnchors,
  type Vec2,
} from '../sim/strike';
import type { EntityState, GroundFireState, StrikeSnapshot } from '../sim/types';
import {
  bladeDirection,
  buildBladeDirections,
  crescentBands,
  drawChain,
  drawDisc,
  drawFireball,
  drawGlint,
  drawGroundFire,
  fillPixelPolygon,
  profiledTrailQuads,
  type BladeDirections,
} from './strikeArt';
import { PixelLayer } from './pixelLayer';
import { WINDOW_ABOVE, WINDOW_H, WINDOW_LEFT, WINDOW_W } from './strikeWindow';

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
  private trail: PixelLayer | null = null;
  private trailFront: PixelLayer | null = null;
  private chain: PixelLayer | null = null;
  private farChain: PixelLayer | null = null;
  private glint: PixelLayer | null = null;
  /** Phase effects: fireballs behind and in front of the body, and the ground fire and flash. */
  private fireBehind: PixelLayer | null = null;
  private fireFront: PixelLayer | null = null;
  private groundEffects: PixelLayer | null = null;
  /** Fire left burning on the ground (world entities, they outlive the strike). */
  private groundFires: Phaser.GameObjects.Graphics | null = null;
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
    const layer = (name: string, depth: number): PixelLayer =>
      new PixelLayer(scene, `strike-layer-${name}`, depth, WINDOW_W, WINDOW_H);
    this.trail = layer('trail', DEPTH_TRAIL);
    this.trailFront = layer('trail-front', DEPTH_TRAIL_FRONT);
    this.chain = layer('chain', DEPTH_CHAIN);
    this.farChain = layer('far-chain', DEPTH_FAR_CHAIN);
    this.glint = layer('glint', DEPTH_GLINT);
    this.fireBehind = layer('fire-behind', DEPTH_BEHIND + 0.001);
    this.fireFront = layer('fire-front', DEPTH_BLADE + 0.001);
    this.groundEffects = layer('ground', DEPTH_TRAIL_FRONT);
    this.groundFires = scene.add.graphics().setDepth(DEPTH_TRAIL_FRONT);
  }

  update(player: Readonly<EntityState> | null, frameKey = '', strike: Readonly<StrikeSnapshot> | null = null): void {
    const alive = CONFIG.presentation.weaponArt && player !== null && !player.isDead;
    const striking = alive && strike !== null && this.directions.keys.length > 0;
    const isGrabStab =
      alive &&
      !striking &&
      player !== null &&
      (player.grabPhase === 'floorhold' ||
        player.grabPhase === 'stab' ||
        player.grabPhase === 'finisher_qte' ||
        (player.grabPhase === 'throw' && player.grabTicks >= 3 && player.grabTicks < CONFIG.player.grab.toss.releaseTick)) &&
      this.directions.keys.length > 0;
    const guarding =
      alive && !striking && player !== null && player.guardPhase !== 'none' && this.directions.keys.length > 0;

    this.updateBackBlades(alive && !striking ? player : null, frameKey, isGrabStab, guarding);
    if (striking && player && strike) {
      this.drawStrike(player, strike);
    } else if (isGrabStab && player) {
      this.drawGrabStab(player, frameKey);
    } else if (guarding && player) {
      this.drawGuard(player, frameKey);
    } else {
      this.hideStrike();
    }
  }

  private updateBackBlades(
    player: Readonly<EntityState> | null,
    frameKey: string,
    isGrabStab = false,
    guarding = false,
  ): void {
    const anchors = FRAME_ANCHORS[frameKey];
    const slots = CONFIG.presentation.backBlades;
    for (let i = 0; i < this.backBlades.length; i += 1) {
      const image = this.backBlades[i];
      if (!player || !anchors) {
        image.setVisible(false);
        continue;
      }
      // Con la espada en la mano (puñaladas, remate) o en guardia (las dos), salen de la espalda
      if (guarding || (isGrabStab && i === 0)) {
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

  /**
   * Espada del Caos en la mano derecha, en agarre invertido y apuntando hacia abajo, para las
   * puñaladas de Grab 1 (cuadros `grab-stab-a/b`) y la espera del remate contextual.
   */
  private drawGrabStab(player: Readonly<EntityState>, frameKey: string): void {
    if (!this.nearBlade) return;
    this.farBlade?.setVisible(false);
    for (const layer of this.pixelLayers()) {
      layer.clear();
      layer.flush();
    }

    const facing = player.facing === -1 ? -1 : 1;
    // Puñaladas al suelo: la hoja apunta hacia abajo (agarre invertido). En el Toss se hunde de frente y algo hacia abajo.
    const deg = player.grabPhase === 'throw' ? 25 : 90;
    const middle = grabBladePoint(player, frameKey, deg, 0.5);
    this.nearBlade.setDepth(DEPTH_BLADE);
    this.placeBlade(this.nearBlade, middle, deg, facing);
  }

  /** Las dos Espadas del Caos cruzadas al frente mientras Kratos bloquea (L1, D-50). */
  private drawGuard(player: Readonly<EntityState>, frameKey: string): void {
    if (!this.nearBlade || !this.farBlade) return;
    for (const layer of this.pixelLayers()) {
      layer.clear();
      layer.flush();
    }

    const facing = player.facing === -1 ? -1 : 1;
    const anchors = FRAME_ANCHORS[frameKey];
    const half = CONFIG.presentation.strikeArt.bladeSize.w / 2;
    const raised = player.guardPhase === 'active';
    const place = (image: Phaser.GameObjects.Image, hand: readonly number[] | undefined, deg: number, depth: number): void => {
      const local = hand ? toSprite(hand) : { dx: 12, dy: -26 };
      const rad = (deg * Math.PI) / 180;
      const x = player.x + facing * (local.dx + Math.cos(rad) * half);
      const y = player.y + local.dy + Math.sin(rad) * half;
      image.setDepth(depth);
      this.placeBlade(image, [x, y], deg, facing);
    };
    // Cruzadas: la de la mano cercana sube hacia delante y la de la lejana baja hacia delante.
    place(this.nearBlade, anchors?.hand, raised ? -50 : -20, DEPTH_BLADE);
    place(this.farBlade, anchors?.farHand, raised ? 50 : 20, DEPTH_BLADE - 0.001);
  }

  private drawStrike(player: Readonly<EntityState>, strike: Readonly<StrikeSnapshot>): void {
    const def = STRIKES[strike.id];
    const art = CONFIG.presentation.strikeArt;
    const t = strike.tick;
    const facing = strike.facing;
    const toWorld = (p: Vec2): Vec2 => [strike.originX + facing * p[0], player.y + p[1]];
    const { phase, u } = strikePhaseAt(def, t);
    const windowX = Math.round(strike.originX) - WINDOW_LEFT;
    const windowY = Math.round(player.y) - WINDOW_ABOVE;
    for (const layer of this.pixelLayers()) layer.setWindow(windowX, windowY);

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
    const chains: Record<Hand, PixelLayer> = { near: this.chain!, far: this.farChain! };
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

    // Phase effects declared as data: fireballs on the blades (at each
    // blade's depth), the ground fire line and the flash.
    const fireBehind = this.fireBehind!;
    const fireFront = this.fireFront!;
    const ground = this.groundEffects!;
    fireBehind.clear();
    fireFront.clear();
    ground.clear();
    for (const effect of strikeEffectsAt(def, t)) {
      if (effect.kind === 'fireball') {
        for (const hand of ['far', 'near'] as const) {
          const blade = bladeAt(def, hand, t, strikeAnchors, strike.entry);
          drawFireball(blade.behindBody ? fireBehind : fireFront, toWorld(blade.pos), fireballRadius(effect, effect.age), {
            edge: art.trail.edge,
            rim: art.trail.orange,
            core: art.trail.white,
          });
        }
      } else if (effect.kind === 'groundFire' && !effect.linger) {
        // A lingering fire is a world entity (`drawGroundFires`); this one is the strike's own.
        drawGroundFire(ground, toWorld([effect.from, 0])[0], toWorld([effect.to, 0])[0], player.y, effect.heightPx, effect.age, effect.ticks, strike.originX, art.trail);
      } else if (effect.kind === 'flash') {
        drawDisc(ground, toWorld([effect.x, -3]), effect.radiusPx - effect.age * 2, art.trail.white);
      }
    }

    // Glint at the tip when the throw lands.
    const glint = this.glint!;
    glint.clear();
    if (bladeMotionAt(def, def.hand, t).motion?.kind === 'hold' && u < art.glintFraction) {
      drawGlint(glint, thrownWorld, art.glintColor);
    }
    for (const layer of this.pixelLayers()) layer.flush();
  }

  /** Every per-frame pixel layer of the strike effects. */
  private pixelLayers(): PixelLayer[] {
    return [this.trail, this.trailFront, this.chain, this.farChain, this.glint, this.fireBehind, this.fireFront, this.groundEffects].filter(
      (layer): layer is PixelLayer => layer !== null,
    );
  }

  /** Draws the fires burning on the ground (from the world snapshot). */
  drawGroundFires(fires: readonly GroundFireState[]): void {
    const g = this.groundFires;
    if (!g) return;
    g.clear();
    const art = CONFIG.presentation.strikeArt;
    for (const fire of fires) {
      drawGroundFire(g, fire.x0, fire.x1, fire.y, fire.heightPx, fire.age, fire.ticks, fire.x0, art.trail);
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
    for (const layer of this.pixelLayers()) {
      layer.clear();
      layer.flush();
    }
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
