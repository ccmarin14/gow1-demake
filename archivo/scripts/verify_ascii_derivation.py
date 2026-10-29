#!/usr/bin/env python3
"""Regression probes for the ASCII master pipeline.

Read-only: derives frames in memory and compares them against the committed
grids, the shipped PNGs and the manifest. Never writes inside the repository.

Run from the repo root:  python3 scripts/verify_ascii_derivation.py .
"""
import hashlib
import json
import os
import pathlib
import subprocess
import sys

sys.dont_write_bytecode = True

ROOT = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else ".").resolve()
G = ROOT / "grids" / "kratos"
sys.path.insert(0, str(ROOT / "scripts"))
import ascii_animate as A  # noqa: E402

manifest = json.loads((G / "manifest.json").read_text(encoding="utf-8"))
master = A.load_grid(G / manifest["master"])
W, H = manifest["frame_size"]["w"], manifest["frame_size"]["h"]
declared = [f["file"] for f in manifest["frames"]]
fail = []


def check(cond, msg):
    if not cond:
        fail.append(msg)


# A1: manifest and grid files are one to one, sized, palette closed.
on_disk = sorted(p.name for p in G.glob("*.txt") if p.name != manifest["master"])
check(sorted(declared) == on_disk, f"A1 manifest/files mismatch {sorted(declared)} != {on_disk}")
check(len(set(declared)) == len(declared), "A1 duplicate frame declared")
alphabet = set("".join(master))
frames = {name: A.load_grid(G / name) for name in declared}
for name, rows in frames.items():
    check(len(rows) == H, f"A1 {name} rows {len(rows)} != {H}")
    check(all(len(r.strip("\n")) == W for r in rows), f"A1 {name} width != {W}")
    check(set("".join(rows)) <= alphabet, f"A1 {name} uses chars outside master alphabet")

# A3: frames are exactly what the generator derives (no hand edits).
left = A.leg_mask(master, (36, A.LEG_TOP))
right = A.leg_mask(master, (56, A.LEG_TOP))
gen = {"idle-00.txt": list(master), "idle-01.txt": A.risen_head(master, manifest)}
for index, pose in enumerate(A.RUN_POSES):
    gen[f"run-{index:02d}.txt"] = A.build_run_frame(master, left, right, pose)
gen[f"run-{len(A.RUN_POSES):02d}.txt"] = A.build_run_frame(master, left, right, A.SKID_POSE)
for name, rows in gen.items():
    check(rows == frames[name], f"A3 {name} differs from generator output")

# A3: no new pixels -- every opaque run of a frame exists verbatim in a master row.
master_runs = set()
for row in master:
    for run in row.split("."):
        if run:
            master_runs.add(run)
for name, rows in frames.items():
    for y, row in enumerate(rows):
        for run in row.split("."):
            if run and run not in master_runs:
                fail.append(f"A3 {name} row {y} run {run!r} not present in master")

# A3/A8: run edits stay below the skirt line; idle-01 diff is 96 cells inside the head band.
for name in declared:
    if not name.startswith("run-"):
        continue
    diff = {(x, y) for y in range(H) for x in range(W) if frames[name][y][x] != master[y][x]}
    check(all(y >= 47 for _, y in diff), f"A3 {name} differs above row 47")
idle_diff = {(x, y) for y in range(H) for x in range(W)
             if frames["idle-01.txt"][y][x] != master[y][x]}
check(len(idle_diff) == 96, f"A8 idle-01 diff {len(idle_diff)} cells != 96")
check(all(13 <= y <= 23 for _, y in idle_diff), "A3 idle-01 differs outside rows 13..23")

# A8: silhouette masses and the cooked contact bar.
def mass(rows):
    return sum(1 for row in rows for ch in row if ch != ".")


check(mass(master) == 1001, f"A8 master mass {mass(master)} != 1001")
check(mass(frames["idle-01.txt"]) == 1019, f"A8 idle-01 mass {mass(frames['idle-01.txt'])} != 1019")
for name in declared:
    if name.startswith("run-"):
        check(971 <= mass(frames[name]) <= 984, f"A8 {name} mass {mass(frames[name])} outside 971..984")
for name, rows in frames.items():
    xs = [x for x, ch in enumerate(rows[58]) if ch != "."]
    check((min(xs), max(xs), len(xs)) == (29, 67, 39),
          f"A8 {name} row 58 span {min(xs)}..{max(xs)} ({len(xs)})")

# A8/R1: bright (`a`) cells on the silhouette edge, and where they sit.
def edge_a(rows):
    out = set()
    for y in range(H):
        for x in range(W):
            if rows[y][x] != "a":
                continue
            for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)):
                ny, nx = y + dy, x + dx
                if not (0 <= ny < H and 0 <= nx < W) or rows[ny][nx] == ".":
                    out.add((x, y))
                    break
    return out


check(edge_a(master) == {(48, 20), (50, 21), (19, 36), (21, 36), (77, 37), (78, 36)},
      f"A8 R1 edge-a set {sorted(edge_a(master))}")

# A8: exactly one enclosed transparent component, 190 cells between the legs.
transparent = {(x, y) for y in range(H) for x in range(W) if master[y][x] == "."}
seen = set()
components = []
for cell in transparent:
    if cell in seen:
        continue
    stack = [cell]
    seen.add(cell)
    size = 0
    while stack:
        cx, cy = stack.pop()
        size += 1
        for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
            if (nx, ny) in transparent and (nx, ny) not in seen:
                seen.add((nx, ny))
                stack.append((nx, ny))
    components.append(size)
components.sort()
check(components == [190, 4532], f"A8 transparent components {components} != [190, 4532]")

# A2: the invariant script keeps its documented contract (I5 not evaluated yet).
env = dict(os.environ, PYTHONDONTWRITEBYTECODE="1")
proc = subprocess.run(
    [sys.executable, str(ROOT / "scripts" / "verify_ascii_master.py"), "kratos"],
    cwd=str(ROOT), capture_output=True, text=True, env=env,
)
check(proc.returncode == 2, f"A2 verify_ascii_master exit {proc.returncode} != 2")
check("I5" in proc.stdout and "NOT EVALUATED" in proc.stdout,
      "A2 verify_ascii_master no longer reports I5 NOT EVALUATED")

# A4: shipped PNGs match their declared hashes.
SHA = {
    "kratos-neutral.png": "744743fb759d7ecf", "kratos-idle-00.png": "744743fb759d7ecf",
    "kratos-idle-01.png": "26cc7824b5c64e27", "kratos-run-00.png": "ecb638122ce1c547",
    "kratos-run-01.png": "5b880ac34b708f2b", "kratos-run-02.png": "6cebb4d290633d66",
    "kratos-run-03.png": "ce5815977598f592", "kratos-run-04.png": "379a64fd05ce915b",
    "kratos-run-05.png": "6ce7b3708ff071d0", "kratos-run-06.png": "f84ff37752a79c61",
    "kratos-run-07.png": "a6e698fcaa3b9541", "kratos-run-08.png": "d0e079a2ef3b5bdd",
}
for name, want in SHA.items():
    path = ROOT / "public" / "assets" / "characters" / name
    got = hashlib.sha256(path.read_bytes()).hexdigest()[:16]
    check(got == want, f"A4 {name} sha {got} != {want}")

# A5: archived art is not referenced by the shipped code paths.
for rel in ["src/assets/manifest.ts", "index.html"]:
    text = (ROOT / rel).read_text(encoding="utf-8")
    check("characters/archivo" not in text, f"A5 {rel} references characters/archivo")
for path in (ROOT / "src").rglob("*.ts"):
    text = path.read_text(encoding="utf-8")
    check("characters/archivo" not in text,
          f"A5 {path.relative_to(ROOT)} references characters/archivo")

print("PROBES:", "FAIL" if fail else "PASS")
for message in fail:
    print(" -", message)
sys.exit(1 if fail else 0)
