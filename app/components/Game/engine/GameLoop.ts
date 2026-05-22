import type { GameState } from '../types';
import { MENU_LOOP_FPS } from '../constants';

export type TickFn = (dt: number, gameState: GameState) => void;

const MENU_FRAME_MS = 1000 / MENU_LOOP_FPS;

export class GameLoop {
  private rafId = 0;
  private lastTime = 0;
  private lastMenuTick = 0;
  private running = false;
  private getGameState: () => GameState = () => 'start';

  start(getState: () => GameState, tick: TickFn): void {
    this.stop();
    this.getGameState = getState;
    this.running = true;
    this.lastTime = 0;
    this.lastMenuTick = 0;

    const frame = (timestamp: number) => {
      if (!this.running) return;
      if (!this.lastTime) this.lastTime = timestamp;
      const elapsedMs = timestamp - this.lastTime;
      this.lastTime = timestamp;

      const gs = this.getGameState();
      const isMenu = gs === 'start' || gs === 'gameover' || gs === 'shop';
      const isPaused = gs === 'paused';

      if (isMenu) {
        if (timestamp - this.lastMenuTick < MENU_FRAME_MS) {
          this.rafId = requestAnimationFrame(frame);
          return;
        }
        this.lastMenuTick = timestamp;
        const menuDt = (MENU_FRAME_MS / 16.667) * Math.min(elapsedMs / 16.667, 2);
        tick(menuDt, gs);
        this.rafId = requestAnimationFrame(frame);
        return;
      }

      const rawDt = elapsedMs / 16.667;
      const dt = isPaused ? 0 : Math.min(rawDt, 3);
      tick(dt, gs);

      this.rafId = requestAnimationFrame(frame);
    };

    this.rafId = requestAnimationFrame(frame);
  }

  stop(): void {
    this.running = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = 0;
    this.lastTime = 0;
    this.lastMenuTick = 0;
  }
}
