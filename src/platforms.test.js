import * as THREE from 'three';
import { updateMovingPlatforms } from './platforms.js';

test('updateMovingPlatforms supports vertical movement', () => {
  const platform = new THREE.Mesh();
  platform.basePosition = new THREE.Vector3(0, 10, 0);
  platform.position.copy(platform.basePosition);
  platform.moveAxis = 'y';
  platform.moveAmplitude = 5;
  platform.moveSpeed = 1;

  updateMovingPlatforms([platform], Math.PI / 2);

  expect(platform.position.y).toBeCloseTo(15, 5);
});
