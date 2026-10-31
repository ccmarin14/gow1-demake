import { PLAYER_SPRITE_HEIGHT, PLAYER_SPRITE_WIDTH } from '../config';
import type { AttackMoveId } from '../sim/types';

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

/** Blade of Chaos sprite (grid `grids/blades/blade.txt`), drawn by `WeaponLayer`. */
export const BLADE_KEY = 'blade-of-chaos';

/** Static fallback pose for every state that has no drawn frames yet. */
const STATIC_KEY = 'kratos-idle-00';

/**
 * Idle loop: hunched wide stance panting like GoW 1 (D-34 blockout). Three
 * poses, exhale -> mid -> inhale, played back and forth.
 */
const IDLE_POSES = ['kratos-idle-00', 'kratos-idle-01', 'kratos-idle-02'] as const;
export const IDLE_KEYS: readonly string[] = [...IDLE_POSES, IDLE_POSES[1]];
/**
 * Run cycle: blockout frames rendered from the 3D mannequin (D-34), pending
 * the finishing pass with the idle head, tattoo and costume detail.
 */
export const RUN_KEYS: readonly string[] = Array.from({ length: 8 }, (_, i) => `kratos-run-0${i}`);
/** Airborne blockout poses (D-34): knees tucked while rising, open while falling. */
export const AIR_RISE_KEY = 'kratos-air-00';
export const AIR_FALL_KEY = 'kratos-air-01';
/** Double jump: arms thrust down, knees tucked, as if pushing off the air. */
export const AIR_DOUBLE_KEY = 'kratos-air-02';
/** Roll blockout (D-34): crouch, dive, hands down, curled, recover; spread over the roll. */
export const ROLL_KEYS: readonly string[] = Array.from({ length: 5 }, (_, i) => `kratos-roll-0${i}`);

/**
 * Strike blockouts (D-34), from the mannequin's `Sword_Attack`: `sa` plain,
 * `sh` heavy (hunched, knees bent), `sx` air (knees tucked); `06` arm drawn
 * back high, `10` lunge, `14` low follow-through, `22` recovering. Ascension
 * crouches and then rises with one knee up.
 */
const atk = (name: string): string => `kratos-atk-${name}`;
export interface AttackFrames {
  startup: readonly string[];
  active: readonly string[];
  recovery: readonly string[];
}
/**
 * Body frames per move and phase; each phase spreads its frames over its
 * ticks. The Square chain alternates rising and falling cuts.
 */
export const ATTACK_FRAMES: Readonly<Record<AttackMoveId, AttackFrames>> = {
  light_1: { startup: [atk('sa14')], active: [atk('sa10'), atk('sa06')], recovery: [atk('sa22')] },
  light_2: { startup: [atk('sa06')], active: [atk('sa10'), atk('sa14')], recovery: [atk('sa22')] },
  light_3: { startup: [atk('sa06')], active: [atk('sa10'), atk('sh14')], recovery: [atk('sa22')] },
  plume_of_prometheus: { startup: [atk('sh06')], active: [atk('sa10'), atk('sh14')], recovery: [atk('sh14'), atk('sa22')] },
  heavy: { startup: [atk('sh06')], active: [atk('sa10'), atk('sh14')], recovery: [atk('sa22')] },
  ascension: { startup: [atk('crouch')], active: [atk('rise')], recovery: [atk('rise')] },
  air_light_1: { startup: [atk('sx06')], active: [atk('sx10'), atk('sx14')], recovery: [atk('sx10')] },
  air_light_2: { startup: [atk('sx14')], active: [atk('sx10'), atk('sx06')], recovery: [atk('sx10')] },
  air_heavy: { startup: [atk('sx06')], active: [atk('sx14')], recovery: [atk('sx14')] },
};
const ATTACK_KEYS: readonly string[] = [
  ...new Set(Object.values(ATTACK_FRAMES).flatMap((f) => [...f.startup, ...f.active, ...f.recovery])),
];

/** Additional grid-derived frames, one PNG each, drawn in full. */
export const PLAYER_FRAME_KEYS: readonly string[] = [
  ...IDLE_POSES.slice(1),
  ...RUN_KEYS,
  AIR_RISE_KEY,
  AIR_FALL_KEY,
  AIR_DOUBLE_KEY,
  ...ROLL_KEYS,
  ...ATTACK_KEYS,
];

export const ASSETS: Record<AssetDomain, readonly AssetEntry[]> = {
  characters: [
    characterSheet(STATIC_KEY, `assets/characters/${STATIC_KEY}.png`),
    ...PLAYER_FRAME_KEYS.map((key) => ({
      key,
      path: `assets/characters/${key}.png`,
    })),
    { key: BLADE_KEY, path: `assets/characters/${BLADE_KEY}.png` },
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
