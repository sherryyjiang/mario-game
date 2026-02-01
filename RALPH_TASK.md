---
task: Visual Overhaul & Third-Person Chase Camera
test_command: "npm run build"
---

# Task: Transform into Polished Mario-Style 3D Game

Transform the current Three.js platformer into a polished Mario-style 3D game with a proper third-person chase camera, enhanced visuals, cute Goomba-style enemies, and decorative Mario-style scenery.

**Target Feel**: Super Mario 3D World, Mario Odyssey, or Crash Bandicoot

---

## PART 1: CAMERA SYSTEM (PRIORITY - Do This First)

### Research First
Before implementing, understand these concepts:
- Third-person chase camera implementations in Three.js
- Camera-relative movement controls (where "up" moves away from camera, not world-forward)
- OrbitControls modification patterns for player-following
- Smooth camera lerping/damping techniques
- Camera collision to prevent clipping through geometry

### Camera Behavior Requirements

1. **Orbit Around Player**
   - Camera orbits around the player as the center point
   - Stays at a fixed distance behind and above the player
   - Adjustable offset (suggested: 150 units behind, 80 units above)

2. **Smooth Following**
   - Uses lerp/slerp for smooth camera movement
   - Doesn't snap rigidly to player position
   - Damping factor ~0.1 for smooth feel

3. **Player Camera Control**
   - Player can rotate camera around themselves with mouse drag
   - Optional: right-click drag or touch drag on mobile
   - Camera doesn't clip through platforms (stay above ground minimum)

4. **No Disorientation**
   - Camera should never make the player feel lost
   - Smooth transitions, no sudden jumps

### Movement Behavior Requirements

1. **Camera-Relative Movement** (Critical!)
   - When player presses W/"up": character moves AWAY from camera (into the screen)
   - When player presses A/"left": character moves to camera's LEFT
   - When player presses S/"down": character moves TOWARD camera
   - When player presses D/"right": character moves to camera's RIGHT

2. **Character Rotation**
   - Character model rotates to face the direction of movement
   - Rotation is smooth (use slerp), not instant snapping
   - Rotation speed ~10-15 for responsive but smooth feel

### Technical Implementation

```javascript
// Camera-relative movement calculation
function getMovementDirection(keys, camera) {
  // Get camera's forward direction (ignore Y)
  const cameraForward = new THREE.Vector3();
  camera.getWorldDirection(cameraForward);
  cameraForward.y = 0;
  cameraForward.normalize();
  
  // Get camera's right direction
  const cameraRight = new THREE.Vector3();
  cameraRight.crossVectors(cameraForward, new THREE.Vector3(0, 1, 0));
  cameraRight.normalize();
  
  // Build movement vector from input
  const movement = new THREE.Vector3();
  if (keys.forward) movement.add(cameraForward);
  if (keys.backward) movement.sub(cameraForward);
  if (keys.right) movement.add(cameraRight);
  if (keys.left) movement.sub(cameraRight);
  
  return movement.normalize();
}

// Smooth character rotation toward movement direction
function rotateCharacterToward(character, direction, delta, rotationSpeed = 10) {
  if (direction.lengthSq() > 0.01) {
    const targetAngle = Math.atan2(direction.x, direction.z);
    const currentAngle = character.rotation.y;
    const newAngle = lerpAngle(currentAngle, targetAngle, delta * rotationSpeed);
    character.rotation.y = newAngle;
  }
}

// Camera following with spherical coordinates
function updateChaseCamera(camera, playerPosition, cameraState, delta) {
  const spherical = new THREE.Spherical(
    cameraState.distance,  // radius (distance from player)
    cameraState.phi,       // polar angle (vertical)
    cameraState.theta      // azimuthal angle (horizontal, controlled by mouse)
  );
  
  const offset = new THREE.Vector3().setFromSpherical(spherical);
  const targetPosition = playerPosition.clone().add(offset);
  
  camera.position.lerp(targetPosition, delta * 5);
  camera.lookAt(playerPosition.x, playerPosition.y + 30, playerPosition.z);
}
```

---

## PART 2: VISUAL OVERHAUL

### Research First
- Three.js post-processing effects (EffectComposer, render passes)
- Three.js lighting best practices (shadow mapping, hemisphere lights)
- The `postprocessing` npm package (better performance than built-in)
- Toon/cel-shading techniques in Three.js
- Fog, bloom, and anti-aliasing in Three.js

### Lighting Improvements

1. **Directional Sun Light**
   ```javascript
   const sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
   sunLight.position.set(200, 400, 200);
   sunLight.castShadow = true;
   sunLight.shadow.mapSize.width = 2048;
   sunLight.shadow.mapSize.height = 2048;
   sunLight.shadow.camera.near = 100;
   sunLight.shadow.camera.far = 1500;
   sunLight.shadow.camera.left = -500;
   sunLight.shadow.camera.right = 500;
   ```

2. **Hemisphere Light** (sky + ground)
   ```javascript
   const hemiLight = new THREE.HemisphereLight(0x87CEEB, 0x8B4513, 0.4);
   scene.add(hemiLight);
   ```

3. **Soft Ambient**
   ```javascript
   const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
   scene.add(ambientLight);
   ```

### Shadow Setup

```javascript
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// For each mesh that should cast/receive shadows:
mesh.castShadow = true;
mesh.receiveShadow = true;
```

### Post-Processing Pipeline

Install the postprocessing package:
```bash
npm install postprocessing
```

Implement effects:
```javascript
import { EffectComposer, RenderPass, BloomEffect, FXAAEffect, VignetteEffect, EffectPass } from 'postprocessing';

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

// Bloom for coins and magical elements
const bloomEffect = new BloomEffect({
  intensity: 0.5,
  luminanceThreshold: 0.8,
  luminanceSmoothing: 0.3,
});

// Anti-aliasing
const fxaaEffect = new FXAAEffect();

// Subtle vignette
const vignetteEffect = new VignetteEffect({
  darkness: 0.3,
  offset: 0.3,
});

composer.addPass(new EffectPass(camera, bloomEffect, fxaaEffect, vignetteEffect));

// In animation loop, use composer.render() instead of renderer.render()
```

### Atmospheric Fog

```javascript
scene.fog = new THREE.Fog(0x87CEEB, 500, 3000); // Match sky color
```

### Better Materials

Consider using `MeshToonMaterial` for stylized look:
```javascript
const toonMaterial = new THREE.MeshToonMaterial({
  color: 0x00ff00,
  gradientMap: threeStepGradient, // Optional for cel-shaded look
});
```

---

## PART 3: ENEMY REDESIGN (GOOMBA-STYLE)

Replace brown box enemies with cute Goomba-inspired creatures using only Three.js primitives.

### Goomba Anatomy

```javascript
function createGoomba() {
  const goomba = new THREE.Group();
  
  // Body - squashed sphere (main brown body)
  const bodyGeometry = new THREE.SphereGeometry(20, 16, 12);
  bodyGeometry.scale(1, 0.7, 1); // Squash vertically
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.position.y = 15;
  goomba.add(body);
  
  // Lighter underbelly
  const bellyGeometry = new THREE.SphereGeometry(15, 16, 8, 0, Math.PI * 2, Math.PI / 2);
  const bellyMaterial = new THREE.MeshStandardMaterial({ color: 0xD2B48C });
  const belly = new THREE.Mesh(bellyGeometry, bellyMaterial);
  belly.position.y = 10;
  belly.rotation.x = Math.PI;
  goomba.add(belly);
  
  // Eyes (white spheres)
  const eyeGeometry = new THREE.SphereGeometry(5, 8, 8);
  const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
  leftEye.position.set(-8, 20, 15);
  goomba.add(leftEye);
  const rightEye = leftEye.clone();
  rightEye.position.set(8, 20, 15);
  goomba.add(rightEye);
  
  // Pupils (black spheres)
  const pupilGeometry = new THREE.SphereGeometry(2.5, 8, 8);
  const pupilMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
  const leftPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
  leftPupil.position.set(-8, 20, 19);
  goomba.add(leftPupil);
  const rightPupil = leftPupil.clone();
  rightPupil.position.set(8, 20, 19);
  goomba.add(rightPupil);
  
  // Angry eyebrows (thin boxes)
  const browGeometry = new THREE.BoxGeometry(8, 2, 2);
  const browMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
  const leftBrow = new THREE.Mesh(browGeometry, browMaterial);
  leftBrow.position.set(-8, 26, 16);
  leftBrow.rotation.z = 0.3; // Angry angle
  goomba.add(leftBrow);
  const rightBrow = leftBrow.clone();
  rightBrow.position.set(8, 26, 16);
  rightBrow.rotation.z = -0.3;
  goomba.add(rightBrow);
  
  // Feet (small capsule/sphere shapes)
  const footGeometry = new THREE.SphereGeometry(6, 8, 8);
  footGeometry.scale(1.5, 0.6, 1);
  const footMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
  const leftFoot = new THREE.Mesh(footGeometry, footMaterial);
  leftFoot.position.set(-10, 3, 0);
  goomba.add(leftFoot);
  const rightFoot = leftFoot.clone();
  rightFoot.position.set(10, 3, 0);
  goomba.add(rightFoot);
  
  return goomba;
}
```

### Goomba Animations

```javascript
function animateGoomba(goomba, time, isMoving) {
  // Idle bounce
  goomba.position.y = goomba.baseY + Math.sin(time * 3) * 2;
  
  // Walking animation - feet alternate
  if (isMoving) {
    const leftFoot = goomba.children.find(c => c.name === 'leftFoot');
    const rightFoot = goomba.children.find(c => c.name === 'rightFoot');
    if (leftFoot) leftFoot.position.y = 3 + Math.sin(time * 10) * 3;
    if (rightFoot) rightFoot.position.y = 3 + Math.cos(time * 10) * 3;
  }
  
  // Squash and stretch when moving
  if (isMoving) {
    const squash = 1 + Math.sin(time * 8) * 0.1;
    goomba.scale.set(squash, 1 / squash, squash);
  }
}
```

---

## PART 4: MARIO-STYLE SCENERY

Add decorative elements throughout the world:

### Trees

```javascript
function createTree(style = 'round') {
  const tree = new THREE.Group();
  
  // Trunk
  const trunkGeometry = new THREE.CylinderGeometry(8, 12, 60, 8);
  const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
  const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
  trunk.position.y = 30;
  tree.add(trunk);
  
  if (style === 'round') {
    // Puffy round canopy (stacked spheres)
    const leafMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22 });
    const canopy1 = new THREE.Mesh(new THREE.SphereGeometry(35, 12, 12), leafMaterial);
    canopy1.position.y = 80;
    tree.add(canopy1);
    const canopy2 = new THREE.Mesh(new THREE.SphereGeometry(25, 12, 12), leafMaterial);
    canopy2.position.set(20, 70, 0);
    tree.add(canopy2);
    const canopy3 = new THREE.Mesh(new THREE.SphereGeometry(25, 12, 12), leafMaterial);
    canopy3.position.set(-15, 75, 10);
    tree.add(canopy3);
  } else if (style === 'tall') {
    // Tall skinny tree
    const leafMaterial = new THREE.MeshStandardMaterial({ color: 0x2E8B57 });
    const canopy = new THREE.Mesh(new THREE.ConeGeometry(25, 80, 8), leafMaterial);
    canopy.position.y = 100;
    tree.add(canopy);
  } else if (style === 'palm') {
    // Palm tree style
    // ... palm fronds implementation
  }
  
  return tree;
}
```

### Green Pipes

```javascript
function createPipe(height = 60) {
  const pipe = new THREE.Group();
  
  const pipeMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x228B22,
    metalness: 0.3,
    roughness: 0.4,
  });
  
  // Main cylinder
  const bodyGeometry = new THREE.CylinderGeometry(25, 25, height, 16);
  const body = new THREE.Mesh(bodyGeometry, pipeMaterial);
  body.position.y = height / 2;
  pipe.add(body);
  
  // Rim at top
  const rimGeometry = new THREE.CylinderGeometry(30, 30, 15, 16);
  const rim = new THREE.Mesh(rimGeometry, pipeMaterial);
  rim.position.y = height + 7.5;
  pipe.add(rim);
  
  // Dark inner opening
  const openingGeometry = new THREE.CylinderGeometry(20, 20, 5, 16);
  const openingMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
  const opening = new THREE.Mesh(openingGeometry, openingMaterial);
  opening.position.y = height + 12;
  pipe.add(opening);
  
  return pipe;
}
```

### Question Blocks

```javascript
function createQuestionBlock() {
  const block = new THREE.Group();
  
  // Main block
  const geometry = new THREE.BoxGeometry(30, 30, 30);
  const material = new THREE.MeshStandardMaterial({ 
    color: 0xFFD700,
    metalness: 0.2,
    roughness: 0.5,
  });
  const cube = new THREE.Mesh(geometry, material);
  block.add(cube);
  
  // Question mark (simplified as white box with "?" or just a sphere)
  const markGeometry = new THREE.BoxGeometry(12, 16, 4);
  const markMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const mark = new THREE.Mesh(markGeometry, markMaterial);
  mark.position.z = 16;
  block.add(mark);
  
  // Animation properties
  block.baseY = 0;
  block.animTime = 0;
  
  return block;
}

function animateQuestionBlock(block, time) {
  // Subtle floating bounce
  block.position.y = block.baseY + Math.sin(time * 2) * 3;
}
```

### Bushes and Flowers

```javascript
function createBush() {
  const bush = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({ color: 0x32CD32 });
  
  // Cluster of spheres
  const positions = [
    [0, 0, 0], [-15, -5, 5], [15, -5, -5], [0, 10, 0]
  ];
  positions.forEach(([x, y, z]) => {
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(15, 12, 12), material);
    sphere.position.set(x, y + 15, z);
    bush.add(sphere);
  });
  
  return bush;
}

function createFlower(petalColor = 0xff69b4) {
  const flower = new THREE.Group();
  
  // Stem
  const stemGeometry = new THREE.CylinderGeometry(2, 2, 30, 8);
  const stemMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22 });
  const stem = new THREE.Mesh(stemGeometry, stemMaterial);
  stem.position.y = 15;
  flower.add(stem);
  
  // Center
  const centerGeometry = new THREE.SphereGeometry(6, 8, 8);
  const centerMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFF00 });
  const center = new THREE.Mesh(centerGeometry, centerMaterial);
  center.position.y = 35;
  flower.add(center);
  
  // Petals
  const petalGeometry = new THREE.SphereGeometry(5, 8, 8);
  const petalMaterial = new THREE.MeshStandardMaterial({ color: petalColor });
  for (let i = 0; i < 6; i++) {
    const petal = new THREE.Mesh(petalGeometry, petalMaterial);
    const angle = (i / 6) * Math.PI * 2;
    petal.position.set(Math.cos(angle) * 10, 35, Math.sin(angle) * 10);
    flower.add(petal);
  }
  
  return flower;
}
```

### Background Elements

```javascript
// Distant mountains/hills
function createBackgroundHills() {
  const hills = new THREE.Group();
  const material = new THREE.MeshBasicMaterial({ 
    color: 0x6B8E23,
    fog: true 
  });
  
  // Large distant hills
  const hillPositions = [
    { x: -1000, z: -1500, scale: 3 },
    { x: 500, z: -1800, scale: 4 },
    { x: 2000, z: -1600, scale: 2.5 },
  ];
  
  hillPositions.forEach(({ x, z, scale }) => {
    const hill = new THREE.Mesh(
      new THREE.SphereGeometry(200 * scale, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2),
      material
    );
    hill.position.set(x, 0, z);
    hills.add(hill);
  });
  
  return hills;
}

// Sparkle particles near coins
function createSparkleSystem() {
  // Use THREE.Points with a simple texture
  // Animate positions around coin locations
}
```

---

## Success Criteria

### Part 1: Camera System
1. [x] Camera orbits around player as center point
2. [x] Camera stays at fixed distance behind and above player
3. [x] Camera follows smoothly with lerp damping
4. [x] Mouse drag rotates camera around player
5. [x] W/up moves player AWAY from camera (into screen)
6. [x] A/left moves player to camera's LEFT
7. [x] Character rotates smoothly to face movement direction
8. [x] Camera doesn't clip through ground (stays above minimum height)

### Part 2: Visual Overhaul
9. [x] Soft shadows enabled (PCFSoftShadowMap)
10. [ ] Post-processing pipeline: bloom + anti-aliasing
11. [x] Hemisphere light + directional sun light
12. [x] Atmospheric fog matching sky color
13. [x] Player and platforms cast/receive shadows

### Part 3: Goomba Enemies
14. [ ] Goombas have rounded body (not box)
15. [ ] Goombas have eyes, pupils, and angry eyebrows
16. [ ] Goombas have two feet
17. [ ] Goombas have idle bounce animation
18. [ ] Goombas have walking animation (feet movement)

### Part 4: Scenery
19. [ ] At least 5 decorative trees placed in world
20. [ ] At least 3 green pipes placed in world
21. [ ] At least 3 question blocks with bounce animation
22. [ ] At least 5 bushes or flowers placed in world
23. [ ] Background hills/mountains visible in distance

---

## Manual Test Plan

1. **Camera**: Move player and verify camera follows smoothly
2. **Camera Controls**: Drag mouse to rotate camera around player
3. **Movement**: Press W and verify player moves INTO the screen (away from camera)
4. **Movement**: Rotate camera 90°, press W again, verify player still moves away from camera
5. **Rotation**: Verify character faces movement direction smoothly
6. **Shadows**: Verify soft shadows under player and platforms
7. **Visuals**: Verify bloom effect on coins (they should glow slightly)
8. **Goombas**: Verify they look cute with body, eyes, feet
9. **Goombas**: Verify they bounce/animate when moving
10. **Scenery**: Walk through world and verify trees, pipes, blocks visible
11. **Performance**: Maintain 60 FPS with all effects

---

## Ralph Instructions

1. **Start with Part 1 (Camera)** - this is the foundation for everything else
2. Work through parts in order: Camera → Visuals → Goombas → Scenery
3. Check off completed criteria (change [ ] to [x])
4. Run `npm run build` after changes to verify no errors
5. Test in browser after each major change
6. Commit frequently with descriptive messages
7. When ALL criteria are [x], output: `<ralph>COMPLETE</ralph>`
8. If stuck on the same issue 3+ times, output: `<ralph>GUTTER</ralph>`

### Key Technical Notes
- The camera-relative movement is the trickiest part - get this right first
- Install `postprocessing` package for better post-processing performance
- Use `THREE.MathUtils.lerp` and `THREE.Quaternion.slerp` for smooth interpolation
- Remember to enable `castShadow` and `receiveShadow` on meshes
- Test camera at various angles to ensure movement always feels correct
