# Plan de corrección tras auditoría visual en navegador — `GOW8B-ART-POLISH-02` (Rev. 2)

**Estado:** **CERRADO Y APROBADO** (2026-10-22) tras compuerta completa: dictamen inicial **FALLIDO** en navegador real y aprobación del plan por el Auditor 1 (`8fc183e0-f1ed-4a09-b266-05f45e20df08`), corrección y captura en navegador por el Implementador (`f6244a35-018f-4497-8e33-4933aa23bff6`), y reauditoría visual en navegador en modo de solo lectura con veredicto **APROBADO** por un segundo Auditor distinto (`c60e5018-90c8-4798-ad8c-9dae85722c11`). Evidencia en [`docs/verificacion.md`](../verificacion.md#gow8b-art-polish-02--voltereta-a-ras-de-suelo-y-barrido-encadenado-estilo-betrayal-2026-10-2122).

---

## 1. Hallazgos del auditor y evidencia en navegador (`scratch/browser-combo-audit.png`)

Al capturar del `<canvas>` de Phaser los 30 ticks del combo (`chain 0 → 1 → 2` en `startup`, `active` y `recovery`) e inspeccionarlos visualmente con `read_file`:

1. **H1 — Duplicación de armas (3 cuchillas simultáneas) y cadena saliendo del abdomen/ingle:**
   - En `startup` (`t=1..5`, `10..12`, `18..20`) y `recovery` (`t=17`, `25..30`), los cuadros 0 y 2 de `kratos-attack.png` ya dibujan las **2 Cuchillas del Caos en las manos de Kratos**, mientras que `WeaponLayer` dibuja una **tercera cuchilla** saliendo del abdomen (`player.x, player.y - 30`) en dirección opuesta a los brazos o retrayéndose hacia la entrepierna (`t=25..30`).
   - En `active` (`t=6..9`, `13..16`, `21..24`), el puño delantero de Kratos en el cuadro 1 de `kratos-attack.png` está en `(player.x + 22*facing, player.y - 36)`, pero la cadena nace en `(player.x, player.y - 30)` (mitad del torso), pasando ~6 px por debajo del brazo sin conectar con la mano.
2. **H2 — La hoja en `WeaponLayer` parece una espátula/pastilla blanca sin pixel art:**
   - `weaponBladeRect` (`12×6`) y `weaponTipRect` (`6×4`) son dos rectángulos planos de color crema (`0xfff1c9`) sin contorno oscuro (`#1d1415`), sin perfil curvo/ganchudo real ni sombreado interno, y `weaponGuardRect` (`0x6b4f2a`) se pierde contra el marrón de la madera del fondo.
3. **H3 — La estela (`weaponTrailRects`) son 3 ladrillos sueltos con huecos:**
   - En `t=13..15` y `t=21..24`, los 3 rectángulos de estela aparecen separados por huecos vacíos como peldaños flotantes, sin formar el arco continuo de corte de *Betrayal*.
4. **H4 — La cadena (`weaponChainRects`) son 8 puntos grises desconectados:**
   - A extensión máxima (`32–40 px`), 8 rectángulos de `2×3` px sin contorno dejan huecos vacíos entre eslabones.

---

## 2. Archivos exactos a modificar

1. `scripts/gen-kratos-anim.py` (y regeneración de `public/assets/characters/kratos-attack.png` y `docs/referencias/kratos-anim-contact-sheet.png`)
2. `src/scene/ShellScene.ts`
3. `src/entities/WeaponLayer.ts`

*(No se modifican `src/sim/**` ni `src/config.ts`; los 7 checksums de simulación/escala permanecen 100 % invariantes).*

---

## 3. Cambio propuesto

### 3.1. Coordinación mano-cadena y eliminación total de la 3ª cuchilla (`scripts/gen-kratos-anim.py` + `src/scene/ShellScene.ts` + `src/entities/WeaponLayer.ts`)
- **En `scripts/gen-kratos-anim.py` (`ATTACK`):**
  - **Cuadro 0 (`startup`):** Kratos torsiona el torso preparando el golpe con **ambas Cuchillas del Caos en sus manos** (`bladeF` y `bladeN` activas). Durante `startup`, `WeaponLayer` permanece **oculto**, eliminando la 3ª cuchilla que salía del abdomen en `t=1..5`, `10..12` y `18..20`.
  - **Cuadro 1 (`active`):** Kratos lanza el puño delantero extendido a una coordenada fija y conocida (`handN ≈ (CX + 14, 28)` → en mundo `(player.x + facing * 14, player.y - 31)`) **sin dibujar `bladeN` en la mano delantera** (solo conserva `bladeF` en la mano trasera junto a la cadera), porque la cuchilla delantera está siendo lanzada con la cadena por `WeaponLayer`.
  - **Cuadro 2 (`recovery`):** Kratos recoge el brazo en guardia con ambas cuchillas en mano (`bladeF` y `bladeN`).
- **En `src/scene/ShellScene.ts` (`applyAnimation`, rama `attackPhase !== 'none'`):**
  - Durante `startup`: usa el cuadro `0` de `kratos-attack`.
  - Durante `active` **y el primer tick de `recovery` (`attackPhase === 'recovery' && simPlayer.attackTicks <= 2`)**: mantiene el cuadro `1` de `kratos-attack` (puño delantero extendido sin cuchilla pintada en el sprite) mientras `WeaponLayer` retrae rápidamente la cadena y la hoja hacia ese mismo puño `(player.x + facing * 14, player.y - 31)`.
  - A partir de `recovery` con `attackTicks > 2`: `ShellScene` pasa al cuadro `2` de `kratos-attack` (ambas cuchillas en mano) y `WeaponLayer` se oculta por completo.
  - **Resultado:** en los 30 ticks del combo hay **siempre exactamente 2 Cuchillas del Caos en pantalla** (1 en la mano trasera y 1 en la mano delantera o en el extremo de la cadena que nace exactamente del puño delantero).

### 3.2. Textura pixel art de la Cuchilla del Caos, cadena continua con contorno y estela en arco continua (`src/entities/WeaponLayer.ts`)
- **Origen visual en el puño delantero real:**
  - En `WeaponLayer.update`, el extremo de agarre visual de la cadena se sitúa en el puño delantero del cuadro 1: `handX = player.x + player.facing * 14`, `handY = player.y - 31`, conectando hasta `(pose.bladeCenterX, pose.bladeCenterY)` en `active` (y retrayéndose a `45 %` del radio hacia `(handX, handY)` en `recovery` con `attackTicks <= 2`).
- **Hoja pixel art (`chaos-blade-tex`) generada una sola vez en `create()`:**
  - Generar mediante `scene.textures.createCanvas('chaos-blade-tex', 22, 13)` una textura pixel art nítida de la Cuchilla del Caos que incluya:
    - Contorno exterior de 1 px en `#1d1415` (`OUTLINE` del sprite de Kratos),
    - Guardia/pomo en bronce e ígneo (`#b94a2c` / `#ff8800`),
    - Hoja curva ancha con gancho dorsal y punta afilada rellena con **`#fff1c9` (`weaponBladeColor`)** y bisel interior cálido (`#d7c6ad` / `#ff8800`).
  - Renderizarla con un `Phaser.GameObjects.Image` en `(Math.round(pose.bladeCenterX), Math.round(pose.bladeCenterY))`, con `setFlipX(player.facing === -1)` y `setRotation(rotation)` para que se integre con el mismo estilo pixel art de Kratos **y** conserve píxeles exactos `0xfff1c9` (`weaponBladeColor`) en el centro del barrido.
- **Cadena continua con contorno oscuro (`14` eslabones solapados):**
  - Usar `14` eslabones a lo largo de la curva entre `(handX, handY)` y la base de la hoja, cada uno con borde oscuro (`0x1d1415`) y núcleo metálico en `weaponChainColor` (`0x9e9e9e`), de modo que a 32–40 px de extensión los eslabones se toquen formando una cadena continua con ligera curvatura de látigo sin huecos vacíos.
- **Estela continua de corte en arco (*crescent slash trail*) en `active`:**
  - Reemplazar los 3 ladrillos sueltos por **14 segmentos solapados a lo largo del arco barrido** (interpolando continuamente entre el ángulo del tick previo y `pose.angleRad` en dos radios concéntricos: filo exterior en `weaponBladeColor = 0xfff1c9` y estela interior ígnea en `hitboxColorChain1 = 0xff8800` / `targetHitColor = 0xff5533`), formando una media luna continua de fuego y acero detrás de la hoja durante `active`.

---

## 4. Criterios de aceptación y regresiones protegidas

1. **Verificación visual obligatoria en navegador real (`scratch/browser-combo-audit.png` leída con `read_file`):**
   - Tanto el implementador como el auditor independiente deben capturar los 30 ticks del combo (`chain 0 → 1 → 2`) desde el `<canvas>` de Phaser e inspeccionar la imagen con `read_file`, confirmando que:
     - En ningún tick aparecen 3 cuchillas ni sale una cuchilla del abdomen o la ingle.
     - En `active` y el inicio de `recovery`, la cadena nace directamente del puño delantero de Kratos.
     - La hoja tiene silueta pixel art con contorno oscuro, gancho y brillo `0xfff1c9` (no un bloque blanco plano).
     - La cadena y la estela en arco se ven continuas, sin puntos ni ladrillos desconectados.
2. **Compatibilidad con `CHAOS-01` y `HC-1`:**
   - Con el overlay de escala apagado, en `active` se leen en el canvas tanto `weaponChainColor` (`0x9e9e9e` → `rgb(158,158,158)`) como `weaponBladeColor` (`0xfff1c9` → `rgb(255,241,201)`), y `attackHitboxRect` permanece oculto.
   - En `none`, todos los objetos de `WeaponLayer` están ocultos (`visible === false`).
3. **Invariantes técnicas y determinismo al 100 %:**
   - Dimensiones, paleta exacta de 6 colores y `bbox[3] == 59` en las 5 hojas (`kratos-{idle,run,air,attack,roll}.png`); `kratos-neutral.png` y `egeo-fondo.png` intactos por SHA-256.
   - `grep -rn ": any\|as any" src/` → 0 coincidencias; `pnpm exec tsc --noEmit` y `pnpm build` → exit 0; `__GOW8B` ausente de `dist/`.
   - Los 7 checksums de simulación/escala idénticos (`scaleChecksum = da5b47b6`, `init_empty = 5ae64ce0`, `init_test = c3f1f3dc`, `init_movement = 09c68ba7`, `init_platforms = 09c68ba7`, `init_combat = 67b1fa98`, `combat60 = 9f8ded3f`).
