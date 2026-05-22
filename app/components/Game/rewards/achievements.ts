import type { AchievementId, GameData, PlayerProgress, PlayerShip, ShipSkin, UnlockId } from '../types';
import { PLAYER_STARTING_HEALTH, POWER_UP_DURATION } from '../constants';
import { ACHIEVEMENTS } from './constants';
export function checkAchievements(
  pp: PlayerProgress,
  gd: GameData,
  frame: number,
): AchievementId[] {
  const newlyUnlocked: AchievementId[] = [];

  for (const ach of pp.achievements) {
    if (ach.unlocked) continue;

    let progress = ach.progress;
    switch (ach.id) {
      case 'first_coin':
      case 'coin_collector_100':
      case 'coin_collector_500':
      case 'coin_collector_1000':
        progress = pp.totalCoins;
        break;
      case 'gem_hunter_10':
      case 'gem_hunter_50':
        progress = pp.totalGems;
        break;
      case 'wave_5_no_damage':
      case 'wave_10_no_damage':
        progress = pp.currentNoDamageWave;
        break;
      case 'first_blood':
        progress = pp.enemiesDefeated;
        break;
      case 'sharpshooter':
        progress = pp.shotsHit;
        break;
      case 'boss_killer':
        progress = pp.bossKills;
        break;
      case 'shield_master':
        progress = pp.shieldBlocks;
        break;
      case 'survivor_100wave':
        progress = gd.wave;
        break;
    }

    ach.progress = progress;
    if (progress >= ach.target) {
      ach.unlocked = true;
      ach.unlockedAt = frame;
      newlyUnlocked.push(ach.id);
    }
  }

  return newlyUnlocked;
}

export function grantAchievementReward(achId: AchievementId, pp: PlayerProgress): number {
  const def = ACHIEVEMENTS[achId];
  if (!def) return 0;
  pp.totalCoins += def.reward;
  pp.sessionCoins += def.reward;
  return def.reward;
}

export function purchaseUnlock(unlockId: UnlockId, pp: PlayerProgress): boolean {
  const unlock = pp.unlocks.find((u) => u.id === unlockId);
  if (!unlock || unlock.purchased || pp.totalCoins < unlock.cost) return false;

  pp.totalCoins -= unlock.cost;
  unlock.purchased = true;

  if (unlock.type === 'skin') {
    pp.unlocks.forEach((u) => {
      if (u.type === 'skin') u.active = false;
    });
    unlock.active = true;
  }

  return true;
}

export function applyUnlockEffects(player: PlayerShip, pp: PlayerProgress): void {
  const activeSkin = pp.unlocks.find((u) => u.type === 'skin' && u.active);
  if (activeSkin) {
    player.shipSkin = activeSkin.id.replace('skin_', '') as ShipSkin;
  } else {
    player.shipSkin = 'default';
  }

  if (pp.unlocks.find((u) => u.id === 'upgrade_health' && u.purchased)) {
    player.maxHealth = PLAYER_STARTING_HEALTH + 1;
    player.health = player.maxHealth;
  }

  if (pp.unlocks.find((u) => u.id === 'upgrade_spread' && u.purchased)) {
    player.powerUps.spreadShot = POWER_UP_DURATION;
  }

  if (pp.unlocks.find((u) => u.id === 'upgrade_shield' && u.purchased)) {
    player.powerUps.shield = POWER_UP_DURATION;
  }
}
