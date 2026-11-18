#!/usr/bin/env python3
"""Re-render every Kratos blockout and export its weapon anchors (D-34).

Usage:
    python3 scripts/pose_render/build_anchors.py [--blender PATH] [--jobs N] [--only a,b,c]

`--only` re-renders just the named frames (seconds instead of minutes) and merges their anchors into
the existing file; the full run is still the check that no other frame drifted.

For each entry of `frames.json` it renders the frame into a fresh temporary
directory under `docs/tmp/` (removed when the run succeeds; only one run at a
time is allowed, see `LOCK`),
reduces it with `to_grid.reduce_render`, FAILS if the grid differs from the
one in `grids/kratos/` (the recipe would be wrong), and writes
`src/assets/kratos-anchors.json`: per texture key, the upper back on the
sprite canvas (x right, y down, origin top-left) and the spine direction in
radians (from the neck down to the pelvis) for the blades on the back, plus
the near hand (`hand`, hand_r), the far hand (`farHand`, hand_l), the near
shoulder (`shoulder`, upperarm_r) and the far shoulder (`farShoulder`,
upperarm_l) that the strikes draw the blades and chains from.
"""

from __future__ import annotations

import argparse
import fcntl
import json
import math
import shutil
import subprocess
import sys
import tempfile
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from to_grid import reduce_render  # noqa: E402

GROUND_ROW = 55
TMP_ROOT = ROOT / "docs" / "tmp"
# Two runs rendering into the same directories read each other's half-written
# frames and report random mismatches: each run renders into its own
# directory, and the lock keeps a second run from starting at all.
LOCK = TMP_ROOT / "build_anchors.lock"
TARGET = ROOT / "src" / "assets" / "kratos-anchors.json"


def render(blender: str, out_dir: Path, name: str, recipe: dict) -> tuple[Path, Path]:
    out = out_dir / name
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
    parser.add_argument("--jobs", type=int, default=4, help="frames rendered at once (each in its own directory)")
    parser.add_argument("--only", default="", help="comma-separated frame names: re-render just those and merge them into the existing anchors")
    args = parser.parse_args()

    TMP_ROOT.mkdir(parents=True, exist_ok=True)
    lock = LOCK.open("w")
    try:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
    except BlockingIOError:
        print("FAIL another build_anchors run is in progress")
        return 1
    out_dir = Path(tempfile.mkdtemp(prefix="anchors-", dir=TMP_ROOT))
    recipes = json.loads((HERE / "frames.json").read_text(encoding="utf-8"))["frames"]
    only = [name for name in args.only.split(",") if name]
    anchors: dict[str, dict] = {}
    if only:
        unknown = [name for name in only if name not in recipes]
        if unknown:
            print("FAIL not in frames.json:", ", ".join(unknown))
            return 1
        recipes = {name: recipes[name] for name in only}
        anchors = json.loads(TARGET.read_text(encoding="utf-8"))
    mismatches = []
    with ThreadPoolExecutor(max_workers=max(1, args.jobs)) as pool:
        rendered = dict(zip(recipes, pool.map(lambda item: render(args.blender, out_dir, *item), recipes.items())))
    for name, recipe in recipes.items():
        png, bones_path = rendered[name]
        rows, shift = reduce_render(str(png), GROUND_ROW if recipe["ground"] else None)
        current = (ROOT / "grids" / "kratos" / f"{name}.txt").read_text(encoding="utf-8").splitlines()
        if rows != current:
            mismatches.append(name)
            continue
        bones = json.loads(bones_path.read_text(encoding="utf-8"))
        at = lambda bone: (bones[bone][0], bones[bone][1] + shift)  # noqa: E731
        neck, pelvis, back = at("neck_01"), at("pelvis"), at("spine_03")
        point = lambda bone: [round(value, 1) for value in at(bone)]  # noqa: E731
        anchors[f"kratos-{name}"] = {
            "back": [round(back[0], 1), round(back[1], 1)],
            "spineRad": round(math.atan2(pelvis[1] - neck[1], pelvis[0] - neck[0]), 3),
            "hand": point("hand_r"),
            "farHand": point("hand_l"),
            "shoulder": point("upperarm_r"),
            "farShoulder": point("upperarm_l"),
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
