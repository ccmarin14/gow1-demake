#!/usr/bin/env python3
"""Write the legionnaire's pose files (`poses/leg-*.json`) for `render.py` (BL-21).

Every pose sits on Idle_Loop frame 0 with the same hunched back (HUNCH); the legs,
the torso lean, and the two hands (inverse kinematics) change per pose. Forward is
-Y, up is +Z, -X is toward the camera. A negative thigh angle moves the leg forward.

Usage: python3 scripts/pose_render/legionnaire_poses.py
"""

import json
from pathlib import Path

OUT = Path(__file__).parent / "poses"
HUNCH = {"spine_01": 5, "spine_02": 5, "neck_01": -10}
STAND = {"thigh_r": -16, "calf_r": 22, "thigh_l": 14, "calf_l": 22}
ROLL = {"sword": {"rotation": [35, 90, 0]}}  # blade flat to the camera while raised


def pose(rot, right, left=None, twist=0, roll=False, sword=None):
    rotations = {bone: [[1, 0, 0], deg] for bone, deg in HUNCH.items()}
    for bone, deg in rot.items():
        rotations[bone] = [[1, 0, 0], rotations.get(bone, [0, 0])[1] + deg]
    if twist:
        rotations["spine_01"] = [[0, 1, 0], twist]
    ik = {"hand_r": {"target": right[0], "pole": right[1]}}
    if left:
        ik["hand_l"] = {"target": left[0], "pole": left[1]}
    data = {"rotations": rotations, "ik": ik}
    if roll:
        data["groups"] = ROLL
    if sword:
        data["groups"] = {"sword": {"rotation": sword}}
    return data


def legs(tr, cr, tl, cl, lean):
    return {"thigh_r": tr, "calf_r": cr, "thigh_l": tl, "calf_l": cl, "spine_02": lean}


def hold(x, y, z):  # hand target and an elbow pole slightly lower and behind it
    return [[x, y, z], [-0.6, y + 0.05, z - 0.25]]


# The free hand, far side. The torso hides that arm from the camera, so it reaches
# well ahead of (or behind) the body, with the elbow down and away.
FAR = lambda y, z: [[0.3, y, z], [0.55, (y + 0.3) / 2, z - 0.35]]

POSES = {
    "idle": pose(STAND, hold(-0.3, -0.25, 0.8)),
    "w0": pose(legs(-12, 16, 14, 20, -6), hold(-0.3, 0.55, 1.35), FAR(-0.6, 1.2), roll=True),
    "w1": pose(legs(-16, 14, 18, 22, -10), hold(-0.25, 0.5, 1.7), FAR(-0.65, 1.3), roll=True),
    "w2": pose(legs(-20, 28, 20, 28, -14), hold(-0.25, 0.65, 1.8), FAR(-0.7, 1.35), twist=-10, roll=True),
    "w3": pose(legs(-22, 30, 22, 30, -12), hold(-0.25, 0.45, 1.75), FAR(-0.7, 1.35), twist=-10, roll=True),
    "s0": pose(legs(-28, 28, 22, 18, 0), hold(-0.3, 0.0, 1.85), FAR(-0.5, 1.3)),
    "s1": pose(legs(-35, 30, 28, 8, 6), hold(-0.3, -0.35, 1.6), FAR(-0.2, 1.15), twist=6),
    "s2": pose(legs(-40, 38, 32, 5, 10), hold(-0.3, -0.6, 1.2), FAR(0.35, 1.05), twist=8),
    "s3": pose(legs(-42, 42, 34, 5, 14), hold(-0.3, -0.55, 0.85), FAR(0.45, 1.0), twist=6),
    "r0": pose(legs(-34, 34, 28, 8, 8), hold(-0.3, -0.45, 0.8), FAR(0.2, 1.0)),
    "r1": pose(legs(-26, 26, 22, 12, 6), hold(-0.3, -0.35, 0.78), FAR(-0.2, 0.95)),
    "r2": pose(STAND, hold(-0.3, -0.25, 0.8), FAR(-0.2, 0.95)),
    # Held by the throat (Kratos' Grab 1): hanging, the sword hand limp with the blade down, the free hand
    # clawing at the wrist; the second pose folds at the waist when a punch lands.
    "heldA": pose({**legs(6, 10, 12, 18, -8), "neck_01": -8, "Head": -8}, hold(-0.3, -0.05, 0.5), FAR(-0.55, 1.55), sword=[35, 0, 0]),
    "heldB": pose(legs(-8, 16, 4, 12, 24), hold(-0.3, 0.15, 0.55), FAR(-0.4, 1.2), sword=[35, 0, 0]),
}


def main() -> None:
    for name, data in POSES.items():
        (OUT / f"leg-{name}.json").write_text(json.dumps(data))
    walk = pose({"calf_r": 10, "calf_l": 10}, hold(-0.3, -0.25, 0.8), roll=True)
    walk.pop("ik")  # the walk keeps the animation's own arms
    (OUT / "leg-walk.json").write_text(json.dumps(walk))


if __name__ == "__main__":
    main()
