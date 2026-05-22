'use client';

import React, { useRef } from 'react';
import type { GameState, HudSnapshot, PlayerProgress, TouchInput, UnlockId } from './types';
import { useGameEngine } from './hooks/useGameEngine';

interface GameCanvasProps {
  gameState: GameState;
  setGameState: (state: GameState) => void;
  onHudUpdate?: (hud: HudSnapshot) => void;
  onProgressUpdate?: (progress: PlayerProgress) => void;
  touchInputRef?: React.MutableRefObject<TouchInput>;
  shopPurchaseId?: UnlockId | null;
  onShopPurchaseHandled?: () => void;
}

const GameCanvas: React.FC<GameCanvasProps> = (props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  useGameEngine(containerRef, props);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 h-full w-full overflow-hidden bg-[var(--game-bg)]"
      aria-hidden="true"
    />
  );
};

export default GameCanvas;
