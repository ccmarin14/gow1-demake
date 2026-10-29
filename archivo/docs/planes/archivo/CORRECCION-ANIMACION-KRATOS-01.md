# Plan de Corrección — `CORRECCION-ANIMACION-KRATOS-01` (Restitución de Animación Cinemática de Kratos)

- **Fecha:** 2026-10-23
- **Estado:** **APROBADA TRAS REAUDITORÍA INDEPENDIENTE**
- **Rama:** `tarea/CORRECCION-ANIMACION-KRATOS-01`
- **Etapa asociada:** `GOW8B-ART-KRA` / `GOW8B-FINAL-01`
- **Autorización de la usuaria:** Opción 1 autorizada explícitamente el 2026-10-23.

---

## 1. Hallazgo de Auditoría y Evidencia Medida

- **Defecto:** Falso positivo en la auditoría inicial de `GOW8B-ART-KRA`. Los sprites generados por IA sustituyeron la animación viva por fotogramas estáticos duplicados:
  - En `kratos-run.png`, los fotogramas 1 a 5 presentaban una variación casi nula (entre 97 y 243 px; más del 90 % de pérdida cinemática).
  - En la región de las piernas ($y \in [30, 59]$), la caja delimitadora en los cuadros 1 a 5 era idéntica (`[23, 0, 71, 29]`) con recuento plano (703–710 px), provocando que Kratos se deslizara como una figura rígida.
  - En `kratos-idle.png`, la variación cayó de 746 px a 114 px (1.9 %), paralizando la respiración y la presencia viva del personaje.
- **Evidencia registrada:** Mosaico comparativo en `scratch/audit/run_cycle_audit_comparison.png` y reporte formal en `AUDITORIA_CRITERIO_ANIMACION_KRATOS.md`.

---

## 2. Archivos Exactos Modificados

1. `public/assets/characters/kratos-idle.png`
2. `public/assets/characters/kratos-run.png`
3. `public/assets/characters/kratos-air.png`
4. `public/assets/characters/kratos-attack.png`
5. `public/assets/characters/kratos-roll.png`
6. `public/assets/characters/kratos-neutral.png`
7. `docs/referencias/kratos-anim-contact-sheet.png`

*Método de restauración:* Ejecución de `python3 scripts/gen-kratos-anim.py` (el generador cinemático articulado que modela la zancada, cadera, extremidades y rotaciones óseas exactas a 60 Hz).

---

## 3. Criterios de Aceptación y Evidencia de Reauditoría

1. **Restitución del Delta de Movimiento en Carrera (`kratos-run.png`):**
   - Transición 0 $\to$ 1: **1176 px** (> 900 px, CUMPLE).
   - Transición 1 $\to$ 2: **1598 px** (> 900 px, CUMPLE).
   - Transición 2 $\to$ 3: **972 px** (> 900 px, CUMPLE).
   - Transición 3 $\to$ 4: **1157 px** (> 900 px, CUMPLE).
   - Transición 4 $\to$ 5: **1332 px** (> 900 px, CUMPLE).
   - Transición 5 $\to$ 0: **1105 px** (> 900 px, CUMPLE).
   - *Promedio:* **1223.3 px/cuadro** de movimiento dinámico real.
2. **Restitución de la Respiración en Reposo (`kratos-idle.png`):**
   - Transición 0 $\to$ 1: **377 px** (incremento del 330 % sobre los 114 px de la versión congelada, respiración y vaivén nítidos con paleta canónica de 6 colores).
3. **Consistencia de Invariantes Técnicas:**
   - Formato por cuadro: exactamente **97×59 px**.
   - Anclaje al suelo estricto: contacto con la fila $y=58$ (`bbox[3] == 59`) en todos los cuadros.
   - Canal alfa 100% binario ($a \in \{0, 255\}$).
   - Paleta canónica de 6 colores oficiales de `kratos-neutral.png`.
4. **Verificación de Simulación y No Regresión:**
   - `pnpm exec tsc --noEmit && pnpm build` con salida 0.
   - 0 fugas de arnés (`grep -rn "__GOW8B" dist/` = 0).
   - Batería completa de 28 casos en Chrome CDP (`capture-combat.mjs`) aprobada al 100% con 0 errores de consola.

---

## 4. Dictamen de Reauditoría

- Subagente implementador: `fe4b68ad-846c-4e1a-a931-fac862b33ce6`.
- Subagente auditor del plan: `01acf36e-053e-4f48-b4d9-de32dea2e091` (Aprobó el plan).
- Subagente auditor independiente de reauditoría: `9bf6a9d4-70f7-4e9f-9238-b78d23c111b1` (Dictamen: **APROBADA**).
