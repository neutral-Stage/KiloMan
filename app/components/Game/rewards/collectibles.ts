import type { Collectible, CollectibleType } from '../types';
import {
  COIN_SPAWN_WEIGHT,
  COIN_VALUE,
  COLLECTIBLE_SPAWN_CHANCE,
  DIAMOND_VALUE,
  GEM_SPAWN_WEIGHT,
  GEM_VALUE,
} from './constants';

export function maybeSpawnCollectible(x: number, y: number): Collectible | null {
  if (Math.random() > COLLECTIBLE_SPAWN_CHANCE) return null;

  const rand = Math.random();
  let type: CollectibleType;
  let value: number;

  if (rand < COIN_SPAWN_WEIGHT) {
    type = 'coin';
    value = COIN_VALUE;
  } else if (rand < COIN_SPAWN_WEIGHT + GEM_SPAWN_WEIGHT) {
    type = 'gem';
    value = GEM_VALUE;
  } else {
    type = 'diamond';
    value = DIAMOND_VALUE;
  }

  return {
    x: x - 8,
    y,
    width: 16,
    height: 16,
    type,
    value,
    vx: (Math.random() - 0.5) * 1,
    vy: 1 + Math.random() * 0.5,
  };
}
