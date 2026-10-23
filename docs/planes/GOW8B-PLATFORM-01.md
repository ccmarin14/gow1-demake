# Plan de implementación — `GOW8B-PLATFORM-01` (Plataformeo del Nivel: Geometría Real, Verticalidad y Mástiles)

- **Fecha:** 2026-10-23
- **Estado:** **APROBADO** (Completada y auditada independientemente el 2026-10-23).
- **Decisiones asociadas:** `D-03` (Lore y estética naval de God of War 1), `D-06` (roles orquestador / implementador / auditor), `D-12` (lienzo 480×270 a 60 Hz), `D-20` (verticalidad y saltos entre niveles inspirados en Betrayal).
- **Objetivo:** Implementar la geometría vertical y el plataformeo real sobre el mapa del nivel 1 ($1440\text{ px}$). En el Mar Egeo canónico, Kratos recorre no solo el entablado de la cubierta inferior, sino también cajas de suministros, pasarelas de madera elevadas y vigas de mástiles navales con jarcias. El sistema debe permitir el ascenso vertical mediante salto simple y doble salto (`GOW8B-DJUMP-01`), plataformas atravesables desde abajo (*one-way*), descenso voluntario (*drop-through*) al pulsar abajo + salto, y el posicionamiento elevado de amenazas a distancia (arqueros sobre vigas de vigía) con colisión física de cadenas contra las superficies elevadas.

---

## 1. Alcance y Especificación Funcional

1. **Geometría de Plataformas en el Nivel 1 (`src/config.ts`):**
   - Configuración `CONFIG.map.level1.platforms`:
     - **Cubierta base continua:** $\{ x_1: 0, x_2: 1440, yTop: 262 \}$.
     - **Caja de pertrechos de Popa (Segmento 1):** $\{ x_1: 200, x_2: 290, yTop: 226 \}$ (elevación de $36\text{ px}$, accesible con salto simple).
     - **Viga inferior del mástil de Proa (Segmento 3):** $\{ x_1: 1040, x_2: 1180, yTop: 200 \}$ (elevación de $62\text{ px}$, accesible con salto simple pleno).
     - **Viga superior del nido de cuervos (Segmento 3):** $\{ x_1: 1100, x_2: 1240, yTop: 138 \}$ (elevación de $124\text{ px}$, requiere doble salto; posición de hostigamiento para arquero).
     - **Castillo elevado de Proa (Segmento 3):** $\{ x_1: 1310, x_2: 1440, yTop: 218 \}$ (antesala elevada del mascarón de proa).

2. **Física de Plataformas y Descenso Voluntario (*Drop-Through*):**
   - **Plataformas unidireccionales (*One-Way*):** las plataformas elevadas ($yTop < 262$) son atravesables desde abajo cuando Kratos asciende ($v_y < 0$), y sólidas solo al caer sobre ellas ($v_y \ge 0$) cuando los pies cruzan su superficie superior.
   - **Descenso voluntario (*Drop-Through*):**
     - Si Kratos está posado sobre una plataforma elevada ($yTop < 262$) e ingresa la combinación de descenso (acción `move-down` o mantener abajo junto con `jump` o tecla abajo pulsada dos veces/búfer):
     - Activa `dropThroughTicks = 14`, ignorando la colisión de la plataforma actual para descender suavemente hacia la cubierta inferior.
   - **Colisión de Cuchillas del Caos:**
     - La función `groundYBelow` detecta la plataforma más alta bajo Kratos, permitiendo que remates sísmicos (*Plume of Prometheus*) impacten contra la madera de vigas elevadas con onda sísmica y partículas en el `yTop` local.

3. **Presentación Visual Naval (`src/scene/ShellScene.ts`):**
   - Renderizado pixel-art de las estructuras de madera:
     - Plataforma de pertrechos: textura de cajas de madera y cuerdas náuticas.
     - Vigas de mástiles: travesaños de pino griego con abrazaderas de bronce, puntales diagonales y cabos que conectan con la cubierta.
     - Castillo de proa: entablado elevado con baranda biselada.
   - Coherencia de profundidad y renderizado sin parpadeos.

4. **Escenario y Verificación Automatizada en Chrome CDP (`scripts/verification/capture-combat.mjs`):**
   - **Caso S (`platforming_verticality_and_drop`):**
     - Kratos realiza salto simple hacia la caja de Popa ($yTop = 226$). Aterrizaje firme verificado.
     - Descenso voluntario (*drop-through*) desde la caja hacia la cubierta principal ($y = 262$).
     - En Proa, doble salto coordinado para alcanzar la viga superior del mástil ($yTop = 138$).
     - Combate sobre la viga: remate con impacto de cadenas en $yTop = 138$ y derribo de arquero apostado.
     - 0 errores de consola, determinismo estricto.

---

## 3. Evidencia de Auditoría Independiente

- **Auditor:** Subagente independiente `01acf36e-053e-4f48-b4d9-de32dea2e091` (solo lectura).
- **Veredicto:** **APROBADO**.
- **Resultados cuantitativos y verificación:**
  - Configuración centralizada de las 5 plataformas canónicas de la nave en `CONFIG.map.level1.platforms` (cubierta continua $y=262$, caja de Popa $y=226$, viga inferior $y=200$, nido de cuervos $y=138$ y castillo de proa $y=218$).
  - Física de plataformas unidireccionales (*one-way*) verificada: Kratos las atraviesa en ascenso ($v_y < 0$) y se posa firmemente al caer ($v_y \ge 0$).
  - Descenso voluntario (*drop-through*) implementado mediante `move-down` + `jump` (`dropThroughTicks = 14`, $v_y = 60\text{ px/s}$), retornando fluidamente a la cubierta principal.
  - Combate vertical: `groundYBelow` detecta la plataforma más alta, produciendo ondas y temblor sísmico local en $yTop = 138$ sobre la viga. Derrota del arquero elevado en el nido de cuervos comprobada.
  - Presentación visual naval: cajas de pertrechos con sogas, fuste de mástil vertical con abrazaderas de bronce y jarcias, y mamparo de proa.
  - `pnpm exec tsc --noEmit && pnpm build`: salida código 0 en 5.67s, 0 fugas en `dist/`.
  - Chrome CDP (`capture-combat.mjs`): 19/19 casos aprobados (Casos A a S), determinismo estricto y 0 errores de consola.
  - Caso S verificado: $t=39$ aterrizaje caja de Popa ($y=226$), $t=41$ drop-through voluntario ($dropThroughTicks=14$), $t=53$ aterrizaje en cubierta ($y=262$), $t=108$ aterrizaje nido de cuervos ($y=138$), $t=135$ derrota de arquero elevado ($HP=0$), $t=143$ remate sísmico en superficie elevada ($groundImpactY=138$).
  - Artefactos visuales: `platforming_verticality_and_drop_mosaic.png` y `platforming_verticality_and_drop.gif`.
