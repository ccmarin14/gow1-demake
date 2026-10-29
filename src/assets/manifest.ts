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

export const ENEMY_FRAME_WIDTH = 64;
export const ENEMY_FRAME_HEIGHT = 54;

function enemySheet(key: string): AssetEntry {
  return {
    key,
    path: `assets/characters/${key}.png`,
    type: 'spritesheet',
    frameWidth: ENEMY_FRAME_WIDTH,
    frameHeight: ENEMY_FRAME_HEIGHT,
  };
}

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
const STATIC_KEY = 'kratos-neutral';

export const IDLE_KEYS = [STATIC_KEY, 'kratos-idle-01'] as const;
/**
 * Run frames. Empty until the new ASCII art exists: with fewer than two
 * frames `ShellScene` renders the static `PLAYER_KEY` while running.
 */
export const RUN_KEYS: readonly string[] = [];
export const SKID_KEY = STATIC_KEY;

/** Additional grid-derived frames, one PNG each, drawn in full. */
export const PLAYER_FRAME_KEYS: readonly string[] = [
  'kratos-idle-01',
  ...RUN_KEYS,
];

export const ASSETS: Record<AssetDomain, readonly AssetEntry[]> = {
  characters: [
    characterSheet('kratos-neutral', 'assets/characters/kratos-neutral.png'),
    ...PLAYER_FRAME_KEYS.map((key) => ({
      key,
      path: `assets/characters/${key}.png`,
    })),
    enemySheet('legionnaire'),
    enemySheet('archer'),
    { key: 'arrow', path: 'assets/characters/arrow.png' },
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
export const PLAYER_KEY = 'kratos-neutral';

export const IDLE_KEY = 'kratos-idle';
export const RUN_KEY = 'kratos-run';
