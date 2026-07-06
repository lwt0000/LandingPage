---
name: verify
description: How to launch and drive this portfolio site to verify changes at runtime.
---

# Verify this project

Single-page Next.js portfolio (App Router, one route `/`). The signature surface
is the WebGL badge in `#spawn` plus scroll sections (`#quest-path`, `#archive`,
`#ability-tree`, …).

## Launch

```bash
npx next dev -p 3005   # pick a free port; the user often has their own server on 3000
```

Dev-server gotcha: only one `next dev` per directory — a second instance exits
with "Another next dev server is already running".

## Drive (Playwright)

- Install `playwright` in the scratchpad (not the repo) and launch chromium with
  `args: ["--enable-unsafe-swiftshader"]` — headless WebGL works via SwiftShader.
- `page.goto(..., { waitUntil: "domcontentloaded" })` — `networkidle` never fires
  (HMR websocket + hero mp4 stream).
- Badge: `await page.waitForSelector("#spawn canvas")`, then ~5s for the physics
  drop to settle. Card center settles near (72% width, 60% height) of the canvas
  at 1440×900. Drag with `mouse.down/move/up`; tap (<8px movement) flips the
  card; the GitHub/LinkedIn chips (~(1040,612) and (1118,612) screen at 1440×900)
  open popups — assert with `page.waitForEvent("popup")`.
- Ability tree orbit: drag on `#ability-tree .cursor-grab`; a plain click on a
  node must open `[role=dialog]`, a drag must not.
- Collect `page.on("pageerror")` — console noise from HMR websockets is normal
  when a server restarts, page errors are not.
