// ===== GAME CONSTANTS =====
export const HIGH_SCORE_STORAGE_KEY = 'kiloShooterHighScore';
export const LOGO_PATH = '/KiloLogo.svg';

export const PLAYER_SHIP_WIDTH = 40;
export const PLAYER_SHIP_HEIGHT = 44;
export const PLAYER_COLLISION_WIDTH = 26;
export const PLAYER_COLLISION_HEIGHT = 34;
export const PLAYER_SHIP_SPEED = 5;
export const PLAYER_ACCELERATION = 0.28;
export const PLAYER_MAX_SPEED = 5.5;
export const PLAYER_DECELERATION = 0.86;
export const COAST_DRAG = 0.95;
export const MOVEMENT_SNAP_THRESHOLD = 0.05;
export const PLAYER_SPEED_BOOST_MULTIPLIER = 1.4;
export const DRIFT_PARTICLE_SPEED_THRESHOLD = 1.5;
export const LANDING_VERTICAL_SPEED_THRESHOLD = 0.5;
export const PLAYER_STARTING_HEALTH = 3;
export const PLAYER_STARTING_LIVES = 3;
export const MAX_LIVES = 5;

export const PLAYER_SHOOT_COOLDOWN = 8;
export const AUTO_FIRE_ENABLED = true;
export const INVINCIBILITY_FRAMES = 120;
export const HIT_INVINCIBILITY_FRAMES = 45;
export const POWER_UP_DURATION = 600; // 10 seconds at 60fps
export const POWER_UP_DROP_CHANCE = 0.25;
export const BOSS_WAVE_INTERVAL = 5;
export const BETWEEN_WAVE_DELAY = 120;
export const STAR_LAYERS = 3;
export const STAR_COUNT = 200;
export const SPATIAL_CELL_SIZE = 64;
export const MENU_LOOP_FPS = 15;
export const OFF_SCREEN_ENEMY_PENALTY = false;
export const MAX_PARTICLES = 120;
export const MAX_REWARD_POPUPS = 12;
export const STAR_REDRAW_INTERVAL = 2;
export const ENEMY_RAM_DESTROY_NON_BOSS = true;

/** Canvas palette — restrained, no neon defaults */
export const COLORS = {
  bgTop: '#0a0f18',
  bgMid: '#0e1520',
  bgBottom: '#121a28',

  accent: '#6eb5ff',
  accentSoft: '#a8d4ff',
  warm: '#e8a86a',
  warmDeep: '#c4844a',
  success: '#6bc49a',
  danger: '#e07070',
  dangerDeep: '#b84a4a',
  white: '#e8edf4',
  muted: '#8b9bb4',

  playerHull: '#7a9cc4',
  playerHighlight: '#b8d4f0',
  playerCockpit: '#6eb5ff',
  thrusterCore: '#e8a86a',
  thrusterFade: 'rgba(232, 168, 106, 0)',

  enemyBasic: '#c97b7b',
  enemyZigzag: '#d4a06a',
  enemySwooper: '#a88bc8',
  enemyTank: '#6b7d8f',
  bossHull: '#b84a4a',
  bossCore: '#e8a86a',
  boss: '#b84a4a',

  bulletPlayer: '#a8d4ff',
  bulletEnemy: '#e89a7a',

  powerSpread: '#c49ad4',
  powerShield: '#6eb5ff',
  powerSpeed: '#6bc49a',
  powerLife: '#e07070',
  particleWhite: '#e8edf4',

  explosion: 'rgba(232, 168, 106, 0.65)',

  // Aliases used across gameplay / legacy HUD helpers
  cyan: '#6eb5ff',
  orange: '#e8a86a',
  red: '#e07070',
  green: '#6bc49a',
  yellow: '#e8a86a',
  magenta: '#c49ad4',
  playerShip: '#7a9cc4',
  playerAccent: '#b8d4f0',
};
