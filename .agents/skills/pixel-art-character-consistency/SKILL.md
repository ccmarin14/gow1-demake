---
name: pixel-art-character-consistency
description: Enforces visual consistency and anti-mutation invariants for 2D pixel art character sprites. Use whenever modifying, animating, or reviewing character sprites, sheets, or animations (Kratos, enemies, bosses). Enforces single-master-model anatomy, one weapon per hand, browser side-by-side verification (idle vs run), and forbids procedural line drawing.
---

# Pixel Art Character Consistency & Anti-Mutation Audit

## Overview

In 2D retro action games (especially pixel art at low internal resolutions like $480 \times 270$ with $97 \times 59$ character frames), visual consistency between states is critical. A character must never mutate style, proportions, weapons, or face when transitioning from one animation state to another (e.g., from `idle` to `run`).

This skill guarantees that:
1. No procedural line drawing or wireframe algorithms (`draw_limb_segment`, `ImageDraw.polygon`, mathematical loops) are used to generate human sprites.
2. All animation states (`idle`, `run`, `air`, `attack`, `roll`) share the **exact same master anatomical model**.
3. Weapons are anatomically held: exactly **one Blade of Chaos per hand**, never two clustered on one side.
4. Every change is verified live in the browser using Chrome DevTools Protocol, generating a side-by-side composite: `[Idle on deck]` vs `[Run on deck]`.

---

## The 4 Golden Invariants

### 1. Prohibition of Procedural Vector Lines
- Human characters must be authentic rasterized pixel art.
- Strictly forbidden: `draw_limb_segment`, trigonometric joint connectors (`math.sin`, `math.cos`), Bresenham line cylinders.
- Why: Procedural line algorithms create wireframes, mantis-like spider legs, or rigid square pipes that destroy the anatomical volume of Spartan musculature.

### 2. Single Master Model (Zero Mutations Across States)
- If `kratos-neutral.png` has a defined skull, face, torso, pteruges, and weapons, the running cycle (`kratos-run.png`) must reuse those exact same pixel clusters.
- The legs and arms must articulate as anatomical limbs, not as redrawn vector stick figures.
- When the player presses a movement key, the sprite must NOT visibly change art style, head shape, or muscle mass.

### 3. Exact Weapon Validation
- Kratos wields the Blades of Chaos: exactly **one blade held in each hand**.
- Never draw or allow a sprite where two blades are welded to one hand or arm stump.
- Hands must have visible gauntlets, closed fists, and bronze hilts/crossguards.

### 4. Mandatory Side-by-Side Transition Capture in Browser
- Run the game on Vite and connect via Chrome CDP.
- Capture a frame of Kratos standing in `idle` on the ship's deck.
- Capture a frame of Kratos actively running in `run` at the same scale.
- Composite both frames side by side with 4x nearest-neighbor scaling.
- If the head, face, weapons, or torso differ in style, the audit fails immediately.

---

## Verification Checklist

Before presenting any visual sprite work to the user:

- [ ] Spritesheet dimensions match engine specifications ($97 \times 59$ per frame).
- [ ] Ground contact is solid at $y=58$ (`bbox[3] == 59`) across all walking/standing frames.
- [ ] Alpha channel is 100% binary $\{0, 255\}$.
- [ ] Colors strictly conform to the 12-color canonical palette.
- [ ] Exactly one Blade of Chaos per hand.
- [ ] Face has clear brow, Greek nose, goatee, and crimson Ares tattoo.
- [ ] Browser side-by-side composite generated and visually confirmed: zero style mutation between `idle` and `run`.
- [ ] Zero console errors in browser runtime.
