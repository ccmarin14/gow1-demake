# Plan de implementación — `GOW8B-ENEMY2-ART` (Arte del Segundo Esbirro: Arquero No-Muerto)

- **Fecha:** 2026-10-23
- **Estado:** **APROBADO** (Completada y auditada independientemente el 2026-10-23).
- **Decisiones asociadas:** `D-03` (Lore e identidad canónica de God of War 1 PS2), `D-04` (recursos propios originales sin copias externas), `D-06` (roles orquestador / implementador / auditor), `D-12` (lienzo 480×270 a 60 Hz).
- **Objetivo:** Crear el conjunto de sprites en pixel art original del segundo esbirro canónico de *God of War 1*: el **Arquero No-Muerto (Undead Archer)** de Ares. El enemigo debe tener silueta y postura de ataque claramente diferenciadas del Legionario No-Muerto, con un arco griego recurvo, carcaj, brillo espectral violeta en los ojos para rápida lectura periférica, y el proyectil de flecha correspondiente para habilitar el combate a distancia del Bloque 5.

---

## 1. Alcance y Especificación Visual

1. **Identidad Canónica (GoW 1 PS2 en 2D):**
   - Arquero esquelético del ejército de Ares: calavera esquelética sin yelmo o con diadema de cuero/bronce simple, torso huesudo encorvado, cuencas oculares con fulgor espectral **amatista/violeta** (`#b040ff`, `#e890ff`) que contrasta de inmediato con el fulgor carmesí del Legionario.
   - Equipamiento: arco compuesto griego recurvo de madera y cuerno (`#5c3a1e`, `#a07040`), carcaj rústico cruzado en la espalda con culatines de flechas (`#422814`), faldón andrajoso oscuro (`#3a2030`).
   - Escala y proporciones: altura útil de 44–48 px (más bajo, ágil y encorvado que el Legionario de 48–50 px y que Kratos de 56–59 px), manteniendo una estricta jerarquía visual.

2. **Rejilla y Hoja de Sprites (`public/assets/characters/archer.png`):**
   - Rejilla fija: cada fotograma mide exactamente **64×54 px** con canal alfa binario puro (sin halos ni semitransparencias espurias).
   - Dimensiones totales: $512 \times 54\text{ px}$ (8 fotogramas dispuestos horizontalmente).
   - Anclaje inferior estricto: la base de apoyo de los pies debe coincidir con $y = 53$ (`bbox[3] == 54`) en todas las poses terrestres.
   - Poses esenciales:
     - **Cuadro 0 (`idle`):** Postura encorvada y atenta, sosteniendo el arco verticalmente en reposo.
     - **Cuadro 1 (`walk_1`):** Paso lateral/retroceso de reposicionamiento ágil 1.
     - **Cuadro 2 (`walk_2`):** Paso lateral/retroceso de reposicionamiento ágil 2.
     - **Cuadro 3 (`aim` / tensado y anticipación):** Cuerpo de perfil, arco horizontalizado y tensado hacia Kratos con flecha en la muesca y destello amatista intenso en el ojo (telegraph visual nítido para permitir esquiva, bloqueo o desvío).
     - **Cuadro 4 (`shoot` / suelta):** Suelta explosiva de la cuerda, retroceso elástico del arco y brazo extendido hacia adelante.
     - **Cuadro 5 (`hurt` / impacto):** Torso y calavera proyectados hacia atrás por el impacto de las Cuchillas del Caos.
     - **Cuadro 6 (`airborne` / juggle):** Esqueleto volteado e ingrávido en el aire con despeje libre de al menos 8 px respecto al suelo (`bbox[3] <= 46`).
     - **Cuadro 7 (`death` / desmoronamiento):** Calavera y costillas colapsando en pedazos contra las tablas del suelo, con el arco quebrado al lado.

3. **Proyectil Flecha (`public/assets/characters/arrow.png`):**
   - Dimensiones: **16×8 px** con canal alfa binario.
   - Anatomía: punta de flecha griega de bronce/hierro (`#d4af37`), asta de fresno (`#8a5a2a`) y emplumado de cuervo oscuro (`#2c1c28`).
   - Vuelo horizontal recto orientado hacia la izquierda (dirección predeterminada hacia Kratos).

4. **Hoja de Contacto de Referencia (`docs/referencias/archer-contact-sheet.png`):**
   - Imagen a escala 2× con etiquetas sobreimpresas de cada fotograma para auditoría visual directa.

5. **Integración y Precarga Técnica:**
   - Registro de la textura `'archer'` (frames de 64×54 px) y `'arrow'` en `src/scene/ShellScene.ts`.
   - Cero errores de compilación (`tsc --noEmit && pnpm build` exit 0).
   - Cero errores de consola en Chrome headless.

---

## 2. Criterios de Aceptación

1. **Dimensiones y formato:**
   - `public/assets/characters/archer.png` es exactamente $512 \times 54\text{ px}$, PNG con canal alfa binario puro (0 píxeles con $0 < A < 255$).
   - `public/assets/characters/arrow.png` es exactamente $16 \times 8\text{ px}$, PNG con canal alfa binario puro.
2. **Anclaje e Invariante de Apoyo:**
   - Cuadros 0, 1, 2, 3, 4, 5 y 7 tienen su píxel opaco inferior en $y = 53$ (`bbox[3] == 54`).
   - Cuadro 6 (`juggle`) tiene despeje vertical respecto al suelo (`bbox[3] <= 46`).
3. **Paleta y cromática:**
   - Máximo 12 colores consistentes en la hoja del arquero.
   - Los ojos cuentan con brillo amatista/violeta diferenciado (`#b040ff`, `#e890ff`), no rojo.
4. **Integración y robustez:**
   - Precarga exitosa en `ShellScene.ts`.
   - `tsc --noEmit && pnpm build` finaliza con código 0.
   - Verificación en Chrome headless sin excepciones de consola ni regresiones en los 13 casos existentes (Casos A a M).

---

## 3. Evidencia de Auditoría Independiente

- **Auditor:** Subagente independiente `01acf36e-053e-4f48-b4d9-de32dea2e091` (solo lectura).
- **Veredicto:** **APROBADO**.
- **Resultados cuantitativos:**
  - Hoja `public/assets/characters/archer.png`: dimensiones exactas $512 \times 54\text{ px}$ (8 cuadros de $64 \times 54\text{ px}$).
  - Canal alfa binario estricto: 0 píxeles con $0 < A < 255$ en los 27.648 píxeles.
  - Paleta y cromática: exactamente 11 colores utilizados (límite $\le 12$). Detección clara del fulgor amatista/violeta espectral en cuencas (`#b040ff` y `#e890ff`), diferenciado netamente del rojo carmesí del Legionario.
  - Anclaje inferior de apoyo: cuadros 0, 1, 2, 3, 4, 5 y 7 con base opaca en $y = 53$ (`bbox[3] == 54`).
  - Cuadro 6 (`juggle`): suspendido en el aire con `bbox[3] = 44 <= 46` (despeje vertical libre de 10 px respecto al suelo).
  - Proyectil `public/assets/characters/arrow.png`: dimensiones $16 \times 8\text{ px}$, alfa binario, punta de bronce y plumas de cuervo.
  - Hoja de contacto `docs/referencias/archer-contact-sheet.png`: presente y verificada en $552 \times 288\text{ px}$ a escala 2× con etiquetas.
  - Precarga técnica en Phaser (`ShellScene.ts`): texturas `'archer'` y `'arrow'` precargadas y validadas en runtime (CDP headless: `hasArcher: true`, `hasArrow: true`).
  - `pnpm exec tsc --noEmit && pnpm build`: salida código 0 en 5.87s, 0 fugas en `dist/`.
  - Chrome CDP (`capture-combat.mjs`): 13 casos (A a M) aprobados con determinismo estricto y 0 errores de consola.
