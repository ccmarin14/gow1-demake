# Kratos · Tormenta del Egeo

> **Estado vigente (2026-10-15):** el código ejecutable es un shell de Phaser, TypeScript y Vite con un canvas lógico de 320×180. Incluye una simulación determinista mínima y un **harness DEV** (etapa 5, `GOW8B-DEV-01`); todavía no contiene gameplay, controles de juego activos, arte ni audio.

## Visión futura

El objetivo futuro es una adaptación web de acción lateral horizontal con resolución interna de 480×270 y la historia del primer *God of War* de PS2. Esta decisión busca más detalle visual con un esfuerzo de producción manejable. El canvas deberá escalarse para ocupar una ventana amplia del navegador con pixelado nítido y sin suavizado; la resolución interna no limita su tamaño CSS. La lectura, el ritmo y la estructura lateral toman *God of War: Betrayal* como estudio de referencia. Se crearán recursos originales; las referencias externas se consultan solo como material de estudio y no se integran como assets.

Esta visión aún no está implementada. Las aprobaciones del prototipo previo se conservan como historial y no verifican el shell actual ni la futura adaptación.

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

No hay un script automatizado `test` configurado. El plan y el método de comprobación futuros están en [`docs/verificacion.md`](docs/verificacion.md).

## Controles

El shell actual no implementa controles de juego. El mapa de teclado objetivo, aún propuesto, está en [`docs/direccion-y-controles.md`](docs/direccion-y-controles.md).

## Harness DEV

En desarrollo (`pnpm dev`), el juego expone `window.__GOW8B` para inspección y reproducción controlada. No está disponible en el bundle de producción. Con la consola del navegador abierta:

```js
__GOW8B.scenarios()                 // ["empty", "test"]
__GOW8B.loadScenario('test')        // carga un escenario conocido
__GOW8B.snapshot()                  // { frame, timeMs, entities, input, checksum }
__GOW8B.step(30, ['move-right'])    // avanza 30 pasos fijos con acciones de dominio
__GOW8B.advance(16.67, [])          // avanza el tiempo con paso fijo (desacoplado del render)
__GOW8B.metrics()                   // fps, tiempo de frame, objetos y entidades activas
__GOW8B.record(); /* … */ __GOW8B.stop();   // graba una traza de entrada
__GOW8B.replay(traza)               // reproduce una traza (mismos checksums)
```

La simulación avanza en pasos fijos con un acumulador de microsegundos enteros, de modo que la misma traza produce el mismo estado por tick con independencia de la tasa de render.

## Documentación

- [`docs/arquitectura.md`](docs/arquitectura.md): límites del shell actual y arquitectura objetivo, todavía no implementada.
- [`docs/direccion-y-controles.md`](docs/direccion-y-controles.md): dirección del juego futuro y mapa de teclado propuesto.
- [`docs/adaptacion-narrativa-y-niveles.md`](docs/adaptacion-narrativa-y-niveles.md): adaptación lateral propuesta de la historia de *God of War* (2005).
- [`docs/guia-visual-betrayal-pixel-art-v2.md`](docs/guia-visual-betrayal-pixel-art-v2.md): criterio visual vigente para una etapa futura; no hay muestra activa.
- [`docs/guia-visual-betrayal-pixel-art.md`](docs/guia-visual-betrayal-pixel-art.md): guía anterior conservada como historial.
- [`docs/referencias/god-of-war-betrayal.md`](docs/referencias/god-of-war-betrayal.md): tablero de 18 imágenes y fuentes externas de estudio, no assets del juego.
- [`docs/decisiones.md`](docs/decisiones.md): decisiones vigentes y decisiones históricas descartadas.
- [`docs/verificacion.md`](docs/verificacion.md): estado actual, plan propuesto y registro histórico de verificaciones.
- [`docs/aprendizajes-del-proceso.md`](docs/aprendizajes-del-proceso.md): lecciones transferibles registradas durante el trabajo.
