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
  - Cada carácter del grid representa un **material o rol de color** claro (contorno, piel, piel en sombra, marca roja, bronce, cuero, metal) y `.` representa transparencia. Los grids de Kratos usan `palette/kratos.json` (letras mnemónicas con `roles` nombrados, declarada en el campo `palette` del `manifest.json` del personaje).
  - **Estilo de sombreado:** luz desde arriba a la izquierda. Del lado de la luz el borde es de color (granate `c` o bronce `b`); el contorno oscuro `o` va solo del lado de la sombra. Las formas se modelan pasando por los tonos intermedios (`s` → `m` → `b` → `d`), no saltando de claro a contorno. La cara es mínima, como en *Betrayal*: cráneo claro, franja roja con borde granate, oreja, cuenca del ojo granate bajo la ceja iluminada, pómulo con luz y chivera insinuada bajo el mentón; sin nariz ni boca dibujadas. El modelo de la cara y del sombreado es la cabeza aprobada de `idle-00` dibujado a mano (`git show 0af23ae:grids/kratos/idle-00.txt`, filas 12 a 17).
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
| **ESE-07** | **El arte aún no transmite a Kratos** (pose única, enemigos provisionales, audio sintético). | Se resuelve con el trabajo ASCII ya planificado (borradores D-34 y su terminación). | Sí. |

**Orden recomendado:** ESE-03 (barato y de mayor efecto en la sensación), ESE-01 con ESE-02, ESE-04, ESE-05; ESE-06 y ESE-07 después. Los cuatro primeros avanzan mientras se redibuja a Kratos.

## 5. Método de dibujo para agentes

**Decisión:** el ASCII sigue siendo la fuente versionada (D-25), pero el agente deja de dibujar a ciegas. Lo que falló en los intentos archivados no fue el formato sino la falta de referencias y de retroalimentación: el agente situaba mal las partes y no podía comprobarlo. El método:

| Pieza | Qué es | Estado |
| --- | --- | --- |
| **Lienzo solo-cuerpo** | 64×56, pies en la fila 55. El 97×59 heredado reservaba espacio para armas y cadenas que ya no van en el sprite. La física no depende del lienzo (D-29). | Aplicado |
| **Tres pasadas** | Silueta (2 colores, la usuaria la aprueba), sombreado y contorno con detalle. Cada pasada es el cuadro completo dibujado a mano. | Regla vigente |
| **Vista previa con reglas** | `scripts/preview_grid.py`: ampliación con coordenadas y comparación lado a lado. Permite decir "codo en x=14, y=30" en vez de contar caracteres. | Existe |
| **Arranque desde referencia** | `scripts/quantize_reference.py`: recorta una región de una imagen existente y la convierte a `palette/kratos.json` por color más cercano (no por luminancia), como referencia ASCII para leer y calcar a mano. Escribe fuera de `grids/` (se niega a escribir dentro). Sus letras son por color, no por material; los roles se deciden al dibujar. | Existe |
| **Bucle visual** | El agente rasteriza, mira la vista previa ampliada, compara con la lista de comprobación y corrige, con un máximo de rondas. Requiere un modelo que vea imágenes. | Regla vigente |

**Regla dura:** ningún script, función o bucle puede generar o modificar el contenido de `grids/*.txt`. La única excepción es el borrador de D-34: `scripts/pose_render/to_grid.py` produce el grid inicial de un cuadro de animación, que después se termina con una herramienta de escritura de archivos, con filas literales.

**Borrador 3D (D-34), reemplaza la alternativa descartada:** el método de arriba no alcanzó la calidad de `idle-00` en los cuadros de movimiento. Ahora cada animación arranca de un render del maniquí CC0 de Quaternius:

1. `blender -b --python scripts/pose_render/render.py -- scripts/pose_render/kratos.json <acción> <carpeta> <cuadros> [poses/<pose>.json]` renderiza la acción con la complejidad de Kratos (volumen por hueso, faldón, cámara a 20°, luz arriba a la izquierda). Un archivo de `poses/` suma rotaciones por hueso cuando la acción no tiene la actitud de Kratos y puede fijar otra cámara (por ejemplo, `idle-imposing.json` abre piernas y brazos con el pecho de frente a 45°). El modelo se descarga en `docs/tmp/` (fuente en `kratos.json`).
2. `python3 scripts/pose_render/to_grid.py <render.png> <grid.txt> [--ground 55]` lo reduce a la paleta de Kratos: piel, cuero y sandalias por hueso, lado cercano y lejano, cuatro tonos y contorno; `--ground` apoya en el suelo las poses cuya raíz se despega (salto, rodada).
3. El borrador entra al juego como revisión pendiente para probar el movimiento.
4. La terminación es a mano: la cabeza aprobada de `idle-00` dibujado a mano (`git show 0af23ae:grids/kratos/idle-00.txt`, filas 12 a 17) donde el render pone la cabeza, tatuaje con borde granate, hueco del cuello bajo la mandíbula, faldón y textura de tonos mezclados. La forma la da el render; a mano no se rehace la anatomía.

