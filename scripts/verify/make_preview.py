"""GIF, key-tick strip and reference-vs-game sheet from a capture.json."""
import json, os, sys, base64, io
from PIL import Image, ImageDraw
cap, outdir, refdir, tag = sys.argv[1:5]
import os
REF_T0 = float(os.environ.get('REF_T0', '19.9'))
KEYS = os.environ.get('KEYS')
REFS = os.environ.get('REFS')
fr = json.load(open(cap))['frames']
X0, Y0, W, H, Z = [int(v) for v in os.environ.get('CROP', '150,182,160,88').split(',')] + [4]
by_frame = {}
for f in fr:
    if f.get('ex') is None: continue
    by_frame[f['frame']] = f
frames = sorted(by_frame)
start = max(frames[0], min(k for k in frames if by_frame[k]["strike"]) - 4)
end = max(k for k in frames if by_frame[k]['strike']) + 10
def img(f):
    im = Image.open(io.BytesIO(base64.b64decode(f['img'].split(',')[1]))).convert('RGB')
    return im.crop((X0, Y0, X0 + W, Y0 + H))
def at(k):
    ks = [x for x in frames if x <= k]
    return by_frame[ks[-1]]
seq = []
for n, k in enumerate(range(start, end + 1, 2)):
    seq.append(img(at(k)).resize((W * Z, H * Z), Image.NEAREST))
while len(seq) % 3: seq.append(seq[-1])
dur = [30 if i % 3 != 2 else 40 for i in range(len(seq))]
seq[0].save(f'{outdir}/{tag}.gif', save_all=True, append_images=seq[1:], duration=dur, loop=0)
print('gif frames', len(seq), 'mean ms', sum(dur) / len(dur))
def tick_frame(sid, tick):
    for k in frames:
        s = by_frame[k]['strike']
        if s and s['id'] == sid and s['tick'] == tick: return by_frame[k]
    for k in frames:
        s = by_frame[k]['strike']
        if s and s['id'] == sid and s['tick'] >= tick: return by_frame[k]
keys = [('square1', 9), ('square1', 20), ('square2', 0), ('square2', 3), ('square2', 4), ('square2', 5), ('square2', 6), ('square2', 7), ('square2', 9), ('square2', 13), ('square2', 19)]
if KEYS: keys = json.loads(KEYS)
Z2 = 3
strip = Image.new('RGB', (W * Z2 * len(keys), H * Z2 + 14), (0, 0, 0))
g = ImageDraw.Draw(strip)
for i, (sid, t) in enumerate(keys):
    f = tick_frame(sid, t)
    strip.paste(img(f).resize((W * Z2, H * Z2), Image.NEAREST), (i * W * Z2, 14))
    g.text((i * W * Z2 + 4, 1), f"{sid.replace('square', 'sq')} t{f['strike']['tick']}" + (' hitstop' if f['hitstop'] else ''), fill=(255, 255, 0))
strip.save(f'{outdir}/{tag}-strip.png')
# reference (top) vs game (bottom)
refs = [(19.97, ('square2', 1)), (20.03, ('square2', 4)), (20.07, ('square2', 5)), (20.10, ('square2', 6)), (20.17, ('square2', 7)), (20.27, ('square2', 12)), (20.37, ('square2', 19))]
if REFS: refs = [(r[0], tuple(r[1])) for r in json.loads(REFS)]
TW, TH = 390, 255
sheet = Image.new('RGB', (TW * len(refs), TH * 2 + 28), (0, 0, 0))
g = ImageDraw.Draw(sheet)
for i, (rt, (sid, t)) in enumerate(refs):
    idx = round((rt - REF_T0) * 30) + 1
    ref = Image.open(f'{refdir}/f{idx:03d}.png').convert('RGB').resize((TW, TH))
    # The reference faces left: mirror it so both face right (study only, D-04).
    ref = ref.transpose(Image.FLIP_LEFT_RIGHT)
    sheet.paste(ref, (i * TW, 14))
    g.text((i * TW + 4, 1), f'GoW1 {rt:.2f}s (mirrored)', fill=(255, 255, 0))
    f = tick_frame(sid, t)
    gm = img(f).resize((W * 2, H * 2), Image.NEAREST)
    sheet.paste(gm, (i * TW + (TW - W * 2) // 2, TH + 28 + (TH - H * 2) // 2 - 14))
    g.text((i * TW + 4, TH + 15), f"game {sid} t{f['strike']['tick']}", fill=(255, 255, 0))
sheet.save(f'{outdir}/{tag.split("-")[0]}-ref-vs-game-{tag.split("-")[1]}.png')
