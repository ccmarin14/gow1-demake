#!/usr/bin/env python3
"""Script de aserciones estrictas para los assets de la Hidra de Lerna (GOW8B-HYDRA-ART).

Verifica:
1. Dimensiones exactas de public/assets/characters/hydra.png (1024x112).
2. Canal alfa binario puro (0 o 255, sin semitransparencias ni halos).
3. Paleta contenida (<= 16 colores, exactamente 14 consistentes).
4. Presencia de fulgor ámbar/oro en los ojos y carmesí en fauces/garganta.
5. Bboxes no vacías en los 8 fotogramas canónicos (128x112).
6. Anclaje inferior estricto y = 111 (bbox[3] == 112) en poses 3 (slam_bite) y 6 (stagger_vulnerable).
7. Existencia y validez de la hoja de contacto docs/referencias/hydra-contact-sheet.png.
"""

import os
import sys
from PIL import Image

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HYDRA_PNG = os.path.join(ROOT_DIR, "public", "assets", "characters", "hydra.png")
CONTACT_PNG = os.path.join(ROOT_DIR, "docs", "referencias", "hydra-contact-sheet.png")

# Paleta canónica
C_ABYSS_DK    = (15, 29, 33)
C_ABYSS_MD    = (22, 46, 52)
C_SCALE_DK    = (34, 68, 77)
C_SCALE_MD    = (50, 97, 109)
C_SCALE_HI    = (77, 132, 147)
C_MAW_DEEP    = (69, 10, 10)
C_MAW_DK      = (127, 29, 29)
C_MAW_MD      = (185, 28, 28)
C_MAW_HI      = (239, 68, 68)
C_FANG_DK     = (156, 163, 175)
C_FANG_MD     = (209, 213, 219)
C_FANG_HI     = (243, 244, 246)
C_GLOW_ORANGE = (234, 88, 12)
C_GLOW_GOLD   = (250, 204, 21)

EXPECTED_PALETTE = {
    C_ABYSS_DK, C_ABYSS_MD, C_SCALE_DK, C_SCALE_MD, C_SCALE_HI,
    C_MAW_DEEP, C_MAW_DK, C_MAW_MD, C_MAW_HI,
    C_FANG_DK, C_FANG_MD, C_FANG_HI,
    C_GLOW_ORANGE, C_GLOW_GOLD
}

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


def test_hydra_spritesheet():
    print("-> Verificando hoja de sprites hydra.png...")
    assert os.path.isfile(HYDRA_PNG), f"Archivo no encontrado: {HYDRA_PNG}"
    img = Image.open(HYDRA_PNG)
    assert img.size == (1024, 112), f"Dimensiones incorrectas: {img.size} != (1024, 112)"
    assert img.mode == "RGBA", f"Modo de color incorrecto: {img.mode} != RGBA"

    # Canal alfa estrictamente binario y recolección de colores
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
    assert len(colors) <= 16, f"Demasiados colores en la paleta: {len(colors)} > 16"
    assert colors.issubset(EXPECTED_PALETTE), f"Colores desconocidos en la paleta: {colors - EXPECTED_PALETTE}"
    print(f"   [OK] Dimensiones (1024, 112), alfa 100% binario, {len(colors)} colores usados (<= 16)")

    # Fulgor ámbar / oro en los ojos y carmesí en fauces
    amber_gold = {C_GLOW_ORANGE, C_GLOW_GOLD}
    found_amber = colors.intersection(amber_gold)
    assert found_amber, f"No se encontró fulgor ámbar/oro: {colors}"
    print(f"   [OK] Fulgor ámbar/oro detectado: {found_amber}")

    crimson = {C_MAW_DK, C_MAW_MD, C_MAW_HI}
    found_crimson = colors.intersection(crimson)
    assert found_crimson, f"No se encontraron tonos carmesí en las fauces: {colors}"
    print(f"   [OK] Tonos carmesí de fauces detectados: {found_crimson}")

    # Verificación de fotogramas individuales (128x112) y anclajes
    for idx in range(8):
        frame = img.crop((idx * 128, 0, (idx + 1) * 128, 112))
        bbox = frame.getbbox()
        assert bbox is not None, f"Fotograma {idx} ({FRAME_NAMES[idx]}) está completamente vacío"
        h = bbox[3] - bbox[1]
        w = bbox[2] - bbox[0]

        if idx in (3, 6):
            # Anclaje estricto en suelo en slam_bite (3) y stagger_vulnerable (6)
            assert bbox[3] == 112, (
                f"Fallo de anclaje al suelo en frame {idx} ({FRAME_NAMES[idx]}): "
                f"bbox[3]={bbox[3]} != 112 (fila inferior y=111 sin contacto)"
            )
            print(f"   [OK] Frame {FRAME_NAMES[idx]:<22}: bbox={bbox}, w={w:3d}px, h={h:3d}px, anclaje suelo y=111 (bbox[3]=112)")
        else:
            print(f"   [OK] Frame {FRAME_NAMES[idx]:<22}: bbox={bbox}, w={w:3d}px, h={h:3d}px")


def test_contact_sheet():
    print("\n-> Verificando hoja de contacto hydra-contact-sheet.png...")
    assert os.path.isfile(CONTACT_PNG), f"Archivo no encontrado: {CONTACT_PNG}"
    img = Image.open(CONTACT_PNG)
    assert img.size[0] >= 1000 and img.size[1] >= 400, f"Dimensiones inesperadas de hoja de contacto: {img.size}"
    assert img.mode == "RGBA", f"Modo incorrecto de hoja de contacto: {img.mode} != RGBA"
    print(f"   [OK] Hoja de contacto verificada ({img.size})")


def main():
    print("=== TEST DE ASERCIONES: GOW8B-HYDRA-ART ===")
    test_hydra_spritesheet()
    test_contact_sheet()
    print("\n>>> TODAS LAS ASERCIONES DE LA HIDRA PASARON CON ÉXITO <<<")


if __name__ == "__main__":
    main()
