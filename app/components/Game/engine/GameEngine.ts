import type { MutableRefObject } from 'react';
import { Application } from 'pixi.js';
import type {
  Bullet,
  Enemy,
  GameData,
  GameState,
  HudSnapshot,
  Particle,
  PlayerProgress,
  PlayerShip,
  PowerUp,
  PowerUpType,
  TouchInput,
  UnlockId,
  Collectible,
  RewardPopup,
} from '../types';
import { defaultTouchInput } from '../types';
import AudioEngine from '../AudioEngine';
import { generateWave, createEnemy } from '../waveGenerator';
import { centeredHitbox, rectsOverlap } from '../collision';
import { createDefaultPlayer, createDefaultGameData } from '../defaults';
import { saveHighScore } from '../storage';
import {
  createBulletPool,
  createParticlePool,
  compactBullets,
  compactParticles,
  ObjectPool,
} from '../pool';
import {
  startWaveFromConfig,
  isWaveComplete,
  getSpawnEntriesDue,
  filterFutureSpawnEntries,
} from '../waveLogic';
import {
  checkAchievements,
  grantAchievementReward,
  purchaseUnlock,
} from '../rewards/achievements';
import { maybeSpawnCollectible } from '../rewards/collectibles';
import { loadPlayerProgress, savePlayerProgress } from '../rewards/progress';
import {
  PLAYER_SHOOT_COOLDOWN,
  AUTO_FIRE_ENABLED,
  INVINCIBILITY_FRAMES,
  HIT_INVINCIBILITY_FRAMES,
  POWER_UP_DURATION,
  POWER_UP_DROP_CHANCE,
  BETWEEN_WAVE_DELAY,
  MAX_LIVES,
  COLORS,
  PLAYER_ACCELERATION,
  PLAYER_MAX_SPEED,
  PLAYER_DECELERATION,
  COAST_DRAG,
  MOVEMENT_SNAP_THRESHOLD,
  PLAYER_SPEED_BOOST_MULTIPLIER,
  DRIFT_PARTICLE_SPEED_THRESHOLD,
  LANDING_VERTICAL_SPEED_THRESHOLD,
  OFF_SCREEN_ENEMY_PENALTY,
  SPATIAL_CELL_SIZE,
} from '../constants';
import { createGameTextures } from './TextureFactory';
import { RenderSystem } from './RenderSystem';
import { VfxSystem } from './VfxSystem';
import { InputSystem } from './InputSystem';
import { SpatialHash } from './spatialHash';
import { buildHudSnapshot, hudSnapshotEquals } from './hud';

function pushBullet(
  pool: ObjectPool<Bullet>,
  list: Bullet[],
  props: Partial<Bullet> & Pick<Bullet, 'x' | 'y' | 'isPlayerBullet'>,
): void {
  const b = pool.acquire();
  b.x = props.x;
  b.y = props.y;
  b.isPlayerBullet = props.isPlayerBullet;
  b.vx = props.vx ?? 0;
  b.vy = props.vy ?? 0;
  b.width = props.width ?? 4;
  b.height = props.height ?? 12;
  b.damage = props.damage ?? 1;
  b.color = props.color ?? COLORS.bulletPlayer;
  b.destroyed = false;
  list.push(b);
}

export interface GameEngineCallbacks {
  getGameState: () => GameState;
  setGameState: (s: GameState) => void;
  onHudUpdate?: (hud: HudSnapshot) => void;
  onProgressUpdate?: (progress: PlayerProgress) => void;
  touchInputRef?: MutableRefObject<TouchInput>;
}

export class GameEngine {
  app: Application | null = null;
  render: RenderSystem | null = null;
  readonly vfx = new VfxSystem();
  readonly input = new InputSystem();

  private width = 800;
  private height = 600;
  private frame = 0;
  private shootCooldown = 0;
  private tookDamageThisWave = false;
  private lastHud: HudSnapshot | null = null;

  player: PlayerShip = createDefaultPlayer(400, 500);
  bullets: Bullet[] = [];
  enemies: Enemy[] = [];
  powerUps: PowerUp[] = [];
  particles: Particle[] = [];
  collectibles: Collectible[] = [];
  rewardPopups: RewardPopup[] = [];
  gameData: GameData = createDefaultGameData();
  playerProgress: PlayerProgress = loadPlayerProgress();

  private bulletPool = createBulletPool(80);
  private particlePool = createParticlePool(160);
  private enemyHash = new SpatialHash<Enemy>(SPATIAL_CELL_SIZE);
  private audio = new AudioEngine();
  private callbacks: GameEngineCallbacks | null = null;
  private detachInput: (() => void) | null = null;

  async init(container: HTMLElement, callbacks: GameEngineCallbacks): Promise<void> {
    this.callbacks = callbacks;
    const app = new Application();
    await app.init({
      resizeTo: container,
      backgroundColor: 0x0a0f18,
      antialias: true,
      resolution: Math.min(window.devicePixelRatio ?? 1, 2),
      autoDensity: true,
    });
    container.appendChild(app.canvas);
    this.app = app;
    this.width = app.screen.width;
    this.height = app.screen.height;

    const textures = createGameTextures(app);
    this.render = new RenderSystem(app, textures, this.vfx);
    this.render.resize(this.width, this.height);

    this.detachInput = this.input.attach({
      getGameState: callbacks.getGameState,
      setGameState: callbacks.setGameState,
      touchInputRef: callbacks.touchInputRef,
      onUnlockAudio: () => this.audio.unlock(),
    });

    callbacks.onProgressUpdate?.(this.playerProgress);
  }

  resize(w: number, h: number): void {
    this.width = w;
    this.height = h;
    this.render?.resize(w, h);
  }

  handleShopPurchase(id: UnlockId): void {
    if (purchaseUnlock(id, this.playerProgress)) {
      savePlayerProgress(this.playerProgress);
      this.callbacks?.onProgressUpdate?.(this.playerProgress);
    }
  }

  resetRun(): void {
    const pp = this.playerProgress;
    this.player = createDefaultPlayer(this.width / 2, this.height - 80, pp);
    this.bulletPool.releaseAll(this.bullets);
    this.particlePool.releaseAll(this.particles);
    this.bullets = [];
    this.enemies = [];
    this.powerUps = [];
    this.collectibles = [];
    this.rewardPopups = [];
    this.particles = [];
    pp.sessionCoins = 0;
    pp.sessionGems = 0;
    pp.currentNoDamageWave = 0;
    this.tookDamageThisWave = false;
    if (this.callbacks?.touchInputRef) {
      this.callbacks.touchInputRef.current = defaultTouchInput();
    }
    this.lastHud = null;
    this.gameData = createDefaultGameData();
    this.shootCooldown = 0;
    this.frame = 0;
    this.render?.initStars(this.width, this.height);
  }

  tick(dt: number, gameState: GameState): void {
    if (!this.app || !this.render) return;

    if (gameState === 'playing') {
      const vfxMult = this.vfx.update(dt);
      this.updatePlaying(dt * vfxMult);
    } else {
      this.vfx.update(dt * 0.5);
      this.render.updateStars(dt, this.height, this.width);
    }

    this.render.sync(
      this.player,
      this.enemies,
      this.bullets,
      this.powerUps,
      this.collectibles,
      this.rewardPopups,
      this.particles,
      this.frame,
      gameState,
    );
  }

  private updatePlaying(dt: number): void {
    const render = this.render;
    if (!render) return;

    const player = this.player;
    const keys = this.input.keys;
    const touch = this.input.getTouch();
    const gd = this.gameData;
    const W = this.width;
    const H = this.height;

    this.frame++;
    player.thrusterFrame++;

    this.updateMovement(player, keys, touch, dt, W, H);
    this.updateShooting(player, keys, touch);
    this.updateTimers(player, dt);
    render.updateStars(dt, H, W);

    for (const b of this.bullets) {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
    }
    compactBullets(this.bullets, this.bulletPool, W, H);

    this.updateEnemies(dt, W, H);
    this.compactPowerUps(H, dt);
    this.updateCollectibles(dt, H);
    this.updatePopups(dt);
    this.updateParticles(dt);

    this.resolveCollisions(player, gd, W, H);
    this.updateWaves(gd, W, dt);

    if (gd.score > gd.highScore) gd.highScore = gd.score;

    if (this.frame % 30 === 0) {
      this.checkMetaAchievements(gd, player);
    }

    this.emitHud(gd, player);
  }

  private updateMovement(
    player: PlayerShip,
    keys: Record<string, boolean>,
    touch: TouchInput,
    dt: number,
    W: number,
    H: number,
  ): void {
    const left = keys['ArrowLeft'] || keys['KeyA'] || touch.left;
    const right = keys['ArrowRight'] || keys['KeyD'] || touch.right;
    const up = keys['ArrowUp'] || keys['KeyW'] || touch.up;
    const down = keys['ArrowDown'] || keys['KeyS'] || touch.down;
    const speedMult =
      (player.powerUps.speedBoost > 0 ? PLAYER_SPEED_BOOST_MULTIPLIER : 1) * dt;
    const effectiveMaxSpeed = PLAYER_MAX_SPEED * speedMult;
    const accel = PLAYER_ACCELERATION * speedMult;

    if (left) player.vx -= accel;
    else if (right) player.vx += accel;
    else {
      player.vx *= PLAYER_DECELERATION;
      if (Math.abs(player.vx) < MOVEMENT_SNAP_THRESHOLD) player.vx = 0;
    }

    if (up) player.vy -= accel;
    else if (down) player.vy += accel;
    else {
      player.vy *= PLAYER_DECELERATION;
      if (Math.abs(player.vy) < MOVEMENT_SNAP_THRESHOLD) player.vy = 0;
    }

    if (!left && !right && !up && !down) {
      player.vx *= COAST_DRAG;
      player.vy *= COAST_DRAG;
      if (Math.abs(player.vx) < MOVEMENT_SNAP_THRESHOLD) player.vx = 0;
      if (Math.abs(player.vy) < MOVEMENT_SNAP_THRESHOLD) player.vy = 0;
    }

    player.vx = Math.max(-effectiveMaxSpeed, Math.min(effectiveMaxSpeed, player.vx));
    player.vy = Math.max(-effectiveMaxSpeed, Math.min(effectiveMaxSpeed, player.vy));
    player.x += player.vx;
    player.y += player.vy;

    player.x = Math.max(0, Math.min(W - player.width, player.x));
    const bottomLimit = H - player.height - 10;
    if (player.y > bottomLimit) {
      const impactVy = player.vy;
      player.y = bottomLimit;
      player.vy = 0;
      if (impactVy > LANDING_VERTICAL_SPEED_THRESHOLD) {
        this.spawnParticles(
          player.x + player.width / 2,
          player.y + player.height,
          Math.min(10, Math.floor(impactVy * 5)),
          COLORS.muted,
          2,
        );
        this.audio.playLanding();
      }
    } else if (player.y < H * 0.3) {
      player.y = H * 0.3;
      player.vy = 0;
    }

    const thrusting = left || right || up || down;
    if (thrusting) {
      const thrustX = player.x + player.width / 2;
      const thrustY = player.y + player.height;
      for (let i = 0; i < 1 + Math.floor(Math.random() * 2); i++) {
        const angle = Math.PI / 2 + (Math.random() - 0.5) * 0.8;
        const spd = 2 + Math.random() * 2;
        const p = this.particlePool.acquire();
        p.x = thrustX + (Math.random() - 0.5) * 6;
        p.y = thrustY;
        p.vx = Math.cos(angle) * spd;
        p.vy = Math.sin(angle) * spd;
        p.life = 14 + Math.random() * 8;
        p.maxLife = 22;
        p.color = Math.random() > 0.4 ? COLORS.warm : COLORS.accent;
        p.size = 2 + Math.random() * 1.5;
        this.particles.push(p);
      }
    } else if (Math.hypot(player.vx, player.vy) > DRIFT_PARTICLE_SPEED_THRESHOLD && Math.random() > 0.6) {
      const p = this.particlePool.acquire();
      p.x = player.x + player.width / 2 + (Math.random() - 0.5) * 8;
      p.y = player.y + player.height;
      p.vx = Math.random() - 0.5;
      p.vy = Math.random();
      p.life = 25;
      p.maxLife = 40;
      p.color = COLORS.muted;
      p.size = 1.5;
      this.particles.push(p);
    }
  }

  private updateShooting(player: PlayerShip, keys: Record<string, boolean>, touch: TouchInput): void {
    if (this.shootCooldown > 0) this.shootCooldown--;
    if (AUTO_FIRE_ENABLED || keys['Space'] || touch.fire) {
      this.playerShoot(player);
    }
  }

  private updateTimers(player: PlayerShip, dt: number): void {
    if (player.powerUps.spreadShot > 0) player.powerUps.spreadShot -= dt;
    if (player.powerUps.shield > 0) player.powerUps.shield -= dt;
    if (player.powerUps.speedBoost > 0) player.powerUps.speedBoost -= dt;
    if (player.invincibleTimer > 0) player.invincibleTimer -= dt;
  }

  private updateEnemies(dt: number, W: number, H: number): void {
    for (const e of this.enemies) {
      e.patternTimer += dt;
      e.shootTimer += dt;

      switch (e.pattern) {
        case 'straight':
          e.y += e.speed * dt;
          break;
        case 'zigzag':
          e.y += e.speed * dt;
          e.x = e.startX + Math.sin(e.patternTimer * 0.05) * e.patternAmplitude;
          break;
        case 'swoop':
          e.y += e.speed * dt;
          e.x = e.startX + Math.sin(e.patternTimer * 0.03) * e.patternAmplitude;
          if (e.patternTimer > 60 && e.patternTimer < 120) e.y += e.speed * 2 * dt;
          break;
        case 'boss':
          if (e.y < 60) e.y += e.speed * dt;
          else e.x = W / 2 - e.width / 2 + Math.sin(e.patternTimer * 0.02) * (W * 0.3);
          break;
      }

      e.x = Math.max(0, Math.min(W - e.width, e.x));

      if (e.shootTimer >= e.shootInterval && e.y > 0) {
        e.shootTimer = 0;
        this.enemyShoot(e);
      }
    }

    let write = 0;
    for (let i = 0; i < this.enemies.length; i++) {
      const e = this.enemies[i];
      if (e.y <= H + 100) {
        this.enemies[write++] = e;
      } else if (OFF_SCREEN_ENEMY_PENALTY) {
        this.gameData.waveEnemiesRemaining = Math.max(0, this.gameData.waveEnemiesRemaining - 1);
      }
    }
    this.enemies.length = write;
  }

  private compactPowerUps(H: number, dt: number): void {
    let write = 0;
    for (let i = 0; i < this.powerUps.length; i++) {
      const p = this.powerUps[i];
      p.y += p.vy * dt;
      if (p.y < H + 30) this.powerUps[write++] = p;
    }
    this.powerUps.length = write;
  }

  private updateCollectibles(dt: number, H: number): void {
    let write = 0;
    for (let i = 0; i < this.collectibles.length; i++) {
      const c = this.collectibles[i];
      c.x += c.vx * dt;
      c.y += c.vy * dt;
      if (c.y < H + 30) this.collectibles[write++] = c;
    }
    this.collectibles.length = write;
  }

  private updatePopups(dt: number): void {
    let write = 0;
    for (let i = 0; i < this.rewardPopups.length; i++) {
      const rp = this.rewardPopups[i];
      rp.y += rp.vy * dt;
      rp.life -= dt;
      if (rp.life > 0) this.rewardPopups[write++] = rp;
    }
    this.rewardPopups.length = write;
  }

  private updateParticles(dt: number): void {
    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      p.size *= 0.98;
    }
    compactParticles(this.particles, this.particlePool);
  }

  private resolveCollisions(player: PlayerShip, gd: GameData, W: number, H: number): void {
    const ph = centeredHitbox(
      player.x,
      player.y,
      player.width,
      player.height,
      player.collisionWidth,
      player.collisionHeight,
    );

    this.enemyHash.clear();
    for (const e of this.enemies) {
      const eh = centeredHitbox(e.x, e.y, e.width, e.height, e.collisionWidth, e.collisionHeight);
      this.enemyHash.insert(eh.x, eh.y, eh.w, eh.h, e);
    }

    for (const bullet of this.bullets) {
      if (!bullet.isPlayerBullet || bullet.destroyed) continue;
      const bh = centeredHitbox(bullet.x, bullet.y, bullet.width, bullet.height, bullet.width, bullet.height);
      this.enemyHash.query(bh.x, bh.y, bh.w, bh.h, (enemy) => {
        if (bullet.destroyed) return;
        const eh = centeredHitbox(
          enemy.x,
          enemy.y,
          enemy.width,
          enemy.height,
          enemy.collisionWidth,
          enemy.collisionHeight,
        );
        if (!rectsOverlap(bh.x, bh.y, bh.w, bh.h, eh.x, eh.y, eh.w, eh.h)) return;

        enemy.health -= bullet.damage;
        bullet.destroyed = true;

        if (enemy.health <= 0) {
          this.onEnemyKilled(enemy, gd);
          enemy.destroyed = true;
        } else {
          this.playerProgress.shotsHit++;
          this.spawnParticles(bullet.x, bullet.y, 3, COLORS.white, 1);
          this.audio.playHit();
        }
      });
    }

    let ew = 0;
    for (let i = 0; i < this.enemies.length; i++) {
      if (!this.enemies[i].destroyed) this.enemies[ew++] = this.enemies[i];
    }
    this.enemies.length = ew;

    if (player.invincibleTimer <= 0) {
      for (const bullet of this.bullets) {
        if (bullet.isPlayerBullet || bullet.destroyed) continue;
        const bh = centeredHitbox(bullet.x, bullet.y, bullet.width, bullet.height, bullet.width, bullet.height);
        if (rectsOverlap(bh.x, bh.y, bh.w, bh.h, ph.x, ph.y, ph.w, ph.h)) {
          bullet.destroyed = true;
          this.applyDamageToPlayer(player, W, H);
          break;
        }
      }

      for (const enemy of this.enemies) {
        const eh = centeredHitbox(
          enemy.x,
          enemy.y,
          enemy.width,
          enemy.height,
          enemy.collisionWidth,
          enemy.collisionHeight,
        );
        if (rectsOverlap(ph.x, ph.y, ph.w, ph.h, eh.x, eh.y, eh.w, eh.h)) {
          this.applyDamageToPlayer(player, W, H);
          break;
        }
      }
    }

    const pp = this.playerProgress;
    for (let i = this.collectibles.length - 1; i >= 0; i--) {
      const col = this.collectibles[i];
      if (rectsOverlap(ph.x, ph.y, ph.w, ph.h, col.x, col.y, col.width, col.height)) {
        if (col.type === 'coin') {
          pp.totalCoins += col.value;
          pp.sessionCoins += col.value;
          this.spawnRewardPopup(col.x, col.y, `+${col.value}`, COLORS.warm);
        } else if (col.type === 'gem') {
          pp.totalGems++;
          pp.sessionGems++;
          this.spawnRewardPopup(col.x, col.y, '+Gem', COLORS.accent);
        } else {
          pp.totalDiamonds++;
          this.spawnRewardPopup(col.x, col.y, '+Diamond', COLORS.accentSoft);
        }
        this.collectibles.splice(i, 1);
      }
    }

    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const pu = this.powerUps[i];
      if (rectsOverlap(ph.x, ph.y, ph.w, ph.h, pu.x, pu.y, pu.width, pu.height)) {
        this.applyPowerUp(player, pu.type);
        this.audio.playPowerUp();
        this.vfx.triggerSlowMo(8);
        this.spawnParticles(pu.x + pu.width / 2, pu.y + pu.height / 2, 8, COLORS.success, 2);
        this.powerUps.splice(i, 1);
      }
    }
  }

  private onEnemyKilled(enemy: Enemy, gd: GameData): void {
    gd.score += enemy.points;
    gd.waveEnemiesRemaining = Math.max(0, gd.waveEnemiesRemaining - 1);
    const pp = this.playerProgress;
    pp.enemiesDefeated++;
    if (enemy.isBoss) pp.bossKills++;
    pp.shotsHit++;
    this.spawnParticles(
      enemy.x + enemy.width / 2,
      enemy.y + enemy.height / 2,
      enemy.isBoss ? 40 : 15,
      enemy.color,
      enemy.isBoss ? 5 : 3,
    );
    this.audio.playExplosion();
    this.vfx.triggerShake(enemy.isBoss ? 12 : 5, enemy.isBoss ? 12 : 6);
    this.spawnPowerUp(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
    const col = maybeSpawnCollectible(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
    if (col) this.collectibles.push(col);
  }

  private applyDamageToPlayer(player: PlayerShip, W: number, H: number): void {
    if (player.powerUps.shield > 0) {
      player.powerUps.shield = 0;
      this.playerProgress.shieldBlocks++;
      this.spawnParticles(player.x + player.width / 2, player.y + player.height / 2, 10, COLORS.accent, 2);
      this.audio.playHit();
      return;
    }
    this.playerHit(player, W, H);
  }

  private playerHit(player: PlayerShip, W: number, H: number): void {
    this.tookDamageThisWave = true;
    this.playerProgress.currentNoDamageWave = 0;
    player.health -= 1;
    this.vfx.triggerShake(8, 8);
    this.vfx.triggerHitStop();
    this.vfx.triggerDamageFlash();
    this.spawnParticles(player.x + player.width / 2, player.y + player.height / 2, 20, COLORS.warm, 4);

    if (player.health <= 0) {
      player.lives -= 1;
      player.health = player.maxHealth;
      this.audio.playExplosion();

      if (player.lives <= 0) {
        const gd = this.gameData;
        if (gd.score > gd.highScore) {
          gd.highScore = gd.score;
          saveHighScore(gd.highScore);
        }
        savePlayerProgress(this.playerProgress);
        this.callbacks?.onProgressUpdate?.(this.playerProgress);
        this.callbacks?.setGameState('gameover');
        return;
      }

      player.invincibleTimer = INVINCIBILITY_FRAMES;
      player.x = W / 2 - player.width / 2;
      player.y = H - 80;
      player.vx = 0;
      player.vy = 0;
      player.powerUps = { spreadShot: 0, shield: 0, speedBoost: 0 };
    } else {
      this.audio.playHit();
      player.invincibleTimer = HIT_INVINCIBILITY_FRAMES;
    }
  }

  private updateWaves(gd: GameData, W: number, dt: number): void {
    if (gd.betweenWaves) {
      gd.betweenWaveTimer -= dt;
      if (gd.betweenWaveTimer <= 0) {
        gd.betweenWaves = false;
        startWaveFromConfig(gd, generateWave(gd.wave));
        this.audio.playWaveStart();
        this.vfx.triggerSlowMo(18);
      }
    } else {
      gd.waveTimer += dt;
      const toSpawn = getSpawnEntriesDue(gd.waveSpawnQueue, gd.waveTimer);
      for (const s of toSpawn) {
        this.enemies.push(createEnemy(s.type, W));
      }
      gd.waveSpawnQueue = filterFutureSpawnEntries(gd.waveSpawnQueue, gd.waveTimer);

      if (isWaveComplete(gd, this.enemies.length)) {
        const pp = this.playerProgress;
        if (!this.tookDamageThisWave) pp.currentNoDamageWave++;
        else pp.currentNoDamageWave = 0;
        this.tookDamageThisWave = false;
        gd.wave++;
        gd.betweenWaves = true;
        gd.betweenWaveTimer = BETWEEN_WAVE_DELAY;
      }
    }
  }

  private checkMetaAchievements(gd: GameData, player: PlayerShip): void {
    const unlocked = checkAchievements(this.playerProgress, gd, this.frame);
    for (const achId of unlocked) {
      const reward = grantAchievementReward(achId, this.playerProgress);
      this.spawnRewardPopup(player.x + player.width / 2, player.y, `Achievement! +${reward}`, COLORS.success);
    }
    if (unlocked.length > 0) {
      savePlayerProgress(this.playerProgress);
      this.callbacks?.onProgressUpdate?.(this.playerProgress);
    }
  }

  private emitHud(gd: GameData, player: PlayerShip): void {
    const boss = this.enemies.find((e) => e.isBoss);
    const bossHealth = boss
      ? { current: boss.health, max: boss.maxHealth }
      : null;
    const snap = buildHudSnapshot(gd, player, this.playerProgress, bossHealth);
    if (!this.lastHud || !hudSnapshotEquals(snap, this.lastHud)) {
      this.lastHud = snap;
      this.callbacks?.onHudUpdate?.(snap);
    }
  }

  private playerShoot(player: PlayerShip): void {
    if (this.shootCooldown > 0) return;
    this.shootCooldown = PLAYER_SHOOT_COOLDOWN;
    this.audio.playLaser();
    this.playerProgress.totalShots++;

    const cx = player.x + player.width / 2;
    const base = {
      y: player.y - 10,
      vy: -10,
      width: 4,
      height: 12,
      damage: 1,
      color: COLORS.bulletPlayer,
      isPlayerBullet: true as const,
    };

    if (player.powerUps.spreadShot > 0) {
      pushBullet(this.bulletPool, this.bullets, { ...base, x: cx - 2 });
      pushBullet(this.bulletPool, this.bullets, { ...base, x: cx - 12, vx: -2 });
      pushBullet(this.bulletPool, this.bullets, { ...base, x: cx + 8, vx: 2 });
    } else {
      pushBullet(this.bulletPool, this.bullets, { ...base, x: cx - 2 });
    }
  }

  private enemyShoot(enemy: Enemy): void {
    const cx = enemy.x + enemy.width / 2;
    const cy = enemy.y + enemy.height;

    if (enemy.isBoss) {
      for (let i = -2; i <= 2; i++) {
        pushBullet(this.bulletPool, this.bullets, {
          x: cx - 3 + i * 20,
          y: cy,
          width: 6,
          height: 6,
          vx: i * 1.5,
          vy: 4,
          damage: 1,
          color: COLORS.bulletEnemy,
          isPlayerBullet: false,
        });
      }
    } else {
      pushBullet(this.bulletPool, this.bullets, {
        x: cx - 3,
        y: cy,
        width: 6,
        height: 6,
        vx: 0,
        vy: 4 + Math.random() * 2,
        damage: 1,
        color: COLORS.bulletEnemy,
        isPlayerBullet: false,
      });
    }
  }

  private spawnParticles(x: number, y: number, count: number, color: string, speed = 3): void {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const spd = speed * (0.5 + Math.random());
      const p = this.particlePool.acquire();
      p.x = x;
      p.y = y;
      p.vx = Math.cos(angle) * spd;
      p.vy = Math.sin(angle) * spd;
      p.life = 30 + Math.random() * 20;
      p.maxLife = 50;
      p.color = color;
      p.size = 2 + Math.random() * 3;
      this.particles.push(p);
    }
  }

  private spawnPowerUp(x: number, y: number): void {
    if (Math.random() > POWER_UP_DROP_CHANCE) return;
    const types: PowerUpType[] = ['spread', 'shield', 'speed', 'life'];
    const type = types[Math.floor(Math.random() * types.length)];
    this.powerUps.push({ x: x - 10, y, width: 20, height: 20, type, vy: 1.5 });
  }

  private spawnRewardPopup(x: number, y: number, text: string, color: string): void {
    this.rewardPopups.push({ x, y, text, color, life: 60, maxLife: 60, vy: -1.5 });
  }

  private applyPowerUp(player: PlayerShip, type: PowerUpType): void {
    switch (type) {
      case 'spread':
        player.powerUps.spreadShot = POWER_UP_DURATION;
        break;
      case 'shield':
        player.powerUps.shield = POWER_UP_DURATION;
        break;
      case 'speed':
        player.powerUps.speedBoost = POWER_UP_DURATION;
        break;
      case 'life':
        player.lives = Math.min(player.lives + 1, MAX_LIVES);
        player.health = player.maxHealth;
        break;
    }
  }

  destroy(): void {
    this.detachInput?.();
    this.render?.destroy();
    this.app?.destroy(true, { children: true });
    this.app = null;
    this.render = null;
  }
}
