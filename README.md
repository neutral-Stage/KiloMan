# Kilo Shooter

A fullscreen arcade space shooter built with **Next.js 15**, **React 19**, **TypeScript**, and **HTML5 Canvas**.

## Play

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Controls

| Key | Action |
|-----|--------|
| **Enter** | Start / restart |
| **WASD** or **Arrow keys** | Move ship |
| **Space** | Fire (auto-fire is always on) |
| **Esc** | Pause / resume |

## Features

- Wave-based enemy spawns with increasing difficulty
- Boss waves every 5 waves
- Power-ups: spread shot, shield, speed boost, extra life
- Procedural Web Audio sound effects
- High score saved to `localStorage`
- Responsive fullscreen canvas

## Project structure

```
app/
├── layout.tsx              # Root layout, metadata, viewport
├── page.tsx                # Entry — mounts GameContainer
├── globals.css             # Tailwind + base resets
└── components/Game/
    ├── GameContainer.tsx   # Screen state (start / playing / paused / gameover)
    ├── GameCanvas.tsx      # Game loop, physics, input
    ├── types.ts            # TypeScript interfaces
    ├── constants.ts        # Balance tuning & colors
    ├── defaults.ts         # Default player & run state
    ├── storage.ts          # High score persistence
    ├── collision.ts        # AABB collision
    ├── waveGenerator.ts    # Waves & enemy factory
    ├── AudioEngine.ts      # Procedural SFX
    └── rendering/          # Canvas draw helpers
        ├── background.ts
        └── entities.ts
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for system design details.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Run production build |
| `npm run lint` | ESLint |

## Stack

- Next.js 15 (App Router)
- React 19
- Tailwind CSS v4
- TypeScript (strict)
