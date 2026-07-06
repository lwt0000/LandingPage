# Wentao Lu — Cinematic Playable Portfolio

A dark, glossy, game-styled portfolio for Wentao Lu (game-AI software engineer).
The centerpiece is a real WebGL 3D badge hanging from a physics-simulated
lanyard, followed by nine scroll-driven "game world" scenes.

## Run

```bash
npm install
npm run dev    # development
npm run build  # production build
npm start      # serve production build
```

## Docker

Build and run with Docker Compose:

```bash
docker compose up --build
```

The app is served at <http://localhost:3000>.

Run detached:

```bash
docker compose up --build -d
```

Stop the container:

```bash
docker compose down
```

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS 4
- Framer Motion (drag/springs/inspect) + GSAP ScrollTrigger (scroll reveals, parallax)
- React Three Fiber + @react-three/rapier (rope physics) + meshline (lanyard strap)
- `qrcode` for the badge-back QR (→ LinkedIn), `lucide-react` icons

## Structure

- `content/content.ts` — **single source of truth** for all copy, roles,
  publications, projects, skills, awards, education, links, and asset slots.
  Edit content here; components render from data.
- `components/badge/` — the hero badge:
  - `Lanyard3D.tsx` — default experience: R3F scene, Rapier rope joints,
    meshline strap, canvas-generated card textures, drop-in entrance,
    drag/swing, tap-to-flip, UV-region link hotspots.
  - `Badge2D.tsx` — Framer Motion 2.5D fallback used for
    `prefers-reduced-motion`, missing WebGL, or very low-memory devices.
  - `BadgeRig.tsx` — feature gate; `badgeTextures.ts` — draws card faces,
    QR back, and the repeating `RESPAWN ENTERTAINMENT` strap onto canvases.
- `components/scenes/` — the nine scenes: Spawn → Profile → Quest Path →
  Archive → Missions → Ability Tree → Achievements → Origin → Portal.
- `components/nav/` — quest-map scroll-spy nav, accessible fallback nav,
  and the Resume Inventory drawer.
- `components/inspect/` — shared inspect panel (projects, publications,
  experience, skills). Closes on Esc / backdrop / button.

## Asset slots

Discovered assets live in `assests/` (existing folder name kept) and are
copied to `public/assets/`. Missing slots degrade gracefully:

| Slot | Status |
|---|---|
| Respawn logo | `public/assets/respawn-logo.webp` (dark logo is lightness-inverted on dark surfaces) |
| EA logo | `public/assets/ea-logo.svg` |
| Hero background video | none found — animated canvas (fog / light sweep / floating shards) renders instead. To add one later, put the file in `public/` and set `assets.heroVideo` in `content/content.ts`. |
| Badge-back QR | generated at runtime → LinkedIn |
| Resume | `public/resume.pdf` |

## Content rules baked in

- No resume button on the badge (hero, inventory, and contact only).
- No phone number anywhere.
- Local/generated assets only — nothing hotlinked.
- Fully usable without dragging, without sound, and with reduced motion.
