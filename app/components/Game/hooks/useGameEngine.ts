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
  const pendingResetRef = useRef(false);
  const optionsRef = useRef(options);
  optionsRef.current = options;
  gameStateRef.current = options.gameState;

  const tryResetRun = useCallback(() => {
    const engine = engineRef.current;
    if (engine) {
      engine.resetRun();
      pendingResetRef.current = false;
    } else {
      pendingResetRef.current = true;
    }
  }, []);

  const initEngine = useCallback(async () => {
    const el = containerRef.current;
    if (!el || engineRef.current) return;

    const engine = new GameEngine();
    const opts = optionsRef.current;
    await engine.init(el, {
      getGameState: () => gameStateRef.current,
      setGameState: (s) => opts.setGameState(s),
      onHudUpdate: (h) => opts.onHudUpdate?.(h),
      onProgressUpdate: (p) => opts.onProgressUpdate?.(p),
      touchInputRef: opts.touchInputRef,
    });
    engineRef.current = engine;

    const loop = new GameLoop();
    loopRef.current = loop;
    loop.start(
      () => gameStateRef.current,
      (dt, gs) => engine.tick(dt, gs),
    );

    if (pendingResetRef.current || gameStateRef.current === 'playing') {
      tryResetRun();
    }
  }, [containerRef, tryResetRun]);

  useEffect(() => {
    initEngine();
    return () => {
      loopRef.current?.stop();
      engineRef.current?.destroy();
      engineRef.current = null;
      loopRef.current = null;
    };
  }, [initEngine]);

  const { gameState, shopPurchaseId, onShopPurchaseHandled } = options;

  useEffect(() => {
    const isPlaying = gameState === 'playing';
    if (isPlaying && !prevPlayingRef.current) {
      tryResetRun();
    }
    prevPlayingRef.current = isPlaying;

    if (gameState === 'shop' && shopPurchaseId && engineRef.current) {
      engineRef.current.handleShopPurchase(shopPurchaseId);
      onShopPurchaseHandled?.();
    }
  }, [gameState, shopPurchaseId, onShopPurchaseHandled, tryResetRun]);

  useEffect(() => {
    const handleResize = () => {
      engineRef.current?.resize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden && gameStateRef.current === 'playing') {
        optionsRef.current.setGameState('paused');
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);
}
