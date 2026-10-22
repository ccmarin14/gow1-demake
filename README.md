# Kratos · Tormenta del Egeo

> **Estado vigente (2026-10-16):** el código ejecutable es un shell de Phaser, TypeScript y Vite con un canvas lógico de **480×270**. Incluye una simulación determinista con un **jugador controlable con movimiento horizontal** (etapa 6, `GOW8B-MOVE-01`), un **harness DEV** (etapa 5, `GOW8B-DEV-01`), la **integración de assets** (fondo del Egeo y pose neutral de Kratos) mediante un manifest (etapa 6.5, `GOW8B-RES-01`), **salto y plataformas deterministas** (etapa 8, `GOW8B-JUMP-01`, arte de plataformas aún provisional), un **ataque ligero inicial** (etapa 9, `GOW8B-LIGHT-01`) y su **encadenamiento de combo** (etapa 10, `GOW8B-COMBO-01`). Todavía no hay enemigos con IA, daño, muerte ni audio. El **arte de animación definitivo** del jugador (idle/carrera/aire/ataque) se generó e **integró** en la etapa 10.5 `GOW8B-KRA-02` (2026-10-16, D-21); `PROVISIONAL_ART` es `false`. La etapa 10.5 quedó **aprobada** tras auditoría independiente de solo lectura (2026-10-16); la etapa 10 `GOW8B-COMBO-01` también quedó **aprobada** el 2026-10-16 tras auditoría independiente de solo lectura. Con esto, las etapas 1–10.5 están aprobadas y no hay etapa activa. El plan se re-baselinó a dos niveles (**bloques = aprueba la usuaria; etapas = audita un subagente**); ver `docs/verificacion.md`.

> **Actualización (2026-10-17):** con la autorización del usuario para iniciar el **Bloque 1**, se ejecutó la etapa **`GOW8B-SCALE-01`** (escala y silueta de referencia): `src/scale.ts` deriva las métricas de jugador, salto y alcance desde la física y el sprite vigentes; `CONFIG.scale` las expone; un overlay DEV (`G` para alternar) las dibuja dentro del canvas sin afectar a la simulación. Arte y tuning **sin cambios**; `PROVISIONAL_ART` sigue en `false`. Aprobada tras auditoría independiente de solo lectura (2026-10-17); no hay etapa activa.

> **Actualización (2026-10-17, continuación del Bloque 1 y Bloque 2):** se ejecutaron **`GOW8B-DJUMP-01`** (doble salto: segundo impulso aéreo por flanco nuevo, `CONFIG.player.vertical.maxJumps = 2`, reposición al aterrizar), **`GOW8B-ROLL-01`** (rodada con i-frames, tecla `SHIFT`) y **`GOW8B-CHAOS-01`** (Cuchillas del Caos: identidad del arma, cadenas y **arcos de golpe** en lugar del modelo de caja por golpe). **Las tres quedaron aprobadas** tras auditoría independiente de solo lectura. En `GOW8B-ROLL-01` la verificación propia del orquestador encontró el hallazgo bloqueante **H-ROLL-1** (los i-frames duraban 29 ticks / 483 ms en vez de 15 / 250 ms y **sobrevivían a la rodada**, porque `stepRoll` no descontaba `invulTicks` mientras rodaba); la etapa se **reabrió**, se corrigió pasando por la **compuerta de plan** y un **auditor distinto** la re-auditó: efecto neto **29 → 14 ticks**. Con esto el **Bloque 1** (`SCALE-01`, `DJUMP-01`, `ROLL-01`) y la primera etapa del **Bloque 2** (`CHAOS-01`) están aprobados; ver `docs/verificacion.md`.

> **Actualización (2026-10-18/19, `GOW8B-ROLL-ART`):** se dio a la rodada **arte propio** (`kratos-roll.png`, 4 cuadros generados por `scripts/gen-kratos-anim.py`) y se ató su duración a las constantes de ticks (`ROLL_TICKS`/`ROLL_INVUL_TICKS`), eliminando la escalera de `Math.round`. La auditoría independiente posterior detectó un **segundo defecto real** —el **deslizamiento posterior a la rodada**: el jugador seguía moviéndose al cerrar, sin i-frames ni animación, y mantener la dirección lo **frenaba** en vez de dejarlo correr— corregido en `a136cb7` (`vx = 0` al cerrar, la rodada **devuelve el control**). Verificado con **checksum idéntico** en headless y navegador (`94f6eb68`). Tras la corrección se **relanzó la auditoría completa** y quedó **APROBADA CON OBSERVACIONES** (sin hallazgos bloqueantes). En `GOW8B-ROLL-CLEANUP` se eliminaron las constantes de duración muertas de `config.ts` (había tres copias, dos sin consumidores) y se corrigió la documentación desactualizada; **la simulación no cambió** (mismo checksum). Queda **pendiente la validación humana** con teclado físico (lectura visual de la voltereta) y el arte fino de la rodada, diferido al **Bloque 11**.

## Visión futura

El objetivo es una adaptación web de acción lateral horizontal con resolución interna de 480×270 cuya **historia, lore, enemigos y repertorio completo de armas y ataques provienen del primer *God of War* (2005, PlayStation 2)** (D-03, D-24). *God of War: Betrayal* se utiliza únicamente como referencia visual y espacial de cámara lateral 2D (D-20). Los ataques iniciales de las Cuchillas del Caos (Nivel 1 de PS2) se traducen al plano 2D con equivalencia directa de botones (`J` = Cuadrado $\square$, `K` = Triángulo $\triangle$, `L` = Círculo $\bigcirc$, `Espacio` = Equis $\times$) e impacto físico de las cadenas contra el suelo (`yTop`) y contra los enemigos. El canvas se escala para ocupar una ventana amplia del navegador con pixelado nítido y sin suavizado; la resolución interna no limita su tamaño CSS. Se crean recursos 100 % originales; las referencias externas se consultan solo como material de estudio y no se integran como assets.

Las aprobaciones del prototipo previo se conservan como historial y no verifican el shell actual ni la adaptación en curso.

## Ejecutar el shell

Requisitos: Node.js 22 o posterior y pnpm.

```sh
pnpm install
pnpm dev
```

Abre la URL local indicada por Vite; normalmente es `http://localhost:5173/`.

| Comando | Uso |
| --- | --- |
| `pnpm dev` | Sirve el shell local con recarga. |
| `pnpm exec tsc --noEmit` | Comprueba tipos sin generar archivos. |
| `pnpm build` | Comprueba TypeScript y genera el paquete del shell en `dist/`. |
| `pnpm preview` | Sirve localmente el paquete generado. |

No hay un script automatizado `test` configurado. El plan y el método de comprobación están en [`docs/verificacion.md`](docs/verificacion.md).

## Controles

El shell implementa actualmente movimiento horizontal, salto, **doble salto** (`Espacio` = Equis $\times$), **ataque ligero con combo** (`J` = Cuadrado $\square$) y **rodada** (`Shift`). El mapa de combate completo traduce el mando de PlayStation 2 de *God of War* (2005) al teclado (D-08, D-24):
- `A` / `←` y `D` / `→`: moverse a izquierda y derecha.
- `Espacio` (**Equis $\times$**): saltar y **doble salto** aéreo con una segunda pulsación nueva en el aire (hasta `maxJumps = 2`; se repone al aterrizar).
- `J` (**Cuadrado $\square$**): ataque ligero rápido encadenado con las Cuchillas del Caos (`maxChain = 3`).
- `K` (**Triángulo $\triangle$**, planificado en [`docs/planes/GOW1-COMBAT-2D-01.md`](docs/planes/GOW1-COMBAT-2D-01.md)): ataque pesado descendente, *Launcher* ascendente (*Ascension*) que lanza enemigos al aire, y remate ***Plume of Prometheus* (`J, J, K` = $\square, \square, \triangle$)** que azota las cadenas contra el suelo (`yTop`).
- `L` (**Círculo $\bigcirc$**, planificado en [`docs/planes/GOW1-COMBAT-2D-01.md`](docs/planes/GOW1-COMBAT-2D-01.md)): agarre con cadena a distancia / derribo o remate contextual.
- `Shift`: rodada terrestre con i-frames (`GOW8B-ROLL-01` / `GOW8B-ART-POLISH-02`).
- `U` (L2): magia (Ira de Poseidón, Bloque 6).
- `E` (R2): acción contextual de entorno (cofres y palancas).
- `Escape`: pausa.

La animación se deriva del estado de simulación con prioridad **rodada > ataque > aire > carrera > reposo**: durante la rodada se reproduce `kratos-roll` sin rotación de contenedor; durante el ataque se muestra `kratos-attack` sincronizado con `WeaponLayer` (siempre dos Cuchillas del Caos visibles: una en la mano trasera y otra extendida en la cadena de 14 eslabones con estela continua); en el aire se reproduce `kratos-air`; al moverse en el suelo `kratos-run`; en reposo `kratos-idle`. El mapa completo está en [`docs/direccion-y-controles.md`](docs/direccion-y-controles.md). El jugador se dibuja anclado por la base (origen `0.5,1`).

## Harness DEV

En desarrollo (`pnpm dev`), el juego expone `window.__GOW8B` para inspección y reproducción controlada. No está disponible en el bundle de producción. Con la consola del navegador abierta:

```js
__GOW8B.scenarios()                 // ["empty","test","movement","platforms","combat"]
__GOW8B.loadScenario('movement')    // carga un escenario conocido (el jugador está en 'movement')
__GOW8B.loadScenario('platforms')   // suelo + dos plataformas a alturas distintas
__GOW8B.loadScenario('combat')      // jugador en el suelo + un objetivo ('dummy') al alcance
__GOW8B.snapshot()                  // { frame, timeMs, entities, input, checksum }
__GOW8B.step(30, ['move-right'])    // avanza 30 pasos fijos con acciones de dominio
__GOW8B.advance(16.67, [])          // avanza el tiempo con paso fijo (desacoplado del render)
__GOW8B.metrics()                   // fps, tiempo de frame, objetos y entidades activas
__GOW8B.record(); /* … */ __GOW8B.stop();   // graba una traza de entrada
__GOW8B.replay(traza)               // reproduce una traza (mismos checksums)
__GOW8B.getScaleReference()         // métricas de escala derivadas (jugador, salto, alcance)
__GOW8B.toggleScaleReference()      // muestra u oculta el overlay de referencia de escala
__GOW8B.isScaleReferenceVisible()   // estado actual del overlay
```

La simulación avanza en pasos fijos con un acumulador de microsegundos enteros, de modo que la misma traza produce el mismo estado por tick con independencia de la tasa de render.

La **referencia de escala** se dibuja sobre el canvas con `G` (solo en desarrollo): línea de pies, caja de silueta, envolventes de salto y bandas de alcance del combo. El overlay es puramente de presentación: alternarlo **no cambia** el checksum de la simulación.

## Escala y silueta de referencia (`GOW8B-SCALE-01`)

Primera etapa del **Bloque 1** del plan vigente. Fija la **referencia de escala** que condiciona el diseño del mapa, calculada desde la física y el sprite vigentes para que no haya cifras duplicadas a mano cuando se construyan las etapas de mapa y plataformas.

- `src/scale.ts` — cálculo **puro** (sin Phaser, sin reloj, sin azar): `deriveScaleReference`, `simulateJumpTicks`, `attackEnvelopeForChain`.
- `CONFIG.scale` en `src/config.ts` — las métricas ya derivadas; `CONFIG.player` y `CONFIG.scale` leen la **misma** fuente `PLAYER`.
- `src/dev/scaleOverlay.ts` — overlay de desarrollo (tecla `G`), excluido del bundle de producción.

| Referencia | Valor | De dónde sale |
| --- | --- | --- |
| Silueta | 97 × 59 px (20.2 % × 21.9 % del canvas) | dimensiones del sprite |
| Línea de pies | anclaje `anchorY = 1`; `y ∈ [59, 270]` | `sprite`, `jump.topY`, alto del canvas |
| Recorrido horizontal | 48.5 … 431.5 px (span 383) | `sprite.width / 2` |
| Salto ideal | 72.2 px · 0.76 s · 106.4 px | `jumpSpeed²/(2·gravity)`, `2·jumpSpeed/gravity`, `maxSpeed·t` |
| Salto por ticks | cumbre 69.056 px @ tick 22; 45 ticks (0.75 s) de aire | réplica exacta de `stepVertical` |
| Doble salto por ticks | cumbre 138.111 px (impulso en el tick 23); hasta 90 ticks (1.5 s) de aire | barrido del tick del impulso extra |
| Arcos de ataque | 3 cadenas: radio 32/36/40, ancho 16/16/18, grosor 14/14/16, con arranque y fin en grados | `CONFIG.player.attack.combo[].arc` |
| Alcance del combo | de 13.94 a 49 px, banda vertical real ~59.8 px (envolvente conservadora 71.71) | muestreo del arco desde el agarre (`gripOffsetY` 30) |
| Envolventes de mapa | `maxStepUp` 138.11 px · `maxGapWidth` 210 px (con doble salto) | valores por tick, conservadores |

**Verificación (2026-10-17).** Auditoría independiente de solo lectura: **APROBADA**. Las métricas se comprobaron por **prueba de mutación** (al cambiar `jumpSpeed` o el ancho del sprite, las derivadas cambian en consecuencia) y `simulateJumpTicks` replica el motor real (apex 69.056 @ tick 22, aire 45 t, alcance 105). Determinismo 8/8; el checksum con el overlay visible y oculto es **idéntico**; agentes y arte intactos por hash; `tsc --noEmit` y `build` exit 0; `__GOW8B` y los símbolos del overlay **ausentes** del bundle de producción. Arte y tuning: **sin cambios**. Detalle completo en `docs/verificacion.md` (§GOW8B-SCALE-01).

**Limitación:** la referencia es una guía geométrica para el mapa; no sustituye la prueba de juego con controles normales cuando lleguen las etapas de mapa.

## Doble salto (`GOW8B-DJUMP-01`)

Segunda etapa del **Bloque 1**. Añade un **segundo impulso aéreo** sin tocar la geometría del salto simple.

- `src/sim/vertical.ts` — el impulso aéreo se consume con **flanco nuevo** de la tecla de salto y solo si `jumpsUsed < maxJumps`; al quedar `grounded` el contador vuelve a 0. El salto dentro de la ventana de **coyote** cuenta como salto de suelo y **no** gasta el aéreo.
- `src/config.ts` — `CONFIG.player.vertical.maxJumps = 2` (el salto de suelo más uno aéreo).
- `src/sim/world.ts` — el salto sigue **bloqueado durante todo el combo**.
- `src/scale.ts` — `simulateJumpWithImpulses` / `simulateDoubleJumpTicks` derivan el alcance real de dos impulsos (`doubleTicks`), y `maxStepUp` / `maxGapWidth` del mapa pasan a reflejarlo.

| Caso (escenario `movement`, paso fijo a 60 Hz) | Altura alcanzada | Checksum |
| --- | --- | --- |
| Una pulsación, **mantenida** | 69.0556 px | `7c9dfa09` |
| Una pulsación simple | 69.0556 px | `7c9dfa09` |
| Segunda pulsación **en el aire** | **120.3889 px** | `07c7fa9f` |
| **Tercera** pulsación | 120.3889 px | `07c7fa9f` |

**Verificación (2026-10-17).** Auditoría independiente de solo lectura: **APROBADA**. Mantener la tecla da exactamente la misma altura y el mismo checksum que una pulsación simple; la tercera pulsación se rechaza (mismo checksum que la segunda); el ápice del salto simple sigue en **69.0556**, idéntico a la referencia de `SCALE-01`, luego **sin regresión**; determinismo estable (mismo plan ×3 → mismo checksum); `tsc --noEmit` y `build` exit 0; `__GOW8B` ausente; sin dependencias nuevas; arte intacto. Detalle completo en `docs/verificacion.md` (§GOW8B-DJUMP-01).

**Limitación:** el barrido de `simulateDoubleJumpTicks` modela **un** impulso extra (coherente con `maxJumps = 2`); con `maxJumps ≥ 3` habría que generalizarlo.

## Rodada con i-frames (`GOW8B-ROLL-01`)

Tercera etapa del **Bloque 1**. Absorbe la antigua «esquiva»: una **rodada terrestre** con invulnerabilidad temporal.

- `src/sim/roll.ts` — `startRoll` exige estar en el suelo y `rollPhase === 'none'`; `stepRoll` descuenta la invulnerabilidad **una vez por tick, en toda fase**, avanza la rodada, y al cerrarla pone `vx = 0` para **devolver el control** (ver «deslizamiento» abajo).
- `src/config.ts` — `ROLL_TICKS = 15` / `ROLL_INVUL_TICKS = 15` son la **fuente de verdad única** de la duración de la rodada; `CONFIG.player.dodge.rollSpeed = 280` es la del impulso. (Antes había **tres** copias de la duración, dos de ellas muertas; se eliminaron en `GOW8B-ROLL-CLEANUP`.)
- `src/sim/types.ts` — `rollPhase`, `rollTicks`, `invulTicks`.

**Comportamiento:** la rodada es terrestre (no se inicia en el aire), mantener la tecla da **una sola** rodada (hace falta soltar y volver a pulsar), dura **14 ticks observados (233 ms)**, desplaza **65.33 px** y bloquea el inicio de ataque durante su duración. Los **i-frames cubren exactamente la rodada** (14 ticks) y **no la sobreviven**. La animación es `kratos-roll` (4 cuadros, arte **provisional**).

**Un hallazgo bloqueante que se corrigió, y vale la pena contarlo.** La primera implementación hacía durar los i-frames **29 ticks (483 ms)** —el doble de los 250 ms configurados— y **sobrevivían a la animación**: 250 ms de invulnerabilidad gratis con la rodada ya terminada. Causa raíz: `stepRoll` incrementaba `rollTicks` en la fase activa pero **nunca decrementaba `invulTicks`**, y había un `if` **vacío**; el contador recién bajaba al terminar la rodada. Se corrigió pasando el descuento a la cabecera de `stepRoll`. Efecto neto: **29 → 14 ticks**, sin sobrevivir a la rodada.

**Segundo defecto, más sutil: el deslizamiento posterior a la rodada.** Al cerrar, el jugador **seguía moviéndose** sin rodada, sin i-frames y sin animación (patinaba en reposo/carrera), porque `stepRoll` corre **antes** que `stepHorizontal` y el `vx = ±280` heredado sobrevivía al cierre; peor aún, mantener la dirección apretada **frenaba** al jugador en vez de dejarlo correr. **Corrección:** `vx = 0` en el mismo tick del cierre. La rodada devuelve el control: desplazamiento exacto de **65.33 px**, y si el jugador mantiene la dirección **acelera desde cero**.

**Verificación (2026-10-17, `GOW8B-ROLL-01`).** Auditoría independiente de solo lectura: **APROBADA** (9/9 puntos, sin hallazgos bloqueantes), tras corregir el defecto con la **compuerta de plan** del proceso y re-auditarlo con **un auditor distinto** del implementador. Se comprobó por identidad de trazas, **ignorando el campo `invulTicks`**, que todo lo demás queda **byte-idéntico**: movimiento y límites, salto simple (69.0556), salto mantenido (no encadena), doble salto (120.3889), tercera pulsación rechazada y combo ligero. También con **navegador y tecla real** (puerto propio, sin tocar tus servidores): la rodada no se reinicia manteniendo `SHIFT` y no se inicia en el aire. `tsc`/`build` exit 0, `__GOW8B` ausente, sin dependencias nuevas, arte intacto. Detalle completo en `docs/verificacion.md` (§GOW8B-ROLL-01).

**Verificación de la etapa de arte y del deslizamiento (2026-10-18/19, `GOW8B-ROLL-ART`, auditoría independiente):** **APROBADA CON OBSERVACIONES**, sin hallazgos bloqueantes. El deslizamiento se corrigió en `a136cb7` y se verificó con **checksum idéntico** en headless y navegador (`94f6eb68`): el tick de cierre **no mueve `x`** y con la dirección apretada el `vx` **crece** (17.5 → 35 → 52.5 → 70). Observaciones no bloqueantes registradas: **edge case** de una pulsación de `dodge` en el tick exacto de cierre (se traga el flanco; el arreglo exigiría reordenar `World.step()` y el fallo es inobservable en la práctica — se documenta, no se corrige) y la limpieza de constantes muertas de `config.ts` (`GOW8B-ROLL-CLEANUP`). Detalle en `docs/verificacion.md` (§GOW8B-ROLL-ART).

**Observaciones no bloqueantes (para el Bloque 4):** la cobertura exacta depende de que `invulMs == durationMs` (hoy 250/250); con `invulMs < durationMs` la rodada terminaría sin i-frames, y como `startRoll` usa `max(invulTicks, ROLL_INVUL_TICKS)`, si el daño del Bloque 4 aporta i-frames más largos podrían sobrevivir a la rodada. Es una decisión de diseño del Bloque 4, no un defecto abierto.

**Validación humana pendiente (no bloqueante):** la lectura visual de la voltereta (que se lea como tal y no como *dash*) requiere el teclado físico; el arte de la rodada es provisional y su versión final es del Bloque 11.

**Limitación:** la sensación a 60 fps en tiempo real no se pudo evaluar (el entorno limitaba `requestAnimationFrame` a ~1 fps); sí se verificó por tick de simulación y con tecla real.

## Cuchillas del Caos (`GOW8B-CHAOS-01`)

Primera etapa del **Bloque 2**. Da identidad al arma y cambia el modelo de golpe: el ataque deja de ser una **caja pegada al cuerpo** y pasa a ser un **arco barrido** por la cadena alrededor del agarre.

- `src/config.ts` — `PLAYER.weapon = { id: 'blades-of-chaos', name: 'Cuchillas del Caos', gripOffsetY: 30 }` y un `arc` por golpe del combo (ángulos en grados, radio, ancho y grosor de hoja).
- `src/sim/attack.ts` — `computeAttackHitbox` muestrea el arco dentro de la fase `active`; el flujo de `stepAttack` no cambia.
- `src/sim/world.ts` — mapea `CONFIG` a `AttackParams` y convierte grados a radianes en un solo punto.
- `src/scale.ts` — `sweptArcEnvelope` deriva `nearX` / `farX` / `topY` / `bottomY` por cadena; `Array.prototype.map` sobre el combo, sin literales.

| Cadena | Alcance horizontal | Banda vertical |
| --- | --- | --- |
| 0 | 21.00 … 40 px | −50.5 … −17.4 |
| 1 | 19.58 … 44 px | −60.1 … −13.7 |
| 2 | 13.94 … 49 px | −70.8 … +0.9 |
| Combo | `maxReach` 49 · `minReach` 13.94 | `bandHeight` 71.71 (span real ~59.8) |

**Verificación (2026-10-17).** Auditoría independiente de solo lectura: **APROBADA sin hallazgos bloqueantes**, pese a que cambió el modelo de golpe. Contacto único por objetivo con `attackHits` reiniciado por golpe; hitbox solo en fase `active`; encadenado por flanco; salto bloqueado durante todo el combo; la rodada bloquea el inicio de ataque; respuesta 5/3/3 ticks; límites `48.5`/`431.5` y ápice intactos; **prueba de mutación** que demuestra que el arco no está en la ruta de movimiento (trazas de movimiento/salto/doble salto/rodada idénticas byte a byte); envolvente derivada y verificada en ejecución; determinismo; `tsc`/`build` exit 0; sin dependencias nuevas; arte intacto por SHA-256. Detalle completo en `docs/verificacion.md` (§GOW8B-CHAOS-01).

**Observaciones no bloqueantes:** (a) **pérdida de contacto a muy corta distancia** — a 7 px o menos ya no golpea ninguna cadena (`minReach` subió de 6 a 13.94); no rompe `GOW8B-LIGHT-01`, cuya evidencia se tomó a 40 px y sigue contactando, pero cambia la sensación en cuerpo a cuerpo; (b) **la envolvente vertical creció de 16 a 71.71 px**: el arco llega hasta ~65.7 px sobre la línea de pies con un jugador de 59 px, o sea por encima de la cabeza; (c) los criterios de aceptación de la etapa **no estaban escritos en el repositorio antes de implementar**, y se formalizaron al cierre.

## Movimiento horizontal (etapa 6)

El escenario `movement` contiene al jugador (`id: "player"`) con `x`, `vx` y `facing`. Cada tick fijo aplica una función pura de movimiento con aceleración, frenado y límites del mundo; todos los parámetros viven en `CONFIG.player`:

| Parámetro | Valor | Unidad |
| --- | --- | --- |
| `maxSpeed` | 140 | px/s |
| `accel` | 1050 | px/s² |
| `brake` | 1650 | px/s² |
| `minX` | 48.5 | px |
| `maxX` | 431.5 | px |

Valores provisionales: la velocidad arranca en 140 px/s (rango recomendado 136–150), la aceleración en 1050 px/s² (rango 900–1200) y el frenado en 1650 px/s² (rango 1500–1800, siempre mayor que la aceleración). Se revisarán al integrar arte y niveles.

Los límites `minX`/`maxX` se derivan del ancho del sprite de Kratos (97 px, mitad 48.5): en ambos extremos el sprite queda **totalmente visible** dentro del canvas de 480 px. En el escenario `movement` el jugador aparece con centro `x = 240` y apoyo de pies `y = 262`, sobre la cubierta.

## Assets integrados (etapa 6.5)

Los assets aprobados de etapas 2 y 3 se sirven bajo `public/assets/` y se precargan a través del manifest [`src/assets/manifest.ts`](src/assets/manifest.ts), que agrupa **claves estables por dominio** (`characters`, `environment`, `ui`, `fx`, `audio`, `data`). La escena no usa rutas de archivo dispersas: recorre el manifest y carga cada entrada.

| Dominio | Clave | Archivo | Dimensiones |
| --- | --- | --- | --- |
| `environment` | `egeo-fondo` | `public/assets/environment/egeo-fondo.png` | 480×270 |
| `characters` | `kratos-neutral` | `public/assets/characters/kratos-neutral.png` | 97×59 |
| `characters` | `kratos-idle` | `public/assets/characters/kratos-idle.png` | 194×59 (2 cuadros × 97×59) |
| `characters` | `kratos-run` | `public/assets/characters/kratos-run.png` | 582×59 (6 cuadros × 97×59) |
| `characters` | `kratos-air` | `public/assets/characters/kratos-air.png` | 194×59 (2 cuadros × 97×59) |
| `characters` | `kratos-attack` | `public/assets/characters/kratos-attack.png` | 291×59 (3 cuadros × 97×59) |

El fondo se dibuja en `(0,0)` a escala 1, con origen `(0,0)`, nearest-neighbor (por `pixelArt: true`) y **sin tinte**. El jugador se ancla con origen `(0.5, 1)` (base-centro) y se voltea horizontalmente cuando `facing = -1`.

### Procedimiento de copia y recorte (reproducible)

El fondo es una **copia byte a byte** del asset aprobado:

```sh
cp docs/referencias/egeo-fondo-480x270.png public/assets/environment/egeo-fondo.png
```

La pose neutral se obtiene **recortando** los bounds alfa `(192,204)–(288,262)` (97×59) con Pillow 10.2.0, preservando el modo indexado `P` y su tabla de transparencia:

```sh
python3 -c "from PIL import Image; Image.open('docs/referencias/kratos-neutral-480x270.png').crop((192,204,289,263)).save('public/assets/characters/kratos-neutral.png')"
```

Los PNG fuente en `docs/referencias/` quedan intactos (verificado por SHA-256). No se copian recursos de terceros.

### Limitaciones de esta etapa

- Sin combate, enemigos, daño, esquiva ni audio.
- `light-attack`, `heavy-attack`, `dodge` y `context-action` están mapeados pero no tienen efecto.
- Las plataformas se dibujan de forma provisional (rectángulos sólidos, ver etapa 8); no hay arte definitivo de entorno transitable.
- Los assets son provisionales y no están etiquetados como finales.

## Arte de animación definitivo (etapa 10.5)

> **Integrada el 2026-10-16; pendiente de auditoría independiente.** Reemplaza el placeholder de carrera (etapa 7), la pose aérea (etapa 8) y la ausencia de poses de ataque. Es **arte original** generado con un script reproducible (D-04, D-21); `PROVISIONAL_ART` es `false` en [`src/assets/manifest.ts`](src/assets/manifest.ts). **No** cambia la simulación, el movimiento, el salto ni las hitboxes.

- **Hojas y claves** (dominio `characters`, cuadros 97×59, pies anclados, origen `0.5,1`): `kratos-idle` (2 cuadros), `kratos-run` (6, con espejado), `kratos-air` (2), `kratos-attack` (3).
- **Selección de pose** (solo presentación, derivada del estado): **ataque > aire > carrera > reposo**. Ataque ligado a `attackPhase` (`startup`→cuadro 0, `active`→1, `recovery`→2); aire = `kratos-air`; reposo↔carrera ligado a `|vx|` (etapa 7). `CONFIG.player.run.frames = 6` (desajuste 6-vs-4 **resuelto**).
- **Hashes SHA-256 (2026-10-16):** `kratos-idle.png` = `48b02b96a8efb52d0d6c0f4acec2f6886bedd81d22eeba09921fa4ee779635de`; `kratos-run.png` = `27ec7d858bf82a0eb31deabe8405cb541ecb193512f15a747c4c44441aa932bc`; `kratos-air.png` = `5deed24a5382d9e6ec61059d2b419548219c9544945741de32823a3abee1b1d0`; `kratos-attack.png` = `22bbd179710c8c66809e63653489bc5cc8a8966def183a9c8cae28c464c1c276`. `kratos-neutral.png` (`df52a7fc…`) y `egeo-fondo.png` (`8f8b5885…`) siguen **intactos**.

### Procedimiento de generación (reproducible)

```sh
python3 scripts/gen-kratos-anim.py   # -> public/assets/characters/kratos-{idle,run,air,attack}.png
```

El script (Pillow; sin dependencias nuevas en `package.json` del juego) dibuja un esqueleto de perfil con **segmentos de píxeles enteros** (sin curvas ni tapas redondas), contorno duro de 1 px y sombreado por capas (lejano/`SHADOW`, torso, cercano/`HI`). Lee `kratos-neutral.png` y valida que su paleta coincide con los **6 colores** esperados; ningún píxel opaco queda fuera de esa paleta. Cada cuadro se traduce para anclar la fila de pies al borde inferior (`y=58`).

### Evidencia

- **Hoja de contacto:** [`docs/referencias/kratos-anim-contact-sheet.png`](docs/referencias/kratos-anim-contact-sheet.png) (neutral + las 4 hojas, ×4 nearest).
- **Navegador (controles sintéticos, DEV)**: `A`/`D`/`←`/`→`, `Espacio`, `J`. Siluetas distintas por estado medidas sobre el canvas (reposo/aire/carrera/ataque) y `attackPhase` observado en `startup`/`active`/`recovery`; sin errores de consola (solo el 404 de `favicon.ico`, permitido).
- **Determinismo**: 500 ms a 60/30/irregular → mismo frame (30) y mismo checksum; `replay` idéntico; límites de movimiento 48.5/431.5 intactos.
- **Verificador visual local (D-21, `moondream`/CPU)**: describió `kratos-idle` como «persona», `kratos-run` como «persona corriendo en una línea»; fue **intermitente** (errores HTTP 500 y salidas incoherentes en `air`/`attack`). Se declara su **límite perceptivo**: sirve de filtro grueso, no de juicio de estilo. La revisión visual humana de la hoja de contacto sigue siendo una **deuda no bloqueante**.

**Entorno de verificación visual (2026-10-16): preparado.** Herramientas de **desarrollo**, fuera del repo y sin dependencias nuevas en `package.json`: **Ollama + modelo `moondream`** (CPU) con el envoltorio `ollama-vision <imagen> ["prompt"]`, y la skill oficial `phaserjs/phaser@animations`. Detalle en §GOW8B-KRA-02 de [`docs/verificacion.md`](docs/verificacion.md).

## Salto y plataformas (etapa 8)

La simulación incluye física vertical determinista: gravedad, salto, caída, aterrizaje y colisión de un solo sentido contra plataformas. El estado del jugador gana `vy`, `grounded`, `coyoteTicks` y `jumpBufferTicks`; todo es serializable y determinista (sin `Math.random` ni reloj de render). Los parámetros viven en `CONFIG.player.vertical`:

| Parámetro | Valor | Unidad |
| --- | --- | --- |
| `gravity` | 1000 | px/s² |
| `jumpSpeed` | 380 | px/s |
| `maxFallSpeed` | 560 | px/s |
| `coyoteMs` | 80 | ms |
| `jumpBufferMs` | 100 | ms |
| `topY` | 59 | px |

El apex del salto es de ~69 px, dentro del objetivo de 60–70 px. La ventana de **coyote time** (80 ms) permite saltar poco después de caminar fuera de un borde; el **jump buffer** (100 ms) ejecuta el salto al tocar suelo si `ESPACIO` se pulsó poco antes de aterrizar. El salto es **edge-trigger**: mantener `ESPACIO` pulsado no vuelve a saltar al aterrizar (sin bunny-hop).

Las superficies de apoyo se definen por escenario como `Platform = { x1, x2, yTop }`. El escenario `platforms` (nuevo y **predeterminado** para mostrar la etapa con controles normales) añade un suelo a `y = 262` de lado a lado y **dos plataformas a alturas distintas**:

| Superficie | Tramo `x` | `yTop` |
| --- | --- | --- |
| Suelo | `0`–`480` | `262` |
| Nivel 1 | `280`–`370` | `210` |
| Nivel 2 | `140`–`250` | `158` |

El escenario `movement` conserva su comportamiento con un suelo a `y = 262`; `empty` y `test` no tienen plataformas. La colisión es de **un solo sentido**: el jugador aterriza sobre una plataforma solo al caer (`vy ≥ 0`) y dentro de `[x1, x2]`; puede atravesarla de abajo hacia arriba y cae al caminar más allá de un borde. Los límites laterales (`minX`/`maxX`) y el techo se aplican por *clamp*.

### Presentación de plataformas (provisional)

Los rectángulos de las plataformas se dibujan en la escena con `this.add.rectangle(...)`, color y grosor en `CONFIG.presentation` (`platformColor`, `platformEdgeColor`, `platformThickness`), **sin copiar recursos de terceros**. Es arte provisional y reemplazable.

### Verticalidad encadenada (D-20)

Por simulación determinista se alcanza la plataforma del nivel 1 desde el suelo y, desde ella, la del nivel 2: la secuencia `['move-right','jump']` seguida de `'move-right'` aterriza en el nivel 1 (`y = 210`); tras frenar y saltar con `['move-left','jump']`, aterriza en el nivel 2 (`y = 158`).

### Evidencia visual (salto y apoyo en plataforma)

Capturas nativas 480×270 recortadas del canvas lógico:

- [`docs/referencias/captura-salto-480x270.png`](docs/referencias/captura-salto-480x270.png): en el aire ascendiendo, sin ciclo de carrera.
- [`docs/referencias/captura-plataforma-480x270.png`](docs/referencias/captura-plataforma-480x270.png): apoyado sobre la plataforma del nivel 1.

### Limitaciones de esta etapa

- El arte de las plataformas y la pose aérea es **provisional**; una etapa de arte posterior lo reemplazará.
- La colisión usa el centro `x` del jugador para decidir si está sobre la plataforma (el sprite puede sobresalir visualmente medio cuerpo del borde).
- Sin enemigos con IA, daño, esquiva, efectos ni audio (el ataque ligero y su combo se añaden en las etapas 9–10, §Ataque ligero y combo).


## Ataque ligero y combo (etapas 9–10)

> **Arte provisional.** La retroalimentación del ataque (indicador de hitbox y marca de contacto) es **provisional**. La constante `PROVISIONAL_ART = true` en [`src/assets/manifest.ts`](src/assets/manifest.ts) gobierna el rótulo «Combo ligero · provisional» en pantalla.

El jugador gana un **estado de ataque determinista** con fases. Pulsar `J` con el jugador **en el suelo** y sin ataque en curso inicia el golpe (disparo *edge-trigger*: mantener `J` no lo reinicia ni lo repite). Mientras el combo está en curso, `jump` no inicia un salto nuevo; al volver a `none`, el salto vuelve a estar disponible. No se puede iniciar un ataque en el aire.

### Encadenamiento del combo

`EntityState` incorpora el índice del golpe (`attackChain`, 0-based) y el temporizador (`attackTicks`), actualizados en el paso fijo. **Una nueva pulsación de `J`** durante `active`/`recovery` del golpe en curso (y con `attackChain < maxChain - 1`) **cancela** el golpe actual y arranca el `startup` del siguiente (`attackChain + 1`, `attackTicks = 0`, `attackHits = []`). La fase `active` del golpe siguiente empieza **≤6 ticks** desde esa pulsación (los golpes encadenados usan un `startup` corto). **Mantener `J` no encadena**: cada golpe necesita un flanco nuevo. Si no hay pulsación en la ventana, al terminar `recovery` se vuelve a `none` y `attackChain = 0`. Tras el golpe de índice `maxChain - 1` una pulsación no encadena.

La estructura del combo vive centralizada en `CONFIG.player.attack` (`maxChain` + array `combo`); el módulo puro [`src/sim/attack.ts`](src/sim/attack.ts) (`stepAttack`, `computeAttackHitbox`, `attackParamsForChain`) la convierte a ticks. `maxChain` por defecto = **3**, con parámetros por golpe:

| Golpe (`combo[i]`) | `startupMs` (ticks) | `activeMs` (ticks) | `recoveryMs` (ticks) | `hitboxOffsetX` | `hitboxWidth` | `hitboxHeight` |
| --- | --- | --- | --- | --- | --- | --- |
| 0 | 83 (5) | 67 (4) | 117 (7) | 18 | 24 | 16 |
| 1 | 50 (3) | 67 (4) | 100 (6) | 20 | 26 | 16 |
| 2 | 50 (3) | 67 (4) | 117 (7) | 22 | 28 | 16 |

| Parámetro global | Valor | Unidad |
| --- | --- | --- |
| `maxChain` | 3 | golpes |
| `targetHalfWidth` | 14 | px (semi-ancho del objetivo) |
| `targetHalfHeight` | 24 | px (semi-alto del objetivo, anclado a los pies) |

Cada golpe usa su **ventana `active`** y su geometría: **fuera de `active` no hay hitbox** (`computeAttackHitbox` devuelve `null`). El módulo detecta **solapamiento** de la caja contra los objetivos del escenario (excluye al jugador). `attackHits` se **reinicia por golpe** y un objetivo puede recibir impacto de **varios golpes** del combo (una vez por golpe): los ids impactados se guardan en `EntityState.attackHits` (orden de registro). **Sin daño, retroceso ni muerte**: la entidad objetivo no cambia de estado.

El escenario `combat` contiene al jugador en el suelo (`x = 200`, `y = 262`) y una entidad objetivo (`id: "dummy"`, `x = 240`, `y = 262`) dentro del alcance. Los escenarios `empty`/`test`/`movement`/`platforms` se conservan.

### Presentación provisional (sin `jitter`)

- El `ShellScene` dibuja un **rectángulo indicador de hitbox** mientras la fase es `active`. Su color indica el índice del combo: `hitboxColor` (golpe 0), `hitboxColorChain1` (golpe 1) y `hitboxColorChain2` (golpe 2), todos con alfa `hitboxAlpha`.
- Las entidades objetivo se dibujan como **rectángulos provisionales** (`targetColor`); al registrarse el contacto se pintan con el color de contacto (`targetHitColor`), que sirve de **marca de contacto legible**.
- En el aire/plataformas se conserva el comportamiento de la etapa 8 (pose neutral sin ciclo de carrera). La animación `kratos-run` se sigue usando en el suelo.

### Evidencia visual

[`docs/referencias/captura-combo-480x270.png`](docs/referencias/captura-combo-480x270.png) muestra el frame `active` del **tercer golpe** (indicador de hitbox en color de cadena 2) con el objetivo tintado por el contacto. [`docs/referencias/captura-ataque-ligero-480x270.png`](docs/referencias/captura-ataque-ligero-480x270.png) conserva la evidencia del primer golpe de la etapa 9.

### Limitaciones de esta etapa

- Sin ataque pesado, esquiva, enemigos con IA, daño, muerte ni bloqueo; `heavy-attack`/`dodge`/`context-action` siguen sin efecto.
- El ataque no bloquea el movimiento horizontal ni cambia la pose del sprite del golpe.
- El indicador de hitbox y los objetivos son arte **provisional**.



## Documentación

- [`docs/pendientes-de-validacion-humana.md`](docs/pendientes-de-validacion-humana.md): **registro central** de las comprobaciones que solo la usuaria puede hacer con su teclado y su vista (el runtime de agentes no interpreta imágenes). **No bloqueante**: no detiene el avance.
- [`docs/arquitectura.md`](docs/arquitectura.md): límites actuales y arquitectura, **en parte ya implementada** (simulación, entrada, manifest, movimiento, plataformas y ataque/combo); las secciones «objetivo/futuro» siguen pendientes.
- [`docs/direccion-y-controles.md`](docs/direccion-y-controles.md): dirección del juego futuro y mapa de teclado propuesto.
- [`docs/adaptacion-narrativa-y-niveles.md`](docs/adaptacion-narrativa-y-niveles.md): adaptación lateral propuesta de la historia de *God of War* (2005).
- [`docs/guia-visual-betrayal-pixel-art-v2.md`](docs/guia-visual-betrayal-pixel-art-v2.md): criterio visual vigente para una etapa futura; no hay muestra activa.
- [`docs/guia-visual-betrayal-pixel-art.md`](docs/guia-visual-betrayal-pixel-art.md): guía anterior conservada como historial.
- [`docs/referencias/god-of-war-betrayal.md`](docs/referencias/god-of-war-betrayal.md): tablero de 18 imágenes y fuentes externas de estudio, no assets del juego.
- [`docs/decisiones.md`](docs/decisiones.md): decisiones vigentes y decisiones históricas descartadas.
- [`docs/verificacion.md`](docs/verificacion.md): estado actual, plan propuesto y registro histórico de verificaciones.
- [`docs/aprendizajes-del-proceso.md`](docs/aprendizajes-del-proceso.md): lecciones transferibles registradas durante el trabajo.
