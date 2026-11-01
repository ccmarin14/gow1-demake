import Phaser from 'phaser';
import { BLADE_KEY } from '../assets/manifest';
import ANCHORS from '../assets/kratos-anchors.json';
import { CONFIG } from '../config';
import { bladePoseForTick, type AttackParams, type BladePose } from '../sim/attack';
import type { Platform } from '../sim/scenarios';
import type { EntityState } from '../sim/types';

const CHAIN_LINKS = 20;
const TRAIL_STEPS = 16;
const SPARK_COUNT = 16;
/**
 * The blade sprite (18x7, `grids/blades/blade.txt`) points right with the grip
 * on the left. Its origin sits on the blade body so the sprite center matches
 * the sim's blade center; the chain ends at the grip, `GRIP_BACK_PX` behind it.
 */
const BLADE_ORIGIN_X = 0.55;
const GRIP_BACK_PX = 8;

/** Sprite canvas of Kratos; anchors are in its pixels, origin top-left. */
const CANVAS_W = 64;
const CANVAS_H = 56;

/** Per-frame hand, upper back and spine direction, from the 3D skeleton. */
interface FrameAnchors {
  hand: readonly number[];
  back: readonly number[];
  spineRad: number;
}
const FRAME_ANCHORS: Readonly<Record<string, FrameAnchors>> = ANCHORS;

/**
 * Blades of Chaos and their chains (D-26: weapons are an engine layer, not
 * part of the character grid). While attacking, one blade flies on its chain
 * along the arc the simulation sweeps, so what is seen is what hits. Otherwise
 * both blades hang crossed on Kratos' back, as in GoW 1. Every display object
 * is created once and repositioned per frame.
 */
export class WeaponLayer {
  private chainOutline: Phaser.GameObjects.Rectangle[] = [];
  private chainCore: Phaser.GameObjects.Rectangle[] = [];
  private trailOuter: Phaser.GameObjects.Rectangle[] = [];
  private trailInner: Phaser.GameObjects.Rectangle[] = [];
  private blade: Phaser.GameObjects.Image | null = null;
  private backBlades: Phaser.GameObjects.Image[] = [];
  private sparks: Phaser.GameObjects.Rectangle[] = [];

  create(scene: Phaser.Scene): void {
    const {
      weaponChainColor,
      weaponChainOutline,
      weaponTrailColor,
      hitboxColorChain1,
      targetHitColor,
      weaponDepth,
      backBlades,
    } = CONFIG.presentation;

    this.trailOuter = [];
    this.trailInner = [];
    for (let k = 0; k < TRAIL_STEPS; k += 1) {
      const progress = (k + 1) / TRAIL_STEPS;
      const innerColor = k < TRAIL_STEPS / 2 ? targetHitColor : hitboxColorChain1;
      this.trailInner.push(
        scene.add
          .rectangle(0, 0, 4, 4, innerColor, 0.14 + 0.56 * progress)
          .setDepth(weaponDepth - 0.15)
          .setVisible(false),
      );
      this.trailOuter.push(
        scene.add
          .rectangle(0, 0, 4, 4, weaponTrailColor, 0.16 + 0.68 * progress)
          .setDepth(weaponDepth - 0.1)
          .setVisible(false),
      );
    }

    this.chainOutline = [];
    this.chainCore = [];
    for (let i = 0; i < CHAIN_LINKS; i += 1) {
      this.chainOutline.push(
        scene.add.rectangle(0, 0, 4, 4, weaponChainOutline).setDepth(weaponDepth).setVisible(false),
      );
      const even = i % 2 === 0;
      this.chainCore.push(
        scene.add
          .rectangle(0, 0, even ? 3 : 2, even ? 2 : 3, weaponChainColor)
          .setDepth(weaponDepth + 0.05)
          .setVisible(false),
      );
    }

    this.blade = scene.add
      .image(0, 0, BLADE_KEY)
      .setOrigin(BLADE_ORIGIN_X, 0.5)
      .setDepth(weaponDepth + 0.1)
      .setVisible(false);

    // Behind the character sprite (depth 0), above the contact shadow.
    this.backBlades = backBlades.map(() =>
      scene.add.image(0, 0, BLADE_KEY).setOrigin(0.12, 0.5).setDepth(-0.05).setVisible(false),
    );

    this.sparks = [];
    for (let i = 0; i < SPARK_COUNT; i += 1) {
      const color = i % 3 === 0 ? 0xfff1c9 : i % 3 === 1 ? 0xff8800 : 0xff5533;
      const size = i % 2 === 0 ? 2 : 3;
      this.sparks.push(
        scene.add.rectangle(0, 0, size, size, color).setDepth(weaponDepth + 0.2).setVisible(false),
      );
    }
  }

  update(
    player: Readonly<EntityState> | null,
    params: AttackParams | null,
    platforms: readonly Platform[] = [],
    frameKey = '',
  ): void {
    if (!CONFIG.presentation.weaponArt || !player || player.isDead) {
      this.hideAll();
      return;
    }
    this.updateSparks(player);

    const facing = player.facing === -1 ? -1 : 1;
    const attacking = params !== null && player.attackPhase !== 'none';
    const guarding = player.guardPhase !== 'none' && !attacking;
    const anchors = FRAME_ANCHORS[frameKey];
    this.showBackBlades(player, facing, anchors, !attacking && !guarding);

    if (guarding) {
      // Blade held across the chest on a short chain.
      this.drawChain(player.x + facing * 8, player.y - 28, player.x + facing * 14, player.y - 31, null, 0, 0);
      this.placeBlade(player.x + facing * 20, player.y - 33, facing === 1 ? -0.35 : Math.PI + 0.35, facing);
      this.hideTrail();
      return;
    }
    if (!attacking) {
      this.hideAttackBlade();
      return;
    }

    // The chain leaves the hand drawn in this frame; the move's `hand` is the fallback.
    const hand = anchors
      ? toSprite(anchors.hand)
      : CONFIG.player.attack.moves[player.attackMove === 'none' ? 'light_1' : player.attackMove].hand;
    const handX = player.x + facing * hand.dx;
    const handY = player.y + hand.dy;
    const visual = this.deriveVisualPose(player, params, handX, handY, platforms);
    if (!visual) {
      this.hideAttackBlade();
      return;
    }
    const { pose, whipSign, showTrail } = visual;
    const angle = Math.atan2(pose.bladeCenterY - handY, pose.bladeCenterX - handX);
    const gripX = pose.bladeCenterX - Math.cos(angle) * GRIP_BACK_PX;
    const gripY = pose.bladeCenterY - Math.sin(angle) * GRIP_BACK_PX;
    const amp = Math.min(Math.max(params.arc.radius * 0.08, 4.5), 9.0);
    this.drawChain(handX, handY, gripX, gripY, pose, amp * whipSign * facing, pose.progress);
    this.placeBlade(Math.round(pose.bladeCenterX), Math.round(pose.bladeCenterY), angle, facing);
    if (showTrail) {
      this.drawTrail(pose, params, facing);
    } else {
      this.hideTrail();
    }
  }

  private showBackBlades(
    player: Readonly<EntityState>,
    facing: number,
    anchors: FrameAnchors | undefined,
    visible: boolean,
  ): void {
    const slots = CONFIG.presentation.backBlades;
    for (let i = 0; i < this.backBlades.length; i += 1) {
      const image = this.backBlades[i];
      if (!visible || !anchors) {
        image.setVisible(false);
        continue;
      }
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

  /** Chain links from the hand to the blade grip; `wave` bends it like a whip. */
  private drawChain(
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    pose: BladePose | null,
    wave: number,
    progress: number,
  ): void {
    const dx = toX - fromX;
    const dy = toY - fromY;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const links = this.chainCore.length;
    for (let i = 0; i < links; i += 1) {
      const s = (i + 1) / (links + 1);
      const bend = wave * Math.sin(Math.PI * s) * Math.sin(2 * Math.PI * (progress - s * 0.35));
      const x = Math.round(fromX + dx * s + nx * bend);
      let y = Math.round(fromY + dy * s + ny * bend);
      // Links never sink below the deck.
      if (pose && pose.groundY < Infinity && y > pose.groundY - 2) {
        y = Math.round(pose.groundY - 2);
      }
      this.chainOutline[i].setPosition(x, y).setVisible(true);
      this.chainCore[i].setPosition(x, y).setVisible(true);
    }
  }

  private placeBlade(x: number, y: number, angle: number, facing: number): void {
    // Flip vertically when facing left so the spine stays on top.
    this.blade?.setPosition(x, y).setRotation(angle).setFlipY(facing === -1).setVisible(true);
  }

  private drawTrail(pose: BladePose, params: AttackParams, facing: number): void {
    const trailSpan = (params.arc.endRad - params.arc.startRad) * 0.42;
    const outerR = params.arc.radius + 4;
    const innerR = Math.max(8, params.arc.radius - 2);
    for (let k = 0; k < TRAIL_STEPS; k += 1) {
      const trailAngle = pose.angleRad - trailSpan * (1 - k / (TRAIL_STEPS - 1));
      const cosA = Math.cos(trailAngle);
      const sinA = Math.sin(trailAngle);
      const ox = Math.round(pose.gripX + facing * cosA * outerR);
      let oy = Math.round(pose.gripY - sinA * outerR);
      const ix = Math.round(pose.gripX + facing * cosA * innerR);
      let iy = Math.round(pose.gripY - sinA * innerR);
      if (pose.groundY < Infinity) {
        oy = Math.min(oy, Math.round(pose.groundY - 2));
        iy = Math.min(iy, Math.round(pose.groundY - 2));
      }
      const rot = -trailAngle * facing;
      this.trailOuter[k].setPosition(ox, oy).setRotation(rot).setVisible(true);
      this.trailInner[k].setPosition(ix, iy).setRotation(rot).setVisible(true);
    }
  }

  /** Floor-impact sparks keep flying for their duration after the move ends. */
  private updateSparks(player: Readonly<EntityState>): void {
    if (player.groundImpactTicks <= 0) {
      for (const spark of this.sparks) spark.setVisible(false);
      return;
    }
    const { durationTicks, sparkGravity } = CONFIG.player.attack.groundImpact;
    const tSec = (durationTicks - player.groundImpactTicks) / 60;
    for (let i = 0; i < this.sparks.length; i += 1) {
      const vx = ((i - 7.5) / 7.5) * 65;
      const vy = -120 + (i % 5) * 16;
      const px = Math.round(player.groundImpactX + vx * tSec);
      const py = Math.round(player.groundImpactY + vy * tSec + 0.5 * sparkGravity * tSec * tSec);
      this.sparks[i].setPosition(px, py).setVisible(py <= player.groundImpactY + 3);
    }
  }

  private deriveVisualPose(
    player: Readonly<EntityState>,
    params: AttackParams,
    handX: number,
    handY: number,
    platforms: readonly Platform[],
  ): { pose: BladePose; whipSign: number; showTrail: boolean } | null {
    if (player.attackPhase === 'active') {
      const pose = bladePoseForTick(player, params, platforms);
      if (!pose) {
        return null;
      }
      const sweepDir = params.arc.endRad >= params.arc.startRad ? 1 : -1;
      return { pose, whipSign: sweepDir, showTrail: true };
    }
    // Startup: blade drawn back toward the start of the arc on a short chain.
    if (player.attackPhase === 'startup') {
      const u = params.startupTicks > 0 ? player.attackTicks / params.startupTicks : 0;
      const radius = Math.min(32, Math.max(18, params.arc.radius * 0.35));
      return { pose: this.poseAt(player, handX, handY, params.arc.startRad, radius, u), whipSign: 1, showTrail: false };
    }
    // Recovery: the chain retracts the blade back to the hand.
    if (player.attackPhase === 'recovery' && params.recoveryTicks > 0) {
      const u = Math.min(Math.max(player.attackTicks / params.recoveryTicks, 0), 1);
      const radius = Math.max(12, params.arc.radius * 0.55 * (1 - u * 0.82));
      return { pose: this.poseAt(player, handX, handY, params.arc.endRad, radius, 1 - u), whipSign: -1, showTrail: false };
    }
    return null;
  }

  private poseAt(
    player: Readonly<EntityState>,
    handX: number,
    handY: number,
    angle: number,
    radius: number,
    progress: number,
  ): BladePose {
    return {
      gripX: handX,
      gripY: handY,
      bladeCenterX: handX + player.facing * Math.cos(angle) * radius,
      bladeCenterY: handY - Math.sin(angle) * radius,
      angleRad: angle,
      radius,
      progress,
      clamped: false,
      groundY: Infinity,
    };
  }

  private hideTrail(): void {
    for (const rect of this.trailOuter) rect.setVisible(false);
    for (const rect of this.trailInner) rect.setVisible(false);
  }

  private hideAttackBlade(): void {
    for (const rect of this.chainOutline) rect.setVisible(false);
    for (const rect of this.chainCore) rect.setVisible(false);
    this.blade?.setVisible(false);
    this.hideTrail();
  }

  private hideAll(): void {
    this.hideAttackBlade();
    for (const image of this.backBlades) image.setVisible(false);
    for (const spark of this.sparks) spark.setVisible(false);
  }
}

/** Anchor on the sprite canvas -> offset from the feet anchor, facing right. */
function toSprite(point: readonly number[]): { dx: number; dy: number } {
  return { dx: point[0] - CANVAS_W / 2, dy: point[1] - CANVAS_H };
}
