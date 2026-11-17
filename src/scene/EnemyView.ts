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
        const isPunchHit = player.grabPhase === 'pummel' && t >= 4 && t <= 8;
        // Sujeto del cuello y alzado: los pies cuelgan en el aire (GoW 1 lo levanta del suelo) con las rodillas
        // dobladas (`juggle-00`); con cada puñetazo se dobla por la cintura (`juggle-01`) y retrocede 3 px.
        const lift = t < 3 ? 2 + t * 2 : 8 + (Math.floor(t / 12) % 2 === 0 ? 0 : 1);
        drawX = player.x + f * (isPunchHit ? 19 : 16);
        drawY = player.y - lift + (isPunchHit ? (t % 2 === 0 ? 1 : -1) : 0);
        textureKey = isPunchHit ? 'legionnaire-juggle-01' : 'legionnaire-juggle-00';
      } else if (player.grabPhase === 'throw') {
        // Toss con □: sujeto de lado mientras la espada entra (hasta el tick de la puñalada se queda erguido,
        // después se dobla) y proyectado en vuelo desde el tick de suelta
        const toss = CONFIG.player.grab.toss;
        if (t < toss.releaseTick) {
          drawX = player.x + f * 12;
          drawY = player.y - 12;
          textureKey = t < toss.stabTick ? 'legionnaire-hitstun-00' : 'legionnaire-juggle-01';
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
      } else if (player.grabPhase === 'floorhold' || player.grabPhase === 'stab') {
        // Tendido bajo Kratos tras el azote (Grab 1); sigue tendido y da un respingo (sube 2 px y se sacude) al
        // entrar la hoja (ticks 4..8 de la puñalada); antes cambiaba a `death-01`, que lo mostraba sentándose
        const jolt = player.grabPhase === 'stab' && t >= 4 && t <= 8;
        drawX = player.x + f * 20 + (jolt ? (t % 2 === 0 ? 1 : -1) : 0);
        drawY = player.y - (jolt ? 2 : 0);
        textureKey = 'legionnaire-death-02';
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
