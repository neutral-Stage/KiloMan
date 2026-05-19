'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import {
  GameState, PlayerShip, Bullet, Enemy, EnemyType, PowerUp, PowerUpType,
  Particle, Star, GameData,
} from './types';
import AudioEngine from './AudioEngine';
import { generateWave, createEnemy } from './waveGenerator';
import { rectsOverlap } from './collision';
import { createDefaultPlayer, createDefaultGameData } from './defaults';
import { saveHighScore } from './storage';
import {
  drawStartScreen,
  drawGameOverScreen,
  drawPauseOverlay,
  drawWaveBanner,
  drawHUD,
  drawPlayer,
  drawEnemy,
  drawPowerUp,
} from './rendering';
import {
  PLAYER_SHOOT_COOLDOWN,
  AUTO_FIRE_ENABLED,
  INVINCIBILITY_FRAMES,
  HIT_INVINCIBILITY_FRAMES,
  POWER_UP_DURATION,
  POWER_UP_DROP_CHANCE,
  BOSS_WAVE_INTERVAL,
  BETWEEN_WAVE_DELAY,
  STAR_LAYERS,
  STAR_COUNT,
  LOGO_PATH,
  MAX_LIVES,
  COLORS,
} from './constants';

// ===== COMPONENT =====
interface GameCanvasProps {
  gameState: GameState;
  setGameState: (state: GameState) => void;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ gameState, setGameState }) => {
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
  const logoRef = useRef<HTMLImageElement | null>(null);

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

  // Load logo
  useEffect(() => {
    const img = new Image();
    img.src = LOGO_PATH;
    img.onload = () => { logoRef.current = img; };
  }, []);

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

  // Reset game on state change to playing
  useEffect(() => {
    if (gameState === 'playing') {
      const w = dimensions.width;
      const h = dimensions.height;
      playerRef.current = createDefaultPlayer(w / 2, h - 80);
      bulletsRef.current = [];
      enemiesRef.current = [];
      powerUpsRef.current = [];
      particlesRef.current = [];
      gameDataRef.current = createDefaultGameData();
      shootCooldownRef.current = 0;
      frameRef.current = 0;
      initStars(w, h);
    }
  }, [gameState, dimensions, initStars]);

  // ===== SPAWN HELPERS =====
  const spawnParticles = useCallback((x: number, y: number, count: number, color: string, speed = 3) => {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const spd = speed * (0.5 + Math.random());
      particlesRef.current.push({
        x, y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        life: 30 + Math.random() * 20,
        maxLife: 50,
        color,
        size: 2 + Math.random() * 3,
      });
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

  const playerShoot = useCallback((player: PlayerShip, w: number) => {
    if (shootCooldownRef.current > 0) return;
    shootCooldownRef.current = PLAYER_SHOOT_COOLDOWN;
    audioRef.current?.playLaser();

    const cx = player.x + player.width / 2;
    const bulletBase = {
      y: player.y - 10, width: 4, height: 12, damage: 1,
      color: COLORS.cyan, isPlayerBullet: true, vx: 0, vy: -10,
    };

    if (player.powerUps.spreadShot > 0) {
      bulletsRef.current.push({ ...bulletBase, x: cx - 2 });
      bulletsRef.current.push({ ...bulletBase, x: cx - 12, vx: -2 });
      bulletsRef.current.push({ ...bulletBase, x: cx + 8, vx: 2 });
    } else {
      bulletsRef.current.push({ ...bulletBase, x: cx - 2 });
    }

    // Keep bullets in bounds
    bulletsRef.current = bulletsRef.current.filter(b =>
      b.x > -20 && b.x < w + 20
    );
  }, []);

  const enemyShoot = useCallback((enemy: Enemy) => {
    const cx = enemy.x + enemy.width / 2;
    const cy = enemy.y + enemy.height;

    if (enemy.isBoss) {
      // Boss fires spread
      for (let i = -2; i <= 2; i++) {
        bulletsRef.current.push({
          x: cx - 3 + i * 20, y: cy, width: 6, height: 6,
          vx: i * 1.5, vy: 4, damage: 1,
          color: COLORS.red, isPlayerBullet: false,
        });
      }
    } else {
      bulletsRef.current.push({
        x: cx - 3, y: cy, width: 6, height: 6,
        vx: 0, vy: 4 + Math.random() * 2, damage: 1,
        color: COLORS.orange, isPlayerBullet: false,
      });
    }
  }, []);

  const playerHit = useCallback((player: PlayerShip, W: number, H: number) => {
    player.health -= 1;
    spawnParticles(player.x + player.width / 2, player.y + player.height / 2, 20, COLORS.orange, 4);

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
        setGameState('gameover');
        return;
      }

      player.invincibleTimer = INVINCIBILITY_FRAMES;
      player.x = W / 2 - player.width / 2;
      player.y = H - 80;
      player.powerUps = { spreadShot: 0, shield: 0, speedBoost: 0 };
    } else {
      audioRef.current?.playHit();
      player.invincibleTimer = HIT_INVINCIBILITY_FRAMES;
    }
  }, [spawnParticles, setGameState]);

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
    const wave = generateWave(gd.wave);
    const queue: Array<{ type: EnemyType; spawnAt: number }> = [];
    let time = 0;
    let totalEnemies = 0;
    for (const group of wave.enemies) {
      for (let i = 0; i < group.count; i++) {
        queue.push({ type: group.type, spawnAt: time });
        time += group.delay;
        totalEnemies++;
      }
    }
    gd.waveSpawnQueue = queue;
    gd.waveTimer = 0;
    gd.waveEnemiesRemaining = totalEnemies;
  }, []);

  // ===== UPDATE =====
  const update = useCallback((dt: number) => {
    if (gameState !== 'playing') return;

    const player = playerRef.current;
    const keys = keysRef.current;
    const gd = gameDataRef.current;
    const W = dimensions.width;
    const H = dimensions.height;

    frameRef.current++;
    player.thrusterFrame++;

    // --- Player Movement ---
    const moveSpeed = player.speed * (player.powerUps.speedBoost > 0 ? 1.6 : 1) * dt;
    if (keys['ArrowLeft'] || keys['KeyA']) player.x -= moveSpeed;
    if (keys['ArrowRight'] || keys['KeyD']) player.x += moveSpeed;
    if (keys['ArrowUp'] || keys['KeyW']) player.y -= moveSpeed;
    if (keys['ArrowDown'] || keys['KeyS']) player.y += moveSpeed;

    // Clamp to screen
    player.x = Math.max(0, Math.min(W - player.width, player.x));
    player.y = Math.max(H * 0.3, Math.min(H - player.height - 10, player.y));

    // --- Shooting (auto-fire + optional space) ---
    if (shootCooldownRef.current > 0) shootCooldownRef.current--;
    if (AUTO_FIRE_ENABLED || keys['Space']) {
      playerShoot(player, W);
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
    bulletsRef.current = bulletsRef.current.filter(b =>
      !b.destroyed && b.y > -20 && b.y < H + 20 && b.x > -20 && b.x < W + 20
    );

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

    // --- Particles ---
    particlesRef.current.forEach(p => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      p.size *= 0.98;
    });
    particlesRef.current = particlesRef.current.filter(p => p.life > 0);

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
            // Enemy destroyed
            gd.score += enemy.points;
            gd.waveEnemiesRemaining = Math.max(0, gd.waveEnemiesRemaining - 1);
            spawnParticles(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2,
              enemy.isBoss ? 40 : 15, enemy.color, enemy.isBoss ? 5 : 3);
            audioRef.current?.playExplosion();
            spawnPowerUp(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
            enemy.destroyed = true;
          } else {
            // Hit flash
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
            spawnParticles(player.x + player.width / 2, player.y + player.height / 2, 10, COLORS.cyan, 2);
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
            spawnParticles(player.x + player.width / 2, player.y + player.height / 2, 10, COLORS.cyan, 2);
          } else {
            playerHit(player, W, H);
          }
          break;
        }
      }
    }

    // --- Collision: Player vs power-ups ---
    for (let i = powerUpsRef.current.length - 1; i >= 0; i--) {
      const pu = powerUpsRef.current[i];
      if (rectsOverlap(player.x, player.y, player.width, player.height,
        pu.x, pu.y, pu.width, pu.height)) {
        applyPowerUp(player, pu.type);
        audioRef.current?.playPowerUp();
        spawnParticles(pu.x + pu.width / 2, pu.y + pu.height / 2, 8, COLORS.green, 2);
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
      const toSpawn = gd.waveSpawnQueue.filter(s => s.spawnAt <= gd.waveTimer);
      for (const s of toSpawn) {
        enemiesRef.current.push(createEnemy(s.type, W));
      }
      gd.waveSpawnQueue = gd.waveSpawnQueue.filter(s => s.spawnAt > gd.waveTimer);

      // Check wave complete
      if (gd.waveSpawnQueue.length === 0 && gd.waveEnemiesRemaining <= 0 && enemiesRef.current.length === 0) {
        gd.wave++;
        gd.betweenWaves = true;
        gd.betweenWaveTimer = BETWEEN_WAVE_DELAY;
      }
    }

    // --- Update high score ---
    if (gd.score > gd.highScore) {
      gd.highScore = gd.score;
    }

  }, [gameState, dimensions, spawnParticles, spawnPowerUp, playerShoot, enemyShoot, playerHit, applyPowerUp, startWave]);

  // ===== DRAWING =====
  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    const W = ctx.canvas.width;
    const H = ctx.canvas.height;
    const player = playerRef.current;
    const gd = gameDataRef.current;

    // Clear
    ctx.fillStyle = '#050510';
    ctx.fillRect(0, 0, W, H);

    // --- Stars ---
    starsRef.current.forEach(star => {
      ctx.globalAlpha = star.brightness;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(star.x, star.y, star.size, star.size);
    });
    ctx.globalAlpha = 1;

    if (gameState === 'start') {
      drawStartScreen(ctx, W, H, logoRef.current);
      return;
    }

    if (gameState === 'gameover') {
      drawGameOverScreen(ctx, W, H, gd);
      return;
    }

    // playing or paused — render active session
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

    // --- Bullets ---
    bulletsRef.current.forEach(b => {
      ctx.fillStyle = b.color;
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 8;
      ctx.fillRect(b.x, b.y, b.width, b.height);
      ctx.shadowBlur = 0;
    });

    // --- Enemies ---
    enemiesRef.current.forEach(e => {
      drawEnemy(ctx, e);
    });

    // --- Player ---
    if (player.invincibleTimer <= 0 || Math.floor(frame / 4) % 2 === 0) {
      drawPlayer(ctx, player, frame);
    }

    drawHUD(ctx, W, gd, player);

    if (gd.betweenWaves && gd.betweenWaveTimer > 30) {
      drawWaveBanner(
        ctx, W, H, gd.wave, BOSS_WAVE_INTERVAL,
        Math.min(1, (gd.betweenWaveTimer - 30) / 30),
      );
    }

    if (gameState === 'paused') {
      drawPauseOverlay(ctx, W, H);
    }

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
      className="block bg-black"
    />
  );
};

export default GameCanvas;
