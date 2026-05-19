import { EnemyType, GameData, WaveConfig } from './types';

export interface WaveSpawnEntry {
  type: EnemyType;
  spawnAt: number;
}

export interface WaveQueueResult {
  queue: WaveSpawnEntry[];
  totalEnemies: number;
}

/** Build spawn queue and enemy count from a wave config. */
export function buildWaveSpawnQueue(waveConfig: WaveConfig): WaveQueueResult {
  const queue: WaveSpawnEntry[] = [];
  let time = 0;
  let totalEnemies = 0;

  for (const group of waveConfig.enemies) {
    for (let i = 0; i < group.count; i++) {
      queue.push({ type: group.type, spawnAt: time });
      time += group.delay;
      totalEnemies++;
    }
  }

  return { queue, totalEnemies };
}

/** Apply a new wave to game data (mutates gd). */
export function startWaveFromConfig(gd: GameData, waveConfig: WaveConfig): void {
  const { queue, totalEnemies } = buildWaveSpawnQueue(waveConfig);
  gd.waveSpawnQueue = queue;
  gd.waveTimer = 0;
  gd.waveEnemiesRemaining = totalEnemies;
}

/** True when all enemies for the wave are spawned and destroyed. */
export function isWaveComplete(
  gd: Pick<GameData, 'waveSpawnQueue' | 'waveEnemiesRemaining'>,
  activeEnemyCount: number,
): boolean {
  return (
    gd.waveSpawnQueue.length === 0 &&
    gd.waveEnemiesRemaining <= 0 &&
    activeEnemyCount === 0
  );
}

/** Entries ready to spawn at the current wave timer. */
export function getSpawnEntriesDue(
  queue: WaveSpawnEntry[],
  waveTimer: number,
): WaveSpawnEntry[] {
  return queue.filter((s) => s.spawnAt <= waveTimer);
}

/** Remaining queue after spawning entries up to waveTimer. */
export function filterFutureSpawnEntries(
  queue: WaveSpawnEntry[],
  waveTimer: number,
): WaveSpawnEntry[] {
  return queue.filter((s) => s.spawnAt > waveTimer);
}
