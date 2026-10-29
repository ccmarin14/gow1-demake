# Plan de implementación — `GOW8B-HUD-01` (HUD de Vida Clásico de God of War 1)

- **Fecha:** 2026-10-22
- **Estado:** **APROBADO** (Completada y auditada independientemente el 2026-10-22).
- **Decisiones asociadas:** `D-03` (Lore y estética de God of War 1 PS2), `D-04` (recursos originales), `D-06` (roles orquestador / implementador / auditor), `D-12` (lienzo 480×270), `D-24` (combate 2D).
- **Objetivo:** Implementar la interfaz de usuario en pantalla (HUD) clásica de *God of War 1* (PS2) adaptada al lienzo 480×270: barra de salud verde con marco de bronce y piedra griega en la esquina superior izquierda, barra fantasma (*ghost health*) de drenaje suave al recibir impactos, aviso de peligro en salud crítica ($\le 25\%$) y reseteo inmediato al reiniciar.

---

## 1. Alcance y Criterios de Aceptación

1. **Diseño Visual e Identidad Canónica (GoW 1 PS2 en 2D):**
   - Ubicación fija en pantalla (`setScrollFactor(0)`): esquina superior izquierda ($x=16, y=14$).
   - **Marco ornamental:** ribete de bronce y piedra griega tallada con contorno oscuro (`#1a110e`), tonos bronce (`#855e25`, `#c49a45`) y emblema circular en el nacimiento izquierdo.
   - **Barra de salud verde:** barra interior de $110\text{ px}$ de longitud máxima rellena en verde esmeralda brillante (`#22c55e`, base oscura `#14532d` y brillo superior `#86efac`).
   - **Barra fantasma (*Ghost Health*):** al recibir daño, la barra verde cae de inmediato al nuevo valor de vida, mientras una barra de residuo rojo/ámbar desciende suavemente tras una pausa de 12 ticks (200 ms), proporcionando la lectura visual clásica de la magnitud del golpe recibido.
   - **Alerta de salud crítica:** cuando $\text{hp} \le 25$, la barra pulsa suavemente en tinte rojizo advirtiendo del peligro inminente.
2. **Arquitectura e Integración Técnica (`src/ui/HudLayer.ts`):**
   - Clase modular desacoplada `HudLayer` instanciada en `ShellScene.ts`.
   - Método `update(player: EntityState | undefined, dt: number)` que actualiza la geometría, el ancho del relleno y la interpolación del ghost bar.
   - Sin acoplamiento a la lógica de simulación pura (el HUD solo lee `player.hp`, `player.maxHp`, `player.isDead`).
3. **Verificación Automatizada con Chrome CDP (`capture-combat.mjs`):**
   - Nuevo Caso L (`hud_health_bar_presentation`):
     - Verificación del renderizado del HUD en pantalla fija.
     - Medición del ancho de la barra al sufrir daño: cae instantáneamente al porcentaje correspondiente ($88\%$).
     - Medición de la barra fantasma: permanece superior a $88\%$ durante la pausa y desciende gradualmente.
     - Vaciado total de la barra al alcanzar $\text{hp} = 0$.
     - Restauración inmediata al $100\%$ al presionar `'restart'` (tecla `R`).
   - Determinismo estricto verificado (`deterministic: true`).
   - 0 errores de consola en Chrome headless.
   - `tsc --noEmit && pnpm build` con código 0 y 0 fugas de `__GOW8B` en producción.

---

## 2. Asignación de Roles (AGENTS.md)

- **Orquestador (agente principal):** Redacta el plan, define los criterios, coordina subagentes y contrasta evidencia.
- **Implementador (subagente):** Implementa `src/ui/HudLayer.ts`, integra en `ShellScene.ts` y añade Caso L en `capture-combat.mjs`.
- **Auditor Independiente (subagente distinto):** Verifica en modo de solo lectura el HUD, lectura visual, comportamiento de barra fantasma, build y no regresión.

---

## 3. Evidencia de Auditoría Independiente

- **Auditor:** Subagente independiente `01acf36e-053e-4f48-b4d9-de32dea2e091` (solo lectura).
- **Veredicto:** **APROBADO**.
- **Resultados de ejecución:**
  - `pnpm exec tsc --noEmit && pnpm build` exitoso (código de salida 0 en 5.97s, 0 fugas de `__GOW8B` en `dist/`).
  - Módulo modular `src/ui/HudLayer.ts` verificado con `setScrollFactor(0)`, profundidad fija, medallón espartano, marco de piedra/bronce, notches cada 20 HP, barra verde esmeralda y barra fantasma.
  - Reubicación de `debugText` en `ShellScene.ts` a `(155, 6)` eliminando colisiones visuales con el HUD.
  - Verificación CDP en `scripts/verification/capture-combat.mjs`:
    - `deterministic: true` verificado.
    - No regresión en Casos A a K.
    - **Caso L (`hud_health_bar_presentation`) verificado:**
      - Barra inicial completa a $110\text{ px}$ ($100\%$).
      - Caída inmediata tras impacto a $97\text{ px}$ ($88\%$).
      - Retención en pausa de la barra fantasma a $110\text{ px}$ durante $200\text{ ms}$ y drenaje suave posterior a $45\text{ px/s}$.
      - Vaciado total a $0\text{ px}$ en derrota.
      - Restauración instantánea a $110\text{ px}$ tras reinicio con tecla `R`.
  - 0 errores de consola en Chrome headless.
