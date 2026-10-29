# Estado verificado

> **Respuesta corta:** el repositorio **no contiene un juego completo**. Contiene un motor de juego lateral funcional —simulación determinista, combate, enemigos, jefe, magia, cofres, checkpoints, HUD y audio— más un nivel (`level1`) que **no es el arranque por defecto** y que hoy tiene un defecto de oleadas. Este documento es la **fuente de verdad del estado**. Cualquier otra afirmación de "100 % completado" en el repositorio es registro histórico, no estado medido.

## 1. Alcance de la medición

| Campo | Valor |
| --- | --- |
| Fecha | 2026-10-27 (arte y animación de Kratos); el resto de las mediciones, 2026-10-26 |
| Commit base | `e9d9a34` (rama `tarea/kratos-modular-sample`; los cambios de ASCII y `run` están **sin commitear**) |
| Typecheck | `npx tsc -b` → exit 0 (2026-10-27) |
| Navegador | Chrome DevTools MCP contra Vite dev, canvas lógico 480×270, sin errores de consola |
| Píxeles | Análisis de PNG con Pillow (dimensiones, colores, alfa) |
| Git | `git log`, `git status --porcelain` |

## 2. Arranque real

| Hecho | Evidencia |
| --- | --- |
| Escenario por defecto: `platforms` | `src/sim/scenarios.ts:431` |
| `flowState` inicial: `playing` (no hay pantalla de título al arrancar) | `src/sim/world.ts:116` |
| Entidades al arrancar: 1 (`player` en x=240, y=262, 100 HP) | Medición CDP |
| `<title>` del documento: "Nuevo ciclo de desarrollo" | `index.html` |
| Canvas 480×270, escalado a 960×540, ~60 fps, 201 objetos de display | Medición CDP |
| Escenarios disponibles (14) | `empty, test, movement, platforms, combat, legionnaire, archer, waves, arena, magic, chest, level1, checkpoint, hydra` |

**Conclusión:** el arranque es un **escenario de prueba**, no una partida. Quien abra el juego hoy no ve título, ni enemigos, ni el nivel.

## 3. Sistemas medidos como funcionales

| Sistema | Medición | Evidencia |
| --- | --- | --- |
| Simulación determinista a paso fijo | 60 Hz, snapshots, comandos, reset | `src/sim/world.ts` |
| Harness DEV | `window.__GOW8B` operativo (snapshot, tick, comandos) | Medición CDP |
| Combate cuerpo a cuerpo | Hidra 300 → 288 HP con 60 ticks de ataque ligero | Medición CDP |
| Magia (Ira de Poseidón) | MP 100 → 65 al invocar | Medición CDP |
| Enemigos | Legionario y arquero con IA por estados | `src/sim/waves.ts`, `src/sim/archer.ts` |
| Guardia y parry | Parry de 6 ticks, reflejo de flecha | `src/sim/archer.ts:227-247` |
| Cofres y checkpoints | Existen y operan en sus escenarios | `src/sim/chests.ts`, `src/sim/checkpoint.ts` |
| HUD | Capa propia con barras de vida/maná | `src/ui/HudLayer.ts` |
| Flujo de UI | `title`, `playing`, `paused`, `victory`, `gameover` alcanzables | `src/ui/GameFlowOverlay.ts` |
| Audio | Motor procedural Web Audio | `src/audio/SoundManager.ts:12` |
| Nivel `level1` | Carga jugador (100,262), arquero (1170,138), hidra (1360,262), 4 cofres, 2 checkpoints, `weaponLevel 1` | Medición CDP |

**Conclusión:** los sistemas existen y responden. Eso **no** equivale a que el nivel se juegue de principio a fin: ver V-01 y §6.

## 4. Arte: hechos medidos

### 4.1 Hojas de Kratos

Cada cuadro de `grids/kratos/` tiene un PNG derivado, uno por archivo (no hay hojas apiladas):

| Archivo | Cuadro del grid | Uso en código | sha256 (16) |
| --- | --- | --- | --- |
| `kratos-neutral.png` | `master.txt` | `PLAYER_KEY`, respaldo estático | `744743fb759d7ecf` |
| `kratos-idle-01.png` | `idle-01.txt` | clip `kratos-idle` (cuadro 1) | `dde13a4dd3fcadb0` |
| `kratos-run-00.png` | `run-00.txt` | clip `kratos-run` (cuadro 0) | `908ac183d4b206ae` |
| `kratos-run-01.png` | `run-01.txt` | clip `kratos-run` (cuadro 1) | `9e2b4f1e205869b6` |
| `kratos-run-02.png` | `run-02.txt` | clip `kratos-run` (cuadro 2) | `a80d9cb02e98ada7` |
| `kratos-run-03.png` | `run-03.txt` | clip `kratos-run` (cuadro 3) | `ec65724b8e7e6068` |

Son **6 cuadros activos** derivados de 6 grids; no hay hojas apiladas ni cuadros duplicados (los 6 PNG tienen hash distinto). Los hashes son los del PNG rasterizado; el del grid maestro es `1f4591d532cb11da…`.

**Archivados el 2026-10-27 (12 cuadros).** `run-00..05` del lote viejo, `air-00/01` y `attack-00..03`: grids en `grids/kratos/archivo/`, PNGs en `public/assets/characters/archivo/`, hojas en `docs/preview/archivo/`. Motivo medido: cambiaban solo una extremidad (27–77 px de 1001, 0 px en cabeza/torso/brazos) y no desplazaban el pie. `roll` y `guard` nunca tuvieron grid: caen al cuadro `PLAYER_KEY`.

### 4.2 Consistencia de paleta

| Hoja | Colores distintos | Paleta maestra declarada |
| --- | --- | --- |
| Los 6 cuadros activos (neutral, idle-01, run-00..03) | 12 por hoja; **12 en la unión** | 12 (**0 fuera**) |
| `archivo/` (respaldos) | 24 en la unión | 12 declarados |

Los 12 colores que no existen en `palette/master.json` (`#120e10`, `#2a3038`, `#302016`, `#403834`, `#604028`, `#821814`, `#908880`, `#b48838`, `#d8e0e8`, `#dc2820`, `#ded8d2`, `#ff8818`) pertenecen a los respaldos archivados de `attack`/`air`/`roll`. Un segundo juego de paleta completo, hoy fuera del juego (V-11).

La paleta no tiene una fuente única en el resto del repositorio: cada script generador de enemigos declara la suya (hidra 14 colores en `scripts/gen-enemy-hydra.py:56`, arquero ≤12 en `scripts/verify-enemy-archer.py:9`). Esos enemigos siguen fuera del pipeline ASCII.


### 4.3 ASCII — grids como fuente de verdad (actualizado 2026-10-27)

Kratos tiene **6 cuadros activos** y **2 clips conectados**: `kratos-idle` (2 cuadros) y `kratos-run` (4 cuadros). El 2026-10-27 se **archivaron 12 cuadros** (`run-00..05` del lote anterior, `air-00/01` y `attack-00..03`): la medición mostró que no eran poses — cambiaban entre **27 y 77 px de 1001**, todos en las piernas, con **0 px** en cabeza, torso y brazos, y el pie nunca viajaba (misma fila de apoyo en todos los cuadros). Las tablas de «estado vigente» del 2026-10-26 que hablaban de `idle-00` y `run-00..08` describían arte derivado por traslación, ya retirado; queda un resumen al final de esta sección.

**Estado vigente medido (2026-10-27, navegador recargado antes de medir; canvas 480×270, rect en pantalla 960×540).**

| Hecho | Evidencia |
| --- | --- |
| Sprite en pantalla | `kratos-neutral` + `kratos-idle-01` en reposo; `kratos-run-00..03` en carrera. `RUN_KEYS` son las 4 claves de `run` y están en `PLAYER_FRAME_KEYS` |
| `idle` — período | **983 ms** por cuadro (5 tramos en 4,6 s), coincide con `idle.frameRate: 1` |
| `idle` — qué se mueve en pantalla | Diff entre los dos cuadros de reposo: **8 celdas del sprite** (pecho/hombros en `y25..y28`) y ~148 px de fondo animado, no del personaje |
| `run` — cuadros y orden | 4 cuadros: ciclo medido `0→1→2→3→0` **sin atascarse** en 70 muestras rAF (escenario `platforms`, tecla `→` sintética) |
| `run` — clasificación por cuadro | 37 celdas sonda (opacas en los 4 cuadros y con color distinto entre ellos): **37/37** coincidencias en el cuadro correcto en todas las muestras |
| `run` — cadencia | Ciclo **166–183 ms** (≈170 ms), **≈42 ms por pose**. Derivada, no elegida: `frames 4`, `frameRate 24`, `stridePx 24` → a 140 px/s da 5,83 ciclos/s (`timeScale` 0,97) |
| `run` — fidelidad de píxel | Captura en carrera contra `kratos-run-01.png`: **987/987 (100 %)** en offset `(277, 203)`. En reposo: **994/1001** contra `kratos-neutral.png` en offset `(192, 203)`; las 7 diferencias se concentran en `x28..31, y34..35` (zona de la mano/cadena cercana) y no cambian la lectura del cuadro |
| `run` — deslizamiento residual | Durante un apoyo (medio ciclo = 12 px de suelo) el pie retrocede solo **4 px** respecto del cuerpo (`40.5 → 36.5`): quedan **8 px de deslizamiento por apoyo**. Medido, no estimado; decisión abierta en [`planes/PIXEL-ART-ASCII-MASTER-01.md`](planes/PIXEL-ART-ASCII-MASTER-01.md#especificación-de-zancada) |
| Invariantes | `python3 scripts/verify_ascii_master.py kratos` → **I1, I2, I3, I4, I6, I7 PASS en los 6 cuadros**; **I8 PASS en los 4 `run`** (bandas cambiadas, regiones congeladas en 0 px, alternancia de apoyo, pie con 12,0 px de recorrido); I5 `NOT EVALUATED`; `RESULT: PARTIAL`, exit 2 |
| Masa y componentes (`run`) | 986, 987, 979, 984 px opacos (maestro 1001, deriva ≤2,2 %); **3 componentes conexas** en los cuatro, igual que el maestro |
| Hojas publicadas | `docs/preview/run-batch-8x.png` (maestro, idle-01 y run-00..03 a 8×) e `docs/preview/idle-vs-run-browser-4x.png` (lado a lado en el navegador real, idle vs run) |
| Consola | **0 errores**: solo `[vite] connecting…`, `[vite] connected.` y el banner de Phaser 3.90.0 |
| `air` y `attack` | **Archivados**, sin clip: caen al cuadro estático. `air` exige primero sacar la sombra a otra capa (V-12); `attack` exige giro de torso |
| `roll` y `guard` | Sin grid: caen al cuadro estático `PLAYER_KEY` |

**Cómo se posan los cuadros (2026-10-27).** El cuadro se **deriva de la misma anatomía** y no inventa formas: solo posa el cuerpo que ya existe.

- **Piernas:** se toman las filas de pierna del propio maestro, se cizallan horizontalmente y se acortan quitando filas de pantorrilla; las 2 filas del zapato se mueven **como bloque**, así que el zapato no se amputa.
- **Brazos:** **rotación rígida alrededor del hombro** (`NEAR_ARM_BAND (10,33,20,46)`, semilla `(19,31)`, hombro `(34,34)`; `FAR_ARM_BAND (64,90,20,48)`, semilla `(77,32)`, hombro `(63,34)`). El brazo lejano se dibuja **detrás** del torso, solo sobre celdas transparentes.
- **Congelado verbatim:** cabeza, torso, cinturón, faldón, cadenas y sombra. I8 exige **0 px** de cambio ahí y lo verifica.
- **Prohibido:** cortar una región del maestro y trasladarla entera (cabeza, torso, pierna completa). Es lo que hacía `scripts/ascii_animate.py`, ya retirado, y produce costura de cuello y anatomía mutante. Lo único que se admite barato es desplazar el sprite entero.

**Nota sobre I6.** La fila 58 es una barra de sombra de contacto cocida en el sprite y se mantiene fija en todos los cuadros. Por eso I6 (`lowest opaque row == 58`) pasa en los 6 cuadros, pero **deja de discriminar** si el pie está realmente apoyado. Para animación vertical (`air`) hay que sacar la sombra del sprite y dibujarla en una capa aparte (V-12). Además la sombra viaja con el sprite: en `air` se vería una barra flotando.

**Registro histórico (arte retirado, 2026-10-26).** `scripts/ascii_animate.py` no dibujaba: componía bloques rasterizados del maestro con traslaciones enteras. Generó `idle-00` y `run-00..08`; se movió a `scripts/archivo/` y sus salidas se borraron. Las mediciones de entonces (`idle` 333 ms por cuadro, 8 cuadros de `run`, `bad` 0–30) describen ese arte y **no** el vigente. El generador de cuadros por traslación sigue retirado: los cuadros se posan sobre la anatomía o se dibujan, no se derivan moviendo bloques.


**Reglas de diseño vigentes para la cabeza** (heredadas de la auditoría del maestro descartado; siguen aplicando al maestro nuevo):

| Regla | Enunciado |
| --- | --- |
| R1 | Ningún tono >65 % de luminancia (`a`, `b`) sobre el borde de la silueta |
| R2 | La corona mide ≥4 celdas (3 lee como cráneo de ave) |
| R3 | La nariz protruye en tono medio (`c`/`d`) rematada por contorno oscuro, nunca por `a` |
| R4 | El ojo es un brillo `a` encerrado a izquierda y derecha por cuenca oscura (`j`/`k`) |
| R5 | La cabeza permanece conectada al torso (sin masa flotante ni hueco interno) |

**Sobre la cabeza del maestro vigente.** El grid actual **sí contiene** las correcciones R1–R5 de la etapa P3.1: perfil derecho en `y14..y20` (`55,56,56,57,56,57,56`), corona de 5 celdas, ojo `a` en `(54,18)` encerrado entre `j`, nariz `d` en `(53,19)`. La afirmación anterior de este documento ("no fue rediseñado") era falsa y queda corregida.

Lo que queda abierto de la cabeza es solo **juicio estético**, que no bloquea: no hay una medición que diga si el resultado *se lee* como Kratos.

**R1 no se cumple bajo ninguna lectura literal, y lo que falta decidir es la definición.** R1 dice "ningún tono >65 % de luminancia (`a`, `b`) sobre el borde de la silueta". Medidas las celdas `a` ortogonalmente adyacentes a un píxel transparente, hay **6**: `(48,20)`, `(50,21)`, `(19,36)`, `(21,36)`, `(77,37)` y `(78,36)`. Las seis bordean transparencia **conectada al fondo**: el relleno desde el borde del grid alcanza a la transparencia que bordean, y ninguna toca un hueco encerrado (el grid tiene un único hueco encerrado, de 190 px, entre las piernas en `x38..57, y45..57`). Por eso las seis son contorno exterior. Dos de ellas, `(48,20)` y `(50,21)`, caen **dentro** de `regions.head` (x40..57, y14..24), junto a la muesca abierta mandíbula–hombro que deja ver el fondo en `y20`, `x49-50`. Consecuencia medida: lectura global → 6 fallos; lectura solo-cabeza → 2 fallos; lectura contorno-exterior → 6 fallos, igual que la global. Ninguna lectura literal salva R1. La única que lo salvaría es excluir explícitamente los bordes de la muesca mandíbula–hombro, y eso es una decisión de definición, no un conteo. **R1 no se declara cumplida ni incumplida hasta fijarla.**

## 5. Defectos conocidos

| ID | Defecto | Reproducción | Impacto |
| --- | --- | --- | --- |
| **V-01** | Las oleadas de `level1` spawnean fuera de la arena. `CONFIG` usa x=320/380 (`src/config.ts:308-328`); la arena activa está en x=550–890 (`src/sim/world.ts:417-437`). | Cargar `level1`; 180 ticks de `move-right`. Aparecen legionarios en x≈342 y x≈380, **detrás** del jugador, antes de entrar a la arena. | El combate del nivel no se puede jugar como está diseñado |
| **V-02** | **No aplica tras el reinicio.** Describía la hoja `kratos-attack.png` (7 cuadros, ~24 colores); esa hoja está archivada y `attack` ya no tiene asset | — | Cerrado por archivado; reaparecerá si se dibuja `attack` con otra paleta |
| **V-03** | Paleta duplicada por script generador | `scripts/gen-enemy-*.py` | Imposible garantizar consistencia entre assets |
| **V-04** | El escenario `combat` es legado: su dummy no recibe daño (100 HP tras 30 ticks de ataque) | Cargar `combat`, atacar | Falso positivo si alguien lo usa como prueba de combate |
| **V-05** | No existe script `test` en `package.json` | `pnpm test` | Ninguna regresión falla sola |
| **V-06** | `<title>` del documento sin actualizar | Abrir la página | Cosmético, pero delata el estado real |
| **V-07** | **Resuelto.** `idle` volvía a ser el mismo grid que `neutral` y no animaba. Ahora `master` e `idle-01` son cuadros distintos (8 celdas nuevas en `y25..y28`) y el clip `kratos-idle` alterna medido a **983 ms** por cuadro (`idle.frameRate: 1`) | Inspección de `idle-01.txt` contra el maestro | `idle` anima |
| **V-08** | **Resuelto.** Describía deriva de cabeza entre los cuadros de `run`. Los 4 cuadros vigentes mantienen `head_offset [0,0]`, pasan I4 con coincidencia exacta y la compuerta I8 exige `frozen head` en **0 px** | `python3 scripts/verify_ascii_master.py kratos` | `run` no arrastra la cabeza |
| **V-09** | **Confirmado en el maestro nuevo.** Sigue habiendo **3 componentes conexas**: figura de 984 px + fragmento de cadena de 13 px (`x65..68`, `y44..49`) + fragmento de 4 px (`x28..29`, `y48..49`). No es una regresión: es la forma de las puntas de cadena | Conteo de componentes conexas del alfa en `master.txt` | Dos fragmentos flotantes visibles en reposo |
| **V-10** | **Abierto, no bloqueante.** La corrección R1–R5 está presente en el grid, pero nadie evaluó estéticamente si se lee como Kratos. Además R1 no se cumple bajo ninguna lectura literal: falta fijar su definición (§4.3) | Inspección del grid | Aprobación visual pendiente de la usuaria |
| **V-11** | **Resuelto.** `attack`/`roll`/`air` archivados y fuera del manifiesto y del código. Ya no queda ningún activo de Kratos fuera de `grids/` | `ls public/assets/characters/` | Sin activos no-ASCII de Kratos |
| **V-12** | **Nuevo, abierto.** I6 ya no discrimina: la fila 58 es una barra de sombra cocida en el sprite y se mantiene fija, así que "el pie más bajo está en el suelo" pasa siempre, incluso con los dos pies levantados | `verify_ascii_master.py` sobre cualquier cuadro | Una animación vertical futura no queda cubierta por ningún invariante |
| **V-13** | **Nuevo, abierto.** `scripts/ascii_animate.py` acepta `--check` y no lo usa: cae en la rama de dry-run, imprime y sale con 0 sin comparar nada. Consecuencia: `--check` no detecta divergencias entre grids y PNG | `grep -n "args.check" scripts/ascii_animate.py` sin coincidencias; `python3 scripts/ascii_animate.py kratos --check` termina con exit 0 sin comparar | No usar `--check` como verificación |
| **V-14** | **Nuevo, abierto.** `WeaponLayer` dibuja eslabones procedurales por encima del jugador (`ShellScene` llama a `weaponLayer.update(player, …)` cada cuadro), y el grid además tiene cadenas cocidas en `x16..35` y `x62..80`. Efecto: doble cadena y coincidencia de píxeles no determinista en la verificación. **Medido el 2026-10-27:** la captura en carrera coincide 987/987 (100 %) con `kratos-run-01.png`; en reposo 994/1001, con las 7 diferencias agrupadas en `x28..31, y34..35` | Muestreo propio de 40 cuadros en reposo tras recargar: 32 exactos, mediana 0, máximo 21 px, agrupados en un trazo entre `(80,29)` y `(56,57)` | La comparación píxel a píxel sólo es exacta cuando ninguna cadena cruza; hay que decidir si la capa de armas se conserva |
| **V-15** | **Nuevo, cerrado como arte retirado.** `idle-01` y `run-00..08` del lote derivado se generaban cortando regiones del maestro y trasladándolas. Anatomía mutante y costura en el cuello. Retirados del circuito; el pipeline vigente **posa** el cuerpo del maestro y lo verifica con I8. `IDLE_KEYS` = maestro + `idle-01`, `RUN_KEYS` = los 4 `run`, y ambos clips existen en `createPlayerAnimations` | `src/assets/manifest.ts`, `src/scene/ShellScene.ts`; navegador: `kratos-idle` y `kratos-run` alternan, 0 errores de consola | No volver a derivar cuadros por traslación de bloques |

**Aclaración:** el cuadro de derrape **ya no existe**. `run-08.txt` formaba parte del lote derivado por traslación, retirado el 2026-10-26. `SKID_KEY` apunta hoy al cuadro estático `kratos-neutral`: al frenar no hay pose de derrape, el sprite cambia a la pose neutra.

## 6. Lo que NO está verificado

- **Partida completa.** No hay registro de un recorrido de principio a fin. Hay escenarios aislados y snapshots reproducibles; no es lo mismo.
- **Calidad visual.** El modelo del runtime no interpreta imágenes. El juicio estético y la sensación de movimiento con teclado físico corresponden a la usuaria. Lo que **sí** queda medido en navegador (2026-10-27): el sprite se dibuja en el offset exacto (`192,203` en reposo, `277,203` en carrera); en carrera la captura coincide **987/987 píxeles (100 %)** con `kratos-run-01.png` y en reposo **994/1001** con `kratos-neutral.png`.
- **Arte ASCII-only.** Nada fuera de `grids/` puede entrar al juego. Kratos se reconstruye desde cero en `grids/kratos/`; existen **6 cuadros activos** (`master`, `idle-01`, `run-00..03`) y todos derivan del mismo maestro. Hidra queda pospuesto hasta terminar Kratos. Todo lo no-ASCII y los 12 cuadros rechazados están en `public/assets/characters/archivo/`.
- **Animación de personaje.** `idle` (2 cuadros) y `run` (4 cuadros) están conectados y medidos. Siguen **sin** animación `attack`, `roll`, `air` y `guard`: `air` y `attack` tienen 6 cuadros archivados y los cuatro estados caen al cuadro estático `PLAYER_KEY`. La calidad percibida del ciclo de carrera no está evaluada: se midió que los cuadros se suceden en orden y a qué cadencia, no que la zancada se lea bien.
- **Arte del maestro.** El grid actual contiene las correcciones de cabeza R1–R5 de P3.1, pero la lectura estética no está aprobada y R1 tiene una discrepancia de definición abierta (§4.3). Los cuadros de `run` **posan** el cuerpo del maestro (filas de pierna cizalladas y acortadas, brazos rotados rígidos): no se dibujó anatomía nueva para la carrera.
- **Sensación con teclado físico.** Las pruebas usan entrada sintética por CDP.
- **Trabajo de arte ASCII previo.** No hay historial de sesiones de Antigravity/AGY accesible desde este entorno ni artefactos ASCII en el repositorio.
- **Los 28/28 casos CDP** citados en `docs/verificacion.md`. Fueron un registro histórico; no se re-ejecutaron para este documento.
- **La zancada como animación.** Se verificó que los 4 cuadros de `run` aparecen en orden cíclico, a 166–183 ms por ciclo y con fidelidad de píxel, no que el resultado se lea como una carrera convincente. Eso requiere ojo humano. Además hay **8 px de deslizamiento por apoyo** medidos (§4.3): el dibujo no acompaña todo el recorrido del pie.

## 7. Regla de uso

1. Ninguna afirmación de "completado" se sostiene sin una fila medida en este documento.
2. Al cerrar un hilo, se re-mide lo afectado y se actualiza la fila; si un defecto se corrige, se marca como resuelto con su fecha y evidencia.
3. Este documento no reemplaza al plan de la tarea en curso (`docs/planes/`) ni al registro de pendientes de validación humana.
