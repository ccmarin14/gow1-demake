import Phaser from 'phaser';
import { CONFIG } from '../config';
import type { EntityState } from '../sim/types';
import { victimPose } from './grabPose';
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

    const victim = player ? victimPose(player, enemy) : null;
    const isGrabVictim = victim !== null;
    let flipX = enemy.facing === -1;
    if (victim) {
      drawX = victim.x;
      drawY = victim.y;
      textureKey = victim.textureKey;
      flipX = victim.flipX;
    }
    this.sprite.setDepth(victim ? victim.depth : 1);

    // Inercia e inclinación del cuerpo lanzado como proyectil humano en vuelo rápido
    let rotation = 0;
    if (enemy.aiState === 'juggle' && Math.abs(enemy.vx) >= 160) {
      rotation = enemy.facing === 1 ? -0.45 : 0.45;
      textureKey = 'legionnaire-juggle-01';
    }

    if (this.sprite.texture.key !== textureKey) {
      this.sprite.setTexture(textureKey);
    }

    // Leve sacudida en hitstun para reforzar el impacto
    const shakeX = !isGrabVictim && enemy.hitstunTicks > 0 && enemy.hitstunTicks % 2 === 1 ? 1 : 0;
    this.sprite.setPosition(drawX + shakeX, drawY);
    this.sprite.setFlipX(flipX);
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
