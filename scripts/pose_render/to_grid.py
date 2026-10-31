#!/usr/bin/env python3
"""Reduce a `render.py` image to a Kratos palette grid (D-34).

Usage:
    python3 scripts/pose_render/to_grid.py <render.png> <out.txt> [--ground ROW]

`--ground ROW` frames the pose so its lowest pixel sits on that row, for
actions whose root leaves the floor (jump, roll); without it the render keeps
the camera framing.

Each 8x8 block becomes one grid cell by majority vote of (material, tone, side).
Far-side cells that touch near-side cells become outline `o`, and an outline is
added around the silhouette. The output is a blockout: the finished frame adds
the idle head, tattoo and costume detail by hand.
"""

from __future__ import annotations

import sys

from PIL import Image

SCALE = 8
MATERIALS = {0.25: "skin", 0.5: "leather", 0.75: "foot"}
TONES = [0.2, 0.4, 0.6, 0.8]
# Palette roles per (material, side), indexed by tone from dark to lit.
ROLES = {
    ("skin", "near"): "dbms",
    ("skin", "far"): "ddbm",
    ("foot", "near"): "dbms",
    ("foot", "far"): "ddbm",
    ("leather", "near"): "ottl",
    ("leather", "far"): "tttl",
}
NEIGHBORS = ((1, 0), (-1, 0), (0, 1), (0, -1))


def to_linear(channel: int) -> float:
    value = channel / 255
    return value / 12.92 if value <= 0.04045 else ((value + 0.055) / 1.055) ** 2.4


def classify(pixel: tuple[int, int, int, int]) -> tuple[str, int, str] | None:
    if pixel[3] < 128:
        return None
    red, green, blue = (to_linear(c) for c in pixel[:3])
    material = MATERIALS[min(MATERIALS, key=lambda k: abs(k - red))]
    tone = min(range(len(TONES)), key=lambda i: abs(TONES[i] - green))
    return material, tone, "near" if blue > 0.55 else "far"


def main() -> int:
    args = sys.argv[1:]
    ground = None
    if "--ground" in args:
        at = args.index("--ground")
        ground = int(args[at + 1])
        del args[at : at + 2]
    if len(args) != 2:
        print(__doc__)
        return 2
    source, target = args
    image = Image.open(source).convert("RGBA")
    pixels = image.load()
    assert pixels is not None
    width, height = image.width // SCALE, image.height // SCALE
    cells: list[list[tuple[str, int, str] | None]] = [[None] * width for _ in range(height)]
    for by in range(height):
        for bx in range(width):
            votes: dict[tuple[str, int, str], int] = {}
            for y in range(by * SCALE, by * SCALE + SCALE):
                for x in range(bx * SCALE, bx * SCALE + SCALE):
                    kind = classify(pixels[x, y])  # type: ignore[arg-type]
                    if kind:
                        votes[kind] = votes.get(kind, 0) + 1
            if sum(votes.values()) * 2.5 >= SCALE * SCALE:
                cells[by][bx] = max(votes, key=lambda k: votes[k])

    grid = [["." if c is None else ROLES[(c[0], c[2])][c[1]] for c in row] for row in cells]
    for y in range(height):
        for x in range(width):
            cell = cells[y][x]
            if cell and cell[2] == "far":
                for dx, dy in NEIGHBORS:
                    nx, ny = x + dx, y + dy
                    other = cells[ny][nx] if 0 <= nx < width and 0 <= ny < height else None
                    if other and other[2] == "near":
                        grid[y][x] = "o"
    outlined = [row[:] for row in grid]
    for y in range(height):
        for x in range(width):
            if grid[y][x] == "." and any(
                0 <= x + dx < width and 0 <= y + dy < height and grid[y + dy][x + dx] != "."
                for dx, dy in NEIGHBORS
            ):
                outlined[y][x] = "o"
    if ground is not None:
        lowest = max(y for y, row in enumerate(outlined) if any(c != "." for c in row))
        shift = ground - lowest
        empty = ["."] * width
        if shift > 0:
            outlined = [empty[:] for _ in range(shift)] + outlined[:height - shift]
        elif shift < 0:
            outlined = outlined[-shift:] + [empty[:] for _ in range(-shift)]
    with open(target, "w", encoding="utf-8") as handle:
        handle.write("\n".join("".join(row) for row in outlined) + "\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
