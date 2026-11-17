import { PLAYER_SPRITE_HEIGHT, PLAYER_SPRITE_WIDTH } from '../config';
import { STRIKES } from '../sim/strike';

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

/** Texture of a strike body pose (`StrikePhase.pose`). */
export function strikeFrameKey(pose: string): string {
  return `kratos-${pose}`;
}
/** Body poses of every strike (D-37 blockouts, `grids/kratos/sq1-*.txt`). */
export const STRIKE_KEYS: readonly string[] = [
  ...new Set(Object.values(STRIKES).flatMap((strike) => strike.phases.map((phase) => strikeFrameKey(phase.pose)))),
];

/** Body poses of the Circle grab and its three follow-ups (□ throw, △ break, ○ slam). */
export const GRAB_KEYS: readonly string[] = [
  'kratos-grab-lunge',
  'kratos-grab-hold',
  'kratos-grab-throw-a',
  'kratos-grab-throw-b',
  'kratos-grab-break-a',
  'kratos-grab-break-b',
  'kratos-grab-slam-a',
  'kratos-grab-slam-b',
  'kratos-grab-punch-a',
  'kratos-grab-punch-b',
  'kratos-grab-stab-a',
  'kratos-grab-stab-b',
  'kratos-grab-whiff-recover',
];

/** Body poses of the block (L1): raising and held with the blades crossed in front. */
export const GUARD_KEYS: readonly string[] = ['kratos-guard-a', 'kratos-guard-b'];

/** Additional grid-derived frames, one PNG each, drawn in full. */
export const PLAYER_FRAME_KEYS: readonly string[] = [
  ...IDLE_POSES.slice(1),
  ...RUN_KEYS,
  AIR_RISE_KEY,
  AIR_FALL_KEY,
  AIR_DOUBLE_KEY,
  ...ROLL_KEYS,
  ...STRIKE_KEYS,
  ...GRAB_KEYS,
  ...GUARD_KEYS,
];

/** All 27 approved legionnaire frames (64x56, ground anchor at 55). */
export const LEGIONNAIRE_FRAME_KEYS: readonly string[] = [
  'legionnaire-idle-00',
  ...Array.from({ length: 8 }, (_, i) => `legionnaire-walk-0${i}`),
  ...Array.from({ length: 4 }, (_, i) => `legionnaire-windup-0${i}`),
  ...Array.from({ length: 4 }, (_, i) => `legionnaire-slash-0${i}`),
  ...Array.from({ length: 3 }, (_, i) => `legionnaire-recover-0${i}`),
  'legionnaire-hitstun-00',
  'legionnaire-hitstun-01',
  'legionnaire-juggle-00',
  'legionnaire-juggle-01',
  'legionnaire-death-00',
  'legionnaire-death-01',
  'legionnaire-death-02',
];

export const ASSETS: Record<AssetDomain, readonly AssetEntry[]> = {
  characters: [
    characterSheet(STATIC_KEY, `assets/characters/${STATIC_KEY}.png`),
    ...PLAYER_FRAME_KEYS.map((key) => ({
      key,
      path: `assets/characters/${key}.png`,
    })),
    { key: BLADE_KEY, path: `assets/characters/${BLADE_KEY}.png` },
    ...LEGIONNAIRE_FRAME_KEYS.map((key) => ({
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
