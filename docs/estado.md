# Estado del proyecto

Documento único del estado medido de `gow-8b`. Se actualiza en el mismo commit de cada paso. El historial previo está archivado en `archivo/docs/`.

## 1. Qué funciona hoy (medido el 2026-10-29)

- **Build y navegador:** `pnpm build` pasa sin errores; el servidor de desarrollo carga en Chrome a 480×270 con 0 errores de consola y 0 peticiones HTTP fallidas.
- **Simulación determinista (60 Hz):** movimiento horizontal, salto y doble salto, plataformas one-way, rodada con i-frames, ataque ligero y pesado, guardia/parry, magia (*Ira de Poseidón*), orbes, cofres, checkpoints e IA de legionario, arquero e hidra (`src/sim/`).
- **Presentación y audio:** HUD de salud/maná/orbes (`HudLayer.ts`), efectos de lluvia/relámpagos (`VfxLayer.ts`), overlay de flujo (`GameFlowOverlay.ts`) y audio procedural Web Audio (`SoundManager.ts`).
- **Arranque:** el juego abre en la pantalla de título sobre `level1` (escenario por defecto); las oleadas de la arena central nacen dentro de la arena.
- **Harness DEV:** `window.__GOW8B` expone `snapshot()`, `loadScenario()`, `reset()`, `step()`, `advance()` y `metrics()`.
- **Sprites activos:**
  - Kratos tiene `kratos-neutral.png` y `kratos-idle-01.png` (clip `kratos-idle` de 2 cuadros). El resto de los estados (`run`, `attack`, `air`, `roll`, `guard`) usan el cuadro estático `kratos-neutral` hasta que se dibujen los cuadros nuevos en ASCII.
  - `legionnaire.png`, `archer.png` y `arrow.png` están cargados como arte provisional; el hidra se dibuja como un rectángulo marcador (`presentation.hydraPlaceholder`) hasta que tenga arte.

## 2. Problemas abiertos

| ID | Problema | Impacto |
| --- | --- | --- |
| **V-14** | `WeaponLayer.ts` dibuja cadenas procedurales encima de un sprite que ya tiene cadenas, cuchillas y sombra cocidas en el PNG; la sombra de escena (`playerShadow`) y la pose de reposo de `WeaponLayer` (`restPose`) están implementadas pero apagadas. | Doble cadena y sombra pegada al saltar hasta que el primer grid sin armas ni sombra cocidas permita encender ambos flags en `src/config.ts` y ajustar los offsets. |
| **ART-01** | `grids/kratos/master.txt` proviene de `png_to_ascii.py` con letras asignadas por luminancia (97×59) y no es editable a mano. | Impide dibujar cuadros nuevos directamente en ASCII. |
| **ESE-01** | Sin remates contextuales (QTE) ni agarre real (ESE-02); impacto poco brutal (ESE-03); enemigos de un solo truco (ESE-04); sin introducción (ESE-05, regla D-30). | El combate se aparta de la esencia de *God of War*. Plan y criterios en `docs/direccion.md` §4. |
| **ART-03** | Falta la cuantización de una imagen de referencia a `palette/kratos.json` para arrancar un cuadro (`docs/direccion.md` §5). El validador de puntos de referencia ya existe pero no se ha usado con un cuadro real. | El primer cuadro se dibuja sin base automática. |
| **ART-02** | Los anclajes de mano de los ataques (`hand` en cada movimiento de `src/config.ts`) conservan los valores medidos sobre una hoja retirada; no coinciden con el arte nuevo. | Las cadenas saldrán de un punto que no coincide con las manos dibujadas hasta re-medirlos con los cuadros nuevos. |

## 3. Siguiente paso

Tarea en curso para otro agente: dibujar `idle-00`; instrucciones completas en `docs/temporal/brief-idle-00.md` (se borra al cerrar la tarea).

En paralelo al arte, el plan de esencia de `docs/direccion.md` §4 (orden: ESE-03, ESE-01 con ESE-02, ESE-04, ESE-05).

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
- `2026-10-29` — **Paso 10 (Anclajes por movimiento):** se eliminó la indirección `poseFrame` → tabla `hands` (apuntaba a una hoja de ataque retirada); cada movimiento declara su `hand` con los mismos valores, sin cambio de comportamiento. ART-02 queda reducido a re-medir los valores con el arte nuevo.
- `2026-10-29` — **Paso 11 (V-01):** los spawns de las oleadas se declaran con `offsetX` relativo al borde izquierdo de la arena (`WaveManager(originX)`), y `world.ts` lee los límites de la arena de `CONFIG.map.level1` en vez de repetir 550/890. Verificado en navegador: en `level1` nacen en x=800/860 (dentro de 550–890) y `waves` conserva x=320/380.
- `2026-10-29` — **Paso 12 (Retiro de lo roto o legado):** se eliminó el escenario `combat` (dummy sin daño, V-04) y el código del hidra que pedía una textura y animaciones inexistentes (`Missing animation: hydra-idle` en cada frame; ahora un marcador rectangular), la animación de rodada vacía y los gates, regiones y registros de cuadros retirados de `grids/kratos/manifest.json` (nada los ejecutaba). El juego arranca en la pantalla de título sobre `level1` (BOOT-01); verificado en navegador.
- `2026-10-29` — **Paso 13 (ARCH-01):** la presentación del jugador (sprite, animaciones, sombra y `WeaponLayer`) se extrajo de `ShellScene.ts` (1661 → 1369 líneas) a `src/scene/PlayerView.ts`; comportamiento sin cambios, verificado en navegador (idle animado, correr, salto, guardia, pausa, 0 errores). El resto de `ShellScene` no se divide: no hay otro trabajo de arte que lo justifique.

- `2026-10-29` — **Paso 14 (HUD en el título):** la pantalla de título ya no muestra el banner de oleada ni la barra del hidra (`ShellScene.ts`). Quedan restos tenues del contador de orbes y del texto de depuración bajo el overlay; además, en `level1` la barra del hidra se muestra desde el inicio aunque el jefe esté lejos.
- `2026-10-29` — **Paso 15 (HUD completo):** `HudLayer.setHidden` oculta todo el HUD y el texto de depuración durante el título; la barra del hidra solo se muestra cuando el jefe está a una pantalla del jugador; se eliminó la etiqueta residual "Combo ligero". Verificado en navegador (título, inicio de `level1` y escenario `hydra`, 0 errores).
- `2026-10-29` — **Paso 16 (Plan de esencia):** revisión contra *God of War* y registro de las brechas ESE-01..07 en `docs/direccion.md` §4, la regla D-30 (la introducción nunca bloquea las pruebas) y la fila ESE-01 en problemas abiertos. Sin cambios de código.
- `2026-10-29` — **Paso 17 (Método de dibujo para agentes):** decisión D-31 y `docs/direccion.md` §5 (ASCII guiado por puntos de referencia, vista previa con reglas, bucle visual, lienzo 64×56). Se añadió `scripts/preview_grid.py`. Falta construir el validador y la cuantización (ART-03).
- `2026-10-29` — **Paso 18 (Validador y brief en el repo):** `scripts/check_landmarks.py` valida puntos de referencia (material, fila de suelo y desplazamiento entre cuadros) y el brief de `idle-00` pasó a `docs/temporal/` con la excepción registrada en `AGENTS.md`.

