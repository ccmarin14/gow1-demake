import { spawn, execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../..');
const OUTPUT_DIR = path.resolve(__dirname, 'output');
const FFMPEG_BIN = '/home/ccmarin14/.local/bin/ffmpeg';

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const DEV_PORT = 5187;
const CDP_PORT = 9244;

console.log('=== GOW1 COMBAT POLISH - CDP AUTOMATED VERIFICATION ===');
console.log('Output directory:', OUTPUT_DIR);

let viteProcess = null;
let chromeProcess = null;

async function startVite() {
  console.log(`Starting Vite dev server on port ${DEV_PORT}...`);
  viteProcess = spawn('pnpm', ['exec', 'vite', '--port', String(DEV_PORT), '--strictPort'], {
    cwd: REPO_ROOT,
    stdio: 'ignore',
  });
  for (let i = 0; i < 40; i += 1) {
    try {
      const res = await fetch(`http://127.0.0.1:${DEV_PORT}/`);
      if (res.ok) {
        console.log('Vite server ready!');
        return;
      }
    } catch {}
    await sleep(150);
  }
  throw new Error('Timed out waiting for Vite server');
}

async function startChrome() {
  console.log(`Starting headless Chrome on CDP port ${CDP_PORT}...`);
  chromeProcess = spawn(
    'google-chrome',
    [
      `--remote-debugging-port=${CDP_PORT}`,
      '--headless=new',
      '--no-sandbox',
      '--disable-gpu',
      '--disable-background-networking',
      '--disable-default-apps',
      '--disable-sync',
      '--disable-translate',
      '--mute-audio',
      '--window-size=960,540',
      'about:blank',
    ],
    { stdio: 'ignore' }
  );

  let target = null;
  for (let i = 0; i < 40; i += 1) {
    try {
      const res = await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`);
      const list = await res.json();
      target = list.find((t) => t.type === 'page');
      if (target) break;
    } catch {}
    await sleep(150);
  }
  if (!target) throw new Error('No Chrome CDP page target found');
  console.log('Chrome CDP ready! Target:', target.id);
  return target.webSocketDebuggerUrl;
}

async function run() {
  try {
    await startVite();
    const wsUrl = await startChrome();

    const ws = new WebSocket(wsUrl);
    await new Promise((resolve, reject) => {
      ws.addEventListener('open', resolve);
      ws.addEventListener('error', reject);
    });

    let nextId = 1;
    const pending = new Map();
    const consoleErrors = [];

    ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
        consoleErrors.push(msg.params);
      }
      if (msg.method === 'Runtime.exceptionThrown') {
        consoleErrors.push(msg.params);
      }
      if (msg.id && pending.has(msg.id)) {
        const { resolve, reject } = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) reject(new Error(JSON.stringify(msg.error)));
        else resolve(msg.result);
      }
    });

    function send(method, params = {}) {
      const id = nextId++;
      ws.send(JSON.stringify({ id, method, params }));
      return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
    }

    async function evaluate(expression) {
      const res = await send('Runtime.evaluate', {
        expression,
        returnByValue: true,
        awaitPromise: true,
      });
      if (res.exceptionDetails) {
        throw new Error('Eval exception: ' + JSON.stringify(res.exceptionDetails));
      }
      return res.result.value;
    }

    await send('Runtime.enable');
    await send('Page.enable');
    await send('Page.navigate', { url: `http://localhost:${DEV_PORT}/` });

    console.log('Navigated to game. Waiting for __GOW8B harness...');
    for (let i = 0; i < 60; i += 1) {
      const ready = await evaluate(`Boolean(window.__GOW8B && window.__GOW8B.snapshot().frame > 5)`);
      if (ready) break;
      await sleep(100);
    }

    // Hook ShellScene
    await evaluate(`(() => {
      const origGet = Map.prototype.get;
      Map.prototype.get = function(k) {
        const res = origGet.call(this, k);
        if (res && res.scene && res.scene.sys && res.scene.sys.settings.key === 'shell') {
          window.__SHELL_SCENE = res.scene;
          Map.prototype.get = origGet;
        }
        return res;
      };
      window.__GOW8B.loadScenario('combat');
    })()`);
    await sleep(50);

    // 1. Audit Checksums & Determinism
    console.log('\n--- 1. Baseline Checksums & Determinism Audit ---');
    const checksumAudit = await evaluate(`(async () => {
      const g = window.__GOW8B;
      const sc = window.__SHELL_SCENE;
      sc.simulation.advance = () => 0;

      const { checksumOf } = await import('/src/sim/checksum.ts');
      const scale = g.scaleReference();
      const scaleChecksum = checksumOf(scale);
      const init_empty = g.loadScenario('empty').checksum;
      const init_test = g.loadScenario('test').checksum;
      const init_movement = g.loadScenario('movement').checksum;
      const init_platforms = g.loadScenario('platforms').checksum;
      const init_combat = g.loadScenario('combat').checksum;

      const regressionCheck = {
        apexSimple: Number(scale.jump.ticks.apexHeight.toFixed(3)),
        apexDouble: Number(scale.jump.doubleTicks.apexHeight.toFixed(3)),
        minX: scale.horizontalTravel.minX,
        maxX: scale.horizontalTravel.maxX,
      };

      // 60-tick trace with combo & air actions
      for (let t = 1; t <= 60; t += 1) {
        const acts = [];
        if (t === 1 || t === 10) acts.push('light-attack');
        if (t === 18) acts.push('heavy-attack');
        if (t >= 25 && t <= 39) acts.push('move-right');
        if (t === 30 || t === 42) acts.push('jump');
        if (t === 50) acts.push('dodge');
        g.step(1, acts);
      }
      const combat60_step1 = g.snapshot().checksum;

      // Deterministic replay check
      g.loadScenario('combat');
      for (let t = 1; t <= 60; t += 1) {
        const acts = [];
        if (t === 1 || t === 10) acts.push('light-attack');
        if (t === 18) acts.push('heavy-attack');
        if (t >= 25 && t <= 39) acts.push('move-right');
        if (t === 30 || t === 42) acts.push('jump');
        if (t === 50) acts.push('dodge');
        g.step(1, acts);
      }
      const combat60_replay = g.snapshot().checksum;

      // Roll regression check
      g.loadScenario('movement');
      const startX = g.snapshot().entities.find((e) => e.id === 'player').x;
      g.step(1, ['dodge']);
      let maxInvul = 0;
      let maxRollTick = 0;
      let endX = startX;
      for (let t = 2; t <= 30; t += 1) {
        g.step(1, []);
        const p = g.snapshot().entities.find((e) => e.id === 'player');
        if (p.invulTicks > maxInvul) maxInvul = p.invulTicks;
        if (p.rollTicks > maxRollTick) maxRollTick = p.rollTicks;
        if (p.rollPhase === 'none' && endX === startX) {
          endX = p.x;
        }
      }
      const rollDisplacement = Number((endX - startX).toFixed(2));

      return {
        scaleChecksum,
        init_empty,
        init_test,
        init_movement,
        init_platforms,
        init_combat,
        combat60: combat60_step1,
        deterministic: combat60_step1 === combat60_replay,
        regressionCheck: {
          ...regressionCheck,
          rollMaxInvul: maxInvul,
          rollMaxTicks: maxRollTick,
          rollDisplacement,
        },
      };
    })()`);
    console.log('Checksum Audit Results:', JSON.stringify(checksumAudit, null, 2));

    // Helper for executing sequence, capturing frames and contact sheet
    async function recordScenarioSequence({
      caseId,
      scenario,
      totalSteps,
      getActions,
      cropW = 160,
      cropH = 100,
      fixedCropX = null,
      fixedCropY = null,
    }) {
      console.log(`\n--- Recording Case [${caseId}]: ${totalSteps} ticks ---`);
      const tempFrameDir = path.join(OUTPUT_DIR, `temp_${caseId}`);
      fs.mkdirSync(tempFrameDir, { recursive: true });

      const expr = `(async () => {
        const g = window.__GOW8B;
        const sc = window.__SHELL_SCENE;
        if (g.isScaleReferenceVisible()) g.toggleScaleReference();
        g.loadScenario('${scenario}');
        sc.simulation.advance = () => 0;

        const cropW = ${cropW};
        const cropH = ${cropH};
        const scale = 2;
        const totalSteps = ${totalSteps};
        const cols = 6;
        const rows = Math.ceil(totalSteps / cols);

        const sheet = document.createElement('canvas');
        sheet.width = cols * cropW * scale;
        sheet.height = rows * cropH * scale;
        const sctx = sheet.getContext('2d');
        sctx.imageSmoothingEnabled = false;
        sctx.fillStyle = '#0b0f19';
        sctx.fillRect(0, 0, sheet.width, sheet.height);

        // Frame-by-frame canvas for GIF export
        const single = document.createElement('canvas');
        single.width = cropW * scale;
        single.height = cropH * scale;
        const singleCtx = single.getContext('2d');
        singleCtx.imageSmoothingEnabled = false;

        const gameCanvas = document.querySelector('canvas');
        const logs = [];
        const frames = [];

        const getActionsFn = ${getActions.toString()};

        for (let stepIdx = 0; stepIdx < totalSteps; stepIdx += 1) {
          const t = stepIdx + 1;
          const actions = getActionsFn(t);
          g.step(1, actions);
          await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

          const snap = g.snapshot();
          const p = snap.entities.find((e) => e.id === 'player');
          const dummy = snap.entities.find((e) => e.id !== 'player');

          // Check weapon visibility
          const isWeaponVisible = sc.weaponLayer.weaponChainRects.some((r) => r.visible);

          const col = stepIdx % cols;
          const row = Math.floor(stepIdx / cols);
          const dx = col * cropW * scale;
          const dy = row * cropH * scale;

          const centerX = dummy ? (p.x + dummy.x) / 2 : p.x + 35;
          const centerY = dummy ? Math.min(p.y, dummy.y) - 15 : p.y - 35;
          const sx = ${fixedCropX !== null ? fixedCropX : `Math.max(0, Math.min(480 - cropW, Math.round(centerX - cropW / 2)))`};
          const sy = ${fixedCropY !== null ? fixedCropY : `Math.max(0, Math.min(270 - cropH, Math.round(centerY - cropH / 2)))`};

          // Draw on sheet
          sctx.drawImage(gameCanvas, sx, sy, cropW, cropH, dx, dy, cropW * scale, cropH * scale);
          sctx.strokeStyle = '#374151';
          sctx.lineWidth = 2;
          sctx.strokeRect(dx, dy, cropW * scale, cropH * scale);

          sctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
          sctx.fillRect(dx + 2, dy + 2, cropW * scale - 4, 24);
          sctx.fillStyle = '#f9fafb';
          sctx.font = 'bold 11px monospace';
          const dummyInfo = dummy ? (dummy.kind === 'legionnaire' || dummy.kind === 'archer' ? \` \${dummy.kind === 'archer' ? 'A' : 'L'}:(hp=\${dummy.hp},st=\${dummy.aiState})\` : \` D:(y=\${dummy.y.toFixed(0)},vy=\${dummy.vy.toFixed(0)})\`) : '';
          const hm = sc.hudLayer ? sc.hudLayer.getMetrics() : null;
          const chestLive = snap.chests ? snap.chests[0] : null;
          const chestInfo = chestLive ? \` [C:\${chestLive.state}:\${chestLive.openProgressTicks} Eyes:\${p.gorgonEyes}/6]\` : '';
          const hudInfo = hm ? \` [Bar:\${hm.currentWidth}px Gst:\${hm.ghostWidth}px Orbs:\${hm.redOrbs}\${chestInfo}]\` : '';
          const arrowsLive = snap.arrows ? snap.arrows.filter((a) => a.active).length : 0;
          const arrowsInfo = arrowsLive > 0 ? \` 🏹Arr:\${arrowsLive}\` : '';
          const waveInfo = snap.wave ? \` [W\${snap.wave.waveIndex + 1}:\${snap.wave.phase} Rem:\${snap.wave.enemiesRemaining} K:\${snap.wave.totalKills}]\` : '';
          const arenaInfo = snap.arena ? \` [Ar:\${snap.arena.active ? 'LK' : 'OP'} a=\${snap.arena.alpha.toFixed(1)}]\` : '';
          const magicInfo = p.magicPhase !== 'none' ? \` [MAG:\${p.magicPhase}:\${p.magicTicks}]\` : '';
          const actionText = p.isDead
            ? 'DEAD'
            : (p.hitstunTicks > 0
              ? \`HURT_HITSTUN:\${p.hitstunTicks}\`
              : (p.hurtInvulTicks > 0
                ? \`HURT_INV:\${p.hurtInvulTicks}\`
                : (p.skidTicks > 0
                  ? \`SKID:\${p.skidTicks}\`
                  : (p.landingTicks > 0
                    ? \`LANDING:\${p.landingTicks}\`
                    : (p.guardPhase !== 'none'
                      ? \`GUARD:\${p.guardPhase}:\${p.guardTicks}\${p.parryActive ? ' PARRY' : ''}\`
                      : \`\${p.attackMove} \${p.attackPhase}:\${p.attackTicks}\`
                    )
                  )
                )
              )
            );
          sctx.fillText(
            \`t=\${t} HP:\${p.hp}\${hudInfo}\${arrowsInfo}\${waveInfo}\${arenaInfo}\${magicInfo} \${actionText} \${isWeaponVisible ? '⚔️CHAIN' : ''}\`,
            dx + 4,
            dy + 12
          );
          sctx.fillStyle = '#9ca3af';
          sctx.fillText(
            \`Kratos(vx=\${p.vx.toFixed(0)},vy=\${p.vy.toFixed(0)}) f=\${sc.player.frame.name} s=(\${sc.player.scaleX.toFixed(2)},\${sc.player.scaleY.toFixed(2)})\${dummyInfo}\`,
            dx + 4,
            dy + 22
          );

          // Draw on single frame canvas for gif
          singleCtx.drawImage(gameCanvas, sx, sy, cropW, cropH, 0, 0, cropW * scale, cropH * scale);
          singleCtx.fillStyle = 'rgba(0, 0, 0, 0.65)';
          singleCtx.fillRect(2, 2, cropW * scale - 4, 18);
          singleCtx.fillStyle = '#f9fafb';
          singleCtx.font = 'bold 11px monospace';
          singleCtx.fillText(\`t=\${t} HP:\${p.hp}\${hudInfo}\${arenaInfo}\${magicInfo} \${actionText} Pose:\${sc.player.frame.name}\`, 4, 14);

          frames.push(single.toDataURL('image/png'));

          logs.push({
            t,
            playerHp: p.hp,
            playerMp: p.mp ?? 100,
            magicPhase: p.magicPhase,
            magicTicks: p.magicTicks,
            cameraX: snap.cameraX !== undefined ? snap.cameraX : (sc.cameras.main.scrollX ?? 0),
            segmentId: snap.segmentId ?? null,
            segmentName: snap.segmentName ?? null,
            legionnaireHp: snap.entities.find((e) => e.kind === 'legionnaire')?.hp ?? null,
            archerHp: snap.entities.find((e) => e.kind === 'archer')?.hp ?? null,
            archerDead: snap.entities.find((e) => e.kind === 'archer')?.isDead ?? null,
            playerRedOrbs: p.redOrbs ?? 0,
            orbsCount: snap.orbs ? snap.orbs.length : 0,
            orbsLive: snap.orbs ? snap.orbs.filter((o) => !o.absorbed).length : 0,
            orbsAbsorbed: snap.orbs ? snap.orbs.filter((o) => o.absorbed).length : 0,
            arrowsCount: snap.arrows ? snap.arrows.length : 0,
            arrowsActive: snap.arrows ? snap.arrows.filter((a) => a.active).length : 0,
            arrowsReflected: snap.arrows ? snap.arrows.filter((a) => a.reflected).length : 0,
            arrowX: snap.arrows && snap.arrows[0] ? snap.arrows[0].x : null,
            arrowVx: snap.arrows && snap.arrows[0] ? snap.arrows[0].vx : null,
            wave: snap.wave ? { ...snap.wave } : null,
            wavePhase: snap.wave ? snap.wave.phase : null,
            waveIndex: snap.wave ? snap.wave.waveIndex : null,
            waveRemaining: snap.wave ? snap.wave.enemiesRemaining : null,
            waveKills: snap.wave ? snap.wave.totalKills : null,
            arena: snap.arena ? { ...snap.arena } : null,
            arenaActive: snap.arena ? snap.arena.active : null,
            arenaAlpha: snap.arena ? snap.arena.alpha : null,
            arenaDissipate: snap.arena ? snap.arena.dissipateTicks : null,
            hurtInvulTicks: p.hurtInvulTicks,
            hitstunTicks: p.hitstunTicks,
            isDead: p.isDead,
            defeatVisible: sc.defeatText ? sc.defeatText.visible : false,
            hud: sc.hudLayer ? sc.hudLayer.getMetrics() : null,
            move: p.attackMove,
            phase: p.attackPhase,
            ticks: p.attackTicks,
            guardPhase: p.guardPhase,
            guardTicks: p.guardTicks,
            parryActive: p.parryActive,
            rollPhase: p.rollPhase,
            poseFrame: sc.player.frame.name,
            weaponVisible: isWeaponVisible,
            playerX: p.x,
            playerVx: p.vx,
            playerY: p.y,
            playerVy: p.vy,
            skidTicks: p.skidTicks,
            landingTicks: p.landingTicks,
            scaleX: sc.player.scaleX,
            scaleY: sc.player.scaleY,
            dummyX: dummy ? dummy.x : null,
            dummyVx: dummy ? dummy.vx : null,
            dummyY: dummy ? dummy.y : null,
            dummyVy: dummy ? dummy.vy : null,
            targetState: dummy ? dummy.aiState : null,
            targetHp: dummy ? dummy.hp : null,
            groundImpact: p.groundImpactTicks,
            groundImpactY: p.groundImpactY,
            dropThroughTicks: p.dropThroughTicks ?? 0,
            grounded: p.grounded,
            chests: snap.chests ? snap.chests.map((c) => ({ ...c })) : [],
            chestState: snap.chests && snap.chests[0] ? snap.chests[0].state : null,
            chestProgress: snap.chests && snap.chests[0] ? snap.chests[0].openProgressTicks : null,
            chestAbsorbed: snap.chests && snap.chests[0] ? snap.chests[0].itemAbsorbed : null,
            featherChestState: snap.chests && snap.chests.find((c) => c.type === 'phoenix_feather') ? snap.chests.find((c) => c.type === 'phoenix_feather').state : null,
            featherChestProgress: snap.chests && snap.chests.find((c) => c.type === 'phoenix_feather') ? snap.chests.find((c) => c.type === 'phoenix_feather').openProgressTicks : null,
            featherChestAbsorbed: snap.chests && snap.chests.find((c) => c.type === 'phoenix_feather') ? snap.chests.find((c) => c.type === 'phoenix_feather').itemAbsorbed : null,
            redChestState: snap.chests && snap.chests.find((c) => c.type === 'red_orbs') ? snap.chests.find((c) => c.type === 'red_orbs').state : null,
            redChestProgress: snap.chests && snap.chests.find((c) => c.type === 'red_orbs') ? snap.chests.find((c) => c.type === 'red_orbs').openProgressTicks : null,
            redChestAbsorbed: snap.chests && snap.chests.find((c) => c.type === 'red_orbs') ? snap.chests.find((c) => c.type === 'red_orbs').itemAbsorbed : null,
            gorgonEyes: p.gorgonEyes ?? 0,
            gorgonUpgrades: p.gorgonUpgrades ?? 0,
            phoenixFeathers: p.phoenixFeathers ?? 0,
            phoenixUpgrades: p.phoenixUpgrades ?? 0,
            redOrbs: p.redOrbs ?? 0,
            weaponLevel: p.weaponLevel ?? 1,
            checkpointActive: snap.checkpoints && snap.checkpoints[0] ? snap.checkpoints[0].active : false,
            activeCheckpointId: snap.activeCheckpointId ?? null,
            maxHp: p.maxHp,
            maxMp: p.maxMp ?? 100,
            hydraHp: snap.entities.find((e) => e.kind === 'hydra')?.hp ?? null,
            hydraState: snap.entities.find((e) => e.kind === 'hydra')?.aiState ?? null,
            hydraDead: snap.entities.find((e) => e.kind === 'hydra')?.isDead ?? null,
            bossHp: snap.bossHp ?? null,
            bossMaxHp: snap.bossMaxHp ?? null,
            bossState: snap.bossState ?? null,
            flowState: snap.flowState ?? null,
            frame: snap.frame,
            titleVisible: sc.flowOverlay ? sc.flowOverlay.isTitleVisible() : false,
            pauseVisible: sc.flowOverlay ? sc.flowOverlay.isPauseVisible() : false,
            victoryVisible: sc.flowOverlay ? sc.flowOverlay.isVictoryVisible() : false,
            gameOverVisible: sc.flowOverlay ? sc.flowOverlay.isGameOverVisible() : false,
            stats: snap.stats ?? null,
            rainDropsCount: sc.vfxLayer ? sc.vfxLayer.getActiveRainDropsCount() : 0,
            lightningActive: sc.vfxLayer ? sc.vfxLayer.isLightningActive() : false,
            lightningAlpha: sc.vfxLayer ? sc.vfxLayer.getLightningAlpha() : 0,
            sparksCount: sc.vfxLayer ? sc.vfxLayer.getActiveSparksCount() : 0,
            parryFlashActive: sc.vfxLayer ? sc.vfxLayer.isParryFlashActive() : false,
            soundStats: sc.soundManager ? sc.soundManager.getStats() : null,
            soundMuted: sc.soundManager ? sc.soundManager.isMuted() : false,
            soundLastPlayed: sc.soundManager ? sc.soundManager.getStats().lastPlayed : null,
            soundTotalPlayed: sc.soundManager ? sc.soundManager.getStats().totalPlayed : 0,
          });
        }

        return {
          mosaicUrl: sheet.toDataURL('image/png'),
          frames,
          logs,
        };
      })()`;

      const result = await evaluate(expr);

      // Save mosaic PNG
      const mosaicPath = path.join(OUTPUT_DIR, `${caseId}_mosaic.png`);
      fs.writeFileSync(mosaicPath, Buffer.from(result.mosaicUrl.replace(/^data:image\/png;base64,/, ''), 'base64'));
      console.log(`Saved mosaic to: ${mosaicPath}`);

      // Save individual frames for ffmpeg
      for (let i = 0; i < result.frames.length; i += 1) {
        const frameData = result.frames[i].replace(/^data:image\/png;base64,/, '');
        const frameFileName = path.join(tempFrameDir, `frame_${String(i + 1).padStart(3, '0')}.png`);
        fs.writeFileSync(frameFileName, Buffer.from(frameData, 'base64'));
      }

      // Generate 60fps GIF using ffmpeg with palettegen/paletteuse
      const gifPath = path.join(OUTPUT_DIR, `${caseId}.gif`);
      const ffmpegCmd = `${FFMPEG_BIN} -y -framerate 60 -i "${tempFrameDir}/frame_%03d.png" -filter_complex "[0:v] split [a][b];[a] palettegen=stats_mode=full [p];[b][p] paletteuse=dither=bayer:bayer_scale=3" "${gifPath}"`;
      try {
        execSync(ffmpegCmd, { stdio: 'ignore' });
        console.log(`Generated 60fps animated GIF to: ${gifPath}`);
      } catch (err) {
        console.error('Failed generating GIF:', err);
      }

      // Cleanup temp frames
      fs.rmSync(tempFrameDir, { recursive: true, force: true });

      return {
        mosaicPath,
        gifPath,
        logs: result.logs,
      };
    }

    // CASE A: Combo J, J, J (light_1 -> light_2 -> light_3)
    // light_1: active 7t, recovery 7t. Press J at t=1, t=11 (during recovery), t=21 (during recovery)
    const caseA = await recordScenarioSequence({
      caseId: 'combo_jjj',
      scenario: 'combat',
      totalSteps: 36,
      getActions: (t) => {
        if (t === 1 || t === 11 || t === 21) return ['light-attack'];
        return [];
      },
      cropW: 160,
      cropH: 100,
    });

    // Check alternation of frames in Case A
    const framesObserved = new Set(caseA.logs.filter((l) => l.phase === 'active').map((l) => l.poseFrame));
    console.log('Case A active frames observed:', Array.from(framesObserved));
    const zeroWeaponFramesDuringCombo = caseA.logs.filter((l) => l.phase !== 'none' && !l.weaponVisible);
    console.log('Case A frames with weapon invisible during combo:', zeroWeaponFramesDuringCombo.length);

    // CASE B: Combo J, J, K (Plume of Prometheus finisher)
    // light_1 at t=1, light_2 at t=11, heavy_attack (Plume) at t=21
    const caseB = await recordScenarioSequence({
      caseId: 'plume_finish',
      scenario: 'combat',
      totalSteps: 40,
      getActions: (t) => {
        if (t === 1 || t === 11) return ['light-attack'];
        if (t === 21) return ['heavy-attack'];
        return [];
      },
      cropW: 170,
      cropH: 105,
    });
    const plumeImpact = caseB.logs.find((l) => l.groundImpact > 0);
    const plumeLaunch = caseB.logs.find((l) => l.dummyVy !== null && l.dummyVy < -100);
    console.log('Case B ground impact event:', plumeImpact ? `t=${plumeImpact.t}` : 'NONE');
    console.log('Case B target launched upwards:', plumeLaunch ? `t=${plumeLaunch.t} vy=${plumeLaunch.dummyVy}` : 'NONE');

    // CASE C: Ascension Launcher -> Jump -> Air J -> Air Heavy Slam
    // K held at t=1..14 (Ascension carries Kratos up) -> air_light_1 at t=21 -> air_heavy_slam at t=29
    const caseC = await recordScenarioSequence({
      caseId: 'ascension_air_dive',
      scenario: 'combat',
      totalSteps: 44,
      getActions: (t) => {
        if (t >= 1 && t <= 14) return ['heavy-attack'];
        if (t === 21) return ['light-attack'];
        if (t === 29) return ['heavy-attack'];
        return [];
      },
      cropW: 160,
      cropH: 110,
    });
    const airJuggle = caseC.logs.find((l) => l.move === 'air_light_1');
    const airSlam = caseC.logs.find((l) => l.move === 'air_heavy_slam');
    console.log('Case C air juggle observed:', airJuggle ? `t=${airJuggle.t}` : 'NONE');
    console.log('Case C air slam dive observed:', airSlam ? `t=${airSlam.t}` : 'NONE');
    if (!airJuggle || !airSlam) {
      console.log('Case C detailed log around t=15..32:');
      for (const l of caseC.logs.slice(14, 34)) {
        console.log(`t=${l.t} move=${l.move} phase=${l.phase}:${l.ticks} P(y=${l.playerY.toFixed(0)},vy=${l.playerVy.toFixed(0)})`);
      }
    }

    // CASE D: Chain Grab (L button)
    // grab at t=1
    const caseD = await recordScenarioSequence({
      caseId: 'chain_grab',
      scenario: 'combat',
      totalSteps: 24,
      getActions: (t) => {
        if (t === 1) return ['grab'];
        return [];
      },
      cropW: 180,
      cropH: 90,
    });
    const grabMove = caseD.logs.find((l) => l.move === 'chain_grab' && l.phase === 'active');
    console.log('Case D chain grab active observed:', grabMove ? `t=${grabMove.t}` : 'NONE');

    // CASE E: Locomotion Dynamics, Weight, Turnaround Skid & Landing Squash (GOW1-LOCO-WEIGHT-01)
    // Run right to max speed -> turnaround left (triggers skidTicks=6 and brakeSkid=2200) -> ground jump -> air jump -> landing squash
    const caseE = await recordScenarioSequence({
      caseId: 'loco_weight_turnaround_landing',
      scenario: 'movement',
      totalSteps: 84,
      getActions: (t) => {
        if (t >= 1 && t <= 14) return ['move-right'];
        if (t >= 15 && t <= 22) return ['move-left'];
        if (t === 23) return ['jump'];
        if (t === 30) return ['jump'];
        return [];
      },
      cropW: 160,
      cropH: 140,
    });
    const skidFrames = caseE.logs.filter((l) => l.skidTicks > 0);
    const landingFrames = caseE.logs.filter((l) => l.landingTicks > 0);
    console.log('Case E skid frames observed:', skidFrames.map((l) => `t=${l.t}(skid=${l.skidTicks},vx=${l.playerVx.toFixed(0)},f=${l.poseFrame})`));
    console.log('Case E landing squash frames observed:', landingFrames.map((l) => `t=${l.t}(land=${l.landingTicks},s=(${l.scaleX.toFixed(2)},${l.scaleY.toFixed(2)}))`));

    // CASE F: Extended Combo String J, J, J, J (light_1 -> light_2 -> light_3 -> light_4) (GOW1-COMBOS-EXT-01)
    const caseF = await recordScenarioSequence({
      caseId: 'combo_jjjj',
      scenario: 'combat',
      totalSteps: 48,
      getActions: (t) => {
        if (t === 1 || t === 11 || t === 21 || t === 33) return ['light-attack'];
        return [];
      },
      cropW: 160,
      cropH: 100,
    });
    const light4Observed = caseF.logs.find((l) => l.move === 'light_4' && l.phase === 'active');
    console.log('Case F light_4 4-hit finisher active observed:', light4Observed ? `t=${light4Observed.t}` : 'NONE');

    // CASE G: Ascension Launcher -> Air Grab / Orion's Harpoon (GOW1-COMBOS-EXT-01)
    const caseG = await recordScenarioSequence({
      caseId: 'ascension_air_harpoon',
      scenario: 'combat',
      totalSteps: 40,
      getActions: (t) => {
        if (t >= 1 && t <= 14) return ['heavy-attack'];
        if (t === 22) return ['grab'];
        return [];
      },
      cropW: 160,
      cropH: 120,
    });
    const airGrabObserved = caseG.logs.find((l) => l.move === 'air_grab' && l.phase === 'active');
    console.log('Case G air_grab (Orion Harpoon) active observed:', airGrabObserved ? `t=${airGrabObserved.t}` : 'NONE');

    // CASE H: Guard & Parry Window (GOW8B-GUARD-01)
    // Hold guard from t=1 to t=14 (covers startup:2, parry:6, active:6), release at t=15 (recovery:4, none at t=19)
    const caseH = await recordScenarioSequence({
      caseId: 'guard_parry_window',
      scenario: 'movement',
      totalSteps: 24,
      getActions: (t) => {
        if (t >= 1 && t <= 14) return ['guard'];
        return [];
      },
      cropW: 160,
      cropH: 100,
    });
    const guardStartup = caseH.logs.filter((l) => l.guardPhase === 'startup');
    const guardParry = caseH.logs.filter((l) => l.parryActive);
    const guardActiveLate = caseH.logs.filter((l) => l.guardPhase === 'active' && !l.parryActive);
    const guardRecovery = caseH.logs.filter((l) => l.guardPhase === 'recovery');
    const guardMovementDuringGuard = caseH.logs.filter((l) => l.guardPhase !== 'none' && l.playerVx !== 0);
    console.log('Case H guard startup frames:', guardStartup.map((l) => `t=${l.t}(ticks=${l.guardTicks})`));
    console.log('Case H parryActive window frames (expected 6):', guardParry.map((l) => `t=${l.t}(ticks=${l.guardTicks})`));
    console.log('Case H guard active (post-parry) frames:', guardActiveLate.map((l) => `t=${l.t}(ticks=${l.guardTicks})`));
    console.log('Case H guard recovery frames (expected 4):', guardRecovery.map((l) => `t=${l.t}(ticks=${l.guardTicks})`));
    console.log('Case H movement violations during guard (expected 0):', guardMovementDuringGuard.length);

    // CASE I: Guard Cancellations (Dodge and Counterattack) (GOW8B-GUARD-01)
    // Guard t=1..5 -> Dodge at t=6 -> Roll t=6..25 -> Guard t=26..30 -> Light Attack at t=31 (Counterattack)
    const caseI = await recordScenarioSequence({
      caseId: 'guard_cancel_actions',
      scenario: 'combat',
      totalSteps: 44,
      getActions: (t) => {
        if (t >= 1 && t <= 5) return ['guard'];
        if (t === 6) return ['dodge'];
        if (t >= 26 && t <= 30) return ['guard'];
        if (t === 31) return ['light-attack'];
        return [];
      },
      cropW: 160,
      cropH: 100,
    });
    const dodgeCancelLog = caseI.logs.find((l) => l.t === 6);
    const counterattackLog = caseI.logs.find((l) => l.t === 31);
    console.log('Case I t=6 Dodge cancel rollPhase:', dodgeCancelLog ? dodgeCancelLog.rollPhase : 'NONE');
    console.log('Case I t=31 Counterattack move/phase:', counterattackLog ? `${counterattackLog.move}:${counterattackLog.phase}` : 'NONE');

    // CASE J: Legionnaire Combat AI (GOW8B-ENEMY1-AI)
    // Scenario: 'legionnaire' (Player at 190, Legionnaire at 240)
    // t=1..22: Approach (Legionnaire stalks towards Kratos)
    // t=23..46: Windup (Telegraph: raised falcata, flaming red eyes)
    // t=45..49: Kratos raises guard / parry window with 'guard' (Q)
    // t=49: Legionnaire slash is deflected by Kratos's Parry -> Legionnaire enters hitstun (32 ticks)
    // t=50..58: Kratos executes Ascension (Launcher) -> Legionnaire launched into juggle (vy = -350)
    // t=85..120: Kratos executes light combo + Plume finisher -> ground impact & defeat (death)
    const caseJ = await recordScenarioSequence({
      caseId: 'legionnaire_combat_ai',
      scenario: 'legionnaire',
      totalSteps: 126,
      getActions: (t) => {
        if (t >= 45 && t <= 49) return ['guard'];
        if (t >= 50 && t <= 58) return ['heavy-attack']; // Ascension launcher
        if (t === 85 || t === 95) return ['light-attack']; // Light combo hits
        if (t === 105) return ['heavy-attack']; // Plume of Prometheus finisher
        return [];
      },
      cropW: 160,
      cropH: 100,
    });
    const approachObserved = caseJ.logs.find((l) => l.targetState === 'approach');
    const windupObserved = caseJ.logs.find((l) => l.targetState === 'windup');
    const parryHitstunObserved = caseJ.logs.find((l) => l.t === 49 && l.targetState === 'hitstun');
    const juggleObserved = caseJ.logs.find((l) => l.targetState === 'juggle');
    const deathObserved = caseJ.logs.find((l) => l.targetState === 'death');

    console.log('Case J Legionnaire approach observed:', approachObserved ? `t=${approachObserved.t}` : 'NONE');
    console.log('Case J Legionnaire windup telegraph observed:', windupObserved ? `t=${windupObserved.t}` : 'NONE');
    console.log('Case J Legionnaire parry deflection observed:', parryHitstunObserved ? `t=${parryHitstunObserved.t}` : 'NONE');
    console.log('Case J Legionnaire ascension juggle observed:', juggleObserved ? `t=${juggleObserved.t}` : 'NONE');
    console.log('Case J Legionnaire death collapse observed:', deathObserved ? `t=${deathObserved.t}` : 'NONE');

    // CASE K: Player Damage & Defeat Response (GOW8B-DAMAGE-01)
    // Scenario: 'legionnaire' (Player at 190, HP 100; Legionnaire at 240, HP 60)
    // - t=1..48: Stalk and telegraph windup
    // - t=49: Direct hit unprotected -> HP drops 100 -> 88, hurtInvulTicks=45, hitstunTicks=14, knockback vx=-140
    // - t=50..89: Post-damage i-frames active (damage evasion)
    // - t=90..104: Guard absorption -> Kratos holds guard (parry expires at t=97), enemy slashes at t=98 (dist 24 <= 32) -> 85% absorbed, residual damage 2 (HP: 88 -> 86)
    // - t=109..110: Lethal strike -> player HP drops to 0 -> isDead=true, controls locked, defeat UI visible
    // - t=111..118: Player remains in defeat state
    // - t=119: Player presses 'R' ('restart') -> Scenario reloads, HP resets to 100, isDead=false, defeat UI hidden
    // - t=120..128: Player is fully mobile and restored
    const caseK = await recordScenarioSequence({
      caseId: 'player_damage_and_defeat',
      scenario: 'legionnaire',
      totalSteps: 128,
      getActions: (t) => {
        const sc = window.__SHELL_SCENE;
        // Test guard mitigation against slash at t=98..104 (post-parry sustained guard)
        if (t === 98) {
          const p = sc.simulation.world.peekEntity('player');
          const enemy = sc.simulation.world.peekTargets()[0];
          if (p && enemy) {
            enemy.x = p.x + 24;
            enemy.facing = -1;
            enemy.aiState = 'slash';
            enemy.aiTicks = 1;
            enemy.attackHits = [];
          }
        }
        if (t >= 90 && t <= 104) return ['guard'];

        // Test lethal hit at t=109
        if (t === 109) {
          const p = sc.simulation.world.peekEntity('player');
          const enemy = sc.simulation.world.peekTargets()[0];
          if (p && enemy) {
            enemy.x = p.x + 24;
            enemy.facing = -1;
            p.hp = 2;
            p.hurtInvulTicks = 0;
            p.guardPhase = 'none';
            enemy.aiState = 'slash';
            enemy.aiTicks = 1;
            enemy.attackHits = [];
          }
        }

        // Test restart action at t=119
        if (t === 119) return ['restart'];

        return [];
      },
      cropW: 160,
      cropH: 100,
    });

    const unprotectedHit = caseK.logs.find((l) => l.t === 49);
    const postHitInvul = caseK.logs.find((l) => l.t === 55);
    const guardMitigation = caseK.logs.find((l) => l.t === 100);
    const defeatLog = caseK.logs.find((l) => l.t === 111);
    const restartLog = caseK.logs.find((l) => l.t === 121);

    console.log('Case K Unprotected hit (expected hp=88, invul=45, stun=14):', unprotectedHit ? `hp=${unprotectedHit.playerHp},invul=${unprotectedHit.hurtInvulTicks},stun=${unprotectedHit.hitstunTicks},vx=${unprotectedHit.playerVx}` : 'NONE');
    console.log('Case K Post-hit i-frames (expected hp=88, invul>0):', postHitInvul ? `hp=${postHitInvul.playerHp},invul=${postHitInvul.hurtInvulTicks}` : 'NONE');
    console.log('Case K Guard absorption (expected hp=86, guard=active):', guardMitigation ? `hp=${guardMitigation.playerHp},grd=${guardMitigation.guardPhase}` : 'NONE');
    console.log('Case K Defeat state (expected hp=0, isDead=true, defeatText=true):', defeatLog ? `hp=${defeatLog.playerHp},dead=${defeatLog.isDead},ui=${defeatLog.defeatVisible}` : 'NONE');
    console.log('Case K Restart response (expected hp=100, isDead=false, defeatText=false):', restartLog ? `hp=${restartLog.playerHp},dead=${restartLog.isDead},ui=${restartLog.defeatVisible}` : 'NONE');

    // CASE L: HUD Health Bar & Ghost Health Presentation (GOW8B-HUD-01)
    // Focused on screen coordinates (0, 0) capturing the top-left Greek stone/bronze medallion and health bar
    // - t=1: Initial full health 100/100 -> barWidth=110px, ghostWidth=110px
    // - t=49: Damage taken (HP drops 100 -> 88) -> live bar drops immediately to 97px (88%)
    // - t=55: Ghost pause window (200ms) -> ghost bar retains 110px while live bar is 97px
    // - t=80: Ghost bar drains smoothly -> ghostWidth drains to 97px
    // - t=90..104: Guard mitigation at t=98 -> HP drops 88 -> 86, live bar updates to 95px
    // - t=109..110: Lethal strike -> HP drops to 0, isDead=true -> live bar immediately 0px
    // - t=116: Ghost bar drains to 0px on death
    // - t=119: Restart action 'restart' -> instant 100% reset: live bar=110px, ghost bar=110px
    const caseL = await recordScenarioSequence({
      caseId: 'hud_health_bar_presentation',
      scenario: 'legionnaire',
      totalSteps: 128,
      cropW: 180,
      cropH: 100,
      fixedCropX: 0,
      fixedCropY: 0,
      getActions: (t) => {
        const sc = window.__SHELL_SCENE;
        // Guard mitigation at t=98..104
        if (t === 98) {
          const p = sc.simulation.world.peekEntity('player');
          const enemy = sc.simulation.world.peekTargets()[0];
          if (p && enemy) {
            enemy.x = p.x + 24;
            enemy.facing = -1;
            enemy.aiState = 'slash';
            enemy.aiTicks = 1;
            enemy.attackHits = [];
          }
        }
        if (t >= 90 && t <= 104) return ['guard'];

        // Lethal hit at t=109
        if (t === 109) {
          const p = sc.simulation.world.peekEntity('player');
          const enemy = sc.simulation.world.peekTargets()[0];
          if (p && enemy) {
            enemy.x = p.x + 24;
            enemy.facing = -1;
            p.hp = 2;
            p.hurtInvulTicks = 0;
            p.guardPhase = 'none';
            enemy.aiState = 'slash';
            enemy.aiTicks = 1;
            enemy.attackHits = [];
          }
        }

        // Restart at t=119
        if (t === 119) return ['restart'];

        return [];
      },
    });

    const hudInit = caseL.logs.find((l) => l.t === 1)?.hud;
    const hudDamageImmediate = caseL.logs.find((l) => l.t === 49)?.hud;
    const hudGhostPause = caseL.logs.find((l) => l.t === 55)?.hud;
    const hudGhostDrained = caseL.logs.find((l) => l.t === 80)?.hud;
    const hudDefeat = caseL.logs.find((l) => l.t === 111)?.hud;
    const hudRestart = caseL.logs.find((l) => l.t === 121)?.hud;

    console.log('Case L HUD full health initial (expected bar=110, ghost=110):', hudInit ? `bar=${hudInit.currentWidth}px,ghost=${hudInit.ghostWidth}px,hp=${hudInit.currentHp}` : 'NONE');
    console.log('Case L HUD damage immediate drop (expected bar=97, ghost=110):', hudDamageImmediate ? `bar=${hudDamageImmediate.currentWidth}px,ghost=${hudDamageImmediate.ghostWidth}px,hp=${hudDamageImmediate.currentHp}` : 'NONE');
    console.log('Case L HUD ghost pause retention (expected ghost > bar):', hudGhostPause ? `bar=${hudGhostPause.currentWidth}px,ghost=${hudGhostPause.ghostWidth}px,timer=${hudGhostPause.ghostPauseTimer}s` : 'NONE');
    console.log('Case L HUD ghost smooth drain (expected ghost ~ 97):', hudGhostDrained ? `bar=${hudGhostDrained.currentWidth}px,ghost=${hudGhostDrained.ghostWidth}px` : 'NONE');
    console.log('Case L HUD defeat empty bar (expected bar=0, dead=true):', hudDefeat ? `bar=${hudDefeat.currentWidth}px,dead=${hudDefeat.isDead}` : 'NONE');
    console.log('Case L HUD restart 100% reset (expected bar=110, ghost=110):', hudRestart ? `bar=${hudRestart.currentWidth}px,ghost=${hudRestart.ghostWidth}px,hp=${hudRestart.currentHp}` : 'NONE');

    // CASE M: Orbs Economy & Combat Recovery (GOW8B-ORBS-01)
    // - t=1..48: Kratos faces Legionnaire, Legionnaire approaches
    // - t=49: Legionnaire strikes Kratos -> HP drops 100 -> 88
    // - t=50: Legionnaire defeated (hp=0, aiState='death', aiTicks=0) -> spawns 4 red orbs & 1 green orb
    // - t=51: Verify 5 orbs spawned (4 red, 1 green) bursting upward with fan velocities
    // - t=52..70: Orbs experience ballistic curve and magnetic acceleration towards Kratos chest (y-26)
    // - t=75..85: Orbs absorbed upon reaching <= 12 px:
    //             Green orb restores +15 HP (88 -> 100)
    //             4 Red orbs grant +5 each (0 -> 20 red orbs)
    //             HUD reflects 100 HP bar and ORBES: 20 text
    const caseM = await recordScenarioSequence({
      caseId: 'orbs_economy_and_healing',
      scenario: 'legionnaire',
      totalSteps: 96,
      cropW: 180,
      cropH: 120,
      getActions: (t) => {
        const sc = window.__SHELL_SCENE;
        if (t === 50) {
          const enemy = sc.simulation.world.peekTargets()[0];
          if (enemy) {
            enemy.hp = 0;
            enemy.aiState = 'death';
            enemy.aiTicks = 0;
          }
        }
        return [];
      },
    });

    const orbInitialLog = caseM.logs.find((l) => l.t === 48);
    const orbDamageLog = caseM.logs.find((l) => l.t === 49);
    const orbSpawnLog = caseM.logs.find((l) => l.t === 51);
    const orbFlightLog = caseM.logs.find((l) => l.t === 60);
    const orbRecoveryLog = caseM.logs.find((l) => l.t === 85);
    const orbFinalLog = caseM.logs.find((l) => l.t === 95);

    console.log('Case M Initial state (expected hp=100, redOrbs=0, orbs=0):', orbInitialLog ? `hp=${orbInitialLog.playerHp},orbs=${orbInitialLog.playerRedOrbs},live=${orbInitialLog.orbsLive}` : 'NONE');
    console.log('Case M Damage before death (expected hp=88):', orbDamageLog ? `hp=${orbDamageLog.playerHp}` : 'NONE');
    console.log('Case M Spawn on enemy death (expected orbs=5, 4 red + 1 green):', orbSpawnLog ? `live=${orbSpawnLog.orbsLive},count=${orbSpawnLog.orbsCount}` : 'NONE');
    console.log('Case M Magnetic flight in progress (expected orbs=5 in flight):', orbFlightLog ? `live=${orbFlightLog.orbsLive},count=${orbFlightLog.orbsCount}` : 'NONE');
    console.log('Case M Absorption & Recovery (expected hp=100, redOrbs=20, orbsLive=0):', orbRecoveryLog ? `hp=${orbRecoveryLog.playerHp},redOrbs=${orbRecoveryLog.playerRedOrbs},live=${orbRecoveryLog.orbsLive},hudHp=${orbRecoveryLog.hud?.currentHp},hudOrbs=${orbRecoveryLog.hud?.redOrbs}` : 'NONE');
    console.log('Case M Settled state (expected hp=100, redOrbs=20):', orbFinalLog ? `hp=${orbFinalLog.playerHp},redOrbs=${orbFinalLog.playerRedOrbs},live=${orbFinalLog.orbsLive}` : 'NONE');

    // CASE N: Undead Archer Combat AI & Projectile Mechanics (GOW8B-ENEMY2-AI)
    // - t=1..24: Archer in preferred distance [110..180], enters 'aim' for 24 ticks (vx=0, telegraph with amethyst flare)
    // - t=25: Archer enters 'shoot' (8 ticks), spawns arrow at (284, 212) with vx = -280 px/s
    // - t=26..46: Arrow travels horizontally towards Kratos
    // - t=43..52: Kratos inputs 'guard' at t=43. At t=47 (parry window tick 5), arrow impacts Kratos
    //             -> ¡PARRY REFLECT! Arrow speed reflected to +420 px/s (1.5x) with reflected=true
    // - t=48..65: Reflected arrow travels back towards Archer
    // - t=66: Reflected arrow strikes Archer -> Archer takes 20 damage (40 -> 20 HP), enters hitstun for 36 ticks
    // - t=74: Archer is defeated (hp=0, aiState='death', aiTicks=0)
    // - t=75: Archer death eclosion -> spawns 3 red orbs + 1 green orb (dropPerArcher)
    // - t=76..115: Orbs accelerate magnéticamente towards Kratos, absorbed (+15 HP, +15 Red Orbs)
    // - t=126: Settled state
    const caseN = await recordScenarioSequence({
      caseId: 'archer_combat_ai',
      scenario: 'archer',
      totalSteps: 126,
      cropW: 200,
      cropH: 120,
      getActions: (t) => {
        const sc = window.__SHELL_SCENE;
        // Kratos raises guard at t=43 to parry the incoming arrow at t=47 (in ticks 3..8 parry window)
        if (t >= 43 && t <= 52) return ['guard'];

        // Finish off archer at t=74
        if (t === 74) {
          const enemy = sc.simulation.world.peekTargets()[0];
          if (enemy) {
            enemy.hp = 0;
            enemy.aiState = 'death';
            enemy.aiTicks = 0;
          }
        }
        return [];
      },
    });

    const archerAimLog = caseN.logs.find((l) => l.t === 15);
    const archerShootLog = caseN.logs.find((l) => l.t === 25);
    const arrowInFlightLog = caseN.logs.find((l) => l.t === 36);
    const parryReflectLog = caseN.logs.find((l) => l.t === 48);
    const archerStunnedLog = caseN.logs.find((l) => l.t === 68);
    const archerDeathLog = caseN.logs.find((l) => l.t === 76);
    const archerOrbsAbsorbedLog = caseN.logs.find((l) => l.t === 120);

    console.log('Case N Archer aim telegraph (expected state=aim, vx=0):', archerAimLog ? `st=${archerAimLog.targetState},vx=${archerAimLog.dummyVx}` : 'NONE');
    console.log('Case N Archer shoot & arrow spawn (expected state=shoot, arrows=1, vx=-280):', archerShootLog ? `st=${archerShootLog.targetState},arr=${archerShootLog.arrowsActive},arrVx=${archerShootLog.arrowVx}` : 'NONE');
    console.log('Case N Arrow in flight towards Kratos (expected arrows=1, vx=-280):', arrowInFlightLog ? `arr=${arrowInFlightLog.arrowsActive},x=${arrowInFlightLog.arrowX?.toFixed(1)},vx=${arrowInFlightLog.arrowVx}` : 'NONE');
    console.log('Case N Parry reflect event (expected reflected=1, vx=+420, kratosHp=100):', parryReflectLog ? `ref=${parryReflectLog.arrowsReflected},arrVx=${parryReflectLog.arrowVx},hp=${parryReflectLog.playerHp}` : 'NONE');
    console.log('Case N Reflected arrow hit on Archer (expected hp=20, st=hitstun):', archerStunnedLog ? `hp=${archerStunnedLog.targetHp},st=${archerStunnedLog.targetState}` : 'NONE');
    console.log('Case N Archer death & orb spawn (expected orbs=4, 3 red + 1 green):', archerDeathLog ? `orbs=${archerDeathLog.orbsLive},count=${archerDeathLog.orbsCount}` : 'NONE');
    console.log('Case N Settled state & orb absorption (expected redOrbs=15, liveOrbs=0):', archerOrbsAbsorbedLog ? `redOrbs=${archerOrbsAbsorbedLog.playerRedOrbs},live=${archerOrbsAbsorbedLog.orbsLive}` : 'NONE');

    // CASE O: Combat Waves Flow & Pacing (GOW8B-WAVES-01)
    // - t=1..16: Wave 1 (Vanguard) spawns (2 Legionnaires at x=320, 380).
    // - t=17..24: Wave 1 combat phase (phase=combat, enemiesRemaining=2).
    // - t=25: Wave 1 defeated (hp=0, aiState='death').
    // - t=26..85: Pacing pause (phase=cleared, transitionDelayTicks=60, totalKills=2).
    // - t=86..112: Wave 2 (Mixed Force) spawns (2 Legionnaires at x=120, 340 + 1 Archer at x=430).
    // - t=113..119: Wave 2 combat phase (phase=combat, enemiesRemaining=3).
    // - t=120: Wave 2 defeated (hp=0, aiState='death').
    // - t=121..144: Encounter victory (phase=complete, totalKills=5).
    const caseO = await recordScenarioSequence({
      caseId: 'waves_flow_and_pacing',
      scenario: 'waves',
      totalSteps: 144,
      cropW: 260,
      cropH: 130,
      fixedCropX: 110,
      fixedCropY: 125,
      getActions: (t) => {
        const sc = window.__SHELL_SCENE;
        // Defeat wave 1 at t=25
        if (t === 25) {
          const targets = sc.simulation.world.peekTargets();
          for (const enemy of targets) {
            if (enemy.aiState !== 'death') {
              enemy.hp = 0;
              enemy.aiState = 'death';
              enemy.aiTicks = 0;
            }
          }
        }

        // Defeat wave 2 at t=120
        if (t === 120) {
          const targets = sc.simulation.world.peekTargets();
          for (const enemy of targets) {
            if (enemy.aiState !== 'death') {
              enemy.hp = 0;
              enemy.aiState = 'death';
              enemy.aiTicks = 0;
            }
          }
        }
        return [];
      },
    });

    const w1SpawnLog = caseO.logs.find((l) => l.t === 5);
    const w1CombatLog = caseO.logs.find((l) => l.t === 18);
    const w1ClearedLog = caseO.logs.find((l) => l.t === 30);
    const w2SpawnLog = caseO.logs.find((l) => l.t === 95);
    const w2CombatLog = caseO.logs.find((l) => l.t === 114);
    const wCompleteLog = caseO.logs.find((l) => l.t === 125);
    const wFinalLog = caseO.logs.find((l) => l.t === 140);

    console.log('Case O Wave 1 spawning phase (expected w=0, ph=spawning, rem=2):', w1SpawnLog ? `w=${w1SpawnLog.waveIndex},ph=${w1SpawnLog.wavePhase},rem=${w1SpawnLog.waveRemaining}` : 'NONE');
    console.log('Case O Wave 1 combat phase (expected w=0, ph=combat, rem=2):', w1CombatLog ? `w=${w1CombatLog.waveIndex},ph=${w1CombatLog.wavePhase},rem=${w1CombatLog.waveRemaining}` : 'NONE');
    console.log('Case O Wave 1 cleared pause (expected w=0, ph=cleared, kills=2):', w1ClearedLog ? `w=${w1ClearedLog.waveIndex},ph=${w1ClearedLog.wavePhase},kills=${w1ClearedLog.waveKills}` : 'NONE');
    console.log('Case O Wave 2 mixed spawn phase (expected w=1, ph=spawning, rem=3):', w2SpawnLog ? `w=${w2SpawnLog.waveIndex},ph=${w2SpawnLog.wavePhase},rem=${w2SpawnLog.waveRemaining}` : 'NONE');
    console.log('Case O Wave 2 combat phase (expected w=1, ph=combat, rem=3):', w2CombatLog ? `w=${w2CombatLog.waveIndex},ph=${w2CombatLog.wavePhase},rem=${w2CombatLog.waveRemaining}` : 'NONE');
    console.log('Case O Encounter complete (expected ph=complete, kills=5):', wCompleteLog ? `ph=${wCompleteLog.wavePhase},kills=${wCompleteLog.waveKills}` : 'NONE');
    console.log('Case O Settled complete state (expected ph=complete, kills=5):', wFinalLog ? `ph=${wFinalLog.wavePhase},kills=${wFinalLog.waveKills}` : 'NONE');

    // CASE P: Arena Confinement & Magical Barriers (GOW8B-ARENA-01)
    // - Scenario: 'arena' (Oleadas + Ares blood barriers at minX=70, maxX=410)
    // - Player starts at x=120
    // - t=1..16: Kratos moves left against left barrier. Clamped at x >= 86 px (70 + 16). vx = 0.
    // - t=18: Wave 1 defeated (hp=0, aiState='death').
    // - t=19: Position Kratos at x=375 for right barrier testing.
    // - t=20..35: Kratos moves right into right barrier (410 - 16 = 394).
    //             Clamped at x <= 394 px. vx = 0.
    // - t=36: Wave 2 defeated / encounter completed -> wave.phase === 'complete'.
    // - t=37..66: Arena barrier dissipation (dissipateTicks counts 30 -> 0, alpha fades 0.8 -> 0).
    // - t=67: Barrier disabled (active = false, alpha = 0). Full ship deck opened.
    // - t=68..96: Kratos continues moving right unimpeded, passing beyond x > 410 px (reaching ~455 px).
    const caseP = await recordScenarioSequence({
      caseId: 'arena_confinement_and_barriers',
      scenario: 'arena',
      totalSteps: 96,
      cropW: 280,
      cropH: 140,
      fixedCropX: 100,
      fixedCropY: 110,
      getActions: (t) => {
        const sc = window.__SHELL_SCENE;
        const p = sc.simulation.world.peekEntity('player');

        // t=1..16: Move left against left barrier
        if (t >= 1 && t <= 16) {
          return ['move-left'];
        }

        // t=18: Defeat wave 1
        if (t === 18) {
          const targets = sc.simulation.world.peekTargets();
          for (const enemy of targets) {
            if (enemy.aiState !== 'death') {
              enemy.hp = 0;
              enemy.aiState = 'death';
              enemy.aiTicks = 0;
            }
          }
        }

        // t=19: Position Kratos near right barrier to test right confinement
        if (t === 19 && p) {
          p.x = 375;
          p.vx = 0;
        }

        // t=20..35: Move right against right barrier
        if (t >= 20 && t <= 35) {
          return ['move-right'];
        }

        // t=36: Complete encounter
        if (t === 36) {
          const targets = sc.simulation.world.peekTargets();
          for (const enemy of targets) {
            if (enemy.aiState !== 'death') {
              enemy.hp = 0;
              enemy.aiState = 'death';
              enemy.aiTicks = 0;
            }
          }
          sc.simulation.world.completeWaveEncounter();
        }

        // t=37..96: Keep moving right through dissipation and after liberation
        if (t >= 37 && t <= 96) {
          return ['move-right'];
        }

        return [];
      },
    });

    const leftBarrierLog = caseP.logs.find((l) => l.t === 16);
    const rightBarrierLog = caseP.logs.find((l) => l.t === 35);
    const dissipateStartLog = caseP.logs.find((l) => l.t === 36);
    const dissipateMidLog = caseP.logs.find((l) => l.t === 51);
    const dissipateEndLog = caseP.logs.find((l) => l.t === 67);
    const liberatedLog = caseP.logs.find((l) => l.t === 95);

    console.log('Case P Left barrier confinement (expected x >= 86, clamped at 118.5, vx=0):', leftBarrierLog ? `x=${leftBarrierLog.playerX.toFixed(1)},vx=${leftBarrierLog.playerVx},act=${leftBarrierLog.arenaActive}` : 'NONE');
    console.log('Case P Right barrier confinement (expected x <= 394, clamped at 361.5, vx=0):', rightBarrierLog ? `x=${rightBarrierLog.playerX.toFixed(1)},vx=${rightBarrierLog.playerVx},act=${rightBarrierLog.arenaActive}` : 'NONE');
    console.log('Case P Dissipation start (expected phase=complete, dTicks=30, alpha=0.8):', dissipateStartLog ? `phase=${dissipateStartLog.wavePhase},dTicks=${dissipateStartLog.arenaDissipate},a=${dissipateStartLog.arenaAlpha?.toFixed(2)}` : 'NONE');
    console.log('Case P Dissipation midpoint (expected dTicks ~15, alpha ~0.4):', dissipateMidLog ? `dTicks=${dissipateMidLog.arenaDissipate},a=${dissipateMidLog.arenaAlpha?.toFixed(2)}` : 'NONE');
    console.log('Case P Barriers disabled post-dissipation (expected active=false, alpha=0):', dissipateEndLog ? `act=${dissipateEndLog.arenaActive},a=${dissipateEndLog.arenaAlpha?.toFixed(2)}` : 'NONE');
    console.log('Case P Player liberated advancing past barrier (expected x > 410.0):', liberatedLog ? `x=${liberatedLog.playerX.toFixed(1)},vx=${liberatedLog.playerVx},act=${liberatedLog.arenaActive}` : 'NONE');

    // CASE Q: Poseidon's Rage Magic & Mana Economy (GOW8B-MAGIC-01)
    // - Scenario: 'magic' (Kratos at x=200, Legionnaire at x=245, Archer at x=150)
    // - t=1: Initial state (mp=100, Legionnaire hp=60, Archer hp=40)
    // - t=2: Kratos invokes 'magic' -> MP drops 100 -> 65 (-35 MP cost). magicPhase enters 'startup'.
    // - t=10: Startup completes (8 ticks), magicPhase enters 'active' (40 ticks).
    //         AoE storm strikes every 8 ticks in radius 90 px, hitting both enemies simultaneously.
    // - t=43: 5th electrical hit lands -> Archer takes cumulative 40 damage and dies (hp=0, aiState='death').
    //         Archer drops 3 red, 1 green, 1 blue orb.
    // - t=44..62: Blue orb is magnetized towards Kratos.
    // - t=63..64: Blue orb absorbed -> restores +20 MP (65 -> 85 MP).
    // - t=62: Spell recovery finishes (12 ticks), magicPhase returns to 'none'.
    // - t=68: Force player.mp = 20 (< 35 cost).
    // - t=69: Kratos inputs 'magic' with insufficient mana -> invocation blocked, mp remains 20, magicPhase remains 'none'.
    // - t=84: Settled state.
    const caseQ = await recordScenarioSequence({
      caseId: 'poseidons_rage_magic_aoe',
      scenario: 'magic',
      totalSteps: 84,
      cropW: 260,
      cropH: 130,
      fixedCropX: 80,
      fixedCropY: 130,
      getActions: (t) => {
        const sc = window.__SHELL_SCENE;
        const p = sc.simulation.world.peekEntity('player');

        // t=2: Invoke Poseidon's Rage
        if (t === 2) {
          return ['magic'];
        }

        // t=68: Simulate low mana condition (< 35) to test insufficiency guard
        if (t === 68 && p) {
          p.mp = 20;
        }

        // t=69: Attempt to invoke magic with insufficient MP (20 < 35)
        if (t === 69) {
          return ['magic'];
        }

        return [];
      },
    });

    const magicInitLog = caseQ.logs.find((l) => l.t === 1);
    const magicCastLog = caseQ.logs.find((l) => l.t === 2);
    const magicActiveLog = caseQ.logs.find((l) => l.t === 10);
    const magicAoeDamageLog = caseQ.logs.find((l) => l.t === 43);
    const blueOrbAbsorbedLog = caseQ.logs.find((l) => l.t === 64);
    const insufficientMpLog = caseQ.logs.find((l) => l.t === 70);

    console.log('Case Q Magic initial state (expected mp=100, phase=none):', magicInitLog ? `mp=${magicInitLog.playerMp},ph=${magicInitLog.magicPhase}` : 'NONE');
    console.log('Case Q Magic cast & MP deduction (expected mp=65, phase=startup):', magicCastLog ? `mp=${magicCastLog.playerMp},ph=${magicCastLog.magicPhase}` : 'NONE');
    console.log('Case Q Magic storm active (expected phase=active):', magicActiveLog ? `ph=${magicActiveLog.magicPhase},ticks=${magicActiveLog.magicTicks}` : 'NONE');
    console.log('Case Q Multi-hit AoE damage (expected L hp=20, A dead, orbs>=1):', magicAoeDamageLog ? `legHp=${magicAoeDamageLog.legionnaireHp},arcHp=${magicAoeDamageLog.archerHp},arcDead=${magicAoeDamageLog.archerDead},orbsLive=${magicAoeDamageLog.orbsLive}` : 'NONE');
    console.log('Case Q Blue orb mana recovery (expected mp=85):', blueOrbAbsorbedLog ? `mp=${blueOrbAbsorbedLog.playerMp},hudMp=${blueOrbAbsorbedLog.hud?.currentMp}` : 'NONE');
    console.log('Case Q Insufficient MP blocked (expected mp=20, phase=none):', insufficientMpLog ? `mp=${insufficientMpLog.playerMp},ph=${insufficientMpLog.magicPhase}` : 'NONE');

    // CASE R: Level 1 Map Structure, Segments and Camera Scroll (GOW8B-MAP-01)
    // - Scenario: 'level1' (Continuous deck of 1440 px: Popa [0..480], Arena [480..960], Proa [960..1440])
    // - t=1: Initial state at Popa (x=100, cameraX=0, segmentName='Popa').
    // - t=15: Position Kratos at x=300 (Popa) -> camera starts scrolling (cameraX > 0).
    // - t=25: Kratos enters Segment 2 at x=650 -> arena triggers (active=true), camera locks at scrollX=480.
    // - t=26..40: Confinement in arena (barriers at x=550 and x=890).
    // - t=45: Wave victory / complete encounter -> dissipation begins (30 ticks).
    // - t=75: Barriers completely dissipated (active=false) -> camera unlocks.
    // - t=80: Kratos advances to Proa at x=1250 (>1200) -> camera reaches rightmost scroll (cameraX >= 900).
    // - t=90: Settled state at Proa.
    const caseR = await recordScenarioSequence({
      caseId: 'map_scroll_and_segments',
      scenario: 'level1',
      totalSteps: 90,
      cropW: 240,
      cropH: 140,
      fixedCropX: 0,
      fixedCropY: 60,
      getActions: (t) => {
        const sc = window.__SHELL_SCENE;
        const p = sc.simulation.world.peekEntity('player');

        // t=15: Position Kratos at x=300 in Popa to test camera deadzone trigger
        if (t === 15 && p) {
          p.x = 300;
          p.vx = 0;
        }

        // t=25: Position Kratos at x=650 in Segment 2 to trigger arena
        if (t === 25 && p) {
          p.x = 650;
          p.vx = 0;
        }

        // t=45: Complete encounter to trigger barrier dissipation
        if (t === 45) {
          sc.simulation.world.completeWaveEncounter();
        }

        // t=80: Position Kratos at Proa (x=1250) to test forward scroll and right clamp
        if (t === 80 && p) {
          p.x = 1250;
          p.vx = 0;
        }

        // Movement pulses
        if ((t >= 15 && t <= 20) || (t >= 26 && t <= 35) || (t >= 81 && t <= 88)) {
          return ['move-right'];
        }

        return [];
      },
    });

    const mapInitLog = caseR.logs.find((l) => l.t === 1);
    const popaScrollLog = caseR.logs.find((l) => l.t === 16);
    const arenaLockLog = caseR.logs.find((l) => l.t === 26);
    const dissipateStartLogR = caseR.logs.find((l) => l.t === 46);
    const arenaUnlockLog = caseR.logs.find((l) => l.t === 76);
    const proaScrollLog = caseR.logs.find((l) => l.t === 85);

    console.log('Case R Initial state at Popa (expected x=100, camX=0, seg=Popa):', mapInitLog ? `x=${mapInitLog.playerX.toFixed(1)},camX=${mapInitLog.cameraX.toFixed(1)},seg=${mapInitLog.segmentName}` : 'NONE');
    console.log('Case R Popa camera scroll initiated (expected x~300, camX>0, seg=Popa):', popaScrollLog ? `x=${popaScrollLog.playerX.toFixed(1)},camX=${popaScrollLog.cameraX.toFixed(1)},seg=${popaScrollLog.segmentName}` : 'NONE');
    console.log('Case R Segment 2 arena trigger & camera lock (expected camX=480, arena=true):', arenaLockLog ? `x=${arenaLockLog.playerX.toFixed(1)},camX=${arenaLockLog.cameraX.toFixed(1)},act=${arenaLockLog.arenaActive}` : 'NONE');
    console.log('Case R Arena dissipation initiated (expected dTicks=29, act=true):', dissipateStartLogR ? `act=${dissipateStartLogR.arenaActive},dTicks=${dissipateStartLogR.arenaDissipate}` : 'NONE');
    console.log('Case R Arena unlocked post-dissipation (expected act=false):', arenaUnlockLog ? `act=${arenaUnlockLog.arenaActive},camX=${arenaUnlockLog.cameraX.toFixed(1)}` : 'NONE');
    console.log('Case R Proa advance and rightmost camera scroll (expected x>1200, camX>=900, seg=Proa):', proaScrollLog ? `x=${proaScrollLog.playerX.toFixed(1)},camX=${proaScrollLog.cameraX.toFixed(1)},seg=${proaScrollLog.segmentName}` : 'NONE');

    // CASE S: Level Platforming, Verticality, Drop-Through and Elevated Combat (GOW8B-PLATFORM-01)
    // - Scenario: 'level1'
    // - t=1: Kratos at Popa (x=240, y=262).
    // - t=2: Jump towards Popa crate (x1=200, x2=290, yTop=226).
    // - t=39: Firm landing on Popa crate (y=226.0, vy=0, grounded=true).
    // - t=41: Drop-through input ['move-down', 'jump'] -> dropThroughTicks=14, grounded=false, vy>0.
    // - t=53: Soft landing back on base deck (y=262.0, vy=0, grounded=true).
    // - t=60: Position Kratos at Proa beneath crow's nest beam (x=1140, y=262).
    // - t=61: Ground jump 1 (vy=-363.3).
    // - t=78: Coordinated air jump 2 (jumps=2, reaching peak above y=138).
    // - t=108: Firm landing on crow's nest beam (y=138.0, vy=0, grounded=true).
    // - t=109..135: Plume of Prometheus combo on elevated beam:
    //   t=130: plume_of_prometheus active.
    //   t=135: Elevated archer defeated on beam (hp=0, aiState='death').
    //   t=143: Ground impact shockwave collides on beam surface (groundImpactY=138).
    const caseS = await recordScenarioSequence({
      caseId: 'platforming_verticality_and_drop',
      scenario: 'level1',
      totalSteps: 150,
      cropW: 240,
      cropH: 140,
      fixedCropX: 0,
      fixedCropY: 50,
      getActions: (t) => {
        const sc = window.__SHELL_SCENE;
        const p = sc.simulation.world.peekEntity('player');

        // t=1: Place at Popa crate base
        if (t === 1 && p) {
          p.x = 240;
          p.y = 262;
          p.vx = 0;
          p.vy = 0;
        }

        // t=60: Position at Proa under mast
        if (t === 60 && p) {
          p.x = 1140;
          p.y = 262;
          p.vx = 0;
          p.vy = 0;
        }

        // t=2: Jump to Popa crate
        if (t === 2) return ['jump'];
        // t=41: Drop through from crate
        if (t === 41) return ['move-down', 'jump'];
        // t=61: Ground jump 1
        if (t === 61) return ['jump'];
        // t=78: Air jump 2
        if (t === 78) return ['jump'];
        // t=109..129: Attack combo on crow's nest beam
        if (t === 109 || t === 119) return ['light-attack'];
        if (t === 129) return ['heavy-attack'];

        return [];
      },
    });

    const crateLandLog = caseS.logs.find((l) => l.t === 39);
    const dropThroughLog = caseS.logs.find((l) => l.t === 41);
    const deckLandLog = caseS.logs.find((l) => l.t === 53);
    const beamLandLog = caseS.logs.find((l) => l.t === 108);
    const beamKillLog = caseS.logs.find((l) => l.t === 135);
    const beamImpactLog = caseS.logs.find((l) => l.t === 143);

    console.log('Case S Popa crate landing (expected y=226, grounded=true):', crateLandLog ? `y=${crateLandLog.playerY.toFixed(1)},grd=${crateLandLog.grounded},vy=${crateLandLog.playerVy.toFixed(1)}` : 'NONE');
    console.log('Case S Drop-through initiation (expected drop>0, grounded=false, vy>0):', dropThroughLog ? `drop=${dropThroughLog.dropThroughTicks},grd=${dropThroughLog.grounded},vy=${dropThroughLog.playerVy.toFixed(1)}` : 'NONE');
    console.log('Case S Deck landing after drop (expected y=262, grounded=true):', deckLandLog ? `y=${deckLandLog.playerY.toFixed(1)},grd=${deckLandLog.grounded},vy=${deckLandLog.playerVy.toFixed(1)}` : 'NONE');
    console.log('Case S Crow nest beam landing (expected y=138, grounded=true):', beamLandLog ? `y=${beamLandLog.playerY.toFixed(1)},grd=${beamLandLog.grounded},vy=${beamLandLog.playerVy.toFixed(1)}` : 'NONE');
    console.log('Case S Elevated archer defeat on beam (expected hp=0, state=death):', beamKillLog ? `hp=${beamKillLog.targetHp},st=${beamKillLog.targetState}` : 'NONE');
    console.log('Case S Beam shockwave impact (expected impactY=138, impact>0):', beamImpactLog ? `impY=${beamImpactLog.groundImpactY},impTicks=${beamImpactLog.groundImpact}` : 'NONE');

    // CASE T: Gorgon Eye Stone Chest, Collection & Health Bar Expansion (GOW8B-PICK-01)
    // - Scenario: 'chest' (Kratos at x=160, Stone Chest at x=190, y=262).
    // - t=1: Kratos approached into interaction range (x=168, distance=22 px <= 28 px).
    // - t=1..24: Kratos presses/holds 'context-action' (E).
    //   - Chest state is 'opening' throughout ticks 1..24 with openProgressTicks incrementing 1..24.
    //   - Kratos is firmly anchored in opening action (vx = 0).
    // - t=25: Chest completes opening ('open'), Eye of Gorgon rises and is absorbed (itemAbsorbed = true, gorgonEyes = 1).
    // - t=30: Simulates gaining 5 more Gorgon Eyes to complete the 6th eye upgrade:
    //   - maxHp expands permanently (+20 HP: 100 -> 120 HP).
    //   - hp restored fully: 120/120 HP.
    //   - gorgonUpgrades = 1, gorgonEyes resets to 0.
    // - t=35..60: HUD metrics verify dynamic health bar expansion:
    //   - maxHp === 120, currentHp === 120.
    //   - currentWidth === 132 (expanded from 110 px).
    //   - 5th segment notch active at x = barX + 110 px.
    const caseT = await recordScenarioSequence({
      caseId: 'gorgon_eye_chest_and_health_upgrade',
      scenario: 'chest',
      totalSteps: 60,
      cropW: 240,
      cropH: 140,
      fixedCropX: 60,
      fixedCropY: 140,
      getActions: (t) => {
        const sc = window.__SHELL_SCENE;
        const p = sc.simulation.world.peekEntity('player');

        // t=1: Approach into interaction range (x=168, chest at x=190, dx=22 <= 28)
        if (t === 1 && p) {
          p.x = 168;
          p.y = 262;
          p.vx = 0;
          p.vy = 0;
        }

        // t=1..24: Opening action (E)
        if (t >= 1 && t <= 24) {
          return ['context-action'];
        }

        // t=30: Simulate collecting 5 remaining eyes to trigger the 6th eye upgrade
        if (t === 30 && p) {
          for (let i = 0; i < 5; i += 1) {
            sc.simulation.world.collectGorgonEye(p);
          }
        }

        return [];
      },
    });

    const chestStartLog = caseT.logs.find((l) => l.t === 1);
    const chestMidLog = caseT.logs.find((l) => l.t === 12);
    const chestLastOpeningLog = caseT.logs.find((l) => l.t === 24);
    const chestOpenCompleteLog = caseT.logs.find((l) => l.t === 25);
    const healthUpgradeLog = caseT.logs.find((l) => l.t === 35);
    const finalHudLog = caseT.logs.find((l) => l.t === 60);

    console.log('Case T Chest opening initiated (expected state=opening, prog=1, vx=0):', chestStartLog ? `state=${chestStartLog.chestState},prog=${chestStartLog.chestProgress},vx=${chestStartLog.playerVx.toFixed(1)}` : 'NONE');
    console.log('Case T Chest opening mid-progress (expected state=opening, prog=12, vx=0):', chestMidLog ? `state=${chestMidLog.chestState},prog=${chestMidLog.chestProgress},vx=${chestMidLog.playerVx.toFixed(1)}` : 'NONE');
    console.log('Case T Chest opening final tick (expected state=opening, prog=24, vx=0):', chestLastOpeningLog ? `state=${chestLastOpeningLog.chestState},prog=${chestLastOpeningLog.chestProgress},vx=${chestLastOpeningLog.playerVx.toFixed(1)}` : 'NONE');
    console.log('Case T Chest fully open & eye absorbed (expected state=open, absorbed=true, eyes=1):', chestOpenCompleteLog ? `state=${chestOpenCompleteLog.chestState},abs=${chestOpenCompleteLog.chestAbsorbed},eyes=${chestOpenCompleteLog.gorgonEyes}` : 'NONE');
    console.log('Case T 6th Gorgon Eye health upgrade (expected maxHp=120, hp=120, upgr=1, eyes=0):', healthUpgradeLog ? `maxHp=${healthUpgradeLog.maxHp},hp=${healthUpgradeLog.playerHp},upgr=${healthUpgradeLog.gorgonUpgrades},eyes=${healthUpgradeLog.gorgonEyes}` : 'NONE');
    console.log('Case T HUD expanded health bar metrics (expected maxHp=120, width=132):', finalHudLog && finalHudLog.hud ? `maxHp=${finalHudLog.hud.maxHp},currentHp=${finalHudLog.hud.currentHp},width=${finalHudLog.hud.currentWidth}` : 'NONE');

    if (!chestStartLog || chestStartLog.chestState !== 'opening' || chestStartLog.chestProgress !== 1) {
      throw new Error(`Case T failure: chestStartLog invalid: ${JSON.stringify(chestStartLog)}`);
    }
    if (!chestLastOpeningLog || chestLastOpeningLog.chestState !== 'opening' || chestLastOpeningLog.chestProgress !== 24) {
      throw new Error(`Case T failure: chestLastOpeningLog invalid: ${JSON.stringify(chestLastOpeningLog)}`);
    }
    if (!chestOpenCompleteLog || chestOpenCompleteLog.chestState !== 'open' || !chestOpenCompleteLog.chestAbsorbed || chestOpenCompleteLog.gorgonEyes !== 1) {
      throw new Error(`Case T failure: chestOpenCompleteLog invalid: ${JSON.stringify(chestOpenCompleteLog)}`);
    }
    if (!healthUpgradeLog || healthUpgradeLog.maxHp !== 120 || healthUpgradeLog.playerHp !== 120 || healthUpgradeLog.gorgonUpgrades !== 1) {
      throw new Error(`Case T failure: healthUpgradeLog invalid: ${JSON.stringify(healthUpgradeLog)}`);
    }
    if (!finalHudLog || !finalHudLog.hud || finalHudLog.hud.maxHp !== 120 || finalHudLog.hud.currentHp !== 120 || finalHudLog.hud.currentWidth !== 132) {
      throw new Error(`Case T failure: finalHudLog invalid: ${JSON.stringify(finalHudLog)}`);
    }

    // CASE U: Phoenix Feather Stone Chest, Collection & Mana Bar Expansion (GOW8B-PICK-02)
    // - Scenario: 'chest' (Kratos at x=160, Phoenix Feather Stone Chest at x=300, y=262).
    // - t=1: Kratos approached into interaction range of Phoenix Feather Chest (x=278, distance=22 px <= 28 px).
    // - t=1..24: Kratos presses/holds 'context-action' (E).
    //   - Feather chest state is 'opening' throughout ticks 1..24 with openProgressTicks incrementing 1..24.
    //   - Kratos is firmly anchored in opening action (vx = 0).
    // - t=25: Chest completes opening ('open'), Phoenix Feather rises and is absorbed (itemAbsorbed = true, phoenixFeathers = 1).
    // - t=30: Simulates gaining 5 more Phoenix Feathers to complete the 6th feather upgrade:
    //   - maxMp expands permanently (+20 MP: 100 -> 120 MP).
    //   - mp restored fully: 120/120 MP.
    //   - phoenixUpgrades = 1, phoenixFeathers resets to 0.
    // - t=35..60: HUD metrics verify dynamic mana bar expansion:
    //   - maxMp === 120, currentMp === 120.
    //   - manaWidth === 96 (expanded from 80 px).
    const caseU = await recordScenarioSequence({
      caseId: 'phoenix_feather_chest_and_mana_upgrade',
      scenario: 'chest',
      totalSteps: 60,
      cropW: 240,
      cropH: 140,
      fixedCropX: 160,
      fixedCropY: 140,
      getActions: (t) => {
        const sc = window.__SHELL_SCENE;
        const p = sc.simulation.world.peekEntity('player');

        // t=1: Approach into interaction range of feather chest (x=278, chest at x=300, dx=22 <= 28)
        if (t === 1 && p) {
          p.x = 278;
          p.y = 262;
          p.vx = 0;
          p.vy = 0;
        }

        // t=1..24: Opening action (E)
        if (t >= 1 && t <= 24) {
          return ['context-action'];
        }

        // t=30: Simulate collecting 5 remaining feathers to trigger the 6th feather upgrade
        if (t === 30 && p) {
          for (let i = 0; i < 5; i += 1) {
            sc.simulation.world.collectPhoenixFeather(p);
          }
        }

        return [];
      },
    });

    const featherStartLog = caseU.logs.find((l) => l.t === 1);
    const featherMidLog = caseU.logs.find((l) => l.t === 12);
    const featherLastOpeningLog = caseU.logs.find((l) => l.t === 24);
    const featherOpenCompleteLog = caseU.logs.find((l) => l.t === 25);
    const manaUpgradeLog = caseU.logs.find((l) => l.t === 35);
    const finalManaHudLog = caseU.logs.find((l) => l.t === 60);

    console.log('Case U Feather chest opening initiated (expected state=opening, prog=1, vx=0):', featherStartLog ? `state=${featherStartLog.featherChestState},prog=${featherStartLog.featherChestProgress},vx=${featherStartLog.playerVx.toFixed(1)}` : 'NONE');
    console.log('Case U Feather chest opening mid-progress (expected state=opening, prog=12, vx=0):', featherMidLog ? `state=${featherMidLog.featherChestState},prog=${featherMidLog.featherChestProgress},vx=${featherMidLog.playerVx.toFixed(1)}` : 'NONE');
    console.log('Case U Feather chest opening final tick (expected state=opening, prog=24, vx=0):', featherLastOpeningLog ? `state=${featherLastOpeningLog.featherChestState},prog=${featherLastOpeningLog.featherChestProgress},vx=${featherLastOpeningLog.playerVx.toFixed(1)}` : 'NONE');
    console.log('Case U Feather chest fully open & feather absorbed (expected state=open, absorbed=true, feathers=1):', featherOpenCompleteLog ? `state=${featherOpenCompleteLog.featherChestState},abs=${featherOpenCompleteLog.featherChestAbsorbed},feathers=${featherOpenCompleteLog.phoenixFeathers}` : 'NONE');
    console.log('Case U 6th Phoenix Feather mana upgrade (expected maxMp=120, mp=120, upgr=1, feathers=0):', manaUpgradeLog ? `maxMp=${manaUpgradeLog.maxMp},mp=${manaUpgradeLog.playerMp},upgr=${manaUpgradeLog.phoenixUpgrades},feathers=${manaUpgradeLog.phoenixFeathers}` : 'NONE');
    console.log('Case U HUD expanded mana bar metrics (expected maxMp=120, width=96):', finalManaHudLog && finalManaHudLog.hud ? `maxMp=${finalManaHudLog.hud.maxMp},currentMp=${finalManaHudLog.hud.currentMp},manaWidth=${finalManaHudLog.hud.manaWidth}` : 'NONE');

    if (!featherStartLog || featherStartLog.featherChestState !== 'opening' || featherStartLog.featherChestProgress !== 1) {
      throw new Error(`Case U failure: featherStartLog invalid: ${JSON.stringify(featherStartLog)}`);
    }
    if (!featherLastOpeningLog || featherLastOpeningLog.featherChestState !== 'opening' || featherLastOpeningLog.featherChestProgress !== 24) {
      throw new Error(`Case U failure: featherLastOpeningLog invalid: ${JSON.stringify(featherLastOpeningLog)}`);
    }
    if (!featherOpenCompleteLog || featherOpenCompleteLog.featherChestState !== 'open' || !featherOpenCompleteLog.featherChestAbsorbed || featherOpenCompleteLog.phoenixFeathers !== 1) {
      throw new Error(`Case U failure: featherOpenCompleteLog invalid: ${JSON.stringify(featherOpenCompleteLog)}`);
    }
    if (!manaUpgradeLog || manaUpgradeLog.maxMp !== 120 || manaUpgradeLog.playerMp !== 120 || manaUpgradeLog.phoenixUpgrades !== 1) {
      throw new Error(`Case U failure: manaUpgradeLog invalid: ${JSON.stringify(manaUpgradeLog)}`);
    }
    if (!finalManaHudLog || !finalManaHudLog.hud || finalManaHudLog.hud.maxMp !== 120 || finalManaHudLog.hud.currentMp !== 120 || finalManaHudLog.hud.manaWidth !== 96) {
      throw new Error(`Case U failure: finalManaHudLog invalid: ${JSON.stringify(finalManaHudLog)}`);
    }

    // CASE V: Red Orbs Stone Chest, Collection & Weapon Upgrade to Level 2 (GOW8B-UPGRADE-01)
    // - Scenario: 'chest' (Kratos at x=160, Red Orbs Stone Chest at x=410, y=262).
    // - t=1: Kratos approached into interaction range of Red Orbs Chest (x=388, distance=22 px <= 28 px).
    // - t=1..24: Kratos presses/holds 'context-action' (E).
    //   - Red chest state is 'opening' throughout ticks 1..24 with openProgressTicks incrementing 1..24.
    //   - Kratos is firmly anchored in opening action (vx = 0).
    // - t=25: Chest completes opening ('open'), 50 Red Orbs emitted & credited (redChestAbsorbed = true, redOrbs = 50).
    // - t=28: Simulates player with 100 Red Orbs available for weapon upgrade.
    // - t=30: Kratos presses 'upgrade' (P).
    // - t=31: Weapon upgraded to Level 2 (weaponLevel = 2, redOrbs = 0, 100 deducted).
    // - t=35: Spawns a legionnaire enemy directly in front of Kratos (x=430, y=262).
    // - t=36..48: Kratos attacks with light attack (J) using Level 2 Blades of Chaos.
    // - t=48: Hit connects, dealing 16 damage (12 * 1.3), reducing legionnaire HP from 60 to 44.
    // - t=70: HUD metrics verify weaponLevel === 2.
    const caseV = await recordScenarioSequence({
      caseId: 'red_orbs_chest_and_weapon_upgrade',
      scenario: 'chest',
      totalSteps: 75,
      cropW: 240,
      cropH: 140,
      fixedCropX: 250,
      fixedCropY: 140,
      getActions: (t) => {
        const sc = window.__SHELL_SCENE;
        const p = sc.simulation.world.peekEntity('player');

        // t=1: Approach into interaction range of red chest (x=388, chest at x=410, dx=22 <= 28)
        if (t === 1 && p) {
          p.x = 388;
          p.y = 262;
          p.vx = 0;
          p.vy = 0;
          p.facing = 1;
        }

        // t=1..24: Opening action (E)
        if (t >= 1 && t <= 24) {
          return ['context-action'];
        }

        // t=28: Provide remaining 50 red orbs so balance reaches 100
        if (t === 28 && p) {
          p.redOrbs = 100;
        }

        // t=30: Trigger weapon upgrade (P)
        if (t === 30) {
          return ['upgrade'];
        }

        // t=35: Spawn legionnaire enemy in front of Kratos to test Level 2 combat damage
        if (t === 35) {
          sc.simulation.world.spawnEnemy('legionnaire', 430, -1);
        }

        // t=36..48: Light attack chain to hit legionnaire
        if (t >= 36 && t <= 48) {
          return ['light-attack'];
        }

        return [];
      },
    });

    const redStartLog = caseV.logs.find((l) => l.t === 1);
    const redMidLog = caseV.logs.find((l) => l.t === 12);
    const redLastOpeningLog = caseV.logs.find((l) => l.t === 24);
    const redOpenCompleteLog = caseV.logs.find((l) => l.t === 25);
    const weaponUpgradeLog = caseV.logs.find((l) => l.t === 31);
    const combatHitLog = caseV.logs.find((l) => l.t === 48);
    const finalWeaponHudLog = caseV.logs.find((l) => l.t === 70);

    console.log('Case V Red Orbs chest opening initiated (expected state=opening, prog=1, vx=0):', redStartLog ? `state=${redStartLog.redChestState},prog=${redStartLog.redChestProgress},vx=${redStartLog.playerVx.toFixed(1)}` : 'NONE');
    console.log('Case V Red Orbs chest opening mid-progress (expected state=opening, prog=12, vx=0):', redMidLog ? `state=${redMidLog.redChestState},prog=${redMidLog.redChestProgress},vx=${redMidLog.playerVx.toFixed(1)}` : 'NONE');
    console.log('Case V Red Orbs chest opening final tick (expected state=opening, prog=24, vx=0):', redLastOpeningLog ? `state=${redLastOpeningLog.redChestState},prog=${redLastOpeningLog.redChestProgress},vx=${redLastOpeningLog.playerVx.toFixed(1)}` : 'NONE');
    console.log('Case V Red Orbs chest fully open & orbs credited (expected state=open, absorbed=true, orbs=50):', redOpenCompleteLog ? `state=${redOpenCompleteLog.redChestState},abs=${redOpenCompleteLog.redChestAbsorbed},orbs=${redOpenCompleteLog.redOrbs}` : 'NONE');
    console.log('Case V Weapon upgrade to Level 2 (expected weaponLevel=2, redOrbs=0):', weaponUpgradeLog ? `weaponLevel=${weaponUpgradeLog.weaponLevel},orbs=${weaponUpgradeLog.redOrbs}` : 'NONE');
    console.log('Case V Level 2 Blades combat hit damage (expected targetHp=44 [60-16]):', combatHitLog ? `targetHp=${combatHitLog.targetHp},targetState=${combatHitLog.targetState}` : 'NONE');
    console.log('Case V HUD weaponLevel metrics (expected weaponLevel=2):', finalWeaponHudLog && finalWeaponHudLog.hud ? `weaponLevel=${finalWeaponHudLog.hud.weaponLevel}` : 'NONE');

    if (!redStartLog || redStartLog.redChestState !== 'opening' || redStartLog.redChestProgress !== 1) {
      throw new Error(`Case V failure: redStartLog invalid: ${JSON.stringify(redStartLog)}`);
    }
    if (!redLastOpeningLog || redLastOpeningLog.redChestState !== 'opening' || redLastOpeningLog.redChestProgress !== 24) {
      throw new Error(`Case V failure: redLastOpeningLog invalid: ${JSON.stringify(redLastOpeningLog)}`);
    }
    if (!redOpenCompleteLog || redOpenCompleteLog.redChestState !== 'open' || !redOpenCompleteLog.redChestAbsorbed || redOpenCompleteLog.redOrbs !== 50) {
      throw new Error(`Case V failure: redOpenCompleteLog invalid: ${JSON.stringify(redOpenCompleteLog)}`);
    }
    if (!weaponUpgradeLog || weaponUpgradeLog.weaponLevel !== 2 || weaponUpgradeLog.redOrbs !== 0) {
      throw new Error(`Case V failure: weaponUpgradeLog invalid: ${JSON.stringify(weaponUpgradeLog)}`);
    }
    if (!combatHitLog || combatHitLog.targetHp !== 44) {
      throw new Error(`Case V failure: combatHitLog invalid: ${JSON.stringify(combatHitLog)}`);
    }
    if (!finalWeaponHudLog || !finalWeaponHudLog.hud || finalWeaponHudLog.hud.weaponLevel !== 2) {
      throw new Error(`Case V failure: finalWeaponHudLog invalid: ${JSON.stringify(finalWeaponHudLog)}`);
    }

    // CASE W: Checkpoint Activation, Death & State-Preserving Respawn (GOW8B-CHECK-01)
    // - Scenario: 'checkpoint' (Kratos at x=100, y=262, Checkpoint at x=180, y=262).
    // - t=1..18: Kratos moves right towards checkpoint.
    // - t=20: Kratos crosses into activation radius (x=180), activating checkpoint (checkpointActive=true, activeCheckpointId='chk-test').
    // - t=25: Kratos upgrades weapon to Level 2 (weaponLevel=2).
    // - t=30: Fatal damage induced (hp=0, isDead=true).
    // - t=35: Player inputs 'restart' (R) -> respawns at active checkpoint.
    // - t=36..40: Player successfully respawned at (180, 262):
    //   - isDead === false
    //   - hp === 100, mp === 100
    //   - weaponLevel === 2 (Blades of Chaos Level 2 preserved!)
    //   - hud.weaponLevel === 2
    const caseW = await recordScenarioSequence({
      caseId: 'checkpoint_activation_death_and_respawn',
      scenario: 'checkpoint',
      totalSteps: 60,
      cropW: 240,
      cropH: 140,
      fixedCropX: 80,
      fixedCropY: 140,
      getActions: (t) => {
        const sc = window.__SHELL_SCENE;
        const p = sc.simulation.world.peekEntity('player');

        // t=1: Position at x=140 (distance 40 px > 32 px from checkpoint at x=180)
        if (t === 1 && p) {
          p.x = 140;
          p.y = 262;
          p.vx = 0;
          p.vy = 0;
          p.facing = 1;
        }

        // t=1..15: Move right towards checkpoint (x=180)
        if (t >= 1 && t <= 15) {
          return ['move-right'];
        }

        // t=25: Upgrade weapon to Level 2 to test progression preservation across respawn
        if (t === 25 && p) {
          p.redOrbs = 100;
          sc.simulation.world.upgradeWeapon(p);
        }

        // t=30: Induce defeat
        if (t === 30 && p) {
          p.hp = 0;
          p.isDead = true;
        }

        // t=35: Press 'restart' (R) to trigger respawn at checkpoint
        if (t === 35) {
          return ['restart'];
        }

        return [];
      },
    });

    const chkStartLog = caseW.logs.find((l) => l.t === 1);
    const chkActiveLog = caseW.logs.find((l) => l.t === 20);
    const preDeathLog = caseW.logs.find((l) => l.t === 26);
    const deathLog = caseW.logs.find((l) => l.t === 32);
    const respawnLog = caseW.logs.find((l) => l.t === 38);
    const finalRespawnHudLog = caseW.logs.find((l) => l.t === 55);

    console.log('Case W Checkpoint initial state (expected active=false):', chkStartLog ? `active=${chkStartLog.checkpointActive},chkId=${chkStartLog.activeCheckpointId}` : 'NONE');
    console.log('Case W Checkpoint activated (expected active=true, chkId=chk-test):', chkActiveLog ? `active=${chkActiveLog.checkpointActive},chkId=${chkActiveLog.activeCheckpointId}` : 'NONE');
    console.log('Case W Weapon Level 2 before defeat (expected weaponLevel=2, dead=false):', preDeathLog ? `weaponLevel=${preDeathLog.weaponLevel},dead=${preDeathLog.isDead}` : 'NONE');
    console.log('Case W Player defeat induced (expected dead=true, hp=0):', deathLog ? `dead=${deathLog.isDead},hp=${deathLog.playerHp}` : 'NONE');
    console.log('Case W Respawn at checkpoint (expected dead=false, hp=100, x=180, weaponLevel=2):', respawnLog ? `dead=${respawnLog.isDead},hp=${respawnLog.playerHp},x=${respawnLog.playerX},weaponLevel=${respawnLog.weaponLevel}` : 'NONE');
    console.log('Case W HUD metrics post-respawn (expected weaponLevel=2, hp=100):', finalRespawnHudLog && finalRespawnHudLog.hud ? `weaponLevel=${finalRespawnHudLog.hud.weaponLevel},hp=${finalRespawnHudLog.hud.currentHp}` : 'NONE');

    if (!chkStartLog || chkStartLog.checkpointActive !== false) {
      throw new Error(`Case W failure: chkStartLog invalid: ${JSON.stringify(chkStartLog)}`);
    }
    if (!chkActiveLog || chkActiveLog.checkpointActive !== true || chkActiveLog.activeCheckpointId !== 'chk-test') {
      throw new Error(`Case W failure: chkActiveLog invalid: ${JSON.stringify(chkActiveLog)}`);
    }
    if (!preDeathLog || preDeathLog.weaponLevel !== 2 || preDeathLog.isDead !== false) {
      throw new Error(`Case W failure: preDeathLog invalid: ${JSON.stringify(preDeathLog)}`);
    }
    if (!deathLog || deathLog.isDead !== true || deathLog.playerHp !== 0) {
      throw new Error(`Case W failure: deathLog invalid: ${JSON.stringify(deathLog)}`);
    }
    if (!respawnLog || respawnLog.isDead !== false || respawnLog.playerHp !== 100 || respawnLog.playerX !== 180 || respawnLog.weaponLevel !== 2) {
      throw new Error(`Case W failure: respawnLog invalid: ${JSON.stringify(respawnLog)}`);
    }
    if (!finalRespawnHudLog || !finalRespawnHudLog.hud || finalRespawnHudLog.hud.weaponLevel !== 2 || finalRespawnHudLog.hud.currentHp !== 100) {
      throw new Error(`Case W failure: finalRespawnHudLog invalid: ${JSON.stringify(finalRespawnHudLog)}`);
    }

    // CASE X: Hydra Boss Combat, Vulnerable Windows, Magic & Defeat (GOW8B-HYDRA-COMBO)
    // - Scenario: 'hydra' (Kratos at x=180, y=262, Hydra at x=360, y=262).
    // - t=1: Initial state: Hydra in hydra_idle, hp=300, maxHp=300, bossHp=300.
    // - t=2..5: Advance idle -> telegraph roar (hydra_roar).
    // - t=6..14: Slam attack with dodge evasion (0 damage taken).
    // - t=17..35: Hydra is stuck in deck (hydra_stuck). Kratos advances and attacks with Level 2 blades.
    // - t=38..50: Kratos casts Poseidon's Rage (magic). Multi-hit celestial storm hits Hydra.
    // - t=52..60: Combo hit brings Hydra HP to 0. Hydra transitions to hydra_defeat, isDead=true.
    // - t=61..75: Defeat animation, massive orb eruption (15 red, 2 green, 2 blue = 19 orbs!),
    //   victory banner and boss bar drained to 0.
    const caseX = await recordScenarioSequence({
      caseId: 'hydra_boss_combat_and_defeat',
      scenario: 'hydra',
      totalSteps: 75,
      cropW: 240,
      cropH: 140,
      fixedCropX: 160,
      fixedCropY: 130,
      getActions: (t) => {
        const sc = window.__SHELL_SCENE;
        const p = sc.simulation.world.peekEntity('player');
        const h = sc.simulation.world.getHydra();

        // t=1: Upgrade player to Level 2 blades
        if (t === 1 && p) {
          p.weaponLevel = 2;
        }

        // t=2: Advance idle phase so telegraph starts quickly
        if (t === 2 && h && h.aiState === 'hydra_idle') {
          h.aiTicks = 59;
        }

        // t=4: Advance roar phase so slam starts
        if (t === 4 && h && h.aiState === 'hydra_roar') {
          h.aiTicks = 29;
        }

        // t=6: Slam begins. Kratos executes dodge to evade the upcoming slam impact!
        if (t === 6) {
          return ['dodge'];
        }

        // t=13..20: Move right closer to stuck hydra
        if (t >= 13 && t <= 20) {
          return ['move-right'];
        }

        // t=21: Attack the stuck hydra with light combo
        if (t === 21) {
          return ['light-attack'];
        }

        // t=29: Combo move 2
        if (t === 29) {
          return ['light-attack'];
        }

        // t=38: Cast Poseidon's Rage magic
        if (t === 38) {
          return ['magic'];
        }

        // t=48: Lower health so magic wave delivers the finishing blow
        if (t === 48 && h) {
          h.hp = 5;
        }

        return [];
      },
    });

    const hydraStartLog = caseX.logs.find((l) => l.t === 1);
    const hydraRoarLog = caseX.logs.find((l) => l.t === 3);
    const hydraSlamImpactLog = caseX.logs.find((l) => l.t === 12);
    const hydraStuckLog = caseX.logs.find((l) => l.t === 17);
    const bladesHitLog = caseX.logs.find((l) => l.t === 26);
    const magicHitLog = caseX.logs.find((l) => l.t === 46);
    const hydraDefeatLog = caseX.logs.find((l) => l.t === 56);
    const victoryOrbsLog = caseX.logs.find((l) => l.t === 65);

    console.log('Case X Hydra initial state (expected hp=300, state=hydra_idle, bossHp=300):', hydraStartLog ? `hp=${hydraStartLog.hydraHp},state=${hydraStartLog.hydraState},bossHp=${hydraStartLog.bossHp}` : 'NONE');
    console.log('Case X Hydra telegraph roar (expected state=hydra_roar):', hydraRoarLog ? `state=${hydraRoarLog.hydraState}` : 'NONE');
    console.log('Case X Slam impact evasion (expected playerHp=100, rollPhase!=none):', hydraSlamImpactLog ? `playerHp=${hydraSlamImpactLog.playerHp},rollPhase=${hydraSlamImpactLog.rollPhase}` : 'NONE');
    console.log('Case X Hydra stuck in deck (expected state=hydra_stuck):', hydraStuckLog ? `state=${hydraStuckLog.hydraState}` : 'NONE');
    console.log('Case X Blades of Chaos damage (expected hydraHp < 300):', bladesHitLog ? `hydraHp=${bladesHitLog.hydraHp}` : 'NONE');
    console.log('Case X Magic multi-hit damage (expected magicPhase=active):', magicHitLog ? `magicPhase=${magicHitLog.magicPhase},hydraHp=${magicHitLog.hydraHp}` : 'NONE');
    console.log('Case X Hydra defeat (expected hp=0, state=hydra_defeat, dead=true):', hydraDefeatLog ? `hp=${hydraDefeatLog.hydraHp},state=${hydraDefeatLog.hydraState},dead=${hydraDefeatLog.hydraDead}` : 'NONE');
    console.log('Case X Victory orb eruption (expected orbs active/absorbed, redOrbs >= 25, bossHp=0):', victoryOrbsLog ? `orbsCount=${victoryOrbsLog.orbsCount},redOrbs=${victoryOrbsLog.playerRedOrbs},bossHp=${victoryOrbsLog.bossHp}` : 'NONE');

    if (!hydraStartLog || hydraStartLog.hydraHp !== 300 || hydraStartLog.hydraState !== 'hydra_idle' || hydraStartLog.bossHp !== 300) {
      throw new Error(`Case X failure: hydraStartLog invalid: ${JSON.stringify(hydraStartLog)}`);
    }
    if (!hydraRoarLog || hydraRoarLog.hydraState !== 'hydra_roar') {
      throw new Error(`Case X failure: hydraRoarLog invalid: ${JSON.stringify(hydraRoarLog)}`);
    }
    if (!hydraSlamImpactLog || hydraSlamImpactLog.playerHp !== 100 || hydraSlamImpactLog.rollPhase === 'none') {
      throw new Error(`Case X failure: hydraSlamImpactLog invalid: ${JSON.stringify(hydraSlamImpactLog)}`);
    }
    if (!hydraStuckLog || hydraStuckLog.hydraState !== 'hydra_stuck') {
      throw new Error(`Case X failure: hydraStuckLog invalid: ${JSON.stringify(hydraStuckLog)}`);
    }
    if (!bladesHitLog || bladesHitLog.hydraHp >= 300) {
      throw new Error(`Case X failure: bladesHitLog invalid: ${JSON.stringify(bladesHitLog)}`);
    }
    if (!magicHitLog || magicHitLog.magicPhase !== 'active') {
      throw new Error(`Case X failure: magicHitLog invalid: ${JSON.stringify(magicHitLog)}`);
    }
    if (!hydraDefeatLog || hydraDefeatLog.hydraHp !== 0 || hydraDefeatLog.hydraState !== 'hydra_defeat' || hydraDefeatLog.hydraDead !== true) {
      throw new Error(`Case X failure: hydraDefeatLog invalid: ${JSON.stringify(hydraDefeatLog)}`);
    }
    if (!victoryOrbsLog || victoryOrbsLog.playerRedOrbs < 25 || victoryOrbsLog.bossHp !== 0) {
      throw new Error(`Case X failure: victoryOrbsLog invalid: ${JSON.stringify(victoryOrbsLog)}`);
    }

    // CASE Y: Complete UI Flow: Title Screen, Pause Freeze, Terminal States & Level Victory (GOW8B-UI-01)
    // - t=1..5: Initial play in 'level1' scenario. flowState='playing'. Kratos activates checkpoint and moves right.
    // - t=6: Switch flowState='title' to verify Title Screen overlay (omega symbol, monumental gold title, controls card).
    // - t=10: Press 'jump' (SPACE/ENTER) to exit title and start adventure. flowState transitions back to 'playing'.
    // - t=16: Press 'pause' (ESC) to enter interactive Pause Menu.
    // - t=17..24: Empty inputs while paused. Simulation ticks strictly frozen (snapshot.frame does not advance).
    // - t=25: Press 'pause' (ESC) again to resume simulation.
    // - t=26..35: Simulation resumes, frame advances normally, Kratos moves and attacks.
    // - t=36: Trigger victory screen via world.triggerVictory().
    //   -> flowState='victory', victoryVisible=true, stats panel active.
    // - t=44: Press 'restart' to return from victory screen to playing.
    // - t=48: Inflict lethal damage to test Defeat / Game Over screen.
    //   -> flowState='gameover', gameOverVisible=true, defeatText visible.
    // - t=56: Press 'restart' to respawn at active checkpoint.
    //   -> flowState='playing', gameOverVisible=false, isDead=false.
    const caseY = await recordScenarioSequence({
      caseId: 'ui_flow_title_pause_and_victory',
      scenario: 'level1',
      totalSteps: 60,
      cropW: 320,
      cropH: 180,
      fixedCropX: 80,
      fixedCropY: 45,
      getActions: (t) => {
        const sc = window.__SHELL_SCENE;
        const p = sc.simulation.world.peekEntity('player');

        // t=1: Activate checkpoint 'chk-popa' for respawn testing
        if (t === 1) {
          sc.simulation.world.activateCheckpoint('chk-popa');
        }

        // t=1..5: Kratos moves right
        if (t >= 1 && t <= 5) {
          return ['move-right'];
        }

        // t=6: Switch to title screen to verify Title overlay
        if (t === 6) {
          sc.simulation.world.setFlowState('title');
          return [];
        }

        // t=10: Press 'jump' (SPACE/ENTER) to exit title and start
        if (t === 10) {
          return ['jump'];
        }

        // t=11..14: Run forward
        if (t >= 11 && t <= 14) {
          return ['move-right'];
        }

        // t=16: Press 'pause' (ESC) to pause
        if (t === 16) {
          return ['pause'];
        }

        // t=17..24: No inputs while paused (verify ticks frozen)
        if (t >= 17 && t <= 24) {
          return [];
        }

        // t=25: Press 'pause' (ESC) to unpause
        if (t === 25) {
          return ['pause'];
        }

        // t=26..29: Move right
        if (t >= 26 && t <= 29) {
          return ['move-right'];
        }

        // t=30: Attack
        if (t === 30) {
          return ['light-attack'];
        }

        // t=36: Trigger victory
        if (t === 36) {
          sc.simulation.world.triggerVictory();
          return [];
        }

        // t=44: Press 'restart' to restart from victory
        if (t === 44) {
          return ['restart'];
        }

        // t=48: Setup lethal hit / defeat
        if (t === 48 && p) {
          p.hp = 0;
          p.isDead = true;
          return [];
        }

        // t=56: Press 'restart' to respawn
        if (t === 56) {
          return ['restart'];
        }

        return [];
      },
    });

    const caseYTitleLog = caseY.logs.find((l) => l.t === 8);
    const caseYTitleStartLog = caseY.logs.find((l) => l.t === 12);
    const caseYPauseStartLog = caseY.logs.find((l) => l.t === 18);
    const caseYPauseFreezeLogA = caseY.logs.find((l) => l.t === 20);
    const caseYPauseFreezeLogB = caseY.logs.find((l) => l.t === 24);
    const caseYUnpauseLog = caseY.logs.find((l) => l.t === 28);
    const caseYVictoryLog = caseY.logs.find((l) => l.t === 38);
    const caseYVictoryResetLog = caseY.logs.find((l) => l.t === 46);
    const caseYGameOverLog = caseY.logs.find((l) => l.t === 50);
    const caseYRespawnLog = caseY.logs.find((l) => l.t === 58);

    console.log('Case Y Title screen presentation (expected flowState=title, titleVisible=true):', caseYTitleLog ? `flowState=${caseYTitleLog.flowState},titleVisible=${caseYTitleLog.titleVisible}` : 'NONE');
    console.log('Case Y Title dismiss and start (expected flowState=playing, titleVisible=false):', caseYTitleStartLog ? `flowState=${caseYTitleStartLog.flowState},titleVisible=${caseYTitleStartLog.titleVisible}` : 'NONE');
    console.log('Case Y Pause menu activation (expected flowState=paused, pauseVisible=true):', caseYPauseStartLog ? `flowState=${caseYPauseStartLog.flowState},pauseVisible=${caseYPauseStartLog.pauseVisible}` : 'NONE');
    console.log('Case Y Pause deterministic freeze (expected frame20 == frame24):', caseYPauseFreezeLogA && caseYPauseFreezeLogB ? `frame20=${caseYPauseFreezeLogA.frame},frame24=${caseYPauseFreezeLogB.frame}` : 'NONE');
    console.log('Case Y Simulation unpause resume (expected flowState=playing, pauseVisible=false, frame > frame20):', caseYUnpauseLog ? `flowState=${caseYUnpauseLog.flowState},pauseVisible=${caseYUnpauseLog.pauseVisible},frame=${caseYUnpauseLog.frame}` : 'NONE');
    console.log('Case Y Level 1 Victory screen (expected flowState=victory, victoryVisible=true, stats.rank defined):', caseYVictoryLog ? `flowState=${caseYVictoryLog.flowState},victoryVisible=${caseYVictoryLog.victoryVisible},rank=${caseYVictoryLog.stats?.rank}` : 'NONE');
    console.log('Case Y Victory reset to playing (expected flowState=playing, victoryVisible=false):', caseYVictoryResetLog ? `flowState=${caseYVictoryResetLog.flowState},victoryVisible=${caseYVictoryResetLog.victoryVisible}` : 'NONE');
    console.log('Case Y Adaptive Game Over screen (expected flowState=gameover, gameOverVisible=true, isDead=true):', caseYGameOverLog ? `flowState=${caseYGameOverLog.flowState},gameOverVisible=${caseYGameOverLog.gameOverVisible},isDead=${caseYGameOverLog.isDead}` : 'NONE');
    console.log('Case Y Checkpoint respawn recovery (expected flowState=playing, gameOverVisible=false, isDead=false):', caseYRespawnLog ? `flowState=${caseYRespawnLog.flowState},gameOverVisible=${caseYRespawnLog.gameOverVisible},isDead=${caseYRespawnLog.isDead},hp=${caseYRespawnLog.playerHp}` : 'NONE');

    if (!caseYTitleLog || caseYTitleLog.flowState !== 'title' || !caseYTitleLog.titleVisible) {
      throw new Error(`Case Y failure: titleLog invalid: ${JSON.stringify(caseYTitleLog)}`);
    }
    if (!caseYTitleStartLog || caseYTitleStartLog.flowState !== 'playing' || caseYTitleStartLog.titleVisible) {
      throw new Error(`Case Y failure: titleStartLog invalid: ${JSON.stringify(caseYTitleStartLog)}`);
    }
    if (!caseYPauseStartLog || caseYPauseStartLog.flowState !== 'paused' || !caseYPauseStartLog.pauseVisible) {
      throw new Error(`Case Y failure: pauseStartLog invalid: ${JSON.stringify(caseYPauseStartLog)}`);
    }
    if (!caseYPauseFreezeLogA || !caseYPauseFreezeLogB || caseYPauseFreezeLogA.frame !== caseYPauseFreezeLogB.frame) {
      throw new Error(`Case Y failure: pauseFreezeLog frame mismatch: ${caseYPauseFreezeLogA?.frame} vs ${caseYPauseFreezeLogB?.frame}`);
    }
    if (!caseYUnpauseLog || caseYUnpauseLog.flowState !== 'playing' || caseYUnpauseLog.pauseVisible || caseYUnpauseLog.frame <= caseYPauseFreezeLogA.frame) {
      throw new Error(`Case Y failure: unpauseLog invalid: ${JSON.stringify(caseYUnpauseLog)}`);
    }
    if (!caseYVictoryLog || caseYVictoryLog.flowState !== 'victory' || !caseYVictoryLog.victoryVisible || !caseYVictoryLog.stats?.rank) {
      throw new Error(`Case Y failure: victoryLog invalid: ${JSON.stringify(caseYVictoryLog)}`);
    }
    if (!caseYVictoryResetLog || caseYVictoryResetLog.flowState !== 'playing' || caseYVictoryResetLog.victoryVisible) {
      throw new Error(`Case Y failure: victoryResetLog invalid: ${JSON.stringify(caseYVictoryResetLog)}`);
    }
    if (!caseYGameOverLog || caseYGameOverLog.flowState !== 'gameover' || !caseYGameOverLog.gameOverVisible || !caseYGameOverLog.isDead) {
      throw new Error(`Case Y failure: gameoverLog invalid: ${JSON.stringify(caseYGameOverLog)}`);
    }
    if (!caseYRespawnLog || caseYRespawnLog.flowState !== 'playing' || caseYRespawnLog.gameOverVisible || caseYRespawnLog.isDead || caseYRespawnLog.playerHp <= 0) {
      throw new Error(`Case Y failure: respawnLog invalid: ${JSON.stringify(caseYRespawnLog)}`);
    }

    // CASE Z: Aegean Storm VFX: Dual-Layer Rain, Lightning Flash, Combat Sparks & Deterministic Freeze (GOW8B-VFX-01)
    // - t=1: Verify rain is active (> 30 rain drops across back and front layers).
    // - t=5: Trigger ambient Aegean lightning flash via sc.vfxLayer.triggerLightning().
    // - t=6: Verify lightning is actively flashing (lightningActive=true, lightningAlpha > 0).
    // - t=11: Verify lightning returns smoothly to idle (lightningActive=false, lightningAlpha=0).
    // - t=14..18: Kratos advances towards target and launches light attack combo.
    // - t=21: Attack impacts target, emitting radial combat sparks (sparksCount > 0).
    // - t=30: Sparks completely decay after 8 ticks (sparksCount === 0).
    // - t=33: Parry flash triggered via sc.vfxLayer.emitParryFlash(p.x, p.y - 20).
    // - t=34: Verify parry flash active (parryFlashActive=true).
    // - t=40: Emit new batch of sparks right before pause test.
    // - t=41: Press 'pause' (ESC) to pause simulation.
    // - t=42..46: Verify particles remain strictly frozen during pause (sparksCount t42 === sparksCount t46).
    // - t=47: Press 'pause' (ESC) to resume simulation.
    // - t=50..60: Normal simulation resumes smoothly.
    const caseZ = await recordScenarioSequence({
      caseId: 'vfx_weather_sparks_and_readability',
      scenario: 'combat',
      totalSteps: 60,
      cropW: 240,
      cropH: 140,
      fixedCropX: 120,
      fixedCropY: 100,
      getActions: (t) => {
        const sc = window.__SHELL_SCENE;
        const p = sc.simulation.world.peekEntity('player');

        // t=5: Trigger lightning
        if (t === 5 && sc.vfxLayer) {
          sc.vfxLayer.triggerLightning(6);
        }

        // t=14..15: Move right towards enemy
        if (t === 14 || t === 15) {
          return ['move-right'];
        }

        // t=16: Light attack to hit enemy
        if (t === 16) {
          return ['light-attack'];
        }

        // t=33: Trigger parry flash
        if (t === 33 && sc.vfxLayer && p) {
          sc.vfxLayer.emitParryFlash(p.x + p.facing * 18, p.y - 18);
        }

        // t=40: Emit combat sparks right before pause
        if (t === 40 && sc.vfxLayer && p) {
          sc.vfxLayer.emitCombatSparks(p.x + p.facing * 25, p.y - 20, 6);
        }

        // t=41: Press 'pause'
        if (t === 41) {
          return ['pause'];
        }

        // t=42..46: Paused ticks
        if (t >= 42 && t <= 46) {
          return [];
        }

        // t=47: Unpause
        if (t === 47) {
          return ['pause'];
        }

        return [];
      },
    });

    const caseZRainLog = caseZ.logs.find((l) => l.t === 2);
    const caseZLightningActiveLog = caseZ.logs.find((l) => l.t === 6);
    const caseZLightningDecayLog = caseZ.logs.find((l) => l.t === 11);
    const caseZSparksLog = caseZ.logs.find((l) => l.t === 21);
    const caseZSparksDecayLog = caseZ.logs.find((l) => l.t === 30);
    const caseZParryLog = caseZ.logs.find((l) => l.t === 34);
    const caseZPauseFreezeLogA = caseZ.logs.find((l) => l.t === 43);
    const caseZPauseFreezeLogB = caseZ.logs.find((l) => l.t === 46);
    const caseZResumeLog = caseZ.logs.find((l) => l.t === 50);

    console.log('Case Z Dual-layer rain active (expected rainDropsCount >= 30):', caseZRainLog ? `rainDrops=${caseZRainLog.rainDropsCount}` : 'NONE');
    console.log('Case Z Lightning active flash (expected lightningActive=true, alpha > 0):', caseZLightningActiveLog ? `active=${caseZLightningActiveLog.lightningActive},alpha=${caseZLightningActiveLog.lightningAlpha}` : 'NONE');
    console.log('Case Z Lightning decay (expected lightningActive=false, alpha=0):', caseZLightningDecayLog ? `active=${caseZLightningDecayLog.lightningActive},alpha=${caseZLightningDecayLog.lightningAlpha}` : 'NONE');
    console.log('Case Z Combat hit sparks emitted (expected sparksCount > 0):', caseZSparksLog ? `sparks=${caseZSparksLog.sparksCount}` : 'NONE');
    console.log('Case Z Combat sparks decay (expected sparksCount=0):', caseZSparksDecayLog ? `sparks=${caseZSparksDecayLog.sparksCount}` : 'NONE');
    console.log('Case Z Parry star flare active (expected parryFlashActive=true):', caseZParryLog ? `parry=${caseZParryLog.parryFlashActive}` : 'NONE');
    console.log('Case Z VFX particles freeze during pause (expected sparks43 == sparks46 > 0, frame43 == frame46):', caseZPauseFreezeLogA && caseZPauseFreezeLogB ? `sparksA=${caseZPauseFreezeLogA.sparksCount},sparksB=${caseZPauseFreezeLogB.sparksCount},frameA=${caseZPauseFreezeLogA.frame},frameB=${caseZPauseFreezeLogB.frame}` : 'NONE');
    console.log('Case Z VFX unpause resume (expected flowState=playing):', caseZResumeLog ? `flowState=${caseZResumeLog.flowState}` : 'NONE');

    if (!caseZRainLog || caseZRainLog.rainDropsCount < 30) {
      throw new Error(`Case Z failure: rainDropsCount invalid: ${JSON.stringify(caseZRainLog)}`);
    }
    if (!caseZLightningActiveLog || !caseZLightningActiveLog.lightningActive || caseZLightningActiveLog.lightningAlpha <= 0) {
      throw new Error(`Case Z failure: lightningActiveLog invalid: ${JSON.stringify(caseZLightningActiveLog)}`);
    }
    if (!caseZLightningDecayLog || caseZLightningDecayLog.lightningActive || caseZLightningDecayLog.lightningAlpha !== 0) {
      throw new Error(`Case Z failure: lightningDecayLog invalid: ${JSON.stringify(caseZLightningDecayLog)}`);
    }
    if (!caseZSparksLog || caseZSparksLog.sparksCount <= 0) {
      throw new Error(`Case Z failure: sparksLog invalid: ${JSON.stringify(caseZSparksLog)}`);
    }
    if (!caseZSparksDecayLog || caseZSparksDecayLog.sparksCount !== 0) {
      throw new Error(`Case Z failure: sparksDecayLog invalid: ${JSON.stringify(caseZSparksDecayLog)}`);
    }
    if (!caseZParryLog || !caseZParryLog.parryFlashActive) {
      throw new Error(`Case Z failure: parryLog invalid: ${JSON.stringify(caseZParryLog)}`);
    }
    if (!caseZPauseFreezeLogA || !caseZPauseFreezeLogB || caseZPauseFreezeLogA.sparksCount !== caseZPauseFreezeLogB.sparksCount || caseZPauseFreezeLogA.sparksCount <= 0 || caseZPauseFreezeLogA.frame !== caseZPauseFreezeLogB.frame) {
      throw new Error(`Case Z failure: pauseFreezeLog invalid: A=${JSON.stringify(caseZPauseFreezeLogA)}, B=${JSON.stringify(caseZPauseFreezeLogB)}`);
    }
    if (!caseZResumeLog || caseZResumeLog.flowState !== 'playing') {
      throw new Error(`Case Z failure: resumeLog invalid: ${JSON.stringify(caseZResumeLog)}`);
    }

    // CASE AA: Procedural Audio Engine: Synthesis, Combat Sound Events & Mute Controls (GOW8B-AUDIO-01)
    // - t=1: Verify SoundManager is initialized and WebAudio context is ready (isReady=true, muted=false).
    // - t=6: Kratos moves right towards enemy.
    // - t=8: Kratos attacks with light attack -> sound 'slash' triggered (playCounts.slash > 0).
    // - t=16: Blade connects with enemy -> sound 'hit' triggered (playCounts.hit > 0).
    // - t=22: Cast Poseidon's Rage magic -> sound 'magicThunder' triggered (playCounts.magicThunder > 0).
    // - t=30: Collect orb / trigger orb sound -> sound 'orbAbsorb' triggered (playCounts.orbAbsorb > 0).
    // - t=38: Trigger parry sound -> sound 'parry' triggered (playCounts.parry > 0).
    // - t=46: Trigger hydra roar sound -> sound 'hydraRoar' triggered (playCounts.hydraRoar > 0).
    // - t=54: Toggle mute via sc.soundManager.toggleMute() -> muted=true.
    // - t=62: Toggle mute back via sc.soundManager.toggleMute() -> muted=false.
    const caseAA = await recordScenarioSequence({
      caseId: 'audio_synthesis_and_sound_events',
      scenario: 'combat',
      totalSteps: 70,
      cropW: 240,
      cropH: 140,
      fixedCropX: 120,
      fixedCropY: 100,
      getActions: (t) => {
        const sc = window.__SHELL_SCENE;

        // t=6..7: Move right towards enemy
        if (t === 6 || t === 7) {
          return ['move-right'];
        }

        // t=8: Attack with light attack
        if (t === 8) {
          return ['light-attack'];
        }

        // t=22: Cast magic Poseidon's Rage
        if (t === 22) {
          return ['magic'];
        }

        // t=30: Trigger orb absorb
        if (t === 30 && sc.soundManager) {
          sc.soundManager.playOrbAbsorb('red');
        }

        // t=38: Trigger parry sound
        if (t === 38 && sc.soundManager) {
          sc.soundManager.playParry();
        }

        // t=46: Trigger hydra roar
        if (t === 46 && sc.soundManager) {
          sc.soundManager.playHydraRoar();
        }

        // t=54: Toggle mute
        if (t === 54 && sc.soundManager) {
          sc.soundManager.toggleMute();
        }

        // t=62: Unmute
        if (t === 62 && sc.soundManager) {
          sc.soundManager.toggleMute();
        }

        return [];
      },
    });

    const caseAAInitLog = caseAA.logs.find((l) => l.t === 1);
    const caseAASlashLog = caseAA.logs.find((l) => l.t === 10);
    const caseAAHitLog = caseAA.logs.find((l) => l.t === 18);
    const caseAAMagicLog = caseAA.logs.find((l) => l.t === 25);
    const caseAAOrbLog = caseAA.logs.find((l) => l.t === 32);
    const caseAAParryLog = caseAA.logs.find((l) => l.t === 40);
    const caseAARoarLog = caseAA.logs.find((l) => l.t === 48);
    const caseAAMutedLog = caseAA.logs.find((l) => l.t === 56);
    const caseAAUnmutedLog = caseAA.logs.find((l) => l.t === 65);

    console.log('Case AA Audio engine ready (expected isReady=true, muted=false):', caseAAInitLog ? `isReady=${caseAAInitLog.soundStats?.isReady},muted=${caseAAInitLog.soundMuted}` : 'NONE');
    console.log('Case AA Slash sound triggered (expected slash > 0):', caseAASlashLog ? `slash=${caseAASlashLog.soundStats?.playCounts?.slash}` : 'NONE');
    console.log('Case AA Hit sound triggered (expected hit > 0):', caseAAHitLog ? `hit=${caseAAHitLog.soundStats?.playCounts?.hit}` : 'NONE');
    console.log('Case AA Magic thunder sound triggered (expected magicThunder > 0):', caseAAMagicLog ? `magic=${caseAAMagicLog.soundStats?.playCounts?.magicThunder}` : 'NONE');
    console.log('Case AA Orb absorb sound triggered (expected orbAbsorb > 0):', caseAAOrbLog ? `orb=${caseAAOrbLog.soundStats?.playCounts?.orbAbsorb}` : 'NONE');
    console.log('Case AA Parry sound triggered (expected parry > 0):', caseAAParryLog ? `parry=${caseAAParryLog.soundStats?.playCounts?.parry}` : 'NONE');
    console.log('Case AA Hydra roar sound triggered (expected hydraRoar > 0):', caseAARoarLog ? `roar=${caseAARoarLog.soundStats?.playCounts?.hydraRoar}` : 'NONE');
    console.log('Case AA Mute toggled (expected muted=true):', caseAAMutedLog ? `muted=${caseAAMutedLog.soundMuted}` : 'NONE');
    console.log('Case AA Unmute toggled back (expected muted=false, totalPlayed >= 6):', caseAAUnmutedLog ? `muted=${caseAAUnmutedLog.soundMuted},total=${caseAAUnmutedLog.soundTotalPlayed}` : 'NONE');

    if (!caseAAInitLog || !caseAAInitLog.soundStats?.isReady || caseAAInitLog.soundMuted) {
      throw new Error(`Case AA failure: initLog invalid: ${JSON.stringify(caseAAInitLog)}`);
    }
    if (!caseAASlashLog || (caseAASlashLog.soundStats?.playCounts?.slash ?? 0) <= 0) {
      throw new Error(`Case AA failure: slashLog invalid: ${JSON.stringify(caseAASlashLog)}`);
    }
    if (!caseAAHitLog || (caseAAHitLog.soundStats?.playCounts?.hit ?? 0) <= 0) {
      throw new Error(`Case AA failure: hitLog invalid: ${JSON.stringify(caseAAHitLog)}`);
    }
    if (!caseAAMagicLog || (caseAAMagicLog.soundStats?.playCounts?.magicThunder ?? 0) <= 0) {
      throw new Error(`Case AA failure: magicLog invalid: ${JSON.stringify(caseAAMagicLog)}`);
    }
    if (!caseAAOrbLog || (caseAAOrbLog.soundStats?.playCounts?.orbAbsorb ?? 0) <= 0) {
      throw new Error(`Case AA failure: orbLog invalid: ${JSON.stringify(caseAAOrbLog)}`);
    }
    if (!caseAAParryLog || (caseAAParryLog.soundStats?.playCounts?.parry ?? 0) <= 0) {
      throw new Error(`Case AA failure: parryLog invalid: ${JSON.stringify(caseAAParryLog)}`);
    }
    if (!caseAARoarLog || (caseAARoarLog.soundStats?.playCounts?.hydraRoar ?? 0) <= 0) {
      throw new Error(`Case AA failure: roarLog invalid: ${JSON.stringify(caseAARoarLog)}`);
    }
    if (!caseAAMutedLog || !caseAAMutedLog.soundMuted) {
      throw new Error(`Case AA failure: mutedLog invalid: ${JSON.stringify(caseAAMutedLog)}`);
    }
    if (!caseAAUnmutedLog || caseAAUnmutedLog.soundMuted || (caseAAUnmutedLog.soundTotalPlayed ?? 0) < 6) {
      throw new Error(`Case AA failure: unmutedLog invalid: ${JSON.stringify(caseAAUnmutedLog)}`);
    }

    console.log('\n=== ALL VERIFICATION TESTS COMPLETED SUCCESSFULLY ===');
    console.log('Artifacts in scripts/verification/output/:');
    console.log(' - combo_jjj_mosaic.png & combo_jjj.gif');
    console.log(' - plume_finish_mosaic.png & plume_finish.gif');
    console.log(' - ascension_air_dive_mosaic.png & ascension_air_dive.gif');
    console.log(' - chain_grab_mosaic.png & chain_grab.gif');
    console.log(' - loco_weight_turnaround_landing_mosaic.png & loco_weight_turnaround_landing.gif');
    console.log(' - combo_jjjj_mosaic.png & combo_jjjj.gif');
    console.log(' - ascension_air_harpoon_mosaic.png & ascension_air_harpoon.gif');
    console.log(' - guard_parry_window_mosaic.png & guard_parry_window.gif');
    console.log(' - guard_cancel_actions_mosaic.png & guard_cancel_actions.gif');
    console.log(' - legionnaire_combat_ai_mosaic.png & legionnaire_combat_ai.gif');
    console.log(' - player_damage_and_defeat_mosaic.png & player_damage_and_defeat.gif');
    console.log(' - hud_health_bar_presentation_mosaic.png & hud_health_bar_presentation.gif');
    console.log(' - orbs_economy_and_healing_mosaic.png & orbs_economy_and_healing.gif');
    console.log(' - archer_combat_ai_mosaic.png & archer_combat_ai.gif');
    console.log(' - waves_flow_and_pacing_mosaic.png & waves_flow_and_pacing.gif');
    console.log(' - arena_confinement_and_barriers_mosaic.png & arena_confinement_and_barriers.gif');
    console.log(' - poseidons_rage_magic_aoe_mosaic.png & poseidons_rage_magic_aoe.gif');
    console.log(' - map_scroll_and_segments_mosaic.png & map_scroll_and_segments.gif');
    console.log(' - platforming_verticality_and_drop_mosaic.png & platforming_verticality_and_drop.gif');
    console.log(' - gorgon_eye_chest_and_health_upgrade_mosaic.png & gorgon_eye_chest_and_health_upgrade.gif');
    console.log(' - phoenix_feather_chest_and_mana_upgrade_mosaic.png & phoenix_feather_chest_and_mana_upgrade.gif');
    console.log(' - red_orbs_chest_and_weapon_upgrade_mosaic.png & red_orbs_chest_and_weapon_upgrade.gif');
    console.log(' - checkpoint_activation_death_and_respawn_mosaic.png & checkpoint_activation_death_and_respawn.gif');
    console.log(' - hydra_boss_combat_and_defeat_mosaic.png & hydra_boss_combat_and_defeat.gif');
    console.log(' - ui_flow_title_pause_and_victory_mosaic.png & ui_flow_title_pause_and_victory.gif');
    console.log(' - vfx_weather_sparks_and_readability_mosaic.png & vfx_weather_sparks_and_readability.gif');
    console.log(' - audio_synthesis_and_sound_events_mosaic.png & audio_synthesis_and_sound_events.gif');

    ws.close();
  } finally {
    if (chromeProcess) {
      chromeProcess.kill('SIGTERM');
    }
    if (viteProcess) {
      viteProcess.kill('SIGTERM');
    }
  }
}

run().catch((err) => {
  console.error('VERIFICATION FAILED:', err);
  process.exit(1);
});
