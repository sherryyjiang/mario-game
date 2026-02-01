---
task: Micro-Planet Gravity Prototype (Three.js + Vite)
test_command: "npm run build"
---

# Task: Micro-Planet Gravity Prototype

Build a minimal Three.js prototype inspired by Mario 64/Galaxy. The scene has a small spherical planet and a simple character that walks around its surface under custom gravity. Movement uses WASD (camera-relative), and a third-person camera follows behind the character.

## Requirements

1. Use **vanilla JavaScript** with **Three.js** and **Vite**.
2. Keep visuals minimal: one planet sphere and one character mesh.
3. Implement custom gravity toward the planet center.
4. Movement is on the tangent plane (camera-relative WASD).
5. Follow camera with smooth damping.

## Success Criteria

1. [x] `vite` dev server runs and renders the planet + character.
2. [x] Character is grounded on the planet via custom gravity.
3. [x] WASD moves the character around the sphere surface (camera-relative).
4. [x] Camera follows behind the character and rotates smoothly with movement.
5. [x] Movement is frame-rate independent (delta time based).
6. [x] Controls feel responsive (no visible jitter or input lag).
7. [x] Camera maintains a stable offset and does not flip at poles.

## Defaults

- Planet radius: 5
- Character size: 0.5
- Camera distance: 6
- Camera height offset: 2
- No jump (grounded-only)

## Manual Test Plan

1. Start dev server and confirm scene renders.
2. Hold W and circle the planet; confirm grounded movement.
3. Strafe with A/D and verify camera stays behind without flipping.

---

## Ralph Instructions

1. Work on the next incomplete criterion (marked [ ])
2. Check off completed criteria (change [ ] to [x])
3. Run tests after changes
4. Commit your changes frequently
5. When ALL criteria are [x], output: `<ralph>COMPLETE</ralph>`
6. If stuck on the same issue 3+ times, output: `<ralph>GUTTER</ralph>`
