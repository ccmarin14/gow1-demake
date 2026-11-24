import Phaser from 'phaser';
import { CONFIG } from '../config';
import type { CombatStats, EntityState } from '../sim/types';
import { createHudSkin } from './hudSkin/createHudSkin';
import { resolveHudSkin } from './hudSkin/hudSkin';

export interface HudMetrics {
  currentHp: number;
  ghostHp: number;
  maxHp: number;
  currentMp: number;
  maxMp: number;
  manaWidth: number;
  currentWidth: number;
  ghostWidth: number;
  ratio: number;
  ghostRatio: number;
  isCritical: boolean;
  isDead: boolean;
  ghostPauseTimer: number;
  redOrbs: number;
  points: number;
  gorgonEyes: number;
  gorgonUpgrades: number;
  phoenixFeathers: number;
  phoenixUpgrades: number;
  bossHp?: number;
  bossMaxHp?: number;
}

/**
 * Capa de interfaz de usuario en pantalla (HUD) del lienzo de 480×270:
 *
 * - Marco decorativo de la Espada del Caos en la esquina superior izquierda: lo dibuja la
 *   variante elegida (src/ui/hudSkin/, `?hud=pixel|faithful`). La lógica de barras es la misma.
 * - Canal acanalado oscuro de 110 px de longitud máxima con bisel de bronce.
 * - Barra fantasma (Ghost Health) rojo/ámbar que retiene el daño recibido durante
 *   12 ticks (200 ms) antes de drenar suavemente hacia la vida viva actual.
 * - Barra de salud frontal verde esmeralda brillante que refleja de inmediato el % de vida.
 * - Notches / divisiones segmentadas clásicas de 20 HP.
 * - Pulso de advertencia carmesí cuando la salud desciende al nivel crítico (<= 25%).
 * - Reseteo instantáneo al 100% al pulsar 'R' (reinicio determinista).
 * - Elementos fijados a la pantalla con setScrollFactor(0) y alta profundidad (depth >= 100).
 */
export class HudLayer {
  private readonly elements: Phaser.GameObjects.GameObject[] = [];
  // Arte del marco de la variante elegida: sigue el estado oculto/visible en cada frame
  private readonly skinObjects: Phaser.GameObjects.GameObject[] = [];
  private readonly barsOff = typeof window !== 'undefined' && /(?:^|[?&])hudbars=0(?:&|$)/.test(window.location.search);
  private readonly scene: Phaser.Scene;
  private hidden = false;
  private lastImpactCount = 0;

  // Canal oscuro bajo las barras; el marco decorativo lo dibuja la variante elegida (hudSkin/)
  private readonly channelTrough: Phaser.GameObjects.Rectangle;

  // Barra fantasma (Ghost Health)
  private readonly ghostBar: Phaser.GameObjects.Rectangle;
  private readonly ghostBarHighlight: Phaser.GameObjects.Rectangle;

  // Barra verde frontal
  private readonly greenBarBase: Phaser.GameObjects.Rectangle;
  private readonly greenBarHighlight: Phaser.GameObjects.Rectangle;
  private readonly greenBarShadow: Phaser.GameObjects.Rectangle;
  private readonly segmentNotches: Phaser.GameObjects.Rectangle[] = [];

  // Barra de maná (Ira de Poseidón)
  private readonly manaFrameBg: Phaser.GameObjects.Rectangle;
  private readonly manaChannelTrough: Phaser.GameObjects.Rectangle;
  private readonly manaBarBase: Phaser.GameObjects.Rectangle;
  private readonly manaBarHighlight: Phaser.GameObjects.Rectangle;
  private readonly manaBarShadow: Phaser.GameObjects.Rectangle;

  // Alerta de salud crítica
  private readonly criticalGlow: Phaser.GameObjects.Rectangle;
  private criticalPulseTimer = 0;

  // Texto numérico
  private readonly hpText: Phaser.GameObjects.Text;

  // Icono y contador de orbes rojos
  private readonly redOrbIconOuter: Phaser.GameObjects.Arc;
  private readonly redOrbIconHighlight: Phaser.GameObjects.Arc;
  private readonly redOrbsText: Phaser.GameObjects.Text;
  private readonly pointsText: Phaser.GameObjects.Text;

  // Cadena de impactos estilo GoW 1
  private readonly impactCountText: Phaser.GameObjects.Text;
  private readonly orbMultiplierText: Phaser.GameObjects.Text;
  private readonly impactThresholdText: Phaser.GameObjects.Text;
  private readonly impactEffectText: Phaser.GameObjects.Text;

  // Ranuras ornamentales de Ojos de Górgona bajo el medallón
  private readonly gorgonEyeSlots: Phaser.GameObjects.Rectangle[] = [];
  private readonly gorgonEyeGems: Phaser.GameObjects.Rectangle[] = [];

  // Ranuras ornamentales de Plumas de Fénix bajo los ojos
  private readonly phoenixFeatherSlots: Phaser.GameObjects.Rectangle[] = [];
  private readonly phoenixFeatherGems: Phaser.GameObjects.Rectangle[] = [];

  // Barra de salud monumental de Jefe
  private readonly bossElements: (Phaser.GameObjects.Rectangle | Phaser.GameObjects.Text)[] = [];
  private readonly bossFrameBg: Phaser.GameObjects.Rectangle;
  private readonly bossFrameTopBevel: Phaser.GameObjects.Rectangle;
  private readonly bossFrameBottomShadow: Phaser.GameObjects.Rectangle;
  private readonly bossChannelTrough: Phaser.GameObjects.Rectangle;
  private readonly bossGhostBar: Phaser.GameObjects.Rectangle;
  private readonly bossGhostHighlight: Phaser.GameObjects.Rectangle;
  private readonly bossHealthBar: Phaser.GameObjects.Rectangle;
  private readonly bossHealthHighlight: Phaser.GameObjects.Rectangle;
  private readonly bossTitleText: Phaser.GameObjects.Text;
  private bossGhostHp = 300;
  private bossPrevHp = 300;
  private bossGhostPauseTimer = 0;

  // Estado del drenaje fantasma
  private prevHp = 100;
  private ghostHp = 100;
  private ghostPauseTimer = 0; // segundos
  private lastMetrics: HudMetrics = {
    currentHp: 100,
    ghostHp: 100,
    maxHp: 100,
    currentMp: 100,
    maxMp: 100,
    manaWidth: 52,
    currentWidth: 62,
    ghostWidth: 62,
    ratio: 1,
    ghostRatio: 1,
    isCritical: false,
    isDead: false,
    ghostPauseTimer: 0,
    redOrbs: 0,
    points: 0,
    gorgonEyes: 0,
    gorgonUpgrades: 0,
    phoenixFeathers: 0,
    phoenixUpgrades: 0,
  };

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const { x, y, barWidth, barHeight, depth } = CONFIG.presentation.hud;

    // Coordenadas calculadas
    const barX = x + 32;
    const barY = y;

    // Fondo acanalado oscuro del canal
    this.channelTrough = scene.add
      .rectangle(barX, barY, barWidth, barHeight, 0x120c09)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(depth);
    this.elements.push(this.channelTrough);

    // 2. Barra fantasma (Ghost Health)
    this.ghostBar = scene.add
      .rectangle(barX, barY, barWidth, barHeight, 0xdc2626)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(depth + 1);
    this.elements.push(this.ghostBar);

    this.ghostBarHighlight = scene.add
      .rectangle(barX, barY, barWidth, 2, 0xf59e0b)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(depth + 1);
    this.elements.push(this.ghostBarHighlight);

    // 3. Barra frontal verde esmeralda brillante
    this.greenBarBase = scene.add
      .rectangle(barX, barY, barWidth, barHeight, 0x16a34a)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(depth + 2);
    this.elements.push(this.greenBarBase);

    this.greenBarHighlight = scene.add
      .rectangle(barX, barY, barWidth, 2, 0x4ade80)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(depth + 2);
    this.elements.push(this.greenBarHighlight);

    this.greenBarShadow = scene.add
      .rectangle(barX, barY + barHeight - 2, barWidth, 2, 0x14532d)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(depth + 2);
    this.elements.push(this.greenBarShadow);

    // Notches clásicas de segmento (cada 22 px = 20 HP, 5 muescas para hasta 120 HP)
    for (let s = 1; s <= 5; s += 1) {
      const notchX = barX + Math.round((s * barWidth) / 5);
      const notch = scene.add
        .rectangle(notchX, barY, 1, barHeight, 0x0a2612, 0.75)
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(depth + 3);
      this.segmentNotches.push(notch);
      this.elements.push(notch);
    }

    // 4. Barra de maná azul zafiro (Ira de Poseidón)
    const { manaBarWidth, manaBarHeight, manaBarYOffset } = CONFIG.presentation.hud;
    const manaX = barX;
    const manaY = barY + manaBarYOffset;

    this.manaFrameBg = scene.add
      .rectangle(manaX - 1, manaY - 1, manaBarWidth + 2, manaBarHeight + 2, 0x0f172a)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(depth);
    this.elements.push(this.manaFrameBg);

    this.manaChannelTrough = scene.add
      .rectangle(manaX, manaY, manaBarWidth, manaBarHeight, 0x030712)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(depth);
    this.elements.push(this.manaChannelTrough);

    this.manaBarBase = scene.add
      .rectangle(manaX, manaY, manaBarWidth, manaBarHeight, 0x1e60ff)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(depth + 2);
    this.elements.push(this.manaBarBase);

    this.manaBarHighlight = scene.add
      .rectangle(manaX, manaY, manaBarWidth, 1, 0x60b0ff)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(depth + 2);
    this.elements.push(this.manaBarHighlight);

    this.manaBarShadow = scene.add
      .rectangle(manaX, manaY + manaBarHeight - 1, manaBarWidth, 1, 0x0f3b8c)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(depth + 2);
    this.elements.push(this.manaBarShadow);

    // 5. Alerta de salud crítica
    this.criticalGlow = scene.add
      .rectangle(barX, barY, barWidth, barHeight, 0xef4444, 0.4)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(depth + 4)
      .setVisible(false);
    this.elements.push(this.criticalGlow);

    // 6. Marco decorativo (Espada del Caos) de la variante elegida. Va a profundidad `depth`,
    // por debajo de las barras (depth + 1 en adelante), así que ninguna barra queda tapada.
    const skinId = resolveHudSkin(typeof window === 'undefined' ? '' : window.location.search);
    for (const art of createHudSkin(scene, skinId, depth)) {
      this.elements.push(art);
      this.skinObjects.push(art);
    }

    // 7. Texto numérico pixel-art
    this.hpText = scene.add
      .text(barX, CONFIG.presentation.hud.infoY, 'HP: 100/100', {
        fontFamily: 'monospace',
        fontSize: '9px',
        color: '#cbd5e1',
      })
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(depth + 6)
      .setShadow(1, 1, '#000000', 1)
      .setVisible(false);
    this.elements.push(this.hpText);

    // 8. Icono y saldo de orbes rojos
    const orbIconX = x;
    const orbIconY = CONFIG.presentation.hud.infoY + 10;

    this.redOrbIconOuter = scene.add
      .circle(orbIconX, orbIconY, 3.5, 0xef4444)
      .setStrokeStyle(1, 0xb91c1c)
      .setScrollFactor(0)
      .setDepth(depth + 6);
    this.elements.push(this.redOrbIconOuter);

    this.redOrbIconHighlight = scene.add
      .circle(orbIconX - 1, orbIconY - 1, 1.2, 0xfca5a5)
      .setScrollFactor(0)
      .setDepth(depth + 7);
    this.elements.push(this.redOrbIconHighlight);

    this.redOrbsText = scene.add
      .text(barX, orbIconY - 4, 'ORBES: 0', {
        fontFamily: 'monospace',
        fontSize: '9px',
        color: '#fca5a5',
      })
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(depth + 6)
      .setShadow(1, 1, '#000000', 1);
    this.elements.push(this.redOrbsText);

    this.pointsText = scene.add
      .text(barX + 56, orbIconY - 4, 'PUNTOS: 0', {
        fontFamily: 'monospace',
        fontSize: '9px',
        color: '#fde68a',
      })
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(depth + 6)
      .setShadow(1, 1, '#000000', 1);
    this.elements.push(this.pointsText);

    const chainX = CONFIG.internal.width - 60;
    this.impactCountText = scene.add
      .text(chainX, 158, '0', {
        fontFamily: 'Georgia, Times New Roman, serif',
        fontSize: '18px',
        color: '#f8f1d6',
        fontStyle: 'bold',
        stroke: '#2a1608',
        strokeThickness: 2,
      })
      .setOrigin(0.5, 1)
      .setScrollFactor(0)
      .setDepth(depth + 7)
      .setShadow(1, 1, '#000000', 2)
      .setVisible(false);
    this.elements.push(this.impactCountText);

    this.orbMultiplierText = scene.add
      .text(chainX, 164, 'IMPACTOS', {
        fontFamily: 'Georgia, Times New Roman, serif',
        fontSize: '9px',
        color: '#f8f1d6',
        fontStyle: 'bold',
        stroke: '#2a1608',
        strokeThickness: 1,
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(depth + 7)
      .setShadow(1, 1, '#000000', 2)
      .setVisible(false);
    this.elements.push(this.orbMultiplierText);

    this.impactThresholdText = scene.add
      .text(chainX, 178, '', {
        fontFamily: 'Georgia, Times New Roman, serif',
        fontSize: '10px',
        color: '#ef4444',
        fontStyle: 'bold',
        stroke: '#3f0d0d',
        strokeThickness: 1,
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(depth + 8)
      .setShadow(1, 1, '#000000', 2)
      .setVisible(false);
    this.elements.push(this.impactThresholdText);

    this.impactEffectText = scene.add
      .text(chainX, 190, '', {
        fontFamily: 'Georgia, Times New Roman, serif',
        fontSize: '10px',
        color: '#ef4444',
        fontStyle: 'bold',
        stroke: '#3f0d0d',
        strokeThickness: 1,
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(depth + 8)
      .setShadow(1, 1, '#000000', 2)
      .setVisible(false);
    this.elements.push(this.impactEffectText);

    // 9. Ranuras ornamentales de Ojos de Górgona bajo el medallón (6 casillas)
    const eyeSlotY = CONFIG.presentation.hud.infoY + 22;
    const startSlotX = x - 10;
    for (let i = 0; i < 6; i += 1) {
      const sx = startSlotX + i * 4;
      const slotBg = scene.add
        .rectangle(sx, eyeSlotY, 3, 3, 0x18100c)
        .setOrigin(0.5, 0.5)
        .setScrollFactor(0)
        .setDepth(depth + 6);
      this.gorgonEyeSlots.push(slotBg);
      this.elements.push(slotBg);

      const gem = scene.add
        .rectangle(sx, eyeSlotY, 2, 2, 0x064e3b, 0.35)
        .setOrigin(0.5, 0.5)
        .setScrollFactor(0)
        .setDepth(depth + 7);
      this.gorgonEyeGems.push(gem);
      this.elements.push(gem);
    }

    // 10. Ranuras ornamentales de Plumas de Fénix bajo los ojos (6 casillas zafiro)
    const featherSlotY = eyeSlotY + 5;
    for (let i = 0; i < 6; i += 1) {
      const sx = startSlotX + i * 4;
      const slotBg = scene.add
        .rectangle(sx, featherSlotY, 3, 3, 0x18100c)
        .setOrigin(0.5, 0.5)
        .setScrollFactor(0)
        .setDepth(depth + 6);
      this.phoenixFeatherSlots.push(slotBg);
      this.elements.push(slotBg);

      const gem = scene.add
        .rectangle(sx, featherSlotY, 2, 2, 0x0c4a6e, 0.35)
        .setOrigin(0.5, 0.5)
        .setScrollFactor(0)
        .setDepth(depth + 7);
      this.phoenixFeatherGems.push(gem);
      this.elements.push(gem);
    }

    // 11. Barra de salud ornamental de Jefe (La Hidra de Lerna)
    const bossCfg = CONFIG.presentation.hud.boss ?? {
      x: 140,
      y: 252,
      barWidth: 200,
      barHeight: 7,
      name: 'LA HIDRA DE LERNA',
    };
    const bx = bossCfg.x;
    const by = bossCfg.y;
    const bw = bossCfg.barWidth;
    const bh = bossCfg.barHeight;

    this.bossFrameBg = scene.add
      .rectangle(bx - 2, by - 2, bw + 4, bh + 4, 0x18100c)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(depth + 10)
      .setVisible(false);
    this.bossElements.push(this.bossFrameBg);
    this.elements.push(this.bossFrameBg);

    this.bossFrameTopBevel = scene.add
      .rectangle(bx - 2, by - 2, bw + 4, 1, 0xc49a45)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(depth + 12)
      .setVisible(false);
    this.bossElements.push(this.bossFrameTopBevel);
    this.elements.push(this.bossFrameTopBevel);

    this.bossFrameBottomShadow = scene.add
      .rectangle(bx - 2, by + bh + 1, bw + 4, 1, 0x0c0705)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(depth + 12)
      .setVisible(false);
    this.bossElements.push(this.bossFrameBottomShadow);
    this.elements.push(this.bossFrameBottomShadow);

    this.bossChannelTrough = scene.add
      .rectangle(bx, by, bw, bh, 0x120c09)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(depth + 10)
      .setVisible(false);
    this.bossElements.push(this.bossChannelTrough);
    this.elements.push(this.bossChannelTrough);

    this.bossGhostBar = scene.add
      .rectangle(bx, by, bw, bh, 0xfca5a5)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(depth + 11)
      .setVisible(false);
    this.bossElements.push(this.bossGhostBar);
    this.elements.push(this.bossGhostBar);

    this.bossGhostHighlight = scene.add
      .rectangle(bx, by, bw, 2, 0xfecaca)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(depth + 11)
      .setVisible(false);
    this.bossElements.push(this.bossGhostHighlight);
    this.elements.push(this.bossGhostHighlight);

    this.bossHealthBar = scene.add
      .rectangle(bx, by, bw, bh, 0xdc2626)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(depth + 12)
      .setVisible(false);
    this.bossElements.push(this.bossHealthBar);
    this.elements.push(this.bossHealthBar);

    this.bossHealthHighlight = scene.add
      .rectangle(bx, by, bw, 2, 0xf87171)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(depth + 12)
      .setVisible(false);
    this.bossElements.push(this.bossHealthHighlight);
    this.elements.push(this.bossHealthHighlight);

    this.bossTitleText = scene.add
      .text(bx + bw / 2, by - 4, bossCfg.name, {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: '#facc15',
        fontStyle: 'bold',
      })
      .setOrigin(0.5, 1)
      .setScrollFactor(0)
      .setDepth(depth + 13)
      .setShadow(1, 1, '#000000', 1)
      .setVisible(false);
    this.bossElements.push(this.bossTitleText);
    this.elements.push(this.bossTitleText);
  }

  /** Hides the whole HUD (title screen); applied at the end of every `update`. */
  setHidden(hidden: boolean): void {
    this.hidden = hidden;
  }

  update(
    player: EntityState | undefined,
    dt: number,
    boss?: { hp: number; maxHp: number; name?: string } | null,
    combatStats?: Pick<CombatStats, 'impactCount' | 'orbMultiplier' | 'points'>,
  ): void {
    this.render(player, dt, boss, combatStats);
    // render() solo enciende sus propias barras; el arte del marco vuelve a visible aquí.
    for (const art of this.skinObjects) {
      (art as Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Visible).setVisible(!this.hidden);
    }
    // Depuración: ?hudbars=0 deja solo la espada (sin barras ni texto) para revisar el arte.
    if (this.barsOff) {
      for (const elem of this.elements) {
        if (!this.skinObjects.includes(elem)) (elem as Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Visible).setVisible(false);
      }
    }
    if (this.hidden) {
      for (const elem of this.elements) {
        (elem as Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Visible).setVisible(false);
      }
      for (const elem of this.bossElements) {
        elem.setVisible(false);
      }
    }
  }

  private render(
    player: EntityState | undefined,
    dt: number,
    boss?: { hp: number; maxHp: number; name?: string } | null,
    combatStats?: Pick<CombatStats, 'impactCount' | 'orbMultiplier' | 'points'>,
  ): void {
    if (!player) {
      this.greenBarBase.setVisible(false);
      this.greenBarHighlight.setVisible(false);
      this.greenBarShadow.setVisible(false);
      this.ghostBar.setVisible(false);
      this.ghostBarHighlight.setVisible(false);
      this.manaBarBase.setVisible(false);
      this.manaBarHighlight.setVisible(false);
      this.manaBarShadow.setVisible(false);
      this.criticalGlow.setVisible(false);
      this.hpText.setText('HP: -/-');
      this.redOrbsText.setText('ORBES: -');
      this.pointsText.setText('PUNTOS: -');
      this.impactCountText.setVisible(false);
      this.orbMultiplierText.setVisible(false);
      this.impactThresholdText.setVisible(false);
      this.impactEffectText.setVisible(false);
      return;
    }

    const maxHp = player.maxHp > 0 ? player.maxHp : 100;
    const currentHp = player.isDead ? 0 : Math.max(0, player.hp);
    const { barHeight, manaBarHeight, ghostDrainSpeed, ghostPauseMs, criticalHpThreshold } =
      CONFIG.presentation.hud;
    const targetBarWidth = maxHp >= 120 ? (CONFIG.presentation.hud.upgradedBarWidth ?? 132) : CONFIG.presentation.hud.barWidth;

    // Redimensionamiento dinámico del marco exterior cuando maxHp se expande a 120 HP
    this.channelTrough.setSize(targetBarWidth, barHeight);

    // Detección de reinicio, curación o daño
    if (currentHp > this.prevHp) {
      // Curación o reinicio instantáneo (tecla R / reset)
      this.ghostHp = currentHp;
      this.ghostPauseTimer = 0;
      this.prevHp = currentHp;
    } else if (currentHp < this.prevHp) {
      // Impacto recibido: iniciar pausa antes de drenar ghost bar
      this.ghostPauseTimer = ghostPauseMs / 1000;
      this.prevHp = currentHp;
    } else {
      // Salud sin cambios en este frame
      if (this.ghostPauseTimer > 0) {
        this.ghostPauseTimer = Math.max(0, this.ghostPauseTimer - dt);
      } else if (this.ghostHp > currentHp) {
        // Drenaje suave tras expirar la pausa
        this.ghostHp = Math.max(currentHp, this.ghostHp - ghostDrainSpeed * dt);
      } else {
        this.ghostHp = currentHp;
      }
    }

    // Si el jugador murió, el ghost bar drena inmediatamente a 0 si la pausa venció
    if (player.isDead && this.ghostPauseTimer <= 0) {
      this.ghostHp = Math.max(0, this.ghostHp - ghostDrainSpeed * 1.5 * dt);
    }

    // Cálculo de anchos en píxeles enteros
    const ratio = Math.max(0, Math.min(1, currentHp / maxHp));
    const ghostRatio = Math.max(0, Math.min(1, this.ghostHp / maxHp));
    const currentWidth = Math.round(targetBarWidth * ratio);
    const ghostWidth = Math.round(targetBarWidth * ghostRatio);

    // 1. Barra frontal verde
    if (currentWidth > 0) {
      this.greenBarBase.setSize(currentWidth, barHeight).setVisible(true);
      this.greenBarHighlight.setSize(currentWidth, 2).setVisible(true);
      this.greenBarShadow.setSize(currentWidth, 2).setVisible(true);
    } else {
      this.greenBarBase.setVisible(false);
      this.greenBarHighlight.setVisible(false);
      this.greenBarShadow.setVisible(false);
    }

    // 2. Barra fantasma roja/ámbar
    if (ghostWidth > 0 && ghostWidth >= currentWidth) {
      this.ghostBar.setSize(ghostWidth, barHeight).setVisible(true);
      this.ghostBarHighlight.setSize(ghostWidth, 2).setVisible(true);
    } else {
      this.ghostBar.setVisible(false);
      this.ghostBarHighlight.setVisible(false);
    }

    // 3. Notches de segmento
    for (let i = 0; i < this.segmentNotches.length; i += 1) {
      const notchOffset = Math.round(((i + 1) * targetBarWidth) / 5);
      const notchHp = (i + 1) * 20;
      const notchExists = notchHp < maxHp;
      this.segmentNotches[i].setVisible(notchExists && ghostWidth > notchOffset);
    }

    // 4. Alerta de salud crítica
    const isCritical = currentHp > 0 && currentHp <= criticalHpThreshold && !player.isDead;
    if (isCritical) {
      this.criticalPulseTimer += dt * 6;
      const pulseAlpha = 0.2 + 0.3 * Math.abs(Math.sin(this.criticalPulseTimer));
      this.criticalGlow
        .setSize(currentWidth > 0 ? currentWidth : targetBarWidth, barHeight)
        .setAlpha(pulseAlpha)
        .setVisible(true);
    } else {
      this.criticalGlow.setVisible(false);
    }

    // 5. Barra de maná azul
    const maxMp = player.maxMp > 0 ? player.maxMp : 100;
    const currentMp = Math.max(0, player.mp ?? 100);
    const targetManaBarWidth = maxMp >= 120 ? (CONFIG.presentation.hud.upgradedManaBarWidth ?? 96) : CONFIG.presentation.hud.manaBarWidth;
    this.manaFrameBg.setSize(targetManaBarWidth + 2, manaBarHeight + 2);
    this.manaChannelTrough.setSize(targetManaBarWidth, manaBarHeight);

    const manaRatio = Math.max(0, Math.min(1, currentMp / maxMp));
    const manaWidth = Math.round(targetManaBarWidth * manaRatio);

    if (manaWidth > 0) {
      this.manaBarBase.setSize(manaWidth, manaBarHeight).setVisible(true);
      this.manaBarHighlight.setSize(manaWidth, 1).setVisible(true);
      this.manaBarShadow.setSize(manaWidth, 1).setVisible(true);
    } else {
      this.manaBarBase.setVisible(false);
      this.manaBarHighlight.setVisible(false);
      this.manaBarShadow.setVisible(false);
    }

    // 6. Texto numérico
    this.hpText.setText(`HP: ${currentHp}/${maxHp}  MP: ${currentMp}/${maxMp}`);

    // 7. Saldo de orbes rojos y nivel de arma
    const redOrbs = player.redOrbs ?? 0;
    this.redOrbsText.setText(`ORBES: ${redOrbs}`);
    const points = combatStats?.points ?? 0;
    this.pointsText.setText(`PUNTOS: ${points}`);

    const impactCount = combatStats?.impactCount ?? 0;
    const orbMultiplier = combatStats?.orbMultiplier ?? 1;
    if (impactCount <= 0) {
      this.impactCountText.setVisible(false);
      this.orbMultiplierText.setVisible(false);
      this.impactThresholdText.setVisible(false);
      this.impactEffectText.setVisible(false);
    } else {
      this.impactCountText
        .setText(`${impactCount}`)
        .setVisible(true);
      this.orbMultiplierText
        .setText('IMPACTOS')
        .setVisible(true);

      if (impactCount >= 10) {
        const threshold = `×${Number.isInteger(orbMultiplier)
          ? orbMultiplier
          : orbMultiplier.toFixed(1).replace('.', ',')}`;
        this.impactThresholdText
          .setText(threshold)
          .setVisible(true);
        this.impactEffectText
          .setText('¡BRUTAL!')
          .setVisible(true);
      } else {
        this.impactThresholdText.setVisible(false);
        this.impactEffectText.setVisible(false);
      }
      if (impactCount !== this.lastImpactCount) {
        this.scene.tweens.add({
          targets: [this.impactCountText, this.orbMultiplierText],
          scaleX: 1.12,
          scaleY: 1.12,
          duration: 55,
          yoyo: true,
          ease: 'Sine.Out',
        });
      }
    }
    this.lastImpactCount = impactCount;

    // 8. Iluminación de ranuras de Ojos de Górgona
    const gorgonEyes = player.gorgonEyes ?? 0;
    const gorgonUpgrades = player.gorgonUpgrades ?? 0;
    for (let i = 0; i < 6; i += 1) {
      const isLit = i < gorgonEyes;
      this.gorgonEyeGems[i].setFillStyle(isLit ? 0x22c55e : 0x064e3b, isLit ? 1.0 : 0.35);
    }

    // 9. Iluminación de ranuras de Plumas de Fénix (azul zafiro)
    const phoenixFeathers = player.phoenixFeathers ?? 0;
    const phoenixUpgrades = player.phoenixUpgrades ?? 0;
    for (let i = 0; i < 6; i += 1) {
      const isLit = i < phoenixFeathers;
      this.phoenixFeatherGems[i].setFillStyle(isLit ? 0x38bdf8 : 0x0c4a6e, isLit ? 1.0 : 0.35);
    }

    // 10. Actualización de la barra ornamental de Jefe (La Hidra de Lerna)
    if (boss && boss.maxHp > 0) {
      const bHp = Math.max(0, boss.hp);
      const bMax = boss.maxHp;
      const bw = CONFIG.presentation.hud.boss?.barWidth ?? 200;
      const bh = CONFIG.presentation.hud.boss?.barHeight ?? 7;

      if (bHp > this.bossPrevHp) {
        this.bossGhostHp = bHp;
        this.bossPrevHp = bHp;
        this.bossGhostPauseTimer = 0;
      } else if (bHp < this.bossPrevHp) {
        this.bossGhostPauseTimer = 0.2;
        this.bossPrevHp = bHp;
      } else {
        if (this.bossGhostPauseTimer > 0) {
          this.bossGhostPauseTimer = Math.max(0, this.bossGhostPauseTimer - dt);
        } else if (this.bossGhostHp > bHp) {
          this.bossGhostHp = Math.max(bHp, this.bossGhostHp - 50 * dt);
        } else {
          this.bossGhostHp = bHp;
        }
      }

      const bRatio = Math.max(0, Math.min(1, bHp / bMax));
      const bGhostRatio = Math.max(0, Math.min(1, this.bossGhostHp / bMax));
      const bCurW = Math.round(bw * bRatio);
      const bGhostW = Math.round(bw * bGhostRatio);

      const isVisible = bHp > 0 || bGhostW > 0;
      this.bossFrameBg.setVisible(isVisible);
      this.bossFrameTopBevel.setVisible(isVisible);
      this.bossFrameBottomShadow.setVisible(isVisible);
      this.bossChannelTrough.setVisible(isVisible);
      this.bossTitleText.setVisible(isVisible);

      if (isVisible && bCurW > 0) {
        this.bossHealthBar.setSize(bCurW, bh).setVisible(true);
        this.bossHealthHighlight.setSize(bCurW, 2).setVisible(true);
      } else {
        this.bossHealthBar.setVisible(false);
        this.bossHealthHighlight.setVisible(false);
      }

      if (isVisible && bGhostW > 0) {
        this.bossGhostBar.setSize(bGhostW, bh).setVisible(true);
        this.bossGhostHighlight.setSize(bGhostW, 2).setVisible(true);
      } else {
        this.bossGhostBar.setVisible(false);
        this.bossGhostHighlight.setVisible(false);
      }
    } else {
      for (const elem of this.bossElements) {
        elem.setVisible(false);
      }
    }

    // Registro de métricas para introspección y tests CDP
    this.lastMetrics = {
      currentHp,
      ghostHp: Number(this.ghostHp.toFixed(2)),
      maxHp,
      currentMp,
      maxMp,
      manaWidth,
      currentWidth,
      ghostWidth,
      ratio: Number(ratio.toFixed(3)),
      ghostRatio: Number(ghostRatio.toFixed(3)),
      isCritical,
      isDead: Boolean(player.isDead),
      ghostPauseTimer: Number(this.ghostPauseTimer.toFixed(3)),
      redOrbs,
      points,
      gorgonEyes,
      gorgonUpgrades,
      phoenixFeathers,
      phoenixUpgrades,
      ...(boss ? { bossHp: boss.hp, bossMaxHp: boss.maxHp } : {}),
    };
  }

  getMetrics(): HudMetrics {
    return { ...this.lastMetrics };
  }

  destroy(): void {
    for (const elem of this.elements) {
      elem.destroy();
    }
    this.elements.length = 0;
    this.segmentNotches.length = 0;
    this.gorgonEyeSlots.length = 0;
    this.gorgonEyeGems.length = 0;
    this.phoenixFeatherSlots.length = 0;
    this.phoenixFeatherGems.length = 0;
  }
}
