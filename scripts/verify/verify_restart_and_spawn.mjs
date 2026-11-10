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
await send('Emulation.setDeviceMetricsOverride', { width: 960, height: 600, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url });

for (let i = 0; i < 100 && !(await evalJs('!!window.__GOW8B')); i += 1) await sleep(100);
await sleep(1500);

const key = async (k, code, vk, holdMs = 60) => {
  await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: k, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk });
  await sleep(holdMs);
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: k, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk });
};

console.log('=== TEST 1: Verificar existencia de botones en el DOM ===');
const buttonsExist = await evalJs(`(() => {
  return {
    restart: !!document.getElementById('btn-restart'),
    legionnaire: !!document.getElementById('btn-spawn-legionnaire'),
    archer: !!document.getElementById('btn-spawn-archer')
  };
})()`);
console.log('Botones en DOM:', buttonsExist);
if (!buttonsExist.restart || !buttonsExist.legionnaire || !buttonsExist.archer) {
  throw new Error('Faltan botones en el DOM');
}

console.log('=== TEST 2: Añadir legionario mediante click en botón ===');
const countBefore = await evalJs(`window.__GOW8B.snapshot().entities.length`);
await evalJs(`document.getElementById('btn-spawn-legionnaire').click()`);
await sleep(100);
const countAfterLeg = await evalJs(`window.__GOW8B.snapshot().entities.length`);
console.log(`Entidades antes: ${countBefore}, después de spawn legionario: ${countAfterLeg}`);
if (countAfterLeg !== countBefore + 1) {
  throw new Error('No se añadió el legionario');
}

console.log('=== TEST 3: Añadir arquero mediante click en botón ===');
await evalJs(`document.getElementById('btn-spawn-archer').click()`);
await sleep(100);
const countAfterArch = await evalJs(`window.__GOW8B.snapshot().entities.length`);
console.log(`Entidades después de spawn arquero: ${countAfterArch}`);
if (countAfterArch !== countAfterLeg + 1) {
  throw new Error('No se añadió el arquero');
}

console.log('=== TEST 4: Reiniciar escena mediante click en botón ===');
await evalJs(`document.getElementById('btn-restart').click()`);
await sleep(200);
const countAfterReset = await evalJs(`window.__GOW8B.snapshot().entities.length`);
console.log(`Entidades tras reiniciar escena: ${countAfterReset} (restablecido al escenario base)`);
if (countAfterReset !== countBefore) {
  throw new Error('El reinicio no restableció las entidades');
}

console.log('=== TEST 5: Atajos de teclado (P para legionario, R para reiniciar) ===');
// Enfocar canvas
await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: 480, y: 270, button: 'left', clickCount: 1 });
await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: 480, y: 270, button: 'left', clickCount: 1 });
await sleep(100);

await key('p', 'KeyP', 80);
await sleep(100);
const countKeyP = await evalJs(`window.__GOW8B.snapshot().entities.length`);
console.log(`Entidades tras pulsar tecla P: ${countKeyP}`);
if (countKeyP !== countBefore + 1) {
  throw new Error('Tecla P no añadió enemigo');
}

await key('r', 'KeyR', 82);
await sleep(150);
const countKeyR = await evalJs(`window.__GOW8B.snapshot().entities.length`);
console.log(`Entidades tras pulsar tecla R: ${countKeyR}`);
if (countKeyR !== countBefore) {
  throw new Error('Tecla R no reinició la escena');
}

console.log(`\nVerificación de reinicio y generación de enemigos completada sin errores.`);
console.log(`Errors: ${errors.length}, Failed requests: ${failed.length}`);

process.exit(errors.length === 0 && failed.length === 0 ? 0 : 1);
