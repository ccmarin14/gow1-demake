#!/usr/bin/env python3
"""Genera las hojas de animacion de Kratos (arte original, pixel art).

Figura espartana musculosa en 3/4 lateral coherente con `kratos-neutral.png`,
rasterizada sobre una rejilla de 97x59 con los pies/apoyo anclados al borde
inferior (y = 58). Usa exclusivamente la paleta exacta de 6 colores de
`kratos-neutral.png`, verificada al cargar y al exportar cada hoja.

Uso:
    python3 scripts/gen-kratos-anim.py
"""

import math
import os

from PIL import Image, ImageDraw

FRAME_W = 97
FRAME_H = 59
CX = 48
PELVIS_Y = 29
SPINE = 15
NECK = 5
THIGH = 13
SHIN = 14
UPPER = 9
FORE = 9
FAR_HIP_DX = -5
NEAR_HIP_DX = 5
FAR_SH_DX = -9
NEAR_SH_DX = 8

OUTLINE = (29, 20, 21)
DARK = (44, 18, 18)
LEATHER = (63, 50, 44)
SHADOW = (111, 73, 54)
MID = (160, 138, 113)
HI = (215, 198, 173)
PALETTE = [OUTLINE, DARK, LEATHER, SHADOW, MID, HI]

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT_DIR, "public/assets/characters")
REF_DIR = os.path.join(ROOT_DIR, "docs/referencias")
NEUTRAL_PATH = os.path.join(OUT_DIR, "kratos-neutral.png")
CONTACT_SHEET_PATH = os.path.join(REF_DIR, "kratos-anim-contact-sheet.png")


def load_palette():
    im = Image.open(NEUTRAL_PATH).convert("RGBA")
    px = im.load()
    cols = []
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if a > 0 and (r, g, b) not in cols:
                cols.append((r, g, b))
    assert set(cols) == set(PALETTE), (cols, PALETTE)
    return im


def rect(d, x0, y0, w, h, color):
    w_i = max(1, int(round(w)))
    h_i = max(1, int(round(h)))
    x_i = int(round(x0))
    y_i = int(round(y0))
    d.rectangle([x_i, y_i, x_i + w_i - 1, y_i + h_i - 1], fill=color)


def square(d, cx, cy, w, color):
    rect(d, cx - w / 2, cy - w / 2, w, w, color)


def seg(d, p0, p1, w, color):
    n = int(max(abs(p1[0] - p0[0]), abs(p1[1] - p0[1])))
    if n == 0:
        square(d, p0[0], p0[1], w, color)
        return
    for i in range(n + 1):
        t = i / n
        square(d, p0[0] + (p1[0] - p0[0]) * t, p0[1] + (p1[1] - p0[1]) * t, w, color)


def limb(d, p0, p1, w, base_color, hi_color=None, shade_color=None):
    """Segmento muscular con contorno OUTLINE, base y volumen de luz/sombra."""
    seg(d, p0, p1, w + 2, OUTLINE)
    if shade_color is not None:
        seg(d, (p0[0] - 0.7, p0[1] + 0.4), (p1[0] - 0.7, p1[1] + 0.4), w, shade_color)
    seg(d, p0, p1, w, base_color)
    if hi_color is not None and w >= 3:
        seg(d, (p0[0] + 0.6, p0[1] - 0.4), (p1[0] + 0.6, p1[1] - 0.4), max(2, w - 1), hi_color)


def draw_bracer(d, elbow, hand, w, is_near, draw_chain=True):
    """Cadenas de hierro de las Cuchillas del Caos fundidas y enrolladas en
    espiral alrededor de los antebrazos, con reflejos metalicos y eslabon colgante."""
    # 1. Base muscular del antebrazo y carne chamuscada bajo las cadenas
    seg(d, elbow, hand, w + 2, OUTLINE)
    seg(d, elbow, hand, w, SHADOW if is_near else DARK)
    seg(d, (elbow[0] + 0.5, elbow[1] - 0.5), (hand[0] + 0.5, hand[1] - 0.5), max(1, w - 2), MID if is_near else SHADOW)

    # 2. Espirales de cadena de hierro en relieve con destellos metalicos
    dx = hand[0] - elbow[0]
    dy = hand[1] - elbow[1]
    length = (dx * dx + dy * dy) ** 0.5 or 1.0
    nx = -dy / length
    ny = dx / length

    coils = [0.18, 0.40, 0.62, 0.82]
    for idx, t in enumerate(coils):
        cx = elbow[0] + dx * t
        cy = elbow[1] + dy * t
        cw = w + 1.5
        p_a = (cx - nx * (cw * 0.5), cy - ny * (cw * 0.5))
        p_b = (cx + nx * (cw * 0.5), cy + ny * (cw * 0.5))
        seg(d, p_a, p_b, 2.8, OUTLINE)
        seg(d, p_a, p_b, 1.8, DARK)
        glint_col = (HI if idx % 2 == 0 else MID) if is_near else (MID if idx % 2 == 0 else SHADOW)
        square(d, cx + nx * 0.6, cy + ny * 0.6, 1.4, glint_col)
        square(d, cx - nx * 0.6, cy - ny * 0.6, 1.2, OUTLINE)

    # 3. Manguito de hierro fundido en la muneca
    cuff_x = elbow[0] + dx * 0.92
    cuff_y = elbow[1] + dy * 0.92
    square(d, cuff_x, cuff_y, w + 2, OUTLINE)
    square(d, cuff_x, cuff_y, w, DARK)
    square(d, cuff_x + nx * 0.5, cuff_y + ny * 0.5, max(1, w - 2), MID if is_near else SHADOW)

    # 4. Puno cerrado espartano
    fist_w = max(3.5, w + 0.8)
    square(d, hand[0], hand[1], fist_w + 2, OUTLINE)
    square(d, hand[0], hand[1], fist_w, DARK)
    square(d, hand[0] + nx * 0.4, hand[1] + ny * 0.4, max(2, fist_w - 1.2), HI if is_near else MID)
    square(d, hand[0] - nx * 0.6, hand[1] - ny * 0.6, 1.4, LEATHER if is_near else DARK)

    # 5. Eslabones de cadena de hierro colgando de la muneca
    if draw_chain:
        hx = int(round(hand[0]))
        hy = int(round(hand[1]))
        chain_dx = 1 if is_near else -1
        for step in range(1, 4):
            ly = hy + step * 2
            lx = hx + chain_dx * (step // 2)
            if 2 <= lx < FRAME_W - 2 and 2 <= ly < FRAME_H - 4:
                rect(d, lx - 1, ly, 3, 2, OUTLINE)
                rect(d, lx, ly, 1, 1, (HI if step == 2 else MID) if is_near else (MID if step == 2 else SHADOW))


def draw_compact_blade(d, hand, angle_deg, length, is_near):
    """Dibuja la silueta ancha y ganchuda de la Cuchilla del Caos sujeta en la mano,
    con hoja encorvada, gancho dentado y acanaladura runica de Hades."""
    tip = polar(hand, angle_deg + (14 if is_near else -14), length)
    belly = polar(hand, angle_deg - (10 if is_near else -10), length * 0.62)
    hook = polar(belly, angle_deg + (42 if is_near else -42), 3.5)
    guard = polar(hand, angle_deg, 2.5)

    # Contorno exterior de guardia, vientre ancho, gancho y punta
    square(d, guard[0], guard[1], 6, OUTLINE)
    seg(d, guard, belly, 6.5, OUTLINE)
    seg(d, belly, tip, 5.5, OUTLINE)
    square(d, hook[0], hook[1], 4.5, OUTLINE)

    # Guardia y empunadura de bronce
    square(d, guard[0], guard[1], 4, SHADOW)
    square(d, guard[0], guard[1], 2, MID)

    # Cuerpo de acero y filo cortante luminoso (HI)
    seg(d, guard, belly, 4.2, MID)
    seg(d, belly, tip, 3.2, HI)
    square(d, hook[0], hook[1], 2.2, HI)

    # Acanaladura runica central (DARK / SHADOW)
    seg(d, (guard[0], guard[1] + 0.6), (belly[0], belly[1] + 0.6), 2, SHADOW)
    square(d, (guard[0] + belly[0]) * 0.5, (guard[1] + belly[1]) * 0.5, 2, DARK)
    square(d, tip[0], tip[1], 2, HI)


def draw_greave_and_boot(d, knee, foot, w, squash, is_near):
    """Rodillera de bronce, greba espartana con brillo central protegiendo
    las espinillas y sandalias espartanas atadas firmes al empeine."""
    # 1. Rodillera de bronce con remate y destello
    square(d, knee[0], knee[1], w + 2.5, OUTLINE)
    square(d, knee[0], knee[1], w + 0.5, DARK)
    square(d, knee[0], knee[1], max(2, w - 1), SHADOW)
    square(d, knee[0] + 0.5, knee[1] - 0.5, max(1, w - 2), HI if is_near else MID)

    # 2. Greba de bronce anatomica protegiendo la espinilla
    seg(d, knee, foot, w + 2, OUTLINE)
    seg(d, knee, foot, w, DARK)
    seg(d, (knee[0] + 0.5, knee[1]), (foot[0] + 0.5, foot[1]), max(2, w - 1), SHADOW)
    # Nervadura de brillo metalico vertical en el centro de la espinilla
    seg(
        d,
        (knee[0] + 0.8, knee[1] + 1.2),
        (foot[0] + 0.8, foot[1] - 1.2),
        1.2,
        HI if is_near else MID,
    )
    # Correas de cuero posteriores sujetando la greba a la pantorrilla
    mid_shin = ((knee[0] + foot[0]) * 0.5, (knee[1] + foot[1]) * 0.5)
    square(d, mid_shin[0] - 1.0, mid_shin[1], max(2, w - 1), LEATHER)

    # 3. Sandalia de combate y bota reforzada
    bw = max(6, int(round(9 * squash)))
    bh = max(3, int(round(4.5 * squash)))
    bx = foot[0] - 2.5 * squash
    by = foot[1]

    # Base de sandalia y suela gruesa
    rect(d, bx - 1, by, bw + 2, bh + 1, OUTLINE)
    rect(d, bx, by, bw, bh, DARK)
    rect(d, bx, by + bh - 1, bw, 1, OUTLINE)

    # Talonera y contrafuerte en cuero reforzado
    rect(d, bx, by, max(2, int(round(3 * squash))), bh - 1, LEATHER)

    # Empeine con piel visible entre correas de sandalia
    instep_x = bx + int(round(2.5 * squash))
    instep_w = max(2, int(round(3.5 * squash)))
    rect(d, instep_x, by, instep_w, bh - 1, MID)
    if is_near:
        rect(d, instep_x + 1, by, max(1, instep_w - 2), 1, HI)
    # Correa cruzada sobre el empeine
    rect(d, instep_x + 1, by + 1, 1, bh - 2, DARK)

    # Puntera de bronce
    toe_x = bx + bw - int(round(2.5 * squash))
    rect(d, toe_x, by, max(2, int(round(2.5 * squash))), bh - 1, SHADOW)
    if is_near:
        rect(d, toe_x + 1, by, 1, 1, HI)


def draw_head(d, hx, hy, hr, squash=1.0):
    """Cabeza y cuello espartano en postura agresiva/depredadora, con
    mandibula angular, barba recortada (OUTLINE + DARK), ceno fruncido bajo
    sombra profunda, mirada frontal penetrante y tatuaje carmesi de Ares."""
    ox = hx + 1.2 * squash
    oy = hy

    # 1. Contorno de la silueta cefalica (OUTLINE)
    head_poly_out = [
        (ox - 3 * squash - 1, oy - hr - 1),
        (ox + 2 * squash + 1, oy - hr - 1),
        (ox + hr + 1, oy - 2 * squash),
        (ox + hr + 2, oy),              # ceno prominente
        (ox + hr + 2, oy + 2 * squash),  # puente nasal
        (ox + hr + 1, oy + 3 * squash),  # labio superior
        (ox + hr + 1.5, oy + 5 * squash), # barba espartana en cuna
        (ox + 1.5 * squash, oy + hr + 2), # punta inferior de la barba
        (ox - 2 * squash - 1, oy + hr),  # mandibula bajo la oreja
        (ox - hr - 1, oy + 2 * squash),  # nuca y cuello posterior
        (ox - hr - 1, oy - 2 * squash),  # curvatura occipital
    ]
    d.polygon(head_poly_out, fill=OUTLINE)

    # 2. Relleno carnoso base en tono ceniza (MID)
    head_poly_in = [
        (ox - 3 * squash, oy - hr),
        (ox + 2 * squash, oy - hr),
        (ox + hr, oy - 2 * squash),
        (ox + hr + 1, oy),
        (ox + hr + 1, oy + 2 * squash),
        (ox + hr, oy + 3 * squash),
        (ox + hr + 0.5, oy + 5 * squash - 0.5),
        (ox + 1.5 * squash, oy + hr + 1),
        (ox - 2 * squash, oy + hr - 1),
        (ox - hr, oy + 2 * squash),
        (ox - hr, oy - 2 * squash),
    ]
    d.polygon(head_poly_in, fill=MID)

    # 3. Brillo de la boveda craneal calva (HI)
    rect(d, ox - 1 * squash, oy - hr, max(2, 4 * squash), max(1, 2 * squash), HI)
    rect(d, ox, oy - hr + 1, max(2, 3 * squash), max(1, 2 * squash), HI)

    # 4. Tatuaje carmesi de Ares:
    rect(d, ox - 3 * squash, oy - hr, max(1, 2 * squash), max(1, 1 * squash), DARK)
    rect(d, ox - 2 * squash, oy - hr + 1, max(1, 2 * squash), max(1, 2 * squash), DARK)
    rect(d, ox - 0.5 * squash, oy - hr + 1.5, max(1, 1.5 * squash), max(1, 2 * squash), SHADOW)
    rect(d, ox + 0.5 * squash, oy - 2 * squash, max(1, 1.5 * squash), max(1, 3 * squash), DARK)
    rect(d, ox + 0.5 * squash, oy + 1 * squash, max(1, 1.2 * squash), max(1, 2 * squash), DARK)

    # 5. Sombra occipital posterior y oreja
    rect(d, ox - hr, oy - 1 * squash, max(1, 2 * squash), max(2, 4 * squash), SHADOW)
    rect(d, ox - 2.5 * squash, oy, 1 * squash, max(1, 2 * squash), LEATHER)

    # 6. Ceno fruncido, cuenca orbitaria profunda y mirada frontal intensa
    rect(d, ox + 1 * squash, oy - 1 * squash, max(2, 3 * squash), 1, SHADOW)
    rect(d, ox + 2 * squash, oy - 1 * squash, max(1, 2 * squash), 1, DARK)
    rect(d, ox + 2.5 * squash, oy, 1, 1, HI)
    rect(d, ox + 1.5 * squash, oy, 1, 1, DARK)

    # 7. Nariz espartana aguilena
    rect(d, ox + 2.5 * squash, oy + 1 * squash, max(1, 1.5 * squash), 1, HI)
    rect(d, ox + 3.5 * squash, oy + 2 * squash, 1, 1, OUTLINE)

    # 8. Boca severa y cerrada
    rect(d, ox + 1.5 * squash, oy + 2.5 * squash, max(2, 2.5 * squash), 1, OUTLINE)

    # 9. Barba espartana prominente y angular (OUTLINE + DARK)
    beard_poly = [
        (ox - 1 * squash, oy + 3 * squash),
        (ox + 3 * squash, oy + 3 * squash),
        (ox + hr + 1, oy + 4 * squash),
        (ox + hr + 0.5, oy + 5 * squash),
        (ox + 1.5 * squash, oy + hr + 1),
        (ox - 1 * squash, oy + hr),
    ]
    d.polygon(beard_poly, fill=DARK)
    rect(d, ox + 2 * squash, oy + 4 * squash, max(1, 2 * squash), 1, SHADOW)
    rect(d, ox + 0.5 * squash, oy + hr, max(1, 2 * squash), 1, OUTLINE)


def draw_skirt(d, pelvis, squash):
    """Faldon espartano (pteruges) con tiras de cuero colgantes con sombra y
    caida natural, cinturon ancho de placas de bronce y hebilla dorada."""
    px = pelvis[0]
    py = pelvis[1]

    # 1. Cinturon ancho de placas de bronce
    belt_y = py - 3 * squash
    bw = max(11, int(round(16 * squash)))
    bh = max(3, int(round(4 * squash)))
    bx = px - bw // 2

    rect(d, bx - 1, belt_y - 1, bw + 2, bh + 2, OUTLINE)
    rect(d, bx, belt_y, bw, bh, DARK)
    rect(d, bx + 1, belt_y, bw - 2, bh - 1, SHADOW)
    rect(d, bx + 2, belt_y, bw - 4, 1, MID)
    for seam_x in (bx + 3, bx + bw - 4):
        rect(d, seam_x, belt_y, 1, bh, OUTLINE)
    # Hebilla central dorada
    buckle_w = max(3, int(round(4 * squash)))
    buckle_x = px - buckle_w // 2
    rect(d, buckle_x - 1, belt_y - 1, buckle_w + 2, bh + 2, OUTLINE)
    rect(d, buckle_x, belt_y, buckle_w, bh, MID)
    rect(d, buckle_x + 1, belt_y, buckle_w - 2, 1, HI)
    rect(d, buckle_x + buckle_w // 2, belt_y + bh // 2, 1, 1, DARK)

    # 2. Base de faldeta/tunica interior (cubre caderas e ingle sin huecos)
    skirt_top = belt_y + bh
    skirt_h = max(6, int(round(10.0 * squash)))
    tunic_poly = [
        (bx - 1, skirt_top),
        (bx + bw + 1, skirt_top),
        (px + 7 * squash, skirt_top + skirt_h - 2),
        (px + 4 * squash, skirt_top + skirt_h + 1),
        (px - 1 * squash, skirt_top + skirt_h + 2),
        (px - 5 * squash, skirt_top + skirt_h + 1),
        (bx - 2, skirt_top + skirt_h - 2),
    ]
    d.polygon(tunic_poly, fill=DARK)

    # 3. Pteruges: tiras de cuero colgantes con sombra y remates de bronce
    strip_w = max(2, int(round(2.6 * squash)))
    # Tira lateral izquierda
    rect(d, px - 7 * squash, skirt_top, strip_w, skirt_h - 3, LEATHER)
    rect(d, px - 7 * squash, skirt_top, 1, skirt_h - 3, SHADOW)
    rect(d, px - 7 * squash + 1, skirt_top + skirt_h - 4, strip_w - 1, 1, MID)
    rect(d, px - 7 * squash + strip_w, skirt_top, 1, skirt_h - 2, OUTLINE)

    # Tira media izquierda
    rect(d, px - 4 * squash, skirt_top, strip_w, skirt_h - 1, LEATHER)
    rect(d, px - 4 * squash, skirt_top, 1, skirt_h - 1, SHADOW)
    rect(d, px - 4 * squash + 1, skirt_top + skirt_h - 2, strip_w - 1, 1, MID)
    rect(d, px - 4 * squash + strip_w, skirt_top, 1, skirt_h, OUTLINE)

    # Faja y tira central espartana ornamental
    sash_w = max(3, int(round(3.8 * squash)))
    sash_x = px - sash_w // 2
    rect(d, sash_x - 1, skirt_top, sash_w + 2, skirt_h + 2, OUTLINE)
    rect(d, sash_x, skirt_top, sash_w, skirt_h + 1, SHADOW)
    rect(d, sash_x + 1, skirt_top, sash_w - 2, skirt_h, MID)
    rect(d, sash_x + 1, skirt_top + skirt_h, sash_w - 2, 1, HI)
    rect(d, sash_x - 1, skirt_top, 1, skirt_h + 1, DARK)
    rect(d, sash_x + sash_w, skirt_top, 1, skirt_h + 1, DARK)

    # Tira media derecha
    rect(d, px + 2 * squash, skirt_top, strip_w, skirt_h - 1, LEATHER)
    rect(d, px + 2 * squash + strip_w - 1, skirt_top, 1, skirt_h - 1, SHADOW)
    rect(d, px + 2 * squash, skirt_top + skirt_h - 2, strip_w - 1, 1, MID)
    rect(d, px + 2 * squash + strip_w, skirt_top, 1, skirt_h, OUTLINE)

    # Tira lateral derecha
    rect(d, px + 5 * squash, skirt_top, strip_w, skirt_h - 3, LEATHER)
    rect(d, px + 5 * squash + strip_w - 1, skirt_top, 1, skirt_h - 3, SHADOW)
    rect(d, px + 5 * squash, skirt_top + skirt_h - 4, strip_w - 1, 1, MID)


def draw_torso(d, shoulder, pelvis, squash=1.0):
    """Torso heroico en V con trapecios anchos, deltoides y pectorales esculpidos
    con luces (HI) y sombras duras (SHADOW/DARK) de 1 px, y tatuaje de Ares."""
    chest = (
        shoulder[0] * 0.70 + pelvis[0] * 0.30,
        shoulder[1] * 0.70 + pelvis[1] * 0.30,
    )
    waist = (
        shoulder[0] * 0.28 + pelvis[0] * 0.72,
        shoulder[1] * 0.28 + pelvis[1] * 0.72,
    )
    trap_top = (shoulder[0], shoulder[1] - 3.5 * squash)
    sh_left = (shoulder[0] - 10.0 * squash, shoulder[1])
    sh_right = (shoulder[0] + 9.0 * squash, shoulder[1])
    lat_left = (chest[0] - 8.5 * squash, chest[1] + 1 * squash)
    lat_right = (chest[0] + 8.0 * squash, chest[1] + 1 * squash)
    w_left = (waist[0] - 6.5 * squash, waist[1] + 2 * squash)
    w_right = (waist[0] + 6.0 * squash, waist[1] + 2 * squash)

    # 1. Silueta exterior del torso y relleno base
    torso_outer = [
        (trap_top[0] - 5 * squash, trap_top[1] - 1),
        (trap_top[0] + 5 * squash, trap_top[1] - 1),
        (sh_right[0] + 1, sh_right[1] - 1),
        (lat_right[0] + 1, lat_right[1]),
        (w_right[0] + 1, w_right[1] + 1),
        (w_left[0] - 1, w_left[1] + 1),
        (lat_left[0] - 1, lat_left[1]),
        (sh_left[0] - 1, sh_left[1] - 1),
    ]
    torso_inner = [
        (trap_top[0] - 4 * squash, trap_top[1]),
        (trap_top[0] + 4 * squash, trap_top[1]),
        sh_right,
        lat_right,
        w_right,
        w_left,
        lat_left,
        sh_left,
    ]
    d.polygon(torso_outer, fill=OUTLINE)
    d.polygon(torso_inner, fill=MID)

    # 2. Dorsal ancho y relieve serrato
    dorsal = [
        sh_left,
        (shoulder[0] - 4 * squash, shoulder[1]),
        (waist[0] - 3.5 * squash, waist[1] + 2 * squash),
        w_left,
        lat_left,
    ]
    d.polygon(dorsal, fill=SHADOW)

    # 3. Pectorales esculpidos en relieve
    pec_w = 6.5 * squash
    pec_h = 5.5 * squash
    pec_y = shoulder[1] - 1 * squash
    rect(d, shoulder[0] - pec_w - 0.5, pec_y, pec_w, pec_h, HI)
    rect(d, shoulder[0] + 1.0, pec_y, pec_w, pec_h, HI)
    rect(d, shoulder[0], pec_y, 1, pec_h + 1, SHADOW)
    rect(d, shoulder[0], pec_y + 1, 1, pec_h - 1, DARK)
    rect(d, shoulder[0] - pec_w, pec_y + pec_h, pec_w * 2 + 1, 1, SHADOW)
    rect(d, shoulder[0] - pec_w + 1, pec_y + pec_h, pec_w * 2 - 1, 1, DARK)

    # 4. Pared abdominal definida (6-pack)
    ab_y0 = pec_y + pec_h + 1
    ab_w = 3.0 * squash
    ab_h = 2.0 * squash
    rect(d, waist[0] - ab_w - 0.5, ab_y0, ab_w, ab_h, HI)
    rect(d, waist[0] + 0.5, ab_y0, ab_w, ab_h, HI)
    rect(d, waist[0], ab_y0, 1, ab_h, SHADOW)
    rect(d, waist[0] - ab_w, ab_y0 + ab_h, ab_w * 2 + 1, 1, SHADOW)

    ab_y1 = ab_y0 + ab_h + 1
    rect(d, waist[0] - ab_w - 0.5, ab_y1, ab_w, ab_h, HI)
    rect(d, waist[0] + 0.5, ab_y1, ab_w, ab_h, MID)
    rect(d, waist[0], ab_y1, 1, ab_h, DARK)
    rect(d, waist[0] - ab_w, ab_y1 + ab_h, ab_w * 2 + 1, 1, SHADOW)

    ab_y2 = ab_y1 + ab_h + 1
    rect(d, waist[0] - ab_w * 0.8, ab_y2, ab_w * 0.8, ab_h * 0.8, MID)
    rect(d, waist[0] + 0.2, ab_y2, ab_w * 0.8, ab_h * 0.8, MID)
    rect(d, waist[0], ab_y2, 1, ab_h * 0.8, DARK)

    # 5. Tatuaje carmesi de Ares cruzando en diagonal el pecho
    tattoo_pts = [
        (shoulder[0] + 2.5 * squash, shoulder[1] - 3.5 * squash),
        (shoulder[0] + 6.5 * squash, shoulder[1] - 2.0 * squash),
        (waist[0] + 3.0 * squash, waist[1] + 2.5 * squash),
        (waist[0] - 0.5 * squash, waist[1] + 1.5 * squash),
    ]
    d.polygon(tattoo_pts, fill=SHADOW)
    seg(
        d,
        (shoulder[0] + 4.5 * squash, shoulder[1] - 2.5 * squash),
        (waist[0] + 1.2 * squash, waist[1] + 2.0 * squash),
        max(1.5, 2.2 * squash),
        DARK,
    )


def polar(origin, angle, length):
    a = math.radians(angle)
    return (origin[0] + math.sin(a) * length, origin[1] + math.cos(a) * length)


def translate(img, dy):
    out = Image.new("RGBA", img.size, (0, 0, 0, 0))
    out.paste(img, (0, int(dy)))
    return out


def draw_roll_pose(d, stage):
    """Dibuja los 4 cuadros de una voltereta espartana a ras de suelo:
    0 = zambullida baja al frente
    1 = ovillo compacto rodando sobre espalda/hombros en el suelo
    2 = giro invertido sobre cadera/grebas saliendo hacia adelante
    3 = incorporacion en guardia baja de combate
    """
    if stage == 0:
        # Zambullida baja hacia adelante (altura ~38px, bbox[1] ~ 20)
        # Pierna trasera extendida impulsando y pierna delantera flexionada
        limb(d, (40, 39), (32, 48), 5, MID, hi_color=None, shade_color=SHADOW)
        draw_greave_and_boot(d, (32, 48), (24, 54), 4, 0.9, is_near=False)
        # Brazo lejano recogiendo cuchilla atras
        draw_compact_blade(d, (35, 34), -125, 13, is_near=False)
        draw_bracer(d, (43, 30), (35, 34), 4, is_near=False, draw_chain=False)
        # Torso inclinado ~55 grados hacia adelante
        torso_pts = [(38, 36), (48, 25), (60, 27), (58, 38), (44, 42)]
        d.polygon([(x + (-1 if x < 48 else 1), y + (-1 if y < 33 else 1)) for x, y in torso_pts], fill=OUTLINE)
        d.polygon(torso_pts, fill=MID)
        rect(d, 46, 27, 10, 6, HI)
        seg(d, (55, 27), (46, 36), 3, SHADOW)
        seg(d, (55, 28), (47, 35), 2, DARK)
        # Cinturon y faldon
        rect(d, 36, 37, 12, 4, OUTLINE)
        rect(d, 37, 38, 10, 3, SHADOW)
        d.polygon([(35, 40), (47, 40), (49, 48), (33, 48)], fill=OUTLINE)
        d.polygon([(36, 41), (46, 41), (48, 47), (34, 47)], fill=DARK)
        rect(d, 37, 41, 4, 5, LEATHER)
        rect(d, 41, 41, 3, 6, MID)
        # Pierna delantera muy flexionada apoyando bota
        limb(d, (45, 41), (56, 46), 5, MID, hi_color=HI, shade_color=SHADOW)
        draw_greave_and_boot(d, (56, 46), (52, 54), 4, 0.9, is_near=True)
        # Cabeza baja lanzandose al frente
        draw_head(d, 62, 26, 4, squash=0.9)
        # Brazo cercano buscando el suelo al frente
        limb(d, (55, 30), (63, 37), 4, MID, hi_color=HI, shade_color=SHADOW)
        draw_bracer(d, (63, 37), (68, 45), 4, is_near=True, draw_chain=False)

    elif stage == 1:
        # Ovillo compacto rodando sobre hombros/espalda en el suelo (bbox[1] >= 29, altura <= 30px)
        # Cuchillas pegadas al ovillo
        draw_compact_blade(d, (36, 44), -145, 11, is_near=False)
        # Espalda curva y hombros apoyados en el suelo (y = 43..57)
        ball_outer = [
            (35, 44), (41, 36), (53, 35), (61, 41),
            (62, 52), (56, 58), (40, 58), (34, 52),
        ]
        ball_inner = [
            (36, 44), (42, 37), (52, 36), (60, 42),
            (61, 51), (55, 57), (41, 57), (35, 51),
        ]
        d.polygon(ball_outer, fill=OUTLINE)
        d.polygon(ball_inner, fill=MID)
        # Luz en espalda/omoplatos (HI) y sombra interior (SHADOW)
        rect(d, 43, 48, 13, 8, HI)
        rect(d, 38, 44, 10, 6, SHADOW)
        # Tatuaje rojo de Ares recorriendo el hombro/espalda en el suelo
        seg(d, (44, 55), (56, 48), 3, SHADOW)
        seg(d, (45, 55), (55, 49), 2, DARK)
        # Cinturon y faldon espartano en la parte superior-izquierda del ovillo
        rect(d, 36, 38, 12, 4, OUTLINE)
        rect(d, 37, 39, 10, 2, SHADOW)
        d.polygon([(35, 34), (47, 33), (48, 40), (35, 41)], fill=OUTLINE)
        d.polygon([(36, 35), (46, 34), (47, 39), (36, 40)], fill=LEATHER)
        rect(d, 40, 34, 3, 5, DARK)
        rect(d, 43, 34, 2, 5, MID)
        # Muslos y grebas encogidos por encima del torso (y = 31..43)
        limb(d, (44, 38), (52, 34), 4, MID, hi_color=HI, shade_color=SHADOW)
        seg(d, (52, 34), (60, 39), 6, OUTLINE)
        seg(d, (52, 34), (60, 39), 4, LEATHER)
        seg(d, (53, 34), (59, 38), 2, SHADOW)
        # Bota recogida arriba a la derecha
        rect(d, 58, 36, 6, 5, OUTLINE)
        rect(d, 59, 37, 4, 3, LEATHER)
        # Cabeza metida hacia el pecho dentro del ovillo (abajo a la derecha)
        draw_head(d, 57, 48, 4, squash=0.85)
        # Brazaletes protegiendo el pecho
        draw_bracer(d, (48, 46), (54, 43), 4, is_near=True, draw_chain=False)

    elif stage == 2:
        # Giro invertido apoyando cadera/faldon y espinillas en el suelo (bbox[1] >= 28, altura <= 31px)
        # Cuchilla asomando tras el hombro
        draw_compact_blade(d, (36, 42), -140, 10, is_near=False)
        # Cadera y faldon rodando contra el suelo (abajo izquierda)
        d.polygon([(35, 46), (49, 46), (51, 58), (34, 58)], fill=OUTLINE)
        d.polygon([(36, 47), (48, 47), (50, 57), (35, 57)], fill=DARK)
        rect(d, 37, 48, 5, 8, LEATHER)
        rect(d, 43, 48, 3, 8, SHADOW)
        rect(d, 44, 49, 2, 6, MID)
        # Cinturon
        rect(d, 37, 44, 13, 3, OUTLINE)
        rect(d, 38, 45, 11, 2, SHADOW)
        # Torso curvo emergiendo hacia arriba/derecha (y = 35..48)
        torso_pts = [(39, 45), (43, 36), (56, 36), (58, 46), (47, 48)]
        d.polygon([(x + (-1 if x < 48 else 1), y + (-1 if y < 41 else 1)) for x, y in torso_pts], fill=OUTLINE)
        d.polygon(torso_pts, fill=MID)
        rect(d, 45, 37, 9, 6, HI)
        seg(d, (47, 37), (55, 43), 3, SHADOW)
        seg(d, (48, 38), (54, 43), 2, DARK)
        # Piernas dobladas pasando a ras de suelo hacia adelante (y = 47..58)
        limb(d, (48, 49), (56, 47), 5, MID, hi_color=HI, shade_color=SHADOW)
        seg(d, (56, 47), (63, 55), 6, OUTLINE)
        seg(d, (56, 47), (63, 55), 4, LEATHER)
        seg(d, (57, 48), (62, 54), 2, SHADOW)
        rect(d, 60, 53, 8, 5, OUTLINE)
        rect(d, 61, 54, 6, 3, LEATHER)
        # Cabeza saliendo al frente arriba
        draw_head(d, 56, 35, 4, squash=0.88)
        # Brazo con brazalete proyectandose al frente
        draw_bracer(d, (53, 41), (62, 43), 4, is_near=True, draw_chain=False)

    else:
        # stage == 3: Salida en guardia baja de combate (altura ~40px, bbox[1] ~ 18)
        draw_compact_blade(d, (33, 36), -120, 14, is_near=False)
        # Pierna trasera baja casi arrodillada
        limb(d, (42, 40), (35, 50), 5, MID, hi_color=None, shade_color=SHADOW)
        draw_greave_and_boot(d, (35, 50), (27, 54), 4, 0.9, is_near=False)
        # Brazo trasero en guardia
        draw_bracer(d, (40, 31), (33, 36), 4, is_near=False, draw_chain=True)
        # Torso inclinado al frente saliendo del giro
        torso_pts = [(39, 38), (44, 24), (56, 25), (54, 39), (42, 40)]
        d.polygon([(x + (-1 if x < 48 else 1), y + (-1 if y < 32 else 1)) for x, y in torso_pts], fill=OUTLINE)
        d.polygon(torso_pts, fill=MID)
        rect(d, 45, 26, 9, 6, HI)
        rect(d, 49, 26, 1, 7, SHADOW)
        seg(d, (53, 25), (46, 35), 3, SHADOW)
        seg(d, (53, 26), (47, 35), 2, DARK)
        # Cinturon y faldon
        rect(d, 38, 38, 14, 3, OUTLINE)
        rect(d, 39, 39, 12, 2, SHADOW)
        d.polygon([(37, 41), (52, 41), (54, 49), (35, 49)], fill=OUTLINE)
        d.polygon([(38, 42), (51, 42), (53, 48), (36, 48)], fill=DARK)
        rect(d, 38, 42, 4, 5, LEATHER)
        rect(d, 47, 42, 4, 5, LEATHER)
        rect(d, 43, 42, 3, 6, SHADOW)
        rect(d, 44, 42, 2, 5, MID)
        # Pierna delantera plantando bota firme
        limb(d, (49, 41), (58, 45), 5, MID, hi_color=HI, shade_color=SHADOW)
        draw_greave_and_boot(d, (58, 45), (59, 54), 4, 0.92, is_near=True)
        # Cabeza erguida mirando al frente
        draw_head(d, 55, 22, 4, squash=0.92)
        # Brazo cercano con Cuchilla del Caos lista al frente
        draw_compact_blade(d, (64, 36), 72, 14, is_near=True)
        limb(d, (53, 28), (58, 33), 4, MID, hi_color=HI, shade_color=SHADOW)
        draw_bracer(d, (58, 33), (64, 36), 4, is_near=True, draw_chain=True)


def draw_pose(pose, neutral):
    img = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    if pose.get("roll_stage") is not None:
        draw_roll_pose(d, pose["roll_stage"])
        bbox = img.split()[3].getbbox()
        if bbox:
            img = translate(img, (FRAME_H - 1) - (bbox[3] - 1))
        return img

    tuck = pose.get("tuck", 0.0)
    squash = 1.0 - 0.24 * tuck
    drop = 3.0 * tuck
    reach_x = CX
    reach_y = PELVIS_Y + drop

    def squash_pt(p):
        return (
            reach_x + (p[0] - reach_x) * squash,
            reach_y + (p[1] - reach_y) * squash,
        )

    spine_deg = pose.get("spine", 0)
    s = math.radians(spine_deg + 90)
    pelvis = squash_pt((CX, PELVIS_Y + pose.get("pelvis_dy", 0)))
    shoulder = squash_pt((pelvis[0] + math.cos(s) * -SPINE, pelvis[1] + math.sin(s) * -SPINE))
    head_c = squash_pt((shoulder[0] + math.cos(s) * -NECK + 1.5 * squash, shoulder[1] + math.sin(s) * -NECK))

    thigh_w = max(4, int(round(5.5 * squash)))
    shin_w = max(3, int(round(4.5 * squash)))
    upper_w = max(3, int(round(4.5 * squash)))
    fore_w = max(3, int(round(4.2 * squash)))
    head_r = max(3, int(round(4.6 * squash)))

    def leg(spec, dx):
        hip = squash_pt((pelvis[0] + dx * squash, pelvis[1] + 1))
        knee = squash_pt(polar(hip, spec["thigh"], THIGH))
        foot = squash_pt(polar(knee, spec["thigh"] + spec["knee"], SHIN))
        return hip, knee, foot

    def arm(spec, dx, dy=1.0):
        root = squash_pt((shoulder[0] + dx * squash, shoulder[1] + dy * squash))
        elbow = squash_pt(polar(root, spec["sh"], UPPER))
        hand = squash_pt(polar(elbow, spec["sh"] + spec["el"], FORE))
        return root, elbow, hand

    far_sh_dx = pose.get("far_sh_dx", FAR_SH_DX)
    near_sh_dx = pose.get("near_sh_dx", NEAR_SH_DX)
    far_hip_dx = pose.get("far_hip_dx", FAR_HIP_DX)
    near_hip_dx = pose.get("near_hip_dx", NEAR_HIP_DX)

    far_arm = arm(pose["armF"], far_sh_dx, dy=1.5)
    far_leg = leg(pose["legF"], far_hip_dx)
    near_leg = leg(pose["legN"], near_hip_dx)
    near_arm = arm(pose["armN"], near_sh_dx, dy=1.5)

    # 1. Brazo lejano (detras del torso) + cuchilla opcional
    if pose.get("bladeF") is not None:
        draw_compact_blade(d, far_arm[2], pose["bladeF"], pose.get("blade_len", 14), is_near=False)
    square(d, far_arm[0][0], far_arm[0][1], upper_w + 3, OUTLINE)
    square(d, far_arm[0][0], far_arm[0][1], upper_w + 1, MID)
    limb(d, far_arm[0], far_arm[1], upper_w, MID, hi_color=HI, shade_color=SHADOW)
    draw_bracer(d, far_arm[1], far_arm[2], fore_w, is_near=False, draw_chain=(tuck < 0.3))

    # 2. Muslos (se dibujan ANTES del faldon espartano para que el faldon cubra la ingle/cadera
    #    exactamente como en `kratos-neutral.png`)
    limb(d, far_leg[0], far_leg[1], thigh_w, MID, hi_color=HI, shade_color=SHADOW)
    limb(d, near_leg[0], near_leg[1], thigh_w, MID, hi_color=HI, shade_color=SHADOW)

    # 3. Torso heroico en V con trapecios anchos, deltoides y pectorales esculpidos
    draw_torso(d, shoulder, pelvis, squash)

    # 4. Cinturon pesado de bronce y faldon espartano (pteruges)
    draw_skirt(d, pelvis, squash)

    # 5. Grebas y botas (debajo de las rodillas)
    draw_greave_and_boot(d, far_leg[1], far_leg[2], shin_w, squash, is_near=False)
    draw_greave_and_boot(d, near_leg[1], near_leg[2], shin_w, squash, is_near=True)

    # 6. Cabeza espartana proporcionada, encajada en los trapecios, con barba y tatuaje
    draw_head(d, head_c[0], head_c[1], head_r, squash=squash)

    # 7. Deltoides potente, brazo cercano y brazalete con cadena (+ cuchilla opcional)
    if pose.get("bladeN") is not None:
        draw_compact_blade(d, near_arm[2], pose["bladeN"], pose.get("blade_len", 14), is_near=True)
    square(d, near_arm[0][0], near_arm[0][1], upper_w + 3, OUTLINE)
    square(d, near_arm[0][0], near_arm[0][1], upper_w + 1, MID)
    square(d, near_arm[0][0] - 0.5, near_arm[0][1] - 0.5, max(2, upper_w - 1), HI)
    limb(d, near_arm[0], near_arm[1], upper_w, MID, hi_color=HI, shade_color=SHADOW)
    draw_bracer(
        d,
        near_arm[1],
        near_arm[2],
        fore_w,
        is_near=True,
        draw_chain=(tuck < 0.3 and pose.get("bladeN") is not None),
    )

    # Anclaje estricto: fila inferior opaca en y = FRAME_H - 1 (58)
    bbox = img.split()[3].getbbox()
    if bbox:
        img = translate(img, (FRAME_H - 1) - (bbox[3] - 1))
    return img


def mirror(pose):
    out = dict(pose)
    out["legF"], out["legN"] = pose["legN"], pose["legF"]
    out["armF"], out["armN"] = pose["armN"], pose["armF"]
    if "bladeF" in pose and "bladeN" in pose:
        out["bladeF"], out["bladeN"] = pose["bladeN"], pose["bladeF"]
    return out


# En IDLE Kratos adopta su guardia espartana abierta (como en kratos-neutral.png)
# sujetando las Cuchillas del Caos a ambos lados del cuerpo con respiracion sutil.
IDLE = [
    dict(
        spine=3,
        pelvis_dy=0,
        legF=dict(thigh=-34, knee=-6),
        legN=dict(thigh=32, knee=-16),
        armF=dict(sh=-44, el=-18),
        armN=dict(sh=46, el=16),
        bladeF=-112,
        bladeN=74,
        blade_len=17,
    ),
    dict(
        spine=4,
        pelvis_dy=-1,
        legF=dict(thigh=-34, knee=-6),
        legN=dict(thigh=32, knee=-16),
        armF=dict(sh=-48, el=-14),
        armN=dict(sh=50, el=12),
        bladeF=-108,
        bladeN=70,
        blade_len=17,
    ),
]

# En RUN Kratos corre inclinado con las Cuchillas del Caos invertidas hacia atras
# siguiendo el braceo, tal como en God of War: Betrayal.
RUN_BASE = [
    dict(
        spine=12,
        pelvis_dy=-1,
        far_sh_dx=-7,
        near_sh_dx=6,
        legF=dict(thigh=-34, knee=-34),
        legN=dict(thigh=36, knee=-12),
        armF=dict(sh=38, el=16),
        armN=dict(sh=-38, el=-14),
        bladeF=72,
        bladeN=-102,
        blade_len=15,
    ),
    dict(
        spine=14,
        pelvis_dy=1,
        far_sh_dx=-7,
        near_sh_dx=6,
        legF=dict(thigh=-16, knee=-46),
        legN=dict(thigh=18, knee=-26),
        armF=dict(sh=22, el=18),
        armN=dict(sh=-26, el=-16),
        bladeF=68,
        bladeN=-98,
        blade_len=15,
    ),
    dict(
        spine=11,
        pelvis_dy=-2,
        far_sh_dx=-7,
        near_sh_dx=6,
        legF=dict(thigh=14, knee=-54),
        legN=dict(thigh=-16, knee=-16),
        armF=dict(sh=-36, el=-14),
        armN=dict(sh=36, el=16),
        bladeF=-102,
        bladeN=72,
        blade_len=15,
    ),
]
# Cuadro 6 de kratos-run.png: postura de derrape y frenada en giro brusco (skid / turnaround).
# Inclinacion hacia atras (~15 deg) contra el sentido del deslizamiento, talon delantero
# clavado al piso, rodilla trasera flexionada absorbiendo inercia, brazos y Cuchillas
# del Caos tensas abajo/atras, con anclaje inferior estricto en y=58.
SKID_POSE = dict(
    spine=-15,
    pelvis_dy=1,
    far_sh_dx=-8,
    near_sh_dx=7,
    legN=dict(thigh=44, knee=-12),
    legF=dict(thigh=-36, knee=-40),
    armF=dict(sh=-46, el=-18),
    armN=dict(sh=-56, el=-22),
    bladeF=-130,
    bladeN=-120,
    blade_len=15,
)
RUN = RUN_BASE + [mirror(p) for p in RUN_BASE] + [SKID_POSE]

AIR = [
    dict(
        spine=8,
        pelvis_dy=-2,
        legF=dict(thigh=-24, knee=-38),
        legN=dict(thigh=30, knee=-52),
        armF=dict(sh=-46, el=-18),
        armN=dict(sh=48, el=22),
        bladeF=-118,
        bladeN=68,
        blade_len=15,
    ),
    dict(
        spine=6,
        pelvis_dy=-3,
        legF=dict(thigh=-12, knee=-28),
        legN=dict(thigh=22, knee=-46),
        armF=dict(sh=-36, el=-24),
        armN=dict(sh=36, el=28),
        bladeF=-112,
        bladeN=62,
        blade_len=15,
    ),
]

ATTACK = [
    # 0 — startup: torsion espartana armando ambas cuchillas atras antes del latigazo
    dict(
        spine=-12,
        pelvis_dy=1,
        legF=dict(thigh=-28, knee=-12),
        legN=dict(thigh=30, knee=-20),
        armF=dict(sh=-42, el=-20),
        armN=dict(sh=-64, el=-28),
        bladeF=-122,
        bladeN=-102,
        blade_len=16,
    ),
    # 1 — active: zancada agresiva al frente con antebrazo proyectado horizontalmente
    #     y puno delantero exactamente en (CX + 14, 28) = (player.x + 14, player.y - 31), sin bladeN
    dict(
        spine=12,
        pelvis_dy=0,
        near_sh_dx=0,
        legF=dict(thigh=-32, knee=-16),
        legN=dict(thigh=34, knee=-16),
        armF=dict(sh=-48, el=-18),
        armN=dict(sh=6, el=82),
        bladeF=-118,
        bladeN=None,
        blade_len=15,
    ),
    # 2 — recovery: tiron firme recogiendo la cadena de vuelta a la guardia
    dict(
        spine=14,
        pelvis_dy=1,
        legF=dict(thigh=-26, knee=-14),
        legN=dict(thigh=30, knee=-18),
        armF=dict(sh=-38, el=-16),
        armN=dict(sh=46, el=20),
        bladeF=-112,
        bladeN=60,
        blade_len=15,
    ),
    # 3 — slam / plume: golpe descendente sobre la cabeza azotando las hojas contra el suelo
    dict(
        spine=16,
        pelvis_dy=0,
        near_sh_dx=0,
        legF=dict(thigh=-34, knee=-14),
        legN=dict(thigh=32, knee=-16),
        armF=dict(sh=-40, el=-22),
        armN=dict(sh=8, el=80),
        bladeF=-128,
        bladeN=None,
        blade_len=15,
    ),
    # 4 — ascension launcher: tajo vertical ascendente hacia el cielo elevando al enemigo
    dict(
        spine=-4,
        pelvis_dy=0,
        near_sh_dx=0,
        legF=dict(thigh=-24, knee=-20),
        legN=dict(thigh=26, knee=-24),
        armF=dict(sh=-54, el=-16),
        armN=dict(sh=-8, el=96),
        bladeF=-114,
        bladeN=None,
        blade_len=15,
    ),
    # 5 — chain grab: lanzamiento rectilineo horizontal de cadena al frente
    dict(
        spine=10,
        pelvis_dy=0,
        near_sh_dx=0,
        legF=dict(thigh=-30, knee=-14),
        legN=dict(thigh=32, knee=-18),
        armF=dict(sh=-44, el=-18),
        armN=dict(sh=6, el=82),
        bladeF=-118,
        bladeN=None,
        blade_len=15,
    ),
    # 6 — light_2 slash (brazo izquierdo alternado): zancada opuesta con torso rotado
    #     y antebrazo izquierdo proyectado al frente cruzando la guardia; sin bladeF
    dict(
        spine=12,
        pelvis_dy=0,
        far_sh_dx=0,
        legF=dict(thigh=34, knee=-16),
        legN=dict(thigh=-32, knee=-16),
        armF=dict(sh=6, el=82),
        armN=dict(sh=-48, el=-18),
        bladeF=None,
        bladeN=-118,
        blade_len=15,
    ),
]

ROLL = [
    dict(roll_stage=0),
    dict(roll_stage=1),
    dict(roll_stage=2),
    dict(roll_stage=3),
]


def colors_of(img):
    return {p[:3] for p in img.convert("RGBA").getdata() if p[3] > 0}


def sheet(name, poses, neutral):
    img = Image.new("RGBA", (FRAME_W * len(poses), FRAME_H), (0, 0, 0, 0))
    frames = []
    for i, pose in enumerate(poses):
        frame_img = draw_pose(pose, neutral)
        f_bbox = frame_img.split()[3].getbbox()
        assert f_bbox is not None and f_bbox[3] == FRAME_H, (name, i, f_bbox)
        frames.append(frame_img)
        img.paste(frame_img, (i * FRAME_W, 0))
    sheet_colors = colors_of(img)
    assert sheet_colors == set(PALETTE), (name, sheet_colors, set(PALETTE))
    img.save(os.path.join(OUT_DIR, name))
    print(name, img.size, "frames:", len(poses), "colors:", len(sheet_colors))
    return frames


def save_contact_sheet(neutral, rows):
    max_cols = max(len(r) for r in rows)
    total_rows = 1 + len(rows)
    scale = 2
    canvas = Image.new("RGBA", (FRAME_W * max_cols, FRAME_H * total_rows), (24, 24, 32, 255))
    canvas.paste(neutral, (0, 0), neutral)
    for row_idx, frames in enumerate(rows, start=1):
        for col_idx, frame_img in enumerate(frames):
            canvas.paste(frame_img, (col_idx * FRAME_W, row_idx * FRAME_H), frame_img)
    upscaled = canvas.resize((canvas.width * scale, canvas.height * scale), Image.NEAREST)
    os.makedirs(REF_DIR, exist_ok=True)
    upscaled.save(CONTACT_SHEET_PATH)
    print("contact sheet saved:", CONTACT_SHEET_PATH, upscaled.size)


def main():
    neutral = load_palette()
    assert colors_of(neutral) == set(PALETTE), ("kratos-neutral.png", colors_of(neutral), set(PALETTE))
    assert neutral.size == (FRAME_W, FRAME_H), neutral.size
    assert neutral.split()[3].getbbox()[3] == FRAME_H, neutral.split()[3].getbbox()
    neutral.save(NEUTRAL_PATH)
    print("palette OK:", PALETTE)
    print("kratos-neutral.png saved:", NEUTRAL_PATH, neutral.size, "colors:", len(colors_of(neutral)))
    idle_f = sheet("kratos-idle.png", IDLE, neutral)
    run_f = sheet("kratos-run.png", RUN, neutral)
    air_f = sheet("kratos-air.png", AIR, neutral)
    atk_f = sheet("kratos-attack.png", ATTACK, neutral)
    roll_f = sheet("kratos-roll.png", ROLL, neutral)
    save_contact_sheet(neutral, [idle_f, run_f, air_f, atk_f, roll_f])


if __name__ == "__main__":
    main()
