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

  setShadowFlags(block);
  return block;
}

export function animateQuestionBlock(block, time) {
  if (block.userData.baseY == null) {
    block.userData.baseY = block.position.y;
  }

  const baseY = block.userData.baseY;
  block.position.y = baseY + Math.sin(time * 2) * 3;
  block.rotation.y = time * 0.6;
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
