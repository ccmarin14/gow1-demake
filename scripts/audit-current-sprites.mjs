import { spawn, execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');
const BRAIN_DIR = '/home/ccmarin14/.gemini/antigravity-cli/brain/4e8c488d-41dd-4c59-b79d-efd3762ae28c';
const OUTPUT_DIR = path.resolve(__dirname, 'verification', 'output');

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const CDP_PORT = 9288;
const DEV_PORT = 5173;

async function runAudit() {
  console.log('=== AUDITORÍA VISUAL CON SKILLS: BROWSER-TESTING & PIXEL-ART-CONSISTENCY ===');
  console.log('Inspeccionando estado actual en http://localhost:' + DEV_PORT + '...');

  const chrome = spawn(
    'google-chrome',
    [
      `--remote-debugging-port=${CDP_PORT}`,
      '--headless=new',
      '--no-sandbox',
      '--disable-gpu',
      '--window-size=960,540',
      `http://localhost:${DEV_PORT}/`,
    ],
    { stdio: 'ignore' }
  );

  try {
    let target = null;
    for (let i = 0; i < 40; i += 1) {
      try {
        const res = await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`);
        const list = await res.json();
        target = list.find((t) => t.type === 'page' && t.url.includes(String(DEV_PORT)));
        if (target) break;
      } catch {}
      await sleep(150);
    }
    if (!target) throw new Error('No se encontró página en Chrome CDP');

    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      ws.addEventListener('open', resolve);
      ws.addEventListener('error', reject);
    });

    let nextId = 1;
    const pending = new Map();
    const consoleLogs = [];
    const consoleErrors = [];

    ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.method === 'Runtime.consoleAPICalled') {
        const text = msg.params.args.map((a) => a.value || a.description || '').join(' ');
        if (msg.params.type === 'error') {
          consoleErrors.push({ text, stack: msg.params.stackTrace });
        } else {
          consoleLogs.push({ type: msg.params.type, text });
        }
      }
      if (msg.method === 'Runtime.exceptionThrown') {
        consoleErrors.push(msg.params.exceptionDetails);
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

    console.log('Esperando inicialización del motor y primer cuadro estable...');
    for (let i = 0; i < 60; i += 1) {
      const ready = await evaluate(`Boolean(window.__GOW8B && window.__GOW8B.snapshot().frame > 5)`);
      if (ready) break;
      await sleep(100);
    }

    // Hook ShellScene de forma limpia
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
    await sleep(150);

    // 1. CAPTURA Y ANÁLISIS DEL ESTADO IDLE
    console.log('\n--- 1. Evaluando Kratos en Reposo (Idle) sobre la cubierta ---');
    await evaluate(`(async () => {
      const sc = window.__SHELL_SCENE;
      sc.simulation.advance = () => 0;
      window.__GOW8B.loadScenario('movement');
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    })()`);

    const idleData = await evaluate(`(() => {
      const sc = window.__SHELL_SCENE;
      const pSprite = sc.player;
      const snap = window.__GOW8B.snapshot();
      const p = snap.entities.find(e => e.id === 'player');
      const canvas = document.querySelector('canvas');
      return {
        x: p.x,
        y: p.y,
        texture: pSprite.texture.key,
        frame: pSprite.frame.name,
        dataUrl: canvas.toDataURL('image/png')
      };
    })()`);

    console.log('Estado Idle capturado:', {
      pos: `(${idleData.x}, ${idleData.y})`,
      texture: idleData.texture,
      frame: idleData.frame,
    });

    const idleRawPath = path.join(OUTPUT_DIR, 'audit_idle_raw.png');
    fs.writeFileSync(idleRawPath, Buffer.from(idleData.dataUrl.replace(/^data:image\/png;base64,/, ''), 'base64'));

    // 2. CAPTURA Y ANÁLISIS DEL ESTADO RUN (ZANCADA ACTIVA)
    console.log('\n--- 2. Evaluando Kratos en Carrera (Run) sobre la cubierta ---');
    const runData = await evaluate(`(async () => {
      const g = window.__GOW8B;
      const sc = window.__SHELL_SCENE;
      const pSprite = sc.player;
      const canvas = document.querySelector('canvas');

      // Dar 8 pasos a la derecha para entrar en plena carrera (frame 3 o 4 del ciclo)
      for (let t = 0; t < 8; t += 1) {
        g.step(1, ['move-right']);
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      }

      const snap = g.snapshot();
      const p = snap.entities.find(e => e.id === 'player');
      return {
        x: p.x,
        y: p.y,
        vx: p.vx,
        texture: pSprite.texture.key,
        frame: pSprite.frame.name,
        dataUrl: canvas.toDataURL('image/png')
      };
    })()`);

    console.log('Estado Run capturado:', {
      pos: `(${runData.x.toFixed(1)}, ${runData.y.toFixed(1)})`,
      vx: `${runData.vx.toFixed(1)} px/s`,
      texture: runData.texture,
      frame: runData.frame,
    });

    const runRawPath = path.join(OUTPUT_DIR, 'audit_run_raw.png');
    fs.writeFileSync(runRawPath, Buffer.from(runData.dataUrl.replace(/^data:image\/png;base64,/, ''), 'base64'));

    // 3. ANÁLISIS ANATÓMICO Y DE ARMAS MEDIANTE PYTHON (SKILL PIXEL-ART)
    console.log('\n--- 3. Ejecutando inspección anatómica y de coherencia (Python / Pillow) ---');
    const auditScript = `
import os
from PIL import Image, ImageChops, ImageDraw, ImageFont

# Rutas
idle_raw = Image.open('${idleRawPath}')
run_raw = Image.open('${runRawPath}')

idle_x, idle_y = ${idleData.x}, ${idleData.y}
run_x, run_y = int(round(${runData.x})), int(round(${runData.y}))

# Recortar Kratos exactamente centrado en sus coordenadas de anclaje (480x270 nativo)
# Dimensiones de corte: 120 x 80 px (centrado en x, pie en y)
def crop_character(canvas_img, cx, cy):
    x1 = int(cx - 60)
    y1 = int(cy - 65)
    x2 = int(cx + 60)
    y2 = int(cy + 15)
    return canvas_img.crop((x1, y1, x2, y2))

crop_idle = crop_character(idle_raw, idle_x, idle_y)
crop_run = crop_character(run_raw, run_x, run_y)

# Escalar 4x Nearest Neighbor
crop_idle_4x = crop_idle.resize((crop_idle.width * 4, crop_idle.height * 4), Image.NEAREST)
crop_run_4x = crop_run.resize((crop_run.width * 4, crop_run.height * 4), Image.NEAREST)

# Crear imagen compuesta LADO A LADO [Idle vs Run]
comp_w = crop_idle_4x.width + crop_run_4x.width + 20
comp_h = crop_idle_4x.height + 60
comp = Image.new('RGBA', (comp_w, comp_h), (18, 14, 16, 255))
draw = ImageDraw.Draw(comp)

# Pegar ambos
comp.paste(crop_idle_4x, (0, 50))
comp.paste(crop_run_4x, (crop_idle_4x.width + 20, 50))

# Rotulos
draw.rectangle([0, 0, crop_idle_4x.width, 45], fill=(35, 45, 55))
draw.text((15, 12), "[ ESTADO 1: REPOSO (IDLE) ]", fill=(240, 200, 80))

draw.rectangle([crop_idle_4x.width + 20, 0, comp_w, 45], fill=(35, 45, 55))
draw.text((crop_idle_4x.width + 35, 12), "[ ESTADO 2: CARRERA (RUN) ]", fill=(240, 200, 80))

# Guardar en brain y output
side_by_side_path = '${path.join(BRAIN_DIR, 'audit-side-by-side-idle-vs-run.png')}'
comp.save(side_by_side_path)
print(f'Compuesto lado a lado guardado en: {side_by_side_path}')

# 4. INSPECCIONAR EL SPRITE BASE (public/assets/characters/kratos-neutral.png)
neutral = Image.open('public/assets/characters/kratos-neutral.png')
print(f'Dimensiones neutral: {neutral.size}')

# Inspeccionar brazos y espadas en el sprite maestro
# Izquierda (brazo trasero): x=15..36, y=27..46
left_arm = neutral.crop((15, 27, 36, 46))
# Derecha (brazo delantero): x=56..81, y=28..46
right_arm = neutral.crop((56, 28, 81, 46))

# Contar píxeles de hoja plateada/fuego (runas C_FIRE=(255,140,26) o filo plateado)
def count_weapon_pixels(crop):
    fire_pts = 0
    blade_pts = 0
    for p in crop.getdata():
        if p[3] > 0:
            r, g, b = p[:3]
            if r > 200 and g > 100 and b < 50: # fuego runico
                fire_pts += 1
            elif r > 160 and g > 160 and b > 160: # filo
                blade_pts += 1
    return fire_pts, blade_pts

l_fire, l_blade = count_weapon_pixels(left_arm)
r_fire, r_blade = count_weapon_pixels(right_arm)
print(f'Brazo Izquierdo (trasero): fuego={l_fire}, filo={l_blade}')
print(f'Brazo Derecho (delantero): fuego={r_fire}, filo={r_blade}')

# Inspeccionar rostro en neutral (x=46..58, y=14..24)
face = neutral.crop((46, 14, 58, 24))
tattoo_pts = sum(1 for p in face.getdata() if p[3] > 0 and p[0] > 160 and p[1] < 60)
print(f'Pixeles de tatuaje rojo en rostro: {tattoo_pts}')
`;

    execSync(`python3 -c "${auditScript.replace(/"/g, '\\"')}"`, { stdio: 'inherit' });

    console.log('\n--- 4. Consola del navegador ---');
    console.log(`Errores de consola: ${consoleErrors.length}`);
    if (consoleErrors.length > 0) {
      console.warn('Errores:', consoleErrors);
    }
    console.log(`Logs de consola: ${consoleLogs.length}`);

    ws.close();
  } finally {
    chrome.kill();
  }
}

runAudit().catch((err) => {
  console.error('Error durante la auditoría:', err);
  process.exit(1);
});
