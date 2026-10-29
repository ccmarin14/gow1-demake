# Estado del proyecto

Documento único del estado medido de `gow-8b`. Se actualiza en el mismo commit de cada paso. El historial previo está archivado en `archivo/docs/`.

## 1. Qué funciona hoy (medido el 2026-10-29)

- **Build y navegador:** `pnpm build` pasa sin errores; el servidor de desarrollo carga en Chrome a 480×270 con 0 errores de consola y 0 peticiones HTTP fallidas.
- **Simulación determinista (60 Hz):** movimiento horizontal, salto y doble salto, plataformas one-way, rodada con i-frames, ataque ligero y pesado, guardia/parry, magia (*Ira de Poseidón*), orbes, cofres, checkpoints e IA de legionario, arquero e hidra (`src/sim/`).
- **Presentación y audio:** HUD de salud/maná/orbes (`HudLayer.ts`), efectos de lluvia/relámpagos (`VfxLayer.ts`), overlay de flujo (`GameFlowOverlay.ts`) y audio procedural Web Audio (`SoundManager.ts`).
- **Harness DEV:** `window.__GOW8B` expone `snapshot()`, `loadScenario()`, `reset()`, `step()`, `advance()` y `metrics()`.
- **Sprites activos:**
  - Kratos tiene `kratos-neutral.png` y `kratos-idle-01.png` (clip `kratos-idle` de 2 cuadros). El resto de los estados (`run`, `attack`, `air`, `roll`, `guard`) usan el cuadro estático `kratos-neutral` hasta que se dibujen los cuadros nuevos en ASCII.
  - `legionnaire.png`, `archer.png` y `arrow.png` están cargados como arte provisional; `hydra` no tiene textura cargada.

## 2. Problemas abiertos

| ID | Problema | Impacto |
| --- | --- | --- |
| **V-01** | En `level1`, las oleadas spawnean en `x=320/380` (`src/config.ts`) fuera de la arena activa (`x=550–890` en `src/sim/world.ts`). | El combate del nivel no se puede jugar como fue diseñado. |
| **V-04** | El escenario `combat` usa un dummy legado que no recibe daño. | No sirve para verificar daño cuerpo a cuerpo. |
| **V-14** | `WeaponLayer.ts` dibuja cadenas procedurales encima de un sprite que ya tiene cadenas y sombra cocidas en el PNG. | Doble cadena y sombra pegada al saltar. |
| **ART-01** | `grids/kratos/master.txt` proviene de `png_to_ascii.py` con letras asignadas por luminancia (97×59) y no es editable a mano. | Impide dibujar cuadros nuevos directamente en ASCII. |
| **BOOT-01** | El escenario inicial por defecto es `platforms` y `flowState` arranca en `playing`. | Al abrir el juego no se entra al nivel ni a la pantalla de título. |
| **ARCH-01** | `src/scene/ShellScene.ts` concentra 1.655 líneas (carga mixta de assets, render de escenario, animaciones y cámaras). | Deuda técnica de mantenibilidad (no bloquea el arte). |

## 3. Siguiente paso

Definir el formato ASCII semántico (letras por material, paleta reducida y lienzo ajustado sin cadenas ni sombra cocidas) y dibujar el primer cuadro (`idle-00`) para revisión visual antes de avanzar con los cuadros de movimiento.

## 4. Registro de pasos

- `2026-10-29` — **Paso 0 (Respaldo):** snapshot del árbol de trabajo y etiqueta `respaldo/pre-limpieza-2026-10-29`.
- `2026-10-29` — **Paso 1 (Carga limpia):** se vació `RUN_KEYS` en `src/assets/manifest.ts` para eliminar los cuatro 404 de `kratos-run-00..03.png` y se actualizó el título en `index.html`. Verificado en Chrome headless con 0 errores.
- `2026-10-29` — **Paso 2 (Assets y grids):** se centralizaron los PNG y grids descartados en `archivo/` conservando los sprites en uso (`kratos-neutral`, `kratos-idle-01`, `legionnaire`, `archer`, `arrow`).
- `2026-10-29` — **Paso 3 (Scripts):** se archivaron los generadores procedurales y verificadores antiguos en `archivo/scripts/`, dejando activo únicamente `scripts/ascii_to_png.py`.
- `2026-10-29` — **Paso 4 (Documentación):** se consolidó la documentación activa en `estado.md`, `direccion.md`, `decisiones.md`, `arquitectura.md` y `README.md`, archivando los 36 planes y registros previos en `archivo/docs/`.
