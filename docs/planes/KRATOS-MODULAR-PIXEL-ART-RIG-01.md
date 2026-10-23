# Plan de Trabajo — `KRATOS-MODULAR-PIXEL-ART-RIG-01`
## Consistencia Visual Absoluta y Ciclo de Carrera por Rigging Modular Rasterizado

- **Fecha:** 2026-10-23
- **Estado:** EN EJECUCIÓN (Ajuste de entorno y especificación completados)
- **Rama:** `master`
- **Etapa asociada:** `GOW8B-ART-KRA` / Consistencia Visual Anti-Mutación
- **Skills vinculadas:**
  - `.agents/skills/browser-testing-with-devtools/SKILL.md`
  - `.agents/skills/pixel-art-character-consistency/SKILL.md`

---

## 1. Problema y Hallazgos Previos

1. **Doble Cuchilla del Caos en la mano izquierda:**
   - En `public/assets/characters/kratos-neutral.png`, el brazo izquierdo tiene dos hojas montadas (una superior y otra colgando en $y=40..45$), acumulando 57 px de arma frente a 27 px en la mano derecha.
2. **Mutación brutal entre reposo y carrera:**
   - En reposo (`idle`), Kratos tiene piernas sólidas espartanas con grebas de bronce de 8 a 10 px de grosor.
   - En carrera (`run`), el generador procedural trazaba líneas matemáticas de Bresenham (`seg`, `draw_limb_segment`) de 1 a 3 px, transformando al personaje en un monigote de alambre con patas de araña.
3. **Rostro sin terminar:**
   - Falta de definición en la mandíbula, perilla espartana angular y ceño en el modelo maestro.

---

## 2. Los 4 Invariantes Obligatorios

1. **Prohibición de Trazos Vectoriales:** Cero `draw_limb_segment`, `seg` o fórmulas trigonométricas para extremidades humanas.
2. **Coherencia de Modelo Único:** La carrera y el reposo comparten exactamente los mismos píxeles anatómicos. Prohibida toda mutación de masa o estilo.
3. **Validación de Armas:** Exactamente una Cuchilla del Caos por mano.
4. **Comprobación Lado a Lado en Navegador:** Captura obligatoria en Chrome CDP sobre la cubierta: `[Idle en cubierta]` vs `[Run en cubierta]` a 4x.

---

## 3. Arquitectura del Pipeline Modular (Cut-out Rasterizado)

```
       [ kratos-neutral.png (Corregido y Esculpido) ]
                          │
       ┌──────────────────┴──────────────────┐
       ▼                                     ▼
[ Banco de Piezas Rasterizadas ]      [ kratos-idle.png ]
(scratch/kratos_parts/)
 ├── head_and_neck.png (Ceño, perilla, tatuaje Ares)
 ├── torso_and_skirt.png (Pectorales, faldón pteruges)
 ├── blade_master.png (1 Cuchilla simétrica)
 ├── thigh.png (Muslo macizo 6-8 px)
 └── shin_greave.png (Pantorrilla con greba bronce)
                          │
                          ▼
    [ scripts/build-kratos-modular-run.py ]
    (Composición por capas y traslación de matrices,
     rotaciones Nearest-Neighbor, suelo fijo y=58)
                          │
                          ▼
            [ public/assets/characters/kratos-run.png ]
            (8 cuadros de carrera atlética + 1 derrape)
                          │
                          ▼
          [ npm run audit:sprites (Chrome CDP) ]
          (Captura lado a lado y verificación de skills)
```

---

## 4. Fases de Ejecución

### Fase 1: Cirugía del Sprite Maestro (`kratos-neutral.png` y `kratos-idle.png`)
- Eliminar la segunda hoja que cuelga en el brazo izquierdo ($y=40..45$, $x=15..32$).
- Esculpir el perfil facial: ceño oscuro, nariz griega recta, barbilla con perilla espartana puntiaguda (`#1b0717`) y continuidad del tatuaje carmesí (`#b03028`).
- Emparejar la Cuchilla del Caos de la mano derecha para garantizar simetría exacta de armas (1 por mano).
- Exportar `kratos-neutral.png` (97×59) y sincronizar `kratos-idle.png` (194×59).

### Fase 2: Extracción del Banco de Piezas Maestras
- Extraer a `scratch/kratos_parts/` los recortes PNG con canal alfa binario:
  - `head_and_neck.png`
  - `torso_and_skirt.png`
  - `blade_master.png`
  - `thigh.png`
  - `shin_greave.png`

### Fase 3: Ensamblado Modular del Ciclo de Carrera
- Implementar `scripts/build-kratos-modular-run.py`.
- Generar 8 cuadros de zancada (2 zancadas completas de 4 fases) + cuadro 9 de derrape (*skid*):
  - Oscilación vertical de cadera y torso ($1..2\text{ px}$).
  - Articulación de muslos y grebas reales manteniendo el volumen de 6-8 px.
  - Pies tocando suelo rigurosamente en $y=58$.
- Exportar a `public/assets/characters/kratos-run.png` ($873 \times 59\text{ px}$).

### Fase 4: Auditoría y Verificación con Skills
- Ejecutar `npm run audit:sprites`.
- Generar `audit-side-by-side-idle-vs-run.png` directamente desde el navegador real en la cubierta del barco.
- Verificar conteo de armas (1 por mano) y masa muscular idéntica.
- Ejecutar suite de combate (`scripts/verification/capture-combat.mjs`) para garantizar 0 regresiones en los 28 casos.

---

## 5. Criterios de Aceptación
- [ ] `kratos-neutral.png` y `kratos-idle.png` tienen exactamente una espada por mano y rostro definido.
- [ ] Piernas en `kratos-run.png` conservan el grosor y grebas del sprite maestro (cero líneas de 1-3 px).
- [ ] Suelo anclado a $y=58$ en todos los apoyos.
- [ ] 0 errores de consola en Chrome CDP.
- [ ] Captura lado a lado `[Idle vs Run]` validada sin mutaciones de estilo.
- [ ] 28/28 casos de combate aprobados sin regresión.
