# BL-29: ajustes de la espada (brief de la tarea en curso; se borra al cerrarla)

El usuario aprobó la v18 como camino correcto y pasa ajustes **uno a uno** (2026-11-24). Se aborda una cosa a la vez: se muestra, él la aprueba y recién entonces se sigue con la siguiente. Referencia: mediana limpia en **720p** (`docs/tmp/legionario-ref/hd.mp4` → `docs/tmp/bl29-hud/hd-median-720p.png`) además del fotograma 360p (`docs/tmp/gow1-grab/full.mp4`, t=120 s). Generador: `scripts/build_hud_sword_svg.py` y `scripts/render_hud_sword.py`.

| # | Ajuste (palabras del usuario) | Estado |
| --- | --- | --- |
| 1 | No hay espacio para la barra roja: es más delgada que la verde y la azul, va bajo la azul y tiene un contador a la izquierda. | Aprobado (v19) |
| 2 | El ojo de la empuñadura no se nota agresivo como el de la referencia. | Aprobado (v22) |
| 3 | La empuñadura, solo la parte del mango, no se parece a la original (va por buen camino). | Aprobado (v23) |
| 4 | El inicio del filo de la hoja por el frente (el borde que mira hacia abajo) se ve muy recto; la referencia también tiene un tramo recto, pero no tan largo. | Aprobado (v24) |
| 5 | Las barras de vida y magia: sin líneas internas, esbeltas (no altas) y con bordes redondeados/biselados como las reales. | Hecho en v26 (3 px de alto, cápsula redondeada, bisel en acero y 2 px de acero libre entre barras; v25 descartada por alta y cuadrada), Aprobado (v26) |

Después de la espada: el selector de magias con icono y flechas (decisión pendiente del usuario).
