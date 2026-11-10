import Phaser from 'phaser';
import { CONFIG } from '../config';
import type { EntityState } from '../sim/types';
import { getLegionnaireFrameKey } from './legionnaireFrames';

/**
 * Presentación visual del legionario no-muerto:
 * - Sprite con cuadro seleccionado según el estado de la IA (`aiState`, `aiTicks`, `vy`).
 * - Orientación horizontal por `facing`.
 * - Sombra de contacto elíptica en el suelo idéntica a la de Kratos.
 * - Sin parpadeos de color artificiales (el aviso/telegraph ya viene ilustrado en los cuadros).
 */
export class EnemyView {
  private readonly sprite: Phaser.GameObjects.Sprite;
  private readonly shadow: Phaser.GameObjects.Ellipse;

  constructor(
    scene: Phaser.Scene,
    spawnX: number,
    spawnY: number,
  ) {
    const shadowCfg = CONFIG.presentation.playerShadow;
    this.shadow = scene.add
      .ellipse(spawnX, spawnY - 1, shadowCfg.width, shadowCfg.height, shadowCfg.color, shadowCfg.alpha)
      .setDepth(-0.1)
      .setVisible(false);

    this.sprite = scene.add
      .sprite(spawnX, spawnY, 'legionnaire-idle-00')
      .setOrigin(0.5, 1)
      .setDepth(1);
  }

  update(enemy: Readonly<EntityState>, player?: Readonly<EntityState> | null): void {
    let textureKey = getLegionnaireFrameKey(enemy);
    let drawX = enemy.x;
    let drawY = enemy.y;

    const isGrabVictim = Boolean(player && player.grabTargetId === enemy.id && player.grabPhase !== 'none');
    if (isGrabVictim && player) {
      const t = player.grabTicks;
      const f = player.facing;
      if (player.grabPhase === 'hold' || player.grabPhase === 'finisher_qte' || player.grabPhase === 'pummel') {
        // Sujeto del cuello a +16 px frente a Kratos y alzado 2..3 px sobre la cubierta (alineado con hand_l en grab-hold)
        const lift = t < 3 ? t : Math.floor(t / 12) % 2 === 0 ? 2 : 3;
        drawX = player.x + f * 16;
        drawY = player.y - lift;
        textureKey =
          player.grabPhase === 'pummel'
            ? t >= 4 && t <= 8
              ? 'legionnaire-hitstun-01'
              : 'legionnaire-hitstun-00'
            : t < 3 || Math.floor(t / 12) % 2 === 0
              ? 'legionnaire-hitstun-00'
              : 'legionnaire-juggle-00';
      } else if (player.grabPhase === 'throw') {
        // Lanzamiento con □: alzado horizontalmente cruzando el pecho (ticks 0..5, grab-throw-a) y proyectado en vuelo (ticks 6+)
        if (t < 6) {
          drawX = player.x + f * 12;
          drawY = player.y - 12;
          textureKey = 'legionnaire-juggle-01';
        } else {
          drawX = enemy.x;
          drawY = enemy.y;
          textureKey = 'legionnaire-juggle-01';
        }
      } else if (player.grabPhase === 'break') {
        // Quiebre con △: izado sobre la cabeza de Kratos (ticks 0..10, grab-break-a) y quebrado contra el suelo (ticks 11+)
        if (t < 11) {
          drawX = player.x + f * 6;
          drawY = player.y - 22;
          textureKey = 'legionnaire-juggle-01';
        } else if (t < 18) {
          drawX = player.x + f * 18;
          drawY = player.y;
          textureKey = 'legionnaire-death-01';
        } else {
          drawX = player.x + f * 18;
          drawY = player.y;
          textureKey = 'legionnaire-death-02';
        }
      } else if (player.grabPhase === 'slam' || player.grabPhase === 'finisher_slam') {
        // Azote con ○: levantado frente al hombro (ticks 0..9, grab-slam-a) y estrellado contra las tablas (ticks 10+, grab-slam-b)
        if (t < 10) {
          drawX = player.x + f * 14;
          drawY = player.y - 16;
          textureKey = 'legionnaire-juggle-00';
        } else if (t < 18) {
          drawX = player.x + f * 18;
          drawY = player.y;
          textureKey = 'legionnaire-death-01';
        } else {
          drawX = enemy.x;
          drawY = player.y;
          textureKey = 'legionnaire-death-02';
        }
      }
    }

    if (this.sprite.texture.key !== textureKey) {
      this.sprite.setTexture(textureKey);
    }

    // Leve sacudida en hitstun para reforzar el impacto
    const shakeX = !isGrabVictim && enemy.hitstunTicks > 0 && enemy.hitstunTicks % 2 === 1 ? 1 : 0;
    this.sprite.setPosition(drawX + shakeX, drawY);
    this.sprite.setFlipX(enemy.facing === -1);
    this.sprite.setRotation(0);

    // Sombra de contacto terrestre (se atenúa cuando está alzado en el aire o muere)
    this.shadow.setPosition(drawX, enemy.y - 1);
    this.shadow.setVisible(
      CONFIG.presentation.playerShadow.enabled && (enemy.grounded || isGrabVictim) && enemy.aiState !== 'death',
    );
  }

  destroy(): void {
    this.shadow.destroy();
    this.sprite.destroy();
  }
}
