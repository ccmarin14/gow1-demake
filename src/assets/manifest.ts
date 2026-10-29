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

/**
 * Motion frames derived by translating blocks of the master are retired.
 * Those frames cut the head and sheared the legs, which mutates anatomy and
 * reads as sliding. Until a frame is drawn in full it is not animated: the
 * character stays on the single drawn master.
 */
const STATIC_KEY = 'kratos-neutral';

export const IDLE_KEYS = [STATIC_KEY, 'kratos-idle-01'] as const;
/**
 * Four drawn poses: contact, passing, opposite contact, opposite passing.
 * The foot support alternates every two poses, which is what `stridePx`
 * measures in `CONFIG.player.run`.
 */
export const RUN_KEYS = [
  'kratos-run-00',
  'kratos-run-01',
  'kratos-run-02',
  'kratos-run-03',
] as const;
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

export const PROVISIONAL_ART = false;
