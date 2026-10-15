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

export const ASSETS: Record<AssetDomain, readonly AssetEntry[]> = {
  characters: [
    { key: 'kratos-neutral', path: 'assets/characters/kratos-neutral.png' },
    {
      key: 'kratos-run',
      path: 'assets/characters/kratos-run.png',
      type: 'spritesheet',
      frameWidth: 97,
      frameHeight: 59,
    },
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

const RUN_ENTRY = ASSETS.characters.find((asset) => asset.key === 'kratos-run')!;
export const RUN_KEY = RUN_ENTRY.key;
export const RUN_FRAME_WIDTH = RUN_ENTRY.frameWidth!;
export const RUN_FRAME_HEIGHT = RUN_ENTRY.frameHeight!;

export const PROVISIONAL_ART = true;
