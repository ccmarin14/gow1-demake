# Plan de optimización integral — `GOW8B-OPTIM-01`

**Estado:** **APROBADO** (implementado y auditado en solo lectura el 2026-10-21).
**Subagentes:**
- **Implementador:** subagente `self` (`f6244a35-018f-4497-8e33-4933aa23bff6`, runtime Antigravity, modelo `inherit` / Gemini 4 Argon Medium).
- **Auditor (solo lectura):** subagente `self` distinto (`8fc183e0-f1ed-4a09-b266-05f45e20df08`, runtime Antigravity, modelo `inherit` / Gemini 4 Argon Medium) — veredicto **APROBADO** (8/8 criterios técnicos).
**Objetivo:** ejecutar las 5 fases de optimización técnica y estructural identificadas en la revisión integral del proyecto sin alterar las reglas de juego, el determinismo por tick, los checksums de simulación ni la cobertura de combate aprobada.

---

## 1. Línea base protegida (árbol de trabajo al inicio)

El árbol de trabajo contiene los cambios aprobados de `GOW8B-ROLL-01` / `GOW8B-ROLL-ART` y `GOW8B-CHAOS-01`. Se resguardó el diff inicial en `/tmp/optim01-baseline/working-tree.diff`.

### Checksums de referencia (simulación pura y escala derivada)
- `init_empty`: `5ae64ce0`
- `init_test`: `c3f1f3dc`
- `init_movement`: `09c68ba7`
- `init_platforms`: `09c68ba7`
- `init_combat`: `67b1fa98`
- `combat60` (traza combinada de 60 ticks con combo ligero `t=1,10,18`, carrera `t=25..39`, salto `t=30`, doble salto `t=42`, rodada `t=50`): `9f8ded3f`
- `checksumOf(CONFIG.scale)`: `da5b47b6`

### SHA-256 de assets en `public/assets/`
- `kratos-air.png`: `5deed24a5382d9e6ec61059d2b419548219c9544945741de32823a3abee1b1d0`
- `kratos-attack.png`: `34df8eeb19094bcf79f5cfdffaf1b4af9cb49faad0e6469585c2ded48cb61f65`
- `kratos-idle.png`: `48b02b96a8efb52d0d6c0f4acec2f6886bedd81d22eeba09921fa4ee779635de`
- `kratos-neutral.png`: `df52a7fc298e6fd41241f555cef8f4d2dd00a6b81034a333872a55b4f9390c4a`
- `kratos-roll.png`: `93bcb546a8d90d532dde0daed5473eacad6093e3cad8c1eb00c520c9e23602ce`
- `kratos-run.png`: `27ec7d858bf82a0eb31deabe8405cb541ecb193512f15a747c4c44441aa932bc`
- `egeo-fondo.png`: `8f8b5885de7af96889f24b28338f151ee11acff7d17339b28ea1949755349ee1`

---

## 2. Fases y archivos a modificar

### Fase 0 — Documentación y alineación de estado (Orquestador)
- `docs/planes/OPTIM-01.md`: este plan maestro.
- `docs/verificacion.md`: actualizar cabecera de «Estado vigente» para reflejar las etapas aprobadas hasta `GOW8B-CHAOS-01` (2026-10-21).
- `docs/arquitectura.md`: actualizar «Estado ejecutable actual» con escala de referencia, doble salto, rodada y Cuchillas del Caos.

### Fase 1 — Tipado estricto y limpieza de `: any`
- `src/config.ts`: eliminar las anotaciones `: any` en `const PLAYER` y `export const CONFIG` para que `as const` preserve los tipos literales y `GameConfig` sea el tipo real de la configuración.
- `src/sim/roll.ts`: eliminar los casts `(CONFIG as any)` y leer `CONFIG.player.dodge.rollSpeed` directamente con tipado estricto.
- `src/sim/world.ts`: eliminar `(hit: any)` al construir `ATTACK_COMBO`.

### Fase 2 — Optimización de inicialización y métricas $O(1)$
- `src/scale.ts`:
  - En `simulateDoubleJumpTicks`, acotar el bucle de búsqueda de `impulseTick` a `single.airTimeTicks` en lugar de `maxTicks` (`tickRate * 10 = 600`), y usar la variable `jumps` en el objeto retornado.
  - En `simulateJumpWithImpulses`, recibir un único `impulseTick: number` en lugar de instanciar dos `Set<number>` por iteración.
  - Resultado exigido: `checksumOf(CONFIG.scale)` debe permanecer **idéntico** (`da5b47b6`).
- `src/metrics.ts`:
  - Mantener un acumulador rodante `runningSum` en `FrameMetrics.record()` y `reset()` para que `avgFrameTimeMs` sea $O(1)$ sin recorrer el array de muestras en cada consulta.

### Fase 3 — Cero asignaciones redundantes en el bucle de simulación (60 Hz)
- `src/input/InputManager.ts`:
  - Agrupar los `Key` por `GameAction` en el constructor (en el orden canónico de `DOMAIN_ACTIONS`) para que `poll()` devuelva las acciones activas en orden canónico sin crear `new Set<GameAction>()` ni ejecutar `.filter()` con clausura en cada frame.
- `src/sim/types.ts`, `src/sim/engine.ts` y `src/sim/world.ts`:
  - En `sortActions`, añadir vía rápida (*fast-path*) cuando el array ya viene ordenado y sin duplicados (0 o 1 elemento, o estrictamente creciente en `ACTION_ORDER`) y evitar la doble normalización entre `Simulation.fixedStep` y `World.step`.
  - En `World`, añadir métodos de lectura directa sin copia (`peekEntity(id)` / `peekTargets()`) para el bucle interno y la capa de render, manteniendo `getEntity()` y `targetEntities()` compatibles con copias superficiales para consumidores externos y `snapshot()`.
- `src/sim/attack.ts`:
  - Hacer que `computeAttackHitbox` reutilice `bladePoseForTick` (o un helper común de centro) para no duplicar `Math.cos`/`Math.sin` en el mismo tick, preservando **exactamente** la misma aritmética (`centerX`, `centerY`, `x1`, `y1`, `x2`, `y2` con diferencia 0).
  - En `stepAttack`, calcular `computeAttackHitbox(player, params)` **una sola vez por tick activo** antes de iterar sobre `targets` en vez de recalcularlo dentro de `overlaps` por cada objetivo.
- `src/sim/checksum.ts`:
  - Optimizar `canonicalString` evitando crear objetos intermedios cuando las claves o la estructura ya se recorren en orden determinista, garantizando que `checksumOf` produzca **exactamente** los mismos hashes FNV-1a para cualquier entrada.

### Fase 4 — Optimización del bucle de render y modularización de presentación
- `src/scene/ShellScene.ts`, `src/entities/PlayerPresenter.ts` (o `WeaponLayer.ts`) y `src/main.ts`:
  - Extraer `ShellScene` a `src/scene/ShellScene.ts` y la capa visual del arma (`WeaponLayer`) a `src/entities/WeaponLayer.ts`, dejando `src/main.ts` como punto de entrada delgado que instancia `Phaser.Game` e instala el harness DEV.
  - En `ShellScene.update()`, obtener `player` una sola vez por frame (`peekEntity(PLAYER_ID)`) y pasarlo a `applyAnimation`, `updateWeapon` y `updateTargets` (eliminando las 5 búsquedas por frame).
  - Cachear el último string de `debugText` (`lastDebugString`) para llamar a `debugText.setText(...)` únicamente cuando el texto cambie efectivamente.

### Fase 5 — Assets, scripts, HTML y empaquetado Vite
- `src/assets/manifest.ts`:
  - Retirar `kratos-neutral` de la lista `ASSETS.characters` que se descarga en `preload()` (ya que no se usa en runtime), manteniendo el archivo `public/assets/characters/kratos-neutral.png` intacto en disco para `scripts/gen-kratos-anim.py` y conservando la constante `PLAYER_KEY = 'kratos-neutral'` si algún test la importa.
- `scripts/gen-run-frames.py`:
  - Eliminar el script obsoleto de 4 cuadros reemplazado desde `GOW8B-KRA-02` por `scripts/gen-kratos-anim.py`.
- `index.html`:
  - Añadir `<link rel="icon" href="data:," />` para suprimir el error 404 de `/favicon.ico` en navegador.
- `vite.config.ts`:
  - Añadir `build.rollupOptions.output.manualChunks` para separar `phaser` en su propio chunk (`phaser`) y el código del juego en el chunk de aplicación, mejorando el cacheo y eliminando la mezcla del motor con la lógica propia.
  - Limpiar `dist/` y `tsconfig.tsbuildinfo` al finalizar las pruebas de compilación.

---

## 3. Criterios de aceptación (binarios)

1. **Cero `: any` en `src/`:** `grep -rn ": any\|as any" src/` devuelve **0 coincidencias**.
2. **Idéntico resultado de escala (`CONFIG.scale`):** `checksumOf(CONFIG.scale)` es exactamente `da5b47b6`, y el bucle de `simulateDoubleJumpTicks` ejecuta ≤ `single.airTimeTicks` iteraciones (44 en lugar de 599).
3. **Determinismo y regresión cero en simulación:**
   - Checksums iniciales idénticos: `empty` = `5ae64ce0`, `test` = `c3f1f3dc`, `movement` = `09c68ba7`, `platforms` = `09c68ba7`, `combat` = `67b1fa98`.
   - Checksum de la traza combinada `combat60` idéntico: `9f8ded3f`.
   - Paso fijo 500 ms a 60 fps, 30 fps e irregular produce el mismo `frame` (30) y el mismo `checksum`.
   - `record()` + `replay()` produce el mismo `checksum`.
4. **Equivalencia numérica de `computeAttackHitbox` y `bladePoseForTick`:** diferencia 0 en `x1, y1, x2, y2` sobre todos los ticks activos de las 3 cadenas en `facing = 1` y `facing = -1`.
5. **Modularización limpia:** `src/main.ts` ≤ 80 líneas; `src/scene/ShellScene.ts` y `src/entities/WeaponLayer.ts` creados y tipados sin dependencias circulares.
6. **Build y bundle:**
   - `pnpm exec tsc --noEmit` → exit 0.
   - `pnpm build` → exit 0, generando chunk separado para `phaser` y chunk ligero (< 30 kB) para la aplicación.
   - `__GOW8B` aparece **0 veces** en `dist/assets/*.js`.
   - `dist/` y `tsconfig.tsbuildinfo` se limpian al terminar la verificación.
7. **Assets intactos:** los 7 PNG en `public/assets/` conservan exactamente sus SHA-256 de la sección 1; `kratos-neutral.png` ya no se descarga por red en `preload()`.
8. **Verificación en navegador:** consola con **0 errores** (incluida la desaparición del 404 de `favicon.ico`), juego corriendo a 60 fps, arma visible en fase `active` y oculta en `none`, rodada y doble salto operativos.
9. **Auditoría independiente** en modo de solo lectura por un subagente distinto del implementador.
