# Ritmo, peso e impacto de los ataques con ○ (game feel)

Rama `tarea/ataques-circulo`, sin commits. Original medido a 30 fps (1 fotograma = 2 ticks a 60 Hz) en
`docs/tmp/auditoria-circulo/ref/{rip,g1,harp}` (hojas: `ref_rip_overview.png`, `ref_rip_a.png`, `ref_rip_b.png`,
`ref_pummel_overview.png`, `ref_pummel_slam_stabs.png`, `ref_harpoon_overview.png`). Juego grabado con
`scripts/verify/grab_rec.sh` (`docs/tmp/grab-rec/feel_*`); el "antes" del Toss se grabó en un worktree de HEAD.

## 1. Movimiento x fase: original vs nuestro (ticks a 60 Hz)

| Movimiento | Fase | Original | Antes | Después |
| --- | --- | --- | --- | --- |
| Whiff | embestida / vuelta del brazo / guardia bloqueada | (sin clip aislado) | 13 / 8 / **11** | 13 / 15 / 4 |
| Lunge | enganche (sonido de cierre) | contacto al llegar (~6) | sonaba en el tick 2, a media embestida | suena y sacude al llegar (cambio de cuadro lunge -> hold) |
| Hold | forcejeo / zafarse | ~36 hasta la elección | 120 / 4 | sin cambios |
| Puñetazo | puño atrás / golpe / vuelta (+congelado) | ~17 por toque (al ritmo del jugador) | 4 / 5 / 5 (+3) | 4 / 5 / 5 (+2) |
| Azote | alzada / arriba / picada / congelado / rodilla | ~12-14 de carga, picada ~4, rodilla ~12 | 5 / 10 / 5 / 6 / 16 | 5 / 8 / 5 / **8** / 16 |
| Puñaladas | espera / clavada (+congelado) | 24, 12, 24: subida lenta, bajada rápida, irregular | 8 / 10 (+3) las 4 iguales | 8 / 10 (+3) x3; la 4.ª **16** / 10 (+**5**) |
| Toss | presa / hoja / puñalada / tirón / chasquido / cadenas | presa a suelta ~78-90 | parámetros del usuario (+3, +3) | iguales (+4, +4) |
| Rip | agarre / alzada / pecho / estirado / desgarro (congelado) / quieto / recuperación | ~6 / (no alza) / tirón 8 / **tensión ~34** con sangre / ~6 / quieto ~26 | 4 / 12 / 14 quieto / 6 / 5 / 23 agachado / 8 (salto de pose) | 4 / 12 / 14 con sacudidas / **10** con temblor, goteo y retumbo / **7** con cuadro blanco / 16 agachado + **8 incorporándose** / 8 |
| Mitades del Rip | vuelo | salen del cuadro (~12) | 95/-120 y 70/-90 px/s, caían a los pies, se movían durante el congelado | quietas durante el congelado, 150/-175 y 110/-135 px/s, estela de sangre |
| Harpoon | ciclo lanzar-atrapar-azote | ~72-84 por ciclo; azote -> relanzar ~24 | atrapada +4 de congelado; azote **sin congelado** | azote con congelado y sacudida de azote (8, 6 px) |
| Remate (`finisher_slam`) | | sin clip | comparte `slamTicks`/`slamImpactTick` | hereda el azote nuevo (38 ticks, impacto 22, congelado 8); sigue inalcanzable (M2) |

## 2. Escala de impacto (todos los golpes de ○)

| Golpe | Congelado antes -> después | Sacudida efectiva antes -> después | Sangre / destello / sonido |
| --- | --- | --- | --- |
| Enganche | 0 -> 0 | ninguna -> 40 ms, 1 px | clamp al contacto |
| Puñetazo | 3 -> **2** | 70 ms, 1,2 px (la del aviso genérico tapaba la propia) -> 60 ms, 1,5 px | 8 gotas; **sonaba dos veces** -> una |
| Puñalada | 3 -> 3 | 70 ms, 1,2 px -> 70 ms, 2 px | 22 gotas; golpe ligero duplicado -> solo `playStab` |
| Puñalada final | 3 -> **5** | 70 ms, 1,2 px -> 110 ms, 3,5 px | 34 gotas + estallido 16, `playStab` + golpe pesado |
| Toss (puñalada y suelta) | 3 -> **4** | 50 ms 3,4 px / 140 ms 2,9 px -> 90 ms, 3 px las dos | suelta: chispas + chasquido pesado |
| Toss: derriba a otro | 0 -> **4** | 6 ticks, 4 px -> 5 ticks, 3 px | sin cambios |
| Rip | 5 -> **7** | 8 ticks, 5 px -> 160 ms, 5 px (+ retumbo 1 px durante el estirado) | destello, abanico de sangre, mitades en blanco 3 cuadros |
| Azote (y azote del Harpoon) | 6 -> **8** (Harpoon 0 -> 8) | 7 ticks, 4 px -> 180 ms, 6 px | destello, chispas, polvo a dos lados; golpe pesado duplicado -> uno |

Orden fijado en `CONFIG.player.grab.hitstop` y `CONFIG.player.grab.shake`: puñetazo < puñalada < Toss < Rip < azote, con la puñalada final entre la puñalada y el Rip; una prueba lo exige.

## 3. Diagnóstico

1. **Sin gramática común**: cada golpe de ○ disparaba la sacudida dos veces (el aviso genérico del mundo y el efecto propio). Phaser no reinicia una sacudida en curso, así que ganaba la primera y más débil (el puñetazo y la puñalada sacudían 1,2 px, menos que la puñalada del Toss, 3,4 px). Además el puñetazo, el azote y el Rip **sonaban dos veces**.
2. **Rip sin tensión**: 14 ticks quieto al pecho y 6 de estirado con temblor de 1 px; el original carga ~34 ticks con sangre goteando. Tras el desgarro Kratos quedaba 23 ticks agachado y saltaba a de pie en un tick.
3. **Error en el pico del Rip**: durante los 6 cuadros congelados el cuerpo del soldado se dibujaba **de pie sobre la cabeza de Kratos** (el congelado llega antes de que la simulación marque `ripped`) y las mitades seguían volando mientras el mundo estaba congelado.
4. **Puñaladas monótonas**: 4 golpes idénticos cada 21 ticks; el original sube lento, baja rápido y alterna ritmos. Faltaba un acento en la que mata.
5. **Azote**: carga 2 ticks más larga que el original y congelado menor que el del Rip, siendo el golpe más pesado.
6. **Whiff**: 11 de sus 32 ticks en guardia neutra, bloqueado y quieto.
7. **Enganche**: el sonido de cierre caía a media embestida, no al tocar el cuello.
8. **Harpoon**: el azote en cubierta no congelaba (el azote del agarre sí).

## 4. Cambios (archivo y porqué)

- `src/config.ts`: `hitstop` {2,3,lastStab 5,4,7,8} y tabla nueva `shake`; `slamImpactTick` 24 -> 22, `slamTicks` 40 -> 38; `ripTick` 36 -> 40, `breakTicks` 60 -> 64, nuevos `ripStretchTicks` 10 y `ripRiseTicks` 8; `chain.lastStabDelayTicks` 16. Parámetros del Toss sin tocar.
- `src/sim/world.ts`: los golpes de ○ solo congelan; ya no generan los avisos genéricos de impacto (sacudida y sonido dobles). La puñalada final congela `lastStab`. El azote del Harpoon y el soldado lanzado que derriba a otro usan la escala (congelado y sacudida).
- `src/sim/grab.ts`: la 4.ª puñalada espera `lastStabDelayTicks` (siguen siendo automáticas; un toque la adelanta).
- `src/scene/ShellScene.ts`: un solo bloque de efectos con sacudida forzada desde la tabla; enganche al llegar; retumbo y goteo de sangre cada 3 ticks durante el estirado; destello en el Rip y el azote; chispas en la suelta del Toss y en el azote; acento de sangre y sonido en la última puñalada.
- `src/scene/grabPose.ts`: `ripTremble` (cada 4 ticks al pecho, cada 2 estirado, cada tick y también en vertical los 4 últimos); seguimiento (break-b quieto 16 ticks, slam-c 8 al incorporarse); `victimTorn` oculta el cuerpo desde el tick del desgarro; el Whiff mantiene `grab-whiff-recover` hasta 4 ticks antes del final.
- `src/scene/EnemyView.ts`: usa `victimTorn`.
- `src/scene/RipHalves.ts`: las mitades quedan quietas durante el congelado (las 3 primeras en silueta blanca horneada: el renderizador es Canvas y `setTint` no hace nada), salen más rápido y dejan estela de sangre.
- Pruebas: `tests/grab-hitstop.test.ts` (congelado por puñalada `[3,3,3,5]`, escala ordenada, cuerpo oculto durante el congelado del desgarro); `tests/grab-pose.test.ts` (orden de cuadros del Rip con el incorporarse, duración del estirado y del seguimiento, temblor creciente, espera mayor de la 4.ª puñalada, cola del Whiff). Mutaciones comprobadas: quitar cada cambio hace fallar su prueba (6 de 6).

## 5. Tiras antes/después

`rip_before.png` / `rip_after.png`, `rip_before_tear.png` / `rip_after_tear.png` (cuadro a cuadro del desgarro),
`pummel_slam_before.png` / `pummel_slam_after.png`, `pummel_laststab_before.png` / `pummel_laststab_after.png`,
`toss_before.png` / `toss_after.png`. Grabaciones: `docs/tmp/grab-rec/feel_{rip,pummel,toss}_{before,after}`.

## 6. Qué no pude verificar

- **Sonido**: solo revisé en qué tick se dispara cada uno (código), no cómo suena. Ojo: `src/audio/SoundManager.ts` y `src/audio/{recipes,synth}.ts` los modifica otro trabajo en paralelo; no los toqué.
- **Harpoon y remate**: solo por código y pruebas (no se encadenan con teclas en Chrome sin cabeza); el remate sigue inalcanzable (M2).
- **Juicio estético**: el cuadro blanco del desgarro (3 cuadros) y el destello del azote pueden resultar fuertes; los dejo para el ojo del usuario. El vuelo de las mitades usa `dt` de pantalla, así que a más de 60 Hz se ve igual pero no es determinista.
- `browser-check.sh` imprimió `frames 0 errors 0 failed 0`: limpio de errores y 404, pero el contador de cuadros salió 0.
- En las grabaciones aparece un tick `none` en medio de la presa (también en el "antes"): no es de este cambio.
