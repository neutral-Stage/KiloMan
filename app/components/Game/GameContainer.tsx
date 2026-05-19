'use client';

import React, { useCallback, useRef, useState } from 'react';
import GameCanvas from './GameCanvas';
import UIOverlay from './UIOverlay';
import TouchControls, { resetTouchInput } from './TouchControls';
import { GameState, HudSnapshot, TouchInput, defaultTouchInput } from './types';

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

  return (
    <div
      className="relative h-full w-full overflow-hidden bg-black"
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
