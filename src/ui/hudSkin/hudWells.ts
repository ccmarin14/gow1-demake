/**
 * Geometría de los pozos de las barras de vida y maná, compartida por todas las variantes del
 * marco. Coincide con CONFIG.presentation.hud (x=16 más 32 px de marco, y=20, barras 110/80 px
 * y alturas 5/4). Módulo puro: sin Phaser.
 */
export interface HudBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Pozo de la barra verde: el bisel de bronce o de oro queda alrededor del canal. */
export const HUD_GREEN_WELL: HudBox = { x: 46, y: 19, w: 114, h: 7 };
/** Canal oscuro bajo la barra verde: mismo tamaño que la barra de vida (110×5). */
export const HUD_GREEN_TROUGH: HudBox = { x: 48, y: 20, w: 110, h: 5 };
/** Pozo de la barra azul de maná, con su bisel. */
export const HUD_MANA_WELL: HudBox = { x: 46, y: 33, w: 84, h: 6 };
/** Canal oscuro bajo la barra azul: mismo tamaño que la barra de maná (80×4). */
export const HUD_MANA_TROUGH: HudBox = { x: 48, y: 34, w: 80, h: 4 };
