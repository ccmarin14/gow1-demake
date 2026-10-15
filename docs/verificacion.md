# Guía de verificación

> **Estado vigente:** solo está ejecutable el shell neutral Phaser/Vite en lienzo lógico horizontal 320×180. No hay gameplay, controles de juego, arte ni audio activos. Las aprobaciones anteriores pertenecen al prototipo descartado y son historial, no pruebas del shell ni del producto futuro. `DOC-ALIGN-01` cerró la alineación documental; las etapas 1 `GOW8B-VIS-01`, 2 `GOW8B-KRA-01`, 3 `GOW8B-ENV-01` y 4 `GOW8B-CMP-01` están aprobadas. `GOW8B-CMP-01` queda aprobada con verificación visual humana **diferida y no bloqueante** (§CMP-01). La etapa 5 `GOW8B-DEV-01` (contrato y harness DEV) está **implementada y pendiente de auditoría independiente** (2026-10-15); no se presume aprobada.

## Fuente de verdad y estado

La dirección futura es una adaptación web horizontal con resolución interna de 480×270 (D-12) de la historia de *God of War 1* de PS2, con lectura, estructura lateral, estética y mecánicas estudiadas en *God of War: Betrayal*. La jugabilidad lateral de *Betrayal*, incluida su **verticalidad**, es el **baseline a igualar o superar** en la versión web (D-20), como intención de diseño concretada en los criterios de cada etapa. Todo recurso integrado será original; referencias externas son solo material de estudio. El primer objetivo narrativo es el Egeo y la Hidra. Ninguno de estos contenidos está implementado en el shell. La presentación prevista escala el canvas para una ventana amplia del navegador, con pixelado nítido y sin suavizado; la resolución interna no limita su tamaño CSS.

La lista siguiente reemplaza como plan vigente la secuencia histórica de 22 etapas del prototipo descartado. `GOW8B-VIS-01`, `GOW8B-KRA-01`, `GOW8B-ENV-01` y `GOW8B-CMP-01` están aprobadas tras auditoría; no hay etapa de juego activa. Las etapas posteriores siguen pendientes. La activación no presume aprobación.

El 2026-10-15, a partir de `investigacion-y-definicion.md`, se añadieron tres etapas al plan —**13 Bloqueo y parry** (H-1), **18 Finisher contextual** (H-2) y **22 Orbes, cofres y mejoras** (H-3)— y se incorporaron a criterios los hallazgos **PR-01** (umbrales de game feel), **PR-02** (trazas y paso fijo en el harness) y **PR-03** (separación de enemigos). El plan pasó de 26 a **29 etapas**. Las etapas ya aprobadas y la etapa 4 `GOW8B-CMP-01` no cambiaron de contenido. El mismo día se fijó **D-20** (PR-07): la jugabilidad lateral de *Betrayal*, incluida su verticalidad, es el baseline a igualar o superar, concretado en el alcance vertical de la etapa 8 y en los umbrales de las etapas de combate.

## Etapas y criterios de aceptación

| Orden futuro | Tarea principal | Criterio de salida por definir en su ticket | Estado |
| --- | --- | --- | --- |
| DOC-ALIGN-01 | Alinear documentación al nuevo ciclo | Documentos distinguen shell, visión e historial; enlaces y afirmaciones verificadas. | Documental; cierre de esta tarea, no etapa de juego. |
| 1 / GOW8B-VIS-01 | Referencia visual horizontal original | PNG conceptual original 480×270; ImageGen produjo la referencia y `/usr/bin/pngquant --nofs` hizo la cuantización local; reauditoría aprobó dimensiones, opacidad, 19 colores, bordes y lectura visual. | Aprobada; provisional, no integrada al runtime. |
| 2 / GOW8B-KRA-01 | Pose y silueta neutral de Kratos | PNG conceptual provisional 480×270, 7 colores, bounds 97×59 px; transparencia en tabla alpha; lectura nativa, silueta y nearest-neighbor 2× aprobados. | Aprobada; provisional, no integrada al runtime. |
| 3 / GOW8B-ENV-01 | Escenario del Egeo | PNG opaco 480×270, 19 colores; auditoría aprobó cielo/tormenta, mar/olas, barco/baranda y cubierta transitable a 1×/2× nearest-neighbor. | Aprobada; provisional, fuera del runtime. |
| 4 / GOW8B-CMP-01 | Integración visual Kratos + Egeo | Una composición de los assets aprobados de etapas 2 y 3; criterios detallados bajo la tabla. | Aprobada con verificación visual humana diferida (no bloqueante); provisional, no integrada al runtime. |
| 5 / GOW8B-DEV-01 | Contrato y harness DEV | Infraestructura de simulación determinista y harness DEV sin gameplay; criterios detallados en §GOW8B-DEV-01. **Trazas de input grabables y paso fijo desacoplado del render (PR-02, D-16).** | Implementada; auditoría independiente pendiente. |
| 6 | Movimiento horizontal | Respuesta izquierda/derecha, aceleración, frenado y límites. **Respuesta al input ≤100 ms ≈ 6 frames (PR-01).** | Pendiente; no activa. |
| 7 | Animación de carrera | Pose y transición sincronizadas con movimiento. | Pendiente; no activa. |
| 8 | Salto y plataformas | Ascenso, aire, caída, aterrizaje y bordes. **Coyote time 60–100 ms y jump buffer ~100 ms (PR-01).** **Alcance vertical: al menos dos niveles de altura alcanzables y saltos encadenados entre plataformas, igualando o superando la verticalidad de *Betrayal* adaptada a 480×270 (D-20).** | Pendiente; no activa. |
| 9 | Ataque ligero inicial | Una acción completa con estado, pose, hitbox, contacto y recuperación. **Respuesta al input ≤100 ms (PR-01).** | Pendiente; no activa. |
| 10 | Continuación del combo ligero | Encadenamiento y contactos adicionales. **Respuesta al input ≤100 ms (PR-01).** | Pendiente; no activa. |
| 11 | Ataque pesado | Preparación, impacto, recuperación, alcance y lectura audiovisual. **Respuesta al input ≤100 ms (PR-01).** | Pendiente; no activa. |
| 12 | Esquiva | Dirección, distancia, duración, invulnerabilidad y recuperación. **Respuesta al input ≤100 ms (PR-01).** | Pendiente; no activa. |
| 13 | Bloqueo y parry **(nueva, H-1)** | Sostener bloqueo, coste/ventana de parry, retroceso al bloquear y recuperación; legible y separado de la esquiva. **Respuesta al input ≤100 ms (PR-01).** | Pendiente; no activa. |
| 14 | Respuesta al daño | Pérdida de vida, retroceso, interrupción, protección y derrota. **Respuesta al input ≤100 ms (PR-01).** | Pendiente; no activa. |
| 15 | Arte del combatiente | Silueta y poses del primer arquetipo enemigo. | Pendiente; no activa. |
| 16 | Arte del arquero | Silueta y pose de ataque diferenciables. | Pendiente; no activa. |
| 17 | Conducta del combatiente | Aproximación, aviso, ataque, recuperación y derrota. **Separación de enemigos: no agresivos en círculo alrededor de Kratos, agresivos lo invaden (PR-03).** | Pendiente; no activa. |
| 18 | Finisher contextual **(nueva, H-2)** | Enemigo debilitado muestra señal explícita; `E` ejecuta un remate opcional con ventana de input tolerante y respuesta visual clara. | Pendiente; no activa. |
| 19 | Conducta del arquero | Posición, anticipación, trayectoria y recuperación. | Pendiente; no activa. |
| 20 | Flujo y ritmo de oleadas | Aparición, barrera, despeje, liberación y cantidad de enemigos. **Separación y distancia ajustables por dificultad (PR-03).** | Pendiente; no activa. |
| 21 | Checkpoint | Activación, estado guardado y reintento. | Pendiente; no activa. |
| 22 | Orbes, cofres y mejoras **(nueva, H-3)** | Orbes verde/rojo/azul, cofres entre segmentos y una mejora de arma con coste y efecto legibles. | Pendiente; no activa. |
| 23 | Arte de la Hidra | Cabeza, silueta y poses a escala del escenario. | Pendiente; no activa. |
| 24 | Combate de la Hidra | Avisos, patrones, daño, ventanas vulnerables y resultado. | Pendiente; no activa. |
| 25 | Interfaz | Inicio, HUD, pausa y estados terminales. | Pendiente; no activa. |
| 26 | Efectos visuales | Impactos, clima y cámara sin tapar lectura. | Pendiente; no activa. |
| 27 | Audio | Eventos diferenciables y balanceados después de prueba de escucha. | Pendiente; no activa. |
| 28 | Partida completa | Recorrido futuro con controles normales, duración y consola. | Pendiente; no activa. |
| 29 | Auditoría final | Revisión independiente del producto futuro integrado. | Pendiente; no activa. |

### Etapa 1 aprobada — GOW8B-VIS-01

El asset conceptual original es `docs/referencias/concepto-egeo-480x270.png`. ImageGen generó una primera salida de 1672×941 que se tuvo que ajustar; el archivo final es PNG indexado exacto de 480×270, opaco y con 19 colores, cuantizado localmente mediante `/usr/bin/pngquant --nofs`. La auditoría independiente inicial quedó parcial al medir 56.246 colores; el mismo auditor aprobó el plan de cuantización antes de aplicarlo. La reauditoría aprobó dimensiones, opacidad, paleta de 19 colores, bordes nearest-neighbor y lectura de Kratos, Hidra y cubierta.

Kratos mide aproximadamente 75–80 px, por encima del punto de partida recomendado de 57–63 px; es una variación visual no bloqueante que se considerará al establecer la pose en la etapa 2. No hubo Git usable para diff, ni código, build, tests o runtime/browser; el shell permanece en 320×180 y el asset no está integrado. La aprobación cubre la referencia conceptual, no gameplay.

### Etapa 2 aprobada — GOW8B-KRA-01

El asset `docs/referencias/kratos-neutral-480x270.png` es una referencia provisional de 480×270, PNG indexado con 7 colores. La tabla de transparencia contiene píxeles transparentes y parciales; no hay un canal RGBA separado. Bounds opacos `(192,204)–(288,262)` equivalen a 97×59 px, cumplen el rango de altura 57–63 px y dejan 8 px de margen inferior.

Kratos es reconocible, con piel pálida, marca roja, dos hojas y cadenas, orientado a la derecha. Auditor Codex Luna High aprobó lectura nativa, silueta y nearest-neighbor 2×; aceptó la transparencia parcial de la tabla sin pérdida de lectura. El writer reportó un fallo de Chromium Crashpad al intentar su propio preview; la auditoría confirmó el escalado de forma independiente. No se encontraron referencias en `src`, `public` ni `index.html`, por lo que el PNG no está integrado.

No hubo Git usable para diff; no se ejecutaron build, tests, browser ni runtime. El shell permanece en 320×180. La aprobación cubre el asset visual provisional y no acredita integración ni gameplay.

### Etapa 3 aprobada — GOW8B-ENV-01

El asset `docs/referencias/egeo-fondo-480x270.png` es un PNG indexado, opaco, de 480×270 y 19 colores. A tamaño nativo y 2× nearest-neighbor se leen el cielo/tormenta, mar/olas, barco/baranda y una cubierta ancha transitable. No contiene personajes ni siluetas de criaturas; el carril limpio y cálido contrasta con el futuro Kratos pálido.

Auditor Codex Luna High aprobó el fondo aislado. No se puede validar el contraste real con personajes hasta integrarlo; la textura de tablazón queda como preferencia no bloqueante. El writer reportó Chromium y Firefox headless fallidos; el resize exacto se hizo con script temporal Node built-in y `pngquant`, sin Python. No hubo Git/diff, runtime/browser tests, build ni tests. Una búsqueda no encontró referencias en `src`, `public` ni `index.html`; el asset permanece fuera del runtime. El shell sigue en 320×180.

### Criterios de salida — GOW8B-CMP-01

Crear una sola composición conceptual original a 480×270 usando únicamente los assets aprobados de etapa 2 (`docs/referencias/kratos-neutral-480x270.png`) y etapa 3 (`docs/referencias/egeo-fondo-480x270.png`). No usar el prototipo previo ni screenshots externos. Kratos conserva piel pálida, marca roja, dos hojas/cadenas y proporción de 57–63 px; los pies se apoyan claramente en la cubierta; siluetas y contraste se leen a 1×; la cubierta sigue siendo espacio de juego; paleta final de hasta 49 colores y nearest-neighbor nítido.

No añadir enemigos, Hidra, UI ni animación. La composición es provisional y no se integra al runtime. Mantener el shell 320×180 y ambos assets aprobados intactos. Verificar dimensiones, escala/anclaje, apoyo de pies, contraste y siluetas a tamaño nativo, área transitable, paleta y escalado nearest-neighbor. La aceptación requiere auditoría independiente Codex Luna High de solo lectura; no se presume aprobada antes de ella.

#### Corrección visual — auditoría independiente y cierre

- **Fallo observado:** la salida previa tenía 19 colores frente al límite original de 19. La recomposición generativa anterior también alteró píxeles del fondo fuera de Kratos, por lo que no preservaba la fuente aprobada.
- **Corrección aplicada:** se reconstruyó `docs/referencias/egeo-kratos-composicion-480x270.png` con composición alfa determinista en Pillow, usando como base `egeo-fondo-480x270.png` y superponiendo `kratos-neutral-480x270.png` sin recolocar ni modificar las fuentes. El límite de CMP-01 se elevó a 49 colores por decisión aprobada de la usuaria.
- **Mediciones:** PNG RGB de 480×270, 49 colores; cobertura alfa de Kratos: 1.834 píxeles, bounds `(192,204)–(288,262)` inclusive (97×59 px); diferencias RGB frente al fondo aprobado fuera de cobertura alfa: 0. El margen inferior es 7 px. La inspección local a 1× y a 2× nearest-neighbor mostró piel pálida, marca roja pequeña, dos hojas/cadenas y pies sobre la cubierta.
- **Auditoría independiente (2026-10-15):** la realizó un subagente de solo lectura distinto del implementador (runtime opencode; ese runtime no disponía del modelo «Codex Luna High» que pedía el criterio, sustitución registrada). Resultado **PARCIAL sin fallos medibles**: confirmó 480×270; 49 colores exactos; Kratos de 59 px de alto (rango 57–63); pies en y=262 con 7 px de margen sobre cubierta contigua; **0 píxeles del fondo alterados** fuera de la cobertura alfa; ausencia de referencias en `src`, `public` e `index.html`; y los dos PNG fuente intactos (SHA-256 coincidentes). Añadió una prueba estructural: la composición es **byte-idéntica** a `alpha_composite(fondo, kratos)`, por lo que los atributos aprobados en etapa 2 (piel pálida, marca, hojas/cadenas) se conservan por construcción.
- **Hallazgo no bloqueante:** el auditor no encontró rojo saturado sino un marrón oscuro rojizo (hue ≈ 2°); es propiedad del asset de etapa 2, no una regresión. El PNG de Kratos usa transparencia parcial en todos sus píxeles, así que los bordes se mezclan con el fondo y la silueta podría verse suavizada: riesgo visual a comprobar en la revisión humana diferida.
- **Verificación visual humana diferida (no bloqueante):** ni el auditor ni el orquestador pueden interpretar imágenes en este runtime (el modelo no admite entrada de imagen). Queda como **deuda abierta no bloqueante** que la usuaria, cuando pueda, abra `docs/referencias/egeo-kratos-composicion-480x270.png` a 1× y a 2× nearest-neighbor y confirme: piel pálida, marca roja, dos hojas/cadenas, pies apoyados en la cubierta y silueta/contraste legibles. Si detecta un defecto, se corrige por la compuerta normal (plan → corrección → reauditoría) sin haber detenido el avance.
- **Límites:** no se probó navegador, consola ni runtime porque el asset permanece fuera del juego; no aplican build ni tests de gameplay. No hubo Git utilizable para diff (integridad por SHA-256 documentados). El shell sigue en 320×180.

### Criterios de salida — GOW8B-DEV-01 (etapa 5, activa)

**Objetivo:** establecer el contrato DEV y el bucle de simulación determinista **sin gameplay**. Movimiento, combate, enemigos, arte y audio son etapas posteriores; aquí solo se entrega la infraestructura sobre la que se apoyarán. El contenido del mundo es mínimo (tick, tiempo y un escenario de prueba); no se implementa movimiento ni combate, y los criterios de game feel (PR-01) aplican a partir de la etapa 6.

1. **Simulación separada de Phaser (D-09).** Módulo(s) de simulación que no importan Phaser ni acceden al DOM; el mundo es serializable y avanza con `step(actions)` de forma determinista. Las escenas Phaser presentan el estado, no lo poseen.
2. **Paso fijo desacoplado del render (PR-02, D-16).** La simulación avanza en pasos de duración fija definidos en la configuración (objetivo 60 Hz). Reproducir una misma traza de entrada a distintas tasas de render produce **checksums de estado idénticos por tick**.
3. **Contrato DEV** expuesto solo en desarrollo (`import.meta.env.DEV`) como `window.__GOW8B`, con `snapshot()`, `loadScenario(name)`, `reset()`, `step(frames, actions?)`, `metrics()`, `record()`, `stop()` y `replay(trace)`.
4. **Snapshots serializables (JSON)** con número de frame, tiempo de simulación y estado de entidades.
5. **Escenarios** registrados por nombre, con al menos uno inicial; `loadScenario` y `reset` devuelven un estado conocido y reproducible.
6. **Acciones de dominio, no teclas:** `move-left`, `move-right`, `jump`, `light-attack`, `heavy-attack`, `dodge`, `context-action`, `pause`; `step` acepta acciones de dominio.
7. **Entrada normal separada del harness (D-09).** Un único `InputManager` mapea teclas físicas a acciones de dominio; el harness no depende del teclado.
8. **Trazas de input (PR-02)** grabables por tick y reproducibles con resultado idéntico (mismos checksums).
9. **Métricas** de tiempo por frame, FPS estimado y conteo de objetos/efectos activos.
10. **Configuración centralizada** (tick rate y constantes) en un único módulo de config; sin dispersar números.
11. **El shell sigue ejecutándose.** `pnpm dev` sin errores ni warnings nuevos de consola; `pnpm exec tsc --noEmit` y `pnpm build` con exit 0. Se conserva el canvas 320×180 (el cambio a 480×270 es de su propia tarea; aquí no se toca).
12. **El harness no queda accesible en producción:** la rama DEV no debe exponer `window.__GOW8B` en el bundle de `build`.

**Evidencia exigida:** comandos `pnpm exec tsc --noEmit` y `pnpm build`; prueba en navegador con `pnpm dev` llamando a `window.__GOW8B` (cargar escenario, `step` con traza, `snapshot`/checksum, grabar y reproducir traza, y comparar checksums a 30 y 60 fps); comprobación de regresión de que el shell sigue arrancando sin errores; y auditoría independiente de solo lectura realizada por un subagente distinto del implementador. No se marca aprobada antes de esa auditoría.

#### Implementación de GOW8B-DEV-01 (2026-10-15): evidencia, auditoría pendiente

- **Nota de proceso:** el despacho del subagente implementador se abortó antes de terminar; según `AGENTS.md`, el orquestador ejecutó la implementación directamente y deja constancia. La auditoría independiente sigue pendiente de delegación a un subagente distinto (no se autoaprueba).
- **Archivos nuevos:** `src/config.ts` (constantes centralizadas: `tickRate`, `tickMicros`, tamaño interno), `src/sim/types.ts` (acciones de dominio, `SimulationSnapshot`, `InputTrace`), `src/sim/checksum.ts` (hash FNV-1a + serialización canónica), `src/sim/scenarios.ts` (registro `empty`/`test`), `src/sim/world.ts` (mundo determinista `step`/`snapshot`), `src/sim/engine.ts` (paso fijo con acumulador en microsegundos enteros, grabación y replay), `src/input/InputManager.ts` (teclado → acciones de dominio), `src/dev/harness.ts` (`window.__GOW8B` solo en DEV) y `src/metrics.ts` (`FrameMetrics`: ventana de tiempos por frame y FPS). **Modificado:** `src/main.ts` (escena delgada que delega en la simulación; texto DEV de tick; conserva el aspecto neutral 320×180).
- **Comandos:** `pnpm exec tsc --noEmit` → exit 0; `pnpm build` → exit 0, 17 módulos, con el warning conocido de bundle >500 kB (pre-existente por Phaser). El literal `__GOW8B` aparece **0 veces** en `dist/assets/*.js`, por lo que la rama DEV no se expone en producción. Se eliminó `dist/` y `tsconfig.tsbuildinfo` tras la comprobación.
- **Navegador (`pnpm dev`, puerto 5174):** consola limpia (solo el banner de Phaser 3.90 y la conexión de Vite); el único 404 de red es `favicon.ico`, ausente ya antes de este cambio y no relacionado. `window.__GOW8B` presente en DEV.
- **Determinismo (harness):** `scenarios()` → `["empty","test"]`; `loadScenario('test')` → frame 0, 2 entidades, checksum `5b5b8086`. `replay(traza de 30 ticks)` dos veces → checksum idéntico; `step` por tick vs `replay` → idéntico; `step(30)` vs `step(10);step(20)` → idéntico. Traza de 500 ms alimentada a 60 fps (30×16.666 ms), 30 fps (15×33.333 ms) y de forma irregular (22 deltas que suman 500 ms) → **frame 30 y checksum `10738d3e` en los tres casos**. `record()`/`step`/`stop()` → traza de 20 ticks contiguos; su `replay` reproduce el mismo checksum (`403e0475`).
- **Entrada normal:** un `keydown` sintético de `D` fue mapeado a `move-right` y capturado en una traza grabada, confirmando el camino teclado → acción de dominio separado del harness.
- **Corrección durante la implementación:** el primer acumulador usaba milisegundos en coma flotante y producía 29 ticks en 500 ms (deriva de coma flotante); se cambió a **microsegundos enteros** (`tickMicros = floor(1e6/60)`), tras lo cual 60 fps, 30 fps e irregular dan el mismo resultado.
- **Límites:** el Chromium controlado por DevTools estranguló `requestAnimationFrame` (~2 fps), por lo que el bucle de render en vivo no pudo ejercitarse a tasa normal; la determinación del paso fijo se verificó a través del harness y por lectura de código. La captura de pantalla se tomó pero el modelo no puede interpretar imágenes (sin entrada de imagen), así que no se afirma una revisión visual. No hay Git ni `diff`; la integridad es por lectura directa de los archivos. No se probó teclado físico ni sensación humana. Todo esto es infraestructura DEV; no hay gameplay ni se activa ninguna etapa de juego.

## Método de verificación para tareas futuras

Antes de implementar cada tarea, el orquestador define una sola tarea activa, superficies y aceptación. El implementador prueba los criterios aplicables; un auditor distinto revisa en solo lectura y repite una regresión breve de funciones ya aprobadas. Se registran fallos, limitaciones y aprendizaje agnóstico. Una tarea parcial o fallida no habilita la siguiente.

- **Capturas visuales** permiten revisar apariencia, encuadre, contraste y el frame visible; no demuestran por sí solas el estado interno, los controles ni el timing completo.
- **Snapshots o métricas DEV** pueden demostrar estado serializable y frame controlado; no prueban lectura visual ni una partida con controles normales.
- **Controles normales** se prueban en navegador con entradas reales para evaluar que la acción llega al juego y la respuesta es jugable. Los eventos sintéticos deben etiquetarse como sintéticos; no equivalen a teclado físico ni a sensación humana.
- Los pasos y escenarios controlados pueden complementar la reproducción de bordes y estados, pero no sustituyen un recorrido de juego con controles normales.
- Cuando aplique, la comprobación de implementación incluye navegador, captura de la condición, consola, auditor independiente y regresión breve. La compilación o el typecheck no sustituyen la prueba funcional.

`GOW8B-VIS-01`, `GOW8B-KRA-01`, `GOW8B-ENV-01` y `GOW8B-CMP-01` están aprobadas por auditoría. `GOW8B-CMP-01` cerró con la verificación visual humana diferida y no bloqueante; no hay etapa de juego activa y las etapas posteriores siguen pendientes.

## Registro de auditorías

Lo que sigue conserva los resultados del prototipo anterior. Sus estados de «aprobada», «activa» o «pendiente» describen únicamente el momento histórico registrado; ninguno es una etapa activa del ciclo actual ni valida el shell neutral.

### Reinicio solicitado — cancelación de GOW8B-02-A (2026-10-08)

- El usuario canceló la tarea de arte de Kratos GOW8B-02-A antes de aprobación. Se retiraron únicamente sus dos assets nuevos (`public/assets/characters/kratos-v2.svg` y `.png`); no se completaron atlas, manifest ni preview de evidencia.
- Se conservan el shell neutral Phaser/Vite, el scaffold, las guías y los documentos históricos. El usuario retiró después todo el inventario de `docs/evidencias/`; esos archivos ya no están disponibles. Tras la limpieza no queda gameplay ni arte de personaje activo; el shell es el único runtime ejecutable.
- No se marca una etapa como aprobada por este reinicio y no se elige una siguiente tarea. Las aprobaciones anteriores, incluida GOW8B-01-A, se mantienen solo como registro histórico.
- `pnpm exec tsc --noEmit`: exit 0, sin salida. `pnpm build`: exit 0; 8 módulos transformados, bundle JavaScript 1,482.96 kB y warning conocido por superar 500 kB. Se eliminaron los `dist/**` regenerados y `tsconfig.tsbuildinfo`; no quedan salidas de compilación. No se usa Git ni Engram.
- Auditoría independiente del reset: aprobada. Confirmó `public/` vacío, `src/` limitado al shell y la declaración Vite, y ausencia de `dist/` y `tsconfig.tsbuildinfo`. Repitió `pnpm exec tsc --noEmit` (exit 0); no ejecutó build ni navegador porque el runtime no cambió. La aprobación previa del shell se reutiliza y no se presenta como prueba nueva. En esa revisión se contaron nueve documentos Markdown y 37 evidencias; el usuario retiró luego todas las evidencias. Sin hashes/base Git no se afirma preservación byte a byte.

### Reinicio del shell Phaser (2026-10-08): aprobado

- Runtime en Chrome MCP gratuito: canvas lógico 320×180, presentación CSS 960×540, `image-rendering: pixelated`, smoothing desactivado, texto `Entorno listo`; no aparecieron HUD ni `__GOW8B`. La captura de esa sesión (1208×839) fue retirada por solicitud del usuario y ya no está disponible.
- Hallazgo no bloqueante: la solicitud `/favicon.ico` devolvió 404 en consola; no hubo excepción de Phaser ni del runtime. El primer servidor encontró el puerto 5173 ocupado y la prueba terminó en 5199.
- Typecheck y build independientes: ambos exit 0. El build transformó 8 módulos; bundle JS 1,482.96 kB, con el warning conocido por superar 500 kB. No hay runner determinista y no se añadieron pruebas.
- Inventario en la auditoría inicial: ocho documentos Markdown y 34 evidencias presentes (33 PNG con cabeceras válidas y un SVG). El usuario retiró luego todo el inventario de evidencias; los documentos, README y scaffold Phaser/Vite/dependencias permanecen. Sin hashes previos ni Git no se afirma identidad byte a byte.
- Auditoría independiente aprobada. RDD assess/status se detuvo antes de mutar autoridad por `git rev-parse` fallido; no se afirma aprobación RDD. No hay `.git`, commit ni espejo Engram autorizado; el ID de sesión no está confirmado.
- Resultado histórico: el shell quedó aprobado con el 404 como hallazgo no bloqueante. Las pruebas de etapas previas son registros escritos del código descartado; sus capturas se retiraron por solicitud del usuario. GOW8B-01 comenzó entonces como siguiente tarea y su aprobación nueva se registra a continuación; el reinicio posterior canceló GOW8B-02. No hay una próxima etapa activa ahora.

### Etapa 1 nueva — GOW8B-01-A: guía visual v2 (2026-10-08): aprobada

- Entregable escrito: la guía visual v2 permanece en [`guía visual v2`](guia-visual-betrayal-pixel-art-v2.md); el SVG y PNG de muestra asociados fueron retirados por solicitud del usuario y ya no están disponibles. La guía v2 reemplaza para trabajo futuro las reglas antiguas de cuadrícula 2×2, coordenadas pares, evitar píxeles sueltos y contorno fijo de 2 px; la guía v1 permanece como historia, pero su muestra visual también fue retirada.
- Auditoría independiente `/root/audit_stage2_kratos`: aprobada, sin P1/P2 ni defectos reproducibles. En la revisión entonces realizada, `file` y Pillow confirmaron PNG RGB 320×180; SVG con `viewBox="0 0 320 180"`, editable, `crispEdges`; los 19 colores renderizados coincidían con la paleta declarada y no había colores intermedios. La inspección visual de entonces confirmó Kratos de aproximadamente 41 px con articulación, piel pálida, marca roja, faldón/bronce, dos hojas y cadenas; guardia distinguible con casco, escudo y espada; Hidra con ojo, hocico y mandíbula; además de barco, mar y tormenta legibles. Las muestras se retiraron después por solicitud del usuario; esos resultados quedan como historial escrito y ya no son visualmente inspeccionables.
- El orquestador inspeccionó la muestra nueva a tamaño nativo frente al material histórico: el registro describe mejor articulación, espacio negativo y separación de armas, con menos cajas dominantes. La muestra fue retirada después por solicitud del usuario, por lo que esta comparación ya no puede inspeccionarse aquí. Después de la auditoría inspeccionó una captura/collage de *Betrayal* alojada por IGDB y enlazada desde [Backloggd](https://backloggd.com/games/god-of-war-betrayal/). Esa referencia única aporta contexto de escala de sprite, desplazamiento lateral y contraste; no demuestra fidelidad total ni movimiento/animación. [Pocket Gamer](https://www.pocketgamer.com/god-of-war-betrayal/hands-on-with-god-of-war-betrayal-on-mobile-plus-first-21-screens/) sigue como fuente escrita que describe fondos desplazables detallados y efectos pixelados. No se copiaron recursos.
- Observación P3 no bloqueante: tres bandas continuas de cubierta en el SVG (aprox. línea 80) comunican tablazón, aunque reducen parcialmente el patrón repetido. Es preferencia de producción, no defecto comprobado.
- Limitaciones y estado técnico: durante la repetición de captura Chrome tuvo un fallo intermitente de crashpad (`setsockopt: Operation not permitted`); la imagen final se regeneró con crash reporting desactivado. No se ejecutaron build/tests para esta tarea pasiva de arte/documentación. El reset y shell permanecieron intactos según lectura; no hubo cambios runtime. Sin Git no se afirma diff/base ni identidad byte a byte. No se declara aprobación RDD y Engram no se usó por identidad de sesión no confirmada.
- Resultado histórico: GOW8B-01-A y etapa 1 del ciclo iniciado entonces fueron aprobadas. GOW8B-02, arte de Kratos, se propuso como siguiente tarea, pero fue cancelada después por el reinicio; no es la siguiente tarea actual.

### Etapa 2 — Arte de Kratos (2026-10-07): aprobada

- Criterios revisados: hoja consistente de las 23 poses generadas; piel pálida, marca roja, hojas encadenadas, transparencia y anclaje lógico comprobados en código y hoja visual.
- Las capturas históricas de la hoja y de la escena fueron retiradas por solicitud del usuario; los resultados de la auditoría permanecen en este registro escrito.
- Atribución y alcance: el orquestador realizó la sesión Chrome con revisión de portada y combate. El auditor verificó hoja y código, pero no repitió navegación debido a la limitación del perfil de Chrome. No se afirma una prueba de controles.
- Resultado: la reauditora aprobó la etapa después de corregir el comentario del generador de 22 a 23 poses.

### Etapa 3 — Arte del escenario del Egeo (2026-10-07): aprobada

- Criterios revisados: escenario integrado en la escala visual fijada; contraste, profundidad y legibilidad del barco, mar y tormenta comprobados en captura y en las rutas `GameScene.ts` y `textureFactory.ts`.
- La captura de la escena (1176 × 797; área de juego 960 × 540, ampliada 3× desde 320 × 180) fue retirada por solicitud del usuario y ya no está disponible.
- Comprobaciones: el implementador reportó build y typecheck correctos; el build conserva un warning por bundle mayor de 500 kB. El orquestador comprobó la escena en runtime, tomó la captura y observó la consola sin errores ni avisos. La auditoría independiente aprobó la legibilidad visual y no encontró bloqueos.
- Alcance y limitaciones: el auditor no pudo usar su propio Chrome y no hubo diff Git ni snapshot base para asegurar preservación exacta. No se afirma que se hayan probado controles.
- Seguimiento no bloqueante: la guía visual recomienda lluvia de 2–4 px y evitar cara y armas; el código existente permite gotas de aproximadamente 2–6 px sin exclusión espacial. La discrepancia corresponde al sistema de lluvia ya existente y no fue causada por la etapa 3.

### Etapa 4 — Arte del combatiente (2026-10-07): aprobada

- Cambio de código: únicamente `src/entities/textureFactory.ts`. La captura visual asociada fue retirada por solicitud del usuario y ya no está disponible.
- Comprobaciones técnicas: el implementador reportó `pnpm exec tsc --noEmit` y `pnpm build` correctos; el build advirtió que el bundle de 1,542.60 kB supera el límite de 500 kB. El orquestador repitió `pnpm exec tsc --noEmit` y pasó.
- Runtime y captura: en un navegador fresco, después de reiniciar Vite, `Enter` y `D` llegaron a la primera oleada. Para sincronizar la captura final con el estado transitorio se usó `window.__GOW8B` en modo DEV: `start`, `warp` a `x=175` y `step(1)` hasta el snapshot `mode=playing` con el primer raider en `windup`. `Escape` congeló la escena y `#overlay` se ocultó solo durante la captura; se restauró inmediatamente. La consola de la carga fresca mostró únicamente Vite connecting/connected y el registro de Phaser 3.90, sin errores ni warnings; se descartó la sesión vieja desconectada.
- Auditoría: la auditoría independiente aprobó la silueta, la lectura junto a Kratos y el telegraph. El ataque activo se revisó por código; no se afirma una captura del ataque. Tampoco se afirma haber probado controles aparte de `Enter` y `D`.
- Alcance y limitaciones: no hubo Git usable ni snapshot base, por lo que no fue posible verificar la preservación exacta del arquero o de la configuración del combatiente. No se afirma una regresión probada.

### Etapa 5 — Arte del arquero (2026-10-07): aprobada

- Cambio de código: únicamente la pose `windup` del arquero y el comentario asociado en `src/entities/textureFactory.ts`; la punta de la flecha se orientó a la derecha en coordenadas locales y el comentario pasó a describir el cambio de la cuerda entre anticipación y liberación.
- Evidencia browser: el orquestador guardó una captura de 1176 × 797; fue retirada por solicitud del usuario y ya no está disponible. El registro histórico describe una escena de navegador con el ataque parcialmente ocluido, insuficiente para probar esa pose.
- Consola: el orquestador observó una recarga sin errores; solo aparecieron la conexión de Vite y el banner de Phaser.
- Comprobaciones técnicas: el implementador reportó `pnpm exec tsc --noEmit` y `pnpm build` exitosos; el build advirtió que el bundle de 1,543.24 kB supera el límite de 500 kB. El orquestador repitió el typecheck y observó exit 0.
- Auditoría: la reauditora aprobó al comprobar en código y captura que la punta apunta a la derecha en la orientación local y a la izquierda al espejarse hacia Kratos. Revisó código y captura, sin ejecutar runtime.
- Alcance y límites: no hubo Git usable, por lo que no se pudo comparar la preservación exacta con una base. La auditoría dejó recomendaciones visuales subjetivas sobre limitar la paleta a 12 colores y usar un borde de 2 px; quedan como seguimientos no bloqueantes, fuera del criterio canónico aprobado.

### Etapa 6 — Arte de la Hidra (2026-10-07): aprobada

- Criterios revisados: poses principales legibles; cabeza, silueta, transparencia y anclaje consistentes en el lienzo de 320 × 180. La auditoría independiente aprobó la lectura clara de cabeza, ojo, hocico y dirección, la masa mayor que Kratos y las diferencias entre poses.
- Las seis capturas históricas de poses de Hidra fueron retiradas por solicitud del usuario y ya no están disponibles; el registro indicaba 1176 × 797 con canvas 320 × 180 ampliado a 3×. Los estados se prepararon con hooks DEV `start`, `setBossHealth`, `warp` y `step`: fueron capturas controladas, no una partida natural. No se afirma progresión normal, checkpoint, daño ni victoria jugados.
- Texturas: el snapshot confirmó las claves usadas para cada estado. Las siete texturas miden 144 × 112 y conservan píxeles transparentes. Límites opacos reportados: `idle-a` 131 × 103, `idle-b` 131 × 105, `bite` 136 × 103, `breath` 144 × 103, `sweep` 134 × 103, `stagger` 128 × 98 y `dead` 129 × 92. La auditoría consideró coherentes el anclaje y las diferencias de límites; los 105 px de `idle-b` se explican por su movimiento de 2 px y los 144 px de `breath` por la llama.
- Comprobaciones: el implementador reportó `pnpm exec tsc --noEmit` y `pnpm build` con exit 0; el build produjo un bundle de 1,543.56 kB y el aviso por superar 500 kB. El orquestador repitió el typecheck con exit 0. Tras recargar, la consola mostró solo Vite y Phaser, sin errores.
- Seguimiento y límites: la paleta de 20 tonos supera la recomendación visual de 12 y queda como seguimiento no bloqueante. No hubo Git utilizable ni snapshot base para verificar un diff o commit; no se afirma preservación comprobada contra una base.

### Etapa 7 — Movimiento horizontal (2026-10-07): aprobada

- Criterios revisados: respuesta horizontal, aceleración y frenado en ambos sentidos, inversión, aliases de teclado y regresión visual breve. La locomoción conserva 136 px/s como máximo con aceleración de 1,200 px/s² y frenado de 1,800 px/s²; los parámetros son ajustables en configuración.
- Prueba en navegador: el orquestador verificó aceleración y frenado simétricos, reversión de dirección, liberación independiente de aliases A/D y flechas, y detención ante el gate de oleada en `x=520`. Se usaron `KeyboardEvent` sintéticos y `window.__GOW8B.stepKeys` en pasos de 16 ms; no se probó teclado físico. Las capturas de movimiento fueron retiradas por solicitud del usuario y ya no están disponibles.
- Pruebas de borde: `KeyA` desde `x=16` produjo `x=16/vx=0/action=idle`; `KeyD` desde el borde derecho real `x=2404` produjo `x=2404/vx=0/action=idle`. Con `A+Space` junto al borde izquierdo el estado fue `x=16/vx=0/y=134/action=jump/grounded=false`. Todas fueron entradas sintéticas con `stepKeys` a 16 ms.
- Comprobaciones: `pnpm exec tsc --noEmit` terminó con exit 0 tanto para writer como para orquestador. `pnpm build` terminó con exit 0 y bundle de 1,544.25 kB; permanece el warning conocido por superar 500 kB. La consola se observó sin errores ni warnings al acabar. No hay runner determinista configurado y no se añadieron tests.
- Auditoría: auditor independiente aprobó el código; no ejecutó navegador ni build. La prueba browser y la consola corresponden al orquestador. No se declara una revisión RDD aprobada.
- Alcance: ataques, esquiva, daño, enemigos, Hidra, cámara y arte quedaron fuera de esta etapa. No hubo Git usable para verificar un diff contra base ni commit; no se afirma preservación comprobada contra una base.
- Resultado y continuidad: etapa aprobada; la etapa 8, salto y plataformas, queda activa según el orden canónico.

### Etapa 8 — Salto y plataformas (2026-10-07): aprobada

- Criterios revisados: ascenso, aterrizaje y control aéreo en las cinco plataformas; mantener Space no repite el salto; el estado visual se sincroniza al aterrizar en el mismo frame. El auditor independiente aprobó el código, pero no pudo ejecutar Chrome por el perfil compartido.
- Prueba browser del orquestador: con `warp` DEV y eventos `KeyboardEvent` sintéticos enviados por `InputManager`/`stepKeys` en pasos de 16 ms, se aterrizó en las cinco plataformas: `(364,109)` en frame 53, `(854,103)` en frame 51, `(1332,111)` en frame 54, `(1732,104)` en frame 51 y `(2006,99)` en frame 49. Mantener Space durante 8 frames no repitió el salto. No se usó teclado físico ni se hizo un recorrido natural.
- Control aéreo y bordes: desde el suelo `(2006,138)`, `Space+D` por 20 frames llegó a `(2043,86,vx=136)`; al invertir a A durante el vuelo, aterrizó en frame 49 en `(2001,99)`, `vx=-136`, `grounded=true`, `action=run`. Al salir por el borde izquierdo, en frame 36 quedó en `x=1953,y=100,grounded=false`; volvió a cubierta en `y=138` con `grounded/run` en frame 58, `x=1906`. La vida pasó de 120 a 108 por un golpe enemigo y el jugador sobrevivió; el desplazamiento de salida y caída se completó.
- Evidencia visual: la captura asociada fue retirada por solicitud del usuario y ya no está disponible. En la comprobación original, el MCP denegó escribir en el destino; entonces se abrió una copia local del PNG inline y se verificó como legible, pero esa copia también fue retirada después.
- Comprobaciones: `pnpm exec tsc --noEmit` independiente terminó con exit 0. El writer reportó `pnpm build` con exit 0; bundle de 1,544.31 kB y warning por superar 500 kB. La consola Chrome solo mostró los registros iniciales de Vite y Phaser, sin errores ni warnings. No existe runner determinista y no se añadieron pruebas.
- Hallazgo para seguimiento: al alejarse Kratos, el arquero se acercó; se registra únicamente como posible fricción de persecución para evaluar en la etapa 14. No se clasifica como bloqueo permanente ni se cambia la IA en esta etapa.
- Alcance, atribución y continuidad: el orquestador ejecutó las pruebas browser; el auditor revisó código y aprobó, sin navegador ni build por perfil compartido. No se afirma teclado físico ni recorrido natural. Etapa aprobada; etapa 9, combo ligero, activa. Git/commit y espejo Engram siguen pendientes, este último porque no hay ID de sesión autorizado confirmado.

### Etapa 9 — GOW8B-09-A: contador de impactos conectados (2026-10-07): aprobada

- Alcance de la subtask: el paso 1 del combo empieza con contador de impactos en cero; los pasos encadenados preservan ese contador y el incremento se mantiene en la conexión de cada golpe. El HUD queda vacío con cero, muestra `1 GOLPE` con uno y forma plural a partir de dos.
- Prueba browser del orquestador: con `start; warp(455)`, J procesado por `InputManager` y 9 ticks de 16 ms, el enemigo bajó de HP 44 a 26, Kratos quedó en `light1` y `#combo-readout` mostró `1 GOLPE`. En otro reset con `warp(520)`, J dejó HP 44/36/44 sin cambios, acción `light1` y HUD vacío.
- Encadenamiento: J en frames 1, 2 y 20 conectó los pasos `light1`/`light2`/`light3`; el HP del objetivo pasó de 44 a 26, 5 y −26 y el HUD mostró `3 GOLPES`. Una cadena tardía, pulsada después de recuperaciones, alcanzó los pasos 2/3 y el tercer contacto; esperar 27 frames fuera de ventana reinició en `light1`. Los checkpoints tardíos no miden con precisión cada límite de frame.
- Evidencia: la captura creada e inspeccionada por el orquestador fue retirada por solicitud del usuario y ya no está disponible. El registro indica que mostraba el HUD pausado con `1 GOLPE`.
- Comprobaciones y atribución: typecheck independiente `pnpm exec tsc --noEmit` terminó con exit 0; build del writer `pnpm build` terminó con exit 0, bundle de 1,544.33 kB y warning por superar 500 kB. No hay runner determinista y no se añadieron tests. El orquestador ejecutó las pruebas browser mediante warp DEV y eventos sintéticos; no se afirma teclado físico ni recorrido natural. La consola mostró solo logs iniciales de Vite/Phaser, sin errores ni warnings. Auditor Sol aprobó código y captura, pero no ejecutó navegador ni comandos.
- Estado tras esta subtask: `GOW8B-09-A` aprobada; la etapa 9 permaneció activa hasta resolver el alcance visual en `GOW8B-09-B`, que se documenta a continuación.

### Etapa 9 — GOW8B-09-B: alinear el alcance visual del golpe ligero (2026-10-07): aprobada

- Cambio evaluado: el endpoint visual de ataques ligeros coincide con `p.x + facing * attackReach`; auditor confirmó en código ±reach para pasos 1/2/3 y que heavy conserva su geometría.
- Pruebas browser del orquestador: con DEV warp y eventos sintéticos, desde `x=405` el raider iniciado en `x=454` terminó en `x=448` tras 9 ticks y mantuvo HP 44, con separación observada de 43. Desde `x=410`, J redujo HP 44→26 y HUD mostró `1 GOLPE`; la IA mueve al enemigo y el knockback afecta su posición final, así que no se atribuye separación exacta al instante del impacto. Mirando a la izquierda desde `x=359`, J conectó al raider de ese lado. La cadena temprana conectó los tres pasos con daño 18+21+31 (HP 44→−26) y terminó en `idle`.
- Entradas y consola: para las comprobaciones de daño/alcance se usaron DEV warp y eventos sintéticos; no hubo controles físicos. Escape físico confirmó pausa. La consola de Chrome terminó sin errores ni avisos.
- Evidencia y limitación visual: las capturas pre y post cambio fueron retiradas por solicitud del usuario. El registro indica que la imagen posterior mostraba una escena de combate, pero no la estela; por tanto, no probaba visualmente el endpoint durante el frame activo.
- Comprobaciones y auditoría: typecheck del orquestador `pnpm exec tsc --noEmit` terminó con exit 0; build del writer `pnpm build` terminó con exit 0, bundle de 1,544.39 kB y warning por superar 500 kB. No existe runner determinista. Auditor de solo lectura aprobó código y fórmula, sin ejecutar browser, consola ni build; las pruebas de ejecución y la consola corresponden al orquestador.
- Resultado: `GOW8B-09-B` aprobada y etapa 9 completa/aprobada. No se declara aprobación RDD. Git/commit y espejo Engram permanecen pendientes, respectivamente por falta de `.git` e ID de sesión autorizado confirmado.
- Siguiente etapa: 10, Ataque pesado, activa; su implementación aún no se ha iniciado. Criterios pendientes: preparación, impacto, recuperación, alcance y respuesta visual/sonora.

### Etapa 10 — GOW8B-10-A: Ataque pesado (2026-10-07): aprobada con límite perceptivo

- Criterios revisados: preparación, impacto, recuperación, alcance y respuesta audiovisual. La captura del arco heavy (1176×797) fue retirada por solicitud del usuario y ya no está disponible; el registro de runtime documenta impacto, daño, recuperación y señal.
- Pruebas browser del orquestador: K físico inició heavy y raider HP 44→1; Escape físico confirmó pausa. En DEV desde `x=390`, tick 19/`elapsed=.320`: HP 44; tick 20/`.336`: heavy conectó por 43, raider HP 1 y arquero HP −7; tick 31/`.512`: seguía heavy sin repetir daño; tick 39/`.640`: `idle`. Mirando a la izquierda desde `x=379`, heavy conectó por 43 con un raider de ese lado. No se afirma una separación exacta al centro en el frame de impacto porque el movimiento/knockback altera la posición final. La consola terminó sin errores ni warnings.
- Audio, alcance de la prueba: el orquestador inició desde el botón real y observó `AudioContext running` a 48 kHz. De los contextos capturados, el primero era silencioso; el contexto 2 del sintetizador estaba conectado al destino de `SoundManager`. Con K físico en `t=9.216 s`, se registraron eventos programados heavy sawtooth 190→63 Hz/180 ms/gain .25 y hit square 150→62 Hz/90 ms/gain .22. Medición en memoria: RMS .0040818, pico .05407 y 32,630 muestras >.0001. Esto confirma señal no nula generada y enrutada al destino; no se guardó la grabación, no se escuchó por altavoces ni se evaluó calidad subjetiva.
- Auditoría y comprobaciones: auditor independiente aprobó tras revisar código/captura; confirmó endpoint heavy `±reach` y geometría conservada, pero no ejecutó navegador, consola ni comandos. `pnpm exec tsc --noEmit` del orquestador terminó con exit 0. `pnpm build` del writer terminó con exit 0; bundle de 1,544.33 kB y warning por superar 500 kB. No existe runner determinista.
- Discrepancia y resultado: `GAME.attacks.heavy.windup=230 ms` permanece sin uso frente a `hitAt` efectivo de 320 ms; no se cambió timing porque la intención no está probada. Etapa 10 completa/aprobada con límite perceptivo: se verificó generación y enrutamiento de señal, no escucha ni calidad subjetiva. No se declara aprobación RDD. Git/commit y espejo Engram pendientes por falta de `.git` e ID de sesión autorizado confirmado.
- En el plan del prototipo anterior, la etapa 15 de Oleadas figuraba como siguiente y con baseline pendiente de mapeo. Ese estado fue invalidado por el reinicio y no activa una etapa actual.

### Etapa 11 — GOW8B-11-A: Esquiva (2026-10-08): aprobada

- Cambio: se quitó el refresh de invulnerabilidad de mínimo 90 ms que corría mientras dodge estaba activo; el temporizador conserva `GAME.player.dodgeIFrames=290 ms` como duración total.
- Pruebas runtime del orquestador: entradas sintéticas `KeyboardEvent` a través del input habitual y `stepKeys(16 ms)`, sin teclado físico. Un raider que impactó dentro de la ventana no causó daño (salud 120). En la prueba tardía, `invulnerable=false` en tick 18 después de esquiva; el raider atacó en tick 19, salud 120→108 y acción `hurt`.
- Movimiento y recuperación: dash derecho delta +73.44 px; izquierdo −73.44 px. Tras 20 ticks, acción `idle` e `invulnerable=false`. Cooldown bloqueó un reintento temprano y permitió otro aproximadamente a 432 ms; los tiempos observados están cuantizados a ticks de 16 ms.
- Regresiones: salto y=138→103; light1 conectó y raider HP 44→26; heavy conectó y arquero HP 36→−7. Consola con conexión Vite y banner Phaser, sin errores ni warnings.
- Evidencia: la captura RGB de 1208×839 que mostraba a Kratos con salud 108 fue retirada por solicitud del usuario y ya no está disponible.
- Auditoría y comprobaciones: auditor distinto `/root/audit_stage7_horizontal_motion` aprobó la lectura de código y captura; no ejecutó browser, typecheck ni build. El orquestador aporta las pruebas runtime. Typecheck del writer y spot check del padre `pnpm exec tsc --noEmit`: exit 0. Build del writer `pnpm build`: exit 0, bundle 1,544.23 kB y warning >500 kB. Sin runner determinista.
- Límites reales: pruebas de esquiva con eventos sintéticos, no teclado físico. No hubo comparación con base por falta de Git. RDD estaba `on (decided by default)`, pero `review assess` fue high/unassessable y preflight native terminó `git_command_failed`, `mutation_outcome=not_started`, `next_action=stop`; no se declara aprobación RDD. Engram permanece pendiente por identidad de sesión no confirmada.

### Etapa 12 — GOW8B-12-A: Respuesta al daño (2026-10-08): aprobada

- Cambio: el único cambio de fuente fue en `CombatSystem.ts:518`, donde el knockback del proyectil ahora usa `vx < 0 ? -1 : 1`. Daño y colisión permanecieron intactos.
- Retroceso de flecha: post-cambio, flecha desde la derecha con `vx<0` impactó cuando el warp-target del jugador era x=240; causó 10 de daño, consumió el proyectil y dejó x=222 (−18), `hurt`, invulnerable. En el baseline equivalente el jugador terminaba en x=258 (+18 hacia el arquero). El caso `vx>0` no se ejecutó en browser; la rama opuesta está confirmada por lectura del signo y auditoría.
- Capturas: las imágenes pre y post cambio (ambas 1208×839 y posteriores al impacto) fueron retiradas por solicitud del usuario. El registro ya indicaba que no mostraban el vuelo ni el instante direccional.
- Regresiones post-cambio: raider causó 12 de daño y empujó x=350→368 (+18), acción `hurt`/invulnerable; hurt i-frames expiraron tras 57 ticks de 16 ms luego de un warp adicional. K heavy se interrumpió en frame 15 y raider conservó HP 44. Golpe real con health 1 alcanzó 0/`defeat`, y `elapsed` quedó congelado tras 24 ticks. Dodge derecha delta +73.44 px; tras 20 ticks, `idle`/no invulnerable.
- Entradas/consola: DOM `KeyboardEvent`, hooks DEV y `stepKeys(16 ms)`, sin teclado físico. Consola limpia salvo conexión Vite y banner Phaser iniciales.
- Auditoría: auditor separado `/root/audit_stage7_horizontal_motion` aprobó lectura de código y capturas, sin editar ni ejecutar browser, tests, typecheck o build; no encontró defecto y acepta el límite `vx>0`. El orquestador aporta las pruebas runtime.
- Comprobaciones: typecheck writer y spot check padre exit 0; build writer exit 0, bundle 1,544.23 kB con warning >500 kB. No existe runner determinista. Sin Git no hubo diff/base.
- Límites de revisión: RDD `on (decided by default)`; assess high/unassessable y preflight native `git_command_failed`, `mutation_outcome=not_started`. No se declara aprobación RDD. Engram pendiente por identidad no confirmada.

### Etapa 13 — GOW8B-13-A: Conducta del combatiente (2026-10-08): aprobada

- Cambio: solo `src/game/CombatSystem.ts:445–448`; el raider asigna `idle` dentro de engage range mientras cooldown es positivo. No hubo cambios de timing, alcance, daño ni arquero.
- Pruebas browser del orquestador: DOM `KeyboardEvent` sintéticos por InputManager, `window.__GOW8B` y frames controlados; sin teclado físico. Raider x=320/jugador x=300 permanece estacionario e `idle`; cuando la distancia supera 30 px, se acerca x=320→319. Ciclo observado: frame 37 windup, 70 attack con un impacto (salud 120→108), 82 recover, 119 approach, idle en x=312/frame132 y windup de nuevo en frame137. J durante windup redujo HP enemigo 44→26 y el golpe en cola no conectó (jugador conservó 120). Tres entradas ligeras derrotaron al raider (HP −26, `dead`) y redujeron remaining 3→2.
- Captura y consola: la imagen de contexto fue retirada por solicitud del usuario; el registro decía que era legible, aunque la concurrencia dificultaba aislar la pose y no probaba estado ni timing. Consola de carga con mensajes iniciales Vite/Phaser, sin errores observados.
- Auditoría: `/root/audit_stage7_horizontal_motion` aprobó fuente y captura y ejecutó `pnpm exec tsc --noEmit` (exit 0) y `pnpm build` (exit 0, bundle 1,544.25 kB, warning >500 kB). No pudo usar browser por perfil Chrome compartido ocupado; pruebas runtime y consola se atribuyen al orquestador.
- Límites y estado: no hay runner determinista ni se añadieron tests. Sin `.git`, no hubo comparación branch/diff/commit. RDD assess high/unassessable y preflight detenido en `git_command_failed`, `mutation_outcome=not_started`; no se declara aprobación RDD. Identidad de sesión Engram unavailable; espejo pendiente.

### Etapa 14 — GOW8B-14-A: Conducta del arquero (2026-10-08): aprobada

- Cambio: solo `src/game/CombatSystem.ts:453` agrega `else enemy.state='idle'` para espera estacionaria del arquero en la banda preferida inclusiva de 88–158 px mientras cooldown es positivo. No se cambiaron parámetros ni comportamiento del proyectil.
- Espera y límites: pruebas browser del orquestador con eventos DOM sintéticos por InputManager y frames DEV, sin teclado físico. Baseline jugador x=232/arquero x=390 quedó x=390/`approach` durante 21 updates; post-cambio quedó x=390/`idle`. Con jugador x=200 (>158), arquero avanzó x=390→389/`approach`; con x=330 (<88), retrocedió x=390→391/`approach`. Vencido cooldown entró en windup en 61 updates controlados contando el reset. La captura de anticipación fue retirada por solicitud del usuario y ya no está disponible. Raider conservó el ciclo idle wait/approach/windup de etapa 13.
- Flecha y recuperación: primera muestra tras soltar la flecha x=378/y=119/life2.48, después x=330/y=119 y x=318/y=120; unas diez actualizaciones después se consumió en el impacto, salud 120→110, jugador x=300→282, `hurt`/invulnerable. Arquero windup→attack aprox. frame 41, recover frame 54 y luego idle al acabar postattack recovery/cooldown, consistente con baseline/configuración.
- Capturas: las cinco capturas de espera, anticipación y trayectoria fueron retiradas por solicitud del usuario. Eran contexto, no prueba independiente de estados, trayectoria exacta o timing; esos resultados se atribuyen a snapshots de runtime. Consola del orquestador mostró solo Vite connecting/connected y banner Phaser, sin errores.
- Auditoría y comprobaciones: auditor `/root/audit_stage7_horizontal_motion` aprobó código/capturas y ejecutó `pnpm exec tsc --noEmit` y `pnpm build`, ambos exit 0; bundle 1,544.26 kB con warning conocido >500 kB. No pudo usar browser por perfil compartido ocupado; browser y consola pertenecen al orquestador. El orquestador repitió typecheck exit 0; writer también reportó typecheck/build exit 0. No hay runner determinista ni tests añadidos.
- Límites: sin `.git` no hubo comparación base/diff/commit. Native RDD assess high/unassessable; preflight `git_command_failed`, `mutation_outcome=not_started`, `next_action=stop`; no se declara RDD aprobado. Engram session identity unavailable; mirror pendiente y no guardado.

### Etapa 15 — GOW8B-15-A: Oleadas (registro histórico; no activa tras el reinicio)

- Criterios: verificar aparición, barrera, despeje/liberación de cada oleada y si la cantidad de enemigos sostiene el ritmo previsto.
- Primer paso: mapear y documentar estados y transiciones de aparición, barrera, despeje/liberación y ritmo antes de cualquier cambio de fuente. No se ha iniciado implementación.

## Comprobaciones técnicas futuras

Al retomar una etapa de desarrollo, ejecuta desde la raíz solo las comprobaciones apropiadas a su alcance:

```sh
pnpm exec tsc --noEmit
pnpm build
pnpm dev
```

El shell neutral puede iniciarse con `pnpm dev`, pero esa carga solo comprueba el shell; no acredita gameplay. `pnpm build` genera archivos en `dist/`; usa `pnpm exec tsc --noEmit` para comprobar tipos sin producir artefactos. En etapas jugables futuras, abre el navegador y revisa la consola después de cargar y durante la acción evaluada.

## Recorrido de juego futuro

Cuando las etapas correspondientes estén implementadas y autorizadas, hacer un recorrido con controles normales para comprobar que el conjunto se puede jugar de principio a fin. La lista concreta dependerá del alcance aprobado; ninguna de estas acciones está disponible en el shell actual.

## Revisión visual futura

- Captura la imagen a resolución interna o con escalado entero; no uses una ampliación suavizada para juzgar los píxeles.
- Comprueba las dimensiones reales del archivo de evidencia y, en recursos de paleta limitada o vectoriales, cuenta los colores de la imagen rasterizada; los valores declarados en SVG o CSS no garantizan la salida final.
- Incluye la condición visual concreta de la etapa: referencia, pose, escenario, movimiento, preparación/contacto, amenaza, jefe o pantalla, solo cuando exista en runtime.
- Comprueba que Kratos, enemigos, proyectiles y avisos se distinguen del mar, la cubierta y la tormenta.
- Revisa cuadros con transparencia sobre el escenario: tamaño uniforme, pies anclados, armas continuas entre poses y áreas de daño alineadas con las señales visuales cuando haya assets animados.

## Evidencia del informe

Para cada etapa futura, indica:

- navegador y resolución observada;
- pasos y entradas usados;
- si la entrada fue física o sintética enviada al navegador;
- resultado observado y, si aplica, captura;
- mensajes de consola o salida de compilación;
- limitaciones que impidieron probar una parte.

Cuando una etapa autorizada requiera evidencia visual, guarda una captura representativa en `docs/evidencias/` con nombre descriptivo. Incluye el frame de la condición evaluada, no solo una pantalla genérica. La carpeta de evidencia del prototipo previo fue retirada; cualquier material nuevo corresponderá solo a trabajo futuro autorizado.

## Aprendizajes de proceso

Después de auditar cada etapa, cualquiera sea su estado, registra al menos una observación sobre el método de trabajo en [`aprendizajes-del-proceso.md`](aprendizajes-del-proceso.md). Si la tarea queda parcial o fallida, aplica el aprendizaje al siguiente intento y actualiza la entrada al volver a auditarla. Generaliza las lecciones para que sirvan fuera de este juego; no uses la bitácora para duplicar hallazgos de código, decisiones de producto o resultados detallados de una prueba.

Separa los defectos reproducibles de las preferencias de diseño. Una entrada sintética que llega a los mismos listeners del juego puede verificar el flujo de eventos, pero no se debe describir como una pulsación física ni como evaluación completa de la sensación de control.
