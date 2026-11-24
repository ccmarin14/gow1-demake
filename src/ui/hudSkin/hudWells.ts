/**
 * Geometría de los pozos de las barras de vida y maná, compartida por todas las variantes del
 * marco. Coincide con CONFIG.presentation.hud (x=24 más 32 px de marco, y=20, barras 62/52 px
 * y alturas esbeltas de 3/3 px con 2 px de acero visible entre ranuras, y canal rojo de 2 px).
 * Módulo puro: sin Phaser.
 */
export interface HudBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Pozo biselado de la barra verde (1 px de borde oscuro alrededor de la cápsula de 62×3). */
export const HUD_GREEN_WELL: HudBox = { x: 55, y: 19, w: 64, h: 5 };
/** Canal interior de la barra verde: mismo tamaño que la barra de vida (62×3). */
export const HUD_GREEN_TROUGH: HudBox = { x: 56, y: 20, w: 62, h: 3 };
/** Pozo biselado de la barra azul de maná (separado por 2 px de acero de la verde). */
export const HUD_MANA_WELL: HudBox = { x: 55, y: 26, w: 54, h: 5 };
/** Canal interior de la barra azul: mismo tamaño que la barra de maná (52×3). */
export const HUD_MANA_TROUGH: HudBox = { x: 56, y: 27, w: 52, h: 3 };
/**
 * Canal de la barra roja (Ira de los Dioses, C9), más delgada (2 px) que la verde y la azul (3 px)
 * y separada bajo la azul. Hoy solo es arte: no hay lógica que la llene.
 */
export const HUD_RAGE_TROUGH: HudBox = { x: 60, y: 34, w: 44, h: 2 };
/** Caja negra del contador a la izquierda de la barra roja (en la referencia lleva un número). */
export const HUD_COUNTER_BOX: HudBox = { x: 49, y: 31, w: 9, h: 8 };
