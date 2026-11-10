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
    let rotation = 0;

    const isGrabVictim = Boolean(player && player.grabTargetId === enemy.id && player.grabPhase !== 'none');
    if (isGrabVictim && player) {
      const t = player.grabTicks;
      const f = player.facing;
      if (player.grabPhase === 'hold' || player.grabPhase === 'finisher_qte') {
        // Alzado del cuello en vilo a 12 px sobre la cubierta, pataleando en la presa de Kratos
        const lift = Math.min(12, t * 3);
        drawX = player.x + f * 17;
        drawY = player.y - lift;
        rotation = f * (Math.floor(t / 5) % 2 === 0 ? 0.12 : 0.04);
        textureKey = Math.floor(t / 6) % 2 === 0 ? 'legionnaire-hitstun-00' : 'legionnaire-juggle-00';
      } else if (player.grabPhase === 'break') {
        // Quiebre con △: izado sobre la cabeza de Kratos (ticks 0..6) y estrellado en seco hacia abajo (ticks 7..10)
        if (t <= 6) {
          const u = t / 6;
          drawX = player.x + f * (16 - 8 * u);
          drawY = player.y - (12 + 16 * u);
          rotation = f * (0.2 + 0.95 * u);
          textureKey = 'legionnaire-juggle-00';
        } else if (t <= 10) {
          const u = (t - 6) / 4;
          drawX = player.x + f * (8 + 16 * u);
          drawY = player.y - Math.round(28 * (1 - u));
          rotation = f * (1.15 + 0.35 * u);
          textureKey = 'legionnaire-juggle-01';
        } else {
          drawX = enemy.x;
          drawY = enemy.y;
          rotation = 0;
          textureKey = 'legionnaire-death-02';
        }
      } else if (player.grabPhase === 'slam' || player.grabPhase === 'finisher_slam') {
        // Azote con ○: arco por encima del hombro (ticks 0..8) e impacto contra las tablas (tick 9+)
        if (t <= 8) {
          const u = t / 8;
          drawX = player.x + f * (14 + 14 * u);
          drawY = player.y - Math.round(22 * Math.sin(u * Math.PI));
          rotation = f * (0.15 + 1.35 * u);
          textureKey = u < 0.5 ? 'legionnaire-juggle-00' : 'legionnaire-juggle-01';
        } else {
          drawX = enemy.x;
          drawY = enemy.y;
          rotation = 0;
          textureKey = 'legionnaire-death-02';
        }
      }
    } else if (enemy.aiState === 'juggle' && Math.abs(enemy.vx) >= 180) {
      // Lanzado como proyectil humano con □: cuerpo inclinado en vuelo horizontal rasante
      rotation = Math.sign(enemy.vx) * 0.65;
    }

    if (this.sprite.texture.key !== textureKey) {
      this.sprite.setTexture(textureKey);
    }

    // Leve sacudida en hitstun para reforzar el impacto
    const shakeX = !isGrabVictim && enemy.hitstunTicks > 0 && enemy.hitstunTicks % 2 === 1 ? 1 : 0;
    this.sprite.setPosition(drawX + shakeX, drawY);
    this.sprite.setFlipX(enemy.facing === -1);
    this.sprite.setRotation(rotation);

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
