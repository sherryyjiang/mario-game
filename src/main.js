import * as THREE from 'three';
import { BloomEffect, EffectComposer, EffectPass, FXAAEffect, RenderPass } from 'postprocessing';
import {
  collectCoins,
  getAabbFromCenter,
  getCameraRelativeMoveVector,
  getPatrolOffset,
  isAabbOverlap,
  isGoalReached,
  isLandingOnTop,
  updateCheckpoint,
  updateTimedPlatformState,
} from './game/logic.js';

// Configuration - Sky Castle Theme
const CONFIG = {
  // View settings
  viewWidth: 1200,
  viewHeight: 600,
  
  // World bounds - 10x expanded
  worldMinX: 0,
  worldMaxX: 4000,
  worldMinZ: -400,
  worldMaxZ: 400,
  
  // Ground settings
  groundTopY: 50,
  groundDepth: 800,
  
  // Player settings
  playerWidth: 30,
  playerHeight: 40,
  playerDepth: 30,
  playerStartX: 80,
  playerStartZ: 80,
  
  // Physics
  moveSpeed: 6,
  gravity: -0.6,
  jumpVelocity: 14,
  landingTolerance: 8,
  
  // Camera
  cameraDistance: 350,
  cameraPhi: 1.1, // polar angle (0 = straight up). Lower = higher camera.
  cameraTheta: Math.PI * 0.75, // azimuth around player
  cameraTargetHeight: 70,
  cameraFollowSpeed: 6, // higher = snappier
  cameraMinY: 80,
  cameraRotateSpeed: 0.006,
  
  // Colors - Sky Castle Theme
  skyTopColor: 0x4a90d9,
  skyBottomColor: 0x87ceeb,
  fogColor: 0x87ceeb,
  cloudColor: 0xffffff,
  rainbowColors: [0xff0000, 0xff7f00, 0xffff00, 0x00ff00, 0x0000ff, 0x8b00ff],
  stoneColor: 0xa0a0a0,
  stoneDarkColor: 0x808080,
  goldColor: 0xffd700,
  glassColor: 0xadd8e6,
  playerBodyColor: 0x3498db,
  playerCapColor: 0xe74c3c,
  hazardColor: 0xff6a00,
  checkpointColor: 0xffffff,
  checkpointActiveColor: 0x7fff00,
  checkpointFlagColor: 0xffd1dc,
  goalColor: 0xff69b4,
  coinColor: 0xffd700,
  
  // Checkpoint/goal settings
  checkpointPoleWidth: 12,
  checkpointPoleHeight: 70,
  checkpointPoleDepth: 12,
  checkpointFlagWidth: 28,
  checkpointFlagHeight: 18,
  checkpointFlagDepth: 8,
  goalWidth: 30,
  goalHeight: 120,
  goalDepth: 30,
  
  // Jump pad
  jumpPadBoost: 20,

  // Player rotation
  playerTurnSpeed: 12,
};

// Scene setup
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(CONFIG.fogColor, 500, 3000);

// Create gradient sky background
function createSkyGradient() {
  const canvas = document.createElement('canvas');
  canvas.width = 2;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 0, 512);
  gradient.addColorStop(0, '#4a90d9');
  gradient.addColorStop(0.5, '#87ceeb');
  gradient.addColorStop(1, '#b0e0e6');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 2, 512);
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

const skyTexture = createSkyGradient();
scene.background = skyTexture;

// Camera - third person follow
const aspect = CONFIG.viewWidth / CONFIG.viewHeight;
const camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 5000);
camera.position.set(200, 300, 400);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.setSize(CONFIG.viewWidth, CONFIG.viewHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

renderer.domElement.style.touchAction = 'none';
renderer.domElement.addEventListener('contextmenu', (event) => event.preventDefault());

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
scene.add(ambientLight);

const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x8b4513, 0.4);
scene.add(hemiLight);

const sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
sunLight.position.set(200, 400, 200);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 2048;
sunLight.shadow.mapSize.height = 2048;
sunLight.shadow.camera.near = 100;
sunLight.shadow.camera.far = 1500;
sunLight.shadow.camera.left = -800;
sunLight.shadow.camera.right = 800;
sunLight.shadow.camera.top = 800;
sunLight.shadow.camera.bottom = -800;
scene.add(sunLight);

const secondaryLight = new THREE.DirectionalLight(0xffeedd, 0.25);
secondaryLight.position.set(-300, 400, -200);
scene.add(secondaryLight);

// Post-processing (bloom + anti-aliasing)
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const bloomEffect = new BloomEffect({
  intensity: 0.5,
  luminanceThreshold: 0.8,
  luminanceSmoothing: 0.3,
});

const fxaaEffect = new FXAAEffect();
const effectPass = new EffectPass(camera, bloomEffect, fxaaEffect);
effectPass.renderToScreen = true;
composer.addPass(effectPass);

function updatePostprocessingSize() {
  const pixelRatio = renderer.getPixelRatio();
  composer.setSize(CONFIG.viewWidth, CONFIG.viewHeight);
  fxaaEffect.resolution.set(
    1 / (CONFIG.viewWidth * pixelRatio),
    1 / (CONFIG.viewHeight * pixelRatio)
  );
}

updatePostprocessingSize();

// === Materials ===

// Cloud material - soft white fluffy appearance
const cloudMaterial = new THREE.MeshStandardMaterial({
  color: CONFIG.cloudColor,
  roughness: 1.0,
  metalness: 0,
  flatShading: false,
});

// Rainbow materials - gradient colors
const rainbowMaterials = CONFIG.rainbowColors.map(color => 
  new THREE.MeshStandardMaterial({ color, roughness: 0.3, metalness: 0.1 })
);

// Stone/castle material
const stoneMaterial = new THREE.MeshStandardMaterial({
  color: CONFIG.stoneColor,
  roughness: 0.8,
  metalness: 0.1,
});

const stoneDarkMaterial = new THREE.MeshStandardMaterial({
  color: CONFIG.stoneDarkColor,
  roughness: 0.9,
  metalness: 0.1,
});

// Glass/transparent material
const glassMaterial = new THREE.MeshStandardMaterial({
  color: CONFIG.glassColor,
  transparent: true,
  opacity: 0.5,
  roughness: 0.1,
  metalness: 0.2,
});

// Gold material for accents
const goldMaterial = new THREE.MeshStandardMaterial({
  color: CONFIG.goldColor,
  roughness: 0.3,
  metalness: 0.8,
});

// === Helpers ===

function setShadowFlags(object3d, { castShadow = true, receiveShadow = true } = {}) {
  object3d.traverse((child) => {
    if (!child.isMesh) return;
    child.castShadow = castShadow;
    child.receiveShadow = receiveShadow;
  });
}

function createBox({ width, height, depth, material }) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    material
  );
  mesh.size = { width, height, depth };
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function createBoxWithColor({ width, height, depth, color }) {
  const mat = new THREE.MeshStandardMaterial({ color });
  return createBox({ width, height, depth, material: mat });
}

function createCloudPlatform({ width, height, depth }) {
  const group = new THREE.Group();
  
  // Main platform
  const main = createBox({ width, height, depth, material: cloudMaterial.clone() });
  group.add(main);
  
  // Add fluffy bumps for cloud effect
  const bumpCount = Math.floor(width / 40);
  for (let i = 0; i < bumpCount; i++) {
    const bumpSize = 15 + Math.random() * 15;
    const bump = new THREE.Mesh(
      new THREE.SphereGeometry(bumpSize, 8, 6),
      cloudMaterial
    );
    bump.castShadow = true;
    bump.receiveShadow = true;
    bump.position.set(
      (i - bumpCount / 2) * 35 + Math.random() * 10,
      height / 2 - 5,
      (Math.random() - 0.5) * depth * 0.6
    );
    group.add(bump);
  }
  
  group.size = { width, height, depth };
  return group;
}

function createRainbowPlatform({ width, height, depth, colorIndex = 0 }) {
  const material = rainbowMaterials[colorIndex % rainbowMaterials.length];
  const mesh = createBox({ width, height, depth, material: material.clone() });
  mesh.material.emissive = new THREE.Color(material.color).multiplyScalar(0.2);
  return mesh;
}

function createStonePlatform({ width, height, depth }) {
  return createBox({ width, height, depth, material: stoneMaterial.clone() });
}

function createGlassPlatform({ width, height, depth }) {
  return createBox({ width, height, depth, material: glassMaterial.clone() });
}

function createSpinningPlatform({ width, height, depth, material }) {
  const mesh = createBox({ width, height, depth, material: material || goldMaterial.clone() });
  mesh.isSpinning = true;
  mesh.spinSpeed = 0.5;
  return mesh;
}

function createCheckpoint({ poleColor, flagColor }) {
  const group = new THREE.Group();
  const poleMat = new THREE.MeshStandardMaterial({ color: poleColor });
  const pole = createBox({
    width: CONFIG.checkpointPoleWidth,
    height: CONFIG.checkpointPoleHeight,
    depth: CONFIG.checkpointPoleDepth,
    material: poleMat,
  });
  pole.position.set(0, CONFIG.checkpointPoleHeight / 2, 0);
  group.add(pole);

  const flagMat = new THREE.MeshStandardMaterial({ color: flagColor });
  const flag = createBox({
    width: CONFIG.checkpointFlagWidth,
    height: CONFIG.checkpointFlagHeight,
    depth: CONFIG.checkpointFlagDepth,
    material: flagMat,
  });
  flag.position.set(CONFIG.checkpointFlagWidth / 2 + 6, CONFIG.checkpointPoleHeight - 10, 0);
  group.add(flag);

  return { group, pole, flag };
}

function getBoxAabb(box) {
  const pos = box.position || { x: 0, y: 0, z: 0 };
  const size = box.size || { width: 10, height: 10, depth: 10 };
  return getAabbFromCenter(
    { x: pos.x, y: pos.y, z: pos.z },
    { width: size.width, height: size.height, depth: size.depth }
  );
}

function getGroupAabb(group) {
  const pos = group.position;
  const size = group.size || { width: 100, height: 15, depth: 100 };
  return getAabbFromCenter(
    { x: pos.x, y: pos.y, z: pos.z },
    { width: size.width, height: size.height, depth: size.depth }
  );
}

function getCoinKey(position) {
  return `${position.x}|${position.y}|${position.z}`;
}

// === Create the Big House/Castle Structure ===

function createCastle() {
  const castle = new THREE.Group();
  
  // Main building
  const mainBuilding = createBox({
    width: 400,
    height: 350,
    depth: 300,
    material: stoneMaterial.clone(),
  });
  mainBuilding.position.set(0, 175, 0);
  castle.add(mainBuilding);
  
  // Roof
  const roofGeom = new THREE.ConeGeometry(250, 150, 4);
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x8b0000 });
  const roof = new THREE.Mesh(roofGeom, roofMat);
  roof.castShadow = true;
  roof.receiveShadow = true;
  roof.position.set(0, 350 + 75, 0);
  roof.rotation.y = Math.PI / 4;
  castle.add(roof);
  
  // Towers at corners
  const towerPositions = [
    { x: -180, z: -130 },
    { x: 180, z: -130 },
    { x: -180, z: 130 },
    { x: 180, z: 130 },
  ];
  
  for (const tpos of towerPositions) {
    const tower = createBox({
      width: 60,
      height: 420,
      depth: 60,
      material: stoneDarkMaterial.clone(),
    });
    tower.position.set(tpos.x, 210, tpos.z);
    castle.add(tower);
    
    // Tower roof
    const towerRoof = new THREE.Mesh(
      new THREE.ConeGeometry(45, 60, 8),
      new THREE.MeshStandardMaterial({ color: 0x4a0000 })
    );
    towerRoof.castShadow = true;
    towerRoof.receiveShadow = true;
    towerRoof.position.set(tpos.x, 420 + 30, tpos.z);
    castle.add(towerRoof);
  }
  
  // Windows
  const windowMat = new THREE.MeshStandardMaterial({
    color: 0xffeb99,
    emissive: 0xffeb99,
    emissiveIntensity: 0.5,
  });
  
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const windowMesh = createBox({
        width: 30,
        height: 50,
        depth: 10,
        material: windowMat.clone(),
      });
      windowMesh.position.set(
        (col - 1) * 80,
        80 + row * 90,
        -155
      );
      castle.add(windowMesh);
    }
  }
  
  // Gold decorations
  const goldBanner = createBox({
    width: 120,
    height: 40,
    depth: 15,
    material: goldMaterial.clone(),
  });
  goldBanner.position.set(0, 320, -155);
  castle.add(goldBanner);
  
  setShadowFlags(castle);
  return castle;
}

// === Parallax Background Clouds ===

function createBackgroundCloud(size) {
  const cloud = new THREE.Group();
  const numBalls = 4 + Math.floor(Math.random() * 4);
  
  for (let i = 0; i < numBalls; i++) {
    const radius = size * (0.5 + Math.random() * 0.5);
    const ball = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 8, 6),
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.8,
      })
    );
    ball.castShadow = false;
    ball.receiveShadow = false;
    ball.position.set(
      (Math.random() - 0.5) * size * 2,
      (Math.random() - 0.5) * size * 0.5,
      (Math.random() - 0.5) * size
    );
    cloud.add(ball);
  }
  
  return cloud;
}

const backgroundClouds = [];
for (let i = 0; i < 20; i++) {
  const cloud = createBackgroundCloud(40 + Math.random() * 60);
  cloud.position.set(
    Math.random() * 5000 - 500,
    200 + Math.random() * 400,
    -600 - Math.random() * 400
  );
  cloud.parallaxSpeed = 0.1 + Math.random() * 0.2;
  scene.add(cloud);
  backgroundClouds.push(cloud);
}

// === Mario-Style Scenery ===

function createTree(style = 'round') {
  const tree = new THREE.Group();

  const trunkGeometry = new THREE.CylinderGeometry(8, 12, 60, 8);
  const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
  const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
  trunk.position.y = 30;
  tree.add(trunk);

  if (style === 'round') {
    const leafMaterial = new THREE.MeshStandardMaterial({ color: 0x228b22 });
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
    const leafMaterial = new THREE.MeshStandardMaterial({ color: 0x2e8b57 });
    const canopy = new THREE.Mesh(new THREE.ConeGeometry(25, 80, 8), leafMaterial);
    canopy.position.y = 100;
    tree.add(canopy);
  }

  setShadowFlags(tree);
  return tree;
}

function createPipe(height = 60) {
  const pipe = new THREE.Group();

  const pipeMaterial = new THREE.MeshStandardMaterial({
    color: 0x228b22,
    metalness: 0.3,
    roughness: 0.4,
  });

  const bodyGeometry = new THREE.CylinderGeometry(25, 25, height, 16);
  const body = new THREE.Mesh(bodyGeometry, pipeMaterial);
  body.position.y = height / 2;
  pipe.add(body);

  const rimGeometry = new THREE.CylinderGeometry(30, 30, 15, 16);
  const rim = new THREE.Mesh(rimGeometry, pipeMaterial);
  rim.position.y = height + 7.5;
  pipe.add(rim);

  const openingGeometry = new THREE.CylinderGeometry(20, 20, 5, 16);
  const openingMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
  const opening = new THREE.Mesh(openingGeometry, openingMaterial);
  opening.position.y = height + 12;
  pipe.add(opening);

  setShadowFlags(pipe);
  return pipe;
}

function createQuestionBlock() {
  const block = new THREE.Group();

  const geometry = new THREE.BoxGeometry(30, 30, 30);
  const material = new THREE.MeshStandardMaterial({
    color: 0xffd700,
    metalness: 0.2,
    roughness: 0.5,
  });
  const cube = new THREE.Mesh(geometry, material);
  block.add(cube);

  const markGeometry = new THREE.BoxGeometry(12, 16, 4);
  const markMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const mark = new THREE.Mesh(markGeometry, markMaterial);
  mark.position.z = 16;
  block.add(mark);

  block.baseY = 0;

  setShadowFlags(block);
  return block;
}

function animateQuestionBlock(block, time) {
  const baseY = block.baseY ?? block.position.y;
  block.position.y = baseY + Math.sin(time * 2) * 3;
}

function createBush() {
  const bush = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({ color: 0x32cd32 });

  const positions = [
    [0, 0, 0],
    [-15, -5, 5],
    [15, -5, -5],
    [0, 10, 0],
  ];

  for (const [x, y, z] of positions) {
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(15, 12, 12), material);
    sphere.position.set(x, y + 15, z);
    bush.add(sphere);
  }

  setShadowFlags(bush);
  return bush;
}

function createFlower(petalColor = 0xff69b4) {
  const flower = new THREE.Group();

  const stemGeometry = new THREE.CylinderGeometry(2, 2, 30, 8);
  const stemMaterial = new THREE.MeshStandardMaterial({ color: 0x228b22 });
  const stem = new THREE.Mesh(stemGeometry, stemMaterial);
  stem.position.y = 15;
  flower.add(stem);

  const centerGeometry = new THREE.SphereGeometry(6, 8, 8);
  const centerMaterial = new THREE.MeshStandardMaterial({ color: 0xffff00 });
  const center = new THREE.Mesh(centerGeometry, centerMaterial);
  center.position.y = 35;
  flower.add(center);

  const petalGeometry = new THREE.SphereGeometry(5, 8, 8);
  const petalMaterial = new THREE.MeshStandardMaterial({ color: petalColor });
  for (let i = 0; i < 6; i++) {
    const petal = new THREE.Mesh(petalGeometry, petalMaterial);
    const angle = (i / 6) * Math.PI * 2;
    petal.position.set(Math.cos(angle) * 10, 35, Math.sin(angle) * 10);
    flower.add(petal);
  }

  setShadowFlags(flower);
  return flower;
}

function createBackgroundHills() {
  const hills = new THREE.Group();
  const material = new THREE.MeshBasicMaterial({
    color: 0x6b8e23,
    fog: true,
  });

  const hillPositions = [
    { x: -1000, z: -1500, scale: 3 },
    { x: 500, z: -1800, scale: 4 },
    { x: 2000, z: -1600, scale: 2.5 },
  ];

  for (const { x, z, scale } of hillPositions) {
    const hill = new THREE.Mesh(
      new THREE.SphereGeometry(200 * scale, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2),
      material
    );
    hill.position.set(x, 0, z);
    hill.castShadow = false;
    hill.receiveShadow = false;
    hills.add(hill);
  }

  return hills;
}

// === Create Level Platforms ===

const platforms = [];
const spinningPlatforms = [];
const movingPlatforms = [];
const hazards = [];
const questionBlocks = [];
const jumpPads = [];

// Section 1: Cloud Approach (x: 0-1000)
function createSection1() {
  // Starting ground cloud
  const startCloud = createCloudPlatform({ width: 300, height: 40, depth: 300 });
  startCloud.position.set(150, 30, 0);
  scene.add(startCloud);
  platforms.push({ mesh: startCloud, type: 'cloud' });
  
  // Cloud platforms leading forward
  const cloudPositions = [
    { x: 350, y: 80, z: -50 },
    { x: 480, y: 120, z: 80 },
    { x: 600, y: 100, z: -20 },
    { x: 720, y: 150, z: 100 },
    { x: 850, y: 130, z: -60 },
    { x: 950, y: 180, z: 40 },
    // Additional clouds for difficulty
    { x: 400, y: 60, z: 150 },
    { x: 550, y: 90, z: -150 },
  ];
  
  for (const pos of cloudPositions) {
    const cloud = createCloudPlatform({
      width: 100 + Math.random() * 40,
      height: 20,
      depth: 80 + Math.random() * 30,
    });
    cloud.position.set(pos.x, pos.y, pos.z);
    scene.add(cloud);
    platforms.push({ mesh: cloud, type: 'cloud' });
  }
}

// Section 2: Rainbow Bridge (x: 1000-2000)
function createSection2() {
  // Rainbow path platforms
  const rainbowPath = [
    { x: 1050, y: 200, z: 0, colorIndex: 0 },
    { x: 1150, y: 220, z: 50, colorIndex: 1 },
    { x: 1250, y: 240, z: 0, colorIndex: 2 },
    { x: 1350, y: 260, z: -50, colorIndex: 3 },
    { x: 1450, y: 250, z: 0, colorIndex: 4 },
    { x: 1550, y: 230, z: 50, colorIndex: 5 },
    { x: 1650, y: 210, z: 0, colorIndex: 0 },
    { x: 1750, y: 190, z: -50, colorIndex: 1 },
    { x: 1850, y: 180, z: 0, colorIndex: 2 },
    { x: 1950, y: 200, z: 50, colorIndex: 3 },
  ];
  
  for (const pos of rainbowPath) {
    const platform = createRainbowPlatform({
      width: 90,
      height: 15,
      depth: 90,
      colorIndex: pos.colorIndex,
    });
    platform.position.set(pos.x, pos.y, pos.z);
    scene.add(platform);
    platforms.push({ mesh: platform, type: 'rainbow' });
  }
  
  // Moving platforms along rainbow
  const moving1 = createRainbowPlatform({ width: 100, height: 15, depth: 80, colorIndex: 4 });
  moving1.basePosition = new THREE.Vector3(1200, 280, -100);
  moving1.position.copy(moving1.basePosition);
  moving1.moveAxis = 'z';
  moving1.moveAmplitude = 100;
  moving1.moveSpeed = 1.0;
  scene.add(moving1);
  movingPlatforms.push(moving1);
  platforms.push({ mesh: moving1, type: 'moving' });
  
  const moving2 = createRainbowPlatform({ width: 90, height: 15, depth: 90, colorIndex: 5 });
  moving2.basePosition = new THREE.Vector3(1600, 260, 100);
  moving2.position.copy(moving2.basePosition);
  moving2.moveAxis = 'x';
  moving2.moveAmplitude = 80;
  moving2.moveSpeed = 0.8;
  scene.add(moving2);
  movingPlatforms.push(moving2);
  platforms.push({ mesh: moving2, type: 'moving' });
  
  // Cloud safety nets below
  const safetyCloud1 = createCloudPlatform({ width: 200, height: 20, depth: 150 });
  safetyCloud1.position.set(1200, 100, 0);
  scene.add(safetyCloud1);
  platforms.push({ mesh: safetyCloud1, type: 'cloud' });
  
  const safetyCloud2 = createCloudPlatform({ width: 180, height: 20, depth: 150 });
  safetyCloud2.position.set(1600, 110, 0);
  scene.add(safetyCloud2);
  platforms.push({ mesh: safetyCloud2, type: 'cloud' });
}

// Section 3: Castle Exterior (x: 2000-3200)
function createSection3() {
  // Place the castle
  const castle = createCastle();
  castle.position.set(2700, 0, 0);
  scene.add(castle);
  
  // Stone platforms around castle exterior
  const stonePositions = [
    { x: 2050, y: 180, z: 0 },
    { x: 2150, y: 220, z: -80 },
    { x: 2250, y: 270, z: 0 },
    { x: 2350, y: 320, z: 80 },
    { x: 2450, y: 380, z: 0 },
    // Climbing up castle walls (vertical section)
    { x: 2550, y: 450, z: -100 },
    { x: 2600, y: 520, z: 0 },
    { x: 2650, y: 590, z: 100 },
    { x: 2750, y: 650, z: 0 },
    { x: 2850, y: 600, z: -80 },
    { x: 2950, y: 550, z: 0 },
    { x: 3050, y: 500, z: 80 },
  ];
  
  for (const pos of stonePositions) {
    const platform = createStonePlatform({
      width: 80 + Math.random() * 30,
      height: 18,
      depth: 80 + Math.random() * 20,
    });
    platform.position.set(pos.x, pos.y, pos.z);
    scene.add(platform);
    platforms.push({ mesh: platform, type: 'stone' });
  }
  
  // Spinning platforms near castle
  const spin1 = createSpinningPlatform({
    width: 100,
    height: 15,
    depth: 100,
    material: goldMaterial.clone(),
  });
  spin1.position.set(2200, 200, 100);
  scene.add(spin1);
  spinningPlatforms.push(spin1);
  platforms.push({ mesh: spin1, type: 'spinning' });
  
  const spin2 = createSpinningPlatform({
    width: 90,
    height: 15,
    depth: 90,
    material: goldMaterial.clone(),
  });
  spin2.position.set(2800, 550, -150);
  spin2.spinSpeed = 0.7;
  scene.add(spin2);
  spinningPlatforms.push(spin2);
  platforms.push({ mesh: spin2, type: 'spinning' });
  
  // Glass platforms
  const glass1 = createGlassPlatform({ width: 120, height: 12, depth: 100 });
  glass1.position.set(2400, 350, -120);
  scene.add(glass1);
  platforms.push({ mesh: glass1, type: 'glass' });
}

// Section 4: Castle Interior & Rooftop (x: 3200-4000)
function createSection4() {
  // Final stone/rooftop platforms
  const rooftopPositions = [
    { x: 3250, y: 480, z: 0 },
    { x: 3350, y: 500, z: -60 },
    { x: 3450, y: 520, z: 40 },
    { x: 3550, y: 550, z: 0 },
    { x: 3700, y: 600, z: -50 },
    { x: 3850, y: 650, z: 50 },
  ];
  
  for (const pos of rooftopPositions) {
    const platform = createStonePlatform({
      width: 100,
      height: 18,
      depth: 90,
    });
    platform.position.set(pos.x, pos.y, pos.z);
    scene.add(platform);
    platforms.push({ mesh: platform, type: 'stone' });
  }
  
  // Final spinning platform before goal
  const finalSpin = createSpinningPlatform({
    width: 120,
    height: 15,
    depth: 120,
    material: goldMaterial.clone(),
  });
  finalSpin.position.set(3950, 680, 0);
  finalSpin.spinSpeed = 0.3;
  scene.add(finalSpin);
  spinningPlatforms.push(finalSpin);
  platforms.push({ mesh: finalSpin, type: 'spinning' });
}

// Create all sections
createSection1();
createSection2();
createSection3();
createSection4();

// === Scenery (Decorative) ===

function createTree(style = 'round') {
  const tree = new THREE.Group();

  const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513, roughness: 0.9, metalness: 0.05 });
  const leafMaterial = new THREE.MeshStandardMaterial({ color: 0x228b22, roughness: 0.95, metalness: 0.0 });

  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(8, 12, 60, 8), trunkMaterial);
  trunk.position.y = 30;
  tree.add(trunk);

  if (style === 'tall') {
    const canopy = new THREE.Mesh(new THREE.ConeGeometry(28, 90, 8), leafMaterial);
    canopy.position.y = 110;
    tree.add(canopy);
  } else {
    const canopy1 = new THREE.Mesh(new THREE.SphereGeometry(35, 12, 12), leafMaterial);
    canopy1.position.y = 80;
    tree.add(canopy1);

    const canopy2 = new THREE.Mesh(new THREE.SphereGeometry(25, 12, 12), leafMaterial);
    canopy2.position.set(20, 70, 0);
    tree.add(canopy2);

    const canopy3 = new THREE.Mesh(new THREE.SphereGeometry(25, 12, 12), leafMaterial);
    canopy3.position.set(-15, 75, 10);
    tree.add(canopy3);
  }

  setShadowFlags(tree);
  return tree;
}

function addDecorativeTrees() {
  const treePlacements = [
    { position: { x: 180, y: 50, z: -80 }, style: 'round' },
    { position: { x: 480, y: 130, z: 110 }, style: 'round' },
    { position: { x: 850, y: 140, z: -20 }, style: 'tall' },
    { position: { x: 1250, y: 248, z: -40 }, style: 'round' },
    { position: { x: 2250, y: 279, z: 120 }, style: 'tall' },
  ];

  for (const placement of treePlacements) {
    const tree = createTree(placement.style);
    tree.position.set(placement.position.x, placement.position.y, placement.position.z);
    scene.add(tree);
  }
}

addDecorativeTrees();

// === Hazards ===

function createGoomba() {
  const goomba = new THREE.Group();

  const bodyGeometry = new THREE.SphereGeometry(20, 16, 12);
  bodyGeometry.scale(1, 0.7, 1);
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.position.y = 15;
  goomba.add(body);

  const bellyGeometry = new THREE.SphereGeometry(15, 16, 8, 0, Math.PI * 2, Math.PI / 2);
  const bellyMaterial = new THREE.MeshStandardMaterial({ color: 0xd2b48c });
  const belly = new THREE.Mesh(bellyGeometry, bellyMaterial);
  belly.position.y = 10;
  belly.rotation.x = Math.PI;
  goomba.add(belly);

  const eyeGeometry = new THREE.SphereGeometry(5, 8, 8);
  const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
  leftEye.position.set(-8, 20, 15);
  goomba.add(leftEye);
  const rightEye = leftEye.clone();
  rightEye.position.set(8, 20, 15);
  goomba.add(rightEye);

  const pupilGeometry = new THREE.SphereGeometry(2.5, 8, 8);
  const pupilMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
  const leftPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
  leftPupil.position.set(-8, 20, 19);
  goomba.add(leftPupil);
  const rightPupil = leftPupil.clone();
  rightPupil.position.set(8, 20, 19);
  goomba.add(rightPupil);

  const browGeometry = new THREE.BoxGeometry(8, 2, 2);
  const browMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
  const leftBrow = new THREE.Mesh(browGeometry, browMaterial);
  leftBrow.position.set(-8, 26, 16);
  leftBrow.rotation.z = 0.3;
  goomba.add(leftBrow);
  const rightBrow = leftBrow.clone();
  rightBrow.position.set(8, 26, 16);
  rightBrow.rotation.z = -0.3;
  goomba.add(rightBrow);

  const footGeometry = new THREE.SphereGeometry(6, 8, 8);
  footGeometry.scale(1.5, 0.6, 1);
  const footMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
  const leftFoot = new THREE.Mesh(footGeometry, footMaterial);
  leftFoot.name = 'leftFoot';
  leftFoot.position.set(-10, 3, 0);
  goomba.add(leftFoot);
  const rightFoot = leftFoot.clone();
  rightFoot.name = 'rightFoot';
  rightFoot.position.set(10, 3, 0);
  goomba.add(rightFoot);

  // Approximate collision bounds for AABB usage elsewhere
  goomba.size = { width: 55, height: 40, depth: 50 };

  setShadowFlags(goomba);
  return goomba;
}

// Hazard positions across sections
const hazardPositions = [
  // Section 1
  { x: 500, y: 80, z: 30, patrol: true, patrolDist: 60 },
  // Section 2
  { x: 1400, y: 240, z: 0, patrol: false },
  { x: 1700, y: 200, z: 30, patrol: true, patrolDist: 80 },
  // Section 3
  { x: 2300, y: 300, z: -40, patrol: true, patrolDist: 100 },
  { x: 2700, y: 620, z: 50, patrol: false },
];

for (const hpos of hazardPositions) {
  const hazard = createGoomba();
  hazard.position.set(hpos.x, hpos.y, hpos.z);
  hazard.baseY = hpos.y;
  if (hpos.patrol) {
    hazard.basePosition = new THREE.Vector3(hpos.x, hpos.y, hpos.z);
    hazard.patrolDistance = hpos.patrolDist;
    hazard.patrolSpeed = 1.2;
    hazard.isPatrolling = true;
  }
  scene.add(hazard);
  hazards.push(hazard);
}

// === Checkpoints (8-10 across sections) ===

const checkpointData = [
  // Section 1
  { id: 'start', position: { x: 100, y: 50, z: 0 } },
  { id: 'cloud1', position: { x: 600, y: 120, z: -20 } },
  { id: 'cloud2', position: { x: 950, y: 200, z: 40 } },
  // Section 2
  { id: 'rainbow1', position: { x: 1250, y: 260, z: 0 } },
  { id: 'rainbow2', position: { x: 1750, y: 210, z: -50 } },
  // Section 3
  { id: 'castle1', position: { x: 2250, y: 290, z: 0 } },
  { id: 'castle2', position: { x: 2650, y: 610, z: 0 } },
  { id: 'castle3', position: { x: 3050, y: 520, z: 80 } },
  // Section 4
  { id: 'rooftop1', position: { x: 3550, y: 570, z: 0 } },
  { id: 'rooftop2', position: { x: 3850, y: 670, z: 50 } },
];

const checkpoints = checkpointData.map((entry) => {
  const { group, pole, flag } = createCheckpoint({
    poleColor: CONFIG.checkpointColor,
    flagColor: CONFIG.checkpointFlagColor,
  });
  group.position.set(entry.position.x, entry.position.y, entry.position.z);
  scene.add(group);
  return {
    id: entry.id,
    position: entry.position,
    group,
    pole,
    flag,
    collisionSize: {
      width: CONFIG.checkpointPoleWidth + 30,
      height: CONFIG.checkpointPoleHeight,
      depth: CONFIG.checkpointPoleDepth + 30,
    },
  };
});

const checkpointBoxes = checkpoints.map((checkpoint) => ({
  id: checkpoint.id,
  position: checkpoint.position,
  checkpoint,
  box: getAabbFromCenter(checkpoint.position, checkpoint.collisionSize),
}));

// === Coins (50+ total) ===

const coinLayout = [];

// Section 1 coins (12 coins)
for (let i = 0; i < 12; i++) {
  coinLayout.push({
    position: { 
      x: 100 + i * 70, 
      y: 80 + Math.sin(i * 0.5) * 30, 
      z: Math.sin(i * 0.8) * 80 
    },
    radius: 15,
  });
}

// Section 2 coins (15 coins along rainbow)
for (let i = 0; i < 15; i++) {
  coinLayout.push({
    position: { 
      x: 1050 + i * 60, 
      y: 240 + Math.sin(i * 0.4) * 40, 
      z: Math.cos(i * 0.6) * 60 
    },
    radius: 15,
  });
}

// Section 3 coins (15 coins around castle)
for (let i = 0; i < 15; i++) {
  coinLayout.push({
    position: { 
      x: 2050 + i * 70, 
      y: 250 + i * 25, 
      z: Math.sin(i * 0.7) * 100 
    },
    radius: 15,
  });
}

// Section 4 coins (10 coins on rooftop)
for (let i = 0; i < 10; i++) {
  coinLayout.push({
    position: { 
      x: 3250 + i * 75, 
      y: 530 + i * 15, 
      z: Math.cos(i * 0.5) * 60 
    },
    radius: 15,
  });
}

let coins = [];

function createCoinMesh() {
  const geometry = new THREE.TorusGeometry(10, 4, 12, 18);
  const material = new THREE.MeshStandardMaterial({ 
    color: CONFIG.coinColor,
    emissive: 0xffa500,
    emissiveIntensity: 0.3,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function spawnCoins() {
  for (const coin of coins) {
    scene.remove(coin.mesh);
  }

  coins = coinLayout.map((entry) => {
    const mesh = createCoinMesh();
    mesh.position.set(entry.position.x, entry.position.y, entry.position.z);
    mesh.rotation.x = Math.PI / 2;
    scene.add(mesh);
    return { ...entry, mesh };
  });
}

spawnCoins();

// === Goal Flag ===

const goal = createBox({
  width: CONFIG.goalWidth,
  height: CONFIG.goalHeight,
  depth: CONFIG.goalDepth,
  material: new THREE.MeshStandardMaterial({
    color: CONFIG.goalColor,
    emissive: 0xff69b4,
    emissiveIntensity: 0.4,
  }),
});
goal.position.set(3980, 750, 0);
goal.size = { width: CONFIG.goalWidth, height: CONFIG.goalHeight, depth: CONFIG.goalDepth };
scene.add(goal);

// === Player (Upgraded Visual - Mario-like character) ===

function createPlayer() {
  const player = new THREE.Group();
  
  // Body
  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(12, 20, 8, 16),
    new THREE.MeshStandardMaterial({ color: CONFIG.playerBodyColor })
  );
  body.position.y = 0;
  player.add(body);
  
  // Head
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(10, 12, 10),
    new THREE.MeshStandardMaterial({ color: 0xffdbac }) // skin color
  );
  head.position.y = 22;
  player.add(head);
  
  // Cap
  const cap = new THREE.Mesh(
    new THREE.SphereGeometry(11, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: CONFIG.playerCapColor })
  );
  cap.position.y = 25;
  player.add(cap);
  
  // Cap brim
  const brim = new THREE.Mesh(
    new THREE.CylinderGeometry(12, 12, 3, 12),
    new THREE.MeshStandardMaterial({ color: CONFIG.playerCapColor })
  );
  brim.position.set(0, 22, 7);
  brim.rotation.x = Math.PI / 2;
  brim.scale.set(0.8, 0.5, 0.3);
  player.add(brim);
  
  // Eyes
  const eyeWhite = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const eyePupil = new THREE.MeshStandardMaterial({ color: 0x000000 });
  
  for (const side of [-1, 1]) {
    const white = new THREE.Mesh(new THREE.SphereGeometry(3, 8, 6), eyeWhite);
    white.position.set(side * 4, 24, 7);
    player.add(white);
    
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(1.5, 6, 4), eyePupil);
    pupil.position.set(side * 4, 24, 9);
    player.add(pupil);
  }
  
  player.size = { width: CONFIG.playerWidth, height: CONFIG.playerHeight, depth: CONFIG.playerDepth };

  setShadowFlags(player);
  return player;
}

const player = createPlayer();

// Player state
let playerX = CONFIG.playerStartX;
let playerY = CONFIG.groundTopY + CONFIG.playerHeight / 2 + 20;
let playerZ = CONFIG.playerStartZ;
let velocityY = 0;
let isGrounded = true;
let isDead = false;
let isRidingMovingPlatform = false;
let isWin = false;
let score = 0;
let activeCheckpoint = checkpoints[0];

function updatePlayerPosition() {
  player.position.set(playerX, playerY, playerZ);
}
updatePlayerPosition();
scene.add(player);

// UI Elements
const deathMessage = document.getElementById('death-message');
const winMessage = document.getElementById('win-message');
const scoreLabel = document.getElementById('score');
const checkpointLabel = document.getElementById('checkpoint');

function updateScore() {
  scoreLabel.textContent = `Coins: ${score}/${coinLayout.length}`;
}

function updateCheckpointLabel() {
  checkpointLabel.textContent = `Checkpoint: ${activeCheckpoint?.id ?? 'none'}`;
}

function updateCheckpointColors() {
  for (const checkpoint of checkpoints) {
    const isActive = activeCheckpoint?.id === checkpoint.id;
    checkpoint.pole.material.color.setHex(isActive ? CONFIG.checkpointActiveColor : CONFIG.checkpointColor);
  }
}

updateScore();
updateCheckpointLabel();
updateCheckpointColors();

// Input state
const keys = {
  left: false,
  right: false,
  forward: false,
  backward: false,
  jump: false,
};

window.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  if (key === 'a' || event.key === 'ArrowLeft') keys.left = true;
  if (key === 'd' || event.key === 'ArrowRight') keys.right = true;
  if (key === 'w' || event.key === 'ArrowUp') keys.forward = true;
  if (key === 's' || event.key === 'ArrowDown') keys.backward = true;
  if (key === ' ' || event.code === 'Space') keys.jump = true;
});

window.addEventListener('keyup', (event) => {
  const key = event.key.toLowerCase();
  if (key === 'a' || event.key === 'ArrowLeft') keys.left = false;
  if (key === 'd' || event.key === 'ArrowRight') keys.right = false;
  if (key === 'w' || event.key === 'ArrowUp') keys.forward = false;
  if (key === 's' || event.key === 'ArrowDown') keys.backward = false;
  if (key === ' ' || event.code === 'Space') keys.jump = false;
});

// Reset player
function resetPlayer({ resetCheckpoint = false } = {}) {
  if (resetCheckpoint) {
    activeCheckpoint = checkpoints[0];
  }

  const respawnPoint = activeCheckpoint?.position ?? {
    x: CONFIG.playerStartX,
    z: CONFIG.playerStartZ,
  };

  playerX = respawnPoint.x;
  playerY = (respawnPoint.y || CONFIG.groundTopY) + CONFIG.playerHeight / 2 + 20;
  playerZ = respawnPoint.z;
  velocityY = 0;
  isGrounded = true;
  isDead = false;
  isWin = false;
  isRidingMovingPlatform = false;
  
  if (resetCheckpoint) {
    score = 0;
    spawnCoins();
  }
  
  updateScore();
  updateCheckpointLabel();
  updateCheckpointColors();
  deathMessage.style.display = 'none';
  winMessage.style.display = 'none';
  updatePlayerPosition();
}

const clock = new THREE.Clock();
const cameraTarget = new THREE.Vector3();
const cameraPosition = new THREE.Vector3();
const cameraOffset = new THREE.Vector3();
const cameraForward = new THREE.Vector3();
const playerTargetQuaternion = new THREE.Quaternion();
const playerTargetEuler = new THREE.Euler(0, 0, 0, 'YXZ');
let elapsed = 0;

const cameraState = {
  isDragging: false,
  lastClientX: 0,
  lastClientY: 0,
  theta: CONFIG.cameraTheta,
  phi: CONFIG.cameraPhi,
  distance: CONFIG.cameraDistance,
};

renderer.domElement.addEventListener('pointerdown', (event) => {
  cameraState.isDragging = true;
  cameraState.lastClientX = event.clientX;
  cameraState.lastClientY = event.clientY;
  renderer.domElement.setPointerCapture?.(event.pointerId);
});

renderer.domElement.addEventListener('pointerup', (event) => {
  cameraState.isDragging = false;
  renderer.domElement.releasePointerCapture?.(event.pointerId);
});

renderer.domElement.addEventListener('pointercancel', () => {
  cameraState.isDragging = false;
});

renderer.domElement.addEventListener('pointermove', (event) => {
  if (!cameraState.isDragging) return;

  const dx = event.clientX - cameraState.lastClientX;
  const dy = event.clientY - cameraState.lastClientY;
  cameraState.lastClientX = event.clientX;
  cameraState.lastClientY = event.clientY;

  cameraState.theta -= dx * CONFIG.cameraRotateSpeed;
  cameraState.phi += dy * CONFIG.cameraRotateSpeed;
  cameraState.phi = THREE.MathUtils.clamp(cameraState.phi, 0.45, 1.35);
});

function getExpDampAlpha(delta, speed) {
  return 1 - Math.exp(-speed * delta);
}

function updateCamera(delta) {
  cameraTarget.set(playerX, playerY + CONFIG.cameraTargetHeight, playerZ);

  const spherical = new THREE.Spherical(cameraState.distance, cameraState.phi, cameraState.theta);
  cameraOffset.setFromSpherical(spherical);

  cameraPosition.copy(cameraTarget).add(cameraOffset);
  cameraPosition.y = Math.max(cameraPosition.y, CONFIG.cameraMinY);

  camera.position.lerp(cameraPosition, getExpDampAlpha(delta, CONFIG.cameraFollowSpeed));
  camera.lookAt(cameraTarget);
}

function updatePlayerFacing(move, delta) {
  if (move.x === 0 && move.z === 0) return;

  const targetAngle = Math.atan2(move.x, move.z);
  playerTargetEuler.set(0, targetAngle, 0);
  playerTargetQuaternion.setFromEuler(playerTargetEuler);
  player.quaternion.slerp(playerTargetQuaternion, getExpDampAlpha(delta, CONFIG.playerTurnSpeed));
}

function updateMovingPlatforms(delta) {
  for (const platform of movingPlatforms) {
    const axis = platform.moveAxis || 'z';
    const offset = Math.sin(elapsed * platform.moveSpeed) * platform.moveAmplitude;
    
    if (axis === 'z') {
      platform.position.z = platform.basePosition.z + offset;
    } else if (axis === 'x') {
      platform.position.x = platform.basePosition.x + offset;
    }
  }
}

function updateSpinningPlatforms(delta) {
  for (const platform of spinningPlatforms) {
    platform.rotation.y += delta * platform.spinSpeed;
  }
}

function animateGoomba(goomba, time, isMoving) {
  const baseY = goomba.baseY ?? goomba.position.y;
  goomba.position.y = baseY + Math.sin(time * 3) * 2;

  const leftFoot = goomba.getObjectByName('leftFoot');
  const rightFoot = goomba.getObjectByName('rightFoot');

  if (isMoving) {
    if (leftFoot) leftFoot.position.y = 3 + Math.sin(time * 10) * 3;
    if (rightFoot) rightFoot.position.y = 3 + Math.cos(time * 10) * 3;

    const squash = 1 + Math.sin(time * 8) * 0.1;
    goomba.scale.set(squash, 1 / squash, squash);
    return;
  }

  if (leftFoot) leftFoot.position.y = 3;
  if (rightFoot) rightFoot.position.y = 3;
  goomba.scale.set(1, 1, 1);
}

function updateHazards() {
  for (const hazard of hazards) {
    let isMoving = false;
    if (hazard.isPatrolling && hazard.basePosition) {
      const offset = getPatrolOffset(elapsed, hazard.patrolSpeed, hazard.patrolDistance);
      hazard.position.x = hazard.basePosition.x + offset;
      isMoving = true;
    }

    animateGoomba(hazard, elapsed, isMoving);
  }
}

function updateBackgroundClouds() {
  for (const cloud of backgroundClouds) {
    cloud.position.x -= cloud.parallaxSpeed;
    if (cloud.position.x < -500) {
      cloud.position.x = 5000;
    }
  }
}

function rotateCoins(delta) {
  for (const coin of coins) {
    coin.mesh.rotation.z += delta * 2;
  }
}

// Main update loop
function update() {
  if (isDead || isWin) return;

  const delta = clock.getDelta();
  elapsed += delta;
  
  updateMovingPlatforms(delta);
  updateSpinningPlatforms(delta);
  updateHazards();
  updateBackgroundClouds();
  rotateCoins(delta);

  // Horizontal movement
  camera.getWorldDirection(cameraForward);
  cameraForward.y = 0;
  cameraForward.normalize();

  const move = getCameraRelativeMoveVector(
    keys,
    CONFIG.moveSpeed,
    { x: cameraForward.x, z: cameraForward.z }
  );
  playerX += move.x;
  playerZ += move.z;

  // Clamp X/Z position
  playerX = Math.max(CONFIG.worldMinX + 20, Math.min(CONFIG.worldMaxX - 20, playerX));
  playerZ = Math.max(CONFIG.worldMinZ + 20, Math.min(CONFIG.worldMaxZ - 20, playerZ));

  // Jump
  if (keys.jump && isGrounded) {
    velocityY = CONFIG.jumpVelocity;
    isGrounded = false;
  }

  // Apply gravity
  velocityY += CONFIG.gravity;
  playerY += velocityY;

  let playerBox = getAabbFromCenter(
    { x: playerX, y: playerY, z: playerZ },
    { width: CONFIG.playerWidth, height: CONFIG.playerHeight, depth: CONFIG.playerDepth }
  );

  let landed = false;
  isRidingMovingPlatform = false;

  // Platform collision
  for (const platformEntry of platforms) {
    const platform = platformEntry.mesh;
    let platformBox;
    
    if (platform.isGroup || platform.type === 'Group') {
      platformBox = getGroupAabb(platform);
    } else {
      platformBox = getBoxAabb(platform);
    }
    
    if (isLandingOnTop(playerBox, platformBox, velocityY, CONFIG.landingTolerance)) {
      playerY = platformBox.max.y + CONFIG.playerHeight / 2;
      velocityY = 0;
      landed = true;
      
      if (platformEntry.type === 'moving') {
        isRidingMovingPlatform = true;
      }
      break;
    }
  }

  isGrounded = landed;

  // Face movement direction
  updatePlayerFacing(move, delta);

  playerBox = getAabbFromCenter(
    { x: playerX, y: playerY, z: playerZ },
    { width: CONFIG.playerWidth, height: CONFIG.playerHeight, depth: CONFIG.playerDepth }
  );

  // Checkpoint collision
  const nextCheckpoint = updateCheckpoint(activeCheckpoint, playerBox, checkpointBoxes);
  if (nextCheckpoint?.checkpoint && nextCheckpoint.checkpoint.id !== activeCheckpoint?.id) {
    activeCheckpoint = nextCheckpoint.checkpoint;
    updateCheckpointLabel();
    updateCheckpointColors();
  }

  // Hazard collision
  for (const hazard of hazards) {
    const hazardBox = getBoxAabb(hazard);
    if (isAabbOverlap(playerBox, hazardBox)) {
      isDead = true;
      deathMessage.style.display = 'block';
      setTimeout(resetPlayer, 1000);
      break;
    }
  }

  // Goal collision
  const goalBox = getBoxAabb(goal);
  if (isGoalReached(playerBox, goalBox)) {
    isWin = true;
    winMessage.style.display = 'block';
    setTimeout(() => resetPlayer({ resetCheckpoint: true }), 2000);
  }

  if (isDead || isWin) {
    updatePlayerPosition();
    updateCamera(delta);
    return;
  }

  // Coin collection
  const coinData = coins.map((coin) => ({ position: coin.position, radius: coin.radius }));
  const collectionResult = collectCoins(playerBox, coinData);
  if (collectionResult.collectedCount > 0) {
    const remainingKeys = new Set(
      collectionResult.remainingCoins.map((coin) => getCoinKey(coin.position))
    );
    const remainingCoins = [];
    for (const coin of coins) {
      if (remainingKeys.has(getCoinKey(coin.position))) {
        remainingCoins.push(coin);
      } else {
        scene.remove(coin.mesh);
      }
    }
    coins = remainingCoins;
    score += collectionResult.collectedCount;
    updateScore();
  }

  // Check death (fell below ground)
  if (playerY < -100) {
    isDead = true;
    deathMessage.style.display = 'block';
    setTimeout(resetPlayer, 1000);
  }

  updatePlayerPosition();
  updateCamera(delta);
}

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  update();
  composer.render();
}

animate();
