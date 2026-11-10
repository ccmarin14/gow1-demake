#!/usr/bin/env bash
# One legionnaire draft frame: 3D render -> palette grid -> enlarged preview (BL-21).
#
# Usage: scripts/pose_render/legionnaire_frame.sh <name> <action> <frame> [pose.json]
#   name    label for the outputs, e.g. hitstun-00
#   action  an animation of the UAL model, e.g. Hit_Chest, Death01, Sword_Attack
#   frame   frame number of that action
#   pose    optional pose file (scripts/pose_render/poses/leg-*.json)
#
# Writes to docs/tmp/legionario/draft/ (git-ignored), never to grids/:
#   <name>.txt          the grid, feet on row 55
#   <name>-preview.png  the grid enlarged 10x with the legionnaire palette
# Copying the .txt into grids/legionnaire/ is a separate, deliberate step.
set -euo pipefail

if [ "$#" -lt 3 ]; then
  sed -n '2,13p' "$0"
  exit 2
fi
name=$1 action=$2 frame=$3 pose=${4:-}
root=$(cd "$(dirname "$0")/../.." && pwd)
out="$root/docs/tmp/legionario/draft"
mkdir -p "$out/$name"
cd "$root"

args=(scripts/pose_render/legionnaire.json "$action" "$out/$name" "$frame")
[ -n "$pose" ] && args+=("$pose")
"${BLENDER:-$HOME/.local/bin/blender}" -b --python scripts/pose_render/render.py -- "${args[@]}" >"$out/$name/blender.log" 2>&1 \
  || { tail -20 "$out/$name/blender.log"; exit 1; }

raw=$(printf '%s/%s/%s_%03d.png' "$out" "$name" "$action" "$frame")
python3 scripts/pose_render/to_grid.py "$raw" "$out/$name.txt" --config scripts/pose_render/legionnaire.json --ground 55
python3 scripts/preview_grid.py "$out/$name.txt" --palette palette/legionnaire.json --scale 10 --out "$out/$name-preview.png"
echo "grid:    $out/$name.txt"
echo "preview: $out/$name-preview.png"
