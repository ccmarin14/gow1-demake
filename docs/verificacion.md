# Guía de verificación

> **Estado vigente:** está ejecutable el shell Phaser/Vite en lienzo lógico horizontal **480×270**, con infraestructura de simulación determinista, harness DEV, movimiento horizontal, fondo del Egeo integrado, arte procedural articulado de Kratos (`GOW8B-KRA-02`, rediseño maestro en pixel art `KRATOS-ART-MODEL-01` aprobado con relieve muscular, faldón pteruges y cadenas enrolladas en antebrazos en los 6 spritesheets; sprite maestro idle y neutral 2D GoW 1 auténtico integrado en `public/assets/characters/`), arte e IA del primer esbirro (`GOW8B-ENEMY1-ART` y `GOW8B-ENEMY1-AI`: Legionario No-Muerto de Ares completamente animado con persecución, aviso de ataque `windup`, tajo, desvío por *Parry*, elevación aérea `juggle` y colapso `death`), sistema integral de salud y mitigación de daño del jugador (`GOW8B-DAMAGE-01`: deducción de vida, retroceso direccional, 45 ticks de *i-frames* post-daño con parpadeo, absorción del 85 % en guardia, derrota a 0 HP y reinicio rápido con `R`), HUD clásico de vida de GoW 1 (`GOW8B-HUD-01`: marco de piedra y bronce, barra verde esmeralda, barra fantasma de drenaje suave, marcas cada 20 HP y alerta crítica), sistema de orbes y economía de combate (`GOW8B-ORBS-01`: orbes verdes de curación y orbes rojos con atracción magnética, absorción y contador en HUD), salto simple y doble salto (`GOW8B-JUMP-01`, `GOW8B-DJUMP-01`), inercia de locomoción, derrape en giro y aterrizaje elástico (`GOW1-LOCO-WEIGHT-01`), escala y silueta de referencia (`GOW8B-SCALE-01`), rodada terrestre con i-frames y salida ágil hacia ataque (`GOW8B-ROLL-01`, `GOW8B-ROLL-ART`), Cuchillas del Caos con cadenas, hoja orientada y estela continua (`GOW8B-CHAOS-01`), repertorio completo de combate de *God of War 1* PS2 en 2D (`GOW1-COMBAT-2D-01`, `GOW1-COMBAT-POLISH-01`, `GOW1-COMBAT-BODY-01`, `GOW1-COMBOS-EXT-01`, `GOW8B-GUARD-01`: cadena ligera de 4 golpes `J,J,J,J`, remate *Spirit of Hercules* `J,J,J,K`, *Plume of Prometheus* con azote al suelo `yTop`, *Ascension launcher* para combate aéreo, agarre y azote aéreo *Orion's Harpoon*, ataque en carrera/salida de esquiva *Olympic Slash*, y sistema de guardia terrestre y desvío perfecto *Parry* de 6 ticks con `Q`). Bloque 3 y Bloque 4 completados al 100 %. El plan se re-baselinó el 2026-10-16 a dos niveles (**bloques** = aprueba la usuaria; **etapas** = audita un subagente). Las etapas de Fundación (1–10.5), el Bloque 1 completo (`GOW8B-SCALE-01`, `GOW8B-DJUMP-01`, `GOW8B-ROLL-01`), el Bloque 2 (`GOW8B-CHAOS-01`), el Bloque 3 al 100 % (órdenes 5, 6, 7, 8 y 9) y el Bloque 4 al 100 % (órdenes 10, 11, 12, 13 y 14) están **aprobados** tras auditoría independiente de solo lectura. El 2026-10-21 la usuaria autorizó el plan de optimización técnica y estructural **`GOW8B-OPTIM-01`** ([`docs/planes/OPTIM-01.md`](planes/OPTIM-01.md)). El 2026-10-22 la usuaria autorizó el plan integral de arte y combate de PS2 (`KRATOS-ART-MODEL-01`, `GOW1-LOCO-WEIGHT-01`, `GOW1-COMBAT-BODY-01`, `GOW1-COMBOS-EXT-01`, `GOW8B-GUARD-01`), y la continuación del Bloque 4, todos ellos completados, verificados en navegador y aprobados tras auditoría independiente de solo lectura. Las aprobaciones anteriores al ciclo actual pertenecen al prototipo descartado y son historial, no pruebas del shell ni del producto futuro. `DOC-ALIGN-01` cerró la alineación documental; las etapas 1 `GOW8B-VIS-01`, 2 `GOW8B-KRA-01`, 3 `GOW8B-ENV-01`, 4 `GOW8B-CMP-01` y 5 `GOW8B-DEV-01` están aprobadas. `GOW8B-CMP-01` queda aprobada con verificación visual humana **diferida y no bloqueante** (§CMP-01). La etapa 6 `GOW8B-MOVE-01` (movimiento horizontal) está **aprobada** (2026-10-15) tras auditoría independiente de solo lectura (§GOW8B-MOVE-01). La etapa **6.5 `GOW8B-RES-01`** (migración a 480×270 e integración de assets, §GOW8B-RES-01) está **aprobada** (2026-10-15) tras auditoría independiente de solo lectura. La etapa 7 **`GOW8B-ANIM-01`** (animación de carrera con ciclo **placeholder procedural provisional**, §GOW8B-ANIM-01) está **aprobada** (2026-10-15) tras auditoría independiente de solo lectura. Tras cerrarla se autorizó y quedó **aprobada** ese mismo día la etapa 8 **`GOW8B-JUMP-01`** (salto y plataformas, §GOW8B-JUMP-01) tras auditoría independiente de solo lectura, a continuación se autorizó la etapa 9 **`GOW8B-LIGHT-01`** (ataque ligero, §GOW8B-LIGHT-01), que quedó **aprobada** ese mismo día tras auditoría independiente de solo lectura, y enseguida la etapa 10 **`GOW8B-COMBO-01`** (combo ligero, §GOW8B-COMBO-01), que queda **aprobada** el 2026-10-16 tras auditoría independiente de solo lectura. El 2026-10-16 el usuario autorizó el enfoque de arte de animación de Kratos (**generación procedural + verificación visual local**, D-21) y la conservación **sin integrar** de los artefactos generados sin autorización (D-22); se inserta la etapa **10.5 `GOW8B-KRA-02`** (arte definitivo de animación de Kratos, §GOW8B-KRA-02); el 2026-10-16 el usuario autorizó su ejecución y el arte se **generó e integró** (idle 2, carrera 6, aire 2, ataque 7, rodada 4; `PROVISIONAL_ART = false`; `CONFIG.player.run.frames = 6`, desajuste 6-vs-4 **resuelto**), quedando **aprobada** tras auditoría independiente de solo lectura. Con esto, las etapas 1–10.5, el Bloque 1 (Orden 1–3), el Bloque 2 (Orden 4) y la totalidad del Bloque 3 (Orden 5 a 9) están 100 % aprobados.

## Fuente de verdad y estado

La dirección acordada es una adaptación web horizontal con resolución interna de 480×270 (D-12) cuya **historia, lore, enemigos y repertorio completo de armas y ataques provienen del primer *God of War* (2005, PlayStation 2)** (D-03, D-24), mientras que *God of War: Betrayal* se usa únicamente como referencia visual y espacial de cámara lateral 2D (D-20). Los ataques iniciales de las Cuchillas del Caos (Nivel 1 de PS2) se traducen al plano 2D con equivalencia directa de botones (`J` = Cuadrado $\square$, `K` = Triángulo $\triangle$, `L` = Círculo $\bigcirc$, `Espacio` = Equis $\times$) e impacto físico real de las cadenas contra el suelo (`yTop`) y contra los enemigos (*hitstop*, retroceso `vx` y levantamiento aéreo *launch* `vy`). Todo recurso integrado es original; las referencias externas son solo material de estudio. El primer objetivo narrativo es el Egeo y la Hidra. La presentación escala el canvas para una ventana amplia del navegador, con pixelado nítido y sin suavizado; la resolución interna no limita su tamaño CSS.

dejo la etapa 10.5 `GOW8B-KRA-02` **aprobada** y la etapa 10 `GOW8B-COMBO-01` **aprobada**, ambas tras auditoría independiente de solo lectura (2026-10-16); el 2026-10-17 el usuario autorizó el inicio del desarrollo (Bloque 1), se ejecutó la etapa **1 `GOW8B-SCALE-01`** (escala y silueta de referencia) y quedó **aprobada** ese mismo día tras auditoría independiente de solo lectura. La lista siguiente reemplaza como plan vigente la secuencia histórica de 22 etapas del prototipo descartado. `GOW8B-VIS-01`, `GOW8B-KRA-01`, `GOW8B-ENV-01`, `GOW8B-CMP-01`, `GOW8B-DEV-01` y `GOW8B-MOVE-01` están aprobadas tras auditoría. La etapa 6 `GOW8B-MOVE-01` (movimiento horizontal) se autorizó el 2026-10-15 y quedó aprobada el mismo día. Ese mismo día la usuaria eligió migrar el runtime a 480×270 e integrar los assets aprobados antes de la animación de carrera: se insertó la etapa **6.5 `GOW8B-RES-01`**, que quedó **aprobada** también el 2026-10-15 tras auditoría independiente de solo lectura. Enseguida autorizó la etapa 7 `GOW8B-ANIM-01` (animación de carrera), que quedó **aprobada** el 2026-10-15 tras auditoría independiente de solo lectura, con ciclo **provisional**. Al cerrarla se autorizó la etapa 8 `GOW8B-JUMP-01` (salto y plataformas), que quedó **aprobada** el 2026-10-15 tras auditoría independiente de solo lectura. A continuación se autorizó la etapa 9 `GOW8B-LIGHT-01` (ataque ligero), que quedó **aprobada** el 2026-10-15 tras auditoría independiente de solo lectura. Enseguida se autorizó la etapa 10 `GOW8B-COMBO-01` (combo ligero), que quedó **aprobada** el 2026-10-16 tras auditoría independiente de solo lectura (con arte provisional en su momento, hoy sustituido por el definitivo de la etapa 10.5). El 2026-10-16, tras una tarea de investigación de arte (solo lectura), el usuario autorizó el enfoque de la etapa **10.5 `GOW8B-KRA-02`** (generación procedural articulada + verificación visual local, D-21) y después autorizó su **ejecución**: el arte se **generó e integró** ese mismo día (hojas idle/carrera/aire/ataque, `PROVISIONAL_ART = false`, `run.frames = 6`) y quedó **aprobada** tras auditoría independiente de solo lectura; ver «Estado de implementación (2026-10-16)» en §GOW8B-KRA-02. Las etapas numeradas 11–29 siguen pendientes de autorización.

El 2026-10-15, a partir de `investigacion-y-definicion.md`, se añadieron tres etapas al plan —**13 Bloqueo y parry** (H-1), **18 Finisher contextual** (H-2) y **22 Orbes, cofres y mejoras** (H-3)— y se incorporaron a criterios los hallazgos **PR-01** (umbrales de game feel), **PR-02** (trazas y paso fijo en el harness) y **PR-03** (separación de enemigos). El plan pasó de 26 a **29 etapas**. Las etapas ya aprobadas y la etapa 4 `GOW8B-CMP-01` no cambiaron de contenido. El mismo día se fijó **D-20** (PR-07): la jugabilidad lateral de *Betrayal*, incluida su verticalidad, es el baseline a igualar o superar, concretado en el alcance vertical de la etapa 8 y en los umbrales de las etapas de combate.

También el 2026-10-15, tras la aprobación de la etapa 6, la usuaria autorizó migrar el runtime a 480×270 e integrar los assets aprobados (fondo Egeo y pose neutral de Kratos) **antes** de la animación de carrera. Se insertó la etapa **6.5 `GOW8B-RES-01`** entre las etapas 6 y 7 —**sin renumerar** las etapas 7–29, para no romper las referencias en prosa a números de etapa—, de modo que el plan pasa de 29 a **30 etapas**.

## Etapas y criterios de aceptación

## Plan vigente por bloques y etapas (re-baselinado 2026-10-16)

> **Dos niveles.** Cada **bloque** es un item mayor que aprueba la usuaria (juicio de aspecto, sensación y diversión); cada **etapa** dentro de un bloque es un componente verificable que **audita un subagente** distinto del implementador (reglas, determinismo, integración). Los códigos `GOW8B-*` son **identificadores estables** y **no se renumeran**; el orden real de ejecución se indica en la columna «Orden». Las etapas ya aprobadas son **fundación provisional reutilizable**. El **sonido** es **transversal**: se añade simple en cada etapa y se pule al final. El **arte fino** (personaje, esbirros y enemigos) se difiere al final para no retrasar el avance; el **estilo actual del personaje no se cambia** hasta ese pulido.

> **Pendientes de validación humana:** las comprobaciones que solo la usuaria puede hacer con su navegador (lectura visual, sensación, lateralidad) están consolidadas en [`docs/pendientes-de-validacion-humana.md`](pendientes-de-validacion-humana.md). Son **no bloqueantes** y **no detienen el avance**.

### Fundación (aprobada; provisional reutilizable)

| ID | Etapa | Estado |
| --- | --- | --- |
| GOW8B-VIS-01 · KRA-01 · ENV-01 · CMP-01 | Referencia visual, pose neutral, fondo y composición (conceptuales) | **Aprobadas**; provisionales. CMP-01 con revisión visual humana diferida. |
| GOW8B-DEV-01 | Contrato y harness DEV (PR-02, D-16) | **Aprobada** (2026-10-15). |
| GOW8B-MOVE-01 | Movimiento horizontal (PR-01) | **Aprobada** (2026-10-15). |
| GOW8B-RES-01 | 480×270 e integración de assets | **Aprobada** (2026-10-15). |
| GOW8B-ANIM-01 | Animación de carrera (placeholder procedural) | **Aprobada** (2026-10-15); arte provisional. |
| GOW8B-JUMP-01 | Salto y plataformas (PR-01, D-20) | **Aprobada** (2026-10-15); arte provisional. |
| GOW8B-LIGHT-01 | Ataque ligero | **Aprobada** (2026-10-15); arte provisional. |
| GOW8B-COMBO-01 | Ataque ligero encadenado (base del combo) | **Aprobada** (2026-10-16) tras auditoría independiente de solo lectura. |
| GOW8B-KRA-02 | Arte de animación de Kratos (idle/carrera/aire/ataque) | **Aprobada** (2026-10-16) tras auditoría independiente de solo lectura. |

### Bloque 1 — Identidad y movilidad

| Orden | ID | Etapa | Estado |
| --- | --- | --- | --- |
| 1 | GOW8B-SCALE-01 **(nueva)** | Escala y silueta de referencia: reutiliza el arte actual **sin cambiar el estilo**; fija la línea de pies, la altura útil y los radios de alcance que condicionan el mapa | **Aprobada** (2026-10-17) tras auditoría independiente de solo lectura (§GOW8B-SCALE-01). |
| 2 | GOW8B-DJUMP-01 **(nueva)** | Doble salto (segundo impulso aéreo, compatible con la etapa 8) | **Aprobada** (2026-10-17) tras auditoría independiente de solo lectura (§GOW8B-DJUMP-01). |
| 3 | GOW8B-ROLL-01 **(nueva)** | Rodada con i-frames (absorbe la antigua «Esquiva»; su verificación plena se cierra al llegar el daño, Bloque 4) | **Aprobada** (2026-10-17): hallazgo bloqueante **H-ROLL-1** corregido por compuerta de plan y re-auditado por un auditor distinto (§GOW8B-ROLL-01). |

### Bloque 2 — Arma: Cuchillas del Caos

| Orden | ID | Etapa | Estado |
| --- | --- | --- | --- |
| 4 | GOW8B-CHAOS-01 **(nueva)** | Cuchillas del Caos: identidad del arma, cadenas de 14 eslabones, hoja pixel-art orientada, estela continua y sincronización de dos hojas (`GOW8B-ART-POLISH-01` / `GOW8B-ART-POLISH-02`) | **Aprobada** (2026-10-22) tras auditoría visual en navegador con mosaico de 30 ticks del `<canvas>` real (`scratch/re-audit-combo.png`). Deuda HC-1 resuelta. Ver §GOW8B-CHAOS-01. |

### Bloque 3 — Ataques y combate cuerpo a cuerpo (*God of War* PS2 Nivel 1 en 2D — D-24)

| Orden | ID | Etapa | Estado |
| --- | --- | --- | --- |
| 5 | GOW8B-LIGHT-01 (revalidar) | Ataque ligero (`J` = Cuadrado $\square$) sobre las Cuchillas: tajos rápidos encadenados con latigazo de cadena, avance corporal `lungeVx` (45–60 px/s) e impacto contra enemigos (*hitstop* y retroceso `vx`). Pulido con cadena completa de 4 tajos (`light_1 -> light_2 -> light_3 -> light_4`), alternancia de brazos y continuidad visual sin parpadeo. | **Aprobada y pulida** (2026-10-22) bajo los planes [`GOW1-COMBAT-2D-01`](planes/GOW1-COMBAT-2D-01.md), [`GOW1-COMBAT-POLISH-01`](planes/GOW1-COMBAT-POLISH-01.md), [`GOW1-COMBAT-BODY-01`](planes/GOW1-COMBAT-BODY-01.md) y [`GOW1-COMBOS-EXT-01`](planes/GOW1-COMBOS-EXT-01.md) tras auditoría independiente de solo lectura. |
| 6 | GOW8B-HEAVY-01 | Ataque pesado (`K` = Triángulo $\triangle$, PR-01, D-24): golpe pesado descendente con colisión de cadena contra el suelo (`yTop`), avance `lungeVx: 60`, y *Launcher* ascendente (*Ascension*, mantiene `K` o segundo golpe) que lanza enemigos al aire (`vy < 0`). Pulido con remate sísmico y aceleración elástica. | **Aprobada y pulida** (2026-10-22) bajo los planes [`GOW1-COMBAT-2D-01`](planes/GOW1-COMBAT-2D-01.md), [`GOW1-COMBAT-POLISH-01`](planes/GOW1-COMBAT-POLISH-01.md), [`GOW1-COMBAT-BODY-01`](planes/GOW1-COMBAT-BODY-01.md) y [`GOW1-COMBOS-EXT-01`](planes/GOW1-COMBOS-EXT-01.md) tras auditoría independiente de solo lectura. |
| 7 | GOW8B-COMBO-01 (ampliar D-24) | Combos de Nivel 1 de PS2 en 2D: ***Plume of Prometheus* (`J, J, K` = $\square, \square, \triangle$)** con azote masivo contra el suelo (`yTop`, 110 px), onda sísmica (`shockRadius: 28 px`), ***Spirit of Hercules* (`J, J, J, K`)** con doble barrido de 105 px, y ataques aéreos con sustentación gravitatoria (30 %) y picado en el aire. | **Aprobada y pulida** (2026-10-22) bajo los planes [`GOW1-COMBAT-2D-01`](planes/GOW1-COMBAT-2D-01.md), [`GOW1-COMBAT-POLISH-01`](planes/GOW1-COMBAT-POLISH-01.md), [`GOW1-COMBAT-BODY-01`](planes/GOW1-COMBAT-BODY-01.md) y [`GOW1-COMBOS-EXT-01`](planes/GOW1-COMBOS-EXT-01.md) tras auditoría independiente de solo lectura. |
| 8 | GOW8B-GUARD-01 | Bloqueo y parry (H-1): guardia terrestre (`Q`), bloqueo de desplazamiento horizontal ($v_x = 0$), ventana de *Parry* de 6 ticks (100 ms) al inicio de la guardia, y cancelación ágil hacia esquiva (`Shift` / rodada) o contrataque inmediato (`J`/`K`/`L` o salto). | **Aprobada** (2026-10-22) bajo el plan [`GOW8B-GUARD-01`](planes/GOW8B-GUARD-01.md) tras auditoría independiente de solo lectura. |
| 9 | GOW8B-FINISH-01 | Agarre con cadena (`L` = Círculo $\bigcirc$, H-2, D-24): lanzamiento horizontal de cadena hasta 135 px para tracción/derribo terrestre, **agarre/azote aéreo *Orion's Harpoon* (`air_grab`)** que proyecta al objetivo contra la cubierta (`vy = 480 px/s`), y **ataque en carrera/salida de esquiva *Olympic Slash* (`dash_attack`)** | **Aprobada base de agarres y dash-attack** (2026-10-22) bajo los planes [`GOW1-COMBAT-2D-01`](planes/GOW1-COMBAT-2D-01.md), [`GOW1-COMBAT-POLISH-01`](planes/GOW1-COMBAT-POLISH-01.md), [`GOW1-COMBAT-BODY-01`](planes/GOW1-COMBAT-BODY-01.md) y [`GOW1-COMBOS-EXT-01`](planes/GOW1-COMBOS-EXT-01.md); remates contextuales específicos de esbirros al llegar el Bloque 4. |

### Bloque 4 — Primer esbirro, vida y daño

| Orden | ID | Etapa | Estado |
| --- | --- | --- | --- |
| 10 | GOW8B-ENEMY1-ART | Arte del combatiente (primer esbirro: Legionario No-Muerto de Ares): hoja de 8 fotogramas de 64×54 px en pixel art original (`idle`, `walk_1`, `walk_2`, `windup`, `attack`, `hurt`, `juggle`, `death`), anclaje $y=53$, paleta estricta de 12 colores, jerarquía de escala (46–50 px) y hoja de contacto de referencia. | **Aprobada** (2026-10-22) bajo el plan [`GOW8B-ENEMY1-ART`](planes/GOW8B-ENEMY1-ART.md) tras auditoría independiente de solo lectura. |
| 11 | GOW8B-ENEMY1-AI | Conducta del combatiente (Legionario No-Muerto, PR-03): máquina de estados en simulación pura (`approach`, `windup` de 400 ms con telegraph visual, interrupción por iniciativa ofensiva, `slash` frontal con interacción completa ante rodada, guardia y desvío *Parry* con aturdimiento largo de 32 ticks, elevación aérea `juggle` por Ascensión y colapso `death` a 0 HP), sincronizada con la textura `legionnaire.png` en Phaser y verificada con Caso J en Chrome CDP. | **Aprobada** (2026-10-22) bajo el plan [`GOW8B-ENEMY1-AI`](planes/GOW8B-ENEMY1-AI.md) tras auditoría independiente de solo lectura. |
| 12 | GOW8B-DAMAGE-01 | Vida y respuesta al daño del jugador (PR-01): cascada de mitigación defensiva (evasión, desvío *Parry*, absorción del 85 % en guardia activa), deducción de salud ($100 \rightarrow 88$), interrupción de ataque, retroceso direccional $v_x = \pm 140$, 45 ticks de *i-frames* post-daño con parpadeo visual, tinte de dolor `0xff5555`, estado terminal de derrota a 0 HP y reinicio rápido determinista (`R`), verificado con Caso K en Chrome CDP. | **Aprobada** (2026-10-22) bajo el plan [`GOW8B-DAMAGE-01`](planes/GOW8B-DAMAGE-01.md) tras auditoría independiente de solo lectura. |
| 13 | GOW8B-HUD-01 **(nueva)** | HUD de vida clásico de God of War 1 (PS2 / Betrayal): marco ornamental de piedra griega y bronce tallado en esquina superior izquierda, barra de salud verde esmeralda de 110 px, muescas cada 20 HP, barra fantasma (*ghost health*) con retención de 200 ms y drenaje suave post-impacto, pulsación en salud crítica ($\le 25\%$) y texto numérico pixel-art `HP: X/100`, verificado con Caso L en Chrome CDP. | **Aprobada** (2026-10-22) bajo el plan [`GOW8B-HUD-01`](planes/GOW8B-HUD-01.md) tras auditoría independiente de solo lectura. |
| 14 | GOW8B-ORBS-01 | Orbes rojos y verdes (economía y recuperación, H-3): eclosión balística determinista en abanico ($[-40..40]\text{ px/s}$) al derrotar esbirros (4 rojos, 1 verde), atracción magnética fluida hacia el pecho de Kratos (radio de 180 px, velocidad 320 px/s), absorción en cuerpo con destello visual, curación de vida en HUD (`+15 HP`) e incremento del saldo de orbes rojos (`+20`), verificado con Caso M en Chrome CDP. | **Aprobada** (2026-10-22) bajo el plan [`GOW8B-ORBS-01`](planes/GOW8B-ORBS-01.md) tras auditoría independiente de solo lectura. Bloque 4 completado al 100 %. |

### Bloque 5 — Ordas y zonas de combate

| Orden | ID | Etapa | Estado |
| --- | --- | --- | --- |
| 15 | GOW8B-ENEMY2-ART | Arte del combatiente a distancia (segundo esbirro: Arquero No-Muerto de Ares): hoja de 8 fotogramas de 64×54 px en pixel art original (`idle`, `walk_1`, `walk_2`, `aim` con telegraph amatista, `shoot`, `hurt`, `juggle`, `death`), anclaje $y=53$, proyectil de flecha 16×8 px, paleta estricta de 11 colores, diferenciación espectral violeta y hoja de contacto de referencia. | **Aprobada** (2026-10-23) bajo el plan [`GOW8B-ENEMY2-ART`](planes/GOW8B-ENEMY2-ART.md) tras auditoría independiente de solo lectura. |
| 16 | GOW8B-ENEMY2-AI | Conducta del arquero: posición, anticipación, trayectoria y recuperación | Pendiente; no activa. |
| 17 | GOW8B-WAVES-01 | Flujo y ritmo de oleadas: aparición, barrera, despeje, liberación y cantidad (PR-03) | Pendiente; no activa. |
| 18 | GOW8B-ARENA-01 **(nueva)** | Zonas de combate (delimitación y comportamiento del área de combate) | Pendiente; no activa. |

### Bloque 6 — Magia

| Orden | ID | Etapa | Estado |
| --- | --- | --- | --- |
| 19 | GOW8B-MAGIC-01 **(nueva)** | Ira de Poseidón (única magia por ahora; economía de magia) | Pendiente; no activa. |

### Bloque 7 — Mapa y plataformeo

| Orden | ID | Etapa | Estado |
| --- | --- | --- | --- |
| 20 | GOW8B-MAP-01 **(nueva)** | Mapa del primer nivel (estructura lateral y segmentos) | Pendiente; no activa. |
| 21 | GOW8B-PLATFORM-01 **(nueva)** | Plataformeo del nivel: extiende la etapa 8 a la geometría real | Pendiente; no activa. |

### Bloque 8 — Recogibles y cofres

| Orden | ID | Etapa | Estado |
| --- | --- | --- | --- |
| 22 | GOW8B-PICK-01 **(nueva)** | Ojos de cíclope | Pendiente; no activa. |
| 23 | GOW8B-PICK-02 **(nueva)** | Plumas de fénix | Pendiente; no activa. |
| 24 | GOW8B-UPGRADE-01 | Cofres y mejora de arma (H-3, resto) | Pendiente; no activa. |

### Bloque 9 — Checkpoint

| Orden | ID | Etapa | Estado |
| --- | --- | --- | --- |
| 25 | GOW8B-CHECK-01 | Checkpoint (activación, estado guardado y reintento) | Pendiente; no activa. |

### Bloque 10 — Jefes (Hidra)

| Orden | ID | Etapa | Estado |
| --- | --- | --- | --- |
| 26 | GOW8B-HYDRA-ART | Arte de la Hidra: cabeza, silueta y poses a escala del escenario | Pendiente; no activa. |
| 27 | GOW8B-HYDRA-COMBO **(nueva)** | Combate de la Hidra: avisos, patrones, daño, ventanas vulnerables y resultado | Pendiente; no activa. |

### Bloque 11 — Pulido de arte (diferido)

| Orden | ID | Etapa | Estado |
| --- | --- | --- | --- |
| 28 | GOW8B-ART-KRA | Arte fino del personaje (Kratos), sobre la movilidad y las animaciones ya hechas | Pendiente; no activa. |
| 29 | GOW8B-ART-ENEMY | Arte fino de esbirros y enemigos | Pendiente; no activa. |

### Bloque 12 — Presentación y cierre

| Orden | ID | Etapa | Estado |
| --- | --- | --- | --- |
| 30 | GOW8B-UI-01 | Interfaz (inicio, HUD, pausa, estados terminales) | Pendiente; no activa. |
| 31 | GOW8B-VFX-01 | Efectos visuales (impactos, clima y cámara sin tapar lectura) | Pendiente; no activa. |
| 32 | GOW8B-AUDIO-01 | Audio (transversal; cierre y balance tras prueba de escucha) | Pendiente; no activa. |
| 33 | GOW8B-FULL-01 | Partida completa del primer nivel | Pendiente; no activa. |
| 34 | GOW8B-FINAL-01 | Auditoría final independiente del producto integrado | Pendiente; no activa. |

**Correspondencia con la numeración anterior (para no romper referencias en prosa):** 11 ataque pesado · 12 esquiva (→ rodada `GOW8B-ROLL-01`) · 13 bloqueo y parry · 14 respuesta al daño · 15 arte del combatiente · 16 arte del arquero · 17 conducta del combatiente · 18 finisher contextual · 19 conducta del arquero · 20 flujo y ritmo de oleadas · 21 checkpoint · 22 orbes, cofres y mejoras · 23 arte de la Hidra · 24 combate de la Hidra · 25 interfaz · 26 efectos visuales · 27 audio · 28 partida completa · 29 auditoría final. Las etapas 1–10.5 conservan su número.



 — GOW8B-VIS-01

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

### Criterios de salida — GOW8B-DEV-01 (etapa 5)

**Objetivo:** establecer el contrato DEV y el bucle de simulación determinista **sin gameplay**. Movimiento, combate, enemigos, arte y audio son etapas posteriores; aquí solo se entrega la infraestructura sobre la que se apoyarán. El contenido del mundo es mínimo (tick, tiempo y un escenario de prueba); no se implementa movimiento ni combate, y los criterios de game feel (PR-01) aplican a partir de la etapa 6.

1. **Simulación separada de Phaser (D-09).** Módulo(s) de simulación que no importan Phaser ni acceden al DOM; el mundo es serializable y avanza con `step(actions)` de forma determinista. Las escenas Phaser presentan el estado, no lo poseen.
2. **Paso fijo desacoplado del render (PR-02, D-16).** La simulación avanza en pasos de duración fija definidos en la configuración (objetivo 60 Hz). La garantía de determinismo tiene dos caras y ambas deben cumplirse: **(a)** dada la **misma traza de acciones por tick**, el estado por tick (checksum) es idéntico con independencia de cómo se empaquetaron esos ticks en deltas de render (a 60 fps, a 30 fps o de forma irregular); **(b)** el empaquetado en vivo de un delta de render multi-tick aplica a cada tick la entrada sostenida de ese frame, de modo que la **duración física** de una pulsación puede cubrir más ticks a menor tasa de render. Esa diferencia es comportamiento esperado, no una violación de determinismo: la unidad canónica de reproducción es la **traza por tick** (lo que `record` captura y `replay` reproduce), y el tratamiento de flancos/latch de la entrada en vivo pertenece a la etapa 6.
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

#### Implementación de GOW8B-DEV-01 (2026-10-15): evidencia, auditoría y corrección

- **Nota de proceso:** el despacho del subagente implementador se abortó antes de terminar; según `AGENTS.md`, el orquestador ejecutó la implementación directamente y deja constancia. Un primer auditor independiente (subagente `general`, modelo `opencode/big-pickle`) revisó en solo lectura y devolvió **PARCIAL** (11 de 12 criterios aprobados, sin fallos bloqueantes ni regresiones). El plan de corrección fue revisado y **aprobado** por ese mismo auditor con dos precisiones vinculantes, y el orquestador aplicó la corrección. Un **segundo auditor distinto** (subagente `general`, modelo `opencode/big-pickle`, otra sesión) hizo la **reauditoría** y devolvió **APROBADO**.
- **Archivos nuevos:** `src/config.ts` (constantes centralizadas: `tickRate`, `tickMicros`, tamaño interno), `src/sim/types.ts` (acciones de dominio, `SimulationSnapshot`, `InputTrace`), `src/sim/checksum.ts` (hash FNV-1a + serialización canónica), `src/sim/scenarios.ts` (registro `empty`/`test`), `src/sim/world.ts` (mundo determinista `step`/`snapshot`), `src/sim/engine.ts` (paso fijo con acumulador en microsegundos enteros, grabación y replay), `src/input/InputManager.ts` (teclado → acciones de dominio), `src/dev/harness.ts` (`window.__GOW8B` solo en DEV) y `src/metrics.ts` (`FrameMetrics`: ventana de tiempos por frame y FPS). **Modificado:** `src/main.ts` (escena delgada que delega en la simulación; texto DEV de tick; conserva el aspecto neutral 320×180).
- **Comandos:** `pnpm exec tsc --noEmit` → exit 0; `pnpm build` → exit 0, 17 módulos, con el warning conocido de bundle >500 kB (pre-existente por Phaser). El literal `__GOW8B` aparece **0 veces** en `dist/assets/*.js`, por lo que la rama DEV no se expone en producción. Se eliminó `dist/` y `tsconfig.tsbuildinfo` tras la comprobación.
- **Navegador (`pnpm dev`, puerto 5174):** consola limpia (solo el banner de Phaser 3.90 y la conexión de Vite); el único 404 de red es `favicon.ico`, ausente ya antes de este cambio y no relacionado. `window.__GOW8B` presente en DEV.
- **Determinismo (harness):** `scenarios()` → `["empty","test"]`; `loadScenario('test')` → frame 0, 2 entidades, checksum `5b5b8086`. `replay(traza de 30 ticks)` dos veces → checksum idéntico; `step` por tick vs `replay` → idéntico; `step(30)` vs `step(10);step(20)` → idéntico. Traza de 500 ms alimentada a 60 fps (30×16.666 ms), 30 fps (15×33.333 ms) y de forma irregular (22 deltas que suman 500 ms) → **frame 30 y checksum `10738d3e` en los tres casos**. `record()`/`step`/`stop()` → traza de 20 ticks contiguos; su `replay` reproduce el mismo checksum (`403e0475`).
- **Entrada normal:** un `keydown` sintético de `D` fue mapeado a `move-right` y capturado en una traza grabada, confirmando el camino teclado → acción de dominio separado del harness.
- **Corrección durante la implementación:** el primer acumulador usaba milisegundos en coma flotante y producía 29 ticks en 500 ms (deriva de coma flotante); se cambió a **microsegundos enteros** (`tickMicros = floor(1e6/60)`), tras lo cual 60 fps, 30 fps e irregular dan el mismo resultado.
- **Límites:** el Chromium controlado por DevTools estranguló `requestAnimationFrame` (~2 fps), por lo que el bucle de render en vivo no pudo ejercitarse a tasa normal; la determinación del paso fijo se verificó a través del harness y por lectura de código. La captura de pantalla se tomó pero el modelo no puede interpretar imágenes (sin entrada de imagen), así que no se afirma una revisión visual. No hay Git ni `diff`; la integridad es por lectura directa de los archivos. No se probó teclado físico ni sensación humana. Todo esto es infraestructura DEV; no hay gameplay ni se activa ninguna etapa de juego.

##### Corrección tras la auditoría (2026-10-15)

- **Hallazgo NB-1 (criterio 2 parcial):** `advance` aplica las acciones del frame a todos sus ticks, así que una pulsación sostenida que cubre 2 ticks a 30 fps cubre 1 a 60 fps. Se resolvió como **semántica documentada** (cara (b) del criterio 2), no como cambio de bucle: el latch/edge-trigger de la entrada en vivo es trabajo de la etapa 6.
- **Hallazgos de robustez corregidos en `src/sim/engine.ts`:** NB-2 (`advance(NaN)` congelaba el sim) y NB-3 (delta negativo estancaba el acumulador) → `advance` ignora deltas no finitos o ≤ 0 sin mutar el acumulador; NB-4 (residuo sin cota) → se añadió `CONFIG.sim.maxAccumulatorMicros = 5 * tickMicros` y se recorta el residuo tras el bucle; NB-6 (`replay` con grabación activa contaminaba la traza) → `replay` descarta la grabación (`recording = null`) y nunca graba; NB-7 (`stepManual` con frames no enteros/negativos) → normaliza con `Math.max(0, Math.floor(frames))`. En `src/config.ts` se añadió `maxAccumulatorMicros` con el rationale (recorte anti-«spiral of death»: se descarta el tiempo de reloj acumulado durante un parón). Los comentarios de contrato de `advance`/`Snapshot` quedaron en este documento, no en el código, para respetar la convención del repositorio (sin comentarios en `src/`).
- **No bloqueantes documentados, sin cambio de comportamiento:** NB-5 (redondeo por llamada, `Σround ≠ round(Σ)`, ±1 tick cerca de un múltiplo de 16666 µs; inherente al acumulador entero elegido), NB-8 (`stop()` sin `record()` devuelve `[]`), NB-9 (`activeEffects` fijo en 0 mientras no haya sistema de efectos).
- **Verificación de la corrección (harness, navegador):** `loadScenario('test')` → frame 0, 2 entidades, `5b5b8086` (regresión intacta); 500 ms a 60/30/irregular → frame 30 y `10738d3e` (regresión intacta); `replay` de 20 ticks dos veces → `672569fc` idéntico; `advance(NaN)` → frame 0 y luego `advance(100)` recupera 5 ticks; `advance(-5000)` → frame 0 y luego recupera; `advance(10000)` seguido de deltas pequeños → residuo acotado (deuda ≤ `maxAccumulatorMicros`); `step(2.5)` → 2 ticks, `step(-5)` → 0; `record`/`step`/`replay`/`stop` → la traza de la grabación anterior se descarta (`stop()` devuelve `[]`). Consola sin errores.
- **Reauditoría independiente (2026-10-15, subagente distinto): APROBADA.** Confirmó NB-1..NB-9 y todas las regresiones por lectura y por ejecución en Node contra el fuente actual compilado con el propio `tsc` (18/18 pruebas PASS): `loadScenario('test')` → frame 0, 2 entidades, `5b5b8086`; 500 ms a 60/30/irregular → frame 30 y `10738d3e`; `replay` de 20 ticks ×2 → `672569fc`; `replay` de `move-right` = `7582373e` = `stepManual(20,['move-right'])`; `advance(NaN)`/`advance(-5000)` no congelan; `advance(Infinity)` y `advance(-0)` devuelven 0 sin mutar; `record`/`step`/`replay`/`stop` descarta la grabación; `step(2.5)`→2, `step(-5)`→0. `pnpm exec tsc --noEmit` y `pnpm build` → exit 0; `__GOW8B` con 0 apariciones en el bundle. Sin regresiones. No hubo `dist/` ni `tsconfig.tsbuildinfo` residuales.
- **Borde no bloqueante diferido (hallazgo nuevo de la reauditoría):** `stepManual(Infinity)` cuelga el bucle (`Math.floor(Infinity) = Infinity`); no es regresión (el comportamiento previo también colgaba) y solo es alcanzable pasando `Infinity` a mano por el harness DEV. `advance` sí está protegido contra no finitos. Se difiere (severidad baja); candidato a endurecer el guard a `Number.isFinite` en una etapa futura.
- **Límite de la reauditoría:** el Chrome DevTools MCP no respondió durante la reauditoría (timeouts repetidos), por lo que `window.__GOW8B` no se ejercitó en navegador en vivo; se verificó compilando `src/config.ts` y `src/sim/*` a CJS y ejecutando en Node, más lectura de código y `curl` 200 al dev server. La consola del navegador y el canvas 320×180 en vivo no se re-confirmaron por captura.

### Criterios de salida — GOW8B-MOVE-01 (etapa 6)

**Objetivo:** movimiento horizontal de un jugador controlable, determinista y centralizado en la configuración, presentado por Phaser. Sin salto, combate, enemigos ni arte. El jugador responde a `move-left`/`move-right` con aceleración y frenado acotados por los límites del mundo.

1. **Jugador en la simulación.** El mundo define una entidad jugador con id estable (convención: `player`) con posición horizontal `x`, velocidad horizontal `vx` y dirección `facing` (−1 o 1). `snapshot()` incluye estos campos y sigue siendo serializable a JSON. Existe al menos un escenario (`movement`) que incluye al jugador; `empty` y `test` siguen existiendo.
2. **Aceleración.** Con `move-right` (o `move-left`) sostenida, `vx` converge a `maxSpeed` con aceleración `accel` configurable (px/s²) y `x` avanza de forma continua (no instantánea). La dirección opuesta usa la misma física.
3. **Frenado.** Sin dirección activa, `vx` converge a 0 con desaceleración `brake` configurable, mayor que `accel` (recorrido de frenado corto). Cambiar de sentido frena y luego acelera en el sentido nuevo, sin teletransporte.
4. **Direcciones opuestas simultáneas.** Con `move-left` y `move-right` a la vez, el resultado es determinista y documentado: no hay aceleración neta y el jugador frena hasta `vx = 0`.
5. **Límites del mundo.** `x` se mantiene en `[minX, maxX]` configurable; al alcanzar un límite, `vx = 0`, sin oscilación ni acumulación de velocidad.
6. **Respuesta al input ≤100 ms (PR-01, D-15).** Desde el primer tick con la acción registrada, el jugador se desplaza al menos 1 px en ≤6 ticks a 60 Hz (≈100 ms). Medible con el harness por traza.
7. **Determinismo (mantiene la etapa 5).** La misma traza de acciones por tick produce el mismo checksum; 500 ms empaquetados a 60, 30 fps e irregular dan el mismo frame y checksum. Se conservan los guards de `advance` (no finito/≤0), el recorte del acumulador, `stepManual` normalizado y que `replay` descarte la grabación activa.
8. **Configuración centralizada.** `maxSpeed`, `accel`, `brake` y los límites del mundo viven en `CONFIG`; no se dispersan números mágicos. Punto de partida sugerido por `revision-prototipo-actual.md`: `maxSpeed` 136–150 px/s, `accel` 900–1200 px/s², `brake` 1500–1800 px/s² (ajustar y fijar con evidencia).
9. **Presentación separada.** La escena Phaser dibuja al jugador en su `x` a partir del estado de la simulación, sin poseer la lógica. El movimiento se observa con los controles normales (`A`/`D` o `←`/`→`).
10. **Sin otros sistemas.** No se implementa salto, combate, enemigos ni arte. `jump` y los ataques permanecen sin efecto y no alteran la determinación.
11. **Shell y harness sanos.** `pnpm exec tsc --noEmit` y `pnpm build` exit 0; consola sin errores nuevos; `__GOW8B` ausente del bundle de producción; el canvas interno sigue en 320×180 (el paso a 480×270 es su propia tarea).
12. **Documentación y pruebas.** Se prueba en navegador con los controles normales cuando sea posible y con el harness para lo medible; se registra la interacción manual, el rango de balance elegido y las limitaciones.

**EVIDENCIA:** comandos `pnpm exec tsc --noEmit` y `pnpm build`; prueba en navegador/harness con `loadScenario('movement')` y trazas: aceleración a `maxSpeed`, frenado a 0, cambio de sentido, direcciones opuestas, límites, respuesta ≤6 ticks y determinismo (misma traza ×2 y 60/30/irregular). Regresión: guards de `advance`, `replay` descarta grabación, harness ausente en producción. Auditoría independiente de solo lectura por un subagente distinto del implementador; no se marca aprobada antes de esa auditoría.

**Nota de regresión:** extender `EntityState` con `vx`/`facing` y añadir el jugador **cambia los checksums literales** de la etapa 5 (`5b5b8086`, `10738d3e`). La regresión a proteger es la **propiedad de determinismo** (misma traza → mismo checksum) y los guards de `advance`/`replay`, no los valores hex congelados de la etapa 5.

#### Implementación de GOW8B-MOVE-01 (2026-10-15): evidencia, auditoría aprobada

- **Proceso:** implementación en un subagente y auditoría de solo lectura en **otro subagente distinto** (ambos runtime OpenCode, modelo `opencode/big-pickle`; implementador sin subagentes propios). La auditoría devolvió **APROBADA** (12 de 12 criterios) sin ciclo de corrección. El MCP de Chrome DevTools no respondió en ninguna de las dos sesiones (timeouts), por lo que ambas usaron la alternativa local gratuita: Chrome 154 headless conducido con CDP directo desde Node.
- **Archivos:** nuevo `src/sim/movement.ts` (función pura `stepHorizontal` con modelo de velocidad deseada y frenado primero al invertir). **Modificados:** `src/config.ts` (`CONFIG.player`: `maxSpeed` 140 px/s, `accel` 1050 px/s², `brake` 1650 px/s², `minX` 0, `maxX` 320; dentro de los rangos sugeridos, con `brake` > `accel` y `maxX = internal.width`), `src/sim/types.ts` (`PLAYER_ID`, `EntityState.vx`/`facing`), `src/sim/scenarios.ts` (escenario `movement` y `DEFAULT_SCENARIO='movement'`), `src/sim/world.ts` (`getEntity` y aplicación de `stepHorizontal` en `step` con `dt = 1/tickRate`), `src/main.ts` (rectángulo provisional 10×16 px dibujado desde el estado; sin lógica en la escena) y `README.md` (estado, controles, tabla de balance, limitaciones). Sin dependencias nuevas; `engine.ts`, `checksum.ts`, `harness.ts` e `InputManager.ts` intactos.
- **Comandos:** `pnpm exec tsc --noEmit` → exit 0; `pnpm build` → exit 0, 18 módulos, con el warning conocido de bundle >500 kB; el literal `__GOW8B` aparece **0 veces** en `dist/assets/*.js`; `dist/` y `tsconfig.tsbuildinfo` eliminados tras la comprobación.
- **Navegador (Chrome headless + CDP, `pnpm dev` :5173, ~60 fps):** rectángulo dibujado; teclas **sintéticas** vía CDP: `D` sostenido → `x 160→298.96`, `←` → `x→23.38` con `facing=-1`, `A`+`D` → `x=160, vx=0`; `Space` y `J` dejan intactas las entidades; consola sin errores de la aplicación (solo el 404 preexistente de `favicon.ico`). El implementador midió por su parte `D` → `x 160→221.8, vx=140`, al soltar → `vx=0`, y `←` → `vx=-140, facing=-1`.
- **Respuesta ≤6 ticks (criterio 6):** primer desplazamiento ≥1 px en el **tick 3** (1.75 px) en ambos sentidos; `vx` converge a `maxSpeed` en 8 ticks y de 140 → 0 en 6 ticks de frenado (4.79 px).
- **Límites (criterio 5):** `x` alcanza `maxX=320` en el tick 73 con `vx=0` estable hasta el tick 600 sin oscilación; `minX=0` también en el tick 73; simetría exacta entre sentidos (`x_der+x_izq=320`) y sin acumulación de velocidad contra el muro.
- **Determinismo (criterio 7):** traza mixta de 150 ticks reproducida ×2 → checksums idénticos (`748588a8`); 500 ms empaquetados a 60 fps, 30 fps e irregular → **frame 30** y checksum `7388557b` (con `move-right`) o `c5f88972` (sin acción) en los tres casos; `record`/`replay` round-trip → `4250afb8` ×2; `reset()` → `824bb0fa` (igual al estado inicial); snapshot con JSON round-trip idéntico.
- **Guards conservados (regresión etapa 5):** `advance(NaN / −5000 / Infinity / −0)` → 0 ticks sin mutar el frame; `advance(10000)` → 5 ticks (cap de catch-up) y residuo recortado, con secuencia `[5,2,1,1]` frente a `[5,5,5,5]` sin corte; `stepManual(2.5)`→2 y `(−5)`→0; `replay` descarta la grabación activa (`stop()` → `[]`).
- **Regresión de literales:** como preveía la nota de regresión, los checksums de la etapa 5 cambian (`test` → `ad89768c`, 500 ms → `c5f88972`/`7388557b`); lo protegido —propiedad «misma traza → mismo checksum» y guards— se mantiene.
- **Hallazgos no bloqueantes (sin cambio de comportamiento):** NB-1 el README no repite el comportamiento de direcciones simultáneas (está documentado en el criterio 4 y medido); NB-2 `minX=0`/`maxX=320` se aplican al centro del rectángulo, así que en los bordes media figura queda fuera del lienzo (nit de presentación, ningún criterio incumplido); NB-3 esta subsección figuraba «pendiente» al auditar (ya registrada); NB-4 el 404 de `favicon.ico` es preexistente, no una regresión.
- **Pruebas ejecutadas:** batería Node sobre el código compilado con el propio `tsc` (`/tmp/opencode/move-audit/audit.cjs`) → **52/52 PASS**; batería de navegador (`browser.cjs`, CDP) → **14/14 PASS**.
- **Límites:** teclas sintéticas vía CDP, no teclado físico ni sensación humana; sin revisión visual por interpretación de imagen (el runtime no admite entrada de imagen); sin Git se afirma integridad por diff local y lectura de archivos; no se prueba salto, combate, enemigos ni arte.

### Criterios de salida — GOW8B-RES-01 (etapa 6.5, nueva)

**Objetivo:** llevar el canvas lógico de **320×180 a 480×270** (D-12) e **integrar en el runtime** los assets aprobados y provisionales —fondo del Egeo (etapa 3) y pose neutral de Kratos (etapa 2)— a través de un **manifest de assets**, sin añadir gameplay. Prepara la animación de carrera (etapa 7) sobre el nuevo lienzo. Decisión de la usuaria (2026-10-15): migrar antes de animar.

1. **Resolución interna 480×270.** `CONFIG.internal.width = 480` y `.height = 270`; el canvas de Phaser y su backing store quedan en 480×270; se conservan `Scale.FIT` centrado, `antialias: false`, `pixelArt: true` y `roundPixels: true`. La presentación sigue escalando a ventana amplia sin suavizado.
2. **Manifest de assets.** Módulo nuevo (p. ej. `src/assets/manifest.ts`) que agrupa **claves estables por dominio** (`characters`, `environment`, `ui`, `fx`, `audio`, `data`, según `arquitectura.md`); al menos `characters` y `environment` con entradas. La escena carga assets a través del manifest, sin rutas de archivo dispersas.
3. **Assets servibles y originales.** Bajo `public/assets/`: fondo `public/assets/environment/egeo-fondo.png` (copia **byte a byte** de `docs/referencias/egeo-fondo-480x270.png`) y `public/assets/characters/kratos-neutral.png` (pose neutral **recortada a sus bounds alfa** 97×59 desde `docs/referencias/kratos-neutral-480x270.png`), preservando la paleta indexada y la transparencia. Los PNG fuente en `docs/referencias/` quedan **intactos** (verificado por hash). Sin recursos copiados de terceros.
4. **Fondo integrado.** El fondo del Egeo se renderiza cubriendo todo el canvas lógico (480×270) en (0,0), a escala 1 y nearest-neighbor, **sin tinte** ni desplazamiento de color (sus píxeles coinciden con el asset aprobado).
5. **Pose de Kratos integrada.** El jugador se representa con la pose neutral de Kratos (no un rectángulo). Anclada para que, en su posición de aparición, reproduzca la colocación de Kratos de la composición aprobada **CMP-01** en el canvas lógico: **centro x = 240** y **apoyo de pies en y = 262** (bounds `(192,204)–(288,262)`). La orientación sigue a `facing` (volteo horizontal cuando `facing = -1`).
6. **Aparición en el escenario `movement`.** El jugador aparece sobre la cubierta en el punto de CMP-01 (centro x≈240, apoyo y≈262). `empty`, `test` y `movement` siguen existiendo y el estado sigue siendo serializable a JSON.
6.1 (criterio extra). **HUD/DEV dentro del lienzo.** El texto DEV (tick/x) y el título de escena se reposicionan al nuevo espacio y permanecen dentro del canvas.
7. **Movimiento conservado y acotado al nuevo lienzo.** Se conservan aceleración, frenado, cambio de sentido, direcciones opuestas simultáneas (→ `vx = 0`) y el umbral de respuesta **≤6 ticks** (PR-01). Los límites del mundo se actualizan al ancho de 480 de modo que el **sprite del jugador permanezca totalmente visible** dentro del canvas en ambos extremos. `maxSpeed`/`accel`/`brake` no cambian.
8. **Determinismo (mantiene etapas 5 y 6).** Misma traza por tick → mismo checksum; 500 ms empaquetados a 60/30/irregular → mismo frame y checksum; `replay` reproduce idéntico; se conservan los guards de `advance`, `stepManual` normalizado y que `replay` descarte la grabación activa. **Nota de regresión:** el cambio de espacio de coordenadas y de spawn **cambia los checksums literales** de las etapas 5 y 6; lo protegido es la **propiedad** (misma traza → mismo checksum) y los guards, no los valores hex congelados.
9. **Configuración centralizada.** Tamaño interno, límites del mundo, anclaje del sprite y constantes del manifest viven en `CONFIG`/manifest; sin números mágicos dispersos.
10. **Sin gameplay nuevo.** No hay salto, combate, enemigos, animación de carrera ni efectos; `jump` y los ataques siguen sin efecto. No se añaden dependencias.
11. **Shell y harness sanos.** `pnpm exec tsc --noEmit` y `pnpm build` exit 0; `pnpm dev` sin errores ni warnings nuevos de consola; el literal `__GOW8B` ausente del bundle de producción; el harness sigue funcionando (escenarios, `snapshot`, `record`/`replay`).
12. **Documentación y evidencia.** `README.md` y docs reflejan 480×270 y los assets integrados; se registra el procedimiento de copia/recorte, el anclaje elegido y las limitaciones; auditoría independiente de solo lectura por un subagente distinto del implementador.

**EVIDENCIA:** comandos `pnpm exec tsc --noEmit` y `pnpm build`; navegador con `pnpm dev` (controles normales `A`/`D` o `←`/`→`) y captura; harness con trazas (aceleración, frenado, direcciones opuestas, límites en 480, respuesta ≤6 ticks, determinismo 60/30/irregular y `replay`); **hashes** de los PNG fuente y de los derivados en `public/assets/`; comprobación de que el recorte es fiel (diferencia 0 frente a la región fuente); verificación de que el fondo renderiza sin suavizado. Auditoría independiente de solo lectura por un subagente distinto del implementador; **no se marca aprobada antes de esa auditoría**.

**Nota de proceso:** la etapa se inserta como **6.5** sin renumerar las etapas 7–29 para no romper referencias en prosa a números de etapa. Registrar la decisión de la usuaria de migrar antes de animar.

#### Implementación de GOW8B-RES-01 (2026-10-15): evidencia, auditoría aprobada

- **Proceso:** implementación en un subagente y auditoría de solo lectura en **otro subagente distinto** (ambos runtime OpenCode, modelo `opencode/big-pickle`). La auditoría devolvió **APROBADA** (12 de 12 criterios + 6.1) sin ciclo de corrección. El implementador no ejecutó prueba de navegador; la hizo el propio orquestador y, de forma independiente, el auditor.
- **Archivos:** nuevo `src/assets/manifest.ts` (dominios `characters`/`environment`/`ui`/`fx`/`audio`/`data`; claves `kratos-neutral`, `egeo-fondo`). **Modificados:** `src/config.ts` (`CONFIG.internal` 480×270; `CONFIG.player` con `minX=48.5`, `maxX=431.5`, `sprite {width:97,height:59,anchorX:0.5,anchorY:1}`; `maxSpeed/accel/brake` sin cambios), `src/main.ts` (preload desde manifest, fondo en (0,0), sprite de Kratos en lugar del rectángulo, HUD/título reposicionados), `src/sim/scenarios.ts` (spawn de `movement` en `x=240, y=262`), `src/sim/{types,world,movement}.ts`, `README.md` e `index.html`. Nuevos derivados en `public/assets/environment/egeo-fondo.png` y `public/assets/characters/kratos-neutral.png`. Sin dependencias nuevas.
- **Copia/recorte de assets:** fondo copiado byte a byte desde `docs/referencias/egeo-fondo-480x270.png` (hash `8f8b5885de7af96889f24b28338f151ee11acff7d17339b28ea1949755349ee1`); recorte de Kratos a bounds alfa 97×59 con **diferencia 0** frente a la región `(192,204)-(288,262)` del fuente (hash derivado `df52a7fc298e6fd41241f555cef8f4d2dd00a6b81034a333872a55b4f9390c4a`; fuente `1630a2f5ca83c4bdbf09deaa13e0e91f3e16c15f6c1ea058d23c89df1eef6577`), preservando paleta indexada y transparencia; los PNG fuente en `docs/referencias/` quedan intactos.
- **Navegador (`pnpm dev`, servidor servido en :5173, limpio):** canvas 480×270 (CSS 960×540), renderer **Canvas**, ~60 fps; el fondo del Egeo renderiza con **0 píxeles de diferencia** frente al asset aprobado y sin suavizado; `favicon.ico` 404 preexistente como único error de consola.
- **Pose de Kratos (criterios 5/6):** en recarga limpia (sin teclas), el Kratos renderizado coincide **sin espejo** con el recorte; mejor ajuste por máscara **IoU = 1.0** (dx=0), bbox observado `(192,203)-(289,262)`, apoyo de pies en y=262 y centro x≈240.5 (ancla 0.5/1 sobre sprite de 97 px impares). El orquestador confirmó además coincidencia crisp 100% (1834/1834 píxeles opacos) sin espejo. **Nota:** una captura intermedia pareció mostrar Kratos espejado; se debió a que una prueba de teclas previa dejó `facing=-1` (volteo esperado) con el rAF throttleado, no a un defecto.
- **Movimiento y límites (criterio 7):** `minX=48.5`/`maxX=431.5` derivados del ancho del sprite ⇒ el sprite queda totalmente visible en ambos extremos (left=0 / right=480); parámetros `maxSpeed/accel/brake` y respuesta ≤6 ticks (PR-01) conservados; direcciones opuestas → `vx=0`.
- **Determinismo y guards (criterio 8, regresión etapas 5/6):** se conserva la **propiedad** (misma traza por tick → mismo checksum; 500 ms empaquetados a 60/30/irregular → mismo frame y checksum; `replay` idéntico) y los guards (`advance` ignora delta no finito/≤0; `stepManual` normalizado; `replay` descarta grabación activa). **Regresión de literales esperada:** los checksums hex de las etapas 5 y 6 cambian por el nuevo espacio de coordenadas y spawn (p. ej. snapshot `movement` `9d7dae5e`; `stepManual(10,'move-right')` → `vx=140, x≈255.17`); no es fallo.
- **Build/harness (criterio 11):** `pnpm exec tsc --noEmit` y `pnpm build` exit 0 (warning conocido de bundle >500 kB); `__GOW8B` ausente en `dist/assets/*.js`; harness funcional (`empty`/`test`/`movement`, `snapshot`, `record`/`replay`); `dist/` y `tsconfig.tsbuildinfo` eliminados tras la comprobación.
- **Hallazgos no bloqueantes:** NB-1 bbox superior en y=203 frente a 204 del criterio (nit de sub-píxel del ancla; pies en 262, sin criterio incumplido); NB-2 `favicon.ico` 404 preexistente; NB-3 warning de bundle >500 kB preexistente.
- **Límites:** teclas sintéticas y medición sobre `ImageData`; sin teclado físico ni sensación humana; el reloj/rAF puede estar throttleado en Chrome controlado (la simulación se valida con el harness/Node); sin entrada de imagen al runtime (revisión visual subjetiva de CMP-01 sigue diferida y no bloqueante, §CMP-01).

### Criterios de salida — GOW8B-ANIM-01 (etapa 7)

**Objetivo:** dar a la carrera una **animación provisional** sincronizada con el movimiento, sobre el lienzo 480×270 y los assets ya integrados (etapa 6.5), **sin gameplay nuevo**. Decisión de la usuaria (2026-10-15): el ciclo de carrera de esta etapa es un **placeholder procedural provisional** derivado de la pose neutral (balanceo/inclinación), solo para cablear y probar el sistema de animación; el arte definitivo se hará en una etapa de arte posterior.

1. **Cuadros provisionales originales.** Entre 2 y 4 cuadros del ciclo de carrera, derivados de/de la pose neutral `kratos-neutral.png`, en la **misma rejilla de cuadro** y **misma silueta aparente** (sin cambiar el tamaño del personaje entre poses), con el mismo **anclaje de pies**. El arte es original y se **etiqueta explícitamente como provisional** (constante/documentación); no se copian recursos de terceros.
2. **Carga por manifest.** Los cuadros se sirven bajo `public/assets/characters/` y se cargan por el manifest (nueva clave en el dominio `characters`, p. ej. `kratos-run`), sin rutas de archivo dispersas.
3. **Animación Phaser sincronizada.** En reposo (`|vx|` bajo un umbral configurable) se muestra la pose neutral (idle); con movimiento (`|vx|` sobre el umbral) se reproduce el ciclo de carrera; el volteo sigue a `facing`. Si la cadencia de la animación escala con `|vx|`, el factor vive en `CONFIG`/manifest.
4. **Solo presentación.** La animación se deriva del estado de simulación (`vx`/`facing`) y **no altera** la simulación ni el checksum. Se **conserva el determinismo** de las etapas 5, 6 y 6.5: misma traza por tick → mismo checksum; 500 ms a 60/30/irregular → mismo frame y checksum; `replay` idéntico; guards de `advance` y `stepManual`, y `replay` descarta la grabación activa. *(Nota de regresión: si el estado o el espacio de coordenadas no cambian, los checksums literales deben mantenerse; si cambian, se protege la propiedad, no los hex.)*
5. **Anclaje y encuadre.** En la aparición, pies en y=262 y centro x=240; el rectángulo de cuadro y el anclaje de pies no cambian entre poses; sin jitter (`roundPixels`, nearest-neighbor).
6. **Movimiento conservado y acotado a 480.** `maxSpeed/accel/brake` sin cambios; aceleración, frenado, cambio de sentido, direcciones opuestas simultáneas (→ `vx=0`), respuesta ≤6 ticks (PR-01) y sprite totalmente visible en ambos extremos.
7. **Sin gameplay nuevo.** No hay salto, combate, enemigos, daño, efectos ni audio; `jump` y ataques siguen sin efecto. No se añaden dependencias.
8. **Configuración centralizada.** Número de cuadros, cadencia de animación y umbral idle/run viven en `CONFIG`/manifest; sin números mágicos dispersos.
9. **Shell y harness sanos.** `pnpm exec tsc --noEmit` y `pnpm build` exit 0; `pnpm dev` sin errores ni warnings nuevos de consola (el 404 preexistente de `favicon.ico` sigue permitido); el literal `__GOW8B` ausente del bundle de producción; el harness sigue funcionando (escenarios `empty`/`test`/`movement`, `snapshot`, `record`/`replay`).
10. **Documentación y evidencia.** `README.md` y docs reflejan la animación provisional, el procedimiento de derivación de los cuadros y la condición de placeholder; se registra una captura; auditoría independiente de solo lectura por un subagente distinto del implementador. Queda constancia de que el arte debe reemplazarse.

**EVIDENCIA:** comandos `pnpm exec tsc --noEmit` y `pnpm build`; navegador con `pnpm dev` (controles normales `A`/`D` o `←`/`→`) mostrando la transición reposo↔carrera y el volteo por `facing`, con captura y consola; harness con trazas de determinismo (60/30/irregular y `replay`) y de movimiento (límites 480, respuesta ≤6 ticks, direcciones opuestas); **hashes** del spritesheet derivado y de `kratos-neutral.png`; verificación de que el rectángulo de cuadro y el anclaje de pies no cambian entre poses. Auditoría independiente de solo lectura por un subagente distinto del implementador; **no se marca aprobada antes de esa auditoría**.

**Nota de proceso:** el arte de carrera de esta etapa es **provisional** y no cierra la deuda visual de animación; una etapa de arte posterior (o una tarea dedicada) reemplazará los cuadros definitivos. Registrar la decisión de la usuaria de usar un placeholder procedural.

#### Implementación de GOW8B-ANIM-01 (2026-10-15): evidencia; auditoría aprobada

- **Estado:** **aprobada** (2026-10-15) tras auditoría independiente de solo lectura por un subagente distinto del implementador, que reprodujo el determinismo con la API real y verificó assets, typecheck, build y navegador. Aprobada con **observaciones no bloqueantes** (ver «Auditoría»).
- **Archivos:** nuevo `scripts/gen-run-frames.py` (derivación procedural reproducible) y nuevo asset `public/assets/characters/kratos-run.png` (388×59, 4 cuadros). **Modificados:** `src/assets/manifest.ts` (entrada `kratos-run` como `spritesheet` 97×59 + `RUN_KEY`/`RUN_FRAME_*` + `PROVISIONAL_ART = true`), `src/config.ts` (`CONFIG.player.run`: `frames` 4, `frameRate` 10, `maxFrameRate` 14, `idleSpeedThreshold` 1), `src/main.ts` (carga spritesheet por manifest, crea la animación `kratos-run`, `updateRunAnimation(speed)` derivada de `vx`/`facing`, rótulo provisional) y `README.md` (estado, controles, tabla de assets, sección de etapa 7 con procedimiento y hashes). Sin dependencias nuevas; la simulación (`sim/`) intacta.
- **Solo presentación:** `updateRunAnimation` lee `|vx|` y `facing` del estado de simulación y solo cambia textura/animación/`flipX`/`timeScale` del sprite; no muta `World`. La cadencia escala linealmente con `|vx|` entre `frameRate` y `maxFrameRate`.
- **Comandos:** `pnpm exec tsc --noEmit` → exit 0; `pnpm build` → exit 0 (19 módulos, warning conocido de bundle >500 kB); el literal `__GOW8B` aparece **0 veces** en `dist/assets/*.js`; `dist/tsconfig.tsbuildinfo` eliminado tras la comprobación.
- **Navegador (Chrome DevTools MCP, `pnpm dev` :5173):** consola sin errores nuevos (solo el banner de Phaser y los logs de Vite; sin 404 nuevo). Estados observados por lectura directa del sprite (diagnóstico DEV temporal, retirado después): reposo `kratos-neutral` sin animación; `D` (evento de teclado **sintético**, `KeyboardEvent` inyectado, no teclado físico) → `kratos-run` reproduciendo, `flipX=false`, `x` creciente y `timeScale` subiendo con `|vx|`; `A` → `kratos-run`, `flipX=true`, `x` decreciente; al soltar → vuelve a neutral al frenar. Nota: el rAF de la página controlada se **estrangula** (≈0.5–0.9 px por muestra), por eso el desplazamiento es lento; la física fina se valida con el harness/Node, no con el reloj del navegador.
- **Capturas (artefacto congelado):** con el harness se fijó el estado (`loadScenario('movement')` + `step(n, ['move-right'|'move-left'|∅])`), se detuvo el loop y se forzó un render; se recortó el canvas 480×270 y se guardó `docs/referencias/captura-carrera-{idle,derecha,izquierda}-480x270.png`. Verificación por `ImageData`: reposo coincide con `kratos-neutral` (50 px distintos) y carrera con el cuadro 0 de `kratos-run` (44 derecha, 47 izquierda-espejado), muy por debajo de los ~1782 px de una pose no coincidente. El volteo desplaza el sprite **1 px** (paridad de `flipX`), sin cambiar el rectángulo de cuadro ni el anclaje de pies.
- **Anclaje/encuadre:** los 4 cuadros conservan bbox de 97 de ancho y fila de pies intacta (el script lo verifica: `fila_pies_intacta=True`); en reposo, centro `x=240`, pies `y=262`. Sin `jitter` (nearest-neighbor, `roundPixels`).
- **Determinismo y movimiento (batería Node sobre el código, `/tmp/opencode/anim-audit/run.cjs`):** **23/23 PASS** — `movement` inicial checksum `9d7dae5e`; misma traza ×2 → mismo checksum (`7f29b588`); 500 ms a 60/30/irregular → **frame 30** y mismo checksum (`5e9e5706` sin acción, `75ad1020` con `move-right`); `record`/`replay` round-trip idéntico (`ed609fbc`); guards `advance(NaN/−5000/Infinity/−0)` → 0 ticks sin mutar el frame y recuperación a 5 ticks; `stepManual(2.5)`→2 y `(−5)`→0; `replay` descarta grabación activa; `vx=140` y `x≈255.17` a 10 ticks; direcciones opuestas → `vx=0`; respuesta ≥1 px en el **tick 3**; límites `maxX=431.5`/`minX=48.5` con `vx=0`. Los checksums literales **se mantienen** respecto de la etapa 6.5 (`9d7dae5e` inicial; `75ad1020`/`5e9e5706` a 500 ms), porque la etapa 7 no cambió el estado ni el espacio de coordenadas; además se protege la **propiedad** de determinismo.
- **Límites:** la transición reposo↔carrera y el volteo se observaron con eventos de teclado **sintéticos** y con estado fijado por harness, no con teclado físico ni sensación humana; el rAF del navegador controlado se estrangula, así que el timing fino proviene del harness/Node. El arte es un **placeholder procedural**, no arte final; no se prueba salto, combate, enemigos ni audio.
- **Auditoría (2026-10-15, subagente distinto, solo lectura):** reprodujo el determinismo con la API real (compilando `sim/` a CJS en `/tmp`), `git diff --name-only -- src/sim` vacío, assets con Pillow, `tsc --noEmit`/`build` (exit 0, `__GOW8B` = 0) y navegador; **coincidió con la verificación del orquestador** en `movement` inicial `9d7dae5e` (frame 0, `{x:240,y:262,vx:0,facing:1}`), 500 ms a 60/30/irregular → frame 30 y checksums `75ad1020` (con `move-right`) / `5e9e5706` (sin acción), y `kratos-neutral.png` intacto. Veredicto: **APROBADO** con observaciones no bloqueantes: (a) los cuadros 2 y 3 tienen silueta opaca de 96 px frente a 97 del neutral y de los cuadros 0–1 (el README dice «no cambia de tamaño»; diferencia de 1 px coherente con la inclinación mínima del placeholder); (b) `flipX` introduce una paridad de 1 px; (c) la verificación visual humana y la comprobación estética «sin jitter» quedan **diferidas** (este runtime no admite entrada de imagen), misma deuda que CMP-01. Sin regresiones.
- **Nota de proceso:** una primera auditoría fallida quedó invalidada por confabular contenido de archivos. La reauditoría exigió salidas reales y se contrastó con la medición independiente del orquestador; se añadió la lección en `docs/aprendizajes-del-proceso.md`.

### Criterios de salida — GOW8B-JUMP-01 (etapa 8)

**Objetivo:** añadir **salto y plataformas** deterministas al jugador sobre el lienzo 480×270 —ascenso, aire, caída, aterrizaje y bordes— con **coyote time 60–100 ms** y **jump buffer ~100 ms** (PR-01), y verticalidad de **al menos dos niveles** alcanzables con saltos encadenados (D-20). Sin combate, enemigos, daño ni audio. Arte provisional.

**Funciones previas que deben protegerse:** determinismo de `Simulation` (`advance`, `stepManual`, `record`/`replay`, guards de delta no finito/≤0, `replay` descarta grabación), `World.snapshot`/`loadScenario`/`reset`, el comportamiento horizontal (`minX`/`maxX`, respuesta ≤6 ticks, direcciones opuestas → `vx=0`), la transición idle↔run y el volteo de la etapa 7, y la integridad de los assets de la etapa 6.5.

1. **Estado y física deterministas.** `EntityState` gana el estado vertical (`vy`, `grounded`) y los temporizadores de coyote/buffer; el paso fijo los actualiza sin valores no deterministas (nada de `Math.random`/`Date`/reloj de render).
2. **Salto desde el suelo.** Con `grounded` y pulso de `jump`, `vy = -jumpSpeed`; el jugador asciende, alcanza un apex, cae y aterriza **sobre** la superficie de apoyo; al aterrizar `vy=0` y `grounded=true`. El salto es **edge-trigger**: mantener `jump` pulsado no re-salta al aterrizar (sin bunny-hop).
3. **Respuesta al input ≤100 ms (PR-01).** Tras pulsar `jump` en suelo, en **≤6 ticks** hay `vy<0` y desplazamiento ascendente; igual para el arranque horizontal de la etapa 6/7 (regresión).
4. **Coyote time (60–100 ms).** Tras abandonar el suelo (caminar fuera de un borde), `jump` sigue permitido durante una ventana configurable de 60–100 ms y deja de estarlo después. La ventana vive en `CONFIG`.
5. **Jump buffer (~100 ms).** Si `jump` se pulsa poco antes de aterrizar (dentro de una ventana configurable ~100 ms), el salto se ejecuta al tocar suelo; fuera de la ventana, el buffer expira sin saltar.
6. **Plataformas y colisiones.** Las superficies de apoyo se definen en el escenario (tramo `[x1,x2]` a una altura `yTop`); el jugador aterriza **sobre** ellas al caer (de un solo sentido: no las atraviesa desde arriba hacia abajo) y, al caminar más allá del borde, cae. Se añade un escenario `platforms` con **suelo + al menos dos plataformas a alturas distintas**. Colisiones deterministas.
7. **Verticalidad (D-20).** Por simulación determinista se demuestra que desde el suelo se alcanza la **plataforma del nivel 1** y, desde ella, la del **nivel 2**, con saltos encadenados (una secuencia de acciones que termina con el jugador apoyado en el nivel 2).
8. **Límites.** El jugador no sale por los lados (`minX`/`maxX`), no sube por encima del borde superior del lienzo ni cae por debajo del suelo; *clamp* determinista.
9. **Solo salto/plataformas.** Sin ataque, combate, enemigos, daño, esquiva, efectos ni audio; `light-attack`/`heavy-attack`/`dodge`/`context-action` siguen sin efecto. Sin dependencias nuevas.
10. **Configuración centralizada.** Gravedad, velocidad de salto, velocidad máxima de caída, coyote, buffer y geometría de plataformas viven en `CONFIG`/escenario; sin números mágicos dispersos en escena o entidades.
11. **Presentación.** El sprite sigue `(x,y)`; **en el aire no reproduce el ciclo de carrera** y muestra una pose legible (neutral **provisional**, etiquetada); en el suelo conserva idle↔run (etapa 7). Sin jitter (`roundPixels`, nearest-neighbor). Las plataformas se dibujan de forma **provisional y original** (sin copiar recursos).
12. **Determinismo (regresión etapas 5/6/6.5/7).** Se conserva la **propiedad** (misma traza por tick → mismo checksum; 500 ms a 60/30/irregular → mismo frame y checksum; `replay` idéntico) y los guards (`advance` ignora delta no finito/≤0; `stepManual` normalizado; `replay` descarta grabación). *(Nota de regresión: los checksums hex **cambian** por el nuevo estado `vy`/`grounded`/temporizadores; se protege la propiedad, no los hex.)*
13. **Shell y harness sanos.** `pnpm exec tsc --noEmit` y `pnpm build` exit 0; `pnpm dev` sin errores ni warnings nuevos (el 404 preexistente de `favicon.ico` sigue permitido); `__GOW8B` ausente del bundle de producción; el harness sigue funcionando (`snapshot`, `record`/`replay`, escenarios `empty`/`test`/`movement`/`platforms`).
14. **Documentación y evidencia.** `README.md` y docs reflejan salto y plataformas, controles (`Espacio` para saltar), parámetros y condición provisional; se registra captura; auditoría independiente de solo lectura por un subagente distinto del implementador. **No se marca aprobada antes de esa auditoría.**

**EVIDENCIA:** comandos `pnpm exec tsc --noEmit` y `pnpm build`; navegador con `pnpm dev` (controles normales: `Espacio` para saltar, `A`/`D` o `←`/`→` para moverse) mostrando salto, aterrizaje sobre plataforma y caída por el borde, con captura y consola; harness/Node con trazas de determinismo (60/30/irregular, `replay`) y de física (apex, aterrizaje, coyote, buffer, alcance de dos niveles, límites, respuesta ≤6 ticks); hashes de assets intactos de la etapa 6.5. Auditoría independiente de solo lectura por un subagente distinto del implementador; **no se marca aprobada antes de esa auditoría**.

**Nota de proceso:** el arte de salto (pose aérea) y de plataformas es **provisional** y no cierra la deuda visual; una etapa de arte posterior lo reemplazará.

#### Implementación de GOW8B-JUMP-01 (2026-10-15): evidencia; auditoría aprobada

- **Estado:** **aprobada** (2026-10-15) tras auditoría independiente de solo lectura por un subagente distinto del implementador, que reprodujo determinismo y física en Node y en navegador. Aprobada con **un hallazgo no bloqueante** (buffer efectivo ~83 ms).
- **Archivos:** nuevo `src/sim/vertical.ts` (`stepVertical`: gravedad, salto edge-trigger, colisión unidireccional de plataformas, *clamp* de techo, temporizadores). **Modificados:** `src/sim/types.ts` (`EntityState` gana `vy`, `grounded`, `coyoteTicks`, `jumpBufferTicks`), `src/sim/scenarios.ts` (`Platform{x1,x2,yTop}`, `Scenario.platforms`, escenario `platforms` = suelo `[0,480] y=262` + nivel 1 `[280,370] y=210` + nivel 2 `[140,250] y=158`, `movement` con suelo, `DEFAULT_SCENARIO='platforms'`), `src/sim/world.ts` (detección de flanco de `jump` con `jumpHeld`, llamada a `stepVertical`, `scenarioName`/`surfacePlatforms`), `src/config.ts` (`CONFIG.player.vertical` = `gravity` 1000, `jumpSpeed` 380, `maxFallSpeed` 560, `coyoteMs` 80, `jumpBufferMs` 100, `topY` 59; colores/grosor de plataforma) y `src/main.ts` (`redrawPlatforms` con `add.rectangle` provisional, `updateRunAnimation(speed, grounded)` = neutral sin ciclo en el aire, rótulo). `README.md` actualizado. Nuevas capturas `docs/referencias/captura-salto-480x270.png` y `captura-plataforma-480x270.png`. Sin dependencias nuevas.
- **Solo salto/plataformas:** `step` reacciona a `move-left`/`move-right`/`jump`; `light-attack`/`heavy-attack`/`dodge`/`context-action` siguen sin efecto. `src/sim` sin `Math.random`/`Date`/reloj de render.
- **Comandos:** `pnpm exec tsc --noEmit` → exit 0; `pnpm build` → exit 0 (20 módulos, warning conocido >500 kB); `__GOW8B` = **0** en `dist/assets/*.js`; `dist/`/`tsconfig.tsbuildinfo` eliminados. Assets intactos: `kratos-neutral.png` `df52a7fc…c4a`, `kratos-run.png` `78f68cf2…7e2ea`, `egeo-fondo.png` `8f8b5885…9ee1`; `manifest.ts` y `src/dev/harness.ts` **sin cambios**.
- **Determinismo (regresión 5/6/6.5/7):** `platforms` inicial `checksum=416b863a`; misma traza ×2 → mismo checksum; 500 ms empaquetados a 60/30/irregular → **frame 30** y mismo checksum (`e47e2997` sin acción, `3d815cb1` con `move-right`); `record`/`replay` idénticos; guards `advance(NaN/−5000/Infinity/−0)` → 0 sin mutar; `advance(10000)` → 5; `stepManual(2.5)`→2, `(−5)`→0; `replay` descarta grabación. *(Nota: los checksums hex cambian por el nuevo estado vertical; se protege la propiedad.)*
- **Física (Node y navegador):** salto desde `grounded` → `vy<0` en el **tick 1** (≤6, PR-01); apex `y=192.944` (ascenso 69.06 px); aterrizaje de nuevo en el suelo (tick 45) con `vy=0`; **edge-trigger** (mantener `jump` no re-salta). **Coyote** 5 ticks (~80 ms): salto dentro de la ventana acierta y fuera no. **Buffer**: pulsar dentro de la ventana dispara el salto al aterrizar y fuera no. **Límites:** `x∈[48.5, 431.5]`, `y∈[59, 262]`.
- **Verticalidad (D-20):** nivel 1 alcanzado (f34, `x=311.17, y=210`); desde él, **nivel 2** alcanzado con salto encadenado (f74, `x=244.79, y=158`; una variante con 4 ticks de frenado lo logra en f72, `x=249.46`). Reproducido con la secuencia del README y con búsqueda independiente.
- **Auditoría (2026-10-15, subagente distinto, solo lectura):** veredicto **APROBADO, 14/14 criterios**, coincidente con la verificación del orquestador. Hallazgo **NB-1 (no bloqueante):** la ventana **efectiva** del jump buffer es ~83 ms (5 ticks) hasta la ejecución / ~67 ms hasta el aterrizaje, no los 100 ms nominales, por el orden de actualización (`vertical.ts` decrementa el buffer el mismo tick en que se fija y evalúa la colisión después del salto); el comportamiento funcional (dentro→salta, fuera→no) es correcto. **NB-2:** verificación visual humana diferida (runtime sin entrada de imagen). Sin regresiones.
- **Límites:** controles probados con eventos de teclado **sintéticos** sostenidos (el salto es edge-trigger), no teclado físico; el rAF corrió a ~60 fps. `DEFAULT_SCENARIO` pasó a `platforms`, de modo que la partida de demostración arranca con las plataformas visibles. El arte aéreo y de plataformas es provisional.

### Criterios de salida — GOW8B-LIGHT-01 (etapa 9)

**Objetivo:** implementar **una acción de ataque ligero completa** (estado, pose, hitbox, contacto y recuperación) iniciada con `J`, sobre el lienzo 480×270, **sin daño ni muerte** (eso corresponde a la etapa 14). Arte provisional.

**Funciones previas que deben protegerse:** movimiento horizontal (etapa 6), salto/plataformas y determinismo (etapa 8), animación idle↔run y volteo (etapa 7), integridad de assets (etapas 6.5/7) y los guards de `Simulation`.

1. **Estado de ataque determinista.** El jugador gana un estado de ataque con fases (`startup`/`active`/`recovery`) y temporizadores, actualizado en el paso fijo sin no-determinismo (nada de `Math.random`/`Date`/reloj de render).
2. **Disparo edge-trigger de `light-attack`.** Pulsar `J` con el jugador **en suelo** y sin ataque en curso inicia el ataque; mantener `J` no lo reinicia ni lo repite; no puede iniciarse otro golpe hasta terminar (sin combos ni cancelaciones en esta etapa). No se inicia ataque en el aire.
2b. **Interacción con salto.** Mientras el ataque está en curso (no `none`), `jump` **no** inicia un salto nuevo; al terminar el ataque, el salto vuelve a estar disponible.
2. **Ciclo completo.** `startup` → `active` → `recovery` → reposo, con duraciones configurables; al terminar, el jugador recupera idle/run normales. No se puede reiniciar el ataque hasta que la fase vuelva a `none`.
4. **Respuesta al input ≤100 ms (PR-01).** Desde la pulsación de `J` hasta el inicio de la fase **activa** (o el contacto) transcurren **≤6 ticks**.
5. **Hitbox.** Durante las fases activas existe una hitbox **delante** según `facing` (offset, ancho y alto configurables en `CONFIG`); fuera de la ventana activa **no hay** hitbox. Con el jugador en suelo, responder a `J` dentro del alcance.
6. **Contacto.** En un escenario `combat` (jugador en suelo + al menos una entidad objetivo), la hitbox detecta el **solapamiento** y registra el impacto (p. ej. `hits`/ids en el estado serializable); un mismo golpe **no** cuenta el mismo objetivo más de una vez. **Sin daño, retroceso ni muerte.**
7. **Solo ataque ligero.** No hay ataque pesado, esquiva, enemigos con IA, daño, muerte ni bloqueo; `heavy-attack`/`dodge`/`context-action` siguen sin efecto. Sin dependencias nuevas.
8. **Configuración centralizada.** Duraciones de fase, geometría de la hitbox y alcance viven en `CONFIG`/escenario; sin números mágicos dispersos.
9. **Presentación provisional.** Retroalimentación legible del ataque (pose neutral **provisional** y/o indicador de hitbox provisional y marca de contacto), **etiquetada como provisional**; sin `jitter` (`roundPixels`, nearest). En el aire/plataformas se conserva el comportamiento de la etapa 8.
10. **Determinismo (regresión 5/6/6.5/7/8).** Se conserva la **propiedad** (misma traza por tick → mismo checksum; 500 ms a 60/30/irregular → mismo frame y checksum; `replay` idéntico) y los guards (`advance` ignora delta no finito/≤0; `stepManual` normalizado; `replay` descarta grabación). *(Nota: el nuevo estado cambia los checksums hex; se protege la propiedad.)*
11. **Shell y harness sanos.** `pnpm exec tsc --noEmit` y `pnpm build` exit 0; `pnpm dev` sin errores ni warnings nuevos (404 `favicon.ico` permitido); `__GOW8B` ausente del bundle; el harness sigue funcionando (escenario `combat`, `snapshot`, `record`/`replay`).
12. **Documentación y evidencia.** `README.md`/docs reflejan el ataque ligero, controles (`J`), parámetros, condición provisional y procedimiento; captura; auditoría independiente de solo lectura por un subagente distinto del implementador. **No se marca aprobada antes de esa auditoría.**

**EVIDENCIA:** comandos `pnpm exec tsc --noEmit` y `pnpm build`; navegador con `pnpm dev` (`J` para atacar, con `A`/`D` o `←`/`→`; `Espacio` para saltar) mostrando el ciclo de ataque y el contacto, con captura y consola; harness/Node con trazas de determinismo (60/30/irregular, `replay`) y de ataque (respuesta ≤6 ticks, ventana de hitbox, un solo impacto por golpe, sin hitbox fuera de la ventana, interacción con salto). Auditoría independiente de solo lectura por un subagente distinto; **no se marca aprobada antes de esa auditoría**.

**Nota de proceso:** el arte del ataque es **provisional**; el arte definitivo y el encadenamiento de combo se harán en etapas posteriores.

#### Implementación de GOW8B-LIGHT-01 — auditoría aprobada (2026-10-15)

Implementada por un subagente (runtime OpenCode) y auditada en **solo lectura** por un subagente **distinto** (OpenCode, modelo distinto): **12/12 criterios, sin regresiones** en las etapas 6/7/8 (73 comprobaciones propias del auditor; baterías `battery.cjs`/`extra.cjs`/`reg2.cjs` en `/tmp/opencode/auditor`).

Archivos: nuevo `src/sim/attack.ts` (`stepAttack`, `computeAttackHitbox`; fases por ticks, ventana de hitbox y registro de contactos sin duplicados); `src/sim/types.ts` (`EntityState` gana `attackPhase`/`attackTicks`/`attackHits`); `src/sim/scenarios.ts` (campos de ataque + escenario `combat`: jugador `(200,262)` y `dummy` `(240,262)`); `src/sim/world.ts` (flanco `light-attack`, `stepAttack` antes de `stepVertical`, `canJumpEdge` bloqueado durante el ataque, `playerAttackHitbox()`, `targetEntities()`); `src/config.ts` (`CONFIG.player.attack` + colores en `presentation`); `src/main.ts` (rect de hitbox, objetivos y tinte de contacto, rótulo provisional); `README.md`; captura `docs/referencias/captura-ataque-ligero-480x270.png`. Sin dependencias nuevas; `manifest.ts`/`harness.ts` intactos.

Evidencia: `pnpm exec tsc --noEmit` y `pnpm build` exit 0 (21 módulos); `__GOW8B`=0; assets intactos (`kratos-neutral` `df52a7fc…c4a`, `kratos-run` `78f68cf2…7e2ea`, `egeo-fondo` `8f8b5885…9ee1`). Determinismo (mi batería + la del auditor, coincidentes en propiedad): init `platforms` `78d6aadb`, `combat` `dbb51c2c`; 500 ms a 60/30/irregular → frame 30 y mismo checksum; `record`/`replay` idénticos; guards OK; misma traza ×2 idéntica. **Ataque:** ciclo `startup(5)→active(4)→recovery(7)→none`; desde el flanco la fase `active` empieza en el **frame 6** (≤6) y el **primer contacto en el frame 7** (≤6 ticks desde la pulsación); mantener `J` produce **un solo ciclo** y un solo `attackHits`; hitbox solo en `active` (geometría = CONFIG, delante según `facing` en ambos sentidos); sin daño (`dummy` byte-a-byte idéntico); no inicia en el aire; `jump` bloqueado durante el ataque y disponible después; `heavy-attack`/`dodge`/`context-action` sin efecto. `tsc`/`build` OK; `__GOW8B`=0; assets y `manifest.ts`/`harness.ts` intactos. Verificado además en navegador (`pnpm dev`, teclado sintético): input→`active` en ~81 ms; consola solo con el 404 `favicon.ico`.

Hallazgos **no bloqueantes:** (NB-1) `cloneEntities` es copia superficial, por lo que `attackHits` comparte referencia con la plantilla; hoy es inocuo porque `attack.ts` **reasigna** `attackHits=[]` antes de cualquier `push`, pero todo `push` futuro debe reasignar para no contaminar entre recargas. (NB-2) el frame que transiciona `startup→active` no evalúa solapamiento (la hitbox se ve en el frame 6; el contacto se mide en el 7): cumple el criterio. (NB-3) el ataque no bloquea el movimiento horizontal ni cambia la pose del sprite (deuda de arte/combo, permitida por el criterio 9). (NB-4) la verificación **visual humana** sigue diferida (misma deuda que CMP-01/ANIM-01).

### Criterios de salida — GOW8B-COMBO-01 (etapa 10)

**Objetivo:** **continuar el combo ligero**: encadenar golpes con una **nueva pulsación** de `J` dentro de la ventana, con **contactos adicionales** por golpe, sobre 480×270 y **sin daño** (etapa 14). Arte provisional.

**Funciones previas que deben protegerse:** ataque ligero (etapa 9), salto/plataformas y determinismo (etapa 8), movimiento (etapa 6), animación (etapa 7), assets, harness y guards.

1. **Estado de combo determinista.** `EntityState` lleva el **índice del golpe** de la cadena (p. ej. `attackChain: number`, 0-based) y los temporizadores, actualizados en el paso fijo; sin `Math.random`/`Date`/reloj de render.
2. **Encadenamiento por flanco dentro de la ventana.** Una **nueva** pulsación de `J` durante `active`/`recovery` del golpe en curso (y con `chain < maxChain`) **encadena** el golpe siguiente (transiciona inmediatamente al `startup` del siguiente). **Mantener `J` no encadena** (cada golpe requiere un flanco nuevo). No se inicia combo en el aire.
3. **Ciclo por golpe.** Cada golpe recorre `startup`→`active`→`recovery`; si **no** hay pulsación en la ventana, al terminar la recuperación vuelve a `none` (comportamiento de la etapa 9 conservado). No se puede reiniciar desde `none` hasta terminar.
4. **Respuesta al input ≤100 ms (PR-01).** La pulsación que encadena lleva a la fase `active` del **golpe siguiente** en **≤6 ticks** desde esa pulsación.
3b. **Límites del combo.** `maxChain` configurable (por defecto 3). Tras el último golpe del combo no se encadena; se vuelve a `none` tras su `recovery`. No se inicia ataque en el aire.
4b. **Interacción con salto.** Durante **todo el combo** (cualquier fase) `jump` no inicia salto; al volver a `none`, el salto vuelve a estar disponible.
5. **Hitbox por golpe.** Cada golpe tiene su **ventana de hitbox** (delante según `facing`); fuera de la ventana **no** hay hitbox. Los parámetros por golpe (o reutilizados) viven en `CONFIG`.
6. **Contactos adicionales.** Cada golpe registra contactos **una vez por objetivo**; `attackHits` se **reinicia por golpe**. Un objetivo dentro del alcance puede recibir impactos de **varios golpes** del combo. **Sin daño, retroceso ni muerte** (el objetivo no cambia de estado).
7. **Solo combo ligero.** `heavy-attack`/`dodge`/`context-action` siguen sin efecto; sin dependencias nuevas.
8. **Configuración centralizada.** `maxChain`, ventana de encadenamiento, duraciones por golpe y geometría de hitbox en `CONFIG.player.attack`; sin números de combate dispersos.
9. **Presentación provisional legible.** Retroalimentación del encadenamiento (p. ej. el indicador de hitbox varía de color/posición según el índice del golpe) y de los contactos, **etiquetada como provisional**, sin `jitter`; en el aire se conserva la etapa 8.
10. **Determinismo (regresión 5-9).** Propiedad (`×2`, 500 ms 60/30/irregular, `record`/`replay`) y guards.
11. **Shell y harness sanos.** `tsc`/`build` exit 0; `__GOW8B` ausente del bundle; `pnpm dev` sin errores nuevos (404 `favicon.ico` permitido); harness con `combat`, `snapshot`, `record`/`replay`.
12. **Documentación y evidencia + auditoría independiente** por un subagente distinto. **No se marca aprobada antes de esa auditoría.**

**EVIDENCIA:** `pnpm exec tsc --noEmit`/`pnpm build`; navegador (`pnpm dev`, `J` repetido dentro de la ventana) con captura y consola; harness/Node con trazas de combo (índice, ≤6 ticks por golpe, contactos por golpe, `maxChain`, mantenimiento de `J`, salto bloqueado) y de determinismo. Auditoría independiente de solo lectura por un subagente distinto; **no se marca aprobada antes de esa auditoría**.

#### Auditoría de GOW8B-COMBO-01 — APROBADA (2026-10-16)

Auditoría **independiente y de solo lectura** (subagente `general` distinto del implementador; runtime OpenCode, `opencode/big-pickle`; código + `esbuild`/`node` para la simulación determinista + Chrome DevTools MCP en navegador). `git status` quedó **idéntico** (el auditor no modificó archivos) y el dev server que arrancó (5174) quedó detenido.

**Veredicto por criterio (1–12): APROBADO** en todos. Evidencia destacada:

- **Encadenamiento por flanco:** flanco→`active` del golpe siguiente en **3 ticks** (≤6, criterio 4). Mantener `J` **no** encadena (1 solo golpe, `maxChain` intacto); no inicia en el aire.
- **Ciclo y límites:** ciclo exacto `startup`×5 / `active`×4 / `recovery`×7 → `none`; `maxChain=3`, secuencia `0,1,2`; sin flanco en la ventana vuelve a `none/0`.
- **Salto:** bloqueado en todo el combo (`vy=0`, `grounded=true`); disponible al volver a `none` (`vy=-363`).
- **Hitbox por golpe:** `computeAttackHitbox` = `null` salvo `active`; geometría por golpe desde `CONFIG` (g1 `206..230`, g2 `207..233`); delante según `facing` (con `facing=-1`, centro `x-18`).
- **Contactos:** `attackHits` reasignado `[]` por golpe; los 3 golpes contactan al mismo objetivo; dummy **byte-a-byte idéntico** (sin daño, retroceso ni muerte); sin duplicar dentro de un mismo golpe.
- **Alcance y config:** `heavy-attack`/`dodge`/`context-action` sin efecto; `package.json`/`pnpm-lock` sin diff (sin dependencias nuevas); `maxChain`, `combo[]`, `targetHalfWidth/Height` en `CONFIG.player.attack`.
- **Determinismo:** traza ×2 → `59c350b7`; 500 ms a 60/30/irregular → frame 30 y `ba42551f` (idéntico Node/navegador); `replay` `e02526ce`; guards OK.
- **Shell/harness:** `tsc --noEmit` y `build` exit 0 (21 módulos); `__GOW8B` = 0 en `dist`; escenarios `empty`/`test`/`movement`/`platforms`/`combat`, `snapshot`, `record`/`replay` OK; consola solo `404 favicon.ico`.

**Hallazgos:** bloqueante **ninguno**. No bloqueantes: (NB-A) el rótulo «provisional» del HUD queda superado por el arte definitivo de la etapa 10.5; (NB-B) `cloneEntities`/`getEntity` hacen copia superficial de `attackHits` (pre-existente, hoy inocuo); (NB-C) el tap de CDP (down+up en el mismo frame) no lo observa el `InputManager` basado en polling (limitación de la prueba, no del juego); (NB-D) verificación visual humana diferida (este runtime no interpreta imágenes).

**Veredicto global: APROBADA.**

### Criterios de salida — GOW8B-KRA-02 (etapa 10.5, nueva)

**Objetivo:** reemplazar el **arte provisional de animación** del jugador —placeholder de carrera de la etapa 7, pose aérea de la etapa 8 y ausencia de poses de ataque— por **hojas de animación originales** de Kratos (**idle, carrera, aire y ataque**) legibles con la silueta a 480×270, coherentes con las **fases de simulación ya existentes** (idle↔run de la etapa 7; `attackPhase`/`attackChain` de las etapas 9–10) y **sin cambiar la simulación**, el movimiento, el salto ni las hitboxes. Arte **original** (D-04), sin dependencias nuevas en el juego, con **verificación visual local** (D-21). Es una tarea de **arte e integración**, no de gameplay.

**Funciones previas que deben protegerse:** determinismo de `Simulation` (propiedad y guards de etapas 5–10), `World.snapshot`/`loadScenario`/`reset`, movimiento (`maxSpeed`/`accel`/`brake`, límites `48.5`/`431.5`, respuesta ≤6 ticks), salto/plataformas (coyote/buffer, dos niveles), ataque/combo (fases, ventanas de hitbox, `attackHits`) y la integridad de los assets aprobados (`kratos-neutral.png`, `egeo-fondo.png`).

1. **Cuadros originales en la rejilla del juego.** Cada hoja usa cuadros de **97×59** con los **pies anclados** al borde inferior y origen `(0.5, 1)`, igual que `kratos-neutral.png`; sin `jitter` (`roundPixels`, nearest-neighbor). El anclaje y el rectángulo de cuadro **no cambian** entre poses.
2. **Silueta legible.** Kratos se dibuja **de perfil**, con **contorno exterior limpio** y **sombreado direccional coherente**; la silueta se distingue a tamaño nativo y no se «embarra» con el fondo. Paleta coherente con `kratos-neutral.png`.
3. **Hojas y recuento.** Se entregan `kratos-idle` (reposo, ≥2 cuadros), `kratos-run` (carrera, ≥6 cuadros, con espejado), `kratos-air` (aire, ≥1 cuadro) y `kratos-attack` (ataque, ≥3 cuadros).
4. **Principios de animación.** El ciclo de carrera evidencia **squash & stretch**, **anticipación** y **arcos**, con volumen aparente constante; el reposo respira sutilmente.
5. **Coherencia con las fases existentes.** Aire = sin ciclo de carrera (etapa 8); ataque = pose ligada a `attackPhase`/`attackChain` de las etapas 9–10; idle↔run ligado a `|vx|` (etapa 7). **No** se cambian duraciones de fase, ventanas de hitbox ni `attackHits`.
6. **Integración por manifest.** Nuevas claves en el dominio `characters` (`kratos-idle`, `kratos-run` con su recuento real, `kratos-air`, `kratos-attack`), cargadas por `src/assets/manifest.ts` sin rutas dispersas; `CONFIG.player.run.frames` **reconciliado** con la hoja real (elimina el desajuste 6 vs 4, D-22). Al ser arte **definitivo**, `PROVISIONAL_ART` pasa a `false` y se retira el rótulo provisional.
7. **Verificación visual local (D-21).** Cada hoja se evalúa con un **verificador visual local** (Ollama + modelo de visión pequeño en CPU, **solo desarrollo**) o, en su defecto, con una **hoja de contacto** revisada por la usuaria; se registra la observación. **No se aprueba arte sin haberlo evaluado visualmente.** Si el verificador corre en CPU, se declara su límite perceptivo.
8. **Solo presentación.** La animación se deriva del estado de simulación y **no** lo altera: misma traza por tick → mismo checksum; 500 ms a 60/30/irregular → mismo frame y checksum; `replay` idéntico; guards de `advance`/`stepManual` y `replay` descarta grabación.
8b. **Sin dependencias en el juego.** No se añaden dependencias a `package.json` del juego; la herramienta de visión es **externa al runtime del juego** y reemplazable por revisión humana. Sin números de balance dispersos.
9. **Shell y harness sanos.** `pnpm exec tsc --noEmit` y `pnpm build` exit 0; `pnpm dev` sin errores ni warnings nuevos (404 `favicon.ico` permitido); `__GOW8B` ausente del bundle de producción; el harness sigue funcionando (escenarios `empty`/`test`/`movement`/`platforms`/`combat`, `snapshot`, `record`/`replay`).
10. **Documentación y evidencia.** `README.md` y docs reflejan el arte definitivo, el procedimiento reproducible de generación y los hashes; captura de idle/carrera/aire/ataque con controles normales; auditoría independiente de solo lectura por un subagente distinto del implementador. **No se marca aprobada antes de esa auditoría.**

**EVIDENCIA:** hojas PNG y sus **SHA-256**; script reproducible (p. ej. `scripts/gen-kratos-anim.py`) y su procedimiento; **descripciones del verificador visual local** o hoja de contacto revisada; navegador (`pnpm dev`, `A`/`D` o `←`/`→`, `Espacio`, `J`) mostrando idle, carrera, aire y ataque, con captura y consola; harness/Node con la regresión de determinismo (60/30/irregular, `replay`) y de movimiento/salto/ataque; verificación de que `kratos-neutral.png` y `egeo-fondo.png` siguen intactos. Auditoría independiente de solo lectura por un subagente distinto; **no se marca aprobada antes de esa auditoría**.

**Nota de proceso:** la etapa 10.5 se inserta entre las etapas 10 y 11 **sin renumerar** 11–29 (misma convención que 6.5). El usuario autorizó el **enfoque** (D-21) y, después, la **ejecución**; el arte quedó **integrado** el 2026-10-16 y **no se marca aprobada** hasta la auditoría independiente de solo lectura.

**Entorno de verificación visual (2026-10-16): preparado.** A petición del usuario (`prepáralo`) se instalaron herramientas de **desarrollo**, fuera del runtime del juego y sin dependencias nuevas en `package.json`:

- **Ollama v0.40.5** instalado local (sin sudo) en `~/.local/opt/ollama`, binario enlazado en `~/.local/bin/ollama`; servidor en `http://127.0.0.1:11434` (arranque manual o vía el envoltorio; no es servicio systemd).
- **Modelo de visión `moondream`** (~1.7 GB, CPU; sin GPU dedicada — el equipo tiene una iGPU AMD Mendocino, así que la inferencia es en CPU). Prueba funcional: describió `kratos-neutral.png` (personaje pixel art con dos espadas) y `kratos-run.png` («seis figuras en fila»).
- **Envoltorio `~/.local/bin/ollama-vision <imagen> ["prompt"] [modelo]`** que arranca el servidor si no está activo y devuelve la descripción. Es la vía reproducible del criterio 7.
- **Skill oficial `phaserjs/phaser@animations`** instalada globalmente en `~/.agents/skills/animations` para el paso de integración.

**Límites:** es un VLM pequeño; sirve como filtro, no como juicio de estilo definitivo. Sigue vigente la **deuda no bloqueante** de revisión visual humana hasta que este bucle se use sobre las hojas de la etapa.

#### Estado de implementación (2026-10-16) — integrada, **pendiente de auditoría**

Tras la autorización de ejecución del usuario, el orquestador **reescribió** `scripts/gen-kratos-anim.py` (pixel art con segmentos de píxeles enteros, contorno duro de 1px, paleta de 6 colores extraída y verificada de `kratos-neutral.png`, pies anclados) y **regeneró** las cuatro hojas: `kratos-idle.png` (194×59, 2 cuadros), `kratos-run.png` (582×59, **6** cuadros), `kratos-air.png` (194×59, 2 cuadros) y `kratos-attack.png` (291×59, 3 cuadros). **Integración:** `src/assets/manifest.ts` registra las 4 hojas como `spritesheet` 97×59 y `PROVISIONAL_ART = false`; `src/config.ts` fija `CONFIG.player.run.frames = 6` (**desajuste 6-vs-4 resuelto**) y añade `player.idle`/`player.air`; `src/main.ts` selecciona la pose por estado con prioridad **ataque > aire > carrera > reposo** (ataque ligado a `attackPhase`).

**Evidencia recogida:**

- **Hashes SHA-256 (2026-10-16):** idle `48b02b96a8efb52d0d6c0f4acec2f6886bedd81d22eeba09921fa4ee779635de`; run `27ec7d858bf82a0eb31deabe8405cb541ecb193512f15a747c4c44441aa932bc`; air `5deed24a5382d9e6ec61059d2b419548219c9544945741de32823a3abee1b1d0`; attack `22bbd179710c8c66809e63653489bc5cc8a8966def183a9c8cae28c464c1c276`. `kratos-neutral.png` (`df52a7fc…`) y `egeo-fondo.png` (`8f8b5885…`) **intactos**.
- **Programático (Pillow):** cada cuadro 97×59; todos los colores opacos ⊂ los 6 del neutral; la fila `y=58` tiene píxeles opacos en todos los cuadros (pies anclados; bbox inferior = 58 en las cuatro hojas).
- **Navegador (`pnpm dev`, sin errores de consola — solo el 404 de `favicon.ico`):** con entradas **sintéticas** (etiquetadas como tales) se midió sobre el canvas una **silueta distinta por estado** (reposo/aire/carrera/ataque) y se observó `attackPhase` en `startup`/`active`/`recovery`; las 4 hojas cargan `200`.
- **Determinismo (regresión protegida):** 500 ms a 60/30/irregular (dos órdenes) → **mismo frame (30) y mismo checksum**; `replay` **idéntico**; límites de movimiento **48.5/431.5** intactos; salto (subida ~69 px) y ataque (contactos acumulados) sin regresión.
- **`pnpm exec tsc --noEmit`** y **`pnpm build`** exit 0; `__GOW8B` **ausente** del bundle de producción.
- **Verificador visual local (D-21):** `ollama-vision` + `moondream` (CPU). `kratos-idle` → «una persona»; `kratos-run` → «una persona corriendo en una línea». Fue **intermitente** (HTTP 500 transitorios y salidas incoherentes en `air`/`attack`), por lo que se declara su **límite perceptivo**: filtro grueso, no juicio de estilo. Hoja de contacto en `docs/referencias/kratos-anim-contact-sheet.png`.

**Estado (2026-10-16): auditoría independiente de solo lectura APROBADA.** La realizó un subagente `general` distinto del implementador (runtime OpenCode, `opencode/big-pickle`): **aprobada** con una observación que resultó incorrecta y quedó corregida el 2026-10-21 (afirmaba que la hoja `kratos-attack.png` tiene 4 cuadros; tiene **3** —291 px / 97 px por cuadro— y `attackPhase` mapea los 3, así que no había deuda alguna). **Queda deuda no bloqueante:** la **revisión visual humana** de la hoja de contacto (criterio 7).

**Limitación conocida:** el implementador subagente (`general`) no completó la tarea (dos intentos: uno devolvió vacío y otro fue interrumpido), por lo que la implementación la realizó el **orquestador**; la auditoría debe, por tanto, hacerla un subagente distinto.

### Criterios de salida y evidencia — GOW8B-SCALE-01 (nueva, Bloque 1)

**Objetivo:** fijar la **referencia de escala** del juego —línea de pies, silueta, altura útil de salto y radios/envolventes de alcance— derivada del arte y la física vigentes, para que el diseño del mapa (Bloque 7) la consuma. Es una tarea de **medida, centralización y visualización DEV**, no de gameplay: **no cambia el estilo del arte** ni el comportamiento.

**Funciones previas que deben protegerse:** `CONFIG.player` completo (velocidades, límites `48.5`/`431.5`, gravedad/salto/`maxFallSpeed`, coyote/buffer, combo y hitboxes por golpe), determinismo (`checksum`, `replay`, 60/30/irregular), `src/sim/*` intacto, integridad de los assets aprobados (`kratos-*.png`, `egeo-fondo.png`) y ausencia de `__GOW8B` en el bundle de producción.

1. **Referencia derivada, no copiada.** Las métricas se calculan desde las constantes vigentes (física y sprite); ninguna cifra de escala duplicada a mano y sin números dispersos en escenas o entidades.
2. **Cobertura.** Línea de pies y anclaje, silueta (ancho/alto y relación con el canvas), altura útil y alcance horizontal del salto, envolvente de alcance de ataque por golpe del combo y su máximo, y las envolventes de mapa derivadas de lo anterior.
3. **Sin cambio de comportamiento.** `CONFIG.player` conserva sus valores; determinismo preservado; `src/sim/*` sin tocar.
4. **Solo DEV lo que es DEV.** El overlay de referencia no altera la simulación ni el render de producción; `__GOW8B` y los símbolos del overlay ausentes del bundle.
5. **Verificable.** Métricas legibles desde el harness DEV; `pnpm exec tsc --noEmit` y `pnpm build` exit 0; sin dependencias nuevas; consola sin errores nuevos (solo el 404 preexistente de `favicon.ico`).
6. **Documentación y evidencia** más auditoría independiente de solo lectura por un subagente distinto del implementador.

**Entrega:** `src/scale.ts` (nuevo, cálculo puro y sin dependencias de motor), `CONFIG.scale` en `src/config.ts` derivado de una fuente única `PLAYER`, `src/dev/scaleOverlay.ts` (nuevo), el import DEV-guarded y el wiring de `src/main.ts`, y `getScaleReference`/`toggleScaleReference`/`isScaleReferenceVisible` en `src/dev/harness.ts`.

**Registrado (2026-10-17, rama `tarea/GOW8B-SCALE-01`, HEAD `e6f9013` sin commits):** implementación por un subagente (`general`, runtime OpenCode, `big-pickle`); auditoría por un subagente distinto.

**Evidencia del implementador:** `CONFIG.player` idéntico en valor al archivo previo (comparación carácter a carácter ignorando espacios: mismo contenido); `tsc --noEmit` y `build` exit 0; `replay` ×3 del mismo trace → `7e6ee4e4`; 500 ms a 60/30/irregular → frame 30 y `278a3618` en los tres; overlay visible vs oculto → mismo checksum `12b79e1b`; hashes de los 6 assets sin cambios; `__GOW8B` y símbolos del overlay ausentes de `dist/`; servidores detenidos.

**Evidencia de la auditoría independiente (2026-10-17):**

- **Métricas realmente derivadas (prueba de mutación):** sobre una copia fuera del repo, con `PLAYER_SPRITE_WIDTH 97→58` y `jumpSpeed 380→500` cambiaron `silhouette.width`, `horizontalTravel.minX`, `jump.ideal.apexHeight` (72.2→125), `airTimeSeconds` (0.76→1), `horizontalReach` (106.4→140), `jump.ticks.apexHeight` (69.056→120.833), `airTimeTicks` (45→59), `maxStepUp` y `maxGapWidth`; permanecieron sin cambio, correctamente, `sprite.height` y `heightRatio`. Controles de fórmula `true`.
- **El cálculo replica el motor real:** `simulateJumpTicks` sobre `stepVertical` → `apexHeight 69.056 @ tick 22`, aire `45 t (0.75 s)`, alcance `105`; coinciden con las métricas derivadas.
- **`src/scale.ts` puro:** cero `import`, cero `Math.random`/`Date`/`performance`/`window`/`document`/`Phaser`; solo `Math.min/max/floor`.
- **Sin cambio de comportamiento:** velocidades, límites, gravedad, salto, coyote/buffer y `topY` sin cambios frente a HEAD; las diferencias restantes en `CONFIG.player` son de COMBO-01/KRA-02 (estructura de combo, `idle`/`air`, `run.frames 4→6`), **no** de esta etapa. Determinismo **8/8** (mismo plan → mismo checksum y frame; `replay` == paso fijo; 60 Hz == 30 Hz; irregular == paso fijo; 60 ticks exactos por segundo; 2 ticks por frame irregular).
- **Navegador (puerto propio 5199; 5173/5175 del usuario intactos):** con el overlay activado aparecieron 2339 px de referencia (línea de pies cian, silueta amarilla, caja de salto verde, bandas de ataque rosa) y corrida horizontal de 480 px en la fila de la línea de pies; la tecla `G` verifica con keypress real; checksum `fa0bcd1b` **idéntico** con overlay OFF/ON/OFF; consola sin errores y sin respuestas 4xx/5xx; servidores detenidos.
- **Cierre:** `git status --porcelain` con el mismo hash que al inicio (el auditor no modificó nada) y HEAD sin commits.

**Veredicto global de la auditoría: APROBADA** (sin hallazgos bloqueantes). Observaciones no bloqueantes: (a) `run.frames 4→6` respecto a HEAD es de KRA-02, no de esta etapa; (b) `src/scale.ts` viaja en el bundle de producción porque `CONFIG.scale` se evalúa al importar `config.ts` — el criterio solo exigía que no se filtraran `__GOW8B` ni los símbolos del overlay; (c) el overlay dibuja las envolventes de ataque siempre, sin condicionarlas a `attackPhase` (coherente con ser una referencia de escala, no un indicador de combate); (d) el árbol de trabajo reúne tres etapas sin commit, así que la atribución se hizo por contenido, no por git.

**Deuda no bloqueante abierta:** la verificación visual humana sigue difiriendo (§CMP-01, §GOW8B-KRA-02). Las comprobaciones pendientes están consolidadas en [`docs/pendientes-de-validacion-humana.md`](pendientes-de-validacion-humana.md).

### Criterios de salida y evidencia — GOW8B-DJUMP-01 (nueva, Bloque 1)

**Objetivo:** añadir el **doble salto** —un segundo impulso aéreo— manteniendo la compatibilidad con la etapa 8 (salto, coyote, buffer y plataformas) y con el bloqueo de salto durante el combo (etapas 9–10).

**Funciones previas que deben protegerse:** salto simple desde el suelo (altura y tiempo de vuelo), coyote y buffer, bloqueo de salto durante **todo** el combo (`attackPhase !== 'none'`), movimiento y límites `48.5`/`431.5`, plataformas, determinismo.

1. Estado del doble salto **determinista** en `EntityState` (`jumpsUsed`), actualizado solo en el paso fijo.
2. **Segundo impulso por flanco nuevo**: mantener la tecla **no** encadena saltos.
3. **Límite configurable** `CONFIG.player.vertical.maxJumps` (defecto **2**): nunca más de 2 impulsos sin tocar suelo.
4. **Reposición al aterrizar**: al quedar `grounded` el contador vuelve a 0.
5. **Coyote y buffer preservados**: el salto dentro de la ventana de coyote cuenta como salto de suelo y no consume el aéreo.
6. **Sin regresión del combo**: salto y doble salto siguen bloqueados durante el combo.
7. **Sin regresión del salto simple**: la altura y el tiempo de vuelo del primer salto no cambian.
8. **`CONFIG.scale` actualizado y derivado** para que el mapa se diseñe con el alcance real de dos impulsos (`doubleTicks`, `maxStepUp`, `maxGapWidth`).
9. **Determinismo** (misma traza → mismo checksum; 60/30/irregular → mismo frame; `record`/`replay` idénticos).
10. **Shell sano** (`tsc --noEmit` y `build` exit 0; `__GOW8B` ausente; sin dependencias nuevas; arte intacto) y **auditoría independiente**.

**Entrega:** `src/sim/types.ts` (`jumpsUsed`), `src/sim/vertical.ts` (lógica del impulso aéreo), `src/sim/world.ts` (`maxJumps` en `VERTICAL_PARAMS`), `src/sim/scenarios.ts` (inicialización), `src/config.ts` (`maxJumps`) y `src/scale.ts` (`simulateJumpWithImpulses`, `simulateDoubleJumpTicks`, `JumpReference.doubleTicks`).

**Evidencia re-medida por el orquestador (2026-10-17, rama `tarea/GOW8B-DJUMP-01`):** simulación directa sobre `World` con el escenario `movement` (60 ticks/s), 140 ticks por corrida, leyendo el estado con `getEntity` en cada tick:

| Caso | Altura alcanzada | Ticks de aire | Checksum de la traza |
|---|---|---|---|
| A — 1 pulsación **mantenida** (t≥1) | 69.0556 | 44 | `7c9dfa09` |
| B — 1 pulsación simple (t=1) | 69.0556 | 44 | `7c9dfa09` |
| C — 2.ª pulsación en el aire (t=12) | **120.3889** | 62 | `07c7fa9f` |
| D — 3.ª pulsación (t=24) | 120.3889 | 62 | `07c7fa9f` |
| E — 2.ª pulsación tardía (t=40) | 99.3889 | 88 | `404b8cbd` |

- **A == B**: mantener la tecla **no** encadena (misma altura y mismo checksum). Criterio 2 ✔
- **C == D**: la tercera pulsación se **rechaza** (misma altura y mismo checksum). Criterio 3 ✔
- **B == 69.0556**: es exactamente el ápice de referencia de `GOW8B-SCALE-01` → el salto simple **no cambió**. Criterio 7 ✔
- **E < C**: el segundo impulso tardío da menos altura total, como corresponde a la física. ✔
- **Determinismo:** mismo plan ×3 → `3ac7c309` idéntico. `mc` idéntico. Criterio 9 ✔

> **Esquema de los checksums de esa tabla** (para poder reproducirlos): la traza es una línea por tick con `x,y,vy,jumpsUsed` a 4 decimales, unida con `\n`, y el valor es `checksumOf` (`src/sim/checksum.ts`) de ese texto. Sin el esquema, el hex no es reproducible: la re-auditoría posterior intentó 12 esquemas distintos y no dio con él — de ahí que quede escrito acá. Las relaciones que importan (**A == B**, **C == D**) se verificaron igual por ápice y tiempo de aire, que son agnósticos al esquema.
- `tsc --noEmit` y `build` exit 0; `__GOW8B` ausente de `dist/`; sin dependencias nuevas; SHA-256 de los 6 assets intacto.

**Auditoría independiente (2026-10-17): APROBADA**, por un subagente distinto del implementador. El informe llegó truncado al transcript del orquestador, por lo que la tabla anterior es la **re-medición del orquestador**, no una cita del auditor.

**Observación no bloqueante:** `simulateDoubleJumpTicks` en `src/scale.ts:305-346` **sí** simula por tick (barre el tick del impulso extra y se queda con el mejor ápice y el mayor tiempo de aire), y por eso `apexHeight 138.111 = 2 × 69.0556` es el resultado legítimo de impulsar en el ápice, no un atajo aritmético. Dos detalles menores: (a) `src/scale.ts:340` devuelve `jumps: 2` **literal** en vez de la variable `jumps` calculada, así que con `maxJumps ≥ 3` el número reportado mentiría (hoy `maxJumps = 2`, correcto); (b) el comentario de `src/scale.ts:296-301` describe presentar los dos extremos por separado y el retorno es un único objeto con un solo `apexImpulseTick`. Ninguno afecta los valores actuales.

### Criterios de salida y evidencia — GOW8B-ROLL-01 (nueva, Bloque 1)

**Objetivo:** **rodada terrestre con i-frames** (absorbe la antigua «esquiva»). Su verificación plena se cierra cuando exista daño (Bloque 4).

**Funciones previas que deben protegerse:** movimiento, límites, salto simple, doble salto, combo y sus bloqueos, plataformas, determinismo, arte y bundle de producción.

1. Estado determinista en `EntityState` (`rollPhase`, `rollTicks`, `invulTicks`) y duración/i-frames en `CONFIG.player.dodge`.
2. Solo **terrestre**: no se inicia en el aire.
3. **Flanco nuevo**: mantener la tecla no reinicia la rodada.
4. **Ininterrumpible** mientras está activa; bloquea el inicio de ataque durante su duración.
5. **Los i-frames cubren la rodada** (no deben sobrevivir a la animación).
6. Determinismo, shell sano y auditoría independiente.

**Evidencia re-medida por el orquestador — estado ANTES de la corrección (2026-10-17):** escenario `movement`, una pulsación en `t=2`:

- Rodada activa: ticks **2..15 → 14 ticks (233 ms)**. Config `durationMs: 250` → 15 ticks. ✔ (coherente)
- I-frames activos: ticks **2..30 → 29 ticks (483 ms)**. Config `invulMs: 250` → 15 ticks. ✘
- Mantener la tecla `dodge`: **una sola** rodada (no se reinicia). ✔
- Rodada en el aire: **rechazada** (`rollPhase` sigue `none`, `vy` intacto). ✔

**Hallazgo BLOQUEANTE (H-ROLL-1) — los i-frames duran el doble de lo configurado y sobreviven a la rodada.**

- **Evidencia:** con `durationMs: 250` e `invulMs: 250`, la rodada dura 14 ticks observados (233 ms) pero la invulnerabilidad dura **29 ticks (483 ms)**: **15 ticks (250 ms) de invulnerabilidad gratis después de terminar la animación**.
- **Causa raíz (leída en el código):** `src/sim/roll.ts:28-46`. En `stepRoll`, la rama `rollPhase !== 'none'` incrementa `rollTicks` pero **nunca decrementa `invulTicks`**; el bloque `if` de las líneas 37-40 está **vacío** (solo un comentario). Por eso el contador se queda en 15 durante toda la rodada y recién empieza a bajar al terminar: 15 + 15 = 30 ticks.
- **Contradicción con el propio código:** `src/sim/types.ts:57-58` documenta «`invulTicks` counts down while entity is invulnerable», y **no** ocurre así durante la rodada.
- **Impacto:** el jugador recibe ~250 ms de invulnerabilidad extra con la animación ya terminada. Es material para el Bloque 4 (vida y daño): la ventana de i-frames que se verifique allí no sería la configurada. **Una función aprobada (los i-frames de la rodada) no cumple su criterio.**
- **Estado:** `GOW8B-ROLL-01` quedó **reabierta**; la corrección se aplicó y se re-auditó **el mismo día** (ver «Corrección aplicada y re-auditada» abajo). Criterio 5 de esta etapa: **cumplido tras la corrección**.
- **Nota de proceso:** la auditoría de esta etapa había cerrado como **PARCIAL** señalando esta misma zona (`invulTicks`, hallazgo N1) y el orquestador la marcó «Aprobada» sin resolver el hallazgo. Fue un error de cierre: el defecto se detectó recién en la verificación propia del orquestador, días-después, y se registra aquí.

**Plan de corrección (revisado y APROBADO en solo lectura por el auditor que reportó el hallazgo, antes de editar):**

- **Cambio propuesto:** en `stepRoll`, decrementar `invulTicks` exactamente **una vez por tick** siempre que sea `> 0`, sin importar la fase; y **eliminar el bloque `if` vacío** de las líneas 37-40. `startRoll` conserva su semántica (`max(invulTicks, ROLL_INVUL_TICKS)`), de modo que los i-frames empiezan con la rodada y **nunca la sobreviven**.
- **Archivos:** `src/sim/roll.ts` (corrección), `src/sim/types.ts` (ajustar el comentario de `invulTicks` si queda inexacto). Ningún otro.
- **Criterios de aceptación:** (1) los i-frames duran **≤ 15 ticks** y **no sobreviven** a la rodada (último tick con `invulTicks > 0` ≤ último tick con `rollPhase !== 'none'`); (2) la duración de la rodada **no cambia** (14-15 ticks observados, misma sensación); (3) mantener la tecla sigue dando **una sola** rodada; (4) la rodada sigue **rechazada** en el aire; (5) determinismo preservado (misma traza → mismo checksum; 60/30/irregular → mismo frame; `record`/`replay` idénticos); (6) sin cambios medibles en movimiento, salto, doble salto ni ataque; (7) `tsc --noEmit` y `build` exit 0, `__GOW8B` ausente, sin dependencias nuevas, arte intacto; (8) el comentario de `invulTicks` coincide con el comportamiento.
- **Regresiones protegidas:** SCALE-01, DJUMP-01 (ápice 69.0556 simple / 120.3889 doble, «mantener no encadena», tercera pulsación rechazada), COMBO-01 (encadenado por flanco, salto bloqueado en combo, ventanas), LIGHT-01 (contacto a dx=40) y CHAOS-01 (arcos y envolventes derivadas).
- **Compuerta:** el auditor que reportó el hallazgo revisa este plan en **solo lectura**. Si lo rechaza, se revisa el plan y **no se edita** hasta su aprobación. Si lo aprueba, **un único implementador** aplica la corrección y **un auditor distinto** la re-audita.

**Corrección aplicada y re-auditada (2026-10-17) — cierre de `H-ROLL-1`:**

- **Compuerta superada:** el auditor que reportó el hallazgo **aprobó el plan en solo lectura**, incluidas dos recomendaciones no bloqueantes (declarar la coherencia de config y advertir que los checksums con rodada cambian por diseño). Cero archivos editados antes de esa aprobación.
- **Aplicación (implementador único):** el decremento de `invulTicks` se movió a la **cabecera de `stepRoll`** (una vez por tick, en toda fase) y se eliminó el `if` vacío con su comentario. `startRoll` quedó **intacto** (`max(invulTicks, ROLL_INVUL_TICKS)`). Es el **único** archivo cuyo contenido cambió: `src/sim/types.ts` y `docs/` quedaron intactos — el comentario de `invulTicks` ya describía bien el comportamiento corregido.
- **Medición del orquestador (contraste propio):** rodada `2..15` = **14 ticks (233 ms)**, i-frames `2..15` = **14 ticks**, `survive=false`, una sola rodada al mantener la tecla. Traza tick a tick: `rollTicks` 1..15 con `invulTicks` 14,13,…,1,0; **no existe ningún tick «rodando pero vulnerable»** ni «invulnerable sin rodar».
- **Re-auditoría (auditor distinto del implementador, solo lectura): APROBADA**, 9/9 puntos OK, sin hallazgos bloqueantes. Verificó además con **navegador y tecla real** (Shift, puerto propio 5193) que la rodada no se reinicia manteniendo la tecla y que no se inicia en el aire, y que **la cobertura de i-frames es exacta** (no 1 tick corta ni larga) porque rodada e i-frames decrementan en lockstep. Confirmó `tsc`/`build` exit 0, `__GOW8B` ausente, sin dependencias nuevas, los 6 assets intactos, `git status` idéntico y servidor detenido; y que el fix toca **únicamente** `src/sim/roll.ts` y es byte-idéntico al plan aprobado.
- **Sin regresión demostrada por identidad:** comparando contra una copia previa del defecto e **ignorando el campo `invulTicks`**, todas las trazas salen **byte-idénticas**: movimiento (límites `48.5`/`431.5`), salto simple **69.0556**, salto **mantenido** (mismo ápice y mismo checksum que el simple: no encadena), doble salto **120.3889**, **tercera** pulsación rechazada (mismo checksum que la segunda), combo ligero (contacto único, salto bloqueado en combo). Determinismo: 500 ms a 60/30/irregular → frame 30 y mismo checksum; `record`/`replay` idénticos.
- **Efecto neto:** los i-frames pasan de **29 ticks (483 ms)** a **14 ticks (233 ms)**, es decir el doble de duración corregido a la duración configurada.
- **Observación no bloqueante (para el Bloque 4):** la cobertura exacta depende de que `invulMs == durationMs` (hoy 250/250). Con `invulMs < durationMs` la rodada termina sin i-frames; con `invulMs > durationMs` los i-frames sobreviven a la animación. Nada en el código fuerza esa igualdad, y `startRoll` usa `max(invulTicks, ROLL_INVUL_TICKS)`: si el daño del Bloque 4 aporta i-frames más largos, podrían sobrevivir a la rodada. Es diseño del Bloque 4, no un defecto abierto. Otras dos observaciones preexistentes y ajenas al fix: `isEntityInvulnerable` (`src/sim/attack.ts:165`) sin uso todavía, y `rollPhase: 'recovery'` nunca asignado.
- **Limitación declarada por la re-auditoría:** la sensación a 60 fps en tiempo real no se pudo evaluar (el `requestAnimationFrame` del entorno venía limitado a ~1 fps); sí se verificó el comportamiento por tick de simulación y con tecla real.

**Estado final: `GOW8B-ROLL-01` — APROBADA** (2026-10-17), con la verificación plena de los i-frames diferida al Bloque 4, cuando exista daño con el que probarla.

### Criterios de salida y evidencia — GOW8B-CHAOS-01 (nueva, Bloque 2)

**Objetivo:** dar identidad al arma —**Cuchillas del Caos**— y modelar sus **cadenas** (alcance) y **arcos de golpe**. El golpe deja de ser una **caja pegada al cuerpo** (`hitboxOffsetX/hitboxWidth/hitboxHeight`, una por golpe) y pasa a ser un **arco barrido**: una caja de hoja (`width × thickness`) transportada por la cadena desde `startRad` hasta `endRad` alrededor del agarre. Es la identidad del arma de *God of War*, no un adorno.

**Funciones previas que deben protegerse:** contacto **una vez por objetivo** por golpe y `attackHits` **reiniciado por golpe**; hitbox **solo** en fase `active`; encadenado por **flanco nuevo** de `J` (mantener no encadena); **salto bloqueado durante todo el combo** y disponible al terminar; el ataque **no** se inicia en el aire; la **rodada bloquea** el inicio de ataque; movimiento horizontal y límites `48.5`/`431.5`, salto simple, doble salto y rodada intactos; determinismo; `__GOW8B` ausente del bundle; arte intacto por hash.

1. **Identidad del arma centralizada.** `PLAYER.weapon` (`id`, `name`, `gripOffsetY`) en `src/config.ts`; ningún literal de arma disperso por escenas o entidades.
2. **Arcos por golpe.** Cada golpe del combo define su arco (ángulo inicial/final, radio, ancho y grosor de hoja) en `CONFIG`; la conversión grados→radianes ocurre en un único punto.
3. **Cadenas = alcance, y derivado.** La envolvente del golpe se deriva del muestreo del arco más el agarre; `CONFIG.scale.attack` (`nearX`/`farX`/`topY`/`bottomY` por cadena, `maxReach`, `minReach`, `bandHeight`) **se calcula**, nunca se copia a mano.
4. **Sin regresión de lo aprobado** (punto crítico: el modelo de golpe cambió): los cinco bloqueos y ventanas de las etapas 9–10 se conservan.
5. **Determinismo.** Sin azar ni reloj de render; `progress` acotado a `[0,1]`; misma traza → mismo checksum; 500 ms a 60/30/irregular → mismo frame y mismo checksum; `record`/`replay` idénticos.
6. **Shell sano.** `pnpm exec tsc --noEmit` y `pnpm build` exit 0; `__GOW8B` **ausente** de `dist/`; **sin dependencias nuevas**; arte intacto por SHA-256.
7. **Navegador** con el escenario `combat` en **puerto propio** (sin tocar 5173/5175) y consola sin errores nuevos (solo el 404 preexistente de `favicon.ico`).
8. **Auditoría independiente** de solo lectura por un subagente distinto del implementador.

**Entrega:** `src/config.ts` (`PLAYER.weapon` con `id`/`name`/`gripOffsetY`, y `arc` por golpe del combo), `src/sim/attack.ts` (`AttackArc`, `AttackParams`, `computeAttackHitbox` por muestreo), `src/sim/world.ts` (mapeo config→params y grados→radianes) y `src/scale.ts` (`ScaleAttackArc`/`ScaleAttackHit`, helper puro `sweptArcEnvelope`, y `AttackHitEnvelope` con `nearX`/`farX`/`topY`/`bottomY` en lugar de `offsetX`/`width`/`height`).

**Registrado (2026-10-17, rama `tarea/GOW8B-CHAOS-01`, HEAD `e6f9013` sin commits):** implementación por un subagente; auditoría por un subagente distinto.

**Evidencia de la auditoría independiente (2026-10-17):**

- **Regresión de lo aprobado: 5/5 sin fallos.** Contacto único por objetivo (`attackHits` nunca >1 y se reinicia por golpe; el dummy no cambia de estado); `computeAttackHitbox` devuelve `null` fuera de `active` (t6–t9 activos, resto 0); encadenado por flanco con `J`, mantener `J` no encadena, borde de salto bloqueado todo el combo y libre después, rodada bloquea el inicio de ataque; respuesta press→`active` 5/3/3 ticks (≤6); límites `48.5`/`431.5`, ápice `69.056 @ tick 22` y 45 ticks de aire intactos.
- **El arco no está en la ruta de movimiento (prueba de mutación):** sustituyendo el arco por una geometría arbitraria en una copia de la simulación fuera del repo, las trazas de movimiento, salto, doble salto y rodada salieron **idénticas byte a byte**. Es el control que prueba que el modelo nuevo no contamina lo aprobado.
- **Cobertura del arco, medida:** sin impacto a dx 5/6/7; `chain0` desde dx≥8; `chain1` desde dx≥9; `chain2` desde dx≥14; las tres entre dx 15 y 53; techo de `chain0` ~53, `chain1` ~58, `chain2` ~63. Span vertical real: `chain0` y[−48.3, −19.9], `chain1` y[−56.7, −17.9], `chain2` y[−65.7, −5.9]; el combo completo alcanza pies del objetivo en Y∈[−65.5, +5].
- **Envolvente derivada, y derivada de verdad:** `CONFIG.scale.attack` leído en ejecución → `chain0` nearX 21.00 / farX 40.00; `chain1` 19.58 / 44.00; `chain2` 13.94 / 49.00; `maxReach 49`, `minReach 13.943`, `bandHeight 71.709`. Se calcula en `src/scale.ts:407-422` con `sweptArcEnvelope` sobre `attack.combo`; en `src/config.ts` **no hay** literales de `maxReach`/`minReach`/`bandHeight`/`maxAttackGap`. `maxAttackGap = attackReference.maxReach`.
- **Determinismo:** misma traza ×2 → mismo checksum; 500 ms a 60/30/irregular → frame 30 y mismo checksum; 30×16.667 ms = 30 ticks; `record`/`replay` idénticos (`9be4049f…`).
- **Shell y arte:** `tsc --noEmit` exit 0 y `build` exit 0 (24 módulos); `__GOW8B` ausente de `dist/`; `git diff HEAD -- package.json pnpm-lock.yaml` **vacío**; SHA-256 de los 6 assets coincidentes (`df52a7fc…`, `48b02b96…`, `27ec7d85…`, `5deed24a…`, `22bbd179…`, `8f8b5885…`).
- **Navegador (puerto propio 5191; 5173/5175 intactos):** contactos t7/t13/t22 reproducidos, métricas idénticas a Node, toggle del overlay ON/OFF con checksum invariante `cf5a707f`, consola solo con el 404 preexistente de `favicon.ico`, loop a 60 fps. **Cierre:** `git status` idéntico al inicio del auditor y servidor detenido.
- **Limitación declarada:** la prueba de teclado físico por CDP (`press_key`) no la observa el `InputManager` poll-based (down+up en el mismo frame → `atkFrames: 0`). Es la limitación **ya documentada de `GOW8B-COMBO-01`**, no un fallo nuevo, y queda como **no verificable por esa vía**.

**Veredicto global de la auditoría: APROBADA** (sin hallazgos bloqueantes). Observaciones no bloqueantes: (a) **pérdida de contacto a muy corta distancia** — a dx≤7 no golpea ninguna cadena (`minReach` subió de 6 a 13.94); no rompe `GOW8B-LIGHT-01`, cuya evidencia se tomó a dx=40 y sigue contactando, pero es un cambio real de sensación en cuerpo a cuerpo; (b) **la envolvente vertical creció de 16 a 71.71 px** (el span real es ~59.8 y el valor es conservador): el arco llega hasta ~65.7 px sobre la línea de pies con un jugador de 59 px, o sea **por encima de la cabeza**; (c) los criterios de aceptación de esta etapa **no estaban escritos en el repositorio antes de implementar** — se formalizan en esta sección al cierre, y la auditoría se hizo contra el encargo; queda registrado como desviación de proceso.

**Deuda no bloqueante abierta:** la verificación visual humana sigue difiriendo (§CMP-01, §GOW8B-KRA-02, §GOW8B-CHAOS-01). Las comprobaciones pendientes están consolidadas en [`docs/pendientes-de-validacion-humana.md`](pendientes-de-validacion-humana.md).

#### REAPERTURA (2026-10-20) — hallazgo por validación de la usuaria con teclado y vista propios

**Estado: `GOW8B-CHAOS-01` REABIERTA** (la aprobación de 2026-10-17 queda como historial del modelo de colisión, no como validación de la identidad visual del arma).

**Hallazgo (reporte directo de la usuaria al mirar el juego):** *"no existen cadenas, solo golpes con una espada en mano"*.

**Verificación del hallazgo (lectura de código, `git` sin ediciones):**

1. `src/main.ts` **no dibuja el arma**. El `grep` de `add.sprite|add.graphics|add.line|add.polygon` en la escena devuelve **solo** el fondo (`add.image` del Egeo, l.63) y los rectángulos de debug (`attackHitboxRect`, l.125-134; `targetRects`, l.167). El único elemento asociado al golpe en pantalla es un **rectángulo semitransparente** (`hitboxAlpha`) usado como *overlay* de depuración.
2. `scripts/gen-kratos-anim.py` l.184-186: cuando una pose de ataque lleva `blade`, dibuja **una sola línea de 3 px de grosor** desde el codo hasta un punto a 24 px (`limb(d, near_arm[2], tip, 3, DARK)`). No hay cadenas, no hay hojas de las Cuchillas, no hay arco barrido. Lo que la usuaria percibe como "espada en mano" es **el brazo extendido dibujado rígido**, no un arma.
3. Por tanto **el objetivo declarado de la etapa no se cumplió**: "dar identidad al arma —Cuchillas del Caos— ... Es la identidad del arma de *God of War*, no un adorno". Se modeló la **mecánica** (arco, alcance, derivación de la envolvente) y **no se implementó su representación visual**.

**Falso positivo de la auditoría (causa raíz del cierre en falso):** los criterios de evidencia de esta etapa (puntos 2, 3 y 5) miden **geometría de colisión** —cobertura por cadena, `nearX`/`farX`/`topY`/`bottomY`, determinismo por checksum— con precisión decimal, pero **ningún criterio exigió ni midió un solo píxel renderizado**. La auditoría verificó que el modelo matemático era correcto y **llamó a eso "identidad del arma"**. Es la misma familia de error que la rodada congelada: validar el dato y no lo que se ve (ver `docs/aprendizajes-del-proceso.md`).

**No es arte fino.** La observación (b) de la auditoría original —la envolvente vertical llega a ~65.7 px con un jugador de 59 px, **por encima de la cabeza**— deja de ser "observación no bloqueante" y pasa a ser **síntoma del mismo defecto**: la geometría se diseñó sin mirar el resultado en pantalla.

**Alcance de la corrección (a planificar antes de editar, con revisión del auditor que reportó):**

1. **Implementar la representación visual** de las Cuchillas del Caos: cadenas desde `gripOffsetY` hasta la hoja, y la hoja recorriendo el arco ya modelado, leyendo `PLAYER.weapon` y los `arc` de `CONFIG` (sin literales nuevos dispersos).
2. **Revisar la envolvente vertical** a la luz de lo visible: si el arco barre por encima de la cabeza en pantalla, ajustar el diseño del arco o justificarlo explícitamente.
3. **Reparar las poses de ataque** de `kratos-attack.png` para que **no** dibujen el brazo como si fuera un arma rígida; el arma debe venir de la capa nueva, no de una extremidad.
4. **Proteger lo aprobado**: mecánica de colisión, cobertura, determinismo, cinco bloqueos del combo, movimiento/salto/rodada, `tsc`/`build` en 0, `__GOW8B` ausente, sin dependencias nuevas.
5. **Evidencia de cierre con píxeles, no solo con números**: medir en navegador el render del arma (presencia y recorrido del arma en el canvas, no solo la caja de colisión).

**Origen:** [`docs/pendientes-de-validacion-humana.md`](pendientes-de-validacion-humana.md) referencia #3 (§GOW8B-CHAOS-01).

#### CIERRE (2026-10-21) — correcciones aplicadas y reauditadas

**Estado: `GOW8B-CHAOS-01` — APROBADA CON OBSERVACIONES** (reauditoría independiente de solo lectura, subagente distinto del implementador). El arma **existe visualmente** y su render es coherente.

**Implementado:** capa de render del arma en `src/main.ts` (rectángulos reutilizados, cadenas de segmentos alineados a píxel entero, hoja centrada en el centro de la hoja y orientada por el ángulo del arco, `weaponDepth = 3`, visible solo en fase `active`); `bladePoseForTick` pura en `src/sim/attack.ts` con la aritmética extraída de `computeAttackHitbox` sin alterar expresiones; `playerAttackParams()` en `src/sim/world.ts`; parámetros visuales en `src/config.ts`; `scripts/gen-kratos-anim.py` sin el bloque `blade` que simulaba un arma con el brazo.

**Planes y compuertas:**
- `docs/planes/CHAOS-01-reapertura.md` — plan aprobado por auditor (APROBADO CON CAMBIOS, 10 puntos) y por la usuaria.
- `docs/planes/CHAOS-01-correccion-rotacion.md` — plan de corrección aprobado por el auditor que reportó.

**Defectos encontrados por la reauditoría y corregidos:**
1. **La hoja giraba al revés que la cadena** (signo invertido en `src/main.ts:227`). Causa raíz: el ángulo del arco se mide con `sin` positivo = arriba (Y de pantalla negativo) y la rotación de Phaser es positiva = horario (Y de pantalla positivo) — convenciones con el eje Y invertido. Corregido a `-angleRad · sign(facing)`: Δángulo medido **0.00° analítico / ≤ 0.70° en píxeles**, contra hasta **87.95°** antes.
2. **La cota declarada de `chain0` no tenía margen** (40 px para un pico real de 39.58 medido sobre el primer tick; el pico verdadero del arco ascendente es 39.58 y el primer tick es el más bajo). Corregido a **≤ 45 px** (≥ 5 px de margen) sin tocar geometría.
3. **Cifra documental errónea:** `kratos-attack.png` tiene **3 cuadros**, no 4 (291 px / 97 px). Corregidas **solo** las dos líneas que lo afirmaban (`pendientes-de-validacion-humana.md:42`, `verificacion.md:472`); las referencias a los **4 cuadros de `kratos-roll.png`** quedaron intactas.

**Evidencia medida (instrumentos reproducibles):**
- **El arma existe:** con fase `active`, píxeles de cadena (26-27) y hoja (52-54) presentes; con fase `none`, **cero**. Colores únicos frente a los 12 ya presentes en `CONFIG.presentation`.
- **La hoja recorre el arco:** `bladeCenterY` avanza monotónicamente (238→235→230→225 en `chain0`).
- **La cadena une agarre y hoja:** rects contiguos, desviación máxima 0.68 px.
- **Cota vertical (pico real, todos los ticks activos):** `chain0` 39.58 ≤ 45; `chain1` 56.14 ≤ 60; `chain2` 65.77 ≤ 70. Idéntico en `facing = ±1`.
- **Sin regresión:** equivalencia del refactor con **tolerancia 0** (0 diffs en rejilla de 1248 puntos); cobertura `chain0` ≥8 / `chain1` ≥9 / `chain2` ≥14, sin impacto ≤7; determinismo idéntico; ROLL-01 intacto (`ROLL_TICKS=20`, `rollSpeed=260`, rotación de rodada, fix de `stopLoop()`); arte idle/run/air/roll idéntico por SHA-256.
- **Shell:** `tsc` exit 0, `build` exit 0, `__GOW8B` ausente de `dist/`, sin dependencias nuevas, consola sin errores.

**Observaciones no bloqueantes:** (a) el rectángulo de debug del hitbox (`attackHitboxRect`) **se dibuja sin guarda `import.meta.env.DEV`** y en el juego real la hoja queda **dentro** de él, teñida (`255,181,151`); **sin decisión de la usuaria** — el orquestador propuso dejarlo como está por ahora y quedó como deuda abierta (HC-1); (b) la confirmación **estética** del arte del arma sigue siendo deuda humana.

## Método de verificación para tareas futuras

Antes de implementar cada tarea, el orquestador define una sola tarea activa, superficies y aceptación. El implementador prueba los criterios aplicables; un auditor distinto revisa en solo lectura y repite una regresión breve de funciones ya aprobadas. Se registran fallos, limitaciones y aprendizaje agnóstico. Una tarea parcial o fallida no habilita la siguiente.

- **Capturas visuales** permiten revisar apariencia, encuadre, contraste y el frame visible; no demuestran por sí solas el estado interno, los controles ni el timing completo.
- **Snapshots o métricas DEV** pueden demostrar estado serializable y frame controlado; no prueban lectura visual ni una partida con controles normales.
- **Controles normales** se prueban en navegador con entradas reales para evaluar que la acción llega al juego y la respuesta es jugable. Los eventos sintéticos deben etiquetarse como sintéticos; no equivalen a teclado físico ni a sensación humana.
- Los pasos y escenarios controlados pueden complementar la reproducción de bordes y estados, pero no sustituyen un recorrido de juego con controles normales.
- Cuando aplique, la comprobación de implementación incluye navegador, captura de la condición, consola, auditor independiente y regresión breve. La compilación o el typecheck no sustituyen la prueba funcional.

`GOW8B-VIS-01`, `GOW8B-KRA-01`, `GOW8B-ENV-01`, `GOW8B-CMP-01`, `GOW8B-DEV-01`, `GOW8B-MOVE-01` y `GOW8B-RES-01` están aprobadas por auditoría. `GOW8B-CMP-01` cerró con la verificación visual humana diferida y no bloqueante. La etapa **6.5 `GOW8B-RES-01`** (migración a 480×270 e integración de assets) quedó **aprobada** el 2026-10-15 tras auditoría independiente. La etapa **7 `GOW8B-ANIM-01`** (animación de carrera provisional) quedó **aprobada** el 2026-10-15 tras auditoría independiente de solo lectura. La etapa **8 `GOW8B-JUMP-01`** (salto y plataformas) quedó **aprobada** el 2026-10-15 tras auditoría independiente de solo lectura. La etapa **9 `GOW8B-LIGHT-01`** (ataque ligero) quedó **aprobada** el 2026-10-15 tras auditoría independiente de solo lectura. La etapa **10 `GOW8B-COMBO-01`** (combo ligero) quedó **aprobada** el 2026-10-16 tras auditoría independiente de solo lectura. La etapa **10.5 `GOW8B-KRA-02`** (arte definitivo de animación de Kratos) se autorizó (D-21) y se **implementó e integró** el 2026-10-16 (hojas idle/carrera/aire/ataque, `PROVISIONAL_ART = false`, `CONFIG.player.run.frames = 6`, desajuste 6-vs-4 **resuelto**), quedando **aprobada** tras auditoría independiente de solo lectura (2026-10-16); ver «Estado de implementación (2026-10-16)». Con esto, las etapas 1–10.5 están **aprobadas**, más las etapas **`GOW8B-SCALE-01`** (Orden 1), **`GOW8B-DJUMP-01`** (Orden 2), **`GOW8B-ROLL-01`** (Orden 3) y **`GOW8B-CHAOS-01`** (Orden 4) el 2026-10-17; las etapas numeradas 11–34 siguen pendientes de autorización. La etapa **`GOW8B-ROLL-01`** quedó **reabierta** por el hallazgo bloqueante **H-ROLL-1** (i-frames que duraban el doble y sobrevivían a la rodada) y se **cerró aprobada** ese mismo día, tras corregirla por la compuerta de plan y re-auditarla con un auditor distinto.

## Registro de auditorías

### `GOW8B-ROLL-01` — rodada con i-frames (2026-10-17): **APROBADA tras corregir un hallazgo bloqueante**

Historia completa, porque el cierre falló una vez y conviene que quede escrito. La auditoría de esta etapa cerró como **PARCIAL** (sin hallazgos bloqueantes declarados) señalando la zona de `invulTicks` en su hallazgo N1; el orquestador la marcó «Aprobada» **sin resolver ese hallazgo** — **error de cierre**. La **verificación propia del orquestador** (simulación directa sobre `World`, escenario `movement`) midió que la invulnerabilidad duraba **29 ticks (483 ms)** cuando la rodada dura **14 ticks (233 ms)** y `CONFIG.player.dodge.invulMs` es **250 ms**: **15 ticks (250 ms) de i-frames gratis con la animación ya terminada**, el doble de lo configurado. Causa raíz en `src/sim/roll.ts:28-46`: `stepRoll` incrementaba `rollTicks` en la fase activa pero **nunca decrementaba `invulTicks`**, y el `if` de las líneas 37-40 estaba **vacío**; el contador recién bajaba cuando la rodada terminaba. Contradecía el comentario de `src/sim/types.ts:57-58`. La etapa se **reabrió** y se aplicó la **compuerta**: el auditor que reportó el hallazgo aprobó el plan en solo lectura → **un único implementador** movió el decremento a la cabecera de `stepRoll` (una vez por tick, toda fase) y borró el `if` vacío, tocando **solo `src/sim/roll.ts`** → **un auditor distinto** la re-auditó con veredicto **APROBADA** (9/9 puntos OK, sin bloqueantes). Efecto neto: **29 ticks → 14 ticks** de i-frames, sin sobrevivir a la rodada, con cobertura exacta y **todo lo demás byte-idéntico** descontando `invulTicks`. Evidencia completa y observaciones no bloqueantes para el Bloque 4 en §GOW8B-ROLL-01; lección de proceso en `docs/aprendizajes-del-proceso.md`.

### `GOW8B-CHAOS-01` — Cuchillas del Caos (2026-10-17): **aprobada**

Auditoría independiente de solo lectura por un subagente distinto del implementador (OpenCode; simulación pura bundleada con esbuild fuera del repo + Chrome DevTools MCP en el puerto propio 5191, sin tocar 5173/5175). **APROBADA sin hallazgos bloqueantes**, pese a que el modelo de golpe cambió de caja a arco barrido: contacto único por objetivo y `attackHits` reiniciado por golpe, hitbox solo en `active`, encadenado por flanco, salto bloqueado durante todo el combo, rodada bloquea el ataque, respuesta 5/3/3 ticks, límites y ápice intactos, y **prueba de mutación** que demuestra que el arco no está en la ruta de movimiento (trazas de movimiento/salto/doble salto/rodada idénticas byte a byte). Envolvente derivada y verificada en ejecución (`maxReach 49`, `minReach 13.943`, `bandHeight 71.709`). Observaciones no bloqueantes: pérdida de contacto a dx≤7 (`minReach` 6→13.94, no rompe LIGHT-01), envolvente vertical 16→71.71 px, y **criterios de aceptación que no estaban escritos en el repositorio antes de implementar**. Evidencia completa en §GOW8B-CHAOS-01.

### `GOW8B-DJUMP-01` — doble salto (2026-10-17): **aprobada**

Auditoría independiente de solo lectura por un subagente distinto del implementador. **APROBADA**: el segundo impulso exige **flanco nuevo** (mantener la tecla da exactamente la misma altura y el mismo checksum que una pulsación simple), la **tercera** pulsación se rechaza (mismo checksum que la segunda), el ápice del salto simple sigue en **69.0556** —idéntico a la referencia de `SCALE-01`, luego sin regresión—, el doble salto alcanza **120.3889**, y el determinismo es estable (mismo plan ×3 → mismo checksum). El informe del auditor llegó truncado al transcript del orquestador, así que las cifras registradas en §GOW8B-DJUMP-01 son la **re-medición del orquestador**.

### `GOW8B-SCALE-01` — escala y silueta de referencia (2026-10-17): **aprobada**

Auditoría independiente de solo lectura por un subagente distinto del implementador (OpenCode, `big-pickle`; Node + esbuild para la simulación pura y Chrome DevTools MCP por el navegador en el puerto 5199, sin tocar 5173/5175). **APROBADA** sin hallazgos bloqueantes: prueba de **mutación** que demuestra que las métricas se derivan (y no son literales), replicación del salto real (`apexHeight 69.056 @ tick 22`, aire 45 t, alcance 105), `src/scale.ts` puro, determinismo 8/8, arte por hash sin cambios, `__GOW8B` y símbolos del overlay ausentes del bundle, navegador con 2339 px de referencia y checksum invariante al alternar el overlay, `git status` idéntico (el auditor no escribió nada) y servidores detenidos. Evidencia completa en §GOW8B-SCALE-01.

Lo que sigue conserva los resultados del prototipo anterior. Sus estados de «aprobada», «activa» o «pendiente» describen únicamente el momento histórico registrado; ninguno es una etapa activa del ciclo actual ni valida el shell neutral. Sus estados de «aprobada», «activa» o «pendiente» describen únicamente el momento histórico registrado; ninguno es una etapa activa del ciclo actual ni valida el shell neutral.

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

## GOW8B-ROLL-ART

**Estado:** Implementada y verificada mecánicamente en navegador (Chrome DevTools MCP, 2026-10-18/19); **auditada y cerrada** (APROBADA CON OBSERVACIONES, 2ª auditoría sobre `a136cb7`); **percepción visual pendiente de validación humana**. Arte **provisional de 4 cuadros distintos**, generado por `gen-kratos-anim.py` y registrado en `ASSETS.characters`. Mecánica H-ROLL-1 blindada, con el deslizamiento posterior corregido (`GOW8B-ROLL-SLIDE-FIX`) y las constantes de duración limpiadas a fuente única (`GOW8B-ROLL-CLEANUP`). Duración medida: **14 ticks activos (233 ms)** de rodada, con `invulTicks 14..1` sin sobrevivir; `ROLL_TICKS`/`ROLL_INVUL_TICKS` declaran `15` (250 ms, fuente de verdad única de la duración) y el desfase declarado-vs-observado está explicado en la nota de conteo (no es defecto ni se corrige). Desplazamiento medido: **65.33 px** con `vx` constante `280`, sin arrastre tras el cierre.

### Objetivo
Hacer que la rodada se lea como **voltereta lateral**, no como *dash*. Sin modificar mecánica aprobada: duration 250ms, invul 250ms, i-frames 15 ticks (cubren la duración, no sobreviven), terrestre, flanco nuevo, bloquea ataque/salto, vx~280*dir.

### Cambios (alcance mínimo)
- Constantes explícitas: `ROLL_TICKS=15`, `ROLL_DURATION_MS=250`, `ROLL_INVUL_TICKS=15`, `ROLL_INVUL_MS=250`.
- Nuevo spritesheet: `public/assets/characters/kratos-roll.png` (**4 frames**, 97×59, lateral, provisional) generado por `scripts/gen-kratos-anim.py` (`ROLL`), no dibujado a mano.
- Manifest: `ROLL_KEY`, registro del spritesheet **en `ASSETS.characters`**.
- `src/main.ts`: preload/animación roll (loop=false, repeat=0, frameRate = frames/(15/60) = 16). Durante `rollPhase !== 'none'`, fuerza `ROLL_KEY` con facing (prioridad roll>ataque). Al salir, restaura idle/run según velocidad+grounded+facing.

### Arte de la rodada: cómo se generó (trazabilidad)

Los assets no se dibujan a mano: se **generan de forma procedural y determinista** con `scripts/gen-kratos-anim.py` (decisión **D-21**). El script rasteriza un esqueleto articulado sobre la rejilla 97×59 con los pies anclados, paleta de 6 colores heredada de `kratos-neutral.png`, y la verifica al cargar (`assert set(cols) == set(PALETTE)`).

**Reproducibilidad comprobada:** volver a ejecutar el script produce **byte-idénticos** `kratos-idle.png`, `kratos-air.png` y `kratos-attack.png` respecto a los archivos ya en disco. Eso confirma que lo que está en el repositorio **proviene de ese generador** y no de una edición manual posterior.

| Hoja | Frames | Generada por | Estado en Git |
|---|---|---|---|
| `kratos-neutral.png` | 1 | manual / no generada | **rastreada** |
| `kratos-run.png` | 6 | `gen-run-frames.py` → luego `gen-kratos-anim.py` | **rastreada** (actualizada a 6 frames en `910cfa1`) |
| `kratos-idle.png` | 2 | `gen-kratos-anim.py` (`IDLE`) | **rastreada** (`d91b6ac`) |
| `kratos-air.png` | 2 | `gen-kratos-anim.py` (`AIR`) | **rastreada** (`d91b6ac`) |
| `kratos-attack.png` | 3 | `gen-kratos-anim.py` (`ATTACK`) | **rastreada** (`d91b6ac`) |
| `kratos-roll.png` | **4** | `gen-kratos-anim.py` (`ROLL`) | **rastreada** (`d91b6ac`) |

**Trazabilidad (antes deuda, hoy resuelta):** `scripts/gen-kratos-anim.py` y las hojas `idle`/`air`/`attack`/`roll` **están rastreadas en Git** desde `d91b6ac`, y `kratos-run.png` se actualizó a la versión de 6 frames en `910cfa1`. La cadena generador→salida es **reproducible y versionada** (verificado: re-ejecutar `gen-kratos-anim.py` reproduce los 6 PNG byte-idénticos y deja el árbol limpio).

> **Nota de auditoría (2026-10-19):** hasta la corrección `GOW8B-ROLL-CLEANUP` esta tabla era incorrecta — declaraba `idle`/`air`/`attack`/`roll` «sin rastrear» y `kratos-run` «4 frames», contradiciendo a los propios commits que documentaba. La verificación por hash cubría archivos que Git **sí** seguía.

**Mecánica de la rodada en el generador:** `draw_pose` acepta una clave opcional `tuck` (0 → de pie, 1 → bola) que aplica una envolvente de *squash* (escala 1 → 0.58) y descenso (0 → 3 px) a **todos** los puntos calculados. Las poses existentes no pasan `tuck`, así que reciben factor 1.0 y **no cambian**. Los 4 cuadros son: `flexión` → `tuck` → `bola cerrada` → `salida`, con siluetas progresivamente encogidas (749 → 392 → 225 → 497 px opacos, 53 → 22 → 15 → 40 px de alto). **Los 4 cuadros son distintos entre sí** (a diferencia del placeholder anterior, cuyos 3 cuadros eran pixel-idénticos).

### Criterios de aceptación (binarios, teclado real)
1. **Lectura visual**: A/D+Shift → voltereta lateral (frames roll), NO dash lateral.
2. **Sincronización**: clip ~250ms, último frame visible hasta fin. Sin desincronización.
3. **Dirección**: facing fijo durante roll, lateralidad correcta (izq/der).
4. **Prioridad**: ataque durante roll → sigue roll completo, no muestra ataque.
5. **Mecánica intacta (H-ROLL-1 blindado)**: 15/15 ticks, i-frames cubren rodada, no sobreviven. Terrestre, flanco nuevo, bloquea ataque, vx ~280*dir. `src/sim/roll.ts` cambió **solo** para atar la duración a `ROLL_TICKS`/`ROLL_INVUL_TICKS` (`14ad7e9`) y para devolver el control al cerrar (`a136cb7`); sin cambios en `movement.ts`, `vertical.ts`, `attack.ts`.
6. **Restauración**: al salir → idle (sin movimiento) o run (corriendo) según velocidad, facing correcto, sin pop.
7. **Casos borde**: mantener Shift no reinicia; solo terrestre; facing respeta entrada inicial.
8. **Integración**: `tsc --noEmit` y `pnpm build` OK; `__GOW8B` ausente en `dist/`; sin dependencias nuevas; arte provisional etiquetado.
9. **Aceptación usuario**: validación con teclado real (puerto propio).

**Entrega:** cambios puramente visuales. Mecánica no modificada.

### Verificación del orquestador en navegador (2026-10-18/19) — Chrome DevTools MCP

Herramienta: **Chrome DevTools MCP**, servidor de desarrollo propio en el **puerto 5193** (`pnpm dev --port 5193 --strictPort`). Los servidores del usuario (5173/5175) **no se tocaron**. `localhost:5193` respondió HTTP 200 y el canvas se midió en **480×270** internos con presentación CSS de **960×540**.

**Dos defectos reales encontrados y corregidos durante la verificación** (la verificación encontró lo que el typecheck no):

1. **Bucle de juego congelado por una excepción.** `Uncaught TypeError: Cannot read properties of undefined (reading 'duration')` se lanzaba dentro de `update()`; Phaser **no continúa el bucle** después de un throw, así que el frame de simulación quedaba **clavado** (medido: `frame` inmóvil en 351 durante ~880 ms con la tecla pulsada). Es la causa directa del síntoma que reportó el usuario, «solo se pausa». Reproducido por primera vez en la consola del puerto 5193 con `list_console_messages`; el error se registró incluso después de recarga (`msgid=6`).
2. **Animación creada sin frames válidos.** `createRollAnimation()` corría en `create()` cuando la textura `kratos-roll` **todavía no estaba cargada**. `texture.frameTotal` devuelve **1** (el frame `__BASE`) cuando la textura no existe, no 0; con `generateFrameNumbers(start:0, end:frameTotal-1)` se generaba un frame **sin `duration`**, y `applyAnimation` reventaba al leerla. Además `kratos-roll` **no estaba registrado** en `ASSETS.characters` (`src/assets/manifest.ts`), por lo que la textura nunca se cargaba: consola con `Texture "kratos-roll" not found` (`msgid=4`). Se añadió la guarda `textures.exists(ROLL_KEY)`/`frameTotal <= 0` y la rama de animación ahora exige `anims.exists(ROLL_KEY)` para degradar sin crashear.

**Medición en vivo con el bucle a 60 fps** (`metrics().fps = 60.0`, `frameDeltaMs = 16.67`, teclas **sintéticas** vía `KeyboardEvent` inyectado, no teclado físico):

| Observación | Resultado |
|---|---|
| `rollTicks` recorridos | `1..14` (14 valores, `maxTick 14`) |
| `invulTicks` durante la rodada | `14..1`, lockstep con la rodada |
| `invulTicks` después de la rodada | **0** (`survivals = 0`) |
| Desplazamiento | `x 280.8 → 341.5` (~61 px en la ventana muestreada; `vx = ±280`) |
| `facing` bloqueado | izquierda → `facing = -1`, `vx = -280` |
| Rodada aérea | rechazada (`grounded:false` → `rollPhase:none`, `invul:0`) |
| Mantener `SHIFT` | no reinicia (`active/invul 11` → `none/invul 0` tras 361 ms) |
| Ataque durante la rodada | `rollPhase:active` ×14, `attackPhase:none` ×0 de ataque (prioridad roll>ataque) |
| Regreso a carrera | `facing:-1`, `vx:-140`, `rollPhase:none` |
| Determinismo | misma traza ×2 → `3c758954` idéntico |
| Consola tras la corrección | solo el **404 preexistente de `favicon.ico`** |

`curl` directo confirmó `kratos-roll.png` y `kratos-idle.png` en **HTTP 200**; los 404 de la consola no apuntan al spritesheet.

**Shell:** `npx tsc --noEmit` exit 0; `pnpm build` exit 0; `grep __GOW8B dist` = **0**; `package.json`/`pnpm-lock.yaml` sin dependencias nuevas.

**Fuente de verdad de la duración (atada 2026-10-19):** `src/sim/roll.ts` ya **no** deriva los ticks de un `durationMs` con `Math.round`. Importa `ROLL_TICKS`/`ROLL_INVUL_TICKS` de `src/config.ts` y los usa directamente. Motivo: la conversión `ms → ticks` con redondeo produce una **escalera** (`round(233×60/1000) = 14` pero `round(242×60/1000) = 15`), de modo que un parámetro que parece fino salta **un tick entero** de simulación. A `tickRate` fijo el tick es la fuente de verdad y los ms son la vista derivada. Efecto: `ROLL_TICKS` dejó de ser una constante decorativa (antes nadie la leía en la simulación) y ahora la consumen la duración (`roll.ts`) y el `frameRate` del clip (`main.ts`), de modo que cambiar la constante **sí cambia el juego**. Tras `GOW8B-ROLL-CLEANUP` estas dos constantes son la **fuente única** de la duración: ya no hay campos `durationMs`/`invulMs` (ni en `dodge` ni en `CONFIG`) que puedan divergir.

**Validación en navegador del atado (2026-10-19, Chrome DevTools MCP, puerto 5193):** mecánica **idéntica** al estado previo, mismo **checksum `86192933`** para la misma traza. `rollTicks 1..14`, `invulTicks 14..1`, `activeTicks 14`, `vx 280` constante, **65.33 px** de desplazamiento, **0 supervivencias**. Sin excepciones y el frame sigue avanzando (bucle a 60 fps, `frameDeltaMs 16.67`; solo el 404 preexistente de `favicon.ico`). Regresiones re-verificadas en la misma sesión: rodada aérea rechazada (`grounded:false` → `roll:none, invul:0`); ataque bloqueado durante la rodada (**0** cuadros de ataque, `attackPhase:none` al salir); mantener `SHIFT` no reinicia (una sola rodada, ticks 2..14 sin repeticiones); determinismo (misma traza → `2e21a7b4` dos veces); doble salto (`jumpsUsed` 2, ápice `y 160.8`); combo encadenado (cadena 0 → 1 con la ventana `active`/`recovery` respetada, verificado tick a tick).

**Defecto encontrado y corregido: deslizamiento posterior a la rodada (`GOW8B-ROLL-SLIDE-FIX`, 2026-10-19).** La auditoría de solo lectura detectó una inconsistencia en la cifra de desplazamiento que, al reproducirla, destapó un defecto real. **Síntoma medido:** la rodada duraba 14 ticks activos, pero el jugador **seguía moviéndose después de cerrar** (`x` pasaba de `305.33` en el último tick activo a `309.54`, `313.29`, `316.58`…), frenando de `vx 280` → `252.5` → `225` → `197.5`. Esos ticks de arrastre **no tenían i-frames** (`invul = 0`) ni animación de rodada: el personaje patinaba en estado `idle`/`run`. **Segundo efecto, peor:** si el jugador **mantenía la dirección apretada**, la rodada lo **frenaba** (280 → 170) en vez de dejarlo correr — pedía velocidad y el juego se la quitaba. **Causa:** `stepRoll()` corre **antes** que `stepHorizontal()`, y es `stepRoll` quien pone `rollPhase = 'none'`; en ese tick `nowRolling` ya es `false`, así que `stepHorizontal` corría **desbloqueado** con el `vx = 280` heredado y solo lo frenaba parcialmente. **Corrección (`src/sim/roll.ts`):** al cerrar la rodada, además de `rollPhase = 'none'` y `rollTicks = 0`, poner `entity.vx = 0`. La rodada **devuelve el control** en vez de dejar su impulso. **Descartada la alternativa** de capturar `nowRolling` antes de `stepRoll`: simulada, **no eliminaba el arrastre, lo alargaba un tick** (desplazamiento 76.58 → 77.96 px) por mantener el lock un tick extra.

**Verificación de la corrección (headless y navegador, mismo checksum `94f6eb68`):** el tick de cierre **no mueve `x`** (`moved = 0`); desplazamiento **65.33 px** exactos (`x 240 → 305.33`); con la dirección apretada al cerrar el `vx` **crece desde 0** (17.5 → 35 → 52.5 → 70), es decir el jugador retoma el control; `rollTicks 1..14` / `invulTicks 14..1` / **0 supervivencias** sin cambios; rodada contra la pared sin cambios (`vx = 0`, `x = 431.5`, clamp de límite correcto). Regresiones verdes: rechazo aéreo, ataque bloqueado (0 cuadros), determinismo (`94f6eb68` ×2), límite derecho `431.5`, doble salto (`jumpsUsed` 2). Consola limpia.

**Corrección de una medición previa mal expresada:** el informe anterior afirmaba «desplazamiento 65.33 px» sin aclarar la ventana medida. Son **dos cifras reales de ventanas distintas**: **60.67 px** es el desplazamiento entre el **primer y el último tick estrictamente activos** (tick 2 → 14), y **65.33 px** es el recorrido **total de la rodada** medida desde la posición inicial hasta el último tick activo (tick 1 → 14). Tras `GOW8B-ROLL-SLIDE-FIX` el arrastre posterior ya no existe, así que `65.33 px` es el desplazamiento íntegro de la rodada. La confusión anterior provenía de medir en navegador con un poll del RAF que capturaba el tick de cierre.

**Limitaciones declaradas:**
- Las entradas son **sintéticas**. El detector real es `InputManager.poll()` (`Key.isDown`), que **sí** procesa eventos inyectados, pero esto **no equivale a teclado físico ni a sensación humana**.
- **La calidad estética del arte de 4 cuadros no está evaluada.** Se verificó que los cuadros **difieren** entre sí (medido por silueta y colores), no que la rodada *se lea bien*. Sigue siendo provisional.
- `createRollAnimation` **retorna sin crear la animación** si la textura no está cargada; la rodada caería entonces a la rama `grounded` normal. Es deuda técnica a revisar en la auditoría de esta etapa.
- **`kratos-run.png` (deuda cerrada):** la animación de carrera corre sobre `CONFIG.player.run.frames = 6` y la hoja rastreada es de **6 cuadros** (582×59), actualizada en `910cfa1`; el `gen-run-frames.py` original producía otra de 4 y provocaba el desajuste, hoy resuelto. Ver §GOW8B-KRA-02.

**Regresión breve (misma sesión, teclas sintéticas):** reposo → carrera (`x 240→301.8`, `vx 140`) → salto en el aire (`y 200.3`, `grounded:false`) → aterrizaje en el límite derecho (`x 431.5`, `vx 0`) → ataque (`attackPhase:recovery`) → rodada (`rollPhase:active`) → reposo (`rollPhase:none`, `attackPhase:none`). **Sin excepciones** en toda la secuencia y el frame siguió avanzando (`72 → 214`), es decir, **el bucle no se congela**. Límite derecho `431.5` intacto.

**Verificación del arte de 4 cuadros (2026-10-19, misma sesión, tras registrar en `ASSETS.characters`):** el spritesheet se carga (`HTTP 200`), la animación se crea **sin advertencias** (`Frame "4" not found` resuelta) y la rodada conserva toda su mecánica: `rollTicks 1..14`, **0 supervivencias** de i-frames, **0 cuadros de ataque** durante la rodada, sin excepciones, bucle avanzando (`frame 121`). Orientación por sentido: rodada a la derecha → `facing 1`, `vx 280`; rodada a la izquierda → `facing -1`, `vx -280`; regreso a reposo correcto.

**Defecto encontrado y corregido en el mismo paso:** `texture.frameTotal` **cuenta el frame sintético `__BASE`**. Con 4 cuadros reales devuelve 5, así que `end: frameTotal - 1` pedía el cuadro **4**, inexistente → `Frame "4" not found in texture "kratos-roll"`. Se corrigió a `lastFrame = frameTotal - 2`. **El placeholder anterior de 3 cuadros tenía el mismo defecto** (pedía el cuadro 3, inexistente); no se detectó entonces porque la textura nunca se cargaba. Es la misma clase de error que el crash de `duration`: **confiar en un índice derivado sin verificar contra la textura real**.

**Hallazgo observado y explicado (no bloqueante, no es defecto):** en la regresión breve, iniciar la rodada sobre el **último frame de recuperación del ataque** dejó la rodada **activa pero con `vx = 0`** (la posición no cambió durante los 14 ticks). **Causa verificada:** el ataque terminó contra el **límite derecho** (`x = 431.5`), y en `stepHorizontal` el recorte de límite hace `entity.vx = 0` cuando `x > maxX`. `startRoll` impone `vx = +280`, y en el mismo tick `stepHorizontal` mueve el jugador contra la pared, lo recorta en `431.5` y deja `vx = 0`; los 13 ticks siguientes preservan ese 0 porque el lock no reaplica el impulso. **Es decir: no es «impulso aditivo» ni un defecto de la rodada, es el clamp de límite del mundo funcionando** — no se puede rodar fuera del escenario. El comportamiento es correcto; lo que estaba mal era la lectura del hallazgo. En la verificación de orientación posterior (rodada desde `x = 240`, sin pared) la rodada da `vx 280` y **65.33 px** de desplazamiento completos, lo que confirma el diagnóstico. **Decisión: no se toca código.** Rodar en el lugar contra el borde es aceptable (el i-frame sigue vigente); rechazar la rodada por cercanía al borde se descartó por sentirse rota. Existen **exactamente tres caminos** por los que una rodada puede quedar en `vx = 0`: el cierre de la rodada (`a136cb7`), y los clamps `minX`/`maxX`; no hay un cuarto.

**Edge case documentado y NO corregido (`GOW8B-ROLL-CLEANUP`, 2026-10-19):** una pulsación de `dodge` **exactamente en el tick de cierre** se traga (el flanco se consume sin reiniciar la rodada). **Evidencia (barrido tick a tick, escenario `movement`):** `press tick 14 → rolls started=1 (SWALLOWED)`, `press tick 15 → 1 (SWALLOWED)`, `press tick 16 → 2 (CHAINS)`. **Causa raíz:** `src/sim/world.ts` calcula `rolling = isRolling(player)` (l.146) **antes** de que `stepRoll` (l.154) cierre la fase, así que `!rolling && dodgeEdge` (l.149) es falso en el tick de cierre y `startRoll` no corre; el `dodgeEdge` igual se consume en `this.dodgeHeld = wantsDodge` (l.141). Al tick siguiente ya no hay flanco. **Es preexistente a `a136cb7`** y no afecta a ningún criterio aprobado. **Decisión: no se corrige.** El arreglo exige **cambiar el orden de fases de `World.step()`** (mover `stepRoll` antes del bloque de dodge), lo que mueve una mecánica aprobada y adelanta el encadenado del tick 16 al 15; el defecto es **inobservable en la práctica** (requiere una pulsación con precisión de 16.67 ms, y al fallar la rodada ocurre igual un tick después). El costo de tocar el núcleo de `step()` supera al beneficio. Un consumidor futuro (Bloque 4, con daño) debe conocer esta causa raíz.

**Limpieza de configuración (`GOW8B-ROLL-CLEANUP`, 2026-10-19):** `src/config.ts` declaraba **tres copias** de la duración de la rodada y dos estaban muertas (hallazgo B8 de la auditoría). Se eliminaron `CONFIG.rollTicks`/`rollDurationMs`/`rollInvulTicks`/`rollInvulMs`, `ROLL_DURATION_MS`/`ROLL_INVUL_MS` y `dodge.durationMs`/`invulMs`, **verificado con `grep`: cero consumidores** fuera de `config.ts`. `ROLL_TICKS`/`ROLL_INVUL_TICKS` quedan como **fuente de verdad única** de la duración y `rollSpeed` del impulso. El comentario del off-by-one se consolidó en el docstring de esas constantes. **Prueba de que es solo limpieza:** la traza de rodada devuelve el **mismo checksum `94f6eb68`** antes y después (headless y navegador), y las regresiones de movimiento, salto, doble salto, combo y plataformas conservan sus checksums. `tsc` exit 0, `build` exit 0, `__GOW8B` ausente en `dist`, deps sin cambios. **Corrección al informe previo:** el commit `14ad7e9` afirmaba «elimina la segunda fuente de verdad»; era **exagerado** — eliminó una y quedaban dos muertas hasta esta limpieza.

**Nota de conteo (off-by-one del contador, no defecto):** `stepRoll` **incrementa y comprueba el umbral en el mismo tick**, y `startRoll` fija los contadores en el tick del flanco. Consecuencia medida y verificada: una rodada declarada de **15 ticks** (250 ms) reporta `rollTicks` **1..14** y `invulTicks` **14..1**, es decir **14 ticks activos = 233 ms reales**. El tick que cierra la fase nunca es observable como `rollPhase === 'active'`. **Se conserva `15`** en `ROLL_TICKS`/`ROLL_INVUL_TICKS` (fuente de verdad única de la duración): el i-frame cubre los 14 ticks activos exactamente sin sobrevivirlos (H-ROLL-1) y reducir el valor declarado **acortaría la rodada aprobada en un tick** (se probó: declarar 233 daba 13 ticks / 60.7 px). Se documenta la diferencia declarado-vs-observado en lugar de tocar la física.

### Pendiente de validación humana (NO bloqueante: la etapa ya se cerró y auditó)

1. **Lectura visual** (criterio 1): A/D + `SHIFT` → ¿se lee como **voltereta lateral** y no como dash? Con arte provisional de 4 cuadros (todos distintos, pero sin revisión estética) es esperable que sea **pobre**; el arte final es del Bloque 11.
2. **Sensación real** (criterio 9): duración, sync del clip y transición de salida con teclado físico.
3. **Dirección** (criterio 3): lateralidad percibida en ambos sentidos.

La etapa está **cerrada y auditada** (APROBADA CON OBSERVACIONES) y **verificada mecánicamente**; lo que resta es la **percepción humana**, que la usuaria realizará en su propio navegador. **No bloquea el avance**: si esta revisión detecta un defecto, se corrige por la compuerta normal (plan → corrección → reauditoría). Está consolidada en el **registro central** `docs/pendientes-de-validacion-humana.md`.

## GOW8B-OPTIM-01 — Optimización técnica, tipado, simulación 60 Hz, modularización y bundle (2026-10-21)

**Estado:** **APROBADA** tras auditoría independiente de solo lectura (2026-10-21). Plan maestro y criterios en [`docs/planes/OPTIM-01.md`](planes/OPTIM-01.md).

- **Subagentes y modelos:**
  - **Implementador:** subagente `self` (`f6244a35-018f-4497-8e33-4933aa23bff6`, runtime Antigravity, modelo `inherit` / Gemini 4 Argon Medium).
  - **Auditor independiente (solo lectura):** subagente `self` distinto (`8fc183e0-f1ed-4a09-b266-05f45e20df08`, runtime Antigravity, modelo `inherit` / Gemini 4 Argon Medium).
- **Cambios aplicados (Fases 1 a 5):**
  1. **Fase 1 (Tipado estricto):** eliminados todos los `: any` y `as any` en `src/config.ts`, `src/sim/roll.ts` y `src/sim/world.ts` (`grep -rn ": any\|as any" src/` = **0** coincidencias).
  2. **Fase 2 (Inicialización y métricas $O(1)$):** acotado `simulateDoubleJumpTicks` en `src/scale.ts` a `single.airTimeTicks` (**44 iteraciones** en lugar de 599) y eliminadas las asignaciones de `Set` en `simulateJumpWithImpulses`; `FrameMetrics.avgFrameTimeMs` en `src/metrics.ts` llevado a $O(1)$ mediante acumulador rodante `runningSum`.
  3. **Fase 3 (Cero asignaciones redundantes a 60 Hz):** `InputManager.poll()` agrupa `Key` por `GameAction` en el constructor y devuelve el arreglo activo en orden canónico sin `new Set` ni `.filter()`; *fast-path* en `sortActions` (`src/sim/types.ts`); `peekEntity(id)` y `peekTargets()` en `src/sim/world.ts` para evitar clonar entidades en el bucle de render; `computeAttackHitbox` reutiliza `bladePoseForTick` y se calcula **una sola vez por tick activo** fuera del bucle de objetivos en `src/sim/attack.ts`; *fast-path* en `canonicalString` (`src/sim/checksum.ts`).
  4. **Fase 4 (Modularización de presentación):** extraídos `src/scene/ShellScene.ts` (354 líneas) y `src/entities/WeaponLayer.ts` (86 líneas), reduciendo `src/main.ts` a **49 líneas**; `ShellScene.update()` consulta `player` una sola vez por frame y actualiza `debugText.setText` solo cuando cambia `lastDebugText`.
  5. **Fase 5 (Assets, scripts, HTML y bundle Vite):** retirado `kratos-neutral` de la precarga en `ASSETS.characters` (`src/assets/manifest.ts`, conservando `PLAYER_KEY` y el PNG en disco); eliminado `scripts/gen-run-frames.py`; añadido `<link rel="icon" href="data:," />` en `index.html`; añadido `manualChunks: { phaser: ['phaser'] }` en `vite.config.ts`.
- **Evidencia medida y verificada por el auditor independiente:**
  - **Checksums y determinismo:** `init_empty` = `5ae64ce0`, `init_test` = `c3f1f3dc`, `init_movement` = `09c68ba7`, `init_platforms` = `09c68ba7`, `init_combat` = `67b1fa98`, `combat60` = `9f8ded3f`, `checksumOf(CONFIG.scale)` = `da5b47b6`; 500 ms a 60/30/irregular → `frame = 30` y `checksum = cf5a707f`; `record()`/`replay()` → `d03b07f9`.
  - **Equivalencia numérica:** `maxDiff = 0` en las 24 muestras activas (3 cadenas × 4 ticks × `facing = ±1`) entre `computeAttackHitbox` y la trigonometría previa.
  - **Build y chunks:** `tsc --noEmit` exit 0; `pnpm build` exit 0 con chunk de aplicación de **22.88 kB** (`gzip: 8.00 kB`) y chunk separado `phaser` de `1,481.77 kB` (`gzip: 339.84 kB`); `__GOW8B` = 0 en `dist/`.
  - **Navegador (Chrome Headless + CDP en puerto propio `:5197`, detenido al cerrar):** `consoleErrors: []`, `exceptions: []`, `status404s: []` (desapareció el 404 de `favicon.ico`), `kratosNeutralRequested: false`, `WeaponLayer` oculta en `none` (`chainPixels = 0`) y visible en `active` (`chainPixels = 24`), doble salto, rodada y combo operativos a ~60 fps.
  - **Solo lectura verificada:** `git status --porcelain` idéntico antes y después de la auditoría; `dist/` y `tsconfig.tsbuildinfo` eliminados.

## GOW8B-ART-POLISH-01 — Pulido visual de spritesheets, arma y plataformas (2026-10-21)

**Estado:** **APROBADA** tras auditoría independiente de solo lectura (2026-10-21). Plan y criterios en [`docs/planes/ART-POLISH-01.md`](planes/ART-POLISH-01.md).

- **Subagentes y modelos:**
  - **Implementador:** subagente `self` (`f6244a35-018f-4497-8e33-4933aa23bff6`, runtime Antigravity, modelo `inherit` / Gemini 4 Argon Medium).
  - **Auditor independiente (solo lectura):** subagente `self` distinto (`8fc183e0-f1ed-4a09-b266-05f45e20df08`, runtime Antigravity, modelo `inherit` / Gemini 4 Argon Medium).
- **Cambios aplicados:**
  1. **Spritesheets y hoja de contacto (`scripts/gen-kratos-anim.py`, `public/assets/characters/kratos-{idle,run,air,attack,roll}.png`, `docs/referencias/kratos-anim-contact-sheet.png`):**
     - Rediseñado `draw_pose(pose, neutral)` pasando del maniquí de palitos de ~10 px a la anatomía espartana musculosa en 3/4 lateral coherente con `kratos-neutral.png` (torso heroico en V con pectorales en `HI`/`MID` y sombra dorsal `SHADOW`, tatuaje rojo de Ares en `SHADOW`/`DARK` cruzando ojo, cráneo, hombro y pecho, perilla espartana en mentón, cinturón con hebilla y faldón acampanado `DARK`/`LEATHER` con faja central `SHADOW`/`MID`, brazaletes pesados con eslabones de cadena, grebas y silueta ganchuda de las Cuchillas del Caos en guardia).
     - Añadida `save_contact_sheet` en `scripts/gen-kratos-anim.py` para regenerar automáticamente `docs/referencias/kratos-anim-contact-sheet.png` (`1164×708`).
  2. **Capa visual de las Cuchillas del Caos (`src/entities/WeaponLayer.ts`):**
     - Alternancia de grosor en los 8 eslabones de cadena (`2×3` y `3×2` en `weaponChainColor = 0x9e9e9e`) y adición de guardia/lomo de bronce (`weaponGuardRect` de `5×8 px` en `platformColor = 0x6b4f2a`) en la base de `weaponBladeRect` (`12×6 px` en `weaponBladeColor = 0xfff1c9`), rotando ambos con `-pose.angleRad * (player.facing === -1 ? -1 : 1)`.
  3. **Resolución de la deuda `HC-1` y acabado de plataformas (`src/scene/ShellScene.ts`, `src/config.ts`):**
     - `this.attackHitboxRect` queda condicionado a `Boolean(hitbox && import.meta.env.DEV && isScaleReferenceVisible())`: permanece oculto en juego normal (evitando teñir de naranja/rojo las Cuchillas del Caos) y solo se muestra en DEV cuando se activa el overlay con la tecla `G`.
     - En `redrawPlatforms()`, cada plataforma añade filo superior iluminado de 1 px (`platformHighlightColor: 0x8c673a`), cuerpo (`platformColor: 0x6b4f2a`), borde inferior oscuro de 1 px (`platformEdgeColor: 0x3f2e18`) y juntas verticales de tablones de 1 px cada 32 px.
- **Evidencia medida y verificada por el auditor independiente:**
  - **Invariantes de spritesheets (Python PIL):**
    - `kratos-idle.png`: `(194, 59)`, 2 cuadros únicos, 6 colores exactos de `kratos-neutral.png`, `bboxes = [(9, 3, 91, 59), (8, 3, 91, 59)]` (`bbox[3] == 59` → `bottom_y = 58`). SHA-256: `0dd3aca98e0136b4e14200f1de643cfc0dade1ed45a7eb3ca1fc7b03766d4ffc`.
    - `kratos-run.png`: `(582, 59)`, 6 cuadros únicos, 6 colores exactos, `bbox[3] == 59` en los 6 cuadros. SHA-256: `ccb1c4f40c714c2409655384adc5c814885238e54fc484db0235bb2a5cfa2abd`.
    - `kratos-air.png`: `(194, 59)`, 2 cuadros únicos, 6 colores exactos, `bbox[3] == 59` en ambos cuadros. SHA-256: `f973028166d2187b9c39dd52315b4cd1517be602bb87ad8d0d57dfc4e6dadbc9`.
    - `kratos-attack.png`: `(291, 59)`, 3 cuadros únicos, 6 colores exactos, `bbox[3] == 59` en los 3 cuadros. SHA-256: `80d768494855fb744f8c97dd53a10b538843fbf0afe776282404eb547ab4a6f3`.
    - `kratos-roll.png`: `(388, 59)`, 4 cuadros únicos, 6 colores exactos, `bbox[3] == 59` en los 4 cuadros. SHA-256: `865f0df9418f1c20b7259bf84e4197b116e2de327eba2bfd90bc2d132b041f9a`.
  - **Activos protegidos intactos por SHA-256:**
    - `kratos-neutral.png`: `df52a7fc298e6fd41241f555cef8f4d2dd00a6b81034a333872a55b4f9390c4a`.
    - `egeo-fondo.png`: `8f8b5885de7af96889f24b28338f151ee11acff7d17339b28ea1949755349ee1`.
  - **Inspección visual directa:** verificada con `read_file` sobre `docs/referencias/kratos-anim-contact-sheet.png` (`5e5bfdb62893715a9d3d84946c55c19ba08d15109192dbc8aefe6c1d85269b63`) tanto por el orquestador como por el auditor independiente.
  - **Tipado, build y determinismo:** `grep -rn ": any\|as any" src/` = 0; `tsc --noEmit` exit 0; `pnpm build` exit 0 (`index-D7d-kE6a.js` = `23.10 kB`, `gzip: 8.07 kB`); `__GOW8B` = 0 en `dist/`; los 7 checksums de simulación/escala 100 % idénticos al baseline (`scaleChecksum = da5b47b6`, `init_empty = 5ae64ce0`, `init_test = c3f1f3dc`, `init_movement = 09c68ba7`, `init_platforms = 09c68ba7`, `init_combat = 67b1fa98`, `combat60 = 9f8ded3f`).
  - **Limitación registrada:** el segundo lanzamiento de Chrome headless del auditor fue cancelado por la usuaria; los criterios 2 y 3 quedaron verificados por inspección visual directa de `kratos-anim-contact-sheet.png` y lectura íntegra de `src/config.ts`, `src/entities/WeaponLayer.ts` y `src/scene/ShellScene.ts`. `dist/` y `tsconfig.tsbuildinfo` eliminados.

## GOW8B-ART-POLISH-02 — Voltereta a ras de suelo y barrido encadenado estilo *Betrayal* (2026-10-21/22)

**Estado:** **APROBADA** tras compuerta completa con auditoría visual en navegador real (2026-10-22). Plan y criterios en [`docs/planes/ART-POLISH-02.md`](planes/ART-POLISH-02.md).

- **Subagentes y modelos:**
  - **Implementador:** subagente `self` (`f6244a35-018f-4497-8e33-4933aa23bff6`, runtime Antigravity, modelo `inherit` / Gemini 4 Argon Medium).
  - **Auditor 1 (auditoría visual en navegador → `FALLIDO` + aprobación de plan Rev. 2 en solo lectura):** subagente `self` distinto (`8fc183e0-f1ed-4a09-b266-05f45e20df08`, runtime Antigravity, modelo `inherit` / Gemini 4 Argon Medium).
  - **Re-Auditor 2 (reauditoría visual en navegador en solo lectura → `APROBADO`):** subagente `self` distinto (`c60e5018-90c8-4798-ad8c-9dae85722c11`, runtime Antigravity, modelo `inherit` / Gemini 4 Argon Medium).
- **Historia de la compuerta y hallazgos corregidos:**
  - En la primera iteración se aprobó la voltereta en el suelo (verificada en [`kratos-anim-contact-sheet.png`](referencias/kratos-anim-contact-sheet.png)), pero `WeaponLayer.ts` solo se había revisado leyendo código. Al exigir captura real del `<canvas>` de Phaser durante los 30 ticks del combo (`scratch/browser-combo-audit.png`), el Auditor 1 (`8fc183e0-f1ed-4a09-b266-05f45e20df08`) dictaminó **FALLIDO** con 4 hallazgos visuales concretos:
    - **H1:** en `startup` y `recovery` aparecían **3 cuchillas simultáneas** (2 en las manos del sprite + 1 de `WeaponLayer` saliendo del abdomen/ingle en `(player.x, player.y - 30)`), y en `active` la cadena nacía de la barriga en vez del puño delantero.
    - **H2:** la hoja eran dos rectángulos blancos planos sin contorno oscuro `#1d1415` ni silueta pixel art de Cuchilla del Caos.
    - **H3:** la estela eran 3 ladrillos sueltos separados por huecos vacíos.
    - **H4:** la cadena eran 8 puntos grises desconectados sin contorno.
  - Se redactó el plan Rev. 2 en [`docs/planes/ART-POLISH-02.md`](planes/ART-POLISH-02.md), el Auditor 1 lo aprobó en modo de solo lectura, el Implementador aplicó la corrección verificando la nueva hoja de 30 ticks del navegador (`scratch/browser-combo-audit.png`), y el Re-Auditor 2 (`c60e5018-90c8-4798-ad8c-9dae85722c11`) repitió la captura en Chrome headless (`:5199` / `:9235`, `scratch/re-audit-combo.png`, SHA-256 `523e49bd…`) confirmando el cierre de `H1`–`H4` con veredicto **APROBADO**.
- **Cambios aplicados:**
  1. **Voltereta a ras de suelo sin salirse de pantalla (`src/scene/ShellScene.ts`, `scripts/gen-kratos-anim.py`, `public/assets/characters/kratos-roll.png`):**
     - En `ShellScene.applyAnimation` (rama `rolling`), `player.setRotation(0)` fijo en los 19 ticks activos (eliminando el giro alrededor de `(0.5, 1.0)` en `y = 240` que hundía el sprite hasta `y = 299`).
     - En `scripts/gen-kratos-anim.py`, `draw_roll_pose` dibuja los 4 cuadros de la voltereta sobre el suelo apoyados en `y = 58` (`heights = [38, 28, 29, 42]`, `bboxes = [(21, 21, 71, 59), (28, 31, 64, 59), (28, 30, 68, 59), (20, 17, 80, 59)]`).
  2. **Sincronización mano-cadena, textura pixel art `chaos-blade-tex`, cadena contorneada y estela continua en media luna (`scripts/gen-kratos-anim.py`, `src/scene/ShellScene.ts`, `src/entities/WeaponLayer.ts`):**
     - En `kratos-attack.png`: cuadro `0` (`startup`) con ambas cuchillas armadas atrás (`WeaponLayer` oculta); cuadro `1` (`active` y `recovery` con `attackTicks <= 2`) con antebrazo proyectado al frente, puño en `(CX + 14, 28)` = `(player.x + facing * 14, player.y - 31)` y `bladeN = None` (solo `bladeF` en mano trasera mientras `WeaponLayer` lanza/retrae la cuchilla delantera desde ese mismo puño); cuadro `2` (`recovery` con `attackTicks > 2`) con ambas cuchillas en guardia (`WeaponLayer` oculta). Siempre hay exactamente 2 cuchillas en pantalla.
     - En `WeaponLayer.ts`: textura pixel art `chaos-blade-tex` (`22×13` px con contorno `#1d1415`, guardia `#b94a2c`, acanaladura `#ff8800`, bisel `#d7c6ad`, gancho dorsal y filo `#fff1c9`), cadena de `14` eslabones solapados con borde `0x1d1415` y núcleo `0x9e9e9e` (`weaponChainColor`), y estela en arco de `16` pasos dobles solapados (`#ff5533`/`#ff8800` interior y `#fff1c9` exterior).
- **Evidencia medida y verificada por el Re-Auditor 2 (`c60e5018-90c8-4798-ad8c-9dae85722c11`):**
  - **Navegador real (`:5199` + CDP `:9235`, `scratch/re-audit-combo.png`):** `H1`–`H4` resueltos en los 30 ticks; `isScaleReferenceVisible() === false`; `attackHitboxRect` oculto en los 30 ticks (`HC-1` protegido); `allHiddenAtNone === true`; en `active` se miden simultáneamente en canvas `weaponChainColor` (`22..37 px`/tick) y `weaponBladeColor` (`70..76 px`/tick); en rodada `player.rotation === 0` y avance de cuadros `1 → 2 → 3 → 4`; `consoleErrorsCount = 0`.
  - **Invariantes y SHA-256 de las hojas:**
    - `kratos-idle.png`: `(194, 59)`, 2 cuadros, 6 colores, `bbox[3] == 59`. SHA-256: `0dd3aca98e0136b4e14200f1de643cfc0dade1ed45a7eb3ca1fc7b03766d4ffc`.
    - `kratos-run.png`: `(582, 59)`, 6 cuadros, 6 colores, `bbox[3] == 59`. SHA-256: `deec504191d7a837e921add04679d0897d093db4002fa53e7ca343ee88dd6cbc`.
    - `kratos-air.png`: `(194, 59)`, 2 cuadros, 6 colores, `bbox[3] == 59`. SHA-256: `72b948472e3fb20980d1c198903685b32163dd78e7bf7efcdf01120bd2bed7d4`.
    - `kratos-attack.png`: `(291, 59)`, 3 cuadros, 6 colores, `bbox[3] == 59`, `bboxes = [(8, 4, 69, 59), (14, 3, 72, 59), (15, 4, 91, 59)]`. SHA-256: `0d5cb64bb85437e7fbbf02b0f0c315057cf1a26126e022f8a37d105e3fa61d17`.
    - `kratos-roll.png`: `(388, 59)`, 4 cuadros únicos, 6 colores, `bbox[3] == 59`, `heights = [38, 28, 29, 42]`. SHA-256: `0e8ff06a512a6beccbe8ea34e5988b48a262b9eb408b908aec95c4ad407effeb`.
    - `kratos-neutral.png` (`df52a7fc…`) y `egeo-fondo.png` (`8f8b5885…`) intactos por SHA-256.
  - **Tipado, build y determinismo:** `grep -rn ": any\|as any" src/` = 0; `tsc --noEmit` exit 0; `pnpm build` exit 0 (`index-BlJBRps6.js` = `25.72 kB`, `gzip: 8.91 kB`); `__GOW8B` = 0 en `dist/`; los 7 checksums de simulación/escala 100 % idénticos (`scaleChecksum = da5b47b6`, `init_empty = 5ae64ce0`, `init_test = c3f1f3dc`, `init_movement = 09c68ba7`, `init_platforms = 09c68ba7`, `init_combat = 67b1fa98`, `combat60 = 9f8ded3f`). `dist/` y `tsconfig.tsbuildinfo` eliminados.

## KRATOS-ART-MODEL-01 — Rediseño del modelo anatómico maestro de Kratos en pixel art (2026-10-22)

**Estado:** **APROBADA** tras auditoría independiente de solo lectura (2026-10-22). Plan y criterios en [`docs/planes/KRATOS-ART-MODEL-01.md`](planes/KRATOS-ART-MODEL-01.md). Commit: `33f776f`.

- **Subagentes y modelos:**
  - **Implementador:** subagente `self` (`3f047921-b5ee-44df-a948-2eae9cd8cdd0`, runtime Antigravity, modelo `inherit` / Gemini 4 Argon Medium).
  - **Auditor independiente (solo lectura):** subagente `self` distinto (`01acf36e-053e-4f48-b4d9-de32dea2e091`, runtime Antigravity, modelo `inherit` / Gemini 4 Argon Medium).
- **Cambios aplicados:**
  1. **Generador maestro anatómico (`scripts/gen-kratos-anim.py`):**
     - Subrutinas anatómicas dedicadas: `draw_torso` (torso heroico en V con pectorales, oblicuos y six-pack en 3 tonos de sombra/luz), `draw_head` (perilla espartana puntiaguda en `DARK`, ceño pronunciado, calva atlética y tatuaje de Ares cruzando en `SHADOW`/`DARK`), `draw_bracer` (cadenas del Hades enrolladas en ambos antebrazos con eslabones de 1 px), `draw_skirt` (faldón pteruges con tiras de cuero `DARK`/`LEATHER` y cinturón con broche de bronce), y `draw_greave_and_boot` (grebas con nervadura metálica central).
     - Regeneración de los 6 spritesheets en `public/assets/characters/`: `kratos-idle.png` (2 cuadros), `kratos-run.png` (6 cuadros), `kratos-air.png` (2 cuadros), `kratos-attack.png` (7 cuadros con poses de anticipación y recuperación diferenciadas) y `kratos-roll.png` (4 cuadros).
  2. **Alineación de puntos de anclaje de armas (`src/config.ts`):**
     - Medición y sincronización de las coordenadas de puños (`hands`) para cada pose de ataque en `CONFIG.player.attack.hands`, asegurando que las cadenas dinámicas de `WeaponLayer.ts` nazcan exactamente del centro de los puños esculpidos.
- **Evidencia medida y verificada por el auditor independiente (`01acf36e-053e-4f48-b4d9-de32dea2e091`):**
  - **Invariantes de pixel art (100 % verificadas con script de aserciones PIL):**
    - Todas las hojas son múltiplos exactos de $97 \times 59$ px (`kratos-neutral`: 97×59; `kratos-idle`: 194×59; `kratos-run`: 582×59; `kratos-air`: 194×59; `kratos-attack`: 679×59; `kratos-roll`: 388×59).
    - Paleta estricta de 6 colores (`assert set(colors) == set(PALETTE)`) sin antialiasing ni colores espurios.
    - Anclaje rasante en $y=58$ (`bbox[3] == 59`) en todos los fotogramas.
  - **Build y determinismo:** `tsc --noEmit && pnpm build` exit 0 en 7.08s; `__GOW8B` ausente en `dist/`; `deterministic: true` en todas las ejecuciones CDP; checksum de escala `07429977`, checksum inicial `69c62850`, checksum a 60 ticks `f8185a7c`.
  - **Capturas CDP:** Mosaicos y GIFs actualizados en `scripts/verification/output/` con 0 errores de consola.

## GOW1-LOCO-WEIGHT-01 — Peso cinemático, inercia de giro y compresión elástica de aterrizaje (2026-10-22)

**Estado:** **APROBADA** tras auditoría independiente de solo lectura (2026-10-22). Plan y criterios en [`docs/planes/GOW1-LOCO-WEIGHT-01.md`](planes/GOW1-LOCO-WEIGHT-01.md). Commit: `4d95639`.

- **Subagentes y modelos:**
  - **Implementador:** Subagente orquestador (tras error de autenticación 401 en subagente `51b4b734-69cb-480f-b899-d016460efbfd`, culminación técnica directa con registro explícito).
  - **Auditor independiente (solo lectura):** subagente `self` distinto (`01acf36e-053e-4f48-b4d9-de32dea2e091`, runtime Antigravity, modelo `inherit` / Gemini 4 Argon Medium).
- **Cambios aplicados:**
  1. **Inercia de giro y derrape (*turnaround skid* — `src/sim/movement.ts`, `src/config.ts`):**
     - Detección de inversión de marcha a alta velocidad ($|v_x| \ge \text{maxSpeed} \times 0.6$).
     - Activación de `skidTicks = 6` con frenado reforzado (`BRAKE_SKID = 2200 px/s²`) manteniendo `facing` en el sentido del movimiento previo.
     - Cuadro 6 de derrape clavando talones en `kratos-run.png` ($679 \times 59$ px).
  2. **Compresión elástica de aterrizaje (*landing squash* — `src/sim/vertical.ts`, `src/scene/ShellScene.ts`):**
     - Al tocar tierra con $v_y \ge 180$ px/s, activación de `landingTicks = 3` con deformación de escala $S_x = 1.06, S_y = 0.92$ sobre ancla $(0.5, 1.0)$.
     - Política de cero bloqueo de control: cualquier entrada de salto, esquiva o ataque cancela el squash inmediatamente.
- **Evidencia medida y verificada por el auditor independiente (`01acf36e-053e-4f48-b4d9-de32dea2e091`):**
  - **Medición de derrape (Chrome CDP Caso E):** en $t=15..17$ el personaje derrapa con fotograma 6 activo y desacelera de $v_x = 140$ px/s a 0 antes de invertir la marcha.
  - **Medición de aterrizaje:** tras caída desde $y=138.1$ px ($v_y = 480$ px/s), compresión elástica observada en $t=79..81$ con escala $(1.06, 0.92)$, regresando a $(1.0, 1.0)$ en reposo.
  - **No regresión física:** Salto simple `69.056 px`, doble salto `138.111 px`, rodada `82.33 px` en 19 ticks. `deterministic: true` verificado. 0 errores de consola.

## GOW1-COMBAT-BODY-01 — Compromiso corporal en ataques, avance físico (lunge) y detección continua (2026-10-22)

**Estado:** **APROBADA** tras auditoría independiente de solo lectura (2026-10-22). Plan y criterios en [`docs/planes/GOW1-COMBAT-BODY-01.md`](planes/GOW1-COMBAT-BODY-01.md). Commit: `b68648d`.

- **Subagentes y modelos:**
  - **Implementador:** Subagente orquestador (tras persistencia de falla 401 en subagentes escritores externos, ejecución técnica directa documentada).
  - **Auditor independiente (solo lectura):** subagente `self` distinto (`01acf36e-053e-4f48-b4d9-de32dea2e091`, runtime Antigravity, modelo `inherit` / Gemini 4 Argon Medium).
- **Cambios aplicados:**
  1. **Avance cinemático activo (`lungeVx` — `src/config.ts`, `src/sim/attack.ts`):**
     - Impulso hacia adelante durante la fase `active` en la dirección de ataque: `light_1` (45 px/s, ~3.5 px), `light_2` (55 px/s, ~4.5 px), `light_3` (90 px/s, ~7.5 px), `heavy_slam` (60 px/s, ~5 px) y `plume_of_prometheus` (70 px/s, ~6.5 px).
     - Bloqueo de control horizontal durante el tajo y absorción suave por frenado del suelo en `recovery`.
  2. **Detección continua de impacto (envolvente grip-to-blade — `src/sim/attack.ts`):**
     - Sustitución de la prueba de hitbox puntual en el ápice por el cálculo de la envolvente continua entre el puño (`gripX, gripY`) y la hoja (`bladeCenterX, bladeCenterY`), erradicando puntos ciegos a quemarropa.
  3. **Onda sísmica de impacto en suelo (`src/config.ts`, `src/sim/attack.ts`):**
     - Detección radial `shockRadius: 28 px` para el estallido en superficie de *Plume of Prometheus* y *Heavy Slam*, con `hitstop: 4` ticks y sacudida de cámara `shakePx: 2`.
- **Evidencia medida y verificada por el auditor independiente (`01acf36e-053e-4f48-b4d9-de32dea2e091`):**
  - **Medición de avance cinemático:** avance acumulado medido en navegador tick a tick. Pluma de Prometeo eleva verticalmente al objetivo con $v_y = -223.33$ px/s.
  - **Detección continua probada:** eliminación total de fallos de impacto a corta distancia ($x < 260$ px).
  - **Determinismo y compilación:** `deterministic: true` en todas las ejecuciones CDP; `tsc --noEmit && pnpm build` exit 0 en 6.44s; 0 errores de consola.

## GOW1-COMBOS-EXT-01 — Combos extendidos de PS2, agarre aéreo y ataque en carrera (2026-10-22)

**Estado:** **APROBADA** tras auditoría independiente de solo lectura (2026-10-22). Plan y criterios en [`docs/planes/GOW1-COMBOS-EXT-01.md`](planes/GOW1-COMBOS-EXT-01.md).

- **Subagentes y modelos:**
  - **Implementador:** Subagente orquestador (ejecución técnica directa documentada).
  - **Auditor independiente (solo lectura):** subagente `self` distinto (`01acf36e-053e-4f48-b4d9-de32dea2e091`, runtime Antigravity, modelo `inherit` / Gemini 4 Argon Medium).
- **Cambios aplicados:**
  1. **Nuevos ataques insignia en la configuración (`src/config.ts`, `src/sim/types.ts`):**
     - **`light_4` (`J, J, J, J`):** Cuarto tajo de la cadena ligera con látigo de 98 px de alcance, `lungeVx: 60`, `hitstop: 3` y `knockbackVx: 160`.
     - **`spirit_of_hercules` (`J, J, J, K`):** Remate pesado tras 3 golpes ligeros, con doble barrido horizontal de 105 px, `knockbackVx: 220`, `launchVy: -120`, `lungeVx: 75`, `hitstop: 4` e impacto contra el suelo.
     - **`air_grab` (*Orion's Harpoon* — `L` en el aire):** Agarre aéreo de 120 px de radio que engancha enemigos aéreos y los proyecta contra la cubierta con $v_y = 480$ px/s e impacto sísmico en suelo (`groundImpactTicks: 10`, `shakePx: 2`).
     - **`dash_attack` (*Olympic Slash* — `Shift` $\rightarrow$ `J`):** Tajo bajo rasante ejecutado al salir de la rodada o en sprint a máxima velocidad con inercia hacia adelante (`lungeVx: 110`, radio 88 px).
  2. **Ramificación en simulación y cancelación de esquiva (`src/sim/attack.ts`, `src/sim/world.ts`):**
     - Integración de la máquina de estados en `nextMoveFor` y `beginFromIdle` con resolución mediante buffer de entrada.
     - Cancelación de salida de rodada: si `invulTicks === 0` durante la recuperación de la rodada, una pulsación de ataque transiciona inmediatamente a `dash_attack` sin tiempos muertos.
  3. **Harness y verificación con Chrome CDP (`scripts/verification/capture-combat.mjs`):**
     - Caso F: Ejecución de la cadena extendida `J, J, J, J` (`combo_jjjj`).
     - Caso G: Secuencia *Ascension* aéreo seguido de *Orion's Harpoon* (`ascension_air_harpoon`).
- **Evidencia medida y verificada por el auditor independiente (`01acf36e-053e-4f48-b4d9-de32dea2e091`):**
  - **Casos F y G en navegador en vivo:** `light_4` observado activo en $t=37$; *Ascension* y azote descendente *Orion's Harpoon* observados en $t=27$.
  - **No regresión física:** Salto simple `69.056 px`, doble salto `138.111 px`, rodada `82.33 px` en 19 ticks con 13 de invulnerabilidad. Casos A a E intactos.
  - **Determinismo estricto:** `deterministic: true` en todas las ejecuciones.
  - **Build y consola:** `tsc --noEmit && pnpm build` exit 0 en 6.81s; `__GOW8B` ausente en `dist/`; 0 errores y 0 advertencias de consola.
