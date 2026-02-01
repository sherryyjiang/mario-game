import * as THREE from 'three';
import { CONFIG } from './config.js';
import { getAabbFromCenter } from './game/logic.js';

export function setShadowFlags(object3d, { castShadow = true, receiveShadow = true } = {}) {
  object3d.traverse((child) => {
    if (!child.isMesh) return;
    child.castShadow = castShadow;
    child.receiveShadow = receiveShadow;
  });
}

export function createBox({ width, height, depth, material }) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    material
  );
  mesh.size = { width, height, depth };
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function createBoxWithColor({ width, height, depth, color }) {
  const mat = new THREE.MeshStandardMaterial({ color });
  return createBox({ width, height, depth, material: mat });
}

export function getBoxAabb(box) {
  const pos = box.position || { x: 0, y: 0, z: 0 };
  const size = box.size || { width: 10, height: 10, depth: 10 };
  return getAabbFromCenter(
    { x: pos.x, y: pos.y, z: pos.z },
    { width: size.width, height: size.height, depth: size.depth }
  );
}

export function getGroupAabb(group) {
  const pos = group.position;
  const size = group.size || { width: 100, height: 15, depth: 100 };
  return getAabbFromCenter(
    { x: pos.x, y: pos.y, z: pos.z },
    { width: size.width, height: size.height, depth: size.depth }
  );
}

export function getCoinKey(position) {
  return `${position.x}|${position.y}|${position.z}`;
}

// Shared materials
export const cloudMaterial = new THREE.MeshStandardMaterial({
  color: CONFIG.cloudColor,
  roughness: 1.0,
  metalness: 0,
  flatShading: false,
});

export const rainbowMaterials = CONFIG.rainbowColors.map(color => 
  new THREE.MeshStandardMaterial({ color, roughness: 0.3, metalness: 0.1 })
);

export const stoneMaterial = new THREE.MeshStandardMaterial({
  color: CONFIG.stoneColor,
  roughness: 0.8,
  metalness: 0.1,
});

export const stoneDarkMaterial = new THREE.MeshStandardMaterial({
  color: CONFIG.stoneDarkColor,
  roughness: 0.9,
  metalness: 0.1,
});

export const glassMaterial = new THREE.MeshStandardMaterial({
  color: CONFIG.glassColor,
  transparent: true,
  opacity: 0.5,
  roughness: 0.1,
  metalness: 0.2,
});

export const goldMaterial = new THREE.MeshStandardMaterial({
  color: CONFIG.goldColor,
  roughness: 0.3,
  metalness: 0.8,
});
