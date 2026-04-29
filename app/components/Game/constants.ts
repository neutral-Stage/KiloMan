// ===== GAME CONSTANTS =====
export const PLAYER_SHOOT_COOLDOWN = 8;
export const INVINCIBILITY_FRAMES = 120;
export const POWER_UP_DURATION = 600; // 10 seconds at 60fps
export const POWER_UP_DROP_CHANCE = 0.25;
export const BOSS_WAVE_INTERVAL = 5;
export const BETWEEN_WAVE_DELAY = 120;
export const STAR_LAYERS = 3;
export const STAR_COUNT = 150;

// ===== COMBO SYSTEM =====
export const COMBO_TIMEOUT = 120; // frames (2 seconds at 60fps)
export const COMBO_INCREMENT = 1;
export const COMBO_MULTIPLIER_MAX = 10;

// ===== SCREEN SHAKE =====
export const SHAKE_INTENSITY_MINOR = 3;
export const SHAKE_INTENSITY_MAJOR = 8;
export const SHAKE_DURATION_MINOR = 10;
export const SHAKE_DURATION_MAJOR = 20;

// ===== ENHANCED PARTICLES =====
export const PARTICLE_GRAVITY = 0.15;
export const PARTICLE_FRICTION = 0.98;
export const JUMP_PARTICLE_COUNT = 12;
export const LAND_PARTICLE_COUNT = 15;
export const HIT_SPARK_COUNT = 5;
export const BOSS_EXPLOSION_PARTICLES = 60;
export const CRITICAL_HIT_PARTICLES = 20;
export const JUMP_TAKEOFF_PARTICLES = 8;
export const LANDING_DUST_PARTICLES = 12;

// ===== POP-UP TEXT =====
export const POPUP_DURATION = 60;
export const POPUP_VELOCITY_Y = -1.5;

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
