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
