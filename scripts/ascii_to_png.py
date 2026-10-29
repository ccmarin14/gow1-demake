#!/usr/bin/env python3
"""Deterministic ASCII grid -> PNG rasterizer.

Rules (see docs/planes/PIXEL-ART-ASCII-MASTER-01.md):
    - one character = one pixel
    - '.' is fully transparent
    - every other character must exist in the palette
    - no antialiasing, no scaling, no interpolation

Usage:
    python3 scripts/ascii_to_png.py --grid grids/kratos/master.txt \
        --palette palette/master.json --out /tmp/kratos-neutral.png
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from PIL import Image

TRANSPARENT = "."


def hex_to_rgba(value: str) -> tuple[int, int, int, int]:
    text = value.lstrip("#")
    if len(text) != 6:
        raise ValueError(f"invalid hex color: {value}")
    return (int(text[0:2], 16), int(text[2:4], 16), int(text[4:6], 16), 255)


def load_palette(path: Path) -> dict[str, str]:
    with path.open(encoding="utf-8") as handle:
        data = json.load(handle)
    colors = data["colors"]
    for char, value in colors.items():
        if len(char) != 1:
            raise ValueError(f"palette key must be a single character: {char!r}")
        if char == TRANSPARENT:
            raise ValueError(f"'{TRANSPARENT}' is reserved for transparency")
        hex_to_rgba(value)
    max_colors = int(data.get("max_colors", 12))
    if len(colors) > max_colors:
        raise ValueError(f"palette has {len(colors)} colors, max is {max_colors}")
    return colors


def load_grid(path: Path) -> list[str]:
    raw = path.read_text(encoding="utf-8")
    if "\r" in raw:
        raise ValueError("grid must use LF line endings (no CRLF)")
    if raw.startswith("\ufeff"):
        raise ValueError("grid must not contain a BOM")
    lines = raw.split("\n")
    while lines and lines[-1] == "":
        lines.pop()
    if not lines:
        raise ValueError("grid is empty")
    width = len(lines[0])
    for index, line in enumerate(lines):
        if len(line) != width:
            raise ValueError(f"line {index + 1}: {len(line)} chars, expected {width}")
    return lines


def rasterize(lines: list[str], colors: dict[str, str]) -> Image.Image:
    height = len(lines)
    width = len(lines[0])
    image = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    pixels = image.load()
    cache: dict[str, tuple[int, int, int, int]] = {}
    for y, line in enumerate(lines):
        for x, char in enumerate(line):
            if char == TRANSPARENT:
                continue
            if char not in colors:
                raise ValueError(f"character {char!r} at ({x},{y}) is not in the palette")
            rgba = cache.get(char)
            if rgba is None:
                rgba = hex_to_rgba(colors[char])
                cache[char] = rgba
            pixels[x, y] = rgba
    return image


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--grid", required=True, type=Path)
    parser.add_argument("--palette", required=True, type=Path)
    parser.add_argument("--out", required=True, type=Path)
    args = parser.parse_args()

    try:
        colors = load_palette(args.palette)
        lines = load_grid(args.grid)
        image = rasterize(lines, colors)
    except (OSError, ValueError, KeyError) as error:
        print(f"error: {error}", file=sys.stderr)
        return 1

    args.out.parent.mkdir(parents=True, exist_ok=True)
    image.save(args.out, format="PNG", optimize=False)
    print(f"{args.out} {image.size[0]}x{image.size[1]}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
