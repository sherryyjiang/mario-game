import test from 'node:test';
import assert from 'node:assert/strict';

import { stepJumpState } from '../src/jump.js';

const near = (actual, expected, epsilon = 1e-6) => {
  assert.ok(Math.abs(actual - expected) <= epsilon);
};

test('jump starts when grounded and requested', () => {
  const result = stepJumpState(
    { radius: 5, velocity: 0, grounded: true },
    {
      baseRadius: 5,
      jumpSpeed: 8,
      gravity: 20,
      deltaTime: 0.1,
      jumpRequested: true,
    }
  );

  assert.equal(result.grounded, false);
  near(result.velocity, 6);
  near(result.radius, 5.6);
});

test('falling clamps to base radius', () => {
  const result = stepJumpState(
    { radius: 5.1, velocity: -2, grounded: false },
    {
      baseRadius: 5,
      jumpSpeed: 8,
      gravity: 20,
      deltaTime: 0.1,
      jumpRequested: false,
    }
  );

  assert.equal(result.grounded, true);
  assert.equal(result.velocity, 0);
  near(result.radius, 5);
});

test('grounded without jump stays on base radius', () => {
  const result = stepJumpState(
    { radius: 5, velocity: 0, grounded: true },
    {
      baseRadius: 5,
      jumpSpeed: 8,
      gravity: 20,
      deltaTime: 0.1,
      jumpRequested: false,
    }
  );

  assert.equal(result.grounded, true);
  assert.equal(result.velocity, 0);
  near(result.radius, 5);
});
