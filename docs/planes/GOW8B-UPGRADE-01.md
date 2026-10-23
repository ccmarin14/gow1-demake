# Plan de implementación — `GOW8B-UPGRADE-01` (Cofres de Orbes Rojos y Mejora de Armas a Nivel 2)

- **Fecha:** 2026-10-23
- **Estado:** **APROBADO** (Completada y auditada independientemente el 2026-10-23).
- **Decisiones asociadas:** `D-03` (Lore y economía de God of War 1 PS2), `D-06` (roles orquestador / implementador / auditor), `D-12` (lienzo 480×270 a 60 Hz), `D-24` (fidelidad a mecánicas de combate y economía de GoW 1), `H-3` (cofres, orbes y mejoras de armas).
- **Objetivo:** Implementar los cofres de piedra griegos de *Orbes Rojos* (*Red Orbs*), la eclosión y absorción balística de orbes carmesí de alto valor, y el sistema canónico de mejora de armamento (*Weapon Upgrade*) para las Cuchillas del Caos a Nivel 2 (`Blades of Chaos Level 2`), con deducción de orbes rojos (coste de 100 orbes), incremento de daño base (+30%), indicador de nivel en el HUD y banner de consagración en pantalla.

---

## 1. Alcance y Especificación Funcional

1. **Configuración Centralizada (`src/config.ts`):**
   - Incorporar en `CONFIG.economy.chests`:
     - `redOrbsChestValue: 50` (orbes rojos otorgados por cofre de orbes, emitidos en 5 orbes de 10 puntos).
   - Incorporar en `CONFIG.player.weapon.upgrades`:
     - `level2Cost: 100` (coste en orbes rojos para desbloquear Nivel 2).
     - `level2DamageMultiplier: 1.3` (bonificación de daño de +30% para todos los ataques y remates).
     - `level2Name: 'Cuchillas del Caos Nv. 2'`.
   - Paleta de color y presentación en `CONFIG.presentation.chest`:
     - Emblema carmesí de Ares (`0xef4444`, `0xb91c1c`, `0xfca5a5`).
   - Presentación de mejora en `CONFIG.presentation.weapon`:
     - Runa incandescente dorada en el HUD (`0xfacc15`) y cadenas con brillo ígneo mejorado en Nivel 2.

2. **Tipos de Simulación (`src/sim/types.ts`):**
   - En `GameAction`: incorporar `'upgrade'` (mapeada a tecla `P` en `src/input/InputManager.ts`).
   - En `EntityState`: incorporar `weaponLevel: number` (1 base, 2 mejorado).
   - En `ChestState`: soporte pleno de tipo `'red_orbs'`.

3. **Módulo de Cofres y Lógica de Mejora (`src/sim/chests.ts`, `src/sim/attack.ts` y `src/sim/world.ts`):**
   - **Cofres de Orbes Rojos:**
     - Interacción con `context-action` (`E`) requiriendo 24 ticks de apertura ininterrumpida con Kratos anclado ($v_x = 0$).
     - Al tick 25: cofre pasa a `'open'`, eclosión balística en abanico de 5 orbes rojos de alto valor que son atraídos magnéticamente y absorbidos, sumando +50 al saldo `player.redOrbs`.
   - **Mecánica de Mejora de Arma (`upgradeWeapon`):**
     - Al activarse la acción `'upgrade'` (`P`) o por interacción directa:
     - Si `player.weaponLevel === 1` y `player.redOrbs >= 100`:
       - Se descuentan 100 orbes (`player.redOrbs -= 100`).
       - `player.weaponLevel = 2`.
       - Retorna `true` para activar el banner y sonido/partículas de mejora.
     - Si `player.redOrbs < 100`: la mejora se bloquea y deniega.
   - **Impacto en el Combate (`src/sim/attack.ts`):**
     - Al calcular el daño infligido a legionarios y arqueros:
       $damage = \text{Math.round}(baseDamage \times (player.weaponLevel === 2 ? 1.3 : 1.0))$.
       Ejemplo: ataque ligero básico pasa de 12 a 16 HP; remate *Plume of Prometheus* pasa de 30 a 39 HP.

4. **Presentación Visual y HUD (`src/ui/HudLayer.ts` y `src/scene/ShellScene.ts`):**
   - **Indicador de Nivel de Arma en HUD:**
     - Rótulo/indicador de nivel: `NV. 1` en blanco/plata; al mejorar conmuta a `NV. 2` en oro incandescente (`#facc15`).
     - Prompt contextual en HUD `[P] MEJORAR` cuando `weaponLevel === 1` y `redOrbs >= 100`.
   - **Banner de Mejora en Pantalla:**
     - Al alcanzar el Nivel 2, se renderiza un banner centrado en pantalla: `"¡CUCHILLAS DEL CAOS NIVEL 2!"` con resplandor dorado y desvanecimiento progresivo.
   - **Renderizado del Cofre de Orbes Rojos:**
     - Cofre de piedra con emblema carmesí tallado de Ares.
     - Apertura animada con haz de luz roja y fuente de orbes incandescentes.

5. **Prueba Automatizada en Chrome DevTools Protocol (`scripts/verification/capture-combat.mjs`):**
   - **Caso V (`red_orbs_chest_and_weapon_upgrade`):**
     - Kratos se aproxima al cofre de orbes rojos en escenario `chest`.
     - Inicia interacción con `context-action` (`E`).
     - Ticks 1..24: verificación de `state === 'opening'`, inmovilidad $v_x = 0$.
     - Tick 25: apertura completa, eclosión de orbes rojos y absorción hacia Kratos, incrementando el saldo de orbes.
     - Se dota de saldo suficiente ($redOrbs \ge 100$) y se acciona `'upgrade'` (`P`).
     - Verificación determinista: `player.weaponLevel === 2`, saldo descontado (`redOrbs -= 100`).
     - Verificación de combate: golpe a enemigo produce daño potenciado ($\times 1.3$, p. ej. 16 de daño en lugar de 12).
     - Comprobación en `hudLayer.getMetrics()`: `weaponLevel === 2`.
     - Cero errores en consola de Chrome.
     - Generación de mosaico `red_orbs_chest_and_weapon_upgrade_mosaic.png` y animación `.gif`.

---

## 2. Invariantes y Regresiones Protegidas

- Cero errores de compilación TypeScript (`tsc --noEmit`) y build de Vite (`pnpm build`).
- Preservación estricta de los 21 casos de verificación previos (Casos A a U).
- Determinismo físico estricto a 60 Hz sin acumulación de flotantes.
- Sin fugas del arnés de desarrollo (`__GOW8B`) en el bundle productivo `dist/`.

---

## 3. Evidencia de Auditoría Independiente

- **Auditor:** Subagente independiente `01acf36e-053e-4f48-b4d9-de32dea2e091` (modo estrictamente de solo lectura).
- **Veredicto:** **APROBADO**.
- **Resultados cuantitativos y verificación:**
  - Configuración centralizada en `CONFIG.economy.chests.redOrbsChestValue: 50` y `CONFIG.player.weapon.upgrades` (`level2Cost: 100`, `level2DamageMultiplier: 1.3`, `level2Name: 'Cuchillas del Caos Nv. 2'`).
  - Lógica pura en `src/sim/chests.ts`: acreditación de +50 orbes rojos en tick 25 tras 24 ticks de apertura ininterrumpida con $v_x = 0$.
  - Función pura `upgradeWeapon`: deducción de 100 orbes rojos, fijación de `player.weaponLevel = 2` y denegación con orbes insuficientes ($< 100$).
  - Multiplicador de daño en combate en `src/sim/attack.ts`: bonificación $\times 1.3$ en Nivel 2 comprobada contra enemigo (daño ligero de 16 en lugar de 12 sobre legionario con 60 HP, dejando $HP = 44$).
  - HUD y presentación: indicador `NV. 1` / `NV. 2` en oro (`#facc15`), prompt contextual `[P] MEJORAR`, banner animado `"¡CUCHILLAS DEL CAOS NIVEL 2!"` y cadenas con brillo ígneo ambarino (`0xf59e0b`).
  - Escenarios: cofre de orbes rojos en $x=410$ en `chest` y en Popa $x=70, y=262$ en `level1`.
  - `pnpm exec tsc --noEmit && pnpm build`: salida código 0 en 5.7s, 0 fugas en `dist/`.
  - Chrome CDP (`capture-combat.mjs`): 22/22 casos aprobados (Casos A a V) con determinismo estricto y 0 errores de consola.
  - Caso V verificado: $t=1$ inicio opening $v_x=0$, $t=12$ mitad opening $v_x=0$, $t=24$ fin opening $v_x=0$, $t=25$ apertura y +50 orbes rojos, $t=31$ mejora a Nivel 2 (`weaponLevel=2, orbs=0`), $t=48$ impacto de combate con 16 de daño ($targetHp=44$), $t=70$ métricas de HUD `hud.weaponLevel=2`.
  - Artefactos visuales: `red_orbs_chest_and_weapon_upgrade_mosaic.png` (1.81 MB) y `red_orbs_chest_and_weapon_upgrade.gif` (1.98 MB).

