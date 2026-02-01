import * as THREE from 'three';
import { CONFIG } from './config.js';
import { createBox, setShadowFlags, stoneMaterial, stoneDarkMaterial, goldMaterial } from './helpers.js';

export function createTree(style = 'round') {
  const tree = new THREE.Group();

  const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513, roughness: 0.9 });
  const leafMaterial = new THREE.MeshStandardMaterial({ color: 0x228b22, roughness: 0.95 });

  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(8, 12, 60, 8), trunkMaterial);
  trunk.position.y = 30;
  tree.add(trunk);

  if (style === 'tall') {
    const canopy = new THREE.Mesh(new THREE.ConeGeometry(28, 90, 8), leafMaterial);
    canopy.position.y = 110;
    tree.add(canopy);
  } else {
    const canopy1 = new THREE.Mesh(new THREE.SphereGeometry(35, 12, 12), leafMaterial);
    canopy1.position.y = 80;
    tree.add(canopy1);

    const canopy2 = new THREE.Mesh(new THREE.SphereGeometry(25, 12, 12), leafMaterial);
    canopy2.position.set(20, 70, 0);
    tree.add(canopy2);

    const canopy3 = new THREE.Mesh(new THREE.SphereGeometry(25, 12, 12), leafMaterial);
    canopy3.position.set(-15, 75, 10);
    tree.add(canopy3);
  }

  setShadowFlags(tree);
  return tree;
}

export function createPipe(height = 60) {
  const pipe = new THREE.Group();

  const pipeMaterial = new THREE.MeshStandardMaterial({
    color: 0x228b22,
    metalness: 0.3,
    roughness: 0.4,
  });

  const body = new THREE.Mesh(new THREE.CylinderGeometry(25, 25, height, 16), pipeMaterial);
  body.position.y = height / 2;
  pipe.add(body);

  const rim = new THREE.Mesh(new THREE.CylinderGeometry(30, 30, 15, 16), pipeMaterial);
  rim.position.y = height + 7.5;
  pipe.add(rim);

  const opening = new THREE.Mesh(
    new THREE.CylinderGeometry(20, 20, 5, 16),
    new THREE.MeshStandardMaterial({ color: 0x000000 })
  );
  opening.position.y = height + 12;
  pipe.add(opening);

  setShadowFlags(pipe);
  return pipe;
}

export function createQuestionBlock() {
  const block = new THREE.Group();

  const cube = new THREE.Mesh(
    new THREE.BoxGeometry(30, 30, 30),
    new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.2, roughness: 0.5 })
  );
  block.add(cube);

  const mark = new THREE.Mesh(
    new THREE.BoxGeometry(12, 16, 4),
    new THREE.MeshStandardMaterial({ color: 0xffffff })
  );
  mark.position.z = 16;
  block.add(mark);

  block.size = { width: 30, height: 30, depth: 30 };
  block.userData.used = false;
  block.userData.cube = cube;
  block.userData.mark = mark;
  setShadowFlags(block);
  return block;
}

export function animateQuestionBlock(block, time) {
  if (block.userData.baseY == null) {
    block.userData.baseY = block.position.y;
  }

  const baseY = block.userData.baseY;
  const bob = block.userData.used ? 0 : Math.sin(time * 2) * 3;
  const hitOffset = block.userData.hitOffset || 0;
  block.position.y = baseY + bob + hitOffset;
  if (!block.userData.used) {
    block.rotation.y = time * 0.6;
  }
}

export function createBush() {
  const bush = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({ color: 0x32cd32 });

  const positions = [[0, 0, 0], [-15, -5, 5], [15, -5, -5], [0, 10, 0]];
  for (const [x, y, z] of positions) {
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(15, 12, 12), material);
    sphere.position.set(x, y + 15, z);
    bush.add(sphere);
  }

  setShadowFlags(bush);
  return bush;
}

export function createFlower(petalColor = 0xff69b4) {
  const flower = new THREE.Group();

  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(2, 2, 30, 8),
    new THREE.MeshStandardMaterial({ color: 0x228b22 })
  );
  stem.position.y = 15;
  flower.add(stem);

  const center = new THREE.Mesh(
    new THREE.SphereGeometry(6, 8, 8),
    new THREE.MeshStandardMaterial({ color: 0xffff00 })
  );
  center.position.y = 35;
  flower.add(center);

  const petalMaterial = new THREE.MeshStandardMaterial({ color: petalColor });
  for (let i = 0; i < 6; i++) {
    const petal = new THREE.Mesh(new THREE.SphereGeometry(5, 8, 8), petalMaterial);
    const angle = (i / 6) * Math.PI * 2;
    petal.position.set(Math.cos(angle) * 10, 35, Math.sin(angle) * 10);
    flower.add(petal);
  }

  setShadowFlags(flower);
  return flower;
}

export function createCastle() {
  const castle = new THREE.Group();
  
  // Main building
  const mainBuilding = createBox({
    width: 400,
    height: 350,
    depth: 300,
    material: stoneMaterial.clone(),
  });
  mainBuilding.position.set(0, 175, 0);
  castle.add(mainBuilding);
  
  // Roof
  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(250, 150, 4),
    new THREE.MeshStandardMaterial({ color: 0x8b0000 })
  );
  roof.castShadow = true;
  roof.receiveShadow = true;
  roof.position.set(0, 350 + 75, 0);
  roof.rotation.y = Math.PI / 4;
  castle.add(roof);
  
  // Towers
  const towerPositions = [
    { x: -180, z: -130 },
    { x: 180, z: -130 },
    { x: -180, z: 130 },
    { x: 180, z: 130 },
  ];
  
  for (const tpos of towerPositions) {
    const tower = createBox({
      width: 60,
      height: 420,
      depth: 60,
      material: stoneDarkMaterial.clone(),
    });
    tower.position.set(tpos.x, 210, tpos.z);
    castle.add(tower);
    
    const towerRoof = new THREE.Mesh(
      new THREE.ConeGeometry(45, 60, 8),
      new THREE.MeshStandardMaterial({ color: 0x4a0000 })
    );
    towerRoof.castShadow = true;
    towerRoof.receiveShadow = true;
    towerRoof.position.set(tpos.x, 420 + 30, tpos.z);
    castle.add(towerRoof);
  }
  
  // Windows
  const windowMat = new THREE.MeshStandardMaterial({
    color: 0xffeb99,
    emissive: 0xffeb99,
    emissiveIntensity: 0.5,
  });
  
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const windowMesh = createBox({
        width: 30,
        height: 50,
        depth: 10,
        material: windowMat.clone(),
      });
      windowMesh.position.set((col - 1) * 80, 80 + row * 90, -155);
      castle.add(windowMesh);
    }
  }
  
  // Gold banner
  const goldBanner = createBox({
    width: 120,
    height: 40,
    depth: 15,
    material: goldMaterial.clone(),
  });
  goldBanner.position.set(0, 320, -155);
  castle.add(goldBanner);
  
  setShadowFlags(castle);
  return castle;
}

export function createBackgroundCloud(size) {
  const cloud = new THREE.Group();
  const numBalls = 4 + Math.floor(Math.random() * 4);
  
  for (let i = 0; i < numBalls; i++) {
    const radius = size * (0.5 + Math.random() * 0.5);
    const ball = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 8, 6),
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.8,
      })
    );
    ball.castShadow = false;
    ball.receiveShadow = false;
    ball.position.set(
      (Math.random() - 0.5) * size * 2,
      (Math.random() - 0.5) * size * 0.5,
      (Math.random() - 0.5) * size
    );
    cloud.add(ball);
  }
  
  return cloud;
}

export function createBackgroundHills() {
  const hills = new THREE.Group();
  const material = new THREE.MeshBasicMaterial({ color: 0x6b8e23, fog: true });

  const hillPositions = [
    { x: -1000, z: -1500, scale: 3 },
    { x: 500, z: -1800, scale: 4 },
    { x: 2000, z: -1600, scale: 2.5 },
  ];

  for (const { x, z, scale } of hillPositions) {
    const hill = new THREE.Mesh(
      new THREE.SphereGeometry(200 * scale, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2),
      material
    );
    hill.position.set(x, CONFIG.groundTopY - 10, z);
    hills.add(hill);
  }

  return hills;
}

export function createCavePillar(height = 160, radius = 32, materialOverride) {
  const material =
    materialOverride ??
    new THREE.MeshStandardMaterial({ color: CONFIG.stoneDarkColor, roughness: 0.9 });
  const pillar = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.9, radius, height, 10), material);
  pillar.position.y = height / 2;
  pillar.castShadow = true;
  pillar.receiveShadow = true;
  return pillar;
}

export function createStalactite(height = 90, radius = 24, materialOverride) {
  const material =
    materialOverride ??
    new THREE.MeshStandardMaterial({ color: CONFIG.stoneColor, roughness: 0.95 });
  const cone = new THREE.Mesh(new THREE.ConeGeometry(radius, height, 8), material);
  cone.rotation.x = Math.PI;
  cone.position.y = -height / 2;
  cone.castShadow = true;
  cone.receiveShadow = true;
  return cone;
}

export function createStalagmite(height = 70, radius = 20, materialOverride) {
  const material =
    materialOverride ??
    new THREE.MeshStandardMaterial({ color: CONFIG.stoneDarkColor, roughness: 0.95 });
  const cone = new THREE.Mesh(new THREE.ConeGeometry(radius, height, 8), material);
  cone.position.y = height / 2;
  cone.castShadow = true;
  cone.receiveShadow = true;
  return cone;
}

export function createCoral(color) {
  const group = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0.1 });
  const clusterCount = 3 + Math.floor(Math.random() * 3);

  for (let i = 0; i < clusterCount; i++) {
    const bulb = new THREE.Mesh(
      new THREE.SphereGeometry(6 + Math.random() * 6, 10, 8),
      material
    );
    bulb.position.set(
      (Math.random() - 0.5) * 20,
      6 + Math.random() * 12,
      (Math.random() - 0.5) * 20
    );
    group.add(bulb);
  }

  setShadowFlags(group, { receiveShadow: true });
  return group;
}

export function createSeaweed(height = 50) {
  const group = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({ color: 0x2ecc71, roughness: 0.9 });
  const stalkCount = 3 + Math.floor(Math.random() * 3);

  for (let i = 0; i < stalkCount; i++) {
    const stalk = new THREE.Mesh(
      new THREE.CylinderGeometry(2, 3, height, 6),
      material
    );
    stalk.position.set(
      (Math.random() - 0.5) * 14,
      height / 2,
      (Math.random() - 0.5) * 14
    );
    stalk.rotation.z = (Math.random() - 0.5) * 0.4;
    stalk.castShadow = true;
    stalk.receiveShadow = true;
    group.add(stalk);
  }

  return group;
}

export function createRock({ size = 18, color = 0x5b4a3a } = {}) {
  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.95,
    metalness: 0.05,
  });
  const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(size, 0), material);
  rock.scale.set(1.2, 0.8, 1);
  setShadowFlags(rock);
  return rock;
}

export function createFish({ size = 14, color = 0xffa34d } = {}) {
  const group = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.6,
    metalness: 0.2,
  });

  const body = new THREE.Mesh(new THREE.SphereGeometry(size * 0.6, 12, 8), material);
  body.scale.set(1.4, 0.9, 0.8);
  group.add(body);

  const tail = new THREE.Mesh(new THREE.ConeGeometry(size * 0.35, size * 0.8, 8), material);
  tail.position.set(0, 0, -size * 0.85);
  tail.rotation.x = Math.PI;
  group.add(tail);

  const fin = new THREE.Mesh(new THREE.ConeGeometry(size * 0.2, size * 0.5, 6), material);
  fin.position.set(0, size * 0.35, -size * 0.1);
  fin.rotation.z = Math.PI / 2;
  group.add(fin);

  group.userData.swimSpeed = 0.6 + Math.random() * 0.5;
  group.userData.swimRadius = 30 + Math.random() * 30;
  group.userData.swimPhase = Math.random() * Math.PI * 2;
  group.userData.bobAmplitude = 4 + Math.random() * 3;

  setShadowFlags(group);
  return group;
}

export function updateFishSwim(fish, elapsed) {
  if (!fish?.userData?.basePosition) return;

  const base = fish.userData.basePosition;
  const speed = fish.userData.swimSpeed ?? 0.6;
  const radius = fish.userData.swimRadius ?? 30;
  const phase = fish.userData.swimPhase ?? 0;
  const bob = fish.userData.bobAmplitude ?? 4;
  const t = elapsed * speed + phase;

  fish.position.x = base.x + Math.cos(t) * radius;
  fish.position.z = base.z + Math.sin(t) * radius;
  fish.position.y = base.y + Math.sin(t * 1.5) * bob;

  const dirX = -Math.sin(t);
  const dirZ = Math.cos(t);
  fish.rotation.y = Math.atan2(dirX, dirZ);
}

export function createTreasureChest() {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x7a4a2b, roughness: 0.8 });
  const trimMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.4, metalness: 0.6 });

  const base = new THREE.Mesh(new THREE.BoxGeometry(40, 20, 24), bodyMat);
  base.position.y = 10;
  group.add(base);

  const lid = new THREE.Mesh(new THREE.CylinderGeometry(12, 12, 40, 10, 1, false, 0, Math.PI), bodyMat);
  lid.rotation.z = Math.PI / 2;
  lid.position.y = 25;
  group.add(lid);

  const trim = new THREE.Mesh(new THREE.BoxGeometry(42, 4, 26), trimMat);
  trim.position.y = 18;
  group.add(trim);

  setShadowFlags(group);
  return group;
}

export function createClam() {
  const group = new THREE.Group();
  const shellMat = new THREE.MeshStandardMaterial({ color: 0x9fc7d6, roughness: 0.85 });
  const top = new THREE.Mesh(new THREE.SphereGeometry(14, 12, 8), shellMat);
  top.scale.set(1.3, 0.6, 1);
  top.position.y = 6;
  group.add(top);

  const bottom = top.clone();
  bottom.position.y = 0;
  bottom.rotation.x = Math.PI;
  group.add(bottom);

  setShadowFlags(group);
  return group;
}

export function createShipwreck() {
  const group = new THREE.Group();
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x5c3a20, roughness: 0.9 });
  const hull = new THREE.Mesh(new THREE.BoxGeometry(140, 30, 60), woodMat);
  hull.position.y = 15;
  hull.rotation.z = -0.08;
  group.add(hull);

  const mast = new THREE.Mesh(new THREE.CylinderGeometry(4, 6, 110, 8), woodMat);
  mast.position.set(-30, 70, 0);
  mast.rotation.z = 0.15;
  group.add(mast);

  const broken = new THREE.Mesh(new THREE.BoxGeometry(50, 12, 40), woodMat);
  broken.position.set(50, 10, 0);
  broken.rotation.y = 0.4;
  group.add(broken);

  setShadowFlags(group);
  return group;
}

export function createBubbleColumn({ radius = 4, height = 140, count = 10 } = {}) {
  const group = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({
    color: 0xd9f4ff,
    transparent: true,
    opacity: 0.6,
    roughness: 0.2,
  });
  const bubbles = [];

  for (let i = 0; i < count; i++) {
    const bubble = new THREE.Mesh(
      new THREE.SphereGeometry(radius * (0.6 + Math.random() * 0.6), 8, 6),
      material
    );
    bubble.position.set(
      (Math.random() - 0.5) * radius * 2,
      (Math.random() - 0.5) * height,
      (Math.random() - 0.5) * radius * 2
    );
    bubble.userData.speed = 0.3 + Math.random() * 0.4;
    bubble.userData.resetY = -height / 2;
    bubbles.push(bubble);
    group.add(bubble);
  }

  group.userData.height = height;
  group.userData.minY = -height / 2;
  group.userData.maxY = height / 2;
  group.userData.bubbles = bubbles;
  setShadowFlags(group, { castShadow: false, receiveShadow: false });
  return group;
}

export function createBubbleEmitter({ radius = 3, height = 24, count = 6 } = {}) {
  const group = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({
    color: 0xd9f4ff,
    transparent: true,
    opacity: 0.7,
    roughness: 0.2,
  });
  const bubbles = [];

  for (let i = 0; i < count; i++) {
    const bubble = new THREE.Mesh(
      new THREE.SphereGeometry(radius * (0.5 + Math.random() * 0.5), 8, 6),
      material
    );
    bubble.position.set(
      (Math.random() - 0.5) * radius * 2,
      Math.random() * height,
      (Math.random() - 0.5) * radius * 2
    );
    bubble.userData.speed = 0.4 + Math.random() * 0.5;
    bubbles.push(bubble);
    group.add(bubble);
  }

  group.userData.minY = 0;
  group.userData.maxY = height;
  group.userData.bubbles = bubbles;
  setShadowFlags(group, { castShadow: false, receiveShadow: false });
  return group;
}

export function advanceBubbleParticles(group, delta = 1) {
  const bubbles = group?.userData?.bubbles;
  if (!bubbles || bubbles.length === 0) return;

  const minY = group.userData.minY ?? 0;
  const maxY = group.userData.maxY ?? group.userData.height ?? 0;
  const step = Number.isFinite(delta) ? delta * 60 : 1;

  for (const bubble of bubbles) {
    bubble.position.y += (bubble.userData.speed ?? 0) * step;
    if (bubble.position.y > maxY) {
      bubble.position.y = minY;
    }
  }
}
