# *Ira de Poseidón* en God of War (2005): qué hace, cuánto pega y cuánto dura

Investigación hecha el 2026-11-26 para decidir qué cambiar en nuestra *Ira de Poseidón* (BL-32 / BL-49). **Sin cambios de código**: es un estudio para decidir.

Cada número lleva su origen: **medido** (dato publicado por quien lo midió en el juego), **deducido** (aritmética sobre datos medidos) o **sin respaldo** (no lo encontré en ninguna fuente).

## 1. Qué hace

- Es la primera magia de Kratos, se obtiene en el Mar Egeo, y es de tipo eléctrico. Kratos queda rodeado por un círculo de electricidad y caen rayos desde el cielo sobre los enemigos. **Medido** (wiki, guía Prima).
- **Golpea a varios enemigos a la vez, sin límite de enemigos.** **Medido** (Prima: "attack multiple foes at once"; el hilo de pruebas: "no maximum number of enemies").
- **Alcanza enemigos en el aire.** La comunidad lo describe como "hits infinitely vertically", es decir, el área es un cilindro: no importa la altura del enemigo. **Medido** (hilo de pruebas de la comunidad).
- **Kratos es invulnerable durante toda la animación**, no solo en el arranque. Es el botón de pánico del juego. **Medido** (Prima: "you are invulnerable when you are in the animation of using this gift").
- **Tiene versión aérea**: se puede lanzar en el aire. **Medido** (wiki, guía Prima: "Poseidon's Rage (Air)").
- **Pulsar ○ repetidamente sube el daño por impacto de forma progresiva.** Desde el nivel 2 ese modo se llama *Wrath of Poseidon* y **Kratos queda invencible durante 8 segundos**. **Medido** (wiki; el hilo de pruebas da los topes por impacto).
- Es control de multitudes, **no** un arma contra enemigos grandes: a los Cíclopes y Minotauros les hace daño pero no es la herramienta para bajarlos. **Medido** (Prima).
- A nivel 3 un solo lanzamiento borra un grupo entero de enemigos comunes. **Medido** (GameFAQs: "if you have maxed out Poseidon's Rage by this point, it can be very easy, as a single cast will kill all enemies").

## 2. Números por nivel

| Nivel | Coste de mejora | Coste de maná | Daño total sin machacar | Daño total machacando | Daño por impacto | Impactos por enemigo |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | — | 32–33 PM | 32 | 112 | 2,5 | **13** |
| 2 | 1.650 orbes | 42 PM | 83 | 105 | 3,33 (hasta 5,10) | **25** |
| 3 | 4.500 orbes | 50 PM | 154,17 | 215–221,6 | 4,17 (hasta 6,45) | **37** |

Cómo se obtiene cada columna:

- **Coste de maná, daño base y daño machacando:** guía Prima (tabla de *Poseidon's Rage*). La comunidad mide 33/42/50 PM y el daño total 32 / 83 / 154,17 (más 215–221,6 machacando a nivel 3). **Medido.**
- **Daño por impacto:** 2,5 / 3,3333435 / 4,1666565 según nivel, y sube de forma progresiva al machacar hasta 5,100061 (nivel 2) y 6,4479065 (nivel 3). **Medido** (hilo de pruebas).
- **Impactos por enemigo:** deducidos dividiendo el daño total por el daño por impacto. Nivel 3 da **37 exactos** (154,1662903 / 4,1666565 = 37,0) y coincide con la guía de Neoseeker: "you should be able to get 37+ hits with each if you've got the ability maxed out". Nivel 2 da 24,9 ≈ 25 y nivel 1 da 12,8 ≈ 13. **Deducido**, con el nivel 3 confirmado por una segunda fuente.
- El patrón es regular: **13, 25, 37 → +12 impactos por nivel.** **Deducido.**
- Contra tres Minotauros a nivel 3 el contador de combo sube unos **50 impactos por lanzamiento**, porque cada tick golpea a los tres a la vez. **Medido** (GameFAQs). Sirve para entender que "impactos por lanzamiento" en el contador no es lo mismo que "impactos por enemigo".
- El maná máximo va de 100 a 200 con las Plumas de Fénix (+25 cada 6), así que el lanzamiento cuesta entre un tercio y un cuarto de la barra. **Medido** (Prima).

Referencia de potencia relativa: un golpe básico de Espada del Caos pega del orden de **2** de daño. O sea que un lanzamiento de nivel 1 (32) equivale a **~16 golpes de □**, y uno de nivel 3 (154) a **~77**. El propio hilo lo dice en daño por maná: la *Ira de Poseidón* es la magia con mejor relación daño/maná del juego (1:1 a nivel 1, más de 3:1 a nivel 3). **Deducido.**

## 3. Duración

- **Con *Wrath of Poseidon* (nivel 2 o más, machacando ○): 8 segundos de invencibilidad.** **Medido** (wiki).
- **Sin machacar: no documentado.** Ninguna fuente que encontré da la duración del lanzamiento normal.
- Cota útil: si el lanzamiento machacado dura 8 s y aplica 37 impactos por enemigo, la cadencia es de **~4,6 impactos por segundo**; sin machacar caen los mismos 37 impactos en menos tiempo, así que la cadencia sería algo mayor. **Deducido, no medido.**
- La cadencia exacta (cada cuántos cuadros cae un impacto) no la encontré publicada. Se puede medir del video de referencia contando el contador de impactos, si hace falta el número exacto.

## 4. Qué le pasa a los enemigos

- Cada impacto **interrumpe y aturde** a los enemigos ligeros y medianos, y los deja sin poder atacar mientras dura el lanzamiento; al ser muchos impactos seguidos, quedan trabados todo el hechizo. **Deducido** de los videos y del propio diseño (control de multitudes).
- A los enemigos grandes (Cíclopes, Minotauros) les hace daño pero **no los aturde de forma fiable**. **Medido** (Prima; y la comparación de la comunidad con *Atlas Quake* en GoW II, que sí aturde a los pesados).
- A nivel 3 el daño total supera la vida de cualquier enemigo común: **los mata dentro del lanzamiento**. **Medido** (GameFAQs).

## 5. Comparación con el juego actual (`e862406`)

| | GoW 1 (nivel 1 → 3) | Nuestro juego |
| --- | --- | --- |
| Impactos por enemigo y lanzamiento | 13 → 25 → 37 | **1** |
| Daño total por enemigo | 32 → 83 → 154 | **8** |
| Daño total en golpes básicos | ~16 → ~41 → ~77 | **0,8** (un □ pega 10) |
| Daño por maná | 1:1 a 3,6:1, la mejor magia del juego | **0,23** (8 de daño por 35 PM) |
| Aturdimiento | renovado en cada impacto | 24 ticks, **una sola vez** |
| Alcance vertical | cilindro: alcanza en el aire | elipse de **±7,6 px**: solo el suelo |
| Versión aérea | sí | no |
| Invulnerabilidad | toda la animación | toda la magia ✓ |
| Coste | 33 / 42 / 50 PM, barra 100 → 200 | 35 PM fijos, barra 100 → 120 |
| Niveles | 3, con 1.650 y 4.500 orbes | no hay |
| Duración | ~8 s machacando; menos sin machacar | 84 ticks = **1,4 s** |

Lo que ya está bien: la invulnerabilidad durante todo el conjuro, la forma (rayo desde arriba + onda en el suelo) y el coste relativo (un tercio de la barra).

Lo que falta, en orden de impacto sobre lo que se siente al jugar:

1. **Un solo impacto por enemigo.** Es el defecto que señalaste. En el original el enemigo recibe daño repetido mientras está dentro del área: es lo que hace que la magia "borre" un grupo y no que lo toque.
2. **Daño total ínfimo frente al golpe básico.** Hoy la magia entera pega menos que un □. En el original es la herramienta más eficiente del juego.
3. **Aturdimiento único.** Al no renovarse, el soldado golpeado vuelve a su IA enseguida.
4. **Alcance vertical.** En el original alcanza a los que están en el aire; nuestra elipse es de 15 px de alto.
5. **Duración y niveles.** 1,4 s sin mejoras posibles.

## 6. Lo que hay que decidir antes de tocar código

La pregunta de diseño es **para qué sirve la magia en nuestro juego**, porque de eso sale el número:

- **(a) Como el original:** a nivel máximo un lanzamiento mata un grupo de legionarios. Pide daño total de varias veces la vida de un soldado (60) y ~30 impactos, con aturdimiento renovado. Con 100 de maná son 2–3 lanzamientos por barra: desequilibra el combate a favor de la magia, igual que en GoW 1.
- **(b) Como despeje:** muchos impactos, aturde a todos los alcanzados y deja a los soldados al borde de la muerte sin matarlos. Es el punto medio: se siente como el original (ráfaga de impactos, enemigos trabados) sin convertirla en un botón de victoria.
- **(c) Como está, pero con impactos repetidos:** el mismo daño total (8) repartido en varios ticks. Se siente más eléctrico pero sigue siendo casi decorativa.

Sin decidir (a), (b) o (c), cualquier número que ponga es una decisión de diseño tomada por mí y no por vos.

## Fuentes

- **Guía oficial Prima** (*God of War*, 2005), capítulo "Power of the Gods": tabla de *Poseidon's Rage* (coste, daño base, daño machacando, mejora), invulnerabilidad durante la animación, versión aérea, uso como control de multitudes. Texto completo: <https://archive.org/details/God_of_War_Prima_Official_eGuide>.
- **Wiki de God of War (Fandom), *Poseidon's Rage*:** costes de orbes (1.650 / 4.500), descripción de los niveles y *Wrath of Poseidon* con 8 segundos de invencibilidad. <https://godofwar.fandom.com/wiki/Poseidon%27s_Rage> (copia: <https://web.archive.org/web/20250119094824/https://godofwar.fandom.com/wiki/Poseidon%27s_Rage>).
- **Hilo de pruebas de la comunidad (Stinger Magazine, "God of War 1 General Discussion", página 3):** daño por impacto de cada nivel, daño total medido a nivel 3 (154,1662903 y 221,5926361), coste de maná 33/42/50, "hits infinitely vertically" y la comparación de daño por maná. <https://stinger.actieforum.com/t130p100-god-of-war-1-general-discussion>.
- **Neoseeker, guía de jefes:** "37+ hits with each if you've got the ability maxed out". <https://neoseeker.com/god-of-war/faqs/120526-god-boss.html>.
- **GameFAQs, tablero de God of War:** "about 50 hits per cast" contra tres Minotauros a nivel 3, "higher PR means more damage and hits per cast", y "a single cast will kill all enemies" en el Desafío de Poseidón. <https://gamefaqs.gamespot.com/boards/919864-god-of-war/48957132>.

No pude acceder a namu.wiki (403) ni a IGN (403). No encontré ninguna fuente con la duración exacta del lanzamiento sin machacar ni con la cadencia de impactos en cuadros.
