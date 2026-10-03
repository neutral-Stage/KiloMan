import type { MutableRefObject } from 'react';
import type { GameState, TouchInput } from '../types';
import { defaultTouchInput } from '../types';

export class InputSystem {
  keys: Record<string, boolean> = {};
  private gameStateRef: { current: GameState } = { current: 'start' };
  private setGameState?: (s: GameState) => void;
  private touchInputRef?: MutableRefObject<TouchInput>;
  private onUnlockAudio?: () => void;

  attach(options: {
    getGameState: () => GameState;
    setGameState: (s: GameState) => void;
    touchInputRef?: MutableRefObject<TouchInput>;
    onUnlockAudio: () => void;
  }): () => void {
    this.setGameState = options.setGameState;
    this.touchInputRef = options.touchInputRef;
    this.onUnlockAudio = options.onUnlockAudio;

    const syncState = () => {
      this.gameStateRef.current = options.getGameState();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      this.keys[e.code] = true;
      this.onUnlockAudio?.();
      syncState();
      const gs = this.gameStateRef.current;
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'Escape'].includes(e.code)) {
        e.preventDefault();
      }
      if (e.code === 'Enter' && (gs === 'start' || gs === 'gameover')) {
        options.setGameState('playing');
      }
      if (e.code === 'Escape') {
        if (gs === 'playing') options.setGameState('paused');
        else if (gs === 'paused') options.setGameState('playing');
        else if (gs === 'shop') options.setGameState('start');
      }
      if (e.code === 'KeyS' && gs === 'start') {
        options.setGameState('shop');
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      this.keys[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }

  getTouch(): TouchInput {
    return this.touchInputRef?.current ?? defaultTouchInput();
  }
}
