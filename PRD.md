# PRD: 3D Platformer Prototype (Three.js + Vite)

## Overview
Build a minimal 3D platformer inspired by Super Mario using Three.js with a perspective camera. The scene uses simple box shapes, basic gravity, jumping, and collision with ground segments and a floating platform. Gameplay is side-view (2.5D) with movement on the X/Y plane and Z fixed for simplicity.

## Goals
- Render a stable Three.js scene in a Vite dev server.
- Implement simple gravity and jumping with grounded checks.
- Support left/right movement with arrow keys (air control allowed).
- Add a gap, floating platform, and death/respawn loop.
- Keep visuals minimal; focus on control feel and collision behavior.

## Non-Goals
- Advanced physics, enemies, or collectibles.
- Animation rigging or character art.
- Multiplayer or networking.

## Target Experience
- The player can run, jump, and land consistently.
- Collisions feel stable (no jitter or clipping through platforms).
- Falling in the gap triggers a clear death + reset loop.

## User Stories
- As a player, I can move left/right with arrow keys.
- As a player, I can jump when grounded and arc through the air.
- As a player, I can land on ground segments and a floating platform.

## Functional Requirements
1. **Scene Setup**
- Light blue background (#87CEEB).
- Perspective camera framed to show an 800x400 area (centered at 400, 200).
- Ground is two brown 3D box segments with a gap.
- One floating green 3D platform.
- One red player 3D box.

2. **Player Movement**
   - Arrow keys move left/right at 5 units per frame.
   - Clamp to left/right bounds (x: 15–785).
   - Position/velocity stored in a simple object for later physics.

3. **Gravity + Jump**
   - Gravity adds -0.5 to y velocity per frame.
   - Spacebar jumps only when grounded; jump velocity = 12.
   - Track `isGrounded` to prevent double jumps.

4. **Collision Rules**
   - Ground landing only when player is above a ground segment.
   - One-way platform: only collides from above while falling.

5. **Death + Respawn**
   - If player y < 0, show “You died!” then reset after 1s.

## Technical Stack
- **Three.js** for rendering.
- **Vite** for dev server and bundling.
- Vanilla JavaScript for fastest iteration.

## Architecture Notes
- Scene module initializes renderer, camera, lights, meshes.
- Input module maps keys to movement intent and jump.
- Update loop applies gravity, resolves collisions, updates render.

## Performance Constraints
- 60 FPS target on a modern laptop.
- Avoid heavy textures or high-poly meshes.

## Acceptance Criteria
- The scene runs via `vite` and renders the ground segments, platform, and player.
- Player moves left/right, jumps, and lands with stable collisions.
- Player falls through the gap and triggers death + reset.
- Player can land on the floating platform from above (one-way).

## Milestones
1. **Bootstrap**: Vite + Three.js scene renders.
2. **Physics Lite**: Gravity + grounding implemented.
3. **Controls**: Arrow movement + jump.
4. **Level**: Gap + floating platform + death/reset.

## Risks
- Collision edge cases at segment boundaries.
- Platform one-way checks allowing clipping.
- Grounded state desync when landing.

## Decisions
1. Use vanilla JavaScript for the prototype.
2. Include jumping + gravity from the start.
3. Use a perspective camera framed to the 800x400 play area.
