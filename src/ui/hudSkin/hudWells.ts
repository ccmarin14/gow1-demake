/**
 * Geometría de los pozos de las barras de vida y maná, compartida por todas las variantes del
 * marco. Coincide con CONFIG.presentation.hud (x=24 más 32 px de marco, y=20, barras 62/52 px
 * y alturas 5/4). Módulo puro: sin Phaser.
 */
export interface HudBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Pozo de la barra verde: el bisel de bronce o de oro queda alrededor del canal. */
export const HUD_GREEN_WELL: HudBox = { x: 55, y: 19, w: 64, h: 7 };
/** Canal oscuro bajo la barra verde: mismo tamaño que la barra de vida (62×5). */
export const HUD_GREEN_TROUGH: HudBox = { x: 56, y: 20, w: 62, h: 5 };
/** Pozo de la barra azul de maná, con su bisel. */
export const HUD_MANA_WELL: HudBox = { x: 55, y: 33, w: 54, h: 6 };
/** Canal oscuro bajo la barra azul: mismo tamaño que la barra de maná (52×4). */
export const HUD_MANA_TROUGH: HudBox = { x: 56, y: 34, w: 52, h: 4 };
