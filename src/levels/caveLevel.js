import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { scene } from '../scene.js';
import { createBox, goldMaterial } from '../helpers.js';
import { getAabbFromCenter } from '../game/logic.js';
import {
  createStonePlatform,
  createGlassPlatform,
  createSpinningPlatform,
  createCheckpoint,
} from '../platforms.js';
import { createGoomba, createEelBoss } from '../enemies.js';
import {
  createQuestionBlock,
  createCavePillar,
  createStalactite,
  createStalagmite,
  createCoral,
  createSeaweed,
  createRock,
  createFish,
  updateFishSwim,
  createTreasureChest,
  createClam,
  createShipwreck,
  createBubbleColumn,
  advanceBubbleParticles,
} from '../scenery.js';

export function initCaveLevel() {
  const state = {
    name: 'Underwater Cave',
    objects: [],
    platforms: [],
    spinningPlatforms: [],
    movingPlatforms: [],
    hazards: [],
    questionBlocks: [],
    checkpoints: [],
    checkpointBoxes: [],
    coinLayout: [],
    bubbleColumns: [],
    fish: [],
    treasureChests: [],
    waterVolumes: [],
    eelBoss: null,
    goal: null,
    updateEnvironment: null,
    settings: {
      worldMinX: 0,
      worldMaxX: 2600,
      worldMinY: -260,
      worldMaxY: 260,
      worldMinZ: -600,
      worldMaxZ: 600,
      groundTopY: 0,
      waterLevel: 180,
      waterVolumes: [],
      showWaterSurface: false,
      playerStart: { x: 120, y: 110, z: 0 },
      startCheckpointId: null,
      goalRequiredCoins: 25,
      goalType: 'treasure',
    },
    theme: {
      skyTopColor: 0x0c2f4a,
      skyBottomColor: 0x04121f,
      skyEndColor: 0x04121f,
      fogColor: 0x0b2c3f,
      fogNear: 200,
      fogFar: 1600,
      ambientColor: 0x9bd4ff,
      ambientIntensity: 0.4,
      hemiSkyColor: 0x4aa0c8,
      hemiGroundColor: 0x071a24,
      hemiIntensity: 0.35,
      sunColor: 0xd6f1ff,
      sunIntensity: 0.6,
      sunPosition: new THREE.Vector3(120, 500, 180),
      secondaryColor: 0x7fb8d8,
      secondaryIntensity: 0.2,
      secondaryPosition: new THREE.Vector3(-260, 320, -200),
    },
  };

  const caveStone = new THREE.MeshStandardMaterial({
    color: 0x2c3e50,
    roughness: 0.9,
    metalness: 0.1,
  });
  const caveDark = new THREE.MeshStandardMaterial({
    color: 0x1a242f,
    roughness: 0.95,
    metalness: 0.05,
  });
  const caveGlass = new THREE.MeshStandardMaterial({
    color: 0x5aa9c8,
    transparent: true,
    opacity: 0.35,
    roughness: 0.1,
    metalness: 0.2,
  });
  const caveBrown = new THREE.MeshStandardMaterial({
    color: 0x6b4a2b,
    roughness: 0.95,
    metalness: 0.05,
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

  function createWaterSurfaces() {
    if (state.settings.showWaterSurface === false) return;
    for (const volume of state.settings.waterVolumes) {
      const width = volume.max.x - volume.min.x + 120;
      const depth = volume.max.z - volume.min.z + 120;
      const surface = new THREE.Mesh(
        new THREE.PlaneGeometry(width, depth),
        new THREE.MeshStandardMaterial({
          color: 0x2c6f91,
          transparent: true,
          opacity: CONFIG.waterSurfaceOpacity,
          roughness: 0.2,
          side: THREE.DoubleSide,
        })
      );
      surface.rotation.x = -Math.PI / 2;
      surface.position.set(
        (volume.min.x + volume.max.x) / 2,
        state.settings.waterLevel,
        (volume.min.z + volume.max.z) / 2
      );
      surface.receiveShadow = false;
      add(surface);
    }
  }

  function createCaveDome() {
    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(2200, 32, 16),
      new THREE.MeshStandardMaterial({
        color: caveDark.color,
        side: THREE.BackSide,
        roughness: 1,
      })
    );
    dome.position.set(1200, -500, 0);
    dome.scale.set(1, 0.6, 0.6);
    dome.receiveShadow = false;
    add(dome);
  }

  function createBaseFloor() {
    const floor = createStonePlatform({
      width: 2800,
      height: 40,
      depth: 1400,
      material: caveStone.clone(),
    });
    floor.position.set(1200, -20, 0);
    addPlatform(floor, 'floor');

    const ridge = createStonePlatform({
      width: 2600,
      height: 30,
      depth: 200,
      material: caveDark.clone(),
    });
    ridge.position.set(1200, 20, -520);
    addPlatform(ridge, 'ridge');

    const ridge2 = createStonePlatform({
      width: 2600,
      height: 30,
      depth: 200,
      material: caveDark.clone(),
    });
    ridge2.position.set(1200, 20, 520);
    addPlatform(ridge2, 'ridge');
  }

  function createEntranceGrotto() {
    const start = createStonePlatform({
      width: 220,
      height: 26,
      depth: 200,
      material: caveStone.clone(),
    });
    start.position.set(120, 10, 0);
    addPlatform(start, 'stone');

    const steppingStones = [
      { x: 260, y: 30, z: -60 },
      { x: 360, y: 45, z: 50 },
      { x: 460, y: 65, z: -40 },
    ];

    for (const pos of steppingStones) {
      const stone = createStonePlatform({
        width: 80,
        height: 18,
        depth: 70,
        material: caveStone.clone(),
      });
      stone.position.set(pos.x, pos.y, pos.z);
      addPlatform(stone, 'stone');
    }

    const pillar = createCavePillar(180, 40, caveDark.clone());
    pillar.position.set(260, -20, 180);
    add(pillar);

    const coral = createCoral(CONFIG.coralColors[0]);
    coral.position.set(140, -10, -120);
    add(coral);

    const seaweed = createSeaweed(60);
    seaweed.position.set(200, -10, 120);
    add(seaweed);
  }

  function createPillarHall() {
    const hallPlatforms = [
      { x: 620, y: 40, z: 0 },
      { x: 740, y: 60, z: -100 },
      { x: 880, y: 80, z: 80 },
      { x: 1020, y: 70, z: -40 },
    ];

    for (const pos of hallPlatforms) {
      const platform = createStonePlatform({
        width: 120,
        height: 20,
        depth: 100,
        material: caveStone.clone(),
      });
      platform.position.set(pos.x, pos.y, pos.z);
      addPlatform(platform, 'stone');
    }

    const spinner = createSpinningPlatform({
      width: 140,
      height: 14,
      depth: 140,
      material: goldMaterial.clone(),
    });
    spinner.position.set(900, 120, 160);
    spinner.spinSpeed = 0.5;
    add(spinner);
    state.spinningPlatforms.push(spinner);
    state.platforms.push({ mesh: spinner, type: 'spinning' });

    const moving = createGlassPlatform({
      width: 120,
      height: 14,
      depth: 90,
      material: caveGlass.clone(),
    });
    moving.basePosition = new THREE.Vector3(760, 100, -180);
    moving.position.copy(moving.basePosition);
    moving.moveAxis = 'z';
    moving.moveAmplitude = 160;
    moving.moveSpeed = 0.8;
    add(moving);
    state.movingPlatforms.push(moving);
    state.platforms.push({ mesh: moving, type: 'moving' });

    for (const pos of [
      { x: 640, y: -20, z: -220 },
      { x: 820, y: -20, z: 220 },
      { x: 980, y: -20, z: -220 },
    ]) {
      const stalagmite = createStalagmite(80, 28, caveDark.clone());
      stalagmite.position.set(pos.x, pos.y, pos.z);
      add(stalagmite);
    }

    for (const pos of [
      { x: 700, y: 190, z: -120 },
      { x: 860, y: 210, z: 140 },
      { x: 1000, y: 200, z: -60 },
    ]) {
      const stalactite = createStalactite(90, 26, caveStone.clone());
      stalactite.position.set(pos.x, pos.y, pos.z);
      add(stalactite);
    }
  }

  function createMazeFork() {
    const upperPath = [
      { x: 1180, y: 60, z: 220 },
      { x: 1320, y: 80, z: 260 },
      { x: 1480, y: 80, z: 200 },
    ];

    const lowerPath = [
      { x: 1180, y: 60, z: -220 },
      { x: 1320, y: 80, z: -260 },
      { x: 1480, y: 80, z: -200 },
    ];

    for (const pos of [...upperPath, ...lowerPath]) {
      const platform = createStonePlatform({
        width: 110,
        height: 18,
        depth: 100,
        material: caveStone.clone(),
      });
      platform.position.set(pos.x, pos.y, pos.z);
      addPlatform(platform, 'stone');
    }

    const connector = createStonePlatform({
      width: 200,
      height: 20,
      depth: 120,
      material: caveStone.clone(),
    });
    connector.position.set(1620, 90, 0);
    addPlatform(connector, 'stone');

    const block1 = createQuestionBlock();
    block1.position.set(1320, 140, 260);
    add(block1);
    state.questionBlocks.push(block1);

    const block2 = createQuestionBlock();
    block2.position.set(1320, 140, -260);
    add(block2);
    state.questionBlocks.push(block2);

    const clam1 = createClam();
    clam1.position.set(1400, -5, 320);
    add(clam1);

    const clam2 = createClam();
    clam2.position.set(1400, -5, -320);
    add(clam2);
  }

  function createShipwreckCavern() {
    const platform = createStonePlatform({
      width: 240,
      height: 22,
      depth: 220,
      material: caveStone.clone(),
    });
    platform.position.set(1820, 70, 0);
    addPlatform(platform, 'stone');

    const wreck = createShipwreck();
    wreck.position.set(1960, -5, -60);
    wreck.rotation.y = 0.3;
    add(wreck);

    const coral = createCoral(CONFIG.coralColors[1]);
    coral.position.set(1900, -10, 200);
    add(coral);

    const seaweed = createSeaweed(70);
    seaweed.position.set(2140, -10, -180);
    add(seaweed);
  }

  function createBrownIslands() {
    const islands = [
      { x: 1180, y: 150, z: 240, width: 180, height: 24, depth: 140 },
      { x: 1620, y: 130, z: -260, width: 200, height: 26, depth: 150 },
      { x: 2060, y: 160, z: 200, width: 220, height: 26, depth: 160 },
    ];

    for (const island of islands) {
      const platform = createStonePlatform({
        width: island.width,
        height: island.height,
        depth: island.depth,
        material: caveBrown.clone(),
      });
      platform.position.set(island.x, island.y, island.z);
      addPlatform(platform, 'island');

      const topY = island.y + island.height / 2;

      const rock = createRock({ size: 18, color: 0x4f3a28 });
      rock.position.set(island.x - island.width * 0.18, topY + 6, island.z + island.depth * 0.1);
      add(rock);

      const coral = createCoral(CONFIG.coralColors[2]);
      coral.position.set(island.x + island.width * 0.12, topY + 2, island.z - island.depth * 0.1);
      add(coral);

      const seaweed = createSeaweed(50);
      seaweed.position.set(island.x - island.width * 0.08, topY + 2, island.z - island.depth * 0.2);
      add(seaweed);

      const stalagmite = createStalagmite(60, 20, caveBrown.clone());
      stalagmite.position.set(island.x + island.width * 0.2, topY, island.z + island.depth * 0.15);
      add(stalagmite);
    }

  }

  function createRockScatter() {
    const rocks = [
      { x: 320, y: -8, z: 260, size: 14 },
      { x: 540, y: -6, z: -260, size: 18 },
      { x: 980, y: -5, z: 320, size: 16 },
      { x: 1420, y: -4, z: -340, size: 20 },
      { x: 1880, y: -6, z: 320, size: 16 },
      { x: 2280, y: -6, z: -260, size: 18 },
    ];

    for (const rockData of rocks) {
      const rock = createRock({ size: rockData.size, color: 0x4b3a2a });
      rock.position.set(rockData.x, rockData.y, rockData.z);
      add(rock);
    }
  }

  function addCaveSpikes() {
    const stalagmiteSpots = [
      { x: 1320, y: -20, z: 320 },
      { x: 1560, y: -20, z: -320 },
      { x: 1760, y: -20, z: 260 },
      { x: 2140, y: -20, z: -280 },
    ];

    for (const pos of stalagmiteSpots) {
      const spike = createStalagmite(70, 22, caveDark.clone());
      spike.position.set(pos.x, pos.y, pos.z);
      add(spike);
    }

    const stalactiteSpots = [
      { x: 1200, y: 220, z: 0 },
      { x: 1500, y: 210, z: 220 },
      { x: 1800, y: 230, z: -220 },
      { x: 2100, y: 215, z: 120 },
    ];

    for (const pos of stalactiteSpots) {
      const spike = createStalactite(80, 22, caveStone.clone());
      spike.position.set(pos.x, pos.y, pos.z);
      add(spike);
    }
  }

  function createFishSchools() {
    const schools = [
      { x: 520, y: 120, z: -220, count: 4, radius: 36, speed: 0.7, color: 0xffb347 },
      { x: 980, y: 150, z: 220, count: 5, radius: 42, speed: 0.6, color: 0x6fd3ff },
      { x: 1650, y: 140, z: -120, count: 4, radius: 30, speed: 0.8, color: 0xff8fab },
      { x: 2200, y: 130, z: 180, count: 5, radius: 45, speed: 0.65, color: 0x8ab6ff },
    ];

    for (const school of schools) {
      for (let i = 0; i < school.count; i++) {
        const fish = createFish({ size: 10 + Math.random() * 4, color: school.color });
        fish.position.set(
          school.x + (Math.random() - 0.5) * 30,
          school.y + (Math.random() - 0.5) * 12,
          school.z + (Math.random() - 0.5) * 30
        );
        fish.userData.basePosition = fish.position.clone();
        fish.userData.swimRadius = school.radius + Math.random() * 12;
        fish.userData.swimSpeed = school.speed + Math.random() * 0.3;
        fish.userData.bobAmplitude = 2 + Math.random() * 2;
        fish.userData.swimPhase = Math.random() * Math.PI * 2;
        add(fish);
        state.fish.push(fish);
      }
    }
  }

  function createTreasureChests() {
    const placements = [
      { x: 280, y: 5, z: 200 },
      { x: 860, y: 140, z: -200 },
      { x: 1480, y: 85, z: 300 },
      { x: 2060, y: -5, z: 120 },
      { x: 1620, y: 148, z: -240 },
    ];

    for (const placement of placements) {
      const chest = createTreasureChest();
      chest.position.set(placement.x, placement.y, placement.z);
      add(chest);
      state.treasureChests.push(chest);
    }
  }

  function createEelArena() {
    const arena = createStonePlatform({
      width: 260,
      height: 20,
      depth: 200,
      material: caveStone.clone(),
    });
    arena.position.set(2260, 60, 0);
    addPlatform(arena, 'stone');

    state.eelBoss = createEelBoss({ length: 320, segmentCount: 10, radius: 24 });
    state.eelBoss.position.set(2400, 60, 0);
    state.eelBoss.userData.baseZ = state.eelBoss.position.z;
    add(state.eelBoss);
  }

  function createHazards() {
    const hazardPositions = [
      { x: 520, y: 50, z: -40, patrol: true, patrolDist: 70 },
      { x: 820, y: 90, z: 110, patrol: false },
      { x: 1220, y: 110, z: 220, patrol: true, patrolDist: 60 },
      { x: 1220, y: 110, z: -220, patrol: true, patrolDist: 60 },
      { x: 1840, y: 90, z: 60, patrol: false },
    ];

    for (const hpos of hazardPositions) {
      const hazard = createGoomba();
      hazard.position.set(hpos.x, hpos.y, hpos.z);
      hazard.baseY = hpos.y;
      if (hpos.patrol) {
        hazard.basePosition = new THREE.Vector3(hpos.x, hpos.y, hpos.z);
        hazard.patrolDistance = hpos.patrolDist;
        hazard.patrolSpeed = 1.0;
        hazard.isPatrolling = true;
      }
      add(hazard);
      state.hazards.push(hazard);
    }
  }

  const checkpointData = [
    { id: 'entrance', position: { x: 160, y: 40, z: 0 } },
    { id: 'pillars', position: { x: 820, y: 90, z: 110 } },
    { id: 'maze', position: { x: 1480, y: 90, z: 0 } },
    { id: 'wreck', position: { x: 1860, y: 110, z: 0 } },
    { id: 'eel', position: { x: 2260, y: 90, z: 0 } },
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

  function addCoinRing(center, radius, count, y) {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      state.coinLayout.push({
        position: {
          x: center.x + Math.cos(angle) * radius,
          y,
          z: center.z + Math.sin(angle) * radius,
        },
        radius: 15,
      });
    }
  }

  function addCoinLine(start, step, count, y) {
    for (let i = 0; i < count; i++) {
      state.coinLayout.push({
        position: {
          x: start.x + step.x * i,
          y,
          z: start.z + step.z * i,
        },
        radius: 15,
      });
    }
  }

  function generateCoinLayout() {
    addCoinLine({ x: 140, z: 0 }, { x: 60, z: 0 }, 6, 70);
    addCoinRing({ x: 760, z: -160 }, 60, 8, 120);
    addCoinRing({ x: 760, z: 160 }, 60, 8, 120);
    addCoinLine({ x: 1180, z: 220 }, { x: 80, z: 20 }, 6, 130);
    addCoinLine({ x: 1180, z: -220 }, { x: 80, z: -20 }, 6, 130);
    addCoinRing({ x: 1880, z: 0 }, 70, 10, 110);
    addCoinLine({ x: 2100, z: 140 }, { x: 70, z: -30 }, 6, 120);
  }

  function createBubbleColumns() {
    const placements = [
      { x: 260, y: 40, z: -180, height: 160 },
      { x: 880, y: 60, z: 200, height: 200 },
      { x: 1400, y: 40, z: -320, height: 180 },
      { x: 2000, y: 50, z: 220, height: 200 },
    ];

    for (const placement of placements) {
      const column = createBubbleColumn({ height: placement.height, count: 12 });
      column.position.set(placement.x, placement.y, placement.z);
      add(column);
      state.bubbleColumns.push(column);
    }
  }

  function updateAmbientBubbles(elapsed, delta) {
    for (const column of state.bubbleColumns) {
      advanceBubbleParticles(column, delta);
    }
    for (const fish of state.fish) {
      updateFishSwim(fish, elapsed);
    }
  }

  function createGoal() {
    state.goal = createBox({
      width: CONFIG.goalWidth,
      height: CONFIG.goalHeight,
      depth: CONFIG.goalDepth,
      material: new THREE.MeshStandardMaterial({
        color: 0xf6c453,
        emissive: 0xf6c453,
        emissiveIntensity: 0.3,
      }),
    });
    state.goal.position.set(2500, 120, 0);
    state.goal.size = { width: CONFIG.goalWidth, height: CONFIG.goalHeight, depth: CONFIG.goalDepth };
    state.goal.userData.activeColor = 0xf6c453;
    state.goal.userData.lockedColor = 0x3b4c5a;
    add(state.goal);
  }

  function initWaterVolumes() {
    state.settings.waterVolumes = [
      {
        min: {
          x: state.settings.worldMinX,
          y: state.settings.groundTopY - 40,
          z: state.settings.worldMinZ,
        },
        max: {
          x: state.settings.worldMaxX,
          y: state.settings.worldMaxY,
          z: state.settings.worldMaxZ,
        },
      },
    ];
    state.waterVolumes = state.settings.waterVolumes;
  }

  initWaterVolumes();
  createCaveDome();
  createWaterSurfaces();
  createBaseFloor();
  createEntranceGrotto();
  createPillarHall();
  createMazeFork();
  createShipwreckCavern();
  createBrownIslands();
  createRockScatter();
  addCaveSpikes();
  createFishSchools();
  createTreasureChests();
  createEelArena();
  createHazards();
  createCheckpoints();
  createBubbleColumns();
  generateCoinLayout();
  if (state.settings.goalType !== 'treasure') {
    createGoal();
  }

  state.updateEnvironment = updateAmbientBubbles;

  return state;
}

export function clearCaveLevel(state) {
  for (const object of state.objects) {
    scene.remove(object);
  }
}
