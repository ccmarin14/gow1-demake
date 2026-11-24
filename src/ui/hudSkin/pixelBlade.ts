/**
 * Variante A del HUD (pixel art): Espada del Caos en píxeles duros.
 *
 * Datos puros, sin Phaser: una lista de rectángulos de píxeles enteros en coordenadas
 * absolutas del lienzo 480×270. Se dibujan en orden (los posteriores tapan a los anteriores).
 * Las barras de vida y maná se pintan encima con la misma lógica de HudLayer en ambas variantes.
 */

import { bladeBottom, bladeTop, BLADE_X_END, BLADE_X_START } from './hudBladeProfile';
import { HUD_GREEN_TROUGH, HUD_GREEN_WELL, HUD_MANA_TROUGH, HUD_MANA_WELL } from './hudWells';

export type PixelToken = 'o' | 'd' | 'b' | 'g' | 'l' | 'm' | 's' | 'h' | 'y';

export interface PixelRect {
  x: number;
  y: number;
  w: number;
  h: number;
  c: PixelToken;
}

/** Colores de la paleta original del HUD (palette/hud.json). */
export const PIXEL_PALETTE: Readonly<Record<PixelToken, number>> = {
  o: 0x201513, // contorno
  d: 0x4b3b34, // metal oscuro (medallón)
  b: 0x82614e, // bronce
  g: 0xc49a45, // oro (bisel)
  l: 0xd9d0bd, // acero claro
  m: 0x77777f, // acero medio
  s: 0x4c4b52, // acero en sombra
  h: 0x2f1712, // canal de las barras
  y: 0xf2a33a, // gema dorada de la cadena
};

/**
 * Filas del medallón: [y, xIzquierda, xDerecha] de un círculo de radio r centrado en (cx, cy).
 * Cada fila de píxeles usa su punto medio vertical para redondear el borde.
 */
export function medallionRows(cx: number, cy: number, r: number): Array<[number, number, number]> {
  const rows: Array<[number, number, number]> = [];
  for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y += 1) {
    const dy = y + 0.5 - cy;
    if (Math.abs(dy) >= r) continue;
    const half = Math.sqrt(r * r - dy * dy);
    const left = Math.round(cx - half);
    const right = Math.round(cx + half) - 1;
    if (right - left >= 3) rows.push([y, left, right]);
  }
  return rows;
}

const MEDALLION_ROWS = medallionRows(15.5, 33, 14.5);

export function buildPixelBladeRects(): PixelRect[] {
  const rects: PixelRect[] = [];
  const push = (x: number, y: number, w: number, h: number, c: PixelToken): void => {
    rects.push({ x, y, w, h, c });
  };

  // Hoja: una columna por píxel de x, desde la silueta compartida (dientes arriba, punta curva).
  for (let x = BLADE_X_START; x <= BLADE_X_END; x += 1) {
    const top = Math.round(bladeTop(x));
    const end = Math.round(bladeBottom(x)) - 1;
    if (x === BLADE_X_START) {
      push(x, top, 1, end - top + 1, 'o');
      continue;
    }
    push(x, top, 1, 1, 'o');
    if (end - top >= 2) push(x, top + 1, 1, 1, 'l');
    if (end - top >= 4) push(x, top + 2, 1, end - top - 3, 'm');
    if (end - top >= 3) push(x, end - 1, 1, 1, 's');
    push(x, end, 1, 1, 'o');
    push(x, end + 1, 1, 1, 'd');
  }

  // Pozos de las barras (bisel de bronce/oro) y canal oscuro bajo cada barra.
  push(HUD_GREEN_WELL.x, HUD_GREEN_WELL.y, HUD_GREEN_WELL.w, HUD_GREEN_WELL.h, 'g');
  push(HUD_GREEN_TROUGH.x, HUD_GREEN_TROUGH.y, HUD_GREEN_TROUGH.w, HUD_GREEN_TROUGH.h, 'h');
  push(HUD_MANA_WELL.x, HUD_MANA_WELL.y, HUD_MANA_WELL.w, HUD_MANA_WELL.h, 'b');
  push(HUD_MANA_TROUGH.x, HUD_MANA_TROUGH.y, HUD_MANA_TROUGH.w, HUD_MANA_TROUGH.h, 'h');

  // Collarín que une el medallón con la hoja.
  push(28, 27, 2, 13, 'b');

  // Medallón: contorno, bisel oro, relleno casi negro y un brillo de acero.
  for (const [y, left, right] of MEDALLION_ROWS) {
    push(left, y, 1, 1, 'o');
    push(left + 1, y, 1, 1, 'g');
    if (right - left - 3 > 0) push(left + 2, y, right - left - 3, 1, 'h');
    push(right - 1, y, 1, 1, 'g');
    push(right, y, 1, 1, 'o');
  }
  push(8, 29, 3, 1, 'm');
  push(7, 30, 2, 1, 'm');

  // Cadena que sale del medallón hacia la hoja: tres eslabones y una gema dorada.
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
