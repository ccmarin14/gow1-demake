# God of War 8-bit (`gow-8b`)

Juego de acción lateral 2D en pixel art construido con **Phaser 3.90.0**, **TypeScript** y **Vite** (resolución lógica 480×270). Adapta el inicio del primer *God of War* (PS2) en el mar Egeo al plano lateral 2D inspirado en *God of War: Betrayal*.

El estado real del proyecto, lo que funciona y los problemas abiertos se mantienen en un único documento: **[`docs/estado.md`](docs/estado.md)**.

## Comandos

```bash
pnpm install
pnpm dev      # Servidor de desarrollo Vite
pnpm build    # Typecheck (tsc -b) + build de producción
pnpm preview  # Vista previa del build
```

Para convertir un grid ASCII en su PNG correspondiente:

```bash
python3 scripts/ascii_to_png.py --grid grids/kratos/master.txt --palette palette/master.json --out public/assets/characters/kratos-neutral.png
```

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
- `scripts/ascii_to_png.py` — Rasterizador determinista de ASCII a PNG.
- `docs/` — Documentación vigente:
  - [`docs/estado.md`](docs/estado.md) — Estado actual, problemas abiertos y registro de pasos.
  - [`docs/direccion.md`](docs/direccion.md) — Dirección creativa, controles y guía visual.
  - [`docs/decisiones.md`](docs/decisiones.md) — Decisiones vigentes.
  - [`docs/arquitectura.md`](docs/arquitectura.md) — Mapa de módulos y flujo de datos.
  - `docs/referencias/` — Estudio visual de *God of War: Betrayal*.
- `archivo/` — Material histórico archivado (planes antiguos, scripts retirados y pruebas descartadas).
