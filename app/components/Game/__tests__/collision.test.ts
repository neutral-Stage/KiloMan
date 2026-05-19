import { describe, it, expect } from 'vitest';
import { rectsOverlap } from '../collision';

describe('rectsOverlap', () => {
  it('returns true when rectangles overlap', () => {
    expect(rectsOverlap(0, 0, 10, 10, 5, 5, 10, 10)).toBe(true);
  });

  it('returns false when separated horizontally', () => {
    expect(rectsOverlap(0, 0, 10, 10, 20, 0, 10, 10)).toBe(false);
  });

  it('returns false when separated vertically', () => {
    expect(rectsOverlap(0, 0, 10, 10, 0, 20, 10, 10)).toBe(false);
  });

  it('returns true when edges touch (shared edge)', () => {
    expect(rectsOverlap(0, 0, 10, 10, 10, 0, 10, 10)).toBe(false);
    expect(rectsOverlap(0, 0, 10, 10, 9, 0, 10, 10)).toBe(true);
  });

  it('returns true when one rect is inside another', () => {
    expect(rectsOverlap(0, 0, 100, 100, 40, 40, 10, 10)).toBe(true);
  });

  it('handles zero-size rects at same position', () => {
    expect(rectsOverlap(5, 5, 0, 0, 5, 5, 0, 0)).toBe(false);
  });
});
