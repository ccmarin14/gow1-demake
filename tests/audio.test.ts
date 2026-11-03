import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { SoundManager } from '../src/audio/SoundManager';

describe('strike audio profiles', () => {
  it('records a whoosh and a weighted hit for each strike family without AudioContext', () => {
    const sound = new SoundManager();

    sound.playStrikeWhoosh('light');
    sound.playStrikeHit('light');
    sound.playStrikeWhoosh('heavy');
    sound.playStrikeHit('heavy');
    sound.playStrikeWhoosh('air');
    sound.playStrikeHit('air');

    const stats = sound.getStats();
    assert.equal(stats.playCounts.strikeWhoosh, 3);
    assert.equal(stats.playCounts.strikeHit, 3);
    assert.equal(stats.playCounts.strikeHitLight, 1);
    assert.equal(stats.playCounts.strikeHitHeavy, 1);
    assert.equal(stats.playCounts.strikeHitAir, 1);
    assert.equal(stats.lastPlayed, 'strikeHitAir');
    assert.equal(stats.totalPlayed, 9);
  });
});
