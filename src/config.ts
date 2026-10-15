export const TICK_RATE = 60;
export const TICK_MICROS = Math.floor(1_000_000 / TICK_RATE);

export const CONFIG = {
  internal: {
    width: 320,
    height: 180,
  },
  sim: {
    tickRate: TICK_RATE,
    tickMicros: TICK_MICROS,
    maxCatchUpTicks: 5,
    maxAccumulatorMicros: 5 * TICK_MICROS,
  },
  presentation: {
    background: '#111827',
    debugText: '#d1d5db',
    metricsWindowFrames: 60,
  },
} as const;

export const METRICS_WINDOW_FRAMES = CONFIG.presentation.metricsWindowFrames;

export type GameConfig = typeof CONFIG;
