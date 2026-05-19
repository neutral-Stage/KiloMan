# Kilo Shooter — Architecture

## Overview

Kilo Shooter is a single-route Next.js app. All gameplay runs in one client component (`GameCanvas`) using a `requestAnimationFrame` loop. React only manages high-level screen state; hot-path simulation uses refs to avoid re-renders.

## State layers

| Layer | Location | Purpose |
|-------|----------|---------|
| Screen state | `GameContainer` → `useState<GameState>` | `start` \| `playing` \| `paused` \| `gameover` |
| Simulation | `GameCanvas` refs | Player, bullets, enemies, particles, waves |
| Persistence | `storage.ts` | High score in `localStorage` |

## Game loop

1. **Input** — `keydown` / `keyup` on `window`; AudioContext unlocked on first gesture.
2. **Update** — Runs only when `gameState === 'playing'`. Normalized delta time (~60fps cap).
3. **Draw** — Clears canvas, draws stars, entities, HUD, overlays (pause / wave banner).

## Combat model

- **Health** — 3 hull points per life; shield absorbs one hit without health loss.
- **Lives** — Losing all health costs one life and resets hull; 0 lives → game over.
- **Waves** — Spawn queue from `generateWave()`; completion when queue empty, counter zero, no enemies on screen.

## Module boundaries

```
GameCanvas (orchestrator)
    ├── defaults / storage     — factories & persistence
    ├── waveGenerator          — wave patterns & createEnemy
    ├── collision              — rectsOverlap
    ├── AudioEngine            — Web Audio SFX
    ├── constants              — tuning values
    └── rendering/*            — pure draw functions (no game logic)
```

## Rendering

All visuals are Canvas 2D. `rendering/` modules are pure functions: `(ctx, entities, frame) => void`. No React in the render path.

## Audio

`AudioEngine` lazily creates `AudioContext` and resumes on user input. Explosion uses a noise buffer; other SFX use oscillators.

## Object pooling

`pool.ts` provides `ObjectPool`, `createBulletPool`, and `createParticlePool`. The game loop uses `compactBullets` / `compactParticles` to remove dead entities in-place and return them to the pool instead of allocating new objects each frame.

## Touch controls

`TouchControls.tsx` renders a mobile-only (`md:hidden`) virtual D-pad, fire button, and pause control. Input is written to a shared `touchInputRef` merged with keyboard state in `GameCanvas`.

## Accessible HUD

`UIOverlay.tsx` is a React overlay with `aria-live` regions, a semantic health `progressbar`, and labeled score/wave/lives. Canvas HUD drawing was removed during play; the game loop publishes `HudSnapshot` via `onHudUpdate`.

## Tests

Run `npm test` (Vitest). Coverage includes:

- `collision.test.ts` — AABB overlap
- `waveLogic.test.ts` — spawn queue, wave completion, `generateWave` integration
- `pool.test.ts` — compact/release behavior

> **Note:** `architecture_plan.md` describes an older **Kilo Man platformer** design that was not implemented. This document reflects the current **space shooter** codebase.
