# PIXEL-ART-ASCII-MASTER-01 — Grids ASCII como fuente de verdad del pixel art

> **Estado:** **Kratos desde cero con ASCII.** Todo lo fuera de `grids/kratos/` fue archivado. Hidra pospuesto hasta terminar Kratos. Kratos tiene **6 cuadros activos**: `master.txt` (neutral), `idle-01` y `run-00..03`. Los clips `idle` y `run` están **conectados al juego y medidos en navegador**. El 2026-10-27 se archivaron **12 cuadros** (`run-00..05`, `air-00/01`, `attack-00..03`): se midió que cambiaban solo una extremidad y no desplazaban el pie. `air`, `attack`, `roll` y `guard` quedan **congelados y fuera de alcance** hasta que la usuaria los autorice. Los 10 cuadros derivados por traslación (`idle-00`, `run-00..08` viejos) se borraron el 2026-10-26: no eran arte.
> **Decisión que implementa:** el pixel art de personajes se produce a partir de grids ASCII; el PNG es un artefacto derivado, nunca editado a mano. Solo lo generado desde `grids/` va al juego.

## 1. Objetivo

Sustituir el linaje actual de hojas PNG generadas por scripts ad-hoc por un pipeline con **una sola fuente de verdad textual** para **Kratos e Hidra**. Todo lo que no provenga de `grids/` se archiva. Se parte **desde cero** con ASCII como única fuente de verdad. Capaz de garantizar por construcción lo que hoy falla: un único modelo anatómico por personaje, una única paleta, y cuadros de animación derivados del mismo maestro.

## 2. Alcance

**Dentro:** formato de grid, paleta, anclas, manifiesto, invariantes verificables, estructura de archivos, criterios de aceptación y flujo de aprobación.

**Fuera:** generar arte en esta fase, integrar nada al runtime, tocar `src/`, cambiar el motor, o reemplazar las hojas actuales. Las hojas actuales quedan **congeladas** hasta que exista un maestro aprobado.

## 3. Por qué ASCII y no el rigging modular

| Criterio | Grid ASCII | Rig modular cut-out |
| --- | --- | --- |
| Unidad de trabajo | Matriz completa dibujada | Piezas recortadas que rotan |
| Riesgo de mutación | Bajo: la cabeza se copia carácter a carácter | Alto: cada rotación redibuja el contorno |
| Verificable sin visión | Sí: el grid se lee y se compara en diff | No: hay que mirar el PNG resultante |
| Falla conocida | Ninguna observada | Piernas de palito y fragmentos flotantes (v1 rechazado, v2 solo viabilidad) |
| Reproducibilidad | Exacta (mismo texto → mismo hash) | Depende de la composición y el remuestreo |

El rig modular se archiva como evidencia de viabilidad (`scratch/kratos_modular_sample/`); no se usa como base.

### 3.1 Por qué cada cuadro se dibuja y no se deriva la animación

La unidad de arte es **el cuadro completo**. No hay interpolación, no hay traslación de piezas, no hay generación paramétrica de poses. Cada cuadro nuevo es un grid dibujado desde cero contra la anatomía del maestro.

Esto no es una preferencia estética: ya se probó lo contrario. La animación derivada por traslación de bloques (`idle-00`, `run-00..08` viejos) se retiró el 2026-10-26 (**V-15**): producía cuadros repetidos y anatomía mutante en la pierna. Se borraron como arte.

El razonamiento detrás de la regla:

| Pregunta | Respuesta |
| --- | --- |
| ¿Qué es la animación en este juego? | Una lista ordenada de claves de textura que el motor recorre. Nada más. |
| ¿Dónde está el arte entonces? | En los cuadros. Si los cuadros son buenos, el clip es bueno; si son derivados, el clip es malo aunque el timing sea perfecto. |
| ¿Qué se puede generar en código? | Solo lo que **no es cuerpo**: cuchillas, cadenas, estela, partículas (`WeaponLayer`, `VfxLayer`). Eso no se dibuja nunca. |
| ¿Por qué no generar el cuerpo también? | Un brazo dibujado píxel por píxel se lee; un brazo calculado con `sin()` no. La invariante del proyecto lo prohíbe explícitamente. |

Consecuencia práctica: el costo de un cuadro es tiempo de dibujo. Por eso cada lote se define por **poses clave** (el mínimo que sostiene el movimiento) y no se agregan cuadros "porque sí": un intermedio se dibuja recién cuando el clip ya está conectado y se midió que falta.

### 3.2 Qué aporta y qué cuesta el ASCII como formato fuente

**Aporta:** el grid se lee y se compara como código (diff por carácter), se verifica con invariantes automáticas sin mirar el PNG, se rasteriza determinista (mismo texto → mismo hash) y permite variantes por cambio de paleta sin redibujar.

**Cuesta:** mientras se dibuja no hay feedback visual. La grilla de texto no se parece a la imagen final. Por eso el rasterizador, la hoja de contacto y la medición en navegador **no son burocracia**: son los ojos que el formato no da. Todo juicio sobre el dibujo se hace sobre el PNG a 2× o 4×, nunca sobre el `.txt`.

## 4. Estructura de archivos

```text
grids/
  kratos/
    manifest.json          # cuadros, anclas, regiones anatómicas, compuertas, archivados
    master.txt             # anatomía de referencia (97×59), único maestro
    idle-01.txt            # dibujado: pecho expandido 8 celdas
    run-00.txt ... run-03.txt   # 4 poses dibujadas, conectadas al juego
    archivo/               # 12 cuadros rechazados el 2026-10-27 (run-00..05, air, attack)
palette/
  master.json              # char → hex, fuente única de color
public/assets/characters/  # salida del rasterizador (derivada, no se edita)
  archivo/                 # PNGs de los cuadros rechazados
scripts/
  png_to_ascii.py          # importador de arranque: PNG → grid (bootstrap, no es la vía de producción)
  ascii_to_png.py          # rasterizador determinista
  verify_ascii_master.py   # verificador de invariantes I1–I8
```

`roll` y `guard` no tienen grid: caen al cuadro estático. `air` y `attack` no tienen cuadro activo
(motivo en §10, lotes 2 y 3).

## 5. Formato del grid

| Regla | Valor |
| --- | --- |
| Codificación | UTF-8 sin BOM, saltos `\n` |
| Unidad | 1 carácter = 1 píxel |
| Tamaño de cuadro | Exacto, declarado en el manifiesto (Kratos: 97×59) |
| Transparencia | `.` (punto) — nunca espacio, para no depender de recorte de líneas |
| Color | Un carácter por entrada de `palette/master.json` |
| Filas | Sin líneas en blanco; todas de ancho idéntico |
| Comentarios | Prohibidos dentro del grid; los metadatos viven en el manifiesto |

Ejemplo de **forma** (no de anatomía): un grid de 8×4 con dos colores y transparencia.

```text
........
.aaaaaa.
.abbbba.
.a....a.
```

## 6. Paleta

`palette/master.json` es la **única** fuente de color:

```json
{
  "version": 1,
  "colors": {
    "a": "#1b0717",
    "b": "#b03028",
    "c": "#b48838"
  },
  "max_colors": 12
}
```

- Ningún grid puede usar un carácter ausente de la paleta.
- El rasterizador **falla** si el resultado excede `max_colors`.
- La paleta se versiona; un cambio de paleta es un cambio de arte y requiere re-aprobación.
- Se retiran las paletas duplicadas por script generador (V-03).

## 7. Manifiesto del personaje

`grids/kratos/manifest.json` declara, como mínimo:

```json
{
  "character": "kratos",
  "frame_size": { "w": 97, "h": 59 },
  "master": "master.txt",
  "regions": {
    "head":       { "y0": 14, "y1": 24 },
    "torso_core": { "y0": 25, "y1": 34 },
    "legs":       { "y0": 35, "y1": 58 }
  },
  "continuity": ["head", "torso_core"],
  "anchors": {
    "ground": 58,
    "center_of_mass": { "x": 48, "y": 30 },
    "hand_left":  { "x0": 16, "y0": 27, "x1": 25, "y1": 34 },
    "hand_right": { "x0": 70, "y0": 29, "x1": 80, "y1": 38 }
  },
  "frames": [
    { "file": "neutral-00.txt", "state": "neutral", "grounded": true, "head_offset": [0, 0] }
  ]
}
```

`continuity` limita el invariante I4 al núcleo estático del cuerpo: la cabeza y el torso superior. Brazos y piernas quedan fuera porque su posición cambia por diseño en cada cuadro. En P3 la medición mostró que **solo `head` es una huella rectangular limpia** (filas 14–24, x 40–57); el torso superior no lo es —sus filas contienen además los brazos, con huecos entre brazo y pecho—, así que la lista vigente es `["head"]` y el torso se mide pero no se declara invariante.

`head_offset` permite declarar la inclinación del torso sin romper el invariante de continuidad: el desplazamiento es explícito, no accidental.

**Restricción descubierta en P3:** I4 no solo compara el bloque contra el maestro en el offset declarado, también rechaza cualquier píxel opaco en las filas de la banda que caiga fuera de `x0..x1` ("stray"). Por eso `head_offset` solo es viable **hacia arriba**: subir la banda deja libre la fila que se desocupa abajo y la comprobación pasa, mientras que bajarla obligaría a que la fila siguiente fuera idéntica a la última de la banda, cosa que no ocurre porque ahí empiezan los hombros. Un bob hacia abajo exige antes sacar la sombra de contacto del sprite (V-12). El chequeo de "stray" escanea solo ±14 px alrededor de la región: un puño levantado a la altura de la cabeza ya no se marca como deriva (corregido el 2026-10-27).

**Manifiesto vigente (2026-10-27).** Además de `regions` y `continuity: ["head"]`, el `manifest.json` contiene:

- `anatomy`: medidas del maestro que todo cuadro debe poseer — centro `x=48`, suelo `y=58`, cajas de cabeza/torso/faldón, tallos de pierna (`near`/`far`), anchos (`thigh 6`, `calf 5`, `ankle 4`), pies, hombros, puños con su resplandor `b`, cadenas y fila de sombra.
- `motion_gate` e `clip_gate`: umbrales de I8 (bandas que deben cambiar, regiones que no, alternancia de apoyo, recorrido del pie, `foot_row: 57`).
- `archived_frames`: fecha, motivo y **métricas por cuadro** de lo rechazado. Es evidencia, no una nota de color.
- Las filas `run-00..03` declaran `"motion": true` y su pose en `note`.

## 8. Invariantes verificables

Cada invariante tiene un comando que lo comprueba y un mensaje de fallo. Si falla uno, la fase no se aprueba.

| ID | Invariante | Cómo se verifica |
| --- | --- | --- |
| **I1** | Determinismo: mismo grid + misma paleta → mismo hash | Rasterizar dos veces, comparar sha256 |
| **I2** | Paleta cerrada: todo carácter existe en la paleta; ≤ 12 colores por hoja | Validación del rasterizador |
| **I3** | Alfa binario: solo 0 o 255 | Inspección del PNG |
| **I4** | Continuidad anatómica: las regiones declaradas en `continuity` son **idénticas al maestro, desplazadas según `head_offset`**. La región describe la huella del maestro; en el cuadro esa huella aparece en `(x+dx, y+dy)` y esa banda no puede contener píxeles fuera de ella (sin fragmentos huérfanos) | Comparación carácter a carácter por región, sobre la ventana desplazada, más conteo de píxeles fuera de la huella |
| **I5** | Armas: cada zona de mano **declarada por pose** (`hand_zones`) contiene píxeles opacos y ninguna contiene dos cuchillas. Sin zonas declaradas el verificador informa `NOT EVALUATED`, nunca `PASS`; el conteo de cuchillas requiere `blade_chars` semánticos en la paleta | Conteo por zona declarada; `NOT EVALUATED` cuando la pose no declara zona |
| **I6** | Anclaje: en todo cuadro `grounded: true`, el píxel inferior del alfa está en `y = ground` | Bounding box del alfa |
| **I7** | Tamaño: cada grid mide exactamente `frame_size`, todas las filas del mismo ancho | Validación de forma |
| **I8** | Movimiento real: un cuadro que declara `motion: true` **cambia bandas del cuerpo** y no toca las regiones congeladas. `motion_gate`: ≥250 px distintos del maestro en total; ≥70/60/60 px en las bandas `legs`, `near_arm`, `far_arm`; 0 px de cambio en `head`, `torso_core` y `shadow`. `clip_gate`: entre cuadros consecutivos ≥60 px de cambio, el apoyo alterna entre pie cercano y lejano, y el pie apoyado recorre ≥6 px de verdad (`foot_row: 57`, porque la fila 58 es la sombra cocida y toca el suelo en todos) | `count_diff` sobre el grid contra `master.txt`, más `evaluate_motion` y `evaluate_clip` por clip declarado |

## 9. Pipeline

```text
editar grid .txt  →  validar (I2, I7)  →  rasterizar  →  verificar (I1, I3–I6)  →  evidencia  →  aprobación humana
```

- El rasterizador no interpola, no hace antialiasing y no redimensiona.
- La salida va a `public/assets/characters/`; el PNG **nunca** se edita a mano.
- Cualquier PNG editado a mano se considera arte huérfano y se descarta en la siguiente rasterización.

## 10. Criterios de aceptación por fase

### P2 — Reinicio desde cero (2026-10-26)

La usuaria ordenó descartar todo asset de Kratos que no provenga de `grids/`. Los grids previos (maestro, `idle`, `run`) también se descartaron: eran una importación del PNG viejo, no arte nuevo.

- [x] Todo PNG de Kratos movido a `public/assets/characters/archivo/` (6 archivos). `public/assets/characters/` ya no tiene activos de Kratos fuera de `grids/`.
- [x] `grids/kratos/` reiniciado con `manifest.json` (97×59, `regions.head/torso_core/legs`, `continuity: ["head"]`, `anchors.ground: 58`), `master.txt` y `neutral-00.txt`.
- [x] Rasterizado reproducible: `ascii_to_png.py` → `kratos-neutral.png` 97×59.
- [x] Invariantes: I1, I2, I3, I4, I6, I7 **PASS**; I5 `NOT EVALUATED`; `RESULT: PARTIAL`, exit 2.
- [ ] Dibujo verificado en navegador: offset exacto y coincidencia de color contra el PNG derivado, exacta salvo cuando una cadena de `WeaponLayer` cruza el sprite (evidencia en `docs/estado-verificado.md` §4.3). **Reabierto el 2026-10-26:** la animación derivada por traslación de bloques se retiró (V-15); falta dibujar los cuadros reales.- [ ] La usuaria decide si el maestro nuevo es aceptable.

**Estado real:** el maestro vigente es `grids/kratos/master.txt` (sha256 `1f4591d532cb11da…`). No es una copia del grid anterior: contiene las correcciones de cabeza de P3.1 (perfil derecho, corona de 5 celdas, ojo `a` entre `j`, nariz `d`). La aprobación estética sigue pendiente y no bloquea. Ojo con el hash: `744743fb759d7ecf` es el del **PNG rasterizado** `kratos-neutral.png`, no el del `.txt`; el documento lo confundió.

### P3 — Ciclo `idle` + `run` — **`idle` y `run` conectados; `air`/`attack` archivados (2026-10-27)**

Kratos tiene **6 cuadros activos** y los dos clips están creados en `ShellScene`, con animación propia:
`kratos-idle` (2 cuadros) y `kratos-run` (4 cuadros). `air`, `attack`, `roll` y `guard` caen al cuadro
estático: los dos primeros fueron **archivados** el 2026-10-27 (lotes 2 y 3) y los otros dos nunca se
especificaron.

- [x] `idle` como cuadros dibujados: `master.txt` (el maestro) e `idle-01`. `idle-01` está dibujado completo: el pecho y los hombros se expanden 1 px por lado en `y25..y28` (8 celdas nuevas, +0,8 % de masa), la cabeza queda byte-idéntica (`I4` PASS, sin costura de cuello) y los pies siguen apoyados (`I6` PASS). Medido en navegador: alterna 2 cuadros a **983 ms** por cuadro. **Aprobación estética pendiente** (deuda #8). Lo que sigue reabierto es un cuadro de inhalación más profundo, no el método.
- [x] `run` como 4 cuadros dibujados, uno por grid: `run-00..03` (ver [lote 1](#lote-1--run-4-cuadros-2026-10-27)). `I1`–`I4`, `I6`, `I7` y `I8` PASS en los cuatro; `I5` `NOT EVALUATED`.
- [x] Conectar el clip `kratos-run` (`RUN_KEYS`, `createPlayerAnimations`, `CONFIG.player.run`). **Hecho y medido** el 2026-10-27: 4 claves de textura, `frames: 4`, `frameRate: 24`, `stridePx: 24`. Medido por CDP con la tecla `→` en el escenario `platforms`: el clip alterna 0→1→2→3→0 sin atascarse, ciclo de **166–183 ms** (≈170 ms, ~42 ms por pose) y clasificación por 37 celdas sonda con **37/37** coincidencias en el cuadro correcto. Evidencia en `docs/estado-verificado.md` §4.3.
- [x] Verificar en navegador: identidad de cuadro, avance del clip, cadencia y consola limpia. **Medido**: la captura en carrera coincide **987/987 píxeles (100 %)** con `kratos-run-01.png`; idle coincide 994/1001 con `kratos-neutral.png`; consola sin errores. Hoja lado a lado: `docs/preview/idle-vs-run-browser-4x.png`.
- [x] Decidir si se abordan `attack`, `roll`, `air` y `guard`. **Decidido el 2026-10-27:** los 12 cuadros de `run-00..05`, `air-00/01` y `attack-00..03` se **archivaron** al medir que cambiaban una sola extremidad sin desplazar el pie (§10, lotes 1–3). `air` y `attack` quedan **congelados** hasta nueva autorización; `roll` y `guard` siguen sin especificar.
- [ ] Declarar `hand_zones` y `blade_chars` por pose para que I5 deje de ser `NOT EVALUATED`. **Sigue pendiente**: la paleta actual no separa hoja de cuerpo y no hay anclas de mano por pose.
- [ ] Sacar la sombra cocida a una capa aparte (V-12). Bloquea `air` y cualquier salto con lectura limpia; es tarea de render, no de dibujo.

**Cómo se dibujan los cuadros (regla corregida el 2026-10-27).** Cada cuadro es un grid propio, derivado de la **misma anatomía**, y ninguna forma se inventa: solo se **posa** el cuerpo que ya existe.

- **Piernas:** se toman las filas de pierna del propio maestro, se cizallan horizontalmente y se acortan quitando filas de pantorrilla; las 2 filas del zapato se mueven **como bloque**. Prohibido dibujar una pierna nueva o estirarla.
- **Brazos:** **rotación rígida alrededor del hombro** (`NEAR_ARM_BAND` `(10,33,20,46)`, semilla `(19,31)`, hombro `(34,34)`; `FAR_ARM_BAND` `(64,90,20,48)`, semilla `(77,32)`, hombro `(63,34)`). El brazo lejano se dibuja **detrás** del torso, solo sobre celdas transparentes.
- **Congelado verbatim:** cabeza, torso, cinturón, faldón, cadenas y sombra. La compuerta I8 exige **0 px** de cambio ahí.

Queda **prohibido** cortar una región del maestro y trasladarla entera (cabeza, torso, pierna completa): produce costura en el cuello y anatomía mutante. Lo único que se admite barato es desplazar el sprite entero. `scripts/ascii_animate.py` queda fuera del circuito de generación.


#### Especificación de zancada

La cadencia no se elige a mano: se deduce de la zancada declarada (`playRun` calcula `timeScale = (speed / stridePx) * frames / frameRate`, limitado a `[0.35, 2]`).

| Parámetro | Valor | Origen |
| --- | --- | --- |
| Velocidad máxima | `140 px/s` (`CONFIG.player.maxSpeed`) | Decisión de *feel*, no de animación |
| Cuadros del ciclo | `4` (contacto, paso, contacto opuesto, paso opuesto) | `CONFIG.player.run.frames` |
| Zancada por ciclo | `24 px` | `CONFIG.player.run.stridePx`. **Medida del dibujo**, no elegida: el pie apoyado recorre `12 px` pico a pico en el ciclo (`I8`: centros `[40.5, 36.5, 28.5, 33.5]`) y el apoyo alterna cada 2 cuadros, así que esa excursión es medio paso: `2 × 12 = 24 px` |
| Cadencia derivada a velocidad máxima | `5,83 ciclos/s` (`timeScale` `0,97` sobre base 24) | `140 ÷ 24 × 4 ÷ 24` |
| Duración del ciclo | `171 ms` teórico; **166–183 ms** medido en navegador | `1 ÷ 5,83` |
| Duración por pose | `43 ms` teórico; **≈42 ms** medido | ciclo ÷ 4 |

**Por qué la zancada no bajó a 12 px.** Con `stridePx: 12` el ciclo duraría `85 ms` (**21 ms por pose**), más rápido que un refresco de pantalla: el ojo no llega a ver las cuatro poses y el clip se lee como temblor. `24 px` mantiene el ciclo legible y sigue dando cadencia de sprint.

**Deslizamiento residual, medido (decisión abierta, no bloqueante).** La zancada se deduce del dibujo, pero el dibujo **no acompaña todo el recorrido**: durante una fase de apoyo (2 poses = medio ciclo = `12 px` de suelo) el pie apoyado retrocede solo **4 px** respecto del cuerpo (`40.5 → 36.5`). Quedan **8 px de deslizamiento por apoyo** (≈67 %). En vista casi frontal con sombra cocida no hay forma de eliminar eso sin dibujar más recorrido del pie: las salidas son bajar `maxSpeed` (afecta el diseño de niveles), subir `stridePx` (pierde sincronía con el dibujo) o alargar el retroceso del pie en los cuadros (más trabajo de dibujo). **Decisión de la usuaria; no bloquea la entrega actual.**


#### Lote 1 — `run` (4 cuadros, 2026-10-27)

**Alcance.** Cuatro grids nuevos, `run-00.txt`..`run-03.txt`, cada uno de 97×59, derivados de la anatomía del maestro: contacto, paso, contacto opuesto, paso opuesto. Son los `frames: 4` de `CONFIG.player.run`.

**Cómo se posa el cuerpo.** Las filas de pierna se toman **del propio maestro**, se cizallan horizontalmente y se acortan quitando filas de pantorrilla; las 2 filas del zapato se mueven como bloque, así que el pie nunca se amputa. Los brazos son **rotación rígida alrededor del hombro** (ángulos `-22/-22`, `-12/-12`, `+22/+22`, `+12/+12` por par de cuadros), con el brazo lejano detrás del torso. Cabeza, torso, cinturón, faldón, cadenas y sombra son el maestro **verbatim**. No se dibuja ninguna forma nueva.

**Por qué reemplaza al lote de 6.** El lote anterior se rechazó con medición: cambiaba solo las pantorrillas, entre **27 y 77 px de 1001**, con **0 px** de cambio en cabeza, torso y brazos; los pies no viajaban (el izquierdo en `x32..38` en todos los cuadros, el derecho en `x57..66` con ±1 px) y la fila de apoyo era idéntica en los seis. Era el maestro con una extremidad temblando, no una pose. Los 6 cuadros están en `grids/kratos/archivo/` y las métricas en `manifest.json → archived_frames`.

| Cuadro | Pose | Apoyo en fila 57 | Pie libre |
| --- | --- | --- | --- |
| `run-00` | contacto: pierna cercana adelante y apoyada, lejana atrás | cercano `x38..43` | lejano en el aire, rodilla arriba |
| `run-01` | paso: pierna cercana bajo el cuerpo, lejana pasando | cercano `x34..39` | lejano en el aire |
| `run-02` | contacto opuesto: pierna lejana adelante y apoyada | lejano `x64..72` | cercano en el aire, rodilla arriba |
| `run-03` | paso opuesto: pierna lejana bajo el cuerpo | lejano `x60..68` | cercano en el aire |

**Criterio de aceptación.** (a) los 4 grids existen, 97×59, paleta cerrada; (b) `I1`–`I4`, `I6`, `I7` PASS en los cuatro; (c) ninguna pieza flota — componentes conexas no superiores a las del maestro (3); (d) cabeza byte-idéntica al maestro; (e) cada cuadro declara `motion: true` y pasa I8 (bandas de piernas y brazos cambiadas, regiones congeladas sin tocar); (f) el clip pasa `clip_gate`: cambio entre cuadros consecutivos, alternancia de apoyo y recorrido real del pie; (g) hoja de contacto publicada.

**Evidencia medida (2026-10-27).** Masa opaca: `run-00` **986**, `run-01` **987**, `run-02` **979**, `run-03` **984** (maestro 1001, deriva ≤2,2 %). Componentes conexas: **3** en los cuatro. `I1`–`I4`, `I6`, `I7` e `I8` **PASS**; `I5` `NOT EVALUATED` (sin `hand_zones`/`blade_chars`). Por cuadro, píxeles distintos del maestro y por banda: `run-00` 446 (piernas 133, brazo cercano 166, lejano 147), `run-01` 311 (79/126/106), `run-02` 441 (135/168/138), `run-03` 306 (74/126/106); regiones congeladas `head`, `torso_core` y `shadow`: **0 px** en los cuatro. `clip_gate`: cambio mínimo entre cuadros consecutivos **326 px** (por paso `[331, 471, 326, 476]`), apoyo alternado (2 cuadros sobre el pie cercano, 2 sobre el lejano) y **12,0 px** de recorrido del pie en los dos pies (mínimo 6). Hoja de contacto: `docs/preview/run-batch-8x.png` (4684×480, 8×: maestro, idle-01, run-00..03).

**Pendiente no bloqueante.** Juicio visual de la usuaria sobre si el ciclo se lee como carrera a 2× (`docs/pendientes-de-validacion-humana.md`, #9). El clip **sí está conectado y medido** en navegador; ver `docs/estado-verificado.md` §4.3.

**Límite conocido.** La fila 58 es una barra de sombra de contacto cocida en el sprite, así que I6 pasa en todos los cuadros y deja de discriminar si el pie está apoyado (V-12). Además el recorrido del pie en el dibujo (4 px por apoyo) no cubre los 12 px de suelo de esa fase: queda deslizamiento residual, medido en [Especificación de zancada](#especificación-de-zancada).


#### Lote 2 — `air` — **ARCHIVADO (2026-10-27)**

Se dibujaron `air-00` (ascenso, rodillas flexionadas, pies 2 px sobre el suelo en fila 55) y `air-01` (caída, piernas extendidas y pies apoyados). **Se rechazaron como animación** el 2026-10-27 por la misma medición que el lote de `run`: **77 px** de cambio en `air-00` y **29 px** en `air-01`, todos en las piernas, con **0 px** en cabeza, torso y brazos. No hay pose, hay una pantorrilla que se mueve.

**Defecto adicional (V-12).** `air-00` tiene **4 componentes conexas** en vez de 3: la cuarta es la barra de sombra cocida (`x29..67`, fila 58), que se despega del cuerpo al levantar los dos pies. En el juego se vería una barra de sombra flotando en el aire. **Para reabrir `air` primero hay que sacar la sombra a una capa aparte** (tarea de render), y después dibujar poses que pasen I8: desplazamiento real de pies y brazos, no solo pantorrilla.

**Dónde está la evidencia.** Grids en `grids/kratos/archivo/`, PNGs en `public/assets/characters/archivo/`, hoja en `docs/preview/archivo/air-batch.png`, métricas por cuadro en `manifest.json → archived_frames`.

#### Lote 3 — `attack` — **ARCHIVADO (2026-10-27)**

Se dibujaron `attack-00..03` (windup, golpe, follow-through, recuperación), solo cuerpo: el arma la genera `WeaponLayer`. **Se rechazaron como animación** el 2026-10-27: cambiaban **solo un brazo** (`x<48`), con torso, cadera, piernas y el brazo opuesto **congelados** (`0 px`). El golpe se lee por el arco de la cuchilla de `WeaponLayer`, no por una pose del cuerpo.

**Hallazgo que se conserva (sirve para reabrirlo).** El hombro del maestro **no está pegado al torso**: se une por una escalera de celdas sueltas (`x35,y38` → `x36,y33` → `x42,y28`), que es el contorno oscuro del pixel art. Cualquier brazo nuevo se ancla a esa hombrera, no al torso.

**Para reabrirlo.** Hace falta giro de torso y cadera en windup y follow-through, no más cuadros de brazo. Mientras el torso quede congelado, no pasa I8 (`frozen torso_core` = 0 px es requisito de la compuerta, y una pose de ataque **sí** debe moverlo).

**Dónde está la evidencia.** Grids en `grids/kratos/archivo/`, PNGs en `public/assets/characters/archivo/`, hoja en `docs/preview/archivo/attack-batch.png`.


### P3.1 — Rediseño de la cabeza (V-10) — **corrección aplicada; aprobación estética pendiente**

El defecto "cabeza con pico de ave" se midió sobre el maestro descartado (borde más claro y avanzado a la altura de la cara, corona de 3 px, perfil sin curva). Las reglas adoptadas siguen vigentes:

| Regla | Enunciado |
| --- | --- |
| R1 | Ningún tono >65 % de luminancia (`a`, `b`) sobre el borde de la silueta |
| R2 | La corona mide ≥4 celdas (3 lee como cráneo de ave) |
| R3 | La nariz protruye en tono medio (`c`/`d`) rematada por contorno oscuro, nunca por `a` |
| R4 | El ojo es un brillo `a` encerrado a izquierda y derecha por cuenca oscura (`j`/`k`) |
| R5 | La cabeza permanece conectada al torso (sin masa flotante ni hueco interno) |

El maestro vigente **sí contiene** las correcciones de P3.1, medidas sobre el grid: perfil derecho en `y14..y20` (`55,56,56,57,56,57,56`), corona de 5 celdas, ojo `a` en `(54,18)` encerrado entre `j` y nariz `d` en `(53,19)`. La afirmación anterior ("no fue rediseñado") era falsa y queda corregida.

**R1 no se cumple bajo ninguna lectura literal, y lo que falta decidir es la definición.** R1 dice "ningún tono >65 % de luminancia (`a`, `b`) sobre el borde de la silueta". Medidas las celdas `a` ortogonalmente adyacentes a un píxel transparente, hay **6**: `(48,20)`, `(50,21)`, `(19,36)`, `(21,36)`, `(77,37)` y `(78,36)`. Las seis bordean transparencia **conectada al fondo**: el relleno desde el borde del grid alcanza a la transparencia que bordean, y ninguna toca un hueco encerrado (el grid tiene un único hueco encerrado, de 190 px, entre las piernas en `x38..57, y45..57`). Por eso las seis son contorno exterior. Dos de ellas, `(48,20)` y `(50,21)`, caen **dentro** de `regions.head` (x40..57, y14..24), junto a la muesca abierta mandíbula–hombro que deja ver el fondo en `y20`, `x49-50`. Consecuencia medida: lectura global → 6 fallos; lectura solo-cabeza → 2 fallos; lectura contorno-exterior → 6 fallos, igual que la global. Ninguna lectura literal salva R1. La única que lo salvaría es excluir explícitamente los bordes de la muesca mandíbula–hombro, y eso es una decisión de definición, no un conteo. **R1 no se declara cumplida ni incumplida hasta fijarla.**

Lo que queda pendiente es **juicio estético**: ninguna medición dice si la cabeza se lee como Kratos. Eso es de la usuaria y no bloquea.

**V-11 resuelto:** `kratos-attack.png`, `kratos-roll.png` y `kratos-air.png` (paleta distinta al maestro, estructura de maniquí) están archivados y fuera del `manifest.ts` y del código. No hay piezas no-ASCII activas para Kratos. Si se necesitan `attack`/`roll`/`air`, se generan como grids en `grids/kratos/` con `palette/master.json`.

## 11. Reglas de trabajo

1. Una fase activa por vez; sin avanzar con una checklist incompleta.
2. El arte lo aprueba la usuaria; el auditor verifica invariantes, no estética.
3. **Las hojas PNG son derivadas.** `kratos-neutral.png` se **regenera desde el grid**: se cambia el `.txt` y se vuelve a rasterizar, nunca el PNG a mano. Cualquier PNG editado a mano se considera arte huérfano y se descarta en la siguiente rasterización.
4. No se añaden dependencias al juego; el rasterizador es herramienta de desarrollo.
5. Si un invariante resulta imposible de cumplir sin mutar la anatomía, se detiene y se consulta: no se relaja el invariante en silencio.

## 12. Riesgos

| Riesgo | Mitigación |
| --- | --- |
| El grid es incómodo de editar a mano | Es texto: cualquier editor sirve; el formato es regular y predecible |
| El resultado ASCII no alcanza la calidad esperada | La decisión se toma en P2 con una sola pose, antes de invertir en el ciclo completo |
| Divergencia entre grid y PNG en el repo | El PNG es derivado; una verificación lo regenera y compara hashes |
| Proliferación de formatos | Un solo formato, un solo rasterizador, una sola paleta |
