# Plan de implementación — `GOW8B-HYDRA-ART` (Arte de la Hidra: Jefe a Escala Naval)

- **Fecha:** 2026-10-23
- **Estado:** **APROBADO** (Completada y auditada independientemente el 2026-10-23).
- **Decisiones asociadas:** `D-03` (Lore del Egeo y la Hidra en God of War 1 PS2), `D-06` (roles orquestador / implementador / auditor), `D-12` (lienzo 480×270 a 60 Hz), `D-24` (escala monumental de jefes).
- **Objetivo:** Diseñar, generar e integrar el conjunto de sprites pixel-art original para el primer gran jefe del juego: la **Hidra de Lerna** (*Hydra*). El jefe debe reflejar la escala monumental canónica frente a Kratos en el navío de guerra ateniense, con cuello serpentino reptiliano, fauces acorazadas con colmillos de marfil, ojos ardientes y un repertorio de 8 fotogramas que cubran reposo, aviso de ataque (*telegraph*), embestida contra cubierta (*slam bite*), barrido bajo (*sweep*), impacto (*hurt*), aturdimiento vulnerable (*stagger*) y colapso (*defeat*), con canal alfa 100% binario y hoja de contacto de referencia.

---

## 1. Alcance y Especificación Funcional

1. **Jerarquía Visual y Escala Proporcional:**
   - Lienzo lógico: $480 \times 270\text{ px}$.
   - Kratos mide $\sim 50\text{ px}$ de altura útil en pose neutra ($64 \times 54\text{ px}$ sprite).
   - Dimensiones de fotograma de la Hidra: **$128 \times 112\text{ px}$**.
   - Spritesheet maestro de 8 fotogramas: **$1024 \times 112\text{ px}$** ubicado en `public/assets/characters/hydra.png`.
   - La cabeza y cuello de la Hidra abarcan $\sim 75\text{--}90\text{ px}$ de altura y $\sim 80\text{--}105\text{ px}$ de anchura, imponiéndose sobre Kratos sin sobrepasar los márgenes del escenario ni tapar la interfaz superior.

2. **Repertorio de 8 Poses Canónicas:**
   - `0_idle_1` ($0\text{--}128\text{ px}$): Cabeza ondulando suavemente sobre el oleaje, mirada depredadora fija en la cubierta, fauces entreabiertas exhalando vapor.
   - `1_idle_2` ($128\text{--}256\text{ px}$): Segundo cuadro de respiración orgánica y bamboleo serpentino en el mar.
   - `2_roar_telegraph` ($256\text{--}384\text{ px}$): Cabeza erguida hacia atrás, cuello ensanchado, fauces abiertas en ángulo de $85^\circ$ mostrando la garganta carmesí incandescente; aviso visual inequívoco previo al ataque.
   - `3_slam_bite` ($384\text{--}512\text{ px}$): Embestida fulminante en picado contra la cubierta; colmillos clavados en las tablas con astillas y mandíbula cerrada al nivel del suelo ($y = 111$).
   - `4_sweep` ($512\text{--}640\text{ px}$): Cabeza agachada y extendida horizontalmente a ras de cubierta, barriendo de proa a popa.
   - `5_hurt` ($640\text{--}768\text{ px}$): Retroceso violento con sacudida de cabeza, ojos semicerrados y escamas crispadas ante el impacto de las Cuchillas del Caos.
   - `6_stagger_vulnerable` ($768\text{--}896\text{ px}$): Cabeza desplomada exhausta sobre las maderas de la cubierta ($y = 111$), ojos aturdidos, fauces inertes; ventana óptima para combos del jugador.
   - `7_defeat` ($896\text{--}1024\text{ px}$): Agonía y sacudida final del monstruo marino antes de sumergirse en las aguas embravecidas del Egeo.

3. **Paleta y Calidad Gráfica:**
   - Paleta estricta de 14 colores inspirada en monstruos marinos de GoW 1:
     - Escamas serpentinas abisales: `#0f1d21`, `#162e34`, `#22444d`, `#32616d`, `#4d8493`.
     - Garganta y fauces carnosas: `#450a0a`, `#7f1d1d`, `#b91c1c`, `#ef4444`.
     - Colmillos y crestas óseas: `#9ca3af`, `#d1d5db`, `#f3f4f6`.
     - Ojos y fulgor del rugido: `#ea580c`, `#facc15`.
   - Canal alfa estrictamente binario ($a \in \{0, 255\}$), sin semitransparencias ni artefactos de compresión con pérdida.
   - Anclaje inferior estricto en poses de impacto/cubierta (`slam_bite`, `stagger`) en la línea de base $y = 111$.

4. **Herramientas de Generación y Validación Automatizada:**
   - Generador procedural paramétrico en `scripts/gen-enemy-hydra.py` que dibuje la anatomía completa (cuello anillado, placas dorsales, quijadas superior e inferior articuladas, ojos incandescentes y colmillos).
   - Validador estricto en `scripts/verify-enemy-hydra.py`:
     - Verificación de dimensiones de archivo ($1024 \times 112\text{ px}$).
     - Verificación de canal alfa binario puro.
     - Verificación de límite de paleta ($\le 16$ colores).
     - Verificación de bbox en cada fotograma y anclaje al suelo.
     - Generación de hoja de contacto con fondo transparente y cuadrícula en `docs/referencias/hydra-contact-sheet.png` a escala nativa y $2\times$ con silueta comparativa de Kratos.

5. **Integración en el Escenario y Verificación en Navegador:**
   - Carga de la textura `hydra` en `src/scene/ShellScene.ts`.
   - Animación de prueba o escena de presentación para verificar lectura visual a resolución nativa $480 \times 270$ sin errores en la consola de Chrome.

---

## 2. Invariantes y Regresiones Protegidas

- Cero errores de compilación TypeScript (`tsc --noEmit`) y build de Vite (`pnpm build`).
- Preservación estricta de los 23 casos de verificación previos (Casos A a W).
- Determinismo físico estricto a 60 Hz sin acumulación de flotantes.
- Sin fugas del arnés de desarrollo (`__GOW8B`) en el bundle productivo `dist/`.

---

## 3. Evidencia de Auditoría Independiente

- **Auditor:** Subagente independiente `01acf36e-053e-4f48-b4d9-de32dea2e091` (modo estrictamente de solo lectura).
- **Veredicto:** **APROBADO**.
- **Resultados cuantitativos y verificación:**
  - Hoja de sprites `public/assets/characters/hydra.png` con dimensiones exactas de $1024 \times 112\text{ px}$ (8 fotogramas ordenados de $128 \times 112\text{ px}$).
  - Canal alfa $100\%$ binario ($a \in \{0, 255\}$), 0 violaciones detectadas.
  - Paleta contenida de exactamente 14 colores consistentes ($\le 16$ requeridos), con detección confirmada de fulgor ámbar/oro en ojos (`#facc15`, `#ea580c`) y tonos carmesí en fauces (`#b91c1c`, `#ef4444`, `#7f1d1d`).
  - Anclaje inferior estricto en la línea de cubierta $y = 111$ (`bbox[3] == 112`) verificado en fotogramas 3 (`slam_bite`) y 6 (`stagger_vulnerable`).
  - Hoja de contacto `docs/referencias/hydra-contact-sheet.png` verificada ($1314 \times 526\text{ px}$), con visualización a $1\times$ y $2\times$, muestra de paleta y silueta comparativa de Kratos.
  - `python3 scripts/verify-enemy-hydra.py`: código de salida 0 (todas las aserciones pasadas con éxito).
  - Integración en `src/scene/ShellScene.ts`: precarga de textura y creación de animaciones (`hydra-idle`, `hydra-roar`, `hydra-slam`, `hydra-sweep`, `hydra-hurt`, `hydra-stagger`, `hydra-defeat`).
  - `pnpm exec tsc --noEmit && pnpm build`: salida código 0 en 5.7s, 0 fugas en `dist/`.
  - Chrome CDP (`capture-combat.mjs`): 23/23 casos aprobados (Casos A a W) con determinismo estricto y 0 errores de consola.

