import * as THREE from 'three';
import { CONFIG } from './config.js';
import { scene, camera, composer } from './scene.js';
import { updateCamera, getCameraForward, isFirstPersonCamera } from './camera.js';
import { createPlayer, keys, updatePlayerFacing } from './player.js';
import { getBoxAabb, getGroupAabb, getCoinKey } from './helpers.js';
import { updateMovingPlatforms, updateSpinningPlatforms } from './platforms.js';
import { updateHazards } from './enemies.js';
import { animateQuestionBlock } from './scenery.js';
import {
  initLevel,
  platforms,
  movingPlatforms,
  spinningPlatforms,
  hazards,
  questionBlocks,
  checkpoints,
  checkpointBoxes,
  coinLayout,
  backgroundClouds,
  updateBackgroundClouds,
  goal,
} from './level.js';
import {
  collectCoins,
  getAabbFromCenter,
  getCameraRelativeMoveVector,
  isAabbOverlap,
  isGoalReached,
  isLandingOnTop,
  updateCheckpoint,
} from './game/logic.js';

// Initialize level
initLevel();

// Create player
const player = createPlayer();
scene.add(player);

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

// Coins
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

function updatePlayerPosition() {
  player.position.set(playerX, playerY, playerZ);
}

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

// Initialize UI
updateScore();
updateCheckpointLabel();
updateCheckpointColors();
updatePlayerPosition();

// Game loop
const clock = new THREE.Clock();
let elapsed = 0;

function rotateCoins(delta) {
  for (const coin of coins) {
    coin.mesh.rotation.z += delta * 2;
  }
}

function update() {
  if (isDead || isWin) return;

  const delta = clock.getDelta();
  elapsed += delta;

  player.visible = !isFirstPersonCamera();
  
  // Update world
  updateMovingPlatforms(movingPlatforms, elapsed);
  updateSpinningPlatforms(spinningPlatforms, delta);
  updateHazards(hazards, elapsed);
  updateBackgroundClouds();
  rotateCoins(delta);
  for (const block of questionBlocks) {
    animateQuestionBlock(block, elapsed);
  }

  // Camera-relative movement
  const cameraForward = getCameraForward();
  const move = getCameraRelativeMoveVector(keys, CONFIG.moveSpeed, cameraForward);
  playerX += move.x;
  playerZ += move.z;

  // Clamp position
  playerX = Math.max(CONFIG.worldMinX + 20, Math.min(CONFIG.worldMaxX - 20, playerX));
  playerZ = Math.max(CONFIG.worldMinZ + 20, Math.min(CONFIG.worldMaxZ - 20, playerZ));

  // Jump
  if (keys.jump && isGrounded) {
    velocityY = CONFIG.jumpVelocity;
    isGrounded = false;
  }

  // Gravity
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
    const platformBox = platform.isGroup || platform.type === 'Group'
      ? getGroupAabb(platform)
      : getBoxAabb(platform);
    
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
  updatePlayerFacing(player, move, delta);

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
    updateCamera(playerX, playerY, playerZ, delta);
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

  // Fall death
  if (playerY < -100) {
    isDead = true;
    deathMessage.style.display = 'block';
    setTimeout(resetPlayer, 1000);
  }

  updatePlayerPosition();
  updateCamera(playerX, playerY, playerZ, delta);
}

function animate() {
  requestAnimationFrame(animate);
  update();
  composer.render();
}

animate();
