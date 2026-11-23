# Guía de trabajo para agentes

## Propósito del proyecto

Juego de acción lateral 2D hecho con **Phaser 3.90.0**, **TypeScript** y **Vite** (resolución lógica 480×270). Combina la historia, los enemigos y el repertorio de combate del primer *God of War* (PlayStation 2) con el encuadre lateral y la lectura en pixel art de *God of War: Betrayal*.

## Documentación vigente

- **[`docs/estado.md`](docs/estado.md):** único documento de estado medido (qué funciona, problemas abiertos, siguiente paso y registro de cambios). Léelo siempre antes de empezar y actualízalo en el mismo commit de cada cambio.
- **[`docs/direccion.md`](docs/direccion.md):** dirección creativa, mapa de controles y guía visual.
- **[`docs/decisiones.md`](docs/decisiones.md):** decisiones vigentes.
- **[`docs/arquitectura.md`](docs/arquitectura.md):** separación entre simulación (`src/sim/`) y presentación Phaser (`src/scene/`).
- **[`docs/ideas.md`](docs/ideas.md):** ideas sueltas y referencias para etapas futuras. No son requerimientos activos; ningún agente implementa nada de acá sin orden explícita del usuario.
- **[`docs/archivo/`](docs/archivo/README.md):** historial en texto (cronología de pasos, historias cerradas, listas resueltas, informes de auditoría e investigación). No es una instrucción vigente: lee `estado.md`, `direccion.md` y `decisiones.md`. El material más viejo (planes, scripts procedurales y arte descartado) solo vive en git (`git show c2e8729:archivo/`).

## Flujo de trabajo

1. **Unidades chicas y revisables:** cada paso aborda un único cambio acotado (por ejemplo, un cuadro de animación en ASCII o la corrección de un defecto puntual).
2. **Juego siempre ejecutable:** al cerrar cada paso, `pnpm build` y `pnpm test` deben pasar y el juego debe cargar en navegador sin errores de consola ni peticiones 404.
3. **Aprobación visual directa:** en tareas de arte o animación, muestra el cuadro ampliado junto al cuadro de referencia (y en el navegador cuando se conecte al juego) y espera la aprobación del usuario antes de avanzar al siguiente cuadro. Un cuadro se commitea solo después de aprobado (un cuadro = un commit, con su línea en `docs/estado.md`); mientras está en revisión queda sin commitear. Los cuadros nuevos parten del borrador 3D (D-34) y se terminan con la cabeza aprobada de `idle-00` dibujado a mano (`git show 0af23ae:grids/kratos/idle-00.txt`, filas 12 a 17). Si el usuario no puede revisar en el momento, el cuadro se commitea igual y se anota en "Revisiones pendientes" de `docs/estado.md`; si después lo rechaza, se corrige en un commit nuevo. Ningún cuadro nuevo parte de uno pendiente: mientras haya revisiones pendientes se avanza en trabajo verificable sin ojo humano (simulación, harness, código).
4. **Lo heredado no es requisito:** la tabla "Mecánicas heredadas" de `docs/estado.md` lista lo que implementaron agentes anteriores sin que el usuario lo decidiera. Antes de dibujar arte para una de ellas, ampliarla o tomarla como base de un plan, pregunta si la quiere. Una mecánica pasa a "Verificada" solo con pruebas en `pnpm test`.
5. **Sin burocracia, documentación como debe quedar:** no crees planes extensos por etapa ni documentos nuevos fuera de los listados arriba. Excepciones: `docs/archivo/` (historial en texto) y `docs/temporal/`, que guarda el brief de la tarea en curso para otro agente (uno por tarea) y se borra en el mismo commit que la cierra. La documentación describe **cómo debe quedar** el proyecto, no la cronología: no la sesgues a lo que ya estaba escrito, reescríbela. Registra una línea por paso en `docs/estado.md` §4; cuando pasen de unos doce, mueve los viejos a `docs/archivo/registro-pasos.md`, y las historias cerradas a `docs/archivo/backlog-cerrado.md`.
6. **Imágenes de trabajo dentro del proyecto y limpieza:** las vistas previas, comparaciones, grabaciones y guías van en `docs/tmp/` (ignorada por git), nunca en `/tmp` del sistema, para que el usuario pueda abrirlas. `docs/tmp/` solo conserva los videos y fotogramas de **referencia** y el material de la tarea en curso: al cerrar una tarea se borra lo regenerable (grabaciones por tick, renders intermedios, extracciones de video) y lo que sirva como historial pasa a `docs/archivo/` en texto.

## Reglas de arte y animación (ASCII → PNG)

- **ASCII semántico como fuente de verdad:** los sprites de personajes viven en `grids/` como texto plano donde cada letra representa un material o rol de color claro en `palette/` y `.` es transparencia. El PNG se genera con `pnpm art` (usa `scripts/ascii_to_png.py`) y nunca se edita a mano; `pnpm art:check` valida los grids.
- **Método de dibujo para agentes:** sigue `docs/direccion.md` §5. Las animaciones arrancan como borrador renderizado del maniquí 3D (D-34) y se terminan a mano; fuera de ese borrador, ningún script escribe en `grids/*.txt`.
- **Dibujo directo, sin deformación por scripts:** cada cuadro se dibuja en su grid manteniendo el mismo modelo anatómico del personaje. Queda prohibido generar humanoides con trazos vectoriales procedurales (`draw_limb_segment`, polígonos) o derivar cuadros trasladando/cizallando bloques por script.
- **Cada cuadro es una pose completa:** todo el cuerpo cambia con el movimiento (cabeza, hombros, torso, brazos, cadera y piernas). Prohibido componer un cuadro pegando partes de otro, a mano o por script (por ejemplo, el torso de `idle-00` sobre piernas nuevas): se ve cortado en la cadera y rígido arriba, y el usuario lo rechazó. Única excepción: la cabeza aprobada de `idle-00` dibujado a mano (`git show 0af23ae:grids/kratos/idle-00.txt`, filas 12 a 17), que es rígida, se reutiliza en la terminación de cada cuadro para que la cara sea siempre la misma.
- **Separación de capas:** el grid del personaje solo contiene su cuerpo y vestimenta. Las cadenas, las hojas extendidas y la sombra de contacto se renderizan en capas separadas del motor (`WeaponLayer` y sombra en escena).
- **Chequeos básicos de cada cuadro** (los ejecuta `pnpm art:check`): dimensiones exactas declaradas para el personaje, solo caracteres presentes en su paleta, alfa binario (`0` o `255`) y pies apoyados en la fila de suelo en las poses terrestres.

## Lecciones clave a preservar

- **`tsc` y `pnpm build` no verifican el juego:** un build en verde no detecta texturas 404 ni animaciones rotas. Verifica en navegador real (Chrome DevTools MCP o Chrome headless por CDP) que la consola y la red estén limpias.
- **Fidelidad de píxel no equivale a calidad visual:** comprobar que un PNG se dibuja idéntico a sí mismo no dice si la pose se entiende. El juicio estético requiere mostrar la imagen ampliada al usuario.
- **Dos cuerpos en contacto se verifican en el juego real, no en la simulación:** las pruebas de `src/sim/` no dicen si la mano de Kratos toca el cuello de la víctima ni si el soldado se ve de pie flotando. Para cualquier movimiento con contacto (agarres, remates), graba la secuencia tick a tick en el navegador, ponla junto al fotograma del video y mide el contacto con anclajes antes de decir que está listo; un "listo" sin esa tira no vale (error del paso 135).
- **Dos cuerpos en contacto se verifican en el juego real, no en la simulación:** las pruebas de `src/sim/` no dicen si la mano de Kratos toca el cuello de la víctima ni si el soldado se ve de pie flotando. Para cualquier movimiento con contacto, graba la secuencia tick a tick (`scripts/verify/grab_rec.sh`), ponla junto al fotograma del video y mide el contacto con anclajes. Una prueba de contacto de un instante tampoco basta: hace falta una de **continuidad entre ticks** (desplazamiento máximo, ninguna pose que parpadee, la animación mortal completa).
- **Una auditoría independiente encuentra lo que el autor no ve:** un agente de solo lectura, exigente, que graba el juego real (a ambos lados), extrae fotogramas del video y refuta las afirmaciones del implementador, bajó la nota de ○ de lo que yo creía a 3 sobre 10 y señaló los fallos concretos (`docs/archivo/auditoria-circulo-*.md`). Úsala antes de decir "listo" en algo visual, y de nuevo tras corregir.
- **El sonido no se oye en Chrome sin cabeza:** verifícalo con medidas (`pnpm audio:check`: graves, chasquido, cola, audible en altavoz pequeño, escala de intensidad) y deja los WAV para que el usuario los escuche. Un efecto de sonido, de sacudida o de sangre se dispara por **flanco** (cambio de estado), no por igualdad de tick: la escena corre por fotograma de pantalla.
- **El usuario dirige el pulido de los golpes (D-59):** no lances olas de cambios ni auditorías largas por tu cuenta. El usuario juega, da feedback de un golpe a la vez, tú reproduces el problema, haces un cambio chico y se lo muestras; un golpe se aprueba solo cuando él lo dice. Las pruebas protegen lo aprobado; no sustituyen su juicio. (Un trabajo grande con fichas, auditorías y olas se hizo en la rama `decepcion` y no mejoró lo que él sentía al jugar.)
- **No mezclar carga de assets:** registra las texturas en `src/assets/manifest.ts` en lugar de dispersar llamadas `this.load` en `ShellScene.ts`.

## Reparto del trabajo (modelos y bloqueos)

El backlog vive en `docs/estado.md` §3: cada historia dice qué modelo la trabaja, su estado y qué la bloquea. Antes de empezar, elige una historia *Lista* y avisa de la superficie que vas a tocar.

- **Haiku:** trabajo mecánico con verificación automática: ajustar números de datos (tiempos, daños, gravedad, anchos de estela) con una prueba por regla, renombrar o mover, borrar código muerto comprobado con `grep`, correr verificaciones y capturas, actualizar docs desde una lista. Nunca juzga imágenes: si hay que decidir cómo se ve una pose o un golpe, no es Haiku.
- **Sonnet:** lo que exige mirar renders y compararlos con el video (poses, siluetas, estelas), diseñar sistemas nuevos y los refactors con riesgo.
- **Opus:** solo si Sonnet falla dos veces seguidas en lo mismo y hay cupo. Hoy el cupo semanal de Sonnet y Opus es limitado: cuando el usuario avise que se acabó, Haiku sigue con sus historias y las de Sonnet pasan a su carril alternativo ("Carriles de trabajo"), con autorización del usuario; si ese carril no puede verificar su trabajo, la historia espera.
- **Bloqueantes:** una historia en estado *Decisión* o *Lista del usuario* no se empieza sin esa respuesta; una *Cupo* espera. Las historias *Lista* de distinta superficie (S1 golpes, S2 simulación, S3 presentación, S4 docs, S5 herramientas) se pueden trabajar a la vez; dos historias de la misma superficie, no (un solo escritor).
- **Quien delega verifica:** corre `pnpm test`, `pnpm build`, `pnpm art:check` y el navegador (0 errores, 0 404) y mira el diff; no se fía del informe. Antes de esperar un trabajo en segundo plano, comprueba con `pgrep` y las fechas de los archivos que sigue vivo.
- **Un subagente no commitea ni cierra una revisión visual:** eso lo hace la sesión principal con la aprobación del usuario. Cada subagente se lanza con el modelo indicado explícitamente.
- **Las fuentes mandan sobre la interpretación:** una mecánica de GoW 1 se respalda con el manual oficial de PS2, un video o una wiki, y se anota qué respaldo tiene. Lo que no tiene respaldo y el usuario pide igual se hace, y se anota como decisión suya (`docs/estado.md`, "Decisiones de combate pendientes").
- **Otras herramientas del usuario (opencode, Copilot CLI, `agy`):** solo se les manda trabajo con autorización explícita del usuario, porque el texto del proyecto sale a servicios externos. Qué hace cada una y cuándo se usa está en "Carriles de trabajo", abajo. Nunca `--dangerously-skip-permissions`, `--allow-all-tools` ni `opencode --auto`.

## Carriles de trabajo (quién hace qué y cuándo)

Cada historia del backlog (`docs/estado.md` §3) dice su modelo; esta tabla dice qué herramienta lo cubre si ese modelo no está disponible. Se usa el carril **principal** mientras tenga cupo; el **alternativo** solo cuando el principal falta, y la calidad no baja porque la verificación es la misma para todos. Mientras un carril está caído se avanza en las historias de los demás (otra superficie, S1 a S5), no se espera.

| Trabajo | Principal | Alternativo (medido) | Qué verifica quien delega |
| --- | --- | --- | --- |
| Cambio mecánico con pruebas existentes (mover, renombrar, ajustar datos) | Haiku | Copilot `--model auto` en modo agente (hizo solo el refactor de prueba: 228/0, `tsc` limpio, solo los dos archivos pedidos) | Pruebas, `tsc`, diff limitado a los archivos pedidos |
| Escribir una prueba nueva | Haiku o Sonnet | `agy` con `claude-opus-5-5 --effort high` (devuelve el archivo como texto; quien delega lo guarda) | La prueba pasa **y** falla al romper a mano lo que cubre (mutación). Copilot escribió una prueba en verde que no detectaba un cambio en el README: no se acepta una prueba solo porque pase |
| Refactor con riesgo, sistema nuevo | Sonnet | `agy` con `claude-opus-5-5 --effort high`, como texto (Opus solo con cupo, por la regla de arriba) | Todo lo de "Verificación común" y revisión del diff línea a línea |
| Juicio visual (poses, estelas, comparar con el video) | Sonnet | opencode `nemotron-3.5-super-vl-free` o Copilot `--model auto` con `--attachment` (ambos acertaron qué cuadros tienen estela) | El usuario aprueba cada cuadro (flujo §3); el alternativo solo prepara la comparación, no aprueba |
| Resumir o redactar docs | Haiku | `agy` con `gemini-3.8-flash-medium`; Copilot y opencode también cumplieron (`gemini-4-argon` citó un archivo que no existe) | Comparar cada dato con el original |
| Segunda opinión de diseño | Sonnet | `agy` con `claude-opus-5-5 --effort high` | La decisión es del usuario |

**Cómo invocar cada herramienta** (detalles que fallan si no se saben):

- **Copilot CLI** (`copilot`, lee este `AGENTS.md` solo): `copilot -p "<tarea>" --model auto --allow-tool='write' --allow-tool='shell(node)' --allow-tool='shell(git)'` (añade solo los shells que la tarea necesita). `--model fusion` falla en la versión 1.0.105 ("requires dynamic Auto tiers") y `--fusion-tier` no existe; con `auto` Copilot elige el modelo y no se puede fijar. Es la única herramienta que muestra costo (créditos y tokens al final).
- **`agy`** (Antigravity): `agy -p="<texto completo>" --model claude-opus-5-5 --effort high`. El prompt va pegado a `-p=`; si va separado, toma la opción siguiente como prompt. Ningún modelo acepta `--effort max` (todos llegan a `high`). En `-p` no ejecuta comandos ni recibe imágenes: se le da el código dentro del prompt y devuelve texto.
- **opencode**: `opencode run -m opencode/nemotron-3.5-super-vl-free -f <archivo> "<pregunta>"` para visión y texto. Puede escribir archivos, pero en el refactor de prueba no terminó en 9 minutos: no se le da código hasta medirlo de nuevo.
- **Worktrees de prueba:** `git worktree add /tmp/gow8b-<herramienta>-<tarea> -b prueba/<herramienta>-<tarea> HEAD` y `ln -s` de `node_modules`. Ahí `pnpm test` aborta (pnpm quiere reinstalar sin terminal): se corre el comando de `test` de `package.json` directo. Se borran al terminar.

**Pendiente de medir:** opencode en una tarea de código; si `agy` puede editar con `--settings` y `permissions.allow`; una segunda muestra de visión con otra imagen. Cada carril alternativo se probó una sola vez (2026-11-03): sirve para asignar, no para dejar de verificar.

## Si se acaba el cupo de un modelo (contingencia)

Quien reciba el proyecto (otro modelo o otra herramienta) retoma desde `git log`, `git status` y `docs/estado.md` §3. Regla de traspaso: al terminar cada sesión se deja el trabajo **commiteado y con el backlog actualizado**; nunca se cambia de herramienta con cambios sin commitear ni con un subagente en curso.

| Si falta... | Se sigue así | Límite |
| --- | --- | --- |
| Sonnet y Opus de Claude Code (cupo semanal) | Haiku sigue con sus historias; las de Sonnet pasan a su carril alternativo (tabla de arriba), previa autorización del usuario. | El arte avanza solo hasta la comparación preparada: la aprobación es del usuario. |
| Haiku | Sus historias mecánicas pasan a Copilot `--model auto`; las de redactar docs, a `agy` con Gemini 3.8 Flash. | Copilot ejecuta y verifica en el worktree; quien delega repite la verificación. |
| Todos los modelos de Claude | Copilot `--model auto` lleva la sesión principal (lee este archivo y ejecuta pruebas) y delega texto a `agy`. | Ningún cambio se commitea sin "Verificación común" en verde y, si hay prueba nueva, sin la mutación. |
| Ninguna herramienta | El usuario puede probar el juego (`pnpm dev`, o el túnel de Cloudflare) y anotar la lista de cosas por corregir; no se pierde nada porque el estado está en `docs/estado.md` y en git. | |

**Verificación común a todas las herramientas** (no depende de un modelo): `pnpm test`, `pnpm build`, `pnpm art:check` y la prueba de navegador `scripts/verify/browser-check.sh` (arranca Vite y Chrome sin cabeza, graba la partida y debe imprimir `errors 0 failed 0`); `scripts/verify/perf.mjs` mide cuadros por segundo con la CPU frenada. Los renders 3D necesitan Blender (`~/.local/bin/blender`) y `python3 scripts/pose_render/build_anchors.py --jobs 6`.

## Retomar el proyecto en una sesión nueva

Todo lo necesario está en el repositorio y en git; no dependas del contexto de ninguna conversación anterior.

1. Lee este archivo, `docs/estado.md` (§1 qué funciona, §2 problemas y la lista del usuario, §3 backlog con modelo y bloqueo de cada historia) y `docs/direccion.md` §6 (fuentes del moveset). Mira `git log --oneline -15` y `git status`.
2. Comprueba la base: `pnpm test` (verdes), `pnpm build` y `pnpm art:check`.
3. **Cuando el usuario solo dice "continúa":** no necesita darte más instrucciones; decide así.
   1. **Quién eres:** tu herramienta y tu modelo te ubican en un carril ("Carriles de trabajo"). Si eres el alternativo de un carril, trabajas las historias de ese carril.
   2. **Qué haces:** primero la lista nueva del usuario, si la hay (conviértela en historias con su modelo antes de tocar código); si no, una historia *Lista* de §3 que tu carril cubra, prefiriendo la que puedes verificar completa tú mismo. Una historia a la vez; antes de escribir código, avisa cuál tomas y qué superficie tocas.
   3. **Qué delegas:** solo la parte que tu carril no cubre, al carril que la tabla indica (por ejemplo, el juicio visual a un modelo con visión). Mandar texto a una herramienta externa necesita la autorización del usuario: pídela una vez por sesión. Lo delegado lo verificas tú.
   4. **Cuándo paras:** no hay historia *Lista* en tu carril; la historia necesita algo que no tienes (una decisión o una aprobación visual del usuario, un modelo con visión, Blender, el navegador); la verificación común no se puede correr o no queda en verde; o una herramienta delegada falla dos veces en lo mismo. Al parar, deja lo hecho commiteado (si verificó) y di en una línea qué falta y quién lo puede dar. Mientras esperas, avanza en otra historia *Lista* de otra superficie, si tu carril la cubre.
4. **Ver el juego en un celular:** `pnpm dev` (Vite en el puerto 5173, ya escucha en `0.0.0.0` y acepta `*.trycloudflare.com`) y en otra terminal `~/.local/bin/cloudflared tunnel --no-autoupdate --url http://127.0.0.1:5173`; la URL `https://….trycloudflare.com` sale en la salida y su nombre tarda uno o dos minutos en resolver. Es pública mientras corra el túnel: ciérralo con `Ctrl+C` al terminar.
5. **Imágenes y videos de trabajo:** viven en `docs/tmp/` (ignorada por git). Referencias que se conservan: `golpes-ref/moveset.mp4` (showcase de movimientos; *Grab 2 ○△* a los 448 s, *Grab 3 ○□* a los 452 s, *Harpoon* a los 456 s), `legionario-ref/hd.mp4` (*Grab 1* a los 82 s), `gow1-grab/full.mp4` (partida larga), `egeo-video/egeo.mp4` (el Egeo), las hojas de fotogramas de `grab-ref/` y `poseref/`, `sc35.txt` (guía de orbes de Supercheats) y `tools/yt-dlp`. Si faltan, el video se baja de YouTube (`0X9RiODtCB4`) con `yt-dlp -f 18`; el maniquí 3D es el de `scripts/pose_render/kratos.json`. Lo regenerable (grabaciones de `grab_rec.sh`, renders intermedios) se borra al cerrar la tarea (ver el punto 6 del flujo).
6. Al terminar la sesión: todo commiteado, `docs/estado.md` con el paso nuevo y el backlog al día. La memoria del asistente (Engram) ayuda, pero lo que no está en estos archivos o en git no existe para la próxima sesión.
