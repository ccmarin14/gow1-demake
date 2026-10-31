import { PLAYER_SPRITE_HEIGHT, PLAYER_SPRITE_WIDTH } from '../config';

export type AssetDomain =
  | 'characters'
  | 'environment'
  | 'ui'
  | 'fx'
  | 'audio'
  | 'data';

export interface AssetEntry {
  key: string;
  path: string;
  type?: 'image' | 'spritesheet';
  frameWidth?: number;
  frameHeight?: number;
}

export const CHARACTER_FRAME_WIDTH = PLAYER_SPRITE_WIDTH;
export const CHARACTER_FRAME_HEIGHT = PLAYER_SPRITE_HEIGHT;

function characterSheet(key: string, path: string): AssetEntry {
  return {
    key,
    path,
    type: 'spritesheet',
    frameWidth: CHARACTER_FRAME_WIDTH,
    frameHeight: CHARACTER_FRAME_HEIGHT,
  };
}

/** Static fallback pose for every state that has no drawn frames yet. */
const STATIC_KEY = 'kratos-idle-00';

/** Idle loop: combat stance swaying, blockout of the mannequin's `Sword_Idle` (D-34). */
export const IDLE_KEYS: readonly string[] = Array.from({ length: 4 }, (_, i) => `kratos-idle-0${i}`);
/**
 * Run cycle: blockout frames rendered from the 3D mannequin (D-34), pending
 * the finishing pass with the idle head, tattoo and costume detail.
 */
export const RUN_KEYS: readonly string[] = Array.from({ length: 8 }, (_, i) => `kratos-run-0${i}`);
/** Airborne blockout poses (D-34): knees tucked while rising, open while falling. */
export const AIR_RISE_KEY = 'kratos-air-00';
export const AIR_FALL_KEY = 'kratos-air-01';
/** Roll blockout (D-34): crouch, dive, hands down, curled, recover; spread over the roll. */
export const ROLL_KEYS: readonly string[] = Array.from({ length: 5 }, (_, i) => `kratos-roll-0${i}`);

/** Additional grid-derived frames, one PNG each, drawn in full. */
export const PLAYER_FRAME_KEYS: readonly string[] = [
  ...IDLE_KEYS.slice(1),
  ...RUN_KEYS,
  AIR_RISE_KEY,
  AIR_FALL_KEY,
  ...ROLL_KEYS,
];

export const ASSETS: Record<AssetDomain, readonly AssetEntry[]> = {
  characters: [
    characterSheet(STATIC_KEY, `assets/characters/${STATIC_KEY}.png`),
    ...PLAYER_FRAME_KEYS.map((key) => ({
      key,
      path: `assets/characters/${key}.png`,
    })),
  ],
  environment: [
    { key: 'egeo-fondo', path: 'assets/environment/egeo-fondo.png' },
  ],
  ui: [],
  fx: [],
  audio: [],
  data: [],
};

export const ASSET_DOMAINS = Object.keys(ASSETS) as AssetDomain[];

export const BACKGROUND_KEY = ASSETS.environment[0].key;
export const PLAYER_KEY = STATIC_KEY;

export const IDLE_KEY = 'kratos-idle';
export const RUN_KEY = 'kratos-run';
