import Phaser from 'phaser';
import { CONFIG } from '../config';
import { bladePoseForTick, type AttackParams, type BladePose } from '../sim/attack';
import type { Platform } from '../sim/scenarios';
import type { EntityState } from '../sim/types';

const CHAOS_BLADE_TEX_KEY = 'chaos-blade-tex';
const CHAIN_LINKS = 20;
const TRAIL_STEPS = 16;
const SPARK_COUNT = 16;

// Pixel-art Chaos Blade bitmap (22x13):
// '.' = transparent
// '#' = dark outline (#1d1415)
// 'G' = bronze guard (#b94a2c)
// 'F' = fiery spine/groove (#ff8800)
// 'M' = warm steel bevel (#d7c6ad)
// 'B' = bright blade edge/belly (#fff1c9 = weaponBladeColor)
const CHAOS_BLADE_ASCII: readonly string[] = [
  '...........###........',
  '..........#BBB#...###.',
  '.........#BBBB###BBBB#',
  '..###...#BBBBBBBBBBBB#',
  '.#GGG###BBBBBBBBBBBB#.',
  '#GGGGFFBBBBBBBBBBBB#..',
  '#GGGFFFBBBBBBBBBBB#...',
  '.#GGGFFMMMMBBBBBB#....',
  '..###..#MMMMBBBB#.....',
  '........#####BB#......',
  '............###.......',
  '......................',
  '......................',
];

const PIXEL_COLORS: Record<string, string> = {
  '#': '#1d1415',
  G: '#b94a2c',
  F: '#ff8800',
  M: '#d7c6ad',
  B: '#fff1c9',
};

function ensureChaosBladeTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists(CHAOS_BLADE_TEX_KEY)) {
    return;
  }
  const tex = scene.textures.createCanvas(CHAOS_BLADE_TEX_KEY, 22, 13);
  if (!tex) {
    return;
  }
  const ctx = tex.getContext();
  ctx.clearRect(0, 0, 22, 13);
  for (let y = 0; y < CHAOS_BLADE_ASCII.length; y += 1) {
    const row = CHAOS_BLADE_ASCII[y];
    for (let x = 0; x < row.length; x += 1) {
      const color = PIXEL_COLORS[row[x]];
      if (color) {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }
  tex.refresh();
}

/**
 * Reused weapon layer: continuous dark-outlined chain + pixel-art Chaos Blade +
 * continuous crescent slash trail + pre-allocated ground impact spark pool.
 * Created once in `create()` and repositioned per frame without allocating display
 * objects during gameplay.
 */
export class WeaponLayer {
  private weaponChainBorderRects: Phaser.GameObjects.Rectangle[] = [];
  private weaponChainRects: Phaser.GameObjects.Rectangle[] = [];
  private weaponTrailOuter: Phaser.GameObjects.Rectangle[] = [];
  private weaponTrailInner: Phaser.GameObjects.Rectangle[] = [];
  private weaponBladeCoreRect: Phaser.GameObjects.Rectangle | null = null;
  private weaponBladeImage: Phaser.GameObjects.Image | null = null;
  private groundImpactParticles: Phaser.GameObjects.Rectangle[] = [];

  create(scene: Phaser.Scene): void {
    this.weaponChainBorderRects = [];
    this.weaponChainRects = [];
    this.weaponTrailOuter = [];
    this.weaponTrailInner = [];
    this.groundImpactParticles = [];

    ensureChaosBladeTexture(scene);

    const {
      weaponChainColor,
      weaponBladeColor,
      hitboxColorChain1,
      targetHitColor,
      weaponDepth,
    } = CONFIG.presentation;

    // 16 overlapping crescent trail segments (inner fiery core + outer steel/cream edge)
    for (let k = 0; k < TRAIL_STEPS; k += 1) {
      const progress = (k + 1) / TRAIL_STEPS;
      const outerAlpha = 0.16 + 0.68 * progress;
      const innerAlpha = 0.14 + 0.56 * progress;
      const innerColor = k < TRAIL_STEPS / 2 ? targetHitColor : hitboxColorChain1;
      this.weaponTrailInner.push(
        scene.add
          .rectangle(0, 0, 4, 4, innerColor, innerAlpha)
          .setOrigin(0.5, 0.5)
          .setDepth(weaponDepth - 0.15)
          .setVisible(false),
      );
      this.weaponTrailOuter.push(
        scene.add
          .rectangle(0, 0, 4, 4, weaponBladeColor, outerAlpha)
          .setOrigin(0.5, 0.5)
          .setDepth(weaponDepth - 0.1)
          .setVisible(false),
      );
    }

    // 14 overlapping chain links: dark 4x4 outline + 2x2/3x2 metallic core
    for (let i = 0; i < CHAIN_LINKS; i += 1) {
      this.weaponChainBorderRects.push(
        scene.add
          .rectangle(0, 0, 4, 4, 0x1d1415)
          .setOrigin(0.5, 0.5)
          .setDepth(weaponDepth)
          .setVisible(false),
      );
      const coreW = i % 2 === 0 ? 3 : 2;
      const coreH = i % 2 === 0 ? 2 : 3;
      this.weaponChainRects.push(
        scene.add
          .rectangle(0, 0, coreW, coreH, weaponChainColor)
          .setOrigin(0.5, 0.5)
          .setDepth(weaponDepth + 0.05)
          .setVisible(false),
      );
    }

    this.weaponBladeCoreRect = scene.add
      .rectangle(0, 0, 6, 4, weaponBladeColor)
      .setOrigin(0.5, 0.5)
      .setDepth(weaponDepth + 0.08)
      .setVisible(false);

    this.weaponBladeImage = scene.add
      .image(0, 0, CHAOS_BLADE_TEX_KEY)
      .setOrigin(0.35, 0.46)
      .setDepth(weaponDepth + 0.1)
      .setVisible(false);

    // Pre-allocated pool of impact sparks/debris (zero allocations at runtime)
    for (let i = 0; i < SPARK_COUNT; i += 1) {
      const col = i % 3 === 0 ? 0xfff1c9 : i % 3 === 1 ? 0xff8800 : 0xff5533;
      const size = i % 2 === 0 ? 2 : 3;
      this.groundImpactParticles.push(
        scene.add
          .rectangle(0, 0, size, size, col)
          .setOrigin(0.5, 0.5)
          .setDepth(weaponDepth + 0.2)
          .setVisible(false),
      );
    }
  }

  private hideWeapon(): void {
    for (let i = 0; i < this.weaponChainBorderRects.length; i += 1) {
      this.weaponChainBorderRects[i].setVisible(false);
    }
    for (let i = 0; i < this.weaponChainRects.length; i += 1) {
      this.weaponChainRects[i].setVisible(false);
    }
    for (let i = 0; i < this.weaponTrailOuter.length; i += 1) {
      this.weaponTrailOuter[i].setVisible(false);
    }
    for (let i = 0; i < this.weaponTrailInner.length; i += 1) {
      this.weaponTrailInner[i].setVisible(false);
    }
    this.weaponBladeCoreRect?.setVisible(false);
    this.weaponBladeImage?.setVisible(false);
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
      return { pose, whipSign: sweepDir, showTrail: params.moveId !== 'chain_grab' };
    }

    // Startup tension: blade held primed at the attack start angle without blinking out
    if (player.attackPhase === 'startup') {
      const u = params.startupTicks > 0 ? player.attackTicks / params.startupTicks : 0;
      const startAngle = params.arc.startRad;
      const prepRadius = Math.min(32, Math.max(18, params.arc.radius * 0.35));
      return {
        pose: {
          gripX: handX,
          gripY: handY,
          bladeCenterX: handX + player.facing * Math.cos(startAngle) * prepRadius,
          bladeCenterY: handY - Math.sin(startAngle) * prepRadius,
          angleRad: startAngle,
          radius: prepRadius,
          progress: u,
          clamped: false,
          groundY: Infinity,
        },
        whipSign: 1,
        showTrail: false,
      };
    }

    // Smooth retraction across the entire recovery phase back to the body
    if (player.attackPhase === 'recovery' && params.recoveryTicks > 0) {
      const u = Math.min(Math.max(player.attackTicks / params.recoveryTicks, 0), 1);
      const radius = Math.max(12, params.arc.radius * 0.55 * (1 - u * 0.82));
      const angle = params.arc.endRad;
      return {
        pose: {
          gripX: handX,
          gripY: handY,
          bladeCenterX: handX + player.facing * Math.cos(angle) * radius,
          bladeCenterY: handY - Math.sin(angle) * radius,
          angleRad: angle,
          radius,
          progress: 1 - u,
          clamped: false,
          groundY: Infinity,
        },
        whipSign: -1,
        showTrail: false,
      };
    }

    return null;
  }

  update(
    player: Readonly<EntityState> | null,
    params: AttackParams | null,
    platforms: readonly Platform[] = [],
  ): void {
    // 1. Update ground impact sparks even if attack just finished (duration > 0)
    if (player && player.groundImpactTicks > 0) {
      const duration = CONFIG.player.attack.groundImpact.durationTicks;
      const age = duration - player.groundImpactTicks;
      const gravity = CONFIG.player.attack.groundImpact.sparkGravity;
      const tSec = age / 60;
      for (let i = 0; i < this.groundImpactParticles.length; i += 1) {
        const vx = ((i - 7.5) / 7.5) * 65;
        const vy = -120 + (i % 5) * 16;
        const px = Math.round(player.groundImpactX + vx * tSec);
        const py = Math.round(player.groundImpactY + vy * tSec + 0.5 * gravity * tSec * tSec);
        if (py <= player.groundImpactY + 3) {
          this.groundImpactParticles[i].setPosition(px, py).setVisible(true);
        } else {
          this.groundImpactParticles[i].setVisible(false);
        }
      }
    } else {
      for (let i = 0; i < this.groundImpactParticles.length; i += 1) {
        this.groundImpactParticles[i].setVisible(false);
      }
    }

    if (!player || player.isDead) {
      this.hideWeapon();
      return;
    }

    // Defensive stance: chains and blades held protecting the chest
    if (player.guardPhase !== 'none' && player.attackPhase === 'none') {
      const facing = player.facing === -1 ? -1 : 1;
      const handX = player.x + facing * 8;
      const handY = player.y - 28;
      const bladeX = player.x + facing * 18;
      const bladeY = player.y - 32;
      const chainAngle = facing === 1 ? -0.35 : Math.PI + 0.35;

      const segments = this.weaponChainRects.length;
      for (let i = 0; i < segments; i += 1) {
        const s = (i + 1) / (segments + 1);
        const x = Math.round(handX + (bladeX - handX) * s);
        const y = Math.round(handY + (bladeY - handY) * s);
        this.weaponChainBorderRects[i].setPosition(x, y).setVisible(true);
        this.weaponChainRects[i].setPosition(x, y).setVisible(true);
      }

      this.weaponBladeCoreRect
        ?.setPosition(bladeX, bladeY)
        .setRotation(chainAngle)
        .setVisible(true);

      this.weaponBladeImage
        ?.setPosition(bladeX, bladeY)
        .setFlipY(facing === -1)
        .setRotation(chainAngle)
        .setVisible(true);

      for (let k = 0; k < this.weaponTrailOuter.length; k += 1) {
        this.weaponTrailOuter[k].setVisible(false);
      }
      for (let k = 0; k < this.weaponTrailInner.length; k += 1) {
        this.weaponTrailInner[k].setVisible(false);
      }
      return;
    }

    if (!params || player.attackPhase === 'none') {
      this.hideWeapon();
      return;
    }

    const facing = player.facing === -1 ? -1 : 1;
    const moveDef = player.attackMove !== 'none' ? CONFIG.player.attack.moves[player.attackMove] : null;
    const poseFrame = moveDef ? moveDef.poseFrame : 1;
    const handOffset = (CONFIG.player.attack.hands as Record<number, { dx: number; dy: number }>)[poseFrame] ?? { dx: 14, dy: -31 };
    const handX = player.x + facing * handOffset.dx;
    const handY = player.y + handOffset.dy;

    const visual = this.deriveVisualPose(player, params, handX, handY, platforms);
    if (!visual) {
      this.hideWeapon();
      return;
    }

    const { pose, whipSign, showTrail } = visual;
    const dx = pose.bladeCenterX - handX;
    const dy = pose.bladeCenterY - handY;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;

    const segments = this.weaponChainRects.length;
    const amp = params.moveId === 'chain_grab' ? 0 : Math.min(Math.max(params.arc.radius * 0.08, 4.5), 9.0);
    for (let i = 0; i < segments; i += 1) {
      const s = (i + 1) / (segments + 1);
      // Whip wave equation: wave(s, p) = A * sin(pi * s) * sin(2*pi * (p - s * 0.35))
      const wave = amp * Math.sin(Math.PI * s) * Math.sin(2 * Math.PI * (pose.progress - s * 0.35)) * whipSign * facing;
      let x = Math.round(handX + dx * s + nx * wave);
      let y = Math.round(handY + dy * s + ny * wave);

      // Floor clamp: links never sink below wood deck (yTop - 2)
      if (pose.groundY < Infinity && y > pose.groundY - 2) {
        y = Math.round(pose.groundY - 2);
      }

      this.weaponChainBorderRects[i].setPosition(x, y).setVisible(true);
      this.weaponChainRects[i].setPosition(x, y).setVisible(true);
    }

    const bladeX = Math.round(pose.bladeCenterX);
    const bladeY = Math.round(pose.bladeCenterY);
    const chainAngle = Math.atan2(pose.bladeCenterY - handY, pose.bladeCenterX - handX);

    this.weaponBladeCoreRect
      ?.setPosition(bladeX, bladeY)
      .setRotation(chainAngle)
      .setVisible(true);

    this.weaponBladeImage
      ?.setPosition(bladeX, bladeY)
      .setFlipY(facing === -1)
      .setRotation(chainAngle)
      .setVisible(true);

    if (showTrail) {
      const deltaArc = params.arc.endRad - params.arc.startRad;
      const trailSpan = deltaArc * 0.42;
      const outerR = params.arc.radius + 4;
      const innerR = Math.max(8, params.arc.radius - 2);
      for (let k = 0; k < TRAIL_STEPS; k += 1) {
        const frac = 1 - k / (TRAIL_STEPS - 1);
        const trailAngle = pose.angleRad - trailSpan * frac;
        const cosA = Math.cos(trailAngle);
        const sinA = Math.sin(trailAngle);
        const ox = Math.round(pose.gripX + facing * cosA * outerR);
        let oy = Math.round(pose.gripY - sinA * outerR);
        const ix = Math.round(pose.gripX + facing * cosA * innerR);
        let iy = Math.round(pose.gripY - sinA * innerR);
        if (pose.groundY < Infinity) {
          if (oy > pose.groundY - 2) oy = Math.round(pose.groundY - 2);
          if (iy > pose.groundY - 2) iy = Math.round(pose.groundY - 2);
        }
        const rot = -trailAngle * facing;
        this.weaponTrailOuter[k].setPosition(ox, oy).setRotation(rot).setVisible(true);
        this.weaponTrailInner[k].setPosition(ix, iy).setRotation(rot).setVisible(true);
      }
    } else {
      for (let k = 0; k < this.weaponTrailOuter.length; k += 1) {
        this.weaponTrailOuter[k].setVisible(false);
      }
      for (let k = 0; k < this.weaponTrailInner.length; k += 1) {
        this.weaponTrailInner[k].setVisible(false);
      }
    }
  }
}
