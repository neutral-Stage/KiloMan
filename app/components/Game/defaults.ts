import { GameData, PlayerShip, PlayerProgress } from './types';
import {
  PLAYER_STARTING_HEALTH,
  PLAYER_STARTING_LIVES,
  PLAYER_SHIP_HEIGHT,
  PLAYER_SHIP_SPEED,
  PLAYER_SHIP_WIDTH,
  PLAYER_COLLISION_WIDTH,
  PLAYER_COLLISION_HEIGHT,
} from './constants';
import { loadHighScore } from './storage';
import { applyUnlockEffects } from './rewards/achievements';

export function createDefaultPlayer(cx: number, cy: number, progress?: PlayerProgress): PlayerShip {
  const player: PlayerShip = {
    x: cx - PLAYER_SHIP_WIDTH / 2,
    y: cy,
    vx: 0,
    vy: 0,
    width: PLAYER_SHIP_WIDTH,
    height: PLAYER_SHIP_HEIGHT,
    collisionWidth: PLAYER_COLLISION_WIDTH,
    collisionHeight: PLAYER_COLLISION_HEIGHT,
    speed: PLAYER_SHIP_SPEED,
    health: PLAYER_STARTING_HEALTH,
    maxHealth: PLAYER_STARTING_HEALTH,
    lives: PLAYER_STARTING_LIVES,
    invincibleTimer: 0,
    powerUps: { spreadShot: 0, shield: 0, speedBoost: 0 },
    thrusterFrame: 0,
    shipSkin: 'default',
  };

  if (progress) {
    applyUnlockEffects(player, progress);
    if (progress.unlocks.find((u) => u.id === 'upgrade_speed' && u.purchased)) {
      player.speed *= 1.2;
    }
  }

  return player;
}

export function createDefaultGameData(): GameData {
  return {
    score: 0,
    wave: 0,
    highScore: loadHighScore(),
    waveEnemiesRemaining: 0,
    waveSpawnQueue: [],
    waveTimer: 0,
    betweenWaves: true,
    betweenWaveTimer: 60,
  };
}
