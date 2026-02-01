export function getMoveVector(input, speed) {
  const x = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  const z = (input.backward ? 1 : 0) - (input.forward ? 1 : 0);

  if (x === 0 && z === 0) return { x: 0, z: 0 };

  const length = Math.hypot(x, z);
  return { x: (x / length) * speed, z: (z / length) * speed };
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
