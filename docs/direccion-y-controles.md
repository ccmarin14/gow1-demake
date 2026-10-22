# Dirección y controles del juego objetivo

## Estado

El runtime actual es un shell Phaser/Vite en lienzo lógico horizontal de **480×270** (D-12) que ya implementa **movimiento horizontal, salto y plataformas, y un ataque ligero con combo** con controles de teclado, además de una animación idle↔run **provisional**. **No** implementa enemigos con IA, daño, muerte, HUD de juego ni audio. Este documento fija la intención para la adaptación futura; a 2026-10-16 la aplicación ejecutable ya cubre los controles listados en la sección «Acciones de entrada».

## Dirección

La historia, el lore, los enemigos y el repertorio completo de armas y ataques provienen del primer ***God of War* (2005, PlayStation 2)** (D-03, D-24). La estética pixel art, la cámara y la lectura espacial en desplazamiento lateral toman *God of War: Betrayal* únicamente como estudio de formato 2D, sin trasladar su argumento, sus ataques simplificados ni copiar sus recursos. El mar Egeo y la Hidra son el primer objetivo narrativo propuesto. La jugabilidad lateral toma la referencia de encuadre 2D de *Betrayal* como **baseline espacial** (D-20), pero ejecuta los ataques y mecánicas originales del juego de PS2 traducidos al plano 2D (D-24); ver la sección siguiente.

La presentación es pixel art original a 480×270. Kratos, amenazas y bordes transitables deben distinguirse por silueta, contraste y agrupación de píxeles; los efectos no deben ocultar ataques anunciados ni zonas peligrosas. Escalar el canvas a una ventana amplia del navegador con pixelado nítido y sin suavizado; la resolución interna no limita el tamaño CSS. La guía vigente es [`guia-visual-betrayal-pixel-art-v2.md`](guia-visual-betrayal-pixel-art-v2.md).

## Base de jugabilidad, verticalidad y combate de PS2 en 2D (D-20, D-24)

Dos capas claras que definen el proyecto:

- ***God of War* (2005, PS2 — historia, enemigos, armas y ataques):** argumento, escala, repertorio de enemigos, momentos narrativos (Egeo, Hidra) y **todos los ataques iniciales de las Cuchillas del Caos (Nivel 1)** traducidos al plano 2D con impacto físico de las cadenas contra el suelo (`yTop`) y contra los enemigos (*hitstop*, retroceso horizontal `vx` y levantamiento aéreo *launch* `vy`).
- ***God of War: Betrayal* (solo referencia de cámara y encuadre 2D):** estructura de desplazamiento lateral, lectura de siluetas en 2D, verticalidad de plataformas y ritmo de subniveles breves.

Todo arte, audio y código siguen siendo originales (D-04).

## Mapa de teclado propuesto (equivalencia con mando de PS2 — D-08, D-24)

El teclado es la entrada de primera entrega. Las teclas físicas se convierten en acciones explícitas en un único gestor de entrada (`InputManager`), mapeando directamente los botones de combate de PlayStation 2 al plano 2D:

| Acción de dominio | Tecla | Botón PS2 equivalente | Movimientos de *God of War* (2005, Nivel 1) en 2D |
| --- | --- | --- | --- |
| `move-left` / `move-right` | `A` / `D` o `←` / `→` | Stick izquierdo | Recorrido horizontal y orientación (`facing`). |
| `jump` | `Espacio` | **Equis ($\times$)** | Salto simple, doble salto (*Ícaro*) y habilitación de ataques aéreos. |
| `light-attack` | `J` | **Cuadrado ($\square$)** | Tajos rápidos encadenados de las Cuchillas del Caos (barridos horizontales/diagonales e impacto final; malabares en el aire). |
| `heavy-attack` | `K` | **Triángulo ($\triangle$)** | Golpe pesado descendente contra el suelo, *Launcher* ascendente (*Ascension* al mantener `K` o segundo golpe que eleva al enemigo al aire), remate ***Plume of Prometheus* (`J, J, K` = $\square, \square, \triangle$)** que azota las cadenas contra el suelo (`yTop`) con onda expansiva, y picado aéreo contra el suelo. |
| `grab` | `L` | **Círculo ($\bigcirc$)** | Agarre a distancia con lanzamiento de cadena / derribo o remate contextual sobre enemigos vulnerables. |
| `dodge` | `Shift` | Stick derecho (*Evade*) | Rodada terrestre con i-frames (`GOW8B-ROLL-01`). |
| `magic` | `U` | **L2** | Magia activa (Ira de Poseidón), separada de `K` para no colisionar con Triángulo ($\triangle$). |
| `context-action` | `E` | **R2** | Interacción con el entorno: abrir cofres, activar palancas o mecanismos con prompt explícito. |
| `pause` | `Escape` | **Start** | Menú de pausa cuando exista. |

El agarre de combate (`L` = $\bigcirc$) está separado de la interacción ambiental con cofres/palancas (`E` = R2) y la magia (`U` = L2) está separada del ataque pesado (`K` = $\triangle$). Se puede ajustar el mapeo durante diseño futuro, manteniendo sincronizados este documento, `docs/decisiones.md` y `README.md`.

## Alcance de plataformas

La primera entrega apunta a navegador y teclado. El soporte táctil queda fuera del primer alcance y puede evaluarse como ampliación futura. No se interpreta la ausencia de táctil como una limitación del shell actual.

## Principios de lectura y respuesta

1. Movimiento, salto, ataques y evasión deben responder de forma clara y poder evaluarse en juego con sus controles normales.
2. Preparación, impacto y recuperación deben coincidir entre animación, estado y colisión.
3. Los enemigos y peligros anuncian ataques con señales legibles; partículas y cámara apoyan esa lectura sin taparla.
4. La simulación futura determina las reglas. Las escenas Phaser presentan sus estados; el HUD y los menús densos se implementan en DOM cuando corresponda.
5. Todo arte y audio integrado debe ser original. El tablero externo de [referencias a *Betrayal*](referencias/god-of-war-betrayal.md) es solo para estudio.
