import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { CONFIG } from '../src/config';
import { STRIKES, startStrike, stepStrike, type StrikeId } from '../src/sim/strike';
import { World } from '../src/sim/world';

/**
 * Damage Kratos deals to one standing target 40 px ahead with a full strike,
 * through the real hit code (`stepStrike`): every hit window and the ground
 * impact count once. Lingering ground fire is separate (see FIRE below).
 */
function damageOf(id: StrikeId): number {
  const world = new World();
  world.loadScenario('legionnaire');
  const { entities } = world.snapshot();
  const base = entities.find((e) => e.kind === 'player');
  const dummy = entities.find((e) => e.kind === 'legionnaire');
  assert.ok(base && dummy);
  const player = { ...base, x: 200, facing: 1 as const, grounded: true };
  const target = { ...dummy, x: 240, y: base.y, hp: 10_000, isDead: false };
  const state = startStrike(player, id);
  for (let i = 0; i < 400; i += 1) {
    if (stepStrike(state, player, [target], 0, 1000).done) break;
  }
  return 10_000 - target.hp;
}

/** Damage of one full strike at 40 px (not the per-hit `damage` of the data). */
const TABLE: Record<string, number> = {
  square1: 10,
  square2: 10,
  square3: 10,
  square4: 10,
  square5: 14,
  square6: 40,
  triangle: 20,
  launcher: 10,
  plume: 40,
  spirit: 64,
  air1: 10,
  air2: 10,
  air3: 10,
  airTriangle: 40,
};

/** Extra damage of the fire a strike leaves burning, once per enemy. */
const FIRE: Record<string, number> = { plume: 10, spirit: 16 };

const sum = (ids: readonly string[]): number => ids.reduce((acc, id) => acc + TABLE[id], 0);

describe('damage table: what each full strike deals', () => {
  for (const [id, expected] of Object.entries(TABLE)) {
    it(`${id} deals ${expected} to a target 40 px ahead`, () => {
      assert.equal(damageOf(id as StrikeId), expected);
    });
  }

  it('the lingering fire of Plume and Spirit is the data value', () => {
    for (const [id, expected] of Object.entries(FIRE)) {
      const linger = STRIKES[id as StrikeId].phases
        .flatMap((p) => p.effects ?? [])
        .flatMap((e) => (e.kind === 'groundFire' && e.linger ? [e.linger.damage] : []));
      assert.deepEqual(linger, [expected]);
    }
  });

  it('Ascension itself does no damage: its blow is the launcher before it', () => {
    assert.equal(damageOf('ascension'), 0);
  });
});

describe('hits to kill', () => {
  const legionnaire = CONFIG.enemy.legionnaire.maxHp;
  const archer = CONFIG.enemy.archer.maxHp;
  const hydra = CONFIG.enemy.hydra.maxHp;

  it('a legionnaire (60) survives squares 1 to 5 (54) and dies to the sixth', () => {
    const first5 = sum(['square1', 'square2', 'square3', 'square4', 'square5']);
    assert.equal(first5, 54);
    assert.ok(first5 < legionnaire);
    assert.ok(first5 + TABLE.square6 >= legionnaire);
  });

  it('squares 1 and 2 plus Plume kill a legionnaire exactly, before its fire burns', () => {
    assert.equal(sum(['square1', 'square2', 'plume']), legionnaire);
  });

  it('squares 1 to 5 plus Spirit kill a legionnaire and a full square combo does not reach the hydra', () => {
    assert.ok(sum(['square1', 'square2', 'square3', 'square4', 'square5', 'spirit']) >= legionnaire);
    assert.ok(sum(['square1', 'square2', 'square3', 'square4', 'square5', 'square6']) < hydra);
  });

  it('an archer (40) dies to four squares', () => {
    assert.equal(sum(['square1', 'square2', 'square3', 'square4']), archer);
  });

  it('the hydra (300) needs more than one full combo of either finisher', () => {
    const plumeCombo = sum(['square1', 'square2', 'plume']) + FIRE.plume;
    const spiritCombo = sum(['square1', 'square2', 'square3', 'square4', 'square5', 'spirit']) + FIRE.spirit;
    assert.ok(plumeCombo < hydra);
    assert.ok(spiritCombo < hydra);
  });
});
