# Brief: cuadros que faltan del legionario (BL-21), para Antigravity

Brief temporal (AGENTS.md, paso 5): se borra en el commit que cierra BL-21.
Antes de empezar lee `AGENTS.md` (reglas de arte) y `docs/direccion.md` §7 (ficha de diseño, D-51).

## Qué falta

Hecho y aprobado por la usuaria (20 cuadros en `grids/legionnaire/`): `idle` 1, `walk` 8, `windup` 4, `slash` 4, `recover` 3.

Por hacer, en este orden. Un cuadro = una pose completa del cuerpo; nunca se parchea otro cuadro.

| Estado | Cuadros | Base 3D (acción del maniquí) | Qué debe leerse | Ticks en la IA |
| --- | --- | --- | --- | --- |
| `hitstun` | 2 | `Hit_Chest` (cuadros del impacto y del tope), `Hit_Head` si hace falta | Torso echado atrás, espada baja, ojos sin llama | 12 (golpe); 32 si lo para un *Parry* |
| `juggle` | 2 | `Hit_Chest` con la columna arqueada, o `Jump_Loop`: uno subiendo y otro cayendo | Cuerpo en el aire, brazos y espada flojos, sin pisar el suelo (`grounded: false`) | mientras esté en el aire |
| `death` | 5 | `Death01`, cuadros repartidos de principio a fin | Se desploma y queda tendido en el suelo; el último cuadro es el que se queda | ~40 en total, el último se sostiene |

No hay escudo (D-51). Si el texto de otro documento habla de "escudo arriba", está viejo.

## Herramienta

Un cuadro con un solo comando (necesita Blender en `~/.local/bin/blender`):

```bash
scripts/pose_render/legionnaire_frame.sh hitstun-00 Hit_Chest 6
scripts/pose_render/legionnaire_frame.sh hitstun-01 Hit_Chest 10 scripts/pose_render/poses/mi-pose.json
```

Deja `docs/tmp/legionario/draft/<nombre>.txt` (el grid, pies en la fila 55) y `<nombre>-preview.png` (ampliado 10×). No escribe en `grids/`.

- **Acciones disponibles** del maniquí: `Hit_Chest`, `Hit_Head`, `Death01`, `Jump_Loop`, `Jump_Start`, `Jump_Land`, `Sword_Attack`, `Sword_Idle`, `Idle_Loop`, `Walk_Loop`, entre otras. Para ver los cuadros de una acción, renderiza varios con `render.py` directamente: `blender -b --python scripts/pose_render/render.py -- scripts/pose_render/legionnaire.json <acción> <carpeta> 0,4,8,12` (`docs/tmp/legionario/` ya tiene ejemplos de lo hecho).
- **Poses a medida:** `scripts/pose_render/poses/leg-*.json` y el generador `legionnaire_poses.py` (rotaciones por hueso en grados y cinemática inversa para las manos; adelante es -Y, arriba +Z, -X mira a la cámara). Una pose nueva = un `.json` nuevo; no cambies las existentes (son las de los cuadros aprobados).
- **Config y paleta:** `scripts/pose_render/legionnaire.json` (materiales, accesorios, volúmenes) y `palette/legionnaire.json` (letras `o d b m s` piel, `t l` cuero, `e a k y` bronce, `r` ojo llameante). No toques el diseño del personaje; si un accesorio no se ve bien en una pose, cuéntalo en vez de retocar la config, porque la config también genera los cuadros aprobados.
- **No rompas a Kratos:** `render.py` y `to_grid.py` los comparten. Si los modificas, `python3 scripts/pose_render/build_anchors.py --jobs 2` debe seguir sin fallos y sin cambios en `grids/kratos` ni `src/assets`. Mejor no tocarlos.
- **Memoria:** Blender gasta mucha; no corras más de 2 trabajos a la vez.

## Reglas de arte que se aplican

- Lienzo 64×56, pies en la fila 55 en las poses de suelo. Solo letras de `palette/legionnaire.json` y `.`. En `death` el cuerpo tendido también debe apoyarse en la fila 55.
- El borrador 3D se termina a mano en el `.txt`: lo único que se ha añadido hasta ahora es el píxel de ojo `r` en los avisos. En `hitstun` y `death` los ojos se apagan (sin `r`).
- Prohibido componer un cuadro pegando partes de otro o desplazar bloques por script. Cada cuadro sale de su propio render.
- La espada mide lo mismo en pantalla en todas las poses.

## Cómo se entrega cada cuadro

1. Genera el borrador con el script y revisa la vista ampliada tú mismo: ¿se entiende la pose?, ¿la espada está completa?, ¿los pies o el cuerpo tendido tocan la fila 55?
2. Arma una comparación para la usuaria: el cuadro nuevo junto al `idle-00` aprobado, ampliados, en `docs/tmp/legionario/` (ver `scripts/preview_grid.py`, acepta varios grids).
3. **La usuaria aprueba cada cuadro.** Hasta que lo haga, el cuadro no entra a `grids/legionnaire/` ni se commitea. Espera su respuesta antes del siguiente (AGENTS.md §3).
4. Con la aprobación: copia el `.txt` a `grids/legionnaire/<estado>-0N.txt`, añade su entrada a `grids/legionnaire/manifest.json` (mismo formato que las existentes; `grounded: false` en `juggle`), corre `pnpm art` y `pnpm art:check`, añade una línea en `docs/estado.md` y haz **un commit por cuadro** (conventional commits, sin atribución de IA).

## Después de los cuadros (otra sesión, no es de este brief)

`EnemyView` que cambie de cuadro según `aiState` (`src/sim/legionnaire.ts`), registro de texturas en `src/assets/manifest.ts` (no dispersar `this.load`), y el segundo ataque que solo se puede parar (ESE-04). Antes de cerrar: `pnpm test`, `pnpm build`, `pnpm art:check` y `scripts/verify/browser-check.sh` (debe imprimir `errors 0 failed 0`).

## No hagas

- No edites `grids/kratos/`, `src/assets/kratos-anchors.json` ni los cuadros aprobados del legionario.
- No cambies el diseño (casco de bronce con cresta roja, torso gris grueso, paño en la cintura, espada curva de cobre, sin escudo).
- No avances por tu cuenta a `EnemyView` ni a la IA sin que la usuaria lo pida.
