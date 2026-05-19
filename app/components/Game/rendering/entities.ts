import { Enemy, PlayerShip, PowerUp } from '../types';
import { COLORS } from '../constants';

export function drawPlayer(ctx: CanvasRenderingContext2D, p: PlayerShip, frame: number) {
  const cx = p.x + p.width / 2;
  const cy = p.y + p.height / 2;

  ctx.save();

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

  ctx.fillStyle = COLORS.playerShip;
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

  ctx.fillStyle = COLORS.cyan;
  ctx.shadowColor = COLORS.cyan;
  ctx.shadowBlur = 6;
  ctx.beginPath();
  ctx.ellipse(cx, p.y + 16, 4, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

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

  if (p.powerUps.shield > 0) {
    ctx.strokeStyle = COLORS.cyan;
    ctx.globalAlpha = 0.4 + Math.sin(frame * 0.1) * 0.2;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(cx, cy, p.width * 0.8, p.height * 0.7, 0, 0, Math.PI * 2);
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

    ctx.fillStyle = COLORS.yellow;
    ctx.shadowColor = COLORS.yellow;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 12, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

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
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(cx, cy, 4, 0, Math.PI * 2);
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
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(cx, cy, 5, 0, Math.PI * 2);
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
        ctx.strokeStyle = '#aaa';
        ctx.lineWidth = 2;
        ctx.strokeRect(e.x, e.y, e.width, e.height);
        ctx.fillStyle = '#666';
        ctx.fillRect(cx - 3, e.y + e.height - 4, 6, 10);
        const tw = e.width;
        const th = 4;
        ctx.fillStyle = '#333';
        ctx.fillRect(e.x, e.y - 8, tw, th);
        ctx.fillStyle = COLORS.green;
        ctx.fillRect(e.x, e.y - 8, tw * (e.health / e.maxHealth), th);
        break;
      }
    }
  }

  ctx.restore();
}

export function drawPowerUp(ctx: CanvasRenderingContext2D, pu: PowerUp, frame: number) {
  const cx = pu.x + pu.width / 2;
  const cy = pu.y + pu.height / 2;
  const pulse = Math.sin(frame * 0.1) * 2;

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
