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

  update(enemy: Readonly<EntityState>): void {
    const textureKey = getLegionnaireFrameKey(enemy);
    if (this.sprite.texture.key !== textureKey) {
      this.sprite.setTexture(textureKey);
    }

    // Leve sacudida en hitstun para reforzar el impacto
    const shakeX = enemy.hitstunTicks > 0 && enemy.hitstunTicks % 2 === 1 ? 1 : 0;
    this.sprite.setPosition(enemy.x + shakeX, enemy.y);
    this.sprite.setFlipX(enemy.facing === -1);

    // Sombra de contacto terrestre (se oculta en el aire o al morir)
    this.shadow.setPosition(enemy.x, enemy.y - 1);
    this.shadow.setVisible(
      CONFIG.presentation.playerShadow.enabled && enemy.grounded && enemy.aiState !== 'death',
    );
  }

  destroy(): void {
    this.shadow.destroy();
    this.sprite.destroy();
  }
}
