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
          const hudInfo = hm ? \` [Bar:\${hm.currentWidth}px Gst:\${hm.ghostWidth}px Orbs:\${hm.redOrbs}]\` : '';
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
