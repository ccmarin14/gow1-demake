#!/usr/bin/env python3
"""Verify the ASCII master invariants (I1-I8) for a character.

Usage:
    python3 scripts/verify_ascii_master.py kratos

Exit codes:
    0 = every evaluated invariant passed
    1 = at least one invariant failed
    2 = no failure, but at least one check could not be evaluated
"""

from __future__ import annotations

import hashlib
import json
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
GRIDS = ROOT / "grids"
PALETTE = ROOT / "palette" / "master.json"
RASTERIZER = ROOT / "scripts" / "ascii_to_png.py"

TRANSPARENT = "."
MID_X = 48


class Check:
    def __init__(self) -> None:
        self.results: list[tuple[str, bool | None, str]] = []

    def add(self, code: str, ok: bool, detail: str) -> None:
        self.results.append((code, ok, detail))

    def skip(self, code: str, detail: str) -> None:
        """Record an invariant that could not be evaluated. Never a PASS."""
        self.results.append((code, None, detail))

    @property
    def failed(self) -> list[str]:
        return [code for code, ok, _ in self.results if ok is False]

    @property
    def skipped(self) -> list[tuple[str, str]]:
        return [(code, detail) for code, ok, detail in self.results if ok is None]

    def report(self) -> None:
        for code, ok, detail in self.results:
            mark = "PASS" if ok else ("FAIL" if ok is False else "NOT EVALUATED")
            print(f"[{mark}] {code}: {detail}")
        if self.results:
            print()
        if self.failed:
            print(f"RESULT: FAIL ({len(self.failed)} invariants) -> {', '.join(self.failed)}")
        elif self.skipped:
            codes = sorted({code for code, _ in self.skipped})
            print(
                f"RESULT: PARTIAL ({len(self.skipped)} checks not evaluated) -> "
                f"{', '.join(codes)}"
            )
        else:
            print(f"RESULT: PASS ({len(self.results)} invariants)")


def load_json(path: Path) -> dict:
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


def load_grid(path: Path, width: int, height: int) -> list[str]:
    raw = path.read_text(encoding="utf-8")
    if "\r" in raw:
        raise ValueError(f"{path.name}: CRLF line endings are not allowed")
    lines = raw.split("\n")
    if lines and lines[-1] == "":
        lines.pop()
    if len(lines) != height:
        raise ValueError(f"{path.name}: {len(lines)} rows, expected {height}")
    for index, line in enumerate(lines):
        if len(line) != width:
            raise ValueError(f"{path.name}:{index + 1}: {len(line)} chars, expected {width}")
    return lines


def rasterize(grid: Path, palette: Path, out: Path) -> None:
    subprocess.run(
        [sys.executable, str(RASTERIZER), "--grid", str(grid), "--palette", str(palette),
         "--out", str(out)],
        check=True,
        capture_output=True,
    )


def alpha_mask(image: Image.Image) -> list[list[bool]]:
    width, height = image.size
    px = image.load()
    return [[px[x, y][3] > 0 for x in range(width)] for y in range(height)]


def count_diff(
    frame: list[str], master: list[str], x0: int, x1: int, y0: int, y1: int
) -> int:
    return sum(
        1
        for y in range(max(y0, 0), min(y1, len(master) - 1) + 1)
        for x in range(max(x0, 0), min(x1, len(master[0]) - 1) + 1)
        if frame[y][x] != master[y][x]
    )


def evaluate_motion(
    check: Check, manifest: dict, character_dir: Path, master: list[str], width: int, height: int
) -> None:
    """I8: a frame that animates must actually be a different pose.

    Measured against the master. Bands declare what must move and by how much;
    frozen regions declare what must not change at all. A frame that only
    wiggles one limb fails, which is exactly the defect this gate exists for.
    """
    gate = manifest.get("motion_gate")
    if not gate:
        check.skip("I8", "manifest declares no motion_gate")
        return

    moving_frames = [frame for frame in manifest["frames"] if frame.get("motion")]
    if not moving_frames:
        check.skip("I8", "no frame declares motion")
        return

    for frame in moving_frames:
        name = frame["file"]
        grid_path = character_dir / name
        try:
            grid = load_grid(grid_path, width, height)
        except (OSError, ValueError):
            # I7 already reports the unreadable grid.
            continue

        total = count_diff(grid, master, 0, width - 1, 0, height - 1)
        check.add(
            "I8",
            total >= int(gate["min_total_changed_px"]),
            f"{name}: {total} px differ from master (min {gate['min_total_changed_px']})",
        )

        for band in gate.get("bands", []):
            changed = count_diff(
                grid, master, int(band["x0"]), int(band["x1"]), int(band["y0"]), int(band["y1"])
            )
            check.add(
                "I8",
                changed >= int(band["min_changed"]),
                f"{name}: band {band['name']} changed {changed} px (min {band['min_changed']})",
            )

        for region in gate.get("frozen", []):
            changed = count_diff(
                grid,
                master,
                int(region["x0"]),
                int(region["x1"]),
                int(region["y0"]),
                int(region["y1"]),
            )
            check.add(
                "I8",
                changed == 0,
                f"{name}: frozen {region['name']} changed {changed} px",
            )


def foot_center(grid: list[str], side: str, ground: int) -> float | None:
    """Midpoint x of the lowest drawn row of one foot.

    A lifted foot leaves the ground row, so the contact row alone cannot show
    its travel; the foot's own lowest row can.
    """
    lo, hi = (0, MID_X - 1) if side == "near" else (MID_X, len(grid[0]) - 1)
    for y in range(ground, 0, -1):
        xs = [x for x in range(lo, hi + 1) if grid[y][x] != TRANSPARENT]
        if xs:
            return (min(xs) + max(xs)) / 2
    return None


def ground_contacts(grid: list[str], ground: int) -> dict[str, tuple[int, int] | None]:
    """Per side, the x range of pixels touching the ground row."""
    xs = [x for x in range(len(grid[0])) if grid[ground][x] != TRANSPARENT]
    near = [x for x in xs if x < MID_X]
    far = [x for x in xs if x >= MID_X]
    return {
        "near": (min(near), max(near)) if near else None,
        "far": (min(far), max(far)) if far else None,
    }


def evaluate_clip(
    check: Check, manifest: dict, character_dir: Path, width: int, height: int
) -> None:
    """I8: the clip must be a moving pose cycle, not one pose nudged.

    Three measurable properties, each of which the rejected batches failed:
    consecutive frames differ, support alternates between the feet, and each
    foot actually travels across the cycle.
    """
    gate = manifest.get("clip_gate")
    if not gate:
        check.skip("I8", "manifest declares no clip_gate")
        return

    ground = int(gate.get("foot_row", manifest.get("regions", {}).get("legs", {}).get("y1", 58)))
    for clip in gate.get("clips", []):
        name = clip["name"]
        grids: list[list[str]] = []
        for file_name in clip["frames"]:
            try:
                grids.append(load_grid(character_dir / file_name, width, height))
            except (OSError, ValueError):
                grids = []
                break
        if len(grids) < 2:
            check.add("I8", False, f"clip {name}: fewer than two readable frames")
            continue

        consecutive = [
            count_diff(grids[index], grids[(index + 1) % len(grids)], 0, width - 1, 0, height - 1)
            for index in range(len(grids))
        ]
        smallest = min(consecutive)
        check.add(
            "I8",
            smallest >= int(clip.get("min_consecutive_change_px", gate["min_consecutive_change_px"])),
            f"clip {name}: smallest consecutive change {smallest} px "
            f"(min {clip.get('min_consecutive_change_px', gate['min_consecutive_change_px'])}), per step {consecutive}",
        )

        contacts = [ground_contacts(grid, ground) for grid in grids]
        solo_near = sum(1 for c in contacts if c["near"] and not c["far"])
        solo_far = sum(1 for c in contacts if c["far"] and not c["near"])
        check.add(
            "I8",
            solo_near >= 1 and solo_far >= 1,
            f"clip {name}: ground support alternates "
            f"(frames on the near foot only {solo_near}, far foot only {solo_far}); "
            f"contacts {contacts}",
        )

        for side in ("near", "far"):
            centers = [foot_center(grid, side, ground) for grid in grids]
            known = [center for center in centers if center is not None]
            travel = round(max(known) - min(known), 1) if known else 0
            check.add(
                "I8",
                travel >= int(clip.get("min_foot_travel_px", gate["min_foot_travel_px"])),
                f"clip {name}: {side} foot travels {travel} px across the cycle "
                f"(min {clip.get('min_foot_travel_px', gate['min_foot_travel_px'])}), "
                f"center per frame {centers}",
            )


def main() -> int:
    character = sys.argv[1] if len(sys.argv) > 1 else "kratos"
    check = Check()

    if not PALETTE.exists():
        check.add("I2", False, f"missing palette {PALETTE.relative_to(ROOT)}")
        check.report()
        return 1
    palette = load_json(PALETTE)
    colors = {char: value for char, value in palette["colors"].items()}
    valid_chars = set(colors) | {TRANSPARENT}
    check.add(
        "I2",
        len(colors) <= int(palette.get("max_colors", 12)),
        f"palette declares {len(colors)} colors (max {palette.get('max_colors', 12)})",
    )

    character_dir = GRIDS / character
    manifest_path = character_dir / "manifest.json"
    if not manifest_path.exists():
        check.add("I7", False, f"missing manifest {manifest_path.relative_to(ROOT)}")
        check.report()
        return 1

    manifest = load_json(manifest_path)
    width = int(manifest["frame_size"]["w"])
    height = int(manifest["frame_size"]["h"])
    regions = manifest.get("regions", {})
    anchors = manifest.get("anchors", {})
    ground = int(anchors.get("ground", height - 1))

    master_path = character_dir / manifest.get("master", "master.txt")
    try:
        master = load_grid(master_path, width, height)
    except (OSError, ValueError) as error:
        check.add("I7", False, str(error))
        check.report()
        return 1

    for frame in manifest["frames"]:
        name = frame["file"]
        grid_path = character_dir / name
        try:
            grid = load_grid(grid_path, width, height)
        except (OSError, ValueError) as error:
            check.add("I7", False, f"{name}: {error}")
            continue

        unknown = {char for line in grid for char in line} - valid_chars
        check.add("I2", not unknown, f"{name}: characters outside palette {sorted(unknown) or 'none'}")

        with tempfile.TemporaryDirectory() as tmp:
            first = Path(tmp) / "a.png"
            second = Path(tmp) / "b.png"
            try:
                rasterize(grid_path, PALETTE, first)
                rasterize(grid_path, PALETTE, second)
            except subprocess.CalledProcessError as error:
                check.add("I1", False, f"{name}: rasterizer failed: {error.stderr.decode()[:200]}")
                continue
            hash_a = hashlib.sha256(first.read_bytes()).hexdigest()
            hash_b = hashlib.sha256(second.read_bytes()).hexdigest()
            check.add("I1", hash_a == hash_b, f"{name}: {hash_a[:16]}")

            image = Image.open(first).convert("RGBA")
            check.add("I7", image.size == (width, height), f"{name}: {image.size[0]}x{image.size[1]}")

            alphas = {pixel[3] for pixel in image.getdata()}
            check.add("I3", alphas <= {0, 255}, f"{name}: alpha values {sorted(alphas)}")

            used = {pixel for pixel in image.getdata() if pixel[3] == 255}
            allowed = {
                tuple(int(value[i:i + 2], 16) for i in (1, 3, 5)) + (255,)
                for value in colors.values()
            }
            check.add("I2", used <= allowed, f"{name}: {len(used)} colors, all declared")

            offset = frame.get("head_offset", [0, 0])
            dx = int(offset[0])
            dy = int(offset[1])
            continuity = manifest.get("continuity", ["head", "torso"])
            drift = []
            for region_name in continuity:
                if region_name not in regions:
                    continue
                region = regions[region_name]
                # The region describes the master footprint. In a frame the same
                # footprint appears at the declared offset, so the comparison
                # moves with it.
                y0 = int(region["y0"]) + dy
                y1 = int(region["y1"]) + dy
                x0 = int(region.get("x0", 0)) + dx
                x1 = int(region.get("x1", width - 1)) + dx
                cells = []
                for y in range(max(y0, 0), min(y1, height - 1) + 1):
                    for x in range(max(x0, 0), min(x1, width - 1) + 1):
                        if grid[y][x] != master[y - dy][x - dx]:
                            cells.append((x, y))
                if cells:
                    drift.append(f"{region_name}:{len(cells)} cells, first {cells[0]}")
                # Stray pixels: the band occupied by the region must not hold
                # anything outside the declared footprint.
                margin = 14
                stray = [
                    (x, y)
                    for y in range(max(y0, 0), min(y1, height - 1) + 1)
                    for x in range(max(x0 - margin, 0), min(x1 + margin, width - 1) + 1)
                    if grid[y][x] != TRANSPARENT and not x0 <= x <= x1
                ]
                if stray:
                    drift.append(f"{region_name}: {len(stray)} stray px outside footprint, first {stray[0]}")
            check.add(
                "I4",
                not drift,
                f"{name}: continuity regions match master (offset {offset})"
                if not drift
                else f"{name}: drift -> " + "; ".join(drift),
            )

            if frame.get("grounded", False):
                mask = alpha_mask(image)
                lowest = max((y for y in range(height) if any(mask[y])), default=-1)
                check.add("I6", lowest == ground, f"{name}: lowest opaque row {lowest} (ground {ground})")

            hand_zones = frame.get("hand_zones")
            if not hand_zones:
                check.skip(
                    "I5",
                    f"{name}: hand zone not declared for this pose "
                    f"(absolute anchors describe the neutral pose only)",
                )
            else:
                mask = alpha_mask(image)
                for hand, zone in hand_zones.items():
                    if hand not in ("hand_left", "hand_right") or not zone:
                        continue
                mask = alpha_mask(image)
                filled = sum(
                    1
                    for y in range(int(zone["y0"]), int(zone["y1"]) + 1)
                    for x in range(int(zone["x0"]), int(zone["x1"]) + 1)
                    if mask[y][x]
                )
                check.add("I5", filled > 0, f"{name}: {hand} has {filled} opaque pixels")

    evaluate_motion(check, manifest, character_dir, master, width, height)
    evaluate_clip(check, manifest, character_dir, width, height)

    check.report()
    if check.failed:
        return 1
    if check.skipped:
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
