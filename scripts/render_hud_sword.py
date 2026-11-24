#!/usr/bin/env python3
"""Renders art/hud/chaos-blade.svg to the HUD sword PNGs (smooth and pixel art).

Usage: python3 scripts/render_hud_sword.py
Needs google-chrome (headless) and Pillow. Writes public/assets/ui/hud-sword-faithful.png (184x72,
antialiased) and hud-sword-pixel.png (184x72, 64 colors, binary alpha).
"""
import subprocess, tempfile, pathlib
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
svg = (ROOT / "art/hud/chaos-blade.svg").read_text()
S = 8
W, H = 184, 72
html = f'<html><body style="margin:0;background:transparent">{svg.replace("width=\"184\" height=\"72\"", f"width=\"{W*S}\" height=\"{H*S}\"")}</body></html>'
with tempfile.TemporaryDirectory() as tmp:
    page = pathlib.Path(tmp) / "p.html"; page.write_text(html)
    big = pathlib.Path(tmp) / "big.png"
    subprocess.run(["google-chrome", "--headless=new", "--disable-gpu", "--default-background-color=00000000",
                    f"--screenshot={big}", f"--window-size={W*S},{H*S}", f"file://{page}"], check=True, capture_output=True)
    img = Image.open(big).convert("RGBA")
out = ROOT / "public/assets/ui"; out.mkdir(parents=True, exist_ok=True)
smooth = img.resize((W, H), Image.LANCZOS)
smooth.save(out / "hud-sword-faithful.png")
# pixel art: alpha cut, 16-color palette, no dithering
rgb = Image.new("RGB", (W, H), (0, 0, 0))
rgb.paste(smooth, mask=smooth.split()[3])
q = rgb.quantize(colors=64, method=Image.MEDIANCUT, dither=Image.NONE).convert("RGB")
alpha = smooth.split()[3].point(lambda a: 255 if a >= 128 else 0)
px = q.convert("RGBA"); px.putalpha(alpha)
px.save(out / "hud-sword-pixel.png")
print("ok")
