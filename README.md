# Kilo Shooter

A fullscreen arcade space shooter built with **Next.js 15**, **React 19**, **Pixi.js 8**, and **TypeScript**.

## Play

```bash
npm install --legacy-peer-deps
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy on Vercel

This app is a standard **Next.js** project with no server secrets required.

### Option A — Import from GitHub (recommended)

1. Open [Import KiloMan on Vercel](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fneutral-Stage%2FKiloMan&project-name=kiloman&repository-name=KiloMan&teamSlug=shuvo-anirban-roys-projects).
2. Confirm **Framework Preset: Next.js** and root directory `.`
3. Click **Deploy** — production deploys from `main` on every push.

### Option B — Vercel CLI

```bash
npm install -g vercel
vercel login
vercel link
vercel deploy --prod
```

`vercel.json` sets `npm install --legacy-peer-deps` for React 19 RC peer deps.

## Controls

| Key | Action |
|-----|--------|
| **Enter** | Start / restart |
| **WASD** or **Arrow keys** | Move ship |
| **Space** | Fire (auto-fire is always on) |
| **Esc** | Pause / resume |
| **S** | Shop (from title screen) |

## Features

- Pixi.js WebGL rendering with procedural baked sprites and parallax stars
- Wave-based enemy spawns with boss every 5 waves
- Power-ups: spread shot, shield, speed boost, extra life
- Screen shake, hit-stop, and damage flash feedback
- Procedural Web Audio sound effects
- Meta-progression: coins, achievements, hangar shop, ship skins
- High score and progress saved to `localStorage`
- Responsive fullscreen canvas with mobile touch controls

## Project structure

```
app/
├── layout.tsx
├── page.tsx
├── globals.css
└── components/Game/
    ├── GameContainer.tsx     # React shell
    ├── GameCanvas.tsx        # Pixi mount (thin wrapper)
    ├── hooks/useGameEngine.ts
    ├── engine/
    │   ├── GameEngine.ts     # Simulation + orchestration
    │   ├── GameLoop.ts       # State-aware rAF
    │   ├── RenderSystem.ts   # Pixi layers
    │   ├── TextureFactory.ts # Procedural art bake
    │   └── systems/          # Input, VFX, spatial hash
    ├── rewards/              # Achievements, shop, collectibles
    └── __tests__/
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm test` | Vitest unit tests |
| `npm run lint` | ESLint |

See [ARCHITECTURE.md](./ARCHITECTURE.md) for system design details.
