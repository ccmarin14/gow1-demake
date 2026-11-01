"""Render a pose guide of the 3D mannequin with Blender (D-34).

Usage:
    blender -b --python scripts/pose_render/render.py -- <config.json> <action> <out_dir> <frames> [pose.json]

`pose.json` (optional) adjusts the action for Kratos' attitude:
    {
      "camera_yaw_deg": 45,                      # optional, overrides the config
      "rotations": {"spine_02": [[1, 0, 0], -10]}, # bone-local axis, degrees
      "ik": {"hand_r": {"target": [x, y, z], "pole": [x, y, z]}}
    }
`ik` places a hand at a world point (meters; the model faces -Y, up is +Z,
-X is toward the camera) with a two-bone chain; the pole aims the elbow.

Example:
    blender -b --python scripts/pose_render/render.py -- scripts/pose_render/kratos.json \
        Sprint_Loop docs/tmp/poseref/run 0,2,4,6,8,10,12,14

Each pixel encodes what `to_grid.py` needs, not a final color:
    R = material (skin 0.25, leather 0.5, foot 0.75)
    G = tone, four flat steps of a toon ramp (0.2 dark .. 0.8 lit)
    B = side (near 0.8, far 0.3)
The render is 8x the sprite canvas; `to_grid.py` reduces it to the palette grid.
Next to each PNG it writes `<name>.bones.json`: where the bones the weapon
layer needs (`BONES`) fall on the 64x56 sprite canvas, before any `--ground`
shift (`build_anchors.py` applies it).
"""

import json
import math
import os
import sys

import bpy
from bpy_extras.object_utils import world_to_camera_view
from mathutils import Quaternion, Vector

SCALE = 8
TONE_STOPS = [(0.0, 0.2), (0.18, 0.4), (0.42, 0.6), (0.7, 0.8)]
MATERIALS = [("skin", 0.25), ("leather", 0.5), ("foot", 0.75)]
SIDES = [("near", 0.8), ("far", 0.3)]
ALWAYS_NEAR = ("Head", "neck_01")
# Bones exported per frame: the spine, neck and pelvis carry the blades on the back.
BONES = ("hand_r", "hand_l", "upperarm_r", "upperarm_l", "spine_02", "spine_03", "neck_01", "pelvis")

args = sys.argv[sys.argv.index("--") + 1:]
config_path, action_name, out_dir, frame_list = args[:4]
with open(config_path, encoding="utf-8") as handle:
    cfg = json.load(handle)
pose_offsets: dict = {}
pose_ik: dict = {}
if len(args) > 4:
    with open(args[4], encoding="utf-8") as handle:
        pose = json.load(handle)
    pose_offsets = pose.get("rotations", {})
    pose_ik = pose.get("ik", {})
    cfg["camera_yaw_deg"] = pose.get("camera_yaw_deg", cfg["camera_yaw_deg"])
frames = [int(value) for value in frame_list.split(",")]
os.makedirs(out_dir, exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=cfg["model"])
for obj in list(bpy.data.objects):
    if obj.name.startswith("Icosphere"):
        bpy.data.objects.remove(obj)
armature = bpy.data.objects["Armature"]
body = bpy.data.objects["Mannequin"]
action = bpy.data.actions[action_name]
armature.animation_data.action = action
if armature.animation_data.action_slot is None and len(action.slots):
    armature.animation_data.action_slot = action.slots[0]


def toon_material(name: str, red: float, blue: float) -> bpy.types.Material:
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    nodes.clear()
    diffuse = nodes.new("ShaderNodeBsdfDiffuse")
    to_rgb = nodes.new("ShaderNodeShaderToRGB")
    ramp = nodes.new("ShaderNodeValToRGB")
    emission = nodes.new("ShaderNodeEmission")
    output = nodes.new("ShaderNodeOutputMaterial")
    ramp.color_ramp.interpolation = "CONSTANT"
    elements = ramp.color_ramp.elements
    for i, (position, green) in enumerate(TONE_STOPS):
        element = elements[i] if i < 2 else elements.new(position)
        element.position = position
        element.color = (red, green, blue, 1)
    links.new(diffuse.outputs[0], to_rgb.inputs[0])
    links.new(to_rgb.outputs[0], ramp.inputs[0])
    links.new(ramp.outputs[0], emission.inputs[0])
    links.new(emission.outputs[0], output.inputs[0])
    return mat


slots: dict[tuple[str, str], int] = {}
body.data.materials.clear()
for mat_name, red in MATERIALS:
    for side, blue in SIDES:
        slots[(mat_name, side)] = len(body.data.materials)
        body.data.materials.append(toon_material(f"{mat_name}_{side}", red, blue))

group_names = {group.index: group.name for group in body.vertex_groups}


def dominant_group(vertex) -> str:
    best = max(vertex.groups, key=lambda g: g.weight, default=None)
    return group_names[best.group] if best else ""


def material_of(bone: str) -> str:
    bone = bone.lower()
    if "foot" in bone or "ball" in bone:
        return "foot"
    if any(key in bone for key in cfg["leather_bones"]):
        return "leather"
    return "skin"


# The model's left side faces away from the camera, so `_l` bones are the far side.
vertices = body.data.vertices
for poly in body.data.polygons:
    bones = [dominant_group(vertices[i]) for i in poly.vertices]
    far = sum(b.endswith("_l") for b in bones) * 2 > len(bones) and not any(b in ALWAYS_NEAR for b in bones)
    kinds = [material_of(b) for b in bones]
    poly.material_index = slots[(max(set(kinds), key=kinds.count), "far" if far else "near")]

scene = bpy.context.scene
skirt = cfg.get("skirt")
if skirt:
    pelvis = armature.matrix_world @ armature.data.bones["pelvis"].head_local
    bpy.ops.mesh.primitive_cone_add(
        vertices=24,
        radius1=skirt["bottom_radius"],
        radius2=skirt["top_radius"],
        depth=skirt["depth"],
        end_fill_type="NOTHING",
        location=(pelvis.x, pelvis.y, pelvis.z - skirt["drop"]),
    )
    cone = bpy.context.active_object
    group = cone.vertex_groups.new(name="pelvis")
    group.add([v.index for v in cone.data.vertices], 1.0, "REPLACE")
    cone.modifiers.new("armature", "ARMATURE").object = armature
    cone.modifiers.new("solidify", "SOLIDIFY").thickness = 0.01
    cone.data.materials.append(body.data.materials[slots[("leather", "near")]])

sun = bpy.data.lights.new("sun", "SUN")
sun.energy = 4.0
sun_obj = bpy.data.objects.new("sun", sun)
scene.collection.objects.link(sun_obj)
travel = Vector(cfg["light_dir"]).normalized()
sun_obj.rotation_euler = (-travel).to_track_quat("Z", "Y").to_euler()

frame = cfg["frame"]
px_per_m = frame["body_px"] / frame["model_height_m"]
yaw = math.radians(cfg["camera_yaw_deg"])
camera = bpy.data.cameras.new("cam")
camera.type = "ORTHO"
camera.ortho_scale = frame["w"] / px_per_m
camera_obj = bpy.data.objects.new("cam", camera)
scene.collection.objects.link(camera_obj)
scene.camera = camera_obj
camera_obj.rotation_euler = (math.radians(90), 0, math.radians(-90) + yaw)
camera_obj.location = (-10 * math.cos(yaw), -10 * math.sin(yaw), (frame["h"] / 2 - 1) / px_per_m)

engines = [e.identifier for e in bpy.types.RenderSettings.bl_rna.properties["engine"].enum_items]
scene.render.engine = "BLENDER_EEVEE" if "BLENDER_EEVEE" in engines else "BLENDER_EEVEE_NEXT"
scene.render.resolution_x = frame["w"] * SCALE
scene.render.resolution_y = frame["h"] * SCALE
scene.render.film_transparent = True
scene.render.filter_size = 0.0
scene.view_settings.view_transform = "Standard"
scene.render.image_settings.file_format = "PNG"
scene.render.image_settings.color_mode = "RGBA"

# Thicken the mannequin toward Kratos. Children must not inherit the scale or
# the limbs would compound it; the handler reapplies it after the action pose.
for bone in armature.data.bones:
    bone.inherit_scale = "NONE"


def apply_bulk(_scene, *_args) -> None:
    for pose_bone in armature.pose.bones:
        name = pose_bone.name.lower()
        for key, value in cfg["bulk"].items():
            if key.lower() in name:
                pose_bone.scale = value if isinstance(value, list) else (value, 1.0, value)
                break
    for bone_name, (axis, degrees) in pose_offsets.items():
        pose_bone = armature.pose.bones[bone_name]
        pose_bone.rotation_mode = "QUATERNION"
        pose_bone.rotation_quaternion = pose_bone.rotation_quaternion @ Quaternion(axis, math.radians(degrees))


bpy.app.handlers.frame_change_post.append(apply_bulk)


def add_empty(name: str, location) -> bpy.types.Object:
    empty = bpy.data.objects.new(name, None)
    empty.location = location
    bpy.context.scene.collection.objects.link(empty)
    return empty


for hand, spec in pose_ik.items():
    forearm = armature.pose.bones[hand.replace("hand", "lowerarm")]
    constraint = forearm.constraints.new("IK")
    constraint.target = add_empty(f"ik_{hand}", spec["target"])
    constraint.chain_count = 2
    if "pole" in spec:
        constraint.pole_target = add_empty(f"pole_{hand}", spec["pole"])
        constraint.pole_angle = math.radians(spec.get("pole_angle", -90))
def bone_points() -> dict:
    """Head of each exported bone on the sprite canvas (x right, y down)."""
    bpy.context.view_layer.update()
    points = {}
    for name in BONES:
        world = armature.matrix_world @ armature.pose.bones[name].head
        view = world_to_camera_view(scene, camera_obj, world)
        points[name] = [round(view.x * frame["w"], 2), round((1 - view.y) * frame["h"], 2)]
    return points


for number in frames:
    scene.frame_set(number)
    stem = os.path.join(out_dir, f"{action_name}_{number:03d}")
    scene.render.filepath = stem + ".png"
    bpy.ops.render.render(write_still=True)
    with open(stem + ".bones.json", "w", encoding="utf-8") as handle:
        json.dump(bone_points(), handle)
