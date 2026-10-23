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
