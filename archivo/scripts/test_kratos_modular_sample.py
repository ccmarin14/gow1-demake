"""Independent deterministic checks for the isolated Kratos cut-out sample."""

import hashlib
import importlib.util
import json
import tempfile
import unittest
from collections import deque
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "public/assets/characters/kratos-neutral.png"
BUILDER = ROOT / "scripts/build-kratos-modular-sample.py"
PRODUCTION = [ROOT / f"public/assets/characters/kratos-{name}.png"
              for name in ("neutral", "idle", "run", "air", "attack", "roll")]
SIZE = (97, 59)
POSES = ("run-01-contact-near", "run-02-pass-near",
         "run-03-contact-far", "run-04-pass-far")
PARTS = ("near_thigh", "near_shin", "near_foot",
         "far_thigh", "far_shin", "far_foot")


def sha256(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def file_hashes(folder):
    return {path.relative_to(folder).as_posix(): sha256(path)
            for path in folder.rglob("*") if path.is_file()}


def load_builder():
    spec = importlib.util.spec_from_file_location("kratos_modular_sample_builder", BUILDER)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"could not load generator {BUILDER}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def alpha_points(image):
    image = image.convert("RGBA")
    return {(x, y) for y in range(image.height) for x in range(image.width)
            if image.getpixel((x, y))[3]}


def overlap_count(first, second):
    return len(alpha_points(first) & alpha_points(second))


def connected_components(points):
    remaining = set(points)
    sizes = []
    while remaining:
        seed = remaining.pop()
        queue = deque([seed])
        size = 1
        while queue:
            x, y = queue.popleft()
            for nx in range(x - 1, x + 2):
                for ny in range(y - 1, y + 2):
                    point = (nx, ny)
                    if point in remaining:
                        remaining.remove(point)
                        queue.append(point)
                        size += 1
        sizes.append(size)
    return sorted(sizes, reverse=True)


def alpha_bbox(image):
    points = alpha_points(image)
    if not points:
        return None
    xs, ys = zip(*points)
    return min(xs), min(ys), max(xs) + 1, max(ys) + 1


def generated_sample(test):
    class SampleContext:
        def __enter__(self):
            self.tmp = tempfile.TemporaryDirectory(prefix="kratos-modular-v2-")
            self.root = Path(self.tmp.name)
            load_builder().build_sample(self.root)
            return self.root

        def __exit__(self, *args):
            self.tmp.cleanup()
    return SampleContext()


class ModularSampleTests(unittest.TestCase):
    def test_build_is_reproducible_and_preserves_production_assets(self):
        before = {path: sha256(path) for path in [SOURCE, *PRODUCTION]}
        with tempfile.TemporaryDirectory(prefix="kratos-modular-a-") as tmp_a, \
             tempfile.TemporaryDirectory(prefix="kratos-modular-b-") as tmp_b:
            first, second = Path(tmp_a), Path(tmp_b)
            load_builder().build_sample(first)
            load_builder().build_sample(second)
            self.assertEqual(file_hashes(first), file_hashes(second))
            self.assertTrue((first / "provenance.json").is_file())
            self.assertEqual(set(POSES), {p.stem for p in first.glob("run-*.png")
                                          if p.name != "run-sheet.png"})
        self.assertEqual(before, {path: sha256(path) for path in [SOURCE, *PRODUCTION]})

    def test_frame_palette_alpha_sheet_and_indexed_gif(self):
        source = Image.open(SOURCE).convert("RGBA")
        palette = {pixel[:3] for pixel in source.getdata() if pixel[3]}
        with generated_sample(self) as output:
            frames = []
            for pose in POSES:
                frame = Image.open(output / f"{pose}.png").convert("RGBA")
                self.assertEqual(frame.size, SIZE)
                self.assertTrue({p[3] for p in frame.getdata()} <= {0, 255})
                self.assertTrue({p[:3] for p in frame.getdata() if p[3]} <= palette)
                frames.append(frame.tobytes())
            self.assertEqual(len(set(frames)), 4)
            with Image.open(output / "run-sheet.png") as sheet:
                self.assertEqual(sheet.size, (388, 59))
            with Image.open(output / "contact4x.png") as contact_image:
                contact = contact_image.copy()
            self.assertEqual(contact.size, (5 * 97 * 4, (59 + 14) * 4))
            with Image.open(output / "run-feasibility.gif") as gif:
                self.assertEqual(gif.mode, "P")
                self.assertEqual(gif.n_frames, 4)
                self.assertEqual(gif.info.get("transparency"), 0)
                for index in range(gif.n_frames):
                    gif.seek(index)
                    self.assertEqual(gif.size, SIZE)
                    rgba = gif.convert("RGBA")
                    self.assertTrue({p[3] for p in rgba.getdata()} <= {0, 255})
                    self.assertEqual(rgba.getpixel((0, 0))[3], 0,
                                     f"GIF frame {index} lost alpha at transparent corner")
                    gif_colors = {p[:3] for p in rgba.getdata() if p[3]}
                    self.assertTrue(gif_colors <= palette)

    def test_actual_part_layers_connect_at_hips_knees_and_ankles(self):
        with generated_sample(self) as output:
            for pose in POSES:
                folder = output / "part-layers" / pose
                body = Image.open(folder / "body-base.png").convert("RGBA")
                frame = Image.open(output / f"{pose}.png").convert("RGBA")
                self.assertEqual(body.size, SIZE)
                for side in ("near", "far"):
                    thigh = Image.open(folder / f"{side}_thigh.png").convert("RGBA")
                    shin = Image.open(folder / f"{side}_shin.png").convert("RGBA")
                    foot = Image.open(folder / f"{side}_foot.png").convert("RGBA")
                    self.assertGreaterEqual(overlap_count(body, thigh), 2,
                                            f"{pose} {side} thigh lacks torso hip overlap")
                    self.assertGreaterEqual(overlap_count(thigh, shin), 2,
                                            f"{pose} {side} knee cap disconnected")
                    self.assertGreaterEqual(overlap_count(shin, foot), 2,
                                            f"{pose} {side} ankle cap disconnected")
                    self.assertIsNotNone(alpha_bbox(thigh))
                    self.assertIsNotNone(alpha_bbox(shin))
                    self.assertIsNotNone(alpha_bbox(foot))
                # Exclude only four known detached master flecks; no limb or shadow
                # component larger than four pixels may remain disconnected.
                sizes = connected_components(alpha_points(frame))
                self.assertEqual([size for size in sizes if size > 4], [sizes[0]],
                                 f"{pose} has detached components {sizes}")

    def test_support_and_swing_are_measured_from_exported_foot_layers(self):
        with generated_sample(self) as output:
            expected = {
                "run-01-contact-near": {"near": 58, "far": 54},
                "run-02-pass-near": {"near": 54, "far": 55},
                "run-03-contact-far": {"near": 54, "far": 58},
                "run-04-pass-far": {"near": 55, "far": 54},
            }
            for pose, feet in expected.items():
                folder = output / "part-layers" / pose
                body = Image.open(folder / "body-base.png").convert("RGBA")
                self.assertFalse(any(body.getpixel((x, 58))[3] for x in range(SIZE[0])),
                                 f"{pose} body base still contains the source shadow")
                frame = Image.open(output / f"{pose}.png").convert("RGBA")
                feet_layers = {side: Image.open(folder / f"{side}_foot.png").convert("RGBA")
                               for side in ("near", "far")}
                for side, wanted_bottom in feet.items():
                    foot = Image.open(folder / f"{side}_foot.png").convert("RGBA")
                    box = alpha_bbox(foot)
                    self.assertIsNotNone(box)
                    actual_bottom = box[3] - 1
                    self.assertEqual(actual_bottom, wanted_bottom,
                                     f"{pose} {side} foot mask bottom {actual_bottom}")
                for x in range(SIZE[0]):
                    frame_row = frame.getpixel((x, 58))[3] > 0
                    foot_row = any(feet_layers[side].getpixel((x, 58))[3]
                                   for side in ("near", "far"))
                    self.assertEqual(frame_row, bool(foot_row),
                                     f"{pose} y=58 support pixel is not from an exported FOOT layer")

    def test_padded_layers_prove_zero_clip_and_joint_poses_move(self):
        pad = 64
        with generated_sample(self) as output:
            knee_centroids = []
            for pose in POSES:
                padded = Image.open(output / "padded-composites" / f"{pose}.png").convert("RGBA")
                self.assertEqual(padded.size, (97 + 2 * pad, 59 + 2 * pad))
                outside = sum(padded.getpixel((x, y))[3] > 0
                              for y in range(padded.height) for x in range(padded.width)
                              if not (pad <= x < pad + 97 and pad <= y < pad + 59))
                self.assertEqual(outside, 0, f"{pose} clipped before final crop")
                crop = padded.crop((pad, pad, pad + 97, pad + 59))
                self.assertEqual(crop.tobytes(), Image.open(output / f"{pose}.png").convert("RGBA").tobytes())
                folder = output / "part-layers" / pose
                thigh = Image.open(folder / "near_thigh.png").convert("RGBA")
                shin = Image.open(folder / "near_shin.png").convert("RGBA")
                joint = alpha_points(thigh) & alpha_points(shin)
                self.assertGreaterEqual(len(joint), 2)
                knee_centroids.append((round(sum(x for x, _ in joint) / len(joint)),
                                       round(sum(y for _, y in joint) / len(joint))))
            self.assertGreaterEqual(len(set(knee_centroids)), 3,
                                    f"near knee did not articulate across poses: {knee_centroids}")

    def test_source_parts_and_provenance_are_pixel_derived(self):
        source = Image.open(SOURCE).convert("RGBA")
        with generated_sample(self) as output:
            manifest = json.loads((output / "provenance.json").read_text())
            self.assertEqual(manifest["source_sha256"], sha256(SOURCE))
            self.assertEqual(len(manifest["parts"]), 6)
            for part in manifest["parts"]:
                x0, y0, x1, y1 = part["source_box"]
                expected = source.crop((x0, y0, x1, y1))
                actual = Image.open(output / part["file"]).convert("RGBA")
                self.assertEqual(actual.tobytes(), expected.tobytes(), part["name"])
                self.assertEqual(part["source_opaque_pixels"], len(alpha_points(actual)))
            self.assertEqual(len(manifest["poses"]), 4)
            self.assertTrue(all("part_transforms" in pose for pose in manifest["poses"]))
            self.assertTrue(all(count > 0 for count in manifest["source_joint_overlap_caps"].values()))
            with Image.open(output / "source-masks-and-pivots.png") as overlay:
                self.assertEqual(overlay.size, (97 * 8, 59 * 8))


if __name__ == "__main__":
    unittest.main()
