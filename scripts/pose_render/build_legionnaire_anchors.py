#!/usr/bin/env python3
"""Re-render the legionnaire's grab frames and export their body anchors (BL-45).

Usage:
    python3 scripts/pose_render/build_legionnaire_anchors.py [--blender PATH]

For each entry of `legionnaire-frames.json` it renders the frame with
`legionnaire.json`, reduces it like `legionnaire_frame.sh` does (ground row 55),
FAILS if the grid differs from `grids/legionnaire/<name>.txt` (the recipe would
be wrong) and writes `src/assets/legionnaire-anchors.json`: per texture key, the
neck (`neck`), the pelvis and both hands on the 64x56 sprite canvas (x right,
y down, origin top-left, facing right). The grab presentation places the held
soldier so that his neck sits in Kratos' hand (`src/scene/grabPose.ts`).
"""

from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import to_grid  # noqa: E402

GROUND_ROW = 55
TARGET = ROOT / "src" / "assets" / "legionnaire-anchors.json"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--blender", default=str(Path.home() / ".local" / "bin" / "blender"))
    args = parser.parse_args()
    to_grid.load_config(str(HERE / "legionnaire.json"))
    recipes = json.loads((HERE / "legionnaire-frames.json").read_text(encoding="utf-8"))["frames"]
    out_dir = Path(tempfile.mkdtemp(prefix="leg-anchors-", dir=ROOT / "docs" / "tmp"))
    anchors: dict[str, dict] = {}
    mismatches = []
    for name, recipe in recipes.items():
        out = out_dir / name
        command = [
            args.blender, "-b", "--python", str(HERE / "render.py"), "--",
            str(HERE / "legionnaire.json"), recipe["action"], str(out), str(recipe["frame"]),
            str(HERE / "poses" / recipe["pose"]),
        ]
        subprocess.run(command, cwd=ROOT, check=True, capture_output=True)
        stem = out / f"{recipe['action']}_{recipe['frame']:03d}"
        rows, shift = to_grid.reduce_render(str(stem.with_suffix(".png")), GROUND_ROW)
        current = (ROOT / "grids" / "legionnaire" / f"{name}.txt").read_text(encoding="utf-8").splitlines()
        if rows != current:
            mismatches.append(name)
            continue
        bones = json.loads(Path(str(stem) + ".bones.json").read_text(encoding="utf-8"))
        point = lambda bone: [round(bones[bone][0], 1), round(bones[bone][1] + shift, 1)]  # noqa: E731
        anchors[f"legionnaire-{name}"] = {
            "neck": point("neck_01"),
            "pelvis": point("pelvis"),
            "hand": point("hand_r"),
            "farHand": point("hand_l"),
        }
        print(f"ok   {name}")
    if mismatches:
        print("FAIL the recipe does not reproduce these grids:", ", ".join(mismatches), f"(renders kept in {out_dir})")
        return 1
    shutil.rmtree(out_dir)
    TARGET.write_text(json.dumps(anchors, indent=2) + "\n", encoding="utf-8")
    print(f"wrote {TARGET.relative_to(ROOT)} ({len(anchors)} frames)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
