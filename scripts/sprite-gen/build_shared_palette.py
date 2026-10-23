#!/usr/bin/env python3
"""Construye una paleta compartida de N colores a partir de varias imagenes generadas (fondo magenta).

Uso: build_shared_palette.py SALIDA_PALETA.png IMG1.jpg IMG2.jpg ... [--colors 12] [--scale S]

Reduce cada imagen con la misma escala fija, las junta en un mosaico y cuantiza el mosaico completo,
de modo que todas las poses usen exactamente los mismos colores.
"""
import argparse
import os
import sys

from PIL import Image

sys.path.insert(0, os.path.dirname(__file__))
from process_generated_sprite import key_magenta  # noqa: E402


def reduced_opaque(src, scale):
    keyed = key_magenta(Image.open(src))
    crop = keyed.crop(keyed.getbbox())
    small = crop.resize((max(1, round(crop.width * scale)), max(1, round(crop.height * scale))), Image.BOX)
    a = small.split()[3].point(lambda v: 255 if v >= 128 else 0)
    rgb = Image.new("RGB", small.size, (255, 0, 255))
    rgb.paste(small.convert("RGB"), mask=a)
    return rgb, a


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("out")
    ap.add_argument("images", nargs="+")
    ap.add_argument("--colors", type=int, default=12)
    ap.add_argument("--scale", type=float, default=56 / 870)
    ap.add_argument("--accent", action="append", default=[], help="color hex reservado (ej. #b03028); se puede repetir")
    args = ap.parse_args()

    parts = [reduced_opaque(p, args.scale) for p in args.images]
    w = sum(r.width for r, _ in parts)
    h = max(r.height for r, _ in parts)
    mosaic = Image.new("RGB", (w, h), (255, 0, 255))
    x = 0
    for r, a in parts:
        mosaic.paste(r, (x, 0), a)
        x += r.width
    # cuantiza ignorando el fondo magenta: se reserva un color para el y se descarta despues
    q = mosaic.quantize(colors=args.colors - len(args.accent) + 1, method=Image.MEDIANCUT, dither=Image.NONE).convert("RGB")
    colors = {c for _, c in q.getcolors(10000)}
    # quita el color mas cercano al magenta de fondo
    bg = min(colors, key=lambda c: (c[0] - 255) ** 2 + c[1] ** 2 + (c[2] - 255) ** 2)
    colors.discard(bg)
    colors = sorted(colors)
    for h in args.accent:
        h = h.lstrip('#')
        colors.append(tuple(int(h[i:i + 2], 16) for i in (0, 2, 4)))
    pal = Image.new("RGB", (len(colors), 1))
    for i, c in enumerate(colors):
        pal.putpixel((i, 0), c)
    pal.save(args.out)
    print(f"paleta {args.out}: {len(colors)} colores")
    for c in colors:
        print("  #%02x%02x%02x" % c)


if __name__ == "__main__":
    main()
