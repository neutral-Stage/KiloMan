import { Container } from 'pixi.js';

export class VfxSystem {
  shakeFrames = 0;
  shakeIntensity = 0;
  hitStopFrames = 0;
  flashAlpha = 0;
  slowMoFrames = 0;

  triggerShake(intensity: number, frames: number): void {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    this.shakeFrames = Math.max(this.shakeFrames, frames);
  }

  triggerHitStop(frames = 2): void {
    this.hitStopFrames = Math.max(this.hitStopFrames, frames);
  }

  triggerDamageFlash(): void {
    this.flashAlpha = 0.35;
  }

  triggerSlowMo(frames = 18): void {
    this.slowMoFrames = Math.max(this.slowMoFrames, frames);
  }

  /** Returns effective dt multiplier for simulation */
  update(dt: number): number {
    let mult = 1;
    if (this.hitStopFrames > 0) {
      this.hitStopFrames -= dt;
      mult *= 0.3;
    }
    if (this.slowMoFrames > 0) {
      this.slowMoFrames -= dt;
      mult *= 0.55;
    }
    if (this.flashAlpha > 0) {
      this.flashAlpha = Math.max(0, this.flashAlpha - 0.04 * dt);
    }
    if (this.shakeFrames > 0) {
      this.shakeFrames -= dt;
    } else {
      this.shakeIntensity = 0;
    }
    return mult;
  }

  applyShake(root: Container): void {
    if (this.shakeFrames <= 0) {
      root.x = 0;
      root.y = 0;
      return;
    }
    const s = this.shakeIntensity;
    root.x = (Math.random() - 0.5) * s * 2;
    root.y = (Math.random() - 0.5) * s * 2;
  }
}
