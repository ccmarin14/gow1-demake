# Plan de implementación — `GOW1-COMBOS-EXT-01` (Nivel 4: Combos Extendidos y Agarre Aéreo de *God of War 1* PS2)

- **Fecha:** 2026-10-22
- **Estado:** **APROBADO** (Implementada la cadena extendida de 4 golpes `J, J, J, J`, el remate *Spirit of Hercules* `J, J, J, K`, el agarre/azote aéreo *Orion's Harpoon* `L` en el aire y el ataque en carrera/salida de esquiva *Olympic Slash*; auditado y aprobado por agente independiente de solo lectura `01acf36e-053e-4f48-b4d9-de32dea2e091`).
- **Decisiones asociadas:** `D-03`, `D-04`, `D-20`, `D-21`, `D-24` ([`docs/decisiones.md`](../decisiones.md)).
- **Objetivo del plan:** Integrar los combos extendidos insignia de *God of War* 1 (PS2) adaptados al plano lateral 2D: la cadena extendida de 4 golpes (`J, J, J, J`), el remate *Spirit of Hercules* (`J, J, J, K`), el agarre y azotamiento aéreo *Orion's Harpoon* (`L` en el aire contra enemigos suspendidos) y el ataque en carrera/salida de rodada *Olympic Slash* (`Shift -> J`).

---

## 1. Justificación y Alcance (Nivel 4 del Roadmap)

En la retroalimentación de la usuaria se indicó:
> *"Los ataques aun deben ser pulidos, faltan combos y algunos ataques aun no se sienten bien [...] vamos por muy buen camino, pero podemos pulir un poco más, no es ajuste fino pero si mejoras que aporten a la jugabilidad y al aspecto."*

Con el modelo maestro pixel-art esculpido (Nivel 1), el peso de locomoción y derrape (Nivel 2) y el avance corporal kinestésico (Nivel 3) ya completados y aprobados, este Nivel 4 amplía el repertorio de combate con las técnicas insignia de PS2:

### Nuevos Movimientos y Combos Incorporados:

1. **Cadena ligera extendida y *Spirit of Hercules*:**
   - **`light_4` (`J, J, J, J`):** Cuarto tajo rápido encadenado con látigo de 98 px de alcance, alternando al brazo opuesto y avanzando con `lungeVx: 60`.
   - **`spirit_of_hercules` (`J, J, J, K`):** Remate pesado tras 3 tajos ligeros. Kratos realiza un barrido doble horizontal de 105 px con ambas cadenas, infligiendo `knockbackVx: 220`, `hitstop: 4` y levantando a los enemigos hacia atrás con impacto contra el suelo (`groundImpact: true`).
2. **Agarre y azotamiento aéreo (*Orion's Harpoon* — `L` en el aire):**
   - En el aire, pulsar `L` (`grab`) lanza la cadena hacia el enemigo aéreo cercano (hasta 120 px).
   - Al impactar, engancha al objetivo, interrumpe su caída y lo azota violentamente contra el entablado de la cubierta (`vy = 480 px/s`), generando un impacto contra el suelo (`groundImpactTicks: 10`, `shakePx: 2`).
3. **Ataque tras esquiva / carrera (*Olympic Slash* — `Shift` $\rightarrow$ `J`):**
   - Atacar durante la ventana de salida de la rodada (`recovery` de la rodada cuando expira la invulnerabilidad) o al correr a velocidad máxima ejecuta un tajo bajo rasante con inercia hacia adelante (`lungeVx: 110`, radio 88 px), ideal para castigar tras esquivar un ataque enemigo.

---

## 2. Invariantes Técnicas Protegidas

- **Determinismo y checksums:** Integración en `src/sim/attack.ts` con ramas deterministas puras sobre enteros y ticks.
- **Buffer de entrada y cancelaciones:** El buffer de 4 ticks absorbe `J`, `K` y `L` durante *hitstop* y transiciones para que los nuevos combos enlacen con fluidez orgánica.
- **Continuidad de arma en `WeaponLayer`:** Cero cuadros con arma invisible durante cancelaciones o recuperaciones intermedias.
- **Compilación limpia:** `pnpm exec tsc --noEmit && pnpm build` exit 0, ausencia de `__GOW8B` en producción.

---

## 3. Plan de Verificación y Evidencias

1. **Verificación en Navegador con Chrome CDP (`capture-combat.mjs`):**
   - Caso F: Ejecución de la cadena extendida `J, J, J, J` y `J, J, J, K` (*Spirit of Hercules*).
   - Caso G: Ejecución de `Ascension` (elevación aérea) seguido inmediatamente de `Orion's Harpoon` (`L` en el aire), azotando al enemigo contra la cubierta.
   - Generación de mosaicos y GIFs en `scripts/verification/output/`.
2. **Pruebas de no regresión:** Verificación de determinismo estricto (`deterministic: true`) y de los casos anteriores A a E.
3. **Auditoría independiente en modo de solo lectura:** Revisión por un subagente auditor independiente.

---

## 4. Resultado de Auditoría Independiente

- **Fecha:** 2026-10-22
- **Auditor:** Subagente independiente de solo lectura `01acf36e-053e-4f48-b4d9-de32dea2e091`.
- **Dictamen:** **APROBADO** (Todas las comprobaciones superadas con éxito).
  - **Repertorio ampliado:** `light_4`, `spirit_of_hercules`, `air_grab` (*Orion's Harpoon*) y `dash_attack` (*Olympic Slash*) configurados en `src/config.ts`, tipados en `src/sim/types.ts` y enlazados en `src/sim/attack.ts`.
  - **Cancelación de rodada:** Salida ágil de esquiva en `src/sim/world.ts` durante la ventana de recuperación sin invulnerabilidad (`invulTicks === 0`).
  - **Determinismo estricto:** `deterministic: true` confirmado en todas las suites.
  - **No regresión física:** Salto simple `69.056 px`, doble salto `138.111 px`, rodada `82.33 px` en 19 ticks con 13 ticks de invulnerabilidad. Casos A, B, C, D y E confirmados sin degradación.
  - **Casos nuevos en vivo (Chrome CDP):**
    - Caso F (`combo_jjjj`): Cuarto golpe ligero `light_4` ejecutado y observado en fase activa en $t=37$.
    - Caso G (`ascension_air_harpoon`): Elevación con *Ascension* y agarre/azote aéreo *Orion's Harpoon* ejecutado con éxito en $t=27$.
  - **Calidad de consola y build:** `pnpm exec tsc --noEmit && pnpm build` exit 0 en 6.81s, `__GOW8B` ausente en `dist/`, 0 errores y 0 advertencias de consola.
