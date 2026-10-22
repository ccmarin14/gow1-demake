# Aprendizajes del proceso

Bitácora de métodos reutilizables aprendidos al completar cada tarea. Se mantiene agnóstica al juego: registra cómo planear, implementar, probar, integrar o coordinar el trabajo, no el lore, balance ni decisiones visuales del producto.

Añade o actualiza una entrada después de cada auditoría de etapa, sea aprobada, fallida o parcial. Basa las lecciones en lo que ocurrió; no conviertas una preferencia en una regla sin evidencia. Si no surgió una lección generalizable, deja constancia de ello y explica qué práctica permitió avanzar sin sorpresas.

## Plantilla por tarea

```md
### [Identificador] — [entregable breve] (AAAA-MM-DD)

- Resultado: aprobada / fallida / parcial.
- Método que funcionó:
- Dificultad o fallo observado:
- Aprendizaje transferible:
- Cambio recomendado al proceso:
- Evidencia o referencia:
```

Mantén cada entrada breve y accionable. Actualiza las guías de trabajo solo cuando una lección comprobada cambie un procedimiento; conserva aquí el contexto para que futuras tareas puedan aplicarla.

### Composición por capas — verificar paleta y preservación (2026-10-13)

- Resultado: auditoría independiente PARCIAL sin fallos medibles; verificación visual humana diferida y no bloqueante.
- Aprendizaje transferible: mide la paleta combinada después de componer y compara los píxeles de la base fuera del alfa de la capa para confirmar que no cambiaron.
- Evidencia: corrección de GOW8B-CMP-01; 49 colores finales y cero diferencias fuera de la cobertura alfa.

### Etapa 01 — Guía visual y muestra de estilo (2026-10-07)

- Resultado: aprobada.
- Método que funcionó: separar en la guía los datos respaldados por fuentes de las decisiones de producción; enlazar una muestra editable y comprobarla en el tamaño lógico.
- Dificultad o fallo observado: el texto SVG suavizado generó cientos de tonos fuera de la paleta declarada; la primera captura también tenía 500 × 180 aunque se esperaba 320 × 180.
- Aprendizaje transferible: inspeccionar el resultado rasterizado además del archivo fuente; el marcado y el tamaño configurado no garantizan los píxeles ni las dimensiones del archivo exportado.
- Cambio recomendado al proceso: verificar metadatos y conteo de colores de la imagen final; comparar evidencia ampliada con una escala entera contra el render nativo.
- Evidencia o referencia: registro escrito de auditoría en `docs/verificacion.md`; las muestras visuales asociadas fueron retiradas por solicitud del usuario.

### Etapa 02 — Inspección de variantes gráficas (2026-10-07)

- Resultado: aprobada.
- Método que funcionó: cotejar el inventario de variantes generado por código con una hoja de contacto y medir alpha y paleta sobre los píxeles rasterizados; atribuir cada comprobación a quien la ejecutó.
- Dificultad o fallo observado: la lista inicial de revisión omitía una variante; la limitación del perfil del navegador también impidió que el auditor repitiera la navegación.
- Aprendizaje transferible: antes de aprobar un conjunto gráfico, confirmar que todas sus variantes aparecen en la hoja y medir transparencia y colores en el rasterizado; registrar quién realizó cada prueba evita atribuir a otro rol una comprobación que no repitió.
- Cambio recomendado al proceso: acompañar cada observación con su ejecutor y límite de herramienta, además de conteos calculados desde la salida renderizada.
- Evidencia o referencia: registro escrito de auditoría en `docs/verificacion.md`; las capturas asociadas fueron retiradas por solicitud del usuario.

### Etapa 03 — Revisión de un efecto visual (2026-10-07)

- Resultado: aprobada.
- Método que funcionó: revisar una captura con escala entera para valorar la legibilidad local y contrastarla con una revisión de la lógica que produce el efecto.
- Dificultad o fallo observado: una captura representa un instante y no demuestra por sí sola el comportamiento del efecto en todos sus estados.
- Aprendizaje transferible: la legibilidad observada en una imagen aislada no garantiza las condiciones de un efecto a lo largo de todos sus estados; combinar evidencia visual con medición o revisión de la lógica.
- Cambio recomendado al proceso: al evaluar efectos variables, emparejar la captura representativa con una comprobación de sus parámetros y condiciones de activación.
- Evidencia o referencia: registro escrito de auditoría en `docs/verificacion.md`; la captura asociada fue retirada por solicitud del usuario.

### Etapa 04 — Sincronización de evidencia visual (2026-10-07)

- Resultado: aprobada.
- Método que funcionó: avanzar la simulación de forma controlada y leer su estado para capturar una condición transitoria reproducible.
- Dificultad o fallo observado: una captura visual aislada no demuestra que se hayan probado las entradas normales ni todas las acciones del sistema.
- Aprendizaje transferible: sincronizar una captura con un estado transitorio mediante avance controlado y lectura de estado; separar explícitamente la evidencia de composición visual de la prueba de controles normales.
- Cambio recomendado al proceso: registrar por separado la condición visual capturada, las entradas probadas y las acciones verificadas solo por inspección de código.
- Evidencia o referencia: registro escrito de auditoría en `docs/verificacion.md`; la captura asociada fue retirada por solicitud del usuario.

### Etapa 05 — Orientación de detalles direccionales (2026-10-07)

- Resultado: aprobada.
- Método que funcionó: verificar la orientación de detalles direccionales en coordenadas locales y en la presentación espejada.
- Dificultad o fallo observado: la punta de una flecha apuntaba en sentido contrario en la textura base, y el espejado conservaba esa oposición respecto al objetivo.
- Aprendizaje transferible: comprobar los indicadores direccionales tanto en su espacio local como tras las transformaciones de presentación permite detectar errores que una sola orientación oculta.
- Cambio recomendado al proceso: añadir la orientación transformada a la revisión de cualquier detalle cuyo significado dependa de una dirección.
- Evidencia o referencia: registro escrito de auditoría en `docs/verificacion.md`; la captura asociada fue retirada por solicitud del usuario.

### Etapa 06 — Revisión de poses y límites alfa (2026-10-07)

- Resultado: aprobada.
- Método que funcionó: capturar cada estado visual importante con una escala entera y medir los límites opacos de cada textura, además de inspeccionar la composición en escena.
- Dificultad o fallo observado: los límites opacos variaron por el movimiento de una pose y por un efecto temporal; medir solo la pose base no describía todas las cajas visibles.
- Aprendizaje transferible: leer límites alfa junto con el anclaje y los efectos temporales evita interpretar como desplazamiento estructural las diferencias deliberadas entre estados.
- Cambio recomendado al proceso: incluir capturas por estado relevante y cotejar los límites de transparencia con el anclaje y los efectos que cada estado añade.
- Evidencia o referencia: registro escrito de auditoría en `docs/verificacion.md`; las capturas de las poses fueron retiradas por solicitud del usuario.

### Etapa 07 — Validación de movimiento y límites (2026-10-07)

- Resultado: aprobada.
- Método que funcionó: observar posición, velocidad y acción en pasos temporales pequeños al probar movimiento en ambos sentidos, entradas simultáneas y límites.
- Dificultad o fallo observado: el clamp global cancelaba velocidad durante la carrera, pero el caso de salto junto al borde necesitaba conservar la misma cancelación sin cambiar la acción vertical.
- Aprendizaje transferible: al agregar controles o límites, validar juntos posición, velocidad y estado de presentación conserva sus invariantes; cancelar movimiento horizontal no debe reemplazar una acción vertical activa.
- Cambio recomendado al proceso: incluir ambos límites y combinaciones de controles en las pruebas de estado, y distinguir explícitamente eventos sintéticos de pulsaciones físicas.
- Evidencia o referencia: registro escrito de auditoría en `docs/verificacion.md`; las capturas asociadas fueron retiradas por solicitud del usuario.

### Etapa 08 — Sincronización de estado tras colisiones (2026-10-07)

- Resultado: aprobada.
- Método que funcionó: derivar el estado visual después de resolver colisiones y probar la llegada tanto en reposo como con velocidad horizontal.
- Dificultad o fallo observado: la acción visual se actualizaba antes de resolver el aterrizaje y quedaba un frame detrás del estado físico.
- Aprendizaje transferible: cuando una transición depende de una colisión, seleccionar la presentación después de resolverla mantiene alineados el estado observable y el estado simulado.
- Cambio recomendado al proceso: verificar transiciones de colisión desde más de una condición de entrada y registrar si cada ensayo usa teletransporte o controles sintéticos, en vez de presentarlo como recorrido físico.
- Evidencia o referencia: `docs/verificacion.md`; la comprobación de navegador fue controlada con warp y entradas sintéticas.

### Etapa 09 — Evidencia de efectos transitorios (2026-10-07)

- Resultado: aprobada.
- Método que funcionó: separar las pruebas funcionales de gameplay de la captura visual del efecto y atribuir cada comprobación a quien la ejecutó.
- Dificultad o fallo observado: una captura de la escena no incluyó el trazo transitorio que se estaba evaluando.
- Aprendizaje transferible: una captura fija de escena no demuestra un efecto transitorio; la evidencia visual de animación debe capturar el frame del efecto y declararse por separado de la prueba funcional.
- Cambio recomendado al proceso: preparar captura sincronizada con el instante activo del efecto y describir, aparte, los resultados funcionales, el tipo de entrada y los límites de cada prueba.
- Evidencia o referencia: `docs/verificacion.md`, subtask `GOW8B-09-B`.

### Etapa 10 — Validación de señal de audio (2026-10-07)

- Resultado: aprobada con límite perceptivo.
- Método que funcionó: medir la señal downstream del destino conectado al juego y atribuir las métricas al contexto correcto.
- Dificultad o fallo observado: el primer contexto de audio capturado estaba silencioso; la señal no nula pertenecía al segundo contexto del sintetizador.
- Aprendizaje transferible: medir señal enrutada al destino confirma generación técnica, pero no sustituye escuchar ni evaluar subjetivamente el resultado.
- Cambio recomendado al proceso: verificar conexión y métricas de audio, identificar el contexto activo, y registrar la escucha perceptiva por separado como otra comprobación.
- Evidencia o referencia: `docs/verificacion.md`, etapa 10; no se guardó la grabación y la calidad subjetiva quedó sin evaluar.

### Etapa 11 — Límite temporal de invulnerabilidad (2026-10-08)

- Resultado: aprobada.
- Método que funcionó: probar una amenaza durante la ventana configurada y otra después de su vencimiento, con el estado observado en cada tick.
- Dificultad o fallo observado: refrescar un temporizador desde una rama de estado prolongaba su valor más allá de la configuración inicial.
- Aprendizaje transferible: un temporizador refrescado desde una rama de estado puede exceder su configuración; comprueba eventos dentro y fuera del límite y registra la cuantización de tick.
- Cambio recomendado al proceso: incluir controles en ambos lados del límite temporal y distinguir el tiempo nominal del instante efectivo cuantizado por la simulación.
- Evidencia o referencia: `docs/verificacion.md`, etapa 11; pruebas controladas con entradas sintéticas y ticks de 16 ms.

### Etapa 12 — Dirección de respuestas vectoriales (2026-10-08)

- Resultado: aprobada con el límite de un signo sin prueba browser.
- Método que funcionó: comparar el sentido de propagación con la dirección del rechazo aplicado al receptor.
- Dificultad o fallo observado: el signo del vector entrante se había traducido a un desplazamiento hacia su origen.
- Aprendizaje transferible: al implementar respuestas vectoriales, distingue el sentido del vector de la dirección de rechazo y prueba ambos signos cuando sea posible.
- Cambio recomendado al proceso: preparar casos para cada signo, atribuir qué ramas se probaron en ejecución y cuáles solo se verificaron por lectura.
- Evidencia o referencia: `docs/verificacion.md`, etapa 12; el caso `vx>0` quedó confirmado por código/auditoría, no por browser.

### Etapa 13 — Estado y movimiento renderizado (2026-10-08)

- Resultado: aprobada.
- Método que funcionó: contrastar el estado de una entidad con su desplazamiento y pose observados durante el ciclo, y atribuir por separado runtime y captura.
- Dificultad o fallo observado: una captura legible del entorno no aislaba por sí sola la pose ni demostraba la temporización del estado.
- Aprendizaje transferible: contrasta el estado lógico con movimiento y pose renderizados; conserva por separado la evidencia runtime y la que aporta una captura fija.
- Cambio recomendado al proceso: registrar transiciones con frames/estados y tratar capturas concurridas como contexto, no como sustituto de una observación temporal.
- Evidencia o referencia: registro escrito de auditoría en `docs/verificacion.md`, etapa 13; la captura contextual fue retirada por solicitud del usuario y el ciclo temporal se atribuye al runtime del orquestador.

### Etapa 14 — Límites de distancia y pose de espera (2026-10-08)

- Resultado: aprobada.
- Método que funcionó: probar los bordes inclusivos del rango junto a un caso de acercamiento y otro de retirada, y leer el estado durante la espera.
- Dificultad o fallo observado: una entidad estacionaria mantenía una pose de movimiento mientras esperaba el cooldown.
- Aprendizaje transferible: prueba los límites inclusivos y confirma que una espera estacionaria se represente con pose de reposo; separa evidencia de runtime de capturas fijas.
- Cambio recomendado al proceso: registrar por separado estado, posición y animación observados durante la transición, y describir las capturas como apoyo contextual cuando no muestran el momento completo.
- Evidencia o referencia: registro escrito de auditoría en `docs/verificacion.md`, etapa 14; las capturas contextuales fueron retiradas y estado/timing se atribuyen a snapshots de runtime.

### Reinicio — Verificación del shell reconstruido (2026-10-08)

- Aprendizaje transferible: al reiniciar una aplicación, inspecciona el grafo de imports y comprueba red y canvas en runtime; documenta por separado las dimensiones internas y CSS.
- Límite de preservación: cuando faltan hashes de referencia, informa el inventario observado y no afirmes identidad byte a byte.
- Evidencia o referencia: `docs/verificacion.md`, auditoría del reinicio Phaser.

### Etapa 1 nueva — Selección de conceptos visuales (2026-10-08)

- Aprendizaje transferible: un concepto generado con apariencia pixelada puede no conservar agrupaciones de píxeles útiles en la resolución lógica; renderízalo y revísalo a tamaño final antes de aceptarlo.
- Método: separar borradores de exploración de los recursos aceptados y guardar solo los que superan la revisión en su escala real.
- Evidencia o referencia: GOW8B-01-A; dos conceptos generativos quedaron fuera por su tratamiento pictórico y no se integraron.

### Reinicio — Separar artefactos activos de evidencia histórica (2026-10-08)

- Aprendizaje transferible: clasifica cada archivo por función antes de un reinicio; retira solo recursos y salidas activas, y conserva documentación/evidencias como historia sin tratarlas como validación vigente.
- Método: inventariar `src/`, `public/` y salidas generadas; registrar la cancelación antes de limpiar y volver a comprobar que las verificaciones no recrearon artefactos retirados.
- Límite: sin hashes o una base confiable, la presencia de archivos no demuestra que se hayan conservado byte a byte.
- Evidencia o referencia: `docs/verificacion.md`, auditoría del reinicio solicitado del 2026-10-08.

### Alineación documental — Separar estado, visión e historial (2026-10-08)

- Resultado: aprobada tras corregir una equivalencia residual entre identificadores históricos y el plan futuro.
- Método que funcionó: contrastar cada afirmación documental con el árbol ejecutable y clasificarla como estado actual, diseño propuesto o registro histórico.
- Dificultad o fallo observado: un índice antiguo conservaba nombres válidos, pero su orden y significado ya no coincidían con el plan nuevo.
- Aprendizaje transferible: cuando un proyecto se reinicia, los identificadores históricos no deben reutilizarse como alias de tareas nuevas aunque sus nombres sean parecidos.
- Cambio recomendado al proceso: auditar títulos, estados y referencias cruzadas después de reordenar un plan, además de comprobar que los enlaces resuelvan.
- Evidencia o referencia: tarea documental `DOC-ALIGN-01` y auditoría independiente registrada en `odd/tasks/gow-8b-betrayal-pixel-art.md`.

### Tarea documental DOC-TEAM-01 — Planes de corrección derivados de auditoría

- Aprendizaje transferible: antes de editar, el plan debe fijar archivos, cambios, criterios y regresiones protegidas; un rechazo requiere revisar el plan, no modificar archivos.
- Evidencia o referencia: tarea documental `DOC-TEAM-01`.

### Separar runtime de implementación y auditoría

- Aprendizaje transferible: fija por separado el runtime del writer y el del auditor; conserva el mismo requisito de modelo y detén la implementación si el runtime obligatorio no está disponible.
- Evidencia o referencia: convención documentada en `AGENTS.md` y decisión D-13, vinculadas a `DOC-TEAM-01`.

### Verificar y cuantizar referencias generativas

- Aprendizaje transferible: los generadores de imagen pueden ignorar dimensiones o paletas declaradas; mide dimensiones y colores, aplica una conversión local controlada por separado y vuelve a inspeccionar la legibilidad nativa.
- Método: distinguir la herramienta que generó la imagen (ImageGen) de la herramienta local que cuantizó el PNG (`pngquant`).
- Límite: estas comprobaciones aprueban un asset visual provisional; no prueban integración al runtime ni gameplay.

### Verificar transparencia y anclaje de sprites

- Aprendizaje transferible: comprueba transparencia desde la tabla alpha o el canal correspondiente al formato, además de medir bounds opacos y anclaje; inspecciona la transparencia parcial a 1× porque puede alterar los bordes pixel art.

### Evaluar assets aislados y en composición

- Aprendizaje transferible: evalúa primero cada elemento por separado y luego en composición para detectar cambios de contraste, escala y jerarquía; un fondo aprobado no demuestra por sí solo legibilidad junto a personajes.

### Cerrar una etapa con verificación visual diferida (2026-10-15)

- Contexto: la auditoría independiente de `GOW8B-CMP-01` se ejecutó en un runtime cuyo modelo no admite entrada de imagen, así que la parte fenoménica (color percibido, silueta, contraste) no pudo comprobarse ni por el auditor ni por el orquestador.
- Aprendizaje transferible: cuando una verificación queda pendiente solo por una limitación de herramienta y todos los criterios medibles pasan, sepárala como **deuda no bloqueante documentada** con una lista concreta para el revisor, en vez de detener la secuencia por ella.
- Método que funcionó: distinguir «no verificado por fallo» de «no verificado por falta de herramienta»; reforzar con evidencia estructural (identidad byte a byte con las fuentes ya aprobadas) y con métricas programáticas de contraste/nitidez cuando el navegador lo permite.
- Límite: la prueba estructural demuestra preservación, no legibilidad percibida; una deuda diferida sigue siendo deuda y debe cerrarse antes de dar por listo el conjunto integrado.
- Cambio recomendado al proceso: cuando aplique, incluir en el ticket una «comprobación visual humana diferida» explícita con los atributos a mirar, separada de los criterios medibles, y registrarla como abierta.
- Evidencia o referencia: `docs/verificacion.md`, cierre de `GOW8B-CMP-01`.

### GOW8B-DEV-01 — Infraestructura de simulación determinista (2026-10-15)

- Resultado: aprobada tras una auditoría independiente PARCIAL, un plan de corrección aprobado por el auditor que reportó y una reauditoría APROBADA por un subagente distinto.
- Método que funcionó: definir la garantía de determinismo con dos caras explícitas —(a) misma secuencia de acciones por tick ⇒ estado por tick idéntico, con independencia del empaquetado en deltas de render; (b) el empaquetado multi-tick aplica la entrada sostenida a cada tick, de modo que la duración física de una pulsación puede cubrir más ticks a menor tasa— y probar cada cara por separado con un acumulador de paso fijo.
- Dificultad o fallo observado: el primer acumulador en milisegundos de coma flotante produjo 29 ticks en 500 ms (deriva); y las funciones de avance aceptaban entradas no finitas, negativas o sin cota de residuo, congelando o arrastrando el simulador.
- Aprendizaje transferible: en un bucle de paso fijo, acumula en enteros (microsegundos) y rechaza deltas no finitos o ≤ 0 sin mutar el estado; acota el residuo del acumulador para evitar el «spiral of death»; y recuerda que «reproducir una traza» (por tick) no es lo mismo que «reaplicar una acción sostenida a varios ticks», así que la prueba de determinismo debe fijar cuál de las dos se exige.
- Cambio recomendado al proceso: cuando el despacho del subagente implementador falla, el orquestador implementa y lo declara; la auditoría sigue siendo de un subagente distinto, y una corrección derivada de un hallazgo pasa por plan → revisión del auditor que lo reportó → implementador único → reauditoría por otro distinto. Verificar el determinismo empaquetando el mismo tiempo total de varias formas (60 fps, 30 fps e irregular) y comparar checksum y número de tick.
- Evidencia o referencia: `docs/verificacion.md`, §GOW8B-DEV-01 (criterio 2 y «Corrección tras la auditoría»); regresiones `5b5b8086` (escenario de prueba) y `10738d3e` (500 ms).

### GOW8B-MOVE-01 — Física por tick y validación por snapshot (2026-10-15)

- Resultado: aprobada tras auditoría independiente de solo lectura, sin ciclo de corrección.
- Método que funcionó: expresar la física como función pura por tick que recibe `dt` derivado del tick rate y parámetros desde la configuración, y validarla por la interfaz negra del snapshot/checksum —primero en Node sobre el código compilado con el propio `tsc`, después en un navegador real conducido con CDP cuando el MCP de navegador no respondió.
- Dificultad o fallo observado: al ampliar el estado de las entidades, los checksums literales de la etapa anterior cambiaron y hubo que distinguirlos de una regresión; el MCP de navegador falló por timeout en implementación y auditoría, y el recuento de ticks con deltas redondeados a 2 decimales puede diferir ±1 por el redondeo del acumulador.
- Aprendizaje transferible: protege **propiedades** (misma traza → mismo checksum; guards de avance; recorte del acumulador) y no valores hex congelados cuando cambia la forma del estado; comprueba el recorte del acumulador comparando la secuencia de ticks con y sin cota; mide la respuesta al input con un umbral en ticks (desplazamiento ≥1 px en ≤6 ticks) en lugar de milisegundos percibidos.
- Cambio recomendado al proceso: probar el mismo caso por snapshot en dos capas (Node compilado y navegador vía CDP) para que una herramienta caída no bloquee la auditoría, empaquetando siempre el mismo tiempo total a 60 fps, 30 fps e irregular, y etiquetando las teclas CDP como sintéticas.
- Evidencia o referencia: `docs/verificacion.md`, §GOW8B-MOVE-01; baterías de la auditoría `audit.cjs` (52/52) y `browser.cjs` (14/14).

### GOW8B-RES-01 — Migración de resolución e integración de assets (2026-10-15)

- Resultado: aprobada tras auditoría independiente de solo lectura, sin ciclo de corrección, aunque el implementador no ejecutó la prueba de navegador (la completaron el orquestador y el auditor).
- Método que funcionó: separar la migración (tamaño lógico, límites, anclaje, manifest) de cualquier cambio de gameplay; demostrar fidelidad de assets por **identidad byte a byte** (copia) y por **diferencia 0** frente a la región fuente (recorte), con hashes de fuente y derivados; y comprobar la integración en el **canvas vivo** (ImageData) contra el asset, no contra una captura.
- Dificultad o fallo observado: una captura pareció mostrar el sprite **espejado** y desencadenó una investigación larga; la causa real fue que una prueba sintética de teclas anterior había dejado el estado de orientación invertido (`facing=-1`, volteo esperado) y el `requestAnimationFrame` estrangulado congeló ese estado en la captura. El fondo, simétrico en las zonas muestreadas, parecía correcto y ocultó que la captura era un estado contaminado.
- Aprendizaje transferible: para afirmar coincidencia de píxeles usa la fuente viva (contexto del canvas) en **recarga limpia y sin entradas previas**, no una captura de pantalla tomada después de inyectar input; y antes de concluir «defecto», descarta que el propio arnés de prueba haya mutado el estado. Cambiar el espacio de coordenadas **cambia los checksums literales**: protege la propiedad (misma traza → mismo checksum) y los guards, no los hex congelados.
- Cambio recomendado al proceso: cuando una prueba de teclado pueda alterar estado persistente (orientación, velocidad), recargar la página antes de la siguiente aserción visual; y cuando el rAF esté throttled, medir el estado con el harness o con ImageData puntual, no con lo que aparezca en una captura.
- Evidencia o referencia: `docs/verificacion.md`, §GOW8B-RES-01 (criterios 3–8 y «Implementación de GOW8B-RES-01»); comprobación crisp 1834/1834 sin espejo e IoU de máscara 1.0.

### GOW8B-ANIM-01 — Animación de carrera provisional (2026-10-15)

- Resultado: aprobada tras auditoría independiente de solo lectura, con observaciones no bloqueantes. Una **primera auditoría quedó invalidada por confabular** (afirmó contenido inexistente: `src/sim/record.ts`, `physics.add.sprite`, comentarios en `src/main.ts`, API inventada); se repitió con un auditor distinto y reglas anti-invención, y esta vez coincidió con la medición propia del orquestador.
- Método que funcionó: exigir en la auditoría la **cita literal** de lecturas de archivo y de salidas de comandos, y **contrastar** cada valor con una reproducción independiente del orquestador (compilar `sim/` a CJS y comparar checksums con la API real). El determinismo de la etapa 7 se validó reproduciendo el estado en `/tmp` sin depender del navegador.
- Dificultad o fallo observado: un auditor puede generar evidencia plausible pero **falsa** (nombres de API, contenidos de archivos, checksums) sin ejecutar realmente las comprobaciones, sobre todo si el prompt ya contiene los valores esperados (sesgo de eco). Los números «correctos» no prueban que se hayan medido.
- Aprendizaje transferible: la auditoría no es fiable por su formato; exige **salidas crudas pegadas** y **verificación cruzada independiente**; no incluyas los valores esperados en el prompt del auditor (o pídele que los derive sin verlos) para evitar el eco. Para verificar animación, reproduce la lógica determinista con la API real y reserva el navegador a lo que solo el navegador prueba.
- Cambio recomendado al proceso: en tareas de auditoría, pedir explícitamente «si no ejecutas el comando, no escribas su salida», y validar un subconjunto de hallazgos con medición propia del orquestador antes de aprobar. Al aprobar arte provisional, registrar las diferencias sub-píxel conocidas (p. ej. silueta ±1 px) como no bloqueantes en vez de forzar un ciclo de corrección.
- Evidencia o referencia: `docs/verificacion.md`, §GOW8B-ANIM-01 (criterios 1–10 y «Implementación de GOW8B-ANIM-01 — auditoría aprobada»); reproducción CJS del orquestador (checksums `9d7dae5e`/`75ad1020`/`5e9e5706`, cuadros 4×97×59, neutral intacto).

### GOW8B-JUMP-01 — Salto y plataformas deterministas (2026-10-15)

- Resultado: aprobada tras auditoría independiente de solo lectura (14/14 criterios), con un hallazgo no bloqueante; el auditor **coincidió** con la verificación del orquestador (mismos checksums y física), lo que refuerza la confianza tras el incidente de la etapa 7.
- Método que funcionó: definir el ticket con **rangos paramétricos** (coyote 60–100 ms, buffer ~100 ms, dos niveles alcanzables) y **verificar la propiedad** (determinismo, edge-trigger, alcance) en lugar de valores fijos; validar la física en **dos vías** (unidad sobre `stepVertical` y extremo a extremo con `World`/`Simulation`). Ante una heurística de prueba que no alcanzaba el nivel 2, se hizo una **búsqueda dirigida** de la secuencia en vez de declarar fallo: el fallo estaba en la prueba (el jugador llegaba al nivel 1 con `vx` opuesto y había que frenar antes de saltar), no en el producto.
- Dificultad o fallo observado: los **off-by-one del orden de actualización** reducen la ventana efectiva de un buffer/jump respecto al valor nominal (buffer fijado y decrementado el mismo tick, y colisión evaluada después del salto). Y una prueba de alcance mal temporizada produce un **falso negativo** que hay que descartar antes de culpar a la implementación.
- Aprendizaje transferible: al verificar mecánicas con input **edge-trigger** y buffers, reporta la ventana **efectiva** en ticks (no solo el parámetro), y cuando una búsqueda de trayectoria falla, prueba varias estrategias/tiempos antes de concluir un defecto. Contrasta siempre con una medición propia del orquestador.
- Cambio recomendado al proceso: pedir al auditor que **derive** los números y fijar de antemano la tolerancia de los criterios con rangos para que una desviación de pocos ms se clasifique como no bloqueante en vez de fallo.
- Evidencia o referencia: `docs/verificacion.md`, §GOW8B-JUMP-01 (criterios 1–14 y «Implementación de GOW8B-JUMP-01 — auditoría aprobada»); reproducción CJS (init `416b863a`, 500 ms `e47e2997`/`3d815cb1`, apex 69.06 px, nivel 1 f34, nivel 2 alcanzable), assets intactos.

### GOW8B-LIGHT-01 — Ataque ligero inicial (2026-10-15)

- Resultado: aprobada tras auditoría independiente de solo lectura (12/12, sin regresiones). El auditor **derivó sus propios números** (73 comprobaciones) y coincidió con la medición del orquestador, incluido el frame de inicio de la fase `active` y el primer contacto; reforzó la mecánica verificándola en **dos vías** además del CJS (navegador con `keydown` sintético y recuento de píxeles del canvas/captura).
- Método que funcionó: especificar el ticket con **rangos y "y/o"** donde el arte es provisional (p. ej. "pose **y/o** indicador de hitbox"), de modo que el implementador no tuviera que inventar arte y el criterio fuera verificable por estado, no por estética. Pasar explícitamente al auditor las rutas cambiadas y marcar que `docs/verificacion.md` lo edita el orquestador (no el implementador) evitó atribuirle cambios que no eran suyos.
- Dificultad o fallo observado: un **off-by-one de fase** hace que el frame que transiciona `startup→active` devuelva `null` al pedir la hitbox pero que la fase ya sea `active` (la hitbox "se ve" un frame antes de evaluarse el contacto). También apareció un **efecto secundario de entorno**: el auditor borró `dist/` (salida de build) por la instrucción de limpieza, dejando un `vite preview` preexistente sirviendo 404.
- Aprendizaje transferible: al reportar latencia respecto al input, **fija la convención de conteo** (desde el frame de la pulsación o desde el anterior): "≤6 ticks" puede leerse de dos formas y ambas deben declararse. Y al pedir "limpia artefactos de build" en un proyecto con un preview en marcha, **avisa** de que regenerar `dist/` es necesario para no romper ese preview.
- Cambio recomendado al proceso: incluir en el ticket la convención de conteo de ticks y, si hay procesos de preview del usuario, excluir `dist/` de la limpieza o reconstruirlo al terminar.
- Evidencia o referencia: `docs/verificacion.md`, §GOW8B-LIGHT-01 (criterios 1–12 y «Implementación de GOW8B-LIGHT-01 — auditoría aprobada»); init `platforms 78d6aadb`/`combat dbb51c2c`; ciclo `startup(5)→active(4)→recovery(7)→none`; `active` en el frame 6 y contacto en el 7 tras el flanco; `attackHits=["dummy"]` único por golpe; sin daño; `tsc`/`build` exit 0; `__GOW8B`=0; assets y `manifest.ts`/`harness.ts` intactos.

### Arte de animación — verificar antes de generar y no escribir sin autorización (2026-10-16)

- Resultado: tarea de **investigación** (solo lectura), sin etapa aprobada; decisión de arte registrada (D-21/D-22).
- Método que funcionó: inventariar las **capacidades reales** del runtime (¿puede ver imágenes?), las **herramientas locales** (¿Ollama? ¿editor?) y las **opciones externas** (skills/MCP) **antes** de comprometerse con un método de generación; separar **«generar»** de **«evaluar»**.
- Dificultad o fallo observado: el modelo del runtime **no interpreta imágenes**, así que un generador de arte produce resultados que él mismo no puede juzgar; la generación geométrica «a ciegas» (esqueleto sin contorno, sin sombreado ni principios de animación) rinde siluetas embarradas; y se empezó a generar arte **sin autorización previa**, lo que la usuaria detuvo.
- Aprendizaje transferible: antes de prometer arte generado, comprueba **si el agente puede verlo**; si no, define el **bucle de verificación visual** (modelo local o revisión humana) **antes** de generar, y aplica contorno, sombreado y principios de animación (squash & stretch, anticipación, arcos). La generación procedural es válida pero no se aprueba «a ciegas».
- Cambio recomendado al proceso: cuando el entregable sea visual, incluir en el ticket **cómo se evaluará**; y no generar arte ni escribir archivos sin autorización explícita previa.
- Evidencia o referencia: decisión de arte 2026-10-16 (D-21/D-22); etapa 10.5 `GOW8B-KRA-02` en `docs/verificacion.md`; assets aprobados intactos y sin nuevos assets integrados.

### GOW8B-KRA-02 — Integrar arte original generado (2026-10-16)

- Resultado: implementación **integrada** y luego **aprobada** (idle/carrera/aire/ataque en el juego) tras auditoría independiente de solo lectura (2026-10-16). El subagente implementador `general` no completó la tarea (un intento devolvió vacío y otro fue interrumpido), así que **implementó el orquestador**, con la auditoría delegada a un subagente distinto.
- Método que funcionó: (1) **derivar la paleta por valor, no por índice** — el orden de `getdata()` en la PNG indexada no coincide con el orden lógico, así que el generador usa constantes con nombre y `assert set(cols) == set(PALETTE)`; (2) **anclar por bounding-box alfa** (todos los cuadros con la fila de pies en `y=58`) en lugar de confiar en que el dibujo quede alineado; (3) **verificar en dos vías**: propiedades programáticas con Pillow (tamaño, colores ⊂ paleta, fila de pies) **y** medición sobre el canvas del navegador con entradas sintéticas; (4) proteger la **regresión de determinismo** (60/30/irregular → mismo frame y checksum, `replay` idéntico) tras una etapa puramente de presentación.
- Dificultad o fallo observado: (a) las salidas del VLM local fueron **inconsistentes** (`moondream` devolvió descripciones vacías/absurdas en `air`/`attack` y errores HTTP 500 transitorios), de modo que **no sirve como criterio de estilo**; (b) un mismatch silencioso de **orden de paleta** habría teñido los sprites si no se validara por valor; (c) sin anclaje por bbox, cuadros con distinta altura aparente flotan o se hunden al cambiar de estado.
- Aprendizaje transferible: al generar arte procedural desde una pieza existente, **valida por valor** (paleta, alfa) y **ancla geométricamente** (bbox) en vez de asumir orden/coordenadas; trata los VLM pequeños como **filtro grueso**, nunca como juez de estilo, y deja la revisión humana como deuda explícita y no bloqueante. Si el runtime no ve imágenes, el bucle de evaluación (programático + navegador + humano) debe existir **antes** de declarar arte listo.
- Cambio recomendado al proceso: cuando el implementador delegado falle repetidamente, el orquestador **puede implementar** pero debe dejar constancia y **no autoaprobar**; la auditoría la hace siempre un subagente distinto. Registrar en el informe el modelo/runtime de cada subagente (aquí: subagente implementador `general` fallido; implementación del orquestador; auditoría pendiente de delegar).
- Evidencia o referencia: `docs/verificacion.md`, §GOW8B-KRA-02 («Estado de implementación (2026-10-16)»); hashes idle `48b02b96…`/run `27ec7d85…`/air `5deed24a…`/attack `22bbd179…`; `kratos-neutral.png`/`egeo-fondo.png` intactos; hoja de contacto `docs/referencias/kratos-anim-contact-sheet.png`.

### Plan por bloques y etapas (2026-10-16)

- Resultado: el plan se re-baselinó a dos niveles para conciliar la visión del género (GOW) con la necesidad de verificabilidad.
- Método que funcionó: mantener los **códigos estables** (GOW8B-*) y **no renumerar** lo ya aprobado; separar **bloques** (aprobados por la usuaria: aspecto, sensación, diversión) de **etapas** (audita un subagente distinto del implementador: reglas, determinismo, integración); diferir el **arte fino** (personaje, esbirros, enemigos) al final, y mantener el **estilo actual del personaje** sin cambiarlo hasta ese pulido; tratar el **sonido** como transversal (simple por etapa, pulido al final).
- Dificultad o fallo observado: al añadir 4 bloques y ~8 etapas nuevas (doble salto, rodada, Cuchillas del Caos, Ira de Poseidón, HUD, orbes rojos, ojos de cíclope, plumas de fénix, mapa, zonas de combate, desglosar Hidra), hay riesgo de duplicar etapas (esquiva → rodada) y de solapar «árbol de combate» (ataque pesado, bloqueo/parry, finisher) con el estado ya existente.
- Aprendizaje transferible: cuando el usuario pide reencuadrar a un género, no reescribir todo el plan a texto plano, sino **fusión incremental**: conservar granularidad auditable de las etapas originales, añadir lo que falta y reasignar lo que cambia de nombre (p.ej., esquiva → rodada con i-frames). Documentar la correspondencia para que las referencias en prosa no se rompan.
- Cambio recomendado al proceso: registrar la decisión de dos niveles (D-23) y la correspondencia entre la numeración anterior (11–29) y las nuevas IDs antes de activar etapas.
- Evidencia o referencia: `docs/verificacion.md` (bloques y etapas re-baselinados), `docs/decisiones.md` (D-23), `README.md` y `docs/direccion-y-controles.md` actualizados.

### Cerrar la deuda de auditoría diferida antes de abrir lo siguiente (2026-10-16)

- Resultado: se cerraron **dos** auditorías diferidas — la etapa 10.5 `GOW8B-KRA-02` (arte) y la etapa 10 `GOW8B-COMBO-01` (combo) —, ambas con veredicto **APROBADA**; con esto, las etapas 1–10.5 quedan aprobadas y no hay etapa activa.
- Método que funcionó: (1) antes de avanzar al bloque siguiente, **pagar la deuda de verificación** (una etapa «activa» sin auditar es un riesgo abierto); (2) delegar la auditoría a un subagente **distinto del implementador** —en KRA-02 había implementado el orquestador, así que la auditoría **de un subagente** era especialmente necesaria—; (3) exigir del auditor **evidencia ejecutable** (no lectura sola): `esbuild`+`node` para la simulación determinista y Chrome DevTools MCP para el navegador; (4) confirmar que la auditoría fue **realmente de solo lectura** verificando que `git status` quedó idéntico y que el dev server que arrancó el auditor quedó detenido.
- Dificultad o fallo observado: la auditoría de COMBO-01 se **interrumpió** una vez (llamada abortada) y hubo que reintentarla con un subagente nuevo; además, el «tap» de CDP (down+up en el mismo frame) no lo observa un `InputManager` basado en **polling**, una limitación de la **prueba**, no del juego — conviene declararla para no confundirla con un defecto.
- Aprendizaje transferible: una etapa no se cierra hasta que su auditoría independiente emite veredicto; deja los hallazgos **no bloqueantes** registrados (no los «arregles» dentro de la auditoría) y exige **evidencia ejecutable + confirmación de no-modificación**; un audit que solo lee código no basta cuando hay simulación susceptible de regresión.
- Cambio recomendado al proceso: cierra la deuda de auditoría **antes** de activar la primera etapa del bloque siguiente; reinicia un subagente nuevo si el canal se interrumpe; y exige del auditor la doble comprobación `git status` idéntico + dev server detenido.
- Evidencia o referencia: `docs/verificacion.md` §GOW8B-COMBO-01 («Auditoría de GOW8B-COMBO-01 — APROBADA») y §GOW8B-KRA-02 («Estado de implementación (2026-10-16): auditoría independiente APROBADA»); trazas `59c350b7`/`ba42551f`/`e02526ce`; hallazgos NB-A…NB-D.

### Referencia de escala: derivar de una fuente única y auditarlo por mutación (2026-10-17)

- Resultado: etapa `GOW8B-SCALE-01` (Orden 1 del plan re-baselinado) implementada por un subagente y **aprobada** ese mismo día tras auditoría independiente de solo lectura de un subagente distinto.
- Método que funcionó: (1) la fila del plan era **una línea**, así que el orquestador fijó **alcance y criterios de aceptación antes de delegar** — sin eso, el implementador habría inventado el entregable; (2) exigir que las constantes derivadas se calculen de **una fuente única** desde las que ya existían, en lugar de escribir cifras nuevas; (3) la auditoría las comprobó con **prueba de mutación** (cambiar `jumpSpeed` o el ancho del sprite en una copia fuera del repo y ver si las medidas se mueven) — leer el código no distingue una derivación real de un número copiado a mano; (4) separar «lo DEV» de «lo de producción» con el mismo criterio ya vigente (`import.meta.env.DEV` + ausencia en el bundle), y verificarlo por símbolos, no solo por el nombre del guard; (5) medir en el navegador **leyendo píxeles del canvas** (modo CANVAS 2D, tolerancia de color): es verificación visual reproducible que no depende de la vista ni de un VLM.
- Dificultad o fallo observado: la tecla de alternancia no registraba una pulsación corta. Causa raíz: en Phaser, `Key.onUp` limpia `_justDown` **antes** de que el `update()` lo lea, así que una pulsación+soltura dentro del mismo frame se pierde. Arreglo: escuchar el evento `DOWN` en lugar de sondear `justDown`, registrar sin captura global y dejar que el auto-repeat del SO no cuente. Además, envolver el ideal continuo daba `72.2 px` de salto, mientras que **simular por tick** da `69.06 px` (`apex` en el tick 22): para envolventes que consumirán otras etapas conviene el **valor discreto del motor**, no el de la fórmula física.
- Aprendizaje transferible: cuando el entregable es una **referencia** (números que condicionan etapas posteriores), el criterio no es «existe» sino **«reacciona a su fuente»**; el mejor modo de comprobarlo es una prueba de **mutación de la fuente** hecha por alguien distinto del autor. Y las medidas que el motor consumirá se fijan **simulando el paso discreto**, no con la fórmula continua ideal.
- Cambio recomendado al proceso: en etapas de configuración/referencia, incluir la prueba de mutación en el pedido de auditoría; y fijar las envolventes derivadas por simulación por tick, dejando el ideal continuo solo como control de la fórmula.
- Evidencia o referencia: `docs/verificacion.md` §GOW8B-SCALE-01 (incluida la tabla de métricas) y `## Registro de auditorías`; `src/scale.ts`, `src/dev/scaleOverlay.ts`; mutación `jumpSpeed 380→500` → `apexHeight 120.833`; motor real `apex 69.056 @ tick 22`, aire `45 t`, alcance `105`; determinismo 8/8; checksum `fa0bcd1b` idéntico con el overlay OFF/ON/OFF.

### Un veredicto PARCIAL no se cierra como aprobado (2026-10-17)

- Resultado: la etapa `GOW8B-ROLL-01` (rodada con i-frames) fue marcada «Aprobada» por el orquestador a partir de una auditoría cuyo veredicto real era **PARCIAL**, con un hallazgo de la misma zona (`invulTicks`, N1). Un día después, la verificación propia del orquestador midió que los i-frames duran **29 ticks (483 ms)** en vez de los **15 (250 ms)** configurados y **sobreviven a la rodada**: 250 ms de invulnerabilidad gratis con la animación terminada (hallazgo bloqueante `H-ROLL-1`, etapa reabierta).
- Método que funcionó, tarde: **medir el estado simulado tick a tick** en lugar de confiar en el veredicto. Recién al instrumentar la simulación apareció el defecto, que era invisible a la lectura del pedido original.
- Dificultad o fallo observado: (1) **el cierre se hizo sobre un veredicto blando**. Un auditor que dice «PARCIAL / con observaciones no bloqueantes» está señalando una deuda, no un aprobado: si el hallazgo queda abierto, la etapa no está cerrada. (2) Al instrumentar la simulación, el primer script informó «no pasa nada» (altura 0, rodada inexistente) en **todos** los casos: era un **falso negativo de la prueba**, no un defecto del código. Causa raíz: `World.getEntity()` devuelve una **copia** del estado, así que guardar la referencia una sola vez fuera del bucle congela la medición.
- Aprendizaje transferible: (a) **el veredicto del auditor es el estado de la etapa**: PARCIAL o FALLIDO no se promueven a «aprobada» porque los hallazgos «parezcan» menores; se resuelven, se corrigen o se dejan explícitamente abiertos con la etapa **reabierta**. (b) Cuando una medición dice que **nada funciona**, sospechar primero de la **prueba**: las lecturas del estado pueden ser copias defensivas, y un snapshot tomado una sola vez mide un objeto inmóvil. Verificar la prueba con una mutación conocida antes de creerle un resultado negativo.
- Cambio recomendado al proceso: cerrar una etapa **solo** con veredicto APROBADO; tratar PARCIAL como deuda abierta y reabrir la etapa si el hallazgo sigue vivo. Y en las auditorías y verificaciones, exigir la re-lectura del estado **en cada tick** (`getEntity`/`snapshot`), con una comprobación de cordura: si ninguna acción produce efecto, el problema puede ser la instrumentación.
- Evidencia o referencia: `docs/verificacion.md` §GOW8B-ROLL-01 (hallazgo `H-ROLL-1` y plan de corrección) y `## Registro de auditorías` (`GOW8B-ROLL-01` — reabierta); medición `roll 14 ticks (233 ms)` vs `invul 29 ticks (483 ms)`; `src/sim/roll.ts:28-46` (rama activa sin decrementar `invulTicks` y `if` vacío en 37-40); `src/sim/types.ts:57-58` (comentario que contradice el comportamiento); `src/sim/world.ts:91-94` (`getEntity` devuelve `{ ...entity }`).

### La compuerta de plan funciona: PARCIAL → reapertura → compuerta → re-auditoría (2026-10-17)

- Resultado: el hallazgo bloqueante `H-ROLL-1` (i-frames de la rodada que duraban el doble y sobrevivían a la animación) se corrigió **el mismo día** siguiendo la compuerta que exige `AGENTS.md`, sin editar una sola línea antes de tener aprobación: plan escrito (hallazgo + evidencia + archivos exactos + cambio propuesto + criterios + regresiones protegidas) → **revisión en solo lectura por el auditor que reportó el hallazgo** → **un único implementador** aplica → **un auditor distinto** re-audita. La re-auditoría dio **APROBADA** (9/9 puntos, sin bloqueantes) y confirmó que todo lo demás quedó **byte-idéntico** descontando el campo corregido.
- Método que funcionó: (1) el plan **declaraba la causa raíz con archivo y línea** y **el alcance mínimo** (`src/sim/roll.ts` y, solo si hacía falta, un comentario), así que la revisión pudo ser exigente sin ambigüedad; (2) la re-auditoría comparó contra **una copia previa real del defecto** conservada fuera del repo — sin esa copia no hay forma de demostrar «byte-idéntico salvo el campo corregido»; (3) los criterios se escribieron **en términos medibles** (último tick con `invulTicks > 0` ≤ último con `rollPhase !== 'none'`), y eso permitió detectar un matiz fino que nadie había pedido: la cobertura resultó **exacta**, ni un tick corta ni larga; (4) el revisor aportó dos criterios **no bloqueantes** que el implementador cubrió, y el re-auditor volvió a medir la coherencia de config (`invulMs <` y `>` que `durationMs`) dejando una frontera explícita para el Bloque 4.
- Dificultad o fallo observado: (1) un dato de la documentación resultó **no reproducible**: los checksums de `GOW8B-DJUMP-01` estaban anotados **sin declarar el esquema de la traza**, y la re-auditoría probó 12 esquemas sin acertar; hubo que escribir el esquema en el documento. Una cifra de verificación sin su procedimiento no es evidencia, es un número. (2) Otra vez el entorno limitó la prueba: `requestAnimationFrame` a ~1 fps, así que la sensación a 60 fps no se pudo evaluar y se declaró como limitación en vez de darla por verificada.
- Aprendizaje transferible: la compuerta de plan es **barata y efectiva** cuando el plan dice la verdad sobre la causa raíz y el alcance mínimo; conservar **una copia del estado defectuoso** fuera del repo convierte «no creo que haya regresión» en «es idéntico salvo este campo»; y **toda cifra de verificación se registra con el procedimiento que la produce**, o no sirve para el próximo que audite.
- Cambio recomendado al proceso: en el plan de toda corrección, incluir (a) **alcance mínimo explícito** con el archivo y la línea de la causa raíz, (b) **copiar el estado defectuoso** antes de corregir para poder comparar por identidad, y (c) **declarar el esquema** de cualquier checksum o métrica que se registre como evidencia. En la re-auditoría, comparar por identidad **descontando el campo corregido** en lugar de exigir checksums iguales.
- Evidencia o referencia: `docs/verificacion.md` §GOW8B-ROLL-01 (hallazgo, plan aprobado y «Corrección aplicada y re-auditada») y `## Registro de auditorías`; efecto neto i-frames `29 → 14 ticks`; trazas byte-idénticas ignorando `invulTicks` (ápice simple 69.0556, doble 120.3889, tercera pulsación rechazada); `src/sim/roll.ts` (único archivo tocado).

### «No interpreto imágenes» no significa «no puedo revisar»: agotar el navegador (2026-10-20)

- Resultado: la etapa `GOW8B-ROLL-ART` se había cerrado como **APROBADA CON OBSERVACIONES** (auditoría de subagente sobre `a136cb7`) afirmando que la animación de rodada funcionaba. La usuaria reportó que **el personaje hacía un dash, no una voltereta**. La verificación con Chrome DevTools mostró la causa real: el clip `kratos-roll` estaba **congelado en el cuadro 0** porque `applyAnimation` llamaba `stopLoop()` (`anims.stop()`) en cada tick y la guarda `!player.anims.isPlaying` reabría el clip desde cero ~60 veces por segundo. El sprite cambiaba de textura, pero **el cuadro nunca avanzaba**: desplazamiento con postura erguida = dash.
- Método que funcionó, tarde: instrumentar y **medir la secuencia de índices de cuadro** (`player.anims.currentFrame.index`) a lo largo del tiempo. Con el arreglo, la secuencia pasó de `[1,1,1,...]` (58/58 muestras en el cuadro 0) a `[1,1,...,2,2,...,3,3,...,4,4]` (los 4 cuadros). Ese dato es el que faltaba y el que hubiera evitado el cierre en falso.
- Dificultad o fallo observado: (1) **se trató «no puedo interpretar imágenes» como «no puedo verificar»**, cuando con CDP sí se puede medir simulación, cuadros, rotación, diff de silueta y consola; eso empujó a declarar «pendiente de validación humana» cosas que eran medibles y a cerrar la etapa con evidencia que **no cubría el criterio real** («se lee como voltereta»). (2) **Falso positivo clásico de animación**: verificar que la *textura* cambia (`texture.key === 'kratos-roll'`) no dice nada sobre si el **clip avanza**; una animación detenida en el cuadro 0 es indistinguible de una animación funcional si solo se mira la clave de textura. (3) Varias **trampas de la prueba** aparecieron en el camino: `evaluate_script` que retiene una promesa congela el RAF de Phaser (la simulación «no avanza»); el harness `step()` **saltea el `InputManager`** (hay que despachar eventos al canvas **con foco**, no a `window`); medir «píxeles opacos» de una región del canvas da siempre el mismo valor porque incluye el **fondo** (hay que hacer diff contra el fondo para aislar al personaje); y `Phaser.GAMES` no está expuesto, así que no se alcanza la escena por esa vía.
- Aprendizaje transferible: (a) **«no puedo interpretar imágenes» ≠ «no puedo revisar»**: agotar las mediciones del navegador antes de delegar algo al ojo humano; solo el juicio estético y la sensación motora con teclado físico quedan del lado humano. (b) Para validar una **animación**, el criterio es la **secuencia de índices de cuadro en el tiempo**, nunca la clave de textura ni la fase de simulación. (c) Cuando una medición dice «todo verde» pero la persona ve otra cosa, **la medición está mal diseñada**: revisar qué mide y contra qué la compara antes de dudar del reporte.
- Cambio recomendado al proceso: en toda etapa de animación o *feel*, exigir como evidencia mínima **secuencia de índices de cuadro**, rango de rotación/escala aplicado, diff de silueta contra el fondo, recorrido/duración y consola limpia; y dejar escrito que «no interpretar imágenes» no exime de medir. Registrado como regla explícita en `AGENTS.md` §Verificación.
- Evidencia o referencia: `src/main.ts` `applyAnimation` (rama `rolling`: eliminación de `stopLoop()`); `idxSequence` congelada `[1,1,...]` vs arreglada `[1,2,3,4]`; `src/sim/roll.ts` (`ROLL_TICKS` 20 / `rollSpeed` 260, cola vulnerable de 5 ticks); `docs/pendientes-de-validacion-humana.md` (§GOW8B-ROLL-ART); regla añadida en `AGENTS.md` §Verificación.

### Un criterio de "identidad visual" no se verifica con geometría (2026-10-20)

- Resultado: la etapa `GOW8B-CHAOS-01` se aprobó (2026-10-17, auditoría de subagente) con evidencia de cobertura, envolventes derivadas y determinismo por checksum, describiéndola como "identidad del arma: cadenas y arcos de golpe". Al mirarla con teclado y vista propios, la usuaria reportó: **"no existen cadenas, solo golpes con una espada en mano"**. Verificado por lectura de código: `src/main.ts` **no tiene ninguna capa de arma** (el grep de `add.sprite|add.graphics|add.line|add.polygon` devuelve solo el fondo y los rectángulos de debug) y `scripts/gen-kratos-anim.py` dibuja, a lo sumo, **una línea de 3 px** por pose de ataque. El arma **nunca se dibujó**; solo se modeló su colisión. Lo percibido como "espada" era el brazo extendido.
- Dificultad o fallo observado: los criterios de evidencia de la etapa medían **geometría de colisión** (`nearX`/`farX`/`topY`/`bottomY`, cobertura por cadena, span vertical con dos decimales) y **ninguno exigía un píxel renderizado**. La auditoría verificó correctamente el modelo matemático y **concluyó el objetivo declarado** —"dar identidad al arma"— como si un modelo de colisión fuera una identidad visual. Es la **misma familia de error** que la rodada congelada: el sistema pasa todas las comprobaciones porque **las comprobaciones no miran lo que el usuario ve**. Además, la observación "el arco llega 65.7 px con un jugador de 59 px, o sea por encima de la cabeza" fue archivada como **no bloqueante** cuando era el síntoma del defecto: geometría diseñada sin mirar la pantalla.
- Aprendizaje transferible: (a) **un criterio de aceptación debe nombrar el artefacto observable y el instrumento que lo mide**; si el criterio dice "identidad del arma" o "se lee como", la evidencia tiene que ser **render** (píxeles, presencia de la capa en el canvas, recorrido visible), no el dato que lo soporta. (b) **Una observación que describe algo visiblemente absurdo no es "no bloqueante" por default**: si el resultado se ve raro, es candidata a defecto aunque los números cierren; el "no bloqueante" aplica a lo que se ve *imperfecto*, no a lo que se ve *mal*. (c) Cuando una etapa declara una **identidad visual** como objetivo, la pregunta de cierre es **"¿existe el elemento en pantalla?"** antes de "¿es correcto su modelo?".
- Cambio recomendado al proceso: en los criterios de salida de toda etapa con objetivo visual, exigir **al menos un criterio que se verifique sobre el render** (elemento presente, capa dibujada, recorrido medido en canvas) y **prohibir que un objetivo visual se cierre únicamente con métricas de simulación**. Registrar las observaciones "no bloqueantes" con la pregunta explícita: *¿esto se ve mal o solo imperfecto?*
- Evidencia o referencia: `docs/verificacion.md` §GOW8B-CHAOS-01 → **REAPERTURA (2026-10-20)**; `docs/pendientes-de-validacion-humana.md` referencia #3; `src/main.ts` (única capa visual del golpe = `attackHitboxRect`); `scripts/gen-kratos-anim.py` l.184-186 (`limb(..., 3, DARK)`).

### Un criterio que mide una parte del observable no verifica el todo (2026-10-21)

- Resultado: cerrado el ciclo de corrección de `GOW8B-CHAOS-01` (el arma de las Cuchillas del Caos). La reapertura vino de que el arma **no existía visualmente**; al implementarla, la reauditoría encontró que la **hoja giraba al revés que la cadena** (signo invertido en `src/main.ts:227`): la hoja **cruzaba** la cadena en vez de continuarla, con error angular de hasta **87.95°** en el remate. Corregido a `θ = −α/facing`: Δángulo **0.00°** analítico y **≤ 0.70°** medido en píxeles.
- Dificultad o fallo observado: **tercera aparición de la misma familia de error en el mismo ciclo.** El criterio 2 del plan medía la **posición** de la hoja (¿está en el punto que predice la fórmula?) y con eso se declaró verificado el render del arma — pero un rectángulo puede estar **exactamente en la posición correcta y aun así verse mal porque apunta al revés**. Antes, en el mismo ciclo: el clip de la rodada medía *textura* y no *avance de cuadro* (animación congelada aprobada); el arma medía *colisión* y no *existencia en pantalla* (arma invisible aprobada). Las tres veces el criterio era correcto sobre **una parte** del observable y se cerró el **todo**.
- Aprendizaje transferible: (a) cuando un criterio habla de **orientación, forma o dirección**, no basta medir **posición**: hay que medir el atributo nombrado (ángulo, pendiente, eje). Un objeto ubicado correctamente y rotado al revés pasa cualquier test de posición. (b) En todo criterio de render conviene preguntarse **"¿qué parte de lo que ve el usuario NO está cubierta por esta medición?"** antes de declararlo verificado. (c) Corolario práctico: **una capa visual nueva necesita, como mínimo, un criterio de existencia, uno de posición y uno de orientación** si el objeto tiene eje.

### Medir un vector cuando el objeto es simétrico produce un falso positivo (2026-10-21)

- Resultado: al verificar el signo corregido, el orquestador midió `facing = -1` y obtuvo **Δ = 180°**, lo que parecía indicar que la hoja apuntaba al lado contrario. **Era un error de la métrica, no del código.** El auditor había medido bien. Un rectángulo es **simétrico**: su eje largo es una **RECTA**, no un vector, y `θ` y `θ+180°` describen el mismo rectángulo. Comparando como recta (*módulo 180°*), Δ = **0°** en ambos sentidos.
- Dificultad o fallo observado: comparar ángulos de objetos simétricos como si fueran **rayos** introduce 180° de diferencia espuria. Es un falso positivo que **invierte el veredicto**: hace parecer roto lo que está bien. Casi provoca una segunda ronda de corrección sobre código correcto.
- Aprendizaje transferible: antes de comparar dos ángulos, preguntarse **si el objeto tiene "adelante"**. Segmentos, rectángulos y ejes son **rectas** (comparar mód 180°); flechas, personajes y vectores de movimiento son **rayos** (comparar mód 360°). Elegir mal la métrica produce un error del tamaño del objeto.

### Un ancla de verificación sin su procedimiento no es reproducible (2026-10-21)

- Resultado: el plan de corrección fijó una ancla de determinismo como un **valor absoluto** ("hash djb2 = `cbb6368e`") sin especificar si la traza incluía la fila del estado inicial (frame 0, antes del primer `step`). El implementador no pudo reproducirla y midió `bc855e46`; el orquestador obtuvo `cbb6368e` con otra convención. **Ambas trazas eran deterministas**; la discrepancia era de convención y costó tiempo de ida y vuelta.
- Dificultad o fallo observado: un valor absoluto de verificación **no vale nada para un tercero si no se declara el instrumento que lo produce**. El implementador hizo lo correcto: no improvisó ni "ajustó" el número, lo **reportó como discrepancia**. Eso es exactamente lo que debe hacer un implementador.
- Aprendizaje transferible: (a) toda cifra de verificación se registra **con su procedimiento** (traza exacta, si incluye fila inicial, forma de hashear) o no sirve. (b) Para regresión conviene preferir la **identidad antes/después con el mismo instrumento** sobre un valor absoluto: es inmune a los detalles de convención. (c) Un implementador que reporta una discrepancia que no puede explicar vale más que uno que la resuelve silenciosamente.

### GOW8B-OPTIM-01 — Optimizar en múltiples capas anclando la equivalencia funcional antes de editar (2026-10-21)

- Resultado: aprobada tras auditoría independiente de solo lectura (8/8 criterios).
- Método que funcionó: (1) capturar **antes de editar** una batería de checksums sobre el árbol de trabajo real (incluidos valores derivados de inicialización, trazas multi-acción y hashes de activos) y fijarlos como invariantes binarios en el plan; (2) agrupar las optimizaciones en fases ortogonales (tipado, inicialización, bucle caliente, modularización de vista y empaquetado) donde las tres primeras exigen **identidad bit a bit de salida** (`maxDiff = 0` y mismos checksums); (3) proporcionar lecturas sin copia (`peek*`) para el bucle caliente de render mientras se conservan los métodos con copia defensiva (`get*`, `snapshot`) para no romper consumidores existentes.
- Dificultad o fallo observado: un subagente implementador en segundo plano puede quedar bloqueado esperando confirmación de un comando shell destructivo (`rm`) si los permisos automáticos no estaban activos al lanzarlo; inspeccionar el estado del subagente (`manage_subagents`) permite detectar el bloqueo exacto sin reiniciar el trabajo ya hecho.
- Aprendizaje transferible: una refactorización u optimización transversal es segura cuando se demuestra que es un **isomorfismo observable** (mismos hashes de estado y `maxDiff = 0` en geometría) antes de pasar a la prueba de navegador; separar lecturas de solo lectura (`peek`) de lecturas con copia (`get`/`snapshot`) elimina asignaciones por frame sin sacrificar la inmutabilidad de las instantáneas.
- Cambio recomendado al proceso: antes de delegar una tarea de optimización o refactorización, ejecutar y registrar en el plan los checksums de referencia con el mismo comando que usará la auditoría, e incluir una prueba de equivalencia numérica (`maxDiff = 0`) para cualquier función matemática factorizada.
- Evidencia o referencia: `docs/planes/OPTIM-01.md` y `docs/verificacion.md` §GOW8B-OPTIM-01; `scaleChecksum = da5b47b6` (44 iteraciones vs 599); `combat60 = 9f8ded3f`; `maxDiff = 0` en 24 muestras; chunk de aplicación `22.88 kB` separado del motor; 0 errores y 0 respuestas 404 en navegador (`:5197`).

### GOW8B-ART-POLISH-01 — Combinar aserciones programáticas de paleta/anclaje con inspección visual directa de hojas de contacto (2026-10-21)

- Resultado: aprobada tras auditoría independiente de solo lectura (4/4 criterios).
- Método que funcionó: (1) mantener en el generador procedural las aserciones duras de invariantes (`set(cols) == set(PALETTE)`, `bbox[3] == FRAME_H`, dimensiones por hoja y unicidad de cuadros) mientras se rediseñan los volúmenes anatómicos; (2) generar automáticamente la hoja de contacto ampliada (`save_contact_sheet` a 2× `NEAREST`) en la misma corrida del script e **inspeccionarla visualmente** con la herramienta de lectura de imágenes (`read_file`) en cada iteración para ajustar proporciones (altura de faldón, separación de piernas y silueta de las hojas) frente a la pose neutral de referencia; (3) condicionar los indicadores visuales de colisión (`attackHitboxRect`) al mismo conmutador DEV del overlay de escala (`isScaleReferenceVisible()`) para que no contaminen la lectura cromática del arte en juego normal.
- Dificultad o fallo observado: en la primera iteración del generador musculoso, el faldón demasiado largo ocultaba el nacimiento de los muslos y las hojas en reposo eran demasiado cortas respecto a la pose de referencia; la inspección visual inmediata sobre la hoja de contacto permitió corregirlo antes de dar por cerrada la implementación.
- Aprendizaje transferible: las invariantes programáticas (tamaño, paleta exacta, fila de anclaje) garantizan que un nuevo asset no rompa la integración técnica, pero no evalúan proporción ni silueta; emparejar las aserciones en el script generador con la generación automática e inspección visual de una hoja de contacto comparativa cierra la brecha entre validez técnica y coherencia artística. Asimismo, las capas de depuración semitransparentes deben estar apagadas por defecto para no distorsionar el color de las capas de presentación que cubren.
- Cambio recomendado al proceso: todo script de generación de sprites debe exportar en la misma ejecución una hoja de contacto junto a la figura de referencia y validar automáticamente paleta, dimensiones y fila de apoyo antes de su revisión visual.
- Evidencia o referencia: `docs/planes/ART-POLISH-01.md` y `docs/verificacion.md` §GOW8B-ART-POLISH-01; `scripts/gen-kratos-anim.py`; `docs/referencias/kratos-anim-contact-sheet.png` (`5e5bfdb6…`); `src/entities/WeaponLayer.ts` y `src/scene/ShellScene.ts`.

### GOW8B-ART-POLISH-02 — Auditar capas procedurales de runtime exige exportar e inspeccionar una hoja de contacto cuadro a cuadro desde el `<canvas>` del navegador (2026-10-22)

- Resultado: aprobada en reauditoría tras un primer cierre en falso (sin navegador) que fue reabierto y dictaminado **FALLIDO** al capturar el `<canvas>` real del navegador (`scratch/browser-combo-audit.png`), seguido del ciclo completo de compuerta (`plan Rev. 2` → aprobación del Auditor 1 → corrección del Implementador con captura de navegador → reauditoría en navegador por un Re-Auditor 2 distinto).
- Método que funcionó: (1) para la voltereta en el suelo, mantener `player.setRotation(0)` sobre el ancla `(0.5, 1.0)` y dibujar los 4 cuadros del giro dentro del spritesheet con `bottom_y = 58` fijo y altura comprimida (`heights = [38, 28, 29, 42]`), verificándolo en la hoja de contacto estática; (2) para la capa procedural de las Cuchillas del Caos (`WeaponLayer.ts`), avanzar tick a tick en Chrome headless a lo largo de los 30 ticks del combo y **volcar los recortes del `<canvas>` real en un mosaico PNG (`scratch/browser-combo-audit.png` / `scratch/re-audit-combo.png`) para mirarlo con `read_file`**, además de usar el directorio `scratch/` de la sesión para no disparar bloqueos de sandbox sobre `/tmp`.
- Dificultad o fallo observado: cuando el elemento visual se construye en runtime combinando un sprite base con objetos dinámicos del motor (`WeaponLayer`), ni la hoja de contacto estática ni la lectura de código ni el simple conteo de colores `getImageData` detectan fallos de composición como: (a) duplicación de armas entre el sprite y la capa dinámica (3 cuchillas a la vez en `startup`/`recovery`), (b) desconexión entre la coordenada del puño en el sprite y el origen de la cadena (`gripX = player.x`), o (c) primitivas geométricas sin contorno que rompen el estilo pixel art. Solo al mirar el mosaico de 30 ticks extraído del `<canvas>` aparecieron los 4 defectos de inmediato.
- Aprendizaje transferible: (a) **ninguna capa visual generada o posicionada en runtime puede aprobarse sin exportar e inspeccionar visualmente una tira de cuadros capturada del `<canvas>` vivo**; la hoja de contacto estática solo valida el asset aislado y el conteo de píxeles por color solo valida que el color existe, no dónde está ni qué forma tiene. (b) Cuando un personaje porta un arma tanto en su spritesheet como en una capa separada, el spritesheet debe omitir el arma en la mano activa durante exactamente los mismos ticks en que la capa dinámica la despliega, y el punto de anclaje de la capa dinámica debe coincidir con la coordenada del puño de ese cuadro.
- Cambio recomendado al proceso: para toda animación o efecto compuesto en runtime, exigir en la implementación y en la auditoría un script de captura por tick desde el `<canvas>` hacia `scratch/` y la lectura visual del mosaico resultante antes de emitir dictamen.
- Evidencia o referencia: `docs/planes/ART-POLISH-02.md` (Rev. 2) y `docs/verificacion.md` §GOW8B-ART-POLISH-02; `scratch/browser-combo-audit.png` y `scratch/re-audit-combo.png` (`523e49bd…`); `src/scene/ShellScene.ts`; `src/entities/WeaponLayer.ts` (`chaos-blade-tex`); `scripts/gen-kratos-anim.py`.

### GOW1-COMBAT-2D-01 — Traducir mecánicas de combate 3D a un plano lateral 2D acoplando cinemática determinista con clamp de contacto sobre plataformas y reacción física de entidades (2026-10-22)

- Resultado: aprobada tras auditoría independiente de solo lectura (5/5 criterios).
- Método que funcionó:
  1. **Separación estricta de simulación y render:** la lógica de combate de PS2 (combos ramificados, hold de botón para launcher, tracción de agarre, detección de impacto en `yTop`, *hitstop* cinemático y balística de enemigos `vx`/`vy`) se implementó de forma puramente determinista en `src/sim/attack.ts` y `src/sim/world.ts` sin depender de Phaser.
  2. **Clamp rasante de entidades compuestas sobre plataformas:** en ataques descendentes con látigo o picados aéreos, restringir la ordenada de cada eslabón y de la hoja a `yTop - 2` convierte un posible artefacto visual (cadenas atravesando el suelo hacia el vacío) en una deformación plástica rasante verosímil sobre la madera de la cubierta, emitiendo a la vez eventos discretos de impacto (`groundImpactTicks`).
  3. **Verificación visual mediante tres mosaicos multi-tick diferenciados:** en lugar de una única captura estática, tanto el implementador como el auditor generaron e inspeccionaron mosaicos del `<canvas>` real cubriendo las tres familias cinemáticas: (a) azote terrestre con remate *Plume of Prometheus*, (b) elevación balística *Ascension* y combate aéreo con picado descendente, y (c) proyección horizontal tensa y tracción de agarre.
- Dificultad o fallo observado: al cambiar a modelos con diferentes cuotas de invocación, el orquestador debe seleccionar el modelo adecuado de la bolsa disponible (Gemini Pro/Flash) para evitar bloqueos por `RESOURCE_EXHAUSTED` en subagentes pesados de implementación.
- Aprendizaje transferible: para que un sistema de combate lateral 2D se sienta fiel a un juego 3D de referencia (*God of War* PS2), no basta con clonar las hitboxes: el impacto contra el escenario físico (`yTop`) y la respuesta balística del objetivo (*hitstop* con congelación de fotograma, *knockback* y *launch* vertical) son los que permiten enlazar combos auténticos (como elevar a un enemigo y continuarlo en el aire). Acoplar estas reglas en simulación pura y verificarlas con mosaicos multi-tick en navegador garantiza la coherencia cinemática sin degradar el determinismo.
- Cambio recomendado al proceso: al adaptar movimientos con interacción vertical o impacto contra el suelo, definir conjuntamente en la simulación la cinemática del atacante, la respuesta del objetivo y las coordenadas de contacto contra la superficie de apoyo, verificando siempre la interacción con capturas de vídeo o mosaicos cuadro a cuadro del `<canvas>`.
- Evidencia o referencia: `docs/planes/GOW1-COMBAT-2D-01.md`; `docs/verificacion.md` §GOW1-COMBAT-2D-01; `scratch/evidence-plume-combo.png`, `scratch/evidence-ascension-air-combo.png`, `scratch/evidence-chain-grab.png`; baseline `combat60 = 9af9a492`.

### GOW1-COMBAT-POLISH-01 — La fluidez de combate y armas articuladas requiere eliminar vacíos visuales en cancelaciones, aceleración no lineal y buffer de entrada desacoplado del motor (2026-10-22)

- Resultado: aprobada tras auditoría independiente de solo lectura (8/8 criterios).
- Método que funcionó:
  1. **Continuidad visual entre transiciones de estados:** se eliminó el ocultamiento abrupto del arma (`hideWeapon`) durante la fase de preparación (`startup`) de cancelaciones de combo, reemplazándolo por una postura tensa de anticipación orientada hacia el origen del nuevo tajo, y una retracción suave que cubre el 100 % de la ventana de recuperación (`recovery`).
  2. **Cinemática elástica con curvas de aceleración (`easeOutCubic`):** sustituir la progresión angular lineal por una curva no lineal otorga inercia y latigazo visible a las armas articuladas sin modificar la física discreta de colisiones.
  3. **Input Buffering agnóstico a la congelación de fotogramas (*hitstop*):** desacoplar el buffer de entrada para almacenar la intención de golpe durante *startup*, *hitstop* o recuperaciones tempranas permite que los combos enlacen con fluidez orgánica sin exigir precisión de milisegundos.
  4. **Verificación dual estática/dinámica en el proyecto (`scripts/verification/`):** estandarizar los scripts de verificación de navegador dentro del propio repositorio (con Node.js nativo vía WebSockets/CDP y generación de GIFs a 60 fps mediante `ffmpeg`) proporciona evidencia reproducible e independiente del runtime de IA que lo ejecute.
- Dificultad o fallo observado: un arma puede tener hitboxes matemáticamente perfectas pero sentirse "corta" y "abrupta" si el radio espacial no guarda proporción con la escala del sprite (menos de la mitad del ancho del personaje) o si la fase activa dura menos de 100 ms (un parpadeo). Escalar el radio a 76–110 px y la fase activa a 117–150 ms restaura la presencia escénica del arma.
- Aprendizaje transferible: la "fluidez" o *game feel* de un sistema de combate rápido depende de tres factores complementarios: (a) continuidad visual (nunca ocultar el arma durante transiciones o cancelaciones intermedias), (b) elasticidad temporal (aceleración con chasquido y tiempos activos suficientes para que la retina registre el arco), y (c) tolerancia de entrada (buffer que no se invalida por las pausas de impacto cinemático).
- Cambio recomendado al proceso: en toda tarea de combate o armas enlazadas, incluir en los criterios de aceptación la prueba de "cero fotogramas con arma invisible en transiciones", una curva de aceleración no lineal documentada y verificación automatizada en navegador con captura de vídeo o GIF animado.
- Evidencia o referencia: `docs/planes/GOW1-COMBAT-POLISH-01.md`; `scripts/verification/capture-combat.mjs`; `scripts/verification/output/*.gif` y `*.png`; baseline `combat60 = f8185a7c`.

### KRATOS-ART-MODEL-01 — En pipelines de animación 2D, rediseñar y consolidar el modelo maestro antes de ramificar animaciones evita retrabajo masivo (2026-10-22)

- Resultado: aprobada tras auditoría independiente de solo lectura (5/5 criterios).
- Método que funcionó:
  1. **Orden de pipeline estricto (Modelo maestro antes de cinemática nueva):** antes de introducir animaciones de derrape, giros o combos extendidos, se concentró el trabajo exclusivamente en el modelo anatómico y de accesorios en el generador maestro (`scripts/gen-kratos-anim.py`). Cualquier mejora anatómica (trapecios, deltoides, pectorales, tatuajes, cadenas enrolladas, faldón y grebas) se propagó inmediatamente a todas las hojas de sprites (`kratos-idle`, `kratos-run`, `kratos-air`, `kratos-attack`, `kratos-roll`) sin necesidad de redibujar manualmente cada animación por separado.
  2. **Triple compuerta de invariantes de pixel art:** (a) aserción estricta de paleta de 6 colores (`assert set(colors) == set(PALETTE)`), impidiendo cualquier degradado espurio o antialiasing de renderizado; (b) dimensiones estrictas por fotograma ($97 \times 59\text{ px}$); (c) anclaje rasante exacto en la fila inferior $y=58$ (`f_bbox[3] == 59`), evitando que el personaje flote o se hunda en la superficie de apoyo.
  3. **Calibración milimétrica de puntos de anclaje de armas (`CONFIG.player.attack.hands`):** al esculpir con precisión los puños y la postura de combate en cada pose de ataque, se midieron y actualizaron las coordenadas de origen de las armas procedurales, garantizando que el punto de nacimiento de las cadenas coincida con el centro exacto del puño visible en el lienzo.
- Dificultad o fallo observado: un modelo visual con geometría simplificada (maniquí) puede ser técnicamente correcto en dimensiones pero carecer de presencia física y peso visual; la modularización de subrutinas anatómicas (`draw_torso`, `draw_skirt`, `draw_head`, `draw_bracer`, `draw_greave_and_boot`) permitió un relieve muscular y sombreado de 1 px consistente en todas las poses.
- Aprendizaje transferible: en proyectos con generación procedural o modular de sprites, fijar y auditar la anatomía y la indumentaria del modelo maestro en la etapa inicial de un ciclo de arte ahorra retrabajo exponencial. Toda modificación del modelo maestro debe contrastarse inmediatamente contra los anclajes de las capas dinámicas dependientes (como orígenes de armas o efectos) y validarse contra la paleta indexada estricta.
- Cambio recomendado al proceso: al iniciar un ciclo de refinamiento visual o de combate, programar la revisión del modelo maestro como primera etapa indivisible antes de cualquier adición de cuadros intermedios, giros o ataques secundarios.
- Evidencia o referencia: `docs/planes/KRATOS-ART-MODEL-01.md`; `scripts/gen-kratos-anim.py`; `docs/referencias/kratos-anim-contact-sheet.png`; `public/assets/characters/*.png`; `src/config.ts` (`hands`); verificación CDP en `scripts/verification/output/`.
