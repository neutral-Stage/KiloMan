import { Bullet, Particle } from './types';

/** Generic object pool — reuse instances to reduce GC pressure in the game loop. */
export class ObjectPool<T> {
  private free: T[] = [];

  constructor(
    private readonly factory: () => T,
    private readonly reset: (obj: T) => void,
    initialSize = 32,
  ) {
    for (let i = 0; i < initialSize; i++) {
      this.free.push(factory());
    }
  }

  acquire(): T {
    const obj = this.free.pop();
    if (obj) return obj;
    return this.factory();
  }

  release(obj: T): void {
    this.reset(obj);
    this.free.push(obj);
  }

  releaseAll(objects: T[]): void {
    for (const obj of objects) {
      this.release(obj);
    }
  }

  get poolSize(): number {
    return this.free.length;
  }
}

export function createBulletPool(initialSize = 64): ObjectPool<Bullet> {
  return new ObjectPool<Bullet>(
    () => ({
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      width: 4,
      height: 12,
      damage: 1,
      color: '#00ffff',
      isPlayerBullet: true,
    }),
    (b) => {
      b.destroyed = false;
      b.x = 0;
      b.y = 0;
      b.vx = 0;
      b.vy = 0;
    },
    initialSize,
  );
}

export function createParticlePool(initialSize = 128): ObjectPool<Particle> {
  return new ObjectPool<Particle>(
    () => ({
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      life: 0,
      maxLife: 50,
      color: '#ffffff',
      size: 2,
    }),
    (p) => {
      p.life = 0;
      p.x = 0;
      p.y = 0;
    },
    initialSize,
  );
}

/** Compact active bullets in-place; release removed entries to the pool. */
export function compactBullets(
  bullets: Bullet[],
  pool: ObjectPool<Bullet>,
  w: number,
  h: number,
): void {
  let write = 0;
  for (let i = 0; i < bullets.length; i++) {
    const b = bullets[i];
    const inBounds =
      !b.destroyed &&
      b.y > -20 &&
      b.y < h + 20 &&
      b.x > -20 &&
      b.x < w + 20;
    if (inBounds) {
      bullets[write++] = b;
    } else {
      pool.release(b);
    }
  }
  bullets.length = write;
}

/** Compact dead particles in-place; release to pool. */
export function compactParticles(
  particles: Particle[],
  pool: ObjectPool<Particle>,
): void {
  let write = 0;
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    if (p.life > 0) {
      particles[write++] = p;
    } else {
      pool.release(p);
    }
  }
  particles.length = write;
}
