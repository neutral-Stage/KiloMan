/** Grid-based broadphase for collision pairs. Cell size ~64px. */
export class SpatialHash<T> {
  private readonly cellSize: number;
  private cells = new Map<string, T[]>();

  constructor(cellSize = 64) {
    this.cellSize = cellSize;
  }

  clear(): void {
    this.cells.clear();
  }

  private key(cx: number, cy: number): string {
    return `${cx},${cy}`;
  }

  insert(x: number, y: number, w: number, h: number, item: T): void {
    const x0 = Math.floor(x / this.cellSize);
    const y0 = Math.floor(y / this.cellSize);
    const x1 = Math.floor((x + w) / this.cellSize);
    const y1 = Math.floor((y + h) / this.cellSize);
    for (let cy = y0; cy <= y1; cy++) {
      for (let cx = x0; cx <= x1; cx++) {
        const k = this.key(cx, cy);
        let bucket = this.cells.get(k);
        if (!bucket) {
          bucket = [];
          this.cells.set(k, bucket);
        }
        bucket.push(item);
      }
    }
  }

  /** Visit items in cells overlapping the query rect. */
  query(
    x: number,
    y: number,
    w: number,
    h: number,
    visitor: (item: T) => void,
  ): void {
    const seen = new Set<T>();
    const x0 = Math.floor(x / this.cellSize);
    const y0 = Math.floor(y / this.cellSize);
    const x1 = Math.floor((x + w) / this.cellSize);
    const y1 = Math.floor((y + h) / this.cellSize);
    for (let cy = y0; cy <= y1; cy++) {
      for (let cx = x0; cx <= x1; cx++) {
        const bucket = this.cells.get(this.key(cx, cy));
        if (!bucket) continue;
        for (const item of bucket) {
          if (!seen.has(item)) {
            seen.add(item);
            visitor(item);
          }
        }
      }
    }
  }
}
