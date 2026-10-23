# Plan de implementación — `GOW8B-MAGIC-01` (Ira de Poseidón: Magia y Economía de Maná)

- **Fecha:** 2026-10-23
- **Estado:** **APROBADO** (Completada y auditada independientemente el 2026-10-23).
- **Decisiones asociadas:** `D-03` (Lore canónico de God of War 1 PS2), `D-06` (roles orquestador / implementador / auditor), `D-12` (lienzo 480×270 a 60 Hz).
- **Objetivo:** Implementar la primera magia canónica de Kratos concedida por el dios del mar en *God of War 1*: la **Ira de Poseidón (Poseidon's Rage)**, junto con el subsistema de maná (MP), la barra de magia azul en el HUD, los orbes azules de recuperación y el efecto de aturdimiento en área (AoE) con rayos eléctricos celestiales sobre los enemigos cercanos.

---

## 1. Alcance y Especificación Funcional

1. **Economía de Maná y Configuración (`src/config.ts`):**
   - Estructura `CONFIG.player.magic`:
     - `maxMp: 100` (reserva de maná inicial y máxima).
     - `poseidonsRage`:
       - `cost: 35` (coste en MP por invocación; permite hasta 2 invocaciones completas con la barra llena).
       - `startupTicks: 8` (133 ms de hincado de rodillas y clavado de espadas en la cubierta).
       - `activeTicks: 40` (667 ms de tormenta eléctrica celestial activa).
       - `recoveryTicks: 12` (200 ms de recuperación post-hechizo).
       - `radius: 90` (radio de efecto circular en píxeles centrado en Kratos).
       - `hitIntervalTicks: 8` (impacto multi-hit cada 8 ticks, totalizando 5 impactos eléctricos).
       - `damagePerHit: 8` (daño total acumulado de $5 \times 8 = 40\text{ HP}$, suficiente para aniquilar un arquero o dejar a un legionario al borde de la muerte).
       - `stunTicksPerHit: 24` (bloqueo e inmovilización eléctrica continua mientras dure la tormenta).
   - Extensión de economía `CONFIG.economy.orbs`:
     - `blueOrbMana: 20` (cantidad de maná restaurada por cada orbe azul absorbido).
     - Incorporación de orbes azules (`blue: 1`) en los drops de enemigos.

2. **Tipos y Estado de Simulación (`src/sim/types.ts`):**
   - `EntityState`:
     - `mp: number`, `maxMp: number`.
     - `magicPhase: 'none' | 'startup' | 'active' | 'recovery'`.
     - `magicTicks: number`.
   - `OrbState.type`: extendido a `'red' | 'green' | 'blue'`.
   - Exportación de métricas de magia en el snapshot.

3. **Módulo de Magia (`src/sim/magic.ts`):**
   - Función pura `stepMagic(player, input, targets, dt, onSpawnOrbs)`:
     - Disparo con la acción `magic` (teclas `U` o `I`):
       - Si `player.mp >= cost` y no está en hitstun ni muerto:
       - Deduce 35 MP de inmediato ($100 \rightarrow 65$).
       - Inicia `magicPhase = 'startup'`, `magicTicks = 0`, anula $v_x = 0$, Kratos gana super-armadura / invulnerabilidad durante la invocación.
     - En `active`:
       - Cada 8 ticks evalúa a los enemigos dentro del radio de 90 px:
       - Aplica daño eléctrico, aturdimiento largo (`hitstun`) y tinte azul celeste.
     - En `recovery`:
       - Kratos retira las espadas y recupera la movilidad libre.
   - Si `player.mp < cost`: la magia no se activa y no se consumen recursos.

4. **Presentación en HUD y Efectos Visuales (`src/ui/HudLayer.ts` y `src/scene/ShellScene.ts`):**
   - **Barra de Maná en el HUD:**
     - Barra azul zafiro/eléctrica (`#1e60ff` con brillo `#60b0ff`) situada inmediatamente debajo de la barra verde de salud ($y = 23$, ancho de 80 px).
     - Actualización proporcional reactiva ante el consumo de MP y la absorción de orbes azules.
   - **VFX de la Ira de Poseidón:**
     - Círculo de invocación rúnico/mágico en el suelo alrededor de los pies de Kratos.
     - Arcos de relámpagos procedurales celestes/blancos (`#80d0ff`, `#ffffff`) que crepitan hacia los extremos de la pantalla y hacia los enemigos alcanzados.
     - Destello azul de absorción cuando Kratos atrae y consume un orbe azul.

5. **Automatización y Pruebas en Chrome CDP (`scripts/verification/capture-combat.mjs`):**
   - **Caso Q (`poseidons_rage_magic_aoe`):**
     - Verificación de activación y consumo de MP ($100 \rightarrow 65$).
     - Verificación de multi-hit en área: 2 enemigos (legionario y arquero) reciben daño simultáneo y quedan atrapados en aturdimiento eléctrico.
     - Verificación de eclosión y absorción de orbe azul con restauración de maná ($65 \rightarrow 85$ MP).
     - Verificación de bloqueo de invocación cuando el maná es insuficiente ($< 35$ MP).
     - 0 errores de consola y determinismo estricto.

---

## 3. Evidencia de Auditoría Independiente

- **Auditor:** Subagente independiente `01acf36e-053e-4f48-b4d9-de32dea2e091` (solo lectura).
- **Veredicto:** **APROBADO**.
- **Resultados cuantitativos y verificación:**
  - Configuración centralizada en `CONFIG.player.magic.poseidonsRage` (coste 35 MP, fases de 8, 40 y 12 ticks, radio 90 px, pulsos multi-hit cada 8 ticks de 8 de daño) y `CONFIG.economy.orbs.blueOrbMana: 20`.
  - Módulo puro `src/sim/magic.ts` desacoplado de Phaser. Super-armadura e invulnerabilidad durante casteo garantizados (`invulTicks = 60`).
  - Bloqueo estricto por maná insuficiente ($mp < 35$).
  - Orbes azules implementados con cinemática balística, atracción magnética y absorción sumando $+20$ MP hasta `maxMp` (100).
  - HUD actualizado con barra azul de maná bajo la barra verde en $x=16, y=26$ y métricas reactivas.
  - Efectos visuales de relámpagos procedimentales celestes y blancos con tinte cian en enemigos electrocutados.
  - `pnpm exec tsc --noEmit && pnpm build`: salida código 0 en 5.81s, 0 fugas en `dist/`.
  - Chrome CDP (`capture-combat.mjs`): 17/17 casos aprobados (Casos A a Q), determinismo estricto y 0 errores de consola.
  - Caso Q verificado: $t=1$ $MP=100$, $t=2$ consumo $MP=65$, $t=10$ tormenta activa, $t=43$ 5 impactos AoE con legionario en 20 HP y arquero derrotado, $t=64$ absorción orbe azul $MP=85$, $t=70$ bloqueo por maná insuficiente $MP=20$.
  - Artefactos visuales: `poseidons_rage_magic_aoe_mosaic.png` y `poseidons_rage_magic_aoe.gif`.
