'use client';

import type { PlayerProgress, UnlockId } from './types';
import { UNLOCKS } from './rewards/constants';

interface ShopScreenProps {
  progress: PlayerProgress;
  onPurchase: (id: UnlockId) => void;
  onClose: () => void;
}

const UNLOCK_ORDER: UnlockId[] = [
  'skin_gold',
  'skin_neon',
  'skin_stealth',
  'skin_vintage',
  'upgrade_health',
  'upgrade_spread',
  'upgrade_shield',
  'upgrade_speed',
];

export default function ShopScreen({ progress, onPurchase, onClose }: ShopScreenProps) {
  return (
    <div
      className="absolute inset-0 z-20 flex items-center justify-center p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Upgrade shop"
    >
      <div className="game-panel max-h-[90vh] w-full max-w-lg overflow-y-auto px-6 py-8">
        <p className="game-label">Hangar</p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold text-[var(--game-text)]">
          Upgrade shop
        </h1>
        <p className="mt-2 text-sm text-[var(--game-text-muted)]">
          Balance:{' '}
          <span className="game-stat text-[var(--game-warm)]">
            {progress.totalCoins.toLocaleString()} coins
          </span>
          {progress.totalGems > 0 && (
            <>
              {' '}
              · <span className="game-stat text-[var(--game-accent)]">{progress.totalGems} gems</span>
            </>
          )}
        </p>

        <ul className="mt-6 space-y-3">
          {UNLOCK_ORDER.map((id, index) => {
            const def = UNLOCKS[id];
            const unlock = progress.unlocks.find((u) => u.id === id);
            const purchased = unlock?.purchased ?? false;
            const canAfford = progress.totalCoins >= def.cost;

            return (
              <li
                key={id}
                className="flex items-start justify-between gap-3 rounded-lg border border-[var(--game-border)] bg-[rgba(255,255,255,0.03)] px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-[var(--game-text)]">
                    <span className="game-stat mr-2 text-[var(--game-text-muted)]">{index + 1}.</span>
                    {def.name}
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--game-text-muted)]">{def.description}</p>
                  <p className="mt-1 text-xs text-[var(--game-warm)]">{def.cost.toLocaleString()} coins</p>
                </div>
                <button
                  type="button"
                  className="game-btn shrink-0 px-3 py-1.5 text-xs disabled:opacity-40"
                  disabled={purchased || !canAfford}
                  onClick={() => onPurchase(id)}
                >
                  {purchased ? 'Owned' : 'Buy'}
                </button>
              </li>
            );
          })}
        </ul>

        <button type="button" className="game-btn mt-8 w-full" onClick={onClose}>
          Back to menu
        </button>
        <p className="mt-4 text-center text-[11px] text-[var(--game-text-muted)]">
          Press S from the start screen to open the shop · Esc to return
        </p>
      </div>
    </div>
  );
}
