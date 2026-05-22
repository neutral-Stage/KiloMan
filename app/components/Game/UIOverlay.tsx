'use client';

import React from 'react';
import { GameState, HudSnapshot } from './types';
import { BOSS_WAVE_INTERVAL } from './constants';

interface UIOverlayProps {
  gameState: GameState;
  hud: HudSnapshot | null;
}

const UIOverlay: React.FC<UIOverlayProps> = ({ gameState, hud }) => {
  if (gameState === 'start' || gameState === 'gameover' || !hud) {
    return null;
  }

  const healthPct = Math.max(0, Math.min(100, (hud.health / hud.maxHealth) * 100));
  const lowHealth = healthPct <= 33;

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col p-4 sm:p-5">
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        Score {hud.score.toLocaleString()}. Wave {hud.wave + 1}.
        {hud.lives} lives. Hull {hud.health} of {hud.maxHealth}.
        {hud.powerUps.spread && ' Spread shot active.'}
        {hud.powerUps.shield && ' Shield active.'}
        {hud.powerUps.speed && ' Speed boost active.'}
        {hud.waveAnnouncement && ` ${hud.waveAnnouncement}`}
      </div>

      <header className="flex w-full items-start justify-between gap-4">
        <div aria-label={`Score ${hud.score}`}>
          <span className="game-label">Score</span>
          <p className="game-stat mt-0.5 text-xl font-medium text-[var(--game-text)] sm:text-2xl">
            {hud.score.toLocaleString()}
          </p>
          <p className="game-stat mt-0.5 text-xs text-[var(--game-text-muted)]">
            Best {hud.highScore.toLocaleString()}
          </p>
        </div>

        <div className="text-center" aria-label={`Wave ${hud.wave + 1}`}>
          <span className="game-label">Wave</span>
          <p className="game-stat mt-0.5 text-xl font-medium text-[var(--game-accent)] sm:text-2xl">
            {hud.wave + 1}
          </p>
        </div>

        <div className="text-right">
          <span className="game-label">Lives</span>
          <p className="mt-1 flex justify-end gap-1" aria-hidden="true" aria-label={`${hud.lives} lives`}>
            {Array.from({ length: hud.lives }, (_, i) => (
              <span
                key={i}
                className="inline-block h-2.5 w-2.5 rounded-full bg-[var(--game-danger)]"
              />
            ))}
          </p>
          {(hud.sessionCoins > 0 || hud.totalCoins > 0) && (
            <p className="game-stat mt-2 text-xs text-[var(--game-warm)]">
              {hud.sessionCoins > 0 ? `+${hud.sessionCoins} ` : ''}
              {hud.totalCoins.toLocaleString()} coins
            </p>
          )}
          {hud.noDamageStreak > 0 && (
            <p className="mt-1 text-[10px] text-[var(--game-success)]">
              Flawless ×{hud.noDamageStreak}
            </p>
          )}
        </div>
      </header>

      <div className="mt-3 ml-auto w-full max-w-[148px]">
        <span className="sr-only">
          Hull integrity {hud.health} of {hud.maxHealth}
        </span>
        <span className="game-label mb-1 block text-right">Hull</span>
        <div
          role="progressbar"
          aria-valuenow={hud.health}
          aria-valuemin={0}
          aria-valuemax={hud.maxHealth}
          className="h-1.5 overflow-hidden rounded-full bg-[rgba(255,255,255,0.08)]"
        >
          <div
            className="h-full rounded-full transition-[width] duration-150"
            style={{
              width: `${healthPct}%`,
              backgroundColor: lowHealth ? 'var(--game-danger)' : 'var(--game-success)',
            }}
          />
        </div>
      </div>

      {(hud.powerUps.spread || hud.powerUps.shield || hud.powerUps.speed) && (
        <ul
          className="mt-3 ml-auto flex flex-wrap justify-end gap-2 text-xs"
          aria-label="Active power-ups"
        >
          {hud.powerUps.spread && (
            <li className="rounded-md border border-[var(--game-border)] bg-[var(--game-accent-dim)] px-2 py-0.5 text-[var(--game-text)]">
              Spread
            </li>
          )}
          {hud.powerUps.shield && (
            <li className="rounded-md border border-[var(--game-border)] bg-[var(--game-accent-dim)] px-2 py-0.5 text-[var(--game-accent)]">
              Shield
            </li>
          )}
          {hud.powerUps.speed && (
            <li className="rounded-md border border-[var(--game-border)] bg-[rgba(107,196,154,0.12)] px-2 py-0.5 text-[var(--game-success)]">
              Speed
            </li>
          )}
        </ul>
      )}

      {hud.waveAnnouncement && (
        <div className="absolute inset-0 flex flex-col items-center justify-center" role="status">
          <p className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-[var(--game-text)] sm:text-4xl">
            Wave {hud.wave + 1}
          </p>
          {hud.wave > 0 && hud.wave % BOSS_WAVE_INTERVAL === 0 && (
            <p className="mt-2 text-sm font-medium text-[var(--game-warm)]">Boss incoming</p>
          )}
        </div>
      )}
    </div>
  );
};

export default UIOverlay;
