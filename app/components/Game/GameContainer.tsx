'use client';

import React, { useCallback, useRef, useState } from 'react';
import GameCanvas from './GameCanvas';
import GameScreens from './GameScreens';
import UIOverlay from './UIOverlay';
import TouchControls, { resetTouchInput } from './TouchControls';
import { GameState, HudSnapshot, TouchInput, defaultTouchInput } from './types';
import { loadHighScore } from './storage';

const GameContainer: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>('start');
  const [hud, setHud] = useState<HudSnapshot | null>(null);
  const touchInputRef = useRef<TouchInput>(defaultTouchInput());

  const handleStart = useCallback(() => {
    resetTouchInput(touchInputRef);
    setGameState('playing');
  }, []);

  const handlePauseToggle = useCallback(() => {
    setGameState((s) => {
      if (s === 'playing') return 'paused';
      if (s === 'paused') return 'playing';
      return s;
    });
  }, []);

  const score = hud?.score ?? 0;
  const wave = hud?.wave ?? 0;
  const highScore = Math.max(hud?.highScore ?? 0, loadHighScore());

  return (
    <div
      className="relative h-full w-full overflow-hidden bg-[var(--game-bg)]"
      role="application"
      aria-label="Kilo Shooter"
    >
      <GameCanvas
        gameState={gameState}
        setGameState={setGameState}
        onHudUpdate={setHud}
        touchInputRef={touchInputRef}
      />
      <UIOverlay gameState={gameState} hud={hud} />
      <GameScreens
        gameState={gameState}
        score={score}
        wave={wave}
        highScore={highScore}
        onStart={handleStart}
        onRestart={handleStart}
      />
      <TouchControls
        gameState={gameState}
        touchInputRef={touchInputRef}
        onPauseToggle={handlePauseToggle}
        onStart={handleStart}
      />
    </div>
  );
};

export default GameContainer;
