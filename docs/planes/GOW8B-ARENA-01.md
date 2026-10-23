# Plan de implementación — `GOW8B-ARENA-01` (Zonas y Delimitación de Arenas de Combate)

- **Fecha:** 2026-10-23
- **Estado:** **APROBADO** (Completada y auditada independientemente el 2026-10-23).
- **Decisiones asociadas:** `D-03` (Lore canónico de God of War 1 / Betrayal), `D-06` (roles orquestador / implementador / auditor), `D-12` (lienzo 480×270 a 60 Hz).
- **Objetivo:** Implementar la delimitación de arenas de combate mediante **barreras mágicas rojas (puertas de niebla/bloqueo de combate)** clásicas de la franquicia *God of War*. Al activarse un encuentro de combate, dos barreras mágicas sellan los extremos del área ($x_{\min}^{\text{arena}}$ y $x_{\max}^{\text{arena}}$), confinando físicamente al jugador y a los esbirros dentro de la zona de batalla sin permitir la huida. Al derrotar la última oleada (`wave.phase === 'complete'`), las barreras se disipan con una transición visual fluida y restauran el libre tránsito por la cubierta del barco para continuar la travesía.

---

## 1. Alcance y Especificación Funcional

1. **Configuración Centralizada de la Arena (`src/config.ts`):**
   - Estructura `CONFIG.combat.arena`:
     - `minX: 70` (límite izquierdo de la arena dentro del lienzo de 480 px).
     - `maxX: 410` (límite derecho de la arena).
     - `barrierWidth: 8` (ancho de la columna de niebla mágica).
     - `barrierColor: 0xff2020` (rojo sangre de Ares).
     - `barrierGlowColor: 0xff6644` (fulgor ígneo).
     - `barrierAlpha: 0.8` (opacidad de la barrera activa).
     - `dissipateDurationTicks: 30` (500 ms de desvanecimiento suave post-combate).

2. **Simulación de Confinamiento Físico (`src/sim/arena.ts` y `src/sim/world.ts`):**
   - Estado de la arena (`ArenaState`):
     - `active: boolean` (verdadera mientras el encuentro de combate esté en progreso).
     - `minX: number`, `maxX: number`.
     - `dissipateTicks: number` (contador de desvanecimiento).
     - `alpha: number` (factor de opacidad visual de 1.0 a 0.0).
   - Reglas cinemáticas de confinamiento:
     - Cuando `active === true`:
       - Kratos es restringido estrictamente a $x \in [\text{minX} + \text{halfW} .. \text{maxX} - \text{halfW}]$. Si intenta correr, esquivar o ser empujado más allá de estos límites, su posición se clampa y su velocidad horizontal se anula ($v_x = 0$).
       - Los esbirros (legionarios y arqueros) y sus proyectiles también quedan confinados a los límites internos de la arena.
     - Transición de disipación:
       - Cuando `waveManager.getState().phase === 'complete'`:
       - Comienza la disipación: `dissipateTicks` desciende de 30 a 0 ticks reduciendo linealmente `alpha`.
       - Al llegar a 0, `active = false` y los límites horizontales del jugador se expanden al ancho completo del mapa (`CONFIG.player.minX` y `CONFIG.player.maxX`).

3. **Presentación Visual de las Barreras (`src/scene/ShellScene.ts`):**
   - Renderizado de dos columnas verticales de niebla/fuego mágico en $x = \text{minX}$ y $x = \text{maxX}$ desde el techo de la pantalla ($y=0$) hasta el entablado de la cubierta ($y=220$).
   - Efecto pixel-art pulsante con gradiente o partículas ígneas para lectura clara de muro impenetrable.
   - Atenuación suave durante los 30 ticks de disipación post-victoria.

4. **Integración en Snapshot y Escenarios:**
   - Exportación de `arena?: ArenaState` en `SimulationSnapshot`.
   - Escenario `'arena'` en `src/sim/scenarios.ts` (combina oleadas y confinamiento de arena).

5. **Verificación Automatizada en Chrome CDP (`scripts/verification/capture-combat.mjs`):**
   - **Caso P (`arena_confinement_and_barriers`):**
     - Verificación de confinamiento izquierdo: Kratos intenta desplazarse hacia la izquierda contra la barrera ($x \approx 70$), manteniéndose clampado en $x \ge 86\text{ px}$.
     - Verificación de combate y oleadas dentro de la arena cerrada.
     - Verificación de confinamiento derecho: Kratos no puede cruzar $x = 394\text{ px}$ durante el combate.
     - Verificación de victoria del encuentro (`wave.phase === 'complete'`): las barreras inician disipación y se desactivan.
     - Verificación de liberación: Kratos avanza libremente hacia la derecha superando $x > 410\text{ px}$ hacia la proa del barco.
     - 0 errores de consola y determinismo estricto comprobado.

---

## 3. Evidencia de Auditoría Independiente

- **Auditor:** Subagente independiente `01acf36e-053e-4f48-b4d9-de32dea2e091` (solo lectura).
- **Veredicto:** **APROBADO**.
- **Resultados cuantitativos y verificación:**
  - Configuración centralizada en `CONFIG.combat.arena`: límites en $x \in [70 .. 410]\text{ px}$, columnas de 8 px, rojo sangre `#ff2020` y aura ígnea `#ff6644`, desvanecimiento de 30 ticks.
  - `ArenaManager` puro y determinista en `src/sim/arena.ts`, desacoplado de Phaser.
  - Confinamiento físico verificado: Kratos clampado dentro de la arena ($x \in [118.5 .. 361.5]\text{ px}$) con $v_x = 0$ al colisionar contra las barreras. Esbirros clampados en $[84 .. 396]\text{ px}$. Flechas disipadas al tocar las barreras.
  - Ciclo de disipación suave de 30 ticks post-combate (`alpha` de 0.8 a 0.0) y liberación total (`active = false`), permitiendo avanzar más allá de $x > 410\text{ px}$.
  - Presentación visual en `ShellScene.ts`: 4 capas de barrera (halo exterior, columna de aura, núcleo denso y filamento incandescente) con pulsación ígnea procedural.
  - `pnpm exec tsc --noEmit && pnpm build`: salida código 0 en 5.92s, 0 fugas en `dist/`.
  - Chrome CDP (`capture-combat.mjs`): 16/16 casos aprobados (Casos A a P), determinismo estricto y 0 errores de consola.
  - Caso P verificado: $t=16$ confinamiento izquierdo $x=118.5$, $t=35$ confinamiento derecho $x=361.5$, $t=36$ victoria y disipación `alpha=0.80`, $t=51$ punto medio `alpha=0.40`, $t=67$ fin de disipación y desactivación `alpha=0.00`, $t=95$ liberación y avance libre hasta $x=421.0\text{ px} > 410\text{ px}$ con $v_x = 140\text{ px/s}$.
  - Artefactos visuales: `arena_confinement_and_barriers_mosaic.png` y `arena_confinement_and_barriers.gif`.
