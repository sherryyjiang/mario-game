import * as THREE from 'three';
import { setShadowFlags } from './helpers.js';
import { getPatrolOffset } from './game/logic.js';

export function createGoomba() {
  const goomba = new THREE.Group();

  // Body
  const bodyGeometry = new THREE.SphereGeometry(20, 16, 12);
  bodyGeometry.scale(1, 0.7, 1);
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.position.y = 15;
  goomba.add(body);

  // Belly
  const bellyGeometry = new THREE.SphereGeometry(15, 16, 8, 0, Math.PI * 2, Math.PI / 2);
  const bellyMaterial = new THREE.MeshStandardMaterial({ color: 0xd2b48c });
  const belly = new THREE.Mesh(bellyGeometry, bellyMaterial);
  belly.position.y = 10;
  belly.rotation.x = Math.PI;
  goomba.add(belly);

  // Eyes
  const eyeGeometry = new THREE.SphereGeometry(5, 8, 8);
  const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
  leftEye.position.set(-8, 20, 15);
  goomba.add(leftEye);
  const rightEye = leftEye.clone();
  rightEye.position.set(8, 20, 15);
  goomba.add(rightEye);

  // Pupils
  const pupilGeometry = new THREE.SphereGeometry(2.5, 8, 8);
  const pupilMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
  const leftPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
  leftPupil.position.set(-8, 20, 19);
  goomba.add(leftPupil);
  const rightPupil = leftPupil.clone();
  rightPupil.position.set(8, 20, 19);
  goomba.add(rightPupil);

  // Eyebrows
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

  // Feet
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

  goomba.size = { width: 55, height: 40, depth: 50 };
  setShadowFlags(goomba);
  return goomba;
}

export function animateGoomba(goomba, time, isMoving) {
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

export function updateHazards(hazards, elapsed) {
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
