"""Build a reversible four-pose raster cut-out feasibility sample."""

import argparse
import hashlib
import json
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "public/assets/characters/kratos-neutral.png"
IDLE = ROOT / "public/assets/characters/kratos-idle.png"
PRODUCTION = [ROOT / f"public/assets/characters/kratos-{key}.png" for key in
              ("neutral", "idle", "run", "air", "attack", "roll")]
SIZE = (97, 59)
PAD = 64
PADDED_SIZE = (SIZE[0] + PAD * 2, SIZE[1] + PAD * 2)
TRANSPARENT = (0, 0, 0, 0)

# All masks select visible source pixels. Their overlap creates raster caps at
# the hip, knee, and ankle; no anatomy is drawn or synthesized.
PARTS = {
    "near_thigh": {"box": (37, 41, 45, 50), "hip": (41, 42), "knee": (39, 49),
                   "side": "near", "segment": "thigh"},
    "near_shin": {"box": (32, 48, 42, 57), "knee": (39, 49), "ankle": (35, 55),
                  "side": "near", "segment": "shin"},
    "near_foot": {"box": (32, 55, 38, 58), "ankle": (35, 55), "sole": (35, 57),
                  "side": "near", "segment": "foot"},
    "far_thigh": {"box": (55, 40, 62, 50), "hip": (58, 42), "knee": (58, 49),
                  "side": "far", "segment": "thigh"},
    "far_shin": {"box": (55, 48, 64, 57), "knee": (58, 49), "ankle": (61, 55),
                 "side": "far", "segment": "shin"},
    "far_foot": {"box": (58, 55, 67, 58), "ankle": (61, 55), "sole": (62, 57),
                 "side": "far", "segment": "foot"},
}

# Contact / pass / opposite contact / opposite pass; angles are explicit and
# all raster pivots are shared through marker-transformed source coordinates.
POSES = [
    {"name": "run-01-contact-near", "near": {"hip": (41, 42), "thigh": 0,
      "shin": 0, "sole_y": 58}, "far": {"hip": (58, 42), "thigh": 20,
      "shin": -32, "sole_y": 54}},
    {"name": "run-02-pass-near", "near": {"hip": (41, 42), "thigh": -18,
      "shin": 24, "sole_y": 54}, "far": {"hip": (58, 42), "thigh": 16,
      "shin": -28, "sole_y": 55}},
    {"name": "run-03-contact-far", "near": {"hip": (41, 42), "thigh": -20,
      "shin": 32, "sole_y": 54}, "far": {"hip": (58, 42), "thigh": 0,
      "shin": 0, "sole_y": 58}},
    {"name": "run-04-pass-far", "near": {"hip": (41, 42), "thigh": -16,
      "shin": 28, "sole_y": 55}, "far": {"hip": (58, 42), "thigh": 20,
      "shin": -24, "sole_y": 54}},
]
COLORS = {
    "near_thigh": (40, 220, 255, 150), "near_shin": (255, 60, 220, 150),
    "near_foot": (50, 255, 80, 190), "far_thigh": (255, 150, 40, 150),
    "far_shin": (110, 110, 255, 150), "far_foot": (255, 240, 40, 190),
}


def sha256(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def extract_part(source, spec):
    return source.crop(spec["box"])


def opaque_count(image):
    return sum(pixel[3] > 0 for pixel in image.getdata())


def source_overlap_count(source, first_box, second_box):
    x0 = max(first_box[0], second_box[0])
    y0 = max(first_box[1], second_box[1])
    x1 = min(first_box[2], second_box[2])
    y1 = min(first_box[3], second_box[3])
    return sum(source.getpixel((x, y))[3] > 0
               for y in range(y0, y1) for x in range(x0, x1))


def overlap_pixels(first, second):
    return sum(a[3] > 0 and b[3] > 0
               for a, b in zip(first.getdata(), second.getdata()))


def move_canvas(image, dx, dy):
    moved = Image.new("RGBA", image.size, TRANSPARENT)
    moved.alpha_composite(image, (dx, dy))
    return moved


def transform_part(source, spec, pivot_name, angle, target_pivot):
    layer = Image.new("RGBA", PADDED_SIZE, TRANSPARENT)
    x0, y0, _, _ = spec["box"]
    layer.alpha_composite(extract_part(source, spec), (PAD + x0, PAD + y0))
    pivot = spec[pivot_name]
    rotated = layer.rotate(angle, resample=Image.Resampling.NEAREST, expand=False,
                           center=(PAD + pivot[0], PAD + pivot[1]))
    return move_canvas(rotated, target_pivot[0] - pivot[0], target_pivot[1] - pivot[1])


def mapped_anchor(source_point, pivot, angle, target_pivot):
    marker = Image.new("RGBA", PADDED_SIZE, TRANSPARENT)
    # A small raster marker survives nearest-neighbor sampling more reliably
    # than a single opaque pixel; its centroid is only a pivot measurement.
    for ox in (-1, 0, 1):
        for oy in (-1, 0, 1):
            marker.putpixel((PAD + source_point[0] + ox, PAD + source_point[1] + oy),
                            (255, 255, 255, 255))
    marker = marker.rotate(angle, resample=Image.Resampling.NEAREST, expand=False,
                           center=(PAD + pivot[0], PAD + pivot[1]))
    marker = move_canvas(marker, target_pivot[0] - pivot[0], target_pivot[1] - pivot[1])
    points = [(x - PAD, y - PAD) for y in range(marker.height) for x in range(marker.width)
              if marker.getpixel((x, y))[3]]
    if not points:
        raise ValueError("anchor marker was lost during raster transform")
    return (round(sum(x for x, _ in points) / len(points)),
            round(sum(y for _, y in points) / len(points)))


def crop_frame(image):
    return image.crop((PAD, PAD, PAD + SIZE[0], PAD + SIZE[1]))


def pixels_outside_frame(image):
    return sum(image.getpixel((x, y))[3] > 0
               for y in range(image.height) for x in range(image.width)
               if not (PAD <= x < PAD + SIZE[0] and PAD <= y < PAD + SIZE[1]))


def save_layer(image, path, padded=False):
    path.parent.mkdir(parents=True, exist_ok=True)
    (image if padded else crop_frame(image)).save(path, optimize=False)


def mask_layers(source, output_dir):
    parts, records = {}, []
    for name, spec in PARTS.items():
        part = source.crop(spec["box"])
        parts[name] = part
        path = output_dir / "source-parts" / f"{name}.png"
        path.parent.mkdir(parents=True, exist_ok=True)
        part.save(path, optimize=False)
        records.append({"name": name, "file": str(path.relative_to(output_dir)),
                        "sha256": sha256(path), "source_box": list(spec["box"]),
                        "source_opaque_pixels": opaque_count(part),
                        "pivots": {k: list(v) for k, v in spec.items() if k != "box"}})
    return parts, records


def build_base(source):
    base = source.copy()
    for name, spec in PARTS.items():
        x0, y0, x1, y1 = spec["box"]
        hip_cap_rows = 3 if spec["segment"] == "thigh" else 0
        for y in range(y0, y1):
            for x in range(x0, x1):
                if hip_cap_rows and y < y0 + hip_cap_rows:
                    continue
                if source.getpixel((x, y))[3]:
                    base.putpixel((x, y), TRANSPARENT)
    # The source shadow is a separate horizontal strip, not a support foot.
    for x in range(24, 74):
        base.putpixel((x, 58), TRANSPARENT)
    for point in ((28, 48), (29, 48), (28, 49), (29, 49)):
        base.putpixel(point, TRANSPARENT)
    return base


def render_pose(source, base, pose, output_dir):
    layers, pose_record = {}, {
        "name": pose["name"], "phase": "-".join(pose["name"].split("-")[2:]), "legs": {}}
    for side in ("far", "near"):
        config = pose[side]
        thigh_name, shin_name, foot_name = (f"{side}_thigh", f"{side}_shin", f"{side}_foot")
        thigh_spec, shin_spec, foot_spec = PARTS[thigh_name], PARTS[shin_name], PARTS[foot_name]
        hip = tuple(config["hip"])
        thigh = transform_part(source, thigh_spec, "hip", config["thigh"], hip)
        knee = mapped_anchor(thigh_spec["knee"], thigh_spec["hip"], config["thigh"], hip)
        shin = transform_part(source, shin_spec, "knee", config["shin"], knee)
        ankle = mapped_anchor(shin_spec["ankle"], shin_spec["knee"], config["shin"], knee)
        foot = transform_part(source, foot_spec, "ankle", config["shin"], ankle)
        foot_rows = [y - PAD for y in range(foot.height) for x in range(foot.width)
                     if foot.getpixel((x, y))[3]]
        if not foot_rows:
            raise ValueError(f"{foot_name} has no pixels")
        dy = config["sole_y"] - max(foot_rows)
        thigh, shin, foot = (move_canvas(layer, 0, dy) for layer in (thigh, shin, foot))
        hip = (hip[0], hip[1] + dy)
        knee = (knee[0], knee[1] + dy)
        ankle = (ankle[0], ankle[1] + dy)
        layers[thigh_name], layers[shin_name], layers[foot_name] = thigh, shin, foot
        pose_record["legs"][side] = {
            "hip_px": list(hip), "knee_px": list(knee), "ankle_px": list(ankle),
            "sole_target_y": config["sole_y"], "thigh_angle_degrees": config["thigh"],
            "shin_angle_degrees": config["shin"], "vertical_alignment_px": dy,
        }

    body = Image.new("RGBA", PADDED_SIZE, TRANSPARENT)
    body.alpha_composite(base, (PAD, PAD))
    composite = body.copy()
    for name in ("far_thigh", "far_shin", "far_foot"):
        composite.alpha_composite(layers[name])
    composite.alpha_composite(body)
    for name in ("near_thigh", "near_shin", "near_foot"):
        composite.alpha_composite(layers[name])

    pose_dir = output_dir / "part-layers" / pose["name"]
    padded_dir = output_dir / "padded-part-layers" / pose["name"]
    for name, layer in layers.items():
        save_layer(layer, pose_dir / f"{name}.png")
        save_layer(layer, padded_dir / f"{name}.png", padded=True)
    save_layer(body, pose_dir / "body-base.png")
    padded_path = output_dir / "padded-composites" / f"{pose['name']}.png"
    save_layer(composite, padded_path, padded=True)
    final = crop_frame(composite)
    final_path = output_dir / f"{pose['name']}.png"
    final.save(final_path, optimize=False)
    pose_record["final_file"] = final_path.name
    pose_record["padded_composite_file"] = str(padded_path.relative_to(output_dir))
    pose_record["pixels_outside_final_frame_before_crop"] = pixels_outside_frame(composite)
    pose_record["part_transforms"] = {}
    for name, layer in layers.items():
        source_count, transformed_count = opaque_count(extract_part(source, PARTS[name])), opaque_count(layer)
        pose_record["part_transforms"][name] = {
            "source_opaque_pixels": source_count, "transformed_opaque_pixels": transformed_count,
            "pixel_loss": max(0, source_count - transformed_count),
            "pixel_gain": max(0, transformed_count - source_count),
        }
    body_crop = crop_frame(body)
    pose_record["joint_overlap_pixels"] = {}
    pose_record["foot_bounds_from_alpha"] = {}
    for side in ("near", "far"):
        thigh, shin, foot = (crop_frame(layers[f"{side}_{segment}"])
                             for segment in ("thigh", "shin", "foot"))
        pose_record["joint_overlap_pixels"][side] = {
            "hip_with_body": overlap_pixels(body_crop, thigh),
            "knee_thigh_shin": overlap_pixels(thigh, shin),
            "ankle_shin_foot": overlap_pixels(shin, foot),
        }
        pose_record["foot_bounds_from_alpha"][side] = list(crop_frame(layers[f"{side}_foot"]).getbbox() or ())
    return final, layers, body, composite, pose_record


def make_gif(frames, path, source_colors):
    palette = [(0, 0, 0), *source_colors]
    flat = [channel for color in palette for channel in color] + [0] * (768 - 3 * len(palette))
    lookup, encoded = {color: index + 1 for index, color in enumerate(source_colors)}, []
    for frame in frames:
        image = Image.new("P", SIZE, 0)
        image.putpalette(flat)
        source_pixels, target_pixels = frame.convert("RGBA").load(), image.load()
        for y in range(SIZE[1]):
            for x in range(SIZE[0]):
                r, g, b, alpha = source_pixels[x, y]
                target_pixels[x, y] = lookup[(r, g, b)] if alpha else 0
        encoded.append(image)
    encoded[0].save(path, save_all=True, append_images=encoded[1:], duration=180,
                    loop=0, disposal=2, transparency=0, optimize=False)


def save_mask_overlay(source, output_dir):
    scale = 8
    overlay = source.resize((SIZE[0] * scale, SIZE[1] * scale), Image.Resampling.NEAREST)
    tint = Image.new("RGBA", overlay.size, TRANSPARENT)
    for name, spec in PARTS.items():
        x0, y0, x1, y1 = spec["box"]
        for y in range(y0, y1):
            for x in range(x0, x1):
                if source.getpixel((x, y))[3]:
                    for yy in range(y * scale, (y + 1) * scale):
                        for xx in range(x * scale, (x + 1) * scale):
                            tint.putpixel((xx, yy), COLORS[name])
    overlay = Image.alpha_composite(overlay, tint)
    draw = ImageDraw.Draw(overlay)
    for name, spec in PARTS.items():
        pivot = spec.get("hip", spec.get("knee", spec.get("ankle")))
        draw.rectangle((pivot[0] * scale - 2, pivot[1] * scale - 2,
                        pivot[0] * scale + 2, pivot[1] * scale + 2), fill=(255, 255, 255, 255))
        x0, y0 = spec["box"][:2]
        draw.text((x0 * scale, y0 * scale), name, fill=(255, 255, 255, 255))
    overlay.save(output_dir / "source-masks-and-pivots.png", optimize=False)


def build_sample(output_dir):
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    source = Image.open(SOURCE).convert("RGBA")
    if source.size != SIZE:
        raise ValueError(f"expected {SIZE} source master, got {source.size}")
    source_colors = sorted({pixel[:3] for pixel in source.getdata() if pixel[3]})
    _, part_records = mask_layers(source, output_dir)
    base = build_base(source)
    base.save(output_dir / "body-base.png", optimize=False)
    save_mask_overlay(source, output_dir)

    frames, records = [], []
    for pose in POSES:
        frame, _, _, _, record = render_pose(source, base, pose, output_dir)
        frames.append(frame)
        records.append(record)
    sheet = Image.new("RGBA", (SIZE[0] * len(frames), SIZE[1]), TRANSPARENT)
    for i, frame in enumerate(frames):
        sheet.alpha_composite(frame, (i * SIZE[0], 0))
    sheet.save(output_dir / "run-sheet.png", optimize=False)

    idle_sheet = Image.open(IDLE).convert("RGBA")
    idle = idle_sheet.crop((0, 0, SIZE[0], SIZE[1]))
    contact = Image.new("RGBA", (5 * SIZE[0], SIZE[1] + 14), (22, 22, 22, 255))
    labels = ["idle-source", *(pose["name"] for pose in POSES)]
    draw = ImageDraw.Draw(contact)
    for i, (label, frame) in enumerate(zip(labels, [idle, *frames])):
        contact.alpha_composite(frame, (i * SIZE[0], 0))
        draw.text((i * SIZE[0] + 2, SIZE[1] + 2), label, fill=(255, 255, 255, 255))
    contact.save(output_dir / "contact-sheet.png", optimize=False)
    contact.resize((contact.width * 4, contact.height * 4), Image.Resampling.NEAREST).save(output_dir / "contact4x.png")
    make_gif(frames, output_dir / "run-feasibility.gif", source_colors)

    manifest = {
        "source": str(SOURCE.relative_to(ROOT)), "source_sha256": sha256(SOURCE),
        "production_asset_sha256": {str(path.relative_to(ROOT)): sha256(path) for path in PRODUCTION},
        "scope": "four-pose reversible cut-out sample; source head, torso, arms, and blades retained",
        "mask_policy": "opaque source pixels inside source-coordinate boxes only; no hidden anatomy invented",
        "source_palette_rgb": [list(color) for color in source_colors], "parts": part_records,
        "source_joint_overlap_caps": {
            "near_hip_body": source_overlap_count(source, PARTS["near_thigh"]["box"],
                                                   (37, 41, 45, 44)),
            "near_knee_thigh_shin": source_overlap_count(source, PARTS["near_thigh"]["box"],
                                                          PARTS["near_shin"]["box"]),
            "near_ankle_shin_foot": source_overlap_count(source, PARTS["near_shin"]["box"],
                                                           PARTS["near_foot"]["box"]),
            "far_hip_body": source_overlap_count(source, PARTS["far_thigh"]["box"],
                                                  (55, 40, 62, 43)),
            "far_knee_thigh_shin": source_overlap_count(source, PARTS["far_thigh"]["box"],
                                                         PARTS["far_shin"]["box"]),
            "far_ankle_shin_foot": source_overlap_count(source, PARTS["far_shin"]["box"],
                                                         PARTS["far_foot"]["box"]),
        },
        "source_cleanup": {"shadow_row_y": 58, "shadow_x_range_exclusive": [24, 74],
                           "detached_fleck_pixels": [[28, 48], [29, 48], [28, 49], [29, 49]]},
        "poses": records,
        "artifacts": ["run-sheet.png", "contact-sheet.png", "contact4x.png",
                      "source-masks-and-pivots.png", "run-feasibility.gif",
                      "part-layers/<pose>/<part>.png", "padded-part-layers/<pose>/<part>.png",
                      "padded-composites/<pose>.png"],
        "limitations": ["source pose is three-quarter/front-facing, not a true side profile",
                        "nearest-neighbor rotation changes cluster placement and pixel counts",
                        "weapon count and aesthetic quality require independent visual review"],
    }
    (output_dir / "provenance.json").write_text(json.dumps(manifest, indent=2, sort_keys=True) + "\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output-dir", type=Path,
                        default=ROOT / "scratch/kratos_modular_sample/v2",
                        help="isolated output directory; defaults to scratch/kratos_modular_sample/v2")
    build_sample(parser.parse_args().output_dir)
