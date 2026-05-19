import { GameData, PlayerShip } from './types';
import {
  PLAYER_STARTING_HEALTH,
  PLAYER_STARTING_LIVES,
  PLAYER_SHIP_HEIGHT,
  PLAYER_SHIP_SPEED,
  PLAYER_SHIP_WIDTH,
} from './constants';
import { loadHighScore } from './storage';

export function createDefaultPlayer(cx: number, cy: number): PlayerShip {
  return {
    x: cx - PLAYER_SHIP_WIDTH / 2,
    y: cy,
    width: PLAYER_SHIP_WIDTH,
    height: PLAYER_SHIP_HEIGHT,
    speed: PLAYER_SHIP_SPEED,
    health: PLAYER_STARTING_HEALTH,
    maxHealth: PLAYER_STARTING_HEALTH,
    lives: PLAYER_STARTING_LIVES,
    invincibleTimer: 0,
    powerUps: { spreadShot: 0, shield: 0, speedBoost: 0 },
    thrusterFrame: 0,
  };
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
