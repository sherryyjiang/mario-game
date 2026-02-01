import * as THREE from 'three';
import { CONFIG } from './config.js';
import { camera, renderer } from './scene.js';

const cameraTarget = new THREE.Vector3();
const cameraPosition = new THREE.Vector3();
const cameraOffset = new THREE.Vector3();

export const cameraState = {
  isDragging: false,
  lastClientX: 0,
  lastClientY: 0,
  theta: CONFIG.cameraTheta,
  phi: CONFIG.cameraPhi,
  distance: CONFIG.cameraDistance,
};

// Mouse/touch controls
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

export function updateCamera(playerX, playerY, playerZ, delta) {
  cameraTarget.set(playerX, playerY + CONFIG.cameraTargetHeight, playerZ);

  const spherical = new THREE.Spherical(cameraState.distance, cameraState.phi, cameraState.theta);
  cameraOffset.setFromSpherical(spherical);

  cameraPosition.copy(cameraTarget).add(cameraOffset);
  cameraPosition.y = Math.max(cameraPosition.y, CONFIG.cameraMinY);

  camera.position.lerp(cameraPosition, getExpDampAlpha(delta, CONFIG.cameraFollowSpeed));
  camera.lookAt(cameraTarget);
}

export function getCameraForward() {
  const forward = new THREE.Vector3();
  camera.getWorldDirection(forward);
  forward.y = 0;
  forward.normalize();
  return { x: forward.x, z: forward.z };
}
