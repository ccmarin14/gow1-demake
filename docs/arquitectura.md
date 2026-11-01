# Arquitectura

El estado medido del proyecto y sus defectos abiertos están en [`estado.md`](estado.md).

## Flujo de datos

```text
Teclado → InputManager → Acciones de dominio
                                ↓
                  Simulación determinista (60 Hz)
                                ↓ snapshot
            ShellScene / WeaponLayer / VfxLayer (Phaser)
                                ↓
                  HudLayer y SoundManager (Web Audio)
```

## Módulos principales (`src/`)

| Ruta | Responsabilidad |
| --- | --- |
| `src/sim/` | Estado autoritativo del mundo (`world.ts`), movimiento, salto y plataformas (`movement.ts`, `vertical.ts`, `roll.ts`), combate (`guard.ts`, `damage.ts`, `magic.ts` y `strike.ts`: los golpes de Kratos como datos, D-37), IA (`legionnaire.ts`, `archer.ts`, `hydra.ts`), oleadas y arenas (`waves.ts`, `arena.ts`), cofres, orbes y checkpoints (`chests.ts`, `orbs.ts`, `checkpoint.ts`) y escenarios (`scenarios.ts`). |
| `src/input/InputManager.ts` | Conversión de eventos de teclado a acciones de dominio. |
| `src/assets/manifest.ts` | Claves de texturas y clips del jugador y del escenario. |
| `src/scene/ShellScene.ts` | Escena Phaser que conecta el bucle de simulación con los sprites, la cámara y las capas visuales. |
| `src/scene/PlayerView.ts` | Presentación del jugador: sprite de Kratos y selección de animación, sombra de contacto y capa de armas. Es el único punto que cambia al redibujar el personaje. |
| `src/sim/strike.ts` | Golpes de Kratos como datos (D-37): fases (pose, ticks, avance) y pista de la hoja (Catmull-Rom desde el hombro). Calcula el avance, la caja de golpe (segmento barrido por la hoja, engrosado) y aplica el daño con `damageEnemy` (`damage.ts`, compartido con la magia). Sus funciones de geometría son puras y las usa también la presentación. |
| `src/entities/WeaponLayer.ts` | Renderizado de las Espadas del Caos: colgadas a la espalda en reposo, ancladas a cada cuadro (`src/assets/kratos-anchors.json`), y durante un golpe la hoja cercana, la cadena, la estela de fuego, la hoja lejana y el destello, leídos de la pista de `strike.ts` (dibujo en píxeles sin antialias en `strikeArt.ts`). |
| `src/scene/VfxLayer.ts` | Lluvia marina, relámpagos y chispas de impacto. |
| `src/ui/` | `HudLayer.ts` (salud, maná, orbes y barra de jefe) y `GameFlowOverlay.ts` (título, pausa, victoria y derrota). |
| `src/audio/SoundManager.ts` | Efectos de sonido sintetizados con Web Audio API. |
| `src/dev/harness.ts` | API `window.__GOW8B` disponible en desarrollo (`snapshot`, `loadScenario`, `reset`, `step`, `advance`, `metrics`). |

## Reglas de separación

1. Ninguna regla de simulación depende de objetos Phaser; `src/sim/` opera sobre datos serializables. Por eso se prueba sin navegador: `pnpm test` corre `tests/*.test.ts` con el runner nativo de Node (`--experimental-transform-types` y el hook `scripts/test/`), sin dependencias nuevas.
2. Los parámetros de balance y geometría viven en `src/config.ts`.
3. Los PNG de personajes en `public/assets/characters/` se generan desde `grids/` con `scripts/ascii_to_png.py`.
