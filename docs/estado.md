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
| **V-14** | `WeaponLayer.ts` dibuja cadenas procedurales encima de un sprite que ya tiene cadenas, cuchillas y sombra cocidas en el PNG; la sombra de escena (`playerShadow`) y la pose de reposo de `WeaponLayer` (`restPose`) están implementadas pero apagadas. | Doble cadena y sombra pegada al saltar hasta que el primer grid sin armas ni sombra cocidas permita encender ambos flags en `src/config.ts` y ajustar los offsets. |
| **ART-01** | `grids/kratos/master.txt` proviene de `png_to_ascii.py` con letras asignadas por luminancia (97×59) y no es editable a mano. | Impide dibujar cuadros nuevos directamente en ASCII. |
| **ART-02** | Los anclajes de mano de los ataques (`CONFIG.player.attack.hands`, `src/config.ts`) están indexados por `poseFrame` de una hoja de ataque ya retirada, no por el arte nuevo. | Las cadenas saldrán de un punto que no coincide con las manos dibujadas; los anclajes deberán declararse por cuadro en `grids/kratos/manifest.json`. |
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
- `2026-10-29` — **Paso 5 (Reglas y skills):** se reescribieron `AGENTS.md`, `pixel-art-character-consistency` y `phaser3-project` para reflejar el flujo incremental por cuadro y el estado único en `docs/estado.md`.
- `2026-10-29` — **Paso 6 (Ajustes de la revisión crítica):** física desacoplada del lienzo (`CONFIG.player.bounds`, una sola fuente 97×59), sprites de enemigos movidos a `manifest.ts`, cadencia de run derivada de `RUN_KEYS.length`, sombra de contacto de escena (apagada), comentarios obsoletos limpiados y `pnpm art` / `pnpm art:check` (`scripts/check_grid.py`: tamaño, paleta, alfa binario, fila de suelo y PNG = grid). Comportamiento sin cambios; pendiente verificar en navegador.
- `2026-10-29` — **Paso 7 (Escala entera y limpieza):** el lienzo se muestra a un múltiplo entero de 480×270 (`fitIntegerScale()` en `src/main.ts`, mínimo ×1; verificado ×1/×2/×3 en navegador sin errores) y se eliminó la constante muerta `PROVISIONAL_ART`.

- `2026-10-29` — **Paso 8 (Paleta con roles y flujo de commits):** nueva `palette/kratos.json` (9 colores, letras mnemónicas con `roles` nombrados; `ascii_to_png.py` valida que `roles` y `colors` coincidan; `check_grid.py` lee el campo `palette` del manifest). El master heredado conserva `master.json` porque sus letras `a..l` son luminancia, no materiales. Regla nueva en `AGENTS.md`: un cuadro se commitea solo tras la aprobación visual.
- `2026-10-29` — **Paso 9 (Pose de reposo y sombra):** `WeaponLayer` dibuja una cuchilla colgante en reposo (`presentation.restPose`, apagada); pose compartida con la guardia mediante `drawStaticPose`. Con ambos flags encendidos temporalmente se verificó en navegador (derecha, izquierda y aire, 0 errores). La sombra solo se ve en suelo; no se distingue de la sombra cocida actual. Se abrió ART-02 (anclajes de mano).
