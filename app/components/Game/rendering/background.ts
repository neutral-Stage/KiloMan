import { COLORS } from "../constants";
import type { Star } from "../types";

export function drawBackground(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  stars: Star[],
) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, COLORS.bgTop);
  g.addColorStop(0.55, COLORS.bgMid);
  g.addColorStop(1, COLORS.bgBottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  const vignette = ctx.createRadialGradient(W / 2, H * 0.35, H * 0.1, W / 2, H / 2, H * 0.85);
  vignette.addColorStop(0, "rgba(255,255,255,0.02)");
  vignette.addColorStop(1, "rgba(0,0,0,0.35)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, W, H);

  for (const star of stars) {
    ctx.fillStyle = `rgba(226, 232, 240, ${star.brightness})`;
    ctx.fillRect(star.x, star.y, star.size, star.size);
  }
}
