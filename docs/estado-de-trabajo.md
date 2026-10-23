# Estado de trabajo (registro de hilos abiertos)

> **Para qué sirve:** un único lugar que dice qué hilos hay abiertos, en qué rama vive cada uno, qué sigue y qué lo bloquea. Se lee primero al retomar el proyecto. No sustituye a `docs/verificacion.md` (fuente de verdad de las etapas) ni a `docs/pendientes-de-validacion-humana.md` (comprobaciones que solo hace la usuaria).
>
> **Regla de uso:** al abrir, pausar, bloquear o cerrar un hilo, se actualiza este archivo **en el mismo commit** que el cambio. Un hilo sin fila aquí se considera olvidado. Los resultados de cada etapa siguen en su plan (`docs/planes/`) y las lecciones en `docs/aprendizajes-del-proceso.md`.

Última actualización: 2026-10-22 (21:48).

## 1. Ramas

| Rama | Contenido | Estado |
| --- | --- | --- |
| `master` | Toda la línea aprobada (combate GoW 1 PS2, rediseño anatómico, peso de locomoción, lunge, combos extendidos) más el registro de hilos y el script de arte. Fusionada por avance directo el 2026-10-22. | **Línea estable vigente.** |
| `tarea/GOW8B-CHAOS-01` | Historial previo de la línea estable; ya contenida en `master`. | Redundante; se puede borrar cuando la usuaria quiera. |
| `arte/KRATOS-2D-SPRITE-GEN-01` | Hilo de arte; hoy apunta al mismo commit que `master`. Aquí continúa el trabajo de sprites. | **Pausada** por cuota del generador de imágenes. |
| Etiqueta `respaldo/pre-merge-2026-10-22` | Punto de respaldo previo a la fusión y al borrado de ramas. | Conservar. |

Ramas `tarea/GOW8B-{DJUMP,KRA-02,RES-01,ROLL-01,SCALE-01}`: eliminadas el 2026-10-22 (apuntaban a `e6f9013`, ancestro de `master`; sin trabajo propio).

## 2. Hilos abiertos

| Hilo | Estado | Siguiente paso | Bloqueo / decisión pendiente | Documento |
| --- | --- | --- | --- | --- |
| **Arte de Kratos GoW 1** (sprites 2D generados) | Pausado | Pedir idle con guardia simétrica y resto de poses (respiración, salto, caída, rodada, derrape, ataques) con escala fija; luego paleta compartida → cuadros → hoja validada (herramientas y contrato de 22 poses ya listos; avance con `python3 scripts/sprite-gen/assemble.py --check`, hoy 1/22); integrar y auditar. | Cuota del `image-generator` (reinicio ~4.5 h desde 21:40). Paleta ampliada a ≤12 colores (ver §3). | [`planes/KRATOS-2D-SPRITE-GEN-01.md`](planes/KRATOS-2D-SPRITE-GEN-01.md) |
| **Combate PS2, Bloqueo/Parry y locomoción** (Bloque 3 100 %) | Cerrado y aprobado | Ninguno. Bloque 3 completado y verificado (Casos A a I en CDP). | Validación humana de sensación: ver registro de pendientes. | [`verificacion.md`](verificacion.md) |
| **Arte del Legionario No-Muerto** (`GOW8B-ENEMY1-ART`) | Cerrado y aprobado | Hoja de 8 poses completada y verificada (`legionnaire.png` 512×54 px, 12 colores, $y=53$). | Ninguno. | [`planes/GOW8B-ENEMY1-ART.md`](planes/GOW8B-ENEMY1-ART.md) |
| **Arte actual (maniquí procedural)** | Vigente pero rechazado visualmente | Sustituir por el hilo de arte de Kratos cuando reinicie la cuota. No invertir más en `gen-kratos-anim.py`. | Depende de la cuota del generador. | `scripts/gen-kratos-anim.py` |
| **Bloque 4: Conducta del combatiente** (`GOW8B-ENEMY1-AI`) | Activo / En preparación | Implementar la IA del Legionario No-Muerto: patrulla, persecución, telegraph de ataque (`windup`), tajo (`attack`), reacción a impactos (`hurt`), suspensión aérea (`juggle`) y colapso (`death`). | En definición de plan técnico. | [`verificacion.md`](verificacion.md) |

## 3. Decisiones

**Tomadas (delegadas por la usuaria el 2026-10-22):**

1. `master` se fusiona con la línea estable (hecho, avance directo).
2. Se borran las ramas antiguas sin trabajo propio (hecho).
3. **Paleta:** se amplía de 6 a un máximo de **12 colores** para los sprites de Kratos, porque los sprites generados con el diseño de GoW 1 usan ~11 (rojo del tatuaje, naranja de runas, acero claro). Se aplica al integrar, con aserción de máximo 12 colores en lugar de la paleta exacta de 6, y se actualizará `AGENTS.md`/`verificacion.md` en esa etapa. Si la usuaria prefiere otra cosa, se revierte antes de integrar.

**Pendientes de la usuaria:** ninguna por ahora.

## 4. Cómo se retoma una pausa

1. Leer este archivo y el plan del hilo.
2. `git switch` a la rama indicada y comprobar que el árbol está limpio.
3. Ejecutar el siguiente paso de la tabla; si cambia el alcance, actualizar la fila antes de empezar.
4. Al cerrar: actualizar plan, `verificacion.md` y esta tabla; commit único.

## 5. Material sin versionar

`scratch/` contiene intentos de arte (comparativas, imágenes generadas, recortes de referencia). Es material de trabajo, no fuente de verdad. Si un resultado se aprueba, se copia a `public/assets/` o `docs/referencias/` con su hash en el plan correspondiente.
