# Estado de trabajo (registro de hilos abiertos)

> **Para qué sirve:** un único lugar que dice qué hilos hay abiertos, en qué rama vive cada uno, qué sigue y qué lo bloquea. Se lee primero al retomar el proyecto. No sustituye a `docs/verificacion.md` (fuente de verdad de las etapas) ni a `docs/pendientes-de-validacion-humana.md` (comprobaciones que solo hace la usuaria).
>
> **Regla de uso:** al abrir, pausar, bloquear o cerrar un hilo, se actualiza este archivo **en el mismo commit** que el cambio. Un hilo sin fila aquí se considera olvidado. Los resultados de cada etapa siguen en su plan (`docs/planes/`) y las lecciones en `docs/aprendizajes-del-proceso.md`.

Última actualización: 2026-10-22.

## 1. Ramas

| Rama | Contenido | Estado |
| --- | --- | --- |
| `master` | Solo `first commit`. **No contiene nada del trabajo actual.** | Desactualizada; decidir con la usuaria cuándo integrar. |
| `tarea/GOW8B-CHAOS-01` | Toda la línea aprobada: combate GoW 1 PS2, rediseño anatómico, peso de locomoción, lunge y combos extendidos (commits `33f776f`, `4d95639`, `b68648d`, `4571b85`). | **Línea estable vigente.** No se ha fusionado a `master`. |
| `arte/KRATOS-2D-SPRITE-GEN-01` | Parte de la línea estable. Añade el script de reducción de sprites y la documentación del hilo de arte. No toca el juego. | **Pausada** por cuota del generador de imágenes. |
| `tarea/GOW8B-{DJUMP,KRA-02,RES-01,ROLL-01,SCALE-01}` | Ramas antiguas, todas en `e6f9013`. | Obsoletas; candidatas a borrar con permiso de la usuaria. |

## 2. Hilos abiertos

| Hilo | Estado | Siguiente paso | Bloqueo / decisión pendiente | Documento |
| --- | --- | --- | --- | --- |
| **Arte de Kratos GoW 1** (sprites 2D generados) | Pausado | Pedir idle con guardia simétrica y resto de poses (respiración, salto, caída, rodada, derrape, ataques) con escala fija; integrar y auditar. | Cuota del `image-generator` (reinicio ~4.5 h desde 21:40). **Decisión de la usuaria:** ampliar la paleta de 6 a ~12 colores. | [`planes/KRATOS-2D-SPRITE-GEN-01.md`](planes/KRATOS-2D-SPRITE-GEN-01.md) |
| **Combate PS2 y locomoción** (4 niveles) | Cerrado y aprobado | Ninguno. El juego usa todavía el arte anterior (maniquí del generador procedural). | Validación humana de sensación: ver registro de pendientes. | [`verificacion.md`](verificacion.md) |
| **Arte actual (maniquí procedural)** | Vigente pero rechazado visualmente | Sustituir por el hilo de arte anterior. No invertir más en `gen-kratos-anim.py`. | Depende del hilo de arte. | `scripts/gen-kratos-anim.py` |
| **Bloque 4 en adelante** (enemigos, daño, HUD, orbes, oleadas, magia, mapa, Hidra) | Sin iniciar | Según `verificacion.md`; requiere autorización de la usuaria. | Sin etapa activa. | [`verificacion.md`](verificacion.md) |

## 3. Decisiones pendientes de la usuaria

1. Ampliar la paleta del proyecto de 6 a ~12 colores (necesario para integrar los sprites generados).
2. Cuándo y cómo fusionar `tarea/GOW8B-CHAOS-01` en `master`.
3. Borrar las ramas antiguas obsoletas.

## 4. Cómo se retoma una pausa

1. Leer este archivo y el plan del hilo.
2. `git switch` a la rama indicada y comprobar que el árbol está limpio.
3. Ejecutar el siguiente paso de la tabla; si cambia el alcance, actualizar la fila antes de empezar.
4. Al cerrar: actualizar plan, `verificacion.md` y esta tabla; commit único.

## 5. Material sin versionar

`scratch/` contiene intentos de arte (comparativas, imágenes generadas, recortes de referencia). Es material de trabajo, no fuente de verdad. Si un resultado se aprueba, se copia a `public/assets/` o `docs/referencias/` con su hash en el plan correspondiente.
