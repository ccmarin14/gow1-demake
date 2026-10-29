# Estado de trabajo (registro de hilos abiertos)

> **Para qué sirve:** un único lugar que dice qué hilos hay abiertos, en qué rama vive cada uno, qué sigue y qué lo bloquea. Se lee primero al retomar el proyecto. El **estado medido del producto** está en [`estado-verificado.md`](estado-verificado.md); este archivo no lo reemplaza, ni tampoco a `docs/pendientes-de-validacion-humana.md` (comprobaciones que solo hace la usuaria).
>
> **Regla de uso:** al abrir, pausar, bloquear o cerrar un hilo, se actualiza este archivo **en el mismo commit** que el cambio. Un hilo sin fila aquí se considera olvidado. Los resultados de cada etapa siguen en su plan (`docs/planes/`) y las lecciones en `docs/aprendizajes-del-proceso.md`.
>
> **Qué significa "Cerrado y aprobado" en la tabla de hilos:** que esa etapa se implementó y pasó su auditoría en su momento. **No** significa que el producto integrado sea un juego completo. El estado medido del producto está en [`estado-verificado.md`](estado-verificado.md).

Última actualización: 2026-10-27.

## 1. Ramas

| Rama | Contenido | Estado |
| --- | --- | --- |
| `master` | Línea estable del producto integrado. El estado medido —qué arranca, qué funciona y qué defectos hay— está en [`estado-verificado.md`](estado-verificado.md): **no es un juego completo**. | **Línea estable. No es "versión final completa".** |
| `tarea/KRATOS-SPRITE-MAESTRO-01` | Fase 1: Creación del Sprite Maestro de Kratos en pixel art 16-bit con cuello visible, manos reales y verificación en cubierta. | **Aprobada en reauditoría independiente — fusionada en `master`.** |
| `arte/KRATOS-2D-SPRITE-GEN-01` | Hilo de arte; sincronizado con `master` conteniendo los sprites definitivos de Kratos. | **Cerrada y aprobada**. |
| Etiqueta `respaldo/pre-merge-2026-10-22` | Punto de respaldo previo a la fusión y al borrado de ramas. | Conservar. |

Ramas `tarea/GOW8B-{DJUMP,KRA-02,RES-01,ROLL-01,SCALE-01}`: eliminadas el 2026-10-22 (apuntaban a `e6f9013`, ancestro de `master`; sin trabajo propio).

## 2. Hilos abiertos

| Hilo | Estado | Siguiente paso | Bloqueo / decisión pendiente | Documento |
| --- | --- | --- | --- | --- |
| **Arte y animación de Kratos** (`GOW8B-ART-KRA`) | Cerrado y aprobado | Modelo cinemático articulado a 60 Hz en pixel art 16-bit de 12 colores con cuerpo musculoso espartano y rostro nítido esculpido en micro-pixel art de 10×10 px (perfil de nariz griega, ceño sombreado, perilla en cuña y tatuaje carmesí de Ares), zancada viva con deltas de 1,169 a 1,766 px, anclaje $y=58$, alfa binario, reauditado y aprobado al 100% sin regresiones (28/28 casos CDP). | Ninguno. | [`planes/KRATOS-FACE-POLISH-01.md`](planes/KRATOS-FACE-POLISH-01.md) |
| **Combate PS2, Bloqueo/Parry y locomoción** (Bloque 3 100 %) | Cerrado y aprobado | Ninguno. Bloque 3 completado y verificado (Casos A a I en CDP). | Validación humana de sensación: ver registro de pendientes. | [`verificacion.md`](verificacion.md) |
| **Arte del Legionario No-Muerto** (`GOW8B-ENEMY1-ART`) | Cerrado y aprobado | Hoja de 8 poses completada y verificada (`legionnaire.png` 512×54 px, 12 colores, $y=53$). | Ninguno. | [`planes/GOW8B-ENEMY1-ART.md`](planes/GOW8B-ENEMY1-ART.md) |
| **Conducta e IA del Legionario No-Muerto** (`GOW8B-ENEMY1-AI`) | Cerrado y aprobado | Máquina de estados completa (`approach`, `windup`, `slash`, `recover`, `hitstun`, `juggle`, `death`), interacción con Parry y Ascensión, Caso J en CDP verificado. | Ninguno. | [`planes/GOW8B-ENEMY1-AI.md`](planes/GOW8B-ENEMY1-AI.md) |
| **Vida y respuesta al daño del jugador** (`GOW8B-DAMAGE-01`) | Cerrado y aprobado | Cascada de mitigación (evasión, parry, guardia 85%), i-frames de gracia post-golpe (45 ticks), retroceso direccional, derrota a 0 HP y reinicio rápido (`R`), Caso K verificado. | Ninguno. | [`planes/GOW8B-DAMAGE-01.md`](planes/GOW8B-DAMAGE-01.md) |
| **HUD de vida clásico** (`GOW8B-HUD-01`) | Cerrado y aprobado | Marco de piedra y bronce, barra verde viva de 110 px, barra fantasma con retención de 200 ms y drenaje suave, notches cada 20 HP, alerta crítica, Caso L verificado. | Ninguno. | [`planes/GOW8B-HUD-01.md`](planes/GOW8B-HUD-01.md) |
| **Orbes rojos y verdes** (`GOW8B-ORBS-01`) | Cerrado y aprobado | Eclosión balística de 5 orbes (4 rojos, 1 verde), atracción magnética fluida, curación (+15 HP), economía de orbes rojos (+20) en HUD, Caso M verificado. Bloque 4 completado al 100 %. | Ninguno. | [`planes/GOW8B-ORBS-01.md`](planes/GOW8B-ORBS-01.md) |
| **Arte del Arquero No-Muerto** (`GOW8B-ENEMY2-ART`) | Cerrado y aprobado | Hoja de 8 poses completada y verificada (`archer.png` 512×54 px, 11 colores, $y=53$) y proyectil de flecha (`arrow.png` 16×8 px). | Ninguno. | [`planes/GOW8B-ENEMY2-ART.md`](planes/GOW8B-ENEMY2-ART.md) |
| **Conducta e IA del Arquero No-Muerto** (`GOW8B-ENEMY2-AI`) | Cerrado y aprobado | Máquina de estados completa (`reposition`, `aim` de 24 ticks, `shoot` a 280 px/s, `recover`, `hitstun`, `juggle`, `death`), reflejo Parry a 420 px/s contra el agresor, eclosión de 4 orbes, Caso N verificado en CDP. | Ninguno. | [`planes/GOW8B-ENEMY2-AI.md`](planes/GOW8B-ENEMY2-AI.md) |
| **Arte de Kratos: reemplazo del maniquí** | Cerrado y aprobado | Sustituido al 100% por los 22 fotogramas auténticos de Kratos GoW 1 pixel art 16-bit en las 5 hojas de personajes. | Ninguno. | `public/assets/characters/` |
| **Flujo y ritmo de oleadas** (`GOW8B-WAVES-01`) | Cerrado y aprobado | WaveManager formal (Oleada 1 vanguardia, pausa de respiro de 60 ticks, Oleada 2 mixta, victoria final con 5 bajas), spawn ascendente dinámico, banner centrado, Caso O verificado en CDP. | Ninguno. | [`planes/GOW8B-WAVES-01.md`](planes/GOW8B-WAVES-01.md) |
| **Zonas y delimitación de arenas** (`GOW8B-ARENA-01`) | Cerrado y aprobado | Barreras mágicas rojas de Ares ($x=70$ y $x=410$), confinamiento cinemático determinista en combate, disipación lineal de 30 ticks, reapertura del nivel ($x > 410\text{ px}$), Caso P verificado en CDP. Bloque 5 completado al 100 %. | Ninguno. | [`planes/GOW8B-ARENA-01.md`](planes/GOW8B-ARENA-01.md) |
| **Ira de Poseidón: Magia y economía** (`GOW8B-MAGIC-01`) | Cerrado y aprobado | Invocación de Ira de Poseidón (`U`/`I`, 35 MP), super-armadura, tormenta AoE multi-hit (radio 90 px, 5 impactos, aturdimiento eléctrico), barra de maná azul zafiro en HUD, orbes azules (+20 MP), Caso Q verificado en CDP. Bloque 6 completado al 100 %. | Ninguno. | [`planes/GOW8B-MAGIC-01.md`](planes/GOW8B-MAGIC-01.md) |
| **Mapa del primer nivel (Estructura lateral y segmentos)** (`GOW8B-MAP-01`) | Cerrado y aprobado | Nivel de 1440 px estructurado en 3 segmentos (Popa, Arena Central y Proa), cámara con deadzone de 32 px y bloqueo en arena ($scrollX=480$), parallax marino $0.25\times$, Caso R verificado en CDP. | Ninguno. | [`planes/GOW8B-MAP-01.md`](planes/GOW8B-MAP-01.md) |
| **Plataformeo del primer nivel (Mástiles y pasos elevados)** (`GOW8B-PLATFORM-01`) | Cerrado y aprobado | 5 plataformas canónicas (Popa, Proa, mástiles y castillo), plataformas one-way, drop-through voluntario (abajo+salto, 14 ticks), combate multicota, Caso S verificado en CDP. Bloque 7 completado al 100 %. | Ninguno. | [`planes/GOW8B-PLATFORM-01.md`](planes/GOW8B-PLATFORM-01.md) |
| **Ojos de Górgona: Expansión de vida** (`GOW8B-PICK-01`) | Cerrado y aprobado | Cofres de ojos de górgona, recolección contextual con `E`, medidor de 6 ojos en HUD, expansión permanente a 120 HP y redimensionamiento dinámico de HUD a 132 px, Caso T verificado en CDP. | Ninguno. | [`planes/GOW8B-PICK-01.md`](planes/GOW8B-PICK-01.md) |
| **Plumas de Fénix: Expansión de maná** (`GOW8B-PICK-02`) | Cerrado y aprobado | Cofres de plumas de fénix, recolección con `E`, medidor de 6 plumas zafiro en HUD, expansión permanente a 120 MP y redimensionamiento dinámico de la barra de maná a 96 px, Caso U verificado en CDP. | Ninguno. | [`planes/GOW8B-PICK-02.md`](planes/GOW8B-PICK-02.md) |
| **Cofres de orbes y mejora de arma** (`GOW8B-UPGRADE-01`) | Cerrado y aprobado | Cofres de orbes rojos (+50), mejora de arma con `P`, Nivel 2 (+30% daño en combate), indicador de oro en HUD y banner animado, Caso V verificado en CDP. Bloque 8 completado al 100 %. | Ninguno. | [`planes/GOW8B-UPGRADE-01.md`](planes/GOW8B-UPGRADE-01.md) |
| **Punto de control y reaparición** (`GOW8B-CHECK-01`) | Cerrado y aprobado | Columnas de luz dorada, captura atómica de instantánea, reaparición en $(x_{chk}, y_{chk})$, preservación de mejoras y salud al 100%, Caso W verificado en CDP. Bloque 9 completado al 100 %. | Ninguno. | [`planes/GOW8B-CHECK-01.md`](planes/GOW8B-CHECK-01.md) |
| **Arte de la Hidra: Jefe a escala naval** (`GOW8B-HYDRA-ART`) | Cerrado y aprobado | Spritesheet de 8 poses ($1024 \times 112\text{ px}$, $128 \times 112\text{ px}$ c/u, 14 colores abisales, anclaje $y=111$), hoja de contacto con silueta comparativa e integración en Phaser. | Ninguno. | [`planes/GOW8B-HYDRA-ART.md`](planes/GOW8B-HYDRA-ART.md) |
| **Combate de la Hidra: Patrones y daño** (`GOW8B-HYDRA-COMBO`) | Cerrado y aprobado | Máquina de estados determinista (rugido, mordisco, barrido, aturdimiento y colapso), cascada defensiva, barra monumental de jefe en HUD, eclosión de 19 orbes, Caso X verificado en CDP. Bloque 10 completado al 100 %. | Ninguno. | [`planes/GOW8B-HYDRA-COMBO.md`](planes/GOW8B-HYDRA-COMBO.md) |
| **Interfaz y presentación de juego** (`GOW8B-UI-01`) | Cerrado y aprobado | Capa GameFlowOverlay completa (título con omega de Ares, menú de pausa con resumen del héroe y guía de combos, pantalla de victoria con rango y bajas, pantalla de derrota adaptativa), Caso Y verificado en CDP. | Ninguno. | [`planes/GOW8B-UI-01.md`](planes/GOW8B-UI-01.md) |
| **Efectos visuales del Egeo** (`GOW8B-VFX-01`) | Cerrado y aprobado | Capa VfxLayer (lluvia marina multicapa, relámpagos con decaimiento, chispas de combate, destello estelar de parry, congelamiento en pausa), Caso Z verificado en CDP. | Ninguno. | [`planes/GOW8B-VFX-01.md`](planes/GOW8B-VFX-01.md) |
| **Audio y diseño sonoro del juego** (`GOW8B-AUDIO-01`) | Cerrado y aprobado | Motor de síntesis WebAudio procedural nativo (tajos, latigazos, parry, ira de poseidón, rugido de hidra, impactos y fanfarria triunfal), control de mute con tecla `M`, Caso AA verificado en CDP. | Ninguno. | [`planes/GOW8B-AUDIO-01.md`](planes/GOW8B-AUDIO-01.md) |
| **Partida completa del primer nivel** (`GOW8B-FULL-01`) | Cerrado y aprobado | Recorrido continuo integral de Popa a Proa con superación de arena de combate, plataformeo en mástiles, checkpoint, batalla culminante contra la Hidra y pantalla de victoria con rango espartano, Caso AB verificado en CDP. | Ninguno. | [`planes/GOW8B-FULL-01.md`](planes/GOW8B-FULL-01.md) |
| **Auditoría final independiente del producto integrado** (`GOW8B-FINAL-01`) | Cerrado y aprobado | Auditoría integral final completada con éxito: 100% de los 28 casos en Chrome CDP aprobados, cero errores en consola, cero fugas de arnés en dist/, 100% de assets pixel art validados. Plan completo de 34 etapas finalizado. | Ninguno. Producto 100% completado. | [`planes/GOW8B-FINAL-01.md`](planes/GOW8B-FINAL-01.md) |
| **Verdad documental** (`DOC-TRUTH-01`) | **Cerrado — 2026-10-26** | Alinear documentación con el estado medido; registrar defectos conocidos (V-01…V-06) | Ninguno | [`estado-verificado.md`](estado-verificado.md) |
| **Pixel art basado en ASCII** (`PIXEL-ART-ASCII-MASTER-01`) | **En curso — 2026-10-27: `idle` y `run` conectados y medidos; 12 cuadros archivados** | Maestro `grids/kratos/master.txt` en circulación. **6 cuadros activos**: `master` (neutral), `idle-01`, `run-00..03`. `idle-01`: pecho y hombros +1 px por lado en `y25..y28`, cabeza byte-idéntica (`I4` PASS), alterna a **983 ms** por cuadro. `run`: 4 poses (contacto, paso, contacto opuesto, paso opuesto) producidas **posando** el cuerpo del maestro (filas de pierna cizalladas y acortadas, brazos rotados rígidos, cabeza/torso/faldón/cadenas/sombra verbatim); `I1`–`I4`, `I6`, `I7` PASS y **I8 PASS** (cambios 446/311/441/306 px; `head`, `torso_core` y `shadow` en **0 px**). Clip conectado: ciclo **166–183 ms**, 37/37 celdas sonda en el cuadro correcto, **987/987 píxeles** exactos contra `kratos-run-01.png`, consola limpia. Los 12 cuadros de `run-00..05`, `air` y `attack` se **archivaron con métricas** (27–77 px de cambio, solo piernas, pie inmóvil). `attack`/`air` congelados; `roll`/`guard` sin grid. | **Siguiente:** juicio visual de la usuaria sobre `run` (`docs/preview/run-batch-8x.png`, `docs/preview/idle-vs-run-browser-4x.png`). Bloqueos: **8 px de deslizamiento por apoyo** (decisión abierta sobre zancada), sombra cocida que viaja con el sprite (V-12) y cadenas procedurales de `WeaponLayer` (V-14). | [`planes/PIXEL-ART-ASCII-MASTER-01.md`](planes/PIXEL-ART-ASCII-MASTER-01.md) |

## 3. Decisiones

**Tomadas (delegadas por la usuaria el 2026-10-22):**

1. `master` se fusiona con la línea estable (hecho, avance directo).
2. Se borran las ramas antiguas sin trabajo propio (hecho).
3. **Paleta:** se amplía de 6 a un máximo de **12 colores** para los sprites de Kratos, porque los sprites generados con el diseño de GoW 1 usan ~11 (rojo del tatuaje, naranja de runas, acero claro). Se aplica al integrar, con aserción de máximo 12 colores en lugar de la paleta exacta de 6, y se actualizará `AGENTS.md`/`verificacion.md` en esa etapa. Si la usuaria prefiere otra cosa, se revierte antes de integrar.

**Tomadas (2026-10-26):**

4. **Pixel art basado en ASCII (D-25):** el grid de texto es la fuente de verdad de los personajes; el PNG es derivado. El rig modular cut-out se archiva como viabilidad. Ver [`planes/PIXEL-ART-ASCII-MASTER-01.md`](planes/PIXEL-ART-ASCII-MASTER-01.md).

**Tomadas (2026-10-27):**

5. **Cuadros dibujados, no derivados; el arma no se hornea (D-26):** cada cuadro de Kratos se dibuja completo y la animación no se genera por traslación ni interpolación. Lo único procedural es lo que no es cuerpo (cuchillas, cadenas, estela, partículas). Por eso `attack` se dibuja **sin arma**: `WeaponLayer` ya la pone. Ver [`decisiones.md`](decisiones.md) D-26.

**Tomadas (2026-10-27, corrección):**

6. **Poses sobre la anatomía (D-27):** un cuadro de animación se produce posando el cuerpo del maestro —filas de pierna cizalladas y acortadas, brazo rotado rígido alrededor del hombro— y la compuerta I8 verifica que cambien las bandas correctas y que cabeza/torso/sombra queden en 0 px. Prohibido inventar formas o trasladar regiones completas (V-15). Refina D-26: «dibujado completo» = ninguna forma inventada, y el criterio medible es I8. Ver [`decisiones.md`](decisiones.md) D-27.

**Pendientes de la usuaria (2026-10-26):**

1. Aprobar o rechazar **el maestro nuevo de Kratos** en pantalla (`neutral-00`), y decidir si se rediseña la cabeza contra R1–R5 antes de invertir en animación.
2. Decidir si `level1` pasa a ser el arranque por defecto; V-01 debe corregirse antes.
3. Confirmar el archivo formal del hilo modular (`KRATOS-MODULAR-PIXEL-ART-RIG-01`).

## 4. Cómo se retoma una pausa

1. Leer este archivo y el plan del hilo.
2. `git switch` a la rama indicada y comprobar que el árbol está limpio.
3. Ejecutar el siguiente paso de la tabla; si cambia el alcance, actualizar la fila antes de empezar.
4. Al cerrar: actualizar plan, `verificacion.md` y esta tabla; commit único.

## 5. Material sin versionar

`scratch/` contiene intentos de arte (comparativas, imágenes generadas, recortes de referencia). Es material de trabajo, no fuente de verdad. Si un resultado se aprueba, se copia a `public/assets/` o `docs/referencias/` con su hash en el plan correspondiente.
