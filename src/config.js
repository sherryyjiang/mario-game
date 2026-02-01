// Configuration - Sky Castle Theme
export const CONFIG = {
  // View settings
  viewWidth: 1200,
  viewHeight: 600,
  
  // World bounds - Default (Sky)
  worldMinX: 0,
  worldMaxX: 4000,
  worldMinY: -200,
  worldMaxY: 900,
  worldMinZ: -400,
  worldMaxZ: 400,
  
  // Ground settings
  groundTopY: 50,
  groundDepth: 800,
  
  // Player settings
  playerWidth: 30,
  playerHeight: 40,
  playerDepth: 30,
  playerStartX: 80,
  playerStartZ: 80,
  
  // Physics
  moveSpeed: 6,
  gravity: -0.6,
  jumpVelocity: 14,
  landingTolerance: 8,
  swimMoveSpeed: 4.4,
  swimUpImpulse: 0.44,
  swimDownImpulse: 2.4,
  swimBuoyancy: 0.18,
  swimDrag: 0.9,
  swimMaxSpeed: 6,
  
  // Camera
  cameraDistance: 350,
  cameraPhi: 1.1,
  cameraTheta: Math.PI * 0.75,
  cameraTargetHeight: 70,
  cameraFollowSpeed: 6,
  cameraMinY: -40,
  cameraRotateSpeed: 0.006,
  cameraFirstPersonHeight: 24,
  cameraFirstPersonForwardOffset: 8,
  cameraFirstPersonLookDistance: 120,
  cameraFirstPersonPitchMin: -0.6,
  cameraFirstPersonPitchMax: 0.6,
  
  // Colors - Sky Castle Theme
  skyTopColor: 0x4a90d9,
  skyBottomColor: 0x87ceeb,
  fogColor: 0x87ceeb,
  cloudColor: 0xffffff,
  rainbowColors: [0xff0000, 0xff7f00, 0xffff00, 0x00ff00, 0x0000ff, 0x8b00ff],
  stoneColor: 0xa0a0a0,
  stoneDarkColor: 0x808080,
  goldColor: 0xffd700,
  glassColor: 0xadd8e6,
  playerBodyColor: 0x3498db,
  playerCapColor: 0xe74c3c,
  hazardColor: 0xff6a00,
  checkpointColor: 0xffffff,
  checkpointActiveColor: 0x7fff00,
  checkpointFlagColor: 0xffd1dc,
  goalColor: 0xff69b4,
  coinColor: 0xffd700,
  coralColors: [0xff8fab, 0xffc857, 0x7ee8a7, 0x8ab6ff],
  
  // Checkpoint/goal settings
  checkpointPoleWidth: 12,
  checkpointPoleHeight: 70,
  checkpointPoleDepth: 12,
  checkpointFlagWidth: 28,
  checkpointFlagHeight: 18,
  checkpointFlagDepth: 8,
  goalWidth: 30,
  goalHeight: 120,
  goalDepth: 30,
  goalRequiredCoins: 20,
  
  // Question blocks
  questionBlockHitTolerance: 5,
  questionBlockRewardCoins: 3,
  questionBlockBounceHeight: 10,
  
  // Jump pad
  jumpPadBoost: 20,

  // Player rotation
  playerTurnSpeed: 12,

  // Water
  waterLevel: 180,
  waterSurfaceOpacity: 0.35,
};
