'use client';

import React, { useCallback, useRef } from 'react';
import { GameState, TouchInput, defaultTouchInput } from './types';

interface TouchControlsProps {
  gameState: GameState;
  touchInputRef: React.MutableRefObject<TouchInput>;
  onPauseToggle: () => void;
  onStart: () => void;
}

type Direction = keyof Pick<TouchInput, 'left' | 'right' | 'up' | 'down'>;

function Chevron({ dir }: { dir: 'up' | 'down' | 'left' | 'right' }) {
  const paths: Record<string, string> = {
    up: 'M12 8l-6 6h12z',
    down: 'M12 16l6-6H6z',
    left: 'M8 12l6-6v12z',
    right: 'M16 12l-6-6v12z',
  };
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden className="opacity-95">
      <path fill="currentColor" d={paths[dir]} />
    </svg>
  );
}

const padBtn =
  'flex h-[3.75rem] w-[3.75rem] items-center justify-center rounded-2xl border border-[var(--game-border-strong)] bg-[var(--game-surface)] text-[var(--game-text)] shadow-[0_4px_16px_rgba(0,0,0,0.35)] active:scale-95 active:border-[var(--game-accent)] active:bg-[var(--game-accent-dim)] touch-manipulation transition-transform';

const TouchControls: React.FC<TouchControlsProps> = ({
  gameState,
  touchInputRef,
  onPauseToggle,
}) => {
  const activePointers = useRef<Set<Direction | 'fire'>>(new Set());

  const setDirection = useCallback(
    (dir: Direction | 'fire', active: boolean) => {
      if (active) activePointers.current.add(dir);
      else activePointers.current.delete(dir);
      const t = touchInputRef.current;
      t.left = activePointers.current.has('left');
      t.right = activePointers.current.has('right');
      t.up = activePointers.current.has('up');
      t.down = activePointers.current.has('down');
      t.fire = activePointers.current.has('fire');
    },
    [touchInputRef],
  );

  const bindButton = (dir: Direction | 'fire', label: string) => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      setDirection(dir, true);
    },
    onPointerUp: (e: React.PointerEvent) => {
      e.preventDefault();
      setDirection(dir, false);
    },
    onPointerCancel: () => setDirection(dir, false),
    'aria-label': label,
    type: 'button' as const,
  });

  if (gameState === 'start' || gameState === 'gameover') {
    return null;
  }

  const fireActive = touchInputRef.current.fire;

  return (
    <div
      className="absolute inset-0 z-[15] touch-none select-none md:hidden"
      aria-label="Touch game controls"
    >
      <div className="absolute bottom-6 left-4 grid grid-cols-3 grid-rows-3 gap-2">
        <div />
        <button {...bindButton('up', 'Move up')} className={padBtn}>
          <Chevron dir="up" />
        </button>
        <div />
        <button {...bindButton('left', 'Move left')} className={padBtn}>
          <Chevron dir="left" />
        </button>
        <div className="h-[3.75rem] w-[3.75rem]" aria-hidden />
        <button {...bindButton('right', 'Move right')} className={padBtn}>
          <Chevron dir="right" />
        </button>
        <div />
        <button {...bindButton('down', 'Move down')} className={padBtn}>
          <Chevron dir="down" />
        </button>
        <div />
      </div>

      <div className="absolute right-4 bottom-6 flex flex-col items-end gap-3">
        <button
          type="button"
          onClick={onPauseToggle}
          className="game-btn game-btn--ghost h-12 min-w-[5rem] px-4 text-sm"
          aria-label={gameState === 'paused' ? 'Resume game' : 'Pause game'}
        >
          {gameState === 'paused' ? 'Resume' : 'Pause'}
        </button>
        <button
          {...bindButton('fire', 'Fire')}
          className={`flex h-[5rem] w-[5rem] items-center justify-center rounded-full border-2 font-semibold text-sm touch-manipulation transition-all ${
            fireActive
              ? 'border-[var(--game-accent)] bg-[var(--game-accent-dim)] text-[var(--game-accent)] shadow-[0_0_24px_var(--game-glow)] scale-95'
              : 'border-[var(--game-border-strong)] bg-[var(--game-surface)] text-[var(--game-accent)]'
          }`}
        >
          Fire
        </button>
      </div>
    </div>
  );
};

export function resetTouchInput(ref: React.MutableRefObject<TouchInput>): void {
  ref.current = defaultTouchInput();
}

export default TouchControls;
