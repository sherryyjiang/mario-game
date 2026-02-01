import * as THREE from 'three';
import { BloomEffect, EffectComposer, EffectPass, FXAAEffect, RenderPass } from 'postprocessing';
import { CONFIG } from './config.js';

// Create gradient sky background
function createSkyGradient({ topColor, bottomColor, endColor } = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = 2;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 0, 512);
  const top = new THREE.Color(topColor ?? CONFIG.skyTopColor).getStyle();
  const bottom = new THREE.Color(bottomColor ?? CONFIG.skyBottomColor).getStyle();
  const end = new THREE.Color(endColor ?? CONFIG.skyBottomColor).getStyle();
  gradient.addColorStop(0, top);
  gradient.addColorStop(0.6, bottom);
  gradient.addColorStop(1, end);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 2, 512);
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

// Scene setup
export const scene = new THREE.Scene();
scene.fog = new THREE.Fog(CONFIG.fogColor, 500, 3000);
scene.background = createSkyGradient();

// Camera
const aspect = CONFIG.viewWidth / CONFIG.viewHeight;
export const camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 5000);
camera.position.set(200, 300, 400);

// Renderer
export const renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.setSize(CONFIG.viewWidth, CONFIG.viewHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

renderer.domElement.style.touchAction = 'none';
renderer.domElement.addEventListener('contextmenu', (e) => e.preventDefault());

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
scene.add(ambientLight);

const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x8b4513, 0.4);
scene.add(hemiLight);

const sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
sunLight.position.set(200, 400, 200);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 2048;
sunLight.shadow.mapSize.height = 2048;
sunLight.shadow.camera.near = 100;
sunLight.shadow.camera.far = 1500;
sunLight.shadow.camera.left = -800;
sunLight.shadow.camera.right = 800;
sunLight.shadow.camera.top = 800;
sunLight.shadow.camera.bottom = -800;
scene.add(sunLight);

const secondaryLight = new THREE.DirectionalLight(0xffeedd, 0.25);
secondaryLight.position.set(-300, 400, -200);
scene.add(secondaryLight);

export function applySceneTheme(theme = {}) {
  scene.fog.color.set(theme.fogColor ?? CONFIG.fogColor);
  scene.fog.near = theme.fogNear ?? scene.fog.near;
  scene.fog.far = theme.fogFar ?? scene.fog.far;
  scene.background = createSkyGradient({
    topColor: theme.skyTopColor ?? CONFIG.skyTopColor,
    bottomColor: theme.skyBottomColor ?? CONFIG.skyBottomColor,
    endColor: theme.skyEndColor ?? theme.skyBottomColor ?? CONFIG.skyBottomColor,
  });

  ambientLight.color.set(theme.ambientColor ?? 0xffffff);
  ambientLight.intensity = theme.ambientIntensity ?? ambientLight.intensity;
  hemiLight.color.set(theme.hemiSkyColor ?? hemiLight.color.getHex());
  hemiLight.groundColor.set(theme.hemiGroundColor ?? hemiLight.groundColor.getHex());
  hemiLight.intensity = theme.hemiIntensity ?? hemiLight.intensity;
  sunLight.color.set(theme.sunColor ?? sunLight.color.getHex());
  sunLight.intensity = theme.sunIntensity ?? sunLight.intensity;
  if (theme.sunPosition) {
    sunLight.position.copy(theme.sunPosition);
  }
  secondaryLight.color.set(theme.secondaryColor ?? secondaryLight.color.getHex());
  secondaryLight.intensity = theme.secondaryIntensity ?? secondaryLight.intensity;
  if (theme.secondaryPosition) {
    secondaryLight.position.copy(theme.secondaryPosition);
  }
}

// Post-processing
export const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const bloomEffect = new BloomEffect({
  intensity: 0.5,
  luminanceThreshold: 0.8,
  luminanceSmoothing: 0.3,
});

const fxaaEffect = new FXAAEffect();
const effectPass = new EffectPass(camera, bloomEffect, fxaaEffect);
effectPass.renderToScreen = true;
composer.addPass(effectPass);

// Update post-processing size
composer.setSize(CONFIG.viewWidth, CONFIG.viewHeight);
