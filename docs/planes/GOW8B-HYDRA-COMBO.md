# Plan de implementación — `GOW8B-HYDRA-COMBO` (Combate de la Hidra: Patrones, Daño, Ventanas Vulnerables y Derrota)

- **Fecha:** 2026-10-23
- **Estado:** **APROBADO** (Completada y auditada independientemente el 2026-10-23).
- **Decisiones asociadas:** `D-03` (Lore y clímax naval de la Hidra en God of War 1 PS2), `D-06` (roles orquestador / implementador / auditor), `D-12` (lienzo 480×270 a 60 Hz), `D-24` (fidelidad a mecánicas de jefes y combate de GoW 1).
- **Objetivo:** Implementar la lógica completa de simulación, combate y presentación del combate contra el jefe **La Hidra de Lerna** (*Hydra Boss*). La Hidra se comporta como un adversario monumental con máquina de estados determinista a 60 Hz: ciclo de acecho en el mar, telegrafiado previo mediante rugido, embestida en picado contra cubierta (*slam bite*) con colmillos clavados que dejan al jefe vulnerable a combos, barrido rasante (*sweep*) esquivable mediante salto, retroceso por impacto (*hurt*), aturdimiento crítico colapsado (*stagger*), barra de salud ornamental de jefe en el HUD, cascada defensiva del jugador (evasión con rodada e invulnerabilidad en casteo de magia), y derrota terminal con eclosión masiva de orbes y banner de victoria.

---

## 1. Alcance y Especificación Funcional

1. **Configuración Centralizada del Jefe (`src/config.ts`):**
   - Incorporar en `CONFIG.enemy.hydra`:
     - `maxHp: 300` (reserva de salud de jefe).
     - `slamDamage: 25` (daño masivo del mordisco en picado).
     - `sweepDamage: 20` (daño del barrido bajo).
     - `telegraphTicks: 30` (500 ms de advertencia con rugido y fauces abiertas).
     - `stuckTicks: 45` (750 ms con los colmillos clavados en la cubierta, vulnerable a combos).
     - `staggerThresholdHp: 100` (colapso exhausto cada 100 de daño recibido).
     - `staggerDurationTicks: 90` (1.5 segundos de vulnerabilidad extrema).
     - `slamImpactRadius: 40` px (radio de colisión sísmica en cubierta).
     - `dropOrbs: { red: 15, green: 2, blue: 2 }` (eclosión de victoria).
   - Configuración visual en `CONFIG.presentation.hud.boss`:
     - Barra de salud de jefe: $200 \times 7\text{ px}$ centrada en la parte inferior ($x=140, y=252$) con marco tallado de bronce y rótulo en letras clásicas: `"LA HIDRA DE LERNA"`.

2. **Tipos de Simulación (`src/sim/types.ts`):**
   - Incorporar `'hydra'` en `EntityState.kind`.
   - Ampliar `aiState` para incluir los estados específicos de jefe:
     - `'hydra_idle'` | `'hydra_roar'` | `'hydra_slam'` | `'hydra_stuck'` | `'hydra_sweep'` | `'hydra_hurt'` | `'hydra_stagger'` | `'hydra_defeat'`.
   - Incorporar en `SimulationSnapshot` el estado del jefe (`bossHp`, `bossMaxHp`, `bossState`, `bossName`).

3. **Módulo de Simulación Pura (`src/sim/hydra.ts`):**
   - Máquina de estados determinista de la Hidra:
     - **`hydra_idle` (60 ticks):** Ondulación marina observando al jugador. Transiciona a rugido.
     - **`hydra_roar` (30 ticks):** Fauces abiertas a 85°, garganta incandescente. Telegraph visual antes del ataque.
     - **`hydra_slam` (12 ticks):** Embestida fulminante en picado contra la cubierta. Comprueba colisión contra Kratos:
       - Si Kratos está en rodada (`rollPhase !== 'none'`) o casteo de magia (`invulTicks > 0`): 0 daño (evasión exitosa).
       - Si Kratos está en guardia (`guardPhase !== 'none'`): 85% mitigación (4 daño).
       - Si está vulnerable: inflige 25 daño, knockback y 45 i-frames post-daño.
     - **`hydra_stuck` (45 ticks):** Colmillos atascados en la cubierta en $y=111$. Vulnerable $100\%$ a los tajos y magias de Kratos.
     - **`hydra_sweep` (30 ticks):** Barrido horizontal rasante a nivel de suelo ($y \approx 240..262$). Si Kratos está en el aire ($vy \neq 0$ o $y < 230$), esquiva limpiamente el barrido.
     - **`hydra_hurt` (15 ticks):** Sacudida de cabeza al recibir daño significativo.
     - **`hydra_stagger` (90 ticks):** Cabeza desplomada exhausta en la madera de cubierta tras perder 100 HP. Ojos aturdidos, libre para combos continuos.
     - **`hydra_defeat`:** Colapso agónico a 0 HP, eclosión de 15 orbes rojos, 2 verdes y 2 azules.
   - Cálculo de daño recibido:
     - Afectado por `player.weaponLevel` (factor 1.3 si tiene Cuchillas Nivel 2).
     - Susceptible a los pulsos eléctricos multi-hit de *Ira de Poseidón*.

4. **Escenario y Colocación (`src/sim/scenarios.ts`):**
   - Escenario determinista `'hydra'`: Kratos en $x=180, y=262$ y la Hidra en $x=360, y=262$ (cubierta $y=262$).
   - Escenario canónico `'level1'`: la Hidra colocada como clímax en Proa en $x=1360, y=262$.

5. **Presentación Visual y HUD (`src/ui/HudLayer.ts` y `src/scene/ShellScene.ts`):**
   - **Barra de Vida de Jefe en HUD:**
     - Barra de 200 px en la parte inferior de la pantalla con marco dorado y drenaje suave (*ghost health* de jefe).
     - Rótulo superior en oro clásico: `"LA HIDRA DE LERNA"`.
     - Solo visible cuando la Hidra está presente y activa en el escenario.
   - **Renderizado del Jefe en Phaser (`ShellScene.ts`):**
     - Sincronización precisa entre la máquina de estados de simulación y los clips de animación de Phaser:
       - `hydra_idle` $\rightarrow$ `hydra-idle`
       - `hydra_roar` $\rightarrow$ `hydra-roar`
       - `hydra_slam` / `hydra_stuck` $\rightarrow$ `hydra-slam`
       - `hydra_sweep` $\rightarrow$ `hydra-sweep`
       - `hydra_hurt` $\rightarrow$ `hydra-hurt`
       - `hydra_stagger` $\rightarrow$ `hydra-stagger`
       - `hydra_defeat` $\rightarrow$ `hydra-defeat`
     - Sacudida de cámara (screen shake) al impactar el mordisco en la cubierta.
     - Banner triunfal superior: `"¡HIDRA DERROTADA!"`.

6. **Prueba Automatizada en Chrome DevTools Protocol (`scripts/verification/capture-combat.mjs`):**
   - **Caso X (`hydra_boss_combat_and_defeat`):**
     - Kratos en escenario `hydra`.
     - Observación de ciclo: `hydra_idle` $\rightarrow$ `hydra_roar` (telegraph) $\rightarrow$ `hydra_slam`.
     - Kratos esquiva el slam con rodada (`dodge`), recibiendo 0 daño.
     - Durante el estado `hydra_stuck`, Kratos ataca con combo ligero (`J, J, J, J`) infligiendo daño potenciado por Nivel 2.
     - Kratos ejecuta *Ira de Poseidón* (`magic`), atrapando a la Hidra en tormenta multi-hit.
     - Agotamiento de la salud a 0 HP: verificación de transición a `hydra_defeat`, spawn masivo de orbes y banner de victoria.
     - Cero errores en consola de Chrome.
     - Generación de mosaico `hydra_boss_combat_and_defeat_mosaic.png` y animación `.gif`.

---

## 2. Invariantes y Regresiones Protegidas

- Cero errores de compilación TypeScript (`tsc --noEmit`) y build de Vite (`pnpm build`).
- Preservación estricta de los 23 casos de verificación previos (Casos A a W).
- Determinismo físico estricto a 60 Hz sin acumulación de flotantes.
- Sin fugas del arnés de desarrollo (`__GOW8B`) en el bundle productivo `dist/`.

---

## 3. Evidencia de Auditoría Independiente

- **Auditor:** Subagente independiente `01acf36e-053e-4f48-b4d9-de32dea2e091` (modo estrictamente de solo lectura).
- **Veredicto:** **APROBADO**.
- **Resultados cuantitativos y verificación:**
  - Configuración centralizada en `CONFIG.enemy.hydra` (`maxHp: 300`, `slamDamage: 25`, `sweepDamage: 20`, `telegraphTicks: 30`, `stuckTicks: 45`, `staggerThresholdHp: 100`, `staggerDurationTicks: 90`, `slamImpactRadius: 40`, `dropOrbs: { red: 15, green: 2, blue: 2 }`) y `CONFIG.presentation.hud.boss` (barra de $200 \times 7\text{ px}$ en $x=140, y=252$ titulada `"LA HIDRA DE LERNA"`).
  - Máquina de estados determinista a 60 Hz en `src/sim/hydra.ts`: ciclo `hydra_idle` (60 ticks), `hydra_roar` (30 ticks), `hydra_slam` con impacto en tick 8, colmillos clavados en cubierta `hydra_stuck` (45 ticks), `hydra_sweep` rasante a nivel de suelo, `hydra_stagger` (90 ticks al perder 100 HP) y `hydra_defeat` a 0 HP.
  - Cascada defensiva verificada: evasión con rodada o casteo de magia produce 0 daño recibido; guardia mitiga al 85%; impacto directo produce 25 de daño y 45 i-frames.
  - Daño escalado por arma: caja de colisión monumental adaptada al jefe en `src/sim/attack.ts`, multiplicador de Cuchillas Nivel 2 ($\times 1.3$) e impacto continuo de *Ira de Poseidón* en `src/sim/magic.ts`.
  - HUD monumental: barra inferior con marco de bronce, fondo oscuro, barra frontal carmesí y barra fantasma rosa de drenaje amortiguado, visible solo cuando el jefe está activo.
  - Sincronización visual completa en `src/scene/ShellScene.ts`: clips de Phaser vinculados a `aiState`, sacudida de pantalla en impacto y banner triunfal `"¡HIDRA DERROTADA!"`.
  - Escenarios: escenario de prueba `hydra` ($x=360$) y colocación en Proa en `level1` ($x=1360, y=262$).
  - `pnpm exec tsc --noEmit && pnpm build`: salida código 0 en 5.7s, 0 fugas en `dist/`.
  - Chrome CDP (`capture-combat.mjs`): 24/24 casos aprobados (Casos A a X) con determinismo estricto y 0 errores de consola.
  - Caso X verificado: $t=1$ estado inicial $hp=300, bossHp=300$, $t=3$ telegraph de rugido, $t=12$ evasión exitosa con rodada ($playerHp=100$), $t=17$ colmillos clavados `hydra_stuck`, $t=26$ impacto Cuchillas Nivel 2 ($hydraHp=282$), $t=46$ multi-hit de Ira de Poseidón ($hydraHp=266$), $t=56$ derrota terminal ($hp=0, dead=true$), $t=65$ eclosión de 19 orbes y vaciado de barra.
  - Artefactos visuales: `hydra_boss_combat_and_defeat_mosaic.png` (2.44 MB) y `hydra_boss_combat_and_defeat.gif` (862 KB).

