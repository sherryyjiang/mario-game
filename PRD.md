# PRD: Micro-Planet Gravity Prototype (Three.js + Vite)

## Overview
Build a minimal third-person 3D prototype inspired by Mario 64/Galaxy. The scene contains a small spherical planet and a simple character that walks around its surface under custom gravity. Movement uses WASD, and the camera follows behind the character, rotating smoothly as the character traverses the sphere.

## Goals
- Render a stable Three.js scene in a Vite dev server.
- Implement custom gravity that keeps the character on the planet surface.
- Provide intuitive, camera-relative WASD movement along the sphere.
- Use a third-person follow camera that orbits with the character.
- Keep visuals minimal; focus on control feel and camera behavior.

## Non-Goals
- Advanced physics, collisions, or ragdolls.
- Complex level design, enemies, or collectibles.
- Animation rigging or character art.
- Multiplayer or networking.

## Target Experience
- The player can move continuously around the planet without jitter or drift.
- Camera tracks smoothly and maintains a consistent behind-the-back framing.
- Controls feel consistent regardless of position on the sphere.

## User Stories
- As a player, I can move the character with WASD around a tiny planet.
- As a player, I stay grounded to the planet and do not float away.
- As a player, the camera stays behind me and rotates as I move.

## Functional Requirements
1. **Scene Setup**
   - One central sphere mesh for the planet.
   - One character mesh (cube or capsule) positioned on the surface.
   - Basic lighting to see shapes clearly.

2. **Custom Gravity**
   - A gravity vector always points from character to planet center.
   - Character orientation aligns to the planet normal.
   - Character remains at a fixed offset from the planet radius.

3. **Movement (WASD)**
   - Movement direction is camera-relative on the planet tangent plane.
   - Speed is constant and frame-rate independent.
   - Movement updates character position and facing direction.

4. **Camera**
   - Third-person follow camera behind the character.
   - Camera rotates with the character as they move around the sphere.
   - Smooth damping on camera position and look-at.

5. **Dev Server**
   - Vite provides hot reload and local development.

## Technical Stack
- **Three.js** for rendering.
- **Vite** for dev server and bundling.
- Vanilla JavaScript for fastest iteration.

## Architecture Notes
- Scene module initializes renderer, camera, lights, meshes.
- Input module maps WASD to movement intent.
- Update loop applies gravity, projects movement onto tangent plane, updates camera.

## Performance Constraints
- 60 FPS target on a modern laptop.
- Avoid heavy textures or high-poly meshes.

## Acceptance Criteria
- The scene runs via `vite` and renders a visible sphere and character.
- Character stays grounded on the sphere with custom gravity.
- WASD moves the character around the sphere surface (camera-relative).
- Camera follows smoothly from behind and rotates naturally with movement.

## Milestones
1. **Bootstrap**: Vite + Three.js scene renders.
2. **Physics Lite**: Gravity + grounding implemented.
3. **Controls**: WASD movement around the planet.
4. **Camera**: Follow camera with smoothing.

## Risks
- Movement drift due to numerical precision.
- Camera jitter when crossing poles.
- Inconsistent control feel if tangent projection is unstable.

## Decisions
1. Use vanilla JavaScript for the prototype.
2. Keep the character grounded-only for now (no jump).
3. Default camera: distance 6, height offset 2, smoothing enabled.
