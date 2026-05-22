"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { GameState } from "./types";
import { LOGO_PATH } from "./constants";
import { loadHighScore } from "./storage";

interface GameScreensProps {
  gameState: GameState;
  score: number;
  wave: number;
  highScore: number;
  totalCoins?: number;
  onStart: () => void;
  onRestart: () => void;
  onOpenShop?: () => void;
}

export default function GameScreens({
  gameState,
  score,
  wave,
  highScore,
  totalCoins = 0,
  onStart,
  onRestart,
  onOpenShop,
}: GameScreensProps) {
  const [storedBest, setStoredBest] = useState(0);

  useEffect(() => {
    setStoredBest(loadHighScore());
  }, [gameState]);

  if (gameState === "playing") return null;

  const isStart = gameState === "start";
  const isPaused = gameState === "paused";
  const best = Math.max(highScore, storedBest);

  return (
    <div
      className="absolute inset-0 z-20 flex items-center justify-center p-6"
      role="dialog"
      aria-modal="true"
      aria-label={isStart ? "Start game" : isPaused ? "Paused" : "Game over"}
    >
      <div className="game-panel w-full max-w-md px-8 py-9 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[var(--game-border)] bg-[rgba(110,181,255,0.08)]">
          <Image src={LOGO_PATH} alt="" width={36} height={36} priority />
        </div>
        <p className="game-label mt-4">Kilo Shooter</p>

        <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-[var(--game-text)] sm:text-4xl">
          {isStart && "Ready for launch"}
          {isPaused && "Paused"}
          {gameState === "gameover" && "Mission ended"}
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-[var(--game-text-muted)]">
          {isStart &&
            "Survive escalating waves, collect upgrades, and push your high score."}
          {isPaused && "Press Esc or tap Resume to continue."}
          {gameState === "gameover" && (
            <>
              You reached wave{" "}
              <span className="game-stat text-[var(--game-text)]">{wave + 1}</span> with{" "}
              <span className="game-stat text-[var(--game-text)]">{score.toLocaleString()}</span>{" "}
              points.
            </>
          )}
        </p>

        {best > 0 && (
          <p className="mt-4 text-xs text-[var(--game-text-muted)]">
            Best run{" "}
            <span className="game-stat text-[var(--game-accent)]">{best.toLocaleString()}</span>
          </p>
        )}

        {isStart && (
          <div className="mt-6 grid grid-cols-2 gap-2 text-left text-[11px] text-[var(--game-text-muted)]">
            <span className="rounded-lg border border-[var(--game-border)] px-3 py-2">
              <strong className="text-[var(--game-text)]">Move</strong>
              <br />
              WASD / Arrows
            </span>
            <span className="rounded-lg border border-[var(--game-border)] px-3 py-2">
              <strong className="text-[var(--game-text)]">Fire</strong>
              <br />
              Space / Hold Fire
            </span>
            <span className="rounded-lg border border-[var(--game-border)] px-3 py-2">
              <strong className="text-[var(--game-text)]">Pause</strong>
              <br />
              Esc
            </span>
            <span className="rounded-lg border border-[var(--game-border)] px-3 py-2">
              <strong className="text-[var(--game-text)]">Shop</strong>
              <br />
              S on title
            </span>
          </div>
        )}

        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            className="game-btn w-full sm:w-auto"
            onClick={isStart || isPaused ? onStart : onRestart}
            autoFocus
          >
            {isStart ? "Start game" : isPaused ? "Resume" : "Play again"}
          </button>
          {isStart && onOpenShop && (
            <button
              type="button"
              className="game-btn game-btn--ghost w-full sm:w-auto"
              onClick={onOpenShop}
            >
              Hangar ({totalCoins.toLocaleString()})
            </button>
          )}
        </div>

        {isStart && (
          <p className="motion-safe-pulse mt-6 text-[11px] text-[var(--game-accent)]">
            Press Enter or tap Start to launch
          </p>
        )}
      </div>
    </div>
  );
}
