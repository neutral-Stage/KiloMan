// ===== KILO SHOOTER - Type Definitions =====

export type GameState = 'start' | 'playing' | 'gameover';

export interface Vec2 {
  x: number;
  y: number;
}

export interface PlayerShip {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  health: number;
  maxHealth: number;
  lives: number;
  invincibleTimer: number; // frames of invincibility remaining
  powerUps: ActivePowerUps;
  thrusterFrame: number;
}

export interface ActivePowerUps {
  spreadShot: number;   // frames remaining
  shield: number;       // frames remaining (absorbs 1 hit)
  speedBoost: number;   // frames remaining
}

export interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  damage: number;
  color: string;
  isPlayerBullet: boolean;
}

export type EnemyType = 'basic' | 'zigzag' | 'swooper' | 'tank' | 'boss';

export type EnemyMovementPattern = 'straight' | 'zigzag' | 'swoop' | 'boss';

export interface Enemy {
  x: number;
  y: number;
  width: number;
  height: number;
  health: number;
  maxHealth: number;
  type: EnemyType;
  pattern: EnemyMovementPattern;
  speed: number;
  shootTimer: number;
  shootInterval: number;
  points: number;
  // Pattern-specific state
  patternTimer: number;
  patternAmplitude: number;
  startX: number;
  color: string;
  isBoss: boolean;
}

export type PowerUpType = 'spread' | 'shield' | 'speed' | 'life';

export interface PowerUp {
  x: number;
  y: number;
  width: number;
  height: number;
  type: PowerUpType;
  vy: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface Star {
  x: number;
  y: number;
  speed: number;
  size: number;
  brightness: number;
}

export interface WaveConfig {
  enemies: Array<{
    type: EnemyType;
    count: number;
    delay: number; // frames between spawns
  }>;
  isBossWave: boolean;
}

export interface GameData {
  score: number;
  wave: number;
  highScore: number;
  waveEnemiesRemaining: number;
  waveSpawnQueue: Array<{ type: EnemyType; spawnAt: number }>;
  waveTimer: number;
  betweenWaves: boolean;
  betweenWaveTimer: number;
}
