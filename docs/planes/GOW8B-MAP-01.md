# Plan de implementación — `GOW8B-MAP-01` (Mapa del Primer Nivel: Estructura Lateral, Segmentos y Cámara)

- **Fecha:** 2026-10-23
- **Estado:** **APROBADO** (Completada y auditada independientemente el 2026-10-23).
- **Decisiones asociadas:** `D-03` (Lore y ambientación canónica del Mar Egeo de God of War 1), `D-06` (roles orquestador / implementador / auditor), `D-12` (lienzo 480×270 a 60 Hz), `D-20` (encuadre horizontal y ritmo lateral inspirado en Betrayal).
- **Objetivo:** Expandir el espacio de juego desde el lienzo estático de pantalla fija hacia un **mapa lateral continuo de $1440\text{ px}$** ($3 \times 480\text{ px}$) que representa la cubierta completa del navío de guerra espartano en el Mar Egeo, estructurado en tres segmentos narrativos: Popa (recorrido inicial seguro), Cubierta Central (arena de refriega con horda) y Proa (acercamiento al mástil y mascarón). Incluye seguimiento horizontal de cámara suave con zona muerta (*deadzone*), anclaje de cámara durante arenas de combate, y fondo marino de tormenta con *parallax* multicapa desacoplado.

---

## 1. Alcance y Especificación Funcional

1. **Estructura y Datos del Mapa (`src/sim/map.ts` y `src/config.ts`):**
   - Configuración centralizada `CONFIG.map.level1`:
     - Ancho total: $1440\text{ px}$ (tres pantallas completas de 480 px).
     - Altura útil: $270\text{ px}$.
     - Línea de cubierta base: $y = 262\text{ px}$ a lo largo de los $1440\text{ px}$.
     - Segmentos canónicos:
       - **Segmento 1 — Popa / Cubierta inicial:** $[0 .. 480\text{ px}]$, zona de navegación libre y adaptación motriz.
       - **Segmento 2 — Cubierta central / Arena de Ares:** $[480 .. 960\text{ px}]$, zona de combate cerrada con barreras en $x=550$ y $x=890$ (área de $340\text{ px}$ para combate por oleadas).
       - **Segmento 3 — Proa / Mástil de guerra:** $[960 .. 1440\text{ px}]$, zona de transición hacia el mascarón y encuentro con la Hidra.

2. **Cámara 2D de Seguimiento Horizontal:**
   - Parámetros de cámara:
     - Ventana visible: $480 \times 270\text{ px}$.
     - *Deadzone* horizontal: $\pm 32\text{ px}$ respecto al centro de pantalla ($x = 240$).
     - Rango de scroll: $scrollX \in [0 .. 1440 - 480] = [0 .. 960\text{ px}]$.
     - Suavizado cinemático / seguimiento: interpolación elástica o seguimiento exacto dentro de la ventana activa.
     - **Modo Arena (Lock):** al activarse un encuentro de combate en el Segmento 2, la cámara se ancla firmemente en $scrollX = 480\text{ px}$ encuadrando exactamente la arena de batalla. Al disiparse las barreras, reanuda el seguimiento suave de Kratos hacia la proa.

3. **Capa Visual y Parallax Marino (`src/scene/ShellScene.ts`):**
   - El fondo del Mar Egeo (`egeo-fondo-480x270.png`) se extiende con repetición en mosaico horizontal (*tileSprite*) o scroll con factor parallax $0.25\times$.
   - La cubierta de madera transitable, barandas y tablas se renderizan a lo largo de toda la longitud del mapa ($1440\text{ px}$).
   - Los elementos de HUD (vida, maná, orbes, banners) conservan `scrollFactor = 0`, permaneciendo fijos e inalterables en pantalla independientemente del scroll de la cámara.

4. **Escenario y Simulación Determinista (`src/sim/scenarios.ts` y `src/sim/world.ts`):**
   - Escenario `'level1'` (o `'aegean'`):
     - Plataforma continua: $\{ x_1: 0, x_2: 1440, yTop: 262 \}$.
     - Kratos inicializado en $x = 100$ (Popa).
     - Oleada programada en la arena de cubierta central ($x \in [550 .. 890]$).
   - Invariante de aislamiento: los escenarios de prueba anteriores (`'platforms'`, `'combat'`, `'legionnaire'`, `'archer'`, etc.) continúan usando su geometría de 480 px fija para garantizar cero alteración en los checksums baseline ni en los Casos A a Q.

5. **Automatización y Pruebas en Chrome CDP (`scripts/verification/capture-combat.mjs`):**
   - **Caso R (`map_scroll_and_segments`):**
     - Recorrido de Kratos en Popa ($x=100 \rightarrow 300$).
     - Entrada al Segmento 2 ($x \approx 600$): verificación de bloqueo de cámara en $scrollX = 480\text{ px}$ y confinamiento de arena.
     - Derrota de oleada y liberación de barreras: la cámara desbloquea el scroll.
     - Avance hacia Proa ($x > 1200\text{ px}$): verificación de cámara alcanzando el límite derecho ($scrollX \ge 900\text{ px}$).
     - Comprobación de determinismo estricto y 0 errores de consola.

---

## 3. Evidencia de Auditoría Independiente

- **Auditor:** Subagente independiente `01acf36e-053e-4f48-b4d9-de32dea2e091` (solo lectura).
- **Veredicto:** **APROBADO**.
- **Resultados cuantitativos y verificación:**
  - Configuración centralizada en `CONFIG.map.level1`: ancho total de 1440 px, segmentos (Popa $[0..480]$, Arena Central $[480..960]$ con barreras en $x=550$ y $x=890$, Proa $[960..1440]$), cámara con deadzone de 32 px, scroll de 0 a 960 px y parallax factor de 0.25.
  - Módulo puro `src/sim/map.ts` desacoplado de Phaser con resolución de segmentos y cálculo de scroll.
  - Preservación estricta de escenarios previos de 480 px con checksums baseline idénticos.
  - Presentación visual con `TileSprite` y parallax marino suave ($0.25\times$), con `setScrollFactor(0)` garantizado en todos los elementos del HUD.
  - `pnpm exec tsc --noEmit && pnpm build`: salida código 0 en 5.50s, 0 fugas en `dist/`.
  - Chrome CDP (`capture-combat.mjs`): 18/18 casos aprobados (Casos A a R), determinismo estricto y 0 errores de consola.
  - Caso R verificado: $t=1$ en Popa ($x=100$, $cameraX=0$), $t=16$ inicio de scroll ($x=300.9$, $cameraX=28.9$), $t=26$ entrada a Arena y anclaje rígido en $cameraX=480$, $t=46$ disipación de barreras, $t=76$ desbloqueo de cámara, $t=85$ avance a Proa con límite de scroll ($x=1254.4$, $cameraX=960$).
  - Artefactos visuales: `map_scroll_and_segments_mosaic.png` y `map_scroll_and_segments.gif`.
