import * as THREE from 'three';
import {
  createEelBoss,
  updateEelBoss,
  getChaseVector,
  createBobOmb,
  createFireJet,
  createFireball,
  createRollingLog,
  updateHazards,
} from './enemies.js';

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

test('createBobOmb tags hazard type and size', () => {
  const bob = createBobOmb();

  expect(bob).toBeInstanceOf(THREE.Group);
  expect(bob.userData.type).toBe('bob-omb');
  expect(bob.size).toEqual({ width: 50, height: 40, depth: 50 });
});

test('updateHazards animates fire jet height', () => {
  const jet = createFireJet({ minHeight: 10, maxHeight: 30, pulseSpeed: 1, phase: -Math.PI / 2 });
  jet.userData.basePosition = new THREE.Vector3(0, 0, 0);

  updateHazards([jet], 0);
  expect(jet.size.height).toBeCloseTo(10, 5);
  expect(jet.position.y).toBeCloseTo(5, 5);

  updateHazards([jet], Math.PI);
  expect(jet.size.height).toBeCloseTo(30, 5);
});

test('updateHazards moves arc fireballs along a parabola', () => {
  const fireball = createFireball({ radius: 4 });
  fireball.userData.path = {
    start: new THREE.Vector3(0, 0, 0),
    end: new THREE.Vector3(10, 0, 0),
    arcHeight: 6,
    travelSpeed: 1,
    phase: 0,
  };

  updateHazards([fireball], 0);
  expect(fireball.position.x).toBeCloseTo(0, 5);
  expect(fireball.position.y).toBeCloseTo(0, 5);

  updateHazards([fireball], 0.5);
  expect(fireball.position.x).toBeCloseTo(5, 5);
  expect(fireball.position.y).toBeCloseTo(6, 5);
});

test('updateHazards rolls logs along their axis path', () => {
  const log = createRollingLog({ length: 20, radius: 3 });
  log.userData.basePosition = new THREE.Vector3(0, 0, 0);
  log.userData.moveAxis = 'x';
  log.userData.moveAmplitude = 10;
  log.userData.moveSpeed = 1;
  log.userData.rollSpeed = 2;

  updateHazards([log], Math.PI / 2);
  expect(log.position.x).toBeCloseTo(10, 5);
});
