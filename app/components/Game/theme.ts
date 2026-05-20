/** Design tokens — single source for UI (CSS) and canvas (COLORS). */
export const theme = {
  canvas: {
    bgTop: '#0a0f18',
    bgBottom: '#121a28',
    starDim: '#4a5568',
    starBright: '#94a3b8',
    vignette: 'rgba(0,0,0,0.45)',
  },
  css: {
    bg: '#0a0f18',
    surface: 'rgba(20, 28, 40, 0.72)',
    surfaceBorder: 'rgba(255, 255, 255, 0.09)',
    text: '#e8edf4',
    textMuted: '#8b9bb4',
    accent: '#6eb5ff',
    accentMuted: 'rgba(110, 181, 255, 0.15)',
    warm: '#e8a86a',
    danger: '#e07070',
    success: '#6bc49a',
  },
} as const;
