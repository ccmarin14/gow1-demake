# Plan de implementación — `GOW8B-DAMAGE-01` (Vida y Respuesta al Daño del Jugador)

- **Fecha:** 2026-10-22
- **Estado:** **APROBADO** (Completada y auditada independientemente el 2026-10-22).
- **Decisiones asociadas:** `D-03` (Lore y combate GoW 1 PS2), `D-06` (roles orquestador / implementador / auditor), `D-19` (H-1: bloqueo y parry), `D-24` (combate 2D).
- **Objetivo:** Implementar el sistema integral de salud, mitigación y respuesta al daño de Kratos: deducción de vida, interrupción de ataques, retroceso direccional (*knockback*), ventana de invulnerabilidad post-daño (*hurt i-frames* con parpadeo), absorción en guardia, inmunidad en *Parry* y rodada, y estado terminal de derrota a 0 HP con reinicio rápido (`R`).

---

## 1. Alcance y Criterios de Aceptación

1. **Campos en `EntityState` y Configuración (`src/sim/types.ts` y `src/config.ts`):**
   - En `EntityState`:
     - `hurtInvulTicks: number` (ticks restantes de invulnerabilidad post-daño).
     - `isDead: boolean` (verdadero si $\text{hp} \le 0$).
   - En `CONFIG.player.damage`:
     - `maxHp: 100`
     - `hurtHitstunTicks: 14` (233 ms de retroceso y dolor).
     - `hurtInvulTicks: 45` (750 ms de protección post-impacto para evitar muerte instantánea por stun-lock).
     - `knockbackVx: 140` (velocidad horizontal de retroceso al recibir impacto directo).
     - `guardMitigationRatio: 0.85` (la guardia estándar absorbe el 85 % del daño; el desvío *Parry* absorbe el 100 %).
2. **Lógica de Daño en Simulación Pura (`src/sim/damage.ts` y `src/sim/world.ts`):**
   - Función pura de resolución de impacto al jugador:
     - Si Kratos está en rodada invulnerable (`invulTicks > 0`) o en ventana de invulnerabilidad post-daño (`hurtInvulTicks > 0`): el ataque falla limpiamente y no causa daño.
     - Si Kratos está en ventana de desvío perfecto (`parryActive === true`): daño **0**, retroceso **0**, el Legionario es repelido y Kratos queda libre para castigar.
     - Si Kratos está en guardia activa (`guardPhase === 'active'`): daño mitigado en un 85 % (recibe solo daño residual menor), sin interrupción de estado y con retroceso amortiguado ($v_x = \text{facing} \times -30$).
     - Si Kratos está desprotegido:
       - Recibe el 100 % del daño del atacante (`hp = Math.max(0, hp - damage)`).
       - Interrumpe cualquier ataque o acción en curso.
       - Activa `hitstunTicks = CONFIG.player.damage.hurtHitstunTicks`.
       - Activa `hurtInvulTicks = CONFIG.player.damage.hurtInvulTicks`.
       - Recibe retroceso horizontal opuesto al atacante ($v_x = \text{sourceX} < \text{playerX} ? 140 : -140$).
       - Si $\text{hp} === 0$: marca `isDead = true`, detiene la locomoción y activa el estado de derrota.
   - Acción de reinicio rápido (`restart` / tecla `R`): restaura la salud a 100, restablece las entidades del escenario y permite reintentar el combate de inmediato.
3. **Presentación Visual en Phaser (`src/scene/ShellScene.ts`):**
   - Impacto directo: tinte rojizo en Kratos (`0xff5555`) durante el hitstun y micro-sacudida de pantalla (`shakePx: 2`).
   - Invulnerabilidad post-daño: parpadeo visual del sprite (alternancia de alfa/visibilidad) mientras `hurtInvulTicks > 0`.
   - Estado de derrota: cuando `isDead === true`, Kratos detiene sus cadenas, se muestra texto en pantalla de `DERROTA - PULSA R PARA REINTENTAR`.
4. **Verificación Automatizada con Chrome CDP (`capture-combat.mjs`):**
   - Nuevo Caso K (`player_damage_and_defeat`):
     - Ataque del Legionario a Kratos desprotegido: vida disminuye de $100 \rightarrow 88$, entra en `hitstun`, recibe retroceso y activa `hurtInvulTicks = 45`.
     - Ataque durante `hurtInvulTicks`: daño ignorado (la vida se mantiene en 88).
     - Ataque durante guardia: daño mitigado (recibe solo daño residual).
     - Múltiples impactos hasta $\text{hp} = 0$: transición a `isDead = true` y confirmación de estado de derrota.
     - Pulsación de tecla `R`: resurrección y reseteo de vida a 100.
   - Determinismo estricto verificado (`deterministic: true`).
   - 0 errores de consola en Chrome headless.
   - `tsc --noEmit && pnpm build` con código 0 y 0 fugas de `__GOW8B` en producción.

---

## 2. Asignación de Roles (AGENTS.md)

- **Orquestador (agente principal):** Redacta el plan, define los criterios, coordina subagentes y contrasta evidencia.
- **Implementador (subagente):** Implementa tipos, configuración, `src/sim/damage.ts`, integración en `world.ts`, efectos en `ShellScene.ts` y Caso K en `capture-combat.mjs`.
- **Auditor Independiente (subagente distinto):** Verifica en modo de solo lectura el sistema de daño, mitigación en guardia, invulnerabilidad post-daño, derrota/reinicio y no regresión.

---

## 3. Evidencia de Auditoría Independiente

- **Auditor:** Subagente independiente `01acf36e-053e-4f48-b4d9-de32dea2e091` (solo lectura).
- **Veredicto:** **APROBADO**.
- **Resultados de ejecución:**
  - `pnpm exec tsc --noEmit && pnpm build` finalizado con éxito (código de salida 0 en 5.96s).
  - 0 fugas de `__GOW8B` en `dist/`.
  - Módulo de daño puro verificado en `src/sim/damage.ts`.
  - Mapeo de control verificado: tecla `R` vinculada a `'restart'`.
  - Presentación visual en `ShellScene.ts` y `WeaponLayer.ts`: tinte rojizo `0xff5555`, parpadeo de alfa durante `hurtInvulTicks`, ocultamiento de armas y cadenas en derrota, y cartel de derrota en pantalla.
  - Verificación CDP en `scripts/verification/capture-combat.mjs`:
    - `deterministic: true` verificado.
    - No regresión en Casos A a J.
    - **Caso K (`player_damage_and_defeat`) verificado:**
      - Impacto desprotegido ($t=49$): $100 \rightarrow 88\text{ HP}$, `hitstun = 14`, `hurtInvul = 45`, $v_x = -140$.
      - Evasión por i-frames post-impacto ($t=55$): $88\text{ HP}$ intactos.
      - Mitigación por guardia activa ($t=100$): absorción del 85 %, daño residual de 2 HP ($88 \rightarrow 86$), postura de guardia conservada.
      - Estado de derrota ($t=111$): $\text{hp} = 0$, `isDead = true`, controles bloqueados y texto de derrota visible.
      - Reinicio instantáneo ($t=121$): $\text{hp} = 100$, resurrección completa y controles activos.
  - 0 errores de consola en Chrome headless.
