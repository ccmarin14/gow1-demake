# Pendientes de validación humana

Registro central de las comprobaciones que **solo la usuaria puede hacer** con su propio teclado y su propia vista, en su navegador.

## Por qué existe este documento

Este runtime de agentes **no admite entrada de imagen**, así que ni el orquestador ni los subagentes auditores pueden *interpretar* capturas: pueden medir píxeles (`ImageData`), comparar siluetas, contar cuadros y verificar estado de simulación, pero **no pueden juzgar cómo se ve ni cómo se siente** algo en movimiento. Esa parte queda del lado humano.

Además, las pruebas de juego de los agentes usan **eventos de teclado sintéticos** (CDP/`KeyboardEvent`), no el teclado físico. La diferencia importa para la *sensación*: el orden real de `keydown`/`keyup`, la latencia percibida y el ritmo de pulsación de una persona no son reproducibles por inyección sintética.

Estas deudas son **no bloqueantes**: no detienen el desarrollo. Si al hacer una revisión aparece un defecto, se corrige por la compuerta normal del proceso (**plan → corrección → reauditoría**) sin haber frenado el avance.

> **Instrucción para los agentes:** este documento **no debe tratarse como un bloqueo**. Se avanza con la etapa siguiente aunque estos puntos sigan pendientes. Solo se actualiza el estado cuando la usuaria reporta el resultado de una revisión.

---

## Estado

| # | Qué hay que mirar | Dónde | Estado | Detectado |
|---|---|---|---|---|
| 1 | Composición Egeo + Kratos: piel pálida, marca roja, dos hojas/cadenas, pies apoyados en la cubierta y silueta/contraste legibles | `docs/referencias/egeo-kratos-composicion-480x270.png` a 1× y 2× nearest-neighbor | **Parcial** (2026-10-20) — se reconoce Kratos, el contraste funciona y la composición es creíble; "se ve pegado", diferido al arte fino (Bloque 11). | CMP-01 |
| 2 | Coherencia estética entre poses de Kratos, sin *jitter*, anclaje de pies consistente y presencia anatómica | `docs/preview/run-batch-8x.png` (lote `run` vigente) e `docs/preview/idle-vs-run-browser-4x.png` (lado a lado en el navegador) | **Parcial** (2026-10-27) — la hoja del modelo descartado no aplica. La deuda concreta del modelo nuevo es la referencia #9. | KRA-02 / KRATOS-ART-MODEL-01 |
| 3 | Silueta del ataque: el arco de las Cuchillas del Caos se lee como barrido y no como caja pegada al cuerpo | Juego en vivo, `J` frente a un objetivo | **Pendiente de reconexión** (2026-10-27) — el `attack` viejo está archivado y ahora existen 4 cuadros ASCII de solo cuerpo; el arco lo sigue dibujando `WeaponLayer`. Se mira en conjunto con la referencia #11 cuando el clip esté conectado. | CHAOS-01 / ART-POLISH-02 |
| 4 | **Voltereta lateral**: `A`/`D` + `SHIFT` ¿se lee como *voltereta* y no como *dash*? (con arte provisional de 4 cuadros es esperable que sea pobre; el arte final es del Bloque 11) | Juego en vivo, `SHIFT` | **Sin efecto tras el reinicio** (2026-10-26) — `kratos-roll.png` está archivado y el estado `roll` no tiene asset. Se vuelve a mirar cuando exista `roll` como grid. | ROLL-ART / ART-POLISH-02 |
| 5 | **Sensación de la rodada**: duración, sincronía del clip y transición de salida con teclado físico | Juego en vivo, `SHIFT` mantenido y soltado | **Sin efecto tras el reinicio** (2026-10-26) — no hay clip de rodada. | ROLL-ART |
| 6 | **Lateralidad de la rodada** percibida en ambos sentidos (`A`+`SHIFT` y `D`+`SHIFT`) | Juego en vivo | **Sin efecto tras el reinicio** (2026-10-26) — no hay clip de rodada. | ROLL-ART |
| 7 | **Cabeza de Kratos** (V-10): ¿se lee como casco/cara y no como "pico de ave"? Punto a mirar: el borde más claro y avanzado de la silueta a la altura de la cara y la forma de la corona | Juego en vivo, escenario `platforms` (Kratos en `x=240, y=262`) | **Pendiente** (2026-10-26) — la corrección R1–R5 **sí está aplicada** en el grid (perfil derecho, corona de 5 celdas, ojo, nariz). Falta el juicio estético y falta fijar la definición de R1, que hoy no se cumple bajo ninguna lectura literal (§4.3 de `estado-verificado.md`). | V-10 / P3.1 |
| 8 | **Ciclo `idle`**: diferencia de 8 celdas entre cuadros | Juego en vivo | **Retirado como criterio (2026-10-26)** — no se pide juicio humano sobre 8 celdas. La anatomía del maestro no deja cuello libre (la cabeza ocupa `y14..y24` y el pecho arranca en `y25`), así que el pecho no puede subir y la respiración solo puede ensanchar 4 filas. El cuadro existe, cumple invariantes y alterna a 983 ms; queda como está. El esfuerzo pasa al ciclo `run` | V-15 / P3 |
| 9 | **Ciclo `run`**: ¿la zancada se lee como carrera o como patinaje? | `docs/preview/run-batch-8x.png` (maestro, idle-01 y `run-00..03` a 8×), `docs/preview/idle-vs-run-browser-4x.png` (idle vs run en el navegador real) y juego en vivo con `→` | **Pendiente** (2026-10-27) — los **4 cuadros** están conectados y medidos (ciclo 166–183 ms, 37/37 celdas sonda, 987/987 píxeles exactos). Falta el juicio visual y decidir sobre los **8 px de deslizamiento por apoyo** que el dibujo no cubre | P3 / D-27 |
| 10 | **Ciclo `air`**: ~~¿el ascenso se lee como salto y la caída como extensión?~~ | — | **Archivado (2026-10-27)** — los 2 cuadros se rechazaron con medición (77 y 29 px de cambio, solo piernas) y además la sombra cocida viaja con el sprite (V-12). Reabrir exige primero una capa de sombra separada; no es una deuda de validación hoy | P3 / V-12 |
| 11 | **Lote `attack`**: ~~¿los 4 cuadros se leen como un golpe?~~ | — | **Archivado (2026-10-27)** — los 4 cuadros cambiaban solo un brazo (`x<48`) con torso, cadera y piernas congelados. Reabrir exige giro de torso y cadera, no más cuadros. No es una deuda de validación hoy | P3 / D-26 |

---

## Detalle por etapa

### CMP-01 — Composición visual (referencia #1)

**Qué comprobar:** abrir `docs/referencias/egeo-kratos-composicion-480x270.png` a **1×** y a **2× nearest-neighbor** y confirmar: piel pálida, marca roja, dos hojas/cadenas, pies apoyados en la cubierta, y silueta/contraste legibles.

**Hallazgo relacionado del auditor:** no encontró rojo saturado sino un marrón oscuro rojizo (hue ≈ 2°), propiedad del asset de la etapa 2 y no una regresión. El PNG de Kratos usa **transparencia parcial en todos sus píxeles**, así que los bordes se mezclan con el fondo y la silueta podría verse suavizada — riesgo visual a comprobar aquí (§CMP-01 de `verificacion.md`).

### GOW8B-KRA-02 — Arte de animación de Kratos (referencia #2)

**Qué comprobar:** la **hoja de contacto** `docs/referencias/kratos-anim-contact-sheet.png`: coherencia estética entre poses, ausencia de *jitter* y anclaje de pies consistente.

**Deuda no bloqueante asociada:** la hoja `kratos-attack.png` (3 cuadros) está **archivada** y el estado `attack` no tiene asset. La observación histórica que decía "4 cuadros pero solo mapea 3" era una cifra incorrecta, corregida el 2026-10-21 contra el asset real; hoy esa hoja ya no participa del juego.

### GOW8B-CHAOS-01 — Cuchillas del Caos (referencia #3)

**Estado: DEFECTO confirmado (2026-10-20). Etapa REABIERTA.** No es una observación de arte fino: **el arma no está implementada visualmente**. Detalle completo, causa raíz y alcance en `docs/verificacion.md` §GOW8B-CHAOS-01 → REAPERTURA.

**Qué comprobar (cuando la corrección esté lista):** que el golpe se lea como **arco barrido** por la cadena y no como una caja pegada al cuerpo, con **armas y cadenas visibles** en pantalla.

**Observaciones no bloqueantes para tener en cuenta al mirar (siguen vigentes, ahora como síntoma del defecto):**
- **Pérdida de contacto a muy corta distancia:** a 7 px o menos ya no golpea ninguna cadena (`minReach` subió de 6 a 13.94). No rompe `GOW8B-LIGHT-01` (cuya evidencia se tomó a 40 px) pero **cambia la sensación en cuerpo a cuerpo**.
- **La envolvente vertical creció de 16 a 71.71 px:** el arco llega hasta ~65.7 px sobre la línea de pies con un jugador de 59 px, o sea **por encima de la cabeza**. Ya no es "observación": hay que revisarlo a la luz de lo que se ve.  

### GOW8B-ROLL-ART — Rodada (referencias #4, #5, #6)

**Qué comprobar** (§GOW8B-ROLL-ART de `verificacion.md`, criterios 1, 3 y 9):

1. **Lectura visual:** `A`/`D` + `SHIFT` → ¿se lee como **voltereta lateral** y no como *dash*?
2. **Sensación real:** duración, sincronía del clip y transición de salida con **teclado físico**.
3. **Dirección:** lateralidad percibida en ambos sentidos.

**Contexto para la revisión:** Tras correcciones aplicadas en este ciclo (arreglo de animación que estaba congelada en frame 0, ajuste de timing a 20 ticks / rollSpeed 260, e introducción de rotación de sprite durante la rodada), el clip avanza sus 4 cuadros y hay una cola vulnerable de 5 ticks. La lectura visual final es lo único que no fue posible verificar por agentes. El arte de la rodada es **provisional de 4 cuadros**; el arte final es del **Bloque 11**. Lo que se busca confirmar es que la *silueta* se lea como voltereta, no que se vea bien.

#### Guion de prueba detallado (2026-10-20)

**Cómo probar:** en `http://localhost:5193/` (o `pnpm dev`), con teclado físico, en el escenario `movement`. Seis preguntas concretas, cada una con su veredicto OK / Defecto:

| # | Pregunta | Cómo se prueba | Qué se considera OK | Qué se considera defecto |
|---|---|---|---|---|
| 4 | **¿Se lee como voltereta?** | `D` + `SHIFT` y `A` + `SHIFT` parado | Se percibe que el cuerpo **gira / se da vuelta** | Se ve como el personaje deslizándose de pie, o un cartón rotando sin peso |
| 5 | **¿Sirve para esquivar?** | Usar `SHIFT` contra un ataque (`J`/`K` del enemigo) | La rodada te saca del golpe y se siente una herramienta de esquiva real | Solo decora: te agarran igual o no se siente distinta de caminar rápido |
| 6 | **¿La duración está bien?** | `SHIFT` varias veces seguidas | ~333 ms: se siente con peso, ni instantánea ni lenta | Demasiado larga (molesta) o demasiado corta (inapreciable) |
| 7 | **¿La distancia está bien?** | `SHIFT` desde un extremo del escenario | Recorre ~82 px: se siente como un lance, no un paso | Muy corta (no te mueve) o muy larga (te pega a la pared) |
| 8 | **¿La salida se siente bien?** | `SHIFT` y mirar el momento en que termina | Termina y retoma el control sin freno raro ni deslizamiento | El personaje sigue deslizándose, o se frena en seco de forma brusca |
| 9 | **¿La cola vulnerable se siente justa?** | Rodar *justo* cuando llega un ataque | Se entiende que rodar demasiado temprano te deja expuesto los últimos 5 ticks | Se siente injusto: "rodé y me agarraron igual sin explicación" |

**Notas para quien prueba:**
- Los puntos **4** y **5** son los importantes: si la rodada no se lee como voltereta o no sirve para esquivar, el resto es secundario.
- El arte es **provisional** (Bloque 11 hace el arte final). Un veredicto de "se ve pobre pero se entiende que gira" es **suficiente** en esta etapa.
- Si algo es defecto, no hace falta diagnosticarlo: alcanza con describir **qué se vio** y cuándo.


### V-10 / P3.1 — Cabeza de Kratos (referencia #7)

**Qué cambió:** todo el arte de Kratos se descartó y se reconstruye desde grids ASCII. El maestro es `grids/kratos/master.txt` y de él derivan **6 cuadros activos**: `master` (neutral), `idle-01` y `run-00..03`. El juego reproduce `kratos-idle` y `kratos-run`; `attack`, `roll`, `air` y `guard` siguen usando el cuadro estático.

**Estado de la cabeza:** la corrección R1–R5 de la etapa P3.1 **está aplicada** en el grid — perfil derecho en `y14..y20`, corona de 5 celdas, ojo `a` en `(54,18)` entre `j`, nariz `d` en `(53,19)`. La afirmación anterior de este documento ("el maestro hereda la cabeza del grid anterior, no fue rediseñado") era falsa y queda corregida.

**Qué comprobar en pantalla:**

1. **Cara, no pico.** ¿La cabeza se lee como casco con rostro, o aparece un saliente afilado hacia la derecha? El criterio está en las reglas R1–R5 de `docs/planes/PIXEL-ART-ASCII-MASTER-01.md` §P3.1.
2. **Masa y silueta.** ¿La figura tiene volumen de guerrero espartano, o se ve como un maniquí de alambre?
3. **Legibilidad a resolución interna.** El canvas es 480×270; Kratos mide 97×59. ¿Se distingue a esa escala?

**Qué NO se puede concluir de la medición:** que se vea bien. Se verificó que el sprite se dibuja en el offset exacto (`192,203` en reposo, `277,203` en carrera), que la captura en carrera coincide **987/987 píxeles (100 %)** con `kratos-run-01.png` y que en reposo coincide **994/1001** con `kratos-neutral.png`, con consola limpia. Nada de eso juzga la lectura estética.

**R1 no se cumple bajo ninguna lectura literal.** Las 6 celdas `a` en borde de silueta — `(48,20)`, `(50,21)`, `(19,36)`, `(21,36)`, `(77,37)`, `(78,36)` — bordean transparencia conectada al fondo, y dos de ellas caen **dentro** de `regions.head`. Lectura global: 6 fallos. Lectura solo-cabeza: 2 fallos. Lectura contorno-exterior: 6 fallos. Falta fijar la definición antes de declarar R1 cumplida o incumplida; vecinos medidos y detalle en `docs/estado-verificado.md` §4.3.

### P3 — Ciclo `run` (referencia #9)

**Qué cambió (2026-10-27):** `idle` sigue con dos cuadros (`master.txt` + `idle-01` dibujado, 8 celdas de pecho, cabeza intacta) y `run` pasa a **4 cuadros** (`run-00..03`), **conectados al juego**. Los 12 cuadros que solo movían una extremidad (`run-00..05` viejos, `air-00/01`, `attack-00..03`) se archivaron con sus métricas. Los cuadros derivados por traslación (`idle-00`, `run-00..08` viejos) siguen borrados (V-15).

**Qué comprobar, primero en imagen y después con teclado físico:**

1. **`run` corre, no patina.** Abrir `docs/preview/idle-vs-run-browser-4x.png` (idle y carrera lado a lado, del navegador real) y `docs/preview/run-batch-8x.png` (los 6 cuadros activos a 8×). La pregunta es si la **alternancia de piernas más el bombeo de puños** se lee como carrera. Si no, se redibuja el recorrido del pie, no se traslada nada.
2. **Cadencia.** El ciclo dura **166–183 ms** (≈42 ms por pose) a velocidad máxima. ¿Se siente sprint o aleteo? Es el número que se ajusta (vía `stridePx`) si molesta.
3. **Deslizamiento.** Con teclado físico: ¿se nota que el pie apoyado no acompaña todo el recorrido? Medido: retrocede **4 px** de los **12 px** que recorre el cuerpo durante un apoyo; quedan **8 px** por apoyo.
4. **Transición reposo → carrera → reposo.** ¿El paso de `idle` a `run` se siente limpio o hay un salto?
5. **`idle` respira, no tirita.** Deuda retirada como criterio (#8): solo se reporta si molesta.

**Lo que sí quedó medido (2026-10-27):** `idle` alterna 2 cuadros con período **983 ms**. `run-00..03` pasa `I1`–`I4`, `I6`, `I7` e **I8** (cambios de 446/311/441/306 px; `head`, `torso_core` y `shadow` en **0 px**), tiene 3 componentes conexas como el maestro y masa 979–987 px. El clip alterna `0→1→2→3→0` sin atascarse, clasifica **37/37** celdas sonda en el cuadro correcto y la captura coincide **987/987 píxeles** con `kratos-run-01.png`; consola limpia.

**Nota técnica para futuras animaciones verticales:** la fila 58 del grid es una barra de sombra de contacto cocida en el sprite y se mantiene fija en todos los cuadros. Por eso el invariante I6 ("el píxel más bajo está en el suelo") pasa siempre y **deja de discriminar** si el pie está realmente apoyado (V-12). Un salto o un *bob* hacia abajo exige sacar la sombra del sprite y dibujarla en una capa aparte.

---

### P3 — Lote `attack` — **archivado (referencia #11 cerrada sin validación)**

Los cuatro cuadros se rechazaron el 2026-10-27 con medición: cambiaban **solo un brazo** (`x<48`), con torso, cadera, piernas y el brazo opuesto en **0 px**. El golpe se leía por el arco de `WeaponLayer`, no por una pose del cuerpo. Grids en `grids/kratos/archivo/`, hoja en `docs/preview/archivo/attack-batch.png`. **Para reabrirlo** hace falta giro de torso y cadera en windup y follow-through (y entonces el torso deja de estar congelado, que es lo correcto); más cuadros de brazo no cambian nada. No hay nada que validar hoy.


---

## Cómo reportar un resultado

Al completar una revisión, basta con indicar **el número de la tabla** y el veredicto:

- **OK** → se marca como validada en la tabla y en el §de la etapa correspondiente de `verificacion.md`.
- **Defecto** → se describe qué se vio; se abre la compuerta normal (**plan → corrección → reauditoría**) sin haber detenido el avance.

---

## Notas de proceso

- Este registro se creó el **2026-10-19** tras la etapa `GOW8B-ROLL-ART`, al detectar que las deudas de validación humana estaban **dispersas** en ~12 menciones dentro de `verificacion.md` y no existían como lista accionable.
- Los documentos por etapa **siguen** conteniendo su propia nota de límites (es correcto: describe qué **no** pudo probar esa etapa). Este archivo es el **índice** que las reúne; ante discrepancia, manda el detalle de la etapa.
- La razón técnica de fondo (runtime sin entrada de imagen; teclado sintético) está documentada en `docs/aprendizajes-del-proceso.md`.
- **Actualización 2026-10-26 (ciclo ASCII de Kratos).** Este registro afirmaba que `idle` y `run` no existían y que la cabeza no había sido rediseñada. Ambas cosas eran falsas: existen cuadros derivados del maestro y las correcciones R1–R5 están aplicadas en el grid. Lección: este documento envejece más rápido que el código; hay que revisarlo contra `docs/estado-verificado.md` antes de citarlo.
- **Actualización 2026-10-27.** `run` pasó de 6 cuadros a **4 conectados y medidos**; `air` y `attack` se archivaron con métricas y sus referencias (#10, #11) quedan cerradas sin validación. La referencia #9 es hoy la **única deuda visual abierta** del personaje, junto con la #7 (cabeza) y el deslizamiento residual de la zancada.
- **V-12, límite de medición vigente.** La fila 58 del grid es una barra de sombra cocida en el sprite, así que el invariante I6 pasa en todos los cuadros y ya no distingue un pie apoyado de uno levantado. Cualquier animación vertical futura necesita una capa de sombra separada; mientras tanto, la lectura de "peso" en el movimiento depende del ojo humano (referencia #9).
