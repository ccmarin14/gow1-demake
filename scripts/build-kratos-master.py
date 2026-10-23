#!/usr/bin/env python3
"""Constructor del Sprite Maestro de Kratos (Pixel Art 16-bit canónico).

Diseño anatómico con proporciones heroicas espartanas sobre una rejilla de 97x59 px:
- Bóveda craneal calva espartana con brillo en coronilla (#ded8d2), ceño fruncido bajo
  sombra profunda, perfil de nariz griega aguileña proyectada 1-2 px hacia adelante,
  mandíbula angular con perilla espartana en cuña hacia adelante y abajo, y tatuaje
  carmesí continuo de Ares recorriendo cráneo, ojo y cuello.
- Cuello anatómico visible: 2-3 px de cuello en C_ASH_MD y C_ASH_DK conectando la mandíbula
  con la clavícula. Cero cabeza incrustada/jorobada.
- Hombros de 14-15 px con deltoides en cúpula y forma trapezoidal natural, pectorales
  definidos en 3 tonos con surco esternal, cintura de 10-11 px con six-pack visible.
- Brazos atléticos con cadenas de hierro enrolladas, puños cerrados de 5x5 px sujetando
  las empuñaduras de las Cuchillas del Caos (hojas nacen de las manos con guarda de bronce,
  filo plateado y fuego rúnico).
- Faldón de cuero con pteruges y hebilla de bronce, piernas musculosas con grebas de bronce
  y sandalias de combate apoyadas con firmeza en y=58 (bbox[3] == 59).
- Usa exclusivamente los 12 colores canónicos oficiales y canal alfa binario {0, 255}.

Exporta:
    - public/assets/characters/kratos-neutral.png (97x59)
    - public/assets/characters/kratos-idle.png (194x59, spritesheet de 2 cuadros)
"""

import os
import sys
from PIL import Image, ImageDraw

FRAME_W = 97
FRAME_H = 59
CX = 48

# Paleta canónica oficial de 12 colores (KRATOS-ART-UPGRADE-12COL-01)
C_BLACK = (18, 14, 16)        # Contorno nítido y perilla
C_ASH_DK = (64, 56, 52)       # Sombra piel de ceniza
C_ASH_MD = (144, 136, 128)    # Base piel espartana
C_ASH_HI = (222, 216, 210)    # Luces y relieve muscular
C_TATTOO_DK = (130, 24, 20)   # Sombra tatuaje Ares
C_TATTOO_HI = (220, 40, 32)   # Rojo carmesí puro de Ares
C_LEATHER_DK = (48, 32, 22)   # Sombra faldón y correas
C_LEATHER_MD = (96, 64, 40)   # Cuero espartano
C_BRONZE = (180, 136, 56)     # Hebilla y grebas de bronce
C_STEEL_DK = (42, 48, 56)     # Hierro de cadenas y hojas
C_STEEL_HI = (216, 224, 232)  # Filo plateado
C_RUNE_FIRE = (255, 136, 24)  # Fuego rúnico de las Cuchillas

PALETTE = [
    C_BLACK,
    C_ASH_DK,
    C_ASH_MD,
    C_ASH_HI,
    C_TATTOO_DK,
    C_TATTOO_HI,
    C_LEATHER_DK,
    C_LEATHER_MD,
    C_BRONZE,
    C_STEEL_DK,
    C_STEEL_HI,
    C_RUNE_FIRE,
]

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT_DIR, "public/assets/characters")
NEUTRAL_PATH = os.path.join(OUT_DIR, "kratos-neutral.png")
IDLE_PATH = os.path.join(OUT_DIR, "kratos-idle.png")


def create_master_sprite() -> Image.Image:
    """Construye el sprite maestro de Kratos pixel por pixel."""
    img = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))
    pix = img.load()

    def set_p(x: int, y: int, color):
        if 0 <= x < FRAME_W and 0 <= y < FRAME_H:
            pix[x, y] = (*color, 255)

    def draw_rect(x: int, y: int, w: int, h: int, color):
        for py in range(y, y + h):
            for px in range(x, x + w):
                set_p(px, py, color)

    # -------------------------------------------------------------
    # 1. BRAZO LEJANO Y CUCHILLA DEL CAOS TRASERA (Lado izquierdo)
    # -------------------------------------------------------------
    # Bíceps lejano descendiendo desde (40, 19) hasta el codo (34, 26)
    for py in range(19, 26):
        t = (py - 19) / 6.0
        bx = int(round(40 - 6 * t))
        draw_rect(bx - 2, py, 4, 1, C_ASH_DK)
        set_p(bx - 3, py, C_BLACK)
        set_p(bx + 2, py, C_BLACK)

    # Antebrazo con cadenas de hierro enrolladas (34, 26) -> (29, 33)
    for py in range(26, 34):
        t = (py - 26) / 7.0
        wx = int(round(34 - 5 * t))
        draw_rect(wx - 2, py, 4, 1, C_STEEL_DK)
        set_p(wx - 3, py, C_BLACK)
        set_p(wx + 2, py, C_BLACK)
        if py % 2 == 0:
            set_p(wx, py, C_STEEL_HI)
            set_p(wx - 1, py, C_ASH_MD)

    # Puño cerrado definido en (26..30, 33..37) sujetando la empuñadura
    draw_rect(26, 33, 5, 4, C_ASH_DK)
    set_p(25, 33, C_BLACK); set_p(25, 34, C_BLACK); set_p(25, 35, C_BLACK); set_p(25, 36, C_BLACK)
    set_p(31, 33, C_BLACK); set_p(31, 34, C_BLACK); set_p(31, 35, C_BLACK); set_p(31, 36, C_BLACK)
    set_p(26, 32, C_BLACK); set_p(27, 32, C_BLACK); set_p(28, 32, C_BLACK); set_p(29, 32, C_BLACK); set_p(30, 32, C_BLACK)
    set_p(26, 37, C_BLACK); set_p(27, 37, C_BLACK); set_p(28, 37, C_BLACK); set_p(29, 37, C_BLACK); set_p(30, 37, C_BLACK)
    set_p(27, 34, C_ASH_MD); set_p(28, 34, C_ASH_MD)
    set_p(27, 35, C_ASH_DK); set_p(28, 35, C_ASH_MD)

    # Guarda de bronce y pomo de la empuñadura
    set_p(25, 32, C_BRONZE); set_p(26, 32, C_BRONZE); set_p(27, 32, C_BRONZE); set_p(28, 32, C_BRONZE); set_p(29, 32, C_BRONZE)
    set_p(27, 38, C_BRONZE); set_p(28, 38, C_BRONZE); set_p(27, 39, C_BLACK); set_p(28, 39, C_BLACK)

    # Cuchilla del Caos trasera: nacida de la empuñadura en la mano
    far_blade_pixels = [
        (24, 33, C_BLACK), (25, 33, C_BRONZE), (26, 33, C_STEEL_DK), (27, 33, C_STEEL_DK), (28, 33, C_BLACK),
        (23, 34, C_BLACK), (24, 34, C_STEEL_HI), (25, 34, C_RUNE_FIRE), (26, 34, C_STEEL_DK), (27, 34, C_BLACK),
        (22, 35, C_BLACK), (23, 35, C_STEEL_HI), (24, 35, C_STEEL_DK), (25, 35, C_RUNE_FIRE), (26, 35, C_STEEL_DK), (27, 35, C_BLACK),
        (20, 36, C_BLACK), (21, 36, C_STEEL_HI), (22, 36, C_STEEL_DK), (23, 36, C_RUNE_FIRE), (24, 36, C_STEEL_DK), (25, 36, C_STEEL_DK), (26, 36, C_BLACK),
        (19, 37, C_BLACK), (20, 37, C_STEEL_HI), (21, 37, C_STEEL_DK), (22, 37, C_RUNE_FIRE), (23, 37, C_STEEL_DK), (24, 37, C_STEEL_DK), (25, 37, C_BLACK),
        (18, 38, C_BLACK), (19, 38, C_STEEL_HI), (20, 38, C_STEEL_DK), (21, 38, C_RUNE_FIRE), (22, 38, C_STEEL_DK), (23, 38, C_STEEL_DK), (24, 38, C_STEEL_DK), (25, 38, C_STEEL_HI), (26, 38, C_BLACK),
        (18, 39, C_BLACK), (19, 39, C_STEEL_HI), (20, 39, C_STEEL_DK), (21, 39, C_RUNE_FIRE), (22, 39, C_STEEL_DK), (23, 39, C_STEEL_DK), (25, 39, C_BLACK),
        (17, 40, C_BLACK), (18, 40, C_STEEL_HI), (19, 40, C_STEEL_DK), (20, 40, C_RUNE_FIRE), (21, 40, C_STEEL_DK), (22, 40, C_STEEL_DK), (23, 40, C_BLACK),
        (17, 41, C_BLACK), (18, 41, C_STEEL_HI), (19, 41, C_STEEL_DK), (20, 41, C_STEEL_DK), (21, 41, C_STEEL_DK), (22, 41, C_BLACK),
        (16, 42, C_BLACK), (17, 42, C_STEEL_HI), (18, 42, C_STEEL_DK), (19, 42, C_STEEL_DK), (20, 42, C_BLACK),
        (16, 43, C_BLACK), (17, 43, C_STEEL_HI), (18, 43, C_STEEL_DK), (19, 43, C_BLACK),
        (15, 44, C_BLACK), (16, 44, C_STEEL_HI), (17, 44, C_STEEL_DK), (18, 44, C_BLACK),
        (15, 45, C_BLACK), (16, 45, C_STEEL_HI), (17, 45, C_BLACK),
        (15, 46, C_BLACK), (16, 46, C_BLACK),
    ]
    for px, py, col in far_blade_pixels:
        set_p(px, py, col)

    # Cadena de hierro colgando de la muñeca izquierda
    for step in range(3):
        ly = 38 + step * 2
        lx = 28 - (step % 2)
        set_p(lx - 1, ly, C_BLACK); set_p(lx, ly, C_STEEL_DK); set_p(lx + 1, ly, C_BLACK)
        set_p(lx, ly + 1, C_STEEL_HI)

    # -------------------------------------------------------------
    # 2. PIERNA LEJANA (Izquierda, y = 35..58)
    # -------------------------------------------------------------
    # Muslo: desde la cadera (43, 35) hasta la rodilla (41, 44)
    for py in range(35, 44):
        t = (py - 35) / 9.0
        tx = int(round(43 - 2 * t))
        draw_rect(tx - 2, py, 4, 1, C_ASH_DK)
        set_p(tx - 3, py, C_BLACK)
        set_p(tx + 2, py, C_BLACK)
        set_p(tx - 1, py, C_ASH_MD)

    # Rodillera de bronce (39..42, 44..45)
    draw_rect(39, 44, 4, 2, C_BRONZE)
    set_p(38, 44, C_BLACK); set_p(43, 44, C_BLACK)
    set_p(38, 45, C_BLACK); set_p(43, 45, C_BLACK)
    set_p(40, 44, C_ASH_HI)

    # Greba de bronce protegiendo la espinilla (39..42, 46..54)
    for py in range(46, 55):
        draw_rect(39, py, 4, 1, C_BRONZE)
        set_p(38, py, C_BLACK); set_p(43, py, C_BLACK)
        set_p(40, py, C_ASH_HI if py in [47, 48, 51, 52] else C_BRONZE)
        set_p(42, py, C_LEATHER_DK)

    # Sandalia de combate y pie apoyado firmemente en y=58
    draw_rect(39, 55, 4, 1, C_ASH_DK)
    set_p(38, 55, C_BLACK); set_p(43, 55, C_BLACK)
    draw_rect(38, 56, 6, 1, C_LEATHER_MD)
    set_p(37, 56, C_BLACK); set_p(44, 56, C_BLACK)
    set_p(40, 56, C_ASH_MD)
    draw_rect(37, 57, 8, 1, C_LEATHER_DK)
    set_p(36, 57, C_BLACK); set_p(45, 57, C_BLACK)
    set_p(43, 57, C_BRONZE); set_p(44, 57, C_BRONZE)
    # Suela apoyada en y=58 (contacto continuo)
    draw_rect(37, 58, 8, 1, C_BLACK)
    set_p(43, 58, C_BRONZE); set_p(44, 58, C_BRONZE)

    # -------------------------------------------------------------
    # 3. PIERNA CERCANA (Derecha, y = 35..58)
    # -------------------------------------------------------------
    # Muslo: desde la cadera (48, 35) hasta la rodilla (52, 44)
    for py in range(35, 44):
        t = (py - 35) / 9.0
        tx = int(round(48 + 4 * t))
        draw_rect(tx - 2, py, 5, 1, C_ASH_MD)
        set_p(tx - 3, py, C_BLACK)
        set_p(tx + 3, py, C_BLACK)
        set_p(tx, py, C_ASH_HI)
        set_p(tx - 1, py, C_ASH_HI)
        set_p(tx + 2, py, C_ASH_DK)

    # Rodillera de bronce (50..54, 44..45) con brillo
    draw_rect(50, 44, 5, 2, C_BRONZE)
    set_p(49, 44, C_BLACK); set_p(55, 44, C_BLACK)
    set_p(49, 45, C_BLACK); set_p(55, 45, C_BLACK)
    set_p(51, 44, C_ASH_HI); set_p(52, 44, C_ASH_HI)

    # Greba anatómica de bronce (51..54, 46..54) con cresta de luz vertical
    for py in range(46, 55):
        draw_rect(51, py, 4, 1, C_BRONZE)
        set_p(50, py, C_BLACK); set_p(55, py, C_BLACK)
        set_p(52, py, C_ASH_HI)
        set_p(54, py, C_LEATHER_DK)

    # Sandalia de combate derecha apoyada firmemente en y=58
    draw_rect(51, 55, 4, 1, C_ASH_MD)
    set_p(50, 55, C_BLACK); set_p(55, 55, C_BLACK)
    set_p(52, 55, C_ASH_HI)
    draw_rect(50, 56, 7, 1, C_LEATHER_MD)
    set_p(49, 56, C_BLACK); set_p(57, 56, C_BLACK)
    set_p(52, 56, C_ASH_HI); set_p(53, 56, C_ASH_MD)
    draw_rect(49, 57, 9, 1, C_LEATHER_DK)
    set_p(48, 57, C_BLACK); set_p(58, 57, C_BLACK)
    set_p(55, 57, C_BRONZE); set_p(56, 57, C_BRONZE); set_p(57, 57, C_ASH_HI)
    # Suela apoyada en y=58 (contacto continuo)
    draw_rect(49, 58, 9, 1, C_BLACK)
    set_p(55, 58, C_BRONZE); set_p(56, 58, C_BRONZE); set_p(57, 58, C_BRONZE)

    # -------------------------------------------------------------
    # 4. TORSO, PECTORALES Y ABDOMEN (y = 17..31)
    # -------------------------------------------------------------
    draw_rect(43, 30, 11, 2, C_LEATHER_DK)
    set_p(42, 30, C_BLACK); set_p(54, 30, C_BLACK)
    set_p(42, 31, C_BLACK); set_p(54, 31, C_BLACK)

    # Abdominales inferiores (y=28..29)
    draw_rect(44, 28, 9, 2, C_ASH_MD)
    set_p(43, 28, C_BLACK); set_p(53, 28, C_BLACK)
    set_p(43, 29, C_BLACK); set_p(53, 29, C_BLACK)
    set_p(44, 28, C_ASH_DK); set_p(52, 28, C_ASH_DK)
    set_p(48, 28, C_ASH_DK); set_p(48, 29, C_BLACK)
    set_p(46, 28, C_ASH_HI); set_p(50, 28, C_ASH_HI)

    # Abdominales medios (y=26..27)
    draw_rect(43, 26, 11, 2, C_ASH_MD)
    set_p(42, 26, C_BLACK); set_p(54, 26, C_BLACK)
    set_p(42, 27, C_BLACK); set_p(54, 27, C_BLACK)
    set_p(43, 26, C_ASH_DK); set_p(53, 26, C_ASH_DK)
    set_p(48, 26, C_ASH_DK); set_p(48, 27, C_BLACK)
    set_p(45, 26, C_ASH_HI); set_p(46, 26, C_ASH_HI); set_p(50, 26, C_ASH_HI); set_p(51, 26, C_ASH_HI)
    for px in range(44, 53):
        if px != 48:
            set_p(px, 27, C_ASH_DK)

    # Abdominales superiores y serratos (y=24..25)
    draw_rect(42, 24, 13, 2, C_ASH_MD)
    set_p(41, 24, C_BLACK); set_p(55, 24, C_BLACK)
    set_p(41, 25, C_BLACK); set_p(55, 25, C_BLACK)
    set_p(42, 24, C_ASH_DK); set_p(54, 24, C_ASH_DK)
    set_p(48, 24, C_ASH_DK); set_p(48, 25, C_BLACK)
    set_p(44, 24, C_ASH_HI); set_p(45, 24, C_ASH_HI); set_p(51, 24, C_ASH_HI); set_p(52, 24, C_ASH_HI)
    # Tatuaje cruzando la pared abdominal superior
    set_p(47, 24, C_TATTOO_DK); set_p(48, 24, C_TATTOO_HI); set_p(49, 24, C_TATTOO_HI)
    set_p(46, 25, C_TATTOO_DK); set_p(47, 25, C_TATTOO_HI)

    # Pectorales esculpidos en 3 tonos con surco esternal (y=17..23)
    for px in range(41, 56):
        set_p(px, 23, C_ASH_DK)
    set_p(48, 23, C_BLACK)
    set_p(40, 23, C_BLACK); set_p(56, 23, C_BLACK)

    for py in range(18, 23):
        draw_rect(41, py, 15, 1, C_ASH_MD)
        set_p(40, py, C_BLACK); set_p(56, py, C_BLACK)
        set_p(48, py, C_ASH_DK if py < 22 else C_BLACK)
        set_p(41, py, C_ASH_DK)
        set_p(43, py, C_ASH_HI); set_p(44, py, C_ASH_HI); set_p(45, py, C_ASH_HI)
        set_p(51, py, C_ASH_HI); set_p(52, py, C_ASH_HI); set_p(53, py, C_ASH_HI)
        set_p(55, py, C_ASH_DK)

    # Tatuaje carmesí de Ares cruzando en diagonal el pecho
    set_p(50, 18, C_TATTOO_DK); set_p(51, 18, C_TATTOO_HI); set_p(52, 18, C_TATTOO_HI)
    set_p(49, 19, C_TATTOO_DK); set_p(50, 19, C_TATTOO_HI); set_p(51, 19, C_TATTOO_HI)
    set_p(48, 20, C_TATTOO_DK); set_p(49, 20, C_TATTOO_HI); set_p(50, 20, C_TATTOO_HI)
    set_p(47, 21, C_TATTOO_DK); set_p(48, 21, C_TATTOO_HI); set_p(49, 21, C_TATTOO_HI)
    set_p(46, 22, C_TATTOO_DK); set_p(47, 22, C_TATTOO_HI); set_p(48, 22, C_TATTOO_HI)

    # -------------------------------------------------------------
    # 5. FALDÓN ESPARTANO Y PTERUGES (y = 30..41)
    # -------------------------------------------------------------
    draw_rect(42, 30, 13, 3, C_BRONZE)
    set_p(41, 30, C_BLACK); set_p(55, 30, C_BLACK)
    set_p(41, 31, C_BLACK); set_p(55, 31, C_BLACK)
    set_p(41, 32, C_BLACK); set_p(55, 32, C_BLACK)
    for px in range(42, 55):
        set_p(px, 30, C_LEATHER_DK)
        set_p(px, 32, C_LEATHER_DK)
    # Hebilla central dorada de bronce con brillo
    draw_rect(47, 30, 3, 3, C_BRONZE)
    set_p(46, 30, C_BLACK); set_p(50, 30, C_BLACK)
    set_p(46, 31, C_BLACK); set_p(50, 31, C_BLACK)
    set_p(46, 32, C_BLACK); set_p(50, 32, C_BLACK)
    set_p(48, 30, C_ASH_HI); set_p(48, 31, C_ASH_HI)

    # Falda interior de cuero oscuro
    for py in range(33, 38):
        draw_rect(42, py, 13, 1, C_LEATHER_DK)
        set_p(41, py, C_BLACK); set_p(55, py, C_BLACK)

    # Tiras colgantes (pteruges) con remates de bronce
    # Tira 1
    draw_rect(42, 33, 2, 4, C_LEATHER_MD)
    set_p(42, 37, C_BRONZE); set_p(43, 37, C_BRONZE)
    set_p(42, 38, C_BLACK); set_p(43, 38, C_BLACK)
    # Tira 2
    draw_rect(44, 33, 2, 6, C_LEATHER_MD)
    set_p(44, 39, C_BRONZE); set_p(45, 39, C_BRONZE)
    set_p(44, 40, C_BLACK); set_p(45, 40, C_BLACK)
    # Faja central roja ceremonial de Ares
    draw_rect(47, 33, 3, 7, C_TATTOO_HI)
    for py in range(33, 40):
        set_p(46, py, C_BLACK); set_p(50, py, C_BLACK)
    set_p(47, 33, C_TATTOO_DK); set_p(47, 34, C_TATTOO_DK); set_p(47, 35, C_TATTOO_DK)
    set_p(47, 40, C_BRONZE); set_p(48, 40, C_BRONZE); set_p(49, 40, C_BRONZE)
    set_p(47, 41, C_BLACK); set_p(48, 41, C_BLACK); set_p(49, 41, C_BLACK)
    # Tira 4
    draw_rect(51, 33, 2, 6, C_LEATHER_MD)
    set_p(51, 39, C_BRONZE); set_p(52, 39, C_BRONZE)
    set_p(51, 40, C_BLACK); set_p(52, 40, C_BLACK)
    # Tira 5
    draw_rect(53, 33, 2, 4, C_LEATHER_MD)
    set_p(53, 37, C_BRONZE); set_p(54, 37, C_BRONZE)
    set_p(53, 38, C_BLACK); set_p(54, 38, C_BLACK)

    # -------------------------------------------------------------
    # 6. HOMBROS, CLAVÍCULA, TRAPECIOS Y CUELLO VISIBLE (y = 14..17)
    # -------------------------------------------------------------
    # Cúpula deltoide izquierda (x=38..41, y=17..18)
    draw_rect(39, 17, 3, 2, C_ASH_MD)
    set_p(38, 17, C_BLACK); set_p(39, 16, C_BLACK); set_p(40, 16, C_BLACK); set_p(41, 16, C_BLACK)
    set_p(38, 18, C_BLACK); set_p(40, 17, C_ASH_HI)

    # Trapecio izquierdo y muesca clavicular
    set_p(42, 17, C_ASH_MD); set_p(43, 17, C_ASH_MD); set_p(44, 17, C_ASH_MD)
    set_p(42, 16, C_BLACK); set_p(43, 16, C_BLACK); set_p(44, 16, C_BLACK)
    set_p(47, 17, C_BLACK); set_p(48, 17, C_ASH_DK)
    set_p(45, 17, C_ASH_HI); set_p(46, 17, C_ASH_HI)
    set_p(49, 17, C_TATTOO_HI); set_p(50, 17, C_ASH_HI)

    # Cúpula deltoide derecha (x=55..58, y=17..18)
    draw_rect(55, 17, 3, 2, C_ASH_MD)
    set_p(55, 16, C_BLACK); set_p(56, 16, C_BLACK); set_p(57, 16, C_BLACK); set_p(58, 17, C_BLACK)
    set_p(56, 17, C_ASH_HI); set_p(57, 17, C_ASH_HI)
    set_p(51, 17, C_ASH_MD); set_p(52, 17, C_ASH_MD); set_p(53, 17, C_ASH_MD); set_p(54, 17, C_ASH_MD)
    set_p(51, 16, C_BLACK); set_p(52, 16, C_BLACK); set_p(53, 16, C_BLACK); set_p(54, 16, C_BLACK)

    # --- CUELLO ANATÓMICO VISIBLE (y = 14..16) ---
    # Columna muscular continua conectando la mandíbula con la clavícula.
    # El espacio a la derecha (x=51..58) a y=14..15 queda transparente, logrando
    # una separación limpia y cero joroba.
    set_p(45, 16, C_BLACK)
    set_p(46, 16, C_ASH_DK)
    set_p(47, 16, C_ASH_MD)
    set_p(48, 16, C_TATTOO_DK)
    set_p(49, 16, C_TATTOO_HI)
    set_p(50, 16, C_BLACK)

    # y = 15: cuello visible libre
    set_p(45, 15, C_BLACK)
    set_p(46, 15, C_ASH_DK)       # Sombra posterior del cuello
    set_p(47, 15, C_ASH_MD)       # Esternocleidomastoideo
    set_p(48, 15, C_TATTOO_DK)    # Sombra del tatuaje de Ares
    set_p(49, 15, C_TATTOO_HI)    # Banda carmesí de Ares
    set_p(50, 15, C_BLACK)        # Contorno anterior del cuello

    # y = 14: base de la garganta bajo la barbilla
    set_p(45, 14, C_BLACK)
    set_p(46, 14, C_ASH_DK)
    set_p(47, 14, C_ASH_MD)
    set_p(48, 14, C_TATTOO_DK)
    set_p(49, 14, C_TATTOO_HI)

    # -------------------------------------------------------------
    # 7. CABEZA, ROSTRO ESPARTANO Y TATUAJE DE ARES (y = 5..14)
    # -------------------------------------------------------------
    # Coronilla calva espartana con brillo superior
    set_p(46, 5, C_BLACK); set_p(47, 5, C_BLACK); set_p(48, 5, C_BLACK); set_p(49, 5, C_BLACK)

    # Brillo ceniciento de coronilla (#ded8d2) y tatuaje carmesí entrando
    set_p(45, 6, C_BLACK); set_p(46, 6, C_ASH_MD); set_p(47, 6, C_ASH_HI); set_p(48, 6, C_ASH_HI)
    set_p(49, 6, C_TATTOO_HI); set_p(50, 6, C_BLACK)

    # Frente amplia y banda continua del tatuaje
    set_p(44, 7, C_BLACK); set_p(45, 7, C_ASH_DK); set_p(46, 7, C_ASH_MD); set_p(47, 7, C_ASH_HI)
    set_p(48, 7, C_TATTOO_HI); set_p(49, 7, C_TATTOO_HI); set_p(50, 7, C_ASH_MD); set_p(51, 7, C_BLACK)

    # Ceño fruncido espartano bajo sombra profunda
    set_p(44, 8, C_BLACK); set_p(45, 8, C_ASH_DK); set_p(46, 8, C_ASH_MD); set_p(47, 8, C_ASH_MD)
    set_p(48, 8, C_TATTOO_DK); set_p(49, 8, C_TATTOO_HI); set_p(50, 8, C_BLACK); set_p(51, 8, C_BLACK); set_p(52, 8, C_BLACK)

    # Cuenca orbitaria con mirada fiera y perfil de nariz griega aguileña proyectada al frente
    set_p(44, 9, C_BLACK); set_p(45, 9, C_ASH_DK); set_p(46, 9, C_ASH_MD); set_p(47, 9, C_ASH_MD)
    set_p(48, 9, C_TATTOO_DK); set_p(49, 9, C_TATTOO_HI)
    set_p(50, 9, C_ASH_HI)  # Destello ocular fiero
    set_p(51, 9, C_BLACK)   # Sombra de la cuenca
    set_p(52, 9, C_ASH_HI)  # Tabique nasal prominente
    set_p(53, 9, C_BLACK)   # Punta aguileña de la nariz

    # Mejilla, tatuaje carmesí y base nasal
    set_p(44, 10, C_BLACK); set_p(45, 10, C_ASH_DK); set_p(46, 10, C_ASH_MD); set_p(47, 10, C_ASH_MD)
    set_p(48, 10, C_TATTOO_DK); set_p(49, 10, C_TATTOO_HI); set_p(50, 10, C_ASH_MD); set_p(51, 10, C_BLACK); set_p(52, 10, C_BLACK)

    # Labio severo y bigote espartano
    set_p(45, 11, C_BLACK); set_p(46, 11, C_ASH_DK); set_p(47, 11, C_ASH_MD)
    set_p(48, 11, C_TATTOO_DK); set_p(49, 11, C_TATTOO_HI); set_p(50, 11, C_BLACK); set_p(51, 11, C_BLACK)

    # Mandíbula angular y arranque de la perilla espartana en cuña
    set_p(45, 12, C_BLACK); set_p(46, 12, C_ASH_DK); set_p(47, 12, C_ASH_MD)
    set_p(48, 12, C_TATTOO_DK); set_p(49, 12, C_ASH_DK); set_p(50, 12, C_BLACK); set_p(51, 12, C_BLACK); set_p(52, 12, C_BLACK)

    # Cuerpo de la perilla espartana proyectada hacia adelante y abajo
    set_p(46, 13, C_BLACK); set_p(47, 13, C_ASH_DK); set_p(48, 13, C_BLACK); set_p(49, 13, C_ASH_DK); set_p(50, 13, C_BLACK); set_p(51, 13, C_BLACK)

    # Punta angular de la perilla en cuña
    set_p(48, 14, C_BLACK); set_p(49, 14, C_BLACK); set_p(50, 14, C_BLACK)

    # -------------------------------------------------------------
    # 8. BRAZO CERCANO, PUÑO, EMPUÑADURA Y CUCHILLA DEL CAOS (y = 17..46)
    # -------------------------------------------------------------
    # Deltoides potente redondeado en cúpula
    draw_rect(56, 18, 3, 4, C_ASH_MD)
    set_p(59, 18, C_BLACK); set_p(59, 19, C_BLACK); set_p(60, 20, C_BLACK); set_p(60, 21, C_BLACK)
    set_p(56, 18, C_ASH_HI); set_p(57, 18, C_ASH_HI); set_p(57, 19, C_ASH_HI)
    set_p(58, 20, C_ASH_DK); set_p(58, 21, C_ASH_DK)

    # Bíceps hacia el codo (61, 26)
    for py in range(22, 27):
        t = (py - 22) / 4.0
        bx = int(round(57 + 3 * t))
        draw_rect(bx - 1, py, 4, 1, C_ASH_MD)
        set_p(bx - 2, py, C_BLACK); set_p(bx + 3, py, C_BLACK)
        set_p(bx, py, C_ASH_HI)

    # Antebrazo con cadenas de hierro enrolladas (60, 27) -> (65, 33)
    for py in range(27, 34):
        t = (py - 27) / 6.0
        fx = int(round(60 + 5 * t))
        draw_rect(fx - 1, py, 4, 1, C_STEEL_DK)
        set_p(fx - 2, py, C_BLACK); set_p(fx + 3, py, C_BLACK)
        if py % 2 == 1:
            set_p(fx + 1, py, C_STEEL_HI)
            set_p(fx, py, C_ASH_MD)

    # Puño cerrado definido de 5x5 px en (64..68, 32..36)
    draw_rect(64, 33, 5, 4, C_ASH_MD)
    set_p(63, 33, C_BLACK); set_p(63, 34, C_BLACK); set_p(63, 35, C_BLACK); set_p(63, 36, C_BLACK)
    set_p(69, 33, C_BLACK); set_p(69, 34, C_BLACK); set_p(69, 35, C_BLACK); set_p(69, 36, C_BLACK)
    set_p(64, 37, C_BLACK); set_p(65, 37, C_BLACK); set_p(66, 37, C_BLACK); set_p(67, 37, C_BLACK); set_p(68, 37, C_BLACK)
    # Nudillos y dedos agarrando con fuerza la empuñadura
    set_p(65, 33, C_ASH_HI); set_p(66, 33, C_ASH_HI)
    set_p(65, 34, C_ASH_HI); set_p(66, 34, C_ASH_MD); set_p(67, 34, C_ASH_DK)
    set_p(65, 35, C_ASH_MD); set_p(66, 35, C_ASH_DK); set_p(67, 35, C_BLACK)

    # Empuñadura de bronce en la mano: pomo inferior y cruceta superior
    set_p(65, 31, C_BLACK); set_p(66, 31, C_BRONZE); set_p(67, 31, C_BRONZE); set_p(68, 31, C_BRONZE); set_p(69, 31, C_BLACK)
    set_p(66, 32, C_BRONZE); set_p(67, 32, C_BRONZE); set_p(68, 32, C_BRONZE)
    set_p(66, 38, C_BRONZE); set_p(67, 38, C_BRONZE); set_p(66, 39, C_BLACK); set_p(67, 39, C_BLACK)

    # Cuchilla del Caos delantera: ancha, curvada, con gancho trasero y fuego rúnico
    near_blade_pixels = [
        (69, 32, C_BRONZE), (70, 32, C_BLACK),
        (68, 33, C_STEEL_DK), (69, 33, C_RUNE_FIRE), (70, 33, C_STEEL_DK), (71, 33, C_BLACK),
        (69, 34, C_STEEL_HI), (70, 34, C_STEEL_DK), (71, 34, C_RUNE_FIRE), (72, 34, C_STEEL_DK), (73, 34, C_BLACK),
        (70, 35, C_STEEL_HI), (71, 35, C_STEEL_DK), (72, 35, C_RUNE_FIRE), (73, 35, C_STEEL_DK), (74, 35, C_STEEL_DK), (75, 35, C_BLACK),
        (70, 36, C_BLACK), (71, 36, C_STEEL_HI), (72, 36, C_STEEL_DK), (73, 36, C_RUNE_FIRE), (74, 36, C_STEEL_DK), (75, 36, C_STEEL_DK), (76, 36, C_BLACK),
        (69, 37, C_BLACK), (70, 37, C_STEEL_HI), (71, 37, C_STEEL_DK), (72, 37, C_STEEL_DK), (73, 37, C_RUNE_FIRE), (74, 37, C_STEEL_DK), (75, 37, C_STEEL_DK), (76, 37, C_STEEL_HI), (77, 37, C_BLACK),
        (70, 38, C_BLACK), (71, 38, C_STEEL_DK), (72, 38, C_STEEL_DK), (73, 38, C_RUNE_FIRE), (74, 38, C_STEEL_DK), (75, 38, C_STEEL_HI), (76, 38, C_BLACK),
        (71, 39, C_BLACK), (72, 39, C_STEEL_DK), (73, 39, C_RUNE_FIRE), (74, 39, C_STEEL_DK), (75, 39, C_STEEL_DK), (76, 39, C_STEEL_HI), (77, 39, C_BLACK),
        (72, 40, C_BLACK), (73, 40, C_STEEL_DK), (74, 40, C_STEEL_DK), (75, 40, C_STEEL_DK), (76, 40, C_STEEL_HI), (77, 40, C_BLACK),
        (73, 41, C_BLACK), (74, 41, C_STEEL_DK), (75, 41, C_STEEL_DK), (76, 41, C_STEEL_HI), (77, 41, C_BLACK),
        (74, 42, C_BLACK), (75, 42, C_STEEL_DK), (76, 42, C_STEEL_HI), (77, 42, C_BLACK),
        (74, 43, C_BLACK), (75, 43, C_STEEL_HI), (76, 43, C_STEEL_HI), (77, 43, C_BLACK),
        (75, 44, C_BLACK), (76, 44, C_STEEL_HI), (77, 44, C_BLACK),
        (76, 45, C_BLACK), (77, 45, C_BLACK),
    ]
    for px, py, col in near_blade_pixels:
        set_p(px, py, col)

    # Cadena de hierro colgando de la muñeca delantera
    for step in range(3):
        ly = 38 + step * 2
        lx = 65 + (step % 2)
        set_p(lx - 1, ly, C_BLACK); set_p(lx, ly, C_STEEL_DK); set_p(lx + 1, ly, C_BLACK)
        set_p(lx, ly + 1, C_STEEL_HI)

    return img


def verify_sprite(img: Image.Image, name: str) -> None:
    """Valida dimensiones, anclaje en y=58, canal alfa binario y paleta exacta de 12 colores."""
    assert img.size == (FRAME_W, FRAME_H), f"{name}: dimensiones erróneas {img.size}"
    
    alpha_channel = img.split()[3]
    bbox = alpha_channel.getbbox()
    assert bbox is not None, f"{name}: sprite completamente transparente"
    assert bbox[3] == FRAME_H, f"{name}: contacto inferior no toca y=58 (bbox={bbox})"

    # Verificar que el canal alfa sea 100% binario ({0, 255})
    alpha_values = set(alpha_channel.getdata())
    assert alpha_values <= {0, 255}, f"{name}: canal alfa no binario: {alpha_values}"

    # Extraer colores RGB de píxeles visibles
    colors = {p[:3] for p in img.convert("RGBA").getdata() if p[3] > 0}
    palette_set = set(PALETTE)

    assert colors <= palette_set, f"{name}: colores fuera de paleta: {colors - palette_set}"
    assert len(colors) == 12, f"{name}: faltan colores de paleta: {palette_set - colors}"
    print(f"[{name}] Verificación estricta exitosa: 97x59 px, contacto y=58, 12 colores canónicos, alfa binario.")


def build_idle_sheet(master: Image.Image) -> Image.Image:
    """Genera la hoja de animación de idle de 2 cuadros basada en el Sprite Maestro."""
    sheet = Image.new("RGBA", (FRAME_W * 2, FRAME_H), (0, 0, 0, 0))
    sheet.paste(master, (0, 0))
    sheet.paste(master, (FRAME_W, 0))
    return sheet


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    master = create_master_sprite()
    verify_sprite(master, "kratos-neutral.png")
    master.save(NEUTRAL_PATH)
    print(f"Guardado Kratos Neutral Maestro: {NEUTRAL_PATH}")

    idle_sheet = build_idle_sheet(master)
    # Verificar frame 0 y frame 1
    f0 = idle_sheet.crop((0, 0, FRAME_W, FRAME_H))
    f1 = idle_sheet.crop((FRAME_W, 0, FRAME_W * 2, FRAME_H))
    verify_sprite(f0, "kratos-idle frame 0")
    verify_sprite(f1, "kratos-idle frame 1")
    idle_sheet.save(IDLE_PATH)
    print(f"Guardado Kratos Idle Sheet Maestro: {IDLE_PATH}")


if __name__ == "__main__":
    main()
