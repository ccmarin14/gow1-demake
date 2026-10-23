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

const DEV_PORT = 5195;
const CDP_PORT = 9251;

console.log('=== KRATOS MASTER SPRITE - DECK PREVIEW CAPTURE ===');
console.log('Output directory:', OUTPUT_DIR);

let viteProcess = null;
let chromeProcess = null;

async function startVite() {
  console.log(`Iniciando servidor Vite en puerto ${DEV_PORT}...`);
  viteProcess = spawn('pnpm', ['exec', 'vite', '--port', String(DEV_PORT), '--strictPort'], {
    cwd: REPO_ROOT,
    stdio: 'ignore',
  });
  for (let i = 0; i < 40; i += 1) {
    try {
      const res = await fetch(`http://127.0.0.1:${DEV_PORT}/`);
      if (res.ok) {
        console.log('Servidor Vite listo!');
        return;
      }
    } catch {}
    await sleep(150);
  }
  throw new Error('Tiempo de espera agotado esperando Vite');
}

async function startChrome() {
  console.log(`Iniciando Google Chrome headless en puerto CDP ${CDP_PORT}...`);
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
  if (!target) throw new Error('No se encontró target de página en Chrome CDP');
  console.log('Chrome CDP listo! Target:', target.id);
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

    console.log('Navegando al juego en la cubierta del barco...');
    for (let i = 0; i < 60; i += 1) {
      const ready = await evaluate(`Boolean(window.__GOW8B && window.__GOW8B.snapshot().frame > 10)`);
      if (ready) break;
      await sleep(100);
    }

    // Esperar a que Kratos esté en reposo (idle) en la cubierta
    console.log('Esperando cuadro estable de Kratos en cubierta...');
    await sleep(800);

    const captureData = await evaluate(`(() => {
      const canvas = document.querySelector('canvas');
      if (!canvas) return null;
      const snap = window.__GOW8B.snapshot();
      const player = snap.entities.find((e) => e.id === 'player');
      return {
        dataUrl: canvas.toDataURL('image/png'),
        width: canvas.width,
        height: canvas.height,
        frame: snap.frame,
        playerPos: player ? { x: player.x, y: player.y, anim: player.currentAnim } : null,
      };
    })()`);

    if (!captureData) {
      throw new Error('No se pudo encontrar el canvas de Phaser');
    }

    console.log('Captura realizada con éxito:', {
      width: captureData.width,
      height: captureData.height,
      frame: captureData.frame,
      playerPos: captureData.playerPos,
    });

    const base64Data = captureData.dataUrl.replace(/^data:image\/png;base64,/, '');
    const out1x = path.join(OUTPUT_DIR, 'kratos_deck_preview_1x.png');
    fs.writeFileSync(out1x, Buffer.from(base64Data, 'base64'));
    console.log(`Guardada captura 1x: ${out1x}`);

    // Generar la versión 4x usando Nearest Neighbor con Pillow
    const out4x = path.join(OUTPUT_DIR, 'kratos_deck_preview_4x.png');
    execSync(`python3 -c "
from PIL import Image
im = Image.open('${out1x}')
up = im.resize((im.width * 4, im.height * 4), Image.NEAREST)
up.save('${out4x}')
print('Escalado 4x nearest neighbor:', up.size)
"`, { stdio: 'inherit' });

    console.log(`Guardada captura 4x: ${out4x}`);

    // Copiar al directorio de artefactos del brain
    if (fs.existsSync(BRAIN_DIR)) {
      const targetBrainPath = path.join(BRAIN_DIR, 'kratos-master-preview-4x.png');
      fs.copyFileSync(out4x, targetBrainPath);
      console.log(`Copiada captura 4x para visualización directa en brain: ${targetBrainPath}`);
    } else {
      console.warn(`Directorio brain no encontrado: ${BRAIN_DIR}`);
    }

    if (consoleErrors.length > 0) {
      console.warn('Errores de consola detectados:', consoleErrors);
    } else {
      console.log('Cero errores de consola detectados.');
    }

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

main().catch((err) => {
  console.error('Error fatal durante la captura:', err);
  process.exit(1);
});
