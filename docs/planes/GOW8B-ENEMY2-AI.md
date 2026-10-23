# Plan de implementación — `GOW8B-ENEMY2-AI` (Conducta y Combate del Arquero No-Muerto)

- **Fecha:** 2026-10-23
- **Estado:** **APROBADO** (Completada y auditada independientemente el 2026-10-23).
- **Decisiones asociadas:** `D-03` (Lore e identidad canónica de God of War 1 PS2), `D-04` (recursos propios originales sin copias externas), `D-06` (roles orquestador / implementador / auditor), `D-12` (lienzo 480×270 a 60 Hz).
- **Objetivo:** Implementar la máquina de estados de IA determinista del **Arquero No-Muerto (Undead Archer)** y el subsistema de proyectiles de flecha. El arquero gestiona activamente la distancia (kiteo/reposicionamiento), telegrafía su disparo con un tensado visualmente claro de 24 ticks (400 ms) con fulgor amatista, dispara proyectiles rectos horizontales, y soporta la cascada completa de interacción defensiva y ofensiva de Kratos: desvío reflectante por *Parry*, mitigación por guardia, evasión por rodada, aturdimiento por Cuchillas del Caos, suspensión aérea (*Ascension*) y desmoronamiento cadavérico con eclosión de orbes.

---

## 1. Alcance y Especificación Funcional

1. **Conducta y Máquina de Estados del Arquero (`src/sim/archer.ts`):**
   - **`idle` / reposo:** si Kratos está más allá de `aggroRange` (260 px), permanece en guardia pasiva ($v_x = 0$, frame 0).
   - **`reposition` / gestión de distancia (kiteo):**
     - Rango de combate preferido: $[110\text{ px} .. 180\text{ px}]$.
     - Si Kratos se aproxima demasiado ($\Delta x < 110\text{ px}$), el arquero retrocede ágilmente a $50\text{ px/s}$ (frames de caminata 1 y 2).
     - Si Kratos se aleja ($\Delta x > 180\text{ px}$), avanza a $40\text{ px/s}$ para mantener línea de tiro.
     - Orientación activa: mira siempre hacia Kratos (`facing = dirToPlayer`).
   - **`aim` / tensado y anticipación (telegraph):**
     - Al estar en rango y haber vencido el enfriamiento de disparo (`attackCooldownTicks === 0`):
     - Entra en `aim` durante 24 ticks (400 ms) a velocidad cero ($v_x = 0$), mostrando el cuadro 3 (`aim`) con el ojo violeta/amatista resplandeciente.
     - **Vulnerabilidad a interrupción:** si Kratos lo golpea durante el tensado con cualquier ataque, el disparo se cancela inmediatamente y el arquero entra en `hitstun`.
   - **`shoot` / suelta del proyectil:**
     - Al tick 24 de tensado, conmuta al cuadro 4 (`shoot`) durante 8 ticks e instancia un proyectil en la simulación:
       - Posición inicial: $(x + \text{facing} \times 16, y - 24)$ (a la altura de la cuerda del arco).
       - Velocidad: $v_x = \text{facing} \times 280\text{ px/s}$, $v_y = 0$ (trayectoria recta horizontal).
   - **`recover` / enfriamiento post-tiro:**
     - Permanece 24 ticks en reposo antes de evaluar nuevamente la distancia o disparar. Enfriamiento entre flechas: 70 ticks (~1.16 s).
   - **Reacciones al daño y control de masas:**
     - **`hitstun`:** aturdimiento por golpe de Cuchillas del Caos (16 ticks, cuadro 5 `hurt`).
     - **`juggle`:** suspensión aérea lanzada por *Ascension* o remate sísmico ($v_y < 0$, cuadro 6 `juggle`). Al aterrizar en una plataforma pasa a aturdimiento terrestre (12 ticks).
     - **`death`:** al llegar a 0 HP, colapsa en la cubierta (cuadro 7 `death`) y libera 3 orbes rojos + 1 orbe verde de forma balística hacia Kratos.

2. **Física e Interacciones de Proyectiles Flecha (`ArrowState`):**
   - Estructura: `{ id, x, y, vx, vy, reflected, ageTicks, active }`.
   - Vida útil: 65 ticks (~1.08 s) o hasta impactar o salir de límites.
   - **Colisión contra Kratos:**
     - **Evasión (rodada / post-daño):** si `invulTicks > 0` o `hurtInvulTicks > 0`, la flecha no produce daño y continúa su curso o se desvanece sin afectar a Kratos.
     - **Desvío perfecto (Parry):** si Kratos activa guardia dentro de su ventana de parry (`parryActive === true`):
       - ¡REFLEJO PARRY! La flecha se refleja en sentido contrario invirtiendo su velocidad ($v_x = -v_x \times 1.5$) con `reflected = true`.
       - Si la flecha reflejada impacta de vuelta al arquero, le causa 20 de daño y aturdimiento largo (`parryStunTicks: 36`).
     - **Guardia activa:** si `guardPhase === 'active'` pero fuera de la ventana de parry, absorbe el impacto con mitigación del 85 % (daño residual de 1–2 HP), la flecha se disipa y Kratos amortigua el impacto sin romper postura.
     - **Impacto directo:** si Kratos está desprotegido, recibe 10 de daño, 14 ticks de hitstun, retroceso horizontal $v_x = \pm 140\text{ px/s}$ y 45 ticks de invulnerabilidad post-daño.

3. **Presentación en Phaser (`src/scene/ShellScene.ts`):**
   - Renderizado del sprite `'archer'` con animación/mapeo de cuadros sincronizado con `aiState`:
     - `idle` / `recover`: cuadro 0.
     - `reposition`: ciclos de paso alternando cuadros 1 y 2.
     - `aim`: cuadro 3 (`aim`).
     - `shoot`: cuadro 4 (`shoot`).
     - `hitstun`: cuadro 5 (`hurt`).
     - `juggle`: cuadro 6 (`juggle`).
     - `death`: cuadro 7 (`death`).
   - Renderizado de flechas activas mediante imágenes/sprites `'arrow'` con orientación `flipX = arrow.vx < 0` centradas en $(x, y)$.

4. **Automatización y Pruebas (Chrome CDP):**
   - Escenario `'archer'` en `src/sim/scenarios.ts` con Kratos y un arquero no-muerto.
   - Caso automatizado Caso N (`archer_combat_ai`) en `scripts/verification/capture-combat.mjs`:
     - Verificación de kiteo y telegrafiado de apuntado (24 ticks).
     - Verificación de disparo y trayectoria del proyectil.
     - Verificación de esquiva con rodada (i-frames sin daño).
     - Verificación de guardia mitigada (daño residual).
     - Verificación de reflejo de proyectil con Parry.
     - Verificación de daño con Cuchillas del Caos, elevación aérea y muerte con eclosión de orbes.

---

## 3. Evidencia de Auditoría Independiente

- **Auditor:** Subagente independiente `01acf36e-053e-4f48-b4d9-de32dea2e091` (solo lectura).
- **Veredicto:** **APROBADO**.
- **Resultados de ejecución y verificación numérica:**
  - Máquina de estados desacoplada en `src/sim/archer.ts`: kiteo ($[110..180]\text{ px}$), tensado telegrafiado `aim` de 24 ticks ($v_x = 0$), interrupción inmediata a `hitstun` ante golpes de Cuchillas del Caos, suelta `shoot` e instanciación de proyectil, y colapso `death` con eclosión de orbes.
  - Subsistema de proyectiles `stepArrows`:
    - Evasión en rodada o i-frames post-daño: la flecha se disipa sin daño.
    - Desvío perfecto por *Parry*: flecha reflejada invirtiendo dirección y acelerando a $420\text{ px/s}$ ($1.5\times$), causando 20 de daño y 36 ticks de aturdimiento (`parryStunTicks`) al impactar de vuelta al agresor.
    - Guardia activa: mitigación del 85% (daño residual de 2 HP) sin romper postura.
    - Impacto directo: 10 de daño, knockback a $140\text{ px/s}$, 14 ticks de hitstun y 45 ticks de i-frames.
  - Sincronización visual en Phaser (`ShellScene.ts`): mapeo de cuadros 0-7, renderizado de proyectiles con flip horizontal y tinte dorado `#ffea00` en proyectiles reflejados.
  - `pnpm exec tsc --noEmit && pnpm build`: salida código 0 en 5.77s, 0 fugas en `dist/`.
  - Chrome CDP (`capture-combat.mjs`): 14/14 casos aprobados (Casos A a N), determinismo estricto (`deterministic: true`), 0 errores de consola.
  - Caso N verificado: $t=15$ `aim` $v_x=0$, $t=25$ `shoot` $v_x=-280$, $t=48$ reflejo Parry $v_x=+420$ y Kratos 100 HP, $t=68$ impacto en arquero 20 HP, $t=76$ muerte y eclosión de 4 orbes (3 rojos, 1 verde), $t=120$ absorción y saldo de 15 orbes.
  - Artefactos visuales: `archer_combat_ai_mosaic.png` y `archer_combat_ai.gif`.
