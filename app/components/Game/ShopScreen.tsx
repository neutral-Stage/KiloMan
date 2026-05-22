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

const SKIN_PREVIEW: Partial<Record<UnlockId, string>> = {
  skin_gold: '#c9a227',
  skin_neon: '#6eb5ff',
  skin_stealth: '#4a5568',
  skin_vintage: '#c4a574',
};

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
          Ship upgrades
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

        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {UNLOCK_ORDER.map((id) => {
            const def = UNLOCKS[id];
            const unlock = progress.unlocks.find((u) => u.id === id);
            const purchased = unlock?.purchased ?? false;
            const canAfford = progress.totalCoins >= def.cost;
            const preview = SKIN_PREVIEW[id];

            return (
              <li
                key={id}
                className="flex flex-col rounded-xl border border-[var(--game-border)] bg-[rgba(255,255,255,0.03)] p-4"
              >
                {preview && (
                  <div
                    className="mb-3 h-10 w-10 self-center rounded-full border border-[var(--game-border)]"
                    style={{
                      background: `radial-gradient(circle at 30% 30%, ${preview}, transparent 70%)`,
                      boxShadow: `0 0 16px ${preview}44`,
                    }}
                    aria-hidden
                  />
                )}
                <p className="text-sm font-medium text-[var(--game-text)]">{def.name}</p>
                <p className="mt-1 flex-1 text-xs text-[var(--game-text-muted)]">{def.description}</p>
                <p className="mt-2 text-xs text-[var(--game-warm)]">{def.cost.toLocaleString()} coins</p>
                <button
                  type="button"
                  className="game-btn mt-3 w-full px-3 py-2 text-xs disabled:opacity-40"
                  disabled={purchased || !canAfford}
                  onClick={() => onPurchase(id)}
                >
                  {purchased ? 'Owned' : 'Purchase'}
                </button>
              </li>
            );
          })}
        </ul>

        <button type="button" className="game-btn game-btn--ghost mt-6 w-full" onClick={onClose}>
          Back to hangar bay
        </button>
      </div>
    </div>
  );
}
