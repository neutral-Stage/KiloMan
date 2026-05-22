import { describe, expect, it } from 'vitest';
import { checkAchievements, grantAchievementReward } from '../rewards/achievements';
import { createDefaultPlayerProgress } from '../rewards/progress';
import type { GameData } from '../types';

function mockGameData(wave = 0): GameData {
  return {
    score: 0,
    wave,
    highScore: 0,
    waveEnemiesRemaining: 0,
    waveSpawnQueue: [],
    waveTimer: 0,
    betweenWaves: false,
    betweenWaveTimer: 0,
  };
}

describe('checkAchievements', () => {
  it('unlocks first_coin when totalCoins reaches 1', () => {
    const pp = createDefaultPlayerProgress();
    pp.totalCoins = 1;
    const unlocked = checkAchievements(pp, mockGameData(), 1);
    expect(unlocked).toContain('first_coin');
    expect(pp.achievements.find((a) => a.id === 'first_coin')?.unlocked).toBe(true);
  });

  it('grantAchievementReward adds coins', () => {
    const pp = createDefaultPlayerProgress();
    const before = pp.totalCoins;
    grantAchievementReward('first_blood', pp);
    expect(pp.totalCoins).toBeGreaterThan(before);
  });
});
