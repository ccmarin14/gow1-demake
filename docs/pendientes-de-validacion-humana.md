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
| 1 | Composición Egeo + Kratos: piel pálida, marca roja, dos hojas/cadenas, pies apoyados en la cubierta y silueta/contraste legibles | `docs/referencias/egeo-kratos-composicion-480x270.png` a 1× y 2× nearest-neighbor | **Pendiente** | CMP-01 |
| 2 | Hoja de contacto del arte de Kratos: coherencia estética entre poses, sin *jitter*, anclaje de pies consistente | `docs/referencias/kratos-anim-contact-sheet.png` | **Pendiente** | KRA-02 |
| 3 | Silueta del ataque: el arco de las Cuchillas del Caos se lee como barrido y no como caja pegada al cuerpo | Juego en vivo, `J` frente a un objetivo | **Pendiente** | CHAOS-01 |
| 4 | **Voltereta lateral**: `A`/`D` + `SHIFT` ¿se lee como *voltereta* y no como *dash*? (con arte provisional de 4 cuadros es esperable que sea pobre; el arte final es del Bloque 11) | Juego en vivo, `SHIFT` | **Pendiente** | ROLL-ART |
| 5 | **Sensación de la rodada**: duración, sincronía del clip y transición de salida con teclado físico | Juego en vivo, `SHIFT` mantenido y soltado | **Pendiente** | ROLL-ART |
| 6 | **Lateralidad de la rodada** percibida en ambos sentidos (`A`+`SHIFT` y `D`+`SHIFT`) | Juego en vivo | **Pendiente** | ROLL-ART |

---

## Detalle por etapa

### CMP-01 — Composición visual (referencia #1)

**Qué comprobar:** abrir `docs/referencias/egeo-kratos-composicion-480x270.png` a **1×** y a **2× nearest-neighbor** y confirmar: piel pálida, marca roja, dos hojas/cadenas, pies apoyados en la cubierta, y silueta/contraste legibles.

**Hallazgo relacionado del auditor:** no encontró rojo saturado sino un marrón oscuro rojizo (hue ≈ 2°), propiedad del asset de la etapa 2 y no una regresión. El PNG de Kratos usa **transparencia parcial en todos sus píxeles**, así que los bordes se mezclan con el fondo y la silueta podría verse suavizada — riesgo visual a comprobar aquí (§CMP-01 de `verificacion.md`).

### GOW8B-KRA-02 — Arte de animación de Kratos (referencia #2)

**Qué comprobar:** la **hoja de contacto** `docs/referencias/kratos-anim-contact-sheet.png`: coherencia estética entre poses, ausencia de *jitter* y anclaje de pies consistente.

**Deuda no bloqueante asociada:** la hoja `kratos-attack.png` tiene **4 cuadros** pero `attackPhase` solo mapea **3**; cumple el criterio (≥3), pero conviene saberlo al mirarla.

### GOW8B-CHAOS-01 — Cuchillas del Caos (referencia #3)

**Qué comprobar:** que el golpe se lea como **arco barrido** por la cadena y no como una caja pegada al cuerpo.

**Observaciones no bloqueantes para tener en cuenta al mirar:**
- **Pérdida de contacto a muy corta distancia:** a 7 px o menos ya no golpea ninguna cadena (`minReach` subió de 6 a 13.94). No rompe `GOW8B-LIGHT-01` (cuya evidencia se tomó a 40 px) pero **cambia la sensación en cuerpo a cuerpo**.
- **La envolvente vertical creció de 16 a 71.71 px:** el arco llega hasta ~65.7 px sobre la línea de pies con un jugador de 59 px, o sea **por encima de la cabeza**.

### GOW8B-ROLL-ART — Rodada (referencias #4, #5, #6)

**Qué comprobar** (§GOW8B-ROLL-ART de `verificacion.md`, criterios 1, 3 y 9):

1. **Lectura visual:** `A`/`D` + `SHIFT` → ¿se lee como **voltereta lateral** y no como *dash*?
2. **Sensación real:** duración, sincronía del clip y transición de salida con **teclado físico**.
3. **Dirección:** lateralidad percibida en ambos sentidos.

**Contexto para la revisión:** el arte de la rodada es **provisional de 4 cuadros** (todos distintos entre sí, pero sin revisión estética). Es esperable que se lea **pobre**; el arte final es del **Bloque 11**. Lo que se busca confirmar es que la *silueta* se lea como voltereta, no que se vea bien.

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
