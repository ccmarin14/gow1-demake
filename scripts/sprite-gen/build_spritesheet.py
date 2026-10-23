#!/usr/bin/env python3
"""Arma una hoja de sprites horizontal (N cuadros de 97x59) a partir de cuadros sueltos y la valida.

Uso: build_spritesheet.py SALIDA.png CUADRO1.png CUADRO2.png ... [--max-colors 12]

Validaciones (fallan con codigo 1 si no se cumplen):
- cada cuadro mide exactamente 97x59
- alfa binario (0 o 255), sin semitransparencias
- pies anclados: la fila inferior (y=58) tiene pixeles opacos
- total de colores opacos de la hoja <= --max-colors
- el tamano de la hoja es N*97 x 59
"""
import argparse
import sys

from PIL import Image

FRAME_W, FRAME_H = 97, 59


def validate_frame(path, img, errors):
    if img.size != (FRAME_W, FRAME_H):
        errors.append(f"{path}: tamano {img.size}, se esperaba {(FRAME_W, FRAME_H)}")
        return set()
    px = img.load()
    colors = set()
    feet = False
    for y in range(FRAME_H):
        for x in range(FRAME_W):
            r, g, b, a = px[x, y]
            if a not in (0, 255):
                errors.append(f"{path}: alfa no binario {a} en ({x},{y})")
                return colors
            if a:
                colors.add((r, g, b))
                if y == FRAME_H - 1:
                    feet = True
    if not feet:
        errors.append(f"{path}: sin pixeles opacos en la fila inferior (pies no anclados)")
    return colors


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("out")
    ap.add_argument("frames", nargs="+")
    ap.add_argument("--max-colors", type=int, default=12)
    args = ap.parse_args()

    errors = []
    all_colors = set()
    imgs = []
    for p in args.frames:
        img = Image.open(p).convert("RGBA")
        all_colors |= validate_frame(p, img, errors)
        imgs.append(img)
    if len(all_colors) > args.max_colors:
        errors.append(f"hoja con {len(all_colors)} colores opacos (maximo {args.max_colors})")
    if errors:
        print("FALLO:")
        for e in errors:
            print(" -", e)
        sys.exit(1)

    sheet = Image.new("RGBA", (FRAME_W * len(imgs), FRAME_H), (0, 0, 0, 0))
    for i, img in enumerate(imgs):
        sheet.paste(img, (i * FRAME_W, 0))
    sheet.save(args.out)
    print(f"OK {args.out}: {sheet.size}, {len(imgs)} cuadros, {len(all_colors)} colores")


if __name__ == "__main__":
    main()
