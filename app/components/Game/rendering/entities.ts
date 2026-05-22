import { Enemy, PlayerShip, PowerUp, ShipSkin } from '../types';
import { COLORS } from '../constants';

function skinPalette(skin: ShipSkin) {
  switch (skin) {
    case 'gold':
      return { hull: '#c9a227', highlight: '#f0d878', cockpit: '#ffe08a', thruster: '#e8c06a' };
    case 'neon':
      return { hull: '#3d5a80', highlight: '#6eb5ff', cockpit: '#a8d4ff', thruster: '#6eb5ff' };
    case 'stealth':
      return { hull: '#2a3344', highlight: '#4a5568', cockpit: '#6b7d8f', thruster: '#4a5568' };
    case 'vintage':
      return { hull: '#8b6f47', highlight: '#c4a574', cockpit: '#e8d4b0', thruster: '#c4844a' };
    default:
      return {
        hull: COLORS.playerHull,
        highlight: COLORS.playerHighlight,
        cockpit: COLORS.playerCockpit,
        thruster: COLORS.thrusterCore,
      };
  }
}

export function drawPlayer(ctx: CanvasRenderingContext2D, p: PlayerShip, frame: number) {
  const cx = p.x + p.width / 2;
  const cy = p.y + p.height / 2;
  const palette = skinPalette(p.shipSkin);

  ctx.save();

  const flicker = Math.sin(p.thrusterFrame * 0.5) * 3;
  const thrusterGrad = ctx.createLinearGradient(cx, p.y + p.height, cx, p.y + p.height + 16 + flicker);
  thrusterGrad.addColorStop(0, palette.thruster);
  thrusterGrad.addColorStop(0.6, COLORS.warmDeep);
  thrusterGrad.addColorStop(1, COLORS.thrusterFade);
  ctx.fillStyle = thrusterGrad;
  ctx.beginPath();
  ctx.moveTo(cx - 7, p.y + p.height);
  ctx.lineTo(cx, p.y + p.height + 14 + flicker);
  ctx.lineTo(cx + 7, p.y + p.height);
  ctx.fill();

  ctx.fillStyle = palette.hull;
  ctx.beginPath();
  ctx.moveTo(cx, p.y);
  ctx.lineTo(cx + 18, p.y + 30);
  ctx.lineTo(cx + 22, p.y + 40);
  ctx.lineTo(cx + 8, p.y + 35);
  ctx.lineTo(cx + 6, p.y + p.height);
  ctx.lineTo(cx - 6, p.y + p.height);
  ctx.lineTo(cx - 8, p.y + 35);
  ctx.lineTo(cx - 22, p.y + 40);
  ctx.lineTo(cx - 18, p.y + 30);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = palette.cockpit;
  ctx.beginPath();
  ctx.ellipse(cx, p.y + 16, 4, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = palette.highlight;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx - 14, p.y + 28);
  ctx.lineTo(cx - 20, p.y + 38);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + 14, p.y + 28);
  ctx.lineTo(cx + 20, p.y + 38);
  ctx.stroke();

  if (p.powerUps.shield > 0) {
    ctx.strokeStyle = COLORS.powerShield;
    ctx.globalAlpha = 0.35 + Math.sin(frame * 0.08) * 0.15;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(cx, cy, p.width * 0.78, p.height * 0.68, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}

export function drawEnemy(ctx: CanvasRenderingContext2D, e: Enemy) {
  const cx = e.x + e.width / 2;
  const cy = e.y + e.height / 2;

  ctx.save();

  if (e.isBoss) {
    ctx.fillStyle = e.color;
    ctx.beginPath();
    ctx.moveTo(cx, e.y + e.height);
    ctx.lineTo(cx - 60, e.y + e.height - 10);
    ctx.lineTo(cx - 55, e.y + 20);
    ctx.lineTo(cx - 30, e.y);
    ctx.lineTo(cx, e.y + 10);
    ctx.lineTo(cx + 30, e.y);
    ctx.lineTo(cx + 55, e.y + 20);
    ctx.lineTo(cx + 60, e.y + e.height - 10);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = COLORS.bossCore;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 11, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    const barW = e.width;
    const barH = 5;
    const barX = e.x;
    const barY = e.y - 10;
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = COLORS.danger;
    ctx.fillRect(barX, barY, barW * (e.health / e.maxHealth), barH);
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barW, barH);
  } else {
    ctx.fillStyle = e.color;

    switch (e.type) {
      case 'basic':
        ctx.beginPath();
        ctx.moveTo(cx, e.y);
        ctx.lineTo(e.x + e.width, cy);
        ctx.lineTo(cx, e.y + e.height);
        ctx.lineTo(e.x, cy);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = COLORS.particleWhite;
        ctx.beginPath();
        ctx.arc(cx, cy, 3, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'zigzag': {
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
        ctx.fillStyle = 'rgba(10, 15, 24, 0.85)';
        ctx.beginPath();
        ctx.arc(cx, cy, 4, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 'swooper':
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

      case 'tank': {
        ctx.fillRect(e.x + 4, e.y + 4, e.width - 8, e.height - 8);
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(e.x, e.y, e.width, e.height);
        const tw = e.width;
        const th = 4;
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        ctx.fillRect(e.x, e.y - 7, tw, th);
        ctx.fillStyle = COLORS.success;
        ctx.fillRect(e.x, e.y - 7, tw * (e.health / e.maxHealth), th);
        break;
      }
    }
  }

  ctx.restore();
}

export function drawPowerUp(ctx: CanvasRenderingContext2D, pu: PowerUp, frame: number) {
  const cx = pu.x + pu.width / 2;
  const cy = pu.y + pu.height / 2;
  const pulse = Math.sin(frame * 0.08) * 1.5;

  ctx.save();

  let color: string;
  let label: string;
  switch (pu.type) {
    case 'spread':
      color = COLORS.powerSpread;
      label = 'S';
      break;
    case 'shield':
      color = COLORS.powerShield;
      label = '◊';
      break;
    case 'speed':
      color = COLORS.powerSpeed;
      label = '»';
      break;
    case 'life':
      color = COLORS.powerLife;
      label = '+';
      break;
  }

  ctx.fillStyle = 'rgba(10, 15, 24, 0.75)';
  ctx.beginPath();
  ctx.arc(cx, cy, 11 + pulse, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, 10 + pulse, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = color;
  ctx.font = '600 12px var(--font-mono), ui-monospace, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, cx, cy);

  ctx.restore();
}
