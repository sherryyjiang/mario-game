import * as THREE from 'three';
import { CONFIG } from './config.js';
import { scene, camera, composer } from './scene.js';
import { updateCamera, getCameraForward, isFirstPersonCamera } from './camera.js';
import { createPlayer, keys, updatePlayerFacing, updatePlayerSwimPose } from './player.js';
import { getBoxAabb, getGroupAabb, getCoinKey } from './helpers.js';
import { updateMovingPlatforms, updateSpinningPlatforms } from './platforms.js';
import { updateHazards, updateEelBoss } from './enemies.js';
import { animateQuestionBlock, createBubbleEmitter, advanceBubbleParticles } from './scenery.js';
import { loadLevel, getLevelList, getCurrentLevelKey } from './levelManager.js';
import {
  collectCoins,
  getAabbFromCenter,
  getCameraRelativeMoveVector,
  getSwimMoveVector,
  isAabbOverlap,
  isInWaterVolumes,
  isGoalReached,
  isGoalUnlocked,
  isQuestionBlockHitFromBelow,
  applyQuestionBlockHit,
  isLandingOnTop,
  updateSwimVelocityY,
  shouldTriggerFallDeath,
  updateCheckpoint,
} from './game/logic.js';

let currentLevel = loadLevel('sky');
let levelSettings = currentLevel.settings;

// Create player
const player = createPlayer();
scene.add(player);
const mouthBubbles = createBubbleEmitter({ radius: 2.6, height: 18, count: 6 });
mouthBubbles.position.set(0, 22, 12);
mouthBubbles.visible = false;
player.userData.bodyGroup?.add(mouthBubbles);

// Player state
let playerX = levelSettings.playerStart?.x ?? CONFIG.playerStartX;
let playerY = (levelSettings.groundTopY ?? CONFIG.groundTopY) + CONFIG.playerHeight / 2 + 20;
let playerZ = levelSettings.playerStart?.z ?? CONFIG.playerStartZ;
let velocityY = 0;
let isGrounded = true;
let isDead = false;
let isRidingMovingPlatform = false;
let isWin = false;
let score = 0;
let activeCheckpoint = null;

// Coins
let coins = [];
let rewardCoins = [];

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
  coins = currentLevel.coinLayout.map((entry) => {
    const mesh = createCoinMesh();
    mesh.position.set(entry.position.x, entry.position.y, entry.position.z);
    mesh.rotation.x = Math.PI / 2;
    scene.add(mesh);
    return { position: mesh.position, radius: entry.radius, mesh };
  });
}

spawnCoins();

function spawnRewardCoin(position) {
  const mesh = createCoinMesh();
  mesh.position.set(position.x, position.y + 24, position.z);
  mesh.rotation.x = Math.PI / 2;
  scene.add(mesh);
  rewardCoins.push({ mesh, velocityY: 1.2, life: 1.2 });
}

function updateRewardCoins(delta) {
  const remaining = [];
  for (const coin of rewardCoins) {
    coin.velocityY = Math.max(coin.velocityY - delta * 2, -0.4);
    coin.mesh.position.y += coin.velocityY;
    coin.mesh.rotation.z += delta * 6;
    coin.life -= delta;
    if (coin.life <= 0) {
      scene.remove(coin.mesh);
      continue;
    }
    remaining.push(coin);
  }
  rewardCoins = remaining;
}

// UI Elements
const deathMessage = document.getElementById('death-message');
const winMessage = document.getElementById('win-message');
const scoreLabel = document.getElementById('score');
const checkpointLabel = document.getElementById('checkpoint');
const goalStatus = document.getElementById('goal-status');
const levelPanel = document.getElementById('level-panel');

const levelButtons = new Map();

function renderLevelPanel() {
  if (!levelPanel) return;
  levelPanel.innerHTML = '';
  levelButtons.clear();
  const levels = getLevelList();
  for (const level of levels) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = level.name;
    button.dataset.level = level.id;
    button.addEventListener('click', () => switchLevel(level.id));
    levelPanel.appendChild(button);
    levelButtons.set(level.id, button);
  }
  highlightActiveLevel();
}

function highlightActiveLevel() {
  const active = getCurrentLevelKey();
  for (const [id, button] of levelButtons.entries()) {
    button.classList.toggle('active', id === active);
  }
}

function updateScore() {
  scoreLabel.textContent = `Coins: ${score}`;
  updateGoalStatus();
}

function updateCheckpointLabel() {
  checkpointLabel.textContent = `Checkpoint: ${activeCheckpoint?.id ?? 'none'}`;
}

function updateCheckpointColors() {
  for (const checkpoint of currentLevel.checkpoints) {
    const isActive = activeCheckpoint?.id === checkpoint.id;
    checkpoint.pole.material.color.setHex(isActive ? CONFIG.checkpointActiveColor : CONFIG.checkpointColor);
  }
}

function updateGoalStatus() {
  const requiredCoins = levelSettings.goalRequiredCoins ?? CONFIG.goalRequiredCoins;
  const unlocked = isGoalUnlocked(score, requiredCoins);
  if (currentLevel.goal?.material) {
    const activeColor = currentLevel.goal.userData?.activeColor ?? CONFIG.goalColor;
    const lockedColor = currentLevel.goal.userData?.lockedColor ?? 0x3b4c5a;
    currentLevel.goal.material.emissiveIntensity = unlocked ? 0.6 : 0.1;
    currentLevel.goal.material.color.setHex(unlocked ? activeColor : lockedColor);
  }
  if (goalStatus) {
    goalStatus.textContent = unlocked
      ? 'Goal: Unlocked'
      : `Goal: Locked (${score}/${requiredCoins})`;
  }
}

function updatePlayerPosition() {
  player.position.set(playerX, playerY, playerZ);
}

function getInitialCheckpoint() {
  const startId = levelSettings.startCheckpointId;
  if (startId === null) return null;
  if (startId) {
    return currentLevel.checkpoints.find((checkpoint) => checkpoint.id === startId) ?? null;
  }
  return currentLevel.checkpoints[0] ?? null;
}

function getSpawnPoint() {
  if (activeCheckpoint?.position) {
    return { ...activeCheckpoint.position };
  }
  return levelSettings.playerStart ?? { x: CONFIG.playerStartX, z: CONFIG.playerStartZ };
}

function setQuestionBlockUsed(block, used) {
  block.userData.used = used;
  if (block.userData.cube?.material) {
    block.userData.cube.material.color.setHex(used ? 0x8c6b2f : 0xffd700);
  }
  if (block.userData.mark?.material) {
    block.userData.mark.material.color.setHex(used ? 0x3b2d14 : 0xffffff);
  }
}

function resetQuestionBlocks() {
  for (const block of currentLevel.questionBlocks) {
    setQuestionBlockUsed(block, false);
    block.userData.hitOffset = 0;
    block.userData.hitTimer = 0;
  }
}

function updateQuestionBlockBounces(delta) {
  for (const block of currentLevel.questionBlocks) {
    if (!block.userData.hitTimer) continue;
    block.userData.hitTimer = Math.max(0, block.userData.hitTimer - delta);
    const duration = block.userData.hitDuration || 0.25;
    const t = 1 - block.userData.hitTimer / duration;
    block.userData.hitOffset = Math.sin(t * Math.PI) * CONFIG.questionBlockBounceHeight;
    if (block.userData.hitTimer === 0) {
      block.userData.hitOffset = 0;
    }
  }
}

function resetPlayer({ resetCheckpoint = false, resetCoins = false } = {}) {
  if (resetCheckpoint) {
    activeCheckpoint = getInitialCheckpoint();
  }

  const respawnPoint = getSpawnPoint();

  playerX = respawnPoint.x;
  playerY =
    (respawnPoint.y ?? levelSettings.groundTopY ?? CONFIG.groundTopY) +
    CONFIG.playerHeight / 2 +
    20;
  playerZ = respawnPoint.z;
  velocityY = 0;
  isGrounded = true;
  isDead = false;
  isWin = false;
  isRidingMovingPlatform = false;
  
  if (resetCheckpoint || resetCoins) {
    score = 0;
    spawnCoins();
    resetQuestionBlocks();
  }

  for (const reward of rewardCoins) {
    scene.remove(reward.mesh);
  }
  rewardCoins = [];
  
  updateScore();
  updateCheckpointLabel();
  updateCheckpointColors();
  deathMessage.style.display = 'none';
  winMessage.style.display = 'none';
  updatePlayerPosition();
}

function switchLevel(levelId) {
  currentLevel = loadLevel(levelId);
  levelSettings = currentLevel.settings;
  activeCheckpoint = getInitialCheckpoint();
  resetPlayer({ resetCheckpoint: true, resetCoins: true });
  updateCheckpointLabel();
  updateCheckpointColors();
  updateGoalStatus();
  highlightActiveLevel();
}

// Initialize UI
activeCheckpoint = getInitialCheckpoint();
updateScore();
updateCheckpointLabel();
updateCheckpointColors();
updatePlayerPosition();
renderLevelPanel();

// Game loop
const clock = new THREE.Clock();
let elapsed = 0;
const cameraForward3D = new THREE.Vector3();

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
  updateMovingPlatforms(currentLevel.movingPlatforms, elapsed);
  updateSpinningPlatforms(currentLevel.spinningPlatforms, delta);
  updateHazards(currentLevel.hazards, elapsed);
  if (currentLevel.eelBoss) {
    updateEelBoss(
      currentLevel.eelBoss,
      elapsed,
      delta,
      { x: playerX, y: playerY, z: playerZ },
      {
        min: {
          x: levelSettings.worldMinX,
          y: levelSettings.worldMinY,
          z: levelSettings.worldMinZ,
        },
        max: {
          x: levelSettings.worldMaxX,
          y: levelSettings.worldMaxY,
          z: levelSettings.worldMaxZ,
        },
      }
    );
  }
  if (currentLevel.updateEnvironment) {
    currentLevel.updateEnvironment(elapsed, delta);
  }
  updateQuestionBlockBounces(delta);
  updateRewardCoins(delta);
  rotateCoins(delta);
  for (const block of currentLevel.questionBlocks) {
    animateQuestionBlock(block, elapsed);
  }

  // Camera-relative movement
  const cameraForward = getCameraForward();
  const isUnderwater = isInWaterVolumes(
    { x: playerX, y: playerY, z: playerZ },
    levelSettings.waterVolumes ?? []
  );
  mouthBubbles.visible = isUnderwater;
  if (isUnderwater) {
    advanceBubbleParticles(mouthBubbles, delta);
  }
  camera.getWorldDirection(cameraForward3D);
  if (isUnderwater) {
    cameraForward3D.y *= 0.6;
    cameraForward3D.normalize();
  }
  const move = isUnderwater
    ? getSwimMoveVector(keys, CONFIG.swimMoveSpeed, cameraForward3D)
    : getCameraRelativeMoveVector(keys, CONFIG.moveSpeed, cameraForward);
  playerX += move.x;
  playerZ += move.z;
  if (isUnderwater) {
    playerY += move.y;
  }

  // Clamp position
  playerX = Math.max(
    levelSettings.worldMinX + 20,
    Math.min(levelSettings.worldMaxX - 20, playerX)
  );
  playerZ = Math.max(
    levelSettings.worldMinZ + 20,
    Math.min(levelSettings.worldMaxZ - 20, playerZ)
  );

  if (isUnderwater) {
    velocityY = updateSwimVelocityY(
      velocityY,
      { ascend: keys.jump, descend: keys.dive },
      CONFIG
    );
  } else {
    // Jump
    if (keys.jump && isGrounded) {
      velocityY = CONFIG.jumpVelocity;
      isGrounded = false;
    }

    // Gravity
    velocityY += CONFIG.gravity;
  }
  playerY += velocityY;

  let playerBox = getAabbFromCenter(
    { x: playerX, y: playerY, z: playerZ },
    { width: CONFIG.playerWidth, height: CONFIG.playerHeight, depth: CONFIG.playerDepth }
  );

  for (const block of currentLevel.questionBlocks) {
    const blockBox = getGroupAabb(block);
    const hit = isQuestionBlockHitFromBelow(
      playerBox,
      blockBox,
      velocityY,
      CONFIG.questionBlockHitTolerance
    );
    const result = applyQuestionBlockHit(
      { used: block.userData.used },
      hit,
      CONFIG.questionBlockRewardCoins
    );
    if (result.reward > 0) {
      setQuestionBlockUsed(block, true);
      block.userData.hitTimer = 0.25;
      block.userData.hitDuration = 0.25;
      spawnRewardCoin(block.position);
      score += result.reward;
      updateScore();
    }
  }

  let landed = false;
  isRidingMovingPlatform = false;

  // Platform collision
  for (const platformEntry of currentLevel.platforms) {
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

  isGrounded = landed && !isUnderwater;

  const fallCheckY = playerY;
  playerY = Math.max(
    levelSettings.worldMinY + CONFIG.playerHeight / 2,
    Math.min(levelSettings.worldMaxY - CONFIG.playerHeight / 2, playerY)
  );

  // Face movement direction
  updatePlayerFacing(player, { x: move.x, z: move.z }, delta);
  updatePlayerSwimPose(player, { x: move.x, z: move.z }, velocityY, delta, elapsed, isUnderwater);

  playerBox = getAabbFromCenter(
    { x: playerX, y: playerY, z: playerZ },
    { width: CONFIG.playerWidth, height: CONFIG.playerHeight, depth: CONFIG.playerDepth }
  );

  // Checkpoint collision
  const nextCheckpoint = updateCheckpoint(activeCheckpoint, playerBox, currentLevel.checkpointBoxes);
  if (nextCheckpoint?.checkpoint && nextCheckpoint.checkpoint.id !== activeCheckpoint?.id) {
    activeCheckpoint = nextCheckpoint.checkpoint;
    updateCheckpointLabel();
    updateCheckpointColors();
  }

  // Hazard collision
  for (const hazard of currentLevel.hazards) {
    const hazardBox = getBoxAabb(hazard);
    if (isAabbOverlap(playerBox, hazardBox)) {
      isDead = true;
      deathMessage.style.display = 'block';
      setTimeout(resetPlayer, 1000);
      break;
    }
  }

  if (!isDead && currentLevel.eelBoss) {
    const eelBox = getGroupAabb(currentLevel.eelBoss);
    if (isAabbOverlap(playerBox, eelBox)) {
      isDead = true;
      deathMessage.style.display = 'block';
      setTimeout(resetPlayer, 1200);
    }
  }

  // Goal collision
  const goalBox = getBoxAabb(currentLevel.goal);
  const goalUnlocked = isGoalUnlocked(score, levelSettings.goalRequiredCoins ?? CONFIG.goalRequiredCoins);
  if (goalUnlocked && isGoalReached(playerBox, goalBox)) {
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
  if (shouldTriggerFallDeath(fallCheckY, levelSettings, CONFIG)) {
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
