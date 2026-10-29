#!/usr/bin/env python3
"""Validate the landmarks of a hand-drawn ASCII frame, and compare two frames.

A landmarks file does not draw anything: it fixes where each body part must fall
and which material (palette role) must be there. Authoring aid for agents
(docs/direccion.md section 5); it never writes into grids/.

File format (grids/<character>/<frame>.landmarks.json):
    {
      "grid": "idle-00.txt",
      "palette": "kratos.json",            # optional, default palette/kratos.json
      "points": {
        "head_top":   {"x": 31, "y": 6,  "roles": ["outline", "skin_lit"]},
        "left_foot":  {"x": 24, "y": 55, "roles": ["outline", "leather_dark"], "ground": true}
      }
    }

Checks for every point:
    - inside the canvas and not on a transparent pixel
    - the pixel's role is one of `roles` (when given; the palette needs `roles`)
    - `ground: true` points sit exactly on the ground row (last row of the grid
      unless `--ground-row` is given)

Usage:
    python3 scripts/check_landmarks.py grids/kratos/idle-00.landmarks.json
    python3 scripts/check_landmarks.py b.landmarks.json --delta a.landmarks.json \
        --points left_foot,right_foot --min 2 --max 8

`--delta` compares the same-named points of two frames (x then y displacement
and Euclidean distance). With `--min`/`--max` it fails when a listed point moved
less or more than that many pixels: the stride check between consecutive frames.
"""

from __future__ import annotations

import argparse
import json
import math
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from ascii_to_png import TRANSPARENT, load_grid  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent


def load_landmarks(path: Path) -> dict:
    data = json.loads(path.read_text(encoding="utf-8"))
    if "grid" not in data or "points" not in data:
        raise ValueError(f"{path.name}: needs 'grid' and 'points'")
    for name, point in data["points"].items():
        if not isinstance(point.get("x"), int) or not isinstance(point.get("y"), int):
            raise ValueError(f"{path.name}: point '{name}' needs integer x and y")
    return data


def load_roles(palette_path: Path) -> dict[str, str]:
    data = json.loads(palette_path.read_text(encoding="utf-8"))
    roles = data.get("roles")
    if not roles:
        raise ValueError(f"{palette_path.name}: no 'roles' (cannot check materials)")
    return roles


def check_frame(path: Path, ground_row: int | None) -> tuple[int, dict]:
    data = load_landmarks(path)
    grid = load_grid(path.parent / data["grid"])
    height, width = len(grid), len(grid[0])
    palette_name = data.get("palette", "kratos.json")
    roles = load_roles(ROOT / "palette" / palette_name)
    ground = height - 1 if ground_row is None else ground_row

    failures = 0
    for name, point in data["points"].items():
        x, y = point["x"], point["y"]
        if not (0 <= x < width and 0 <= y < height):
            print(f"FAIL {name}: ({x},{y}) outside the {width}x{height} canvas")
            failures += 1
            continue
        char = grid[y][x]
        if char == TRANSPARENT:
            print(f"FAIL {name}: ({x},{y}) is transparent")
            failures += 1
            continue
        role = roles.get(char, "?")
        wanted = point.get("roles")
        if wanted and role not in wanted:
            print(f"FAIL {name}: ({x},{y}) is '{char}' ({role}), expected one of {wanted}")
            failures += 1
            continue
        if point.get("ground") and y != ground:
            print(f"FAIL {name}: ground point at y={y}, ground row is {ground}")
            failures += 1
            continue
        print(f"ok   {name}: ({x},{y}) '{char}' {role}")
    return failures, data


def compare(a: dict, b: dict, names: list[str] | None, low: float | None, high: float | None) -> int:
    shared = [n for n in a["points"] if n in b["points"]]
    chosen = names if names else shared
    failures = 0
    for name in chosen:
        if name not in a["points"] or name not in b["points"]:
            print(f"FAIL delta {name}: missing in one of the frames")
            failures += 1
            continue
        dx = b["points"][name]["x"] - a["points"][name]["x"]
        dy = b["points"][name]["y"] - a["points"][name]["y"]
        dist = math.hypot(dx, dy)
        bad = (low is not None and dist < low) or (high is not None and dist > high)
        print(f"{'FAIL' if bad else 'ok  '} delta {name}: dx={dx:+d} dy={dy:+d} dist={dist:.1f}")
        failures += int(bad)
    return failures


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("landmarks", type=Path)
    parser.add_argument("--ground-row", type=int, default=None)
    parser.add_argument("--delta", type=Path, help="landmarks file of the previous frame")
    parser.add_argument("--points", help="comma-separated point names for --delta")
    parser.add_argument("--min", type=float, default=None, dest="low")
    parser.add_argument("--max", type=float, default=None, dest="high")
    args = parser.parse_args()

    try:
        failures, current = check_frame(args.landmarks, args.ground_row)
        if args.delta:
            previous = load_landmarks(args.delta)
            names = args.points.split(",") if args.points else None
            failures += compare(previous, current, names, args.low, args.high)
    except (OSError, ValueError, KeyError, json.JSONDecodeError) as error:
        print(f"error: {error}", file=sys.stderr)
        return 1

    print("all landmarks ok" if not failures else f"{failures} landmark check(s) failed")
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
