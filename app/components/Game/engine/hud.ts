import type { GameData, HudSnapshot, PlayerProgress, PlayerShip } from '../types';

export function buildHudSnapshot(
  gd: GameData,
  player: PlayerShip,
  pp: PlayerProgress,
  bossHealth?: { current: number; max: number } | null,
): HudSnapshot {
  const showWaveBanner = gd.betweenWaves && gd.betweenWaveTimer > 30;
  return {
    score: gd.score,
    highScore: gd.highScore,
    wave: gd.wave,
    lives: player.lives,
    health: player.health,
    maxHealth: player.maxHealth,
    powerUps: {
      spread: player.powerUps.spreadShot > 0,
      shield: player.powerUps.shield > 0,
      speed: player.powerUps.speedBoost > 0,
    },
    betweenWaves: gd.betweenWaves,
    waveAnnouncement: showWaveBanner ? `Wave ${gd.wave + 1}` : null,
    totalCoins: pp.totalCoins,
    sessionCoins: pp.sessionCoins,
    totalGems: pp.totalGems,
    sessionGems: pp.sessionGems,
    noDamageStreak: pp.currentNoDamageWave,
    shipSkin: player.shipSkin,
    bossHealth: bossHealth ?? null,
  };
}

export function hudSnapshotEquals(a: HudSnapshot, b: HudSnapshot): boolean {
  return (
    a.score === b.score &&
    a.highScore === b.highScore &&
    a.wave === b.wave &&
    a.lives === b.lives &&
    a.health === b.health &&
    a.maxHealth === b.maxHealth &&
    a.betweenWaves === b.betweenWaves &&
    a.waveAnnouncement === b.waveAnnouncement &&
    a.powerUps.spread === b.powerUps.spread &&
    a.powerUps.shield === b.powerUps.shield &&
    a.powerUps.speed === b.powerUps.speed &&
    a.totalCoins === b.totalCoins &&
    a.sessionCoins === b.sessionCoins &&
    a.totalGems === b.totalGems &&
    a.sessionGems === b.sessionGems &&
    a.noDamageStreak === b.noDamageStreak &&
    a.shipSkin === b.shipSkin &&
    (a.bossHealth?.current ?? 0) === (b.bossHealth?.current ?? 0) &&
    (a.bossHealth?.max ?? 0) === (b.bossHealth?.max ?? 0)
  );
}
