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

export function getChaseVector(current, target, maxStep) {
  const dx = (target?.x ?? 0) - (current?.x ?? 0);
  const dy = (target?.y ?? 0) - (current?.y ?? 0);
  const dz = (target?.z ?? 0) - (current?.z ?? 0);
  const distance = Math.hypot(dx, dy, dz);

  if (!Number.isFinite(maxStep) || maxStep <= 0) {
    return { x: 0, y: 0, z: 0 };
  }
  if (distance === 0 || distance <= maxStep) {
    return { x: dx, y: dy, z: dz };
  }

  const scale = maxStep / distance;
  return { x: dx * scale, y: dy * scale, z: dz * scale };
}

export function createEelBoss({
  length = 320,
  segmentCount = 9,
  radius = 22,
  color = 0x1c6b7f,
} = {}) {
  const eel = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({ color, roughness: 0.6 });
  const segments = [];
  const segmentSpacing = length / Math.max(1, segmentCount);

  for (let i = 0; i < segmentCount; i++) {
    const t = i / Math.max(1, segmentCount - 1);
    const size = radius * (1 - t * 0.35);
    const geometry = new THREE.CapsuleGeometry(size * 0.55, segmentSpacing * 0.9, 6, 10);
    geometry.rotateZ(Math.PI / 2);
    const segment = new THREE.Mesh(geometry, material);
    segment.position.set(-i * segmentSpacing, 0, 0);
    segment.userData.baseY = segment.position.y;
    segment.userData.baseZ = segment.position.z;
    segments.push(segment);
    eel.add(segment);
  }

  const head = segments[0];
  const snout = new THREE.Mesh(
    new THREE.ConeGeometry(radius * 0.5, radius * 1.2, 8),
    material
  );
  snout.rotation.z = -Math.PI / 2;
  snout.position.set(radius * 0.6, 0, 0);
  head.add(snout);

  const eyeMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const pupilMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(radius * 0.22, 8, 6), eyeMat);
    eye.position.set(6, radius * 0.2, side * radius * 0.4);
    head.add(eye);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(radius * 0.1, 6, 4), pupilMat);
    pupil.position.set(8, radius * 0.2, side * radius * 0.4 + radius * 0.1);
    head.add(pupil);
  }

  const dorsal = new THREE.Mesh(
    new THREE.ConeGeometry(radius * 0.25, radius * 0.9, 6),
    material
  );
  dorsal.position.set(-radius * 0.6, radius * 0.7, 0);
  dorsal.rotation.x = Math.PI / 2;
  head.add(dorsal);

  const tail = new THREE.Mesh(
    new THREE.ConeGeometry(radius * 0.5, radius * 1.6, 8),
    material
  );
  tail.rotation.z = Math.PI / 2;
  tail.position.set(-segmentSpacing * (segmentCount - 1) - radius * 0.6, 0, 0);
  eel.add(tail);

  eel.userData.segments = segments;
  eel.userData.segmentSpacing = segmentSpacing;
  eel.userData.waveAmplitude = radius * 0.6;
  eel.userData.swimAmplitude = radius * 1.2;
  eel.userData.chaseSpeed = 70;
  eel.userData.wanderAmplitude = radius * 1.4;
  eel.userData.boundsPadding = radius * 2;
  eel.size = { width: length, height: radius * 2.4, depth: radius * 2.4 };
  setShadowFlags(eel);
  return eel;
}

export function updateEelBoss(eel, elapsed, delta, target, bounds) {
  const segments = eel.userData.segments || [];
  const waveAmplitude = eel.userData.waveAmplitude ?? 10;
  const swimAmplitude = eel.userData.swimAmplitude ?? 20;
  const segmentSpacing = eel.userData.segmentSpacing ?? 20;

  if (!eel.userData.chasePosition) {
    eel.userData.chasePosition = eel.position.clone();
  }
  const chaseSpeed = eel.userData.chaseSpeed ?? 60;
  const chaseStep = getChaseVector(eel.userData.chasePosition, target, chaseSpeed * (delta ?? 0));
  eel.userData.chasePosition.x += chaseStep.x;
  eel.userData.chasePosition.y += chaseStep.y;
  eel.userData.chasePosition.z += chaseStep.z;

  const padding = eel.userData.boundsPadding ?? 0;
  if (bounds?.min && bounds?.max) {
    eel.userData.chasePosition.x = clamp(
      eel.userData.chasePosition.x,
      bounds.min.x + padding,
      bounds.max.x - padding
    );
    eel.userData.chasePosition.y = clamp(
      eel.userData.chasePosition.y,
      bounds.min.y + padding,
      bounds.max.y - padding
    );
    eel.userData.chasePosition.z = clamp(
      eel.userData.chasePosition.z,
      bounds.min.z + padding,
      bounds.max.z - padding
    );
  }

  const wander = eel.userData.wanderAmplitude ?? 15;
  eel.position.x = eel.userData.chasePosition.x + Math.sin(elapsed * 0.6) * wander * 0.5;
  eel.position.y = eel.userData.chasePosition.y + Math.sin(elapsed * 0.9 + 1.2) * wander * 0.3;
  eel.position.z = eel.userData.chasePosition.z + Math.cos(elapsed * 0.5) * wander * 0.5;

  const dirX = (target?.x ?? eel.position.x) - eel.position.x;
  const dirZ = (target?.z ?? eel.position.z) - eel.position.z;
  if (dirX !== 0 || dirZ !== 0) {
    eel.rotation.y = Math.atan2(dirZ, dirX);
  }

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    const wave = Math.sin(elapsed * 2.0 - i * 0.6) * waveAmplitude;
    segment.position.x = -i * segmentSpacing;
    segment.position.y = segment.userData.baseY + wave * 0.25;
    segment.position.z = segment.userData.baseZ + wave * 0.8;
  }

  const pulse = Math.sin(elapsed * 1.4) * swimAmplitude * 0.2;
  for (let i = 0; i < segments.length; i++) {
    segments[i].scale.y = 1 + pulse * (i / Math.max(1, segments.length - 1));
  }
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
