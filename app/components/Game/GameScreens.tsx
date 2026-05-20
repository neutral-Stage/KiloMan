"use client";

import { useEffect, useState } from "react";
import type { GameState } from "./types";
import { loadHighScore } from "./storage";

interface GameScreensProps {
  gameState: GameState;
  score: number;
  wave: number;
  highScore: number;
  onStart: () => void;
  onRestart: () => void;
}

export default function GameScreens({
  gameState,
  score,
  wave,
  highScore,
  onStart,
  onRestart,
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
        <p className="game-label">Kilo Shooter</p>

        <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-[var(--game-text)] sm:text-4xl">
          {isStart && "Ready for launch"}
          {isPaused && "Paused"}
          {gameState === "gameover" && "Mission ended"}
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-[var(--game-text-muted)]">
          {isStart &&
            "Arrow keys or WASD to move. Space to fire. Survive the waves and beat your high score."}
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
            Best run <span className="game-stat text-[var(--game-accent)]">{best.toLocaleString()}</span>
          </p>
        )}

        <div className="mt-8">
          <button
            type="button"
            className="game-btn w-full sm:w-auto"
            onClick={isStart || isPaused ? onStart : onRestart}
            autoFocus
          >
            {isStart ? "Start game" : isPaused ? "Resume" : "Play again"}
          </button>
        </div>

        {isStart && (
          <p className="mt-6 text-[11px] text-[var(--game-text-muted)]">
            Esc pauses during play · Keyboard and touch supported
          </p>
        )}
      </div>
    </div>
  );
}
