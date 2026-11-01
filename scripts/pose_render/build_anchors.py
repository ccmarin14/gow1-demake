#!/usr/bin/env python3
"""Re-render every Kratos blockout and export its weapon anchors (D-34).

Usage:
    python3 scripts/pose_render/build_anchors.py [--blender PATH]

For each entry of `frames.json` it renders the frame into `docs/tmp/anchors/`,
reduces it with `to_grid.reduce_render`, FAILS if the grid differs from the
one in `grids/kratos/` (the recipe would be wrong), and writes
`src/assets/kratos-anchors.json`: per texture key, the upper back on the
sprite canvas (x right, y down, origin top-left) and the spine direction in
radians (from the neck down to the pelvis) for the blades on the back.
"""

from __future__ import annotations

import argparse
import json
import math
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from to_grid import reduce_render  # noqa: E402

GROUND_ROW = 55
OUT_DIR = ROOT / "docs" / "tmp" / "anchors"
TARGET = ROOT / "src" / "assets" / "kratos-anchors.json"


def render(blender: str, name: str, recipe: dict) -> tuple[Path, Path]:
    out = OUT_DIR / name
    command = [
        blender, "-b", "--python", str(HERE / "render.py"), "--",
        str(HERE / "kratos.json"), recipe["action"], str(out), str(recipe["frame"]),
    ]
    if "pose" in recipe:
        command.append(str(HERE / "poses" / recipe["pose"]))
    subprocess.run(command, cwd=ROOT, check=True, capture_output=True)
    stem = out / f"{recipe['action']}_{recipe['frame']:03d}"
    return stem.with_suffix(".png"), Path(str(stem) + ".bones.json")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--blender", default=str(Path.home() / ".local" / "bin" / "blender"))
    args = parser.parse_args()

    recipes = json.loads((HERE / "frames.json").read_text(encoding="utf-8"))["frames"]
    anchors: dict[str, dict] = {}
    mismatches = []
    for name, recipe in recipes.items():
        png, bones_path = render(args.blender, name, recipe)
        rows, shift = reduce_render(str(png), GROUND_ROW if recipe["ground"] else None)
        current = (ROOT / "grids" / "kratos" / f"{name}.txt").read_text(encoding="utf-8").splitlines()
        if rows != current:
            mismatches.append(name)
            continue
        bones = json.loads(bones_path.read_text(encoding="utf-8"))
        at = lambda bone: (bones[bone][0], bones[bone][1] + shift)  # noqa: E731
        neck, pelvis, back = at("neck_01"), at("pelvis"), at("spine_03")
        anchors[f"kratos-{name}"] = {
            "back": [round(back[0], 1), round(back[1], 1)],
            "spineRad": round(math.atan2(pelvis[1] - neck[1], pelvis[0] - neck[0]), 3),
        }
        print(f"ok   {name}")
    if mismatches:
        print("FAIL the recipe does not reproduce these grids:", ", ".join(mismatches))
        return 1
    TARGET.write_text(json.dumps(anchors, indent=2) + "\n", encoding="utf-8")
    print(f"wrote {TARGET.relative_to(ROOT)} ({len(anchors)} frames)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
