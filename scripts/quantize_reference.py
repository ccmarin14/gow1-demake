#!/usr/bin/env python3
"""Quantize a reference PNG to a semantic palette, as a REFERENCE for hand drawing.

Authoring aid (docs/direccion.md section 5). It crops a region of an existing
image, maps every opaque pixel to the nearest color of a palette by RGB distance
(never by luminance order) and writes an ASCII reference. It is a starting
point to read and trace by hand, not a frame: it refuses to write into grids/,
which only receives hand-written grids (D-31).

Usage:
    python3 scripts/quantize_reference.py \
        --png public/assets/characters/kratos-neutral.png \
        --palette palette/kratos.json \
        --crop 30,14,68,57 --size 64x56 --ground-row 55 \
        --out docs/temporal/idle-00.reference.txt

`--crop x0,y0,x1,y1` is inclusive in source pixels. The crop is centered
horizontally on the canvas and its last row is placed on `--ground-row`.
Pixels farther than `--max-distance` from every palette color are dropped (they
are listed in the report so they can be redrawn by hand).
"""

from __future__ import annotations

import argparse
import collections
import sys
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
from ascii_to_png import hex_to_rgba, load_palette  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent


def nearest(rgb: tuple[int, int, int], palette: dict[str, tuple[int, int, int]]) -> tuple[str, float]:
    best, best_d = "", float("inf")
    for char, color in palette.items():
        # Weighted RGB distance (closer to perceived difference than plain RGB).
        dr, dg, db = rgb[0] - color[0], rgb[1] - color[1], rgb[2] - color[2]
        d = (2 * dr * dr + 4 * dg * dg + 3 * db * db) ** 0.5
        if d < best_d:
            best, best_d = char, d
    return best, best_d


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--png", required=True, type=Path)
    parser.add_argument("--palette", required=True, type=Path)
    parser.add_argument("--crop", required=True)
    parser.add_argument("--size", required=True, help="canvas WxH, for example 64x56")
    parser.add_argument("--ground-row", required=True, type=int)
    parser.add_argument("--max-distance", type=float, default=90.0)
    parser.add_argument("--out", required=True, type=Path)
    args = parser.parse_args()

    out = args.out.resolve()
    if (ROOT / "grids") in out.parents:
        print("error: refusing to write into grids/ (grids are written by hand, D-31)", file=sys.stderr)
        return 1

    try:
        x0, y0, x1, y1 = (int(v) for v in args.crop.split(","))
        width, height = (int(v) for v in args.size.lower().split("x"))
        colors = load_palette(args.palette)
        palette = {c: hex_to_rgba(h)[:3] for c, h in colors.items()}
        source = Image.open(args.png).convert("RGBA")
    except (OSError, ValueError) as error:
        print(f"error: {error}", file=sys.stderr)
        return 1

    crop_w, crop_h = x1 - x0 + 1, y1 - y0 + 1
    dest_x = (width - crop_w) // 2
    dest_y = args.ground_row - (crop_h - 1)
    if dest_x < 0 or dest_y < 0 or dest_x + crop_w > width or args.ground_row >= height:
        print(f"error: crop {crop_w}x{crop_h} does not fit the {width}x{height} canvas", file=sys.stderr)
        return 1

    pixels = source.load()
    grid = [["."] * width for _ in range(height)]
    counts: collections.Counter[str] = collections.Counter()
    dropped = 0
    for sy in range(y0, y1 + 1):
        for sx in range(x0, x1 + 1):
            r, g, b, a = pixels[sx, sy]
            if a < 128:
                continue
            char, dist = nearest((r, g, b), palette)
            if dist > args.max_distance:
                dropped += 1
                continue
            grid[dest_y + (sy - y0)][dest_x + (sx - x0)] = char
            counts[char] += 1

    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text("\n".join("".join(row) for row in grid) + "\n", encoding="utf-8")
    print(f"{args.out} {width}x{height}  crop {crop_w}x{crop_h} at ({dest_x},{dest_y})")
    print("letters:", dict(sorted(counts.items())), f"dropped(too far): {dropped}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
