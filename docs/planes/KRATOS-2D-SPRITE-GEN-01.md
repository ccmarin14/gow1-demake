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

## Herramienta

- `scripts/sprite-gen/process_generated_sprite.py ENTRADA.jpg SALIDA.png [--colors N] [--scale S]`: clave de croma magenta, reducción con filtro de caja a escala fija (`56/870`), alfa binario, cuantización, pies en `y = 58`.
- Material de trabajo (sin versionar): `scratch/sprite-gen/` (`compare-v1..v5.png`, `idle-v*.jpg`, `run-v*.jpg`, recortes de referencia de las hojas).
