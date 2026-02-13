'use client';

import React, { useState } from 'react';
import GameCanvas from './GameCanvas';
import { GameState } from './types';

const GameContainer: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>('start');

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      <GameCanvas
        gameState={gameState}
        setGameState={setGameState}
      />
    </div>
  );
};

export default GameContainer;
