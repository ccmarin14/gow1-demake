---
name: pixel-art-character-consistency
description: Enforces visual consistency and semantic ASCII authoring rules for 2D pixel art character sprites. Use whenever creating, modifying, or reviewing character grids, palettes, or animations.
---

# Pixel Art Character Consistency (Semantic ASCII Pipeline)

## Overview

Character sprites in this repository are authored as plain-text semantic ASCII grids in `grids/` and rasterized deterministically to PNG via `scripts/ascii_to_png.py`. PNG files are derived artifacts and must never be edited by hand.

## Core Rules

### 1. Semantic ASCII Authoring
- Every character in a grid maps to a named material/color role in `palette/` (e.g., outline, lit skin, shadow skin, crimson mark, bronze, leather), with `.` for transparency.
- Never import noisy luminance-sorted grids from generated images (`png_to_ascii` is archived). Grids must remain human-readable and directly editable as text.

### 2. Direct Pose Drawing (No Procedural Distortion)
- Do not generate humanoid sprites with procedural vector lines, polygons, or trigonometric limb scripts.
- Do not auto-derive animation frames by shearing, translating, or rotating slices of the master grid via script. Every frame is drawn directly in its ASCII grid while preserving the character's head, torso proportions, and color roles.

### 3. Layer Separation
- Character grids contain only the character's body and clothing.
- Do not bake extended chains, weapon trails, or ground shadows into the character grid; `WeaponLayer` and scene shadow rendering handle those separately.

### 4. Incremental Visual Review
- Work one frame at a time.
- Rasterize the frame with `scripts/ascii_to_png.py`, render an upscaled nearest-neighbor preview alongside the base pose, and wait for user approval before drawing the next frame. Commit a frame only after it is approved (one frame per commit).

## Verification Checklist

- [ ] Grid dimensions match the character's declared width and height.
- [ ] Every character in the grid exists in the palette file (binary alpha `{0, 255}`).
- [ ] Grounded poses rest on the declared ground row.
- [ ] Browser console and network requests have zero errors when the frame is connected in game.
