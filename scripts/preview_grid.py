#!/usr/bin/env python3
"""Render an enlarged preview of ASCII grids with coordinate rulers.

Authoring aid only: it never writes into grids/ or public/. Use it to read
positions ("elbow at x=14, y=30") instead of counting characters.

Usage:
    python3 scripts/preview_grid.py grids/kratos/idle-00.txt --out /tmp/idle-00-preview.png
    python3 scripts/preview_grid.py grids/kratos/idle-00.txt grids/kratos/master.txt \
        --palette palette/kratos.json --palette palette/master.json --out /tmp/compare.png

Each grid is drawn at `--scale` x with a ruler: a tick every 5 px and a label
every 10 px. Several grids are placed side by side (one palette per grid, or a
single palette for all).
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from PIL import Image, ImageDraw

sys.path.insert(0, str(Path(__file__).resolve().parent))
from ascii_to_png import load_grid, load_palette, rasterize  # noqa: E402

RULER = 22
GAP = 16
BACKGROUND = (40, 44, 52, 255)
CHECKER = ((74, 78, 88, 255), (64, 68, 78, 255))
TICK = (190, 190, 200, 255)
GROUND = (255, 80, 80, 255)


def checkerboard(width: int, height: int, scale: int) -> Image.Image:
    board = Image.new("RGBA", (width * scale, height * scale), BACKGROUND)
    draw = ImageDraw.Draw(board)
    for y in range(height):
        for x in range(width):
            draw.rectangle(
                [x * scale, y * scale, (x + 1) * scale - 1, (y + 1) * scale - 1],
                fill=CHECKER[(x + y) % 2],
            )
    return board


def render(grid_path: Path, palette_path: Path, scale: int, ground_row: int | None) -> Image.Image:
    lines = load_grid(grid_path)
    image = rasterize(lines, load_palette(palette_path))
    width, height = image.size
    board = checkerboard(width, height, scale)
    board.alpha_composite(image.resize((width * scale, height * scale), Image.Resampling.NEAREST))

    canvas = Image.new("RGBA", (width * scale + RULER, height * scale + RULER), BACKGROUND)
    canvas.paste(board, (RULER, RULER))
    draw = ImageDraw.Draw(canvas)
    for x in range(0, width, 5):
        long = x % 10 == 0
        draw.line([RULER + x * scale, RULER - (8 if long else 4), RULER + x * scale, RULER], fill=TICK)
        if long:
            draw.text((RULER + x * scale + 2, 2), str(x), fill=TICK)
    for y in range(0, height, 5):
        long = y % 10 == 0
        draw.line([RULER - (8 if long else 4), RULER + y * scale, RULER, RULER + y * scale], fill=TICK)
        if long:
            draw.text((1, RULER + y * scale + 2), str(y), fill=TICK)
    if ground_row is not None and 0 <= ground_row < height:
        y = RULER + (ground_row + 1) * scale - 1
        draw.line([RULER, y, RULER + width * scale, y], fill=GROUND)
    draw.text((RULER, height * scale + RULER - 12), f"{grid_path.name} {width}x{height}", fill=TICK)
    return canvas


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("grids", nargs="+", type=Path)
    parser.add_argument("--palette", action="append", type=Path, default=None,
                        help="palette JSON; repeat once per grid, or pass one for all")
    parser.add_argument("--scale", type=int, default=8)
    parser.add_argument("--ground-row", type=int, default=None,
                        help="draw the ground line under this row")
    parser.add_argument("--out", required=True, type=Path)
    args = parser.parse_args()

    palettes = args.palette or [Path("palette/master.json")]
    if len(palettes) not in (1, len(args.grids)):
        print("error: give one --palette for all grids or one per grid", file=sys.stderr)
        return 1
    if len(palettes) == 1:
        palettes = palettes * len(args.grids)

    try:
        tiles = [render(g, p, args.scale, args.ground_row) for g, p in zip(args.grids, palettes)]
    except (OSError, ValueError, KeyError) as error:
        print(f"error: {error}", file=sys.stderr)
        return 1

    width = sum(t.width for t in tiles) + GAP * (len(tiles) - 1)
    height = max(t.height for t in tiles)
    sheet = Image.new("RGBA", (width, height), BACKGROUND)
    x = 0
    for tile in tiles:
        sheet.paste(tile, (x, 0))
        x += tile.width + GAP

    args.out.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(args.out, format="PNG")
    print(f"{args.out} {sheet.size[0]}x{sheet.size[1]}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
