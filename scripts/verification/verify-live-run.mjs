import { spawn, execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../..');
const OUTPUT_DIR = path.resolve(__dirname, 'output');
const BRAIN_DIR = '/home/ccmarin14/.gemini/antigravity-cli/brain/4e8c488d-41dd-4c59-b79d-efd3762ae28c';

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const CDP_PORT = 9275;
const DEV_PORT = 5198;

let viteProcess = null;
let chromeProcess = null;

async function startVite() {
  console.log(`Iniciando servidor Vite de prueba en puerto ${DEV_PORT}...`);
  viteProcess = spawn('pnpm', ['exec', 'vite', '--port', String(DEV_PORT), '--strictPort'], {
    cwd: REPO_ROOT,
    stdio: 'ignore',
  });
  for (let i = 0; i < 40; i += 1) {
    try {
      const res = await fetch(`http://127.0.0.1:${DEV_PORT}/`);
      if (res.ok) {
        console.log('Servidor Vite listo en puerto', DEV_PORT);
        return;
      }
    } catch {}
    await sleep(150);
  }
  throw new Error('Tiempo de espera agotado esperando Vite');
}

async function startChrome() {
  console.log(`Iniciando Chrome CDP headless en puerto ${CDP_PORT}...`);
  chromeProcess = spawn(
    'google-chrome',
    [
      `--remote-debugging-port=${CDP_PORT}`,
      '--headless=new',
      '--no-sandbox',
      '--disable-gpu',
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
  if (!target) throw new Error('No se encontró target de página en Chrome CDP');
  return target.webSocketDebuggerUrl;
}

async function main() {
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

    console.log('Esperando carga del juego y motor de simulación...');
    for (let i = 0; i < 60; i += 1) {
      const ready = await evaluate(`Boolean(window.__GOW8B && window.__GOW8B.snapshot().frame > 10)`);
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
    await sleep(100);

    // 1. Capturar Kratos en reposo (idle) en la cubierta del barco
    console.log('\n--- 1. Capturando reposo de Kratos sobre la cubierta ---');
    await sleep(500);

    const idleCapture = await evaluate(`(() => {
      const canvas = document.querySelector('canvas');
      const snap = window.__GOW8B.snapshot();
      const p = snap.entities.find(e => e.id === 'player');
      return {
        dataUrl: canvas.toDataURL('image/png'),
        player: { x: p.x, y: p.y }
      };
    })()`);

    const idleBase64 = idleCapture.dataUrl.replace(/^data:image\/png;base64,/, '');
    const idlePath1x = path.join(OUTPUT_DIR, 'live_kratos_idle_deck_1x.png');
    const idlePath4x = path.join(OUTPUT_DIR, 'live_kratos_idle_deck_4x.png');
    fs.writeFileSync(idlePath1x, Buffer.from(idleBase64, 'base64'));

    execSync(`python3 -c "
from PIL import Image
im = Image.open('${idlePath1x}')
up = im.resize((im.width * 4, im.height * 4), Image.NEAREST)
up.save('${idlePath4x}')
# Also crop Kratos closeup: x=190..290, y=200..265
crop = im.crop((190, 200, 290, 265))
crop4x = crop.resize((crop.width * 4, crop.height * 4), Image.NEAREST)
crop4x.save('${path.join(OUTPUT_DIR, 'live_kratos_idle_closeup_4x.png')}')
"`);

    console.log('Guardada captura idle:', idlePath4x);

    // 2. Ejecutar carrera activa hacia la derecha (50 ticks) con avance controlado
    console.log('\n--- 2. Ejecutando carrera activa hacia la derecha (50 ticks) ---');
    const runResult = await evaluate(`(async () => {
      const g = window.__GOW8B;
      const sc = window.__SHELL_SCENE;
      sc.simulation.advance = () => 0;
      g.loadScenario('movement');

      const pSprite = sc.player;
      const canvas = document.querySelector('canvas');
      const logs = [];
      const frameCaptures = [];

      for (let t = 0; t < 50; t += 1) {
        g.step(1, ['move-right']);
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

        const snap = g.snapshot();
        const p = snap.entities.find(e => e.id === 'player');
        const clipKey = pSprite.anims.currentAnim ? pSprite.anims.currentAnim.key : null;
        const curFrame = pSprite.frame ? pSprite.frame.name : null;

        logs.push({
          tick: snap.frame,
          x: p.x,
          vx: p.vx,
          clip: clipKey,
          frame: curFrame
        });

        if (t % 5 === 0 || t === 49) {
          frameCaptures.push({
            t,
            frame: curFrame,
            dataUrl: canvas.toDataURL('image/png')
          });
        }
      }

      // Probar derrape / skid al cambiar de direccion bruscamente
      const skidLogs = [];
      for (let t = 0; t < 10; t += 1) {
        g.step(1, ['move-left']);
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
        const snap = g.snapshot();
        const p = snap.entities.find(e => e.id === 'player');
        skidLogs.push({
          t,
          skidTicks: p.skidTicks,
          clip: pSprite.anims.currentAnim ? pSprite.anims.currentAnim.key : null,
          frame: pSprite.frame ? pSprite.frame.name : null,
          dataUrl: p.skidTicks > 0 ? canvas.toDataURL('image/png') : null
        });
      }

      return { logs, frameCaptures, skidLogs };
    })()`);

    console.log('Registro de cuadros durante la carrera activa:');
    const framesUsed = new Set();
    for (const r of runResult.logs) {
      framesUsed.add(r.frame);
      console.log(`  Tick ${r.tick}: x=${r.x.toFixed(1)}, vx=${r.vx.toFixed(1)} px/s, clip=${r.clip}, frame=${r.frame}`);
    }

    console.log(`\nCuadros únicos activados durante la carrera: [${Array.from(framesUsed).join(', ')}]`);
    console.log(`Total de cuadros únicos usados en carrera: ${framesUsed.size}`);

    // Guardar capturas de la carrera activa
    const runShot = runResult.frameCaptures[runResult.frameCaptures.length - 1];
    const runPath1x = path.join(OUTPUT_DIR, 'live_kratos_run_deck_1x.png');
    const runPath4x = path.join(OUTPUT_DIR, 'live_kratos_run_deck_4x.png');
    fs.writeFileSync(runPath1x, Buffer.from(runShot.dataUrl.replace(/^data:image\/png;base64,/, ''), 'base64'));

    execSync(`python3 -c "
from PIL import Image
im = Image.open('${runPath1x}')
up = im.resize((im.width * 4, im.height * 4), Image.NEAREST)
up.save('${runPath4x}')
# Crop player at running position
crop = im.crop((230, 200, 330, 265))
crop4x = crop.resize((crop.width * 4, crop.height * 4), Image.NEAREST)
crop4x.save('${path.join(OUTPUT_DIR, 'live_kratos_run_closeup_4x.png')}')
"`);

    console.log('Guardada captura carrera 4x:', runPath4x);

    // Verificar activación de skid
    const skidEvent = runResult.skidLogs.find(s => s.skidTicks > 0);
    console.log('\n--- 3. Verificación de derrape / turnaround skid ---');
    console.log('Evento de derrape encontrado:', skidEvent);
    if (skidEvent && skidEvent.dataUrl) {
      const skidPath1x = path.join(OUTPUT_DIR, 'live_kratos_skid_deck_1x.png');
      const skidPath4x = path.join(OUTPUT_DIR, 'live_kratos_skid_deck_4x.png');
      fs.writeFileSync(skidPath1x, Buffer.from(skidEvent.dataUrl.replace(/^data:image\/png;base64,/, ''), 'base64'));
      execSync(`python3 -c "
from PIL import Image
im = Image.open('${skidPath1x}')
up = im.resize((im.width * 4, im.height * 4), Image.NEAREST)
up.save('${skidPath4x}')
"`);
      console.log('Guardada captura skid 4x:', skidPath4x);
    }

    // Copiar artefactos al brain
    if (fs.existsSync(BRAIN_DIR)) {
      fs.copyFileSync(idlePath4x, path.join(BRAIN_DIR, 'kratos-idle-deck-4x.png'));
      fs.copyFileSync(runPath4x, path.join(BRAIN_DIR, 'kratos-run-deck-4x.png'));
      fs.copyFileSync(path.join(OUTPUT_DIR, 'live_kratos_idle_closeup_4x.png'), path.join(BRAIN_DIR, 'kratos-idle-closeup-4x.png'));
      fs.copyFileSync(path.join(OUTPUT_DIR, 'live_kratos_run_closeup_4x.png'), path.join(BRAIN_DIR, 'kratos-run-closeup-4x.png'));
      console.log('Copias de artefactos 4x guardadas en brain exitosamente.');
    }

    if (consoleErrors.length > 0) {
      console.warn('Errores de consola:', consoleErrors);
    } else {
      console.log('\n¡CERO errores de consola detectados!');
    }

    ws.close();
  } finally {
    if (chromeProcess) chromeProcess.kill('SIGTERM');
    if (viteProcess) viteProcess.kill('SIGTERM');
  }
}

main().catch((err) => {
  console.error('Fallo en la prueba en vivo:', err);
  process.exit(1);
});
