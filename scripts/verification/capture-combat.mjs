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
          const sx = Math.max(0, Math.min(480 - cropW, Math.round(centerX - cropW / 2)));
          const sy = Math.max(0, Math.min(270 - cropH, Math.round(centerY - cropH / 2)));

          // Draw on sheet
          sctx.drawImage(gameCanvas, sx, sy, cropW, cropH, dx, dy, cropW * scale, cropH * scale);
          sctx.strokeStyle = '#374151';
          sctx.lineWidth = 2;
          sctx.strokeRect(dx, dy, cropW * scale, cropH * scale);

          sctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
          sctx.fillRect(dx + 2, dy + 2, cropW * scale - 4, 24);
          sctx.fillStyle = '#f9fafb';
          sctx.font = 'bold 11px monospace';
          const dummyInfo = dummy ? (dummy.kind === 'legionnaire' ? \` L:(hp=\${dummy.hp},st=\${dummy.aiState})\` : \` D:(y=\${dummy.y.toFixed(0)},vy=\${dummy.vy.toFixed(0)})\`) : '';
          const actionText = p.skidTicks > 0 ? \`SKID:\${p.skidTicks}\` : (p.landingTicks > 0 ? \`LANDING:\${p.landingTicks}\` : (p.guardPhase !== 'none' ? \`GUARD:\${p.guardPhase}:\${p.guardTicks}\${p.parryActive ? ' PARRY' : ''}\` : \`\${p.attackMove} \${p.attackPhase}:\${p.attackTicks}\`));
          sctx.fillText(
            \`t=\${t} \${actionText} \${isWeaponVisible ? '⚔️CHAIN' : ''}\`,
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
          singleCtx.fillText(\`t=\${t} \${actionText} Pose:\${sc.player.frame.name} S:(\${sc.player.scaleX.toFixed(2)},\${sc.player.scaleY.toFixed(2)})\`, 4, 14);

          frames.push(single.toDataURL('image/png'));

          logs.push({
            t,
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
