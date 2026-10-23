#!/usr/bin/env python3
"""Generador del Run Cycle (Ciclo de Carrera) de Kratos en Pixel Art 16-bit.

Construye un spritesheet de 9 cuadros (97x59 px cada uno, total 873x59 px):
- Cuadros 0 a 7: Ciclo completo de carrera atlética espartana de 8 cuadros (2 zancadas completas):
  * Cuadro 0: Contacto talón pierna derecha adelante (x~54, y=58), pierna izquierda atrás (x~30, y=54).
  * Cuadro 1: Amortiguación/Squash derecha (rodilla flexionada, torso baja 2 px a y=+2), pierna izquierda flexionando hacia adelante.
  * Cuadro 2: Paso/Passing derecha (pierna derecha sostiene peso a y=58, rodilla izquierda ALTA adelante a y~43).
  * Cuadro 3: Impulso/Apex derecha (pie derecho despega a y=57, cuerpo sube 1 px a y=-1, pierna izquierda extendiendo).
  * Cuadro 4: Contacto talón pierna izquierda adelante (x~54, y=58), pierna derecha atrás (x~30, y=54).
  * Cuadro 5: Amortiguación/Squash izquierda (rodilla flexionada, torso baja 2 px a y=+2), pierna derecha flexionando hacia adelante.
  * Cuadro 6: Paso/Passing izquierda (pierna izquierda sostiene peso a y=58, rodilla derecha ALTA adelante a y~43).
  * Cuadro 7: Impulso/Apex izquierda (pie izquierdo despega a y=57, cuerpo sube 1 px a y=-1, pierna derecha extendiendo).
- Cuadro 8: Frenada y derrape brusco (Skid / Turnaround):
  * Apoyo doble de combate con talones clavados a ras de suelo (y=58), torso inclinado hacia atrás, brazos abiertos en guardia de amenaza con las Cuchillas del Caos.

Invariantes estrictos:
- Ancho cuadro: 97 px, Alto: 59 px.
- 9 cuadros: 873 x 59 px.
- Contacto basal al suelo en cada cuadro: bbox[3] == 59 (píxeles en y=58).
- Canal alfa 100% binario {0, 255}.
- Paleta canónica oficial de 12 colores de fdb066f / KRATOS-ART-UPGRADE-12COL-01.
"""

import os
import sys
from PIL import Image, ImageChops

FRAME_W = 97
FRAME_H = 59
TOTAL_FRAMES = 9
SHEET_W = FRAME_W * TOTAL_FRAMES
SHEET_H = FRAME_H

# Paleta oficial canónica (12 colores)
C_TRANS = (0, 0, 0, 0)
C_BLACK = (27, 0, 26, 255)        # 1. Contorno nítido y perilla
C_DARK = (36, 27, 26, 255)         # 2. Sombra profunda
C_LEATHER_DK = (29, 7, 23, 255)    # 3. Cuero oscuro
C_LEATHER_MD = (60, 45, 39, 255)    # 4. Cuero medio
C_LEATHER_HI = (88, 48, 39, 255)    # 5. Cuero claro / brillo
C_ASH_DK = (88, 72, 65, 255)       # 6. Sombra piel de ceniza
C_BRONZE = (130, 97, 78, 255)      # 7. Hebilla, grebas de bronce y adornos
C_ASH_MD = (159, 141, 124, 255)    # 8. Piel espartana media
C_TATTOO = (176, 48, 40, 255)      # 9. Tatuaje carmesí puro de Ares
C_TATTOO_DK = (61, 22, 41, 255)    # 10. Sombra del tatuaje
C_ASH_HI = (193, 184, 172, 255)    # 11. Brillos musculares y piel clara
C_FIRE = (255, 140, 26, 255)       # 12. Fuego rúnico de las Cuchillas del Caos

PALETTE = [
    C_BLACK, C_DARK, C_LEATHER_DK, C_LEATHER_MD, C_LEATHER_HI,
    C_ASH_DK, C_BRONZE, C_ASH_MD, C_TATTOO, C_TATTOO_DK,
    C_ASH_HI, C_FIRE
]

def load_master_sprite():
    path = os.path.join(os.path.dirname(__file__), '..', 'public', 'assets', 'characters', 'kratos-neutral.png')
    if not os.path.exists(path):
        raise FileNotFoundError(f"No se encontró el sprite maestro en {path}")
    im = Image.open(path).convert('RGBA')
    if im.size != (FRAME_W, FRAME_H):
        raise ValueError(f"Tamaño inesperado del sprite maestro: {im.size}")
    return im

def draw_limb_segment(img, x0, y0, x1, y1, width, color_fill, color_edge, color_hi=None):
    """Traza un segmento anatómico de extremidad (muslo, pantorrilla o brazo) con relieve y borde."""
    dx = x1 - x0
    dy = y1 - y0
    steps = max(abs(dx), abs(dy), 1)
    half = width // 2
    
    for i in range(steps + 1):
        t = i / steps
        cx = int(round(x0 + dx * t))
        cy = int(round(y0 + dy * t))
        
        # Traza el grosor transversal perpendicular
        if abs(dx) > abs(dy):
            for wy in range(-half, half + 1):
                py = cy + wy
                if 0 <= cx < FRAME_W and 0 <= py < FRAME_H:
                    if abs(wy) == half:
                        img.putpixel((cx, py), color_edge)
                    elif wy < 0 and color_hi:
                        img.putpixel((cx, py), color_hi)
                    else:
                        img.putpixel((cx, py), color_fill)
        else:
            for wx in range(-half, half + 1):
                px = cx + wx
                if 0 <= px < FRAME_W and 0 <= cy < FRAME_H:
                    if abs(wx) == half:
                        img.putpixel((px, cy), color_edge)
                    elif wx > 0 and color_hi:
                        img.putpixel((px, cy), color_hi)
                    else:
                        img.putpixel((px, cy), color_fill)

def draw_blade(img, hx, hy, angle_dir, facing_fwd=True):
    """Dibuja la Cuchilla del Caos en la mano (hx, hy) con empuñadura de bronce, filo y fuego rúnico."""
    # Empuñadura y pomo
    for dy in (-1, 0, 1):
        for dx in (-1, 0, 1):
            px, py = hx + dx, hy + dy
            if 0 <= px < FRAME_W and 0 <= py < FRAME_H:
                img.putpixel((px, py), C_BRONZE)
    
    # Guarda cruceta
    gx = 1 if facing_fwd else -1
    for dy in (-2, -1, 0, 1, 2):
        px, py = hx + gx, hy + dy
        if 0 <= px < FRAME_W and 0 <= py < FRAME_H:
            img.putpixel((px, py), C_LEATHER_DK)

    # Hoja curva serrada que nace de la guarda
    length = 14
    for l in range(1, length + 1):
        if angle_dir == 'down_back':
            bx = hx - int(l * 0.7)
            by = hy + int(l * 0.9)
        elif angle_dir == 'down_fwd':
            bx = hx + int(l * 0.6)
            by = hy + int(l * 0.9)
        elif angle_dir == 'fwd_ready':
            bx = hx + int(l * 0.9)
            by = hy + int(l * 0.4)
        elif angle_dir == 'back_high':
            bx = hx - int(l * 0.8)
            by = hy - int(l * 0.5)
        elif angle_dir == 'skid_left':
            bx = hx - int(l * 0.8)
            by = hy + int(l * 0.6)
        elif angle_dir == 'skid_right':
            bx = hx + int(l * 0.8)
            by = hy + int(l * 0.6)
        else:
            bx = hx + l
            by = hy + l
            
        for w in (-1, 0, 1):
            px, py = bx, by + w
            if 0 <= px < FRAME_W and 0 <= py < FRAME_H:
                if w == 0:
                    img.putpixel((px, py), C_FIRE if l % 3 == 0 else C_ASH_HI)
                elif w == -1:
                    img.putpixel((px, py), C_ASH_MD)
                else:
                    img.putpixel((px, py), C_DARK)

def build_run_frame(master_img, phase_idx):
    """Construye un cuadro del ciclo de carrera preservando la masa y silueta anatómica de Kratos."""
    frame = Image.new('RGBA', (FRAME_W, FRAME_H), C_TRANS)
    
    # Parámetros mecánicos de cada fase (0..7 de carrera, 8 de frenada)
    # (torso_dx, torso_dy, r_hip, r_knee, r_foot, l_hip, l_knee, l_foot, r_arm_pose, l_arm_pose)
    if phase_idx == 0:
        # FASE 0: Contacto talón derecho adelante, izquierdo atrás empujando
        tdx, tdy = +2, 0
        r_thigh = ((48 + tdx, 38 + tdy), (52 + tdx, 48 + tdy), 4)
        r_calf  = ((52 + tdx, 48 + tdy), (56 + tdx, 58), 3)
        r_foot  = (54 + tdx, 58, 59 + tdx, 58)
        
        l_thigh = ((42 + tdx, 38 + tdy), (36 + tdx, 47 + tdy), 4)
        l_calf  = ((36 + tdx, 47 + tdy), (28 + tdx, 54 + tdy), 3)
        l_foot  = (26 + tdx, 54 + tdy, 30 + tdx, 54 + tdy)
        r_arm_angle, l_arm_angle = 'down_back', 'fwd_ready'
        r_hand = (36 + tdx, 38 + tdy)
        l_hand = (64 + tdx, 34 + tdy)

    elif phase_idx == 1:
        # FASE 1: Squash / Amortiguación derecha (cuerpo baja 2 px), izquierdo flexiona adelante
        tdx, tdy = +2, +2
        r_thigh = ((48 + tdx, 38 + tdy), (54 + tdx, 49 + tdy), 5)
        r_calf  = ((54 + tdx, 49 + tdy), (53 + tdx, 58), 4)
        r_foot  = (50 + tdx, 58, 56 + tdx, 58)
        
        l_thigh = ((42 + tdx, 38 + tdy), (40 + tdx, 47 + tdy), 4)
        l_calf  = ((40 + tdx, 47 + tdy), (36 + tdx, 52 + tdy), 3)
        l_foot  = (34 + tdx, 52 + tdy, 38 + tdx, 52 + tdy)
        r_arm_angle, l_arm_angle = 'down_back', 'fwd_ready'
        r_hand = (38 + tdx, 40 + tdy)
        l_hand = (62 + tdx, 36 + tdy)

    elif phase_idx == 2:
        # FASE 2: Paso / Passing derecha (apoyo vertical y=58, rodilla izquierda ALTA adelante)
        tdx, tdy = +1, 0
        r_thigh = ((48 + tdx, 38 + tdy), (47 + tdx, 48 + tdy), 4)
        r_calf  = ((47 + tdx, 48 + tdy), (46 + tdx, 58), 4)
        r_foot  = (43 + tdx, 58, 49 + tdx, 58)
        
        l_thigh = ((42 + tdx, 38 + tdy), (52 + tdx, 43 + tdy), 4)
        l_calf  = ((52 + tdx, 43 + tdy), (44 + tdx, 49 + tdy), 3)
        l_foot  = (42 + tdx, 49 + tdy, 46 + tdx, 49 + tdy)
        r_arm_angle, l_arm_angle = 'down_fwd', 'down_back'
        r_hand = (46 + tdx, 39 + tdy)
        l_hand = (50 + tdx, 39 + tdy)

    elif phase_idx == 3:
        # FASE 3: Impulso / Apex derecha (despegue pie derecho a ras, cuerpo sube 1 px, izquierdo extiende)
        tdx, tdy = +2, -1
        r_thigh = ((48 + tdx, 38 + tdy), (40 + tdx, 47 + tdy), 4)
        r_calf  = ((40 + tdx, 47 + tdy), (32 + tdx, 57), 3)
        r_foot  = (30 + tdx, 57, 34 + tdx, 58)
        
        l_thigh = ((42 + tdx, 38 + tdy), (52 + tdx, 46 + tdy), 4)
        l_calf  = ((52 + tdx, 46 + tdy), (56 + tdx, 54 + tdy), 3)
        l_foot  = (54 + tdx, 54 + tdy, 58 + tdx, 55 + tdy)
        r_arm_angle, l_arm_angle = 'fwd_ready', 'down_back'
        r_hand = (64 + tdx, 34 + tdy)
        l_hand = (36 + tdx, 38 + tdy)

    elif phase_idx == 4:
        # FASE 4: Contacto talón izquierdo adelante, derecho atrás empujando
        tdx, tdy = +2, 0
        l_thigh = ((48 + tdx, 38 + tdy), (52 + tdx, 48 + tdy), 4)
        l_calf  = ((52 + tdx, 48 + tdy), (56 + tdx, 58), 3)
        l_foot  = (54 + tdx, 58, 59 + tdx, 58)
        
        r_thigh = ((42 + tdx, 38 + tdy), (36 + tdx, 47 + tdy), 4)
        r_calf  = ((36 + tdx, 47 + tdy), (28 + tdx, 54 + tdy), 3)
        r_foot  = (26 + tdx, 54 + tdy, 30 + tdx, 54 + tdy)
        r_arm_angle, l_arm_angle = 'fwd_ready', 'down_back'
        r_hand = (64 + tdx, 34 + tdy)
        l_hand = (36 + tdx, 38 + tdy)

    elif phase_idx == 5:
        # FASE 5: Squash / Amortiguación izquierda (cuerpo baja 2 px), derecho flexiona adelante
        tdx, tdy = +2, +2
        l_thigh = ((48 + tdx, 38 + tdy), (54 + tdx, 49 + tdy), 5)
        l_calf  = ((54 + tdx, 49 + tdy), (53 + tdx, 58), 4)
        l_foot  = (50 + tdx, 58, 56 + tdx, 58)
        
        r_thigh = ((42 + tdx, 38 + tdy), (40 + tdx, 47 + tdy), 4)
        r_calf  = ((40 + tdx, 47 + tdy), (36 + tdx, 52 + tdy), 3)
        r_foot  = (34 + tdx, 52 + tdy, 38 + tdx, 52 + tdy)
        r_arm_angle, l_arm_angle = 'fwd_ready', 'down_back'
        r_hand = (62 + tdx, 36 + tdy)
        l_hand = (38 + tdx, 40 + tdy)

    elif phase_idx == 6:
        # FASE 6: Paso / Passing izquierda (apoyo vertical y=58, rodilla derecha ALTA adelante)
        tdx, tdy = +1, 0
        l_thigh = ((48 + tdx, 38 + tdy), (47 + tdx, 48 + tdy), 4)
        l_calf  = ((47 + tdx, 48 + tdy), (46 + tdx, 58), 4)
        l_foot  = (43 + tdx, 58, 49 + tdx, 58)
        
        r_thigh = ((42 + tdx, 38 + tdy), (52 + tdx, 43 + tdy), 4)
        r_calf  = ((52 + tdx, 43 + tdy), (44 + tdx, 49 + tdy), 3)
        r_foot  = (42 + tdx, 49 + tdy, 46 + tdx, 49 + tdy)
        r_arm_angle, l_arm_angle = 'down_back', 'down_fwd'
        r_hand = (50 + tdx, 39 + tdy)
        l_hand = (46 + tdx, 39 + tdy)

    elif phase_idx == 7:
        # FASE 7: Impulso / Apex izquierda (despegue pie izquierdo a ras, cuerpo sube 1 px, derecho extiende)
        tdx, tdy = +2, -1
        l_thigh = ((48 + tdx, 38 + tdy), (40 + tdx, 47 + tdy), 4)
        l_calf  = ((40 + tdx, 47 + tdy), (32 + tdx, 57), 3)
        l_foot  = (30 + tdx, 57, 34 + tdx, 58)
        
        r_thigh = ((42 + tdx, 38 + tdy), (52 + tdx, 46 + tdy), 4)
        r_calf  = ((52 + tdx, 46 + tdy), (56 + tdx, 54 + tdy), 3)
        r_foot  = (54 + tdx, 54 + tdy, 58 + tdx, 55 + tdy)
        r_arm_angle, l_arm_angle = 'down_back', 'fwd_ready'
        r_hand = (36 + tdx, 38 + tdy)
        l_hand = (64 + tdx, 34 + tdy)

    elif phase_idx == 8:
        # FASE 8: Frenada y derrape brusco (Skid / Turnaround)
        tdx, tdy = -2, +2
        # Ambas piernas abiertas y flexionadas con talones clavados a y=58
        r_thigh = ((48 + tdx, 38 + tdy), (56 + tdx, 48 + tdy), 5)
        r_calf  = ((56 + tdx, 48 + tdy), (60 + tdx, 58), 4)
        r_foot  = (57 + tdx, 58, 64 + tdx, 58)
        
        l_thigh = ((42 + tdx, 38 + tdy), (34 + tdx, 48 + tdy), 5)
        l_calf  = ((34 + tdx, 48 + tdy), (30 + tdx, 58), 4)
        l_foot  = (27 + tdx, 58, 33 + tdx, 58)
        r_arm_angle, l_arm_angle = 'skid_right', 'skid_left'
        r_hand = (64 + tdx, 36 + tdy)
        l_hand = (28 + tdx, 36 + tdy)

    # 1. DIBUJAR EXTREMIDADES TRASERAS (Pierna y brazo de fondo)
    # Brazo trasero y Cuchilla de fondo
    draw_blade(frame, l_hand[0], l_hand[1], l_arm_angle, facing_fwd=False)
    draw_limb_segment(frame, 44 + tdx, 26 + tdy, l_hand[0], l_hand[1], 3, C_ASH_DK, C_BLACK, C_ASH_MD)
    
    # Pierna trasera
    draw_limb_segment(frame, l_thigh[0][0], l_thigh[0][1], l_thigh[1][0], l_thigh[1][1], l_thigh[2], C_ASH_DK, C_BLACK, C_ASH_MD)
    draw_limb_segment(frame, l_calf[0][0], l_calf[0][1], l_calf[1][0], l_calf[1][1], l_calf[2], C_BRONZE, C_BLACK, C_LEATHER_HI)
    # Sandalia trasera
    for fx in range(int(l_foot[0]), int(l_foot[2]) + 1):
        if 0 <= fx < FRAME_W and 0 <= int(l_foot[1]) < FRAME_H:
            frame.putpixel((fx, int(l_foot[1])), C_LEATHER_DK)

    # 2. DIBUJAR TORSO, CABEZA, CUELLO Y PTERUGES DEL SPRITE MAESTRO
    # Extraemos el bloque anatómico del torso/cabeza del sprite maestro (y=14..45, x=34..62)
    for my in range(14, 46):
        for mx in range(34, 64):
            p = master_img.getpixel((mx, my))
            if p[3] > 0:
                target_x = mx + tdx
                target_y = my + tdy
                if 0 <= target_x < FRAME_W and 0 <= target_y < FRAME_H:
                    # Dinámica de los pteruges (faldón) ondeando con la inercia
                    if my >= 38 and phase_idx < 8:
                        # Viento e inercia empujan el faldón ligeramente hacia atrás (-x)
                        target_x -= 1
                    frame.putpixel((target_x, target_y), p)

    # 3. DIBUJAR EXTREMIDADES DELANTERAS (Pierna y brazo en primer plano)
    # Pierna delantera
    draw_limb_segment(frame, r_thigh[0][0], r_thigh[0][1], r_thigh[1][0], r_thigh[1][1], r_thigh[2], C_ASH_MD, C_BLACK, C_ASH_HI)
    draw_limb_segment(frame, r_calf[0][0], r_calf[0][1], r_calf[1][0], r_calf[1][1], r_calf[2], C_BRONZE, C_BLACK, C_LEATHER_HI)
    # Sandalia delantera con pisada firme
    for fx in range(int(r_foot[0]), int(r_foot[2]) + 1):
        if 0 <= fx < FRAME_W and 0 <= int(r_foot[1]) < FRAME_H:
            frame.putpixel((fx, int(r_foot[1])), C_LEATHER_DK)
            if int(r_foot[1]) + 1 < FRAME_H:
                frame.putpixel((fx, int(r_foot[1]) + 1), C_BLACK)

    # Brazo delantero y Cuchilla de primer plano
    draw_limb_segment(frame, 52 + tdx, 26 + tdy, r_hand[0], r_hand[1], 4, C_ASH_MD, C_BLACK, C_ASH_HI)
    # Tatuaje de Ares en hombro/antebrazo delantero
    frame.putpixel((51 + tdx, 27 + tdy), C_TATTOO)
    frame.putpixel((52 + tdx, 28 + tdy), C_TATTOO)
    draw_blade(frame, r_hand[0], r_hand[1], r_arm_angle, facing_fwd=True)

    # 4. ASEGURAR CONTACTO BASAL EN Y=58 (bbox[3] == 59)
    # Verificamos que al menos un pie o punto de apoyo toque y=58
    has_contact = any(frame.getpixel((x, 58))[3] > 0 for x in range(FRAME_W))
    if not has_contact:
        # Si por dinámica de salto el pie más bajo quedó en 57, anclamos el talón a 58
        lowest_y = 0
        best_x = 48
        for y in range(58, 45, -1):
            xs = [x for x in range(FRAME_W) if frame.getpixel((x, y))[3] > 0]
            if xs:
                lowest_y = y
                best_x = xs[len(xs)//2]
                break
        for cy in range(lowest_y + 1, 59):
            frame.putpixel((best_x, cy), C_LEATHER_DK)
            frame.putpixel((best_x + 1, cy), C_BLACK)

    return frame

def main():
    print("=== CONSTRUCTOR DEL RUN CYCLE DE KRATOS (8 CUADROS + SKID) ===")
    master = load_master_sprite()
    print("Sprite maestro cargado exitosamente.")

    sheet = Image.new('RGBA', (SHEET_W, SHEET_H), C_TRANS)
    frames = []

    for i in range(TOTAL_FRAMES):
        f = build_run_frame(master, i)
        sheet.paste(f, (i * FRAME_W, 0))
        frames.append(f)
        bbox = f.split()[3].getbbox()
        print(f"Cuadro {i}: bbox={bbox}, contacto_y58={bbox[3] == 59}")
        if bbox[3] != 59:
            raise ValueError(f"Fallo de contacto al suelo en cuadro {i}: bbox={bbox}")

    # Verificar deltas inter-cuadro entre cuadros consecutivos
    print("\n--- Verificación de fluidez y deltas inter-cuadro ---")
    for i in range(TOTAL_FRAMES - 1):
        diff = ImageChops.difference(frames[i], frames[i+1])
        diff_count = sum(1 for p in diff.getdata() if p[3] > 0 or any(c > 0 for c in p[:3]))
        print(f"Delta Cuadro {i} -> {i+1}: {diff_count} píxeles cambiados")
        if diff_count < 500:
            raise ValueError(f"Delta insuficiente entre cuadros {i} y {i+1}: {diff_count} < 500 px (animación congelada)")

    # Verificar delta de ciclo cerrado (Cuadro 7 -> Cuadro 0)
    cycle_diff = ImageChops.difference(frames[7], frames[0])
    cycle_count = sum(1 for p in cycle_diff.getdata() if p[3] > 0 or any(c > 0 for c in p[:3]))
    print(f"Delta Cierre de Ciclo (Cuadro 7 -> 0): {cycle_count} píxeles")
    if cycle_count < 500:
        raise ValueError(f"Fallo de continuidad en ciclo de carrera: {cycle_count} px")

    # Verificar paleta canónica estricta
    colors = {p[:3] for p in sheet.getdata() if p[3] > 0}
    print(f"\nColores únicos en la hoja: {len(colors)}")
    for c in colors:
        if c not in [p[:3] for p in PALETTE]:
            raise ValueError(f"Color ajeno detectado en la hoja de sprites: {c}")
    print("Todos los colores pertenecen estrictamente a la paleta oficial de 12 colores.")

    # Guardar en public/assets/characters/kratos-run.png
    out_path = os.path.join(os.path.dirname(__file__), '..', 'public', 'assets', 'characters', 'kratos-run.png')
    sheet.save(out_path)
    print(f"\n¡Hoja guardada exitosamente en {out_path}! ({SHEET_W}x{SHEET_H} px)")

if __name__ == '__main__':
    main()
