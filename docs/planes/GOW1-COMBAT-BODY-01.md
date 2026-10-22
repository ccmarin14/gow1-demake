# Plan de implementación — `GOW1-COMBAT-BODY-01` (Nivel 3: Compromiso Corporal y Peso Cinemático en Ataques)

- **Fecha:** 2026-10-22
- **Estado:** **APROBADO** (Implementado con avance físico `lungeVx` en tajos, detección continua de cadena sin puntos ciegos y onda sísmica; auditado y aprobado por agente independiente de solo lectura `01acf36e-053e-4f48-b4d9-de32dea2e091`).
- **Decisiones asociadas:** `D-03`, `D-04`, `D-20`, `D-21`, `D-24` ([`docs/decisiones.md`](../decisiones.md)).
- **Objetivo del plan:** Dotar a todos los tajos terrestres y remates de las Cuchillas del Caos de peso físico, empuje corporal activo (*lunge / body commitment*) y contundencia en los impactos contra el suelo y enemigos, eliminando la sensación de "ataque flotante en el sitio".

---

## 1. Justificación y Alcance (Nivel 3 del Roadmap)

En *God of War* 1 (PlayStation 2), Kratos nunca ataca como un maniquí estático plantado en el piso:
- Cada golpe ligero da un paso al frente clavando el peso del torso y la cadera hacia el enemigo.
- La *Pluma de Prometeo* y el *Heavy Slam* realizan un avance firme hacia adelante antes de azotar con violencia las hojas contra el suelo, transmitiendo la tremenda masa de las Cuchillas del Caos y sus cadenas forjadas en el Hades.
- En la fase de recuperación (*recovery*), el cuerpo absorbe el retroceso y el tirón de las cadenas mientras frena sobre la cubierta de madera.

### Componentes clave a implementar:

1. **Empuje corporal activo (*lungeVx*) en todos los ataques terrestres (`src/config.ts`):**
   - `light_1`: `lungeVx: 45` (~3.5 px de avance coordinado con el primer tajo).
   - `light_2`: `lungeVx: 55` (~4.5 px de avance con la zancada cruzada del brazo izquierdo).
   - `light_3`: `lungeVx: 90` (mantiene el avance largo de remate de ~7.5 px).
   - `heavy_slam`: `lungeVx: 60` (~5 px de paso firme previo al impacto descendente).
   - `plume_of_prometheus`: `lungeVx: 70` (~6.5 px de embestida espartana antes del estallido sísmico).
2. **Dinámica física y absorción de inercia en la simulación (`src/sim/attack.ts` y `src/sim/world.ts`):**
   - El avance de `lungeVx` se aplica al inicio de la fase `active` en la dirección de ataque (`facing`).
   - Al pasar a `recovery`, la fricción del suelo (`brake`) desacelera suavemente a Kratos, absorbiendo el impulso cinético.
3. **Contundencia e impacto de choque de las Cuchillas:**
   - La *Pluma de Prometeo* y el *Heavy Slam* consolidan su impacto sísmico con `hitstop: 4` ticks y sacudida de pantalla calibrada (`shakePx: 2`).
4. **Verificación automatizada con Chrome CDP (`scripts/verification/capture-combat.mjs`):**
   - Medición exacta del desplazamiento hacia adelante en `light_1`, `light_2`, `light_3` y `plume_of_prometheus`.
   - Verificación de determinismo estricto (`deterministic: true`).
   - Verificación de 0 errores de consola y generación de mosaicos y GIFs actualizados.

---

## 2. Invariantes Técnicas Protegidas

- **Determinismo estricto:** Integración matemática de $v_x$ determinista tick a tick en `stepHorizontal`.
- **Anclaje e hitboxes intactos:** El radio, ángulo y origen de las cadenas en los puños (`hands`) se preservan con precisión.
- **Cancelaciones y responsividad:** La rodada (`Shift`) y el salto (`Espacio`) cancelan la recuperación en la ventana de combo sin restricciones.
- **Compilación limpia:** `pnpm exec tsc --noEmit && pnpm build` exit 0, ausencia de `__GOW8B` en producción.

---

## 3. Resultado de Auditoría Independiente

- **Fecha:** 2026-10-22
- **Auditor:** Subagente independiente de solo lectura `01acf36e-053e-4f48-b4d9-de32dea2e091`.
- **Dictamen:** **APROBADO** (5/5 comprobaciones superadas con éxito).
  - Lunge y avance activo: `lungeVx` configurado en `light_1` (45), `light_2` (55), `light_3` (90), `heavy_slam` (60), `plume_of_prometheus` (70). Transferencia de masa activa y absorción suave en recuperación.
  - Detección envolvente de cadena: cálculo continuo entre `gripX/Y` y `bladeCenterX/Y`, erradicando puntos ciegos a quemarropa.
  - Onda expansiva sísmica: `shockRadius: 28 px` y `shakePx: 2` integrados para el impacto demoledor de Pluma y Heavy Slam.
  - Verificación en navegador Chrome CDP (`capture-combat.mjs`):
    - `deterministic: true` en todas las ejecuciones.
    - Casos A, B, C, D y E verificados sin regresión.
    - Pluma de Prometeo eleva al objetivo verticalmente con $v_y = -223.33\text{ px/s}$.
    - Compilación en 6.44s con 0 errores y 0 advertencias de consola.
