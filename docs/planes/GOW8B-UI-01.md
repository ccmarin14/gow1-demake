# Plan de implementación — `GOW8B-UI-01` (Interfaz Completa: Título, Pausa, Estados Terminales y Victoria)

- **Fecha:** 2026-10-23
- **Estado:** **APROBADO** (Completada y auditada independientemente el 2026-10-23).
- **Decisiones asociadas:** `D-03` (Lore y estética de God of War 1 PS2), `D-06` (roles orquestador / implementador / auditor), `D-12` (lienzo 480×270 a 60 Hz), `D-24` (fidelidad a mecánicas y presentación de GoW 1).
- **Objetivo:** Implementar la interfaz de usuario completa y el flujo de estados de juego (*Game Flow*): pantalla de título canónica ("GOD OF WAR - BETRAYAL 8-BIT") con fondo marino y opción de inicio/controles; menú de pausa interactivo (`ESC`) que congela deterministamente la simulación y despliega el inventario, mejoras activas y guía de combos; pantalla de derrota pulida con reaparición en checkpoint; y pantalla de victoria gloriosa tras la derrota de la Hidra con resumen de bajas, orbes recolectados y tiempo de juego.

---

## 1. Alcance y Especificación Funcional

1. **Configuración Centralizada de Interfaz (`src/config.ts`):**
   - Incorporar en `CONFIG.ui`:
     - `title`: `"GOD OF WAR"`, subtítulo `"MAR EGEO - PROCESO 8-BIT"`.
     - `fontFamily`: `'monospace'`.
     - `colors`:
       - `gold`: `'#facc15'`, `goldBright`: `'#fde047'`.
       - `crimson`: `'#ef4444'`, `crimsonDark`: `'#7f1d1d'`.
       - `bronze`: `'#92662c'`, `stone`: `'#1f140e'`.
     - `stats`: resumen de métricas para fin de nivel (enemigos abatidos, cofres abiertos, orbes acumulados, nivel de arma).

2. **Estados del Flujo de Juego (`src/sim/types.ts`):**
   - Incorporar `GameFlowState`:
     - `'title'` | `'playing'` | `'paused'` | `'victory'` | `'gameover'`.
   - Incorporar en `SimulationSnapshot` el estado actual de flujo (`flowState: GameFlowState`).

3. **Módulo de Flujo y Pausa Determinista (`src/sim/world.ts`):**
   - Control de pausa: al presionar `pause` (`ESC`):
     - Si está en `'playing'`: conmuta a `'paused'`, deteniendo el avance de ticks de la física, enemigos y Kratos.
     - Si está en `'paused'`: conmuta de vuelta a `'playing'`, reanudando fluidamente.
   - Control de victoria: al ser derrotada la Hidra en `level1` y avanzar Kratos hacia Proa ($x \ge 1380$):
     - Conmuta a `'victory'`.
   - Control de derrota: al caer Kratos a 0 HP:
     - Conmuta a `'gameover'`, permitiendo reaparición rápida en el último punto de control con tecla `R`.

4. **Presentación Visual de la Interfaz (`src/scene/ShellScene.ts` y `src/ui/HudLayer.ts`):**
   - **Pantalla de Título:**
     - Título dorado monumental `"GOD OF WAR"` con emblema de omega de Ares.
     - Indicador pulsante `[ENTER / ESPACIO] INICIAR AVENTURA`.
     - Guía rápida de teclas `[C] CONTROLES`: `A/D` movimiento, `ESPACIO` salto/doble salto, `J` ligero, `K` pesado, `L` agarre, `Q` guardia/parry, `SHIFT` rodada, `U/I` ira de poseidón, `E` abrir/interactuar, `P` mejorar.
   - **Menú de Pausa (`ESC`):**
     - Velo oscuro semitranslúcido con marco ornamental de piedra y bronce.
     - Título en oro: `"PAUSA"`.
     - Resumen del héroe:
       - Salud: `HP: maxHp` y Maná: `MP: maxMp`.
       - Nivel de Cuchillas del Caos (`Nivel 1` / `Nivel 2`).
       - Coleccionables: Ojos de Górgona ($X/6$) y Plumas de Fénix ($Y/6$).
     - Opciones: `[ESC] REANUDAR` · `[R] REAPARECER EN CHECKPOINT`.
   - **Pantalla de Victoria de Nivel:**
     - Banner monumental `"¡NIVEL 1 COMPLETADO!"`.
     - Panel de estadísticas finales:
       - Total de bajas enemigas.
       - Saldo de orbes rojos.
       - Cofres descubiertos.
       - Rango de combate alcanzado.
     - Prompt: `[R] VOLVER A JUGAR` · `[ESC] MENÚ PRINCIPAL`.
   - **Pantalla de Derrota Adaptativa:**
     - Velo carmesí oscuro, texto `"HAS MUERTO"` con opción `[R] REAPARECER EN CHECKPOINT`.

5. **Prueba Automatizada en Chrome DevTools Protocol (`scripts/verification/capture-combat.mjs`):**
   - **Caso Y (`ui_flow_title_pause_and_victory`):**
     - Comprobación de transición de flujo:
       - Estado inicial `'title'` o inicio directo.
       - Activación de `'paused'` con `ESC`: comprobación de congelamiento de ticks ($v_x = 0$, `frame` congelado).
       - Despausa con `ESC`: reanudación de simulación.
       - Disparo de `'victory'`: comprobación de resumen de estadísticas y opciones.
       - Disparo de `'gameover'`: comprobación de prompt de reaparición.
     - Cero errores en consola de Chrome.
     - Generación de mosaico `ui_flow_title_pause_and_victory_mosaic.png` y animación `.gif`.

---

## 2. Invariantes y Regresiones Protegidas

- Cero errores de compilación TypeScript (`tsc --noEmit`) y build de Vite (`pnpm build`).
- Preservación estricta de los 24 casos de verificación previos (Casos A a X).
- Determinismo físico estricto a 60 Hz sin acumulación de flotantes.
- Sin fugas del arnés de desarrollo (`__GOW8B`) en el bundle productivo `dist/`.

---

## 3. Evidencia de Auditoría Independiente

- **Auditor:** Subagente independiente `01acf36e-053e-4f48-b4d9-de32dea2e091` (modo estrictamente de solo lectura).
- **Veredicto:** **APROBADO**.
- **Resultados cuantitativos y verificación:**
  - Configuración centralizada en `CONFIG.ui` (`title: 'GOD OF WAR'`, `fontFamily: 'monospace'`, paleta de oro `#facc15`, carmesí `#ef4444`, bronce `#92662c` y profundidad `depth: 150`).
  - Máquina de estados de flujo en `src/sim/types.ts` (`GameFlowState`: `'title'`, `'playing'`, `'paused'`, `'victory'`, `'gameover'`) y `CombatStats`.
  - Congelamiento determinista de la simulación en `src/sim/world.ts` durante `'paused'` mediante tecla `ESC` verificado cuantitativamente (`frame20 === 10` y `frame24 === 10`). Reanudación fluida con `ESC` (`frame === 13`).
  - Capa modular desacoplada `GameFlowOverlay.ts`:
    - Pantalla de título monumental con omega de Ares, título dorado y guía de controles.
    - Menú de pausa interactivo con resumen en tiempo real del héroe (HP, MP, Cuchillas Nivel 1/2, orbes rojos, ojos y plumas acumulados, combos de PS2) y opciones de reanudar / reaparecer.
    - Pantalla de victoria con banner `"¡NIVEL 1 COMPLETADO!"`, resumen de estadísticas de combate y rango otorgado (`GUERRERO ESPARTANO`).
    - Pantalla de derrota adaptativa `"HAS MUERTO"` con reaparición inmediata en checkpoint.
  - `pnpm exec tsc --noEmit && pnpm build`: salida código 0 en 5.29s, 0 fugas en `dist/`.
  - Chrome CDP (`capture-combat.mjs`): 25/25 casos aprobados (Casos A a Y) con determinismo estricto y 0 errores de consola.
  - Caso Y verificado: $t=8$ título activo, $t=12$ inicio de juego, $t=18$ pausa activa, $t=20$ y $t=24$ congelamiento determinista ($frame=10$), $t=27$ reanudación ($frame=13$), $t=38$ pantalla de victoria y rango, $t=46$ reinicio, $t=50$ pantalla de derrota, $t=58$ reaparición en checkpoint.
  - Artefactos visuales: `ui_flow_title_pause_and_victory_mosaic.png` (3.10 MB) y `ui_flow_title_pause_and_victory.gif` (705 KB).

