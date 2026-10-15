import { CONFIG, METRICS_WINDOW_FRAMES } from './config';

export class FrameMetrics {
  private readonly samples: number[];
  private readonly windowSize: number;
  private cursor = 0;
  private filled = 0;
  private lastFrameMs = 0;

  constructor(windowSize: number = METRICS_WINDOW_FRAMES) {
    this.windowSize = Math.max(1, Math.floor(windowSize));
    this.samples = new Array<number>(this.windowSize).fill(0);
  }

  get frameTimeMs(): number {
    return this.lastFrameMs;
  }

  get avgFrameTimeMs(): number {
    if (this.filled === 0) {
      return 0;
    }
    let total = 0;
    for (let i = 0; i < this.filled; i += 1) {
      total += this.samples[i];
    }
    return total / this.filled;
  }

  get fps(): number {
    const average = this.avgFrameTimeMs;
    return average > 0 ? 1000 / average : 0;
  }

  get tickRate(): number {
    return CONFIG.sim.tickRate;
  }

  record(deltaMs: number): void {
    if (!Number.isFinite(deltaMs) || deltaMs < 0) {
      return;
    }
    this.lastFrameMs = deltaMs;
    this.samples[this.cursor] = deltaMs;
    this.cursor = (this.cursor + 1) % this.windowSize;
    if (this.filled < this.windowSize) {
      this.filled += 1;
    }
  }

  reset(): void {
    this.samples.fill(0);
    this.cursor = 0;
    this.filled = 0;
    this.lastFrameMs = 0;
  }
}
