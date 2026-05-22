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

  const lowHealth = hud.health <= 1;

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col p-4 sm:p-5">
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        Score {hud.score.toLocaleString()}. Wave {hud.wave + 1}.
        {hud.lives} lives. Hull {hud.health} of {hud.maxHealth}.
        {hud.bossHealth && ` Boss health ${hud.bossHealth.current} of ${hud.bossHealth.max}.`}
        {hud.powerUps.spread && ' Spread shot active.'}
        {hud.powerUps.shield && ' Shield active.'}
        {hud.powerUps.speed && ' Speed boost active.'}
        {hud.waveAnnouncement && ` ${hud.waveAnnouncement}`}
      </div>

      <header className="flex w-full items-start justify-between gap-3">
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
          <p className="mt-1 flex justify-end gap-1" aria-hidden="true">
            {Array.from({ length: hud.lives }, (_, i) => (
              <span
                key={i}
                className="inline-block h-2.5 w-2.5 rounded-full bg-[var(--game-danger)] shadow-[0_0_6px_rgba(224,112,112,0.5)]"
              />
            ))}
          </p>
          {(hud.sessionCoins > 0 || hud.totalCoins > 0) && (
            <p className="game-stat mt-2 text-xs text-[var(--game-warm)]">
              {hud.sessionCoins > 0 ? `+${hud.sessionCoins} ` : ''}
              {hud.totalCoins.toLocaleString()} coins
            </p>
          )}
        </div>
      </header>

      <div className="mt-3 ml-auto w-full max-w-[168px]">
        <span className="game-label mb-1 block text-right">Hull</span>
        <div
          role="progressbar"
          aria-valuenow={hud.health}
          aria-valuemin={0}
          aria-valuemax={hud.maxHealth}
          className="flex h-2 gap-0.5 overflow-hidden rounded-full bg-[rgba(255,255,255,0.06)] p-0.5"
        >
          {Array.from({ length: hud.maxHealth }, (_, i) => (
            <div
              key={i}
              className={`hull-segment ${i < hud.health ? 'hull-segment--filled' : ''} ${
                i < hud.health && lowHealth ? 'hull-segment--low' : ''
              }`}
            />
          ))}
        </div>
      </div>

      {hud.bossHealth && (
        <div className="mt-4 w-full max-w-md self-center">
          <span className="game-label mb-1 block text-center text-[var(--game-warm)]">Boss</span>
          <div className="h-2 overflow-hidden rounded-full bg-[rgba(0,0,0,0.4)]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[var(--game-danger)] to-[var(--game-warm)] transition-[width] duration-150"
              style={{
                width: `${(hud.bossHealth.current / hud.bossHealth.max) * 100}%`,
              }}
            />
          </div>
        </div>
      )}

      {(hud.powerUps.spread || hud.powerUps.shield || hud.powerUps.speed) && (
        <ul className="mt-3 ml-auto flex flex-wrap justify-end gap-2 text-xs" aria-label="Active power-ups">
          {hud.powerUps.spread && (
            <li className="rounded-full border border-[var(--game-border)] bg-[var(--game-accent-dim)] px-2.5 py-1 text-[var(--game-text)]">
              Spread
            </li>
          )}
          {hud.powerUps.shield && (
            <li className="rounded-full border border-[var(--game-accent)] bg-[var(--game-accent-dim)] px-2.5 py-1 text-[var(--game-accent)]">
              Shield
            </li>
          )}
          {hud.powerUps.speed && (
            <li className="rounded-full border border-[var(--game-success)] bg-[rgba(107,196,154,0.12)] px-2.5 py-1 text-[var(--game-success)]">
              Speed
            </li>
          )}
        </ul>
      )}

      {hud.waveAnnouncement && (
        <div className="absolute inset-0 flex flex-col items-center justify-center" role="status">
          <p className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-[var(--game-text)] drop-shadow-lg sm:text-4xl">
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
