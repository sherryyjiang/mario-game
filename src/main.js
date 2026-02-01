import * as THREE from 'three';

// Configuration
const CONFIG = {
  planetRadius: 5,
  characterSize: 0.5,
  cameraDistance: 6,
  cameraHeight: 2,
  moveSpeed: 3,
  cameraLerpFactor: 0.1,
  gravityStrength: 20,
};

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a2e);

// Camera
const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(10, 10, 10);
scene.add(directionalLight);

// Planet
const planetGeometry = new THREE.SphereGeometry(CONFIG.planetRadius, 64, 64);
const planetMaterial = new THREE.MeshStandardMaterial({
  color: 0x4a9c6d,
  roughness: 0.8,
  metalness: 0.2,
});
const planet = new THREE.Mesh(planetGeometry, planetMaterial);
scene.add(planet);

// Character (simple capsule-like shape)
const characterGroup = new THREE.Group();

// Body
const bodyGeometry = new THREE.CapsuleGeometry(
  CONFIG.characterSize * 0.4,
  CONFIG.characterSize * 0.6,
  8,
  16
);
const bodyMaterial = new THREE.MeshStandardMaterial({
  color: 0xe63946,
  roughness: 0.5,
});
const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
body.position.y = CONFIG.characterSize * 0.5;
characterGroup.add(body);

// Eyes (to show facing direction)
const eyeGeometry = new THREE.SphereGeometry(0.08, 8, 8);
const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });

const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
leftEye.position.set(-0.1, CONFIG.characterSize * 0.7, 0.25);
characterGroup.add(leftEye);

const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
rightEye.position.set(0.1, CONFIG.characterSize * 0.7, 0.25);
characterGroup.add(rightEye);

scene.add(characterGroup);

// Position character on planet surface
const initialUp = new THREE.Vector3(0, 1, 0);
characterGroup.position.copy(initialUp.clone().multiplyScalar(CONFIG.planetRadius));

// Input state
const keys = {
  w: false,
  a: false,
  s: false,
  d: false,
};

// Track character's forward direction on the tangent plane
let characterForward = new THREE.Vector3(1, 0, 0);

// Camera target for smooth following
const cameraTargetPosition = new THREE.Vector3();
const cameraTargetLookAt = new THREE.Vector3();

// Event listeners
window.addEventListener('keydown', (e) => {
  const key = e.key.toLowerCase();
  if (key in keys) keys[key] = true;
});

window.addEventListener('keyup', (e) => {
  const key = e.key.toLowerCase();
  if (key in keys) keys[key] = false;
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Helper function to align object to surface normal
function alignToSurface(object, surfaceNormal) {
  const up = surfaceNormal.clone().normalize();
  
  // Create a quaternion that rotates from world up to surface normal
  const worldUp = new THREE.Vector3(0, 1, 0);
  const quaternion = new THREE.Quaternion();
  quaternion.setFromUnitVectors(worldUp, up);
  
  object.quaternion.copy(quaternion);
}

// Get surface normal (direction from planet center to character)
function getSurfaceNormal() {
  return characterGroup.position.clone().normalize();
}

// Project vector onto tangent plane
function projectOntoTangentPlane(vector, normal) {
  const dot = vector.dot(normal);
  return vector.clone().sub(normal.clone().multiplyScalar(dot)).normalize();
}

// Update character forward direction to stay on tangent plane
function updateForwardOnTangentPlane(normal) {
  characterForward = projectOntoTangentPlane(characterForward, normal);
  if (characterForward.lengthSq() < 0.001) {
    // Fallback if forward becomes zero
    characterForward.set(1, 0, 0);
    characterForward = projectOntoTangentPlane(characterForward, normal);
  }
  characterForward.normalize();
}

// Main update loop
function update(deltaTime) {
  const surfaceNormal = getSurfaceNormal();
  
  // Keep forward direction on tangent plane
  updateForwardOnTangentPlane(surfaceNormal);
  
  // Calculate right vector (perpendicular to forward and up)
  const right = new THREE.Vector3().crossVectors(surfaceNormal, characterForward).normalize();
  
  // Recalculate forward to ensure orthogonality
  characterForward.crossVectors(right, surfaceNormal).normalize();
  
  // Get camera-relative forward and right
  const cameraForward = new THREE.Vector3();
  camera.getWorldDirection(cameraForward);
  cameraForward.y = 0; // Flatten to horizontal
  
  // Project camera forward onto tangent plane for camera-relative movement
  const cameraForwardTangent = projectOntoTangentPlane(cameraForward, surfaceNormal);
  const cameraRightTangent = new THREE.Vector3().crossVectors(surfaceNormal, cameraForwardTangent).normalize();
  
  // If camera forward is too aligned with surface normal, use character forward
  let moveForward = cameraForwardTangent;
  let moveRight = cameraRightTangent;
  
  if (cameraForwardTangent.lengthSq() < 0.1) {
    moveForward = characterForward;
    moveRight = right;
  } else {
    moveForward.normalize();
  }
  
  // Calculate movement direction based on input
  const moveDirection = new THREE.Vector3();
  
  if (keys.w) moveDirection.add(moveForward);
  if (keys.s) moveDirection.sub(moveForward);
  if (keys.a) moveDirection.add(moveRight);
  if (keys.d) moveDirection.sub(moveRight);
  
  // Apply movement
  if (moveDirection.lengthSq() > 0) {
    moveDirection.normalize();
    
    // Update character forward to face movement direction
    characterForward.lerp(moveDirection, 0.15).normalize();
    
    // Move character along the surface
    const moveAmount = CONFIG.moveSpeed * deltaTime;
    characterGroup.position.add(moveDirection.clone().multiplyScalar(moveAmount));
    
    // Project back onto planet surface (custom gravity)
    characterGroup.position.normalize().multiplyScalar(CONFIG.planetRadius);
  }
  
  // Align character to surface
  const newNormal = getSurfaceNormal();
  
  // Build character rotation: align up with surface normal, forward with characterForward
  const charUp = newNormal;
  const charRight = new THREE.Vector3().crossVectors(charUp, characterForward).normalize();
  const charForward = new THREE.Vector3().crossVectors(charRight, charUp).normalize();
  
  const rotMatrix = new THREE.Matrix4();
  rotMatrix.makeBasis(charRight, charUp, charForward);
  characterGroup.quaternion.setFromRotationMatrix(rotMatrix);
  
  // Update camera to follow behind character
  updateCamera(deltaTime, newNormal);
}

function updateCamera(deltaTime, surfaceNormal) {
  // Calculate ideal camera position: behind and above character
  const behindOffset = characterForward.clone().multiplyScalar(-CONFIG.cameraDistance);
  const upOffset = surfaceNormal.clone().multiplyScalar(CONFIG.cameraHeight);
  
  const idealPosition = characterGroup.position.clone()
    .add(behindOffset)
    .add(upOffset);
  
  // Smooth camera movement
  cameraTargetPosition.lerp(idealPosition, CONFIG.cameraLerpFactor);
  camera.position.copy(cameraTargetPosition);
  
  // Look at character (slightly above center)
  const lookAtPoint = characterGroup.position.clone()
    .add(surfaceNormal.clone().multiplyScalar(CONFIG.characterSize));
  
  cameraTargetLookAt.lerp(lookAtPoint, CONFIG.cameraLerpFactor);
  camera.lookAt(cameraTargetLookAt);
}

// Initialize camera position
function initializeCamera() {
  const surfaceNormal = getSurfaceNormal();
  const behindOffset = characterForward.clone().multiplyScalar(-CONFIG.cameraDistance);
  const upOffset = surfaceNormal.clone().multiplyScalar(CONFIG.cameraHeight);
  
  camera.position.copy(
    characterGroup.position.clone()
      .add(behindOffset)
      .add(upOffset)
  );
  
  cameraTargetPosition.copy(camera.position);
  cameraTargetLookAt.copy(characterGroup.position);
  camera.lookAt(characterGroup.position);
}

initializeCamera();

// Animation loop
let lastTime = performance.now();

function animate() {
  requestAnimationFrame(animate);
  
  const currentTime = performance.now();
  const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.1); // Cap delta time
  lastTime = currentTime;
  
  update(deltaTime);
  renderer.render(scene, camera);
}

animate();
