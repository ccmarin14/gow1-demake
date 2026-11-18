# God of War 8-bit (`gow-8b`)

Juego de acción lateral 2D en pixel art construido con **Phaser 3.90.0**, **TypeScript** y **Vite** (resolución lógica 480×270). Adapta el inicio del primer *God of War* (PS2) en el mar Egeo al plano lateral, con el encuadre y la lectura en pixel art de *God of War: Betrayal*: el repertorio de combate de nivel 1 (□, △, agarre con ○, guardia), los no muertos de la cubierta y una tormenta que no se calla.

El estado real, lo que falta revisar o decidir y lo que sigue están en **[`docs/estado.md`](docs/estado.md)**.

## Comandos

```bash
pnpm install
pnpm dev          # servidor de desarrollo Vite (también escucha en 0.0.0.0 para probar en el celular)
pnpm build        # typecheck (tsc -b) + build de producción
pnpm test         # pruebas de la simulación y de la presentación (runner nativo de Node 22)
pnpm art          # valida los grids ASCII y regenera sus PNG
pnpm art:check    # solo valida (los PNG deben coincidir con los grids)
pnpm audio:check  # renderiza los sonidos fuera de línea y comprueba su peso (graves, chasquido, cola, altavoz pequeño)
pnpm preview      # vista previa del build
```

Verificación completa de un cambio: `pnpm test`, `npx tsc --noEmit -p .`, `pnpm build`, `pnpm art:check` y `scripts/verify/browser-check.sh` (debe decir `errors 0 failed 0`).

## Controles

| Acción | Tecla |
| --- | --- |
| Moverse | `A` / `D` o `←` / `→` |
| Saltar / doble salto (`↓ + Espacio` baja de plataforma) | `Espacio` |
| Ataque ligero □ / pesado △ (también en el aire; mantener `I` lanza a los enemigos) | `J` / `I` |
| Agarre ○ (con el enemigo sujeto: `J` lanza, `I` lo parte, `K`/`L` otra vez golpea; en el aire, *Harpoon*) | `K` / `L` |
| Guardia / desvío | `Q` |
| Rodar | `Shift` |
| Magia | `U` |
| Interactuar (cofres) | `E` |
| Pausa / silenciar | `Escape` / `M` |

En el celular hay botones táctiles equivalentes (□, △, ○). El mapa completo y la especificación de cada mecánica están en [`docs/direccion.md`](docs/direccion.md).

## Estructura

- `src/` — simulación determinista a 60 Hz (`sim/`), escena y vistas de Phaser (`scene/`, `entities/`, `ui/`), audio procedural (`audio/`) y configuración (`config.ts`). Detalle en [`docs/arquitectura.md`](docs/arquitectura.md).
- `grids/` y `palette/` — la fuente de verdad del arte en texto ASCII y sus paletas; los PNG de `public/assets/` se generan de ahí.
- `scripts/` — rasterizado y validación del arte, el borrador 3D (`pose_render/`, necesita Blender) y la verificación (`verify/`: navegador, rendimiento, grabación del juego tick a tick, audio).
- `tests/` — pruebas con el runner de Node.
- `docs/` — [`estado.md`](docs/estado.md) (estado y pendientes), [`direccion.md`](docs/direccion.md) (dirección y especificación de las mecánicas), [`decisiones.md`](docs/decisiones.md), [`arquitectura.md`](docs/arquitectura.md), [`ideas.md`](docs/ideas.md) (ideas futuras, no activas), [`archivo/`](docs/archivo/README.md) (historial en texto) y `referencias/` (estudio visual de *Betrayal*).

La guía de trabajo para agentes (flujo, reglas de arte, reparto de modelos y lecciones) está en [`AGENTS.md`](AGENTS.md).
