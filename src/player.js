import * as THREE from 'three';
import { CONFIG } from './config.js';
import { setShadowFlags } from './helpers.js';
import { getSwimPose } from './game/logic.js';

export function createPlayer() {
  const player = new THREE.Group();
  const bodyGroup = new THREE.Group();
  player.add(bodyGroup);
  
  // Body
  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(12, 20, 8, 16),
    new THREE.MeshStandardMaterial({ color: CONFIG.playerBodyColor })
  );
  body.position.y = 0;
  bodyGroup.add(body);
  
  // Head
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(10, 12, 10),
    new THREE.MeshStandardMaterial({ color: 0xffdbac })
  );
  head.position.y = 22;
  bodyGroup.add(head);
  
  // Cap
  const cap = new THREE.Mesh(
    new THREE.SphereGeometry(11, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: CONFIG.playerCapColor })
  );
  cap.position.y = 25;
  bodyGroup.add(cap);
  
  // Cap brim
  const brim = new THREE.Mesh(
    new THREE.CylinderGeometry(12, 12, 3, 12),
    new THREE.MeshStandardMaterial({ color: CONFIG.playerCapColor })
  );
  brim.position.set(0, 22, 7);
  brim.rotation.x = Math.PI / 2;
  brim.scale.set(0.8, 0.5, 0.3);
  bodyGroup.add(brim);
  
  // Eyes
  const eyeWhite = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const eyePupil = new THREE.MeshStandardMaterial({ color: 0x000000 });
  
  for (const side of [-1, 1]) {
    const white = new THREE.Mesh(new THREE.SphereGeometry(3, 8, 6), eyeWhite);
    white.position.set(side * 4, 24, 7);
    bodyGroup.add(white);
    
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(1.5, 6, 4), eyePupil);
    pupil.position.set(side * 4, 24, 9);
    bodyGroup.add(pupil);
  }
  
  player.size = { width: CONFIG.playerWidth, height: CONFIG.playerHeight, depth: CONFIG.playerDepth };
  player.userData.bodyGroup = bodyGroup;
  setShadowFlags(player);
  return player;
}

// Input state
export const keys = {
  left: false,
  right: false,
  forward: false,
  backward: false,
  jump: false,
  dive: false,
};

window.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  if (key === 'a' || event.key === 'ArrowLeft') keys.left = true;
  if (key === 'd' || event.key === 'ArrowRight') keys.right = true;
  if (key === 'w' || event.key === 'ArrowUp') keys.forward = true;
  if (key === 's' || event.key === 'ArrowDown') keys.backward = true;
  if (key === ' ' || event.code === 'Space' || key === 'q') keys.jump = true;
  if (key === 'shift' || key === 'e') keys.dive = true;
});

window.addEventListener('keyup', (event) => {
  const key = event.key.toLowerCase();
  if (key === 'a' || event.key === 'ArrowLeft') keys.left = false;
  if (key === 'd' || event.key === 'ArrowRight') keys.right = false;
  if (key === 'w' || event.key === 'ArrowUp') keys.forward = false;
  if (key === 's' || event.key === 'ArrowDown') keys.backward = false;
  if (key === ' ' || event.code === 'Space' || key === 'q') keys.jump = false;
  if (key === 'shift' || key === 'e') keys.dive = false;
});

// Smooth player rotation
const playerTargetQuaternion = new THREE.Quaternion();
const playerTargetEuler = new THREE.Euler(0, 0, 0, 'YXZ');

export function updatePlayerFacing(player, move, delta) {
  if (move.x === 0 && move.z === 0) return;

  const targetAngle = Math.atan2(move.x, move.z);
  playerTargetEuler.set(0, targetAngle, 0);
  playerTargetQuaternion.setFromEuler(playerTargetEuler);
  
  const alpha = 1 - Math.exp(-CONFIG.playerTurnSpeed * delta);
  player.quaternion.slerp(playerTargetQuaternion, alpha);
}

export function updatePlayerSwimPose(player, move, velocityY, delta, elapsed, isUnderwater) {
  const bodyGroup = player.userData.bodyGroup;
  if (!bodyGroup) return;

  const target = isUnderwater ? getSwimPose(move, velocityY) : { pitch: 0, roll: 0 };
  const alpha = 1 - Math.exp(-8 * delta);
  bodyGroup.rotation.x = THREE.MathUtils.lerp(bodyGroup.rotation.x, target.pitch, alpha);
  bodyGroup.rotation.z = THREE.MathUtils.lerp(bodyGroup.rotation.z, target.roll, alpha);
  bodyGroup.position.y = isUnderwater ? Math.sin(elapsed * 4) * 1.2 : 0;
}
