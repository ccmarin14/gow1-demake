/**
 * Shape of a ground fire line (D-37: the triangle's slam, Plume's lingering
 * fire), without Phaser so tests can check it: one column per pixel with a
 * flame tongue 1 to `heightPx` tall, irregular but reproducible (seeded by
 * the column, the tick and the strike), fading from both ends toward the
 * centre over the fire's `ticks`. Colours are square 1's trail palette, the
 * pale one only at the base.
 */
export interface FireColumn {
  x: number;
  /** Colours from the ground up (one per pixel of the tongue). */
  colors: number[];
}

export interface FirePalette {
  edge: number;
  red: number;
  orange: number;
  white: number;
}

/** Small integer hash (reproducible flicker). */
function hash(a: number, b: number, c: number): number {
  let h = (a * 374761393 + b * 668265263 + c * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return (h ^ (h >>> 16)) >>> 0;
}

/**
 * Columns of a fire line from world x `a` to `b` (either order) on its
 * `age`-th tick of `ticks`; `seed` tells two fires apart.
 */
export function groundFireColumns(
  a: number,
  b: number,
  heightPx: number,
  age: number,
  ticks: number,
  seed: number,
  palette: FirePalette,
): FireColumn[] {
  const from = Math.round(Math.min(a, b));
  const to = Math.round(Math.max(a, b));
  // Burns out from both ends toward the centre.
  const cut = ((to - from) / 2) * Math.min(1, age / ticks);
  const columns: FireColumn[] = [];
  for (let x = from; x <= to; x += 1) {
    if (x - from < cut || to - x < cut) continue;
    const h = 1 + (hash(x - from, age, seed) % Math.max(1, heightPx));
    const colors =
      h === 1 ? [palette.orange]
        : h === 2 ? [palette.white, palette.red]
          : [palette.white, palette.orange, ...Array.from({ length: h - 2 }, (_, i) => (i === h - 3 ? palette.edge : palette.red))];
    columns.push({ x, colors });
  }
  return columns;
}
