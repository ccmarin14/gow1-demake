import Phaser from 'phaser';
import { CONFIG } from '../config';
import type { EntityState } from '../sim/types';

export interface HudMetrics {
  currentHp: number;
  ghostHp: number;
  maxHp: number;
  currentWidth: number;
  ghostWidth: number;
  ratio: number;
  ghostRatio: number;
  isCritical: boolean;
  isDead: boolean;
  ghostPauseTimer: number;
}

/**
 * Capa de interfaz de usuario en pantalla (HUD) inspirada en el diseño canónico de
 * God of War 1 (PS2) y God of War: Betrayal adaptada al lienzo pixel art de 480×270:
 *
 * - Medallón de bronce y piedra griega tallada en la esquina superior izquierda.
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

  // Geometría del marco y fondo
  private readonly frameBg: Phaser.GameObjects.Rectangle;
  private readonly frameTopBevel: Phaser.GameObjects.Rectangle;
  private readonly frameBottomShadow: Phaser.GameObjects.Rectangle;
  private readonly frameEndCap: Phaser.GameObjects.Rectangle;
  private readonly channelTrough: Phaser.GameObjects.Rectangle;

  // Medallón ornamental izquierdo
  private readonly medallionOuter: Phaser.GameObjects.Arc;
  private readonly medallionInner: Phaser.GameObjects.Arc;
  private readonly medallionCore: Phaser.GameObjects.Arc;
  private readonly medallionHighlight: Phaser.GameObjects.Arc;

  // Barra fantasma (Ghost Health)
  private readonly ghostBar: Phaser.GameObjects.Rectangle;
  private readonly ghostBarHighlight: Phaser.GameObjects.Rectangle;

  // Barra verde frontal
  private readonly greenBarBase: Phaser.GameObjects.Rectangle;
  private readonly greenBarHighlight: Phaser.GameObjects.Rectangle;
  private readonly greenBarShadow: Phaser.GameObjects.Rectangle;
  private readonly segmentNotches: Phaser.GameObjects.Rectangle[] = [];

  // Alerta de salud crítica
  private readonly criticalGlow: Phaser.GameObjects.Rectangle;
  private criticalPulseTimer = 0;

  // Texto numérico
  private readonly hpText: Phaser.GameObjects.Text;

  // Estado del drenaje fantasma
  private prevHp = 100;
  private ghostHp = 100;
  private ghostPauseTimer = 0; // segundos
  private lastMetrics: HudMetrics = {
    currentHp: 100,
    ghostHp: 100,
    maxHp: 100,
    currentWidth: 110,
    ghostWidth: 110,
    ratio: 1,
    ghostRatio: 1,
    isCritical: false,
    isDead: false,
    ghostPauseTimer: 0,
  };

  constructor(scene: Phaser.Scene) {
    const { x, y, barWidth, barHeight, depth } = CONFIG.presentation.hud;

    // Coordenadas calculadas
    const barX = x + 10;
    const barY = y;
    const frameW = barWidth + 4;
    const frameH = barHeight + 4;

    // 1. Marco exterior de piedra y bronce
    this.frameBg = scene.add
      .rectangle(barX - 2, barY - 2, frameW, frameH, 0x18100c)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(depth);
    this.elements.push(this.frameBg);

    this.frameTopBevel = scene.add
      .rectangle(barX - 2, barY - 2, frameW, 1, 0xc49a45)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(depth + 5);
    this.elements.push(this.frameTopBevel);

    this.frameBottomShadow = scene.add
      .rectangle(barX - 2, barY + barHeight + 1, frameW, 1, 0x0c0705)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(depth + 5);
    this.elements.push(this.frameBottomShadow);

    this.frameEndCap = scene.add
      .rectangle(barX + barWidth + 1, barY - 2, 3, frameH, 0x92662c)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(depth + 5);
    this.elements.push(this.frameEndCap);

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

    // Notches clásicas de segmento (cada 22 px = 20 HP)
    for (let s = 1; s <= 4; s += 1) {
      const notchX = barX + s * 22;
      const notch = scene.add
        .rectangle(notchX, barY, 1, barHeight, 0x0a2612, 0.75)
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(depth + 3);
      this.segmentNotches.push(notch);
      this.elements.push(notch);
    }

    // 4. Alerta de salud crítica
    this.criticalGlow = scene.add
      .rectangle(barX, barY, barWidth, barHeight, 0xef4444, 0.4)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(depth + 4)
      .setVisible(false);
    this.elements.push(this.criticalGlow);

    // 5. Medallón circular a la izquierda
    const medX = x;
    const medY = y + barHeight / 2;

    this.medallionOuter = scene.add
      .circle(medX, medY, 9, 0x92662c)
      .setStrokeStyle(1, 0xc49a45)
      .setScrollFactor(0)
      .setDepth(depth + 5);
    this.elements.push(this.medallionOuter);

    this.medallionInner = scene.add
      .circle(medX, medY, 7, 0x1f140e)
      .setScrollFactor(0)
      .setDepth(depth + 6);
    this.elements.push(this.medallionInner);

    this.medallionCore = scene.add
      .circle(medX, medY, 4, 0xb45309)
      .setScrollFactor(0)
      .setDepth(depth + 7);
    this.elements.push(this.medallionCore);

    this.medallionHighlight = scene.add
      .circle(medX - 1, medY - 1, 1.5, 0xfde047)
      .setScrollFactor(0)
      .setDepth(depth + 8);
    this.elements.push(this.medallionHighlight);

    // 6. Texto numérico pixel-art
    this.hpText = scene.add
      .text(barX, barY + barHeight + 3, 'HP: 100/100', {
        fontFamily: 'monospace',
        fontSize: '7px',
        color: '#cbd5e1',
      })
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(depth + 6)
      .setShadow(1, 1, '#000000', 1);
    this.elements.push(this.hpText);
  }

  update(player: EntityState | undefined, dt: number): void {
    if (!player) {
      this.greenBarBase.setVisible(false);
      this.greenBarHighlight.setVisible(false);
      this.greenBarShadow.setVisible(false);
      this.ghostBar.setVisible(false);
      this.ghostBarHighlight.setVisible(false);
      this.criticalGlow.setVisible(false);
      this.hpText.setText('HP: -/-');
      return;
    }

    const maxHp = player.maxHp > 0 ? player.maxHp : 100;
    const currentHp = player.isDead ? 0 : Math.max(0, player.hp);
    const { barWidth, barHeight, ghostDrainSpeed, ghostPauseMs, criticalHpThreshold } =
      CONFIG.presentation.hud;

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
    const currentWidth = Math.round(barWidth * ratio);
    const ghostWidth = Math.round(barWidth * ghostRatio);

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
      const notchOffset = (i + 1) * 22;
      this.segmentNotches[i].setVisible(ghostWidth > notchOffset);
    }

    // 4. Alerta de salud crítica
    const isCritical = currentHp > 0 && currentHp <= criticalHpThreshold && !player.isDead;
    if (isCritical) {
      this.criticalPulseTimer += dt * 6;
      const pulseAlpha = 0.2 + 0.3 * Math.abs(Math.sin(this.criticalPulseTimer));
      this.criticalGlow
        .setSize(currentWidth > 0 ? currentWidth : barWidth, barHeight)
        .setAlpha(pulseAlpha)
        .setVisible(true);
    } else {
      this.criticalGlow.setVisible(false);
    }

    // 5. Texto numérico
    this.hpText.setText(`HP: ${currentHp}/${maxHp}`);

    // Registro de métricas para introspección y tests CDP
    this.lastMetrics = {
      currentHp,
      ghostHp: Number(this.ghostHp.toFixed(2)),
      maxHp,
      currentWidth,
      ghostWidth,
      ratio: Number(ratio.toFixed(3)),
      ghostRatio: Number(ghostRatio.toFixed(3)),
      isCritical,
      isDead: Boolean(player.isDead),
      ghostPauseTimer: Number(this.ghostPauseTimer.toFixed(3)),
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
  }
}
