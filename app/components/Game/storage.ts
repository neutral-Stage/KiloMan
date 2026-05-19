import { HIGH_SCORE_STORAGE_KEY } from './constants';

export function loadHighScore(): number {
  if (typeof window === 'undefined') return 0;
  try {
    return parseInt(localStorage.getItem(HIGH_SCORE_STORAGE_KEY) || '0', 10);
  } catch {
    return 0;
  }
}

export function saveHighScore(score: number): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(HIGH_SCORE_STORAGE_KEY, score.toString());
  } catch {
    // localStorage may be unavailable in private browsing
  }
}
