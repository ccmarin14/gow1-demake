"""Contact sheet of recorded grab ticks: python3 grab_sheet.py <dir> <fromTick> <toTick> <step> <cols> <out.png> [x0,y0,x1,y1]"""
import sys, glob, os
from PIL import Image, ImageDraw
d, start, end, step, cols, out = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), int(sys.argv[4]), int(sys.argv[5]), sys.argv[6]
box = tuple(int(v) for v in (sys.argv[7] if len(sys.argv) > 7 else '150,170,300,270').split(','))
S = 4
fs = sorted(glob.glob(d + '/*.png'))
fs = [f for f in fs if start <= int(os.path.basename(f).split('_')[0]) <= end][::step]
w, h = (box[2]-box[0])*S, (box[3]-box[1])*S
rows = (len(fs)+cols-1)//cols
im = Image.new('RGB', (cols*w, rows*h), (20,20,20))
dr = ImageDraw.Draw(im)
for i, f in enumerate(fs):
    t, ph, gt = os.path.basename(f)[:-4].split('_')
    c = Image.open(f).convert('RGB').crop(box).resize((w, h), Image.NEAREST)
    x, y = (i%cols)*w, (i//cols)*h
    im.paste(c, (x, y))
    dr.rectangle([x, y, x+170, y+14], fill=(0,0,0))
    dr.text((x+3, y+2), f'{t} {ph} {gt}', fill=(255,255,0))
im.save(out); print(len(fs), im.size)
