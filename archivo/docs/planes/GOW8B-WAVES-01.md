# Plan de implementación — `GOW8B-WAVES-01` (Flujo y Ritmo de Oleadas de Combate)

- **Fecha:** 2026-10-23
- **Estado:** **APROBADO** (Completada y auditada independientemente el 2026-10-23).
- **Decisiones asociadas:** `D-03` (Lore e identidad de God of War 1 PS2), `D-06` (roles orquestador / implementador / auditor), `D-12` (lienzo 480×270 a 60 Hz).
- **Objetivo:** Implementar el sistema determinista de gestión de oleadas de combate (*Wave Manager*). En *God of War*, los combates en arenas cerradas o cubiertas de barcos presentan enemigos en oleadas estructuradas: una primera oleada de presión directa con combatientes cuerpo a cuerpo (Legionarios No-Muertos), seguida de una oleada combinada con refuerzos y hostigamiento a distancia (Arqueros No-Muertos en retaguardia). El sistema debe coordinar la aparición telegrafiada (spawn balístico/emergente), el conteo de bajas, las transiciones de ritmo entre oleadas y el estado de arena despejada.

---

## 1. Alcance y Especificación Funcional

1. **Configuración Centralizada de Oleadas (`src/config.ts`):**
   - Estructura `CONFIG.combat.waves`:
     - Parámetros globales: `transitionDelayTicks: 60` (1 segundo de respiro tras despejar una oleada antes de spawnear la siguiente), `spawnTelegraphTicks: 24` (400 ms de animación/brote de entrada).
     - Definición de oleadas para el encuentro del Mar Egeo:
       - **Oleada 1 (Vanguardia):** 2 Legionarios No-Muertos avanzando desde la derecha ($x=320, 380$).
       - **Oleada 2 (Fuerza Mixta):** 2 Legionarios No-Muertos flanqueando ($x=120, 340$) + 1 Arquero No-Muerto en retaguardia profunda ($x=430$).

2. **Controlador Determinista de Oleadas (`src/sim/waves.ts`):**
   - Estado de la oleada (`WaveState`):
     - `waveIndex: number` (0-indexed).
     - `totalWaves: number`.
     - `phase: 'spawning' | 'combat' | 'cleared' | 'complete'`.
     - `phaseTicks: number`.
     - `enemiesRemaining: number` (vivos + pendientes de spawn).
     - `totalKills: number`.
   - Ciclo de vida y transiciones:
     - Al iniciar una oleada, procesa los spawns programados respetando sus retardos individuales (`spawnDelayTicks`).
     - Durante el combate, contabiliza las muertes (`target.aiState === 'death'`).
     - Al morir el último enemigo de la oleada, conmuta a `phase = 'cleared'` y espera `transitionDelayTicks` antes de invocar la siguiente oleada.
     - Al despejar la última oleada del encuentro, conmuta a `phase = 'complete'` (señal para que la arena desbloquee las barreras en la etapa 18).

3. **Aparición Telegrafiada de Enemigos:**
   - Para evitar apariciones bruscas (*pop-in*), los enemigos que spawnean entran en estado transitorio `spawning`:
     - Brotan desde el entablado de la cubierta con velocidad vertical ascendente inicial ($v_y = -180\text{ px/s}$) o efecto de surgimiento cadavérico durante `spawnTelegraphTicks`.
     - Al tocar suelo firme se activan automáticamente en su máquina de estados regular (`approach` para legionarios, `reposition` para arqueros).

4. **Integración en Simulación y Snapshot (`src/sim/types.ts` y `src/sim/world.ts`):**
   - Extensión de `SimulationSnapshot` para incluir `wave: WaveState`.
   - Invocación de `stepWave` en cada tick de `World.step()`.
   - Escenario `'waves'` en `src/sim/scenarios.ts` configurado con el encuentro de oleadas.

5. **Presentación en Phaser (`src/ui/HudLayer.ts` o banner de combate):**
   - Notificación visual del progreso del combate en pantalla:
     - Indicador sutil de oleada (ej. `OLEADA 1/2`, `OLEADA 2/2`).
     - Banner o destello celebratorio de `¡ZONA DESPEJADA!` al completar el encuentro.

6. **Verificación Automatizada en Chrome CDP (`scripts/verification/capture-combat.mjs`):**
   - **Caso O (`waves_flow_and_pacing`):**
     - Inicio de oleada 1: spawn de 2 legionarios.
     - Eliminación de la oleada 1: verificación de transición a `cleared` y espera de ritmo.
     - Inicio de oleada 2: spawn mixto (2 legionarios + 1 arquero).
     - Eliminación de la oleada 2: verificación de `phase === 'complete'` y total de bajas acumuladas.
     - 0 errores de consola y determinismo estricto comprobado.

---

## 3. Evidencia de Auditoría Independiente

- **Auditor:** Subagente independiente `01acf36e-053e-4f48-b4d9-de32dea2e091` (solo lectura).
- **Veredicto:** **APROBADO**.
- **Resultados de ejecución y verificación numérica:**
  - Configuración centralizada en `CONFIG.combat.waves` con retención de respiro de 60 ticks y anticipación de spawn de 24 ticks.
  - Definición canónica de oleadas: Oleada 1 (2 legionarios en vanguardia) y Oleada 2 (2 legionarios + 1 arquero en retaguardia profunda).
  - `WaveManager` determinista y desacoplado en `src/sim/waves.ts`, gestionando la secuencia formal $\text{spawning} \rightarrow \text{combat} \rightarrow \text{cleared} \rightarrow \text{complete}$.
  - Cinemática de spawn emergente: impulso vertical ascendente ($v_y = -160\text{ px/s}$) antes de aterrizar en cubierta y activar la IA correspondiente sin pop-in.
  - Presentación en `ShellScene.ts`: banner centrado en $(240, 40)$ sin oclusión con la barra de vida de Kratos ($x=16..110$).
  - `pnpm exec tsc --noEmit && pnpm build`: salida código 0 en 5.76s, 0 fugas en `dist/`.
  - Chrome CDP (`capture-combat.mjs`): 15/15 casos aprobados (Casos A a O) con determinismo estricto y 0 errores de consola.
  - Caso O verificado: $t=5$ spawn oleada 1, $t=18$ combate oleada 1, $t=30$ pausa de respiro con 2 bajas, $t=95$ spawn mixto oleada 2 con 3 enemigos restantes, $t=114$ combate oleada 2, $t=125$ victoria final con 5 bajas totales y arena despejada.
  - Artefactos visuales: `waves_flow_and_pacing_mosaic.png` y `waves_flow_and_pacing.gif`.
