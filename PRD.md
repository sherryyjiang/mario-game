# PRD: Big House in the Sky - 3D Platformer

## Overview

Transform the existing 3D platformer prototype into a **floating castle in the sky** experience inspired by Super Mario 64's iconic "The Big House in the Sky" level. The entire game takes place in a magical sky setting with clouds, rainbow paths, and a grand floating castle as the centerpiece.

**Reference**: https://www.ign.com/wikis/super-mario-64/The_Big_House_in_the_Sky

## Current State (Completed)
- ✅ Basic 3D platformer with Three.js + Vite
- ✅ Player movement (WASD/arrows) with gravity and jumping
- ✅ Ground segments, static/moving/timed platforms
- ✅ Coins, hazards, jump pads, checkpoints, goal flag
- ✅ Death/respawn loop, score tracking
- ✅ Third-person camera follow

## Design Vision

### Theme: Castle in the Sky
A magical, ethereal world where everything floats among the clouds. The player navigates through cloud platforms, crosses rainbow bridges, climbs around a magnificent floating castle, and reaches the rooftop goal.

### Visual Inspiration (from SM64 Big House in the Sky)
- Rainbow-colored paths that wind through the sky
- A large house/castle structure floating in the clouds
- Spinning platforms and moving carpets/platforms
- Clear/transparent blocks
- Bright, cheerful sky atmosphere
- Sense of height and wonder

### Color Palette
| Element | Colors |
|---------|--------|
| Sky | #87CEEB → #4A90D9 (gradient) |
| Clouds | #FFFFFF, #F0F0F0 |
| Rainbow | Full spectrum gradient |
| Castle Stone | #C0C0C0, #A0A0A0, #808080 |
| Gold/Magic | #FFD700, #FFA500 |
| Accents | #DDA0DD (lavender), #FFB6C1 (pink) |

## Goals

### Primary Goals
1. **10x World Expansion**: Grow from 800 width to ~4000 width
2. **Unified Sky Theme**: All content fits the floating castle aesthetic
3. **Visual Upgrade**: Replace colored boxes with themed materials/textures
4. **Centerpiece Castle**: A large, impressive floating structure

### Secondary Goals
- Parallax cloud backgrounds for depth
- Spinning platform mechanics
- Rainbow/gradient visual effects
- Maintain 60 FPS performance

## Non-Goals
- Multiple biome/zone themes (just sky castle for now)
- Complex character animation
- Sound effects or music
- Mobile controls

## Target Experience
- Player feels like they're high in the sky among the clouds
- The floating castle creates a sense of wonder and destination
- Platforming feels varied (clouds, rainbows, stone, glass)
- Clear visual progression toward the castle and its rooftop

## User Stories
- As a player, I explore a magical sky world with varied platforms
- As a player, I can see a grand floating castle as my destination
- As a player, I encounter cloud, rainbow, and stone platforms
- As a player, I navigate spinning platforms that require timing
- As a player, I climb around and through the castle to reach the rooftop goal

## Functional Requirements

### 1. World Structure

**Total Playable Area**: x: 0–4000, z: -400–400

**Section 1: Cloud Approach (x: 0–1000)**
- White cloud platforms, easy jumps
- Introduction to mechanics
- First coins and basic hazards
- View of the distant castle

**Section 2: Rainbow Bridge (x: 1000–2000)**  
- Rainbow-colored platform paths
- Moving platforms gliding on rainbow trails
- Spinning platforms
- Increased difficulty

**Section 3: Castle Exterior (x: 2000–3200)**
- Stone/brick platforms around castle walls
- Vertical climbing sections
- Patrolling hazards
- Windows and architectural details

**Section 4: Castle Rooftop (x: 3200–4000)**
- Final approach to the goal
- Platforms on/inside the castle
- Rooftop with goal flag on highest point

### 2. Platform Types

| Platform Type | Visual | Behavior |
|--------------|--------|----------|
| Cloud | White, fluffy material | Static, solid |
| Rainbow | Gradient colors | Static or moving |
| Stone | Gray castle texture | Static, solid |
| Glass | Semi-transparent blue | Static, see-through |
| Spinning | Any material | Rotates on Y-axis |
| Moving | Any material | Moves along path |
| Timed | Cloud (fading) | Disappears after standing |

### 3. The Big House/Castle

Create a large decorative structure:
- Position: Centered around x: 2800
- Scale: Large enough to be impressive (400+ units wide)
- Features: Towers, windows, arched doorways
- Player platforms weave around the exterior
- Some platforms pass "through" openings

**Implementation Options** (in order of simplicity):
1. Grouped box geometries forming castle shape
2. Simple extruded shapes for towers/walls
3. Imported low-poly model (if free asset found)

### 4. Background & Atmosphere

**Sky Background**:
- Gradient from light blue (top) to deeper blue (horizon)
- Use `scene.background` with gradient texture or shader

**Parallax Clouds**:
- 2-3 layers of cloud planes at different depths
- Farther clouds move slower as camera moves
- Non-collidable, purely decorative

**Ambient Lighting**:
- Bright, warm ambient light
- Soft directional light from above

### 5. Content Requirements

| Content | Minimum Count |
|---------|---------------|
| Platforms | 32+ |
| Moving Platforms | 4+ |
| Spinning Platforms | 3+ |
| Coins | 50+ |
| Checkpoints | 8-10 |
| Hazards | 4+ |

## Technical Stack
- **Three.js** for 3D rendering
- **Vite** for dev server/bundling
- **Vanilla JavaScript** for game logic
- **PNG textures** (power-of-2 dimensions)

## Architecture Notes

### Spinning Platform Implementation
```javascript
class SpinningPlatform {
  constructor(mesh, rotationSpeed = 0.5) {
    this.mesh = mesh;
    this.rotationSpeed = rotationSpeed;
  }
  
  update(delta) {
    this.mesh.rotation.y += this.rotationSpeed * delta;
  }
}
```

### Parallax Background
```javascript
function updateParallax(cameraX) {
  cloudLayerFar.position.x = cameraX * 0.1;
  cloudLayerMid.position.x = cameraX * 0.3;
  cloudLayerNear.position.x = cameraX * 0.6;
}
```

### Castle Structure (Box Composition)
```javascript
function createCastle() {
  const castle = new THREE.Group();
  
  // Main building
  const mainBody = createBox({ width: 300, height: 200, depth: 200, color: 0xa0a0a0 });
  mainBody.position.set(0, 100, 0);
  castle.add(mainBody);
  
  // Towers
  const tower1 = createBox({ width: 60, height: 280, depth: 60, color: 0x909090 });
  tower1.position.set(-120, 140, -70);
  castle.add(tower1);
  
  // ... more elements
  return castle;
}
```

## Performance Constraints
- Target 60 FPS on modern laptop
- Limit total mesh count (use instancing if needed)
- Keep texture sizes reasonable (512x512 max)
- Profile if adding many decorative elements

## Asset Requirements

**Must Find/Create**:
1. Cloud texture or material style
2. Rainbow gradient (can be programmatic)
3. Stone/castle block texture
4. Sky gradient background

**Nice to Have**:
1. Fluffy cloud sprite for decoration
2. Sparkle/glow effect texture
3. Character texture for player

## Acceptance Criteria

### Must Have
- [ ] World expanded to 4000 width
- [ ] Sky gradient background (not flat color)
- [ ] Cloud-styled platforms in Section 1
- [ ] Rainbow-styled platforms in Section 2
- [ ] Stone-styled platforms in Section 3-4
- [ ] Large castle structure visible as centerpiece
- [ ] 50+ coins placed throughout
- [ ] 8+ checkpoints placed throughout
- [ ] Spinning platforms functional

### Should Have
- [ ] Parallax cloud background layers
- [ ] Glass/transparent platforms
- [ ] Player visual upgrade
- [ ] Decorative cloud elements

### Nice to Have
- [ ] Sparkle effects near magical areas
- [ ] Castle windows and details
- [ ] Smooth zone color transitions

## Milestones

1. **Asset Prep**: Source cloud, rainbow, stone textures/materials
2. **World Expansion**: Extend bounds, create Section 1 with clouds
3. **Rainbow Section**: Build Section 2 with rainbow paths
4. **Castle Build**: Create castle structure and Sections 3-4
5. **Polish**: Add parallax, decorative elements, spinning platforms
6. **Testing**: Full playthrough, performance check

## Risks
- Castle geometry may be complex to build from boxes
- Spinning platforms need careful collision handling
- Parallax may need performance tuning
- Finding perfect sky-themed assets may require creativity

## Decisions
1. Single cohesive sky castle theme (no multiple biomes)
2. Build castle from box primitives (no external 3D model import needed)
3. Prioritize world expansion over animation polish
4. Rainbow effects can be programmatic (vertex colors or multiple meshes)
