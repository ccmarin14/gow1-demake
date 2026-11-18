#!/usr/bin/env python3
"""Render one Kratos pose and print where its hands land (BL-45), without touching `grids/`.

Usage:
    python3 scripts/pose_render/measure_pose.py <pose.json> [name] [--config kratos|legionnaire]

Writes `docs/tmp/circulo/pose-<name>.txt` (grid) and `pose-<name>.png` (8x preview) and prints, in
pixels from the feet anchor (x forward, y up, as the presentation sees them): the near hand, the far hand,
the top of the silhouette. The grab contact tests (`tests/grab-pose.test.ts`) use the same numbers, so a pose can
be tuned here in seconds before the 6-minute `build_anchors.py` run.
"""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import to_grid  # noqa: E402


def main() -> int:
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    config = "legionnaire" if "--config=legionnaire" in sys.argv else "kratos"
    if not args:
        print(__doc__)
        return 2
    pose = Path(args[0]).resolve()
    name = args[1] if len(args) > 1 else pose.stem
    out = ROOT / "docs" / "tmp" / "circulo" / f"pose-{name}"
    out.mkdir(parents=True, exist_ok=True)
    blender = Path.home() / ".local" / "bin" / "blender"
    subprocess.run(
        [str(blender), "-b", "--python", str(HERE / "render.py"), "--", str(HERE / f"{config}.json"), "Idle_Loop", str(out), "0", str(pose)],
        cwd=ROOT, check=True, capture_output=True,
    )
    if config == "legionnaire":
        to_grid.load_config(str(HERE / "legionnaire.json"))
    rows, shift = to_grid.reduce_render(str(out / "Idle_Loop_000.png"), 55)
    grid = out.parent / f"pose-{name}.txt"
    grid.write_text("\n".join(rows) + "\n", encoding="utf-8")
    subprocess.run(
        [sys.executable, str(ROOT / "scripts" / "preview_grid.py"), str(grid), "--scale", "8", "--out", str(out.parent / f"pose-{name}.png")] + (["--palette", "palette/legionnaire.json"] if config == "legionnaire" else []),
        cwd=ROOT, check=True, capture_output=True,
    )
    bones = json.loads((out / "Idle_Loop_000.bones.json").read_text(encoding="utf-8"))
    rel = lambda bone: (round(bones[bone][0] - 32, 1), round(56 - (bones[bone][1] + shift), 1))  # noqa: E731
    top = next(y for y, row in enumerate(rows) if any(c != "." for c in row))
    print(f"{name}: hand(near) fwd/up {rel('hand_r')}  farHand {rel('hand_l')}  neck {rel('neck_01')}  top-of-silhouette {56 - top} px up")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
