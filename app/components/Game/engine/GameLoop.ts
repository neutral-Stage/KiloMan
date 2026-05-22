import type { GameState } from '../types';
import { MENU_LOOP_FPS } from '../constants';

export type TickFn = (dt: number, gameState: GameState) => void;

export class GameLoop {
  private rafId = 0;
  private lastTime = 0;
  private running = false;
  private getGameState: () => GameState = () => 'start';

  start(getState: () => GameState, tick: TickFn): void {
    this.stop();
    this.getGameState = getState;
    this.running = true;
    this.lastTime = 0;

    const frame = (timestamp: number) => {
      if (!this.running) return;
      if (!this.lastTime) this.lastTime = timestamp;
      const rawDt = (timestamp - this.lastTime) / 16.667;
      this.lastTime = timestamp;

      const gs = this.getGameState();
      const isIdle = gs === 'start' || gs === 'gameover' || gs === 'shop';
      const isPaused = gs === 'paused';

      let dt = Math.min(rawDt, 3);
      if (isIdle) {
        const interval = 1000 / MENU_LOOP_FPS;
        if (rawDt * 16.667 < interval * 0.85) {
          this.rafId = requestAnimationFrame(frame);
          return;
        }
        dt = (MENU_LOOP_FPS / 60) * Math.min(rawDt, 2);
      }

      tick(dt, gs);

      if (isIdle || isPaused) {
        // Background-only updates use reduced dt above
      }

      this.rafId = requestAnimationFrame(frame);
    };

    this.rafId = requestAnimationFrame(frame);
  }

  stop(): void {
    this.running = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = 0;
    this.lastTime = 0;
  }
}
