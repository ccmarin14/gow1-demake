# Plan de implementación — `GOW1-COMBAT-POLISH-01` (Pulido de fluidez, alcance y elasticidad de las Cuchillas del Caos)

- **Fecha:** 2026-10-22
- **Estado:** **APROBADO** tras auditoría independiente de solo lectura (2026-10-22).
- **Decisiones asociadas:** `D-03`, `D-08`, `D-20`, `D-24` ([`docs/decisiones.md`](../decisiones.md)).
- **Etapas del plan cubiertas:** Pulido transversal de combate (Bloque 3: `GOW8B-LIGHT-01`, `GOW8B-HEAVY-01`, `GOW8B-COMBO-01`, `GOW8B-FINISH-01`).

---

## 1. Diagnóstico y Objetivos

A partir de la inspección del combate actual y del feedback sobre ataques que se sienten "cortos" y con falta de fluidez, se identifican 7 causas raíz a resolver:

1. **Alcance físico insuficiente (cadenas cortas):** Con un Kratos de 97×59 px en un lienzo de 480 px, los radios actuales (42 a 56 px) apenas sobresalen ~20 px del puño. Deben aumentarse a **76–96 px** en ataques ligeros, **110 px** en *Plume of Prometheus* y **135 px** en el agarre `L` para transmitir el alcance masivo de las Cuchillas del Caos de PS2.
2. **Duración activa efímera (golpe que pasa en un parpadeo):** 5 ticks (83 ms) a 60 fps impiden apreciar la estela curva. La fase activa se extenderá a **7–9 ticks (117–150 ms)** con seguimiento visible y desvanecimiento de estela.
3. **Parpadeo y desaparición visual del arma entre golpes:** `WeaponLayer` oculta la cadena en `startup` y a partir del tick 2 de `recovery`. Al encadenar `J → J → J` o `J → J → K`, la cadena desaparece durante 50–80 ms y reaparece de golpe. Se garantizará **continuidad espacial**: la cadena mantendrá su tensión y trayectoria conectando el final de un golpe con el arranque del siguiente sin parpadear.
4. **Cinemática lineal vs. latigazo elástico:** La progresión lineal $p = t / T$ hace que las cadenas giren a velocidad constante como una varilla rígida. Se incorporará una curva de aceleración explosiva con chasquido al final del arco y amplitud transversal proporcional al radio ($A = 5 \dots 9\text{ px}$).
5. **Alternancia de poses del cuerpo de Kratos:** `light_1`, `light_2` y `light_3` usan actualmente la misma pose estática (`poseFrame: 1`). Se añadirá una pose de tajo cruzado con la mano izquierda adelantada para alternar fluidamente brazo derecho e izquierdo en la animación de Kratos.
6. **Input Buffering (reserva de golpe):** Se añadirá un buffer de entrada de 4 ticks (~66 ms) para que pulsar durante el `startup` o durante la congelación de *hitstop* no se pierda y el combo fluya sin trabas.
7. **Sustentación aérea y paso al frente:** Gravedad atenuada al 30 % durante el tajo en el aire para mantener el malabar aéreo, y deslizamiento con inercia en el remate de `light_3`.

---

## 2. Parámetros ajustados de combate (`src/config.ts`)

| Movimiento (`moveId`) | Radio actual $\to$ **Nuevo radio** | Duración `active` actual $\to$ **Nueva** | Amplitud de onda ($A$) | Pose Kratos (`poseFrame`) | Efecto cinemático |
| --- | --- | --- | --- | --- | --- |
| `light_1` | 42 px $\to$ **76 px** | 5 t $\to$ **7 t** (117 ms) | 5.5 px | Cuadro 1 (brazo der.) | Barrido ascendente con aceleración elástica. |
| `light_2` | 46 px $\to$ **82 px** | 5 t $\to$ **7 t** (117 ms) | 6.0 px | **Cuadro 6 (brazo izq.)** | Tajo cruzado alternando guardia y torso. |
| `light_3` | 52 px $\to$ **96 px** | 6 t $\to$ **8 t** (133 ms) | 7.5 px | Cuadro 2 (paso doble) | Gran remate amplio con paso fluido al frente. |
| `plume_of_prometheus` | 56 px $\to$ **110 px** | 7 t $\to$ **9 t** (150 ms) | 9.0 px | Cuadro 3 (overhead) | Azote masivo contra la cubierta con chispas ampliadas. |
| `heavy_slam` | 50 px $\to$ **95 px** | 6 t $\to$ **8 t** (133 ms) | 8.0 px | Cuadro 3 (overhead) | Golpe pesado contra el suelo. |
| `ascension` | 48 px $\to$ **88 px** | 6 t $\to$ **8 t** (133 ms) | 7.0 px | Cuadro 4 (launcher) | Arco vertical extendido hacia el cielo. |
| `air_light_1` / `air_light_2` | 42 px $\to$ **75 px** | 5 t $\to$ **7 t** (117 ms) | 5.5 px | Cuadro 1 y 6 | Malabar circular con gravedad reducida al 30 %. |
| `air_heavy_slam` | 52 px $\to$ **95 px** | 6 t $\to$ **8 t** (133 ms) | 8.0 px | Cuadro 3 (picado) | Picado en picada con estela continua hasta el suelo. |
| `chain_grab` | 64 px $\to$ **135 px** | 6 t $\to$ **9 t** (150 ms) | 0 px (recta) | Cuadro 5 (agarre) | Lanzamiento horizontal a larga distancia. |

---

## 3. Arquitectura y Archivos exactos a modificar

| Archivo | Cambios previstos |
| --- | --- |
| `src/config.ts` | Actualizar la tabla `MOVES` con los nuevos radios (75–135 px), tiempos de `active`/`recovery`, amplitud de onda `waveAmp`, y configuración de `inputBufferTicks = 4`. |
| `src/sim/types.ts` | Añadir campos a `EntityState`: `attackBufferAction: GameAction \| null`, `attackBufferTicks: number`. |
| `src/sim/attack.ts` | 1. Implementar curva elástica de progreso: $p = 1 - (1 - u)^3$ (*easeOutCubic*).<br>2. Sistema de *Input Buffering*: si entra una acción en `startup` o durante `hitstop`, guardarla y procesarla tan pronto se abra la ventana.<br>3. Sustentación aérea: gravedad multiplicada por 0.30 durante la ventana activa de `air_light`. |
| `src/sim/world.ts` | Alimentar el buffer de ataque en cada tick; respetar la inercia de `lungeVx` bloqueando la inversión instantánea de `facing` mientras dura la fase activa. |
| `src/scale.ts` | Actualizar las fórmulas puras de envolventes derivadas para que consuman automáticamente los nuevos radios sin romper `CONFIG.scale`. |
| `src/entities/WeaponLayer.ts` | 1. Eliminar el parpadeo en `startup`: renderizar la cadena con tensión elástica entre el puño y la postura de inicio del nuevo tajo.<br>2. Mantener la retracción fluida en `recovery` hasta que la fase vuelve a `none`.<br>3. Escalar la amplitud de la onda transversal según el radio del movimiento.<br>4. Ajustar el trazado de la estela (*crescent trail*) para el nuevo radio ampliado. |
| `scripts/gen-kratos-anim.py` | Generar cuadro 6 en `kratos-attack.png` (pose de tajo con mano izquierda cruzando el torso) verificando anclaje en $y=58$ y paleta exacta de 6 colores. |
| `src/scene/ShellScene.ts` | Mapear `light_2` al nuevo cuadro 6 de ataque, manteniendo la sincronización entre sprite y coordenadas del puño. |

---

## 4. Estrategia de verificación en navegador con Chrome CDP y `ffmpeg`

1. **Automatización en navegador (Chrome Headless + CDP):**
   - Script estándar del proyecto en `scripts/verification/capture-combat.mjs` que levanta dev server en puerto aislado (ej. 5187) y avanza la simulación tick a tick en el escenario `combat`.
   - Captura de secuencias continuas de fotogramas del `<canvas>` real guardadas en `scripts/verification/output/`.
2. **Generación dual de evidencias:**
   - **Mosaicos PNG multi-tick:** para inspección de cuadrícula estática mediante `read_file` por parte del auditor.
   - **GIFs animados a 60 fps con `ffmpeg`:**  
     `ffmpeg -framerate 60 -i frame_%03d.png -filter_complex "[0:v] split [a][b];[a] palettegen [p];[b][p] paletteuse" combat-flow.gif`  
     Permite validar la fluidez del movimiento continuo a velocidad nativa sin cortes.
3. **Casos de prueba obligatorios:**
   - Combo ligero continuo `J, J, J`: verificar que la cadena nunca desaparece entre tajos y que Kratos alterna brazos.
   - Remate *Plume of Prometheus* `J, J, K`: verificar el azote con radio de 110 px contra la madera de la cubierta.
   - Malabar aéreo y picado: *Ascension* $\to$ salto $\to$ `J` aéreo $\to$ `K` aéreo, verificando la sustentación en el aire.
   - Agarre a larga distancia `L`: verificar el lanzamiento horizontal hasta 135 px.

---

## 5. Criterios de Aceptación y Regresiones Protegidas

### Criterios de aceptación
1. **Alcance notablemente mayor:** Todos los tajos cubren entre 75 y 135 px de radio; la hoja vuela holgadamente por delante de Kratos sin sentirse corta.
2. **Continuidad visual sin parpadeos:** Cero fotogramas donde la cadena desaparezca durante cancelaciones de combo o recuperaciones de golpe.
3. **Sensación elástica:** La cadena acelera y chasquea con curvatura visible proporcional al tamaño del golpe.
4. **Alternancia de poses:** `light_1` y `light_2` muestran posturas anatómicas diferenciadas de Kratos (mano derecha vs. izquierda).
5. **Input Buffering receptivo:** Las pulsaciones realizadas con 3–4 ticks de anticipación o durante el impacto conectan el combo fluidamente sin trabas.
6. **Evidencias en navegador:** Mosaicos PNG y GIFs a 60 fps generados con `ffmpeg` verificados por el auditor independiente en modo de solo lectura.

### Regresiones protegidas
- Determinismo matemático: misma traza $\to$ mismo checksum; `record`/`replay` idénticos.
- Cero asignaciones de memoria por tick en `WeaponLayer` y `ShellScene`.
- Movimiento horizontal, salto simple (apex 69.056 px), doble salto (120.389 px) y rodada terrestre (14 ticks invulnerables, 4 cuadros de somersault) intactos.
- `pnpm exec tsc --noEmit` y `pnpm build` exit 0; `__GOW8B` y `scaleOverlay` ausentes del bundle de producción.

---

## 6. Resultados y Evidencia de Auditoría (2026-10-22)

- **Implementador:** subagente `3f047921-b5ee-44df-a948-2eae9cd8cdd0`
- **Auditor independiente (solo lectura):** subagente `9bf6a9d4-70f7-4e9f-9238-b78d23c111b1`
- **Veredicto:** **APROBADO** (8/8 criterios cumplidos, 0 hallazgos bloqueantes)
- **Baseline Checksums actualizados:**
  - `CONFIG.scale` (`scaleChecksum`): `07429977`
  - `init_empty`: `5ae64ce0`
  - `init_test`: `c8d0f3aa`
  - `init_movement`: `40c23471`
  - `init_platforms`: `40c23471`
  - `init_combat`: `69c62850`
  - `combat60`: `f8185a7c` (deterministicReplayMatch = true)
- **Evidencias en navegador (`scripts/verification/output/`):**
  - `combo_jjj_mosaic.png` y `combo_jjj.gif`: 36 ticks sin parpadeo de cadena, alternancia fluida de brazos (1 -> 6 -> 2).
  - `plume_finish_mosaic.png` y `plume_finish.gif`: 40 ticks con azote masivo de 110 px contra la cubierta, chispas pixel-art en suelo y lanzamiento del objetivo a `vy = -223.3`.
  - `ascension_air_dive_mosaic.png` y `ascension_air_dive.gif`: 44 ticks con elevación a $y=220$, flotación con gravedad al 30 % en `air_light_1` (apenas 3 px de caída en 83 ms) y picado pesado contra la cubierta.
  - `chain_grab_mosaic.png` y `chain_grab.gif`: 24 ticks con extensión rectilínea de 20 eslabones hasta 135 px y tracción inmediata del enemigo.
