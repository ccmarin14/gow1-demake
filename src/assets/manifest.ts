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

/** Idle breathing loop: `idle-01` lifts the upper body 1 px. */
export const IDLE_KEYS: readonly string[] = [STATIC_KEY, 'kratos-idle-01'];
/** Run cycle: contact, passing, contact (other leg), passing. */
export const RUN_KEYS: readonly string[] = [
  'kratos-run-00',
  'kratos-run-01',
  'kratos-run-02',
  'kratos-run-03',
];
/** Airborne poses: knees tucked while rising, legs hanging while falling. */
export const AIR_RISE_KEY = 'kratos-air-00';
export const AIR_FALL_KEY = 'kratos-air-01';
/** Roll: crouched on entry and exit, curled ball in between. */
export const ROLL_CROUCH_KEY = 'kratos-roll-00';
export const ROLL_BALL_KEY = 'kratos-roll-01';
/** Ticks at each end of the roll that show the crouch instead of the ball. */
export const ROLL_CROUCH_TICKS = 4;

/** Additional grid-derived frames, one PNG each, drawn in full. */
export const PLAYER_FRAME_KEYS: readonly string[] = [
  'kratos-idle-01',
  ...RUN_KEYS,
  AIR_RISE_KEY,
  AIR_FALL_KEY,
  ROLL_CROUCH_KEY,
  ROLL_BALL_KEY,
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
