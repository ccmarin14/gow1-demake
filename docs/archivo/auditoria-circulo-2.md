# Segunda auditoría de ○ (commits 33ee833 y 0fb3961)

Solo lectura salvo `docs/tmp/auditoria-circulo/`. Todo se regrabó con el código actual (`AUD/rec.sh`, salida en `AUD/r2/<nombre>/`, `AUD` = `docs/tmp/auditoria-circulo`). `pnpm test`: 352 pruebas, 0 fallos. Sin errores de consola en las 22 grabaciones nuevas. Derecha e izquierda: `p_R`/`p_L`, `rip_R`/`rip_L`, `toss_R`/`toss_L`, `multi_L`.

## 1. Veredicto por hallazgo (B1-B7, M1-M5, m1-m5)

| Id | Estado | Evidencia nueva y comparación con el video |
| --- | --- | --- |
| **B1** Rip | **PARCIAL (casi corregido)** | `AUD/s2_rip_R.png`, `s2_rip_split.png`, `s2_rip_late.png`, `s2_rip_L.png`. Ahora: alza (ticks 4 a 10), baja al pecho, estira, y en el tick 36 lo parte: sangre en abanico, mitad de cabeza hacia delante y mitad de piernas hacia atrás que caen y se desvanecen (~100 ticks); el cuerpo entero se oculta; hitstop de 5 ticks. Original (`moveset.mp4` 449,1 a 450,9 s): alza, estira, parte a ~1,4 s de la presa; el juego parte a ~1,0 s (22 ticks de presa + 36). Defectos que quedan: las mitades son recortes grises rectangulares que no se leen como medio cuerpo (`s2_rip_split.png` ticks 88 a 91); la mitad de la cabeza flota 25 a 35 px sobre el suelo ~15 ticks (ticks 96 a 110) antes de posarse; el polvo naranja sale a la altura de las manos (`s2_rip_R.png` tick 84). Espejo correcto. |
| **B2** última puñalada | **CORREGIDO** | `AUD/s2_laststab_R.png`: la 4.ª puñalada dura 12 ticks (`stab` 302 a 313), el cadáver sigue en `death-02`, Kratos se levanta en `recovery` 314 a 325 (12 ticks). Ya no hay resurrección (antes 2401 px de cambio en 1 tick). Residuo menor: corte de pose arrodillado a de pie en el tick 319 a 320 (625 px). |
| **B3** azote | **PARCIAL** | `AUD/s2_slam_R.png`, `s2_slam_impact.png`. Hay alzada horizontal sobre la cabeza (ticks 4 a 10) y estampado con hitstop de 6 en el tick 24. **Falta la picada**: de los ticks 19 a 23 el soldado y Kratos están congelados (1 a 4 px cambiados por tick) y en el tick 23 a 24 el soldado pasa de horizontal a tendido en un solo tick (1242 px). Original: lo sostiene y lo estampa en un movimiento continuo (84,27 a 84,40 s). Además, salida de la fase: de `slam-c` (encorvado) a la rodilla en 1 tick (552 px, ticks 153 a 154). |
| **B4** Lunge | **PARCIAL** | `AUD/s2_lunge_R_step1.png`. Kratos avanza 4 px/tick (194, 198, 202, 206, 210, 214, 216): ya no hay teletransporte de 26 px. **Pero la conexión es un corte de pose**: en el tick 30 a 31 Kratos pasa de la zancada de embestida a la presa erguida y el soldado pasa de estar en el suelo a colgado (~7 px más arriba, ~8 px hacia Kratos) a la vez (1354 px). Se repite en `p_L` (tick 36 a 37, 1342 px). |
| **B5** parpadeo de embestida | **CORREGIDO** | `AUD/s2_pummel_R_1.png` ticks 58 a 66: tras cada puñetazo vuelve a la presa sin la pose de embestida; `spikes.py` ya no marca 1300 px en las vueltas a Hold (`p_R`: solo los saltos de impacto con hitstop). |
| **B6** presa congelada / Break Free | **PARCIAL** | `AUD/s2_hold_struggle_b.png`, `rec/r2/breakfree`. Ya no está congelada: cambios de ~400 px cada 3 ticks en los últimos 30 (media 304 px/tick frente a 9,5 antes): el soldado alterna `held-00` y `held-01` (dos poses, rebote simple). La suelta sigue siendo un corte de 1 tick (tick 143 a 144, de colgado a de pie, Kratos cambia de pose). Original: forcejeo continuo y empuje animado. |
| **B7** Toss | **CORREGIDO** | `AUD/s2_toss_R.png`, `s2_toss_L.png`. Presa de lado, hoja alzada (ticks 54 a 62), puñalada con sangre (74), giro (82 a 90) y suelta (98) con el soldado girando 4 cuadros (`tumble`) atado por una cadena visible 18 ticks; mismo resultado a la izquierda. Duración de presa a suelta ~1,1 s (original ~1,3 a 1,5 s). Residuos: en los ticks 82 a 90 el soldado se dibuja delante y tapa parte del torso y la cabeza de Kratos; en la suelta (94 a 98) el soldado salta 9 px en x y 5 px en y en un tick. |
| **M1** puñaladas | **CORREGIDO** | `AUD/s2_stab_R.png`: la hoja sube por encima de la cabeza (≈ 25 px sobre el torso), baja y se clava con flash y sangre; 12 ticks por golpe; en `mash_R` las 4 puñaladas salen seguidas sin trabarse. Sigue siendo corta (12 px) comparada con el original, y a 1x Kratos es una silueta agachada. |
| **M2** remate contextual | **NO CORREGIDO; la justificación es en parte falsa** | `grep` en `src/`: **ningún** código asigna `aiState = 'weakened'`, tampoco "otros enemigos"; solo `tests/` lo hace. Dejarlo como decisión del usuario (C-O1) es razonable, pero el texto de `estado.md` paso 141 ("solo lo asigna el código de otros enemigos o las pruebas") es incorrecto. |
| **M3** hitstop y efectos únicos | **CORREGIDO** | `rec/r2/p_R`: cada golpe repite el mismo `grabTicks` 3 veces (puñetazo y puñalada) y 6 a 8 en el azote (hitstop real). `ShellScene.ts` `crosses()` (líneas 432 a 435) dispara solo al cruzar el tick y no repite con el hitstop ni con renders extra (revisado en código, no en pantalla de 144 Hz). |
| **M4** soldado flotando | **NO CORREGIDO; justificación solo parcial** | Es verdad que lo produce el *Ascension* de △ y no código de ○. Pero no es un "mantenimiento en el aire": `rec/r2/harp_r2/meta.json` muestra el soldado con `y = 262` (en el suelo) y `vy = -200`, `aiState = juggle`, de los ticks 75 a 98, dibujado ~20 px flotando. Es una incoherencia simulación/presentación y es el estado desde el que se inicia el *Harpoon*. |
| **M5** presa como bulto | **NO CORREGIDO** | `AUD/s2_pummel_R_1.png`: la pose de presa y el orden de dibujo no cambiaron. |
| **m1** Whiff | **No re-verificado** | El código del *Whiff* no cambió. |
| **m2** orden de dibujo | **PARCIAL** | Toss corregido en lo esencial; sigue la cobertura de Kratos en los ticks 82 a 90 (ver B7). |
| **m3** cadáver sobre los pies | **NO CORREGIDO** | `AUD/s2_laststab_R.png` ticks 320 a 326: el cuerpo queda bajo los pies de Kratos. Que sea "la postura arrodillada" no lo explica: Kratos ya está de pie. |
| **m4** espejo | **CORREGIDO (sin fallos)** | `p_L`, `rip_L`, `toss_L`: espejo exacto. |
| **m5** segundo soldado inmóvil | **Sin cambios** | `multi_L`: igual. |

## 2. Regresiones y defectos nuevos

- **N1 (MAYOR). Muerte por puñetazo a media cadena**: `AUD/s2_killpunch_R.png` (`rec/r2/lowhp3`). Con el soldado con 1 de vida, el 2.º puñetazo lo mata en el tick 205; el cuerpo sigue **colgado de la mano** hasta el tick 212 y en `recovery` (tick 214) salta de colgado a tendido de espaldas con la espada en alto, ~18 px más lejos, en un tick. Es la versión pequeña de B2.
- **N2 (MENOR). Entrada no cancelable**: un □ pulsado a 12 ticks de empezar un puñetazo (tick 56) se pierde sin buffer y el soldado acaba soltándose (`rec/r2/punchthen_j`: Hold 60 a 178 y `recovery`). Con □ a la presa (tick 59 en adelante) sí funciona (`rec/r2/pj2`: Toss de 67 ticks). La ventana sorda es ~16 ticks más 3 de hitstop (~320 ms).
- **N3 (MENOR). Cortes de pose residuales** (1 tick cada uno): conexión del *Lunge* (B4), `slam-c` a rodilla (552 px), rodilla a de pie en la recuperación (625 px), suelta del Break Free.
- **N4 (MENOR). Segundo ○ rápido**: con mash cada 70 ms (`mash_R`) la cadena entera termina en 223 ticks sin trabarse; en el azote el 5.º toque entra a la fase `floorhold` solo 3 ticks después, así que las 4 puñaladas salen sin pausa (más rápido que el original, aceptable).
- Sin regresiones en: ○ lejos (`whiff_far`), varios enemigos (`multi_L`, el segundo no interfiere), △ y □ durante `floorhold` (no hacen nada, coherente), espejo.
- No pude verificar: *Harpoon* y agarre aéreo (la ventana de ○ en el aire sigue sin poder encadenarse con teclas reales: `harp_r2`), sonido, y la duplicación de efectos a más de 60 Hz (solo código).

## 3. Notas nuevas y veredicto (frente al nivel de □ y △)

| Movimiento | Antes | Ahora | Veredicto |
| --- | --- | --- | --- |
| Whiff / Lunge | 4 | 6 | NO APROBADO (corte en la conexión) |
| Hold / Break Free | 3 | 5 | NO APROBADO (forcejeo de dos poses, suelta de 1 tick) |
| Puñetazos | 4 | 6 | NO APROBADO (cuerpo colgando que se funde con Kratos, N1) |
| Slam | 2 | 6 | NO APROBADO (falta la picada) |
| Puñaladas | 3 | 7 | **APROBADO** |
| Toss | 3 | 7 | NO APROBADO por poco (soldado delante de la cabeza de Kratos 8 ticks) |
| Rip | 1 | 6 | NO APROBADO (mitades poco legibles, flotan) |
| Remate contextual | 2 | 2 | NO APROBADO (inalcanzable) |
| Harpoon / aéreo | 3 | 3 | NO APROBADO (no verificado) |
| VFX y sonido | 4 | 6 | NO APROBADO (hitstop sí; faltan cadenas y estelas como las de □ y △) |

**Global: NO APROBADO**, con mejora grande (de 3 a ~6 de media). Las correcciones de código (B2, B4 en velocidad, B5, M3) son sólidas y las de arte (B1, B3, B7, M1) llegaron a un nivel utilizable.

## 4. Plan mínimo de lo que falta (por impacto)

1. **N1 y B6**: mantener la muerte por puñetazo en el aire hasta caer y animar la suelta de Break Free: código pequeño, medio día.
2. **B4/N3**: ocultar el corte de conexión (2 ticks de pose de transición y subir al soldado en 4 ticks): código y un cuadro, pequeño.
3. **B3**: 2 cuadros de picada entre el tick 19 y el 23 y pose intermedia `slam-c` a rodilla: arte pequeño, ajuste de poses.
4. **B1**: mitades legibles (cortar por la cintura con borde irregular, dejar de flotar la mitad de la cabeza): arte mediano.
5. **M2**: decidir con el usuario (a/b/c) y corregir el texto de `estado.md` (nadie asigna `weakened`).
6. **M4/Harpoon**: arreglar la coherencia `y`/`vy` del `juggle` en suelo y reintentar el *Harpoon*: código pequeño y verificación.
7. **B7/m2**: poner al soldado detrás de Kratos en los ticks 82 a 90.
8. **N2**: buffer de entrada (6 a 8 ticks) en el puñetazo: código pequeño.
