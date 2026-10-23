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

### GOW1-LOCO-WEIGHT-01 — La percepción de peso e inercia en 2D se genera en las transiciones de fuerza contraria y el aterrizaje elástico sin bloqueo de control (2026-10-22)

- Resultado: aprobada tras auditoría independiente de solo lectura (5/5 criterios).
- Método que funcionó:
  1. **Inercia con conservación de orientación en giros bruscos (*skid / turnaround*):** al invertir la dirección de avance a alta velocidad ($|v_x| \ge \text{maxSpeed} \times 0.6$), retener `facing` hacia el sentido del desplazamiento durante 5–6 ticks con frenado reforzado (`BRAKE_SKID = 2200 px/s²`) y mostrar una pose de talones clavados contra la inercia. Si el sprite se invierte en el tick 1, el personaje se percibe como una silueta ingrávida de papel sin importar los valores numéricos de desaceleración.
  2. **Absorción elástica de aterrizaje (*landing squash*) sin bloqueo de entrada (*zero input lockout*):** al tocar tierra desde saltos o caídas con $v_y \ge 180\text{ px/s}$, aplicar una deformación elástica vertical ($S_y = 0.92, S_x = 1.06$) durante 3 ticks manteniendo el anclaje $(0.5, 1.0)$ sobre el suelo. Para mantener la responsividad de acción arcade, cualquier pulsación de ataque, salto o esquiva cancela el estado de aterrizaje en el mismo tick sin latencia.
  3. **Cuadros de transición al final del spritesheet:** añadir el fotograma estático de derrape como cuadro 6 al final de `kratos-run.png` (restringiendo la animación cíclica a `start: 0, end: 5`) evita proliferar texturas individuales y mantiene centralizada la gestión de recursos en memoria.
- Dificultad o fallo observado: si un subagente de implementación experimenta una falla de autenticación o de runtime en medio de una tarea, el orquestador puede asumir la culminación técnica directa contrastando el diff existente, dejando constancia explícita en el informe y delegando la auditoría a un subagente independiente de solo lectura para preservar la separación de roles.
- Aprendizaje transferible: la sensación de masa y fisicalidad en un juego de acción lateral no proviene de hacer los controles torpes o lentos, sino de representar visual y mecánicamente las fuerzas contrarias en los momentos de desaceleración y aterrizaje, sin penalizar la reactividad de las entradas del jugador.
- Cambio recomendado al proceso: al diseñar sistemas de locomoción para personajes pesados, incluir desde la fase de diseño las tres reglas de inercia: (a) derrape no instantáneo en giros a alta velocidad, (b) compresión elástica de aterrizaje, y (c) política de cero bloqueo de control para no degradar la responsividad.
- Evidencia o referencia: `docs/planes/GOW1-LOCO-WEIGHT-01.md`; `src/sim/movement.ts`; `src/sim/vertical.ts`; `src/scene/ShellScene.ts`; `scripts/gen-kratos-anim.py`; `scripts/verification/output/loco_weight_turnaround_landing_mosaic.png`.

### GOW1-COMBAT-BODY-01 — El peso cinemático en combate requiere empuje físico de cadera (lunge) y detección envolvente continua para armas de cadena (2026-10-22)

- Resultado: aprobada tras auditoría independiente de solo lectura (5/5 criterios).
- Método que funcionó:
  1. **Empuje corporal activo (*lungeVx*) y absorción en recuperación:** inyectar una velocidad hacia adelante en la fase `active` (`lungeVx` de 45 a 90 px/s) mientras se bloquea el control horizontal (`horizontalLocked = true`), transfiriendo la inercia corporal del guerrero hacia cada tajo. Al pasar a `recovery`, la fricción del suelo (`brake`) desacelera suavemente la entidad, logrando un retroceso y detención naturales.
  2. **Detección continua a lo largo del cuerpo del arma (envolvente grip-to-blade):** para armas articuladas o de gran radio (como las Cuchillas del Caos de 76 a 110 px), verificar la colisión evaluando la caja envolvente que une el agarre del puño (`gripX`, `gripY`) con el extremo de la hoja (`bladeCenterX`, `bladeCenterY`). Evaluar únicamente la punta del arma genera un punto ciego artificial a quemarropa donde los enemigos situados entre el personaje y la punta quedan inexplicablemente inmunes al corte.
  3. **Área sísmica de impacto en el suelo (`shockRadius`):** en ataques descendentes con impacto en superficie (*Plume of Prometheus*, *Heavy Slam*), acoplar el evento sísmico con una detección radial en suelo (`shockRadius: 28 px`) que levanta a los objetivos cercanos mediante la onda de choque, emparejada con una sacudida de pantalla visible (`shakePx: 2`).
- Dificultad o fallo observado: al dotar de avance a los ataques ligeros, el personaje se acerca físicamente al objetivo, lo que provocó que el remate de gran radio de la Pluma pasara por encima del enemigo cuando la colisión solo medía la punta del arma; calcular el barrido envolvente continuo resolvió el problema garantizando que cualquier enemigo en la trayectoria de la cadena sea golpeado.
- Aprendizaje transferible: en sistemas de combate 2D con armas de longitud variable, las hitboxes no deben modelarse como proyectiles aislados en el ápice, sino como envolventes de barrido que cubren desde el origen del brazo hasta la punta. El peso de un golpe se percibe tanto por el avance del cuerpo que lo lanza como por la absorción del retroceso en la recuperación.
- Cambio recomendado al proceso: en toda implementación de armas de cuerpo a cuerpo extendidas o encadenadas, definir la colisión como un segmento o envolvente entre el atacante y la punta, y contrastar los casos de prueba tanto a máxima distancia como a quemarropa.
- Evidencia o referencia: `docs/planes/GOW1-COMBAT-BODY-01.md`; `src/config.ts`; `src/sim/attack.ts`; `src/sim/world.ts`; `scripts/verification/capture-combat.mjs`; `scripts/verification/output/plume_finish_mosaic.png`.

### GOW1-COMBOS-EXT-01 — La profundidad y fluidez de combate de acción se fundamenta en ramificaciones de combo basadas en estados, azote vertical reactivo y cancelación temprana de esquiva (2026-10-22)

- Resultado: aprobada tras auditoría independiente de solo lectura (5/5 criterios).
- Método que funcionó:
  1. **Bifurcaciones de ataque basadas en el estado previo y buffer de entrada (`nextMoveFor`):** desacoplar las cadenas de ataque ligeras y pesadas en una máquina de estados determinista (`light_1 -> light_2 -> light_3 -> light_4` o `light_3 + heavy -> spirit_of_hercules`), donde la intención de combo registrada en el buffer durante la fase activa se resuelve unívocamente al inicio de la recuperación sin condiciones de carrera.
  2. **Interrupción y azote vertical de objetivos aéreos (*Orion's Harpoon*):** en mecánicas de agarre aéreo contra enemigos suspendidos, congelar la inercia del objetivo al momento del impacto y proyectarlo violentamente hacia abajo (`launchVy = 480 px/s`) con colisión de suelo obligatoria (`groundImpact: true`). Esto transforma un golpe ordinario en una acción teatral de alto impacto kinestésico acoplada a la geometría de la plataforma.
  3. **Cancelación reactiva de la ventana de vulnerabilidad tras esquiva (*dash-attack cancel*):** permitir que los comandos de ataque interrumpan los fotogramas finales de una rodada una vez expirados los fotogramas de invulnerabilidad (`invulTicks === 0`) elimina la rigidez motora en transiciones defensiva-ofensiva, permitiendo al jugador castigar instantáneamente tras una esquiva oportuna.
- Dificultad o fallo observado: si los estados de esquiva retienen un bloqueo total de entrada durante toda la animación (incluida la recuperación sin invulnerabilidad), el combate se percibe acartonado y con retardo de entrada ficticio. Liberar la cancelación hacia ataque justo cuando expira la inmunidad restituye la agilidad sin sacrificar el riesgo de la maniobra defensiva.
- Aprendizaje transferible: la riqueza de un sistema de combate de acción lateral no reside en la cantidad de animaciones aisladas, sino en la modularidad de sus ramificaciones (árbol de combos), el control de los planos espaciales (elevar al enemigo y rematarlo en el aire hacia el suelo) y la asimetría intencionada entre ventanas defensivas e hiperreactividad ofensiva (cancelación de salida de rodada hacia ataque en carrera).
- Cambio recomendado al proceso: al diseñar árboles de combate y movimientos de movilidad, auditar siempre la transición de salida entre maniobras defensivas y ataques, verificando que los fotogramas de penalización tras la invulnerabilidad admitan cancelaciones fluidas hacia ataques de castigo.
- Evidencia o referencia: `docs/planes/GOW1-COMBOS-EXT-01.md`; `src/config.ts`; `src/sim/types.ts`; `src/sim/attack.ts`; `src/sim/world.ts`; `scripts/verification/capture-combat.mjs` (Casos F y G).

### GOW8B-GUARD-01 — El sistema defensivo responsivo exige ventanas temporales discretas (parry) con cancelación de entrada inmediata hacia esquiva y contrataque (2026-10-22)

- Resultado: aprobada tras auditoría independiente de solo lectura (7/7 criterios).
- Método que funcionó:
  1. **Máquina de estados de guardia discreta y determinista (`guardPhase`):** segmentar la guardia en cuatro fases discretas (`none -> startup -> active -> recovery`), donde una ventana de desvío temporal (*Parry*) de duración exacta (6 ticks / 100 ms) se activa de manera determinista al transicionar de *startup* a *active*, permitiendo recompensar la anticipación del jugador sin ambigüedad de fotogramas.
  2. **Cancelación reactiva inmediata (Zero Input Lockout):** permitir que una orden de esquiva (`Shift` / rodada) o de contrataque (`J`/`K`/`L` o salto) interrumpa y cancele la guardia en el mismo tick de simulación. Retener al jugador en una animación de bloqueo sin posibilidad de esquivar o contratacar genera una sensación de pesadez y vulnerabilidad artificial.
  3. **Restricción cinemática absoluta en simulación:** durante la guardia activa, forzar $v_x = 0$ y bloqueo de orientación horizontal en el núcleo de simulación desacoplado de la vista, garantizando que el personaje actúe como un baluarte inamovible frente al avance sin depender de fricciones analógicas.
- Dificultad o fallo observado: si la tecla de guardia se procesa solo como evento momentáneo (edge), la postura defensiva decae de inmediato; desacoplar el estado sostenido (`held`) para sostener la guardia mientras la tecla se presione, con una breve recuperación (4 ticks) al soltarla, permite tanto la parada momentánea de reflejo como el bloqueo sostenido estratégico.
- Aprendizaje transferible: en sistemas de combate de acción intensa, las mecánicas defensivas deben ser hiperresponsivas: entrar en guardia debe bloquear el movimiento al instante, la ventana de parada perfecta debe estar delimitada al inicio, y el jugador debe poder romper su propia guardia en cualquier momento mediante esquiva o ataque para mantener el ritmo fluido del combate.
- Cambio recomendado al proceso: al modelar acciones defensivas o de bloqueo, diseñar la máquina de estados con una política explícita de cancelación prioritaria por esquiva y contrataque, y validar en la suite de pruebas automatizadas los tiempos de permanencia de la ventana de desvío y la interrupción en el mismo tick.
- Evidencia o referencia: `docs/planes/GOW8B-GUARD-01.md`; `src/sim/guard.ts`; `src/sim/world.ts`; `src/config.ts`; `scripts/verification/capture-combat.mjs` (Casos H e I).

### GOW8B-ENEMY1-ART — La jerarquía visual en combate 2D exige asimetría de siluetas, contraste cromático y estados mecánicos codificados en el spritesheet (2026-10-22)

- Resultado: aprobada tras auditoría independiente de solo lectura (4/4 criterios).
- Método que funcionó:
  1. **Jerarquía anatómica y proporcional estricta:** diseñar el sprite del esbirro (Legionario No-Muerto) con una altura intencionadamente menor (46–50 px) frente a Kratos (56–59 px) y una silueta encorvada y esquelética, permitiendo al jugador reconocer de inmediato la jerarquía de poder físico y la diferencia entre héroe y tropa básica.
  2. **Contraste cromático complementario:** utilizar una paleta de 12 colores dominada por tonos óseos marfil, bronce corrompido, acero oxidado y ojos incandescentes, que contrasta claramente contra la piel ceniza pálida, el tatuaje rojo y las Cuchillas del Caos de acero claro de Kratos, garantizando legibilidad total incluso durante mezclas de combate cuerpo a cuerpo cerrado.
  3. **Contrato de poses acoplado a la máquina de estados de combate:** codificar directamente en la hoja de sprites las posturas que la simulación requiere para cada fase mecánica: anticipación con silueta abierta y destello de ojos (`windup` / telegraph), suspensión aérea con despeje vertical respecto al suelo (`juggle` aéreo con 10 px libres) y colapso total de huesos a nivel de suelo (`death`), eliminando la necesidad de artificios de escala o rotaciones arbitrarias en el motor gráfico.
- Dificultad o fallo observado: si los cuadros aéreos o de colapso fuerzan el mismo contacto en $y = 53$, el enemigo parecería flotar o apoyarse en el suelo de forma incongruente; calibrar el cuadro de suspensión aérea con despeje deliberado y verificar el anclaje $y = 53$ exclusivamente en los cuadros de apoyo terrestre garantiza coherencia visual sin violar la línea de suelo.
- Aprendizaje transferible: en juegos de acción lateral con combate multidimensional (tierra y aire), la hoja de sprites de los enemigos debe incorporar las reacciones cinemáticas del repertorio del jugador (anticipación legible para parry, impacto, elevación aérea y colapso terminal). Mantener una jerarquía de escala del 80–85 % respecto al protagonista refuerza la sensación de poder del combate sin degradar el detalle en pixel art.
- Cambio recomendado al proceso: al diseñar hojas de sprites para enemigos o esbirros, exigir en los criterios de aceptación la inclusión de fotogramas explícitos de anticipación (telegraph), reacción de suspensión aérea (*juggle*) y muerte, verificando sus cotas relativas respecto a la silueta del protagonista.
- Evidencia o referencia: `docs/planes/GOW8B-ENEMY1-ART.md`; `scripts/gen-enemy-legionnaire.py`; `public/assets/characters/legionnaire.png`; `docs/referencias/legionnaire-contact-sheet.png`; `src/scene/ShellScene.ts`.

### GOW8B-ENEMY1-AI — El bucle de combate reactivo se sostiene en avisos simétricos (telegraph), interrupción ofensiva y respuesta física compartida (2026-10-22)

- Resultado: aprobada tras auditoría independiente de solo lectura (5/5 criterios).
- Método que funcionó:
  1. **Ventana de anticipación y telegraph explícito (`windupTicks: 24` / 400 ms):** dotar al enemigo de un estado de preparación estacionaria antes del tajo con silueta vertical abierta y ojos incandescentes. Esto ofrece al jugador el espacio cognitivo indispensable para decidir entre desvío perfecto (*Parry*), rodada de esquiva con i-frames o interrupción ofensiva directa.
  2. **Interrupción y vulnerabilidad de iniciativa:** si el jugador golpea al esbirro durante su fase de anticipación (`windup`), cancelar inmediatamente el ataque enemigo y transicionarlo a `hitstun`, recompensando la agresividad y el control del espacio.
  3. **Simetría física y suspensión aérea compartida (`juggle`):** gobernar a los enemigos con las mismas leyes cinemáticas del núcleo de simulación (gravedad, colisión con plataformas $yTop$, retroceso horizontal $v_x$ e impulsos verticales $v_y < 0$). Esto permite que los ataques como *Ascension* o *Plume of Prometheus* eleven al enemigo de forma natural y determinista, habilitando combos aéreos orgánicos sin necesidad de scripts de comportamiento aislados por golpe.
  4. **Resolución determinista de interacciones defensivas (Parry / Bloqueo):** al impactar el tajo enemigo, evaluar prioritariamente el estado del defensor (`parryActive` $\rightarrow$ desvío con rechazo de $120\text{ px/s}$ y aturdimiento largo de 32 ticks; `guardPhase === active` $\rightarrow$ absorción y empuje leve; `invulTicks > 0` $\rightarrow$ fallo por esquiva).
- Dificultad o fallo observado: si los enemigos evalúan su ataque mediante timers desvinculados de la simulación física, las colisiones aéreas y las cancelaciones por parry se desincronizan; acoplar toda la IA como función pura tick a tick sobre `EntityState` garantiza que los 126 cuadros del combate se repitan con determinismo idéntico en las pruebas automáticas de CDP.
- Aprendizaje transferible: en un juego de combate lateral de ritmo rápido, la IA de los esbirros no debe ser impredecible o instantánea, sino estructurada alrededor del repertorio del héroe: telegraph generoso para permitir el parry, castigo severo al ser desviado, e integración física total para que los ataques aéreos y sísmicos se sientan colosales.
- Cambio recomendado al proceso: en toda implementación de IA enemiga, vincular formalmente la ventana de anticipación (`windup`) con una política de interrupción por golpes del jugador y con la reacción ante la ventana de parada perfecta (*Parry*), validando el ciclo completo en las pruebas automatizadas de navegador.
- Evidencia o referencia: `docs/planes/GOW8B-ENEMY1-AI.md`; `src/sim/legionnaire.ts`; `src/sim/world.ts`; `src/sim/types.ts`; `src/config.ts`; `scripts/verification/capture-combat.mjs` (Caso J: `t=1` approach, `t=23` windup, `t=49` parry deflection, `t=62` juggle, `t=111` death).

### GOW8B-DAMAGE-01 — La jerarquía estricta de mitigación defensiva e invulnerabilidad post-daño previene el stunlock y garantiza juego justo (2026-10-22)

- Resultado: aprobada tras auditoría independiente de solo lectura (5/5 criterios).
- Método que funcionó:
  1. **Cadena unificada de prioridad defensiva (`applyDamageToPlayer`):** resolver cualquier impacto entrante mediante una cascada determinista de prioridad estricta:
     - (a) Evasión total por maniobra o gracia: si `invulTicks > 0` (rodada) o `hurtInvulTicks > 0` (inmunidad post-golpe), daño 0.
     - (b) Desvío perfecto (*Parry*): si `parryActive === true`, daño 0, sin retroceso a Kratos y desvío con rechazo largo al atacante.
     - (c) Mitigación en guardia: si `guardPhase === 'active'`, absorción del 85 % del daño (daño residual $\sim 2\text{ HP}$), retroceso amortiguado y conservación de la postura defensiva sin interrupción.
     - (d) Impacto pleno desprotegido: deducción íntegra de vida, interrupción de ataques activos, retroceso horizontal opuesto al agresor ($140\text{ px/s}$) y activación simultánea de dolor (`hitstun`) e invulnerabilidad post-daño.
  2. **Ventana de gracia post-daño (*hurt i-frames*, 45 ticks / 750 ms):** conceder al jugador una ventana de inmunidad temporal acompañada de parpadeo visual tras recibir un impacto directo. Esto impide que una ráfaga o un grupo de esbirros atrape al personaje en un bucle letal continuo (*stunlock* injusto).
  3. **Bucle de derrota y reinicio determinista (`restart` / tecla `R`):** al alcanzar $\text{hp} = 0$, congelar las acciones de Kratos con aviso en pantalla y permitir el reseteo instantáneo del escenario mediante una acción determinista en el motor de simulación, sin requerir recargar la página del navegador.
- Dificultad o fallo observado: si la mitigación de guardia interrumpe la postura del jugador, bloquear se percibe frágil y desaconsejable; absorber el grueso del daño (85 %) y permitir que el jugador sostenga la guardia frente a tajos continuos genera la sensación clásica de resistencia espartana.
- Aprendizaje transferible: un sistema de combate visceral requiere reglas claras y predecibles sobre el daño: evasión > desvío perfecto > bloqueo mitigado > impacto pleno. La presencia de fotogramas de invulnerabilidad post-impacto es el elemento crítico que separa un combate desafiante y justo de una experiencia frustrante por aturdimientos encadenados.
- Cambio recomendado al proceso: al diseñar sistemas de salud y daño para el jugador, formalizar desde el inicio la cascada de resolución defensiva y verificar en pruebas automatizadas tanto el daño residual mitigado como la inmunidad de los fotogramas de gracia post-impacto.
- Evidencia o referencia: `docs/planes/GOW8B-DAMAGE-01.md`; `src/sim/damage.ts`; `src/sim/world.ts`; `src/sim/types.ts`; `src/config.ts`; `src/scene/ShellScene.ts`; `scripts/verification/capture-combat.mjs` (Caso K: $t=49$ daño, $t=55$ i-frames, $t=100$ guardia, $t=111$ derrota, $t=121$ reinicio).

### GOW8B-HUD-01 — La lectura cinestésica del daño exige respuesta dual en la barra de salud y desacoplamiento espacial de telemetría (2026-10-22)

- Resultado: aprobada tras auditoría independiente de solo lectura (4/4 criterios).
- Método que funcionó:
  1. **Respuesta temporal dual (caída viva inmediata + barra fantasma con retención):** acoplar la barra viva verde con actualización instantánea (caída inmediata a $97\text{ px}$ ante impacto) para feedback motriz inmediato, combinada con una barra fantasma roja/ámbar que retiene el valor previo durante $200\text{ ms}$ (12 ticks) y luego desciende a velocidad controlada ($45\text{ px/s}$). Esto permite al ojo humano registrar con exactitud la severidad del golpe recibido sin añadir lag artificial a la respuesta del juego.
  2. **Desacoplamiento arquitectónico de la interfaz (`HudLayer.ts`):** encapsular el HUD en una capa modular que únicamente consume el estado observable de la simulación (`player.hp`, `maxHp`, `isDead`), manteniendo la lógica de simulación pura $100\%$ desacoplada del renderizado gráfico de Phaser.
  3. **Partición espacial preventiva de textos de depuración:** reubicar la telemetría de desarrollo fuera del cuadrante de interfaz ($x=155$ en lugar de $x=6$) para evitar colisiones y superposiciones visuales entre el marco ornamental del HUD y los datos de depuración en pantalla.
- Dificultad o fallo observado: si la barra fantasma se actualiza frame a frame sin una pausa inicial de retención, su movimiento se funde con la barra viva y el jugador no puede percibir cuánto daño le restó un golpe específico; incorporar la ventana de pausa de 200 ms resuelve por completo la lectura visual clásica.
- Aprendizaje transferible: en juegos de acción, las interfaces de vida no deben ser simples medidores proporcionales estáticos: la combinación de respuesta instantánea para la salud viva y drenaje retardado para la barra fantasma proporciona una lectura táctil inmediata del combate.
- Cambio recomendado al proceso: al diseñar HUDs de salud o energía, requerir en los criterios de aceptación la inclusión de la barra fantasma con retención temporal y la comprobación de no interferencia espacial contra capas de telemetría.
- Evidencia o referencia: `docs/planes/GOW8B-HUD-01.md`; `src/ui/HudLayer.ts`; `src/config.ts`; `src/scene/ShellScene.ts`; `scripts/verification/capture-combat.mjs` (Caso L: $t=1$ 110 px, $t=49$ 97 px viva / 110 px ghost, $t=80$ drenaje ghost, $t=111$ 0 px derrota, $t=121$ reinicio 110 px).

### GOW8B-ORBS-01 — La cinemática en dos fases y la persistencia de un tick garantizan feedback táctil en bucles de recompensa (2026-10-22)

- Resultado: aprobada tras auditoría independiente de solo lectura (5/5 criterios).
- Método que funcionó:
  1. **Cinemática balística en dos fases (eclosión en abanico + atracción magnética acelerada):** proyectar los orbes al nacer con dispersión angular simétrica ($[-40, -20, 0, 20, 40]\text{ px/s}$) e impulso vertical ($v_y = -110\text{ px/s}$), seguido de aceleración suave hacia el centro de masa del héroe ($y - 28$) al entrar en el radio magnético ($180\text{ px}$). Esto genera una silueta visual viva y orgánica que evita trayectorias rígidas en línea recta.
  2. **Persistencia de 1 tick del estado de absorción:** retener los orbes absorbidos con `absorbed = true` en el snapshot durante exactamente un fotograma antes de eliminarlos de la memoria del simulador. Esto permite a los sistemas desacoplados de renderizado y audio detectar el punto exacto de colisión, disparar el destello de absorción y actualizar el HUD sin condiciones de carrera.
  3. **Retroalimentación visual acoplada a la economía:** vincular la absorción de orbes directamente a la recuperación de la barra de vida en el HUD (`+15 HP`) y al acumulador numérico de orbes rojos (`+20`), confirmando visualmente el impacto de la victoria sobre cada esbirro.
- Dificultad o fallo observado: si los orbes son atraídos a los pies del personaje, se funden con las sombras del entablado; apuntar la atracción hacia el pecho ($y - 28$) mantiene los orbes claramente visibles sobre el torso durante todo el vuelo de aproximación.
- Aprendizaje transferible: en sistemas de botín o partículas de recompensa, desacoplar el origen de la dispersión de la atracción final y conservar el estado de impacto durante un ciclo de simulación asegura que el jugador experimente la satisfacción del feedback sensorial antes de la recolección de basura del objeto.
- Cambio recomendado al proceso: al modelar partículas o coleccionables absorbidos por el jugador, fijar el destino en el centro torácico del personaje y prever una ventana de 1 tick para disparar efectos visuales de absorción antes de la purga en simulación.
- Evidencia o referencia: `docs/planes/GOW8B-ORBS-01.md`; `src/sim/orbs.ts`; `src/sim/world.ts`; `src/ui/HudLayer.ts`; `src/scene/ShellScene.ts`; `scripts/verification/capture-combat.mjs` (Caso M: $t=50$ muerte, $t=51$ 5 orbes generados, $t=60$ vuelo magnético, $t=85$ absorción $+15\text{ HP}$ / $+20\text{ orbes}$ en HUD).

### GOW8B-ENEMY2-ART — La diferenciación espectral y la jerarquía de escala resuelven la lectura periférica de amenazas en pixel art (2026-10-23)

- Resultado: aprobada tras auditoría independiente de solo lectura (4/4 criterios).
- Método que funcionó:
  1. **Diferenciación espectral por tonalidad en cuencas oculares:** asignar un tono amatista/violeta espectral (`#b040ff`, `#e890ff`) en los ojos del arquero frente al carmesí/naranja ígneo del legionario cuerpo a cuerpo (`#ff3820`, `#ff9030`). Esto permite al jugador identificar el tipo de amenaza instantáneamente en la visión periférica sin necesidad de fijar la vista en el modelo completo.
  2. **Jerarquía anatómica proporcional y anclaje inferior invariante:** estructurar al arquero con menor altura (44–48 px) y silueta más encorvada que el legionario (48–50 px) y Kratos (56–59 px), pero preservando estrictamente la línea de contacto de suelo en $y=53$ (`bbox[3] == 54`). Esto asegura que al compartir escenario ambos esbirros se perciban naturales y cohesionados con el entorno sin solapamiento de escala.
  3. **Telegraph visual en fotograma dedicado:** articular la pose de tensado (`aim`, cuadro 3) como una silueta abierta y expandida horizontalmente (44 px de ancho vs 30 px en reposo) con destello en la cuenca, preparando el soporte visual requerido para ventanas de reacción en la simulación de combate.
- Dificultad o fallo observado: al compartir la misma cuadrícula de 64×54 px, si la silueta no ensancha sus extremos durante la anticipación, la transición hacia el disparo se percibe brusca y difícil de telegrafiar a baja resolución; abrir el cuerpo en el eje X durante el tensado genera una silueta inconfundible.
- Aprendizaje transferible: en juegos retro o con resolución interna reducida, la variedad de enemigos debe codificarse mediante contrastes cromáticos de alta saturación en puntos focales clave (ojos, armas) y siluetas angulares distintivas antes que en detalles de microtextura que se pierden a 1×.
- Cambio recomendado al proceso: al diseñar nuevas familias de esbirros sobre cuadrículas compartidas, definir formalmente un rasgo cromático distintivo y validar la lectura periférica de la silueta telegrafiada en la hoja de contacto previa a la codificación de IA.
- Evidencia o referencia: `docs/planes/GOW8B-ENEMY2-ART.md`; `scripts/gen-enemy-archer.py`; `public/assets/characters/archer.png`; `public/assets/characters/arrow.png`; `docs/referencias/archer-contact-sheet.png`; `src/scene/ShellScene.ts`.

### GOW8B-ENEMY2-AI — La reversión de vectores proyectil por desvío perfecto transforma amenazas en oportunidades tácticas (2026-10-23)

- Resultado: aprobada tras auditoría independiente de solo lectura (4/4 criterios).
- Método que funcionó:
  1. **Inversión cinemática con aceleración elástica (`parryReflectSpeedMult = 1.5`):** al desviar una flecha en la ventana activa de Parry, invertir su vector de velocidad ($v_x = -v_x \times 1.5 \rightarrow 420\text{ px/s}$) y marcarla como proyectil amigo (`reflected = true`). El incremento de velocidad proporciona una sensación de devolución violenta y gratificante mientras castiga al agresor con aturdimiento largo (36 ticks).
  2. **Interrupción por iniciativa en la ventana de tensado:** estructurar la máquina de estados para que el estado de telegrafiado (`aim`, 24 ticks = 400 ms) sea 100% vulnerable a interrupciones por ataques del jugador. Esto recompensa el juego agresivo y la toma de iniciativa cuerpo a cuerpo.
  3. **Comportamiento de espaciado dinámico (kiteo):** modelar el movimiento del tirador en bandas de distancia ($[110..180]\text{ px}$), donde el enemigo se aleja si el jugador invade su espacio personal y avanza solo si queda fuera de rango, obligando al jugador a utilizar combos de avance (*lunge*), la rodada o el reflejo de proyectiles para neutralizarlo.
- Dificultad o fallo observado: si la flecha reflejada mantiene la misma velocidad original ($280\text{ px/s}$), el impacto de vuelta se siente lento y carece de peso kinético; acelerar la devolución a $420\text{ px/s}$ junto con el tinte dorado en Phaser transmite de inmediato la efectividad del desvío perfecto.
- Aprendizaje transferible: en juegos de combate con combate cuerpo a cuerpo y a distancia simultáneos, las mecánicas de desvío perfecto sobre proyectiles no deben limitarse a anular el proyectil: devolverlo con mayor velocidad y efecto de aturdimiento sobre el agresor cierra el bucle de habilidad del jugador y convierte la debilidad de la distancia en una ventaja táctica.
- Cambio recomendado al proceso: al modelar proyectiles enemigos, incluir en la especificación inicial tanto la cascada de mitigación defensiva del jugador como la regla de reflejo ofensivo (inversión de vector, aceleración multiplicada y atribución de daño).
- Evidencia o referencia: `docs/planes/GOW8B-ENEMY2-AI.md`; `src/sim/archer.ts`; `src/sim/world.ts`; `src/config.ts`; `src/scene/ShellScene.ts`; `scripts/verification/capture-combat.mjs` (Caso N: $t=15$ aim $v_x=0$, $t=25$ shoot $v_x=-280$, $t=48$ reflejo Parry $v_x=+420$, $t=68$ impacto en arquero 20 HP, $t=76$ muerte y orbes).

### GOW8B-WAVES-01 — La pausa de respiro y el spawn cinemático evitan la sobrecarga sensorial en bucles de horda (2026-10-23)

- Resultado: aprobada tras auditoría independiente de solo lectura (3/3 criterios).
- Método que funcionó:
  1. **Ventana de respiro determinista (`transitionDelayTicks = 60`):** introducir un segundo completo de pausa entre el despeje de la última baja de una oleada y la invocación de los refuerzos. Este intervalo permite al jugador recoger orbes en tránsito, reposicionarse en el escenario y reorientar su atención sin sentirse abrumado.
  2. **Cinemática de entrada emergente ($v_y = -160\text{ px/s}$):** aplicar un impulso inicial ascendente a los refuerzos que brotan de la cubierta, manteniéndolos en estado transitorio `spawning` hasta tocar suelo firme. Esto erradica el efecto artificial de aparición súbita (*pop-in*) y dota a la escena de vida orgánica.
  3. **Composición escalonada de amenazas (frontal $\rightarrow$ mixta):** articular el encuentro en oleadas con dificultad progresiva, comenzando con una vanguardia cuerpo a cuerpo predecible (legionarios) antes de introducir la combinación asimétrica de cuerpo a cuerpo y hostigamiento a distancia (legionarios + arquero).
- Dificultad o fallo observado: si los refuerzos spawnean en el mismo tick en que muere el último enemigo previo, la cámara y el HUD parpadean violentamente y el jugador suele recibir golpes no telegrafiados mientras aún completa la animación de remate anterior; la pausa de 60 ticks restablece la compostura y la claridad de combate.
- Aprendizaje transferible: en encuentros por oleadas, el ritmo (*pacing*) es tan vital como el balance de daño: un combate se siente justo y satisfactorio cuando cada oleada ofrece un momento de resolución y respiro antes de elevar la complejidad del desafío.
- Cambio recomendado al proceso: al diseñar sistemas de oleadas o zonas de arena, definir siempre una fase explícita de `cleared` con temporizador de pausa antes de la siguiente fase de spawn, y desacoplar la lógica del director de oleadas de la simulación de entidades individuales.
- Evidencia o referencia: `docs/planes/GOW8B-WAVES-01.md`; `src/sim/waves.ts`; `src/sim/world.ts`; `src/config.ts`; `src/scene/ShellScene.ts`; `scripts/verification/capture-combat.mjs` (Caso O: $t=5$ spawn 1, $t=18$ combate 1, $t=30$ pausa de respiro, $t=95$ spawn mixto 2, $t=125$ completa).

### GOW8B-ARENA-01 — El confinamiento elástico desacoplado y la disipación progresiva formalizan la tensión espacial (2026-10-23)

- Resultado: aprobada tras auditoría independiente de solo lectura (3/3 criterios).
- Método que funcionó:
  1. **Ajuste dinámico de límites en capa de simulación pura (`ArenaManager`):** modular los límites físicos horizontales de la simulación según el ciclo de vida del encuentro. En combate, confinar al héroe y a los enemigos dentro del segmento de arena $[70 .. 410]\text{ px}$ anulando $v_x$ al impactar los extremos sin degradar la simulación vertical ni los saltos.
  2. **Disipación lineal progresiva (`dissipateDurationTicks = 30`):** al registrar la victoria sobre la horda, degradar la opacidad de las barreras mágicas de forma lineal durante 500 ms antes de liberar los límites físicos. Esto permite al jugador procesar visualmente la reapertura de la ruta antes de recuperar la movilidad global.
  3. **Composición multicapa del muro mágico:** estructurar las columnas de barrera en 4 capas (halo difuso ambiental, columna intermedia, núcleo carmesí denso y filamento incandescente blanco) con modulación de pulso sinusoidal ligada al tick de simulación. Esto garantiza lectura visual inmediata de barrera mágica impenetrable a 1× sin recurrir a recursos estáticos pesados.
- Dificultad o fallo observado: si los límites de la arena se abren instantáneamente en el mismo tick en que colapsa el último enemigo, la barrera desaparece abruptamente y el jugador percibe un salto tosco de estado; acompañar la reapertura física con el fade visual de 30 ticks comunica claramente la liberación de la zona.
- Aprendizaje transferible: en juegos de acción lateral donde el escenario se bloquea contextualmente durante batallas, el confinamiento debe tratarse como un estado de la simulación con ciclo de vida (activo $\rightarrow$ disolución $\rightarrow$ libre), donde la liberación física se sincroniza con el fin de la animación de disipación para conservar la inmersión del mundo.
- Cambio recomendado al proceso: al diseñar zonas de combate bloqueadas o arenas, definir formalmente la ventana de disipación y validar en pruebas automatizadas tanto el clampado en límites durante el combate como la expansión de coordenadas tras la victoria.
- Evidencia o referencia: `docs/planes/GOW8B-ARENA-01.md`; `src/sim/arena.ts`; `src/sim/world.ts`; `src/config.ts`; `src/scene/ShellScene.ts`; `scripts/verification/capture-combat.mjs` (Caso P: $t=16$ clamp izq $x=118.5$, $t=35$ clamp der $x=361.5$, $t=36$ victoria y disipación, $t=67$ fin disipación, $t=95$ avance libre $x=421.0\text{ px}$).

### GOW8B-MAGIC-01 — La super-armadura, los pulsos multi-hit en área y el bucle de maná premian la gestión táctica de recursos (2026-10-23)

- Resultado: aprobada tras auditoría independiente de solo lectura (4/4 criterios).
- Método que funcionó:
  1. **Super-armadura e invulnerabilidad en casteo (`invulTicks = 60`):** conferir inmunidad total al daño e interrupciones durante la invocación de la magia. Dado que Kratos clava sus espadas e inmoviliza su cuerpo en el suelo ($v_x = 0$), la super-armadura garantiza que el jugador sienta el poder desatado de un dios sin temor a ser interrumpido por golpes parásitos.
  2. **Pulsos multi-hit escalonados con aturdimiento continuo:** estructurar la tormenta no como una explosión instantánea de un fotograma, sino como un vórtice continuo de 40 ticks que emite descargas periódicas cada 8 ticks. Cada pulso refresca el estado de aturdimiento (`hitstun`) de los enemigos alcanzados en el radio de 90 px, manteniéndolos suspendidos e incapacitados.
  3. **Cierre del bucle de recursos con orbes azules:** acoplar el coste de maná (35 MP) a la recompensa de combate (+20 MP por orbe azul soltado por enemigos). Esto crea una economía sostenible donde el jugador es recompensado por eliminar grupos con magia mediante la reposición inmediata de sus reservas.
- Dificultad o fallo observado: si la comprobación de maná descuenta recursos en el frame activo en vez del inicio del startup, el jugador puede abusar del inicio de animación sin coste; deducir el maná estrictamente en el tick 0 de `startup` y cancelar el inicio si $MP < 35$ garantiza justicia determinista.
- Aprendizaje transferible: en sistemas de combate con habilidades de alto impacto y coste de recurso, combinar super-armadura, daño multi-hit con aturdimiento continuo y orbes de reposición transforma la magia de un simple "botón de daño" a una herramienta táctica de control de masas y escape defensivo.
- Cambio recomendado al proceso: al diseñar habilidades mágicas o definitivas, verificar en pruebas automatizadas el bloqueo por recursos insuficientes en el tick 0 y la inmunidad a interrupción durante toda la ventana de casteo.
- Evidencia o referencia: `docs/planes/GOW8B-MAGIC-01.md`; `src/sim/magic.ts`; `src/sim/orbs.ts`; `src/sim/world.ts`; `src/config.ts`; `src/ui/HudLayer.ts`; `src/scene/ShellScene.ts`; `scripts/verification/capture-combat.mjs` (Caso Q: $t=1$ MP 100, $t=2$ MP 65, $t=43$ multi-hit AoE y baja, $t=64$ absorción orbe azul MP 85, $t=70$ bloqueo MP 20).

### GOW8B-MAP-01 — La cámara con zona muerta, el anclaje contextual en arena y el scrollFactor cero preservan la legibilidad a escala extendida (2026-10-23)

- Resultado: aprobada tras auditoría independiente de solo lectura (4/4 criterios).
- Método que funcionó:
  1. **Seguimiento con zona muerta horizontal ($\pm 32\text{ px}$):** permitir pequeños micro-ajustes de posición y combos sin que la cámara se mueva nerviosamente en cada paso. El desplazamiento de cámara solo inicia cuando Kratos rebasa los bordes de la ventana de confort, logrando una sensación visual serena y cinematográfica.
  2. **Anclaje rígido contextual de cámara durante encuentros:** al activarse una arena de combate, suprimir el seguimiento libre y fijar el scroll de cámara en el centro exacto de la refriega ($scrollX = 480\text{ px}$). Esto elimina la desorientación provocada por retrocesos o lunge hacia los extremos, permitiendo al jugador concentrarse $100\%$ en las amenazas visibles.
  3. **Invariante de desacoplamiento de interfaz (`setScrollFactor(0)`):** asegurar que todos los medidores, contadores, alertas y textos de estado vivan en el espacio de pantalla con factor de desplazamiento cero, completamente independientes del mundo físico de $1440\text{ px}$.
- Dificultad o fallo observado: si la cámara sigue rígidamente al personaje sin zona muerta, la animación de carrera y los ataques con lunge provocan un temblor continuo en los bordes del lienzo; incorporar la zona muerta de 32 px estabiliza el horizonte marino.
- Aprendizaje transferible: al transicionar de pantallas estáticas a mapas laterales continuos, la cámara no debe ser un simple espejo de la posición del avatar: la combinación de zona muerta en exploración y anclaje rígido en áreas de combate proporciona el balance óptimo entre dinamismo de viaje y estabilidad de combate.
- Cambio recomendado al proceso: al diseñar sistemas de cámara para niveles laterales, formalizar el cálculo de scroll en la capa de simulación pura antes de acoplarlo al viewport de renderizado, y validar en pruebas automatizadas la fijación en arenas de combate.
- Evidencia o referencia: `docs/planes/GOW8B-MAP-01.md`; `src/sim/map.ts`; `src/sim/world.ts`; `src/config.ts`; `src/scene/ShellScene.ts`; `scripts/verification/capture-combat.mjs` (Caso R: $t=1$ Popa $cameraX=0$, $t=16$ inicio scroll, $t=26$ anclaje arena $cameraX=480$, $t=76$ desbloqueo, $t=85$ Proa $cameraX=960$).

### GOW8B-PLATFORM-01 — La ventana temporal de drop-through y la resolución vertical multicota unifican locomoción y combate (2026-10-23)

- Resultado: aprobada tras auditoría independiente de solo lectura (3/3 criterios).
- Método que funcionó:
  1. **Temporizador determinista de descenso (`dropThroughTicks = 14`):** al registrar la intención de descenso (abajo + salto), suprimir la solidez de plataformas elevadas ($yTop < 262$) durante exactamente 14 ticks (233 ms) con velocidad vertical inicial positiva ($v_y = 60\text{ px/s}$). Esto previene que el pie vuelva a engancharse en la misma plataforma por fluctuaciones de tick.
  2. **Bloqueo preventivo de impulsos ascendentes durante el descenso:** deshabilitar la activación de saltos ascendentes (`canGroundJump`, `canAirJump`) mientras el temporizador de drop-through esté activo. Esto erradica el "doble salto accidental" que suele ocurrir cuando el jugador suelta el botón de dirección una fracción de segundo antes del salto.
  3. **Resolución dinámica de cota de impacto (`groundYBelow`):** calcular el suelo más alto directamente bajo los pies del personaje en cada tick para que los efectos de colisión física de cadenas, estelas y ondas sísmicas se originen en la superficie real donde combate el héroe (sea la viga del mástil en $y=138$ o la cubierta en $y=262$).
- Dificultad o fallo observado: si el descenso voluntario depende únicamente del estado instantáneo de la tecla abajo en cada frame, el personaje suele oscilar o rebotar sobre la plataforma si el motor procesa un salto antes que la física libere la colisión; usar el temporizador de 14 ticks estabiliza completamente la maniobra.
- Aprendizaje transferible: en juegos de plataformas 2D con plataformas unidireccionales (*one-way*), el descenso voluntario no debe ser un toggle booleano instantáneo: requiere una ventana de gracia temporal determinista durante la cual las plataformas atravesables queden explícitamente enmascaradas.
- Cambio recomendado al proceso: al modelar plataformeo con descenso voluntario, requerir en los criterios de aceptación la prueba de descenso completo sin rebote y la comprobación de impacto sísmico a diferentes cotas de elevación.
- Evidencia o referencia: `docs/planes/GOW8B-PLATFORM-01.md`; `src/sim/vertical.ts`; `src/sim/world.ts`; `src/config.ts`; `src/scene/ShellScene.ts`; `scripts/verification/capture-combat.mjs` (Caso S: $t=39$ caja Popa $y=226$, $t=41$ drop-through $ticks=14$, $t=53$ cubierta base $y=262$, $t=108$ nido cuervos $y=138$, $t=143$ impacto sísmico $yTop=138$).

### GOW8B-PICK-01 — El anclaje cinemático en interacciones contextuales y la geometría modular del HUD garantizan progresión legible (2026-10-23)

- Resultado: aprobada tras auditoría independiente de solo lectura (4/4 criterios).
- Método que funcionó:
  1. **Anclaje cinemático con supresión de acciones durante la interacción (`openDurationTicks = 24`):** al iniciar la apertura de un cofre mediante `context-action` (`E`), fijar estrictamente la velocidad horizontal ($v_x = 0$) e inhabilitar acciones de combate y locomoción (saltos, ataques, rodadas, guardia y magia) durante los 24 ticks (400 ms) de apertura. Esto previene que el avatar se deslice fuera del radio o cancele la acción por inputs residuales, dotando a la apertura de peso y compromiso deliberado.
  2. **Expansión modular dinámica del marco del HUD en función de `maxHp`:** en vez de usar dimensiones fijas o recrear objetos de presentación en cada mejora, estructurar el marco ornamental de piedra y bronce (`frameBg`, `frameTopBevel`, `frameBottomShadow`, `frameEndCap`, `channelTrough`) y las muescas divisorias para redimensionar su ancho de forma reactiva (de 110 px para 100 HP a 132 px para 120 HP, a razón de 22 px por cada segmento de 20 HP). La incorporación de la 5ª muesca se gestiona de forma limpia sin recreación de texturas ni parpadeos.
  3. **Visualización discreta de coleccionables en ranuras contiguas:** representar el progreso hacia la siguiente mejora mediante 6 casillas ornamentales que se iluminan secuencialmente en verde esmeralda con cada ojo absorbido. Esto ofrece lectura inmediata del progreso acumulado sin obligar al jugador a consultar menús de pausa.
- Dificultad o fallo observado: si la interacción contextual no anula activamente $v_x$, mantener pulsada una tecla de dirección mientras se presiona `E` provoca un deslizamiento flotante del personaje lejos del cofre; anular $v_x$ en la capa de simulación pura elimina por completo la discrepancia física.
- Aprendizaje transferible: al implementar interacciones contextuales sostenidas en juegos 2D (cofres, palancas, terminales), el sistema debe tratar la interacción como un estado cinemático con bloqueo de desplazamiento y combate. Asimismo, los elementos decorativos del HUD deben concebirse como marcos elásticos capaces de adaptarse a expansiones permanentes de estadísticas del jugador.
- Cambio recomendado al proceso: al diseñar la siguiente etapa de coleccionables (`GOW8B-PICK-02`: Plumas de Fénix y expansión de maná), reutilizar el patrón de anclaje de $v_x=0$ y la expansión modular adaptada a la barra de maná.
- Evidencia o referencia: `docs/planes/GOW8B-PICK-01.md`; `src/sim/chests.ts`; `src/sim/world.ts`; `src/config.ts`; `src/ui/HudLayer.ts`; `src/scene/ShellScene.ts`; `scripts/verification/capture-combat.mjs` (Caso T: $t=1$ inicio `state=opening` con $v_x=0$, $t=12$ mitad con $v_x=0$, $t=24$ fin con $v_x=0$, $t=25$ apertura y absorción `gorgonEyes=1`, $t=35$ 6º ojo y mejora a 120 HP, $t=60$ HUD expandido a 132 px).

### GOW8B-PICK-02 — La simetría de diseño en subsistemas de progresión dual y el escalado armónico de medidores secundarios evitan disonancia cognitiva (2026-10-23)

- Resultado: aprobada tras auditoría independiente de solo lectura (4/4 criterios).
- Método que funcionó:
  1. **Simetría funcional entre pares de recursos (Salud vs Maná):** al estructurar la recolección de Plumas de Fénix con exactamente el mismo protocolo cinemático (apertura de 24 ticks, $v_x = 0$, eyección balística ascendente $v_y = -80\text{ px/s}$ y absorción magnética a $260\text{ px/s}$) y la misma regla de progresión (6 plumas para expandir $+20\text{ MP}$), el jugador reutiliza su modelo mental sin necesidad de instrucciones adicionales.
  2. **Escalado proporcional armónico en barras secundarias del HUD:** mantener la misma tasa relativa de crecimiento ($+20\%$) en la barra de maná secundaria (de 80 px a 96 px) que en la barra de salud primaria (de 110 px a 132 px) preserva la jerarquía visual del HUD clásico de GoW 1 sin saturar la esquina superior izquierda ni colisionar con los textos de estado.
  3. **Diferenciación cromática de alta polaridad:** contrastar el verde esmeralda de salud (`0x22c55e`) con el azul zafiro incandescente de maná (`0x38bdf8`) tanto en la gema frontal del cofre, el haz de apertura y las partículas de absorción como en las 6 micro-ranuras del HUD, eliminando toda ambigüedad respecto a qué recurso se está recolectando.
- Dificultad o fallo observado: al apilar las ranuras de plumas bajo las de ojos en el HUD, un espaciado horizontal o vertical descuidado desborda sobre el texto de orbes o invade el área útil de juego; utilizar una matriz compacta con espaciado de 6 px e indicadores de $3 \times 3\text{ px}$ mantiene la compacidad requerida a 1× (480×270).
- Aprendizaje transferible: en arquitecturas de juego con múltiples vías de progresión de estadísticas, aplicar simetría de reglas de interacción y escalado proporcional coherente en las barras de interfaz consolida la intuición del jugador y previene la proliferación de reglas ad-hoc de presentación.
- Cambio recomendado al proceso: al abordar la mejora de armas por orbes rojos (`GOW8B-UPGRADE-01`), basar el feedback de gasto y desbloqueo de nivel en el mismo patrón de confirmación visual y auditiva sin romper la compacidad del HUD.
- Evidencia o referencia: `docs/planes/GOW8B-PICK-02.md`; `src/sim/chests.ts`; `src/sim/world.ts`; `src/config.ts`; `src/ui/HudLayer.ts`; `src/scene/ShellScene.ts`; `scripts/verification/capture-combat.mjs` (Caso U: $t=1$ inicio opening $v_x=0$, $t=12$ mitad opening $v_x=0$, $t=24$ fin opening $v_x=0$, $t=25$ cofre open y pluma absorbida `feathers=1`, $t=35$ 6ª pluma y expansión `maxMp=120`, `mp=120`, $t=60$ HUD expandido `manaWidth=96`).

### GOW8B-UPGRADE-01 — El desacoplamiento entre economía de recursos, modificadores de combate y jerarquía de feedback garantiza progresión sin efectos colaterales (2026-10-23)

- Resultado: aprobada tras auditoría independiente de solo lectura (4/4 criterios). Bloque 8 completado al 100 %.
- Método que funcionó:
  1. **Transición discreta de multiplicadores en la resolución de impactos:** aplicar la bonificación de daño ($+30\%$, factor $1.3$) mediante un escalado centralizado en `applyHit` (`src/sim/attack.ts`) condicionado a `player.weaponLevel === 2`, en vez de duplicar tablas de datos o crear variantes para cada uno de los 14 movimientos del combo. Esto permite que ataques ligeros, remates sísmicos (*Plume of Prometheus*), lanzadores y barridos escalen su daño de forma limpia y homogénea ($12 \to 16$, $30 \to 39$ HP).
  2. **Compuerta transaccional atómica y protección contra interrupciones:** estructurar `upgradeWeapon` como una operación atómica que verifica saldo y nivel actual en un solo tick, restando exactamente el coste (100 orbes) y denegando con saldo insuficiente. Además, condicionar la activación en `World.prototype.stepEntities` para que Kratos no pueda mejorar el arma si está en medio de una interacción contextual (abriendo cofre) o en aturdimiento post-daño.
  3. **Jerarquía de feedback multimodal:** comunicar la consagración a Nivel 2 en tres planos complementarios: (a) indicador persistente en HUD (`NV. 1` a `NV. 2` en oro y desaparición del prompt `[P] MEJORAR`); (b) banner central transitorio en pantalla con desvanecimiento de 2 segundos; (c) alteración estética sutil en gameplay (cadenas con tono ambarino ígneo `0xf59e0b` en `WeaponLayer`).
- Dificultad o fallo observado: si la acción de mejora se evalúa sin verificar si el jugador está interactuando con un cofre, presionar `P` accidentalmente mientras se abre un cofre puede solapar la cinemática de apertura con el banner de subida de nivel; condicionar la acción al estado libre del avatar resuelve cualquier solapamiento.
- Aprendizaje transferible: en juegos de combate con árboles o niveles de equipamiento, las mejoras permanentes de daño deben calcularse mediante factores de estado en tiempo de impacto antes que mediante la bifurcación de configuraciones de animación. Asimismo, el feedback debe combinar confirmación discreta en el HUD con una celebración temporal prominente sin pausar la simulación física.
- Cambio recomendado al proceso: al diseñar puntos de control y reaparición (`GOW8B-CHECK-01`), asegurar que el snapshot de guardado capture el estado íntegro de la progresión acumulada (`maxHp`, `maxMp`, `weaponLevel`, `redOrbs`).
- Evidencia o referencia: `docs/planes/GOW8B-UPGRADE-01.md`; `src/sim/chests.ts`; `src/sim/attack.ts`; `src/sim/world.ts`; `src/ui/HudLayer.ts`; `src/entities/WeaponLayer.ts`; `src/scene/ShellScene.ts`; `scripts/verification/capture-combat.mjs` (Caso V: $t=1$ inicio opening $v_x=0$, $t=12$ mitad $v_x=0$, $t=24$ fin $v_x=0$, $t=25$ apertura y +50 orbes, $t=31$ mejora a Nivel 2 `weaponLevel=2, orbs=0`, $t=48$ daño potenciado a 16 sobre legionario $HP=44$, $t=70$ HUD `weaponLevel=2`).

### GOW8B-CHECK-01 — La persistencia monótona en instantáneas de checkpoint y el desacoplamiento entre reaparición física y reseteo de mundo (2026-10-23)

- Resultado: aprobada tras auditoría independiente de solo lectura (4/4 criterios). Bloque 9 completado al 100 %.
- Método que funcionó:
  1. **Preservación monótona de inventario y estadísticas de progresión:** al morir y reaparecer en un punto de control, los recursos y mejoras acumuladas (`maxHp`, `maxMp`, `weaponLevel`, `redOrbs`, `gorgonEyes`, `phoenixFeathers`) no deben retroceder al estado exacto del fotograma en que se activó el checkpoint. Sincronizar de forma atómica y monótona (`Math.max`) cada mejora posterior hacia `savedPlayerData` garantiza que los logros obtenidos entre la activación del checkpoint y la muerte se conserven íntegros.
  2. **Reaparición cinemática determinista sin recarga de escena:** reponer al personaje en $(x_{chk}, y_{chk})$, restablecer `hp = maxHp` y otorgar una ventana de gracia de invulnerabilidad temporal (60 ticks) en un solo tick de simulación, eliminando pantallas de carga o reinicios pesados del árbol de Phaser. El bucle de derrota y reintento resulta instantáneo, limpio y libre de frustración.
  3. **Persistencia idempotente de entidades del entorno:** registrar los IDs de cofres abiertos (`openedChestIds`) en la instantánea para que los cofres ya saqueados permanezcan abiertos y los cofres intactos sigan disponibles tras el reintento, evitando duplicaciones de economía o desvanecimiento accidental de recompensas.
- Dificultad o fallo observado: si la reaparición simplemente restaura el estado congelado al pisar el checkpoint, cualquier mejora o cofre abierto posteriormente se pierde tras morir, generando una penalización excesiva; actualizar la instantánea ante cada evento de mejora permanente resuelve la inconsistencia y premia la exploración.
- Aprendizaje transferible: en arquitecturas de checkpoints y guardado para juegos de acción, el bucle de reaparición debe disociar la reubicación espacial (que vuelve al ancla segura del checkpoint) de la progresión de estadísticas y desbloqueos (que debe conservarse de forma estrictamente monótona para no devaluar el progreso del jugador).
- Cambio recomendado al proceso: al diseñar batallas de jefes (`GOW8B-HYDRA-COMBO`), colocar un punto de control justo en la antesala de la arena para que la derrota ante el jefe permita reintentos inmediatos sin repetir secciones previas del nivel.
- Evidencia o referencia: `docs/planes/GOW8B-CHECK-01.md`; `src/sim/checkpoint.ts`; `src/sim/world.ts`; `src/scene/ShellScene.ts`; `scripts/verification/capture-combat.mjs` (Caso W: $t=1$ inactivo, $t=20$ activación $x \approx 180$, $t=26$ mejora arma Nivel 2, $t=32$ muerte inducida $hp=0, isDead=true$, $t=38$ reaparición en $x=180$ con $hp=100$ y `weaponLevel=2` preservado, $t=55$ métricas estables de HUD).

### GOW8B-HYDRA-ART — La jerarquía de encuadre en entidades colosales, la compartimentación de anclajes de contacto y la polaridad cromática garantizan presencia monumental sin desbordar el lienzo (2026-10-23)

- Resultado: aprobada tras auditoría independiente de solo lectura (4/4 criterios).
- Método que funcionó:
  1. **Jerarquía de escala controlada ($128 \times 112\text{ px}$ en lienzo $480 \times 270$):** dimensionar el cuadro de la criatura colosal a aproximadamente $2\times$ la escala del héroe ($128 \times 112\text{ px}$ frente a $64 \times 54\text{ px}$) permite que la cabeza y el cuello serpentino abarquen un área focal de 90-105 px de anchura y 75-90 px de altura. Esto confiere una presencia monumental e imponente sin invadir la zona superior de interfaz ($y \in [0..40]$) ni exceder los límites verticales del navío.
  2. **Compartimentación de anclajes según naturaleza del fotograma:** en jefes colosales serpentinos, la línea de suelo no se aplica de manera uniforme: las poses de reposo, natación y rugido flotan orgánicamente a media altura, mientras que los fotogramas de impacto contra cubierta (`slam_bite`) y vulnerabilidad exhausta (`stagger_vulnerable`) deben obligatoriamente hacer contacto estricto en la base del cuadro ($y = 111$, `bbox[3] == 112`). Esto garantiza que la mordida se clave visualmente en las maderas sin dejar huecos flotantes.
  3. **Polaridad cromática en puntos focales de peligro:** contrastar las escamas abisales frías y oscuras (`#162e34`, `#22444d`) con zonas calientes de alta saturación: fauces carmesí profundas (`#b91c1c`, `#ef4444`) e iris ámbar incandescente (`#facc15`). Esta diferenciación garantiza que el telegraph de rugido con apertura a 85° sea inmediatamente detectable por el jugador en visión periférica antes del impacto.
- Dificultad o fallo observado: si los colmillos o mandíbulas en el mordisco en picado se quedan a 1 o 2 píxeles por encima del borde inferior, se percibe una molesta sensación de flotación sobre la madera; verificar matemáticamente en python `bbox[3] == 112` en los fotogramas de suelo previene discrepancias de anclaje.
- Aprendizaje transferible: al generar sprites de jefes gigantes en pixel art, distinguir formalmente entre fotogramas aéreos/marinos y fotogramas de contacto terrestre fijando aserciones de bounding box en la suite de validación de assets.
- Cambio recomendado al proceso: al implementar la lógica de combate de la Hidra (`GOW8B-HYDRA-COMBO`), acoplar los hitboxes de daño exactamente a las coordenadas y rotaciones de los fotogramas anclados en $y=111$.
- Evidencia o referencia: `docs/planes/GOW8B-HYDRA-ART.md`; `scripts/gen-enemy-hydra.py`; `scripts/verify-enemy-hydra.py`; `public/assets/characters/hydra.png`; `docs/referencias/hydra-contact-sheet.png`; `src/scene/ShellScene.ts`.

### GOW8B-HYDRA-COMBO — El telegrafiado asimétrico, las ventanas de castigo en recuperación forzada y el HUD contextual convierten jefes colosales en duelos tácticos legibles (2026-10-23)

- Resultado: aprobada tras auditoría independiente de solo lectura (4/4 criterios). Bloque 10 completado al 100 %.
- Método que funcionó:
  1. **Estructura rítmica en tres actos (Telegraph $\rightarrow$ Strike $\rightarrow$ Recovery/Stuck):** estructurar los ataques del jefe en un bucle temporal riguroso: (a) 500 ms de advertencia visual con fauces abiertas y garganta incandescente (`hydra_roar`); (b) picado fulminante con impacto sísmico en cubierta (`hydra_slam`); (c) colmillos clavados en las maderas de cubierta durante 750 ms (`hydra_stuck`). Esta fase de inmovilidad en el suelo es la recompensa kinética directa para el jugador que esquivó a tiempo.
  2. **Cascada defensiva completa ante ataques de gran envergadura:** someter el mordisco monumental a la misma cascada de justicia que los esbirros ordinarios: evasión con rodada (i-frames) o magia con super-armadura otorgan inmunidad completa (0 daño); la guardia activa reduce el impacto en un 85% (4 daño residual); la desprotección total castiga con 25 de daño y knockback.
  3. **Ventanas de vulnerabilidad crítica por umbrales de daño (`stagger` de 90 ticks):** forzar un colapso exhausto cada 100 HP perdidos rompe el ritmo defensivo y brinda al jugador el espacio táctico necesario para desencadenar combos completos (*Spirit of Hercules*, *Plume of Prometheus*) o descargar la *Ira de Poseidón*.
  4. **Desacoplamiento de interfaz en medidores monumentales:** situar la barra de salud del jefe en la franja inferior ($200 \times 7\text{ px}$) con marco de bronce y drenaje fantasma garantiza seguimiento visual continuo del encuentro sin competir ni saturar los medidores personales de Kratos (salud, maná, orbes y ranuras de coleccionables) en la esquina superior izquierda.
- Dificultad o fallo observado: si la caja de colisión del jefe se restringe a un rectángulo estático centrado en el sprite, los tajos de Kratos fallan con frecuencia cuando la cabeza se eleva en el rugido o se inclina en el suelo; definir un volumen de intercepción amplio en `attack.ts` para entidades colosales garantiza que las cadenas conecten siempre que el jefe esté en rango horizontal.
- Aprendizaje transferible: en batallas contra jefes gigantes de pantalla fija en 2D, el factor determinante del game feel es la previsibilidad de los avisos y la generosidad de las ventanas de recuperación vulnerable: el jugador debe experimentar que la victoria es el fruto de dominar el timing de esquiva y maximizar el daño en las ventanas abiertas.
- Cambio recomendado al proceso: al diseñar la interfaz y presentación de cierre (`GOW8B-UI-01`), sincronizar la pantalla de victoria del nivel con la eclosión de los 19 orbes de la Hidra.
- Evidencia o referencia: `docs/planes/GOW8B-HYDRA-COMBO.md`; `src/sim/hydra.ts`; `src/sim/attack.ts`; `src/sim/magic.ts`; `src/ui/HudLayer.ts`; `src/scene/ShellScene.ts`; `scripts/verification/capture-combat.mjs` (Caso X: $t=1$ HP 300, $t=3$ telegraph roar, $t=12$ evasión exitosa con rodada $playerHp=100$, $t=17$ hydra_stuck, $t=26$ daño de cadenas Nv. 2 $hydraHp=282$, $t=46$ multi-hit Ira de Poseidón $hydraHp=266$, $t=56$ derrota terminal $hp=0, dead=true$, $t=65$ eclosión de 19 orbes y barra vacía).

### GOW8B-UI-01 — El congelamiento atómico de ticks y la unificación de modales en capas de scroll cero garantizan pausa determinista y presentación robusta (2026-10-23)

- Resultado: aprobada tras auditoría independiente de solo lectura (4/4 criterios).
- Método que funcionó:
  1. **Congelamiento atómico de la simulación sin pausar el motor gráfico:** en lugar de usar `scene.scene.pause()` —lo que detiene el bucle de renderizado, tweens y el procesamiento de eventos de teclado de Phaser—, articular la pausa como una compuerta condicional temprana en `World.prototype.step`. Cuando `flowState === 'paused'`, la simulación no incrementa `this.tick`, no computa física ni actualiza IAs (`frame20 === 10, frame24 === 10`), permitiendo que Phaser siga renderizando a 60 fps, anime los velos y capture fluidamente la tecla `ESC` para despausar sin latencia.
  2. **Unificación de modales de flujo en una sola capa de scroll cero (`GameFlowOverlay`):** agrupar las pantallas de Título, Pausa, Victoria y Game Over bajo un único orquestador visual con `setScrollFactor(0)` y alta profundidad (`depth = 150`). Esto erradica colisiones de dibujo en niveles con scroll horizontal ($1440\text{ px}$) y asegura que el menú de pausa consulte directamente los datos vivos del héroe (salud, maná, coleccionables, armas).
  3. **Ponderación de logros en la pantalla de victoria:** formatear los datos de simulación al superar el nivel (enemigos abatidos, orbes acumulados, cofres saqueados y nivel de arma) en un rango marcial espartano (`GUERRERO ESPARTANO`, `DIOS DE LA GUERRA`), cerrando el bucle motivacional del jugador tras abatir a la Hidra.
- Dificultad o fallo observado: pausar el reloj global de Phaser congela los listeners de teclado internos y dificulta reanudar de forma limpia con `ESC`; mantener la simulación congelada a nivel de tick en `world.ts` mientras el framework sigue vivo en `ShellScene.ts` resuelve elegantemente el problema.
- Aprendizaje transferible: en arquitecturas deterministas a paso fijo, la pausa debe ser un estado explícito de la simulación que suprime el avance del tick físico, no un congelamiento del motor de presentación; esto permite que menús, introspección de estadísticas y animaciones de interfaz operen de forma fluida y reactiva.
- Cambio recomendado al proceso: al diseñar los efectos climáticos y ambientales del Egeo (`GOW8B-VFX-01`), sincronizar las partículas atmosféricas (lluvia, oleaje) con el estado de flujo para que congelen su velocidad durante la pausa.
- Evidencia o referencia: `docs/planes/GOW8B-UI-01.md`; `src/sim/world.ts`; `src/ui/GameFlowOverlay.ts`; `src/scene/ShellScene.ts`; `scripts/verification/capture-combat.mjs` (Caso Y: $t=8$ título activo, $t=12$ inicio, $t=18$ pausa activa, $t=20$ y $t=24$ tick congelado en 10, $t=27$ reanudación en 13, $t=38$ victoria con rango, $t=46$ reinicio, $t=50$ derrota, $t=58$ reaparición en checkpoint).

### GOW8B-VFX-01 — La distribución de partículas en planos sándwich y los topes de opacidad preservan el contraste en píxeles nítidos (2026-10-23)

- Resultado: aprobada tras auditoría independiente de solo lectura (4/4 criterios).
- Método que funcionó:
  1. **Estructura "sándwich" de profundidad atmosférica:** bifurcar la cortina de lluvia marina en dos capas de profundidad: el 50% de las gotas se ubica en un plano posterior (`depth = -1`, detrás de las entidades) aportando volumen ambiental sin interferir con los sprites, mientras que el restante 50% se ubica en el plano frontal (`depth = 40`) con un techo estricto de opacidad ($\le 0.38$). Esto recrea una tormenta oceánica envolvente sin provocar "ruido estático" sobre los cuerpos de Kratos o de los enemigos.
  2. **Generador pseudoaleatorio determinista con semilla:** emplear un generador PRNG determinista (`createDeterministicRandom(12345)`) para el posicionamiento y ciclo de vida de gotas y partículas. Esto garantiza que la simulación meteorológica sea reproducible tick a tick en las grabaciones CDP, impidiendo divergencias no deterministas en las pruebas de verificación.
  3. **Partículas de colisión de corta duración ($\le 8$ ticks):** estructurar las chispas ígneas de combate, las micro-salpicaduras en cubierta y el destello estelar de *Parry* con vidas útiles ultracortas (6 a 8 ticks) y dispersión radial rápida. Esto imprime contundencia kinética inmediata a los impactos de las cadenas sin dejar rastros residuales que ensucien el lienzo de 480×270.
- Dificultad o fallo observado: situar toda la lluvia en un único plano frontal con opacidades superiores a 0.6 fragmenta las siluetas de los personajes y dificulta la lectura del telegraph en baja resolución; dividir la densidad entre fondo y frente con tope de 0.38 elimina por completo la pérdida de contraste.
- Aprendizaje transferible: en videojuegos 2D con estética pixel art o resolución reducida, los fenómenos climáticos densos (lluvia, ventisca, polvo) deben distribuirse en planos intercalados (detrás y delante del plano de acción) con topes estrictos de transparencia para no comprometer la legibilidad del combate.
- Cambio recomendado al proceso: al diseñar el audio (`GOW8B-AUDIO-01`), atenuar contextualmente el sonido ambiental de la lluvia durante el inicio de combos pesados y rugidos para mantener el balance auditivo.
- Evidencia o referencia: `docs/planes/GOW8B-VFX-01.md`; `src/scene/VfxLayer.ts`; `src/scene/ShellScene.ts`; `scripts/verification/capture-combat.mjs` (Caso Z: $t=2$ lluvia activa 56 gotas, $t=6$ relámpago $alpha=0.15$, $t=11$ decaimiento $alpha=0$, $t=21$ chispas emitidas 6, $t=30$ desvanecimiento en 8 ticks, $t=34$ destello parry, $t=43$ y $t=46$ congelamiento en pausa, $t=50$ reanudación en playing).








