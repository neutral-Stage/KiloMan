'use client';

import React, { useState } from 'react';
import GameCanvas from './GameCanvas';
import { GameState } from './types';

/**
 * Top-level game shell: owns high-level screen state and mounts the canvas.
 */
const GameContainer: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>('start');

  return (
    <div
      className="relative h-full w-full overflow-hidden bg-black"
      role="application"
      aria-label="Kilo Shooter"
    >
      <GameCanvas gameState={gameState} setGameState={setGameState} />
    </div>
  );
};

export default GameContainer;
