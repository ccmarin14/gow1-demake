#!/usr/bin/env python3
"""Derive animation frames for an ASCII master character.

The committed `.txt` grids stay the source of truth: this tool only produces
them from the master with integer translations of rasterized blocks (no vector
drawing, no trigonometry, no new shapes). Every frame it writes can be opened
and edited by hand afterwards.

Usage:
    python3 scripts/ascii_animate.py kratos --check
    python3 scripts/ascii_animate.py kratos --write
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
GRIDS = ROOT / "grids"
TRANSPARENT = "."

# Leg lift and shear are authored as explicit integer tables, never as a
# formula: the pose vocabulary is the art direction, not a math function.
# Each entry is (right_dx, right_lift, left_dx, left_lift).
RUN_POSES: list[tuple[int, int, int, int]] = [
    (2, 0, -3, 2),
    (1, 0, -2, 2),
    (0, 0, 0, 1),
    (-2, 1, 1, 0),
    (-3, 2, 2, 0),
    (-2, 2, 1, 0),
    (0, 1, 0, 0),
    (1, 0, -2, 1),
]

# Braking pose: both feet planted wide apart, no lift.
SKID_POSE: tuple[int, int, int, int] = (3, 0, -3, 0)

LEG_TOP = 47
LEG_BOTTOM = 57


def load_grid(path: Path) -> list[str]:
    raw = path.read_text(encoding="utf-8")
    if "\r" in raw:
        raise ValueError(f"{path.name}: CRLF line endings are not allowed")
    lines = raw.split("\n")
    if lines and lines[-1] == "":
        lines.pop()
    return lines


def dump_grid(rows: list[str]) -> str:
    return "\n".join(rows) + "\n"


def shear(dx: int, y: int) -> int:
    """Horizontal offset for row `y`, ramping from 0 at the hip to dx at the foot."""
    span = LEG_BOTTOM - LEG_TOP
    return int(dx * (y - LEG_TOP) / span + 0.5) if dx >= 0 else -int(-dx * (y - LEG_TOP) / span + 0.5)


def leg_mask(master: list[str], seed: tuple[int, int]) -> set[tuple[int, int]]:
    """Opaque cells of the leg connected to `seed`, restricted to the leg band.

    The band is where the pteruges stop covering the thigh, so what is left is
    shin plus sandal. Chains and other fragments that share those rows are not
    connected to the seed and therefore never move with the leg.
    """
    from collections import deque

    width = len(master[0])
    seen = {seed}
    queue = deque([seed])
    while queue:
        x, y = queue.popleft()
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if not (LEG_TOP <= ny <= LEG_BOTTOM and 0 <= nx < width):
                continue
            if (nx, ny) in seen or master[ny][nx] == TRANSPARENT:
                continue
            seen.add((nx, ny))
            queue.append((nx, ny))
    return seen


def blank(master: list[str]) -> list[list[str]]:
    return [[TRANSPARENT] * len(master[0]) for _ in master]


def render(canvas: list[list[str]], master: list[str]) -> list[str]:
    return ["".join(row) for row in canvas]


def paint_leg(canvas: list[list[str]], master: list[str], mask: set[tuple[int, int]],
              dx: int, lift: int) -> None:
    """Draw one leg shifted by `dx` (sheared) and raised by `lift` rows.

    Row LEG_TOP is pinned so the hip stays welded to the skirt; every lower row
    reads from `y + lift`, so the lowest `lift` rows fall off the block and the
    foot rises. That is the whole lift vocabulary: no rescaling, no redrawing.
    """
    by_row: dict[int, list[int]] = {}
    for (x, y) in mask:
        by_row.setdefault(y, []).append(x)

    for target_y in range(LEG_TOP, LEG_BOTTOM + 1):
        source_y = LEG_TOP if target_y == LEG_TOP else target_y + lift
        if source_y > LEG_BOTTOM:
            continue
        offset = 0 if target_y == LEG_TOP else shear(dx, target_y)
        for source_x in sorted(by_row.get(source_y, [])):
            canvas[target_y][source_x + offset] = master[source_y][source_x]


def build_run_frame(master: list[str], left: set[tuple[int, int]], right: set[tuple[int, int]],
                    pose: tuple[int, int, int, int]) -> list[str]:
    right_dx, right_lift, left_dx, left_lift = pose
    canvas = blank(master)
    for y, line in enumerate(master):
        if LEG_TOP <= y <= LEG_BOTTOM:
            continue
        for x, char in enumerate(line):
            if char != TRANSPARENT:
                canvas[y][x] = char
    paint_leg(canvas, master, left, left_dx, left_lift)
    paint_leg(canvas, master, right, right_dx, right_lift)
    return render(canvas, master)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("character", nargs="?", default="kratos")
    parser.add_argument("--write", action="store_true")
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()

    character_dir = GRIDS / args.character
    manifest = json.loads((character_dir / "manifest.json").read_text(encoding="utf-8"))
    master = load_grid(character_dir / manifest.get("master", "master.txt"))

    left = leg_mask(master, (36, LEG_TOP))
    right = leg_mask(master, (56, LEG_TOP))
    print(f"leg masks: left={len(left)} right={len(right)}")

    frames: dict[str, list[str]] = {}
    frames["idle-00.txt"] = list(master)
    frames["idle-01.txt"] = risen_head(master, manifest)
    for index, pose in enumerate(RUN_POSES):
        frames[f"run-{index:02d}.txt"] = build_run_frame(master, left, right, pose)
    frames[f"run-{len(RUN_POSES):02d}.txt"] = build_run_frame(master, left, right, SKID_POSE)

    for name, rows in frames.items():
        path = character_dir / name
        if args.write:
            path.write_text(dump_grid(rows), encoding="utf-8", newline="\n")
        else:
            print(f"--- {name} (dry run) ---")
    return 0


def risen_head(master: list[str], manifest: dict) -> list[str]:
    """Idle-01: the head band rises one row and the shoulder line repeats.

    I4 compares the declared band against the master at the frame offset, so the
    band has to move as a whole. Rising is the only direction that keeps the
    ground anchor and the baked contact shadow untouched: the sprite grows
    upward and the bottom row never changes.
    """
    region = manifest["regions"]["head"]
    x0, x1 = int(region["x0"]), int(region["x1"])
    y0, y1 = int(region["y0"]), int(region["y1"])
    canvas = blank(master)
    for y, line in enumerate(master):
        for x, char in enumerate(line):
            if char != TRANSPARENT:
                canvas[y][x] = char
    block = [(x, y, master[y][x]) for y in range(y0, y1 + 1) for x in range(x0, x1 + 1)
             if master[y][x] != TRANSPARENT]
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            canvas[y][x] = TRANSPARENT
    for (x, y, char) in block:
        canvas[y - 1][x] = char
    # The band bottom vacated one row; repeat it so the shoulders stay closed.
    for x in range(x0, x1 + 1):
        canvas[y1][x] = master[y1][x]
    return render(canvas, master)


if __name__ == "__main__":
    raise SystemExit(main())
