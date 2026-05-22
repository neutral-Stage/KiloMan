import type { Collectible, RewardPopup } from '../types';
import { COLORS } from '../constants';

export function drawCollectible(ctx: CanvasRenderingContext2D, c: Collectible): void {
  const cx = c.x + c.width / 2;
  const cy = c.y + c.height / 2;

  ctx.save();
  if (c.type === 'coin') {
    ctx.fillStyle = COLORS.warm;
    ctx.beginPath();
    ctx.arc(cx, cy, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = COLORS.warmDeep;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  } else if (c.type === 'gem') {
    ctx.fillStyle = COLORS.accent;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 8);
    ctx.lineTo(cx + 7, cy);
    ctx.lineTo(cx, cy + 8);
    ctx.lineTo(cx - 7, cy);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.fillStyle = COLORS.accentSoft;
    ctx.strokeStyle = COLORS.white;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
      const px = cx + Math.cos(angle) * 8;
      const py = cy + Math.sin(angle) * 8;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

export function drawRewardPopup(ctx: CanvasRenderingContext2D, rp: RewardPopup): void {
  const alpha = Math.max(0, rp.life / rp.maxLife);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = '600 14px var(--font-mono, monospace)';
  ctx.fillStyle = rp.color;
  ctx.textAlign = 'center';
  ctx.fillText(rp.text, rp.x, rp.y);
  ctx.restore();
}
