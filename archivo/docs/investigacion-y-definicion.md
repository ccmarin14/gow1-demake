# Investigación y definición

> **Estado (2026-10-15):** documento de investigación aprobado por el usuario como tarea documental. Contrasta la definición vigente del proyecto y su plan de etapas con fuentes externas. No autoriza desarrollo ni modifica etapas: toda propuesta que afecte a `verificacion.md`, `decisiones.md` o `adaptacion-narrativa-y-niveles.md` queda como recomendación hasta el visto bueno del usuario.

## 1. Propósito y alcance

- Contrastar **qué es** el proyecto (definición en `README.md`, `decisiones.md`, `verificacion.md`) y **cómo se aborda** (plan de 29 etapas tras esta investigación) con material de estudio de *God of War: Betrayal*, del primer *God of War* de PS2, de técnicas de desarrollo 2D y de verificación de juegos.
- **Fuera de alcance:** monetización, engines ajenos, multiplayer, cambios de dirección (D-03, D-07) y cualquier recurso copiado de los juegos de referencia (D-04).

## 2. Metodología

- Fuentes **primarias** cuando existen: reseñas de la época, guías detalladas, documentación oficial de Phaser, papers y charlas GDC.
- Fuentes **secundarias** (wikis, foros) solo para reconstruir estructura de niveles y controles; se contrastan entre sí.
- Regla de originalidad (D-04): nada de este documento autoriza copiar sprites, audio ni pantallas; todo se traduce a **criterios y lecciones**.
- Cada bloque termina en salidas concretas: tablas de lecciones, checklists o propuestas, no en resúmenes decorativos.

## 3. Bloque A — *God of War: Betrayal* (referencia de diseño)

### A.1 Qué es la referencia

- Side-scroller 2D para móviles J2ME (2007), desarrollado por Javaground + SOE; **10 niveles, 2–4 horas** (Wikipedia/HowLongToBeat). Animación de WayForward, >100 animaciones de Kratos (IGN).
- Estructura de combate: ataque mash (botón 5/OK) con combos de hasta 5 golpes que terminan en *Plume of Prometheus*; ataques aéreos; carrera+ataque; bloqueo y agarre con el botón 2/Down; salto con 8/Up (GameFAQs, guía de the_requiem).
- Economía: orbes rojos mejoran armas (niveles 1–5, costes 1.000–4.000), verdes curan, azules magia; *Gorgon Eyes*/*Phoenix Feathers* amplían medidores (Fandom/MobyGames).
- **Agarres contextuales:** enemigo debilitado muestra un ícono y el jugador ejecuta una secuencia de botones con ventana temporal; las reseñas de la época lo criticaron por lo apretado de ese timing en teclados pequeños (IGN, GamesRadar).
- Interacción ambiental: cajas para cubrirse y aplastar enemigos, palancas, vigas estrechas, columpios; niveles que se extienden en vertical y horizontal (IGN).

### A.2 Lecciones para el proyecto

| # | Lección de Betrayal | Aplicación propuesta |
| --- | --- | --- |
| A-L1 | El sprite pequeño de Kratos fue una crítica explícita ("I wish he was larger") (IGN). | Refuerza la decisión de 57–63 px de alto sobre 270 px (~21 % de la altura de pantalla); mantenerla. |
| A-L2 | Al atacar, Kratos avanza hacia el enemigo y puede caerse del borde si el jugador hace mash ciego (GameFAQs). | Nuestros ataques deben tener **deriva lateral mínima y controlada**; los bordes de la cubierta son un peligro legible, no una trampa oculta. |
| A-L3 | El agarre/finisher contextual es la seña de identidad del combate de la franquicia, pero su ventana de input genera frustración si es demasiado corta. | Si se añade un finisher en el futuro, su ventana de input debe medirse en decenas de ms y ser tolerante; ver huecos (§8). |
| A-L4 | Las reseñas criticaron que los enemigos parecen "sacos de golpes" cuando no tienen presencia (Modojo). | Las oleadas (etapa 18) necesitan amenaza real: telegrafiado, aproximación y separación, no enemigos inertes. |
| A-L5 | El HUD es mínimo: medidores verde/azul arriba a la izquierda + contador de orbes; legible en pantalla pequeña. | Orienta la etapa 22 (interfaz) hacia un HUD reducido y no intrusivo. |
| A-L6 | Paleta "dreary and muted" coherente con el tono; un solo tileset con palette swapping por restricción técnica (Cohen, Wikipedia). | Nuestra paleta del Egeo (19 colores aprobados) ya va en esa línea; no ampliar sin criterio. |
| A-L7 | *Arena Mode*: oleadas acumulativas con puertas que se abren al alcanzar un conteo. | Patrón válido para el diseño de barreras/liberación de la etapa 18. |

## 4. Bloque B — *God of War* (PS2, 2005): narrativa del Egeo y la Hidra

### B.1 Estructura real del primer nivel (Aegean Sea)

Reconstruida a partir de StrategyWiki, GameFAQs (Shotgunnova, jarrodlover) y GameSpot (impresiones de 2004):

1. **Cubierta 1:** emboscada de legionarios no muertos en 2–3 oleadas; trampilla → interior con cofre de vida y barriles.
2. **Hidra, cabeza 1:** patrón simple (retroceso → mordisco → castigar); se enseña el esquivado aquí; finisher QTE (Circle + Triangle×4) para empalarla.
3. **Cubierta 2:** arpias + tripulación (dan orbes verdes); segunda aparición de Hidra con más ataques (slam izquierda/derecha/centro).
4. **Interior inundado / cubierta 3:** arqueros con cobertura de cajas (bloqueo L1), vigas donde caer = muerte automática.
5. **Poseidon's Rage:** recompensa de magia a mitad de nivel.
6. **Batalla final de la Hidra:** cabezas 1 y 2 a la vez y luego la 3; finisher final con el mástil roto.

### B.2 Lecciones para el proyecto

| # | Lección del Egeo/Hidra | Aplicación propuesta |
| --- | --- | --- |
| B-L1 | El patrón de diseño es **repetición con escalada**: el mismo jefe reaparece con más ataques en cada encuentro (cabeza 1 → cabeza 2 → batalla final). | Modelo directo para la etapa 21 (combate de la Hidra): fases con repertorio creciente en lugar de un único patrón. |
| B-L2 | El jefe se enseña en una arena controlada con patrón lento y telegrafiado antes de exigir habilidad. | El primer contacto con la Hidra debe ser casi tutorizable: un solo ataque, aviso claro, ventana grande de castigo. |
| B-L3 | El tutorial de esquivado aparece **después** del primer contacto con el jefe, cuando el jugador ya quiere esquivar. | Argumento para introducir la esquiva (etapa 12) antes de exigirla en combate real. |
| B-L4 | El nivel alterna combate abierto, plataformas mortales (vigas), cobertura contra arqueros y un cofre/almacén de recursos. | Nuestro escenario del Egeo (barco) ya aprobado tiene cubierta transitable; el contenido de peligro mortal y cobertura queda para etapas futuras de nivel. |
| B-L5 | Ritmo de oleadas: grupos cortos que desbloquean el avance (trampilla, pasillo, escalera), no arenas abiertas infinitas. | Refuerza el diseño "aparición → barrera → despeje → liberación" ya previsto en la etapa 18. |
| B-L6 | El nivel de apertura incluye una recompuesta de magia a mitad de camino y una pelea de jefe como clímax del escenario. | Guion de referencia para el recorte narrativo (§8, PR-04). |

## 5. Bloque C — Técnicas: Phaser 3, pixel art y game feel

### C.1 Phaser 3 (v3.90) — hallazgos técnicos

- `pixelArt: true` desactiva antialiasing; **`roundPixels: true` debe declararse explícitamente desde v3.85** (antes default true, ahora false) — sin él aparece jitter a baja resolución (repo Phaser, issue #7188; guía de prácticas de Rob Cost).
- La documentación pública de "Phaser 3" está congelada en 3.88 y apunta a Phaser 4.1; **D-01 mantiene Phaser 3** y es correcto por ahora, pero conviene saber que 4.x ya existe (opciones nuevas: `smoothPixelArt`, filtro `Blocky`).
- Escala: ampliar el canvas real da mejor resultado que escalar con CSS; con CSS, `image-rendering: pixelated` + escala entera es lo correcto (nuestra presentación ya lo hace).
- Rendimiento: bundle actual ~1,5 MB con warning >500 kB es conocido y no bloqueante; Phaser es la mayor parte del peso.

### C.2 Game feel — técnicas con valores

| Técnica | Qué hace | Valores típicos / métrica |
| --- | --- | --- |
| **Input buffering** | Guarda un input ~60–100 ms para consumirlo en el frame oportuno (p. ej. saltar justo antes de tocar suelo). | ventana 60–120 ms; patrón `press()/consume()` one-shot. |
| **Coyote time** | Permite saltar unos frames tras salir del borde. | ~50–100 ms (3–6 frames a 60 fps). |
| **Jump buffering** | Salto pulsado en aire se consume al aterrizar. | ~100 ms. |
| **Respuesta máxima** | Swink, *Game Feel*: la respuesta al input debe ser ≤100 ms para percibirse como causa-efecto; motion fluido ≥20 fps. | ≤100 ms ≈ 6 frames a 60 fps. |
| **Hitstop / screen shake / squash** | "Juice" de impacto sin ocultar anticipaciones. | hitstop 30–80 ms en golpes ligeros; shake corto y de baja intensidad (nuestra regla: no tapar lectura). |
| **Separación de enemigos** | GDC 2019, *Evolving God of War's Combat*: los enemigos no agresivos mantienen un círculo de separación alrededor de Kratos; los agresivos lo invaden; se ajusta por dificultad. | Regla aplicable directamente a nuestras oleadas (etapas 16 y 18). |
| **Hit reactions + strike assist** | Reacciones exageradas al golpe y mantener al enemigo golpeado en pantalla hacen que el combo se sienta poderoso sin castigar al jugador. | Relevante para knockback de etapa 13 y legibilidad de combos 9–11. |

### C.3 Pixel art y animación

- Antes de integrar: verificar tamaño, transparencia, anclaje y consistencia de cuadros (regla ya vigente en AGENTS.md); auditar por programa (bounds, conteo de colores, canal alfa) como se hace en las etapas 1–4.
- El jitter se combate con escala entera + `roundPixels`, no con suavizado.
- **Verificación visual de arte generado (2026-10-16).** El modelo del runtime **no admite entrada de imagen**, así que una hoja de *pixel art* generada no puede evaluarse «a ciegas». Para cerrar el bucle: (a) un **verificador visual local** (p. ej. Ollama + VLM pequeño en CPU, solo desarrollo) que describa el PNG; y (b) aplicar **contorno exterior, sombreado direccional y principios de animación** (squash & stretch, anticipación, arcos, volumen constante). La generación procedural geométrica sin esos pases rinde siluetas embarradas. Referencia aplicada: D-21/D-22 y etapa 10.5.

## 6. Bloque D — Verificación y harness

### D.1 Qué dice la práctica y la investigación

- **Simulación determinista = función pura** `(estado inicial, traza de entrada) → estado final`. Si la entrada entra al juego **como datos por tick** (structs de input), una prueba, un replay y un humano son indistinguibles para la simulación (práctica de desarrollo de juegos; papers arXiv 2202.12777 y 2402.04938).
- **Fijo vs. render:** desacoplar el paso de simulación del render permite reproducir exactamente; probar la misma traza a 30/60/sin cap debe dar idéntico resultado de simulación.
- **Contrato de determinismo:** misma build + misma semilla + misma traza → mismos checksums por tick. Las trazas se degradan cuando el contenido cambia: anclarlas a escenas de prueba o eliminarlas ruidosamente.
- **Capturas de pantalla automatizadas** solo sirven con cámara fija, semilla fija, tolerancia por plataforma y triaje humano del diff; **no** para "¿se siente bien?".
- **Audio:** asertar eventos disparados (sonido X con parámetros Y), no comparar formas de onda.
- **Lo que la automatización no detecta:** sensación de control, curva de dificultad, "juice", confusión del jugador. Su función es liberar tiempo humano para eso (arXiv 2202.12777; postulados de QA).
- Referente de industria: *Retro City Rampage* construyó motor determinista con grabación y reproducción de entradas (GDC Vault).

### D.2 Confrontación con `docs/verificacion.md`

La regla vigente —"los eventos sintéticos deben etiquetarse como sintéticos; no equivalen a teclado físico" y "controles normales se prueban en navegador"— **coincide con la literatura**: la automatización verifica flujo y regresión; la sensación solo se evalúa con prueba humana. No hay conflicto.

Lo que sí aporta la investigación como **mejora**:

1. El contrato DEV de la etapa 5 debería incluir **trazas de entrada grabables** (formato de repro de bugs) además de snapshots/pasos.
2. Las pruebas de etapa deben poder ejecutarse con **paso de simulación fijo** desacoplado del render (ya lo hace `stepKeys(16 ms)`, conviene formalizarlo como garantía).
3. Añadir **prueba de frame-rate**: misma traza a 30/60 fps con idéntico resultado, cuando exista harness.

## 7. Registro de fuentes

| # | Fuente | URL | Fecha de consulta | Corroboración |
| --- | --- | --- | --- | --- |
| F-1 | Wikipedia, *God of War: Betrayal* | https://en.wikipedia.org/wiki/God_of_War:_Betrayal | 2026-10-15 | Corroborada con F-2/F-3: 10 niveles, 2–4 h, J2ME, WayForward, palette swapping. |
| F-2 | IGN, reseña de *Betrayal* (Buchanan, 2007) | https://www.ign.com/articles/2007/06/27/god-of-war-betrayal-review | 2026-10-15 | Fuente primaria de diseño y crítica (sprite pequeño, QTE, level design). |
| F-3 | GameFAQs, guía y walkthrough de *Betrayal* (the_requiem) | https://gamefaqs.gamespot.com/mobile/941789-god-of-war-betrayal/faqs/55398 | 2026-10-15 | Controles y combos; corroborado con F-1. |
| F-4 | MobyGames, ficha de *Betrayal* | https://www.mobygames.com/game/45251/god-of-war-betrayal | 2026-10-15 | Íconos de finisher, orbes, Arena Mode; corroborado con F-1. |
| F-5 | StrategyWiki, *God of War* — Aegean Sea | https://strategywiki.org/wiki/God_of_War/Aegean_Sea | 2026-10-15 | Estructura del nivel 1; contrastada con F-6. |
| F-6 | GameFAQs, walkthrough de *God of War* (Shotgunnova) | https://gamefaqs.gamespot.com/ps2/919864-god-of-war/faqs/53159 | 2026-10-15 | Oleadas, patrones de Hidra, vigas; contrastada con F-5. |
| F-7 | GameSpot, *God of War* Updated Impressions (2004) | https://www.gamespot.com/articles/god-of-war-updated-impressions/1100-6113036 | 2026-10-15 | Diseño de jefe con cajas/mástil y riesgo-recompensa de QTE. |
| F-8 | Wikipedia, *God of War* (2005) | https://en.wikipedia.org/wiki/God_of_War_(2005_video_game) | 2026-10-15 | Contexto y localizaciones (Egeo, Atenas). |
| F-9 | GDC Vault, *Evolving God of War's Combat* (Sheth, 2019) | https://media.gdcvault.com/gdc2019/presentations/Sheth_Mihir_EvolvingCombat.pdf | 2026-10-15 | Charla primaria: separación de enemigos, strike assist, hit reactions. |
| F-10 | Phaser, issue #7188 «Pixel art rounding» | https://github.com/phaserjs/phaser/issues/7188 | 2026-10-15 | Comportamiento de `roundPixels`/escala; contrastado con F-11. |
| F-11 | Rob Cost, *Phaser 3 Best Practices* | https://github.com/robcost/gameforge/blob/main/docs/research/phaser3-best-practices.md | 2026-10-15 | Config pixel art, input buffer; secundaria, contrastada con F-10 y docs. |
| F-12 | Steve Swink, *Mechanics and Metrics of Game Feel* (cap. 4) | http://dtc-wsuv.org/wp/dtc338-engines/files/2017/01/Mechanics-and-Metrics-of-Game-Feel-Steve-Swink.pdf | 2026-10-15 | Umbrales de respuesta ≤100 ms y control en tiempo real. |
| F-13 | kindatechnical / bugnet / supagames — coyote time e input buffering | https://kindatechnical.com/game-development/input-buffering-coyote-time-and-game-feel.html y otros | 2026-10-15 | Valores típicos; fuentes secundarias concordantes entre sí. |
| F-14 | arXiv 2202.12777, *Towards Automated Video Game Testing* | https://arxiv.org/html/2202.12777v2 | 2026-10-15 | Revisión académica: determinismo, oráculos, límites de la automatización. |
| F-15 | arXiv 2402.04938, beta testing automatizado (fixed timestep, input traces) | https://arxiv.org/pdf/2402.04938 | 2026-10-15 | Grabación/replay de entradas y desacople de paso de simulación. |
| F-16 | GDC Vault, *Automated Testing and Instant Replays in Retro City Rampage* | https://www.gdcvault.com/play/1021825/Automated-Testing-and-Instant-Replays | 2026-10-15 | Confirmación de ficha; contenido solo descrito por la ficha (no se reprodujo el video). |
| F-17 | Post de principios «testing-and-determinism» (grimoria) | https://github.com/rongrongDev/grimoria/blob/main/game-dev/principles/testing-and-determinism.md | 2026-10-15 | Práctica agregada de la industria; secundaria, concordante con F-14/F-15. |

**No corroborado / limitaciones:** no se reprodujeron vídeos de gameplay de *Betrayal* ni del Egeo (solo texto e imágenes fijas); no se midieron tiempos reales de *Betrayal* en dispositivo; no hay acceso a la GDC talk de McDonald citada por F-9 (solo el PDF de Sheth). Las cifras de balance de nuestros documentos no se contrastaron con *Betrayal* porque no existe un desglose público de sus frames.

## 8. Decisiones derivadas y huecos detectados

### 8.1 Recomendaciones (todas resueltas el 2026-10-15)

- **PR-01 — Criterios de game feel en etapas 6–14.** Añadir a los criterios de aceptación de movimiento, salto, combos, esquiva y daño: respuesta al input ≤100 ms (≈6 frames), coyote time ~60–100 ms y jump buffer ~100 ms en la etapa de salto. *Destino:* `verificacion.md`. Estado: **aprobada y aplicada (D-15, 2026-10-15)**.
- **PR-02 — Etapa 5 (harness DEV): trazas de entrada.** Además de snapshots/escenarios/reset/pasos/métricas (D-10), incluir grabación de trazas de input como formato de reproducción de bugs y garantía de paso de simulación fijo desacoplado del render (§6.2). *Destino:* criterios de la etapa 5. Estado: **aprobada y aplicada (D-16, 2026-10-15)**.
- **PR-03 — Separación de enemigos en oleadas.** Incorporar la regla de GDC (círculo de separación para no agresivos, invasión para agresivos, ajustable por dificultad) al diseñar las etapas 17 y 20. *Destino:* criterios de esas etapas. Estado: **aprobada y aplicada (D-17, 2026-10-15)**.
- **PR-04 — Recorte narrativo del Egeo.** Adoptar la estructura del nivel 1 de GOW1 (§4.1) como guion de referencia para `adaptacion-narrativa-y-niveles.md`: encuentros de Hidra escalados, recompensa a mitad de escenario, clímax en la cubierta. *Destino:* `adaptacion-narrativa-y-niveles.md`. Estado: **aprobada y aplicada (D-18, 2026-10-15)**.
- **PR-05 — Dimensiones de Kratos.** Confirmar 57–63 px sobre 270 px como decisión estable (la crítica de IGN al sprite pequeño lo respalda). Estado: **validada externamente y registrada (D-18); sin cambio de código**.
- **PR-06 — Actualizar el registro de decisiones.** `decisiones.md` D-11 y D-13 describían la restricción de familia Luna/OpenCode retirada de `AGENTS.md`; se marcaron como reemplazadas y se añadió D-14. Estado: **aplicada (2026-10-15)**.
- **PR-07 — Verticalidad como baseline de jugabilidad.** Fijar que la jugabilidad lateral de *Betrayal*, incluida su verticalidad (ascensos, saltos entre niveles, plataformas y peligros a varias alturas), es el punto de partida a igualar o superar en la versión web, adaptado a GOW1 y sin copiar recursos; concretarlo en criterios de las etapas de movimiento/plataformas y combate. *Destino:* `decisiones.md` (D-20), `direccion-y-controles.md` y criterios de la etapa 8. Estado: **aprobada y aplicada (D-20, 2026-10-15)**.
- **PR-08 — Arte de animación con generación procedural y verificación visual local (2026-10-16).** Producir el arte definitivo de Kratos (idle/carrera/aire/ataque) con **generación procedural articulada** (Pillow, original, sin dependencias), mejorada con contorno exterior, sombreado direccional, «squash & stretch» y poses clave a mano, y cerrar el bucle con una **verificación visual local** (Ollama + VLM pequeño en CPU, o hoja de contacto humana) porque el runtime no interpreta imágenes. *Destino:* `decisiones.md` (D-21/D-22) y etapa 10.5 `GOW8B-KRA-02` de `verificacion.md`. Estado: **aprobada en su enfoque (D-21/D-22, 2026-10-16); entorno de verificación visual preparado el 2026-10-16 (Ollama + `moondream` + skill `phaserjs/phaser@animations`); ejecución aún no iniciada.**

### 8.2 Huecos abiertos (decisiones de producto para el usuario)

- **H-1 — No hay bloqueo en el plan de etapas.** *Betrayal* incluye bloqueo (botón abajo); nuestro mapa D-08 y las 26 etapas no contemplan bloqueo, solo esquiva. **Resuelto (2026-10-15):** se añade la etapa 13 «Bloqueo y parry» (D-19).
- **H-2 — No hay finisher contextual.** El agarre con ícono es identidad de la franquicia (A-L3) y no aparecía en las 26 etapas. **Resuelto (2026-10-15):** se añade la etapa 18 «Finisher contextual» (D-19).
- **H-3 — Orbes/mejoras (metaprogresión).** Betrayal y GOW1 progresan con orbes; el plan no incluía economía de mejora. **Resuelto (2026-10-15):** se añade la etapa 22 «Orbes, cofres y mejoras» (D-19).
- **H-4 — Phaser 4 existe.** D-01 fija Phaser 3 y funciona. **Resuelto (2026-10-15):** se mantiene Phaser 3; reevaluar solo si un requisito concreto lo exige.

## 9. Contraste final con la definición vigente

| Afirmación vigente | Resultado del contraste |
| --- | --- |
| D-03: historia de GOW1 con lectura/estructura de *Betrayal* | **Confirmada.** Las fuentes separan con claridad ambos roles: estructura lateral (Betrayal) vs. guion del Egeo (GOW1); no colisionan. |
| D-07: primer objetivo Egeo + Hidra | **Confirmada y detallada** con la estructura real del nivel 1 (§4.1); PR-04 la convierte en guion. |
| D-10: contrato DEV con snapshots/pasos | **Ampliada** por PR-01/PR-02 (trazas, paso fijo, umbrales de respuesta). |
| D-12: 480×270 interno | **Compatible** con todas las fuentes; sin cambios. |
| Plan de etapas | **Ampliado a 29** (2026-10-15): PR-01/PR-02/PR-03 incorporadas a criterios y tres etapas nuevas (D-19). PR-07 fija el baseline de jugabilidad/verticalidad (D-20) con criterio en la etapa 8. Sin errores de orden; los huecos detectados quedaron resueltos (H-1…H-4). |
| Regla de verificación "sintético ≠ físico" | **Validada por la literatura** (§6.2); se mantiene intacta. |

**Límites de este documento:** todo lo anterior es investigación documental; no se ejecutó el juego ni se midieron frames en navegador. Las recomendaciones PR-01 a PR-08 y los huecos H-1 a H-4 fueron aprobados por el usuario y registrados en `verificacion.md`, `decisiones.md`, `direccion-y-controles.md` y `adaptacion-narrativa-y-niveles.md` (PR-01 a PR-07 el 2026-10-15; **PR-08 el 2026-10-16**); su aplicación al código ocurrirá solo cuando las etapas correspondientes se activen.
