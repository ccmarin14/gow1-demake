# Plan de implementación — `KRATOS-ART-MODEL-01` (Nivel 1: Rediseño del Modelo Maestro Pixel Art de Kratos)

- **Fecha:** 2026-10-22
- **Estado:** **APROBADO** (Implementado por agente `51b4b734-69cb-480f-b899-d016460efbfd`, auditado y aprobado por agente independiente de solo lectura `01acf36e-053e-4f48-b4d9-de32dea2e091`).
- **Decisiones asociadas:** `D-03`, `D-04`, `D-21`, `D-24` ([`docs/decisiones.md`](../decisiones.md)).
- **Objetivo del plan:** Elevar la calidad visual y la presencia de Kratos del maniquí geométrico actual a una figura de pixel art con anatomía imponente, relieve muscular, faldón espartano con pliegues reales, y cadenas de hierro enrolladas en los antebrazos.

---

## 1. Justificación y Alcance (Nivel 1 del Roadmap)

Por principio de pipeline de animación 2D, el **modelo maestro del personaje debe fijarse antes de animar giros, derrapes o nuevos combos**. Cualquier mejora anatómica realizada en el generador maestro (`scripts/gen-kratos-anim.py`) se propaga instantáneamente a todas las hojas de sprites (`kratos-neutral`, `kratos-idle`, `kratos-run`, `kratos-air`, `kratos-attack`, `kratos-roll`) sin retrabajo.

### Puntos clave del rediseño en `scripts/gen-kratos-anim.py`:

1. **Cabeza depredadora y barba espartana (`draw_head`):**
   - Cuello y cabeza adelantados con actitud de combate agresiva (postura de depredador, no erguido como estatua).
   - Mandíbula angular con la barba espartana recortada y prominente en `OUTLINE` y `DARK`.
   - Ceño fruncido bajo la ceja con sombra profunda y mirada frontal intensa.
   - Tatuaje carmesí de Ares recorriendo nítidamente desde el ojo izquierdo sobre la coronilla calva hacia el hombro.
2. **Antebrazos con Cadenas del Caos fundidas (`draw_bracer`):**
   - En lugar de un brazalete genérico de cuero liso, representar las cadenas de hierro enrolladas en espiral alrededor de la carne de los antebrazos (`OUTLINE` + `DARK` con reflejos metálicos `MID`/`HI`), tal como las lleva Kratos en *God of War* 1 (PS2).
   - Eslabón suelto colgante bajo la muñeca que vibra con el movimiento.
3. **Faldón espartano (*Pteruges*) con pliegues y cinturón de bronce (`draw_skirt`):**
   - Tiras de cuero verticales con sombra de separación y caída natural sobre los muslos.
   - Cinturón ancho de placas de bronce con hebilla dorada central (`SHADOW`/`MID`/`HI`).
   - Cobertura anatómica de caderas sin huecos en la ingle.
4. **Torso heroico y volumen muscular (`draw_torso`):**
   - Espalda en V con trapecios anchos, deltoides marcados y pectorales esculpidos.
   - Sombreado de 1 px de luz alta (`HI`) en la parte superior de los músculos y sombra dura (`SHADOW`/`DARK`) en los relieves para dar tridimensionalidad.
   - Marca roja de Ares cruzando diagonalmente el torso hacia el hombro izquierdo.
5. **Grebas y botas espartanas (`draw_greave_and_boot`):**
   - Grebas de bronce protegiendo las espinillas con brillo central `MID`/`HI`.
   - Sandalias con correas firmes sobre el empeine.

---

## 2. Invariantes y Regresiones Técnicas Protegidas

- **Dimensiones por cuadro:** Exactamente **97×59 px** en todos los spritesheets.
- **Paleta estricta de 6 colores:** `assert set(cols) == set(PALETTE)` debe pasar sin excepción (cero colores nuevos o degradados espurios).
- **Línea de pies y anclaje:** El borde inferior del cuerpo debe coincidir exactamente con la fila $y=58$ (`bbox[3] == 59`) para mantener el anclaje `(0.5, 1.0)` con la madera de la cubierta sin desalineaciones.
- **Sincronización con `WeaponLayer`:** Las coordenadas de los puños en cada pose (`hands` en `src/config.ts`) deben mantenerse calibradas con los orígenes de las Cuchillas del Caos.
- **Simulación intacta:** `tsc --noEmit` y `pnpm build` exit 0; determinismo y checksums protegidos.

---

## 3. Plan de Verificación y Evidencias

1. **Aserciones en Python:** Ejecución de `python3 scripts/gen-kratos-anim.py` validando automáticamente dimensiones, recuento de fotogramas, paleta indexada y anclaje inferior.
2. **Generación de Hoja de Contacto:** `docs/referencias/kratos-anim-contact-sheet.png` actualizada mostrando las poses de reposo, carrera, aire, ataque y rodada a escala ampliada para inspección visual con `read_file`.
3. **Automatización en Navegador con Chrome CDP:**
   - Ejecutar `node scripts/verification/capture-combat.mjs` para validar que el renderizado en Phaser 3 no genere artefactos, desajustes de anclaje ni errores de consola.
   - Generar mosaicos y GIFs en `scripts/verification/output/` para contrastar el nuevo aspecto en movimiento.
4. **Auditoría independiente en modo de solo lectura:** Un subagente auditor independiente revisará la hoja de contacto, los spritesheets y las capturas antes de aprobar.

---

## 4. Resultado de Auditoría Independiente

- **Fecha:** 2026-10-22
- **Auditor:** Subagente independiente de solo lectura `01acf36e-053e-4f48-b4d9-de32dea2e091`.
- **Dictamen:** **APROBADO** (5/5 comprobaciones superadas con éxito).
  - Invariantes de pixel art: $97 \times 59\text{ px}$ exactos en todos los cuadros, 6 colores estrictos, anclaje inferior en $y=58$ (`f_bbox[3] == 59`).
  - Sincronización de armas: amarre de cadenas calibrado al píxel exacto del puño en `CONFIG.player.attack.hands`.
  - Calidad anatómica: cabeza depredadora con barba espartana y ceño sombreado, cadenas de hierro fundidas en antebrazos con eslabón suelto, faldón pteruges con cinturón de bronce y hebilla, torso en V esculpido con tatuaje de Ares, grebas con nervadura central y sandalias firmes.
  - Compilación y no regresión: `pnpm exec tsc --noEmit && pnpm build` exit 0 (sin `__GOW8B` en `dist/`); verificación automatizada en navegador con Chrome CDP (`capture-combat.mjs`) exit 0, cero errores de consola, determinismo y checksums protegidos.
