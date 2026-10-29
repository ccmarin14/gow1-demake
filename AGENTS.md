# Guía de trabajo para agentes

## Entorno de IA para Phaser

- Para tareas Phaser, carga `.agents/skills/phaser3-project/SKILL.md` y consulta
  `docs/phaser-ai-environment.md` antes de seleccionar APIs o comprobaciones.
- La versión instalada de referencia es Phaser 3.90.0. La skill global `animations`
  describe Phaser 4: no la uses como autoridad de compatibilidad para este proyecto.
- Context7 y Chrome DevTools MCP ya están configurados en el host; comprueba su
  disponibilidad en cada sesión sin duplicar servidores ni instalar servicios.
- Adecuar el entorno no autoriza cambiar jugabilidad, sprites, niveles o motor.

## Propósito del proyecto

Este repositorio contiene un juego de acción lateral 2D hecho con Phaser, TypeScript y Vite. La dirección acordada combina el ritmo y la lectura visual de *God of War: Betrayal* con la historia del primer *God of War* de PlayStation 2, adaptada a pixel art. Antes de cambiar esta dirección, consulta al usuario.

## Cómo trabajar

- Inspecciona la implementación actual y conserva los cambios del usuario. No reemplaces archivos o sistemas completos sin una razón comprobada.
- Trabaja en pasos pequeños y coherentes. Mantén el juego ejecutable al finalizar cada paso.
- Antes de implementar una etapa, define su alcance y criterios de aceptación. Al terminarla, evalúala con evidencia reproducible y registra el resultado en `docs/estado-verificado.md`; corrige y vuelve a probar cualquier fallo antes de pasar a la etapa siguiente.
- Antes de implementar, lee el estado medido en `docs/estado-verificado.md` (qué arranca, qué funciona, qué defectos conocidos hay). `docs/verificacion.md` es el **registro histórico** del plan de etapas y de sus auditorías: no lo interpretes como afirmación del estado actual. Trabaja con una sola tarea activa cada vez y deja evidencia de su evaluación.
- Centraliza parámetros ajustables en la configuración del juego; evita dispersar números de balance entre escenas y entidades.
- Mantén separadas, en lo posible, las reglas de simulación, entradas, combate, entidades, escenas, interfaz, audio y recursos.
- Prioriza controles responsivos, combate legible y siluetas claras a la resolución interna. Los efectos no deben ocultar anticipaciones, personajes ni áreas peligrosas.
- Crea recursos originales. No copies sprites, fondos, audio ni otros recursos de los juegos de referencia. Etiqueta los recursos provisionales cuando se usen.
- Verifica tamaño, transparencia, anclajes y consistencia de cuadros de los sprites antes de integrar animaciones.

## Invariantes de Arte y Animación de Personajes (Anti-Regresión Visual)

- **Uso obligatorio de skills del proyecto:**
  * **`browser-testing-with-devtools` ([`.agents/skills/browser-testing-with-devtools/`](.agents/skills/browser-testing-with-devtools/)):** Obligatoria para toda verificación en navegador. Prohíbe validar cambios visuales o de jugabilidad sin inspección real en Chrome (captura de pantalla, estados de simulación tick a tick y consola limpia).
  * **`pixel-art-character-consistency` ([`.agents/skills/pixel-art-character-consistency/`](.agents/skills/pixel-art-character-consistency/)):** Obligatoria para toda modificación o revisión de sprites. Hace cumplir los 4 invariantes siguientes:
- **Prohibición de trazos vectoriales procedurales:** Queda terminantemente prohibido generar o modificar sprites de personajes humanoides mediante algoritmos de líneas (`draw_limb_segment`), polígonos matemáticos o fórmulas trigonométricas en Python. Los sprites deben ser arte pixel art rasterizado coherente, no maniquíes de alambre ni cañerías.
- **Coherencia de Modelo Único (Cero mutaciones entre estados):** Todas las animaciones de un personaje (`idle`, `run`, `air`, `attack`, `roll`) deben derivar de la **MISMA** base anatómica y estilo visual. Si el sprite maestro tiene una cabeza, masa y armas definidas, la animación de carrera debe conservar exactamente esa misma cabeza, masa y armas. Está estrictamente prohibido que el personaje mute de estilo, proporciones o diseño al pasar de quieto a corriendo.
- **Validación anatómica y de armas:** Verificar visualmente que cada extremidad tenga su arma correspondiente (exactamente una Cuchilla del Caos por mano, nunca dos en una sola mano) y que el rostro tenga rasgos reconocibles (ceño, perilla, nariz y tatuaje continuo de Ares).
- **Prueba obligatoria de transición lado a lado en navegador:** Toda entrega visual debe incluir una captura compuesta del juego real en el navegador comparando lado a lado: `[Reposo / Idle en cubierta]` vs `[Carrera / Run en cubierta]`. Si el estilo, el rostro, las armas o la masa corporal difieren entre ambos estados, la tarea queda automáticamente reprobada.
- **ASCII como fuente de verdad del pixel art de personajes (D-25):** Los sprites de personajes se producen desde grids de texto en `grids/`; el PNG es un artefacto derivado y nunca se edita a mano. Un solo maestro anatómico por personaje, paleta única en `palette/master.json` e invariantes verificables (continuidad de cabeza/torso, una cuchilla por mano, anclaje al suelo, ≤12 colores, determinismo por hash). Especificación: `docs/planes/PIXEL-ART-ASCII-MASTER-01.md`. Las hojas PNG actuales quedan congeladas hasta que exista un maestro aprobado: no se parchean.

## Frentes de trabajo

Cada tarea se atiende con tres roles y una sola tarea activa:

- **Orquestador (agente principal):** define el alcance, un criterio de aceptación y las funciones previas que deben protegerse; asigna la implementación y la auditoría a agentes distintos; contrasta evidencia, integra y decide si la tarea queda aprobada.
- **Implementador (subagente):** trabaja únicamente en la tarea asignada y entrega archivos modificados, comprobaciones ejecutadas, resultados y limitaciones. No amplía el alcance por cuenta propia.
- **Auditor (subagente distinto):** revisa la tarea terminada en modo de solo lectura. Comprueba los criterios de aceptación y vuelve a probar las funciones ya aprobadas para detectar regresiones. Informa hallazgos con evidencia y estado aprobado, fallido o parcial.

Cerrar una tarea documental no autoriza desarrollo. Si el estado vigente indica que no hay una etapa activa, iniciar desarrollo requiere autorización explícita del usuario. Una vez autorizada una secuencia de desarrollo, sus etapas internas continúan automáticamente sin pedir una nueva confirmación por etapa; pausa solo si el usuario lo pide, surge un bloqueo externo o queda sin resolver una decisión material. Al aprobar cada etapa, registra el aprendizaje y empieza la siguiente tarea del plan vigente; si falla, corrige y vuelve a auditar antes de avanzar. Comunica avances y entrega el informe de cierre al completar el plan o al encontrar un bloqueo.

Para toda corrección derivada de un hallazgo de auditoría, antes de editar el orquestador redacta un plan que incluya hallazgo y evidencia, archivos exactos, cambio propuesto, criterios de aceptación y regresiones protegidas. El auditor que reportó el hallazgo revisa ese plan en modo de solo lectura. Si lo rechaza, el orquestador revisa el plan y no se editan archivos hasta su aprobación. Si lo aprueba, un único implementador aplica la corrección y un auditor distinto realiza la reauditoría; los fallos vuelven a esta misma compuerta.

Reutiliza agentes cuando conservar su contexto ayude al trabajo y no comprometa la independencia de la auditoría. Crea uno nuevo cuando se necesite independencia, una especialidad distinta o el agente anterior esté bloqueado. El implementador y el auditor de una misma tarea siempre deben ser subagentes distintos. Elige el modelo de cada subagente según lo que el runtime ofrezca y lo que pida la tarea (implementación, auditoría, exploración), sin restricción de familia de modelo. Registra en el informe de la tarea qué modelo y runtime usó cada subagente. Si un subagente no puede ejecutarse, reasíguelo a otro disponible o ejecútalo el orquestador directamente, dejándolo constancia en el informe.

Los subagentes que implementen o escriban código usan el runtime de agentes disponible (por ejemplo, OpenCode). La auditoría de solo lectura la realiza preferentemente un subagente distinto del implementador; si no hay subagentes disponibles, el orquestador puede realizar la implementación y declarar la auditoría pendiente de delegación, sin aprobar su propia tarea. Si un runtime o subagente concreto no está disponible, reasigna en lugar de detener el trabajo, e indica la sustitución en el informe. Los cambios documentales no requieren delegación.

Nunca ejecutes dos agentes escritores simultáneamente sobre este proyecto, haya o no control de versiones. Si hay control de versiones, aísla la implementación en una rama o worktree por tarea; si no, limita el cambio al alcance acordado y revisa los archivos modificados antes de integrarlos. Una tarea no puede degradar una función aprobada: toda regresión se corrige y vuelve a auditar antes de cerrar la tarea. El orquestador no inicia la siguiente hasta integrar la actual y registrar, tras su aprobación, un aprendizaje transferible y agnóstico al juego en `docs/aprendizajes-del-proceso.md`.

## Verificación

- Después de cambios de jugabilidad, ejecuta el juego en navegador cuando sea posible y prueba las acciones afectadas con sus controles normales.
- Evalúa cada etapa por separado. Comprueba sus criterios específicos, repite una prueba breve de lo ya implementado para detectar regresiones, captura los momentos relevantes y revisa la consola. No marques una etapa como completada si sus criterios fallan o no se pudieron verificar; deja constancia del bloqueo y su alcance.
- Comprueba errores de consola y usa capturas para revisar el resultado visual. Compilar o pasar el typecheck no sustituye una prueba de juego.
- Distingue en los informes entre lo probado en ejecución, lo confirmado por lectura de código y las recomendaciones de diseño. No declares verificado lo que no pudiste probar.
- Si una herramienta de navegador, MCP o skill no está disponible, indícalo y continúa con la alternativa local gratuita más cercana. No uses herramientas de pago ni consumas créditos sin autorización explícita.
- **Antes de declarar algo como "pendiente de validación humana", agota Chrome DevTools.** "No puedo interpretar imágenes" NO equivale a "no puedo revisar". Con el navegador (CDP/DevTools) sí se puede comprobar: estado de simulación tick a tick, cuadros del clip (`anims.currentFrame.index`), rotación/escala del sprite, cambio de clave de textura, diff de la silueta del personaje contra el fondo (`getImageData`), progresión de `snapshot().frame`, y errores de consola. Solo lo que exige juicio estético o sensación motora con teclado físico queda del lado humano.
- **Toda etapa de animación o *feel* cierra con evidencia medida, no solo con `tsc`/`build`.** Como mínimo: (a) secuencia de índices de cuadro a lo largo del tiempo (que el clip AVANCE, no solo que cambie la textura); (b) rango de rotación/escala efectivamente aplicado; (c) diff de silueta contra el fondo para aislar al personaje; (d) recorrido en px y duración en ms; (e) consola sin errores. Declarar una animación "aprobada" porque la textura cambia es un falso positivo: el clip puede estar congelado en el cuadro 0 y verse como otra cosa.
- Asigna un auditor distinto para cada tarea de implementación; la auditoría final de la lista también revisa el conjunto integrado. No pidas al auditor que edite archivos. Contrasta sus hallazgos con el código y la ejecución actual, corrige los problemas comprobados y repite la auditoría si quedan riesgos importantes.
- Las comprobaciones que solo puede hacer la usuaria (lectura visual, sensación con teclado físico, lateralidad percibida) **no bloquean el avance**: este runtime no interpreta imágenes y usa teclado sintético, así que esas deudas se **registran y se continúa**. Mantén el registro central `docs/pendientes-de-validacion-humana.md` al día y no dejes que una validación humana pendiente detenga el desarrollo; si la usuaria reporta un defecto, se corrige por la compuerta normal.
- Después de auditar cada etapa, añade o actualiza en `docs/aprendizajes-del-proceso.md` una lección transferible, también si el estado es parcial o fallido. Mantén ese registro agnóstico al juego: los resultados y decisiones propios del producto van en sus documentos específicos.

## Cambios y comunicación

- No edites durante tareas que el usuario haya definido como auditorías de solo lectura.
- No añadas dependencias, servicios externos, telemetría o cambios ajenos al objetivo solicitado.
- Al cerrar una etapa, resume qué cambió, qué verificaste, qué archivos tocaste y qué limitaciones quedan. Mantén los informes concretos y basados en evidencia.
