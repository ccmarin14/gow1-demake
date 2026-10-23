# Estado de trabajo (registro de hilos abiertos)

> **Para qué sirve:** un único lugar que dice qué hilos hay abiertos, en qué rama vive cada uno, qué sigue y qué lo bloquea. Se lee primero al retomar el proyecto. No sustituye a `docs/verificacion.md` (fuente de verdad de las etapas) ni a `docs/pendientes-de-validacion-humana.md` (comprobaciones que solo hace la usuaria).
>
> **Regla de uso:** al abrir, pausar, bloquear o cerrar un hilo, se actualiza este archivo **en el mismo commit** que el cambio. Un hilo sin fila aquí se considera olvidado. Los resultados de cada etapa siguen en su plan (`docs/planes/`) y las lecciones en `docs/aprendizajes-del-proceso.md`.

Última actualización: 2026-10-23 (00:15).

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
| **Conducta e IA del Legionario No-Muerto** (`GOW8B-ENEMY1-AI`) | Cerrado y aprobado | Máquina de estados completa (`approach`, `windup`, `slash`, `recover`, `hitstun`, `juggle`, `death`), interacción con Parry y Ascensión, Caso J en CDP verificado. | Ninguno. | [`planes/GOW8B-ENEMY1-AI.md`](planes/GOW8B-ENEMY1-AI.md) |
| **Vida y respuesta al daño del jugador** (`GOW8B-DAMAGE-01`) | Cerrado y aprobado | Cascada de mitigación (evasión, parry, guardia 85%), i-frames de gracia post-golpe (45 ticks), retroceso direccional, derrota a 0 HP y reinicio rápido (`R`), Caso K verificado. | Ninguno. | [`planes/GOW8B-DAMAGE-01.md`](planes/GOW8B-DAMAGE-01.md) |
| **HUD de vida clásico** (`GOW8B-HUD-01`) | Cerrado y aprobado | Marco de piedra y bronce, barra verde viva de 110 px, barra fantasma con retención de 200 ms y drenaje suave, notches cada 20 HP, alerta crítica, Caso L verificado. | Ninguno. | [`planes/GOW8B-HUD-01.md`](planes/GOW8B-HUD-01.md) |
| **Orbes rojos y verdes** (`GOW8B-ORBS-01`) | Cerrado y aprobado | Eclosión balística de 5 orbes (4 rojos, 1 verde), atracción magnética fluida, curación (+15 HP), economía de orbes rojos (+20) en HUD, Caso M verificado. Bloque 4 completado al 100 %. | Ninguno. | [`planes/GOW8B-ORBS-01.md`](planes/GOW8B-ORBS-01.md) |
| **Arte del Arquero No-Muerto** (`GOW8B-ENEMY2-ART`) | Cerrado y aprobado | Hoja de 8 poses completada y verificada (`archer.png` 512×54 px, 11 colores, $y=53$) y proyectil de flecha (`arrow.png` 16×8 px). | Ninguno. | [`planes/GOW8B-ENEMY2-ART.md`](planes/GOW8B-ENEMY2-ART.md) |
| **Conducta e IA del Arquero No-Muerto** (`GOW8B-ENEMY2-AI`) | Cerrado y aprobado | Máquina de estados completa (`reposition`, `aim` de 24 ticks, `shoot` a 280 px/s, `recover`, `hitstun`, `juggle`, `death`), reflejo Parry a 420 px/s contra el agresor, eclosión de 4 orbes, Caso N verificado en CDP. | Ninguno. | [`planes/GOW8B-ENEMY2-AI.md`](planes/GOW8B-ENEMY2-AI.md) |
| **Arte actual (maniquí procedural)** | Vigente pero rechazado visualmente | Sustituir por el hilo de arte de Kratos cuando reinicie la cuota. No invertir más en `gen-kratos-anim.py`. | Depende de la cuota del generador. | `scripts/gen-kratos-anim.py` |
| **Flujo y ritmo de oleadas** (`GOW8B-WAVES-01`) | Cerrado y aprobado | WaveManager formal (Oleada 1 vanguardia, pausa de respiro de 60 ticks, Oleada 2 mixta, victoria final con 5 bajas), spawn ascendente dinámico, banner centrado, Caso O verificado en CDP. | Ninguno. | [`planes/GOW8B-WAVES-01.md`](planes/GOW8B-WAVES-01.md) |
| **Zonas y delimitación de arenas** (`GOW8B-ARENA-01`) | Cerrado y aprobado | Barreras mágicas rojas de Ares ($x=70$ y $x=410$), confinamiento cinemático determinista en combate, disipación lineal de 30 ticks, reapertura del nivel ($x > 410\text{ px}$), Caso P verificado en CDP. Bloque 5 completado al 100 %. | Ninguno. | [`planes/GOW8B-ARENA-01.md`](planes/GOW8B-ARENA-01.md) |
| **Ira de Poseidón: Magia y economía** (`GOW8B-MAGIC-01`) | Cerrado y aprobado | Invocación de Ira de Poseidón (`U`/`I`, 35 MP), super-armadura, tormenta AoE multi-hit (radio 90 px, 5 impactos, aturdimiento eléctrico), barra de maná azul zafiro en HUD, orbes azules (+20 MP), Caso Q verificado en CDP. Bloque 6 completado al 100 %. | Ninguno. | [`planes/GOW8B-MAGIC-01.md`](planes/GOW8B-MAGIC-01.md) |
| **Mapa del primer nivel (Estructura lateral y segmentos)** (`GOW8B-MAP-01`) | Cerrado y aprobado | Nivel de 1440 px estructurado en 3 segmentos (Popa, Arena Central y Proa), cámara con deadzone de 32 px y bloqueo en arena ($scrollX=480$), parallax marino $0.25\times$, Caso R verificado en CDP. | Ninguno. | [`planes/GOW8B-MAP-01.md`](planes/GOW8B-MAP-01.md) |
| **Plataformeo del primer nivel (Mástiles y pasos elevados)** (`GOW8B-PLATFORM-01`) | Cerrado y aprobado | 5 plataformas canónicas (Popa, Proa, mástiles y castillo), plataformas one-way, drop-through voluntario (abajo+salto, 14 ticks), combate multicota, Caso S verificado en CDP. Bloque 7 completado al 100 %. | Ninguno. | [`planes/GOW8B-PLATFORM-01.md`](planes/GOW8B-PLATFORM-01.md) |
| **Ojos de Górgona: Expansión de vida** (`GOW8B-PICK-01`) | Cerrado y aprobado | Cofres de ojos de górgona, recolección contextual con `E`, medidor de 6 ojos en HUD, expansión permanente a 120 HP y redimensionamiento dinámico de HUD a 132 px, Caso T verificado en CDP. | Ninguno. | [`planes/GOW8B-PICK-01.md`](planes/GOW8B-PICK-01.md) |
| **Plumas de Fénix: Expansión de maná** (`GOW8B-PICK-02`) | Cerrado y aprobado | Cofres de plumas de fénix, recolección con `E`, medidor de 6 plumas zafiro en HUD, expansión permanente a 120 MP y redimensionamiento dinámico de la barra de maná a 96 px, Caso U verificado en CDP. | Ninguno. | [`planes/GOW8B-PICK-02.md`](planes/GOW8B-PICK-02.md) |
| **Cofres de orbes y mejora de arma** (`GOW8B-UPGRADE-01`) | Cerrado y aprobado | Cofres de orbes rojos (+50), mejora de arma con `P`, Nivel 2 (+30% daño en combate), indicador de oro en HUD y banner animado, Caso V verificado en CDP. Bloque 8 completado al 100 %. | Ninguno. | [`planes/GOW8B-UPGRADE-01.md`](planes/GOW8B-UPGRADE-01.md) |
| **Punto de control y reaparición** (`GOW8B-CHECK-01`) | Cerrado y aprobado | Columnas de luz dorada, captura atómica de instantánea, reaparición en $(x_{chk}, y_{chk})$, preservación de mejoras y salud al 100%, Caso W verificado en CDP. Bloque 9 completado al 100 %. | Ninguno. | [`planes/GOW8B-CHECK-01.md`](planes/GOW8B-CHECK-01.md) |
| **Arte de la Hidra: Jefe a escala naval** (`GOW8B-HYDRA-ART`) | Cerrado y aprobado | Spritesheet de 8 poses ($1024 \times 112\text{ px}$, $128 \times 112\text{ px}$ c/u, 14 colores abisales, anclaje $y=111$), hoja de contacto con silueta comparativa e integración en Phaser. | Ninguno. | [`planes/GOW8B-HYDRA-ART.md`](planes/GOW8B-HYDRA-ART.md) |
| **Combate de la Hidra: Patrones y daño** (`GOW8B-HYDRA-COMBO`) | Activo | Bloque 10: Máquina de estados del jefe (rugido, mordisco, barrido, vulnerabilidad), colisiones, fases de combate y remate cinemático. | Ninguno. | [`planes/GOW8B-HYDRA-COMBO.md`](planes/GOW8B-HYDRA-COMBO.md) |

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
