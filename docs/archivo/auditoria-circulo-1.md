# Auditoría de ○ (círculo) frente a God of War 1 (PS2): informe

Rama `tarea/ataques-circulo`, commit 458aba7. Solo lectura sobre el repositorio; todo el material está en `docs/tmp/auditoria-circulo/` (abreviado `AUD/`).

## 1. Metodología

- **Grabación del juego real** con una copia propia del grabador (`AUD/rec.sh`, `AUD/rec.mjs`): Vite + Chrome sin cabeza, teclas reales por CDP, PNG del canvas lógico 480x270 por tick y `meta.json` por tick (posición, fase, HP, `aiState` de cada entidad). Grabaciones en `AUD/rec/<nombre>/`.
  - Escenarios: `legionnaire` (con física de enemigos) y `platforms` (para mirar a la izquierda; **no** tiene `targetPhysics`, así que en ese escenario los lanzados no vuelan: lo descarté como artefacto y repetí el *Toss* a la izquierda en `legionnaire`, `rec/toss_L2`).
  - Derecha: `t_pummel_R`, `whiff_R`, `toss_R`, `rip_R`, `breakfree_R`, `lunge_*`, `harp*`, `fin_R`, `multi`, `sq_cmp` (□ y △ de referencia). Izquierda: `t_pummel_L`, `whiff_L`, `toss_L2`, `rip_L`.
- **Herramientas de análisis** (propias): `AUD/sheet.py` (tiras con etiqueta tick/fase), `AUD/spikes.py` (píxeles que cambian entre ticks consecutivos: detecta saltos), `AUD/phases.py` (duración de cada fase), `AUD/vsheet.py` (tiras de video con timestamp).
- **Referencias de video re-extraídas a 30 fps** (más densidad y resolución que las hojas viejas):
  - *Grab 1* real de partida: `docs/tmp/legionario-ref/hd.mp4`, 83,2 a 86,0 s -> `AUD/v_g1_a.png`, `AUD/v_g1_b.png` (fotogramas completos en `AUD/ref/g1/`).
  - Showcase `moveset.mp4`: ubiqué por coincidencia de miniaturas el *Grab 2* (○△, **Rip**) en 448,5 a 452,3 s -> `AUD/v_rip_a.png`; el *Grab 3* (○□, **Toss**) en 452,0 a 454,8 s -> `AUD/v_toss_a.png`; *Orion's Harpoon* en 456,5 a 462 s -> `AUD/v_harp_a.png`.
- Conversión de tiempos: 1 tick = 16,7 ms; 30 fps de video = 2 ticks por fotograma.

## 2. Tabla resumen

| Movimiento | Nota 0-10 | Veredicto frente a □ y △ |
| --- | --- | --- |
| Whiff / Lunge | 4 | NO APROBADO (el *Lunge* teletransporta 26 px en 1 tick; el *Whiff* es aceptable) |
| Hold / Break Free | 3 | NO APROBADO (119 ticks de imagen congelada; el soltarse no se anima) |
| Pummel: puñetazos | 4 | NO APROBADO |
| Slam (azote) | 2 | NO APROBADO |
| Puñaladas (4) | 3 | NO APROBADO (la última corta la animación y el cadáver "resucita") |
| Toss (○□) | 3 | NO APROBADO |
| Rip (○△) | 1 | NO APROBADO (no parte nada y sí hay referencia) |
| Remate contextual (finisher_qte) | 2 | NO APROBADO (inalcanzable en el juego real) |
| Harpoon / agarre aéreo | 3 (parcial) | NO APROBADO (no verificado, ver §6) |
| VFX y sonido | 4 | NO APROBADO (sin hitstop; efectos atados al fotograma de render) |

**Veredicto global: NO APROBADO.** □ y △ tienen cadenas, estelas de fuego, hoja grande y 9 rondas de ajuste (`AUD/s_sq_cmp.png`); ○ son dos sprites pegados con saltos de 1 tick entre poses sin interpolar. El usuario tiene razón.

## 3. Hallazgos

Ticks en la numeración de cada grabación. "Original" = video indicado.

### BLOQUEANTES

**B1. El Rip no parte al enemigo y sí existe referencia.**
- Evidencia: `AUD/s_rip_R.png` (ticks 47 a 56 de `rec/rip_R`), `AUD/v_rip_a.png`.
- Original (`moveset.mp4`, 449,1 a 450,9 s): agarra, lo hoza hacia el pecho a dos manos (449,5 a 449,9), lo **parte en dos** (450,5 a 450,7: tronco y piernas separados, chorro de sangre en abanico), las mitades salen despedidas a los lados (450,9). Dura ~1,3 s desde la presa. La hoja `docs/tmp/grab-ref/ms_grab2_3_tri_sq.png` (filas 1 a 3, 18 celdas "Grab 2 ○△") ya lo contenía.
- Juego: el soldado queda **de pie y rígido** (`juggle-01`) sobre la cabeza de Kratos 11 ticks sin cambiar un píxel (ticks 47 a 53) y en el tick 55->56 se **teletransporta** tendido, **entero**. Nada se divide; la sangre es una nube pequeña. 25 ticks (417 ms).
- Causa: `src/scene/grabPose.ts:144-153` (dos poses fijas) y que no existen cuadros de cuerpo partido (`legionnaire-death-*` solo tiene un cuerpo).
- Corrección: cuadros nuevos `legionnaire-rip-a..c` (alzado a dos manos horizontal, mitades separándose, mitades en el aire) + dos sprites de mitad (superior/inferior) lanzados con velocidad opuesta durante ~25 ticks; sangre en abanico de 60+ partículas; fase `break` de ~70 ticks (1,2 s) como el original.
- Esfuerzo: arte nuevo grande (6 a 8 cuadros), código mediano.

**B2. La última puñalada: el cadáver se levanta y Kratos salta de pose.**
- Evidencia: `AUD/s_laststab_R.png`, ticks 245->246 (`rec/t_pummel_R`); `spikes.py` marca 2401 px cambiados en ese solo tick.
- Original (`AUD/v_g1_b.png`, 85,6 a 86,0 s): Kratos acaba la puñalada, retira la hoja y **se incorpora** (≈0,4 s); el cuerpo queda tendido.
- Juego: la 4.ª puñalada mata en el tick 4 de la fase; en el tick 5 la fase pasa a `none` (la guarda de `grab.ts:477` `target.isDead` corta la fase) y la fase `recovery` no se ejecuta. Resultado: Kratos pasa de arrodillado a guardia en **1 tick** y el soldado, que estaba tendido, **aparece de pie** (la animación `death` arranca en `death-00` en pie, `legionnaireFrames.ts:92-95`) y recién cae durante ~15 ticks (ticks 246 a 260). El golpe mortal dura 5 ticks en vez de 13.
- Corrección: cuando la puñalada mata, mantener la fase hasta el tick 13, congelar al soldado en `death-02` (sin reiniciar `death`), luego pasar a `recovery` con 8 a 12 ticks de incorporación (poses `stab-a` -> `idle`). Código pequeño (`grab.ts` + `legionnaireFrames.ts`).

**B3. El azote es un teletransporte: no hay alzada ni arco.**
- Evidencia: `AUD/s_slam_R_step1.png` (ticks 114 a 125), `AUD/s_slam_L.png`; salto 115->116 (1277 px).
- Original (`AUD/v_g1_a.png`, 83,33 a 84,40 s): levanta al soldado **por encima de la cabeza** en horizontal (83,47 a 83,73), lo sostiene y puñea, y al final lo estampa (84,40) con las hojas. ~1 s de movimiento continuo.
- Juego: 10 ticks (167 ms) con el soldado en `juggle-00` **de pie, a media altura, junto a Kratos** (`grabPose.ts:169-170`: `y - 16`, nunca sobre la cabeza); en el tick 10 pasa a `death-01` **tendido** y Kratos cambia de erguido a una masa encogida (`slam-b`) en el mismo tick. No hay trayectoria intermedia. Además el soldado se dibuja delante de Kratos (`DEPTH_FRONT`) y le tapa el hombro (`s_slam_L.png`, ticks 113 a 119).
- Corrección: 3 poses intermedias de la víctima (alzada horizontal sobre la cabeza, apogeo, picada a 45 grados) y tres de Kratos (carga, brazos arriba, estampado); `slam` de 26 a ~40 ticks con la víctima interpolada por parábola; orden de dibujo: detrás de Kratos hasta el impacto.

**B4. El Lunge teletransporta 26 px en 1 tick.**
- Evidencia: `rec/lunge_mid/meta.json` (x de Kratos: 240, 240, 240 y en el tick 24 **266**); `rec/t_pummel_R` (190 -> 216 en el tick 25). 26 px = 5,4 % del ancho de pantalla en 16,7 ms (1560 px/s).
- Original (`AUD/v_g1_a.png`, 82,80 a 83,20 s): embestida de ~0,4 s con paso largo.
- Causa: `grab.ts:90-97` mueve `step0` en el tick de conexión y el resto en el siguiente (`grabAdvancePx`); el *Whiff*, en cambio, sí avanza 19 px a 95 px/s durante 12 ticks (incoherente entre sí).
- Corrección: distribuir el avance en 6 a 8 ticks (≈ 4 px/tick) con `grab-lunge` visible; la simulación se puede conservar porque es solo reparto del desplazamiento (riesgo: la presa llega 6 ticks más tarde; hay que mantener la invulnerabilidad).

**B5. Cada regreso a Hold parpadea con la pose de embestida.**
- Evidencia: `AUD/s_pummelR_1.png` (celda "56 hold 1": Kratos echado hacia adelante en pose de zancada) y `spikes.py`: 1304/1299 px en 55->56, 56->57; igual en 76->77, 98->99, y de nuevo al volver a empezar la cadena.
- Causa: `grabPose.ts:57` (`hold` con `t < lungeTicks` usa `kratos-grab-lunge`) combinado con que cada vuelta a `hold` reinicia `grabTicks`: tras cada puñetazo Kratos muestra 2 ticks la pose de embestida. Con 3 puñetazos son 3 parpadeos más el inicial.
- Corrección trivial (una condición: solo usar `lunge` si el `hold` viene de `none`). **Esto prueba que C1 a C4 no cubren la transición.**

**B6. Break Free y Hold: dos segundos de imagen congelada y suelta instantánea.**
- Evidencia: `rec/breakfree_R`: 119 ticks de `hold` con 9,5 px cambiados por tick de media (solo lluvia); `AUD/s_breakfree.png`: tick 143 `hold` -> 144 `recovery`, el soldado pasa de colgado a de pie y Kratos cambia de pose en 1 tick, sin forcejeo.
- Original: el enemigo **se debate** (miembros en movimiento) antes de soltarse. (No tengo clip aislado del *Break Free*; ver §6.)
- Corrección: 2 cuadros de forcejeo alternados cada 6 ticks en la víctima, temblor de 1 px en Kratos, y 4 ticks de empuje con pose propia (reutilizable `held-01` + un `held-02` nuevo).

**B7. El Toss dura 2,5 veces menos que el original, sin cadena y con vuelo de recorte rígido.**
- Evidencia: `AUD/s_toss_R.png`, `AUD/s_toss_L2.png`, `AUD/v_toss_a.png`.
- Original (`moveset.mp4`, 453,0 a 454,8 s): sujeta de lado (453,2), levanta la hoja con fuego (453,5 a 453,8), la clava (454,0), **gira el cuerpo** (454,3) y lo lanza **ligado a la cadena**, que lo arrastra por el aire (454,5 a 454,8): ~1,5 s de presa a vuelo.
- Juego: puñalada en el tick 5, suelta en el 12 (`CONFIG.player.grab.toss`: 200 ms); el soldado sale con **un solo cuadro** (`juggle-01`) deslizándose 20 ticks a 15 px sobre el suelo, sin rotación ni cadena (`s_toss_L2.png` ticks 66 a 81). Entre los ticks 50 y 56 el soldado (`held-01`, delante, `grabPose.ts:136-141`) cubre el tronco y casi toda la cabeza de Kratos.
- Corrección: `stabTick` 5 -> ~24 y `releaseTick` 12 -> ~50 (la presa dura 0,9 s en el original); 2 cuadros de giro de Kratos (cuerpo rota 180 grados en 6 ticks); víctima con 4 cuadros de giro en el aire y cadena dibujada desde la mano; colocar a la víctima detrás de Kratos (depth negativo) durante la puñalada.

### MAYORES

**M1. Las puñaladas apenas se mueven y Kratos es un bulto.**
- Evidencia: `AUD/s_stab_R_step1.png`, `AUD/s_stab_L.png`; anclas `kratos-anchors.json`: mano en `stab-up` y=28,8, `stab-a` 34,5, `stab-b` 41,5, es decir una carrera de **12,7 px** con una hoja de 12 px (`bladeSize.w`, `config.ts:484`).
- Original (`v_g1_b.png`, 84,5 a 85,6 s): Kratos arrodillado con **la hoja alzada por encima de la cabeza** a dos manos; golpea a ritmo 0,4 / 0,14 / 0,5 s.
- Juego: en reposo y entre puñaladas Kratos es una silueta agachada sin cabeza legible a 1x (`s_stab_R_step1.png`), con la hoja vertical pegada al torso como una astilla blanca; el "alzado" es subir la mano 5,7 px. El impacto (tick 4 de 14) tiene flash y sangre, pero el movimiento no se lee. Cadencia: mínimo 13 ticks (217 ms) por golpe: con *mash* real el original llega a 0,14 s.
- Corrección: pose de hoja alzada a dos manos (mano a y ≈ 12 px sobre la cabeza) y dos cuadros de bajada; carrera ≥ 28 px; reducir `stabTicks` a 9 para permitir el *mash*.

**M2. El remate contextual (finisher_qte) no se puede disparar en el juego.**
- Evidencia: `grep` de `'weakened'` en `src/`: ningún código asigna ese `aiState` (solo se lee en `grab.ts:103`, `legionnaire.ts:114`, `legionnaireFrames.ts:72`); `tests/finisher.test.ts:32` afirma que "basic legionnaire does NOT automatically enter weakened state on low HP"; los demás tests lo fijan a mano (`e.aiState = 'weakened'`). `rec/fin_R`: con HP 20, 6 y hasta 0 el legionario nunca pasó por `weakened` (`aiState` visto: idle, approach, guard, hitstun, death); ○ con HP bajo cae en `hold`.
- Consecuencia: el movimiento 6 del alcance es **código muerto en el juego real**; su presentación (poses de azote) no se pudo grabar. Si la decisión del usuario fue que exista, hoy no existe.
- Corrección: asignar `weakened` a legionarios con HP <= `weakenedThresholdHp` (20) tras salir de `hitstun`, mostrar el marcador ○ sobre su cabeza y re-grabar. Código pequeño pero cambia el combate (consultar).

**M3. Sin peso de impacto: cero hitstop en ○ y efectos atados al render.**
- Evidencia: `grab.ts` no usa hitstop (en `world.ts:1095` sí lo usan los golpes de □/△); sacudidas de 50 a 60 ms a 0,006 a 0,008 (`ShellScene.ts:419-440`), mientras el azote es 120 ms; `spikes.py` en `sq_cmp` muestra los golpes de □/△ con 2800 a 3800 px de cambio por tick frente a ≤ 2100 en los puñetazos de ○.
- **Lectura de código (no reproducida)**: los efectos (sangre, sacudida, sonido de puñetazo/puñalada) se disparan con `player.grabTicks === 4` dentro de `update()` de Phaser, que corre por fotograma de pantalla y no por tick de simulación (`ShellScene.ts:419-448`, sin detección de flanco): en pantallas de 120/144 Hz el mismo tick dura 2 a 3 fotogramas y el golpe suena, sacude y sangra 2 o 3 veces; con 30 fps puede saltarse. El zumbido del enganche sí tiene flanco (`prevGrabPhase`, `:353-362`), los golpes no.
- Corrección: guardar `prevGrabPhase/prevGrabTicks` y disparar en el flanco; añadir 3 a 4 ticks de hitstop en cada golpe de la cadena (6 en el azote), y subir sacudida de las puñaladas.

**M4. El soldado queda "flotando" tras un lanzamiento aéreo.**
- Evidencia: `AUD/s_harp4.png` ticks 77 a 95: el soldado (`juggle-01`) sostiene la pose 20 ticks ~20 px sobre el suelo mientras la simulación lo da por apoyado (`y=262`, `aiState=juggle`) y cae a `knockdown` de golpe (tick 97). Es el estado del que parte el *Harpoon*, así que la presentación aérea arranca rota.

**M5. La presa se lee como un solo bulto a escala real.**
- `AUD/s_pummelR_1.png` a 1x: el soldado se dibuja detrás de Kratos con el cuerpo casi entero tapado; el brazo de Kratos se pierde contra el torso del enemigo. A 480x270 el pose "agarrado por el cuello a 9,9 px del suelo" (medido, ver (a)) solo se entiende ampliando.

### MENORES

- m1. La pose de Kratos en el *Whiff* a partir del tick 13 (`whiff-recover`, pie trasero estirado) dura 8 ticks y vuelve a `idle` de golpe (tick 21 a 22 en `AUD/s_whiff_R.png`).
- m2. Para B5/B3: `DEPTH_FRONT` en el azote y el *Toss* tapa la cabeza de Kratos.
- m3. El cuerpo tendido queda **encima** de los pies de Kratos tras la muerte (`s_rip_R.png` ticks 71 a 98): solape de ~8 px.
- m4. Mirando a la izquierda no encontré fallos de espejo (flip, anclas, desplazamientos, efectos): `s_stab_L.png`, `s_slam_L.png`, `s_toss_L2.png`, `s_pummelL_1.png` son el espejo exacto del lado derecho. Los defectos de B1 a B7 se repiten idénticos.
- m5. Con dos soldados cerca (`rec/multi`, `AUD/s_multi.png`) el segundo no interfiere (invulnerabilidad), pero se queda **inmóvil mirando** durante toda la cadena (ticks 124 a 160), sin reacción.

## 4. Refutación o confirmación de las afirmaciones del implementador

| | Afirmación | Veredicto | Evidencia |
| --- | --- | --- | --- |
| (a) | Presa erguida, soldado a >= 6 px del suelo, mano en el cuello | **Confirmada en números, refutada en la lectura.** Medí 9,9 px de elevación (anclas `farHand` hold (42,8; 14,0) y `neck` held-00 (32,0; 22,9)) y la mano sí cae en el cuello; pero Kratos no queda "erguido" (zancada con torso inclinado, `s_pummelR_1.png`) y el soldado queda detrás casi oculto; 119 ticks idénticos (B6). | `s_pummelR_1.png`, `rec/breakfree_R` |
| (b) | 3 puñetazos con el soldado doblado en cada golpe | **Parcialmente cierta.** Hay 3 golpes y `held-01` dobla al soldado, pero solo 5 de los 13 ticks, el brazo que golpea no se ve, y cada golpe termina con un parpadeo de pose de embestida (B5). | `s_pummelR_1.png` (ticks 44 a 56) |
| (c) | Azote y 4 puñaladas arrodillado con la hoja alzada y clavada en el torso | **Refutada.** El azote es un teletransporte sin alzada (B3); la "hoja alzada" sube 5,7 px (M1); la 4.ª puñalada dura 5 ticks y el cadáver reaparece de pie (B2). | `s_slam_R_step1.png`, `s_laststab_R.png` |
| (d) | Toss como en el video | **Refutada.** Duración 2,5 veces menor, sin cadena, vuelo sin rotación (B7). | `v_toss_a.png`, `s_toss_L2.png` |
| (e) | Rip: alzado y estrellado, sin referencia en video | **Refutada en las dos mitades.** Sí hay referencia (`moveset.mp4` 448,5 a 452,3 s; `grab-ref/ms_grab2_3_tri_sq.png` filas 1 a 3) y el original **parte** al soldado (B1). | `v_rip_a.png`, `s_rip_R.png` |
| (f) | Las pruebas C1-C4 garantizan que se ve bien | **Refutada.** Miden mano-cuello en un instante y altura, no transiciones: no detectan el parpadeo de embestida (B5), el teletransporte de 26 px (B4), el salto del azote (B3) ni la reaparición del cadáver (B2). Habría hecho falta una prueba de continuidad (desplazamiento máximo por tick, sin pose repetida). | `spikes.py` sobre `t_pummel_R` |
| (g) | La simulación de ○ está bien y no hay que rehacerla | **Falsa en cuatro puntos**: avance del *Lunge* en dos ticks (B4), última puñalada que corta la fase (`grab.ts:477`, B2), `weakened` inalcanzable (M2), sin hitstop (M3). Los números de daño/orbes y la secuencia sí son sólidos y pueden quedar. | `grab.ts:90-97, 471-500`; `rec/fin_R/meta.json` |

## 5. Lo que sí está bien (con evidencia)

- Secuencia de fases y conteo: presa -> 3 puñetazos -> azote -> 4 puñaladas -> muerte (`phases.py` sobre `t_pummel_R` y `t_pummel_L`); coincide con los 4 golpes de arma que cuenta el original (Hits 5,6,7,8 en `v_g1_b.png`).
- Espejo izquierda/derecha correcto en todos los movimientos probados.
- *Whiff*: 31 ticks, avance ~19 px en 12 ticks, recuperación visible; coherente con un golpe fallido.
- Sin errores de consola en ninguna de las 25 grabaciones (`errors []`).

## 6. Lo que no pude verificar y por qué

- **Orion's Harpoon y agarre aéreo en el juego real**: con teclas CDP reales (4 variantes de temporización en `rec/harp*`) no logré encadenar ○ dentro de la ventana de ~15 ticks (250 ms) entre el lanzamiento y la caída; solo salió el *Ascension* y la caída del soldado (M4). Los tests unitarios sí lo cubren con ticks exactos. Que la ventana real sea tan corta es en sí un riesgo de jugabilidad, pero no lo pude aislar de mi propia sincronización. Comparación con el original: el video (`v_harp_a.png`, 458,4 a 460,5 s) repite el ciclo cada ~1,2 s con el contador de golpes subiendo.
- **Remate contextual** (ver M2): inalcanzable, no hay grabación.
- **Sonido**: Chrome sin cabeza no permite oírlo; solo auditoré en código cuándo se dispara.
- **Break Free**: no hay clip aislado en las referencias; la comparación es por la descripción del manual y del propio proyecto.
- **Cabezas de Kratos sin terminar** (brecha ya declarada): no las califiqué; a 1x la cabeza no se distingue en las poses agachadas (M1), lo que agrava B1 y M1.
- **Colisión de la ventana de refresco** (M3, duplicación a > 60 Hz): conclusión por lectura de código, no reproducida (Chrome sin cabeza va a 60 Hz).

## 7. Plan mínimo para llegar a APROBADO (por impacto)

| # | Qué | Tipo | Esfuerzo |
| --- | --- | --- | --- |
| 1 | B2: la última puñalada completa su fase, el cadáver queda en `death-02` y Kratos se incorpora (`recovery`) | código | pequeño (medio día) |
| 2 | B5: no mostrar `grab-lunge` al volver a `hold` desde `pummel` | código | trivial (una línea + prueba de continuidad) |
| 3 | B4: repartir el avance del *Lunge* en 6 a 8 ticks | código (sim) | pequeño |
| 4 | M3: flanco en los efectos y hitstop (3 a 6 ticks) en puñetazos, puñaladas y azote | código | pequeño |
| 5 | B3: azote con alzada sobre la cabeza y picada (3 poses de víctima + 3 de Kratos), `slam` de ~40 ticks | arte nuevo + ajuste de poses + código | mediano |
| 6 | B7: *Toss* a 50 ticks, giro de Kratos, vuelo con rotación y cadena | arte nuevo (3 a 4 cuadros) + código | mediano |
| 7 | B1: Rip partido en dos con mitades lanzadas | arte nuevo (6 a 8 cuadros) + código | grande |
| 8 | M1: puñaladas con hoja alzada sobre la cabeza y carrera >= 28 px | arte nuevo (2 cuadros) | mediano |
| 9 | B6: forcejeo animado y suelta con pose propia | arte (1 a 2 cuadros) + código | pequeño-mediano |
| 10 | M2: legionario `weakened` (decisión del usuario sobre si debe existir) | código + decisión | pequeño |
| 11 | M4/Harpoon: resolver la pose flotante en `juggle` en suelo y ampliar la ventana de ○ en el aire; luego grabarlo | código + verificación | pequeño-mediano |
| 12 | Añadir a `pnpm test` una **prueba de continuidad** (desplazamiento máximo de víctima y Kratos por tick, ninguna pose de otra fase fuera de lista, fase de muerte sin reinicio) para que C1 a C4 dejen de dar falsa seguridad | pruebas | pequeño |

Orden recomendado: 1, 2, 3, 4 (un día, sin arte, quitan los saltos más feos), luego 5 y 6, después 7 y 8.

## 8. Índice de evidencia (en `docs/tmp/auditoria-circulo/`)

- Juego real: `s_pummelR_1.png`, `s_pummelR_2.png`, `s_slam_R_step1.png`, `s_slam_L.png`, `s_stab_R_step1.png`, `s_stab_L.png`, `s_laststab_R.png`, `s_pummelL_1.png`, `s_toss_R.png`, `s_toss_L2.png`, `s_rip_R.png`, `s_whiff_R.png`, `s_breakfree.png`, `s_lunge_mid.png`, `s_lunge_close.png`, `s_harp4.png`, `s_multi.png`, `s_sq_cmp.png` (□ y △ de referencia).
- Video: `v_g1_a.png`, `v_g1_b.png` (*Grab 1*, 82,8 a 86,7 s de `hd.mp4`), `v_rip_a.png`, `v_toss_a.png`, `v_harp_a.png` (showcase), `v_hd_overview.png` (ubicación); fotogramas a 30 fps en `ref/g1`, `ref/rip`, `ref/toss`, `ref/harp`.
- Datos por tick: `rec/<nombre>/meta.json`; scripts: `rec.sh`, `rec.mjs`, `sheet.py`, `spikes.py`, `phases.py`, `vsheet.py`.
