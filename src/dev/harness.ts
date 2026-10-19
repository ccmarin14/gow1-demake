import type { Simulation } from '../sim/engine';
import { scenarioNames } from '../sim/scenarios';
import type { ScaleReference } from '../scale';
import type {
  GameAction,
  HarnessMetrics,
  InputTrace,
  PresentationMetrics,
  SimulationSnapshot,
} from '../sim/types';

export interface HarnessApp {
  simulation: Simulation;
  getPresentationMetrics: () => PresentationMetrics;
  getScaleReference: () => ScaleReference;
  toggleScaleReference?: () => boolean;
  isScaleReferenceVisible?: () => boolean;
}

export interface DevHarness {
  snapshot(): SimulationSnapshot;
  loadScenario(name: string): SimulationSnapshot;
  reset(): SimulationSnapshot;
  step(frames?: number, actions?: GameAction[]): SimulationSnapshot;
  advance(deltaMs: number, actions?: GameAction[]): SimulationSnapshot;
  metrics(): HarnessMetrics;
  scenarios(): string[];
  record(): boolean;
  stop(): InputTrace;
  replay(trace: InputTrace): SimulationSnapshot;
  scaleReference(): ScaleReference;
  toggleScaleReference(): boolean;
  isScaleReferenceVisible(): boolean;
}

declare global {
  interface Window {
    __GOW8B?: DevHarness;
  }
}

export function installHarness(app: HarnessApp): DevHarness | null {
  if (!import.meta.env.DEV) {
    return null;
  }

  const { simulation } = app;

  const harness: DevHarness = {
    snapshot: () => simulation.world.snapshot(),
    loadScenario: (name) => {
      simulation.world.loadScenario(name);
      simulation.resetClock();
      return simulation.world.snapshot();
    },
    reset: () => {
      simulation.world.reset();
      simulation.resetClock();
      return simulation.world.snapshot();
    },
    step: (frames = 1, actions = []) => {
      simulation.stepManual(frames, actions);
      return simulation.world.snapshot();
    },
    advance: (deltaMs, actions = []) => {
      simulation.advance(deltaMs, actions);
      return simulation.world.snapshot();
    },
    metrics: () => {
      const presentation = app.getPresentationMetrics();
      return {
        ...presentation,
        ticks: simulation.world.frame,
        simulationTimeMs: simulation.world.timeMs,
        entities: simulation.world.entityCount,
        activeEffects: 0,
      };
    },
    scenarios: () => scenarioNames(),
    record: () => {
      simulation.startRecording();
      return true;
    },
    stop: () => simulation.stopRecording(),
    replay: (trace) => {
      simulation.replay(trace);
      return simulation.world.snapshot();
    },
    scaleReference: () => app.getScaleReference(),
    toggleScaleReference: () => app.toggleScaleReference?.() ?? false,
    isScaleReferenceVisible: () => app.isScaleReferenceVisible?.() ?? false,
  };

  window.__GOW8B = harness;
  return harness;
}
