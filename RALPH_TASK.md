---
task: Visual Overhaul & Third-Person Chase Camera
test_command: "npm run build"
---

# Task: Polish into Mario-Style 3D Game

Transform the platformer with a proper third-person chase camera, enhanced visuals, Goomba-style enemies, and Mario scenery. Target feel: Super Mario 3D World / Crash Bandicoot.

## Part 1: Camera System (Priority)

Implement a third-person chase camera with camera-relative movement:

**Camera Behavior:**
- Orbits around player as center point (distance ~150 behind, ~80 above)
- Smooth follow with lerp damping (~0.1)
- Mouse drag rotates camera horizontally around player
- Never clips through ground

**Movement (Critical):**
- W/up = move AWAY from camera (into screen)
- A/left = move to camera's LEFT
- S/down = move TOWARD camera
- D/right = move to camera's RIGHT
- Character rotates smoothly (slerp) to face movement direction

Research: spherical coordinates for camera positioning, camera-relative input transformation.

## Part 2: Visual Overhaul

**Lighting:**
- DirectionalLight as sun (cast shadows, mapSize 2048)
- HemisphereLight (sky #87CEEB, ground #8B4513)
- Soft ambient fill

**Shadows:**
- `renderer.shadowMap.type = THREE.PCFSoftShadowMap`
- All meshes cast/receive shadows

**Post-Processing:**
- Install `postprocessing` package
- BloomEffect (intensity 0.5, for coins/magic)
- FXAAEffect (anti-aliasing)

**Atmosphere:**
- Fog matching sky color

## Part 3: Goomba Enemies

Replace box enemies with cute primitives-based Goombas:
- Squashed sphere body (brown), lighter underbelly
- White eyes with black pupils
- Angry angled eyebrows (thin boxes)
- Two flat oval feet
- Idle: subtle bounce animation
- Walking: feet alternate, squash-and-stretch body

## Part 4: Mario Scenery

Add decorative elements using primitives:
- **Trees**: Cylinder trunk + stacked spheres (puffy canopy)
- **Pipes**: Green cylinders with wider rim, dark opening
- **Question blocks**: Gold cubes with subtle float animation
- **Bushes**: Clustered green spheres
- **Flowers**: Stem + center + petal ring
- **Background hills**: Large half-spheres in distance (affected by fog)

Place: 5+ trees, 3+ pipes, 3+ question blocks, 5+ bushes/flowers

## Success Criteria

### Camera
1. [x] Camera orbits player, stays behind/above
2. [x] Smooth follow with damping
3. [x] Mouse drag rotates camera around player
4. [x] W moves player AWAY from camera
5. [x] Character rotates smoothly toward movement

### Visuals
6. [x] Soft shadows enabled
7. [x] Post-processing: bloom + anti-aliasing
8. [x] Hemisphere + directional lighting
9. [x] Fog matching sky

### Enemies
10. [x] Goombas have rounded body, eyes, eyebrows, feet
11. [x] Goombas have idle bounce
12. [x] Goombas animate when walking

### Scenery
13. [x] 5+ trees placed
14. [x] 3+ pipes placed
15. [x] 3+ question blocks with animation
16. [x] 5+ bushes/flowers placed
17. [x] Background hills visible

---

## Ralph Instructions

1. Work through parts in order: Camera → Visuals → Enemies → Scenery
2. Check off completed criteria ([ ] → [x])
3. Run `npm run build` after changes
4. Commit frequently
5. When ALL [x], output: `<ralph>COMPLETE</ralph>`
6. If stuck 3+ times, output: `<ralph>GUTTER</ralph>`
