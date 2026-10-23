# Plan de Implementación — `KRATOS-ART-UPGRADE-12COL-01`
## Elevación Visual de Kratos a Pixel Art 16-bit de 12 Colores sobre Rig Cinemático a 60 Hz

- **Fecha:** 2026-10-23
- **Estado:** **APROBADA TRAS REAUDITORÍA INDEPENDIENTE**
- **Rama:** `tarea/KRATOS-ART-UPGRADE-12COL-01`
- **Etapa asociada:** `GOW8B-ART-KRA` (Bloque 11) / Calidad Visual de Kratos
- **Autorización de la usuaria:** Aprobado explícitamente el 2026-10-23 ("si estoy de acuerdo, pero también debe quedar documentación... todo lo que se compruebe que funcione").

---

## 1. Justificación Técnica y Diagnóstico de Calidad

1. **Lección comprobada:**
   - La cinemática procedural a 60 Hz de [`scripts/gen-kratos-anim.py`](file:///home/ccmarin14/Documents/Desarrollos/gow-8b/scripts/gen-kratos-anim.py) es la única técnica que garantiza zancadas reales con deltas de $>1,200\text{ px/cuadro}$, inercia, derrape en giro y voltereta en suelo de 4 etapas sin sufrir la parálisis motora de los generadores de imágenes por difusión estocástica.
2. **Deficiencia estética del maniquí anterior:**
   - La versión anterior utilizaba una paleta restrictiva de 6 colores apagados heredada del prototipo inicial:
     - El tatuaje de Ares compartía el color marrón de sombra profunda (`#2c1212`), volviéndose casi indistinguible del cuerpo.
     - No existían reflejos de acero para las Cuchillas del Caos ni el brillo incandescente de las runas de fuego.
     - Los músculos y extremidades eran trazados con polígonos geométricos planos sin sombreado anatómico ni volumen espartano.
3. **Equiparación con los enemigos aprobados:**
   - El Legionario No-Muerto ([`legionnaire.png`](file:///home/ccmarin14/Documents/Desarrollos/gow-8b/public/assets/characters/legionnaire.png)), el Arquero ([`archer.png`](file:///home/ccmarin14/Documents/Desarrollos/gow-8b/public/assets/characters/archer.png)) y la Hidra ([`hydra.png`](file:///home/ccmarin14/Documents/Desarrollos/gow-8b/public/assets/characters/hydra.png)) presentan un pixel art atractivo y de alto contraste gracias a sus generadores en Python con paletas de 12 a 14 colores.
   - Kratos alcanza este mismo estándar visual sin perder ni un milímetro de su animación viva.

---

## 2. Especificación de la Nueva Paleta Oficial de 12 Colores

Se estableció una paleta estricta de 12 colores con jerarquía tonal clara y acentos canónicos de *God of War 1* (PS2):

| # | Nombre de Color | Hex | RGB | Uso Anatómico y de Vestimenta |
| :---: | :--- | :--- | :--- | :--- |
| **1** | `C_BLACK` | `#120e10` | `(18, 14, 16)` | Contornos nítidos de silueta, sombras oclusivas y perilla espartana. |
| **2** | `C_ASH_DK` | `#403834` | `(64, 56, 52)` | Sombra profunda de la piel de ceniza y pliegues musculares. |
| **3** | `C_ASH_MD` | `#908880` | `(144, 136, 128)` | Tono medio base de la piel pálida de ceniza de Kratos. |
| **4** | `C_ASH_HI` | `#ded8d2` | `(222, 216, 210)` | Luces y relieve muscular en hombros, pectorales y pared abdominal. |
| **5** | `C_TATTOO_DK` | `#821814` | `(130, 24, 20)` | Sombra del tatuaje de Ares en torso y cabeza. |
| **6** | `C_TATTOO_HI` | `#dc2820` | `(220, 40, 32)` | **Rojo carmesí puro de Ares**, brillante y de máximo contraste. |
| **7** | `C_LEATHER_DK` | `#302016` | `(48, 32, 22)` | Sombra de correajes, sandalias y tiras del faldón (*pteruges*). |
| **8** | `C_LEATHER_MD` | `#604028` | `(96, 64, 40)` | Cuero marrón espartano del cinturón y faldón. |
| **9** | `C_BRONZE` | `#b48838` | `(180, 136, 56)` | Brillo de bronce griego en hebilla, espinilleras y remaches. |
| **10** | `C_STEEL_DK` | `#2a3038` | `(42, 48, 56)` | Hierro fundido de los eslabones de cadena y cuerpo de las Cuchillas. |
| **11** | `C_STEEL_HI` | `#d8e0e8` | `(216, 224, 232)` | Filo de acero plateado afilado de las Cuchillas del Caos. |
| **12** | `C_RUNE_FIRE` | `#ff8818` | `(255, 136, 24)` | **Fuego rúnico incandescente** en el lomo de las Cuchillas del Caos. |

---

## 3. Rediseño Anatómico y de Sombreado en `scripts/gen-kratos-anim.py`

Las rutinas de dibujo del generador cinemático se esculpieron en pixel art respetando el esqueleto:

1. **`draw_head`:**
   - Mandíbula angular con ceño prominente en sombra `C_BLACK` y mirada intensa.
   - Barba espartana recortada en cuña pronunciada.
   - El tatuaje carmesí de Ares (`C_TATTOO_HI`) trazado en arco continuo y visible desde la coronilla sobre el ojo izquierdo hasta la base del cuello.
2. **`draw_torso`:**
   - Silueta espartana en V con volumen pectoral sombreado en 3 tonos (`C_ASH_DK`, `C_ASH_MD`, `C_ASH_HI`).
   - Pared abdominal (*six-pack*) tallada con sombras de 1 px.
   - Franja diagonal del tatuaje carmesí de Ares cruzando el pecho izquierdo con sombreado interno.
3. **`draw_bracer`:**
   - Cadenas de hierro (`C_STEEL_DK`) enrolladas en espiral tridimensional alrededor de los antebrazos con reflejos plateados (`C_STEEL_HI`) y eslabón colgante.
4. **`draw_skirt` (Pteruges):**
   - Cinturón ancho con hebilla de bronce dorado (`C_BRONZE`).
   - Tiras de cuero colgantes con caída natural, sombras laterales y remaches de bronce.
5. **`draw_compact_blade`:**
   - Cimitarras anchas en media luna ("curva en sonrisa"), cuerpo de hierro oscuro, filo afilado plateado (`C_STEEL_HI`) y núcleo grabado con runas de fuego naranja (`C_RUNE_FIRE`).
6. **`draw_greave_and_boot`:**
   - Grebas anatómicas de bronce en las espinillas con nervadura de brillo central y correas de sandalia atadas sobre el empeine.
7. **`draw_roll_pose`:**
   - Conserva los 4 cuadros biomecánicos exactos de la voltereta en suelo, aplicando la nueva paleta y sombreado de 12 colores a la zambullida, ovillo, desenrollado y guardia baja.

---

## 4. Archivos Modificados

1. `scripts/gen-kratos-anim.py` (código fuente del generador cinemático).
2. `public/assets/characters/kratos-neutral.png` (sprite maestro neutral de 97×59 px).
3. `public/assets/characters/kratos-idle.png` (2 cuadros).
4. `public/assets/characters/kratos-run.png` (7 cuadros: 6 de carrera + 1 derrape).
5. `public/assets/characters/kratos-air.png` (2 cuadros: subida y bajada).
6. `public/assets/characters/kratos-attack.png` (7 cuadros de ataque).
7. `public/assets/characters/kratos-roll.png` (4 cuadros de voltereta).
8. `docs/referencias/kratos-anim-contact-sheet.png` (hoja de contacto comparativa a 2x).

---

## 5. Criterios de Aceptación Cuantitativos y Evidencia Medida

1. **Animación Cinemática Viva Preservada:**
   - Delta de píxeles (`ImageChops.difference`) en cada transición del ciclo de carrera (0 a 5) en `kratos-run.png`:
     - 0 $\to$ 1: **1,194 px** (> 1,000 px)
     - 1 $\to$ 2: **1,626 px** (> 1,000 px)
     - 2 $\to$ 3: **1,013 px** (> 1,000 px)
     - 3 $\to$ 4: **1,172 px** (> 1,000 px)
     - 4 $\to$ 5: **1,332 px** (> 1,000 px)
     - 5 $\to$ 0: **1,173 px** (> 1,000 px)
     - *Promedio:* **1,251.7 px/cuadro** (excelente dinamismo cinemático).
   - Delta en respiración reposo (0 a 1) en `kratos-idle.png`: **410 px** ($\ge 370\text{ px}$).
2. **Invariantes Físicas y Técnicas:**
   - Formato por cuadro: exactamente **97×59 px**.
   - Anclaje al suelo estricto: contacto con la fila $y=58$ (`bbox[3] == 59`) en todos los cuadros terrestres.
   - Canal alfa 100% binario ($a \in \{0, 255\}$).
   - Paleta contenida: exactamente **12 colores canónicos**, assert estricto `assert len(colors) == 12`.
3. **Verificación de Simulación y No Regresión:**
   - `pnpm exec tsc --noEmit && pnpm build` con código de salida 0.
   - Ausencia total de fugas en `dist/` (`grep -rn "__GOW8B" dist/` = 0).
   - Batería completa de 28 casos en Chrome CDP (`capture-combat.mjs`) aprobada al 100% con 0 errores de consola.

---

## 6. Roles y Dictámenes de Auditoría

- **Subagente auditor del plan:** `01acf36e-053e-4f48-b4d9-de32dea2e091` (Plan Aprobado).
- **Subagente implementador:** `fe4b68ad-846c-4e1a-a931-fac862b33ce6`.
- **Subagente auditor independiente de reauditoría:** `9bf6a9d4-70f7-4e9f-9238-b78d23c111b1` (Dictamen: **APROBADA**).
