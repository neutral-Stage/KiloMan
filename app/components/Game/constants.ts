// ===== GAME CONSTANTS =====
export const PLAYER_SHOOT_COOLDOWN = 8;
export const INVINCIBILITY_FRAMES = 120;
export const POWER_UP_DURATION = 600; // 10 seconds at 60fps
export const POWER_UP_DROP_CHANCE = 0.25;
export const BOSS_WAVE_INTERVAL = 5;
export const BETWEEN_WAVE_DELAY = 120;
export const STAR_LAYERS = 3;
export const STAR_COUNT = 150;

// ===== REWARD SYSTEM CONSTANTS =====
export const COLLECTIBLE_SPAWN_CHANCE = 0.5; // 50% chance per enemy death
export const COIN_VALUE = 10;
export const GEM_VALUE = 50;
export const DIAMOND_VALUE = 200;

// Gem spawn rates (must sum to 1.0)
export const COIN_SPAWN_WEIGHT = 0.70;
export const GEM_SPAWN_WEIGHT = 0.25;
export const DIAMOND_SPAWN_WEIGHT = 0.05;

// Achievement definitions
export const ACHIEVEMENTS: Record<string, {
  id: string;
  title: string;
  description: string;
  target: number;
  reward: number;
}> = {
  first_coin: { id: 'first_coin', title: 'First Coin', description: 'Collect your first coin', target: 1, reward: 10 },
  coin_collector_100: { id: 'coin_collector_100', title: 'Coin Collector', description: 'Collect 100 coins', target: 100, reward: 100 },
  coin_collector_500: { id: 'coin_collector_500', title: 'Coin Hoarder', description: 'Collect 500 coins', target: 500, reward: 500 },
  coin_collector_1000: { id: 'coin_collector_1000', title: 'Coin Baron', description: 'Collect 1000 coins', target: 1000, reward: 1000 },
  gem_hunter_10: { id: 'gem_hunter_10', title: 'Gem Hunter', description: 'Collect 10 gems', target: 10, reward: 200 },
  gem_hunter_50: { id: 'gem_hunter_50', title: 'Gem Master', description: 'Collect 50 gems', target: 50, reward: 500 },
  wave_5_no_damage: { id: 'wave_5_no_damage', title: 'Flawless 5', description: 'Complete 5 waves without taking damage', target: 5, reward: 300 },
  wave_10_no_damage: { id: 'wave_10_no_damage', title: 'Flawless 10', description: 'Complete 10 waves without taking damage', target: 10, reward: 1000 },
  first_blood: { id: 'first_blood', title: 'First Blood', description: 'Defeat your first enemy', target: 1, reward: 25 },
  sharpshooter: { id: 'sharpshooter', title: 'Sharpshooter', description: 'Land 100 hits', target: 100, reward: 200 },
  boss_killer: { id: 'boss_killer', title: 'Boss Slayer', description: 'Defeat 5 bosses', target: 5, reward: 1000 },
  shield_master: { id: 'shield_master', title: 'Shield Master', description: 'Block 50 hits with shield', target: 50, reward: 300 },
  survivor_100wave: { id: 'survivor_100wave', title: 'Century Survivor', description: 'Reach wave 100', target: 100, reward: 5000 },
};

// Unlock definitions (permanent upgrades/cosmetics)
export const UNLOCKS: Record<string, {
  id: string;
  name: string;
  description: string;
  cost: number;
  type: 'skin' | 'upgrade';
}> = {
  skin_gold: { id: 'skin_gold', name: 'Gold Ship', description: 'Shimmering gold skin', cost: 500, type: 'skin' },
  skin_neon: { id: 'skin_neon', name: 'Neon Ship', description: 'Glowing neon trail', cost: 1000, type: 'skin' },
  skin_stealth: { id: 'skin_stealth', name: 'Stealth Ship', description: 'Dark cloaked appearance', cost: 2000, type: 'skin' },
  skin_vintage: { id: 'skin_vintage', name: 'Vintage Ship', description: 'Classic arcade look', cost: 3000, type: 'skin' },
  upgrade_health: { id: 'upgrade_health', name: 'Extra Health', description: 'Increase max health by 1', cost: 2000, type: 'upgrade' },
  upgrade_spread: { id: 'upgrade_spread', name: 'Persistent Spread', description: 'Start with spread shot active', cost: 3000, type: 'upgrade' },
  upgrade_shield: { id: 'upgrade_shield', name: 'Starting Shield', description: 'Begin each game with shield', cost: 4000, type: 'upgrade' },
  upgrade_speed: { id: 'upgrade_speed', name: 'Speed Boost+', description: 'Permanent +20% speed', cost: 2500, type: 'upgrade' },
};

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
