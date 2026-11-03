import { CONFIG } from '../config';
import type { GameAction, InputTrace } from './types';
import { sortActions } from './types';
import { World } from './world';

export class Simulation {
  readonly world = new World();

  private accumulatorMicros = 0;
  private recording: InputTrace | null = null;
  /**
   * Actions read in frames that ran no tick (a frame shorter than a tick):
   * they apply on the next tick instead of being lost, so a quick tap on a
   * button still counts.
   */
  private carried: readonly GameAction[] = [];

  fixedStep(actions: readonly GameAction[] = []): void {
    const canonical = sortActions(actions);
    this.world.step(canonical);
    if (this.recording) {
      this.recording.push({ frame: this.world.frame, actions: canonical });
    }
  }

  advance(deltaMs: number, actions: readonly GameAction[] = []): number {
    if (!Number.isFinite(deltaMs) || deltaMs <= 0) {
      return 0;
    }
    this.accumulatorMicros += Math.round(deltaMs * 1000);
    const first = this.carried.length > 0 ? [...new Set([...this.carried, ...actions])] : actions;
    let ticks = 0;
    while (
      this.accumulatorMicros >= CONFIG.sim.tickMicros &&
      ticks < CONFIG.sim.maxCatchUpTicks
    ) {
      this.fixedStep(ticks === 0 ? first : actions);
      this.accumulatorMicros -= CONFIG.sim.tickMicros;
      ticks += 1;
    }
    this.carried = ticks === 0 ? first : [];
    if (this.accumulatorMicros > CONFIG.sim.maxAccumulatorMicros) {
      this.accumulatorMicros = CONFIG.sim.maxAccumulatorMicros;
    }
    return ticks;
  }

  stepManual(frames: number, actions: readonly GameAction[] = []): void {
    const count = Math.max(0, Math.floor(frames));
    for (let i = 0; i < count; i += 1) {
      this.fixedStep(actions);
    }
  }

  startRecording(): void {
    this.recording = [];
  }

  stopRecording(): InputTrace {
    const trace = this.recording ?? [];
    this.recording = null;
    return trace;
  }

  isRecording(): boolean {
    return this.recording !== null;
  }

  replay(trace: InputTrace): void {
    this.recording = null;
    this.world.reset();
    this.resetClock();
    for (const frame of trace) {
      this.fixedStep(frame.actions);
    }
  }

  resetClock(): void {
    this.accumulatorMicros = 0;
    this.carried = [];
  }
}
