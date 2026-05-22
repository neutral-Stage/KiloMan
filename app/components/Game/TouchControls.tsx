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
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden className="opacity-90">
      <path fill="currentColor" d={paths[dir]} />
    </svg>
  );
}

const padBtn =
  'flex h-[3.25rem] w-[3.25rem] items-center justify-center rounded-xl border border-[var(--game-border)] bg-[var(--game-surface)] text-[var(--game-text)] active:bg-[rgba(255,255,255,0.08)] touch-manipulation';

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

  return (
    <div
      className="absolute inset-0 z-[15] touch-none select-none md:hidden"
      aria-label="Touch game controls"
    >
      <div className="absolute bottom-5 left-4 grid grid-cols-3 grid-rows-3 gap-1.5">
        <div />
        <button {...bindButton('up', 'Move up')} className={padBtn}>
          <Chevron dir="up" />
        </button>
        <div />
        <button {...bindButton('left', 'Move left')} className={padBtn}>
          <Chevron dir="left" />
        </button>
        <div className="h-[3.25rem] w-[3.25rem]" aria-hidden />
        <button {...bindButton('right', 'Move right')} className={padBtn}>
          <Chevron dir="right" />
        </button>
        <div />
        <button {...bindButton('down', 'Move down')} className={padBtn}>
          <Chevron dir="down" />
        </button>
        <div />
      </div>

      <div className="absolute right-4 bottom-5 flex flex-col items-end gap-3">
        <button
          type="button"
          onClick={onPauseToggle}
          className="game-btn game-btn--ghost h-11 min-w-[4.5rem] px-4 text-sm"
          aria-label={gameState === 'paused' ? 'Resume game' : 'Pause game'}
        >
          {gameState === 'paused' ? 'Resume' : 'Pause'}
        </button>
        <button
          {...bindButton('fire', 'Fire')}
          className="flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full border border-[var(--game-border-strong)] bg-[var(--game-accent-dim)] font-medium text-sm text-[var(--game-accent)] active:scale-[0.98] touch-manipulation"
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
