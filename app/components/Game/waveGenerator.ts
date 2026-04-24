import { WaveConfig, EnemyType, Enemy } from './types';
import { BOSS_WAVE_INTERVAL, COLORS } from './constants';

// ===== WAVE DEFINITIONS =====
export function generateWave(waveNum: number): WaveConfig {
  const isBossWave = waveNum % BOSS_WAVE_INTERVAL === 0 && waveNum > 0;
  const difficulty = Math.floor(waveNum / 2);

  if (isBossWave) {
    return {
      enemies: [
        { type: 'basic', count: 2 + difficulty, delay: 20 },
        { type: 'boss', count: 1, delay: 60 },
      ],
      isBossWave: true,
    };
  }

  const configs: WaveConfig[] = [
    // Wave patterns cycle with increasing difficulty
    {
      enemies: [{ type: 'basic', count: 4 + difficulty * 2, delay: 30 }],
      isBossWave: false,
    },
    {
      enemies: [
        { type: 'basic', count: 3 + difficulty, delay: 25 },
        { type: 'zigzag', count: 2 + difficulty, delay: 30 },
      ],
      isBossWave: false,
    },
    {
      enemies: [
        { type: 'zigzag', count: 3 + difficulty, delay: 25 },
        { type: 'swooper', count: 2 + difficulty, delay: 35 },
      ],
      isBossWave: false,
    },
    {
      enemies: [
        { type: 'basic', count: 2 + difficulty, delay: 20 },
        { type: 'tank', count: 1 + Math.floor(difficulty / 2), delay: 50 },
        { type: 'zigzag', count: 2 + difficulty, delay: 25 },
      ],
      isBossWave: false,
    },
  ];

  return configs[waveNum % configs.length];
}

export function createEnemy(type: EnemyType, canvasWidth: number): Enemy {
  const base = {
    type: type,
    y: -60,
    health: 1,
    maxHealth: 1,
    shootTimer: 0,
    shootInterval: 120,
    patternTimer: 0,
    patternAmplitude: 0,
    startX: 0,
    isBoss: false,
  };

  const x = 50 + Math.random() * (canvasWidth - 100);

  switch (type) {
    case 'basic':
      return {
        ...base, x, width: 30, height: 30, speed: 2, points: 100,
        pattern: 'straight', color: COLORS.enemyBasic,
        shootInterval: 90 + Math.random() * 60, startX: x,
      };
    case 'zigzag':
      return {
        ...base, x, width: 28, height: 28, speed: 2.5, points: 200,
        pattern: 'zigzag', color: COLORS.enemyZigzag,
        patternAmplitude: 80 + Math.random() * 60, startX: x,
        shootInterval: 100 + Math.random() * 40,
      };
    case 'swooper':
      return {
        ...base, x, width: 32, height: 26, speed: 3, points: 300,
        pattern: 'swoop', color: COLORS.enemySwooper,
        patternAmplitude: 120, startX: x,
        shootInterval: 70 + Math.random() * 50,
      };
    case 'tank':
      return {
        ...base, x, width: 40, height: 40, speed: 1, points: 500,
        health: 5, maxHealth: 5, pattern: 'straight', color: COLORS.enemyTank,
        shootInterval: 50 + Math.random() * 30, startX: x,
      };
    case 'boss':
      return {
        ...base,
        x: canvasWidth / 2 - 60,
        y: -120,
        width: 120, height: 80, speed: 1.5, points: 5000,
        health: 50, maxHealth: 50, pattern: 'boss', color: COLORS.boss,
        shootInterval: 20, startX: canvasWidth / 2 - 60, isBoss: true,
      };
    default:
      return {
        ...base, x, width: 30, height: 30, speed: 2, points: 100,
        pattern: 'straight', color: COLORS.enemyBasic, startX: x,
      };
  }
}
