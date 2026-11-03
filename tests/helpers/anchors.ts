import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import type { StrikePoseAnchors, Vec2 } from '../../src/sim/strike';

export const ANCHORS: Record<string, { back: number[]; hand: number[]; farHand: number[]; shoulder: number[]; farShoulder: number[] }> =
  JSON.parse(readFileSync(new URL('../../src/assets/kratos-anchors.json', import.meta.url), 'utf-8'));
export const feet = (p: number[]): Vec2 => [p[0] - 32, p[1] - 56];
export const poseAnchors: StrikePoseAnchors = (pose) => {
  const a = ANCHORS[`kratos-${pose}`];
  assert.ok(a, `anchors for ${pose}`);
  return { back: feet(a.back), hand: feet(a.hand), farHand: feet(a.farHand) };
};
export const dist = (a: Vec2, b: Vec2): number => Math.hypot(a[0] - b[0], a[1] - b[1]);
export const pathLength = (points: readonly Vec2[]): number => points.slice(1).reduce((sum, p, i) => sum + dist(p, points[i]), 0);
