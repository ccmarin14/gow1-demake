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

  it('records layered Poseidon thunder and the crackle of the ground wave', () => {
    const sound = new SoundManager();

    sound.playMagicThunder();
    sound.playMagicCrackle();
    sound.playMagicCrackle();

    const stats = sound.getStats();
    assert.equal(stats.playCounts.magicThunder, 1);
    assert.equal(stats.playCounts.magicCrackle, 2);
    assert.equal(stats.lastPlayed, 'magicCrackle');
    assert.equal(stats.totalPlayed, 3);
  });

  it('starts the sustained electric buzz and can stop it cleanly', () => {
    const sound = new SoundManager();

    sound.startMagicHum();
    sound.stopMagicHum();
    sound.stopMagicHum();

    const stats = sound.getStats();
    assert.equal(stats.playCounts.magicHum, 1);
    assert.equal(stats.lastPlayed, 'magicHum');
  });

  it('records grab execution audio generators (stab, bone break, throw release, slam, whoosh, clamp)', () => {
    const sound = new SoundManager();

    sound.playGrabWhoosh();
    sound.playGrabClamp();
    sound.playStab();
    sound.playBoneBreak();
    sound.playThrowRelease();
    sound.playSlamImpact();

    const stats = sound.getStats();
    assert.equal(stats.playCounts.grabWhoosh, 1);
    assert.equal(stats.playCounts.grabClamp, 1);
    assert.equal(stats.playCounts.stab, 1);
    assert.equal(stats.playCounts.boneBreak, 1);
    assert.equal(stats.playCounts.throwRelease, 1);
    assert.equal(stats.playCounts.slamImpact, 1);
    assert.equal(stats.lastPlayed, 'slamImpact');
    assert.equal(stats.totalPlayed, 6);
  });
});
