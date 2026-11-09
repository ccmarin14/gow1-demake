# Banco de ideas y referencias futuras

Ideas, notas sueltas y referencias conceptuales para etapas avanzadas del desarrollo.

> **Regla para agentes:** este archivo contiene conceptos de diseño y referencias no activas. Ningún agente debe tomarlas como historias de backlog, requerimientos vigentes ni implementar nada de lo listado acá sin la instrucción explícita de la usuaria.

---

## Nivel 1 (Mar Egeo)

### Tramos con agua en barcos (en lugar de nado profundo)
- **Alcance:** aplica **únicamente al Nivel 1**. Más adelante sí habrá sistema de nado completo; esto evita implementar nado prematuramente en la primera etapa donde no aporta valor.
- **Concepto:** el agua interior de las bodegas se resuelve como un desnivel o tramo inundado transitable a pie (vadeo).
- **Física y movimiento en el agua (Nivel 1):**
  - **Velocidad reducida:** desplazamiento terrestre más lento mientras se pisa agua.
  - **Salto limitado:** si se salta desde adentro del agua, el salto es más corto y se bloquea el doble salto.
  - **Diseño del obstáculo:** longitud o techo suficiente para que no se pueda saltear saltando de orilla a orilla.

### Progresión entre múltiples barcos
- **Alcance:** específico del **Nivel 1**.
- **Concepto:** el avance no transcurre en un solo barco estático, sino en el cruce y exploración a través de varias naves enlazadas.

### Deslizamiento por cuerdas
- **Alcance:** aparece en el **Nivel 1** y puede aplicar a otros niveles.
- **Concepto:** Kratos se desliza colgado de una cuerda entre dos puntos.
- **Requisito de diseño:** el recorrido siempre va de un punto alto a uno más bajo, para que el deslizamiento tenga sentido físico.

### Encuentro inicial con la Hidra (interior del barco)
- **Alcance:** específico del **Nivel 1** (combate temprano en bodegas).
- **Puesta en escena y comportamiento:**
  - La criatura no se ve completa: solo el cuello y la cabeza.
  - Emerge desde abajo (como saliendo del agua) y ataca posicionada sobre el lateral derecho de la pantalla.
  - Simplifica el arte y el encuadre 2D sin perder la escala ni la tensión del momento original.

### Combate final contra la Hidra (jefe de Nivel 1)
- **Alcance:** clímax del **Nivel 1**.
- **Disposición de la arena:**
  - Dos cabezas secundarias ubicadas en los laterales (una a cada lado).
  - La cabeza principal gigante ubicada arriba (en la cima/mástil central).
- **Movimiento y espacio:** la arena debe incorporar desplazamiento tanto horizontal como vertical para enfrentar a las cabezas laterales y escalar hacia la cabeza principal.

---

## Diseño general del juego

### Verticalidad, puzles y cámara
- **Estructura multinivel:** aunque el avance sea principalmente horizontal, los escenarios deben contar con varios pisos y verticalidad real.
- **Cámara:** seguimiento vertical (scroll en Y) que sube o baja según el piso donde se encuentre el personaje.
- **Puzles y backtracking:** la verticalidad da espacio a los acertijos de entorno y caminos cerrados que obligan a regresar sobre los pasos para desbloquear el progreso, como en el juego original.

### Comportamiento y cinemática de la cámara 2D (buenas prácticas)
Referencia técnica: patrones de *Scroll Back: The Theory and Practice of Cameras in Side-Scrollers* (Itay Keren).
- **Seguimiento suavizado con retardo (Lerp / Smooth Damping):**
  - La cámara nunca debe centrarse de forma rígida instantánea al pixel del jugador. Debe desplazarse con inercia e interpolación suave hacia su objetivo para evitar mareos y vibración visual.
- **Ventana muerta (Deadzone / Drag Window):**
  - Rectángulo central donde Kratos puede moverse, dar pequeños pasos o girar sin que la cámara se desplace.
  - La cámara solo empieza a moverse cuando el personaje cruza el límite exterior de esa caja.
- **Desacople vertical en saltos (Platform Snapping):**
  - La cámara **no debe rebotar ni seguir la parábola de cada salto normal**.
  - El eje Y se mantiene estable durante el brinco y solo se ajusta suavemente si Kratos aterriza en una plataforma de otra elevación o cae por debajo de un umbral seguro.
- **Anticipación de avance (Look-Ahead):**
  - La cámara se posiciona con un desplazamiento sesgado hacia el frente de la orientación (`facing`), dando más espacio visible hacia donde Kratos mira/avanza para anticipar enemigos y ataques.

### Calibración de la altura del salto
- **Observación actual:** el salto de Kratos es excesivamente alto para la resolución lógica (480×270 px) y no deja aire para ubicar niveles o plataformas superiores en pantalla.
- **Meta:** reducir la altura del salto en el diseño general para habilitar la verticalidad y los techos transitables.

### Travesía y combate en cuerdas horizontales
- **Alcance:** aplicable a varios niveles según la progresión.
- **Concepto:** Kratos avanza colgado de manos por cuerdas horizontales y combate contra enemigos a lo largo de la cuerda. Es una mecánica que traslada de forma muy directa la jugabilidad de GoW al plano 2D lateral.
- **Penalización por caída:**
  - **Caída no letal:** en ciertas secciones, caer deposita al personaje en un piso inferior y permite retomar el camino sin morir.
  - **Caída letal:** en tramos sobre abismos o zonas mortales, soltarse o caer causa la muerte directa.

### Tramos de equilibrio y vigas estrechas (adaptación 2D)
- **Principio:** el equilibrio en 2D no funciona con inclinación pasiva; se traduce en desafíos de ritmo, reflejos y lectura del entorno.
- **Variantes por contexto (aplicar de forma independiente, nunca acumuladas todas juntas):**
  - **Arqueros al extremo:** proyectiles a distancia que obligan a saltar o esquivar en sincronía mientras se avanza.
  - **Peligros de fuego o vapor:** llamaradas o escapes intermitentes que exigen pausar la marcha y cruzar en la ventana segura.
  - **Maderos débiles:** tablones que ceden al poco tiempo de pisarlos. **Regla de arte obligatoria:** si hay maderos desconectados, deben mostrar vigas de apoyo, cuerdas o soportes estructurales; nunca deben verse flotando en el aire.
  - **Ráfagas de viento con recuperación:** golpes de viento que tumban a Kratos dejándolo colgado del borde de la viga; exige machacar un botón rápidamente para reincorporarse antes de caer.

### Escalada y desplazamiento en superficies verticales (mallas, redes, muros y riscos)
- **Alcance:** general, aplicable a la exploración vertical de múltiples niveles.
- **Superficies escalables:** mallas (metálicas o de carga), redes de soga en naves, muros de piedra rugosa y acantilados. Kratos se adhiere y se desplaza en las cuatro direcciones cardinales del plano 2D.
- **Ventaja en 2D:** traslada de forma limpia y directa la mecánica original de GoW, integrando saltos entre paredes, bajada rápida y esquive de obstáculos verticales sin necesidad de adaptar ejes de cámara complejos.

---

## Narrativa y cinemáticas

### Narración mediante paneles de cómic (en lugar de videos)
- **Concepto:** reemplazar las cinemáticas de video pre-renderizadas por viñetas ilustradas estilo cómic / novela gráfica.
- **Ventajas de diseño:**
  - Estética coherente con el formato 2D pixel art clásico sin romper la inmersión con videos comprimidos.
  - Cero sobrecarga técnica: no requiere decodificación pesada de video ni dispara el tamaño del bundle de assets.
  - Permite presentar el lore, los diálogos de los dioses y el pasado de Kratos con ritmo pausado y controlado por el jugador.

