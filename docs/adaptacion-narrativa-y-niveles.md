# Adaptación narrativa y estructura de niveles

> **Estado:** propuesta futura, no contenido implementado. El runtime actual es solo un shell neutral Phaser/Vite a 320×180; la resolución interna objetivo futura es 480×270 (D-12). El gameplay previo fue descartado.

## Alcance de la adaptación

La historia base será la del primer *God of War* (2005, PlayStation 2). *God of War: Betrayal* sirve como referencia de formato y ritmo: acción lateral horizontal, combates breves, recorridos en subniveles, trampas y rutas alternativas. No se toma su argumento, que ocurre después del primer juego.

La cronología que hay que conservar es: la travesía del Egeo y la Hidra; la misión de Atenea contra Ares; la Atenas sitiada y su Oráculo; el viaje por el Desierto de las Almas Perdidas hasta el templo de Pandora, encadenado a Cronos; la caída de Kratos al Inframundo; el regreso, el combate final contra Ares y el ascenso de Kratos al Olimpo. Las escenas se comprimen para una aventura lateral; los acontecimientos centrales y su orden permanecen reconocibles.

## Cómo se traduce el formato de Betrayal

- Cada zona larga se divide en segmentos cortos que se puedan jugar por separado, con una transición o punto de descanso entre ellos.
- La base es un plano lateral con arenas de combate, plataformas, caminos alternos, trampas visibles y pequeños retos de entorno.
- El recorrido aprovecha la **verticalidad** como *Betrayal* (ascensos, saltos entre niveles y plataformas a distintas alturas), que GOW1 amplía con mayor escala; esta base se adopta en D-20 como punto de partida a igualar o superar en la versión web.
- Cada grupo enemigo tiene una función clara: presión cuerpo a cuerpo, proyectiles, defensa de un acceso o amenaza aérea.
- Preparación, impacto y recuperación se leen con pose, color, sonido y espacio; el jugador debe poder reaccionar sin depender de una señal diminuta.
- Los enemigos debilitados pueden abrir una ejecución contextual breve. La propuesta es activarla con `E` cuando aparezca una señal explícita, sin secuencia larga de botones; así queda separada de `J` y `K`.
- Orbes y cofres pueden dar una mejora o recuperar un recurso entre segmentos; las rutas opcionales deben ser visibles y no bloquear la historia principal.
- Los jefes se resuelven por patrones legibles y ventanas de castigo, no por daño continuo sin respuesta.

La referencia de *Betrayal* respalda este formato de subniveles breves, combate por combos y retos sencillos de plataforma; la reseña también describe rutas ramificadas y puzles. Estas ideas se adaptan al proyecto, no se copian como escenas o recursos. [Pocket Gamer: reportaje de 2007](https://www.pocketgamer.com/god-of-war-betrayal/hands-on-with-god-of-war-betrayal-on-mobile-plus-first-21-screens/) · [GamesRadar: reseña de 2007](https://www.gamesradar.com/god-of-war-betrayal-mobile-review/)

## Arco de campaña propuesto

La campaña se organiza en seis zonas. Cada zona se divide en dos o más subniveles; las duraciones de esta tabla son objetivos de ritmo, no mediciones de contenido ya implementado.

| Zona | Acontecimiento y función dramática | Juego lateral y encuentros |
| --- | --- | --- |
| 1. Egeo y la Hidra | Kratos cumple la misión de Poseidón; tras la Hidra, Atenea le ofrece la última tarea contra Ares a cambio de perdón. | Travesía por cubierta, combate contra tripulantes hostiles, arqueros, plataformas y una Hidra de varias fases. **Primera entrega jugable: objetivo aproximado de 5 minutos.** |
| 2. Atenas sitiada | Kratos debe encontrar al Oráculo para conocer cómo matar a un dios. | Calles, tejados y patios; soldados no muertos, arqueros y amenazas aéreas; caminos cortos opcionales. El final del tramo es el rescate o acceso al Oráculo. |
| 3. Desierto de las Almas Perdidas | La ruta al templo obliga a atravesar el desierto y seguir la llamada de Cronos. | Viento que reduce visibilidad, ruinas, sirenas y plataformas sobre arena. Puzles cortos de rutas o contrapesos; el combate protege el avance, sin alargarlo con oleadas idénticas. |
| 4. Templo de Pandora | Kratos escala el cuerpo de Cronos y atraviesa las pruebas del templo para encontrar la caja. | Tres alas temáticas de Atlas, Poseidón y Hades; trampas, palancas, bloques y arenas con enemigos que combinan funciones. Cierre con el Guardián de Pandora. |
| 5. Inframundo | Ares mata a Kratos y las arpías se llevan la caja; Kratos escapa del reino de los muertos. | Caídas, columnas con pinchos, fuego y versiones espectrales de amenazas conocidas. La salida recupera el ritmo de combate y hace legible el regreso a Atenas. |
| 6. Atenas y Olimpo | Kratos recupera la caja, vence a Ares, recibe el perdón prometido pero no la paz, y asciende al Olimpo. | Ciudad en ruinas, arena final de Ares con fases físicas y una secuencia de memoria interactiva breve. Epílogo visual en el trono. |

El orden de localizaciones y acontecimientos resume la trama del juego original: Egeo, Atenas, desierto, templo de Pandora sobre Cronos, Inframundo y Olimpo. [Resumen de *God of War* (2005)](https://en.wikipedia.org/wiki/God_of_War_(2005_video_game)#Plot)

## Primer objetivo narrativo: «El Egeo y la Hidra»

Esta es la primera sección narrativa propuesta para una futura implementación; no continúa una demo activa. Su objetivo de ritmo es cerca de cinco minutos en una partida normal y funcionar como tutorial integrado, no como pantalla de instrucciones larga.

| Tramo | Tiempo orientativo | Objetivo de diseño |
| --- | ---: | --- |
| Cubierta inicial | 0:00–0:35 | Enseñar movimiento y salto con espacio seguro, presentar barco, lluvia y tormenta. |
| Primera refriega | 0:35–1:30 | Introducir el combo ligero y un enemigo cuerpo a cuerpo; una señal visual enseña a esquivar. |
| Mástil y paso elevado | 1:30–2:20 | Usar plataformas y un ariete/obstáculo ambiental; introducir arqueros con anticipación visible. |
| Llegada al mascarón | 2:20–3:00 | Cerrar el encuentro, activar el checkpoint y dejar espacio para leer a la Hidra. |
| Jefe: Hidra | 3:00–4:50 | Alternar mordida, barrido y aliento; cada ataque tiene una respuesta segura y la recuperación abre una ventana de castigo. |
| Cierre | 4:50–5:00 | Mostrar la caída de la Hidra y la petición de Atenea en una transición breve. |

Estos tiempos suman un objetivo de ritmo de cinco minutos; se ajustan tras medir una partida humana. La duración no debe conseguirse solo alargando salud enemiga: debe salir de recorrido, variedad de encuentros, lectura de patrones y transiciones cortas.

### Reglas para la Hidra

- **Mordida:** apunta a la posición de Kratos, se anuncia con movimiento de cabeza y castiga quedarse quieto cerca del cuello; esquivar hacia un lado es la respuesta principal.
- **Barrido:** ocupa la zona baja de la cubierta; se anuncia con una trayectoria horizontal y se evita con salto o salida del área.
- **Aliento:** cubre una zona dibujada antes de activarse; la forma y alcance del aviso deben coincidir con el daño real.
- **Vulnerabilidad:** después de cada patrón, una cabeza queda expuesta durante un intervalo breve. Los impactos a esa cabeza deben tener respuesta visual y sonora clara.
- **Fases:** al reducir la vida, cambia el orden o combinación de patrones, no solo el daño. Mantener descansos suficientes para reposicionarse.

### Estructura de escalada (referencia GOW1)

El primer nivel de *God of War* (2005) presenta la Hidra en **encuentros repetidos que escalan**: una primera cabeza casi tutorial con un solo ataque y ventana amplia de castigo; una segunda aparición sobre la cubierta con un repertorio mayor (que suma el barrido en tres direcciones); y un cierre con varias cabezas a la vez que culmina la zona. El tramo intercala combate, cobertura contra arqueros, plataformas mortales y una **recompensa de recurso a mitad de escenario** antes del clímax. Esta estructura —no los recursos ni las escenas concretas— se adopta como guion de referencia del Egeo: mismo jefe, dificultad y repertorio crecientes, clímax final sobre la cubierta. No se copian ataques, arte ni secuencias del juego original.

## Combate, recursos y progresión

- **Alcance propuesto para la primera zona:** ligero de tres pasos, pesado, salto, esquiva, retroceso, invulnerabilidad breve y dos arquetipos enemigos.
- **Añadir por progresión:** poderes divinos con recurso limitado y mejoras entre subniveles. El poder debe resolver grupos o abrir una oportunidad, no sustituir el combo básico.
- **Interacción:** reservar `E` como entrada contextual dedicada para palancas, cofres y prompts, y mostrar la acción junto al objetivo. Mantenerla separada de los ataques `J` y `K`.
- **Ejecutar enemigos:** si se implementa una oportunidad de remate, anunciarla con claridad y usar la acción contextual `E`; mantenerla opcional y fuera de la ruta crítica cuando interrumpa el flujo.
- **Checkpoints:** colocarlos antes de una sección larga o de un jefe, para que un fallo no obligue a repetir el capítulo entero.
- **Narrativa:** diálogos breves de Atenea y recuerdos visuales entre encuentros; el jugador debe poder reanudar el control rápidamente.

## Principios visuales

- Componer el pixel art futuro a 480 × 270 y conservar una lectura clara de silueta. Escalar el canvas para una ventana amplia del navegador con pixelado nítido y sin suavizado; la resolución interna no limita su tamaño CSS.
- Cambiar la paleta por zona sin perder los códigos constantes de Kratos, vida, daño y peligro.
- Diferenciar las zonas por materiales y movimiento de fondo: madera y agua en el Egeo; piedra y fuego en Atenas; arena y viento en el desierto; roca viva y arquitectura en Cronos; metal, ceniza y fuego en el Inframundo.
- Dar prioridad a Kratos, a las armas encadenadas y a los enemigos que están preparando un ataque; la lluvia, partículas y fondos deben ocupar un segundo plano.
- Crear sprites, iconos y fondos originales inspirados en el lenguaje del género y de la época, sin extraer recursos de *Betrayal* ni del juego de PS2.

## Fuentes de referencia

- Tracy Erickson, [*Hands on with God of War: Betrayal on mobile*](https://www.pocketgamer.com/god-of-war-betrayal/hands-on-with-god-of-war-betrayal-on-mobile-plus-first-21-screens/), Pocket Gamer, 2007: subniveles breves, combos, armas, plataformas y puzles sencillos.
- Chris Antista, [*God of War: Betrayal [mobile] review*](https://www.gamesradar.com/god-of-war-betrayal-mobile-review/), GamesRadar, 2007: desplazamiento lateral, rutas ramificadas y elementos de puzle.
- [*God of War* (2005), resumen de trama](https://en.wikipedia.org/wiki/God_of_War_(2005_video_game)#Plot): orden de localizaciones, misión de Atenea, caja de Pandora, Inframundo y desenlace.
