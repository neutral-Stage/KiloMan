import type { Achievement, PlayerProgress, Unlock, UnlockId } from '../types';
import { ACHIEVEMENTS, PROGRESS_STORAGE_KEY, UNLOCKS } from './constants';

export function createDefaultPlayerProgress(): PlayerProgress {
  return {
    totalCoins: 0,
    totalGems: 0,
    totalDiamonds: 0,
    sessionCoins: 0,
    sessionGems: 0,
    achievements: Object.values(ACHIEVEMENTS).map(
      (a): Achievement => ({
        id: a.id,
        title: a.title,
        description: a.description,
        unlocked: false,
        progress: 0,
        target: a.target,
      }),
    ),
    unlocks: Object.values(UNLOCKS).map(
      (u): Unlock => ({
        id: u.id,
        name: u.name,
        description: u.description,
        cost: u.cost,
        type: u.type,
        purchased: false,
        active: false,
      }),
    ),
    wavesWithoutDamage: 0,
    currentNoDamageWave: 0,
    enemiesDefeated: 0,
    bossKills: 0,
    totalShots: 0,
    shotsHit: 0,
    shieldBlocks: 0,
  };
}

export function loadPlayerProgress(): PlayerProgress {
  if (typeof window === 'undefined') return createDefaultPlayerProgress();
  try {
    const saved = localStorage.getItem(PROGRESS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as Partial<PlayerProgress>;
      const defaults = createDefaultPlayerProgress();
      return {
        ...defaults,
        ...parsed,
        achievements: parsed.achievements ?? defaults.achievements,
        unlocks: parsed.unlocks ?? defaults.unlocks,
      };
    }
  } catch {
    /* ignore */
  }
  return createDefaultPlayerProgress();
}

export function savePlayerProgress(pp: PlayerProgress): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(pp));
  } catch {
    /* ignore */
  }
}

export function getActiveSkinId(pp: PlayerProgress): UnlockId | null {
  const active = pp.unlocks.find((u) => u.type === 'skin' && u.purchased && u.active);
  return active?.id ?? null;
}
