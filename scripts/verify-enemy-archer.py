#!/usr/bin/env python3
"""Script de aserciones estrictas para los assets del Arquero No-Muerto.

Verifica:
1. Dimensiones exactas de public/assets/characters/archer.png (512x54) y arrow.png (16x8).
2. Canal alfa binario puro (0 o 255, sin semitransparencias ni halos).
3. Anclaje inferior estricto y = 53 (bbox[3] == 54) en poses 0, 1, 2, 3, 4, 5 y 7.
4. Despeje vertical libre de al menos 8 px en pose 6 (juggle): bbox[3] <= 46.
5. Paleta contenida (<= 12 colores consistentes).
6. Presencia de fulgor amatista/violeta en los ojos.
7. Generación correcta de la hoja de contacto docs/referencias/archer-contact-sheet.png.
"""

import os
import sys
from PIL import Image

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ARCHER_PNG = os.path.join(ROOT_DIR, "public", "assets", "characters", "archer.png")
ARROW_PNG = os.path.join(ROOT_DIR, "public", "assets", "characters", "arrow.png")
CONTACT_PNG = os.path.join(ROOT_DIR, "docs", "referencias", "archer-contact-sheet.png")

def test_archer_spritesheet():
    print("-> Verificando hoja de sprites archer.png...")
    assert os.path.isfile(ARCHER_PNG), f"Archivo no encontrado: {ARCHER_PNG}"
    img = Image.open(ARCHER_PNG)
    assert img.size == (512, 54), f"Dimensiones incorrectas: {img.size} != (512, 54)"
    assert img.mode == "RGBA", f"Modo incorrecto: {img.mode} != RGBA"

    # Canal alfa estrictamente binario y recolección de paleta
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
    assert len(colors) <= 12, f"Demasiados colores en la paleta: {len(colors)} > 12"
    print(f"   [OK] Dimensiones (512, 54), alfa 100% binario, {len(colors)} colores usados (<= 12)")

    # Fulgor amatista / violeta presente
    amethyst_colors = {(176, 64, 255), (232, 144, 255)}
    found_amethyst = colors.intersection(amethyst_colors)
    assert found_amethyst, f"No se encontró fulgor amatista en los ojos del arquero: {colors}"
    print(f"   [OK] Fulgor amatista detectado: {found_amethyst}")

    # Verificación de fotogramas individuales (64x54) y anclajes
    frame_names = ["0_idle", "1_walk1", "2_walk2", "3_aim", "4_shoot", "5_hurt", "6_juggle", "7_death"]
    for idx in range(8):
        frame = img.crop((idx * 64, 0, (idx + 1) * 64, 54))
        bbox = frame.getbbox()
        assert bbox is not None, f"Fotograma {idx} ({frame_names[idx]}) está completamente vacío"
        h = bbox[3] - bbox[1]
        w = bbox[2] - bbox[0]

        if idx in (0, 1, 2, 3, 4, 5, 7):
            assert bbox[3] == 54, f"Fallo de anclaje en frame {idx} ({frame_names[idx]}): bbox[3]={bbox[3]} != 54"
            print(f"   [OK] Frame {frame_names[idx]:<10}: bbox={bbox}, w={w}px, h={h}px, anclaje suelo y=53 (bbox[3]=54)")
        elif idx == 6:
            assert bbox[3] <= 46, f"Fallo de despeje aéreo en frame 6 (juggle): bbox[3]={bbox[3]} > 46"
            clearance = 54 - bbox[3]
            print(f"   [OK] Frame {frame_names[idx]:<10}: bbox={bbox}, w={w}px, h={h}px, despeje libre={clearance}px (>= 8px)")

def test_arrow_projectile():
    print("\n-> Verificando proyectil arrow.png...")
    assert os.path.isfile(ARROW_PNG), f"Archivo no encontrado: {ARROW_PNG}"
    img = Image.open(ARROW_PNG)
    assert img.size == (16, 8), f"Dimensiones incorrectas de flecha: {img.size} != (16, 8)"
    assert img.mode == "RGBA", f"Modo incorrecto: {img.mode} != RGBA"

    colors = set()
    alpha_violations = 0
    for y in range(img.height):
        for x in range(img.width):
            r, g, b, a = img.getpixel((x, y))
            if a not in (0, 255):
                alpha_violations += 1
            if a == 255:
                colors.add((r, g, b))

    assert alpha_violations == 0, f"Alfa no binario en proyectil: {alpha_violations} píxeles"
    bbox = img.getbbox()
    assert bbox is not None, "El sprite de la flecha está vacío"
    print(f"   [OK] Dimensiones (16, 8), alfa 100% binario, bbox={bbox}, {len(colors)} colores usados")

def test_contact_sheet():
    print("\n-> Verificando hoja de contacto archer-contact-sheet.png...")
    assert os.path.isfile(CONTACT_PNG), f"Archivo no encontrado: {CONTACT_PNG}"
    img = Image.open(CONTACT_PNG)
    assert img.size == (552, 288), f"Dimensiones de hoja de contacto: {img.size}"
    print(f"   [OK] Hoja de contacto 2x verificada ({img.size})")

def main():
    print("=== TEST DE ASERCIONES: GOW8B-ENEMY2-ART ===")
    test_archer_spritesheet()
    test_arrow_projectile()
    test_contact_sheet()
    print("\n>>> TODAS LAS ASERCIONES PASARON CON ÉXITO <<<")

if __name__ == "__main__":
    main()
