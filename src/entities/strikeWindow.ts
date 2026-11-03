/**
 * The strike effects (trails, chains, fire) are drawn into pixel windows
 * around Kratos' feet. Every strike stays inside it: x from -74 to 92 and y
 * from -82 to 2 (facing right; left mirrors x), measured over all strikes in
 * `tests/pixel-buffer.test.ts`, which also fails if a strike grows past it.
 */
export const WINDOW_W = 288;
export const WINDOW_H = 160;
/** Window left edge, in px left of the strike's origin x. */
export const WINDOW_LEFT = 144;
/** Window top edge, in px above the feet. */
export const WINDOW_ABOVE = 110;
