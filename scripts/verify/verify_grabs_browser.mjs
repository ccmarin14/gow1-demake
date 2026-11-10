import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const [port, url, outDir] = [
  process.argv[2],
  process.argv[3],
  process.argv[4] ?? 'docs/tmp/grab-verify',
];

mkdirSync(outDir, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let target;
for (let i = 0; i < 50 && !target; i += 1) {
  try {
    target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json();
  } catch {
    await sleep(200);
  }
}

const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));

let id = 0;
const pending = new Map();
const errors = [];
const failed = [];

ws.addEventListener('message', (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) {
    pending.get(m.id)(m);
    pending.delete(m.id);
    return;
  }
  if (m.method === 'Runtime.exceptionThrown') {
    errors.push(m.params.exceptionDetails.text + ' ' + (m.params.exceptionDetails.exception?.description ?? ''));
  }
  if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') {
    errors.push(m.params.args.map((a) => a.value ?? a.description).join(' '));
  }
  if (m.method === 'Network.loadingFailed') {
    failed.push(m.params.errorText + ' ' + m.params.requestId);
  }
  if (m.method === 'Network.responseReceived' && m.params.response.status >= 400) {
    failed.push(m.params.response.status + ' ' + m.params.response.url);
  }
});

const send = (method, params = {}) =>
  new Promise((r) => {
    id += 1;
    pending.set(id, r);
    ws.send(JSON.stringify({ id, method, params }));
  });

const evalJs = async (expr) =>
  (await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }))?.result?.result?.value;

for (const d of ['Runtime', 'Log', 'Network', 'Page']) await send(`${d}.enable`);
await send('Emulation.setFocusEmulationEnabled', { enabled: true });
await send('Emulation.setDeviceMetricsOverride', { width: 960, height: 540, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url });

for (let i = 0; i < 100 && !(await evalJs('!!window.__GOW8B')); i += 1) await sleep(100);
await sleep(1500);

const key = async (k, code, vk, holdMs = 60) => {
  await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: k, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk });
  await sleep(holdMs);
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: k, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk });
};

// Enfocar el canvas haciendo click
await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: 480, y: 270, button: 'left', clickCount: 1 });
await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: 480, y: 270, button: 'left', clickCount: 1 });
await key(' ', 'Space', 32);
await sleep(600);

const captureFrame = async (name) => {
  const dataUrl = await evalJs(`document.querySelector('canvas').toDataURL('image/png')`);
  if (dataUrl && dataUrl.startsWith('data:image/png;base64,')) {
    const buf = Buffer.from(dataUrl.replace('data:image/png;base64,', ''), 'base64');
    const path = resolve(outDir, `${name}.png`);
    writeFileSync(path, buf);
    console.log(`Saved screenshot: ${path}`);
  }
};

const getEntitySnap = async () => {
  return await evalJs(`(() => {
    const s = window.__GOW8B.snapshot();
    const p = s.entities.find(e => e.kind === 'player');
    const e = s.entities.find(e => e.kind === 'legionnaire');
    return {
      player: { x: p?.x, y: p?.y, grabPhase: p?.grabPhase, grabTicks: p?.grabTicks },
      enemy: { id: e?.id, x: e?.x, y: e?.y, aiState: e?.aiState, hp: e?.hp, isDead: e?.isDead, grounded: e?.grounded }
    };
  })()`);
};

console.log('=== PRUEBA 1: Grab 2 (○ -> △, Break / Ejecución brutal en cubierta) ===');
await evalJs(`window.__GOW8B.loadScenario('legionnaire'); true`);
await sleep(400);

// Agarrar con 'l' (Circle)
await key('l', 'KeyL', 76, 100);
await sleep(150);
let snap = await getEntitySnap();
console.log('Hold connected:', snap.player.grabPhase, 'enemy aiState:', snap.enemy.aiState, 'victim y:', snap.enemy.y);
await captureFrame('01_hold_initial');

// Pulsar 'i' (Triangle) para Break
await key('i', 'KeyI', 73, 100);
await sleep(150);
snap = await getEntitySnap();
console.log('Break started:', snap.player.grabPhase, 'ticks:', snap.player.grabTicks, 'victim y:', snap.enemy.y);
await captureFrame('02_break_overhead');

// Esperar al impacto y quiebre (tick 11 y conclusión)
await sleep(350);
snap = await getEntitySnap();
console.log('Break impact floor:', snap.player.grabPhase, 'victim y:', snap.enemy.y, 'isDead:', snap.enemy.isDead, 'grounded:', snap.enemy.grounded);
await captureFrame('03_break_impact_floor');

// Esperar recuperación
await sleep(400);
snap = await getEntitySnap();
console.log('Break finished (dead on floor):', snap.player.grabPhase, 'victim y:', snap.enemy.y, 'isDead:', snap.enemy.isDead);
await captureFrame('04_break_dead_on_floor');

console.log('=== PRUEBA 2: Grab 3 (○ -> □, Throw / Lanzamiento horizontal como proyectil) ===');
await evalJs(`window.__GOW8B.loadScenario('legionnaire'); true`);
await sleep(400);

// Agarrar con 'l' (Circle)
await key('l', 'KeyL', 76, 100);
await sleep(150);

// Pulsar 'j' (Square) para Throw
await key('j', 'KeyJ', 74, 100);
await sleep(60);
snap = await getEntitySnap();
console.log('Throw windup (horizontal hold):', snap.player.grabPhase, 'ticks:', snap.player.grabTicks, 'victim y:', snap.enemy.y);
await captureFrame('05_throw_windup_horizontal');

// Esperar liberación tick 6+
await sleep(180);
snap = await getEntitySnap();
console.log('Throw released (flying projectile):', snap.player.grabPhase, 'victim aiState:', snap.enemy.aiState, 'x:', snap.enemy.x, 'y:', snap.enemy.y);
await captureFrame('06_throw_flying_projectile');

await sleep(500);
await captureFrame('07_throw_landed');

console.log('=== PRUEBA 3: Grab 1 (○ -> ○ repetido, Stabbing con Espada del Caos) ===');
await evalJs(`window.__GOW8B.loadScenario('legionnaire'); true`);
await sleep(400);

// Agarrar con 'l' (Circle)
await key('l', 'KeyL', 76, 100);
await sleep(150);

// Estocada 1: pulsar 'l'
await key('l', 'KeyL', 76, 100);
await sleep(80); // tick ~4 impacto de estocada
snap = await getEntitySnap();
console.log('Stab 1 impact (blade in torso):', snap.player.grabPhase, 'ticks:', snap.player.grabTicks, 'enemy hp:', snap.enemy.hp);
await captureFrame('08_stab1_impact');

await sleep(250); // volver a hold
// Estocada 2: pulsar 'l'
await key('l', 'KeyL', 76, 100);
await sleep(80);
snap = await getEntitySnap();
console.log('Stab 2 impact:', snap.player.grabPhase, 'enemy hp:', snap.enemy.hp);
await captureFrame('09_stab2_impact');

await sleep(250);
// Estocada 3: remate con slam
await key('l', 'KeyL', 76, 100);
await sleep(200);
snap = await getEntitySnap();
console.log('Final slam transition:', snap.player.grabPhase, 'enemy hp:', snap.enemy.hp);
await captureFrame('10_stab_final_slam');

console.log(`\nBrowser test completed. Errors: ${errors.length}, Failed requests: ${failed.length}`);
if (errors.length > 0) console.error('Errors:', errors);
if (failed.length > 0) console.error('Failed requests:', failed);

process.exit(errors.length === 0 && failed.length === 0 ? 0 : 1);
