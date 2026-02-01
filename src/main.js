import * as THREE from 'three';

// Configuration
const CONFIG = {
  viewWidth: 800,
  viewHeight: 400,
  viewCenterX: 400,
  viewCenterY: 200,
  groundTopY: 50,
  playerWidth: 30,
  playerHeight: 40,
  playerStartX: 50,
  gapStartX: 350,
  gapEndX: 470,
  platformCenterX: 350,
  platformY: 250,
  platformWidth: 100,
  platformHeight: 15,
  moveSpeed: 5,
  gravity: -0.5,
  jumpVelocity: 12,
  minX: 15,
  maxX: 785,
  backgroundColor: 0x87ceeb,
  groundColor: 0x8b4513,
  playerColor: 0xff0000,
  platformColor: 0x228b22,
};

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(CONFIG.backgroundColor);

// Camera - perspective looking at XY plane
const aspect = CONFIG.viewWidth / CONFIG.viewHeight;
const camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 2000);
// Position camera to see the 800x400 area
// Distance calculation: tan(22.5deg) = (400/2) / distance -> distance ≈ 483
camera.position.set(CONFIG.viewCenterX, CONFIG.viewCenterY, 600);
camera.lookAt(CONFIG.viewCenterX, CONFIG.viewCenterY, 0);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(CONFIG.viewWidth, CONFIG.viewHeight);
document.body.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(400, 300, 500);
scene.add(directionalLight);

// Ground segment 1 (left of gap)
const groundLeft = new THREE.Mesh(
  new THREE.BoxGeometry(CONFIG.gapStartX, CONFIG.groundTopY, 20),
  new THREE.MeshStandardMaterial({ color: CONFIG.groundColor })
);
groundLeft.position.set(CONFIG.gapStartX / 2, CONFIG.groundTopY / 2, 0);
scene.add(groundLeft);

// Ground segment 2 (right of gap)
const groundRightWidth = CONFIG.viewWidth - CONFIG.gapEndX;
const groundRight = new THREE.Mesh(
  new THREE.BoxGeometry(groundRightWidth, CONFIG.groundTopY, 20),
  new THREE.MeshStandardMaterial({ color: CONFIG.groundColor })
);
groundRight.position.set(CONFIG.gapEndX + groundRightWidth / 2, CONFIG.groundTopY / 2, 0);
scene.add(groundRight);

// Floating platform (green)
const platform = new THREE.Mesh(
  new THREE.BoxGeometry(CONFIG.platformWidth, CONFIG.platformHeight, 20),
  new THREE.MeshStandardMaterial({ color: CONFIG.platformColor })
);
platform.position.set(CONFIG.platformCenterX, CONFIG.platformY, 0);
scene.add(platform);

// Player (red box)
const player = new THREE.Mesh(
  new THREE.BoxGeometry(CONFIG.playerWidth, CONFIG.playerHeight, 20),
  new THREE.MeshStandardMaterial({ color: CONFIG.playerColor })
);

// Player state
let playerX = CONFIG.playerStartX;
let playerY = CONFIG.groundTopY + CONFIG.playerHeight / 2;
let velocityY = 0;
let isGrounded = true;
let isDead = false;

// Update player mesh position
function updatePlayerPosition() {
  player.position.set(playerX, playerY, 0);
}
updatePlayerPosition();
scene.add(player);

// Death message element
const deathMessage = document.getElementById('death-message');

// Input state
const keys = {
  left: false,
  right: false,
  up: false,
};

// Event listeners
window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft') keys.left = true;
  if (e.key === 'ArrowRight') keys.right = true;
  if (e.key === 'ArrowUp') keys.up = true;
});

window.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowLeft') keys.left = false;
  if (e.key === 'ArrowRight') keys.right = false;
  if (e.key === 'ArrowUp') keys.up = false;
});

// Check if player is on ground segments
function isOnGround(x, bottomY) {
  const halfWidth = CONFIG.playerWidth / 2;
  const leftEdge = x - halfWidth;
  const rightEdge = x + halfWidth;
  
  // Check if player is above ground level
  if (Math.abs(bottomY - CONFIG.groundTopY) > 1) return false;
  
  // Check if player overlaps with left ground segment (x: 0 to gapStartX)
  if (leftEdge < CONFIG.gapStartX && rightEdge > 0) {
    return true;
  }
  
  // Check if player overlaps with right ground segment (x: gapEndX to viewWidth)
  if (leftEdge < CONFIG.viewWidth && rightEdge > CONFIG.gapEndX) {
    return true;
  }
  
  return false;
}

// Check if player is on platform (one-way from above)
function isOnPlatform(x, bottomY, velY) {
  // Only collide when falling (velY <= 0)
  if (velY > 0) return false;
  
  const halfWidth = CONFIG.playerWidth / 2;
  const leftEdge = x - halfWidth;
  const rightEdge = x + halfWidth;
  
  const platformLeft = CONFIG.platformCenterX - CONFIG.platformWidth / 2;
  const platformRight = CONFIG.platformCenterX + CONFIG.platformWidth / 2;
  const platformTop = CONFIG.platformY + CONFIG.platformHeight / 2;
  
  // Check horizontal overlap
  if (rightEdge < platformLeft || leftEdge > platformRight) return false;
  
  // Check if player is landing on platform (within tolerance)
  if (bottomY <= platformTop && bottomY >= platformTop - 15) {
    return true;
  }
  
  return false;
}

// Reset player
function resetPlayer() {
  playerX = CONFIG.playerStartX;
  playerY = CONFIG.groundTopY + CONFIG.playerHeight / 2;
  velocityY = 0;
  isGrounded = true;
  isDead = false;
  deathMessage.style.display = 'none';
  updatePlayerPosition();
}

// Main update loop
function update() {
  if (isDead) return;
  
  // Horizontal movement
  if (keys.left) {
    playerX -= CONFIG.moveSpeed;
  }
  if (keys.right) {
    playerX += CONFIG.moveSpeed;
  }
  
  // Clamp X position
  playerX = Math.max(CONFIG.minX, Math.min(CONFIG.maxX, playerX));
  
  // Jump
  if (keys.up && isGrounded) {
    velocityY = CONFIG.jumpVelocity;
    isGrounded = false;
  }
  
  // Apply gravity
  velocityY += CONFIG.gravity;
  playerY += velocityY;
  
  // Calculate player bottom
  const playerBottom = playerY - CONFIG.playerHeight / 2;
  
  // Check ground collision
  if (isOnGround(playerX, playerBottom)) {
    playerY = CONFIG.groundTopY + CONFIG.playerHeight / 2;
    velocityY = 0;
    isGrounded = true;
  }
  // Check platform collision (one-way from above)
  else if (isOnPlatform(playerX, playerBottom, velocityY)) {
    const platformTop = CONFIG.platformY + CONFIG.platformHeight / 2;
    playerY = platformTop + CONFIG.playerHeight / 2;
    velocityY = 0;
    isGrounded = true;
  }
  else {
    isGrounded = false;
  }
  
  // Check death (fell below y=0)
  if (playerY < 0) {
    isDead = true;
    deathMessage.style.display = 'block';
    setTimeout(resetPlayer, 1000);
  }
  
  updatePlayerPosition();
}

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  update();
  renderer.render(scene, camera);
}

animate();
