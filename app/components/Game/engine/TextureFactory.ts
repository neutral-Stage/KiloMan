import { Application, Graphics, RenderTexture, Texture } from 'pixi.js';
import type { EnemyType, PowerUpType, ShipSkin } from '../types';
import { COLORS } from '../constants';

export interface GameTextures {
  nebula: Texture;
  player: Record<ShipSkin, Texture[]>;
  enemies: Record<EnemyType, Texture>;
  powerUps: Record<PowerUpType, Texture>;
  bulletPlayer: Texture;
  bulletEnemy: Texture;
  coin: Texture;
  gem: Texture;
  diamond: Texture;
}

function bakeGraphics(app: Application, draw: (g: Graphics) => void, w: number, h: number): Texture {
  const g = new Graphics();
  draw(g);
  const rt = RenderTexture.create({ width: w, height: h });
  app.renderer.render({ container: g, target: rt });
  g.destroy();
  return rt;
}

function drawPlayerShip(g: Graphics, palette: { hull: number; highlight: number; cockpit: number }) {
  const cx = 20;
  g.moveTo(cx, 2);
  g.lineTo(cx + 16, 26);
  g.lineTo(cx + 20, 36);
  g.lineTo(cx + 8, 32);
  g.lineTo(cx + 6, 42);
  g.lineTo(cx - 6, 42);
  g.lineTo(cx - 8, 32);
  g.lineTo(cx - 20, 36);
  g.lineTo(cx - 16, 26);
  g.closePath();
  g.fill({ color: palette.hull });
  g.circle(cx, 14, 4);
  g.fill({ color: palette.cockpit });
  g.moveTo(cx - 12, 24);
  g.lineTo(cx - 18, 34);
  g.stroke({ color: palette.highlight, width: 2 });
  g.moveTo(cx + 12, 24);
  g.lineTo(cx + 18, 34);
  g.stroke({ color: palette.highlight, width: 2 });
}

const SKIN_PALETTES: Record<ShipSkin, { hull: number; highlight: number; cockpit: number }> = {
  default: { hull: 0x7a9cc4, highlight: 0xb8d4f0, cockpit: 0x6eb5ff },
  gold: { hull: 0xc9a227, highlight: 0xf0d878, cockpit: 0xffe08a },
  neon: { hull: 0x3d5a80, highlight: 0x6eb5ff, cockpit: 0xa8d4ff },
  stealth: { hull: 0x2a3344, highlight: 0x4a5568, cockpit: 0x6b7d8f },
  vintage: { hull: 0x8b6f47, highlight: 0xc4a574, cockpit: 0xe8d4b0 },
};

export function createGameTextures(app: Application): GameTextures {
  const nebula = bakeGraphics(app, (g) => {
    g.rect(0, 0, 256, 256);
    g.fill({ color: 0x0a0f18 });
    for (let i = 0; i < 40; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      const r = 20 + Math.random() * 60;
      g.circle(x, y, r);
      g.fill({ color: i % 3 === 0 ? 0x1a2840 : 0x121a28, alpha: 0.35 });
    }
  }, 256, 256);

  const player: Record<ShipSkin, Texture[]> = {} as Record<ShipSkin, Texture[]>;
  for (const skin of Object.keys(SKIN_PALETTES) as ShipSkin[]) {
    player[skin] = [
      bakeGraphics(app, (g) => drawPlayerShip(g, SKIN_PALETTES[skin]), 40, 48),
      bakeGraphics(app, (g) => {
        drawPlayerShip(g, SKIN_PALETTES[skin]);
        g.moveTo(16, 44);
        g.lineTo(20, 52);
        g.lineTo(24, 44);
        g.fill({ color: 0xe8a86a, alpha: 0.9 });
      }, 40, 56),
    ];
  }

  const enemies: Record<EnemyType, Texture> = {
    basic: bakeGraphics(app, (g) => {
      g.moveTo(15, 2);
      g.lineTo(28, 15);
      g.lineTo(15, 28);
      g.lineTo(2, 15);
      g.closePath();
      g.fill({ color: COLORS.enemyBasic });
      g.circle(15, 15, 3);
      g.fill({ color: 0xffffff });
    }, 30, 30),
    zigzag: bakeGraphics(app, (g) => {
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI * 2 * i) / 6 - Math.PI / 2;
        const px = 14 + Math.cos(a) * 12;
        const py = 14 + Math.sin(a) * 12;
        if (i === 0) g.moveTo(px, py);
        else g.lineTo(px, py);
      }
      g.closePath();
      g.fill({ color: COLORS.enemyZigzag });
    }, 28, 28),
    swooper: bakeGraphics(app, (g) => {
      g.moveTo(16, 2);
      g.lineTo(30, 16);
      g.lineTo(18, 12);
      g.lineTo(18, 24);
      g.lineTo(14, 24);
      g.lineTo(14, 12);
      g.lineTo(2, 16);
      g.closePath();
      g.fill({ color: COLORS.enemySwooper });
    }, 32, 26),
    tank: bakeGraphics(app, (g) => {
      g.roundRect(4, 4, 32, 32, 4);
      g.fill({ color: COLORS.enemyTank });
      g.stroke({ color: 0xffffff, width: 1, alpha: 0.25 });
    }, 40, 40),
    boss: bakeGraphics(app, (g) => {
      g.moveTo(60, 78);
      g.lineTo(0, 68);
      g.lineTo(8, 18);
      g.lineTo(30, 4);
      g.lineTo(60, 12);
      g.lineTo(90, 4);
      g.lineTo(112, 18);
      g.lineTo(120, 68);
      g.closePath();
      g.fill({ color: COLORS.bossHull });
      g.ellipse(60, 40, 10, 6);
      g.fill({ color: COLORS.bossCore });
    }, 120, 80),
  };

  const powerUps: Record<PowerUpType, Texture> = {
    spread: bakeGraphics(app, (g) => {
      g.circle(12, 12, 11);
      g.stroke({ color: COLORS.powerSpread, width: 2 });
      g.moveTo(6, 12);
      g.lineTo(18, 12);
      g.stroke({ color: COLORS.powerSpread, width: 2 });
    }, 24, 24),
    shield: bakeGraphics(app, (g) => {
      g.circle(12, 12, 11);
      g.stroke({ color: COLORS.powerShield, width: 2 });
      g.moveTo(12, 6);
      g.lineTo(12, 18);
      g.moveTo(6, 12);
      g.lineTo(18, 12);
      g.stroke({ color: COLORS.powerShield, width: 2 });
    }, 24, 24),
    speed: bakeGraphics(app, (g) => {
      g.circle(12, 12, 11);
      g.stroke({ color: COLORS.powerSpeed, width: 2 });
      g.moveTo(8, 12);
      g.lineTo(16, 8);
      g.lineTo(16, 16);
      g.closePath();
      g.fill({ color: COLORS.powerSpeed });
    }, 24, 24),
    life: bakeGraphics(app, (g) => {
      g.circle(12, 12, 11);
      g.stroke({ color: COLORS.powerLife, width: 2 });
      g.moveTo(12, 7);
      g.lineTo(12, 17);
      g.moveTo(7, 12);
      g.lineTo(17, 12);
      g.stroke({ color: COLORS.powerLife, width: 3 });
    }, 24, 24),
  };

  const bulletPlayer = bakeGraphics(app, (g) => {
    g.roundRect(1, 0, 4, 14, 2);
    g.fill({ color: COLORS.bulletPlayer });
  }, 6, 14);

  const bulletEnemy = bakeGraphics(app, (g) => {
    g.circle(4, 4, 4);
    g.fill({ color: COLORS.bulletEnemy });
  }, 8, 8);

  const coin = bakeGraphics(app, (g) => {
    g.circle(8, 8, 7);
    g.fill({ color: COLORS.warm });
    g.stroke({ color: COLORS.warmDeep, width: 2 });
  }, 16, 16);

  const gem = bakeGraphics(app, (g) => {
    g.moveTo(8, 2);
    g.lineTo(14, 8);
    g.lineTo(8, 14);
    g.lineTo(2, 8);
    g.closePath();
    g.fill({ color: COLORS.accent });
  }, 16, 16);

  const diamond = bakeGraphics(app, (g) => {
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI * 2 * i) / 6 - Math.PI / 2;
      const px = 8 + Math.cos(a) * 7;
      const py = 8 + Math.sin(a) * 7;
      if (i === 0) g.moveTo(px, py);
      else g.lineTo(px, py);
    }
    g.closePath();
    g.fill({ color: COLORS.accentSoft });
    g.stroke({ color: 0xffffff, width: 1 });
  }, 16, 16);

  return {
    nebula,
    player,
    enemies,
    powerUps,
    bulletPlayer,
    bulletEnemy,
    coin,
    gem,
    diamond,
  };
}
