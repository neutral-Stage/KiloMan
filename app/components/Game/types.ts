// ===== KILO SHOOTER - Type Definitions =====

export type GameState = 'start' | 'playing' | 'gameover' | 'shop';

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
  // Cosmetic unlocks
  shipSkin: ShipSkin;
  // Extra max health from upgrade
  extraMaxHealth: boolean;
}

export type ShipSkin = 'default' | 'gold' | 'neon' | 'stealth' | 'vintage';

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
  destroyed?: boolean;
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
  destroyed?: boolean;
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

// ===== REWARD SYSTEM TYPES =====
export type CollectibleType = 'coin' | 'gem' | 'diamond';

export interface Collectible {
  x: number;
  y: number;
  width: number;
  height: number;
  type: CollectibleType;
  vx: number;
  vy: number;
  value: number;
}

export interface RewardPopup {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
  vy: number;
}

export type AchievementId =
  | 'first_coin'
  | 'coin_collector_100'
  | 'coin_collector_500'
  | 'coin_collector_1000'
  | 'gem_hunter_10'
  | 'gem_hunter_50'
  | 'wave_5_no_damage'
  | 'wave_10_no_damage'
  | 'first_blood'
  | 'sharpshooter'
  | 'boss_killer'
  | 'shield_master'
  | 'survivor_100wave';

export type UnlockId =
  | 'skin_gold'
  | 'skin_neon'
  | 'skin_stealth'
  | 'skin_vintage'
  | 'upgrade_health'
  | 'upgrade_spread'
  | 'upgrade_shield'
  | 'upgrade_speed';

export interface Achievement {
  id: AchievementId;
  title: string;
  description: string;
  unlocked: boolean;
  unlockedAt?: number; // frame count or timestamp
  progress: number;
  target: number;
}

export interface Unlock {
  id: UnlockId;
  name: string;
  description: string;
  cost: number;
  type: 'skin' | 'upgrade';
  purchased: boolean;
  active: boolean; // for skins
}

export interface PlayerProgress {
  totalCoins: number;
  totalGems: number;
  totalDiamonds: number;
  sessionCoins: number;
  sessionGems: number;
  achievements: Achievement[];
  unlocks: Unlock[];
  wavesWithoutDamage: number;
  currentNoDamageWave: number;
  enemiesDefeated: number;
  bossKills: number;
  totalShots: number;
  shotsHit: number;
  shieldBlocks: number; // number of hits blocked by shield
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
