'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import {
  GameState, PlayerShip, Bullet, Enemy, PowerUp, PowerUpType,
  Particle, Star, GameData, TouchInput, HudSnapshot, defaultTouchInput,
  Collectible, RewardPopup, PlayerProgress, UnlockId,
} from './types';
import {
  checkAchievements,
  grantAchievementReward,
  purchaseUnlock,
} from './rewards/achievements';
import { maybeSpawnCollectible } from './rewards/collectibles';
import { loadPlayerProgress, savePlayerProgress } from './rewards/progress';
import { drawCollectible, drawRewardPopup } from './rendering/collectibles';
import AudioEngine from './AudioEngine';
import { generateWave, createEnemy } from './waveGenerator';
import { rectsOverlap } from './collision';
import { createDefaultPlayer, createDefaultGameData } from './defaults';
import { saveHighScore } from './storage';
import {
  createBulletPool,
  createParticlePool,
  compactBullets,
  compactParticles,
  ObjectPool,
} from './pool';
import {
  startWaveFromConfig,
  isWaveComplete,
  getSpawnEntriesDue,
  filterFutureSpawnEntries,
} from './waveLogic';
import {
  drawPlayer,
  drawEnemy,
  drawPowerUp,
} from './rendering';
import { drawBackground } from './rendering/background';
import {
  PLAYER_SHOOT_COOLDOWN,
  AUTO_FIRE_ENABLED,
  INVINCIBILITY_FRAMES,
  HIT_INVINCIBILITY_FRAMES,
  POWER_UP_DURATION,
  POWER_UP_DROP_CHANCE,
  BETWEEN_WAVE_DELAY,
  STAR_LAYERS,
  STAR_COUNT,
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
} from './constants';

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

function buildHudSnapshot(
  gd: GameData,
  player: PlayerShip,
  pp: PlayerProgress,
): HudSnapshot {
  const showWaveBanner = gd.betweenWaves && gd.betweenWaveTimer > 30;
  return {
    score: gd.score,
    highScore: gd.highScore,
    wave: gd.wave,
    lives: player.lives,
    health: player.health,
    maxHealth: player.maxHealth,
    powerUps: {
      spread: player.powerUps.spreadShot > 0,
      shield: player.powerUps.shield > 0,
      speed: player.powerUps.speedBoost > 0,
    },
    betweenWaves: gd.betweenWaves,
    waveAnnouncement: showWaveBanner ? `Wave ${gd.wave + 1}` : null,
    totalCoins: pp.totalCoins,
    sessionCoins: pp.sessionCoins,
    totalGems: pp.totalGems,
    sessionGems: pp.sessionGems,
    noDamageStreak: pp.currentNoDamageWave,
    shipSkin: player.shipSkin,
  };
}

function hudSnapshotEquals(a: HudSnapshot, b: HudSnapshot): boolean {
  return (
    a.score === b.score &&
    a.highScore === b.highScore &&
    a.wave === b.wave &&
    a.lives === b.lives &&
    a.health === b.health &&
    a.maxHealth === b.maxHealth &&
    a.betweenWaves === b.betweenWaves &&
    a.waveAnnouncement === b.waveAnnouncement &&
    a.powerUps.spread === b.powerUps.spread &&
    a.powerUps.shield === b.powerUps.shield &&
    a.powerUps.speed === b.powerUps.speed &&
    a.totalCoins === b.totalCoins &&
    a.sessionCoins === b.sessionCoins &&
    a.totalGems === b.totalGems &&
    a.sessionGems === b.sessionGems &&
    a.noDamageStreak === b.noDamageStreak &&
    a.shipSkin === b.shipSkin
  );
}

// ===== COMPONENT =====
interface GameCanvasProps {
  gameState: GameState;
  setGameState: (state: GameState) => void;
  onHudUpdate?: (hud: HudSnapshot) => void;
  onProgressUpdate?: (progress: PlayerProgress) => void;
  touchInputRef?: React.MutableRefObject<TouchInput>;
  shopPurchaseId?: UnlockId | null;
  onShopPurchaseHandled?: () => void;
}

const GameCanvas: React.FC<GameCanvasProps> = ({
  gameState,
  setGameState,
  onHudUpdate,
  onProgressUpdate,
  touchInputRef,
  shopPurchaseId,
  onShopPurchaseHandled,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const [dimensions, setDimensions] = React.useState({ width: 800, height: 600 });

  // Game state refs (mutable for game loop)
  const playerRef = useRef<PlayerShip>(createDefaultPlayer(400, 500));
  const bulletsRef = useRef<Bullet[]>([]);
  const enemiesRef = useRef<Enemy[]>([]);
  const powerUpsRef = useRef<PowerUp[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const starsRef = useRef<Star[]>([]);
  const gameDataRef = useRef<GameData>(createDefaultGameData());
  const keysRef = useRef<Record<string, boolean>>({});
  const shootCooldownRef = useRef(0);
  const frameRef = useRef(0);
  const audioRef = useRef<AudioEngine | null>(null);
  const bulletPoolRef = useRef(createBulletPool(80));
  const particlePoolRef = useRef(createParticlePool(160));
  const lastHudRef = useRef<HudSnapshot | null>(null);
  const playerProgressRef = useRef<PlayerProgress>(loadPlayerProgress());
  const collectiblesRef = useRef<Collectible[]>([]);
  const rewardPopupsRef = useRef<RewardPopup[]>([]);
  const tookDamageThisWaveRef = useRef(false);

  // Initialize stars
  const initStars = useCallback((w: number, h: number) => {
    const stars: Star[] = [];
    for (let i = 0; i < STAR_COUNT; i++) {
      const layer = i % STAR_LAYERS;
      stars.push({
        x: Math.random() * w,
        y: Math.random() * h,
        speed: 0.5 + layer * 1.2,
        size: 1 + layer * 0.5,
        brightness: 0.3 + layer * 0.25,
      });
    }
    starsRef.current = stars;
  }, []);

  // Resize handler
  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      setDimensions({ width: w, height: h });
      initStars(w, h);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [initStars]);

  // Audio engine
  useEffect(() => {
    audioRef.current = new AudioEngine();
  }, []);

  // Input listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.code] = true;
      // Unlock AudioContext on first user gesture
      audioRef.current?.unlock();
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'Escape'].includes(e.code)) {
        e.preventDefault();
      }
      // Start game on Enter
      if (e.code === 'Enter' && gameState === 'start') {
        setGameState('playing');
      }
      // Restart on Enter from gameover
      if (e.code === 'Enter' && gameState === 'gameover') {
        setGameState('playing');
      }
      // Pause / resume
      if (e.code === 'Escape') {
        if (gameState === 'playing') setGameState('paused');
        else if (gameState === 'paused') setGameState('playing');
        else if (gameState === 'shop') setGameState('start');
      }
      if (e.code === 'KeyS' && gameState === 'start') {
        setGameState('shop');
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState, setGameState]);

  useEffect(() => {
    onProgressUpdate?.(playerProgressRef.current);
  }, [onProgressUpdate]);

  useEffect(() => {
    if (!shopPurchaseId || gameState !== 'shop') return;
    if (purchaseUnlock(shopPurchaseId, playerProgressRef.current)) {
      savePlayerProgress(playerProgressRef.current);
      onProgressUpdate?.(playerProgressRef.current);
    }
    onShopPurchaseHandled?.();
  }, [shopPurchaseId, gameState, onProgressUpdate, onShopPurchaseHandled]);

  // Reset game on state change to playing
  useEffect(() => {
    if (gameState === 'playing') {
      const w = dimensions.width;
      const h = dimensions.height;
      const pp = playerProgressRef.current;
      playerRef.current = createDefaultPlayer(w / 2, h - 80, pp);
      bulletPoolRef.current.releaseAll(bulletsRef.current);
      particlePoolRef.current.releaseAll(particlesRef.current);
      bulletsRef.current = [];
      enemiesRef.current = [];
      powerUpsRef.current = [];
      collectiblesRef.current = [];
      rewardPopupsRef.current = [];
      particlesRef.current = [];
      pp.sessionCoins = 0;
      pp.sessionGems = 0;
      pp.currentNoDamageWave = 0;
      tookDamageThisWaveRef.current = false;
      if (touchInputRef) {
        touchInputRef.current = defaultTouchInput();
      }
      lastHudRef.current = null;
      gameDataRef.current = createDefaultGameData();
      shootCooldownRef.current = 0;
      frameRef.current = 0;
      initStars(w, h);
    }
  }, [gameState, dimensions, initStars, touchInputRef]);

  // ===== SPAWN HELPERS =====
  const spawnParticles = useCallback((x: number, y: number, count: number, color: string, speed = 3) => {
    const pool = particlePoolRef.current;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const spd = speed * (0.5 + Math.random());
      const p = pool.acquire();
      p.x = x;
      p.y = y;
      p.vx = Math.cos(angle) * spd;
      p.vy = Math.sin(angle) * spd;
      p.life = 30 + Math.random() * 20;
      p.maxLife = 50;
      p.color = color;
      p.size = 2 + Math.random() * 3;
      particlesRef.current.push(p);
    }
  }, []);

  const spawnPowerUp = useCallback((x: number, y: number) => {
    if (Math.random() > POWER_UP_DROP_CHANCE) return;
    const types: PowerUpType[] = ['spread', 'shield', 'speed', 'life'];
    const type = types[Math.floor(Math.random() * types.length)];
    powerUpsRef.current.push({
      x: x - 10, y, width: 20, height: 20, type, vy: 1.5,
    });
  }, []);

  const spawnRewardPopup = useCallback((x: number, y: number, text: string, color: string) => {
    rewardPopupsRef.current.push({
      x,
      y,
      text,
      color,
      life: 60,
      maxLife: 60,
      vy: -1.5,
    });
  }, []);

  const playerShoot = useCallback((player: PlayerShip) => {
    if (shootCooldownRef.current > 0) return;
    shootCooldownRef.current = PLAYER_SHOOT_COOLDOWN;
    audioRef.current?.playLaser();
    playerProgressRef.current.totalShots++;

    const pool = bulletPoolRef.current;
    const list = bulletsRef.current;
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
      pushBullet(pool, list, { ...base, x: cx - 2 });
      pushBullet(pool, list, { ...base, x: cx - 12, vx: -2 });
      pushBullet(pool, list, { ...base, x: cx + 8, vx: 2 });
    } else {
      pushBullet(pool, list, { ...base, x: cx - 2 });
    }
  }, []);

  const enemyShoot = useCallback((enemy: Enemy) => {
    const pool = bulletPoolRef.current;
    const list = bulletsRef.current;
    const cx = enemy.x + enemy.width / 2;
    const cy = enemy.y + enemy.height;

    if (enemy.isBoss) {
      for (let i = -2; i <= 2; i++) {
        pushBullet(pool, list, {
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
      pushBullet(pool, list, {
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
  }, []);

  const playerHit = useCallback((player: PlayerShip, W: number, H: number) => {
    tookDamageThisWaveRef.current = true;
    playerProgressRef.current.currentNoDamageWave = 0;

    player.health -= 1;
    spawnParticles(player.x + player.width / 2, player.y + player.height / 2, 20, COLORS.warm, 4);

    if (player.health <= 0) {
      player.lives -= 1;
      player.health = player.maxHealth;
      audioRef.current?.playExplosion();

      if (player.lives <= 0) {
        const gd = gameDataRef.current;
        if (gd.score > gd.highScore) {
          gd.highScore = gd.score;
          saveHighScore(gd.highScore);
        }
        savePlayerProgress(playerProgressRef.current);
        onProgressUpdate?.(playerProgressRef.current);
        setGameState('gameover');
        return;
      }

      player.invincibleTimer = INVINCIBILITY_FRAMES;
      player.x = W / 2 - player.width / 2;
      player.y = H - 80;
      player.vx = 0;
      player.vy = 0;
      player.powerUps = { spreadShot: 0, shield: 0, speedBoost: 0 };
    } else {
      audioRef.current?.playHit();
      player.invincibleTimer = HIT_INVINCIBILITY_FRAMES;
    }
  }, [spawnParticles, setGameState, onProgressUpdate]);

  const applyPowerUp = useCallback((player: PlayerShip, type: PowerUpType) => {
    switch (type) {
      case 'spread': player.powerUps.spreadShot = POWER_UP_DURATION; break;
      case 'shield': player.powerUps.shield = POWER_UP_DURATION; break;
      case 'speed': player.powerUps.speedBoost = POWER_UP_DURATION; break;
      case 'life':
        player.lives = Math.min(player.lives + 1, MAX_LIVES);
        player.health = player.maxHealth;
        break;
    }
  }, []);

  const startWave = useCallback((gd: GameData) => {
    startWaveFromConfig(gd, generateWave(gd.wave));
  }, []);

  // ===== UPDATE =====
  const update = useCallback((dt: number) => {
    if (gameState !== 'playing') return;

    const player = playerRef.current;
    const keys = keysRef.current;
    const touch = touchInputRef?.current ?? defaultTouchInput();
    const gd = gameDataRef.current;
    const W = dimensions.width;
    const H = dimensions.height;

    frameRef.current++;
    player.thrusterFrame++;

    // --- Player movement (acceleration-based, PR #9) ---
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
        const dustX = player.x + player.width / 2;
        const dustY = player.y + player.height;
        const dustCount = Math.min(10, Math.floor(impactVy * 5));
        for (let i = 0; i < dustCount; i++) {
          const angle = Math.PI + (Math.random() - 0.5) * Math.PI;
          const spd = Math.random() * impactVy * 0.4;
          const p = particlePoolRef.current.acquire();
          p.x = dustX + (Math.random() - 0.5) * player.width;
          p.y = dustY;
          p.vx = Math.cos(angle) * spd;
          p.vy = Math.sin(angle) * spd;
          p.life = 20 + Math.random() * 12;
          p.maxLife = 32;
          p.color = COLORS.muted;
          p.size = 2 + Math.random() * 1.5;
          particlesRef.current.push(p);
        }
        audioRef.current?.playLanding();
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
        const p = particlePoolRef.current.acquire();
        p.x = thrustX + (Math.random() - 0.5) * 6;
        p.y = thrustY;
        p.vx = Math.cos(angle) * spd;
        p.vy = Math.sin(angle) * spd;
        p.life = 14 + Math.random() * 8;
        p.maxLife = 22;
        p.color = Math.random() > 0.4 ? COLORS.warm : COLORS.accent;
        p.size = 2 + Math.random() * 1.5;
        particlesRef.current.push(p);
      }
    } else {
      const currentSpeed = Math.hypot(player.vx, player.vy);
      if (currentSpeed > DRIFT_PARTICLE_SPEED_THRESHOLD && Math.random() > 0.6) {
        const p = particlePoolRef.current.acquire();
        p.x = player.x + player.width / 2 + (Math.random() - 0.5) * 8;
        p.y = player.y + player.height;
        p.vx = (Math.random() - 0.5);
        p.vy = Math.random();
        p.life = 25;
        p.maxLife = 40;
        p.color = COLORS.muted;
        p.size = 1.5;
        particlesRef.current.push(p);
      }
    }

    // --- Shooting (auto-fire + optional space) ---
    if (shootCooldownRef.current > 0) shootCooldownRef.current--;
    if (AUTO_FIRE_ENABLED || keys['Space'] || touch.fire) {
      playerShoot(player);
    }

    // --- Power-up timers ---
    if (player.powerUps.spreadShot > 0) player.powerUps.spreadShot -= dt;
    if (player.powerUps.shield > 0) player.powerUps.shield -= dt;
    if (player.powerUps.speedBoost > 0) player.powerUps.speedBoost -= dt;
    if (player.invincibleTimer > 0) player.invincibleTimer -= dt;

    // --- Stars ---
    starsRef.current.forEach(star => {
      star.y += star.speed * dt;
      if (star.y > H) {
        star.y = 0;
        star.x = Math.random() * W;
      }
    });

    // --- Bullets ---
    bulletsRef.current.forEach(b => {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
    });
    compactBullets(bulletsRef.current, bulletPoolRef.current, W, H);

    // --- Enemies ---
    enemiesRef.current.forEach(e => {
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
          if (e.patternTimer > 60 && e.patternTimer < 120) {
            e.y += e.speed * 2 * dt; // dive
          }
          break;
        case 'boss':
          // Boss moves to center-top then oscillates
          if (e.y < 60) {
            e.y += e.speed * dt;
          } else {
            e.x = W / 2 - e.width / 2 + Math.sin(e.patternTimer * 0.02) * (W * 0.3);
          }
          break;
      }

      // Clamp enemy X
      e.x = Math.max(0, Math.min(W - e.width, e.x));

      // Enemy shooting
      if (e.shootTimer >= e.shootInterval && e.y > 0) {
        e.shootTimer = 0;
        enemyShoot(e);
      }
    });

    // Remove off-screen enemies
    const offScreenEnemies = enemiesRef.current.filter(e => e.y > H + 100);
    offScreenEnemies.forEach(() => {
      gd.waveEnemiesRemaining = Math.max(0, gd.waveEnemiesRemaining - 1);
    });
    enemiesRef.current = enemiesRef.current.filter(e => e.y <= H + 100);

    // --- Power-ups ---
    powerUpsRef.current.forEach(p => { p.y += p.vy * dt; });
    powerUpsRef.current = powerUpsRef.current.filter(p => p.y < H + 30);

    // --- Collectibles ---
    collectiblesRef.current.forEach(c => {
      c.x += c.vx * dt;
      c.y += c.vy * dt;
    });
    collectiblesRef.current = collectiblesRef.current.filter(c => c.y < H + 30);

    // --- Reward popups ---
    rewardPopupsRef.current.forEach(rp => {
      rp.y += rp.vy * dt;
      rp.life -= dt;
    });
    rewardPopupsRef.current = rewardPopupsRef.current.filter(rp => rp.life > 0);

    // --- Particles ---
    particlesRef.current.forEach(p => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      p.size *= 0.98;
    });
    compactParticles(particlesRef.current, particlePoolRef.current);

    // --- Collision: Player bullets vs enemies ---
    const playerBullets = bulletsRef.current.filter(b => b.isPlayerBullet);
    const enemyBullets = bulletsRef.current.filter(b => !b.isPlayerBullet);

    for (const bullet of playerBullets) {
      for (const enemy of enemiesRef.current) {
        if (rectsOverlap(bullet.x, bullet.y, bullet.width, bullet.height,
          enemy.x, enemy.y, enemy.width, enemy.height)) {
          enemy.health -= bullet.damage;
          bullet.destroyed = true;

          if (enemy.health <= 0) {
            gd.score += enemy.points;
            gd.waveEnemiesRemaining = Math.max(0, gd.waveEnemiesRemaining - 1);
            const pp = playerProgressRef.current;
            pp.enemiesDefeated++;
            if (enemy.isBoss) pp.bossKills++;
            pp.shotsHit++;
            spawnParticles(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2,
              enemy.isBoss ? 40 : 15, enemy.color, enemy.isBoss ? 5 : 3);
            audioRef.current?.playExplosion();
            spawnPowerUp(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
            const col = maybeSpawnCollectible(
              enemy.x + enemy.width / 2,
              enemy.y + enemy.height / 2,
            );
            if (col) collectiblesRef.current.push(col);
            enemy.destroyed = true;
          } else {
            playerProgressRef.current.shotsHit++;
            spawnParticles(bullet.x, bullet.y, 3, COLORS.white, 1);
            audioRef.current?.playHit();
          }
          break;
        }
      }
    }
    enemiesRef.current = enemiesRef.current.filter(e => !e.destroyed);

    // --- Collision: Enemy bullets vs player ---
    if (player.invincibleTimer <= 0) {
      for (const bullet of enemyBullets) {
        if (rectsOverlap(bullet.x, bullet.y, bullet.width, bullet.height,
          player.x, player.y, player.width, player.height)) {
          bullet.destroyed = true;
          if (player.powerUps.shield > 0) {
            player.powerUps.shield = 0;
            playerProgressRef.current.shieldBlocks++;
            spawnParticles(player.x + player.width / 2, player.y + player.height / 2, 10, COLORS.accent, 2);
            audioRef.current?.playHit();
          } else {
            playerHit(player, W, H);
          }
          break;
        }
      }
    }

    // --- Collision: Enemies vs player ---
    if (player.invincibleTimer <= 0) {
      for (const enemy of enemiesRef.current) {
        if (rectsOverlap(player.x, player.y, player.width, player.height,
          enemy.x, enemy.y, enemy.width, enemy.height)) {
          if (player.powerUps.shield > 0) {
            player.powerUps.shield = 0;
            playerProgressRef.current.shieldBlocks++;
            spawnParticles(player.x + player.width / 2, player.y + player.height / 2, 10, COLORS.accent, 2);
          } else {
            playerHit(player, W, H);
          }
          break;
        }
      }
    }

    // --- Collision: Player vs collectibles ---
    const pp = playerProgressRef.current;
    for (let i = collectiblesRef.current.length - 1; i >= 0; i--) {
      const col = collectiblesRef.current[i];
      if (rectsOverlap(player.x, player.y, player.width, player.height,
        col.x, col.y, col.width, col.height)) {
        if (col.type === 'coin') {
          pp.totalCoins += col.value;
          pp.sessionCoins += col.value;
          spawnRewardPopup(col.x, col.y, `+${col.value}`, COLORS.warm);
        } else if (col.type === 'gem') {
          pp.totalGems++;
          pp.sessionGems++;
          spawnRewardPopup(col.x, col.y, '+Gem', COLORS.accent);
        } else {
          pp.totalDiamonds++;
          spawnRewardPopup(col.x, col.y, '+Diamond', COLORS.accentSoft);
        }
        collectiblesRef.current.splice(i, 1);
      }
    }

    // --- Collision: Player vs power-ups ---
    for (let i = powerUpsRef.current.length - 1; i >= 0; i--) {
      const pu = powerUpsRef.current[i];
      if (rectsOverlap(player.x, player.y, player.width, player.height,
        pu.x, pu.y, pu.width, pu.height)) {
        applyPowerUp(player, pu.type);
        audioRef.current?.playPowerUp();
        spawnParticles(pu.x + pu.width / 2, pu.y + pu.height / 2, 8, COLORS.success, 2);
        powerUpsRef.current.splice(i, 1);
      }
    }

    // --- Wave management ---
    if (gd.betweenWaves) {
      gd.betweenWaveTimer -= dt;
      if (gd.betweenWaveTimer <= 0) {
        gd.betweenWaves = false;
        startWave(gd);
      }
    } else {
      // Spawn from queue
      gd.waveTimer += dt;
      const toSpawn = getSpawnEntriesDue(gd.waveSpawnQueue, gd.waveTimer);
      for (const s of toSpawn) {
        enemiesRef.current.push(createEnemy(s.type, W));
      }
      gd.waveSpawnQueue = filterFutureSpawnEntries(gd.waveSpawnQueue, gd.waveTimer);

      if (isWaveComplete(gd, enemiesRef.current.length)) {
        if (!tookDamageThisWaveRef.current) {
          pp.currentNoDamageWave++;
        } else {
          pp.currentNoDamageWave = 0;
        }
        tookDamageThisWaveRef.current = false;
        gd.wave++;
        gd.betweenWaves = true;
        gd.betweenWaveTimer = BETWEEN_WAVE_DELAY;
      }
    }

    if (gd.score > gd.highScore) {
      gd.highScore = gd.score;
    }

    if (frameRef.current % 30 === 0) {
      const unlocked = checkAchievements(pp, gd, frameRef.current);
      for (const achId of unlocked) {
        const reward = grantAchievementReward(achId, pp);
        spawnRewardPopup(
          player.x + player.width / 2,
          player.y,
          `Achievement! +${reward}`,
          COLORS.success,
        );
      }
      if (unlocked.length > 0) {
        savePlayerProgress(pp);
        onProgressUpdate?.(pp);
      }
    }

    if (onHudUpdate) {
      const snap = buildHudSnapshot(gd, player, pp);
      if (!lastHudRef.current || !hudSnapshotEquals(snap, lastHudRef.current)) {
        lastHudRef.current = snap;
        onHudUpdate(snap);
      }
    }

  }, [gameState, dimensions, spawnParticles, spawnPowerUp, spawnRewardPopup, playerShoot, enemyShoot, playerHit, applyPowerUp, startWave, onHudUpdate, onProgressUpdate, touchInputRef]);

  // ===== DRAWING =====
  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    const W = ctx.canvas.width;
    const H = ctx.canvas.height;
    drawBackground(ctx, W, H, starsRef.current);

    if (gameState !== 'playing' && gameState !== 'paused') {
      return;
    }

    const player = playerRef.current;
    const frame = frameRef.current;

    // --- Particles (behind everything) ---
    particlesRef.current.forEach(p => {
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(0.5, p.size), 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // --- Power-ups ---
    powerUpsRef.current.forEach(pu => {
      drawPowerUp(ctx, pu, frame);
    });

    collectiblesRef.current.forEach(c => drawCollectible(ctx, c));
    rewardPopupsRef.current.forEach(rp => drawRewardPopup(ctx, rp));

    // --- Bullets ---
    bulletsRef.current.forEach(b => {
      ctx.fillStyle = b.isPlayerBullet ? COLORS.bulletPlayer : COLORS.bulletEnemy;
      const w = b.isPlayerBullet ? 3 : 4;
      const h = b.isPlayerBullet ? 10 : 8;
      ctx.fillRect(b.x - w / 2, b.y - h / 2, w, h);
    });

    // --- Enemies ---
    enemiesRef.current.forEach(e => {
      drawEnemy(ctx, e);
    });

    // --- Player ---
    if (player.invincibleTimer <= 0 || Math.floor(frame / 4) % 2 === 0) {
      drawPlayer(ctx, player, frame);
    }

    // HUD, pause, and wave banners are rendered by UIOverlay (React) for accessibility

  }, [gameState]);

  // ===== GAME LOOP =====
  const loop = useCallback((timestamp: number) => {
    if (!lastTimeRef.current) lastTimeRef.current = timestamp;
    const rawDt = (timestamp - lastTimeRef.current) / 16.667; // normalize to ~60fps
    const dt = Math.min(rawDt, 3); // cap delta to prevent huge jumps
    lastTimeRef.current = timestamp;

    update(dt);

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        draw(ctx);
      }
    }

    requestRef.current = requestAnimationFrame(loop);
  }, [update, draw]);

  useEffect(() => {
    lastTimeRef.current = 0;
    requestRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(requestRef.current);
  }, [loop]);

  return (
    <canvas
      ref={canvasRef}
      width={dimensions.width}
      height={dimensions.height}
      className="block bg-[var(--game-bg)]"
    />
  );
};

export default GameCanvas;
