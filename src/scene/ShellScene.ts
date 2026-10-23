import Phaser from 'phaser';
import {
  AIR_KEY,
  ASSET_DOMAINS,
  ASSETS,
  ATTACK_KEY,
  BACKGROUND_KEY,
  IDLE_KEY,
  PROVISIONAL_ART,
  ROLL_KEY,
  RUN_KEY,
} from '../assets/manifest';
import { CONFIG, ROLL_TICKS } from '../config';
import {
  attachScaleReferenceOverlay,
  isScaleReferenceVisible,
  updateScaleReference,
} from '../dev/scaleOverlay';
import { WeaponLayer } from '../entities/WeaponLayer';
import { InputManager } from '../input/InputManager';
import { HudLayer } from '../ui/HudLayer';
import type { FrameMetrics } from '../metrics';
import type { Simulation } from '../sim/engine';
import type { EntityState } from '../sim/types';
import { PLAYER_ID } from '../sim/types';

export class ShellScene extends Phaser.Scene {
  private inputManager!: InputManager;
  private bg: Phaser.GameObjects.TileSprite | null = null;
  private debugText: Phaser.GameObjects.Text | null = null;
  private lastDebugText = '';
  private player: Phaser.GameObjects.Sprite | null = null;
  private platformRects: (Phaser.GameObjects.Rectangle | Phaser.GameObjects.Graphics)[] = [];
  private renderedScenario = '';
  private attackHitboxRect: Phaser.GameObjects.Rectangle | null = null;
  private targetRects = new Map<string, Phaser.GameObjects.Rectangle>();
  private legionnaireSprites = new Map<string, Phaser.GameObjects.Sprite>();
  private archerSprites = new Map<string, Phaser.GameObjects.Sprite>();
  private arrowSprites = new Map<string, Phaser.GameObjects.Image>();
  private readonly orbSprites = new Map<string, { outer: Phaser.GameObjects.Arc; core: Phaser.GameObjects.Arc; highlight: Phaser.GameObjects.Arc }>();
  private readonly chestGfx = new Map<
    string,
    {
      body: Phaser.GameObjects.Graphics;
      prompt: Phaser.GameObjects.Text;
      eyeOuter?: Phaser.GameObjects.Arc;
      eyeCore?: Phaser.GameObjects.Arc;
      eyeHighlight?: Phaser.GameObjects.Arc;
      eyeY?: number;
      eyeX?: number;
    }
  >();
  private readonly weaponLayer = new WeaponLayer();
  private defeatText: Phaser.GameObjects.Text | null = null;
  private waveBannerText: Phaser.GameObjects.Text | null = null;
  private barrierGraphics: Phaser.GameObjects.Graphics | null = null;
  private magicGraphics: Phaser.GameObjects.Graphics | null = null;
  hudLayer!: HudLayer;

  constructor(
    private readonly simulation: Simulation,
    private readonly metrics: FrameMetrics,
  ) {
    super('shell');
  }

  preload(): void {
    for (const domain of ASSET_DOMAINS) {
      for (const asset of ASSETS[domain]) {
        if (asset.type === 'spritesheet') {
          this.load.spritesheet(asset.key, asset.path, {
            frameWidth: asset.frameWidth!,
            frameHeight: asset.frameHeight!,
          });
        } else {
          this.load.image(asset.key, asset.path);
        }
      }
    }
    this.load.spritesheet('legionnaire', 'assets/characters/legionnaire.png', {
      frameWidth: 64,
      frameHeight: 54,
    });
    this.load.spritesheet('archer', 'assets/characters/archer.png', {
      frameWidth: 64,
      frameHeight: 54,
    });
    this.load.image('arrow', 'assets/characters/arrow.png');
  }

  create(): void {
    this.cameras.main.setBackgroundColor(CONFIG.presentation.background);
    if (this.simulation.world.scenarioName === 'level1') {
      this.cameras.main.setBounds(0, 0, CONFIG.map.level1.width, CONFIG.map.level1.height);
    } else {
      this.cameras.main.setBounds(0, 0, CONFIG.internal.width, CONFIG.internal.height);
    }
    this.inputManager = new InputManager(this);

    this.bg = this.add
      .tileSprite(0, 0, CONFIG.internal.width, CONFIG.internal.height, BACKGROUND_KEY)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(-3);

    this.redrawPlatforms();

    this.add
      .text(
        CONFIG.internal.width / 2,
        20,
        PROVISIONAL_ART ? 'Combo ligero · provisional' : 'Combo ligero',
        {
          color: CONFIG.presentation.debugText,
          fontFamily: 'monospace',
          fontSize: '10px',
        },
      )
      .setOrigin(0.5)
      .setDepth(-1)
      .setScrollFactor(0);

    this.createLoopAnimation(RUN_KEY, CONFIG.player.run.frames, CONFIG.player.run.frameRate);
    this.createLoopAnimation(IDLE_KEY, CONFIG.player.idle.frames, CONFIG.player.idle.frameRate);
    this.createLoopAnimation(AIR_KEY, CONFIG.player.air.frames, CONFIG.player.air.frameRate);
    this.createRollAnimation();

    const spawn = this.simulation.world.peekEntity(PLAYER_ID);
    const { anchorX, anchorY } = CONFIG.player.sprite;
    this.player = this.add
      .sprite(
        spawn ? spawn.x : CONFIG.internal.width / 2,
        spawn ? spawn.y : CONFIG.internal.height,
        IDLE_KEY,
      )
      .setOrigin(anchorX, anchorY);

    this.weaponLayer.create(this);
    this.hudLayer = new HudLayer(this);

    this.defeatText = this.add
      .text(
        CONFIG.internal.width / 2,
        CONFIG.internal.height / 2 - 10,
        'DERROTA - PULSA R PARA REINTENTAR',
        {
          color: '#ff4444',
          fontFamily: 'monospace',
          fontSize: '12px',
          fontStyle: 'bold',
          backgroundColor: '#000000bb',
          padding: { x: 8, y: 4 },
        },
      )
      .setOrigin(0.5)
      .setDepth(20)
      .setScrollFactor(0)
      .setVisible(false);

    this.waveBannerText = this.add
      .text(CONFIG.internal.width / 2, 40, '', {
        color: '#facc15',
        fontFamily: 'monospace',
        fontSize: '11px',
        fontStyle: 'bold',
        backgroundColor: '#000000aa',
        padding: { x: 8, y: 3 },
      })
      .setOrigin(0.5)
      .setDepth(25)
      .setScrollFactor(0)
      .setVisible(false);

    if (import.meta.env.DEV) {
      this.lastDebugText = 'tick 0';
      this.debugText = this.add.text(155, 6, this.lastDebugText, {
        color: CONFIG.presentation.debugText,
        fontFamily: 'monospace',
        fontSize: '8px',
      });
      this.debugText.setDepth(10).setScrollFactor(0);
      attachScaleReferenceOverlay(this);
    }
  }

  update(_time: number, delta: number): void {
    this.metrics.record(delta);
    if (this.simulation.world.scenarioName !== this.renderedScenario) {
      this.redrawPlatforms();
    }
    const actions = this.inputManager.poll();
    this.simulation.advance(delta, actions);
    const player = this.simulation.world.peekEntity(PLAYER_ID) ?? null;
    if (player && this.player) {
      this.player.setPosition(player.x, player.y);
      this.player.setFlipX(player.facing === -1);
      this.applyAnimation(player);

      // Feedback visual de daño (tint en hitstun)
      if (player.hitstunTicks > 0) {
        this.player.setTint(0xff5555);
      } else {
        this.player.clearTint();
      }

      // Parpadeo visual durante invulnerabilidad post-daño
      if (player.hurtInvulTicks > 0 && !player.isDead) {
        this.player.setAlpha(Math.floor(player.hurtInvulTicks / 4) % 2 === 0 ? 0.4 : 1.0);
      } else if (!player.isDead) {
        this.player.setAlpha(1.0);
      }
    }

    if (this.defeatText) {
      this.defeatText.setVisible(Boolean(player && player.isDead));
    }

    if (this.waveBannerText) {
      const wave = this.simulation.world.peekWave ? this.simulation.world.peekWave() : null;
      if (!wave) {
        this.waveBannerText.setVisible(false);
      } else {
        this.waveBannerText.setVisible(true);
        if (wave.phase === 'complete') {
          this.waveBannerText.setText('¡ZONA DESPEJADA!');
          this.waveBannerText.setColor('#ffd700');
        } else if (wave.phase === 'cleared') {
          this.waveBannerText.setText(`OLEADA ${wave.waveIndex + 1}/${wave.totalWaves} DESPEJADA`);
          this.waveBannerText.setColor('#4ade80');
        } else {
          this.waveBannerText.setText(`OLEADA ${wave.waveIndex + 1}/${wave.totalWaves} · ENEMIGOS: ${wave.enemiesRemaining}`);
          this.waveBannerText.setColor('#facc15');
        }
      }
    }

    this.hudLayer.update(player ?? undefined, delta / 1000);

    if (this.simulation.world.scenarioName === 'level1') {
      this.cameras.main.scrollX = this.simulation.world.cameraScrollX;
    } else {
      this.cameras.main.scrollX = 0;
    }

    if (this.bg) {
      this.bg.tilePositionX = this.cameras.main.scrollX * (CONFIG.map.level1.camera.parallaxFactor ?? 0.25);
    }

    const hitbox = this.simulation.world.playerAttackHitbox();
    const chain = player ? player.attackChain : 0;
    const hitboxColor = this.hitboxColorForChain(chain);
    if (hitbox && import.meta.env.DEV && isScaleReferenceVisible()) {
      if (!this.attackHitboxRect) {
        this.attackHitboxRect = this.add
          .rectangle(
            hitbox.x1,
            hitbox.y1,
            hitbox.x2 - hitbox.x1,
            hitbox.y2 - hitbox.y1,
            hitboxColor,
            CONFIG.presentation.hitboxAlpha,
          )
          .setOrigin(0, 0)
          .setDepth(5);
      } else {
        this.attackHitboxRect.setPosition(hitbox.x1, hitbox.y1);
        this.attackHitboxRect.setSize(hitbox.x2 - hitbox.x1, hitbox.y2 - hitbox.y1);
        this.attackHitboxRect.setFillStyle(hitboxColor, CONFIG.presentation.hitboxAlpha);
        this.attackHitboxRect.setVisible(true);
      }
    } else if (this.attackHitboxRect) {
      this.attackHitboxRect.setVisible(false);
    }
    const isPlayerAlive = Boolean(player && !player.isDead);
    const attackParams = isPlayerAlive ? this.simulation.world.playerAttackParams() : null;
    this.weaponLayer.update(isPlayerAlive ? player : null, attackParams, this.simulation.world.surfacePlatforms);
    this.updateTargets(player);
    this.updateOrbs();
    this.updateArrows();
    this.updateArenaBarriers();
    this.updateMagic(player);
    this.updateChests(player);
    if (player && player.groundImpactTicks > 0) {
      const shakePx = CONFIG.player.attack.groundImpact.shakePx;
      const dy = player.groundImpactTicks % 2 === 1 ? shakePx : -shakePx;
      this.cameras.main.setScroll(0, dy);
    } else {
      this.cameras.main.setScroll(0, 0);
    }
    // `import.meta.env.DEV` is statically false in a production build, so the
    // overlay module is dropped from the shipped bundle.
    if (import.meta.env.DEV && player) {
      updateScaleReference(player.x, player.y, player.facing);
    }
    if (this.debugText) {
      const phase = player ? player.attackPhase : '-';
      const grd = player && player.guardPhase !== 'none' ? ` grd=${player.guardPhase}:${player.guardTicks}${player.parryActive ? '(P)' : ''}` : '';
      const hpInfo = player ? ` hp=${player.hp}` : '';
      const hurtInfo = player && player.hurtInvulTicks > 0 ? ` hurtInv=${player.hurtInvulTicks}` : '';
      const deadInfo = player && player.isDead ? ' [DEAD]' : '';
      const nextText = `tick ${this.simulation.world.frame} x=${player ? player.x.toFixed(1) : '-'}${hpInfo}${hurtInfo}${deadInfo} atk=${phase} chain=${chain}${grd}`;
      if (nextText !== this.lastDebugText) {
        this.lastDebugText = nextText;
        this.debugText.setText(nextText);
      }
    }
  }

  private hitboxColorForChain(chain: number): number {
    const { hitboxColor, hitboxColorChain1, hitboxColorChain2 } = CONFIG.presentation;
    if (chain <= 0) {
      return hitboxColor;
    }
    return chain === 1 ? hitboxColorChain1 : hitboxColorChain2;
  }

  private updateTargets(player: Readonly<EntityState> | null): void {
    const hits = player ? player.attackHits : [];
    const targets = this.simulation.world.peekTargets();
    const halfW = CONFIG.player.attack.targetHalfWidth;
    const halfH = CONFIG.player.attack.targetHalfHeight;

    // Clean up stale sprites
    for (const [id, sprite] of this.legionnaireSprites.entries()) {
      if (!targets.some((t) => t.id === id && t.kind === 'legionnaire')) {
        sprite.destroy();
        this.legionnaireSprites.delete(id);
      }
    }
    for (const [id, sprite] of this.archerSprites.entries()) {
      if (!targets.some((t) => t.id === id && t.kind === 'archer')) {
        sprite.destroy();
        this.archerSprites.delete(id);
      }
    }
    for (const [id, rect] of this.targetRects.entries()) {
      if (!targets.some((t) => t.id === id && t.kind !== 'legionnaire' && t.kind !== 'archer')) {
        rect.destroy();
        this.targetRects.delete(id);
      }
    }

    for (const target of targets) {
      if (target.kind === 'legionnaire') {
        let sprite = this.legionnaireSprites.get(target.id);
        if (!sprite) {
          sprite = this.add.sprite(target.x, target.y, 'legionnaire', 0);
          sprite.setOrigin(0.5, 1.0).setDepth(0);
          this.legionnaireSprites.set(target.id, sprite);
        }
        const shakeX = target.hitstunTicks > 0 && target.hitstunTicks % 2 === 1 ? (target.facing === 1 ? -2 : 2) : 0;
        sprite.setPosition(target.x + shakeX, target.y);
        sprite.setFlipX(target.facing === -1);

        let frame = 0;
        switch (target.aiState) {
          case 'idle':
          case 'patrol':
          case 'spawning':
            frame = 0;
            break;
          case 'approach':
            frame = Math.floor(target.aiTicks / 8) % 2 === 0 ? 1 : 2;
            break;
          case 'windup':
            frame = 3;
            break;
          case 'slash':
            frame = 4;
            break;
          case 'hitstun':
            frame = 5;
            break;
          case 'juggle':
            frame = 6;
            break;
          case 'death':
            frame = 7;
            break;
          case 'recover':
            frame = 0;
            break;
        }
        sprite.setFrame(frame);
        if (target.hitstunTicks > 0) {
          sprite.setTint(player && player.magicPhase === 'active' ? 0x67e8f9 : 0xff7777);
        } else {
          sprite.clearTint();
        }
      } else if (target.kind === 'archer') {
        let sprite = this.archerSprites.get(target.id);
        if (!sprite) {
          sprite = this.add.sprite(target.x, target.y, 'archer', 0);
          sprite.setOrigin(0.5, 1.0).setDepth(0);
          this.archerSprites.set(target.id, sprite);
        }
        const shakeX = target.hitstunTicks > 0 && target.hitstunTicks % 2 === 1 ? (target.facing === 1 ? -2 : 2) : 0;
        sprite.setPosition(target.x + shakeX, target.y);
        // Sprite en PNG mira a la izquierda (facing = -1); si mira a la derecha (facing = 1), flipX = true
        sprite.setFlipX(target.facing === 1);

        let frame = 0;
        switch (target.aiState) {
          case 'idle':
          case 'recover':
          case 'spawning':
            frame = 0;
            break;
          case 'reposition':
          case 'approach':
            frame = Math.floor(target.aiTicks / 8) % 2 === 0 ? 1 : 2;
            break;
          case 'aim':
            frame = 3;
            break;
          case 'shoot':
            frame = 4;
            break;
          case 'hitstun':
            frame = 5;
            break;
          case 'juggle':
            frame = 6;
            break;
          case 'death':
            frame = 7;
            break;
        }
        sprite.setFrame(frame);
        if (target.hitstunTicks > 0) {
          sprite.setTint(player && player.magicPhase === 'active' ? 0x67e8f9 : 0xff7777);
        } else {
          sprite.clearTint();
        }
      } else {
        let rect = this.targetRects.get(target.id);
        if (!rect) {
          rect = this.add.rectangle(0, 0, halfW * 2, halfH * 2, CONFIG.presentation.targetColor);
          rect.setOrigin(0.5, 0.5).setDepth(1);
          this.targetRects.set(target.id, rect);
        }
        const shakeX = target.hitstunTicks > 0 && target.hitstunTicks % 2 === 1 ? 1 : 0;
        rect.setPosition(target.x + shakeX, target.y - halfH);
        rect.setFillStyle(
          hits.includes(target.id)
            ? CONFIG.presentation.targetHitColor
            : CONFIG.presentation.targetColor,
        );
      }
    }
  }

  private redrawPlatforms(): void {
    if (this.simulation.world.scenarioName === 'level1') {
      this.cameras.main.setBounds(0, 0, CONFIG.map.level1.width, CONFIG.map.level1.height);
    } else {
      this.cameras.main.setBounds(0, 0, CONFIG.internal.width, CONFIG.internal.height);
      this.cameras.main.scrollX = 0;
    }
    for (const rect of this.platformRects) {
      rect.destroy();
    }
    this.platformRects = [];
    for (const rect of this.targetRects.values()) {
      rect.destroy();
    }
    this.targetRects.clear();
    for (const sprite of this.legionnaireSprites.values()) {
      sprite.destroy();
    }
    this.legionnaireSprites.clear();
    for (const sprite of this.archerSprites.values()) {
      sprite.destroy();
    }
    this.archerSprites.clear();
    for (const sprite of this.arrowSprites.values()) {
      sprite.destroy();
    }
    this.arrowSprites.clear();
    for (const gfx of this.chestGfx.values()) {
      gfx.body.destroy();
      gfx.prompt.destroy();
      gfx.eyeOuter?.destroy();
      gfx.eyeCore?.destroy();
      gfx.eyeHighlight?.destroy();
    }
    this.chestGfx.clear();
    if (this.barrierGraphics) {
      this.barrierGraphics.clear();
    }
    if (this.magicGraphics) {
      this.magicGraphics.clear();
    }
    const {
      platformColor,
      platformHighlightColor,
      platformEdgeColor,
      platformThickness,
    } = CONFIG.presentation;
    for (const platform of this.simulation.world.surfacePlatforms) {
      const width = platform.x2 - platform.x1;
      this.platformRects.push(
        this.add
          .rectangle(
            platform.x1,
            platform.yTop,
            width,
            platformThickness,
            platformColor,
          )
          .setOrigin(0, 0)
          .setDepth(-2),
      );
      this.platformRects.push(
        this.add
          .rectangle(
            platform.x1,
            platform.yTop,
            width,
            1,
            platformHighlightColor,
          )
          .setOrigin(0, 0)
          .setDepth(-2),
      );
      this.platformRects.push(
        this.add
          .rectangle(
            platform.x1,
            platform.yTop + platformThickness - 1,
            width,
            1,
            platformEdgeColor,
          )
          .setOrigin(0, 0)
          .setDepth(-2),
      );
      for (let seamX = platform.x1 + 32; seamX < platform.x2; seamX += 32) {
        this.platformRects.push(
          this.add
            .rectangle(
              seamX,
              platform.yTop,
              1,
              platformThickness,
              platformEdgeColor,
            )
            .setOrigin(0, 0)
            .setDepth(-2),
        );
      }
    }

    if (this.simulation.world.scenarioName === 'level1') {
      const g = this.add.graphics().setDepth(-2);
      this.platformRects.push(g);

      // 1. Cajas de pertrechos de Popa (x: 200..290, y: 226..262)
      g.fillStyle(0x4a3219, 1.0);
      g.fillRect(200, 226, 90, 36);
      g.lineStyle(1, 0x2e1f0e, 1.0);
      g.strokeRect(200, 226, 90, 36);
      // Tablas y tablones verticales/horizontales
      g.lineBetween(245, 226, 245, 262);
      g.lineBetween(200, 244, 290, 244);
      // Sogas / cinchas en aspa (X)
      g.lineStyle(1, 0x8c6d46, 0.8);
      g.lineBetween(204, 228, 241, 260);
      g.lineBetween(241, 228, 204, 260);
      g.lineBetween(249, 228, 286, 260);
      g.lineBetween(286, 228, 249, 260);
      // Refuerzos de esquinas
      g.fillStyle(0x734d26, 1.0);
      g.fillRect(200, 226, 4, 4);
      g.fillRect(286, 226, 4, 4);
      g.fillRect(200, 258, 4, 4);
      g.fillRect(286, 258, 4, 4);

      // 2. Mástil y vigas de Proa (centro en x=1170)
      // Mástil vertical de pino (x=1163..1177, y=110..262)
      g.fillStyle(0x3e2b14, 1.0);
      g.fillRect(1163, 110, 14, 152);
      g.fillStyle(0x614420, 1.0);
      g.fillRect(1165, 110, 3, 152); // Brillo/hilera de luz
      g.fillStyle(0x2a1c0c, 1.0);
      g.fillRect(1175, 110, 2, 152); // Sombra lateral
      // Abrazaderas de bronce en el mástil
      g.fillStyle(0x8c673a, 1.0);
      g.fillRect(1162, 134, 16, 4);
      g.fillRect(1162, 196, 16, 4);
      g.fillRect(1162, 256, 16, 6);

      // Puntales diagonales de la viga inferior (y=200, x=1040..1180)
      g.lineStyle(2, 0x3e2b14, 1.0);
      g.lineBetween(1163, 230, 1080, 204);
      g.lineBetween(1177, 230, 1150, 204);

      // Barandilla del nido de cuervos (y=138, x=1100..1240)
      g.lineStyle(1, 0x614420, 1.0);
      g.lineBetween(1100, 126, 1240, 126); // pasamanos superior
      for (let bx = 1104; bx <= 1236; bx += 12) {
        g.lineBetween(bx, 126, bx, 138); // balaustres
      }

      // Jarcias / cabos tensores hacia la cubierta
      g.lineStyle(1, 0x221a10, 0.6);
      g.lineBetween(1163, 120, 1000, 262);
      g.lineBetween(1163, 120, 1030, 262);
      g.lineBetween(1177, 120, 1280, 262);
      g.lineBetween(1177, 120, 1300, 262);

      // 3. Castillo elevado de Proa (x=1310..1440, y=218..262)
      g.fillStyle(0x3e2b14, 1.0);
      g.fillRect(1310, 218, 130, 44);
      // Entablado horizontal del mamparo de proa
      g.lineStyle(1, 0x2a1c0c, 1.0);
      for (let py = 226; py <= 258; py += 8) {
        g.lineBetween(1310, py, 1440, py);
      }
      // Rampa / puntal angular en el mamparo
      g.lineStyle(2, 0x5c401f, 1.0);
      g.lineBetween(1310, 262, 1310, 218);
      // Barandilla de proa
      g.lineStyle(1, 0x8c673a, 1.0);
      g.lineBetween(1310, 210, 1440, 210);
      for (let rx = 1320; rx < 1440; rx += 16) {
        g.lineBetween(rx, 210, rx, 218);
      }
    }

    this.renderedScenario = this.simulation.world.scenarioName;
  }

  private createLoopAnimation(key: string, frames: number, frameRate: number): void {
    if (this.anims.exists(key)) {
      return;
    }
    const endFrame = key === RUN_KEY ? 5 : frames - 1;
    this.anims.create({
      key,
      frames: this.anims.generateFrameNumbers(key, { start: 0, end: endFrame }),
      frameRate,
      repeat: -1,
    });
  }

  private createRollAnimation(): void {
    if (this.anims.exists(ROLL_KEY)) {
      return;
    }
    const texture = this.textures.get(ROLL_KEY);
    if (!texture || !this.textures.exists(ROLL_KEY)) {
      return;
    }
    // The spritesheet may not be loaded yet when the texture is missing; the
    // animation would then reference zero frames and Phaser would later fail
    // reading `duration` from an undefined frame.
    //
    // `frameTotal` counts the syntetic `__BASE` frame as well, so the last real
    // frame is `frameTotal - 2`. Using `frameTotal - 1` requests a frame that
    // does not exist and Phaser warns "Frame not found in texture".
    const lastFrame = texture.frameTotal - 2;
    if (lastFrame < 0) {
      return;
    }
    const frameCount = lastFrame + 1;
    const frameRate = Math.max(1, frameCount / (ROLL_TICKS / 60));
    this.anims.create({
      key: ROLL_KEY,
      frames: this.anims.generateFrameNumbers(ROLL_KEY, { start: 0, end: lastFrame }),
      frameRate,
      repeat: 0,
    });
  }

  private applyAnimation(simPlayer: Readonly<EntityState>): void {
    const player = this.player;
    if (!player) {
      return;
    }

    if (simPlayer.isDead) {
      this.stopLoop();
      const frame = 2;
      if (player.texture.key !== ATTACK_KEY) {
        player.setTexture(ATTACK_KEY, frame);
      } else {
        player.setFrame(frame);
      }
      player.setFlipX(simPlayer.facing === -1);
      player.setRotation(0);
      player.setAlpha(0.65);
      return;
    }

    const { attackPhase, grounded, facing } = simPlayer;
    const speed = Math.abs(simPlayer.vx);
    const rolling = simPlayer.rollPhase !== 'none';

    // Elastic landing compression (squash)
    if (simPlayer.landingTicks > 0 && grounded && attackPhase === 'none' && !rolling) {
      player.setScale(1.06, 0.92);
    } else {
      player.setScale(1, 1);
    }

    if (attackPhase !== 'none' && !rolling) {
      this.stopLoop();
      let frame = 0;
      if (attackPhase === 'startup') {
        frame = 0;
      } else if (attackPhase === 'active') {
        const moveId = simPlayer.attackMove !== 'none' ? simPlayer.attackMove : 'light_1';
        const moveDef = CONFIG.player.attack.moves[moveId];
        frame = moveDef ? moveDef.poseFrame : 1;
      } else if (attackPhase === 'recovery') {
        const moveId = simPlayer.attackMove !== 'none' ? simPlayer.attackMove : 'light_1';
        const moveDef = CONFIG.player.attack.moves[moveId];
        frame = simPlayer.attackTicks <= 2 ? (moveDef ? moveDef.poseFrame : 1) : 2;
      }
      if (player.texture.key !== ATTACK_KEY) {
        player.setTexture(ATTACK_KEY, frame);
      } else {
        player.setFrame(frame);
      }
      player.anims.timeScale = 1;
      player.setAlpha(1);
      player.setRotation(0);
      return;
    }
    if (simPlayer.guardPhase !== 'none' && !rolling) {
      this.stopLoop();
      // Defensive stance (compact crouch with blades ready in ATTACK_KEY frame 0)
      const frame = 0;
      if (player.texture.key !== ATTACK_KEY) {
        player.setTexture(ATTACK_KEY, frame);
      } else {
        player.setFrame(frame);
      }
      player.setFlipX(facing === -1);
      player.setRotation(0);
      player.setAlpha(1);
      player.anims.timeScale = 1;
      return;
    }
    const isOpeningChest = this.simulation.world.peekChests().some((c) => c.state === 'opening');
    if (isOpeningChest && !rolling) {
      this.stopLoop();
      // Postura de apertura de cofre (agachado e interactuando en ATTACK_KEY frame 0)
      const frame = 0;
      if (player.texture.key !== ATTACK_KEY) {
        player.setTexture(ATTACK_KEY, frame);
      } else {
        player.setFrame(frame);
      }
      player.setFlipX(facing === -1);
      player.setRotation(0);
      player.setAlpha(1);
      player.anims.timeScale = 1;
      return;
    }
    if (rolling && this.anims.exists(ROLL_KEY)) {
      if (player.texture.key !== ROLL_KEY || !player.anims.isPlaying) {
        // Only (re)start the clip on entry. Calling `stopLoop()` here would kill
        // the animation on every tick and `play()` would restart it from frame 0,
        // freezing the roll on its first pose (which reads as a plain dash).
        player.play(ROLL_KEY);
      }
      player.setFlipX(facing === -1);
      // Keep rotation at 0 so the feet/ground anchor (0.5, 1.0) never pivots the
      // sprite below the floor; the 4-frame somersault spritesheet (`ROLL_KEY`)
      // depicts the ground roll directly within the frame box.
      player.setRotation(0);
      player.setAlpha(1);
      player.anims.timeScale = 1;
      return;
    }
    player.setAlpha(1);
    player.setRotation(0);
    if (!grounded) {
      this.playLoop(AIR_KEY);
      return;
    }
    // High-speed turnaround skid on ground
    if (simPlayer.skidTicks > 0) {
      this.stopLoop();
      if (player.texture.key !== RUN_KEY) {
        player.setTexture(RUN_KEY, 6);
      } else {
        player.setFrame(6);
      }
      player.setFlipX(facing === -1);
      return;
    }
    if (speed > CONFIG.player.run.idleSpeedThreshold) {
      this.playRun(speed);
    } else {
      this.playLoop(IDLE_KEY);
    }
  }

  private stopLoop(): void {
    if (this.player?.anims.isPlaying) {
      this.player.anims.stop();
    }
  }

  private playLoop(key: string): void {
    if (!this.player) {
      return;
    }
    if (this.player.anims.currentAnim?.key !== key || !this.player.anims.isPlaying) {
      this.player.play(key);
    }
    this.player.anims.timeScale = 1;
  }

  private playRun(speed: number): void {
    if (!this.player) {
      return;
    }
    if (this.player.anims.currentAnim?.key !== RUN_KEY || !this.player.anims.isPlaying) {
      this.player.play(RUN_KEY);
    }
    const { frameRate, maxFrameRate } = CONFIG.player.run;
    const ratio = Phaser.Math.Clamp(speed / CONFIG.player.maxSpeed, 0, 1);
    const rate = frameRate + (maxFrameRate - frameRate) * ratio;
    this.player.anims.timeScale = rate / frameRate;
  }

  private updateOrbs(): void {
    const simOrbs = this.simulation.world.peekOrbs();
    const activeIds = new Set(simOrbs.map((o) => o.id));

    // Eliminar orbes que ya no existen en la simulación
    for (const [id, gfx] of this.orbSprites.entries()) {
      if (!activeIds.has(id)) {
        gfx.outer.destroy();
        gfx.core.destroy();
        gfx.highlight.destroy();
        this.orbSprites.delete(id);
      }
    }

    // Renderizar o actualizar cada orbe activo
    for (let i = 0; i < simOrbs.length; i += 1) {
      const orb = simOrbs[i];
      let gfx = this.orbSprites.get(orb.id);
      const isGreen = orb.type === 'green';
      const isBlue = orb.type === 'blue';

      if (!gfx) {
        const outerColor = isGreen ? 0x22c55e : (isBlue ? 0x2563eb : 0xef4444);
        const coreColor = isGreen ? 0x4ade80 : (isBlue ? 0x60a5fa : 0xf87171);
        const hlColor = isGreen ? 0xdcfce7 : (isBlue ? 0xeff6ff : 0xfef2f2);

        const outer = this.add.circle(orb.x, orb.y, 5, outerColor, 0.45).setDepth(50);
        const core = this.add.circle(orb.x, orb.y, 3, coreColor, 0.95).setDepth(51);
        const highlight = this.add.circle(orb.x - 1, orb.y - 1, 1.2, hlColor, 1.0).setDepth(52);

        gfx = { outer, core, highlight };
        this.orbSprites.set(orb.id, gfx);
      }

      if (orb.absorbed) {
        // Destello de absorción en el frame de contacto
        gfx.outer.setPosition(orb.x, orb.y).setRadius(7).setAlpha(0.85);
        gfx.core.setPosition(orb.x, orb.y).setRadius(4).setAlpha(1.0);
        gfx.highlight.setPosition(orb.x, orb.y).setRadius(2);
      } else {
        const pulse = 0.85 + 0.15 * Math.sin(orb.ageTicks * 0.4);
        gfx.outer.setPosition(orb.x, orb.y).setRadius(5 * pulse).setAlpha(0.45);
        gfx.core.setPosition(orb.x, orb.y).setRadius(3 * pulse).setAlpha(0.95);
        gfx.highlight.setPosition(orb.x - 1, orb.y - 1);
      }
    }
  }

  private updateArrows(): void {
    const simArrows = this.simulation.world.peekArrows();
    const activeIds = new Set(simArrows.filter((a) => a.active).map((a) => a.id));

    // Limpiar sprites de flechas inactivas
    for (const [id, sprite] of this.arrowSprites.entries()) {
      if (!activeIds.has(id)) {
        sprite.destroy();
        this.arrowSprites.delete(id);
      }
    }

    // Renderizar o actualizar cada flecha activa
    for (let i = 0; i < simArrows.length; i += 1) {
      const arrow = simArrows[i];
      if (!arrow.active) continue;

      let sprite = this.arrowSprites.get(arrow.id);
      if (!sprite) {
        sprite = this.add.image(arrow.x, arrow.y, 'arrow');
        sprite.setOrigin(0.5, 0.5).setDepth(20);
        this.arrowSprites.set(arrow.id, sprite);
      }
      sprite.setPosition(arrow.x, arrow.y);
      // arrow.png apunta por defecto a la izquierda (vx < 0).
      // Si vx > 0 (proyectil reflejado hacia la derecha), flipX = true.
      sprite.setFlipX(arrow.vx > 0);
      if (arrow.reflected) {
        sprite.setTint(0xffea00); // Resplandor dorado de reflejo por Parry
      } else {
        sprite.clearTint();
      }
    }
  }

  private updateArenaBarriers(): void {
    const arena = this.simulation.world.peekArena ? this.simulation.world.peekArena() : null;
    if (!arena || arena.alpha <= 0) {
      if (this.barrierGraphics) {
        this.barrierGraphics.clear();
        this.barrierGraphics.setVisible(false);
      }
      return;
    }

    if (!this.barrierGraphics) {
      this.barrierGraphics = this.add.graphics().setDepth(4);
    }

    this.barrierGraphics.clear();
    this.barrierGraphics.setVisible(true);

    const { minX, maxX, alpha } = arena;
    const groundY = 220; // desde y=0 hasta la plataforma en y=220
    const width = CONFIG.combat.arena.barrierWidth;
    const color = CONFIG.combat.arena.barrierColor;
    const glowColor = CONFIG.combat.arena.barrierGlowColor;

    // Sutil oscilación ígnea / pulsación de niebla mágica
    const pulse = 0.9 + 0.1 * Math.sin(this.simulation.world.frame * 0.25);
    const effAlpha = alpha * pulse;

    const drawBarrierPillar = (x: number) => {
      // 1. Halo difuso exterior (niebla de sangre de Ares)
      this.barrierGraphics!.fillStyle(glowColor, effAlpha * 0.3);
      this.barrierGraphics!.fillRect(x - width * 1.5, 0, width * 3, groundY);

      // 2. Columna mágica intermedia
      this.barrierGraphics!.fillStyle(glowColor, effAlpha * 0.55);
      this.barrierGraphics!.fillRect(x - width, 0, width * 2, groundY);

      // 3. Núcleo denso de la barrera
      this.barrierGraphics!.fillStyle(color, effAlpha * 0.85);
      this.barrierGraphics!.fillRect(x - width / 2, 0, width, groundY);

      // 4. Filamento ígneo incandescente central
      this.barrierGraphics!.fillStyle(0xfff0f0, effAlpha * 0.95);
      this.barrierGraphics!.fillRect(x - 1, 0, 2, groundY);
    };

    drawBarrierPillar(minX);
    drawBarrierPillar(maxX);
  }

  private updateMagic(player: Readonly<EntityState> | null): void {
    if (!player || player.magicPhase === 'none') {
      if (this.magicGraphics) {
        this.magicGraphics.clear();
        this.magicGraphics.setVisible(false);
      }
      return;
    }

    if (!this.magicGraphics) {
      this.magicGraphics = this.add.graphics().setDepth(15);
    }

    this.magicGraphics.clear();
    this.magicGraphics.setVisible(true);

    const cx = player.x;
    const cy = player.y - 18;
    const radius = CONFIG.player.magic.poseidonsRage.radius;
    const frame = this.simulation.world.frame;

    if (player.magicPhase === 'startup') {
      // 1. Círculo de invocación rúnica en el suelo y carga celestial
      const progress = player.magicTicks / CONFIG.player.magic.poseidonsRage.startupTicks;
      const r = radius * progress;
      this.magicGraphics.lineStyle(1.5, 0x38bdf8, 0.7);
      this.magicGraphics.strokeCircle(cx, cy, r);
      this.magicGraphics.fillStyle(0x0284c7, 0.15 * progress);
      this.magicGraphics.fillCircle(cx, cy, r);
    } else if (player.magicPhase === 'active') {
      // 2. Tormenta eléctrica activa (Poseidon's Rage): disco de energía + relámpagos
      const pulse = 0.85 + 0.15 * Math.sin(frame * 0.4);
      this.magicGraphics.fillStyle(0x0284c7, 0.16 * pulse);
      this.magicGraphics.fillCircle(cx, cy, radius);

      this.magicGraphics.lineStyle(2, 0x38bdf8, 0.8 * pulse);
      this.magicGraphics.strokeCircle(cx, cy, radius);

      // Relámpagos ramificados procedurales celestes y blancos
      const boltCount = 4;
      for (let b = 0; b < boltCount; b += 1) {
        const seedAngle = frame * 0.35 + (b * Math.PI * 2) / boltCount;
        const targetDist = radius * (0.6 + (0.4 * ((frame + b * 7) % 5)) / 5);
        const tx = cx + Math.cos(seedAngle) * targetDist;
        const ty = cy + Math.sin(seedAngle) * targetDist;

        // Trazar relámpago con zigzag
        this.magicGraphics.lineStyle(1.5, 0xbae6fd, 0.9);
        this.magicGraphics.beginPath();
        this.magicGraphics.moveTo(cx, cy - 6);

        const midX = (cx + tx) / 2 + (((frame * 13 + b * 23) % 17) - 8);
        const midY = (cy + ty) / 2 + (((frame * 19 + b * 29) % 17) - 8);
        this.magicGraphics.lineTo(midX, midY);
        this.magicGraphics.lineTo(tx, ty);
        this.magicGraphics.strokePath();

        // Núcleo blanco caliente
        this.magicGraphics.lineStyle(1, 0xffffff, 1.0);
        this.magicGraphics.beginPath();
        this.magicGraphics.moveTo(cx, cy - 6);
        this.magicGraphics.lineTo(midX, midY);
        this.magicGraphics.lineTo(tx, ty);
        this.magicGraphics.strokePath();
      }
    } else if (player.magicPhase === 'recovery') {
      // 3. Chispas residuales extinguiéndose
      const rem = 1 - player.magicTicks / CONFIG.player.magic.poseidonsRage.recoveryTicks;
      this.magicGraphics.lineStyle(1, 0x38bdf8, rem * 0.5);
      this.magicGraphics.strokeCircle(cx, cy, radius * rem);
    }
  }

  private updateChests(player: Readonly<EntityState> | null): void {
    const simChests = this.simulation.world.peekChests();
    const activeIds = new Set(simChests.map((c) => c.id));

    // Destruir cofres que ya no existan en la simulación
    for (const [id, gfx] of this.chestGfx.entries()) {
      if (!activeIds.has(id)) {
        gfx.body.destroy();
        gfx.prompt.destroy();
        gfx.eyeOuter?.destroy();
        gfx.eyeCore?.destroy();
        gfx.eyeHighlight?.destroy();
        this.chestGfx.delete(id);
      }
    }

    const {
      width,
      height,
      stoneColor,
      stoneHighlightColor,
      stoneShadowColor,
      bronzeColor,
      bronzeHighlightColor,
      emeraldColor,
      emeraldGlowColor,
      sapphireColor,
      sapphireGlowColor,
      depth,
    } = CONFIG.presentation.chest;

    const interactionRadius = CONFIG.economy.chests.interactionRadius;
    const verticalTolerance = CONFIG.economy.chests.verticalTolerance;

    for (let i = 0; i < simChests.length; i += 1) {
      const chest = simChests[i];
      let gfx = this.chestGfx.get(chest.id);
      const isFeather = chest.type === 'phoenix_feather';
      const gemColor = isFeather ? sapphireColor : emeraldColor;
      const gemGlow = isFeather ? sapphireGlowColor : emeraldGlowColor;
      const hlColor = isFeather ? 0xe0f2fe : 0xdcfce7;
      const magnetSpeed = isFeather ? CONFIG.economy.chests.featherMagnetSpeed : CONFIG.economy.chests.eyeMagnetSpeed;

      if (!gfx) {
        const body = this.add.graphics().setDepth(depth);
        const prompt = this.add
          .text(chest.x, chest.y - height - 8, '[E] ABRIR', {
            fontFamily: 'monospace',
            fontSize: '7px',
            color: '#fef08a',
          })
          .setOrigin(0.5, 1.0)
          .setDepth(depth + 10)
          .setShadow(1, 1, '#000000', 1)
          .setVisible(false);

        gfx = { body, prompt };
        this.chestGfx.set(chest.id, gfx);
      }

      // Comprobar proximidad para mostrar prompt contextual [E] ABRIR
      const inRange = Boolean(
        player &&
          !player.isDead &&
          Math.abs(player.x - chest.x) <= interactionRadius &&
          Math.abs(player.y - chest.y) <= verticalTolerance,
      );
      gfx.prompt.setVisible(chest.state === 'closed' && inRange);

      const g = gfx.body;
      g.clear();

      const cx = chest.x;
      const cy = chest.y; // cota de plataforma
      const halfW = width / 2; // 12
      const xLeft = cx - halfW;
      const yBottom = cy;
      const yBodyTop = cy - 12;

      // 1. Cuerpo de piedra cincelada griega (xLeft, yBodyTop, 24, 12)
      g.fillStyle(stoneColor, 1.0);
      g.fillRect(xLeft, yBodyTop, width, 12);

      // Sombra inferior y bisel derecho
      g.fillStyle(stoneShadowColor, 1.0);
      g.fillRect(xLeft, yBottom - 2, width, 2);
      g.fillRect(xLeft + width - 2, yBodyTop, 2, 12);

      // Resalte de luz izquierdo
      g.fillStyle(stoneHighlightColor, 1.0);
      g.fillRect(xLeft, yBodyTop, 2, 12);

      // Moldura ornamental de bronce
      g.fillStyle(bronzeColor, 1.0);
      g.fillRect(xLeft + 2, yBodyTop + 5, width - 4, 2);
      g.fillStyle(bronzeHighlightColor, 1.0);
      g.fillRect(xLeft + 2, yBodyTop + 5, width - 4, 1);

      // Placa central de bronce con emblema
      g.fillStyle(bronzeHighlightColor, 1.0);
      g.fillRect(cx - 3, yBodyTop + 3, 6, 6);
      g.fillStyle(bronzeColor, 1.0);
      g.strokeRect(cx - 3, yBodyTop + 3, 6, 6);

      // Emblema místico central (ojo esmeralda o pluma zafiro con pulsación)
      const pulse = 0.75 + 0.25 * Math.sin(this.simulation.world.frame * 0.2);
      g.fillStyle(gemColor, pulse);
      g.fillRect(cx - 2, yBodyTop + 4, 4, 4);
      g.fillStyle(gemGlow, 1.0);
      g.fillRect(cx - 1, yBodyTop + 5, 2, 2);

      // 2. Tapa del cofre y animación de apertura
      if (chest.state === 'closed') {
        const yLidTop = yBodyTop - 6;
        g.fillStyle(stoneHighlightColor, 1.0);
        g.fillRect(xLeft - 1, yLidTop, width + 2, 6);
        g.fillStyle(bronzeColor, 1.0);
        g.fillRect(xLeft + 2, yLidTop, 3, 6);
        g.fillRect(xLeft + width - 5, yLidTop, 3, 6);
        g.fillStyle(bronzeHighlightColor, 1.0);
        g.fillRect(xLeft + 2, yLidTop, 1, 6);
        g.fillRect(xLeft + width - 5, yLidTop, 1, 6);
        g.fillStyle(stoneShadowColor, 1.0);
        g.fillRect(xLeft - 1, yBodyTop - 1, width + 2, 1);
      } else if (chest.state === 'opening') {
        const progress = Math.min(1, chest.openProgressTicks / CONFIG.economy.chests.openDurationTicks);
        const lidLift = Math.round(progress * 8);
        const yLidTop = yBodyTop - 6 - lidLift;

        // Haz de luz brotando de la hendidura (esmeralda o zafiro)
        g.fillStyle(gemGlow, 0.45 * progress);
        g.fillRect(xLeft, yBodyTop - lidLift, width, lidLift);
        g.fillStyle(0xffffff, 0.75 * progress);
        g.fillRect(xLeft + 4, yBodyTop - Math.round(lidLift / 2), width - 8, 2);

        // Tapa levantándose
        g.fillStyle(stoneHighlightColor, 1.0);
        g.fillRect(xLeft - 1, yLidTop, width + 2, 5);
        g.fillStyle(bronzeColor, 1.0);
        g.fillRect(xLeft + 2, yLidTop, 3, 5);
        g.fillRect(xLeft + width - 5, yLidTop, 3, 5);
      } else {
        // 'open'
        // Cavidad interior oscura
        g.fillStyle(0x1c1917, 1.0);
        g.fillRect(xLeft + 2, yBodyTop, width - 4, 8);

        // Tapa abierta hacia atrás
        const yLidTop = yBodyTop - 10;
        g.fillStyle(stoneShadowColor, 1.0);
        g.fillRect(xLeft - 1, yLidTop, width + 2, 4);
        g.fillStyle(bronzeColor, 1.0);
        g.fillRect(xLeft + 2, yLidTop, 3, 4);
        g.fillRect(xLeft + width - 5, yLidTop, 3, 4);

        // Ítem místico (Ojo de Górgona o Pluma de Fénix) ascendente y atraído magnéticamente hacia Kratos
        if (!gfx.eyeOuter) {
          const eyeOuter = this.add.circle(cx, cy - 14, 5, gemColor, 0.5).setDepth(depth + 20);
          const eyeCore = this.add.circle(cx, cy - 14, 3, gemGlow, 0.95).setDepth(depth + 21);
          const eyeHighlight = this.add.circle(cx - 1, cy - 15, 1.2, hlColor, 1.0).setDepth(depth + 22);
          gfx.eyeOuter = eyeOuter;
          gfx.eyeCore = eyeCore;
          gfx.eyeHighlight = eyeHighlight;
          gfx.eyeX = cx;
          gfx.eyeY = cy - 14;
        }

        if (gfx.eyeOuter && gfx.eyeCore && gfx.eyeHighlight && gfx.eyeX !== undefined && gfx.eyeY !== undefined) {
          const targetX = player ? player.x : cx;
          const targetY = player ? player.y - 18 : cy - 30;
          const dx = targetX - gfx.eyeX;
          const dy = targetY - gfx.eyeY;
          const dist = Math.hypot(dx, dy);

          if (dist > 3) {
            const speed = magnetSpeed / 60;
            gfx.eyeX += (dx / dist) * Math.min(speed, dist);
            gfx.eyeY += (dy / dist) * Math.min(speed, dist);
            gfx.eyeOuter.setPosition(gfx.eyeX, gfx.eyeY);
            gfx.eyeCore.setPosition(gfx.eyeX, gfx.eyeY);
            gfx.eyeHighlight.setPosition(gfx.eyeX - 1, gfx.eyeY - 1);
          } else {
            // Absorbido en el torso de Kratos
            gfx.eyeOuter.setVisible(false);
            gfx.eyeCore.setVisible(false);
            gfx.eyeHighlight.setVisible(false);
          }
        }
      }
    }
  }

  shutdown(): void {
    this.hudLayer?.destroy();
    for (const gfx of this.orbSprites.values()) {
      gfx.outer.destroy();
      gfx.core.destroy();
      gfx.highlight.destroy();
    }
    this.orbSprites.clear();
    for (const sprite of this.archerSprites.values()) {
      sprite.destroy();
    }
    this.archerSprites.clear();
    for (const sprite of this.arrowSprites.values()) {
      sprite.destroy();
    }
    this.arrowSprites.clear();
    for (const gfx of this.chestGfx.values()) {
      gfx.body.destroy();
      gfx.prompt.destroy();
      gfx.eyeOuter?.destroy();
      gfx.eyeCore?.destroy();
      gfx.eyeHighlight?.destroy();
    }
    this.chestGfx.clear();
    if (this.barrierGraphics) {
      this.barrierGraphics.destroy();
      this.barrierGraphics = null;
    }
    if (this.magicGraphics) {
      this.magicGraphics.destroy();
      this.magicGraphics = null;
    }
  }
}
