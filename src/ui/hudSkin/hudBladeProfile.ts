/**
 * Silueta de la hoja de la Espada del Caos (BL-29), compartida por las dos variantes del marco.
 *
 * Coordenadas absolutas del lienzo 480×270. La hoja nace junto al collarín (x=30), tiene el
 * borde de arriba dentado (dientes de 6 px) y una punta que se curva hacia arriba a la derecha,
 * como la de la referencia. Los pozos de las barras quedan siempre dentro de la hoja.
 */

export const BLADE_X_START = 30;
export const BLADE_X_END = 191;

/** Borde de arriba de la hoja en la columna x (píxeles, con decimales). */
export function bladeTop(x: number): number {
  // El lomo sube de izquierda a derecha, como en la referencia.
  const t = (x - BLADE_X_START) / (BLADE_X_END - BLADE_X_START);
  const spine = 15 - 9 * Math.pow(t, 1.8);
  // Dientes de 9 px que suben 4 px desde el valle hasta la punta.
  const teeth = x >= 60 && x <= 170 ? (((x - 60) % 9) / 8) * 4 : 0;
  // La punta se curva hacia arriba a la derecha.
  const tipRise = x > 168 ? (x - 168) * 0.3 : 0;
  return Math.max(1, spine + teeth - tipRise);
}

/** Borde de abajo de la hoja en la columna x: plano hasta casi la punta, y luego sube en curva. */
export function bladeBottom(x: number): number {
  if (x <= 160) return 46;
  const t = (x - 160) / (BLADE_X_END - 160);
  return 46 - 28 * Math.pow(t, 1.5);
}
