import type { AchievementId, UnlockId } from '../types';

export const PROGRESS_STORAGE_KEY = 'kiloShooterProgress';

export const COLLECTIBLE_SPAWN_CHANCE = 0.5;
export const COIN_VALUE = 10;
export const GEM_VALUE = 50;
export const DIAMOND_VALUE = 200;

export const COIN_SPAWN_WEIGHT = 0.7;
export const GEM_SPAWN_WEIGHT = 0.25;
export const DIAMOND_SPAWN_WEIGHT = 0.05;

export const ACHIEVEMENTS: Record<
  AchievementId,
  { id: AchievementId; title: string; description: string; target: number; reward: number }
> = {
  first_coin: {
    id: 'first_coin',
    title: 'First Coin',
    description: 'Collect your first coin',
    target: 1,
    reward: 10,
  },
  coin_collector_100: {
    id: 'coin_collector_100',
    title: 'Coin Collector',
    description: 'Collect 100 coins',
    target: 100,
    reward: 100,
  },
  coin_collector_500: {
    id: 'coin_collector_500',
    title: 'Coin Hoarder',
    description: 'Collect 500 coins',
    target: 500,
    reward: 500,
  },
  coin_collector_1000: {
    id: 'coin_collector_1000',
    title: 'Coin Baron',
    description: 'Collect 1000 coins',
    target: 1000,
    reward: 1000,
  },
  gem_hunter_10: {
    id: 'gem_hunter_10',
    title: 'Gem Hunter',
    description: 'Collect 10 gems',
    target: 10,
    reward: 200,
  },
  gem_hunter_50: {
    id: 'gem_hunter_50',
    title: 'Gem Master',
    description: 'Collect 50 gems',
    target: 50,
    reward: 500,
  },
  wave_5_no_damage: {
    id: 'wave_5_no_damage',
    title: 'Flawless 5',
    description: 'Complete 5 waves without taking damage',
    target: 5,
    reward: 300,
  },
  wave_10_no_damage: {
    id: 'wave_10_no_damage',
    title: 'Flawless 10',
    description: 'Complete 10 waves without taking damage',
    target: 10,
    reward: 1000,
  },
  first_blood: {
    id: 'first_blood',
    title: 'First Blood',
    description: 'Defeat your first enemy',
    target: 1,
    reward: 25,
  },
  sharpshooter: {
    id: 'sharpshooter',
    title: 'Sharpshooter',
    description: 'Land 100 hits',
    target: 100,
    reward: 200,
  },
  boss_killer: {
    id: 'boss_killer',
    title: 'Boss Slayer',
    description: 'Defeat 5 bosses',
    target: 5,
    reward: 1000,
  },
  shield_master: {
    id: 'shield_master',
    title: 'Shield Master',
    description: 'Block 50 hits with shield',
    target: 50,
    reward: 300,
  },
  survivor_100wave: {
    id: 'survivor_100wave',
    title: 'Century Survivor',
    description: 'Reach wave 100',
    target: 100,
    reward: 5000,
  },
};

export const UNLOCKS: Record<
  UnlockId,
  { id: UnlockId; name: string; description: string; cost: number; type: 'skin' | 'upgrade' }
> = {
  skin_gold: {
    id: 'skin_gold',
    name: 'Gold Ship',
    description: 'Shimmering gold hull',
    cost: 500,
    type: 'skin',
  },
  skin_neon: {
    id: 'skin_neon',
    name: 'Neon Ship',
    description: 'Glowing accent trails',
    cost: 1000,
    type: 'skin',
  },
  skin_stealth: {
    id: 'skin_stealth',
    name: 'Stealth Ship',
    description: 'Dark cloaked appearance',
    cost: 2000,
    type: 'skin',
  },
  skin_vintage: {
    id: 'skin_vintage',
    name: 'Vintage Ship',
    description: 'Classic arcade look',
    cost: 3000,
    type: 'skin',
  },
  upgrade_health: {
    id: 'upgrade_health',
    name: 'Extra Health',
    description: '+1 max hull per run',
    cost: 2000,
    type: 'upgrade',
  },
  upgrade_spread: {
    id: 'upgrade_spread',
    name: 'Persistent Spread',
    description: 'Start with spread shot',
    cost: 3000,
    type: 'upgrade',
  },
  upgrade_shield: {
    id: 'upgrade_shield',
    name: 'Starting Shield',
    description: 'Begin each run with shield',
    cost: 4000,
    type: 'upgrade',
  },
  upgrade_speed: {
    id: 'upgrade_speed',
    name: 'Speed Boost+',
    description: 'Permanent +20% thrust',
    cost: 2500,
    type: 'upgrade',
  },
};
