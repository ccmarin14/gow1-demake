import Phaser from 'phaser';
import {
  ASSET_DOMAINS,
  ASSETS,
  BACKGROUND_KEY,
} from '../assets/manifest';
import { CONFIG } from '../config';
import {
  attachScaleReferenceOverlay,
  updateScaleReference,
} from '../dev/scaleOverlay';
import { InputManager } from '../input/InputManager';
import { HudLayer } from '../ui/HudLayer';
import { GameFlowOverlay } from '../ui/GameFlowOverlay';
import { PlayerView } from './PlayerView';
import { EnemyView } from './EnemyView';
import { drawChain } from '../entities/strikeArt';
import { grabImpactPoint, kratosGrabFrameKey, ripHalvesOrigin, tossChainLines, tossNeckWorld, tossWhipPath } from './grabPose';

/** The Toss whip: the smear fades over this many ticks after the release; the chains stay taut this many while he flies. */
const TOSS_SMEAR_FADE_TICKS = 4;
const TOSS_TAUT_TICKS = 14;
import { RipHalves } from './RipHalves';
import { VfxLayer } from './VfxLayer';
import { SoundManager } from '../audio/SoundManager';
import { isLastStab } from '../sim/grab';
import { STRIKES } from '../sim/strike';
import type { FrameMetrics } from '../metrics';
import type { Simulation } from '../sim/engine';
import type { EntityState } from '../sim/types';
import { PLAYER_ID } from '../sim/types';

export class ShellScene extends Phaser.Scene {
  private inputManager!: InputManager;
  private bg: Phaser.GameObjects.TileSprite | null = null;
  private debugText: Phaser.GameObjects.Text | null = null;
  private lastDebugText = '';
  private playerView: PlayerView | null = null;
  private platformRects: (Phaser.GameObjects.Rectangle | Phaser.GameObjects.Graphics)[] = [];
  private renderedScenario = '';
  private targetRects = new Map<string, Phaser.GameObjects.Rectangle>();
  private readonly enemyViews = new Map<string, EnemyView>();
  private arrowRects = new Map<string, Phaser.GameObjects.Rectangle>();
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
  private defeatText: Phaser.GameObjects.Text | null = null;
  private waveBannerText: Phaser.GameObjects.Text | null = null;
  private checkpointBannerText: Phaser.GameObjects.Text | null = null;
  private checkpointBannerTimer: number = 0;
  private hydraVictoryBannerText: Phaser.GameObjects.Text | null = null;
  private hydraVictoryTimer: number = 0;
  private barrierGraphics: Phaser.GameObjects.Graphics | null = null;
  private checkpointGraphics: Phaser.GameObjects.Graphics | null = null;
  private magicGraphics: Phaser.GameObjects.Graphics | null = null;
  hudLayer!: HudLayer;
  flowOverlay!: GameFlowOverlay;
  vfxLayer!: VfxLayer;
  /** The chain that tethers the thrown soldier to Kratos for a moment after the Toss. */
  private tossChain!: Phaser.GameObjects.Graphics;
  /** The two halves of a soldier torn in two by the Rip. */
  private ripHalves!: RipHalves;
  soundManager!: SoundManager;
  private prevParryActive = false;
  private prevMagicPhase = 'none';
  private prevHydraState = 'none';
  private prevAbsorbedOrbsCount = 0;
  private prevOpenChestsCount = 0;
  private prevFlowState = 'playing';
  private prevStrikeId: string | null = null;
  private prevGrabPhase = 'none';
  /** Last grab phase and tick the impact effects saw: they fire on the tick that CROSSES the impact tick, once. */
  private prevFxPhase = 'none';
  private prevFxTicks = 0;
  private prevFxFrame: string | null = null;

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

    this.playerView = new PlayerView(this, this.simulation.world.peekEntity(PLAYER_ID));
    this.hudLayer = new HudLayer(this);
    this.flowOverlay = new GameFlowOverlay(this);
    this.vfxLayer = new VfxLayer(this);
    this.tossChain = this.add.graphics().setDepth(1.1);
    this.ripHalves = new RipHalves(
      this,
      (x, y) => this.vfxLayer.emitBloodBurst(x, y - 6, 14),
      (x, y) => this.vfxLayer.emitBloodBurst(x, y, 2),
    );
    this.soundManager = new SoundManager();

    this.input.keyboard?.on('keydown-M', () => {
      this.soundManager.toggleMute();
    });

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

    this.checkpointBannerText = this.add
      .text(CONFIG.internal.width / 2, 45, 'PUNTO DE CONTROL ALCANZADO', {
        color: '#fef08a',
        fontFamily: 'monospace',
        fontSize: '11px',
        fontStyle: 'bold',
        backgroundColor: '#000000cc',
        padding: { x: 10, y: 3 },
      })
      .setOrigin(0.5)
      .setDepth(27)
      .setScrollFactor(0)
      .setAlpha(0)
      .setVisible(true);

    this.hydraVictoryBannerText = this.add
      .text(CONFIG.internal.width / 2, 75, '¡HIDRA DERROTADA!', {
        color: '#facc15',
        fontFamily: 'monospace',
        fontSize: '13px',
        fontStyle: 'bold',
        backgroundColor: '#000000cc',
        padding: { x: 12, y: 5 },
      })
      .setOrigin(0.5)
      .setDepth(28)
      .setScrollFactor(0)
      .setAlpha(0)
      .setVisible(true);

    this.checkpointGraphics = this.add.graphics().setDepth(CONFIG.presentation.checkpoint.depth ?? 1);

    if (import.meta.env.DEV) {
      this.lastDebugText = 'tick 0';
      this.debugText = this.add.text(155, 6, this.lastDebugText, {
        color: CONFIG.presentation.debugText,
        fontFamily: 'monospace',
        fontSize: '8px',
      });
      this.debugText.setDepth(10).setScrollFactor(0);
      attachScaleReferenceOverlay(this);

      // Atajos de teclado para pruebas rápidas
      this.input.keyboard?.on('keydown-R', () => {
        this.restartScene();
      });
      this.input.keyboard?.on('keydown-P', () => {
        this.spawnDebugEnemy('legionnaire');
      });
      this.input.keyboard?.on('keydown-O', () => {
        this.spawnDebugEnemy('archer');
      });
    }
  }

  restartScene(): void {
    this.simulation.world.reset();
    this.redrawPlatforms();
  }

  spawnDebugEnemy(kind: 'legionnaire' | 'archer' = 'legionnaire'): EntityState | null {
    const player = this.simulation.world.peekEntity(PLAYER_ID);
    const facing = player ? (player.facing === 1 ? -1 : 1) : -1;
    const spawnX = player ? player.x + (player.facing === 1 ? 55 : -55) : 300;
    return this.simulation.world.spawnEnemy(kind, spawnX, facing);
  }

  update(_time: number, delta: number): void {
    this.metrics.record(delta);
    if (this.simulation.world.scenarioName !== this.renderedScenario || this.simulation.world.consumeResetNotice()) {
      this.redrawPlatforms();
    }
    const actions = this.inputManager.poll();
    this.simulation.advance(delta, actions);
    const flowState = this.simulation.world.getFlowState();

    this.playerView?.setPaused(flowState === 'paused');
    const player = this.simulation.world.peekEntity(PLAYER_ID) ?? null;
    if (player && this.playerView) {
      const isOpeningChest = this.simulation.world.peekChests().some((c) => c.state === 'opening');
      this.playerView.update(player, isOpeningChest, this.simulation.world.peekStrike());
    }

    if (this.defeatText) {
      const isDead = Boolean(player && player.isDead);
      this.defeatText.setVisible(isDead);
      if (isDead) {
        const hasChk = Boolean(this.simulation.world.getActiveCheckpoint());
        this.defeatText.setText(
          hasChk
            ? 'HAS MUERTO - PULSA R PARA REAPARECER'
            : 'DERROTA - PULSA R PARA REINTENTAR',
        );
      }
    }

    if (this.waveBannerText) {
      const wave = this.simulation.world.peekWave ? this.simulation.world.peekWave() : null;
      if (!wave || flowState === 'title') {
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

    // No HUD on the title screen; the boss bar shows only once the hydra is
    // within one screen of the player.
    const hydra = this.simulation.world.getHydra();
    const bossInRange = Boolean(
      hydra && player && Math.abs(hydra.x - player.x) <= CONFIG.internal.width,
    );
    this.hudLayer.setHidden(flowState === 'title');
    this.hudLayer.update(
      player ?? undefined,
      delta / 1000,
      hydra && bossInRange ? { hp: hydra.hp, maxHp: hydra.maxHp, name: 'LA HIDRA DE LERNA' } : null,
    );

    if (this.flowOverlay) {
      const stats = this.simulation.world.getCombatStats();
      const hasChk = Boolean(this.simulation.world.getActiveCheckpoint());
      this.flowOverlay.update(
        flowState,
        player ?? undefined,
        stats,
        hasChk,
        delta / 1000,
      );
    }

    if (this.simulation.world.consumeHydraSlamNotice()) {
      this.cameras.main.shake(150, 0.012);
      if (this.vfxLayer) {
        this.vfxLayer.emitCombatSparks(hydra ? hydra.x - 70 : 380, 262, 12);
      }
      if (this.soundManager) {
        this.soundManager.playHydraSlam();
      }
    }

    const activeStrike = this.simulation.world.peekStrike();
    if (activeStrike && activeStrike.tick === 0 && activeStrike.id !== this.prevStrikeId) {
      const def = STRIKES[activeStrike.id];
      const profile = def.air
        ? 'air'
        : (def.heavy || def.damage >= CONFIG.combat.feel.heavyDamage)
          ? 'heavy'
          : 'light';
      this.soundManager?.playStrikeWhoosh(profile);
    }
    this.prevStrikeId = activeStrike?.id ?? null;

    const strikeImpact = this.simulation.world.consumeStrikeImpactNotice();
    if (strikeImpact) {
      // The strike's one-shot effects (flash and fire line are drawn by the weapon layer).
      if (strikeImpact.shake) {
        const { width } = CONFIG.internal;
        this.cameras.main.shake((strikeImpact.shake.ticks * 1000) / 60, strikeImpact.shake.px / width);
      }
      for (const x of strikeImpact.dust) {
        this.vfxLayer?.emitDust(x, strikeImpact.y);
        // Sparks where the blades bite the ground.
        this.vfxLayer?.emitCombatSparks(x, strikeImpact.y - 2, 8, true);
      }
    }

    const strikeHit = this.simulation.world.consumeStrikeHitNotice();
    if (strikeHit) {
      // A heavy blow (triangle, plume, the finisher) sparks more, shakes the screen harder and thuds deeper.
      const heavy = strikeHit.kind === 'heavy';
      this.vfxLayer?.emitCombatSparks(strikeHit.x, strikeHit.y, heavy ? 16 : 8, true);
      this.cameras.main.shake(heavy ? 140 : 70, heavy ? 0.006 : 0.0025);
      this.soundManager?.playStrikeHit(strikeHit.kind);
    }

    if (this.soundManager) {
      if (player) {
        // Magic thunder sound
        if (player.magicPhase === 'startup' && this.prevMagicPhase !== 'startup') {
          this.soundManager.playMagicThunder();
        }
        this.prevMagicPhase = player.magicPhase;

        // Parry sound
        if (player.parryActive && !this.prevParryActive) {
          this.soundManager.playParry();
        }

        // Sonidos de agarre: Whiff (E1) y Enganche (E2)
        if (player.grabPhase !== this.prevGrabPhase) {
          if (player.grabPhase === 'whiff') {
            this.soundManager.playGrabWhoosh();
          } else if ((player.grabPhase === 'hold' && this.prevGrabPhase === 'none') || player.grabPhase === 'finisher_qte') {
            // Solo el enganche suena: volver a la sujeción entre puñetazos no repite el zumbido
            this.soundManager.playGrabWhoosh();
          }
        }
        this.prevGrabPhase = player.grabPhase;
      }

      // Hydra roar sound
      if (hydra) {
        if (hydra.aiState === 'hydra_roar' && this.prevHydraState !== 'hydra_roar') {
          this.soundManager.playHydraRoar();
        }
        this.prevHydraState = hydra.aiState;
      }

      // Orbs absorbed sound
      const absorbedOrbs = this.simulation.world.peekOrbs().filter((o) => o.absorbed);
      if (absorbedOrbs.length > this.prevAbsorbedOrbsCount) {
        const lastOrb = absorbedOrbs[absorbedOrbs.length - 1];
        this.soundManager.playOrbAbsorb(lastOrb ? lastOrb.type : 'red');
      }
      this.prevAbsorbedOrbsCount = absorbedOrbs.length;

      // Chest opened sound
      const openChests = this.simulation.world.peekChests().filter((c) => c.state === 'open').length;
      if (openChests > this.prevOpenChestsCount) {
        this.soundManager.playChestOpen();
      }
      this.prevOpenChestsCount = openChests;

      // Victory fanfare
      if (flowState === 'victory' && this.prevFlowState !== 'victory') {
        this.soundManager.playVictoryFanfare();
      }
      this.prevFlowState = flowState;
    }

    if (this.vfxLayer) {
      if (player) {
        // Detect parry trigger
        if (player.parryActive && !this.prevParryActive) {
          this.vfxLayer.emitParryFlash(player.x + player.facing * 18, player.y - 18);
        }
        this.prevParryActive = Boolean(player.parryActive);

        // Feedback visceral de impacto en los agarres clásicos de GoW 1 (○ Pummel, △ Break, □ Throw, ○ Slam)
        const grabVictim = player.grabTargetId ? this.simulation.world.peekEntity(player.grabTargetId) : undefined;
        const impactAt = (
          kind: 'punch' | 'toss-stab' | 'floor-stab' | 'slam',
          fallbackDx: number,
          fallbackDy: number,
        ): readonly [number, number] =>
          (grabVictim ? grabImpactPoint(player, grabVictim, kind) : null) ?? [
            player.x + player.facing * fallbackDx,
            player.y + fallbackDy,
          ];
        // The sim ticks at 60 Hz but this runs once per screen frame: on a 120 Hz screen the same tick lasts two
        // frames and the blow would bleed, shake and sound twice; at 30 fps it could be skipped. Each effect fires
        // on the frame that crosses its tick (and the hitstop, which freezes the tick, does not repeat it).
        const freshTick = player.grabPhase !== this.prevFxPhase || player.grabTicks < this.prevFxTicks;
        const crosses = (phases: readonly string[], tick: number): boolean =>
          phases.includes(player.grabPhase) && player.grabTicks >= tick && (freshTick || this.prevFxTicks < tick);
        // One impact grammar for every circle blow (CONFIG.player.grab.shake / hitstop): the shake is forced so a
        // weaker one still running never swallows it, and it fires on the tick of the contact with its sound.
        const grab = CONFIG.player.grab;
        const shake = (kind: keyof typeof grab.shake): void => {
          const { ms, px } = grab.shake[kind];
          this.cameras.main.shake(ms, px / CONFIG.internal.width, true);
        };
        const lastStab = isLastStab(player);
        const ripTension = grab.ripTick - grab.ripStretchTicks;
        if (
          (player.grabPhase === 'hold' || player.grabPhase === 'finisher_qte') &&
          (player.grabPummelCount ?? 0) === 0 &&
          kratosGrabFrameKey(player) === 'kratos-grab-hold' &&
          this.prevFxFrame === 'kratos-grab-lunge'
        ) {
          // The latch: the hand closes on the neck when Kratos arrives (it used to sound on tick 2, mid-lunge)
          shake('latch');
          this.soundManager?.playGrabClamp();
        } else if (crosses(['pummel'], 4)) {
          // Puñetazo con la víctima sujeta en alto (Grab 1 - TAP ○ REPEATEDLY)
          shake('punch');
          { const [ix, iy] = impactAt('punch', 18, -20); this.vfxLayer.emitBloodSpurt(ix, iy, player.facing, 8); }
          this.soundManager?.playStrikeHit('light');
        } else if (crosses(['stab'], grab.chain.stabImpactTick)) {
          // Puñalada con la Espada del Caos sobre la víctima caída (Grab 1); la última, la que mata, pesa más
          shake(lastStab ? 'lastStab' : 'stab');
          // a burst of fury: every stab spits a column of blood and a spark where the blade goes in
          const [ix, iy] = impactAt('floor-stab', 20, -6);
          this.vfxLayer.emitBloodGeyser(ix, iy - 2, player.facing, lastStab ? 26 : 14);
          this.vfxLayer.emitBloodSpurt(ix, iy, player.facing, lastStab ? 34 : 12);
          this.vfxLayer.emitCombatSparks(ix, iy - 3, lastStab ? 8 : 4, true);
          if (lastStab) {
            this.vfxLayer.emitBloodBurst(ix, iy - 2, 16);
            this.vfxLayer.emitParryFlash(ix, iy - 4);
          }
          this.soundManager?.playStab();
          if (lastStab) this.soundManager?.playStrikeHit('heavy');
        } else if (crosses(['break'], ripTension)) {
          // The Rip's stretch: a low rumble that grows into the tear
          this.cameras.main.shake((grab.ripStretchTicks * 1000) / 60, 1 / CONFIG.internal.width, true);
        } else if (crosses(['break'], grab.ripTick)) {
          // Quiebre brutal (Grab 2 - △ Rip): lo parte en dos; las mitades salen despedidas y la sangre sale en abanico
          shake('rip');
          const origin = grabVictim ? ripHalvesOrigin(player, grabVictim) : null;
          const mx = origin ? origin.x : player.x + player.facing * 18;
          const my = origin ? origin.y - 22 : player.y - 22;
          // the halves stay frozen (white) with the world for the hitstop, then fly
          if (origin) this.ripHalves.spawn(origin, player.facing, player.y, grab.hitstop.rip / 60);
          this.vfxLayer.emitParryFlash(mx, my);
          this.vfxLayer.emitBloodBurst(mx, my, 70);
          this.vfxLayer.emitBloodSpurt(mx, my, player.facing, 28);
          this.vfxLayer.emitBloodSpurt(mx, my, player.facing === 1 ? -1 : 1, 28);
          this.vfxLayer.emitDust(player.x + player.facing * 8, player.y);
          this.soundManager?.playBoneBreak();
          this.soundManager?.playStrikeHit('heavy');
        } else if (crosses(['throw'], grab.toss.stabTick) && player.grabTicks < grab.toss.releaseTick) {
          // Espada hundida en el soldado sujeto de lado (Toss)
          shake('toss');
          { const [ix, iy] = impactAt('toss-stab', 14, -14); this.vfxLayer.emitBloodSpurt(ix, iy, player.facing, 18); }
          this.soundManager?.playStab();
        } else if (crosses(['throw'], grab.toss.releaseTick - grab.toss.snapTicks) && player.grabTicks < grab.toss.releaseTick) {
          // the whip starts: the air cut by the soldier swung over Kratos' shoulder
          this.soundManager?.playGrabWhoosh();
        } else if (crosses(['throw'], grab.toss.releaseTick)) {
          // Impulso y despegue del proyectil humano (Grab 3 - □ Throw): el chasquido del látigo, donde lo suelta
          shake('toss');
          const [nx, ny] = tossNeckWorld(player, grab.toss.releaseTick - 1);
          this.vfxLayer.emitParryFlash(nx, ny);
          this.vfxLayer.emitCombatSparks(nx, ny, 12, true);
          this.vfxLayer.emitDust(player.x - player.facing * 6, player.y);
          this.vfxLayer.emitDust(player.x + player.facing * 10, player.y);
          this.soundManager?.playThrowRelease();
          this.soundManager?.playStrikeHit('heavy');
        } else if (crosses(['slam', 'finisher_slam'], grab.slamImpactTick)) {
          // Azote brutal contra las tablas de cubierta (○ Slam): el golpe más pesado de la escala
          shake('slam');
          const [sx, sy] = impactAt('slam', 18, -6);
          this.vfxLayer.emitParryFlash(sx, sy - 4);
          this.vfxLayer.emitBloodBurst(sx, sy - 2, 24);
          this.vfxLayer.emitDust(sx, player.y);
          this.vfxLayer.emitDust(sx + player.facing * 14, player.y);
          this.vfxLayer.emitCombatSparks(sx, player.y - 2, 12, true);
          this.soundManager?.playSlamImpact();
          this.soundManager?.playStrikeHit('heavy');
        }
        // The Rip's stretch also drips blood from the waist every 3 ticks (the original bleeds before the tear)
        if (player.grabPhase === 'break' && player.grabTicks >= ripTension && player.grabTicks < grab.ripTick) {
          for (let tick = ripTension; tick < grab.ripTick; tick += 3) {
            if (crosses(['break'], tick) && player.grabTicks < tick + 1) {
              const at = grabVictim ? ripHalvesOrigin(player, grabVictim) : null;
              if (at) this.vfxLayer.emitBloodBurst(at.x, at.y - 22, 3);
            }
          }
        }
        this.prevFxFrame = kratosGrabFrameKey(player);
        this.prevFxPhase = player.grabPhase;
        this.prevFxTicks = player.grabTicks;
      }

      this.tossChain.clear();
      if (player && player.grabPhase === 'throw') this.drawTossWhip(player);
      if (flowState !== 'paused') this.ripHalves.update(delta / 1000);
      this.vfxLayer.update(delta / 1000, flowState === 'paused');
    }

    if (this.simulation.world.consumeHydraDefeatNotice()) {
      this.hydraVictoryTimer = 4.0;
    }
    if (this.hydraVictoryTimer > 0) {
      this.hydraVictoryTimer = Math.max(0, this.hydraVictoryTimer - delta / 1000);
      this.hydraVictoryBannerText?.setAlpha(Math.min(1, this.hydraVictoryTimer * 1.5));
    } else {
      this.hydraVictoryBannerText?.setAlpha(0);
    }

    this.applyCamera();

    if (this.bg) {
      this.bg.tilePositionX = this.cameras.main.scrollX * (CONFIG.map.level1.camera.parallaxFactor ?? 0.25);
    }

    const isPlayerAlive = Boolean(player && !player.isDead);
    this.playerView?.updateWeapon(isPlayerAlive ? player : null, this.simulation.world.peekStrike());
    this.playerView?.updateGroundFires(this.simulation.world.peekGroundFires());
    this.updateTargets(player);
    this.updateOrbs();
    this.updateArrows();
    this.updateArenaBarriers();
    this.updateMagic(player);
    this.updateChests(player);
    this.updateCheckpoints();

    // Banner de punto de control alcanzado
    const chkNotice = this.simulation.world.consumeCheckpointNotice();
    if (chkNotice) {
      this.checkpointBannerTimer = 2.0;
      this.checkpointBannerText?.setText('PUNTO DE CONTROL ALCANZADO');
    }
    if (this.checkpointBannerTimer > 0) {
      this.checkpointBannerTimer = Math.max(0, this.checkpointBannerTimer - delta / 1000);
      const alpha = Math.min(1.0, this.checkpointBannerTimer);
      this.checkpointBannerText?.setAlpha(alpha);
    } else {
      this.checkpointBannerText?.setAlpha(0);
    }
    // `import.meta.env.DEV` is statically false in a production build, so the
    // overlay module is dropped from the shipped bundle.
    if (import.meta.env.DEV && player) {
      updateScaleReference(player.x, player.y, player.facing);
    }
    this.debugText?.setVisible(flowState !== 'title');
    if (this.debugText) {
      const grd = player && player.guardPhase !== 'none' ? ` grd=${player.guardPhase}:${player.guardTicks}${player.parryActive ? '(P)' : ''}` : '';
      const hpInfo = player ? ` hp=${player.hp}` : '';
      const hurtInfo = player && player.hurtInvulTicks > 0 ? ` hurtInv=${player.hurtInvulTicks}` : '';
      const deadInfo = player && player.isDead ? ' [DEAD]' : '';
      const nextText = `tick ${this.simulation.world.frame} x=${player ? player.x.toFixed(1) : '-'}${hpInfo}${hurtInfo}${deadInfo}${grd}`;
      if (nextText !== this.lastDebugText) {
        this.lastDebugText = nextText;
        this.debugText.setText(nextText);
      }
    }
  }

  /**
   * The Toss whip (game feel, user: "que se note más el latigazo"): while Kratos snaps the soldier over and for a
   * few ticks after he lets go, a pale smear follows the arc the soldier's neck swept; the two chains run together
   * out of Kratos' hands to one hook on the soldier, white and taut at the snap, taut while he flies, slack when
   * he lands and they reel back.
   */
  private drawTossWhip(player: Readonly<EntityState>): void {
    const toss = CONFIG.player.grab.toss;
    const t = player.grabTicks;
    const snapFrom = toss.releaseTick - toss.snapTicks;
    const since = t - toss.releaseTick;
    if (t < snapFrom || since >= toss.chainTicks) return;
    const g = this.tossChain;
    // the smear: dense along the arc, its tail fading, gone 4 ticks after the release
    const fade = since < 0 ? 1 : 1 - since / TOSS_SMEAR_FADE_TICKS;
    if (fade > 0) {
      const path = tossWhipPath(player, t, 40);
      path.forEach(([x, y], i) => {
        const k = i / Math.max(1, path.length - 1);
        g.fillStyle(0xf4eee0, fade * (0.15 + 0.55 * k));
        g.fillRect(Math.round(x) - 2, Math.round(y) - 2, 5, 5);
        g.fillStyle(0xffffff, fade * k);
        g.fillRect(Math.round(x), Math.round(y), 1, 1);
      });
    }
    // the chains: from both hands (4 px apart, along the chain) to one hook, side by side 1 px apart
    const thrown = player.grabTargetId ? this.simulation.world.peekEntity(player.grabTargetId) : undefined;
    if (!thrown) return;
    const hook: readonly [number, number] = since < 0 ? tossNeckWorld(player, t) : [thrown.x, thrown.y - 20];
    const reel = Math.min(1, Math.max(0, (since - (toss.chainTicks - 8)) / 8));
    const slack = since < TOSS_TAUT_TICKS ? 0 : Math.min(4, (since - TOSS_TAUT_TICKS) / 2);
    const sag = Math.max(slack, reel * 6);
    const colors = since <= 1 ? [0xffffff, 0xd0ccd6] : [0xd0ccd6, 0x6c6674];
    for (const [start, end] of tossChainLines(player, kratosGrabFrameKey(player) ?? 'kratos-grab-throw-b', hook, reel)) {
      // each chain two pixels thick so it reads at 1x; the second lies right under the first
      drawChain(g, start, end, sag, colors);
      drawChain(g, [start[0], start[1] + 1], [end[0], end[1] + 1], sag, colors);
    }
  }

  private updateTargets(player: Readonly<EntityState> | null): void {
    const targets = this.simulation.world.peekTargets();
    const halfW = CONFIG.combat.target.halfWidth;
    const halfH = CONFIG.combat.target.halfHeight;
    const enemy = CONFIG.presentation.enemyPlaceholder;
    const hydraBox = CONFIG.presentation.hydraPlaceholder;

    for (const [id, view] of this.enemyViews.entries()) {
      if (!targets.some((t) => t.id === id)) {
        view.destroy();
        this.enemyViews.delete(id);
      }
    }
    for (const [id, rect] of this.targetRects.entries()) {
      if (!targets.some((t) => t.id === id)) {
        rect.destroy();
        this.targetRects.delete(id);
      }
    }

    // Every target is a placeholder box the size of its hit area until its art
    // is drawn; legionnaires use EnemyView with their 27 approved frames.
    for (const target of targets) {
      if (target.kind === 'legionnaire') {
        const oldRect = this.targetRects.get(target.id);
        if (oldRect) {
          oldRect.destroy();
          this.targetRects.delete(target.id);
        }
        let view = this.enemyViews.get(target.id);
        if (!view) {
          view = new EnemyView(this, target.x, target.y);
          this.enemyViews.set(target.id, view);
        }
        view.update(target, player);
        continue;
      }

      const boxHalfW = target.kind === 'hydra' ? hydraBox.width / 2 : halfW;
      const boxHalfH = target.kind === 'hydra' ? hydraBox.height / 2 : halfH;
      let rect = this.targetRects.get(target.id);
      if (!rect) {
        rect = this.add.rectangle(0, 0, boxHalfW * 2, boxHalfH * 2, CONFIG.presentation.targetColor);
        rect.setOrigin(0.5, 0.5).setDepth(1);
        this.targetRects.set(target.id, rect);
      }
      const shakeX = target.hitstunTicks > 0 && target.hitstunTicks % 2 === 1 ? 1 : 0;
      rect.setPosition(target.x + shakeX, target.y - boxHalfH);

      const telegraphing = target.aiState === 'windup' || target.aiState === 'aim';
      let color: number = CONFIG.presentation.targetColor;
      if (target.kind === 'archer') color = enemy.archerColor;
      if (telegraphing) color = enemy.telegraphColor;
      if (target.hitstunTicks > 0) {
        color = player && player.magicPhase === 'active' ? 0x67e8f9 : CONFIG.presentation.targetHitColor;
      }
      rect.setFillStyle(color);
      rect.setAlpha(target.aiState === 'death' ? enemy.deadAlpha : 1);
    }
  }

  /**
   * The single place that sets the camera scroll each frame: horizontal
   * scroll from the simulation (level1 only), no vertical offset (CAM-01).
   */
  private applyCamera(): void {
    const scrollX = this.simulation.world.scenarioName === 'level1' ? this.simulation.world.cameraScrollX : 0;
    this.cameras.main.setScroll(scrollX, 0);
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
    for (const view of this.enemyViews.values()) {
      view.destroy();
    }
    this.enemyViews.clear();
    for (const rect of this.targetRects.values()) {
      rect.destroy();
    }
    this.targetRects.clear();
    for (const rect of this.arrowRects.values()) {
      rect.destroy();
    }
    this.arrowRects.clear();
    for (const gfx of this.chestGfx.values()) {
      gfx.body.destroy();
      gfx.prompt.destroy();
      gfx.eyeOuter?.destroy();
      gfx.eyeCore?.destroy();
      gfx.eyeHighlight?.destroy();
    }
    this.chestGfx.clear();
    this.checkpointBannerTimer = 0;
    this.checkpointBannerText?.setAlpha(0);
    if (this.checkpointGraphics) {
      this.checkpointGraphics.clear();
    }
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

    for (const [id, rect] of this.arrowRects.entries()) {
      if (!activeIds.has(id)) {
        rect.destroy();
        this.arrowRects.delete(id);
      }
    }

    // Arrows are placeholder bars until their art is drawn; gold once parried.
    const look = CONFIG.presentation.enemyPlaceholder.arrow;
    for (let i = 0; i < simArrows.length; i += 1) {
      const arrow = simArrows[i];
      if (!arrow.active) continue;

      let rect = this.arrowRects.get(arrow.id);
      if (!rect) {
        rect = this.add.rectangle(arrow.x, arrow.y, look.width, look.height, look.color);
        rect.setOrigin(0.5, 0.5).setDepth(20);
        this.arrowRects.set(arrow.id, rect);
      }
      rect.setPosition(arrow.x, arrow.y);
      rect.setFillStyle(arrow.reflected ? 0xffea00 : look.color);
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
      redOrbsColor,
      redOrbsGlowColor,
      depth,
    } = CONFIG.presentation.chest;

    const interactionRadius = CONFIG.economy.chests.interactionRadius;
    const verticalTolerance = CONFIG.economy.chests.verticalTolerance;

    for (let i = 0; i < simChests.length; i += 1) {
      const chest = simChests[i];
      let gfx = this.chestGfx.get(chest.id);
      const isFeather = chest.type === 'phoenix_feather';
      const isRedOrbs = chest.type === 'red_orbs';
      const gemColor = isFeather
        ? sapphireColor
        : isRedOrbs
          ? redOrbsColor
          : emeraldColor;
      const gemGlow = isFeather
        ? sapphireGlowColor
        : isRedOrbs
          ? redOrbsGlowColor
          : emeraldGlowColor;
      const hlColor = isFeather ? 0xe0f2fe : isRedOrbs ? 0xfecaca : 0xdcfce7;
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

  private updateCheckpoints(): void {
    if (!this.checkpointGraphics) {
      return;
    }
    this.checkpointGraphics.clear();

    const checkpoints = this.simulation.world.peekCheckpoints();
    if (checkpoints.length === 0) {
      return;
    }

    const {
      pillarColor,
      glowColor,
      coreColor,
      baseRuneColor,
      baseRuneGlow,
    } = CONFIG.presentation.checkpoint;

    const pillarW = CONFIG.checkpoints.lightPillarWidth;
    const pillarH = CONFIG.checkpoints.lightPillarHeight;
    const time = this.simulation.world.frame * 0.08;

    for (let i = 0; i < checkpoints.length; i += 1) {
      const chk = checkpoints[i];
      const cx = chk.x;
      const cy = chk.y; // deck line

      const pulse = 0.8 + 0.2 * Math.sin(time + i * 2);
      const baseAlpha = chk.active ? 0.45 : 0.28;

      // 1. Runas concéntricas en la madera de la cubierta
      this.checkpointGraphics.fillStyle(baseRuneGlow, (baseAlpha + 0.1) * pulse);
      this.checkpointGraphics.fillEllipse(cx, cy, pillarW + 8, 8);

      this.checkpointGraphics.fillStyle(baseRuneColor, (baseAlpha + 0.25) * pulse);
      this.checkpointGraphics.fillEllipse(cx, cy, pillarW - 4, 5);

      this.checkpointGraphics.fillStyle(chk.active ? glowColor : 0x78350f, 0.8 * pulse);
      this.checkpointGraphics.fillEllipse(cx, cy, 8, 3);

      // 2. Columna vertical de luz sagrada
      const halfW = pillarW / 2;
      const xLeft = cx - halfW;
      const yTop = cy - pillarH;

      // Halo exterior
      this.checkpointGraphics.fillStyle(glowColor, 0.12 * pulse);
      this.checkpointGraphics.fillRect(xLeft - 4, yTop, pillarW + 8, pillarH);

      // Columna principal
      this.checkpointGraphics.fillStyle(pillarColor, (chk.active ? 0.28 : 0.18) * pulse);
      this.checkpointGraphics.fillRect(xLeft, yTop, pillarW, pillarH);

      // Filamento central incandescente
      this.checkpointGraphics.fillStyle(coreColor, (chk.active ? 0.45 : 0.25) * pulse);
      this.checkpointGraphics.fillRect(cx - 2, yTop, 4, pillarH);
    }
  }

  shutdown(): void {
    this.hudLayer?.destroy();
    for (const view of this.enemyViews.values()) {
      view.destroy();
    }
    this.enemyViews.clear();
    for (const gfx of this.orbSprites.values()) {
      gfx.outer.destroy();
      gfx.core.destroy();
      gfx.highlight.destroy();
    }
    this.orbSprites.clear();
    for (const rect of this.arrowRects.values()) {
      rect.destroy();
    }
    this.arrowRects.clear();
    for (const gfx of this.chestGfx.values()) {
      gfx.body.destroy();
      gfx.prompt.destroy();
      gfx.eyeOuter?.destroy();
      gfx.eyeCore?.destroy();
      gfx.eyeHighlight?.destroy();
    }
    this.chestGfx.clear();
    this.checkpointBannerTimer = 0;
    this.checkpointBannerText?.setAlpha(0);
    if (this.checkpointGraphics) {
      this.checkpointGraphics.clear();
    }
    if (this.barrierGraphics) {
      this.barrierGraphics.destroy();
      this.barrierGraphics = null;
    }
    if (this.magicGraphics) {
      this.magicGraphics.destroy();
      this.magicGraphics = null;
    }
    this.checkpointBannerText?.destroy();
    this.checkpointBannerText = null;
    this.hydraVictoryBannerText?.destroy();
    this.hydraVictoryBannerText = null;
    this.checkpointGraphics?.destroy();
    this.checkpointGraphics = null;
  }
}
