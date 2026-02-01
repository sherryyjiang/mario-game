import * as THREE from 'three';
import {
  collectCoins,
  getAabbFromCenter,
  getMoveVector,
  getPatrolOffset,
  isAabbOverlap,
  isGoalReached,
  isLandingOnTop,
  updateCheckpoint,
  updateTimedPlatformState,
} from './game/logic.js';

// Configuration
const CONFIG = {
  viewWidth: 800,
  viewHeight: 400,
  viewCenterX: 400,
  viewCenterY: 200,
  worldDepth: 500,
  groundTopY: 50,
  groundDepth: 420,
  playerWidth: 30,
  playerHeight: 40,
  playerDepth: 30,
  playerStartX: 80,
  playerStartZ: 80,
  gapStartX: 350,
  gapEndX: 470,
  platformCenterX: 330,
  platformZ: -40,
  platformY: 230,
  platformWidth: 120,
  platformHeight: 15,
  platformDepth: 90,
  timedPlatformCenterX: 420,
  timedPlatformCenterZ: 150,
  timedPlatformY: 150,
  timedPlatformWidth: 90,
  timedPlatformHeight: 12,
  timedPlatformDepth: 90,
  timedPlatformDropDelay: 0.6,
  timedPlatformRespawnDelay: 2.5,
  movingPlatformCenterX: 560,
  movingPlatformZ: 120,
  movingPlatformY: 180,
  movingPlatformWidth: 110,
  movingPlatformHeight: 15,
  movingPlatformDepth: 90,
  movingPlatformAmplitude: 120,
  movingPlatformSpeed: 1.2,
  hazardCenterX: 220,
  hazardCenterZ: -110,
  hazardY: 60,
  hazardWidth: 90,
  hazardHeight: 20,
  hazardDepth: 90,
  patrolHazardCenterX: 520,
  patrolHazardCenterZ: -150,
  patrolHazardY: 60,
  patrolHazardWidth: 70,
  patrolHazardHeight: 25,
  patrolHazardDepth: 70,
  patrolHazardDistance: 90,
  patrolHazardSpeed: 1.4,
  jumpPadCenterX: 650,
  jumpPadCenterZ: -120,
  jumpPadY: 56,
  jumpPadWidth: 80,
  jumpPadHeight: 12,
  jumpPadDepth: 80,
  jumpPadBoost: 18,
  checkpointPoleWidth: 12,
  checkpointPoleHeight: 70,
  checkpointPoleDepth: 12,
  checkpointFlagWidth: 28,
  checkpointFlagHeight: 18,
  checkpointFlagDepth: 8,
  checkpointStartX: 100,
  checkpointStartZ: 80,
  checkpointMidX: 520,
  checkpointMidZ: -40,
  goalCenterX: 750,
  goalCenterZ: 30,
  goalY: 120,
  goalWidth: 30,
  goalHeight: 90,
  goalDepth: 30,
  moveSpeed: 5,
  gravity: -0.5,
  jumpVelocity: 12,
  landingTolerance: 6,
  minX: 15,
  maxX: 785,
  minZ: -200,
  maxZ: 200,
  cameraOffsetX: 0,
  cameraOffsetY: 180,
  cameraOffsetZ: 280,
  cameraTargetHeight: 60,
  cameraLerp: 0.1,
  backgroundColor: 0x87ceeb,
  groundColor: 0x8b4513,
  playerColor: 0xff0000,
  platformColor: 0x228b22,
  timedPlatformColor: 0x3cb371,
  movingPlatformColor: 0x2e8b57,
  hazardColor: 0xff6a00,
  patrolHazardColor: 0xff3b3b,
  jumpPadColor: 0x1e90ff,
  checkpointColor: 0xffffff,
  checkpointActiveColor: 0x7fff00,
  checkpointFlagColor: 0xffd1dc,
  goalColor: 0xff69b4,
  coinColor: 0xffd700,
};

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(CONFIG.backgroundColor);

// Camera - third person follow
const aspect = CONFIG.viewWidth / CONFIG.viewHeight;
const camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 2500);
camera.position.set(CONFIG.viewCenterX, CONFIG.viewCenterY + 180, CONFIG.cameraOffsetZ);
camera.lookAt(CONFIG.viewCenterX, CONFIG.viewCenterY, 0);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(CONFIG.viewWidth, CONFIG.viewHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.9);
directionalLight.position.set(300, 500, 400);
scene.add(directionalLight);

// Helpers
function createBox({ width, height, depth, color }) {
  return new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    new THREE.MeshStandardMaterial({ color })
  );
}

function createCheckpoint({ poleColor, flagColor }) {
  const group = new THREE.Group();
  const pole = createBox({
    width: CONFIG.checkpointPoleWidth,
    height: CONFIG.checkpointPoleHeight,
    depth: CONFIG.checkpointPoleDepth,
    color: poleColor,
  });
  pole.position.set(0, CONFIG.checkpointPoleHeight / 2, 0);
  group.add(pole);

  const flag = createBox({
    width: CONFIG.checkpointFlagWidth,
    height: CONFIG.checkpointFlagHeight,
    depth: CONFIG.checkpointFlagDepth,
    color: flagColor,
  });
  flag.position.set(CONFIG.checkpointFlagWidth / 2 + 6, CONFIG.checkpointPoleHeight - 10, 0);
  group.add(flag);

  return { group, pole, flag };
}

function getBoxAabb(box) {
  return getAabbFromCenter(
    { x: box.position.x, y: box.position.y, z: box.position.z },
    { width: box.size.width, height: box.size.height, depth: box.size.depth }
  );
}

function getCoinKey(position) {
  return `${position.x}|${position.y}|${position.z}`;
}

// Ground segments
const groundLeft = createBox({
  width: CONFIG.gapStartX,
  height: CONFIG.groundTopY,
  depth: CONFIG.groundDepth,
  color: CONFIG.groundColor,
});
groundLeft.position.set(CONFIG.gapStartX / 2, CONFIG.groundTopY / 2, 0);
groundLeft.size = { width: CONFIG.gapStartX, height: CONFIG.groundTopY, depth: CONFIG.groundDepth };
scene.add(groundLeft);

const groundRightWidth = CONFIG.viewWidth - CONFIG.gapEndX;
const groundRight = createBox({
  width: groundRightWidth,
  height: CONFIG.groundTopY,
  depth: CONFIG.groundDepth,
  color: CONFIG.groundColor,
});
groundRight.position.set(CONFIG.gapEndX + groundRightWidth / 2, CONFIG.groundTopY / 2, 0);
groundRight.size = { width: groundRightWidth, height: CONFIG.groundTopY, depth: CONFIG.groundDepth };
scene.add(groundRight);

// Static platform
const platform = createBox({
  width: CONFIG.platformWidth,
  height: CONFIG.platformHeight,
  depth: CONFIG.platformDepth,
  color: CONFIG.platformColor,
});
platform.position.set(CONFIG.platformCenterX, CONFIG.platformY, CONFIG.platformZ);
platform.size = { width: CONFIG.platformWidth, height: CONFIG.platformHeight, depth: CONFIG.platformDepth };
scene.add(platform);

// Timed disappearing platform
const timedPlatform = createBox({
  width: CONFIG.timedPlatformWidth,
  height: CONFIG.timedPlatformHeight,
  depth: CONFIG.timedPlatformDepth,
  color: CONFIG.timedPlatformColor,
});
timedPlatform.position.set(CONFIG.timedPlatformCenterX, CONFIG.timedPlatformY, CONFIG.timedPlatformCenterZ);
timedPlatform.size = {
  width: CONFIG.timedPlatformWidth,
  height: CONFIG.timedPlatformHeight,
  depth: CONFIG.timedPlatformDepth,
};
scene.add(timedPlatform);

// Moving platform
const movingPlatform = createBox({
  width: CONFIG.movingPlatformWidth,
  height: CONFIG.movingPlatformHeight,
  depth: CONFIG.movingPlatformDepth,
  color: CONFIG.movingPlatformColor,
});
movingPlatform.basePosition = new THREE.Vector3(
  CONFIG.movingPlatformCenterX,
  CONFIG.movingPlatformY,
  CONFIG.movingPlatformZ
);
movingPlatform.position.copy(movingPlatform.basePosition);
movingPlatform.size = {
  width: CONFIG.movingPlatformWidth,
  height: CONFIG.movingPlatformHeight,
  depth: CONFIG.movingPlatformDepth,
};
scene.add(movingPlatform);

// Hazard
const hazard = createBox({
  width: CONFIG.hazardWidth,
  height: CONFIG.hazardHeight,
  depth: CONFIG.hazardDepth,
  color: CONFIG.hazardColor,
});
hazard.position.set(CONFIG.hazardCenterX, CONFIG.hazardY, CONFIG.hazardCenterZ);
hazard.size = { width: CONFIG.hazardWidth, height: CONFIG.hazardHeight, depth: CONFIG.hazardDepth };
scene.add(hazard);

// Patrolling hazard
const patrolHazard = createBox({
  width: CONFIG.patrolHazardWidth,
  height: CONFIG.patrolHazardHeight,
  depth: CONFIG.patrolHazardDepth,
  color: CONFIG.patrolHazardColor,
});
patrolHazard.basePosition = new THREE.Vector3(
  CONFIG.patrolHazardCenterX,
  CONFIG.patrolHazardY,
  CONFIG.patrolHazardCenterZ
);
patrolHazard.position.copy(patrolHazard.basePosition);
patrolHazard.size = {
  width: CONFIG.patrolHazardWidth,
  height: CONFIG.patrolHazardHeight,
  depth: CONFIG.patrolHazardDepth,
};
scene.add(patrolHazard);

// Jump pad
const jumpPad = createBox({
  width: CONFIG.jumpPadWidth,
  height: CONFIG.jumpPadHeight,
  depth: CONFIG.jumpPadDepth,
  color: CONFIG.jumpPadColor,
});
jumpPad.position.set(CONFIG.jumpPadCenterX, CONFIG.jumpPadY, CONFIG.jumpPadCenterZ);
jumpPad.size = { width: CONFIG.jumpPadWidth, height: CONFIG.jumpPadHeight, depth: CONFIG.jumpPadDepth };
scene.add(jumpPad);

// Checkpoints
const checkpointData = [
  { id: 'start', position: { x: CONFIG.checkpointStartX, y: CONFIG.groundTopY, z: CONFIG.checkpointStartZ } },
  { id: 'mid', position: { x: CONFIG.checkpointMidX, y: CONFIG.groundTopY, z: CONFIG.checkpointMidZ } },
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
      width: CONFIG.checkpointPoleWidth + 24,
      height: CONFIG.checkpointPoleHeight,
      depth: CONFIG.checkpointPoleDepth + 24,
    },
  };
});

const checkpointBoxes = checkpoints.map((checkpoint) => ({
  id: checkpoint.id,
  position: checkpoint.position,
  checkpoint,
  box: getAabbFromCenter(checkpoint.position, checkpoint.collisionSize),
}));

// Goal flag
const goal = createBox({
  width: CONFIG.goalWidth,
  height: CONFIG.goalHeight,
  depth: CONFIG.goalDepth,
  color: CONFIG.goalColor,
});
goal.position.set(CONFIG.goalCenterX, CONFIG.goalY, CONFIG.goalCenterZ);
goal.size = { width: CONFIG.goalWidth, height: CONFIG.goalHeight, depth: CONFIG.goalDepth };
scene.add(goal);

// Player (red box)
const player = createBox({
  width: CONFIG.playerWidth,
  height: CONFIG.playerHeight,
  depth: CONFIG.playerDepth,
  color: CONFIG.playerColor,
});

// Player state
let playerX = CONFIG.playerStartX;
let playerY = CONFIG.groundTopY + CONFIG.playerHeight / 2;
let playerZ = CONFIG.playerStartZ;
let velocityY = 0;
let isGrounded = true;
let isDead = false;
let isRidingMovingPlatform = false;
let isWin = false;
let score = 0;
let timedPlatformState = { isActive: true, timer: 0, respawnTimer: 0 };
let activeCheckpoint = checkpoints[0];

// Update player mesh position
function updatePlayerPosition() {
  player.position.set(playerX, playerY, playerZ);
}
updatePlayerPosition();
scene.add(player);

// Death message element
const deathMessage = document.getElementById('death-message');
const winMessage = document.getElementById('win-message');
const scoreLabel = document.getElementById('score');
const checkpointLabel = document.getElementById('checkpoint');

function updateScore() {
  scoreLabel.textContent = `Coins: ${score}`;
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

// Event listeners
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

const coinLayout = [
  { position: { x: 140, y: 90, z: 60 }, radius: 20 },
  { position: { x: 280, y: 90, z: -30 }, radius: 20 },
  { position: { x: 400, y: 260, z: -40 }, radius: 20 },
  { position: { x: 520, y: 200, z: 120 }, radius: 20 },
  { position: { x: 620, y: 90, z: -110 }, radius: 20 },
  { position: { x: 720, y: 90, z: 40 }, radius: 20 },
];

let coins = [];

function createCoinMesh() {
  const geometry = new THREE.TorusGeometry(10, 4, 12, 18);
  const material = new THREE.MeshStandardMaterial({ color: CONFIG.coinColor });
  return new THREE.Mesh(geometry, material);
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
  playerY = CONFIG.groundTopY + CONFIG.playerHeight / 2;
  playerZ = respawnPoint.z;
  velocityY = 0;
  isGrounded = true;
  isDead = false;
  isWin = false;
  isRidingMovingPlatform = false;
  timedPlatformState = { isActive: true, timer: 0, respawnTimer: 0 };
  timedPlatform.visible = true;
  score = 0;
  updateScore();
  updateCheckpointLabel();
  updateCheckpointColors();
  spawnCoins();
  deathMessage.style.display = 'none';
  winMessage.style.display = 'none';
  updatePlayerPosition();
}

const clock = new THREE.Clock();
const cameraTarget = new THREE.Vector3();
const cameraPosition = new THREE.Vector3();
const movingPlatformPrevious = new THREE.Vector3().copy(movingPlatform.position);
let elapsed = 0;

function updateCamera() {
  cameraTarget.set(playerX, playerY + CONFIG.cameraTargetHeight, playerZ);
  cameraPosition.set(
    playerX + CONFIG.cameraOffsetX,
    playerY + CONFIG.cameraOffsetY,
    playerZ + CONFIG.cameraOffsetZ
  );
  camera.position.lerp(cameraPosition, CONFIG.cameraLerp);
  camera.lookAt(cameraTarget);
}

function updateMovingPlatform(delta) {
  elapsed += delta;
  const offset = Math.sin(elapsed * CONFIG.movingPlatformSpeed) * CONFIG.movingPlatformAmplitude;
  movingPlatform.position.set(
    movingPlatform.basePosition.x,
    movingPlatform.basePosition.y,
    movingPlatform.basePosition.z + offset
  );

  const deltaPosition = new THREE.Vector3().subVectors(movingPlatform.position, movingPlatformPrevious);
  movingPlatformPrevious.copy(movingPlatform.position);
  return deltaPosition;
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
  const platformDelta = updateMovingPlatform(delta);
  rotateCoins(delta);
  const patrolOffset = getPatrolOffset(elapsed, CONFIG.patrolHazardSpeed, CONFIG.patrolHazardDistance);
  patrolHazard.position.set(
    patrolHazard.basePosition.x + patrolOffset,
    patrolHazard.basePosition.y,
    patrolHazard.basePosition.z
  );

  // Horizontal movement
  const move = getMoveVector(keys, CONFIG.moveSpeed);
  playerX += move.x;
  playerZ += move.z;

  // Clamp X/Z position
  playerX = Math.max(CONFIG.minX, Math.min(CONFIG.maxX, playerX));
  playerZ = Math.max(CONFIG.minZ, Math.min(CONFIG.maxZ, playerZ));

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

  const groundLeftBox = getBoxAabb(groundLeft);
  const groundRightBox = getBoxAabb(groundRight);
  const platformBox = getBoxAabb(platform);
  const timedPlatformBox = getBoxAabb(timedPlatform);
  const movingPlatformBox = getBoxAabb(movingPlatform);
  const hazardBox = getBoxAabb(hazard);
  const patrolHazardBox = getBoxAabb(patrolHazard);
  const jumpPadBox = getBoxAabb(jumpPad);
  const goalBox = getBoxAabb(goal);

  let landed = false;
  isRidingMovingPlatform = false;
  let isOnTimedPlatform = false;

  // Ground collision
  if (isLandingOnTop(playerBox, groundLeftBox, velocityY, CONFIG.landingTolerance)) {
    playerY = groundLeftBox.max.y + CONFIG.playerHeight / 2;
    velocityY = 0;
    landed = true;
  } else if (isLandingOnTop(playerBox, groundRightBox, velocityY, CONFIG.landingTolerance)) {
    playerY = groundRightBox.max.y + CONFIG.playerHeight / 2;
    velocityY = 0;
    landed = true;
  } else if (isLandingOnTop(playerBox, platformBox, velocityY, CONFIG.landingTolerance)) {
    playerY = platformBox.max.y + CONFIG.playerHeight / 2;
    velocityY = 0;
    landed = true;
  } else if (isLandingOnTop(playerBox, movingPlatformBox, velocityY, CONFIG.landingTolerance)) {
    playerY = movingPlatformBox.max.y + CONFIG.playerHeight / 2;
    velocityY = 0;
    landed = true;
    isRidingMovingPlatform = true;
  } else if (
    timedPlatformState.isActive &&
    isLandingOnTop(playerBox, timedPlatformBox, velocityY, CONFIG.landingTolerance)
  ) {
    playerY = timedPlatformBox.max.y + CONFIG.playerHeight / 2;
    velocityY = 0;
    landed = true;
    isOnTimedPlatform = true;
  } else if (isLandingOnTop(playerBox, jumpPadBox, velocityY, CONFIG.landingTolerance)) {
    playerY = jumpPadBox.max.y + CONFIG.playerHeight / 2;
    velocityY = CONFIG.jumpPadBoost;
    landed = false;
  }

  timedPlatformState = updateTimedPlatformState(
    timedPlatformState,
    isOnTimedPlatform,
    delta,
    { dropDelay: CONFIG.timedPlatformDropDelay, respawnDelay: CONFIG.timedPlatformRespawnDelay }
  );
  timedPlatform.visible = timedPlatformState.isActive;

  if (isOnTimedPlatform && !timedPlatformState.isActive) {
    landed = false;
  }

  isGrounded = landed;

  if (isRidingMovingPlatform) {
    playerX += platformDelta.x;
    playerZ += platformDelta.z;
  }

  // Face movement direction for N64 feel
  if (move.x !== 0 || move.z !== 0) {
    player.rotation.y = Math.atan2(move.x, move.z);
  }

  playerBox = getAabbFromCenter(
    { x: playerX, y: playerY, z: playerZ },
    { width: CONFIG.playerWidth, height: CONFIG.playerHeight, depth: CONFIG.playerDepth }
  );

  const nextCheckpoint = updateCheckpoint(activeCheckpoint, playerBox, checkpointBoxes);
  if (nextCheckpoint?.checkpoint && nextCheckpoint.checkpoint.id !== activeCheckpoint?.id) {
    activeCheckpoint = nextCheckpoint.checkpoint;
    updateCheckpointLabel();
    updateCheckpointColors();
  }

  // Hazard collision
  if (isAabbOverlap(playerBox, hazardBox) || isAabbOverlap(playerBox, patrolHazardBox)) {
    isDead = true;
    deathMessage.style.display = 'block';
    setTimeout(resetPlayer, 1000);
  }

  // Goal collision
  if (isGoalReached(playerBox, goalBox)) {
    isWin = true;
    winMessage.style.display = 'block';
    setTimeout(() => resetPlayer({ resetCheckpoint: true }), 1500);
  }

  if (isDead || isWin) {
    updatePlayerPosition();
    updateCamera();
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

  // Check death (fell below y=0)
  if (playerY < 0) {
    isDead = true;
    deathMessage.style.display = 'block';
    setTimeout(resetPlayer, 1000);
  }

  updatePlayerPosition();
  updateCamera();
}

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  update();
  renderer.render(scene, camera);
}

animate();
