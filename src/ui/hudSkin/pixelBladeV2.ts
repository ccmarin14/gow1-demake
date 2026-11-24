/**
 * Variante A2 del HUD (pixel art): la misma silueta que A, con sombreado en bandas, una raya
 * de fuller oscura, remaches de bronce en los pozos y un medallón con brillo. Datos puros.
 */

import { bladeBottom, bladeTop, BLADE_X_END, BLADE_X_START } from './hudBladeProfile';
import { HUD_GREEN_TROUGH, HUD_GREEN_WELL, HUD_MANA_TROUGH, HUD_MANA_WELL } from './hudWells';
import { medallionRows } from './pixelBlade';
import type { PixelRect, PixelToken } from './pixelBlade';

export function buildPixelBladeRectsV2(): PixelRect[] {
  const rects: PixelRect[] = [];
  const push = (x: number, y: number, w: number, h: number, c: PixelToken): void => {
    rects.push({ x, y, w, h, c });
  };

  // Hoja en bandas: brillo arriba, acero medio, sombra abajo y un fuller oscuro en el centro.
  for (let x = BLADE_X_START; x <= BLADE_X_END; x += 1) {
    const top = Math.round(bladeTop(x));
    const end = Math.round(bladeBottom(x)) - 1;
    if (x === BLADE_X_START) {
      push(x, top, 1, end - top + 1, 'o');
      continue;
    }
    push(x, top, 1, 1, 'o');
    if (end - top >= 2) push(x, top + 1, 1, 1, 'l');
    if (end - top >= 5) push(x, top + 2, 1, end - top - 6, 'm');
    if (end - top >= 5) push(x, end - 3, 1, 2, 's');
    if (end - top >= 5 && x >= 40 && x <= 150) push(x, Math.round((top + end) / 2), 1, 1, 'd');
    push(x, end, 1, 1, 'o');
    push(x, end + 1, 1, 1, 'd');
  }

  // Pozos de las barras con bisel de bronce y remaches en las esquinas.
  push(HUD_GREEN_WELL.x, HUD_GREEN_WELL.y, HUD_GREEN_WELL.w, HUD_GREEN_WELL.h, 'g');
  push(HUD_GREEN_TROUGH.x, HUD_GREEN_TROUGH.y, HUD_GREEN_TROUGH.w, HUD_GREEN_TROUGH.h, 'h');
  push(HUD_MANA_WELL.x, HUD_MANA_WELL.y, HUD_MANA_WELL.w, HUD_MANA_WELL.h, 'b');
  push(HUD_MANA_TROUGH.x, HUD_MANA_TROUGH.y, HUD_MANA_TROUGH.w, HUD_MANA_TROUGH.h, 'h');
  for (const [x, y] of [[46, 19], [158, 19], [46, 33], [127, 33]] as const) push(x, y, 1, 1, 'l');

  // Collarín y medallón de dos aros con brillo arriba a la izquierda.
  push(28, 27, 2, 13, 'b');
  for (const [y, left, right] of medallionRows(15.5, 33, 14.5)) {
    push(left, y, 1, 1, 'o');
    push(left + 1, y, 1, 1, 'g');
    if (right - left - 3 > 0) push(left + 2, y, right - left - 3, 1, 'h');
    push(right - 1, y, 1, 1, 'g');
    push(right, y, 1, 1, 'o');
  }
  for (const [x, y] of [[8, 27], [9, 26], [10, 25], [7, 28], [6, 30]] as const) push(x, y, 2, 1, 'l');

  // Cadena y gema como en A.
  const link = (x: number, y: number, c: PixelToken): void => {
    push(x, y, 8, 5, 'o');
    push(x + 1, y + 1, 6, 3, c);
  };
  link(20, 24, 'b');
  link(25, 19, 'b');
  link(30, 14, 'b');
  push(14, 12, 5, 5, 'o');
  push(15, 13, 3, 3, 'y');

  return rects;
}
