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

export const CHARACTER_FRAME_WIDTH = 97;
export const CHARACTER_FRAME_HEIGHT = 59;

function characterSheet(key: string, path: string): AssetEntry {
  return {
    key,
    path,
    type: 'spritesheet',
    frameWidth: CHARACTER_FRAME_WIDTH,
    frameHeight: CHARACTER_FRAME_HEIGHT,
  };
}

export const ASSETS: Record<AssetDomain, readonly AssetEntry[]> = {
  characters: [
    { key: 'kratos-neutral', path: 'assets/characters/kratos-neutral.png' },
    characterSheet('kratos-idle', 'assets/characters/kratos-idle.png'),
    characterSheet('kratos-run', 'assets/characters/kratos-run.png'),
    characterSheet('kratos-air', 'assets/characters/kratos-air.png'),
    characterSheet('kratos-attack', 'assets/characters/kratos-attack.png'),
    characterSheet('kratos-roll', 'assets/characters/kratos-roll.png'),
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
export const PLAYER_KEY = ASSETS.characters[0].key;

export const IDLE_KEY = 'kratos-idle';
export const RUN_KEY = 'kratos-run';
export const AIR_KEY = 'kratos-air';
export const ATTACK_KEY = 'kratos-attack';
export const ROLL_KEY = 'kratos-roll';

export const PROVISIONAL_ART = false;
