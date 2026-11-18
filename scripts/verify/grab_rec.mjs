// Records every tick of a grab sequence from the real game (full canvas) -> docs/tmp/grab-rec/<name>/<tick>_<phase>_<grabTicks>.png (BL-45).
// Usage: node scripts/verify/grab_rec.mjs <cdpPort> <url> <name> <steps>   steps: comma list of l (○), j (□), i (△), wNNN (wait ms), @phase (wait for a grab phase)
import { writeFileSync, mkdirSync } from 'node:fs';
const [port, url, name, seq] = [process.argv[2], process.argv[3], process.argv[4], process.argv[5]];
const out = `docs/tmp/grab-rec/${name}`; mkdirSync(out, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let target; for (let i = 0; i < 50 && !target; i++) { try { target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json(); } catch { await sleep(200); } }
const ws = new WebSocket(target.webSocketDebuggerUrl); await new Promise((r) => ws.addEventListener('open', r));
let id = 0; const pending = new Map();
ws.addEventListener('message', (ev) => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
const send = (method, params = {}) => new Promise((r) => { id++; pending.set(id, r); ws.send(JSON.stringify({ id, method, params })); });
const ev = async (e) => (await send('Runtime.evaluate', { expression: e, awaitPromise: true, returnByValue: true })).result?.result?.value;
for (const d of ['Runtime', 'Page']) await send(`${d}.enable`);
await send('Emulation.setFocusEmulationEnabled', { enabled: true });
await send('Emulation.setDeviceMetricsOverride', { width: 960, height: 540, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url });
for (let i = 0; i < 100 && !(await ev('!!window.__GOW8B')); i++) await sleep(100);
await sleep(1500);
const K = { ' ': [' ', 'Space', 32], l: ['l', 'KeyL', 76], j: ['j', 'KeyJ', 74], i: ['i', 'KeyI', 73] };
const key = async (k, hold = 50) => { const [a, b, c] = K[k]; await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: a, code: b, windowsVirtualKeyCode: c, nativeVirtualKeyCode: c }); await sleep(hold); await send('Input.dispatchKeyEvent', { type: 'keyUp', key: a, code: b, windowsVirtualKeyCode: c, nativeVirtualKeyCode: c }); };
await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: 480, y: 270, button: 'left', clickCount: 1 });
await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: 480, y: 270, button: 'left', clickCount: 1 });
await key(' '); await sleep(600);
await ev(`(() => { window.__cap = []; window.__capOn = true; const c = document.querySelector('canvas'); let last = -1;
  const loop = () => { if (!window.__capOn) return; const g = window.__GOW8B; const t = g.metrics().ticks;
    if (t !== last) { last = t; const s = g.snapshot(); const p = s.entities.find((e) => e.kind === 'player');
      window.__cap.push({ t, ph: p.grabPhase ?? 'none', gt: p.grabTicks ?? 0, px: p.x, img: c.toDataURL('image/png') }); }
    requestAnimationFrame(loop); }; requestAnimationFrame(loop); return true; })()`);
await ev(`window.__GOW8B.loadScenario('legionnaire'); true`);
await sleep(400);
const phase = () => ev(`(window.__GOW8B.snapshot().entities.find(e=>e.kind==='player').grabPhase)||'none'`);
const waitPhase = async (ph, ms = 3000) => { for (let i = 0; i < ms / 10; i++) { if ((await phase()) === ph) return true; await sleep(10); } return false; };
for (const step of seq.split(',')) {
  if (step.startsWith('w')) { await sleep(Number(step.slice(1))); continue; }
  if (step.startsWith('@')) { await waitPhase(step.slice(1)); continue; }
  await key(step);
}
await sleep(900);
await ev('window.__capOn = false; true');
const n = await ev('window.__cap.length');
for (let i = 0; i < n; i += 10) { const part = await ev(`window.__cap.slice(${i},${i + 10})`); for (const f of part) writeFileSync(`${out}/${String(f.t).padStart(4, '0')}_${f.ph}_${f.gt}.png`, Buffer.from(f.img.split(',')[1], 'base64')); }
console.log('frames', n); ws.close(); process.exit(0);
