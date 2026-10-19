# Arquitectura objetivo

## Estado ejecutable actual

El proyecto conserva el scaffold Phaser/TypeScript/Vite y un shell con canvas lógico de **480×270** (D-12), ya escalado a la ventana con pixelado nítido y sin suavizado. A 2026-10-16 hay implementados: **simulación determinista** con paso fijo y **harness DEV** `window.__GOW8B` (etapa 5), **gestor de entrada** teclado→acción de dominio, **manifest de assets** (etapa 6.5), **movimiento horizontal** (etapa 6), **salto y plataformas** (etapa 8), **animación idle↔run provisional** (etapa 7) y **ataque ligero con combo** (etapas 9–10). **No** hay enemigos con IA, daño, muerte, HUD de juego ni audio. Parte de la arquitectura de abajo **ya existe**; las secciones marcadas como «objetivo» o «futuro» describen el diseño aún no cubierto.

## Límites objetivo

La simulación será la fuente de verdad para entidades, movimiento, colisiones, temporizadores, combate, progresión y estado serializable. No dependerá de objetos Phaser. La capa Phaser traducirá el estado de simulación a sprites, cámara, animaciones y efectos descartables.

```text
acciones físicas → InputManager → acciones de dominio
                                      ↓
                           simulación determinista
                                      ↓ snapshot
                 escenas Phaser → sprites/cámara/FX
                                      ↓ eventos
                          audio y HUD DOM
```

- **Simulación fuera de escenas:** los sistemas de dominio actualizan estado y reglas. Evitar mutar reglas de juego directamente desde `Scene.update()`.
- **Escenas delgadas:** iniciar/preparar, presentar menús y conectar una escena de juego con la simulación. Las escenas coordinan entrada, paso de simulación y presentación; no poseen el estado autoritativo.
- **Entradas por acciones:** mapear teclas físicas en un único lugar a acciones explícitas como `move-left`, `move-right`, `jump`, `light-attack`, `heavy-attack`, `dodge`, `context-action` y `pause`. La simulación recibe acciones, no códigos de teclas.
- **Manifest de assets:** exponer claves estables y legibles por dominio (`characters`, `environment`, `ui`, `fx`, `audio`, `data`) en vez de propagar rutas de archivo por todo el juego. Crear recursos originales.
- **UI DOM cuando corresponda:** HUD textual, menús, pausa, configuración y contenido de accesibilidad van en capas DOM por defecto; canvas/WebGL conserva el campo de juego.
- **Estado serializable:** guardar valores de simulación y referencias estables, nunca sprites, tweens, cámaras ni emisores. Las animaciones y efectos se derivan del estado y eventos.
- **Cámara y presentación:** elegir el seguimiento, límites y escalado como responsabilidades de presentación, separadas de colisiones y reglas.

## Contrato DEV futuro

Al diseñar el harness de desarrollo, considerar una API controlada que sea explícita, sincronizada con el paso de simulación y fácil de retirar o deshabilitar en producción. **Está implementada desde la etapa 5** como `window.__GOW8B` (presente solo en DEV, ausente del bundle de producción). Esta sección se conserva como diseño de referencia y para ampliaciones futuras.

```ts
snapshot(): SimulationSnapshot
loadScenario(name: string): void
reset(): void
step(frames: number, actions?: GameAction[]): void
```

El contrato propuesto debe:

- devolver snapshots serializables con frame/tiempo y estado de entidades;
- permitir cargar escenarios controlados y reiniciar el mundo sin depender de inspección manual del renderer;
- aceptar acciones de dominio en pasos deterministas y sincronizar la captura después del paso indicado;
- exponer métricas de rendimiento —tiempo por frame y FPS— y conteos de objetos y efectos activos;
- separar estos controles de desarrollo de las entradas normales del jugador.

Las pruebas controladas ayudan a reproducir límites y estados, pero no sustituyen una partida con controles normales ni una evaluación de respuesta humana.

## Primer corte de módulos futuro

| Límite | Responsabilidad propuesta |
| --- | --- |
| Dominio/simulación | Modelos serializables y actualización determinista por acciones. |
| Entrada | Conversión única de teclado a acciones de dominio; táctil queda fuera de la primera entrega. |
| Presentación Phaser | Escenas delgadas, carga de assets por manifest, sprites, animaciones, cámara y FX. |
| UI DOM | Menús y HUD textual con estados accesibles. |
| Audio | Reproducir eventos definidos por dominio/presentación; el audio no determina impactos ni reglas. |
| DEV harness | Escenarios, snapshots, reset, pasos controlados y métricas; solo al implementar la etapa correspondiente. |

La separación puede evolucionar al conocerse el primer tramo, pero cualquier cambio debe conservar la simulación fuera del renderer y evitar una segunda fuente de verdad en los objetos de Phaser.
