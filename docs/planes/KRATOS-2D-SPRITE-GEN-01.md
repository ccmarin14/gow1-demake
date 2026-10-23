# `KRATOS-2D-SPRITE-GEN-01` — Sprites de Kratos (GoW 1) generados como pixel art 2D

- **Fecha:** 2026-10-22
- **Estado:** **PAUSADO** (cuota del generador de imágenes agotada; reinicio estimado ~4.5 h). Nada integrado al juego.
- **Rama:** `arte/KRATOS-2D-SPRITE-GEN-01`
- **Motivo:** el generador procedural de polígonos (`scripts/gen-kratos-anim.py`) produjo un maniquí que la usuaria no reconoce como Kratos. Se descartó el pipeline 3D (la usuaria no lo quiere) y se probó generar los cuadros con el subagente `image-generator`.

## Qué se probó y qué se aprendió

- El generador mantiene el diseño del personaje entre poses (idle y carrera) si se le pasa la imagen anterior como referencia.
- Diseño acordado: Kratos de GoW 1, torso y hombros desnudos, sin hombrera; tatuaje rojo de Ares; perilla; brazales con cadenas; cinturón y faldón con greca; grebas; dos Cuchillas del Caos.
- **Forma correcta de las hojas** (medida sobre `kratos-neutral.png` ampliado): media luna ancha en forma de sonrisa, gruesa en el centro (~3.5:1 largo/grueso), punta aguda hacia arriba, sin gancho de ancla, sin mango largo, ~25-30 % del ancho de la figura, abiertas simétricas a los lados. Las descripciones solo con palabras ("delgadas", "con gancho") fallaron; funcionó pasar recortes ampliados del original como referencia.
- Última entrega: `idle-v5` (hojas bien, pero guardia asimétrica: una hoja cruzada sobre las piernas, otra alzada) y `run-v4` (aprobable).

## Pendiente para retomar

1. Idle con guardia simétrica (hojas abiertas a ambos lados como el original) y resto de poses: respiración, salto, caída, rodada, derrape y cuadros de ataque, con el mismo diseño y la **misma escala fija**.
2. **Decisión de la usuaria pendiente:** ampliar la paleta de 6 a ~12 colores (los sprites generados usan ~11). Sin ella no se puede integrar.
3. Integración, medición (cuadros, anclaje y=58, tamaño 97x59), auditoría independiente.

## Herramientas (listas y probadas con idle-v5 y run-v4)

Flujo para cada tanda de poses:

1. `scripts/sprite-gen/build_shared_palette.py PALETA.png IMG1.jpg IMG2.jpg ... --colors 12 --accent '#b03028' --accent '#ff8c1a'`: una **paleta compartida** para todas las poses. Reserva los acentos (rojo del tatuaje, naranja de runas), que si no se pierden al promediar al reducir.
2. `scripts/sprite-gen/process_generated_sprite.py ENTRADA.jpg SALIDA.png --palette PALETA.png`: clave de croma magenta, reduccion con filtro de caja a escala fija (`56/870`), alfa binario, mapeo a la paleta compartida, pies en `y = 58`.
3. `scripts/sprite-gen/build_spritesheet.py HOJA.png CUADRO1.png CUADRO2.png ... --max-colors 12`: arma la hoja y **valida** tamano 97x59 por cuadro, alfa binario, pies anclados y maximo de colores.

**Aprendizaje de esta prueba:** cuantizar cada pose por separado dio 22 colores en la hoja (la validacion lo detecto); la paleta debe fijarse una vez para todo el conjunto. Y el median-cut puro descarta el rojo y el naranja por ser pocos pixeles, por lo que hay que reservarlos como acentos. La paleta compartida debe recalcularse al llegar las poses finales (hoy se probo solo con idle y carrera).

Material de trabajo (sin versionar): `scratch/sprite-gen/` (`compare-*.png`, `idle-v*.jpg`, `run-v*.jpg`, recortes de referencia de las hojas, `shared-palette.png`).

## Contrato de poses y plantilla de pedido (preparado sin generador)

El contrato entre el arte y el código está en [`scripts/sprite-gen/poses.json`](../../scripts/sprite-gen/poses.json): **22 cuadros** en 5 hojas, con el uso de cada índice en el juego. No cambiar ese orden sin cambiar el código (`src/scene/ShellScene.ts`, `CONFIG.player.attack.moves[*].poseFrame`, `CONFIG.player.attack.hands`).

Comprobar avance: `python3 scripts/sprite-gen/assemble.py --check`. Ensamblar lo disponible (paleta compartida → cuadros → hojas validadas en `art-src/kratos-2d/out/`, sin tocar `public/assets/`): `python3 scripts/sprite-gen/assemble.py`. Las imágenes aprobadas se guardan en `art-src/kratos-2d/raw/<id>.jpg`; `frames/` y `out/` son derivados y no se versionan. Hoy: **1/22** (`run_0`, candidata; viene de `run-v4`).

### Reglas de integración que el arte debe respetar

1. **Hojas completas o nada.** No mezclar cuadros nuevos con el maniquí viejo dentro de una hoja; se integran hoja por hoja cuando está completa.
2. **Armas del ataque (lección de ART-POLISH-02).** `WeaponLayer` dibuja la hoja de la mano que golpea desde el puño. En los cuadros de ataque marcados `rear_only` el sprite **no debe llevar la hoja de la mano delantera** (solo la trasera); en caso contrario aparecen 3 hojas. `atk_0` y `atk_2` llevan ambas. El cuadro `atk_6` alterna la mano (`rear_only_opposite`).
3. **Puños.** Al integrar hay que **remedir** el centro del puño de cada cuadro de ataque y actualizar `CONFIG.player.attack.hands` (hoy: 1 → 13,-33; 2 → 26,-31; 3 → 14,-33; 4 → 7,-33; 5 → 13,-33; 6 → 13,-33). La cadena debe nacer del puño visible.
4. **Anclaje.** Fila de pies en `y = 58`, cuadro 97×59, alfa binario, ≤ 12 colores: lo valida `build_spritesheet.py`.
5. **Sobrante de código.** Si el arte nuevo cambia el número de cuadros de una hoja, ajustar `CONFIG.player.{idle,run,air}.frames` y `createLoopAnimation` (carrera: ciclo 0–5, derrape fijo en el índice 6).

### Plantilla de pedido al `image-generator`

Adjuntar siempre como referencia: la imagen aprobada del personaje (hoy `art-src/kratos-2d/raw/run_0.jpg`), `art-src/kratos-2d/ref/neutral-x10.png` y los recortes `art-src/kratos-2d/ref/blade-left-x24.png` / `blade-right-x24.png`.

> Mismo personaje exacto que la referencia (Kratos de God of War 1: torso y hombros desnudos, sin hombrera, piel gris-ceniza, tatuaje rojo de Ares, perilla negra, brazales con cadenas, cinturón de cuero con faldón y greca, grebas). Pixel art 16 bits de píxeles grandes y nítidos, contorno negro, sin antialiasing ni degradados. Hojas: media luna ancha en sonrisa, gruesa en el centro (≈3.5:1), punta aguda hacia arriba, acero claro `#e8e8e8` con filo blanco y runas naranja `#ff8c1a`. Lienzo 1024×1024, fondo magenta plano `#FF00FF`, vista lateral mirando a la DERECHA, pies en la misma línea inferior, personaje de ≈870 px de alto. POSE: *(copiar el campo `pose` de `poses.json`)*. HOJAS: *(copiar el campo `blades`)*. Guardar como `<id>`.

Pedir **varias poses por tanda** (ideal una hoja completa) para ahorrar cuota, y revisar cada tanda contra el original antes de seguir.
