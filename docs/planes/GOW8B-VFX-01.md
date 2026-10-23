# Plan de implementación — `GOW8B-VFX-01` (Efectos Visuales: Clima del Egeo, Relámpagos, Salpicaduras e Impactos Legibles)

- **Fecha:** 2026-10-23
- **Estado:** **APROBADO** (Completada y auditada independientemente el 2026-10-23).
- **Decisiones asociadas:** `D-03` (Atmósfera de tormenta en el Mar Egeo de God of War 1 PS2), `D-06` (roles orquestador / implementador / auditor), `D-12` (lienzo 480×270 a 60 Hz), `D-24` (legibilidad visual prioritaria sin saturación).
- **Objetivo:** Implementar el sistema ambiental y de efectos visuales (VFX) para el nivel del Mar Egeo: cortina de lluvia marina multicapa con viento diagonal y salpicaduras en cubierta, relámpagos distantes del Olimpo que iluminan el horizonte marino, chispas de bronce e impactos de cadenas al golpear enemigos o el entablado, y destellos de desvío perfecto (*Parry*), diseñados estrictamente para enriquecer la atmósfera épica sin obstruir en ningún momento las siluetas, anticipaciones de ataque (*telegraph*) ni la interfaz en la resolución interna de 480×270.

---

## 1. Alcance y Especificación Funcional

1. **Configuración Centralizada de Efectos (`src/config.ts`):**
   - Incorporar en `CONFIG.vfx`:
     - `rain`:
       - `dropCount`: 60 gotas simultáneas activas en pantalla.
       - `angleDeg`: 15° (viento diagonal hacia la derecha).
       - `fallSpeed`: 320 px/s ($vy$), `driftSpeed`: 70 px/s ($vx$).
       - `dropLength`: 6 px, `dropThickness`: 1 px.
       - `color`: `0x94a3b8`, `alphaBack`: 0.25, `alphaFront`: 0.38.
       - `splashDurationTicks`: 6 ticks, `splashRadius`: 3 px.
     - `lightning`:
       - `intervalTicksMin`: 360 ticks (6s), `intervalTicksMax`: 600 ticks (10s).
       - `flashDurationTicks`: 3 ticks, `flashAlpha`: 0.30.
       - `color`: `0xe0f2fe`.
     - `combatSparks`:
       - `sparkCount`: 6 partículas por impacto.
       - `lifetimeTicks`: 8 ticks.
       - `colors`: `[0xfde047, 0xf97316, 0xef4444]`.
     - `parryFlash`:
       - `durationTicks`: 8 ticks, `radius`: 12 px, `color`: `0xfef08a`.

2. **Módulo de Gestión de VFX (`src/scene/VfxLayer.ts` o integrado en `ShellScene.ts`):**
   - **Lluvia Marina en Capas de Profundidad:**
     - Capa trasera (`depth = 1`): detrás de Kratos y enemigos, aporta densidad atmosférica sin tocar personajes.
     - Capa frontal (`depth = 40`): delante de personajes, con opacidad baja ($< 0.4$) para garantizar 100% de transparencia y contraste de siluetas.
     - Al colisionar con la cubierta ($y = 262$) o vigas elevadas, genera micro-salpicaduras de agua salada.
   - **Relámpagos Ambientales:**
     - Modula un flash tenue sobre el fondo del Egeo sin tapar los personajes ni el HUD.
   - **Chispas y Polvo de Combate:**
     - Al impactar las cadenas contra un enemigo o la cubierta (`groundImpactTicks > 0`), emite una ráfaga radial breve de chispas ardientes.
     - Al activarse un *Parry* de 6 ticks, emite un destello dorado estelar en el punto de bloqueo.
   - **Respeto Estricto de Pausa:**
     - Durante `flowState === 'paused'`, la actualización de gotas y partículas se congela deterministamente.

3. **Prueba Automatizada en Chrome DevTools Protocol (`scripts/verification/capture-combat.mjs`):**
   - **Caso Z (`vfx_weather_sparks_and_readability`):**
     - Medición de gotas de lluvia activas en pantalla ($> 30$ gotas simultáneas).
     - Disparo de relámpago ambiental: comprobación de retorno a estado base post-destello.
     - Generación de chispas al golpear a un legionario: comprobación de partículas emitidas y desvanecimiento en 8 ticks.
     - Verificación de legibilidad: comprobación de que el sprite de Kratos y enemigos mantenga su contraste y bbox sin oclusión.
     - Comprobación de congelamiento de partículas durante la pausa (`ESC`).
     - Cero errores en consola de Chrome.
     - Generación de mosaico `vfx_weather_sparks_and_readability_mosaic.png` y animación `.gif`.

---

## 2. Invariantes y Regresiones Protegidas

- Cero errores de compilación TypeScript (`tsc --noEmit`) y build de Vite (`pnpm build`).
- Preservación estricta de los 25 casos de verificación previos (Casos A a Y).
- Determinismo físico estricto a 60 Hz sin acumulación de flotantes.
- Sin fugas del arnés de desarrollo (`__GOW8B`) en el bundle productivo `dist/`.

---

## 3. Evidencia de Auditoría Independiente

- **Auditor:** Subagente independiente `01acf36e-053e-4f48-b4d9-de32dea2e091` (modo estrictamente de solo lectura).
- **Veredicto:** **APROBADO**.
- **Resultados cuantitativos y verificación:**
  - Configuración centralizada en `CONFIG.vfx.rain` (60 gotas, $vx = 70\text{ px/s}$, $vy = 320\text{ px/s}$, `alphaBack: 0.25`, `alphaFront: 0.38`), `CONFIG.vfx.lightning` (`flashAlpha: 0.30`, 3 a 6 ticks de decaimiento), `CONFIG.vfx.combatSparks` (6 partículas de 8 ticks de vida) y `CONFIG.vfx.parryFlash` (destello estelar de 8 ticks).
  - Módulo desacoplado `VfxLayer.ts`:
    - Lluvia marina multicapa con generador pseudoaleatorio determinista (`createDeterministicRandom(12345)`).
    - Micro-salpicaduras en cubierta en $y = 262$ y plataformas elevadas.
    - Relámpago ambiental tenue sobre el fondo del Egeo sin eclipsar el área de combate.
    - Chispas radiales emitidas ante impactos de cadenas, impacto sísmico terrestre y mordisco de la Hidra.
    - Destello estelar dorado al producirse un *Parry* de 6 ticks.
    - Congelamiento determinista de partículas y gotas durante `flowState === 'paused'`.
  - `pnpm exec tsc --noEmit && pnpm build`: salida código 0 en 5.58s, 0 fugas en `dist/`.
  - Chrome CDP (`capture-combat.mjs`): 26/26 casos aprobados (Casos A a Z) con determinismo estricto y 0 errores de consola.
  - Caso Z verificado: $t=2$ lluvia activa con 56 gotas en pantalla, $t=6$ relámpago ambiental activo ($alpha=0.15$), $t=11$ desvanecimiento suave ($alpha=0$), $t=21$ chispas emitidas (6 partículas), $t=30$ desvanecimiento completo de chispas, $t=34$ destello estelar de parry, $t=43$ y $t=46$ congelamiento en pausa ($sparks=6, frame=40$), $t=50$ reanudación en `flowState=playing`.
  - Artefactos visuales: `vfx_weather_sparks_and_readability_mosaic.png` (1.70 MB) y `vfx_weather_sparks_and_readability.gif` (247 KB).

