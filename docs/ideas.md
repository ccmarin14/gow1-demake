# Banco de ideas y referencias futuras

Ideas, notas y referencias de diseño para etapas futuras del desarrollo.

> **Regla para agentes:** este archivo reúne conceptos de diseño y referencias que no están activos. Ningún agente las toma como historias de backlog ni como requisitos vigentes, y nada de lo listado acá se implementa sin la instrucción explícita del usuario. Cuando el usuario decide una idea, pasa a `docs/decisiones.md` y `docs/direccion.md`, se crea su historia en `docs/estado.md` §3 y se borra de acá.

**Ya decidido (fuera de este archivo):** el recorrido del Mar Egeo, sus enemigos, el agua vadeable, las cuerdas y la Hidra (D-44, D-45, `direccion.md` §8), la cámara de seguimiento (D-46, `direccion.md` §9), el vertical slice con sus vigas y el cómic (D-47, D-50, §10) y el HUD, el contador de golpes y los menús (D-48 a D-50, §11).

**Cómo leer cada idea:**

- **Alcance:** *Nivel 1* es el Mar Egeo; *General* aplica a todos los niveles.
- **Respaldo:** *Original* (está en el *God of War* de 2005, con su fuente al final), *Usuario* (idea del usuario) o *Agente* (propuesta de un agente).

---

## General (todos los niveles)

### G-02 · Calibración de la altura del salto
- **Respaldo:** observación de la Usuario. Medición: Agente.
- **Medición (`src/config.ts`, `PLAYER.vertical`):** con `jumpSpeed` de 380 y `gravity` de 1000, el salto simple sube unos 72 px y el doble salto suma otros 72 aproximadamente, unos 144 px en total. Es más de la mitad de los 270 px de alto de la pantalla, y unas 2,6 veces el lienzo de Kratos (56 px).
- **Meta:** bajar la altura del salto para que haya espacio de pisos y techos transitables en pantalla.
- **Pendiente:** el salto está fijado por D-32 y cubierto por pruebas. Si la Usuario lo decide, pasa a decisión e historia.

### G-03 · Cuerdas: balanceo y penalización por caída
- **Respaldo:** Original [2] (balanceo). Caídas: Usuario.
- **Decidido aparte (D-44):** deslizamiento sin enemigos y travesía horizontal colgado con enemigos (BL-24).
- **Balanceo:** el original incluye balancearse en cuerdas para cruzar abismos [2].
- **Penalización por caída:**
  - **No letal:** en algunas secciones, caer deja a Kratos en un piso inferior y le permite retomar el camino sin morir.
  - **Letal:** sobre abismos o zonas mortales, soltarse o caer es la muerte directa.

### G-04 · Equilibrio y vigas estrechas (adaptación 2D)
- **Respaldo:** Original [1] [2] (vigas). Variantes: Usuario.
- **Principio:** en 2D el equilibrio no funciona con inclinación pasiva. Se traduce en desafíos de ritmo, reflejos y lectura del entorno.
- **Variantes según el contexto** (se usan por separado, nunca todas juntas):
  - **Arqueros al extremo:** proyectiles a distancia que obligan a saltar o esquivar al ritmo de los disparos mientras se avanza.
  - **Fuego o vapor:** llamaradas o escapes intermitentes. Hay que detenerse y cruzar en la ventana segura.
  - **Maderos débiles:** tablones que ceden poco después de pisarlos (ya decidido para las vigas del vertical slice, `direccion.md` §10). **Criterio de arte:** si hay maderos desconectados, se ven sus vigas de apoyo, cuerdas o soportes; nunca flotan en el aire.
  - **Ráfagas de viento:** el viento tumba a Kratos y lo deja colgado del borde de la viga. Hay que machacar un botón para subir antes de caer.

### G-05 · Escalada en superficies verticales
- **Respaldo:** Original [1] [2]. Adaptación 2D: Usuario.
- **Superficies:** redes de soga, escaleras, mallas, muros de piedra rugosa y acantilados. Kratos se adhiere y se mueve en las cuatro direcciones del plano.
- **En el original:** mientras se trepa, el combate es limitado y se puede saltar hacia los costados y hacia arriba [1]. Los enemigos también trepan. Los golpes disponibles trepando quedan para después (P-06 en `direccion.md` §8).
- **Ventaja en 2D:** traslada de forma directa la mecánica original (saltos entre paredes, bajada rápida, esquivar obstáculos verticales) sin ejes de cámara complejos.

### G-06 · Puzles de entorno
- **Respaldo:** Original [1] [2].
- **Cajas:** empujarlas para usarlas de escalón, o deslizarlas con una patada cargada para usarlas de cobertura (en el Egeo, segundo barco).
- **Paredes y escombros que se rompen a golpes:** abren caminos y cofres.
- **Llaves y puertas:** algunos puzles piden juntar objetos de varias zonas para abrir una sola puerta [2]. En el Egeo, la llave del capitán.
- **Escotillas y puertas que se levantan:** con `context-action`.

### G-07 · Nado completo (después del Nivel 1)
- **Respaldo:** Original [2] [3].
- **Concepto:** en niveles posteriores el agua deja de ser vadeo (D-44) y pasa a ser un sistema de nado. El Tridente de Poseidón le permite a Kratos respirar bajo el agua y moverse en ella [2]. Esto da lugar a tramos de buceo con puzles y salidas ocultas.
- **Dónde se obtiene:** en el Desafío de Poseidón, dentro del Templo de Pandora [3].

### G-08 · Mapa de lugares del juego original
- **Respaldo:** Original [2].
- **Orden de la historia:** Mar Egeo (Hidra), Atenas sitiada por Ares, Desierto de las Almas Perdidas, Templo de Pandora (secciones de Atlas, Poseidón y Hades), Inframundo, y de vuelta en Atenas para el combate final.
- **Enemigos del juego:** soldados no-muertos, arpías, minotauros, Medusa y gorgonas, cíclopes, espectros, sirenas, sátiros, centauros y cerberos. Jefes: la Hidra y el Guardián de Pandora, un minotauro gigante.
- **Uso:** sirve de guía para planear los niveles siguientes. No es un compromiso de alcance.

### G-09 · Dosificación de enemigos, arenas de bloqueo y combate 2D
- **Respaldo:** observación y propuesta de la Usuario. Referencias técnicas: *Dead Cells*, *Hollow Knight*, *Blasphemous*.
- **El problema del combate 2D lateral:**
  - En 3D (GoW PS2), los enemigos rodean a Kratos en $360^\circ$ y la cámara gira.
  - En 2D lateral solo existen dos direcciones de entrada: izquierda y derecha. Apilar muchos enemigos en el suelo genera superposición de sprites (*sprite stacking*), tapa las animaciones de aviso (*windup*) y convierte la pelea en un cuello de botella ilegible o en un tiro al blanco.
- **Técnicas clave de resolución:**
  1. **Composición de roles (Tríada de arquetipos):** nunca enfrentar al jugador contra una masa idéntica en el suelo. Se combinan roles complementarios:
     - *Línea de frente (meleé):* 1 o 2 legionarios que fijan a Kratos en tierra y exigen guardia (`Q`) o rodada (`Shift`).
     - *Artillería (rango):* 1 arquero en plataforma elevada o al fondo que presiona con proyectiles periódicos.
     - *Disruptor (aéreo):* arpías o voladores que atacan en diagonal, obligando al combate vertical o aéreo.
  2. **Tokens de agresión y concurrencia (IA de turnos):**
     - En pantalla puede haber 3 o 4 enemigos, pero un sistema de turnos limita cuántos atacan a la vez: **máximo 1 atacante por flanco simultáneamente**.
     - Los demás adoptan conductas de espera, guardia con escudo (como `guard` a 72 px en `legionnaire.ts`) o retroceso para no saturar al jugador.
  3. **Arenas multinivel (Verticalidad para aislar amenazas):**
     - Las zonas de pelea deben contar con 2 o 3 plataformas o pisos. Permiten a Kratos saltar para matar primero al arquero, o elevar a un legionario con *Ascension* (△) para rematarlo en el aire sin interferencia de los de abajo.
     - *Alcance y Vertical Slice:* la verticalidad para aislar enemigos queda como concepto para el Nivel 1 completo y niveles posteriores. En el **vertical slice (D-53)** el combate es 100% sobre cubierta plana, resolviendo la dosificación mediante alternancia de bordas (izquierda/derecha/reja), umbrales de vida crítica y los turnos de D-43.
  4. **Arenas de bloqueo con sellos espectrales (Lockdown por oleadas):**
     - Al entrar a un combate obligatorio de GoW, rejas o sellos espectrales rojos bloquean ambos extremos de la pantalla.
     - **Dosificación por oleadas:** en vez de spawnear 8 enemigos juntos, la arena se supera en 2 o 3 oleadas cortas y diferenciadas (ej: oleada 1 con 2 legionarios; oleada 2 con 1 arquero en altura + 2 legionarios; oleada 3 con un enemigo pesado). Al limpiar la última oleada, el sello espectral se destruye y desbloquea el avance.

---

## Fuentes

1. Recorrido del Mar Egeo, *Joshua Cheats & Walkthroughs* (2010): https://joshua-cheats-walkthroughs.blogspot.com/2010/05/aegean-sea-god-of-war.html
2. Wikipedia, *God of War (2005 video game)*: https://en.wikipedia.org/wiki/God_of_War_(2005_video_game)
3. StrategyWiki, *God of War / Phoenix Feathers* (Desafío de Poseidón, vía buscador): https://strategywiki.org/wiki/God_of_War/Phoenix_Feathers

Las fuentes del Egeo y de la cámara están en `direccion.md` §8.
