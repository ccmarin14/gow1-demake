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
| 2 | Hoja de contacto del arte de Kratos: coherencia estética entre poses, sin *jitter*, anclaje de pies consistente y presencia anatómica | `docs/referencias/kratos-anim-contact-sheet.png` | **Actualizada en `KRATOS-ART-MODEL-01`** (2026-10-22) — rediseño del modelo maestro: torso heroico en V con relieve muscular de 1 px, tatuaje de Ares, faldón espartano pteruges con cinturón de bronce, cadenas de hierro fundidas en antebrazos con eslabón colgante, grebas anatómicas y sandalias; pies anclados en `y=58`. | KRA-02 / KRATOS-ART-MODEL-01 |
| 3 | Silueta del ataque: el arco de las Cuchillas del Caos se lee como barrido y no como caja pegada al cuerpo | Juego en vivo, `J` frente a un objetivo | **CORREGIDO en `ART-POLISH-02`, pendiente de re-mirar** (2026-10-21) — ahora las Cuchillas del Caos se lanzan en `startup`, barren con cadena ondulada + hoja ganchuda + estela en arco en `active` y se retraen en `recovery`, además de estar en manos de Kratos al correr y saltar. | CHAOS-01 / ART-POLISH-02 |
| 4 | **Voltereta lateral**: `A`/`D` + `SHIFT` ¿se lee como *voltereta* y no como *dash*? (con arte provisional de 4 cuadros es esperable que sea pobre; el arte final es del Bloque 11) | Juego en vivo, `SHIFT` | **CORREGIDO en `ART-POLISH-02`, pendiente de re-mirar** (2026-10-21) — eliminado el `setRotation` alrededor de los pies (que hundía a Kratos fuera de pantalla) y reemplazado por 4 cuadros de voltereta a ras de suelo (`zambullida` → `ovillo sobre espalda` → `giro de cadera` → `guardia baja`) apoyados en `y=58`. | ROLL-ART / ART-POLISH-02 |
| 5 | **Sensación de la rodada**: duración, sincronía del clip y transición de salida con teclado físico | Juego en vivo, `SHIFT` mantenido y soltado | **Pendiente** | ROLL-ART |
| 6 | **Lateralidad de la rodada** percibida en ambos sentidos (`A`+`SHIFT` y `D`+`SHIFT`) | Juego en vivo | **Pendiente** | ROLL-ART |

---

## Detalle por etapa

### CMP-01 — Composición visual (referencia #1)

**Qué comprobar:** abrir `docs/referencias/egeo-kratos-composicion-480x270.png` a **1×** y a **2× nearest-neighbor** y confirmar: piel pálida, marca roja, dos hojas/cadenas, pies apoyados en la cubierta, y silueta/contraste legibles.

**Hallazgo relacionado del auditor:** no encontró rojo saturado sino un marrón oscuro rojizo (hue ≈ 2°), propiedad del asset de la etapa 2 y no una regresión. El PNG de Kratos usa **transparencia parcial en todos sus píxeles**, así que los bordes se mezclan con el fondo y la silueta podría verse suavizada — riesgo visual a comprobar aquí (§CMP-01 de `verificacion.md`).

### GOW8B-KRA-02 — Arte de animación de Kratos (referencia #2)

**Qué comprobar:** la **hoja de contacto** `docs/referencias/kratos-anim-contact-sheet.png`: coherencia estética entre poses, ausencia de *jitter* y anclaje de pies consistente.

**Deuda no bloqueante asociada:** no hay. La hoja `kratos-attack.png` tiene **3 cuadros** (291 px / 97 px por cuadro) y `attackPhase` mapea los **3** (`startup`/`active`/`recovery`); la observación anterior que decía "4 cuadros pero solo mapea 3" era una cifra incorrecta, corregida el 2026-10-21 tras verificarla contra el asset real.

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
