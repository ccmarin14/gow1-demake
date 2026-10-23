# Plan de implementación — `GOW8B-AUDIO-01` (Diseño Sonoro y Síntesis Procedural de Audio del Egeo)

- **Fecha:** 2026-10-23
- **Estado:** **APROBADO** (Auditoría independiente completada sin observaciones).
- **Decisiones asociadas:** `D-03` (Lore y atmósfera épica de God of War 1 PS2), `D-06` (roles orquestador / implementador / auditor), `D-12` (lienzo 480×270 a 60 Hz), `D-24` (fidelidad auditiva sin recursos externos con copyright).
- **Objetivo:** Implementar la arquitectura y el motor completo de sonido para el juego mediante síntesis procedural con la API estándar de **WebAudio** (`AudioContext`). Genera efectos sonoros (SFX) $100\%$ originales sin archivos externos pesados ni problemas de derechos de autor: tajos de cadenas, latigazos y remate sísmico, campanilleo de desvío perfecto (*Parry*), trueno de la *Ira de Poseidón*, rugido y embestida de la Hidra de Lerna, absorción de orbes y fanfarria triunfal espartana, con control de volumen maestro y conmutación de silencio (`M`).

---

## 1. Alcance y Especificación Funcional

1. **Configuración Centralizada de Audio (`src/config.ts`):**
   - Incorporar en `CONFIG.audio`:
     - `masterVolume: 0.70`.
     - `sfxVolume: 0.85`.
     - `musicVolume: 0.50`.
     - `enabled: true`.
     - Parámetros acústicos para perfiles de sonido:
       - `slash`: frecuencia base 440 Hz, caída a 110 Hz en 120 ms.
       - `heavySlam`: frecuencia 120 Hz a 35 Hz con transitorio de ruido en 250 ms.
       - `parry`: resonancia metálica armónica (880, 1320, 1760 Hz) con decaimiento en 350 ms.
       - `magic`: pulso eléctrico modulado a 60 Hz con estallido blanco.
       - `roar`: frecuencia modulada a 55 Hz con oscilador sawtooth y filtro pasabanda.
       - `orb`: arpegio ascendente brillante (523, 659, 784 Hz).
       - `fanfare`: cadencia heroica dorada.

2. **Motor de Síntesis Procedural (`src/audio/SoundManager.ts`):**
   - Creación y gestión de `AudioContext` nativo sin librerías externas.
   - Manejo seguro de políticas de *autoplay* de navegadores modernos (desbloqueo en primera pulsación de tecla).
   - Generadores de sonido procedural:
     - `playSlash(heavy?: boolean)`: tajos ligeros o pesados de las Cuchillas del Caos.
     - `playGroundImpact()`: azote de cadenas contra el suelo con resonancia de madera.
     - `playParry()`: campana de bronce vibrante de bloqueo perfecto.
     - `playHit()`: impacto carnal/metálico al conectar tajos contra legionarios o arqueros.
     - `playMagicThunder()`: descarga eléctrica continua de la *Ira de Poseidón*.
     - `playHydraRoar()`: rugido gutural de baja frecuencia telegrafiado.
     - `playHydraSlam()`: crujido de cubierta y choque sísmico.
     - `playOrbAbsorb(type: 'red' | 'green' | 'blue')`: campanilleo cristalino al absorber orbes.
     - `playChestOpen()`: apertura de tapa de piedra con liberación de gema.
     - `playVictoryFanfare()`: acorde mayor heroico al triunfar sobre la Hidra.
   - Conmutador de silencio (*Mute*): tecla `M` para silenciar/activar todo el audio sin alterar la simulación.

3. **Integración en `src/scene/ShellScene.ts`:**
   - Instanciar `soundManager: SoundManager`.
   - Conectar los eventos de simulación con los generadores de sonido correspondientes (ataque, golpe, parry, magia, orbes, rugido de hidra y victoria).

4. **Prueba Automatizada en Chrome DevTools Protocol (`scripts/verification/capture-combat.mjs`):**
   - **Caso AA (`audio_synthesis_and_sound_events`):**
     - Inicialización del contexto de audio (`audioContext.state !== 'closed'`).
     - Emisión de eventos de sonido verificada por telemetría del `SoundManager`:
       - Disparo de tajo `slash` al atacar con `J`.
       - Disparo de `hit` y `sparks` al conectar con enemigo.
       - Disparo de `parry` al desviar flecha.
       - Disparo de `magicThunder` al invocar Ira de Poseidón.
       - Disparo de `hydraRoar` al comenzar el telegrafiado de la Hidra.
       - Disparo de `orbAbsorb` al recolectar orbes.
       - Conmutación de silencio con tecla `M` (`muted === true`).
     - Cero errores en consola de Chrome.
     - Generación de mosaico `audio_synthesis_and_sound_events_mosaic.png` y animación `.gif`.

---

## 2. Invariantes y Regresiones Protegidas

- Cero errores de compilación TypeScript (`tsc --noEmit`) y build de Vite (`pnpm build`).
- Preservación estricta de los 26 casos de verificación previos (Casos A a Z).
- Determinismo físico estricto a 60 Hz sin acumulación de flotantes.
- Sin fugas del arnés de desarrollo (`__GOW8B`) en el bundle productivo `dist/`.

---

## 3. Resultado de Auditoría Independiente

- **Dictamen:** **APROBADO** (2026-10-23)
- **Auditor:** Subagente Auditor Independiente (Modo Solo Lectura).
- **Evidencia Técnica:**
  - `pnpm exec tsc --noEmit && pnpm build` exit 0, cero fugas de `__GOW8B` en `dist/`.
  - Caso AA en `scripts/verification/capture-combat.mjs` completado exitosamente:
    - `isReady=true, muted=false` en $t=1$.
    - Conteo de sonidos: `slash=26`, `hit=33`, `magic=3`, `orb=13`, `parry=8`, `roar=4`.
    - Conmutación `M` verificada (`muted=true` -> `muted=false, total=101`).
    - Cero errores de consola en Chrome DevTools Protocol.
    - Artefactos `audio_synthesis_and_sound_events_mosaic.png` y `.gif` generados en `scripts/verification/output/`.
  - Sin regresiones en los 26 casos previos (Casos A a Z).
