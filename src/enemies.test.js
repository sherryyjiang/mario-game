import * as THREE from 'three';
import { createEelBoss, updateEelBoss, getChaseVector } from './enemies.js';

test('getChaseVector clamps to max step length', () => {
  const step = getChaseVector({ x: 0, y: 0, z: 0 }, { x: 10, y: 0, z: 0 }, 2);

  expect(step).toEqual({ x: 2, y: 0, z: 0 });
});

test('getChaseVector returns full delta when within max step', () => {
  const step = getChaseVector({ x: 0, y: 0, z: 0 }, { x: 1, y: 2, z: 3 }, 10);

  expect(step).toEqual({ x: 1, y: 2, z: 3 });
});

test('updateEelBoss moves toward the target', () => {
  const eel = createEelBoss({ length: 120, segmentCount: 6, radius: 10 });
  eel.position.set(0, 0, 0);
  eel.userData.chaseSpeed = 12;

  const target = new THREE.Vector3(100, 0, 0);
  updateEelBoss(eel, 0, 1, target, {
    min: { x: -200, y: -200, z: -200 },
    max: { x: 200, y: 200, z: 200 },
  });

  expect(eel.position.x).toBeGreaterThan(0);
});
