# PRD: Visual Overhaul & Third-Person Chase Camera

## Overview

Transform the existing Three.js platformer into a polished Mario-style 3D game with professional-quality visuals and a proper third-person chase camera system. The goal is to achieve a feel similar to Super Mario 3D World, Mario Odyssey, or Crash Bandicoot.

## Current State
- ✅ 3D platformer with Three.js + Vite
- ✅ Expanded world with Big House in the Sky theme
- ✅ Player movement, gravity, jumping
- ✅ Platforms, coins, hazards, checkpoints, goal
- ❌ Camera is static/awkward, doesn't follow properly
- ❌ Flat visuals with solid color materials
- ❌ Enemies are brown boxes
- ❌ No decorative scenery elements

## Goals

### Primary Goals
1. **Third-Person Chase Camera**: Proper camera that orbits the player with camera-relative controls
2. **Visual Overhaul**: Shadows, post-processing, better lighting
3. **Goomba-Style Enemies**: Cute primitive-based characters instead of boxes
4. **Mario Scenery**: Trees, pipes, question blocks, bushes, flowers

### Target Feel
- Responsive but not twitchy camera
- Movement that feels natural regardless of camera angle
- Cheerful, colorful Mario-like aesthetic
- Polished with shadows and subtle effects

## Non-Goals
- External 3D models (use only Three.js primitives)
- Complex animation rigs
- Sound effects or music
- Mobile touch controls

---

## Part 1: Camera System (Priority)

### Camera Behavior
| Feature | Specification |
|---------|--------------|
| Type | Third-person chase camera |
| Distance | ~150 units behind player |
| Height | ~80 units above player |
| Following | Smooth lerp (damping ~0.1) |
| User Control | Mouse drag to orbit around player |
| Collision | Stay above ground minimum height |

### Camera-Relative Movement (Critical)
The most important change: movement must be relative to camera orientation.

| Input | Movement Direction |
|-------|-------------------|
| W / Up | Move AWAY from camera (into screen) |
| S / Down | Move TOWARD camera |
| A / Left | Move to camera's LEFT |
| D / Right | Move to camera's RIGHT |

**Technical Approach**:
1. Get camera's forward vector (ignore Y component)
2. Get camera's right vector (cross product with world up)
3. Transform input based on these vectors
4. Apply movement in world space

### Character Rotation
- Character rotates to face movement direction
- Use slerp for smooth rotation (not instant snap)
- Rotation speed ~10-15 for responsive feel

---

## Part 2: Visual Overhaul

### Lighting Setup
| Light Type | Purpose | Settings |
|------------|---------|----------|
| DirectionalLight | Sun, shadows | Position (200, 400, 200), intensity 1.0 |
| HemisphereLight | Sky/ground ambient | Sky #87CEEB, Ground #8B4513, intensity 0.4 |
| AmbientLight | Fill | White, intensity 0.3 |

### Shadow Configuration
```
renderer.shadowMap.enabled = true
renderer.shadowMap.type = PCFSoftShadowMap
shadow.mapSize = 2048x2048
```

### Post-Processing Pipeline
Using `postprocessing` npm package:
1. **BloomEffect** - Glow on coins and magical elements
2. **FXAAEffect** - Anti-aliasing
3. **VignetteEffect** - Subtle darkening at edges (optional)

### Atmosphere
- **Fog**: Match sky color, fade distant objects
- **Materials**: MeshStandardMaterial with appropriate roughness/metalness

---

## Part 3: Goomba-Style Enemies

Replace brown box enemies with cute characters built from Three.js primitives.

### Anatomy
| Part | Geometry | Color |
|------|----------|-------|
| Body | Squashed sphere (scale y: 0.7) | Brown #8B4513 |
| Underbelly | Half sphere | Tan #D2B48C |
| Eyes | Small spheres | White |
| Pupils | Smaller spheres | Black |
| Eyebrows | Thin boxes, angled | Black |
| Feet | Flat spheres | Black |

### Animations
- **Idle**: Subtle up/down bounce
- **Walking**: Feet alternate up/down
- **Movement**: Squash-and-stretch on body

### Personality
- Should look grumpy but cute, not scary
- Angry eyebrows give personality
- Bounce adds life and charm

---

## Part 4: Mario-Style Scenery

### Trees (3 variations)
1. **Round**: Brown cylinder trunk + stacked green spheres for puffy canopy
2. **Tall**: Brown trunk + green cone for pine-like shape
3. **Palm**: Tall thin trunk + palm fronds (optional)

### Pipes
- Classic green Mario pipes
- Cylinder body + wider rim at top
- Dark opening
- Glossy material (metalness 0.3)
- Varying heights

### Question Blocks
- Yellow/gold cube
- White "?" on front (simplified)
- Floating with subtle bounce animation
- Can be hit from below (optional interaction)

### Bushes & Flowers
- **Bushes**: Cluster of green spheres
- **Flowers**: Stem + center + ring of petals (spheres)
- Various colors for variety

### Background Elements
- Distant hills/mountains (large half-spheres)
- Affected by fog for depth
- Non-interactive, purely decorative

### Optional Enhancements
- Sparkle particles near coins
- Floating musical notes
- Butterflies or birds as ambient particles
- Rainbows between platforms

---

## Technical Architecture

### Camera System
```javascript
class ChaseCamera {
  constructor(camera, target, options) {
    this.camera = camera;
    this.target = target;
    this.distance = options.distance || 150;
    this.height = options.height || 80;
    this.theta = 0; // Horizontal angle (mouse controlled)
    this.damping = options.damping || 0.1;
  }
  
  update(delta) {
    // Calculate desired position using spherical coordinates
    // Lerp camera position toward desired
    // Look at target
  }
  
  handleMouseDrag(deltaX) {
    this.theta += deltaX * 0.01;
  }
}
```

### Post-Processing Setup
```javascript
import { 
  EffectComposer, 
  RenderPass, 
  BloomEffect, 
  FXAAEffect, 
  EffectPass 
} from 'postprocessing';

function setupPostProcessing(renderer, scene, camera) {
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(new EffectPass(camera, 
    new BloomEffect({ intensity: 0.5 }),
    new FXAAEffect()
  ));
  return composer;
}
```

### Enemy Factory
```javascript
function createGoomba(position) {
  const goomba = new THREE.Group();
  // ... build from primitives
  goomba.position.copy(position);
  goomba.userData = {
    type: 'goomba',
    baseY: position.y,
    isMoving: false,
  };
  return goomba;
}
```

---

## Performance Constraints

- Target 60 FPS on modern laptop
- Shadow map size: 2048 (reduce if needed)
- Bloom iterations: 5-7 (default, reduce if needed)
- Limit total scenery objects (instancing if needed)
- Profile post-processing impact

---

## Acceptance Criteria

### Must Have
- [ ] Camera orbits around player
- [ ] Camera-relative movement (W = into screen)
- [ ] Character rotation toward movement
- [ ] Soft shadows on all objects
- [ ] Post-processing: bloom + anti-aliasing
- [ ] Goomba enemies with body, eyes, feet
- [ ] At least 5 trees placed in world
- [ ] At least 3 pipes placed in world

### Should Have
- [ ] Mouse drag to control camera angle
- [ ] Goomba idle bounce animation
- [ ] Goomba walking foot animation
- [ ] Question blocks with bounce animation
- [ ] Bushes and flowers as decoration
- [ ] Background hills

### Nice to Have
- [ ] Sparkle particles near coins
- [ ] Squash-and-stretch on Goombas
- [ ] Vignette post-processing effect
- [ ] Camera collision with geometry

---

## Milestones

1. **Camera Foundation**: Implement chase camera with smooth follow
2. **Camera-Relative Movement**: W moves away from camera, character rotates
3. **Lighting & Shadows**: Set up sun, hemisphere, shadows
4. **Post-Processing**: Add bloom and anti-aliasing
5. **Goomba Creation**: Build enemy model from primitives
6. **Goomba Animation**: Add bounce and walking
7. **Scenery**: Add trees, pipes, blocks, bushes
8. **Polish**: Background elements, fine-tuning

---

## Risks

- Camera-relative movement math can be tricky
- Post-processing may impact performance
- Goomba primitives may not look appealing (iterate on design)
- Too many scenery objects may slow rendering

## Decisions

1. Use `postprocessing` npm package (better than built-in EffectComposer)
2. Build all characters from primitives (no external models)
3. Camera orbits player horizontally only (not full spherical)
4. Start with camera system before any visual changes
