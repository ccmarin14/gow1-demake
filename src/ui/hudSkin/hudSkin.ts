/**
 * Selección de la variante visual del marco del HUD (BL-29).
 *
 * Solo elige el arte que va detrás de las barras. La lógica de vida y maná vive en HudLayer
 * y es la misma para todas las variantes. Módulo puro: sin Phaser, para poder probarlo en node.
 */

export type HudSkinId = 'pixel' | 'faithful';

export const HUD_SKIN_IDS: readonly HudSkinId[] = ['pixel', 'faithful'];

export const DEFAULT_HUD_SKIN_ID: HudSkinId = 'pixel';

/** Lee `?hud=<id>` de la URL. Un valor desconocido o ausente usa la variante por defecto. */
export function resolveHudSkin(search: string | null | undefined): HudSkinId {
  if (!search) {
    return DEFAULT_HUD_SKIN_ID;
  }
  const requested = new URLSearchParams(search).get('hud');
  const match = HUD_SKIN_IDS.find((id) => id === requested);
  return match ?? DEFAULT_HUD_SKIN_ID;
}
