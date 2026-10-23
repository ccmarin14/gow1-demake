# Plan de implementación — `GOW8B-PICK-02` (Plumas de Fénix: Cofres de Piedra, Recolección y Expansión de Maná)

- **Fecha:** 2026-10-23
- **Estado:** **APROBADO** (Completada y auditada independientemente el 2026-10-23).
- **Decisiones asociadas:** `D-03` (Lore y progresión canónica de God of War 1 PS2), `D-06` (roles orquestador / implementador / auditor), `D-12` (lienzo 480×270 a 60 Hz), `D-24` (fidelidad a mecánicas de combate y economía de GoW 1), `H-3` (cofres, orbes y mejoras).
- **Objetivo:** Implementar los cofres de piedra griegos de *Plumas de Fénix* (*Phoenix Feathers*), su interacción contextual determinista con tecla `E` (`context-action`), la apertura del cofre con liberación de la pluma mística azul zafiro, el indicador de 6 plumas en el HUD, y la expansión permanente de la reserva máxima de maná de Kratos de 100 a 120 MP con redimensionamiento dinámico del marco de la barra de maná en el HUD.

---

## 1. Alcance y Especificación Funcional

1. **Configuración Centralizada (`src/config.ts`):**
   - Incorporar en `CONFIG.economy.chests`:
     - `phoenixFeathersPerUpgrade`: cantidad de plumas requeridas para una mejora ($6\text{ plumas}$ canónicas de GoW 1).
     - `manaUpgradeBonus`: incremento de maná máximo ($+20\text{ MP}$, pasando de 100 a 120 MP).
     - `featherRiseSpeed`: velocidad vertical de ascensión de la pluma al abrirse ($v_y = -80\text{ px/s}$).
     - `featherMagnetSpeed`: velocidad de absorción magnética hacia el torso de Kratos ($260\text{ px/s}$).
   - Paleta de color y dimensiones de presentación en `CONFIG.presentation.chest`:
     - Emblema de pluma azul zafiro (`0x38bdf8`, `0x60a5fa`, `0x1e40af`).
     - Parámetro de HUD: `manaBarWidth` base 80 px (100 MP) expandible dinámicamente a 96 px (120 MP, a razón de 16 px por cada 20 MP).

2. **Tipos de Simulación (`src/sim/types.ts`):**
   - Incorporar en `EntityState` (para Kratos):
     - `phoenixFeathers: number` (progreso actual hacia la siguiente mejora, $0..5$).
     - `phoenixUpgrades: number` (total de mejoras de maná obtenidas).

3. **Módulo de Cofres y Lógica de Simulación (`src/sim/chests.ts` y `src/sim/world.ts`):**
   - Soporte para cofres de tipo `'phoenix_feather'`.
   - Detección de proximidad y apertura con `context-action` (`E`) con anclaje firme de Kratos ($v_x = 0$, bloqueo de acciones durante los 24 ticks).
   - Al completarse los 24 ticks: cofre pasa a `'open'`, se libera la *Pluma de Fénix* y es absorbida por Kratos.
   - El contador `player.phoenixFeathers` se incrementa en +1.
   - Si `player.phoenixFeathers >= 6`:
     - `player.maxMp += 20` ($100 \rightarrow 120\text{ MP}$).
     - `player.mp = player.maxMp` (restauración total al expandir maná).
     - `player.phoenixFeathers = 0`.
     - `player.phoenixUpgrades += 1`.
   - Escenario canónico `level1`: colocar un cofre de Pluma de Fénix en la viga inferior del mástil de Proa ($x=1110, y=200$).
   - Escenario de verificación `chest`: incluir cofre de pluma de fénix (o parámetro de prueba).

4. **Presentación Visual y HUD Dinámico (`src/ui/HudLayer.ts` y `src/scene/ShellScene.ts`):**
   - **Indicador de Plumas de Fénix en HUD:**
     - 6 casillas/gemas en el HUD dispuestas ornamentalmente junto a las de los ojos, que se iluminan en azul zafiro brillante (`0x38bdf8`) a medida que se recolectan plumas.
   - **Expansión Dinámica de la Barra de Maná:**
     - Al alcanzar los 120 MP, el ancho máximo de la barra de maná pasa de 80 px a 96 px.
     - El marco exterior de la barra de maná (`manaFrameBg`, `manaChannelTrough`) se redimensiona en ancho para albergar los 96 px.
     - El texto numérico refleja de inmediato `MP: 120/120`.
   - **Renderizado del Cofre en el Escenario:**
     - Cofre de piedra con emblema de pluma azul zafiro incandescente.
     - Indicador contextual en pantalla: `[E] ABRIR`.
     - Animación de apertura con destello azul y pluma ascendente con estela de partículas de maná.

5. **Prueba Automatizada en Chrome DevTools Protocol (`scripts/verification/capture-combat.mjs`):**
   - **Caso U (`phoenix_feather_chest_and_mana_upgrade`):**
     - Kratos se aproxima al cofre de pluma en escenario `chest`.
     - Inicia interacción con `context-action` (`E`).
     - Ticks 1..24: comprobación de estado `'opening'` y retención de avance ($v_x = 0$).
     - Tick 25: apertura completa, absorción de la pluma, incremento de `phoenixFeathers`.
     - Verificación de expansión completa a 120 MP al acumular 6 plumas: `player.maxMp === 120`, `player.mp === 120`.
     - Comprobación en `hudLayer.getMetrics()`: `maxMp === 120`, `currentMp === 120`, `manaWidth === 96`.
     - Cero errores en consola de Chrome.
     - Generación de mosaico `phoenix_feather_chest_and_mana_upgrade_mosaic.png` y animación `.gif`.

---

## 2. Invariantes y Regresiones Protegidas

- Cero errores de compilación TypeScript (`tsc --noEmit`) y build de Vite (`pnpm build`).
- Preservación estricta de los 20 casos de verificación previos (Casos A a T).
- Determinismo físico estricto a 60 Hz sin acumulación de flotantes.
- Sin fugas del arnés de desarrollo (`__GOW8B`) en el bundle productivo `dist/`.

---

## 3. Evidencia de Auditoría Independiente

- **Auditor:** Subagente independiente `01acf36e-053e-4f48-b4d9-de32dea2e091` (modo estrictamente de solo lectura).
- **Veredicto:** **APROBADO**.
- **Resultados cuantitativos y verificación:**
  - Configuración centralizada en `CONFIG.economy.chests` (`phoenixFeathersPerUpgrade: 6`, `manaUpgradeBonus: 20`, `featherRiseSpeed: -80`, `featherMagnetSpeed: 260`) y `CONFIG.presentation.chest` (paleta azul zafiro).
  - Lógica pura en `src/sim/chests.ts`: `collectPhoenixFeather`, soporte de tipo `'phoenix_feather'`, inmovilidad $v_x = 0$ durante los 24 ticks de apertura, absorción en tick 25 (`itemAbsorbed: true`).
  - Progresión hacia 6 Plumas de Fénix y expansión permanente a 120 MP con restauración completa de maná (`player.mp = 120`), reseteo de `player.phoenixFeathers = 0` e incremento de `player.phoenixUpgrades += 1`.
  - HUD dinámico: redimensionamiento de 80 px a 96 px en el marco y canal de maná (`manaFrameBg`, `manaChannelTrough`) al alcanzar 120 MP, 6 ranuras de plumas iluminándose en azul zafiro brillante (`0x38bdf8`) y texto numérico actualizado a `MP: 120/120`.
  - Escenario determinista `chest` (cofre de pluma en $x=300, y=262$) y colocación canónica en `level1` (viga de Proa $x=1110, y=200$).
  - `pnpm exec tsc --noEmit && pnpm build`: salida código 0 en 5.8s, 0 fugas en `dist/`.
  - Chrome CDP (`capture-combat.mjs`): 21/21 casos aprobados (Casos A a U) con determinismo estricto y 0 errores de consola.
  - Caso U verificado: $t=1$ inicio `state=opening` con $v_x=0$, $t=12$ progreso medio con $v_x=0$, $t=24$ tick final con $v_x=0$, $t=25$ cofre abierto y pluma absorbida (`phoenixFeathers=1`), $t=35$ 6ª pluma y expansión de maná (`maxMp=120`, `mp=120`, `upgr=1`), $t=60$ métricas de HUD expandido (`manaWidth=96`).
  - Artefactos visuales: `phoenix_feather_chest_and_mana_upgrade_mosaic.png` (1.39 MB) y `phoenix_feather_chest_and_mana_upgrade.gif` (1.37 MB).

