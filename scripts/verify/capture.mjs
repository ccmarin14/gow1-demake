// Drives the real game in headless Chrome over CDP and records canvas + snapshot each rAF.
// Usage: node scripts/verify/capture.mjs <cdpPort> <url> <out.json> <chainAtTick> [strikeId:tick[:i]...]
// Env: SCENARIO (default movement), FIRST_KEY=i, HOLD_I_MS, JUMP_FIRST=1, JUMP_MS, NO_CHAIN_WAIT=1, TAIL_MS.
// Prints `frames N errors E failed F` (the browser check of AGENTS.md: 0 errors, 0 failed). Easiest through scripts/verify/browser-check.sh.
import { writeFileSync } from 'node:fs';
const [port, url, out, chainAt] = [process.argv[2], process.argv[3], process.argv[4], Number(process.argv[5] ?? 20)];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let target;
for (let i = 0; i < 50 && !target; i += 1) {
  try { target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json(); } catch { await sleep(200); }
}
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));
let id = 0; const pending = new Map(); const errors = []; const failed = [];
ws.addEventListener('message', (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); return; }
  if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.text + ' ' + (m.params.exceptionDetails.exception?.description ?? ''));
  if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errors.push(m.params.args.map((a) => a.value ?? a.description).join(' '));
  if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') errors.push(m.params.entry.text + ' ' + (m.params.entry.url ?? ''));
  if (m.method === 'Network.loadingFailed') failed.push(m.params.errorText + ' ' + m.params.requestId);
  if (m.method === 'Network.responseReceived' && m.params.response.status >= 400) failed.push(m.params.response.status + ' ' + m.params.response.url);
});
const send = (method, params = {}) => new Promise((r) => { id += 1; pending.set(id, r); ws.send(JSON.stringify({ id, method, params })); });
const evalJs = async (expr) => (await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })).result?.result?.value;
for (const d of ['Runtime', 'Log', 'Network', 'Page']) await send(`${d}.enable`);
await send('Emulation.setFocusEmulationEnabled', { enabled: true });
await send('Emulation.setDeviceMetricsOverride', { width: 960, height: 540, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url });
for (let i = 0; i < 100 && !(await evalJs('!!window.__GOW8B')); i += 1) await sleep(100);
await sleep(1500);
const key = async (k, code, vk) => {
  await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: k, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk });
  await sleep(60);
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: k, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk });
};
await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: 480, y: 270, button: 'left', clickCount: 1 });
await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: 480, y: 270, button: 'left', clickCount: 1 });
await key(' ', 'Space', 32);
await sleep(800);
await evalJs(`(() => { window.__cap = []; window.__capOn = true; const c = document.querySelector('canvas');
  const loop = (ts) => { if (!window.__capOn) return; const s = window.__GOW8B.snapshot();
    const p = s.entities.find((e) => e.kind === 'player'); const e = s.entities.find((e) => e.kind === 'legionnaire');
    window.__cap.push({ ts, frame: window.__GOW8B.metrics().ticks, strike: s.strike ?? null, hitstop: s.hitstopTicks, px: p.x, py: p.y, ex: e?.x, ehp: e?.hp, fires: (s.groundFires || []).length, img: c.toDataURL('image/png') });
    requestAnimationFrame(loop); }; requestAnimationFrame(loop); return true; })()`);
await sleep(100);
await evalJs("window.__GOW8B.loadScenario('" + (process.env.SCENARIO ?? 'movement') + "'); true");
await sleep(Number(process.env.FIRST_DELAY_MS ?? 30));
if (process.env.JUMP_FIRST) {
  await key(' ', 'Space', 32);
  await sleep(Number(process.env.JUMP_MS ?? 90));
}
if (process.env.HOLD_I_MS) {
  await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'i', code: 'KeyI', windowsVirtualKeyCode: 73, nativeVirtualKeyCode: 73 });
  await sleep(Number(process.env.HOLD_I_MS));
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'i', code: 'KeyI', windowsVirtualKeyCode: 73, nativeVirtualKeyCode: 73 });
} else if (process.env.FIRST_KEY === 'i') await key('i', 'KeyI', 73);
else await key('j', 'KeyJ', 74);
if (process.env.FIRST_KEY !== 'i' && !process.env.HOLD_I_MS && !process.env.NO_CHAIN_WAIT) {
  for (let i = 0; i < 300; i += 1) {
    const s = await evalJs('window.__GOW8B.snapshot().strike ?? null');
    if (s && s.id === 'square1' && s.tick >= chainAt) break;
    await sleep(5);
  }
  await key('j', 'KeyJ', 74);
}
// Further presses: argv[6..] are '<strikeId>:<tick>' links to wait for.
for (const link of process.argv.slice(6)) {
  const [id, tick, button] = link.split(':');
  for (let i = 0; i < 400; i += 1) {
    const s = await evalJs('window.__GOW8B.snapshot().strike ?? null');
    if (s && s.id === id && s.tick >= Number(tick)) break;
    await sleep(5);
  }
  if (button === 'i') await key('i', 'KeyI', 73);
  else await key('j', 'KeyJ', 74);
}
await sleep(Number(process.env.TAIL_MS ?? 1300));
await evalJs('window.__capOn = false; true');
const n = await evalJs('window.__cap.length');
const frames = [];
for (let i = 0; i < n; i += 20) frames.push(...(await evalJs(`window.__cap.slice(${i}, ${i + 20})`)));
writeFileSync(out, JSON.stringify({ errors, failed, frames }));
console.log(`frames ${frames.length} errors ${errors.length} failed ${failed.length}`);
for (const e of [...errors, ...failed]) console.log('  ', e);
ws.close();
process.exit(0);
