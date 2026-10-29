# Plan de implementación — `GOW8B-FULL-01` (Partida completa del primer nivel: Egeo, Oleadas, Plataformeo, Checkpoint, Hidra y Victoria)

- **Fecha:** 2026-10-23
- **Estado:** **APROBADO** (Auditoría independiente completada sin observaciones).
- **Decisiones asociadas:** `D-03` (Lore y atmósfera épica de God of War 1 PS2), `D-06` (roles orquestador / implementador / auditor), `D-12` (lienzo 480×270 a 60 Hz), `D-22` (combate de Cuchillas del Caos y progresión).
- **Objetivo:** Orquestar y verificar la experiencia de juego continua del primer nivel completo del juego (escenario `level1`, 1440 px de longitud). Conecta de extremo a extremo todos los sistemas desarrollados a lo largo de las 32 etapas previas: navegación de popa a proa, activación de puntos de control divinos, apertura de cofres, confinamiento y victoria en la arena de combate contra oleadas de legionarios y arqueros, plataformeo en mástiles con combate vertical, enfrentamiento culminante contra la monumental Hidra de Lerna y transición a la pantalla de victoria con fanfarria y rango de honor espartano.

---

## 1. Alcance y Especificación Funcional

1. **Flujo Integral de Nivel 1 en `src/sim/world.ts` y `src/sim/scenarios.ts`:**
   - **Segmento 1: Popa ($x \in [0, 480]$):**
     - Inicio de Kratos en $x=100, y=262$.
     - Activación por proximidad del punto de control divino `chk-popa` ($x=140$).
     - Apertura de cofre de orbes rojos en $x=70$ o cofre de ojo de górgona en $x=240, y=226$.
     - Desplazamiento fluido hacia el Este con cámara acompañando al jugador.
   - **Segmento 2: Arena Central ($x \in [550, 890]$):**
     - Al cruzar $x \ge 550$, activación de barreras mágicas de Ares en $x=550$ y $x=890$.
     - Bloqueo de cámara en $scrollX = 480$.
     - Disparo del `WaveManager`:
       - Oleada 1: Legionarios No-Muertos.
       - Oleada 2: Arqueros No-Muertos + Legionarios.
     - Combate con combos ligeros, remates de *Pluma de Prometeo*, *Parry* de flechas y magia *Ira de Poseidón*.
     - Absorción de orbes de vida, maná y experiencia.
     - Al completar la oleada final, disipación de barreras y desbloqueo de cámara.
   - **Segmento 3: Mástiles y Plataformeo Vertical ($x \in [900, 1200]$):**
     - Ascenso por plataformas de mástil ($y=200, y=138$).
     - Eliminación del arquero de cofa (`archer-crow` en $x=1170, y=138$).
     - Apertura de cofre de pluma de fénix en $x=1110, y=200$.
     - Descenso voluntario mediante *drop-through* hacia la cubierta.
   - **Segmento 4: Proa y Clímax contra la Hidra ($x \in [960, 1440]$):**
     - Activación de punto de control de Proa `chk-proa` en $x=980$.
     - Encuentro con la colosal Hidra de Lerna en $x=1360$.
     - Ciclo de combate contra el jefe:
       - Telegrafiado de rugido (`hydra_roar`).
       - Mordisco sísmico (`hydra_slam`) con colmillos atascados en cubierta (`hydra_stuck`).
       - Ventana de castigo: ataques continuos con Cuchillas del Caos y magia.
       - Caída de la Hidra a 0 HP -> animación de colapso abisal (`hydra_defeat`).
       - Eclosión de 19 orbes de recompensa.
   - **Segmento 5: Victoria y Conclusión:**
     - Transición de estado a `flowState === 'victory'`.
     - Reproducción de fanfarria triunfal mayor en Do (`victoryFanfare`).
     - Despliegue de la pantalla de victoria (`GameFlowOverlay`) resumiendo:
       - Enemigos aniquilados.
       - Orbes acumulados.
       - Cofres abiertos.
       - Nivel de Cuchillas del Caos.
       - Rango de honor espartano otorgado (`GUERRERO ESPARTANO` o `DIOS DE LA GUERRA`).

2. **Verificación Automatizada en Chrome DevTools Protocol (`scripts/verification/capture-combat.mjs`):**
   - Incorporar **Caso AB (`full_level1_playthrough`)**:
     - Carga del escenario `level1`.
     - Ejecución determinista tick a tick del recorrido integral (Popa -> Arena -> Mástil -> Checkpoint Proa -> Derrota de la Hidra -> Victoria).
     - Validación de hitos clave en telemetría:
       - Checkpoint `chk-popa` activado (`active === true`).
       - Al menos un cofre abierto (`openChestsCount >= 1`).
       - Arena activada y completada (`arenaActive` pasó de `true` a `false`).
       - Daño infligido y derrota final de la Hidra (`hydra.hp === 0`, `hydra.aiState === 'hydra_defeat'`).
       - Estado de flujo `victory` activo (`flowState === 'victory'`).
       - Reproducción de fanfarria (`soundStats.playCounts.victoryFanfare >= 1`).
     - Cero errores de consola en Chrome.
     - Generación de artefactos: mosaico `full_level1_playthrough_mosaic.png` y animación `full_level1_playthrough.gif`.

---

## 2. Invariantes y Regresiones Protegidas

- Compilación TypeScript (`tsc --noEmit`) y build de Vite (`pnpm build`) saliendo con código 0.
- Ausencia de fugas del arnés (`__GOW8B`) en `dist/`.
- Protección estricta de los 27 casos de prueba previos (Casos A a AA).
- Determinismo físico reproducible a 60 Hz en resolución lógica de 480×270.

---

## 3. Resultado de Auditoría Independiente

- **Dictamen:** **APROBADO** (2026-10-23)
- **Auditor:** Subagente Auditor Independiente (Modo Solo Lectura).
- **Evidencia Técnica:**
  - `pnpm exec tsc --noEmit && pnpm build` exit 0, cero fugas de `__GOW8B` en `dist/`.
  - Caso AB en `scripts/verification/capture-combat.mjs` completado exitosamente (96 pasos continuos):
    - Cofre de Popa abierto ($t=4$): `redChestState=open, absorbed=true, redOrbs=50`.
    - Checkpoint Popa activado ($t=10$): `chkId=chk-popa`.
    - Confinamiento en Arena Central ($t=22$): `arenaActive=true`.
    - Barreras de Ares disipadas tras derrotar oleadas ($t=30$): `arenaActive=false`.
    - Checkpoint Proa activado ($t=46$): `chkId=chk-proa`.
    - Derrota terminal de la Hidra ($t=71$): `hp=0, state=hydra_defeat, dead=true`.
    - Estado de victoria alcanzado ($t=75$): `flowState=victory, victoryVisible=true, rank=GUERRERO ESPARTANO`.
    - Fanfarria de victoria disparada ($t=80$): `fanfare=2 >= 1`.
    - Cero errores de consola en Chrome DevTools Protocol.
    - Artefactos `full_level1_playthrough_mosaic.png` y `.gif` generados en `scripts/verification/output/`.
  - Sin regresiones en los 27 casos previos (Casos A a AA).
