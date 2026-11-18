# Arquitectura

El estado medido del proyecto y sus pendientes están en [`estado.md`](estado.md); la dirección creativa y la especificación de cada mecánica, en [`direccion.md`](direccion.md).

## Flujo de datos

```text
Teclado / botones táctiles → InputManager → acciones de dominio
                                   ↓
                     Simulación determinista (60 Hz, src/sim/)
                                   ↓ snapshot + avisos (impacto, golpe)
        ShellScene → PlayerView · EnemyView · WeaponLayer · VfxLayer · RipHalves · HudLayer
                                   ↓ eventos de sonido
                     SoundManager (Web Audio, src/audio/)
```

La simulación no sabe nada de Phaser ni del audio: dice **dónde está cada entidad y qué pasó en este tick**; la presentación decide **cómo se ve y suena**. Un efecto de presentación se dispara por **cambio de estado** (el flanco), nunca por igualdad de tick, porque la escena corre una vez por fotograma de pantalla y la simulación por tick.

## Módulos principales (`src/`)

| Ruta | Responsabilidad |
| --- | --- |
| `src/sim/` | Estado autoritativo (`world.ts`), movimiento, salto y plataformas (`movement.ts`, `vertical.ts`, `roll.ts`), combate (`guard.ts`, `damage.ts`, `magic.ts`; `strike.ts`: los golpes de □ y △ como datos, D-37; `grab.ts`: la máquina de estados del agarre de ○), IA (`legionnaire.ts`, `archer.ts`, `hydra.ts`), oleadas y arenas, cofres, orbes, checkpoints y escenarios. |
| `src/config.ts` | Todos los números de balance, tiempos y geometría (`CONFIG`). El bloque `player.grab` fija los tiempos del agarre, el hitstop y la sacudida de cada golpe de ○. |
| `src/input/` | Teclado y botones táctiles a acciones de dominio. |
| `src/assets/` | `manifest.ts` (claves de texturas), `kratos-anchors.json` y `legionnaire-anchors.json` (puntos del esqueleto 3D por cuadro: manos, cuello, espalda; los usan `WeaponLayer` y `grabPose`). |
| `src/scene/ShellScene.ts` | Conecta el bucle de simulación con vistas, cámara, efectos y sonido (los efectos por flanco con `crosses`). |
| `src/scene/PlayerView.ts`, `EnemyView.ts` | Eligen el cuadro de Kratos y del legionario y los colocan; sombra de contacto. |
| `src/scene/grabPose.ts` | Funciones puras que deciden qué cuadro y dónde dibujar a Kratos y a la víctima en el agarre, a partir de anclajes; las usan las vistas, los efectos y las pruebas de contacto. |
| `src/scene/RipHalves.ts` | Las dos mitades del desgarro (*Rip*): física simple, borde rojo y desvanecimiento. |
| `src/entities/WeaponLayer.ts` y `pixelBuffer.ts`, `pixelLayer.ts`, `strikeArt.ts`, `strikeWindow.ts` | Las Espadas del Caos: a la espalda, en la mano (puñaladas, *Toss*) y en los golpes (hoja, cadena, estela de fuego, destello), dibujadas en un búfer de píxeles por capa de profundidad. |
| `src/scene/VfxLayer.ts` | Lluvia, relámpagos, chispas, sangre y polvo. |
| `src/ui/` | `HudLayer.ts` (salud, maná, orbes, jefe) y `GameFlowOverlay.ts` (título, pausa, victoria, derrota). |
| `src/audio/` | `synth.ts` (kit: ruido filtrado, tonos, metal, cadena maestra con compresor, saturación y reverberación por convolución), `recipes.ts` (cada sonido como receta en capas), `ambience.ts` (tormenta de fondo), `SoundManager.ts` (reproducción y contadores). Mismo código en vivo y fuera de línea. |
| `src/dev/harness.ts` | `window.__GOW8B` en desarrollo (`snapshot`, `loadScenario`, `reset`, `step`, `advance`, `metrics`). |

## Reglas de separación

1. Ninguna regla de simulación depende de Phaser ni del audio; `src/sim/` opera sobre datos serializables y por eso se prueba sin navegador.
2. Los parámetros de balance, tiempos y geometría viven en `src/config.ts`; las pruebas leen las constantes, no copian números.
3. Los PNG de personajes en `public/assets/characters/` se generan desde `grids/` (`pnpm art`); nunca se editan a mano. Los grids parten del borrador 3D (D-34).
4. Un cuerpo girado o en picada es un cuadro propio (cámara girada en el render), nunca un sprite rotado en pantalla.

## Pruebas y verificación

`pnpm test` corre `tests/*.test.ts` con el runner nativo de Node (`--experimental-transform-types` y el hook de `scripts/test/`), sin dependencias. Cada regla tiene su prueba y, en lo nuevo, **se comprueba que la prueba falla al romper lo que cubre** (mutación). Para el combate con contacto entre dos cuerpos hay tres familias: `tests/grab.test.ts` (reglas de la simulación), `tests/grab-pose.test.ts` (contacto y continuidad entre ticks de lo que se dibuja) y `tests/grab-hitstop.test.ts` (peso de cada golpe y búfer de entrada). Las pruebas que cuentan ticks de la cadena corren sin hitstop (`tests/helpers/grab-hitstop.ts`).

## Herramientas (`scripts/`)

| Ruta | Para qué |
| --- | --- |
| `scripts/ascii_to_png.py`, `check_grid.py`, `preview_grid.py`, `quantize_reference.py` | De grid de texto a PNG, validación (`pnpm art`, `pnpm art:check`), vista previa ampliada y arranque desde una referencia. |
| `scripts/pose_render/` | El borrador 3D (D-34): `render.py` (Blender), `to_grid.py`, `frames.json` y `legionnaire-frames.json` (recetas), `build_anchors.py` (`--only` recalcula solo algunos en segundos), `build_legionnaire_anchors.py`, `measure_pose.py` (manos y cabeza de una pose sin tocar los grids), `poses/`. |
| `scripts/verify/` | Sin depender de ningún modelo: `browser-check.sh` (Vite + Chrome sin cabeza; debe decir `errors 0 failed 0`), `perf.mjs` (cuadros con la CPU frenada), `grab_rec.sh` + `grab_sheet.py` (graban el juego real tick a tick y arman tiras para compararlas con el video), `audio_render.sh` (renderiza los sonidos fuera de línea a WAV y los mide: `pnpm audio:check`), `capture.mjs`, `sheet.py`, `make_preview.py`. |
