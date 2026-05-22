import { describe, it, expect } from 'vitest';
import {
  createBulletPool,
  createParticlePool,
  compactBullets,
  compactParticles,
} from '../pool';

describe('compactBullets', () => {
  it('removes destroyed and out-of-bounds bullets and returns them to pool', () => {
    const pool = createBulletPool(4);
    const bullets = [
      { x: 50, y: 50, vx: 0, vy: 0, width: 4, height: 4, damage: 1, color: '#fff', isPlayerBullet: true },
      { x: 50, y: -50, vx: 0, vy: 0, width: 4, height: 4, damage: 1, color: '#fff', isPlayerBullet: true, destroyed: true },
      { x: 9999, y: 50, vx: 0, vy: 0, width: 4, height: 4, damage: 1, color: '#fff', isPlayerBullet: true },
    ];
    const initialPool = pool.poolSize;
    compactBullets(bullets, pool, 800, 600);
    expect(bullets).toHaveLength(1);
    expect(bullets[0].x).toBe(50);
    expect(pool.poolSize).toBe(initialPool + 2);
  });
});

describe('compactParticles', () => {
  it('removes dead particles and pools them', () => {
    const pool = createParticlePool(4);
    const particles = [
      { x: 0, y: 0, vx: 0, vy: 0, life: 10, maxLife: 50, color: '#fff', size: 2 },
      { x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 50, color: '#fff', size: 2 },
    ];
    compactParticles(particles, pool);
    expect(particles).toHaveLength(1);
    expect(particles[0].life).toBe(10);
  });
});
