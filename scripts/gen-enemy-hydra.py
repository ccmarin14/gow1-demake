#!/usr/bin/env python3
"""Generador de sprites para la Hidra de Lerna (God of War 1 PS2 lore).

Primer gran jefe a escala monumental en el Mar Egeo y el navío ateniense:
- Monstruo serpentino reptiliano de proporciones titánicas.
- Cuello anillado con escamas abisales verde azuladas (#0f1d21, #162e34, #22444d, #32616d, #4d8493).
- Fauces carnosas con garganta carmesí (#450a0a, #7f1d1d, #b91c1c, #ef4444).
- Colmillos y cuernos curvados de marfil (#9ca3af, #d1d5db, #f3f4f6).
- Ojos y fulgor del rugido con fuego ámbar y oro (#ea580c, #facc15).
- 8 fotogramas de 128x112 px (hoja de 1024x112 px):
    0: idle_1 (ondulación serena, cabeza erguida en el oleaje)
    1: idle_2 (respiración profunda y bamboleo marino)
    2: roar_telegraph (cuello arqueado, fauces abiertas a 85°, garganta incandescente)
    3: slam_bite (mordisco fulminante contra la cubierta, colmillos clavados en y=111)
    4: sweep (barrido horizontal bajo de cuello y quijadas a ras de cubierta)
    5: hurt (sacudida violenta y retroceso ante impactos de las cadenas)
    6: stagger_vulnerable (cabeza desplomada exhausta en y=111, ventana para combos)
    7: defeat (agonía final y sacudida antes de sumergirse en el Egeo)
- Canal alfa estrictamente binario (0 o 255).
- Paleta contenida: exactamente 14 colores (<= 16).
- Anclaje inferior estricto y = 111 (bbox[3] == 112) en poses 3 (slam) y 6 (stagger).
"""

import math
import os
from PIL import Image, ImageDraw, ImageFont

FRAME_W = 128
FRAME_H = 112
NUM_FRAMES = 8
GROUND_Y = 111  # Fila inferior de cubierta (y = 111 -> bbox[3] == 112)

# Paleta estricta de 14 colores (<= 16 colores)
# 1. Escamas serpentinas abisales (5 tonos)
C_ABYSS_DK    = (15, 29, 33)    # 1. #0f1d21 - Contorno profundo y sombras
C_ABYSS_MD    = (22, 46, 52)    # 2. #162e34 - Base oscura de escamas / vientre
C_SCALE_DK    = (34, 68, 77)    # 3. #22444d - Escama media sombra
C_SCALE_MD    = (50, 97, 109)   # 4. #32616d - Escama media luz
C_SCALE_HI    = (77, 132, 147)  # 5. #4d8493 - Brillo dorsal y crestas

# 2. Garganta y fauces carnosas (4 tonos)
C_MAW_DEEP    = (69, 10, 10)    # 6. #450a0a - Sombra profunda interior de garganta
C_MAW_DK      = (127, 29, 29)   # 7. #7f1d1d - Tejido carnoso oscuro / encías
C_MAW_MD      = (185, 28, 28)   # 8. #b91c1c - Lengua / fauces carmesí
C_MAW_HI      = (239, 68, 68)   # 9. #ef4444 - Resplandor carmesí / sangre / fuego

# 3. Colmillos y crestas óseas (3 tonos)
C_FANG_DK     = (156, 163, 175) # 10. #9ca3af - Sombra de marfil / base de cuernos
C_FANG_MD     = (209, 213, 219) # 11. #d1d5db - Marfil medio
C_FANG_HI     = (243, 244, 246) # 12. #f3f4f6 - Punta afilada de colmillo / destello blanco

# 4. Ojos y fulgor del rugido (2 tonos)
C_GLOW_ORANGE = (234, 88, 12)   # 13. #ea580c - Ámbar ígneo / borde de ojo / aura
C_GLOW_GOLD   = (250, 204, 21)  # 14. #facc15 - Oro incandescente / pupila / núcleo telegraph

PALETTE = [
    C_ABYSS_DK, C_ABYSS_MD, C_SCALE_DK, C_SCALE_MD, C_SCALE_HI,
    C_MAW_DEEP, C_MAW_DK, C_MAW_MD, C_MAW_HI,
    C_FANG_DK, C_FANG_MD, C_FANG_HI,
    C_GLOW_ORANGE, C_GLOW_GOLD
]
assert len(PALETTE) == 14, f"La paleta debe tener exactamente 14 colores, tiene {len(PALETTE)}"

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_SPRITESHEET = os.path.join(ROOT_DIR, "public", "assets", "characters", "hydra.png")
OUT_CONTACT = os.path.join(ROOT_DIR, "docs", "referencias", "hydra-contact-sheet.png")
KRATOS_IDLE = os.path.join(ROOT_DIR, "public", "assets", "characters", "kratos-idle.png")

FRAME_NAMES = [
    "0_idle_1",
    "1_idle_2",
    "2_roar_telegraph",
    "3_slam_bite",
    "4_sweep",
    "5_hurt",
    "6_stagger_vulnerable",
    "7_defeat",
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
    hw = width / 2.0
    for i in range(steps + 1):
        t = i / float(steps)
        cx = x0 + dx * t
        cy = y0 + dy * t
        if width <= 1:
            pset(img, cx, cy, color)
        else:
            rect(img, cx - hw, cy - hw, width, width, color)

def fill_poly(img, pts, color):
    """Rellena un polígono convexo/simple con píxeles sólidos."""
    draw = ImageDraw.Draw(img)
    draw.polygon([(int(round(x)), int(round(y))) for x, y in pts], fill=(*color, 255))

def draw_triangle(img, p0, p1, p2, color):
    """Rellena un triángulo con color plano sólido."""
    fill_poly(img, [p0, p1, p2], color)


# --- Generador de la anatomía de la Hidra ---

def spline_eval(pts, t):
    """Evalúa un punto a lo largo de una polilínea normalizada t in [0, 1]."""
    if t <= 0:
        return pts[0]
    if t >= 1:
        return pts[-1]
    seg_lengths = []
    total_len = 0.0
    for i in range(len(pts) - 1):
        dx = pts[i + 1][0] - pts[i][0]
        dy = pts[i + 1][1] - pts[i][1]
        l = math.hypot(dx, dy)
        seg_lengths.append(l)
        total_len += l
    if total_len == 0:
        return pts[0]
    target_dist = t * total_len
    acc = 0.0
    for i, l in enumerate(seg_lengths):
        if acc + l >= target_dist or i == len(seg_lengths) - 1:
            local_t = (target_dist - acc) / l if l > 0 else 0
            x = pts[i][0] + (pts[i + 1][0] - pts[i][0]) * local_t
            y = pts[i][1] + (pts[i + 1][1] - pts[i][1]) * local_t
            return (x, y)
        acc += l
    return pts[-1]

def draw_serpentine_neck(img, control_pts, widths, num_samples=35, dorsal_spines=True, spine_phase=0):
    """Dibuja el cuello serpentino abisal con capas concéntricas de escamas y crestas dorsales."""
    # 1. Muestrear columna vertebral y normales
    spine_samples = []
    normals = []
    for i in range(num_samples):
        t = i / float(num_samples - 1)
        pt = spline_eval(control_pts, t)
        spine_samples.append(pt)

    for i in range(num_samples):
        if i == 0:
            dx = spine_samples[1][0] - spine_samples[0][0]
            dy = spine_samples[1][1] - spine_samples[0][1]
        elif i == num_samples - 1:
            dx = spine_samples[-1][0] - spine_samples[-2][0]
            dy = spine_samples[-1][1] - spine_samples[-2][1]
        else:
            dx = spine_samples[i + 1][0] - spine_samples[i - 1][0]
            dy = spine_samples[i + 1][1] - spine_samples[i - 1][1]
        l = math.hypot(dx, dy)
        if l == 0:
            normals.append((0, -1))
        else:
            # Normal perpendicular hacia la cresta dorsal (lado superior/derecho)
            normals.append((-dy / l, dx / l))

    # Anchos interpolados
    w_samples = []
    for i in range(num_samples):
        t = i / float(num_samples - 1)
        w = widths[0] + (widths[1] - widths[0]) * t
        w_samples.append(w)

    # 2. Dibujar contorno exterior oscuro profundo
    for i in range(num_samples - 1):
        p0 = spine_samples[i]
        p1 = spine_samples[i + 1]
        n0 = normals[i]
        n1 = normals[i + 1]
        w0 = w_samples[i] + 1.5
        w1 = w_samples[i + 1] + 1.5

        d0 = (p0[0] + n0[0] * w0, p0[1] + n0[1] * w0)
        d1 = (p1[0] + n1[0] * w1, p1[1] + n1[1] * w1)
        v0 = (p0[0] - n0[0] * w0, p0[1] - n0[1] * w0)
        v1 = (p1[0] - n1[0] * w1, p1[1] - n1[1] * w1)

        fill_poly(img, [d0, d1, v1, v0], C_ABYSS_DK)

    # 3. Dibujar masa muscular ventral/interior (vientre abisal oscuro)
    for i in range(num_samples - 1):
        p0 = spine_samples[i]
        p1 = spine_samples[i + 1]
        n0 = normals[i]
        n1 = normals[i + 1]
        w0 = w_samples[i]
        w1 = w_samples[i + 1]

        c0 = (p0[0] + n0[0] * (w0 * 0.1), p0[1] + n0[1] * (w0 * 0.1))
        c1 = (p1[0] + n1[0] * (w1 * 0.1), p1[1] + n1[1] * (w1 * 0.1))
        v0 = (p0[0] - n0[0] * w0, p0[1] - n0[1] * w0)
        v1 = (p1[0] - n1[0] * w1, p1[1] - n1[1] * w1)

        fill_poly(img, [c0, c1, v1, v0], C_ABYSS_MD)

    # 4. Dibujar masa muscular dorsal (escamas intermedias verdosas)
    for i in range(num_samples - 1):
        p0 = spine_samples[i]
        p1 = spine_samples[i + 1]
        n0 = normals[i]
        n1 = normals[i + 1]
        w0 = w_samples[i]
        w1 = w_samples[i + 1]

        d0 = (p0[0] + n0[0] * w0, p0[1] + n0[1] * w0)
        d1 = (p1[0] + n1[0] * w1, p1[1] + n1[1] * w1)
        c0 = (p0[0] + n0[0] * (w0 * 0.1), p0[1] + n0[1] * (w0 * 0.1))
        c1 = (p1[0] + n1[0] * (w1 * 0.1), p1[1] + n1[1] * (w1 * 0.1))

        fill_poly(img, [d0, d1, c1, c0], C_SCALE_DK)

    # 5. Franja de luz en el lomo superior
    for i in range(num_samples - 1):
        p0 = spine_samples[i]
        p1 = spine_samples[i + 1]
        n0 = normals[i]
        n1 = normals[i + 1]
        w0 = w_samples[i]
        w1 = w_samples[i + 1]

        h0_a = (p0[0] + n0[0] * (w0 * 0.95), p0[1] + n0[1] * (w0 * 0.95))
        h1_a = (p1[0] + n1[0] * (w1 * 0.95), p1[1] + n1[1] * (w1 * 0.95))
        h0_b = (p0[0] + n0[0] * (w0 * 0.55), p0[1] + n0[1] * (w0 * 0.55))
        h1_b = (p1[0] + n1[0] * (w1 * 0.55), p1[1] + n1[1] * (w1 * 0.55))

        fill_poly(img, [h0_a, h1_a, h1_b, h0_b], C_SCALE_MD)

    # 6. Costillas/anillos de escamas transversales (textura segmentada)
    for i in range(2, num_samples - 2, 3):
        p = spine_samples[i]
        n = normals[i]
        w = w_samples[i]
        # Línea de segmento
        p_dorsal = (p[0] + n[0] * (w * 0.85), p[1] + n[1] * (w * 0.85))
        p_ventral = (p[0] - n[0] * (w * 0.85), p[1] - n[1] * (w * 0.85))
        seg(img, p_dorsal[0], p_dorsal[1], p_ventral[0], p_ventral[1], C_ABYSS_DK, width=1)
        # Resalte de brillo en la cresta de la placa
        p_hi1 = (p[0] + n[0] * (w * 0.8), p[1] + n[1] * (w * 0.8))
        p_hi2 = (p[0] + n[0] * (w * 0.6), p[1] + n[1] * (w * 0.6))
        seg(img, p_hi1[0], p_hi1[1], p_hi2[0], p_hi2[1], C_SCALE_HI, width=1)

    # 7. Espinas dorsales a lo largo de la columna (púas curvadas hacia atrás)
    if dorsal_spines:
        spine_indices = range(3, num_samples - 3, 4)
        for idx in spine_indices:
            p = spine_samples[idx]
            n = normals[idx]
            w = w_samples[idx]

            base_pt = (p[0] + n[0] * (w * 0.95), p[1] + n[1] * (w * 0.95))
            # Vector tangente hacia atrás
            p_next = spine_samples[max(0, idx - 2)]
            tx = p_next[0] - p[0]
            ty = p_next[1] - p[1]
            tl = math.hypot(tx, ty)
            if tl > 0:
                tx /= tl
                ty /= tl
            else:
                tx, ty = (0, 0)

            spine_len = 7 + (idx % 3) * 3
            tip_x = base_pt[0] + n[0] * spine_len + tx * 4
            tip_y = base_pt[1] + n[1] * spine_len + ty * 4

            # Base ancha de la espina
            base_left = (base_pt[0] - tx * 3, base_pt[1] - ty * 3)
            base_right = (base_pt[0] + tx * 3, base_pt[1] + ty * 3)

            # Contorno de la púa
            draw_triangle(img, (tip_x, tip_y), base_left, base_right, C_ABYSS_DK)
            # Relleno de marfil
            draw_triangle(img, (tip_x, tip_y), (base_pt[0] - tx * 1.5, base_pt[1] - ty * 1.5),
                          (base_pt[0] + tx * 1.5, base_pt[1] + ty * 1.5), C_FANG_MD)
            # Punta afilada brillante
            pset(img, tip_x, tip_y, C_FANG_HI)
            pset(img, tip_x - tx * 0.8, tip_y - ty * 0.8, C_FANG_HI)


def draw_fang(img, root_x, root_y, tip_x, tip_y, thickness=3):
    """Dibuja un colmillo curvado de marfil con punta afilada y sombreado."""
    dx = tip_x - root_x
    dy = tip_y - root_y
    # Contorno oscuro en la base
    seg(img, root_x - 1, root_y, tip_x, tip_y, C_ABYSS_DK, width=thickness + 1)
    # Cuerpo de marfil
    seg(img, root_x, root_y, tip_x, tip_y, C_FANG_MD, width=thickness)
    # Luz y punta blanca brillante
    seg(img, root_x + 0.5, root_y, tip_x, tip_y, C_FANG_HI, width=1)
    pset(img, tip_x, tip_y, C_FANG_HI)


def draw_hydra_head(img, hx, hy, angle_rad, jaw_open_angle,
                    roar_glow=False, hurt=False, stagger=False, defeat=False):
    """Dibuja la cabeza y fauces de la Hidra con mandíbula articulada, ojos y colmillos."""
    cos_a = math.cos(angle_rad)
    sin_a = math.sin(angle_rad)

    def to_global(lx, ly):
        """Convierte coordenadas locales de la cabeza (origen en articulación craneal) a globales."""
        gx = hx + lx * cos_a - ly * sin_a
        gy = hy + lx * sin_a + ly * cos_a
        return (gx, gy)

    # 1. Cuernos craneales traseros (crestas óseas prominentes)
    # Cuerno superior mayor
    horn1_base = to_global(8, -10)
    horn1_mid  = to_global(22, -18)
    horn1_tip  = to_global(34, -22)
    seg(img, horn1_base[0], horn1_base[1], horn1_mid[0], horn1_mid[1], C_ABYSS_DK, width=5)
    seg(img, horn1_mid[0], horn1_mid[1], horn1_tip[0], horn1_tip[1], C_ABYSS_DK, width=3)
    seg(img, horn1_base[0], horn1_base[1], horn1_mid[0], horn1_mid[1], C_FANG_DK, width=4)
    seg(img, horn1_mid[0], horn1_mid[1], horn1_tip[0], horn1_tip[1], C_FANG_MD, width=2)
    pset(img, horn1_tip[0], horn1_tip[1], C_FANG_HI)

    # Cuerno inferior menor
    horn2_base = to_global(12, -4)
    horn2_tip  = to_global(26, -10)
    seg(img, horn2_base[0], horn2_base[1], horn2_tip[0], horn2_tip[1], C_ABYSS_DK, width=3)
    seg(img, horn2_base[0], horn2_base[1], horn2_tip[0], horn2_tip[1], C_FANG_MD, width=2)
    pset(img, horn2_tip[0], horn2_tip[1], C_FANG_HI)

    # 2. Cavidad interior de la boca (fauces carnosas abiertas)
    jaw_cos = math.cos(angle_rad + jaw_open_angle)
    jaw_sin = math.sin(angle_rad + jaw_open_angle)

    def to_jaw(lx, ly):
        gx = hx + lx * jaw_cos - ly * jaw_sin
        gy = hy + lx * jaw_sin + ly * jaw_cos
        return (gx, gy)

    if jaw_open_angle > 0.08:
        # Triángulo de cavidad bucal
        throat_root = to_global(2, -2)
        palate_pt   = to_global(-22, -3)
        jaw_floor   = to_jaw(-20, 2)
        throat_deep = to_global(8, 0)

        # Relleno oscuro de garganta
        fill_poly(img, [throat_deep, palate_pt, jaw_floor], C_MAW_DEEP)
        fill_poly(img, [throat_root, palate_pt, to_jaw(-14, 2)], C_MAW_DK)

        # Lengua viperina bifurcada
        t_base = to_jaw(-6, 2)
        t_mid  = to_jaw(-18, 1)
        t_fork1 = to_jaw(-26, -1)
        t_fork2 = to_jaw(-25, 4)
        seg(img, t_base[0], t_base[1], t_mid[0], t_mid[1], C_MAW_MD, width=2)
        seg(img, t_mid[0], t_mid[1], t_fork1[0], t_fork1[1], C_MAW_HI, width=1)
        seg(img, t_mid[0], t_mid[1], t_fork2[0], t_fork2[1], C_MAW_HI, width=1)

        # Si ruge / telegraph: resplandor incandescente en la garganta
        if roar_glow:
            core_pt = to_global(0, -1)
            # Resplandor exterior carmesí / ámbar
            fill_poly(img, [to_global(4, -3), to_global(-12, -4), to_jaw(-10, 4), to_global(4, 3)], C_MAW_HI)
            fill_poly(img, [to_global(2, -2), to_global(-8, -3), to_jaw(-6, 3), to_global(2, 2)], C_GLOW_ORANGE)
            fill_poly(img, [core_pt, to_global(-4, -1), to_jaw(-3, 1)], C_GLOW_GOLD)
            pset(img, core_pt[0], core_pt[1], C_GLOW_GOLD)

    # 3. Mandíbula inferior (articulada hacia abajo)
    jaw_pts = [
        to_jaw(4, 0),        # Articulación
        to_jaw(2, 6),        # Ángulo mandibular
        to_jaw(-16, 7),      # Borde inferior del mentón
        to_jaw(-28, 5),      # Punta del mentón
        to_jaw(-30, 2),      # Extremo anterior
        to_jaw(-28, 0),      # Línea de encía anterior
        to_jaw(-4, 0),       # Encía posterior
    ]
    # Sombra mandibular
    fill_poly(img, jaw_pts, C_ABYSS_DK)
    # Escama media
    jaw_inner = [to_jaw(2, 2), to_jaw(0, 5), to_jaw(-16, 5), to_jaw(-26, 4), to_jaw(-26, 2), to_jaw(-4, 1)]
    fill_poly(img, jaw_inner, C_SCALE_DK)

    # Espina en el mentón
    chin_spine_tip = to_jaw(-24, 11)
    draw_triangle(img, chin_spine_tip, to_jaw(-20, 6), to_jaw(-27, 6), C_ABYSS_DK)
    draw_triangle(img, chin_spine_tip, to_jaw(-21, 6), to_jaw(-25, 6), C_FANG_MD)
    pset(img, chin_spine_tip[0], chin_spine_tip[1], C_FANG_HI)

    # Colmillos de la mandíbula inferior (apuntan hacia arriba)
    fang_low1_root = to_jaw(-26, 0)
    fang_low1_tip  = to_jaw(-27, -8)
    draw_fang(img, fang_low1_root[0], fang_low1_root[1], fang_low1_tip[0], fang_low1_tip[1], thickness=2)

    fang_low2_root = to_jaw(-18, 0)
    fang_low2_tip  = to_jaw(-19, -6)
    draw_fang(img, fang_low2_root[0], fang_low2_root[1], fang_low2_tip[0], fang_low2_tip[1], thickness=1)

    fang_low3_root = to_jaw(-10, 0)
    fang_low3_tip  = to_jaw(-10, -4)
    draw_fang(img, fang_low3_root[0], fang_low3_root[1], fang_low3_tip[0], fang_low3_tip[1], thickness=1)

    # 4. Cráneo superior (hocico, frente acorazada, ceja)
    skull_poly = [
        to_global(10, -6),    # Nuca / conexión con cuello
        to_global(4, -14),    # Corona posterior
        to_global(-12, -15),  # Bóveda craneal
        to_global(-22, -12),  # Ceja / cresta supraorbital
        to_global(-34, -7),   # Cuerno nasal / lomo del hocico
        to_global(-40, -4),   # Punta del hocico
        to_global(-40, -1),   # Borde anterior superior
        to_global(-28, -2),   # Línea de encía media
        to_global(-10, -1),   # Encía posterior
        to_global(8, 0),      # Mandíbula superior trasera
    ]
    fill_poly(img, skull_poly, C_ABYSS_DK)

    # Masa de escamas del cráneo
    skull_scales = [
        to_global(8, -7),
        to_global(2, -12),
        to_global(-12, -13),
        to_global(-20, -10),
        to_global(-32, -6),
        to_global(-38, -3),
        to_global(-34, -2),
        to_global(-12, -2),
        to_global(6, -2),
    ]
    fill_poly(img, skull_scales, C_SCALE_DK)

    # Línea carnosa de encías superiores (C_MAW_DK)
    seg(img, to_global(-38, -1)[0], to_global(-38, -1)[1], to_global(-10, -1)[0], to_global(-10, -1)[1], C_MAW_DK, width=1)
    # Encías inferiores (C_MAW_DK)
    seg(img, to_jaw(-28, 0)[0], to_jaw(-28, 0)[1], to_jaw(-8, 0)[0], to_jaw(-8, 0)[1], C_MAW_DK, width=1)

    # Brillo de cresta dorsal en el hocico y frente
    crest_pts = [
        to_global(0, -13),
        to_global(-10, -14),
        to_global(-20, -11),
        to_global(-30, -7),
        to_global(-36, -4),
    ]
    for i in range(len(crest_pts) - 1):
        seg(img, crest_pts[i][0], crest_pts[i][1], crest_pts[i + 1][0], crest_pts[i + 1][1], C_SCALE_HI, width=1)

    # Cuerno nasal pequeño
    nasal_tip = to_global(-33, -11)
    draw_triangle(img, nasal_tip, to_global(-30, -7), to_global(-35, -6), C_ABYSS_DK)
    draw_triangle(img, nasal_tip, to_global(-31, -7), to_global(-34, -6), C_FANG_MD)
    pset(img, nasal_tip[0], nasal_tip[1], C_FANG_HI)

    # 5. Colmillos superiores gigantes (sables curvos hacia abajo)
    # Gran colmillo frontal principal
    fang_up1_root = to_global(-36, -1)
    fang_up1_tip  = to_global(-35, 11)
    draw_fang(img, fang_up1_root[0], fang_up1_root[1], fang_up1_tip[0], fang_up1_tip[1], thickness=3)

    # Segundo colmillo medio
    fang_up2_root = to_global(-26, -1)
    fang_up2_tip  = to_global(-25, 8)
    draw_fang(img, fang_up2_root[0], fang_up2_root[1], fang_up2_tip[0], fang_up2_tip[1], thickness=2)

    # Dientes secundarios serrados
    fang_up3_root = to_global(-18, -1)
    fang_up3_tip  = to_global(-17, 5)
    draw_fang(img, fang_up3_root[0], fang_up3_root[1], fang_up3_tip[0], fang_up3_tip[1], thickness=1)

    fang_up4_root = to_global(-12, -1)
    fang_up4_tip  = to_global(-11, 4)
    draw_fang(img, fang_up4_root[0], fang_up4_root[1], fang_up4_tip[0], fang_up4_tip[1], thickness=1)

    # 6. Ojo reptiliano ardiente
    eye_pos = to_global(-18, -7)
    ex, ey = int(round(eye_pos[0])), int(round(eye_pos[1]))

    if defeat:
        # En derrota: cuenca vacía / apagada
        rect(img, ex - 1, ey - 1, 3, 2, C_ABYSS_DK)
    elif stagger:
        # En stagger: ojo aturdido / débil con cruz
        pset(img, ex, ey, C_GLOW_ORANGE)
        pset(img, ex - 1, ey, C_FANG_DK)
        pset(img, ex + 1, ey, C_FANG_DK)
        pset(img, ex, ey - 1, C_FANG_DK)
        pset(img, ex, ey + 1, C_FANG_DK)
    elif hurt:
        # En dolor: ojo semicerrado / destello rojizo
        pset(img, ex - 1, ey, C_MAW_HI)
        pset(img, ex, ey, C_GLOW_ORANGE)
        pset(img, ex + 1, ey, C_ABYSS_DK)
    else:
        # Ojo feroz vivo: fulgor ámbar y pupila vertical dorada
        rect(img, ex - 2, ey - 1, 5, 3, C_ABYSS_DK)      # Cuenca hundida
        rect(img, ex - 1, ey - 1, 3, 3, C_GLOW_ORANGE)   # Iris ámbar ígneo
        pset(img, ex, ey - 1, C_GLOW_GOLD)               # Pupila vertical oro
        pset(img, ex, ey, C_GLOW_GOLD)
        pset(img, ex, ey + 1, C_GLOW_GOLD)


def draw_water_base(img, center_x, base_y=111, width=32):
    """Dibuja espuma y oleaje donde el cuello emerge del Mar Egeo."""
    half = width // 2
    for x in range(center_x - half, center_x + half):
        # Olas de agua oscura con crestas claras
        wave_h = int(math.sin(x * 0.4) * 2 + 3)
        for y in range(base_y - wave_h, base_y + 1):
            if y == base_y - wave_h:
                pset(img, x, y, C_SCALE_HI)
            elif y == base_y - wave_h + 1:
                pset(img, x, y, C_SCALE_MD)
            else:
                pset(img, x, y, C_ABYSS_MD)


def draw_splinters(img, center_x, base_y=111):
    """Dibuja astillas y grietas en la cubierta de madera tras un impacto fulminante."""
    splinter_pts = [
        (center_x - 14, base_y, center_x - 20, base_y - 4),
        (center_x - 8,  base_y, center_x - 12, base_y - 6),
        (center_x + 6,  base_y, center_x + 10, base_y - 5),
        (center_x + 12, base_y, center_x + 18, base_y - 3),
    ]
    for x0, y0, x1, y1 in splinter_pts:
        seg(img, x0, y0, x1, y1, C_FANG_MD, width=1)
        pset(img, x1, y1, C_FANG_HI)


# --- Generación de los 8 fotogramas canónicos ---

def generate_frame_0_idle_1():
    """Frame 0: idle_1 - ondulación serena en el agua, cabeza erguida, fauces entreabiertas."""
    img = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))

    # Cuello serpentino saliendo del agua en x=102, subiendo a x=62, y=34
    pts = [
        (104, 111),
        (100, 90),
        (88, 66),
        (74, 46),
        (62, 34),
    ]
    draw_serpentine_neck(img, pts, widths=(15, 12), num_samples=30)
    draw_water_base(img, center_x=102, base_y=111, width=34)

    # Cabeza erguida mirando a la izquierda
    draw_hydra_head(img, hx=62, hy=34, angle_rad=math.radians(-5), jaw_open_angle=math.radians(14))

    return img


def generate_frame_1_idle_2():
    """Frame 1: idle_2 - segundo cuadro de respiración orgánica y bamboleo marino."""
    img = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))

    # Cuello desplazado levemente hacia adelante y abajo (ondulación de respiración)
    pts = [
        (102, 111),
        (96, 92),
        (82, 70),
        (68, 50),
        (58, 38),
    ]
    draw_serpentine_neck(img, pts, widths=(16, 12.5), num_samples=30)
    draw_water_base(img, center_x=100, base_y=111, width=36)

    # Cabeza con mandíbula un poco más abierta (exhalando vaho)
    draw_hydra_head(img, hx=58, hy=38, angle_rad=math.radians(0), jaw_open_angle=math.radians(20))

    return img


def generate_frame_2_roar_telegraph():
    """Frame 2: roar_telegraph - cabeza arqueada hacia atrás, mandíbulas abiertas a 85°, garganta incandescente."""
    img = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))

    # Cuello en S tensado hacia atrás (reculando para descargar ataque)
    pts = [
        (106, 111),
        (108, 86),
        (102, 58),
        (88, 36),
        (76, 26),
    ]
    draw_serpentine_neck(img, pts, widths=(17, 13), num_samples=30)
    draw_water_base(img, center_x=106, base_y=111, width=32)

    # Cabeza echada hacia atrás a 35° y mandíbula descolgada a 85° de apertura
    draw_hydra_head(img, hx=76, hy=26, angle_rad=math.radians(35), jaw_open_angle=math.radians(85), roar_glow=True)

    return img


def generate_frame_3_slam_bite():
    """Frame 3: slam_bite - mordisco fulminante contra la cubierta, colmillos clavados al suelo (y = 111)."""
    img = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))

    # Cuello proyectado en diagonal descendente desde la derecha hacia el suelo
    pts = [
        (114, 111),
        (106, 75),
        (88, 55),
        (64, 68),
        (46, 88),
    ]
    draw_serpentine_neck(img, pts, widths=(16, 13), num_samples=30)
    draw_water_base(img, center_x=114, base_y=111, width=28)

    # Cabeza impactando en el suelo a -35° de inclinación con colmillos clavados en las tablas
    # Centro de articulación en hx=46, hy=88; fangs y mentón llegan a y=111
    draw_hydra_head(img, hx=46, hy=88, angle_rad=math.radians(-32), jaw_open_angle=math.radians(6))

    # Píxeles de anclaje estricto y astillas en cubierta y=111
    draw_splinters(img, center_x=26, base_y=GROUND_Y)
    # Colmillos hundidos penetrando el suelo en y=111
    pset(img, 24, GROUND_Y, C_FANG_HI)
    pset(img, 25, GROUND_Y, C_FANG_HI)
    pset(img, 26, GROUND_Y, C_FANG_MD)
    pset(img, 27, GROUND_Y, C_ABYSS_DK)
    pset(img, 28, GROUND_Y, C_ABYSS_DK)

    return img


def generate_frame_4_sweep():
    """Frame 4: sweep - barrido horizontal bajo de cuello y quijadas a ras de suelo."""
    img = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))

    # Cuello estirado horizontalmente bajo sobre la cubierta
    pts = [
        (116, 111),
        (100, 92),
        (76, 82),
        (52, 78),
        (38, 76),
    ]
    draw_serpentine_neck(img, pts, widths=(15, 12), num_samples=30)
    draw_water_base(img, center_x=116, base_y=111, width=26)

    # Cabeza rasando hacia la izquierda, quijadas listas para segar a Kratos
    draw_hydra_head(img, hx=38, hy=76, angle_rad=math.radians(6), jaw_open_angle=math.radians(24))

    return img


def generate_frame_5_hurt():
    """Frame 5: hurt - sacudida violenta y retroceso ante impactos de las cadenas."""
    img = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))

    # Cuello quebrado por el impacto y retroceso
    pts = [
        (104, 111),
        (98, 88),
        (92, 62),
        (82, 42),
        (72, 30),
    ]
    draw_serpentine_neck(img, pts, widths=(16, 12), num_samples=30)
    draw_water_base(img, center_x=104, base_y=111, width=32)

    # Cabeza desencajada, ojos semicerrados en dolor
    draw_hydra_head(img, hx=72, hy=30, angle_rad=math.radians(28), jaw_open_angle=math.radians(38), hurt=True)

    # Chispas / salpicaduras de sangre carmesí
    blood_splashes = [(54, 26), (56, 23), (50, 32), (62, 18), (66, 14), (48, 28)]
    for bx, by in blood_splashes:
        pset(img, bx, by, C_MAW_HI)
        pset(img, bx + 1, by, C_MAW_MD)

    return img


def generate_frame_6_stagger_vulnerable():
    """Frame 6: stagger_vulnerable - cabeza desplomada en la cubierta (y = 111), ojos aturdidos."""
    img = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))

    # Cuello totalmente laxo y vencido descansando sobre el piso
    pts = [
        (116, 111),
        (98, 102),
        (76, 96),
        (56, 94),
        (42, 92),
    ]
    draw_serpentine_neck(img, pts, widths=(15, 12), num_samples=30)
    draw_water_base(img, center_x=116, base_y=111, width=24)

    # Cabeza aplastada contra las tablas en y=111, hocico y mentón vencidos
    draw_hydra_head(img, hx=42, hy=92, angle_rad=math.radians(-14), jaw_open_angle=math.radians(16), stagger=True)

    # Píxeles de apoyo estricto en y=111
    pset(img, 20, GROUND_Y, C_ABYSS_DK)
    pset(img, 21, GROUND_Y, C_ABYSS_DK)
    pset(img, 22, GROUND_Y, C_SCALE_DK)
    pset(img, 23, GROUND_Y, C_SCALE_DK)
    pset(img, 24, GROUND_Y, C_ABYSS_DK)

    return img


def generate_frame_7_defeat():
    """Frame 7: defeat - agonía y espasmo final antes de hundirse en el mar."""
    img = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))

    # Cuello hundiéndose en las olas del Egeo, cuerpo semicubierto de espuma
    pts = [
        (102, 111),
        (94, 94),
        (84, 76),
        (76, 58),
        (66, 46),
    ]
    draw_serpentine_neck(img, pts, widths=(14, 11), num_samples=30)
    # Oleaje violento tragándose el cuerpo
    draw_water_base(img, center_x=100, base_y=111, width=44)
    draw_water_base(img, center_x=86, base_y=105, width=32)

    # Cabeza ladeada inerte, ojos apagados, mandíbula colgando
    draw_hydra_head(img, hx=66, hy=46, angle_rad=math.radians(18), jaw_open_angle=math.radians(45), defeat=True)

    return img


def build_spritesheet():
    """Construye la hoja de sprites completa de 1024x112 px con los 8 fotogramas."""
    generators = [
        generate_frame_0_idle_1,
        generate_frame_1_idle_2,
        generate_frame_2_roar_telegraph,
        generate_frame_3_slam_bite,
        generate_frame_4_sweep,
        generate_frame_5_hurt,
        generate_frame_6_stagger_vulnerable,
        generate_frame_7_defeat,
    ]

    sheet = Image.new("RGBA", (FRAME_W * NUM_FRAMES, FRAME_H), (0, 0, 0, 0))
    frames = []

    for idx, gen_func in enumerate(generators):
        frame = gen_func()
        sheet.paste(frame, (idx * FRAME_W, 0), frame)
        frames.append(frame)

    return sheet, frames


def validate_palette(img):
    """Verifica que la imagen utilice exclusivamente los colores de la paleta definida."""
    colors = set()
    alpha_violations = 0
    for y in range(img.height):
        for x in range(img.width):
            r, g, b, a = img.getpixel((x, y))
            if a not in (0, 255):
                alpha_violations += 1
            if a == 255:
                colors.add((r, g, b))

    assert alpha_violations == 0, f"Se encontraron {alpha_violations} píxeles con alfa no binario"

    palette_set = set(PALETTE)
    unknown = colors - palette_set
    assert not unknown, f"Se encontraron colores fuera de la paleta permitida: {unknown}"
    return colors


def build_contact_sheet(frames):
    """Crea una hoja de contacto enriquecida con los 8 fotogramas, paleta y silueta de Kratos."""
    scale = 2
    padding = 10
    label_h = 24
    cols = 4
    rows = 2
    cell_w = FRAME_W * scale
    cell_h = FRAME_H * scale

    grid_w = padding + cols * (cell_w + padding)
    grid_h = padding + rows * (cell_h + label_h + padding)

    # Panel lateral para paleta de colores y escala de Kratos
    side_panel_w = 240
    total_w = grid_w + side_panel_w
    total_h = grid_h

    contact = Image.new("RGBA", (total_w, total_h), (15, 18, 22, 255))
    draw = ImageDraw.Draw(contact)
    font = ImageFont.load_default()

    # 1. Cuadrícula de fotogramas de la Hidra
    for idx, frame in enumerate(frames):
        c = idx % cols
        r = idx // cols
        x0 = padding + c * (cell_w + padding)
        y0 = padding + r * (cell_h + label_h + padding)

        # Fondo del recuadro
        draw.rectangle([x0 - 1, y0 - 1, x0 + cell_w, y0 + cell_h],
                       outline=(34, 46, 56, 255), fill=(22, 28, 34, 255))

        # Línea de cubierta / suelo
        ground_line_y = y0 + GROUND_Y * scale
        draw.line([(x0, ground_line_y), (x0 + cell_w - 1, ground_line_y)], fill=(65, 45, 30, 255))

        # Sprite de Hidra escalado 2x
        scaled = frame.resize((cell_w, cell_h), Image.NEAREST)
        contact.paste(scaled, (x0, y0), scaled)

        # Etiqueta y métricas
        label = FRAME_NAMES[idx]
        bbox_f = frame.getbbox()
        h_px = bbox_f[3] - bbox_f[1] if bbox_f else 0
        w_px = bbox_f[2] - bbox_f[0] if bbox_f else 0
        info = f"{label} ({w_px}x{h_px})"
        draw.text((x0 + 2, y0 + cell_h + 4), info, fill=(220, 215, 205, 255), font=font)

    # 2. Panel lateral: Título, Paleta y Comparativa de Escala con Kratos
    panel_x = grid_w + 4
    draw.text((panel_x, 14), "GOW 1: LA HIDRA DE LERNA", fill=(250, 204, 21, 255), font=font)
    draw.text((panel_x, 28), "Jefe a Escala Naval (128x112 px)", fill=(180, 195, 205, 255), font=font)

    # Muestras de la paleta de 14 colores
    draw.text((panel_x, 48), "PALETA ESTRICTA (14 COLORES):", fill=(220, 215, 205, 255), font=font)
    swatch_size = 14
    for i, col in enumerate(PALETTE):
        sx = panel_x + (i % 7) * (swatch_size + 4)
        sy = 64 + (i // 7) * (swatch_size + 4)
        draw.rectangle([sx, sy, sx + swatch_size, sy + swatch_size], fill=(*col, 255), outline=(0, 0, 0, 255))

    # Comparativa de escala con Kratos
    draw.text((panel_x, 110), "COMPARATIVA DE ESCALA:", fill=(220, 215, 205, 255), font=font)
    draw.text((panel_x, 124), "Kratos (~50px) vs Hidra (~90px)", fill=(150, 165, 175, 255), font=font)

    # Recuadro para la silueta comparativa
    comp_box_x = panel_x
    comp_box_y = 142
    comp_box_w = side_panel_w - 20
    comp_box_h = 130
    draw.rectangle([comp_box_x, comp_box_y, comp_box_x + comp_box_w, comp_box_y + comp_box_h],
                   outline=(45, 58, 68, 255), fill=(22, 28, 34, 255))

    # Línea de suelo en el recuadro
    comp_ground_y = comp_box_y + comp_box_h - 10
    draw.line([(comp_box_x, comp_ground_y), (comp_box_x + comp_box_w, comp_ground_y)], fill=(65, 45, 30, 255))

    # Dibujar Hidra idle (escala 1x)
    frame_idle = frames[0]
    contact.paste(frame_idle, (comp_box_x + 80, comp_ground_y - GROUND_Y), frame_idle)

    # Cargar y pegar sprite de Kratos (escala 1x)
    if os.path.isfile(KRATOS_IDLE):
        kratos_img = Image.open(KRATOS_IDLE)
        # Kratos frame 0 (ancho de frame ~64 o crop de la primera pose)
        # kratos-idle.png es (194, 59) con 2 fotogramas de 97 px
        kratos_f0 = kratos_img.crop((0, 0, 97, 59))
        kratos_bbox = kratos_f0.getbbox()
        if kratos_bbox:
            # Pegar Kratos anclado al suelo
            kratos_y = comp_ground_y - 54
            contact.paste(kratos_f0, (comp_box_x + 5, kratos_y), kratos_f0)
            draw.text((comp_box_x + 10, comp_box_y + 6), "Kratos", fill=(239, 68, 68, 255), font=font)
            draw.text((comp_box_x + 120, comp_box_y + 6), "Hidra", fill=(250, 204, 21, 255), font=font)

    return contact


def main():
    print("=== Generador de Sprites: La Hidra de Lerna (GOW8B-HYDRA-ART) ===")
    sheet, frames = build_spritesheet()

    used_colors = validate_palette(sheet)
    print(f"Paleta validada: {len(used_colors)} colores usados (exactamente {len(PALETTE)} definidos, <= 16)")
    print(f"Dimensiones de la hoja de sprites: {sheet.size} (esperado: 1024x112)")

    os.makedirs(os.path.dirname(OUT_SPRITESHEET), exist_ok=True)
    sheet.save(OUT_SPRITESHEET)
    print(f"Hoja de sprites guardada en: {OUT_SPRITESHEET}")

    # Hoja de contacto enriquecida
    contact = build_contact_sheet(frames)
    os.makedirs(os.path.dirname(OUT_CONTACT), exist_ok=True)
    contact.save(OUT_CONTACT)
    print(f"Hoja de contacto guardada en: {OUT_CONTACT} ({contact.size})")

    # Resumen de fotogramas y anclajes
    print("\nResumen de fotogramas:")
    for idx, f in enumerate(frames):
        bb = f.getbbox()
        assert bb is not None, f"Frame {idx} ({FRAME_NAMES[idx]}) está vacío"
        h = bb[3] - bb[1]
        w = bb[2] - bb[0]
        grounded = f"Suelo y={bb[3] - 1} (bbox[3]={bb[3]})" if bb[3] == 112 else f"MaxY y={bb[3] - 1}"
        print(f"  Frame {FRAME_NAMES[idx]:<22}: bbox={bb}, w={w:2d}px, h={h:2d}px, {grounded}")

    print("\n¡Generación completada con éxito!")


if __name__ == "__main__":
    main()
