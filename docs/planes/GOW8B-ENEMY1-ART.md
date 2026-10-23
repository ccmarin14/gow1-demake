# Plan de implementación — `GOW8B-ENEMY1-ART` (Arte del Primer Esbirro: Legionario No-Muerto)

- **Fecha:** 2026-10-22
- **Estado:** **APROBADO** (Completada y auditada independientemente el 2026-10-22).
- **Decisiones asociadas:** `D-03` (Lore e identidad de God of War 1 PS2), `D-04` (recursos propios originales), `D-06` (roles orquestador / implementador / auditor), `D-12` (lienzo 480×270).
- **Objetivo:** Crear el conjunto de sprites en pixel art del primer enemigo canónico del Mar Egeo de *God of War 1*: el **Legionario No-Muerto (Undead Legionnaire)** de Ares. El enemigo debe ser claramente identificable, diferenciado de Kratos en silueta, altura y cromática, y contar con las posturas necesarias para alimentar la IA de combate del Bloque 4.

---

## 1. Alcance y Especificación Visual

1. **Identidad Canónica (GoW 1 PS2 en 2D):**
   - Guerrero esquelético resucitado por Ares: calavera con yelmo griego de bronce corrompido, cuencas oculares con brillo carmesí/ígneo (`#ff3020`), caja torácica expuesta, faldón andrajoso rojo sangre (`#9a2020`), espinilleras de bronce y espada curva/falcata oxidada (`#805038`).
   - Escala: altura aproximada de 46–50 px (más bajo y esbelto que Kratos, cuya altura es 56–59 px), permitiendo una jerarquía visual clara.
2. **Rejilla y Hoja de Sprites (`public/assets/characters/legionnaire.png`):**
   - Rejilla fija: cada fotograma mide exactamente **64×54 px** con canal alfa binario (cero antialiasing espurio).
   - Anclaje inferior estricto: la base de los pies coincide exactamente con la fila inferior $y = 53$ (`bbox[3] == 54`), garantizando apoyo sólido sobre la cubierta sin flotación ni hundimiento.
   - Poses esenciales (8 fotogramas secuenciales en una hoja horizontal de $512 \times 54\text{ px}$):
     - **Cuadro 0 (`idle`):** Guardia encorvada amenazante con la espada inclinada al frente.
     - **Cuadro 1 (`walk_1`):** Paso de avance con zancada y espada lista.
     - **Cuadro 2 (`walk_2`):** Paso alterno con inercia hacia adelante.
     - **Cuadro 3 (`windup` / anticipación):** Espada levantada hacia atrás/arriba con silueta abierta y destello en los ojos (telegraph claro para que el jugador pueda reaccionar, bloquear o esquivar).
     - **Cuadro 4 (`attack` / tajo):** Barrido descendente agresivo de la hoja al frente.
     - **Cuadro 5 (`hurt` / impacto):** Torso y cabeza sacudidos hacia atrás por el impacto de las Cuchillas del Caos.
     - **Cuadro 6 (`airborne` / suspensión aérea):** Esqueleto volteado/desarticulado en el aire (reacción a *Ascension* o remate sísmico).
     - **Cuadro 7 (`death` / desmoronamiento):** Huesos y armadura colapsando contra la madera de la cubierta.
3. **Hoja de Contacto y Referencia:**
   - Generación de `docs/referencias/legionnaire-contact-sheet.png` a escala 2× con etiquetas de cada fotograma para inspección visual.
4. **Validación Técnica y No Regresión:**
   - Paleta contenida: máximo 12 colores consistentes (hueso, bronce, cuero, sangre, hierro oxidado y ojos brillantes).
   - `pnpm exec tsc --noEmit && pnpm build` con salida 0.
   - Cero errores de consola en Chrome headless al precargar la textura en Phaser.

---

## 2. Asignación de Roles (AGENTS.md)

- **Orquestador (agente principal):** Redacta el plan, define los criterios, coordina subagentes y contrasta evidencia.
- **Implementador (subagente):** Genera el script de pixel art `scripts/gen-enemy-legionnaire.py`, produce `public/assets/characters/legionnaire.png` y `docs/referencias/legionnaire-contact-sheet.png`, y precarga el asset en `src/scene/ShellScene.ts`.
- **Auditor Independiente (subagente distinto):** Verifica en modo de solo lectura las dimensiones, el anclaje $y=53$, la paleta, la legibilidad visual y la no regresión.

---

## 3. Evidencia de Auditoría Independiente

- **Auditor:** Subagente independiente `01acf36e-053e-4f48-b4d9-de32dea2e091` (solo lectura).
- **Veredicto:** **APROBADO**.
- **Resultados de ejecución:**
  - Hoja `public/assets/characters/legionnaire.png`: dimensiones exactas $512 \times 54\text{ px}$ (8 cuadros de $64 \times 54\text{ px}$).
  - Canal alfa binario estricto: 0 píxeles semitransparentes en los $27.648\text{ px}$.
  - Paleta: exactamente 12 colores representativos verificados.
  - Anclaje inferior: $y = 53$ (`bbox[3] == 54`) en los cuadros 0, 1, 2, 3, 4, 5 y 7. Cuadro 6 (`juggle`) suspendido en el aire con despeje de 10 px (`bbox[3] == 44`).
  - Jerarquía de escala: altura de 46–50 px, más bajo y esbelto que Kratos (56–59 px).
  - Precarga en Phaser verificada en `src/scene/ShellScene.ts`.
  - `pnpm exec tsc --noEmit && pnpm build` código de salida 0 en 5.97s, 0 fugas de `__GOW8B` en `dist/`.
  - Verificación CDP en Chrome headless: determinismo estricto preservado, 0 errores de consola y no regresión en Casos A a I.
