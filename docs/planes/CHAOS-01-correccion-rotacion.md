# Plan de corrección — `GOW8B-CHAOS-01` (hallazgos de la reauditoría 2026-10-20/21)

**Estado:** propuesto. Requiere aprobación del **auditor que reportó** (COMPUERTA 1) antes de que nadie edite. La usuaria ya aprobó las decisiones de diseño (COMPUERTA 2).

**Origen:** reauditoría de solo lectura sobre la implementación del arma (`docs/planes/CHAOS-01-reapertura.md`), veredicto **APROBADO CON OBSERVACIONES**.

---

## Hallazgo A (bloqueante) — La hoja gira al revés que la cadena

**Evidencia del auditor (píxeles renderizados, pendiente del borde superior de la hoja vs pendiente de la cadena):**

| Cadena | Pendiente cadena | Pendiente hoja (actual) |
|---|---|---|
| `chain0` (α = −10°) | +0.136 | +0.091 |
| `chain1` (α = 40°) | −0.56 | **+0.333** |
| `chain2` (α = 55°) | −0.875 | **+0.444** |

Signo opuesto en `chain1`/`chain2`: la hoja **cruza** la cadena en vez de continuarla. El auditor además verificó en navegador que negar la rotación alinea la hoja con la cadena.

**Verificación del orquestador (aritmética independiente, misma conclusión):**

La dirección de la cadena en coordenadas de pantalla es `(facing·cos α, −sin α)`, con pendiente `−tan α / facing`. Un rectángulo de Phaser rotado por `θ` tiene su eje largo a lo largo de `(cos θ, sin θ)`, con pendiente `tan θ`. Para que la hoja yazca **sobre** la cadena y no a través de ella:

```
tan θ = −tan α / facing   →   θ = −α / facing
```

Como en este código `facing ∈ {+1, −1}`, `1/facing = facing`, así que en la práctica se escribe `θ = −α · facing`. **La forma general es `θ = −α / facing`**; la forma con multiplicación vale solo porque `facing` es ±1.

El código hace `θ = +α · facing`. **El signo está invertido**, de forma sistemática y en todas las cadenas.

**Causa raíz:** confusión de convención entre el ángulo del arco (medido con `sin` positivo = arriba, o sea Y-negativo en pantalla) y la rotación de Phaser (positiva = horario en pantalla). Son sistemas con el eje Y invertido entre sí; convertir de uno a otro exige negar el ángulo, y la implementación no lo hizo.

**Archivo y línea exactos:** `src/main.ts:223`
```ts
this.weaponBladeRect?.setRotation(pose.angleRad * (player && player.facing === -1 ? -1 : 1));
```

**Cambio propuesto (alcance mínimo, una línea):**
```ts
// The arc angle is measured with `sin` positive = upward (screen Y negative),
// while Phaser's rotation is positive = clockwise (screen Y positive). The two
// conventions have opposite Y axes, so the sign must flip for the blade to lie
// ALONG the chain instead of crossing it.
this.weaponBladeRect?.setRotation(-pose.angleRad * (player && player.facing === -1 ? -1 : 1));
```

## Hallazgo B (no bloqueante) — La cota declarada de `chain0` carece de margen

**Evidencia del auditor:** el orquestador midió el pico de `chain0` sobre el **primer** tick activo (27.4 px). Para un arco **ascendente** como `chain0`, el primer tick es el **más bajo**, no el más alto. El pico real renderizado de `chain0` es **39.58 px** (tick 3), a **0.42 px** de la cota declarada de 40 px.

Los picos de `chain1` (56.14 px ≤ 60) y `chain2` (65.77 px ≤ 70) sí coinciden con lo medido.

**Decisión del orquestador (2026-10-21), delegada por la usuaria ("la que tú digas", COMPUERTA 2): subir la cota declarada de `chain0` a 45 px**, sin tocar la geometría. La cota es una declaración de diseño, no un requisito de balance; cambiar el número no arriesga la cobertura aprobada.

**Cambio:** actualizar la tabla de cotas en `docs/planes/CHAOS-01-reapertura.md` §6.4 (`chain0` ≤ 45) con la justificación del margen.

## Hallazgo C (documental) — Cuadros de `kratos-attack.png`

El auditor detectó que **dos líneas** atribuyen **4 cuadros** a `kratos-attack.png`, que tiene **3** (291 px / 97 px por cuadro):

- `docs/pendientes-de-validacion-humana.md:42`
- `docs/verificacion.md:472`

**Cambio: corregir SOLO esas dos líneas.** ⚠️ **NO tocar ninguna otra referencia a "4 cuadros"**: todas las demás describen `kratos-roll.png`, que **sí tiene 4 cuadros** y están correctas (`pendientes-de-validacion-humana.md:24,62`; `verificacion.md:894,901,924,980,986,1000`; `aprendizajes-del-proceso.md:335`). Aplicar este cambio a ciegas sobre todas las coincidencias corrompería documentación correcta.

## Criterios de aceptación

1. **Alineación hoja/cadena (ángulo, no signo).** Para cada tick activo, medir el ángulo de la hoja y el de la cadena en píxeles renderizados y exigir **|Δángulo| ≤ 5°**, en `facing = 1` y `facing = -1`, con el rect de debug **oculto** (HC-1).

   La comparación se aplica **solo en los ticks donde |pendiente de la cadena| ≥ 0.15** (donde hay señal medible): `chain0` ticks 0 y 3; `chain1` ticks 0-2; `chain2` ticks 0-2.

   Los ticks casi horizontales — **`chain0` tick 2** (pendiente 0.055) y **`chain2` tick 3** (pendiente 0.022) — quedan **por debajo de la resolución de un píxel** (~1/16 ≈ 0.0625) y se reportan como **NO CONCLUYENTES por cuantización**, nunca como aprobados.

   *Por qué no alcanza comparar el signo:* en esos ticks ruidosos el error angular de una hoja mal rotada es de solo 6.25° y 2.5°, y el signo de la pendiente cae dentro del ruido de cuantización. Un test de signo los aprobaría. Con el arreglo, Δángulo = 0.00° en todos los ticks con señal; la tolerancia de 5° separa holgadamente del código actual (que da ≥ 6.25° donde hay señal, y hasta 110° en el remate).

2. **Cota vertical con margen:** re-medido sobre el **pico real** de cada cadena (todos los ticks activos, no solo el primero): `chain0` ≤ 45, `chain1` ≤ 60, `chain2` ≤ 70. El pico de `chain0` (39.58) deja ≥ 5 px de margen.

3. **Sin regresión:** la mecánica del arco no cambia (`setRotation` es puro render: `Transform.js` del propio Phaser, y `angleRad` solo llega a `main.ts:223`; ningún archivo de `sim/` lo consume). Cobertura intacta (chain0 ≥8, chain1 ≥9, chain2 ≥14; sin impacto ≤7); determinismo idéntico (mismo instrumento, dos veces); ROLL-01 intacto (`ROLL_TICKS=20`, `rollSpeed=260`, rotación de rodada, fix de `stopLoop()`); arte de idle/run/air/roll intacto por hash.

4. **Shell sano:** `tsc --noEmit` exit 0; `pnpm build` exit 0; `__GOW8B` ausente de `dist/`; sin dependencias nuevas.

5. **Consola** sin errores nuevos en navegador, puerto propio.

## Regresiones protegidas

Mecánica del arco y cobertura (el cambio es solo de orientación visual); determinismo; los 5 bloqueos del combo; movimiento/salto/doble salto/rodada; arte por hash.

## Fuera de alcance

HC-1 (el rect de debug en producción): el orquestador propuso dejarlo como está por ahora; **sin decisión de la usuaria**, queda registrado como deuda. Arte fino del personaje (Bloque 11). Bug C15 del dodge.

## Proceso

1. **COMPUERTA 1:** el auditor que reportó revisa este plan en solo lectura. ✅/⏳
2. **COMPUERTA 2:** decisiones de diseño ya aprobadas por la usuaria (cota 45, arreglar el signo).
3. Implementación por un **único** implementador.
4. **Reauditoría** por un auditor **distinto** del implementador.
5. Registro de aprendizajes y actualización de docs.
6. Commit **solo** con autorización explícita.

## Lección de proceso que este ciclo deja

El criterio 2 del plan medía **posición** de la hoja pero no **orientación**. Un objeto puede estar exactamente en el lugar correcto y aun así verse mal porque apunta al revés. Es la misma familia de error que el clip congelado y que el arma invisible: **el criterio medía una parte del observable y se declaró verificado el todo.**
