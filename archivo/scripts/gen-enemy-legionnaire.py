#!/usr/bin/env python3
"""Generador de sprites para el Legionario No-Muerto (God of War 1 PS2 lore).

Primer esbirro canónico del Mar Egeo:
- Guerrero esquelético resucitado por Ares.
- Calavera con yelmo de bronce griego corrompido, cresta de crin carmesí y ojos llameantes.
- Caja torácica y extremidades esqueléticas visibles.
- Faldón andrajoso rojo sangre (pteruges) y grebas de bronce.
- Espada curva / falcata oxidada con filo pulido.

Especificación:
- Rejilla: 8 fotogramas de 64x54 px (hoja total de 512x54 px).
- Canal alfa estrictamente binario (0 o 255).
- Anclaje inferior estricto: y = 53 (bbox[3] == 54) en poses terrestres.
- Paleta contenida: exactamente 12 colores representativos.
- Poses:
    0: idle
    1: walk_1
    2: walk_2
    3: windup (anticipación con telegraph claro)
    4: attack (tajo agresivo)
    5: hurt (impacto)
    6: juggle (suspensión aérea)
    7: death (colapso de huesos y armadura en cubierta)
"""

import math
import os
from PIL import Image, ImageDraw, ImageFont

FRAME_W = 64
FRAME_H = 54
NUM_FRAMES = 8
GROUND_Y = 53  # Fila inferior de apoyo (y = 53 -> bbox[3] == 54)

# Paleta estricta de 12 colores (RGB)
C_DARK = (26, 17, 14)        # 1. Contorno oscuro / sombras profundas #1a110e
C_BONE_LO = (156, 138, 116)  # 2. Hueso envejecido / sombra #9c8a74
C_BONE_HI = (232, 223, 204)  # 3. Hueso marfil / luz #e8dfcc
C_BRONZE_DK = (66, 43, 16)   # 4. Bronce oscuro corrompido #422b10
C_BRONZE_MD = (133, 94, 37)  # 5. Bronce griego base #855e25
C_BRONZE_HI = (196, 154, 69) # 6. Brillo de yelmo y grebas #c49a45
C_RUST_DK = (130, 80, 53)    # 7. Acero oxidado de la falcata #825035
C_STEEL_HI = (184, 150, 130) # 8. Filo afilado de la hoja #b89682
C_CLOTH_DK = (84, 18, 18)    # 9. Faldón rojo sangre en sombra #541212
C_CLOTH_HI = (158, 34, 34)   # 10. Faldón rojo carmesí luz #9e2222
C_GLOW_RED = (255, 56, 32)   # 11. Ojos llameantes carmesí de Ares #ff3820
C_GLOW_HOT = (255, 144, 48)  # 12. Núcleo incandescente / destello de ataque #ff9030

PALETTE = [
    C_DARK, C_BONE_LO, C_BONE_HI, C_BRONZE_DK, C_BRONZE_MD, C_BRONZE_HI,
    C_RUST_DK, C_STEEL_HI, C_CLOTH_DK, C_CLOTH_HI, C_GLOW_RED, C_GLOW_HOT,
]
assert len(PALETTE) == 12, f"Paleta debe tener exactamente 12 colores, tiene {len(PALETTE)}"

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_PNG = os.path.join(ROOT_DIR, "public", "assets", "characters", "legionnaire.png")
REF_PNG = os.path.join(ROOT_DIR, "docs", "referencias", "legionnaire-contact-sheet.png")


# --- Primitivas de dibujo en pixel art binario ---

def pset(img, x, y, color):
    """Pinta un píxel con alfa 255 si está dentro del lienzo."""
    xi, yi = int(round(x)), int(round(y))
    if 0 <= xi < FRAME_W and 0 <= yi < FRAME_H:
        img.putpixel((xi, yi), (*color, 255))

def rect(img, x0, y0, w, h, color):
    """Rellena un rectángulo de píxeles sólidos."""
    xi = int(round(x0))
    yi = int(round(y0))
    wi = max(1, int(round(w)))
    hi = max(1, int(round(h)))
    for y in range(yi, yi + hi):
        for x in range(xi, xi + wi):
            pset(img, x, y, color)

def seg(img, x0, y0, x1, y1, color, width=1):
    """Traza un segmento continuo píxel a píxel."""
    dx = x1 - x0
    dy = y1 - y0
    steps = int(max(abs(dx), abs(dy)))
    if steps == 0:
        rect(img, x0 - width // 2, y0 - width // 2, width, width, color)
        return
    for i in range(steps + 1):
        t = i / steps
        cx = x0 + dx * t
        cy = y0 + dy * t
        if width == 1:
            pset(img, cx, cy, color)
        else:
            hw = width / 2.0
            rect(img, cx - hw, cy - hw, width, width, color)

def bone_limb(img, p0, p1, width=2):
    """Dibuja un miembro esquelético con contorno oscuro y luz/sombra ósea."""
    seg(img, p0[0], p0[1], p1[0], p1[1], C_DARK, width + 1)
    seg(img, p0[0], p0[1], p1[0], p1[1], C_BONE_LO, width)
    if width >= 2:
        seg(img, p0[0] + 0.3, p0[1] - 0.3, p1[0] + 0.3, p1[1] - 0.3, C_BONE_HI, 1)


# --- Componentes anatómicos del Legionario ---

def draw_corinthian_helmet(img, hx, hy, tilt=0, eye_flare=False, jaw_open=0):
    """Dibuja yelmo corintio de bronce con cresta de crin carmesí y calavera."""
    # 1. Cresta arqueada de crin carmesí sobre montura de bronce
    crest_pts = [
        (hx - 4, hy - 6), (hx - 2, hy - 7), (hx, hy - 7),
        (hx + 2, hy - 7), (hx + 4, hy - 6), (hx + 5, hy - 5)
    ]
    for pt in crest_pts:
        pset(img, pt[0], pt[1] - 2, C_CLOTH_HI)
        pset(img, pt[0], pt[1] - 1, C_CLOTH_DK)
        pset(img, pt[0] - 1, pt[1] - 1, C_DARK)
        # Base de bronce
        pset(img, pt[0], pt[1], C_BRONZE_HI)
        pset(img, pt[0], pt[1] + 1, C_BRONZE_MD)

    # 2. Cúpula de bronce del yelmo
    rect(img, hx - 5, hy - 4, 10, 5, C_DARK)
    rect(img, hx - 4, hy - 4, 8, 4, C_BRONZE_MD)
    # Reflejos metálicos en el bronce
    rect(img, hx - 1, hy - 4, 4, 2, C_BRONZE_HI)
    rect(img, hx - 4, hy - 2, 2, 2, C_BRONZE_DK)

    # 3. Protector de nuca y lateral
    rect(img, hx - 5, hy - 1, 2, 4, C_BRONZE_DK)
    pset(img, hx - 6, hy + 1, C_DARK)

    # 4. Placa nasal frontal y carrilleras
    pset(img, hx + 4, hy, C_BRONZE_HI)
    pset(img, hx + 4, hy + 1, C_BRONZE_MD)
    pset(img, hx + 5, hy + 1, C_BRONZE_DK)
    pset(img, hx + 5, hy + 2, C_DARK)

    # 5. Cuenca ocular oscura de la calavera
    rect(img, hx, hy, 4, 2, C_DARK)

    # 6. Ojos llameantes carmesí de Ares
    pset(img, hx + 1, hy, C_GLOW_RED)
    pset(img, hx + 2, hy, C_GLOW_HOT)
    if eye_flare:
        # Destello de anticipación de ataque
        pset(img, hx + 3, hy, C_GLOW_HOT)
        pset(img, hx + 2, hy - 1, C_GLOW_RED)
        pset(img, hx + 2, hy + 1, C_GLOW_RED)
        pset(img, hx + 4, hy - 1, C_GLOW_HOT)
        pset(img, hx, hy, C_GLOW_RED)

    # 7. Mandíbula esquelética inferior y dientes
    jaw_y = hy + 3 + jaw_open
    rect(img, hx - 2, jaw_y, 6, 2, C_DARK)
    # Dientes visibles alternos
    pset(img, hx - 1, jaw_y, C_BONE_HI)
    pset(img, hx, jaw_y, C_DARK)
    pset(img, hx + 1, jaw_y, C_BONE_HI)
    pset(img, hx + 2, jaw_y, C_BONE_LO)
    pset(img, hx + 3, jaw_y, C_BONE_HI)

    if jaw_open > 0:
        # Hueco de la boca abierta
        rect(img, hx - 1, hy + 2, 5, jaw_open, C_DARK)
        pset(img, hx, jaw_y + 1, C_BONE_LO)
        pset(img, hx + 2, jaw_y + 1, C_BONE_HI)

def draw_skeletal_torso(img, sx, sy, length=11, lean=0):
    """Dibuja columna vertebral, caja torácica abierta y tahalí de cuero/bronce."""
    # Columna vertebral
    for i in range(length):
        y = sy + i
        x = sx + int(round(lean * (i / length)))
        pset(img, x - 1, y, C_DARK)
        pset(img, x, y, C_BONE_HI if i % 2 == 0 else C_BONE_LO)
        pset(img, x + 1, y, C_DARK)

    # Costillas esqueléticas en 3/4
    rib_levels = [2, 5, 8]
    for ro in rib_levels:
        ry = sy + ro
        rx = sx + int(round(lean * (ro / length)))
        # Costilla izquierda (fondo)
        pset(img, rx - 3, ry, C_DARK)
        pset(img, rx - 2, ry, C_BONE_LO)
        pset(img, rx - 3, ry + 1, C_BONE_LO)
        # Costilla derecha (primer término)
        pset(img, rx + 2, ry, C_BONE_HI)
        pset(img, rx + 3, ry, C_BONE_LO)
        pset(img, rx + 4, ry + 1, C_DARK)

    # Tahalí de bronce/cuero cruzando el pecho
    mid_rx = sx + int(round(lean * 0.5))
    pset(img, mid_rx - 1, sy + 4, C_BRONZE_DK)
    pset(img, mid_rx, sy + 5, C_BRONZE_MD)
    pset(img, mid_rx + 1, sy + 6, C_BRONZE_HI)
    pset(img, mid_rx + 2, sy + 7, C_BRONZE_DK)

def draw_tattered_skirt(img, hx, hy, width=11, length=9, sway=0):
    """Dibuja el faldón andrajoso de guerra (pteruges) en rojo sangre."""
    # Cinturón con broche de bronce
    rect(img, hx - width // 2 - 1, hy, width + 2, 2, C_DARK)
    rect(img, hx - width // 2, hy, width, 2, C_BRONZE_DK)
    pset(img, hx, hy, C_BRONZE_HI)
    pset(img, hx + 1, hy, C_BRONZE_MD)

    # Tiras rasgadas en alternancia rojo claro / sombra
    strips = 4
    sw = width // strips
    for s in range(strips):
        sx0 = hx - width // 2 + s * sw
        s_len = length - (1 if s % 2 == 1 else 0) - (2 if s == 0 else 0)
        for dy in range(2, s_len):
            cur_x = sx0 + int(round(sway * (dy / length)))
            color = C_CLOTH_HI if (s + dy) % 2 == 0 else C_CLOTH_DK
            pset(img, cur_x, hy + dy, color)
            pset(img, cur_x + 1, hy + dy, C_CLOTH_HI if s % 2 == 1 else C_CLOTH_DK)
        # Puntas raídas
        end_x = sx0 + int(round(sway * (s_len / length)))
        pset(img, end_x, hy + s_len, C_DARK)

def draw_skeletal_leg(img, hip, knee, foot, is_front=True):
    """Dibuja fémur esquelético, rodilla, espinillera de bronce y pie apoyado."""
    # Fémur
    bone_limb(img, hip, knee, width=2)

    # Rótula
    rect(img, knee[0] - 1, knee[1] - 1, 3, 3, C_DARK)
    pset(img, knee[0], knee[1], C_BRONZE_HI if is_front else C_BONE_LO)

    # Espinillera de bronce (greba griega)
    kx, ky = knee[0], knee[1]
    fx, fy = foot[0], foot[1]
    seg(img, kx - 1, ky + 1, fx - 1, fy - 1, C_DARK, 1)
    seg(img, kx, ky + 1, fx, fy - 1, C_BRONZE_MD if is_front else C_BRONZE_DK, 2)
    if is_front:
        seg(img, kx + 1, ky + 2, fx + 1, fy - 2, C_BRONZE_HI, 1)
        seg(img, kx + 2, ky + 1, fx + 2, fy - 1, C_DARK, 1)

    # Pie esquelético apoyado firmemente
    rect(img, fx - 2, fy - 1, 5, 2, C_DARK)
    pset(img, fx - 1, fy, C_BONE_LO)
    pset(img, fx, fy, C_BONE_HI)
    pset(img, fx + 1, fy, C_BONE_HI)
    pset(img, fx + 2, fy, C_BONE_LO)

def draw_skeletal_arm(img, shoulder, elbow, hand, is_front=True):
    """Dibuja brazo esquelético con brazalete de bronce y mano huesuda."""
    bone_limb(img, shoulder, elbow, width=2)
    bone_limb(img, elbow, hand, width=2)
    # Brazalete de bronce
    bx = (elbow[0] + hand[0]) * 0.5
    by = (elbow[1] + hand[1]) * 0.5
    rect(img, bx - 1, by - 1, 3, 3, C_DARK)
    pset(img, bx, by, C_BRONZE_HI if is_front else C_BRONZE_MD)
    # Dedos de la mano
    pset(img, hand[0], hand[1], C_BONE_HI if is_front else C_BONE_LO)
    pset(img, hand[0] + 1, hand[1], C_DARK)

def draw_falcata_aimed(img, hand, angle_deg, length=15, is_reverse=False):
    """Dibuja la falcata griega con curvatura anatómica precisa en cualquier ángulo."""
    hx, hy = hand
    rad = math.radians(angle_deg)
    ux, uy = math.cos(rad), math.sin(rad)
    vx, vy = -uy, ux
    if is_reverse:
        vx, vy = -vx, -vy

    # Pomo de cabeza de ave de bronce
    pommel_x = hx - ux * 2
    pommel_y = hy - uy * 2
    rect(img, pommel_x - 1, pommel_y - 1, 3, 3, C_DARK)
    pset(img, pommel_x, pommel_y, C_BRONZE_MD)
    pset(img, pommel_x + vx, pommel_y + vy, C_BRONZE_HI)
    pset(img, hx, hy, C_BRONZE_DK)

    # Hoja: cuello estrecho que se ensancha en un vientre curvo y termina en punta aguda
    for i in range(1, length + 1):
        t = i / float(length)
        # Posición a lo largo del lomo
        # Ligera concavidad inicial del lomo característica de la falcata
        spine_drift = -0.5 * math.sin(math.pi * t)
        sx = hx + ux * i + vx * spine_drift
        sy = hy + uy * i + vy * spine_drift

        # Ancho del vientre cortante
        # Curva convexa acentuada en el tercio exterior (vientre)
        w = 3.2 * math.sin(math.pi * (t ** 0.65)) if t < 1.0 else 0.5

        # Lomo oxidado
        pset(img, sx - vx * 0.8, sy - vy * 0.8, C_DARK)
        pset(img, sx, sy, C_RUST_DK)

        # Relleno del cuerpo de la hoja
        if w >= 1.2:
            step_fill = int(math.ceil(w))
            for f in range(1, step_fill):
                fx = sx + vx * f
                fy = sy + vy * f
                pset(img, fx, fy, C_RUST_DK)

        # Filo afilado de acero
        ex = sx + vx * w
        ey = sy + vy * w
        pset(img, ex, ey, C_STEEL_HI)

    # Punta afilada
    tip_x = hx + ux * length
    tip_y = hy + uy * length
    pset(img, tip_x, tip_y, C_STEEL_HI)
    return (tip_x, tip_y)


# --- Renderizadores de los 8 fotogramas ---

def render_frame_idle():
    """0: idle - Guardia encorvada amenazante con la falcata inclinada al frente."""
    img = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))

    # Pierna trasera
    draw_skeletal_leg(img, hip=(26, 33), knee=(22, 42), foot=(20, GROUND_Y), is_front=False)
    # Brazo trasero en guardia
    draw_skeletal_arm(img, shoulder=(27, 21), elbow=(23, 26), hand=(21, 31), is_front=False)
    # Columna y caja torácica encorvada
    draw_skeletal_torso(img, sx=28, sy=21, length=11, lean=2)
    # Faldón carmesí
    draw_tattered_skirt(img, hx=29, hy=32, width=10, length=9, sway=1)
    # Pierna delantera
    draw_skeletal_leg(img, hip=(31, 33), knee=(34, 43), foot=(34, GROUND_Y), is_front=True)
    # Calavera y yelmo
    draw_corinthian_helmet(img, hx=33, hy=15, tilt=1, eye_flare=False, jaw_open=0)
    # Brazo delantero y falcata
    draw_skeletal_arm(img, shoulder=(32, 21), elbow=(36, 26), hand=(40, 29), is_front=True)
    draw_falcata_aimed(img, hand=(40, 29), angle_deg=22, length=14)

    return img


def render_frame_walk_1():
    """1: walk_1 - Paso de avance con zancada y falcata lista."""
    img = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))

    # Pierna trasera atrasada
    draw_skeletal_leg(img, hip=(26, 32), knee=(20, 41), foot=(17, GROUND_Y), is_front=False)
    # Brazo trasero
    draw_skeletal_arm(img, shoulder=(28, 20), elbow=(24, 25), hand=(22, 30), is_front=False)
    # Columna
    draw_skeletal_torso(img, sx=29, sy=20, length=11, lean=3)
    # Faldón con inercia hacia atrás
    draw_tattered_skirt(img, hx=30, hy=31, width=10, length=9, sway=-2)
    # Pierna delantera en zancada
    draw_skeletal_leg(img, hip=(32, 32), knee=(37, 42), foot=(38, GROUND_Y), is_front=True)
    # Calavera adelantada
    draw_corinthian_helmet(img, hx=35, hy=14, tilt=2, eye_flare=False, jaw_open=1)
    # Brazo delantero y falcata
    draw_skeletal_arm(img, shoulder=(33, 20), elbow=(37, 24), hand=(41, 26), is_front=True)
    draw_falcata_aimed(img, hand=(41, 26), angle_deg=16, length=14)

    return img


def render_frame_walk_2():
    """2: walk_2 - Paso alterno con inercia hacia adelante."""
    img = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))

    # Pierna trasera
    draw_skeletal_leg(img, hip=(32, 33), knee=(27, 42), foot=(23, GROUND_Y), is_front=False)
    # Brazo trasero
    draw_skeletal_arm(img, shoulder=(29, 21), elbow=(25, 26), hand=(24, 31), is_front=False)
    # Columna
    draw_skeletal_torso(img, sx=30, sy=21, length=11, lean=2)
    # Faldón
    draw_tattered_skirt(img, hx=31, hy=32, width=10, length=9, sway=0)
    # Pierna delantera
    draw_skeletal_leg(img, hip=(28, 33), knee=(35, 42), foot=(36, GROUND_Y), is_front=True)
    # Calavera
    draw_corinthian_helmet(img, hx=36, hy=15, tilt=1, eye_flare=False, jaw_open=0)
    # Brazo delantero y falcata
    draw_skeletal_arm(img, shoulder=(34, 21), elbow=(39, 26), hand=(43, 29), is_front=True)
    draw_falcata_aimed(img, hand=(43, 29), angle_deg=20, length=14)

    return img


def render_frame_windup():
    """3: windup - Anticipación: espada levantada atrás/arriba, destello en ojos (telegraph claro)."""
    img = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))

    # Pierna trasera apoyada firme
    draw_skeletal_leg(img, hip=(24, 34), knee=(19, 43), foot=(17, GROUND_Y), is_front=False)
    # Brazo izquierdo extendido al frente amenazando a Kratos
    draw_skeletal_arm(img, shoulder=(25, 22), elbow=(31, 23), hand=(37, 25), is_front=False)
    # Garras tensas
    pset(img, 38, 24, C_BONE_HI)
    pset(img, 38, 26, C_BONE_LO)

    # Columna arqueada hacia atrás en tensión
    draw_skeletal_torso(img, sx=25, sy=22, length=11, lean=-2)
    # Faldón tenso
    draw_tattered_skirt(img, hx=26, hy=33, width=10, length=9, sway=-1)
    # Pierna delantera firme en el suelo
    draw_skeletal_leg(img, hip=(29, 34), knee=(33, 43), foot=(33, GROUND_Y), is_front=True)

    # Calavera con destello ígneo evidente en los ojos (telegraph)
    draw_corinthian_helmet(img, hx=29, hy=15, tilt=-1, eye_flare=True, jaw_open=2)

    # Brazo derecho cargado arriba y atrás
    draw_skeletal_arm(img, shoulder=(27, 21), elbow=(20, 15), hand=(16, 11), is_front=True)

    # Falcata levantada apuntando arriba-atrás lista para el golpe
    draw_falcata_aimed(img, hand=(16, 11), angle_deg=-65, length=11, is_reverse=True)

    # Destello de luz en el filo levantado
    pset(img, 21, 1, C_GLOW_HOT)
    pset(img, 22, 1, C_STEEL_HI)
    pset(img, 20, 1, C_STEEL_HI)

    return img


def render_frame_attack():
    """4: attack - Tajo agresivo descendente hacia el frente con estela."""
    img = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))

    # Pierna trasera extendida
    draw_skeletal_leg(img, hip=(27, 35), knee=(20, 43), foot=(17, GROUND_Y), is_front=False)
    # Brazo izquierdo echado atrás por inercia
    draw_skeletal_arm(img, shoulder=(31, 23), elbow=(24, 26), hand=(19, 29), is_front=False)
    # Columna inclinada violentamente hacia adelante
    draw_skeletal_torso(img, sx=32, sy=23, length=11, lean=5)
    # Faldón ondeando hacia atrás
    draw_tattered_skirt(img, hx=33, hy=34, width=10, length=9, sway=-3)
    # Pierna delantera flexionada en embestida
    draw_skeletal_leg(img, hip=(36, 35), knee=(41, 44), foot=(41, GROUND_Y), is_front=True)
    # Calavera agresiva con fauces abiertas
    draw_corinthian_helmet(img, hx=40, hy=17, tilt=3, eye_flare=False, jaw_open=2)
    # Brazo derecho en extensión total del golpe
    draw_skeletal_arm(img, shoulder=(36, 23), elbow=(42, 27), hand=(47, 31), is_front=True)

    # Falcata en tajo frontal descendente
    draw_falcata_aimed(img, hand=(47, 31), angle_deg=38, length=15)

    # Media luna de estela cortante en el frente
    arc_points = [
        (50, 20), (55, 25), (59, 32), (61, 38), (59, 44)
    ]
    for idx in range(len(arc_points) - 1):
        p_a = arc_points[idx]
        p_b = arc_points[idx + 1]
        seg(img, p_a[0], p_a[1], p_b[0], p_b[1], C_STEEL_HI, 2)
        seg(img, p_a[0] - 1, p_a[1], p_b[0] - 1, p_b[1], C_RUST_DK, 1)

    return img


def render_frame_hurt():
    """5: hurt - Impacto: torso y calavera sacudidos hacia atrás por el golpe."""
    img = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))

    # Pierna trasera retrocediendo
    draw_skeletal_leg(img, hip=(23, 34), knee=(17, 43), foot=(15, GROUND_Y), is_front=False)
    # Brazo izquierdo despedido hacia atrás
    draw_skeletal_arm(img, shoulder=(21, 21), elbow=(14, 23), hand=(10, 27), is_front=False)
    # Columna violentamente arqueada hacia atrás
    draw_skeletal_torso(img, sx=22, sy=21, length=11, lean=-4)
    # Faldón proyectado hacia adelante por la inercia del golpe
    draw_tattered_skirt(img, hx=25, hy=33, width=10, length=9, sway=2)
    # Pierna delantera desequilibrada
    draw_skeletal_leg(img, hip=(28, 34), knee=(29, 43), foot=(27, GROUND_Y), is_front=True)
    # Calavera lanzada hacia atrás con la boca abierta
    draw_corinthian_helmet(img, hx=21, hy=13, tilt=-3, eye_flare=False, jaw_open=3)
    # Chispas carmesí brotando del impacto de las Cuchillas del Caos
    pset(img, 28, 15, C_GLOW_RED)
    pset(img, 30, 14, C_GLOW_HOT)
    pset(img, 29, 18, C_GLOW_RED)
    # Brazo derecho desarticulado
    draw_skeletal_arm(img, shoulder=(24, 21), elbow=(29, 21), hand=(33, 24), is_front=True)
    # Falcata perdiendo el ángulo de ataque
    draw_falcata_aimed(img, hand=(33, 24), angle_deg=-40, length=12)

    return img


def render_frame_juggle():
    """6: juggle - Suspensión aérea (Ascension): esqueleto volteado en el aire."""
    img = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))

    # Centro de masa suspendido en el aire (y ~ 24, despeje de suelo > 10px)
    # Piernas suspendidas arriba
    draw_skeletal_leg(img, hip=(31, 25), knee=(36, 33), foot=(38, 41), is_front=False)
    draw_skeletal_leg(img, hip=(34, 26), knee=(29, 35), foot=(27, 43), is_front=True)
    # Faldón flotando en el aire
    draw_tattered_skirt(img, hx=33, hy=24, width=9, length=8, sway=-1)
    # Columna volteada en ángulo aéreo
    draw_skeletal_torso(img, sx=29, sy=18, length=9, lean=-3)
    # Calavera colgando hacia abajo en el aire
    draw_corinthian_helmet(img, hx=25, hy=13, tilt=-2, eye_flare=False, jaw_open=2)
    # Brazos flaqueando en el aire
    draw_skeletal_arm(img, shoulder=(27, 18), elbow=(21, 15), hand=(17, 13), is_front=False)
    draw_skeletal_arm(img, shoulder=(31, 19), elbow=(36, 21), hand=(41, 19), is_front=True)
    # Falcata cayendo en el aire
    draw_falcata_aimed(img, hand=(41, 19), angle_deg=-35, length=11)

    return img


def render_frame_death():
    """7: death - Colapso: huesos, armadura y falcata desmoronados sobre la cubierta."""
    img = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))

    # Faldón aplastado en el suelo
    rect(img, 24, 48, 14, 4, C_DARK)
    rect(img, 25, 49, 12, 3, C_CLOTH_DK)
    rect(img, 27, 50, 8, 2, C_CLOTH_HI)

    # Columna rota desparramada
    seg(img, 23, 49, 33, 48, C_DARK, 3)
    seg(img, 23, 49, 33, 48, C_BONE_LO, 2)
    pset(img, 26, 48, C_BONE_HI)
    pset(img, 29, 48, C_BONE_HI)

    # Costillas rotas sobresaliendo
    pset(img, 27, 46, C_BONE_HI)
    pset(img, 28, 47, C_BONE_LO)
    pset(img, 31, 46, C_BONE_HI)
    pset(img, 32, 47, C_DARK)

    # Fémur y greba de bronce caída
    seg(img, 20, 51, 30, 52, C_DARK, 3)
    seg(img, 20, 51, 30, 52, C_BRONZE_DK, 2)
    pset(img, 24, 51, C_BRONZE_HI)
    pset(img, 28, 51, C_BRONZE_MD)

    # Falcata caída de plano sobre las tablas de la cubierta (toca y = GROUND_Y)
    rect(img, 10, GROUND_Y - 2, 14, 3, C_DARK)
    seg(img, 11, GROUND_Y - 1, 22, GROUND_Y - 1, C_RUST_DK, 2)
    seg(img, 14, GROUND_Y, 23, GROUND_Y, C_STEEL_HI, 1)
    pset(img, 10, GROUND_Y - 1, C_BRONZE_MD)
    pset(img, 11, GROUND_Y - 2, C_BRONZE_DK)

    # Calavera y yelmo caídos de lado (toca y = GROUND_Y)
    rect(img, 36, 44, 9, 8, C_DARK)
    rect(img, 37, 45, 7, 6, C_BRONZE_MD)
    rect(img, 38, 45, 5, 3, C_BRONZE_HI)
    pset(img, 43, 48, C_BRONZE_DK)

    # Cuenca con fuego extinguido (solo 1 píxel tenue de brasa)
    rect(img, 40, 48, 4, 3, C_DARK)
    pset(img, 41, 49, C_DARK)
    pset(img, 42, 48, C_CLOTH_DK)

    # Dientes en la madera
    pset(img, 41, 51, C_BONE_HI)
    pset(img, 42, 51, C_BONE_LO)
    pset(img, 43, 51, C_BONE_HI)
    pset(img, 44, GROUND_Y, C_DARK)
    pset(img, 43, GROUND_Y, C_BONE_LO)

    # Hueso apoyado en el suelo
    pset(img, 32, GROUND_Y, C_BONE_LO)
    pset(img, 33, GROUND_Y, C_DARK)

    return img


RENDERERS = [
    render_frame_idle,
    render_frame_walk_1,
    render_frame_walk_2,
    render_frame_windup,
    render_frame_attack,
    render_frame_hurt,
    render_frame_juggle,
    render_frame_death,
]

FRAME_NAMES = [
    "0: idle",
    "1: walk_1",
    "2: walk_2",
    "3: windup",
    "4: attack",
    "5: hurt",
    "6: juggle",
    "7: death",
]


def build_spritesheet():
    """Genera la tira horizontal de 512x54 px con los 8 fotogramas."""
    sheet = Image.new("RGBA", (FRAME_W * NUM_FRAMES, FRAME_H), (0, 0, 0, 0))
    frames = []

    for idx, renderer in enumerate(RENDERERS):
        frame = renderer()
        bbox = frame.getbbox()
        assert bbox is not None, f"Frame {idx} ({FRAME_NAMES[idx]}) está vacío"

        # Validación de anclaje
        if idx == 6:
            # Juggle es aérea: no debe tocar el suelo
            assert bbox[3] < FRAME_H, (
                f"Frame 6 (juggle) debe ser aéreo pero bbox[3] es {bbox[3]}"
            )
        else:
            # Poses terrestres: deben tocar exactamente y = GROUND_Y (bbox[3] == 54)
            assert bbox[3] == FRAME_H, (
                f"Frame {idx} ({FRAME_NAMES[idx]}) tiene anclaje bbox[3]={bbox[3]} != {FRAME_H}"
            )

        # Validación de canal alfa binario
        for y in range(FRAME_H):
            for x in range(FRAME_W):
                a = frame.getpixel((x, y))[3]
                assert a in (0, 255), (
                    f"Frame {idx} en ({x}, {y}) tiene alfa no binario: {a}"
                )

        sheet.paste(frame, (idx * FRAME_W, 0), frame)
        frames.append(frame)

    return sheet, frames


def validate_palette(img):
    """Verifica que la imagen use estrictamente la paleta de 12 colores."""
    colors = set()
    for y in range(img.height):
        for x in range(img.width):
            r, g, b, a = img.getpixel((x, y))
            if a > 0:
                colors.add((r, g, b))

    palette_set = set(PALETTE)
    unknown = colors - palette_set
    assert not unknown, f"Colores desconocidos fuera de la paleta: {unknown}"
    assert len(colors) <= 12, f"Demasiados colores: {len(colors)} > 12"
    return colors


def build_contact_sheet(frames):
    """Crea una hoja de contacto ampliada a 2x con etiquetas descriptivas."""
    scale = 2
    padding = 8
    label_h = 24
    cols = 4
    rows = 2
    cell_w = FRAME_W * scale
    cell_h = FRAME_H * scale

    total_w = padding + cols * (cell_w + padding)
    total_h = padding + rows * (cell_h + label_h + padding)

    contact = Image.new("RGBA", (total_w, total_h), (18, 14, 20, 255))
    draw = ImageDraw.Draw(contact)
    font = ImageFont.load_default()

    for idx, frame in enumerate(frames):
        c = idx % cols
        r = idx // cols
        x0 = padding + c * (cell_w + padding)
        y0 = padding + r * (cell_h + label_h + padding)

        # Fondo del recuadro
        draw.rectangle([x0 - 1, y0 - 1, x0 + cell_w, y0 + cell_h], outline=(50, 40, 48, 255), fill=(28, 22, 30, 255))

        # Línea de suelo guía
        ground_line_y = y0 + GROUND_Y * scale
        draw.line([(x0, ground_line_y), (x0 + cell_w - 1, ground_line_y)], fill=(70, 50, 40, 255))

        # Sprite escalado 2x nearest
        scaled = frame.resize((cell_w, cell_h), Image.NEAREST)
        contact.paste(scaled, (x0, y0), scaled)

        # Etiqueta
        label = FRAME_NAMES[idx]
        bbox_f = frame.getbbox()
        h_px = bbox_f[3] - bbox_f[1] if bbox_f else 0
        info = f"{label} ({h_px}px)"
        draw.text((x0 + 2, y0 + cell_h + 4), info, fill=(220, 210, 195, 255), font=font)

    return contact


def main():
    print("=== Generando Legionario No-Muerto (Undead Legionnaire) ===")
    sheet, frames = build_spritesheet()

    used_colors = validate_palette(sheet)
    print(f"Paleta validada: {len(used_colors)} colores usados (máximo 12)")
    print(f"Dimensiones de la hoja: {sheet.size} (esperado: 512x54)")

    os.makedirs(os.path.dirname(OUT_PNG), exist_ok=True)
    sheet.save(OUT_PNG)
    print(f"Hoja de sprites guardada en: {OUT_PNG}")

    contact = build_contact_sheet(frames)
    os.makedirs(os.path.dirname(REF_PNG), exist_ok=True)
    contact.save(REF_PNG)
    print(f"Hoja de contacto 2x guardada en: {REF_PNG} ({contact.size})")

    # Resumen de fotogramas y anclajes
    print("\nResumen de fotogramas:")
    for idx, f in enumerate(frames):
        bb = f.getbbox()
        h = bb[3] - bb[1]
        w = bb[2] - bb[0]
        grounded = "Suelo (y=53)" if bb[3] == 54 else "Aire"
        print(f"  Frame {FRAME_NAMES[idx]:<10}: bbox={bb}, w={w}px, h={h}px, {grounded}")

    print("\n¡Generación completada con éxito!")


if __name__ == "__main__":
    main()
