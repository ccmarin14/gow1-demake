#!/usr/bin/env python3
"""Bootstrap importer: existing PNG -> ASCII grid (+ optional palette).

This tool exists to seed the pipeline from the current assets. It is not the
production path: once a master grid exists, art is edited in the grid.

Usage:
    # first time: emit the palette from the image
    python3 scripts/png_to_ascii.py --png public/assets/characters/kratos-neutral.png \
        --grid grids/kratos/master.txt --palette palette/master.json --emit-palette

    # afterwards: reuse the existing palette and reject unknown colors
    python3 scripts/png_to_ascii.py --png <png> --grid <grid> --palette palette/master.json
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from PIL import Image

TRANSPARENT = "."
CHARS = "abcdefghijklmnopqrstuvwxyz"
MAX_COLORS = 12


def luminance(rgb: tuple[int, int, int]) -> float:
    r, g, b = rgb
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def read_pixels(path: Path) -> tuple[int, int, list[tuple[int, int, int, int]]]:
    image = Image.open(path).convert("RGBA")
    width, height = image.size
    pixels = list(image.getdata())
    alphas = {pixel[3] for pixel in pixels}
    if not alphas <= {0, 255}:
        raise ValueError(f"{path.name}: alpha must be binary, found {sorted(alphas)}")
    return width, height, pixels


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--png", required=True, type=Path)
    parser.add_argument("--grid", required=True, type=Path)
    parser.add_argument("--palette", required=True, type=Path)
    parser.add_argument("--emit-palette", action="store_true")
    args = parser.parse_args()

    try:
        width, height, pixels = read_pixels(args.png)
        opaque = {
            pixel[:3] for pixel in pixels if pixel[3] == 255
        }
        if len(opaque) > MAX_COLORS:
            raise ValueError(f"{args.png.name}: {len(opaque)} colors, max is {MAX_COLORS}")

        if args.emit_palette or not args.palette.exists():
            ordered = sorted(opaque, key=lambda rgb: (-luminance(rgb), rgb))
            mapping = {
                CHARS[index]: "#{:02x}{:02x}{:02x}".format(*rgb)
                for index, rgb in enumerate(ordered)
            }
            args.palette.parent.mkdir(parents=True, exist_ok=True)
            args.palette.write_text(
                json.dumps(
                    {
                        "version": 1,
                        "max_colors": MAX_COLORS,
                        "colors": mapping,
                    },
                    indent=2,
                )
                + "\n",
                encoding="utf-8",
            )
            print(f"palette: {len(mapping)} colors -> {args.palette}")
        else:
            data = json.loads(args.palette.read_text(encoding="utf-8"))
            mapping = data["colors"]

        color_to_char = {
            tuple(int(value.lstrip("#")[i:i + 2], 16) for i in (0, 2, 4)): char
            for char, value in mapping.items()
        }
        missing = opaque - set(color_to_char)
        if missing:
            raise ValueError(
                "colors missing from palette: "
                + ", ".join("#{:02x}{:02x}{:02x}".format(*rgb) for rgb in sorted(missing))
            )

        rows: list[str] = []
        for y in range(height):
            row = []
            for x in range(width):
                pixel = pixels[y * width + x]
                row.append(TRANSPARENT if pixel[3] == 0 else color_to_char[pixel[:3]])
            rows.append("".join(row))

        args.grid.parent.mkdir(parents=True, exist_ok=True)
        args.grid.write_text("\n".join(rows) + "\n", encoding="utf-8")
        print(f"grid: {width}x{height} -> {args.grid}")
    except (OSError, ValueError, KeyError) as error:
        print(f"error: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
