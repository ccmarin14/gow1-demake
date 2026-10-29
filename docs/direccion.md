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
| `jump` | `Espacio` | Cruz ($\times$) | Salto simple, doble salto y descenso en plataformas (`Abajo + Espacio`). |
| `light-attack` | `J` | Cuadrado ($\square$) | Tajos rápidos encadenados. |
| `heavy-attack` | `K` | Triángulo ($\triangle$) | Golpe pesado, lanzamiento ascendente y remate *Pluma de Prometeo* (`J, J, K`). |
| `grab` | `L` | Círculo ($\bigcirc$) | Agarre o remate contextual. |
| `dodge` | `Shift` | Stick derecho | Evasión terrestre con ventana de invulnerabilidad. |
| `magic` | `U` / `I` | L2 | Magia activa (*Ira de Poseidón*). |
| `context-action` | `E` | R2 | Interacción con cofres y entorno. |
| `guard` | `O` | L1 | Guardia y desvío (*parry*) en los primeros ticks. |
| `pause` | `Escape` | Start | Pausa. |

## 3. Reglas visuales y de pixel art

- **Resolución lógica:** 480×270 píxeles, escalada en navegador con `pixelArt: true` (nearest-neighbor, sin suavizado).
- **Jerarquía de lectura:** Kratos y sus armas → enemigo activo y anticipación de ataque → suelo y bordes de plataforma → fondo marino y lluvia.
- **Construcción desde ASCII:**
  - Los sprites de personajes se editan en grids de texto (`grids/`) y se convierten a PNG mediante `scripts/ascii_to_png.py`. El PNG nunca se edita a mano.
  - Cada carácter del grid representa un **material o rol de color** claro (contorno, piel, piel en sombra, marca roja, bronce, cuero, metal) y `.` representa transparencia. Los grids rediseñados usan `palette/kratos.json` (letras mnemónicas con `roles` nombrados, declarada en el campo `palette` del `manifest.json` del personaje); el `master.txt` heredado usa `palette/master.json`, con letras `a..l` por luminancia que no son roles.
  - **Separación de capas:** el sprite del personaje contiene únicamente su anatomía y vestimenta. Las cadenas, las hojas extendidas y la sombra de contacto se dibujan en capas separadas del motor (`WeaponLayer` y sombra en escena) para no duplicar armas ni arrastrar la sombra durante el salto.
  - **Trabajo incremental:** cada cuadro nuevo se dibuja completo en ASCII, se rasteriza y se presenta ampliado junto al cuadro base para aprobación visual antes de pasar al cuadro siguiente.

## 4. Esencia de *God of War*: brechas y plan

Revisión del 2026-10-29 contra el primer *God of War*, hecha sobre código, configuración y capturas (sin prueba de sensación a mano). Cada brecha es un trabajo pequeño e independiente; ninguna se ha implementado. El estado vivo de cada una está en `docs/estado.md`.

**Qué ya cumple:** combate con las Cuchillas del Caos (14 movimientos con arcos amplios, combo, lanzador, aéreos, agarre, *hitstop* y buffer de entrada), guardia con parry y rodada con invulnerabilidad, *Ira de Poseidón*, orbes, cofres con Ojos de Gorgona y Plumas de Fénix, mejora de arma, checkpoints y el tramo de la nave con la Hidra.

| ID | Brecha | Criterio de aceptación | Depende del arte |
| --- | --- | --- | --- |
| **ESE-01** | **Remates contextuales (QTE).** Es el rasgo más reconocible y no existe en `src/sim/`; las capturas de *Betrayal* de `docs/referencias/` ya lo muestran. | Un enemigo aturdido o con poca vida permite un remate con `L` dentro de una ventana de entrada; resultado determinista, con prueba en un escenario del harness. | No (marcador visual provisional). |
| **ESE-02** | **El agarre no agarra.** `chain_grab` es un golpe con arco que jala (`knockbackVx: -150`); no sujeta, lanza ni remata. | Agarrar sujeta al enemigo unos ticks y permite lanzarlo o rematarlo; se integra con ESE-01. | No. |
| **ESE-03** | **Impacto poco brutal.** *Hitstop* de 2 a 4 ticks, temblor de cámara solo en golpe al suelo y caída fuerte, y sin partículas de golpe más allá de chispas. | *Hitstop* y temblor proporcionales al peso del golpe, valores en `CONFIG` y medidos en el harness; chispas o fragmentos por impacto. | No (efectos en capas del motor). |
| **ESE-04** | **Enemigos de un solo truco.** El legionario solo tiene un tajo con anticipación. | Al menos un segundo comportamiento que dé sentido a la guardia o a la magia (por ejemplo, un ataque que solo se puede parar). | No. |
| **ESE-05** | **Sin historia.** El título pasa directo al nivel. | Introducción mínima de texto, sujeta a la regla D-30: nunca puede estorbar las pruebas. | No. |
| **ESE-06** | **Un solo hechizo y pocos enemigos.** El primer juego tiene cuatro hechizos y más variedad. | Diferido hasta que exista el arte base. | Sí. |
| **ESE-07** | **El arte aún no transmite a Kratos** (pose única, enemigos provisionales, audio sintético). | Se resuelve con el trabajo ASCII ya planificado (`idle-00` y siguientes). | Sí. |

**Orden recomendado:** ESE-03 (barato y de mayor efecto en la sensación), ESE-01 con ESE-02, ESE-04, ESE-05; ESE-06 y ESE-07 después. Los cuatro primeros avanzan mientras se redibuja a Kratos.

