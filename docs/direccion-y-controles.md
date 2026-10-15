# Dirección y controles del juego objetivo

## Estado

El runtime actual es un shell neutral Phaser/Vite en lienzo lógico horizontal de **320×180**. No implementa movimiento, combate, HUD ni controles de juego. Este documento fija la intención para una adaptación futura; no es una descripción de la aplicación ejecutable.

## Dirección

La historia corresponde al primer *God of War* de PS2. La estética, lectura de combate, estructura lateral y ritmo de segmentos breves toman *God of War: Betrayal* como estudio de referencia, sin trasladar su argumento ni copiar sus recursos. El mar Egeo y la Hidra son el primer objetivo narrativo propuesto. La jugabilidad lateral de *Betrayal* es el **baseline a igualar o superar** (D-20); ver la sección siguiente.

La presentación futura será pixel art original a 480×270. Kratos, amenazas y bordes transitables deben distinguirse por silueta, contraste y agrupación de píxeles; los efectos no deben ocultar ataques anunciados ni zonas peligrosas. Escalar el canvas a una ventana amplia del navegador con pixelado nítido y sin suavizado; la resolución interna no limita el tamaño CSS. La guía vigente es [`guia-visual-betrayal-pixel-art-v2.md`](guia-visual-betrayal-pixel-art-v2.md), aún sin muestra visual activa.

## Base de jugabilidad y verticalidad (D-20)

La jugabilidad lateral de *God of War: Betrayal* es el **punto de partida a igualar o superar**, no solo una referencia estética: ritmo de acción lateral, combate por combos, saltos y —de forma explícita— su **verticalidad** (ascensos, saltos entre niveles, plataformas y peligros a distintas alturas). Esa base se optimiza y se adapta a lo que ocurre en GOW1, cuya escala, variedad de enemigos y momentos narrativos superan a los de un juego de móvil de 2007.

Dos capas que no deben confundirse:

- ***Betrayal* (formato y sensación):** estructura lateral, lectura de combate, verticalidad y ritmo de subniveles breves.
- **GOW1 (historia y contenido):** argumento, escala, repertorio de enemigos y momentos como el Egeo y la Hidra.

«Igual o mejor que *Betrayal*» es una **intención de diseño**, no un criterio medible: se concreta en los criterios de las etapas (respuesta al input, coyote time, buffer de salto y objetivos de alcance vertical en movimiento y plataformas), no como afirmación de superioridad. La superación esperada es respecto al **alcance de la versión web** (encuadre 480×270 y entrada de teclado), no un juicio sobre el juego original. Todo arte, audio y código siguen siendo originales (D-04).

## Mapa de teclado propuesto

El teclado será la entrada de primera entrega. Las teclas físicas se convertirán en acciones explícitas en un único gestor de entrada. **Ninguna de estas acciones está implementada actualmente.**

| Acción objetivo | Entrada propuesta | Uso previsto |
| --- | --- | --- |
| Mover a izquierda/derecha | `A` / `D` o `←` / `→` | Recorrido horizontal. |
| Saltar | `Espacio` | Salto y control aéreo cuando la etapa correspondiente exista. |
| Ataque ligero | `J` | Golpe rápido; encadenamiento se definirá en su etapa. |
| Ataque pesado | `K` | Golpe más comprometido, a definir y probar por separado. |
| Esquivar | `Shift` | Evasión direccional, pendiente de diseño y verificación. |
| Acción contextual | `E` | Abrir cofres, activar mecanismos o ejecutar una acción indicada por un prompt explícito. |
| Pausar/continuar | `Escape` | Menú de pausa cuando exista. |

La acción contextual tiene una tecla separada de los ataques `J` y `K`. El juego deberá mostrar cuándo `E` tiene efecto; no se asumirá una interacción si no hay objetivo válido. Se puede cambiar el mapeo durante diseño futuro, con el cambio registrado aquí y en el README.

## Alcance de plataformas

La primera entrega apunta a navegador y teclado. El soporte táctil queda fuera del primer alcance y puede evaluarse como ampliación futura. No se interpreta la ausencia de táctil como una limitación del shell neutral.

## Principios de lectura y respuesta

1. Movimiento, salto, ataques y evasión deben responder de forma clara y poder evaluarse en juego con sus controles normales.
2. Preparación, impacto y recuperación deben coincidir entre animación, estado y colisión.
3. Los enemigos y peligros anuncian ataques con señales legibles; partículas y cámara apoyan esa lectura sin taparla.
4. La simulación futura determina las reglas. Las escenas Phaser presentan sus estados; el HUD y los menús densos se implementan en DOM cuando corresponda.
5. Todo arte y audio integrado debe ser original. El tablero externo de [referencias a *Betrayal*](referencias/god-of-war-betrayal.md) es solo para estudio.
