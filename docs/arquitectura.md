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
| `src/sim/` | Estado autoritativo del mundo (`world.ts`), movimiento, salto y plataformas (`movement.ts`, `vertical.ts`, `roll.ts`), combate (`attack.ts`, `guard.ts`, `damage.ts`, `magic.ts`), IA (`legionnaire.ts`, `archer.ts`, `hydra.ts`), oleadas y arenas (`waves.ts`, `arena.ts`), cofres, orbes y checkpoints (`chests.ts`, `orbs.ts`, `checkpoint.ts`) y escenarios (`scenarios.ts`). |
| `src/input/InputManager.ts` | Conversión de eventos de teclado a acciones de dominio. |
| `src/assets/manifest.ts` | Claves de texturas y clips del jugador y del escenario. |
| `src/scene/ShellScene.ts` | Escena Phaser que conecta el bucle de simulación con los sprites, la cámara y las capas visuales. |
| `src/entities/WeaponLayer.ts` | Renderizado de las Cuchillas del Caos, eslabones de cadena y estelas. |
| `src/scene/VfxLayer.ts` | Lluvia marina, relámpagos y chispas de impacto. |
| `src/ui/` | `HudLayer.ts` (salud, maná, orbes y barra de jefe) y `GameFlowOverlay.ts` (título, pausa, victoria y derrota). |
| `src/audio/SoundManager.ts` | Efectos de sonido sintetizados con Web Audio API. |
| `src/dev/harness.ts` | API `window.__GOW8B` disponible en desarrollo (`snapshot`, `loadScenario`, `reset`, `step`, `advance`, `metrics`). |

## Reglas de separación

1. Ninguna regla de simulación depende de objetos Phaser; `src/sim/` opera sobre datos serializables.
2. Los parámetros de balance y geometría viven en `src/config.ts`.
3. Los PNG de personajes en `public/assets/characters/` se generan desde `grids/` con `scripts/ascii_to_png.py`.
