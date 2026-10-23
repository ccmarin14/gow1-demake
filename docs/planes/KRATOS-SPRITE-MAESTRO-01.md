# Plan de Trabajo — `KRATOS-SPRITE-MAESTRO-01`
## Fase 1: Creación del Sprite Maestro de Kratos en Pixel Art 16-bit con Cuello Visible, Manos Reales y Captura en Cubierta

- **Fecha:** 2026-10-23
- **Estado:** **APROBADO EN RE-AUDITORÍA INDEPENDIENTE — LISTO PARA COMPUERTA HUMANA**
- **Rama:** `tarea/KRATOS-SPRITE-MAESTRO-01`
- **Etapa asociada:** `GOW8B-ART-KRA` / Fase 1: Sprite Maestro Base
- **Autorización de la usuaria:** Aprobada explícitamente el 2026-10-23 ("si" para iniciar Fase 1 del Plan Maestro).
- **Auditor del plan:** `f1a5e692-5dbf-44f9-affc-7ef1b9489381` (Dictamen: **PLAN APROBADO**).
- **Implementador:** `9bfe0a22-9725-4536-95bd-ba6c4d9c42ff`
- **Re-Auditor independiente:** `cd3e6cea-c8ff-43aa-b15d-c463d0913ab0` (Dictamen: **APROBADA**).

---

## 1. Hallazgo y Evidencia Previa

1. **Problemas visuales denunciados por la usuaria en la captura real del juego:**
   - **Cabeza hundida y sin cuello:** La cabeza parecía un tapón o canica incrustada en el hombro izquierdo sin transición anatómica ni cuello (efecto jorobado).
   - **Brazos de robot con cuchillas soldadas:** Las hojas salían rígidamente de bloques grises como muñones ortopédicos, sin empuñadura visible en las manos.
   - **Postura rígida de cangrejo:** Torso monolítico con hombros en rampa diagonal y piernas abiertas en cuclillas sin silueta espartana orgánica.

---

## 2. Archivos a Crear y Modificar

1. **Constructor de Sprite Maestro:**
   - [`scripts/build-kratos-master.py`](file:///home/ccmarin14/Documents/Desarrollos/gow-8b/scripts/build-kratos-master.py) (nuevo módulo de ensamblado de pixel art por bloques anatómicos: cabeza con cuello, torso trapezoide, brazos con manos y empuñaduras, faldón y piernas espartanas).
2. **Assets de Personaje:**
   - [`public/assets/characters/kratos-neutral.png`](file:///home/ccmarin14/Documents/Desarrollos/gow-8b/public/assets/characters/kratos-neutral.png)
   - [`public/assets/characters/kratos-idle.png`](file:///home/ccmarin14/Documents/Desarrollos/gow-8b/public/assets/characters/kratos-idle.png)
3. **Evidencia Visual en el Navegador Real:**
   - [`scripts/verification/output/kratos_deck_preview_1x.png`](file:///home/ccmarin14/Documents/Desarrollos/gow-8b/scripts/verification/output/kratos_deck_preview_1x.png)
   - [`scripts/verification/output/kratos_deck_preview_4x.png`](file:///home/ccmarin14/Documents/Desarrollos/gow-8b/scripts/verification/output/kratos_deck_preview_4x.png)
4. **Documentación:**
   - [`docs/planes/KRATOS-SPRITE-MAESTRO-01.md`](file:///home/ccmarin14/Documents/Desarrollos/gow-8b/docs/planes/KRATOS-SPRITE-MAESTRO-01.md)

---

## 3. Especificación Anatómica del Sprite Maestro

- **Lienzo:** $97 \times 59\text{ px}$, Kratos centrado ($CX = 48$, suelo $y = 58$).
- **Cabeza y Cuello (Altura $y = 5..16$):**
  - **Cuello visible:** Cilindro muscular de 3 px de ancho por 2-3 px de alto ($y = 14..16$) en `C_ASH_MD` y `C_ASH_DK`, conectando limpiamente la base de la mandíbula con la clavícula.
  - **Cráneo espartano:** Bóveda craneal calva ($9\times 8\text{ px}$) con luz en coronilla `C_ASH_HI` (`#ded8d2`) y contorno `C_BLACK`.
  - **Facciones:** Ceño fruncido sombreado, mirada fiera penetrante en 3/4, nariz aguileña proyectada 1-2 px hacia adelante y perilla espartana angular en cuña (`C_BLACK` y `C_ASH_DK`) apuntando hacia adelante y abajo.
  - **Tatuaje de Ares:** Banda carmesí (`C_TATTOO_HI` con sombra `C_TATTOO_DK`) que cruza coronilla, ojo izquierdo y baja por el cuello hacia el pectoral.
- **Torso y Musculatura (Altura $y = 16..31$):**
  - **Hombros:** Anchura total de 15 px con deltoides redondeados en cúpula (forma de trapecio humano, no rampa diagonal).
  - **Pectorales:** Masa muscular sombreada en 3 tonos con surco esternal central de 1 px.
  - **Abdomen:** Pared abdominal en V estrechándose hacia la cintura (11 px), six-pack marcado.
- **Brazos, Manos y Empuñaduras:**
  - Bíceps y antebrazos atléticos (4 px de grosor) envueltos en cadenas de hierro `C_STEEL_DK` con destellos de eslabones plateados `C_STEEL_HI`.
  - **Manos:** Puños cerrados definidos de $5\times 5\text{ px}$ sujetando visiblemente la empuñadura de las Cuchillas del Caos.
  - **Cuchillas del Caos:** Hoja clásica de God of War con guarda de bronce `C_BRONZE`, filo curvado de acero plateado `C_STEEL_HI` y fuego rúnico naranja `C_RUNE_FIRE` en el lomo, naciendo desde las manos del guerrero.
- **Cintura y Faldón:**
  - Cinturón de placas de bronce con hebilla dorada central de $3\times 3\text{ px}$.
  - Faldón de cuero con tiras colgantes (*pteruges*) con remates de bronce y faja central roja.
- **Piernas y Base:**
  - Muslos sólidos, rodilleras de bronce y grebas espartanas con brillo central.
  - Sandalias de combate apoyadas con firmeza en $y=58$ (`bbox[3] == 59`).

---

## 4. Criterios de Aceptación Cuantitativos y Visuales

1. **Lista de Verificación Visual (Inspección en Navegador Real):**
   - [ ] Cuello visible y diferenciado entre la mandíbula y el hombro.
   - [ ] Manos anatómicas sujetando empuñaduras reales (cero hojas pegadas a muñones cúbicos).
   - [ ] Hombros y torso en V atlética orgánica (cero joroba, cero rampa diagonal).
   - [ ] Piernas con postura sólida espartana (cero postura de cangrejo/mutante).
2. **Invariantes del Motor:**
   - Formato exacto $97 \times 59\text{ px}$.
   - Anclaje continuo en $y=58$ (`bbox[3] == 59`).
   - Canal alfa 100% binario ($\{0, 255\}$).
   - Exactamente 12 colores de la paleta canónica.
3. **Validación en Escena Real del Juego:**
   - Ejecución de Chrome headless / CDP renderizando a Kratos en la cubierta del barco.
   - Captura y exportación de `kratos_deck_preview_1x.png` y `kratos_deck_preview_4x.png` para inspección directa de la usuaria.
4. **Calidad de Código y Simulación:**
   - `pnpm exec tsc --noEmit && pnpm build` exit 0, 0 `__GOW8B` en `dist/`.

---

## 5. Procedimiento de Compuerta según `AGENTS.md`

1. **Revisión del Plan por Auditor Independiente:** Subagente auditor en modo de solo lectura aprueba el plan.
2. **Implementación:** Subagente implementador crea `scripts/build-kratos-master.py`, genera los sprites, captura el juego en Chrome CDP y genera las previsualizaciones 1x y 4x.
3. **Reauditoría Independiente:** Subagente auditor distinto verifica las métricas técnicas e inspecciona las capturas reales.
4. **Compuerta Humana:** Se presenta la captura real en la cubierta a la usuaria para su aprobación estética antes de desglosar las 10 poses de la carrera.

---

## 6. Dictamen y Evidencia de Re-Auditoría Independiente

- **Auditor:** Subagente independiente de solo lectura `cd3e6cea-c8ff-43aa-b15d-c463d0913ab0`.
- **Dictamen:** **APROBADA (100% de criterios cumplidos)**.
- **Evidencia verificada:**
  - **Cuello visible:** Columna muscular de 6 px de anchura ($x=45..50$, $y=15$) con espacio libre lateral completo ($\alpha=0$ en $x=51..60$), dejando 2-3 filas de separación entre mandíbula y hombro. Cero cabeza incrustada/jorobada.
  - **Manos anatómicas:** Puños cerrados definidos de $5\times 5\text{ px}$ en $x=64..68$ y $x=26..30$ sujetando empuñaduras y crucetas de bronce `C_BRONZE`. Cuchillas del Caos emergen de las manos con filo plateado y fuego rúnico. Cero hojas soldadas a muñones.
  - **Torso en V atlética:** Ratio de reducción espartana 1.55:1 ($17\text{ px}$ en hombros/pecho a $11\text{ px}$ en cintura). Pectorales esculpidos en 3 tonos con surco esternal central y tatuaje carmesí de Ares.
  - **Piernas y apoyo:** Muslos atléticos y grebas de bronce con cresta de luz, con 8 px de espacio libre central. Sandalias firmemente apoyadas en $y=58$ (`bbox[3] == 59`).
  - **Invariantes del motor:** Formato $97\times 59\text{ px}$, contacto basal $y=58$, canal alfa 100% binario, exactamente 12 colores canónicos.
  - **Ejecución real en navegador:** Capturas reales en la cubierta del barco ejecutadas con Chrome CDP en `(x: 240, y: 262)` con 0 errores y 0 advertencias de consola.
  - **Compilación:** `tsc -b && vite build` exit 0, 0 coincidencias de `__GOW8B` en `dist/`.
