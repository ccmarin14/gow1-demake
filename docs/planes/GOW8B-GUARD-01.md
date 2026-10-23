# Plan de implementación — `GOW8B-GUARD-01` (Bloqueo y Parry con las Cuchillas del Caos)

- **Fecha:** 2026-10-22
- **Estado:** **APROBADO** (Completada y auditada independientemente el 2026-10-22; Bloque 3 al 100 %).
- **Decisiones asociadas:** `D-03`, `D-19` (H-1), `D-20`, `D-24` ([`docs/decisiones.md`](../decisiones.md)).
- **Objetivo:** Implementar el sistema de bloqueo terrestre y desvío temporal (*Parry*) de *God of War 1* (PS2) adaptado a 2D: tecla de guardia (`Q`), reducción/absorción de daño frontal, ventana de parry de 6 ticks (100 ms) al inicio de la guardia, y cancelación ágil hacia rodada o contrataque.

---

## 1. Alcance y Criterios de Aceptación

1. **Acción y entrada determinista:**
   - Registro de acción `guard` en `src/sim/types.ts` mapeada a la tecla `Q` (`KeyQ`) en `InputManager` de `src/scene/ShellScene.ts`.
   - Soporte para mantener presionado (`held`) para sostener la guardia terrestre.
2. **Estado en `EntityState`:**
   - Nuevos campos en `EntityState`:
     - `guardPhase: 'none' | 'startup' | 'active' | 'recovery'`
     - `guardTicks: number`
     - `parryActive: boolean` (verdadero durante los primeros 6 ticks activos de la guardia, permitiendo la parada perfecta).
3. **Mecánica de simulación pura en `src/sim/guard.ts` y `src/sim/world.ts`:**
   - La guardia solo puede iniciarse en el suelo (`grounded === true`).
   - Bloquea el desplazamiento horizontal (`vx = 0`).
   - Se mantiene activa mientras la tecla `guard` permanezca pulsada.
   - Al soltar la tecla, transiciona a `recovery` de 4 ticks antes de volver a `none`.
   - Cancelación: cualquier pulsación de esquiva (`dodge` / `Shift`) cancela la guardia de forma inmediata hacia rodada.
4. **Presentación visual en Phaser (`src/scene/ShellScene.ts`):**
   - En fase de guardia activa, Kratos adopta postura defensiva compacta.
   - Cadenas y Cuchillas del Caos orientadas protegiendo el pecho frontal.
5. **No regresión de combate y determinismo:**
   - Preservación estricta de `deterministic: true` y todos los checksums de simulación.
   - No regresión en saltos, rodada, combo ligero, Pluma de Prometeo, Ascensión ni agarres.
   - `tsc --noEmit && pnpm build` exit 0, ausencia de `__GOW8B` en producción.
6. **Auditoría independiente en modo de solo lectura:**
   - Auditor independiente distinto del implementador evaluando todos los criterios.

---

## 2. Evidencia de Auditoría Independiente

- **Auditor:** Subagente independiente `01acf36e-053e-4f48-b4d9-de32dea2e091` (solo lectura).
- **Veredicto:** **APROBADO**.
- **Resultados de ejecución:**
  - `pnpm exec tsc --noEmit && pnpm build` código de salida 0 en 5.62s.
  - Verificación `grep -rn "__GOW8B" dist/` código de salida 1 (0 fugas).
  - `scripts/verification/capture-combat.mjs`: `deterministic: true`, no regresión en Casos A a G.
  - Caso H (`guard_parry_window`): startup 2 ticks, parry activo 6 ticks ($t=3..8$), recuperación 4 ticks, 0 violaciones cinemáticas ($v_x = 0$).
  - Caso I (`guard_cancel_actions`): cancelación inmediata por rodada y por contrataque.
  - 0 errores de consola en Chrome headless.
