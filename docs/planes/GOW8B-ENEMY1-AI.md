# Plan de implementación — `GOW8B-ENEMY1-AI` (Conducta del Combatiente: IA del Legionario No-Muerto)

- **Fecha:** 2026-10-22
- **Estado:** **APROBADO** (Completada y auditada independientemente el 2026-10-22).
- **Decisiones asociadas:** `D-03` (Lore y enemigos de God of War 1 PS2), `D-04` (recursos propios originales), `D-06` (roles orquestador / implementador / auditor), `D-19` (H-1: bloqueo y parry), `D-24` (repertorio de combate 2D).
- **Objetivo:** Implementar la conducta e inteligencia artificial del primer combatiente esbirro de *God of War 1* (el **Legionario No-Muerto**): máquina de estados determinista gobernada por ticks en simulación pura (`idle`, `patrol`, `approach`, `windup` telegraph, `slash`, `recover`, `hitstun`, `juggle`, `death`), interacción física con el repertorio de Kratos (tajos, elevación aérea por Ascensión, azote sísmico de Pluma, agarre, desvío por *Parry*) y sincronización de cuadros con la textura `legionnaire.png` aprobada en `GOW8B-ENEMY1-ART`.

---

## 1. Alcance y Criterios de Aceptación

1. **Campos en `EntityState` y Configuración (`src/sim/types.ts` y `src/config.ts`):**
   - Campo `kind: 'player' | 'legionnaire' | 'dummy'`.
   - Campos de IA en `EntityState`:
     - `aiState: 'idle' | 'patrol' | 'approach' | 'windup' | 'slash' | 'recover' | 'hitstun' | 'juggle' | 'death'`
     - `aiTicks: number`
     - `hp: number`
     - `maxHp: number`
     - `attackCooldownTicks: number`
   - Parámetros en `CONFIG.enemy.legionnaire`:
     - `maxHp: 60`
     - `speed: 65` (px/s en persecución)
     - `aggroRange: 160` (px)
     - `attackRange: 28` (px)
     - `windupTicks: 24` (400 ms: anticipación legible con espada alzada y ojos llameantes)
     - `activeSlashTicks: 8` (133 ms de barrido con hitbox activa)
     - `recoveryTicks: 16` (266 ms de recuperación)
     - `cooldownTicks: 40` (666 ms entre ataques)
     - `slashDamage: 12`
     - `slashReach: 32` (px)
2. **Lógica de Simulación Pura en `src/sim/legionnaire.ts` y `src/sim/world.ts`:**
   - **Persecución (`approach`):** si Kratos está dentro de `aggroRange` (> 28 px), el Legionario avanza hacia Kratos orientando su `facing`.
   - **Anticipación y aviso (`windup`):** al alcanzar `attackRange` ($\le 28\text{ px}$) y cooldown en 0, se detiene ($v_x = 0$) y entra en `windup` durante 24 ticks (400 ms). Si Kratos lo golpea durante el `windup`, la anticipación se interrumpe inmediatamente a `hitstun` (recompensa por iniciativa ofensiva).
   - **Tajo (`slash`):** ejecuta barrido frontal.
     - Si Kratos está en rodada invulnerable (`invulTicks > 0`): el ataque falla.
     - Si Kratos está en ventana de desvío perfecto (`parryActive === true`): **¡DESVÍO PARRY!** El Legionario sufre rechazo de arma, aturdimiento largo (`hitstun` de 32 ticks) y retroceso, dejando una ventana libre para castigo.
     - Si Kratos está en guardia sostenida (`guardPhase === 'active'`): ataque bloqueado, daño absorbido.
   - **Reacción a golpes de Kratos (`hitstun`, `juggle`, `death`):**
     - Daño recibido reduce `hp`.
     - Impacto horizontal aplica retroceso $v_x$ e interrupción a `hitstun`.
     - *Ascension launcher* aplica $v_y < 0$ y transición a `juggle` (suspensión aérea).
     - *Plume of Prometheus* o remate sísmico proyecta contra el suelo y levanta con rebote en `juggle`.
     - Agarre aéreo *Orion's Harpoon* azota contra la cubierta.
     - Al llegar a $\text{hp} \le 0$: entra en estado `death` (colapso de huesos y armadura).
3. **Presentación Visual en Phaser (`src/scene/ShellScene.ts`):**
   - Instanciación y renderizado de sprites con textura `'legionnaire'`.
   - Sincronización exacta de cuadros según `aiState`:
     - `idle` $\rightarrow$ cuadro 0
     - `approach` $\rightarrow$ ciclo alterno de cuadros 1 y 2
     - `windup` $\rightarrow$ cuadro 3 (silueta vertical con destello de ojos)
     - `slash` $\rightarrow$ cuadro 4 (tajo)
     - `hitstun` $\rightarrow$ cuadro 5 (sacudida hacia atrás)
     - `juggle` $\rightarrow$ cuadro 6 (suspensión aérea)
     - `death` $\rightarrow$ cuadro 7 (desmoronamiento en cubierta)
   - Orientación `flipX` basada en `facing`.
4. **Verificación Automatizada con Chrome CDP (`capture-combat.mjs`):**
   - Nuevo Caso J (`legionnaire_combat_ai`):
     - Detección de avance en persecución (`approach`).
     - Telegraph observado en `windup` (cuadro 3).
     - Parada perfecta (*Parry*) con tecla `Q` deflectando al Legionario a `hitstun`.
     - Combo de Kratos elevándolo al aire con Ascensión (`juggle`, cuadro 6).
     - Derrota del Legionario con transición a `death` (cuadro 7).
   - Determinismo estricto verificado (`deterministic: true`).
   - 0 errores de consola en Chrome headless.
   - `tsc --noEmit && pnpm build` con código 0 y 0 fugas de `__GOW8B` en producción.

---

## 2. Asignación de Roles (AGENTS.md)

- **Orquestador (agente principal):** Redacta el plan, define los criterios, coordina subagentes y contrasta evidencia.
- **Implementador (subagente):** Implementa tipos, configuración, `src/sim/legionnaire.ts`, integración en `src/sim/world.ts`, renderizado en `ShellScene.ts` y Caso J en `capture-combat.mjs`.
- **Auditor Independiente (subagente distinto):** Verifica en modo de solo lectura la lógica de IA, los casos de prueba en navegador, determinismo y no regresión.

---

## 3. Evidencia de Auditoría Independiente

- **Auditor:** Subagente independiente `01acf36e-053e-4f48-b4d9-de32dea2e091` (solo lectura).
- **Veredicto:** **APROBADO**.
- **Resultados de ejecución:**
  - `pnpm exec tsc --noEmit && pnpm build` finalizado con éxito (código de salida 0 en 5.87s).
  - 0 fugas de `__GOW8B` en `dist/`.
  - Simulación pura de IA verificada en `src/sim/legionnaire.ts` y `src/sim/world.ts`.
  - Mapeo de sprites verificado en `src/scene/ShellScene.ts` (cuadros 0 a 7 exactos para cada fase).
  - Batería CDP ejecutada con éxito en `scripts/verification/capture-combat.mjs`:
    - `deterministic: true` confirmado en simulación determinista.
    - No regresión en Casos A a I.
    - **Caso J (`legionnaire_combat_ai`) verificado:**
      - Persecución observada en $t=1$.
      - Telegraph de anticipación observado en $t=23$ (cuadro 3).
      - Desvío Parry observado en $t=49$ (aturdimiento de 32 ticks por guardia de Kratos).
      - Elevación aérea por Ascensión en $t=62$ (`juggle`, cuadro 6).
      - Muerte y colapso cadavérico en $t=111$ (`death`, cuadro 7).
  - 0 errores de consola en Chrome headless.
