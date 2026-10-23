# `GOW8B-ART-KRA` / `KRATOS-2D-SPRITE-GEN-01` — Arte fino del personaje (Kratos GoW 1) en pixel art 2D

- **Fecha:** 2026-10-23
- **Estado:** **COMPLETADA Y AUDITADA**
- **Rama:** `tarea/GOW8B-ART-KRA`
- **Etapa en `docs/verificacion.md`:** Orden 28, `GOW8B-ART-KRA` (Bloque 11)
- **Motivo:** Reemplazo integral del maniquí provisional procedural por los 22 fotogramas canónicos de Kratos de *God of War 1* (PS2) adaptados fielmente a pixel art lateral 16-bit.

---

## 1. Alcance y especificación canónica (22 fotogramas)

El contrato de poses definido en `scripts/sprite-gen/poses.json` se completó al 100 % (22/22 fotogramas) en 5 hojas de spritesheets:

1. **Reposo (`kratos-idle.png`, 194×59 px, 2 fotogramas de 97×59 px):**
   - `idle_0`: Postura de combate simétrica, torso en V, piel gris ceniza, tatuaje carmesí de Ares, faldón con pteruges, Cuchillas del Caos gemelas descansando en ambos costados apuntando arriba en media luna.
   - `idle_1`: Respiración sutil con elevación torácica y tensión de cadenas en antebrazos.
2. **Carrera y derrape (`kratos-run.png`, 679×59 px, 7 fotogramas de 97×59 px):**
   - `run_0` a `run_5`: Ciclo continuo de zancada espartana de 6 fotogramas con inclinación frontal, empuje muscular y balanceo dinámico de Cuchillas.
   - `run_6`: Fotograma estático de frenado en seco con derrape (*skid*), torso retrasado y talón clavado.
3. **Fase aérea (`kratos-air.png`, 194×59 px, 2 fotogramas de 97×59 px):**
   - `air_0`: Vuelo ascendente con silueta impulsada hacia arriba, piernas recogidas.
   - `air_1`: Caída gravitacional con faldón flameando y brazos extendidos hacia abajo.
4. **Repertorio de ataque (`kratos-attack.png`, 679×59 px, 7 fotogramas de 97×59 px):**
   - `atk_0` (Startup): Flexión preparatoria con ambas Cuchillas listas.
   - `atk_1` (Light 1): Tajo horizontal de mano derecha; mano delantera libre (`rear_only`) para que `WeaponLayer` trace la cadena y hoja dinámica sin duplicidad.
   - `atk_2` (Recovery): Recuperación en guardia baja.
   - `atk_3` (Plume of Prometheus): Clavado bimano hacia el suelo (`rear_only`) para impacto sísmico.
   - `atk_4` (Ascension launcher): Gancho ascendente vertical (`rear_only`).
   - `atk_5` (Chain grab / Orion's Harpoon): Lanzamiento frontal de cadena en tensión (`rear_only`).
   - `atk_6` (Alternate slash / Olympic Slash): Tajo inverso con alternancia de brazos (`rear_only_opposite`).
5. **Voltereta y esquiva (`kratos-roll.png`, 388×59 px, 4 fotogramas de 97×59 px):**
   - `roll_0`: Zambullida rasa con brazos al frente.
   - `roll_1`: Ovillo compacto rodando sobre la espalda a ras de suelo ($y=58$).
   - `roll_2`: Desenrollado y deslizamiento rasante de salida.
   - `roll_3`: Guardia baja de recuperación pos-rodada.

---

## 2. Pipeline de cuantización y ensamblado

1. **Generación con fondo magenta puro (`#FF00FF`):** 1024×1024 px por fotograma, relación de aspecto fija para escala anatómica consistente.
2. **Paleta compartida de 12 colores (`_palette.png`):**
   - Mapeo estricto que reserva acentos clave:
     - Tatuaje de Ares: `#b03028`
     - Runas de las Cuchillas del Caos: `#ff8c1a`
     - Acero de las hojas: `#e8e8e8`, `#808080`, `#2a2a2a`
     - Tono muscular espartano: `#a89f91`, `#70685e`, `#403b35`
     - Cuero y bronce: `#c08830`, `#604018`
     - Negros de contorno: `#0a0a0c`
3. **Escala fija y anclaje al suelo:**
   - Factor de escala con filtro de caja (`56 / 870`).
   - Anclaje de suelo estricto en $y=58$ (`bbox[3] == 59`).
   - Canal alfa 100 % binario (sin transparencias parciales degradadas).

---

## 3. Evidencia de verificación técnica y en ejecución

1. **Chequeo de ensamblado (`python3 scripts/sprite-gen/assemble.py --check`):**
   - `kratos-idle.png`: 2/2 COMPLETA
   - `kratos-run.png`: 7/7 COMPLETA
   - `kratos-air.png`: 2/2 COMPLETA
   - `kratos-attack.png`: 7/7 COMPLETA
   - `kratos-roll.png`: 4/4 COMPLETA
   - Total: 22/22 fotogramas válidos.
2. **Propiedades de imagen:**
   - Modo `RGBA`, 13 valores (12 colores + transparencia completa).
   - Altura exacta de 59 px; anchos múltiplos exactos de 97 px.
3. **Compilación y typecheck:**
   - `pnpm exec tsc --noEmit` exit 0.
   - `pnpm build` exit 0, tamaño de bundle óptimo, cero fugas de arnés `__GOW8B`.
4. **Batería de pruebas automatizadas en Chrome CDP (`scripts/verification/capture-combat.mjs`):**
   - Determinismo y checksums idénticos (`07429977`, `35c6e843`, `bf8693ad`, etc.).
   - 28 casos de verificación probados consecutivamente de Caso A a Caso AB con 100 % de éxito y 0 errores de consola.
