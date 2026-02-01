import * as THREE from 'three';
import { createBubbleEmitter, advanceBubbleParticles, createFish, updateFishSwim } from './scenery.js';

test('createBubbleEmitter builds a bounded bubble group', () => {
  const emitter = createBubbleEmitter({ count: 4, height: 20, radius: 3 });

  expect(emitter).toBeInstanceOf(THREE.Group);
  expect(emitter.userData.bubbles).toHaveLength(4);
  expect(emitter.userData.minY).toBe(0);
  expect(emitter.userData.maxY).toBe(20);
});

test('advanceBubbleParticles wraps bubbles past maxY', () => {
  const bubble = { position: { y: 11 }, userData: { speed: 2 } };
  const group = { userData: { minY: 0, maxY: 10, bubbles: [bubble] } };

  advanceBubbleParticles(group, 1);

  expect(bubble.position.y).toBe(0);
});

test('updateFishSwim orbits around base position', () => {
  const fish = createFish({ size: 10 });
  fish.userData.basePosition = new THREE.Vector3(10, 20, 30);
  fish.userData.swimRadius = 5;
  fish.userData.swimSpeed = 1;
  fish.userData.swimPhase = 0;
  fish.userData.bobAmplitude = 0;
  fish.position.copy(fish.userData.basePosition);

  updateFishSwim(fish, 0);

  expect(fish.position.x).toBeCloseTo(15, 5);
  expect(fish.position.y).toBeCloseTo(20, 5);
  expect(fish.position.z).toBeCloseTo(30, 5);
});
