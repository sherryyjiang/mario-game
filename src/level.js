import * as THREE from 'three';
import { CONFIG } from './config.js';
import { scene } from './scene.js';
import { createBox, getBoxAabb, goldMaterial } from './helpers.js';
import { getAabbFromCenter } from './game/logic.js';
import { 
  createCloudPlatform, 
  createRainbowPlatform, 
  createStonePlatform, 
  createGlassPlatform, 
  createSpinningPlatform,
  createCheckpoint 
} from './platforms.js';
import { createGoomba } from './enemies.js';
import {
  createTree,
  createCastle,
  createBackgroundCloud,
  createPipe,
  createQuestionBlock,
  createBush,
  createFlower,
} from './scenery.js';

// Level data
export const platforms = [];
export const spinningPlatforms = [];
export const movingPlatforms = [];
export const hazards = [];
export const questionBlocks = [];

// Section 1: Cloud Approach (x: 0-1000)
function createSection1() {
  const startCloud = createCloudPlatform({ width: 300, height: 40, depth: 300 });
  startCloud.position.set(150, 30, 0);
  scene.add(startCloud);
  platforms.push({ mesh: startCloud, type: 'cloud' });
  
  const cloudPositions = [
    { x: 350, y: 80, z: -50 },
    { x: 480, y: 120, z: 80 },
    { x: 600, y: 100, z: -20 },
    { x: 720, y: 150, z: 100 },
    { x: 850, y: 130, z: -60 },
    { x: 950, y: 180, z: 40 },
    { x: 400, y: 60, z: 150 },
    { x: 550, y: 90, z: -150 },
  ];
  
  for (const pos of cloudPositions) {
    const cloud = createCloudPlatform({
      width: 100 + Math.random() * 40,
      height: 20,
      depth: 80 + Math.random() * 30,
    });
    cloud.position.set(pos.x, pos.y, pos.z);
    scene.add(cloud);
    platforms.push({ mesh: cloud, type: 'cloud' });
  }
}

// Section 2: Rainbow Bridge (x: 1000-2000)
function createSection2() {
  const rainbowPath = [
    { x: 1050, y: 200, z: 0, colorIndex: 0 },
    { x: 1150, y: 220, z: 50, colorIndex: 1 },
    { x: 1250, y: 240, z: 0, colorIndex: 2 },
    { x: 1350, y: 260, z: -50, colorIndex: 3 },
    { x: 1450, y: 250, z: 0, colorIndex: 4 },
    { x: 1550, y: 230, z: 50, colorIndex: 5 },
    { x: 1650, y: 210, z: 0, colorIndex: 0 },
    { x: 1750, y: 190, z: -50, colorIndex: 1 },
    { x: 1850, y: 180, z: 0, colorIndex: 2 },
    { x: 1950, y: 200, z: 50, colorIndex: 3 },
  ];
  
  for (const pos of rainbowPath) {
    const platform = createRainbowPlatform({
      width: 90,
      height: 15,
      depth: 90,
      colorIndex: pos.colorIndex,
    });
    platform.position.set(pos.x, pos.y, pos.z);
    scene.add(platform);
    platforms.push({ mesh: platform, type: 'rainbow' });
  }
  
  // Moving platforms
  const moving1 = createRainbowPlatform({ width: 100, height: 15, depth: 80, colorIndex: 4 });
  moving1.basePosition = new THREE.Vector3(1200, 280, -100);
  moving1.position.copy(moving1.basePosition);
  moving1.moveAxis = 'z';
  moving1.moveAmplitude = 100;
  moving1.moveSpeed = 1.0;
  scene.add(moving1);
  movingPlatforms.push(moving1);
  platforms.push({ mesh: moving1, type: 'moving' });
  
  const moving2 = createRainbowPlatform({ width: 90, height: 15, depth: 90, colorIndex: 5 });
  moving2.basePosition = new THREE.Vector3(1600, 260, 100);
  moving2.position.copy(moving2.basePosition);
  moving2.moveAxis = 'x';
  moving2.moveAmplitude = 80;
  moving2.moveSpeed = 0.8;
  scene.add(moving2);
  movingPlatforms.push(moving2);
  platforms.push({ mesh: moving2, type: 'moving' });
  
  // Safety clouds
  const safetyCloud1 = createCloudPlatform({ width: 200, height: 20, depth: 150 });
  safetyCloud1.position.set(1200, 100, 0);
  scene.add(safetyCloud1);
  platforms.push({ mesh: safetyCloud1, type: 'cloud' });
  
  const safetyCloud2 = createCloudPlatform({ width: 180, height: 20, depth: 150 });
  safetyCloud2.position.set(1600, 110, 0);
  scene.add(safetyCloud2);
  platforms.push({ mesh: safetyCloud2, type: 'cloud' });
}

// Section 3: Castle Exterior (x: 2000-3200)
function createSection3() {
  const castle = createCastle();
  castle.position.set(2700, 0, 0);
  scene.add(castle);
  
  const stonePositions = [
    { x: 2050, y: 180, z: 0 },
    { x: 2150, y: 220, z: -80 },
    { x: 2250, y: 270, z: 0 },
    { x: 2350, y: 320, z: 80 },
    { x: 2450, y: 380, z: 0 },
    { x: 2550, y: 450, z: -100 },
    { x: 2600, y: 520, z: 0 },
    { x: 2650, y: 590, z: 100 },
    { x: 2750, y: 650, z: 0 },
    { x: 2850, y: 600, z: -80 },
    { x: 2950, y: 550, z: 0 },
    { x: 3050, y: 500, z: 80 },
  ];
  
  for (const pos of stonePositions) {
    const platform = createStonePlatform({
      width: 80 + Math.random() * 30,
      height: 18,
      depth: 80 + Math.random() * 20,
    });
    platform.position.set(pos.x, pos.y, pos.z);
    scene.add(platform);
    platforms.push({ mesh: platform, type: 'stone' });
  }
  
  // Spinning platforms
  const spin1 = createSpinningPlatform({
    width: 100,
    height: 15,
    depth: 100,
    material: goldMaterial.clone(),
  });
  spin1.position.set(2200, 200, 100);
  scene.add(spin1);
  spinningPlatforms.push(spin1);
  platforms.push({ mesh: spin1, type: 'spinning' });
  
  const spin2 = createSpinningPlatform({
    width: 90,
    height: 15,
    depth: 90,
    material: goldMaterial.clone(),
  });
  spin2.position.set(2800, 550, -150);
  spin2.spinSpeed = 0.7;
  scene.add(spin2);
  spinningPlatforms.push(spin2);
  platforms.push({ mesh: spin2, type: 'spinning' });
  
  // Glass platform
  const glass1 = createGlassPlatform({ width: 120, height: 12, depth: 100 });
  glass1.position.set(2400, 350, -120);
  scene.add(glass1);
  platforms.push({ mesh: glass1, type: 'glass' });
}

// Section 4: Rooftop (x: 3200-4000)
function createSection4() {
  const rooftopPositions = [
    { x: 3250, y: 480, z: 0 },
    { x: 3350, y: 500, z: -60 },
    { x: 3450, y: 520, z: 40 },
    { x: 3550, y: 550, z: 0 },
    { x: 3700, y: 600, z: -50 },
    { x: 3850, y: 650, z: 50 },
  ];
  
  for (const pos of rooftopPositions) {
    const platform = createStonePlatform({ width: 100, height: 18, depth: 90 });
    platform.position.set(pos.x, pos.y, pos.z);
    scene.add(platform);
    platforms.push({ mesh: platform, type: 'stone' });
  }
  
  const finalSpin = createSpinningPlatform({
    width: 120,
    height: 15,
    depth: 120,
    material: goldMaterial.clone(),
  });
  finalSpin.position.set(3950, 680, 0);
  finalSpin.spinSpeed = 0.3;
  scene.add(finalSpin);
  spinningPlatforms.push(finalSpin);
  platforms.push({ mesh: finalSpin, type: 'spinning' });
}

// Hazards
function createHazards() {
  const hazardPositions = [
    { x: 500, y: 80, z: 30, patrol: true, patrolDist: 60 },
    { x: 1400, y: 240, z: 0, patrol: false },
    { x: 1700, y: 200, z: 30, patrol: true, patrolDist: 80 },
    { x: 2300, y: 300, z: -40, patrol: true, patrolDist: 100 },
    { x: 2700, y: 620, z: 50, patrol: false },
  ];

  for (const hpos of hazardPositions) {
    const hazard = createGoomba();
    hazard.position.set(hpos.x, hpos.y, hpos.z);
    hazard.baseY = hpos.y;
    if (hpos.patrol) {
      hazard.basePosition = new THREE.Vector3(hpos.x, hpos.y, hpos.z);
      hazard.patrolDistance = hpos.patrolDist;
      hazard.patrolSpeed = 1.2;
      hazard.isPatrolling = true;
    }
    scene.add(hazard);
    hazards.push(hazard);
  }
}

// Checkpoints
export const checkpointData = [
  { id: 'start', position: { x: 100, y: 50, z: 0 } },
  { id: 'cloud1', position: { x: 600, y: 120, z: -20 } },
  { id: 'cloud2', position: { x: 950, y: 200, z: 40 } },
  { id: 'rainbow1', position: { x: 1250, y: 260, z: 0 } },
  { id: 'rainbow2', position: { x: 1750, y: 210, z: -50 } },
  { id: 'castle1', position: { x: 2250, y: 290, z: 0 } },
  { id: 'castle2', position: { x: 2650, y: 610, z: 0 } },
  { id: 'castle3', position: { x: 3050, y: 520, z: 80 } },
  { id: 'rooftop1', position: { x: 3550, y: 570, z: 0 } },
  { id: 'rooftop2', position: { x: 3850, y: 670, z: 50 } },
];

export let checkpoints = [];
export let checkpointBoxes = [];

function createCheckpoints() {
  checkpoints = checkpointData.map((entry) => {
    const { group, pole, flag } = createCheckpoint({
      poleColor: CONFIG.checkpointColor,
      flagColor: CONFIG.checkpointFlagColor,
    });
    group.position.set(entry.position.x, entry.position.y, entry.position.z);
    scene.add(group);
    return {
      id: entry.id,
      position: entry.position,
      group,
      pole,
      flag,
      collisionSize: {
        width: CONFIG.checkpointPoleWidth + 30,
        height: CONFIG.checkpointPoleHeight,
        depth: CONFIG.checkpointPoleDepth + 30,
      },
    };
  });

  checkpointBoxes = checkpoints.map((cp) => ({
    id: cp.id,
    position: cp.position,
    checkpoint: cp,
    box: getAabbFromCenter(cp.position, cp.collisionSize),
  }));
}

// Coins
export const coinLayout = [];

function generateCoinLayout() {
  // Section 1 (12 coins)
  for (let i = 0; i < 12; i++) {
    coinLayout.push({
      position: { 
        x: 100 + i * 70, 
        y: 80 + Math.sin(i * 0.5) * 30, 
        z: Math.sin(i * 0.8) * 80 
      },
      radius: 15,
    });
  }
  
  // Section 2 (15 coins)
  for (let i = 0; i < 15; i++) {
    coinLayout.push({
      position: { 
        x: 1050 + i * 60, 
        y: 240 + Math.sin(i * 0.4) * 40, 
        z: Math.cos(i * 0.6) * 60 
      },
      radius: 15,
    });
  }
  
  // Section 3 (15 coins)
  for (let i = 0; i < 15; i++) {
    coinLayout.push({
      position: { 
        x: 2050 + i * 70, 
        y: 250 + i * 25, 
        z: Math.sin(i * 0.7) * 100 
      },
      radius: 15,
    });
  }
  
  // Section 4 (10 coins)
  for (let i = 0; i < 10; i++) {
    coinLayout.push({
      position: { 
        x: 3250 + i * 75, 
        y: 530 + i * 15, 
        z: Math.cos(i * 0.5) * 60 
      },
      radius: 15,
    });
  }
}

// Background clouds
export const backgroundClouds = [];

function createBackgroundClouds() {
  for (let i = 0; i < 20; i++) {
    const cloud = createBackgroundCloud(40 + Math.random() * 60);
    cloud.position.set(
      Math.random() * 5000 - 500,
      200 + Math.random() * 400,
      -600 - Math.random() * 400
    );
    cloud.parallaxSpeed = 0.1 + Math.random() * 0.2;
    scene.add(cloud);
    backgroundClouds.push(cloud);
  }
}

// Decorative trees
function addDecorativeTrees() {
  const treePlacements = [
    { position: { x: 180, y: 50, z: -80 }, style: 'round' },
    { position: { x: 480, y: 130, z: 110 }, style: 'round' },
    { position: { x: 850, y: 140, z: -20 }, style: 'tall' },
    { position: { x: 1250, y: 248, z: -40 }, style: 'round' },
    { position: { x: 2250, y: 279, z: 120 }, style: 'tall' },
  ];

  for (const placement of treePlacements) {
    const tree = createTree(placement.style);
    tree.position.set(placement.position.x, placement.position.y, placement.position.z);
    scene.add(tree);
  }
}

function addDecorativePipes() {
  const pipePlacements = [
    { x: 320, y: CONFIG.groundTopY, z: 140, height: 70 },
    { x: 1180, y: 210, z: -140, height: 60 },
    { x: 2500, y: 470, z: 140, height: 80 },
  ];

  for (const placement of pipePlacements) {
    const pipe = createPipe(placement.height);
    pipe.position.set(placement.x, placement.y, placement.z);
    scene.add(pipe);
  }
}

function addQuestionBlocks() {
  const blockPlacements = [
    { x: 520, y: 175, z: 60 },
    { x: 1320, y: 300, z: -20 },
    { x: 2480, y: 420, z: 40 },
  ];

  for (const placement of blockPlacements) {
    const block = createQuestionBlock();
    block.position.set(placement.x, placement.y, placement.z);
    scene.add(block);
    questionBlocks.push(block);
  }
}

function addBushesAndFlowers() {
  const bushPlacements = [
    { x: 260, y: CONFIG.groundTopY, z: -150 },
    { x: 760, y: 130, z: 140 },
    { x: 2100, y: 190, z: -160 },
  ];

  for (const placement of bushPlacements) {
    const bush = createBush();
    bush.position.set(placement.x, placement.y, placement.z);
    scene.add(bush);
  }

  const flowerPlacements = [
    { x: 360, y: CONFIG.groundTopY, z: -90, color: 0xff69b4 },
    { x: 1220, y: 220, z: 160, color: 0x87cefa },
    { x: 2600, y: 500, z: -120, color: 0xffd1dc },
  ];

  for (const placement of flowerPlacements) {
    const flower = createFlower(placement.color);
    flower.position.set(placement.x, placement.y, placement.z);
    scene.add(flower);
  }
}

// Goal
export let goal;

function createGoal() {
  goal = createBox({
    width: CONFIG.goalWidth,
    height: CONFIG.goalHeight,
    depth: CONFIG.goalDepth,
    material: new THREE.MeshStandardMaterial({
      color: CONFIG.goalColor,
      emissive: 0xff69b4,
      emissiveIntensity: 0.4,
    }),
  });
  goal.position.set(3980, 750, 0);
  goal.size = { width: CONFIG.goalWidth, height: CONFIG.goalHeight, depth: CONFIG.goalDepth };
  scene.add(goal);
}

// Initialize level
export function initLevel() {
  generateCoinLayout();
  createSection1();
  createSection2();
  createSection3();
  createSection4();
  createHazards();
  createCheckpoints();
  createBackgroundClouds();
  addDecorativeTrees();
  addDecorativePipes();
  addQuestionBlocks();
  addBushesAndFlowers();
  createGoal();
}

export function updateBackgroundClouds() {
  for (const cloud of backgroundClouds) {
    cloud.position.x -= cloud.parallaxSpeed;
    if (cloud.position.x < -500) {
      cloud.position.x = 5000;
    }
  }
}
