# God of War 8-bit (`gow-8b`)

Juego de acción lateral 2D en pixel art construido con **Phaser 3.90.0**, **TypeScript** y **Vite** (resolución lógica 480×270). Adapta el inicio del primer *God of War* (PS2) en el mar Egeo al plano lateral 2D inspirado en *God of War: Betrayal*.

El estado real del proyecto, lo que funciona y los problemas abiertos se mantienen en un único documento: **[`docs/estado.md`](docs/estado.md)**.

## Comandos

```bash
pnpm install
pnpm dev        # Servidor de desarrollo Vite
pnpm build      # Typecheck (tsc -b) + build de producción
pnpm test       # Pruebas de la simulación (runner nativo de Node 22)
pnpm art        # Valida los grids ASCII y regenera sus PNG
pnpm art:check  # Solo valida (los PNG deben coincidir con los grids)
pnpm preview    # Vista previa del build
```

Los sprites de Kratos se dibujan en `grids/kratos/*.txt` con `palette/kratos.json`; el método está en `docs/direccion.md` §5.

## Controles principales

- **Moverse:** `A` / `D` o `←` / `→`
- **Saltar / Doble salto:** `Espacio` (`Abajo + Espacio` para bajar de plataforma)
- **Ataque ligero / pesado:** `J` / `K`
- **Agarre:** `L`
- **Guardia / Parry:** `O`
- **Rodar:** `Shift`
- **Magia:** `U`
- **Interactuar (cofres):** `E`
- **Pausa / Silenciar audio:** `Escape` / `M`

## Estructura del repositorio

- `src/` — Simulación determinista (`src/sim/`), escena Phaser (`src/scene/`), capas de armas/UI/audio y configuración (`src/config.ts`).
- `grids/` y `palette/` — Fuente de verdad en texto ASCII y paleta para los sprites de personajes.
- `public/assets/` — Texturas cargadas por el juego.
- `scripts/` — Herramientas de arte: rasterizado y validación (`ascii_to_png.py`, `check_grid.py`), puntos de referencia (`check_landmarks.py`), vista previa (`preview_grid.py`), referencia cuantizada (`quantize_reference.py`) y el hook de pruebas (`scripts/test/`).
- `tests/` — Pruebas de la simulación (`pnpm test`).
- `docs/` — Documentación vigente:
  - [`docs/estado.md`](docs/estado.md) — Estado actual, problemas abiertos y registro de pasos.
  - [`docs/direccion.md`](docs/direccion.md) — Dirección creativa, controles y guía visual.
  - [`docs/decisiones.md`](docs/decisiones.md) — Decisiones vigentes.
  - [`docs/arquitectura.md`](docs/arquitectura.md) — Mapa de módulos y flujo de datos.
  - `docs/referencias/` — Estudio visual de *God of War: Betrayal*.
- El material histórico retirado (planes, scripts y arte descartados) ya no está en el árbol; queda en el historial de git, por ejemplo `git show c2e8729:archivo/`.
