# Brief: animar al legionario en el juego (BL-21), para Antigravity

Brief temporal (AGENTS.md, paso 5): se borra en el commit que cierra BL-21.
Antes de empezar lee `AGENTS.md`, `docs/estado.md` §1 a §3 y `docs/direccion.md` §7.

## Reparto

- **Los cuadros los dibuja y aprueba otro lado** (borrador 3D D-34, aprobación visual de la usuaria). No generes ni edites nada en `grids/`.
- **Tu parte es el código:** mostrar esos cuadros en el juego según el estado de la IA, y el segundo ataque parable.

## Cuadros disponibles (`grids/legionnaire/`, 64×56, pies en la fila 55)

| Estado de la IA (`aiState`) | Cuadros | Ticks | Notas |
| --- | --- | --- | --- |
| `idle`, `guard` | `idle-00` | — | Reposo; también la guardia. |
| `approach` | `walk-00..07` | — | Ciclo en bucle, seguir `vx`. |
| `windup` | `windup-00..03` | 24 | El último se sostiene hasta el tajo. |
| `slash` | `slash-00..03` | 8 | |
| `recover` | `recover-00..02` | 16 | |
| `hitstun` | `hitstun-00..01` | 12 (32 si lo para un *Parry*) | Aprobados. |
| `juggle` | `juggle-00..01` | mientras esté en el aire | Subiendo y cayendo (según `vy`). `grounded: false`. |
| `death` | `death-00..02` | ~40 | El último se sostiene. |

`grids/legionnaire/manifest.json` es la lista real de lo aprobado; trabaja solo con lo que aparezca ahí.

## Qué hacer

1. **`EnemyView`** en `src/scene/` (hoy `ShellScene.ts` ~l.431-464 pinta rectángulos de color con `CONFIG.presentation.enemyPlaceholder`): un sprite por legionario que elige textura por `aiState`, con la animación de la tabla. Mantén el rectángulo para el arquero y la hidra.
2. Registra las texturas en `src/assets/manifest.ts` (mira cómo están las de Kratos, `kratos-idle-00`…); no dispersar `this.load`.
3. Orientación por `facing`, sombra de contacto como la de Kratos, telégrafo del aviso ya está en los cuadros (ojos llameantes), no añadas parpadeos de color encima.
4. La simulación (`src/sim/`) no debe saber nada de Phaser ni de los cuadros: el estado sigue mandando, la vista solo lo lee.
5. **Segundo ataque que solo se puede parar** (ESE-04), solo después de lo anterior y si los cuadros aprobados alcanzan; si no, déjalo anotado en `docs/estado.md` con lo que falta.

## Reglas

- Una unidad chica y revisable por commit, conventional commits, sin atribución de IA; una línea por paso en `docs/estado.md`.
- Cada paso deja `pnpm test`, `pnpm build`, `pnpm art:check` en verde y `scripts/verify/browser-check.sh` con `errors 0 failed 0`. Verifica en navegador real: un build en verde no detecta texturas 404.
- Pruebas por regla (Node nativo, `tests/*.test.ts`): cada estado de la IA elige el cuadro esperado.
- No toques `grids/`, `palette/`, `scripts/pose_render/` ni `src/assets/kratos-anchors.json`.
- `src/config.ts` tiene cambios de otra sesión sin commitear (`hitCounter`); no los mezcles en tus commits.
