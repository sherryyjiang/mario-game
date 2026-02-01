import { getFirstPersonView, getForwardVector } from './cameraMath.js';

test('getForwardVector faces -Z when yaw and pitch are zero', () => {
  const forward = getForwardVector(0, 0);

  expect(forward.x).toBeCloseTo(0, 5);
  expect(forward.y).toBeCloseTo(0, 5);
  expect(forward.z).toBeCloseTo(-1, 5);
});

test('getFirstPersonView offsets to eye height and looks forward', () => {
  const view = getFirstPersonView(
    { x: 10, y: 20, z: 30 },
    { yaw: 0, pitch: 0 },
    { eyeHeight: 12, forwardOffset: 5, lookDistance: 10 }
  );

  expect(view.position).toEqual({ x: 10, y: 32, z: 25 });
  expect(view.lookTarget).toEqual({ x: 10, y: 32, z: 15 });
});

test('getFirstPersonView pitches the look target upward', () => {
  const view = getFirstPersonView(
    { x: 0, y: 0, z: 0 },
    { yaw: 0, pitch: Math.PI / 4 },
    { eyeHeight: 10, forwardOffset: 0, lookDistance: 10 }
  );

  expect(view.lookTarget.y).toBeGreaterThan(view.position.y);
  expect(view.lookTarget.z).toBeLessThan(view.position.z);
});
