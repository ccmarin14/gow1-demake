#!/usr/bin/env python3
"""Validate the ASCII grids of a character and optionally regenerate its PNGs.

Checks per grid (every frame in grids/<character>/manifest.json):
    - exact canvas size declared in the manifest (`frame_size`)
    - every character exists in the manifest's palette (`palette`, or a per-frame `palette`)
    - grounded frames have opaque pixels on the ground row (`anchors.ground`)
    - the PNG in public/assets/characters/ equals the rasterized grid

Usage:
    python3 scripts/check_grid.py [character]          # check only (default: kratos)
    python3 scripts/check_grid.py [character] --build  # rewrite the derived PNGs, then check
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from PIL import Image, ImageChops

sys.path.insert(0, str(Path(__file__).resolve().parent))
from ascii_to_png import TRANSPARENT, load_grid, load_palette, rasterize  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
def entries(manifest: dict) -> list[tuple[str, str, bool, str]]:
    """(grid file, png key, grounded, palette_file) for each drawn frame."""
    default_palette = manifest["palette"]
    items: list[tuple[str, str, bool, str]] = []
    for frame in manifest["frames"]:
        if frame.get("drawn", True):
            items.append((
                frame["file"],
                frame["png"],
                bool(frame.get("grounded", True)),
                frame.get("palette", default_palette),
            ))
    return items


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("character", nargs="?", default="kratos")
    parser.add_argument("--build", action="store_true", help="rewrite derived PNGs first")
    args = parser.parse_args()

    directory = ROOT / "grids" / args.character
    manifest = json.loads((directory / "manifest.json").read_text(encoding="utf-8"))
    png_dir_name = "ui" if args.character == "ui" else "characters"
    png_dir = ROOT / "public" / "assets" / png_dir_name
    width, height = manifest["frame_size"]["w"], manifest["frame_size"]["h"]
    ground = int(manifest["anchors"]["ground"])
    palette_cache: dict[str, dict[str, str]] = {}

    def get_colors(palette_name: str) -> dict[str, str]:
        if palette_name not in palette_cache:
            palette_cache[palette_name] = load_palette(ROOT / "palette" / palette_name)
        return palette_cache[palette_name]

    failures = 0

    def fail(name: str, message: str) -> None:
        nonlocal failures
        failures += 1
        print(f"FAIL {name}: {message}")

    for file_name, png_key, grounded, pal_name in entries(manifest):
        try:
            lines = load_grid(directory / file_name)
            image = rasterize(lines, get_colors(pal_name))
        except (OSError, ValueError) as error:
            fail(file_name, str(error))
            continue

        if image.size != (width, height):
            fail(file_name, f"size {image.size[0]}x{image.size[1]}, expected {width}x{height}")
        if grounded and all(char == TRANSPARENT for char in lines[ground]):
            fail(file_name, f"no opaque pixel on ground row {ground}")

        png_path = png_dir / f"{png_key}.png"
        if args.build:
            image.save(png_path, format="PNG", optimize=False)
        elif not png_path.exists():
            fail(file_name, f"missing derived PNG {png_path.relative_to(ROOT)}")
        elif ImageChops.difference(Image.open(png_path).convert("RGBA"), image).getbbox():
            fail(file_name, f"{png_path.relative_to(ROOT)} differs from the grid (run with --build)")
        else:
            print(f"ok   {file_name} -> {png_key}.png")

    if failures:
        return 1
    print("all grids ok")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
