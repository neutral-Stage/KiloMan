'use client';

import { useEffect, useRef, useCallback } from 'react';
import type { GameState, HudSnapshot, PlayerProgress, TouchInput, UnlockId } from '../types';
import { GameEngine } from '../engine/GameEngine';
import { GameLoop } from '../engine/GameLoop';

export interface UseGameEngineOptions {
  gameState: GameState;
  setGameState: (s: GameState) => void;
  onHudUpdate?: (hud: HudSnapshot) => void;
  onProgressUpdate?: (progress: PlayerProgress) => void;
  touchInputRef?: React.MutableRefObject<TouchInput>;
  shopPurchaseId?: UnlockId | null;
  onShopPurchaseHandled?: () => void;
}

export function useGameEngine(
  containerRef: React.RefObject<HTMLDivElement | null>,
  options: UseGameEngineOptions,
) {
  const engineRef = useRef<GameEngine | null>(null);
  const loopRef = useRef<GameLoop | null>(null);
  const gameStateRef = useRef(options.gameState);
  const prevPlayingRef = useRef(false);

  gameStateRef.current = options.gameState;

  const initEngine = useCallback(async () => {
    const el = containerRef.current;
    if (!el || engineRef.current) return;

    const engine = new GameEngine();
    await engine.init(el, {
      getGameState: () => gameStateRef.current,
      setGameState: options.setGameState,
      onHudUpdate: options.onHudUpdate,
      onProgressUpdate: options.onProgressUpdate,
      touchInputRef: options.touchInputRef,
    });
    engineRef.current = engine;

    const loop = new GameLoop();
    loopRef.current = loop;
    loop.start(
      () => gameStateRef.current,
      (dt, gs) => engine.tick(dt, gs),
    );
  }, [
    containerRef,
    options.setGameState,
    options.onHudUpdate,
    options.onProgressUpdate,
    options.touchInputRef,
  ]);

  useEffect(() => {
    initEngine();
    return () => {
      loopRef.current?.stop();
      engineRef.current?.destroy();
      engineRef.current = null;
      loopRef.current = null;
    };
  }, [initEngine]);

  const {
    gameState,
    shopPurchaseId,
    onShopPurchaseHandled,
  } = options;

  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;

    const isPlaying = gameState === 'playing';
    if (isPlaying && !prevPlayingRef.current) {
      engine.resetRun();
    }
    prevPlayingRef.current = isPlaying;

    if (gameState === 'shop' && shopPurchaseId) {
      engine.handleShopPurchase(shopPurchaseId);
      onShopPurchaseHandled?.();
    }
  }, [gameState, shopPurchaseId, onShopPurchaseHandled]);

  useEffect(() => {
    const handleResize = () => {
      const engine = engineRef.current;
      if (!engine || !containerRef.current) return;
      engine.resize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [containerRef]);
}
