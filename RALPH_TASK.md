---
task: 3D Platformer Prototype (Three.js + Vite)
test_command: "npm run build"
---

# Task: 3D Platformer Prototype

Build a minimal 3D platformer inspired by Super Mario using Three.js with a perspective camera. Use box meshes, simple gravity/jump, and a gap + platform to validate collisions. Keep movement on the X/Y plane (Z fixed).

## Requirements

1. Use **vanilla JavaScript** with **Three.js** and **Vite**.
2. Perspective camera framed to an 800x400 play area (centered at 400, 200).
3. Light blue background (#87CEEB).
4. Ground: two brown segments with a gap.
5. Player: red box with gravity + jump + left/right movement.
6. Floating green platform (one-way from above).
7. Death + reset when y < 0 with a brief message.

## Success Criteria

1. [x] `vite` dev server runs and renders ground segments, platform, player.
2. [x] Arrow keys move player left/right at 5 units per frame.
3. [x] Gravity (-0.5 per frame) and jump (velocity 12) work.
4. [x] Player lands only on ground segments (gap is pass-through).
5. [x] One-way platform works from above while falling.
6. [x] Falling below y=0 shows “You died!” and resets after 1s.
7. [x] Player clamped to x range 15–785.

## Defaults

- View size: 800x400 (center 400, 200)
- Ground top y: 50
- Player size: 30x40 (start x: 50, y on ground)
- Gap: x 350–470
- Platform: center x 350, y 250, size 100x15

## Manual Test Plan

1. Start dev server and confirm scene renders.
2. Walk right, jump gap via platform, land on right ground.
3. Fall into gap to see death + reset.

---

## Ralph Instructions

1. Work on the next incomplete criterion (marked [ ])
2. Check off completed criteria (change [ ] to [x])
3. Run tests after changes
4. Commit your changes frequently
5. When ALL criteria are [x], output: `<ralph>COMPLETE</ralph>`
6. If stuck on the same issue 3+ times, output: `<ralph>GUTTER</ralph>`
