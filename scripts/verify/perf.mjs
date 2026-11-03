// Frame-time harness: node scripts/verify/perf.mjs <cdpPort> <url> <cpuRate> <seconds> <combo|idle> (env PROFILE=1 prints the top functions)
const [port, url, rate, secs, mode] = [process.argv[2], process.argv[3], Number(process.argv[4] ?? 1), Number(process.argv[5] ?? 6), process.argv[6] ?? 'combo'];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let target;
for (let i = 0; i < 50 && !target; i += 1) { try { target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json(); } catch { await sleep(200); } }
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));
let id = 0; const pending = new Map();
ws.addEventListener('message', (ev) => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
const send = (method, params = {}) => new Promise((r) => { id += 1; pending.set(id, r); ws.send(JSON.stringify({ id, method, params })); });
const evalJs = async (expr) => (await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })).result?.result?.value;
for (const d of ['Runtime', 'Page']) await send(`${d}.enable`);
await send('Emulation.setFocusEmulationEnabled', { enabled: true });
await send('Emulation.setDeviceMetricsOverride', { width: 800, height: 360, deviceScaleFactor: 2, mobile: true });
await send('Page.navigate', { url });
for (let i = 0; i < 100 && !(await evalJs('!!window.__GOW8B')); i += 1) await sleep(100);
await sleep(1500);
const key = async (k, code, vk) => { await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: k, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk }); await sleep(50); await send('Input.dispatchKeyEvent', { type: 'keyUp', key: k, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk }); };
await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: 400, y: 180, button: 'left', clickCount: 1 });
await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: 400, y: 180, button: 'left', clickCount: 1 });
await key(' ', 'Space', 32);
await sleep(800);
await evalJs("window.__GOW8B.loadScenario('legionnaire'); true");
await send('Emulation.setCPUThrottlingRate', { rate });
await evalJs(`(() => { window.__d = []; window.__t0 = performance.now(); window.__k0 = window.__GOW8B.metrics().ticks; let last = performance.now(); const loop = (ts) => { window.__d.push(ts - last); last = ts; if (window.__on !== false) requestAnimationFrame(loop); }; requestAnimationFrame(loop); return true; })()`);
if (process.env.PROFILE) { await send('Profiler.enable'); await send('Profiler.setSamplingInterval', { interval: 500 }); await send('Profiler.start'); }
const end = Date.now() + secs * 1000;
let n = 0;
while (Date.now() < end) {
  if (mode === 'combo') { await key(n % 5 === 4 ? 'i' : 'j', n % 5 === 4 ? 'KeyI' : 'KeyJ', n % 5 === 4 ? 73 : 74); n += 1; }
  await sleep(120);
}
await evalJs('window.__on = false; true');
const out = await evalJs(`(() => { const d = window.__d.slice(5).sort((a,b)=>a-b); const q = (p) => d[Math.min(d.length-1, Math.floor(d.length*p))]; const dt = (performance.now()-window.__t0)/1000; const ticks = window.__GOW8B.metrics().ticks - window.__k0; return { frames: d.length, p50: q(0.5), p95: q(0.95), p99: q(0.99), max: d[d.length-1], over50: d.filter(x=>x>50).length, ticksPerSec: ticks/dt }; })()`);
console.log(JSON.stringify({ rate, mode, ...out }));
if (process.env.PROFILE) {
  const prof = (await send('Profiler.stop')).result.profile;
  const self = new Map(); const byId = new Map(prof.nodes.map((n) => [n.id, n]));
  const dts = prof.timeDeltas; let total = 0;
  prof.samples.forEach((sid, i) => { const n = byId.get(sid); const k = `${n.callFrame.functionName || '(anon)'} ${n.callFrame.url.split('/').slice(-2).join('/')}:${n.callFrame.lineNumber}`; self.set(k, (self.get(k) ?? 0) + dts[i]); total += dts[i]; });
  const top = [...self.entries()].sort((a, b) => b[1] - a[1]).slice(0, 14);
  for (const [k, v] of top) console.log(`${(100 * v / total).toFixed(1).padStart(5)}%  ${k}`);
}
ws.close(); process.exit(0);
