// ===== COLLISION DETECTION =====
export function rectsOverlap(
  x1: number, y1: number, w1: number, h1: number,
  x2: number, y2: number, w2: number, h2: number
): boolean {
  return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
}

/** Centered hitbox inside entity bounds */
export function centeredHitbox(
  x: number,
  y: number,
  entityW: number,
  entityH: number,
  hitW: number,
  hitH: number,
): { x: number; y: number; w: number; h: number } {
  return {
    x: x + (entityW - hitW) / 2,
    y: y + (entityH - hitH) / 2,
    w: hitW,
    h: hitH,
  };
}
