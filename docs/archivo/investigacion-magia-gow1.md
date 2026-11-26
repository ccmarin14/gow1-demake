# *Ira de Poseidón* en God of War (2005): qué hace, cuánto pega y cuánto dura

> **Revisión pendiente:** este estudio contiene inferencias presentadas con demasiada seguridad. La cadencia de ~4,6 impactos/s no está demostrada; tampoco el rango de vida del soldado, el supuesto 6 % por impacto ni la comparación de potencia del golpe básico. Las cifras de vida, duración, cadencia y versión aérea deben contrastarse con fuentes o mediciones antes de usarlas para cambios. Seguimiento: BL-50, BL-52 y BL-53 en `docs/estado.md`.

## Contraste posterior: duración y magia aérea

- **Magia aérea:** la [guía Prima](https://archive.org/details/God_of_War_Prima_Official_eGuide), en la tabla de *Poseidon's Rage*, enumera «LEVEL 1: POSEIDON'S RAGE (AIR)» y «press L2 while in the air to activate». Es evidencia textual de activación aérea desde el nivel 1, no una medición de su trayectoria, duración ni alcance. La [wiki](https://web.archive.org/web/20250119094824/https://godofwar.fandom.com/wiki/Poseidon%27s_Rage) también la lista en nivel 1; un [resultado de IGN](https://www.ign.com/wikis/god-of-war/Power-Ups) la atribuye a nivel 2. Esa discrepancia requiere contrastar el juego o la pantalla original de mejoras.
- **Dos lanzamientos de referencia:** en el video local `docs/tmp/egeo-video/egeo.mp4`, a partir de 18:40, se revisaron 25 muestras a 5 cuadros por segundo (una cada 0,2 s). La descarga visible aparece aproximadamente entre 18:40,4 y 18:41,2 en el primer lanzamiento, y entre 18:42,8 y 18:43,6 en el segundo; en la muestra siguiente ya no aparece. Esto acota solo el **efecto visible en ese video**, no la duración completa del movimiento ni la ventana de daño. No se identificaron con certeza plataforma o versión, entradas ni mejoras. La frecuencia del video es 29,97 fps; el muestreo a 5 fps no permite precisión menor que 0,2 s.
- **Impactos:** el contador visible llega a 41 tras el primer lanzamiento y a 62 tras el segundo, pero hay varios enemigos y el contador puede acumular golpes. No permite calcular impactos por enemigo ni su cadencia. Las cifras de 13/25/37 impactos por enemigo del resto de este documento siguen pendientes de corroboración directa; la cita «37+ hits» no identifica por sí sola un único enemigo.
- **Siguiente prueba:** obtener o localizar una grabación con versión, nivel y entradas identificables, un enemigo resistente aislado y contador legible; medir por separado la acción completa, el tramo de daño y la versión aérea. Si no se observan cada uno de esos datos, conservar la incertidumbre y no derivar una cadencia exacta.

### Búsqueda de una descarga aislada

En [*Kratos Moveset Showcase*](https://www.youtube.com/watch?v=0X9RiODtCB4), copia local `docs/tmp/golpes-ref/moveset.mp4`, se revisó el tramo 3:25–3:29 a 5 muestras por segundo. El video etiqueta la demostración «Poseidon's Rage» y **L2**: L2 identifica el botón, no el nivel de mejora. No hay enemigos visibles durante esa demostración. Se ve una postura previa alrededor de 3:26,4, electricidad entre las muestras aproximadas 3:26,6 y 3:27,4, y ausencia del efecto en la muestra siguiente. La secuencia muestra un lanzamiento sin blancos, pero no permite contar impactos ni confirmar el nivel, si se pulsó ○ fuera de cuadro, la duración exacta de la acción o el comportamiento de enemigos.

En el mismo video aparecen demostraciones rotuladas «Wrath of Poseidon» con L2 y pulsaciones de ○ frente a varios enemigos; el contador agregado tampoco permite atribuir los impactos a un blanco individual. No se localizó en los materiales revisados una secuencia que reúna a la vez un solo enemigo resistente, nivel e entradas identificables y contador legible. **BL-52 sigue pendiente de esa evidencia**; no se fijó una cadencia.

**Fuente externa:** [*Fighting Every Boss Using Poseidon's Rage Skill!!*](https://www.youtube.com/watch?v=yNkCWFyQKF0), de Amman Aria Ramadhan. Su descripción anuncia GoW 1 y 2 en dificultad muy difícil y lista para GoW 1: hidras menores en 4:41 y 5:30, Hidra Rey en 6:32, Medusa en 9:08, Guardián de Pandora en 10:25 y Ares en 12:50. La descripción incluye las etiquetas PS2 y PCSX2.

**Inspección posterior de Medusa:** se revisó el combate alrededor de [10:00](https://www.youtube.com/watch?v=yNkCWFyQKF0&t=600s), con fotogramas muestreados cada 0,2 s de un fragmento de 30 fps. Se observa a Medusa como único enemigo visible y una descarga eléctrica sostenida; después aparece **40 HITS**. No se aprecia otro enemigo ni un contador previo en las muestras inmediatas. El caso es compatible con múltiples impactos sobre un único enemigo, pero la resolución, los destellos y la webcam tapan parte del contador durante el ataque; no permiten verificar cada incremento ni excluir blancos fuera de cuadro. El efecto aparece en muestras separadas por unos **2,8 s**, no necesariamente la duración total de la acción o del daño. El nivel de la magia, las pulsaciones de ○, la velocidad de reproducción y posibles cortes no se conocen. Por eso **40/2,8 no es una cadencia verificada** y esta observación no fija la cifra de impactos por lanzamiento.

Investigación hecha el 2026-11-26 para decidir qué cambiar en nuestra *Ira de Poseidón* (BL-32 / BL-49). **Sin cambios de código**: es un estudio para decidir.

Cada número lleva su origen: **medido** (dato publicado por quien lo midió en el juego), **deducido** (aritmética sobre datos medidos) o **sin respaldo** (no lo encontré en ninguna fuente).

## 1. Qué hace

- Es la primera magia de Kratos, se obtiene en el Mar Egeo, y es de tipo eléctrico. Kratos queda rodeado por un círculo de electricidad y caen rayos desde el cielo sobre los enemigos. **Medido** (wiki, guía Prima).
- **Golpea a varios enemigos a la vez, sin límite de enemigos.** **Medido** (Prima: "attack multiple foes at once"; el hilo de pruebas: "no maximum number of enemies").
- **Alcanza enemigos en el aire.** La comunidad lo describe como "hits infinitely vertically", es decir, el área es un cilindro: no importa la altura del enemigo. **Medido** (hilo de pruebas de la comunidad).
- **Kratos es invulnerable durante toda la animación**, no solo en el arranque. Es el botón de pánico del juego. **Medido** (Prima: "you are invulnerable when you are in the animation of using this gift").
- **Versión aérea:** Prima y la wiki la describen desde nivel 1; un resultado de IGN la sitúa en nivel 2. Falta contrastar la discrepancia con el juego.
- **Pulsar ○ repetidamente:** las pruebas comunitarias informan que el daño por impacto sube progresivamente. La wiki atribuye ocho segundos de invencibilidad a *Wrath of Poseidon*; esto no está verificado mediante una medición propia ni determina la duración del daño.
- Es control de multitudes, **no** un arma contra enemigos grandes: a los Cíclopes y Minotauros les hace daño pero no es la herramienta para bajarlos. **Medido** (Prima).
- A nivel 3 un solo lanzamiento borra un grupo entero de enemigos comunes. **Medido** (GameFAQs: "if you have maxed out Poseidon's Rage by this point, it can be very easy, as a single cast will kill all enemies").

## 2. Números por nivel

| Nivel | Coste de mejora | Coste de maná | Daño total sin machacar | Daño total machacando | Daño por impacto | Impactos por enemigo |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | — | 32–33 PM | 32 | 112 | 2,5 | ~13, sin confirmar |
| 2 | 1.650 orbes | 42 PM | 83 | 105 | 3,33 (hasta 5,10) | ~25, sin confirmar |
| 3 | 4.500 orbes | 50 PM | 154,17 | 215–221,6 | 4,17 (hasta 6,45) | ~37, sin confirmar |

Cómo se obtiene cada columna:

- **Coste de maná, daño base y daño machacando:** guía Prima (tabla de *Poseidon's Rage*). La comunidad mide 33/42/50 PM y el daño total 32 / 83 / 154,17 (más 215–221,6 machacando a nivel 3). **Medido.**
- **Daño por impacto:** 2,5 / 3,3333435 / 4,1666565 según nivel, y sube de forma progresiva al machacar hasta 5,100061 (nivel 2) y 6,4479065 (nivel 3). **Medido** (hilo de pruebas).
- **Impactos por enemigo:** el cociente entre daño total y daño por impacto sugiere ~13 / ~25 / ~37, pero la relación y las condiciones de cada cifra no se comprobaron. La cita de Neoseeker «37+ hits» no demuestra por sí sola que todos correspondan a un único enemigo. El patrón de +12 por nivel es una hipótesis, no una medición.
- GameFAQs menciona unos **50 impactos por lanzamiento** contra tres minotauros a nivel 3. El contador puede sumar varios enemigos; no permite deducir que cada tick golpee a los tres.
- El maná máximo va de 100 a 200 con las Plumas de Fénix (+25 cada 6), así que el lanzamiento cuesta entre un tercio y un cuarto de la barra. **Medido** (Prima).

Referencia de potencia relativa: un golpe básico de Espada del Caos pega del orden de **2** de daño. O sea que un lanzamiento de nivel 1 (32) equivale a **~16 golpes de □**, y uno de nivel 3 (154) a **~77**. El propio hilo lo dice en daño por maná: la *Ira de Poseidón* es la magia con mejor relación daño/maná del juego (1:1 a nivel 1, más de 3:1 a nivel 3). **Deducido.**

## 3. Duración

- La wiki atribuye a *Wrath of Poseidon* **8 segundos de invencibilidad**; el dato no se midió en esta investigación ni establece por sí solo la duración del daño.
- **Sin machacar: no documentado.** Ninguna fuente que encontré da la duración del lanzamiento normal.
- **Cadencia desconocida:** el cálculo anterior de ~4,6 impactos/s divide cifras que no se han demostrado correspondientes a la misma ventana y al mismo enemigo. No sirve como medición ni como cota.
- La cadencia exacta (cada cuántos cuadros cae un impacto) no la encontré publicada. Se puede medir del video de referencia contando el contador de impactos, si hace falta el número exacto.

## 4. Qué le pasa a los enemigos

- Cada impacto **interrumpe y aturde** a los enemigos ligeros y medianos, y los deja sin poder atacar mientras dura el lanzamiento; al ser muchos impactos seguidos, quedan trabados todo el hechizo. **Deducido** de los videos y del propio diseño (control de multitudes).
- A los enemigos grandes (Cíclopes, Minotauros) les hace daño pero **no los aturde de forma fiable**. **Medido** (Prima; y la comparación de la comunidad con *Atlas Quake* en GoW II, que sí aturde a los pesados).
- A nivel 3 el daño total supera la vida de cualquier enemigo común: **los mata dentro del lanzamiento**. **Medido** (GameFAQs).

## 5. Comparación con el juego en el momento del estudio (`e862406`)

| | GoW 1 (nivel 1 → 3) | Nuestro juego |
| --- | --- | --- |
| Impactos por enemigo y lanzamiento | ~13 → ~25 → ~37, hipótesis sin confirmar | **1** |
| Daño total por enemigo | 32 → 83 → 154 | **8** |
| Daño total en golpes básicos | ~16 → ~41 → ~77 | **0,8** (un □ pega 10) |
| Daño por maná | 1:1 a 3,6:1, la mejor magia del juego | **0,23** (8 de daño por 35 PM) |
| Aturdimiento | renovado en cada impacto | 24 ticks, **una sola vez** |
| Alcance vertical | cilindro: alcanza en el aire | elipse de **±7,6 px**: solo el suelo |
| Versión aérea | sí | no |
| Invulnerabilidad | toda la animación | toda la magia ✓ |
| Coste | 33 / 42 / 50 PM, barra 100 → 200 | 35 PM fijos, barra 100 → 120 |
| Niveles | 3, con 1.650 y 4.500 orbes | no hay |
| Duración | No medida; la wiki menciona 8 s de invencibilidad en *Wrath* | 84 ticks = **1,4 s** |

Lo que ya está bien: la invulnerabilidad durante todo el conjuro, la forma (rayo desde arriba + onda en el suelo) y el coste relativo (un tercio de la barra).

Lo que falta, en orden de impacto sobre lo que se siente al jugar:

1. **Un solo impacto por enemigo.** Es el defecto que señalaste. En el original el enemigo recibe daño repetido mientras está dentro del área: es lo que hace que la magia "borre" un grupo y no que lo toque.
2. **Daño total ínfimo frente al golpe básico.** Hoy la magia entera pega menos que un □. En el original es la herramienta más eficiente del juego.
3. **Aturdimiento único.** Al no renovarse, el soldado golpeado vuelve a su IA enseguida.
4. **Alcance vertical.** En el original alcanza a los que están en el aire; nuestra elipse es de 15 px de alto.
5. **Duración y niveles.** 1,4 s sin mejoras posibles.

### Estado tras BL-51 (2026-11-26)

Se implementó el punto medio: **impactos repetidos cada 4 ticks con 4 de daño**, sin cambiar la duración ni la geometría de la onda.

| | GoW 1 nivel 1 | Tras BL-51 |
| --- | --- | --- |
| Impactos por enemigo | ~13, sin confirmar | **14** en los pies, 11 a 20 px, 2 a 80 px |
| Daño total por enemigo | 32 | **56 / 44 / 8** |
| Daño por maná | 1:1 | **1,6:1** en los pies (56 por 35 PM) |
| Aturdimiento | renovado en cada impacto | **renovado en cada impacto** ✓ |
| Legionario (60 de vida) | — | queda con **4**; el arquero (40) muere |

Lo que sigue faltando, ya como historias aparte: niveles con orbes (1.650 / 4.500), *Wrath of Poseidon* pulsando ○, alcance a los enemigos en el aire, versión aérea y la unificación de la escala de vida y dificultades (BL-50).

## 6. Lo que hay que decidir antes de tocar código

La pregunta de diseño es **para qué sirve la magia en nuestro juego**, porque de eso sale el número:

- **(a) Como el original:** a nivel máximo un lanzamiento mata un grupo de legionarios. Pide daño total de varias veces la vida de un soldado (60) y ~30 impactos, con aturdimiento renovado. Con 100 de maná son 2–3 lanzamientos por barra: desequilibra el combate a favor de la magia, igual que en GoW 1.
- **(b) Como despeje:** muchos impactos, aturde a todos los alcanzados y deja a los soldados al borde de la muerte sin matarlos. Es el punto medio: se siente como el original (ráfaga de impactos, enemigos trabados) sin convertirla en un botón de victoria.
- **(c) Como está, pero con impactos repetidos:** el mismo daño total (8) repartido en varios ticks. Se siente más eléctrico pero sigue siendo casi decorativa.

Sin decidir (a), (b) o (c), cualquier número que ponga es una decisión de diseño tomada por mí y no por vos.

## 6. Escala de vida, maná y dificultades (pendiente, no es parte de este cambio)

El juego actual asigna 10 de daño al primer □ y 60 de vida al legionario. La vida del soldado original y el número de golpes necesarios para vencerlo no quedaron verificados. Por tanto, no se puede sostener la proporción anterior del 6 % ni atribuir la diferencia de balance a una causa única. BL-50 queda pendiente de contrastar vida y daño por enemigo y dificultad.

| | GoW 1 | Nuestro juego |
| --- | --- | --- |
| Golpe básico de □ | ~2 | 10 |
| Vida de un legionario | No verificada | 60 |
| Golpes de □ para matarlo | No verificado | 6 |
| Vida de Kratos | 100 → **175** (18 Ojos de Gorgona, +25 cada 6) | 100 → 120 |
| Maná | 100 → **200** (18 Plumas de Fénix, +25 cada 6, más la mejora de la puerta de las Musas) | 100 → 120 |
| Daño de la magia Nv1 / Nv3 | 32 / 154 | 8 |

**Dificultades del original** (guía Prima), con dos multiplicadores: daño que hacés y daño que recibís. La columna de "recovery" (frecuencia de ataque enemiga) existe pero no sobrevivió al OCR de la guía.

| Dificultad | Daño que hacés | Daño que recibís |
| --- | --- | --- |
| Mortal (fácil) | ×2,00 | ×0,50 |
| Héroe (normal) | ×1,00 | ×1,00 |
| Espartano (difícil) | ×0,75 | ×2,50 |
| Dios (muy difícil) | ×0,50 | ×5,00 |

Corroboración independiente de la fila Espartano: el hilo de pruebas dice "on Hard, enemies are at 250%, thus x2.5".

La *Ira de los Dioses* del original va en la misma lógica: daño ×2,00 y armadura de 0,75 / 0,60 / 0,45 / 0,30 según el nivel de las espadas.

Recomendación: no mover estas cantidades de a una. Se hace **una sola pasada de escala + dificultades**, después de que los golpes estén aprobados jugando (BL-46), porque tocar la vida de Kratos o de los enemigos ahora invalida el feel de todo lo aprobado. Queda anotado como **BL-50** en `docs/estado.md` §3.

## Fuentes

- **Guía oficial Prima** (*God of War*, 2005), capítulo "Power of the Gods": tabla de *Poseidon's Rage* (coste, daño base, daño machacando, mejora), invulnerabilidad durante la animación, versión aérea, uso como control de multitudes. Texto completo: <https://archive.org/details/God_of_War_Prima_Official_eGuide>.
- **Wiki de God of War (Fandom), *Poseidon's Rage*:** costes de orbes (1.650 / 4.500), descripción de los niveles y *Wrath of Poseidon* con 8 segundos de invencibilidad. <https://godofwar.fandom.com/wiki/Poseidon%27s_Rage> (copia: <https://web.archive.org/web/20250119094824/https://godofwar.fandom.com/wiki/Poseidon%27s_Rage>).
- **Hilo de pruebas de la comunidad (Stinger Magazine, "God of War 1 General Discussion", página 3):** daño por impacto de cada nivel, daño total medido a nivel 3 (154,1662903 y 221,5926361), coste de maná 33/42/50, "hits infinitely vertically" y la comparación de daño por maná. <https://stinger.actieforum.com/t130p100-god-of-war-1-general-discussion>.
- **Neoseeker, guía de jefes:** "37+ hits with each if you've got the ability maxed out". <https://neoseeker.com/god-of-war/faqs/120526-god-boss.html>.
- **GameFAQs, tablero de God of War:** "about 50 hits per cast" contra tres Minotauros a nivel 3, "higher PR means more damage and hits per cast", y "a single cast will kill all enemies" en el Desafío de Poseidón. <https://gamefaqs.gamespot.com/boards/919864-god-of-war/48957132>.

No pude acceder a namu.wiki (403) ni a IGN (403). No encontré ninguna fuente con la duración exacta del lanzamiento sin machacar ni con la cadencia de impactos en cuadros.
