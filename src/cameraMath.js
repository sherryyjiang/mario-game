export function getForwardVector(yaw, pitch) {
  const cosPitch = Math.cos(pitch);
  return {
    x: Math.sin(yaw) * cosPitch,
    y: Math.sin(pitch),
    z: -Math.cos(yaw) * cosPitch,
  };
}

export function getFirstPersonView(position, orientation = {}, options = {}) {
  const { yaw = 0, pitch = 0 } = orientation;
  const { eyeHeight = 0, forwardOffset = 0, lookDistance = 1 } = options;

  const forward = getForwardVector(yaw, pitch);
  const flatLength = Math.hypot(forward.x, forward.z);
  const flatForward =
    flatLength === 0
      ? { x: 0, z: 0 }
      : { x: forward.x / flatLength, z: forward.z / flatLength };

  const positionOut = {
    x: position.x + flatForward.x * forwardOffset,
    y: position.y + eyeHeight,
    z: position.z + flatForward.z * forwardOffset,
  };

  const lookTarget = {
    x: positionOut.x + forward.x * lookDistance,
    y: positionOut.y + forward.y * lookDistance,
    z: positionOut.z + forward.z * lookDistance,
  };

  return { position: positionOut, lookTarget, forward };
}
