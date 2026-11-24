// Captures the real game canvas (480x270 logical) with the HUD variant chosen in the URL.
// Usage: node scripts/verify/hud-shot.mjs <cdpPort> <url> <out.png> [ticks]
// Prints `frames N errors E failed F`; the result must be errors 0 and failed 0 (AGENTS.md).
// Easiest through scripts/verify/hud-shot.sh, which starts Vite and headless Chrome.
import { writeFileSync } from 'node:fs';
const [port, url, out, ticksArg] = [process.argv[2], process.argv[3], process.argv[4], process.argv[5]];
const waitTicks = Number(ticksArg ?? 60);
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
await send('Emulation.setDeviceMetricsOverride', { width: 960, height: 540, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url });
for (let i = 0; i < 100 && !(await evalJs('!!window.__GOW8B')); i += 1) await sleep(100);
await sleep(1500);
// The title screen starts the adventure with Enter (or Space).
await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13 });
await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13 });
await sleep(800);
// Same start as capture.mjs: load the playable scenario so the HUD is shown in play.
await evalJs(`window.__GOW8B.loadScenario('${process.env.SCENARIO ?? 'movement'}'); true`);
await sleep(300);
// Let some ticks run so the HUD has settled (ghost bar, critical pulse, counters).
for (let i = 0; i < 600; i += 1) {
  if ((await evalJs('window.__GOW8B.metrics().ticks')) >= waitTicks) break;
  await sleep(50);
}
const dataUrl = await evalJs("document.querySelector('canvas').toDataURL('image/png')");
writeFileSync(out, Buffer.from(dataUrl.split(',')[1], 'base64'));
const hud = await evalJs('JSON.stringify(window.__GOW8B.snapshot().entities.find((e) => e.kind === "player") ?? null)');
console.log(`hud state: ${hud}`);
console.log(`frames ${await evalJs('window.__GOW8B.metrics().ticks')} errors ${errors.length} failed ${failed.length}`);
for (const e of errors) console.log('error:', e);
for (const f of failed) console.log('failed:', f);
ws.close();
process.exit(0);
