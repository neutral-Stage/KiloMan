import React, { useRef, useEffect } from 'react';
import { GameStatus, PlayerState, GameConfig, LevelEntity, MonsterState } from './types';
import { LEVEL_1 } from './levelData';

const PLAYER_AVATAR_URL = 'https://avatars.githubusercontent.com/u/37474613?v=4';
const PLAYER_AVATAR_FALLBACK = '/KiloLogo.png';

interface GameCanvasProps {
  gameState: GameStatus;
  setGameState: (status: GameStatus) => void;
  jumpModifier: number;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ gameState, setGameState, jumpModifier }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  const playerAvatarRef = useRef<HTMLImageElement | null>(null);
  const [dimensions, setDimensions] = React.useState({ width: 800, height: 600 });

  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    // Initial resize
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load player avatar image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      playerAvatarRef.current = img;
    };
    img.onerror = () => {
      // Fallback to local asset on load failure
      const fallback = new Image();
      fallback.onload = () => {
        playerAvatarRef.current = fallback;
      };
      fallback.onerror = () => {
        // If fallback also fails, avatar remains null and original humanoid renders
        playerAvatarRef.current = null;
      };
      fallback.src = PLAYER_AVATAR_FALLBACK;
    };
    img.src = PLAYER_AVATAR_URL;
  }, []);
  
  // Game Constants
  const CONFIG: GameConfig = {
    gravity: 0.6,
    friction: 0.85,
    moveSpeed: 0.8,
    maxSpeed: 8.0,
    baseJumpForce: -14,
    levelWidth: 7000, // Updated to match new level length
  };

  // Mutable Game State
  const playerRef = useRef<PlayerState>({
    x: 50,
    y: 350,
    vx: 0,
    vy: 0,
    width: 30,
    height: 50, // Taller for humanoid
    isGrounded: false,
    facing: 1,
    frame: 0,
  });

  const cameraRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const monstersRef = useRef<MonsterState[]>([]);
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const logoRef = useRef<HTMLImageElement | null>(null);

  // Load Logo
  useEffect(() => {
    const img = new Image();
    img.src = '/KiloLogo.png';
    img.onload = () => {
      logoRef.current = img;
    };
  }, []);

  // Initialize Input Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.code] = true;
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
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
  }, []);

  // Reset Game State
  useEffect(() => {
    if (gameState === 'playing') {
      const startPos = LEVEL_1.find(e => e.type === 'start');
      playerRef.current = {
        x: startPos ? startPos.x : 50,
        y: startPos ? startPos.y : 350,
        vx: 0,
        vy: 0,
        width: 30,
        height: 50,
        isGrounded: false,
        facing: 1,
        frame: 0,
      };
      cameraRef.current = { x: 0, y: 0 };
      
      // Initialize Monsters
      monstersRef.current = LEVEL_1
        .filter(e => e.type === 'monster')
        .map(m => ({
          id: m.id,
          x: m.x,
          y: m.y,
          w: m.w,
          h: m.h,
          vx: m.speed || 2,
          patrolStart: m.patrolStart || m.x - 100,
          patrolEnd: m.patrolEnd || m.x + 100,
          speed: m.speed || 2,
        }));
    }
  }, [gameState]);

  // --- RENDERING HELPERS ---

  const drawBackground = (ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number) => {
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;

    // Sky Gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, '#0f172a'); // Dark Blue/Black
    gradient.addColorStop(1, '#3b0764'); // Deep Purple
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    // Kilo Logo Background
    if (logoRef.current) {
      const logo = logoRef.current;
      const scale = 1.5; // Large
      const scaledW = logo.width * scale;
      const scaledH = logo.height * scale;
      
      // Center on screen with parallax offset
      // We want it to stay relatively centered but move slightly to show depth
      const parallaxX = cameraX * 0.05;
      const parallaxY = cameraY * 0.05;
      
      const x = (w / 2) - (scaledW / 2) - parallaxX;
      const y = (h / 2) - (scaledH / 2) - parallaxY;
      
      ctx.save();
      ctx.globalAlpha = 0.2; // Subtle background
      ctx.drawImage(logo, x, y, scaledW, scaledH);
      ctx.restore();
    }

    // Parallax Stars/Particles
    ctx.fillStyle = '#FFF';
    for (let i = 0; i < 50; i++) {
      const x = ((i * 137) - cameraX * 0.1) % w; // Fixed parallax direction
      const finalX = x < 0 ? x + w : x;
      const y = (i * 31) % (h / 2);
      ctx.globalAlpha = Math.random() * 0.5 + 0.2;
      ctx.fillRect(finalX, y, 2, 2);
    }
    ctx.globalAlpha = 1.0;

    // Parallax Mountains (Far)
    ctx.fillStyle = '#1e1b4b'; // Dark Indigo
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let i = 0; i <= w; i += 100) {
      const offset = (i + cameraX * 0.2);
      const height = 100 + Math.sin(offset * 0.01) * 50;
      ctx.lineTo(i, h - height);
    }
    ctx.lineTo(w, h);
    ctx.fill();

    // Parallax Hills (Near)
    ctx.fillStyle = '#312e81'; // Indigo
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let i = 0; i <= w; i += 50) {
      const offset = (i + cameraX * 0.5);
      const height = 50 + Math.sin(offset * 0.02) * 30;
      ctx.lineTo(i, h - height);
    }
    ctx.lineTo(w, h);
    ctx.fill();
  };

  const drawPlatform = (ctx: CanvasRenderingContext2D, entity: LevelEntity, cameraX: number, cameraY: number) => {
    const x = entity.x - cameraX;
    const y = entity.y - cameraY;
    
    // 3D Effect: Top Face
    ctx.fillStyle = '#fbbf24'; // Amber 400 (Light Top)
    ctx.fillRect(x, y, entity.w, 5);

    // Front Face
    const gradient = ctx.createLinearGradient(x, y, x, y + entity.h);
    gradient.addColorStop(0, '#d97706'); // Amber 600
    gradient.addColorStop(1, '#92400e'); // Amber 800
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y + 5, entity.w, entity.h - 5);

    // Border/Detail
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, entity.w, entity.h);
  };

  const drawHumanoid = (ctx: CanvasRenderingContext2D, p: PlayerState, cameraX: number, cameraY: number) => {
    const x = p.x - cameraX;
    const y = p.y - cameraY;
    const cx = x + p.width / 2;

    ctx.save();
    
    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(cx, y + p.height, p.width / 1.5, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Check if avatar image is loaded
    if (playerAvatarRef.current) {
      // Draw the avatar image
      ctx.save();
      // Flip the image if facing left
      if (p.facing === -1) {
        ctx.translate(cx, 0);
        ctx.scale(-1, 1);
        ctx.translate(-cx, 0);
      }
      ctx.drawImage(
        playerAvatarRef.current,
        x - 5,
        y - 10,
        p.width + 10,
        p.height + 10
      );
      ctx.restore();
    } else {
      // Fallback: Draw the original humanoid
      
      // Body Color
      ctx.fillStyle = '#eab308'; // Yellow 500

      // Animation Offset
      const bob = Math.sin(frameCountRef.current * 0.2) * (Math.abs(p.vx) > 0.1 ? 3 : 1);

      // Legs
      const legOffset = Math.sin(frameCountRef.current * 0.4) * 10 * (Math.abs(p.vx) > 0.1 ? 1 : 0);
      ctx.fillRect(cx - 8 + legOffset, y + 30, 6, 20); // Left Leg
      ctx.fillRect(cx + 2 - legOffset, y + 30, 6, 20); // Right Leg

      // Torso
      ctx.fillRect(cx - 10, y + 15 + bob, 20, 20);

      // Head
      ctx.fillStyle = '#fef08a'; // Yellow 200
      ctx.beginPath();
      ctx.arc(cx, y + 10 + bob, 12, 0, Math.PI * 2);
      ctx.fill();

      // Eyes (Directional)
      ctx.fillStyle = '#000';
      const eyeDir = p.facing === 1 ? 4 : -4;
      ctx.fillRect(cx + eyeDir - 2, y + 8 + bob, 4, 4);
    }

    ctx.restore();
  };

  const drawMonster = (ctx: CanvasRenderingContext2D, m: MonsterState, cameraX: number, cameraY: number) => {
    const x = m.x - cameraX;
    const y = m.y - cameraY;
    const cx = x + m.w / 2;
    const cy = y + m.h / 2;

    // Spiky Body
    ctx.fillStyle = '#ef4444'; // Red 500
    ctx.beginPath();
    ctx.moveTo(cx, y); // Top
    ctx.lineTo(x + m.w, cy); // Right
    ctx.lineTo(cx, y + m.h); // Bottom
    ctx.lineTo(x, cy); // Left
    ctx.fill();

    // Inner Core
    ctx.fillStyle = '#7f1d1d'; // Red 900
    ctx.beginPath();
    ctx.arc(cx, cy, 10, 0, Math.PI * 2);
    ctx.fill();

    // Angry Eyes
    ctx.fillStyle = '#fff';
    ctx.fillRect(cx - 8, cy - 5, 5, 5);
    ctx.fillRect(cx + 3, cy - 5, 5, 5);
  };

  // --- GAME LOOP ---

  const update = () => {
    if (gameState !== 'playing') return;

    const player = playerRef.current;
    const keys = keysRef.current;
    const monsters = monstersRef.current;

    frameCountRef.current++;

    // --- PLAYER PHYSICS ---
    
    // Horizontal Movement
    if (keys['ArrowLeft']) {
      player.vx -= CONFIG.moveSpeed;
      player.facing = -1;
    }
    if (keys['ArrowRight']) {
      player.vx += CONFIG.moveSpeed;
      player.facing = 1;
    }

    // Friction & Limits
    player.vx *= CONFIG.friction;
    if (player.vx > CONFIG.maxSpeed) player.vx = CONFIG.maxSpeed;
    if (player.vx < -CONFIG.maxSpeed) player.vx = -CONFIG.maxSpeed;

    // Gravity
    player.vy += CONFIG.gravity;

    // Jumping
    if (keys['Space'] && player.isGrounded) {
      player.vy = CONFIG.baseJumpForce * jumpModifier;
      player.isGrounded = false;
    }

    // Apply Velocity
    player.x += player.vx;
    player.y += player.vy;

    // --- MONSTER LOGIC ---
    monsters.forEach(m => {
      m.x += m.vx;
      // Patrol Logic
      if (m.x <= m.patrolStart) {
        m.x = m.patrolStart;
        m.vx = Math.abs(m.speed);
      } else if (m.x >= m.patrolEnd) {
        m.x = m.patrolEnd;
        m.vx = -Math.abs(m.speed);
      }
    });

    // --- COLLISION DETECTION ---
    
    player.isGrounded = false;
    
    // World Boundaries
    if (player.x < 0) { player.x = 0; player.vx = 0; }
    if (player.x > CONFIG.levelWidth) { player.x = CONFIG.levelWidth; player.vx = 0; }
    if (player.y > 800) {
      setGameState('lost');
      return;
    }

    // Entity Collision
    for (const entity of LEVEL_1) {
      // Skip monster entities in static check (handled separately)
      if (entity.type === 'monster') continue;

      if (
        player.x < entity.x + entity.w &&
        player.x + player.width > entity.x &&
        player.y < entity.y + entity.h &&
        player.y + player.height > entity.y
      ) {
        if (entity.type === 'hazard') {
          setGameState('lost');
          return;
        }
        
        if (entity.type === 'goal') {
          setGameState('won');
          return;
        }

        if (entity.type === 'platform') {
          const overlapX = (player.width + entity.w) / 2 - Math.abs((player.x + player.width / 2) - (entity.x + entity.w / 2));
          const overlapY = (player.height + entity.h) / 2 - Math.abs((player.y + player.height / 2) - (entity.y + entity.h / 2));

          if (overlapX < overlapY) {
            if (player.vx > 0) player.x = entity.x - player.width;
            else player.x = entity.x + entity.w;
            player.vx = 0;
          } else {
            if (player.vy > 0) {
              player.y = entity.y - player.height;
              player.isGrounded = true;
              player.vy = 0;
            } else {
              player.y = entity.y + entity.h;
              player.vy = 0;
            }
          }
        }
      }
    }

    // Monster Collision (Player vs Monster)
    for (const m of monsters) {
      if (
        player.x < m.x + m.w &&
        player.x + player.width > m.x &&
        player.y < m.y + m.h &&
        player.y + player.height > m.y
      ) {
        setGameState('lost');
        return;
      }
    }

    // --- CAMERA UPDATE ---
    const canvas = canvasRef.current;
    if (canvas) {
      // Center camera on player
      let targetX = player.x - canvas.width / 2 + player.width / 2;
      
      // Clamp Camera X
      if (targetX < 0) targetX = 0;
      if (targetX > CONFIG.levelWidth - canvas.width) targetX = CONFIG.levelWidth - canvas.width;
      
      // Camera Y Logic (Keep floor near bottom)
      // We want the player to be roughly at 75% of the screen height when on the ground.
      // BUT we don't want it to track every jump.
      
      // Only move camera Y if player is significantly higher than the "ground" level we want to track
      // or if they are falling deep into a pit.
      
      // Define a "deadzone" for Y movement.
      // If player is on ground (y ~ 550), camera should be fixed.
      // If player climbs high (y < 300), camera should move up.
      
      const groundLevel = 600;
      const idealCameraY = groundLevel - canvas.height + 50; // Fixed position for ground level
      
      let targetY = idealCameraY;
      
      // If player goes high up, follow them
      if (player.y < groundLevel - canvas.height * 0.6) {
          targetY = player.y - canvas.height * 0.4;
      }
      
      // If player falls deep (pits), follow them
      if (player.y > groundLevel + 100) {
          targetY = player.y - canvas.height * 0.8;
      }

      // Clamp Camera Y (Don't show below ground)
      const lowestPoint = 800;
      const maxCameraY = lowestPoint - canvas.height;
      if (targetY > maxCameraY) targetY = maxCameraY;
      
      // Smooth Camera (Lerp)
      cameraRef.current.x += (targetX - cameraRef.current.x) * 0.1;
      // Slower Y tracking to avoid jitter
      cameraRef.current.y += (targetY - cameraRef.current.y) * 0.05;
    }
  };

  const draw = (ctx: CanvasRenderingContext2D) => {
    const cameraX = cameraRef.current.x;
    const cameraY = cameraRef.current.y;

    // Draw Background (Parallax)
    drawBackground(ctx, cameraX, cameraY);

    // Draw Level Entities
    LEVEL_1.forEach(entity => {
      if (entity.type === 'start' || entity.type === 'monster') return;
      
      if (entity.type === 'platform') {
        drawPlatform(ctx, entity, cameraX, cameraY);
      } else if (entity.type === 'hazard') {
        ctx.fillStyle = '#ef4444'; // Red
        const x = entity.x - cameraX;
        const y = entity.y - cameraY;
        // Draw spikes
        const spikeWidth = 20;
        const spikes = entity.w / spikeWidth;
        ctx.beginPath();
        for(let i=0; i<spikes; i++) {
            ctx.moveTo(x + (i * spikeWidth), y + entity.h);
            ctx.lineTo(x + (i * spikeWidth) + (spikeWidth/2), y);
            ctx.lineTo(x + ((i+1) * spikeWidth), y + entity.h);
        }
        ctx.fill();
      } else if (entity.type === 'goal') {
        ctx.fillStyle = '#22c55e'; // Green
        const x = entity.x - cameraX;
        const y = entity.y - cameraY;
        ctx.fillRect(x, y, entity.w, entity.h);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, entity.w, entity.h);
      }
    });

    // Draw Monsters
    monstersRef.current.forEach(m => {
      drawMonster(ctx, m, cameraX, cameraY);
    });

    // Draw Player
    drawHumanoid(ctx, playerRef.current, cameraX, cameraY);
  };

  const loop = () => {
    update();
    
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        draw(ctx);
      }
    }
    
    requestRef.current = requestAnimationFrame(loop);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(requestRef.current);
  });

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