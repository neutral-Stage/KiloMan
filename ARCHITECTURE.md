# Kilo Shooter — Architecture

## Overview

Kilo Shooter is a single-route Next.js app. Gameplay runs in a **Pixi.js 8** engine (`GameEngine`) driven by a state-aware `requestAnimationFrame` loop. React manages screen state, HUD, menus, and touch controls only.

## State layers

| Layer | Location | Purpose |
|-------|----------|---------|
| Screen state | `GameContainer` → `useState<GameState>` | `start` \| `playing` \| `paused` \| `gameover` \| `shop` |
| Simulation | `GameEngine` | Player, bullets, enemies, particles, waves |
| Persistence | `storage.ts`, `rewards/progress.ts` | High score and meta-progress in `localStorage` |

## Game loop

1. **Input** — `InputSystem` registers stable `keydown` / `keyup` listeners; reads `touchInputRef` each frame.
2. **Update** — Runs when `gameState === 'playing'`. Normalized delta time with VFX hit-stop/slow-mo multipliers.
3. **Render** — `RenderSystem` syncs Pixi sprites to simulation state; parallax stars and nebula background.

`GameLoop` throttles to ~15 FPS on idle menus (`start`, `gameover`, `shop`) and runs full rate during play.

## Module boundaries

```
GameContainer (React shell)
    └── GameCanvas → useGameEngine hook
            └── GameEngine
                    ├── GameLoop
                    ├── InputSystem
                    ├── RenderSystem + TextureFactory
                    ├── VfxSystem (shake, flash, hit-stop)
                    ├── spatialHash (collision broadphase)
                    ├── waveGenerator / waveLogic
                    ├── collision / pool
                    ├── AudioEngine
                    └── rewards/* (achievements, shop, collectibles)
```

## Rendering

- **Pixi.js** layered containers: background nebula → stars → entities → projectiles → VFX.
- **TextureFactory** bakes procedural ship/enemy/bullet graphics to textures at init (no external sprite sheets).
- React **UIOverlay** provides accessible HUD; boss HP bar when a boss is active.

## Combat model

- **Health** — 3 hull points per life; shield absorbs one hit without health loss.
- **Hitboxes** — Smaller `collisionWidth` / `collisionHeight` than visual bounds for fair play.
- **Waves** — Spawn queue from `generateWave()`; `waveEnemiesRemaining` decrements on kill only (not off-screen despawn).
- **Collisions** — Spatial hash grid (~64px cells) for bullet↔enemy queries.

## Audio

`AudioEngine` uses Web Audio oscillators plus a **pre-allocated** explosion noise buffer. `playWaveStart()` plays between waves.

## Object pooling

`pool.ts` — bullets and particles. Enemies/power-ups/collectibles use in-place compaction arrays.

## Touch controls

`TouchControls.tsx` — mobile D-pad, fire, pause. Larger touch targets with active-state glow on fire.

## Tests

Run `npm test` (Vitest): collision, waveLogic, pool, achievements.

## Rewards (meta-progress)

Collectibles, achievements, and shop unlocks under `rewards/`. Engine calls `checkAchievements` on a timer and emits HUD/progress updates via callbacks.

> **Note:** `architecture_plan.md` describes an older platformer design. This document reflects the current space shooter.
