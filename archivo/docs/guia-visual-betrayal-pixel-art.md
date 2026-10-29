# Guía visual: Betrayal en pixel art

Esta guía fija las reglas para crear arte original del juego a **320 × 180**. Toma de *God of War: Betrayal* su presentación de acción lateral y su combinación de combate, saltos y escenarios con fondos desplazables; la historia y los rasgos de Kratos corresponden al primer *God of War* de PlayStation 2. No se reproducen sprites, pantallas, tiles ni recursos de esos juegos.

## Referencia y decisiones del proyecto

**Rasgos documentados de Betrayal:** las reseñas describen una aventura 2D lateral, combate de combos, saltos/plataformas, efectos de impacto y fondos desplazables detallados. El productor explicó que el equipo construyó variedad de escenarios a partir de un tileset y un esquema de paleta, y que equilibraba arte de personajes, cuadros de animación, entorno y límites del teléfono. Son referencias de composición y prioridades, no especificaciones de resolución o tamaño de píxel. [Pocket Gamer: avance](https://www.pocketgamer.com/god-of-war-betrayal/hands-on-with-god-of-war-betrayal-on-mobile-plus-first-21-screens/) · [Pocket Gamer: reseña](https://www.pocketgamer.com/god-of-war-betrayal/review/) · [Entrevista al productor en Engadget](https://www.engadget.com/2007-08-29-phil-cohen-talks-up-god-of-war-betrayal.html).

**Decisiones propias de esta adaptación:** el lienzo lógico es 320 × 180; el muestreo base es 2 × 2 píxeles; la paleta y las medidas siguientes son reglas de producción del proyecto, no datos de Betrayal. La escena inicial adapta el Egeo y el barco del juego de PS2. La muestra SVG es una maqueta de estilo, no un recurso integrado ni arte final.

## Lienzo, cuadrícula y agrupación

- Dibuja y evalúa en el lienzo lógico de **320 × 180**. Amplía con factor entero y sin suavizado; no juzgues el arte solo en una ampliación interpolada.
- La unidad de construcción normal es un bloque de **2 × 2 píxeles lógicos**. Alinea contornos, escalones, tablas, nubes y clústeres a coordenadas pares. No uses ruido de píxeles sueltos para simular textura.
- Reserva bloques de **1 × 1** para acentos indispensables —brillo de ojo, filo, chispa o hebilla— y nunca para dibujar texturas repetitivas o bordes completos.
- Usa grupos compactos de 2–8 píxeles para cada plano de luz o sombra. Cada clúster debe describir volumen, material o movimiento; elimina puntos aislados que no cambien la lectura a tamaño nativo.
- Las animaciones conservan el mismo rectángulo de cuadro y el anclaje de los pies. No cambies el tamaño aparente del personaje entre poses.

## Paleta de trabajo

Usa esta paleta común como punto de partida; un asset puede omitir colores, pero no debe introducir tonos nuevos sin justificar el material o la iluminación. El máximo recomendado es **12 colores por personaje** y **16 colores visibles en una escena**. Las variaciones de tormenta pueden sustituir un tono de fondo por otro, no multiplicar tonos casi iguales.

| Hex | Uso reservado |
| --- | --- |
| `#0B1118` | Silueta, contorno profundo y cavidades. |
| `#17232D` | Cielo más lejano y sombra fría. |
| `#283A45` | Nubes, casco lejano y plano de fondo. |
| `#47616A` | Luz fría de tormenta, formas intermedias y cresta de espuma. |
| `#A7C5C1` | Relámpago y reflejo puntual; uso escaso. |
| `#123246` | Mar profundo. |
| `#1E5265` | Olas en plano medio. |
| `#352820` | Sombra de madera y tablazón. |
| `#644333` | Madera principal del barco. |
| `#9A6845` | Borde iluminado de madera. |
| `#C39056` | Bronce y pequeños remaches. |
| `#A9AAA0` | Sombra de piel de Kratos. |
| `#E0D8C7` | Piel pálida de Kratos y luz cálida. |
| `#A93732` | Marca de guerra y faldón de Kratos. |
| `#527160` | Escamas de la Hidra y otros monstruos. |
| `#E9B756` | Aviso de peligro, ojo o chispa; nunca decoración ambiental repetida. |

El contorno usa el tono profundo de la zona (tinta fría en cielo/mar; marrón oscuro en madera solo cuando el material lo exige). Evita negro puro, blancos puros y degradados. Cada material tiene un color base, una sombra y, como máximo, un tono de luz; reserva el cuarto tono para un acento puntual.

## Contornos, profundidad y jerarquía

- Construye siluetas con una línea exterior de **2 px lógicos**. Puedes abrirla a 4 px en el lado en sombra de formas grandes; no rodees cada detalle interior.
- Orden de lectura en pantalla: **Kratos y su arma → señal de ataque/enemigo activo → superficie segura y borde de plataforma → escenario y clima**. Una amenaza nunca comparte valor y color con el fondo inmediato.
- Mantén una diferencia clara de luminosidad entre sujeto y fondo: personajes y avisos deben conservar forma si la escena se ve en escala de grises. El cielo y el mar usan menos contraste y clústeres mayores que el primer plano.
- Reserva el ámbar `#E9B756` para anticipaciones y peligros activos. Reserva el rojo `#A93732` para la identidad de Kratos y daño; no lo uses en la madera ni en rayos de fondo.
- La lluvia se dibuja en trazos cortos de 2–4 px y baja densidad. No atraviesa cara, arma ni señales activas. La espuma usa unos pocos grupos horizontales, no ruido continuo.
- Los fondos pueden tener detalle en capas desplazadas, como los fondos detallados y desplazables descritos para Betrayal; el proyecto limita su contraste para que el combate siga siendo el primer plano.

## Proporciones, anclajes y formas

Medidas iniciales en píxeles lógicos. Son proporciones de producción propias y se pueden ajustar después de la etapa visual, manteniendo consistencia dentro de cada familia.

| Elemento | Caja de cuadro | Masa visible inicial | Anclaje / orientación |
| --- | --- | --- | --- |
| Kratos | 48 × 48 | 24–28 px de ancho × 38–42 px de alto | Centro horizontal; suela a 46 px. Cara y torso en perfil 3/4 lateral; ambas hojas legibles. |
| Combatiente humano | 32 × 40 | 16–20 × 32–36 px | Centro horizontal; suela a 38 px. Arma elevada visible en anticipación. |
| Arquero humano | 32 × 40 | 18–22 × 32–36 px con arco | Centro horizontal; suela a 38 px. Arco y flecha no se funden con el torso. |
| Cabeza/cuello de Hidra | 144 × 112 | 120–140 × 76–104 px | Anclaje inferior al cuello; hocico apunta a la arena. Puede recortarse por borde como figura mayor, pero ojo, hocico y dirección del ataque deben quedar dentro de cámara. |
| Cubierta/baranda | Módulo de 32 × 16 | Franja horizontal de 2–4 px por tabla | Borde superior recto y continuo; no desplazar verticalmente una plataforma entre repeticiones. |

Kratos conserva cinco rasgos visibles: piel pálida, marca roja que cruza la cabeza, faldón rojo, protecciones cálidas de bronce y dos hojas unidas a cadenas. Las cadenas son segmentos separados de 2 px, con al menos un quiebre que indique trayectoria; no una línea continua sin eslabones. Al reducir la figura a una silueta, su cuerpo atlético, cabeza descubierta y hojas curvas deben seguir distinguiéndose.

El combatiente se reconoce por arma y postura frontal de presión; el arquero, por arco abierto y separación del brazo que tensa. La Hidra tiene masa mucho mayor que Kratos, cuello serpentino escalonado, hocico ancho, ojo luminoso pequeño y una línea de mandíbula inequívoca. No compite con las señales de peligro: el ojo puede brillar, pero la anticipación activa usa el ámbar reservado.

## Coherencia de la escena del Egeo

- Mantén la misma fuente de luz fría de tormenta para Kratos, enemigos, casco y Hidra; el lado de luz mira al cielo/relámpago y la sombra al mar.
- Diferencia material por forma y paleta: olas en bandas horizontales frías; madera en rectángulos cálidos largos; piel en masas claras; escamas en verdes apagados; metal en pocos acentos ocres.
- El mar ocupa el fondo, la tormenta el cielo y la cubierta el primer plano. Usa 3 planos de profundidad como máximo durante combate: cielo, mar/casco, cubierta/personajes.
- La silueta del barco usa piezas anchas y diagonales grandes; la cubierta útil para caminar sigue siendo horizontal y despejada. No pongas cabos, lluvia ni remaches sobre los pies o los avisos.
- Repite los mismos contornos, tamaño de clúster, escala de sombra y contraste en todo asset. Un efecto puede ser más brillante, pero dura poco y ocupa menos área que la forma que está señalando.

## Muestra de estilo

La siguiente muestra vectorial es original y editable. Usa lienzo lógico exacto 320 × 180 y bloques alineados a 2 px; muestra la jerarquía entre clima, cubierta, Kratos, soldado y amenaza de Hidra. Todo lo representado está **provisional**: no es sprite, fondo ni animación final y no se integra al juego.

La muestra visual fue retirada por solicitud del usuario y ya no está disponible.
