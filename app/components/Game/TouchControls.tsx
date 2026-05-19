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

const TouchControls: React.FC<TouchControlsProps> = ({
  gameState,
  touchInputRef,
  onPauseToggle,
  onStart,
}) => {
  const activePointers = useRef<Set<Direction | 'fire'>>(new Set());

  const setDirection = useCallback(
    (dir: Direction | 'fire', active: boolean) => {
      if (active) {
        activePointers.current.add(dir);
      } else {
        activePointers.current.delete(dir);
      }
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

  if (gameState === 'start') {
    return (
      <div className="absolute inset-x-0 bottom-8 z-20 flex justify-center px-4 md:hidden">
        <button
          type="button"
          onClick={onStart}
          className="rounded-lg border border-cyan-500/60 bg-cyan-950/80 px-8 py-4 font-mono text-lg font-bold text-cyan-300 backdrop-blur-sm active:bg-cyan-800"
          aria-label="Start game"
        >
          TAP TO START
        </button>
      </div>
    );
  }

  if (gameState === 'gameover') {
    return (
      <div className="absolute inset-x-0 bottom-8 z-20 flex justify-center px-4 md:hidden">
        <button
          type="button"
          onClick={onStart}
          className="rounded-lg border border-cyan-500/60 bg-cyan-950/80 px-8 py-4 font-mono text-lg font-bold text-cyan-300 backdrop-blur-sm active:bg-cyan-800"
          aria-label="Restart game"
        >
          TAP TO RESTART
        </button>
      </div>
    );
  }

  return (
    <div
      className="absolute inset-0 z-20 touch-none select-none md:hidden"
      aria-label="Touch game controls"
    >
      {/* D-pad */}
      <div className="absolute bottom-6 left-4 grid grid-cols-3 grid-rows-3 gap-1">
        <div />
        <button
          {...bindButton('up', 'Move up')}
          className="flex h-14 w-14 items-center justify-center rounded-lg border border-white/20 bg-black/50 text-xl text-white active:bg-white/20"
        >
          ▲
        </button>
        <div />
        <button
          {...bindButton('left', 'Move left')}
          className="flex h-14 w-14 items-center justify-center rounded-lg border border-white/20 bg-black/50 text-xl text-white active:bg-white/20"
        >
          ◀
        </button>
        <div className="h-14 w-14" />
        <button
          {...bindButton('right', 'Move right')}
          className="flex h-14 w-14 items-center justify-center rounded-lg border border-white/20 bg-black/50 text-xl text-white active:bg-white/20"
        >
          ▶
        </button>
        <div />
        <button
          {...bindButton('down', 'Move down')}
          className="flex h-14 w-14 items-center justify-center rounded-lg border border-white/20 bg-black/50 text-xl text-white active:bg-white/20"
        >
          ▼
        </button>
        <div />
      </div>

      {/* Fire + pause */}
      <div className="absolute right-4 bottom-6 flex flex-col gap-3">
        <button
          type="button"
          onClick={onPauseToggle}
          className="h-12 rounded-lg border border-white/20 bg-black/50 px-4 font-mono text-sm text-white active:bg-white/20"
          aria-label={gameState === 'paused' ? 'Resume game' : 'Pause game'}
        >
          {gameState === 'paused' ? '▶' : '❚❚'}
        </button>
        <button
          {...bindButton('fire', 'Fire')}
          className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-orange-500/60 bg-orange-950/70 font-mono text-sm font-bold text-orange-300 active:bg-orange-800"
        >
          FIRE
        </button>
      </div>
    </div>
  );
};

/** Reset touch state when leaving play (call from parent on state change). */
export function resetTouchInput(ref: React.MutableRefObject<TouchInput>): void {
  ref.current = defaultTouchInput();
}

export default TouchControls;
