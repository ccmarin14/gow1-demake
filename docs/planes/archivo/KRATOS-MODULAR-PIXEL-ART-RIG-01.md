# Plan de Trabajo — `KRATOS-MODULAR-PIXEL-ART-RIG-01`
## Consistencia Visual Absoluta y Ciclo de Carrera por Rigging Modular Rasterizado

- **Fecha:** 2026-10-23
- **Estado:** EN EJECUCIÓN; muestra conectada v2 APROBADA para viabilidad tras reauditoría, sin integración productiva (2026-10-23)
- **Rama de la muestra:** `tarea/kratos-modular-sample`, base `e9d9a34`
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

---

## 6. Prueba reversible de viabilidad (2026-10-23)

**Resultado: no extender ni integrar esta muestra.** Rotar recortes de las
pantorrillas deja uniones separadas y recorta pies. Esto rechaza esta implementación,
no demuestra que un rig modular con articulaciones completas sea inviable.

### Alcance autorizado y preservación

El usuario respondió «hazlo» a la propuesta de probar primero una muestra pequeña
y reversible, conservando el original y el movimiento aprobado. No se autorizó
reemplazar las hojas productivas ni completar todas las fases de este plan.

- Se generaron cuatro poses de 97×59 a partir del maestro existente, sin dibujar
  anatomía con líneas. Cabeza, torso y brazos permanecen fijos; solo giran dos
  recortes de piernas. **No es un rig completo ni una carrera terminada.**
- Las seis hojas productivas y todo `src/` coinciden con la base `e9d9a34`.
- Generador: `scripts/build-kratos-modular-sample.py`.
- Prueba: `PYTHONDONTWRITEBYTECODE=1 python3 -m unittest scripts/test_kratos_modular_sample.py`.
- Regeneración: `python3 scripts/build-kratos-modular-sample.py`.
- Salidas locales: `scratch/kratos_modular_sample/` (ignorado por Git; no publicado).

### Hallazgos y comprobaciones

| Comprobación | Resultado observado |
| --- | --- |
| Uniones y volumen | FALLIDO: los recortes giran sobre centros de pantorrilla, no sobre rodillas conectadas a muslos articulados. |
| Encuadre | FALLIDO: el auditor reprodujo 4 píxeles fuera del lienzo en `run-03` y 2 en `run-04`. |
| Apoyo | NO DEMOSTRADO: conservar sombra/píxeles originales de la fila 58 hace que el extremo de la caja no pruebe apoyo del pie. |
| Identidad superior y armas | Inspección visual: cabeza, torso y brazos heredados; una cuchilla por mano en esta muestra. No inferido de contar colores. |
| Integridad raster | Una prueba determinista pasa: dimensiones, alfa binario, paleta de origen, poses distintas, reproducibilidad y conservación de producción. No comprueba anatomía. |
| Ejecución real | Chrome/Vite aislados en puerto 5198; sustitución temporal de referencias del clip en memoria, sin editar el juego. Índices `1,2,3,4,5,6,7,8,1`; cuatro poses repetidas conservando el clip existente. |
| Movimiento medido | 71,166667 px en 566,667 ms simulados; rotación del sprite 0, escala 1. Son parámetros del juego preservados, no aprobación artística. |
| Consola | 0 errores; 1 advertencia de rendimiento Canvas2D causada por la instrumentación. |
| Silueta contra fondo | NO VALIDADA: la diferencia entre capturas incluyó 140 píxeles cambiados en una región de control del fondo. No se presenta como una silueta aislada. |
| Regresión de combate | Suite de 28 casos NO ejecutada: no hubo integración ni cambios de simulación. No se declara 28/28. |

Evidencia local: `contact-sheet.png`, `run-feasibility.gif`, `provenance.json`,
`browser-idle-vs-sample-run.png` (recortes del juego real a 4×),
`browser-runtime-measurements.json` y `browser-silhouette-measurements.json`,
todos bajo `scratch/kratos_modular_sample/`.
La referencia de animación original fue restaurada tras la prueba.

### Roles y corrección acotada

- Implementador: Codex nativo, `gpt-6-luna/high`; sustitución explícita porque
  `gpt-6.1-luna` no está ofrecido por este runtime.
- Auditor independiente: Codex nativo, `gpt-6.1-sol/medium`. Su canal MCP chocó
  con el perfil ya abierto; el orquestador transportó sus consultas por su sesión
  Chrome disponible. El auditor inspeccionó las imágenes y comprobó los hashes
  independientemente.
- El auditor rechazó además el nombre de archivo fuera de la superficie
  autorizada. El orquestador presentó el plan de corrección, el auditor lo
  aprobó y el implementador renombró el generador sin cambiar sus bytes.
- Otro auditor, Codex nativo `gpt-6.1-sol/medium`, verificó únicamente esa
  corrección: prueba pasa, nueve artefactos regenerados idénticos y producción
  intacta. Esto no cambia el rechazo visual.
- Evaluación nativa con los dos scripts nuevos declarados: riesgo `medium`,
  `review_due=false`, motivo `under_budget`. No se inició una revisión nativa
  ni se emitió aprobación artística.

**Siguiente decisión:** no continuar con estos recortes de pantorrilla. Un nuevo
ensayo necesitaría piezas completas con pivotes y solapes de articulación,
separando sombra y pies. Dibujar anatomía oculta o rediseñar el maestro requiere
acordar ese alcance antes de ampliar el trabajo. Sin commits, push ni publicación.

## 7. Corrección conectada v2 tras reapertura (2026-10-23)

**Resultado: APROBADA como muestra de viabilidad, no como animación final.**
El usuario pidió continuar; la primera prueba solo de pantorrillas no representaba
el enfoque propuesto. El auditor que informó los defectos aprobó el plan antes
de editar; el implementador corrigió la muestra y otro auditor revisó los mismos
hallazgos. Se conserva la evidencia v1 sin cambios.

### Qué se corrigió

- Se articulan seis recortes del maestro: muslo, pantorrilla y pie de cada lado.
  Comparten anclajes de cadera, rodilla y tobillo con solapes de píxeles existentes.
  No se dibujó anatomía nueva ni se inventaron regiones ocultas.
- Las cuatro fases tienen movimiento de muslos y flexión de rodillas; los pies
  de apoyo se miden separados de la sombra eliminada de la base.
- Se conservan lienzos ampliados anteriores al recorte y capas por pieza para
  que el auditor pueda medir las uniones y el encuadre independientemente.

### Evidencia de la corrección

| Comprobación | Resultado |
| --- | --- |
| RED sobre defectos anteriores | El implementador reprodujo componentes separados de 944/39 píxeles, 39 píxeles de sombra fija y recorte de 4/2 píxeles; no se usó la ausencia de v2 como RED. |
| Pruebas de v2 | 6/6 pasan; el orquestador y el reauditor las ejecutaron de nuevo. |
| Uniones | Solapes reales mínimos cadera/rodilla/tobillo: 8/8/7 píxeles; cada cuadro tiene un componente anatómico conectado. |
| Apoyo | Pie de contacto en fila 58; pies en vuelo terminan en 54/55. Base sin sombra en fila 58. |
| Encuadre | 0 píxeles fuera del cuadro en las 24 capas ampliadas y los cuatro compuestos previos al recorte. |
| Procedencia | El reauditor reconstruyó las 24 capas transformadas idénticas a partir de los seis recortes originales. Muslos con filas de 4–8 píxeles, no líneas generadas. |
| Reproducibilidad | 73/73 artefactos centrales regenerados idénticos. Los artefactos del navegador son evidencia adicional, no parte de esos 73. |
| Motor real en Chrome | 42 pasos de `Phaser.Game.step`, con entrada sintética normal y reloj controlado a 60 Hz. Índices `1,2,3,4,5,6,7,8,1,2,3`; cuatro poses repetidas conservando las ocho referencias y el timing original. |
| Movimiento y regresión | 89,833333 px en 700 ms simulados. Los 42 estados de movimiento y checksums de simulación coinciden con repetir la entrada usando la animación original. Rotación 0 y escala 1. |
| Silueta real | 967 píxeles de diferencia entre jugador visible/oculto; el reauditor recomputó exactamente la máscara. Dos redibujados de control son idénticos y `snapshot.frame` permanece en 42: no avanza el fondo entre capturas. |
| Consola | 0 errores y 0 advertencias en la prueba corregida. |
| Protección | Las seis hojas productivas, `src/` y los nueve artefactos v1 siguen idénticos. Referencias de animación originales restauradas. Sin integración, commits ni publicación. |

**Límites explícitos:** las trazas de tiempo real estuvieron estranguladas y se
descartaron; el reloj controlado demuestra ejecución y avance del motor, no
rendimiento a tiempo real ni sensación con teclado físico. La pose original
es de tres cuartos/frontal y el ajuste vertical aproxima los muslos al faldón:
esta muestra no es una carrera lateral pulida ni sustituye las demás animaciones.
La suite de 28 casos de combate no se ejecutó porque no se modificó producción.

### Reproducir y revisar

```bash
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest scripts/test_kratos_modular_sample.py
python3 scripts/build-kratos-modular-sample.py --output-dir scratch/kratos_modular_sample/v2
```

Evidencia en `scratch/kratos_modular_sample/v2/`: `contact4x.png`,
`source-masks-and-pivots.png`, `run-sheet.png`, `provenance.json`,
`browser-idle-v1-v2-4x.png`, `browser-idle-vs-run-4x.png`,
`browser-runtime-measurements.json` y `browser-silhouette-raw.png`.
Los archivos locales ignorados no se han publicado.

Implementador: Codex `gpt-6-luna/high`. Auditor del plan y reauditor de la
corrección: agentes distintos, ambos Codex `gpt-6.1-sol/medium`.
La reauditoría aprueba únicamente esta muestra conectada y sus defectos corregidos.
Evaluación nativa: `medium`, `review_due=false`, motivo `under_budget`.
