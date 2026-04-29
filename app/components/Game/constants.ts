// ===== GAME CONSTANTS =====
export const PLAYER_SHOOT_COOLDOWN = 8;
export const INVINCIBILITY_FRAMES = 120;
export const POWER_UP_DURATION = 600; // 10 seconds at 60fps
export const POWER_UP_DROP_CHANCE = 0.25;
export const BOSS_WAVE_INTERVAL = 5;
export const BETWEEN_WAVE_DELAY = 120;
export const STAR_LAYERS = 3;
export const STAR_COUNT = 150;

// ===== MOVEMENT PHYSICS =====
export const PLAYER_ACCELERATION = 0.4;
export const PLAYER_DECELERATION = 0.85;
export const PLAYER_MAX_SPEED = 5.0;
export const PLAYER_SPEED_BOOST_MULTIPLIER = 1.6;
export const THRUSTER_PARTICLE_SPAWN_RATE = 3; // particles per frame

// ===== COLORS =====
export const COLORS = {
  cyan: '#00ffff',
  magenta: '#ff00ff',
  orange: '#ff8800',
  green: '#00ff66',
  yellow: '#ffff00',
  red: '#ff3333',
  white: '#ffffff',
  playerShip: '#00ccff',
  playerAccent: '#0088ff',
  enemyBasic: '#ff4444',
  enemyZigzag: '#ff8800',
  enemySwooper: '#ff00ff',
  enemyTank: '#888888',
  boss: '#ff0044',
};
