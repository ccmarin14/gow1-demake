#!/usr/bin/env python3
"""Convierte un sprite pixel art generado por IA (fondo magenta) en un cuadro 97x59.

Pasos: clave de croma magenta -> recorte al bbox -> reduccion con filtro de caja ->
umbral de alfa (sin semitransparencias) -> cuantizacion a paleta -> anclaje de pies en y=58.

Uso: process_generated_sprite.py ENTRADA.jpg SALIDA.png [--colors N] [--scale S]
"""
import argparse

from PIL import Image

FRAME_W, FRAME_H = 97, 59


def key_magenta(img):
    rgb = img.convert("RGB")
    px = rgb.load()
    out = Image.new("RGBA", rgb.size, (0, 0, 0, 0))
    op = out.load()
    for y in range(rgb.height):
        for x in range(rgb.width):
            r, g, b = px[x, y]
            # magenta puro con tolerancia por artefactos JPEG
            if r > 170 and b > 170 and g < 110:
                continue
            op[x, y] = (r, g, b, 255)
    return out


def process(src, dst, colors, scale):
    keyed = key_magenta(Image.open(src))
    bbox = keyed.getbbox()
    crop = keyed.crop(bbox)
    size = (max(1, round(crop.width * scale)), max(1, round(crop.height * scale)))
    small = crop.resize(size, Image.BOX)
    # alfa binario
    a = small.split()[3].point(lambda v: 255 if v >= 128 else 0)
    small.putalpha(a)
    # cuantizacion adaptativa solo sobre pixeles opacos
    rgb = Image.new("RGB", small.size, (255, 0, 255))
    rgb.paste(small.convert("RGB"), mask=a)
    q = rgb.quantize(colors=colors, method=Image.MEDIANCUT, dither=Image.NONE).convert("RGB")
    out = Image.new("RGBA", small.size, (0, 0, 0, 0))
    out.paste(q, mask=a)
    # colocar en cuadro 97x59, centrado, pies en la fila 58
    frame = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))
    ox = (FRAME_W - out.width) // 2
    oy = FRAME_H - out.height
    frame.paste(out, (ox, oy), out)
    frame.save(dst)
    used = {p[:3] for p in frame.getdata() if p[3]}
    print("tamano", frame.size, "colores opacos", len(used), "bbox", frame.getbbox())


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("src")
    ap.add_argument("dst")
    ap.add_argument("--colors", type=int, default=12)
    ap.add_argument("--scale", type=float, default=56 / 870, help="factor fijo de reduccion (igual para todas las poses)")
    args = ap.parse_args()
    process(args.src, args.dst, args.colors, args.scale)
