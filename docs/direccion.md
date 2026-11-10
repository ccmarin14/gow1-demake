# Dirección, controles y guía visual

## 1. Propósito y referencias

- ***God of War* (2005, PlayStation 2):** fuente de la historia, los enemigos, la progresión y el repertorio de las Cuchillas del Caos. El primer tramo jugable adapta la travesía del mar Egeo y el enfrentamiento con la Hidra.
- ***God of War: Betrayal* (2007):** referencia de encuadre lateral 2D, lectura de siluetas, plataformas y ritmo de subniveles breves. Sus capturas en [`referencias/god-of-war-betrayal.md`](referencias/god-of-war-betrayal.md) se usan solo como estudio.
- **Originalidad:** todos los sprites, fondos, efectos y sonidos del repositorio son originales.

## 2. Mapa de controles (teclado)

`InputManager` traduce las teclas físicas a acciones de dominio equivalentes al mando de PlayStation 2:

| Acción de dominio | Tecla | Equivalente PS2 | Uso |
| --- | --- | --- | --- |
| `move-left` / `move-right` | `A` / `D` o `←` / `→` | Stick izquierdo | Movimiento horizontal y orientación (`facing`). |
| `jump` | `Espacio` | Cruz ($\times$) | Salto simple, doble salto y descenso en plataformas (`Abajo + Espacio`). Un ataque en el aire gasta el doble salto hasta aterrizar (D-40). |
| `light-attack` | `J` (□ en pantalla táctil) | Cuadrado (□) | Combo de 6 □ en el suelo: cada `J` en el final del golpe anterior encadena el siguiente, y mantener la dirección contraria da vuelta a Kratos (D-37). En □6 no hace nada. |
| `dodge` | `Shift` | Stick derecho | Evasión terrestre con ventana de invulnerabilidad. |
| `heavy-attack` | `I` (△ en pantalla táctil) | Triángulo (△) | △ en tres niveles por tiempo; en el aire, el golpe vertical (D-37). |
| `magic` | `U` | L2 | Magia activa (*Ira de Poseidón*). |
| `context-action` | `E` | R2 | Interacción con cofres y entorno. |
| `guard` | `Q` | L1 | Guardia y desvío (*parry*) en los primeros ticks. |
| `pause` | `Escape` | Start | Pausa. |

Tras 2 a 4 □, △ lanza *Plume of Prometheus*; tras 5 □, *Spirit of Hercules* (§6). △ (`I`, o el botón △ táctil) tiene tres niveles por tiempo: tocar es el golpe pesado, mantener hasta el final de la carga lanza a los enemigos sin que Kratos salte y seguir sosteniendo lo hace saltar tras ellos (*Ascension*). En el aire, `J` encadena tres golpes y `I` el golpe vertical; un salto corta un golpe aéreo con el doble salto. Círculo no tiene acción todavía: usará `L` (D-42) cuando exista el legionario con arte (el agarre y *Orion's Harpoon* quedan para después).

## 3. Reglas visuales y de pixel art

- **Resolución lógica:** 480×270 píxeles, escalada en navegador con `pixelArt: true` (nearest-neighbor, sin suavizado).
- **Jerarquía de lectura:** Kratos y sus armas → enemigo activo y anticipación de ataque → suelo y bordes de plataforma → fondo marino y lluvia.
- **Construcción desde ASCII:**
  - Los sprites de personajes se editan en grids de texto (`grids/`) y se convierten a PNG mediante `scripts/ascii_to_png.py`. El PNG nunca se edita a mano.
  - Cada carácter del grid representa un **material o rol de color** claro (contorno, piel, piel en sombra, marca roja, bronce, cuero, metal) y `.` representa transparencia. Los grids de Kratos usan `palette/kratos.json` (letras mnemónicas con `roles` nombrados, declarada en el campo `palette` del `manifest.json` del personaje).
  - **Estilo de sombreado:** luz desde arriba a la izquierda. Del lado de la luz el borde es de color (granate `c` o bronce `b`); el contorno oscuro `o` va solo del lado de la sombra. Las formas se modelan pasando por los tonos intermedios (`s` → `m` → `b` → `d`), no saltando de claro a contorno. La cara es mínima, como en *Betrayal*: cráneo claro, franja roja con borde granate, oreja, cuenca del ojo granate bajo la ceja iluminada, pómulo con luz y chivera insinuada bajo el mentón; sin nariz ni boca dibujadas. El modelo de la cara y del sombreado es la cabeza aprobada de `idle-00` dibujado a mano (`git show 0af23ae:grids/kratos/idle-00.txt`, filas 12 a 17).
  - **Separación de capas:** el sprite del personaje contiene únicamente su anatomía y vestimenta. Las Espadas del Caos y la sombra de contacto se dibujan en capas separadas del motor (`WeaponLayer` y sombra en escena) para no duplicar armas ni arrastrar la sombra durante el salto.
  - **Trabajo incremental:** cada cuadro nuevo se dibuja completo en ASCII, se rasteriza y se presenta ampliado junto al cuadro base para aprobación visual antes de pasar al cuadro siguiente.

## 4. Esencia de *God of War*: brechas y plan

Revisión del 2026-10-29 contra el primer *God of War*, hecha sobre código, configuración y capturas (sin prueba de sensación a mano). Cada brecha es un trabajo pequeño e independiente; el estado vivo y el reparto están en el backlog de `docs/estado.md` §3. El estado vivo de cada una está en `docs/estado.md`.

**Qué ya cumple:** guardia con parry y rodada con invulnerabilidad, *Ira de Poseidón*, orbes, cofres con Ojos de Gorgona y Plumas de Fénix, checkpoints y el tramo de la nave con la Hidra.

| ID | Brecha | Criterio de aceptación | Depende del arte |
| --- | --- | --- | --- |
| **ESE-01** | **Remates contextuales (QTE).** Es el rasgo más reconocible y no existe en `src/sim/`; las capturas de *Betrayal* de `docs/referencias/` ya lo muestran. | Un enemigo aturdido o con poca vida permite un remate con un botón dentro de una ventana de entrada; resultado determinista, con prueba en un escenario del harness. | No (marcador visual provisional). |
| **ESE-02** | **No hay agarre.** ○ no tiene acción; el manual de PS2 lista el agarre con cadena y *Orion's Harpoon* (nivel 1). | Agarrar sujeta al enemigo unos ticks y permite lanzarlo o rematarlo; se integra con ESE-01 (BL-06 y BL-07). | Sí (poses). |
| **ESE-03** | **Impacto.** Hecho en parte (D-39): los golpes pesados paran el mundo más, empujan al blanco y sacuden la cámara, con chispas. Falta ajustar la sensación con la lista de la usuaria (BL-04). | *Hitstop*, temblor y empuje proporcionales al peso del golpe, valores en `CONFIG` y medidos en el harness. | No. |
| **ESE-04** | **Enemigos de un solo truco.** El legionario solo tiene un tajo con anticipación. | Al menos un segundo comportamiento que dé sentido a la guardia o a la magia (por ejemplo, un ataque que solo se puede parar). | No. |
| **ESE-05** | **Sin historia.** El título pasa directo al nivel. | Introducción mínima de texto, sujeta a la regla D-30: nunca puede estorbar las pruebas. | No. |
| **ESE-06** | **Un solo hechizo y pocos enemigos.** El primer juego tiene cuatro hechizos y más variedad. | Diferido hasta que exista el arte base. | Sí. |
| **ESE-07** | **El arte aún no transmite a Kratos** (pose única, enemigos provisionales, audio sintético). | Se resuelve con el trabajo ASCII ya planificado (borradores D-34 y su terminación). | Sí. |

**Orden recomendado:** ESE-03 (barato y de mayor efecto en la sensación), ESE-01 con ESE-02, ESE-04, ESE-05; ESE-06 y ESE-07 después. Los cuatro primeros avanzan mientras se redibuja a Kratos.

## 5. Método de dibujo para agentes

**Decisión:** el ASCII sigue siendo la fuente versionada (D-25), pero el agente deja de dibujar a ciegas. Lo que falló en los intentos archivados no fue el formato sino la falta de referencias y de retroalimentación: el agente situaba mal las partes y no podía comprobarlo. El método:

| Pieza | Qué es | Estado |
| --- | --- | --- |
| **Lienzo solo-cuerpo** | 64×56, pies en la fila 55. El 97×59 heredado reservaba espacio para armas y cadenas que ya no van en el sprite. La física no depende del lienzo (D-29). | Aplicado |
| **Tres pasadas** | Silueta (2 colores, la usuaria la aprueba), sombreado y contorno con detalle. Cada pasada es el cuadro completo dibujado a mano. | Regla vigente |
| **Vista previa con reglas** | `scripts/preview_grid.py`: ampliación con coordenadas y comparación lado a lado. Permite decir "codo en x=14, y=30" en vez de contar caracteres. | Existe |
| **Arranque desde referencia** | `scripts/quantize_reference.py`: recorta una región de una imagen existente y la convierte a `palette/kratos.json` por color más cercano (no por luminancia), como referencia ASCII para leer y calcar a mano. Escribe fuera de `grids/` (se niega a escribir dentro). Sus letras son por color, no por material; los roles se deciden al dibujar. | Existe |
| **Bucle visual** | El agente rasteriza, mira la vista previa ampliada, compara con la lista de comprobación y corrige, con un máximo de rondas. Requiere un modelo que vea imágenes. | Regla vigente |

**Regla dura:** ningún script, función o bucle puede generar o modificar el contenido de `grids/*.txt`. La única excepción es el borrador de D-34: `scripts/pose_render/to_grid.py` produce el grid inicial de un cuadro de animación, que después se termina con una herramienta de escritura de archivos, con filas literales.

**Borrador 3D (D-34), reemplaza la alternativa descartada:** el método de arriba no alcanzó la calidad de `idle-00` en los cuadros de movimiento. Ahora cada animación arranca de un render del maniquí CC0 de Quaternius:

1. `blender -b --python scripts/pose_render/render.py -- scripts/pose_render/kratos.json <acción> <carpeta> <cuadros> [poses/<pose>.json]` renderiza la acción con la complejidad de Kratos (volumen por hueso, faldón, cámara a 20°, luz arriba a la izquierda). Un archivo de `poses/` suma rotaciones por hueso cuando la acción no tiene la actitud de Kratos y puede fijar otra cámara (por ejemplo, `idle-pant-*.json` arman el jadeo encorvado del reposo con el pecho a 45°). El modelo se descarga en `docs/tmp/` (fuente en `kratos.json`).
2. `python3 scripts/pose_render/to_grid.py <render.png> <grid.txt> [--ground 55]` lo reduce a la paleta de Kratos: piel, cuero y sandalias por hueso, lado cercano y lejano, cuatro tonos y contorno; `--ground` apoya en el suelo las poses cuya raíz se despega (salto, rodada).
3. El borrador entra al juego como revisión pendiente para probar el movimiento. Cada cuadro nuevo se anota con su receta en `scripts/pose_render/frames.json` y se corre `python3 scripts/pose_render/build_anchors.py`, que exporta la espalda, la mano cercana (`hand`), la mano lejana (`farHand`) y el hombro cercano (`shoulder`) del esqueleto para las espadas y las cadenas. En los golpes, la pose puede ubicar cada mano en un punto con IK de dos huesos (`ik` en `poses/*.json`, con un polo para el codo), para que el brazo apunte a la hoja.
4. La terminación es a mano: la cabeza aprobada de `idle-00` dibujado a mano (`git show 0af23ae:grids/kratos/idle-00.txt`, filas 12 a 17) donde el render pone la cabeza, tatuaje con borde granate, hueco del cuello bajo la mandíbula, faldón y textura de tonos mezclados. La forma la da el render; a mano no se rehace la anatomía.

## 6. Moveset de nivel 1 de GoW 1: fuentes y decisiones

Criterio: se implementa lo que respaldan el manual oficial, el cartel del juego o los cuadros del video; lo que no tiene respaldo y la usuaria pide igual se hace y se anota como decisión suya. Los videos y capturas se usan solo como estudio (D-04).

**Fuentes:** manual oficial de PS2 en español (SCES-53133, archive.org `god-of-war-manueal-espan-ol-a-color`: controles de suelo y aire, sin lista de combos); video de la colección remasterizada con el nombre y los botones de cada golpe (YouTube `0X9RiODtCB4`, "Kratos Moveset Showcase"); guía de GameFAQs (A_I_e_x) y controles de Neoseeker (vía web.archive.org); wiki de Fandom *Blades of Chaos*. GameSpot, StrategyWiki y GameFAQs directos dan 403.

| Tema | Decisión | Respaldo |
| --- | --- | --- |
| Cadena de □ | 6 golpes; *Plume of Prometheus* tras □□△ | Cartel "Light Attack" del video (6 □) |
| △ | Tres niveles por tiempo: golpe (tajo doble secuencial, dos impactos de 10), lanzador (el enemigo sube, Kratos no) y *Ascension* (Kratos salta tras él) | Manual: "△ mantener: lanzar al enemigo y seguirlo"; GameFAQs: "Kratos salta con él"; Neoseeker: "lanzar, luego saltar". **Los tiempos y el tajo doble son de la usuaria** (pasos 68 a 71; sin fuente). |
| *Plume of Prometheus* | Tras 2, 3 o 4 □ + △. 1 □ + △ es el △ normal; 6 □ no encadena | *Plume* es de nivel 1 (StrategyWiki, *Chains of Olympus*: □□△). **La regla de 2 a 4 □ es de la usuaria** (pasos 74 y 76). |
| *Spirit of Hercules* | 5 □ + △: la cinemática de *Plume* más lenta, con salto corto hacia adelante, ralentización entre el ápice y el suelo, 64 de daño en total (dos impactos de 32) y fuego residual | **Sin respaldo.** En *Chains of Olympus* es △△△ de nivel 3; en el GoW 1 original no se confirmó. Decisión de la usuaria (pasos 75 a 78, D-41). |
| △ dentro de la cadena de □ | Arranca el △ normal desde la ventana de cualquier □ | Regla general de los combos; sin variantes propias en las fuentes |
| □ aéreo | 3 golpes distintos con la caída frenada | Cartel AIR □□□ y manual ("ataque horizontal") |
| △ aéreo | Lazo vertical y caída con impacto, igual tras cualquier □ aéreo | Cartel AIR △, manual ("ataque vertical") y video |
| Remate de □ (□6) | Empieza atrás, anillo de atrás hacia adelante y látigo doble al frente | **Decisión de la usuaria**: el análisis del video no fue concluyente |
| Ataque al salir de una rodada | Solo con búfer, sin golpes especiales | Sin respaldo; la evasión ofensiva es de nivel 4 |
| Remate aéreo fuerte (□□□△), dos niveles de lanzador en suelo | No existen (*Spirit of Hercules* es un remate de suelo, ver arriba) | Sin respaldo en ninguna fuente |
| Súper salto (X tras lanzar), agarre con cadena y *Orion's Harpoon* | Pendientes (BL-06); ○ = `L` (D-42), después del legionario con arte (BL-21) | Manual y wiki (nivel 1); en *Chains of Olympus*, ○ = *Orion's Harpoon* y X tras un salto = *Icarus Lift* (StrategyWiki) |

## 7. Legionario no-muerto: ficha de diseño (BL-21)

**Qué consta en fuentes:** es el soldado común de GoW 1; un concepto descartado era "un esqueleto con espada y escudo" y el legionario maldito es más blindado y de espadas más grandes (God of War Wiki, vía búsqueda; la página del legionario devuelve 402). No se pudo confirmar su casco, escudo ni sus ataques exactos.

**Diseño vigente (D-51, observado en el combate original de la cubierta del barco y aprobado por la usuaria):**

| Elemento | Diseño |
| --- | --- |
| Silueta | Bruto encorvado de torso grueso, piernas abiertas y rodillas flexionadas; se lee distinto de Kratos en una mancha de 2 colores. |
| Cabeza | Casco de bronce con cresta roja hacia atrás; la cara no tiene facciones (la usuaria lo aceptó). |
| Cuerpo | Piel gris cálida y oscura, torso costroso, paño oscuro en la cintura. **Sin escudo** (en el concepto inventado primero lo tenía y la referencia lo desmintió). |
| Arma | Espada larga de hoja curva color cobre, con filo claro, canal oscuro en el centro y guarda; se sostiene baja y mide lo mismo en pantalla en todas las poses. |
| Paleta | Propia (`palette/legionnaire.json`), 11 colores; el bronce y la cresta son el único acento cálido. |
| Cuadros | 27 cuadros aprobados en `grids/legionnaire/`: reposo `idle-00` (1), andar `walk-00..07` (8), aviso `windup-00..03` (4), tajo `slash-00..03` (4), recuperación `recover-00..02` (3), aturdimiento `hitstun-00..01` (2), aire `juggle-00..01` (2) y muerte `death-00..02` (3). |
| Lienzo | El mismo de Kratos, 64×56 con los pies en la fila 55, para reutilizar la física y la sombra. |

### Ritmo y conducta del legionario (diseño de combate 2D)

Pedido de la usuaria: en un *hack and slash* no deben caminar siempre hacia Kratos ni correr siempre; tienen que dar espacio, vigilar y turnarse.

| Fase | Qué hace | Cuadros que usa |
| --- | --- | --- |
| Centinela / Patrulla (`idle`, `patrol`) | Fuera del alcance de alerta (>160 px), alterna 50 ticks observando en reposo y 70 ticks patrullando a 30 px/s de un lado a otro. Si Kratos entra en rango, corta de inmediato para encarar. | `idle-00` y `walk-00..07`. |
| Acercarse (`approach`) | Camina hacia Kratos cerrando distancia (65 px/s) hasta 72 px. | Andar `walk-00..07`. |
| Guardia (`guard`) | A 72 px se detiene en postura de guardia entre 30 y 75 ticks, distintos por enemigo, para que un grupo no se mueva en bloque. Si Kratos se aleja más de 88 px, vuelve a perseguir. | Reposo `idle-00`. |
| Tajo frontal (`slash`) | Cuando termina la espera y hay turno libre (máx 2 atacantes), avanza y ataca: aviso (24 ticks, telégrafo con ojos encendidos), tajo con inercia hacia adelante (8 ticks, lunge a 80 px/s durante 5 ticks), recuperación (16 ticks). | Aviso `windup-00..03`, tajo `slash-00..03`, recuperación `recover-00..02`. |
| Derribo y levantada (`knockdown`, `get_up`, ESE-07) | Al azotar el suelo tras caer de suspensión aérea (`juggle`) o recibir un remate pesado (*Plume* o *Spirit*), queda derribado tendido 30 ticks (~500 ms) inhabilitado y tarda 15 ticks en ponerse de pie antes de reanudar el combate. Otorga control de masas y recompensa a los combos pesados. | Tendido `death-02` e incorporación `death-01`/`idle-00`. |
| Segundo ataque rompeguardias (ESE-04) | Ataque vertical descendente o estocada con aviso prolongado (36 ticks) y destello distintivo. Penetra la guardia pasiva (`Q`) causando daño y desestabilización; solo se elude rodando (`Shift`) o ejecutando *Parry* en el instante exacto. | Temporalmente sobre aviso/tajo con telégrafo visual hasta contar con cuadros finales. |
| Agarre con ○ (BL-06) | En proximidad cuerpo a cuerpo, pulsar `L` sujeta al legionario inmovilizando a ambos para rematarlo o lanzarlo como proyectil. | Poses de captura compartidas con Kratos. |

## 8. Nivel 1: Mar Egeo (D-44, D-45)

Recorrido decidido, fiel al del primer *God of War*. **Respaldo:** *Original* (fuentes al final de la sección), *Usuaria* o *Agente* (propuesta pendiente de aprobación). Las ideas que siguen abiertas están en `docs/ideas.md`.

### Recorrido

| # | Tramo | Qué pasa | Respaldo |
| --- | --- | --- | --- |
| 1 | Proa del primer barco | La jugabilidad empieza en la proa con no-muertos cortando el paso. Una segunda tanda rompe una reja del piso cerrada con cadenas y otros trepan por los costados. Punto de guardado (un haz de luz). La reja se abre machacando ○ (en el original, R2) y antes de bajar hay un cofre rojo. La puerta del camarote del capitán se ve, pero está cerrada. | Original [1] [4] [18] [19]; ○ en vez de R2: Usuaria |
| 2 | Interior: primer encuentro con la Hidra | Kratos recorre el interior del barco y a la mitad una cabeza irrumpe; solo se ven el cuello y la cabeza, que emerge desde abajo por el lateral derecho. Se golpea en la cara; cuando agita las orejas y se echa atrás, se bloquea. Al debilitarse aparece ○ sobre su cabeza ("Pulsa ○ para iniciar el minijuego cuando lo veas sobre la cabeza de un enemigo") y el remate pide más botones en pantalla (por ejemplo △). Pilas de escombros cierran el pasillo y se rompen a golpes. El contador de golpes se ve desde este combate. | Original [1] [2] [20]; puesta en escena: Usuaria |
| 2b | Vigas sobre la bodega inundada | Inmediatamente después de la Hidra: palos de equilibrio sobre agua baja. Ver "Vigas del vertical slice" en §10. | Original [20]; diseño 2D: Usuaria |
| 2c | El prisionero | Un tramo corto con un marinero encerrado en una celda. El texto sale abajo, en un recuadro de pergamino, y se avanza con ✕: "¡Sé quién eres, espartano! ¡Sé lo que has hecho! ¡Preferiría morir antes que ser salvado por ti!". Después, una reja (R2), un cofre de orbes rojos y la puerta a cubierta. | Original [20] |
| 3 | Cubierta: el caos y el segundo encuentro | Bajo la lluvia, marineros que huyen, no-muertos y arpías (el "caos" del vertical slice, §10). En el medio de la cubierta, otra cabeza sale del piso. La cabeza golpea a la izquierda, a la derecha y hacia la cámara (se esquiva rodando), y muerde sin que se pueda bloquear (se escapa machacando el agarre). Marineros que huyen (inofensivos, pueden soltar salud) y arpías en picada (se bloquean al oír su chillido). Cofre de orbes tras unas puertas que se levantan. | Original [1]. *Agente, pendiente:* en 2D el golpe "hacia la cámara" cae sobre la posición de Kratos con una sombra de aviso. |
| 4 | Agua | El agujero que deja la Hidra lleva a un tramo inundado que se cruza a pie: más lento, salto corto y sin doble salto, demasiado largo (o con techo bajo) para saltarlo de orilla a orilla. Se sale trepando una red. | Original [1] [4]; vadeo: Usuaria |
| 5 | Redes y vigas | Enemigos y vigas estrechas con una bifurcación: un lado lleva a un cofre de orbes rojos y hay que volver al centro para seguir. | Original [1] |
| 6 | Segundo barco | Cinemática de llegada. No-muertos con arco disparan desde el otro extremo; cajas grandes como cobertura (una patada cargada las desliza) y una caja chica que se empuja contra la pared para subir hasta ellos. Soldados espartanos moribundos en una cubierta inferior. | Original [1] [4] |
| 7 | Mástil | Escalera y red con enemigos que también trepan; el combate es limitado al trepar, conviene saltarlos. En la cima, una viga lleva a un cofre. | Original [1] |
| 8 | Cuerda al tercer barco | Kratos se desliza de lo alto del mástil al barco siguiente, siempre de un punto alto a uno más bajo. Sin enemigos. | Original [1] [4]; sin enemigos: Usuaria |
| 9 | Tercer barco | Tres paredes tapiadas: la del centro es el camino, una lateral guarda un Ojo de Gorgona y la otra un cofre de orbes. Tras un pasillo angosto, el salón de Poseidón: una plataforma con un símbolo azul brillante en el piso, entre dos estatuas; al pisarla, Poseidón le da a Kratos la *Ira de Poseidón* y enseguida aparecen enemigos para estrenarla. Cofres de salud y magia y una red larga hasta la cubierta del jefe. | Original [1] [4] [7] [8] |
| 10 | Jefe: la Hidra | Ver "Combate final". | Original; disposición: Usuaria |
| 11 | El capitán y la salida | Kratos se mete en la garganta de la Hidra, le arranca la llave del cuello al capitán y lo vuelve a tirar dentro. Junto al punto de guardado del otro lado de la arena hay dos cofres (el segundo Ojo de Gorgona). Una cuerda baja a una cubierta anterior, una caja chica sube a la plataforma superior y la llave abre el camarote ("Pulsa R2 para abrir la puerta con la llave del capitán"), lo que cierra el nivel. Poseidón nombra Atenas como el siguiente destino y al final aparece Atenea. | Original [1] [11] [12] [20] |

### Combate final contra la Hidra (D-45)

- **Arena:** dos cabezas menores, una a cada lado de la pantalla, y la principal arriba, junto a la cima del mástil central. Hay desplazamiento horizontal (cabezas laterales) y vertical (subir por la red hasta la principal). La cámara queda fija sobre la arena y muestra las tres cabezas (§9).
- **Fase 1, cabezas menores:** si Kratos trepa la red sin neutralizarlas, lo tiran. Se bloquea cuando una se echa atrás y se contraataca. Una cabeza derribada que se deja sola se recupera. Para anularla, se la derriba, se sube por una pila de cajas hasta una plataforma colgante con un pincho abajo y, al pisarla, el pincho cae y la clava a la cubierta. Las dos se resuelven igual.
- **Fase 2, cabeza principal:** avisa hacia dónde va a morder con un cabeceo. Se rueda al otro lado (o se la provoca para que muerda la plataforma de madera) y se contraataca. Con la vida baja aparece ○: Kratos la engancha con las espadas y estampa la cabeza contra el mástil. La vida de la Hidra se recupera y el ciclo se repite, y con cada golpe el mástil se quiebra más hasta quedar como una pica.
- **Remate:** Kratos le clava las espadas en los ojos, la engancha por los dos lados de la boca y salta del mástil tirando de ella. Al lanzarse hacia adelante, la Hidra se atraviesa la cabeza con la pica.
- **Depende de:** el agarre y los remates (BL-06, BL-07) y la cámara por zona (BL-23).

### Enemigos, recolectables y guardado

- **Enemigos (Usuaria):** arpías, no-muertos con espada (legionario, §7), no-muertos con arco y la Hidra. No hay gorgonas, sirenas ni minotauros. Los marineros y los soldados moribundos no atacan.
- **Recolectables:** 2 Ojos de Gorgona (tramos 9 y 11) y ninguna Pluma de Fénix [7]; cofres de orbes rojos, de salud y de magia en los tramos que los nombran.
- **Puntos de guardado confirmados:** 3, en los tramos 1, 9 y 11 [4] [13].
- **Poder nuevo:** la *Ira de Poseidón* (tramo 9). El Tridente no es de este nivel: se obtiene en el Desafío de Poseidón, en el Templo de Pandora [7].

### Por comprobar en el juego

Puntos que las fuentes no aclaran o en los que se contradicen. La usuaria los revisa en el juego o en gameplays y se anota acá el resultado.

| # | Qué comprobar | Por qué queda abierto |
| --- | --- | --- |
| P-01 | ~~Qué toca Kratos en el salón de Poseidón.~~ **Resuelto:** una plataforma con un símbolo azul en el piso, entre dos estatuas [20]. | Las guías decían "muro" [4] y "llama" [8]. |
| P-02 | Cuántas veces se estampa la cabeza principal contra el mástil antes del remate. | Las guías dicen tres o "varias" [1] [9]. |
| P-03 | Si hay más de tres puntos de guardado en el Egeo y dónde. | Ninguna fuente da el total. |
| P-04 | Qué ataques tiene la cabeza principal además de la mordida avisada con un cabeceo. | Las fuentes solo describen la mordida. |
| P-05 | Qué hay dentro del camarote del capitán y qué dice Atenea al cerrar el nivel (tramo 11). | El video muestra que se abre con R2 y que aparece Atenea, pero no se leyó el diálogo [20]. |
| P-08 | Cómo se ve la *Ira de Poseidón* del original (D-50). | Las fuentes la describen como una descarga de energía alrededor de Kratos que daña en un radio; el video [20] no la muestra usada. |
| P-09 | Nombre y orden de las pestañas del menú de pausa del original (§11). | Las guías solo dicen que Start abre las mejoras y que R1 o la cruceta cambian de pantalla [21]. |
| P-06 | Qué golpes tiene Kratos colgado de una cuerda horizontal y trepando una red. | La usuaria lo deja para después (D-44). |
| P-07 | En *Hollow Knight*, si mirar arriba o abajo exige estar quieto (§9). | La wiki no lo dice. |

### Fuentes

1. Recorrido del Mar Egeo, *Joshua Cheats & Walkthroughs* (2010): https://joshua-cheats-walkthroughs.blogspot.com/2010/05/aegean-sea-god-of-war.html
2. *God of War Wiki*, Hydra (vía buscador; da 402 a fetch directo): https://godofwar.fandom.com/wiki/Hydra
3. Wikipedia, *God of War (2005 video game)*: https://en.wikipedia.org/wiki/God_of_War_(2005_video_game)
4. StrategyWiki, *God of War / Aegean Sea* (vía buscador; da 403 a fetch directo): https://strategywiki.org/wiki/God_of_War/Aegean_Sea
5. *God of War Wiki*, Kratos' Fleet (vía buscador): https://godofwar.fandom.com/wiki/Kratos%27_Fleet
6. Itay Keren, *Scroll Back: The Theory and Practice of Cameras in Side-Scrollers* (GDC 2015): https://www.gamedeveloper.com/design/scroll-back-the-theory-and-practice-of-cameras-in-side-scrollers
7. StrategyWiki, *God of War / Gorgon Eyes* y *Phoenix Feathers* (vía buscador): https://strategywiki.org/wiki/God_of_War/Gorgon_Eyes · https://strategywiki.org/wiki/God_of_War/Phoenix_Feathers
8. PlayStationTrophies, guía de trofeos de *God of War* (vía buscador): https://www.playstationtrophies.org/game/god-of-war/guide/
9. GameFAQs, "How do I beat Boss Hydra Serpent?" (vía buscador): https://gamefaqs.gamespot.com/ps2/919864-god-of-war/answers/351441-how-do-i-beat-boss-hydra-serpent
10. Destructoid, *The Memory Card .27: The battle with the Hydra*: https://www.destructoid.com/the-memory-card-27-the-battle-with-the-hydra/
11. *God of War Wiki*, Captain (vía buscador): https://godofwar.fandom.com/wiki/Captain
12. IMDb, *God of War* (2005), personaje del capitán (vía buscador): https://www.imdb.com/title/tt0416779/characters/nm1584992/
13. *God of War Wiki*, Save Altar (vía buscador): https://godofwar.fandom.com/wiki/Save_Altar
14. *Hollow Knight Wiki*, Controls: https://hollowknight.wiki/w/Controls_(Hollow_Knight)
15. *Hollow Knight Wiki*, Updates (arreglo del "Camera Lock" de White Palace): https://hollowknight.wiki/w/Updates_(Hollow_Knight)
16. Mark Brown (*Game Maker's Toolkit*), *How to Make a Good 2D Camera*: https://gmtk.substack.com/p/how-to-make-a-good-2d-camera
17. Tutoriales que imitan la cámara de *Hollow Knight* (vía buscador): Sasquatch B Studios, https://www.patreon.com/sasquatchbgames/posts/unity-tutorial-79656408 · Terresquall, https://blog.terresquall.com/2023/04/creating-a-metroidvania-like-hollow-knight-part-1/
18. GameSpot, *God of War Walkthrough* (inicio en la proa; segunda tanda por una trampilla con cadenas): https://www.gamespot.com/articles/god-of-war-walkthrough/1100-6121675/
19. *gow-ash*, The Aegean Sea (reja que se abre machacando R2): http://gow-ash.blogspot.com/2010/03/aegean-sea.html
20. Video de la partida del Egeo (colección remasterizada, en español), visto por la usuaria y el agente; cuadros extraídos en `docs/tmp/egeo-video/`: https://youtu.be/f5Gq_zox7bI (minuto 5:10: vigas después de la Hidra; 6:20: el prisionero)
21. GameFAQs, guías del original (Start abre la pantalla de mejoras; se mejora manteniendo X con orbes suficientes): https://gamefaqs.gamespot.com/ps2/919864-god-of-war/faqs/37813 · https://gamefaqs.gamespot.com/ps2/919864-god-of-war/answers/245404-collecting-orbs-and-how-to-use-weapons

## 9. Cámara (D-46)

Modelo: la cámara de los metroidvania 2D actuales, como *Hollow Knight* [14] [15], con las reglas de seguimiento que recopilan Itay Keren [6] y Mark Brown [16]. Team Cherry no publicó el código de su cámara: lo que se atribuye a *Hollow Knight* sale de sus wikis y de tutoriales que la imitan [17], no de valores medidos. **Hoy:** la cámara solo sigue en horizontal (`ShellScene.applyCamera`, CAM-01) y `level1` mide 1440×270, una sola pantalla de alto; los barcos de varios pisos necesitan niveles más altos y seguimiento vertical.

**Principio:** los dos ejes no se tratan igual [16]. En horizontal la cámara acompaña a Kratos de forma continua y deja más pantalla adelante; en vertical se queda quieta mientras Kratos salta y se mueve solo cuando cambia de piso o cae.

**Cómo sigue a Kratos**

| Regla | Qué hace la cámara |
| --- | --- |
| Zona muerta (*camera-window*) | Kratos se mueve, da pasos cortos o gira dentro de un rectángulo central sin que la cámara reaccione; la cámara arranca cuando él empuja el borde [6] [16]. |
| Seguimiento suavizado (*lerp-smoothing*) | La cámara nunca se pega al píxel de Kratos: en cada tick recorre una fracción fija de la distancia que le falta. Un suavizado demasiado lento deja a Kratos delante de la cámara y se come el espacio de adelante [16]. |
| Adelanto horizontal (*dual-forward-focus*) | El objetivo de la cámara va desplazado hacia donde mira Kratos (`facing`), para ver más de lo que viene que de lo que quedó atrás. Al girar, el objetivo pasa al otro lado y la cámara se desliza hasta él, sin saltar (*Cave Story*, *Hollow Knight*) [16] [17]. |
| Saltos sin mover la cámara (*platform-snapping*) | Mientras Kratos sube y baja dentro de un salto, el eje Y no se mueve. Al aterrizar en una plataforma de otra altura, la cámara se reacomoda suavemente a ese piso: "la cámara se mueve cuando aterrizas, no a mitad del salto" [6] [16]. |
| Caídas | Si Kratos cae por debajo de un umbral (sale por abajo de la zona muerta o cae de un piso), la cámara lo sigue hacia abajo, más rápido que al subir, para que se vea dónde va a aterrizar (*fast Y damping when falling* en los tutoriales que imitan *Hollow Knight*) [17]. |
| Encuadre bajo | Kratos va un poco por debajo del centro de la pantalla, para dejar espacio arriba [16]. |
| Pausa al recibir daño | Cuando Kratos recibe un golpe, la cámara se frena un instante, como en *Hollow Knight* [16]. Se suma al temblor de los golpes que ya existe (D-39). |

**Límites y zonas**

| Regla | Qué hace la cámara |
| --- | --- |
| Límite de borde (*edge-snapping*) | Nunca muestra nada fuera del nivel ni dentro de los muros [6] [16]. |
| Cámara fija por zona (*region-based-anchors*) | Cada zona puede fijar su propio encuadre o trabar un eje; en los jefes la cámara queda trabada sobre la arena y el jugador nunca tiene que acomodarla, como en *Hollow Knight* [14] [15]. La arena de la Hidra muestra las tres cabezas (§8). |

**Además:** mantener una entrada desplaza la cámara para mirar arriba o abajo, como en *Hollow Knight* [14] (si exige estar quieto: P-07). Es un control del jugador, no parte del seguimiento.

## 10. Vertical slice (D-47)

El vertical slice muestra la calidad final en un tramo corto del Egeo. No es el Nivel 1 completo (once tramos y tres barcos). Lo que entra en la primera versión y no en el slice está marcado como tal.

### Recorrido

| # | Tramo | Qué pasa (detalle del original en §8) |
| --- | --- | --- |
| 1 | Cómic de apertura | Kratos en el acantilado ("Los dioses del Olimpo me han abandonado") se tira al mar; "tres semanas antes", la flota en el Egeo atacada por la Hidra. Se salta con cualquier acción (D-30). Debe mostrar que Kratos tiene la *Ira de Poseidón*, o nadie la va a usar. |
| 2 | Proa | No-muertos con espada cortan el paso; una segunda tanda rompe la reja del piso y otros trepan por los costados (§8, tramo 1). |
| 3 | Escotilla y cofre | La escotilla se abre machacando ○. Cofre rojo. |
| 4 | Interior del barco y primera Hidra | Recorrido hasta la mitad del barco y combate con la cabeza, con el remate completo de ○ (requiere el agarre y los remates, BL-06 y BL-07) (§8, tramo 2). |
| 5 | Vigas | Circuito de equilibrio sobre la bodega inundada (abajo). |
| 6 | El prisionero | Diálogo en texto abajo de la pantalla (§8, tramo 2c). |
| 7 | Cofre y puerta al caos | Cofre de orbes rojos y la puerta que da a cubierta: marineros que huyen, no-muertos, arpías volando y una Hidra devorando a alguien. **Por definir según el tiempo:** jugable o solo mostrado. |

**Fuera del slice (primera versión):** el resto del Egeo (§8, tramos 3 a 11), la entrega de la *Ira* en el salón de Poseidón y la mejora completa de armas (§11).

### Vigas del vertical slice

Diseño de la usuaria; en el original las vigas están justo después de la primera Hidra [20], pero en 3D son cortas. En 2D no hay profundidad, así que el circuito es más largo y se arma con alturas:

- **Recorrido:** saltos altos para alcanzar las vigas que siguen, saltos a vigas más bajas y, cerca del final, unos saltos que piden un doble salto preciso.
- **Maderos que ceden:** algunos tablones ceden al poco de pisarlos; otros se caen apenas Kratos los toca y lo dejan colgando del borde, y se sube machacando saltar. Se distinguen un poco de los firmes, pero no tanto: el jugador debería caer al menos una vez.
- **Un tablón caído no vuelve:** el que ya hizo tambalear a Kratos desaparece, porque se cayó.
- **Dos tablas falsas:** una en el primer tramo y otra antes del final, cuando el jugador ya se olvidó de la primera. Si la ve, la salta; si no, cae y repite el circuito.
- **El agua de abajo es baja (D-44):** no se nada; Kratos camina más lento, el salto es corto y no hay doble salto. Una escalera al inicio de las vigas permite volver a subir.

### Cómic

- Cada hoja se compone de paneles, y cada panel tiene texto.
- Cada panel entra con un efecto que refuerza la escena: desvanecido, entrada de golpe, sacudida.
- Las onomatopeyas típicas ("¡PAM!", "¡PUM!") aparecen dibujadas con su sonido.
- Restricción vigente: D-30 (se salta con cualquier acción y nunca estorba las pruebas).

## 11. HUD, combate visible y menús (D-48, D-49, D-50)

- **Guardia:** Kratos cruza las dos Espadas del Caos al frente. Hoy la guardia muestra `idle-00` quieto con una sola cuchilla (D-29).
- **HUD:** barras simples de vida, magia y orbes sobre una Espada del Caos dibujada con cuidado: la espada es lo que tiene que ser bonito, no las barras. Es la composición del original [20].
- **Contador de golpes ("Impactos"):** visible durante el combo, con el multiplicador de orbes de D-49.
- ***Ira de Poseidón*:** la heredada se rehace para parecerse a la del original: una descarga de energía alrededor de Kratos que daña todo en su radio (su aspecto exacto: P-08). En el slice está activa desde el inicio.
- **Menú principal:** vertical slice: Nuevo juego, Opciones (volumen, controles, saltar el cómic) y Créditos. Primera versión: suma Continuar, Dificultad y Extras (galería, desafíos). Se pule con el tiempo.
- **Menú de pausa (por pestañas, como el original [21]):** armas y mejora (en el slice, una sola mejora real de las Espadas del Caos con orbes rojos; en la primera versión, la mejora completa de armas y magia), ataques disponibles y opciones. Nombres y orden de las pestañas: P-09.
