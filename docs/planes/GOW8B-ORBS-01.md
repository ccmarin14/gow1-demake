# Plan de implementación — `GOW8B-ORBS-01` (Orbes Rojos y Verdes: Economía y Recuperación de Combate)

- **Fecha:** 2026-10-22
- **Estado:** **APROBADO** (Completada y auditada independientemente el 2026-10-22; Bloque 4 al 100 %).
- **Decisiones asociadas:** `D-03` (Lore y combate GoW 1 PS2), `D-04` (recursos propios originales), `D-06` (roles orquestador / implementador / auditor), `D-12` (lienzo 480×270), `D-19` (H-3: economía de orbes), `D-24` (combate 2D).
- **Objetivo:** Implementar el sistema canónico de orbes de combate de *God of War 1* (PS2) adaptado a 2D: orbes verdes de restauración de salud y orbes rojos de experiencia/economía desprendidos al derrotar esbirros (o conectar combos), física de dispersión balística inicial con atracción magnética fluida hacia Kratos, absorción en el cuerpo del héroe y visualización en el HUD.

---

## 1. Alcance y Criterios de Aceptación

1. **Modelo de Simulación Pura (`src/sim/types.ts` y `src/sim/orbs.ts`):**
   - Entidad u objeto de orbe en la simulación:
     - `OrbState`: `{ id: number, type: 'red' | 'green', x: number, y: number, vx: number, vy: number, value: number, ageTicks: number, absorbed: boolean }`
   - Campo en `EntityState` de Kratos:
     - `redOrbs: number` (saldo acumulado de orbes rojos).
   - En `src/config.ts`:
     - `CONFIG.economy.orbs`:
       - `greenOrbHeal: 15` (puntos de salud restaurados por orbe verde).
       - `redOrbValue: 5` (experiencia por orbe rojo básico).
       - `dropPerLegionnaire: { red: 4, green: 1 }` (al morir un Legionario No-Muerto).
       - `magnetRadius: 180` px (radio a partir del cual el orbe es atraído gravitatoriamente hacia Kratos).
       - `magnetSpeed: 320` px/s (velocidad de aproximación magnética).
       - `burstImpulseVy: -110` px/s (impulso de eclosión hacia arriba al nacer).
   - Lógica de absorción:
     - Al acercarse a menos de $12\text{ px}$ de Kratos, el orbe se absorbe:
       - Si es verde: `player.hp = Math.min(player.maxHp, player.hp + orb.value)`.
       - Si es rojo: `player.redOrbs += orb.value`.
2. **Presentación Visual y Partículas en Phaser (`src/ui/HudLayer.ts` y `src/scene/ShellScene.ts`):**
   - **Renderizado de orbes flotantes:**
     - Orbes verdes: esferas luminosas verde esmeralda brillante (`#22c55e`) con aura de luz suave (`#86efac`).
     - Orbes rojos: esferas luminosas carmesí brillante (`#ef4444`) con núcleo incandescente (`#fca5a5`).
     - Efecto de estela / flotación con aceleración suave hacia el pecho de Kratos.
     - Pequeño destello (*sparkle*) al momento de la absorción.
   - **Contador de orbes en el HUD (`src/ui/HudLayer.ts`):**
     - Icono de orbe rojo esculpido bajo la barra de salud ($x=26, y=21$).
     - Contador numérico pixel-art `ORBES: <redOrbs>` en tipografía monospace nítida.
     - Animación reactiva: el contador o la barra de vida parpadean levemente al recibir orbes.
3. **Verificación Automatizada con Chrome CDP (`capture-combat.mjs`):**
   - Nuevo Caso M (`orbs_economy_and_healing`):
     - Legionario No-Muerto derrotado en combate.
     - Eclosión de orbes observada en la posición de muerte ($x=240, y=262$).
     - Desplazamiento y atracción magnética hacia Kratos ($x=190$).
     - Absorción del orbe verde: Kratos recupera vida dañada (ej. $88 \rightarrow 100$).
     - Absorción de los orbes rojos: `player.redOrbs` se incrementa en el valor acumulado (ej. $+20$).
     - Verificación del HUD reflejando tanto la vida curada como el contador de orbes rojos.
   - Determinismo estricto verificado (`deterministic: true`).
   - 0 errores de consola en Chrome headless.
   - `tsc --noEmit && pnpm build` con código 0 y 0 fugas de `__GOW8B` en producción.

---

## 2. Asignación de Roles (AGENTS.md)

- **Orquestador (agente principal):** Redacta el plan, define los criterios, coordina subagentes y contrasta evidencia.
- **Implementador (subagente):** Implementa tipos, configuración, `src/sim/orbs.ts`, integración en `world.ts`, renderizado visual en `ShellScene.ts` y `HudLayer.ts`, y Caso M en `capture-combat.mjs`.
- **Auditor Independiente (subagente distinto):** Verifica en modo de solo lectura el sistema de orbes, física de atracción, curación en barra de vida, incremento de orbes en HUD, determinismo y no regresión.

---

## 3. Evidencia de Auditoría Independiente

- **Auditor:** Subagente independiente `01acf36e-053e-4f48-b4d9-de32dea2e091` (solo lectura).
- **Veredicto:** **APROBADO**.
- **Resultados de ejecución:**
  - `pnpm exec tsc --noEmit && pnpm build` ejecutado con éxito (código de salida 0 en 5.86s).
  - 0 fugas de `__GOW8B` en `dist/`.
  - Módulo puro `src/sim/orbs.ts` verificado: eclosión en abanico determinista, atracción gravitatoria hacia el pecho de Kratos (`y - 28`), radio de captura $\le 12\text{ px}$.
  - Renderizado en `ShellScene.ts` y `HudLayer.ts` verificado con doble capa luminosa y contador numérico `ORBES: <redOrbs>`.
  - Verificación CDP en `scripts/verification/capture-combat.mjs`:
    - `deterministic: true` verificado.
    - No regresión en Casos A a L.
    - **Caso M (`orbs_economy_and_healing`) verificado:**
      - Daño previo: $100 \rightarrow 88\text{ HP}$.
      - Muerte del legionario: 5 orbes generados (4 rojos, 1 verde).
      - Vuelo magnético y absorción: vida restaurada a $100\text{ HP}$, saldo de orbes rojos incrementado a $20$, reflejado en HUD.
  - 0 errores de consola en Chrome headless.
