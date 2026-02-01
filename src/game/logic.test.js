import {
  collectCoins,
  getAabbFromCenter,
  getCameraRelativeMoveVector,
  getMoveVector,
  getPatrolOffset,
  isAabbOverlap,
  isGoalReached,
  isLandingOnTop,
  updateCheckpoint,
  updateTimedPlatformState,
} from './logic.js';

test('getMoveVector normalizes diagonal movement', () => {
  const move = getMoveVector({ forward: true, right: true }, 10);

  expect(Math.hypot(move.x, move.z)).toBeCloseTo(10, 5);
  expect(move.x).toBeGreaterThan(0);
  expect(move.z).toBeLessThan(0);
});

test('getCameraRelativeMoveVector moves away from camera when pressing forward', () => {
  const move = getCameraRelativeMoveVector({ forward: true }, 10, { x: 0, z: -1 });
  expect(move).toEqual({ x: 0, z: -10 });
});

test('getCameraRelativeMoveVector moves to camera right when pressing right', () => {
  const move = getCameraRelativeMoveVector({ right: true }, 10, { x: 0, z: -1 });
  expect(move).toEqual({ x: 10, z: 0 });
});

test('getCameraRelativeMoveVector normalizes diagonal movement', () => {
  const move = getCameraRelativeMoveVector({ forward: true, right: true }, 10, { x: 0, z: -1 });
  expect(Math.hypot(move.x, move.z)).toBeCloseTo(10, 5);
});

test('getMoveVector returns zero when no input', () => {
  const move = getMoveVector({}, 8);

  expect(move).toEqual({ x: 0, z: 0 });
});

test('isAabbOverlap detects overlap in 3D', () => {
  const a = getAabbFromCenter({ x: 0, y: 10, z: 0 }, { width: 10, height: 10, depth: 10 });
  const b = getAabbFromCenter({ x: 5, y: 10, z: 0 }, { width: 10, height: 10, depth: 10 });

  expect(isAabbOverlap(a, b)).toBe(true);
});

test('isLandingOnTop requires overlap and falling', () => {
  const player = getAabbFromCenter({ x: 0, y: 21, z: 0 }, { width: 10, height: 10, depth: 10 });
  const platform = getAabbFromCenter({ x: 0, y: 10, z: 0 }, { width: 40, height: 10, depth: 40 });

  expect(isLandingOnTop(player, platform, -1, 2)).toBe(true);
  expect(isLandingOnTop(player, platform, 3, 2)).toBe(false);
});

test('collectCoins removes coins within pickup radius', () => {
  const playerBox = getAabbFromCenter({ x: 0, y: 5, z: 0 }, { width: 10, height: 10, depth: 10 });
  const coins = [
    { position: { x: 0, y: 5, z: 0 }, radius: 6 },
    { position: { x: 50, y: 5, z: 0 }, radius: 6 },
  ];

  const result = collectCoins(playerBox, coins);

  expect(result.collectedCount).toBe(1);
  expect(result.remainingCoins).toHaveLength(1);
});

test('updateCheckpoint selects overlapped checkpoint', () => {
  const playerBox = getAabbFromCenter({ x: 10, y: 10, z: 10 }, { width: 10, height: 10, depth: 10 });
  const checkpoints = [
    {
      id: 'start',
      position: { x: 0, y: 0, z: 0 },
      box: getAabbFromCenter({ x: 0, y: 0, z: 0 }, { width: 5, height: 5, depth: 5 }),
    },
    {
      id: 'mid',
      position: { x: 10, y: 10, z: 10 },
      box: getAabbFromCenter({ x: 10, y: 10, z: 10 }, { width: 12, height: 12, depth: 12 }),
    },
  ];

  const result = updateCheckpoint(null, playerBox, checkpoints);

  expect(result?.id).toBe('mid');
});

test('getPatrolOffset returns zero at start', () => {
  expect(getPatrolOffset(0, 2, 10)).toBeCloseTo(0, 5);
});

test('updateTimedPlatformState drops then respawns', () => {
  const config = { dropDelay: 1, respawnDelay: 2 };
  let state = { isActive: true, timer: 0, respawnTimer: 0 };

  state = updateTimedPlatformState(state, true, 0.6, config);
  expect(state.isActive).toBe(true);

  state = updateTimedPlatformState(state, true, 0.6, config);
  expect(state.isActive).toBe(false);

  state = updateTimedPlatformState(state, false, 2.1, config);
  expect(state.isActive).toBe(true);
});

test('isGoalReached returns true on overlap', () => {
  const playerBox = getAabbFromCenter({ x: 0, y: 0, z: 0 }, { width: 10, height: 10, depth: 10 });
  const goalBox = getAabbFromCenter({ x: 0, y: 0, z: 0 }, { width: 5, height: 5, depth: 5 });

  expect(isGoalReached(playerBox, goalBox)).toBe(true);
});
