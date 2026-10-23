# `GOW8B-FINAL-01` — Auditoría final independiente del producto integrado

- **Fecha:** 2026-10-23
- **Estado:** **APROBADA TRAS AUDITORÍA INDEPENDIENTE**
- **Rama:** `tarea/GOW8B-FINAL-01`
- **Etapa en `docs/verificacion.md`:** Orden 34, `GOW8B-FINAL-01` (Bloque 12)
- **Motivo:** Auditoría integral final del producto terminado a 60 Hz en resolución lógica 480×270, validando la integración armoniosa de todos los subsistemas (combate, locomoción, enemigos, jefe naval, economía, audio procedural, VFX, UI y nivel continuo) y la ausencia total de fugas del arnés en producción.

---

## 1. Alcance y subsistemas integrados bajo auditoría

1. **Arquitectura y simulación determinista:**
   - Bucle a 60 Hz desacoplado del refresco del monitor con paso temporal constante ($\Delta t = 1/60\text{ s}$).
   - Integridad matemática validada con checksums de física reproducibles (`scaleChecksum: 07429977`, `init_empty: 35c6e843`, `combat60: a6a2bf09`).
   - Cero dependencias externas propietarias, librerías de terceros no autorizadas ni archivos de audio/sprites con copyright.
2. **Kratos y Cuchillas del Caos (Pixel Art 16-bit Original):**
   - Repertorio canónico de 22 fotogramas en 5 hojas (`idle_0..1`, `run_0..6`, `air_0..1`, `atk_0..6`, `roll_0..3`).
   - Dimensiones exactas de 97×59 px por cuadro, pies anclados en $y=58$, canal alfa binario, paleta compartida de 12 colores.
   - `WeaponLayer`: Trazado procedural dinámico de cadenas articuladas de 14 eslabones y hojas gemelas con estela translúcida.
   - Movilidad: aceleración con inercia, derrape en giro (*skid*), aterrizaje elástico (*squash & stretch*), salto simple y doble salto parabólico, rodada terrestre con 13 ticks de inmunidad y salida ágil a ataque.
   - Combate PS2: cadenas ligeras `J,J,J` y `J,J,J,J`, remate *Spirit of Hercules* `J,J,J,K`, azote terrestre *Plume of Prometheus* con elevación de víctimas, *Ascension launcher*, agarre aéreo *Orion's Harpoon*, *Olympic Slash* tras rodada/carrera.
   - Defensa: guardia frontal y desvío perfecto *Parry* de 6 ticks con `Q` para reflejar proyectiles y desestabilizar esbirros.
   - Magia: *Ira de Poseidón* (`U`/`I`, 35 MP) con super-armadura y tormenta eléctrica AoE multi-hit.
3. **Elenco hostil y Boss Naval:**
   - Legionario No-Muerto de Ares (`legionnaire.png`, 8 fotogramas 64×54 px, 12 colores, IA reactiva a guardia, parry y juggling).
   - Arquero No-Muerto de Ares (`archer.png`, 8 fotogramas 64×54 px, 11 colores, proyectil `arrow.png` 16×8 px a 280 px/s, reflejable a 420 px/s).
   - Hidra de Lerna (`hydra.png`, 8 fotogramas 128×112 px, 14 colores abisales, 300 HP, telegraph de rugido, slam en cubierta con colmillos clavados vulnerables durante 45 ticks, barrido rasante, barra monumental de jefe en HUD y eclosión de 19 orbes).
4. **Nivel continuo del Egeo y plataformas:**
   - Escenario naval de 1440 px estructurado en 3 segmentos: Popa ($0..480\text{ px}$), Arena Central ($480..960\text{ px}$) y Proa ($960..1440\text{ px}$).
   - Barreras mágicas rojas de Ares y confinamiento en combate durante las 2 oleadas del `WaveManager`.
   - 5 plataformas canónicas con saltos traversales y descenso voluntario (*drop-through*, $\downarrow$ + salto).
   - Checkpoints divinos de columnas doradas en Popa ($x=140$) y Proa ($x=980$) con captura atómica de instantánea y reaparición tras muerte con `R`.
   - Cofres contextuales con apertura `E`: Ojos de Górgona (+20 HP máx), Plumas de Fénix (+20 MP máx) y Orbes Rojos (+50). Mejora de Cuchillas a Nivel 2 (+30 % daño) con `P`.
5. **Presentación, VFX y Audio:**
   - Flujo de juego: Título con omega de Ares, juego activo, menú de pausa determinista (`ESC`) con resumen de atributos y tabla de combos, victoria con rango espartano al vencer a la Hidra, y game over adaptativo.
   - HUD clásico de GoW 1: barra de vida de 110 px con drenaje suave fantasma, barra de maná azul zafiro, medidores de 6 ojos y 6 plumas, contador de orbes rojos.
   - VFX del Egeo: lluvia marina bicapa (fondo y frente $\le 0.38$ de opacidad), relámpagos con decaimiento, chispas de impacto, destello estelar de parry.
   - Motor de audio procedural WebAudio nativo: síntesis matemática en tiempo real para todos los efectos acústicos, mute con tecla `M`, telemetría de eventos sonoros.

---

## 2. Criterios de Aceptación y Evidencia Medida

1. **Compilación y Empaquetado:**
   - `pnpm exec tsc --noEmit && pnpm build`: **EXIT CODE 0** (42 módulos compilados limpiamente).
   - `grep -rn "__GOW8B" dist/`: **0 coincidencias** (arnés confinado).
2. **Determinismo y Física en Chrome CDP:**
   - `node scripts/verification/capture-combat.mjs`: **100 % de éxito en los 28 casos (Casos A a AB)**.
   - **0 errores en consola de Chrome**.
3. **Auditoría de Assets Pixel Art:**
   - 9 spritesheets inspeccionados: canal alfa 100% binario, anclajes de pies/cubierta exactos, paletas contenidas ($\le 12$ colores para Kratos y Legionario, $\le 11$ para Arquero, $\le 14$ para Hidra).
4. **Veredicto del Auditor Independiente:**
   - Dictamen: **APROBADA** (ver informe completo en transcripción y cierre de etapa).
