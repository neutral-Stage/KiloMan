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

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col p-3 sm:p-4">
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        Score {hud.score.toLocaleString()}. Wave {hud.wave + 1}.
        {hud.lives} lives. Hull {hud.health} of {hud.maxHealth}.
        {hud.powerUps.spread && ' Spread shot active.'}
        {hud.powerUps.shield && ' Shield active.'}
        {hud.powerUps.speed && ' Speed boost active.'}
        {hud.waveAnnouncement && ` ${hud.waveAnnouncement}`}
      </div>

      <header className="flex w-full items-start justify-between gap-2 text-sm sm:text-base">
        <div className="font-mono text-white" aria-label={`Score ${hud.score}`}>
          <span className="text-xs text-gray-400 sm:text-sm">SCORE</span>
          <p className="text-lg font-bold tabular-nums sm:text-xl">{hud.score.toLocaleString()}</p>
          <p className="text-xs text-yellow-400 sm:text-sm">
            HI {hud.highScore.toLocaleString()}
          </p>
        </div>

        <div className="text-center font-mono" aria-label={`Wave ${hud.wave + 1}`}>
          <span className="text-xs text-gray-400 sm:text-sm">WAVE</span>
          <p className="text-lg font-bold text-cyan-400 sm:text-xl">{hud.wave + 1}</p>
        </div>

        <div className="text-right font-mono text-white" aria-label={`${hud.lives} lives`}>
          <span className="text-xs text-gray-400 sm:text-sm">LIVES</span>
          <p className="text-lg sm:text-xl" aria-hidden="true">
            {'♥'.repeat(hud.lives)}
          </p>
        </div>
      </header>

      <div className="mt-2 ml-auto w-full max-w-[140px] sm:max-w-[160px]">
        <span className="sr-only">
          Hull integrity {hud.health} of {hud.maxHealth}
        </span>
        <div
          role="progressbar"
          aria-valuenow={hud.health}
          aria-valuemin={0}
          aria-valuemax={hud.maxHealth}
          className="h-2 overflow-hidden rounded-full bg-gray-800 sm:h-2.5"
        >
          <div
            className={`h-full transition-all duration-150 ${
              healthPct > 33 ? 'bg-emerald-500' : 'bg-red-500'
            }`}
            style={{ width: `${healthPct}%` }}
          />
        </div>
      </div>

      {(hud.powerUps.spread || hud.powerUps.shield || hud.powerUps.speed) && (
        <ul
          className="mt-2 ml-auto flex flex-col gap-0.5 text-right font-mono text-xs sm:text-sm"
          aria-label="Active power-ups"
        >
          {hud.powerUps.spread && <li className="text-fuchsia-400">SPREAD</li>}
          {hud.powerUps.shield && <li className="text-cyan-400">SHIELD</li>}
          {hud.powerUps.speed && <li className="text-emerald-400">SPEED+</li>}
        </ul>
      )}

      {hud.waveAnnouncement && (
        <div className="absolute inset-0 flex flex-col items-center justify-center" role="status">
          <p className="font-mono text-3xl font-bold text-white sm:text-4xl">
            WAVE {hud.wave + 1}
          </p>
          {hud.wave > 0 && hud.wave % BOSS_WAVE_INTERVAL === 0 && (
            <p className="mt-2 font-mono text-xl font-bold text-red-500 sm:text-2xl">
              BOSS INCOMING
            </p>
          )}
        </div>
      )}

      {gameState === 'paused' && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center bg-black/55"
          role="dialog"
          aria-modal="true"
          aria-label="Game paused"
        >
          <p className="font-mono text-4xl font-bold text-cyan-400 sm:text-5xl">PAUSED</p>
          <p className="mt-3 font-mono text-sm text-gray-300 sm:text-base">
            Press ESC or tap Resume to continue
          </p>
        </div>
      )}
    </div>
  );
};

export default UIOverlay;
