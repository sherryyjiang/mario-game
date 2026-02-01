import * as THREE from 'three';
import { CONFIG } from './config.js';
import { 
  createBox, 
  setShadowFlags, 
  cloudMaterial, 
  rainbowMaterials, 
  stoneMaterial, 
  glassMaterial, 
  goldMaterial 
} from './helpers.js';

export function createCloudPlatform({ width, height, depth, material }) {
  const group = new THREE.Group();
  
  const mainMaterial = material ?? cloudMaterial.clone();
  const main = createBox({ width, height, depth, material: mainMaterial });
  group.add(main);
  
  const bumpCount = Math.floor(width / 40);
  for (let i = 0; i < bumpCount; i++) {
    const bumpSize = 15 + Math.random() * 15;
    const bump = new THREE.Mesh(
      new THREE.SphereGeometry(bumpSize, 8, 6),
      mainMaterial
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

export function createRainbowPlatform({ width, height, depth, colorIndex = 0 }) {
  const material = rainbowMaterials[colorIndex % rainbowMaterials.length];
  const mesh = createBox({ width, height, depth, material: material.clone() });
  mesh.material.emissive = new THREE.Color(material.color).multiplyScalar(0.2);
  return mesh;
}

export function createStonePlatform({ width, height, depth, material }) {
  return createBox({ width, height, depth, material: material ?? stoneMaterial.clone() });
}

export function createGlassPlatform({ width, height, depth, material }) {
  return createBox({ width, height, depth, material: material ?? glassMaterial.clone() });
}

export function createSpinningPlatform({ width, height, depth, material }) {
  const mesh = createBox({ width, height, depth, material: material || goldMaterial.clone() });
  mesh.isSpinning = true;
  mesh.spinSpeed = 0.5;
  return mesh;
}

export function createCheckpoint({ poleColor, flagColor }) {
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

export function updateMovingPlatforms(platforms, elapsed) {
  for (const platform of platforms) {
    const axis = platform.moveAxis || 'z';
    const offset = Math.sin(elapsed * platform.moveSpeed) * platform.moveAmplitude;
    
    if (axis === 'z') {
      platform.position.z = platform.basePosition.z + offset;
    } else if (axis === 'x') {
      platform.position.x = platform.basePosition.x + offset;
    }
  }
}

export function updateSpinningPlatforms(platforms, delta) {
  for (const platform of platforms) {
    platform.rotation.y += delta * platform.spinSpeed;
  }
}
