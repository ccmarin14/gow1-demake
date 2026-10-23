# Plan de implementación — `GOW8B-PICK-01` (Ojos de Górgona: Cofres de Piedra, Recolección y Expansión de Salud)

- **Fecha:** 2026-10-23
- **Estado:** **APROBADO** (Completada y auditada independientemente el 2026-10-23).
- **Decisiones asociadas:** `D-03` (Lore y progresión canónica de God of War 1 PS2), `D-06` (roles orquestador / implementador / auditor), `D-12` (lienzo 480×270 a 60 Hz), `D-24` (fidelidad a mecánicas de combate y economía de GoW 1), `H-3` (cofres, orbes y mejoras).
- **Objetivo:** Implementar los cofres de piedra griegos de *Ojos de Górgona* (*Gorgon Eyes*), su interacción contextual determinista con tecla `E` (`context-action`), la animación de apertura del cofre con liberación del ojo místico, el registro de progreso de 6 ojos en el HUD, y la expansión permanente de la barra de salud máxima de Kratos de 100 a 120 HP con redimensionamiento dinámico del marco ornamental de piedra y bronce en el HUD.

---

## 1. Alcance y Especificación Funcional

1. **Configuración Centralizada (`src/config.ts`):**
   - Incorporar en `CONFIG.economy.chests`:
     - `interactionRadius`: radio horizontal de interacción ($\le 28\text{ px}$).
     - `verticalTolerance`: tolerancia vertical de cota ($\le 16\text{ px}$).
     - `openDurationTicks`: duración determinista de apertura ($24\text{ ticks} = 400\text{ ms}$).
     - `gorgonEyesPerUpgrade`: cantidad de ojos requeridos para una mejora ($6\text{ ojos}$ canónicos de GoW 1).
     - `healthUpgradeBonus`: incremento de salud máxima ($+20\text{ HP}$, pasando de 100 a 120 HP).
     - `eyeRiseSpeed`: velocidad vertical de ascensión del ojo al abrirse ($v_y = -80\text{ px/s}$).
     - `eyeMagnetSpeed`: velocidad de absorción magnética hacia el torso de Kratos ($260\text{ px/s}$).
   - Paleta de color y dimensiones de presentación en `CONFIG.presentation.chest`:
     - Cofre de piedra tallada griega ($24 \times 18\text{ px}$) con grabados dorados y emblema de ojo esmeralda central.
     - Dimensiones de la barra de salud dinámica: base 110 px (100 HP, 5 segmentos de 22 px) expandible a 132 px (120 HP, 6 segmentos de 22 px).

2. **Tipos de Simulación (`src/sim/types.ts`):**
   - Estado de cofre `ChestState`:
     - `id: string`
     - `type: 'gorgon_eye' | 'phoenix_feather' | 'red_orbs' | 'green_health'`
     - `x: number`
     - `y: number`
     - `state: 'closed' | 'opening' | 'open'`
     - `openProgressTicks: number`
     - `itemAbsorbed: boolean`
   - Incorporar en `EntityState` (para Kratos):
     - `gorgonEyes: number` (progreso actual hacia la siguiente mejora, $0..5$).
     - `gorgonUpgrades: number` (total de mejoras de vida obtenidas).
   - Extender `SimulationSnapshot` para incluir `chests: ChestState[]`.

3. **Módulo de Cofres y Lógica de Simulación (`src/sim/chests.ts` y `src/sim/world.ts`):**
   - Detección de proximidad: cuando Kratos está dentro de `interactionRadius` de un cofre cerrado y pulsa/mantiene `context-action` (`E`):
     - Se inicia la apertura: el cofre pasa a `'opening'` e incrementa `openProgressTicks`.
     - Kratos queda firmemente anclado en la acción de apertura durante los 24 ticks ($v_x = 0$).
     - Al completar los 24 ticks: cofre pasa a `'open'`, se libera el *Ojo de Górgona* con impulso vertical y es absorbido por Kratos.
     - El contador `player.gorgonEyes` se incrementa en +1.
     - Si `player.gorgonEyes >= 6`:
       - `player.maxHp += 20` ($100 \rightarrow 120\text{ HP}$).
       - `player.hp = player.maxHp` (restauración total al expandir).
       - `player.gorgonEyes = 0`.
       - `player.gorgonUpgrades += 1`.
   - Escenario canónico `level1`: colocar un cofre de Ojo de Górgona en Popa sobre la caja de suministros ($x=240, y=226$) y otro en el castillo de Proa ($x=1360, y=218$).
   - Escenario determinista de verificación `chest`: Kratos ($x=160, y=262$), cofre en ($x=190, y=262$) con interacción directa.

4. **Presentación Visual y HUD Clásico Dinámico (`src/ui/HudLayer.ts` y `src/scene/ShellScene.ts`):**
   - **Indicador de Ojos de Górgona en HUD:**
     - 6 casillas/gemas en el HUD dispuestas ornamentalmente bajo el medallón de Kratos.
     - Cada casilla se ilumina en verde esmeralda brillante (`0x22c55e`) a medida que se recolectan ojos.
   - **Expansión Dinámica de la Barra de Vida:**
     - Al alcanzar los 120 HP, el ancho máximo de la barra pasa de 110 px a 132 px.
     - El marco exterior de piedra y bronce (`frameBg`, `frameTopBevel`, `frameBottomShadow`, `frameEndCap`, `channelTrough`) se redimensiona suavemente en ancho para albergar los 132 px.
     - Se renderiza la 5ª muesca divisoria (*notch*) en $x = \text{barX} + 110\text{ px}$, completando los 6 segmentos canónicos de 20 HP.
     - El texto numérico refleja de inmediato `HP: 120/120`.
   - **Renderizado del Cofre en el Escenario:**
     - Cofre de piedra cincelada con tapa y bisagras de bronce.
     - Ojo de Górgona místico con brillo esmeralda pulsante.
     - Indicador contextual en pantalla cuando Kratos está cerca: `[E] ABRIR`.
     - Animación de tapa abriéndose al completar la interacción y eyección de la gema del ojo.

5. **Prueba Automatizada en Chrome DevTools Protocol (`scripts/verification/capture-combat.mjs`):**
   - **Caso T (`gorgon_eye_chest_and_health_upgrade`):**
     - Kratos se aproxima al cofre de piedra en escenario `chest`.
     - Inicia interacción con tecla `E` (`context-action`).
     - Ticks 1..24: comprobación de estado `'opening'` y retención de avance.
     - Tick 25: apertura completa, absorción del ojo, incremento de `gorgonEyes`.
     - Para verificar la expansión completa a 120 HP: se simula la obtención del 6º ojo (o cofre con upgrade directo).
     - Comprobación en `hudLayer.getMetrics()`: `maxHp === 120`, `currentHp === 120`, `currentWidth === 132`.
     - Cero errores en consola de Chrome.
     - Generación de mosaico `gorgon_eye_chest_and_health_upgrade_mosaic.png` y animación `.gif`.

---

## 2. Invariantes y Regresiones Protegidas

- Cero errores de compilación TypeScript (`tsc --noEmit`) y build de Vite (`pnpm build`).
- Preservación estricta de los 19 casos de verificación previos (Casos A a S): combate con cadenas, parry, oleadas, barreras de arena, magia de Poseidón, cámara con scroll y plataformas elevadas.
- Determinismo físico estricto a 60 Hz sin acumulación de flotantes.
- Sin fugas del arnés de desarrollo (`__GOW8B`) en el bundle productivo `dist/`.

---

## 3. Evidencia de Auditoría Independiente

- **Auditor:** Subagente independiente `01acf36e-053e-4f48-b4d9-de32dea2e091` (modo estrictamente de solo lectura).
- **Veredicto:** **APROBADO**.
- **Resultados cuantitativos y verificación:**
  - Configuración centralizada en `CONFIG.economy.chests` (`interactionRadius: 28`, `verticalTolerance: 16`, `openDurationTicks: 24`, `gorgonEyesPerUpgrade: 6`, `healthUpgradeBonus: 20`, `eyeRiseSpeed: -80`, `eyeMagnetSpeed: 260`) y `CONFIG.presentation.chest` (cofre griego $24 \times 18\text{ px}$).
  - Módulo puro `src/sim/chests.ts` con lógica determinista: `isNearChest`, anclaje firme de Kratos ($v_x = 0$) durante los 24 ticks de apertura, absorción en tick 25 (`itemAbsorbed = true`).
  - Progresión hacia 6 Ojos de Górgona y expansión permanente a 120 HP con restauración completa de vida (`player.hp = 120`), reseteo de `player.gorgonEyes = 0` e incremento de `player.gorgonUpgrades += 1`.
  - HUD dinámico: redimensionamiento de 110 px a 132 px en el marco y las barras al alcanzar 120 HP, 5ª muesca segmentada en $x = \text{barX} + 110\text{ px}$, 6 ranuras de ojos iluminándose en verde esmeralda y texto actualizado a `HP: 120/120`.
  - Escenario determinista `chest` y colocación canónica en `level1` (caja de Popa $x=240, y=226$ y castillo de Proa $x=1360, y=218$).
  - `pnpm exec tsc --noEmit && pnpm build`: salida código 0 en 5.99s, 0 fugas en `dist/`.
  - Chrome CDP (`capture-combat.mjs`): 20/20 casos aprobados (Casos A a T) con determinismo estricto y 0 errores de consola.
  - Caso T verificado: $t=1$ inicio `state=opening` con $v_x=0$, $t=12$ progreso medio con $v_x=0$, $t=24$ tick final con $v_x=0$, $t=25$ cofre abierto y ojo absorbido (`gorgonEyes=1`), $t=35$ expansión de salud (`maxHp=120`, `hp=120`, `upgr=1`), $t=60$ métricas de HUD expandido (`currentWidth=132`).
  - Artefactos visuales: `gorgon_eye_chest_and_health_upgrade_mosaic.png` (1.37 MB) y `gorgon_eye_chest_and_health_upgrade.gif` (1.39 MB).

