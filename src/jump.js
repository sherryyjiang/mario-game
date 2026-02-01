export function stepJumpState(state, params) {
  const { radius, velocity, grounded } = state;
  const { baseRadius, jumpSpeed, gravity, deltaTime, jumpRequested } = params;

  let nextRadius = radius;
  let nextVelocity = velocity;
  let nextGrounded = grounded;

  if (nextGrounded && jumpRequested) {
    nextVelocity = jumpSpeed;
    nextGrounded = false;
  }

  if (!nextGrounded) {
    nextVelocity -= gravity * deltaTime;
    nextRadius += nextVelocity * deltaTime;

    if (nextRadius <= baseRadius) {
      nextRadius = baseRadius;
      nextVelocity = 0;
      nextGrounded = true;
    }
  }

  return {
    radius: nextRadius,
    velocity: nextVelocity,
    grounded: nextGrounded,
  };
}
