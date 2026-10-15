#!/usr/bin/env python3
"""Genera un spritesheet de carrera PROVISIONAL (placeholder procedural).

Deriva N cuadros de la pose neutral `public/assets/characters/kratos-neutral.png`
manteniendo la misma rejilla de cuadro (97x59), el mismo anclaje de pies (la
fila inferior no se desplaza) y la paleta indexada + transparencia del original.

La variacion es un balanceo/inclinacion minima de placeholder: un desplazamiento
horizontal por columnas que se interpola entre la cabeza (fila 0), la cadera
(fila media) y los pies (fila inferior, anclada). No es arte final.

Uso:
    python3 scripts/gen-run-frames.py

Salida:
    public/assets/characters/kratos-run.png  (spritesheet horizontal, 97*N x 59)

Requiere Pillow (ya disponible); no anade dependencias al proyecto.
"""

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "public/assets/characters/kratos-neutral.png"
OUTPUT = ROOT / "public/assets/characters/kratos-run.png"

FRAME_WIDTH = 97
FRAME_HEIGHT = 59
MID_ROW = 30

# (head_dx, hip_dx) en px logicos. Fila de pies siempre anclada a 0.
# Ningun cuadro es identico a la pose neutral (todos tienen inclinacion minima),
# para que la carrera se distinga de reposo desde el primer cuadro del ciclo.
FRAMES = (
    (1, 0),
    (1, -1),
    (0, 1),
    (-1, 1),
)


def iround(value: float) -> int:
    return int(value + 0.5) if value >= 0 else -int(-value + 0.5)


def column_shift(row: int, head_dx: int, hip_dx: int) -> int:
    if row >= FRAME_HEIGHT - 1:
        return 0
    if row >= MID_ROW:
        t = (FRAME_HEIGHT - 1 - row) / (FRAME_HEIGHT - 1 - MID_ROW)
        return iround(hip_dx * t)
    t = row / MID_ROW
    return iround(head_dx + (hip_dx - head_dx) * t)


def main() -> None:
    source = Image.open(SOURCE)
    if source.mode != "P":
        raise SystemExit(f"Se esperaba modo P, se obtuvo {source.mode}")
    if source.size != (FRAME_WIDTH, FRAME_HEIGHT):
        raise SystemExit(f"Se esperaba {FRAME_WIDTH}x{FRAME_HEIGHT}, se obtuvo {source.size}")

    width, height = source.size
    palette = source.getpalette()
    transparency = source.info.get("transparency")
    indices = list(source.getdata())
    transparent_index = 0

    def sample(x: int, y: int) -> int:
        if 0 <= x < width and 0 <= y < height:
            return indices[y * width + x]
        return transparent_index

    shifts = [
        [column_shift(y, head_dx, hip_dx) for y in range(height)]
        for head_dx, hip_dx in FRAMES
    ]

    sheet_pixels = []
    for y in range(height):
        for shift in shifts:
            for x in range(width):
                sheet_pixels.append(sample(x - shift[y], y))

    sheet = Image.new("P", (width * len(FRAMES), height))
    sheet.putpalette(palette)
    if transparency is not None:
        sheet.info["transparency"] = transparency
    sheet.putdata(sheet_pixels)
    sheet.save(OUTPUT)

    print(f"fuente : {SOURCE} {source.size} {source.mode}")
    print(f"salida : {OUTPUT} {sheet.size} {sheet.mode}")
    print(f"cuadros: {len(FRAMES)}  rejilla: {FRAME_WIDTH}x{FRAME_HEIGHT}")
    for frame_index, params in enumerate(FRAMES):
        frame = sheet.crop(
            (frame_index * width, 0, (frame_index + 1) * width, height)
        )
        alpha = frame.info.get("transparency") or transparency
        pixels = list(frame.getdata())
        opaque = [i for i, idx in enumerate(pixels) if (alpha[idx] if alpha and idx < len(alpha) else 255) > 0]
        xs = [i % width for i in opaque]
        ys = [i // width for i in opaque]
        tail = pixels[(height - 1) * width : height * width]
        source_tail = indices[(height - 1) * width : height * width]
        print(
            f"  frame {frame_index} params={params}: opacos={len(opaque)} "
            f"bbox=({min(xs)},{min(ys)})-({max(xs)},{max(ys)}) "
            f"fila_pies_intacta={tail == source_tail}"
        )


if __name__ == "__main__":
    main()
