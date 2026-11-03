import Phaser from 'phaser';
import { CONFIG } from '../config';
import type { CombatStats, EntityState, GameFlowState } from '../sim/types';

export class GameFlowOverlay {
  private readonly depth: number;
  private pulseTimer = 0;

  // Title Screen Elements
  private titleContainer: Phaser.GameObjects.Container;
  private titleVeil: Phaser.GameObjects.Rectangle;
  private titleOmegaText: Phaser.GameObjects.Text;
  private titleMainText: Phaser.GameObjects.Text;
  private titleSubText: Phaser.GameObjects.Text;
  private titlePromptText: Phaser.GameObjects.Text;
  private titleControlsBox: Phaser.GameObjects.Container;

  // Pause Menu Elements
  private pauseContainer: Phaser.GameObjects.Container;
  private pauseVeil: Phaser.GameObjects.Rectangle;
  private pauseBoxBg: Phaser.GameObjects.Rectangle;
  private pauseBoxBevel: Phaser.GameObjects.Rectangle;
  private pauseBoxShadow: Phaser.GameObjects.Rectangle;
  private pauseTitleText: Phaser.GameObjects.Text;
  private pauseHeroSummaryText: Phaser.GameObjects.Text;
  private pauseCombosText: Phaser.GameObjects.Text;
  private pausePromptText: Phaser.GameObjects.Text;

  // Victory Screen Elements
  private victoryContainer: Phaser.GameObjects.Container;
  private victoryVeil: Phaser.GameObjects.Rectangle;
  private victoryBoxBg: Phaser.GameObjects.Rectangle;
  private victoryBoxBevel: Phaser.GameObjects.Rectangle;
  private victoryBoxShadow: Phaser.GameObjects.Rectangle;
  private victoryTitleText: Phaser.GameObjects.Text;
  private victorySubText: Phaser.GameObjects.Text;
  private victoryStatsText: Phaser.GameObjects.Text;
  private victoryPromptText: Phaser.GameObjects.Text;

  // Game Over Elements
  private gameOverContainer: Phaser.GameObjects.Container;
  private gameOverVeil: Phaser.GameObjects.Rectangle;
  private gameOverBoxBg: Phaser.GameObjects.Rectangle;
  private gameOverBoxBevel: Phaser.GameObjects.Rectangle;
  private gameOverTitleText: Phaser.GameObjects.Text;
  private gameOverPromptText: Phaser.GameObjects.Text;

  private currentFlowState: GameFlowState = 'playing';

  constructor(scene: Phaser.Scene) {
    this.depth = CONFIG.ui?.depth ?? 150;
    const { width, height } = CONFIG.internal;
    const colors = CONFIG.ui.colors;

    // ========================================================
    // 1. TITLE SCREEN CONTAINER
    // ========================================================
    this.titleContainer = scene.add.container(0, 0).setDepth(this.depth).setScrollFactor(0);
    this.titleVeil = scene.add
      .rectangle(0, 0, width, height, 0x070a12, 0.88)
      .setOrigin(0, 0)
      .setScrollFactor(0);
    this.titleContainer.add(this.titleVeil);

    this.titleOmegaText = scene.add
      .text(width / 2, height / 2 - 40, 'Ω', {
        color: '#ca8a04',
        fontFamily: 'serif',
        fontSize: '72px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setAlpha(0.25)
      .setScrollFactor(0);
    this.titleContainer.add(this.titleOmegaText);

    this.titleMainText = scene.add
      .text(width / 2, height / 2 - 50, CONFIG.ui.title, {
        color: colors.goldBright,
        fontFamily: CONFIG.ui.fontFamily,
        fontSize: '22px',
        fontStyle: 'bold',
        stroke: '#7f1d1d',
        strokeThickness: 3,
        shadow: { offsetX: 0, offsetY: 2, color: '#000000', blur: 4, fill: true },
      })
      .setOrigin(0.5)
      .setScrollFactor(0);
    this.titleContainer.add(this.titleMainText);

    this.titleSubText = scene.add
      .text(width / 2, height / 2 - 28, CONFIG.ui.subtitle, {
        color: colors.bronze,
        fontFamily: CONFIG.ui.fontFamily,
        fontSize: '9px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setScrollFactor(0);
    this.titleContainer.add(this.titleSubText);

    this.titlePromptText = scene.add
      .text(width / 2, height / 2 + 8, '[ENTER / ESPACIO] INICIAR AVENTURA', {
        color: colors.gold,
        fontFamily: CONFIG.ui.fontFamily,
        fontSize: '11px',
        fontStyle: 'bold',
        backgroundColor: '#000000cc',
        padding: { x: 10, y: 4 },
      })
      .setOrigin(0.5)
      .setScrollFactor(0);
    this.titleContainer.add(this.titlePromptText);

    // Controls guide card in Title
    this.titleControlsBox = scene.add.container(width / 2, height / 2 + 68);
    const ctrlBg = scene.add
      .rectangle(0, 0, 380, 52, 0x14100c, 0.9)
      .setStrokeStyle(1, 0x92662c)
      .setOrigin(0.5);
    const ctrlText = scene.add
      .text(
        0,
        0,
        'A/D: Moverse · ESPACIO: Salto / Doble · SHIFT: Rodada\n' +
        'J: Golpe □ · I: Golpe △ · Q: Guardia/Parry · U: Ira de Poseidón\n' +
        'E: Cofre · ESC: Pausa',
        {
          color: '#cbd5e1',
          fontFamily: CONFIG.ui.fontFamily,
          fontSize: '8px',
          align: 'center',
          lineSpacing: 3,
        },
      )
      .setOrigin(0.5);
    this.titleControlsBox.add([ctrlBg, ctrlText]);
    this.titleContainer.add(this.titleControlsBox);
    this.titleContainer.setVisible(false);

    // ========================================================
    // 2. PAUSE MENU CONTAINER
    // ========================================================
    this.pauseContainer = scene.add.container(0, 0).setDepth(this.depth).setScrollFactor(0);
    this.pauseVeil = scene.add
      .rectangle(0, 0, width, height, 0x000000, 0.72)
      .setOrigin(0, 0)
      .setScrollFactor(0);
    this.pauseContainer.add(this.pauseVeil);

    const pauseW = 340;
    const pauseH = 180;
    const pauseX = width / 2;
    const pauseY = height / 2;

    this.pauseBoxBg = scene.add
      .rectangle(pauseX, pauseY, pauseW, pauseH, colors.panelBg, 0.95)
      .setOrigin(0.5);
    this.pauseBoxBevel = scene.add
      .rectangle(pauseX, pauseY - pauseH / 2, pauseW, 2, colors.panelBevel)
      .setOrigin(0.5, 0);
    this.pauseBoxShadow = scene.add
      .rectangle(pauseX, pauseY + pauseH / 2 - 2, pauseW, 2, colors.panelShadow)
      .setOrigin(0.5, 0);
    this.pauseContainer.add([this.pauseBoxBg, this.pauseBoxBevel, this.pauseBoxShadow]);

    this.pauseTitleText = scene.add
      .text(pauseX, pauseY - 72, 'PAUSA', {
        color: colors.goldBright,
        fontFamily: CONFIG.ui.fontFamily,
        fontSize: '15px',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 2,
      })
      .setOrigin(0.5);
    this.pauseContainer.add(this.pauseTitleText);

    this.pauseHeroSummaryText = scene.add
      .text(pauseX - 150, pauseY - 45, '', {
        color: '#e2e8f0',
        fontFamily: CONFIG.ui.fontFamily,
        fontSize: '9px',
        lineSpacing: 4,
      })
      .setOrigin(0, 0);
    this.pauseContainer.add(this.pauseHeroSummaryText);

    this.pauseCombosText = scene.add
      .text(
        pauseX + 10,
        pauseY - 45,
        'COMBOS CANÓNICOS:\n' +
        '• J ×6     : Combo de cuadro\n' +
        '• J-J-I    : Pluma de Prometeo\n' +
        '• Mant. I  : Ascensión Espartana\n' +
        '• Q impacto: Bloqueo / Parry\n' +
        '• SHIFT    : Rodada Evasiva\n' +
        '• U        : Ira de Poseidón',
        {
          color: '#cbd5e1',
          fontFamily: CONFIG.ui.fontFamily,
          fontSize: '8px',
          lineSpacing: 3,
        },
      )
      .setOrigin(0, 0);
    this.pauseContainer.add(this.pauseCombosText);

    this.pausePromptText = scene.add
      .text(pauseX, pauseY + 68, '[ESC] REANUDAR  ·  [R] REAPARECER EN CHECKPOINT', {
        color: colors.gold,
        fontFamily: CONFIG.ui.fontFamily,
        fontSize: '9px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.pauseContainer.add(this.pausePromptText);
    this.pauseContainer.setVisible(false);

    // ========================================================
    // 3. VICTORY SCREEN CONTAINER
    // ========================================================
    this.victoryContainer = scene.add.container(0, 0).setDepth(this.depth).setScrollFactor(0);
    this.victoryVeil = scene.add
      .rectangle(0, 0, width, height, 0x050409, 0.82)
      .setOrigin(0, 0)
      .setScrollFactor(0);
    this.victoryContainer.add(this.victoryVeil);

    const victW = 350;
    const victH = 190;
    const victX = width / 2;
    const victY = height / 2;

    this.victoryBoxBg = scene.add
      .rectangle(victX, victY, victW, victH, 0x160f0b, 0.96)
      .setOrigin(0.5);
    this.victoryBoxBevel = scene.add
      .rectangle(victX, victY - victH / 2, victW, 2, 0xfacc15)
      .setOrigin(0.5, 0);
    this.victoryBoxShadow = scene.add
      .rectangle(victX, victY + victH / 2 - 2, victW, 2, 0x0a0503)
      .setOrigin(0.5, 0);
    this.victoryContainer.add([this.victoryBoxBg, this.victoryBoxBevel, this.victoryBoxShadow]);

    this.victoryTitleText = scene.add
      .text(victX, victY - 74, '¡NIVEL 1 COMPLETADO!', {
        color: colors.goldBright,
        fontFamily: CONFIG.ui.fontFamily,
        fontSize: '15px',
        fontStyle: 'bold',
        stroke: '#7f1d1d',
        strokeThickness: 3,
      })
      .setOrigin(0.5);
    this.victoryContainer.add(this.victoryTitleText);

    this.victorySubText = scene.add
      .text(victX, victY - 54, 'LA HIDRA DE LERNA HA SIDO DERROTADA EN LA PROA', {
        color: colors.bronze,
        fontFamily: CONFIG.ui.fontFamily,
        fontSize: '8px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.victoryContainer.add(this.victorySubText);

    this.victoryStatsText = scene.add
      .text(victX, victY - 2, '', {
        color: '#f8fafc',
        fontFamily: CONFIG.ui.fontFamily,
        fontSize: '9px',
        align: 'center',
        lineSpacing: 5,
      })
      .setOrigin(0.5);
    this.victoryContainer.add(this.victoryStatsText);

    this.victoryPromptText = scene.add
      .text(victX, victY + 70, '[R] VOLVER A JUGAR  ·  [ESC] MENÚ PRINCIPAL', {
        color: colors.gold,
        fontFamily: CONFIG.ui.fontFamily,
        fontSize: '9px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.victoryContainer.add(this.victoryPromptText);
    this.victoryContainer.setVisible(false);

    // ========================================================
    // 4. GAME OVER CONTAINER
    // ========================================================
    this.gameOverContainer = scene.add.container(0, 0).setDepth(this.depth).setScrollFactor(0);
    this.gameOverVeil = scene.add
      .rectangle(0, 0, width, height, 0x220505, 0.78)
      .setOrigin(0, 0)
      .setScrollFactor(0);
    this.gameOverContainer.add(this.gameOverVeil);

    this.gameOverBoxBg = scene.add
      .rectangle(width / 2, height / 2, 280, 75, 0x140505, 0.9)
      .setOrigin(0.5);
    this.gameOverBoxBevel = scene.add
      .rectangle(width / 2, height / 2 - 37, 280, 2, 0xef4444)
      .setOrigin(0.5, 0);
    this.gameOverContainer.add([this.gameOverBoxBg, this.gameOverBoxBevel]);

    this.gameOverTitleText = scene.add
      .text(width / 2, height / 2 - 12, 'HAS MUERTO', {
        color: '#ef4444',
        fontFamily: CONFIG.ui.fontFamily,
        fontSize: '18px',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(0.5);
    this.gameOverContainer.add(this.gameOverTitleText);

    this.gameOverPromptText = scene.add
      .text(width / 2, height / 2 + 16, '[R] REAPARECER EN CHECKPOINT', {
        color: '#fef08a',
        fontFamily: CONFIG.ui.fontFamily,
        fontSize: '9px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.gameOverContainer.add(this.gameOverPromptText);
    this.gameOverContainer.setVisible(false);
  }

  update(
    flowState: GameFlowState,
    player?: EntityState,
    stats?: CombatStats,
    hasCheckpoint: boolean = false,
    dt: number = 0.016,
  ): void {
    this.currentFlowState = flowState;
    this.pulseTimer += dt * 4;
    const pulseAlpha = 0.7 + 0.3 * Math.abs(Math.sin(this.pulseTimer));

    // Visibility toggles
    this.titleContainer.setVisible(flowState === 'title');
    this.pauseContainer.setVisible(flowState === 'paused');
    this.victoryContainer.setVisible(flowState === 'victory');
    this.gameOverContainer.setVisible(flowState === 'gameover');

    if (flowState === 'title') {
      this.titlePromptText.setAlpha(pulseAlpha);
    } else if (flowState === 'paused') {
      const hp = player ? player.hp : 100;
      const maxHp = player ? player.maxHp : 100;
      const mp = player && player.mp !== undefined ? player.mp : 100;
      const maxMp = player && player.maxMp !== undefined ? player.maxMp : 100;
      const redOrbs = player && player.redOrbs ? player.redOrbs : 0;
      const eyes = player && player.gorgonEyes ? player.gorgonEyes : 0;
      const feathers = player && player.phoenixFeathers ? player.phoenixFeathers : 0;

      this.pauseHeroSummaryText.setText(
        'RESUMEN DEL HÉROE:\n' +
        `• SALUD: ${hp}/${maxHp}\n` +
        `• MANÁ:  ${mp}/${maxMp}\n` +
        `• ORBES ROJOS: ${redOrbs}\n` +
        `• OJOS DE GÓRGONA: ${eyes}/6\n` +
        `• PLUMAS DE FÉNIX: ${feathers}/6`,
      );
      this.pausePromptText.setAlpha(pulseAlpha);
    } else if (flowState === 'victory') {
      const s = stats ?? {
        totalKills: 0,
        redOrbs: player?.redOrbs ?? 0,
        chestsOpened: 0,
        totalChests: 4,
        rank: 'GUERRERO ESPARTANO',
      };
      this.victoryStatsText.setText(
        `ENEMIGOS ABATIDOS: ${s.totalKills}\n` +
        `ORBES ROJOS RECOLECTADOS: ${s.redOrbs}\n` +
        `COFRES DESCUBIERTOS: ${s.chestsOpened} / ${s.totalChests}\n\n` +
        `RANGO DE COMBATE: ★ ${s.rank} ★`,
      );
      this.victoryPromptText.setAlpha(pulseAlpha);
    } else if (flowState === 'gameover') {
      this.gameOverPromptText
        .setText(hasCheckpoint ? '[R] REAPARECER EN CHECKPOINT' : '[R] REINTENTAR')
        .setAlpha(pulseAlpha);
    }
  }

  isTitleVisible(): boolean {
    return this.titleContainer.visible;
  }

  isPauseVisible(): boolean {
    return this.pauseContainer.visible;
  }

  isVictoryVisible(): boolean {
    return this.victoryContainer.visible;
  }

  isGameOverVisible(): boolean {
    return this.gameOverContainer.visible;
  }

  getFlowState(): GameFlowState {
    return this.currentFlowState;
  }

  destroy(): void {
    this.titleContainer.destroy();
    this.pauseContainer.destroy();
    this.victoryContainer.destroy();
    this.gameOverContainer.destroy();
  }
}
