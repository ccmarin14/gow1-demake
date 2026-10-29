# Guía visual v2: Betrayal en pixel art

**Estado:** criterio visual vigente para trabajo futuro; no hay una muestra visual activa.  
**Resolución interna objetivo futura:** 480 × 270 (D-12); el shell ejecutable actual sigue en 320 × 180.  
**Uso:** guía de estilo; no es un asset integrado ni una implementación visual del shell.

Esta versión reemplaza para trabajo nuevo las reglas técnicas de [`guia-visual-betrayal-pixel-art.md`](guia-visual-betrayal-pixel-art.md). La guía textual anterior se conserva como historia, pero sus muestras visuales fueron eliminadas por solicitud del usuario y ya no están disponibles. La adaptación sitúa el inicio del primer *God of War* de PS2 en el mar Egeo y busca la lectura lateral, la claridad de acción y la atmósfera de *Betrayal*. No copia sprites, pantallas, mapas, tiles ni composiciones concretas.

## Contexto y límites de referencia

El artículo escrito de [Pocket Gamer (10 de mayo de 2007)](https://www.pocketgamer.com/god-of-war-betrayal/hands-on-with-god-of-war-betrayal-on-mobile-plus-first-21-screens/) describe para *Betrayal* efectos pixelados y fondos desplazables detallados; se mantiene como contexto de presentación, no como especificación visual. El tablero local de [referencias de *Betrayal*](referencias/god-of-war-betrayal.md) contiene 18 imágenes externas para estudio, no evidencia ni assets del proyecto. La captura/collage de IGDB inspeccionada anteriormente aporta contexto limitado sobre sprites pequeños, lectura lateral y contraste; una imagen aislada no certifica fidelidad general ni animaciones. Ninguna medida, color o forma de esta guía se atribuye al juego de referencia.

## Reglas de producción

### Píxel y contorno

- La unidad lógica futura es **1 × 1 px**. Se permiten coordenadas pares e impares; dibuja y evalúa a 480 × 270, sin ajustar cada forma a una cuadrícula 2 × 2.
- Presenta el canvas escalado para ocupar una ventana amplia del navegador, con pixelado nítido y sin suavizado. La resolución interna no limita el tamaño CSS. Al ampliar, usa **nearest-neighbor** y una escala entera siempre que el viewport lo permita. En SVG, usa geometría de coordenadas enteras y `shape-rendering="crispEdges"`; no introduzcas blur, filtros, degradados o bordes subpíxel.
- El contorno selectivo suele tener **1 px**. Sube a 2 px solo donde una oclusión necesite separar planos o cerrar una silueta. No rodees cada detalle interior con un borde uniforme.
- Construye escalones con longitudes variables y cambios de ritmo: evita repetir franjas de igual anchura y perfiles ortogonales continuos cuando la forma permita una articulación o una curva escalonada.

### Agrupación, anatomía y lectura

- Cada agrupación conectada debe explicar anatomía, material, luz o movimiento. Alterna grupos de 1–5 px según la forma; no agregues ruido decorativo sin función.
- Representa hombro, codo, muñeca, cadera, rodilla y tobillo mediante cambios de dirección o separación de masas. Mantén **espacio negativo** entre brazos, torso, piernas y armas para que cada pieza sobreviva a tamaño nativo.
- Evita extremidades hechas como barras rectangulares, torso/cabeza reducidos a cajas rígidas y bandas repetidas que homogenicen cielo, mar o cubierta.
- Lee cada figura en silueta y en color. La forma debe seguir siendo reconocible al quitar sus detalles interiores.

### Jerarquía de escena

Orden de lectura: **Kratos y sus armas → amenaza/enemigo activo → borde y cubierta transitable → mar, casco y tormenta**. El personaje y la amenaza usan la mayor separación de valor; el cielo y el mar usan menos contraste y menos cambios locales. El fondo puede sugerir profundidad, pero no debe competir con articulaciones, armas, siluetas o señales de peligro.

Usa hasta tres planos amplios durante el combate: cielo distante, mar/casco intermedio y cubierta/personajes al frente. El mar se organiza con trazos quebrados y escasos; el casco, con planos de madera largos pero no bandas repetidas; la tormenta, con masas separadas y pocos acentos de relámpago. Conserva un corredor horizontal limpio para leer el movimiento lateral.

## Paleta coordinada

La siguiente paleta es propia de esta adaptación. Un personaje usa una selección pequeña; la escena completa no debe exceder estos 19 tonos sin justificar un material o iluminación nuevos.

| Hex | Rol | Uso |
| --- | --- | --- |
| `#08151F` | Tinta fría | Contorno profundo, cavidades y sombra de mar. |
| `#122530` | Cielo lejano | Base oscura del cielo. |
| `#233A45` | Nube | Masa de tormenta, sin detalle repetido. |
| `#35545C` | Plano distante | Bruma, silueta lejana y transición de profundidad. |
| `#B6D6CE` | Relámpago | Acento frío de uso escaso. |
| `#0B2F40` | Mar | Base profunda del mar. |
| `#15566A` | Ola | Plano medio y líneas de corriente. |
| `#397B87` | Espuma | Reflejos breves y bordes de ola. |
| `#241D20` | Tinta cálida | Contorno de madera o metal cuando el frío no separa el material. |
| `#493228` | Madera en sombra | Huecos de cubierta y casco. |
| `#76513A` | Madera | Tablazón y costado del barco. |
| `#B27C4B` | Madera/bronce | Luz cálida de madera y piezas metálicas puntuales. |
| `#E8D5BD` | Piel | Piel pálida iluminada de Kratos. |
| `#A6AAA2` | Piel en sombra | Volumen y giro de la anatomía. |
| `#A83238` | Marca y faldón | Identidad roja de Kratos; no usar como textura ambiental. |
| `#C18C4E` | Bronce | Hebillas, brazales y piezas de armadura. |
| `#4D705D` | Escama | Masa principal de la Hidra. |
| `#89A177` | Escama iluminada | Planos del hocico y cresta de la Hidra. |
| `#F0B84D` | Peligro/ojos | Ojo visible o señal activa; pocos píxeles, nunca decoración repetida. |

Evita negro o blanco puros. Mantén piel y armas más luminosas que el entorno inmediato; separa a la Hidra con silueta oscura y un ojo pequeño de alto contraste, no con grandes áreas amarillas.

## Proporciones y siluetas

- **Kratos:** como punto de partida de producción, prueba una altura visible aproximada de 57–63 px (proporción equivalente al rango anterior de 38–42 px en 320 × 180). No es un requisito final comprobado; ajústala al evaluar la composición a resolución nativa. Deben leerse piel pálida, marca roja, faldón, bronce y **dos** hojas con cadenas quebradas. Las cadenas no son líneas continuas; dejan huecos entre eslabones y se separan del torso.
- **Enemigo humano:** casco, hombros protegidos y arma propia en valores más oscuros/cálidos que Kratos. Separa casco, cuello, brazo armado, torso y piernas; evita una sola masa rectangular.
- **Hidra:** cabeza grande respecto a Kratos; ojo, hocico y mandíbula deben reconocerse de inmediato. La dirección de la cabeza se lee por nariz/hocico y línea de boca, no solo por color.
- **Barco:** tablazón, baranda y costado diferencian madera por dirección y valor; la cubierta caminable queda estable y horizontal. Mar y tormenta comunican profundidad sin cubrir la línea de pies.

## Sustitución de reglas de la guía anterior

| Regla anterior | Regla v2 para trabajo nuevo | Motivo |
| --- | --- | --- |
| Bloques 2 × 2 como unidad normal | Píxel lógico 1 × 1; cada forma elige su tamaño de clúster | Permite modelar articulaciones, marcas y cadenas sin convertirlas en bloques. |
| Alinear todos los detalles a coordenadas pares | Se permiten coordenadas impares | El contorno puede escalonarse según la anatomía y el movimiento. |
| Evitar píxeles individuales | Usar 1 px solo cuando defina un rasgo legible, como un eslabón, ojo o filo | La unidad pequeña tiene función semántica; no se usa como ruido. |
| Contorno fijo de 2 px | Contorno selectivo de 1 px; 2 px solo en oclusiones | Reduce el aspecto de pegatina y recupera espacio interno de la figura. |
| Agrupaciones compactas uniformes | Grupos conectados de tamaño y escalón variables | Describe materia y forma en vez de repetir mosaicos. |

## Muestra y evaluación

La muestra original vinculada a la revisión anterior se describió como SVG editable con `viewBox="0 0 320 180"` y PNG renderizado a tamaño nativo sin suavizado. Ambos archivos fueron retirados por solicitud del usuario y ya no están disponibles. El material es historial, no un baseline visual inspeccionable; nada de ese arte se integró al shell.

**Observación del material anterior:** el SVG histórico usa muchos rectángulos largos y escalones regulares; en la previsualización 640 × 360 el cuerpo de Kratos y el soldado se leen como masas ortogonales amplias, y la densidad de detalle del mar/cubierta es más uniforme que la de las figuras. El arma tendida hacia el soldado también reduce el espacio negativo entre siluetas. Son observaciones de los archivos locales, no una comparación directa con *Betrayal*.

**Preferencia de producción v2:** las figuras se construyen con hombros, codos, rodillas y pies que cambian de dirección, armas con huecos visibles y grupos de escalón variable; el cielo y el mar usan menos marcas locales. Esto debería reducir la lectura de bloques genéricos porque la forma depende de relaciones anatómicas y espacios entre piezas, no de aumentar el número de rectángulos. La expectativa debe contrastarse a tamaño nativo cuando se produzca una nueva muestra.

La siguiente etapa visual deberá crear una **nueva referencia horizontal original a 480×270**, usando el tablero de 18 imágenes solo como estudio. Las muestras retiradas y su evaluación se conservan como historial escrito, no como baseline visual activo. Ninguna etapa de desarrollo está activa ahora.
