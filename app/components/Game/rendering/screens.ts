import { GameData } from '../types';
import { COLORS } from '../constants';
import { loadHighScore } from '../storage';

export function drawStartScreen(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  logo: HTMLImageElement | null,
) {
  if (logo) {
    const scale = Math.min(0.8, (W / logo.width) * 0.3);
    const lw = logo.width * scale;
    const lh = logo.height * scale;
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.drawImage(logo, W / 2 - lw / 2, H / 2 - lh / 2 - 60, lw, lh);
    ctx.restore();
  }

  ctx.save();
  ctx.fillStyle = COLORS.cyan;
  ctx.shadowColor = COLORS.cyan;
  ctx.shadowBlur = 20;
  ctx.font = `bold ${Math.min(72, W * 0.08)}px monospace`;
  ctx.textAlign = 'center';
  ctx.fillText('KILO SHOOTER', W / 2, H / 2 - 20);
  ctx.shadowBlur = 0;

  ctx.fillStyle = COLORS.white;
  ctx.font = `${Math.min(20, W * 0.025)}px monospace`;
  ctx.globalAlpha = 0.6 + Math.sin(Date.now() * 0.004) * 0.4;
  ctx.fillText('Press ENTER to start', W / 2, H / 2 + 30);
  ctx.globalAlpha = 1;

  ctx.fillStyle = '#888888';
  ctx.font = `${Math.min(16, W * 0.02)}px monospace`;
  ctx.fillText('WASD / Arrows: Move  •  Space: Shoot  •  ESC: Pause', W / 2, H / 2 + 80);

  const hs = loadHighScore();
  if (hs > 0) {
    ctx.fillStyle = COLORS.yellow;
    ctx.font = `${Math.min(18, W * 0.022)}px monospace`;
    ctx.fillText(`HIGH SCORE: ${hs.toLocaleString()}`, W / 2, H / 2 + 120);
  }
  ctx.restore();
}

export function drawGameOverScreen(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  gd: GameData,
) {
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

export function drawPauseOverlay(ctx: CanvasRenderingContext2D, W: number, H: number) {
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = COLORS.cyan;
  ctx.font = `bold ${Math.min(48, W * 0.06)}px monospace`;
  ctx.textAlign = 'center';
  ctx.fillText('PAUSED', W / 2, H / 2 - 10);
  ctx.fillStyle = COLORS.white;
  ctx.font = `${Math.min(18, W * 0.022)}px monospace`;
  ctx.globalAlpha = 0.7 + Math.sin(Date.now() * 0.004) * 0.3;
  ctx.fillText('Press ESC to resume', W / 2, H / 2 + 35);
  ctx.restore();
}

export function drawWaveBanner(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  wave: number,
  bossWaveInterval: number,
  alpha: number,
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = COLORS.white;
  ctx.font = 'bold 36px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`WAVE ${wave + 1}`, W / 2, H / 2);
  if (wave > 0 && wave % bossWaveInterval === 0) {
    ctx.fillStyle = COLORS.red;
    ctx.font = 'bold 24px monospace';
    ctx.fillText('⚠ BOSS INCOMING ⚠', W / 2, H / 2 + 40);
  }
  ctx.restore();
}
