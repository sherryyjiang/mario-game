import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { scene } from '../scene.js';
import { createBox } from '../helpers.js';
import { getAabbFromCenter } from '../game/logic.js';
import { createStonePlatform, createSpinningPlatform, createCheckpoint } from '../platforms.js';
import {
  createBobOmb,
  createFireJet,
  createFireball,
  createRollingLog,
} from '../enemies.js';
import { createQuestionBlock } from '../scenery.js';

export function initLavaLevel() {
  const lavaSurfaceY = -60;

  const state = {
    name: 'Lava Foundry',
    objects: [],
    platforms: [],
    spinningPlatforms: [],
    movingPlatforms: [],
    hazards: [],
    questionBlocks: [],
    checkpoints: [],
    checkpointBoxes: [],
    coinLayout: [],
    waterVolumes: [],
    goal: null,
    updateEnvironment: null,
    settings: {
      worldMinX: 0,
      worldMaxX: 3200,
      worldMinY: -200,
      worldMaxY: 500,
      worldMinZ: -500,
      worldMaxZ: 500,
      groundTopY: 30,
      waterLevel: -999,
      waterVolumes: [],
      playerStart: { x: 140, y: 40, z: 0 },
      goalRequiredCoins: 25,
      fallDeathY: lavaSurfaceY + CONFIG.playerHeight / 2 - 2,
    },
    theme: {
      skyTopColor: 0x3b0b0b,
      skyBottomColor: 0x8b1a1a,
      skyEndColor: 0x2a0707,
      fogColor: 0x2a0707,
      fogNear: 200,
      fogFar: 2000,
      ambientColor: 0x442222,
      ambientIntensity: 0.4,
      hemiSkyColor: 0x8a2e2e,
      hemiGroundColor: 0x1a0b0b,
      hemiIntensity: 0.35,
      sunColor: 0xffd1a3,
      sunIntensity: 0.9,
      sunPosition: new THREE.Vector3(200, 380, 140),
      secondaryColor: 0xff6b2b,
      secondaryIntensity: 0.25,
      secondaryPosition: new THREE.Vector3(-280, 220, -180),
    },
  };

  const basaltMaterial = new THREE.MeshStandardMaterial({
    color: 0x3a2b2b,
    roughness: 0.9,
    metalness: 0.1,
  });
  const bridgeMaterial = new THREE.MeshStandardMaterial({
    color: 0x686868,
    roughness: 0.4,
    metalness: 0.5,
  });
  const lavaMaterial = new THREE.MeshStandardMaterial({
    color: 0xff4d1a,
    emissive: 0xff2200,
    emissiveIntensity: 0.6,
    roughness: 0.45,
    metalness: 0.1,
  });

  function add(object) {
    scene.add(object);
    state.objects.push(object);
    return object;
  }

  function addPlatform(mesh, type = 'stone') {
    add(mesh);
    state.platforms.push({ mesh, type });
  }

  function addMovingPlatform(mesh) {
    add(mesh);
    state.movingPlatforms.push(mesh);
    state.platforms.push({ mesh, type: 'moving' });
  }

  function createLavaSea() {
    const lava = new THREE.Mesh(new THREE.PlaneGeometry(3800, 1400), lavaMaterial);
    lava.rotation.x = -Math.PI / 2;
    lava.position.set(1600, lavaSurfaceY, 0);
    lava.receiveShadow = false;
    add(lava);
    state.lavaSurface = lava;
  }

  function createStartPlatforms() {
    const start = createStonePlatform({
      width: 240,
      height: 20,
      depth: 220,
      material: basaltMaterial.clone(),
    });
    start.position.set(160, 30, 0);
    addPlatform(start, 'stone');

    const step1 = createStonePlatform({
      width: 120,
      height: 16,
      depth: 100,
      material: basaltMaterial.clone(),
    });
    step1.position.set(360, 50, -80);
    addPlatform(step1, 'stone');

    const step2 = createStonePlatform({
      width: 120,
      height: 16,
      depth: 100,
      material: basaltMaterial.clone(),
    });
    step2.position.set(520, 60, 80);
    addPlatform(step2, 'stone');
  }

  function createMovingBlocks() {
    const mover1 = createStonePlatform({
      width: 90,
      height: 16,
      depth: 90,
      material: basaltMaterial.clone(),
    });
    mover1.basePosition = new THREE.Vector3(700, 70, -140);
    mover1.position.copy(mover1.basePosition);
    mover1.moveAxis = 'z';
    mover1.moveAmplitude = 140;
    mover1.moveSpeed = 0.9;
    addMovingPlatform(mover1);

    const mover2 = createStonePlatform({
      width: 90,
      height: 16,
      depth: 90,
      material: basaltMaterial.clone(),
    });
    mover2.basePosition = new THREE.Vector3(860, 70, 140);
    mover2.position.copy(mover2.basePosition);
    mover2.moveAxis = 'x';
    mover2.moveAmplitude = 120;
    mover2.moveSpeed = 1.1;
    addMovingPlatform(mover2);
  }

  function createRisingBridges() {
    const bridge1 = createStonePlatform({
      width: 240,
      height: 18,
      depth: 80,
      material: bridgeMaterial.clone(),
    });
    bridge1.basePosition = new THREE.Vector3(1040, 70, 0);
    bridge1.position.copy(bridge1.basePosition);
    bridge1.moveAxis = 'y';
    bridge1.moveAmplitude = 60;
    bridge1.moveSpeed = 0.6;
    addMovingPlatform(bridge1);

    const bridge2 = createStonePlatform({
      width: 220,
      height: 18,
      depth: 80,
      material: bridgeMaterial.clone(),
    });
    bridge2.basePosition = new THREE.Vector3(1320, 90, 0);
    bridge2.position.copy(bridge2.basePosition);
    bridge2.moveAxis = 'y';
    bridge2.moveAmplitude = 80;
    bridge2.moveSpeed = 0.8;
    addMovingPlatform(bridge2);
  }

  function createFireJets() {
    const jetPositions = [
      { x: 980, z: -180 },
      { x: 1180, z: 160 },
      { x: 1500, z: -120 },
      { x: 1680, z: 140 },
      { x: 1960, z: 0 },
    ];

    for (const pos of jetPositions) {
      const jet = createFireJet({ radius: 10, minHeight: 12, maxHeight: 90, pulseSpeed: 1.2 });
      jet.userData.basePosition = new THREE.Vector3(pos.x, lavaSurfaceY, pos.z);
      add(jet);
      state.hazards.push(jet);
    }
  }

  function createFireArcs() {
    const arc1 = createFireball({ radius: 7 });
    arc1.userData.path = {
      start: new THREE.Vector3(1600, lavaSurfaceY + 10, -200),
      end: new THREE.Vector3(1600, lavaSurfaceY + 10, 200),
      arcHeight: 90,
      travelSpeed: 0.35,
      phase: 0,
    };
    add(arc1);
    state.hazards.push(arc1);

    const arc2 = createFireball({ radius: 7 });
    arc2.userData.path = {
      start: new THREE.Vector3(1860, lavaSurfaceY + 10, 220),
      end: new THREE.Vector3(1860, lavaSurfaceY + 10, -220),
      arcHeight: 70,
      travelSpeed: 0.45,
      phase: 0.4,
    };
    add(arc2);
    state.hazards.push(arc2);
  }

  function createSpinningPlatforms() {
    const spin = createSpinningPlatform({
      width: 100,
      height: 16,
      depth: 100,
      material: bridgeMaterial.clone(),
    });
    spin.position.set(1560, 110, 0);
    spin.spinSpeed = 0.8;
    add(spin);
    state.spinningPlatforms.push(spin);
    state.platforms.push({ mesh: spin, type: 'spinning' });
  }

  function createRollingLogHazard() {
    const log = createRollingLog({ length: 160, radius: 12 });
    log.position.set(2140, lavaSurfaceY + 12, 0);
    log.userData.basePosition = log.position.clone();
    log.userData.moveAxis = 'x';
    log.userData.moveAmplitude = 160;
    log.userData.moveSpeed = 0.6;
    log.userData.rollSpeed = 3.2;
    add(log);
    state.hazards.push(log);
  }

  function createLatePlatforms() {
    const anchor = createStonePlatform({
      width: 180,
      height: 18,
      depth: 140,
      material: basaltMaterial.clone(),
    });
    anchor.position.set(2040, 90, -120);
    addPlatform(anchor, 'stone');

    const mover = createStonePlatform({
      width: 120,
      height: 16,
      depth: 120,
      material: basaltMaterial.clone(),
    });
    mover.basePosition = new THREE.Vector3(2340, 110, 120);
    mover.position.copy(mover.basePosition);
    mover.moveAxis = 'z';
    mover.moveAmplitude = 160;
    mover.moveSpeed = 0.9;
    addMovingPlatform(mover);

    const rise1 = createStonePlatform({
      width: 120,
      height: 16,
      depth: 120,
      material: basaltMaterial.clone(),
    });
    rise1.position.set(2580, 130, -80);
    addPlatform(rise1, 'stone');

    const rise2 = createStonePlatform({
      width: 140,
      height: 16,
      depth: 140,
      material: basaltMaterial.clone(),
    });
    rise2.position.set(2820, 150, 60);
    addPlatform(rise2, 'stone');
  }

  function createQuestionBlocks() {
    const blockPositions = [
      { x: 520, y: 110, z: 0 },
      { x: 1460, y: 140, z: -60 },
      { x: 2480, y: 170, z: 120 },
    ];

    for (const pos of blockPositions) {
      const block = createQuestionBlock();
      block.position.set(pos.x, pos.y, pos.z);
      add(block);
      state.questionBlocks.push(block);
    }
  }

  function createBobOmbs() {
    const placements = [
      { x: 420, y: 70, z: 40, patrol: false },
      { x: 1120, y: 90, z: -120, patrol: true, patrolAxis: 'z' },
      { x: 1780, y: 110, z: 80, patrol: true, patrolAxis: 'x' },
    ];

    for (const placement of placements) {
      const bob = createBobOmb();
      bob.position.set(placement.x, placement.y, placement.z);
      bob.baseY = placement.y;
      if (placement.patrol) {
        bob.basePosition = new THREE.Vector3(placement.x, placement.y, placement.z);
        bob.patrolDistance = 60;
        bob.patrolSpeed = 1.1;
        bob.patrolAxis = placement.patrolAxis;
        bob.isPatrolling = true;
      }
      add(bob);
      state.hazards.push(bob);
    }
  }

  const checkpointData = [
    { id: 'start', position: { x: 180, y: 60, z: 0 } },
    { id: 'bridge', position: { x: 1160, y: 120, z: 0 } },
    { id: 'forge', position: { x: 1900, y: 130, z: 0 } },
    { id: 'log', position: { x: 2460, y: 150, z: 0 } },
  ];

  function createCheckpoints() {
    state.checkpoints = checkpointData.map((entry) => {
      const { group, pole, flag } = createCheckpoint({
        poleColor: CONFIG.checkpointColor,
        flagColor: CONFIG.checkpointFlagColor,
      });
      group.position.set(entry.position.x, entry.position.y, entry.position.z);
      add(group);
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

    state.checkpointBoxes = state.checkpoints.map((cp) => ({
      id: cp.id,
      position: cp.position,
      checkpoint: cp,
      box: getAabbFromCenter(cp.position, cp.collisionSize),
    }));
  }

  function generateCoinLayout() {
    for (let i = 0; i < 10; i++) {
      state.coinLayout.push({
        position: {
          x: 200 + i * 70,
          y: 90 + Math.sin(i * 0.5) * 18,
          z: Math.sin(i * 0.4) * 60,
        },
        radius: 15,
      });
    }

    for (let i = 0; i < 12; i++) {
      state.coinLayout.push({
        position: {
          x: 980 + i * 60,
          y: 120 + Math.sin(i * 0.3) * 20,
          z: Math.cos(i * 0.6) * 80,
        },
        radius: 15,
      });
    }

    for (let i = 0; i < 12; i++) {
      state.coinLayout.push({
        position: {
          x: 1720 + i * 70,
          y: 140 + Math.sin(i * 0.4) * 24,
          z: Math.sin(i * 0.5) * 120,
        },
        radius: 15,
      });
    }
  }

  function createGoal() {
    state.goal = createBox({
      width: CONFIG.goalWidth,
      height: CONFIG.goalHeight,
      depth: CONFIG.goalDepth,
      material: new THREE.MeshStandardMaterial({
        color: 0xffb74d,
        emissive: 0xff7f2a,
        emissiveIntensity: 0.4,
      }),
    });
    state.goal.position.set(3040, 180, 0);
    state.goal.size = { width: CONFIG.goalWidth, height: CONFIG.goalHeight, depth: CONFIG.goalDepth };
    state.goal.userData.activeColor = 0xffb74d;
    state.goal.userData.lockedColor = 0x3b1d1d;
    add(state.goal);
  }

  function updateLavaGlow(elapsed) {
    lavaMaterial.emissiveIntensity = 0.55 + Math.sin(elapsed * 2.4) * 0.12;
  }

  createLavaSea();
  createStartPlatforms();
  createMovingBlocks();
  createRisingBridges();
  createFireJets();
  createFireArcs();
  createSpinningPlatforms();
  createRollingLogHazard();
  createLatePlatforms();
  createQuestionBlocks();
  createBobOmbs();
  createCheckpoints();
  generateCoinLayout();
  createGoal();

  state.updateEnvironment = updateLavaGlow;

  return state;
}

export function clearLavaLevel(state) {
  for (const object of state.objects) {
    scene.remove(object);
  }
}
