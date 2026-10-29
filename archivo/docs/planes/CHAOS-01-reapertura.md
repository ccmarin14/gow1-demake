# Plan de corrección — `GOW8B-CHAOS-01` (reapertura por hallazgo visual)

**Estado:** propuesto. Requiere aprobación del auditor (COMPUERTA 1) y de la usuaria (COMPUERTA 2) antes de que nadie edite archivos de código.

**Fecha:** 2026-10-20
**Origen del hallazgo:** validación directa de la usuaria con teclado y vista propios. Ver `docs/pendientes-de-validacion-humana.md` referencia #3 y `docs/verificacion.md` §GOW8B-CHAOS-01 → REAPERTURA.

---

## 1. Hallazgo y evidencia

Al mirar el juego en vivo, la usuaria reportó: *"no existen cadenas, solo golpes con una espada en mano"*.

Verificado por lectura de código (sin ediciones):

- `src/main.ts` **no dibuja el arma**. El `grep` de `add.sprite|add.graphics|add.line|add.polygon` devuelve solo el fondo (`add.image`, l.63) y los rectángulos de debug (`attackHitboxRect` l.125-134, `targetRects` l.167).
- `scripts/gen-kratos-anim.py:184-186` dibuja, como máximo, una línea de 3 px (`limb(d, near_arm[2], tip, 3, DARK)`). Lo percibido como "espada" es el brazo extendido.
- La etapa se aprobó midiendo **geometría de colisión** (`nearX`/`farX`, span vertical, cobertura, checksum) sin **ningún criterio sobre el render**. Falso positivo: se validó el modelo matemático y se lo llamó "identidad del arma".

**No es arte fino.** Un arma invisible es funcionalidad faltante.

## 2. Decisión de diseño tomada por la usuaria

- **Representación del arma:** cadena como **línea segmentada** desde el agarre hasta la hoja, con la hoja recorriendo el arco ya modelado (opción 1 — la cadena es la identidad del arma).
- **Técnica de dibujo:** segmentos **alineados a píxel entero** (opción 1), coherente con la convención del proyecto (`add.rectangle`/`add.sprite` para todo el gameplay; `Graphics` solo en el overlay DEV). Sin riesgo de rasterizado con huecos en diagonales.

## 3. Línea base (H1 — cambio exigido por el auditor)

**El árbol de trabajo está sucio.** `git status` muestra sin commitear: `src/config.ts` (`rollSpeed 260`, `ROLL_TICKS 20`, comentario reescrito), `src/main.ts` (rotación de la rodada, fix de `stopLoop()`), `vite.config.ts` (`allowedHosts`), más documentación. Todo eso pertenece a la tarea anterior (ROLL-01) y **no está auditado en esta tarea**.

**Regla de la línea base:** toda comparación de regresión se hace contra **el árbol de trabajo actual al inicio de la implementación**, no contra `HEAD`. Procedimiento:

1. Antes de editar: `git stash create` (o `git diff > /tmp/opencode/chaos-01-baseline.diff`) y registrar el hash del estado inicial.
2. Guardar copia de los artefactos de medición de la línea base (cobertura por cadena, checksum de determinismo, hashes de assets).
3. Al cerrar: comparar contra esa copia, **no** contra `HEAD`.

## 4. Archivos que se tocarán

| Archivo | Cambio |
|---|---|
| `src/sim/attack.ts` | Añadir `bladePoseForTick(player, params)`: función pura que devuelve `{ gripX, gripY, bladeCenterX, bladeCenterY, angleRad }` en coordenadas de mundo, o `null` si la fase no es `active`. Extraer la aritmética compartida de `computeAttackHitbox` **sin alterar ninguna expresión** (mismo `clamp`, mismo `- 0.5`, mismo orden). `computeAttackHitbox` pasa a apoyarse en el helper y reconstruye la caja **idénticamente**. |
| `src/main.ts` | Capa de render del arma: grupos de rectángulos **reutilizados** (no recreados por frame), visibles **solo** en fase `active`. Dibuja (a) cadena = serie de segmentos de 1 px alineados a entero entre `grip` y `bladeCenter`, (b) hoja = polígono corto centrado en `bladeCenter`, orientado por `angleRad`. |
| `src/config.ts` | Añadir en `CONFIG.presentation` los parámetros visuales del arma: colores de cadena y hoja (**únicos**, ver criterio 1), grosor de cadena (px), número de segmentos, largo y alto de hoja, y `weaponDepth`. **Sin literales de arma en `main.ts`.** |
| `scripts/gen-kratos-anim.py` | Eliminar **únicamente** el bloque `if pose.get("blade"):` (l.184-186) y las claves `blade=` muertas de las poses `ATTACK` (l.227, 229, 231). El brazo vuelve a ser brazo; el arma la aporta la capa nueva. |

**Fuera de alcance:** arte fino del personaje (Bloque 11), bug C15 del dodge, deuda de type-safety.

## 5. Orden de profundidad (H2 — cambio exigido por el auditor)

Estado actual: jugador depth 0, `attackHitboxRect` depth 5, objetivos depth 1, overlay DEV depth 8/9.

**Decisión:**
- El arma se dibuja a `CONFIG.presentation.weaponDepth = 3`: **por encima** del jugador (0) y de los objetivos (1), **por debajo** del rect de debug (5) para que el overlay de depuración siga siendo visible si se activa.
- **El `attackHitboxRect` de debug permanece** (es herramienta de depuración), pero como su alpha es 0.25 y queda por encima, **las mediciones de los criterios 1–3 se harán con el rect de debug oculto** o restando su contribución de color. Esto se explicita en cada medición.

## 6. Criterios de aceptación (binarios)

Escenario y secuencia: escenario por defecto sin objetivo sobre el jugador (a confirmar: `movement`), con pulsación de `J` disparada por eventos de teclado al canvas con foco. Medición con Chrome DevTools.

1. **El arma existe en el render.** Con la fase `active`, la banda del arco contiene píxeles de los colores de cadena y hoja; con la fase `none` en el mismo tick de posición, **cero**. Los colores de cadena/hoja deben ser **únicos en el frame muestreado** y **distintos de todos** los ya presentes en `CONFIG.presentation` (`platformColor`, `targetColor`, `targetHitColor`, `hitboxColor`, `hitboxColorChain1/2`, `scale*`). Verificación por enumeración de colores únicos en la banda, no por "el color aparece".
2. **La hoja recorre el arco.** La posición de la hoja **avanza monotónicamente** entre ticks activos consecutivos (no se repite la misma posición dos ticks seguidos) y coincide con `bladePoseForTick` con tolerancia ≤1 px. Se verifica en `facing = 1` **y** `facing = -1` (H7).
3. **La cadena une agarre y hoja.** En cada tick activo hay píxeles del color de cadena a lo largo de la recta `grip → bladeCenter` (verificado por muestreo de píxeles en puntos intermedios redondeados a entero, no por "hay píxeles de ese color en la banda"). No aparecen fuera de `active`.
4. **Cota vertical dura (H4, reescritura del antiguo criterio 5).** El borde superior de la hoja (`bladeCenterY - weaponBladeHeight/2`) se mide en simulación pura con `bladePoseForTick` sobre **todos** los ticks activos de cada cadena y en `facing = ±1`.

   **DECISIÓN DE LA USUARIA (2026-10-20): el arco del remate descendente puede pasar por encima de la cabeza, y se declara como excepción numérica intencional.** Cota por cadena, sobre la línea de pies del jugador:

   | Cadena | Cota declarada (px sobre la línea de pies) | Motivo |
   |---|---|---|
   | `chain0` | ≤ 45 | golpe horizontal ascendente; el pico real renderizado es **39.58 px** (medido sobre todos los ticks activos, no solo el primero) — deja ≥ 5 px de margen |
   | `chain1` | ≤ 60 | barrido ascendente; roza la altura de la cabeza (59) pero no la supera |
   | `chain2` | ≤ 70 | **overhead slam: sube intencionalmente sobre la cabeza** (remate descendente) |

   **Medido con la geometría actual** (línea de pies en y=262; sprite 59 px):

   | Cadena | Borde superior medido | Consumo de la cota | Ticks activos |
   |---|---|---|---|
   | `chain0` | 234.56 → **39.6 px de pico** sobre los pies (tick 3; el tick 0 es el más bajo) | 88 % de 45 | 4 |
   | `chain1` | 205.86 → 56.1 px sobre los pies | 94 % de 60 | 4 |
   | `chain2` | 196.23 → **65.8 px sobre los pies** | 94 % de 70 | 4 |

   ⚠️ **Nota de método:** medir solo el **primer** tick activo subestima el pico de un arco **ascendente** como `chain0` (27.4 px en vez de 39.6 px). La cota se verifica sobre **todos** los ticks activos, tomando el máximo.

   Valores **idénticos** en `facing = 1` y `facing = -1` (simetría verificada; solo el X se espeja).

   La confirmación **estética** del arco alto (¿se ve bien que el remate pase por encima de la cabeza?) es deuda humana no bloqueante → `docs/pendientes-de-validacion-humana.md`.
5. **Sin regresión de lo aprobado** (contra la línea base de la sección 3): cobertura intacta (`chain0` desde dx≥8, `chain1` desde dx≥9, `chain2` desde dx≥14; sin impacto a dx≤7); contacto único por objetivo por golpe; `attackHits` reiniciado por golpe; hitbox solo en `active`; los 5 bloqueos del combo; movimiento horizontal y límites 48.5/431.5; salto simple, doble salto y rodada intactos; determinismo por checksum idéntico.
6. **Equivalencia numérica de la refactorización.** Para una rejilla de ticks (p. ej. `attackTicks` 1..`activeTicks` de las 3 cadenas), el `centerX`/`centerY` del `computeAttackHitbox` nuevo y el del viejo son **idénticos con tolerancia 0**.
7. **Arte protegido por hash.** Tras regenerar las hojas, SHA-256 de `kratos-idle.png`, `kratos-run.png`, `kratos-air.png` y `kratos-roll.png` **idénticos** a la línea base (hashes registrados al inicio). Solo cambia `kratos-attack.png`. Además, verificar que las poses de ataque **siguen ancladas a la línea de pies** (el `bbox`-translate de l.188-190 puede desplazar la pose al quitar la línea).
8. **Shell sano.** `pnpm exec tsc --noEmit` y `pnpm build` exit 0; `__GOW8B` ausente de `dist/`; sin dependencias nuevas; `git diff HEAD -- package.json pnpm-lock.yaml` vacío.
9. **Navegador** en puerto propio (no 5173/5175) y consola sin errores nuevos.

## 7. Regresiones protegidas

Mecánica del arco y cobertura; determinismo; los 5 bloqueos del combo; movimiento horizontal y límites; salto simple, doble salto y rodada (con `ROLL_TICKS=20`, `rollSpeed=260` y el clip que avanza, todo de la línea base sucia); arte de idle/run/air/roll intacto por hash.

## 7.bis Hallazgos colaterales del ciclo de implementación (2026-10-20)

### HC-1 — El rectángulo de debug del golpe se dibuja en la build de producción
`src/main.ts` crea y muestra `attackHitboxRect` (l.132-144) **sin guarda `import.meta.env.DEV`**. Solo `debugText` (l.104) y el overlay de escala (l.150) están guardados por `DEV`. Consecuencia: el rectángulo semitransparente del hitbox se dibuja en el juego real. Antes era "el único visual del golpe"; ahora convive con el arma real y **tiñe la hoja** (la caja 16×14 contiene a la hoja 12×6 y comparten centro). Además, durante las mediciones de los criterios 1 y 3 el rect contamina los píxeles y hay que ocultarlo.

**Decisión del orquestador (2026-10-20): DEJARLO COMO ESTÁ por ahora.** No se toca en esta corrección; queda registrado como deuda no bloqueante para revisar cuando se aborde la presentación/limpieza del shell. *(Pendiente de decisión de la usuaria.)*

### HC-2 — El ancla de determinismo del plan estaba mal definida
El plan original exigía "hash djb2 = `cbb6368e`" sin especificar si la traza incluye la fila del **estado inicial** (frame 0, antes del primer `step`). El implementador midió `bc855e46` porque incluyó esa fila; el orquestador midió `cbb6368e` sin incluirla. **Ambas trazas son deterministas**; la discrepancia era de convención, no de comportamiento.

**Corrección:** el ancla queda definida como **identidad antes/después** (el mismo instrumento, medido dos veces) y **no** como un valor absoluto. Un valor absoluto sin la convención de la traza no es reproducible por terceros. La longitud medida con la traza sin fila inicial es **1867**.

## 8. Proceso

1. **COMPUERTA 1 — auditoría del plan** por un subagente distinto del implementador. ✅ *Realizada 2026-10-20; veredicto APROBADO CON CAMBIOS, 10 puntos incorporados en este documento.*
2. **COMPUERTA 2 — revisión de la usuaria.** Pendiente.
3. Implementación por **un único** implementador (subagente).
4. **Reauditoría** por un auditor **distinto** del implementador.
5. Registro de aprendizajes y actualización de `docs/pendientes-de-validacion-humana.md`.
6. Commit **solo** con autorización explícita de la usuaria.

## 9. Trazabilidad de los cambios exigidos por el auditor

| # | Hallazgo | Dónde se resolvió |
|---|---|---|
| H1 | Árbol de trabajo sucio | §3 (línea base) |
| H2 | `setDepth` no contemplado | §5 |
| H3 | Criterio 1 no binario (colores) | §6.1 |
| H4 | Criterio 5 era decisión abierta | §6.4 |
| H5 | `Graphics` vs convención | §2 (segmentos alineados a entero) |
| H6 | `tip` = centro, no punta | §4 (`bladeCenterX/Y`) |
| H7 | Espejado por `facing` | §4 y §6.2 |
| H8 | Procedimiento del generador + hashes | §4 y §6.7 |
| — | Refactor sin alterar expresiones | §4 y §6.6 |
| — | Escenario y secuencia de medición | §6 (encabezado) |
