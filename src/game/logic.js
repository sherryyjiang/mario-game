export function getMoveVector(input, speed) {
  const x = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  const z = (input.backward ? 1 : 0) - (input.forward ? 1 : 0);

  if (x === 0 && z === 0) return { x: 0, z: 0 };

  const length = Math.hypot(x, z);
  return { x: (x / length) * speed, z: (z / length) * speed };
}

export function getCameraRelativeMoveVector(input, speed, cameraForward) {
  const forwardX = cameraForward?.x ?? 0;
  const forwardZ = cameraForward?.z ?? 0;
  const forwardLength = Math.hypot(forwardX, forwardZ);
  if (forwardLength === 0) return { x: 0, z: 0 };

  const fx = forwardX / forwardLength;
  const fz = forwardZ / forwardLength;

  // right = forward x up(0,1,0) projected to XZ
  const rx = -fz;
  const rz = fx;

  let moveX = 0;
  let moveZ = 0;

  if (input.forward) {
    moveX += fx;
    moveZ += fz;
  }
  if (input.backward) {
    moveX -= fx;
    moveZ -= fz;
  }
  if (input.right) {
    moveX += rx;
    moveZ += rz;
  }
  if (input.left) {
    moveX -= rx;
    moveZ -= rz;
  }

  const moveLength = Math.hypot(moveX, moveZ);
  if (moveLength === 0) return { x: 0, z: 0 };

  return { x: (moveX / moveLength) * speed, z: (moveZ / moveLength) * speed };
}

export function getAabbFromCenter(center, size) {
  return {
    min: {
      x: center.x - size.width / 2,
      y: center.y - size.height / 2,
      z: center.z - size.depth / 2,
    },
    max: {
      x: center.x + size.width / 2,
      y: center.y + size.height / 2,
      z: center.z + size.depth / 2,
    },
  };
}

export function isAabbOverlap(a, b) {
  return (
    a.min.x <= b.max.x &&
    a.max.x >= b.min.x &&
    a.min.y <= b.max.y &&
    a.max.y >= b.min.y &&
    a.min.z <= b.max.z &&
    a.max.z >= b.min.z
  );
}

export function isLandingOnTop(playerBox, platformBox, velocityY, tolerance) {
  if (velocityY > 0) return false;

  const overlapsX = playerBox.max.x >= platformBox.min.x && playerBox.min.x <= platformBox.max.x;
  const overlapsZ = playerBox.max.z >= platformBox.min.z && playerBox.min.z <= platformBox.max.z;
  const verticalDistance = Math.abs(playerBox.min.y - platformBox.max.y);

  return overlapsX && overlapsZ && verticalDistance <= tolerance;
}

export function collectCoins(playerBox, coins) {
  const playerCenter = getAabbCenter(playerBox);
  const remainingCoins = [];
  let collectedCount = 0;

  for (const coin of coins) {
    const distance = getDistance3d(playerCenter, coin.position);
    if (distance <= coin.radius) {
      collectedCount += 1;
      continue;
    }
    remainingCoins.push(coin);
  }

  return { remainingCoins, collectedCount };
}

export function updateCheckpoint(currentCheckpoint, playerBox, checkpoints) {
  for (const checkpoint of checkpoints) {
    if (isAabbOverlap(playerBox, checkpoint.box)) {
      return checkpoint;
    }
  }
  return currentCheckpoint;
}

export function getPatrolOffset(elapsed, speed, distance) {
  return Math.sin(elapsed * speed) * distance;
}

export function updateTimedPlatformState(state, isPlayerOnTop, delta, config) {
  if (state.isActive) {
    const nextTimer = state.timer + (isPlayerOnTop ? delta : 0);
    if (nextTimer >= config.dropDelay) {
      return {
        isActive: false,
        timer: 0,
        respawnTimer: 0,
      };
    }
    return { ...state, timer: nextTimer };
  }

  const nextRespawn = state.respawnTimer + delta;
  if (nextRespawn >= config.respawnDelay) {
    return { isActive: true, timer: 0, respawnTimer: 0 };
  }

  return { ...state, respawnTimer: nextRespawn };
}

export function isGoalReached(playerBox, goalBox) {
  return isAabbOverlap(playerBox, goalBox);
}

export function isGoalUnlocked(score, requiredCoins = 0) {
  return score >= requiredCoins;
}

export function isQuestionBlockHitFromBelow(playerBox, blockBox, velocityY, tolerance = 0) {
  if (velocityY <= 0) return false;

  const overlapsX = playerBox.max.x >= blockBox.min.x && playerBox.min.x <= blockBox.max.x;
  const overlapsZ = playerBox.max.z >= blockBox.min.z && playerBox.min.z <= blockBox.max.z;
  const headDistance = Math.abs(blockBox.min.y - playerBox.max.y);

  return overlapsX && overlapsZ && headDistance <= tolerance;
}

export function applyQuestionBlockHit(blockState, hit, reward = 1) {
  if (!hit || blockState?.used) {
    return { ...blockState, reward: 0 };
  }

  return { ...blockState, used: true, reward };
}

export function updateSwimVelocityY(velocityY, input, config) {
  const swimUpImpulse = config?.swimUpImpulse ?? 0;
  const swimDownImpulse = config?.swimDownImpulse ?? 0;
  const swimBuoyancy = config?.swimBuoyancy ?? 0;
  const swimDrag = config?.swimDrag ?? 1;
  const swimMaxSpeed = config?.swimMaxSpeed ?? Infinity;

  let next = velocityY + swimBuoyancy;
  if (input?.ascend) {
    next += swimUpImpulse;
  } else {
    next -= swimDownImpulse;
  }
  next *= swimDrag;

  return clamp(next, -swimMaxSpeed, swimMaxSpeed);
}

export function getFallDeathY(settings, config) {
  if (settings?.fallDeathY === null) return null;
  if (Number.isFinite(settings?.fallDeathY)) return settings.fallDeathY;

  const worldMinY = settings?.worldMinY ?? config?.worldMinY;
  if (!Number.isFinite(worldMinY)) return null;

  const buffer = settings?.fallDeathBuffer ?? config?.fallDeathBuffer ?? 80;
  return worldMinY - buffer;
}

export function shouldTriggerFallDeath(playerY, settings, config) {
  const threshold = getFallDeathY(settings, config);
  if (!Number.isFinite(threshold)) return false;
  return playerY < threshold;
}

export function isInWaterVolumes(point, volumes = []) {
  return volumes.some((volume) => isPointInAabb(point, volume));
}

export function getSwimMoveVector(input, speed, cameraForward) {
  const forwardX = cameraForward?.x ?? 0;
  const forwardZ = cameraForward?.z ?? 0;
  const forwardLength = Math.hypot(forwardX, forwardZ);
  if (forwardLength === 0) return { x: 0, y: 0, z: 0 };

  const fx = forwardX / forwardLength;
  const fz = forwardZ / forwardLength;

  // right = forward x up(0,1,0)
  const rx = -fz;
  const ry = 0;
  const rz = fx;
  const rightLength = Math.hypot(rx, ry, rz) || 1;

  const rnx = rx / rightLength;
  const rny = ry / rightLength;
  const rnz = rz / rightLength;

  let moveX = 0;
  let moveY = 0;
  let moveZ = 0;

  if (input.forward) {
    moveX += fx;
    moveZ += fz;
  }
  if (input.backward) {
    moveX -= fx;
    moveZ -= fz;
  }
  if (input.right) {
    moveX += rnx;
    moveY += rny;
    moveZ += rnz;
  }
  if (input.left) {
    moveX -= rnx;
    moveY -= rny;
    moveZ -= rnz;
  }

  const moveLength = Math.hypot(moveX, moveZ);
  if (moveLength === 0) return { x: 0, y: 0, z: 0 };

  return {
    x: (moveX / moveLength) * speed,
    y: 0,
    z: (moveZ / moveLength) * speed,
  };
}

export function getSwimPose(move, velocityY) {
  const speed = Math.hypot(move.x ?? 0, move.z ?? 0);
  const basePitch = speed > 0.2 ? -0.5 : -0.25;
  const pitch = clamp(basePitch + (velocityY ?? 0) * 0.05, -0.75, 0.45);
  const roll = clamp((move.x ?? 0) * 0.04, -0.35, 0.35);
  return { pitch, roll };
}

function getAabbCenter(box) {
  return {
    x: (box.min.x + box.max.x) / 2,
    y: (box.min.y + box.max.y) / 2,
    z: (box.min.z + box.max.z) / 2,
  };
}

function getDistance3d(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

function isPointInAabb(point, box) {
  return (
    point.x >= box.min.x &&
    point.x <= box.max.x &&
    point.y >= box.min.y &&
    point.y <= box.max.y &&
    point.z >= box.min.z &&
    point.z <= box.max.z
  );
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
