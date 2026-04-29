// ===== GAME CONSTANTS =====
export const PLAYER_SHOOT_COOLDOWN = 8;
export const INVINCIBILITY_FRAMES = 120;
export const POWER_UP_DURATION = 600; // 10 seconds at 60fps
export const POWER_UP_DROP_CHANCE = 0.25;
export const BOSS_WAVE_INTERVAL = 5;
export const BETWEEN_WAVE_DELAY = 120;
export const STAR_LAYERS = 3;
export const STAR_COUNT = 150;

import type { ParallaxLayerType } from './types';

// ===== CAMERA CONSTANTS =====
export const CAMERA_SMOOTHING = 0.08;   // Lerp factor (0-1, higher = snappier)
export const CAMERA_OFFSET_Y = -0.3;    // Offset from player center (negative = look above player)
export const WORLD_HEIGHT = 10000;      // Total world height (for star wrapping)

// ===== PARALLAX LAYERS =====
export const PARALLAX_LAYERS: Array<{
  type: ParallaxLayerType;
  speedFactor: number;
  color: string;
  secondaryColor?: string;
}> = [
  {
    type: 'nebula',
    speedFactor: 0.05,
    color: '#1a0033',
    secondaryColor: '#330066',
  },
  {
    type: 'mountains',
    speedFactor: 0.15,
    color: '#0a0a1a',
    secondaryColor: '#111122',
  },
  {
    type: 'stars',
    speedFactor: 0.3,
    color: '#ffffff',
  },
  {
    type: 'cityscape',
    speedFactor: 0.5,
    color: '#0a0a15',
    secondaryColor: '#151525',
  },
];

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
  platform: '#4a4a5a',
  platformTop: '#7a7a8a',
  platformShadow: 'rgba(0, 0, 0, 0.5)',
};
