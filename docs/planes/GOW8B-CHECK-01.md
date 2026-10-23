# Plan de implementación — `GOW8B-CHECK-01` (Puntos de Control, Guardado de Estado y Reaparición)

- **Fecha:** 2026-10-23
- **Estado:** **APROBADO** (Completada y auditada independientemente el 2026-10-23).
- **Decisiones asociadas:** `D-03` (Lore y persistencia canónica de God of War 1 PS2), `D-06` (roles orquestador / implementador / auditor), `D-12` (lienzo 480×270 a 60 Hz), `D-24` (fidelidad a mecánicas de combate y economía de GoW 1), `H-3` (progresión y reintento).
- **Objetivo:** Implementar el sistema canónico de *Puntos de Control* (*Checkpoints*) y columnas de luz dorada de los Dioses en el nivel naval, la persistencia determinista de la progresión acumulada del jugador (salud máxima, maná máximo, nivel de arma, orbes y cofres abiertos), y el bucle de reaparición (*respawn*) tras la derrota (`hp = 0`) sin perder el avance ni requerir recargar la página.

---

## 1. Alcance y Especificación Funcional

1. **Configuración Centralizada (`src/config.ts`):**
   - Incorporar en `CONFIG.checkpoints`:
     - `activationRadius: 32` (radio horizontal para activar el punto de control).
     - `respawnDelayTicks: 45` (pausa determinista post-derrota antes de permitir reaparición rápida).
     - `lightPillarWidth: 28` px, `lightPillarHeight: 270` px.
     - Puntos de control canónicos de `level1`:
       - Checkpoint 1 (Popa): $\{ id: 'chk-popa', x: 140, y: 262, name: 'Popa de la Nave' \}$.
       - Checkpoint 2 (Entrada a Proa): $\{ id: 'chk-proa', x: 980, y: 262, name: 'Umbral de Proa' \}$.
   - Paleta de color y presentación en `CONFIG.presentation.checkpoint`:
     - Columna de luz divina dorada de los Dioses (`0xfde047`, `0xfacc15`, `0xca8a04`, `0x78350f`) con runas concéntricas en el suelo y filamento incandescente.

2. **Tipos de Simulación (`src/sim/types.ts`):**
   - Definir `CheckpointState`:
     - `id: string`
     - `x: number`
     - `y: number`
     - `name: string`
     - `active: boolean`
   - Definir `SavedPlayerData`:
     - `maxHp: number`, `hp: number`
     - `maxMp: number`, `mp: number`
     - `weaponLevel: number`
     - `redOrbs: number`
     - `gorgonEyes: number`, `gorgonUpgrades: number`
     - `phoenixFeathers: number`, `phoenixUpgrades: number`
   - Extender `SimulationSnapshot` para incluir `checkpoints: CheckpointState[]` y `activeCheckpointId?: string`.

3. **Módulo de Checkpoints y Simulación (`src/sim/checkpoint.ts` y `src/sim/world.ts`):**
   - Detección de activación: al pasar Kratos dentro de `activationRadius` de un checkpoint:
     - El checkpoint pasa a `active = true`.
     - Se registra como el punto de reaparición activo del mundo.
     - Se captura un snapshot determinista de la progresión del jugador (`SavedPlayerData`) y de los IDs de cofres abiertos (`openedChestIds`).
   - Reaparición post-derrota (`respawnAtCheckpoint`):
     - Cuando Kratos es derrotado (`hp <= 0` o `isDead = true`), tras el temporizador de derrota o al pulsar `restart` (`R`) o `jump` / `context-action` tras la pausa:
     - Kratos se reposiciona en $(x_{chk}, y_{chk})$ del último checkpoint activo.
     - Se restauran `hp = maxHp` y `mp = maxMp`.
     - Se conservan estrictamente todas las mejoras y saldos acumulados: `maxHp`, `maxMp`, `weaponLevel`, `redOrbs`, `gorgonEyes`, `gorgonUpgrades`, `phoenixFeathers`, `phoenixUpgrades`.
     - Los cofres previamente abiertos permanecen en estado `'open'` con `itemAbsorbed = true`.
     - La cámara enfoca inmediatamente la posición del checkpoint.
   - Escenario determinista `checkpoint`: Kratos en $x=100$, checkpoint en $x=180$, trampa/enemigo en $x=240$.

4. **Presentación Visual en Phaser (`src/scene/ShellScene.ts`):**
   - Columna vertical de luz sagrada translúcida que desciende desde lo alto de la pantalla hasta la cubierta.
   - Runas doradas pulsantes en la madera de la cubierta en la base del checkpoint.
   - Al activarse: destello ascendente dorado y banner informativo superior durante 2 segundos: `"PUNTO DE CONTROL ALCANZADO"`.
   - Pantalla de derrota: rótulo `"HAS MUERTO"` con opción `[R] REAPARECER`.

5. **Prueba Automatizada en Chrome DevTools Protocol (`scripts/verification/capture-combat.mjs`):**
   - **Caso W (`checkpoint_activation_death_and_respawn`):**
     - Kratos avanza y cruza el checkpoint en $x=180$ (`checkpoint.active === true`).
     - Kratos recoge un cofre o mejora (p. ej. adquiere orbes y mejora arma a Nivel 2 o sube vida).
     - Se induce la derrota de Kratos (`hp = 0`, `isDead = true`).
     - Se acciona la reaparición (`respawnAtCheckpoint` o tecla `R`).
     - Comprobación determinista:
       - Posición de Kratos restablecida a $x = 180, y = 262$.
       - Salud y maná restaurados al $100\%$ (`hp === maxHp`, `mp === maxMp`).
       - Progresión de mejoras conservada íntegra (`weaponLevel === 2`, `maxHp === 120` si fue mejorado).
       - Cero errores en consola de Chrome.
     - Generación de mosaico `checkpoint_activation_death_and_respawn_mosaic.png` y animación `.gif`.

---

## 2. Invariantes y Regresiones Protegidas

- Cero errores de compilación TypeScript (`tsc --noEmit`) y build de Vite (`pnpm build`).
- Preservación estricta de los 22 casos de verificación previos (Casos A a V).
- Determinismo físico estricto a 60 Hz sin acumulación de flotantes.
- Sin fugas del arnés de desarrollo (`__GOW8B`) en el bundle productivo `dist/`.

---

## 3. Evidencia de Auditoría Independiente

- **Auditor:** Subagente independiente `01acf36e-053e-4f48-b4d9-de32dea2e091` (modo estrictamente de solo lectura).
- **Veredicto:** **APROBADO**.
- **Resultados cuantitativos y verificación:**
  - Configuración centralizada en `CONFIG.checkpoints` (`activationRadius: 32`, `respawnDelayTicks: 45`, `lightPillarWidth: 28`, `lightPillarHeight: 270`, `chk-popa` en $x=140$ y `chk-proa` en $x=980$).
  - Módulo puro `src/sim/checkpoint.ts` con tipado `CheckpointState` y `SavedPlayerData`: proximidad por tick ($\le 32\text{ px}$), captura atómica de instantánea y sincronización de mejoras posteriores.
  - Reaparición determinista (`respawnAtCheckpoint` / tecla `R`): reubicación en $(x_{chk}, y_{chk})$, vida y maná al $100\%$, preservación monótona de `maxHp`, `maxMp`, `weaponLevel`, `redOrbs`, `gorgonEyes`, `phoenixFeathers` y cofres abiertos.
  - Presentación visual: columna vertical de luz sagrada con pulsación dorada, runas concéntricas en la cubierta, banner superior `"PUNTO DE CONTROL ALCANZADO"` y mensaje adaptativo `"HAS MUERTO - PULSA R PARA REAPARECER"`.
  - Escenarios: escenario `checkpoint` ($x=180$) y colocación canónica en `level1` ($x=140$ y $x=980$).
  - `pnpm exec tsc --noEmit && pnpm build`: salida código 0 en 5.7s, 0 fugas en `dist/`.
  - Chrome CDP (`capture-combat.mjs`): 23/23 casos aprobados (Casos A a W) con determinismo estricto y 0 errores de consola.
  - Caso W verificado: $t=1$ inactivo, $t=20$ activación en $x \approx 180$, $t=26$ mejora a Nivel 2, $t=32$ muerte inducida ($hp=0, isDead=true$), $t=38$ reaparición en $x=180$ con $hp=100$ y `weaponLevel=2` preservado, $t=55$ métricas estables de HUD.
  - Artefactos visuales: `checkpoint_activation_death_and_respawn_mosaic.png` (1.57 MB) y `checkpoint_activation_death_and_respawn.gif` (1.69 MB).

