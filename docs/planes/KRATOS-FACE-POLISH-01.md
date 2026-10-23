# Plan de Corrección — `KRATOS-FACE-POLISH-01`
## Restauración del Cuerpo Musculoso de Kratos (`0860d6d`) y Esculpido de Rostro Espartano Legible en Pixel Art 16-bit

- **Fecha:** 2026-10-23
- **Estado:** **APROBADO EN REAUDITORÍA INDEPENDIENTE — LISTO PARA INTEGRACIÓN**
- **Rama:** `tarea/KRATOS-FACE-POLISH-01` (creada a partir de `0860d6d`)
- **Etapa asociada:** `GOW8B-ART-KRA` / Esculpido Facial de Kratos
- **Autorización de la usuaria:** Aprobada explícitamente el 2026-10-23 tras solicitud ("si volvemos al kratos anterior, puedes mejorar su rostro... hazlo").
- **Auditor del plan:** `35189e46-5e24-470a-acf1-604d11badaf5` (Dictamen: **PLAN APROBADO**).
- **Implementador:** `4ab2c72f-cd85-47cb-bb55-bed1831a6cf5`
- **Re-Auditor independiente:** `953e12d7-e4c1-491f-88fa-acb405c53f65` (Dictamen: **APROBADA**).

---

## 1. Hallazgo y Evidencia

1. **Diagnóstico reportado por la usuaria:**
   - La usuaria rechazó categóricamente la silueta de la tarea anterior (`95eb339`), donde el personaje quedó reducido a un monigote de alambre con extremidades de 2 px y patas de araña desproporcionadas ("que mierda es esto?").
   - Solicitud expresa de la usuaria: volver al Kratos anterior (`0860d6d`), que conservaba la masa muscular, postura, faldón y zancada viva de guerrero, pero mejorando su rostro, ya que "no parecía un rostro".
2. **Causa raíz técnica en `0860d6d`:**
   - En `0860d6d`, la función `draw_head` utilizaba `ImageDraw.polygon` con coordenadas de punto flotante sobre un lienzo pequeño de $97\times 59\text{ px}$. La rasterización poligonal producía un bloque plano amorfo de $13\times 13\text{ px}$ sin micro-estructura facial: no había cuenca ocular, ceño fruncido, puente nasal ni perilla definida. El tatuaje rojo era una franja genérica en lugar del arco canónico de Ares.
   - El resto del cuerpo (torso en V con pectorales, brazos musculosos con cadenas, piernas sólidas con grebas de bronce, faldón con tiras de cuero y animación a 60 Hz) funcionaba a la perfección.

---

## 2. Archivos Exactos a Modificar

1. **Generador procedural:**
   - [`scripts/gen-kratos-anim.py`](file:///home/ccmarin14/Documents/Desarrollos/gow-8b/scripts/gen-kratos-anim.py) (únicamente rediseño de `draw_head` y constantes cefálicas asociadas).
2. **Hojas de sprites regeneradas:**
   - [`public/assets/characters/kratos-neutral.png`](file:///home/ccmarin14/Documents/Desarrollos/gow-8b/public/assets/characters/kratos-neutral.png)
   - [`public/assets/characters/kratos-idle.png`](file:///home/ccmarin14/Documents/Desarrollos/gow-8b/public/assets/characters/kratos-idle.png)
   - [`public/assets/characters/kratos-run.png`](file:///home/ccmarin14/Documents/Desarrollos/gow-8b/public/assets/characters/kratos-run.png)
   - [`public/assets/characters/kratos-air.png`](file:///home/ccmarin14/Documents/Desarrollos/gow-8b/public/assets/characters/kratos-air.png)
   - [`public/assets/characters/kratos-attack.png`](file:///home/ccmarin14/Documents/Desarrollos/gow-8b/public/assets/characters/kratos-attack.png)
   - [`public/assets/characters/kratos-roll.png`](file:///home/ccmarin14/Documents/Desarrollos/gow-8b/public/assets/characters/kratos-roll.png)
3. **Hoja de contacto de referencia:**
   - [`docs/referencias/kratos-anim-contact-sheet.png`](file:///home/ccmarin14/Documents/Desarrollos/gow-8b/docs/referencias/kratos-anim-contact-sheet.png)
4. **Documentación de gobernanza:**
   - [`docs/planes/KRATOS-FACE-POLISH-01.md`](file:///home/ccmarin14/Documents/Desarrollos/gow-8b/docs/planes/KRATOS-FACE-POLISH-01.md)
   - [`docs/aprendizajes-del-proceso.md`](file:///home/ccmarin14/Documents/Desarrollos/gow-8b/docs/aprendizajes-del-proceso.md)
   - [`docs/verificacion.md`](file:///home/ccmarin14/Documents/Desarrollos/gow-8b/docs/verificacion.md)
   - [`docs/estado-de-trabajo.md`](file:///home/ccmarin14/Documents/Desarrollos/gow-8b/docs/estado-de-trabajo.md)

---

## 3. Cambio Propuesto

1. **Restauración íntegra de la base muscular (`0860d6d`):**
   - Conservar intactos: torso esculpido, pectorales, six-pack, deltoides, brazos con cadenas, piernas sólidas con grebas de bronce, faldón con pteruges y calzado de `0860d6d`.
   - Cero extremidades de alambre. Cero figuras de insecto palo.
2. **Reescritura de `draw_head` con micro-pixel art de alta definición:**
   - **Dimensiones de cabeza proporcionales al cuerpo musculoso:** caja de dibujo de $10\times 11\text{ px}$.
   - **Cráneo calvo espartano:** contorno nítido en `C_BLACK` (`#120e10`), sombra parietal en `C_ASH_DK` (`#403834`), base de piel en `C_ASH_MD` (`#908880`) y luz cenicienta en la coronilla `C_ASH_HI` (`#ded8d2`).
   - **Mirada feroz y ceño fruncido:** 1 px de sombra profunda sobre el ojo en 3/4, con punto de luz o destello de pupila penetrante.
   - **Perfil nasal griego:** puente y punta de la nariz proyectados con nitidez (1-2 px salientes hacia el frente).
   - **Mandíbula y perilla espartana:** mentón angular sólido con barba en cuña recortada (`C_BLACK` con matiz `C_ASH_DK`) apuntando hacia adelante y abajo, característica inconfundible de Kratos.
   - **Tatuaje carmesí de Ares:** trazo nítido de 1-2 px en `C_TATTOO_HI` (`#dc2820`) con sombra `C_TATTOO_DK` (`#821814`) que baja desde la coronilla, atraviesa el ojo izquierdo y se conecta hacia el cuello.

---

## 4. Criterios de Aceptación Cuantitativos y Cualitativos

1. **Rostro Legible y Reconocible:**
   - La cabeza debe tener anatomía facial reconocible a simple vista (perfil de nariz, ceño, mandíbula con perilla espartana y tatuaje sobre el ojo).
   - Ausencia total de polígonos amorfos o manchas planas en la cara.
2. **Preservación de Masa Muscular:**
   - Cuerpo robusto y musculoso equivalente a `0860d6d`.
   - Extremidades gruesas con musculatura y armadura visible, sin adelgazamiento a monigote de alambre.
3. **Invariantes Físicas del Motor:**
   - Formato por fotograma: exactamente **$97 \times 59\text{ px}$** en las 6 hojas.
   - Anclaje continuo en el borde basal: $y=58$ (`bbox[3] == 59`) en cuadros terrestres.
   - Canal alfa 100% binario ($\{0, 255\}$).
   - Paleta canónica estricta: exactamente **12 colores**.
4. **Cinemática Viva a 60 Hz:**
   - Reposo (`kratos-idle.png`): delta $\ge 350\text{ px}$.
   - Carrera (`kratos-run.png`): todos los deltas $> 950\text{ px/cuadro}$ con promedio $> 1,150\text{ px/cuadro}$.
5. **No-Regresión en Simulación y Código:**
   - `pnpm exec tsc --noEmit && pnpm build` con exit 0.
   - Cero fugas de arnés en producción (`grep -rn "__GOW8B" dist/` = 0).
   - Batería completa de 28 casos en Chrome CDP (`capture-combat.mjs`) aprobada al 100% con 0 errores de consola.

---

## 5. Regresiones Protegidas

- Físicas de salto simple ($69.056\text{ px}$) y doble ($138.111\text{ px}$).
- Rodada de combate (19 ticks, 13 ticks de invulnerabilidad, $82.33\text{ px}$ de desplazamiento).
- Anclaje de cadenas de `WeaponLayer.ts` en las manos de Kratos.
- Animación fluida de zancada en el ciclo de carrera.

---

## 6. Procedimiento de Compuerta según `AGENTS.md`

1. **Revisión del Plan por Auditor Independiente:** Un subagente auditor en modo de solo lectura revisa este plan.
2. **Implementación:** Un subagente implementador dedicado en `tarea/KRATOS-FACE-POLISH-01` aplica los cambios en `draw_head` dentro de `scripts/gen-kratos-anim.py`, regenera los spritesheets y la hoja de contacto.
3. **Reauditoría Independiente:** Un subagente auditor distinto reaudita los criterios cuantitativos, la legibilidad del rostro y la no-regresión.
4. **Cierre:** Fusión a `master`, actualización de bitácora y entrega del informe a la usuaria.

---

## 7. Dictamen y Evidencia de Re-Auditoría Independiente

- **Auditor:** Subagente independiente de solo lectura `953e12d7-e4c1-491f-88fa-acb405c53f65`.
- **Dictamen:** **APROBADA (100% de criterios cumplidos)**.
- **Evidencia verificada:**
  - Preservación anatómica del cuerpo de `0860d6d`: diff píxel a píxel confirmó que el 100% de los cambios están acotados a la cabeza ($y \le 16$). Torso, brazos, faldón y piernas musculosas permanecen intactos.
  - Legibilidad facial en pixel art: matriz `KRATOS_HEAD_GRID` de $10\times 10\text{ px}$ con cráneo calvo iluminado, ceño sombreado, mirada fiera con destello, nariz aguileña proyectada 1-2 px, mentón con perilla en cuña y arco del tatuaje de Ares.
  - Invariantes físicas: $97\times 59\text{ px}$, contacto continuo en $y=58$ (`bbox[3] == 59`), canal alfa 100% binario, paleta exacta de 12 colores en las 6 hojas.
  - Cinemática viva a 60 Hz: reposo $356\text{ px}$ ($\ge 350\text{ px}$); carrera con mínimo $996\text{ px}$ ($> 950\text{ px}$) y promedio $1,230.0\text{ px/cuadro}$ ($> 1,150\text{ px}$).
  - Compilación y build: `pnpm exec tsc --noEmit && pnpm build` exit 0, 0 coincidencias de `__GOW8B` en `dist/`.
  - Suite Chrome CDP: 28 de 28 casos aprobados (A a AB) con 0 errores de consola. Determinismo y físicas de salto ($69.056\text{ px}$ / $138.111\text{ px}$) y rodada ($82.33\text{ px}$) verificadas.
