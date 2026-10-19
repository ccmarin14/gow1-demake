#!/usr/bin/env python3
"""Genera las hojas de animacion de Kratos (arte original, pixel art).

Figura humana de perfil, rasterizada sobre una rejilla de 97x59 con los pies
anclados al borde inferior. Cada extremidad se dibuja con segmentos de
pixeles enteros (bloques) y contorno duro de 1px: sin curvas, sin
suavizado y sin tapas redondas. La paleta es la de `kratos-neutral.png`
(6 colores), verificada al cargar.

Uso:
    python3 scripts/gen-kratos-anim.py
"""

import math
import os

from PIL import Image, ImageDraw

FRAME_W = 97
FRAME_H = 59
CX = 48
PELVIS_Y = 28
SPINE = 16
NECK = 6
THIGH = 14
SHIN = 15
UPPER = 9
FORE = 9
FAR_DX = -2
NEAR_DX = 2

OUTLINE = (29, 20, 21)
DARK = (44, 18, 18)
LEATHER = (63, 50, 44)
SHADOW = (111, 73, 54)
MID = (160, 138, 113)
HI = (215, 198, 173)
PALETTE = [OUTLINE, DARK, LEATHER, SHADOW, MID, HI]

OUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "public/assets/characters")
NEUTRAL_PATH = os.path.join(OUT_DIR, "kratos-neutral.png")


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
    d.rectangle([int(round(x0)), int(round(y0)), int(round(x0)) + int(w) - 1, int(round(y0)) + int(h) - 1], fill=color)


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


def limb(d, p0, p1, w, color):
    seg(d, p0, p1, w + 2, OUTLINE)
    seg(d, p0, p1, w, color)


def polar(origin, angle, length):
    a = math.radians(angle)
    return (origin[0] + math.sin(a) * length, origin[1] + math.cos(a) * length)


def translate(img, dy):
    out = Image.new("RGBA", img.size, (0, 0, 0, 0))
    out.paste(img, (0, int(dy)))
    return out


def draw_pose(pose, neutral):
    img = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    # Envolvente de rodada: encoge y baja el cuerpo para cerrar la bola sin
    # reescribir el esqueleto. `tuck` va de 0 (de pie) a 1 (bola).
    tuck = pose.get("tuck", 0.0)
    squash = 1.0 - 0.42 * tuck
    drop = 3.0 * tuck
    reach_x = CX - 1.0
    reach_y = PELVIS_Y + drop

    def squash_pt(p):
        return (reach_x + (p[0] - reach_x) * squash,
                reach_y + (p[1] - reach_y) * squash)

    s = math.radians(pose.get("spine", 0) + 90)
    pelvis = squash_pt((CX, PELVIS_Y + pose.get("pelvis_dy", 0)))
    shoulder = squash_pt((pelvis[0] + math.cos(s) * -SPINE, pelvis[1] + math.sin(s) * -SPINE))
    head_c = squash_pt((shoulder[0] + math.cos(s) * -NECK, shoulder[1] + math.sin(s) * -NECK))
    joint_w = max(2, int(round(4 * squash)))
    limb_w = max(1, int(round(3 * squash)))
    head_r = max(2, int(round(4 * squash)))

    def leg(spec, dx):
        hip = squash_pt((pelvis[0] + dx * squash, pelvis[1]))
        knee = squash_pt(polar(hip, spec["thigh"], THIGH))
        foot = squash_pt(polar(knee, spec["thigh"] + spec["knee"], SHIN))
        return hip, knee, foot

    def arm(spec, dx):
        root = squash_pt((shoulder[0] + dx * squash, shoulder[1]))
        elbow = squash_pt(polar(root, spec["sh"], UPPER))
        hand = squash_pt(polar(elbow, spec["sh"] + spec["el"], FORE))
        return root, elbow, hand

    far_arm = arm(pose["armF"], FAR_DX)
    far_leg = leg(pose["legF"], FAR_DX)
    near_leg = leg(pose["legN"], NEAR_DX)
    near_arm = arm(pose["armN"], NEAR_DX)

    # Capas traseras.
    limb(d, far_arm[0], far_arm[1], limb_w, SHADOW)
    limb(d, far_arm[1], far_arm[2], limb_w, SHADOW)
    limb(d, far_leg[0], far_leg[1], joint_w, SHADOW)
    limb(d, far_leg[1], far_leg[2], joint_w, SHADOW)
    for foot in (far_leg[2],):
        rect(d, foot[0] - 3 * squash, foot[1] + 1, 7 * squash, 3 * squash, OUTLINE)
        rect(d, foot[0] - 2 * squash, foot[1] + 1, 5 * squash, 2 * squash, SHADOW)

    # Torso (piel) con franja de tatuaje.
    waist = squash_pt((pelvis[0] + math.cos(s) * -SPINE * 0.45, pelvis[1] + math.sin(s) * -SPINE * 0.45))
    torso = [
        squash_pt((shoulder[0] - 5, shoulder[1])),
        squash_pt((shoulder[0] + 5, shoulder[1])),
        squash_pt((waist[0] + 5, waist[1] + 3)),
        squash_pt((waist[0] - 5, waist[1] + 3)),
    ]
    d.polygon(torso, fill=MID, outline=OUTLINE)
    d.polygon([squash_pt((shoulder[0] - 1, shoulder[1])), squash_pt((shoulder[0] + 2, shoulder[1])),
               squash_pt((waist[0] + 2, waist[1] + 2)), squash_pt((waist[0] - 1, waist[1] + 2))], fill=DARK)

    # Lienzo/malla en la cadera.
    skirt = [
        squash_pt((pelvis[0] - 5, pelvis[1] - 2)),
        squash_pt((pelvis[0] + 5, pelvis[1] - 2)),
        squash_pt((pelvis[0] + 4, pelvis[1] + 4)),
        squash_pt((pelvis[0] - 4, pelvis[1] + 4)),
    ]
    d.polygon(skirt, fill=LEATHER, outline=OUTLINE)

    # Pierna y brazo cercanos (delante).
    limb(d, near_leg[0], near_leg[1], joint_w, HI)
    limb(d, near_leg[1], near_leg[2], joint_w, HI)
    rect(d, near_leg[2][0] - 3 * squash, near_leg[2][1] + 1, 7 * squash, 3 * squash, OUTLINE)
    rect(d, near_leg[2][0] - 2 * squash, near_leg[2][1] + 1, 5 * squash, 2 * squash, HI)
    limb(d, near_arm[0], near_arm[1], limb_w, HI)
    limb(d, near_arm[1], near_arm[2], limb_w, HI)

    # Cabeza (calva) con franja de tatuaje, ojo y perilla.
    hr = head_r
    hx, hy = head_c
    head = [
        (hx - 3 * squash, hy - hr), (hx + 3 * squash, hy - hr),
        (hx + hr, hy - 3 * squash), (hx + hr, hy + 3 * squash),
        (hx + 3 * squash, hy + hr), (hx - 3 * squash, hy + hr),
        (hx - hr, hy + 3 * squash), (hx - hr, hy - 3 * squash),
    ]
    d.polygon(head, fill=HI, outline=OUTLINE)
    rect(d, hx + 1, hy - hr, max(1, 2 * squash), hr + 1, DARK)
    rect(d, hx + 2, hy, 1, max(1, 2 * squash), SHADOW)
    rect(d, hx - 2, hy + 2, 4 * squash, 3 * squash, SHADOW)

    if pose.get("blade"):
        tip = polar(near_arm[2], pose["blade"], 24)
        limb(d, near_arm[2], tip, 3, DARK)

    bbox = img.split()[3].getbbox()
    if bbox:
        img = translate(img, (FRAME_H - 1) - (bbox[3] - 1))
    return img


def mirror(pose):
    out = dict(pose)
    out["legF"], out["legN"] = pose["legN"], pose["legF"]
    out["armF"], out["armN"] = pose["armN"], pose["armF"]
    return out


IDLE = [
    dict(spine=3, pelvis_dy=0, legF=dict(thigh=-4, knee=-4), legN=dict(thigh=3, knee=-6),
         armF=dict(sh=8, el=-14), armN=dict(sh=6, el=-14)),
    dict(spine=3, pelvis_dy=-1, legF=dict(thigh=-4, knee=-4), legN=dict(thigh=3, knee=-6),
         armF=dict(sh=6, el=-18), armN=dict(sh=4, el=-18)),
]

RUN_BASE = [
    dict(spine=9, pelvis_dy=-1, legF=dict(thigh=-30, knee=-40), legN=dict(thigh=32, knee=-12),
         armF=dict(sh=24, el=22), armN=dict(sh=-22, el=46)),
    dict(spine=11, pelvis_dy=1, legF=dict(thigh=-14, knee=-52), legN=dict(thigh=14, knee=-28),
         armF=dict(sh=4, el=30), armN=dict(sh=-6, el=40)),
    dict(spine=9, pelvis_dy=-2, legF=dict(thigh=10, knee=-60), legN=dict(thigh=-12, knee=-16),
         armF=dict(sh=-22, el=46), armN=dict(sh=24, el=22)),
]
RUN = RUN_BASE + [mirror(p) for p in RUN_BASE]

AIR = [
    dict(spine=7, pelvis_dy=-2, legF=dict(thigh=-22, knee=-40), legN=dict(thigh=28, knee=-60),
         armF=dict(sh=40, el=18), armN=dict(sh=34, el=26)),
    dict(spine=5, pelvis_dy=-3, legF=dict(thigh=-8, knee=-28), legN=dict(thigh=18, knee=-52),
         armF=dict(sh=26, el=30), armN=dict(sh=44, el=16)),
]

ATTACK = [
    dict(spine=-6, pelvis_dy=1, legF=dict(thigh=-18, knee=-14), legN=dict(thigh=22, knee=-20),
         armF=dict(sh=-10, el=20), armN=dict(sh=-60, el=-30), blade=-120),
    dict(spine=16, pelvis_dy=0, legF=dict(thigh=-24, knee=-18), legN=dict(thigh=28, knee=-16),
         armF=dict(sh=30, el=24), armN=dict(sh=70, el=10), blade=70),
    dict(spine=12, pelvis_dy=1, legF=dict(thigh=-20, knee=-16), legN=dict(thigh=24, knee=-18),
         armF=dict(sh=26, el=30), armN=dict(sh=40, el=20), blade=95),
]

# Rodada: voltereta lateral. `tuck`/`roll` son la envolvente, no el esqueleto.
ROLL = [
    # 0 — flexion: peso al frente, brazos al pecho, rodillas quebradas.
    dict(spine=34, tuck=0, legF=dict(thigh=-26, knee=-30), legN=dict(thigh=20, knee=-52),
         armF=dict(sh=-26, el=-30), armN=dict(sh=-22, el=-34)),
    # 1 — tuck: cuerpo comprimido formando bola.
    dict(spine=88, tuck=0.62, legF=dict(thigh=-38, knee=-70), legN=dict(thigh=34, knee=-78),
         armF=dict(sh=-34, el=-38), armN=dict(sh=-30, el=-42)),
    # 2 — mid: bola cerrada en el punto mas alto del giro.
    dict(spine=96, tuck=1.0, legF=dict(thigh=-44, knee=-82), legN=dict(thigh=40, knee=-90),
         armF=dict(sh=-38, el=-44), armN=dict(sh=-34, el=-48)),
    # 3 — exit: desenrollando, apoyando el pie para salir corriendo.
    dict(spine=46, tuck=0.35, legF=dict(thigh=-30, knee=-44), legN=dict(thigh=26, knee=-40),
         armF=dict(sh=-12, el=-24), armN=dict(sh=-6, el=-28)),
]


def colors_of(img):
    return {p[:3] for p in img.convert("RGBA").getdata() if p[3] > 0}


def sheet(name, poses, neutral):
    img = Image.new("RGBA", (FRAME_W * len(poses), FRAME_H), (0, 0, 0, 0))
    for i, pose in enumerate(poses):
        img.paste(draw_pose(pose, neutral), (i * FRAME_W, 0))
    img.save(os.path.join(OUT_DIR, name))
    print(name, img.size, "frames:", len(poses), "colors:", len(colors_of(img)))


def main():
    neutral = load_palette()
    print("palette OK:", PALETTE)
    sheet("kratos-idle.png", IDLE, neutral)
    sheet("kratos-run.png", RUN, neutral)
    sheet("kratos-air.png", AIR, neutral)
    sheet("kratos-attack.png", ATTACK, neutral)
    sheet("kratos-roll.png", ROLL, neutral)


if __name__ == "__main__":
    main()
