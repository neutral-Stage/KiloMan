import { describe, it, expect } from 'vitest';
import {
  buildWaveSpawnQueue,
  isWaveComplete,
  getSpawnEntriesDue,
  filterFutureSpawnEntries,
  startWaveFromConfig,
} from '../waveLogic';
import { WaveConfig, GameData } from '../types';
import { generateWave } from '../waveGenerator';

describe('buildWaveSpawnQueue', () => {
  it('builds staggered spawn times from groups', () => {
    const config: WaveConfig = {
      isBossWave: false,
      enemies: [
        { type: 'basic', count: 2, delay: 10 },
        { type: 'zigzag', count: 1, delay: 20 },
      ],
    };
    const { queue, totalEnemies } = buildWaveSpawnQueue(config);
    expect(totalEnemies).toBe(3);
    expect(queue).toEqual([
      { type: 'basic', spawnAt: 0 },
      { type: 'basic', spawnAt: 10 },
      { type: 'zigzag', spawnAt: 20 },
    ]);
  });

  it('handles empty enemy list', () => {
    const { queue, totalEnemies } = buildWaveSpawnQueue({
      isBossWave: false,
      enemies: [],
    });
    expect(totalEnemies).toBe(0);
    expect(queue).toEqual([]);
  });
});

describe('isWaveComplete', () => {
  it('is false while enemies remain or are on screen', () => {
    expect(
      isWaveComplete({ waveSpawnQueue: [], waveEnemiesRemaining: 1 }, 0),
    ).toBe(false);
    expect(
      isWaveComplete({ waveSpawnQueue: [{ type: 'basic', spawnAt: 0 }], waveEnemiesRemaining: 0 }, 0),
    ).toBe(false);
    expect(
      isWaveComplete({ waveSpawnQueue: [], waveEnemiesRemaining: 0 }, 2),
    ).toBe(false);
  });

  it('is true when queue empty, counter zero, no active enemies', () => {
    expect(
      isWaveComplete({ waveSpawnQueue: [], waveEnemiesRemaining: 0 }, 0),
    ).toBe(true);
  });
});

describe('spawn queue helpers', () => {
  const queue = [
    { type: 'basic' as const, spawnAt: 0 },
    { type: 'basic' as const, spawnAt: 30 },
    { type: 'tank' as const, spawnAt: 60 },
  ];

  it('getSpawnEntriesDue returns entries at or before timer', () => {
    expect(getSpawnEntriesDue(queue, 0)).toHaveLength(1);
    expect(getSpawnEntriesDue(queue, 30)).toHaveLength(2);
    expect(getSpawnEntriesDue(queue, 100)).toHaveLength(3);
  });

  it('filterFutureSpawnEntries keeps only future spawns', () => {
    expect(filterFutureSpawnEntries(queue, 25)).toEqual([
      { type: 'basic', spawnAt: 30 },
      { type: 'tank', spawnAt: 60 },
    ]);
  });
});

describe('startWaveFromConfig', () => {
  it('mutates game data with queue and enemy count', () => {
    const gd: GameData = {
      score: 0,
      wave: 2,
      highScore: 0,
      waveEnemiesRemaining: 0,
      waveSpawnQueue: [],
      waveTimer: 99,
      betweenWaves: true,
      betweenWaveTimer: 60,
    };
    startWaveFromConfig(gd, generateWave(2));
    expect(gd.waveTimer).toBe(0);
    expect(gd.waveEnemiesRemaining).toBeGreaterThan(0);
    expect(gd.waveSpawnQueue.length).toBe(gd.waveEnemiesRemaining);
  });
});

describe('generateWave integration', () => {
  it('boss wave includes boss entry', () => {
    const wave = generateWave(5);
    expect(wave.isBossWave).toBe(true);
    const { queue } = buildWaveSpawnQueue(wave);
    expect(queue.some((e) => e.type === 'boss')).toBe(true);
  });
});
