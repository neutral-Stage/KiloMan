import { GameData, PlayerShip } from '../types';
import { COLORS } from '../constants';

export function drawHUD(
  ctx: CanvasRenderingContext2D,
  W: number,
  gd: GameData,
  player: PlayerShip,
) {
  ctx.save();
  const pad = 15;
  const fontSize = Math.min(18, W * 0.022);

  ctx.fillStyle = COLORS.white;
  ctx.font = `bold ${fontSize}px monospace`;
  ctx.textAlign = 'left';
  ctx.fillText(`SCORE: ${gd.score.toLocaleString()}`, pad, pad + fontSize);

  ctx.fillStyle = COLORS.yellow;
  ctx.font = `${fontSize * 0.8}px monospace`;
  ctx.fillText(`HI: ${gd.highScore.toLocaleString()}`, pad, pad + fontSize * 2.2);

  ctx.fillStyle = COLORS.cyan;
  ctx.font = `bold ${fontSize}px monospace`;
  ctx.textAlign = 'center';
  ctx.fillText(`WAVE ${gd.wave + 1}`, W / 2, pad + fontSize);

  ctx.textAlign = 'right';
  ctx.fillStyle = COLORS.white;
  ctx.font = `bold ${fontSize}px monospace`;
  ctx.fillText('♥'.repeat(player.lives), W - pad, pad + fontSize);

  const barW = 100;
  const barH = 8;
  const barX = W - pad - barW;
  const barY = pad + fontSize + 10;
  ctx.fillStyle = '#333';
  ctx.fillRect(barX, barY, barW, barH);
  ctx.fillStyle = player.health > 1 ? COLORS.green : COLORS.red;
  ctx.fillRect(barX, barY, barW * (player.health / player.maxHealth), barH);

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
