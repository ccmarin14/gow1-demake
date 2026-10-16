# Kratos · Tormenta del Egeo

> **Estado vigente (2026-10-15):** el código ejecutable es un shell de Phaser, TypeScript y Vite con un canvas lógico de **480×270**. Incluye una simulación determinista con un **jugador controlable con movimiento horizontal** (etapa 6, `GOW8B-MOVE-01`), un **harness DEV** (etapa 5, `GOW8B-DEV-01`), la **integración de assets provisionales** (fondo del Egeo y pose neutral de Kratos) mediante un manifest (etapa 6.5, `GOW8B-RES-01`), una **animación de carrera provisional** (etapa 7, `GOW8B-ANIM-01`, placeholder procedural), **salto y plataformas deterministas** (etapa 8, `GOW8B-JUMP-01`, arte de plataformas y pose aérea provisionales) y un **ataque ligero inicial** (etapa 9, `GOW8B-LIGHT-01`, con estado, hitbox, contacto y recuperación, arte provisional). Todavía no hay enemigos con IA, daño, muerte ni audio.

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

El shell implementa movimiento horizontal, salto y **ataque ligero provisional** con `J`. Pulsa `A` o `←` para ir a la izquierda y `D` o `→` para ir a la derecha. Pulsa `ESPACIO` para saltar; pulsa `J` para atacar. El ataque solo se inicia **en el suelo**; mantener `J` **no** repite el golpe ni lo reinicia, y mientras dura el ataque `ESPACIO` no inicia un salto. En reposo se muestra la pose neutral de Kratos; al moverse en el suelo (`|vx|` > 1 px/s) se reproduce un **ciclo de carrera provisional** derivado de la pose neutral, sincronizado con la velocidad y volteado con `facing`. **En el aire no se reproduce la carrera**: se muestra la pose neutral provisional y el sprite sigue la trayectoria del salto. El resto de teclas del mapa objetivo (`K`, `SHIFT`, `E`, `ESC`) están mapeadas pero todavía no producen efectos. El mapa de teclado completo, aún propuesto, está en [`docs/direccion-y-controles.md`](docs/direccion-y-controles.md). El jugador se dibuja con el sprite correspondiente (neutral o ciclo de carrera), anclado por la base, en concordancia con el anclaje de pies establecido.

## Harness DEV

En desarrollo (`pnpm dev`), el juego expone `window.__GOW8B` para inspección y reproducción controlada. No está disponible en el bundle de producción. Con la consola del navegador abierta:

```js
__GOW8B.scenarios()                 // ["empty","test","movement","platforms","combat"]
__GOW8B.loadScenario('movement')    // carga un escenario conocido (el jugador está en 'movement')
__GOW8B.loadScenario('platforms')   // suelo + dos plataformas a alturas distintas
__GOW8B.loadScenario('combat')      // jugador en el suelo + un objetivo ('dummy') al alcance
__GOW8B.snapshot()                  // { frame, timeMs, entities, input, checksum }
__GOW8B.step(30, ['move-right'])    // avanza 30 pasos fijos con acciones de dominio
__GOW8B.advance(16.67, [])          // avanza el tiempo con paso fijo (desacoplado del render)
__GOW8B.metrics()                   // fps, tiempo de frame, objetos y entidades activas
__GOW8B.record(); /* … */ __GOW8B.stop();   // graba una traza de entrada
__GOW8B.replay(traza)               // reproduce una traza (mismos checksums)
```

La simulación avanza en pasos fijos con un acumulador de microsegundos enteros, de modo que la misma traza produce el mismo estado por tick con independencia de la tasa de render.

## Movimiento horizontal (etapa 6)

El escenario `movement` contiene al jugador (`id: "player"`) con `x`, `vx` y `facing`. Cada tick fijo aplica una función pura de movimiento con aceleración, frenado y límites del mundo; todos los parámetros viven en `CONFIG.player`:

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

- Sin combate, enemigos, daño, esquiva ni audio.
- `light-attack`, `heavy-attack`, `dodge` y `context-action` están mapeados pero no tienen efecto.
- Las plataformas se dibujan de forma provisional (rectángulos sólidos, ver etapa 8); no hay arte definitivo de entorno transitable.
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


## Salto y plataformas (etapa 8)

La simulación incluye física vertical determinista: gravedad, salto, caída, aterrizaje y colisión de un solo sentido contra plataformas. El estado del jugador gana `vy`, `grounded`, `coyoteTicks` y `jumpBufferTicks`; todo es serializable y determinista (sin `Math.random` ni reloj de render). Los parámetros viven en `CONFIG.player.vertical`:

| Parámetro | Valor | Unidad |
| --- | --- | --- |
| `gravity` | 1000 | px/s² |
| `jumpSpeed` | 380 | px/s |
| `maxFallSpeed` | 560 | px/s |
| `coyoteMs` | 80 | ms |
| `jumpBufferMs` | 100 | ms |
| `topY` | 59 | px |

El apex del salto es de ~69 px, dentro del objetivo de 60–70 px. La ventana de **coyote time** (80 ms) permite saltar poco después de caminar fuera de un borde; el **jump buffer** (100 ms) ejecuta el salto al tocar suelo si `ESPACIO` se pulsó poco antes de aterrizar. El salto es **edge-trigger**: mantener `ESPACIO` pulsado no vuelve a saltar al aterrizar (sin bunny-hop).

Las superficies de apoyo se definen por escenario como `Platform = { x1, x2, yTop }`. El escenario `platforms` (nuevo y **predeterminado** para mostrar la etapa con controles normales) añade un suelo a `y = 262` de lado a lado y **dos plataformas a alturas distintas**:

| Superficie | Tramo `x` | `yTop` |
| --- | --- | --- |
| Suelo | `0`–`480` | `262` |
| Nivel 1 | `280`–`370` | `210` |
| Nivel 2 | `140`–`250` | `158` |

El escenario `movement` conserva su comportamiento con un suelo a `y = 262`; `empty` y `test` no tienen plataformas. La colisión es de **un solo sentido**: el jugador aterriza sobre una plataforma solo al caer (`vy ≥ 0`) y dentro de `[x1, x2]`; puede atravesarla de abajo hacia arriba y cae al caminar más allá de un borde. Los límites laterales (`minX`/`maxX`) y el techo se aplican por *clamp*.

### Presentación de plataformas (provisional)

Los rectángulos de las plataformas se dibujan en la escena con `this.add.rectangle(...)`, color y grosor en `CONFIG.presentation` (`platformColor`, `platformEdgeColor`, `platformThickness`), **sin copiar recursos de terceros**. Es arte provisional y reemplazable.

### Verticalidad encadenada (D-20)

Por simulación determinista se alcanza la plataforma del nivel 1 desde el suelo y, desde ella, la del nivel 2: la secuencia `['move-right','jump']` seguida de `'move-right'` aterriza en el nivel 1 (`y = 210`); tras frenar y saltar con `['move-left','jump']`, aterriza en el nivel 2 (`y = 158`).

### Evidencia visual (salto y apoyo en plataforma)

Capturas nativas 480×270 recortadas del canvas lógico:

- [`docs/referencias/captura-salto-480x270.png`](docs/referencias/captura-salto-480x270.png): en el aire ascendiendo, sin ciclo de carrera.
- [`docs/referencias/captura-plataforma-480x270.png`](docs/referencias/captura-plataforma-480x270.png): apoyado sobre la plataforma del nivel 1.

### Limitaciones de esta etapa

- El arte de las plataformas y la pose aérea es **provisional**; una etapa de arte posterior lo reemplazará.
- La colisión usa el centro `x` del jugador para decidir si está sobre la plataforma (el sprite puede sobresalir visualmente medio cuerpo del borde).
- Sin enemigos con IA, daño, esquiva, efectos ni audio (el ataque ligero se añade en la etapa 9, §Ataque ligero).


## Ataque ligero (etapa 9)

> **Arte provisional.** La retroalimentación del ataque (indicador de hitbox y marca de contacto) es **provisional**; el arte definitivo y el encadenamiento de combo se harán en etapas posteriores. La constante `PROVISIONAL_ART = true` en [`src/assets/manifest.ts`](src/assets/manifest.ts) gobierna el rótulo «Ataque ligero · provisional» en pantalla.

El jugador gana un **estado de ataque determinista** con fases. Pulsar `J` con el jugador **en el suelo** y sin ataque en curso inicia el golpe (disparo *edge-trigger*: mantener `J` no lo reinicia ni lo repite). Mientras el ataque está en curso, `jump` no inicia un salto nuevo; al terminar, el salto vuelve a estar disponible. No se puede iniciar otro golpe hasta que la fase vuelva a `none` (sin combos ni cancelaciones en esta etapa).

Ciclo completo con duraciones configurables (todas en `CONFIG.player.attack`, convertidas a ticks como en `vertical.ts`):

| Fase | Duración | Ticks aprox. |
| --- | --- | --- |
| `startup` | `startupMs` = 83 | 5 |
| `active` | `activeMs` = 67 | 4 |
| `recovery` | `recoveryMs` = 117 | 7 |

Desde la pulsación de `J` hasta el inicio de la fase `active` transcurren **≤6 ticks** (≤100 ms, PR-01).

| Parámetro | Valor | Unidad |
| --- | --- | --- |
| `hitboxOffsetX` | 18 | px (delante, según `facing`) |
| `hitboxWidth` | 24 | px |
| `hitboxHeight` | 16 | px |
| `targetHalfWidth` | 14 | px (semi-ancho del objetivo) |
| `targetHalfHeight` | 24 | px (semi-alto del objetivo, anclado a los pies) |

Durante la fase `active` existe una **hitbox delante** del jugador (offset/ancho/alto en `CONFIG`); **fuera de esa ventana no hay hitbox**. El módulo puro [`src/sim/attack.ts`](src/sim/attack.ts) (`stepAttack`, `computeAttackHitbox`) detecta **solapamiento** de la caja contra los objetivos del escenario (excluye al jugador). Un **mismo golpe no cuenta el mismo objetivo más de una vez**: los ids impactados se guardan en `EntityState.attackHits` (orden de registro) y se reinician al iniciar cada golpe. **Sin daño, retroceso ni muerte**: la entidad objetivo no cambia de estado.

El escenario `combat` contiene al jugador en el suelo (`x = 200`, `y = 262`) y una entidad objetivo (`id: "dummy"`, `x = 240`, `y = 262`) dentro del alcance. Los escenarios `empty`/`test`/`movement`/`platforms` se conservan.

### Presentación provisional (sin `jitter`)

- El `ShellScene` dibuja un **rectángulo indicador de hitbox** (color `CONFIG.presentation.hitboxColor`, alfa `hitboxAlpha`) mientras la fase es `active`.
- Las entidades objetivo se dibujan como **rectángulos provisionales** (`targetColor`); al registrarse el contacto se pintan con el color de contacto (`targetHitColor`), que sirve de **marca de contacto legible**.
- En el aire/plataformas se conserva el comportamiento de la etapa 8 (pose neutral sin ciclo de carrera). La animación `kratos-run` se sigue usando en el suelo.

### Evidencia visual

[`docs/referencias/captura-ataque-ligero-480x270.png`](docs/referencias/captura-ataque-ligero-480x270.png) muestra el frame en fase `active` con el indicador de hitbox y el objetivo tintado por el contacto.

### Limitaciones de esta etapa

- Sin ataque pesado, esquiva, enemigos con IA, daño, muerte ni bloqueo; `heavy-attack`/`dodge`/`context-action` siguen sin efecto.
- Sin combos ni cancelaciones: un golpe a la vez.
- El indicador de hitbox y los objetivos son arte **provisional**.


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
