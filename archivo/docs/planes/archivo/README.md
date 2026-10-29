# Planes archivados

Estos planes describen el pipeline de arte de personajes **anterior** a la decisión
`D-25` (ver [`../decisiones.md`](../decisiones.md)). Se conservan como registro
histórico; **no son fuente de verdad** y su método está prohibido hoy.

## Por qué están acá

`D-25` establece que los grids ASCII en `grids/` son la fuente de verdad del pixel
art de personajes y que el PNG es un artefacto derivado. Además, `AGENTS.md` prohíbe
generar o modificar sprites humanoides con trazos vectoriales procedurales.

Los planes de esta carpeta documentan exactamente los enfoques que quedaron
prohibidos:

| Plan | Enfoque | Estado |
| --- | --- | --- |
| `KRATOS-2D-SPRITE-GEN-01` | Generación procedural con `ImageDraw` | Sustituido por D-25 |
| `KRATOS-ART-MODEL-01` | Modelo maestro por polígonos | Sustituido por D-25 |
| `KRATOS-ART-UPGRADE-12COL-01` | Rig cinemático a 60 Hz | Sustituido por D-25 |
| `KRATOS-FACE-POLISH-01` | Esculpido de rostro sobre el rig | Sustituido por D-25 |
| `KRATOS-SPRITE-MAESTRO-01` | Sprite maestro procedural | Sustituido por D-25 |
| `KRATOS-MODULAR-PIXEL-ART-RIG-01` | Rig modular *cut-out* | Archivado por D-25 como viabilidad |
| `PLAN_MAESTRO_KRATOS_PIXEL_ART_PRO` | Plan maestro del pipeline procedural | Sustituido por D-25 |
| `CORRECCION-ANIMACION-KRATOS-01` | Correcciones sobre el rig cinemático | Sin objeto tras D-25 |

El plan vigente es [`../PIXEL-ART-ASCII-MASTER-01.md`](../PIXEL-ART-ASCII-MASTER-01.md).

## Los scripts

Los generadores correspondientes viven en `scripts/archivo/`:

- `gen-kratos-anim.py` — generaba las hojas `kratos-*.png` con trazado procedural.
  **Su salida es el arte que hoy está en el juego y que se está reemplazando.**
- `build-kratos-modular-sample.py` y `test_kratos_modular_sample.py` — rig modular
  *cut-out*, archivado por D-25.

No se borraron porque son la única forma de regenerar las hojas actuales mientras
la migración ASCII no esté completa. Cuando `public/assets/characters/kratos-*.png`
provenga de `grids/`, esta carpeta puede eliminarse.
