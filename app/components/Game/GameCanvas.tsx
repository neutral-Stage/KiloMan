'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import {
  GameState, PlayerShip, Bullet, Enemy, EnemyType, PowerUp, PowerUpType,
  Particle, Star, GameData, WaveConfig,
} from './types';

// ===== CONSTANTS =====
const PLAYER_SHOOT_COOLDOWN = 8;
const INVINCIBILITY_FRAMES = 120;
const POWER_UP_DURATION = 600; // 10 seconds at 60fps
const POWER_UP_DROP_CHANCE = 0.25;
const BOSS_WAVE_INTERVAL = 5;
const BETWEEN_WAVE_DELAY = 120;
const STAR_LAYERS = 3;
const STAR_COUNT = 150;

// ===== COLORS =====
const COLORS = {
  cyan: '#00ffff',
  magenta: '#ff00ff',
  orange: '#ff8800',
  green: '#00ff66',
  yellow: '#ffff00',
  red: '#ff3333',
  white: '#ffffff',
  playerShip: '#00ccff',
  playerAccent: '#0088ff',
  enemyBasic: '#ff4444',
  enemyZigzag: '#ff8800',
  enemySwooper: '#ff00ff',
  enemyTank: '#888888',
  boss: '#ff0044',
};

// ===== AUDIO ENGINE =====
class AudioEngine {
  private ctx: AudioContext | null = null;

  private getCtx(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
    }
    return this.ctx;
  }

  playLaser() {
    try {
      const ctx = this.getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'square';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.1);
    } catch { /* ignore audio errors */ }
  }

  playExplosion() {
    try {
      const ctx = this.getCtx();
      const bufferSize = ctx.sampleRate * 0.3;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
      }
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      const gain = ctx.createGain();
      source.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      source.start(ctx.currentTime);
    } catch { /* ignore audio errors */ }
  }

  playPowerUp() {
    try {
      const ctx = this.getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
      osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } catch { /* ignore audio errors */ }
  }

  playHit() {
    try {
      const ctx = this.getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.15);
    } catch { /* ignore audio errors */ }
  }
}

// ===== WAVE DEFINITIONS =====
function generateWave(waveNum: number): WaveConfig {
  const isBossWave = waveNum % BOSS_WAVE_INTERVAL === 0 && waveNum > 0;
  const difficulty = Math.floor(waveNum / 2);

  if (isBossWave) {
    return {
      enemies: [
        { type: 'basic', count: 2 + difficulty, delay: 20 },
        { type: 'boss', count: 1, delay: 60 },
      ],
      isBossWave: true,
    };
  }

  const configs: WaveConfig[] = [
    // Wave patterns cycle with increasing difficulty
    {
      enemies: [{ type: 'basic', count: 4 + difficulty * 2, delay: 30 }],
      isBossWave: false,
    },
    {
      enemies: [
        { type: 'basic', count: 3 + difficulty, delay: 25 },
        { type: 'zigzag', count: 2 + difficulty, delay: 30 },
      ],
      isBossWave: false,
    },
    {
      enemies: [
        { type: 'zigzag', count: 3 + difficulty, delay: 25 },
        { type: 'swooper', count: 2 + difficulty, delay: 35 },
      ],
      isBossWave: false,
    },
    {
      enemies: [
        { type: 'basic', count: 2 + difficulty, delay: 20 },
        { type: 'tank', count: 1 + Math.floor(difficulty / 2), delay: 50 },
        { type: 'zigzag', count: 2 + difficulty, delay: 25 },
      ],
      isBossWave: false,
    },
  ];

  return configs[waveNum % configs.length];
}

function createEnemy(type: EnemyType, canvasWidth: number): Enemy {
  const base = {
    type: type,
    y: -60,
    health: 1,
    maxHealth: 1,
    shootTimer: 0,
    shootInterval: 120,
    patternTimer: 0,
    patternAmplitude: 0,
    startX: 0,
    isBoss: false,
  };

  const x = 50 + Math.random() * (canvasWidth - 100);

  switch (type) {
    case 'basic':
      return {
        ...base, x, width: 30, height: 30, speed: 2, points: 100,
        pattern: 'straight', color: COLORS.enemyBasic,
        shootInterval: 90 + Math.random() * 60, startX: x,
      };
    case 'zigzag':
      return {
        ...base, x, width: 28, height: 28, speed: 2.5, points: 200,
        pattern: 'zigzag', color: COLORS.enemyZigzag,
        patternAmplitude: 80 + Math.random() * 60, startX: x,
        shootInterval: 100 + Math.random() * 40,
      };
    case 'swooper':
      return {
        ...base, x, width: 32, height: 26, speed: 3, points: 300,
        pattern: 'swoop', color: COLORS.enemySwooper,
        patternAmplitude: 120, startX: x,
        shootInterval: 70 + Math.random() * 50,
      };
    case 'tank':
      return {
        ...base, x, width: 40, height: 40, speed: 1, points: 500,
        health: 5, maxHealth: 5, pattern: 'straight', color: COLORS.enemyTank,
        shootInterval: 50 + Math.random() * 30, startX: x,
      };
    case 'boss':
      return {
        ...base,
        x: canvasWidth / 2 - 60,
        y: -120,
        width: 120, height: 80, speed: 1.5, points: 5000,
        health: 50, maxHealth: 50, pattern: 'boss', color: COLORS.boss,
        shootInterval: 20, startX: canvasWidth / 2 - 60, isBoss: true,
      };
    default:
      return {
        ...base, x, width: 30, height: 30, speed: 2, points: 100,
        pattern: 'straight', color: COLORS.enemyBasic, startX: x,
      };
  }
}

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

  function createDefaultPlayer(cx: number, cy: number): PlayerShip {
    return {
      x: cx - 20, y: cy, width: 40, height: 44,
      speed: 5, health: 3, maxHealth: 3, lives: 3,
      invincibleTimer: 0,
      powerUps: { spreadShot: 0, shield: 0, speedBoost: 0 },
      thrusterFrame: 0,
    };
  }

  function createDefaultGameData(): GameData {
    let highScore = 0;
    if (typeof window !== 'undefined') {
      highScore = parseInt(localStorage.getItem('kiloShooterHighScore') || '0', 10);
    }
    return {
      score: 0, wave: 0, highScore,
      waveEnemiesRemaining: 0,
      waveSpawnQueue: [],
      waveTimer: 0,
      betweenWaves: true,
      betweenWaveTimer: 60,
    };
  }

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
    img.src = '/KiloLogo.png';
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
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code)) {
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
  function spawnParticles(x: number, y: number, count: number, color: string, speed = 3) {
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
  }

  function spawnPowerUp(x: number, y: number) {
    if (Math.random() > POWER_UP_DROP_CHANCE) return;
    const types: PowerUpType[] = ['spread', 'shield', 'speed', 'life'];
    const type = types[Math.floor(Math.random() * types.length)];
    powerUpsRef.current.push({
      x: x - 10, y, width: 20, height: 20, type, vy: 1.5,
    });
  }

  function playerShoot(player: PlayerShip, w: number) {
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
  }

  function enemyShoot(enemy: Enemy) {
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
  }

  // ===== COLLISION =====
  function rectsOverlap(
    ax: number, ay: number, aw: number, ah: number,
    bx: number, by: number, bw: number, bh: number,
  ): boolean {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }

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

    // --- Shooting (auto-fire or space) ---
    if (shootCooldownRef.current > 0) shootCooldownRef.current--;
    if (keys['Space'] || true) { // auto-fire always
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
      b.y > -20 && b.y < H + 20 && b.x > -20 && b.x < W + 20
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
          bullet.vy = 9999; // mark for removal (will go off screen)
          bullet.y = -100;

          if (enemy.health <= 0) {
            // Enemy destroyed
            gd.score += enemy.points;
            gd.waveEnemiesRemaining = Math.max(0, gd.waveEnemiesRemaining - 1);
            spawnParticles(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2,
              enemy.isBoss ? 40 : 15, enemy.color, enemy.isBoss ? 5 : 3);
            audioRef.current?.playExplosion();
            spawnPowerUp(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
            enemy.y = -9999; // mark for removal
          } else {
            // Hit flash
            spawnParticles(bullet.x, bullet.y, 3, COLORS.white, 1);
            audioRef.current?.playHit();
          }
          break;
        }
      }
    }
    enemiesRef.current = enemiesRef.current.filter(e => e.y > -9000);

    // --- Collision: Enemy bullets vs player ---
    if (player.invincibleTimer <= 0) {
      for (const bullet of enemyBullets) {
        if (rectsOverlap(bullet.x, bullet.y, bullet.width, bullet.height,
          player.x, player.y, player.width, player.height)) {
          bullet.y = -100;
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

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState, dimensions]);

  function playerHit(player: PlayerShip, W: number, H: number) {
    player.lives--;
    spawnParticles(player.x + player.width / 2, player.y + player.height / 2, 20, COLORS.orange, 4);
    audioRef.current?.playExplosion();

    if (player.lives <= 0) {
      // Game over
      const gd = gameDataRef.current;
      if (gd.score > gd.highScore) {
        gd.highScore = gd.score;
        if (typeof window !== 'undefined') {
          localStorage.setItem('kiloShooterHighScore', gd.highScore.toString());
        }
      }
      setGameState('gameover');
    } else {
      player.invincibleTimer = INVINCIBILITY_FRAMES;
      player.x = W / 2 - player.width / 2;
      player.y = H - 80;
      player.powerUps = { spreadShot: 0, shield: 0, speedBoost: 0 };
    }
  }

  function applyPowerUp(player: PlayerShip, type: PowerUpType) {
    switch (type) {
      case 'spread': player.powerUps.spreadShot = POWER_UP_DURATION; break;
      case 'shield': player.powerUps.shield = POWER_UP_DURATION; break;
      case 'speed': player.powerUps.speedBoost = POWER_UP_DURATION; break;
      case 'life': player.lives = Math.min(player.lives + 1, 5); break;
    }
  }

  function startWave(gd: GameData) {
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
  }

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
      drawStartScreen(ctx, W, H);
      return;
    }

    if (gameState === 'gameover') {
      drawGameOverScreen(ctx, W, H, gd);
      return;
    }

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
      drawPowerUp(ctx, pu);
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
    if (player.invincibleTimer <= 0 || Math.floor(frameRef.current / 4) % 2 === 0) {
      drawPlayer(ctx, player);
    }

    // --- HUD ---
    drawHUD(ctx, W, gd, player);

    // --- Wave indicator ---
    if (gd.betweenWaves && gd.betweenWaveTimer > 30) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, (gd.betweenWaveTimer - 30) / 30);
      ctx.fillStyle = COLORS.white;
      ctx.font = 'bold 36px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`WAVE ${gd.wave + 1}`, W / 2, H / 2);
      if (gd.wave > 0 && gd.wave % BOSS_WAVE_INTERVAL === 0) {
        ctx.fillStyle = COLORS.red;
        ctx.font = 'bold 24px monospace';
        ctx.fillText('⚠ BOSS INCOMING ⚠', W / 2, H / 2 + 40);
      }
      ctx.restore();
    }

  }, [gameState]);

  function drawStartScreen(ctx: CanvasRenderingContext2D, W: number, H: number) {
    // Logo
    if (logoRef.current) {
      const logo = logoRef.current;
      const scale = Math.min(0.8, W / logo.width * 0.3);
      const lw = logo.width * scale;
      const lh = logo.height * scale;
      ctx.save();
      ctx.globalAlpha = 0.3;
      ctx.drawImage(logo, W / 2 - lw / 2, H / 2 - lh / 2 - 60, lw, lh);
      ctx.restore();
    }

    // Title
    ctx.save();
    ctx.fillStyle = COLORS.cyan;
    ctx.shadowColor = COLORS.cyan;
    ctx.shadowBlur = 20;
    ctx.font = `bold ${Math.min(72, W * 0.08)}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillText('KILO SHOOTER', W / 2, H / 2 - 20);
    ctx.shadowBlur = 0;

    // Subtitle
    ctx.fillStyle = COLORS.white;
    ctx.font = `${Math.min(20, W * 0.025)}px monospace`;
    ctx.globalAlpha = 0.6 + Math.sin(Date.now() * 0.004) * 0.4;
    ctx.fillText('Press ENTER to start', W / 2, H / 2 + 30);
    ctx.globalAlpha = 1;

    // Controls
    ctx.fillStyle = '#888888';
    ctx.font = `${Math.min(16, W * 0.02)}px monospace`;
    ctx.fillText('WASD / Arrow Keys: Move  •  Space: Shoot  •  Auto-fire enabled', W / 2, H / 2 + 80);

    // High score
    const hs = parseInt(localStorage.getItem('kiloShooterHighScore') || '0', 10);
    if (hs > 0) {
      ctx.fillStyle = COLORS.yellow;
      ctx.font = `${Math.min(18, W * 0.022)}px monospace`;
      ctx.fillText(`HIGH SCORE: ${hs.toLocaleString()}`, W / 2, H / 2 + 120);
    }
    ctx.restore();
  }

  function drawGameOverScreen(ctx: CanvasRenderingContext2D, W: number, H: number, gd: GameData) {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = COLORS.red;
    ctx.shadowColor = COLORS.red;
    ctx.shadowBlur = 15;
    ctx.font = `bold ${Math.min(64, W * 0.07)}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', W / 2, H / 2 - 60);
    ctx.shadowBlur = 0;

    ctx.fillStyle = COLORS.white;
    ctx.font = `${Math.min(28, W * 0.035)}px monospace`;
    ctx.fillText(`SCORE: ${gd.score.toLocaleString()}`, W / 2, H / 2);

    ctx.fillStyle = COLORS.yellow;
    ctx.font = `${Math.min(20, W * 0.025)}px monospace`;
    ctx.fillText(`HIGH SCORE: ${gd.highScore.toLocaleString()}`, W / 2, H / 2 + 40);

    ctx.fillStyle = COLORS.white;
    ctx.font = `${Math.min(18, W * 0.022)}px monospace`;
    ctx.fillText(`Wave Reached: ${gd.wave + 1}`, W / 2, H / 2 + 75);

    ctx.globalAlpha = 0.6 + Math.sin(Date.now() * 0.004) * 0.4;
    ctx.fillStyle = COLORS.cyan;
    ctx.font = `${Math.min(20, W * 0.025)}px monospace`;
    ctx.fillText('Press ENTER to restart', W / 2, H / 2 + 120);
    ctx.restore();
  }

  function drawPlayer(ctx: CanvasRenderingContext2D, p: PlayerShip) {
    const cx = p.x + p.width / 2;
    const cy = p.y + p.height / 2;

    ctx.save();

    // Thruster flame
    const flicker = Math.sin(p.thrusterFrame * 0.5) * 4;
    const thrusterGrad = ctx.createLinearGradient(cx, p.y + p.height, cx, p.y + p.height + 20 + flicker);
    thrusterGrad.addColorStop(0, COLORS.cyan);
    thrusterGrad.addColorStop(0.5, COLORS.orange);
    thrusterGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = thrusterGrad;
    ctx.beginPath();
    ctx.moveTo(cx - 8, p.y + p.height);
    ctx.lineTo(cx, p.y + p.height + 18 + flicker);
    ctx.lineTo(cx + 8, p.y + p.height);
    ctx.fill();

    // Ship body - geometric sci-fi
    ctx.fillStyle = COLORS.playerShip;
    ctx.beginPath();
    ctx.moveTo(cx, p.y);                          // nose
    ctx.lineTo(cx + 18, p.y + 30);                // right wing start
    ctx.lineTo(cx + 22, p.y + 40);                // right wing tip
    ctx.lineTo(cx + 8, p.y + 35);                 // right inner
    ctx.lineTo(cx + 6, p.y + p.height);           // right bottom
    ctx.lineTo(cx - 6, p.y + p.height);           // left bottom
    ctx.lineTo(cx - 8, p.y + 35);                 // left inner
    ctx.lineTo(cx - 22, p.y + 40);                // left wing tip
    ctx.lineTo(cx - 18, p.y + 30);                // left wing start
    ctx.closePath();
    ctx.fill();

    // Cockpit
    ctx.fillStyle = COLORS.cyan;
    ctx.shadowColor = COLORS.cyan;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.ellipse(cx, p.y + 16, 4, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Wing accents
    ctx.strokeStyle = COLORS.playerAccent;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - 14, p.y + 28);
    ctx.lineTo(cx - 20, p.y + 38);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + 14, p.y + 28);
    ctx.lineTo(cx + 20, p.y + 38);
    ctx.stroke();

    // Shield visual
    if (p.powerUps.shield > 0) {
      ctx.strokeStyle = COLORS.cyan;
      ctx.globalAlpha = 0.4 + Math.sin(frameRef.current * 0.1) * 0.2;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(cx, cy, p.width * 0.8, p.height * 0.7, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    ctx.restore();
  }

  function drawEnemy(ctx: CanvasRenderingContext2D, e: Enemy) {
    const cx = e.x + e.width / 2;
    const cy = e.y + e.height / 2;

    ctx.save();

    if (e.isBoss) {
      // Boss - large menacing ship
      ctx.fillStyle = e.color;
      ctx.beginPath();
      ctx.moveTo(cx, e.y + e.height);                    // bottom center
      ctx.lineTo(cx - 60, e.y + e.height - 10);          // left bottom
      ctx.lineTo(cx - 55, e.y + 20);                     // left mid
      ctx.lineTo(cx - 30, e.y);                           // left top
      ctx.lineTo(cx, e.y + 10);                           // top center dip
      ctx.lineTo(cx + 30, e.y);                           // right top
      ctx.lineTo(cx + 55, e.y + 20);                      // right mid
      ctx.lineTo(cx + 60, e.y + e.height - 10);           // right bottom
      ctx.closePath();
      ctx.fill();

      // Boss eye
      ctx.fillStyle = COLORS.yellow;
      ctx.shadowColor = COLORS.yellow;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 12, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Health bar
      const barW = e.width;
      const barH = 6;
      const barX = e.x;
      const barY = e.y - 12;
      ctx.fillStyle = '#333';
      ctx.fillRect(barX, barY, barW, barH);
      ctx.fillStyle = COLORS.red;
      ctx.fillRect(barX, barY, barW * (e.health / e.maxHealth), barH);
      ctx.strokeStyle = '#666';
      ctx.strokeRect(barX, barY, barW, barH);
    } else {
      // Regular enemies - geometric shapes
      ctx.fillStyle = e.color;

      switch (e.type) {
        case 'basic':
          // Diamond shape
          ctx.beginPath();
          ctx.moveTo(cx, e.y);
          ctx.lineTo(e.x + e.width, cy);
          ctx.lineTo(cx, e.y + e.height);
          ctx.lineTo(e.x, cy);
          ctx.closePath();
          ctx.fill();
          // Core
          ctx.fillStyle = '#fff';
          ctx.beginPath();
          ctx.arc(cx, cy, 4, 0, Math.PI * 2);
          ctx.fill();
          break;

        case 'zigzag':
          // Hexagonal
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
            const r = e.width / 2;
            const px = cx + Math.cos(angle) * r;
            const py = cy + Math.sin(angle) * r;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = '#000';
          ctx.beginPath();
          ctx.arc(cx, cy, 5, 0, Math.PI * 2);
          ctx.fill();
          break;

        case 'swooper':
          // Arrow/chevron shape
          ctx.beginPath();
          ctx.moveTo(cx, e.y);
          ctx.lineTo(e.x + e.width, e.y + e.height * 0.6);
          ctx.lineTo(cx + 5, e.y + e.height * 0.4);
          ctx.lineTo(cx + 5, e.y + e.height);
          ctx.lineTo(cx - 5, e.y + e.height);
          ctx.lineTo(cx - 5, e.y + e.height * 0.4);
          ctx.lineTo(e.x, e.y + e.height * 0.6);
          ctx.closePath();
          ctx.fill();
          break;

        case 'tank':
          // Chunky rectangle with details
          ctx.fillRect(e.x + 4, e.y + 4, e.width - 8, e.height - 8);
          ctx.strokeStyle = '#aaa';
          ctx.lineWidth = 2;
          ctx.strokeRect(e.x, e.y, e.width, e.height);
          // Cannon
          ctx.fillStyle = '#666';
          ctx.fillRect(cx - 3, e.y + e.height - 4, 6, 10);
          // Health bar for tanks
          const tw = e.width;
          const th = 4;
          ctx.fillStyle = '#333';
          ctx.fillRect(e.x, e.y - 8, tw, th);
          ctx.fillStyle = COLORS.green;
          ctx.fillRect(e.x, e.y - 8, tw * (e.health / e.maxHealth), th);
          break;
      }
    }

    ctx.restore();
  }

  function drawPowerUp(ctx: CanvasRenderingContext2D, pu: PowerUp) {
    const cx = pu.x + pu.width / 2;
    const cy = pu.y + pu.height / 2;
    const pulse = Math.sin(frameRef.current * 0.1) * 2;

    ctx.save();

    let color: string;
    let label: string;
    switch (pu.type) {
      case 'spread': color = COLORS.magenta; label = 'S'; break;
      case 'shield': color = COLORS.cyan; label = '◊'; break;
      case 'speed': color = COLORS.green; label = '»'; break;
      case 'life': color = COLORS.red; label = '+'; break;
    }

    ctx.strokeStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 8 + pulse;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, 10 + pulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.fillStyle = color;
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, cx, cy);

    ctx.restore();
  }

  function drawHUD(ctx: CanvasRenderingContext2D, W: number, gd: GameData, player: PlayerShip) {
    ctx.save();
    const pad = 15;
    const fontSize = Math.min(18, W * 0.022);

    // Score
    ctx.fillStyle = COLORS.white;
    ctx.font = `bold ${fontSize}px monospace`;
    ctx.textAlign = 'left';
    ctx.fillText(`SCORE: ${gd.score.toLocaleString()}`, pad, pad + fontSize);

    // High score
    ctx.fillStyle = COLORS.yellow;
    ctx.font = `${fontSize * 0.8}px monospace`;
    ctx.fillText(`HI: ${gd.highScore.toLocaleString()}`, pad, pad + fontSize * 2.2);

    // Wave
    ctx.fillStyle = COLORS.cyan;
    ctx.font = `bold ${fontSize}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillText(`WAVE ${gd.wave + 1}`, W / 2, pad + fontSize);

    // Lives
    ctx.textAlign = 'right';
    ctx.fillStyle = COLORS.white;
    ctx.font = `bold ${fontSize}px monospace`;
    const livesText = '♥'.repeat(player.lives);
    ctx.fillText(livesText, W - pad, pad + fontSize);

    // Health bar
    const barW = 100;
    const barH = 8;
    const barX = W - pad - barW;
    const barY = pad + fontSize + 10;
    ctx.fillStyle = '#333';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = player.health > 1 ? COLORS.green : COLORS.red;
    ctx.fillRect(barX, barY, barW * (player.health / player.maxHealth), barH);

    // Active power-ups indicators
    let puY = barY + barH + 10;
    const puFontSize = fontSize * 0.7;
    ctx.font = `${puFontSize}px monospace`;
    ctx.textAlign = 'right';
    if (player.powerUps.spreadShot > 0) {
      ctx.fillStyle = COLORS.magenta;
      ctx.fillText('SPREAD', W - pad, puY + puFontSize);
      puY += puFontSize + 4;
    }
    if (player.powerUps.shield > 0) {
      ctx.fillStyle = COLORS.cyan;
      ctx.fillText('SHIELD', W - pad, puY + puFontSize);
      puY += puFontSize + 4;
    }
    if (player.powerUps.speedBoost > 0) {
      ctx.fillStyle = COLORS.green;
      ctx.fillText('SPEED+', W - pad, puY + puFontSize);
    }

    ctx.restore();
  }

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
