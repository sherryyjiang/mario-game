import { applySceneTheme } from './scene.js';
import { initSkyLevel, clearSkyLevel } from './levels/skyLevel.js';
import { initCaveLevel, clearCaveLevel } from './levels/caveLevel.js';
import { initLavaLevel, clearLavaLevel } from './levels/lavaLevel.js';

const registry = {
  sky: {
    name: 'Sky Castle',
    init: initSkyLevel,
    clear: clearSkyLevel,
  },
  cave: {
    name: 'Underwater Cave',
    init: initCaveLevel,
    clear: clearCaveLevel,
  },
  lava: {
    name: 'Lava Foundry',
    init: initLavaLevel,
    clear: clearLavaLevel,
  },
};

let currentKey = null;
let currentState = null;

export function loadLevel(key) {
  const entry = registry[key] ?? registry.sky;
  if (currentState && currentKey) {
    registry[currentKey].clear(currentState);
  }

  currentKey = key in registry ? key : 'sky';
  currentState = entry.init();
  applySceneTheme(currentState.theme);
  return currentState;
}

export function getLevelList() {
  return Object.entries(registry).map(([id, entry]) => ({ id, name: entry.name }));
}

export function getCurrentLevelKey() {
  return currentKey;
}
