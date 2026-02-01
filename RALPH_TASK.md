---
task: 3D Platformer - Castle in the Sky Theme
test_command: "npm run build"
---

# Task: Big House in the Sky - Visual & World Expansion

Transform the basic platformer into a **floating castle in the sky** inspired by Super Mario 64's "The Big House in the Sky" level. The aesthetic should feature clouds, rainbow paths, floating platforms, and a grand castle structure suspended in the heavens.

Reference: https://www.ign.com/wikis/super-mario-64/The_Big_House_in_the_Sky

## Design Vision

**Theme**: Magical floating castle in a bright sky with clouds, rainbows, and ethereal platforms

**Key Visual Elements**:
- Bright blue sky background with fluffy white clouds
- Rainbow-colored paths and platforms
- A central floating castle/house structure
- Cloud platforms (white, fluffy, some semi-transparent)
- Golden/sparkly elements for coins and special areas
- Spinning platforms
- Clear/glass-like platforms you can see through

## Phase 1: Find & Integrate Visual Assets

### Asset Research (do this first!)
Search for free assets that match the sky castle theme:

1. **Cloud textures** - fluffy white clouds for platforms and background
2. **Rainbow/gradient textures** - for magical paths
3. **Castle/stone textures** - for the central building
4. **Sky/heaven backgrounds** - bright, magical sky
5. **Sparkle/glow effects** - for coins and magical elements

### Recommended Asset Sources:
- https://kenney.nl/assets (search "platformer", "fantasy", "sky")
- https://opengameart.org (search "cloud platform", "sky tileset", "castle")
- https://itch.io/game-assets/free (search "sky", "clouds", "fantasy platformer")

### Color Palette for Sky Castle Theme:
- Sky: Bright blue gradient (#87CEEB to #4A90D9)
- Clouds: White (#FFFFFF) with soft shadows
- Rainbow: Full spectrum gradient
- Castle: Light gray stone (#C0C0C0, #A0A0A0)
- Gold accents: (#FFD700, #FFA500)
- Magical glow: Soft purple/pink (#DDA0DD, #FFB6C1)

## Phase 2: World Expansion (10x Size)

Expand the world to approximately **4000x800** playable area, all within the sky castle theme:

### Layout Structure

**Section 1: Cloud Approach (x: 0–1000)**
- Starting area on solid cloud platforms
- Introduction to basic jumps and coin collection
- Floating cloud platforms leading toward the castle
- First glimpse of the Big House in the distance
- 2-3 checkpoints

**Section 2: Rainbow Bridge (x: 1000–2000)**
- Rainbow-colored platforms creating a path
- Moving platforms that glide along rainbow rails
- Spinning platforms (rotate slowly)
- Gaps with cloud platforms below as safety nets
- 2-3 checkpoints

**Section 3: Castle Exterior (x: 2000–3200)**
- Platforms around the exterior of a large floating castle
- Stone/brick textured platforms
- Windows and architectural details on the castle backdrop
- Vertical section climbing up the castle walls
- Patrolling hazards guarding the castle
- 2-3 checkpoints

**Section 4: Castle Interior & Rooftop (x: 3200–4000)**
- Platforms inside/through the castle structure
- Grand interior with columns and arches (decorative)
- Exit to rooftop with final challenge
- Goal flag on the highest tower
- 1-2 checkpoints

## Phase 3: Visual Implementation

### Background & Atmosphere
1. Gradient sky background (light blue at top, deeper blue at horizon)
2. Parallax cloud layers (distant clouds move slower)
3. The Big House visible as a large decorative structure in the scene

### Platform Types to Create
1. **Cloud platforms**: White, fluffy-looking, solid
2. **Rainbow platforms**: Colorful gradient, can be paths
3. **Stone platforms**: Gray castle stone texture
4. **Glass platforms**: Semi-transparent, you can see through
5. **Spinning platforms**: Rotate slowly, player must time jumps

### The Big House Structure
Create a large decorative castle/house mesh visible in the scene:
- Position around x: 2500–3500
- Large enough to feel impressive
- Player platforms weave around/through it
- Windows, towers, and architectural details

### Decorative Elements
1. Floating clouds (non-collidable, decorative)
2. Sparkles/particles near magical areas
3. Rainbow arcs in the background
4. Birds or butterflies (optional, simple sprites)

## Success Criteria

### Asset Integration
1. [x] Download or source at least 5 sky/castle themed assets
2. [x] Create `public/assets/` folder and organize images
3. [x] Cloud platforms use white/fluffy texture or material
4. [x] Rainbow platforms use gradient/colorful material
5. [x] Castle section uses stone/brick texture

### World Expansion
6. [x] Expand world bounds to x: 0–4000, z: -400–400
7. [x] Camera follows player smoothly across larger world
8. [x] Section 1 (Clouds): 8+ platforms, introductory difficulty
9. [x] Section 2 (Rainbow): 8+ platforms, 2+ moving platforms
10. [x] Section 3 (Castle Exterior): 10+ platforms, vertical climbing
11. [x] Section 4 (Castle/Rooftop): 6+ platforms, final goal
12. [x] Add 8-10 checkpoints spread across all sections
13. [x] Add 50+ coins total across all sections
14. [x] Add 4+ hazards appropriate to theme

### Visual Polish
15. [x] Sky background is gradient blue (not flat color)
16. [x] At least one parallax cloud layer in background
17. [x] The Big House/Castle structure visible as centerpiece
18. [x] Spinning platforms implemented and functional
19. [x] Player visual upgraded from plain red box

## Technical Notes

### Creating Cloud-Like Materials
```javascript
// Soft white cloud material
const cloudMaterial = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  roughness: 1.0,
  metalness: 0,
});

// Or with texture
const cloudTexture = textureLoader.load('/assets/cloud.png');
const cloudMaterial = new THREE.MeshStandardMaterial({ map: cloudTexture });
```

### Rainbow Gradient (Programmatic)
```javascript
// Create rainbow gradient using vertex colors or multiple segments
const rainbowColors = [0xff0000, 0xff7f00, 0xffff00, 0x00ff00, 0x0000ff, 0x8b00ff];
```

### Spinning Platform
```javascript
// In update loop
spinningPlatform.rotation.y += delta * 0.5; // Slow rotation
```

### Glass/Transparent Platform
```javascript
const glassMaterial = new THREE.MeshStandardMaterial({
  color: 0xadd8e6,
  transparent: true,
  opacity: 0.5,
});
```

## Manual Test Plan

1. Verify sky background renders as gradient
2. Walk through all 4 sections, confirm platforms are solid
3. Test spinning platforms - player can stand and ride rotation
4. Collect coins throughout the level
5. Die to hazards and respawn at checkpoints
6. Complete from start to rooftop goal
7. Confirm 60 FPS performance

---

## Ralph Instructions

1. **Start with asset research** - find cloud, rainbow, castle textures
2. Work on criteria in order (assets → expansion → polish)
3. Check off completed criteria (change [ ] to [x])
4. Run `npm run build` after changes to verify no errors
5. Commit frequently with descriptive messages
6. When ALL criteria are [x], output: `<ralph>COMPLETE</ralph>`
7. If stuck on the same issue 3+ times, output: `<ralph>GUTTER</ralph>`

### Search Terms for Assets
- "cloud platform texture"
- "sky tileset game"
- "rainbow gradient texture"
- "castle stone tileset"
- "fantasy sky background"
- "floating island assets"
