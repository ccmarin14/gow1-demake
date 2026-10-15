# Kratos · Tormenta del Egeo

> **Estado vigente (2026-10-15):** el código ejecutable es un shell de Phaser, TypeScript y Vite con un canvas lógico de **480×270**. Incluye una simulación determinista con un **jugador controlable con movimiento horizontal** (etapa 6, `GOW8B-MOVE-01`), un **harness DEV** (etapa 5, `GOW8B-DEV-01`), la **integración de assets provisionales** (fondo del Egeo y pose neutral de Kratos) mediante un manifest (etapa 6.5, `GOW8B-RES-01`) y una **animación de carrera provisional** (etapa 7, `GOW8B-ANIM-01`, placeholder procedural derivado de la pose neutral). Todavía no hay salto, combate, enemigos ni audio.

## Visión futura

El objetivo futuro es una adaptación web de acción lateral horizontal con resolución interna de 480×270 y la historia del primer *God of War* de PS2. Esta decisión busca más detalle visual con un esfuerzo de producción manejable. El canvas deberá escalarse para ocupar una ventana amplia del navegador con pixelado nítido y sin suavizado; la resolución interna no limita su tamaño CSS. La lectura, el ritmo y la estructura lateral toman *God of War: Betrayal* como estudio de referencia. Se crearán recursos originales; las referencias externas se consultan solo como material de estudio y no se integran como assets.

Esta visión aún no está implementada. Las aprobaciones del prototipo previo se conservan como historial y no verifican el shell actual ni la futura adaptación.

## Ejecutar el shell

Requisitos: Node.js 22 o posterior y pnpm.

```sh
pnpm install
pnpm dev
```

Abre la URL local indicada por Vite; normalmente es `http://localhost:5173/`.

| Comando | Uso |
| --- | --- |
| `pnpm dev` | Sirve el shell local con recarga. |
| `pnpm exec tsc --noEmit` | Comprueba tipos sin generar archivos. |
| `pnpm build` | Comprueba TypeScript y genera el paquete del shell en `dist/`. |
| `pnpm preview` | Sirve localmente el paquete generado. |

No hay un script automatizado `test` configurado. El plan y el método de comprobación futuros están en [`docs/verificacion.md`](docs/verificacion.md).

## Controles

El shell ya implementa movimiento horizontal del jugador: pulsa `A` o `←` para ir a la izquierda y `D` o `→` para ir a la derecha. En reposo se muestra la pose neutral de Kratos; al moverse (`|vx|` > 1 px/s) se reproduce un **ciclo de carrera provisional** derivado de la pose neutral, sincronizado con la velocidad y volteado con `facing`. El resto de teclas del mapa objetivo (`ESPACIO`, `J`, `K`, `SHIFT`, `E`, `ESC`) están mapeadas pero todavía no producen efectos. El mapa de teclado completo, aún propuesto, está en [`docs/direccion-y-controles.md`](docs/direccion-y-controles.md). El jugador se dibuja con el sprite correspondiente (neutral o ciclo de carrera), anclado por la base, en concordancia con el anclaje de pies establecido.

## Harness DEV

En desarrollo (`pnpm dev`), el juego expone `window.__GOW8B` para inspección y reproducción controlada. No está disponible en el bundle de producción. Con la consola del navegador abierta:

```js
__GOW8B.scenarios()                 // ["empty", "test", "movement"]
__GOW8B.loadScenario('movement')    // carga un escenario conocido (el jugador está en 'movement')
__GOW8B.snapshot()                  // { frame, timeMs, entities, input, checksum }
__GOW8B.step(30, ['move-right'])    // avanza 30 pasos fijos con acciones de dominio
__GOW8B.advance(16.67, [])          // avanza el tiempo con paso fijo (desacoplado del render)
__GOW8B.metrics()                   // fps, tiempo de frame, objetos y entidades activas
__GOW8B.record(); /* … */ __GOW8B.stop();   // graba una traza de entrada
__GOW8B.replay(traza)               // reproduce una traza (mismos checksums)
```

La simulación avanza en pasos fijos con un acumulador de microsegundos enteros, de modo que la misma traza produce el mismo estado por tick con independencia de la tasa de render.

## Movimiento horizontal (etapa 6)

El escenario `movement` (predeterminado) contiene al jugador (`id: "player"`) con `x`, `vx` y `facing`. Cada tick fijo aplica una función pura de movimiento con aceleración, frenado y límites del mundo; todos los parámetros viven en `CONFIG.player`:

| Parámetro | Valor | Unidad |
| --- | --- | --- |
| `maxSpeed` | 140 | px/s |
| `accel` | 1050 | px/s² |
| `brake` | 1650 | px/s² |
| `minX` | 48.5 | px |
| `maxX` | 431.5 | px |

Valores provisionales: la velocidad arranca en 140 px/s (rango recomendado 136–150), la aceleración en 1050 px/s² (rango 900–1200) y el frenado en 1650 px/s² (rango 1500–1800, siempre mayor que la aceleración). Se revisarán al integrar arte y niveles.

Los límites `minX`/`maxX` se derivan del ancho del sprite de Kratos (97 px, mitad 48.5): en ambos extremos el sprite queda **totalmente visible** dentro del canvas de 480 px. En el escenario `movement` el jugador aparece con centro `x = 240` y apoyo de pies `y = 262`, sobre la cubierta.

## Assets integrados (etapa 6.5)

Los assets aprobados de etapas 2 y 3 se sirven bajo `public/assets/` y se precargan a través del manifest [`src/assets/manifest.ts`](src/assets/manifest.ts), que agrupa **claves estables por dominio** (`characters`, `environment`, `ui`, `fx`, `audio`, `data`). La escena no usa rutas de archivo dispersas: recorre el manifest y carga cada entrada.

| Dominio | Clave | Archivo | Dimensiones |
| --- | --- | --- | --- |
| `environment` | `egeo-fondo` | `public/assets/environment/egeo-fondo.png` | 480×270 |
| `characters` | `kratos-neutral` | `public/assets/characters/kratos-neutral.png` | 97×59 |
| `characters` | `kratos-run` | `public/assets/characters/kratos-run.png` | 388×59 (4 cuadros × 97×59) |

El fondo se dibuja en `(0,0)` a escala 1, con origen `(0,0)`, nearest-neighbor (por `pixelArt: true`) y **sin tinte**. El jugador se ancla con origen `(0.5, 1)` (base-centro) y se voltea horizontalmente cuando `facing = -1`.

### Procedimiento de copia y recorte (reproducible)

El fondo es una **copia byte a byte** del asset aprobado:

```sh
cp docs/referencias/egeo-fondo-480x270.png public/assets/environment/egeo-fondo.png
```

La pose neutral se obtiene **recortando** los bounds alfa `(192,204)–(288,262)` (97×59) con Pillow 10.2.0, preservando el modo indexado `P` y su tabla de transparencia:

```sh
python3 -c "from PIL import Image; Image.open('docs/referencias/kratos-neutral-480x270.png').crop((192,204,289,263)).save('public/assets/characters/kratos-neutral.png')"
```

Los PNG fuente en `docs/referencias/` quedan intactos (verificado por SHA-256). No se copian recursos de terceros.

### Limitaciones de esta etapa

- Sin salto, combate, enemigos, colisiones ni gravedad; el movimiento es horizontal y la carrera usa un ciclo provisional (ver abajo).
- `jump` y los ataques están mapeados pero no tienen efecto.
- El movimiento es solo horizontal dentro de los límites del mundo; no hay suelos ni plataformas reales (la cubierta es visual).
- Los assets son provisionales y no están etiquetados como finales.

## Animación de carrera provisional (etapa 7)

> **Placeholder procedural provisional.** El ciclo de carrera **no es arte final**. Deriva de la pose neutral `kratos-neutral.png` con un balanceo/inclinación mínima solo para cablear y probar el sistema de animación. La constante `PROVISIONAL_ART = true` en [`src/assets/manifest.ts`](src/assets/manifest.ts) gobierna el rótulo «Carrera · placeholder provisional» en pantalla y quedará en `false` cuando exista arte definitivo. Una etapa de arte posterior reemplazará estos cuadros.

- **Cuadros:** 4, en la misma rejilla 97×59 y con la fila de pies anclada. La silueta aparente varía como máximo 1 px en el borde izquierdo (cuadros 2 y 3 quedan en 96 px), coherente con la inclinación mínima del placeholder.
- **Clave y carga:** spritesheet `kratos-run` (dominio `characters`) en `public/assets/characters/kratos-run.png` (388×59 = 4×97×59), cargado por el manifest como `spritesheet` (sin rutas dispersas).
- **Sincronía:** en reposo (`|vx| ≤ idleSpeedThreshold`) se muestra `kratos-neutral`; con `|vx| > idleSpeedThreshold` se reproduce `kratos-run` con volteo según `facing`. La cadencia escala con `|vx|` entre `frameRate` y `maxFrameRate` (configuración en `CONFIG.player.run`).
- **Hashes SHA-256:** `kratos-run.png` = `78f68cf2e77ce5a42a4f81d1afa714d01281d7feeea0959737dbb43d85b7e2ea`; `kratos-neutral.png` = `df52a7fc298e6fd41241f555cef8f4d2dd00a6b81034a333872a55b4f9390c4a`.

### Procedimiento de derivación (reproducible)

```sh
python3 scripts/gen-run-frames.py   # -> public/assets/characters/kratos-run.png (97×N x 59)
```

El script (Pillow, ya disponible; sin dependencias nuevas) lee la pose neutral indexada (`P`) y, por columnas, aplica un desplazamiento interpolado entre cabeza, cadera y pies (fila inferior anclada). Deja la paleta y la transparencia intactas. Parámetros en el propio script: `FRAMES = ((1,0),(1,-1),(0,1),(-1,1))` como `(head_dx, hip_dx)`.

### Evidencia visual (reposo ↔ carrera ↔ volteo)

Capturas nativas 480×270 recortadas del canvas lógico:

- [`docs/referencias/captura-carrera-idle-480x270.png`](docs/referencias/captura-carrera-idle-480x270.png): reposo (`kratos-neutral`, sin animación).
- [`docs/referencias/captura-carrera-derecha-480x270.png`](docs/referencias/captura-carrera-derecha-480x270.png): carrera hacia la derecha (`kratos-run`, `flipX=false`).
- [`docs/referencias/captura-carrera-izquierda-480x270.png`](docs/referencias/captura-carrera-izquierda-480x270.png): carrera hacia la izquierda (`kratos-run`, `flipX=true`).


## Documentación

- [`docs/arquitectura.md`](docs/arquitectura.md): límites del shell actual y arquitectura objetivo, todavía no implementada.
- [`docs/direccion-y-controles.md`](docs/direccion-y-controles.md): dirección del juego futuro y mapa de teclado propuesto.
- [`docs/adaptacion-narrativa-y-niveles.md`](docs/adaptacion-narrativa-y-niveles.md): adaptación lateral propuesta de la historia de *God of War* (2005).
- [`docs/guia-visual-betrayal-pixel-art-v2.md`](docs/guia-visual-betrayal-pixel-art-v2.md): criterio visual vigente para una etapa futura; no hay muestra activa.
- [`docs/guia-visual-betrayal-pixel-art.md`](docs/guia-visual-betrayal-pixel-art.md): guía anterior conservada como historial.
- [`docs/referencias/god-of-war-betrayal.md`](docs/referencias/god-of-war-betrayal.md): tablero de 18 imágenes y fuentes externas de estudio, no assets del juego.
- [`docs/decisiones.md`](docs/decisiones.md): decisiones vigentes y decisiones históricas descartadas.
- [`docs/verificacion.md`](docs/verificacion.md): estado actual, plan propuesto y registro histórico de verificaciones.
- [`docs/aprendizajes-del-proceso.md`](docs/aprendizajes-del-proceso.md): lecciones transferibles registradas durante el trabajo.
