#!/usr/bin/env python3
"""Generates art/hud/chaos-blade.svg (the HUD Chaos Blade) from measured outline data.

Usage: python3 scripts/build_hud_sword_svg.py && python3 scripts/render_hud_sword.py

The outline was measured on a clean median of the GoW 1 HUD (proportions only, no pixels are
copied). Coordinates are in the 640x360 reference frame; the group translate moves them to the
184x72 HUD image. The bar troughs (167,33.5 64x7 and 167,47.5 54x6) must match hudWells.ts.
"""
import math
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent

def zb(cx, cy):
    """Blade trace: zoom-crop pixels of the reference (box 480,90 at 1.5x) to frame coordinates."""
    return 180 + cx / 9.0, 15 + cy / 9.0


def zh(cx, cy):
    """Hilt trace: zoom-crop pixels of the reference (box 60,90 at 1.6x) to frame coordinates."""
    return 110 + cx / 9.6, 15 + cy / 9.6


def path(tokens, conv):
    out = []
    for cmd, *pts in tokens:
        xy = " ".join(f"{conv(*pt)[0]:.1f} {conv(*pt)[1]:.1f}" for pt in pts)
        out.append(f"{cmd}{xy}")
    return " ".join(out) + " Z"


# Outer silhouette: bar, three bat-wing peaks with concave scallops, long hooked tip, fuller convex
# lower belly with waist tuck after the hook, V-recess, broad ramped spur, short flat run, 45-deg
# step-up and lower heel under the counter box (measured on the 720p HUD median).
SILHOUETTE = (
    path([
        ("M", (-198, 128)), ("L", (100, 120)), ("L", (205, 118)), ("L", (238, 60)),
        ("C", (262, 100), (380, 126), (505, 118)),
        ("L", (518, 66)), ("Q", (530, 92), (548, 102)), ("L", (572, 52)),
        ("Q", (598, 80), (636, 102)), ("L", (650, 45)),
        ("C", (690, 88), (840, 96), (940, 36)),
    ], zb)[:-2]
    + " C281.0 38.2 269.8 57.2 247.5 60.5"
    + " C242.5 61.2 239.2 60.4 236.8 59.0"
    + " L230.2 65.2 L229.0 57.8"
    + " Q226.8 55.4 223.2 55.2"
    + " L218.4 55.2 L217.4 64.8"
    + " C212.2 62.2 206.2 59.0 200.5 57.6"
    + " L179.0 57.6 L173.8 61.4 L158.0 61.4 Z"
)
# Inner face: extends down to cover the left base/shank (which is medium steel in 720p, not a white stripe),
# then steps up at the rage bar end so the bright silver bevel gleams on the spur tip and the curved front edge.
FACE = (
    path([
        ("M", (-198, 142)), ("L", (205, 138)), ("Q", (228, 138), (242, 110)),
        ("C", (300, 128), (400, 158), (500, 132)), ("L", (548, 144)), ("L", (600, 150)),
        ("L", (645, 152)), ("C", (690, 142), (705, 152), (740, 152)),
        ("C", (790, 150), (830, 125), (862, 96)),
    ], zb)[:-2]
    + " C275.0 32.5 268.8 44.2 257.8 50.8"
    + " C250.5 55.0 242.5 55.8 236.2 54.4"
    + " L231.2 57.2 L223.8 51.2 L218.0 51.0 L215.8 55.0"
    + " L212.6 62.2 C208.5 60.0 204.2 58.2 200.2 57.4"
    + " L179.0 57.4 L173.8 61.0 L158.0 61.0 Z"
)
BLADE = SILHOUETTE
CX, CY, R = 133.0, 63.5, 17.0


def spikes() -> str:
    """3D faceted silver cardinal spikes + subtle small diagonal lugs around the medallion ring."""
    out = []
    for deg in range(0, 360, 45):
        a = math.radians(deg)
        big = deg % 90 == 0
        if big:
            reach = 3.7 if deg == 180 else (5.8 if deg == 270 else 5.2)
            half = 4.4
        else:
            reach, half = 2.0, 2.0
        ux, uy = math.cos(a), math.sin(a)
        px, py = -uy, ux
        base = R - 1.2
        p1 = (CX + ux * base + px * half, CY + uy * base + py * half)
        p2 = (CX + ux * base - px * half, CY + uy * base - py * half)
        tip = (CX + ux * (R + reach), CY + uy * (R + reach))
        mid = (CX + ux * base, CY + uy * base)
        if big:
            # Two-facet 3D pyramid spike (lit upper/left facet, shaded lower/right facet) as in 720p
            lit_first = deg in (180, 270)
            c_a, c_b = ("#e6eaee", "#6d737b") if lit_first else ("#6d737b", "#dce0e5")
            out.append(
                f'<path d="M{p1[0]:.1f} {p1[1]:.1f} L{tip[0]:.1f} {tip[1]:.1f} L{mid[0]:.1f} {mid[1]:.1f} Z" fill="{c_a}" stroke="none"/>'
                f'<path d="M{mid[0]:.1f} {mid[1]:.1f} L{tip[0]:.1f} {tip[1]:.1f} L{p2[0]:.1f} {p2[1]:.1f} Z" fill="{c_b}" stroke="none"/>'
                f'<path d="M{p1[0]:.1f} {p1[1]:.1f} L{tip[0]:.1f} {tip[1]:.1f} L{p2[0]:.1f} {p2[1]:.1f} Z" fill="none" stroke="#0d0a09" stroke-width="0.9" stroke-linejoin="round"/>'
            )
        else:
            out.append(f'<path d="M{p1[0]:.1f} {p1[1]:.1f} L{tip[0]:.1f} {tip[1]:.1f} L{p2[0]:.1f} {p2[1]:.1f} Z"/>')
    return "".join(out)


# Sculpted jagged bone pommel talon at the far left of the handle (top beak at y~28.4, matching 720p & 360p median).
POMMEL = (
    "M113.0 28.4 C114.6 28.6 116.2 31.2 118.0 31.6 L120.6 31.2 C122.8 33.0 124.8 35.8 125.4 39.2 "
    "C124.6 42.2 122.4 44.4 119.4 45.4 L117.2 44.6 C115.6 41.2 114.0 36.8 113.2 32.2 "
    "C112.9 30.4 112.8 28.8 113.0 28.4 Z"
)
# Dark blackened-iron core behind the chain grip & behind the medallion's upper arc.
GRIP_CORE = (
    "M120.0 33.0 C126.5 30.8 138.5 30.8 149.5 34.0 L155.5 31.5 L155.5 52.5 L146.5 53.0 "
    "C142.5 47.0 133.5 45.0 120.0 46.0 Z"
)
# Skull cranium extended seamlessly into a shaded occiput/neck at back-left (no internal black seam).
BLOB = (
    "M148.8 35.2 C149.6 31.8 152.6 29.4 155.8 27.6 C157.8 25.4 160.2 24.0 162.8 23.4 "
    "L164.8 21.5 L165.6 24.6 C167.4 28.6 165.8 34.6 162.2 39.2 L156.2 41.4 "
    "C152.6 40.4 149.6 38.2 148.8 35.2 Z"
)
# Vertical bone jaw/guard with the rightward L-hook mandible tip at the bottom (matching 720p x=155..176, y=118..132).
COLUMN = (
    "M154.6 35.8 C152.4 43.0 154.2 50.0 153.4 57.2 C153.1 61.5 152.6 64.8 154.4 67.2 "
    "L164.2 66.2 L164.8 64.0 L159.4 63.4 C158.2 59.0 159.4 53.0 158.6 47.5 "
    "C158.0 42.5 159.4 39.0 160.8 36.5 Z"
)
FINGERS = [
    "M{} C{} {} {}".format(*(f"{zh(*q)[0]:.1f} {zh(*q)[1]:.1f}" for q in pts))
    for pts in [
        [(500, 100), (570, 50), (650, 60), (740, 105)],
        [(510, 125), (580, 80), (650, 95), (715, 135)],
        [(505, 150), (560, 120), (620, 130), (690, 150)],
    ]
]


SVG = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 184 72" width="184" height="72">
  <!-- Generated by scripts/build_hud_sword_svg.py. Coordinates drawn over the reference frame (640x360). -->
  <defs>
    <linearGradient id="face" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9ea3aa"/><stop offset="0.5" stop-color="#7c8087"/><stop offset="1" stop-color="#565960"/></linearGradient>
    <linearGradient id="bevel" x1="0" y1="0" x2="0.35" y2="1"><stop offset="0" stop-color="#eceef1"/><stop offset="0.5" stop-color="#c4c8ce"/><stop offset="1" stop-color="#9da1a8"/></linearGradient>
    <linearGradient id="silver" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e4e7ea"/><stop offset="0.5" stop-color="#8f959c"/><stop offset="1" stop-color="#33363c"/></linearGradient>
    <linearGradient id="bone" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#b9ab94"/><stop offset="0.5" stop-color="#7f7362"/><stop offset="1" stop-color="#40382f"/></linearGradient>
    <linearGradient id="pommel" x1="0.12" y1="0.18" x2="0.88" y2="0.88"><stop offset="0" stop-color="#e5d9c3"/><stop offset="0.45" stop-color="#a6977f"/><stop offset="1" stop-color="#3a3128"/></linearGradient>
    <linearGradient id="ironLink" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#847c73"/><stop offset="0.35" stop-color="#47413c"/><stop offset="0.75" stop-color="#211e1c"/><stop offset="1" stop-color="#0d0b0b"/></linearGradient>
    <radialGradient id="sphere" cx="0.4" cy="0.3" r="0.9"><stop offset="0" stop-color="#4a4c54"/><stop offset="0.5" stop-color="#26272c"/><stop offset="1" stop-color="#0d0d10"/></radialGradient>
    <radialGradient id="gem" cx="0.4" cy="0.3" r="0.8"><stop offset="0" stop-color="#ffd27a"/><stop offset="0.5" stop-color="#e8791a"/><stop offset="1" stop-color="#7a3208"/></radialGradient>
    <radialGradient id="eye" cx="0.42" cy="0.44" r="0.58"><stop offset="0" stop-color="#ffd41c"/><stop offset="0.32" stop-color="#ffb404"/><stop offset="0.68" stop-color="#e06006"/><stop offset="1" stop-color="#6e1e05"/></radialGradient>
    <radialGradient id="socket" cx="0.5" cy="0.48" r="0.58"><stop offset="0" stop-color="#7a2406"/><stop offset="0.55" stop-color="#330f05"/><stop offset="1" stop-color="#140604"/></radialGradient>
    <linearGradient id="cheek" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d8cab4"/><stop offset="0.55" stop-color="#9e907b"/><stop offset="1" stop-color="#4e4439"/></linearGradient>
    <filter id="glow" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="0.75"/></filter>
    <filter id="core" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="0.35"/></filter>
    <clipPath id="faceClip"><path d="{FACE}"/></clipPath>
    <!-- worn, grainy steel -->
    <filter id="grain" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.55" numOctaves="3" seed="7" result="n"/>
      <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.05  0 0 0 0 0.05  0 0 0 0 0.06  0 0 0 0.7 -0.28" result="d"/>
      <feComposite in="d" in2="SourceAlpha" operator="in"/>
    </filter>
    <filter id="grainLight" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.4" numOctaves="2" seed="21" result="n"/>
      <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.9  0 0 0 0 0.92  0 0 0 0 0.95  0 0 0 1.0 -0.52" result="d"/>
      <feComposite in="d" in2="SourceAlpha" operator="in"/>
    </filter>
  </defs>
  <g transform="translate(-112 -14.5)">
    <!-- blade: lit bevel (silhouette), darker worn face and the groove between them -->
    <path d="{SILHOUETTE}" fill="url(#bevel)" stroke="#14110f" stroke-width="1.05" stroke-linejoin="round"/>
    <path d="{FACE}" fill="url(#face)"/>
    <rect x="150" y="14" width="140" height="60" filter="url(#grain)" clip-path="url(#faceClip)"/>
    <rect x="150" y="14" width="140" height="60" filter="url(#grainLight)" clip-path="url(#faceClip)" opacity="0.4"/>
    <g clip-path="url(#faceClip)" fill="none" stroke-linecap="round">
      <path d="M234 41 L247 39 M241 47 L252 45.5 M255 34 L262 31.5 M205 44 L214 43" stroke="#e3e6e9" stroke-opacity="0.26" stroke-width="0.7"/>
      <path d="M228 37 L236 36 M246 43 L250 42.5 M262 39 L266 36" stroke="#15161a" stroke-opacity="0.35" stroke-width="0.7"/>
      <ellipse cx="203" cy="52" rx="9" ry="3" fill="#15161a" fill-opacity="0.14" stroke="none"/>
    </g>
    <path d="{FACE}" fill="none" stroke="#17181b" stroke-width="1.1" stroke-linejoin="round"/>
    <!-- edge glints, lower shank groove & shaded recessed web (matching 720p bevel lighting) -->
    <path d="M283.6 20.5 C279.2 37.5 268.0 55.6 247.5 59.4" fill="none" stroke="#fff" stroke-opacity="0.5" stroke-width="0.7" stroke-linecap="round"/>
    <!-- dark recessed groove right under the rage channel that drops into the bright spur facet -->
    <path d="M172.0 54.6 L215.6 54.8 L217.2 51.4" fill="none" stroke="#18191c" stroke-width="1.05" stroke-linecap="round" stroke-linejoin="round"/>
    <!-- crisp silver bottom-rim glint under the counter box heel & along the 45-deg step -->
    <path d="M161.5 60.4 L173.6 60.4 L178.8 56.8" fill="none" stroke="#cfd4dc" stroke-opacity="0.8" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/>
    <!-- recessed darker bevel web between the spur and the lower hook (720p x=348..386, y=97..112) -->
    <path d="M218.2 51.4 L223.8 51.6 L230.6 56.8 L228.8 57.4 L218.4 55.0 Z" fill="#5e636b" fill-opacity="0.9"/>
    <!-- re-stroke outer silhouette cleanly so internal facet lines never poke outside -->
    <path d="{SILHOUETTE}" fill="none" stroke="#14110f" stroke-width="1.05" stroke-linejoin="round"/>
    <!-- bar channels: slender rounded capsule slots carved into the blade steel, with 2 px of real grey steel
         breathing between each slot. Frame = HUD image + (112, 14.5); matches src/ui/hudSkin/hudWells.ts. -->
    <!-- Green slot (HUD 55,19 64x5; fill 56,20 62x3; start at 166.5 so column 55 is crisp black like column 118) -->
    <rect x="165.8" y="33.0" width="65.9" height="6.0" rx="2.8" fill="#2c3036"/>
    <path d="M167.8 39.2 L229.6 39.2" stroke="#c4c9d1" stroke-opacity="0.8" stroke-width="0.85" stroke-linecap="round"/>
    <rect x="166.4" y="33.5" width="64.7" height="5.0" rx="2.3" fill="#060b07" stroke="#0c1014" stroke-width="0.85"/>
    <!-- Blue mana slot (HUD 55,26 54x5; fill 56,27 52x3) -->
    <rect x="165.8" y="40.0" width="55.9" height="6.0" rx="2.8" fill="#2c3036"/>
    <path d="M167.8 46.2 L219.6 46.2" stroke="#c4c9d1" stroke-opacity="0.8" stroke-width="0.85" stroke-linecap="round"/>
    <rect x="166.4" y="40.5" width="54.7" height="5.0" rx="2.3" fill="#060911" stroke="#0c1014" stroke-width="0.85"/>
    <!-- Thin red rage slot (HUD 59,33 46x4; fill 60,34 44x2) + counter box on its left -->
    <rect x="170.5" y="47.1" width="47.0" height="4.8" rx="2.1" fill="#2c3036"/>
    <path d="M172.2 52.1 L215.8 52.1" stroke="#b8bec6" stroke-opacity="0.72" stroke-width="0.75" stroke-linecap="round"/>
    <rect x="171.0" y="47.5" width="46.0" height="4.0" rx="1.8" fill="#090708" stroke="#0e1115" stroke-width="0.8"/>
    <rect x="172.0" y="48.5" width="44.0" height="2.0" rx="0.9" fill="#2e0b0b"/>
    <rect x="161.0" y="45.5" width="9.0" height="8.0" rx="0.8" fill="#050506" stroke="#8d9299" stroke-width="0.85"/>
    <rect x="161.9" y="46.4" width="7.2" height="6.2" fill="none" stroke="#25282e" stroke-width="0.5"/>
    <!-- handle (mango) BEHIND the medallion: jagged bone pommel talon + interlocking blackened-iron chain links -->
    <path d="{GRIP_CORE}" fill="#100e0e" stroke="#080707" stroke-width="0.8" stroke-linejoin="round"/>
    <!-- sculpted ivory/bone pommel talon at far left -->
    <path d="{POMMEL}" fill="url(#pommel)" stroke="#0d0a09" stroke-width="0.9" stroke-linejoin="round"/>
    <path d="M113.9 30.2 C114.6 34.4 116.0 39.0 118.2 42.6" fill="none" stroke="#f0e6d2" stroke-opacity="0.75" stroke-width="1.15" stroke-linecap="round"/>
    <path d="M115.6 31.6 C117.8 33.4 119.8 34.4 122.2 35.0" fill="none" stroke="#261f19" stroke-width="0.85" stroke-linecap="round"/>
    <!-- Interlocking blackened-iron chain grip (organic curved links threading through one another, warmer soot-iron tone) -->
    <!-- Link 1 (left diagonal link emerging from pommel socket, passing into Link 2) -->
    <path d="M121.6 32.0 C124.8 30.8 129.6 32.0 132.2 35.0 C133.0 36.8 131.8 39.2 129.2 39.8 C125.8 40.0 122.2 38.0 121.0 35.2 Z" fill="url(#ironLink)" stroke="#080707" stroke-width="0.9" stroke-linejoin="round"/>
    <path d="M123.6 34.4 C125.8 34.0 128.4 34.8 129.8 36.2 C128.4 37.2 125.6 37.0 123.6 35.6 Z" fill="#080707"/>
    <path d="M122.8 32.4 C125.6 31.8 128.8 32.6 130.8 34.2" fill="none" stroke="#9e958b" stroke-opacity="0.78" stroke-width="0.75" stroke-linecap="round"/>
    <!-- Link 3 (right diagonal link + collar ring entering the back of the skull) -->
    <path d="M138.8 33.6 C143.2 33.2 148.2 35.2 150.6 38.6 C151.0 41.0 149.2 43.2 145.8 43.4 C141.6 43.0 138.4 40.4 137.8 37.2 Z" fill="url(#ironLink)" stroke="#080707" stroke-width="0.9" stroke-linejoin="round"/>
    <path d="M140.8 36.4 C143.6 36.4 146.6 37.6 147.8 39.2 C146.0 40.4 142.8 39.8 140.6 38.0 Z" fill="#080707"/>
    <path d="M140.2 34.4 C143.6 34.2 147.0 35.6 149.0 37.6" fill="none" stroke="#9a9187" stroke-opacity="0.75" stroke-width="0.75" stroke-linecap="round"/>
    <!-- lower-right twisted iron rib & metallic glint (visible at x=138..146, y=67..73 in 720p) -->
    <path d="M136.5 41.4 C141.5 40.4 146.8 41.8 150.8 45.0" fill="none" stroke="#080707" stroke-width="3.2" stroke-linecap="round"/>
    <path d="M136.5 41.4 C141.5 40.4 146.8 41.8 150.8 45.0" fill="none" stroke="#453f3a" stroke-width="1.9" stroke-linecap="round"/>
    <path d="M143.4 41.4 C145.6 41.8 147.4 42.6 148.8 43.6" fill="none" stroke="#aea59b" stroke-opacity="0.8" stroke-width="0.8" stroke-linecap="round"/>
    <!-- Link 2 (center-top horizontal oval link interlocking over Link 1 & Link 3, with through-bar effect) -->
    <path d="M128.4 31.6 C132.4 30.4 138.4 30.6 141.8 32.4 C143.4 33.8 143.2 36.8 141.2 38.2 C137.4 39.6 131.6 39.4 128.4 37.6 C126.8 36.2 126.8 33.0 128.4 31.6 Z" fill="url(#ironLink)" stroke="#080707" stroke-width="0.95" stroke-linejoin="round"/>
    <ellipse cx="135.1" cy="35.0" rx="4.2" ry="1.35" fill="#070606"/>
    <path d="M129.8 32.2 C133.2 31.3 137.8 31.5 140.6 32.8" fill="none" stroke="#b0a79d" stroke-opacity="0.85" stroke-width="0.85" stroke-linecap="round"/>
    <!-- Interlocking overlap nibs so Link 1 & Link 3 visibly thread THROUGH Link 2's ends -->
    <path d="M127.8 34.4 C129.2 34.2 130.6 34.8 131.2 35.8" fill="none" stroke="#5d554e" stroke-width="1.4" stroke-linecap="round"/>
    <path d="M139.2 35.4 C140.6 35.0 142.0 35.6 142.8 36.6" fill="none" stroke="#5d554e" stroke-width="1.4" stroke-linecap="round"/>
    <!-- small round iron boss/rivet on the upper-left shoulder of the medallion ring (720p x=73, y=84) -->
    <circle cx="123.2" cy="45.8" r="2.2" fill="url(#ironLink)" stroke="#080707" stroke-width="0.8"/>
    <circle cx="122.8" cy="45.2" r="0.75" fill="#b4aba0" fill-opacity="0.85"/>
    <!-- medallion IN FRONT OF the handle so its faceted top silver spike stands proud over the chain grip -->
    <g fill="url(#silver)" stroke="#0d0a09" stroke-width="0.9" stroke-linejoin="round">{spikes()}</g>
    <circle cx="{CX}" cy="{CY}" r="{R}" fill="#2b2d33" stroke="#0d0a09" stroke-width="1.2"/>
    <circle cx="{CX}" cy="{CY}" r="{R - 1.0}" fill="none" stroke="url(#silver)" stroke-width="1.6" stroke-opacity="0.8" stroke-dasharray="7 6" stroke-dashoffset="3"/>
    <circle cx="{CX}" cy="{CY}" r="{R - 3.0}" fill="#121116" stroke="#0d0a09" stroke-width="0.9"/>
    <circle cx="{CX}" cy="{CY}" r="{R - 3.8}" fill="url(#sphere)"/>
    <path d="M123.5 57.5 A10 10 0 0 1 129.5 52" fill="none" stroke="#fff" stroke-opacity="0.22" stroke-width="1.3" stroke-linecap="round"/>
    <!-- dark shadow pocket between skull cheekbone and blade bar trough -->
    <path d="M158.0 37.0 L166.8 30.8 L166.8 43.0 L158.0 43.0 Z" fill="#0d0a09" fill-opacity="0.9"/>
    <!-- bone skull cranium & sinew column beside the medallion (merged cleanly with no seam under the eye or at the neck) -->
    <path d="{BLOB}" fill="url(#bone)" stroke="#0d0a09" stroke-width="0.85" stroke-linejoin="round"/>
    <!-- dark shading on back occiput of skull where the chain handle enters -->
    <path d="M149.3 35.0 C150.2 32.6 152.4 30.8 154.8 29.8 C153.8 33.4 153.6 36.8 154.6 40.0 C151.8 39.2 149.8 37.2 149.3 35.0 Z" fill="#3a3128" fill-opacity="0.65"/>
    <path d="{COLUMN}" fill="url(#bone)" stroke="#0d0a09" stroke-width="0.8" stroke-linejoin="round"/>
    <path d="M154.8 34.0 L160.5 35.0 L159.8 41.2 L154.4 40.0 Z" fill="url(#bone)"/>
    <path d="M{zh(445,185)[0]:.1f} {zh(445,185)[1]:.1f} C{zh(430,260)[0]:.1f} {zh(430,260)[1]:.1f} {zh(435,380)[0]:.1f} {zh(435,380)[1]:.1f} {zh(455,470)[0]:.1f} {zh(455,470)[1]:.1f}" fill="none" stroke="#e1d6c0" stroke-opacity="0.45" stroke-width="0.7" stroke-linecap="round"/>
    <!-- bone claw: three fingers fanning over the top of the bar -->
    <g fill="none" stroke-linecap="round">
      {"".join(f'<path d="{f}" stroke="#0d0a09" stroke-width="{w + 1.2}"/>' for f, w in zip(FINGERS, (2.3, 1.9, 1.6)))}
      {"".join(f'<path d="{f}" stroke="url(#bone)" stroke-width="{w}"/>' for f, w in zip(FINGERS, (2.3, 1.9, 1.6)))}
    </g>
    <!-- eye: deep 39-deg tear-duct orbit with dark upper-right hollow, concentrated fiery amber iris, sculpted brow & cheekbone -->
    <path d="M163.3 25.9 C160.5 25.0 157.4 27.5 155.8 31.5 C154.9 33.9 154.6 36.1 155.1 37.5 C156.9 36.7 159.8 34.9 161.9 32.3 C163.6 30.1 164.2 27.3 163.3 25.9 Z" fill="#160603"/>
    <path d="M162.4 27.0 C160.1 26.4 157.6 28.5 156.2 31.8 C155.5 33.6 155.3 35.4 155.7 36.4 C157.2 35.8 159.6 34.3 161.3 32.1 C162.6 30.3 163.0 28.1 162.4 27.0 Z" fill="url(#socket)"/>
    <!-- warm ember glow concentrated in the middle-lower-left of the orbit (leaving dark pocket at top-right) -->
    <ellipse cx="158.6" cy="31.9" rx="2.15" ry="3.5" transform="rotate(38 158.6 31.9)" fill="#e85c06" fill-opacity="0.75" filter="url(#glow)"/>
    <!-- concentrated fiery amber iris -->
    <ellipse cx="158.5" cy="31.8" rx="1.95" ry="3.15" transform="rotate(38 158.5 31.8)" fill="url(#eye)"/>
    <!-- bright saturated golden-amber core hugging upper-left of the iris -->
    <ellipse cx="158.2" cy="31.5" rx="1.0" ry="1.85" transform="rotate(38 158.2 31.5)" fill="#ffc608" filter="url(#core)"/>
    <!-- sculpted brow overhang shadow & lit cheekbone ridge framing the orbit -->
    <path d="M155.0 34.8 C156.1 30.5 158.8 26.6 162.9 25.8" fill="none" stroke="#120503" stroke-width="0.95" stroke-linecap="round"/>
    <path d="M154.6 33.8 C155.8 29.6 158.6 25.8 162.6 24.9" fill="none" stroke="#9e907b" stroke-opacity="0.7" stroke-width="0.7" stroke-linecap="round"/>
    <path d="M155.6 37.5 C158.4 36.1 161.3 33.6 163.3 30.1 L164.8 31.2 C162.9 34.8 159.7 37.5 156.4 39.0 Z" fill="url(#cheek)"/>
    <path d="M156.2 37.0 C158.9 35.6 161.6 33.2 163.3 30.2" fill="none" stroke="#e2d5bf" stroke-opacity="0.75" stroke-width="0.65" stroke-linecap="round"/>
  </g>
</svg>
"""

if __name__ == "__main__":
    out = ROOT / "art/hud/chaos-blade.svg"
    out.write_text(SVG)
    print(f"wrote {out}")
