# Plan de implementación — `GOW1-COMBAT-2D-01` (Combate de *God of War* 1 de PS2 en 2D: $\square$ `J`, $\triangle$ `K`, $\bigcirc$ `L` y física de cadenas)

- **Fecha:** 2026-10-22
- **Estado:** **APROBADO** tras auditoría independiente de solo lectura (2026-10-22).
- **Decisiones asociadas:** `D-03`, `D-08`, `D-20`, `D-24` ([`docs/decisiones.md`](../decisiones.md)).
- **Etapas del plan cubiertas:** Bloque 3 (`GOW8B-LIGHT-01` revalidación, `GOW8B-HEAVY-01`, `GOW8B-COMBO-01` ampliación PS2 terrestre/aérea, `GOW8B-FINISH-01` agarre con cadena).

---

## 1. Objetivo y dirección

Traducir fielmente al plano lateral 2D el **repertorio inicial (Nivel 1) de las Cuchillas del Caos del primer *God of War* (2005, PlayStation 2)**, de modo que:
1. ***God of War* (PS2) sea el 100 % de la fuente de ataques, combos, físicas de impacto y lore**, mientras que *God of War: Betrayal* actúe exclusivamente como referencia de cámara y encuadre 2D.
2. **Los botones del mando de PS2 tengan equivalencia directa en teclado:**
   - **`J` = Cuadrado ($\square$, `light-attack`):** ataques rápidos encadenados y malabares aéreos.
   - **`K` = Triángulo ($\triangle$, `heavy-attack`):** ataque pesado descendente, *Launcher* ascendente (***Ascension***) que eleva enemigos al aire, remate ***Plume of Prometheus* (`J, J, K` = $\square, \square, \triangle$)** y picado aéreo contra el suelo.
   - **`L` = Círculo ($\bigcirc$, `grab`):** lanzamiento horizontal de cadena para agarrar, atraer/azotar al enemigo o ejecutar remate contextual.
   - **`Espacio` = Equis ($\times$, `jump`):** salto, doble salto y habilitación de ataques aéreos.
   - **`U` = Magia (`magic`, L2):** Ira de Poseidón (separada de `K` para eliminar la colisión previa con Triángulo).
3. **Las cadenas se comporten como látigos con impacto físico real:**
   - **Contra el suelo (`yTop`):** en golpes descendentes (`K`, *Plume of Prometheus* `J, J, K`, y `K` aéreo), la hoja y los eslabones colisionan contra la superficie de la plataforma (`yTop`) sin atravesarla, generando rebote de cadena, chispas/polvo pixel-art y sacudida sutil de cámara.
   - **Contra los enemigos:** los impactos producen *hitstop* (pausa de impacto de 2–4 ticks), retroceso horizontal (`vx`), o levantamiento vertical (*launch* `vy < 0`) que permite continuar el combo en el aire.

---

## 2. Repertorio de ataques Nivel 1 (PS2 → 2D) y tabla de parámetros

Todos los tiempos (a 60 Hz) y geometrías vivirán centralizados en `src/config.ts` (`PLAYER.attack`):

| ID de movimiento (`moveId`) | Secuencia de entrada (PS2 → Teclado) | Condición | `startup` (ticks) | `active` (ticks) | `recovery` (ticks) | Geometría / Trayectoria de cadena | Efecto físico en objetivo y suelo (`yTop`) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `light_1` (*Slashing Chaos 1*) | `J` ($\square$) | Suelo | 4 | 5 | 7 | Barrido frontal ascendente (`+30° → -35°`, radio 42 px) con mano delantera. | *Hitstop* 2 ticks, retroceso `vx = 85 * facing`. |
| `light_2` (*Slashing Chaos 2*) | `J → J` ($\square, \square$) | Ventana `active`/`recovery` de `light_1` | 3 | 5 | 7 | Barrido cruzado descendente (`-40° → +28°`, radio 46 px) alternando cuchilla. | *Hitstop* 2 ticks, retroceso `vx = 95 * facing`. |
| `light_3` (*Slashing Chaos 3 / Finisher*) | `J → J → J` ($\square, \square, \square$) | Ventana `active`/`recovery` de `light_2` | 4 | 6 | 10 | Gran tajo amplio de doble cadena (`-55° → +35°`, radio 52 px) con paso al frente (`lungeVx = 90`). | *Hitstop* 3 ticks, fuerte retroceso `vx = 180 * facing`. |
| `plume_of_prometheus` (***Plume of Prometheus***) | `J → J → K` ($\square, \square, \triangle$) | Ventana `active`/`recovery` de `light_2` | 5 | 7 | 12 | Arco vertical sobre la cabeza que azota las cadenas contra el suelo (`-85° → +22°`, radio 56 px, *clamp* en `yTop`). | **Impacto contra el suelo (`yTop`)**, onda expansiva (`radius = 28 px`), *hitstop* 4 ticks, lanza enemigos (`vx = 140 * facing`, `vy = -240`). |
| `heavy_slam` (*Heavy Spirit Slam*) | `K` ($\triangle$, pulsación simple) | Suelo | 7 | 6 | 11 | Golpe pesado descendente desde arriba (`-75° → +20°`, radio 50 px, *clamp* en `yTop`). | **Impacto contra el suelo (`yTop`)**, *hitstop* 3 ticks, retroceso `vx = 130 * facing`. |
| `ascension` (***Ascension Launcher***) | `K` mantenido ($\ge 6$ ticks) o `K → K` | Suelo | 6 | 6 | 10 | Tajo vertical ascendente desde el suelo hacia el cielo (`+35° → -80°`, radio 48 px); si se mantiene `K`, Kratos asciende junto al enemigo (`vy = -340`). | ***Launch* vertical:** eleva al objetivo al aire (`vy = -350`, `vx = 40 * facing`), *hitstop* 3 ticks. |
| `air_light_1` / `air_light_2` (*Air Slashes*) | `J` ($\square$) en el aire | Aire (`!grounded`) | 3 | 5 | 6 | Tajo circular rápido en el aire (`-30° → +30°`, radio 42 px); frena la caída de Kratos (`vy = max(vy, -60) * 0.35`). | **Malabar aéreo (*Juggle*):** mantiene al enemigo en el aire (`vy = -190`, `vx = 45 * facing`), *hitstop* 2 ticks. |
| `air_heavy_slam` (*Air Crushing Slam*) | `K` ($\triangle$) en el aire | Aire (`!grounded`) | 5 | 6 | 10 | Picado diagonal/vertical hacia abajo (`-20° → +65°`, radio 52 px); impulsa a Kratos hacia el suelo (`vy = 420`). | Al tocar `yTop` o enemigo: **impacto contra el suelo (`yTop`)**, derribo (`vy = 280`, `vx = 120 * facing`), *hitstop* 3 ticks. |
| `chain_grab` (*Hyperion Grab / Throw*) | `L` ($\bigcirc$) | Suelo | 4 | 6 | 9 | Lanzamiento rectilíneo de cadena horizontal (`0°`, extensión `18 → 64 px` y retracción). | Si conecta: atrae/derriba al objetivo (`vx = -150 * facing`, `vy = -140`) o activa remate contextual (`hitstop` 4 ticks). |

---

## 3. Física de látigo de cadena e impactos (Simulación + Presentación)

### 3.1. Ondulación transversal de cadena y colisión con el suelo (`yTop`)
En lugar de interpolar los 14 eslabones en una parábola estática, `WeaponLayer` y `src/sim/attack.ts` calcularán la curva de cada eslabón $s \in [0, 1]$ ($s = i / N$) mediante una **onda de látigo amortiguada** gobernada por la fase y el progreso $p \in [0, 1]$:
- En `startup`: la cadena se recoge tensa cerca del antebrazo con curvatura preparatoria.
- En `active`: la onda viaja desde el puño hacia la punta ($\text{wave}(s, p) = A \cdot \sin(\pi \cdot s) \cdot \sin(2\pi \cdot (p - s \cdot 0.35))$), dando el latigazo característico de *God of War*.
- **Colisión con el suelo (`yTop`):** si la ordenada mundial de un eslabón o de la hoja supera el `yTop` de la plataforma bajo ese `x` ($y_{\text{world}} > y_{\text{Top}} - 2$), la coordenada $y$ se recorta a $y_{\text{Top}} - 2$ y el exceso se convierte en extensión rasante sobre la madera de la cubierta. Cuando la hoja toca `yTop` en un golpe descendente (`plume_of_prometheus`, `heavy_slam`, `air_heavy_slam`), la simulación emite un evento determinista de impacto en el suelo (`groundImpactTicks`, `groundImpactX`, `groundImpactY`).

### 3.2. Respuesta física de los objetivos (*Hitstop*, *Knockback* y *Launch*)
Para que los combos de PS2 (`J, J, K` o `K` *Ascension* → `J` aéreo) funcionen de verdad y no golpeen una caja inmóvil:
- **`hitstopTicks` en `World`:** cuando un ataque conecta por primera vez con un objetivo o con el suelo en un remate, el mundo congela el avance de movimiento/fases durante `hitstopTicks` (2 a 4 ticks según el peso del ataque) mientras aplica una vibración de 1 px al objetivo impactado.
- **Física en entidades objetivo (`dummy` / enemigos):** las entidades objetivo en `combat` pasan por integración horizontal con fricción (`vx`) y vertical con gravedad y colisión de plataformas (`vy`, `grounded`, `hitstunTicks`).
  - Así, un *Launcher* (`K` *Ascension*) **levanta literalmente al objetivo del suelo** (`vy = -350`), permitiendo que Kratos salte y lo encadene en el aire con `J` ($\square$) y lo estrelle contra la cubierta con `K` ($\triangle$).

---

## 4. Archivos exactos a modificar por fase

| Archivo | Cambios previstos |
| --- | --- |
| `src/sim/types.ts` | Añadir `'grab'` y `'magic'` a `GameAction`; añadir `AttackMoveId` (`'light_1' \| 'light_2' \| 'light_3' \| 'plume_of_prometheus' \| 'heavy_slam' \| 'ascension' \| 'air_light_1' \| 'air_light_2' \| 'air_heavy_slam' \| 'chain_grab'`); añadir a `EntityState`: `attackMove`, `hitstopTicks`, `hitstunTicks`, `groundImpactTicks`, `groundImpactX`, `groundImpactY`. |
| `src/input/InputManager.ts` | Mapear `KeyK` → `'heavy-attack'` ($\triangle$), `KeyL` → `'grab'` ($\bigcirc$), `KeyU` → `'magic'` (L2), manteniendo `KeyJ` → `'light-attack'` ($\square$), `Space` → `'jump'` ($\times$), `Shift` → `'dodge'`, `KeyE` → `'context-action'`. |
| `src/config.ts` | Centralizar la tabla de movimientos Nivel 1 de PS2 (`PLAYER.attack.moves`), tiempos de carga de *Ascension* (`heavyHoldTicks = 6`), parámetros de *hitstop*, retroceso (`knockbackVx`, `launchVy`), fricción de objetivos y partículas de impacto contra el suelo. |
| `src/sim/attack.ts` | Máquina de estados de combos ramificados de PS2 (`J,J,J`, `J,J,K`, `K` simple vs `K` mantenido/*Ascension*, `J`/`K` aéreos, `L` agarre con cadena), detección de impacto de la hoja contra `yTop` (`groundImpact`), y aplicación de *hitstop*, `vx` y `vy` sobre objetivos impactados. |
| `src/sim/world.ts` | Detectar flancos y mantenimiento de `light-attack` (`J`), `heavy-attack` (`K`) y `grab` (`L`); respetar `hitstopTicks`; integrar física vertical y horizontal (con fricción y rebote en `minX`/`maxX`) de los objetivos golpeados en el escenario `combat`. |
| `src/scale.ts` | Actualizar la derivación de envolventes para seguir leyendo dinámicamente los movimientos ligeros encadenados sin literales manuales. |
| `src/scene/WeaponLayer.ts` | Renderizar la onda de látigo por eslabón, el *clamp* rasante de cadena y hoja sobre `yTop`, el lanzamiento rectilíneo de `L` (`chain_grab`), y el pool pre-alocado de chispas/escombros pixel-art al chocar contra el suelo (`groundImpactTicks > 0`) o contra un enemigo. |
| `src/scene/ShellScene.ts` | Sacudida sutil y determinista de cámara (1–2 px durante 3 ticks) en impactos pesados contra el suelo (*Plume of Prometheus*, `heavy_slam`, `air_heavy_slam`), vibración de *hitstun* en objetivos y selección de pose de Kratos según el movimiento activo. |
| `scripts/gen-kratos-anim.py` | Ampliar `kratos-attack.png` (de 3 a 6 cuadros de 97×59) para incluir poses diferenciadas de tajo horizontal (`J`), golpe descendente sobre la cabeza (`K` / *Plume of Prometheus*), tajo ascendente (*Ascension*) y lanzamiento de cadena (`L`). |

---

## 5. Secuencia de ejecución por fases (cuando la usuaria lo autorice)

1. **Fase 1 — Entrada PS2 (`J`/`K`/`L`/`U`) y contrato de tipos (`types.ts`, `InputManager.ts`, `config.ts`):**
   - Incorporar `'grab'` (`L`) y `'magic'` (`U`) en el gestor de entrada y tipos serializables.
   - Definir la tabla completa de movimientos Nivel 1 en `src/config.ts`.
2. **Fase 2 — Máquina de combos de PS2 en suelo y aire (`src/sim/attack.ts`, `src/sim/world.ts`, `src/scale.ts`):**
   - Implementar las ramas `J → J → J`, `J → J → K` (*Plume of Prometheus*), `K` simple (*Heavy Slam*), `K` mantenido/*Launcher* (*Ascension*), `J`/`K` en el aire y `L` (*Chain Grab*).
   - Implementar la colisión de hoja contra `yTop` (`groundImpact`) y la física de respuesta en el objetivo (*hitstop*, `vx` de retroceso, `vy` de levantamiento aéreo).
3. **Fase 3 — Dinámica visual de látigo, colisión de cadena con suelo y efectos de impacto (`WeaponLayer.ts`, `ShellScene.ts`, `gen-kratos-anim.py`):**
   - Onda transversal en los 14 eslabones, *clamp* contra el suelo `yTop`, chispas/polvo pixel-art pre-alocados (cero asignaciones por frame) y poses de ataque en `kratos-attack.png`.
4. **Fase 4 — Verificación técnica y auditoría visual en navegador con mosaicos del `<canvas>`:**
   - Un subagente **Implementador** ejecuta las fases 1–3 y verifica `tsc --noEmit`, `pnpm build`, determinismo y capturas en navegador.
   - Un subagente **Auditor independiente** (distinto del implementador) captura desde Chrome headless + CDP **mosaicos multi-tick reales del `<canvas>`** para:
     1. Combo `J, J, K` (***Plume of Prometheus***) verificando que en el tercer golpe las cadenas azotan el suelo (`yTop = 262`), aparecen las chispas de impacto y el objetivo sale despedido.
     2. *Launcher* `K` (***Ascension***) seguido de `J` aéreo y `K` aéreo, verificando que el objetivo se eleva del suelo (`y < 262`) y es encadenado en el aire.
     3. Agarre `L` ($\bigcirc$), verificando la extensión rectilínea de la cadena y la tracción del objetivo.

---

## 6. Criterios de aceptación y regresiones protegidas

### Criterios de aceptación
1. **Mapeo PS2 exacto:** `J` ($\square$) ejecuta ataques ligeros, `K` ($\triangle$) ejecuta ataques pesados/*Launcher*/remate de combo, `L` ($\bigcirc$) ejecuta el agarre con cadena, `Espacio` ($\times$) salta y permite ataques aéreos (`J` y `K` en el aire), y `U` queda asignada a magia.
2. **Combos Nivel 1 funcionales y deterministas:**
   - `J, J, J` completa los 3 tajos ligeros encadenados.
   - `J, J, K` ejecuta ***Plume of Prometheus*** y registra impacto contra el suelo (`groundImpactTicks > 0` al tocar `yTop`).
   - `K` mantenido (o `K, K`) ejecuta ***Ascension*** y eleva al objetivo del escenario `combat` al aire (`dummy.y < 262`, `dummy.vy < 0`).
   - En el aire (`!grounded`), `J` ejecuta malabar aéreo y `K` ejecuta picado descendente hasta `yTop`.
   - `L` extiende la cadena horizontalmente y derriba/atrae al objetivo dentro de alcance (`≤ 64 px`).
3. **Impacto físico de cadenas (suelo y enemigo):**
   - Ningún eslabón ni hoja atraviesa el suelo `yTop` hacia abajo; en golpes contra el suelo se renderizan chispas pixel-art en `(groundImpactX, groundImpactY)`.
   - Al golpear al objetivo se aplica `hitstopTicks` (2–4 ticks) y desplazamiento real (`vx`, `vy`) sobre la entidad objetivo.
4. **Evidencia visual en navegador (`<canvas>`):** mosaicos PNG capturados del `<canvas>` en vivo e inspeccionados visualmente por el auditor independiente mostrando siempre 2 cuchillas sincronizadas, latigazo de cadena, chispas en el suelo y levantamiento del objetivo.

### Regresiones protegidas
- Movimiento horizontal (`maxSpeed = 140`, límites `48.5`/`431.5`), salto simple (`apex = 69.056 px`), doble salto (`120.389 px`) y rodada terrestre con `Shift` (`GOW8B-ROLL-01` y poses de `kratos-roll.png` sin rotación de contenedor) permanecen intactos.
- Cero asignaciones por tick en `ShellScene`/`WeaponLayer` (`GOW8B-OPTIM-01` protegido).
- Determinismo estricto: misma traza de entrada → mismo checksum a 60 fps, 30 fps e irregular; `record`/`replay` idénticos.
- `pnpm exec tsc --noEmit` y `pnpm build` con exit 0; `__GOW8B` y `scaleOverlay` ausentes del bundle de producción.

---

## 7. Resultados y Evidencia de Auditoría (2026-10-22)

- **Implementador:** subagente `117feb16-c3a2-49a0-b785-dd60d5e3fd59`
- **Auditor independiente (solo lectura):** subagente `910c62e6-b7ae-45b2-a90e-80b9c2921ee6`
- **Veredicto:** **APROBADO** (5/5 criterios cumplidos, 0 hallazgos bloqueantes)
- **Baseline Checksums confirmados:**
  - `scaleChecksum`: `f107157b`
  - `init_empty`: `5ae64ce0`
  - `init_test`: `4cf0befe`
  - `init_movement`: `0d576c4c`
  - `init_platforms`: `0d576c4c`
  - `init_combat`: `f6a364ce`
  - `combat60`: `9af9a492` (deterministicReplayMatch = true)
- **Mosaicos visuales de `<canvas>`:**
  - `evidence-plume-combo.png`: azote descendente en $t=33$, chispas en suelo `yTop = 262`, hitstop de 4 ticks y elevación del objetivo.
  - `evidence-ascension-air-combo.png`: *Ascension* en $t=6..20$ elevando al objetivo a $y \approx 204$ px, seguido de `air_heavy_slam` con picado en vuelo y colisión contra la cubierta.
  - `evidence-chain-grab.png`: proyección de cadena tensa horizontal de 64 px y tracción inmediata del enemigo.
