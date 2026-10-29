# Plan de pulido visual y de assets — `GOW8B-ART-POLISH-01`

**Estado:** **CERRADO Y APROBADO** (2026-10-21) tras implementación por subagente (`f6244a35-018f-4497-8e33-4933aa23bff6`) y auditoría independiente de solo lectura (`8fc183e0-f1ed-4a09-b266-05f45e20df08`). Evidencia consolidada en [`docs/verificacion.md`](../verificacion.md#gow8b-art-polish-01--pulido-visual-de-spritesheets-arma-y-plataformas-2026-10-21).
**Objetivo:** elevar la calidad visual de los spritesheets de Kratos (`idle`, `run`, `air`, `attack`, `roll`), la capa visual de las Cuchillas del Caos (`WeaponLayer`), las plataformas de escena y la limpieza del golpe en pantalla (resolviendo la deuda `HC-1`), manteniendo el 100 % de las invariantes técnicas y de simulación (`97×59` por cuadro, paleta exacta de 6 colores de `kratos-neutral.png`, pies anclados en `y=58`, `CONFIG.scale` y checksums deterministas intactos).

---

## 1. Diagnóstico visual (inspección directa de `kratos-anim-contact-sheet.png` y `egeo-fondo.png`)

1. **Brecha entre `kratos-neutral.png` y las hojas generadas (`idle`/`run`/`air`/`attack`/`roll`):**
   - En `docs/referencias/kratos-anim-contact-sheet.png`, la pose neutral de referencia (arriba a la izquierda) muestra a un Kratos heroico y musculoso en 3/4 lateral: torso ancho en V con pectorales iluminados (`HI`/`MID`) y sombreados (`SHADOW`), tatuaje rojo de Ares (`DARK`) cruzando ojo, cráneo, hombro y pecho, faldón espartano acampanado con tiras de cuero (`LEATHER`/`DARK`) y cinturón, brazaletes pesados en los antebrazos y grebas en las espinillas.
   - En cambio, las filas generadas por `scripts/gen-kratos-anim.py` dibujan un maniquí delgado de ~10 px de ancho con cabeza cuadrada y extremidades de palito.
2. **Rectángulo de debug sobre las Cuchillas del Caos (`HC-1`):**
   - `ShellScene.ts` muestra `attackHitboxRect` siempre, tiñendo de rojo/naranja la hoja del arma durante el ataque. Debe mostrarse únicamente en DEV cuando el overlay de referencia (`G`, `isScaleReferenceVisible()`) esté activo.
3. **Cuchillas del Caos y plataformas demasiado esquemáticas:**
   - `WeaponLayer.ts` dibuja la hoja como un único rectángulo plano sin guardia ni filo diferenciado.
   - `ShellScene.ts` dibuja todas las plataformas como dos rectángulos planos, sin divisiones de tablones ni bisel de madera acorde a `egeo-fondo.png`.

---

## 2. Alcance y archivos a modificar

### 2.1. `scripts/gen-kratos-anim.py` y assets generados
Rediseñar `draw_pose` en `scripts/gen-kratos-anim.py` conservando **estrictamente**:
- Dimensiones de cada cuadro: `97×59` (`FRAME_W = 97`, `FRAME_H = 59`).
- Cantidad de cuadros por hoja: `kratos-idle.png` (2), `kratos-run.png` (6), `kratos-air.png` (2), `kratos-attack.png` (3), `kratos-roll.png` (4).
- Paleta exacta de 6 colores verificada contra `kratos-neutral.png`: `PALETTE = [OUTLINE, DARK, LEATHER, SHADOW, MID, HI]` (`assert set(cols) == set(PALETTE)`).
- Anclaje de pies por bounding-box alfa en `y = 58` (`FRAME_H - 1`).

**Mejoras anatómicas y de pixel art en `draw_pose`:**
- **Torso heroico en V (3/4 lateral):** espalda dorsal y pecho ancho (~16–18 px en hombros estrechándose a ~11–12 px en cintura), con volumen pectoral en `HI`/`MID`, sombra lateral/abdominal en `SHADOW`, contorno `OUTLINE` y **tatuaje rojo (`DARK`)** recorriendo el hombro izquierdo, pectoral y oblicuo.
- **Cabeza con carácter:** cráneo redondeado con ceño marcado, ojo claro (`HI`), barba/perilla espartana en `OUTLINE`/`DARK` en el mentón y franja del tatuaje rojo (`DARK`) cruzando desde el ojo hasta la coronilla.
- **Brazos musculosos y brazaletes de cadena:** deltoides redondeados (grosor 5–6 px), bíceps en `HI`/`MID` (brazo cercano) y `SHADOW`/`MID` (brazo lejano), y **antebrazos con brazaletes de cuero y bronce/cadenas** (`LEATHER`, `DARK`, `SHADOW` y remaches en `MID`).
- **Faldón espartano (pteruges) y cinturón:** cinturón ancho con hebilla/placa en `MID`/`SHADOW`, faldón acampanado con tiras verticales alternando `LEATHER`, `DARK` y `OUTLINE`.
- **Piernas musculosas y grebas:** muslos potentes (grosor 5–6 px con luz `HI` frontal y sombra `SHADOW` trasera), rodilleras y **grebas/botas espartanas** en `LEATHER`/`DARK`/`SHADOW` con suela firme.
- **Actualización de `docs/referencias/kratos-anim-contact-sheet.png`:** añadir en el propio script (o regenerar) la hoja de contacto con las 5 tiras actualizadas junto a `kratos-neutral.png`.

### 2.2. `src/entities/WeaponLayer.ts` y `src/config.ts`
- Enriquecer `WeaponLayer` para que las Cuchillas del Caos tengan lectura de arma real sin perder las garantías de `CHAOS-01`:
  - **Cadena:** mantener los segmentos en `weaponChainColor` (`0x9e9e9e`) a lo largo de `grip → bladeCenter` y alternar pequeños eslabones de sombra/brillo para dar textura de cadena metálica.
  - **Hoja compuesta:** mantener el cuerpo principal de la hoja en `weaponBladeColor` (`0xfff1c9`) centrado en `bladeCenterX/Y` y orientado con `-pose.angleRad * (player.facing === -1 ? -1 : 1)`, añadiendo una guardia/lomo en bronce oscuro (`0x6b4f2a` / `0xff8800`) para que la hoja tenga silueta de Cuchilla del Caos y no de simple barra rectangular.

### 2.3. `src/scene/ShellScene.ts`
- **Resolver `HC-1` (visibilidad de `attackHitboxRect`):** mostrar `attackHitboxRect` únicamente cuando `import.meta.env.DEV && isScaleReferenceVisible()` sea verdadero (al activar el overlay con `G`), ocultándolo durante el juego normal para que no tiña la hoja ni la cadena.
- **Plataformas con acabado de maderamen:** en `redrawPlatforms()`, dibujar cada plataforma con cuerpo de tablón (`platformColor`), borde superior iluminado, sombra inferior (`platformEdgeColor`) y juntas verticales cada ~32 px para integrarse visualmente con la cubierta del barco en `egeo-fondo.png`.

---

## 3. Criterios de aceptación (binarios)

1. **Paleta y dimensiones exactas de los 5 spritesheets regenerados:**
   - `kratos-idle.png`: `194×59` (2 cuadros de `97×59`), 6 colores exactos (`set(cols) == set(PALETTE)`).
   - `kratos-run.png`: `582×59` (6 cuadros de `97×59`), 6 colores exactos.
   - `kratos-air.png`: `194×59` (2 cuadros de `97×59`), 6 colores exactos.
   - `kratos-attack.png`: `291×59` (3 cuadros de `97×59`), 6 colores exactos.
   - `kratos-roll.png`: `388×59` (4 cuadros de `97×59`), 6 colores exactos, todos los cuadros distintos entre sí.
   - Todos los cuadros tienen su fila inferior opaca exactamente en `y = 58` (pies anclados).
   - `kratos-neutral.png` y `egeo-fondo.png` permanecen **intactos por SHA-256**.
2. **Inspección visual directa (`read_file` sobre `docs/referencias/kratos-anim-contact-sheet.png`):**
   - Kratos presenta silueta musculosa coherente con `kratos-neutral.png` (torso ancho con tatuaje rojo, perilla, faldón espartano, brazaletes y grebas), lejos del antiguo maniquí de palitos.
3. **Deuda `HC-1` resuelta y arma limpia en pantalla:**
   - Con el overlay DEV apagado (`isScaleReferenceVisible() === false`), `attackHitboxRect` está oculto y tanto `weaponChainColor` (`0x9e9e9e`) como `weaponBladeColor` (`0xfff1c9`) se leen directamente en los píxeles del canvas durante la fase `active` (y `0` píxeles en fase `none`).
   - Con el overlay DEV encendido (`toggleScaleReference()`), `attackHitboxRect` sí se muestra en fase `active`.
4. **Cero regresión en simulación, tipado y build:**
   - `grep -rn ": any\|as any" src/` → 0 coincidencias.
   - `pnpm exec tsc --noEmit` y `pnpm build` → exit 0; `__GOW8B` ausente de `dist/`.
   - Checksums de simulación (`init_empty` = `5ae64ce0`, `init_combat` = `67b1fa98`, `combat60` = `9f8ded3f`, `scaleChecksum` = `da5b47b6`) 100 % idénticos.
5. **Auditoría independiente** en modo de solo lectura por un subagente distinto del implementador.
