# Plan de implementación — `GOW1-LOCO-WEIGHT-01` (Nivel 2: Dinámica de Locomoción, Peso y Derrape de Kratos)

- **Fecha:** 2026-10-22
- **Estado:** **APROBADO** (Implementado con pose de derrape, frenado inercial y compresión de aterrizaje; auditado y aprobado por agente independiente de solo lectura `01acf36e-053e-4f48-b4d9-de32dea2e091`).
- **Decisiones asociadas:** `D-03`, `D-04`, `D-20`, `D-21`, `D-24` ([`docs/decisiones.md`](../decisiones.md)).
- **Objetivo del plan:** Dotar al movimiento y desplazamiento de Kratos de peso físico, inercia y presencia espartana mediante derrapes con frenada en giros bruscos (*skid / turnaround*), inclinación de arranque (*startup lean*) y absorción elástica de impacto en aterrizajes (*landing squash*).

---

## 1. Justificación y Alcance (Nivel 2 del Roadmap)

En la retroalimentación de la usuaria se señaló:
> *"pasa igual con el personaje, aunque su movilidad mejoro mucho, aun se siente raro, no hay giros y no se siente mucho el peso de movimiento o ataque."*

Actualmente, Kratos invierte su orientación (`facing`) instantáneamente en un solo tick al pulsar la dirección contraria, sin que sus pies o su cuerpo registren la fuerza contraria. Asimismo, los aterrizajes desde grandes saltos no transmiten el impacto de un guerrero de más de 100 kg armado con cadenas de hierro.

### Componentes clave a implementar:

1. **Derrape y giro con frenada (*skid / turnaround*):**
   - **Detección de giro a velocidad:** Si Kratos está en el suelo y se desplaza a velocidad considerable ($|v_x| \ge \text{maxSpeed} \times 0.6 \approx 84\text{ px/s}$) y se introduce una entrada en sentido opuesto (`wantsLeft` cuando $v_x > 0$, o `wantsRight` cuando $v_x < 0$):
   - **Estado `skidTicks`:** Se activa un contador de derrape (5–6 ticks, ~83–100 ms) en `EntityState`.
   - **Dinámica física:** Durante el derrape, la fricción de frenado se incrementa a `brakeSkid = 2200 px/s²` para clavar los talones contra la madera de la cubierta. `facing` **no se invierte en el tick 1**: Kratos mantiene su orientación hacia la inercia del movimiento mientras clava las sandalias.
   - **Pose de derrape espartana:** Se añade el cuadro de derrape a `kratos-run.png` (cuadro 6) en `scripts/gen-kratos-anim.py`: Kratos inclinado hacia atrás (~15° en sentido opuesto al avance), talón clavado al frente, rodilla trasera flexionada absorbiendo inercia, brazos y Cuchillas del Caos tensas abajo/atrás con eslabones tensos.
   - **Salida natural:** Cuando $v_x = 0$ o expira `skidTicks`, Kratos invierte `facing` hacia la nueva dirección y comienza a acelerar de inmediato.

2. **Inclinación de empuje al arrancar (*startup lean*):**
   - Al acelerar desde reposo ($|v_x| < 5$), Kratos adopta durante los primeros 2–3 ticks una postura baja y agresiva de arrancada antes de encadenar el ciclo rítmico de carrera.

3. **Absorción elástica de aterrizaje (*landing squash*):**
   - Cuando Kratos transiciona de aire a tierra (`wasGrounded === false` a `grounded === true`) con velocidad descendente notable ($v_y \ge 180\text{ px/s}$):
   - Se activa `landingTicks = 3` (~50 ms) en la entidad.
   - En `ShellScene.ts`: durante `landingTicks > 0`, se aplica una compresión elástica vertical ($S_y \approx 0.90, S_x \approx 1.06$, con micro-flexión de rodillas manteniendo el anclaje $y=58$ exacto).
   - **Sin bloqueo de controles (Zero Input Lockout):** Si el jugador presiona ataque (`J`/`K`), salto (`Espacio`) o rodada (`Shift`), el aterrizaje se cancela inmediatamente en favor de la acción del jugador.

---

## 2. Invariantes y Regresiones Técnicas Protegidas

- **Paleta y pixel art estricto:** 6 colores oficiales, 0 colores nuevos, 0 antialiasing.
- **Anclaje inferior exacto:** Fila $y=58$ (`f_bbox[3] == 59`) en todos los cuadros del spritesheet.
- **Determinismo y checksums:** Las nuevas variables en `EntityState` inicializadas a `0` preservan la reproducibilidad matemática tick a tick (`deterministic: true`).
- **Respuesta de combate intacta:** La esquiva rodando (`rollSpeed 260`, 82.33 px), los combos de las Cuchillas del Caos y las cancelaciones prioritarias se mantienen idénticos.
- **Build y runtime:** `pnpm exec tsc --noEmit` y `pnpm build` exit 0, ausencia de `__GOW8B` en `dist/`.

---

## 3. Plan de Verificación y Evidencias

1. **Aserciones en Python:** Regeneración de `kratos-run.png` con el cuadro de derrape verificado en tamaño ($97 \times 59\text{ px}$), paleta de 6 colores y anclaje en $y=58$.
2. **Inspección de la Hoja de Contacto:** `docs/referencias/kratos-anim-contact-sheet.png` actualizada mostrando el cuadro de derrape.
3. **Automatización en Navegador con Chrome CDP (`scripts/verification/capture-combat.mjs`):**
   - Caso E: Ejecución de secuencia de carrera continua $\rightarrow$ giro opuesto $\rightarrow$ captura de cuadros del derrape en el `<canvas>`.
   - Secuencia de caída libre desde doble salto $\rightarrow$ impacto contra la cubierta $\rightarrow$ captura del *squash* elástico.
   - Generación de GIF animado y mosaico PNG en `scripts/verification/output/`.
4. **Auditoría independiente en modo de solo lectura:** Un subagente auditor independiente revisará la implementación antes de dar la aprobación.

---

## 4. Resultado de Auditoría Independiente

- **Fecha:** 2026-10-22
- **Auditor:** Subagente independiente de solo lectura `01acf36e-053e-4f48-b4d9-de32dea2e091`.
- **Dictamen:** **APROBADO** (5/5 comprobaciones superadas con éxito).
  - Invariantes de pixel art: `kratos-run.png` con 7 cuadros ($679 \times 59\text{ px}$), 6 colores estrictos, anclaje inferior en $y=58$ (`bbox[3] == 59`). Cuadro 6 con flexión de 53 px de altura.
  - Simulación física determinista: activación de `skidTicks = 6` al invertir marcha con $|v_x| \ge 84\text{ px/s}$, `BRAKE_SKID = 2200 px/s²`, conservación de `facing` hasta frenar o agotar ticks; `landingTicks = 3` al tocar suelo con $v_y \ge 180\text{ px/s}$.
  - Presentación en Phaser: loop de carrera aislado en cuadros 0 a 5, cuadro 6 mostrado durante el derrape, y compresión elástica `(1.06, 0.92)` en aterrizajes con cero bloqueo de control.
  - Verificación en navegador Chrome CDP (`capture-combat.mjs`):
    - Determinismo intacto (`deterministic: true`).
    - Casos A/B/C/D sin regresión.
    - Caso E en vivo: derrape capturado en $t=15, 16, 17$ ($v_x=103 \rightarrow 67 \rightarrow 30$, frame 6); compresión de aterrizaje capturada en $t=79, 80, 81$ (escala `1.06, 0.92`).
    - Consola con 0 errores y build exit 0.
