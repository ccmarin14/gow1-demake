# Estado del proyecto

Documento único del estado medido de `gow-8b`: qué funciona, qué falta revisar o decidir y qué sigue. Se actualiza en el mismo commit de cada paso. La cronología completa y lo ya resuelto viven en [`docs/archivo/`](archivo/README.md); el historial de git conserva todo lo demás.

**Sincronizado el 2026-11-17 · 407 pruebas · rama `tarea/ataques-circulo`.**

## 1. Qué funciona hoy

- **Verificación:** `pnpm test` (Node nativo, sin dependencias), `npx tsc --noEmit -p .`, `pnpm build`, `pnpm art:check`, `pnpm audio:check` (renderiza los sonidos fuera de línea y los mide) y `scripts/verify/browser-check.sh` (arranca Vite y Chrome sin cabeza, graba la partida y debe decir `errors 0 failed 0`). `scripts/verify/perf.mjs` mide cuadros con la CPU frenada (modos `combo`, `idle`, `grab`): 60 ticks/s con la CPU 4 veces más lenta, también en la secuencia de agarre.
- **Simulación determinista a 60 Hz (`src/sim/`):** movimiento con inercia, salto y doble salto, plataformas de un sentido, rodada con i-frames, guardia y desvío (*parry*), magia (*Ira de Poseidón*), orbes, cofres, puntos de control, oleadas, y la IA del legionario, el arquero y la hidra.
- **Combate de □ y △ (aprobado por el usuario):** combo de 6 □ con *Plume* (□ □ △) y *Spirit of Hercules* (5 □ + △), △ en tres niveles por tiempo (tajo doble, lanzador, *Ascension*), golpes aéreos y giro entre golpes. Las trayectorias de las hojas salen de datos medidos del video (`src/sim/strike.ts`).
- **Combate de ○ (agarre, `src/sim/grab.ts`):** embestida y presa (con forcejeo si nadie elige); ○ ○ ○ = tres puñetazos, azote al suelo y cuatro puñaladas **automáticas**, la última mata; ○ □ = *Toss* con ritmo de látigo (tirón atrás, chasquido, dos cadenas; el soldado sale unos 145 px y derriba a los que encuentre; se puede girar a un lado u otro antes de lanzar); ○ △ = *Rip*, lo parte en dos; ○ en el aire tras lanzar = *Orion's Harpoon* con rebote; *Whiff* si no hay a quién agarrar. Todos los golpes comparten una escala de impacto (hitstop y sacudida en `CONFIG.player.grab`). El remate contextual con ○ existe pero es inalcanzable con el legionario común (decisión C-O1).
- **Presentación (`src/scene/`, `src/entities/`):** `PlayerView` y `EnemyView` eligen cuadro; `grabPose.ts` decide dónde se dibuja cada cuerpo en el agarre a partir de anclajes del esqueleto 3D (la mano de Kratos en el cuello del soldado, la punta de la hoja sobre el cuerpo tendido); `RipHalves.ts` dibuja las dos mitades del desgarro; `WeaponLayer` dibuja espadas, cadenas y estelas; `VfxLayer` las partículas; `HudLayer` el HUD y `GameFlowOverlay` el flujo.
- **Arte:** los 95 cuadros de Kratos (`grids/kratos/`, 64×56, paleta `palette/kratos.json`) y los de agarre del legionario (`held`, `flip`, `tumble`) son **borradores del maniquí 3D** sin la terminación a mano de la cabeza (D-34). El legionario común tiene además su juego de 27 cuadros aprobados (D-51). Arquero, hidra y flechas siguen siendo cajas.
- **Audio (`src/audio/`):** sonidos procedurales **en capas** (golpe de bajo, cuerpo medio, ruido, chasquido, metal y cola de reverberación) con cadena maestra (compresor, saturación, reverberación por convolución), **tormenta de fondo** (viento, lluvia, mar y truenos lejanos) y sonidos de Kratos herido y del no muerto (D-55).
- **Herramientas (`scripts/`):** `pose_render/` (render 3D → grid; `build_anchors.py --only` recalcula anclajes en segundos; `measure_pose.py` mide manos y cabeza de una pose; el giro de cámara `camera_roll_deg` da cuerpos horizontales sin rotar píxeles), `verify/grab_rec.sh` + `grab_sheet.py` (graban el juego real tick a tick y arman tiras) y `verify/audio_render.sh` (audio fuera de línea a WAV con medidas).
- **Banco de pruebas en el navegador:** `window.__GOW8B` expone `snapshot()`, `loadScenario()`, `reset()`, `step()`, `advance()` y `metrics()`.

## 2. Para revisar y decidir

### Revisión visual pendiente

Cuadros commiteados sin tu aprobación (regla de `AGENTS.md`); ninguno sirve de base para otro hasta aprobarse. Todos son borradores 3D con la cabeza sin terminar.

| Cuadros | Qué mirar | Cómo verlo |
| --- | --- | --- |
| Golpes de □ y △ (`sq*`, `tri-*`, `plume-*`, `asc-b`, `aq*`, `airtri-*`, `launcher`) | El moveset de nivel 1 (D-37) completo. Los tiempos de los niveles de △ y el sentido del remate de □ son decisiones tuyas, no de una fuente. | En el juego: `J`, `I`, `Espacio`. |
| `idle-00..02`, `run-00..07`, `air-00..02`, `roll-00..04` | Reposo con jadeo, carrera (en `run-03`, `run-06` y `run-07` los dos pies están en el aire), salto y rodada. | En el juego: quieto, `D`, `Espacio`, `Shift`. |
| `blade-of-chaos` | Aprobada; falta ver cómo quedan las espadas a la espalda en movimiento. | En el juego. |
| Agarre de ○: `grab-*` de Kratos (`lunge`, `hold`, `punch-a/b`, `stab-up/a/b`, `slam-a/b/c`, `break-a/b`, `toss-raise/stab`, `throw-a/b`, `whiff-recover`), `guard-a/b` y los del soldado (`held-00/01`, `flip-00..02`, `tumble-00..03`) | Que cada movimiento se lea como en el video. La forma ya pasó dos auditorías independientes; falta tu ojo. | Una tira por movimiento (juego real junto al video) en `docs/tmp/revision-circulo/`, o el juego con `L`, `J`, `I`. |

### Decisiones pendientes

| # | Tema | Situación | Opciones |
| --- | --- | --- | --- |
| **C-O1** | Remate contextual con ○ sobre un enemigo debilitado | El estado `weakened` no lo asigna nada en `src/` (solo las pruebas), así que `finisher_qte` es inalcanzable con el legionario común, que se agarra siempre en `hold` (una prueba lo exige). Los jefes y enemigos grandes de GoW 1 sí tienen remate. | (a) mantener hasta tener enemigos grandes, (b) que el legionario pase a `weakened` con poca vida (cambia el combate), (c) quitar el remate sobre el legionario. |
| **F4** | Terminación a mano de la cabeza | Todos los cuadros de Kratos son borradores 3D; la regla de `AGENTS.md` pide terminarlos con la cabeza de `idle-00`. Es una tarea de arte de todo el juego, no de ○. | Hacerla por lotes con tu aprobación, o aceptar el estilo del maniquí y mejorar la cabeza en el render. |
| **Harpoon** | Verificación con teclas reales | La ventana de ○ en el aire tras el lanzador es corta y no se pudo encadenar con teclas CDP en Chrome sin cabeza; solo hay pruebas unitarias. | Probarlo a mano; si resulta corta, ensanchar la ventana en `CONFIG`. |

### Decisiones de combate (referencia)

Qué hace el juego frente a GoW 1, por mecánica; "a confirmar" marca lo que no se pudo verificar en una fuente (las wikis especializadas no fueron accesibles). El combate de ○ (agarre, *Toss*, *Rip*, remates) está especificado en `docs/direccion.md` §6.1.

| # | Mecánica | Hoy en el juego | En GoW 1 |
| --- | --- | --- | --- |
| C1 | Combo ligero | Combo de 6 □ (cartel del juego) con *Plume* tras 2, 3 o 4 □ + △, giro entre golpes, gracia de 16 ticks y búfer desde el primer tick (D-37, D-39, D-41). 1 □ + △ es el △ normal y 6 □ no encadena. | Combo de 6 □ confirmado por el cartel y el manual. *Plume* es de nivel 1 en *Chains of Olympus*; que sea tras 2 a 4 □ es indicación del usuario. |
| C2 | Golpes pesados y finales | △ en tres niveles por tiempo: tajo doble secuencial (dos impactos de 10), lanzador y *Ascension* (D-37). *Spirit of Hercules* (5 □ + △, 64 de daño en total, salto corto con ralentización, D-41). Los tiempos de los niveles son del usuario. | Manual: "△ mantener: lanzar al enemigo y seguirlo"; Neoseeker: lanzar, luego saltar. **Sin respaldo** para el tajo doble ni para *Spirit* con esa entrada (en *Chains of Olympus* es △△△ de nivel 3; en el GoW 1 original no se confirmó): son decisión del usuario. |
| C3 | Ataques aéreos | Tres □ aéreos (con caída frenada) y △ aéreo con impacto; un salto los corta con el doble salto. | Manual: "ataque horizontal" y "ataque vertical"; cartel del juego: AIR □□□ y AIR △. |
| C6 | Embestida | No existe; no es de nivel 1 (*Hermes Rush* es de nivel 2). | Fuera del alcance de nivel 1. |
| C7 | Guardia y desvío | Guardia con `O`; desvío (*parry*) en los primeros ticks, que aturde al legionario y refleja flechas. | A confirmar. |
| C8 | Magia | Solo *Ira de Poseidón* (costo 35, radio 90). | Cuatro hechizos: *Furia de Zeus*, *Mirada de Medusa*, *Ira de Poseidón* y *Ejército de Hades*. |
| C9 | Ira de los Dioses | No existe. | Sí: invulnerabilidad temporal y más daño; se recarga con orbes rojos. |
| C10 | Hoja de Artemisa | No existe. | Arma secundaria, una espada grande con otras opciones de combate. |
| C11 | Orbes y cofres | Orbes rojos, verdes y azules; cofres; Ojos de Gorgona y Plumas de Fénix (6 por mejora, +20 de vida o maná); la mejora de arma salió (D-38). | Sí: verdes curan, azules dan magia, rojos son experiencia para mejorar la magia y recargan la Ira; los Ojos y las Plumas alargan vida y magia. |
| C12 | Enemigos | Legionario (un tajo con aviso), arquero e hidra (jefe con barra). | Decidido (D-44): en el Egeo hay arpías, no-muertos con espada, no-muertos con arco y la Hidra; su comportamiento original está en `direccion.md` §8. |
| C13 | Oleadas y arena cerrada | Arena central de `level1` con barreras y 2 oleadas. | A confirmar. |

### Mecánicas heredadas

Las implementaron agentes anteriores. El usuario fijó la intención general (D-03: historia, enemigos y repertorio de combate del primer *God of War*; D-08: controles), pero no decidió cada mecánica ni sus valores. Hasta que lo haga, ninguna es un requisito: no se dibuja arte ni se amplía una de ellas sin preguntarle. "Verificada" significa cubierta por `pnpm test`.

| Mecánica | Estado | Detalles que el usuario no decidió |
| --- | --- | --- |
| Correr y frenar (D-32) | Decidida y verificada | Velocidad 140 px/s, aceleración y frenado. Sin caminar y sin derrape. |
| Salto, doble salto y plataformas (D-32) | Decidida y verificada | Altura fija (no depende de cuánto se mantiene la tecla); se cae del borde cuando sale el centro, no el pie. |
| Rodada con invulnerabilidad (D-32) | Decidida y verificada | Duración 20 ticks, unos 82 px, invulnerable los primeros 15; solo en el suelo. |
| Guardia y desvío (*parry*) | Sin verificar | Ventana de desvío y efectos. |
| Magia (*Ira de Poseidón*) | Sin verificar | Costo, alcance y efecto. |
| Orbes, cofres y puntos de control | Sin verificar; fuera del nivel (D-33) | Cantidades y reglas. |
| Legionario, arquero e hidra (IA) | Sin verificar; fuera del nivel (D-33). La hidra se descarta y se rehace desde cero (D-45, BL-22) | Comportamientos y valores. |
| Oleadas y arena | Sin verificar; fuera del nivel (D-33) | Composición y barreras. |

### Decisiones visuales pendientes

Elementos heredados que el usuario no decidió. Están apagados con un interruptor en `src/config.ts`; encenderlos es cambiar un valor.

| Elemento | Interruptor | Qué hace al encenderlo |
| --- | --- | --- |
| Cuchilla en reposo | `presentation.restPose.enabled` | Una cuchilla del motor cuelga del puño delantero en reposo, al correr y en el aire. |
| Chispas de golpe | `vfx.combatSparks.enabled` | Partículas en el golpe al suelo de la hidra. |
| Aplastamiento al aterrizar | `presentation.landingSquash` | El sprite se ensancha y achata unos ticks al tocar el suelo. |

## 3. Backlog

Historias de usuario abiertas, con el modelo que las trabaja y qué las bloquea (reglas de reparto en `AGENTS.md`). *Lista* se puede empezar ya; *Cupo* espera cupo de Sonnet; *Decisión* y *Lista del usuario* esperan una respuesta tuya. Las cerradas están en [`docs/archivo/backlog-cerrado.md`](archivo/backlog-cerrado.md).

| ID | Historia | Criterio de aceptación | Modelo | Estado | Sup. |
| --- | --- | --- | --- | --- | --- |
| **BL-01** | Como jugador quiero que Kratos acompañe cada golpe con el brazo sobre la hoja. | En todo golpe, el brazo queda a 40° o menos de la hoja salvo los dos primeros ticks de cada pose. Huecos conocidos (las pruebas los toleran): el lazo del △ aéreo (62°; dive, swing y raise hasta 90°), el lanzador (poses que no siguen a las hojas) y las poses de salto reutilizadas en *Ascension*. Poses propias para su salto y suspensión. | Sonnet | Cupo y lista del usuario | S1 |
| **BL-02** | Como jugador quiero ver las hojas encendidas en la carga de △ y fuego en los golpes pesados, sin estelas grandes. | Fuego a lo largo de la hoja en la carga; columnas de fuego en el △ aéreo y en el tercer □; estelas de 55 px o menos. | Sonnet | Cupo | S3 |
| **BL-03** | Como jugador en celular quiero que el juego no se trabe. | Con la CPU 4 veces más lenta, el p95 de cuadro es 33 ms o menos y no hay cuadros de más de 50 ms; se evalúa pasar a WebGL sin romper las capturas (`toDataURL`). | Sonnet | Cupo; riesgo en las herramientas de captura | S3 |
| **BL-08** | Como jugador quiero ver al arquero no-muerto con arte, no como una caja (el legionario es BL-21, la Hidra BL-22 y la arpía BL-26). | Borradores 3D por D-34 aprobados cuadro a cuadro. | Sonnet | Cupo y aprobación visual | S1 |
| **BL-21** | Como jugador quiero al legionario no-muerto de GoW 1 con aspecto, animaciones y ataques a la altura de Kratos. | Ficha de diseño (`direccion.md` §7), herramienta de borradores generalizada sin cambiar los 76 grids de Kratos, y cuadros de reposo, caminar, aviso, tajo, recuperación, aturdimiento, aire y muerte aprobados uno a uno; `EnemyView` los muestra por estado de la IA; un segundo ataque que solo se pueda parar (ESE-04). | Sonnet | Hecho (pasos 96-97 arte y `EnemyView`; paso 99 inercia y patrulla; paso 100 derribo ESE-07; paso 101 ataque rompeguardias ESE-04) | S1, S3 |
| **BL-09** | Como jugador quiero a Kratos terminado a mano (cabeza aprobada, tatuaje, faldón). | Cada cuadro se aprueba uno a uno (regla de `AGENTS.md`). | Sonnet | El usuario lo pospuso ("todavía no te metas con el acabado") | S1 |
| **BL-10** | Como jugador quiero enemigos con más de un truco (ESE-04). | Un segundo comportamiento que dé sentido a la guardia o a la magia. | Haiku | Decisión | S2 |
| **BL-12** | Como jugador quiero los cuatro hechizos de GoW 1 (ESE-06). | *Furia de Zeus*, *Mirada de Medusa* y *Ejército de Hades* además de *Ira de Poseidón*. | Sonnet | Arte base y decisión | S2, S3 |
| **BL-15** | Como desarrolladora quiero partir `strike.ts` (más de 2.000 líneas) en el motor y un archivo de datos por golpe. | Sin cambios de comportamiento: todos los fixtures y pruebas siguen iguales. | Sonnet | Lista, entre rondas de golpes (bloquea S1 mientras dura) | S1 |
| **BL-17** | Como jugador quiero botones táctiles cómodos. | Tamaño, zona de pulgares y multitoque ajustados con lo que anote el usuario. | Haiku | Lista del usuario | S3 |
| **BL-18** | Como jugador quiero decidir cada mecánica heredada (guardia, magia, orbes, cofres, oleadas, IA, aplastamiento, chispas, cuchilla en reposo). | Una decisión por fila de la tabla "Mecánicas heredadas"; después se audita con pruebas. | Usuario; después Haiku | Decisión | S2 |
| **BL-19** | Como jugador quiero un nivel con enemigos y arena (hoy `level1` solo tiene a Kratos, D-33). | El Mar Egeo con el recorrido de `direccion.md` §8 (D-44), jugable de punta a punta: tres barcos, agua, redes, mástil, cuerdas, la Hidra y la llave del capitán. | Sonnet | BL-08, BL-18 y BL-21 a BL-26 | S2, S3 |
| **BL-22** | Como jugador quiero pelear contra la Hidra del Egeo como en GoW 1 (D-45). | Hidra nueva desde cero: primer encuentro en la bodega (cuello y cabeza desde abajo por la derecha), segundo en cubierta y combate final con dos cabezas menores clavadas por la plataforma con pincho y la principal estampada con ○ contra el mástil hasta el remate (`direccion.md` §8). Cada fase con su prueba en el harness; arte por D-34 aprobado cuadro a cuadro. | Sonnet | BL-06, BL-07 y BL-23 | S1, S2, S3 |
| **BL-23** | Como jugador quiero que la cámara siga a Kratos como en los metroidvania actuales (D-46). | Las reglas de `direccion.md` §9 con valores en `CONFIG` y una prueba por regla: zona muerta, adelanto hacia donde mira, eje Y quieto durante el salto y reacomodado al aterrizar, seguimiento rápido en caídas, límites del nivel y cámara fija por zona. Un escenario de prueba de más de una pantalla de alto. | Sonnet | Lista | S2, S3 |
| **BL-24** | Como jugador quiero deslizarme por cuerdas y avanzar colgada de las horizontales (D-44). | Deslizamiento de un punto alto a uno más bajo, sin enemigos; travesía horizontal colgado con enemigos. Una prueba por regla. | Sonnet | Fuera del vertical slice: se empieza después de BL-27 (la travesía espera además los golpes colgado, P-06) | S2 |
| **BL-25** | Como jugador quiero cruzar el agua de las bodegas a pie (D-44). | En el agua Kratos va más lento, salta más corto y no tiene doble salto; el tramo no se puede saltar de orilla a orilla. Una prueba por regla. Entra en el vertical slice bajo las vigas (BL-34). | Sonnet | Lista | S2 |
| **BL-26** | Como jugador quiero enfrentar a las arpías del Egeo (D-44). | IA que se lanza en picada con un chillido de aviso y se puede bloquear (`direccion.md` §8, tramo 3); arte por D-34 aprobado cuadro a cuadro. | Sonnet | Cupo; después de BL-21 | S1, S2, S3 |
| **BL-27** | Como jugador quiero jugar el vertical slice de punta a punta (D-47). | El recorrido de `direccion.md` §10 jugable en un escenario propio, del cómic a la puerta al caos, con la *Ira* activa desde el inicio y `scripts/verify/browser-check.sh` limpio. Reúne BL-06, BL-07, BL-21, BL-22 (solo el primer encuentro), BL-23, BL-25 y BL-28 a BL-36. | Sonnet | Espera sus historias | S2, S3 |
| **BL-28** | Como jugador quiero ver a Kratos bloquear con las dos espadas cruzadas al frente (D-50). | La guardia muestra su pose propia con las dos hojas cruzadas al frente en `WeaponLayer`, en lugar de `idle-00` con una cuchilla; la pose se aprueba a ojo. | Sonnet | Lista | S1, S3 |
| **BL-29** | Como jugador quiero un HUD con estilo (D-50). | Barras simples de vida, magia y orbes sobre una Espada del Caos dibujada (ASCII a PNG, aprobada a ojo); las barras siguen leyendo los mismos valores. | Sonnet | Lista | S3 |
| **BL-30** | Como jugador quiero ver los golpes encadenados y que me den más orbes (D-49). | Contador "Impactos" que sube por golpe conectado y se reinicia tras unos 2 s sin golpear o al recibir daño; multiplicador de orbes ×1, ×1,5, ×2 y ×3 desde 0, 10, 25 y 50 golpes; la *Ira* suma un golpe por enemigo alcanzado. Una prueba por regla. | Haiku | Lista | S2, S3 |
| **BL-31** | Como jugador quiero un menú principal y uno de pausa como los del juego (D-48). | Principal: Nuevo juego, Opciones y Créditos. Pausa por pestañas: armas con una mejora real de las Espadas del Caos pagada con orbes rojos, ataques disponibles y opciones. Pruebas de la mejora (costo, nivel, sin orbes suficientes no mejora). | Sonnet | Lista (pestañas: P-09) | S2, S3 |
| **BL-32** | Como jugador quiero una *Ira de Poseidón* que se parezca a la del original (D-50). | Descarga de energía alrededor de Kratos que daña en su radio, con un efecto rehecho; cada enemigo alcanzado suma al contador (BL-30). | Sonnet | Espera una referencia visual (P-08) | S2, S3 |
| **BL-33** | Como jugador quiero que la historia se cuente en un cómic (D-50). | Hojas de paneles con texto, efectos de entrada por panel (desvanecido, golpe), onomatopeyas con sonido; apertura del acantilado y "tres semanas antes"; se salta con cualquier acción (D-30). | Sonnet | Lista | S3 |
| **BL-34** | Como jugador quiero cruzar las vigas de la bodega (D-47). | Circuito de §10: saltos altos y bajos, doble salto preciso, maderos que ceden, otros que dejan a Kratos colgando (se sube machacando saltar), tablones caídos que no vuelven, dos tablas falsas, escalera de regreso desde el agua. Una prueba por regla. | Sonnet | Después de BL-23 y BL-25 (el circuito necesita más de una pantalla de alto y el agua) | S2, S3 |
| **BL-35** | Como jugador quiero leer lo que me dicen los personajes (D-47). | Recuadro de diálogo abajo de la pantalla que avanza con una acción; primer uso: el prisionero de §8, tramo 2c. | Haiku | Lista | S3 |
| **BL-36** | Como jugador quiero ver el barco del Egeo (proa, escotilla, bodega, vigas, agua y celda) en lugar de rectángulos planos (D-52). | `EnvironmentLayer` reemplaza los rectángulos planos de `ShellScene` siguiendo `direccion.md` §12: paleta `palette/environment.json`, fondos atmosféricos en Blender cuantizados (proa exterior y bodega interior) y piezas modulares atadas a `src/sim/` (tablones de cubierta, escotilla de ○, escombros destructibles, vigas firmes/quebradizas/falsas, escalera, agua baja con espuma, celda del prisionero y puerta). Cada fondo y lote de piezas aprobado a ojo por el usuario. | Sonnet | Lista (por tramos: 1.º proa/escotilla, 2.º bodega, 3.º vigas/agua/celda) | S1, S3 |
| **BL-45** | Como jugador quiero que todo ○ (agarre, puñetazos, azote, puñaladas, *Toss*, *Rip*, *Whiff*, *Harpoon*) se sienta y se vea como en GoW 1, traducido a la vista lateral. | Especificación en `direccion.md` §6.1, medida con grabaciones del juego real, pruebas de contacto y continuidad (`tests/grab-pose.test.ts`, `tests/grab-hitstop.test.ts`) y dos auditorías independientes (`docs/archivo/auditoria-circulo-*.md`). | Sonnet | **Hecho en simulación, presentación y sonido; falta tu revisión visual, la decisión C-O1 y las cabezas a mano (F4)** | S1, S2, S3 |

**Siguiente paso (2026-11-10): el vertical slice (BL-27, D-47, `direccion.md` §10).** Todo agente que retome sigue este orden y toma la primera historia de su carril que esté *Lista*, respetando un solo escritor por superficie. Lo que no está en esta lista espera a que termine el slice.

1. **Sin dependencias y verificables con pruebas:** BL-30 (contador "Impactos", Haiku) y BL-35 (recuadro de diálogo, Haiku).
2. **Con aprobación visual del usuario:** BL-28 (guardia con espadas cruzadas), BL-29 (HUD sobre la espada) y BL-33 (cómic). Cada cuadro o panel se aprueba antes de seguir (flujo de `AGENTS.md`).
3. **Menús:** BL-31 (principal y pausa con una mejora real de las Espadas del Caos).
4. **Escenario y entorno del slice, en este orden:** BL-23 (cámara vertical), BL-25 (agua baja), BL-34 (vigas) y BL-36 (arte híbrido del entorno y `EnvironmentLayer` por tramos: proa/escotilla, bodega y vigas/agua/celda, D-52).
5. **Enemigos y combate, en este orden:** agarre con ○ (BL-06, hecho en paso 102), remates (BL-07, hecho en paso 103) y BL-22 (solo el primer encuentro con la Hidra en la bodega).
6. **Cuando haya referencia visual (P-08):** BL-32 (*Ira de Poseidón* rehecha).
7. **Cierre:** BL-27, la integración de todo en un escenario jugable de punta a punta.

**Fuera del slice, para después:** BL-24 (cuerdas), BL-15 (partir `strike.ts`), BL-26 (arpías jugables; en el slice el caos puede ser solo mostrado), BL-19 (el Egeo completo), BL-12 (otros hechizos) y BL-09 (terminación de Kratos). El balance de daño (ver "Daño") queda para cuando el legionario se pueda ver: *Plume* tras 2 □ lo mata de un combo y *Ascension* no hace daño propio. Los golpes de los pasos 68 a 78 esperan la revisión visual del usuario. Gemini Flash avanzó bien los golpes; no se le asignan diseño de personajes ni poses.

**Daño (2026-11-08, medido con `stepStrike` a 40 px y fijado en `tests/damage-table.test.ts`):** daño de un golpe completo a un blanco de pie: □1 a □4 = 10, □5 = 14, □6 = 40 (dos impactos de 20 por hoja), △ de suelo = 20 (dos tajos de 10), lanzador = 10, *Plume* = 40 (dos impactos de 20) + 10 de fuego residual, *Spirit* = 64 (dos impactos de 32) + 16 de fuego residual, □ aéreos = 10 cada uno, △ aéreo = 40. *Ascension* no hace daño propio (su golpe es el del lanzador). Magia = 8 por golpe. Enemigos: legionario 60 de vida (tajo 12), arquero 40 (flecha 10), hidra 300 (golpe 25, barrido 20); Kratos 100 de vida, la guardia mitiga 85 %. Golpes para matar: arquero = 4 □; legionario = □1 a □5 deja 6 de vida y □6 lo mata, o □□ + *Plume* (exactamente 60); la hidra no cae con un solo combo. Sin escalado por combo, sin defensa de enemigos y sin Ira de los Dioses (C9). Los valores de *Spirit* y de los △ no tienen fuente.

## 4. Últimos pasos

La cronología completa (pasos 0 a 146) está en [`docs/archivo/registro-pasos.md`](archivo/registro-pasos.md). Aquí, el trabajo de ○ y del sonido de los últimos días (2026-11-17), en una línea cada uno:

- **Pasos 133 a 135:** giro libre antes de lanzar y *Toss* sin autoapuntado (decisión tuya); revisión propia de 8 cuadros; contraste de □ y △ con la lista de movimientos de Supercheats (todo el nivel 1 está); modo `grab` en `perf.mjs`.
- **Pasos 136 a 139:** primera mirada al juego real tick a tick (la víctima colgaba rígida y se "sentaba" al recibir puñaladas); cuadros nuevos del soldado y de Kratos arrodillado; análisis de fondo y plan BL-45; `grabPose` por anclajes, pruebas de contacto y poses nuevas.
- **Pasos 140 a 142:** dos auditorías independientes (notas medias de 3 y de 6 sobre 10, puñaladas aprobadas) y sus correcciones: embestida repartida en ticks, la puñalada mortal completa su animación, hitstop, azote con alzada y picada, *Toss* largo con soldado dando vueltas, *Rip* que parte en dos, forcejeo, búfer de entrada.
- **Paso 143:** las 4 puñaladas salen solas tras el azote (tu petición).
- **Paso 144:** *Toss* con ritmo de látigo, dos cadenas y alcance fijo (tu petición).
- **Paso 145:** escala única de impacto y una sola sacudida de cámara por golpe (subagente Opus de esfuerzo medio): antes cada golpe de ○ sacudía dos veces y la débil tapaba la fuerte.
- **Paso 146:** audio rehecho en capas, con tormenta de fondo y sonidos nuevos (D-55); banco de medidas `pnpm audio:check`.
- **Paso 148:** *Toss* con látigo inconfundible (el soldado queda arrastrado 25 px o más detrás de Kratos, el chasquido es un arco blanco de 3 ticks por encima del hombro con destello, y una sola cadena tensa de 1 px de separación) y las 4 puñaladas **en ráfaga** (de 21 a unos 12 ticks entre impactos, acelerando y con la cuarta sostenida), con sangre, chispa y sacudida por golpe (tu petición; subagente Opus). 407 pruebas.
