#!/usr/bin/env python3
"""Generador de sprites para el Arquero No-Muerto (God of War 1 PS2 lore).

Segundo esbirro canónico del Mar Egeo y Atenas:
- Arquero esquelético resucitado por Ares.
- Calavera sin yelmo con diadema/fillet de cuero y cuencas con fulgor amatista/violeta (#b040ff, #e890ff).
- Arco griego recurvo de madera y cuerno, con carcaj de cuero a la espalda.
- Silueta más ágil, baja y encorvada que el Legionario (altura útil 44-48 px).
- Faldón andrajoso oscuro (púrpura cenizo).
- Proyectil de flecha griego (16x8 px).

Especificación:
- Rejilla: 8 fotogramas de 64x54 px (hoja total de 512x54 px).
- Canal alfa estrictamente binario (0 o 255).
- Anclaje inferior estricto: y = 53 (bbox[3] == 54) en poses terrestres (0, 1, 2, 3, 4, 5, 7).
- Despeje vertical en pose aérea 6 (juggle): bbox[3] <= 46.
- Paleta contenida: máximo 12 colores (exactamente 11 colores consistentes).
- Poses:
    0: idle (encorvado, arco en mano bajado)
    1: walk_1 (paso de retroceso 1)
    2: walk_2 (paso de reposicionamiento 2)
    3: aim (tensado y anticipación con telegraph violeta nítido)
    4: shoot (suelta explosiva de la cuerda y retroceso)
    5: hurt (impacto de Cuchillas del Caos)
    6: juggle (suspensión aérea ingrávida)
    7: death (colapso de huesos y arco quebrado en la cubierta)
"""

import math
import os
from PIL import Image, ImageDraw, ImageFont

FRAME_W = 64
FRAME_H = 54
NUM_FRAMES = 8
GROUND_Y = 53  # Fila inferior de apoyo (y = 53 -> bbox[3] == 54)

# Paleta estricta de 11 colores (máximo 12)
C_DARK        = (24, 16, 20)     # 1. Contorno oscuro / sombras profundas (#181014)
C_BONE_LO     = (156, 138, 116)  # 2. Hueso envejecido / sombra (#9c8a74)
C_BONE_HI     = (232, 223, 204)  # 3. Hueso marfil / luz / cuerda del arco (#e8dfcc)
C_WOOD_DK     = (92, 58, 30)     # 4. Madera oscura del arco / culatines (#5c3a1e)
C_WOOD_HI     = (168, 116, 68)   # 5. Madera clara / asta de flechas / agarre (#a87444)
C_LEATHER     = (66, 40, 20)     # 6. Cuero del carcaj y correas (#422814)
C_BRONZE      = (196, 154, 69)   # 7. Broches, brazalete y punta de flecha (#c49a45)
C_TUNIC_DK    = (50, 26, 40)     # 8. Faldón andrajoso oscuro sombra / plumas (#321a28)
C_TUNIC_HI    = (94, 52, 76)     # 9. Faldón andrajoso púrpura/grisáceo luz (#5e344c)
C_GLOW_VIOLET = (176, 64, 255)   # 10. Fulgor espectral amatista de los ojos (#b040ff)
C_GLOW_LILAC  = (232, 144, 255)  # 11. Núcleo incandescente violeta claro / telegraph (#e890ff)

PALETTE = [
    C_DARK, C_BONE_LO, C_BONE_HI, C_WOOD_DK, C_WOOD_HI, C_LEATHER,
    C_BRONZE, C_TUNIC_DK, C_TUNIC_HI, C_GLOW_VIOLET, C_GLOW_LILAC,
]
assert len(PALETTE) <= 12, f"Paleta debe tener como máximo 12 colores, tiene {len(PALETTE)}"

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_SPRITESHEET = os.path.join(ROOT_DIR, "public", "assets", "characters", "archer.png")
OUT_ARROW = os.path.join(ROOT_DIR, "public", "assets", "characters", "arrow.png")
OUT_CONTACT = os.path.join(ROOT_DIR, "docs", "referencias", "archer-contact-sheet.png")

FRAME_NAMES = [
    "0_idle",
    "1_walk1",
    "2_walk2",
    "3_aim",
    "4_shoot",
    "5_hurt",
    "6_juggle",
    "7_death",
]


# --- Primitivas de dibujo en pixel art binario ---

def pset(img, x, y, color):
    """Pinta un píxel con alfa 255 si está dentro del lienzo del fotograma."""
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
        t = i / float(steps)
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


# --- Componentes anatómicos del Arquero No-Muerto ---

def draw_archer_skull(img, hx, hy, tilt=0, eye_flare=False, jaw_open=0, facing=-1):
    """Dibuja la calavera esquelética del arquero con diadema de cuero/bronce y cuencas violetas."""
    # 1. Bóveda craneal superior
    rect(img, hx - 4, hy - 4, 8, 4, C_DARK)
    rect(img, hx - 3, hy - 4, 6, 3, C_BONE_HI)
    rect(img, hx - 3, hy - 2, 6, 2, C_BONE_LO)

    # 2. Diadema de cuero envejecido con remache de bronce (fillet)
    rect(img, hx - 4, hy - 2, 8, 2, C_DARK)
    rect(img, hx - 3, hy - 2, 6, 1, C_LEATHER)
    pset(img, hx + facing * 1, hy - 2, C_BRONZE)

    # 3. Parietal y nuca posterior
    nuca_x = hx - facing * 3
    rect(img, nuca_x, hy - 1, 2, 4, C_BONE_LO)
    pset(img, nuca_x, hy + 2, C_DARK)

    # 4. Cuenca ocular profunda (orientada según facing)
    eye_x = hx + facing * 2
    rect(img, eye_x - 1, hy, 3, 2, C_DARK)

    # 5. Ojos con fulgor amatista/violeta espectral
    pset(img, eye_x, hy, C_GLOW_VIOLET)
    pset(img, eye_x, hy + 1, C_GLOW_LILAC)

    # Telegraph visual de apuntado (eye flare intenso)
    if eye_flare:
        pset(img, eye_x + facing * 1, hy, C_GLOW_LILAC)
        pset(img, eye_x + facing * 2, hy, C_GLOW_LILAC)
        pset(img, eye_x + facing * 3, hy, C_GLOW_VIOLET)
        pset(img, eye_x, hy - 1, C_GLOW_VIOLET)
        pset(img, eye_x, hy + 2, C_GLOW_VIOLET)
        pset(img, eye_x + facing * 1, hy - 1, C_GLOW_LILAC)
        pset(img, eye_x - facing * 1, hy, C_GLOW_VIOLET)

    # 6. Pómulo y tabique nasal
    pset(img, eye_x + facing * 1, hy + 1, C_BONE_HI)
    pset(img, eye_x + facing * 1, hy + 2, C_DARK)

    # 7. Mandíbula y dentadura
    jaw_y = hy + 3 + jaw_open
    rect(img, hx - 2, jaw_y, 6, 2, C_DARK)
    # Dientes visibles alternos
    pset(img, hx - 1, jaw_y, C_BONE_HI)
    pset(img, hx, jaw_y, C_DARK)
    pset(img, hx + 1, jaw_y, C_BONE_HI)
    pset(img, hx + 2, jaw_y, C_BONE_LO)

    if jaw_open > 0:
        rect(img, hx - 1, hy + 2, 4, jaw_open, C_DARK)
        pset(img, hx, jaw_y + 1, C_BONE_LO)

def draw_archer_torso(img, sx, sy, length=10, lean=0):
    """Dibuja columna vertebral encorvada, caja torácica y tahalí de cuero cruzado."""
    # Columna vertebral huesuda
    for i in range(length):
        y = sy + i
        x = sx + int(round(lean * (i / float(length))))
        pset(img, x - 1, y, C_DARK)
        pset(img, x, y, C_BONE_HI if i % 2 == 0 else C_BONE_LO)
        pset(img, x + 1, y, C_DARK)

    # Costillas esqueléticas
    rib_levels = [2, 5, 7]
    for ro in rib_levels:
        ry = sy + ro
        rx = sx + int(round(lean * (ro / float(length))))
        # Costilla posterior
        pset(img, rx + 2, ry, C_DARK)
        pset(img, rx + 2, ry + 1, C_BONE_LO)
        # Costilla frontal
        pset(img, rx - 2, ry, C_BONE_HI)
        pset(img, rx - 3, ry + 1, C_BONE_LO)
        pset(img, rx - 4, ry + 1, C_DARK)

    # Tahalí de cuero cruzando el pecho
    mid_rx = sx + int(round(lean * 0.4))
    pset(img, mid_rx + 1, sy + 3, C_LEATHER)
    pset(img, mid_rx, sy + 4, C_LEATHER)
    pset(img, mid_rx - 1, sy + 5, C_BRONZE)  # Broche de bronce
    pset(img, mid_rx - 2, sy + 6, C_LEATHER)

def draw_quiver(img, qx, qy, angle_deg=-25, arrows_count=3):
    """Dibuja el carcaj de cuero rústico a la espalda con culatines de flechas visibles."""
    rad = math.radians(angle_deg)
    ux, uy = math.cos(rad), math.sin(rad)
    vx, vy = -uy, ux

    # Tubo del carcaj (longitud 12 px, grosor 4 px)
    length = 12
    for i in range(length):
        cx = qx + ux * i
        cy = qy + uy * i
        seg(img, cx - vx * 1.5, cy - vy * 1.5, cx + vx * 1.5, cy + vy * 1.5, C_DARK, 1)
        seg(img, cx - vx * 0.8, cy - vy * 0.8, cx + vx * 0.8, cy + vy * 0.8, C_LEATHER, 1)

    # Boca del carcaj ribeteada en bronce
    mouth_x = qx
    mouth_y = qy
    rect(img, mouth_x - 1, mouth_y - 1, 3, 3, C_DARK)
    pset(img, mouth_x, mouth_y, C_BRONZE)

    # Culatines y plumas de flechas que asoman
    for a in range(arrows_count):
        offset = (a - 1) * 2
        ax0 = mouth_x + vx * offset - ux * 2
        ay0 = mouth_y + vy * offset - uy * 2
        ax1 = ax0 - ux * 4
        ay1 = ay0 - uy * 4
        seg(img, ax0, ay0, ax1, ay1, C_WOOD_HI, 1)
        # Emplumado oscuro
        pset(img, ax1, ay1, C_TUNIC_DK)
        pset(img, ax1 + vx * 0.8, ay1 + vy * 0.8, C_TUNIC_HI)

def draw_archer_skirt(img, hx, hy, width=9, length=8, sway=0):
    """Dibuja el faldón andrajoso en tonos púrpura cenizo oscuro con cinturón de cuero."""
    # Cinturón con hebilla de bronce
    rect(img, hx - width // 2 - 1, hy, width + 2, 2, C_DARK)
    rect(img, hx - width // 2, hy, width, 2, C_LEATHER)
    pset(img, hx, hy, C_BRONZE)

    # Tiras rasgadas en alternancia púrpura sombra / luz
    strips = 3
    sw = width // strips
    for s in range(strips):
        sx0 = hx - width // 2 + s * sw
        s_len = length - (1 if s % 2 == 1 else 0)
        for dy in range(2, s_len):
            cur_x = sx0 + int(round(sway * (dy / float(length))))
            color = C_TUNIC_HI if (s + dy) % 2 == 0 else C_TUNIC_DK
            pset(img, cur_x, hy + dy, color)
            pset(img, cur_x + 1, hy + dy, C_TUNIC_HI if s % 2 == 1 else C_TUNIC_DK)
        # Puntas raídas
        end_x = sx0 + int(round(sway * (s_len / float(length))))
        pset(img, end_x, hy + s_len, C_DARK)

def draw_archer_leg(img, hip, knee, foot, is_front=True):
    """Dibuja fémur esquelético, rodilla, espinillera de cuero/bronce y pie óseo apoyado."""
    # Fémur
    bone_limb(img, hip, knee, width=2)

    # Rótula
    rect(img, knee[0] - 1, knee[1] - 1, 3, 3, C_DARK)
    pset(img, knee[0], knee[1], C_BONE_HI if is_front else C_BONE_LO)

    # Espinillera / vendas de cuero
    kx, ky = knee[0], knee[1]
    fx, fy = foot[0], foot[1]
    seg(img, kx - 1, ky + 1, fx - 1, fy - 1, C_DARK, 1)
    seg(img, kx, ky + 1, fx, fy - 1, C_LEATHER if is_front else C_DARK, 2)
    if is_front:
        seg(img, kx + 1, ky + 2, fx + 1, fy - 2, C_BRONZE, 1)

    # Pie esquelético apoyado en foot[1]
    rect(img, fx - 2, fy - 1, 5, 2, C_DARK)
    pset(img, fx - 1, fy, C_BONE_LO)
    pset(img, fx, fy, C_BONE_HI)
    pset(img, fx + 1, fy, C_BONE_HI)
    pset(img, fx + 2, fy, C_BONE_LO)

def draw_archer_arm(img, shoulder, elbow, hand, is_front=True):
    """Dibuja brazo esquelético con brazalete de bronce y mano huesuda."""
    bone_limb(img, shoulder, elbow, width=2)
    bone_limb(img, elbow, hand, width=2)
    # Brazalete de bronce en antebrazo
    bx = (elbow[0] + hand[0]) * 0.5
    by = (elbow[1] + hand[1]) * 0.5
    rect(img, bx - 1, by - 1, 3, 3, C_DARK)
    pset(img, bx, by, C_BRONZE)
    # Dedos de la mano
    pset(img, hand[0], hand[1], C_BONE_HI if is_front else C_BONE_LO)
    pset(img, hand[0] + 1, hand[1], C_DARK)

def draw_recurve_bow(img, grip, upper_tip, lower_tip, drawn=False, draw_hand=None, nocked_arrow=False):
    """Dibuja el arco recurvo griego compuesto con curvatura elástica sinuosa y cuerda."""
    gx, gy = grip
    ux, uy = upper_tip
    lx, ly = lower_tip

    # 1. Agarre central de cuero
    rect(img, gx - 1, gy - 2, 3, 5, C_DARK)
    rect(img, gx, gy - 1, 2, 3, C_LEATHER)
    pset(img, gx, gy, C_BRONZE)

    # 2. Pala superior (recurve: curvatura que va hacia afuera y luego hacia la punta)
    # Curva bezier cuadrática usando punto de control
    ctrl_u_x = (gx + ux) * 0.5 + (4 if drawn else -3)
    ctrl_u_y = (gy + uy) * 0.5
    steps = 12
    prev_pt = (gx, gy - 2)
    for i in range(1, steps + 1):
        t = i / float(steps)
        # Bezier cuadrática
        cx = (1 - t) ** 2 * prev_pt[0] + 2 * (1 - t) * t * ctrl_u_x + t ** 2 * ux
        cy = (1 - t) ** 2 * prev_pt[1] + 2 * (1 - t) * t * ctrl_u_y + t ** 2 * uy
        color = C_WOOD_HI if i % 2 == 0 else C_WOOD_DK
        seg(img, prev_pt[0], prev_pt[1], cx, cy, C_DARK, 2)
        seg(img, prev_pt[0], prev_pt[1], cx, cy, color, 1)
        prev_pt = (cx, cy)
    # Punta de bronce
    pset(img, ux, uy, C_BRONZE)

    # 3. Pala inferior
    ctrl_l_x = (gx + lx) * 0.5 + (4 if drawn else -3)
    ctrl_l_y = (gy + ly) * 0.5
    prev_pt = (gx, gy + 2)
    for i in range(1, steps + 1):
        t = i / float(steps)
        cx = (1 - t) ** 2 * prev_pt[0] + 2 * (1 - t) * t * ctrl_l_x + t ** 2 * lx
        cy = (1 - t) ** 2 * prev_pt[1] + 2 * (1 - t) * t * ctrl_l_y + t ** 2 * ly
        color = C_WOOD_HI if i % 2 == 0 else C_WOOD_DK
        seg(img, prev_pt[0], prev_pt[1], cx, cy, C_DARK, 2)
        seg(img, prev_pt[0], prev_pt[1], cx, cy, color, 1)
        prev_pt = (cx, cy)
    # Punta de bronce
    pset(img, lx, ly, C_BRONZE)

    # 4. Cuerda del arco
    if drawn and draw_hand:
        dhx, dhy = draw_hand
        seg(img, ux, uy, dhx, dhy, C_BONE_HI, 1)
        seg(img, dhx, dhy, lx, ly, C_BONE_HI, 1)
    else:
        seg(img, ux, uy, lx, ly, C_BONE_HI, 1)

    # 5. Flecha nockeada lista para disparo
    if nocked_arrow and draw_hand:
        dhx, dhy = draw_hand
        tip_x = gx - 10
        tip_y = gy
        # Asta de madera
        seg(img, tip_x + 3, tip_y, dhx, dhy, C_WOOD_HI, 1)
        # Punta de flecha de bronce
        pset(img, tip_x, tip_y, C_BRONZE)
        pset(img, tip_x + 1, tip_y - 1, C_DARK)
        pset(img, tip_x + 1, tip_y + 1, C_DARK)
        pset(img, tip_x + 2, tip_y, C_BRONZE)


# --- Generador de los 8 fotogramas secuenciales ---

def generate_frame_0_idle():
    """Frame 0: idle - Encorvado, atento, arco en mano izquierda en reposo vertical."""
    img = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))

    # Posiciones clave
    hx, hy = 34, 13
    sx, sy = 34, 17
    hips = (36, 29)

    # 1. Carcaj a la espalda
    draw_quiver(img, 39, 15, angle_deg=35, arrows_count=3)

    # 2. Pierna trasera
    draw_archer_leg(img, (38, 29), (41, 41), (42, GROUND_Y), is_front=False)

    # 3. Torso y faldón
    draw_archer_torso(img, sx, sy, length=11, lean=2)
    draw_archer_skirt(img, hips[0], hips[1], width=9, length=8, sway=1)

    # 4. Pierna delantera
    draw_archer_leg(img, (34, 29), (32, 41), (30, GROUND_Y), is_front=True)

    # 5. Brazo derecho en reposo
    draw_archer_arm(img, (38, 19), (42, 26), (40, 33), is_front=False)

    # 6. Cabeza
    draw_archer_skull(img, hx, hy, tilt=0, eye_flare=False, facing=-1)

    # 7. Brazo izquierdo sosteniendo el arco
    draw_archer_arm(img, (32, 19), (28, 27), (24, 32), is_front=True)

    # 8. Arco recurvo en mano izquierda
    draw_recurve_bow(img, (24, 32), (23, 14), (22, 48), drawn=False)

    return img

def generate_frame_1_walk1():
    """Frame 1: walk_1 - Paso de retroceso / reposicionamiento 1 (pie delantero elevado)."""
    img = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))

    hx, hy = 35, 12
    sx, sy = 35, 16
    hips = (37, 28)

    draw_quiver(img, 40, 14, angle_deg=38, arrows_count=3)

    # Pierna trasera apoyada firmemente en el suelo
    draw_archer_leg(img, (39, 28), (42, 41), (43, GROUND_Y), is_front=False)

    draw_archer_torso(img, sx, sy, length=11, lean=3)
    draw_archer_skirt(img, hips[0], hips[1], width=9, length=8, sway=2)

    # Pierna delantera levantada en zancada
    draw_archer_leg(img, (35, 28), (32, 39), (29, 49), is_front=True)

    draw_archer_arm(img, (39, 18), (43, 25), (42, 32), is_front=False)
    draw_archer_skull(img, hx, hy, tilt=0, eye_flare=False, facing=-1)

    draw_archer_arm(img, (33, 18), (28, 25), (23, 30), is_front=True)
    draw_recurve_bow(img, (23, 30), (20, 12), (21, 46), drawn=False)

    return img

def generate_frame_2_walk2():
    """Frame 2: walk_2 - Paso de reposicionamiento 2 (pie delantero apoyado, trasero empuja)."""
    img = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))

    hx, hy = 33, 13
    sx, sy = 33, 17
    hips = (35, 29)

    draw_quiver(img, 38, 15, angle_deg=32, arrows_count=3)

    # Pierna trasera extendida hacia atrás
    draw_archer_leg(img, (37, 29), (41, 42), (44, GROUND_Y), is_front=False)

    draw_archer_torso(img, sx, sy, length=11, lean=1)
    draw_archer_skirt(img, hips[0], hips[1], width=9, length=8, sway=0)

    # Pierna delantera plantada
    draw_archer_leg(img, (33, 29), (30, 41), (28, GROUND_Y), is_front=True)

    draw_archer_arm(img, (37, 19), (40, 26), (38, 33), is_front=False)
    draw_archer_skull(img, hx, hy, tilt=0, eye_flare=False, facing=-1)

    draw_archer_arm(img, (31, 19), (26, 26), (22, 32), is_front=True)
    draw_recurve_bow(img, (22, 32), (22, 14), (20, 48), drawn=False)

    return img

def generate_frame_3_aim():
    """Frame 3: aim - Tensado completo hacia la izquierda, flecha nockeada y fulgor amatista brillante."""
    img = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))

    hx, hy = 36, 14
    sx, sy = 36, 18
    hips = (37, 30)

    # Carcaj a la espalda
    draw_quiver(img, 41, 16, angle_deg=45, arrows_count=2)

    # Pierna trasera bien afirmada hacia la derecha
    draw_archer_leg(img, (40, 30), (45, 42), (47, GROUND_Y), is_front=False)

    draw_archer_torso(img, sx, sy, length=11, lean=1)
    draw_archer_skirt(img, hips[0], hips[1], width=10, length=8, sway=1)

    # Pierna delantera afirmada hacia adelante
    draw_archer_leg(img, (35, 30), (30, 42), (26, GROUND_Y), is_front=True)

    # Cabeza con telegraph amatista intenso
    draw_archer_skull(img, hx, hy, tilt=0, eye_flare=True, facing=-1)

    # Brazo derecho tensando la cuerda contra la mejilla
    draw_archer_arm(img, (40, 19), (47, 18), (37, 21), is_front=False)

    # Brazo izquierdo extendido sosteniendo el arco horizontalizado
    draw_archer_arm(img, (33, 19), (25, 20), (17, 21), is_front=True)

    # Arco recurvo tensado con flecha nockeada
    draw_recurve_bow(
        img,
        grip=(17, 21),
        upper_tip=(24, 7),
        lower_tip=(24, 35),
        drawn=True,
        draw_hand=(37, 21),
        nocked_arrow=True,
    )

    return img

def generate_frame_4_shoot():
    """Frame 4: shoot - Suelta explosiva de la cuerda, retroceso elástico del arco y brazo hacia atrás."""
    img = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))

    hx, hy = 35, 14
    sx, sy = 35, 18
    hips = (37, 30)

    draw_quiver(img, 40, 16, angle_deg=40, arrows_count=2)

    # Pierna trasera
    draw_archer_leg(img, (39, 30), (44, 42), (46, GROUND_Y), is_front=False)

    draw_archer_torso(img, sx, sy, length=11, lean=2)
    draw_archer_skirt(img, hips[0], hips[1], width=9, length=8, sway=2)

    # Pierna delantera
    draw_archer_leg(img, (34, 30), (29, 42), (26, GROUND_Y), is_front=True)

    draw_archer_skull(img, hx, hy, tilt=0, eye_flare=False, facing=-1)

    # Brazo derecho liberado hacia atrás por el retroceso de la suelta
    draw_archer_arm(img, (39, 19), (47, 20), (48, 24), is_front=False)

    # Brazo izquierdo extendido
    draw_archer_arm(img, (32, 19), (24, 20), (16, 21), is_front=True)

    # Arco recurvo liberado (cuerda vibrando recta)
    draw_recurve_bow(
        img,
        grip=(16, 21),
        upper_tip=(18, 5),
        lower_tip=(18, 37),
        drawn=False,
    )

    # Destello de salida de la flecha en la empuñadura
    pset(img, 13, 21, C_GLOW_LILAC)
    pset(img, 12, 21, C_GLOW_VIOLET)

    return img

def generate_frame_5_hurt():
    """Frame 5: hurt - Impacto violento de las Cuchillas del Caos, torso arqueado hacia atrás."""
    img = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))

    hx, hy = 43, 11
    sx, sy = 39, 16
    hips = (33, 29)

    # Carcaj descolocado por el impacto
    draw_quiver(img, 44, 15, angle_deg=60, arrows_count=1)

    # Pierna trasera flexionada por el impacto
    draw_archer_leg(img, (35, 29), (38, 41), (39, GROUND_Y), is_front=False)

    # Torso arqueado violentamente hacia atrás
    draw_archer_torso(img, sx, sy, length=12, lean=-5)
    draw_archer_skirt(img, hips[0], hips[1], width=10, length=8, sway=-3)

    # Pierna delantera patinando
    draw_archer_leg(img, (31, 29), (27, 41), (25, GROUND_Y), is_front=True)

    # Cabeza echada hacia atrás con mandíbula abierta de dolor
    draw_archer_skull(img, hx, hy, tilt=3, eye_flare=False, jaw_open=2, facing=-1)

    # Brazo derecho lanzado hacia atrás
    draw_archer_arm(img, (41, 18), (48, 20), (49, 27), is_front=False)

    # Brazo izquierdo con el arco desestabilizado
    draw_archer_arm(img, (35, 18), (28, 23), (22, 28), is_front=True)
    draw_recurve_bow(img, (22, 28), (22, 10), (18, 44), drawn=False)

    return img

def generate_frame_6_juggle():
    """Frame 6: juggle - Suspensión ingrávida en el aire por Ascensión (bbox[3] <= 46)."""
    img = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))

    # Elevado en el aire con centro en y ~ 20..25
    hx, hy = 26, 14
    sx, sy = 31, 18
    hips = (37, 24)

    # Carcaj flotando
    draw_quiver(img, 36, 14, angle_deg=-15, arrows_count=2)

    # Pierna trasera flotando hacia arriba a la derecha (máximo y <= 45)
    draw_archer_leg(img, (38, 24), (43, 31), (46, 39), is_front=False)

    draw_archer_torso(img, sx, sy, length=9, lean=5)
    draw_archer_skirt(img, hips[0], hips[1], width=8, length=7, sway=4)

    # Pierna delantera flotando
    draw_archer_leg(img, (35, 24), (38, 33), (40, 43), is_front=True)

    draw_archer_skull(img, hx, hy, tilt=-2, eye_flare=False, jaw_open=1, facing=-1)

    draw_archer_arm(img, (33, 17), (37, 13), (41, 11), is_front=False)

    # Brazo izquierdo soltando el arco en el aire
    draw_archer_arm(img, (29, 18), (23, 23), (19, 28), is_front=True)
    draw_recurve_bow(img, (19, 28), (14, 15), (20, 42), drawn=False)

    return img

def generate_frame_7_death():
    """Frame 7: death - Desmoronamiento cadavérico sobre la cubierta con arco quebrado."""
    img = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))

    floor_y = GROUND_Y

    # 1. Fragmentos del arco quebrado
    # Pala izquierda rota apoyada en el suelo
    seg(img, 12, floor_y - 2, 18, floor_y - 5, C_DARK, 2)
    seg(img, 12, floor_y - 2, 18, floor_y - 5, C_WOOD_DK, 1)
    pset(img, 11, floor_y - 1, C_BRONZE)
    # Empuñadura quebrada
    rect(img, 19, floor_y - 4, 3, 3, C_DARK)
    pset(img, 20, floor_y - 3, C_LEATHER)

    # Pala derecha partida en dos
    seg(img, 45, floor_y - 4, 52, floor_y, C_DARK, 2)
    seg(img, 45, floor_y - 4, 52, floor_y, C_WOOD_HI, 1)
    pset(img, 53, floor_y, C_BRONZE)

    # Cuerda rota en el suelo
    seg(img, 13, floor_y, 22, floor_y, C_BONE_HI, 1)

    # 2. Carcaj aplastado y flechas rotas
    rect(img, 36, floor_y - 3, 7, 3, C_DARK)
    rect(img, 37, floor_y - 2, 5, 2, C_LEATHER)
    seg(img, 42, floor_y - 2, 47, floor_y - 1, C_WOOD_HI, 1)
    pset(img, 48, floor_y - 1, C_TUNIC_DK)

    # 3. Calavera caída en las tablas
    rect(img, 22, floor_y - 6, 7, 5, C_DARK)
    rect(img, 23, floor_y - 6, 5, 4, C_BONE_HI)
    rect(img, 23, floor_y - 3, 5, 2, C_BONE_LO)
    # Diadema desprendida
    rect(img, 23, floor_y - 4, 5, 1, C_LEATHER)
    pset(img, 25, floor_y - 4, C_BRONZE)
    # Cuenca ocular con leve rescoldo amatista apagándose
    rect(img, 24, floor_y - 3, 3, 2, C_DARK)
    pset(img, 25, floor_y - 3, C_GLOW_VIOLET)
    # Dientes dispersos
    pset(img, 28, floor_y - 1, C_BONE_HI)
    pset(img, 29, floor_y - 1, C_BONE_LO)

    # 4. Costillas y columna colapsadas
    rect(img, 30, floor_y - 4, 8, 4, C_DARK)
    pset(img, 31, floor_y - 3, C_BONE_HI)
    pset(img, 32, floor_y - 4, C_BONE_LO)
    pset(img, 34, floor_y - 3, C_BONE_HI)
    pset(img, 36, floor_y - 4, C_BONE_LO)

    # Faldón andrajoso desparramado
    rect(img, 33, floor_y - 2, 9, 2, C_TUNIC_DK)
    pset(img, 35, floor_y - 2, C_TUNIC_HI)
    pset(img, 38, floor_y - 2, C_BRONZE)

    # 5. Huesos de las piernas extendidos
    seg(img, 37, floor_y - 1, 46, floor_y, C_DARK, 2)
    seg(img, 37, floor_y - 1, 46, floor_y, C_BONE_LO, 1)
    pset(img, 46, floor_y, C_BONE_HI)
    pset(img, 47, floor_y, C_BONE_LO)

    return img


# --- Generador del Proyectil Flecha (16x8 px) ---

def generate_arrow_projectile():
    """Genera el sprite del proyectil de flecha (16x8 px) orientado a la izquierda."""
    img = Image.new("RGBA", (16, 8), (0, 0, 0, 0))

    # Y central del asta = 3, 4
    # 1. Punta de bronce / hierro (bodkin griego afilado) orientada a la izquierda
    # x = 0: vértice punzante
    pset(img, 0, 3, C_BRONZE)
    pset(img, 0, 4, C_BRONZE)

    # x = 1..3: ensanche y barbas
    rect(img, 1, 2, 3, 4, C_DARK)
    pset(img, 1, 3, C_BRONZE)
    pset(img, 1, 4, C_BRONZE)
    pset(img, 2, 3, C_BRONZE)
    pset(img, 2, 4, C_WOOD_HI)
    pset(img, 3, 3, C_BRONZE)
    pset(img, 3, 4, C_WOOD_DK)

    # 2. Asta de madera de fresno (x = 4..11)
    for x in range(4, 12):
        pset(img, x, 2, C_DARK)
        pset(img, x, 3, C_WOOD_HI)
        pset(img, x, 4, C_WOOD_DK)
        pset(img, x, 5, C_DARK)

    # 3. Emplumado de cuervo (x = 12..15)
    # Aletas superior e inferior
    for x in range(12, 16):
        # Aleta superior (y = 1, 2)
        pset(img, x, 1, C_DARK)
        pset(img, x, 2, C_TUNIC_HI if x % 2 == 0 else C_TUNIC_DK)
        # Asta central
        pset(img, x, 3, C_WOOD_HI)
        pset(img, x, 4, C_WOOD_DK)
        # Aleta inferior (y = 5, 6)
        pset(img, x, 5, C_TUNIC_DK if x % 2 == 0 else C_TUNIC_HI)
        pset(img, x, 6, C_DARK)

    # Culatín / muesca (x = 15)
    pset(img, 15, 3, C_DARK)
    pset(img, 15, 4, C_DARK)

    return img


# --- Ensamblado y Validación ---

def build_spritesheet():
    """Genera y concatena los 8 fotogramas secuenciales."""
    frame_builders = [
        generate_frame_0_idle,
        generate_frame_1_walk1,
        generate_frame_2_walk2,
        generate_frame_3_aim,
        generate_frame_4_shoot,
        generate_frame_5_hurt,
        generate_frame_6_juggle,
        generate_frame_7_death,
    ]

    sheet = Image.new("RGBA", (FRAME_W * NUM_FRAMES, FRAME_H), (0, 0, 0, 0))
    frames = []

    for idx, builder in enumerate(frame_builders):
        frame = builder()
        sheet.paste(frame, (idx * FRAME_W, 0), frame)
        frames.append(frame)

    return sheet, frames

def validate_palette(img):
    """Verifica que la imagen use estrictamente la paleta contenida (máximo 12 colores)."""
    colors = set()
    for y in range(img.height):
        for x in range(img.width):
            r, g, b, a = img.getpixel((x, y))
            assert a in (0, 255), f"Canal alfa no binario en ({x},{y}): a={a}"
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
    print("=== Generando Arquero No-Muerto (Undead Archer) ===")
    sheet, frames = build_spritesheet()

    used_colors = validate_palette(sheet)
    print(f"Paleta validada: {len(used_colors)} colores usados (máximo 12)")
    print(f"Dimensiones de la hoja de sprites: {sheet.size} (esperado: 512x54)")

    os.makedirs(os.path.dirname(OUT_SPRITESHEET), exist_ok=True)
    sheet.save(OUT_SPRITESHEET)
    print(f"Hoja de sprites guardada en: {OUT_SPRITESHEET}")

    # Proyectil de flecha
    arrow = generate_arrow_projectile()
    arrow_colors = validate_palette(arrow)
    print(f"Dimensiones de la flecha: {arrow.size} (esperado: 16x8), colores={len(arrow_colors)}")
    os.makedirs(os.path.dirname(OUT_ARROW), exist_ok=True)
    arrow.save(OUT_ARROW)
    print(f"Proyectil guardado en: {OUT_ARROW}")

    # Hoja de contacto 2x
    contact = build_contact_sheet(frames)
    os.makedirs(os.path.dirname(OUT_CONTACT), exist_ok=True)
    contact.save(OUT_CONTACT)
    print(f"Hoja de contacto 2x guardada en: {OUT_CONTACT} ({contact.size})")

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
